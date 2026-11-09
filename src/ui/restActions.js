// Actions and the ticking clock for the rest timer. app.js merges `actions` into its action table and passes in
// what it owns (state, a re-render callback), so this file has no globals except the one interval and audio context.

import { clampRest, fmt, fromWheel, remaining, saveRest } from '../logic/rest.js';
import { ITEM } from './restView.js';

export function createRestActions({ state, onChange }) {
  let timer = 0;
  let ctx = null;
  let scrollWait = 0;

  const persist = () => { try { saveRest(localStorage, state.rest); } catch { /* storage blocked */ } };

  // iOS only lets audio start from a tap, so the audio context is made on Start and reused when the timer ends.
  function unlock() {
    try { ctx ??= new (window.AudioContext || window.webkitAudioContext)(); ctx.resume?.(); } catch { /* no audio: vibrate and the message remain */ }
  }
  function beep() {
    try { navigator.vibrate?.([200, 100, 200]); } catch { /* not supported on iPhone */ }
    if (!ctx) return;
    [0, 0.35].forEach((delay) => {
      try {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.frequency.value = 880;
        g.gain.value = 0.2;
        o.connect(g);
        g.connect(ctx.destination);
        o.start(ctx.currentTime + delay);
        o.stop(ctx.currentTime + delay + 0.25);
      } catch { /* ignore */ }
    });
  }

  function paint() {
    const r = state.rest;
    const time = document.getElementById('rest-time');
    const bar = document.getElementById('rest-bar');
    if (r.endAt == null) return;
    const left = remaining(r.endAt, Date.now());
    if (time) time.textContent = fmt(left);
    if (bar) bar.style.width = `${r.total ? Math.round((1 - left / r.total) * 100) : 0}%`;
  }

  function tick() {
    const r = state.rest;
    if (r.endAt == null) { stop(); return; }
    if (remaining(r.endAt, Date.now()) > 0) { paint(); return; }
    r.endAt = null;
    r.total = null;
    persist();
    stop();
    beep();
    state.msg = 'Rest over. Next set.';
    onChange();
  }

  function begin() {
    clearInterval(timer);
    timer = setInterval(tick, 250);
  }
  function stop() { clearInterval(timer); timer = 0; }

  function start(seconds) {
    unlock();
    const r = state.rest;
    r.seconds = clampRest(seconds ?? r.seconds);
    r.total = r.seconds;
    r.endAt = Date.now() + r.seconds * 1000;
    persist();
    begin();
  }

  // The wheels scroll without a re-render; read where they stopped and remember it.
  function onScroll(ev) {
    const el = ev.target;
    if (!el || (el.id !== 'wh-min' && el.id !== 'wh-sec')) return;
    clearTimeout(scrollWait);
    scrollWait = setTimeout(() => {
      const idx = (id) => Math.round((document.getElementById(id)?.scrollTop ?? 0) / ITEM);
      state.rest.seconds = fromWheel(idx('wh-min'), idx('wh-sec'));
      persist();
      if (state.rest.endAt == null) {
        const time = document.getElementById('rest-time');
        if (time) time.textContent = fmt(state.rest.seconds);
      }
    }, 120);
  }

  return {
    actions: {
      restStart: () => { start(); },
      restStop: () => { state.rest.endAt = null; state.rest.total = null; persist(); stop(); },
      restPreset: (el) => { start(Number(el.dataset.s)); },
      restAuto: (el) => { state.rest.auto = el.checked; persist(); },
    },
    onScroll,
    // After a working set is saved: start the timer if the user left auto-start on.
    startIfAuto: () => { if (state.rest.auto) start(); },
    // At boot, and when the app returns to the foreground: pick up a timer that is still running or just ended.
    resume: () => { if (state.rest.endAt != null) { begin(); tick(); } },
  };
}
