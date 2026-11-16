import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { SESSIONS, setTemplate } from '../src/logic/template.js';
import { addSession, normalizeTemplate } from '../src/logic/templateEdit.js';
import { normalizeTags, visibleSessions, allTags, usedTags, filterByTag, setTags, setActive, isActive } from '../src/logic/templateTags.js';

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

test('setActive: hides a session, never the last active one; undefined means active', () => {
  assert.equal(isActive({}), true);
  const off = setActive(SESSIONS, 'upper_c', false).sessions;
  assert.equal(isActive(off.find((s) => s.id === 'upper_c')), false);
  assert.ok(!visibleSessions(off, null).some((s) => s.id === 'upper_c'));
  assert.ok(visibleSessions(off, 'upper_c').some((s) => s.id === 'upper_c'));
  let few = SESSIONS;
  for (const id of ['upper_a', 'lower', 'upper_b']) few = setActive(few, id, false).sessions;
  assert.match(setActive(few, 'upper_c', false).error, /at least one/);
  assert.equal(setActive(few, 'upper_a', true).sessions.find((s) => s.id === 'upper_a').active, true);
});

test('normalizeTemplate keeps tags and active=false; addSession copies tags', () => {
  const stored = JSON.parse(JSON.stringify(setActive(setTags(SESSIONS, 'lower', ['heavy']).sessions, 'upper_c', false).sessions));
  const n = normalizeTemplate(stored);
  assert.deepEqual(n.find((s) => s.id === 'lower').tags, ['heavy']);
  assert.equal(n.find((s) => s.id === 'upper_c').active, false);
  assert.equal('active' in n.find((s) => s.id === 'lower'), false);
  const old = normalizeTemplate([{ id: 'x', name: 'X', exercises: [] }]);
  assert.deepEqual(old[0].tags, []);
  const copy = addSession(SESSIONS, 'Lower 2', 'lower').sessions.at(-1);
  assert.deepEqual(copy.tags, ['lower', 'legs']);
});
