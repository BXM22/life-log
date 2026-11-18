// Actions for the plate calculator (F38, F56). Bar weight and the pairs of each plate you own are kept on this device
// under their own localStorage key (logic/plates.js). Nothing here touches entries.

import { loadPlates, savePlates, normalizePlates, MAX_PAIRS } from '../logic/plates.js';

export function createPlatesActions({ state, inputValue }) {
  state.plates = null; // { i, weight, setup } while the calculator is open for exercise i
  try { state.platesCfg = loadPlates(localStorage); } catch { state.platesCfg = normalizePlates(null); }
  const persist = () => { try { savePlates(localStorage, state.platesCfg); } catch { /* storage blocked */ } };
  // Keep what was typed in the calculator's weight box across a re-render.
  const keepWeight = () => {
    if (state.plates) state.plates = { ...state.plates, weight: document.getElementById(`pc-weight-${state.plates.i}`)?.value ?? state.plates.weight };
  };

  return {
    // Opens pre-filled from the weight box on that exercise's panel.
    platesOpen: (el) => { state.plates = { i: Number(el.dataset.i), weight: inputValue(`w-${el.dataset.i}`), setup: false }; },
    platesClose: () => { state.plates = null; },
    platesCalc: (el) => {
      const i = Number(el.dataset.i);
      const bar = document.getElementById(`pc-bar-${i}`)?.value;
      if (bar !== undefined) { state.platesCfg = normalizePlates({ ...state.platesCfg, bar }); persist(); }
      state.plates = { ...state.plates, i, weight: document.getElementById(`pc-weight-${i}`)?.value ?? state.plates?.weight ?? '' };
    },
    platesSetup: () => { keepWeight(); if (state.plates) state.plates = { ...state.plates, setup: !state.plates.setup }; },
    // One more or one fewer pair of a plate size.
    platesOwn: (el) => {
      const c = Number(el.dataset.plate);
      const next = Math.min(MAX_PAIRS, Math.max(0, (state.platesCfg.owned[c] ?? 0) + Number(el.dataset.delta)));
      const owned = { ...state.platesCfg.owned, [c]: next };
      keepWeight();
      if (!Object.values(owned).some((n) => n > 0)) { state.msg = 'Keep at least one pair of plates.'; return; }
      state.platesCfg = normalizePlates({ ...state.platesCfg, owned });
      persist();
    },
    // Load a suggested weight: the calculator shows it and the exercise's weight box takes it.
    platesUse: (el) => {
      const i = Number(el.dataset.i);
      const w = el.dataset.w;
      state.plates = { ...state.plates, i, weight: w };
      state.wDraft = { ...state.wDraft, [i]: { ...state.wDraft?.[i], w } };
      const box = document.getElementById(`w-${i}`);
      if (box) box.value = w;
    },
  };
}
