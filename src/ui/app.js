import { isDirty, buildExport } from '../logic/exportBuilder.js';
import { markExported, planWipe } from '../logic/wipeEligibility.js';
import { logicalDate } from '../logic/dates.js';
import { addHabit, toggleCheck, isChecked, starterHabits } from '../logic/habits.js';
import { computeStats, emptyStats, streakWithStats } from '../logic/retainedStats.js';
import { newEntry as makeEntry, parseWeight, parseGuitar, parseEdit, editEntry, deleteEntry, liveEntries } from '../logic/entries.js';
import { demoEntries } from '../logic/demo.js';
import { sessionForDate } from '../logic/workout.js';
import { sessionById } from '../logic/template.js';
import { loadSettings, saveSettings, normalizeSettings, isSeeded, markSeeded } from '../logic/settings.js';
import { installKind } from '../logic/install.js';
import { esc, label } from './format.js';
import { icon } from './icons.js';
import { historyView } from './historyView.js';
import { settingsView } from './settingsView.js';
import { workoutView } from './workoutView.js';
import { createWorkoutActions } from './workoutActions.js';
import { exportView, wipeView, waiting, wipeOpts } from './exportWipeView.js';
import { backupActions } from './backupPanel.js';
import { getConfig, disconnect, startAuth, finishAuthIfRedirected, upload } from '../dropbox/dropbox.js';
import { loadAll, putEntries, wipeWithStats, confirmExportRecord, putHabit, deleteHabit } from '../db/store.js';

const settings = (() => { try { return loadSettings(localStorage); } catch { return normalizeSettings(null); } })();
const persistSettings = () => {
  try { saveSettings(localStorage, { keepDays: state.keepDays, dayStartHour: state.dayStartHour }); } catch { /* storage blocked */ }
};
// Bottom tab bar: five top-level screens. Export and Wipe share the Sync tab and switch with a segmented control.
const NAV = [['today', 'TODAY'], ['workout', 'WORKOUT'], ['history', 'HISTORY'], ['export', 'SYNC'], ['settings', 'SETTINGS']];
const TITLES = { today: 'TODAY', workout: 'WORKOUT', history: 'HISTORY', export: 'SYNC', wipe: 'SYNC', settings: 'SETTINGS' };
const navGroup = (t) => (t === 'wipe' ? 'export' : t);

const state = {
  tab: 'today',
  entries: [],
  habits: [], // [{ id, name }]
  stats: null, // retained_stats record kept across wipes (best streaks, anchors, last sets, weigh-ins)
  keepDays: settings.keepDays,
  dayStartHour: settings.dayStartHour,
  editId: null, // id of the entry being edited on the History tab
  wSession: null, // workout session picked on the Workout tab (null = today's)
  installEvent: null, // the browser's deferred install prompt, when it offers one
  installKind: 'other',
  storageLine: '',
  exportedNames: [],
  // flow.step: idle | built | shared | confirmed
  flow: { step: 'idle', result: null, viaDownload: false },
  wipeTick: false,
  storageOk: true, // false when IndexedDB is unavailable; entries then live in memory only
  persisted: null, // true/false once the browser answers
  msg: '',
};

const $app = document.getElementById('app');
const resetFlow = () => { state.flow = { step: 'idle', result: null, viaDownload: false }; state.wipeTick = false; };
const inputValue = (id) => document.getElementById(id)?.value ?? '';
const today = () => logicalDate(Date.now(), state.dayStartHour);

// Save first, then update the screen state, so a failed save never leaves the two out of step.
const saveEntries = async (entries) => { if (state.storageOk) await putEntries(entries); };
const SAVE_FAIL = 'Could not save to this phone. Nothing changed.';
const saveFail = (e) => `${SAVE_FAIL} (${e && e.name}: ${e && e.message})`;

// Mark an export confirmed and record it. Used by both the upload and the manual YES path.
async function confirmExport(result, how) {
  const stamped = markExported(state.entries, result.manifest, Date.now());
  const record = { filename: result.filename, exportId: result.manifest.exportId, confirmedAt: Date.now() };
  if (state.storageOk) await confirmExportRecord(stamped, record);
  state.entries = stamped;
  state.exportedNames.push(result.filename);
  state.flow.step = 'confirmed';
  state.msg = how;
}

