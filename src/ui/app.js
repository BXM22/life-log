import { buildExport } from '../logic/exportBuilder.js';
import { mergeRecords, recordsMarkdown } from '../logic/records.js';
import { markExported, planWipe } from '../logic/wipeEligibility.js';
import { logicalDate } from '../logic/dates.js';
import { addHabit, toggleCheck, toggleRestDay, starterHabits } from '../logic/habits.js';
import { computeStats, emptyStats } from '../logic/retainedStats.js';
import { newEntry as makeEntry, parseWeight, parseEdit, editEntry, deleteEntry } from '../logic/entries.js';
import { demoEntries } from '../logic/demo.js';
import { loadAutoSync, saveAutoSync } from '../logic/autoSync.js';
import { loadAreas, saveAreas } from '../logic/areas.js';
import { createLearnActions } from './learnActions.js';
import { createAutoSync, createSyncNow } from './autoSync.js';
import { syncChipHtml } from './syncChip.js';
import { createManageHabitsActions } from './manageHabitsActions.js';
import { loadSettings, saveSettings, normalizeSettings, isSeeded, markSeeded } from '../logic/settings.js';
import { applyTheme, watchSystemTheme } from '../logic/theme.js';
import { installKind } from '../logic/install.js';
import { esc, label } from './format.js';
import { icon } from './icons.js';
import { historyView } from './historyView.js';
import { prBanner } from './progressView.js';
import { lastExportAt, loadReminderEnabled, saveReminderEnabled, maybeNotify, requestNotifyPermission } from '../logic/exportReminder.js';
import { settingsView } from './settingsView.js';
import { workoutView } from './workoutView.js';
import { expireSessionPick } from '../logic/workout.js';
import { todayView } from './todayView.js';
import { createWorkoutActions } from './workoutActions.js';
import { createWorkoutNavActions, captureDraft } from './workoutNavActions.js';
import { createWorkoutSheetActions } from './workoutSheetActions.js';
import { createWorkoutHistoryActions } from './workoutHistoryActions.js';
import { createActivityActions } from './activityActions.js';
import { createLibraryActions, autofillForm } from './libraryActions.js';
import { createWorkoutExtrasActions } from './workoutExtrasActions.js';
import { createTemplateActions } from './templateActions.js';
import { createTemplateTagsActions } from './templateTagsActions.js';
import { createPlatesActions } from './platesActions.js';
import { createRestActions } from './restActions.js';
import { createMealActions } from './mealActions.js';
import { createNotesActions } from './notesActions.js';
import { updateNoteCount } from './notesView.js';
import { createPracticeActions } from './practiceActions.js';
import { createTodayActions } from './todayActions.js';
import { createTodayWinActions } from './todayWinActions.js';
import { positionWheels, restPage } from './restView.js';
import { loadRest } from '../logic/rest.js';
import { setTemplate } from '../logic/template.js';
import { normalizeTemplate } from '../logic/templateEdit.js';
import { exportView, wipeView, wipeOpts } from './exportWipeView.js';
import { backupActions } from './backupPanel.js';
import { createSyncActions } from './syncActions.js';
import { getConfig, disconnect, startAuth, finishAuthIfRedirected, upload } from '../dropbox/dropbox.js';
import { loadAll, putEntries, wipeWithStats, confirmExportRecord, putHabit, deleteHabit, saveTemplate, clearTemplate } from '../db/store.js';

const settings = (() => { try { return loadSettings(localStorage); } catch { return normalizeSettings(null); } })();
const persistSettings = () => {
  try { saveSettings(localStorage, { keepDays: state.keepDays, dayStartHour: state.dayStartHour, planDays: state.planDays, theme: state.theme }); } catch { /* storage blocked */ }
};
let stopThemeWatch = () => {};
const syncTheme = () => {
  applyTheme(state.theme);
  stopThemeWatch();
  stopThemeWatch = watchSystemTheme(state.theme, () => applyTheme(state.theme));
};
// Bottom tab bar: five top-level screens. Export and Wipe share the Sync tab and switch with a segmented control.
const NAV = [['today', 'TODAY'], ['workout', 'WORKOUT'], ['history', 'HISTORY'], ['export', 'SYNC'], ['settings', 'SETTINGS']];
const TITLES = { today: 'TODAY', workout: 'WORKOUT', history: 'HISTORY', export: 'SYNC', wipe: 'SYNC', settings: 'SETTINGS' };
const navGroup = (t) => (t === 'wipe' ? 'export' : t);

