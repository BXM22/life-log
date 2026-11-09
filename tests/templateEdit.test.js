import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { SESSIONS, getSessions, setTemplate, sessionById, findExercise } from '../src/logic/template.js';
import { parseExerciseFields, addExercise, updateExercise, removeExercise, normalizeTemplate } from '../src/logic/templateEdit.js';

after(() => setTemplate(null));

const fields = (o = {}) => ({ name: 'Cable fly', mode: 'weight', perSide: false, warmup: '', target: '', ...o });

test('parseExerciseFields: trims, defaults warm-up and target, validates name and mode', () => {
  const r = parseExerciseFields(fields({ name: '  Cable fly  ' }));
  assert.deepEqual(r.exercise, { name: 'Cable fly', mode: 'weight', warmup: 'none', target: '3 sets' });
  assert.equal(parseExerciseFields(fields({ perSide: true })).exercise.perSide, true);
  assert.match(parseExerciseFields(fields({ name: '   ' })).error, /name/i);
  assert.match(parseExerciseFields(fields({ name: 'x'.repeat(61) })).error, /60/);
  assert.match(parseExerciseFields(fields({ mode: 'laser' })).error, /weight, bodyweight or timed/);
  assert.match(parseExerciseFields(fields({ target: 'x'.repeat(81) })).error, /80/);
});

test('addExercise: appends to one session, leaves the others and the input untouched', () => {
  const before = JSON.stringify(SESSIONS);
  const r = addExercise(SESSIONS, 'lower', fields({ name: 'Glute bridge' }));
  const lower = r.sessions.find((s) => s.id === 'lower');
  assert.equal(lower.exercises.length, 9);
  assert.equal(lower.exercises.at(-1).name, 'Glute bridge');
  assert.equal(r.sessions.find((s) => s.id === 'upper_a').exercises.length, 8);
  assert.equal(JSON.stringify(SESSIONS), before);
});

test('addExercise: refuses duplicates in the same session, ignoring case, but allows them in another', () => {
  assert.match(addExercise(SESSIONS, 'lower', fields({ name: 'hip thrust' })).error, /already in Lower/);
  assert.ok(addExercise(SESSIONS, 'upper_a', fields({ name: 'Hip thrust' })).sessions);
  assert.match(addExercise(SESSIONS, 'nope', fields()).error, /session/);
});

test('updateExercise: replaces in place, may keep its own name, refuses another exercise\'s name', () => {
  const r = updateExercise(SESSIONS, 'lower', 1, fields({ name: 'Hip thrust', target: '4 x 8' }));
  assert.equal(r.sessions.find((s) => s.id === 'lower').exercises[1].target, '4 x 8');
  assert.match(updateExercise(SESSIONS, 'lower', 1, fields({ name: 'RDL' })).error, /already in/);
  assert.match(updateExercise(SESSIONS, 'lower', 99, fields()).error, /does not exist/);
});

test('removeExercise: removes one, errors on a bad index', () => {
  const r = removeExercise(SESSIONS, 'upper_c', 0);
  assert.equal(r.sessions.find((s) => s.id === 'upper_c').exercises.length, 3);
  assert.equal(SESSIONS.find((s) => s.id === 'upper_c').exercises.length, 4);
  assert.match(removeExercise(SESSIONS, 'upper_c', 9).error, /does not exist/);
});

test('normalizeTemplate: accepts a valid plan, rejects junk with null', () => {
  assert.equal(normalizeTemplate(null), null);
  assert.equal(normalizeTemplate([]), null);
  assert.equal(normalizeTemplate([{ id: 'a', name: 'A', exercises: [{ name: '', mode: 'weight' }] }]), null);
  assert.equal(normalizeTemplate('x'), null);
  assert.equal(normalizeTemplate(SESSIONS).length, 4);
});

test('active template: setTemplate changes what sessionById and findExercise see; null restores the default', () => {
  const r = addExercise(SESSIONS, 'lower', fields({ name: 'Glute bridge', mode: 'timed' }));
  setTemplate(r.sessions);
  assert.equal(findExercise('Glute bridge').mode, 'timed');
  assert.equal(sessionById('lower').exercises.length, 9);
  assert.equal(getSessions(), r.sessions);
  setTemplate(null);
  assert.equal(findExercise('Glute bridge'), null);
  assert.equal(getSessions(), SESSIONS);
});
