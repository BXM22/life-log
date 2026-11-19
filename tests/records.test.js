import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newEntry } from '../src/logic/entries.js';
import { est1RM, bestSet, recentBest, mergeRecords, recordsMarkdown, emptyRecords, TOP_N } from '../src/logic/records.js';
import { computeStats, emptyStats } from '../src/logic/retainedStats.js';
import { buildExport } from '../src/logic/exportBuilder.js';

const lift = (exercise, weight, reps, date, at = 1) => newEntry('lift_set', date, { session: 'upper_a', exercise, kind: 'working', weight, reps, seconds: null, side: null }, at);

test('est1RM uses weight x (1 + reps / 30)', () => {
  assert.equal(est1RM(100, 8), 127);
  assert.equal(est1RM(125, 3), 138);
});

test('lifts rank by estimated 1RM, top 5 only, warm-ups ignored', () => {
  const entries = [100, 105, 110, 115, 120, 125, 130].map((w, i) => lift('Bench', w, 5, `2026-11-0${i + 1}`));
  entries.push({ ...lift('Bench', 300, 5, '2026-11-09'), data: { ...lift('Bench', 300, 5, '2026-11-09').data, kind: 'warmup' } });
  const rec = mergeRecords(null, entries);
  assert.equal(rec.lifts.Bench.length, TOP_N);
  assert.equal(rec.lifts.Bench[0].text, '130 x 5');
  assert.equal(rec.lifts.Bench[4].text, '110 x 5');
});

test('bodyweight ranks lowest first; guitar by best BPM per focus; longest practice', () => {
  const entries = [
    newEntry('weigh_in', '2026-11-01', { weight_lb: 183 }, 1), newEntry('weigh_in', '2026-11-02', { weight_lb: 181.5 }, 2),
    newEntry('guitar', '2026-11-01', { minutes: 30, focus: 'Scales', best_bpm: 90 }, 1), newEntry('guitar', '2026-11-02', { minutes: 45, focus: 'Scales', best_bpm: 100 }, 2),
  ];
  const rec = mergeRecords(null, entries);
  assert.deepEqual(rec.bodyweight.map((r) => r.value), [181.5, 183]);
  assert.equal(rec.guitar.Scales[0].value, 100);
  assert.equal(rec.session[0].value, 45);
});

test('timed holds rank by longest time, bodyweight moves by most reps', () => {
  const hold = newEntry('lift_set', '2026-11-01', { session: 's', exercise: 'Handstand', kind: 'working', weight: null, reps: null, seconds: 25, side: null }, 1);
  const pull = lift('Pull-up', null, 7, '2026-11-01');
  const rec = mergeRecords(null, [hold, pull]);
  assert.equal(rec.lifts.Handstand[0].unit, 'sec');
  assert.equal(rec.lifts['Pull-up'][0].value, 7);
});

test('records survive a wipe: computeStats keeps them after the entries are gone', () => {
  const stats = computeStats([lift('Bench', 100, 8, '2026-11-01')], emptyStats(), 5);
  assert.equal(stats.records.lifts.Bench[0].text, '100 x 8');
  const after = computeStats([], stats, 9);
  assert.equal(after.records.lifts.Bench[0].text, '100 x 8');
  assert.equal(mergeRecords(after.records, [lift('Bench', 100, 9, '2026-11-08')]).lifts.Bench[0].text, '100 x 9');
});

test('a deleted entry is not a new record, and an old kept one stays', () => {
  const gone = { ...lift('Bench', 400, 5, '2026-11-02'), deletedAt: 5 };
  const rec = mergeRecords({ ...emptyRecords(), lifts: { Bench: [{ value: 127, unit: '1RM', text: '100 x 8', date: '2026-11-01' }] } }, [gone]);
  assert.equal(rec.lifts.Bench.length, 1);
});

