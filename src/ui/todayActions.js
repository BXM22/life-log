// Actions for the TODAY extras: quick add sheet (F36) and collapsible sections (F43). app.js merges
// these into its action table. State used: state.quick, state.sections, state.todaySections.

import { buildQuickEntry, QUICK_FIELDS, NEW_AREA } from '../logic/quickAdd.js';
import { addArea } from '../logic/areas.js';

export function createTodayActions({ state, saveEntries, saveFail, inputValue, today, persistAreas }) {
  const readQuick = (kind) => Object.fromEntries(QUICK_FIELDS[kind].map((f) => [f.key, inputValue(`qa-${f.key}`)]));
  // Values of the fields currently on screen, merged over the saved draft (closed sections keep theirs).
  const keepQuick = (q) => ({
    ...(q.draft || {}),
    ...Object.fromEntries(QUICK_FIELDS[q.kind].filter((f) => document.getElementById(`qa-${f.key}`)).map((f) => [f.key, inputValue(`qa-${f.key}`)])),
    ...(document.getElementById('qa-newarea') ? { newarea: inputValue('qa-newarea') } : {}), // survives switching the area back and forth
  });
  return {
    toggleSection: (el) => {
      const k = el.dataset.section;
      if (k === 'habits' || k === 'recent') { // Today v2 drop-downs, session only
        const cur = state.todaySections || { habits: true, recent: false };
        state.todaySections = { ...cur, [k]: !cur[k] };
        return;
      }
      state.sections = { ...(state.sections || {}), [k]: !(state.sections || {})[k] };
    },

    openQuick: () => { state.quick = { kind: 'weight', draft: {} }; state.msg = ''; },
    closeQuick: () => { state.quick = null; },
    quickKind: (el) => { state.quick = { kind: el.dataset.kind, draft: {} }; },
    // Session form helpers: keep what is typed, then change one thing and re-render.
    quickArea: (el) => { const q = state.quick; if (q) { q.draft = { ...keepQuick(q), area: el.value, metric: '' }; } },
    quickMin: (el) => { const q = state.quick; if (q) q.draft = { ...keepQuick(q), minutes: el.dataset.min }; },
    quickType: (el) => { const q = state.quick; if (q) q.draft = { ...keepQuick(q), type: el.dataset.type }; },
    quickMore: () => { const q = state.quick; if (q) { q.draft = keepQuick(q); q.more = !q.more; } },
    saveQuick: async () => {
      const q = state.quick;
      if (!q) return;
      const raw = readQuick(q.kind);
      let added = null; // { list } when a new area is created with this session
      if (q.kind === 'session' && raw.area === NEW_AREA) {
        raw.newarea = inputValue('qa-newarea');
        raw.metric = ''; raw.metricLabel = '';
        const a = addArea(state.areas || [], { name: raw.newarea, metricLabel: '', weeklyGoal: null });
        if (a.error) { q.draft = raw; state.msg = a.error; return; }
        added = a;
      }
      const r = added ? buildQuickEntry(q.kind, { ...raw, area: added.list[added.list.length - 1].name }, today(), Date.now(), new Date().getHours()) : buildQuickEntry(q.kind, raw, today(), Date.now(), new Date().getHours());
      if (r.error) { q.draft = raw; state.msg = r.error; return; } // keep what was typed
      if (added) { // the area is kept even if the entry then fails to save (harmless)
        state.areas = added.list;
        if (typeof persistAreas === 'function') persistAreas();
      }
      try { await saveEntries([r.entry]); } catch (err) { q.draft = added ? { ...raw, area: r.entry.data.area } : raw; state.msg = saveFail(err); return; } // retry then picks the now existing area
      state.entries.push(r.entry);
      state.quick = null;
      state.msg = r.message;
    },
  };
}
