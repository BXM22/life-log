// Backup and restore logic. Pure: no storage, no clock.
//
// A backup is plain JSON: { schemaVersion, createdAt, entries, habits, exports }.
// Restore never deletes: it merges by id and the newer updatedAt wins, so restoring an old
// backup on top of newer data cannot lose anything, and restored entries keep exportedAt/exportId.

import { toDateString } from './dates.js';

export const SCHEMA_VERSION = 1;
const ENTRY_TYPES = new Set(['habit_check', 'weigh_in', 'guitar', 'lift_set', 'meal', 'note', 'study']);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Build the backup object from everything saved on the phone. */
export function buildBackup({ entries = [], habits = [], exports = [] }, now) {
  return { schemaVersion: SCHEMA_VERSION, createdAt: now, entries, habits, exports };
}

/** life-log-backup-YYYY-MM-DD.json */
export function backupFilename(now) {
  return `life-log-backup-${toDateString(now)}.json`;
}

function checkEntry(e, i) {
  const bad = (why) => { throw new Error(`Backup entry ${i + 1} is invalid: ${why}.`); };
  if (!e || typeof e !== 'object') bad('not an object');
  if (typeof e.id !== 'string' || !e.id) bad('missing id');
  if (!ENTRY_TYPES.has(e.type)) bad(`unknown type "${e.type}"`);
  if (typeof e.date !== 'string' || !DATE_RE.test(e.date)) bad('bad date');
  if (!e.data || typeof e.data !== 'object') bad('missing data');
  if (typeof e.updatedAt !== 'number' || !Number.isFinite(e.updatedAt)) bad('bad updatedAt');
}

/** Parse and validate backup text. Throws a plain-language Error if it cannot be used. */
export function parseBackup(text) {
  let b;
  try { b = JSON.parse(text); } catch { throw new Error('That file is not a Life Log backup (not valid JSON).'); }
  if (!b || typeof b !== 'object' || Array.isArray(b)) throw new Error('That file is not a Life Log backup.');
  if (b.schemaVersion !== SCHEMA_VERSION) {
    throw new Error(`Unsupported backup version ${b.schemaVersion}. This app reads version ${SCHEMA_VERSION}.`);
  }
  if (!Array.isArray(b.entries)) throw new Error('Backup is missing its entries list.');
  b.entries.forEach(checkEntry);
  const habits = Array.isArray(b.habits) ? b.habits : [];
  habits.forEach((h, i) => {
    if (!h || typeof h.id !== 'string' || typeof h.name !== 'string') throw new Error(`Backup habit ${i + 1} is invalid.`);
  });
  const exports = Array.isArray(b.exports) ? b.exports : [];
  exports.forEach((x, i) => {
    if (!x || typeof x.filename !== 'string') throw new Error(`Backup export record ${i + 1} is invalid.`);
  });
  return { schemaVersion: b.schemaVersion, createdAt: b.createdAt ?? null, entries: b.entries, habits, exports };
}

/**
 * Merge a parsed backup into the current data. Returns new { entries, habits, exports }.
 * - entries: by id; the newer updatedAt wins; a tie keeps the current copy
 * - habits: union by id; current copy wins
 * - exports: union by filename; current copy wins
 * Nothing that exists now is ever removed.
 */
export function mergeBackup(current, backup) {
  const entries = new Map((current.entries || []).map((e) => [e.id, e]));
  for (const e of backup.entries) {
    const have = entries.get(e.id);
    if (!have || e.updatedAt > have.updatedAt) entries.set(e.id, e);
  }
  const habits = new Map((current.habits || []).map((h) => [h.id, h]));
  for (const h of backup.habits || []) if (!habits.has(h.id)) habits.set(h.id, h);
  const exports = new Map((current.exports || []).map((x) => [x.filename, x]));
  for (const x of backup.exports || []) if (!exports.has(x.filename)) exports.set(x.filename, x);
  return { entries: [...entries.values()], habits: [...habits.values()], exports: [...exports.values()] };
}
