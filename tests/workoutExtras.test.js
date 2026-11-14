import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  checklistKey, CHECKLISTS, checkedCount, backCue, setCount, trimmedTarget, trimmedFor, bumpTrim, pruneDay,
  calisthenicsFor, isBjjDay, bjjDone, toggleBjj, bjjId, CALISTHENICS,
} from '../src/logic/workoutExtras.js';
import { parseSet } from '../src/logic/workout.js';
import { SESSIONS } from '../src/logic/template.js';

test('checklists map to sessions', () => {
  assert.equal(checklistKey({ id: 'upper_a' }), 'upper');
  assert.equal(checklistKey({ id: 'lower' }), 'lower');
  assert.equal(checklistKey({ id: 'custom1' }), null);
  assert.ok(CHECKLISTS.bjj.items.length > 0);
  assert.equal(checkedCount({ '2026-01-05|upper': { 0: true, 1: false, 2: true } }, '2026-01-05', 'upper'), 2);
  assert.equal(checkedCount({}, '2026-01-05', 'upper'), 0);
});

test('back cues only on back exercises', () => {
  assert.match(backCue('One-arm neutral-grip pulldown (straps)'), /lat isolation/);
  assert.match(backCue('Chest-supported row (semi-pronated grip)'), /hooks/);
  assert.match(backCue('Overhand lat pulldown or pull-up (straps)'), /Shoulders down/);
  assert.equal(backCue('Bench press'), null);
  assert.equal(backCue('Lateral raise'), null);
  assert.equal(backCue('Reverse pec deck'), null);
  const withCue = SESSIONS.flatMap((s) => s.exercises).filter((e) => backCue(e.name));
  assert.ok(withCue.length >= 5);
});

test('setCount and trimmedTarget', () => {
  assert.equal(setCount('3 x 6-8'), 3);
  assert.equal(setCount('3 sets'), 3);
  assert.equal(setCount('2 x 5-8 per arm'), 2);
  assert.equal(setCount('none'), null);
  assert.equal(trimmedTarget('3 x 6-8', 1), '2 x 6-8');
  assert.equal(trimmedTarget('3 sets', 2), '1 sets');
  assert.equal(trimmedTarget('2 x 5-8 per arm', 1), '1 x 5-8 per arm');
  assert.equal(trimmedTarget('3 x 6-8', 0), '3 x 6-8');
});

test('bumpTrim clamps between 0 and total-1 and keeps other keys', () => {
  let t = {};
  t = bumpTrim(t, 'd1', 'Bench', '3 x 5-8', 1);
  t = bumpTrim(t, 'd1', 'Bench', '3 x 5-8', 1);
  t = bumpTrim(t, 'd1', 'Bench', '3 x 5-8', 1);
  assert.equal(trimmedFor(t, 'd1', 'Bench', '3 x 5-8'), 2);
  t = bumpTrim(t, 'd1', 'Row', '2 x 5-8', 1);
  assert.equal(trimmedFor(t, 'd1', 'Row', '2 x 5-8'), 1);
  t = bumpTrim(t, 'd1', 'Bench', '3 x 5-8', -5);
  assert.equal(trimmedFor(t, 'd1', 'Bench', '3 x 5-8'), 0);
  assert.equal('d1|Bench' in t, false);
  assert.equal(trimmedFor(t, 'd2', 'Row', '2 x 5-8'), 0);
  assert.deepEqual(bumpTrim({}, 'd', 'X', 'none', 1), {});
});

test('pruneDay keeps only the given day', () => {
  assert.deepEqual(pruneDay({ 'a|x': 1, 'b|x': 2 }, 'a'), { 'a|x': 1 });
});

test('calisthenics: Monday push, Wednesday pull, else none', () => {
  assert.equal(calisthenicsFor('2026-11-09').id, 'push');
  assert.equal(calisthenicsFor('2026-11-11').id, 'pull');
  assert.equal(calisthenicsFor('2026-11-10'), null);
  assert.equal(isBjjDay('2026-11-09'), true);
  assert.equal(isBjjDay('2026-11-14'), false);
});

test('calisthenics exercises log through parseSet with no weight', () => {
  const pike = CALISTHENICS.push.exercises.find((e) => e.name === 'Pike push-up');
  assert.deepEqual(parseSet(pike, { reps: '7' }).data, { weight: null, reps: 7, seconds: null, side: null });
  const hold = CALISTHENICS.push.exercises.find((e) => e.mode === 'timed');
  assert.equal(parseSet(hold, { seconds: '25' }).data.seconds, 25);
  assert.ok(parseSet(hold, { seconds: '' }).error);
});

test('BJJ done check toggles one stable entry', () => {
  const date = '2026-11-09';
  assert.equal(bjjDone([], date), false);
  const a = toggleBjj([], date, 1000);
  assert.equal(a.id, bjjId(date));
  assert.equal(a.type, 'habit_check');
  assert.equal(bjjDone([a], date), true);
  const b = toggleBjj([a], date, 2000);
  assert.equal(b.id, a.id);
  assert.equal(bjjDone([b], date), false);
  assert.ok(b.updatedAt > a.updatedAt);
  const c = toggleBjj([b], date, 3000);
  assert.equal(bjjDone([c], date), true);
  assert.equal(bjjDone([a], '2026-11-11'), false);
});
