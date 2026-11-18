// Actions for the Workout Activities card and sheets (workoutActivities.js).
//   aOpen (data-id) | aToggleDone | aSaveDist | aAddSet | aDelSet (data-i) | aManage | aNew | aEdit (data-id) | aFormBack | aSave | aRemove (data-id)
// State: activities (list), wAct (id open in the log sheet), wActForm (null | { id|null }), wSheet = 'activity' | 'actmgr'.

import { addActivity, updateActivity, removeActivity, loadActivities, saveActivities, findActivity, activityLog,
  applyActivityChange, parseDistance, parseReps } from '../logic/activities.js';

export function createActivityActions({ state, saveEntries, saveFail, inputValue, today }) {
  state.activities = loadActivities(localStorage);
  state.wAct = null;
  state.wActForm = null;

  const commit = (list, msg) => { state.activities = list; saveActivities(localStorage, list); state.msg = msg; };
  const open = () => findActivity(state.activities, state.wAct);
  const readForm = () => {
    const el = (id) => document.getElementById(id);
    return {
      name: el('ac-name')?.value,
      days: [0, 1, 2, 3, 4, 5, 6].filter((d) => el(`ac-d${d}`)?.checked),
      done: Boolean(el('ac-done')?.checked), distance: Boolean(el('ac-distance')?.checked), sets: Boolean(el('ac-sets')?.checked),
      unit: el('ac-unit')?.value,
    };
  };
  async function change(a, fields, msg) {
    const e = applyActivityChange(state.entries, a, today(), fields, Date.now());
    try { await saveEntries([e]); } catch (err) { state.msg = saveFail(err); return; }
    const i = state.entries.findIndex((x) => x.id === e.id);
    if (i >= 0) state.entries[i] = e; else state.entries.push(e);
    state.msg = msg;
  }

  return {
    aOpen: (el) => { state.wAct = el.dataset.id; state.wSheet = 'activity'; state.wMenu = null; state.msg = ''; },
    aToggleDone: async () => {
      const a = open(); if (!a) return;
      const now = !activityLog(state.entries, a, today()).done;
      await change(a, { done: now }, now ? `${a.name} marked done.` : `${a.name} unmarked.`);
    },
    aSaveDist: async () => {
      const a = open(); if (!a) return;
      const r = parseDistance(inputValue('ac-dist'));
      if (r.error) { state.msg = r.error; return; }
      await change(a, { distance: r.value }, r.value == null ? 'Distance cleared.' : `Saved ${r.value} ${a.unit}.`);
    },
    aAddSet: async () => {
      const a = open(); if (!a) return;
      const r = parseReps(inputValue('ac-reps'));
      if (r.error) { state.msg = r.error; return; }
      const sets = [...activityLog(state.entries, a, today()).sets, r.value];
      await change(a, { sets }, `Set ${sets.length} saved: ${r.value} reps.`);
    },
    aDelSet: async (el) => {
      const a = open(); if (!a) return;
      const sets = activityLog(state.entries, a, today()).sets.filter((_, i) => i !== Number(el.dataset.i));
      await change(a, { sets }, 'Set removed.');
    },
    aManage: () => { state.wSheet = 'actmgr'; state.wActForm = null; state.wMenu = null; state.msg = ''; },
    aNew: () => { state.wSheet = 'actmgr'; state.wActForm = { id: null }; state.wMenu = null; state.msg = ''; },
    aEdit: (el) => { state.wActForm = { id: el.dataset.id }; state.msg = ''; },
    aFormBack: () => { state.wActForm = null; state.msg = ''; },
    aSave: () => {
      const f = state.wActForm; if (!f) return;
      const raw = readForm();
      const r = f.id ? updateActivity(state.activities, f.id, raw) : addActivity(state.activities, raw);
      if (r.error) { state.msg = r.error; return; }
      commit(r.list, f.id ? 'Activity saved.' : `Added ${raw.name.trim()}.`);
      state.wActForm = null;
    },
    aRemove: (el) => {
      const a = findActivity(state.activities, el.dataset.id); if (!a) return;
      if (!window.confirm(`Remove ${a.name}? Logs you already saved stay in your history.`)) return;
      commit(removeActivity(state.activities, a.id), `Removed ${a.name}.`);
      state.wActForm = null;
    },
  };
}
