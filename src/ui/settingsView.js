// SETTINGS tab, v2 (docs/screens/settings.md "v2 update"). One calm root screen, pages for Rest timer and Dropbox,
// a sheet for New day starts at. Settings live on this device (see logic/settings.js). Styles: src/styles/w3-settings.css (.st-).
//   html:    settingsView(state)
//   actions: existing, in app.js: setTheme | setKeep | setPlanDays (buttons carry value=), setExportReminder | setAutoSync (switches),
//            install | disconnect | openDropbox | connect | closeModal; restAuto (restActions.js)
//            new, in settingsActions.js: stOpen | stBack | stDayOpen | stDayPick | stDayUse | stSheetClose | stRestLen | stRestCustom | stGoSync
//   state:   stPage (null | 'rest' | 'dropbox'), stSheet (null | 'dayStart'), stDayPick

import { KEEP_OPTIONS, DAY_START_OPTIONS, PLAN_DAYS_OPTIONS, THEME_OPTIONS } from '../logic/settings.js';
import { reminderNotifySupported } from '../logic/exportReminder.js';
import { installMessage } from '../logic/install.js';
import { fmt, DEFAULT_SECONDS } from '../logic/rest.js';
import { getConfig, isConnected } from '../dropbox/dropbox.js';
import { esc } from './format.js';
import { dropboxModal } from './exportWipeView.js';
import { backButton } from './templateTagsView.js';
import { UPDATES, RECENT_UPDATES_SHOWN } from '../logic/updates.js';

export const REST_LENGTHS = [45, 60, 90, 120, 180];
const THEME_LABEL = { system: 'System', light: 'Light', dark: 'Dark' };
export const hourLabel = (h) => (h === 0 ? 'Midnight' : `${h}:00 AM`);
const planText = (n) => (n === 3 ? 'Tue Upper A, Thu Lower, Sat Upper B' : 'Tue Upper A, Thu Lower, Sat Upper B, Sun Upper C');

// SVG icons, 24 px viewBox, stroke 1.8.
const svg = (d) => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
const ICON = {
  theme: svg('<circle cx="12" cy="12" r="8"/><path d="M12 4v16a8 8 0 0 0 0-16z" fill="currentColor" stroke="none"/>'),
  sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  keep: svg('<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M9 3v4M15 3v4"/>'),
  lift: svg('<path d="M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12"/>'),
  timer: svg('<circle cx="12" cy="13" r="7"/><path d="M12 13V9.5M10 3h4"/>'),
  cloud: svg('<path d="M7 18a4 4 0 0 1-.5-8A5.5 5.5 0 0 1 17 9a4.5 4.5 0 0 1 .5 9z"/>'),
  bell: svg('<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0"/>'),
  sync: svg('<path d="M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5"/>'),
  phone: svg('<rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M11 18h2"/>'),
  chev: '<svg class="st-chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M9 6l6 6-6 6"/></svg>',
};

const group = (title, body, count) => `<h3 class="st-group">${esc(title)}${count != null ? `<span>${count}</span>` : ''}</h3><div class="st-card">${body}</div>`;
const note = (text) => (text ? `<p class="st-note">${text}</p>` : '');

// Row that opens a page or a sheet: label left, value and chevron right.
const linkRow = (icon, label, value, attrs) => `<button class="st-row st-link" ${attrs}><span class="st-ico">${icon}</span><span class="st-text"><b>${esc(label)}</b></span><span class="st-val">${esc(value)}</span>${ICON.chev}</button>`;

// Segmented control built from buttons. Existing actions read el.value, so each button carries value=.
const seg = (action, list, current, label, fmtFn = String) => `<div class="st-seg" role="group" aria-label="${esc(label)}">${list.map((v) =>
  `<button class="st-seg-btn" data-action="${action}" value="${esc(String(v))}" aria-pressed="${v === current}">${esc(fmtFn(v))}</button>`).join('')}</div>`;

const segRow = (icon, label, sub, control) => `<div class="st-row st-stack"><div class="st-rowhead"><span class="st-ico">${icon}</span><span class="st-text"><b>${esc(label)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</span></div>${control}</div>`;

