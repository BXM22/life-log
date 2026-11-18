// WORKOUT tab: today's session from the template, one panel per exercise.
//   html:    workoutView(state)
//   actions: data-action="pickSession" | "toggleManage" | "logSet" (data-i = exercise index, data-kind = warmup | working), see workoutActions.js
// Warm-up and working sets are logged separately. The weight box is pre-filled from the last working set.

import { sessionById } from '../logic/template.js';
import { extrasFor } from '../logic/extras.js';
import { templatesWindow, editScreen } from './templateTagsView.js';
import { platesButton, platesPanel } from './platesView.js';
import { activeSessionId, lastWorking, progressionPrompt, setText, setsFor, suggestWarmup } from '../logic/workout.js';
import { logicalDate } from '../logic/dates.js';
import { esc } from './format.js';
import { manageView, EQUIP_TEXT } from './templateView.js';
import { EQUIPMENT } from '../logic/templateEdit.js';
import { editForm } from './historyView.js';
import { restRow } from './restView.js';
import { workoutHistoryView } from './workoutHistoryView.js';
import { warmupPanel, bjjPanel, caliPanel, targetText, trimButtons, cueBlock } from './workoutExtrasView.js';

function exercisePanel(state, ex, i, day, extra = false) {
  const last = lastWorking(state.entries, state.stats, ex.name);
  const warm = suggestWarmup(last);
  const sets = setsFor(state.entries, day, ex.name);
  const cali = ex.equipment === 'calisthenics';
  const optional = ex.mode === 'weight' && !cali ? '' : ' (optional)';

  const inputs = [
    `<input id="w-${i}" class="field" type="number" inputmode="decimal" step="0.5" value="${esc(last?.weight ?? '')}" placeholder="Weight (lb)${optional}" aria-label="Weight in lb">`,
    ex.mode === 'timed'
      ? `<input id="s-${i}" class="field" type="number" inputmode="numeric" step="1" value="${esc(last?.seconds ?? '')}" placeholder="Seconds" aria-label="Seconds">`
      : `<input id="r-${i}" class="field" type="number" inputmode="numeric" step="1" placeholder="Reps" aria-label="Reps">`,
    cali ? `<select id="ld-${i}" class="field" aria-label="Weight type"><option value="resistance" ${last?.load === 'assisted' ? '' : 'selected'}>Added weight</option><option value="assisted" ${last?.load === 'assisted' ? 'selected' : ''}>Assisted weight</option></select>` : '',
    ex.perSide
      ? `<select id="sd-${i}" class="field" aria-label="Side"><option value="L">Left</option><option value="R">Right</option></select>`
      : '',
  ].join('');

  // Each logged set can be edited or deleted right here (same actions as the History tab).
  const rows = sets.map((e) => (state.editId === e.id ? editForm(e) : `<div class="entry"><div class="row"><span>${e.data.kind === 'warmup' ? 'Warm-up' : 'Set'} ${esc(setText(e.data))}</span>
      <span class="actions"><button class="btn secondary small" data-action="startEdit" data-id="${esc(e.id)}" aria-label="Edit this set">EDIT</button>
      <button class="btn secondary small" data-action="deleteEntry" data-id="${esc(e.id)}" aria-label="Delete this set">DEL</button></span></div></div>`)).join('');

  const open = state.exOpen?.[ex.name] === true;
  return `<details class="panel fold exfold" ${open ? 'open' : ''}>
    <summary data-action="toggleEx" data-name="${esc(ex.name)}"><h2>${esc(ex.name)}</h2></summary>
    <p>${ex.equipment ? `${esc(EQUIP_TEXT[ex.equipment])}. ` : ''}${targetText(state, ex, day)}. Warm-up: ${esc(ex.warmup)}.</p>
    ${extra ? `<details class="menu"><summary>OPTIONS</summary><div class="actions">
        <button class="btn secondary small" data-action="keepExtra" data-name="${esc(ex.name)}" aria-label="Keep ${esc(ex.name)} in the template">KEEP IN TEMPLATE</button>
        <button class="btn secondary small" data-action="removeExtra" data-name="${esc(ex.name)}" aria-label="Remove ${esc(ex.name)} from today">REMOVE FROM TODAY</button></div></details>`
    : `<details class="menu"><summary>OPTIONS</summary>
      <div class="actions">
        <button class="btn secondary small" data-action="tEditHere" data-i="${i}" aria-label="Edit ${esc(ex.name)}">EDIT</button>
        <button class="btn secondary small" data-action="tDelete" data-i="${i}" aria-label="Delete ${esc(ex.name)}">DELETE</button>
        ${trimButtons(state, ex, i, day)}
      </div>
    </details>
    ${cueBlock(state, ex, i)}`}
    ${!extra && i === 0 && progressionPrompt(last, ex) ? `<p class="try"><b>TRY TODAY</b> ${esc(progressionPrompt(last, ex))}</p>` : ''}
    <p>${last ? `Last: ${esc(setText(last))} on ${esc(last.date.slice(5))}.` : 'No history yet.'}${warm ? ` Warm-up about ${warm} lb.` : ''}</p>
    ${inputs}
    <div class="pair">
      <button class="btn secondary" data-action="logSet" data-kind="warmup" data-i="${i}">WARM-UP SET</button>
      <button class="btn" data-action="logSet" data-kind="working" data-i="${i}">WORKING SET</button>
    </div>
    ${ex.mode === 'weight' && !extra ? platesButton(i) : ''}
    ${extra ? '' : platesPanel(state, i)}
    ${rows}
  </details>`;
}

