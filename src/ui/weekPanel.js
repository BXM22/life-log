// HISTORY v2: the This week card on the root, the Weight page (hero, 28-day chart with goal and projection, recent weigh-ins)
// and the streaks list used by the Habits page. Styles: src/styles/w3-history.css (.hv-*).
//   html: weekPanel(state, today)          This week card (habits by seven days)
//         weightChart(state, today)        28-day chart svg + text summary, or an empty note
//         weightPage(state, today)         the Weight page (state.histWin === 'weight')
//         streaksPanel(state, today)       Streaks card (current and best per habit)
//         weightSpark(state, today)        tiny sparkline for the Weight row on the root ('' when no data)
//   actions used: hvEditWeigh data-id (historyActions.js), closeHistWin (app.js)

import { weekDates, habitGrid, weightTrend, GOAL_WEIGHT } from '../logic/weekView.js';
import { allStreaks } from '../logic/streaks.js';
import { goalProjection } from '../logic/progress.js';
import { weightHistory, liveEntries } from '../logic/entries.js';
import { addDays } from '../logic/dates.js';
import { esc } from './format.js';
import { pageHead, ICON } from './historyWindows.js';

const DAYS = 28;
const MAX_WEIGHTS = 14;
const LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const CHECK = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

export const shortDate = (d) => new Date(`${d}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const fmt1 = (n) => (Math.round(n * 10) / 10).toFixed(1).replace(/\.0$/, '');

/** Gap text against the goal: "2.4 lb above your 170 lb goal" / "at your 170 lb goal". */
export function gapText(latest) {
  const gap = latest - GOAL_WEIGHT;
  if (Math.abs(gap) < 0.05) return `At your ${GOAL_WEIGHT} lb goal`;
  return `${fmt1(Math.abs(gap))} lb ${gap > 0 ? 'above' : 'below'} your ${GOAL_WEIGHT} lb goal`;
}

export function weekPanel(state, today) {
  const dates = weekDates(today);
  const habits = state.habits ?? [];
  const grid = habitGrid(state.entries, habits, dates, today);
  const head = `<div class="hv-wkrow hv-wkhead" aria-hidden="true"><span></span>${dates.map((d, i) => `<span class="hv-wkh${d === today ? ' now' : ''}">${LETTERS[i]}</span>`).join('')}</div>`;
  const cell = (h, c, i) => {
    const state2 = c.done ? 'done' : c.future ? 'future' : 'open';
    const word = c.done ? 'done' : c.future ? 'upcoming' : 'not done';
    return `<span class="hv-cell ${state2}${c.date === today ? ' is-today' : ''}" role="img" aria-label="${esc(h.name)}, ${DAY_NAMES[i]} ${esc(shortDate(c.date))}: ${word}">${c.done ? CHECK : ''}</span>`;
  };
  const rows = grid.map((r) => `<div class="hv-wkrow"><span class="hv-wkname" title="${esc(r.habit.name)}">${esc(r.habit.name)}</span>${r.cells.map((c, i) => cell(r.habit, c, i)).join('')}</div>`).join('');
  const done = grid.reduce((a, r) => a + r.doneCount, 0);
  const pill = grid.length ? `<span class="hv-count" aria-label="${done} check-ins this week">${done} done</span>` : '';
  return `<section class="hv-card hv-week" aria-label="This week">
    <h3 class="hv-sec">This week${pill}</h3>
    ${grid.length ? head + rows : '<p class="hv-empty"><b>No habits yet</b>Add one on the Today tab and its week shows up here.</p>'}
  </section>`;
}

/** Live weigh-in entry for a date (the one weightHistory shows), or null when it only lives in retained stats. */
const weighEntry = (entries, date) => liveEntries(entries).filter((e) => e.type === 'weigh_in' && e.date === date)
  .sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null;

/** 28 days back plus, when on track, a few days ahead for the projection. */
function geometry(pts, today, proj) {
  const start = addDays(today, -(DAYS - 1));
  const idx = (date) => Math.round((Date.parse(date) - Date.parse(start)) / 86400000);
  const last = pts[pts.length - 1];
  let ahead = 0;
  let projEnd = null;
  if (proj.status === 'ontrack' && proj.perWeek < 0) {
    ahead = Math.min(21, Math.max(7, proj.days));
    const perDay = proj.perWeek / 7;
    let endI = DAYS - 1 + ahead;
    let v = last.weight_lb + perDay * (endI - idx(last.date));
    if (v < GOAL_WEIGHT) { endI = idx(last.date) + (GOAL_WEIGHT - last.weight_lb) / perDay; v = GOAL_WEIGHT; }
    projEnd = { i: endI, v };
  }
  const total = DAYS - 1 + ahead;
  const vals = [GOAL_WEIGHT, ...pts.map((p) => p.weight_lb), ...(projEnd ? [projEnd.v] : [])];
  const min = Math.floor(Math.min(...vals) - 1);
  const max = Math.ceil(Math.max(...vals) + 1);
  const W = 320; const H = 168; const L = 34; const R = 10; const T = 14; const B = 26;
  const x = (i) => +(L + (i / total) * (W - L - R)).toFixed(1);
  const y = (v) => +(T + ((max - v) / (max - min)) * (H - T - B)).toFixed(1);
  return { start, idx, total, ahead, projEnd, min, max, W, H, L, R, T, B, x, y, last };
}

export function weightChart(state, today) {
  const hist = weightHistory(state.entries, state.stats);
  const pts = weightTrend(hist, today, DAYS);
  if (!pts.length) return '<p class="hv-empty"><b>No weigh-ins in the last 4 weeks</b>Log one from the Today tab to start the chart.</p>';
  const proj = goalProjection(hist, today);
  const g = geometry(pts, today, proj);
  const mid = Math.round((g.min + g.max) / 2);
  const grid = [g.max, mid, g.min].map((v) => `<line class="hv-grid" x1="${g.L}" x2="${g.W - g.R}" y1="${g.y(v)}" y2="${g.y(v)}"/><text class="hv-axis" x="${g.L - 6}" y="${g.y(v) + 4}" text-anchor="end">${v}</text>`).join('');
  const goalY = g.y(GOAL_WEIGHT);
  const dots = pts.map((p) => ({ cx: g.x(g.idx(p.date)), cy: g.y(p.weight_lb), ...p }));
  const line = dots.map((d) => `${d.cx},${d.cy}`).join(' ');
  const end = dots[dots.length - 1];
  const todayX = g.x(DAYS - 1);
  const projLine = g.projEnd ? `<polyline class="hv-proj-halo" points="${end.cx},${end.cy} ${g.x(g.projEnd.i)},${g.y(g.projEnd.v)}"/><polyline class="hv-proj" points="${end.cx},${end.cy} ${g.x(g.projEnd.i)},${g.y(g.projEnd.v)}"/>` : '';
  const xl = [`<text class="hv-axis" x="${g.L}" y="${g.H - 6}">${esc(shortDate(g.start))}</text>`,
    `<text class="hv-axis" x="${todayX}" y="${g.H - 6}" text-anchor="${g.ahead ? 'middle' : 'end'}">Today</text>`,
    g.ahead ? `<text class="hv-axis" x="${g.W - g.R}" y="${g.H - 6}" text-anchor="end">${esc(shortDate(addDays(today, g.ahead)))}</text>` : ''].join('');
  const label = `Weight, last 4 weeks: ${pts.length} weigh-in${pts.length === 1 ? '' : 's'} from ${pts[0].weight_lb} to ${end.weight_lb} lb. Goal ${GOAL_WEIGHT} lb.`;
  return `<svg class="hv-chart" viewBox="0 0 ${g.W} ${g.H}" role="img" aria-label="${esc(label)}">
    ${grid}
    ${g.ahead ? `<line class="hv-today" x1="${todayX}" x2="${todayX}" y1="${g.T}" y2="${g.H - g.B}"/>` : ''}
    <line class="hv-goal" x1="${g.L}" x2="${g.W - g.R}" y1="${goalY}" y2="${goalY}"/>
    <text class="hv-axis hv-goal-t" x="${g.projEnd ? g.L + 4 : g.W - g.R}" y="${goalY - 6}" text-anchor="${g.projEnd ? 'start' : 'end'}">${GOAL_WEIGHT} lb goal</text>
    ${projLine}
    <polyline class="hv-line" points="${line}"/>
    ${dots.map((d) => `<circle class="hv-dot" cx="${d.cx}" cy="${d.cy}" r="3.5"><title>${esc(shortDate(d.date))}: ${esc(d.weight_lb)} lb</title></circle>`).join('')}
    <circle class="hv-end" cx="${end.cx}" cy="${end.cy}" r="6"/>
    ${xl}
  </svg>`;
}

/** One sentence about reaching the goal ("At this pace you reach 170 lb around Jan 12."). */
export function projectionText(p) {
  if (p.status === 'none') return 'No weigh-ins in the last 4 weeks.';
  if (p.status === 'reached') return `Goal reached at ${esc(p.latest)} lb.`;
  if (p.status === 'few') return 'Weigh in a few more times over a week or more to see a projection.';
  if (p.status === 'wrong') return `Trend is ${p.perWeek > 0 ? 'up' : 'flat'} (${p.perWeek > 0 ? '+' : ''}${esc(p.perWeek)} lb a week), so there is no date for ${GOAL_WEIGHT} lb yet.`;
  const d = new Date(`${p.etaDate}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `At this pace (${esc(Math.abs(p.perWeek))} lb a week down) you reach ${GOAL_WEIGHT} lb around <b>${esc(d)}</b>.`;
}

