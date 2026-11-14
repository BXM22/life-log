// HISTORY tab panels for F10 and F11: week habit grid, weight trend with a 170 lb goal line, streaks.
//   html: weekPanel(state, today)   streaksPanel(state, today)

import { weekDates, habitGrid, weightTrend, chartPoints, GOAL_WEIGHT } from '../logic/weekView.js';
import { allStreaks } from '../logic/streaks.js';
import { weightHistory } from '../logic/entries.js';
import { esc } from './format.js';

const DAYS = 28;
const LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function trendChart(state, today) {
  const pts = weightTrend(weightHistory(state.entries, state.stats), today, DAYS);
  if (!pts.length) return '<p class="note">No weigh-ins in the last 4 weeks.</p>';
  const c = chartPoints(pts, today, DAYS);
  const last = pts[pts.length - 1].weight_lb;
  const gap = last - GOAL_WEIGHT;
  const gapText = gap >= 0 ? `${gap.toFixed(1)} above` : `${Math.abs(gap).toFixed(1)} below`;
  return `<svg class="trend" viewBox="0 0 320 140" role="img" aria-label="Weight, last 4 weeks, goal ${GOAL_WEIGHT} lb">
    <line class="goal" x1="14" x2="306" y1="${c.goalY}" y2="${c.goalY}"/>
    <text class="axis" x="306" y="${c.goalY - 4}" text-anchor="end">${GOAL_WEIGHT} lb goal</text>
    <text class="axis" x="14" y="12">${c.max}</text><text class="axis" x="14" y="136">${c.min}</text>
    <polyline class="wline" points="${c.line}"/>
    ${c.dots.map((d) => `<circle class="wdot" cx="${d.x}" cy="${d.y}" r="3"><title>${esc(d.date)}: ${esc(d.weight_lb)} lb</title></circle>`).join('')}
  </svg>
  <p class="note">Latest ${esc(last)} lb, ${gapText} the ${GOAL_WEIGHT} lb goal.</p>`;
}

export function weekPanel(state, today) {
  const dates = weekDates(today);
  const grid = habitGrid(state.entries, state.habits, dates, today);
  const head = `<div class="wkrow"><span></span>${dates.map((d, i) => `<span class="wkh${d === today ? ' now' : ''}">${LETTERS[i]}</span>`).join('')}<span></span></div>`;
  const rows = grid.map((r) => `<div class="wkrow"><span class="wkname">${esc(r.habit.name)}</span>${r.cells.map((c) => `<span class="wkcell${c.done ? ' on' : ''}${c.future ? ' future' : ''}" role="img" aria-label="${esc(c.date)} ${c.done ? 'done' : 'not done'}"></span>`).join('')}<small>${r.doneCount}/7</small></div>`).join('');
  return `<div class="panel"><h2>THIS WEEK</h2>${grid.length ? head + rows : '<p class="note">No habits yet.</p>'}</div>
    <div class="panel"><h2>WEIGHT TREND</h2>${trendChart(state, today)}</div>`;
}

export function streaksPanel(state, today) {
  const rows = allStreaks(state.entries, state.habits, today)
    .map((s) => `<div class="row"><span>${esc(s.name)}</span><span>${s.current} day${s.current === 1 ? '' : 's'} <small>best ${s.best}</small></span></div>`).join('');
  return `<div class="panel"><h2>STREAKS</h2>${rows}</div>`;
}
