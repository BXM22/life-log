// Actions for the WORKOUT tab. app.js merges these into its action table, passing in the pieces
// it owns (state, saving, reading inputs, today's date) so this file has no globals.

import { newEntry } from '../logic/entries.js';
import { sessionById } from '../logic/template.js';
import { caliBlockFor } from '../logic/activities.js';
import { exerciseList } from '../logic/workoutPlan.js';
import { prCheck } from '../logic/progress.js';
import { activeSessionId, parseSet, setText } from '../logic/workout.js';
import { loadExtras, saveExtras, extrasFor, addExtra, removeExtra } from '../logic/extras.js';

export function createWorkoutActions({ state, saveEntries, saveFail, inputValue, today, onWorkingSet }) {
  // Spontaneous exercises for today only (logic/extras.js); the template is never touched.
  state.wExtras = loadExtras(localStorage, today());
  state.wAdd = false;
  const extrasToday = () => extrasFor(state.wExtras, today());
  const commitExtras = (list, msg) => {
    state.wExtras = { day: today(), list };
    saveExtras(localStorage, state.wExtras);
    state.msg = msg;
  };

  return {
    addExtraOpen: () => { state.wAdd = true; state.msg = ''; },
    addExtraCancel: () => { state.wAdd = false; state.wSheet = null; state.msg = ''; },
    addExtraSave: () => {
      const id = activeSessionId(state.wSession, today(), state.planDays);
      const r = addExtra(extrasToday(), sessionById(id)?.exercises ?? [], {
        name: document.getElementById('xe-name')?.value,
        mode: document.getElementById('xe-mode')?.value,
        perSide: Boolean(document.getElementById('xe-side')?.checked),
        equipment: document.getElementById('xe-equip')?.value,
      });
      if (r.error) { state.msg = r.error; return; }
      state.wAdd = false;
      state.wSheet = null; // the Add for today sheet closes on a successful save
      state.exOpen[r.list[r.list.length - 1].name] = true;
      commitExtras(r.list, 'Added for today. Log your sets below.');
    },
    removeExtra: (el) => commitExtras(removeExtra(extrasToday(), el.dataset.name), 'Removed from today. Sets you logged stay in your log.'),

    pickSession: (el) => { state.wSession = el.value; state.msg = ''; },

    toggleHistory: () => { state.wHistory = !state.wHistory; state.wManage = false; state.tEdit = null; state.msg = ''; },

    logSet: async (el) => {
      const day = today();
      const id = activeSessionId(state.wSession, day, state.planDays);
      const item = exerciseList(sessionById(id) ?? { id, exercises: [] }, extrasToday(), caliBlockFor(state.activities, day))[Number(el.dataset.i)];
      if (!item) return;
      // Calisthenics block exercises take the Added/Assisted weight like equipment 'calisthenics'.
      const ex = item.kind === 'cali' ? { ...item.ex, equipment: 'calisthenics' } : item.ex;
      const kind = el.dataset.kind === 'warmup' ? 'warmup' : 'working';
      const r = parseSet(ex, {
        weight: inputValue(`w-${el.dataset.i}`),
        reps: inputValue(`r-${el.dataset.i}`),
        seconds: inputValue(`s-${el.dataset.i}`),
        side: inputValue(`sd-${el.dataset.i}`),
        load: inputValue(`ld-${el.dataset.i}`),
      });
      if (r.error) { state.msg = r.error; return; }
      const e = newEntry('lift_set', day, { session: item.sessionKey, exercise: ex.name, kind, ...r.data }, Date.now());
      try { await saveEntries([e]); } catch (err) { state.msg = saveFail(err); return; }
      state.entries.push(e);
      state.pr = prCheck(state.entries, e, state.stats);
      state.msg = `${kind === 'warmup' ? 'Warm-up' : 'Set'} saved: ${setText(r.data)}.`;
      if (kind === 'working' && onWorkingSet) onWorkingSet();
    },
  };
}
