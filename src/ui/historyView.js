// HISTORY tab (v2): one This week card and four Look closer rows; detail lives on pages, edit lives in a sheet.
//   html:    historyView(state, today?)   root, or the page for state.histWin ('weight' | 'habits' | 'lifts' | 'entries')
//            editForm(entry)              in-place edit form, also used by the Workout exercise page (keep its ids and buttons)
//   state:   histWin, histLift, editId (app.js); hvQuery, hvFilter ('all' | 'waiting' | 'weigh' | 'lifts'), hvAsk (entry id awaiting delete confirm)
//   actions: hvOpen data-win, hvSearch, hvFilter data-key, hvClear, hvAsk data-id, hvAskCancel, hvDelete data-id (historyActions.js);
//            startEdit | saveEdit | cancelEdit | deleteEntry data-id, closeHistWin, pickLift (app.js)
// Styles: src/styles/w3-history.css (.hv-*).

import { isDirty } from '../logic/exportBuilder.js';
import { liveEntries, weightHistory, MEAL_TYPES } from '../logic/entries.js';
import { SESSION_TYPES, isGuitarArea } from '../logic/sessions.js';
import { recentLifts, liftSummary } from '../logic/progress.js';
import { allStreaks } from '../logic/streaks.js';
import { addDays, logicalDate } from '../logic/dates.js';
import { esc, label } from './format.js';
import { liftWindow, pageHead, ICON } from './historyWindows.js';
import { weekPanel, weightPage, weightSpark, gapText } from './weekPanel.js';
import { habitsPage } from './progressView.js';

const MAX_ROWS = 60;

export function editForm(e) {
  let fields = '';
  if (e.type === 'weigh_in') {
    fields = `<input id="ed-w" class="field" type="number" inputmode="decimal" step="0.1" value="${esc(e.data.weight_lb)}" aria-label="Weight in lb">`;
  } else if (e.type === 'guitar') {
    fields = `<input id="ed-m" class="field" type="number" inputmode="numeric" step="1" value="${esc(e.data.minutes)}" aria-label="Minutes">
      <input id="ed-f" class="field" maxlength="40" value="${esc(e.data.focus || '')}" aria-label="Focus" autocomplete="off">
      <input id="ed-b" class="field" type="number" inputmode="numeric" step="1" value="${esc(e.data.best_bpm ?? '')}" placeholder="Best BPM" aria-label="Best BPM">`;
  } else if (e.type === 'meal') {
    fields = `<select id="ed-mt" class="field" aria-label="Meal type">${MEAL_TYPES.map((t) => `<option ${t === e.data.mealType ? 'selected' : ''}>${t}</option>`).join('')}</select>
      <input id="ed-mn" class="field" maxlength="60" value="${esc(e.data.name)}" aria-label="Meal name" autocomplete="off">
      <input id="ed-mp" class="field" type="number" inputmode="numeric" step="1" value="${esc(e.data.protein_g ?? '')}" placeholder="Protein (g, optional)" aria-label="Protein in grams, optional">`;
  } else if (e.type === 'note') {
    fields = `<input id="ed-nt" class="field" maxlength="80" value="${esc(e.data.title || '')}" placeholder="Title (optional)" aria-label="Note title" autocomplete="off">
      <textarea id="ed-nb" class="field" rows="6" maxlength="5000" aria-label="Note">${esc(e.data.body)}</textarea>`;
  } else if (e.type === 'lift_set') {
    const d = e.data;
    fields = `<p>${esc(d.exercise)} ${d.kind === 'warmup' ? '(warm-up)' : ''} ${d.side ? esc(d.side) : ''}</p>
      <input id="ed-w" class="field" type="number" inputmode="decimal" step="0.5" value="${esc(d.weight ?? '')}" placeholder="Weight (lb)" aria-label="Weight in lb">
      ${d.seconds != null
    ? `<input id="ed-s" class="field" type="number" inputmode="numeric" step="1" value="${esc(d.seconds)}" aria-label="Seconds">`
    : `<input id="ed-r" class="field" type="number" inputmode="numeric" step="1" value="${esc(d.reps ?? '')}" aria-label="Reps">`}`;
  } else if (e.type === 'session') {
    const d = e.data;
    const metricLabel = isGuitarArea(d.area) ? 'Best BPM' : (d.metricLabel || '');
    fields = `<p>${esc(d.area)}</p>
      <select id="ed-st" class="field" aria-label="Session type">${SESSION_TYPES.map((t) => `<option ${t === d.type ? 'selected' : ''}>${t}</option>`).join('')}</select>
      <input id="ed-sm" class="field" type="number" inputmode="numeric" step="1" value="${esc(d.minutes)}" aria-label="Minutes">
      ${metricLabel ? `<input id="ed-sx" class="field" type="number" inputmode="decimal" step="any" value="${esc(d.metric ?? '')}" placeholder="${esc(metricLabel)}" aria-label="${esc(metricLabel)}">` : ''}
      <input id="ed-sf" class="field" maxlength="40" value="${esc(d.focus || '')}" placeholder="Focus" aria-label="Focus" autocomplete="off">
      <input id="ed-sn" class="field" maxlength="500" value="${esc(d.notes || '')}" placeholder="Notes" aria-label="Notes" autocomplete="off">`;
  } else {
    fields = `<label class="check"><input id="ed-d" type="checkbox" ${e.data.done ? 'checked' : ''}><span>${esc(e.data.habit)} done</span></label>`;
  }
  return `<div class="entry editing"><b>${esc(e.date)}</b>${fields}
    <button class="btn" data-action="saveEdit" data-id="${esc(e.id)}">SAVE</button>
    <button class="btn secondary" data-action="cancelEdit">CANCEL</button></div>`;
}

