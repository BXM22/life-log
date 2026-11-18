// Actions for the Workout v2 sheets and dropdowns (see workoutSheets.js).
//   wSheetOpen (data-sheet = switch | warm | add, optional data-tab), wSheetClose, wSheetTab (data-tab),
//   wMenuToggle (data-menu = today | exercise), wMenuClose, wEditTemplate, wEditExercise (data-i),
//   wOpenTemplates, wOpenHistory
// State: wSheet (null | 'switch' | 'warm' | 'add'), wSheetTab, wMenu (null | 'today' | 'exercise').
// wSheetOpen('add') also sets state.wAdd = true and wSheetClose sets it false, so addExtraSave (which sets wAdd = false)
// can be turned into "close the sheet" by the integrator: clear wSheet when it sees wAdd false while wSheet === 'add'.

import { activeSessionId } from '../logic/workout.js';

export function createWorkoutSheetActions({ state, today }) {
  state.wSheet = null;
  state.wSheetTab = 'warm';
  state.wMenu = null;

  const activeId = () => activeSessionId(state.wSession, today(), state.planDays);
  const top = () => { try { window.scrollTo(0, 0); } catch { /* no window */ } };

  return {
    wSheetOpen: (el) => {
      state.wMenu = null;
      state.wSheet = el.dataset.sheet;
      if (el.dataset.tab) state.wSheetTab = el.dataset.tab;
      state.wAdd = state.wSheet === 'add';
    },
    wSheetClose: () => { state.wSheet = null; state.wAdd = false; },
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
      state.tWin = true; state.wManage = false; state.wHistory = false; state.tEdit = null;
      state.wMenu = null; state.wSheet = null; state.msg = '';
      top();
    },
    wOpenHistory: () => { state.wHistory = true; state.wManage = false; state.wMenu = null; state.msg = ''; top(); },
  };
}
