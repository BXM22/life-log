// PERSONAL RECORDS panel on the HISTORY tab: top 5 per list, built from current entries plus the
// records kept through wipes. Read-only; each list is a native <details>.
//   html: recordsPanel(state)

import { mergeRecords, emptyRecords } from '../logic/records.js';
import { esc } from './format.js';

function list(title, rows) {
  if (!rows?.length) return '';
  const items = rows.map((r, i) => `<div class="row"><span>${i + 1}. ${esc(r.text)}${r.unit === '1RM' ? ` <small>1RM ${esc(r.value)}</small>` : ''}</span><span>${esc(r.date.slice(5))}</span></div>`).join('');
  return `<details class="entry"><summary>${esc(title)} <small>${esc(rows[0].text)}</small></summary>${items}</details>`;
}

export function recordsPanel(state) {
  const rec = { ...emptyRecords(), ...mergeRecords(state.stats?.records, state.entries) };
  const blocks = [
    ...Object.entries(rec.lifts).map(([name, rows]) => list(name, rows)),
    list('Bodyweight (lowest)', rec.bodyweight),
    ...Object.entries(rec.guitar).map(([name, rows]) => list(`Guitar: ${name}`, rows)),
    list('Longest practice', rec.session),
  ].join('');
  return `<div class="panel"><h2>PERSONAL RECORDS</h2>${blocks || '<p class="note">No records yet. Log a working set, a weigh-in or guitar BPM and they appear here.</p>'}</div>`;
}
