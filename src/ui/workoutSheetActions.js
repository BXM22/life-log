// Actions for the Workout v2 sheets and dropdowns (see workoutSheets.js).
//   wSheetOpen (data-sheet = switch | warm | add, optional data-tab), wSheetClose, wSheetTab (data-tab),
//   wMenuToggle (data-menu = today | exercise), wMenuClose, wEditTemplate, wEditExercise (data-i),
//   wOpenTemplates, wOpenHistory, wSessionPick (data-id, today only), wSessionClear
// State: wSheet (null | 'switch' | 'warm' | 'add'), wSheetTab, wMenu (null | 'today' | 'exercise').
// wSheetOpen('add') also sets state.wAdd = true and wSheetClose sets it false, so addExtraSave (which sets wAdd = false)
// can be turned into "close the sheet" by the integrator: clear wSheet when it sees wAdd false while wSheet === 'add'.

import { activeSessionId, expireSessionPick, pickedFor } from '../logic/workout.js';

export function createWorkoutSheetActions({ state, today }) {
  state.wSheet = null;
  state.wSheetTab = 'warm';
  state.wMenu = null;

  const activeId = () => activeSessionId(pickedFor(state, today()), today(), state.planDays);
  const top = () => { try { window.scrollTo(0, 0); } catch { /* no window */ } };

  return {
    // Switch sheet row: today-only override. Stored active template and the rest of the week are untouched.
    wSessionPick: (el) => {
      const id = el.dataset.id;
      if (!id) return;
      state.wSession = id; state.wSessionDay = today(); state.wSheet = null; state.msg = '';
    },
    wSessionClear: () => { state.wSession = null; state.wSessionDay = null; state.msg = ''; },
    wSheetOpen: (el) => {
      expireSessionPick(state, today());
      state.wMenu = null;
      state.wSheet = el.dataset.sheet;
      if (el.dataset.tab) state.wSheetTab = el.dataset.tab;
      state.wAdd = state.wSheet === 'add';
      state.wXEdit = null; // opening Add for today is always a fresh add, never an edit
    },
    wSheetClose: () => { state.wSheet = null; state.wAdd = false; state.wAct = null; state.wActForm = null; state.wXEdit = null; },
    wSheetTab: (el) => { state.wSheetTab = el.dataset.tab; },
    wMenuToggle: (el) => { state.wMenu = state.wMenu === el.dataset.menu ? null : el.dataset.menu; },
    wMenuClose: () => { state.wMenu = null; },
    wEditTemplate: () => {
      const id = activeId();
      state.tScreen = id; state.wSession = id; state.tEdit = null; state.tplDraft = null;
      state.wMenu = null; state.msg = '';
      top();
    },
    wEditExercise: (el) => {
      const id = activeId();
      state.tScreen = id; state.wSession = id; state.tplDraft = null;
      state.tEdit = { mode: 'edit', i: Number(el.dataset.i) };
      state.wEx = null; state.wMenu = null; state.msg = '';
      top();
    },
    wOpenTemplates: () => {
      state.tWin = true; state.wHistory = false; state.tEdit = null;
      state.wMenu = null; state.wSheet = null; state.msg = '';
      top();
    },
    wOpenHistory: () => { state.wHistory = true; state.wMenu = null; state.msg = ''; top(); },
  };
}
