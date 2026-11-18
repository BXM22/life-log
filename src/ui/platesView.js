// WORKOUT tab, F38 / F56: plate calculator accordion on the Exercise page.
//   html:    platesPanel(state, i)
//   actions: platesOpen (data-i) | platesClose | platesCalc (data-i) | platesUse (data-i, data-w) | platesSetup (data-i)
//            | platesOwn (data-i, data-plate, data-delta), see platesActions.js
//   state:   plates { i, weight, setup } while open for exercise i; platesCfg { bar, owned: { plate: pairs } }

import { PLATE_CHOICES, platesFor } from '../logic/plates.js';
import { esc } from './format.js';

const plateH = (p) => Math.round(18 + p * 0.85); // taller for heavier plates, 20 to 65 px
const plateW = (p) => (p >= 25 ? 14 : p >= 5 ? 10 : 7);

/** One side of the bar: the sleeve, then plates from the collar outward (heaviest first). */
function barbell(perSide) {
  const plates = perSide.flatMap((x) => Array.from({ length: x.count }, () => x.plate));
  const bits = plates.map((p) => `<i class="pl-plate" style="height:${plateH(p)}px;width:${plateW(p)}px" title="${p} lb"><b>${p}</b></i>`).join('');
  return `<div class="pl-rack" role="img" aria-label="${plates.length ? `Each side, from the collar out: ${plates.join(', ')} lb` : 'Bar only'}"><span class="pl-bar"></span>${bits}<span class="pl-tip"></span></div>`;
}

const pairsText = (n) => (n === 1 ? '1 pair' : `${n} pairs`);

function result(p, cfg, i) {
  const r = platesFor(p.weight, cfg);
  if (r.error) return `<p>${esc(r.error)}</p>`;
  const tags = r.perSide.length ? r.perSide.map((x) => `<span class="tag done">${x.count} x ${x.plate}</span>`).join(' ') : '<span class="tag">BAR ONLY</span>';
  const use = (w) => `<button class="btn secondary" data-action="platesUse" data-i="${i}" data-w="${w}">USE ${w} LB</button>`;
  const near = r.short
    ? `<p>You can't load exactly ${esc(p.weight)} lb with the plates you own. Closest:</p><div class="pair">${use(r.loaded)}${r.up ? use(r.up.total) : ''}</div>`
    : `<p><b>${r.loaded} lb</b> total (${cfg.bar} lb bar).</p>`;
  return `<p class="lbl">EACH SIDE, FROM THE COLLAR OUT</p>${barbell(r.perSide)}<div class="tags">${tags}</div>${near}`;
}

function setup(cfg, i) {
  const rows = PLATE_CHOICES.map((c) => {
    const n = cfg.owned[c] ?? 0;
    return `<div class="pl-own"><span><b>${c} lb</b><small>${n ? pairsText(n) : 'none'}</small></span>
      <span class="pl-steps"><button class="btn secondary pl-step" data-action="platesOwn" data-i="${i}" data-plate="${c}" data-delta="-1" aria-label="One fewer ${c} lb pair" ${n ? '' : 'disabled'}>&minus;</button>
      <button class="btn secondary pl-step" data-action="platesOwn" data-i="${i}" data-plate="${c}" data-delta="1" aria-label="One more ${c} lb pair">+</button></span></div>`;
  }).join('');
  return `<div class="platecfg"><label class="lbl" for="pc-bar-${i}">BAR WEIGHT (LB)</label>
    <div class="inline"><input id="pc-bar-${i}" class="field" type="number" inputmode="decimal" step="0.5" value="${esc(cfg.bar)}" aria-label="Bar weight in lb">
      <button class="btn secondary" data-action="platesCalc" data-i="${i}">SAVE BAR</button></div>
    <p class="lbl">PLATES I OWN (PAIRS: ONE ON EACH SIDE)</p>${rows}</div>`;
}

/** Plate calculator panel for exercise i, or '' when it is not open for that exercise. */
export function platesPanel(state, i) {
  const p = state.plates;
  if (!p || p.i !== i) return '';
  const cfg = state.platesCfg;
  return `<div class="plates">
    <div class="inline"><input id="pc-weight-${i}" class="field" type="number" inputmode="decimal" step="0.5" value="${esc(p.weight)}" placeholder="Working weight (lb)" aria-label="Working weight in lb">
      <button class="btn" data-action="platesCalc" data-i="${i}">CALC</button></div>
    ${result(p, cfg, i)}
    <button class="w2-accbtn pl-fold" data-action="platesSetup" data-i="${i}" aria-expanded="${Boolean(p.setup)}"><span>My plates</span><small>${esc(cfg.bar)} lb bar</small></button>
    ${p.setup ? setup(cfg, i) : ''}
  </div>`;
}
