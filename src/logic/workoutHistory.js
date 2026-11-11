// Workout history: logged sets grouped into past workout days. Pure: no storage, no clock.
//
// Reads 'lift_set' entries (see logic/workout.js). Only entries still on the phone appear; ones removed
// by a wipe are in the Dropbox exports.

import { sessionById } from './template.js';
import { setText } from './workout.js';

/**
 * Past workouts, newest day first:
 *   [{ date, count, sessions: [{ id, name, exercises: [{ name, warmup: [text], working: [text] }] }] }]
 * Sets are in the order they were saved. A deleted session shows as "Deleted session".
 */
export function workoutDays(entries) {
  const sets = entries.filter((e) => e.type === 'lift_set' && !e.deletedAt).sort((a, b) => a.updatedAt - b.updatedAt);
  const days = new Map();
  for (const e of sets) {
    if (!days.has(e.date)) days.set(e.date, { date: e.date, count: 0, sessions: new Map() });
    const day = days.get(e.date);
    day.count += 1;
    if (!day.sessions.has(e.data.session)) day.sessions.set(e.data.session, new Map());
    const byEx = day.sessions.get(e.data.session);
    if (!byEx.has(e.data.exercise)) byEx.set(e.data.exercise, { name: e.data.exercise, warmup: [], working: [] });
    byEx.get(e.data.exercise)[e.data.kind === 'warmup' ? 'warmup' : 'working'].push(setText(e.data));
  }
  return [...days.values()]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((d) => ({
      date: d.date,
      count: d.count,
      sessions: [...d.sessions].map(([id, byEx]) => ({ id, name: sessionById(id)?.name ?? 'Deleted session', exercises: [...byEx.values()] })),
    }));
}