// ---- Edit entry sheet (over All entries). Same field ids as editForm, so app.js saveEdit reads them unchanged. ----

const fld = (id, text, input) => `<div class="hv-fld"><label class="lbl" for="${id}">${text}</label>${input}</div>`;
const num = (id, value, step, mode = 'decimal', ph = '') => `<input id="${id}" class="field" type="number" inputmode="${mode}" step="${step}" value="${esc(value ?? '')}"${ph ? ` placeholder="${esc(ph)}"` : ''}>`;
const txt = (id, value, max, ph = '') => `<input id="${id}" class="field" maxlength="${max}" value="${esc(value ?? '')}"${ph ? ` placeholder="${esc(ph)}"` : ''} autocomplete="off">`;

function sheetFields(e) {
  const d = e.data;
  if (e.type === 'weigh_in') return fld('ed-w', 'Weight (lb)', num('ed-w', d.weight_lb, '0.1'));
  if (e.type === 'guitar') {
    return `<div class="hv-fgrid">${fld('ed-m', 'Minutes', num('ed-m', d.minutes, '1', 'numeric'))}${fld('ed-b', 'Best BPM', num('ed-b', d.best_bpm, '1', 'numeric', 'Optional'))}</div>
      ${fld('ed-f', 'Focus', txt('ed-f', d.focus || '', 40))}`;
  }
  if (e.type === 'meal') {
    return `<div class="hv-fgrid">${fld('ed-mt', 'Meal', `<select id="ed-mt" class="field">${MEAL_TYPES.map((t) => `<option ${t === d.mealType ? 'selected' : ''}>${t}</option>`).join('')}</select>`)}
      ${fld('ed-mp', 'Protein (g)', num('ed-mp', d.protein_g, '1', 'numeric', 'Optional'))}</div>
      ${fld('ed-mn', 'Name', txt('ed-mn', d.name, 60))}`;
  }
  if (e.type === 'note') {
    return `${fld('ed-nt', 'Title', txt('ed-nt', d.title || '', 80, 'Optional'))}
      ${fld('ed-nb', 'Note', `<textarea id="ed-nb" class="field" rows="6" maxlength="5000">${esc(d.body)}</textarea>`)}`;
  }
  if (e.type === 'lift_set') {
    const tags = [d.kind === 'warmup' ? 'Warm-up' : 'Working set', d.side, d.load ? (d.load === 'assisted' ? 'Assisted' : 'Added weight') : null].filter(Boolean);
    return `<p class="hv-fixed"><b>${esc(d.exercise)}</b>${tags.map((t) => `<span class="hv-tag plain">${esc(t)}</span>`).join('')}</p>
      <div class="hv-fgrid">${fld('ed-w', 'Weight (lb)', num('ed-w', d.weight, '0.5', 'decimal', 'None'))}
      ${d.seconds != null ? fld('ed-s', 'Seconds', num('ed-s', d.seconds, '1', 'numeric')) : fld('ed-r', 'Reps', num('ed-r', d.reps, '1', 'numeric'))}</div>`;
  }
  if (e.type === 'session') {
    const metricLabel = isGuitarArea(d.area) ? 'Best BPM' : (d.metricLabel || '');
    return `<p class="hv-fixed"><b>${esc(d.area)}</b></p>
      <div class="hv-fgrid">${fld('ed-st', 'Type', `<select id="ed-st" class="field">${SESSION_TYPES.map((t) => `<option ${t === d.type ? 'selected' : ''}>${t}</option>`).join('')}</select>`)}
      ${fld('ed-sm', 'Minutes', num('ed-sm', d.minutes, '1', 'numeric'))}</div>
      ${metricLabel ? fld('ed-sx', esc(metricLabel), num('ed-sx', d.metric, 'any', 'decimal', 'Optional')) : ''}
      ${fld('ed-sf', 'Focus', txt('ed-sf', d.focus || '', 40, 'Optional'))}
      ${fld('ed-sn', 'Notes', txt('ed-sn', d.notes || '', 500, 'Optional'))}`;
  }
  return `<label class="check hv-checkrow"><input id="ed-d" type="checkbox" ${d.done ? 'checked' : ''}><span>${esc(d.habit)} done</span></label>`;
}

