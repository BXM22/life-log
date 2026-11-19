import { test } from 'node:test';
import assert from 'node:assert/strict';
import { manageHabitsSheet } from '../src/ui/manageHabitsView.js';
import { createManageHabitsActions } from '../src/ui/manageHabitsActions.js';

const habits = [{ id: 'h1', name: 'Read' }, { id: 'h2', name: '<b>Run</b>' }];

test('closed sheet renders nothing', () => {
  assert.equal(manageHabitsSheet({ habits }), '');
  assert.equal(manageHabitsSheet({ habits, manageHabits: false }), '');
});

test('open sheet lists habits with Remove, input and add button', () => {
  const html = manageHabitsSheet({ habits, manageHabits: true });
  assert.match(html, /MANAGE HABITS/);
  assert.match(html, /data-action="deleteHabit" data-habit="h1"/);
  assert.match(html, /data-action="deleteHabit" data-habit="h2"/);
  assert.match(html, /id="habitName"[^>]*maxlength="40"/);
  assert.match(html, /data-action="addHabit"/);
  assert.match(html, /data-action="closeManageHabits"/);
});

test('names are escaped', () => {
  const html = manageHabitsSheet({ habits, manageHabits: true });
  assert.ok(!html.includes('<b>Run</b>'));
  assert.ok(html.includes('&lt;b&gt;'));
});

test('empty state', () => {
  assert.match(manageHabitsSheet({ habits: [], manageHabits: true }), /No habits yet\./);
});

test('actions open and close', () => {
  const state = { msg: 'x' };
  const a = createManageHabitsActions({ state });
  a.openManageHabits();
  assert.equal(state.manageHabits, true);
  assert.equal(state.msg, '');
  a.closeManageHabits();
  assert.equal(state.manageHabits, false);
});
