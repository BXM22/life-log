// App settings kept on this device. Pure except for the storage object the caller passes in
// (localStorage in the app, a stub in tests), so a blocked or missing storage never throws.

export const SETTINGS_KEY = 'lifelog.settings';
export const KEEP_OPTIONS = [0, 3, 7, 14];
export const DAY_START_OPTIONS = [0, 1, 2, 3, 4, 5, 6];
export const PLAN_DAYS_OPTIONS = [3, 4];
export const DEFAULT_SETTINGS = { keepDays: 7, dayStartHour: 4, planDays: 4 };

/** Any stored value in, a valid { keepDays, dayStartHour, planDays } out. Bad or missing values use defaults. */
export function normalizeSettings(raw) {
  const s = raw && typeof raw === 'object' ? raw : {};
  return {
    keepDays: KEEP_OPTIONS.includes(s.keepDays) ? s.keepDays : DEFAULT_SETTINGS.keepDays,
    dayStartHour: DAY_START_OPTIONS.includes(s.dayStartHour) ? s.dayStartHour : DEFAULT_SETTINGS.dayStartHour,
    planDays: PLAN_DAYS_OPTIONS.includes(s.planDays) ? s.planDays : DEFAULT_SETTINGS.planDays,
  };
}

export function loadSettings(storage) {
  try { return normalizeSettings(JSON.parse(storage.getItem(SETTINGS_KEY) || 'null')); } catch { return { ...DEFAULT_SETTINGS }; }
}

// Starter habits are added once per device. This flag stops them coming back after you delete them.
export const SEEDED_KEY = 'lifelog.seeded';
export function isSeeded(storage) {
  try { return storage.getItem(SEEDED_KEY) === '1'; } catch { return true; } // storage blocked: do not re-seed every load
}
export function markSeeded(storage) {
  try { storage.setItem(SEEDED_KEY, '1'); } catch { /* storage blocked */ }
}

/** Returns true if saved, false if storage refused. */
export function saveSettings(storage, settings) {
  try { storage.setItem(SETTINGS_KEY, JSON.stringify(normalizeSettings(settings))); return true; } catch { return false; }
}
