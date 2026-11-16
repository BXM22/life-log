// HISTORY own windows (F49). Views over state.histWin, opened from rows on the History tab.
//   liftWindow(state, today)   Lift progress: one lift at a time, 8-week est. 1RM chart; back control closes it
//   windowBack(title, sub)     back button + heading shared by the History windows
//   actions: data-action="openHistWin" data-win="lifts|entries" | "closeHistWin" | "pickLift" data-lift (handled in app.js)

import { recentLifts, oneRmSeries, liftSummary, pickLift } from '../logic/progress.js';
import { esc } from './format.js';
import { recordsPanel } from './recordsView.js';

export function windowBack(title, sub) {
  return `<div class="hwin-head"><button class="hwin-back" data-action="closeHistWin" aria-label="Back to History">&lt; History</button>
    <span class="kicker">${esc(sub)}</span><h2 class="hwin-title">${esc(title)}</h2></div>`;
}

function chart(entries, name, today) {
  const s = oneRmSeries(entries, name, today);
  const vals = s.map((w) => w.best).filter((v) => v != null);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const x = (i) => 8 + (i / (s.length - 1)) * 286;
  const y = (v) => (max === min ? 70 : 22 + ((max - v) / (max - min)) * 96);
  const dots = s.map((w, i) => (w.best == null ? null : { x: +x(i).toFixed(1), y: +y(w.best).toFixed(1), ...w })).filter(Boolean);
  const end = dots[dots.length - 1];
  const svg = `<svg class="lwchart" viewBox="0 0 302 140" role="img" aria-label="${esc(name)} estimated 1RM per week, last 8 weeks, from ${min} to ${max} pounds">
    <line class="lwbase" x1="0" y1="139" x2="302" y2="139"/><line class="lwmid" x1="0" y1="70" x2="302" y2="70"/>
    <polyline class="lwline" points="${dots.map((d) => `${d.x},${d.y}`).join(' ')}"/>
    <circle class="lwend" cx="${end.x}" cy="${end.y}" r="7"><title>week of ${esc(end.weekStart)}: ${esc(end.best)}</title></circle></svg>`;
  return { svg, from: s[0].weekStart, mid: s[Math.floor(s.length / 2)].weekStart, to: s[s.length - 1].weekStart };
}

const shortDate = (d) => new Date(`${d}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export function liftWindow(state, today) {
  const head = windowBack('Lift progress', 'Personal records');
  const names = recentLifts(state.entries, today);
  const name = pickLift(names, state.histLift);
  if (!name) return `${head}<div class="panel"><p class="note">No weighted working sets in the last 8 weeks.</p></div>${recordsPanel(state)}`;
  const sum = liftSummary(state.entries, name, today);
  const c = chart(state.entries, name, today);
  const delta = sum.delta == null ? '' : `${sum.delta >= 0 ? '+' : ''}${sum.delta} lb`;
  const chips = names.map((n) => `<button class="btn chip${n === name ? ' on' : ''}" data-action="pickLift" data-lift="${esc(n)}" aria-pressed="${n === name}">${esc(n)}</button>`).join('');
  const sub = sum.delta == null ? ', one week logged so far.' : `, ${sum.delta >= 0 ? 'up' : 'down'} ${esc(Math.abs(sum.delta))} lb over 8 weeks.`;
  return `${head}
    <div class="panel hero"><span class="kicker">BEST ESTIMATED 1RM</span><p class="big">${esc(sum.latest)} lb</p><p>${esc(name)}${sub}</p></div>
    <div class="lwchips">${chips}</div>
    <div class="panel"><div class="row lwtitle"><span class="note">ESTIMATED 1RM, 8 WEEKS</span><b>${esc(delta)}</b></div>${c.svg}
      <div class="row lwaxis"><span>${shortDate(c.from)}</span><span>${shortDate(c.mid)}</span><span>${shortDate(c.to)}</span></div></div>
    ${recordsPanel(state)}`;
}
