import { test } from 'node:test';
import assert from 'node:assert/strict';
import { learnView } from '../src/ui/learnView.js';

const day = '2026-11-16';
const areas = [{ name: 'Guitar', metricLabel: 'Best BPM', weeklyGoal: 150 }, { name: 'Coding', metricLabel: '', weeklyGoal: null }];
const mk = (type, date, data) => ({ id: type + date, type, date, data, deletedAt: null });
const base = { entries: [], areas };

test('area chips carry pickArea; more than 6 areas fall back to a drop-down', () => {
  const h = learnView(base, day);
  assert.match(h, /class="win-chip on" data-action="pickArea" data-area="Guitar" aria-pressed="true"/);
  assert.match(h, /data-action="pickArea" data-area="Coding" aria-pressed="false"/);
  assert.doesNotMatch(h, /<select id="learn-area"/);
  const c = learnView({ ...base, learn: { area: 'Coding' } }, day);
  assert.match(c, /class="win-chip on" data-action="pickArea" data-area="Coding"/);
  const many = Array.from({ length: 7 }, (_, i) => ({ name: `A${i}`, metricLabel: '', weeklyGoal: null }));
  const s = learnView({ entries: [], areas: many, learn: { area: 'A2' } }, day);
  assert.match(s, /<select id="learn-area"[^>]*data-action="pickArea"/);
  assert.match(s, /<option value="A2" selected>A2<\/option>/);
});

test('timer card only while running, with area and note', () => {
  const idle = learnView(base, day);
  const on = learnView({ ...base, practice: { startAt: Date.now() - 125000, focus: 'songs', area: 'Guitar', type: 'practice' } }, day);
  assert.doesNotMatch(idle, /timercard|id="practice-time"/);
  assert.match(on, /class="panel timercard win-learn-timer"/);
  assert.match(on, /Timer running: Guitar/);
  assert.match(on, /id="practice-time" role="timer"/);
  assert.match(on, /Practising: songs\. Stopping logs 2 min\./);
  assert.match(on, /id="pt-metric"/);
  assert.match(on, /Best BPM/);
  assert.match(on, /data-action="practiceStop"/);
  assert.match(on, /data-action="practiceDiscard"/);
  const noFocus = learnView({ ...base, practice: { startAt: Date.now(), focus: '', area: 'Coding', type: 'study' } }, day);
  assert.match(noFocus, /Practising\. Stopping logs 1 min\./);
  assert.doesNotMatch(noFocus, /pt-metric/);
});

test('START TIMER emits practiceStart and hides while running', () => {
  const idle = learnView(base, day);
  const on = learnView({ ...base, practice: { startAt: Date.now(), focus: '', area: 'Guitar', type: 'practice' } }, day);
  assert.match(idle, /data-action="practiceStart">Start timer/);
  assert.doesNotMatch(on, /Start timer/);
  for (const h of [idle, on]) assert.doesNotMatch(h, /openTimer|practicePanel|pt-bpm|pt-focus/);
});

test('type chips mark the selected one; Guitar shows the fixed line', () => {
  const h = learnView({ ...base, learn: { type: 'study', area: 'Coding' } }, day);
  assert.match(h, /class="win-chip on" data-action="pickType" data-type="study" aria-pressed="true"/);
  assert.match(h, /data-type="practice" aria-pressed="false"/);
  const g = learnView(base, day);
  assert.doesNotMatch(g, /data-action="pickType"/);
  assert.match(g, /Practice\. Guitar sessions always count as practice/);
});

test('minute chip is selected from the minutes draft', () => {
  const h = learnView({ ...base, learn: { draft: { minutes: '30' } } }, day);
  assert.match(h, /class="win-chip on" data-action="learnMin" data-min="30" aria-pressed="true">30 min/);
  assert.match(h, /data-min="15" aria-pressed="false"/);
});

test('goal text and progress, no goal shows plain minutes', () => {
  const entries = [mk('guitar', day, { minutes: 90 }), mk('study', day, { topic: 'Coding', minutes: 20 })];
  const h = learnView({ ...base, entries }, day);
  assert.match(h, /90 of 150 min/);
  assert.match(h, /style="width:60%"/);
  assert.match(h, /20 min, no weekly goal<\/span>/);
  assert.match(h, /Guitar 90 min/);
  assert.match(h, /110 minutes today/);
});

