// Workout v2 sheets and dropdown menus (docs/screens/workout.md screens 2, 3, 4, 6, 7).
//   html:    sheetLayer(state) -> open sheet + scrim or ''; menuLayer(state) -> open dropdown + transparent scrim or ''
//   state:   wSheet (null | 'switch' | 'warm' | 'add' | 'activity' | 'actmgr' | 'lib'), wMenu (null | 'today' | 'exercise'), wEx (exercise index or null)
//   actions: wSheetOpen, wSheetClose, wSheetTab, wMenuToggle, wMenuClose, wEditTemplate, wEditExercise, wOpenTemplates, wOpenHistory,
//            switch sheet (F72): wSwitchTo, wSessionClear, wQuickLabel, wQuickStart; menu: wSaveQuick (quickWorkoutActions.js)
//            (see workoutSheetActions.js); sheets reuse wSessionPick, tplFilter, toggleCheck, toggleBjj, addExtraSave, addExtraCancel,
//            trimSet, untrimSet, toggleCue, tDelete, keepExtra, removeExtra.

import { getSessions, sessionById, QUICK_LABELS, isQuickId } from '../logic/template.js';
import { activeSessionId, pickedFor, plannedSessionId } from '../logic/workout.js';
import { logicalDate } from '../logic/dates.js';
import { filterByTag, tagsOf, usedTags } from '../logic/templateTags.js';
import { CHECKLISTS, backCue, checkKey, checkedCount, checklistKey, setCount, trimmedFor } from '../logic/workoutExtras.js';
import { caliBlockFor } from '../logic/activities.js';
import { activitySheet, manageSheet } from './workoutActivities.js';
import { libraryDatalist } from './libraryActions.js';
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

// ---- Switch template (board 18) ----
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const shortDate = (d) => `${MONTHS[Number(d.slice(5, 7)) - 1]} ${Number(d.slice(8, 10))}`;

/** Latest date a working or warm-up set was logged per session id, from lift_set entries. */
export function lastDoneBySession(entries) {
  const out = {};
  for (const e of entries || []) {
    if (e.type !== 'lift_set' || e.deletedAt || !e.data?.session) continue;
    if (!out[e.data.session] || e.date > out[e.data.session]) out[e.data.session] = e.date;
  }
  return out;
}

