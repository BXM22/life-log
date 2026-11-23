// SYNC tab, v2 (docs/screens/sync.md "v2 update"). One ordered flow instead of the Export and Wipe sub-tabs:
//   root: Copies card, Free up space (1 Export entries, 2 Confirm the file is in Dropbox, 3 Wipe old entries), More rows.
//   pages: Export entries (while flow.step is built or shared), Wipe old entries, Weekly review, Backup and restore.
//   sheets: Is the file in Dropbox? (flow.step === 'shared'), Wipe N entries? (syncModal === 'wipe').
//   html:    exportView(state), wipeView(state) (same screen), svSubpage(state) (null on the root), dropboxModal()
//   state:   svPage: null | 'wipe' | 'review' | 'backup'. Export and its sheet follow state.flow, so no extra field.
//   actions: build, upload, share, confirmYes, confirmNo, openDropbox, connect, openWipe, tick, wipe, closeModal (app.js / syncActions.js),
//            sendReview, backup, restore, svOpen, svBack, svNotYet (syncActions.js). Styles: src/styles/w3-sync.css (.sv-*).

import { isDirty } from '../logic/exportBuilder.js';
import { planWipe } from '../logic/wipeEligibility.js';
import { getConfig, isConnected } from '../dropbox/dropbox.js';
import { renderBackupPanel } from './backupPanel.js';
import { esc } from './format.js';
import { ICON, copiesCard, reviewPage, pageHead, sheet, backupDue, backupMeter, meterWhen, modal } from './syncView.js';

export const waiting = (state) => state.entries.filter((e) => e.type !== 'note' && isDirty(e)).length; // notes are sent from TODAY
export const wipeOpts = (state) => ({ now: Date.now(), keepDays: state.keepDays, dayStartHour: state.dayStartHour });

const WIPE_TEXT = (n, range) =>
  `Wipe permanently deletes ${n} entries (${range ? `${range.from} to ${range.to}` : 'none'}) from this phone. ` +
  'Open the file in Dropbox first and confirm it is there. This cannot be undone.';
const UPLOADING = 'Uploading to Dropbox...'; // app.js upload sets this message, then renders, while the upload runs
const entriesWord = (n) => `${n} ${n === 1 ? 'entry' : 'entries'}`;
// Settings opens through stOpen (settings agent); data-tab keeps the plain tab action working as a fallback.
const SETTINGS = (page) => `data-action="stOpen" data-tab="settings"${page ? ` data-page="${page}"` : ''}`;

export const dropboxModal = () => modal('SET UP DROPBOX', `<p>Connect once to upload straight to your vault.</p>
  <input id="appKey" class="field" placeholder="Dropbox app key" value="${esc(getConfig().appKey || '')}" autocomplete="off">
  <button class="btn" data-action="connect">CONNECT DROPBOX</button>`);

/** Which Sync page is showing, or null for the root. Export follows the flow; the rest follow svPage. */
export function svSubpage(state) {
  const step = state.flow && state.flow.step;
  if (step === 'built' || step === 'shared') return 'export';
  if (state.svPage === 'wipe') return step === 'confirmed' ? 'wipe' : null;
  if (state.svPage === 'review' || state.svPage === 'backup') return state.svPage;
  return null;
}

const plan = (state) => planWipe(state.entries, state.flow.result.manifest, wipeOpts(state));

function step(n, status, title, sub, extra = '') {
  const mark = status === 'done' ? ICON.check : status === 'locked' ? ICON.lock : n;
  const label = status === 'done' ? 'done' : status === 'locked' ? 'locked' : 'next';
  return `<li class="sv-step ${status}"><span class="sv-num" aria-label="Step ${n}, ${label}">${mark}</span>
    <div class="sv-step-txt"><b>${esc(title)}</b><span>${esc(sub)}</span>${extra}</div></li>`;
}

