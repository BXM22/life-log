import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SESSIONS, SCHEDULE, SCHEDULE_3, sessionById, findExercise } from '../src/logic/template.js';
import { weekday, sessionForDate, activeSessionId, parseSet, setText, setsFor, lastWorking, suggestWarmup, workoutMarkdown } from '../src/logic/workout.js';
import { newEntry, parseEdit, editEntry } from '../src/logic/entries.js';
import { buildExport } from '../src/logic/exportBuilder.js';
import { computeStats, emptyStats } from '../src/logic/retainedStats.js';
import { parseBackup, buildBackup } from '../src/logic/backup.js';
import { starterHabits, STARTER_HABITS } from '../src/logic/habits.js';
import { isSeeded, markSeeded } from '../src/logic/settings.js';

const press = 'Incline press (machine or barbell)';
const set = (date, exercise, kind, data, updatedAt = 1000, session = 'upper_a') =>
  ({ ...newEntry('lift_set', date, { session, exercise, kind, weight: null, reps: null, seconds: null, side: null, ...data }, updatedAt), id: `${date}-${exercise}-${kind}-${updatedAt}` });

test('template: 4 sessions, unique exercise names per session, every exercise has a valid mode', () => {
  assert.deepEqual(SESSIONS.map((s) => s.id), ['upper_a', 'lower', 'upper_b', 'upper_c']);
  for (const s of SESSIONS) {
    assert.equal(new Set(s.exercises.map((e) => e.name)).size, s.exercises.length, s.id);
    for (const e of s.exercises) assert.ok(['weight', 'bodyweight', 'timed'].includes(e.mode), e.name);
  }
  assert.equal(sessionById('lower').exercises.length, 8);
  assert.equal(sessionById('nope'), null);
  assert.equal(findExercise(press).mode, 'weight');
  assert.equal(findExercise('Walking lunge').perSide, true);
  assert.equal(findExercise('Made up'), null);
});

test('schedule: Tue Upper A, Thu Lower, Sat Upper B, Sun Upper C, others none', () => {
  assert.equal(weekday('2026-11-07'), 6); // Saturday
  assert.equal(sessionForDate('2026-11-07'), 'upper_b');
  assert.equal(sessionForDate('2026-11-10'), 'upper_a'); // Tuesday
  assert.equal(sessionForDate('2026-11-12'), 'lower'); // Thursday
  assert.equal(sessionForDate('2026-11-08'), 'upper_c'); // Sunday
  for (const d of ['2026-11-09', '2026-11-11', '2026-11-13']) assert.equal(sessionForDate(d), null, d); // Mon, Wed, Fri
  assert.deepEqual(Object.keys(SCHEDULE).sort(), ['0', '2', '4', '6']);
});

test('3-day week: Sunday has no session, Tue/Thu/Sat are unchanged; anything but 3 means 4 days', () => {
  assert.equal(sessionForDate('2026-11-08', 3), null); // Sunday
  assert.equal(sessionForDate('2026-11-08', 4), 'upper_c');
  assert.equal(sessionForDate('2026-11-08', 7), 'upper_c');
  assert.equal(sessionForDate('2026-11-10', 3), 'upper_a');
  assert.equal(sessionForDate('2026-11-12', 3), 'lower');
  assert.equal(sessionForDate('2026-11-07', 3), 'upper_b');
  assert.equal(activeSessionId(null, '2026-11-08', 3), 'upper_a'); // nothing scheduled: falls back to Upper A
  assert.equal(activeSessionId('upper_c', '2026-11-08', 3), 'upper_c'); // Upper C stays pickable
  assert.deepEqual(Object.keys(SCHEDULE_3).sort(), ['2', '4', '6']);
});

test('activeSessionId: picked beats today, today beats Upper A, bad pick falls back', () => {
  assert.equal(activeSessionId('lower', '2026-11-10'), 'lower');
  assert.equal(activeSessionId(null, '2026-11-10'), 'upper_a');
  assert.equal(activeSessionId(null, '2026-11-12'), 'lower');
  assert.equal(activeSessionId(null, '2026-11-09'), 'upper_a'); // Monday: nothing scheduled
  assert.equal(activeSessionId('bogus', '2026-11-12'), 'lower');
});