export function editSheet(state, e) {
  const asking = state.hvAsk === e.id;
  const canDelete = e.type !== 'habit_check';
  const kept = e.exportedAt != null ? ' It is already in your Dropbox export; that copy stays.' : '';
  const foot = asking
    ? `<div class="hv-confirm" role="alertdialog" aria-labelledby="hv-ask-t"><p id="hv-ask-t"><b>Delete this entry?</b> ${esc(label(e))} on ${esc(dayLabel(e.date, state.hvToday))}.${esc(kept)}</p>
        <div class="hv-btns"><button class="btn secondary" data-action="hvAskCancel">Keep it</button><button class="btn danger" data-action="hvDelete" data-id="${esc(e.id)}">Delete</button></div></div>`
    : `<p class="hv-hint">Saving marks it Waiting, so it exports again.</p>
      <div class="hv-btns"><button class="btn secondary" data-action="cancelEdit">Cancel</button><button class="btn" data-action="saveEdit" data-id="${esc(e.id)}">Save changes</button></div>
      ${canDelete ? `<button class="hv-delete" data-action="hvAsk" data-id="${esc(e.id)}">${ICON.trash}<span>Delete entry</span></button>`
    : '<p class="hv-hint">Habit checks are changed here or on Today, never deleted, so Dropbox never keeps a stale "done".</p>'}`;
  return `<div class="qa-scrim hv-scrim" data-action="cancelEdit"></div>
    <div class="qa-sheet hv-sheet" role="dialog" aria-modal="true" aria-labelledby="hv-sheet-t">
      <div class="hv-grab" aria-hidden="true"></div>
      <div class="hv-sheet-head"><div><h2 id="hv-sheet-t">Edit entry</h2><small>${esc(dayLabel(e.date, state.hvToday))}</small></div>
        <button class="hv-x" data-action="cancelEdit" aria-label="Close"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
      ${sheetFields(e)}
      ${foot}
    </div>`;
}

