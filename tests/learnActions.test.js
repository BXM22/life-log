import test from 'node:test';
import assert from 'node:assert/strict';
import { createLearnActions } from '../src/ui/learnActions.js';

function setup({ fail = false, inputs = {} } = {}) {
  const state = { entries: [], msg: '', areas: [{ name: 'Guitar', metricLabel: 'Best BPM', weeklyGoal: 150 }, { name: 'Coding', metricLabel: '', weeklyGoal: null }], learn: { area: 'Guitar', type: 'practice', more: false, recent: false, edit: null, draft: null } };
  const saved = [];
  const t = { state, saved, persisted: 0 };
  t.a = createLearnActions({
    state,
    saveEntries: async (e) => { if (fail) throw new Error('boom'); saved.push(...e); },
    saveFail: (err) => 'Save failed: ' + err.message,
    inputValue: (id) => (id in inputs ? inputs[id] : ''),
    today: () => '2026-11-19',
    persistAreas: () => { t.persisted++; },
  });
  return t;
}

test('logSession success saves then mutates', async () => {
  const t = setup({ inputs: { 'learn-min': '30' } });
  t.state.learn.draft = { minutes: '30' };
  await t.a.logSession();
  assert.equal(t.saved.length, 1);
  assert.equal(t.state.entries.length, 1);
  assert.equal(t.state.learn.draft, null);
  assert.match(t.state.msg, /Saved/);
});

test('logSession refusal keeps draft, no save', async () => {
  const t = setup({ inputs: { 'learn-min': '0', 'learn-notes': 'x' } });
  await t.a.logSession();
  assert.equal(t.saved.length, 0);
  assert.equal(t.state.entries.length, 0);
  assert.equal(t.state.learn.draft.notes, 'x');
  assert.ok(t.state.msg);
});

test('logSession save failure leaves entries untouched', async () => {
  const t = setup({ fail: true, inputs: { 'learn-min': '20' } });
  await t.a.logSession();
  assert.equal(t.state.entries.length, 0);
  assert.equal(t.state.learn.draft.minutes, '20');
  assert.equal(t.state.msg, 'Save failed: boom');
});

test('logSession with no areas', async () => {
  const t = setup();
  t.state.areas = [];
  await t.a.logSession();
  assert.equal(t.state.msg, 'Add an area first.');
});

test('saveArea add', () => {
  const t = setup({ inputs: { 'area-name': 'Reading', 'area-metric': 'Pages', 'area-goal': '60' } });
  t.a.openAreaEdit({ dataset: {} });
  t.a.saveArea();
  assert.equal(t.state.areas.length, 3);
  assert.equal(t.state.areas[2].weeklyGoal, 60);
  assert.equal(t.state.learn.edit, null);
  assert.equal(t.persisted, 1);
});

test('saveArea rename', () => {
  const t = setup({ inputs: { 'area-name': 'Guitar 2', 'area-metric': '', 'area-goal': '' } });
  t.state.entries.push({ data: { area: 'Guitar' } });
  t.a.openAreaEdit({ dataset: { area: 'Guitar' } });
  t.a.saveArea();
  assert.equal(t.state.areas[0].name, 'Guitar 2');
  assert.equal(t.state.areas[0].weeklyGoal, null);
  assert.equal(t.state.entries[0].data.area, 'Guitar');
});

test('saveArea duplicate stays open', () => {
  const t = setup({ inputs: { 'area-name': 'coding', 'area-metric': '', 'area-goal': '' } });
  t.a.openAreaEdit({ dataset: {} });
  t.a.saveArea();
  assert.equal(t.state.areas.length, 2);
  assert.ok(t.state.msg);
  assert.deepEqual(t.state.learn.edit, { name: '' });
  assert.equal(t.persisted, 0);
});

test('deleteArea fixes selection and keeps entries', () => {
  const t = setup();
  t.state.entries.push({ id: 1 });
  t.a.openAreaEdit({ dataset: { area: 'Guitar' } });
  t.a.deleteArea({ dataset: { area: 'Guitar' } });
  assert.equal(t.state.areas.length, 1);
  assert.equal(t.state.learn.area, 'Coding');
  assert.equal(t.state.learn.edit, null);
  assert.equal(t.state.entries.length, 1);
  assert.equal(t.persisted, 1);
});

test('toggleLearn, pickArea, pickType, quickMin, starter, lazy init', () => {
  const t = setup();
  t.a.toggleLearn({ dataset: { section: 'more' } });
  assert.equal(t.state.learn.more, true);
  t.a.toggleLearn({ dataset: { section: 'recent' } });
  t.a.toggleLearn({ dataset: { section: 'recent' } });
  assert.equal(t.state.learn.recent, false);
  t.a.pickArea({ value: 'Coding' });
  assert.equal(t.state.learn.area, 'Coding');
  t.a.pickType({ dataset: { type: 'study' } });
  t.a.pickType({ dataset: { type: 'nope' } });
  assert.equal(t.state.learn.type, 'study');
  t.a.quickMin({ dataset: { min: '45' } });
  assert.equal(t.state.learn.draft.minutes, '45');
  t.a.addStarterArea({ dataset: { area: 'Reading' } });
  assert.equal(t.state.areas.at(-1).name, 'Reading');
  t.state.learn = undefined;
  t.a.toggleLearn({ dataset: { section: 'more' } });
  assert.equal(t.state.learn.more, true);
});
