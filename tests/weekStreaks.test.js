import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newEntry } from '../src/logic/entries.js';
import { toggleCheck } from '../src/logic/habits.js';
import { streakOf, allStreaks, guitarDays } from '../src/logic/streaks.js';
import { weekDates, habitGrid, weightTrend, chartPoints } from '../src/logic/weekView.js';
import { weekPanel, streaksPanel } from '../src/ui/weekPanel.js';

const gym = { id: 'workout', name: 'Workout' };
const check = (date) => toggleCheck([], gym, date, 1);
const set = (...d) => new Set(d);

test('weekDates runs Monday to Sunday, including from a Sunday', () => {
  assert.equal(weekDates('2026-11-13')[0], '2026-11-09');
  assert.equal(weekDates('2026-11-13')[6], '2026-11-15');
  assert.equal(weekDates('2026-11-15')[0], '2026-11-09');
  assert.equal(weekDates('2026-11-13', -1)[0], '2026-11-02');
});

test('streakOf: current survives an undone today, best tracks the longest run', () => {
  assert.deepEqual(streakOf(set('2026-11-11', '2026-11-12'), '2026-11-13'), { current: 2, best: 2 });
  assert.deepEqual(streakOf(set('2026-11-12', '2026-11-13'), '2026-11-13'), { current: 2, best: 2 });
  assert.deepEqual(streakOf(set('2026-11-01', '2026-11-02', '2026-11-03', '2026-11-12'), '2026-11-13'), { current: 1, best: 3 });
  assert.deepEqual(streakOf(set('2026-11-05'), '2026-11-13'), { current: 0, best: 1 });
  assert.deepEqual(streakOf(set(), '2026-11-13'), { current: 0, best: 0 });
});

test('allStreaks counts habit checks and guitar sessions, ignoring deleted and undone', () => {
  const g1 = newEntry('guitar', '2026-11-12', { minutes: 20, focus: 'practice', best_bpm: null }, 1);
  const g2 = { ...newEntry('guitar', '2026-11-13', { minutes: 20, focus: 'practice', best_bpm: null }, 1), deletedAt: 5 };
  const undone = { ...check('2026-11-11'), data: { habit: 'Workout', done: false } };
  const entries = [check('2026-11-12'), check('2026-11-13'), undone, g1, g2];
  const rows = allStreaks(entries, [gym], '2026-11-13');
  assert.deepEqual(rows.map((r) => [r.name, r.current, r.best]), [['Workout', 2, 2], ['Guitar practice', 1, 1]]);
  assert.equal(guitarDays(entries).size, 1);
});

test('habitGrid marks done and future cells', () => {
  const g = habitGrid([check('2026-11-10')], [gym], weekDates('2026-11-13'), '2026-11-13');
  assert.equal(g[0].doneCount, 1);
  assert.equal(g[0].cells[1].done, true);
  assert.equal(g[0].cells[5].future, true);
});

test('weightTrend windows to 28 days; chart range includes the 170 goal', () => {
  const hist = [{ date: '2026-11-13', weight_lb: 181 }, { date: '2026-10-01', weight_lb: 190 }, { date: '2026-11-01', weight_lb: 183 }];
  const pts = weightTrend(hist, '2026-11-13', 28);
  assert.deepEqual(pts.map((p) => p.date), ['2026-11-01', '2026-11-13']);
  const c = chartPoints(pts, '2026-11-13', 28);
  assert.ok(c.min <= 170 && c.max >= 183);
  assert.ok(c.goalY > c.dots[1].y);
  assert.equal(chartPoints([], '2026-11-13', 28).dots.length, 0);
});

test('panels render grid, goal line and streaks', () => {
  const state = { entries: [check('2026-11-13'), newEntry('weigh_in', '2026-11-13', { weight_lb: 181 }, 1)], habits: [gym], stats: null };
  const w = weekPanel(state, '2026-11-13');
  assert.match(w, /THIS WEEK/);
  assert.match(w, /170 lb goal/);
  assert.match(streaksPanel(state, '2026-11-13'), /Guitar practice/);
  assert.match(weekPanel({ ...state, entries: [], habits: [] }, '2026-11-13'), /No habits yet/);
});
