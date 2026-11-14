// KUMIO PREP AND STUDY panel on the TODAY tab (F16).
//   html:    studyPanel(state, day)
//   actions: data-action="logStudy" (see studyActions.js)

import { liveEntries } from '../logic/entries.js';
import { STUDY_KINDS, dayStudyMinutes, studyLine } from '../logic/study.js';
import { esc } from './format.js';

export function studyPanel(state, day) {
  const draft = state.studyDraft || { topic: '', minutes: '', notes: '' }; // kept when a save is refused
  const options = STUDY_KINDS.map((k) => `<option value="${k}" ${k === (draft.kind || 'study') ? 'selected' : ''}>${k}</option>`).join('');
  const rows = liveEntries(state.entries).filter((e) => e.type === 'study')
    .sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt - a.updatedAt).slice(0, 5)
    .map((e) => `<div class="row"><span>${esc(e.date.slice(5))}</span><span>${esc(studyLine(e))}</span></div>`).join('');
  return `<div class="panel">
    <h2>KUMIO</h2>
    <p>Today <b>${dayStudyMinutes(state.entries, day)}</b> min</p>
    ${rows || '<p class="note">No prep or study logged yet.</p>'}
    <label class="lbl" for="study-kind">Type</label>
    <select id="study-kind" class="field" aria-label="Prep or study">${options}</select>
    <label class="lbl" for="study-topic">Topic</label>
    <input id="study-topic" class="field" maxlength="60" placeholder="Contracts, chapter 3" autocomplete="off" value="${esc(draft.topic)}">
    <label class="lbl" for="study-min">Minutes</label>
    <input id="study-min" class="field" type="number" inputmode="numeric" step="1" placeholder="45" value="${esc(draft.minutes)}">
    <label class="lbl" for="study-notes">Notes (optional)</label>
    <input id="study-notes" class="field" maxlength="500" autocomplete="off" value="${esc(draft.notes)}">
    <button class="btn" data-action="logStudy">SAVE STUDY</button>
  </div>`;
}
