// Habit logic. Pure: no storage, no clock. Callers pass `now` and the logical `date`.
//
// A habit is { id, name }. The id is the normalized name, so the same name cannot exist twice.
// A check is a habit_check entry with a stable id per habit + date, so toggling updates one entry.
//
// Export safety: an entry that was already exported is never hidden by deletedAt (the vault copy
// would stay "done" forever). It is flipped to done:false with a new updatedAt, so it exports again
// and is excluded from wipe until re-exported. Only a check that never left this phone is deleted.

import { addDays } from './dates.js';

export const MAX_HABIT_NAME = 40;

/** Trim and collapse spaces. Returns null if empty or too long. */
export function normalizeName(raw) {
  const name = String(raw ?? '').replace(/\s+/g, ' ').trim();
  return name && name.length <= MAX_HABIT_NAME ? name : null;
}

export const habitId = (name) => normalizeName(name)?.toLowerCase() ?? null;

export const checkId = (habit, date) => `hc-${habit.id}-${date}`;

/** The habits a fresh install starts with. All of them can be renamed or removed. */
export const STARTER_HABITS = ['Guitar', 'Coding', 'Workout'];
export const starterHabits = () => STARTER_HABITS.map((name) => ({ id: habitId(name), name }));

/** Add a habit. Returns { habits, habit } or { error }. Does not mutate. */
export function addHabit(habits, rawName) {
  const name = normalizeName(rawName);
  if (!name) return { error: `Enter a habit name, 1 to ${MAX_HABIT_NAME} characters.` };
  const id = habitId(name);
  if (habits.some((h) => h.id === id)) return { error: `${name} is already on the list.` };
  const habit = { id, name };
  return { habits: [...habits, habit], habit };
}

/** The check entry for this habit and date, matched by stable id, then by name + date. */
export function findCheck(entries, habit, date) {
  const id = checkId(habit, date);
  return entries.find((e) => e.id === id)
    ?? entries.find((e) => e.type === 'habit_check' && e.date === date && e.data?.habit === habit.name);
}

export const isChecked = (entries, habit, date) => {
  const e = findCheck(entries, habit, date);
  return Boolean(e && !e.deletedAt && e.data.done);
};

/**
 * Toggle a habit for a date. Returns the one entry to save (a new object, inputs untouched).
 * - no entry yet: new done entry
 * - checked, never exported: soft-deleted (it never reached the vault)
 * - checked, already exported: done:false with a new updatedAt, so the change is exported
 * - unchecked or deleted: done again, deletedAt cleared, new updatedAt
 */
export function toggleCheck(entries, habit, date, now) {
  const existing = findCheck(entries, habit, date);
  if (!existing) {
    return {
      id: checkId(habit, date), type: 'habit_check', date, data: { habit: habit.name, done: true },
      updatedAt: now, exportedAt: null, exportId: null, deletedAt: null,
    };
  }
  if (!existing.deletedAt && existing.data.done) {
    if (existing.exportedAt == null) return { ...existing, deletedAt: now, updatedAt: now };
    return { ...existing, data: { ...existing.data, done: false }, updatedAt: now };
  }
  return { ...existing, data: { ...existing.data, habit: habit.name, done: true }, deletedAt: null, updatedAt: now };
}

/** Consecutive done days ending today. If today is not done yet, counts back from yesterday. */
export function currentStreak(entries, habit, today) {
  const done = new Set(
    entries
      .filter((e) => e.type === 'habit_check' && !e.deletedAt && e.data?.done && e.data.habit === habit.name)
      .map((e) => e.date),
  );
  let day = done.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (done.has(day)) { n += 1; day = addDays(day, -1); }
  return n;
}
