// TODAY tab windows (F49): Log (weigh-in, meals), Learn (areas), Notes, and the practice timer.
// Views over existing state and actions; saving is done by logWeighIn, logGuitar, logMeal, logStudy and logNote.
//   html:    todayRows(state, day), todayWindow(state, day)
//   actions: openTodayWin | closeTodayWin | openTimer (see todayWinActions.js)

import { esc } from './format.js';
import { practicePanel } from './practiceView.js';
import { logWindow } from './logWindow.js';
import { notesWindow } from './notesWindow.js';
import { learnView } from './learnView.js';
import { logSummary, learnSummary, notesSummary } from '../logic/todayWin.js';

const backButton = (action, label) =>
  `<button class="back-link" data-action="${action}" aria-label="${label}"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>`;

/** The three summary rows on Today (LOG, LEARN, NOTES). */
export function todayRows(state, day) {
  const running = Boolean(state.practice && state.practice.startAt != null);
  const row = (win, title, text) => `<button class="rowbtn winrow" data-action="openTodayWin" data-win="${win}">
    <span><small class="winrow-k">${title}</small><span class="winrow-v">${esc(text)}</span></span><span class="chev" aria-hidden="true">&gt;</span></button>`;
  return row('log', 'LOG', logSummary(state.entries, day))
    + row('learn', 'LEARN', learnSummary(state.entries, day, running))
    + row('notes', 'NOTES', notesSummary(state.entries));
}

const FOCUSES = '<datalist id="focuses"><option value="technique"><option value="songs"><option value="theory"><option value="improvisation"></datalist>';

function timerWindow(state) {
  return `<div class="backrow">${backButton('closeTodayWin', 'Back to Learn')}</div>
    <h2 class="subtitle">Practice timer</h2>${FOCUSES}
    ${practicePanel(state)}`;
}

export function todayWindow(state, day) {
  if (state.todayWin === 'log') return logWindow(state, day);
  if (state.todayWin === 'timer') return timerWindow(state);
  if (state.todayWin === 'learn') return learnView(state, day);
  if (state.todayWin === 'notes') return notesWindow(state);
  return '';
}
