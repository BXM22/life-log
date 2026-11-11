// Notes export: one Markdown file per note, for the vault. Pure: no storage, no clock.
//
// Each note becomes `YYYY-MM-DD-title-words.md` with front matter (type, created, status, tags)
// so it can be linked, searched and turned into an app feature later. A note that was edited after
// it was exported gets a `-rev` suffix, so the vault copy is never overwritten.

import { isDirty } from './exportBuilder.js';

export const NOTES_FOLDER = 'notes';

/** Lowercase words joined by dashes, at most 40 characters. Empty text gives 'note'. */
export function slugify(text) {
  const s = String(text ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40).replace(/-+$/, '');
  return s || 'note';
}

/** The note's title, or the first line of the body when it has none. */
export const noteTitle = (e) => (e.data.title || String(e.data.body).split('\n')[0]).slice(0, 80);

/** Notes that still need exporting (never exported, or edited since). */
export const dirtyNotes = (entries) => entries.filter((e) => e.type === 'note' && isDirty(e));

/**
 * Files for every dirty note: [{ id, updatedAt, filename, markdown }]. Filenames are unique within
 * the batch. The caller marks each note exported only after its file is safely saved.
 */
export function buildNoteFiles(entries) {
  const taken = new Set();
  return dirtyNotes(entries).sort((a, b) => a.updatedAt - b.updatedAt).map((e) => {
    const rev = e.exportedAt != null ? `-rev${e.updatedAt.toString(36).slice(-5)}` : '';
    const base = `${e.date}-${slugify(noteTitle(e))}${rev}`;
    let filename = `${base}.md`;
    for (let n = 2; taken.has(filename); n += 1) filename = `${base}-${n}.md`;
    taken.add(filename);
    const markdown = [
      '---',
      'type: life-log-note',
      `created: ${e.date}`,
      'status: idea',
      'tags: [brainstorm]',
      '---',
      '',
      `# ${noteTitle(e)}`,
      '',
      e.data.body,
      '',
    ].join('\n');
    return { id: e.id, updatedAt: e.updatedAt, filename, markdown };
  });
}
