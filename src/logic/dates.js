// Date helpers shared by export and wipe. Dates are "YYYY-MM-DD" strings.

const pad = (n) => String(n).padStart(2, '0');

/** Local calendar date of a timestamp, as YYYY-MM-DD. */
export function toDateString(ms) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * The "logical" date for a timestamp when the day starts at dayStartHour.
 * A log at 1 AM with dayStartHour 4 counts toward the previous day.
 */
export function logicalDate(ms, dayStartHour = 4) {
  return toDateString(ms - dayStartHour * 3600 * 1000);
}

/** Add (or subtract, if negative) whole days to a YYYY-MM-DD string. */
export function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}