test('parseSet: weight exercises need weight and reps', () => {
  const ex = findExercise(press);
  assert.deepEqual(parseSet(ex, { weight: '100', reps: '8' }).data, { weight: 100, reps: 8, seconds: null, side: null });
  assert.ok(parseSet(ex, { weight: '', reps: '8' }).error);
  assert.ok(parseSet(ex, { weight: '100', reps: '' }).error);
  assert.ok(parseSet(ex, { weight: '100', reps: '8.5' }).error);
  assert.ok(parseSet(ex, { weight: '100', reps: '0' }).error);
  assert.ok(parseSet(ex, { weight: '-5', reps: '8' }).error);
  assert.ok(parseSet(ex, { weight: '1001', reps: '8' }).error);
  assert.equal(parseSet(ex, { weight: '102.55', reps: '8' }).data.weight, 102.6);
});

test('parseSet: bodyweight allows blank weight, timed needs seconds, per-side needs L or R', () => {
  assert.equal(parseSet(findExercise('Abs'), { weight: '', reps: '15' }).data.weight, null);
  assert.equal(parseSet(findExercise('Abs'), { weight: '25', reps: '15' }).data.weight, 25);
  const carry = findExercise('Farmer carry or heavy dumbbell hold (straps)');
  assert.deepEqual(parseSet(carry, { weight: '60', seconds: '40' }).data, { weight: 60, reps: null, seconds: 40, side: null });
  assert.ok(parseSet(carry, { weight: '60', seconds: '' }).error);
  assert.ok(parseSet(carry, { weight: '60', seconds: '4000' }).error);
  const lunge = findExercise('Walking lunge');
  assert.equal(parseSet(lunge, { reps: '10', side: 'L' }).data.side, 'L');
  assert.ok(parseSet(lunge, { reps: '10', side: '' }).error);
  assert.ok(parseSet(lunge, { reps: '10', side: 'X' }).error);
  assert.equal(parseSet(findExercise(press), { weight: '100', reps: '8', side: 'L' }).data.side, null);
});

test('setText: weight x reps, reps only, timed, with side prefix', () => {
  assert.equal(setText({ weight: 100, reps: 8, seconds: null, side: null }), '100 x 8');
  assert.equal(setText({ weight: null, reps: 12, seconds: null, side: null }), '12 reps');
  assert.equal(setText({ weight: 60, reps: null, seconds: 40, side: null }), '60 lb for 40 sec');
  assert.equal(setText({ weight: null, reps: null, seconds: 30, side: null }), '30 sec');
  assert.equal(setText({ weight: 25, reps: 10, seconds: null, side: 'R' }), 'R 25 x 10');
});

test('lastWorking: latest working set wins, warm-ups and deleted sets are ignored, wiped history comes from stats', () => {
  const entries = [
    set('2026-11-03', press, 'working', { weight: 95, reps: 8 }, 10),
    set('2026-11-10', press, 'working', { weight: 100, reps: 7 }, 20),
    set('2026-11-10', press, 'working', { weight: 100, reps: 6 }, 30),
    set('2026-11-10', press, 'warmup', { weight: 50, reps: 8 }, 40),
    set('2026-11-11', press, 'working', { weight: 200, reps: 1 }, 50),
  ];
  entries[4].deletedAt = 60;
  const last = lastWorking(entries, null, press);
  assert.equal(last.date, '2026-11-10');
  assert.equal(last.reps, 6);
  assert.equal(lastWorking([], null, press), null);
  const stats = { lastLifts: { [press]: { date: '2026-11-01', weight: 90, reps: 8, seconds: null, side: null } } };
  assert.equal(lastWorking([], stats, press).weight, 90);
  assert.equal(lastWorking(entries, stats, press).weight, 100); // newer entries beat older stats
});

test('suggestWarmup: about half, rounded to 2.5, never below 2.5, null when unknown', () => {
  assert.equal(suggestWarmup({ weight: 100 }), 50);
  assert.equal(suggestWarmup({ weight: 95 }), 47.5);
  assert.equal(suggestWarmup({ weight: 97.5 }), 50); // 48.75 is halfway, rounds up
  assert.equal(suggestWarmup({ weight: 3 }), 2.5);
  assert.equal(suggestWarmup({ weight: null }), null);
  assert.equal(suggestWarmup({ weight: 0 }), null);
  assert.equal(suggestWarmup(null), null);
});

test('setsFor: one date and exercise, in saved order, deleted skipped', () => {
  const entries = [
    set('2026-11-10', press, 'working', { weight: 100, reps: 7 }, 30),
    set('2026-11-10', press, 'warmup', { weight: 50, reps: 8 }, 20),
    set('2026-11-10', press, 'working', { weight: 100, reps: 6 }, 40),
    set('2026-11-09', press, 'working', { weight: 95, reps: 8 }, 10),
    set('2026-11-10', 'Lateral raise', 'working', { weight: 15, reps: 12 }, 25),
  ];
  entries[2].deletedAt = 41;
  assert.deepEqual(setsFor(entries, '2026-11-10', press).map((e) => e.updatedAt), [20, 30]);
});

