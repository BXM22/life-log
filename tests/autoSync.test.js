import { test } from 'node:test';
import assert from 'node:assert/strict';
import { autoSyncDue, finishedDayEntries, loadAutoSync, saveAutoSync, RETRY_MS } from '../src/logic/autoSync.js';

const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v) }; };
const e = (over) => ({ id: 'a', type: 'weigh_in', date: '2026-11-17', updatedAt: 5, exportedAt: null, ...over });
const base = { enabled: true, connected: true, busy: false, today: '2026-11-18', now: 10 * RETRY_MS, lastTryAt: 0 };

test('due for an unexported entry from a finished day', () => {
  assert.equal(autoSyncDue({ ...base, entries: [e()] }), true);
});

test('not due for today, notes, exported or deleted entries', () => {
  assert.equal(autoSyncDue({ ...base, entries: [e({ date: '2026-11-18' })] }), false);
  assert.equal(autoSyncDue({ ...base, entries: [e({ type: 'note' })] }), false);
  assert.equal(autoSyncDue({ ...base, entries: [e({ exportedAt: 9 })] }), false);
  assert.equal(autoSyncDue({ ...base, entries: [e({ deletedAt: 9 })] }), false);
});

test('due again when an exported entry was edited afterwards', () => {
  assert.equal(autoSyncDue({ ...base, entries: [e({ exportedAt: 4, updatedAt: 5 })] }), true);
});

test('off, disconnected, busy or inside the retry wait: not due', () => {
  const entries = [e()];
  assert.equal(autoSyncDue({ ...base, entries, enabled: false }), false);
  assert.equal(autoSyncDue({ ...base, entries, connected: false }), false);
  assert.equal(autoSyncDue({ ...base, entries, busy: true }), false);
  assert.equal(autoSyncDue({ ...base, entries, lastTryAt: base.now - RETRY_MS + 1 }), false);
  assert.equal(autoSyncDue({ ...base, entries, lastTryAt: base.now - RETRY_MS }), true);
});

test('finishedDayEntries keeps only days before today', () => {
  const list = [e({ id: 'x' }), e({ id: 'y', date: '2026-11-18' })];
  assert.deepEqual(finishedDayEntries(list, '2026-11-18').map((x) => x.id), ['x']);
});

test('flag defaults on, persists, blocked storage does not throw', () => {
  const s = mem();
  assert.equal(loadAutoSync(s), true);
  assert.equal(saveAutoSync(s, false), true);
  assert.equal(loadAutoSync(s), false);
  const bad = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); } };
  assert.equal(loadAutoSync(bad), true);
  assert.equal(saveAutoSync(bad, false), false);
});
