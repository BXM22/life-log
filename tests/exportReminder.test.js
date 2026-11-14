import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lastExportAt, daysSinceExport, reminderDue, reminderBanner, loadReminderEnabled, saveReminderEnabled, maybeNotify, requestNotifyPermission, reminderNotifySupported } from '../src/logic/exportReminder.js';

const DAY = 86400000;
const now = 100 * DAY;
const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v) }; };

test('lastExportAt picks the newest confirmedAt, null when none or junk', () => {
  assert.equal(lastExportAt([{ confirmedAt: 5 }, { confirmedAt: 9 }, { confirmedAt: 'x' }, null]), 9);
  assert.equal(lastExportAt([]), null);
  assert.equal(lastExportAt(undefined), null);
});

test('due when never exported or 7+ days old, not before', () => {
  assert.equal(reminderDue(null, now), true);
  assert.equal(reminderDue(now - 7 * DAY, now), true);
  assert.equal(reminderDue(now - 6 * DAY - 3600000, now), false);
  assert.equal(daysSinceExport(now - 3 * DAY, now), 3);
  assert.equal(daysSinceExport(null, now), null);
});

test('banner shows when due, links to export tab, hidden when off or fresh', () => {
  const html = reminderBanner({ lastExportAt: null, exportReminder: true }, now);
  assert.match(html, /data-tab="export"/);
  assert.match(html, /never exported/);
  assert.match(reminderBanner({ lastExportAt: now - 9 * DAY }, now), /9 days ago/);
  assert.equal(reminderBanner({ lastExportAt: null, exportReminder: false }, now), '');
  assert.equal(reminderBanner({ lastExportAt: now - DAY }, now), '');
});

test('toggle persists; defaults on; blocked storage does not throw', () => {
  const s = mem();
  assert.equal(loadReminderEnabled(s), true);
  assert.equal(saveReminderEnabled(s, false), true);
  assert.equal(loadReminderEnabled(s), false);
  const bad = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); } };
  assert.equal(loadReminderEnabled(bad), true);
  assert.equal(saveReminderEnabled(bad, false), false);
});

test('notification: feature-detected, once a day, silent when unsupported or denied', () => {
  const s = mem();
  const shown = [];
  class N { constructor(t, o) { shown.push([t, o]); } }
  N.permission = 'granted';
  assert.equal(maybeNotify({ enabled: true, lastAt: null, now, storage: s, env: { Notification: N } }), true);
  assert.equal(maybeNotify({ enabled: true, lastAt: null, now, storage: s, env: { Notification: N } }), false);
  assert.equal(shown.length, 1);
  assert.equal(maybeNotify({ enabled: true, lastAt: null, now, storage: mem(), env: {} }), false);
  N.permission = 'denied';
  assert.equal(maybeNotify({ enabled: true, lastAt: null, now, storage: mem(), env: { Notification: N } }), false);
  N.permission = 'granted';
  assert.equal(maybeNotify({ enabled: false, lastAt: null, now, storage: mem(), env: { Notification: N } }), false);
  assert.equal(maybeNotify({ enabled: true, lastAt: now, now, storage: mem(), env: { Notification: N } }), false);
});

test('permission request degrades silently', async () => {
  assert.equal(await requestNotifyPermission({}), 'unsupported');
  assert.equal(await requestNotifyPermission({ Notification: { permission: 'default', requestPermission: async () => 'granted' } }), 'granted');
  assert.equal(await requestNotifyPermission({ Notification: { permission: 'default', requestPermission: async () => { throw new Error('x'); } } }), 'unsupported');
  assert.equal(reminderNotifySupported({}), false);
});
