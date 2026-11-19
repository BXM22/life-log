// Personal records: the top 5 results per list, kept through a wipe. Pure: no storage, no clock.
//
// Shape (inside the retained stats record, key `records`):
//   { lifts:    { [exercise]: [ { value, unit, text, date } ] },   // best first
//     bodyweight: [ { value, unit: 'lb', text, date } ],            // lowest first
//     guitar:   { [focus]: [ { value, unit: 'bpm', text, date } ] },
//     session:  [ { value, unit: 'min', text, date } ] }            // longest practice
// A record is a snapshot: editing or deleting the original entry does not remove it.

import { setText } from './workout.js';
import { guitarView } from './sessions.js';

export const TOP_N = 5;

export const emptyRecords = () => ({ lifts: {}, bodyweight: [], guitar: {}, session: [] });

/** Estimated one-rep max: weight x (1 + reps / 30), rounded to a whole pound. */
export const est1RM = (weight, reps) => Math.round(weight * (1 + reps / 30));

/** Merge new candidates into a list: dedupe by date and text, rank, keep the top N. */
function top(list, extra, better) {
  const seen = new Set();
  return [...(list || []), ...extra]
    .filter((r) => { const k = `${r.date}|${r.text}`; if (seen.has(k)) return false; seen.add(k); return true; })
    .sort((a, b) => (better === 'low' ? a.value - b.value : b.value - a.value) || b.date.localeCompare(a.date))
    .slice(0, TOP_N);
}

function liftRecord(d, date) {
  if (d.seconds != null) return { value: d.seconds, unit: 'sec', text: setText(d), date };
  if (d.reps == null) return null;
  if (d.weight == null || d.load) return { value: d.reps, unit: 'reps', text: setText(d), date };
  return { value: est1RM(d.weight, d.reps), unit: '1RM', text: setText(d), date };
}

/**
 * The actual personal best for one lift, from live sets and records kept through wipes.
 * Weighted lifts: heaviest weight (more reps breaks a tie), plus its estimated 1RM. Otherwise most reps, else longest hold.
 * Returns { kind: 'weight' | 'reps' | 'sec', text, est1rm (weight only, else null), date } or null.
 */
export function bestSet(entries, stats, exercise) {
  const weight = [];
  const reps = [];
  const sec = [];
  for (const e of entries) {
    const d = e.data || {};
    if (e.type !== 'lift_set' || e.deletedAt || d.kind !== 'working' || d.exercise !== exercise) continue;
    if (d.seconds != null) sec.push({ n: d.seconds, text: setText(d), date: e.date });
    else if (d.reps == null) continue;
    else if (d.weight == null || d.load) reps.push({ n: d.reps, text: setText(d), date: e.date });
    else weight.push({ n: d.weight, reps: d.reps, text: setText(d), date: e.date });
  }
  for (const r of stats?.records?.lifts?.[exercise] || []) { // kept records are text like "185 x 5"
    const m = r.unit === '1RM' && /^(\d+(?:\.\d+)?) x (\d+)$/.exec(r.text);
    if (m) weight.push({ n: Number(m[1]), reps: Number(m[2]), text: r.text, date: r.date });
    else if (r.unit === 'reps') reps.push({ n: r.value, text: r.text, date: r.date });
    else if (r.unit === 'sec') sec.push({ n: r.value, text: r.text, date: r.date });
  }
  const pick = (list, tie) => list.sort((a, b) => b.n - a.n || (tie ? b.reps - a.reps : 0) || b.date.localeCompare(a.date))[0];
  const w = pick(weight, true);
  if (w) return { kind: 'weight', text: w.text, est1rm: est1RM(w.n, w.reps), date: w.date };
  const r = pick(reps, false);
  if (r) return { kind: 'reps', text: r.text, est1rm: null, date: r.date };
  const s = pick(sec, false);
  return s ? { kind: 'sec', text: s.text, est1rm: null, date: s.date } : null;
}

