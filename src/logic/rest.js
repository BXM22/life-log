// Rest timer logic (F23). Pure except for the storage object the caller passes in.
// The timer stores an END time, not a count, so it stays right when the phone sleeps or the app is closed.
//
// rest: { seconds, auto, endAt, total }
//   seconds  chosen rest length (the wheel and the presets set this)
//   auto     start the timer by itself after a working set
//   endAt    epoch ms when the running timer finishes, or null when idle
//   total    length of the running timer in seconds, for the progress bar

export const REST_KEY = 'lifelog.rest';
export const PRESETS = [60, 90, 120, 180];
export const MIN_REST = 5;
export const MAX_REST = 600;
export const DEFAULT_SECONDS = 90;
export const WHEEL_MINUTES = Array.from({ length: 11 }, (_, i) => i); // 0 to 10
export const WHEEL_SECONDS = Array.from({ length: 12 }, (_, i) => i * 5); // 0 to 55

/** Any number in, a whole number of seconds from MIN_REST to MAX_REST. Junk gives the default. */
export function clampRest(n) {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v)) return DEFAULT_SECONDS;
  return Math.min(MAX_REST, Math.max(MIN_REST, v));
}

/** 90 -> "1:30" */
export const fmt = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

/** Whole seconds left until endAt, never below 0. 0 when idle. */
export const remaining = (endAt, now) => (typeof endAt === 'number' ? Math.max(0, Math.ceil((endAt - now) / 1000)) : 0);

/** Wheel positions (indexes) for a length in seconds. Seconds snap to the nearest 5. */
export function toWheel(seconds) {
  const s = clampRest(seconds);
  const min = Math.floor(s / 60);
  return { minIndex: min, secIndex: Math.min(11, Math.round((s % 60) / 5)) };
}

/** Length in seconds for two wheel positions. */
export const fromWheel = (minIndex, secIndex) =>
  clampRest((WHEEL_MINUTES[minIndex] ?? 0) * 60 + (WHEEL_SECONDS[secIndex] ?? 0));

/** Any stored value in, a valid rest object out. A timer that already ended while the app was closed is idle. */
export function normalizeRest(raw, now) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const seconds = r.seconds === undefined ? DEFAULT_SECONDS : clampRest(r.seconds);
  const running = typeof r.endAt === 'number' && r.endAt > now;
  return {
    seconds,
    auto: r.auto === undefined ? true : Boolean(r.auto),
    endAt: running ? r.endAt : null,
    total: running ? clampRest(r.total ?? seconds) : null,
  };
}

export function loadRest(storage, now) {
  try { return normalizeRest(JSON.parse(storage.getItem(REST_KEY) || 'null'), now); } catch { return normalizeRest(null, now); }
}

/** Returns true if saved, false if storage refused. */
export function saveRest(storage, rest) {
  try { storage.setItem(REST_KEY, JSON.stringify(rest)); return true; } catch { return false; }
}