export function weightSpark(state, today) {
  const pts = weightTrend(weightHistory(state.entries, state.stats), today, DAYS);
  if (pts.length < 2) return '';
  const vals = pts.map((p) => p.weight_lb);
  const min = Math.min(...vals); const max = Math.max(...vals);
  const start = Date.parse(addDays(today, -(DAYS - 1)));
  const xy = pts.map((p) => `${(2 + ((Date.parse(p.date) - start) / 86400000 / (DAYS - 1)) * 60).toFixed(1)},${(max === min ? 14 : 3 + ((max - p.weight_lb) / (max - min)) * 22).toFixed(1)}`);
  return `<svg class="hv-spark" width="64" height="28" viewBox="0 0 64 28" aria-hidden="true"><polyline points="${xy.join(' ')}"/><circle cx="${xy[xy.length - 1].split(',')[0]}" cy="${xy[xy.length - 1].split(',')[1]}" r="2.5"/></svg>`;
}

export function weightPage(state, today) {
  const hist = weightHistory(state.entries, state.stats);
  const head = pageHead('Weight');
  const latest = hist[0];
  const hero = latest
    ? `<section class="hv-hero" aria-label="Latest weigh-in"><span class="hv-kicker">Latest weigh-in, ${esc(shortDate(latest.date))}</span>
        <p class="hv-big">${esc(latest.weight_lb)}<small> lb</small></p><p class="hv-herosub">${esc(gapText(latest.weight_lb))}</p></section>`
    : `<section class="hv-hero" aria-label="Weight"><span class="hv-kicker">Goal ${GOAL_WEIGHT} lb</span><p class="hv-herosub">No weigh-ins yet. Log one from the Today tab.</p></section>`;
  const proj = goalProjection(hist, today);
  const recent = hist.slice(0, MAX_WEIGHTS);
  const rows = recent.map((w, i) => {
    const prev = recent[i + 1];
    const diff = prev ? w.weight_lb - prev.weight_lb : null;
    const dTxt = diff == null ? '' : `${diff > 0 ? '+' : diff < 0 ? '−' : '±'}${fmt1(Math.abs(diff))}`;
    const inner = `<span class="hv-rmain"><b>${esc(w.weight_lb)} lb</b><small>${esc(shortDate(w.date))}</small></span>
      ${dTxt ? `<span class="hv-delta${diff < 0 ? ' down' : ''}" aria-label="${diff > 0 ? 'up' : diff < 0 ? 'down' : 'no change'} ${esc(fmt1(Math.abs(diff)))} lb">${esc(dTxt)}</span>` : ''}`;
    const e = weighEntry(state.entries, w.date);
    return e
      ? `<button class="hv-row" data-action="hvEditWeigh" data-id="${esc(e.id)}" aria-label="Edit weigh-in ${esc(w.weight_lb)} lb on ${esc(shortDate(w.date))}">${inner}${ICON.chev}</button>`
      : `<div class="hv-row static">${inner}</div>`;
  }).join('');
  return `<div class="hv-page">${head}${hero}
    <section class="hv-card"><h3 class="hv-sec">Last 4 weeks</h3>${weightChart(state, today)}
      <p class="hv-proj-note">${projectionText(proj)}</p></section>
    <h3 class="hv-sec hv-out">Recent weigh-ins${recent.length ? `<span class="hv-count">${recent.length}</span>` : ''}</h3>
    ${rows ? `<div class="hv-list">${rows}</div>` : '<p class="hv-empty"><b>No weigh-ins yet</b>Your weigh-ins appear here with the change from the one before.</p>'}
  </div>`;
}

export function streaksPanel(state, today) {
  const list = allStreaks(state.entries, state.habits ?? [], today);
  const rows = list.map((s) => `<div class="hv-row static"><span class="hv-ticon${s.current ? ' hot' : ''}" aria-hidden="true">${ICON.flame}</span>
    <span class="hv-rmain"><b>${esc(s.name)}</b><small>Best ${s.best} day${s.best === 1 ? '' : 's'}</small></span>
    <span class="hv-streak">${s.current}<small> day${s.current === 1 ? '' : 's'}</small></span></div>`).join('');
  return `<h3 class="hv-sec hv-out">Streaks<span class="hv-count">${list.length}</span></h3><div class="hv-list">${rows}</div>`;
}
