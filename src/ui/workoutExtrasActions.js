// Actions for the WORKOUT extras (see workoutExtrasView.js). Checklist ticks and trims are per-day tweaks kept
// in memory on state and mirrored to localStorage (only today's are kept); they never touch entries.
// BJJ and calisthenics sets are saved as entries.

import { newEntry } from '../logic/entries.js';
import { sessionById } from '../logic/template.js';
import { activeSessionId, parseSet, setText } from '../logic/workout.js';
import { CALISTHENICS, bumpTrim, calisthenicsFor, checkKey, pruneDay, toggleBjj, bjjDone } from '../logic/workoutExtras.js';

const KEY = 'life-log.workoutExtras';

function read() {
  try { return JSON.parse(localStorage.getItem(KEY)) ?? {}; } catch { return {}; }
}
function write(state, day) {
  state.wChecks = pruneDay(state.wChecks, day);
  state.wTrims = pruneDay(state.wTrims, day);
  try { localStorage.setItem(KEY, JSON.stringify({ checks: state.wChecks, trims: state.wTrims })); } catch { /* private mode: keep in memory only */ }
}

export function createWorkoutExtrasActions({ state, saveEntries, saveFail, inputValue, today }) {
  const saved = read();
  state.wChecks = saved.checks ?? {};
  state.wTrims = saved.trims ?? {};
  state.wCues = {};

  const exerciseAt = (el) => {
    const id = activeSessionId(state.wSession, today(), state.planDays);
    return sessionById(id)?.exercises[Number(el.dataset.i)];
  };

  return {
    toggleCheck: (el) => {
      const day = today();
      const k = checkKey(day, el.dataset.list);
      state.wChecks[k] = { ...(state.wChecks[k] ?? {}), [el.dataset.i]: el.checked };
      write(state, day);
    },

    toggleCue: (el) => { state.wCues[el.dataset.i] = !state.wCues[el.dataset.i]; },

    trimSet: (el) => {
      const ex = exerciseAt(el);
      if (!ex) return;
      const day = today();
      state.wTrims = bumpTrim(state.wTrims, day, ex.name, ex.target, 1);
      write(state, day);
    },

    untrimSet: (el) => {
      const ex = exerciseAt(el);
      if (!ex) return;
      const day = today();
      state.wTrims = bumpTrim(state.wTrims, day, ex.name, ex.target, -1);
      write(state, day);
    },

    toggleBjj: async () => {
      const day = today();
      const e = toggleBjj(state.entries, day, Date.now());
      try { await saveEntries([e]); } catch (err) { state.msg = saveFail(err); return; }
      const i = state.entries.findIndex((x) => x.id === e.id);
      if (i >= 0) state.entries[i] = e; else state.entries.push(e);
      state.msg = bjjDone(state.entries, day) ? 'BJJ marked done.' : 'BJJ unmarked.';
    },

    logCali: async (el) => {
      const day = today();
      const block = calisthenicsFor(day);
      const ex = block && CALISTHENICS[block.id].exercises[Number(el.dataset.i)];
      if (!ex) return;
      const r = parseSet(ex, { reps: inputValue(`cr-${el.dataset.i}`), seconds: inputValue(`cs-${el.dataset.i}`) });
      if (r.error) { state.msg = r.error; return; }
      const e = newEntry('lift_set', day, { session: block.name, exercise: ex.name, kind: 'working', ...r.data }, Date.now());
      try { await saveEntries([e]); } catch (err) { state.msg = saveFail(err); return; }
      state.entries.push(e);
      state.msg = `Set saved: ${setText(r.data)}.`;
    },
  };
}
