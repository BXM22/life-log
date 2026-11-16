// Which Today window is open (F49). Pure. state.todayWin is null | 'log' | 'timer' | 'study'.
// 'timer' is the practice timer opened from the Log window; Back from it returns to Log.
import { liveEntries } from './entries.js';
import { dayStudyMinutes } from './study.js';

export const TODAY_WINDOWS = ['log', 'timer', 'study'];

/** A safe window value: anything unknown means no window. */
export const normalizeWin = (v) => (TODAY_WINDOWS.includes(v) ? v : null);

/** Where Back goes from a window. */
export const parentWin = (win) => (win === 'timer' ? 'log' : null);

/** Row summary for Today's Guitar log row. */
export function guitarSummary(entries, date) {
  const mins = liveEntries(entries).filter((e) => e.type === 'guitar' && e.date === date)
    .reduce((n, e) => n + (Number(e.data?.minutes) || 0), 0);
  return mins ? `${mins} min today` : 'Nothing logged yet';
}

/** Row summary for Today's Study row. */
export function studySummary(entries, date) {
  const mins = dayStudyMinutes(entries, date);
  const notes = liveEntries(entries).filter((e) => e.type === 'note').length;
  return `${mins} min today · ${notes} note${notes === 1 ? '' : 's'}`;
}
