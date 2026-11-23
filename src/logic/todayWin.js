// Which Today window is open (F49) and the Today summaries. Pure. state.todayWin is null | 'log' | 'learn' | 'notes'.
import { liveEntries, dayProtein, PROTEIN_TARGET } from './entries.js';
import { isDirty } from './exportBuilder.js';
import { dayStudyMinutes } from './study.js';
import { sessionOf, guitarView } from './sessions.js';

export const TODAY_WINDOWS = ['log', 'learn', 'notes'];

/** A safe window value: anything unknown means no window. */
export const normalizeWin = (v) => (TODAY_WINDOWS.includes(v) ? v : null);

/** Where Back goes from a window. */
export const parentWin = (_win) => null;

/** Summary for the Guitar row. */
export function guitarSummary(entries, date) {
  const mins = liveEntries(entries).filter((e) => e.date === date && guitarView(e))
    .reduce((n, e) => n + (Number(guitarView(e).minutes) || 0), 0);
  return mins ? `${mins} min today` : 'Start a practice session';
}

/** Summary for the Study row: "45 min today, 1 note". */
export function studySummary(entries, date) {
  const sessionMins = liveEntries(entries).filter((e) => e.type === 'session' && e.date === date && !guitarView(e))
    .reduce((n, e) => n + (Number(e.data?.minutes) || 0), 0);
  const mins = dayStudyMinutes(entries, date) + sessionMins;
  const notes = liveEntries(entries).filter((e) => e.type === 'note').length;
  return `${mins} min today, ${notes} note${notes === 1 ? '' : 's'}`;
}

/** Habits hero heading: "2 of 3 habits done". */
export const habitsHeader = (done, total) => `${done} of ${total} habits done`;

/** Recent row count: "8 entries". */
export const recentHeader = (n) => `${n} ${n === 1 ? 'entry' : 'entries'}`;

/** Log row: "182.4 lb, 85 of 160 g protein"; an action when nothing is logged. */
export function logSummary(entries, date) {
  const w = liveEntries(entries).filter((e) => e.type === 'weigh_in')
    .sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt - a.updatedAt)[0];
  const weight = w && Number.isFinite(Number(w.data?.weight_lb)) ? `${Number(w.data.weight_lb)} lb` : '';
  const protein = dayProtein(entries, date);
  if (!weight && !protein) return "Add today's weight and meals";
  const p = `${protein} of ${PROTEIN_TARGET} g protein`;
  return weight ? `${weight}, ${p}` : p;
}

/** Learn row: "45 min today: Guitar, Coding". `running` is true or a label like "Guitar 12:41". */
export function learnSummary(entries, date, running = false) {
  if (running) return typeof running === 'string' ? `Timer running: ${running}` : 'Timer running';
  const areas = [];
  let mins = 0;
  for (const e of liveEntries(entries)) {
    if (e.date !== date) continue;
    const s = sessionOf(e);
    if (!s) continue;
    const area = s.area || (e.type === 'study' ? 'Study' : 'Session');
    mins += Number(s.minutes) || 0;
    if (!areas.includes(area)) areas.push(area);
  }
  return mins ? `${mins} min today: ${areas.join(', ')}` : 'Start a practice or study session';
}

/** Notes row: "2 notes waiting for the vault", or an action. */
export function notesSummary(entries) {
  const n = liveEntries(entries).filter((e) => e.type === 'note' && isDirty(e)).length;
  return n ? `${n} note${n === 1 ? '' : 's'} waiting for the vault` : 'Write down an idea';
}
