// WORKOUT tab: the Exercise library page (search, equipment filter, Edit and Delete per exercise, New exercise).
//   html:    libraryWindow(state)
//   state:   libWin (open), libQuery, libEquip ('all' | equipment), libEdit (null | { name } with name null = new), libDraft, libErr, libAsk (name awaiting delete confirm)
//   actions: libOpenWin | libCloseWin | libSearch | libFilter | libNew | libEdit | libEditCancel | libEditSave | libAsk | libAskCancel | libRemove (libraryActions.js)
//   Styles:  src/styles/w3-library.css (.w2-l*). Form ids are le-* so they never collide with the template form (te-*) or Add for today (xe-*).

import { MODES, EQUIPMENT } from '../logic/templateEdit.js';
import { searchLibrary } from '../logic/library.js';
import { esc } from './format.js';
import { backButton } from './templateTagsView.js';
import { EQUIP_TEXT } from './templateView.js';

const MODE_TEXT = { weight: 'Weight', bodyweight: 'Bodyweight', timed: 'Timed' };
const MODE_LONG = { weight: 'Weight + reps', bodyweight: 'Reps only', timed: 'Seconds' };
const TONE = { barbell: 'a', dumbbell: 'b', calisthenics: 'c', machine: 'a' };

const svg = (d) => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICON = {
  bell: svg('<path d="M3 9v6M6.5 6.5v11M17.5 6.5v11M21 9v6M6.5 12h11"/>'),
  pencil: svg('<path d="M4 20l4-1 11-11-3-3L5 16l-1 4zM14 7l3 3"/>'),
  trash: svg('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>'),
  search: svg('<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
};

function form(state) {
  const ed = state.libEdit;
  const base = ed.name == null ? { name: '', mode: 'weight', warmup: '', target: '' } : (state.library ?? []).find((e) => e.name === ed.name) ?? { name: ed.name, mode: 'weight' };
  const v = state.libDraft ?? base;
  const isNew = ed.name == null;
  return `<section class="w2-lcard w2-lform" aria-label="${isNew ? 'New exercise' : `Edit ${esc(base.name)}`}">
    <h3>${isNew ? 'New exercise' : 'Edit exercise'}</h3>
    ${state.libErr ? `<p class="w2-lerr" role="alert">${esc(state.libErr)}</p>` : ''}
    <label class="lbl" for="le-name">Name</label>
    <input id="le-name" class="field" maxlength="60" value="${esc(v.name)}" placeholder="Cable fly" autocomplete="off">
    <div class="w2-lgrid">
      <div><label class="lbl" for="le-equip">Equipment</label>
        <select id="le-equip" class="field"><option value="">Not set</option>${EQUIPMENT.map((q) => `<option value="${q}" ${v.equipment === q ? 'selected' : ''}>${esc(EQUIP_TEXT[q])}</option>`).join('')}</select></div>
      <div><label class="lbl" for="le-mode">What you log</label>
        <select id="le-mode" class="field">${MODES.map((m) => `<option value="${m}" ${v.mode === m ? 'selected' : ''}>${esc(MODE_LONG[m])}</option>`).join('')}</select></div>
    </div>
    <label class="check"><input type="checkbox" id="le-side" ${v.perSide ? 'checked' : ''}><span>Log left and right separately</span></label>
    <div class="w2-lgrid">
      <div><label class="lbl" for="le-warm">Warm-up</label><input id="le-warm" class="field" maxlength="80" value="${esc(v.warmup === 'none' ? '' : v.warmup ?? '')}" placeholder="1 x 8 at about 50%" autocomplete="off"></div>
      <div><label class="lbl" for="le-target">Target</label><input id="le-target" class="field" maxlength="80" value="${esc(v.target ?? '')}" placeholder="3 x 8-12" autocomplete="off"></div>
    </div>
    <div class="w2-lbtns">
      <button class="btn secondary" data-action="libEditCancel">Cancel</button>
      <button class="btn" data-action="libEditSave">${isNew ? 'Add exercise' : 'Save changes'}</button>
    </div>
  </section>`;
}

function card(state, e) {
  const tone = TONE[e.equipment] ?? 'n';
  const asking = state.libAsk === e.name;
  const meta = [e.equipment ? EQUIP_TEXT[e.equipment] : null, MODE_TEXT[e.mode], e.perSide ? 'Left and right' : null].filter(Boolean).map((t, i) => `<span class="w2-tpill${i ? ' plain' : ''}">${esc(t)}</span>`).join('');
  return `<article class="w2-lcard${asking ? ' ask' : ''}" data-tone="${tone}">
    <span class="w2-ticon" aria-hidden="true">${ICON.bell}</span>
    <div class="w2-lmain"><b>${esc(e.name)}</b><div class="w2-tmeta">${meta}</div>${e.target ? `<small>Target ${esc(e.target)}</small>` : ''}</div>
    ${asking ? '' : `<div class="w2-lact">
      <button class="w2-lico" data-action="libEdit" data-name="${esc(e.name)}" aria-label="Edit ${esc(e.name)}" title="Edit">${ICON.pencil}</button>
      <button class="w2-lico danger" data-action="libAsk" data-name="${esc(e.name)}" aria-label="Delete ${esc(e.name)}" title="Delete">${ICON.trash}</button>
    </div>`}
    ${asking ? `<div class="w2-lconfirm" role="alertdialog" aria-label="Delete ${esc(e.name)}?"><p>Delete ${esc(e.name)} from the library? Templates that use it are not changed.</p>
      <div class="w2-lbtns"><button class="btn secondary" data-action="libAskCancel">Keep it</button><button class="btn danger" data-action="libRemove" data-name="${esc(e.name)}">Delete</button></div></div>` : ''}
  </article>`;
}

export function libraryWindow(state) {
  const all = state.library ?? [];
  const q = state.libQuery ?? '';
  const equip = state.libEquip ?? 'all';
  const shown = searchLibrary(all, q, equip);
  const editing = state.libEdit;
  const chips = [['all', 'All', all.length], ...EQUIPMENT.map((k) => [k, EQUIP_TEXT[k], all.filter((e) => e.equipment === k).length])]
    .filter(([k, , n]) => k === 'all' || n > 0)
    .map(([k, t, n]) => `<button class="btn w2-lchip" data-action="libFilter" data-key="${k}" aria-pressed="${k === equip}">${esc(t)}<span>${n}</span></button>`).join('');
  const rows = shown.map((e) => (editing && editing.name === e.name ? form(state) : card(state, e))).join('');
  const empty = !all.length
    ? '<p class="w2-lempty"><b>Nothing saved yet</b>Open an exercise, tap the three dots, then Save to library. Or add one here.</p>'
    : !shown.length
      ? `<p class="w2-lempty"><b>No match${q ? ` for “${esc(q)}”` : ''}</b>Try a shorter word, or pick All.<button class="btn secondary" data-action="libSearch">Clear search</button></p>`
      : '';
  return `<div class="w2-page w2-lpage">
    <div class="backrow">${backButton('libCloseWin', 'Back to workout')}</div>
    <div class="w2-lhead"><h2 class="subtitle">Exercise library</h2><span class="w2-lcount" aria-label="${all.length} saved">${all.length}</span></div>
    <div class="w2-lsearch">${ICON.search}<input id="lib-search" type="search" enterkeyhint="search" class="field" maxlength="80" value="${esc(q)}" placeholder="Search exercises" aria-label="Search exercises" autocomplete="off" data-action="libSearch"></div>
    <div class="w2-lchips" role="group" aria-label="Filter by equipment">${chips}</div>
    ${editing && editing.name == null ? form(state) : `<button class="w2-dashed w2-lnew" data-action="libNew">${ICON.plus}<span>New exercise</span></button>`}
    <p class="w2-lresult" aria-live="polite">${all.length ? `${shown.length} of ${all.length} shown` : ''}</p>
    ${rows}${empty}
  </div>`;
}
