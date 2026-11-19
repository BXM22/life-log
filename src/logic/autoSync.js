// Auto sync: when a day has ended, upload its unexported entries to Dropbox without a tap.
// Pure helpers plus a settings flag; nothing here touches the network or throws.
import { isDirty } from './exportBuilder.js';

export const AUTO_SYNC_KEY = 'lifelog.autoSync';
export const RETRY_MS = 30 * 60 * 1000; // after a failed or unverified try, wait this long before the next one

export function loadAutoSync(storage) {
  try { return storage.getItem(AUTO_SYNC_KEY) !== '0'; } catch { return true; }
}
export function saveAutoSync(storage, on) {
  try { storage.setItem(AUTO_SYNC_KEY, on ? '1' : '0'); return true; } catch { return false; }
}

/** Entries from days that have ended. Today (by the day-start hour) is never auto-synced; it is still being logged. */
export const finishedDayEntries = (entries, today) => entries.filter((e) => e.date < today);

/** True when an auto sync should run now. */
export function autoSyncDue({ enabled, connected, busy, entries, today, lastTryAt = 0, now }) {
  if (!enabled || !connected || busy) return false;
  if (now - lastTryAt < RETRY_MS) return false;
  return finishedDayEntries(entries, today).some((e) => e.type !== 'note' && isDirty(e));
}
