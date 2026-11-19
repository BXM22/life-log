import { test } from 'node:test';
import assert from 'node:assert/strict';
import { syncChip, syncRowText } from '../src/logic/syncStatus.js';
import { syncChipHtml, syncRowHtml } from '../src/ui/syncChip.js';

const DAY = 86400000;
const now = 100 * DAY;
const e = (over) => ({ id: 'a', type: 'weigh_in', date: '2026-11-17', updatedAt: 5, exportedAt: null, ...over });
const st = (entries, over) => ({ entries, lastExportAt: now - DAY, exportReminder: true, ...over });

test('Export due when reminder on and last export 7+ days old (or never)', () => {
  assert.deepEqual(syncChip(st([e()], { lastExportAt: now - 7 * DAY }), now), { text: 'Export due', due: true });
  assert.deepEqual(syncChip(st([], { lastExportAt: null }), now), { text: 'Export due', due: true });
});

test('reminder off falls back to the count', () => {
  assert.deepEqual(syncChip(st([e()], { lastExportAt: null, exportReminder: false }), now), { text: '1 waiting', due: false });
});

test('N waiting and Synced; notes, exported and deleted entries not counted', () => {
  assert.deepEqual(syncChip(st([e(), e({ id: 'b' })]), now), { text: '2 waiting', due: false });
  const none = [e({ type: 'note' }), e({ exportedAt: 9 }), e({ deletedAt: 9 })];
  assert.deepEqual(syncChip(st(none), now), { text: 'Synced', due: false });
});

test('row text', () => {
  assert.equal(syncRowText(st([e(), e({ id: 'b' })])), '2 entries waiting to export');
  assert.equal(syncRowText(st([e({ type: 'note' })])), 'Everything exported');
});

test('html: due dot, SYNC NOW enabled vs SYNCED disabled', () => {
  assert.match(syncChipHtml(st([], { lastExportAt: null }), now), /class="dot due"/);
  assert.match(syncChipHtml(st([e()]), now), /class="dot"/);
  assert.match(syncRowHtml(st([e()])), /data-action="syncNow">SYNC NOW/);
  assert.match(syncRowHtml(st([])), /disabled>SYNCED/);
});
