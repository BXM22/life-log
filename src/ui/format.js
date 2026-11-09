// Small display helpers shared by the screens.

export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** One-line text for an entry in a list. */
export function label(e) {
  if (e.type === 'weigh_in') return `${e.data.weight_lb} lb`;
  if (e.type === 'guitar') {
    const extra = [e.data.focus && e.data.focus !== 'practice' ? e.data.focus : '', e.data.best_bpm != null ? `${e.data.best_bpm} bpm` : '']
      .filter(Boolean).join(', ');
    return `Guitar ${e.data.minutes} min${extra ? ` (${extra})` : ''}`;
  }
  return `${e.data.habit} ${e.data.done ? 'done' : 'missed'}`;
}
