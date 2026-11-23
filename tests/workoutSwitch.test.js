import { test } from 'node:test';
import assert from 'node:assert/strict';
import { switchedFrom, pickedFor, expireSessionPick } from '../src/logic/workout.js';
import { createWorkoutSheetActions } from '../src/ui/workoutSheetActions.js';

const day = '2026-11-12'; // Thursday: Lower is planned in a 4-day week

test('switchedFrom names the planned session only while a same-day override differs from it', () => {
  assert.equal(switchedFrom({ wSession: null, planDays: 4 }, day), null);
  assert.equal(switchedFrom({ wSession: 'upper_b', wSessionDay: day, planDays: 4 }, day), 'Lower');
  assert.equal(switchedFrom({ wSession: 'lower', wSessionDay: day, planDays: 4 }, day), null); // picked the planned one
  assert.equal(switchedFrom({ wSession: 'upper_b', planDays: 4 }, day), null); // template editing, not a Switch
});

test('a pick is day-scoped: yesterday\'s pick no longer applies', () => {
  const st = { wSession: 'upper_b', wSessionDay: '2026-11-11', planDays: 4 };
  assert.equal(pickedFor(st, day), null);
  assert.equal(switchedFrom(st, day), null);
  expireSessionPick(st, day);
  assert.equal(st.wSession, null);
  assert.equal(st.wSessionDay, null);
});

test('wSessionPick and wSessionClear set and clear the today-only override', () => {
  const state = { wSession: null, planDays: 4, wSheet: 'switch' };
  const a = createWorkoutSheetActions({ state, today: () => day });
  a.wSessionPick({ dataset: { id: 'upper_b' } });
  assert.equal(state.wSession, 'upper_b');
  assert.equal(state.wSessionDay, day);
  assert.equal(state.wSheet, null);
  assert.equal(switchedFrom(state, day), 'Lower');
  a.wSessionClear();
  assert.equal(state.wSession, null);
  assert.equal(switchedFrom(state, day), null);
});

test('Manage templates in the Switch sheet opens the Templates page, also from Today', () => {
  const state = { tab: 'today', wSheet: 'switch', wSheetPick: 'upper_b', todayWin: 'log', libWin: true, restOpen: true, wEx: 2, tScreen: 'lower' };
  const a = createWorkoutSheetActions({ state, today: () => day });
  a.wOpenTemplates();
  assert.equal(state.tab, 'workout');
  assert.equal(state.tWin, true);
  assert.equal(state.wSheet, null);
  assert.equal(state.wSheetPick, null);
  assert.equal(state.todayWin, null);
  assert.equal(state.libWin, false);
  assert.equal(state.restOpen, false);
  assert.equal(state.wEx, null);
  assert.equal(state.tScreen, null);
});

// ---- F72: Switch v2 and Quick workout ----
import { createQuickWorkoutActions } from '../src/ui/quickWorkoutActions.js';
import { sessionById, getSessions, setTemplate, isQuickId, quickId, QUICK_ID } from '../src/logic/template.js';
import { sessionFromExtras } from '../src/logic/templateEdit.js';
import { activeSessionId as activeIdF72 } from '../src/logic/workout.js';

const quickActions = (state, saved = []) => createQuickWorkoutActions({ state, today: () => day, saveFail: (e) => `fail ${e.message}`, saveTemplate: async (s) => { saved.push(s); } });

test('quick sessions resolve by id, carry the chip name and are never listed', () => {
  assert.equal(sessionById(QUICK_ID).name, 'Quick workout');
  assert.equal(sessionById(quickId('push')).name, 'Quick: Push');
  assert.equal(quickId('nope'), QUICK_ID);
  assert.equal(sessionById('__quick:nope'), null);
  assert.ok(isQuickId('__quick:upper') && !isQuickId('upper_a'));
  assert.ok(!getSessions().some((s) => isQuickId(s.id)));
  assert.equal(activeIdF72('__quick:lower', day, 4), '__quick:lower');
});

test('wSwitchTo switches today in one tap and wSwitchUndo restores the old pick', () => {
  const state = { wSession: 'lower', wSessionDay: day, wSheet: 'switch' };
  const a = quickActions(state);
  a.wSwitchTo({ dataset: { id: 'upper_b' } });
  assert.equal(state.wSession, 'upper_b');
  assert.equal(state.wSheet, null);
  assert.equal(state.undo.action, 'wSwitchUndo');
  assert.match(state.msg, /Switched to Upper B/);
  a.wSwitchUndo();
  assert.equal(state.wSession, 'lower');
  assert.equal(state.undo, null);
  a.wSwitchTo({ dataset: { id: 'missing' } });
  assert.equal(state.wSession, 'lower');
});

test('wQuickStart starts a named quick workout on the Workout tab with Add exercise open', () => {
  const state = { tab: 'today', wSheet: 'switch', todayWin: 'log' };
  const a = quickActions(state);
  a.wQuickLabel({ dataset: { label: 'upper' } });
  assert.equal(state.wQuickLabel, 'upper');
  a.wQuickLabel({ dataset: { label: 'upper' } }); // tap again clears
  assert.equal(state.wQuickLabel, null);
  a.wQuickLabel({ dataset: { label: 'pull' } });
  a.wQuickStart();
  assert.equal(state.wSession, '__quick:pull');
  assert.equal(state.wSessionDay, day);
  assert.equal(state.tab, 'workout');
  assert.equal(state.wSheet, 'add');
  assert.equal(state.todayWin, null);
});

test('sessionFromExtras makes a unique template with default targets', () => {
  const extras = [{ name: 'Cable fly', mode: 'weight', target: 'as you like', warmup: 'none', done: true }];
  const r = sessionFromExtras(getSessions(), 'Upper A', extras);
  assert.equal(r.sessions.find((s) => s.id === r.id).name, 'Upper A 2');
  const ex = r.sessions.find((s) => s.id === r.id).exercises[0];
  assert.equal(ex.target, '3 sets');
  assert.equal('done' in ex, false);
  assert.ok(sessionFromExtras(getSessions(), 'X', []).error);
});

test('wSaveQuick saves today\'s extras as a template and makes it today\'s pick', async () => {
  const state = { wSession: '__quick:push', wSessionDay: day, planDays: 4, wExtras: { day, list: [{ name: 'Dip', mode: 'bodyweight', target: '3 x 10', warmup: 'none' }] } };
  const saved = [];
  const a = quickActions(state, saved);
  try {
    await a.wSaveQuick();
    assert.equal(saved.length, 1);
    const s = sessionById(state.wSession);
    assert.equal(s.name, 'Push');
    assert.equal(s.exercises[0].name, 'Dip');
    assert.deepEqual(state.wExtras.list, []);
    assert.match(state.msg, /Saved as template: Push/);
  } finally { setTemplate(null); }
  const plain = { wSession: 'lower', wSessionDay: day, planDays: 4, wExtras: { day, list: [] } };
  await quickActions(plain).wSaveQuick();
  assert.match(plain.msg, /Only a quick workout/);
});
