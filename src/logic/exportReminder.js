// F33 weekly export reminder. Pure helpers plus a feature-detected notification; nothing here throws.
// The on/off choice has its own storage key so the main settings record keeps its shape.

export const REMINDER_KEY = 'lifelog.exportReminder';
export const REMIND_AFTER_DAYS = 7;
const DAY_MS = 86400000;
const NOTIFIED_KEY = 'lifelog.exportReminder.notified';

/** Latest confirmedAt across export records, or null when there are none. */
export function lastExportAt(exportRecords) {
  let best = null;
  for (const r of Array.isArray(exportRecords) ? exportRecords : []) {
    const t = r && Number(r.confirmedAt);
    if (Number.isFinite(t) && (best === null || t > best)) best = t;
  }
  return best;
}

/** Whole days since the last export, or null if never. */
export function daysSinceExport(lastAt, now) {
  if (!Number.isFinite(lastAt)) return null;
  return Math.max(0, Math.floor((now - lastAt) / DAY_MS));
}

/** True when the last export is 7+ days old or there never was one. */
export function reminderDue(lastAt, now) {
  const d = daysSinceExport(lastAt, now);
  return d === null || d >= REMIND_AFTER_DAYS;
}

export function reminderText(lastAt, now) {
  const d = daysSinceExport(lastAt, now);
  return d === null ? 'You have never exported. Back up your log.' : `Last export was ${d} days ago. Time to export.`;
}

export function loadReminderEnabled(storage) {
  try { return storage.getItem(REMINDER_KEY) !== '0'; } catch { return true; }
}
export function saveReminderEnabled(storage, on) {
  try { storage.setItem(REMINDER_KEY, on ? '1' : '0'); return true; } catch { return false; }
}

export const reminderNotifySupported = (env = globalThis) => Boolean(env.Notification);

/** Banner html for the top of Today; empty when off or not due. Text contains no user data. */
export function reminderBanner(state, now = Date.now()) {
  if (state.exportReminder === false || !reminderDue(state.lastExportAt, now)) return '';
  return `<button class="reminder" data-action="tab" data-tab="export" role="status">${reminderText(state.lastExportAt, now)} <b>EXPORT</b></button>`;
}

/** Show a notification at most once a day, only where the browser supports it and already allows it. Never throws. */
export function maybeNotify({ enabled, lastAt, now = Date.now(), storage, env = globalThis }) {
  try {
    if (!enabled || !reminderDue(lastAt, now)) return false;
    const N = env.Notification;
    if (!N || N.permission !== 'granted') return false;
    const day = new Date(now).toISOString().slice(0, 10);
    if (storage.getItem(NOTIFIED_KEY) === day) return false;
    storage.setItem(NOTIFIED_KEY, day);
    new N('Life Log', { body: reminderText(lastAt, now), tag: 'export-reminder' });
    return true;
  } catch { return false; }
}

/** Ask for notification permission (call from a tap). Resolves to the permission string, or 'unsupported'. */
export async function requestNotifyPermission(env = globalThis) {
  try {
    const N = env.Notification;
    if (!N) return 'unsupported';
    if (N.permission !== 'default') return N.permission;
    return await N.requestPermission();
  } catch { return 'unsupported'; }
}
