import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reviewWeek, isReviewDay, reviewFilename, buildReview, reviewMarkdown } from '../src/logic/weeklyReview.js';
import { meter, nudgeMeters, nudgeDue, loadLastBackup, saveLastBackup } from '../src/logic/backupNudge.js';

const e = (type, date, data, extra = {}) => ({ id: Math.random().toString(36), type, date, data, updatedAt: 1, ...extra });

test('review week is Monday to Sunday ending on the latest Sunday', () => {
  assert.deepEqual(reviewWeek('2026-11-15'), { start: '2026-11-09', end: '2026-11-15' }); // a Sunday
  assert.deepEqual(reviewWeek('2026-11-18'), { start: '2026-11-09', end: '2026-11-15' }); // a Wednesday
  assert.equal(isReviewDay('2026-11-15'), true);
  assert.equal(isReviewDay('2026-11-16'), false);
  assert.equal(reviewFilename('2026-11-15'), '2026-11-15-weekly-review.md');
});

test('buildReview totals the week and skips deleted or outside entries', () => {
  const entries = [
    e('habit_check', '2026-11-09', { habit: 'Guitar', done: true }),
    e('habit_check', '2026-11-10', { habit: 'Guitar', done: true }),
    e('habit_check', '2026-11-10', { habit: 'Guitar', done: true }, { deletedAt: 5 }),
    e('habit_check', '2026-11-16', { habit: 'Guitar', done: true }),
    e('weigh_in', '2026-11-09', { weight_lb: 172 }),
    e('weigh_in', '2026-11-15', { weight_lb: 170.5 }),
    e('guitar', '2026-11-11', { minutes: 20 }), e('guitar', '2026-11-11', { minutes: 10 }),
    e('lift_set', '2026-11-12', { kind: 'working' }), e('lift_set', '2026-11-12', { kind: 'warmup' }),
    e('meal', '2026-11-13', { protein_g: 100 }), e('meal', '2026-11-13', { protein_g: 50 }), e('meal', '2026-11-14', { protein_g: null }),
  ];
  const r = buildReview(entries, [{ name: 'Guitar' }], '2026-11-15');
  assert.equal(r.habits[0].done, 2);
  assert.deepEqual(r.weight, { first: 172, last: 170.5, change: -1.5, count: 2 });
  assert.deepEqual(r.guitar, { sessions: 2, minutes: 30, days: 1 });
  assert.deepEqual(r.workout, { sets: 1, days: 1 });
  assert.deepEqual(r.protein, { days: 1, avg: 150 });
  const md = reviewMarkdown(r);
  assert.match(md, /week_end: 2026-11-15/);
  assert.match(md, /- Guitar: 2\/7 days/);
  assert.match(md, /172 lb to 170.5 lb \(-1.5 lb\)/);
});

test('empty week still renders', () => {
  const md = reviewMarkdown(buildReview([], [], '2026-11-15'));
  assert.match(md, /No weigh-ins/);
  assert.match(md, /No habits/);
});

test('meter levels and never', () => {
  const D = 86400000; const now = 100 * D;
  assert.equal(meter('x', now - 1 * D, now).level, 'ok');
  assert.equal(meter('x', now - 4 * D, now).level, 'warn');
  assert.equal(meter('x', now - 7 * D, now).level, 'due');
  assert.equal(meter('x', null, now).level, 'never');
  assert.equal(meter('x', now - 30 * D, now).pct, 100);
  assert.equal(meter('x', now, now).text, 'x: today');
  assert.equal(nudgeDue(nudgeMeters({ lastExportAt: now, lastBackupAt: now }, now)), false);
  assert.equal(nudgeDue(nudgeMeters({ lastExportAt: now, lastBackupAt: null }, now)), true);
});

test('last backup storage round-trips and never throws', () => {
  const m = new Map(); const s = { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) };
  assert.equal(loadLastBackup(s), null);
  saveLastBackup(s, 123);
  assert.equal(loadLastBackup(s), 123);
  assert.equal(loadLastBackup({ getItem() { throw new Error('x'); } }), null);
  assert.equal(saveLastBackup({ setItem() { throw new Error('x'); } }, 1), false);
});
