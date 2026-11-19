// Pure sync status text for the Today chip and Sync row. No UI imports.
import { isDirty } from './exportBuilder.js';
import { reminderDue } from './exportReminder.js';

/** Dirty, live, non-note entries (notes are sent from TODAY). Mirrors waiting() in exportWipeView. */
export const waitingCount = (state) => (state.entries || []).filter((e) => e.type !== 'note' && isDirty(e)).length;

/** { text, due }: 'Export due' (peach dot) when the reminder is on and the last export is 7+ days old, else 'N waiting' or 'Synced'. */
export function syncChip(state, now = Date.now()) {
  if (state.exportReminder !== false && reminderDue(state.lastExportAt, now)) return { text: 'Export due', due: true };
  const n = waitingCount(state);
  return { text: n ? `${n} waiting` : 'Synced', due: false };
}

export function syncRowText(state) {
  const n = waitingCount(state);
  return n ? `${n} ${n === 1 ? 'entry' : 'entries'} waiting to export` : 'Everything exported';
}
