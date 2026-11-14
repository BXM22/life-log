// Week view data (F10). Pure: callers pass `today`. Weeks run Monday to Sunday.

import { addDays } from './dates.js';
import { isChecked } from './habits.js';

export const GOAL_WEIGHT = 170;

/** The 7 dates of the Monday-Sunday week containing `today`, shifted by `offset` weeks. */
export function weekDates(today, offset = 0) {
  const [y, m, d] = today.split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Sunday
  const monday = addDays(today, -((dow + 6) % 7) + offset * 7);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/** Habit grid: [{ habit, cells: [{ date, done, future }], doneCount }]. */
export function habitGrid(entries, habits, dates, today) {
  return habits.map((habit) => {
    const cells = dates.map((date) => ({ date, future: date > today, done: isChecked(entries, habit, date) }));
    return { habit, cells, doneCount: cells.filter((c) => c.done).length };
  });
}

/** Weights (oldest first) from the last `days` days ending today, from weightHistory rows. */
export function weightTrend(history, today, days = 28) {
  const from = addDays(today, -(days - 1));
  return history.filter((w) => w.date >= from && w.date <= today).sort((a, b) => a.date.localeCompare(b.date));
}

/** Chart geometry for points on a width x height box, with the goal line included in the y range. */
export function chartPoints(points, today, days, goal = GOAL_WEIGHT, width = 320, height = 140, pad = 14) {
  if (!points.length) return { dots: [], goalY: null, line: '', min: goal, max: goal };
  const vals = points.map((p) => p.weight_lb);
  const min = Math.floor(Math.min(goal, ...vals) - 1);
  const max = Math.ceil(Math.max(goal, ...vals) + 1);
  const start = addDays(today, -(days - 1));
  const x = (date) => {
    const i = Math.round((Date.parse(date) - Date.parse(start)) / 86400000);
    return pad + (i / (days - 1)) * (width - 2 * pad);
  };
  const y = (v) => pad + ((max - v) / (max - min)) * (height - 2 * pad);
  const dots = points.map((p) => ({ x: +x(p.date).toFixed(1), y: +y(p.weight_lb).toFixed(1), ...p }));
  return { dots, goalY: +y(goal).toFixed(1), line: dots.map((d) => `${d.x},${d.y}`).join(' '), min, max };
}
