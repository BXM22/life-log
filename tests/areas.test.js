import test from 'node:test';
import assert from 'node:assert/strict';
import * as A from '../src/logic/areas.js';
import { parseStudy, STUDY_KINDS } from '../src/logic/study.js';

const mem = (init = {}) => {
  const m = { ...init };
  return { m, getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = v; } };
};
const E = (type, date, data, extra = {}) => ({ id: Math.random().toString(), type, date, data, deletedAt: null, ...extra });

test('load: nothing stored gives starter copies and does not write', () => {
  const s = mem();
  const l = A.loadAreas(s);
  assert.deepEqual(l, A.STARTER_AREAS);
  assert.notEqual(l[0], A.STARTER_AREAS[0]);
  assert.deepEqual(s.m, {});
});

test('load: migrates old subjects, prepends Guitar, no write', () => {
  const s = mem({ 'lifelog.studySubjects': JSON.stringify(['Contracts', 'Math']) });
  const l = A.loadAreas(s);
  assert.deepEqual(l.map((a) => a.name), ['Guitar', 'Contracts', 'Math']);
  assert.equal(l[1].metricLabel, '');
  assert.equal(l[1].weeklyGoal, null);
  assert.equal(A.AREAS_KEY in s.m, false);
});

test('load: migration keeps an existing guitar subject in place', () => {
  const s = mem({ 'lifelog.studySubjects': JSON.stringify(['Math', 'guitar']) });
  assert.deepEqual(A.loadAreas(s).map((a) => a.name), ['Math', 'guitar']);
});

test('load: saved areas win; junk dropped; bad JSON falls back', () => {
  const s = mem({ [A.AREAS_KEY]: JSON.stringify([{ name: 'A', metricLabel: 'x', weeklyGoal: 60 }, { name: 'a' }, 5, { name: '' }, { name: 'B', weeklyGoal: 0 }]) });
  assert.deepEqual(A.loadAreas(s), [{ name: 'A', metricLabel: 'x', weeklyGoal: 60 }]);
  assert.deepEqual(A.loadAreas(mem({ [A.AREAS_KEY]: '{bad' })), A.STARTER_AREAS);
});

test('save round trip and failure', () => {
  const s = mem();
  assert.equal(A.saveAreas(s, [{ name: 'X', metricLabel: '', weeklyGoal: 5 }]), true);
  assert.equal(A.loadAreas(s)[0].name, 'X');
  assert.equal(A.saveAreas({ setItem() { throw new Error('full'); } }, []), false);
});

test('add / update / remove validation', () => {
  let l = A.addArea([], { name: ' Chess ', metricLabel: 'Rating', weeklyGoal: '120' }).list;
  assert.deepEqual(l, [{ name: 'Chess', metricLabel: 'Rating', weeklyGoal: 120 }]);
  assert.ok(A.addArea(l, { name: 'chess' }).error);
  assert.ok(A.addArea(l, { name: '' }).error);
  assert.ok(A.addArea(l, { name: 'x'.repeat(61) }).error);
  assert.ok(A.addArea(l, { name: 'Y', metricLabel: 'x'.repeat(21) }).error);
  assert.ok(A.addArea(l, { name: 'Y', weeklyGoal: 2001 }).error);
  assert.ok(A.addArea(l, { name: 'Y', weeklyGoal: 1.5 }).error);
  const full = Array.from({ length: 20 }, (_, i) => ({ name: `n${i}`, metricLabel: '', weeklyGoal: null }));
  assert.ok(A.addArea(full, { name: 'extra' }).error);
  l = A.addArea(l, { name: 'Go' }).list;
  assert.equal(l[1].weeklyGoal, null);
  assert.ok(A.updateArea(l, 'Go', { name: 'chess' }).error);
  assert.ok(A.updateArea(l, 'Nope', {}).error);
  const u = A.updateArea(l, 'Go', { name: 'Golang', weeklyGoal: 30 }).list;
  assert.deepEqual(u[1], { name: 'Golang', metricLabel: '', weeklyGoal: 30 });
  assert.equal(A.updateArea(l, 'Chess', { name: 'CHESS' }).list[0].name, 'CHESS');
  assert.deepEqual(A.removeArea(u, 'Golang').map((a) => a.name), ['Chess']);
});

test('isGuitar and areaOfEntry', () => {
  assert.ok(A.isGuitar(' guitar '));
  assert.ok(!A.isGuitar('Bass'));
  assert.equal(A.areaOfEntry(E('guitar', 'd', { minutes: 5 })), 'Guitar');
  assert.equal(A.areaOfEntry(E('study', 'd', { topic: 'Math' })), 'Math');
  assert.equal(A.areaOfEntry(E('meal', 'd', {})), null);
});

