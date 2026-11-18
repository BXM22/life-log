// WORKOUT v2 Exercise page (screen 5): info strip, logging card with steppers, plates accordion, logged sets.
//   html: exercisePage(state) (no rest bar, menus or sheets; the integrator appends them)
//   actions used: wCloseEx, wExPrev / wExNext, wStep, wMenuToggle, logSet (data-kind, data-i), platesOpen / platesClose, startEdit, deleteEntry
// Input ids stay w-i, r-i, s-i, sd-i, ld-i because logSet and the plate calculator read them.

import { logicalDate } from '../logic/dates.js';
import { lastWorking, progressionPrompt, setText, setsFor, suggestWarmup } from '../logic/workout.js';
import { backCue, trimmedFor, trimmedTarget } from '../logic/workoutExtras.js';
import { setDots, setsComplete } from '../logic/workoutPlan.js';
import { bestSet } from '../logic/records.js';
import { esc } from './format.js';
import { editForm } from './historyView.js';
import { platesPanel } from './platesView.js';
import { EQUIP_TEXT } from './templateView.js';
import { workoutContext } from './workoutNavActions.js';
import { todayPage } from './workoutToday.js';

const svg = (d, s = 24) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const BACK = `<button class="back-link" data-action="wCloseEx" aria-label="Back to workout">${svg('<path d="M15 5l-7 7 7 7"/>')}</button>`;
const DOTS_ICON = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>';

function stepper(id, field, i, label, value, attrs) {
  return `<div class="w2-step"><label class="w2-steplbl" for="${id}-${i}">${label}</label>
    <div class="w2-stepbox">
      <button class="w2-stepbtn" data-action="wStep" data-i="${i}" data-field="${field}" data-delta="-1" aria-label="Decrease ${field}">${svg('<path d="M5 12h14"/>')}</button>
      <input id="${id}-${i}" class="w2-stepin" type="number" ${attrs} value="${esc(value)}" aria-label="${label}">
      <button class="w2-stepbtn" data-action="wStep" data-i="${i}" data-field="${field}" data-delta="1" aria-label="Increase ${field}">${svg('<path d="M12 5v14M5 12h14"/>')}</button>
    </div></div>`;
}

const cell = (label, value, sub = '') => `<div class="w2-cell"><span class="w2-cl">${label}</span><b>${value}</b>${sub ? `<small>${sub}</small>` : ''}</div>`;

