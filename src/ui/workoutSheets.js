// Workout v2 sheets and dropdown menus (docs/screens/workout.md screens 2, 3, 4, 6, 7).
//   html:    sheetLayer(state) -> open sheet + scrim or ''; menuLayer(state) -> open dropdown + transparent scrim or ''
//   state:   wSheet (null | 'switch' | 'warm' | 'add' | 'activity' | 'actmgr'), wMenu (null | 'today' | 'exercise'), wEx (exercise index or null)
//   actions: wSheetOpen, wSheetClose, wSheetTab, wMenuToggle, wMenuClose, wEditTemplate, wEditExercise, wOpenTemplates, wOpenHistory
//            (see workoutSheetActions.js); sheets reuse tplPick, tplFilter, toggleCheck, toggleBjj, addExtraSave, addExtraCancel,
//            trimSet, untrimSet, toggleCue, tDelete, keepExtra, removeExtra.

import { getSessions, sessionById } from '../logic/template.js';
import { activeSessionId } from '../logic/workout.js';
import { logicalDate } from '../logic/dates.js';
import { filterByTag, tagsOf, usedTags } from '../logic/templateTags.js';
import { CHECKLISTS, backCue, checkKey, checkedCount, checklistKey, setCount, trimmedFor } from '../logic/workoutExtras.js';
import { caliBlockFor } from '../logic/activities.js';
import { activitySheet, manageSheet } from './workoutActivities.js';
import { exerciseList } from '../logic/workoutPlan.js';
import { extrasFor } from '../logic/extras.js';
import { EQUIPMENT } from '../logic/templateEdit.js';
import { EQUIP_TEXT } from './templateView.js';
import { esc } from './format.js';

const MODE_TEXT = { weight: 'weight and reps', bodyweight: 'reps, weight optional', timed: 'seconds, weight optional' };
const dayOf = (state) => logicalDate(Date.now(), state.dayStartHour);
const closeBtn = '<button class="w2-sheet-x" data-action="wSheetClose" aria-label="Close">&times;</button>';

function frame(label, inner) {
  return `<div class="qa-scrim" data-action="wSheetClose"></div>
    <div class="qa-sheet w2-sheet" role="dialog" aria-modal="true" aria-label="${esc(label)}">
      <div class="w2-grab" aria-hidden="true"></div>${inner}
    </div>`;
}

// ---- Switch template (screen 3) ----
function switchSheet(state) {
  const all = getSessions();
  const activeId = activeSessionId(state.wSession, dayOf(state), state.planDays);
  const tags = usedTags(all);
  const shown = filterByTag(all, state.tFilter || '');
  const chip = (tag, text) => `<button class="w2-chip" data-action="tplFilter" data-tag="${esc(tag)}" aria-pressed="${(state.tFilter || '') === tag}">${esc(text)}</button>`;
  const chips = tags.length ? `<div class="w2-chiprow">${chip('', 'All')}${tags.map((t) => chip(t, t)).join('')}</div>` : '';
  const rows = shown.map((s) => {
    const on = s.id === activeId;
    const n = s.exercises.length;
    const tg = tagsOf(s)[0];
    return `<button class="w2-radio${on ? ' on' : ''}" data-action="tplPick" data-id="${esc(s.id)}" role="radio" aria-checked="${on}">
      <span class="w2-dot" aria-hidden="true"></span>
      <span class="w2-radio-text"><b>${esc(s.name)}</b><small>${n} exercise${n === 1 ? '' : 's'}</small></span>
      ${tg ? `<span class="w2-tag">${esc(tg)}</span>` : ''}</button>`;
  }).join('');
  return frame('Switch template', `<div class="w2-sheet-head"><h2>Switch template</h2><button class="w2-link" data-action="wOpenTemplates">Manage all</button></div>
    ${chips}
    <div role="radiogroup" aria-label="Templates">${rows || '<p class="w2-empty">No templates with that tag.</p>'}</div>
    <button class="w2-dashed" data-action="wOpenTemplates">+ New template</button>`);
}

// ---- Warm-up / BJJ / Calisthenics (screen 4) ----
function checkRows(state, day, list) {
  const ticks = state.wChecks?.[checkKey(day, list)] ?? {};
  return CHECKLISTS[list].items.map((text, i) => `<label class="check w2-check"><input type="checkbox" data-action="toggleCheck" data-list="${list}" data-i="${i}" ${ticks[i] ? 'checked' : ''}><span>${esc(text)}</span></label>`).join('');
}

function warmSheet(state) {
  const day = dayOf(state);
  const session = sessionById(activeSessionId(state.wSession, day, state.planDays));
  const wKey = checklistKey(session);
  const body = wKey ? `<p class="w2-label">${esc(CHECKLISTS[wKey].title)} ${checkedCount(state.wChecks, day, wKey)}/${CHECKLISTS[wKey].items.length}</p>${checkRows(state, day, wKey)}` : '<p class="w2-empty">No warm-up list for this template.</p>';
  return frame('Warm-up', `<div class="w2-sheet-head"><h2>Before you lift</h2>${closeBtn}</div>
    <div class="w2-body">${body}</div>
    <button class="btn w2-done" data-action="wSheetClose">Done</button>`);
}

