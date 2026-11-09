import { isDirty, buildExport } from '../logic/exportBuilder.js';
import { markExported, planWipe } from '../logic/wipeEligibility.js';
import { toDateString, logicalDate } from '../logic/dates.js';
import { addHabit, toggleCheck, isChecked } from '../logic/habits.js';
import { computeStats, emptyStats, streakWithStats } from '../logic/retainedStats.js';
import { renderBackupPanel, backupActions } from './backupPanel.js';
import { getConfig, isConnected, disconnect, startAuth, finishAuthIfRedirected, upload } from '../dropbox/dropbox.js';
import { loadAll, putEntries, wipeWithStats, confirmExportRecord, putHabit, deleteHabit } from '../db/store.js';

const DAY_MS = 24 * 3600 * 1000;
const WIPE_TEXT = (n, range) =>
  `Wipe permanently deletes ${n} entries (${range ? `${range.from} to ${range.to}` : 'none'}) from this phone. ` +
  'Open the file in Dropbox first and confirm it is there. This cannot be undone.';

const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `e${Date.now()}${Math.random().toString(16).slice(2)}`);
const makeEntry = (type, date, data, updatedAt) => ({
  id: newId(), type, date, data, updatedAt, exportedAt: null, exportId: null, deletedAt: null,
});

function demoEntries() {
  const now = Date.now();
  const out = [];
  for (let i = 12; i >= 1; i -= 1) {
    const ts = now - i * DAY_MS;
    const date = toDateString(ts);
    out.push(makeEntry('weigh_in', date, { weight_lb: +(184 - i * 0.15).toFixed(1) }, ts));
    out.push(makeEntry('guitar', date, { minutes: 15 + (i % 3) * 10, focus: 'technique', best_bpm: 90 + i }, ts));
    out.push(makeEntry('habit_check', date, { habit: 'Water', done: i % 2 === 0 }, ts));
  }
  return out;
}

const state = {
  tab: 'today',
  entries: [],
  habits: [], // [{ id, name }]
  stats: null, // retained_stats record kept across wipes (best streaks, anchors, last sets, weigh-ins)
  keepDays: 7,
  dayStartHour: 4,
  exportedNames: [],
  // flow.step: idle | built | shared | confirmed
  flow: { step: 'idle', result: null, viaDownload: false },
  wipeTick: false,
  storageOk: true, // false when IndexedDB is unavailable; entries then live in memory only
  persisted: null, // true/false once the browser answers
  msg: '',
};

const $app = document.getElementById('app');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const waiting = () => state.entries.filter(isDirty).length;
const wipeOpts = () => ({ now: Date.now(), keepDays: state.keepDays, dayStartHour: state.dayStartHour });
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
  tab: (el) => { state.tab = el.dataset.tab; state.msg = ''; },

  setKeep: (el) => { state.keepDays = Number(el.value); state.wipeTick = false; },

  logWeighIn: async () => {
    const w = Number(inputValue('wt'));
    if (!(w >= 50 && w <= 600)) { state.msg = 'Enter a weight between 50 and 600.'; return; }
    const now = Date.now();
    const e = makeEntry('weigh_in', toDateString(now - state.dayStartHour * 3600 * 1000), { weight_lb: w }, now);
    try { await saveEntries([e]); } catch (e) { state.msg = saveFail(e); return; }
    state.entries.push(e);
    state.msg = `Saved ${w} lb.`;
  },

  logGuitar: async () => {
    const m = Number(inputValue('gm'));
    if (!(Number.isInteger(m) && m >= 1 && m <= 600)) { state.msg = 'Enter whole minutes, 1 to 600.'; return; }
    const now = Date.now();
    const e = makeEntry('guitar', toDateString(now - state.dayStartHour * 3600 * 1000), { minutes: m, focus: 'practice', best_bpm: null }, now);
    try { await saveEntries([e]); } catch (e) { state.msg = saveFail(e); return; }
    state.entries.push(e);
    state.msg = `Saved ${m} min of guitar.`;
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
    const demo = demoEntries();
    try { await saveEntries(demo); } catch (e) { state.msg = saveFail(e); return; }
    state.entries.push(...demo);
    state.msg = 'Loaded 12 days of demo data.';
  },

  editOld: async () => {
    // Test helper: edit the oldest entry that was already exported.
    const e = state.entries.filter((x) => x.exportedAt != null).sort((a, b) => a.date.localeCompare(b.date))[0];
    if (!e) { state.msg = 'No exported entry to edit yet.'; return; }
    const edited = { ...e, updatedAt: Date.now() };
    try { await saveEntries([edited]); } catch (e) { state.msg = saveFail(e); return; }
    state.entries = state.entries.map((x) => (x.id === e.id ? edited : x));
    state.msg = `Edited ${e.date}. It is waiting again and will not be wiped.`;
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
    const plan = planWipe(state.entries, state.flow.result.manifest, wipeOpts());
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
const label = (e) => {
  if (e.type === 'weigh_in') return `${e.data.weight_lb} lb`;
  if (e.type === 'guitar') return `Guitar ${e.data.minutes} min`;
  return `${e.data.habit} ${e.data.done ? 'done' : 'missed'}`;
};

function storageLine() {
  if (!state.storageOk) return 'Storage unavailable. Entries are lost when you close this page.';
  if (state.persisted === true) return 'Storage protected.';
  if (state.persisted === false) return 'Storage not protected. Export weekly, and add this app to your Home Screen.';
  return '';
}

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

function todayView() {
  const recent = [...state.entries].sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt - a.updatedAt).slice(0, 8);
  const rows = recent.map((e) =>
    `<div class="row"><span>${esc(e.date.slice(5))} ${esc(label(e))}</span>` +
    `<span class="tag ${isDirty(e) ? 'waiting' : 'done'}">${isDirty(e) ? 'WAITING' : 'EXPORTED'}</span></div>`).join('');
  return `
    <div class="panel">
      <h2>WAITING TO EXPORT</h2>
      <div class="big">${waiting()}</div>
      <p>${waiting() ? 'These entries are on this phone only.' : 'Everything is exported.'}</p>
      <p>${esc(storageLine())}</p>
    </div>
    ${habitsPanel()}
    <div class="panel">
      <h2>LOG</h2>
      <input id="wt" class="field" type="number" inputmode="decimal" step="0.1" placeholder="Weight (lb)">
      <button class="btn" data-action="logWeighIn">SAVE WEIGH-IN</button>
      <input id="gm" class="field" type="number" inputmode="numeric" step="1" placeholder="Guitar minutes" style="margin-top:8px">
      <button class="btn" data-action="logGuitar">SAVE GUITAR</button>
    </div>
    <div class="panel">
      <h2>LATEST</h2>${rows || '<p>No entries yet.</p>'}
      ${state.entries.length === 0 ? '<button class="btn secondary" data-action="demo">LOAD DEMO DATA</button>' : ''}
      <button class="btn secondary" data-action="editOld">EDIT AN EXPORTED ENTRY</button>
    </div>`;
}

