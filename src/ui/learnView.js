// Learn window (F68, screen A style): log a session by area, weekly area progress, edit areas, recent sessions.
//   html:    learnView(state, day)
//   actions: closeTodayWin, pickArea, pickType, learnMin, learnFocus, logSession, practiceStart, practiceStop,
//            practiceDiscard, toggleLearn,
//            openAreaEdit, addStarterArea, saveArea, deleteArea, closeAreaEdit
import { esc } from './format.js';
import { sessionOf } from '../logic/sessions.js';
import { clock, elapsedSeconds, practiceMinutes } from '../logic/practiceTimer.js';
import { todayByArea, minutesToday, weekMinutes, areaOfEntry, AREA_TYPES } from '../logic/areas.js';
import { winHeader, winSection, chipRow } from './winParts.js';

// One-tap suggestions under 'Add an area'. The fresh-install defaults live in logic/areas.js (STARTER_AREAS).
const SUGGESTED_AREAS = ['Language', 'Reading', 'Exam prep'];
const MAX_AREA_CHIPS = 6;

const CHEV = '<svg class="acc-chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
const FOCUSES = '<datalist id="focuses"><option value="technique"><option value="songs"><option value="theory"><option value="improvisation"></datalist>';
const TYPE_LABEL = { practice: 'Practice', study: 'Study', project: 'Project', review: 'Review' };
const FOCUS_SUGGEST = ['Technique', 'Songs', 'Theory', 'Improvisation'];

/** White fold (closed by default) with the body shown only when open. */
function fold(open, key, title, body, hint = '') {
  return `<div class="win-learn-fold${open ? ' open' : ''}">
    <button class="win-learn-foldhead" data-action="toggleLearn" data-section="${key}" aria-expanded="${open}" aria-controls="acc-learn-${key}">
      <span class="win-learn-foldtitle"><b>${esc(title)}</b>${hint ? `<small>${esc(hint)}</small>` : ''}</span>${CHEV}</button>
    ${open ? `<div class="win-learn-foldbody" id="acc-learn-${key}">${body}</div>` : ''}
  </div>`;
}

function field(label, id, input) {
  return `<div class="win-field"><label for="${id}">${esc(label)}</label>${input}</div>`;
}

function editPanel(areas, name) {
  const cur = areas.find((a) => a.name === name);
  const goal = cur && cur.weeklyGoal != null ? cur.weeklyGoal : '';
  const body = `${field('Name', 'area-name', `<input id="area-name" class="field" maxlength="30" value="${esc(cur ? cur.name : name || '')}" autocomplete="off">`)}
      ${field('What you measure (optional)', 'area-metric', `<input id="area-metric" class="field" maxlength="20" value="${esc(cur ? cur.metricLabel || '' : '')}" placeholder="For example, Pages" autocomplete="off">`)}
      ${field('Weekly goal in minutes (optional)', 'area-goal', `<input id="area-goal" class="field" type="number" inputmode="numeric" step="1" value="${esc(goal)}">`)}
      <div class="win-learn-btns">
        <button class="btn win-learn-dark" data-action="saveArea" data-area="${esc(cur ? cur.name : '')}">Save area</button>
        <button class="btn secondary win-learn-out" data-action="closeAreaEdit">Cancel</button>
      </div>
      ${cur ? `<button class="win-learn-remove win-danger" data-action="deleteArea" data-area="${esc(cur.name)}">Remove ${esc(cur.name)}</button>` : ''}`;
  return winSection({ title: cur ? 'Edit area' : 'New area', body });
}

/** Soft-peach card shown only while the timer runs. An interval repaints #practice-time. */
function timerCard(state, areas, fallbackArea) {
  const p = state.practice;
  const secs = elapsedSeconds(p, Date.now());
  const name = p.area || (fallbackArea ? fallbackArea.name : '');
  const a = areas.find((x) => x.name === name);
  const label = (a && a.metricLabel) || (name === 'Guitar' ? 'Best BPM' : '');
  const metric = label
    ? field(`${label} (optional)`, 'pt-metric', '<input id="pt-metric" class="field" type="number" inputmode="decimal" step="any">') : '';
  return `<div class="panel timercard win-learn-timer">
      <h2>Timer running${name ? `: ${esc(name)}` : ''}</h2>
      <div class="big win-learn-clock" id="practice-time" role="timer">${clock(secs)}</div>
      <p class="note">Practising${p.focus ? `: ${esc(p.focus)}` : ''}. Stopping logs ${practiceMinutes(secs)} min.</p>
      ${metric}
      <div class="win-learn-btns">
        <button class="btn win-learn-dark" data-action="practiceStop">Stop and log</button>
        <button class="btn secondary win-learn-out" data-action="practiceDiscard">Discard</button>
      </div>
    </div>`;
}

