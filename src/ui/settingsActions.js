// Settings v2 actions: sub-pages, the New day sheet and the rest default length.
// app.js spreads these into its action table. Existing actions (setTheme, setKeep, setPlanDays,
// setExportReminder, setAutoSync, restAuto, openDropbox, disconnect) are reused from the view as they are.
//
// state fields (all start null):
//   stPage     null | 'rest' | 'dropbox'   sub-page shown on the Settings tab
//   stSheet    null | 'dayStart'           bottom sheet open on the Settings tab
//   stDayPick  hour picked in the sheet, saved only on Use

import { DAY_START_OPTIONS, saveSettings } from '../logic/settings.js';
import { clampRest, saveRest } from '../logic/rest.js';

const PAGES = ['rest', 'dropbox'];
const top = () => { try { window.scrollTo(0, 0); } catch { /* not in a browser */ } };
const store = () => { try { return localStorage; } catch { return null; } };

/** persist: app.js persistSettings. Without it, the four settings are saved straight to lifelog.settings. */
export function createSettingsActions({ state, persist }) {
  const saveDay = persist || (() => {
    const s = store();
    if (s) saveSettings(s, { keepDays: state.keepDays, dayStartHour: state.dayStartHour, planDays: state.planDays, theme: state.theme });
  });
  return {
    // Works from any tab: data-page="rest" | "dropbox" opens that page, no data-page opens the Settings root.
    stOpen: (el) => {
      const p = el.dataset.page;
      state.tab = 'settings'; state.svPage = null; state.stPage = PAGES.includes(p) ? p : null; state.stSheet = null; state.syncModal = null; state.wipeTick = false; state.msg = '';
      top();
    },
    stBack: () => { state.stPage = null; state.stSheet = null; state.syncModal = null; top(); },

    // New day starts at: row tap only selects, Use saves, Cancel closes.
    stDayOpen: () => { state.stSheet = 'dayStart'; state.stDayPick = state.dayStartHour; },
    stDayPick: (el) => { const h = Number(el.dataset.h); if (DAY_START_OPTIONS.includes(h)) state.stDayPick = h; },
    stDayUse: () => {
      const h = state.stDayPick;
      if (DAY_START_OPTIONS.includes(h) && h !== state.dayStartHour) { state.dayStartHour = h; saveDay(); }
      state.stSheet = null; state.stDayPick = null;
    },
    stSheetClose: () => { state.stSheet = null; state.stDayPick = null; },

    // Rest timer default length (the same rest.seconds the rest page wheel sets). A running timer keeps its end time.
    stRestLen: (el) => {
      if (!state.rest) return;
      state.rest.seconds = clampRest(el.dataset.s);
      const s = store();
      if (s) saveRest(s, state.rest);
    },
    // Custom: open the rest page wheel on the Workout tab.
    stRestCustom: () => { state.stPage = null; state.stSheet = null; state.tab = 'workout'; state.restOpen = true; top(); },

    stGoSync: () => { state.stPage = null; state.stSheet = null; state.syncModal = null; state.tab = 'export'; top(); },
  };
}
