import { test } from 'node:test';
import assert from 'node:assert/strict';
import { logWindow } from '../src/ui/logWindow.js';
import { newEntry } from '../src/logic/entries.js';

const day = '2026-11-16';

test('no guitar markup, has weigh-in input and learn row', () => {
  const h = logWindow({ entries: [] }, day);
  assert.ok(h.includes('id="wt"') && h.includes('data-action="logWeighIn"'));
  assert.ok(h.includes('data-win="learn"') && h.includes('Guitar timer moved to Learn'));
  assert.ok(h.includes('Back to Today') && h.includes('ADD A MEAL'));
  assert.ok(!h.includes('logGuitar') && !h.includes('id="gm"'));
  assert.ok(!h.includes('Last:'));
});

test('shows last weigh-in hint and protein to go', () => {
  const entries = [newEntry('weigh_in', day, { weight_lb: 182.4 }, 1), newEntry('meal', day, { mealType: 'Lunch', name: 'x', protein_g: 85 }, 1)];
  const h = logWindow({ entries }, day);
  assert.ok(h.includes('Last: 182.4 lb, Mon'));
  assert.ok(h.includes('Protein <b>85</b> / 160 g') && h.includes('75 g to go'));
});
