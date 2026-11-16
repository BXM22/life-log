// TODAY tab: habit summary, habits, today's session, weigh-in, guitar and the latest entries.
//   html:    todayView(state)
//   actions: data-action values handled in app.js (toggleHabit, addHabit, deleteHabit, logWeighIn, logGuitar, tab, demo)

import { isDirty } from '../logic/exportBuilder.js';
import { logicalDate } from '../logic/dates.js';
import { isChecked, isRestDay } from '../logic/habits.js';
import { streakWithStats } from '../logic/retainedStats.js';
import { liveEntries } from '../logic/entries.js';
import { sessionForDate } from '../logic/workout.js';
import { sessionById } from '../logic/template.js';
import { esc, label } from './format.js';
import { waiting } from './exportWipeView.js';
import { reminderBanner } from '../logic/exportReminder.js';
import { todayRows, todayWindow } from './todayWindows.js';
import { quickAddButton, quickAddSheet } from './quickAddView.js';

const today = (state) => logicalDate(Date.now(), state.dayStartHour);

function habitsPanel(state) {
  const day = today(state);
  const rows = state.habits.map((h) => {
    const streak = streakWithStats(state.entries, h.name, day, state.stats);
    return `<div class="habit">
      <label class="check"><input type="checkbox" data-action="toggleHabit" data-habit="${esc(h.id)}" ${isChecked(state.entries, h, day) ? 'checked' : ''}>
        <span>${esc(h.name)}${streak ? ` <span class="streak">${streak}d</span>` : ''}</span></label>
      <button class="btn secondary habit-del" data-action="deleteHabit" data-habit="${esc(h.id)}" aria-label="Remove ${esc(h.name)}">X</button>
    </div>`;
  }).join('');
  return `<div class="panel">
    <h2>HABITS ${esc(day.slice(5))}</h2>
    ${rows || '<p>No habits yet. Add one below.</p>'}
    <input id="habitName" class="field" maxlength="40" placeholder="New habit" autocomplete="off">
    <button class="btn" data-action="addHabit">ADD HABIT</button>
  </div>`;
}

function restButton(state) {
  const habit = state.habits.find((h) => h.id === 'workout');
  if (!habit) return '';
  const day = today(state);
  const rest = isRestDay(state.entries, habit, day);
  const real = isChecked(state.entries, habit, day) && !rest;
  if (real) return '';
  return `<button class="btn secondary" data-action="toggleRestDay">${rest ? 'UNDO REST DAY' : 'REST DAY'}</button>
    <p class="note">${rest ? 'Rest day logged. Your Workout streak keeps going.' : 'Marks today as rest so your Workout streak keeps going.'}</p>`;
}

function sessionPanel(state) {
  const id = sessionForDate(today(state), state.planDays);
  const s = id && sessionById(id);
  return `<div class="panel"><h2>TODAY'S SESSION</h2>
    <p>${s ? `${esc(s.name)}: ${esc(s.focus)}` : 'No lifting scheduled. BJJ, rest or a walk.'}</p>
    <button class="btn" data-tab="workout" data-action="tab">${s ? 'START WORKOUT' : 'PICK A WORKOUT'}</button>
    ${restButton(state)}</div>`;
}

export function todayView(state) {
  if (state.todayWin) return `${todayWindow(state, today(state))}${quickAddSheet(state)}`; // F49: Log, timer or Study window
  const recent = liveEntries(state.entries).sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt - a.updatedAt).slice(0, 8);
  const rows = recent.map((e) =>
    `<div class="row"><span>${esc(e.date.slice(5))} ${esc(label(e))}</span>` +
    `<span class="tag ${isDirty(e) ? 'waiting' : 'done'}">${isDirty(e) ? 'WAITING' : 'EXPORTED'}</span></div>`).join('');
  const day = today(state);
  const done = state.habits.filter((h) => isChecked(state.entries, h, day)).length;
  const total = state.habits.length;
  const cells = state.habits.map((h) => `<i class="${isChecked(state.entries, h, day) ? 'on' : ''}"></i>`).join('');
  const n = waiting(state);
  const note = state.storageLine;
  return `${reminderBanner(state)}
    <div class="panel hero">
      <div class="big">${done}/${total}</div>
      <p>habits done today</p>
      <div class="pips" aria-hidden="true">${cells}</div>
    </div>
    <button class="rowbtn" data-action="tab" data-tab="export">
      <span>${n ? `${n} waiting to export` : 'Everything exported'}</span><span class="chev" aria-hidden="true">&gt;</span>
    </button>
    ${note ? `<p class="note">${esc(note)}</p>` : ''}
    ${habitsPanel(state)}
    ${sessionPanel(state)}
    ${todayRows(state, day)}
    <div class="panel">
      <h2>LATEST</h2>${rows || '<p>No entries yet.</p>'}
      ${state.entries.length === 0 ? '<button class="btn secondary" data-action="demo">LOAD DEMO DATA</button>' : ''}
      <button class="btn secondary" data-tab="history" data-action="tab">EDIT OR DELETE ENTRIES</button>
    </div>
    ${quickAddButton()}${quickAddSheet(state)}`;
}