test('more details closed by default, open on request; metric uses label', () => {
  const closed = learnView(base, day);
  assert.match(closed, /data-section="more" aria-expanded="false"/);
  assert.doesNotMatch(closed, /id="learn-focus"/);
  const open = learnView({ ...base, learn: { more: true } }, day);
  assert.match(open, /aria-expanded="true"/);
  assert.match(open, /<label for="learn-metric">Best BPM \(optional\)/);
  assert.match(open, /id="learn-notes"/);
  assert.match(open, /id="focuses"/);
  const coding = learnView({ ...base, learn: { more: true, area: 'Coding' } }, day);
  assert.doesNotMatch(coding, /id="learn-metric"/);
});

test('starter chips hide ones already added', () => {
  const h = learnView({ ...base, areas: [...areas, { name: 'Reading', metricLabel: '', weeklyGoal: null }] }, day);
  assert.match(h, /data-action="addStarterArea" data-area="Language"/);
  assert.doesNotMatch(h, /addStarterArea" data-area="Reading"/);
  assert.match(h, /data-action="openAreaEdit" data-area=""/);
});

test('edit panel replaces the area list', () => {
  const h = learnView({ ...base, learn: { edit: { name: 'Guitar' } } }, day);
  assert.match(h, /id="area-name"[^>]*value="Guitar"/);
  assert.match(h, /id="area-goal"[^>]*value="150"/);
  assert.match(h, /data-action="deleteArea" data-area="Guitar"/);
  assert.match(h, /data-action="closeAreaEdit"/);
  assert.doesNotMatch(h, /Your areas this week/);
  assert.match(h, /Remove Guitar/);
  const n = learnView({ ...base, learn: { edit: { name: '' } } }, day);
  assert.doesNotMatch(n, /deleteArea/);
  assert.match(n, /data-action="saveArea"/);
});

test('recent sessions: closed by default, newest first, legacy entries', () => {
  const entries = [mk('guitar', '2026-11-10', { minutes: 10 }), mk('study', '2026-11-15', { topic: 'Law', minutes: 25 })];
  assert.doesNotMatch(learnView({ ...base, entries }, day), /2026-11-15/);
  const h = learnView({ ...base, entries, learn: { recent: true } }, day);
  assert.ok(h.indexOf('2026-11-15 Law') > -1 && h.indexOf('2026-11-15 Law') < h.indexOf('2026-11-10 Guitar'));
});

test('escapes user text and has no legacy ids', () => {
  const evil = [{ name: '<b>"x"</b>', metricLabel: '<i>', weeklyGoal: null }];
  const h = learnView({ entries: [], areas: evil, learn: { more: true, draft: { focus: '"><script>' } } }, day);
  assert.ok(!h.includes('<b>"x"') && !h.includes('<script>'));
  assert.match(h, /&lt;b&gt;/);
  for (const id of ['gm', 'gb', 'study-topic']) assert.doesNotMatch(h, new RegExp(`id="${id}"`));
  assert.match(h, /aria-label="Back to Today"/);
});

test('missing state.learn and areas are tolerated', () => {
  assert.doesNotThrow(() => learnView({ entries: [] }, day));
});

test('session entries count in Today, week progress and recent sessions', () => {
  const entries = [mk('session', day, { area: 'Guitar', type: 'practice', minutes: 30, metric: null, metricLabel: '', focus: '', notes: '' }),
    mk('session', '2026-11-15', { area: 'Coding', type: 'project', minutes: 50, metric: null, metricLabel: '', focus: '', notes: '' })];
  const h = learnView({ ...base, entries, learn: { recent: true } }, day);
  assert.match(h, /30 of 150 min/);
  assert.match(h, /Guitar 30 min/);
  assert.match(h, /30 minutes today/);
  assert.match(h, /2026-11-15 Coding<\/span><span>50 min/);
});
