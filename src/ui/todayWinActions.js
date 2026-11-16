// Actions that open and close the TODAY windows (F49). app.js merges these into its action table.
// The windows only show existing panels; saving stays in the original actions.
import { normalizeWin, parentWin } from '../logic/todayWin.js';

export function createTodayWinActions({ state }) {
  state.todayWin = null;
  const go = (win) => { state.todayWin = normalizeWin(win); state.msg = ''; window.scrollTo(0, 0); };
  return {
    openTodayWin: (el) => go(el.dataset.win),
    closeTodayWin: () => go(parentWin(state.todayWin)),
    openTimer: () => go('timer'),
  };
}
