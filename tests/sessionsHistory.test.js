import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { SESSIONS, setTemplate } from '../src/logic/template.js';
import { addSession, renameSession, removeSession, normalizeTemplate } from '../src/logic/templateEdit.js';
import { activeSessionId } from '../src/logic/workout.js';
import { workoutDays } from '../src/logic/workoutHistory.js';
import { newEntry } from '../src/logic/entries.js';

after(() => setTemplate(null));

test('addSession: empty session with a readable id; blank, long and duplicate names are refused', () => {
  const r = addSession(SESSIONS, '  Push   day ');
  assert.equal(r.id, 'c-push-day');
  assert.deepEqual(r.sessions.at(-1), { id: 'c-push-day', name: 'Push day', focus: '', exercises: [] });
  assert.equal(r.sessions.length, SESSIONS.length + 1);
  assert.match(addSession(SESSIONS, '   ').error, /name/i);
  assert.match(addSession(SESSIONS, 'x'.repeat(41)).error, /40/);
  assert.match(addSession(SESSIONS, 'upper a').error, /already exists/);
});

test('addSession: ids stay unique when two names make the same slug', () => {
  const a = addSession(SESSIONS, 'Push day');
  const b = addSession(a.sessions, 'Push-day!');
  assert.equal(b.error, undefined);
  assert.equal(b.id, 'c-push-day-2');
  assert.equal(new Set(b.sessions.map((s) => s.id)).size, b.sessions.length);
});

test('addSession: a copy duplicates the exercises without sharing them; the input is untouched', () => {
  const before = JSON.stringify(SESSIONS);
  const r = addSession(SESSIONS, 'Lower 2', 'lower');
  const src = SESSIONS.find((s) => s.id === 'lower');
  const copy = r.sessions.find((s) => s.id === r.id);
  assert.deepEqual(copy.exercises, src.exercises);
  assert.notEqual(copy.exercises[0], src.exercises[0]);
  assert.equal(copy.focus, src.focus);
  assert.match(addSession(SESSIONS, 'x', 'nope').error, /does not exist/);
  assert.equal(JSON.stringify(SESSIONS), before);
});

test('renameSession: renames in place, keeps the id, refuses clashes but allows the same name', () => {
  const r = renameSession(SESSIONS, 'lower', 'Legs');
  assert.equal(r.sessions.find((s) => s.id === 'lower').name, 'Legs');
  assert.match(renameSession(SESSIONS, 'lower', 'Upper A').error, /already exists/);
  assert.equal(renameSession(SESSIONS, 'lower', 'lower').error, undefined);
  assert.match(renameSession(SESSIONS, 'nope', 'x').error, /does not exist/);
});

test('removeSession: removes one, refuses the last one and unknown ids', () => {
  const r = removeSession(SESSIONS, 'upper_c');
  assert.equal(r.sessions.length, SESSIONS.length - 1);
  assert.ok(!r.sessions.some((s) => s.id === 'upper_c'));
  assert.match(removeSession([SESSIONS[0]], SESSIONS[0].id).error, /at least one/);
  assert.match(removeSession(SESSIONS, 'nope').error, /does not exist/);
});

test('custom sessions survive normalizeTemplate', () => {
  const r = addSession(SESSIONS, 'Push day');
  const back = normalizeTemplate(JSON.parse(JSON.stringify(r.sessions)));
  assert.equal(back.at(-1).id, 'c-push-day');
});

test('activeSessionId falls back safely when the scheduled session was deleted', () => {
  const noLower = removeSession(SESSIONS, 'lower').sessions;
  setTemplate(noLower);
  assert.equal(activeSessionId(null, '2026-11-12'), 'upper_a'); // Thursday is scheduled Lower, which is gone
  setTemplate(noLower.filter((s) => s.id !== 'upper_a'));
  assert.equal(activeSessionId(null, '2026-11-12'), 'upper_b'); // no Upper A either: first remaining session
  setTemplate(null);
});

const set = (date, session, exercise, kind, data, at) =>
  newEntry('lift_set', date, { session, exercise, kind, weight: data.weight ?? null, reps: data.reps ?? null, seconds: null, side: null }, at);

test('workoutDays: groups by day newest first, then session and exercise, in saved order', () => {
  const entries = [
    set('2026-11-10', 'upper_a', 'Lateral raise', 'working', { weight: 15, reps: 12 }, 3),
    set('2026-11-10', 'upper_a', 'Lateral raise', 'warmup', { weight: 5, reps: 12 }, 1),
    set('2026-11-10', 'upper_a', 'Lateral raise', 'working', { weight: 15, reps: 11 }, 4),
    set('2026-11-08', 'lower', 'Hip thrust', 'working', { weight: 135, reps: 10 }, 5),
    newEntry('weigh_in', '2026-11-09', { weight_lb: 180 }, 6),
  ];
  const days = workoutDays(entries);
  assert.deepEqual(days.map((d) => d.date), ['2026-11-10', '2026-11-08']);
  assert.equal(days[0].count, 3);
  assert.deepEqual(days[0].sessions[0].exercises, [{ name: 'Lateral raise', warmup: ['5 x 12'], working: ['15 x 12', '15 x 11'] }]);
  assert.equal(days[0].sessions[0].name, 'Upper A');
  assert.equal(days[1].sessions[0].name, 'Lower');
});

test('workoutDays: skips deleted sets, names unknown sessions, and is empty with no sets', () => {
  const gone = { ...set('2026-11-10', 'upper_a', 'Abs', 'working', { reps: 20 }, 1), deletedAt: 9 };
  assert.deepEqual(workoutDays([gone]), []);
  assert.deepEqual(workoutDays([]), []);
  const odd = set('2026-11-10', 'c-old', 'Curl', 'working', { weight: 20, reps: 8 }, 1);
  assert.equal(workoutDays([odd])[0].sessions[0].name, 'Deleted session');
});
