import { test } from 'node:test';
import assert from 'node:assert/strict';
import { notesWindow } from '../src/ui/notesWindow.js';
import { updateNoteCount } from '../src/ui/notesView.js';
import { newEntry } from '../src/logic/entries.js';

test('notes window has header, sections, inputs and actions, and no study markup', () => {
  const h = notesWindow({ entries: [] });
  assert.match(h, /data-action="closeTodayWin"[^>]*aria-label="Back to Today"/);
  assert.match(h, /<h1 class="win-title">Notes<\/h1>/);
  assert.match(h, /Write down ideas now and send them to your vault later\./);
  assert.match(h, /<h2>New note<\/h2>/);
  assert.match(h, /<h2>Latest notes<\/h2>/);
  assert.match(h, /id="note-title"[^>]*maxlength="80"/);
  assert.match(h, /id="note-body"[^>]*maxlength="5000"/);
  assert.match(h, /id="note-count"[^>]*>0 of 5,000</);
  assert.match(h, /If saving fails, what you typed stays here\./);
  assert.match(h, /data-action="logNote">Save note/);
  assert.match(h, /data-action="exportNotes" disabled>Nothing to send/);
  assert.match(h, /All in your vault/);
  assert.doesNotMatch(h, /logStudy|study-topic/);
});

test('waiting notes show a tag, a status and a send button', () => {
  const e = newEntry('note', '2026-11-22', { title: 'Idea', body: 'x' }, 1000);
  const h = notesWindow({ entries: [e], noteDraft: { title: '', body: 'abc' } });
  assert.match(h, /1 waiting/);
  assert.match(h, /win-tag waiting">Waiting/);
  assert.match(h, /Send 1 note to vault/);
  assert.match(h, /Nov 22/);
  assert.match(h, /3 of 5,000/);
});

test('updateNoteCount writes the count without a render', () => {
  const out = { textContent: '' };
  globalThis.document = { getElementById: (id) => (id === 'note-body' ? { value: 'hello' } : out) };
  updateNoteCount();
  delete globalThis.document;
  assert.equal(out.textContent, '5 of 5,000');
});
