// TODAY tab (v2): hero, sync row, today's session, Habits drop-down, Log/Learn/Notes rows, Recent drop-down.
//   html:    todayView(state)
//   actions: toggleHabit, toggleRestDay, toggleSection, openManageHabits, openTodayWin, tab, demo (app.js / todayActions.js)

import { isDirty } from '../logic/exportBuilder.js';
import { logicalDate } from '../logic/dates.js';
import { isChecked, isRestDay } from '../logic/habits.js';
import { streakWithStats } from '../logic/retainedStats.js';
import { liveEntries } from '../logic/entries.js';
import { sessionForDate } from '../logic/workout.js';
import { sessionById } from '../logic/template.js';
import { habitsHeader, recentHeader } from '../logic/todayWin.js';
import { esc, label } from './format.js';
import { todayRows, todayWindow } from './todayWindows.js';
import { quickAddButton, quickAddSheet } from './quickAddView.js';
import { syncRowHtml } from './syncChip.js';
import { manageHabitsSheet } from './manageHabitsView.js';

const today = (state) => logicalDate(Date.now(), state.dayStartHour);

const chevron = '<svg class="acc-chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';

/** Cream panel with a 56px header button; body shown only when open. Session-only state in state.todaySections. */
function accordion(state, key, title, body) {
  const open = (state.todaySections || { habits: true, recent: false })[key] ?? key === 'habits';
  return `<div class="panel acc${open ? ' open' : ''}">
    <button class="acc-head" data-action="toggleSection" data-section="${key}" aria-expanded="${open}" aria-controls="acc-${key}">
      <h2>${esc(title)}</h2>${chevron}</button>
    ${open ? `<div class="acc-body" id="acc-${key}">${body}</div>` : ''}
  </div>`;
}

function habitsBody(state, day) {
  const rows = state.habits.map((h) => {
    const streak = streakWithStats(state.entries, h.name, day, state.stats);
    return `<div class="habit"><label class="check"><input type="checkbox" data-action="toggleHabit" data-habit="${esc(h.id)}" ${isChecked(state.entries, h, day) ? 'checked' : ''}>
      <span>${esc(h.name)}</span></label>${streak ? `<span class="streak">${streak}d</span>` : ''}</div>`;
  }).join('');
  return `${rows || '<p class="note">No habits yet. Add one in Manage habits.</p>'}
    <button class="rowbtn acc-manage" data-action="openManageHabits"><span>Manage habits</span><span class="chev" aria-hidden="true">&gt;</span></button>`;
}

function restButton(state) {
  const habit = state.habits.find((h) => h.id === 'workout');
  if (!habit) return '';
  const day = today(state);
  const rest = isRestDay(state.entries, habit, day);
  if (isChecked(state.entries, habit, day) && !rest) return '';
  return `<button class="btn secondary" data-action="toggleRestDay">${rest ? 'Undo rest day' : 'Mark as rest day'}</button>`;
}

function sessionPanel(state) {
  const id = sessionForDate(today(state), state.planDays);
  const s = id && sessionById(id);
  return `<div class="panel"><h2>TODAY'S SESSION</h2>
    <p>${s ? `<b>${esc(s.name)}</b><br>${esc(s.focus)}` : 'No lifting scheduled. BJJ, rest or a walk.'}</p>
    <button class="btn" data-tab="workout" data-action="tab">${s ? 'START WORKOUT' : 'PICK A WORKOUT'}</button>
    ${restButton(state)}</div>`;
}

function recentBody(recent) {
  const rows = recent.slice(0, 4).map((e) =>
    `<div class="row"><span>${esc(e.date.slice(5))} ${esc(label(e))}</span>` +
    `<span class="tag ${isDirty(e) ? 'waiting' : 'done'}">${isDirty(e) ? 'WAITING' : 'EXPORTED'}</span></div>`).join('');
  if (!rows) return '<p class="note">No entries yet.</p><button class="btn secondary" data-action="demo">LOAD DEMO DATA</button>';
  return `${rows}<button class="btn secondary" data-tab="history" data-action="tab">Edit or delete entries in History</button>`;
}

export function todayView(state) {
  if (state.todayWin) return `${todayWindow(state, today(state))}${quickAddSheet(state)}`; // Log, timer or Study window
  const day = today(state);
  const recent = liveEntries(state.entries).sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt - a.updatedAt);
  const done = state.habits.filter((h) => isChecked(state.entries, h, day)).length;
  const total = state.habits.length;
  const cells = state.habits.map((h) => `<i class="${isChecked(state.entries, h, day) ? 'on' : ''}"></i>`).join('');
  const note = state.storageLine;
  return `<div class="panel hero">
      <div class="big">${done}/${total}</div>
      <p>habits done today</p>
      <div class="pips" aria-hidden="true">${cells}</div>
    </div>
    ${syncRowHtml(state)}
    ${note ? `<p class="note">${esc(note)}</p>` : ''}
    ${sessionPanel(state)}
    ${accordion(state, 'habits', habitsHeader(done, total), habitsBody(state, day))}
    ${todayRows(state, day)}
    ${accordion(state, 'recent', recentHeader(recent.length), recentBody(recent))}
    ${quickAddButton()}${quickAddSheet(state)}${manageHabitsSheet(state)}`;
}
