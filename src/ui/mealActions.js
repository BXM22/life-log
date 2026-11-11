// Actions for the MEALS panel. app.js merges these into its action table, passing in the pieces
// it owns (state, saving, reading inputs, today's date) so this file has no globals.

import { newEntry, parseMeal } from '../logic/entries.js';

export function createMealActions({ state, saveEntries, saveFail, inputValue, today }) {
  return {
    logMeal: async () => {
      const r = parseMeal({ mealType: inputValue('meal-type'), name: inputValue('meal-name') });
      if (r.error) { state.msg = r.error; return; }
      const e = newEntry('meal', today(), r.data, Date.now());
      try { await saveEntries([e]); } catch (err) { state.msg = saveFail(err); return; }
      state.entries.push(e);
      state.msg = `Saved ${r.data.mealType.toLowerCase()}: ${r.data.name}.`;
    },
  };
}
