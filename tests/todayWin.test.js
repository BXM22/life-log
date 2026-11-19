import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeWin, parentWin, guitarSummary, studySummary } from '../src/logic/todayWin.js';
import { newEntry } from '../src/logic/entries.js';

test('normalizeWin keeps known windows and drops anything else', () => {
  for (const w of ['log', 'learn', 'notes']) assert.equal(normalizeWin(w), w);
  for (const w of [null, undefined, '', 'nope', 3]) assert.equal(normalizeWin(w), null);
});

test('Back from any window returns to Today', () => {
  assert.equal(parentWin('timer'), null);
  assert.equal(parentWin('log'), null);
  assert.equal(parentWin('learn'), null);
  assert.equal(parentWin('notes'), null);
  assert.equal(parentWin(null), null);
});

test('guitarSummary adds up today only and ignores deleted entries', () => {
  const g = (date, minutes, extra = {}) => ({ ...newEntry('guitar', date, { minutes, focus: 'x' }, 1), ...extra });
  const entries = [g('2026-11-15', 20), g('2026-11-15', 10), g('2026-11-14', 99), g('2026-11-15', 50, { deletedAt: 5 })];
  assert.equal(guitarSummary(entries, '2026-11-15'), '30 min today');
  assert.equal(guitarSummary([], '2026-11-15'), 'Nothing logged yet');
});

import { habitsHeader, recentHeader, logSummary, learnSummary, notesSummary } from '../src/logic/todayWin.js';

test('habitsHeader and recentHeader build the drop-down titles', () => {
  assert.equal(habitsHeader(2, 3), 'HABITS · 2 OF 3');
  assert.equal(recentHeader(8), 'RECENT · 8 ENTRIES');
  assert.equal(recentHeader(1), 'RECENT · 1 ENTRY');
});

test('logSummary shows the latest weight and today protein', () => {
  const w = (d, lb, t) => newEntry('weigh_in', d, { weight_lb: lb }, t);
  const m = newEntry('meal', '2026-11-15', { mealType: 'Lunch', name: 'x', protein_g: 85 }, 3);
  assert.equal(logSummary([w('2026-11-14', 183, 1), w('2026-11-15', 182.4, 2), m], '2026-11-15'), '182.4 lb · Protein 85 / 160 g');
  assert.equal(logSummary([], '2026-11-15'), 'No weight yet · Protein 0 / 160 g');
});

test('learnSummary lists minutes and areas, or the running timer', () => {
  const g = newEntry('guitar', '2026-11-15', { minutes: 30, focus: 'x' }, 1);
  const s = newEntry('study', '2026-11-15', { kind: 'study', topic: 'RAG', minutes: 15, notes: '' }, 2);
  assert.equal(learnSummary([g, s], '2026-11-15'), '45 min today · Guitar, RAG');
  assert.equal(learnSummary([], '2026-11-15'), 'Nothing logged yet');
  assert.equal(learnSummary([g], '2026-11-15', true), 'Timer running');
});

test('notesSummary counts notes waiting for the vault', () => {
  const n = newEntry('note', '2026-11-10', { title: 'a', body: 'b' }, 1);
  assert.equal(notesSummary([n]), '1 waiting for the vault');
  assert.equal(notesSummary([]), 'No notes waiting');
});

test('studySummary shows study minutes today and the note count', () => {
  const s = newEntry('study', '2026-11-15', { kind: 'study', topic: 'RAG', minutes: 45, notes: '' }, 1);
  const n = newEntry('note', '2026-11-10', { title: 'a', body: 'b' }, 1);
  assert.equal(studySummary([s, n], '2026-11-15'), '45 min today · 1 note');
  assert.equal(studySummary([], '2026-11-15'), '0 min today · 0 notes');
});

test('sessions count by their area in the Learn, Guitar and Study rows', () => {
  const s = (area, minutes) => newEntry('session', '2026-11-15', { area, type: 'practice', minutes, metric: null, metricLabel: '', focus: '', notes: '' }, 1);
  const entries = [s('Guitar', 30), s('Coding', 15)];
  assert.equal(learnSummary(entries, '2026-11-15'), '45 min today · Guitar, Coding');
  assert.equal(guitarSummary(entries, '2026-11-15'), '30 min today');
  assert.equal(studySummary(entries, '2026-11-15'), '15 min today · 0 notes');
});
