import { test } from 'node:test';
import assert from 'node:assert/strict';
import { switchedFrom, pickedFor, expireSessionPick } from '../src/logic/workout.js';
import { createWorkoutSheetActions } from '../src/ui/workoutSheetActions.js';

const day = '2026-11-12'; // Thursday: Lower is planned in a 4-day week

test('switchedFrom names the planned session only while a same-day override differs from it', () => {
  assert.equal(switchedFrom({ wSession: null, planDays: 4 }, day), null);
  assert.equal(switchedFrom({ wSession: 'upper_b', wSessionDay: day, planDays: 4 }, day), 'Lower');
  assert.equal(switchedFrom({ wSession: 'lower', wSessionDay: day, planDays: 4 }, day), null); // picked the planned one
  assert.equal(switchedFrom({ wSession: 'upper_b', planDays: 4 }, day), null); // template editing, not a Switch
});

test('a pick is day-scoped: yesterday\'s pick no longer applies', () => {
  const st = { wSession: 'upper_b', wSessionDay: '2026-11-11', planDays: 4 };
  assert.equal(pickedFor(st, day), null);
  assert.equal(switchedFrom(st, day), null);
  expireSessionPick(st, day);
  assert.equal(st.wSession, null);
  assert.equal(st.wSessionDay, null);
});

test('wSessionPick and wSessionClear set and clear the today-only override', () => {
  const state = { wSession: null, planDays: 4, wSheet: 'switch' };
  const a = createWorkoutSheetActions({ state, today: () => day });
  a.wSessionPick({ dataset: { id: 'upper_b' } });
  assert.equal(state.wSession, 'upper_b');
  assert.equal(state.wSessionDay, day);
  assert.equal(state.wSheet, null);
  assert.equal(switchedFrom(state, day), 'Lower');
  a.wSessionClear();
  assert.equal(state.wSession, null);
  assert.equal(switchedFrom(state, day), null);
});
