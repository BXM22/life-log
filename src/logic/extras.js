// Spontaneous exercises: extra exercises added for one day only, on top of the template.
// They never change the template. Sets logged for them are normal 'lift_set' entries, named by exercise.
// Stored as { day, list } so yesterday's extras drop out on their own. Pure apart from the storage you pass in.

import { parseExerciseFields } from './templateEdit.js';

export const EXTRAS_KEY = 'lifelog.wExtras';

/** Read today's extras from storage. Anything unreadable or from another day gives { day, list: [] }. */
export function loadExtras(storage, day) {
  try {
    const raw = JSON.parse(storage.getItem(EXTRAS_KEY));
    if (raw?.day !== day || !Array.isArray(raw.list)) return { day, list: [] };
    const list = [];
    for (const e of raw.list) {
      const r = parseExerciseFields(e || {});
      if (!r.error) list.push(r.exercise);
    }
    return { day, list };
  } catch { return { day, list: [] }; }
}

export function saveExtras(storage, extras) {
  try { storage.setItem(EXTRAS_KEY, JSON.stringify(extras)); } catch { /* extras are a convenience; sets are still saved */ }
}

/** Today's extras from state, or [] when the stored day is not `day`. */
export const extrasFor = (extras, day) => (extras?.day === day ? extras.list : []);

/** Add one. The name must differ (ignoring case) from every template exercise and every extra already added. */
export function addExtra(list, templateExercises, fields) {
  const r = parseExerciseFields({ ...fields, warmup: '', target: '' }); // keeps equipment
  if (r.error) return r;
  const taken = [...templateExercises, ...list].some((e) => e.name.toLowerCase() === r.exercise.name.toLowerCase());
  if (taken) return { error: `${r.exercise.name} is already on today's workout.` };
  return { list: [...list, { ...r.exercise, warmup: 'none', target: 'as you like' }] };
}

export const removeExtra = (list, name) => list.filter((e) => e.name !== name);
