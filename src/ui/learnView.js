// Learn window (Today v2): log a session by area, weekly area progress, edit areas, recent sessions.
//   html:    learnView(state, day)
//   actions: closeTodayWin, pickArea, pickType, learnMin, logSession, openTimer, toggleLearn,
//            openAreaEdit, addStarterArea, saveArea, deleteArea, closeAreaEdit
import { esc } from './format.js';
import { sessionOf } from '../logic/sessions.js';
import { practicePanel } from './practiceView.js';
import { todayByArea, minutesToday, weekMinutes, areaOfEntry, AREA_TYPES } from '../logic/areas.js';

// One-tap suggestions under 'Add an area'. The fresh-install defaults live in logic/areas.js (STARTER_AREAS).
const SUGGESTED_AREAS = ['Language', 'Reading', 'Exam prep'];

const BACK = '<button class="back-link" data-action="closeTodayWin" aria-label="Back to Today"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>';
const CHEV = '<svg class="acc-chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
const FOCUSES = '<datalist id="focuses"><option value="technique"><option value="songs"><option value="theory"><option value="improvisation"></datalist>';
const TYPE_LABEL = { practice: 'Practice', study: 'Study', project: 'Project', review: 'Review' };

/** Drop-down header (56px row) with the body shown only when open. */
function accordion(open, key, title, body) {
  return `<div class="panel acc${open ? ' open' : ''}">
    <button class="acc-head" data-action="toggleLearn" data-section="${key}" aria-expanded="${open}" aria-controls="acc-learn-${key}">
      <h2>${title}</h2>${CHEV}</button>
    ${open ? `<div class="acc-body" id="acc-learn-${key}">${body}</div>` : ''}
  </div>`;
}

function editPanel(areas, name) {
  const cur = areas.find((a) => a.name === name);
  const goal = cur && cur.weeklyGoal != null ? cur.weeklyGoal : '';
  return `<div class="panel">
      <h2>${cur ? 'EDIT AREA' : 'NEW AREA'}</h2>
      <input id="area-name" class="field" maxlength="30" value="${esc(cur ? cur.name : name || '')}" placeholder="Area name" aria-label="Area name" autocomplete="off">
      <input id="area-metric" class="field" maxlength="20" value="${esc(cur ? cur.metricLabel || '' : '')}" placeholder="Metric label (optional), e.g. Pages" aria-label="Metric label, optional" autocomplete="off">
      <input id="area-goal" class="field" type="number" inputmode="numeric" step="1" value="${esc(goal)}" placeholder="Weekly goal in minutes (optional)" aria-label="Weekly goal in minutes, optional">
      <div class="inline">
        <button class="btn" data-action="saveArea" data-area="${esc(cur ? cur.name : '')}">SAVE</button>
        <button class="btn secondary" data-action="closeAreaEdit">Cancel</button>
      </div>
      ${cur ? `<button class="btn secondary" data-action="deleteArea" data-area="${esc(cur.name)}">Remove</button>` : ''}
    </div>`;
}

function areaRows(state, areas, day) {
  const rows = areas.map((a) => {
    const min = weekMinutes(state.entries, a.name, day);
    const text = a.weeklyGoal ? `${min} of ${a.weeklyGoal} min` : `${min} min`;
    const pct = a.weeklyGoal ? Math.min(100, Math.round((min / a.weeklyGoal) * 100)) : 0;
    return `<div class="row"><span>${esc(a.name)}</span><span>${text}</span></div>
      ${a.weeklyGoal ? `<div class="bar"><i style="width:${pct}%"></i></div>` : ''}
      <button class="btn secondary" data-action="openAreaEdit" data-area="${esc(a.name)}" aria-label="Edit ${esc(a.name)}">Edit</button>`;
  }).join('');
  const have = new Set(areas.map((a) => a.name.toLowerCase()));
  const starters = SUGGESTED_AREAS.filter((n) => !have.has(n.toLowerCase()))
    .map((n) => `<button class="qa-chip" data-action="addStarterArea" data-area="${esc(n)}">${esc(n)}</button>`).join('');
  return `<div class="panel">
      <h2>MY AREAS · THIS WEEK</h2>
      ${rows || '<p class="note">No areas yet.</p>'}
      <p class="note">Add an area</p>
      <div class="qa-chips">${starters}<button class="qa-chip" data-action="openAreaEdit" data-area="">Your own</button></div>
    </div>`;
}

