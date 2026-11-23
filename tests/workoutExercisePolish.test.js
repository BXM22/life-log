import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorkoutActions } from '../src/ui/workoutActions.js';
import { sessionById } from '../src/logic/template.js';
import { activeSessionId } from '../src/logic/workout.js';
import { newEntry } from '../src/logic/entries.js';
import { setDots } from '../src/logic/workoutPlan.js';

const day = '2026-11-12';
globalThis.localStorage ??= { getItem: () => null, setItem() {}, removeItem() {} };
const id = activeSessionId(null, day, 4);
const ex = sessionById(id).exercises.find((e) => e.mode === 'weight' && setDots(e, [], day, {}).total > 1);
const idx = sessionById(id).exercises.indexOf(ex);

function setup(inputs = {}, entries = []) {
  const saved = [];
  let rest = 0;
  const state = { entries, stats: {}, wSession: null, planDays: 4, wTrims: {}, activities: [], wDraft: {}, exOpen: {}, wEx: null };
  const a = createWorkoutActions({ state, saveEntries: async (e) => { saved.push(...e); }, saveFail: String, inputValue: (k) => inputs[k] ?? '', today: () => day, onWorkingSet: () => { rest++; } });
  return { state, a, saved, rest: () => rest };
}

test('wUseLast fills the draft from the last working set', () => {
  const past = newEntry('lift_set', '2026-11-05', { session: id, exercise: ex.name, kind: 'working', weight: 135, reps: 8 }, 1);
  const { state, a } = setup({}, [past]);
  a.wUseLast({ dataset: { i: String(idx) } });
  assert.equal(state.wDraft[idx].w, '135');
  assert.equal(state.wDraft[idx].r, '8');
});

test('wFillAll logs every remaining working set, starts rest and moves on', async () => {
  const { state, a, saved, rest } = setup({ [`w-${idx}`]: '100', [`r-${idx}`]: '8' });
  state.wEx = idx;
  await a.wFillAll({ dataset: { i: String(idx) } });
  const total = setDots(ex, [], day, {}).total * (ex.perSide ? 2 : 1);
  assert.equal(saved.length, total);
  assert.ok(saved.every((e) => e.data.kind === 'working' && e.data.weight === 100 && e.data.reps === 8));
  assert.equal(rest(), 1);
  assert.notEqual(state.wEx, idx);
  assert.match(state.msg, /done/);
});

test('wFillAll does nothing once the target is reached', async () => {
  const { state, a, saved } = setup({ [`w-${idx}`]: '100', [`r-${idx}`]: '8' });
  await a.wFillAll({ dataset: { i: String(idx) } });
  const before = saved.length;
  await a.wFillAll({ dataset: { i: String(idx) } });
  assert.equal(saved.length, before);
  assert.match(state.msg, /No sets left/);
});
