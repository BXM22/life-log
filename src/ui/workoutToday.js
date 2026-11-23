// WORKOUT v3 Today page (board 14): header with rest pill and menu, template card, Next up button, Warm-up + Activities card,
// Up next list with a Done fold.
//   html: todayPage(state) (no rest bar, menus or sheets; the integrator appends them)
//   actions used: wDoneToggle (state.wDoneOpen), restOpen (via restChip), wOpenEx (data-i), wMenuToggle, wSheetOpen (data-sheet = switch | warm | add), aOpen / aManage / aNew (activities)

import { logicalDate } from '../logic/dates.js';
import { setsFor, lastWorking } from '../logic/workout.js';
import { CHECKLISTS, checklistKey, checkedCount, trimmedFor, trimmedTarget } from '../logic/workoutExtras.js';
import { activitiesCard } from './workoutActivities.js';
import { setDots, sessionProgress, daySummary } from '../logic/workoutPlan.js';
import { prsOn } from '../logic/progress.js';
import { isChecked } from '../logic/habits.js';
import { esc } from './format.js';
import { EQUIP_TEXT } from './templateView.js';
import { workoutContext } from './workoutNavActions.js';
import { restChip } from './restView.js';
import { switchedFrom } from '../logic/workout.js';

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

/** Unfinished: a done spontaneous exercise, a set count reached, or a no-count exercise already logged are finished. */
export function isOpen(state, item, day) {
  if (item.kind === 'extra' && item.ex.done) return false;
  const d = setDots(item.ex, state.entries, day, state.wTrims);
  return d.total == null ? d.done === 0 : d.done < d.total;
}

/** Index of the row being worked on: the exercise most recently logged today, else the first incomplete one. */
export function currentIndex(state, list, day) {
  let best = -1;
  let at = -1;
  list.forEach((item, k) => {
    for (const e of setsFor(state.entries, day, item.ex.name)) {
      if (item.kind === 'cali' && e.data.session !== item.sessionKey) continue;
      if (e.updatedAt >= at) { at = e.updatedAt; best = k; }
    }
  });
  const open = (item) => isOpen(state, item, day);
  if (best >= 0 && open(list[best])) return list[best].i;
  // The one just worked on is finished: the next unfinished exercise after it (wrapping), or -1 when everything is done.
  const from = best >= 0 ? best + 1 : 0;
  const next = [...list.slice(from), ...list.slice(0, from)].find(open);
  return next ? next.i : -1;
}

function dotsHtml(state, item, day) {
  const d = setDots(item.ex, state.entries, day, state.wTrims);
  if (d.total == null) return '';
  const n = Math.min(d.total, 12);
  const done = Math.min(d.done, n);
  return `<span class="w2-dots" role="img" aria-label="${d.done} of ${d.total} sets done">${Array.from({ length: n }, (_, k) => `<i class="${k < done ? 'on' : ''}"></i>`).join('')}</span>`;
}

/** Splits 'A or B (note)' into the main exercise and the alternative; names without a plain ' or ' stay whole. */
export function splitAlt(name) {
  const m = /^([^()]+?)\s+or\s+(.+)$/.exec(name);
  return m ? { main: m[1], alt: m[2] } : { main: name, alt: '' };
}

function row(state, item, day, current) {
  const extra = item.kind === 'extra';
  const tag = extra ? 'Today only' : tagText(state, item);
  const done = !isOpen(state, item, day);
  const { main, alt } = splitAlt(item.ex.name);
  const cls = ['w2-row', extra ? 'extra' : '', done ? 'done' : '', item.i === current && !done ? 'current' : ''].filter(Boolean).join(' ');
  return `<button class="${cls}" data-action="wOpenEx" data-i="${item.i}" aria-label="Open ${esc(item.ex.name)}">
    <span class="w2-rowmain">
      <span class="w2-name">${esc(main)}</span>
      <span class="w2-detail">${targetText(state, item.ex, day)}${alt ? ` · or ${esc(alt)}` : ''}</span>
    </span>
    ${done ? '<span class="tag done w2-tag">Done</span>' : tag ? `<span class="tag w2-tag">${esc(tag)}</span>` : ''}
    ${dotsHtml(state, item, day)}
    ${CHEV}
  </button>`;
}

const sheetRow = (title, count, sheet) => `<button class="w2-line" data-action="wSheetOpen" data-sheet="${sheet}">
    <span class="w2-linetitle">${esc(title)}</span><span class="w2-count">${count}</span>${CHEV}</button>`;

function warmRow(state, session, day) {
  const key = checklistKey(session);
  return key ? sheetRow(CHECKLISTS[key].title, `${checkedCount(state.wChecks, day, key)} / ${CHECKLISTS[key].items.length}`, 'warm') : '';
}

const PR_UNIT = { '1RM': 'est. 1RM', sec: 'sec', reps: 'reps' };