function recentList(entries) {
  const rows = (entries || []).filter((e) => !e.deletedAt && sessionOf(e))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)).slice(0, 5)
    .map((e) => `<div class="row"><span>${esc(e.date)} ${esc(sessionOf(e).area ?? areaOfEntry(e))}</span><span>${esc(sessionOf(e).minutes)} min</span></div>`).join('');
  return rows || '<p class="note">No sessions yet.</p>';
}

export function learnView(state, day) {
  const areas = Array.isArray(state.areas) ? state.areas : [];
  const l = state.learn || {};
  const running = state.practice && state.practice.startAt != null;
  const body = l.edit ? editPanel(areas, l.edit.name) : areaRows(state, areas, day);
  const area = areas.find((a) => a.name === l.area) || areas[0] || null;
  const type = AREA_TYPES.includes(l.type) ? l.type : 'practice';
  const d = l.draft || {};
  const total = minutesToday(state.entries, day);
  const chips = todayByArea(state.entries, day)
    .map((r) => `<span class="qa-chip">${esc(r.area)} ${esc(r.minutes)}</span>`).join('');
  const options = areas.map((a) => `<option value="${esc(a.name)}"${area && a.name === area.name ? ' selected' : ''}>${esc(a.name)}</option>`).join('');
  const typeChips = AREA_TYPES.map((t) => `<button class="qa-chip${t === type ? ' on' : ''}" data-action="pickType" data-type="${t}" aria-pressed="${t === type}">${TYPE_LABEL[t]}</button>`).join('');
  const minChips = [15, 30, 45, 60].map((m) => `<button class="qa-chip" data-action="learnMin" data-min="${m}">${m}</button>`).join('');
  const metric = area && area.metricLabel
    ? `<input id="learn-metric" class="field" type="number" inputmode="decimal" step="any" value="${esc(d.metric ?? '')}" placeholder="${esc(area.metricLabel)} (optional)" aria-label="${esc(area.metricLabel)}, optional">` : '';
  const more = `${metric}
      <input id="learn-focus" class="field" maxlength="40" list="focuses" value="${esc(d.focus ?? '')}" placeholder="Focus (optional)" aria-label="Focus, optional" autocomplete="off">
      ${FOCUSES}
      <input id="learn-notes" class="field" maxlength="500" value="${esc(d.notes ?? '')}" placeholder="Notes (optional)" aria-label="Notes, optional" autocomplete="off">`;
  return `<div class="backrow">${BACK}</div>
    <h2 class="subtitle">Learn</h2>
    ${running ? practicePanel(state) : ''}
    <div class="panel">
      <h2>TODAY</h2>
      <p class="note">${esc(total)} min today</p>
      <div class="qa-chips">${chips}</div>
    </div>
    <div class="panel">
      <h2>LOG A SESSION</h2>
      <label class="note" for="learn-area">Area</label>
      <select id="learn-area" class="field" data-action="pickArea">${options}</select>
      <div class="qa-chips" role="group" aria-label="Type">${typeChips}</div>
      <input id="learn-min" class="field" type="number" inputmode="numeric" step="1" value="${esc(d.minutes ?? '')}" placeholder="Minutes" aria-label="Minutes">
      <div class="qa-chips">${minChips}</div>
      ${accordion(!!l.more, 'more', 'MORE DETAILS', more)}
      <div class="inline">
        <button class="btn" data-action="logSession">SAVE SESSION</button>
        <button class="btn secondary" data-action="openTimer">START TIMER</button>
      </div>
    </div>
    ${body}
    ${accordion(!!l.recent, 'recent', 'RECENT SESSIONS', recentList(state.entries))}`;
}
