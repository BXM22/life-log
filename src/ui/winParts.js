// Shared parts for the Today windows (Log, Learn, Notes), F68. Lead-owned: window agents import, never edit.
//   winHeader({ title, summary, chips? })  back button + title row, one-line summary, optional soft chips
//   winSection({ title, status?, body, cls? })  cream panel with heading and optional right-hand status text
//   chipRow(items, { label? })  items: [{ label, selected?, action, data?: {k: v}, disabled? }] -> 44px pills
import { esc } from './format.js';

const BACK = '<button class="back-link win-back" data-action="closeTodayWin" aria-label="Back to Today"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>';

export function winHeader({ title, summary = '', chips = [] }) {
  const soft = chips.length ? `<div class="win-chips">${chips.map((c) => `<span class="win-softchip">${esc(c)}</span>`).join('')}</div>` : '';
  return `<header class="win-head"><div class="win-headrow">${BACK}<h1 class="win-title">${esc(title)}</h1></div>${summary ? `<p class="win-summary">${esc(summary)}</p>` : ''}${soft}</header>`;
}

export function winSection({ title, status = '', body = '', cls = '' }) {
  return `<section class="win-section ${esc(cls)}"><div class="win-sechead"><h2>${esc(title)}</h2>${status ? `<span class="win-status">${esc(status)}</span>` : ''}</div>${body}</section>`;
}

export function chipRow(items, { label = '' } = {}) {
  const data = (d = {}) => Object.entries(d).map(([k, v]) => ` data-${esc(k)}="${esc(v)}"`).join('');
  const chips = items.map((c) => `<button class="win-chip${c.selected ? ' on' : ''}" data-action="${esc(c.action)}"${data(c.data)} aria-pressed="${c.selected ? 'true' : 'false'}"${c.disabled ? ' disabled' : ''}>${esc(c.label)}</button>`).join('');
  return `<div class="win-chiprow"${label ? ` role="group" aria-label="${esc(label)}"` : ''}>${chips}</div>`;
}
