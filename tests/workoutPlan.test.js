import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setDots, sessionProgress, groupHistoryDays, exerciseList } from '../src/logic/workoutPlan.js';
import { trimKey } from '../src/logic/workoutExtras.js';

const DAY = '2026-01-07';
let n = 0;
const set = (name, o = {}) => ({
  id: `s${++n}`, type: 'lift_set', date: o.date ?? DAY, updatedAt: ++n,
  ...(o.deletedAt ? { deletedAt: o.deletedAt } : {}),
  data: { exercise: name, kind: o.kind ?? 'working', session: 'upper_a', weight: 50, reps: 8 },
});
const bench = { name: 'Bench', target: '3 x 6-8' };
const amrap = { name: 'Dips', target: 'AMRAP' };
const plank = { name: 'Plank', target: '60 sec' };

test('setDots counts working sets against target', () => {
  const entries = [set('Bench'), set('Bench'), set('Squat')];
  assert.deepEqual(setDots(bench, entries, DAY, {}), { total: 3, done: 2 });
  assert.deepEqual(setDots(bench, [], DAY, undefined), { total: 3, done: 0 });
});

test('setDots applies trims', () => {
  const trims = { [trimKey(DAY, 'Bench')]: 1 };
  assert.deepEqual(setDots(bench, [set('Bench')], DAY, trims), { total: 2, done: 1 });
  // never trims below one set
  assert.equal(setDots(bench, [], DAY, { [trimKey(DAY, 'Bench')]: 9 }).total, 1);
  // other day trims ignored
  assert.equal(setDots(bench, [], DAY, { [trimKey('2026-01-06', 'Bench')]: 1 }).total, 3);
});

test('setDots total is null without a set count', () => {
  const entries = [set('Dips'), set('Plank')];
  assert.deepEqual(setDots(amrap, entries, DAY, {}), { total: null, done: 1 });
  assert.deepEqual(setDots(plank, entries, DAY, {}), { total: null, done: 1 });
});

test('setDots ignores deleted, warm-up and other-day sets; done is raw (may exceed total)', () => {
  const entries = [
    set('Bench'), set('Bench', { deletedAt: 5 }), set('Bench', { kind: 'warmup' }), set('Bench', { date: '2026-01-06' }),
  ];
  assert.equal(setDots(bench, entries, DAY, {}).done, 1);
  const many = Array.from({ length: 5 }, () => set('Bench'));
  assert.deepEqual(setDots(bench, many, DAY, {}), { total: 3, done: 5 });
});

test('sessionProgress sums known totals and clamps overshoot', () => {
  const entries = [set('Bench'), set('Bench'), set('Squat')];
  const squat = { name: 'Squat', target: '4 x 5' };
  assert.deepEqual(sessionProgress([bench, squat], entries, DAY, {}), { done: 3, total: 7 });
  assert.deepEqual(sessionProgress([bench, squat], entries, DAY, { [trimKey(DAY, 'Squat')]: 2 }), { done: 3, total: 5 });
  const many = Array.from({ length: 6 }, () => set('Bench'));
  assert.deepEqual(sessionProgress([bench], many, DAY, {}), { done: 3, total: 3 });
});

test('sessionProgress skips null-total exercises and handles empty input', () => {
  const entries = [set('Bench'), set('Dips'), set('Dips')];
  assert.deepEqual(sessionProgress([bench, amrap, plank], entries, DAY, {}), { done: 1, total: 3 });
  assert.deepEqual(sessionProgress([], entries, DAY, {}), { done: 0, total: 0 });
  assert.deepEqual(sessionProgress(null, entries, DAY, {}), { done: 0, total: 0 });
});

const d = (date) => ({ date, count: 1, sessions: [] });

test('groupHistoryDays splits on Monday week boundaries', () => {
  // 2026-01-07 is a Wednesday; this week starts Mon 2026-01-05, last week Mon 2025-12-29
  const days = ['2026-01-07', '2026-01-05', '2026-01-04', '2025-12-29', '2025-12-28', '2025-12-20'].map(d);
  const g = groupHistoryDays(days, '2026-01-07');
  assert.deepEqual(g.map((x) => x.label), ['This week', 'Last week', 'Earlier']);
  assert.deepEqual(g[0].days.map((x) => x.date), ['2026-01-07', '2026-01-05']); // Monday is this week
  assert.deepEqual(g[1].days.map((x) => x.date), ['2026-01-04', '2025-12-29']); // Sunday is last week
  assert.deepEqual(g[2].days.map((x) => x.date), ['2025-12-28', '2025-12-20']);
});

test('groupHistoryDays when today is a Sunday and 8 days ago', () => {
  // 2026-01-11 is Sunday: week is Mon 01-05..Sun 01-11
  const g = groupHistoryDays([d('2026-01-11'), d('2026-01-05'), d('2026-01-03')], '2026-01-11');
  assert.deepEqual(g.map((x) => x.label), ['This week', 'Last week']);
  const eight = groupHistoryDays([d('2026-01-03')], '2026-01-11'); // 8 days ago, Saturday of last week
  assert.deepEqual(eight.map((x) => x.label), ['Last week']);
  const far = groupHistoryDays([d('2025-12-27')], '2026-01-07');
  assert.deepEqual(far.map((x) => x.label), ['Earlier']);
});

test('groupHistoryDays omits empty groups and handles no days', () => {
  assert.deepEqual(groupHistoryDays([], '2026-01-07'), []);
  assert.deepEqual(groupHistoryDays([d('2026-01-06')], '2026-01-07').map((x) => x.label), ['This week']);
});

test('exerciseList index scheme', () => {
  const session = { id: 'upper_a', name: 'Upper A', exercises: [{ name: 'A' }, { name: 'B' }] };
  const extras = [{ name: 'X' }];
  const cali = { name: 'Calisthenics push', exercises: [{ name: 'P1' }, { name: 'P2' }] };
  const all = exerciseList(session, extras, cali);
  assert.deepEqual(all.map((r) => [r.ex.name, r.i, r.kind, r.sessionKey]), [
    ['A', 0, 'template', 'upper_a'], ['B', 1, 'template', 'upper_a'],
    ['X', 2, 'extra', 'upper_a'],
    ['P1', 3, 'cali', 'Calisthenics push'], ['P2', 4, 'cali', 'Calisthenics push'],
  ]);
});

test('exerciseList handles missing extras and caliBlock', () => {
  const session = { id: 'lower', name: 'Lower', exercises: [{ name: 'A' }] };
  assert.equal(exerciseList(session, null, null).length, 1);
  assert.equal(exerciseList(session, undefined, undefined)[0].i, 0);
  const cali = { name: 'Calisthenics pull', exercises: [{ name: 'P' }] };
  const r = exerciseList(session, null, cali);
  assert.deepEqual(r.map((x) => [x.i, x.kind]), [[0, 'template'], [1, 'cali']]);
});
