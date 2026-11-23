// PERSONAL RECORDS on the Lift progress page: top 5 per list, built from current entries plus the
// records kept through wipes. Read-only; each list is a native <details> card (best result in the summary).
//   html: recordsPanel(state)
// Styles: src/styles/w3-history.css (.hv-rec*).

import { mergeRecords, emptyRecords } from '../logic/records.js';
import { esc } from './format.js';

const shortDate = (d) => new Date(`${d}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

function list(title, rows) {
  if (!rows?.length) return '';
  const items = rows.map((r, i) => `<li class="hv-recrow"><span class="hv-rank" aria-label="Rank ${i + 1}">${i + 1}</span>
    <span class="hv-rmain"><b>${esc(r.text)}</b>${r.unit === '1RM' ? `<small>Est. 1RM ${esc(r.value)} lb</small>` : ''}</span>
    <span class="hv-recdate">${esc(shortDate(r.date))}</span></li>`).join('');
  return `<details class="hv-rec"><summary><span class="hv-rmain"><b>${esc(title)}</b><small>Best ${esc(rows[0].text)}</small></span>
    <span class="hv-tag plain">${rows.length}</span><span class="hv-fold" aria-hidden="true"></span></summary><ol>${items}</ol></details>`;
}

export function recordsPanel(state) {
  const rec = { ...emptyRecords(), ...mergeRecords(state.stats?.records, state.entries) };
  const blocks = [
    ...Object.entries(rec.lifts).map(([name, rows]) => list(name, rows)),
    list('Bodyweight (lowest)', rec.bodyweight),
    ...Object.entries(rec.guitar).map(([name, rows]) => list(`Guitar: ${name}`, rows)),
    list('Longest practice', rec.session),
  ].filter(Boolean);
  return `<h3 class="hv-sec hv-out">Personal records${blocks.length ? `<span class="hv-count">${blocks.length}</span>` : ''}</h3>
    ${blocks.join('') || '<p class="hv-empty"><b>No records yet</b>Log a working set, a weigh-in or guitar BPM and they appear here.</p>'}`;
}
