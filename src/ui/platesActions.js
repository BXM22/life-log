// Actions for the plate calculator (F38). Bar weight and plates owned are kept on this device under their own
// localStorage key (logic/plates.js). Nothing here touches entries.

import { loadPlates, savePlates, normalizePlates } from '../logic/plates.js';

export function createPlatesActions({ state, inputValue }) {
  state.plates = null; // { i, weight } while the calculator is open for exercise i
  try { state.platesCfg = loadPlates(localStorage); } catch { state.platesCfg = normalizePlates(null); }
  const persist = () => { try { savePlates(localStorage, state.platesCfg); } catch { /* storage blocked */ } };

  return {
    // Opens pre-filled from the weight box on that exercise's panel.
    platesOpen: (el) => { state.plates = { i: Number(el.dataset.i), weight: inputValue(`w-${el.dataset.i}`) }; },
    platesClose: () => { state.plates = null; },
    platesCalc: (el) => {
      const i = Number(el.dataset.i);
      const bar = document.getElementById(`pc-bar-${i}`)?.value;
      state.platesCfg = normalizePlates({ ...state.platesCfg, bar });
      persist();
      state.plates = { i, weight: document.getElementById(`pc-weight-${i}`)?.value ?? state.plates?.weight ?? '' };
    },
    platesPlate: (el) => {
      const c = Number(el.dataset.plate);
      const owned = state.platesCfg.owned.includes(c) ? state.platesCfg.owned.filter((p) => p !== c) : [...state.platesCfg.owned, c];
      if (!owned.length) { state.msg = 'Keep at least one plate.'; return; }
      state.platesCfg = normalizePlates({ ...state.platesCfg, owned });
      persist();
      if (state.plates) state.plates.weight = document.getElementById(`pc-weight-${state.plates.i}`)?.value ?? state.plates.weight;
    },
  };
}
