// Small display helpers shared by the screens.

import { setText } from '../logic/workout.js';

export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** Streak text for a habit row: "14 days", "1 day", or "" when there is no streak. */
export const streakText = (n) => (n > 0 ? `${n} ${n === 1 ? 'day' : 'days'}` : '');

/** One-line text for an entry in a list. */
export function label(e) {
  if (e.type === 'weigh_in') return `${e.data.weight_lb} lb`;
  if (e.type === 'guitar') {
    const extra = [e.data.focus && e.data.focus !== 'practice' ? e.data.focus : '', e.data.best_bpm != null ? `${e.data.best_bpm} bpm` : '']
      .filter(Boolean).join(', ');
    return `Guitar ${e.data.minutes} min${extra ? ` (${extra})` : ''}`;
  }
  if (e.type === 'session') {
    const d = e.data || {};
    const kind = { practice: 'practice', study: 'study', project: 'project', review: 'review' }[d.type] || 'practice';
    const extra = [d.focus, d.metric != null ? `${d.metricLabel ? `${d.metricLabel} ` : ''}${d.metric}` : ''].filter(Boolean).join(', ');
    return `${d.area} ${kind}, ${d.minutes} min${extra ? ` (${extra})` : ''}`;
  }
  if (e.type === 'meal') return `${e.data.mealType}: ${e.data.name}${e.data.protein_g != null ? ` (${e.data.protein_g} g protein)` : ''}`;
  if (e.type === 'study') return `Kumio ${e.data.kind}: ${e.data.topic} (${e.data.minutes} min)`;
  if (e.type === 'note') return `Note: ${(e.data.title || String(e.data.body).split('\n')[0]).slice(0, 40)}`;
  if (e.type === 'lift_set') return `${e.data.exercise} ${e.data.kind === 'warmup' ? '(warm-up) ' : ''}${setText(e.data)}`;
  return `${e.data.habit} ${e.data.done ? (e.data.rest ? 'rest day' : 'done') : 'missed'}`;
}
