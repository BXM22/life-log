import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SESSIONS } from '../src/logic/template.js';
import { nextSetInfo } from '../src/logic/restNext.js';
import { newEntry } from '../src/logic/entries.js';

const day = '2026-11-23';
const sess = SESSIONS.find((s) => s.id === 'upper_a') ?? SESSIONS[0];
const base = { wSession: sess.id, planDays: 4, wExtras: {}, activities: [], wTrims: {}, entries: [] };

test('nextSetInfo: null when no exercise is open', () => {
  assert.equal(nextSetInfo({ ...base, wEx: null }, day), null);
  assert.equal(nextSetInfo({ ...base }, day), null);
});

test('nextSetInfo: null when the index no longer exists', () => {
  assert.equal(nextSetInfo({ ...base, wEx: 999 }, day), null);
});

test('nextSetInfo: first set of the open exercise, then counts logged sets', () => {
  const ex = sess.exercises[0];
  const a = nextSetInfo({ ...base, wEx: 0 }, day);
  assert.equal(a.name, ex.name);
  assert.equal(a.setNumber, 1);
  assert.equal(a.extra, false);
  const e = newEntry('lift_set', day, { session: sess.id, exercise: ex.name, kind: 'working', weight: 100, reps: 5, seconds: null, side: null }, 1);
  const b = nextSetInfo({ ...base, wEx: 0, entries: [e] }, day);
  assert.equal(b.setNumber, 2);
});
