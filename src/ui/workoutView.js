// WORKOUT tab: today's session from the template, one panel per exercise.
//   html:    workoutView(state)
//   actions: data-action="pickSession" | "toggleManage" | "logSet" (data-i = exercise index, data-kind = warmup | working), see workoutActions.js
// Warm-up and working sets are logged separately. The weight box is pre-filled from the last working set.

import { getSessions, sessionById } from '../logic/template.js';
import { activeSessionId, lastWorking, setText, setsFor, suggestWarmup } from '../logic/workout.js';
import { logicalDate } from '../logic/dates.js';
import { esc } from './format.js';
import { manageView } from './templateView.js';
import { editForm } from './historyView.js';
import { restPanel } from './restView.js';

function exercisePanel(state, ex, i, day) {
  const last = lastWorking(state.entries, state.stats, ex.name);
  const warm = suggestWarmup(last);
  const sets = setsFor(state.entries, day, ex.name);
  const optional = ex.mode === 'weight' ? '' : ' (optional)';

  const inputs = [
    `<input id="w-${i}" class="field" type="number" inputmode="decimal" step="0.5" value="${esc(last?.weight ?? '')}" placeholder="Weight (lb)${optional}" aria-label="Weight in lb">`,
    ex.mode === 'timed'
      ? `<input id="s-${i}" class="field" type="number" inputmode="numeric" step="1" value="${esc(last?.seconds ?? '')}" placeholder="Seconds" aria-label="Seconds">`
      : `<input id="r-${i}" class="field" type="number" inputmode="numeric" step="1" placeholder="Reps" aria-label="Reps">`,
    ex.perSide
      ? `<select id="sd-${i}" class="field" aria-label="Side"><option value="L">Left</option><option value="R">Right</option></select>`
      : '',
  ].join('');

  // Each logged set can be edited or deleted right here (same actions as the History tab).
  const rows = sets.map((e) => (state.editId === e.id ? editForm(e) : `<div class="entry"><div class="row"><span>${e.data.kind === 'warmup' ? 'Warm-up' : 'Set'} ${esc(setText(e.data))}</span>
      <span class="actions"><button class="btn secondary small" data-action="startEdit" data-id="${esc(e.id)}" aria-label="Edit this set">EDIT</button>
      <button class="btn secondary small" data-action="deleteEntry" data-id="${esc(e.id)}" aria-label="Delete this set">DEL</button></span></div></div>`)).join('');

  return `<div class="panel">
    <h2>${esc(ex.name)}</h2>
    <p>Target ${esc(ex.target)}. Warm-up: ${esc(ex.warmup)}.</p>
    <p>${last ? `Last: ${esc(setText(last))} on ${esc(last.date.slice(5))}.` : 'No history yet.'}${warm ? ` Warm-up about ${warm} lb.` : ''}</p>
    ${inputs}
    <div class="pair">
      <button class="btn secondary" data-action="logSet" data-kind="warmup" data-i="${i}">WARM-UP SET</button>
      <button class="btn" data-action="logSet" data-kind="working" data-i="${i}">WORKING SET</button>
    </div>
    ${rows}
  </div>`;
}

export function workoutView(state) {
  const day = logicalDate(Date.now(), state.dayStartHour);
  const id = activeSessionId(state.wSession, day, state.planDays);
  const session = sessionById(id);
  const picker = getSessions().map((s) => `<option value="${s.id}" ${s.id === id ? 'selected' : ''}>${esc(s.name)}</option>`).join('');
  return `<div class="panel">
      <h2>WORKOUT ${esc(day.slice(5))}</h2>
      <p><select data-action="pickSession" aria-label="Session">${picker}</select></p>
      <p>${esc(session.focus)}. Add weight or reps on the first exercise each week.</p>
      <button class="btn secondary" data-action="toggleManage">${state.wManage ? 'DONE EDITING' : 'EDIT EXERCISES'}</button>
    </div>
    ${state.wManage ? '' : restPanel(state)}
    ${state.wManage ? manageView(state, session) : session.exercises.map((ex, i) => exercisePanel(state, ex, i, day)).join('')}`;
}