function dropboxBlock() {
  if (isConnected()) {
    return `<button class="btn" data-action="upload">UPLOAD TO DROPBOX</button>
      <p>Goes to ${esc(getConfig().folder)}/</p>
      <button class="btn secondary" data-action="disconnect">DISCONNECT DROPBOX</button>`;
  }
  return `<p>Connect once to upload straight to your vault.</p>
    <input id="appKey" class="field" placeholder="Dropbox app key" value="${esc(getConfig().appKey || '')}" autocomplete="off">
    <button class="btn" data-action="connect">CONNECT DROPBOX</button>`;
}

function exportView() {
  const { step, result, viaDownload } = state.flow;
  const n = waiting();
  let body = '';
  if (step === 'idle') {
    body = `<p>${n} entries waiting.</p><button class="btn" data-action="build" ${n ? '' : 'disabled'}>EXPORT</button>`;
  } else if (step === 'built') {
    body = `<p>File: <b>${esc(result.filename)}</b><br>${result.manifest.items.length} entries, ${esc(result.manifest.range.from)} to ${esc(result.manifest.range.to)}</p>
      ${dropboxBlock()}
      <button class="btn ${isConnected() ? 'secondary' : ''}" data-action="share">SAVE VIA SHARE SHEET</button>
      <button class="btn secondary" data-action="confirmNo">CANCEL</button>
      <pre>${esc(result.markdown)}</pre>`;
  } else if (step === 'shared') {
    body = `<p>${viaDownload ? 'The file was downloaded. The app cannot tell where it went.' : 'The share sheet closed.'}</p>
      <p><b>Is ${esc(result.filename)} in Dropbox?</b></p>
      <button class="btn" data-action="confirmYes">YES, IT IS</button>
      <button class="btn secondary" data-action="confirmNo">NO</button>`;
  } else {
    body = `<p>Confirmed: ${esc(result.filename)}. Go to WIPE when you are ready.</p>
      <button class="btn secondary" data-tab="wipe" data-action="tab">GO TO WIPE</button>`;
  }
  return `<div class="panel"><h2>EXPORT</h2>${body}</div>${renderBackupPanel(state)}`;
}

function wipeView() {
  const { step, result } = state.flow;
  const keep = `<p>Keep the last <select data-action="setKeep" aria-label="Keep days">
      ${[0, 3, 7, 14].map((d) => `<option value="${d}" ${d === state.keepDays ? 'selected' : ''}>${d}</option>`).join('')}
    </select> days on this phone.</p>`;
  if (step !== 'confirmed') {
    return `<div class="panel"><h2>WIPE</h2>${keep}
      <p>Wipe is off until you export and confirm the file is in Dropbox.</p>
      <button class="btn danger" disabled>WIPE !!</button></div>`;
  }
  const plan = planWipe(state.entries, result.manifest, wipeOpts());
  const ready = state.wipeTick && plan.count > 0;
  return `<div class="panel"><h2>WIPE</h2>${keep}
    <div class="warn">${esc(WIPE_TEXT(plan.count, plan.range))}</div>
    <label class="check"><input type="checkbox" data-action="tick" ${state.wipeTick ? 'checked' : ''}>
      <span>I opened the file in Dropbox and it is complete</span></label>
    <button class="btn danger" data-action="wipe" ${ready ? '' : 'disabled'}>WIPE ${plan.count} !!</button>
    ${plan.count === 0 ? '<p>Nothing is old enough to wipe yet.</p>' : ''}</div>`;
}

function render() {
  const views = { today: todayView, export: exportView, wipe: wipeView };
  const tabs = ['today', 'export', 'wipe'].map((t) =>
    `<button class="tab" data-action="tab" data-tab="${t}" ${state.tab === t ? 'aria-current="page"' : ''}>${t.toUpperCase()}</button>`).join('');
  $app.innerHTML = `<h1>LIFE LOG</h1><nav>${tabs}</nav>
    ${state.msg ? `<div class="msg">${esc(state.msg)}</div>` : ''}${views[state.tab]()}`;
}

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