export function workoutView(state) {
  const day = logicalDate(Date.now(), state.dayStartHour);
  const id = activeSessionId(state.wSession, day, state.planDays);
  const session = sessionById(id);
  if (state.tScreen) return editScreen(state);
  if (state.tWin) return templatesWindow(state);
  return `<div class="panel">
      <h2>WORKOUT ${esc(day.slice(5))}</h2>
      <div class="activetpl"><span>Active template</span><b>${esc(session.name)}</b>
        <button class="editlink" data-action="tplOpenWin" aria-label="Switch template">Switch</button></div>
      <p>${session.focus ? `${esc(session.focus)}. ` : ''}Beat last time on the first exercise.</p>
      <div class="pair">
        <button class="btn secondary" data-action="toggleManage">${state.wManage ? 'DONE EDITING' : 'EDIT TEMPLATES'}</button>
        <button class="btn secondary" data-action="toggleHistory">${state.wHistory ? 'BACK TO WORKOUT' : 'HISTORY'}</button>
      </div>
      <button class="btn secondary" data-action="tplOpenWin">TEMPLATES AND TAGS</button>
    </div>
    ${state.wHistory ? workoutHistoryView(state) : ''}
    ${state.wManage || state.wHistory ? '' : restRow(state)}
    ${state.wHistory || state.wManage ? '' : bjjPanel(state, day) + caliPanel(state, day) + warmupPanel(state, session, day)}
    ${!state.wHistory && !state.wManage && !session.exercises.length ? '<div class="panel"><p>No exercises yet. Open Switch, then Edit on this template to add some.</p></div>' : ''}
    ${state.wHistory ? '' : state.wManage ? manageView(state, session) : session.exercises.map((ex, i) => exercisePanel(state, ex, i, day)).join('')}
    ${state.wHistory || state.wManage ? '' : extraPanels(state, session, day)}`;
}

const MODE_TEXT = { weight: 'weight and reps', bodyweight: 'reps, weight optional', timed: 'seconds, weight optional' };

/** Today-only exercises (logic/extras.js) after the template ones, then the add form or button. Extras use indexes after the template's. */
function extraPanels(state, session, day) {
  const extras = extrasFor(state.wExtras, day);
  const panels = extras.map((ex, k) => exercisePanel(state, ex, session.exercises.length + k, day, true)).join('');
  const form = state.wAdd
    ? `<div class="panel"><h2>ADD FOR TODAY</h2>
        <label class="lbl" for="xe-name">NAME</label>
        <input id="xe-name" class="field" maxlength="60" placeholder="Face pulls" autocomplete="off">
        <label class="lbl" for="xe-equip">EQUIPMENT</label>
        <select id="xe-equip" class="field"><option value="">Not set</option>${EQUIPMENT.map((q) => `<option value="${q}">${esc(EQUIP_TEXT[q])}</option>`).join('')}</select>
        <label class="lbl" for="xe-mode">WHAT YOU LOG</label>
        <select id="xe-mode" class="field">${Object.entries(MODE_TEXT).map(([m, t]) => `<option value="${m}">${esc(t)}</option>`).join('')}</select>
        <label class="check"><input type="checkbox" id="xe-side"><span>Log left and right separately</span></label>
        <div class="pair"><button class="btn secondary" data-action="addExtraCancel">CANCEL</button><button class="btn" data-action="addExtraSave">ADD</button></div>
      </div>`
    : '<button class="btn secondary" data-action="addExtraOpen">ADD EXERCISE FOR TODAY</button>';
  return panels + form;
}
