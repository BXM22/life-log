// TODAY tab windows (F49): Log (weigh-in, guitar, meals), the practice timer, and Study and notes.
// Views over existing state and actions; saving is done by logWeighIn, logGuitar, logMeal, logStudy and logNote.
//   html:    todayRows(state, day), todayWindow(state, day)
//   actions: openTodayWin | closeTodayWin | openTimer (see todayWinActions.js)

import { esc } from './format.js';
import { mealPanel } from './mealView.js';
import { notesPanel } from './notesView.js';
import { practicePanel } from './practiceView.js';
import { studyPanel } from './studyView.js';
import { guitarSummary, studySummary } from '../logic/todayWin.js';

const backButton = (action, label) =>
  `<button class="back-link" data-action="${action}" aria-label="${label}"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>`;

const FOCUSES = '<datalist id="focuses"><option value="technique"><option value="songs"><option value="theory"><option value="improvisation"></datalist>';

/** The two rows on Today that open a window. */
export function todayRows(state, day) {
  const running = state.practice && state.practice.startAt != null;
  const row = (win, title, text) => `<button class="rowbtn winrow" data-action="openTodayWin" data-win="${win}">
    <span><small class="winrow-k">${title}</small><span class="winrow-v">${esc(text)}</span></span><span class="chev" aria-hidden="true">&gt;</span></button>`;
  return row('log', 'LOG', running ? 'Practice timer running' : `Guitar: ${guitarSummary(state.entries, day)}`)
    + row('study', 'STUDY', studySummary(state.entries, day));
}

function logWindow(state, day) {
  return `<div class="backrow">${backButton('closeTodayWin', 'Back to Today')}</div>
    <h2 class="subtitle">Log</h2>
    <div class="panel">
      <h2>WEIGH-IN</h2>
      <div class="inline">
        <input id="wt" class="field" type="number" inputmode="decimal" step="0.1" placeholder="Weight (lb)" aria-label="Weight in pounds">
        <button class="btn" data-action="logWeighIn">SAVE</button>
      </div>
    </div>
    <div class="panel">
      <h2>GUITAR</h2>
      <div class="inline">
        <input id="gm" class="field" type="number" inputmode="numeric" step="1" placeholder="Minutes" aria-label="Guitar minutes">
        <input id="gb" class="field" type="number" inputmode="numeric" step="1" placeholder="Best BPM" aria-label="Best BPM, optional">
      </div>
      <input id="gf" class="field" maxlength="40" list="focuses" placeholder="Focus (optional)" aria-label="Focus, optional" autocomplete="off">
      ${FOCUSES}
      <div class="inline">
        <button class="btn" data-action="logGuitar">SAVE GUITAR</button>
        <button class="btn secondary" data-action="openTimer">START TIMER</button>
      </div>
    </div>
    ${mealPanel(state, day)}`;
}

function timerWindow(state) {
  return `<div class="backrow">${backButton('closeTodayWin', 'Back to Log')}</div>
    <h2 class="subtitle">Practice timer</h2>${FOCUSES}
    ${practicePanel(state)}`;
}

function studyWindow(state, day) {
  return `<div class="backrow">${backButton('closeTodayWin', 'Back to Today')}</div>
    <h2 class="subtitle">Study and notes</h2>
    ${studyPanel(state, day)}
    ${notesPanel(state)}`;
}

export function todayWindow(state, day) {
  if (state.todayWin === 'log') return logWindow(state, day);
  if (state.todayWin === 'timer') return timerWindow(state);
  if (state.todayWin === 'study') return studyWindow(state, day);
  return '';
}
