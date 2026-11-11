// Actions for the NOTES panel. app.js merges these into its action table, passing in the pieces it
// owns. Sending notes uploads one file per note to <vault folder>/notes/ (Dropbox, never overwriting),
// or hands them to the share sheet. Notes are marked exported only for files that were saved.

import { newEntry, parseNote } from '../logic/entries.js';
import { markExported } from '../logic/wipeEligibility.js';
import { buildNoteFiles, NOTES_FOLDER } from '../logic/notesExport.js';
import { getConfig, isConnected, upload } from '../dropbox/dropbox.js';

export function createNotesActions({ state, saveEntries, saveFail, inputValue, today, download, onChange }) {
  // Upload each file in turn; stop at the first failure. Returns { saved, error }.
  async function viaDropbox(files) {
    const saved = [];
    for (const f of files) {
      try {
        const res = await upload(f.filename, f.markdown, `${getConfig().folder}/${NOTES_FOLDER}`);
        if (!res.verified) return { saved, error: `${f.filename} uploaded, but Dropbox's size or hash did not match. Not marked sent.` };
        saved.push(f);
      } catch (err) {
        return { saved, error: err.message || 'Upload failed.' };
      }
    }
    return { saved };
  }

  // Share sheet, or a download where sharing is unavailable. The app cannot see where the files went.
  async function viaShare(files) {
    const list = files.map((f) => new File([f.markdown], f.filename, { type: 'text/markdown' }));
    try {
      if (navigator.canShare && navigator.canShare({ files: list })) await navigator.share({ files: list, title: 'Life Log notes' });
      else list.forEach(download);
      return { saved: files };
    } catch (err) {
      if (err && err.name === 'AbortError') return { saved: [], error: 'Share cancelled. Nothing changed.' };
      try { list.forEach(download); return { saved: files }; } catch { return { saved: [], error: 'Share and download both failed. Nothing changed.' }; }
    }
  }

  return {
    logNote: async () => {
      const raw = { title: inputValue('note-title'), body: inputValue('note-body') };
      const r = parseNote(raw);
      if (r.error) { state.noteDraft = raw; state.msg = r.error; return; }
      const e = newEntry('note', today(), r.data, Date.now());
      try { await saveEntries([e]); } catch (err) { state.noteDraft = raw; state.msg = saveFail(err); return; }
      state.entries.push(e);
      state.noteDraft = null;
      state.msg = 'Note saved.';
    },

    exportNotes: async () => {
      const files = buildNoteFiles(state.entries);
      if (!files.length) { state.msg = 'No notes waiting.'; return; }
      if (isConnected()) { state.msg = 'Sending notes to Dropbox...'; onChange(); }
      const { saved, error } = await (isConnected() ? viaDropbox(files) : viaShare(files));
      if (saved.length) {
        const at = Date.now();
        const manifest = { exportId: `notes-${at}`, items: saved.map((f) => ({ id: f.id, updatedAt: f.updatedAt })) };
        const stamped = markExported(state.entries, manifest, at);
        try { await saveEntries(stamped.filter((e, i) => e !== state.entries[i])); } catch (err) {
          state.msg = `Sent ${saved.length} note(s), but saving that failed. Do not send again: the files already exist. (${err && err.message})`;
          return;
        }
        state.entries = stamped;
      }
      state.msg = error
        ? `Sent ${saved.length} of ${files.length}. ${error}`
        : `Sent ${saved.length} note${saved.length === 1 ? '' : 's'} to ${isConnected() ? 'Dropbox' : 'the share sheet'}.`;
    },
  };
}