function download(file) {
  const url = URL.createObjectURL(file);
  const a = Object.assign(document.createElement('a'), { href: url, download: file.name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---- actions ----
const actions = {
  ...createWorkoutActions({ state, saveEntries, saveFail, inputValue, today }),

  tab: (el) => { state.tab = el.dataset.tab; state.msg = ''; state.editId = null; window.scrollTo(0, 0); },

  dismissMsg: () => { state.msg = ''; },

  setKeep: (el) => { state.keepDays = Number(el.value); state.wipeTick = false; persistSettings(); },

  setDayStart: (el) => { state.dayStartHour = Number(el.value); persistSettings(); },

  install: async () => {
    const ev = state.installEvent;
    if (!ev) return;
    state.installEvent = null;
    try { await ev.prompt(); } catch { /* the browser may refuse a second prompt */ }
  },

  logWeighIn: async () => {
    const r = parseWeight(inputValue('wt'));
    if (r.error) { state.msg = r.error; return; }
    const now = Date.now();
    const e = makeEntry('weigh_in', today(), { weight_lb: r.value }, now);
    try { await saveEntries([e]); } catch (err) { state.msg = saveFail(err); return; }
    state.entries.push(e);
    state.msg = `Saved ${r.value} lb.`;
  },

  logGuitar: async () => {
    const r = parseGuitar({ minutes: inputValue('gm'), focus: inputValue('gf'), bpm: inputValue('gb') });
    if (r.error) { state.msg = r.error; return; }
    const e = makeEntry('guitar', today(), r.data, Date.now());
    try { await saveEntries([e]); } catch (err) { state.msg = saveFail(err); return; }
    state.entries.push(e);
    state.msg = `Saved ${r.data.minutes} min of guitar.`;
  },

  startEdit: (el) => { state.editId = el.dataset.id; state.msg = ''; },

  cancelEdit: () => { state.editId = null; },

  saveEdit: async (el) => {
    const e = state.entries.find((x) => x.id === el.dataset.id);
    if (!e) return;
    const r = parseEdit(e, {
      weight: inputValue('ed-w'), minutes: inputValue('ed-m'), focus: inputValue('ed-f'), bpm: inputValue('ed-b'),
      reps: inputValue('ed-r'), seconds: inputValue('ed-s'),
      done: document.getElementById('ed-d')?.checked,
    });
    if (r.error) { state.msg = r.error; return; }
    const edited = editEntry(e, r.data, Date.now());
    try { await saveEntries([edited]); } catch (err) { state.msg = saveFail(err); return; }
    state.entries = state.entries.map((x) => (x.id === e.id ? edited : x));
    state.editId = null;
    state.msg = `Saved. ${e.date} is waiting to export again.`;
  },

  deleteEntry: async (el) => {
    const e = state.entries.find((x) => x.id === el.dataset.id);
    if (!e) return;
    const kept = e.exportedAt != null ? ' It is already in your Dropbox export; that copy stays.' : '';
    if (!window.confirm(`Delete ${label(e)} on ${e.date}?${kept}`)) return;
    const gone = deleteEntry(e, Date.now());
    try { await saveEntries([gone]); } catch (err) { state.msg = saveFail(err); return; }
    state.entries = state.entries.map((x) => (x.id === e.id ? gone : x));
    state.msg = 'Deleted.';
  },

  addHabit: async () => {
    const r = addHabit(state.habits, inputValue('habitName'));
    if (r.error) { state.msg = r.error; return; }
    try { if (state.storageOk) await putHabit(r.habit); } catch (e) { state.msg = saveFail(e); return; }
    state.habits = r.habits;
    state.msg = `Added ${r.habit.name}.`;
  },

  deleteHabit: async (el) => {
    const habit = state.habits.find((h) => h.id === el.dataset.habit);
    if (!habit) return;
    if (!window.confirm(`Remove ${habit.name} from the list? Past check-ins stay in your log.`)) return;
    try { if (state.storageOk) await deleteHabit(habit.id); } catch (e) { state.msg = saveFail(e); return; }
    state.habits = state.habits.filter((h) => h.id !== habit.id);
    state.msg = `Removed ${habit.name}.`;
  },

  toggleHabit: async (el) => {
    const habit = state.habits.find((h) => h.id === el.dataset.habit);
    if (!habit) return;
    const e = toggleCheck(state.entries, habit, today(), Date.now());
    try { await saveEntries([e]); } catch (e) { state.msg = saveFail(e); return; }
    const i = state.entries.findIndex((x) => x.id === e.id);
    if (i >= 0) state.entries[i] = e; else state.entries.push(e);
    state.msg = '';
  },

  demo: async () => {
    const demo = demoEntries(Date.now());
    try { await saveEntries(demo); } catch (e) { state.msg = saveFail(e); return; }
    state.entries.push(...demo);
    state.msg = 'Loaded 12 days of demo data.';
  },

  build: () => {
    const result = buildExport(state.entries, { now: Date.now(), existingFilenames: state.exportedNames });
    if (!result) { state.msg = 'Nothing to export.'; return; }
    state.flow = { step: 'built', result, viaDownload: false };
    state.wipeTick = false;
    state.msg = '';
  },

  share: async () => {
    const { filename, markdown } = state.flow.result;
    const file = new File([markdown], filename, { type: 'text/markdown' });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: filename });
        state.flow.viaDownload = false;
      } else {
        download(file);
        state.flow.viaDownload = true;
      }
      state.flow.step = 'shared';
      state.msg = '';
    } catch (err) {
      if (err && err.name === 'AbortError') {
        state.msg = 'Share cancelled. Nothing changed.';
        return;
      }
      // Share is unavailable or blocked here (common on desktop or plain http). Fall back to a download.
      try {
        download(file);
        state.flow.viaDownload = true;
        state.flow.step = 'shared';
        state.msg = `Share unavailable (${err && err.name}: ${err && err.message}). Downloaded the file instead.`;
      } catch (dlErr) {
        state.msg = `Share and download both failed (${err && err.name}; ${dlErr && dlErr.name}). Nothing changed.`;
      }
    }
  },

  connect: async () => {
    try {
      await startAuth(inputValue('appKey'));
    } catch (err) {
      state.msg = err.message;
    }
  },

  disconnect: () => { disconnect(); state.msg = 'Disconnected from Dropbox.'; },

  // Direct upload. Dropbox reports size and hash, so a verified upload confirms the export itself.
  upload: async () => {
    const { result } = state.flow;
    state.msg = 'Uploading to Dropbox...';
    render();
    let path;
    try {
      const res = await upload(result.filename, result.markdown, getConfig().folder);
      path = res.path;
      if (!res.verified) {
        state.msg = `Uploaded ${path}, but Dropbox's size or hash did not match. Not confirmed. Check the file, then use the share sheet or try again.`;
        return;
      }
    } catch (err) {
      state.msg = err.message || 'Upload failed. Nothing changed.';
      return;
    }
    try {
      await confirmExport(result, `Uploaded and verified: ${path}. Wipe is now available.`);
    } catch {
      state.msg = `Uploaded ${path}, but saving the confirmation failed. Nothing was marked exported. Do not export again today: the file already exists.`;
    }
  },

  confirmYes: async () => {
    try {
      await confirmExport(state.flow.result, 'Export confirmed. Wipe is now available.');
    } catch {
      state.msg = SAVE_FAIL;
    }
  },

  confirmNo: () => {
    resetFlow();
    state.msg = 'Not confirmed. Nothing was marked exported and nothing will be wiped.';
  },

  tick: (el) => { state.wipeTick = el.checked; },

  backup: async () => { state.msg = await backupActions.backup(state); },

  restore: async () => {
    const r = await backupActions.restore(state);
    state.msg = r.msg;
    if (r.merged) {
      state.entries = r.merged.entries;
      state.habits = r.merged.habits.sort((a, b) => a.name.localeCompare(b.name));
      state.exportedNames = r.merged.exports.map((x) => x.filename);
    }
  },

  wipe: async () => {
    const plan = planWipe(state.entries, state.flow.result.manifest, wipeOpts(state));
    if (plan.count === 0) return;
    if (state.keepDays === 0 && !window.confirm(`Keep window is 0. This wipes ALL ${plan.count} exported entries, including today. Continue?`)) return;
    // Compute the facts that must outlive these entries BEFORE deleting, from every entry we hold.
    const stats = computeStats(state.entries, state.stats || emptyStats(), Date.now());
    try {
      // One transaction writes the stats and deletes the entries, all or nothing.
      if (state.storageOk) await wipeWithStats(plan.ids, stats);
    } catch {
      state.msg = 'Wipe failed. Nothing was deleted.';
      return;
    }
    state.stats = stats;
    const gone = new Set(plan.ids);
    state.entries = state.entries.filter((e) => !gone.has(e.id));
    resetFlow();
    state.msg = `Wiped ${plan.count} entries.`;
  },
};

