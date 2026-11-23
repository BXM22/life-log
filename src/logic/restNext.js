// Pure helper for the rest page Next card: which set comes next for the open exercise (state.wEx).
import { sessionById } from './template.js';
import { extrasFor } from './extras.js';
import { activeSessionId } from './workout.js';
import { caliBlockFor } from './activities.js';
import { exerciseList, setDots } from './workoutPlan.js';

/** { name, setNumber, total, extra } for the open exercise, or null when none is open or it no longer exists. */
export function nextSetInfo(state, day) {
  const i = state?.wEx;
  if (i == null) return null;
  const id = activeSessionId(state.wSession, day, state.planDays);
  const session = sessionById(id) ?? { id, name: '', exercises: [] };
  const list = exerciseList(session, extrasFor(state.wExtras, day), caliBlockFor(state.activities, day));
  const item = list.find((x) => x.i === i);
  if (!item) return null;
  const { total, done } = setDots(item.ex, state.entries ?? [], day, state.wTrims);
  return { name: item.ex.name, setNumber: done + 1, total, extra: total != null && done >= total };
}
