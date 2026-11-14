import { test } from 'node:test';
import assert from 'node:assert/strict';
import { idlePractice, loadPractice, savePractice, startPractice, elapsedSeconds, practiceMinutes, clock, PRACTICE_KEY } from '../src/logic/practiceTimer.js';
import { parseStudy, studyLine, studyMarkdown, dayStudyMinutes } from '../src/logic/study.js';
import { newEntry, parseGuitar, parseEdit } from '../src/logic/entries.js';
import { buildExport } from '../src/logic/exportBuilder.js';
import { parseBackup, buildBackup } from '../src/logic/backup.js';

const mem = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k) }; };

test('practice timer: elapsed seconds come from the start time and never go negative', () => {
  const p = startPractice(10_000, '  scales   ');
  assert.equal(p.focus, 'scales');
  assert.equal(elapsedSeconds(p, 10_000 + 65_900), 65);
  assert.equal(elapsedSeconds(p, 5_000), 0);
  assert.equal(elapsedSeconds(idlePractice(), 99_999), 0);
});

test('practice minutes round, are at least 1 and at most 600, and always pass the guitar form', () => {
  assert.equal(practiceMinutes(5), 1);
  assert.equal(practiceMinutes(89), 1);
  assert.equal(practiceMinutes(90), 2);
  assert.equal(practiceMinutes(99 * 3600), 600);
  for (const s of [0, 30, 3600, 1e7]) assert.ok(parseGuitar({ minutes: practiceMinutes(s), focus: '', bpm: '' }).data);
});

test('clock formats mm:ss and h:mm:ss', () => {
  assert.equal(clock(0), '0:00');
  assert.equal(clock(65), '1:05');
  assert.equal(clock(3725), '1:02:05');
});

test('practice timer survives a reload through storage and clears when idle', () => {
  const s = mem();
  savePractice(s, startPractice(123, 'songs'));
  assert.deepEqual(loadPractice(s), { startAt: 123, focus: 'songs' });
  savePractice(s, idlePractice());
  assert.equal(s.getItem(PRACTICE_KEY), null);
  assert.deepEqual(loadPractice(s), idlePractice());
  s.setItem(PRACTICE_KEY, '{bad json');
  assert.deepEqual(loadPractice(s), idlePractice());
});

test('parseStudy validates kind, topic, minutes and notes', () => {
  assert.deepEqual(parseStudy({ kind: 'prep', topic: '  Contracts  ch 3 ', minutes: '45', notes: '' }).data, { kind: 'prep', topic: 'Contracts ch 3', minutes: 45, notes: '' });
  assert.ok(parseStudy({ kind: 'play', topic: 'x', minutes: '5' }).error);
  assert.ok(parseStudy({ kind: 'study', topic: ' ', minutes: '5' }).error);
  assert.ok(parseStudy({ kind: 'study', topic: 'x'.repeat(61), minutes: '5' }).error);
  for (const bad of ['', '0', '601', '1.5', 'abc']) assert.match(parseStudy({ kind: 'study', topic: 'x', minutes: bad }).error, /minutes/, bad);
  assert.ok(parseStudy({ kind: 'study', topic: 'x', minutes: '5', notes: 'n'.repeat(501) }).error);
});

test('study entries show in the export under their own Kumio section, per day', () => {
  const entries = [
    newEntry('study', '2026-11-10', { kind: 'study', topic: 'Contracts', minutes: 45, notes: 'offer and acceptance' }, 1),
    newEntry('study', '2026-11-10', { kind: 'prep', topic: 'Outline', minutes: 20, notes: '' }, 2),
    newEntry('weigh_in', '2026-11-11', { weight_lb: 170 }, 3),
  ];
  const out = buildExport(entries, { now: Date.parse('2026-11-12T12:00:00') });
  assert.match(out.markdown, /## Kumio\n- study: Contracts \(45 min\) - offer and acceptance\n- prep: Outline \(20 min\)\n/);
  assert.equal(out.markdown.match(/## Kumio/g).length, 1);
  assert.equal(out.manifest.items.length, 3);
  assert.deepEqual(studyMarkdown([]), []);
});

test('dayStudyMinutes sums live entries on one date', () => {
  const e = (date, minutes, extra = {}) => ({ ...newEntry('study', date, { kind: 'study', topic: 't', minutes, notes: '' }, 1), ...extra });
  assert.equal(dayStudyMinutes([e('2026-11-10', 30), e('2026-11-10', 15), e('2026-11-10', 99, { deletedAt: 5 }), e('2026-11-09', 60)], '2026-11-10'), 45);
  assert.equal(studyLine(e('2026-11-10', 30)), 'study: t (30 min)');
});

test('study entries are kept by backup restore and cannot be silently edited as something else', () => {
  const entry = newEntry('study', '2026-11-10', { kind: 'study', topic: 'Contracts', minutes: 30, notes: '' }, 1);
  const back = parseBackup(JSON.stringify(buildBackup({ entries: [entry] }, 5)));
  assert.equal(back.entries[0].type, 'study');
  assert.ok(parseEdit(entry, { done: true }).error);
});
