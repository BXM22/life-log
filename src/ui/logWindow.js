// Trimmed Log window (Today v2): weigh-in and meals. Guitar lives in the Learn window.
//   html:    logWindow(state, day)
//   actions: logWeighIn, logMeal, closeTodayWin, openTodayWin
import { esc } from './format.js';
import { mealPanel } from './mealView.js';
import { lastWeighIn } from '../logic/logWin.js';

const backButton = (action, label) =>
  `<button class="back-link" data-action="${action}" aria-label="${label}"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>`;

export function logWindow(state, day) {
  const last = lastWeighIn(state.entries);
  const hint = last ? `<p class="note">Last: ${esc(last.weight)} lb, ${last.weekday}</p>` : '';
  return `<div class="backrow">${backButton('closeTodayWin', 'Back to Today')}</div>
    <h2 class="subtitle">Log</h2>
    <div class="panel">
      <h2>WEIGH-IN</h2>
      <div class="inline">
        <input id="wt" class="field" type="number" inputmode="decimal" step="0.1" placeholder="Weight (lb)" aria-label="Weight in pounds">
        <button class="btn" data-action="logWeighIn">SAVE</button>
      </div>
      ${hint}
    </div>
    ${mealPanel(state, day)}
    <button class="rowbtn" data-action="openTodayWin" data-win="learn">Guitar timer moved to Learn</button>`;
}
