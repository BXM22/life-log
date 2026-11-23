// Meals section of the Log window (F68): progress, today's meals and the add form.
//   html:    mealPanel(state, day)
//   state:   mealType (Breakfast|Lunch|Dinner|Snack, default by time of day), mealDraft
//   actions: logMeal, pickMeal (see mealActions.js). A hidden #meal-type carries the pick.

import { MEAL_TYPES, PROTEIN_TARGET, defaultMealType, dayProtein, liveEntries } from '../logic/entries.js';
import { esc } from './format.js';
import { winSection, chipRow } from './winParts.js';

export function mealPanel(state, day) {
  const draft = state.mealDraft || { name: '', protein: '' }; // kept when a save is refused
  const pick = state.mealType || (MEAL_TYPES.includes(draft.mealType) ? draft.mealType : defaultMealType(new Date().getHours()));
  const meals = liveEntries(state.entries)
    .filter((e) => e.type === 'meal' && e.date === day)
    .sort((a, b) => a.updatedAt - b.updatedAt);
  const rows = meals.map((m) => `<div class="win-row"><span>${esc(m.data.mealType)}</span><span>${esc(m.data.name)}${m.data.protein_g != null ? ` <small>${esc(m.data.protein_g)} g</small>` : ''}</span></div>`).join('');
  const got = dayProtein(state.entries, day);
  const chips = chipRow(MEAL_TYPES.map((t) => ({ label: t, selected: t === pick, action: 'pickMeal', data: { meal: t } })), { label: 'Meal type' });
  const body = `<progress class="win-log-bar" value="${Math.min(got, PROTEIN_TARGET)}" max="${PROTEIN_TARGET}" aria-label="Protein today"></progress>
    <p class="win-log-togo">${got >= PROTEIN_TARGET ? 'Target reached' : `${PROTEIN_TARGET - got} g to go`}</p>
    ${rows || '<p class="note">No meals logged yet today.</p>'}
    <hr class="win-log-rule">
    <h3 class="win-log-sub">Add a meal</h3>
    <input type="hidden" id="meal-type" value="${esc(pick)}">
    ${chips}
    <div class="win-field"><label for="meal-name">What you ate</label>
      <input id="meal-name" class="field" maxlength="60" placeholder="Chicken bowl" autocomplete="off" value="${esc(draft.name)}"></div>
    <div class="win-field"><label for="meal-protein">Protein in grams (optional)</label>
      <input id="meal-protein" class="field" type="number" inputmode="numeric" step="1" placeholder="40" value="${esc(draft.protein)}"></div>
    <button class="btn win-log-primary" data-action="logMeal">Save meal</button>`;
  return winSection({ title: 'Meals', status: `${got} of ${PROTEIN_TARGET} g protein`, body });
}
