// Log window (Today v2, F68): weigh-in and meals. Guitar lives in the Learn window.
//   html:    logWindow(state, day)
//   state:   weighEdit (bool, shows the field again after a save), mealType (see mealView.js)
//   actions: logWeighIn, changeWeigh, logMeal, pickMeal, closeTodayWin, openTodayWin
import { esc } from './format.js';
import { mealPanel } from './mealView.js';
import { winHeader, winSection } from './winParts.js';
import { lastWeighIn } from '../logic/logWin.js';
import { liveEntries } from '../logic/entries.js';

const FULL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const parts = (iso) => { const [y, m, d] = iso.split('-').map(Number); return { dow: FULL_DAYS[new Date(y, m - 1, d).getDay()], label: `${MONTHS[m - 1]} ${d}` }; };

const CHECK = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>';

function weighSection(state, day) {
  const last = lastWeighIn(state.entries);
  const status = last ? `Last: ${last.weight} lb, ${parts(last.date).dow}` : '';
  const saved = liveEntries(state.entries || []).filter((e) => e.type === 'weigh_in' && e.date === day && e.data && e.data.weight_lb != null)
    .sort((a, b) => b.updatedAt - a.updatedAt)[0];
  const body = saved && !state.weighEdit
    ? `<div class="win-row win-log-saved"><span class="win-log-savedtext">${CHECK}<span>${esc(saved.data.weight_lb)} lb saved for today</span></span><button class="win-log-change" data-action="changeWeigh">Change</button></div>`
    : `<div class="win-field"><label for="wt">Weight in pounds</label>
        <div class="win-log-weighrow">
          <input id="wt" class="field" type="number" inputmode="decimal" step="0.1" min="50" max="600" placeholder="182.4">
          <button class="win-log-save" data-action="logWeighIn">Save</button>
        </div></div>`;
  return winSection({ title: 'Weigh-in', status, body });
}

export function logWindow(state, day) {
  const p = parts(day);
  return `${winHeader({ title: 'Log', summary: `Your weight and meals for ${p.dow}, ${p.label}.` })}
    ${weighSection(state, day)}
    ${mealPanel(state, day)}
    <button class="win-log-learn" data-action="openTodayWin" data-win="learn">Guitar and the practice timer are in Learn</button>`;
}
