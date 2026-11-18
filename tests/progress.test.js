import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newEntry } from '../src/logic/entries.js';
import { prCheck, prsOn, liftSummary, pickLift, oneRmSeries, recentLifts, habitHeatmap, goalProjection } from '../src/logic/progress.js';
import { toggleCheck } from '../src/logic/habits.js';

const lift = (exercise, weight, reps, date, extra = {}) => newEntry('lift_set', date, { session: 'upper_a', exercise, kind: 'working', weight, reps, seconds: null, side: null, ...extra }, 1);
const TODAY = '2026-11-15'; // a Sunday

test('prCheck flags a set that beats earlier est. 1RM, not a first set or a worse one', () => {
  const old = lift('Bench', 100, 5, '2026-11-01');
  const better = lift('Bench', 110, 5, TODAY);
  const pr = prCheck([old, better], better, null);
  assert.equal(pr.exercise, 'Bench');
  assert.equal(pr.value, 128);
  assert.equal(pr.previous, 117);
  const worse = lift('Bench', 90, 5, TODAY);
  assert.equal(prCheck([old, worse], worse, null), null);
  const first = lift('Squat', 200, 5, TODAY);
  assert.equal(prCheck([first], first, null), null);
});

test('prCheck uses records kept through wipe, ignores warm-ups and other lifts', () => {
  const stats = { records: { lifts: { Bench: [{ value: 200, unit: '1RM', text: '', date: '2026-01-01' }] } } };
  const e = lift('Bench', 110, 5, TODAY);
  assert.equal(prCheck([e], e, stats), null);
  const w = lift('Bench', 300, 5, TODAY, { kind: 'warmup' });
  assert.equal(prCheck([lift('Bench', 100, 5, '2026-11-01'), w], w, null), null);
});

test('prCheck handles hold seconds and ignores deleted sets', () => {
  const a = lift('Plank', null, null, '2026-11-01', { seconds: 60 });
  const b = lift('Plank', null, null, TODAY, { seconds: 70 });
  assert.equal(prCheck([a, b], b, null).unit, 'sec');
  const gone = { ...lift('Bench', 500, 5, '2026-11-01'), deletedAt: 5 };
  const n = lift('Bench', 100, 5, TODAY);
  assert.equal(prCheck([gone, n], n, null), null);
});

test('oneRmSeries gives 8 weekly bests, oldest first, null for empty weeks', () => {
  const s = oneRmSeries([lift('Bench', 100, 5, '2026-11-09'), lift('Bench', 110, 5, '2026-11-10'), lift('Bench', 90, 5, '2026-10-01')], 'Bench', TODAY);
  assert.equal(s.length, 8);
  assert.equal(s[7].weekStart, '2026-11-09');
  assert.equal(s[7].best, 128);
  assert.equal(s[6].best, null);
  assert.equal(s[0].weekStart, '2026-09-21');
});

test('recentLifts lists lifts in the window only', () => {
  const names = recentLifts([lift('Bench', 100, 5, TODAY), lift('Old', 100, 5, '2025-01-01')], TODAY);
  assert.deepEqual(names, ['Bench']);
});

test('habitHeatmap is 5 weeks x 7, levels follow the share of habits done', () => {
  const habits = [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }];
  const entries = [toggleCheck([], habits[0], TODAY, 1), toggleCheck([], habits[0], '2026-11-14', 1), toggleCheck([], habits[1], '2026-11-14', 1)];
  const h = habitHeatmap(entries, habits, TODAY);
  assert.equal(h.length, 5);
  assert.equal(h[0][0].date, '2026-10-12');
  const last = h[4];
  assert.equal(last[6].date, TODAY);
  assert.equal(last[6].level, 2);
  assert.equal(last[5].level, 4);
  assert.equal(last[0].level, 0);
  assert.equal(habitHeatmap([], [], TODAY)[0][0].level, 0);
});

test('habitHeatmap marks future days', () => {
  const h = habitHeatmap([], [{ id: 'a', name: 'A' }], '2026-11-11');
  assert.equal(h[4][2].future, false);
  assert.equal(h[4][3].future, true);
});

test('goalProjection extrapolates a losing trend to 170', () => {
  const hist = [['2026-10-19', 180], ['2026-10-26', 179], ['2026-11-02', 178], ['2026-11-09', 177]].map(([date, weight_lb]) => ({ date, weight_lb }));
  const p = goalProjection(hist, '2026-11-10');
  assert.equal(p.status, 'ontrack');
  assert.equal(p.perWeek, -1);
  assert.equal(p.etaDate, '2026-12-28');
});

test('goalProjection statuses: none, reached, few, wrong', () => {
  assert.equal(goalProjection([], TODAY).status, 'none');
  assert.equal(goalProjection([{ date: TODAY, weight_lb: 169 }], TODAY).status, 'reached');
  assert.equal(goalProjection([{ date: TODAY, weight_lb: 175 }], TODAY).status, 'few');
  const up = [['2026-10-25', 175], ['2026-11-01', 176], ['2026-11-10', 178]].map(([date, weight_lb]) => ({ date, weight_lb }));
  assert.equal(goalProjection(up, TODAY).status, 'wrong');
});

test('liftSummary and pickLift drive the Lift progress window', () => {
  const es = [lift('Bench', 100, 5, '2026-10-05'), lift('Bench', 110, 5, TODAY)];
  const s = liftSummary(es, 'Bench', TODAY);
  assert.equal(s.first, 117);
  assert.equal(s.latest, 128);
  assert.equal(s.delta, 11);
  assert.equal(s.lastWeek, '2026-11-09');
  assert.equal(liftSummary(es, 'Squat', TODAY).latest, null);
  assert.equal(liftSummary([lift('Bench', 100, 5, TODAY)], 'Bench', TODAY).delta, null);
  assert.equal(pickLift(['Bench', 'Row'], 'Row'), 'Row');
  assert.equal(pickLift(['Bench', 'Row'], 'Gone'), 'Bench');
  assert.equal(pickLift([], 'Bench'), null);
});

test('prsOn finds lifts whose best today beats everything before today', () => {
  const entries = [lift('Bench', 100, 5, '2026-11-01'), lift('Bench', 110, 5, TODAY), lift('Bench', 90, 5, TODAY), lift('Squat', 200, 5, TODAY), lift('Row', 100, 5, '2026-11-01'), lift('Row', 90, 5, TODAY)];
  const prs = prsOn(entries, null, TODAY);
  assert.deepEqual(prs.map((p) => [p.exercise, p.value, p.previous]), [['Bench', 128, 117]]); // Squat has no earlier result, Row is lower
  const stats = { records: { lifts: { Bench: [{ value: 200, unit: '1RM', text: '', date: '2026-01-01' }] } } };
  assert.deepEqual(prsOn(entries, stats, TODAY), []);
});
