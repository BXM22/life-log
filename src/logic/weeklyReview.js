// F37 Weekly review. Pure: no storage, no clock. A week runs Monday to Sunday.
// The review covers the week that ends on the most recent Sunday (today, when today is Sunday).
// It is sent to the vault as one Markdown file under <vault folder>/reviews/.

import { addDays } from './dates.js';
import { weekday } from './workout.js';

export const REVIEW_FOLDER = 'reviews';

/** True when the logical date is a Sunday. */
export const isReviewDay = (date) => weekday(date) === 0;

/** The Sunday that ends the review week for a logical date. */
export const reviewWeekEnd = (date) => addDays(date, -weekday(date));

/** { start, end } (Monday and Sunday) of the review week. */
export const reviewWeek = (date) => { const end = reviewWeekEnd(date); return { start: addDays(end, -6), end }; };

/** Filename that passes the uploader's whitelist: YYYY-MM-DD-weekly-review.md (the Sunday). */
export const reviewFilename = (end) => `${end}-weekly-review.md`;

const live = (e) => !e.deletedAt;
const round1 = (n) => Math.round(n * 10) / 10;

/** Numbers for the week from live entries. habits is [{ name }]. */
export function buildReview(entries, habits, date) {
  const { start, end } = reviewWeek(date);
  const inWeek = entries.filter((e) => live(e) && e.date >= start && e.date <= end);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  const habitRows = habits.map((h) => {
    const done = new Set(inWeek.filter((e) => e.type === 'habit_check' && e.data?.done && e.data.habit === h.name).map((e) => e.date));
    return { name: h.name, done: done.size };
  });

  const weigh = inWeek.filter((e) => e.type === 'weigh_in').sort((a, b) => (a.date === b.date ? a.updatedAt - b.updatedAt : a.date < b.date ? -1 : 1));
  const first = weigh.length ? weigh[0].data.weight_lb : null;
  const last = weigh.length ? weigh[weigh.length - 1].data.weight_lb : null;

  const guitar = inWeek.filter((e) => e.type === 'guitar');
  const sets = inWeek.filter((e) => e.type === 'lift_set' && e.data?.kind === 'working');
  const protein = days.map((d) => inWeek.filter((e) => e.type === 'meal' && e.date === d).reduce((s, e) => s + (e.data.protein_g ?? 0), 0));
  const proteinDays = protein.filter((p) => p > 0).length;

  return {
    start, end,
    habits: habitRows,
    weight: { first, last, change: first != null && last != null ? round1(last - first) : null, count: weigh.length },
    guitar: { sessions: guitar.length, minutes: guitar.reduce((s, e) => s + (Number(e.data.minutes) || 0), 0), days: new Set(guitar.map((e) => e.date)).size },
    workout: { sets: sets.length, days: new Set(sets.map((e) => e.date)).size },
    protein: { days: proteinDays, avg: proteinDays ? Math.round(protein.reduce((a, b) => a + b, 0) / proteinDays) : 0 },
  };
}

/** Markdown for the vault, with front matter. */
export function reviewMarkdown(r) {
  const w = r.weight;
  const lines = [
    '---', 'type: life-log-weekly-review', `week_start: ${r.start}`, `week_end: ${r.end}`, '---', '',
    `# Weekly review ${r.start} to ${r.end}`, '',
    '## Habits',
    ...(r.habits.length ? r.habits.map((h) => `- ${h.name}: ${h.done}/7 days`) : ['- No habits']), '',
    '## Weight',
    w.count ? `- ${w.first} lb to ${w.last} lb (${w.change > 0 ? '+' : ''}${w.change} lb), ${w.count} weigh-in${w.count === 1 ? '' : 's'}` : '- No weigh-ins', '',
    '## Guitar',
    `- ${r.guitar.minutes} min over ${r.guitar.days} day${r.guitar.days === 1 ? '' : 's'} (${r.guitar.sessions} session${r.guitar.sessions === 1 ? '' : 's'})`, '',
    '## Workout',
    `- ${r.workout.sets} working sets over ${r.workout.days} day${r.workout.days === 1 ? '' : 's'}`, '',
    '## Protein',
    r.protein.days ? `- Average ${r.protein.avg} g on ${r.protein.days} logged day${r.protein.days === 1 ? '' : 's'}` : '- No protein logged', '',
  ];
  return lines.join('\n');
}
