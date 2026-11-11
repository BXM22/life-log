// Workout logging logic. Pure: no storage, no clock.
//
// A logged set is a 'lift_set' entry:
//   data { session, exercise, kind: 'warmup' | 'working', weight, reps, seconds, side: 'L' | 'R' | null }
// One entry per set, so each set can be edited, deleted, exported and wiped like any other entry.

import { scheduleFor, sessionById, getSessions } from './template.js';

export const KINDS = ['warmup', 'working'];

/** Weekday of a YYYY-MM-DD date, 0 = Sunday. */
export function weekday(date) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** The session scheduled for a date (in a 3-day or 4-day week), or null on BJJ days and rest days. */
export const sessionForDate = (date, days = 4) => scheduleFor(days)[weekday(date)] ?? null;

/** The session to show: the one the user picked, else today's, else Upper A. */
export function activeSessionId(picked, date, days = 4) {
  if (sessionById(picked)) return picked;
  const scheduled = sessionForDate(date, days);
  if (sessionById(scheduled)) return scheduled; // a scheduled session may have been deleted
  return sessionById('upper_a') ? 'upper_a' : getSessions()[0].id;
}

const blank = (v) => String(v ?? '').trim() === '';

/** Validate the set form for an exercise. Returns { data: { weight, reps, seconds, side } } or { error }. */
export function parseSet(exercise, { weight, reps, seconds, side }) {
  const mode = exercise.mode;
  let w = null;
  if (!blank(weight)) {
    w = Number(weight);
    if (!(w >= 0 && w <= 1000)) return { error: 'Weight must be 0 to 1000 lb.' };
    w = Math.round(w * 10) / 10;
  } else if (mode === 'weight') {
    return { error: 'Enter the weight.' };
  }

  let r = null;
  let s = null;
  if (mode === 'timed') {
    s = Number(seconds);
    if (blank(seconds) || !(Number.isInteger(s) && s >= 1 && s <= 3600)) return { error: 'Enter whole seconds, 1 to 3600.' };
  } else {
    r = Number(reps);
    if (blank(reps) || !(Number.isInteger(r) && r >= 1 && r <= 100)) return { error: 'Enter whole reps, 1 to 100.' };
  }

  let sd = null;
  if (exercise.perSide) {
    if (side !== 'L' && side !== 'R') return { error: 'Pick left or right.' };
    sd = side;
  }
  return { data: { weight: w, reps: r, seconds: s, side: sd } };
}

/** Compact text for one set: "100 x 8", "8 reps", "45 lb for 30 sec", "30 sec", with an L or R prefix. */
export function setText(d) {
  let t;
  if (d.seconds != null) t = d.weight != null ? `${d.weight} lb for ${d.seconds} sec` : `${d.seconds} sec`;
  else t = d.weight != null ? `${d.weight} x ${d.reps}` : `${d.reps} reps`;
  return d.side ? `${d.side} ${t}` : t;
}

const liveSets = (entries) => entries.filter((e) => e.type === 'lift_set' && !e.deletedAt);

/** Sets logged for one exercise on one date, in the order they were saved. */
export const setsFor = (entries, date, exercise) =>
  liveSets(entries).filter((e) => e.date === date && e.data.exercise === exercise).sort((a, b) => a.updatedAt - b.updatedAt);

/**
 * The most recent working set for an exercise, from current entries or, once those are wiped,
 * from the retained stats. Returns { date, weight, reps, seconds, side } or null.
 */
export function lastWorking(entries, stats, exercise) {
  let best = null;
  for (const e of liveSets(entries)) {
    if (e.data.exercise !== exercise || e.data.kind !== 'working') continue;
    if (!best || e.date > best.date || (e.date === best.date && e.updatedAt >= best.at)) {
      best = { date: e.date, at: e.updatedAt, weight: e.data.weight, reps: e.data.reps, seconds: e.data.seconds, side: e.data.side };
    }
  }
  const kept = stats?.lastLifts?.[exercise];
  if (kept && (!best || kept.date > best.date)) return kept;
  return best;
}

/** Warm-up weight suggestion: about 50% of the last working weight, rounded to 2.5. Null when unknown. */
export function suggestWarmup(last) {
  if (!last || last.weight == null || last.weight <= 0) return null;
  return Math.max(Math.round((last.weight * 0.5) / 2.5) * 2.5, 2.5);
}

/** Top of the rep range in a target such as "3 x 8-12" (12), or null when there is no range. */
export function repCeiling(target) {
  const m = /(\d+)\s*-\s*(\d+)/.exec(String(target ?? ''));
  return m ? Number(m[2]) : null;
}

/**
 * What to try on the first lift of a session, from the last working set. At the top of the rep range
 * (or with no range) add weight; otherwise add one rep. Timed holds add 5 seconds. Null with no history.
 */
export function progressionPrompt(last, exercise) {
  if (!last) return null;
  if (last.seconds != null) return `Try ${last.seconds + 5} sec, 5 more than last time.`;
  if (last.reps == null) return null;
  const ceiling = repCeiling(exercise.target);
  if (last.weight == null) return `Try ${last.reps + 1} reps, one more than last time.`;
  if (ceiling == null || last.reps >= ceiling) {
    const step = last.weight >= 45 ? 5 : 2.5;
    const reps = ceiling == null ? last.reps : Math.min(last.reps, ceiling);
    return `Try ${last.weight + step} lb for ${reps} reps.${ceiling == null ? '' : ' You hit the top of the range.'}`;
  }
  return `Try ${last.weight} x ${last.reps + 1}, one more rep than last time.`;
}

/** Markdown lines for the workout sets in one day's entries. Empty array when there are none. */
export function workoutMarkdown(dayEntries) {
  const sets = liveSets(dayEntries).sort((a, b) => a.updatedAt - b.updatedAt);
  if (!sets.length) return [];
  const bySession = new Map();
  for (const e of sets) {
    if (!bySession.has(e.data.session)) bySession.set(e.data.session, new Map());
    const byEx = bySession.get(e.data.session);
    if (!byEx.has(e.data.exercise)) byEx.set(e.data.exercise, []);
    byEx.get(e.data.exercise).push(e);
  }
  const lines = ['## Workout'];
  for (const [id, byEx] of bySession) {
    lines.push(`### ${sessionById(id)?.name ?? id}`);
    for (const [name, list] of byEx) {
      const warm = list.filter((e) => e.data.kind === 'warmup').map((e) => setText(e.data));
      const work = list.filter((e) => e.data.kind === 'working').map((e) => setText(e.data));
      const parts = [];
      if (warm.length) parts.push(`warm-up ${warm.join(', ')}`);
      if (work.length) parts.push(work.join(', '));
      lines.push(`- ${name}: ${parts.join('; ')}`);
    }
  }
  lines.push('');
  return lines;
}
