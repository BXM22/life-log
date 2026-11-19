import test from 'node:test';
import assert from 'node:assert/strict';
import { SESSION_TYPES, parseSession, buildSession, sessionOf, isGuitarArea, guitarView, sessionLine, sessionsMarkdown } from '../src/logic/sessions.js';
import { parseEdit } from '../src/logic/entries.js';
import { buildBackup, parseBackup } from '../src/logic/backup.js';

const ok = { area: 'Coding', type: 'project', minutes: '45', metric: '', metricLabel: 'PRs', focus: '', notes: '' };
const E = (type, data) => ({ id: 'i', type, date: '2026-11-19', data, updatedAt: 1, exportedAt: null, exportId: null, deletedAt: null });

test('parse rules', () => {
  assert.deepEqual(SESSION_TYPES, ['practice', 'study', 'project', 'review']);
  assert.deepEqual(parseSession(ok).data, { area: 'Coding', type: 'project', minutes: 45, metric: null, metricLabel: 'PRs', focus: '', notes: '' });
  assert.equal(parseSession({ ...ok, metric: '3.5' }).data.metric, 3.5);
  assert.ok(parseSession({ ...ok, area: ' ' }).error);
  assert.ok(parseSession({ ...ok, area: 'x'.repeat(61) }).error);
  assert.ok(parseSession({ ...ok, type: 'prep' }).error);
  for (const m of ['0', '601', '1.5', '', 'x']) assert.equal(parseSession({ ...ok, minutes: m }).error, 'Enter whole minutes, 1 to 600.');
  assert.ok(parseSession({ ...ok, metric: 'abc' }).error);
  assert.ok(parseSession({ ...ok, focus: 'x'.repeat(41) }).error);
  assert.ok(parseSession({ ...ok, notes: 'x'.repeat(501) }).error);
  assert.ok(parseSession({ ...ok, metricLabel: 'x'.repeat(21) }).error);
});

test('guitar metric is Best BPM', () => {
  const g = { ...ok, area: 'guitar', type: 'practice' };
  assert.equal(parseSession({ ...g, metric: '120' }).data.metric, 120);
  for (const m of ['19', '401', '90.5']) assert.equal(parseSession({ ...g, metric: m }).error, 'Best BPM must be a whole number, 20 to 400.');
  assert.ok(isGuitarArea(' GUITAR '));
});

test('buildSession', () => {
  const r = buildSession({ ...ok, area: 'Guitar', type: 'practice', minutes: 30 }, '2026-11-19', 5);
  assert.equal(r.entry.type, 'session');
  assert.equal(r.entry.updatedAt, 5);
  assert.equal(r.message, 'Saved 30 min of Guitar.');
  assert.ok(buildSession({ ...ok, minutes: 0 }, 'd', 1).error);
});

test('sessionOf for all three types', () => {
  const s = E('session', { area: 'Coding', type: 'review', minutes: 5, metric: 2, metricLabel: 'PRs', focus: 'f', notes: 'n' });
  assert.deepEqual(sessionOf(s), { area: 'Coding', type: 'review', minutes: 5, metric: 2, metricLabel: 'PRs', focus: 'f', notes: 'n' });
  assert.deepEqual(sessionOf(E('guitar', { minutes: 20, focus: 'scales', best_bpm: 100 })),
    { area: 'Guitar', type: 'practice', minutes: 20, metric: 100, metricLabel: 'Best BPM', focus: 'scales', notes: '' });
  assert.deepEqual(sessionOf(E('study', { kind: 'prep', topic: 'Law', minutes: 7, notes: 'x' })),
    { area: 'Law', type: 'study', minutes: 7, metric: null, metricLabel: '', focus: '', notes: 'x' });
  assert.equal(sessionOf(E('study', { kind: 'review', topic: 'Law', minutes: 7, notes: '' })).type, 'review');
  assert.equal(sessionOf(E('meal', {})), null);
  assert.equal(sessionOf(null), null);
});

test('guitarView', () => {
  assert.deepEqual(guitarView(E('guitar', { minutes: 20, focus: 'scales', best_bpm: 100 })), { minutes: 20, focus: 'scales', best_bpm: 100 });
  const s = E('session', { area: 'guitar', type: 'practice', minutes: 10, metric: 90, metricLabel: 'Best BPM', focus: '', notes: '' });
  assert.deepEqual(guitarView(s), { minutes: 10, focus: '', best_bpm: 90 });
  assert.equal(guitarView(E('session', { area: 'Coding', type: 'study', minutes: 1 })), null);
  assert.equal(guitarView(E('study', { kind: 'study', topic: 'Guitar', minutes: 1 })), null);
});

test('sessionLine and sessionsMarkdown golden', () => {
  const g = E('session', { area: 'Guitar', type: 'practice', minutes: 30, metric: null, metricLabel: '', focus: '', notes: '' });
  assert.equal(sessionLine(g), 'Guitar practice (30 min)');
  const es = [
    g,
    E('guitar', { minutes: 5, focus: 'x', best_bpm: null }),
    E('session', { area: 'Coding', type: 'project', minutes: 45, metric: 3, metricLabel: 'PRs', focus: 'api', notes: 'a\nb' }),
    E('session', { area: 'Reading', type: 'study', minutes: 20, metric: 12, metricLabel: '', focus: '', notes: '' }),
    E('session', { area: 'coding', type: 'review', minutes: 10, metric: null, metricLabel: '', focus: '', notes: '' }),
  ];
  assert.deepEqual(sessionsMarkdown(es), [
    '## Coding', '- project (45 min), focus: api, PRs: 3 - a b', '- review (10 min)', '',
    '## Reading', '- study (20 min), metric: 12', '',
  ]);
  assert.deepEqual(sessionsMarkdown([g]), []);
});

test('session entries are not editable and survive a backup round trip', () => {
  const s = E('session', { area: 'Coding', type: 'study', minutes: 5, metric: null, metricLabel: '', focus: '', notes: '' });
  assert.equal(parseEdit(s, {}).error, 'Delete this entry and log it again to change it.');
  const back = parseBackup(JSON.stringify(buildBackup({ entries: [s] }, 9)));
  assert.deepEqual(back.entries[0], s);
});
