// Actions for the Learn window (areas, sessions). app.js merges these into its action table.

import { addArea, updateArea, removeArea, buildLearnEntry, STARTER_AREAS, AREA_TYPES } from '../logic/areas.js';

export function createLearnActions({ state, saveEntries, saveFail, inputValue, today, persistAreas }) {
  const learn = () => {
    if (!state.learn) state.learn = { area: '', type: 'practice', more: false, recent: false, edit: null, draft: null };
    return state.learn;
  };
  const areas = () => (Array.isArray(state.areas) ? state.areas : (state.areas = []));
  const persist = () => { if (typeof persistAreas === 'function') persistAreas(); };

  // The view re-renders after every action, which would clear the form. Copy what is typed into the draft first.
  // A field that is not on screen (More details closed) reads '' and keeps its earlier draft value.
  const keepTyped = () => {
    const l = learn();
    const d = l.draft || {};
    const get = (id, k) => { const v = inputValue(id); return v !== '' ? v : (d[k] ?? ''); };
    l.draft = { minutes: get('learn-min', 'minutes'), metric: get('learn-metric', 'metric'), focus: get('learn-focus', 'focus'), notes: get('learn-notes', 'notes') };
  };

  return {
    // Area chips carry data-area; the drop-down (more than 6 areas) carries value.
    pickArea: (el) => { keepTyped(); const l = learn(); l.area = (el.dataset && el.dataset.area) || el.value; l.draft.metric = ''; }, // the metric belongs to one area
    learnFocus: (el) => { keepTyped(); learn().draft.focus = el.dataset.focus || ''; },
    pickType: (el) => { keepTyped(); if (AREA_TYPES.includes(el.dataset.type)) learn().type = el.dataset.type; },
    learnMin: (el) => { keepTyped(); learn().draft.minutes = el.dataset.min; },

    logSession: async () => {
      const l = learn();
      const list = areas();
      const area = list.find((a) => a.name === l.area) || list[0];
      if (!area) { state.msg = 'Add an area first.'; return; }
      const raw = { minutes: inputValue('learn-min'), metric: inputValue('learn-metric'), focus: inputValue('learn-focus'), notes: inputValue('learn-notes') };
      const r = buildLearnEntry(area, { type: l.type, ...raw }, today(), Date.now());
      if (r.error) { l.draft = raw; state.msg = r.error; return; } // keep what was typed
      try { await saveEntries([r.entry]); } catch (err) { l.draft = raw; state.msg = saveFail(err); return; }
      state.entries.push(r.entry); // save first, mutate after
      l.draft = null;
      state.msg = r.message;
    },

    toggleLearn: (el) => {
      const s = el.dataset.section;
      if (s === 'more' || s === 'recent') { keepTyped(); const l = learn(); l[s] = !l[s]; }
    },

    openAreaEdit: (el) => { learn().edit = { name: el.dataset.area || '' }; },
    closeAreaEdit: () => { learn().edit = null; },

    saveArea: () => {
      const l = learn();
      if (!l.edit) return;
      const g = inputValue('area-goal');
      const fields = { name: inputValue('area-name'), metricLabel: inputValue('area-metric'), weeklyGoal: g === '' || g == null ? null : Number(g) };
      // Renaming does NOT rewrite old entries: history keeps the old area name.
      const r = l.edit.name === '' ? addArea(areas(), fields) : updateArea(areas(), l.edit.name, fields);
      if (r.error) { state.msg = r.error; return; } // stay open
      state.areas = r.list;
      persist();
      l.edit = null;
      state.msg = 'Area saved.';
    },

    deleteArea: (el) => {
      const l = learn();
      const name = el.dataset.area || (l.edit && l.edit.name) || '';
      if (!name) return;
      state.areas = removeArea(areas(), name); // entries are never deleted
      persist();
      if (l.area === name) l.area = state.areas[0] ? state.areas[0].name : '';
      l.edit = null;
      state.msg = 'Area removed.';
    },

    addStarterArea: (el) => {
      const name = el.dataset.area || '';
      const starter = (STARTER_AREAS || []).find((a) => a.name === name) || { name, metricLabel: '', weeklyGoal: null };
      const r = addArea(areas(), starter);
      if (r.error) { state.msg = r.error; return; }
      state.areas = r.list;
      persist();
      state.msg = `Added ${starter.name}.`;
    },
  };
}
