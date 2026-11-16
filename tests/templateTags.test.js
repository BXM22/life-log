import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { SESSIONS, setTemplate } from '../src/logic/template.js';
import { addSession, normalizeTemplate } from '../src/logic/templateEdit.js';
import { normalizeTags, allTags, usedTags, filterByTag, setTags, setActive, isActive } from '../src/logic/templateTags.js';

after(() => setTemplate(null));

test('normalizeTags: lowercases, trims, dedupes, caps length and count', () => {
  assert.deepEqual(normalizeTags([' Push ', 'push', 'PULL', '', null]), ['push', 'pull']);
  assert.equal(normalizeTags(['x'.repeat(30)])[0].length, 20);
  assert.equal(normalizeTags(['a', 'b', 'c', 'd', 'e', 'f', 'g']).length, 6);
  assert.deepEqual(normalizeTags('nope'), []);
});

test('setTags and filterByTag', () => {
  const r = setTags(SESSIONS, 'lower', ['Legs', 'Heavy']);
  assert.deepEqual(r.sessions.find((s) => s.id === 'lower').tags, ['legs', 'heavy']);
  assert.deepEqual(filterByTag(r.sessions, 'heavy').map((s) => s.id), ['lower']);
  assert.equal(filterByTag(r.sessions, '').length, SESSIONS.length);
  assert.match(setTags(SESSIONS, 'nope', []).error, /session/);
});

test('allTags adds custom tags after the suggested ones; usedTags lists only tags in use', () => {
  const s = setTags(SESSIONS, 'lower', ['heavy']).sessions;
  assert.ok(allTags(s).includes('heavy'));
  assert.equal(allTags(s).indexOf('upper'), 0);
  assert.deepEqual(usedTags(s), ['heavy', 'quick', 'upper']);
});

test('setActive: exactly one session is active', () => {
  assert.equal(isActive({}), false);
  const a = setActive(SESSIONS, 'lower').sessions;
  assert.deepEqual(a.filter(isActive).map((s) => s.id), ['lower']);
  const b = setActive(a, 'upper_c').sessions;
  assert.deepEqual(b.filter(isActive).map((s) => s.id), ['upper_c']);
  assert.match(setActive(SESSIONS, 'nope').error, /does not exist/);
});

test('normalizeTemplate keeps tags and active=false; addSession copies tags', () => {
  const stored = JSON.parse(JSON.stringify(setActive(setTags(SESSIONS, 'lower', ['heavy']).sessions, 'upper_c').sessions));
  const n = normalizeTemplate(stored);
  assert.deepEqual(n.find((s) => s.id === 'lower').tags, ['heavy']);
  assert.equal(n.find((s) => s.id === 'upper_c').active, true);
  assert.equal(n.find((s) => s.id === 'lower').active, false);
  const old = normalizeTemplate([{ id: 'x', name: 'X', exercises: [] }]);
  assert.deepEqual(old[0].tags, []);
  const copy = addSession(SESSIONS, 'Lower 2', 'lower').sessions.at(-1);
  assert.deepEqual(copy.tags, ['lower', 'legs']);
});
