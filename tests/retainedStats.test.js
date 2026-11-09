import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeStats, emptyStats, streakWithStats, longestRun, GUITAR } from '../src/logic/retainedStats.js';

const habit = (date, name = 'Water', done = true) => ({
  id: `h-${name}-${date}`, type: 'habit_check', date, data: { habit: name, done },
  updatedAt: 1, exportedAt: null, exportId: null, deletedAt: null,
});
const weigh = (date, w, updatedAt = 1) => ({
  id: `w-${date}-${updatedAt}`, type: 'weigh_in', date, data: { weight_lb: w }, updatedAt, exportedAt: null, exportId: null, deletedAt: null,
});
const guitar = (date, minutes, focus = 'technique', best_bpm = 100) => ({
  id: `g-${date}`, type: 'guitar', date, data: { minutes, focus, best_bpm }, updatedAt: 1, exportedAt: null, exportId: null, deletedAt: null,
});
const days = (start, n) => Array.from({ length: n }, (_, i) => `2026-11-${String(start + i).padStart(2, '0')}`);

test('longestRun counts consecutive days only', () => {
  assert.equal(longestRun(new Set(['2026-11-01', '2026-11-02', '2026-11-04'])), 2);
  assert.equal(longestRun(new Set()), 0);
});

test('stats survive deleting all entries and keep the streak alive', () => {
  const entries = days(1, 5).map((d) => habit(d));
  const stats = computeStats(entries, emptyStats(), 100);
  assert.equal(stats.best.Water, 5);
  assert.deepEqual(stats.anchors.Water, { date: '2026-11-05', streak: 5 });
  // Wipe removes every entry. Stats are what is left.
  assert.equal(streakWithStats([], 'Water', '2026-11-06', stats), 5);
  assert.equal(streakWithStats([], 'Water', '2026-11-05', stats), 5);
});

test('anchor streak is dropped once a day has been missed', () => {
  const stats = computeStats(days(1, 5).map((d) => habit(d)), emptyStats(), 1);
  assert.equal(streakWithStats([], 'Water', '2026-11-07', stats), 0);
});

test('a new streak after a wipe extends the anchored one when days are adjacent', () => {
  const stats = computeStats(days(1, 5).map((d) => habit(d)), emptyStats(), 1);
  const after = [habit('2026-11-06'), habit('2026-11-07')];
  assert.equal(streakWithStats(after, 'Water', '2026-11-07', stats), 7);
});

test('best streak never decreases when entries are gone or shorter', () => {
  const first = computeStats(days(1, 6).map((d) => habit(d)), emptyStats(), 1);
  const second = computeStats([habit('2026-11-20')], first, 2);
  assert.equal(second.best.Water, 6);
  const third = computeStats([], second, 3);
  assert.equal(third.best.Water, 6);
  assert.deepEqual(third.anchors.Water, { date: '2026-11-20', streak: 1 });
});

test('guitar days get their own streak and last working set per focus', () => {
  const entries = [guitar('2026-11-01', 20, 'scales', 90), guitar('2026-11-02', 30, 'scales', 95), guitar('2026-11-02', 15, 'songs', null)];
  const stats = computeStats(entries, emptyStats(), 1);
  assert.equal(stats.best[GUITAR], 2);
  assert.deepEqual(stats.lastSets.scales, { date: '2026-11-02', minutes: 30, best_bpm: 95 });
  assert.equal(stats.lastSets.songs.best_bpm, null);
  assert.equal(streakWithStats([], GUITAR, '2026-11-03', stats), 2);
});

test('last 7 weigh-ins: latest per day wins and older days fall off', () => {
  const entries = days(1, 9).map((d, i) => weigh(d, 180 + i));
  entries.push(weigh('2026-11-09', 150, 99)); // later edit for the same day
  const stats = computeStats(entries, emptyStats(), 1);
  assert.equal(stats.weighIns.length, 7);
  assert.equal(stats.weighIns[0].date, '2026-11-03');
  assert.deepEqual(stats.weighIns.at(-1), { date: '2026-11-09', weight_lb: 150 });
  // Wiping the entries keeps the last seven.
  assert.equal(computeStats([], stats, 2).weighIns.length, 7);
});

test('deleted entries are ignored', () => {
  const gone = { ...habit('2026-11-01'), deletedAt: 5 };
  const stats = computeStats([gone], emptyStats(), 1);
  assert.deepEqual(stats.best, {});
});

test('inputs are not mutated', () => {
  const prev = computeStats(days(1, 3).map((d) => habit(d)), emptyStats(), 1);
  const snapshot = JSON.stringify(prev);
  computeStats(days(10, 3).map((d) => habit(d)), prev, 2);
  assert.equal(JSON.stringify(prev), snapshot);
});
