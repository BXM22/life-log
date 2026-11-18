// Progress logic for the HISTORY tab (F39, F40). Pure: no storage, no clock; callers pass `today`.

import { addDays } from './dates.js';
import { est1RM } from './records.js';
import { setText } from './workout.js';
import { weekDates, GOAL_WEIGHT } from './weekView.js';
import { isChecked } from './habits.js';

const liveSets = (entries) => entries.filter((e) => e.type === 'lift_set' && !e.deletedAt && e.data?.kind === 'working');

/** The comparable number of a working set: est. 1RM, reps (no weight) or seconds. Null when it has none. */
export function setScore(d) {
  if (d.seconds != null) return { value: d.seconds, unit: 'sec' };
  if (d.reps == null) return null;
  if (d.weight == null || d.load) return { value: d.reps, unit: 'reps' };
  return { value: est1RM(d.weight, d.reps), unit: '1RM' };
}

/**
 * Did this just-logged working set beat everything before it for the same lift?
 * Looks at other live sets and the records kept through wipes. Needs a prior result, so a first-ever set is not a PR.
 * Returns { exercise, value, unit, previous } or null.
 */
export function prCheck(entries, entry, stats) {
  if (!entry || entry.type !== 'lift_set' || entry.data?.kind !== 'working') return null;
  const cur = setScore(entry.data);
  if (!cur) return null;
  const name = entry.data.exercise;
  const prior = liveSets(entries).filter((e) => e.id !== entry.id && e.data.exercise === name)
    .map((e) => setScore(e.data)).filter((s) => s && s.unit === cur.unit).map((s) => s.value);
  for (const r of stats?.records?.lifts?.[name] || []) if (r.unit === cur.unit) prior.push(r.value);
  if (!prior.length) return null;
  const previous = Math.max(...prior);
  return cur.value > previous ? { exercise: name, value: cur.value, unit: cur.unit, previous, text: setText(entry.data) } : null;
}

/** Lift names with a weighted working set in the last `weeks` weeks, sorted. */
export function recentLifts(entries, today, weeks = 8) {
  const from = weekDates(today, -(weeks - 1))[0];
  return [...new Set(liveSets(entries).filter((e) => e.date >= from && e.date <= today && setScore(e.data)?.unit === '1RM').map((e) => e.data.exercise))].sort();
}

/** Best estimated 1RM per Monday-Sunday week, oldest first: [{ weekStart, best }] (best null when none). */
export function oneRmSeries(entries, exercise, today, weeks = 8) {
  const sets = liveSets(entries).filter((e) => e.data.exercise === exercise && setScore(e.data)?.unit === '1RM');
  return Array.from({ length: weeks }, (_, i) => {
    const days = weekDates(today, i - (weeks - 1));
    const vals = sets.filter((e) => e.date >= days[0] && e.date <= days[6]).map((e) => setScore(e.data).value);
    return { weekStart: days[0], best: vals.length ? Math.max(...vals) : null };
  });
}

/** Headline numbers for one lift's 8-week est. 1RM series: { latest, first, delta, lastWeek } (nulls when no data). */
export function liftSummary(entries, exercise, today, weeks = 8) {
  const pts = oneRmSeries(entries, exercise, today, weeks).filter((w) => w.best != null);
  if (!pts.length) return { latest: null, first: null, delta: null, lastWeek: null };
  const latest = pts[pts.length - 1].best;
  const first = pts[0].best;
  return { latest, first, delta: pts.length > 1 ? latest - first : null, lastWeek: pts[pts.length - 1].weekStart };
}

/** The lift to show: the chosen one when it is still in `names`, else the first. Null when there are none. */
export const pickLift = (names, chosen) => (names.includes(chosen) ? chosen : names[0] ?? null);

/** Heatmap of `weeks` Monday-Sunday weeks ending with this one: rows of 7 cells with a 0-4 level (share of habits done). */
export function habitHeatmap(entries, habits, today, weeks = 5) {
  return Array.from({ length: weeks }, (_, i) => weekDates(today, i - (weeks - 1)).map((date) => {
    const future = date > today;
    const done = future ? 0 : habits.filter((h) => isChecked(entries, h, date)).length;
    const level = !habits.length || !done ? 0 : Math.min(4, Math.ceil((done / habits.length) * 4));
    return { date, future, done, total: habits.length, level };
  }));
}

/**
 * Project when bodyweight reaches the goal, by a straight line through the last `days` days of weigh-ins.
 * history: weightHistory rows. Returns { status, latest, perWeek, etaDate, days }.
 * status: none (no data) | reached | few (need more weigh-ins) | wrong (trend moves away from the goal) | ontrack.
 */
export function goalProjection(history, today, goal = GOAL_WEIGHT, days = 28) {
  const from = addDays(today, -(days - 1));
  const pts = history.filter((w) => w.date >= from && w.date <= today).sort((a, b) => a.date.localeCompare(b.date));
  if (!pts.length) return { status: 'none' };
  const latest = pts[pts.length - 1].weight_lb;
  if (latest <= goal) return { status: 'reached', latest };
  const x = pts.map((p) => (Date.parse(p.date) - Date.parse(from)) / 86400000);
  const span = x[x.length - 1] - x[0];
  if (pts.length < 3 || span < 7) return { status: 'few', latest };
  const n = pts.length;
  const mx = x.reduce((a, b) => a + b, 0) / n;
  const my = pts.reduce((a, p) => a + p.weight_lb, 0) / n;
  const slope = x.reduce((a, xi, i) => a + (xi - mx) * (pts[i].weight_lb - my), 0) / x.reduce((a, xi) => a + (xi - mx) ** 2, 0);
  if (!(slope < -0.005)) return { status: 'wrong', latest, perWeek: +(slope * 7).toFixed(2) };
  const fitLatest = my + slope * (x[n - 1] - mx);
  const daysLeft = Math.ceil((goal - fitLatest) / slope);
  return { status: 'ontrack', latest, perWeek: +(slope * 7).toFixed(2), etaDate: addDays(pts[n - 1].date, Math.max(0, daysLeft)), days: Math.max(0, daysLeft) };
}
