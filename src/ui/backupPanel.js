// BACKUP / RESTORE panel. The caller (app.js) wires it in:
//   html:    renderBackupPanel(state)
//   actions: data-action="backup" -> backupActions.backup(state)  (returns a message string)
//            data-action="restore" -> backupActions.restore(state) (returns { msg, merged? })

import { buildBackup, backupFilename, parseBackup, mergeBackup } from '../logic/backup.js';
import { loadForBackup, applyRestore } from '../db/backupStore.js';

export function renderBackupPanel(state) {
  const n = state.entries ? state.entries.length : 0;
  return `<div class="panel">
    <h2>BACKUP</h2>
    <p>A copy of everything on this phone (${n} entries) as one file. Save it somewhere off this phone.</p>
    <button class="btn" data-action="backup">BACKUP NOW</button>
    <p style="margin-top:12px">Restore adds back anything missing and keeps the newest version of each entry. It never deletes.</p>
    <input id="restoreFile" class="field" type="file" accept="application/json,.json" aria-label="Backup file">
    <button class="btn secondary" data-action="restore">RESTORE FROM FILE</button>
  </div>`;
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
        return `Backup shared: ${file.name}. Check that it landed somewhere safe.`;
      }
      download(file);
      return `Backup downloaded: ${file.name}. Move it off this phone.`;
    } catch (err) {
      if (err && err.name === 'AbortError') return 'Backup cancelled. Nothing changed.';
      try {
        download(file);
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
