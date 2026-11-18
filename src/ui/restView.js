// Rest timer for the WORKOUT tab, laid out like the Forma "Rest timer" screen.
//   restRow(state):  the peach "Rest timer, Open" row on Workout
//   restPage(state): the full rest timer page (back, progress ring, presets, custom wheel, auto-start, stop/start)
//   after render:    positionWheels(state) puts each wheel on the saved value
//   actions:         restOpen | restClose | restPreset (data-s) | restStart | restStop | restAuto, see restActions.js

import { PRESETS, WHEEL_MINUTES, WHEEL_SECONDS, fmt, remaining, toWheel } from '../logic/rest.js';

export const ITEM = 40; // px height of one wheel row; keep in sync with .wheel i in main.css
export const RING = 615.8; // circumference of the progress ring (r = 98)

const wheel = (id, values, text, label) =>
  `<div class="wheel" id="${id}" role="listbox" tabindex="0" aria-label="${label}"><b></b>${values.map((v) => `<i role="option">${text(v)}</i>`).join('')}<b></b></div>`;

const timeLeft = (r) => (r.endAt != null ? remaining(r.endAt, Date.now()) : r.seconds);

/** Ring offset: the arc grows with the time used, so it is empty before the timer starts. */
export const ringOffset = (r) => {
  if (r.endAt == null || !r.total) return RING;
  return Math.round(RING * Math.min(1, Math.max(0, remaining(r.endAt, Date.now()) / r.total)) * 10) / 10;
};

export function restRow(state) {
  return `<button class="rest-row" data-action="restOpen" aria-label="Open the rest timer">
    <span class="rest-row-text"><span class="rest-row-label">REST TIMER</span><span class="rest-row-time" id="rest-row-time">${fmt(timeLeft(state.rest))}</span></span>
    <span class="rest-row-open">Open</span>
  </button>`;
}

/** Fixed peach rest bar for Today and Exercise (workout v2). The time keeps id rest-row-time so the timer painter updates it. */
export function restBar(state) {
  return `<button class="w2-restbar" data-action="restOpen" aria-label="Open the rest timer">
    <span class="w2-restbar-text"><span class="w2-restbar-label">REST TIMER</span><span class="w2-restbar-time" id="rest-row-time">${fmt(timeLeft(state.rest))}</span></span>
    <span class="w2-restbar-open">Open</span>
  </button>`;
}

export function restPage(state) {
  const r = state.rest;
  const running = r.endAt != null;
  const left = timeLeft(r);
  const chips = PRESETS.map((s) => `<button class="rest-chip" data-action="restPreset" data-s="${s}" ${(running ? r.total : r.seconds) === s ? 'aria-pressed="true"' : ''}>${fmt(s)}</button>`).join('');
  return `<section class="restpage" id="rest">
    <div class="rest-head">
      <button class="rest-back" data-action="restClose" aria-label="Back to workout"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>
      <h1>Rest timer</h1>
      <span class="rest-spacer"></span>
    </div>
    <div class="rest-ring">
      <svg width="220" height="220" viewBox="0 0 220 220" role="img" aria-label="${fmt(left)} left">
        <circle cx="110" cy="110" r="98" fill="none" stroke="#FFFFFF" stroke-width="14"/>
        <circle id="rest-ring" cx="110" cy="110" r="98" fill="none" stroke="#F4A28C" stroke-width="14" stroke-linecap="round" stroke-dasharray="${RING}" stroke-dashoffset="${ringOffset(r)}" transform="rotate(-90 110 110)"/>
      </svg>
      <div class="rest-ring-text"><span class="rest-time" id="rest-time" aria-live="off">${fmt(left)}</span><span class="rest-sub" id="rest-sub">${running && r.total ? `of ${fmt(r.total)}` : 'ready'}</span></div>
    </div>
    <div class="rest-chips">${chips}</div>
    <p class="rest-label">CUSTOM TIME</p>
    <div class="wheels">
      ${wheel('wh-min', WHEEL_MINUTES, (v) => v, 'Minutes')}<span class="colon" aria-hidden="true">:</span>${wheel('wh-sec', WHEEL_SECONDS, (v) => String(v).padStart(2, '0'), 'Seconds')}
    </div>
    <label class="check rest-auto"><input type="checkbox" data-action="restAuto" ${r.auto ? 'checked' : ''}><span>Start by itself after each working set</span></label>
    ${running
    ? '<button class="rest-go stop" data-action="restStop">Stop rest</button>'
    : '<button class="rest-go" data-action="restStart">Start rest</button>'}
  </section>`;
}

/** Scroll each wheel to the saved length. Call after every render. */
export function positionWheels(state) {
  const { minIndex, secIndex } = toWheel(state.rest.seconds);
  const m = document.getElementById('wh-min');
  const s = document.getElementById('wh-sec');
  if (m) m.scrollTop = minIndex * ITEM;
  if (s) s.scrollTop = secIndex * ITEM;
}
