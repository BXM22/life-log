import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildExport, exportFilename, isDirty } from '../src/logic/exportBuilder.js';
import { markExported, planWipe } from '../src/logic/wipeEligibility.js';

// Noon local on 2026-11-08, so day-start math is unambiguous.
const NOW = new Date(2026, 10, 8, 12, 0).getTime();
const T0 = new Date(2026, 10, 1, 9, 0).getTime();

const entry = (id, date, over = {}) => ({
  id,
  type: 'weigh_in',
  date,
  data: { weight_lb: 182.6 },
  updatedAt: T0,
  exportedAt: null,
  exportId: null,
  deletedAt: null,
  ...over,
});

test('nothing waiting means no export', () => {
  assert.equal(buildExport([entry('a', '2026-11-01', { exportedAt: T0 + 1 })], { now: NOW }), null);
});

test('same-day exports get -2, -3', () => {
  assert.equal(exportFilename(NOW), 'life-log-2026-11-08.md');
  assert.equal(exportFilename(NOW, ['life-log-2026-11-08.md']), 'life-log-2026-11-08-2.md');
  assert.equal(
    exportFilename(NOW, ['life-log-2026-11-08.md', 'life-log-2026-11-08-2.md']),
    'life-log-2026-11-08-3.md',
  );
});

test('export markdown has header, day sections and latest weigh-in wins', () => {
  const entries = [
    entry('w1', '2026-11-01', { updatedAt: T0 }),
    entry('w2', '2026-11-01', { updatedAt: T0 + 5, data: { weight_lb: 181.9 } }),
    entry('g1', '2026-11-01', { type: 'guitar', data: { minutes: 20, focus: 'technique', best_bpm: 96 } }),
    entry('h1', '2026-11-01', { type: 'habit_check', data: { habit: 'Water', done: true } }),
  ];
  const { markdown, manifest } = buildExport(entries, { now: NOW });
  assert.match(markdown, /type: life-log-export/);
  assert.match(markdown, /range: 2026-11-01 to 2026-11-01/);
  assert.match(markdown, /- \[x\] Water/);
  assert.match(markdown, /Bodyweight: 181.9 lb/);
  assert.doesNotMatch(markdown, /182.6/);
  assert.match(markdown, /20 min, focus: technique, best BPM: 96/);
  assert.equal(manifest.items.length, 4); // superseded weigh-in is still in the manifest
});

test('building an export does not mark anything exported', () => {
  const entries = [entry('a', '2026-11-01')];
  buildExport(entries, { now: NOW });
  assert.equal(entries[0].exportedAt, null);
});

test('confirmed export is wipeable once older than the keep window', () => {
  const entries = [entry('old', '2026-11-01'), entry('recent', '2026-11-06')];
  const { manifest } = buildExport(entries, { now: NOW });
  const confirmed = markExported(entries, manifest, NOW);
  const plan = planWipe(confirmed, manifest, { now: NOW, keepDays: 7 });
  assert.deepEqual(plan.ids, ['old']);
  assert.deepEqual(plan.range, { from: '2026-11-01', to: '2026-11-01' });
});

test('unconfirmed export wipes nothing', () => {
  const entries = [entry('old', '2026-11-01')];
  const { manifest } = buildExport(entries, { now: NOW });
  assert.equal(planWipe(entries, manifest, { now: NOW, keepDays: 7 }).count, 0);
});

test('entry edited between build and confirm stays dirty and is not wiped', () => {
  const entries = [entry('a', '2026-11-01'), entry('b', '2026-11-01')];
  const { manifest } = buildExport(entries, { now: NOW });
  entries[1] = { ...entries[1], updatedAt: NOW - 1, data: { weight_lb: 180 } };
  const confirmed = markExported(entries, manifest, NOW);
  assert.equal(isDirty(confirmed[1]), true);
  assert.deepEqual(planWipe(confirmed, manifest, { now: NOW, keepDays: 7 }).ids, ['a']);
});

test('entry edited after confirm becomes dirty and is not wiped', () => {
  const entries = [entry('a', '2026-11-01')];
  const { manifest } = buildExport(entries, { now: NOW });
  const confirmed = markExported(entries, manifest, NOW);
  const edited = [{ ...confirmed[0], updatedAt: NOW + 1000 }];
  assert.equal(isDirty(edited[0]), true);
  assert.equal(planWipe(edited, manifest, { now: NOW + 2000, keepDays: 7 }).count, 0);
});

test('entry logged after the export is never in its wipe set', () => {
  const entries = [entry('a', '2026-11-01')];
  const { manifest } = buildExport(entries, { now: NOW });
  const confirmed = markExported(entries, manifest, NOW);
  const later = [...confirmed, entry('late', '2026-11-01', { updatedAt: NOW + 5 })];
  assert.deepEqual(planWipe(later, manifest, { now: NOW + 10, keepDays: 7 }).ids, ['a']);
});

test('entries from a different export are not wiped', () => {
  const entries = [entry('a', '2026-11-01')];
  const { manifest } = buildExport(entries, { now: NOW });
  const confirmed = markExported(entries, manifest, NOW);
  const other = { ...manifest, exportId: 'life-log-2026-11-09' };
  assert.equal(planWipe(confirmed, other, { now: NOW, keepDays: 7 }).count, 0);
});

test('keepDays 0 wipes everything exported, including today', () => {
  const entries = [entry('today', '2026-11-08', { updatedAt: NOW - 1000 })];
  const { manifest } = buildExport(entries, { now: NOW });
  const confirmed = markExported(entries, manifest, NOW);
  assert.equal(planWipe(confirmed, manifest, { now: NOW, keepDays: 0 }).count, 1);
  assert.equal(planWipe(confirmed, manifest, { now: NOW, keepDays: 7 }).count, 0);
});

test('keep window edge: 7 days keeps the last 7 logical days', () => {
  const entries = [entry('d1', '2026-11-01'), entry('d2', '2026-11-02')];
  const { manifest } = buildExport(entries, { now: NOW });
  const confirmed = markExported(entries, manifest, NOW);
  // today = 2026-11-08; keep 11-02..11-08, wipe 11-01 and earlier
  assert.deepEqual(planWipe(confirmed, manifest, { now: NOW, keepDays: 7 }).ids, ['d1']);
});

test('day start: 1 AM on the 8th still counts as the 7th', () => {
  const oneAm = new Date(2026, 10, 8, 1, 0).getTime();
  const entries = [entry('a', '2026-11-01'), entry('b', '2026-11-01')];
  const { manifest } = buildExport(entries, { now: oneAm });
  const confirmed = markExported(entries, manifest, oneAm);
  // logical today = 11-07, so 11-01 is exactly 6 days back and is kept at keepDays 7
  assert.equal(planWipe(confirmed, manifest, { now: oneAm, keepDays: 7, dayStartHour: 4 }).count, 0);
  assert.equal(planWipe(confirmed, manifest, { now: oneAm, keepDays: 6, dayStartHour: 4 }).count, 2);
});

test('deleted entries are never exported', () => {
  assert.equal(isDirty(entry('x', '2026-11-01', { deletedAt: NOW })), false);
});
