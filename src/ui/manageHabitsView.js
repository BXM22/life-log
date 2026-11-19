// Manage habits sheet (Today v2). Reuses the quick add sheet classes (qa-scrim, qa-sheet, qa-head, qa-close).
//   html:    manageHabitsSheet(state)  -> '' unless state.manageHabits === true
//   actions: openManageHabits, closeManageHabits (manageHabitsActions.js); addHabit / deleteHabit live in app.js

import { esc } from './format.js';

function habitRow(h) {
  return `<div class="row"><span>${esc(h.name)}</span>
    <button class="btn secondary" data-action="deleteHabit" data-habit="${esc(h.id)}" aria-label="Remove ${esc(h.name)}">Remove</button></div>`;
}

export function manageHabitsSheet(state) {
  if (state.manageHabits !== true) return '';
  const habits = state.habits || [];
  const list = habits.length ? habits.map(habitRow).join('') : '<p class="muted">No habits yet.</p>';
  return `<div class="qa-scrim" data-action="closeManageHabits"></div>
    <div class="qa-sheet" role="dialog" aria-modal="true" aria-label="Manage habits">
      <div class="qa-head"><h2>MANAGE HABITS</h2><button class="btn secondary qa-close" data-action="closeManageHabits" aria-label="Close">X</button></div>
      ${list}
      <label class="lbl" for="habitName">New habit</label>
      <input id="habitName" class="field" type="text" maxlength="40" autocomplete="off" placeholder="e.g. Stretch 10 min">
      <button class="btn" data-action="addHabit">ADD HABIT</button>
    </div>`;
}