test('workoutMarkdown: groups by session and exercise, warm-up first, empty when no sets', () => {
  assert.deepEqual(workoutMarkdown([]), []);
  const day = [
    set('2026-11-10', press, 'working', { weight: 100, reps: 8 }, 30),
    set('2026-11-10', press, 'warmup', { weight: 50, reps: 8 }, 20),
    set('2026-11-10', press, 'working', { weight: 100, reps: 7 }, 40),
    set('2026-11-10', 'One-arm neutral-grip pulldown (straps)', 'working', { weight: 60, reps: 8, side: 'L' }, 50),
  ];
  assert.deepEqual(workoutMarkdown(day), [
    '## Workout',
    '### Upper A',
    `- ${press}: warm-up 50 x 8; 100 x 8, 100 x 7`,
    '- One-arm neutral-grip pulldown (straps): L 60 x 8',
    '',
  ]);
});

test('export: lift sets appear in the Markdown under Workout and the manifest', () => {
  const entries = [set('2026-11-10', press, 'working', { weight: 100, reps: 8 }, 30)];
  const r = buildExport(entries, { now: Date.parse('2026-11-10T20:00:00') });
  assert.match(r.markdown, /## Workout\n### Upper A\n- Incline press \(machine or barbell\): 100 x 8/);
  assert.equal(r.manifest.items.length, 1);
});

test('retained stats: lastLifts keeps the latest working set per exercise and never regresses', () => {
  const first = computeStats([
    set('2026-11-03', press, 'working', { weight: 95, reps: 8 }, 10),
    set('2026-11-10', press, 'working', { weight: 100, reps: 7 }, 20),
    set('2026-11-10', press, 'warmup', { weight: 50, reps: 8 }, 30),
  ], emptyStats(), 1);
  assert.equal(first.lastLifts[press].weight, 100);
  assert.equal(first.lastLifts[press].date, '2026-11-10');
  const later = computeStats([set('2026-11-05', press, 'working', { weight: 90, reps: 8 }, 40)], first, 2);
  assert.equal(later.lastLifts[press].date, '2026-11-10'); // older entry cannot overwrite a newer fact
  assert.deepEqual(emptyStats().lastLifts, {});
  assert.deepEqual(computeStats([], { key: 'stats', best: {}, anchors: {}, lastSets: {}, weighIns: [] }, 3).lastLifts, {}); // stats saved before this feature
});

test('edit: a lift set can change weight and reps, and keeps its session, exercise and kind', () => {
  const e = set('2026-11-10', press, 'working', { weight: 100, reps: 8 }, 30);
  const r = parseEdit(e, { weight: '102.5', reps: '9' });
  assert.deepEqual(r.data, { weight: 102.5, reps: 9, seconds: null, side: null });
  const edited = editEntry(e, r.data, 100);
  assert.equal(edited.data.exercise, press);
  assert.equal(edited.data.kind, 'working');
  assert.ok(parseEdit(e, { weight: '', reps: '9' }).error);
  const timed = set('2026-11-12', 'Farmer carry or heavy dumbbell hold (straps)', 'working', { weight: 60, seconds: 40 }, 5, 'lower');
  assert.equal(parseEdit(timed, { weight: '65', seconds: '45' }).data.seconds, 45);
  const side = set('2026-11-10', 'Walking lunge', 'working', { reps: 10, side: 'R' }, 5, 'lower');
  assert.equal(parseEdit(side, { weight: '', reps: '12' }).data.side, 'R');
});

test('backup: lift sets are a valid entry type and survive a round trip', () => {
  const e = set('2026-11-10', press, 'working', { weight: 100, reps: 8 }, 30);
  const parsed = parseBackup(JSON.stringify(buildBackup({ entries: [e] }, 1)));
  assert.equal(parsed.entries[0].type, 'lift_set');
});

test('starter habits: Guitar, Coding, Workout with normalized ids; seed flag is once-only and safe when storage fails', () => {
  assert.deepEqual(STARTER_HABITS, ['Guitar', 'Coding', 'Workout']);
  assert.deepEqual(starterHabits().map((h) => h.id), ['guitar', 'coding', 'workout']);
  const mem = new Map();
  const storage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, v) };
  assert.equal(isSeeded(storage), false);
  markSeeded(storage);
  assert.equal(isSeeded(storage), true);
  const blocked = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); } };
  assert.equal(isSeeded(blocked), true); // never re-seed on every load when storage is blocked
  assert.doesNotThrow(() => markSeeded(blocked));
});