// ---- views ----
function storageLine() {
  if (!state.storageOk) return 'Storage unavailable. Entries are lost when you close this page.';
  if (state.persisted === true) return 'Storage protected.';
  if (state.persisted === false) return 'Storage not protected. Export weekly, and add this app to your Home Screen.';
  return '';
}

const standalone = () => Boolean(navigator.standalone || window.matchMedia?.('(display-mode: standalone)').matches);
const refreshInstall = () => {
  state.installKind = installKind({
    userAgent: navigator.userAgent, standalone: standalone(), canPrompt: Boolean(state.installEvent), maxTouchPoints: navigator.maxTouchPoints || 0,
  });
};

function habitsPanel() {
  const day = today();
  const rows = state.habits.map((h) => {
    const streak = streakWithStats(state.entries, h.name, day, state.stats);
    return `<div class="habit">
      <label class="check"><input type="checkbox" data-action="toggleHabit" data-habit="${esc(h.id)}" ${isChecked(state.entries, h, day) ? 'checked' : ''}>
        <span>${esc(h.name)}${streak ? ` <span class="streak">${streak}d</span>` : ''}</span></label>
      <button class="btn secondary habit-del" data-action="deleteHabit" data-habit="${esc(h.id)}" aria-label="Remove ${esc(h.name)}">X</button>
    </div>`;
  }).join('');
  return `<div class="panel">
    <h2>HABITS ${esc(day.slice(5))}</h2>
    ${rows || '<p>No habits yet. Add one below.</p>'}
    <input id="habitName" class="field" maxlength="40" placeholder="New habit" autocomplete="off">
    <button class="btn" data-action="addHabit">ADD HABIT</button>
  </div>`;
}

