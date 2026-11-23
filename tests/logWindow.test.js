import { test } from 'node:test';
import assert from 'node:assert/strict';
import { logWindow } from '../src/ui/logWindow.js';
import { createMealActions } from '../src/ui/mealActions.js';
import { newEntry } from '../src/logic/entries.js';

const day = '2026-11-16'; // a Monday

test('no guitar markup, has weigh-in input, meal buttons and learn row', () => {
  const h = logWindow({ entries: [] }, day);
  assert.ok(h.includes('id="wt"') && h.includes('data-action="logWeighIn"'));
  assert.ok(h.includes('data-win="learn"') && h.includes('Guitar and the practice timer are in Learn'));
  assert.ok(h.includes('Back to Today') && h.includes('Add a meal') && h.includes('Save meal'));
  assert.ok(h.includes('Your weight and meals for Monday, November 16.'));
  for (const t of ['Breakfast', 'Lunch', 'Dinner', 'Snack']) assert.ok(h.includes(`data-meal="${t}"`));
  assert.ok(h.includes('id="meal-type"') && !h.includes('<select'));
  assert.ok(!h.includes('logGuitar') && !h.includes('id="gm"') && !h.includes('Last:'));
});

test('shows last weigh-in, protein status and saved row with Change', () => {
  const entries = [newEntry('weigh_in', day, { weight_lb: 182.4 }, 1), newEntry('meal', day, { mealType: 'Lunch', name: 'x', protein_g: 85 }, 1)];
  const h = logWindow({ entries }, day);
  assert.ok(h.includes('Last: 182.4 lb, Monday'));
  assert.ok(h.includes('85 of 160 g protein') && h.includes('75 g to go'));
  assert.ok(h.includes('182.4 lb saved for today') && h.includes('data-action="changeWeigh"') && !h.includes('id="wt"'));
  assert.ok(logWindow({ entries, weighEdit: true }, day).includes('id="wt"'));
});

test('pickMeal and changeWeigh set state; chosen type is selected', () => {
  const state = { entries: [] };
  const a = createMealActions({ state, saveEntries: async () => {}, saveFail: String, inputValue: () => '', today: () => day });
  a.pickMeal({ dataset: { meal: 'Dinner' } });
  a.pickMeal({ dataset: { meal: 'Brunch' } });
  assert.equal(state.mealType, 'Dinner');
  a.changeWeigh();
  assert.equal(state.weighEdit, true);
  assert.ok(logWindow(state, day).includes('id="meal-type" value="Dinner"'));
});
