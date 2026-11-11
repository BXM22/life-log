// MEALS panel on the TODAY tab: pick a type, type a name, and see today's meals.
//   html:    mealPanel(state, day)
//   actions: data-action="logMeal" (see mealActions.js)

import { MEAL_TYPES, defaultMealType, liveEntries } from '../logic/entries.js';
import { esc } from './format.js';

export function mealPanel(state, day) {
  const pick = defaultMealType(new Date().getHours());
  const options = MEAL_TYPES.map((t) => `<option ${t === pick ? 'selected' : ''}>${t}</option>`).join('');
  const meals = liveEntries(state.entries)
    .filter((e) => e.type === 'meal' && e.date === day)
    .sort((a, b) => a.updatedAt - b.updatedAt);
  const rows = meals.map((m) => `<div class="row"><span>${esc(m.data.mealType)}</span><span>${esc(m.data.name)}</span></div>`).join('');
  return `<div class="panel">
    <h2>MEALS</h2>
    ${rows}
    <div class="inline">
      <select id="meal-type" class="field" aria-label="Meal type">${options}</select>
      <input id="meal-name" class="field" maxlength="60" placeholder="What you ate" aria-label="Meal name" autocomplete="off">
    </div>
    <button class="btn" data-action="logMeal">SAVE MEAL</button>
  </div>`;
}