test('recordsMarkdown and the export end with a Personal records section', () => {
  const rec = mergeRecords(null, [lift('Bench', 100, 8, '2026-11-01')]);
  const md = recordsMarkdown(rec).join('\n');
  assert.match(md, /## Personal records\n\n### Bench\n1\. 100 x 8 \(est\. 1RM 127\), 2026-11-01/);
  const out = buildExport([lift('Bench', 100, 8, '2026-11-01')], { now: Date.parse('2026-11-10T12:00:00'), recordsMd: recordsMarkdown(rec) });
  assert.match(out.markdown, /## Workout[\s\S]*## Personal records/);
  assert.equal(recordsMarkdown(emptyRecords()).length, 0);
});

test('bestSet gives the heaviest weighted set and its est. 1RM, not the best 1RM', () => {
  const entries = [lift('Bench', 185, 1, '2026-11-01'), lift('Bench', 155, 10, '2026-11-02'), lift('Bench', 185, 3, '2026-11-03')];
  const b = bestSet(entries, null, 'Bench');
  assert.equal(b.kind, 'weight');
  assert.equal(b.text, '185 x 3');
  assert.equal(b.est1rm, est1RM(185, 3));
  assert.equal(b.date, '2026-11-03');
});

test('bestSet ignores warm-ups, deleted sets and other lifts; uses kept records after a wipe', () => {
  const warm = { ...lift('Bench', 300, 5, '2026-11-04'), data: { ...lift('Bench', 300, 5, '2026-11-04').data, kind: 'warmup' } };
  const gone = { ...lift('Bench', 400, 5, '2026-11-04'), deletedAt: 9 };
  assert.equal(bestSet([warm, gone, lift('Squat', 300, 5, '2026-11-04')], null, 'Bench'), null);
  const stats = { records: { lifts: { Bench: [{ value: 216, unit: '1RM', text: '185 x 5', date: '2026-01-01' }] } } };
  const b = bestSet([lift('Bench', 135, 8, '2026-11-05')], stats, 'Bench');
  assert.equal(b.text, '185 x 5');
  assert.equal(b.est1rm, est1RM(185, 5));
});

test('bestSet falls back to reps, then seconds', () => {
  const reps = newEntry('lift_set', '2026-11-01', { session: 'x', exercise: 'Dips', kind: 'working', weight: null, reps: 12, seconds: null, side: null }, 1);
  assert.equal(bestSet([reps], null, 'Dips').kind, 'reps');
  const hold = newEntry('lift_set', '2026-11-01', { session: 'x', exercise: 'Plank', kind: 'working', weight: null, reps: null, seconds: 70, side: null }, 1);
  assert.deepEqual([bestSet([hold], null, 'Plank').kind, bestSet([hold], null, 'Plank').text], ['sec', '70 sec']);
});

test('recentBest: best set of each of the last sessions before today, newest first', () => {
  const entries = [
    lift('Bench', 175, 6, '2026-10-27'), lift('Bench', 135, 12, '2026-10-27'),
    lift('Bench', 180, 5, '2026-11-03'), lift('Bench', 185, 5, '2026-11-10'), lift('Bench', 190, 5, '2026-11-17'),
    lift('Bench', 165, 5, '2026-10-20'), lift('Squat', 300, 5, '2026-11-10'),
  ];
  const r = recentBest(entries, 'Bench', '2026-11-17', 3);
  assert.deepEqual(r.map((x) => x.date), ['2026-11-10', '2026-11-03', '2026-10-27']); // today and older than 3 sessions left out
  assert.equal(r[0].text, '185 x 5');
  assert.equal(r[2].text, '175 x 6'); // heaviest that day, not the highest reps
  assert.equal(r[0].est1rm, est1RM(185, 5));
});

test('recentBest: ignores warm-ups and deleted sets, handles reps-only and holds', () => {
  const warm = { ...lift('Bench', 300, 5, '2026-11-01'), data: { ...lift('Bench', 300, 5, '2026-11-01').data, kind: 'warmup' } };
  const gone = { ...lift('Bench', 300, 5, '2026-11-02'), deletedAt: 9 };
  assert.deepEqual(recentBest([warm, gone], 'Bench', '2026-11-17'), []);
  const dips = newEntry('lift_set', '2026-11-01', { session: 'x', exercise: 'Dips', kind: 'working', weight: null, reps: 12, seconds: null, side: null }, 1);
  assert.equal(recentBest([dips], 'Dips', '2026-11-17')[0].est1rm, null);
});

test('Guitar-area sessions rank like guitar entries (BPM by focus, longest practice); other areas do not', () => {
  const s = (area, date, minutes, focus, metric) => newEntry('session', date, { area, type: 'practice', minutes, metric, metricLabel: 'Best BPM', focus, notes: '' }, 1);
  const rec = mergeRecords(null, [
    newEntry('guitar', '2026-11-01', { minutes: 30, focus: 'Scales', best_bpm: 90 }, 1),
    s('Guitar', '2026-11-02', 50, 'Scales', 105),
    s('Guitar', '2026-11-03', 10, '', 70),
    s('Coding', '2026-11-04', 120, 'Scales', 999),
  ]);
  assert.deepEqual(rec.guitar.Scales.map((r) => r.value), [105, 90]);
  assert.deepEqual(rec.guitar.practice.map((r) => r.value), [70]);
  assert.equal(rec.session[0].value, 50);
});
