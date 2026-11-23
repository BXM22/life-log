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

test('search matches every word across name, equipment, mode and target; equipment filter narrows', async () => {
  const { searchLibrary } = await import('../src/logic/library.js');
  const list = [curl, { name: 'Pull-up', mode: 'bodyweight', target: '3 x 6', equipment: 'calisthenics' }, { name: 'Plank', mode: 'timed', target: '3 x 40s' }];
  assert.equal(searchLibrary(list, '').length, 3);
  assert.deepEqual(searchLibrary(list, 'CURL').map((e) => e.name), ['Bicep curl']);
  assert.deepEqual(searchLibrary(list, 'dumbbell curl').map((e) => e.name), ['Bicep curl']);
  assert.deepEqual(searchLibrary(list, 'timed').map((e) => e.name), ['Plank']);
  assert.deepEqual(searchLibrary(list, '', 'calisthenics').map((e) => e.name), ['Pull-up']);
  assert.deepEqual(searchLibrary(list, 'zzz'), []);
});

test('update renames in place, refuses a clash, adds when oldName is null', async () => {
  const { updateLibraryEntry } = await import('../src/logic/library.js');
  const list = [curl, { name: 'Abs', mode: 'timed' }].sort((a, b) => a.name.localeCompare(b.name));
  const r = updateLibraryEntry(list, 'Bicep curl', { ...curl, name: 'Zottman curl', target: '3 x 10' });
  assert.deepEqual(r.list.map((e) => e.name), ['Abs', 'Zottman curl']); assert.equal(r.added, false);
  assert.ok(updateLibraryEntry(list, 'Abs', { name: 'bicep CURL', mode: 'weight' }).error);
  assert.equal(updateLibraryEntry(list, 'Abs', { name: 'Abs', mode: 'bodyweight' }).list.length, 2);
  const a = updateLibraryEntry(list, null, { name: 'Dip', mode: 'bodyweight' });
  assert.equal(a.added, true); assert.equal(a.list.length, 3);
  assert.ok(updateLibraryEntry(list, 'Gone', { name: 'X', mode: 'weight' }).error);
  assert.ok(updateLibraryEntry(list, null, { name: ' ', mode: 'weight' }).error);
});
