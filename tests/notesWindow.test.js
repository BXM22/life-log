import { test } from 'node:test';
import assert from 'node:assert/strict';
import { notesWindow } from '../src/ui/notesWindow.js';

test('notes window has back row, note inputs and actions, and no study markup', () => {
  const h = notesWindow({ entries: [] });
  assert.match(h, /data-action="closeTodayWin"[^>]*aria-label="Back to Today"/);
  assert.match(h, /<h2 class="subtitle">Notes<\/h2>/);
  assert.match(h, /id="note-title"[^>]*maxlength="80"/);
  assert.match(h, /id="note-body"[^>]*maxlength="5000"/);
  assert.match(h, /data-action="logNote"/);
  assert.match(h, /data-action="exportNotes" disabled/);
  assert.doesNotMatch(h, /logStudy|study-topic/);
});
