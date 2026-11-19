// Golden export: the Markdown for legacy guitar / study / mixed days must never change byte for byte.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildExport } from '../src/logic/exportBuilder.js';

const e = (id, type, date, data, updatedAt) => ({ id, type, date, data, updatedAt, exportedAt: null, exportId: null, deletedAt: null });
const NOW = Date.UTC(2026, 10, 13, 14, 5);

const legacy = [
  e('a1', 'guitar', '2026-11-10', { minutes: 30, focus: 'Scales', best_bpm: 96 }, 1000),
  e('a2', 'guitar', '2026-11-10', { minutes: 15, focus: '', best_bpm: null }, 1001),
  e('a3', 'guitar', '2026-11-10', { minutes: 20, focus: 'Songs', best_bpm: null }, 1002),
  e('a4', 'guitar', '2026-11-10', { minutes: 10, focus: '', best_bpm: 80 }, 1003),
  e('s1', 'study', '2026-11-11', { kind: 'prep', topic: 'Contracts', minutes: 45, notes: 'Chapter 3' }, 2000),
  e('s2', 'study', '2026-11-11', { kind: 'study', topic: 'Torts', minutes: 30, notes: '' }, 2001),
  e('h1', 'habit_check', '2026-11-12', { habit: 'Read', done: true }, 3000),
  e('h2', 'habit_check', '2026-11-12', { habit: 'Lift', done: true, rest: true }, 3001),
  e('h3', 'habit_check', '2026-11-12', { habit: 'Stretch', done: false }, 3002),
  e('w1', 'weigh_in', '2026-11-12', { weight_lb: 183 }, 3003),
  e('w2', 'weigh_in', '2026-11-12', { weight_lb: 182.4 }, 3004),
  e('l1', 'lift_set', '2026-11-12', { session: 'upper_a', exercise: 'Bench Press', kind: 'warmup', weight: 95, reps: 8, seconds: null, side: null }, 3005),
  e('l2', 'lift_set', '2026-11-12', { session: 'upper_a', exercise: 'Bench Press', kind: 'working', weight: 135, reps: 6, seconds: null, side: null }, 3006),
  e('m1', 'meal', '2026-11-12', { mealType: 'Breakfast', name: 'Eggs', protein_g: 24 }, 3007),
  e('m2', 'meal', '2026-11-12', { mealType: 'Lunch', name: 'Rice bowl', protein_g: null }, 3008),
  e('g5', 'guitar', '2026-11-12', { minutes: 25, focus: 'Songs', best_bpm: 110 }, 3009),
  e('s3', 'study', '2026-11-12', { kind: 'prep', topic: 'Kumio', minutes: 60, notes: 'Deck review' }, 3010),
  e('n1', 'note', '2026-11-12', { text: 'ignored' }, 3011),
];

const GOLDEN = [
  '---', 'type: life-log-export', 'exported: 2026-11-13T14:05', 'range: 2026-11-10 to 2026-11-12', '---', '',
  '# 2026-11-10', '',
  '## Guitar', '30 min, focus: Scales, best BPM: 96', '15 min', '20 min, focus: Songs', '10 min, best BPM: 80', '',
  '# 2026-11-11', '',
  '## Kumio', '- prep: Contracts (45 min) - Chapter 3', '- study: Torts (30 min)', '',
  '# 2026-11-12', '',
  '## Habits', '- [x] Read', '- [x] Lift (rest day)', '- [ ] Stretch', '',
  '## Weight', 'Bodyweight: 182.4 lb', '',
  '## Guitar', '25 min, focus: Songs, best BPM: 110', '',
  '## Workout', '### Upper A', '- Bench Press: warm-up 95 x 8; 135 x 6', '',
  '## Meals', '- Breakfast: Eggs (24 g protein)', '- Lunch: Rice bowl', '',
  '## Kumio', '- prep: Kumio (60 min) - Deck review', '',
].join('\n');

test('legacy days export byte-identical Markdown', () => {
  const r = buildExport(legacy, { now: NOW });
  assert.equal(r.markdown, GOLDEN);
  assert.deepEqual(r.manifest.items.map((i) => i.id), legacy.filter((x) => x.type !== 'note').map((x) => x.id));
});
