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

export const MAX_SESSION_NAME = 40;

/** Validate a session name: required, short, and unique (ignoring case) among the other sessions. */
function parseSessionName(sessions, name, skipId) {
  const n = String(name ?? '').replace(/\s+/g, ' ').trim();
  if (!n) return { error: 'Enter a name for the session.' };
  if (n.length > MAX_SESSION_NAME) return { error: `Session name must be ${MAX_SESSION_NAME} characters or fewer.` };
  if (sessions.some((s) => s.id !== skipId && s.name.toLowerCase() === n.toLowerCase())) return { error: `${n} already exists.` };
  return { name: n };
}

/** A readable id for a custom session, unique among the current ones: c-push-day, c-push-day-2. */
function newSessionId(sessions, name) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 20).replace(/-+$/, '') || 'session';
  const taken = new Set(sessions.map((s) => s.id));
  let id = `c-${slug}`;
  for (let n = 2; taken.has(id); n += 1) id = `c-${slug}-${n}`;
  return id;
}

/** Add a session at the end: empty, or a copy of the session with id `copyOf`. Returns { sessions, id } or { error }. */
export function addSession(sessions, name, copyOf = null) {
  const r = parseSessionName(sessions, name, null);
  if (r.error) return r;
  const src = copyOf ? find(sessions, copyOf) : null;
  if (copyOf && !src) return { error: 'That session does not exist.' };
  const id = newSessionId(sessions, r.name);
  const session = { id, name: r.name, focus: src?.focus ?? '', exercises: src ? src.exercises.map((e) => ({ ...e })) : [] };
  return { sessions: [...sessions, session], id };
}

/** Rename a session. Logged sets keep the exercise names they were saved under. */
export function renameSession(sessions, id, name) {
  if (!find(sessions, id)) return { error: 'That session does not exist.' };
  const r = parseSessionName(sessions, name, id);
  if (r.error) return r;
  return { sessions: sessions.map((s) => (s.id === id ? { ...s, name: r.name } : s)) };
}

/** Delete a session. At least one must remain. */
export function removeSession(sessions, id) {
  if (!find(sessions, id)) return { error: 'That session does not exist.' };
  if (sessions.length <= 1) return { error: 'Keep at least one session.' };
  return { sessions: sessions.filter((s) => s.id !== id) };
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