function areaRows(state, areas, day) {
  const rows = areas.map((a) => {
    const min = weekMinutes(state.entries, a.name, day);
    const text = a.weeklyGoal ? `${min} of ${a.weeklyGoal} min` : `${min} min, no weekly goal`;
    const pct = a.weeklyGoal ? Math.min(100, Math.round((min / a.weeklyGoal) * 100)) : 0;
    return `<div class="win-learn-area"><div class="win-row"><span class="win-learn-aname">${esc(a.name)}</span><span class="win-learn-aend"><span>${text}</span><button class="btn secondary win-learn-out win-learn-edit" data-action="openAreaEdit" data-area="${esc(a.name)}" aria-label="Edit ${esc(a.name)}">Edit</button></span></div>
      ${a.weeklyGoal ? `<div class="bar win-learn-bar"><i style="width:${pct}%"></i></div>` : ''}</div>`;
  }).join('');
  const have = new Set(areas.map((a) => a.name.toLowerCase()));
  const starters = SUGGESTED_AREAS.filter((n) => !have.has(n.toLowerCase()))
    .map((n) => ({ label: n, action: 'addStarterArea', data: { area: n } }));
  starters.push({ label: 'Your own', action: 'openAreaEdit', data: { area: '' } });
  const body = `${rows || '<p class="note">No areas yet.</p>'}
      <p class="win-learn-sub">Add an area</p>
      ${chipRow(starters, { label: 'Add an area' })}`;
  return winSection({ title: 'Your areas this week', body });
}

function sessionsOf(entries) {
  return (entries || []).filter((e) => !e.deletedAt && sessionOf(e))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

function recentList(list) {
  const rows = list.slice(0, 5)
    .map((e) => `<div class="win-row"><span>${esc(e.date)} ${esc(sessionOf(e).area ?? areaOfEntry(e))}</span><span>${esc(sessionOf(e).minutes)} min</span></div>`).join('');
  return rows || '<p class="note">No sessions yet.</p>';
}

export function learnView(state, day) {
  const areas = Array.isArray(state.areas) ? state.areas : [];
  const l = state.learn || {};
  const running = state.practice && state.practice.startAt != null;
  const area = areas.find((a) => a.name === l.area) || areas[0] || null;
  const type = AREA_TYPES.includes(l.type) ? l.type : 'practice';
  const d = l.draft || {};
  const total = minutesToday(state.entries, day);
  const chips = todayByArea(state.entries, day).map((r) => `${r.area} ${r.minutes} min`);

  const areaPick = areas.length > MAX_AREA_CHIPS
    ? `<select id="learn-area" class="field" data-action="pickArea" aria-label="Area">${areas.map((a) => `<option value="${esc(a.name)}"${area && a.name === area.name ? ' selected' : ''}>${esc(a.name)}</option>`).join('')}</select>`
    : chipRow(areas.map((a) => ({ label: a.name, selected: !!area && a.name === area.name, action: 'pickArea', data: { area: a.name } })), { label: 'Area' });
  const typePick = area && area.name === 'Guitar'
    ? '<p class="win-learn-fixed">Practice. Guitar sessions always count as practice</p>'
    : chipRow(AREA_TYPES.map((t) => ({ label: TYPE_LABEL[t], selected: t === type, action: 'pickType', data: { type: t } })), { label: 'Type' });
  const minChips = chipRow([15, 30, 45, 60].map((m) => ({ label: `${m} min`, selected: String(d.minutes ?? '') === String(m), action: 'learnMin', data: { min: m } })), { label: 'Minutes' });

  const metric = area && area.metricLabel
    ? field(`${area.metricLabel} (optional)`, 'learn-metric', `<input id="learn-metric" class="field" type="number" inputmode="decimal" step="any" value="${esc(d.metric ?? '')}">`) : '';
  const more = `${metric}
      ${field('Focus (optional)', 'learn-focus', `<input id="learn-focus" class="field" maxlength="40" list="focuses" value="${esc(d.focus ?? '')}" autocomplete="off">`)}
      ${FOCUSES}
      <div class="win-chiprow" role="group" aria-label="Focus suggestions">${FOCUS_SUGGEST.map((f) => `<button class="win-chip" data-action="learnFocus" data-focus="${f.toLowerCase()}">${f}</button>`).join('')}</div>
      ${field('Notes (optional)', 'learn-notes', `<input id="learn-notes" class="field" maxlength="500" value="${esc(d.notes ?? '')}" autocomplete="off">`)}`;
  const hint = area && area.metricLabel ? `${area.metricLabel}, focus and notes` : 'Focus and notes';

  const log = winSection({ title: 'Log a session', body: `
      <div class="win-field"><span class="win-learn-lbl">Area</span>${areaPick}</div>
      <div class="win-field"><span class="win-learn-lbl">Type</span>${typePick}</div>
      ${field('Minutes', 'learn-min', `<input id="learn-min" class="field" type="number" inputmode="numeric" step="1" value="${esc(d.minutes ?? '')}">`)}
      ${minChips}
      ${fold(!!l.more, 'more', 'More details', more, hint)}
      <div class="win-learn-btns">
        <button class="btn win-learn-save" data-action="logSession">Save session</button>
        ${running ? '' : '<button class="btn secondary win-learn-out" data-action="practiceStart">Start timer</button>'}
      </div>` });

  const list = sessionsOf(state.entries);
  const recent = fold(!!l.recent, 'recent', 'Recent sessions', recentList(list), `${Math.min(5, list.length)} newest`);

  return `${winHeader({ title: 'Learn', summary: `${total} minutes today`, chips })}
    ${running ? timerCard(state, areas, area) : ''}
    ${log}
    ${l.edit ? editPanel(areas, l.edit.name) : areaRows(state, areas, day)}
    ${recent}`;
}
