import { test } from 'node:test';
import assert from 'node:assert/strict';
import { settingsView, hourLabel, REST_LENGTHS } from '../src/ui/settingsView.js';
import { createSettingsActions } from '../src/ui/settingsActions.js';

const base = (over = {}) => ({
  theme: 'system', keepDays: 7, dayStartHour: 4, planDays: 4, exportReminder: true, autoSync: true,
  rest: { seconds: 90, auto: true, endAt: null, total: null }, installKind: 'other', storageLine: 'Storage protected.',
  stPage: null, stSheet: null, syncModal: null, ...over,
});

test('root keeps every setting wired to its existing action and value', () => {
  const html = settingsView(base({ theme: 'dark', keepDays: 3, planDays: 3 }));
  assert.match(html, /data-action="setTheme" value="dark" aria-pressed="true"/);
  assert.match(html, /data-action="setTheme" value="light" aria-pressed="false"/);
  assert.match(html, /data-action="setKeep" value="3" aria-pressed="true"/);
  assert.match(html, /data-action="setPlanDays" value="3" aria-pressed="true"/);
  assert.match(html, /data-action="setExportReminder"[^>]*checked/);
  assert.match(html, /data-action="stDayOpen"/);
  assert.match(html, /data-action="stOpen" data-page="rest"/);
  assert.match(html, /data-action="stOpen" data-page="dropbox"/);
  assert.match(html, /Tue Upper A, Thu Lower, Sat Upper B</);
  assert.doesNotMatch(html, /Connect from the EXPORT tab/);
  assert.doesNotMatch(html, /class="st-sheet"/);
});

test('root shows install button only when the browser offers a prompt, and the storage line', () => {
  assert.doesNotMatch(settingsView(base()), /data-action="install"/);
  const html = settingsView(base({ installKind: 'prompt' }));
  assert.match(html, /data-action="install"/);
  assert.match(html, /Storage protected\./);
});

test("what's new lists dated rows", () => {
  const html = settingsView(base());
  assert.match(html, /<time datetime="\d{4}-\d{2}-\d{2}">/);
});

test('day sheet: pick only selects, Use saves and closes, Cancel discards', () => {
  const state = base();
  let saved = 0;
  const a = createSettingsActions({ state, persist: () => { saved += 1; } });
  a.stDayOpen();
  assert.equal(state.stSheet, 'dayStart');
  assert.equal(state.stDayPick, 4);
  a.stDayPick({ dataset: { h: '6' } });
  assert.equal(state.dayStartHour, 4);
  const html = settingsView(state);
  assert.match(html, /role="radio" aria-checked="true" data-action="stDayPick" data-h="6"/);
  assert.match(html, /Use 6:00 AM/);
  a.stDayUse();
  assert.equal(state.dayStartHour, 6);
  assert.equal(state.stSheet, null);
  assert.equal(saved, 1);
  a.stDayOpen();
  a.stDayPick({ dataset: { h: '0' } });
  a.stSheetClose();
  assert.equal(state.dayStartHour, 6);
  a.stDayPick({ dataset: { h: '9' } }); // not an option
  assert.notEqual(state.stDayPick, 9);
  assert.equal(hourLabel(0), 'Midnight');
});

test('stOpen works from any tab and ignores unknown pages; stBack returns to root', () => {
  const state = base({ tab: 'export', syncModal: 'wipe' });
  const a = createSettingsActions({ state });
  a.stOpen({ dataset: { page: 'dropbox' } });
  assert.equal(state.tab, 'settings');
  assert.equal(state.stPage, 'dropbox');
  assert.equal(state.syncModal, null);
  a.stOpen({ dataset: { page: 'nope' } });
  assert.equal(state.stPage, null);
  a.stOpen({ dataset: { page: 'rest' } });
  a.stBack();
  assert.equal(state.stPage, null);
});

test('rest page: chips set rest.seconds, switch uses restAuto, custom opens the rest wheel', () => {
  const state = base({ stPage: 'rest' });
  let html = settingsView(state);
  assert.equal((html.match(/data-action="stRestLen"/g) || []).length, REST_LENGTHS.length);
  assert.match(html, /data-s="90" aria-pressed="true"/);
  assert.match(html, /data-action="restAuto"[^>]*checked/);
  assert.match(html, /data-action="stBack"/);
  const a = createSettingsActions({ state });
  a.stRestLen({ dataset: { s: '45' } });
  assert.equal(state.rest.seconds, 45);
  state.rest.seconds = 135;
  html = settingsView(state);
  assert.match(html, /aria-pressed="true">Custom 2:15/);
  a.stRestCustom();
  assert.equal(state.tab, 'workout');
  assert.equal(state.restOpen, true);
  assert.equal(state.stPage, null);
});

test('dropbox page, not connected: Connect opens the existing modal; switch is off and disabled', () => {
  const state = base({ stPage: 'dropbox' });
  let html = settingsView(state);
  assert.match(html, /data-action="openDropbox"/);
  assert.match(html, /data-action="setAutoSync"[^>]*disabled/);
  assert.doesNotMatch(html, /data-action="setAutoSync"[^>]*checked/);
  state.syncModal = 'dropbox';
  html = settingsView(state);
  assert.match(html, /id="appKey"/);
});

test('stGoSync leaves settings for the Sync tab', () => {
  const state = base({ tab: 'settings', stPage: 'dropbox' });
  createSettingsActions({ state }).stGoSync();
  assert.equal(state.tab, 'export');
  assert.equal(state.stPage, null);
});
