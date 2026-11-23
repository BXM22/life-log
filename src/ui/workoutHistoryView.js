// WORKOUT tab, history page: past workout days grouped This week / Last week / Earlier, newest first.
//   html: workoutHistoryView(state)   (back arrow = toggleHistory; each day is a native <details>, which closes on re-render)
//   styles: src/styles/workout-pages.css (.w2-*)

import { workoutDays } from '../logic/workoutHistory.js';
import { groupHistoryDays } from '../logic/workoutPlan.js';
import { weekday } from '../logic/workout.js';
import { logicalDate } from '../logic/dates.js';
import { esc } from './format.js';

const MAX_DAYS = 60;
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const backButton = (action, label) =>
  `<button class="back-link" data-action="${action}" aria-label="${label}"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>`;

const setChips = (ex) => [
  ...ex.warmup.map((t) => `<span class="w2-set warm" title="Warm-up">${esc(t)}</span>`),
  ...ex.working.map((t) => `<span class="w2-set">${esc(t)}</span>`),
].join('');

export const HIST_FILTERS = [['all', 'All'], ['week', 'This week'], ['last', 'Last week'], ['earlier', 'Earlier']];
const GROUP_KEY = { 'This week': 'week', 'Last week': 'last', Earlier: 'earlier' };

/** Does a day match the search text (exercise, session or date)? Empty query matches everything. */
export function dayMatches(d, query) {
  const q = String(query ?? '').trim().toLowerCase();
  if (!q) return true;
  const hay = [d.date, DAY_NAMES[weekday(d.date)], ...d.sessions.flatMap((s) => [s.name, ...s.exercises.map((e) => e.name)])].join(' ').toLowerCase();
  return q.split(/\s+/).every((w) => hay.includes(w));
}

/** Client-side filter of grouped days by filter key and search text; groups left empty are dropped. */
export function filterGroups(groups, key, query) {
  return groups
    .filter((g) => !key || key === 'all' || GROUP_KEY[g.label] === key)
    .map((g) => ({ ...g, days: g.days.filter((d) => dayMatches(d, query)) }))
    .filter((g) => g.days.length);
}

function dayBlock(d, open) {
  const names = d.sessions.map((s) => s.name).join(' + ');
  const body = d.sessions.map((s) => `${d.sessions.length > 1 ? `<h3>${esc(s.name)}</h3>` : ''}${s.exercises.map((ex) =>
    `<div class="w2-hex"><b>${esc(ex.name)}</b><div class="w2-sets">${setChips(ex)}</div></div>`).join('')}`).join('');
  return `<details class="w2-day"${open ? ' open' : ''}><summary><span class="w2-day-name">${DAY_NAMES[weekday(d.date)]} ${esc(d.date.slice(5))} · ${esc(names)}</span><span class="w2-day-count">${d.count} set${d.count === 1 ? '' : 's'}</span></summary><div class="w2-day-body">${body}</div></details>`;
}

export function workoutHistoryView(state) {
  const days = workoutDays(state.entries);
  const all = groupHistoryDays(days.slice(0, MAX_DAYS), logicalDate(Date.now(), state.dayStartHour));
  const key = state.wHistFilterKey || 'all';
  const query = state.wHistQuery ?? '';
  const groups = filterGroups(all, key, query);
  const searching = query.trim() !== '';
  const chips = HIST_FILTERS.map(([k, t]) => `<button class="btn w2-hchip" data-action="wHistFilter" data-key="${k}" aria-pressed="${k === key}">${t}</button>`).join('');
  const list = groups.map((g) => `<h2 class="w2-group">${esc(g.label)}</h2>${g.days.map((d) => dayBlock(d, g.label === 'This week' || searching)).join('')}`).join('')
    || `<p>${days.length ? 'No workouts match.' : 'No workouts logged yet.'}</p>`;
  return `<div class="w2-page w2-hist">
    <div class="backrow">${backButton('toggleHistory', 'Back to workout')}</div>
    <h2 class="subtitle">Workout history</h2>
    <input class="field w2-hsearch" id="w-hist-search" type="search" data-action="wHistSearch" placeholder="Search exercise or day" aria-label="Search workout history" autocomplete="off" value="${esc(query)}">
    <div class="w2-hchips" role="group" aria-label="Filter by week">${chips}</div>
    ${list}
    ${days.length > MAX_DAYS ? `<p class="w2-note">Showing the newest ${MAX_DAYS} of ${days.length} days.</p>` : ''}
    <p class="w2-note">Workouts older than your keep window are in your Dropbox exports.</p>
  </div>`;
}
