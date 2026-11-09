import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildBackup, backupFilename, parseBackup, mergeBackup } from '../src/logic/backup.js';

const entry = (id, updatedAt, extra = {}) => ({
  id, type: 'weigh_in', date: '2026-11-07', data: { weight_lb: 180 },
  updatedAt, exportedAt: null, exportId: null, deletedAt: null, ...extra,
});
const habit = { id: 'water', name: 'Water' };
const exp = { filename: 'life-log-2026-11-08.md', exportId: 'life-log-2026-11-08', confirmedAt: 5 };

test('filename uses the local date', () => {
  assert.match(backupFilename(new Date(2026, 10, 8, 12).getTime()), /^life-log-backup-2026-11-08\.json$/);
});

test('round trip: build, stringify, parse gives the same data', () => {
  const data = { entries: [entry('a', 1)], habits: [habit], exports: [exp] };
  const parsed = parseBackup(JSON.stringify(buildBackup(data, 99)));
  assert.deepEqual(parsed.entries, data.entries);
  assert.deepEqual(parsed.habits, data.habits);
  assert.deepEqual(parsed.exports, data.exports);
  assert.equal(parsed.createdAt, 99);
});

test('rejects wrong schemaVersion, bad JSON and malformed entries', () => {
  assert.throws(() => parseBackup('{nope'), /not valid JSON/);
  assert.throws(() => parseBackup(JSON.stringify({ schemaVersion: 2, entries: [] })), /Unsupported backup version 2/);
  assert.throws(() => parseBackup(JSON.stringify({ schemaVersion: 1 })), /missing its entries/);
  assert.throws(() => parseBackup(JSON.stringify({ schemaVersion: 1, entries: [{ id: 'x', type: 'bogus', date: '2026-11-07', data: {}, updatedAt: 1 }] })), /unknown type/);
  assert.throws(() => parseBackup(JSON.stringify({ schemaVersion: 1, entries: [entry('x', 1, { date: 'yesterday' })] })), /bad date/);
});

test('merge: the newer updatedAt wins in both directions', () => {
  const current = { entries: [entry('a', 10, { data: { weight_lb: 181 } })], habits: [], exports: [] };
  const older = { entries: [entry('a', 5, { data: { weight_lb: 170 } })], habits: [], exports: [] };
  assert.equal(mergeBackup(current, older).entries[0].data.weight_lb, 181);
  const newer = { entries: [entry('a', 20, { data: { weight_lb: 175 } })], habits: [], exports: [] };
  assert.equal(mergeBackup(current, newer).entries[0].data.weight_lb, 175);
});

test('merge: a tie keeps the current copy', () => {
  const current = { entries: [entry('a', 10, { data: { weight_lb: 181 } })] };
  const tie = { entries: [entry('a', 10, { data: { weight_lb: 999 } })] };
  assert.equal(mergeBackup(current, tie).entries[0].data.weight_lb, 181);
});

test('merge never deletes: entries, habits and exports missing from the backup stay', () => {
  const current = { entries: [entry('keep', 1)], habits: [habit], exports: [exp] };
  const merged = mergeBackup(current, { entries: [entry('new', 2)], habits: [], exports: [] });
  assert.deepEqual(merged.entries.map((e) => e.id).sort(), ['keep', 'new']);
  assert.equal(merged.habits.length, 1);
  assert.equal(merged.exports.length, 1);
});

test('merge into an empty database restores everything', () => {
  const backup = { entries: [entry('a', 1)], habits: [habit], exports: [exp] };
  const merged = mergeBackup({ entries: [], habits: [], exports: [] }, backup);
  assert.equal(merged.entries.length, 1);
  assert.equal(merged.habits.length, 1);
  assert.equal(merged.exports.length, 1);
});

test('restored exported entries keep exportedAt and exportId', () => {
  const exported = entry('a', 3, { exportedAt: 7, exportId: 'life-log-2026-11-08' });
  const merged = mergeBackup({ entries: [], habits: [], exports: [] }, { entries: [exported], habits: [], exports: [] });
  assert.equal(merged.entries[0].exportedAt, 7);
  assert.equal(merged.entries[0].exportId, 'life-log-2026-11-08');
});

test('merge does not mutate its inputs', () => {
  const current = { entries: [entry('a', 1)], habits: [], exports: [] };
  const backup = { entries: [entry('a', 9)], habits: [], exports: [] };
  const before = JSON.stringify([current, backup]);
  mergeBackup(current, backup);
  assert.equal(JSON.stringify([current, backup]), before);
});