function freeUpCard(state) {
  const n = waiting(state);
  const confirmed = state.flow.step === 'confirmed';
  const file = confirmed ? state.flow.result.filename : '';
  const s1 = confirmed
    ? step(1, 'done', 'Export entries', `Exported ${file}`)
    : step(1, 'active', 'Export entries', n ? `${entriesWord(n)} waiting. Notes send from Today.` : 'Nothing waiting. Notes send from Today.',
      `<button class="btn" data-action="build" ${n ? '' : 'disabled'}>${n ? 'Export entries' : 'Nothing to export'}</button>`);
  const s2 = confirmed
    ? step(2, 'done', 'Confirm the file is in Dropbox', 'Confirmed')
    : step(2, 'todo', 'Confirm the file is in Dropbox', 'After you save the file, check it landed.');
  let s3;
  if (!confirmed) s3 = step(3, 'locked', 'Wipe old entries', 'Opens after you confirm the file');
  else {
    const p = plan(state);
    s3 = p.count
      ? step(3, 'active', 'Wipe old entries', `${entriesWord(p.count)} older than ${state.keepDays} days can go.`,
        `<button class="btn sv-outline-danger" data-action="svOpen" data-page="wipe">Wipe ${entriesWord(p.count)}</button>`)
      : step(3, 'active', 'Wipe old entries', 'Nothing is old enough to wipe yet.');
  }
  return `<h3 class="sv-head">Free up space<span class="sv-pill">${confirmed ? 'Step 3 of 3' : 'Step 1 of 3'}</span></h3>
    <section class="sv-card sv-accent"><ol class="sv-steps">${s1}${s2}${s3}</ol></section>`;
}

const row = (attrs, icon, title, sub, tail = '') => `<button class="sv-row" ${attrs}>
  <span class="sv-ico">${icon}</span><span class="sv-row-txt"><b>${esc(title)}</b><span>${esc(sub)}</span></span>${tail}<span class="sv-chev">${ICON.chev}</span></button>`;

function moreCard(state) {
  const due = backupDue(state);
  const linked = isConnected();
  return `<h3 class="sv-head">More</h3>
    <div class="sv-card sv-rows">
      ${row('data-action="svOpen" data-page="review"', ICON.calendar, 'Weekly review', 'Send this week to your vault')}
      ${row('data-action="svOpen" data-page="backup"', ICON.archive, 'Backup and restore', `Last backup: ${meterWhen(backupMeter(state))}`, due ? '<em class="sv-tag">Overdue</em>' : '')}
      ${row(SETTINGS('dropbox'), ICON.cloud, 'Dropbox', linked ? `Connected, ${getConfig().folder}/` : 'Not set up', `<em class="sv-tag ${linked ? 'ok' : 'neutral'}">${linked ? 'On' : 'Set up'}</em>`)}
    </div>`;
}

function exportPage(state) {
  const { step: st, result, viaDownload } = state.flow;
  const m = result.manifest;
  const linked = isConnected();
  const busy = state.msg === UPLOADING;
  const first = linked
    ? `<button class="btn sv-iconbtn" data-action="upload" ${busy ? 'disabled aria-busy="true"' : ''}>${ICON.cloud}<span>${busy ? 'Uploading…' : 'Upload to Dropbox'}</span></button>
       <p class="sv-note">Goes to ${esc(getConfig().folder)}/</p>`
    : `<button class="btn sv-iconbtn" data-action="openDropbox">${ICON.cloud}<span>Set up Dropbox</span></button>`;
  const ask = st === 'shared' ? sheet('Is the file in Dropbox?', `<p class="sv-sub">${viaDownload ? 'The file was downloaded. The app cannot tell where it went.' : 'The share sheet closed.'}
      Check that <b>${esc(result.filename)}</b> is in your Dropbox folder.</p>
    <button class="btn" data-action="confirmYes">Yes, it is there</button>
    <button class="btn secondary" data-action="svNotYet">Not yet</button>`, 'svNotYet') : '';
  const dbx = state.syncModal === 'dropbox' && !linked ? dropboxModal() : '';
  return `${pageHead('confirmNo', 'Cancel export', 'Export entries')}
    <section class="sv-card sv-accent sv-hero">
      <span class="sv-ico">${ICON.file}</span>
      <div class="sv-hero-txt"><b class="sv-fname">${esc(result.filename)}</b><span>${entriesWord(m.items.length)}, ${esc(m.range.from)} to ${esc(m.range.to)}</span></div>
    </section>
    ${first}
    <button class="btn secondary sv-iconbtn" data-action="share" ${busy ? 'disabled' : ''}>${ICON.share}<span>Save with the share sheet</span></button>
    <p class="sv-note">Notes are not in this file. Send them from the Notes window on Today.</p>
    <h3 class="sv-head">Preview</h3>
    <pre class="sv-pre">${esc(result.markdown)}</pre>
    <button class="btn secondary" data-action="confirmNo" ${busy ? 'disabled' : ''}>Cancel</button>${ask}${dbx}`;
}

