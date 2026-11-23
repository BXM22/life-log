import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newEntry } from '../src/logic/entries.js';
import { dayMatches, filterGroups, workoutHistoryView } from '../src/ui/workoutHistoryView.js';
import { createWorkoutHistoryActions } from '../src/ui/workoutHistoryActions.js';
import { workoutDays } from '../src/logic/workoutHistory.js';

const set = (date, exercise, session = 'upper_a') => newEntry('lift_set', date, { session, exercise, kind: 'working', weight: 100, reps: 5, seconds: null, side: null }, 1);
const entries = [set('2026-11-23', 'Bench press'), set('2026-11-10', 'Squat', 'lower_a'), set('2026-10-01', 'Deadlift', 'lower_a')];
const days = workoutDays(entries);
const groups = [
  { label: 'This week', days: days.filter((d) => d.date === '2026-11-23') },
  { label: 'Last week', days: days.filter((d) => d.date === '2026-11-10') },
  { label: 'Earlier', days: days.filter((d) => d.date === '2026-10-01') },
];

test('dayMatches: empty matches all, words match exercise names case-insensitively', () => {
  assert.equal(dayMatches(days[0], ''), true);
  assert.equal(dayMatches(groups[0].days[0], 'BENCH'), true);
  assert.equal(dayMatches(groups[0].days[0], 'squat'), false);
});

test('filterGroups: by filter key and query, empty groups dropped', () => {
  assert.equal(filterGroups(groups, 'all', '').length, 3);
  assert.deepEqual(filterGroups(groups, 'week', '').map((g) => g.label), ['This week']);
  assert.deepEqual(filterGroups(groups, 'all', 'dead').map((g) => g.label), ['Earlier']);
  assert.equal(filterGroups(groups, 'week', 'dead').length, 0);
});

test('actions: wHistSearch and wHistFilter set state only', () => {
  const state = {};
  const a = createWorkoutHistoryActions({ state });
  a.wHistSearch({ value: 'bench' });
  assert.equal(state.wHistQuery, 'bench');
  a.wHistFilter({ dataset: { key: 'last' } });
  assert.equal(state.wHistFilterKey, 'last');
  a.wHistFilter({ dataset: { key: 'bogus' } });
  assert.equal(state.wHistFilterKey, 'all');
});

test('view: search box, chips, and filtering by query', () => {
  const html = workoutHistoryView({ entries, dayStartHour: 0, wHistQuery: 'zzz', wHistFilterKey: 'all' });
  assert.match(html, /w-hist-search/);
  assert.match(html, /data-action="wHistFilter"/);
  assert.match(html, /No workouts match/);
});
