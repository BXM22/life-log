// WORKOUT tab, F42: templates window (list, tag filter, one active template) and the template edit screen.
//   html:    templatesWindow(state), editScreen(state)
//   actions: tplOpenWin | tplCloseWin | tplFilter | tplActive | tplOpen | tplBack | tplToggleTag | tplAddTag |
//            tplNewBlank | tplNewCopy | tplSave | tplSetActive | tplDelete, see templateTagsActions.js

import { getSessions } from '../logic/template.js';
import { allTags, filterByTag, tagsOf, usedTags } from '../logic/templateTags.js';
import { activeSessionId } from '../logic/workout.js';
import { logicalDate } from '../logic/dates.js';
import { esc } from './format.js';
import { exerciseForm } from './templateView.js';

const backButton = (action, label) =>
  `<button class="back-link" data-action="${action}" aria-label="${label}"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>`;
const TRASH = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg>';

const chip = (on, attrs, text) => `<button class="btn chip ${on ? '' : 'secondary'}" ${attrs} aria-pressed="${on}">${esc(text)}</button>`;

const currentId = (state) => activeSessionId(null, logicalDate(Date.now(), state.dayStartHour), state.planDays);

/** The templates window: every session with its tags, a tag filter and an Active switch. */
export function templatesWindow(state) {
  const all = getSessions();
  const cur = currentId(state);
  const tag = usedTags(all).includes(state.tFilter) ? state.tFilter : '';
  const filters = [chip(!tag, 'data-action="tplFilter" data-tag=""', 'ALL'), ...usedTags(all).map((t) => chip(t === tag, `data-action="tplFilter" data-tag="${esc(t)}"`, t))].join('');
  const rows = filterByTag(all, tag).map((s) => `<div class="tplcard ${s.id === cur ? '' : 'off'}">
      <div class="tplcard-top"><span class="tplcard-name">${esc(s.name)}</span>
        <button class="editlink" data-action="tplOpen" data-id="${esc(s.id)}" aria-label="Edit ${esc(s.name)}">Edit</button></div>
      <small>${s.exercises.length} exercises</small>
      <div class="tags">${tagsOf(s).map((t) => `<span class="tag">${esc(t)}</span>`).join('') || '<small>No tags</small>'}</div>
      ${s.id === cur ? '<div class="tplrow"><b>Active template</b></div>' : `<button class="btn secondary" data-action="tplActive" data-id="${esc(s.id)}" aria-label="Set ${esc(s.name)} active">SET ACTIVE</button>`}
    </div>`).join('');
  return `<div class="backrow">${backButton('tplCloseWin', 'Back to workout')}<small>Active: ${esc(all.find((s) => s.id === cur)?.name ?? '')}</small></div>
    <h2 class="subtitle">Workout templates</h2>
    <div class="panel"><h2>NEW TEMPLATE</h2>
      <label class="lbl" for="tn-name">NAME</label>
      <input id="tn-name" class="field" maxlength="40" placeholder="Push day" autocomplete="off">
      <div class="pair">
        <button class="btn" data-action="tplNewBlank">START BLANK</button>
        <button class="btn secondary" data-action="tplNewCopy">COPY ACTIVE</button>
      </div>
    </div>
    <div class="chiprow tplfilter" role="group" aria-label="Filter by tag">${filters}</div>
    <div class="tpllist">${rows || '<p>No templates with that tag.</p>'}</div>`;
}

/** The edit screen for one template: name, tags, exercises, Set as active, Delete. */
export function editScreen(state) {
  const s = getSessions().find((x) => x.id === state.tScreen);
  if (!s) return '';
  const d = state.tplDraft ?? { name: s.name, tags: tagsOf(s) };
  const tagChips = [...new Set([...allTags(getSessions()), ...d.tags])].map((t) => chip(d.tags.includes(t), `data-action="tplToggleTag" data-tag="${esc(t)}"`, t)).join('');
  const rows = s.exercises.map((ex, i) => `<div class="exrow"><span class="exname">${esc(ex.name)}</span><small>${esc(ex.target)}</small>
      <button class="editlink" data-action="tEditStart" data-i="${i}" aria-label="Edit ${esc(ex.name)}">Edit</button>
      <button class="trash" data-action="tDelete" data-i="${i}" aria-label="Remove ${esc(ex.name)}">${TRASH}</button></div>`).join('');
  return `<div class="backrow">${backButton('tplBack', 'Back to templates')}</div>
    <h2 class="subtitle">Edit template</h2>
    <div class="panel"><h2>EDIT TEMPLATE</h2>
      <label class="lbl" for="tp-name">NAME</label>
      <input id="tp-name" class="field" maxlength="40" value="${esc(d.name)}" autocomplete="off">
      <label class="lbl">TAGS</label>
      <div class="chiprow" role="group" aria-label="Tags">${tagChips}</div>
      <div class="inline"><input id="tp-tag" class="field" maxlength="20" placeholder="Custom tag" aria-label="Custom tag" autocomplete="off">
        <button class="btn secondary" data-action="tplAddTag">ADD TAG</button></div>
      <button class="btn" data-action="tplSave">SAVE NAME AND TAGS</button>
    </div>
    ${state.tEdit ? exerciseForm(state, s) : ''}
    <div class="panel"><h2>EXERCISES</h2>
      ${rows || '<p>No exercises. Add one below.</p>'}
      <button class="btn" data-action="tAdd">ADD EXERCISE</button>
    </div>
    <div class="panel">
      <button class="btn secondary" data-action="tplSetActive" ${s.id === currentId(state) ? 'disabled' : ''}>SET AS ACTIVE</button>
      <button class="btn danger" data-action="tplDelete">DELETE TEMPLATE</button>
      <button class="btn secondary" data-action="tplBack">BACK TO TEMPLATES</button>
    </div>`;
}
