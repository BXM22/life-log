// Actions for the KUMIO study panel (F16). app.js merges these into its action table.

import { newEntry } from '../logic/entries.js';
import { parseStudy } from '../logic/study.js';

export function createStudyActions({ state, saveEntries, saveFail, inputValue, today }) {
  return {
    logStudy: async () => {
      const raw = { kind: inputValue('study-kind'), topic: inputValue('study-topic'), minutes: inputValue('study-min'), notes: inputValue('study-notes') };
      const r = parseStudy(raw);
      if (r.error) { state.studyDraft = raw; state.msg = r.error; return; } // keep what was typed
      const e = newEntry('study', today(), r.data, Date.now());
      try { await saveEntries([e]); } catch (err) { state.studyDraft = raw; state.msg = saveFail(err); return; }
      state.studyDraft = null;
      state.entries.push(e);
      state.msg = `Saved ${r.data.minutes} min of ${r.data.kind}.`;
    },
  };
}
