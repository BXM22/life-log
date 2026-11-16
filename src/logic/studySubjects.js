// Custom study subjects (F41): a short list of topics kept on this device. Pure: the caller passes the storage.
export const SUBJECTS_KEY = 'lifelog.studySubjects';
export const MAX_SUBJECTS = 20;
export const MAX_SUBJECT = 60; // same limit as a study topic

const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();

/** Any value in, a deduplicated (case-insensitive), capped list of valid subjects out. */
export function normalizeSubjects(raw) {
  const out = [];
  for (const v of Array.isArray(raw) ? raw : []) {
    const s = clean(v);
    if (s && s.length <= MAX_SUBJECT && !out.some((o) => o.toLowerCase() === s.toLowerCase())) out.push(s);
  }
  return out.slice(0, MAX_SUBJECTS);
}

/** Returns { list } or { error }. */
export function addSubject(list, name) {
  const s = clean(name);
  if (!s) return { error: 'Enter a subject name.' };
  if (s.length > MAX_SUBJECT) return { error: `Subject must be ${MAX_SUBJECT} characters or fewer.` };
  if (list.some((o) => o.toLowerCase() === s.toLowerCase())) return { error: 'That subject is already in the list.' };
  if (list.length >= MAX_SUBJECTS) return { error: `Keep it to ${MAX_SUBJECTS} subjects.` };
  return { list: [...list, s] };
}

export const removeSubject = (list, name) => list.filter((o) => o !== name);

export function loadSubjects(storage) {
  try { return normalizeSubjects(JSON.parse(storage.getItem(SUBJECTS_KEY) || 'null')); } catch { return []; }
}

/** Returns true if saved, false if storage refused. */
export function saveSubjects(storage, list) {
  try { storage.setItem(SUBJECTS_KEY, JSON.stringify(normalizeSubjects(list))); return true; } catch { return false; }
}