// ---- Add for today (screen 7) ----
// The inputs keep the v1 ids (xe-name, xe-equip, xe-mode, xe-side) because addExtraSave reads them by id.
function addSheet() {
  return frame('Add for today', `<div class="w2-sheet-head"><h2>Add for today</h2>${closeBtn}</div>
    <label class="lbl" for="xe-name">NAME</label>
    <input id="xe-name" class="field" maxlength="60" placeholder="Face pulls" autocomplete="off">
    <label class="lbl" for="xe-equip">EQUIPMENT</label>
    <select id="xe-equip" class="field"><option value="">Not set</option>${EQUIPMENT.map((q) => `<option value="${q}">${esc(EQUIP_TEXT[q])}</option>`).join('')}</select>
    <label class="lbl" for="xe-mode">WHAT YOU LOG</label>
    <select id="xe-mode" class="field">${Object.entries(MODE_TEXT).map(([m, t]) => `<option value="${m}">${esc(t)}</option>`).join('')}</select>
    <label class="check w2-check"><input type="checkbox" id="xe-side"><span>Log left and right separately</span></label>
    <div class="pair"><button class="btn secondary" data-action="addExtraCancel">CANCEL</button><button class="btn" data-action="addExtraSave">ADD</button></div>`);
}

export function sheetLayer(state) {
  if (state.wSheet === 'switch') return switchSheet(state);
  if (state.wSheet === 'warm') return warmSheet(state);
  if (state.wSheet === 'add') return addSheet();
  if (state.wSheet === 'activity') return activitySheet(state, dayOf(state), { frame, closeBtn, checkRows });
  if (state.wSheet === 'actmgr') return manageSheet(state, { frame, closeBtn, checkRows });
  return '';
}

// ---- Dropdowns (screens 2 and 6) ----
const item = (action, title, hint, attrs = '', cls = '', disabled = false) =>
  `<button class="w2-item${cls ? ` ${cls}` : ''}" role="menuitem" data-action="${action}" ${attrs} ${disabled ? 'disabled' : ''}><b>${title}</b>${hint ? `<small>${hint}</small>` : ''}</button>`;

function dropdown(label, items, wide) {
  return `<div class="w2-menu-scrim" data-action="wMenuClose"></div>
    <div class="w2-menu${wide ? ' w2-menu-wide' : ''}" role="menu" aria-label="${esc(label)}">${items}</div>`;
}

function exerciseMenu(state) {
  if (state.wEx == null) return '';
  const day = dayOf(state);
  const session = sessionById(activeSessionId(state.wSession, day, state.planDays));
  if (!session) return '';
  const found = exerciseList(session, extrasFor(state.wExtras, day), caliBlockFor(state.activities, day)).find((r) => r.i === state.wEx);
  if (!found) return '';
  const { ex, i, kind } = found;
  if (kind === 'extra') {
    const name = esc(ex.name);
    return dropdown('Exercise options', item('keepExtra', 'Keep in template', 'Add it to this template', `data-name="${name}"`)
      + item('removeExtra', 'Remove from today', 'Logged sets stay in your log', `data-name="${name}"`));
  }
  if (String(kind).startsWith('cal')) return '';
  const total = setCount(ex.target);
  const trimmed = trimmedFor(state.wTrims, day, ex.name, ex.target);
  const cue = backCue(ex.name);
  return dropdown('Exercise options',
    item('wEditExercise', 'Edit exercise', 'Name, target, equipment', `data-i="${i}"`)
    + (total == null ? '' : item('trimSet', 'Trim a set', 'One fewer set today', `data-i="${i}"`, '', total - trimmed <= 1))
    + (trimmed ? item('untrimSet', 'Put back', 'Restore the trimmed set', `data-i="${i}"`) : '')
    + (cue ? item('toggleCue', state.wCues?.[i] ? 'Hide back cues' : 'Back cues', 'Form tips for this lift', `data-i="${i}"`) : '')
    + item('tDelete', 'Delete from template', 'Asks to confirm first', `data-i="${i}"`, 'danger'));
}

export function menuLayer(state) {
  if (state.wMenu === 'today') {
    return dropdown('Workout menu',
      item('wOpenTemplates', 'Templates and tags', 'Switch, add and tag templates')
      + item('wEditTemplate', 'Edit this template', 'Change the active template')
      + item('wOpenHistory', 'Workout history', 'Past sets, by day'), true);
  }
  if (state.wMenu === 'exercise') return exerciseMenu(state);
  return '';
}
