// TODAY tab windows (F49): Log (weigh-in, meals), Learn (areas) and Notes.
// Views over existing state and actions; saving is done by the Log, Learn and Notes actions.
//   html:    todayWindow(state, day)
//   actions: openTodayWin | closeTodayWin (see todayWinActions.js)

import { logWindow } from './logWindow.js';
import { notesWindow } from './notesWindow.js';
import { learnView } from './learnView.js';

export function todayWindow(state, day) {
  if (state.todayWin === 'log') return logWindow(state, day);
  if (state.todayWin === 'learn') return learnView(state, day);
  if (state.todayWin === 'notes') return notesWindow(state);
  return '';
}
