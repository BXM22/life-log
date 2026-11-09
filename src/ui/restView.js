// Rest timer panel for the WORKOUT tab: countdown, presets, an iOS-style wheel for a custom time, auto-start toggle.
//   html:    restPanel(state)
//   after render: positionWheels(state) puts each wheel on the saved value
//   actions: restPreset (data-s) | restStart | restStop | restAuto, see restActions.js

import { PRESETS, WHEEL_MINUTES, WHEEL_SECONDS, fmt, remaining, toWheel } from '../logic/rest.js';

export const ITEM = 40; // px height of one wheel row; keep in sync with .wheel i in main.css

const wheel = (id, values, text, label) =>
  `<div class="wheel" id="${id}" role="listbox" tabindex="0" aria-label="${label}"><b></b>${values.map((v) => `<i role="option">${text(v)}</i>`).join('')}<b></b></div>`;

export function restPanel(state) {
  const r = state.rest;
  const running = r.endAt != null;
  const left = running ? remaining(r.endAt, Date.now()) : r.seconds;
  const pct = running && r.total ? Math.round((1 - left / r.total) * 100) : 0;
  const chips = PRESETS.map((s) => `<button class="btn secondary chip" data-action="restPreset" data-s="${s}">${fmt(s)}</button>`).join('');
  return `<div class="panel" id="rest">
    <h2>REST TIMER</h2>
    <div class="big" id="rest-time" aria-live="off">${fmt(left)}</div>
    <div class="bar" aria-hidden="true"><i id="rest-bar" style="width:${pct}%"></i></div>
    <div class="chips">${chips}</div>
    <p class="lbl">CUSTOM TIME</p>
    <div class="wheels">
      ${wheel('wh-min', WHEEL_MINUTES, (v) => v, 'Minutes')}<span class="colon" aria-hidden="true">:</span>${wheel('wh-sec', WHEEL_SECONDS, (v) => String(v).padStart(2, '0'), 'Seconds')}
    </div>
    ${running
    ? '<button class="btn secondary" data-action="restStop">STOP REST</button>'
    : '<button class="btn" data-action="restStart">START REST</button>'}
    <label class="check"><input type="checkbox" data-action="restAuto" ${r.auto ? 'checked' : ''}><span>Start by itself after each working set</span></label>
  </div>`;
}

/** Scroll each wheel to the saved length. Call after every render. */
export function positionWheels(state) {
  const { minIndex, secIndex } = toWheel(state.rest.seconds);
  const m = document.getElementById('wh-min');
  const s = document.getElementById('wh-sec');
  if (m) m.scrollTop = minIndex * ITEM;
  if (s) s.scrollTop = secIndex * ITEM;
}