function sessionPanel() {
  const id = sessionForDate(today());
  const s = id && sessionById(id);
  return `<div class="panel"><h2>TODAY'S SESSION</h2>
    <p>${s ? `${esc(s.name)}: ${esc(s.focus)}` : 'No lifting scheduled. BJJ, rest or a walk.'}</p>
    <button class="btn" data-tab="workout" data-action="tab">${s ? 'START WORKOUT' : 'PICK A WORKOUT'}</button></div>`;
}

function todayView() {
  const recent = liveEntries(state.entries).sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt - a.updatedAt).slice(0, 8);
  const rows = recent.map((e) =>
    `<div class="row"><span>${esc(e.date.slice(5))} ${esc(label(e))}</span>` +
    `<span class="tag ${isDirty(e) ? 'waiting' : 'done'}">${isDirty(e) ? 'WAITING' : 'EXPORTED'}</span></div>`).join('');
  const day = today();
  const done = state.habits.filter((h) => isChecked(state.entries, h, day)).length;
  const total = state.habits.length;
  const cells = state.habits.map((h) => `<i class="${isChecked(state.entries, h, day) ? 'on' : ''}"></i>`).join('');
  const n = waiting(state);
  const note = storageLine();
  return `
    <div class="panel hero">
      <div class="big">${done}/${total}</div>
      <p>habits done today</p>
      <div class="pips" aria-hidden="true">${cells}</div>
    </div>
    <button class="rowbtn" data-action="tab" data-tab="export">
      <span>${n ? `${n} waiting to export` : 'Everything exported'}</span><span class="chev" aria-hidden="true">&gt;</span>
    </button>
    ${note ? `<p class="note">${esc(note)}</p>` : ''}
    ${habitsPanel()}
    ${sessionPanel()}
    <div class="panel">
      <h2>WEIGH-IN</h2>
      <div class="inline">
        <input id="wt" class="field" type="number" inputmode="decimal" step="0.1" placeholder="Weight (lb)" aria-label="Weight in pounds">
        <button class="btn" data-action="logWeighIn">SAVE</button>
      </div>
    </div>
    <div class="panel">
      <h2>GUITAR</h2>
      <div class="inline">
        <input id="gm" class="field" type="number" inputmode="numeric" step="1" placeholder="Minutes" aria-label="Guitar minutes">
        <input id="gb" class="field" type="number" inputmode="numeric" step="1" placeholder="Best BPM" aria-label="Best BPM, optional">
      </div>
      <input id="gf" class="field" maxlength="40" list="focuses" placeholder="Focus (optional)" aria-label="Focus, optional" autocomplete="off">
      <datalist id="focuses"><option value="technique"><option value="songs"><option value="theory"><option value="improvisation"></datalist>
      <button class="btn" data-action="logGuitar">SAVE GUITAR</button>
    </div>
    <div class="panel">
      <h2>LATEST</h2>${rows || '<p>No entries yet.</p>'}
      ${state.entries.length === 0 ? '<button class="btn secondary" data-action="demo">LOAD DEMO DATA</button>' : ''}
      <button class="btn secondary" data-tab="history" data-action="tab">EDIT OR DELETE ENTRIES</button>
    </div>`;
}

