import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadLibrary, saveLibrary, saveToLibrary, removeFromLibrary, autofillFor, findInLibrary } from '../src/logic/library.js';

const mem = (init) => { const m = new Map(init); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }; };
const curl = { name: 'Bicep curl', mode: 'weight', warmup: 'none', target: '3 x 8-12', equipment: 'dumbbell' };

test('save keeps the fields, sorts by name, and replaces a same-name entry in place', () => {
  let r = saveToLibrary([], curl);
  assert.deepEqual(r.list, [curl]); assert.equal(r.updated, false);
  r = saveToLibrary(r.list, { name: 'Abs', mode: 'timed', perSide: true });
  assert.deepEqual(r.list.map((e) => e.name), ['Abs', 'Bicep curl']);
  assert.equal(r.list[0].perSide, true);
  const u = saveToLibrary(r.list, { ...curl, name: 'bicep CURL', target: '4 sets' });
  assert.equal(u.updated, true); assert.equal(u.list.length, 2);
  assert.equal(u.list.find((e) => e.target === '4 sets').name, 'bicep CURL');
});

test('save validates through the exercise rules', () => {
  assert.ok(saveToLibrary([], { name: ' ', mode: 'weight' }).error);
  assert.ok(saveToLibrary([], { name: 'X', mode: 'nope' }).error);
});

test('autofill matches the name ignoring case and spaces; remove drops it', () => {
  const list = saveToLibrary([], curl).list;
  assert.equal(autofillFor(list, '  BICEP curl ').equipment, 'dumbbell');
  assert.equal(autofillFor(list, 'Bicep'), null);
  assert.equal(findInLibrary(undefined, 'x'), null);
  assert.deepEqual(removeFromLibrary(list, 'bicep curl'), []);
});

test('load and save round trip; bad data gives an empty library', () => {
  const s = mem(); saveLibrary(s, [curl]);
  assert.deepEqual(loadLibrary(s), [curl]);
  assert.deepEqual(loadLibrary(mem([['lifelog.library', '{bad']])), []);
  assert.deepEqual(loadLibrary(mem([['lifelog.library', JSON.stringify([{ name: '' }, curl])]])), [curl]);
});

test('seed adds the built-in exercises once and keeps your own entries', async () => {
  const { seedLibrary, SEED_EXERCISES } = await import('../src/logic/library.js');
  const store = mem();
  const mine = { name: 'push-up', mode: 'weight', warmup: 'none', target: '5 x 5' };
  const first = seedLibrary(store, [mine]);
  assert.equal(first.length, SEED_EXERCISES.length);
  assert.equal(first.find((e) => e.name.toLowerCase() === 'push-up').target, '5 x 5');
  assert.equal(SEED_EXERCISES.find((e) => e.name === 'Plank').mode, 'timed');
  assert.equal(seedLibrary(store, []).length, 0); // already seeded: a removed entry stays removed
  assert.ok(SEED_EXERCISES.every((e) => saveToLibrary([], e).list));
});