/**
 * The best working set of each of the last `n` days before `before` that you did this lift, newest first:
 * [{ date, text, est1rm (weighted lifts only, else null) }]. Weighted: heaviest weight, then reps. Else most reps, else longest hold.
 */
export function recentBest(entries, exercise, before, n = 3) {
  const days = new Map();
  for (const e of entries) {
    const d = e.data || {};
    if (e.type !== 'lift_set' || e.deletedAt || d.kind !== 'working' || d.exercise !== exercise || e.date >= before) continue;
    const weighted = d.seconds == null && d.reps != null && d.weight != null && !d.load;
    const rank = weighted ? d.weight * 1000 + d.reps : d.seconds != null ? d.seconds : d.reps ?? -1;
    const cur = days.get(e.date);
    if (!cur || rank > cur.rank) days.set(e.date, { rank, date: e.date, text: setText(d), est1rm: weighted ? est1RM(d.weight, d.reps) : null });
  }
  return [...days.values()].sort((a, b) => b.date.localeCompare(a.date)).slice(0, n).map(({ date, text, est1rm }) => ({ date, text, est1rm }));
}

/** Prior records plus anything better in the current entries. Never loses a kept record. */
export function mergeRecords(prev, entries) {
  const base = { ...emptyRecords(), ...(prev || {}) };
  const lifts = {};
  const guitar = {};
  const bodyweight = [];
  const session = [];
  const perDay = new Map();
  for (const e of entries) {
    if (e.deletedAt) continue;
    const d = e.data || {};
    if (e.type === 'lift_set' && d.kind === 'working') {
      const r = liftRecord(d, e.date);
      if (r) (lifts[d.exercise] ||= []).push(r);
    } else if (e.type === 'weigh_in') {
      const cur = perDay.get(e.date);
      if (!cur || e.updatedAt >= cur.at) perDay.set(e.date, { at: e.updatedAt, weight: d.weight_lb });
    } else if (guitarView(e)) {
      const g = guitarView(e);
      if (g.best_bpm != null) (guitar[g.focus || 'practice'] ||= []).push({ value: g.best_bpm, unit: 'bpm', text: `${g.best_bpm} bpm`, date: e.date });
      if (g.minutes != null) session.push({ value: g.minutes, unit: 'min', text: `${g.minutes} min`, date: e.date });
    }
  }
  for (const [date, w] of perDay) bodyweight.push({ value: w.weight, unit: 'lb', text: `${w.weight} lb`, date });

  const out = emptyRecords();
  for (const name of new Set([...Object.keys(base.lifts), ...Object.keys(lifts)])) out.lifts[name] = top(base.lifts[name], lifts[name] || [], 'high');
  for (const name of new Set([...Object.keys(base.guitar), ...Object.keys(guitar)])) out.guitar[name] = top(base.guitar[name], guitar[name] || [], 'high');
  out.bodyweight = top(base.bodyweight, bodyweight, 'low');
  out.session = top(base.session, session, 'high');
  return out;
}

const line = (r, i) => `${i + 1}. ${r.text}${r.unit === '1RM' ? ` (est. 1RM ${r.value})` : ''}, ${r.date}`;

/** Markdown for the end of every export, so the vault always holds a copy. Empty array when there are none. */
export function recordsMarkdown(rec) {
  const r = { ...emptyRecords(), ...(rec || {}) };
  const blocks = [];
  for (const [name, list] of Object.entries(r.lifts)) if (list.length) blocks.push(`### ${name}`, ...list.map(line), '');
  if (r.bodyweight.length) blocks.push('### Bodyweight (lowest)', ...r.bodyweight.map(line), '');
  for (const [name, list] of Object.entries(r.guitar)) if (list.length) blocks.push(`### Guitar: ${name} (best BPM)`, ...list.map(line), '');
  if (r.session.length) blocks.push('### Longest practice', ...r.session.map(line), '');
  return blocks.length ? ['## Personal records', '', ...blocks] : [];
}
