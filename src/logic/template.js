// The workout template: Brennen's Upper/Lower 3-4 day plan (docs/TEMPLATE-upper-lower.md).
// Pure data. One active template; the app reads it, never changes it.
//
// exercise: { name, mode, perSide?, warmup, target }
//   mode 'weight'     weight and reps are logged
//   mode 'bodyweight' reps are logged, weight is optional (pull-ups, dips, lunges, abs)
//   mode 'timed'      seconds are logged, weight is optional (holds, carries)
//   perSide           left and right are logged separately

const w = (name, warmup, target, extra = {}) => ({ name, mode: 'weight', warmup, target, ...extra });
const bw = (name, warmup, target, extra = {}) => ({ name, mode: 'bodyweight', warmup, target, ...extra });
const timed = (name, warmup, target) => ({ name, mode: 'timed', warmup, target });

export const SESSIONS = [
  {
    id: 'upper_a', tags: ['upper'], name: 'Upper A', focus: 'Upper chest and back',
    exercises: [
      w('Incline press (machine or barbell)', '1 x 8 at about 50%', '3 x 6-8'),
      w('Chest-supported row (semi-pronated grip)', '1 x 8 at about 50%', '2 x 5-8'),
      w('One-arm neutral-grip pulldown (straps)', '1 x 8 at about 50% per arm', '2 x 5-8 per arm', { perSide: true }),
      w('Lateral raise', '1 x 12 very light', '3 x 12-15'),
      w('Reverse pec deck', '1 x 12 very light', '3 x 12-15'),
      w('Cable triceps extension', '1 x 10 light', '2 x 10-12'),
      w('Bicep curl (EZ-bar or dumbbell)', '1 x 10 light', '2 x 10-12'),
      bw('Abs', 'none', '3 sets'),
    ],
  },
  {
    id: 'lower', tags: ['lower', 'legs'], name: 'Lower', focus: 'Hamstrings and glutes first, then quads',
    exercises: [
      w('Seated leg curl', '2 x 10 (light, then about 60%)', '3 x 8-12'),
      w('Hip thrust', '1 x 8 at about 50%', '3 x 10'),
      w('Hack squat, leg press or back squat', '1 x 8 at about 50%', '3 x 6-10'),
      w('RDL', '1 x 8 at about 50%', '2 x 8-10'),
      bw('Walking lunge', '1 x 6 per leg, bodyweight', '2 x 10 per leg', { perSide: true }),
      w('Leg extension', '1 x 10 light', '2 x 10-15'),
      w('Calf raise', '1 x 12 light', '2 x 12-15'),
      timed('Farmer carry or heavy dumbbell hold (straps)', 'none', '2 x 30-45 sec'),
    ],
  },
  {
    id: 'upper_b', tags: ['upper'], name: 'Upper B', focus: 'Bench, shoulders, rear delts',
    exercises: [
      w('Bench press', '1 x 8 at about 50%', '3 x 5-8'),
      w('T-bar or single-arm cable row (straps)', '1 x 8 at about 50%', '2 x 5-8'),
      bw('Overhand lat pulldown or pull-up (straps)', '1 scap-pull-only set x 8, then 1 x 6 at about 50%', '2 x 5-8'),
      w('Overhead press', '1 x 8 at about 50%', '2 x 8-10'),
      w('Pec deck or incline fly', '1 x 10 light', '2 x 10-12'),
      w('Face pulls or rear-delt cable fly', '1 x 12 very light', '3 x 12-15'),
      bw('Dips or machine triceps', '1 x 6 bodyweight or light', '2 x 8-12'),
      w('Supinated curl', '1 x 10 light', '2 x 10-12'),
      bw('Abs', 'none', '3 sets'),
    ],
  },
  {
    id: 'upper_c', tags: ['upper', 'quick'], name: 'Upper C (optional)', focus: 'Upper back and rear delts, 30-40 min',
    exercises: [
      bw('Weighted pull-up or overhand lat pulldown (straps)', '1 scap-pull-only set x 8, then 1 x 6 at about 50%', '3 x 6-10'),
      w('Chest-supported row (semi-pronated grip)', '1 x 8 at about 50%', '3 x 8-10'),
      w('Reverse pec deck', '1 x 12 very light', '3 x 12-15'),
      w('Straight-arm pulldown', '1 x 12 very light', '2 x 12'),
    ],
  },
];

/** Weekday (0 = Sunday) to session id. Monday and Wednesday are BJJ and calisthenics, Friday is rest. */
export const SCHEDULE = { 0: 'upper_c', 2: 'upper_a', 4: 'lower', 6: 'upper_b' };

/** The 3-day version: Upper A, Lower and Upper B, with no Sunday session. */
export const SCHEDULE_3 = { 2: 'upper_a', 4: 'lower', 6: 'upper_b' };

/** The weekday schedule for a 3-day or 4-day week. Anything but 3 gives the 4-day schedule. */
export const scheduleFor = (days) => (days === 3 ? SCHEDULE_3 : SCHEDULE);

// SESSIONS is the built-in plan. The active plan is that, or the user's edited copy (see templateEdit.js).
let active = SESSIONS;
export const getSessions = () => active;
/** Use an edited plan, or pass null to go back to the built-in one. */
export function setTemplate(sessions) { active = Array.isArray(sessions) && sessions.length ? sessions : SESSIONS; }

// Quick workout (F72): a built-in empty session for a day you train without a template. Exercises come from today's
// extras. The id carries the optional name chip ('__quick' or '__quick:upper'), so every reader can name it from data.session.
export const QUICK_ID = '__quick';
export const QUICK_LABELS = { full: 'Full body', upper: 'Upper', lower: 'Lower', push: 'Push', pull: 'Pull' };
export const isQuickId = (id) => typeof id === 'string' && (id === QUICK_ID || id.startsWith(`${QUICK_ID}:`));
export const quickId = (label) => (QUICK_LABELS[label] ? `${QUICK_ID}:${label}` : QUICK_ID);
/** The quick session for an id, or null. Never listed by getSessions(). */
export function quickSession(id) {
  if (!isQuickId(id)) return null;
  const key = id.slice(QUICK_ID.length + 1);
  if (key && !QUICK_LABELS[key]) return null;
  return { id, name: key ? `Quick: ${QUICK_LABELS[key]}` : 'Quick workout', focus: 'Add exercises as you go', tags: [], exercises: [], quick: true };
}

export const sessionById = (id) => active.find((s) => s.id === id) ?? quickSession(id);

/** The exercise definition for a logged exercise name, from any session. */
export function findExercise(name) {
  for (const s of active) {
    const ex = s.exercises.find((e) => e.name === name);
    if (ex) return ex;
  }
  return null;
}
