// Switch today's workout v2 and Quick workout (F72, docs/screens/workout.md).
//   actions: wSwitchTo (data-id, one tap, offers Undo), wSwitchUndo, wQuickLabel (data-label), wQuickStart, wSaveQuick
//   state:   wSession / wSessionDay (today-only pick, shared with workoutSheetActions.js), wQuickLabel (chip key or null),
//            undo ({ msg, action: 'wSwitchUndo', prev } while the toast shows; app.js runs undo.action)

import { getSessions, setTemplate, sessionById, quickId, isQuickId, QUICK_LABELS } from '../logic/template.js';
import { activeSessionId, pickedFor } from '../logic/workout.js';
import { extrasFor, saveExtras } from '../logic/extras.js';
import { sessionFromExtras } from '../logic/templateEdit.js';

const store = () => { try { return localStorage; } catch { return null; } };
const top = () => { try { window.scrollTo(0, 0); } catch { /* no window */ } };

export function createQuickWorkoutActions({ state, today, saveTemplate, saveFail }) {
  state.wQuickLabel = null;
  const prevPick = () => ({ session: state.wSession ?? null, day: state.wSessionDay ?? null });
  const closeSheet = () => { state.wSheet = null; state.wSheetPick = null; state.wMenu = null; };

  return {
    // Template card tap: switch today right away, keep the old pick for Undo.
    wSwitchTo: (el) => {
      const id = el.dataset.id;
      const s = sessionById(id);
      if (!s) return;
      const prev = prevPick();
      state.wSession = id; state.wSessionDay = today();
      closeSheet();
      state.msg = `Switched to ${s.name}`;
      state.undo = { msg: state.msg, action: 'wSwitchUndo', prev };
    },
    wSwitchUndo: () => {
      const prev = state.undo?.prev;
      state.undo = null;
      state.msg = '';
      if (!prev) return;
      state.wSession = prev.session; state.wSessionDay = prev.day;
    },

    wQuickLabel: (el) => {
      const k = el.dataset.label;
      state.wQuickLabel = QUICK_LABELS[k] && state.wQuickLabel !== k ? k : null;
    },
    // Start an empty session for today and open Add exercise on the Workout tab.
    wQuickStart: () => {
      const prev = prevPick();
      state.wSession = quickId(state.wQuickLabel); state.wSessionDay = today();
      state.wQuickLabel = null;
      closeSheet();
      Object.assign(state, { tab: 'workout', todayWin: null, restOpen: false, libWin: false, tWin: false, tScreen: null, wHistory: false, wEx: null });
      state.wSheet = 'add'; state.wAdd = true; state.wXEdit = null;
      state.msg = 'Quick workout started';
      state.undo = { msg: state.msg, action: 'wSwitchUndo', prev };
      top();
    },

    // Turn today's quick workout into a template and make it today's pick.
    wSaveQuick: async () => {
      state.wMenu = null;
      const day = today();
      const id = activeSessionId(pickedFor(state, day), day, state.planDays);
      if (!isQuickId(id)) { state.msg = 'Only a quick workout can be saved this way.'; return; }
      const extras = extrasFor(state.wExtras, day);
      const r = sessionFromExtras(getSessions(), sessionById(id).name.replace(/^Quick: /, ''), extras);
      if (r.error) { state.msg = r.error; return; }
      try { await saveTemplate(r.sessions); } catch (err) { state.msg = saveFail(err); return; }
      setTemplate(r.sessions);
      state.wExtras = { day, list: [] }; // the exercises now live in the template
      const s = store();
      if (s) saveExtras(s, state.wExtras);
      state.wSession = r.id; state.wSessionDay = day;
      state.msg = `Saved as template: ${sessionById(r.id).name}`;
    },
  };
}
