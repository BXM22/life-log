// WORKOUT tab, history mode: past workout days, newest first. Tap a day to see its sets.
//   html: workoutHistoryView(state)   (no actions: each day is a native <details>)

import { workoutDays } from '../logic/workoutHistory.js';
import { weekday } from '../logic/workout.js';
import { esc } from './format.js';

const MAX_DAYS = 60;
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function dayBlock(d) {
  const names = d.sessions.map((s) => s.name).join(' + ');
  const body = d.sessions.map((s) => `<h3>${esc(s.name)}</h3>${s.exercises.map((ex) => {
    const parts = [];
    if (ex.warmup.length) parts.push(`warm-up ${ex.warmup.join(', ')}`);
    if (ex.working.length) parts.push(ex.working.join(', '));
    return `<p><b>${esc(ex.name)}</b><br>${esc(parts.join('; '))}</p>`;
  }).join('')}`).join('');
  return `<details class="entry"><summary>${DAY_NAMES[weekday(d.date)]} ${esc(d.date.slice(5))} · ${esc(names)} · ${d.count} set${d.count === 1 ? '' : 's'}</summary>${body}</details>`;
}

export function workoutHistoryView(state) {
  const days = workoutDays(state.entries);
  return `<div class="panel"><h2>WORKOUT HISTORY</h2>
    ${days.slice(0, MAX_DAYS).map(dayBlock).join('') || '<p>No workouts logged yet.</p>'}
    ${days.length > MAX_DAYS ? `<p>Showing the newest ${MAX_DAYS} of ${days.length} days.</p>` : ''}
    <p>Workouts older than your keep window are in your Dropbox exports.</p>
  </div>`;
}
