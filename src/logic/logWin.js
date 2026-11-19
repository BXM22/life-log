// Pure helpers for the Log window (Today v2).
import { liveEntries, dayProtein, PROTEIN_TARGET } from './entries.js';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Latest live weigh-in as { weight, date, weekday } or null. Ties on date go to the newest update. */
export function lastWeighIn(entries) {
  const w = liveEntries(entries || []).filter((e) => e.type === 'weigh_in' && e.data && e.data.weight_lb != null)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.updatedAt - a.updatedAt))[0];
  if (!w) return null;
  const [y, m, d] = w.date.split('-').map(Number);
  return { weight: w.data.weight_lb, date: w.date, weekday: DAYS[new Date(y, m - 1, d).getDay()] };
}

/** Grams of protein left to reach the daily target on a date (never below 0). */
export const proteinToGo = (entries, date) => Math.max(0, PROTEIN_TARGET - dayProtein(entries, date));
