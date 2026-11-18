// WORKOUT tab: the add/edit exercise form shown on the Edit template page.
//   html:    exerciseForm(state, session), EQUIP_TEXT
//   actions: tSave | tCancel (see templateActions.js)

import { MODES, EQUIPMENT } from '../logic/templateEdit.js';
import { esc } from './format.js';

const MODE_TEXT = { weight: 'weight and reps', bodyweight: 'reps, weight optional', timed: 'seconds, weight optional' };

export const EQUIP_TEXT = { barbell: 'Barbell', dumbbell: 'Dumbbell', calisthenics: 'Calisthenics', machine: 'Machine' };

export function exerciseForm(state, session) {
  const ed = state.tEdit;
  const base = ed.mode === 'edit' ? session.exercises[ed.i] : { name: '', mode: 'weight', warmup: '', target: '' };
  const v = state.tDraft ?? base; // keep what was typed when a save is refused
  const opts = MODES.map((m) => `<option value="${m}" ${v.mode === m ? 'selected' : ''}>${esc(MODE_TEXT[m])}</option>`).join('');
  return `<div class="panel">
    <h2>${ed.mode === 'edit' ? 'EDIT EXERCISE' : 'NEW EXERCISE'}</h2>
    <label class="lbl" for="te-name">NAME</label>
    <input id="te-name" class="field" maxlength="60" value="${esc(v.name)}" placeholder="Cable fly" autocomplete="off">
    <label class="lbl" for="te-equip">EQUIPMENT</label>
    <select id="te-equip" class="field"><option value="">Not set</option>${EQUIPMENT.map((q) => `<option value="${q}" ${v.equipment === q ? 'selected' : ''}>${esc(EQUIP_TEXT[q])}</option>`).join('')}</select>
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