const state = {
  tab: 'today',
  restOpen: false, // the full rest timer page is showing (Workout tab)
  entries: [],
  habits: [], // [{ id, name }]
  stats: null, // retained_stats record kept across wipes (best streaks, anchors, last sets, weigh-ins)
  keepDays: settings.keepDays,
  dayStartHour: settings.dayStartHour,
  planDays: settings.planDays, // 3 or 4 lifting days a week, see logic/template.js scheduleFor
  theme: settings.theme, // system | light | dark — see logic/theme.js
  editId: null, // id of the entry being edited on the History tab
  histWin: null, // History own window: null | 'lifts' | 'entries'
  histLift: null, // lift shown in the Lift progress window
  exOpen: {}, // exercise panels expanded on the Workout tab, by exercise name
  wSession: null, // workout session picked on the Workout tab (null = today's)
  rest: (() => { try { return loadRest(localStorage, Date.now()); } catch { return loadRest({ getItem: () => null }, Date.now()); } })(), // rest timer, see logic/rest.js
  wHistory: false, // Workout tab showing past workouts
  tEdit: null, // exercise form open: { mode: 'add' } or { mode: 'edit', i }
  tDraft: null, // form values kept when a save is refused
  installEvent: null, // the browser's deferred install prompt, when it offers one
  installKind: 'other',
  storageLine: '',
  exportedNames: [],
  exportReminder: (() => { try { return loadReminderEnabled(localStorage); } catch { return true; } })(), // F33
  autoSync: (() => { try { return loadAutoSync(localStorage); } catch { return true; } })(), // upload finished days to Dropbox on open
  areas: (() => { try { return loadAreas(localStorage); } catch { return loadAreas({ getItem: () => null }); } })(), // Learn areas, see logic/areas.js
  lastExportAt: null, // newest confirmed export, null if never
  // flow.step: idle | built | shared | confirmed
  flow: { step: 'idle', result: null, viaDownload: false },
  wipeTick: false,
  storageOk: true, // false when IndexedDB is unavailable; entries then live in memory only
  persisted: null, // true/false once the browser answers
  msg: '',
};

const $app = document.getElementById('app');
const resetFlow = () => { state.flow = { step: 'idle', result: null, viaDownload: false }; state.wipeTick = false; state.syncModal = null; };
const inputValue = (id) => document.getElementById(id)?.value ?? '';
const today = () => logicalDate(Date.now(), state.dayStartHour);

// Save first, then update the screen state, so a failed save never leaves the two out of step.
const saveEntries = async (entries) => { if (state.storageOk) await putEntries(entries); };
const SAVE_FAIL = 'Could not save to this phone. Nothing changed.';
const saveFail = (e) => `${SAVE_FAIL} (${e && e.name}: ${e && e.message})`;

