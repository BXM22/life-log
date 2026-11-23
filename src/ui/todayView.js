// TODAY tab (F65 layout): habits hero, workout card, sync notice, Log/Learn/Notes panel, Recent row.
//   html:    todayView(state)
//   actions: toggleHabit, toggleRestDay, openManageHabits, openTodayWin, wSheetOpen, wSessionClear, syncNow, tab, demo

import { logicalDate } from '../logic/dates.js';
import { isChecked, isRestDay } from '../logic/habits.js';
import { streakWithStats } from '../logic/retainedStats.js';
import { liveEntries } from '../logic/entries.js';
import * as workout from '../logic/workout.js';
import * as syncStatus from '../logic/syncStatus.js';
import { sessionById } from '../logic/template.js';
import { habitsHeader, recentHeader, logSummary, learnSummary, notesSummary } from '../logic/todayWin.js';
import { esc, streakText } from './format.js';
import { chevronRight, swapIcon } from './icons.js';
import { todayWindow } from './todayWindows.js';
import { quickAddButton, quickAddSheet } from './quickAddView.js';
import { manageHabitsSheet } from './manageHabitsView.js';
import { sheetLayer } from './workoutSheets.js';

const today = (state) => logicalDate(Date.now(), state.dayStartHour);
const SWITCH = 'data-action="wSheetOpen" data-sheet="switch"';

function habitsHero(state, day, scheduled) {
  const done = state.habits.filter((h) => isChecked(state.entries, h, day)).length;
  const rows = state.habits.map((h) => {
    const checked = isChecked(state.entries, h, day);
    const streak = streakText(streakWithStats(state.entries, h.name, day, state.stats));
    const after = h.id === 'workout' && !checked && scheduled;
    const right = after ? 'After your workout' : streak;
    return `<div class="habit"><label class="check"><input type="checkbox" data-action="toggleHabit" data-habit="${esc(h.id)}" ${checked ? 'checked' : ''}>
      <span>${esc(h.name)}</span></label>${right ? `<span class="streak">${esc(right)}</span>` : ''}</div>`;
  }).join('');
  const manage = `<button class="hero-manage" data-action="openManageHabits"><span>Manage habits</span>${chevronRight}</button>`;
  if (!rows) return `<div class="panel hero"><h2 class="hero-title">No habits yet.</h2>${manage}</div>`;
  return `<div class="panel hero"><h2 class="hero-title">${esc(habitsHeader(done, state.habits.length))}</h2>${rows}${manage}</div>`;
}

function restButton(state) {
  const habit = state.habits.find((h) => h.id === 'workout');
  if (!habit) return '';
  const day = today(state);
  const rest = isRestDay(state.entries, habit, day);
  if (isChecked(state.entries, habit, day) && !rest) return '';
  return `<button class="btn secondary" data-action="toggleRestDay">${rest ? 'Undo rest day' : 'Rest day'}</button>`;
}

function workoutCard(state, s) {
  const from = typeof workout.switchedFrom === 'function' ? workout.switchedFrom(state) : null;
  if (!s) {
    return `<div class="panel wcard"><p class="wcard-k">Today's workout</p>
      <p class="wcard-focus">No lifting scheduled. BJJ, rest or a walk.</p>
      <div class="wcard-btns"><button class="btn" ${SWITCH}>Pick a workout</button>${restButton(state)}</div></div>`;
  }
  return `<div class="panel wcard"><div class="wcard-top"><div><p class="wcard-k">Today's workout</p><h2 class="wcard-name">${esc(s.name)}</h2></div>
      <button class="btn secondary wcard-switch" ${SWITCH}>${swapIcon}<span>Switch</span></button></div>
    <p class="wcard-focus">${esc(s.focus)}</p>
    ${from ? `<p class="wcard-from">Switched from ${esc(from)} <button class="linkbtn" data-action="wSessionClear">Undo</button></p>` : ''}
    <div class="wcard-btns"><button class="btn" data-action="startWorkout">Start workout</button>${restButton(state)}</div></div>`;
}

function syncNoticeHtml(state) {
  if (typeof syncStatus.syncNotice !== 'function') return '';
  const n = syncStatus.syncNotice({ pending: syncStatus.waitingCount(state), lastExportAt: state.lastExportAt, storageProtected: !state.storageLine, now: Date.now() });
  if (!n.show) return '';
  return `<div class="syncnote"><div class="syncnote-txt"><b>${esc(n.title)}</b><span>${esc(n.hint)}</span></div>
    <button class="btn secondary" data-action="syncNow">Sync now</button></div>`;
}

function rowsPanel(state, day) {
  const p = state.practice;
  const running = p && p.startAt != null ? (p.area || true) : false;
  const row = (win, title, text) => `<button class="prow" data-action="openTodayWin" data-win="${win}">
    <span class="prow-txt"><span class="prow-t">${title}</span><span class="prow-s">${esc(text)}</span></span>${chevronRight}</button>`;
  return `<div class="panel prows">${row('log', 'Log', logSummary(state.entries, day))}${row('learn', 'Learn', learnSummary(state.entries, day, running))}${row('notes', 'Notes', notesSummary(state.entries))}</div>`;
}

function recentRow(recent) {
  if (!recent.length) return '<div class="recent-empty"><p class="note">No entries yet.</p><button class="btn secondary" data-action="demo">Load demo data</button></div>';
  return `<button class="recent" data-tab="history" data-action="tab"><span class="recent-t">Recent entries</span><span class="recent-n">${esc(recentHeader(recent.length))}</span>${chevronRight}</button>`;
}

export function todayView(state) {
  if (state.todayWin) return `${todayWindow(state, today(state))}${quickAddSheet(state)}`; // Log, Learn or Notes window
  const day = today(state);
  const recent = liveEntries(state.entries);
  const id = workout.pickedFor(state, day) || workout.sessionForDate(day, state.planDays); // today's pick (incl. a quick workout), else the schedule
  const s = id && sessionById(id);
  return `<div class="today">${habitsHero(state, day, Boolean(s))}
    ${workoutCard(state, s)}
    ${syncNoticeHtml(state)}
    ${rowsPanel(state, day)}
    ${recentRow(recent)}</div>
    ${quickAddButton()}${quickAddSheet(state)}${manageHabitsSheet(state)}${sheetLayer(state)}`;
}
