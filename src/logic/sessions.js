// Learn sessions (Today v2 step 4). Pure: no storage, no clock.
//   session { area, type, minutes, metric|null, metricLabel, focus, notes }
// Legacy guitar and study entries are read through sessionOf and never rewritten.
import { newEntry } from './entries.js';

export const SESSION_TYPES = ['practice', 'study', 'project', 'review'];
const MAX_AREA = 60;
const MAX_LABEL = 20;
const MAX_FOCUS_LEN = 40;
const MAX_NOTES = 500;

const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
export const isGuitarArea = (name) => clean(name).toLowerCase() === 'guitar';

/** Returns { data } or { error }. */
export function parseSession({ area, type, minutes, metric, metricLabel, focus, notes } = {}) {
  const a = clean(area);
  if (!a) return { error: 'Pick an area.' };
  if (a.length > MAX_AREA) return { error: `Area must be ${MAX_AREA} characters or fewer.` };
  if (!SESSION_TYPES.includes(type)) return { error: 'Pick a session type.' };
  const m = Number(minutes);
  if (String(minutes ?? '').trim() === '' || !(Number.isInteger(m) && m >= 1 && m <= 600)) {
    return { error: 'Enter whole minutes, 1 to 600.' };
  }
  let value = null;
  if (String(metric ?? '').trim() !== '') {
    value = Number(metric);
    if (isGuitarArea(a)) {
      if (!(Number.isInteger(value) && value >= 20 && value <= 400)) return { error: 'Best BPM must be a whole number, 20 to 400.' };
    } else if (!Number.isFinite(value)) {
      return { error: 'Metric must be a number.' };
    }
  }
  const label = clean(metricLabel);
  if (label.length > MAX_LABEL) return { error: `Metric label must be ${MAX_LABEL} characters or fewer.` };
  const f = clean(focus);
  if (f.length > MAX_FOCUS_LEN) return { error: `Focus must be ${MAX_FOCUS_LEN} characters or fewer.` };
  const n = clean(notes);
  if (n.length > MAX_NOTES) return { error: `Notes must be ${MAX_NOTES} characters or fewer.` };
  return { data: { area: a, type, minutes: m, metric: value, metricLabel: label, focus: f, notes: n } };
}

/** Returns { entry, message } or { error }. */
export function buildSession(fields, day, now) {
  const r = parseSession(fields);
  if (r.error) return r;
  return { entry: newEntry('session', day, r.data, now), message: `Saved ${r.data.minutes} min of ${r.data.area}.` };
}

/** Normalised session view of a session, guitar or study entry; else null. */
export function sessionOf(entry) {
  const d = entry?.data;
  if (!entry || !d) return null;
  if (entry.type === 'session') {
    return { area: d.area, type: d.type, minutes: Number(d.minutes) || 0, metric: d.metric ?? null, metricLabel: d.metricLabel ?? '', focus: d.focus ?? '', notes: d.notes ?? '' };
  }
  if (entry.type === 'guitar') {
    return { area: 'Guitar', type: 'practice', minutes: Number(d.minutes) || 0, metric: d.best_bpm ?? null, metricLabel: 'Best BPM', focus: d.focus ?? '', notes: '' };
  }
  if (entry.type === 'study') {
    return { area: d.topic ?? '', type: d.kind === 'prep' ? 'study' : d.kind, minutes: Number(d.minutes) || 0, metric: null, metricLabel: '', focus: '', notes: d.notes ?? '' };
  }
  return null;
}

/** { minutes, focus, best_bpm } for a guitar entry or a Guitar-area session; else null. */
export function guitarView(entry) {
  const isG = entry?.type === 'guitar' || (entry?.type === 'session' && isGuitarArea(entry.data?.area));
  if (!isG) return null;
  const s = sessionOf(entry);
  return { minutes: s.minutes, focus: s.focus, best_bpm: s.metric };
}

/** "Guitar practice (30 min)" */
export function sessionLine(entry) {
  const s = sessionOf(entry);
  return s ? `${s.area} ${s.type} (${s.minutes} min)` : '';
}

const oneLine = (s) => String(s ?? '').replace(/[\r\n]+/g, ' ');

/** Markdown for session entries (not legacy ones), grouped by area; Guitar-area sessions are skipped. */
export function sessionsMarkdown(entries) {
  const groups = new Map();
  for (const e of entries) {
    if (e.type !== 'session' || isGuitarArea(e.data?.area)) continue;
    const s = sessionOf(e);
    const k = clean(s.area).toLowerCase();
    if (!groups.has(k)) groups.set(k, { area: oneLine(s.area), rows: [] });
    let line = `- ${s.type} (${s.minutes} min)`;
    if (s.focus) line += `, focus: ${oneLine(s.focus)}`;
    if (s.metric !== null && s.metric !== undefined) line += `, ${oneLine(s.metricLabel) || 'metric'}: ${s.metric}`;
    if (s.notes) line += ` - ${oneLine(s.notes)}`;
    groups.get(k).rows.push(line);
  }
  const out = [];
  for (const g of groups.values()) out.push(`## ${g.area}`, ...g.rows, '');
  return out;
}
