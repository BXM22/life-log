// HISTORY tab: bodyweight history, then every entry with edit and delete.
//   html:    historyView(state)
//   actions: data-action="startEdit" | "saveEdit" | "cancelEdit" | "deleteEntry" with data-id (handled in app.js)

import { isDirty } from '../logic/exportBuilder.js';
import { liveEntries, weightHistory } from '../logic/entries.js';
import { esc, label } from './format.js';

const MAX_ROWS = 60;
const MAX_WEIGHTS = 14;

function editForm(e) {
  let fields = '';
  if (e.type === 'weigh_in') {
    fields = `<input id="ed-w" class="field" type="number" inputmode="decimal" step="0.1" value="${esc(e.data.weight_lb)}" aria-label="Weight in lb">`;
  } else if (e.type === 'guitar') {
    fields = `<input id="ed-m" class="field" type="number" inputmode="numeric" step="1" value="${esc(e.data.minutes)}" aria-label="Minutes">
      <input id="ed-f" class="field" maxlength="40" value="${esc(e.data.focus || '')}" aria-label="Focus" autocomplete="off">
      <input id="ed-b" class="field" type="number" inputmode="numeric" step="1" value="${esc(e.data.best_bpm ?? '')}" placeholder="Best BPM" aria-label="Best BPM">`;
  } else if (e.type === 'lift_set') {
    const d = e.data;
    fields = `<p>${esc(d.exercise)} ${d.kind === 'warmup' ? '(warm-up)' : ''} ${d.side ? esc(d.side) : ''}</p>
      <input id="ed-w" class="field" type="number" inputmode="decimal" step="0.5" value="${esc(d.weight ?? '')}" placeholder="Weight (lb)" aria-label="Weight in lb">
      ${d.seconds != null
    ? `<input id="ed-s" class="field" type="number" inputmode="numeric" step="1" value="${esc(d.seconds)}" aria-label="Seconds">`
    : `<input id="ed-r" class="field" type="number" inputmode="numeric" step="1" value="${esc(d.reps ?? '')}" aria-label="Reps">`}`;
  } else {
    fields = `<label class="check"><input id="ed-d" type="checkbox" ${e.data.done ? 'checked' : ''}><span>${esc(e.data.habit)} done</span></label>`;
  }
  return `<div class="entry editing"><b>${esc(e.date)}</b>${fields}
    <button class="btn" data-action="saveEdit" data-id="${esc(e.id)}">SAVE</button>
    <button class="btn secondary" data-action="cancelEdit">CANCEL</button></div>`;
}

function entryRow(e) {
  // A habit check is changed by toggling it, never deleted here: the Dropbox copy would stay "done".
  const del = e.type === 'habit_check' ? '' : `<button class="btn secondary small" data-action="deleteEntry" data-id="${esc(e.id)}">DEL</button>`;
  return `<div class="entry"><div class="row"><span>${esc(e.date.slice(5))} ${esc(label(e))}</span>
    <span class="tag ${isDirty(e) ? 'waiting' : 'done'}">${isDirty(e) ? 'WAITING' : 'EXPORTED'}</span></div>
    <div class="actions"><button class="btn secondary small" data-action="startEdit" data-id="${esc(e.id)}">EDIT</button>${del}</div></div>`;
}

export function historyView(state) {
  const weights = weightHistory(state.entries, state.stats).slice(0, MAX_WEIGHTS);
  const wRows = weights.map((w, i) => {
    const prev = weights[i + 1];
    const diff = prev ? `${w.weight_lb - prev.weight_lb >= 0 ? '+' : ''}${(w.weight_lb - prev.weight_lb).toFixed(1)}` : '';
    return `<div class="row"><span>${esc(w.date.slice(5))}</span><span>${esc(w.weight_lb)} lb ${diff ? `<small>${esc(diff)}</small>` : ''}</span></div>`;
  }).join('');

  const all = liveEntries(state.entries).sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt - a.updatedAt);
  const rows = all.slice(0, MAX_ROWS).map((e) => (state.editId === e.id ? editForm(e) : entryRow(e))).join('');

  return `<div class="panel"><h2>BODYWEIGHT</h2>${wRows || '<p>No weigh-ins yet.</p>'}</div>
    <div class="panel"><h2>ALL ENTRIES</h2>${rows || '<p>No entries yet.</p>'}
      ${all.length > MAX_ROWS ? `<p>Showing the newest ${MAX_ROWS} of ${all.length}.</p>` : ''}</div>`;
}
