import { test } from 'node:test';
import assert from 'node:assert/strict';
import { editForm, historyView } from '../src/ui/historyView.js';
import { parseEdit, editEntry } from '../src/logic/entries.js';
import { isDirty } from '../src/logic/exportBuilder.js';

const E = (type, data, extra = {}) => ({ id: 'i1', type, date: '2026-11-19', data, updatedAt: 1, exportedAt: null, exportId: null, deletedAt: null, ...extra });
const coding = { area: 'Coding', type: 'project', minutes: 45, metric: 3, metricLabel: 'PRs', focus: 'api', notes: 'ok' };

test('editForm for a session: fixed area, type, minutes, metric by label, focus, notes', () => {
  const html = editForm(E('session', coding));
  assert.match(html, /<p>Coding<\/p>/);
  for (const id of ['ed-st', 'ed-sm', 'ed-sx', 'ed-sf', 'ed-sn']) assert.ok(html.includes(`id="${id}"`), id);
  assert.match(html, /<option selected>project<\/option>/);
  assert.match(html, /aria-label="PRs"/);
  assert.ok(!html.includes('ed-d'));
});

test('editForm metric: hidden without a label, "Best BPM" for Guitar', () => {
  assert.ok(!editForm(E('session', { ...coding, metricLabel: '' })).includes('ed-sx'));
  const g = editForm(E('session', { ...coding, area: 'Guitar', metricLabel: '' }));
  assert.match(g, /id="ed-sx"/);
  assert.match(g, /Best BPM/);
});

test('history rows: sessions get EDIT, study does not', () => {
  const state = (e) => ({ entries: [e], stats: null, histWin: 'entries', editId: null, dayStartHour: 0 });
  assert.match(historyView(state(E('session', coding))), /data-action="startEdit"/);
  assert.ok(!historyView(state(E('study', { topic: 'x', kind: 'prep', minutes: 5 }))).includes('startEdit'));
});

test('round trip: exported session edited is dirty again, area unchanged, bad minutes refused', () => {
  const exported = E('session', coding, { updatedAt: 5, exportedAt: 10, exportId: 'x' });
  assert.equal(isDirty(exported), false);
  const r = parseEdit(exported, { sessionType: 'review', sessionMinutes: '50', metric: '', sessionFocus: '', notes: '' });
  assert.ok(!r.error);
  const edited = editEntry(exported, r.data, 7);
  assert.equal(isDirty(edited), true);
  assert.equal(edited.data.area, 'Coding');
  assert.equal(edited.data.metricLabel, 'PRs');
  assert.equal(edited.data.type, 'review');
  assert.equal(edited.data.minutes, 50);
  assert.equal(edited.data.metric, null);
  assert.ok(parseEdit(exported, { sessionType: 'review', sessionMinutes: '0' }).error);
});
