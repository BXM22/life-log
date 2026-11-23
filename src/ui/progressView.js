// HISTORY progress views (F39, F40) and the PR banner shown after a working set is logged.
//   prBanner(state)                  banner html (Workout tab only); state.pr comes from logic/progress.js prCheck
//   heatmapCard(state, today)        Last 5 weeks heatmap, five shades, with a legend
//   habitsPage(state, today)         the Habits page (state.histWin === 'habits'): Streaks list + heatmap
//   progressPanels(state, today)     older name kept: the heatmap card alone (the goal projection lives on the Weight page)
// Styles: src/styles/w3-history.css (.hv-*).

import { habitHeatmap } from '../logic/progress.js';
import { esc } from './format.js';
import { pageHead } from './historyWindows.js';
import { streaksPanel } from './weekPanel.js';

const LEVEL_WORD = ['none', 'some', 'half', 'most', 'all'];
const UNIT = { '1RM': 'est. 1RM', sec: 'sec', reps: 'reps' };
const LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function prBanner(state) {
  const p = state.pr;
  if (!p || state.tab !== 'workout') return '';
  return `<button class="prbanner" data-action="dismissPR" role="status">NEW PR &middot; ${esc(p.exercise)} ${p.unit === '1RM' && p.text ? `${esc(p.text)} <small>est. 1RM ${esc(p.value)}, was ${esc(p.previous)}</small>` : `${esc(p.value)} ${esc(UNIT[p.unit] || p.unit)} <small>was ${esc(p.previous)}</small>`}</button>`;
}

const shortDate = (d) => new Date(`${d}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export function heatmapCard(state, today) {
  const habits = state.habits ?? [];
  if (!habits.length) return '<section class="hv-card"><h3 class="hv-sec">Last 5 weeks</h3><p class="hv-empty"><b>No habits yet</b>Add one on the Today tab to fill this in.</p></section>';
  const weeks = habitHeatmap(state.entries, habits, today);
  const head = `<div class="hv-hm hv-hmhead" aria-hidden="true">${LETTERS.map((l) => `<span>${l}</span>`).join('')}</div>`;
  const rows = weeks.map((wk) => `<div class="hv-hm">${wk.map((c) => `<span class="hv-hmc l${c.level}${c.future ? ' future' : ''}${c.date === today ? ' is-today' : ''}" role="img" aria-label="${esc(shortDate(c.date))}: ${c.future ? 'upcoming' : `${c.done} of ${c.total} habits, ${LEVEL_WORD[c.level]}`}"></span>`).join('')}</div>`).join('');
  const past = weeks.flat().filter((c) => !c.future);
  const full = past.filter((c) => c.level === 4).length;
  const legend = `<div class="hv-legend" aria-hidden="true"><span>None</span>${[0, 1, 2, 3, 4].map((l) => `<i class="hv-hmc l${l}"></i>`).join('')}<span>All</span></div>`;
  return `<section class="hv-card" aria-label="Habits, last 5 weeks"><h3 class="hv-sec">Last 5 weeks<span class="hv-count" aria-label="${full} days with every habit done">${full} full</span></h3>
    ${head}${rows}${legend}
    <p class="hv-proj-note">${full} of the last ${past.length} days had every habit done.</p></section>`;
}

export const progressPanels = (state, today) => heatmapCard(state, today);

export function habitsPage(state, today) {
  return `<div class="hv-page">${pageHead('Habits')}${streaksPanel(state, today)}<div class="hv-gap"></div>${heatmapCard(state, today)}</div>`;
}
