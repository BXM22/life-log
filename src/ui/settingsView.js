// SETTINGS tab, laid out like the Forma settings screen: one grouped card per section, label left, value right.
// Settings live on this device (see logic/settings.js).
//   html:    settingsView(state)
//   actions: data-action="setKeep" | "setPlanDays" | "setDayStart" | "setExportReminder" | "install" | "disconnect" (handled in app.js)

import { KEEP_OPTIONS, DAY_START_OPTIONS, PLAN_DAYS_OPTIONS } from '../logic/settings.js';
import { reminderNotifySupported } from '../logic/exportReminder.js';
import { installMessage } from '../logic/install.js';
import { getConfig, isConnected } from '../dropbox/dropbox.js';
import { esc } from './format.js';

const options = (list, current, fmt = String) =>
  list.map((v) => `<option value="${v}" ${v === current ? 'selected' : ''}>${esc(fmt(v))}</option>`).join('');

export function settingsView(state) {
  const hour = (h) => (h === 0 ? 'midnight' : `${h}:00 AM`);
  const msg = installMessage(state.installKind);
  const plan = state.planDays === 3 ? 'Tue Upper A, Thu Lower, Sat Upper B.' : 'Tue Upper A, Thu Lower, Sat Upper B, Sun Upper C.';
  return `<h2 class="setlabel">TRAINING AND DAYS</h2>
    <div class="setgroup">
      <label class="setrow"><span>Keep last days after a wipe</span><select data-action="setKeep" aria-label="Keep days after a wipe">${options(KEEP_OPTIONS, state.keepDays)}</select></label>
      <label class="setrow"><span>Lifting days per week</span><select data-action="setPlanDays" aria-label="Lifting days per week">${options(PLAN_DAYS_OPTIONS, state.planDays)}</select></label>
      <label class="setrow"><span>New day starts at</span><select data-action="setDayStart" aria-label="Day start hour">${options(DAY_START_OPTIONS, state.dayStartHour, hour)}</select></label>
    </div>
    <p class="setnote">${plan} Logs made before the start hour count toward the previous day.</p>
    <h2 class="setlabel">EXPORT</h2>
    <div class="setgroup">
      <label class="check setrow"><span>Remind me to export weekly</span><input type="checkbox" role="switch" data-action="setExportReminder" ${state.exportReminder === false ? '' : 'checked'}></label>
    </div>
    <p class="setnote">Shows a banner on Today when your last export is 7 or more days old${reminderNotifySupported() ? ', and a notification if you allow them' : ''}.</p>
    <h2 class="setlabel">STORAGE AND DROPBOX</h2>
    <div class="setgroup">
      <div class="setrow"><span>Dropbox</span><b>${isConnected() ? 'Connected' : 'Not connected'}</b></div>
    </div>
    <p class="setnote">${esc(state.storageLine)}${msg ? ` ${esc(msg)}` : ''}</p>
    ${isConnected() ? `<p class="setnote">Exports go to ${esc(getConfig().folder)}/</p><button class="btn secondary" data-action="disconnect">DISCONNECT DROPBOX</button>` : '<p class="setnote">Connect from the EXPORT tab.</p>'}
    ${state.installKind === 'prompt' ? '<button class="btn" data-action="install">ADD TO HOME SCREEN</button>' : ''}`;
}
