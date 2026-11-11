// Actions for the WORKOUT tab. app.js merges these into its action table, passing in the pieces
// it owns (state, saving, reading inputs, today's date) so this file has no globals.

import { newEntry } from '../logic/entries.js';
import { sessionById } from '../logic/template.js';
import { activeSessionId, parseSet, setText } from '../logic/workout.js';

export function createWorkoutActions({ state, saveEntries, saveFail, inputValue, today, onWorkingSet }) {
  return {
    pickSession: (el) => { state.wSession = el.value; state.msg = ''; },

    logSet: async (el) => {
      const day = today();
      const id = activeSessionId(state.wSession, day, state.planDays);
      const ex = sessionById(id)?.exercises[Number(el.dataset.i)];
      if (!ex) return;
      const kind = el.dataset.kind === 'warmup' ? 'warmup' : 'working';
      const r = parseSet(ex, {
        weight: inputValue(`w-${el.dataset.i}`),
        reps: inputValue(`r-${el.dataset.i}`),
        seconds: inputValue(`s-${el.dataset.i}`),
        side: inputValue(`sd-${el.dataset.i}`),
      });
      if (r.error) { state.msg = r.error; return; }
      const e = newEntry('lift_set', day, { session: id, exercise: ex.name, kind, ...r.data }, Date.now());
      try { await saveEntries([e]); } catch (err) { state.msg = saveFail(err); return; }
      state.entries.push(e);
      state.msg = `${kind === 'warmup' ? 'Warm-up' : 'Set'} saved: ${setText(r.data)}.`;
      if (kind === 'working' && onWorkingSet) onWorkingSet();
    },
  };
}
