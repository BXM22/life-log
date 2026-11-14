// Streaks (F11). Pure: callers pass `today` (logical date). Dates are YYYY-MM-DD strings.
// A streak is consecutive days. If today is not done yet it does not break the streak: counting starts yesterday.

import { addDays } from './dates.js';

/** Set of dates a habit was done, from live habit_check entries. */
export function habitDays(entries, habit) {
  return new Set(entries
    .filter((e) => e.type === 'habit_check' && !e.deletedAt && e.data?.done && e.data.habit === habit.name)
    .map((e) => e.date));
}

/** Set of dates with at least one live guitar session. */
export function guitarDays(entries) {
  return new Set(entries.filter((e) => e.type === 'guitar' && !e.deletedAt).map((e) => e.date));
}

/** { current, best } for a set of done dates. */
export function streakOf(days, today) {
  let day = days.has(today) ? today : addDays(today, -1);
  let current = 0;
  while (days.has(day)) { current += 1; day = addDays(day, -1); }

  const sorted = [...days].filter((d) => d <= today).sort();
  let best = 0;
  let run = 0;
  let prev = null;
  for (const d of sorted) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    if (run > best) best = run;
    prev = d;
  }
  return { current, best };
}

/** Streaks per habit plus guitar sessions. Returns [{ id, name, current, best }]. */
export function allStreaks(entries, habits, today) {
  const rows = habits.map((h) => ({ id: h.id, name: h.name, ...streakOf(habitDays(entries, h), today) }));
  rows.push({ id: 'guitar-sessions', name: 'Guitar practice', ...streakOf(guitarDays(entries), today) });
  return rows;
}
