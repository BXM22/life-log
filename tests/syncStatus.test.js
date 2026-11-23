import { test } from 'node:test';
import assert from 'node:assert/strict';
import { syncChip, syncRowText, syncNotice, syncNoticeForState } from '../src/logic/syncStatus.js';
import { syncChipHtml } from '../src/ui/syncChip.js';

const DAY = 86400000;
const now = 100 * DAY;
const e = (over) => ({ id: 'a', type: 'weigh_in', date: '2026-11-17', updatedAt: 5, exportedAt: null, ...over });
const st = (entries, over) => ({ entries, lastExportAt: now - DAY, exportReminder: true, ...over });

test('Export due when reminder on and last export 7+ days old (or never)', () => {
  assert.deepEqual(syncChip(st([e()], { lastExportAt: now - 7 * DAY }), now), { text: 'Export due', due: true });
  assert.deepEqual(syncChip(st([], { lastExportAt: null }), now), { text: 'Export due', due: true });
});

test('reminder off falls back to the count', () => {
  assert.deepEqual(syncChip(st([e()], { lastExportAt: null, exportReminder: false }), now), { text: '1 to export', due: false });
});

test('N to export and Synced; notes, exported and deleted entries not counted', () => {
  assert.deepEqual(syncChip(st([e(), e({ id: 'b' })]), now), { text: '2 to export', due: false });
  const none = [e({ type: 'note' }), e({ exportedAt: 9 }), e({ deletedAt: 9 })];
  assert.deepEqual(syncChip(st(none), now), { text: 'Synced', due: false });
});

test('row text', () => {
  assert.equal(syncRowText(st([e(), e({ id: 'b' })])), '2 entries waiting to export');
  assert.equal(syncRowText(st([e({ type: 'note' })])), 'Everything exported');
});

test('chip html: due dot', () => {
  assert.match(syncChipHtml(st([], { lastExportAt: null }), now), /class="dot due"/);
  assert.match(syncChipHtml(st([e()]), now), /class="dot"/);
});

const hidden = { show: false, title: '', hint: '' };

test('notice hidden when nothing waits and storage is protected', () => {
  assert.deepEqual(syncNotice({ pending: 0, lastExportAt: now - DAY, storageProtected: true, now }), hidden);
});

test('notice: plural, singular and last export hint', () => {
  assert.deepEqual(syncNotice({ pending: 2, lastExportAt: now - 8 * DAY, storageProtected: true, now }),
    { show: true, title: '2 entries waiting to export', hint: 'Last export 8 days ago' });
  assert.equal(syncNotice({ pending: 1, lastExportAt: now - DAY, storageProtected: true, now }).title, '1 entry waiting to export');
  assert.equal(syncNotice({ pending: 1, lastExportAt: now - DAY, storageProtected: true, now }).hint, 'Last export 1 day ago');
  assert.equal(syncNotice({ pending: 1, lastExportAt: now, storageProtected: true, now }).hint, 'Last export today');
  assert.equal(syncNotice({ pending: 1, lastExportAt: null, storageProtected: true, now }).hint, 'No export yet');
});

test('notice: unprotected storage shows the Home Screen hint, with or without entries', () => {
  const hint = "Storage isn't protected. Add the app to your Home Screen.";
  assert.deepEqual(syncNotice({ pending: 0, lastExportAt: now, storageProtected: false, now }), { show: true, title: 'Nothing waiting to export', hint });
  assert.deepEqual(syncNotice({ pending: 3, lastExportAt: now, storageProtected: false, now }), { show: true, title: '3 entries waiting to export', hint });
});

test('notice copy has no middle dot', () => {
  const n = syncNotice({ pending: 2, lastExportAt: now - 8 * DAY, storageProtected: false, now });
  assert.ok(!(n.title + n.hint).includes('\u00b7'));
});

test('chip and notice agree on the pending count', () => {
  const s = st([e(), e({ id: 'b' })]);
  assert.equal(syncChip(s, now).text, '2 to export');
  assert.equal(syncNoticeForState(s, { now }).title, '2 entries waiting to export');
  const none = st([]);
  assert.equal(syncChip(none, now).text, 'Synced');
  assert.equal(syncNoticeForState(none, { now }).show, false);
  assert.equal(syncNoticeForState(none, { storageProtected: false, now }).show, true);
});
