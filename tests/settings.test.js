import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSettings, loadSettings, saveSettings, DEFAULT_SETTINGS, SETTINGS_KEY } from '../src/logic/settings.js';
import { installKind, installMessage } from '../src/logic/install.js';

const memory = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v) };
};

test('normalizeSettings: keeps valid values, replaces anything else with defaults', () => {
  assert.deepEqual(normalizeSettings({ keepDays: 14, dayStartHour: 2 }), { keepDays: 14, dayStartHour: 2 });
  assert.deepEqual(normalizeSettings({ keepDays: 5, dayStartHour: 9 }), DEFAULT_SETTINGS);
  assert.deepEqual(normalizeSettings({ keepDays: '7' }), DEFAULT_SETTINGS);
  for (const bad of [null, undefined, 'x', 3, []]) assert.deepEqual(normalizeSettings(bad), DEFAULT_SETTINGS);
});

test('save then load round-trips; missing, corrupt or throwing storage gives defaults', () => {
  const s = memory();
  assert.equal(saveSettings(s, { keepDays: 0, dayStartHour: 5 }), true);
  assert.deepEqual(loadSettings(s), { keepDays: 0, dayStartHour: 5 });
  assert.deepEqual(loadSettings(memory()), DEFAULT_SETTINGS);
  const corrupt = memory();
  corrupt.setItem(SETTINGS_KEY, '{not json');
  assert.deepEqual(loadSettings(corrupt), DEFAULT_SETTINGS);
  const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  assert.deepEqual(loadSettings(blocked), DEFAULT_SETTINGS);
  assert.equal(saveSettings(blocked, DEFAULT_SETTINGS), false);
});

test('installKind: standalone beats everything, then the install prompt, then iOS, else other', () => {
  const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)';
  assert.equal(installKind({ userAgent: iphone, standalone: true, canPrompt: true }), 'installed');
  assert.equal(installKind({ userAgent: 'Chrome', canPrompt: true }), 'prompt');
  assert.equal(installKind({ userAgent: iphone }), 'ios');
  assert.equal(installKind({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)', maxTouchPoints: 5 }), 'ios'); // iPadOS
  assert.equal(installKind({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)', maxTouchPoints: 0 }), 'other');
  assert.equal(installKind({}), 'other');
});

test('installMessage: text for each kind, empty for other', () => {
  assert.match(installMessage('ios'), /Add to Home Screen/);
  assert.ok(installMessage('prompt'));
  assert.equal(installMessage('other'), '');
  assert.equal(installMessage(undefined), '');
});
