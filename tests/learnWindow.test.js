import { test } from 'node:test';
import assert from 'node:assert/strict';
import { learnWindow } from '../src/ui/learnWindow.js';

test('learn window has guitar inputs and study panel, no note textarea', () => {
  const h = learnWindow({ entries: [] }, '2026-11-15');
  assert.match(h, /<h2 class="subtitle">Learn<\/h2>/);
  for (const id of ['gm', 'gb', 'gf']) assert.match(h, new RegExp(`id="${id}"`));
  assert.match(h, /data-action="logGuitar"/);
  assert.match(h, /data-action="openTimer"/);
  assert.match(h, /data-action="logStudy"/);
  assert.match(h, /id="focuses"/);
  assert.doesNotMatch(h, /note-body|logNote/);
});

test('learn window shows the timer panel only while running', () => {
  const idle = learnWindow({ entries: [] }, '2026-11-15');
  const on = learnWindow({ entries: [], practice: { startAt: Date.now(), focus: '' } }, '2026-11-15');
  assert.ok(on.length > idle.length);
});
