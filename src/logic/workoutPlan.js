// Pure helpers for the Workout tab v2: set dots, session progress, history grouping, exercise list.
import { setsFor } from './workout.js';
import { setCount, trimmedFor } from './workoutExtras.js';
import { weekDates } from './weekView.js';

const workingDone = (entries, day, name) =>
  setsFor(entries, day, name).filter((e) => e.data.kind === 'working').length;

/**
 * Dots for one exercise: { total, done }. `total` is the target's set count minus trimmed sets
 * (trims is the wTrims map), or null when the target has no set count (AMRAP, timed...).
 * `done` is the RAW count of live working sets on `day`; it can exceed `total`, so the UI must clamp.
 */
export function setDots(ex, entries, day, trims) {
  const count = setCount(ex.target);
  const total = count == null ? null : count - trimmedFor(trims, day, ex.name, ex.target);
  return { total, done: workingDone(entries, day, ex.name) };
}

/**
 * Overall progress over an exercise array: { done, total }.
 * `total` sums the known per-exercise totals. Exercises with a null total contribute nothing to either
 * side, so "done" never counts sets that are absent from "total". Done per exercise is clamped to its total
 * so extra sets beyond target do not inflate the numerator.
 */
export function sessionProgress(exercises, entries, day, trims) {
  let done = 0;
  let total = 0;
  for (const ex of exercises ?? []) {
    const d = setDots(ex, entries, day, trims);
    if (d.total == null) continue;
    total += d.total;
    done += Math.min(d.done, d.total);
  }
  return { done, total };
}

/** Groups workoutDays() output (newest first) into This week / Last week / Earlier (weeks start Monday). */
export function groupHistoryDays(days, today) {
  const thisStart = weekDates(today, 0)[0];
  const lastStart = weekDates(today, -1)[0];
  const groups = [{ label: 'This week', days: [] }, { label: 'Last week', days: [] }, { label: 'Earlier', days: [] }];
  for (const d of days ?? []) {
    groups[d.date >= thisStart ? 0 : d.date >= lastStart ? 1 : 2].days.push(d);
  }
  return groups.filter((g) => g.days.length);
}

/**
 * Flat exercise list for the Today screen: [{ ex, i, kind, sessionKey }].
 * Template exercises (i 0..n-1), then extras (array from extrasFor), then calisthenics block exercises.
 * sessionKey is what to store in data.session: session.id for template and extras, caliBlock.name for cali.
 */
export function exerciseList(session, extras, caliBlock) {
  const out = [];
  const add = (ex, kind, sessionKey) => out.push({ ex, i: out.length, kind, sessionKey });
  for (const ex of session?.exercises ?? []) add(ex, 'template', session.id);
  // An extra whose name the template already has (for example after switching templates) is hidden, so one name is never listed twice.
  const have = new Set((session?.exercises ?? []).map((e) => e.name.toLowerCase()));
  for (const ex of extras ?? []) if (!have.has(ex.name.toLowerCase())) add(ex, 'extra', session?.id);
  for (const ex of caliBlock?.exercises ?? []) add(ex, 'cali', caliBlock.name);
  return out;
}
