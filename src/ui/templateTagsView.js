// WORKOUT tab, F42 + v2: templates page (list, tag filter, one active template) and the template edit page.
//   html:    templatesWindow(state), editScreen(state)
//   actions: tplOpenWin | tplCloseWin | tplFilter | tplActive | tplOpen | tplBack | tplToggleTag | tplAddTag |
//            tplNewBlank | tplNewCopy | tplSave | tplSetActive | tplDelete | tplPick | tplSetActiveHome | tplAcc | tplMore | tMove,
//            see templateTagsActions.js. Styles: src/styles/w3-templates.css (.w2-t*), plus shared .w2- rules in workout-pages.css.

import { getSessions } from '../logic/template.js';
import { allTags, filterByTag, tagsOf, usedTags } from '../logic/templateTags.js';
import { activeSessionId } from '../logic/workout.js';
import { logicalDate } from '../logic/dates.js';
import { esc } from './format.js';
import { exerciseForm, EQUIP_TEXT } from './templateView.js';

export const backButton = (action, label) =>
  `<button class="back-link" data-action="${action}" aria-label="${label}"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>`;
const TRASH = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg>';

const chip = (on, attrs, text) => `<button class="btn chip ${on ? '' : 'secondary'}" ${attrs} aria-pressed="${on}">${esc(text)}</button>`;

const currentId = (state) => activeSessionId(null, logicalDate(Date.now(), state.dayStartHour), state.planDays);

