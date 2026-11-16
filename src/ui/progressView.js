// HISTORY tab progress panels (F39, F40) and the PR banner shown after a working set is logged.
//   prBanner(state)                  banner html (Workout tab only); state.pr comes from logic/progress.js prCheck
//   progressPanels(state, today)     5-week habit heatmap, goal projection (the lift trend is in historyWindows.js)

import { habitHeatmap, goalProjection } from '../logic/progress.js';
import { weightHistory } from '../logic/entries.js';
import { GOAL_WEIGHT } from '../logic/weekView.js';
import { esc } from './format.js';

const LEVEL_WORD = ['none', 'some', 'half', 'most', 'all'];
const UNIT = { '1RM': 'est. 1RM', sec: 'sec', reps: 'reps' };

export function prBanner(state) {
  const p = state.pr;
  if (!p || state.tab !== 'workout') return '';
  return `<button class="prbanner" data-action="dismissPR" role="status">NEW PR &middot; ${esc(p.exercise)} ${esc(p.value)} ${esc(UNIT[p.unit] || p.unit)} <small>was ${esc(p.previous)}</small></button>`;
}

function projectionText(p) {
  if (p.status === 'none') return 'No weigh-ins in the last 4 weeks.';
  if (p.status === 'reached') return `Goal reached: ${esc(p.latest)} lb.`;
  if (p.status === 'few') return 'Weigh in a few more times over a week or more to see a projection.';
  if (p.status === 'wrong') return `Trend is ${p.perWeek > 0 ? 'up' : 'flat'} (${p.perWeek > 0 ? '+' : ''}${esc(p.perWeek)} lb a week), so there is no date to ${GOAL_WEIGHT} lb yet.`;
  const d = new Date(`${p.etaDate}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `At ${esc(Math.abs(p.perWeek))} lb a week down, you reach ${GOAL_WEIGHT} lb around <b>${esc(d)}</b> (${esc(p.days)} days).`;
}

export function progressPanels(state, today) {
  const heat = habitHeatmap(state.entries, state.habits, today)
    .map((wk) => `<div class="hm">${wk.map((c) => `<span class="hmc l${c.level}${c.future ? ' future' : ''}" role="img" aria-label="${esc(c.date)}: ${c.done} of ${c.total} habits ${LEVEL_WORD[c.level]}"></span>`).join('')}</div>`).join('');
  return `<div class="panel"><h2>HABITS, 5 WEEKS</h2>${state.habits.length ? heat : '<p class="note">No habits yet.</p>'}</div>
    <div class="panel"><h2>GOAL ${GOAL_WEIGHT} LB</h2><p>${projectionText(goalProjection(weightHistory(state.entries, state.stats), today))}</p></div>`;
}