const switchRow = (icon, label, sub, action, on, disabled = false) => `<label class="st-row st-switchrow${disabled ? ' off' : ''}"><span class="st-ico">${icon}</span><span class="st-text"><b>${esc(label)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</span><input type="checkbox" role="switch" class="st-switch" data-action="${action}" aria-label="${esc(label)}" ${on ? 'checked' : ''} ${disabled ? 'disabled' : ''}></label>`;

const pageHead = (title, backLabel = 'Back to settings') => `<div class="backrow">${backButton('stBack', backLabel)}</div><h2 class="subtitle st-title">${esc(title)}</h2>`;

const restSummary = (rest) => {
  const r = rest || { seconds: DEFAULT_SECONDS, auto: true };
  return `${fmt(r.seconds)}, ${r.auto ? 'auto-start' : 'manual'}`;
};

const shortDate = (ms) => new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

function rootView(state) {
  const msg = installMessage(state.installKind);
  const connected = isConnected();
  const theme = `<section class="st-hero" aria-label="Appearance">
      <div class="st-rowhead"><span class="st-ico">${ICON.theme}</span><span class="st-text"><b>Theme</b><small>System follows your phone. Light and Dark stay fixed.</small></span></div>
      ${seg('setTheme', THEME_OPTIONS, state.theme, 'Theme', (t) => THEME_LABEL[t] || t)}
    </section>`;
  const day = group('Your day', `
      ${linkRow(ICON.sun, 'New day starts at', hourLabel(state.dayStartHour), 'data-action="stDayOpen" aria-haspopup="dialog"')}
      ${segRow(ICON.keep, 'Keep after a wipe', 'Days that stay on this phone', seg('setKeep', KEEP_OPTIONS, state.keepDays, 'Keep days after a wipe', (d) => (d === 1 ? '1 day' : `${d} days`)))}`)
    + note('Logs made before the start hour count toward the previous day.');
  const training = group('Training', `
      ${segRow(ICON.lift, 'Lifting days per week', planText(state.planDays), seg('setPlanDays', PLAN_DAYS_OPTIONS, state.planDays, 'Lifting days per week'))}
      ${linkRow(ICON.timer, 'Rest timer', restSummary(state.rest), 'data-action="stOpen" data-page="rest"')}`);
  const backup = group('Backup', `
      ${linkRow(ICON.cloud, 'Dropbox', connected ? 'Connected' : 'Not set up', 'data-action="stOpen" data-page="dropbox"')}
      ${switchRow(ICON.bell, 'Remind me to export weekly', `Banner on Today after 7 days${reminderNotifySupported() ? ', plus a notification if you allow them' : ''}`, 'setExportReminder', state.exportReminder !== false)}`);
  const storage = [esc(state.storageLine || ''), esc(msg)].filter(Boolean).join(' ');
  const updates = UPDATES.slice(0, RECENT_UPDATES_SHOWN);
  const news = group("What's new", updates.map((u) =>
    `<div class="st-row st-news"><time datetime="${esc(u.date)}">${esc(shortDate(`${u.date}T12:00:00`))}</time><p>${esc(u.text)}</p></div>`).join(''), updates.length);
  return `<div class="st-page">${theme}${day}${training}${backup}
    <div class="st-device"><span class="st-ico">${ICON.phone}</span><p>Your data stays on this phone until you export it.${storage ? ` ${storage}` : ''}</p></div>
    ${state.installKind === 'prompt' ? '<button class="btn st-primary" data-action="install">Add to Home Screen</button>' : ''}
    ${news}</div>${state.stSheet === 'dayStart' ? daySheet(state) : ''}`;
}