// ---- All entries page ----

const FILTERS = [['all', 'All'], ['waiting', 'Waiting'], ['weigh', 'Weigh-ins'], ['lifts', 'Lifts']];
const TEST = { all: () => true, waiting: isDirty, weigh: (e) => e.type === 'weigh_in', lifts: (e) => e.type === 'lift_set' };

/** Newest first entries matching the search text (date or label) and the filter key. */
export function filterEntries(all, query = '', key = 'all') {
  const q = String(query).trim().toLowerCase();
  const t = TEST[key] ?? TEST.all;
  return all.filter((e) => t(e) && (!q || `${e.date} ${label(e)}`.toLowerCase().includes(q)));
}

export function dayLabel(date, today) {
  if (today && date === today) return 'Today';
  if (today && date === addDays(today, -1)) return 'Yesterday';
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function typeIcon(e) {
  if (e.type === 'weigh_in') return ICON.scale;
  if (e.type === 'lift_set') return ICON.bell;
  if (e.type === 'guitar' || (e.type === 'session' && isGuitarArea(e.data.area))) return ICON.music;
  if (e.type === 'meal') return ICON.meal;
  if (e.type === 'note') return ICON.note;
  if (e.type === 'habit_check') return ICON.check;
  return ICON.book;
}

function entryRow(e) {
  const dirty = isDirty(e);
  const tag = `<span class="hv-tag${dirty ? ' wait' : ' plain'}">${dirty ? 'Waiting' : 'Exported'}</span>`;
  const body = `<span class="hv-ticon" aria-hidden="true">${typeIcon(e)}</span><span class="hv-rmain"><b>${esc(label(e))}</b></span>${tag}`;
  // Study entries are not editable (entries.js refuses them): delete and log them again.
  if (e.type === 'study') {
    return `<div class="hv-row static">${body}<button class="hv-ico danger" data-action="deleteEntry" data-id="${esc(e.id)}" aria-label="Delete ${esc(label(e))}">${ICON.trash}</button></div>`;
  }
  return `<button class="hv-row" data-action="startEdit" data-id="${esc(e.id)}" aria-label="Edit ${esc(label(e))}, ${dirty ? 'waiting' : 'exported'}">${body}${ICON.chev}</button>`;
}

function entriesPage(state, all, today) {
  const q = state.hvQuery ?? '';
  const key = state.hvFilter ?? 'all';
  const shown = filterEntries(all, q, key);
  const chips = FILTERS.map(([k, t]) => `<button class="btn hv-chip" data-action="hvFilter" data-key="${k}" aria-pressed="${k === key}">${t}<span>${all.filter(TEST[k]).length}</span></button>`).join('');
  const groups = new Map();
  for (const e of shown.slice(0, MAX_ROWS)) {
    if (!groups.has(e.date)) groups.set(e.date, []);
    groups.get(e.date).push(e);
  }
  const list = [...groups].map(([date, rows]) => `<h3 class="hv-sec hv-day">${esc(dayLabel(date, today))}<span class="hv-count">${rows.length}</span></h3><div class="hv-list">${rows.map(entryRow).join('')}</div>`).join('');
  const empty = !all.length
    ? '<p class="hv-empty"><b>No entries yet</b>Everything you log on Today and Workout shows up here.</p>'
    : !shown.length
      ? `<p class="hv-empty"><b>No match${q ? ` for “${esc(q)}”` : ''}</b>Try a shorter word or another filter.<button class="btn secondary hv-clear" data-action="hvClear">Show all entries</button></p>`
      : '';
  const editing = state.editId ? liveEntries(state.entries).find((e) => e.id === state.editId && e.type !== 'study') : null;
  return `<div class="hv-page">${pageHead('All entries', all.length)}
    <div class="hv-search">${ICON.search}<input id="hv-search" type="search" enterkeyhint="search" class="field" maxlength="80" value="${esc(q)}" placeholder="Search entries or dates" aria-label="Search entries" autocomplete="off" data-action="hvSearch"></div>
    <div class="hv-chips" role="group" aria-label="Filter entries">${chips}</div>
    <p class="hv-result" aria-live="polite">${all.length ? (shown.length > MAX_ROWS ? `Showing the newest ${MAX_ROWS} of ${shown.length}. Search to find older ones.` : `${shown.length} of ${all.length} shown`) : ''}</p>
    ${list}${empty}
  </div>${editing ? editSheet({ ...state, hvToday: today }, editing) : ''}`;
}

// ---- Root ----

function lookRow(win, icon, tone, title, meta, extra = '') {
  return `<button class="hv-look" data-action="hvOpen" data-win="${win}" data-tone="${tone}"><span class="hv-ticon" aria-hidden="true">${icon}</span>
    <span class="hv-rmain"><b>${title}</b><small>${meta}</small></span>${extra}${ICON.chev}</button>`;
}

function rootView(state, all, today) {
  const hist = weightHistory(state.entries, state.stats);
  const w = hist[0];
  const wMeta = w ? `${esc(w.weight_lb)} lb, ${esc(gapText(w.weight_lb).replace(/^./, (c) => c.toLowerCase()))}` : 'No weigh-ins yet';
  const streaks = allStreaks(state.entries, state.habits ?? [], today);
  const top = [...streaks].sort((a, b) => b.current - a.current || b.best - a.best)[0];
  const hMeta = top && (top.current || top.best)
    ? `Best streak: ${esc(top.name)}, ${top.current} day${top.current === 1 ? '' : 's'} now${top.best > top.current ? `, best ${top.best}` : ''}`
    : 'No streaks yet';
  const lifts = recentLifts(state.entries, today).map((n) => ({ n, ...liftSummary(state.entries, n, today) }));
  const best = [...lifts].sort((a, b) => (b.delta ?? -Infinity) - (a.delta ?? -Infinity) || b.latest - a.latest)[0];
  const lMeta = !best ? 'No weighted sets in 8 weeks'
    : best.delta == null ? `${esc(best.n)}, est. 1RM ${esc(best.latest)} lb`
      : `${esc(best.n)} ${best.delta >= 0 ? '+' : '−'}${esc(Math.abs(best.delta))} lb in 8 weeks`;
  const waiting = all.filter(isDirty).length;
  const eMeta = `${all.length} entr${all.length === 1 ? 'y' : 'ies'}${all.length ? `, ${waiting} waiting` : ''}`;
  return `<div class="hv-page hv-root">${weekPanel(state, today)}
    <h3 class="hv-sec hv-out">Look closer</h3>
    <div class="hv-looks">
      ${lookRow('weight', ICON.scale, 'a', 'Weight', wMeta, weightSpark(state, today))}
      ${lookRow('habits', ICON.flame, 'b', 'Habits', hMeta)}
      ${lookRow('lifts', ICON.bell, 'c', 'Lift progress', lMeta)}
      ${lookRow('entries', ICON.list, 'a', 'All entries', eMeta, waiting ? `<span class="hv-tag wait">${waiting}</span>` : '')}
    </div></div>`;
}

export function historyView(state, today = logicalDate(Date.now(), state.dayStartHour)) {
  const all = liveEntries(state.entries).sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt - a.updatedAt);
  if (state.histWin === 'lifts') return liftWindow(state, today);
  if (state.histWin === 'weight') return weightPage(state, today);
  if (state.histWin === 'habits') return habitsPage(state, today);
  if (state.histWin === 'entries') return entriesPage(state, all, today);
  return rootView(state, all, today);
}