/** Exercise page markup for state.wEx, or the Today page if that index no longer exists. */
export function exercisePage(state) {
  const day = logicalDate(Date.now(), state.dayStartHour);
  const { list } = workoutContext(state, day);
  const i = state.wEx;
  const item = list.find((x) => x.i === i);
  if (!item) return todayPage(state);
  const { ex, kind } = item;
  const cali = kind === 'cali' || ex.equipment === 'calisthenics';
  const extra = kind === 'extra';
  const d = state.wDraft?.[i] ?? {};
  const last = lastWorking(state.entries, state.stats, ex.name);
  const warm = suggestWarmup(last);
  const pr = bestSet(state.entries, state.stats, ex.name);
  const trimmed = trimmedFor(state.wTrims, day, ex.name, ex.target);
  const target = ex.target ? `${esc(trimmedTarget(ex.target, trimmed))}${trimmed ? ` (was ${esc(ex.target)})` : ''}` : '-';
  const sets = setsFor(state.entries, day, ex.name).filter((e) => kind !== 'cali' || e.data.session === item.sessionKey);
  const tag = extra ? 'Today only' : kind === 'cali' ? 'Calisthenics' : ex.equipment ? EQUIP_TEXT[ex.equipment] : '';

  const weightLabel = ex.mode === 'weight' && !cali ? 'Weight (lb)' : 'Weight (lb, optional)';
  const loadSel = cali
    ? `<label class="lbl" for="ld-${i}">WEIGHT TYPE</label><select id="ld-${i}" class="field" aria-label="Weight type">${[['resistance', 'Added weight'], ['assisted', 'Assisted weight']].map(([v, t]) => `<option value="${v}" ${(d.ld ?? last?.load ?? 'resistance') === v ? 'selected' : ''}>${t}</option>`).join('')}</select>`
    : '';
  const sideSel = ex.perSide
    ? `<label class="lbl" for="sd-${i}">SIDE</label><select id="sd-${i}" class="field" aria-label="Side"><option value="L" ${d.sd === 'R' ? '' : 'selected'}>Left</option><option value="R" ${d.sd === 'R' ? 'selected' : ''}>Right</option></select>`
    : '';
  const second = ex.mode === 'timed'
    ? stepper('s', 'seconds', i, 'Seconds', d.s ?? last?.seconds ?? '', 'inputmode="numeric" step="1"')
    : stepper('r', 'reps', i, 'Reps', d.r ?? last?.reps ?? '', 'inputmode="numeric" step="1"');

  const complete = !state.wMore?.[i] && setsComplete(ex, state.entries, day, state.wTrims);
  const tryTip = kind === 'template' && i === 0 && progressionPrompt(last, ex) ? `<p class="w2-try"><b>TRY TODAY</b> ${esc(progressionPrompt(last, ex))}</p>` : '';
  const cue = state.wCues?.[i] && backCue(ex.name) ? `<p class="w2-cue"><b>BACK CUE</b> ${esc(backCue(ex.name))}</p>` : '';

  const platesOpen = state.plates?.i === i;
  const plates = ex.mode === 'weight' && !cali && !extra
    ? `<div class="w2-acc"><button class="w2-accbtn" data-action="${platesOpen ? 'platesClose' : 'platesOpen'}" data-i="${i}" aria-expanded="${platesOpen}"><span>Plate calculator</span>${svg(platesOpen ? '<path d="M5 15l7-7 7 7"/>' : '<path d="M5 9l7 7 7-7"/>', 20)}</button>${platesPanel(state, i)}</div>`
    : '';

  const rows = sets.map((e) => (state.editId === e.id ? editForm(e) : `<div class="entry"><div class="row"><span>${e.data.kind === 'warmup' ? 'Warm-up' : 'Set'} ${esc(setText(e.data))}</span>
      <span class="actions"><button class="btn secondary small" data-action="startEdit" data-id="${esc(e.id)}" aria-label="Edit this set">EDIT</button>
      <button class="btn secondary small" data-action="deleteEntry" data-id="${esc(e.id)}" aria-label="Delete this set">DEL</button></span></div></div>`)).join('');

  return `<div class="w2-page">
    <header class="w2-exhead">${BACK}
      <div class="w2-pager"><button class="w2-pg" data-action="wExPrev" data-delta="-1" aria-label="Previous exercise" ${i > 0 ? '' : 'disabled'}>${svg('<path d="M15 5l-7 7 7 7"/>', 20)}</button>
        <span class="w2-pgtxt">Exercise ${list.findIndex((x) => x.i === i) + 1} of ${list.length}</span>
        <button class="w2-pg" data-action="wExNext" data-delta="1" aria-label="Next exercise" ${i < list.length - 1 ? '' : 'disabled'}>${svg('<path d="M9 5l7 7-7 7"/>', 20)}</button></div>
      <button class="w2-icon" data-action="wMenuToggle" data-menu="exercise" aria-label="Exercise options" aria-haspopup="menu">${DOTS_ICON}</button></header>
    <div class="w2-titlerow"><h1 class="w2-title">${esc(ex.name)}</h1>${tag ? `<span class="tag w2-tag">${esc(tag)}</span>` : ''}</div>
    <div class="w2-strip">
      ${cell('TARGET', target)}
      ${cell('LAST', last ? esc(setText(last)) : '-', last ? esc(last.date.slice(5)) : 'No history')}
      ${cell('WARM-UP', warm ? `${warm} lb` : '-')}
      ${cell('PR', pr ? esc(pr.text) : '-', pr ? (pr.est1rm ? `est. 1RM ${pr.est1rm}` : esc(pr.date.slice(5))) : 'No history')}
    </div>
    ${tryTip}${cue}
    <section class="w2-card w2-log">
      ${stepper('w', 'weight', i, weightLabel, d.w ?? last?.weight ?? '', 'inputmode="decimal" step="0.5"')}
      ${second}
      ${loadSel}${sideSel}
      ${complete
        ? `<p class="w2-sub"><b>All ${setDots(ex, state.entries, day, state.wTrims).total} sets done.</b></p>
      <div class="pair">
        <button class="btn secondary" data-action="wMoreSets" data-i="${i}">ADD EXTRA SET</button>
        <button class="btn" data-action="${i < list.length - 1 ? 'wExNext' : 'wCloseEx'}" data-delta="1">${i < list.length - 1 ? 'NEXT EXERCISE' : 'BACK TO LIST'}</button>
      </div>`
        : `<div class="pair">
        <button class="btn secondary" data-action="logSet" data-kind="warmup" data-i="${i}">WARM-UP SET</button>
        <button class="btn" data-action="logSet" data-kind="working" data-i="${i}">WORKING SET</button>
      </div>`}
    </section>
    ${plates}
    ${extra ? `<button class="btn ${ex.done ? 'secondary' : ''}" data-action="toggleExtraDone" data-name="${esc(ex.name)}">${ex.done ? 'MARK NOT DONE' : 'MARK DONE'}</button>` : ''}
    <section class="w2-card"><h2 class="w2-label">LOGGED TODAY · ${sets.length}</h2>${rows || '<p class="w2-sub">No sets yet.</p>'}</section>
  </div>`;
}
