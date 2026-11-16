import { test } from 'node:test';
import assert from 'node:assert/strict';
import { platesFor, normalizePlates, loadPlates, savePlates, DEFAULT_PLATES, PLATES_KEY } from '../src/logic/plates.js';

const stub = () => { const m = {}; return { getItem: (k) => m[k] ?? null, setItem: (k, v) => { m[k] = v; }, m }; };

test('platesFor: 225 on a 45 bar is two 45s a side', () => {
  const r = platesFor(225, DEFAULT_PLATES);
  assert.deepEqual(r.perSide, [{ plate: 45, count: 2 }]);
  assert.equal(r.short, 0);
  assert.equal(r.loaded, 225);
});

test('platesFor: mixes plates, handles 2.5s, and the bar alone', () => {
  assert.deepEqual(platesFor(140, DEFAULT_PLATES).perSide, [{ plate: 45, count: 1 }, { plate: 2.5, count: 1 }]);
  assert.deepEqual(platesFor(45, DEFAULT_PLATES).perSide, []);
});

test('platesFor: reports the shortfall when the owned plates cannot hit the weight', () => {
  const r = platesFor(136, DEFAULT_PLATES); // 45.5 per side, smallest plate 2.5
  assert.equal(r.loaded, 135);
  assert.equal(r.short, 1);
  const only = platesFor(100, { bar: 45, owned: [45] });
  assert.equal(only.loaded, 45); // 27.5 per side: no 45 fits
  assert.deepEqual(only.perSide, []);
  assert.equal(only.short, 55);
});

test('platesFor: validates input and uses a custom bar', () => {
  assert.match(platesFor('', DEFAULT_PLATES).error, /weight/);
  assert.match(platesFor(30, DEFAULT_PLATES).error, /bar alone is 45/);
  assert.deepEqual(platesFor(35, { bar: 15, owned: [10] }).perSide, [{ plate: 10, count: 1 }]);
});

test('normalizePlates falls back to defaults on bad input and drops unknown plates', () => {
  assert.deepEqual(normalizePlates(null), DEFAULT_PLATES);
  assert.deepEqual(normalizePlates({ bar: 'x', owned: [] }), DEFAULT_PLATES);
  assert.deepEqual(normalizePlates({ bar: 35, owned: [7, 25, 45] }), { bar: 35, owned: [45, 25] });
  assert.equal(normalizePlates({ bar: 0 }).bar, 0);
});

test('load and save round-trip, and a blocked storage never throws', () => {
  const s = stub();
  assert.deepEqual(loadPlates(s), DEFAULT_PLATES);
  assert.equal(savePlates(s, { bar: 35, owned: [45, 10] }), true);
  assert.ok(s.m[PLATES_KEY]);
  assert.deepEqual(loadPlates(s), { bar: 35, owned: [45, 10] });
  const blocked = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); } };
  assert.deepEqual(loadPlates(blocked), DEFAULT_PLATES);
  assert.equal(savePlates(blocked, DEFAULT_PLATES), false);
});
