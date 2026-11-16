import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeWin, parentWin, guitarSummary, studySummary } from '../src/logic/todayWin.js';
import { newEntry } from '../src/logic/entries.js';

test('normalizeWin keeps known windows and drops anything else', () => {
  for (const w of ['log', 'timer', 'study']) assert.equal(normalizeWin(w), w);
  for (const w of [null, undefined, '', 'nope', 3]) assert.equal(normalizeWin(w), null);
});

test('Back from the timer returns to Log; Log and Study return to Today', () => {
  assert.equal(parentWin('timer'), 'log');
  assert.equal(parentWin('log'), null);
  assert.equal(parentWin('study'), null);
  assert.equal(parentWin(null), null);
});

test('guitarSummary adds up today only and ignores deleted entries', () => {
  const g = (date, minutes, extra = {}) => ({ ...newEntry('guitar', date, { minutes, focus: 'x' }, 1), ...extra });
  const entries = [g('2026-11-15', 20), g('2026-11-15', 10), g('2026-11-14', 99), g('2026-11-15', 50, { deletedAt: 5 })];
  assert.equal(guitarSummary(entries, '2026-11-15'), '30 min today');
  assert.equal(guitarSummary([], '2026-11-15'), 'Nothing logged yet');
});

test('studySummary shows study minutes today and the note count', () => {
  const s = newEntry('study', '2026-11-15', { kind: 'study', topic: 'RAG', minutes: 45, notes: '' }, 1);
  const n = newEntry('note', '2026-11-10', { title: 'a', body: 'b' }, 1);
  assert.equal(studySummary([s, n], '2026-11-15'), '45 min today · 1 note');
  assert.equal(studySummary([], '2026-11-15'), '0 min today · 0 notes');
});
