// WORKOUT tab, F42 + v2: templates page (list, tag filter, one active template) and the template edit page.
//   html:    templatesWindow(state), editScreen(state)
//   actions: tplOpenWin | tplCloseWin | tplFilter | tplActive | tplOpen | tplBack | tplToggleTag | tplAddTag |
//            tplNewBlank | tplNewCopy | tplSave | tplSetActive | tplDelete | tplPick | tplSetActiveHome | tplAcc,
//            see templateTagsActions.js. Styles: src/styles/workout-pages.css (.w2-*).

import { getSessions } from '../logic/template.js';
import { allTags, filterByTag, tagsOf, usedTags } from '../logic/templateTags.js';
import { activeSessionId } from '../logic/workout.js';
import { logicalDate } from '../logic/dates.js';
import { esc } from './format.js';
import { exerciseForm, EQUIP_TEXT } from './templateView.js';

const backButton = (action, label) =>
  `<button class="back-link" data-action="${action}" aria-label="${label}"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>`;
const TRASH = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg>';
const CHEV = '<svg class="w2-chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';

const chip = (on, attrs, text) => `<button class="btn chip ${on ? '' : 'secondary'}" ${attrs} aria-pressed="${on}">${esc(text)}</button>`;

const currentId = (state) => activeSessionId(null, logicalDate(Date.now(), state.dayStartHour), state.planDays);

// One accordion section: the header button (tplAcc) is always shown, the body only when open.
// `summary` is trusted HTML (already escaped by the caller).
function acc(state, k, title, summary, body) {
  const open = !!state.tAcc?.[k];
  return `<section class="w2-acc ${open ? 'open' : ''}">
    <button class="w2-acc-head" data-action="tplAcc" data-k="${k}" aria-expanded="${open}">
      <span class="w2-acc-title">${esc(title)}</span>${summary && !open ? `<span class="w2-acc-sum">${summary}</span>` : ''}${CHEV}
    </button>${open ? `<div class="w2-acc-body">${body}</div>` : ''}
  </section>`;
}

/** The templates page: header, collapsed New template accordion, tag chips, cards. */
export function templatesWindow(state) {
  const all = getSessions();
  const cur = currentId(state);
  const tag = usedTags(all).includes(state.tFilter) ? state.tFilter : '';
  const filters = [chip(!tag, 'data-action="tplFilter" data-tag=""', 'ALL'), ...usedTags(all).map((t) => chip(t === tag, `data-action="tplFilter" data-tag="${esc(t)}"`, t))].join('');
  const rows = filterByTag(all, tag).map((s) => {
    const on = s.id === cur;
    return `<div class="w2-card ${on ? 'on' : ''}">
      <div class="w2-card-top"><span class="w2-card-name">${esc(s.name)}</span>
        <button class="editlink" data-action="tplOpen" data-id="${esc(s.id)}" aria-label="Edit ${esc(s.name)}">Edit</button></div>
      <small>${s.exercises.length} exercise${s.exercises.length === 1 ? '' : 's'}</small>
      <div class="tags">${tagsOf(s).map((t) => `<span class="tag">${esc(t)}</span>`).join('') || '<small>No tags</small>'}</div>
      ${on ? '<div class="w2-badge">Active template</div>' : `<button class="btn secondary w2-setactive" data-action="tplSetActiveHome" data-id="${esc(s.id)}" aria-label="Set ${esc(s.name)} active">Set active</button>`}
    </div>`;
  }).join('');
  const newBody = `<label class="lbl" for="tn-name">NAME</label>
      <input id="tn-name" class="field" maxlength="40" placeholder="Push day" autocomplete="off">
      <div class="pair">
        <button class="btn" data-action="tplNewBlank">START BLANK</button>
        <button class="btn secondary" data-action="tplNewCopy">COPY ACTIVE</button>
      </div>`;
  return `<div class="w2-page">
    <div class="backrow">${backButton('tplCloseWin', 'Back to workout')}<small>Active: ${esc(all.find((s) => s.id === cur)?.name ?? '')}</small></div>
    <h2 class="subtitle">Workout templates</h2>
    ${acc(state, 'new', '+ New template', '', newBody)}
    <div class="chiprow tplfilter w2-chips" role="group" aria-label="Filter by tag">${filters}</div>
    <div class="w2-cards">${rows || '<p>No templates with that tag.</p>'}</div>
  </div>`;
}

/** The edit page for one template: three accordions and a pinned Back / Save footer. */
export function editScreen(state) {
  const s = getSessions().find((x) => x.id === state.tScreen);
  if (!s) return '';
  const d = state.tplDraft ?? { name: s.name, tags: tagsOf(s) };
  const isActive = s.id === currentId(state);
  const tagChips = [...new Set([...allTags(getSessions()), ...d.tags])].map((t) => chip(d.tags.includes(t), `data-action="tplToggleTag" data-tag="${esc(t)}"`, t)).join('');
  const rows = s.exercises.map((ex, i) => `<div class="w2-exrow"><div class="w2-exinfo"><span class="exname">${esc(ex.name)}</span>
      <small>${esc([ex.target, EQUIP_TEXT[ex.equipment]].filter(Boolean).join(' · '))}</small></div>
      <button class="editlink" data-action="tEditStart" data-i="${i}" aria-label="Edit ${esc(ex.name)}">Edit</button>
      <button class="trash" data-action="tDelete" data-i="${i}" aria-label="Remove ${esc(ex.name)}">${TRASH}</button></div>`).join('');
  const nameBody = `<label class="lbl" for="tp-name">NAME</label>
      <input id="tp-name" class="field" maxlength="40" value="${esc(d.name)}" autocomplete="off">
      <label class="lbl">TAGS</label>
      <div class="chiprow" role="group" aria-label="Tags">${tagChips}</div>
      <div class="inline"><input id="tp-tag" class="field" maxlength="20" placeholder="Custom tag" aria-label="Custom tag" autocomplete="off">
        <button class="btn secondary" data-action="tplAddTag">ADD TAG</button></div>`;
  const nameSum = `${esc(d.name)}${d.tags.length ? ` <span class="w2-tagline">${d.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</span>` : ''}`;
  const exBody = `${state.tEdit ? exerciseForm(state, s) : ''}
      ${rows || '<p>No exercises. Add one below.</p>'}
      <button class="btn w2-add" data-action="tAdd">+ Add exercise</button>`;
  const moreBody = `<button class="btn secondary" data-action="tplSetActive" ${isActive ? 'disabled' : ''}>${isActive ? 'Already the active template' : 'Set as active'}</button>
      <button class="btn secondary" data-action="tReset">Reset all to the built-in plan</button>
      <button class="btn secondary w2-danger" data-action="tplDelete">Delete template</button>`;
  return `<div class="w2-page w2-edit">
    <div class="backrow">${backButton('tplBack', 'Back to templates')}</div>
    <h2 class="subtitle">Edit template</h2>
    ${acc(state, 'name', 'Name and tags', nameSum, nameBody)}
    ${acc(state, 'ex', `Exercises · ${s.exercises.length}`, '', exBody)}
    ${acc(state, 'more', 'More actions', '', moreBody)}
  </div>
  <div class="w2-footer"><button class="btn secondary" data-action="tplBack">Back</button><button class="btn" data-action="tplSave">Save</button></div>`;
}
