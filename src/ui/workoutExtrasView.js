// WORKOUT tab extras: warm-up checklists, back cues, trim controls, calisthenics block, BJJ done check.
//   html: warmupPanel(state, session, day), bjjPanel(state, day), caliPanel(state, day), targetText(state, ex, day), trimButtons(state, ex, i, day), cueBlock(state, ex, i)
//   actions (see workoutExtrasActions.js): toggleCheck (data-list, data-i), toggleCue (data-i), trimSet / untrimSet (data-i),
//   toggleBjj, logCali (data-i)

import { CHECKLISTS, checklistKey, checkKey, checkedCount, backCue, trimmedFor, trimmedTarget, setCount, bjjDone, calisthenicsFor, isBjjDay } from '../logic/workoutExtras.js';
import { setsFor, setText } from '../logic/workout.js';
import { esc } from './format.js';
import { editForm } from './historyView.js';

function checklist(state, day, list) {
  const spec = CHECKLISTS[list];
  const ticks = state.wChecks?.[checkKey(day, list)] ?? {};
  const done = checkedCount(state.wChecks, day, list);
  const rows = spec.items.map((text, i) => `<label class="check"><input type="checkbox" data-action="toggleCheck" data-list="${list}" data-i="${i}" ${ticks[i] ? 'checked' : ''}><span>${esc(text)}</span></label>`).join('');
  return `<div class="panel"><h2>${spec.title} ${done}/${spec.items.length}</h2>${rows}</div>`;
}

/** Upper or Lower warm-up checklist for the session, or '' for custom sessions. */
export function warmupPanel(state, session, day) {
  const key = checklistKey(session);
  return key ? checklist(state, day, key) : '';
}

/** BJJ done check and post-BJJ warm-up, on BJJ days only. */
export function bjjPanel(state, day) {
  if (!isBjjDay(day)) return '';
  const done = bjjDone(state.entries, day);
  return `<div class="panel"><h2>BJJ</h2>
    <label class="check"><input type="checkbox" data-action="toggleBjj" ${done ? 'checked' : ''}><span>BJJ class done today</span></label>
  </div>${checklist(state, day, 'bjj')}`;
}

/** Target text after trims, such as "Target 2 x 6-8 (trimmed 1 from 3 x 6-8)". */
export function targetText(state, ex, day) {
  const trimmed = trimmedFor(state.wTrims, day, ex.name, ex.target);
  return `Target ${esc(trimmedTarget(ex.target, trimmed))}${trimmed ? ` (trimmed ${trimmed} from ${esc(ex.target)})` : ''}`;
}

/** Trim and put-back buttons. Empty when the target has no set count. */
export function trimButtons(state, ex, i, day) {
  const total = setCount(ex.target);
  if (total == null) return '';
  const trimmed = trimmedFor(state.wTrims, day, ex.name, ex.target);
  return `<button class="btn secondary small" data-action="trimSet" data-i="${i}" ${total - trimmed > 1 ? '' : 'disabled'}>TRIM A SET</button>
      ${trimmed ? `<button class="btn secondary small" data-action="untrimSet" data-i="${i}">PUT BACK</button>` : ''}`;
}

/** Back-training cue toggle for back exercises, '' for anything else. */
export function cueBlock(state, ex, i) {
  const cue = backCue(ex.name);
  if (!cue) return '';
  const open = Boolean(state.wCues?.[i]);
  return `<button class="btn secondary small" data-action="toggleCue" data-i="${i}" aria-expanded="${open}">${open ? 'HIDE CUES' : 'BACK CUES'}</button>${open ? `<p class="cue">${esc(cue)}</p>` : ''}`;
}

function caliExercise(state, ex, i, day, block) {
  const sets = setsFor(state.entries, day, ex.name).filter((e) => e.data.session === block.name);
  const input = ex.mode === 'timed'
    ? `<input id="cs-${i}" class="field" type="number" inputmode="numeric" step="1" placeholder="Seconds" aria-label="Seconds">`
    : `<input id="cr-${i}" class="field" type="number" inputmode="numeric" step="1" placeholder="Reps" aria-label="Reps">`;
  const rows = sets.map((e) => (state.editId === e.id ? editForm(e) : `<div class="entry"><div class="row"><span>Set ${esc(setText(e.data))}</span>
      <span class="actions"><button class="btn secondary small" data-action="startEdit" data-id="${esc(e.id)}" aria-label="Edit this set">EDIT</button>
      <button class="btn secondary small" data-action="deleteEntry" data-id="${esc(e.id)}" aria-label="Delete this set">DEL</button></span></div></div>`)).join('');
  return `<div class="panel"><h2>${esc(ex.name)}</h2>
    <p>Target ${esc(ex.target)}. Quality reps, stop with about 2 left.</p>
    ${input}
    <button class="btn" data-action="logCali" data-i="${i}">LOG SET</button>
    ${rows}</div>`;
}

/** Calisthenics block (push Monday, pull Wednesday). Empty on other days. */
export function caliPanel(state, day) {
  const block = calisthenicsFor(day);
  if (!block) return '';
  return `<div class="panel"><h2>${esc(block.name.toUpperCase())}</h2><p>${esc(block.focus)}. 15 min after BJJ.</p></div>
    ${block.exercises.map((ex, i) => caliExercise(state, ex, i, day, block)).join('')}`;
}