const svg = (d, size = 22) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const SW_ICON = {
  bell: svg('<path d="M3 9v6M6.5 6.5v11M17.5 6.5v11M21 9v6M6.5 12h11"/>'),
  bolt: svg('<path d="M13 3L5 13.5h6L10 21l8-10.5h-6L13 3z"/>'),
  gear: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>', 20),
  back: svg('<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>', 18),
  chev: svg('<path d="M9 5l7 7-7 7"/>', 20),
};
const TONES = ['a', 'b', 'c'];
const WEEKDAY = (d) => new Date(`${d}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long' });
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const preview = (s) => s.exercises.slice(0, 3).map((e) => e.name.replace(/\s*\(.*?\)/g, '').replace(/\s+or\s+.*$/, '')).join(', ') + (s.exercises.length > 3 ? ', …' : '');

function switchSheet(state) {
  const all = getSessions();
  const day = dayOf(state);
  const activeId = activeSessionId(pickedFor(state, day), day, state.planDays);
  const now = sessionById(activeId);
  const planned = sessionById(plannedSessionId(state, day));
  const switched = activeId !== planned?.id;
  const last = lastDoneBySession(state.entries);
  const lastText = (id) => (last[id] ? `last done ${shortDate(last[id])}` : 'not done yet');
  const extras = extrasFor(state.wExtras, day);

  const nowMeta = now.quick
    ? (extras.length ? `${plural(extras.length, 'exercise')} added` : 'No exercises yet')
    : `${plural(now.exercises.length, 'exercise')}, ${lastText(now.id)}`;
  const nowPrev = now.quick ? extras.slice(0, 3).map((e) => e.name).join(', ') : preview(now);
  const nowCard = `<section class="sw-now" aria-label="On now: ${esc(now.name)}">
      <div class="sw-cardtop"><span class="sw-ico" aria-hidden="true">${now.quick ? SW_ICON.bolt : SW_ICON.bell}</span>
        <span class="sw-text"><b>${esc(now.name)}</b>${now.focus ? `<small>${esc(now.focus)}</small>` : ''}</span><span class="sw-pill">On now</span></div>
      <p class="sw-meta">${esc(nowMeta)}</p>${nowPrev ? `<p class="sw-prev">${esc(nowPrev)}</p>` : ''}
      ${switched && planned ? `<button class="sw-back" data-action="wSessionClear">${SW_ICON.back}<span>Back to ${esc(planned.name)}</span></button>` : ''}
    </section>`;

  const label = state.wQuickLabel;
  const quickCard = `<section class="sw-quick" aria-label="Quick workout">
      <div class="sw-cardtop"><span class="sw-bolt" aria-hidden="true">${SW_ICON.bolt}</span>
        <span class="sw-text"><b>Quick workout</b><small>Start empty and add exercises as you go. Save it as a template after.</small></span></div>
      <div class="sw-labels" role="group" aria-label="Name it (optional)">${Object.entries(QUICK_LABELS).map(([k, t]) => `<button class="sw-label" data-action="wQuickLabel" data-label="${k}" aria-pressed="${label === k}">${esc(t)}</button>`).join('')}</div>
      <button class="sw-go" data-action="wQuickStart">Start ${label ? `quick ${esc(QUICK_LABELS[label].toLowerCase())}` : 'quick workout'}</button>
    </section>`;

  const others = filterByTag(all, state.tFilter || '').filter((s) => s.id !== activeId);
  const tags = usedTags(all);
  const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  const chip = (tag, text) => `<button class="w2-chip" data-action="tplFilter" data-tag="${esc(tag)}" aria-pressed="${(state.tFilter || '') === tag}">${esc(text)}</button>`;
  const chips = all.length > 5 && tags.length ? `<div class="w2-chiprow sw-chips">${chip('', 'All')}${tags.map((t) => chip(t, cap(t))).join('')}</div>` : '';
  const cards = others.map((s) => {
    const tone = TONES[all.indexOf(s) % TONES.length];
    return `<button class="sw-card" data-tone="${tone}" data-action="wSwitchTo" data-id="${esc(s.id)}" aria-label="Switch today to ${esc(s.name)}">
      <span class="sw-ico" aria-hidden="true">${SW_ICON.bell}</span>
      <span class="sw-text"><span class="sw-name"><b>${esc(s.name)}</b>${planned && s.id === planned.id ? '<span class="sw-tag">Planned</span>' : ''}</span>
        <small>${esc(`${plural(s.exercises.length, 'exercise')}, ${lastText(s.id)}`)}</small>${s.exercises.length ? `<small class="sw-prev">${esc(preview(s))}</small>` : ''}</span>
      ${SW_ICON.chev}</button>`;
  }).join('');

  return frame('Today\'s workout', `<div class="w2-sheet-head sw-head"><div><h2 class="sw-title">Today's workout</h2>
      <p class="sw-sub">${esc(WEEKDAY(day))}${planned ? `, planned: ${esc(planned.name)}` : ''}. Only today changes.</p></div>${closeBtn}</div>
    ${nowCard}${quickCard}
    <div class="sw-listhead"><h3>Or switch to</h3><span class="sw-count">${others.length}</span></div>
    ${chips}
    <div class="sw-list">${cards || '<p class="w2-empty">No other templates with that tag.</p>'}</div>
    <button class="sw-manage" data-action="wOpenTemplates">${SW_ICON.gear}<span>Manage templates</span></button>`);
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
// With state.wXEdit set it edits that extra instead: fields are filled in and the button is SAVE (editExtraSave).
function addSheet(state) {
  const cur = state.wXEdit ? extrasFor(state.wExtras, dayOf(state)).find((e) => e.name === state.wXEdit) : null;
  const editing = Boolean(cur);
  const target = cur && cur.target !== 'as you like' ? cur.target : '';
  const title = editing ? 'Edit exercise' : 'Add for today';
  return frame(title, `<div class="w2-sheet-head"><h2>${title}</h2>${closeBtn}</div>
    <label class="lbl" for="xe-name">NAME</label>
    <input id="xe-name" class="field" maxlength="60" placeholder="Face pulls" autocomplete="off" list="lib-names" data-libfill value="${esc(cur?.name ?? '')}">${libraryDatalist(state)}
    ${editing ? '<p class="w2-sub">Sets you already logged stay under the old name.</p>' : ''}
    <label class="lbl" for="xe-equip">EQUIPMENT</label>
    <select id="xe-equip" class="field"><option value="">Not set</option>${EQUIPMENT.map((q) => `<option value="${q}" ${cur?.equipment === q ? 'selected' : ''}>${esc(EQUIP_TEXT[q])}</option>`).join('')}</select>
    <label class="lbl" for="xe-mode">WHAT YOU LOG</label>
    <select id="xe-mode" class="field">${Object.entries(MODE_TEXT).map(([m, t]) => `<option value="${m}" ${cur?.mode === m ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>
    <label class="lbl" for="xe-target">TARGET (OPTIONAL)</label>
    <input id="xe-target" class="field" maxlength="40" placeholder="3 x 8" autocomplete="off" value="${esc(target)}">
    <label class="check w2-check"><input type="checkbox" id="xe-side" ${cur?.perSide ? 'checked' : ''}><span>Log left and right separately</span></label>
    <div class="pair"><button class="btn secondary" data-action="addExtraCancel">CANCEL</button><button class="btn" data-action="${editing ? 'editExtraSave' : 'addExtraSave'}">${editing ? 'SAVE' : 'ADD'}</button></div>`);
}

export function sheetLayer(state) {
  if (state.wSheet === 'switch') return switchSheet(state);
  if (state.wSheet === 'warm') return warmSheet(state);
  if (state.wSheet === 'add') return addSheet(state);
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
    return dropdown('Exercise options', item('toggleExtraDone', ex.done ? 'Mark not done' : 'Mark done', ex.done ? 'Put it back on today\'s list' : 'Tick it off and move on', `data-name="${name}"`)
      + item('editExtraOpen', 'Edit exercise', 'Name, equipment, target', `data-name="${name}"`)
      + item('keepExtra', 'Keep in template', 'Add it to this template', `data-name="${name}"`)
      + item('libSave', 'Save to library', 'Reuse it and autofill later', `data-i="${i}"`)
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
    + item('libSave', 'Save to library', 'Reuse it and autofill later', `data-i="${i}"`)
    + item('tDelete', 'Delete from template', 'Asks to confirm first', `data-i="${i}"`, 'danger'));
}

export function menuLayer(state) {
  if (state.wMenu === 'today') {
    const day = dayOf(state);
    const quick = isQuickId(activeSessionId(pickedFor(state, day), day, state.planDays));
    return dropdown('Workout menu',
      item('wOpenTemplates', 'Templates and tags', 'Switch, add and tag templates')
      + (quick ? item('wSaveQuick', 'Save as template', 'Keep today\'s exercises as a template') : item('wEditTemplate', 'Edit this template', 'Change the active template'))
      + item('wOpenHistory', 'Workout history', 'Past sets, by day')
      + item('libOpenWin', 'Exercise library', 'Search, edit and delete saved exercises'), true);
  }
  if (state.wMenu === 'exercise') return exerciseMenu(state);
  return '';
}
