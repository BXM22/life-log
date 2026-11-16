// F47 Backup nudge meter. Pure helpers: how stale the last export and the last JSON backup are.
// The JSON backup time has its own localStorage key so the settings record keeps its shape.

export const BACKUP_KEY = 'lifelog.lastBackupAt';
const DAY_MS = 86400000;
export const METER_DAYS = 14; // a full bar
export const WARN_DAYS = 4;
export const DUE_DAYS = 7;

export function loadLastBackup(storage) {
  try { const n = Number(storage.getItem(BACKUP_KEY)); return Number.isFinite(n) && n > 0 ? n : null; } catch { return null; }
}
export function saveLastBackup(storage, at) {
  try { storage.setItem(BACKUP_KEY, String(at)); return true; } catch { return false; }
}

/** { days, pct, level, text } for one kind of copy. level: ok | warn | due | never. */
export function meter(label, lastAt, now) {
  if (!Number.isFinite(lastAt)) return { days: null, pct: 100, level: 'never', text: `${label}: never` };
  const days = Math.max(0, Math.floor((now - lastAt) / DAY_MS));
  const level = days >= DUE_DAYS ? 'due' : days >= WARN_DAYS ? 'warn' : 'ok';
  return { days, pct: Math.min(100, Math.round((days / METER_DAYS) * 100)), level, text: `${label}: ${days === 0 ? 'today' : `${days} day${days === 1 ? '' : 's'} ago`}` };
}

/** Meters for the export and the JSON backup. */
export const nudgeMeters = ({ lastExportAt, lastBackupAt }, now) => [meter('Last export', lastExportAt, now), meter('Last backup', lastBackupAt, now)];

/** True when either copy is due or missing. */
export const nudgeDue = (meters) => meters.some((m) => m.level === 'due' || m.level === 'never');
