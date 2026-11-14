// PRACTICE TIMER panel on the TODAY tab (F12). Sits under the guitar form.
//   html:    practicePanel(state)
//   actions: data-action="practiceStart" | "practiceStop" | "practiceDiscard" (see practiceActions.js)

import { clock, elapsedSeconds, practiceMinutes } from '../logic/practiceTimer.js';
import { esc } from './format.js';

export function practicePanel(state) {
  const p = state.practice;
  if (p && p.startAt != null) {
    const secs = elapsedSeconds(p, Date.now());
    return `<div class="panel">
      <h2>PRACTICE TIMER</h2>
      <div class="big" id="practice-time" role="timer">${clock(secs)}</div>
      <p class="note">Practising${p.focus ? `: ${esc(p.focus)}` : ''}. Stopping logs ${practiceMinutes(secs)} min of guitar.</p>
      <label class="lbl" for="pt-bpm">Best BPM (optional)</label>
      <input id="pt-bpm" class="field" type="number" inputmode="numeric" step="1" placeholder="90">
      <button class="btn" data-action="practiceStop">STOP AND LOG</button>
      <button class="btn secondary" data-action="practiceDiscard">DISCARD</button>
    </div>`;
  }
  return `<div class="panel">
    <h2>PRACTICE TIMER</h2>
    <label class="lbl" for="pt-focus">Focus (optional)</label>
    <input id="pt-focus" class="field" maxlength="40" list="focuses" placeholder="technique" autocomplete="off">
    <button class="btn" data-action="practiceStart">START PRACTICE</button>
  </div>`;
}
