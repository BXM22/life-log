// Custom activities for the Workout tab (BJJ, Calisthenics, Run, Bike, Yoga...), shown in their own Activities card.
// Pure: no storage, no clock. The list lives in localStorage on this device (like today's extras).
//
// Activity: { id, name, days: [0..6] (0 = Sunday), done, distance, sets, unit: 'mi' | 'km', builtin?: 'cali' }
//   done      show a done check          distance  log a distance        sets  log sets of reps
//   builtin   'cali' = the Monday/Wednesday calisthenics block (days are fixed by calisthenicsFor).
// A day's log is ONE habit_check entry per activity per date (so toggling edits one entry):
//   data { habit: name, done, distance?, unit?, sets?: [reps] }. BJJ keeps its old id and habit name so past checks still count.

import { newEntry, editEntry } from './entries.js';
import { weekday } from './workout.js';
import { calisthenicsFor, BJJ_HABIT, bjjId } from './workoutExtras.js';

export const ACTIVITIES_KEY = 'lifelog.activities';
export const MAX_ACTIVITIES = 12;
export const MAX_NAME = 30;
export const UNITS = ['mi', 'km'];
export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const DEFAULT_ACTIVITIES = [
  { id: 'bjj', name: 'BJJ', days: [1, 3], done: true, distance: false, sets: false, unit: 'mi' },
  { id: 'cali', name: 'Calisthenics', days: [1, 3], done: false, distance: false, sets: false, unit: 'mi', builtin: 'cali' },
];

const copyDefaults = () => DEFAULT_ACTIVITIES.map((a) => ({ ...a, days: [...a.days] }));

function clean(a) {
  if (!a || typeof a.id !== 'string' || typeof a.name !== 'string') return null;
  const days = [...new Set((Array.isArray(a.days) ? a.days : []).map(Number).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))].sort();
  return { id: a.id, name: a.name.slice(0, MAX_NAME), days, done: Boolean(a.done), distance: Boolean(a.distance), sets: Boolean(a.sets),
    unit: UNITS.includes(a.unit) ? a.unit : 'mi', ...(a.builtin === 'cali' ? { builtin: 'cali' } : {}) };
}

/** The saved list, or the defaults (BJJ and Calisthenics) when nothing valid is saved. An empty saved list stays empty. */
export function loadActivities(storage) {
  try {
    const raw = JSON.parse(storage.getItem(ACTIVITIES_KEY));
    if (Array.isArray(raw)) return raw.map(clean).filter(Boolean);
  } catch { /* none saved or blocked */ }
  return copyDefaults();
}

export function saveActivities(storage, list) {
  try { storage.setItem(ACTIVITIES_KEY, JSON.stringify(list)); } catch { /* private mode: kept in memory only */ }
}

const listOrDefaults = (list) => list ?? copyDefaults();
export const findActivity = (list, id) => listOrDefaults(list).find((a) => a.id === id) ?? null;

/** Activities scheduled for a date. The calisthenics block only shows on a day it has a block. */
export function activitiesFor(list, date) {
  const d = weekday(date);
  return listOrDefaults(list).filter((a) => (a.builtin === 'cali' ? calisthenicsFor(date) != null : a.days.includes(d)));
}

/** Calisthenics block for a date, or null when the Calisthenics activity was removed. */
export function caliBlockFor(list, date) {
  return findActivity(list, 'cali') ? calisthenicsFor(date) : null;
}

/** True when the BJJ activity exists and is scheduled that date. */
export function bjjScheduled(list, date) {
  const a = findActivity(list, 'bjj');
  return Boolean(a && a.days.includes(weekday(date)));
}

function fields(raw, list, selfId) {
  const name = String(raw.name ?? '').replace(/\s+/g, ' ').trim();
  if (!name) return { error: 'Give the activity a name.' };
  if (name.length > MAX_NAME) return { error: `Name must be ${MAX_NAME} characters or fewer.` };
  if (listOrDefaults(list).some((a) => a.id !== selfId && a.name.toLowerCase() === name.toLowerCase())) return { error: 'You already have an activity with that name.' };
  const days = [...new Set((raw.days ?? []).map(Number).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))].sort();
  const out = { name, days, done: Boolean(raw.done), distance: Boolean(raw.distance), sets: Boolean(raw.sets), unit: UNITS.includes(raw.unit) ? raw.unit : 'mi' };
  if (!out.done && !out.distance && !out.sets) return { error: 'Pick at least one thing to log.' };
  return { fields: out };
}

