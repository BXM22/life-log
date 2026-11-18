// Exercise library: exercises you saved to reuse, with autofill by name. Pure: no storage, no clock.
// Entry: { name, mode, warmup, target, perSide?, equipment? } (the same shape as a template exercise).
// Stored on this device in localStorage 'lifelog.library' (not in the JSON backup).

import { parseExerciseFields } from './templateEdit.js';

export const LIBRARY_KEY = 'lifelog.library';
export const MAX_LIBRARY = 200;

export function loadLibrary(storage) {
  try {
    const raw = JSON.parse(storage.getItem(LIBRARY_KEY));
    if (Array.isArray(raw)) return raw.map((x) => parseExerciseFields(x).exercise).filter(Boolean);
  } catch { /* none saved or blocked */ }
  return [];
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
