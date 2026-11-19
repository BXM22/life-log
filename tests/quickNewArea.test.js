import { test } from 'node:test';
import assert from 'node:assert/strict';
import { quickAddSheet } from '../src/ui/quickAddView.js';
import { createTodayActions } from '../src/ui/todayActions.js';
import { quickAreas, NEW_AREA } from '../src/logic/quickAdd.js';

const areas = () => [{ name: 'Guitar', metricLabel: 'Best BPM', weeklyGoal: null }, { name: 'Coding', metricLabel: '', weeklyGoal: null }];

function setup({ fail = false, inputs = {} } = {}) {
  const state = { entries: [], msg: '', areas: areas(), quick: { kind: 'session', draft: {} } };
  const t = { state, saved: [], persisted: 0 };
  t.a = createTodayActions({
    state,
    saveEntries: async (e) => { if (fail) throw new Error('boom'); t.saved.push(...e); },
    saveFail: (err) => 'Save failed: ' + err.message,
    inputValue: (id) => (id in inputs ? inputs[id] : ''),
    today: () => '2026-11-19',
    persistAreas: () => { t.persisted++; },
  });
  return t;
}
const sheet = (area) => quickAddSheet({ areas: areas(), entries: [], quick: { kind: 'session', draft: { area } } });

test('view: option always there, name input only when selected', () => {
  assert.match(sheet('Guitar'), /<option value="__new__">\+ New area\.\.\.<\/option>/);
  assert.doesNotMatch(sheet('Guitar'), /id="qa-newarea"/);
  const h = sheet(NEW_AREA);
  assert.match(h, /<option value="__new__" selected>/);
  assert.match(h, /id="qa-newarea"[^>]*maxlength="60"/);
  assert.match(h, /id="qa-metricLabel" type="hidden" value=""/);
  assert.doesNotMatch(h, /id="qa-metric"/);
});

test('quickAreas never lists __new__', () => {
  assert.ok(!quickAreas(areas(), []).some((a) => a.name === NEW_AREA));
});

test('save with new area adds area, then the session', async () => {
  const t = setup({ inputs: { 'qa-area': NEW_AREA, 'qa-newarea': '  Reading ', 'qa-minutes': '25', 'qa-type': 'study' } });
  await t.a.saveQuick();
  assert.equal(t.persisted, 1);
  assert.deepEqual(t.state.areas[2], { name: 'Reading', metricLabel: '', weeklyGoal: null });
  assert.equal(t.saved.length, 1);
  assert.equal(t.saved[0].data.area, 'Reading');
  assert.equal(t.saved[0].data.minutes, 25);
  assert.equal(t.state.entries.length, 1);
  assert.equal(t.state.quick, null);
});

test('empty and duplicate names are refused, nothing saved', async () => {
  for (const name of ['', '  ', 'guitar']) {
    const t = setup({ inputs: { 'qa-area': NEW_AREA, 'qa-newarea': name, 'qa-minutes': '25' } });
    await t.a.saveQuick();
    assert.equal(t.saved.length, 0);
    assert.equal(t.persisted, 0);
    assert.equal(t.state.areas.length, 2);
    assert.ok(t.state.msg);
    assert.equal(t.state.quick.draft.newarea, name);
  }
});

test('bad minutes with a valid new name adds nothing', async () => {
  const t = setup({ inputs: { 'qa-area': NEW_AREA, 'qa-newarea': 'Reading', 'qa-minutes': '0' } });
  await t.a.saveQuick();
  assert.equal(t.state.areas.length, 2);
  assert.equal(t.persisted, 0);
  assert.equal(t.saved.length, 0);
  assert.ok(t.state.quick);
});

test('entry save failure keeps the area and the sheet', async () => {
  const t = setup({ fail: true, inputs: { 'qa-area': NEW_AREA, 'qa-newarea': 'Reading', 'qa-minutes': '25' } });
  await t.a.saveQuick();
  assert.equal(t.state.areas.length, 3);
  assert.equal(t.persisted, 1);
  assert.equal(t.state.entries.length, 0);
  assert.equal(t.state.msg, 'Save failed: boom');
  assert.equal(t.state.quick.draft.area, 'Reading');
});

test('quickArea keeps the typed new-area name', () => {
  const t = setup({ inputs: { 'qa-newarea': 'Read', 'qa-minutes': '10' } });
  globalThis.document = { getElementById: (id) => (id === 'qa-newarea' || id === 'qa-minutes' ? {} : null) };
  try {
    t.a.quickArea({ value: 'Guitar' });
    assert.equal(t.state.quick.draft.area, 'Guitar');
    assert.equal(t.state.quick.draft.newarea, 'Read');
    assert.equal(t.state.quick.draft.minutes, '10');
  } finally { delete globalThis.document; }
});

test('normal session still works without persistAreas', async () => {
  const t = setup({ inputs: { 'qa-area': 'Coding', 'qa-minutes': '30' } });
  await t.a.saveQuick();
  assert.equal(t.persisted, 0);
  assert.equal(t.saved.length, 1);
});
