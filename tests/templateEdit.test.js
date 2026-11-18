import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { SESSIONS, getSessions, setTemplate, sessionById, findExercise } from '../src/logic/template.js';
import { parseSet, setText, progressionPrompt, suggestWarmup } from '../src/logic/workout.js';
import { editEntry, parseEdit, newEntry } from '../src/logic/entries.js';
import { loadExtras, saveExtras, extrasFor, addExtra, updateExtra, toggleExtraDone, removeExtra } from '../src/logic/extras.js';
import { parseExerciseFields, addExercise, updateExercise, removeExercise, normalizeTemplate, addSession } from '../src/logic/templateEdit.js';

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

test('addSession: blank has no exercises, copy duplicates them, names are validated', () => {
  const base = getSessions();
  const blank = addSession(base, 'Push day');
  assert.equal(blank.sessions.length, base.length + 1);
  const made = blank.sessions.find((s) => s.id === blank.id);
  assert.deepEqual(made.exercises, []);
  assert.equal(made.name, 'Push day');
  const copy = addSession(base, 'Copy of A', base[0].id);
  assert.equal(copy.sessions.find((s) => s.id === copy.id).exercises.length, base[0].exercises.length);
  assert.match(addSession(base, '  ').error, /name/i);
  assert.match(addSession(blank.sessions, 'push DAY').error, /already exists/);
});

test('normalizeTemplate: keeps a session that has no exercises yet', () => {
  const r = normalizeTemplate([{ id: 'c-push', name: 'Push', focus: '', tags: [], exercises: [] }]);
  assert.equal(r.length, 1);
  assert.deepEqual(r[0].exercises, []);
});

const memory = () => { const m = {}; return { getItem: (k) => m[k] ?? null, setItem: (k, v) => { m[k] = v; } }; };

test('extras: add, reject duplicates, remove, and drop at the next day', () => {
  const tpl = [{ name: 'Bench', mode: 'weight', warmup: 'none', target: '3 sets' }];
  const a = addExtra([], tpl, { name: ' Face pulls ', mode: 'weight', perSide: false });
  assert.equal(a.list[0].name, 'Face pulls');
  assert.match(addExtra(a.list, tpl, { name: 'face PULLS', mode: 'weight' }).error, /already on today/);
  assert.match(addExtra([], tpl, { name: 'bench', mode: 'weight' }).error, /already on today/);
  assert.match(addExtra([], tpl, { name: '', mode: 'weight' }).error, /name/i);
  assert.deepEqual(removeExtra(a.list, 'Face pulls'), []);
  const store = memory();
  saveExtras(store, { day: '2026-11-17', list: a.list });
  assert.equal(loadExtras(store, '2026-11-17').list.length, 1);
  assert.deepEqual(loadExtras(store, '2026-11-18').list, []);
  assert.deepEqual(extrasFor(loadExtras(store, '2026-11-17'), '2026-11-18'), []);
  assert.deepEqual(loadExtras({ getItem: () => 'not json' }, '2026-11-17').list, []);
});

test('equipment: optional, validated, kept by normalizeTemplate and extras', () => {
  assert.equal(parseExerciseFields(fields({ equipment: 'barbell' })).exercise.equipment, 'barbell');
  assert.equal('equipment' in parseExerciseFields(fields()).exercise, false);
  assert.match(parseExerciseFields(fields({ equipment: 'kettlebell' })).error, /barbell/);
  const kept = normalizeTemplate([{ id: 'c-x', name: 'X', exercises: [parseExerciseFields(fields({ equipment: 'machine' })).exercise] }]);
  assert.equal(kept[0].exercises[0].equipment, 'machine');
  assert.equal(addExtra([], [], { name: 'Dips', mode: 'bodyweight', equipment: 'calisthenics' }).list[0].equipment, 'calisthenics');
});

test('calisthenics sets: weight optional, assisted or resistance, shown clearly, edits keep the type', () => {
  const pullup = { name: 'Pull-up', mode: 'bodyweight', equipment: 'calisthenics' };
  assert.deepEqual(parseSet(pullup, { reps: '8' }).data, { weight: null, reps: 8, seconds: null, side: null, load: null });
  const asst = parseSet(pullup, { weight: '30', reps: '8', load: 'assisted' }).data;
  assert.equal(asst.load, 'assisted');
  assert.equal(setText(asst), '30 lb assist x 8');
  const add = parseSet(pullup, { weight: '25', reps: '5', load: 'resistance' }).data;
  assert.equal(setText(add), '+25 lb x 5');
  assert.equal(parseSet({ ...pullup, mode: 'weight' }, { reps: '8' }).data.weight, null); // weight not required for calisthenics
  assert.equal(parseSet({ name: 'Bench', mode: 'weight' }, { weight: '100', reps: '5' }).data.load, undefined);
  assert.equal(setText({ weight: 100, reps: 5 }), '100 x 5');
  assert.equal(suggestWarmup({ weight: 30, load: 'assisted' }), null);
  assert.match(progressionPrompt({ weight: 30, reps: 8, load: 'assisted' }, { target: '3 x 8-12' }), /9 reps/);
  const e = newEntry('lift_set', '2026-11-17', { session: 's', exercise: 'Nope', kind: 'working', ...asst }, 1);
  const r = parseEdit(e, { weight: '20', reps: '8' });
  assert.equal(r.data.load, 'assisted');
  assert.equal(setText(editEntry(e, r.data, 2).data), '20 lb assist x 8');
  assert.equal(parseEdit(e, { weight: '', reps: '8' }).data.load, null);
});

test('extras: optional target, edit keeps done, rejects clashes', () => {
  const tpl = [{ name: 'Bench', mode: 'weight', warmup: 'none', target: '3 sets' }];
  const open = addExtra([], tpl, { name: 'Face pulls', mode: 'weight' });
  assert.equal(open.list[0].target, 'as you like');
  const withTarget = addExtra(open.list, tpl, { name: 'Curls', mode: 'weight', target: '3 x 8' });
  assert.equal(withTarget.list[1].target, '3 x 8');
  const done = toggleExtraDone(withTarget.list, 'Curls');
  assert.equal(done[1].done, true);
  assert.equal(done[0].done, undefined);
  const edited = updateExtra(done, tpl, 'Curls', { name: 'Hammer curls', mode: 'weight', equipment: 'dumbbell', target: '' });
  assert.equal(edited.list[1].name, 'Hammer curls');
  assert.equal(edited.list[1].equipment, 'dumbbell');
  assert.equal(edited.list[1].target, 'as you like');
  assert.equal(edited.list[1].done, true);
  assert.match(updateExtra(done, tpl, 'Curls', { name: 'face pulls', mode: 'weight' }).error, /already on today/);
  assert.match(updateExtra(done, tpl, 'Curls', { name: 'bench', mode: 'weight' }).error, /already on today/);
  assert.equal(updateExtra(done, tpl, 'Curls', { name: 'Curls', mode: 'weight' }).error, undefined);
  assert.match(updateExtra(done, tpl, 'Gone', { name: 'X', mode: 'weight' }).error, /no longer/);
  assert.equal(toggleExtraDone(done, 'Curls')[1].done, undefined);
});

test('extras: done mark survives save and load', () => {
  const store = memory();
  const list = toggleExtraDone(addExtra([], [], { name: 'Dips', mode: 'bodyweight', target: '3 x 10' }).list, 'Dips');
  saveExtras(store, { day: '2026-11-17', list });
  const back = loadExtras(store, '2026-11-17').list[0];
  assert.equal(back.done, true);
  assert.equal(back.target, '3 x 10');
});
