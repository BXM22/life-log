// Workout template tags and the Active switch (F42). Pure: every function returns a new sessions array.
// A session may carry `tags` (short lowercase words) and `active` (false hides it from the Workout chip row).
// A missing `active` means active, so plans saved before this feature keep working.

export const SUGGESTED_TAGS = ['upper', 'lower', 'push', 'pull', 'legs', 'core', 'home', 'quick'];
export const MAX_TAGS = 6;
export const MAX_TAG_LEN = 20;

/** Any value in, a clean list out: trimmed, lowercase, no repeats, short, at most MAX_TAGS. */
export function normalizeTags(raw) {
  const list = Array.isArray(raw) ? raw : [];
  const out = [];
  for (const t of list) {
    const tag = String(t ?? '').toLowerCase().replace(/\s+/g, ' ').trim().slice(0, MAX_TAG_LEN).trim();
    if (tag && !out.includes(tag)) out.push(tag);
    if (out.length >= MAX_TAGS) break;
  }
  return out;
}

export const isActive = (s) => s.active !== false;
export const tagsOf = (s) => normalizeTags(s.tags);

/** Sessions shown on the Workout tab; the picked session stays visible even if it is inactive. */
export function visibleSessions(sessions, pickedId) {
  const act = sessions.filter((s) => isActive(s) || s.id === pickedId);
  return act.length ? act : sessions;
}

/** Suggested tags plus every custom tag in use, in a stable order. */
export function allTags(sessions) {
  const used = sessions.flatMap(tagsOf);
  return [...SUGGESTED_TAGS, ...[...new Set(used)].filter((t) => !SUGGESTED_TAGS.includes(t)).sort()];
}

/** Tags that at least one session uses (for the filter row). */
export const usedTags = (sessions) => [...new Set(sessions.flatMap(tagsOf))].sort();

/** Sessions with a tag; an empty tag means all. */
export const filterByTag = (sessions, tag) => (tag ? sessions.filter((s) => tagsOf(s).includes(tag)) : sessions);

const has = (sessions, id) => sessions.some((s) => s.id === id);
const patch = (sessions, id, change) => sessions.map((s) => (s.id === id ? { ...s, ...change } : s));

export function setTags(sessions, id, tags) {
  if (!has(sessions, id)) return { error: 'That session does not exist.' };
  return { sessions: patch(sessions, id, { tags: normalizeTags(tags) }) };
}

/** Turn a session on or off. At least one session must stay active. */
export function setActive(sessions, id, on) {
  if (!has(sessions, id)) return { error: 'That session does not exist.' };
  if (!on && sessions.filter((s) => isActive(s) && s.id !== id).length === 0) return { error: 'Keep at least one session active.' };
  return { sessions: patch(sessions, id, { active: Boolean(on) }) };
}