function header() {
  const d = new Date(`${today()}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  return `<header class="top"><span class="kicker">LIFE LOG &middot; ${esc(d.toUpperCase())}</span><h1>${TITLES[state.tab]}</h1></header>`;
}

function segmented() {
  if (navGroup(state.tab) !== 'export') return '';
  const b = (t, text) => `<button data-action="tab" data-tab="${t}" ${state.tab === t ? 'aria-current="page"' : ''}>${text}</button>`;
  return `<div class="seg">${b('export', 'EXPORT')}${b('wipe', 'WIPE')}</div>`;
}

function render() {
  state.storageLine = storageLine();
  refreshInstall();
  const views = { today: todayView, workout: workoutView, history: historyView, export: exportView, wipe: wipeView, settings: settingsView };
  const tabs = NAV.map(([t, text]) =>
    `<button class="tab" data-action="tab" data-tab="${t}" ${navGroup(state.tab) === t ? 'aria-current="page"' : ''}>${icon(t)}<span>${text}</span></button>`).join('');
  $app.innerHTML = `${header()}${segmented()}${views[state.tab](state)}
    ${state.msg ? `<button class="toast" data-action="dismissMsg" role="status">${esc(state.msg)}</button>` : ''}
    <nav class="tabbar" aria-label="Main">${tabs}</nav>`;
  clearTimeout(toastTimer);
  if (state.msg && state.msg.length < 60) toastTimer = setTimeout(() => { state.msg = ''; $app.querySelector('.toast')?.remove(); }, 4500);
}
let toastTimer = 0;

async function dispatch(el) {
  const fn = actions[el.dataset.action];
  if (!fn) return;
  await fn(el);
  render();
}

$app.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-action]');
  if (!el || el.disabled || el.tagName === 'SELECT' || el.tagName === 'INPUT') return;
  dispatch(el);
});
$app.addEventListener('change', (ev) => {
  const el = ev.target.closest('[data-action]');
  if (el && (el.tagName === 'SELECT' || el.type === 'checkbox')) dispatch(el);
});

// The browser offers its install dialog through this event (Chrome and Android; Safari never fires it).
window.addEventListener('beforeinstallprompt', (ev) => { ev.preventDefault(); state.installEvent = ev; render(); });
window.addEventListener('appinstalled', () => { state.installEvent = null; render(); });

// First run on this device: add Guitar, Coding and Workout once. Deleting them later does not bring them back.
async function seedStarterHabits() {
  let seeded = true;
  try { seeded = isSeeded(localStorage); } catch { /* storage blocked: skip seeding */ }
  if (seeded) return;
  if (!state.habits.length) {
    const starters = starterHabits();
    try { if (state.storageOk) for (const h of starters) await putHabit(h); } catch { return; }
    state.habits = starters.sort((a, b) => a.name.localeCompare(b.name));
  }
  try { markSeeded(localStorage); } catch { /* storage blocked */ }
}

// ---- boot ----
async function boot() {
  try {
    const saved = await loadAll();
    state.entries = saved.entries;
    state.habits = (saved.habits || []).sort((a, b) => a.name.localeCompare(b.name));
    state.exportedNames = saved.exports.map((x) => x.filename);
    state.stats = saved.stats || null;
  } catch {
    state.storageOk = false;
    state.msg = 'Storage is unavailable here, so entries will not be saved.';
  }
  await seedStarterHabits();
  try {
    if (navigator.storage?.persist) await navigator.storage.persist();
    if (navigator.storage?.persisted) state.persisted = await navigator.storage.persisted();
  } catch { /* the browser may refuse; the banner then says not protected */ }
  render();

  // Back from the Dropbox sign-in page: finish connecting and open the Export tab.
  try {
    if (await finishAuthIfRedirected()) {
      state.tab = 'export';
      state.msg = 'Connected to Dropbox.';
      render();
    }
  } catch (err) {
    state.tab = 'export';
    state.msg = err.message;
    render();
  }
}

boot();
