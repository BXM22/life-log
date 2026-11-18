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
