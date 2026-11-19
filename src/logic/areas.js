// Learn areas: user-defined things you work on (step 3). Pure: the caller passes the storage.
// An area logs through existing entry types: Guitar -> guitar entry, everything else -> study entry.
import { loadSubjects } from './studySubjects.js';
import { sessionOf, buildSession } from './sessions.js';
import { addDays } from './dates.js';

export const AREAS_KEY = 'lifelog.areas';
export const MAX_AREAS = 20;
export const MAX_AREA_NAME = 60;
export const MAX_METRIC_LABEL = 20;
export const MAX_WEEKLY_GOAL = 2000;
export const STARTER_AREAS = [
  { name: 'Guitar', metricLabel: 'Best BPM', weeklyGoal: null },
  { name: 'Coding', metricLabel: '', weeklyGoal: null },
];
export const AREA_TYPES = ['practice', 'study', 'project', 'review'];

const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
const same = (a, b) => a.toLowerCase() === b.toLowerCase();
const copyStarters = () => STARTER_AREAS.map((a) => ({ ...a }));

export const isGuitar = (name) => clean(name).toLowerCase() === 'guitar';

/** Returns { area } or { error } for the raw fields. */
function parseFields({ name, metricLabel, weeklyGoal }) {
  const n = clean(name);
  if (!n) return { error: 'Enter an area name.' };
  if (n.length > MAX_AREA_NAME) return { error: `Area name must be ${MAX_AREA_NAME} characters or fewer.` };
  const label = clean(metricLabel);
  if (label.length > MAX_METRIC_LABEL) return { error: `Metric label must be ${MAX_METRIC_LABEL} characters or fewer.` };
  let goal = null;
  if (weeklyGoal !== null && weeklyGoal !== undefined && String(weeklyGoal).trim() !== '') {
    const g = Number(weeklyGoal);
    if (!(Number.isInteger(g) && g >= 1 && g <= MAX_WEEKLY_GOAL)) {
      return { error: `Weekly goal must be whole minutes, 1 to ${MAX_WEEKLY_GOAL}.` };
    }
    goal = g;
  }
  return { area: { name: n, metricLabel: label, weeklyGoal: goal } };
}

/** Any value in, a deduplicated (case-insensitive), capped list of valid areas out. */
export function normalizeAreas(raw) {
  const out = [];
  for (const v of Array.isArray(raw) ? raw : []) {
    if (!v || typeof v !== 'object') continue;
    const r = parseFields(v);
    if (r.error) continue;
    if (!out.some((o) => same(o.name, r.area.name))) out.push(r.area);
  }
  return out.slice(0, MAX_AREAS);
}

/** Saved areas; else migrated from the old subjects list (Guitar first); else the starters. Never writes. */
export function loadAreas(storage) {
  let stored = null;
  try { stored = storage.getItem(AREAS_KEY); } catch { stored = null; }
  if (stored !== null && stored !== undefined) {
    try { return normalizeAreas(JSON.parse(stored)); } catch { return copyStarters(); }
  }
  let hasSubjects = false;
  try { hasSubjects = storage.getItem('lifelog.studySubjects') != null; } catch { hasSubjects = false; }
  if (!hasSubjects) return copyStarters();
  const areas = loadSubjects(storage).map((name) => ({ name, metricLabel: '', weeklyGoal: null }));
  if (!areas.some((a) => isGuitar(a.name))) areas.unshift({ ...STARTER_AREAS[0] });
  return normalizeAreas(areas);
}

/** Returns true if saved, false if storage refused. */
export function saveAreas(storage, list) {
  try { storage.setItem(AREAS_KEY, JSON.stringify(normalizeAreas(list))); return true; } catch { return false; }
}

/** Returns { list } or { error }. */
export function addArea(list, fields) {
  const r = parseFields(fields ?? {});
  if (r.error) return r;
  if (list.some((o) => same(o.name, r.area.name))) return { error: 'That area is already in the list.' };
  if (list.length >= MAX_AREAS) return { error: `Keep it to ${MAX_AREAS} areas.` };
  return { list: [...list, r.area] };
}

/** Change an area's fields (rename allowed). Returns { list } or { error }. */
export function updateArea(list, oldName, fields) {
  const i = list.findIndex((o) => o.name === oldName);
  if (i < 0) return { error: 'That area no longer exists.' };
  const r = parseFields({ ...list[i], ...(fields ?? {}) });
  if (r.error) return r;
  if (list.some((o, j) => j !== i && same(o.name, r.area.name))) return { error: 'That area is already in the list.' };
  return { list: list.map((o, j) => (j === i ? r.area : o)) };
}

export const removeArea = (list, name) => list.filter((o) => o.name !== name);

/** The area of a session, guitar or study entry, else null. */
export const areaOfEntry = (entry) => sessionOf(entry)?.area || null;

const minutesOf = (e) => sessionOf(e)?.minutes || 0;

/** [{ area, minutes }] for the day, biggest first. Areas group case-insensitively. */
export function todayByArea(entries, day) {
  const map = new Map();
  for (const e of entries) {
    if (e.deletedAt || e.date !== day) continue;
    const area = areaOfEntry(e);
    if (!area) continue;
    const k = area.toLowerCase();
    const row = map.get(k) ?? { area, minutes: 0 };
    row.minutes += minutesOf(e);
    map.set(k, row);
  }
  return [...map.values()].sort((a, b) => b.minutes - a.minutes);
}

export const minutesToday = (entries, day) => todayByArea(entries, day).reduce((s, r) => s + r.minutes, 0);

/** Minutes for an area over the 7 days ending on `today` inclusive. */
export function weekMinutes(entries, areaName, today) {
  const start = addDays(today, -6);
  const want = clean(areaName).toLowerCase();
  let total = 0;
  for (const e of entries) {
    if (e.deletedAt || e.date < start || e.date > today) continue;
    const a = areaOfEntry(e);
    if (a && a.toLowerCase() === want) total += minutesOf(e);
  }
  return total;
}

/** Returns { entry, message } or { error }. Always a session entry. */
export function buildLearnEntry(area, { type, minutes, metric, focus, notes } = {}, day, now) {
  return buildSession({ area: area.name, type, minutes, metric, metricLabel: area.metricLabel, focus, notes }, day, now);
}
