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

function dayBlock(d) {
  const names = d.sessions.map((s) => s.name).join(' + ');
  const body = d.sessions.map((s) => `${d.sessions.length > 1 ? `<h3>${esc(s.name)}</h3>` : ''}${s.exercises.map((ex) =>
    `<div class="w2-hex"><b>${esc(ex.name)}</b><div class="w2-sets">${setChips(ex)}</div></div>`).join('')}`).join('');
  return `<details class="w2-day"><summary><span class="w2-day-name">${DAY_NAMES[weekday(d.date)]} ${esc(d.date.slice(5))} · ${esc(names)}</span><span class="w2-day-count">${d.count} set${d.count === 1 ? '' : 's'}</span></summary><div class="w2-day-body">${body}</div></details>`;
}

export function workoutHistoryView(state) {
  const days = workoutDays(state.entries);
  const groups = groupHistoryDays(days.slice(0, MAX_DAYS), logicalDate(Date.now(), state.dayStartHour));
  return `<div class="w2-page">
    <div class="backrow">${backButton('toggleHistory', 'Back to workout')}</div>
    <h2 class="subtitle">Workout history</h2>
    ${groups.map((g) => `<h2 class="w2-group">${esc(g.label)}</h2>${g.days.map(dayBlock).join('')}`).join('') || '<p>No workouts logged yet.</p>'}
    ${days.length > MAX_DAYS ? `<p class="w2-note">Showing the newest ${MAX_DAYS} of ${days.length} days.</p>` : ''}
    <p class="w2-note">Workouts older than your keep window are in your Dropbox exports.</p>
  </div>`;
}