/** Shown once every exercise is finished: what you did, any records, and a button to tick the Workout habit. */
function finishCard(state, list, day) {
  const sum = daySummary(list.map((x) => x.ex), state.entries, day);
  if (!sum.sets) return '<p class="w2-sub w2-alldone"><b>All exercises done.</b> Nice work.</p>';
  const prs = prsOn(state.entries, state.stats, day);
  const habit = (state.habits ?? []).find((h) => h.id === 'workout');
  const ticked = habit && isChecked(state.entries, habit, day);
  const stat = (n, label) => `<div><b>${esc(n)}</b><small>${label}</small></div>`;
  return `<section class="w2-card w2-summary" aria-label="Workout summary"><h2 class="w2-label">Workout done</h2>
    <div class="w2-sumrow">${stat(sum.sets, 'sets')}${stat(sum.exercises, sum.exercises === 1 ? 'exercise' : 'exercises')}${sum.volume ? stat(sum.volume.toLocaleString('en-US'), 'lb lifted') : ''}</div>
    ${prs.length ? `<p class="w2-prs"><b>NEW PR</b> ${prs.map((p) => `${esc(p.exercise)} ${esc(p.value)} ${esc(PR_UNIT[p.unit] || p.unit)} (was ${esc(p.previous)})`).join(' · ')}</p>` : ''}
    ${habit ? (ticked ? '<p class="w2-sub">Workout habit ticked for today.</p>' : '<button class="btn" data-action="toggleHabit" data-habit="workout">Tick workout habit</button>') : ''}
  </section>`;
}

/** Today page markup. */
export function todayPage(state) {
  const day = logicalDate(Date.now(), state.dayStartHour);
  const { session, cali, list } = workoutContext(state, day);
  const prog = sessionProgress(list.map((x) => x.ex), state.entries, day, state.wTrims);
  const pct = prog.total ? Math.min(100, Math.round((prog.done / prog.total) * 100)) : 0;
  const current = currentIndex(state, list, day);
  const from = switchedFrom(state, day);

  const up = current >= 0 ? list.find((x) => x.i === current) : null;
  const cont = up
    ? `<button class="btn w2-next" data-action="wOpenEx" data-i="${up.i}">Next up: ${esc(splitAlt(up.ex.name).main)}</button>`
    : list.length ? finishCard(state, list, day) : '';

  const todo = list.filter((x) => isOpen(state, x, day));
  const finished = list.filter((x) => !isOpen(state, x, day));
  const open = !!state.wDoneOpen;
  const rows = (items) => items.map((x) => row(state, x, day, current)).join('');
  const addBtn = '<button class="w2-add" data-action="wSheetOpen" data-sheet="add">+ Add exercise for today</button>';
  const doneFold = finished.length
    ? `<div class="w2-fold"><button class="w2-foldbtn" data-action="wDoneToggle" aria-expanded="${open}"><span>Done</span><span class="w2-count">${finished.length}</span>${CHEV.replace('class="w2-chev"', `class="w2-chev w2-foldchev${open ? ' open' : ''}"`)}</button>${open ? `<div class="w2-list">${rows(finished)}</div>` : ''}</div>`
    : '';

  const quick = !!session.quick;
  const saveBtn = quick && list.some((x) => x.kind === 'extra') ? '<button class="btn secondary sw-save" data-action="wSaveQuick">Save as template</button>' : '';
  let body;
  if (!list.length && quick) body = `<div class="w2-card sw-empty"><b>Add your first exercise</b><p>Pick one from your library or type a new one. Add more as you go.</p><button class="btn" data-action="wSheetOpen" data-sheet="add">Add exercise</button></div>`;
  else if (!list.length) body = `<div class="w2-card"><p>No exercises yet. Open Switch, then Edit on this template to add some.</p></div>${addBtn}`;
  else body = `${todo.length ? `<h2 class="w2-label">Up next</h2><div class="w2-list">${rows(todo)}</div>` : ''}${doneFold}${addBtn}${saveBtn}`;

  const warm = warmRow(state, session, day);
  return `<div class="w2-page">
    <header class="w2-head"><div><span class="w2-over">Life log · ${esc(dateLabel(day))}</span><h1>Workout</h1></div>
      <div class="w2-headact">${restChip(state)}
      <button class="w2-icon" data-action="wMenuToggle" data-menu="today" aria-label="Workout menu" aria-haspopup="menu">${DOTS_ICON}</button></div></header>
    <section class="w2-card w2-tpl">
      <div class="w2-tplhead"><div><span class="w2-sub">${quick ? 'Quick workout, today only' : from ? `Switched from ${esc(from)}` : 'Active template'}</span><b class="w2-tplname">${esc(session.name)}</b></div>
        <button class="w2-switch" data-action="wSheetOpen" data-sheet="switch" aria-label="Switch template">Switch</button></div>
      ${prog.total ? `<div class="w2-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${prog.total}" aria-valuenow="${prog.done}"><i style="width:${pct}%"></i></div>
      <p class="w2-sub">${prog.done} of ${prog.total} sets</p>` : ''}
      ${session.focus ? `<p class="w2-sub">${esc(session.focus)}</p>` : ''}
    </section>
    ${cont}
    <section class="w2-card w2-warmcard"><h2 class="w2-label">Warm-up and activities</h2>${warm}${activitiesCard(state, day, list.findIndex((x) => x.kind === 'cali'), true)}</section>
    ${body}
  </div>`;
}
