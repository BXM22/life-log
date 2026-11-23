import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { SESSIONS, setTemplate } from '../src/logic/template.js';
import { moveExercise } from '../src/logic/templateEdit.js';
import { createWorkoutSheetActions } from '../src/ui/workoutSheetActions.js';
import { lastDoneBySession } from '../src/ui/workoutSheets.js';

after(() => setTemplate(null));

const day = '2026-11-12';

test('wSheetSelect only selects; wSheetUse confirms today-only and closes the sheet', () => {
  const state = { wSession: null, planDays: 4, wSheet: 'switch' };
  const a = createWorkoutSheetActions({ state, today: () => day });
  a.wSheetOpen({ dataset: { sheet: 'switch' } });
  assert.ok(state.wSheetPick); // starts on the active template
  a.wSheetSelect({ dataset: { id: 'upper_b' } });
  assert.equal(state.wSheetPick, 'upper_b');
  assert.equal(state.wSession, null);
  assert.equal(state.wSheet, 'switch');
  a.wSheetUse();
  assert.equal(state.wSession, 'upper_b');
  assert.equal(state.wSessionDay, day);
  assert.equal(state.wSheet, null);
  assert.equal(state.wSheetPick, null);
});

test('wSheetClose discards an unconfirmed selection', () => {
  const state = { wSession: null, planDays: 4 };
  const a = createWorkoutSheetActions({ state, today: () => day });
  a.wSheetOpen({ dataset: { sheet: 'switch' } });
  a.wSheetSelect({ dataset: { id: 'upper_b' } });
  a.wSheetClose();
  assert.equal(state.wSheetPick, null);
  assert.equal(state.wSession, null);
});

test('lastDoneBySession finds the latest live set per session', () => {
  const r = lastDoneBySession([
    { type: 'lift_set', date: '2026-11-01', data: { session: 'lower' } },
    { type: 'lift_set', date: '2026-11-09', data: { session: 'lower' } },
    { type: 'lift_set', date: '2026-11-10', data: { session: 'lower' }, deletedAt: 1 },
    { type: 'note', date: '2026-11-11', data: {} },
  ]);
  assert.deepEqual(r, { lower: '2026-11-09' });
});

test('moveExercise swaps neighbours and ignores moves past the ends', () => {
  const names = (r) => r.sessions.find((s) => s.id === 'lower').exercises.map((e) => e.name);
  const base = SESSIONS.find((s) => s.id === 'lower').exercises.map((e) => e.name);
  const down = names(moveExercise(SESSIONS, 'lower', 0, 1));
  assert.equal(down[0], base[1]);
  assert.equal(down[1], base[0]);
  assert.deepEqual(names(moveExercise(SESSIONS, 'lower', 0, -1)), base);
  assert.match(moveExercise(SESSIONS, 'lower', 99, 1).error, /does not exist/);
});
