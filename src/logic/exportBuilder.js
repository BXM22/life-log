// Builds the Markdown export and its manifest from entries. Pure: no storage, no clock.
//
// Entry shape (all collections share it):
//   { id, type, date, data, updatedAt, exportedAt, exportId, deletedAt }
//   type: 'habit_check' | 'weigh_in' | 'guitar' | 'lift_set' | 'meal'   ('note' is excluded, see notesExport.js)
//   data: habit_check { habit, done } | weigh_in { weight_lb } | guitar { minutes, focus, best_bpm }
//         | lift_set { session, exercise, kind, weight, reps, seconds, side }   (see logic/workout.js)
//   updatedAt/exportedAt: ms timestamps; exportedAt and exportId are null until confirmed.

import { toDateString } from './dates.js';
import { workoutMarkdown } from './workout.js';

/** An entry needs exporting if it was never exported or was edited after export. */
export function isDirty(entry) {
  if (entry.deletedAt) return false;
  return entry.exportedAt == null || entry.updatedAt > entry.exportedAt;
}

/** Next free filename for the day: life-log-YYYY-MM-DD.md, then -2, -3... */
export function exportFilename(now, existingFilenames = []) {
  const base = `life-log-${toDateString(now)}`;
  const taken = new Set(existingFilenames);
  if (!taken.has(`${base}.md`)) return `${base}.md`;
  let n = 2;
  while (taken.has(`${base}-${n}.md`)) n += 1;
  return `${base}-${n}.md`;
}

function dayMarkdown(date, entries) {
  const lines = [`# ${date}`, ''];

  const habits = entries.filter((e) => e.type === 'habit_check');
  if (habits.length) {
    lines.push('## Habits');
    for (const h of habits) lines.push(`- [${h.data.done ? 'x' : ' '}] ${h.data.habit}`);
    lines.push('');
  }

  // Latest weigh-in per day wins.
  const weighIns = entries.filter((e) => e.type === 'weigh_in');
  if (weighIns.length) {
    const latest = weighIns.reduce((a, b) => (b.updatedAt >= a.updatedAt ? b : a));
    lines.push('## Weight', `Bodyweight: ${latest.data.weight_lb} lb`, '');
  }

  const guitar = entries.filter((e) => e.type === 'guitar');
  if (guitar.length) {
    lines.push('## Guitar');
    for (const g of guitar) {
      const parts = [`${g.data.minutes} min`];
      if (g.data.focus) parts.push(`focus: ${g.data.focus}`);
      if (g.data.best_bpm != null) parts.push(`best BPM: ${g.data.best_bpm}`);
      lines.push(parts.join(', '));
    }
    lines.push('');
  }

  lines.push(...workoutMarkdown(entries));

  const meals = entries.filter((e) => e.type === 'meal');
  if (meals.length) {
    lines.push('## Meals');
    for (const m of meals) lines.push(`- ${m.data.mealType}: ${m.data.name}`);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Build an export of every dirty entry.
 * Returns null when nothing is waiting. Otherwise:
 *   { filename, markdown, manifest }
 * manifest = { exportId, createdAt, range: {from, to}, items: [{ id, updatedAt }] }
 * The manifest freezes exactly which entry versions are in the file. Nothing is
 * marked exported here; call markExported() only after the share succeeds.
 */
export function buildExport(entries, { now, existingFilenames = [] }) {
  const dirty = entries.filter((e) => e.type !== 'note' && isDirty(e)); // notes export as their own files
  if (dirty.length === 0) return null;

  const byDate = new Map();
  for (const e of dirty) {
    if (!byDate.has(e.date)) byDate.set(e.date, []);
    byDate.get(e.date).push(e);
  }
  const dates = [...byDate.keys()].sort();
  const filename = exportFilename(now, existingFilenames);
  const exportId = filename.replace(/\.md$/, '');
  const range = { from: dates[0], to: dates[dates.length - 1] };

  const header = [
    '---',
    'type: life-log-export',
    `exported: ${new Date(now).toISOString().slice(0, 16)}`,
    `range: ${range.from} to ${range.to}`,
    '---',
    '',
  ].join('\n');

  const body = dates.map((d) => dayMarkdown(d, byDate.get(d))).join('\n');

  return {
    filename,
    markdown: `${header}\n${body}`,
    manifest: {
      exportId,
      createdAt: now,
      range,
      items: dirty.map((e) => ({ id: e.id, updatedAt: e.updatedAt })),
    },
  };
}
