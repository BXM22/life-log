// Notes window on Today: title, body, SAVE NOTE, the 3 newest notes and SEND N NOTES TO VAULT.
//   html:    notesWindow(state)
//   actions: closeTodayWin, logNote, exportNotes

import { notesPanel } from './notesView.js';

const BACK = '<button class="back-link" data-action="closeTodayWin" aria-label="Back to Today"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>';

export function notesWindow(state) {
  return `<div class="backrow">${BACK}</div>
    <h2 class="subtitle">Notes</h2>
    ${notesPanel(state)}`;
}