function wipePage(state) {
  const p = plan(state);
  const n = p.count;
  const range = p.range ? `${p.range.from} to ${p.range.to}` : '';
  const stays = [
    [`Last ${state.keepDays} days`, 'Everything logged in this window', `<button class="sv-link" ${SETTINGS()}>Change</button>`],
    ['Not yet exported', 'Anything not in a confirmed export'],
    ['Records and statistics', 'Best streaks, PRs, last sets and weigh-ins'],
    ['Habits, templates and settings', 'Workout plans and templates stay as they are'],
  ];
  const confirm = state.syncModal === 'wipe' && n > 0 ? sheet(`Wipe ${entriesWord(n)}?`, `<div class="warn sv-warn">${ICON.alert}<span>${esc(WIPE_TEXT(n, p.range))}</span></div>
      <label class="check sv-check"><input type="checkbox" data-action="tick" ${state.wipeTick ? 'checked' : ''}>
        <span>I opened the file in Dropbox and it is complete</span></label>
      <button class="btn danger" data-action="wipe" ${state.wipeTick ? '' : 'disabled'}>Wipe ${entriesWord(n)}</button>
      <button class="btn secondary" data-action="closeModal">Cancel</button>`, 'closeModal') : '';
  return `${pageHead('svBack', 'Back to sync', 'Wipe old entries')}
    <section class="sv-card sv-danger-card">
      ${n ? `<b class="sv-big">${n}</b><p class="sv-sub">${n === 1 ? 'entry' : 'entries'} from <b>${esc(range)}</b> will be deleted from this phone. They are in <b>${esc(state.flow.result.filename)}</b>.</p>`
    : '<p class="sv-sub">Nothing is old enough to wipe yet. Entries inside the keep window stay.</p>'}
    </section>
    <h3 class="sv-head">What stays<span class="sv-pill">${stays.length}</span></h3>
    <div class="sv-card sv-rows">${stays.map(([t, s, tail]) => `<div class="sv-row static"><span class="sv-ico ok">${ICON.check}</span>
      <span class="sv-row-txt"><b>${esc(t)}</b><span>${esc(s)}</span></span>${tail || ''}</div>`).join('')}</div>
    <div class="sv-danger-zone">
      <button class="btn danger" data-action="openWipe" ${n ? '' : 'disabled'}>Wipe ${entriesWord(n)}</button>
      <button class="btn secondary" data-action="svBack">Not now</button>
    </div>${confirm}`;
}

const backupPage = (state) => `${pageHead('svBack', 'Back to sync', 'Backup and restore')}${renderBackupPanel(state)}`;

export function exportView(state) {
  const page = svSubpage(state);
  let body;
  if (page === 'export') body = exportPage(state);
  else if (page === 'wipe') body = wipePage(state);
  else if (page === 'review') body = reviewPage(state);
  else if (page === 'backup') body = backupPage(state);
  else body = `${copiesCard(state)}${freeUpCard(state)}${moreCard(state)}${state.syncModal === 'dropbox' && !isConnected() ? dropboxModal() : ''}`;
  return `<div class="sv-x${page ? ` sv-page sv-${page}` : ' sv-root'}">${body}</div>`;
}

/** The old Wipe sub-tab id lands on the same screen. */
export const wipeView = (state) => exportView(state);
