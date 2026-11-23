// WORKOUT tab (v2): a short Today list, an Exercise page per lift, and pages for rest timer, templates, edit template and history.
//   html:    workoutView(state)
// Routing, highest priority first: Edit template (tScreen), Templates (tWin), History (wHistory), Exercise page (wEx), Today list.
// The rest timer page itself is drawn by app.js render() when state.restOpen is set. Sheets and dropdown menus
// (position: fixed) are appended after the page. See docs/screens/workout.md.

import { templatesWindow, editScreen } from './templateTagsView.js';
import { workoutHistoryView } from './workoutHistoryView.js';
import { todayPage } from './workoutToday.js';
import { exercisePage } from './workoutExercise.js';
import { libraryWindow } from './libraryWindow.js';
import { menuLayer, sheetLayer } from './workoutSheets.js';

export function workoutView(state) {
  if (state.tScreen) return editScreen(state);
  if (state.libWin) return libraryWindow(state);
  if (state.tWin) return templatesWindow(state);
  if (state.wHistory) return workoutHistoryView(state);
  const page = state.wEx != null ? exercisePage(state) : todayPage(state);
  // Today carries its rest pill in the header and Exercise a chip in the logging card, so no fixed rest bar.
  return `${page}${menuLayer(state)}${sheetLayer(state)}`;
}
