import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addHabit, toggleCheck, isChecked, currentStreak, normalizeName } from '../src/logic/habits.js';
import { isDirty, buildExport } from '../src/logic/exportBuilder.js';
import { markExported, planWipe } from '../src/logic/wipeEligibility.js';

const water = { id: 'water', name: 'Water' };
const T = (day, h = 12) => Date.parse(`2026-11-${String(day).padStart(2, '0')}T${h}:00:00`);

test('add habit: trims, rejects empty, too long and duplicates (any case)', () => {
  let r = addHabit([], '  Cold   shower ');
  assert.equal(r.habit.name, 'Cold shower');
  assert.equal(addHabit(r.habits, 'cold shower').error.includes('already'), true);
  assert.ok(addHabit([], '   ').error);
  assert.ok(addHabit([], 'x'.repeat(41)).error);
  assert.equal(normalizeName(null), null);
});

test('first check creates one stable-id entry; inputs are not mutated', () => {
  const entries = [];
  const e = toggleCheck(entries, water, '2026-11-08', T(8));
  assert.equal(e.id, 'hc-water-2026-11-08');
  assert.deepEqual(e.data, { habit: 'Water', done: true });
  assert.equal(entries.length, 0);
  assert.equal(isChecked([e], water, '2026-11-08'), true);
});

test('uncheck then recheck reuses the same entry id (no duplicates)', () => {
  const a = toggleCheck([], water, '2026-11-08', T(8, 9));
  const b = toggleCheck([a], water, '2026-11-08', T(8, 10));
  assert.equal(b.deletedAt, T(8, 10));
  assert.equal(isChecked([b], water, '2026-11-08'), false);
  const c = toggleCheck([b], water, '2026-11-08', T(8, 11));
  assert.equal(c.id, a.id);
  assert.equal(c.deletedAt, null);
  assert.equal(isChecked([c], water, '2026-11-08'), true);
});

test('unchecking a never-exported check removes it from the export', () => {
  const a = toggleCheck([], water, '2026-11-08', T(8));
  const b = toggleCheck([a], water, '2026-11-08', T(8, 13));
  assert.equal(isDirty(b), false);
  assert.equal(buildExport([b], { now: T(9) }), null);
});

test('unchecking an exported check re-exports it as not done and blocks its wipe', () => {
  const a = toggleCheck([], water, '2026-11-01', T(1));
  const built = buildExport([a], { now: T(2) });
  const [stamped] = markExported([a], built.manifest, T(2));
  const b = toggleCheck([stamped], water, '2026-11-01', T(3));
  assert.equal(b.deletedAt, null);
  assert.equal(b.data.done, false);
  assert.equal(isDirty(b), true);
  assert.match(buildExport([b], { now: T(3) }).markdown, /- \[ \] Water/);
  const plan = planWipe([b], built.manifest, { now: T(20), keepDays: 0 });
  assert.equal(plan.count, 0);
});

test('checking today after an export leaves the exported entry alone and adds a waiting one', () => {
  const old = toggleCheck([], water, '2026-11-01', T(1));
  const built = buildExport([old], { now: T(2) });
  const [stamped] = markExported([old], built.manifest, T(2));
  const today = toggleCheck([stamped], water, '2026-11-08', T(8));
  assert.equal(isDirty(stamped), false);
  assert.equal(isDirty(today), true);
});

test('streak: counts back from today, or from yesterday when today is not done', () => {
  const mk = (days) => days.map((d) => toggleCheck([], water, `2026-11-0${d}`, T(d)));
  assert.equal(currentStreak(mk([6, 7, 8]), water, '2026-11-08'), 3);
  assert.equal(currentStreak(mk([6, 7]), water, '2026-11-08'), 2);
  assert.equal(currentStreak(mk([5, 7, 8]), water, '2026-11-08'), 2);
  assert.equal(currentStreak(mk([5]), water, '2026-11-08'), 0);
  assert.equal(currentStreak([], water, '2026-11-08'), 0);
});

test('streak ignores deleted and not-done checks and other habits', () => {
  const a = toggleCheck([], water, '2026-11-08', T(8));
  const gone = toggleCheck([a], water, '2026-11-08', T(8, 13));
  const other = toggleCheck([], { id: 'read', name: 'Read' }, '2026-11-07', T(7));
  assert.equal(currentStreak([gone, other], water, '2026-11-08'), 0);
});

test('streak crosses a month boundary', () => {
  const days = ['2026-10-30', '2026-10-31', '2026-11-01'];
  const entries = days.map((d) => toggleCheck([], water, d, Date.parse(`${d}T12:00:00`)));
  assert.equal(currentStreak(entries, water, '2026-11-01'), 3);
});
