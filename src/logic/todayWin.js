// Which Today window is open (F49). Pure. state.todayWin is null | 'log' | 'learn' | 'notes' | 'timer'.
// 'learn' is the interim Learn window (guitar, study); 'timer' is the practice timer opened from it, and Back returns to Learn.
import { liveEntries, dayProtein, PROTEIN_TARGET } from './entries.js';
import { isDirty } from './exportBuilder.js';
import { dayStudyMinutes } from './study.js';

export const TODAY_WINDOWS = ['log', 'learn', 'notes', 'timer'];

/** A safe window value: anything unknown means no window. */
export const normalizeWin = (v) => (TODAY_WINDOWS.includes(v) ? v : null);

/** Where Back goes from a window. */
export const parentWin = (win) => (win === 'timer' ? 'learn' : null);

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

/** Habits accordion header: "HABITS · 2 OF 3". */
export const habitsHeader = (done, total) => `HABITS · ${done} OF ${total}`;

/** Recent accordion header: "RECENT · 8 ENTRIES". */
export const recentHeader = (n) => `RECENT · ${n} ${n === 1 ? 'ENTRY' : 'ENTRIES'}`;

/** LOG row: latest weight and today's protein, e.g. "182.4 lb · Protein 85 / 160 g". */
export function logSummary(entries, date) {
  const w = liveEntries(entries).filter((e) => e.type === 'weigh_in')
    .sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt - a.updatedAt)[0];
  const weight = w && Number.isFinite(Number(w.data?.weight_lb)) ? `${Number(w.data.weight_lb)} lb` : 'No weight yet';
  return `${weight} · Protein ${dayProtein(entries, date)} / ${PROTEIN_TARGET} g`;
}

/** LEARN row: minutes today and the areas, e.g. "45 min today · Guitar, Coding". */
export function learnSummary(entries, date, running = false) {
  if (running) return 'Timer running';
  const areas = [];
  let mins = 0;
  for (const e of liveEntries(entries)) {
    if (e.date !== date) continue;
    let area = null;
    if (e.type === 'guitar') area = 'Guitar';
    else if (e.type === 'study') area = e.data?.topic || 'Study';
    if (!area) continue;
    mins += Number(e.data?.minutes) || 0;
    if (!areas.includes(area)) areas.push(area);
  }
  return mins ? `${mins} min today · ${areas.join(', ')}` : 'Nothing logged yet';
}

/** NOTES row: "2 waiting for the vault", or "No notes waiting". */
export function notesSummary(entries) {
  const n = liveEntries(entries).filter((e) => e.type === 'note' && isDirty(e)).length;
  return n ? `${n} waiting for the vault` : 'No notes waiting';
}
