// Notes window body: a New note section and a Latest notes section (F68).
//   html:    notesPanel(state)
//   actions: data-action="logNote" | "exportNotes" (see notesActions.js)
//   updateNoteCount(): writes "N of 5,000" to #note-count from the textarea, no re-render.
// A refused save keeps what was typed in state.noteDraft, so a long note is never lost.

import { liveEntries } from '../logic/entries.js';
import { isDirty } from '../logic/exportBuilder.js';
import { dirtyNotes, noteTitle } from '../logic/notesExport.js';
import { esc } from './format.js';
import { winSection } from './winParts.js';

const MAX = 5000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const countText = (n) => `${n.toLocaleString('en-US')} of ${MAX.toLocaleString('en-US')}`;
const shortDate = (d) => `${MONTHS[Number(d.slice(5, 7)) - 1] || ''} ${Number(d.slice(8, 10))}`.trim();

export function updateNoteCount() {
  const ta = document.getElementById('note-body');
  const out = document.getElementById('note-count');
  if (ta && out) out.textContent = countText(ta.value.length);
}

export function notesPanel(state) {
  const draft = state.noteDraft || { title: '', body: '' };
  const notes = liveEntries(state.entries).filter((e) => e.type === 'note')
    .sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt - a.updatedAt).slice(0, 3);
  const n = dirtyNotes(state.entries).length;
  const rows = notes.map((e) => {
    const dirty = isDirty(e);
    return `<div class="win-row win-notes-row"><span class="win-notes-date">${esc(shortDate(e.date))}</span>` +
      `<span class="win-notes-title">${esc(noteTitle(e))}</span>` +
      `<span class="win-tag ${dirty ? 'waiting' : 'vault'}">${dirty ? 'Waiting' : 'In vault'}</span></div>`;
  }).join('');
  const send = n
    ? `<button class="btn secondary win-notes-send" data-action="exportNotes">Send ${n} note${n === 1 ? '' : 's'} to vault</button>`
    : '<button class="btn secondary win-notes-send win-notes-none" data-action="exportNotes" disabled>Nothing to send</button>';
  const form = `<div class="win-field"><label for="note-title">Title (optional)</label>
      <input id="note-title" class="field" maxlength="80" placeholder="Streak view" autocomplete="off" value="${esc(draft.title)}"></div>
    <div class="win-field"><div class="win-notes-labelrow"><label for="note-body">Note</label><span id="note-count" class="win-notes-count">${countText(draft.body.length)}</span></div>
      <textarea id="note-body" class="field win-notes-body" rows="5" maxlength="${MAX}" placeholder="App ideas, features, anything">${esc(draft.body)}</textarea>
      <p class="win-notes-help">If saving fails, what you typed stays here.</p></div>
    <button class="btn win-notes-save" data-action="logNote">Save note</button>`;
  const latest = `${rows || '<p class="win-notes-help">No notes yet.</p>'}${send}`;
  return winSection({ title: 'New note', body: form }) +
    winSection({ title: 'Latest notes', status: n ? `${n} waiting` : 'All in your vault', body: latest });
}
