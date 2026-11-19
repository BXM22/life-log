import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lastWeighIn, proteinToGo } from '../src/logic/logWin.js';
import { newEntry } from '../src/logic/entries.js';

const w = (date, lb, x = {}) => ({ ...newEntry('weigh_in', date, { weight_lb: lb }, 1), ...x });
const m = (date, p, x = {}) => ({ ...newEntry('meal', date, { mealType: 'Lunch', name: 'x', protein_g: p }, 1), ...x });

test('lastWeighIn picks the latest live entry with weekday', () => {
  const r = lastWeighIn([w('2026-11-14', 183), w('2026-11-16', 182.4), w('2026-11-17', 150, { deletedAt: 3 })]);
  assert.deepEqual(r, { weight: 182.4, date: '2026-11-16', weekday: 'Mon' });
});

test('lastWeighIn is null with none', () => {
  assert.equal(lastWeighIn([]), null);
  assert.equal(lastWeighIn([m('2026-11-16', 10)]), null);
});

test('proteinToGo counts down and floors at 0', () => {
  assert.equal(proteinToGo([], '2026-11-16'), 160);
  assert.equal(proteinToGo([m('2026-11-16', 85), m('2026-11-15', 50)], '2026-11-16'), 75);
  assert.equal(proteinToGo([m('2026-11-16', 200)], '2026-11-16'), 0);
});
