import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadActivities, saveActivities, activitiesFor, caliBlockFor, bjjScheduled, addActivity, updateActivity, removeActivity,
  activityLog, activityStatus, applyActivityChange, parseDistance, parseReps, activityEntryId, findActivity } from '../src/logic/activities.js';

const mem = (init) => { const m = new Map(init); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }; };
const MON = '2026-11-16'; const TUE = '2026-11-17'; const WED = '2026-11-18';

test('defaults are BJJ and Calisthenics; a saved empty list stays empty', () => {
  assert.deepEqual(loadActivities(mem()).map((a) => a.id), ['bjj', 'cali']);
  const s = mem(); saveActivities(s, []);
  assert.deepEqual(loadActivities(s), []);
  assert.deepEqual(loadActivities(mem([['lifelog.activities', '{bad']])).map((a) => a.id), ['bjj', 'cali']);
});

test('activitiesFor follows the days; calisthenics follows its block', () => {
  const list = loadActivities(mem());
  assert.deepEqual(activitiesFor(list, MON).map((a) => a.id), ['bjj', 'cali']);
  assert.deepEqual(activitiesFor(list, TUE), []);
  const r = addActivity(list, { name: 'Run', days: [2, 6], distance: true, done: true, unit: 'km' }, () => 'run');
  assert.deepEqual(activitiesFor(r.list, TUE).map((a) => a.id), ['run']);
});

test('caliBlockFor and bjjScheduled go away when the activity is removed or off that day', () => {
  const list = loadActivities(mem());
  assert.equal(caliBlockFor(list, MON).id, 'push');
  assert.equal(caliBlockFor(removeActivity(list, 'cali'), MON), null);
  assert.equal(bjjScheduled(list, WED), true);
  assert.equal(bjjScheduled(list, TUE), false);
  assert.equal(bjjScheduled(removeActivity(list, 'bjj'), MON), false);
  assert.equal(caliBlockFor(undefined, WED).id, 'pull');
});

test('addActivity validates name, duplicates, what to log, and the cap', () => {
  const list = loadActivities(mem());
  assert.match(addActivity(list, { name: ' ', done: true }).error, /name/);
  assert.match(addActivity(list, { name: 'bjj', done: true }).error, /already/);
  assert.match(addActivity(list, { name: 'Bike' }).error, /at least one/);
  const ok = addActivity(list, { name: '  Bike   ride ', days: [6, 6, 9, 'x'], distance: true }, () => 'b');
  assert.deepEqual(ok.list.at(-1), { id: 'b', name: 'Bike ride', days: [6], done: false, distance: true, sets: false, unit: 'mi' });
  let big = []; for (let i = 0; i < 12; i++) big = addActivity(big, { name: `A${i}`, done: true }).list;
  assert.match(addActivity(big, { name: 'X', done: true }).error, /up to 12/);
});

test('updateActivity edits fields; calisthenics only renames', () => {
  const list = loadActivities(mem());
  assert.deepEqual(updateActivity(list, 'bjj', { name: 'Judo', days: [2], done: true }).list[0].days, [2]);
  const c = updateActivity(list, 'cali', { name: 'Cali', days: [5], done: false }).list[1];
  assert.deepEqual([c.name, c.days], ['Cali', [1, 3]]);
  assert.match(updateActivity(list, 'zzz', { name: 'x', done: true }).error, /no longer/);
});

test('logging: one stable entry per activity per day, BJJ keeps its old id and habit', () => {
  const run = addActivity([], { name: 'Run', distance: true, sets: true, unit: 'km' }, () => 'run').list[0];
  const e1 = applyActivityChange([], run, TUE, { distance: 5.2 }, 10);
  assert.equal(e1.id, 'act-run-2026-11-17');
  assert.deepEqual(e1.data, { habit: 'Run', done: false, distance: 5.2, unit: 'km' });
  const e2 = applyActivityChange([e1], run, TUE, { sets: [10, 8] }, 20);
  assert.equal(e2.id, e1.id);
  assert.deepEqual(activityLog([e2], run, TUE), { done: false, distance: 5.2, unit: 'km', sets: [10, 8] });
  assert.equal(activityStatus([e2], run, TUE), '5.2 km · 2 sets');
  assert.equal(activityStatus([], run, TUE), 'Not yet');
  const bjj = findActivity(undefined, 'bjj');
  const b = applyActivityChange([], bjj, MON, { done: true }, 5);
  assert.equal(b.id, activityEntryId(bjj, MON));
  assert.equal(b.id, 'bjj-2026-11-16');
  assert.equal(b.data.habit, 'BJJ');
  assert.equal(activityStatus([b], bjj, MON), 'Done');
});

test('parseDistance and parseReps', () => {
  assert.deepEqual(parseDistance(''), { value: null });
  assert.deepEqual(parseDistance('3.456'), { value: 3.46 });
  assert.ok(parseDistance('0').error && parseDistance('abc').error && parseDistance('1001').error);
  assert.deepEqual(parseReps('12'), { value: 12 });
  assert.ok(parseReps('0').error && parseReps('2.5').error && parseReps('').error);
});
