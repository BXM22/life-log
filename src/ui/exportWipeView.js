// EXPORT and WIPE tabs (moved out of app.js to keep it under 500 lines).
//   html: exportView(state), wipeView(state). Actions stay in app.js.

import { isDirty } from '../logic/exportBuilder.js';
import { planWipe } from '../logic/wipeEligibility.js';
import { getConfig, isConnected } from '../dropbox/dropbox.js';
import { renderBackupPanel } from './backupPanel.js';
import { esc } from './format.js';

export const waiting = (state) => state.entries.filter((e) => e.type !== 'note' && isDirty(e)).length; // notes are sent from TODAY
export const wipeOpts = (state) => ({ now: Date.now(), keepDays: state.keepDays, dayStartHour: state.dayStartHour });

const WIPE_TEXT = (n, range) =>
  `Wipe permanently deletes ${n} entries (${range ? `${range.from} to ${range.to}` : 'none'}) from this phone. ` +
  'Open the file in Dropbox first and confirm it is there. This cannot be undone.';

function dropboxBlock() {
  if (isConnected()) {
    return `<button class="btn" data-action="upload">UPLOAD TO DROPBOX</button>
      <p>Goes to ${esc(getConfig().folder)}/</p>
      <button class="btn secondary" data-action="disconnect">DISCONNECT DROPBOX</button>`;
  }
  return `<p>Connect once to upload straight to your vault.</p>
    <input id="appKey" class="field" placeholder="Dropbox app key" value="${esc(getConfig().appKey || '')}" autocomplete="off">
    <button class="btn" data-action="connect">CONNECT DROPBOX</button>`;
}

export function exportView(state) {
  const { step, result, viaDownload } = state.flow;
  const n = waiting(state);
  let body = '';
  if (step === 'idle') {
    body = `<p>${n} entries waiting.</p><button class="btn" data-action="build" ${n ? '' : 'disabled'}>EXPORT</button>`;
  } else if (step === 'built') {
    body = `<p>File: <b>${esc(result.filename)}</b><br>${result.manifest.items.length} entries, ${esc(result.manifest.range.from)} to ${esc(result.manifest.range.to)}</p>
      ${dropboxBlock()}
      <button class="btn ${isConnected() ? 'secondary' : ''}" data-action="share">SAVE VIA SHARE SHEET</button>
      <button class="btn secondary" data-action="confirmNo">CANCEL</button>
      <pre>${esc(result.markdown)}</pre>`;
  } else if (step === 'shared') {
    body = `<p>${viaDownload ? 'The file was downloaded. The app cannot tell where it went.' : 'The share sheet closed.'}</p>
      <p><b>Is ${esc(result.filename)} in Dropbox?</b></p>
      <button class="btn" data-action="confirmYes">YES, IT IS</button>
      <button class="btn secondary" data-action="confirmNo">NO</button>`;
  } else {
    body = `<p>Confirmed: ${esc(result.filename)}. Go to WIPE when you are ready.</p>
      <button class="btn secondary" data-tab="wipe" data-action="tab">GO TO WIPE</button>`;
  }
  return `<div class="panel"><h2>EXPORT</h2>${body}</div>${renderBackupPanel(state)}`;
}

export function wipeView(state) {
  const { step, result } = state.flow;
  const keep = `<p>Keep the last <select data-action="setKeep" aria-label="Keep days">
      ${[0, 3, 7, 14].map((d) => `<option value="${d}" ${d === state.keepDays ? 'selected' : ''}>${d}</option>`).join('')}
    </select> days on this phone.</p>`;
  if (step !== 'confirmed') {
    return `<div class="panel"><h2>WIPE</h2>${keep}
      <p>Wipe is off until you export and confirm the file is in Dropbox.</p>
      <button class="btn danger" disabled>WIPE !!</button></div>`;
  }
  const plan = planWipe(state.entries, result.manifest, wipeOpts(state));
  const ready = state.wipeTick && plan.count > 0;
  return `<div class="panel"><h2>WIPE</h2>${keep}
    <div class="warn">${esc(WIPE_TEXT(plan.count, plan.range))}</div>
    <label class="check"><input type="checkbox" data-action="tick" ${state.wipeTick ? 'checked' : ''}>
      <span>I opened the file in Dropbox and it is complete</span></label>
    <button class="btn danger" data-action="wipe" ${ready ? '' : 'disabled'}>WIPE ${plan.count} !!</button>
    ${plan.count === 0 ? '<p>Nothing is old enough to wipe yet.</p>' : ''}</div>`;
}
