import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newEntry } from '../src/logic/entries.js';
import { toggleCheck } from '../src/logic/habits.js';
import { historyView, editForm, filterEntries, dayLabel } from '../src/ui/historyView.js';
import { createHistoryActions } from '../src/ui/historyActions.js';
import { prBanner } from '../src/ui/progressView.js';

const TODAY = '2026-11-19';
const gym = { id: 'workout', name: 'Workout' };
const lift = (date, weight, reps, at = 1) => newEntry('lift_set', date, { exercise: 'Bench', kind: 'working', weight, reps }, at);
const weigh = (date, lb, at = 1) => newEntry('weigh_in', date, { weight_lb: lb }, at);
const base = (entries, extra = {}) => ({ entries, habits: [gym], stats: null, histWin: null, editId: null, dayStartHour: 0, ...extra });

function sample() {
  return [
    toggleCheck([], gym, TODAY, 1),
    weigh('2026-11-01', 180), weigh('2026-11-08', 178), weigh('2026-11-15', 176.4), weigh(TODAY, 175.2),
    lift('2026-10-27', 135, 5), lift(TODAY, 155, 5),
    { ...newEntry('note', TODAY, { title: 'Sleep', body: 'ok' }, 2), exportedAt: 5, updatedAt: 2 },
  ];
}

test('root: This week card and four Look closer rows opening their pages', () => {
  const html = historyView(base(sample()), TODAY);
  assert.match(html, /This week/);
  for (const win of ['weight', 'habits', 'lifts', 'entries']) assert.match(html, new RegExp(`data-action="hvOpen" data-win="${win}"`));
  assert.match(html, /175\.2 lb, 5\.2 lb above your 170 lb goal/);
  assert.match(html, /Bench \+23 lb in 8 weeks/);
  assert.match(html, /8 entries, 7 waiting/);
  assert.match(html, /hv-cell done is-today/);
  assert.ok(!/[\u{1F300}-\u{1FAFF}]/u.test(html), 'no emoji');
});

test('root with no data shows helpful empty lines', () => {
  const html = historyView({ ...base([]), habits: [] }, TODAY);
  assert.match(html, /No habits yet/);
  assert.match(html, /No weigh-ins yet/);
  assert.match(html, /No weighted sets in 8 weeks/);
});

