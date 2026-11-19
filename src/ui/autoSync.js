// Auto sync runner. Uploads finished days to Dropbox when the app opens or comes back to the foreground.
// A web app cannot run while closed (no backend, no background sync on iOS), so this is catch-up, not a timer.
// Same safety as the manual path: only a size-and-hash verified upload marks entries exported.
import { buildExport } from '../logic/exportBuilder.js';
import { autoSyncDue, finishedDayEntries } from '../logic/autoSync.js';
import { recordsMarkdown, mergeRecords } from '../logic/records.js';
import { getConfig, isConnected, upload } from '../dropbox/dropbox.js';

/** deps: { state, render, today(), stamp(result) } where stamp saves the confirmation and updates state. */
export function createAutoSync({ state, render, today, stamp }) {
  let busy = false;
  let lastTryAt = 0;

  async function run() {
    const now = Date.now();
    const due = autoSyncDue({
      enabled: state.autoSync !== false, connected: isConnected(), busy: busy || state.flow.step === 'built' || state.flow.step === 'shared',
      entries: state.entries, today: today(), lastTryAt, now,
    });
    if (!due) return;
    const result = buildExport(finishedDayEntries(state.entries, today()), {
      now, existingFilenames: state.exportedNames, recordsMd: recordsMarkdown(mergeRecords(state.stats?.records, state.entries)),
    });
    if (!result) return;
    busy = true;
    lastTryAt = now;
    try {
      const res = await upload(result.filename, result.markdown, getConfig().folder);
      if (!res.verified) {
        state.msg = `Auto sync uploaded ${res.path}, but Dropbox's size or hash did not match. Not marked exported. Check the file.`;
      } else {
        try {
          await stamp(result);
          state.msg = `Auto-synced ${result.manifest.range.from} to ${result.manifest.range.to}: ${res.path}`;
        } catch {
          state.msg = `Auto sync uploaded ${res.path}, but saving the confirmation failed. Nothing was marked exported.`;
        }
      }
    } catch (err) {
      state.msg = `Auto sync failed: ${err.message || 'upload error'}. Will retry.`;
    } finally {
      busy = false;
      render();
    }
  }

  return { run };
}
