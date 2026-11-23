// Actions for the Meals section. app.js merges these into its action table, passing in the pieces
// it owns (state, saving, reading inputs, today's date) so this file has no globals.
//   logMeal, pickMeal (reads el.dataset.meal -> state.mealType), changeWeigh (state.weighEdit = true)

import { MEAL_TYPES, newEntry, parseMeal } from '../logic/entries.js';

export function createMealActions({ state, saveEntries, saveFail, inputValue, today }) {
  return {
    pickMeal: (el) => { const t = el && el.dataset && el.dataset.meal; if (MEAL_TYPES.includes(t)) state.mealType = t; },
    changeWeigh: () => { state.weighEdit = true; },
    logMeal: async () => {
      const raw = { mealType: inputValue('meal-type'), name: inputValue('meal-name'), protein: inputValue('meal-protein') };
      const r = parseMeal(raw);
      if (r.error) { state.mealDraft = raw; state.msg = r.error; return; } // keep what was typed
      const e = newEntry('meal', today(), r.data, Date.now());
      try { await saveEntries([e]); } catch (err) { state.mealDraft = raw; state.msg = saveFail(err); return; }
      state.mealDraft = null;
      state.mealType = null; // back to the time-of-day pick
      state.entries.push(e);
      state.msg = `Saved ${r.data.mealType.toLowerCase()}: ${r.data.name}.`;
    },
  };
}
