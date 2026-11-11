// WORKOUT tab, edit mode: list the session's exercises with EDIT and DEL, plus an add/edit form.
//   html:    manageView(state, session)
//   actions: tAdd | tEditStart (data-i) | tDelete (data-i) | tSave | tCancel | tReset, see templateActions.js

import { MODES } from '../logic/templateEdit.js';
import { esc } from './format.js';

const MODE_TEXT = { weight: 'weight and reps', bodyweight: 'reps, weight optional', timed: 'seconds, weight optional' };

function form(state, session) {
  const ed = state.tEdit;
  const base = ed.mode === 'edit' ? session.exercises[ed.i] : { name: '', mode: 'weight', warmup: '', target: '' };
  const v = state.tDraft ?? base; // keep what was typed when a save is refused
  const opts = MODES.map((m) => `<option value="${m}" ${v.mode === m ? 'selected' : ''}>${esc(MODE_TEXT[m])}</option>`).join('');
  return `<div class="panel">
    <h2>${ed.mode === 'edit' ? 'EDIT EXERCISE' : 'NEW EXERCISE'}</h2>
    <label class="lbl" for="te-name">NAME</label>
    <input id="te-name" class="field" maxlength="60" value="${esc(v.name)}" placeholder="Cable fly" autocomplete="off">
    <label class="lbl" for="te-mode">WHAT YOU LOG</label>
    <select id="te-mode" class="field">${opts}</select>
    <label class="check"><input type="checkbox" id="te-side" ${v.perSide ? 'checked' : ''}><span>Log left and right separately</span></label>
    <label class="lbl" for="te-warm">WARM-UP (OPTIONAL)</label>
    <input id="te-warm" class="field" maxlength="80" value="${esc(v.warmup === 'none' ? '' : v.warmup)}" placeholder="1 x 8 at about 50%" autocomplete="off">
    <label class="lbl" for="te-target">TARGET (OPTIONAL)</label>
    <input id="te-target" class="field" maxlength="80" value="${esc(v.target)}" placeholder="3 x 8-12" autocomplete="off">
    <div class="pair">
      <button class="btn secondary" data-action="tCancel">CANCEL</button>
      <button class="btn" data-action="tSave">SAVE</button>
    </div>
  </div>`;
}

export function manageView(state, session) {
  const rows = session.exercises.map((ex, i) => `<div class="entry">
      <div class="row"><span>${esc(ex.name)}</span><span class="tag done">${esc(ex.mode.toUpperCase())}</span></div>
      <small>${esc(ex.target)}${ex.perSide ? ' · L/R' : ''}</small>
      <div class="actions">
        <button class="btn small secondary" data-action="tEditStart" data-i="${i}" aria-label="Edit ${esc(ex.name)}">EDIT</button>
        <button class="btn small secondary" data-action="tDelete" data-i="${i}" aria-label="Delete ${esc(ex.name)}">DEL</button>
      </div>
    </div>`).join('');
  return `${state.tEdit ? form(state, session) : ''}
    <div class="panel">
      <h2>SESSIONS</h2>
      <p>Editing <b>${esc(session.name)}</b>. Pick another session above to edit it.</p>
      <label class="lbl" for="ts-name">SESSION NAME</label>
      <input id="ts-name" class="field" maxlength="40" placeholder="Push day" autocomplete="off">
      <div class="pair">
        <button class="btn secondary" data-action="sAdd">NEW EMPTY</button>
        <button class="btn secondary" data-action="sCopy">COPY THIS ONE</button>
      </div>
      <div class="pair">
        <button class="btn secondary" data-action="sRename">RENAME THIS ONE</button>
        <button class="btn secondary" data-action="sDelete">DELETE THIS ONE</button>
      </div>
    </div>
    <div class="panel">
      <h2>${esc(session.name.toUpperCase())} EXERCISES</h2>
      ${rows || '<p>No exercises. Add one below.</p>'}
      <button class="btn" data-action="tAdd">ADD EXERCISE</button>
      <button class="btn secondary" data-action="tReset">RESET ALL TO THE BUILT-IN PLAN</button>
    </div>`;
}
