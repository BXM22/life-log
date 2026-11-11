// NOTES panel on the TODAY tab: a brainstorm box, the latest notes and a send-to-vault button.
//   html:    notesPanel(state)
//   actions: data-action="logNote" | "exportNotes" (see notesActions.js)
// A refused save keeps what was typed in state.noteDraft, so a long note is never lost.

import { liveEntries } from '../logic/entries.js';
import { isDirty } from '../logic/exportBuilder.js';
import { dirtyNotes, noteTitle } from '../logic/notesExport.js';
import { esc } from './format.js';

export function notesPanel(state) {
  const draft = state.noteDraft || { title: '', body: '' };
  const notes = liveEntries(state.entries).filter((e) => e.type === 'note')
    .sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt - a.updatedAt).slice(0, 5);
  const rows = notes.map((e) =>
    `<div class="row"><span>${esc(e.date.slice(5))} ${esc(noteTitle(e))}</span>` +
    `<span class="tag ${isDirty(e) ? 'waiting' : 'done'}">${isDirty(e) ? 'WAITING' : 'IN VAULT'}</span></div>`).join('');
  const n = dirtyNotes(state.entries).length;
  return `<div class="panel">
    <h2>NOTES</h2>
    <input id="note-title" class="field" maxlength="80" placeholder="Title (optional)" aria-label="Note title" autocomplete="off" value="${esc(draft.title)}">
    <textarea id="note-body" class="field" rows="5" maxlength="5000" placeholder="Brainstorm: app ideas, features, anything" aria-label="Note">${esc(draft.body)}</textarea>
    <button class="btn" data-action="logNote">SAVE NOTE</button>
    ${rows}
    <button class="btn secondary" data-action="exportNotes" ${n ? '' : 'disabled'}>SEND ${n} NOTE${n === 1 ? '' : 'S'} TO VAULT</button>
  </div>`;
}
