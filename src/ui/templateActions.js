// Actions for editing the workout template (WORKOUT tab, edit mode). app.js merges these into its action table,
// passing in what it owns so this file has no globals.

import { SESSIONS, getSessions, setTemplate } from '../logic/template.js';
import { activeSessionId } from '../logic/workout.js';
import { addExercise, updateExercise, removeExercise, addSession, renameSession, removeSession } from '../logic/templateEdit.js';

export function createTemplateActions({ state, saveTemplate, clearTemplate, saveFail, today }) {
  const sessionId = () => activeSessionId(state.wSession, today(), state.planDays);
  const readForm = () => ({
    name: document.getElementById('te-name')?.value,
    mode: document.getElementById('te-mode')?.value,
    perSide: Boolean(document.getElementById('te-side')?.checked),
    warmup: document.getElementById('te-warm')?.value,
    target: document.getElementById('te-target')?.value,
  });
  const close = () => { state.tEdit = null; state.tDraft = null; };

  // Save first, then switch the live template, so a failed save never leaves the screen and the database apart.
  async function commit(sessions, msg) {
    try { await saveTemplate(sessions); } catch (err) { state.msg = saveFail(err); return false; }
    setTemplate(sessions);
    state.msg = msg;
    return true;
  }

  const nameInput = () => document.getElementById('ts-name')?.value;
  // Apply a session change from templateEdit.js: save it, then make `next` the picked session (id of the new one by default).
  async function sessionOp(r, msg, next = r.id) {
    if (r.error) { state.msg = r.error; return; }
    if (await commit(r.sessions, msg)) { state.wSession = next ?? null; close(); }
  }

  return {
    toggleManage: () => { state.wManage = !state.wManage; state.wHistory = false; close(); state.msg = ''; },

    // Session actions read the name box in the SESSIONS panel. A new or copied session becomes the active one.
    sAdd: () => sessionOp(addSession(getSessions(), nameInput()), 'Session added.'),
    sCopy: () => sessionOp(addSession(getSessions(), nameInput(), sessionId()), 'Session copied.'),
    sRename: () => sessionOp(renameSession(getSessions(), sessionId(), nameInput()), 'Session renamed.', sessionId()),
    sDelete: async () => {
      const s = getSessions().find((x) => x.id === sessionId());
      if (!s) return;
      if (!window.confirm(`Delete ${s.name}? Sets you already logged stay in your log.`)) return;
      await sessionOp(removeSession(getSessions(), s.id), `Deleted ${s.name}.`, null);
    },

    tAdd: () => { state.tEdit = { mode: 'add' }; state.tDraft = null; state.msg = ''; },

    // From an exercise panel: open edit mode with that exercise's form already open.
    tEditHere: (el) => { state.wManage = true; state.wHistory = false; state.tEdit = { mode: 'edit', i: Number(el.dataset.i) }; state.tDraft = null; state.msg = ''; window.scrollTo(0, 0); },

    tEditStart: (el) => { state.tEdit = { mode: 'edit', i: Number(el.dataset.i) }; state.tDraft = null; state.msg = ''; },

    tCancel: () => { close(); state.msg = ''; },

    tSave: async () => {
      const fields = readForm();
      const ed = state.tEdit;
      if (!ed) return;
      const r = ed.mode === 'edit'
        ? updateExercise(getSessions(), sessionId(), ed.i, fields)
        : addExercise(getSessions(), sessionId(), fields);
      if (r.error) { state.msg = r.error; state.tDraft = fields; return; }
      if (await commit(r.sessions, `Saved ${fields.name.trim()}.`)) close();
    },

    tDelete: async (el) => {
      const i = Number(el.dataset.i);
      const ex = getSessions().find((s) => s.id === sessionId())?.exercises[i];
      if (!ex) return;
      if (!window.confirm(`Remove ${ex.name} from this session? Sets you already logged stay in your log.`)) return;
      const r = removeExercise(getSessions(), sessionId(), i);
      if (r.error) { state.msg = r.error; return; }
      if (await commit(r.sessions, `Removed ${ex.name}.`)) close();
    },

    tReset: async () => {
      if (!window.confirm('Reset every session to the built-in plan? Your added and edited exercises are removed. Logged sets stay.')) return;
      try { await clearTemplate(); } catch (err) { state.msg = saveFail(err); return; }
      setTemplate(SESSIONS);
      close();
      state.msg = 'Back to the built-in plan.';
    },
  };
}
