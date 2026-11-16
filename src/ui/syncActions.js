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

export function createSyncActions({ state, onChange }) {
  return {
    openWipe: () => { state.syncModal = 'wipe'; state.wipeTick = false; },
    openDropbox: () => { state.syncModal = 'dropbox'; },
    closeModal: () => { state.syncModal = null; state.wipeTick = false; },
    toggleBackup: () => { state.backupOpen = !state.backupOpen; },

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
