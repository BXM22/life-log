// Sync v2: one ordered flow (export, confirm, wipe) plus pages and sheets. Views are HTML strings.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildExport } from '../src/logic/exportBuilder.js';
import { markExported } from '../src/logic/wipeEligibility.js';
import { exportView, wipeView, svSubpage, dropboxModal } from '../src/ui/exportWipeView.js';
import { createSyncActions } from '../src/ui/syncActions.js';
import { renderBackupPanel } from '../src/ui/backupPanel.js';

const DAY = 86400000;
const NOW = Date.now();
const iso = (t) => new Date(t).toISOString().slice(0, 10);
const entry = (id, daysAgo) => ({
  id, type: 'weigh_in', date: iso(NOW - daysAgo * DAY), data: { weight_lb: 180 },
  updatedAt: NOW - daysAgo * DAY, exportedAt: null, exportId: null, deletedAt: null,
});
const base = (over = {}) => ({
  entries: [entry('old', 20), entry('new', 1)], habits: [], exportedNames: [], keepDays: 7, dayStartHour: 0,
  lastExportAt: null, flow: { step: 'idle', result: null, viaDownload: false }, wipeTick: false, syncModal: null, svPage: null, msg: '', ...over,
});
const built = (state) => {
  const result = buildExport(state.entries, { now: NOW });
  return { ...state, flow: { step: 'built', result, viaDownload: false } };
};
const confirmed = (state) => {
  const s = built(state);
  return { ...s, entries: markExported(s.entries, s.flow.result.manifest, NOW), flow: { ...s.flow, step: 'confirmed' } };
};

test('root shows Copies, the three steps with wipe locked, and More rows', () => {
  const html = exportView(base());
  assert.equal(svSubpage(base()), null);
  assert.match(html, /sv-root/);
  assert.match(html, /Copies/);
  assert.match(html, /data-action="build"/);
  assert.match(html, /2 entries waiting/);
  assert.match(html, /sv-step locked/);
  assert.match(html, /Opens after you confirm the file/);
  assert.match(html, /data-page="review"/);
  assert.match(html, /data-page="backup"/);
  assert.match(html, /data-action="stOpen" data-tab="settings" data-page="dropbox"/);
  assert.match(html, /Overdue/); // never exported, never backed up
});

test('export is disabled when nothing is waiting', () => {
  assert.match(exportView(base({ entries: [] })), /data-action="build" disabled/);
});

test('built flow shows the Export page with share, cancel and preview; shared adds the sheet', () => {
  const s = built(base());
  assert.equal(svSubpage(s), 'export');
  const html = exportView(s);
  assert.match(html, /Export entries/);
  assert.match(html, /data-action="share"/);
  assert.match(html, /data-action="openDropbox"/); // not connected in tests
  assert.match(html, /data-action="confirmNo"/);
  assert.match(html, /<pre class="sv-pre">/);
  assert.doesNotMatch(html, /sv-sheet/);
  const shared = exportView({ ...s, flow: { ...s.flow, step: 'shared' } });
  assert.match(shared, /Is the file in Dropbox\?/);
  assert.match(shared, /data-action="confirmYes"/);
  assert.match(shared, /data-action="svNotYet"/);
});

test('confirmed root: steps 1 and 2 done, step 3 opens the Wipe page', () => {
  const s = confirmed(base());
  const html = exportView(s);
  assert.equal((html.match(/sv-step done/g) || []).length, 2);
  assert.match(html, /data-action="svOpen" data-page="wipe"/);
  assert.match(html, /Wipe 1 entry/);
});

test('Wipe page lists what stays and opens the confirm sheet; wipe stays disabled until ticked', () => {
  const s = { ...confirmed(base()), svPage: 'wipe' };
  assert.equal(svSubpage(s), 'wipe');
  const page = wipeView(s);
  assert.match(page, /What stays/);
  assert.match(page, /Last 7 days/);
  assert.match(page, /data-action="openWipe"/);
  const ask = exportView({ ...s, syncModal: 'wipe' });
  assert.match(ask, /Wipe 1 entry\?/);
  assert.match(ask, /data-action="tick"/);
  assert.match(ask, /data-action="wipe" disabled/);
  assert.doesNotMatch(exportView({ ...s, syncModal: 'wipe', wipeTick: true }), /data-action="wipe" disabled/);
});

test('Wipe page falls back to the root when nothing is confirmed', () => {
  assert.equal(svSubpage(base({ svPage: 'wipe' })), null);
});

test('review and backup pages', () => {
  assert.match(exportView(base({ svPage: 'review' })), /data-action="sendReview"/);
  assert.match(exportView(base({ svPage: 'review', msg: 'Sending review to Dropbox...' })), /aria-busy="true"/);
  const b = exportView(base({ svPage: 'backup' }));
  assert.match(b, /data-action="backup"/);
  assert.match(b, /id="restoreFile"/);
  assert.match(b, /data-action="restore"/);
  assert.match(renderBackupPanel(base()), /2 entries/);
});

test('upload in progress disables the buttons', () => {
  // Not connected in tests, so the share and cancel buttons carry the busy state.
  const html = exportView({ ...built(base()), msg: 'Uploading to Dropbox...' });
  assert.match(html, /data-action="share" disabled/);
});

test('sv actions move through the page stack', () => {
  const state = base();
  const a = createSyncActions({ state, onChange: () => {} });
  a.svOpen({ dataset: { page: 'backup' } });
  assert.equal(state.svPage, 'backup');
  a.svOpen({ dataset: { page: 'bogus' } });
  assert.equal(state.svPage, null);
  state.svPage = 'wipe'; state.syncModal = 'wipe'; state.wipeTick = true;
  a.svBack();
  assert.deepEqual([state.svPage, state.syncModal, state.wipeTick], [null, null, false]);
  state.flow = { step: 'shared', result: {}, viaDownload: false };
  a.svNotYet();
  assert.equal(state.flow.step, 'built');
});

test('dropboxModal keeps its markup contract for Settings', () => {
  const html = dropboxModal();
  assert.match(html, /id="appKey"/);
  assert.match(html, /data-action="connect"/);
  assert.match(html, /data-action="closeModal"/);
});
