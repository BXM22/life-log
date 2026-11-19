// Sync runners. Auto sync uploads finished days to Dropbox when the app opens or comes back to the foreground.
// A web app cannot run while closed (no backend, no background sync on iOS), so this is catch-up, not a timer.
// SYNC NOW (Today) uses the same upload core over every live entry. Same safety on both paths:
// only a size-and-hash verified upload marks entries exported.
import { buildExport } from '../logic/exportBuilder.js';
import { autoSyncDue, finishedDayEntries } from '../logic/autoSync.js';
import { recordsMarkdown, mergeRecords } from '../logic/records.js';
import { getConfig, isConnected, upload } from '../dropbox/dropbox.js';

/**
 * Shared upload core. Builds an export of `entries`, uploads it, and calls stamp(result) only when verified.
 * Returns { ok, message, empty? }; never throws. ok is true only when verified AND the confirmation saved.
 */
export async function syncEntries(entries, { state, stamp, now = Date.now(), label = 'Synced' }) {
  const result = buildExport(entries, {
    now, existingFilenames: state.exportedNames, recordsMd: recordsMarkdown(mergeRecords(state.stats?.records, state.entries)),
  });
  if (!result) return { ok: true, empty: true, message: 'Nothing to sync.' };
  try {
    const res = await upload(result.filename, result.markdown, getConfig().folder);
    if (!res.verified) {
      return { ok: false, message: `${label} uploaded ${res.path}, but Dropbox's size or hash did not match. Not marked exported. Check the file.` };
    }
    try {
      await stamp(result);
    } catch {
      return { ok: false, message: `${label} uploaded ${res.path}, but saving the confirmation failed. Nothing was marked exported.` };
    }
    return { ok: true, message: `${label} ${result.manifest.range.from} to ${result.manifest.range.to}: ${res.path}` };
  } catch (err) {
    return { ok: false, message: `${label} failed: ${err.message || 'upload error'}.` };
  }
}

const flowBusy = (state) => state.flow.step === 'built' || state.flow.step === 'shared';

/** deps: { state, render, today(), stamp(result) } where stamp saves the confirmation and updates state. */
export function createAutoSync({ state, render, today, stamp }) {
  let busy = false;
  let lastTryAt = 0;

  async function run() {
    const now = Date.now();
    const due = autoSyncDue({
      enabled: state.autoSync !== false, connected: isConnected(), busy: busy || flowBusy(state),
      entries: state.entries, today: today(), lastTryAt, now,
    });
    if (!due) return;
    busy = true;
    lastTryAt = now;
    try {
      const r = await syncEntries(finishedDayEntries(state.entries, today()), { state, stamp, now, label: 'Auto sync' });
      if (r.empty) return;
      state.msg = r.ok ? r.message.replace(/^Auto sync /, 'Auto-synced ') : `${r.message}${r.message.includes('failed:') ? ' Will retry.' : ''}`;
    } finally {
      busy = false;
      render();
    }
  }

  return { run };
}

/** SYNC NOW on Today. deps: { state, render, stamp(result) }. Uploads every live entry, today included. */
export function createSyncNow({ state, render, stamp }) {
  let busy = false;

  async function syncNow() {
    if (busy || flowBusy(state)) return;
    if (!isConnected()) {
      state.tab = 'export';
      state.msg = 'Connect Dropbox to sync from here.';
      render();
      return;
    }
    busy = true;
    state.msg = 'Syncing...';
    render();
    try {
      const r = await syncEntries(state.entries, { state, stamp, now: Date.now(), label: 'Synced' });
      state.msg = r.message;
    } finally {
      busy = false;
      render();
    }
  }

  return { syncNow };
}
