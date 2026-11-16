// Sync tab extras: backup nudge meter (F47), weekly review panel (F37) and own-window dialogs (F43).
//   html: nudgePanel(state), reviewPanel(state), modal(title, body)
import { nudgeMeters, nudgeDue, loadLastBackup } from '../logic/backupNudge.js';
import { buildReview, reviewMarkdown, isReviewDay } from '../logic/weeklyReview.js';
import { logicalDate } from '../logic/dates.js';
import { esc } from './format.js';

const lastBackup = () => { try { return loadLastBackup(localStorage); } catch { return null; } };
const meters = (state) => nudgeMeters({ lastExportAt: state.lastExportAt, lastBackupAt: lastBackup() }, Date.now());
export const backupDue = (state) => nudgeDue(meters(state));

export function nudgePanel(state) {
  const rows = meters(state);
  return `<div class="panel"><h2>BACKUP METER</h2>${rows.map((m) =>
    `<p>${esc(m.text)}</p><div class="meter" role="img" aria-label="${esc(m.text)}"><i class="${m.level}" style="width:${m.pct}%"></i></div>`).join('')}
    ${backupDue(state) ? '<p>A copy is overdue. Export to Dropbox and take a JSON backup.</p>' : ''}</div>`;
}

export const currentReview = (state) => buildReview(state.entries, state.habits, logicalDate(Date.now(), state.dayStartHour));

export function reviewPanel(state) {
  const r = currentReview(state);
  const sunday = isReviewDay(logicalDate(Date.now(), state.dayStartHour));
  return `<div class="panel"><h2>WEEKLY REVIEW</h2>
    <p>${sunday ? 'It is Sunday. ' : ''}Week ${esc(r.start)} to ${esc(r.end)}.</p>
    <pre>${esc(reviewMarkdown(r))}</pre>
    <button class="btn ${sunday ? '' : 'secondary'}" data-action="sendReview">SEND TO VAULT</button></div>`;
}

/** An overlay in its own window. CLOSE runs closeModal. */
export const modal = (title, body) => `<div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}">
  <div class="modal-card"><h2>${esc(title)}</h2>${body}<button class="btn secondary" data-action="closeModal">CLOSE</button></div></div>`;
