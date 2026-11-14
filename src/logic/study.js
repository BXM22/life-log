// Kumio prep and study log (F16). Pure: no storage, no clock.
//   study { kind: 'prep' | 'study', topic, minutes, notes }

export const STUDY_KINDS = ['prep', 'study'];
export const MAX_TOPIC = 60;
export const MAX_STUDY_NOTES = 500;
export const MAX_STUDY_MINUTES = 600;

/** Study fields from the form. Returns { data } or { error }. */
export function parseStudy({ kind, topic, minutes, notes }) {
  if (!STUDY_KINDS.includes(kind)) return { error: 'Pick prep or study.' };
  const t = String(topic ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return { error: 'Enter what you worked on.' };
  if (t.length > MAX_TOPIC) return { error: `Topic must be ${MAX_TOPIC} characters or fewer.` };
  const m = Number(minutes);
  if (String(minutes ?? '').trim() === '' || !(Number.isInteger(m) && m >= 1 && m <= MAX_STUDY_MINUTES)) {
    return { error: `Enter whole minutes, 1 to ${MAX_STUDY_MINUTES}.` };
  }
  const n = String(notes ?? '').replace(/\s+/g, ' ').trim();
  if (n.length > MAX_STUDY_NOTES) return { error: `Notes must be ${MAX_STUDY_NOTES} characters or fewer.` };
  return { data: { kind, topic: t, minutes: m, notes: n } };
}

/** One line for lists and the export: "study: Contracts (45 min) - notes" */
export const studyLine = (e) =>
  `${e.data.kind}: ${e.data.topic} (${e.data.minutes} min)${e.data.notes ? ` - ${e.data.notes}` : ''}`;

/** Markdown lines for the day's study entries, or [] when none. */
export function studyMarkdown(entries) {
  const rows = entries.filter((e) => e.type === 'study');
  if (!rows.length) return [];
  return ['## Kumio', ...rows.map((e) => `- ${studyLine(e)}`), ''];
}

/** Minutes of live study entries on a date. */
export const dayStudyMinutes = (entries, date) =>
  entries.filter((e) => e.type === 'study' && !e.deletedAt && e.date === date).reduce((s, e) => s + e.data.minutes, 0);
