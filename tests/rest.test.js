import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clampRest, fmt, remaining, toWheel, fromWheel, normalizeRest, loadRest, saveRest, REST_KEY, PRESETS, MAX_REST } from '../src/logic/rest.js';

const store = (init = {}) => { const m = { ...init }; return { m, getItem: (k) => m[k] ?? null, setItem: (k, v) => { m[k] = v; } }; };

test('clampRest: rounds, limits to 5..600 seconds, junk gives 90', () => {
  assert.equal(clampRest(89.6), 90);
  assert.equal(clampRest(1), 5);
  assert.equal(clampRest(9999), MAX_REST);
  assert.equal(clampRest('abc'), 90);
  assert.equal(clampRest(undefined), 90);
});

test('fmt: minutes and zero-padded seconds', () => {
  assert.equal(fmt(90), '1:30');
  assert.equal(fmt(60), '1:00');
  assert.equal(fmt(5), '0:05');
  assert.equal(fmt(600), '10:00');
});

test('remaining: counts up to the end, never below 0, 0 when idle', () => {
  assert.equal(remaining(10_000, 0), 10);
  assert.equal(remaining(10_001, 0), 11);
  assert.equal(remaining(10_000, 20_000), 0);
  assert.equal(remaining(null, 0), 0);
});

test('wheel: seconds to positions and back, every preset round-trips', () => {
  assert.deepEqual(toWheel(90), { minIndex: 1, secIndex: 6 });
  assert.deepEqual(toWheel(5), { minIndex: 0, secIndex: 1 });
  assert.equal(fromWheel(1, 6), 90);
  assert.equal(fromWheel(10, 0), 600);
  assert.equal(fromWheel(10, 11), MAX_REST); // 10:55 is clamped
  assert.equal(fromWheel(0, 0), 5); // 0:00 is clamped up to the minimum
  for (const s of PRESETS) { const w = toWheel(s); assert.equal(fromWheel(w.minIndex, w.secIndex), s); }
});

test('normalizeRest: defaults, a still-running timer is kept, an ended one goes idle', () => {
  assert.deepEqual(normalizeRest(null, 1000), { seconds: 90, auto: true, endAt: null, total: null });
  assert.deepEqual(normalizeRest({ seconds: 120, auto: false, endAt: 5000, total: 120 }, 1000), { seconds: 120, auto: false, endAt: 5000, total: 120 });
  assert.equal(normalizeRest({ seconds: 120, endAt: 500, total: 120 }, 1000).endAt, null);
  assert.equal(normalizeRest({ seconds: 'x' }, 0).seconds, 90);
});

test('loadRest and saveRest: round trip, bad JSON and blocked storage never throw', () => {
  const s = store();
  assert.equal(saveRest(s, { seconds: 150, auto: false, endAt: null, total: null }), true);
  assert.equal(loadRest(s, 0).seconds, 150);
  assert.equal(loadRest(store({ [REST_KEY]: '{bad' }), 0).seconds, 90);
  assert.equal(saveRest({ setItem() { throw new Error('blocked'); } }, {}), false);
  assert.equal(loadRest({ getItem() { throw new Error('blocked'); } }, 0).seconds, 90);
});
