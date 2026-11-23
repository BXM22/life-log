// BACKUP / RESTORE page body (Sync v2, shown by exportWipeView when state.svPage === 'backup'). The caller (app.js) wires it in:
//   html:    renderBackupPanel(state)  (styles: w3-sync.css)
//   actions: data-action="backup" -> backupActions.backup(state)  (returns a message string)
//            data-action="restore" -> backupActions.restore(state) (returns { msg, merged? })

import { buildBackup, backupFilename, parseBackup, mergeBackup } from '../logic/backup.js';
import { saveLastBackup } from '../logic/backupNudge.js';
import { loadForBackup, applyRestore } from '../db/backupStore.js';

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** Backup and restore page body (Sync v2): what the file holds, Back up now, then the Restore card. */
export function renderBackupPanel(state) {
  const n = state.entries ? state.entries.length : 0;
  const h = state.habits ? state.habits.length : 0;
  const x = state.exportedNames ? state.exportedNames.length : 0;
  return `<section class="sv-card sv-accent">
      <h3 class="sv-card-title">Back up</h3>
      <p class="sv-sub">One file with everything on this phone. Save it somewhere off this phone.</p>
      <ul class="sv-list">
        <li><b>Entries</b><span>${plural(n, 'entry', 'entries')}</span></li>
        <li><b>Habits</b><span>${plural(h, 'habit')}</span></li>
        <li><b>Export history</b><span>${plural(x, 'file')}</span></li>
      </ul>
      <p class="sv-note">Workout templates and rest timer settings are not in the file yet.</p>
      <button class="btn" data-action="backup">Back up now</button>
    </section>
    <section class="sv-card">
      <h3 class="sv-card-title">Restore</h3>
      <p class="sv-sub">Adds back anything missing and keeps the newest version of each entry. It never deletes.</p>
      <label class="sv-lbl" for="restoreFile">Choose a backup file</label>
      <input id="restoreFile" class="field sv-file" type="file" accept="application/json,.json">
      <button class="btn secondary" data-action="restore">Restore from file</button>
    </section>`;
}

function download(file) {
  const url = URL.createObjectURL(file);
  const a = Object.assign(document.createElement('a'), { href: url, download: file.name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// The database is the source of truth. If storage is unavailable, fall back to what is in memory.
async function currentData(state) {
  if (state.storageOk) return loadForBackup();
  return { entries: state.entries || [], habits: state.habits || [], exports: [] };
}

export const backupActions = {
  /** Share (or download) a backup file. Returns a message for state.msg. */
  async backup(state) {
    const now = Date.now();
    const data = await currentData(state);
    const file = new File([JSON.stringify(buildBackup(data, now), null, 2)], backupFilename(now), { type: 'application/json' });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: file.name });
        try { saveLastBackup(localStorage, Date.now()); } catch { /* storage blocked */ }
        return `Backup shared: ${file.name}. Check that it landed somewhere safe.`;
      }
      download(file);
      try { saveLastBackup(localStorage, Date.now()); } catch { /* storage blocked */ }
      return `Backup downloaded: ${file.name}. Move it off this phone.`;
    } catch (err) {
      if (err && err.name === 'AbortError') return 'Backup cancelled. Nothing changed.';
      try {
        download(file);
        try { saveLastBackup(localStorage, Date.now()); } catch { /* storage blocked */ }
        return `Share unavailable (${err && err.name}). Downloaded ${file.name} instead.`;
      } catch (dlErr) {
        return `Backup failed (${err && err.name}; ${dlErr && dlErr.name}). Nothing changed.`;
      }
    }
  },

  /** Restore from the chosen file. Returns { msg, merged? }; merged is set only on success. */
  async restore(state) {
    const input = document.getElementById('restoreFile');
    const file = input && input.files && input.files[0];
    if (!file) return { msg: 'Choose a backup file first.' };
    let backup;
    try {
      backup = parseBackup(await file.text());
    } catch (err) {
      return { msg: `${err.message} Nothing changed.` };
    }
    const merged = mergeBackup(await currentData(state), backup);
    try {
      if (state.storageOk) await applyRestore(merged);
    } catch (err) {
      return { msg: `Restore failed to save (${err && err.name}: ${err && err.message}). Nothing changed.` };
    }
    return { msg: `Restored from ${file.name}: ${merged.entries.length} entries, ${merged.habits.length} habits.`, merged };
  },
};
