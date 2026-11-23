// Exercise library: exercises you saved to reuse, with autofill by name. Pure: no storage, no clock.
// Entry: { name, mode, warmup, target, perSide?, equipment? } (the same shape as a template exercise).
// Stored on this device in localStorage 'lifelog.library' (not in the JSON backup).

import { parseExerciseFields } from './templateEdit.js';

export const LIBRARY_KEY = 'lifelog.library';
export const MAX_LIBRARY = 200;
export const SEED_KEY = 'lifelog.librarySeeded';

// Built-in starter exercises: [name, equipment, mode, perSide?]. Added once, then they are ordinary entries (remove any you don't want).
const SEED = [
  ['dumbbell', 'weight', ['Dumbbell bench press', 'Incline dumbbell press', 'Dumbbell shoulder press', 'Lateral raise', 'Rear delt fly', ['One-arm dumbbell row', 1], 'Dumbbell curl', 'Hammer curl', 'Overhead triceps extension', 'Goblet squat', 'Dumbbell Romanian deadlift', ['Bulgarian split squat', 1], 'Dumbbell lunge', 'Dumbbell shrug', ['Farmer\u2019s carry', 0, 'timed']]],
  ['barbell', 'weight', ['Barbell bench press', 'Overhead press', 'Barbell row', 'Back squat', 'Front squat', 'Deadlift', 'Romanian deadlift', 'Hip thrust', 'Barbell curl', 'Skull crusher', 'Close-grip bench press', 'Barbell shrug', 'Good morning', 'Barbell lunge']],
  ['calisthenics', 'bodyweight', ['Push-up', 'Diamond push-up', 'Pike push-up', 'Dip', 'Pull-up', 'Chin-up', 'Inverted row', 'Bodyweight squat', 'Jump squat', 'Walking lunge', 'Glute bridge', 'Calf raise', ['Plank', 0, 'timed'], 'Hanging leg raise', 'Bicycle crunch', 'Superman', 'Burpee']],
];
export const SEED_EXERCISES = SEED.flatMap(([equipment, mode, items]) => items.map((it) => {
  const [name, side, m] = Array.isArray(it) ? it : [it];
  return { name, mode: m ?? mode, warmup: 'none', target: '3 x 8-12', ...(side ? { perSide: true } : {}), equipment };
}));

export function loadLibrary(storage) {
  try {
    const raw = JSON.parse(storage.getItem(LIBRARY_KEY));
    if (Array.isArray(raw)) return raw.map((x) => parseExerciseFields(x).exercise).filter(Boolean);
  } catch { /* none saved or blocked */ }
  return [];
}

/** Merge the built-in exercises into the saved list once (never overwrites a name you already have). Returns the list. */
export function seedLibrary(storage, list) {
  try { if (storage.getItem(SEED_KEY)) return list; } catch { return list; }
  const have = new Set(list.map((e) => e.name.toLowerCase()));
  const merged = [...list, ...SEED_EXERCISES.filter((e) => !have.has(e.name.toLowerCase()))]
    .sort((a, b) => a.name.localeCompare(b.name));
  saveLibrary(storage, merged);
  try { storage.setItem(SEED_KEY, '1'); } catch { /* retried next load */ }
  return merged;
}

export function saveLibrary(storage, list) {
  try { storage.setItem(LIBRARY_KEY, JSON.stringify(list)); } catch { /* private mode: kept in memory only */ }
}

const same = (a, b) => a.toLowerCase() === b.toLowerCase();
export const findInLibrary = (list, name) => (list ?? []).find((e) => same(e.name, String(name ?? '').trim())) ?? null;

/** Save an exercise. A name already in the library is replaced in place. Returns { list, updated } or { error }. */
export function saveToLibrary(list, ex) {
  const r = parseExerciseFields({ ...ex, warmup: ex.warmup === 'none' ? '' : ex.warmup });
  if (r.error) return r;
  const cur = list ?? [];
  const at = cur.findIndex((e) => same(e.name, r.exercise.name));
  if (at >= 0) return { list: cur.map((e, i) => (i === at ? r.exercise : e)), updated: true };
  if (cur.length >= MAX_LIBRARY) return { error: `The library holds up to ${MAX_LIBRARY} exercises.` };
  return { list: [...cur, r.exercise].sort((a, b) => a.name.localeCompare(b.name)), updated: false };
}

export const removeFromLibrary = (list, name) => (list ?? []).filter((e) => !same(e.name, name));

/** Autofill values for a typed name: the saved exercise when the name matches exactly (ignoring case), else null. */
export const autofillFor = (list, name) => findInLibrary(list, name);

const MODE_WORDS = { weight: 'weight and reps', bodyweight: 'bodyweight', timed: 'timed' };

/** Filter by a search text (name, equipment, what you log, target; every word must match) and an equipment key ('all' or an equipment). */
export function searchLibrary(list, query = '', equip = 'all') {
  const words = String(query).toLowerCase().split(/\s+/).filter(Boolean);
  return (list ?? []).filter((e) => {
    if (equip !== 'all' && e.equipment !== equip) return false;
    const hay = `${e.name} ${e.equipment ?? ''} ${MODE_WORDS[e.mode] ?? ''} ${e.target ?? ''}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}

/** Edit one entry (rename allowed) or add a new one when oldName is null. A name that belongs to a different entry is refused. */
export function updateLibraryEntry(list, oldName, fields) {
  const r = parseExerciseFields({ ...fields, warmup: fields.warmup === 'none' ? '' : fields.warmup });
  if (r.error) return r;
  const cur = list ?? [];
  const at = oldName == null ? -1 : cur.findIndex((e) => same(e.name, oldName));
  if (oldName != null && at < 0) return { error: 'That exercise is no longer in the library.' };
  const other = cur.findIndex((e, i) => i !== at && same(e.name, r.exercise.name));
  if (other >= 0) return { error: `${r.exercise.name} is already in the library.` };
  if (at < 0 && cur.length >= MAX_LIBRARY) return { error: `The library holds up to ${MAX_LIBRARY} exercises.` };
  const next = at < 0 ? [...cur, r.exercise] : cur.map((e, i) => (i === at ? r.exercise : e));
  return { list: next.sort((a, b) => a.name.localeCompare(b.name)), added: at < 0 };
}
