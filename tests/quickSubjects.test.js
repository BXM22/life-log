import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildQuickEntry, QUICK_KINDS, QUICK_FIELDS } from '../src/logic/quickAdd.js';
import { normalizeSubjects, addSubject, removeSubject, loadSubjects, saveSubjects, SUBJECTS_KEY, MAX_SUBJECTS } from '../src/logic/studySubjects.js';

const mem = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }; };

test('quick add: every kind has fields and builds a valid entry', () => {
  assert.deepEqual(QUICK_KINDS.map((k) => k[0]), Object.keys(QUICK_FIELDS));
  const w = buildQuickEntry('weight', { weight: '172.46' }, '2026-11-15', 5);
  assert.equal(w.entry.type, 'weigh_in');
  assert.equal(w.entry.data.weight_lb, 172.5);
  const m = buildQuickEntry('meal', { name: ' Rice  bowl ', protein: '40' }, '2026-11-15', 5, 12);
  assert.equal(m.entry.data.mealType, 'Lunch');
  assert.equal(m.entry.data.protein_g, 40);
  const g = buildQuickEntry('guitar', { minutes: '30', focus: '' }, '2026-11-15', 5);
  assert.equal(g.entry.data.focus, 'practice');
  const s = buildQuickEntry('study', { topic: 'Torts', minutes: '45' }, '2026-11-15', 5);
  assert.equal(s.entry.data.kind, 'study');
  const n = buildQuickEntry('note', { body: 'idea' }, '2026-11-15', 5);
  assert.equal(n.entry.data.body, 'idea');
  assert.equal(n.entry.date, '2026-11-15');
});

test('quick add: bad input returns an error and no entry', () => {
  for (const [kind, raw] of [['weight', { weight: '' }], ['meal', { name: '' }], ['guitar', { minutes: '0' }], ['study', { topic: 'x', minutes: '' }], ['note', { body: '  ' }], ['nope', {}]]) {
    const r = buildQuickEntry(kind, raw, '2026-11-15', 5);
    assert.ok(r.error, kind);
    assert.equal(r.entry, undefined);
  }
});

test('subjects: add trims, rejects blanks, duplicates (any case) and overflow', () => {
  assert.deepEqual(addSubject([], '  Con   Law ').list, ['Con Law']);
  assert.ok(addSubject([], '   ').error);
  assert.ok(addSubject(['Torts'], 'torts').error);
  assert.ok(addSubject([], 'x'.repeat(61)).error);
  const full = Array.from({ length: MAX_SUBJECTS }, (_, i) => `S${i}`);
  assert.ok(addSubject(full, 'extra').error);
});

test('subjects: remove, normalize, and storage round trip survive bad data', () => {
  assert.deepEqual(removeSubject(['A', 'B'], 'A'), ['B']);
  assert.deepEqual(normalizeSubjects(['A', 'a', ' ', 5, 'B']), ['A', '5', 'B']);
  assert.deepEqual(normalizeSubjects('nope'), []);
  const st = mem();
  assert.deepEqual(loadSubjects(st), []);
  assert.equal(saveSubjects(st, ['Torts', 'Contracts']), true);
  assert.deepEqual(loadSubjects(st), ['Torts', 'Contracts']);
  st.setItem(SUBJECTS_KEY, '{bad');
  assert.deepEqual(loadSubjects(st), []);
  assert.equal(saveSubjects({ setItem() { throw new Error('blocked'); } }, ['A']), false);
  assert.deepEqual(loadSubjects({ getItem() { throw new Error('blocked'); } }), []);
});
