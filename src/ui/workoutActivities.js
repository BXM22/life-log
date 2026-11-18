// Workout v2 Activities: the Today card, the log sheet for one activity, and the manage (add / edit / remove) sheet.
//   html:    activitiesCard(state, day, firstCaliIndex) | activitySheet(state, day, ui) | manageSheet(state, ui)
//            ui = { frame, closeBtn, checkRows } passed in by workoutSheets.js (avoids a circular import)
//   actions: see activityActions.js

import { activitiesFor, activityLog, activityStatus, findActivity, DAY_NAMES, UNITS } from '../logic/activities.js';
import { CHECKLISTS, checkedCount } from '../logic/workoutExtras.js';
import { caliBlockFor } from '../logic/activities.js';
import { esc } from './format.js';

const CHEV = '<svg class="w2-chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';

/** Activities card for the Today page. firstCaliIndex is the exercise index the Calisthenics row opens (or -1). */
export function activitiesCard(state, day, firstCaliIndex) {
  const todays = activitiesFor(state.activities, day);
  const rows = todays.map((a) => {
    if (a.builtin === 'cali') {
      const block = caliBlockFor(state.activities, day);
      return `<button class="w2-line" data-action="wOpenEx" data-i="${firstCaliIndex}"><span class="w2-linetitle">${esc(a.name)}</span><span class="w2-count">${esc(block?.id ?? '')} · ${block?.exercises.length ?? 0} exercises</span>${CHEV}</button>`;
    }
    const status = activityStatus(state.entries, a, day);
    return `<button class="w2-line" data-action="aOpen" data-id="${esc(a.id)}"><span class="w2-linetitle">${esc(a.name)}</span><span class="w2-count${status === 'Not yet' ? '' : ' on'}">${esc(status)}</span>${CHEV}</button>`;
  });
  if (!rows.length) { // nothing today: one slim row instead of a card
    return `<section class="w2-card"><div class="w2-acthead"><h2 class="w2-label">ACTIVITIES · NONE TODAY</h2><span><button class="editlink" data-action="aNew">+ Add</button> <button class="editlink" data-action="aManage">Edit</button></span></div></section>`;
  }
  return `<section class="w2-card"><div class="w2-acthead"><h2 class="w2-label">ACTIVITIES</h2><button class="editlink" data-action="aManage">Edit</button></div>
    ${rows.join('')}
    <button class="w2-add w2-add-in" data-action="aNew">+ Add activity</button></section>`;
}

/** The log sheet for the open activity (state.wAct). */
export function activitySheet(state, day, ui) {
  const a = findActivity(state.activities, state.wAct);
  if (!a) return '';
  const log = activityLog(state.entries, a, day);
  const parts = [];
  if (a.done) parts.push(`<label class="check w2-check"><input type="checkbox" data-action="aToggleDone" ${log.done ? 'checked' : ''}><span>${esc(a.name)} done today</span></label>`);
  if (a.distance) {
    parts.push(`<label class="lbl" for="ac-dist">DISTANCE (${esc(a.unit)})</label>
      <input id="ac-dist" class="field" inputmode="decimal" autocomplete="off" value="${log.distance ?? ''}" placeholder="3.1">
      <button class="btn secondary" data-action="aSaveDist">SAVE DISTANCE</button>`);
  }
  if (a.sets) {
    parts.push(`<label class="lbl" for="ac-reps">REPS FOR THIS SET</label>
      <input id="ac-reps" class="field" inputmode="numeric" autocomplete="off" placeholder="10">
      <button class="btn secondary" data-action="aAddSet">ADD SET</button>
      ${log.sets.length ? `<p class="w2-label">SETS TODAY · ${log.sets.length}</p><ul class="w2-actsets">${log.sets.map((r, i) => `<li><span>Set ${i + 1}: ${r} reps</span><button class="btn secondary small" data-action="aDelSet" data-i="${i}">DEL</button></li>`).join('')}</ul>` : ''}`);
  }
  if (a.id === 'bjj') {
    parts.push(`<p class="w2-label">${CHECKLISTS.bjj.title} ${checkedCount(state.wChecks, day, 'bjj')}/${CHECKLISTS.bjj.items.length}</p>${ui.checkRows(state, day, 'bjj')}`);
  }
  return ui.frame(a.name, `<div class="w2-sheet-head"><h2>${esc(a.name)}</h2>${ui.closeBtn}</div>
    <div class="w2-body">${parts.join('')}</div>
    <button class="btn w2-done" data-action="wSheetClose">Done</button>`);
}