function daySheet(state) {
  const pick = DAY_START_OPTIONS.includes(state.stDayPick) ? state.stDayPick : state.dayStartHour;
  const rows = DAY_START_OPTIONS.map((h) =>
    `<button class="st-radio" role="radio" aria-checked="${h === pick}" data-action="stDayPick" data-h="${h}"><span>${esc(hourLabel(h))}</span><i aria-hidden="true"></i></button>`).join('');
  return `<div class="st-scrim" data-action="stSheetClose" aria-hidden="true"></div>
    <div class="st-sheet" role="dialog" aria-modal="true" aria-label="New day starts at">
      <div class="st-grab" aria-hidden="true"></div>
      <h2 class="st-sheet-title">New day starts at</h2>
      <p class="st-note">Logs made before this hour count toward the previous day.</p>
      <div class="st-radios" role="radiogroup" aria-label="Start hour">${rows}</div>
      <button class="btn st-primary" data-action="stDayUse">Use ${esc(hourLabel(pick))}</button>
      <button class="btn secondary st-cancel" data-action="stSheetClose">Cancel</button>
    </div>`;
}

function restView(state) {
  const r = state.rest || { seconds: DEFAULT_SECONDS, auto: true };
  const custom = !REST_LENGTHS.includes(r.seconds);
  const chip = (on, attrs, text) => `<button class="st-chip" ${attrs} aria-pressed="${on}">${esc(text)}</button>`;
  const chips = REST_LENGTHS.map((s) => chip(s === r.seconds, `data-action="stRestLen" data-s="${s}"`, fmt(s))).join('')
    + chip(custom, 'data-action="stRestCustom"', custom ? `Custom ${fmt(r.seconds)}` : 'Custom');
  return `<div class="st-page">${pageHead('Rest timer')}
    <section class="st-hero" aria-label="Default length">
      <div class="st-rowhead"><span class="st-ico">${ICON.timer}</span><span class="st-text"><b>Default length</b><small>Now ${esc(fmt(r.seconds))}</small></span></div>
      <div class="st-chips" role="group" aria-label="Default rest length">${chips}</div>
    </section>
    <div class="st-card st-gap">${switchRow(ICON.sync, 'Start rest after each set', 'Starts the timer when you log a working set', 'restAuto', r.auto !== false)}</div>
    ${note('Both save right away. The rest page can still change the length during a workout. Custom opens its wheel.')}</div>`;
}

function dropboxView(state) {
  const connected = isConnected();
  const head = pageHead('Dropbox');
  if (connected) {
    const last = state.lastExportAt ? `Last export ${shortDate(state.lastExportAt)}` : 'No export yet';
    return `<div class="st-page">${head}
      <section class="st-hero" aria-label="Dropbox status">
        <div class="st-rowhead"><span class="st-ico">${ICON.cloud}</span><span class="st-text"><b>Connected</b><small>Exports go to ${esc(getConfig().folder)}/</small></span></div>
        <p class="st-status">${esc(last)}</p>
      </section>
      <div class="st-card st-gap">
        ${switchRow(ICON.sync, 'Upload finished days', 'When you open the app, days before today upload on their own', 'setAutoSync', state.autoSync !== false)}
        ${linkRow(ICON.cloud, 'Go to Sync', 'Export and wipe', 'data-action="stGoSync"')}
      </div>
      ${note('It cannot run while the app is closed. Notes still send from the Today tab.')}
      <div class="st-danger-zone">
        <button class="btn secondary st-disconnect" data-action="disconnect">Disconnect Dropbox</button>
        ${note('Files already in Dropbox stay there.')}
      </div></div>`;
  }
  return `<div class="st-page">${head}
    <section class="st-hero" aria-label="Dropbox status">
      <div class="st-rowhead"><span class="st-ico">${ICON.cloud}</span><span class="st-text"><b>Not connected</b><small>Connect once to upload exports straight to your vault.</small></span></div>
      <button class="btn st-primary" data-action="openDropbox">Connect Dropbox</button>
    </section>
    <div class="st-card st-gap">${switchRow(ICON.sync, 'Upload finished days', 'Works once Dropbox is connected', 'setAutoSync', false, true)}</div>
    ${state.syncModal === 'dropbox' ? dropboxModal() : ''}</div>`;
}

export function settingsView(state) {
  if (state.stPage === 'rest') return restView(state);
  if (state.stPage === 'dropbox') return dropboxView(state);
  return `${rootView(state)}${state.syncModal === 'dropbox' && !isConnected() ? dropboxModal() : ''}`;
}
