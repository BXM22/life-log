import { test } from 'node:test';
import assert from 'node:assert/strict';

const store = new Map();
globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v), removeItem: (k) => store.delete(k) };
globalThis.document = { getElementById: () => null };
let confirmAnswer = true;
globalThis.window = { confirm: () => confirmAnswer };

const { createPracticeActions } = await import('../src/ui/practiceActions.js');
const { PRACTICE_KEY } = await import('../src/logic/practiceTimer.js');

function make({ stored, inputs = {}, saveError } = {}) {
  store.clear();
  if (stored) store.set(PRACTICE_KEY, JSON.stringify(stored));
  const saved = [];
  const state = { entries: [], msg: '', areas: [{ name: 'Guitar', metricLabel: 'Best BPM' }, { name: 'Coding', metricLabel: 'Commits' }], learn: {} };
  const api = createPracticeActions({
    state,
    saveEntries: async (es) => { if (saveError) throw new Error('boom'); saved.push(...es); },
    saveFail: (e) => `fail: ${e.message}`,
    inputValue: (id) => inputs[id] ?? '',
    today: () => '2026-11-19',
  });
  return { state, api, saved };
}

test('start uses the Learn area/type and focus; stop saves a session entry', async () => {
  const { state, api, saved } = make({ inputs: { 'learn-focus': 'scales', 'pt-metric': '120' } });
  state.learn = { area: 'Guitar', type: 'practice' };
  api.actions.practiceStart();
  assert.equal(state.practice.area, 'Guitar');
  assert.equal(state.practice.focus, 'scales');
  state.practice.startAt = Date.now() - 20 * 60_000;
  await api.actions.practiceStop();
  assert.equal(saved.length, 1);
  assert.equal(state.entries[0].type, 'session');
  assert.deepEqual({ ...state.entries[0].data }, { area: 'Guitar', type: 'practice', minutes: 20, metric: 120, metricLabel: 'Best BPM', focus: 'scales', notes: '' });
  assert.equal(state.practice.startAt, null);
  assert.equal(state.msg, 'Saved 20 min of Guitar.');
  assert.equal(store.get(PRACTICE_KEY), undefined);
});

test('start defaults to first area and practice when Learn has no selection', () => {
  const { state, api } = make();
  state.learn = undefined;
  api.actions.practiceStart();
  assert.equal(state.practice.area, 'Guitar');
  assert.equal(state.practice.type, 'practice');
  state.areas = [{ name: 'Coding' }];
  api.actions.practiceStart();
  assert.equal(state.practice.area, 'Coding');
  api.actions.practiceDiscard(); // clears the ticking interval so the test process can exit
});

test('old-shape stored timer loads as Guitar/practice and stops cleanly', async () => {
  const { state, api, saved } = make({ stored: { startAt: Date.now() - 5 * 60_000, focus: 'old' } });
  assert.equal(state.practice.area, 'Guitar');
  assert.equal(state.practice.type, 'practice');
  await api.actions.practiceStop();
  assert.equal(saved[0].data.area, 'Guitar');
  assert.equal(saved[0].data.minutes, 5);
});

test('non-guitar area uses its own metric label', async () => {
  const { state, api, saved } = make({ inputs: { 'pt-metric': '7' } });
  state.learn = { area: 'coding', type: 'project' };
  api.actions.practiceStart();
  state.practice.startAt = Date.now() - 60_000;
  await api.actions.practiceStop();
  assert.equal(saved[0].data.metricLabel, 'Commits');
  assert.equal(saved[0].data.metric, 7);
  assert.equal(saved[0].data.type, 'project');
});

test('a bad Best BPM keeps the timer running with a message', async () => {
  const { state, api, saved } = make({ inputs: { 'pt-metric': '5' } });
  api.actions.practiceStart();
  const startAt = state.practice.startAt;
  await api.actions.practiceStop();
  assert.equal(saved.length, 0);
  assert.match(state.msg, /BPM/);
  assert.equal(state.practice.startAt, startAt);
  assert.ok(store.get(PRACTICE_KEY));
  api.actions.practiceDiscard();
});

test('a failed save keeps the timer running', async () => {
  const { state, api } = make({ saveError: true });
  api.actions.practiceStart();
  await api.actions.practiceStop();
  assert.equal(state.msg, 'fail: boom');
  assert.notEqual(state.practice.startAt, null);
  assert.equal(state.entries.length, 0);
  api.actions.practiceDiscard();
});

test('discard confirms, goes idle and persists', () => {
  const { state, api } = make();
  api.actions.practiceStart();
  confirmAnswer = false;
  api.actions.practiceDiscard();
  assert.notEqual(state.practice.startAt, null);
  confirmAnswer = true;
  api.actions.practiceDiscard();
  assert.equal(state.practice.startAt, null);
  assert.equal(state.msg, 'Practice discarded.');
  assert.equal(store.get(PRACTICE_KEY), undefined);
});
