// Exercise library (logic/library.js): save an exercise from its options menu, autofill by name, manage the list.
//   actions: libSave (data-i) | libOpenWin | libCloseWin | libSearch | libFilter (data-key) | libNew | libEdit (data-name) | libEditCancel | libEditSave |
//            libAsk (data-name) | libAskCancel | libRemove (data-name). The page itself is src/ui/libraryWindow.js.
//   exports: createLibraryActions({ state, today }), autofillForm(state, input), libraryDatalist(state)
// State: library (list). Name inputs carry list="lib-names" and data-libfill; app.js calls autofillForm on their change event.

import { loadLibrary, seedLibrary, saveLibrary, saveToLibrary, removeFromLibrary, autofillFor, updateLibraryEntry } from '../logic/library.js';
import { workoutContext } from './workoutNavActions.js';
import { esc } from './format.js';

const field = (id) => document.getElementById(`le-${id}`);
const readForm = () => ({ name: field('name')?.value, equipment: field('equip')?.value, mode: field('mode')?.value, perSide: field('side')?.checked, warmup: field('warm')?.value, target: field('target')?.value });
const top = () => window.scrollTo(0, 0);
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
    libOpenWin: () => { Object.assign(state, { libWin: true, libQuery: '', libEquip: 'all', libEdit: null, libDraft: null, libErr: '', libAsk: null, wMenu: null, wSheet: null, msg: '' }); top(); },
    libCloseWin: () => { Object.assign(state, { libWin: false, libEdit: null, libDraft: null, libErr: '', libAsk: null, msg: '' }); top(); },
    libSearch: (el) => { state.libQuery = String(el?.value ?? '').slice(0, 80); },
    libFilter: (el) => { state.libEquip = el.dataset.key || 'all'; },
    libNew: () => { Object.assign(state, { libEdit: { name: null }, libDraft: null, libErr: '', libAsk: null }); },
    libEdit: (el) => { Object.assign(state, { libEdit: { name: el.dataset.name }, libDraft: null, libErr: '', libAsk: null }); },
    libEditCancel: () => { Object.assign(state, { libEdit: null, libDraft: null, libErr: '' }); },
    libEditSave: () => {
      const f = readForm();
      const r = updateLibraryEntry(state.library, state.libEdit?.name ?? null, f);
      if (r.error) { state.libErr = r.error; state.libDraft = f; return; }
      state.library = r.list;
      saveLibrary(localStorage, state.library);
      state.msg = `${String(f.name).trim()} ${r.added ? 'added to' : 'updated in'} your library.`;
      Object.assign(state, { libEdit: null, libDraft: null, libErr: '' });
    },
    libAsk: (el) => { state.libAsk = el.dataset.name; state.libEdit = null; },
    libAskCancel: () => { state.libAsk = null; },
    libRemove: (el) => {
      state.library = removeFromLibrary(state.library, el.dataset.name);
      saveLibrary(localStorage, state.library);
      state.libAsk = null;
      state.msg = `Deleted ${el.dataset.name} from the library.`;
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
