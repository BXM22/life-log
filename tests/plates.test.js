import { test } from 'node:test';
import assert from 'node:assert/strict';
import { platesFor, normalizePlates, loadPlates, savePlates, DEFAULT_PLATES, PLATES_KEY, MAX_PAIRS } from '../src/logic/plates.js';

const stub = () => { const m = {}; return { getItem: (k) => m[k] ?? null, setItem: (k, v) => { m[k] = v; }, m }; };
const own = (counts, bar = 45) => normalizePlates({ bar, owned: counts });

test('platesFor: 225 on a 45 bar is two 45s a side', () => {
  const r = platesFor(225, DEFAULT_PLATES);
  assert.deepEqual(r.perSide, [{ plate: 45, count: 2 }]);
  assert.equal(r.short, 0);
  assert.equal(r.loaded, 225);
  assert.equal(r.up, null);
});

test('platesFor: mixes plates, handles 2.5s, and the bar alone', () => {
  assert.deepEqual(platesFor(140, DEFAULT_PLATES).perSide, [{ plate: 45, count: 1 }, { plate: 2.5, count: 1 }]);
  assert.deepEqual(platesFor(45, DEFAULT_PLATES).perSide, []);
});

test('platesFor: only spends the pairs you own', () => {
  const two45 = own({ 45: 2, 10: 1, 5: 1 });
  const r = platesFor(365, two45); // 160 per side: two 45s is the limit, then 10 and 5
  assert.equal(r.loaded, 45 + 2 * (90 + 10 + 5));
  assert.deepEqual(r.perSide, [{ plate: 45, count: 2 }, { plate: 10, count: 1 }, { plate: 5, count: 1 }]);
  assert.equal(r.short, 365 - r.loaded);
});

test('platesFor: uses smaller plates when the big ones run out, with the fewest plates', () => {
  const r = platesFor(205, own({ 45: 1, 25: 2, 10: 2 })); // 80 per side
  assert.equal(r.short, 0);
  assert.deepEqual(r.perSide, [{ plate: 45, count: 1 }, { plate: 25, count: 1 }, { plate: 10, count: 1 }]);
});

test('platesFor: reports the shortfall and the next total up', () => {
  const r = platesFor(136, DEFAULT_PLATES); // 45.5 per side, smallest plate 2.5
  assert.equal(r.loaded, 135);
  assert.equal(r.short, 1);
  assert.equal(r.up.total, 140);
  assert.deepEqual(r.up.perSide, [{ plate: 45, count: 1 }, { plate: 2.5, count: 1 }]);
  const only = platesFor(100, own({ 45: 1 })); // 27.5 per side: no 45 fits
  assert.equal(only.loaded, 45);
  assert.deepEqual(only.perSide, []);
  assert.equal(only.short, 55);
  assert.equal(only.up.total, 135);
});

test('platesFor: no next total up when nothing heavier is owned', () => {
  const r = platesFor(400, own({ 45: 2 }));
  assert.equal(r.loaded, 225);
  assert.equal(r.up, null);
});

test('platesFor: validates input and uses a custom bar', () => {
  assert.match(platesFor('', DEFAULT_PLATES).error, /weight/);
  assert.match(platesFor(30, DEFAULT_PLATES).error, /bar alone is 45/);
  assert.deepEqual(platesFor(35, own({ 10: 1 }, 15)).perSide, [{ plate: 10, count: 1 }]);
});

test('normalizePlates: defaults, clamps pair counts, and reads the old list format', () => {
  assert.deepEqual(normalizePlates(null), DEFAULT_PLATES);
  assert.deepEqual(normalizePlates({ bar: 'x', owned: {} }), DEFAULT_PLATES);
  const n = normalizePlates({ bar: 35, owned: { 45: 99, 25: -3, 10: 2.9, 7: 5 } });
  assert.equal(n.bar, 35);
  assert.equal(n.owned[45], MAX_PAIRS);
  assert.equal(n.owned[25], 0);
  assert.equal(n.owned[10], 2);
  assert.equal(n.owned[7], undefined);
  const legacy = normalizePlates({ bar: 45, owned: [45, 10, 7] });
  assert.ok(legacy.owned[45] > 0 && legacy.owned[10] > 0);
  assert.equal(legacy.owned[25], 0);
  assert.equal(normalizePlates({ bar: 0 }).bar, 0);
});

test('load and save round-trip, and a blocked storage never throws', () => {
  const s = stub();
  assert.deepEqual(loadPlates(s), DEFAULT_PLATES);
  const mine = own({ 45: 3, 10: 2 }, 35);
  assert.equal(savePlates(s, mine), true);
  assert.ok(s.m[PLATES_KEY]);
  assert.deepEqual(loadPlates(s), mine);
  s.setItem(PLATES_KEY, JSON.stringify({ bar: 45, owned: [45, 25] })); // an older save still loads
  assert.ok(loadPlates(s).owned[45] > 0);
  const blocked = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); } };
  assert.deepEqual(loadPlates(blocked), DEFAULT_PLATES);
  assert.equal(savePlates(blocked, DEFAULT_PLATES), false);
});
