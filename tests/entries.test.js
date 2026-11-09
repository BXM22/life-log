import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseWeight, parseGuitar, parseEdit, editEntry, deleteEntry, liveEntries, weightHistory } from '../src/logic/entries.js';
import { isDirty, buildExport } from '../src/logic/exportBuilder.js';
import { markExported, planWipe } from '../src/logic/wipeEligibility.js';

const mk = (over = {}) => ({
  id: 'a', type: 'weigh_in', date: '2026-11-01', data: { weight_lb: 180 },
  updatedAt: 1000, exportedAt: null, exportId: null, deletedAt: null, ...over,
});

test('parseWeight: accepts 50 to 600, rounds to 0.1, rejects blank and out of range', () => {
  assert.equal(parseWeight('180.04').value, 180);
  assert.equal(parseWeight('180.06').value, 180.1);
  for (const bad of ['', '  ', 'abc', '49', '601', null]) assert.ok(parseWeight(bad).error, String(bad));
});

test('parseGuitar: minutes required, focus defaults, BPM optional and range checked', () => {
  assert.deepEqual(parseGuitar({ minutes: '30', focus: '  scales  up ', bpm: '' }).data, { minutes: 30, focus: 'scales up', best_bpm: null });
  assert.equal(parseGuitar({ minutes: '30', focus: '', bpm: '' }).data.focus, 'practice');
  assert.equal(parseGuitar({ minutes: '30', focus: 'x', bpm: '120' }).data.best_bpm, 120);
  for (const m of ['', '0', '601', '1.5', 'abc']) assert.ok(parseGuitar({ minutes: m }).error, `minutes ${m}`);
  for (const b of ['19', '401', '99.5', 'fast']) assert.ok(parseGuitar({ minutes: '10', bpm: b }).error, `bpm ${b}`);
  assert.ok(parseGuitar({ minutes: '10', focus: 'x'.repeat(41) }).error);
});

test('parseEdit: handles each entry type', () => {
  assert.deepEqual(parseEdit(mk(), { weight: '181' }).data, { weight_lb: 181 });
  assert.ok(parseEdit(mk(), { weight: '5' }).error);
  assert.equal(parseEdit(mk({ type: 'guitar' }), { minutes: '20', focus: '', bpm: '' }).data.minutes, 20);
  assert.deepEqual(parseEdit(mk({ type: 'habit_check' }), { done: false }).data, { done: false });
  assert.ok(parseEdit(mk({ type: 'other' }), {}).error);
});

test('editEntry: does not mutate, merges data, and is strictly newer than the export', () => {
  const e = mk({ updatedAt: 5000, exportedAt: 5000, exportId: 'x' });
  const edited = editEntry(e, { weight_lb: 181 }, 4000); // clock behind the export
  assert.equal(e.data.weight_lb, 180);
  assert.equal(edited.data.weight_lb, 181);
  assert.ok(edited.updatedAt > edited.exportedAt);
  assert.ok(isDirty(edited));
});

test('an exported entry that is edited exports again and is never wiped until re-exported', () => {
  const now = Date.parse('2026-11-20T12:00:00');
  const first = buildExport([mk()], { now });
  const exported = markExported([mk()], first.manifest, now);
  const edited = editEntry(exported[0], { weight_lb: 179 }, now);
  assert.ok(buildExport([edited], { now: now + 1, existingFilenames: [first.filename] }));
  assert.equal(planWipe([edited], first.manifest, { now, keepDays: 0 }).count, 0);
});

test('deleteEntry: tombstone, hidden from live entries, never dirty, newer so a restore cannot revive it', () => {
  const e = mk({ updatedAt: 5000 });
  const gone = deleteEntry(e, 1);
  assert.ok(gone.deletedAt);
  assert.ok(gone.updatedAt > e.updatedAt);
  assert.equal(isDirty(gone), false);
  assert.deepEqual(liveEntries([e, gone]), [e]);
  assert.equal(e.deletedAt, null);
});

test('weightHistory: newest first, one per day, latest edit wins, deleted skipped, wiped days come from stats', () => {
  const entries = [
    mk({ id: '1', date: '2026-11-03', data: { weight_lb: 181 }, updatedAt: 10 }),
    mk({ id: '2', date: '2026-11-03', data: { weight_lb: 182 }, updatedAt: 20 }),
    mk({ id: '3', date: '2026-11-04', data: { weight_lb: 150 }, updatedAt: 30, deletedAt: 31 }),
    mk({ id: '4', date: '2026-11-05', data: { weight_lb: 183 }, updatedAt: 40 }),
  ];
  const stats = { weighIns: [{ date: '2026-11-01', weight_lb: 184 }, { date: '2026-11-03', weight_lb: 999 }] };
  assert.deepEqual(weightHistory(entries, stats), [
    { date: '2026-11-05', weight_lb: 183 },
    { date: '2026-11-03', weight_lb: 182 },
    { date: '2026-11-01', weight_lb: 184 },
  ]);
  assert.deepEqual(weightHistory([], null), []);
});
