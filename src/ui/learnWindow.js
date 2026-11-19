// Interim Learn window on Today (until the real Learn window): guitar log, study log, timer panel while running.
//   html:    learnWindow(state, day)
//   actions: closeTodayWin, logGuitar, openTimer, logStudy

import { practicePanel } from './practiceView.js';
import { studyPanel } from './studyView.js';

const BACK = '<button class="back-link" data-action="closeTodayWin" aria-label="Back to Today"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>';

const FOCUSES = '<datalist id="focuses"><option value="technique"><option value="songs"><option value="theory"><option value="improvisation"></datalist>';

export function learnWindow(state, day) {
  const running = state.practice && state.practice.startAt != null;
  return `<div class="backrow">${BACK}</div>
    <h2 class="subtitle">Learn</h2>
    ${running ? practicePanel(state) : ''}
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
    ${studyPanel(state, day)}`;
}
