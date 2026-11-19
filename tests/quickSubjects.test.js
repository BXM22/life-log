import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildQuickEntry, QUICK_KINDS, QUICK_FIELDS } from '../src/logic/quickAdd.js';
import { quickAreas } from '../src/logic/quickAdd.js';
import { quickAddSheet } from '../src/ui/quickAddView.js';
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
  assert.deepEqual(QUICK_KINDS.map((k) => k[0]), ['weight', 'meal', 'session', 'note']);
  const s = buildQuickEntry('session', { area: 'Coding', minutes: '45', type: 'project', metric: '', metricLabel: '', focus: 'api', notes: '' }, '2026-11-15', 5);
  assert.equal(s.entry.type, 'session');
  assert.equal(s.entry.data.area, 'Coding');
  assert.equal(s.entry.data.minutes, 45);
  assert.equal(s.entry.data.type, 'project');
  assert.equal(s.entry.data.metric, null);
  const n = buildQuickEntry('note', { body: 'idea' }, '2026-11-15', 5);
  assert.equal(n.entry.data.body, 'idea');
  assert.equal(n.entry.date, '2026-11-15');
});

test('quick add: bad input returns an error and no entry', () => {
  for (const [kind, raw] of [['weight', { weight: '' }], ['meal', { name: '' }], ['session', { area: 'Coding', minutes: '0' }], ['session', { area: 'Coding', minutes: '' }], ['note', { body: '  ' }], ['nope', {}]]) {
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

test('quick add: areas ordered last used first, with a fallback list', () => {
  const areas = [{ name: 'Guitar' }, { name: 'Coding' }, { name: 'Reading' }];
  const e = (area, date) => ({ type: 'session', date, createdAt: 1, data: { area, minutes: 5 } });
  assert.deepEqual(quickAreas(areas, [e('Coding', '2026-11-10'), e('Reading', '2026-11-12')]).map((a) => a.name), ['Reading', 'Coding', 'Guitar']);
  assert.deepEqual(quickAreas(undefined, []).map((a) => a.name), ['Guitar', 'Coding']);
});

test('quick add sheet: four chips, session form with area select, minute chips, collapsed details', () => {
  const st = { entries: [], areas: [{ name: 'Guitar', metricLabel: 'Best BPM' }, { name: 'Coding' }], quick: { kind: 'session', draft: {} } };
  const h = quickAddSheet(st);
  for (const k of ['weight', 'meal', 'session', 'note']) assert.match(h, new RegExp(`data-kind="${k}"`));
  assert.doesNotMatch(h, /data-kind="(guitar|study)"/);
  assert.match(h, /<select id="qa-area"[^>]*data-action="quickArea">/);
  assert.match(h, /id="qa-minutes"/);
  for (const m of [15, 30, 45, 60]) assert.match(h, new RegExp(`data-action="quickMin" data-min="${m}"`));
  assert.match(h, /data-action="quickMore" aria-expanded="false"/);
  assert.doesNotMatch(h, /id="qa-focus"/);
  const o = quickAddSheet({ ...st, quick: { kind: 'session', draft: { area: 'Guitar' }, more: true } });
  assert.match(o, /data-type="practice" aria-pressed="true"/);
  assert.match(o, /id="qa-metric"[^>]*placeholder="Best BPM"/);
  assert.match(o, /id="qa-metricLabel" type="hidden" value="Best BPM"/);
  assert.doesNotThrow(() => quickAddSheet({ quick: { kind: 'session' } }));
});