const GRIP = '<svg class="w2-grip" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>';
const ARROW = (up) => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${up ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'}"/></svg>`;
const count = (s) => `${s.exercises.length} exercise${s.exercises.length === 1 ? '' : 's'}`;

const TONES = ['a', 'b', 'c'];
const BELL = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9v6M6.5 6.5v11M17.5 6.5v11M21 9v6M6.5 12h11"/></svg>';
const CHECK = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const RING = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M8.5 12.5l2.4 2.4 4.6-5"/></svg>';
const shortName = (n) => String(n).replace(/\s*\(.*?\)/g, '').trim();
const preview = (s) => {
  const names = s.exercises.map((e) => shortName(e.name)).filter(Boolean);
  if (!names.length) return 'No exercises yet';
  return names.slice(0, 3).join(' · ') + (names.length > 3 ? ` +${names.length - 3}` : '');
};

function templateRow(s, on, i = 0, tone = 'a') {
  return `<div class="w2-trow${on ? ' on' : ''}" data-tone="${tone}" style="--i:${i}">
    <span class="w2-ticon" aria-hidden="true">${BELL}</span>
    <button class="w2-trow-main" data-action="tplOpen" data-id="${esc(s.id)}" aria-label="Edit ${esc(s.name)}">
      <b>${esc(s.name)}</b>
      <span class="w2-tmeta"><span class="w2-tpill">${count(s)}</span></span>
      ${s.focus ? `<small class="w2-tfocus">${esc(s.focus)}</small>` : ''}
      <small class="w2-tprev">${esc(preview(s))}</small>
    </button>
    ${on ? `<span class="w2-badge w2-tactive">${CHECK}Active</span>` : `<button class="btn secondary w2-setactive" data-action="tplSetActiveHome" data-id="${esc(s.id)}" aria-label="Set ${esc(s.name)} active" title="Set active">${RING}</button>`}
  </div>`;
}

/** The templates page: active template pinned on top, the rest grouped by tag, New blank and Copy of the active one. */
export function templatesWindow(state) {
  const all = getSessions();
  const cur = currentId(state);
  const active = all.find((s) => s.id === cur);
  const groups = new Map();
  for (const s of all) {
    if (s.id === cur) continue;
    const g = tagsOf(s)[0] || 'Other';
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(s);
  }
  const order = [...groups.keys()].sort((a, b) => (a === 'Other') - (b === 'Other') || a.localeCompare(b));
  const grouped = order.map((g) => `<h3 class="w2-tgroup" data-tone="${TONES[order.indexOf(g) % 3]}"><i aria-hidden="true"></i>${esc(g)}<span>${groups.get(g).length}</span></h3>${groups.get(g).map((s, i) => templateRow(s, false, i, TONES[order.indexOf(g) % 3])).join('')}`).join('');
  return `<div class="w2-page w2-tpage">
    <div class="backrow">${backButton('tplCloseWin', 'Back to workout')}</div>
    <h2 class="subtitle">Templates</h2>
    ${active ? `<h3 class="w2-tgroup">Active template</h3>${templateRow(active, true, 0, 'a')}` : ''}
    ${grouped || ''}
    <div class="w2-tnew">
      <label class="lbl" for="tn-name">New template</label>
      <input id="tn-name" class="field" maxlength="40" placeholder="Push day" autocomplete="off">
      <div class="pair">
        <button class="w2-dashed" data-action="tplNewBlank">New blank</button>
        <button class="btn secondary" data-action="tplNewCopy">Copy of active</button>
      </div>
    </div>
  </div>`;
}

/** The edit page for one template: name, tags, exercises with drag handles, More actions menu, pinned Cancel and Save changes. */
export function editScreen(state) {
  const s = getSessions().find((x) => x.id === state.tScreen);
  if (!s) return '';
  const d = state.tplDraft ?? { name: s.name, tags: tagsOf(s) };
  const isActive = s.id === currentId(state);
  const last = s.exercises.length - 1;
  const tagChips = [...new Set([...allTags(getSessions()), ...d.tags])].map((t) => chip(d.tags.includes(t), `data-action="tplToggleTag" data-tag="${esc(t)}"`, t)).join('');
  const rows = s.exercises.map((ex, i) => `<div class="w2-exrow w2-trowex"><span class="w2-handle" aria-hidden="true">${GRIP}</span><div class="w2-exinfo"><span class="exname">${esc(ex.name)}</span>
      <small>${esc([ex.target, EQUIP_TEXT[ex.equipment]].filter(Boolean).join(', '))}</small></div>
      <button class="w2-mv" data-action="tMove" data-i="${i}" data-delta="-1" aria-label="Move ${esc(ex.name)} up" ${i === 0 ? 'disabled' : ''}>${ARROW(true)}</button>
      <button class="w2-mv" data-action="tMove" data-i="${i}" data-delta="1" aria-label="Move ${esc(ex.name)} down" ${i === last ? 'disabled' : ''}>${ARROW(false)}</button>
      <button class="editlink" data-action="tEditStart" data-i="${i}" aria-label="Edit ${esc(ex.name)}">Edit</button>
      <button class="trash" data-action="tDelete" data-i="${i}" aria-label="Remove ${esc(ex.name)}">${TRASH}</button></div>`).join('');
  const menu = state.tMore ? `<div class="w2-menu-scrim" data-action="tplMore"></div>
    <div class="w2-menu w2-menu-wide" role="menu" aria-label="More actions">
      <button class="w2-item" role="menuitem" data-action="tplSetActive" ${isActive ? 'disabled' : ''}><b>Set as active</b><small>${isActive ? 'Already the active template' : 'Use it as your main plan'}</small></button>
      <button class="w2-item" role="menuitem" data-action="tReset"><b>Reset all to the built-in plan</b><small>Asks to confirm first</small></button>
      <button class="w2-item danger" role="menuitem" data-action="tplDelete"><b>Delete template</b><small>Logged sets stay in your log</small></button>
    </div>` : '';
  return `<div class="w2-page w2-edit">
    <div class="backrow w2-thead">${backButton('tplBack', 'Back to templates')}
      <button class="w2-more" data-action="tplMore" aria-haspopup="menu" aria-expanded="${Boolean(state.tMore)}">More actions</button></div>
    ${menu}
    <h2 class="subtitle">Edit template</h2>
    <label class="lbl" for="tp-name">NAME</label>
    <input id="tp-name" class="field" maxlength="40" value="${esc(d.name)}" autocomplete="off">
    <label class="lbl">TAGS</label>
    <div class="chiprow" role="group" aria-label="Tags">${tagChips}</div>
    <div class="inline"><input id="tp-tag" class="field" maxlength="20" placeholder="Custom tag" aria-label="Custom tag" autocomplete="off">
      <button class="btn secondary" data-action="tplAddTag">Add tag</button></div>
    <h3 class="w2-tgroup">Exercises, ${s.exercises.length}</h3>
    ${state.tEdit ? exerciseForm(state, s) : ''}
    ${rows || '<p>No exercises. Add one below.</p>'}
    <button class="w2-dashed" data-action="tAdd">Add exercise</button>
  </div>
  <div class="w2-tbar"><button class="btn secondary" data-action="tplBack">Cancel</button><button class="btn" data-action="tplSave">Save changes</button></div>`;
}
