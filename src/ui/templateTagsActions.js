// Actions for template tags, the Active switch and the templates window (F42). app.js merges these into its action table.
// Opening the edit screen also makes that template the picked session, so the exercise actions in
// templateActions.js (tAdd, tEditStart, tSave, tDelete) work on it unchanged.

import { getSessions, setTemplate } from '../logic/template.js';
import { addSession, removeSession, renameSession } from '../logic/templateEdit.js';
import { activeSessionId } from '../logic/workout.js';
import { logicalDate } from '../logic/dates.js';
import { normalizeTags, setActive, setTags, tagsOf } from '../logic/templateTags.js';

export function createTemplateTagsActions({ state, saveTemplate, saveFail }) {
  state.tWin = false; // templates window open
  state.tFilter = ''; // tag filter in the window
  state.tScreen = null; // id of the template on the edit screen
  state.tplDraft = null; // { name, tags } typed on the edit screen but not saved yet
  state.tAcc = { new: false, name: false, ex: true, more: true }; // accordion open state (state, not <details>, so render() keeps it)

  const current = () => getSessions().find((s) => s.id === state.tScreen);
  const id = (el) => el.dataset.id;

  // Save first, then switch the live template, so a failed save never leaves the screen and the database apart.
  async function commit(sessions, msg) {
    try { await saveTemplate(sessions); } catch (err) { state.msg = saveFail(err); return false; }
    setTemplate(sessions);
    state.msg = msg;
    return true;
  }

  // Keep what was typed in the name box when a tag button re-renders the screen.
  function syncDraft() {
    const s = current();
    if (!s) return null;
    const name = document.getElementById('tp-name')?.value;
    state.tplDraft = { name: name ?? state.tplDraft?.name ?? s.name, tags: state.tplDraft?.tags ?? tagsOf(s) };
    return state.tplDraft;
  }

  // Make a template the stored active one (shared by tplActive, tplPick, tplSetActiveHome). Returns true on success.
  async function activate(sid) {
    const r = setActive(getSessions(), sid);
    if (r.error) { state.msg = r.error; return false; }
    return commit(r.sessions, `${getSessions().find((s) => s.id === sid)?.name ?? 'Template'} is now the active template.`);
  }

  const closeWin = () => { state.tWin = false; state.wSession = null; state.tScreen = null; state.tplDraft = null; state.tEdit = null; state.msg = ''; };

  // Create a template from the NEW TEMPLATE box: empty (copyOf null) or a copy of the active one, then open it to edit.
  async function createTemplate(copyOf, msg) {
    const r = addSession(getSessions(), document.getElementById('tn-name')?.value, copyOf);
    if (r.error) { state.msg = r.error; return; }
    if (await commit(r.sessions, msg)) { state.tScreen = r.id; state.wSession = r.id; state.tplDraft = null; state.tEdit = null; window.scrollTo(0, 0); }
  }

  return {
    tplOpenWin: () => { state.tWin = true; state.wManage = false; state.wHistory = false; state.tEdit = null; state.msg = ''; window.scrollTo(0, 0); },
    tplCloseWin: closeWin,
    tplNewBlank: () => createTemplate(null, 'Blank template created. Add exercises below.'),
    tplNewCopy: () => createTemplate(activeSessionId(null, logicalDate(Date.now(), state.dayStartHour), state.planDays), 'Template copied.'),
    tplFilter: (el) => { state.tFilter = el.dataset.tag || ''; },

    tplActive: async (el) => { await activate(id(el)); },
    // Switch sheet row: set active, drop the in-memory session override and close the sheet.
    tplPick: async (el) => { if (await activate(id(el))) { state.wSession = null; state.wSheet = null; } },
    // Templates page "Set active": set active and go back to Today.
    tplSetActiveHome: async (el) => { if (await activate(id(el))) closeWin(); },
    tplAcc: (el) => {
      if (state.tScreen) syncDraft(); // keep a typed name when the accordion re-renders
      const k = el.dataset.k;
      if (k in state.tAcc) state.tAcc[k] = !state.tAcc[k];
    },

    tplOpen: (el) => {
      state.tScreen = id(el); state.wSession = id(el); state.tplDraft = null; state.tEdit = null; state.msg = '';
      window.scrollTo(0, 0);
    },
    tplBack: () => { state.tScreen = null; state.wSession = null; state.tplDraft = null; state.tEdit = null; state.msg = ''; },

    tplToggleTag: (el) => {
      const d = syncDraft();
      if (!d) return;
      d.tags = d.tags.includes(el.dataset.tag) ? d.tags.filter((t) => t !== el.dataset.tag) : normalizeTags([...d.tags, el.dataset.tag]);
    },

    tplAddTag: () => {
      const d = syncDraft();
      if (!d) return;
      const box = document.getElementById('tp-tag');
      const next = normalizeTags([...d.tags, box?.value]);
      if (next.length === d.tags.length && String(box?.value ?? '').trim()) state.msg = 'Tag already added, or the limit of 6 is reached.';
      d.tags = next;
    },

    tplSave: async () => {
      const d = syncDraft();
      if (!d) return;
      const renamed = renameSession(getSessions(), state.tScreen, d.name);
      if (renamed.error) { state.msg = renamed.error; return; }
      const r = setTags(renamed.sessions, state.tScreen, d.tags);
      if (await commit(r.sessions, 'Template saved.')) state.tplDraft = null;
    },

    tplSetActive: async () => {
      const r = setActive(getSessions(), state.tScreen);
      if (r.error) { state.msg = r.error; return; }
      await commit(r.sessions, `${current()?.name ?? 'Template'} is now the active template.`);
    },

    tplDelete: async () => {
      const s = current();
      if (!s) return;
      if (!window.confirm(`Delete ${s.name}? Sets you already logged stay in your log.`)) return;
      const r = removeSession(getSessions(), s.id);
      if (r.error) { state.msg = r.error; return; }
      if (await commit(r.sessions, `Deleted ${s.name}.`)) { state.tScreen = null; state.tplDraft = null; state.tEdit = null; state.wSession = null; }
    },
  };
}
