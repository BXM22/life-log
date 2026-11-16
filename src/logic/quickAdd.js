// Quick add sheet (F36): one small form for the five things logged most. Pure: no storage, no clock.
import { newEntry, parseWeight, parseGuitar, parseMeal, parseNote, defaultMealType } from './entries.js';
import { parseStudy } from './study.js';

export const QUICK_KINDS = [['weight', 'WEIGHT'], ['meal', 'MEAL'], ['guitar', 'GUITAR'], ['study', 'STUDY'], ['note', 'NOTE']];

// Fields per kind.
export const QUICK_FIELDS = {
  weight: [{ key: 'weight', label: 'Weight (lb)', type: 'number', placeholder: '172.4' }],
  meal: [
    { key: 'name', label: 'What you ate', type: 'text', placeholder: 'Chicken bowl' },
    { key: 'protein', label: 'Protein in grams (optional)', type: 'number', placeholder: '40' },
  ],
  guitar: [
    { key: 'minutes', label: 'Minutes', type: 'number', placeholder: '30' },
    { key: 'focus', label: 'Focus (optional)', type: 'text', placeholder: 'technique' },
  ],
  study: [
    { key: 'topic', label: 'Topic', type: 'text', placeholder: 'Contracts, chapter 3' },
    { key: 'minutes', label: 'Minutes', type: 'number', placeholder: '45' },
  ],
  note: [{ key: 'body', label: 'Note', type: 'textarea', placeholder: 'App ideas, anything' }],
};

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
  if (kind === 'guitar') {
    const r = parseGuitar({ minutes: v.minutes, focus: v.focus, bpm: '' });
    return r.error ? r : { entry: newEntry('guitar', date, r.data, now), message: `Saved ${r.data.minutes} min of guitar.` };
  }
  if (kind === 'study') {
    const r = parseStudy({ kind: 'study', topic: v.topic, minutes: v.minutes, notes: '' });
    return r.error ? r : { entry: newEntry('study', date, r.data, now), message: `Saved ${r.data.minutes} min of study.` };
  }
  if (kind === 'note') {
    const r = parseNote({ title: '', body: v.body });
    return r.error ? r : { entry: newEntry('note', date, r.data, now), message: 'Note saved.' };
  }
  return { error: 'Pick what to add.' };
}
