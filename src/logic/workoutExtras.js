// Workout extras. Pure: no storage, no clock.
//   F29 warm-up checklists and back-training cues
//   F30 trim a set (a per-day tweak to the shown target; history is never changed)
//   F32 calisthenics blocks (Mon push, Wed pull) and the BJJ done check
//
// Calisthenics sets are 'lift_set' entries with session 'Calisthenics push' or 'Calisthenics pull'.
// The BJJ check is a 'habit_check' entry (habit 'BJJ') with one stable id per date, so toggling updates one entry.

import { newEntry, editEntry } from './entries.js';
import { weekday } from './workout.js';

// ---- F29: warm-up checklists ----
export const CHECKLISTS = {
  upper: { title: 'UPPER WARM-UP', items: [
    'Arm circles and band pull-aparts, 1 min',
    'Scap pulls and shoulder blade slides, 1 x 10',
    'Light band external rotations, 1 x 12',
    'First exercise: one light set at about 50%',
  ] },
  lower: { title: 'LOWER WARM-UP', items: [
    '5 min easy bike or walk',
    'Glute bridges, 1 x 12',
    'Bodyweight squats or hip hinges, 1 x 10',
    'Leg swings, 10 each side',
    'First exercise: one light set at about 50%',
  ] },
  bjj: { title: 'POST-BJJ WARM-UP', items: [
    'Sip water, shake out the neck and hips',
    'Wrist circles and rocks, 1 min',
    'Arm circles, 1 x 10',
    'Scap pulls, 1 x 8',
  ] },
};

/** Which checklist a session uses: 'lower' for Lower, 'upper' for the Upper sessions, else null (custom sessions). */
export function checklistKey(session) {
  const id = session?.id ?? '';
  if (id === 'lower') return 'lower';
  if (id.startsWith('upper')) return 'upper';
  return null;
}

export const checkKey = (day, list) => `${day}|${list}`;

/** Count of ticked items for one checklist on one day. checks is { 'day|list': { '0': true } }. */
export const checkedCount = (checks, day, list) => Object.values(checks?.[checkKey(day, list)] ?? {}).filter(Boolean).length;

// ---- F29: back-training cues ----
const BACK_CUES = [
  { match: /one-arm.*pulldown/i, cue: 'Best lat isolation. Do not just grab the handle: get the stretch, then start by pulling the shoulder down.' },
  { match: /row/i, cue: 'Let the blade protract at the bottom, then drive the elbow back. Arms are hooks from the elbow down, so the biceps do not turn it into a curl.' },
  { match: /pulldown|pull-up|pull up/i, cue: 'Shoulders down first, elbows down toward the sides, slow lat stretch at the top. For width, stay upright with elbows slightly in front. If step one is hard, do a scap-pull-only set.' },
];
const GENERAL_CUE = 'Same four movements: blade up and forward at the bottom (lat stretched); start with the shoulder down (vertical) or back (rows); elbow drives down and slightly in, or straight back on rows; return slowly. Use straps.';

/** The cue text for a back exercise, or null for any other exercise. */
export function backCue(name) {
  if (/straight-arm/i.test(name)) return `${GENERAL_CUE} Keep the arms nearly straight and sweep down with the lats.`;
  const hit = BACK_CUES.find((c) => c.match.test(name));
  return hit ? `${hit.cue} ${GENERAL_CUE}` : null;
}

// ---- F30: trim a set ----
const COUNT = /^(\s*)(\d+)(\s*(?:x|sets?)\b)/i;

/** Number of sets in a target such as "3 x 6-8" or "3 sets", or null. */
export function setCount(target) {
  const m = COUNT.exec(String(target ?? ''));
  return m ? Number(m[2]) : null;
}

export const trimKey = (day, exercise) => `${day}|${exercise}`;

/** Sets trimmed for an exercise today, never below one set left. */
export function trimmedFor(trims, day, exercise, target) {
  const n = Number(trims?.[trimKey(day, exercise)] ?? 0);
  const total = setCount(target);
  if (total == null || !(n > 0)) return 0;
  return Math.min(n, total - 1);
}

/** The target with trimmed sets removed: "3 x 6-8" with 1 trimmed becomes "2 x 6-8". */
export function trimmedTarget(target, trimmed) {
  if (!trimmed) return target;
  return String(target).replace(COUNT, (_, a, n, rest) => `${a}${Number(n) - trimmed}${rest}`);
}

/** New trims object with one more (+1) or one fewer (-1) set trimmed. */
export function bumpTrim(trims, day, exercise, target, delta) {
  const next = { ...(trims ?? {}) };
  const total = setCount(target);
  if (total == null) return next;
  const now = trimmedFor(next, day, exercise, target);
  const v = Math.max(0, Math.min(total - 1, now + delta));
  if (v) next[trimKey(day, exercise)] = v; else delete next[trimKey(day, exercise)];
  return next;
}

/** Keep only one day's keys so stored tweaks do not pile up. */
export function pruneDay(map, day) {
  return Object.fromEntries(Object.entries(map ?? {}).filter(([k]) => k.startsWith(`${day}|`)));
}

// ---- F32: calisthenics ----
const cx = (name, mode, target) => ({ name, mode, target, warmup: 'none' });

export const CALISTHENICS = {
  push: { id: 'push', name: 'Calisthenics push', focus: 'Toward handstand', exercises: [
    cx('Wrist warm-up (circles, rocks)', 'timed', '1 min'),
    cx('Wall handstand hold (chest to wall)', 'timed', '4 x 20-30 sec'),
    cx('Pike push-up', 'bodyweight', '3 x 6-8'),
    cx('Hollow body hold', 'timed', '3 x 20-30 sec'),
  ] },
  pull: { id: 'pull', name: 'Calisthenics pull', focus: 'Toward muscle-up', exercises: [
    cx('Scap pull-ups (no full rep)', 'bodyweight', '2 x 8'),
    cx('Pull-ups (strict)', 'bodyweight', '3 x 4-6'),
    cx('False-grip hang', 'timed', '3 x 15-20 sec'),
    cx('Straight-bar dip negatives', 'bodyweight', '3 x 3-5'),
  ] },
};

/** Calisthenics block for a date: push on Monday, pull on Wednesday, else null. */
export function calisthenicsFor(date) {
  const d = weekday(date);
  return d === 1 ? CALISTHENICS.push : d === 3 ? CALISTHENICS.pull : null;
}

/** BJJ days are the same two days as calisthenics. */
export const isBjjDay = (date) => calisthenicsFor(date) != null;

// ---- F32: BJJ done check ----
export const BJJ_HABIT = 'BJJ';
export const bjjId = (date) => `bjj-${date}`;

const bjjEntry = (entries, date) => entries.find((e) => e.id === bjjId(date));

/** True when BJJ is checked done for the date. */
export function bjjDone(entries, date) {
  const e = bjjEntry(entries, date);
  return Boolean(e && !e.deletedAt && e.data?.done);
}

/** The entry to save to flip the BJJ check. Edits the existing entry (so it exports again) or creates it. */
export function toggleBjj(entries, date, now) {
  const e = bjjEntry(entries, date);
  if (!e) return { ...newEntry('habit_check', date, { habit: BJJ_HABIT, done: true }, now), id: bjjId(date) };
  return editEntry(e, { habit: BJJ_HABIT, done: !(e.data?.done && !e.deletedAt) }, now);
}
