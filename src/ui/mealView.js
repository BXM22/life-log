// MEALS panel on the TODAY tab: pick a type, type a name, and see today's meals.
//   html:    mealPanel(state, day)
//   actions: data-action="logMeal" (see mealActions.js)

import { MEAL_TYPES, PROTEIN_TARGET, defaultMealType, dayProtein, liveEntries } from '../logic/entries.js';
import { esc } from './format.js';

export function mealPanel(state, day) {
  const draft = state.mealDraft || { name: '', protein: '' }; // kept when a save is refused
  const pick = draft.mealType || defaultMealType(new Date().getHours());
  const options = MEAL_TYPES.map((t) => `<option ${t === pick ? 'selected' : ''}>${t}</option>`).join('');
  const meals = liveEntries(state.entries)
    .filter((e) => e.type === 'meal' && e.date === day)
    .sort((a, b) => a.updatedAt - b.updatedAt);
  const rows = meals.map((m) => `<div class="row"><span>${esc(m.data.mealType)}</span><span>${esc(m.data.name)}${m.data.protein_g != null ? ` <small>${esc(m.data.protein_g)} g</small>` : ''}</span></div>`).join('');
  const got = dayProtein(state.entries, day);
  return `<div class="panel">
    <h2>MEALS</h2>
    <p>Protein <b>${got}</b> / ${PROTEIN_TARGET} g${got >= PROTEIN_TARGET ? ' (target reached)' : ` (${PROTEIN_TARGET - got} to go)`}</p>
    <progress value="${Math.min(got, PROTEIN_TARGET)}" max="${PROTEIN_TARGET}" aria-label="Protein today"></progress>
    ${rows || '<p class="note">No meals logged yet today.</p>'}
    <label class="lbl" for="meal-type">Meal</label>
    <select id="meal-type" class="field" aria-label="Meal type">${options}</select>
    <label class="lbl" for="meal-name">What you ate</label>
    <input id="meal-name" class="field" maxlength="60" placeholder="Chicken bowl" autocomplete="off" value="${esc(draft.name)}">
    <label class="lbl" for="meal-protein">Protein in grams (optional)</label>
    <input id="meal-protein" class="field" type="number" inputmode="numeric" step="1" placeholder="40" value="${esc(draft.protein)}">
    <button class="btn" data-action="logMeal">SAVE MEAL</button>
  </div>`;
}