/** Add an activity. Returns { list, id } or { error }. */
export function addActivity(list, raw, makeId = () => `a${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`) {
  const cur = listOrDefaults(list);
  if (cur.length >= MAX_ACTIVITIES) return { error: `You can keep up to ${MAX_ACTIVITIES} activities.` };
  const r = fields(raw, cur, null);
  if (r.error) return r;
  const id = makeId();
  return { list: [...cur, { id, ...r.fields }], id };
}

/** Change an activity. The calisthenics block keeps its fixed days and only the name can differ. */
export function updateActivity(list, id, raw) {
  const cur = listOrDefaults(list);
  const a = cur.find((x) => x.id === id);
  if (!a) return { error: 'That activity no longer exists.' };
  if (a.builtin === 'cali') return { list: cur.map((x) => (x.id === id ? { ...x, name: String(raw.name ?? '').trim().slice(0, MAX_NAME) || x.name } : x)) };
  const r = fields(raw, cur, id);
  if (r.error) return r;
  return { list: cur.map((x) => (x.id === id ? { ...x, ...r.fields } : x)) };
}

export const removeActivity = (list, id) => listOrDefaults(list).filter((a) => a.id !== id);

// ---- the day's log ----

export const activityEntryId = (a, date) => (a.id === 'bjj' ? bjjId(date) : `act-${a.id}-${date}`);
const habitName = (a) => (a.id === 'bjj' ? BJJ_HABIT : a.name);
const entryFor = (entries, a, date) => entries.find((e) => e.id === activityEntryId(a, date));

/** What was logged for an activity on a date: { done, distance, unit, sets }. */
export function activityLog(entries, a, date) {
  const e = entryFor(entries, a, date);
  if (!e || e.deletedAt) return { done: false, distance: null, unit: a.unit, sets: [] };
  const d = e.data ?? {};
  return { done: Boolean(d.done), distance: d.distance ?? null, unit: d.unit ?? a.unit, sets: Array.isArray(d.sets) ? d.sets : [] };
}

/** One-line status for the Today row. */
export function activityStatus(entries, a, date) {
  const l = activityLog(entries, a, date);
  const bits = [];
  if (l.distance != null) bits.push(`${l.distance} ${l.unit}`);
  if (l.sets.length) bits.push(`${l.sets.length} ${l.sets.length === 1 ? 'set' : 'sets'}`);
  if (l.done) bits.unshift('Done');
  return bits.join(' · ') || 'Not yet';
}

/** Parse a distance from the form. Blank clears it. Returns { value } (number|null) or { error }. */
export function parseDistance(raw) {
  if (String(raw ?? '').trim() === '') return { value: null };
  const v = Number(raw);
  if (!(v > 0 && v <= 1000)) return { error: 'Enter a distance above 0 and up to 1000.' };
  return { value: Math.round(v * 100) / 100 };
}

/** Parse reps for one set. Returns { value } or { error }. */
export function parseReps(raw) {
  const v = Number(raw);
  if (String(raw ?? '').trim() === '' || !(Number.isInteger(v) && v >= 1 && v <= 1000)) return { error: 'Enter whole reps, 1 to 1000.' };
  return { value: v };
}

/**
 * The entry to save after changing the day's log. `change` is a partial { done, distance, sets }.
 * Edits the existing entry (so it exports again) or creates it with a stable id.
 */
export function applyActivityChange(entries, a, date, change, now) {
  const e = entryFor(entries, a, date);
  const base = { habit: habitName(a) };
  if (!e) {
    const data = { ...base, done: false, ...change };
    if (data.distance != null || a.distance) data.unit = a.unit;
    return { ...newEntry('habit_check', date, data, now), id: activityEntryId(a, date) };
  }
  const next = { ...base, ...change };
  if (next.distance != null) next.unit = a.unit;
  return editEntry(e, next, now);
}
