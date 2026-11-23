// Notes window on Today (F68): header, New note section, Latest notes section.
//   html:    notesWindow(state)
//   actions: closeTodayWin, logNote, exportNotes

import { notesPanel } from './notesView.js';
import { winHeader } from './winParts.js';

export function notesWindow(state) {
  return `<div class="win win-notes">${winHeader({ title: 'Notes', summary: 'Write down ideas now and send them to your vault later.' })}${notesPanel(state)}</div>`;
}
