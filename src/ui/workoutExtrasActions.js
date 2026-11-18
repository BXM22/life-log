// Actions for the WORKOUT extras. Checklist ticks and trims are per-day tweaks kept
// in memory on state and mirrored to localStorage (only today's are kept); they never touch entries.

import { sessionById } from '../logic/template.js';
import { activeSessionId } from '../logic/workout.js';
import { bumpTrim, checkKey, pruneDay } from '../logic/workoutExtras.js';

const KEY = 'life-log.workoutExtras';

function read() {
  try { return JSON.parse(localStorage.getItem(KEY)) ?? {}; } catch { return {}; }
}
function write(state, day) {
  state.wChecks = pruneDay(state.wChecks, day);
  state.wTrims = pruneDay(state.wTrims, day);
  try { localStorage.setItem(KEY, JSON.stringify({ checks: state.wChecks, trims: state.wTrims })); } catch { /* private mode: keep in memory only */ }
}

export function createWorkoutExtrasActions({ state, today }) {
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
  };
}
