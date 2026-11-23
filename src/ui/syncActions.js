// Actions for the Sync tab extras (F37 weekly review send, F43 dialogs and collapsible backup).
// app.js merges these into its action table.
import { reviewMarkdown, reviewFilename, REVIEW_FOLDER } from '../logic/weeklyReview.js';
import { getConfig, isConnected, upload } from '../dropbox/dropbox.js';
import { currentReview } from './syncView.js';

function download(file) {
  const url = URL.createObjectURL(file);
  const a = Object.assign(document.createElement('a'), { href: url, download: file.name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const SV_PAGES = ['wipe', 'review', 'backup'];

export function createSyncActions({ state, onChange }) {
  return {
    openWipe: () => { state.syncModal = 'wipe'; state.wipeTick = false; },
    openDropbox: () => { state.syncModal = 'dropbox'; },
    closeModal: () => { state.syncModal = null; state.wipeTick = false; },
    toggleBackup: () => { state.backupOpen = !state.backupOpen; },

    // Sync v2 page stack. svPage: null (root) | 'wipe' | 'review' | 'backup'. Export follows state.flow.
    svOpen: (el) => {
      const page = el && el.dataset ? el.dataset.page : null;
      state.svPage = SV_PAGES.includes(page) ? page : null;
      state.syncModal = null;
      state.wipeTick = false;
      try { window.scrollTo(0, 0); } catch { /* no window in tests */ }
    },
    svBack: () => { state.svPage = null; state.syncModal = null; state.wipeTick = false; },
    // "Not yet" on the Is the file in Dropbox? sheet: back to the Export page with the same file, nothing marked.
    svNotYet: () => {
      if (state.flow && state.flow.step === 'shared') state.flow.step = 'built';
      state.msg = 'Not confirmed. Save the file again, or cancel.';
    },

    // Same export path as notes: straight to Dropbox when connected, else the share sheet or a download.
    sendReview: async () => {
      const r = currentReview(state);
      const filename = reviewFilename(r.end);
      const markdown = reviewMarkdown(r);
      if (isConnected()) {
        state.msg = 'Sending review to Dropbox...';
        onChange();
        try {
          const res = await upload(filename, markdown, `${getConfig().folder}/${REVIEW_FOLDER}`);
          state.msg = res.verified ? `Review sent: ${res.path}` : `Uploaded ${res.path}, but Dropbox's size or hash did not match. Check the file.`;
        } catch (err) { state.msg = err.message || 'Upload failed. Nothing changed.'; }
        return;
      }
      const file = new File([markdown], filename, { type: 'text/markdown' });
      try {
        if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], title: filename });
        else download(file);
        state.msg = `Review ready: ${filename}.`;
      } catch (err) {
        if (err && err.name === 'AbortError') { state.msg = 'Share cancelled. Nothing changed.'; return; }
        try { download(file); state.msg = `Downloaded ${filename}.`; } catch { state.msg = 'Share and download both failed. Nothing changed.'; }
      }
    },
  };
}
