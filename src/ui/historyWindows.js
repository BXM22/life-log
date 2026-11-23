// HISTORY v2 pages (F49 windows). Views over state.histWin, opened from the Look closer rows on the History root.
//   pageHead(title, count?)    back button (closeHistWin) + page title, shared by every History page
//   windowBack(title, sub)     older name kept for callers: same head with a small overline
//   ICON                       inline SVG icons for the History pages (24px viewBox, stroke 1.8)
//   liftWindow(state, today)   Lift progress: hero (best est. 1RM), lift chips, 8-week chart, Personal records
//   actions: data-action="openHistWin|hvOpen" data-win="lifts|entries|weight|habits" | "closeHistWin" | "pickLift" data-lift
// Styles: src/styles/w3-history.css (.hv-*).

import { recentLifts, oneRmSeries, liftSummary, pickLift } from '../logic/progress.js';
import { esc } from './format.js';
import { recordsPanel } from './recordsView.js';
import { backButton } from './templateTagsView.js';

const svg = (d, size = 24) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
export const ICON = {
  chev: `<span class="hv-chev">${svg('<path d="M9 5l7 7-7 7"/>', 20)}</span>`,
  scale: svg('<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M8.5 9a5 5 0 0 1 7 0M12 9l1.2-2"/>'),
  flame: svg('<path d="M12 21c3.9 0 6.5-2.6 6.5-6.2 0-3.3-2.3-5.6-4-7.8-.4 2-1.5 3.2-2.7 3.7.3-2.6-.6-5.3-2.8-7.2-.2 3.4-4.5 6.2-4.5 11.3C4.5 18.4 8.1 21 12 21z"/>'),
  bell: svg('<path d="M3 9v6M6.5 6.5v11M17.5 6.5v11M21 9v6M6.5 12h11"/>'),
  list: svg('<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>'),
  search: svg('<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>', 22),
  trash: svg('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>', 22),
  note: svg('<path d="M6 3.5h9l3.5 3.5v13.5H6z"/><path d="M9 11h6M9 15h6"/>'),
  meal: svg('<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M16 21V3c-2 1.5-3 4-3 7v3h3"/>'),
  music: svg('<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>'),
  check: svg('<circle cx="12" cy="12" r="8.5"/><path d="M8.5 12.5l2.4 2.4 4.6-5"/>'),
  book: svg('<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/>'),
  trophy: svg('<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4.5a3 3 0 0 0 3.5 4M16 6h3.5a3 3 0 0 1-3.5 4M12 13v4M8.5 20h7M9.5 17h5"/>', 22),
};

export function pageHead(title, count = null) {
  return `<div class="backrow">${backButton('closeHistWin', 'Back to History')}</div>
    <div class="hv-phead"><h2 class="subtitle">${esc(title)}</h2>${count == null ? '' : `<span class="hv-pcount" aria-label="${esc(count)} total">${esc(count)}</span>`}</div>`;
}

export function windowBack(title, sub) {
  return `${pageHead(title)}${sub ? `<span class="hv-kicker">${esc(sub)}</span>` : ''}`;
}

const shortDate = (d) => new Date(`${d}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

function chart(entries, name, today) {
  const s = oneRmSeries(entries, name, today);
  const vals = s.map((w) => w.best).filter((v) => v != null);
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const pad = Math.max(5, Math.round((hi - lo) * 0.15));
  const min = Math.floor((lo - pad) / 5) * 5;
  const max = Math.ceil((hi + pad) / 5) * 5;
  const W = 320; const H = 160; const L = 36; const R = 12; const T = 12; const B = 26;
  const x = (i) => +(L + (i / (s.length - 1)) * (W - L - R)).toFixed(1);
  const y = (v) => +(T + ((max - v) / (max - min)) * (H - T - B)).toFixed(1);
  const dots = s.map((w, i) => (w.best == null ? null : { x: x(i), y: y(w.best), ...w })).filter(Boolean);
  const end = dots[dots.length - 1];
  const mid = Math.round((min + max) / 2);
  const grid = [max, mid, min].map((v) => `<line class="hv-grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="hv-axis" x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join('');
  const midI = Math.floor(s.length / 2);
  const xl = `<text class="hv-axis" x="${L}" y="${H - 6}">${esc(shortDate(s[0].weekStart))}</text>
    <text class="hv-axis" x="${x(midI)}" y="${H - 6}" text-anchor="middle">${esc(shortDate(s[midI].weekStart))}</text>
    <text class="hv-axis" x="${W - R}" y="${H - 6}" text-anchor="end">${esc(shortDate(s[s.length - 1].weekStart))}</text>`;
  return `<svg class="hv-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(name)} estimated 1RM per week, last 8 weeks, from ${lo} to ${hi} pounds; latest ${end.best}">
    ${grid}
    <polyline class="hv-line" points="${dots.map((d) => `${d.x},${d.y}`).join(' ')}"/>
    ${dots.map((d) => `<circle class="hv-dot" cx="${d.x}" cy="${d.y}" r="3.5"><title>Week of ${esc(shortDate(d.weekStart))}: ${esc(d.best)} lb</title></circle>`).join('')}
    <circle class="hv-end" cx="${end.x}" cy="${end.y}" r="6"><title>Week of ${esc(shortDate(end.weekStart))}: ${esc(end.best)} lb</title></circle>
    ${xl}
  </svg>`;
}

export function liftWindow(state, today) {
  const head = pageHead('Lift progress');
  const names = recentLifts(state.entries, today);
  const name = pickLift(names, state.histLift);
  if (!name) {
    return `<div class="hv-page">${head}
      <section class="hv-hero"><span class="hv-kicker">Best estimated 1RM</span><p class="hv-herosub">No weighted working sets in the last 8 weeks. Log one on the Workout tab and the chart starts here.</p></section>
      ${recordsPanel(state)}</div>`;
  }
  const sum = liftSummary(state.entries, name, today);
  const delta = sum.delta == null ? '' : `${sum.delta > 0 ? '+' : sum.delta < 0 ? '−' : '±'}${Math.abs(sum.delta)} lb`;
  const chips = names.map((n) => `<button class="btn hv-chip" data-action="pickLift" data-lift="${esc(n)}" aria-pressed="${n === name}">${esc(n)}</button>`).join('');
  const sub = sum.delta == null ? 'One week logged so far.' : `${sum.delta >= 0 ? 'Up' : 'Down'} ${esc(Math.abs(sum.delta))} lb over 8 weeks.`;
  return `<div class="hv-page">${head}
    <section class="hv-hero" aria-label="Best estimated 1RM"><span class="hv-kicker">Best estimated 1RM, ${esc(name)}</span>
      <p class="hv-big">${esc(sum.latest)}<small> lb</small></p><p class="hv-herosub">${sub}</p></section>
    <div class="hv-chips" role="group" aria-label="Pick a lift">${chips}</div>
    <section class="hv-card"><h3 class="hv-sec">Estimated 1RM, 8 weeks${delta ? `<span class="hv-count${sum.delta > 0 ? ' up' : ''}">${esc(delta)}</span>` : ''}</h3>
      ${chart(state.entries, name, today)}</section>
    ${recordsPanel(state)}</div>`;
}
