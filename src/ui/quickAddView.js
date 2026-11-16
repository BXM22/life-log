// Quick add sheet (F36) and collapsible sections (F43) for the TODAY tab.
//   html:    quickAddButton(), quickAddSheet(state), collapsible(state, key, title, summary, bodyHtml)
//   actions: openQuick, closeQuick, quickKind, saveQuick, toggleSection (see todayActions.js)

import { QUICK_KINDS, QUICK_FIELDS } from '../logic/quickAdd.js';
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

export function quickAddSheet(state) {
  const q = state.quick;
  if (!q) return '';
  const chips = QUICK_KINDS.map(([k, text]) =>
    `<button class="qa-chip" data-action="quickKind" data-kind="${k}" ${k === q.kind ? 'aria-pressed="true"' : 'aria-pressed="false"'}>${text}</button>`).join('');
  const fields = QUICK_FIELDS[q.kind].map((f) => fieldHtml(f, (q.draft || {})[f.key] ?? '')).join('');
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
