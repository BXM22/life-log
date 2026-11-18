// WORKOUT v2 navigation: which exercise page is open, stepper buttons, and typed-value drafts.
//   exports: createWorkoutNavActions({ state, today }), captureDraft(state), workoutContext(state, day)
//   actions: wOpenEx (data-i) | wCloseEx | wStep (data-i, data-field = weight|reps|seconds, data-delta) | wExNext / wExPrev (data-delta -1|1)
//   state:   wEx (open exercise index or null), wDraft ({ [i]: { w, r, s, sd, ld } })

import { sessionById } from '../logic/template.js';
import { extrasFor } from '../logic/extras.js';
import { activeSessionId } from '../logic/workout.js';
import { caliBlockFor } from '../logic/activities.js';
import { exerciseList } from '../logic/workoutPlan.js';

/** Today's active session, extras, calisthenics block and the flat exercise list the pages index into. */
export function workoutContext(state, day) {
  const id = activeSessionId(state.wSession, day, state.planDays);
  const session = sessionById(id) ?? { id, name: '', exercises: [] };
  const extras = extrasFor(state.wExtras, day);
  const cali = caliBlockFor(state.activities, day);
  return { id, session, extras, cali, list: exerciseList(session, extras, cali) };
}

const DRAFT_KEYS = ['w', 'r', 's', 'sd', 'ld'];

/** Copies the open exercise's inputs into state.wDraft so a re-render (menu, sheet) keeps typed values. */
export function captureDraft(state) {
  const i = state.wEx;
  if (i == null || typeof document === 'undefined') return;
  const got = {};
  for (const k of DRAFT_KEYS) {
    const el = document.getElementById(`${k}-${i}`);
    if (el) got[k] = el.value;
  }
  if (Object.keys(got).length) state.wDraft = { ...state.wDraft, [i]: { ...state.wDraft?.[i], ...got } };
}

const STEP = {
  weight: { key: 'w', step: 2.5, min: 0, max: 1000 },
  reps: { key: 'r', step: 1, min: 1, max: 100 },
  seconds: { key: 's', step: 5, min: 1, max: 3600 },
};

export function createWorkoutNavActions({ state, today }) {
  state.wEx = null;
  state.wDraft = {};

  const closeState = (i) => {
    if (i == null) return;
    const { [i]: _drop, ...rest } = state.wDraft;
    state.wDraft = rest;
    state.plates = null;
    if (state.wCues) state.wCues[i] = false;
  };
  const move = (delta) => {
    if (state.wEx == null) return;
    captureDraft(state);
    const day = today();
    const n = workoutContext(state, day).list.length;
    const next = state.wEx + delta;
    if (next < 0 || next >= n) return;
    state.plates = null;
    state.wEx = next;
  };

  return {
    wOpenEx: (el) => { state.wEx = Number(el.dataset.i); state.msg = ''; },
    wCloseEx: () => { closeState(state.wEx); state.wEx = null; state.msg = ''; },
    wExNext: () => move(1),
    wExPrev: () => move(-1),
    wStep: (el) => {
      const spec = STEP[el.dataset.field];
      const i = el.dataset.i;
      const input = spec ? document.getElementById(`${spec.key}-${i}`) : null;
      if (!input) return;
      const cur = input.value === '' ? 0 : Number(input.value);
      const base = Number.isFinite(cur) ? cur : 0;
      const next = Math.min(spec.max, Math.max(spec.min, Math.round((base + Number(el.dataset.delta) * spec.step) * 10) / 10));
      input.value = String(next); // captureDraft reads the DOM after this action
      state.wDraft = { ...state.wDraft, [i]: { ...state.wDraft?.[i], [spec.key]: String(next) } };
    },
  };
}