const daysText = (a) => (a.builtin === 'cali' ? 'Mon and Wed' : a.days.length === 7 ? 'Every day' : a.days.length ? a.days.map((d) => DAY_NAMES[d]).join(' ') : 'No days set');
const logsText = (a) => [a.done && 'done check', a.distance && `distance (${a.unit})`, a.sets && 'sets and reps'].filter(Boolean).join(', ') || 'rows below';

/** The manage sheet: a list, or the add / edit form when state.wActForm is set. */
export function manageSheet(state, ui) {
  const form = state.wActForm;
  if (!form) {
    const rows = (state.activities ?? []).map((a) => `<div class="w2-actrow"><div><b>${esc(a.name)}</b><small>${esc(daysText(a))} · ${esc(logsText(a))}</small></div>
      <button class="editlink" data-action="aEdit" data-id="${esc(a.id)}" aria-label="Edit ${esc(a.name)}">Edit</button></div>`).join('');
    return ui.frame('Activities', `<div class="w2-sheet-head"><h2>Activities</h2>${ui.closeBtn}</div>
      <div class="w2-body">${rows || '<p class="w2-empty">No activities yet.</p>'}</div>
      <button class="btn w2-done" data-action="aNew">+ ADD ACTIVITY</button>`);
  }
  const a = form.id ? findActivity(state.activities, form.id) : null;
  const v = a ?? { name: '', days: [], done: true, distance: false, sets: false, unit: 'mi' };
  const cali = a?.builtin === 'cali';
  const chips = DAY_NAMES.map((n, d) => `<label class="w2-daychip"><input type="checkbox" id="ac-d${d}" ${v.days.includes(d) ? 'checked' : ''}><span>${n}</span></label>`).join('');
  const body = cali
    ? `<label class="lbl" for="ac-name">NAME</label><input id="ac-name" class="field" maxlength="30" value="${esc(v.name)}">
       <p class="w2-sub">Monday push and Wednesday pull blocks. Its exercises are logged from their rows on the Today list.</p>`
    : `<label class="lbl" for="ac-name">NAME</label><input id="ac-name" class="field" maxlength="30" placeholder="Run" autocomplete="off" value="${esc(v.name)}">
       <p class="w2-label">DAYS</p><div class="w2-days">${chips}</div>
       <p class="w2-label">WHAT YOU LOG</p>
       <label class="check w2-check"><input type="checkbox" id="ac-done" ${v.done ? 'checked' : ''}><span>Done check</span></label>
       <label class="check w2-check"><input type="checkbox" id="ac-distance" ${v.distance ? 'checked' : ''}><span>Distance</span></label>
       <label class="check w2-check"><input type="checkbox" id="ac-sets" ${v.sets ? 'checked' : ''}><span>Sets and reps</span></label>
       <label class="lbl" for="ac-unit">DISTANCE UNIT</label>
       <select id="ac-unit" class="field">${UNITS.map((u) => `<option value="${u}" ${v.unit === u ? 'selected' : ''}>${u === 'mi' ? 'Miles' : 'Kilometers'}</option>`).join('')}</select>`;
  return ui.frame(a ? 'Edit activity' : 'New activity', `<div class="w2-sheet-head"><h2>${a ? 'Edit activity' : 'New activity'}</h2>${ui.closeBtn}</div>
    <div class="w2-body">${body}${a ? `<button class="btn secondary w2-danger" data-action="aRemove" data-id="${esc(a.id)}">REMOVE ACTIVITY</button>` : ''}</div>
    <div class="pair"><button class="btn secondary" data-action="aFormBack">BACK</button><button class="btn" data-action="aSave">SAVE</button></div>`);
}
