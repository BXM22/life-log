// Today sync chip (header) and Sync row (under the hero). Html only; CSS lives in the Today styles.
import { esc } from './format.js';
import { syncChip, syncRowText, waitingCount } from '../logic/syncStatus.js';

export function syncChipHtml(state, now = Date.now()) {
  const { text, due } = syncChip(state, now);
  return `<button class="syncchip" data-action="tab" data-tab="export"><span class="dot${due ? ' due' : ''}"></span>${esc(text)}</button>`;
}

export function syncRowHtml(state) {
  const n = waitingCount(state);
  return `<div class="syncrow"><span class="cap">SYNC</span><span class="txt">${esc(syncRowText(state))}</span>` +
    `<button class="btn${n ? '' : ' secondary'}" data-action="syncNow"${n ? '' : ' disabled'}>${n ? 'SYNC NOW' : 'SYNCED'}</button></div>`;
}
