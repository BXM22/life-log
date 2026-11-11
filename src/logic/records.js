// Personal records: the top 5 results per list, kept through a wipe. Pure: no storage, no clock.
//
// Shape (inside the retained stats record, key `records`):
//   { lifts:    { [exercise]: [ { value, unit, text, date } ] },   // best first
//     bodyweight: [ { value, unit: 'lb', text, date } ],            // lowest first
//     guitar:   { [focus]: [ { value, unit: 'bpm', text, date } ] },
//     session:  [ { value, unit: 'min', text, date } ] }            // longest practice
// A record is a snapshot: editing or deleting the original entry does not remove it.

import { setText } from './workout.js';

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
  if (d.weight == null) return { value: d.reps, unit: 'reps', text: setText(d), date };
  return { value: est1RM(d.weight, d.reps), unit: '1RM', text: setText(d), date };
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
    } else if (e.type === 'guitar') {
      if (d.best_bpm != null) (guitar[d.focus || 'practice'] ||= []).push({ value: d.best_bpm, unit: 'bpm', text: `${d.best_bpm} bpm`, date: e.date });
      if (d.minutes != null) session.push({ value: d.minutes, unit: 'min', text: `${d.minutes} min`, date: e.date });
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
