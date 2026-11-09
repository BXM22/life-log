// Facts that cannot be rebuilt once old entries are wiped. Pure: no storage, no clock.
//
// Stats shape (one record in the retained_stats store, key 'stats'):
//   { key: 'stats', updatedAt,
//     best:    { [name]: longest streak in days ever seen },
//     anchors: { [name]: { date, streak } }   // streak ending on the latest done date
//     lastSets:{ [focus]: { date, minutes, best_bpm } },
//     weighIns:[ { date, weight_lb } ]        // last 7 days with a weigh-in )
// "name" is a habit name, or GUITAR for guitar practice days.

import { addDays } from './dates.js';
import { currentStreak } from './habits.js';

export const GUITAR = '__guitar__';
const MAX_WEIGH_INS = 7;

export const emptyStats = () => ({ key: 'stats', updatedAt: 0, best: {}, anchors: {}, lastSets: {}, weighIns: [] });

const alive = (e) => !e.deletedAt;

/** Done dates per streak name, as { name: Set(dates) }. Guitar days count as one name. */
function doneDates(entries) {
  const out = new Map();
  const add = (name, date) => { if (!out.has(name)) out.set(name, new Set()); out.get(name).add(date); };
  for (const e of entries) {
    if (!alive(e)) continue;
    if (e.type === 'habit_check' && e.data?.done) add(e.data.habit, e.date);
    else if (e.type === 'guitar') add(GUITAR, e.date);
  }
  return out;
}

/** Longest run of consecutive days in a Set of YYYY-MM-DD dates. */
export function longestRun(dates) {
  const sorted = [...dates].sort();
  let best = 0;
  let run = 0;
  let prev = null;
  for (const d of sorted) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    if (run > best) best = run;
    prev = d;
  }
  return best;
}

/** Streak ending on `end` (counted back while every day is done), using the habit helper. */
function streakEndingAt(dates, name, end) {
  const entries = [...dates].map((date) => ({ type: 'habit_check', date, deletedAt: null, data: { habit: name, done: true } }));
  return currentStreak(entries, { name }, end);
}

/**
 * New stats from every current entry plus the previous stats. Never loses information:
 * best streaks only grow, anchors and last sets only move forward in time.
 */
export function computeStats(entries, prev = emptyStats(), now = 0) {
  const base = { ...emptyStats(), ...prev };
  const best = { ...base.best };
  const anchors = { ...base.anchors };

  for (const [name, dates] of doneDates(entries)) {
    const latest = [...dates].sort().pop();
    best[name] = Math.max(best[name] || 0, longestRun(dates));
    if (!anchors[name] || latest >= anchors[name].date) {
      anchors[name] = { date: latest, streak: streakEndingAt(dates, name, latest) };
    }
  }

  const lastSets = { ...base.lastSets };
  for (const e of entries) {
    if (!alive(e) || e.type !== 'guitar') continue;
    const focus = e.data.focus || 'practice';
    const cur = lastSets[focus];
    if (!cur || e.date >= cur.date) {
      lastSets[focus] = { date: e.date, minutes: e.data.minutes, best_bpm: e.data.best_bpm ?? null };
    }
  }

  // Latest weigh-in per day wins; keep the most recent MAX_WEIGH_INS days.
  const perDay = new Map(base.weighIns.map((w) => [w.date, { ...w, at: 0 }]));
  for (const e of entries) {
    if (!alive(e) || e.type !== 'weigh_in') continue;
    const cur = perDay.get(e.date);
    if (!cur || e.updatedAt >= cur.at) perDay.set(e.date, { date: e.date, weight_lb: e.data.weight_lb, at: e.updatedAt });
  }
  const weighIns = [...perDay.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-MAX_WEIGH_INS)
    .map(({ date, weight_lb }) => ({ date, weight_lb }));

  return { key: 'stats', updatedAt: now, best, anchors, lastSets, weighIns };
}

/**
 * Current streak for display. Takes the larger of: the streak counted from remaining entries,
 * the same streak extended by an anchor that ends the day before it, and the anchor itself
 * while it is still alive (ended today or yesterday).
 */
export function streakWithStats(entries, name, today, stats) {
  const habit = { name };
  const list = name === GUITAR
    ? entries.filter((e) => e.type === 'guitar').map((e) => ({ type: 'habit_check', date: e.date, deletedAt: e.deletedAt, data: { habit: name, done: true } }))
    : entries;
  const n = currentStreak(list, habit, today);
  const anchor = stats?.anchors?.[name];
  if (!anchor) return n;

  const alivedAnchor = anchor.date >= addDays(today, -1) ? anchor.streak : 0;
  let extended = 0;
  if (n > 0) {
    const doneToday = list.some((e) => !e.deletedAt && e.data?.done && e.data.habit === name && e.date === today);
    const earliest = addDays(today, doneToday ? -(n - 1) : -n);
    if (anchor.date === addDays(earliest, -1)) extended = n + anchor.streak;
  }
  return Math.max(n, extended, alivedAnchor);
}
