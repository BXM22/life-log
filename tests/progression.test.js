import { test } from 'node:test';
import assert from 'node:assert/strict';
import { progressionPrompt, repCeiling } from '../src/logic/workout.js';

const ex = (target) => ({ name: 'Bench', target, mode: 'weight' });

test('repCeiling reads the top of a rep range', () => {
  assert.equal(repCeiling('3 x 8-12'), 12);
  assert.equal(repCeiling('2 x 5-8'), 8);
  assert.equal(repCeiling('3 x 30 sec'), null);
  assert.equal(repCeiling(undefined), null);
});

test('progressionPrompt: no history gives nothing', () => {
  assert.equal(progressionPrompt(null, ex('3 x 8-12')), null);
});

test('progressionPrompt: below the top of the range adds a rep', () => {
  assert.match(progressionPrompt({ weight: 100, reps: 8 }, ex('3 x 8-12')), /Try 100 x 9/);
});

test('progressionPrompt: at the top of the range adds weight (5 lb, or 2.5 under 45)', () => {
  assert.match(progressionPrompt({ weight: 100, reps: 12 }, ex('3 x 8-12')), /Try 105 lb for 12 reps/);
  assert.match(progressionPrompt({ weight: 20, reps: 12 }, ex('3 x 8-12')), /Try 22.5 lb/);
});

test('progressionPrompt: bodyweight and timed lifts', () => {
  assert.match(progressionPrompt({ weight: null, reps: 6 }, ex('3 x 5-8')), /Try 7 reps/);
  assert.match(progressionPrompt({ weight: null, reps: null, seconds: 30 }, ex('3 x 30 sec')), /Try 35 sec/);
});
