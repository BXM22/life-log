// TODAY tab: habit summary, habits, today's session, weigh-in, guitar and the latest entries.
//   html:    todayView(state)
//   actions: data-action values handled in app.js (toggleHabit, addHabit, deleteHabit, logWeighIn, logGuitar, tab, demo)

import { isDirty } from '../logic/exportBuilder.js';
import { logicalDate } from '../logic/dates.js';
import { isChecked } from '../logic/habits.js';
import { streakWithStats } from '../logic/retainedStats.js';
import { liveEntries } from '../logic/entries.js';
import { sessionForDate } from '../logic/workout.js';
import { sessionById } from '../logic/template.js';
import { esc, label } from './format.js';
import { waiting } from './exportWipeView.js';
import { mealPanel } from './mealView.js';
import { notesPanel } from './notesView.js';
import { practicePanel } from './practiceView.js';
import { studyPanel } from './studyView.js';

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

function sessionPanel(state) {
  const id = sessionForDate(today(state), state.planDays);
  const s = id && sessionById(id);
  return `<div class="panel"><h2>TODAY'S SESSION</h2>
    <p>${s ? `${esc(s.name)}: ${esc(s.focus)}` : 'No lifting scheduled. BJJ, rest or a walk.'}</p>
    <button class="btn" data-tab="workout" data-action="tab">${s ? 'START WORKOUT' : 'PICK A WORKOUT'}</button></div>`;
}

export function todayView(state) {
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
  return `
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
      <datalist id="focuses"><option value="technique"><option value="songs"><option value="theory"><option value="improvisation"></datalist>
      <button class="btn" data-action="logGuitar">SAVE GUITAR</button>
    </div>
    ${practicePanel(state)}
    ${studyPanel(state, day)}
    ${mealPanel(state, day)}
    ${notesPanel(state)}
    <div class="panel">
      <h2>LATEST</h2>${rows || '<p>No entries yet.</p>'}
      ${state.entries.length === 0 ? '<button class="btn secondary" data-action="demo">LOAD DEMO DATA</button>' : ''}
      <button class="btn secondary" data-tab="history" data-action="tab">EDIT OR DELETE ENTRIES</button>
    </div>`;
}
