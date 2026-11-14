// Small display helpers shared by the screens.

import { setText } from '../logic/workout.js';

export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** One-line text for an entry in a list. */
export function label(e) {
  if (e.type === 'weigh_in') return `${e.data.weight_lb} lb`;
  if (e.type === 'guitar') {
    const extra = [e.data.focus && e.data.focus !== 'practice' ? e.data.focus : '', e.data.best_bpm != null ? `${e.data.best_bpm} bpm` : '']
      .filter(Boolean).join(', ');
    return `Guitar ${e.data.minutes} min${extra ? ` (${extra})` : ''}`;
  }
  if (e.type === 'meal') return `${e.data.mealType}: ${e.data.name}${e.data.protein_g != null ? ` (${e.data.protein_g} g protein)` : ''}`;
  if (e.type === 'study') return `Kumio ${e.data.kind}: ${e.data.topic} (${e.data.minutes} min)`;
  if (e.type === 'note') return `Note: ${(e.data.title || String(e.data.body).split('\n')[0]).slice(0, 40)}`;
  if (e.type === 'lift_set') return `${e.data.exercise} ${e.data.kind === 'warmup' ? '(warm-up) ' : ''}${setText(e.data)}`;
  return `${e.data.habit} ${e.data.done ? 'done' : 'missed'}`;
}
