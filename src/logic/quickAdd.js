// Quick add sheet (F36): one small form for the four things logged most. Pure: no storage, no clock.
import { newEntry, parseWeight, parseMeal, parseNote, defaultMealType } from './entries.js';
import { buildSession, sessionOf, SESSION_TYPES } from './sessions.js';

export const QUICK_KINDS = [['weight', 'WEIGHT'], ['meal', 'MEAL'], ['session', 'SESSION'], ['note', 'NOTE']];

// Fields per kind.
export const QUICK_FIELDS = {
  weight: [{ key: 'weight', label: 'Weight (lb)', type: 'number', placeholder: '172.4' }],
  meal: [
    { key: 'name', label: 'What you ate', type: 'text', placeholder: 'Chicken bowl' },
    { key: 'protein', label: 'Protein in grams (optional)', type: 'number', placeholder: '40' },
  ],
  // Session: 'select' and 'hidden' fields are rendered by quickAddView; `more` fields sit under 'More details'.
  session: [
    { key: 'area', label: 'Area', type: 'select' },
    { key: 'minutes', label: 'Minutes', type: 'number', placeholder: '30' },
    { key: 'type', label: 'Type', type: 'hidden' },
    { key: 'metricLabel', label: 'Metric label', type: 'hidden' },
    { key: 'metric', label: 'Metric (optional)', type: 'number', placeholder: 'Metric', more: true },
    { key: 'focus', label: 'Focus (optional)', type: 'text', placeholder: 'technique', more: true },
    { key: 'notes', label: 'Notes (optional)', type: 'text', placeholder: 'Anything to remember', more: true },
  ],
  note: [{ key: 'body', label: 'Note', type: 'textarea', placeholder: 'App ideas, anything' }],
};

export const QUICK_MINUTES = [15, 30, 45, 60];
export { SESSION_TYPES };
/** Select value for the "+ New area..." option of the Session form. Never an area name. */
export const NEW_AREA = '__new__';
export const DEFAULT_QUICK_AREAS = [{ name: 'Guitar' }, { name: 'Coding' }];

/** The user's areas ordered last used first (by newest session date, then creation time); unused keep their order. */
export function quickAreas(areas, entries) {
  const list = Array.isArray(areas) && areas.length ? areas : DEFAULT_QUICK_AREAS;
  const last = new Map();
  (entries || []).forEach((e, i) => {
    if (!e || e.deletedAt) return;
    const s = sessionOf(e);
    if (!s || !s.area) return;
    const k = `${e.date || ''}|${String(e.createdAt ?? '').padStart(16, '0')}|${String(i).padStart(8, '0')}`;
    const key = String(s.area).toLowerCase();
    if (!last.has(key) || last.get(key) < k) last.set(key, k);
  });
  const rank = (a) => last.get(String(a.name).toLowerCase()) ?? '';
  return list.map((a, i) => ({ a, i })).sort((x, y) => (rank(x.a) < rank(y.a) ? 1 : rank(x.a) > rank(y.a) ? -1 : x.i - y.i)).map((o) => o.a);
}

/** Build the entry for a quick add. Returns { entry, message } or { error }. `hour` picks the meal type. */
export function buildQuickEntry(kind, raw, date, now, hour = 12) {
  const v = raw || {};
  if (kind === 'weight') {
    const r = parseWeight(v.weight);
    return r.error ? r : { entry: newEntry('weigh_in', date, { weight_lb: r.value }, now), message: `Saved ${r.value} lb.` };
  }
  if (kind === 'meal') {
    const r = parseMeal({ mealType: defaultMealType(hour), name: v.name, protein: v.protein });
    return r.error ? r : { entry: newEntry('meal', date, r.data, now), message: `Saved ${r.data.mealType.toLowerCase()}: ${r.data.name}.` };
  }
  if (kind === 'session') {
    return buildSession({ area: v.area, type: v.type || 'practice', minutes: v.minutes, metric: v.metric === '' ? null : v.metric, metricLabel: v.metricLabel || '', focus: v.focus || '', notes: v.notes || '' }, date, now);
  }
  if (kind === 'note') {
    const r = parseNote({ title: '', body: v.body });
    return r.error ? r : { entry: newEntry('note', date, r.data, now), message: 'Note saved.' };
  }
  return { error: 'Pick what to add.' };
}
