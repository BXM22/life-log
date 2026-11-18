// Exercise library (logic/library.js): save an exercise from its options menu, autofill by name, manage the list.
//   actions: libSave (data-i, the open exercise's index) | libRemove (data-name)
//   exports: createLibraryActions({ state, today }), autofillForm(state, input), libraryDatalist(state), librarySheet(state, ui)
// State: library (list). Name inputs carry list="lib-names" and data-libfill; app.js calls autofillForm on their change event.

import { loadLibrary, seedLibrary, saveLibrary, saveToLibrary, removeFromLibrary, autofillFor } from '../logic/library.js';
import { workoutContext } from './workoutNavActions.js';
import { EQUIP_TEXT } from './templateView.js';
import { esc } from './format.js';

const MODE_TEXT = { weight: 'weight and reps', bodyweight: 'reps, weight optional', timed: 'seconds, weight optional' };

export function createLibraryActions({ state, today }) {
  state.library = seedLibrary(localStorage, loadLibrary(localStorage));
  return {
    libSave: (el) => {
      state.wMenu = null;
      const item = workoutContext(state, today()).list.find((x) => x.i === Number(el.dataset.i));
      if (!item) return;
      const r = saveToLibrary(state.library, item.ex);
      if (r.error) { state.msg = r.error; return; }
      state.library = r.list;
      saveLibrary(localStorage, state.library);
      state.msg = `${item.ex.name} ${r.updated ? 'updated in' : 'saved to'} your library.`;
    },
    libRemove: (el) => {
      state.library = removeFromLibrary(state.library, el.dataset.name);
      saveLibrary(localStorage, state.library);
      state.msg = `Removed ${el.dataset.name} from the library.`;
    },
  };
}

/** Fills the other fields of an exercise form from the library when the typed name matches. Edits the DOM only (no re-render). */
export function autofillForm(state, input) {
  const hit = autofillFor(state.library, input.value);
  if (!hit) return false;
  const p = input.id.slice(0, 3); // 'xe-' (add for today) or 'te-' (edit template)
  const set = (id, v) => { const el = document.getElementById(p + id); if (el && v != null) el.value = v; };
  set('equip', hit.equipment ?? '');
  set('mode', hit.mode);
  set('warm', hit.warmup === 'none' ? '' : hit.warmup);
  set('target', hit.target);
  const side = document.getElementById(`${p}side`);
  if (side) side.checked = Boolean(hit.perSide);
  input.value = hit.name; // use the saved spelling
  return true;
}

export const libraryDatalist = (state) => `<datalist id="lib-names">${(state.library ?? []).map((e) => `<option value="${esc(e.name)}"></option>`).join('')}</datalist>`;

export function librarySheet(state, ui) {
  const rows = (state.library ?? []).map((e) => `<div class="w2-actrow"><div><b>${esc(e.name)}</b><small>${esc([e.equipment ? EQUIP_TEXT[e.equipment] : '', MODE_TEXT[e.mode], e.target].filter(Boolean).join(' · '))}</small></div>
    <button class="btn secondary small" data-action="libRemove" data-name="${esc(e.name)}" aria-label="Remove ${esc(e.name)}">REMOVE</button></div>`).join('');
  return ui.frame('Exercise library', `<div class="w2-sheet-head"><h2>Exercise library</h2>${ui.closeBtn}</div>
    <div class="w2-body">${rows || '<p class="w2-empty">Nothing saved yet. Open an exercise, tap the three dots, then Save to library. Saved names autofill when you add or edit an exercise.</p>'}</div>
    <button class="btn w2-done" data-action="wSheetClose">Done</button>`);
}