test('Weight page: lavender hero, dashed goal chart with projection, rows open the edit sheet', () => {
  const html = historyView(base(sample(), { histWin: 'weight' }), TODAY);
  assert.match(html, /class="hv-hero"/);
  assert.match(html, /170 lb goal/);
  assert.match(html, /class="hv-proj"/);
  assert.match(html, /At this pace/);
  assert.match(html, /role="img" aria-label="Weight, last 4 weeks: 4 weigh-ins/);
  assert.equal((html.match(/data-action="hvEditWeigh"/g) || []).length, 4);
  assert.match(html, /data-action="closeHistWin"/);
});

test('Habits page: streaks list and a 5-week heatmap with a legend', () => {
  const html = historyView(base(sample(), { histWin: 'habits' }), TODAY);
  assert.match(html, /Streaks/);
  assert.match(html, /Guitar practice/);
  assert.equal((html.match(/class="hv-hmc l\d[^"]*" role="img"/g) || []).length, 35);
  assert.match(html, /hv-legend/);
});

test('Lift progress page: hero, chips keep pickLift, chart, records', () => {
  const html = historyView(base(sample(), { histWin: 'lifts' }), TODAY);
  assert.match(html, /Best estimated 1RM, Bench/);
  assert.match(html, /data-action="pickLift" data-lift="Bench" aria-pressed="true"/);
  assert.match(html, /\+23 lb/);
  assert.match(html, /Personal records/);
  const empty = historyView(base([], { histWin: 'lifts' }), TODAY);
  assert.match(empty, /No weighted working sets in the last 8 weeks/);
  assert.match(empty, /No records yet/);
});

test('All entries: search, filter chips with counts, day groups, Waiting and Exported tags', () => {
  const s = base(sample(), { histWin: 'entries' });
  const html = historyView(s, TODAY);
  assert.match(html, /id="hv-search"/);
  assert.match(html, /data-key="weigh" aria-pressed="false">Weigh-ins<span>4<\/span>/);
  assert.match(html, /hv-day">Today<span class="hv-count">4<\/span>/);
  assert.match(html, />Exported</);
  assert.match(html, /data-action="startEdit"/);
  const lifts = historyView({ ...s, hvFilter: 'lifts' }, TODAY);
  assert.equal((lifts.match(/data-action="startEdit"/g) || []).length, 2);
  assert.match(historyView({ ...s, hvQuery: 'zzz' }, TODAY), /No match for “zzz”[\s\S]*data-action="hvClear"/);
});

test('filterEntries and dayLabel', () => {
  const all = sample();
  assert.equal(filterEntries(all, '', 'weigh').length, 4);
  assert.equal(filterEntries(all, 'BENCH').length, 2);
  assert.equal(filterEntries(all, '2026-11-15').length, 1);
  assert.equal(filterEntries(all, '', 'waiting').length, 7);
  assert.equal(filterEntries(all, '', 'bogus').length, all.length);
  assert.equal(dayLabel(TODAY, TODAY), 'Today');
  assert.equal(dayLabel('2026-11-18', TODAY), 'Yesterday');
});

test('Edit sheet: labelled fields with the ed-* ids, one primary Save changes, delete needs a confirm', () => {
  const entries = sample();
  const w = entries[4];
  const s = base(entries, { histWin: 'entries', editId: w.id });
  const html = historyView(s, TODAY);
  assert.match(html, /role="dialog"/);
  assert.match(html, /<label class="lbl" for="ed-w">Weight \(lb\)<\/label>/);
  assert.match(html, /data-action="saveEdit" data-id="[^"]+">Save changes/);
  assert.equal((html.match(/class="btn"/g) || []).length, 1);
  assert.match(html, /data-action="hvAsk"/);
  const asking = historyView({ ...s, hvAsk: w.id }, TODAY);
  assert.match(asking, /Delete this entry\?/);
  assert.match(asking, /data-action="hvDelete"/);
  const habit = historyView(base(entries, { histWin: 'entries', editId: entries[0].id }), TODAY);
  assert.match(habit, /id="ed-d"/);
  assert.ok(!habit.includes('data-action="hvAsk"'), 'habit checks have no delete');
});

test('editForm (used by Workout) keeps its in-place markup', () => {
  const html = editForm(weigh(TODAY, 180));
  assert.match(html, /id="ed-w"/);
  assert.match(html, /data-action="saveEdit"/);
  assert.match(html, />SAVE</);
});

test('actions: open pages, filter, edit from a weigh-in, delete through the confirm', async () => {
  const entries = sample();
  const saved = [];
  const state = base(entries, { hvQuery: 'x', hvFilter: 'lifts' });
  const a = createHistoryActions({ state, today: () => TODAY, saveEntries: async (es) => { saved.push(...es); } });
  a.hvOpen({ dataset: { win: 'entries' } });
  assert.deepEqual([state.histWin, state.hvQuery, state.hvFilter], ['entries', '', 'all']);
  a.hvOpen({ dataset: { win: 'nope' } });
  assert.equal(state.histWin, 'entries');
  a.hvFilter({ dataset: { key: 'waiting' } });
  assert.equal(state.hvFilter, 'waiting');
  a.hvFilter({ dataset: { key: 'evil' } });
  assert.equal(state.hvFilter, 'all');
  a.hvSearch({ value: 'b'.repeat(200) });
  assert.equal(state.hvQuery.length, 80);
  const w = entries[4];
  a.hvEditWeigh({ dataset: { id: w.id } });
  assert.deepEqual([state.histWin, state.editId, state.hvFilter], ['entries', w.id, 'weigh']);
  a.hvAsk({ dataset: { id: w.id } });
  assert.equal(state.hvAsk, w.id);
  await a.hvDelete({ dataset: { id: w.id } });
  assert.equal(saved.length, 1);
  assert.ok(state.entries.find((e) => e.id === w.id).deletedAt);
  assert.equal(state.editId, null);
  assert.equal(state.hvAsk, null);
  await a.hvDelete({ dataset: { id: entries[0].id } });
  assert.equal(saved.length, 1, 'habit checks are never deleted');
});

test('hvDelete reports a failed save and keeps the entry', async () => {
  const entries = sample();
  const state = base(entries, { histWin: 'entries', editId: entries[1].id });
  const a = createHistoryActions({ state, saveEntries: async () => { throw new Error('disk full'); }, saveFail: (e) => `Not saved: ${e.message}` });
  await a.hvDelete({ dataset: { id: entries[1].id } });
  assert.equal(state.msg, 'Not saved: disk full');
  assert.ok(!state.entries.find((e) => e.id === entries[1].id).deletedAt);
  assert.equal(state.editId, entries[1].id);
});

test('prBanner contract unchanged', () => {
  const pr = { exercise: 'Bench', value: 190, unit: '1RM', previous: 185, text: '155 x 5' };
  assert.equal(prBanner({ tab: 'history', pr }), '');
  assert.match(prBanner({ tab: 'workout', pr }), /NEW PR &middot; Bench 155 x 5 <small>est. 1RM 190, was 185<\/small>/);
});
