import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveTheme, applyTheme, watchSystemTheme, THEME_COLORS } from '../src/logic/theme.js';

test('resolveTheme: light and dark are fixed; system follows prefersDark', () => {
  assert.equal(resolveTheme('light', true), 'light');
  assert.equal(resolveTheme('dark', false), 'dark');
  assert.equal(resolveTheme('system', true), 'dark');
  assert.equal(resolveTheme('system', false), 'light');
  assert.equal(resolveTheme('unknown', true), 'dark');
  assert.equal(resolveTheme(null, false), 'light');
});

test('applyTheme: sets data-theme, color-scheme, theme-color, and status-bar meta', () => {
  const attrs = new Map();
  const el = (name) => ({
    getAttribute: (k) => attrs.get(`${name}:${k}`),
    setAttribute: (k, v) => attrs.set(`${name}:${k}`, v),
  });
  const themeMeta = el('theme-color');
  const barMeta = el('status-bar');
  const doc = {
    documentElement: { dataset: {}, style: {} },
    querySelector: (sel) => {
      if (sel === 'meta[name="theme-color"]') return themeMeta;
      if (sel === 'meta[name="apple-mobile-web-app-status-bar-style"]') return barMeta;
      return null;
    },
  };
  const win = { matchMedia: () => ({ matches: true }) };

  assert.equal(applyTheme('system', doc, win), 'dark');
  assert.equal(doc.documentElement.dataset.theme, 'dark');
  assert.equal(doc.documentElement.style.colorScheme, 'dark');
  assert.equal(themeMeta.getAttribute('content'), THEME_COLORS.dark);
  assert.equal(barMeta.getAttribute('content'), 'black-translucent');

  assert.equal(applyTheme('light', doc, win), 'light');
  assert.equal(doc.documentElement.dataset.theme, 'light');
  assert.equal(themeMeta.getAttribute('content'), THEME_COLORS.light);
  assert.equal(barMeta.getAttribute('content'), 'default');
});

test('watchSystemTheme: no-ops unless theme is system; unsubscribes cleanly', () => {
  let added = 0;
  let removed = 0;
  const mql = {
    addEventListener(_e, _fn) { added += 1; },
    removeEventListener(_e, _fn) { removed += 1; },
  };
  const win = { matchMedia: () => mql };
  const noop = watchSystemTheme('light', () => {}, win);
  noop();
  assert.equal(added, 0);
  const stop = watchSystemTheme('system', () => {}, win);
  assert.equal(added, 1);
  stop();
  assert.equal(removed, 1);
});
