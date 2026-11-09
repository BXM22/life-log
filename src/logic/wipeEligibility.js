// Decides what Wipe may delete. Pure: no storage, no clock.
//
// Rule: an entry is wipeable only if it is in the confirmed export's manifest,
// has not changed since, and is older than the keep window.

import { addDays, logicalDate } from './dates.js';

/**
 * Call after the user confirms the file is in Dropbox. Returns a new entries array
 * where entries still matching the manifest version are stamped exported.
 * An entry edited between export build and confirm keeps its old state (dirty),
 * so it is exported again next time and never wiped.
 */
export function markExported(entries, manifest, confirmedAt) {
  const version = new Map(manifest.items.map((i) => [i.id, i.updatedAt]));
  return entries.map((e) => {
    if (version.get(e.id) !== e.updatedAt) return e;
    return { ...e, exportedAt: confirmedAt, exportId: manifest.exportId };
  });
}

/** True if the entry is outside the keep window. keepDays 0 means everything. */
function olderThanKeepWindow(entry, now, keepDays, dayStartHour) {
  if (keepDays === 0) return true;
  const today = logicalDate(now, dayStartHour);
  return entry.date <= addDays(today, -keepDays);
}

/**
 * Entries Wipe may delete for the given confirmed export.
 * Returns { ids, count, range } for the warning text. range is null when empty.
 */
export function planWipe(entries, manifest, { now, keepDays = 7, dayStartHour = 4 }) {
  const inManifest = new Set(manifest.items.map((i) => i.id));
  const eligible = entries.filter(
    (e) =>
      inManifest.has(e.id) &&
      e.exportId === manifest.exportId &&
      e.exportedAt != null &&
      e.updatedAt <= e.exportedAt &&
      olderThanKeepWindow(e, now, keepDays, dayStartHour),
  );
  const dates = eligible.map((e) => e.date).sort();
  return {
    ids: eligible.map((e) => e.id),
    count: eligible.length,
    range: dates.length ? { from: dates[0], to: dates[dates.length - 1] } : null,
  };
}
