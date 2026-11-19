// Quick add sheet (F36) and collapsible sections (F43) for the TODAY tab.
//   html:    quickAddButton(), quickAddSheet(state), collapsible(state, key, title, summary, bodyHtml)
//   actions: openQuick, closeQuick, quickKind, saveQuick, quickArea, quickMin, quickType, quickMore, toggleSection (see todayActions.js)

import { QUICK_KINDS, QUICK_FIELDS, QUICK_MINUTES, SESSION_TYPES, quickAreas } from '../logic/quickAdd.js';
import { esc } from './format.js';

export const quickAddButton = () =>
  '<button class="qa-fab" data-action="openQuick" aria-label="Quick add" aria-haspopup="dialog">+</button>';

function fieldHtml(f, value) {
  const id = `qa-${f.key}`;
  const control = f.type === 'textarea'
    ? `<textarea id="${id}" class="field" rows="4" maxlength="5000" placeholder="${esc(f.placeholder)}">${esc(value)}</textarea>`
    : `<input id="${id}" class="field" type="${f.type}" ${f.type === 'number' ? 'inputmode="decimal" step="any"' : 'maxlength="60" autocomplete="off"'} placeholder="${esc(f.placeholder)}" value="${esc(value)}">`;
  return `<label class="lbl" for="${id}">${esc(f.label)}</label>${control}`;
}

const TYPE_TEXT = { practice: 'Practice', study: 'Study', project: 'Project', review: 'Review' };

function sessionHtml(state, draft, q) {
  const areas = quickAreas(state.areas, state.entries);
  const area = areas.find((a) => a.name === draft.area) || areas[0];
  const type = SESSION_TYPES.includes(draft.type) ? draft.type : 'practice';
  const options = areas.map((a) => `<option value="${esc(a.name)}"${a.name === area.name ? ' selected' : ''}>${esc(a.name)}</option>`).join('');
  const minChips = QUICK_MINUTES.map((m) => `<button class="qa-chip" data-action="quickMin" data-min="${m}" aria-pressed="${String(draft.minutes) === String(m)}">${m}</button>`).join('');
  const typeChips = SESSION_TYPES.map((t) => `<button class="qa-chip${t === type ? ' on' : ''}" data-action="quickType" data-type="${t}" aria-pressed="${t === type}">${TYPE_TEXT[t]}</button>`).join('');
  const label = area.metricLabel || '';
  const more = QUICK_FIELDS.session.filter((f) => f.more && (f.key !== 'metric' || label))
    .map((f) => fieldHtml(f.key === 'metric' ? { ...f, label: `${label} (optional)`, placeholder: label } : f, draft[f.key] ?? '')).join('');
  const open = !!q.more;
  const bar = `<button class="rowbtn qa-fold" data-action="quickMore" aria-expanded="${open}" aria-controls="qa-more"><span>More details</span><span class="chev" aria-hidden="true">${open ? 'v' : '&gt;'}</span></button>`;
  return `<label class="lbl" for="qa-area">Area</label>
      <select id="qa-area" class="field" data-action="quickArea">${options}</select>
      <label class="lbl" for="qa-minutes">Minutes</label>
      <input id="qa-minutes" class="field" type="number" inputmode="numeric" step="1" placeholder="30" value="${esc(draft.minutes ?? '')}">
      <div class="qa-chips">${minChips}</div>
      <input id="qa-type" type="hidden" value="${type}"><input id="qa-metricLabel" type="hidden" value="${esc(label)}">
      ${bar}${open ? `<div id="qa-more"><div class="qa-chips" role="group" aria-label="Type">${typeChips}</div>${more}</div>` : ''}`;
}

export function quickAddSheet(state) {
  const q = state.quick;
  if (!q) return '';
  const draft = q.draft || {};
  const chips = QUICK_KINDS.map(([k, text]) =>
    `<button class="qa-chip" data-action="quickKind" data-kind="${k}" ${k === q.kind ? 'aria-pressed="true"' : 'aria-pressed="false"'}>${text}</button>`).join('');
  const fields = q.kind === 'session' ? sessionHtml(state, draft, q)
    : QUICK_FIELDS[q.kind].map((f) => fieldHtml(f, draft[f.key] ?? '')).join('');
  return `<div class="qa-scrim" data-action="closeQuick"></div>
    <div class="qa-sheet" role="dialog" aria-modal="true" aria-label="Quick add">
      <div class="qa-head"><h2>QUICK ADD</h2><button class="btn secondary qa-close" data-action="closeQuick" aria-label="Close">X</button></div>
      <div class="qa-chips">${chips}</div>
      ${fields}
      <button class="btn" data-action="saveQuick">SAVE</button>
    </div>`;
}

/** A panel that folds away. Collapsed by default; state.sections[key] === true means open. */
export function collapsible(state, key, title, summary, bodyHtml) {
  const open = !!(state.sections || {})[key];
  const bar = `<button class="rowbtn qa-fold" data-action="toggleSection" data-section="${key}" aria-expanded="${open}">
    <span>${esc(title)}${summary ? ` <small>${esc(summary)}</small>` : ''}</span><span class="chev" aria-hidden="true">${open ? 'v' : '&gt;'}</span></button>`;
  return open ? `${bar}${bodyHtml}` : bar;
}
