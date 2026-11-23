import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorkoutNavActions } from '../src/ui/workoutNavActions.js';
import { splitAlt, todayPage } from '../src/ui/workoutToday.js';

const mkState = () => ({ entries: [], stats: {}, wTrims: {}, wExtras: {}, activities: [], planDays: 4, rest: { endAt: null, seconds: 90, total: 90 } });

test('wDoneToggle flips state.wDoneOpen, collapsed by default', () => {
  const state = {};
  const a = createWorkoutNavActions({ state, today: () => '2026-11-12' });
  assert.equal(state.wDoneOpen, false);
  a.wDoneToggle();
  assert.equal(state.wDoneOpen, true);
  a.wDoneToggle();
  assert.equal(state.wDoneOpen, false);
});

test('splitAlt moves the alternative after "or" to its own part', () => {
  assert.deepEqual(splitAlt('Pec deck or incline fly'), { main: 'Pec deck', alt: 'incline fly' });
  assert.deepEqual(splitAlt('Incline press (machine or barbell)'), { main: 'Incline press (machine or barbell)', alt: '' });
});

test('Today page: rest pill in the header, Next up button, Up next title', () => {
  const html = todayPage(mkState());
  assert.match(html, /<header class="w2-head">[\s\S]*id="rest-row-time"[\s\S]*wMenuToggle[\s\S]*<\/header>/);
  assert.match(html, /w2-next" data-action="wOpenEx" data-i="\d+">Next up: /);
  assert.match(html, /Up next/);
  assert.match(html, /data-sheet="switch"/);
});