test('todayByArea and minutesToday skip deleted, sort biggest first', () => {
  const es = [
    E('study', '2026-01-02', { topic: 'Math', minutes: 20 }),
    E('guitar', '2026-01-02', { minutes: 30 }),
    E('study', '2026-01-02', { topic: 'math', minutes: 15 }),
    E('study', '2026-01-02', { topic: 'Gone', minutes: 99 }, { deletedAt: 5 }),
    E('study', '2026-01-01', { topic: 'Old', minutes: 99 }),
  ];
  assert.deepEqual(A.todayByArea(es, '2026-01-02'), [{ area: 'Math', minutes: 35 }, { area: 'Guitar', minutes: 30 }]);
  assert.equal(A.minutesToday(es, '2026-01-02'), 65);
  assert.equal(A.minutesToday([], '2026-01-02'), 0);
});

test('weekMinutes window edges', () => {
  const es = [
    E('study', '2026-01-07', { topic: 'Math', minutes: 10 }),
    E('study', '2026-01-01', { topic: 'MATH', minutes: 20 }),
    E('study', '2025-12-31', { topic: 'Math', minutes: 40 }),
    E('study', '2026-01-08', { topic: 'Math', minutes: 80 }),
    E('study', '2026-01-05', { topic: 'Math', minutes: 160 }, { deletedAt: 1 }),
    E('guitar', '2026-01-03', { minutes: 5 }),
  ];
  assert.equal(A.weekMinutes(es, 'math', '2026-01-07'), 30);
  assert.equal(A.weekMinutes(es, 'Guitar', '2026-01-07'), 5);
});

test('new session entries count alongside legacy ones', () => {
  const es = [
    E('session', '2026-01-02', { area: 'Guitar', type: 'practice', minutes: 10, metric: null, metricLabel: 'Best BPM', focus: '', notes: '' }),
    E('guitar', '2026-01-02', { minutes: 30 }),
    E('session', '2026-01-02', { area: 'math', type: 'study', minutes: 5, metric: null, metricLabel: '', focus: '', notes: '' }),
    E('study', '2026-01-02', { kind: 'prep', topic: 'Math', minutes: 20 }),
    E('session', '2026-01-02', { area: 'Gone', type: 'study', minutes: 9, metric: null, metricLabel: '', focus: '', notes: '' }, { deletedAt: 3 }),
  ];
  assert.deepEqual(A.todayByArea(es, '2026-01-02'), [{ area: 'Guitar', minutes: 40 }, { area: 'math', minutes: 25 }]);
  assert.equal(A.weekMinutes(es, 'GUITAR', '2026-01-02'), 40);
  assert.equal(A.areaOfEntry(es[0]), 'Guitar');
});

test('buildLearnEntry: guitar', () => {
  const r = A.buildLearnEntry({ name: 'Guitar', metricLabel: 'Best BPM' }, { type: 'practice', minutes: '30', focus: 'scales', metric: '120' }, '2026-01-02', 1000);
  assert.equal(r.entry.type, 'session');
  assert.deepEqual(r.entry.data, { area: 'Guitar', type: 'practice', minutes: 30, metric: 120, metricLabel: 'Best BPM', focus: 'scales', notes: '' });
  assert.equal(r.entry.date, '2026-01-02');
  assert.equal(r.entry.updatedAt, 1000);
  assert.equal(r.message, 'Saved 30 min of Guitar.');
  assert.ok(A.buildLearnEntry({ name: 'guitar' }, { type: 'practice', minutes: '0' }, 'd', 1).error);
});

test('buildLearnEntry: non-guitar', () => {
  const r = A.buildLearnEntry({ name: 'Coding' }, { type: 'project', minutes: 45, notes: 'api' }, '2026-01-02', 1000);
  assert.equal(r.entry.type, 'session');
  assert.deepEqual(r.entry.data, { area: 'Coding', type: 'project', minutes: 45, metric: null, metricLabel: '', focus: '', notes: 'api' });
  assert.equal(r.message, 'Saved 45 min of Coding.');
  assert.ok(A.buildLearnEntry({ name: 'Coding' }, { type: 'bogus', minutes: 5 }, 'd', 1).error);
});

test('study kinds: old and new parse', () => {
  assert.deepEqual(STUDY_KINDS, ['prep', 'study', 'practice', 'project', 'review']);
  for (const kind of STUDY_KINDS) assert.ok(parseStudy({ kind, topic: 'T', minutes: 5, notes: '' }).data);
});
