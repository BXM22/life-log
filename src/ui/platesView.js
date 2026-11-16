// WORKOUT tab, F38: plate calculator under an exercise panel.
//   html:    platesPanel(state, i), platesButton(i)
//   actions: platesOpen (data-i) | platesClose | platesCalc | platesPlate (data-plate), see platesActions.js

import { PLATE_CHOICES, platesFor } from '../logic/plates.js';
import { esc } from './format.js';

export const platesButton = (i) => `<button class="btn secondary" data-action="platesOpen" data-i="${i}" aria-label="Plate calculator">PLATES</button>`;

const fmt = (n) => String(n);

/** Plate calculator panel for exercise i, or '' when it is not open for that exercise. */
export function platesPanel(state, i) {
  const p = state.plates;
  if (!p || p.i !== i) return '';
  const cfg = state.platesCfg;
  const r = platesFor(p.weight, cfg);
  let result;
  if (r.error) result = `<p>${esc(r.error)}</p>`;
  else {
    const list = r.perSide.length ? r.perSide.map((x) => `<span class="tag done">${x.count} x ${fmt(x.plate)}</span>`).join(' ') : '<span class="tag">BAR ONLY</span>';
    result = `<p><b>${fmt(cfg.bar)} lb bar, each side:</b></p><div class="tags">${list}</div>
      <p>${r.short ? `Closest you can load is ${fmt(r.loaded)} lb (${fmt(r.short)} lb short of ${esc(p.weight)}).` : `Total ${fmt(r.loaded)} lb.`}</p>`;
  }
  const owned = PLATE_CHOICES.map((c) => `<button class="btn chip ${cfg.owned.includes(c) ? '' : 'secondary'}" data-action="platesPlate" data-plate="${c}" aria-pressed="${cfg.owned.includes(c)}">${fmt(c)}</button>`).join('');
  return `<div class="plates"><h2>PLATES</h2>
    <div class="inline"><input id="pc-weight-${i}" class="field" type="number" inputmode="decimal" step="0.5" value="${esc(p.weight)}" placeholder="Working weight (lb)" aria-label="Working weight in lb">
      <button class="btn" data-action="platesCalc" data-i="${i}">CALC</button></div>
    ${result}
    <div class="platecfg"><label class="lbl">BAR AND PLATES I OWN</label>
      <label class="lbl" for="pc-bar-${i}">BAR WEIGHT (LB)</label>
      <input id="pc-bar-${i}" class="field" type="number" inputmode="decimal" step="0.5" value="${fmt(cfg.bar)}" aria-label="Bar weight in lb">
      <button class="btn secondary" data-action="platesCalc" data-i="${i}">SAVE BAR</button>
      <label class="lbl">PLATES (LB, TAP TO TOGGLE)</label>
      <div class="chiprow">${owned}</div>
    </div>
    <button class="btn secondary" data-action="platesClose">CLOSE</button>
  </div>`;
}
