// HISTORY v2 actions (pages, All entries search and filter, delete confirm inside the Edit entry sheet).
//   export:  createHistoryActions({ state, today, saveEntries, saveFail })
//   actions: hvOpen (data-win: weight | habits | lifts | entries) | hvSearch (input value) | hvFilter (data-key) | hvClear |
//            hvEditWeigh (data-id: opens All entries with that weigh-in's Edit sheet) | hvAsk (data-id) | hvAskCancel | hvDelete (data-id)
//   state:   histWin, editId (shared with app.js), hvQuery, hvFilter, hvAsk
// The edit itself still runs through app.js startEdit / saveEdit / cancelEdit, which read the same ed-* field ids.

import { deleteEntry } from '../logic/entries.js';

const WINS = ['weight', 'habits', 'lifts', 'entries'];
const FILTERS = ['all', 'waiting', 'weigh', 'lifts'];
const top = () => { try { globalThis.scrollTo?.(0, 0); } catch { /* no window in tests */ } };

export function createHistoryActions({ state, saveEntries, saveFail = (err) => String(err?.message || err) }) {
  return {
    hvOpen: (el) => {
      const win = el.dataset.win;
      if (!WINS.includes(win)) return;
      Object.assign(state, { histWin: win, editId: null, hvAsk: null, msg: '' });
      if (win === 'entries') Object.assign(state, { hvQuery: '', hvFilter: 'all' });
      top();
    },
    hvSearch: (el) => { state.hvQuery = String(el?.value ?? '').slice(0, 80); },
    hvFilter: (el) => { state.hvFilter = FILTERS.includes(el.dataset.key) ? el.dataset.key : 'all'; },
    hvClear: () => { Object.assign(state, { hvQuery: '', hvFilter: 'all' }); },
    hvEditWeigh: (el) => {
      const e = state.entries.find((x) => x.id === el.dataset.id && !x.deletedAt);
      if (!e) return;
      Object.assign(state, { histWin: 'entries', editId: e.id, hvAsk: null, hvQuery: '', hvFilter: 'weigh', msg: '' });
      top();
    },
    hvAsk: (el) => { state.hvAsk = el.dataset.id || null; },
    hvAskCancel: () => { state.hvAsk = null; },
    hvDelete: async (el) => {
      const e = state.entries.find((x) => x.id === el.dataset.id);
      state.hvAsk = null;
      // A habit check is toggled, never deleted: the Dropbox copy would stay "done".
      if (!e || e.deletedAt || e.type === 'habit_check') return;
      const gone = deleteEntry(e, Date.now());
      try { await saveEntries([gone]); } catch (err) { state.msg = saveFail(err); return; }
      state.entries = state.entries.map((x) => (x.id === e.id ? gone : x));
      state.editId = null;
      state.msg = 'Deleted.';
    },
  };
}
