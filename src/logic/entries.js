// Entry validation, edit, delete and weight history. Pure: no storage, no clock.
//
// Entry shape: { id, type, date, data, updatedAt, exportedAt, exportId, deletedAt }
//   weigh_in { weight_lb } | guitar { minutes, focus, best_bpm } | habit_check { habit, done }
//
// Export safety: editing bumps updatedAt past exportedAt, so the entry is dirty again, exports
// again and is never wiped until re-exported. Deleting sets deletedAt (a tombstone) so a restore
// of an older backup cannot bring the entry back; the Dropbox copy of an exported entry stays.

export const MAX_FOCUS = 40;
export const DEFAULT_FOCUS = 'practice';

/** Weight in lb. Returns { value } or { error }. */
export function parseWeight(raw) {
  const w = Number(raw);
  if (String(raw ?? '').trim() === '' || !(w >= 50 && w <= 600)) return { error: 'Enter a weight between 50 and 600.' };
  return { value: Math.round(w * 10) / 10 };
}

/** Guitar fields from the form. Returns { data } or { error }. Focus defaults, BPM is optional. */
export function parseGuitar({ minutes, focus, bpm }) {
  const m = Number(minutes);
  if (String(minutes ?? '').trim() === '' || !(Number.isInteger(m) && m >= 1 && m <= 600)) {
    return { error: 'Enter whole minutes, 1 to 600.' };
  }
  const f = String(focus ?? '').replace(/\s+/g, ' ').trim() || DEFAULT_FOCUS;
  if (f.length > MAX_FOCUS) return { error: `Focus must be ${MAX_FOCUS} characters or fewer.` };
  let best = null;
  if (String(bpm ?? '').trim() !== '') {
    best = Number(bpm);
    if (!(Number.isInteger(best) && best >= 20 && best <= 400)) return { error: 'Best BPM must be a whole number, 20 to 400.' };
  }
  return { data: { minutes: m, focus: f, best_bpm: best } };
}

/** Validate edited fields for any entry type. Returns { data } (fields to merge) or { error }. */
export function parseEdit(entry, fields) {
  if (entry.type === 'weigh_in') {
    const r = parseWeight(fields.weight);
    return r.error ? r : { data: { weight_lb: r.value } };
  }
  if (entry.type === 'guitar') return parseGuitar(fields);
  if (entry.type === 'habit_check') return { data: { done: Boolean(fields.done) } };
  return { error: 'This entry cannot be edited.' };
}

/** A new timestamp that is always later than the entry's last change and its export. */
const nextStamp = (entry, now) => Math.max(now, entry.updatedAt + 1, (entry.exportedAt ?? 0) + 1);

/** The edited entry (a new object). It is dirty again, so it exports again. */
export function editEntry(entry, data, now) {
  return { ...entry, data: { ...entry.data, ...data }, deletedAt: null, updatedAt: nextStamp(entry, now) };
}

/** The deleted entry (a new object): a tombstone that stays hidden and never exports. */
export function deleteEntry(entry, now) {
  const at = nextStamp(entry, now);
  return { ...entry, deletedAt: at, updatedAt: at };
}

export const liveEntries = (entries) => entries.filter((e) => !e.deletedAt);

/**
 * Weigh-ins newest first, one per day (the latest edit wins). Older days that were wiped come back
 * from the retained stats, so history survives a wipe. Returns [{ date, weight_lb }].
 */
export function weightHistory(entries, stats) {
  const perDay = new Map((stats?.weighIns || []).map((w) => [w.date, { weight_lb: w.weight_lb, at: -1 }]));
  for (const e of entries) {
    if (e.deletedAt || e.type !== 'weigh_in') continue;
    const cur = perDay.get(e.date);
    if (!cur || e.updatedAt >= cur.at) perDay.set(e.date, { weight_lb: e.data.weight_lb, at: e.updatedAt });
  }
  return [...perDay.entries()]
    .map(([date, v]) => ({ date, weight_lb: v.weight_lb }))
    .sort((a, b) => b.date.localeCompare(a.date));
}
