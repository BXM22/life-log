// Pure sync status text for the Today chip and Sync row. No UI imports.
import { isDirty } from './exportBuilder.js';
import { reminderDue } from './exportReminder.js';

/** Dirty, live, non-note entries (notes are sent from TODAY). Mirrors waiting() in exportWipeView. */
export const waitingCount = (state) => (state.entries || []).filter((e) => e.type !== 'note' && isDirty(e)).length;

const DAY_MS = 86400000;
const plural = (n) => (n === 1 ? 'entry' : 'entries');

/** Chip copy from plain values, the single source of truth: 'Export due', '2 to export' or 'Synced'. */
export function chipText({ pending, lastExportAt, reminderOn = true, now = Date.now() }) {
  if (reminderOn !== false && reminderDue(lastExportAt, now)) return { text: 'Export due', due: true };
  return { text: pending ? `${pending} to export` : 'Synced', due: false };
}

/** { text, due } for the Today chip. */
export function syncChip(state, now = Date.now()) {
  return chipText({ pending: waitingCount(state), lastExportAt: state.lastExportAt, reminderOn: state.exportReminder, now });
}

/** Last export wording: 'Last export 8 days ago', 'Last export today', or 'No export yet'. */
export function lastExportHint(lastExportAt, now = Date.now()) {
  if (!Number.isFinite(lastExportAt)) return 'No export yet';
  const d = Math.max(0, Math.floor((now - lastExportAt) / DAY_MS));
  return d === 0 ? 'Last export today' : `Last export ${d} ${d === 1 ? 'day' : 'days'} ago`;
}

/** { show, title, hint }: shown only when entries wait or storage is unprotected. */
export function syncNotice({ pending = 0, lastExportAt = null, storageProtected = true, now = Date.now() } = {}) {
  const unprotected = storageProtected === false;
  if (!(pending > 0) && !unprotected) return { show: false, title: '', hint: '' };
  const hint = "Storage isn't protected. Add the app to your Home Screen.";
  // Nothing waiting: lead with the storage warning (the chip already says Export due or Synced).
  if (!(pending > 0)) return { show: true, title: "Storage isn't protected", hint: 'Add the app to your Home Screen.' };
  return {
    show: true,
    title: `${pending} ${plural(pending)} waiting to export`,
    hint: unprotected ? hint : lastExportHint(lastExportAt, now),
  };
}

export const syncNoticeForState = (state, { storageProtected = true, now = Date.now() } = {}) =>
  syncNotice({ pending: waitingCount(state), lastExportAt: state.lastExportAt, storageProtected, now });

export function syncRowText(state) {
  const n = waitingCount(state);
  return n ? `${n} ${n === 1 ? 'entry' : 'entries'} waiting to export` : 'Everything exported';
}
