// Actions for the TODAY extras: quick add sheet (F36), custom study subjects (F41) and collapsible
// sections (F43). app.js merges these into its action table. State used: state.quick, state.sections,
// state.studySubjects (loaded lazily from localStorage by subjectsOf).

import { buildQuickEntry, QUICK_FIELDS } from '../logic/quickAdd.js';
import { loadSubjects, saveSubjects, addSubject, removeSubject } from '../logic/studySubjects.js';

/** The subject list, read from this device the first time it is needed. */
export function subjectsOf(state) {
  if (!state.studySubjects) {
    try { state.studySubjects = loadSubjects(localStorage); } catch { state.studySubjects = []; }
  }
  return state.studySubjects;
}

export function createTodayActions({ state, saveEntries, saveFail, inputValue, today }) {
  const readQuick = (kind) => Object.fromEntries(QUICK_FIELDS[kind].map((f) => [f.key, inputValue(`qa-${f.key}`)]));
  const persist = (list) => {
    state.studySubjects = list;
    try { if (!saveSubjects(localStorage, list)) state.msg = 'Could not keep the subject list on this phone.'; } catch { state.msg = 'Could not keep the subject list on this phone.'; }
  };
  return {
    toggleSection: (el) => {
      const k = el.dataset.section;
      state.sections = { ...(state.sections || {}), [k]: !(state.sections || {})[k] };
    },

    openQuick: () => { state.quick = { kind: 'weight', draft: {} }; state.msg = ''; },
    closeQuick: () => { state.quick = null; },
    quickKind: (el) => { state.quick = { kind: el.dataset.kind, draft: {} }; },
    saveQuick: async () => {
      const q = state.quick;
      if (!q) return;
      const raw = readQuick(q.kind);
      const r = buildQuickEntry(q.kind, raw, today(), Date.now(), new Date().getHours());
      if (r.error) { q.draft = raw; state.msg = r.error; return; } // keep what was typed
      try { await saveEntries([r.entry]); } catch (err) { q.draft = raw; state.msg = saveFail(err); return; }
      state.entries.push(r.entry);
      state.quick = null;
      state.msg = r.message;
    },

    addSubject: () => {
      const r = addSubject(subjectsOf(state), inputValue('subject-new'));
      if (r.error) { state.msg = r.error; return; }
      persist(r.list);
    },
    removeSubject: (el) => { persist(removeSubject(subjectsOf(state), el.dataset.subject)); },
    pickSubject: (el) => {
      const draft = state.studyDraft || {};
      state.studyDraft = { kind: inputValue('study-kind') || draft.kind, topic: el.dataset.subject, minutes: inputValue('study-min'), notes: inputValue('study-notes') };
    },
  };
}
