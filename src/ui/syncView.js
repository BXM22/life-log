// Sync tab building blocks (v2): Copies card (F47 meters), weekly review page (F37), page header, sheet and modal (F43).
//   html: copiesCard(state), reviewPage(state), pageHead(action, label, title), sheet(title, body, closeAction), modal(title, body)
//   Styles: src/styles/w3-sync.css (.sv-*). The modal keeps its old markup because Settings renders dropboxModal() with it.
import { nudgeMeters, nudgeDue, loadLastBackup } from '../logic/backupNudge.js';
import { buildReview, reviewMarkdown, isReviewDay } from '../logic/weeklyReview.js';
import { logicalDate } from '../logic/dates.js';
import { esc } from './format.js';

const svg = (d, size = 22) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
export const ICON = {
  back: svg('<path d="M15 5l-7 7 7 7"/>', 24),
  chev: svg('<path d="M9 5l7 7-7 7"/>', 20),
  check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 18),
  lock: svg('<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>', 18),
  file: svg('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>'),
  cloud: svg('<path d="M7 18a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 9.5a4.25 4.25 0 0 1-.5 8.5z"/><path d="M12 15v-4.5M9.75 12.5L12 10.25l2.25 2.25"/>'),
  share: svg('<path d="M12 3v12M8 7l4-4 4 4"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>'),
  calendar: svg('<rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M8 3v4M16 3v4M4 10h16"/>'),
  archive: svg('<rect x="3.5" y="4" width="17" height="5" rx="1.5"/><path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M10 13h4"/>'),
  alert: svg('<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17.5v.01"/>'),
  send: svg('<path d="M4 12l16-8-6 16-2.5-6.5z"/>'),
};

const lastBackup = () => { try { return loadLastBackup(localStorage); } catch { return null; } };
const meters = (state) => nudgeMeters({ lastExportAt: state.lastExportAt, lastBackupAt: lastBackup() }, Date.now());
export const backupDue = (state) => nudgeDue(meters(state));
const isLate = (m) => m.level === 'due' || m.level === 'never';
/** The "3 days ago" half of a meter's text. */
export const meterWhen = (m) => m.text.slice(m.text.indexOf(': ') + 2);
export const backupMeter = (state) => meters(state)[1];

/** Copies card: two meters, red with an Overdue tag when a copy is due or was never made. */
export function copiesCard(state) {
  const rows = meters(state);
  const names = ['Dropbox export', 'Backup file'];
  const late = rows.filter(isLate).length;
  return `<h3 class="sv-head">Copies${late ? `<span class="sv-pill late">${late} overdue</span>` : '<span class="sv-pill">Up to date</span>'}</h3>
    <section class="sv-card sv-copies">${rows.map((m, i) => `<div class="sv-meter">
      <div class="sv-meter-top"><b>${names[i]}</b><span>${esc(meterWhen(m))}</span>${isLate(m) ? '<em class="sv-tag">Overdue</em>' : ''}</div>
      <div class="sv-bar" role="img" aria-label="${esc(`${names[i]}: ${meterWhen(m)}${isLate(m) ? ', overdue' : ''}`)}"><i class="${m.level}" style="width:${Math.max(4, m.pct)}%"></i></div>
    </div>`).join('')}</section>`;
}

/** Sub-page header: 44px back button and a 22px title. */
export const pageHead = (action, label, title) => `<div class="backrow"><button class="back-link" data-action="${action}" aria-label="${esc(label)}">${ICON.back}</button></div>
  <h2 class="subtitle">${esc(title)}</h2>`;

/** Bottom sheet over a scrim. Tapping the scrim runs closeAction. */
export const sheet = (title, body, closeAction) => `<div class="sv-sheet" role="dialog" aria-modal="true" aria-labelledby="sv-sheet-title">
  <button class="sv-scrim" data-action="${closeAction}" aria-label="Close" tabindex="-1"></button>
  <div class="sv-sheet-card"><span class="sv-grab" aria-hidden="true"></span><h2 id="sv-sheet-title">${esc(title)}</h2>${body}</div></div>`;

export const currentReview = (state) => buildReview(state.entries, state.habits, logicalDate(Date.now(), state.dayStartHour));

/** Weekly review page: week range, the Markdown review and one Send to vault button. */
export function reviewPage(state) {
  const r = currentReview(state);
  const sunday = isReviewDay(logicalDate(Date.now(), state.dayStartHour));
  const busy = state.msg === 'Sending review to Dropbox...';
  return `${pageHead('svBack', 'Back to sync', 'Weekly review')}
    <section class="sv-card sv-accent sv-hero">
      <span class="sv-ico">${ICON.calendar}</span>
      <div class="sv-hero-txt"><b>Week ${esc(r.start)} to ${esc(r.end)}</b><span>${sunday ? 'It is Sunday, review day.' : 'Send it on Sunday, or any time.'}</span></div>
    </section>
    <h3 class="sv-head">Review</h3>
    <pre class="sv-pre">${esc(reviewMarkdown(r))}</pre>
    <button class="btn sv-iconbtn" data-action="sendReview" ${busy ? 'disabled aria-busy="true"' : ''}>${ICON.send}<span>${busy ? 'Sending…' : 'Send to vault'}</span></button>`;
}

/** An overlay in its own window. CLOSE runs closeModal. Markup unchanged: Settings uses it through dropboxModal(). */
export const modal = (title, body) => `<div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}">
  <div class="modal-card"><h2>${esc(title)}</h2>${body}<button class="btn secondary" data-action="closeModal">CLOSE</button></div></div>`;