// Mark an export confirmed and record it. Used by both the upload and the manual YES path.
async function stampExport(result) {
  const stamped = markExported(state.entries, result.manifest, Date.now());
  const record = { filename: result.filename, exportId: result.manifest.exportId, confirmedAt: Date.now() };
  if (state.storageOk) await confirmExportRecord(stamped, record);
  state.entries = stamped;
  state.exportedNames.push(result.filename);
  state.lastExportAt = record.confirmedAt;
}
async function confirmExport(result, how) {
  await stampExport(result);
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
const rest = createRestActions({ state, onChange: () => render() });
const persistAreas = () => { try { saveAreas(localStorage, state.areas); } catch { /* storage blocked */ } };
const practice = createPracticeActions({ state, saveEntries, saveFail, inputValue, today });
const actions = {
  ...createWorkoutActions({ state, saveEntries, saveFail, inputValue, today, onWorkingSet: rest.startIfAuto }),
  ...createWorkoutNavActions({ state, today }),
  ...createWorkoutSheetActions({ state, today }),
  ...createWorkoutHistoryActions({ state }),
  ...createActivityActions({ state, saveEntries, saveFail, inputValue, today }),
  ...createLibraryActions({ state, today }),
  ...createWorkoutExtrasActions({ state, today }),
  ...createTemplateTagsActions({ state, saveFail, saveTemplate: async (s) => { if (state.storageOk) await saveTemplate(s); } }),
  ...createPlatesActions({ state, inputValue }),
  ...rest.actions,
  ...createSyncActions({ state, onChange: () => render() }),
  ...practice.actions,
  ...createTodayActions({ state, saveEntries, saveFail, inputValue, today, persistAreas }),
  ...createManageHabitsActions({ state }),
  ...createLearnActions({ state, saveEntries, saveFail, inputValue, today, persistAreas }),
  syncNow: () => syncNow(),
  ...createTodayWinActions({ state }),
  ...createMealActions({ state, saveEntries, saveFail, inputValue, today }),
  ...createNotesActions({ state, saveEntries, saveFail, inputValue, today, download, onChange: () => render() }),
  ...createTemplateActions({
    state, saveFail, today,
    saveTemplate: async (s) => { if (state.storageOk) await saveTemplate(s); },
    clearTemplate: async () => { if (state.storageOk) await clearTemplate(); },
  }),

  tab: (el) => { expireSessionPick(state); state.tab = el.dataset.tab; state.msg = ''; state.editId = null; state.histWin = null; state.syncModal = null; state.wipeTick = false; state.restOpen = false; state.todayWin = null; state.manageHabits = false; state.wEx = null; state.wDraft = {}; state.wSheet = null; state.wAct = null; state.wActForm = null; state.wMenu = null; state.plates = null; state.tWin = false; state.libWin = false; state.libEdit = null; state.tScreen = null; state.tplDraft = null; state.tEdit = null; state.wHistory = false; window.scrollTo(0, 0); },

  dismissMsg: () => { state.msg = ''; },

  // Undo the set that was just logged (tap the toast). Removes it like DEL and returns to that exercise.
  undoSet: async () => {
    const u = state.undo;
    state.undo = null;
    const e = u && state.entries.find((x) => x.id === u.id);
    if (!e || e.deletedAt) { state.msg = ''; return; }
    const gone = deleteEntry(e, Date.now());
    try { await saveEntries([gone]); } catch (err) { state.msg = saveFail(err); return; }
    state.entries = state.entries.map((x) => (x.id === e.id ? gone : x));
    state.pr = null;
    if (state.tab === 'workout' && u.i != null) { state.wEx = u.i; state.wMore = null; }
    state.msg = 'Set removed.';
  },
  dismissPR: () => { state.pr = null; },

  setKeep: (el) => { state.keepDays = Number(el.value); state.wipeTick = false; persistSettings(); },

  setDayStart: (el) => { state.dayStartHour = Number(el.value); persistSettings(); },

  setTheme: (el) => { state.theme = el.value; persistSettings(); syncTheme(); },

  setExportReminder: async (el) => {
    state.exportReminder = el.checked;
    try { saveReminderEnabled(localStorage, el.checked); } catch { /* storage blocked */ }
    if (el.checked) await requestNotifyPermission();
  },

  setAutoSync: (el) => {
    state.autoSync = el.checked;
    try { saveAutoSync(localStorage, el.checked); } catch { /* storage blocked */ }
    if (el.checked) autoSync.run();
  },

  toggleEx: (el) => { const n = el.dataset.name; state.exOpen[n] = !(state.exOpen[n] === true); },
  setPlanDays: (el) => { state.planDays = Number(el.value); state.wSession = null; persistSettings(); },

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
    state.weighEdit = false; // F68: back to the saved row
    state.msg = `Saved ${r.value} lb.`;
  },

  openHistWin: (el) => { state.histWin = el.dataset.win; state.editId = null; window.scrollTo(0, 0); },
  closeHistWin: () => { state.histWin = null; state.editId = null; window.scrollTo(0, 0); },
  pickLift: (el) => { state.histLift = el.dataset.lift; },

  startEdit: (el) => { state.editId = el.dataset.id; state.msg = ''; },

  cancelEdit: () => { state.editId = null; },

  saveEdit: async (el) => {
    const e = state.entries.find((x) => x.id === el.dataset.id);
    if (!e) return;
    const r = parseEdit(e, {
      weight: inputValue('ed-w'), minutes: inputValue('ed-m'), focus: inputValue('ed-f'), bpm: inputValue('ed-b'),
      reps: inputValue('ed-r'), seconds: inputValue('ed-s'),
      mealType: inputValue('ed-mt'), name: inputValue('ed-mn'), protein: inputValue('ed-mp'), title: inputValue('ed-nt'), body: inputValue('ed-nb'),
      sessionType: inputValue('ed-st'), sessionMinutes: inputValue('ed-sm'), metric: inputValue('ed-sx'), sessionFocus: inputValue('ed-sf'), notes: inputValue('ed-sn'),
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

  toggleRestDay: async () => {
    const habit = state.habits.find((h) => h.id === 'workout');
    if (!habit) return;
    const e = toggleRestDay(state.entries, habit, today(), Date.now());
    if (!e) return;
    try { await saveEntries([e]); } catch (err) { state.msg = saveFail(err); return; }
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
    const result = buildExport(state.entries, { now: Date.now(), existingFilenames: state.exportedNames, recordsMd: recordsMarkdown(mergeRecords(state.stats?.records, state.entries)) });
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
      state.lastExportAt = lastExportAt(r.merged.exports);
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

function header() {
  const d = new Date(`${today()}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const kicker = state.tab === 'today'
    ? new Date(`${today()}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : `LIFE LOG · ${d.toUpperCase()}`;
  return `<header class="top"><span class="kicker">${esc(kicker)}</span><h1>${TITLES[state.tab]}</h1>${state.tab === 'today' ? syncChipHtml(state) : ''}</header>`;
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
  const undo = state.undo && state.undo.msg === state.msg ? state.undo : null; // only while the message that offered it is showing
  const page = state.tab === 'workout' && state.restOpen ? restPage(state) : `${(state.tab === 'history' && state.histWin) || (state.tab === 'workout' && !state.tScreen && !state.tWin && !state.libWin && !state.wHistory) ? '' : header()}${segmented()}${prBanner(state)}${views[state.tab](state)}`;
  $app.innerHTML = `${page}
    ${state.msg ? `<button class="toast" data-action="${undo ? 'undoSet' : 'dismissMsg'}" role="status">${esc(state.msg)}${undo ? ' <b class="toast-undo">UNDO</b>' : ''}</button>` : ''}
    <nav class="tabbar" aria-label="Main">${tabs}</nav>`;
  if (state.tab === 'workout' && state.restOpen) positionWheels(state);
  clearTimeout(toastTimer);
  if (state.msg && (state.msg.length < 60 || undo)) toastTimer = setTimeout(() => { state.msg = ''; state.undo = null; $app.querySelector('.toast')?.remove(); }, 6000);
}
let toastTimer = 0;

async function dispatch(el) {
  const fn = actions[el.dataset.action];
  if (!fn) return;
  await fn(el);
  captureDraft(state); // keep typed weight/reps on the open Exercise page across the re-render
  render();
}

$app.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-action]');
  if (!el || el.disabled || el.tagName === 'SELECT' || el.tagName === 'INPUT') return;
  dispatch(el);
});
// Escape closes the open dropdown first, then the open sheet (Workout v2).
document.addEventListener('keydown', (ev) => {
  if (ev.key !== 'Escape') return;
  if (state.wMenu) { actions.wMenuClose(); render(); } else if (state.wSheet) { actions.wSheetClose(); render(); }
});
$app.addEventListener('scroll', rest.onScroll, true); // the rest-time wheels scroll without a re-render
document.addEventListener('visibilitychange', () => { if (!document.hidden) rest.resume(); });
// Picking a saved exercise name fills the rest of the form in place (no re-render, so nothing typed is lost).
$app.addEventListener('input', (ev) => { if (ev.target.id === 'note-body') updateNoteCount(); }); // F68: live note count, no re-render
// F67: History search filters as you type; re-render, then put the cursor back so typing is not interrupted.
$app.addEventListener('input', async (ev) => {
  if (ev.target.id !== 'w-hist-search' && ev.target.id !== 'lib-search') return;
  const pos = ev.target.selectionStart;
  await dispatch(ev.target);
  const box = document.getElementById(ev.target.id);
  if (box) { box.focus(); box.setSelectionRange(pos, pos); }
});
$app.addEventListener('change', (ev) => { if (ev.target.matches?.('input[data-libfill]')) autofillForm(state, ev.target); });
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

const autoSync = createAutoSync({ state, render, today, stamp: stampExport });
const { syncNow } = createSyncNow({ state, render, stamp: stampExport });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') autoSync.run(); });

// ---- boot ----
syncTheme(); // before first paint from the module (inline head script already reduced FOUC)
async function boot() {
  try {
    const saved = await loadAll();
    state.entries = saved.entries;
    state.habits = (saved.habits || []).sort((a, b) => a.name.localeCompare(b.name));
    state.exportedNames = saved.exports.map((x) => x.filename);
    state.lastExportAt = lastExportAt(saved.exports);
    state.stats = saved.stats || null;
    setTemplate(normalizeTemplate(saved.template)); // null keeps the built-in plan
  } catch {
    state.storageOk = false;
    state.msg = 'Storage is unavailable here, so entries will not be saved.';
  }
  await seedStarterHabits();
  try { maybeNotify({ enabled: state.exportReminder, lastAt: state.lastExportAt, storage: localStorage }); } catch { /* optional */ }
  try {
    if (navigator.storage?.persist) await navigator.storage.persist();
    if (navigator.storage?.persisted) state.persisted = await navigator.storage.persisted();
  } catch { /* the browser may refuse; the banner then says not protected */ }
  render();
  rest.resume();
  practice.resume();
  autoSync.run();

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
