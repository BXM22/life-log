import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newEntry, parseMeal, parseNote, parseEdit, defaultMealType, MEAL_TYPES } from '../src/logic/entries.js';
import { buildExport } from '../src/logic/exportBuilder.js';
import { buildNoteFiles, slugify, noteTitle } from '../src/logic/notesExport.js';
import { markExported } from '../src/logic/wipeEligibility.js';
import { parseBackup, buildBackup } from '../src/logic/backup.js';

const meal = () => newEntry('meal', '2026-11-10', { mealType: 'Lunch', name: 'Chicken bowl' }, 1000);
const note = (data, date = '2026-11-10', at = 1000) => newEntry('note', date, data, at);

test('parseMeal: type must be known, name required and trimmed', () => {
  assert.deepEqual(parseMeal({ mealType: 'Lunch', name: '  Chicken   bowl ' }).data, { mealType: 'Lunch', name: 'Chicken bowl' });
  assert.ok(parseMeal({ mealType: 'Brunch', name: 'x' }).error);
  assert.ok(parseMeal({ mealType: 'Lunch', name: '  ' }).error);
  assert.ok(parseMeal({ mealType: 'Lunch', name: 'x'.repeat(61) }).error);
  assert.deepEqual(MEAL_TYPES, ['Breakfast', 'Lunch', 'Dinner', 'Snack']);
});

test('defaultMealType follows the hour of day', () => {
  assert.equal(defaultMealType(8), 'Breakfast');
  assert.equal(defaultMealType(12), 'Lunch');
  assert.equal(defaultMealType(18), 'Dinner');
  assert.equal(defaultMealType(23), 'Snack');
  assert.equal(defaultMealType(2), 'Snack');
});

test('parseNote: body required, title optional, limits enforced', () => {
  assert.deepEqual(parseNote({ title: '  Idea ', body: ' Add a  streak\r\nview ' }).data, { title: 'Idea', body: 'Add a  streak\nview' });
  assert.equal(parseNote({ title: '', body: 'x' }).data.title, '');
  assert.ok(parseNote({ title: 'x', body: '   ' }).error);
  assert.ok(parseNote({ title: 'x'.repeat(81), body: 'x' }).error);
  assert.ok(parseNote({ title: '', body: 'x'.repeat(5001) }).error);
});

test('parseEdit handles meals and notes', () => {
  const m = meal();
  assert.equal(parseEdit(m, { mealType: 'Dinner', name: 'Pasta' }).data.mealType, 'Dinner');
  assert.ok(parseEdit(m, { mealType: 'Dinner', name: '' }).error);
  const n = note({ title: 't', body: 'b' });
  assert.equal(parseEdit(n, { title: 't2', body: 'b2' }).data.body, 'b2');
  assert.ok(parseEdit(n, { title: 't', body: '' }).error);
});

test('buildExport writes a Meals section and leaves notes out', () => {
  const entries = [meal(), newEntry('meal', '2026-11-10', { mealType: 'Snack', name: 'Apple' }, 2000), note({ title: 'Idea', body: 'b' })];
  const out = buildExport(entries, { now: Date.parse('2026-11-10T12:00:00'), existingFilenames: [] });
  assert.match(out.markdown, /## Meals\n- Lunch: Chicken bowl\n- Snack: Apple/);
  assert.doesNotMatch(out.markdown, /Idea/);
  assert.equal(out.manifest.items.length, 2);
  assert.equal(buildExport([note({ title: 'a', body: 'b' })], { now: 1 }), null);
});

test('slugify and noteTitle', () => {
  assert.equal(slugify('  Streak view: v2! '), 'streak-view-v2');
  assert.equal(slugify('!!!'), 'note');
  assert.equal(slugify('a'.repeat(60)).length, 40);
  assert.equal(noteTitle(note({ title: '', body: 'First line\nsecond' })), 'First line');
  assert.equal(noteTitle(note({ title: 'Mine', body: 'x' })), 'Mine');
});

test('buildNoteFiles: one file per dirty note with front matter, unique names', () => {
  const a = note({ title: 'Idea', body: 'Body one' });
  const b = note({ title: 'Idea', body: 'Body two' }, '2026-11-10', 2000);
  const done = { ...note({ title: 'Old', body: 'x' }), exportedAt: 5000, updatedAt: 1000 };
  const files = buildNoteFiles([a, b, done, meal()]);
  assert.equal(files.length, 2);
  assert.deepEqual(files.map((f) => f.filename), ['2026-11-10-idea.md', '2026-11-10-idea-2.md']);
  assert.match(files[0].markdown, /^---\ntype: life-log-note\ncreated: 2026-11-10\nstatus: idea\ntags: \[brainstorm\]\n---\n\n# Idea\n\nBody one\n$/);
});

test('an edited, already-sent note gets a new filename and exports again; marking sent clears it', () => {
  const sent = { ...note({ title: 'Idea', body: 'v1' }), exportedAt: 3000, updatedAt: 1000 };
  assert.equal(buildNoteFiles([sent]).length, 0);
  const edited = { ...sent, data: { title: 'Idea', body: 'v2' }, updatedAt: 4000 };
  const [f] = buildNoteFiles([edited]);
  assert.match(f.filename, /^2026-11-10-idea-rev[a-z0-9]{1,5}\.md$/);
  const stamped = markExported([edited], { exportId: 'notes-1', items: [{ id: edited.id, updatedAt: f.updatedAt }] }, 9000);
  assert.equal(buildNoteFiles(stamped).length, 0);
});

test('backup accepts meals and notes', () => {
  const entries = [meal(), note({ title: 'a', body: 'b' })];
  const back = parseBackup(JSON.stringify(buildBackup({ entries }, 1)));
  assert.equal(back.entries.length, 2);
});
