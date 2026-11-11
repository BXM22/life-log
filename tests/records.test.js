import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newEntry } from '../src/logic/entries.js';
import { est1RM, mergeRecords, recordsMarkdown, emptyRecords, TOP_N } from '../src/logic/records.js';
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
