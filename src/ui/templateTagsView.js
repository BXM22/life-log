// WORKOUT tab, F42: scrolling session chip row, templates window (list, tag filter, Active switch) and the template edit screen.
//   html:    sessionChips(state, id), templatesWindow(state), editScreen(state)
//   actions: pickChip | tplOpenWin | tplCloseWin | tplFilter | tplActive | tplOpen | tplBack | tplToggleTag | tplAddTag |
//            tplSave | tplSetActive | tplDelete, see templateTagsActions.js

import { getSessions } from '../logic/template.js';
import { allTags, filterByTag, isActive, tagsOf, usedTags, visibleSessions } from '../logic/templateTags.js';
import { esc } from './format.js';
import { exerciseForm } from './templateView.js';

const chip = (on, attrs, text) => `<button class="btn chip ${on ? '' : 'secondary'}" ${attrs} aria-pressed="${on}">${esc(text)}</button>`;

/** One row of session chips. Long names scroll sideways instead of cutting off; only active sessions show. */
export function sessionChips(state, id) {
  const chips = visibleSessions(getSessions(), id).map((s) => chip(s.id === id, `data-action="pickChip" data-id="${esc(s.id)}"`, s.name)).join('');
  return `<div class="chiprow" role="group" aria-label="Session">${chips}</div>`;
}

/** The templates window: every session with its tags, a tag filter and an Active switch. */
export function templatesWindow(state) {
  const all = getSessions();
  const tag = usedTags(all).includes(state.tFilter) ? state.tFilter : '';
  const filters = [chip(!tag, 'data-action="tplFilter" data-tag=""', 'ALL'), ...usedTags(all).map((t) => chip(t === tag, `data-action="tplFilter" data-tag="${esc(t)}"`, t))].join('');
  const rows = filterByTag(all, tag).map((s) => `<div class="entry">
      <div class="row"><span>${esc(s.name)}</span>
        <label class="check tplswitch"><input type="checkbox" data-action="tplActive" data-id="${esc(s.id)}" ${isActive(s) ? 'checked' : ''} aria-label="${esc(s.name)} active"><span>ACTIVE</span></label></div>
      <div class="tags">${tagsOf(s).map((t) => `<span class="tag">${esc(t)}</span>`).join('') || '<small>No tags</small>'}</div>
      <small>${s.exercises.length} exercises</small>
      <div class="actions"><button class="btn small secondary" data-action="tplOpen" data-id="${esc(s.id)}" aria-label="Edit ${esc(s.name)}">EDIT</button></div>
    </div>`).join('');
  return `<div class="panel"><h2>TEMPLATES</h2>
      <p>Active templates show on the Workout tab. Inactive ones are hidden but kept.</p>
      <div class="chiprow" role="group" aria-label="Filter by tag">${filters}</div>
    </div>
    <div class="panel">${rows || '<p>No templates with that tag.</p>'}
      <button class="btn secondary" data-action="tplCloseWin">BACK TO WORKOUT</button>
    </div>`;
}

/** The edit screen for one template: name, tags, exercises, Set as active, Delete. */
export function editScreen(state) {
  const s = getSessions().find((x) => x.id === state.tScreen);
  if (!s) return '';
  const d = state.tplDraft ?? { name: s.name, tags: tagsOf(s) };
  const tagChips = [...new Set([...allTags(getSessions()), ...d.tags])].map((t) => chip(d.tags.includes(t), `data-action="tplToggleTag" data-tag="${esc(t)}"`, t)).join('');
  const rows = s.exercises.map((ex, i) => `<div class="entry"><div class="row"><span>${esc(ex.name)}</span>
      <span class="actions"><button class="btn small secondary" data-action="tEditStart" data-i="${i}" aria-label="Edit ${esc(ex.name)}">EDIT</button>
      <button class="btn small secondary" data-action="tDelete" data-i="${i}" aria-label="Remove ${esc(ex.name)}">REMOVE</button></span></div>
      <small>${esc(ex.target)}</small></div>`).join('');
  return `<div class="panel"><h2>EDIT TEMPLATE</h2>
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
      <button class="btn secondary" data-action="tplSetActive" ${isActive(s) && state.wSession === s.id ? 'disabled' : ''}>SET AS ACTIVE</button>
      <button class="btn danger" data-action="tplDelete">DELETE TEMPLATE</button>
      <button class="btn secondary" data-action="tplBack">BACK TO TEMPLATES</button>
    </div>`;
}
