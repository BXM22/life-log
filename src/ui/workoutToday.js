// WORKOUT v2 Today page (screens 1, 12, 13): template card, "Before you lift", one row per exercise.
//   html: todayPage(state) (no rest bar, menus or sheets; the integrator appends them)
//   actions used: wOpenEx (data-i), wMenuToggle, wSheetOpen (data-sheet = switch | warm | add), aOpen / aManage / aNew (activities)

import { logicalDate } from '../logic/dates.js';
import { setsFor, lastWorking } from '../logic/workout.js';
import { CHECKLISTS, checklistKey, checkedCount, trimmedFor, trimmedTarget } from '../logic/workoutExtras.js';
import { activitiesCard } from './workoutActivities.js';
import { setDots, sessionProgress } from '../logic/workoutPlan.js';
import { esc } from './format.js';
import { EQUIP_TEXT } from './templateView.js';
import { workoutContext } from './workoutNavActions.js';

const CHEV = '<svg class="w2-chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';
const DOTS_ICON = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>';

const dateLabel = (day) => new Date(`${day}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

/** Target text after trims, such as "Target 2 x 6-8 (trimmed 1 from 3 x 6-8)". */
const targetText = (state, ex, day) => {
  const trimmed = trimmedFor(state.wTrims, day, ex.name, ex.target);
  return `Target ${esc(trimmedTarget(ex.target, trimmed))}${trimmed ? ` (trimmed ${trimmed} from ${esc(ex.target)})` : ''}`;
};

/** Equipment or load tag text for a list item, or ''. */
function tagText(state, item) {
  if (item.kind === 'cali') {
    const last = lastWorking(state.entries, state.stats, item.ex.name);
    return last?.load === 'assisted' ? 'Assisted' : last?.load === 'resistance' ? 'Added weight' : 'Calisthenics';
  }
  return item.ex.equipment ? EQUIP_TEXT[item.ex.equipment] ?? '' : '';
}

/** Index of the row being worked on: the exercise most recently logged today, else the first incomplete one. */
function currentIndex(state, list, day) {
  let best = -1;
  let at = -1;
  list.forEach((item, k) => {
    for (const e of setsFor(state.entries, day, item.ex.name)) {
      if (item.kind === 'cali' && e.data.session !== item.sessionKey) continue;
      if (e.updatedAt >= at) { at = e.updatedAt; best = k; }
    }
  });
  if (best >= 0) return list[best].i;
  const first = list.find((item) => {
    const d = setDots(item.ex, state.entries, day, state.wTrims);
    return d.total != null && d.done < d.total;
  });
  return first ? first.i : -1;
}

function dotsHtml(state, item, day) {
  const d = setDots(item.ex, state.entries, day, state.wTrims);
  if (d.total == null) return '';
  const n = Math.min(d.total, 12);
  const done = Math.min(d.done, n);
  return `<span class="w2-dots" role="img" aria-label="${d.done} of ${d.total} sets done">${Array.from({ length: n }, (_, k) => `<i class="${k < done ? 'on' : ''}"></i>`).join('')}</span>`;
}

function row(state, item, day, current) {
  const extra = item.kind === 'extra';
  const tag = extra ? 'Today only' : tagText(state, item);
  const cls = ['w2-row', extra ? 'extra' : '', item.i === current ? 'current' : ''].filter(Boolean).join(' ');
  return `<button class="${cls}" data-action="wOpenEx" data-i="${item.i}" aria-label="Open ${esc(item.ex.name)}">
    <span class="w2-rowmain">
      <span class="w2-name">${esc(item.ex.name)}</span>
      <span class="w2-detail">${targetText(state, item.ex, day)}</span>
    </span>
    ${tag ? `<span class="tag w2-tag">${esc(tag)}</span>` : ''}
    ${extra ? '' : dotsHtml(state, item, day)}
    ${CHEV}
  </button>`;
}

const sheetRow = (title, count, sheet, extraCls = '') => `<button class="w2-line ${extraCls}" data-action="wSheetOpen" data-sheet="${sheet}">
    <span class="w2-linetitle">${esc(title)}</span><span class="w2-count">${count}</span>${CHEV}</button>`;

function beforeYouLift(state, session, day) {
  const key = checklistKey(session);
  if (!key) return '';
  return `<section class="w2-card"><h2 class="w2-label">BEFORE YOU LIFT</h2>${sheetRow(CHECKLISTS[key].title, `${checkedCount(state.wChecks, day, key)} / ${CHECKLISTS[key].items.length}`, 'warm')}</section>`;
}

/** Today page markup. */
export function todayPage(state) {
  const day = logicalDate(Date.now(), state.dayStartHour);
  const { session, cali, list } = workoutContext(state, day);
  const prog = sessionProgress(list.map((x) => x.ex), state.entries, day, state.wTrims);
  const pct = prog.total ? Math.min(100, Math.round((prog.done / prog.total) * 100)) : 0;
  const current = currentIndex(state, list, day);

  const lifts = list.filter((x) => x.kind !== 'cali');
  const calis = list.filter((x) => x.kind === 'cali');
  const group = (label, items) => `<h2 class="w2-label">${label}</h2><div class="w2-list">${items.map((x) => row(state, x, day, current)).join('')}</div>`;
  const addBtn = '<button class="w2-add" data-action="wSheetOpen" data-sheet="add">+ Add exercise for today</button>';

  let body;
  if (!list.length) body = '<div class="w2-card"><p>No exercises yet. Open Switch, then Edit on this template to add some.</p></div>' + addBtn;
  else if (cali) body = `${group('LIFTS', lifts)}${addBtn}${group(`CALISTHENICS · ${esc(cali.id)}`, calis)}`;
  else body = `${group(`EXERCISES · ${list.length}`, lifts)}${addBtn}`;

  return `<div class="w2-page">
    <header class="w2-head"><div><span class="w2-over">LIFE LOG · ${esc(dateLabel(day))}</span><h1>Workout</h1></div>
      <button class="w2-icon" data-action="wMenuToggle" data-menu="today" aria-label="Workout menu" aria-haspopup="menu">${DOTS_ICON}</button></header>
    <section class="w2-card w2-tpl">
      <div class="w2-tplhead"><div><span class="w2-sub">Active template</span><b class="w2-tplname">${esc(session.name)}</b></div>
        <button class="w2-switch" data-action="wSheetOpen" data-sheet="switch" aria-label="Switch template">Switch</button></div>
      ${prog.total ? `<div class="w2-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${prog.total}" aria-valuenow="${prog.done}"><i style="width:${pct}%"></i></div>
      <p class="w2-sub">${prog.done} of ${prog.total} sets</p>` : ''}
      ${session.focus ? `<p class="w2-sub">${esc(session.focus)}</p>` : ''}
    </section>
    ${beforeYouLift(state, session, day)}
    ${activitiesCard(state, day, list.findIndex((x) => x.kind === 'cali'))}
    ${body}
  </div>`;
}
