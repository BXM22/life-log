// Practice timer (F12). Pure except for the storage object the caller passes in.
// The timer stores its START time, not a count, so it stays right when the phone sleeps or the app is closed.
// Stopping turns the elapsed time into whole minutes for a normal guitar entry.
//
// practice: { startAt, focus }   startAt is epoch ms while running, null when idle.

export const PRACTICE_KEY = 'lifelog.practice';
export const MAX_PRACTICE_MINUTES = 600; // matches the guitar form's upper limit

export const idlePractice = () => ({ startAt: null, focus: '' });

/** Saved timer, or an idle one when nothing valid is stored. */
export function loadPractice(storage) {
  try {
    const p = JSON.parse(storage.getItem(PRACTICE_KEY));
    if (p && typeof p.startAt === 'number' && Number.isFinite(p.startAt)) return { startAt: p.startAt, focus: String(p.focus ?? '').slice(0, 40) };
  } catch { /* missing or corrupt: start idle */ }
  return idlePractice();
}

export function savePractice(storage, p) {
  if (p.startAt == null) storage.removeItem(PRACTICE_KEY);
  else storage.setItem(PRACTICE_KEY, JSON.stringify({ startAt: p.startAt, focus: p.focus }));
}

/** A running timer from now. */
export const startPractice = (now, focus = '') => ({ startAt: now, focus: String(focus).replace(/\s+/g, ' ').trim().slice(0, 40) });

/** Whole seconds since start, never negative. 0 when idle. */
export const elapsedSeconds = (p, now) => (typeof p.startAt === 'number' ? Math.max(0, Math.floor((now - p.startAt) / 1000)) : 0);

/** Elapsed seconds as whole minutes for the log: rounded, at least 1, at most 600. */
export const practiceMinutes = (seconds) => Math.min(MAX_PRACTICE_MINUTES, Math.max(1, Math.round(seconds / 60)));

/** 3725 -> "1:02:05", 65 -> "1:05" */
export function clock(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
