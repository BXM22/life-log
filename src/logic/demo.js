// Demo data for trying the app: 12 days of weigh-ins, guitar and a water habit. Pure given `now`.

import { newEntry } from './entries.js';
import { toDateString } from './dates.js';

const DAY_MS = 24 * 3600 * 1000;

export function demoEntries(now) {
  const out = [];
  for (let i = 12; i >= 1; i -= 1) {
    const ts = now - i * DAY_MS;
    const date = toDateString(ts);
    out.push(newEntry('weigh_in', date, { weight_lb: +(184 - i * 0.15).toFixed(1) }, ts));
    out.push(newEntry('guitar', date, { minutes: 15 + (i % 3) * 10, focus: 'technique', best_bpm: 90 + i }, ts));
    out.push(newEntry('habit_check', date, { habit: 'Water', done: i % 2 === 0 }, ts));
  }
  return out;
}
