// Today sync chip (header). Html only; CSS lives in the Today styles.
import { esc } from './format.js';
import { syncChip } from '../logic/syncStatus.js';

export function syncChipHtml(state, now = Date.now()) {
  const { text, due } = syncChip(state, now);
  return `<button class="syncchip" data-action="tab" data-tab="export"><span class="dot${due ? ' due' : ''}"></span>${esc(text)}</button>`;
}
