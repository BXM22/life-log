// SETTINGS tab. Settings live on this device (see logic/settings.js).
//   html:    settingsView(state)
//   actions: data-action="setKeep" | "setDayStart" | "install" | "disconnect" (handled in app.js)

import { KEEP_OPTIONS, DAY_START_OPTIONS, PLAN_DAYS_OPTIONS } from '../logic/settings.js';
import { installMessage } from '../logic/install.js';
import { getConfig, isConnected } from '../dropbox/dropbox.js';
import { esc } from './format.js';

const options = (list, current, fmt = String) =>
  list.map((v) => `<option value="${v}" ${v === current ? 'selected' : ''}>${esc(fmt(v))}</option>`).join('');

export function settingsView(state) {
  const hour = (h) => (h === 0 ? 'midnight' : `${h}:00 AM`);
  const msg = installMessage(state.installKind);
  return `<div class="panel"><h2>WIPE</h2>
      <p>Keep the last <select data-action="setKeep" aria-label="Keep days">${options(KEEP_OPTIONS, state.keepDays)}</select> days on this phone after a wipe.</p>
    </div>
    <div class="panel"><h2>PLAN</h2>
      <p>Lifting days per week <select data-action="setPlanDays" aria-label="Lifting days per week">${options(PLAN_DAYS_OPTIONS, state.planDays)}</select></p>
      <p>${state.planDays === 3 ? 'Tue Upper A, Thu Lower, Sat Upper B.' : 'Tue Upper A, Thu Lower, Sat Upper B, Sun Upper C.'}</p>
    </div>
    <div class="panel"><h2>DAY</h2>
      <p>A new day starts at <select data-action="setDayStart" aria-label="Day start hour">${options(DAY_START_OPTIONS, state.dayStartHour, hour)}</select></p>
      <p>Logs made before then count toward the previous day.</p>
    </div>
    <div class="panel"><h2>STORAGE</h2>
      <p>${esc(state.storageLine)}</p>
      ${msg ? `<p>${esc(msg)}</p>` : ''}
      ${state.installKind === 'prompt' ? '<button class="btn" data-action="install">ADD TO HOME SCREEN</button>' : ''}
    </div>
    <div class="panel"><h2>DROPBOX</h2>
      ${isConnected()
    ? `<p>Connected. Exports go to ${esc(getConfig().folder)}/</p><button class="btn secondary" data-action="disconnect">DISCONNECT DROPBOX</button>`
    : '<p>Not connected. Connect from the EXPORT tab.</p>'}
    </div>`;
}
