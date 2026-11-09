// Editing the workout template. Pure: every function returns a new sessions array and never changes its input.
// Logged sets keep the exercise NAME they were saved under, so renaming or deleting an exercise
// never touches past entries; they stay in the log and in Dropbox exports as they were.

export const MODES = ['weight', 'bodyweight', 'timed'];
export const MAX_NAME = 60;
const MAX_NOTE = 80;
const DEFAULT_WARMUP = 'none';
const DEFAULT_TARGET = '3 sets';

/** Validate the exercise form. Returns { exercise } or { error }. */
export function parseExerciseFields({ name, mode, perSide, warmup, target }) {
  const n = String(name ?? '').trim();
  if (!n) return { error: 'Enter a name for the exercise.' };
  if (n.length > MAX_NAME) return { error: `Name must be ${MAX_NAME} characters or fewer.` };
  if (!MODES.includes(mode)) return { error: 'Pick weight, bodyweight or timed.' };
  const w = String(warmup ?? '').trim() || DEFAULT_WARMUP;
  const t = String(target ?? '').trim() || DEFAULT_TARGET;
  if (w.length > MAX_NOTE || t.length > MAX_NOTE) return { error: `Warm-up and target must be ${MAX_NOTE} characters or fewer.` };
  return { exercise: { name: n, mode, warmup: w, target: t, ...(perSide ? { perSide: true } : {}) } };
}

const find = (sessions, id) => sessions.find((s) => s.id === id);
const clash = (session, name, skip) =>
  session.exercises.some((e, i) => i !== skip && e.name.toLowerCase() === name.toLowerCase());

function withExercises(sessions, id, exercises) {
  return sessions.map((s) => (s.id === id ? { ...s, exercises } : s));
}

/** Add an exercise to the end of a session. */
export function addExercise(sessions, sessionId, fields) {
  const s = find(sessions, sessionId);
  if (!s) return { error: 'That session does not exist.' };
  const r = parseExerciseFields(fields);
  if (r.error) return r;
  if (clash(s, r.exercise.name, -1)) return { error: `${r.exercise.name} is already in ${s.name}.` };
  return { sessions: withExercises(sessions, sessionId, [...s.exercises, r.exercise]) };
}

/** Replace the exercise at an index. */
export function updateExercise(sessions, sessionId, index, fields) {
  const s = find(sessions, sessionId);
  if (!s || !s.exercises[index]) return { error: 'That exercise does not exist.' };
  const r = parseExerciseFields(fields);
  if (r.error) return r;
  if (clash(s, r.exercise.name, index)) return { error: `${r.exercise.name} is already in ${s.name}.` };
  return { sessions: withExercises(sessions, sessionId, s.exercises.map((e, i) => (i === index ? r.exercise : e))) };
}

/** Remove the exercise at an index. */
export function removeExercise(sessions, sessionId, index) {
  const s = find(sessions, sessionId);
  if (!s || !s.exercises[index]) return { error: 'That exercise does not exist.' };
  return { sessions: withExercises(sessions, sessionId, s.exercises.filter((_, i) => i !== index)) };
}

/** Any stored value in, a usable sessions array or null out. Null means "use the default plan". */
export function normalizeTemplate(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const out = [];
  for (const s of raw) {
    if (!s || typeof s.id !== 'string' || typeof s.name !== 'string' || !Array.isArray(s.exercises)) return null;
    const exercises = [];
    for (const e of s.exercises) {
      const r = parseExerciseFields(e || {});
      if (r.error) return null;
      exercises.push(r.exercise);
    }
    out.push({ id: s.id, name: s.name, focus: typeof s.focus === 'string' ? s.focus : '', exercises });
  }
  return out;
}
