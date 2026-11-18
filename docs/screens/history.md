# History tab

Look back: this week's habits, weight trend, streaks, progress and every entry with edit and delete. Source: `src/ui/historyView.js`, `weekPanel.js`, `progressView.js`, `historyWindows.js`, `recordsView.js`.

## Main screen, top to bottom

1. **Header:** `LIFE LOG · date`, title `HISTORY`.
2. **THIS WEEK panel:** a grid, one row per habit (name left) with seven day cells Monday to Sunday. Header letters `M T W T F S S`, today's letter highlighted. Cells are filled when done and dimmed for future days. Empty state: "No habits yet."
3. **WEIGHT TREND panel:** 28-day line chart (320 x 140): axis min and max labels, a dashed goal line labelled `170 lb goal`, the weight line and a dot per weigh-in (dot tooltip shows date and weight). Note under it: `Latest 172.4 lb, 2.4 above the 170 lb goal.` Empty state: "No weigh-ins in the last 4 weeks."
4. **STREAKS panel:** one row per habit, `Guitar   4 days  best 12`.
5. **HABITS, 5 WEEKS panel:** heatmap of 5 week rows by 7 day cells; each cell has 5 shades (none, some, half, most, all of that day's habits done); future days dimmed.
6. **GOAL 170 LB panel:** one sentence projecting the date you reach 170 lb at the current weekly rate, or a status line ("Weigh in a few more times over a week or more…", "Trend is up…", "Goal reached").
7. **PERSONAL RECORDS row** (row button, caption `lift progress`): opens the Lift progress window.
8. **BODYWEIGHT panel:** the 14 newest weigh-ins as `11-17   172.4 lb  +0.2` with the change from the previous one. Empty state: "No weigh-ins yet."
9. **ALL ENTRIES row** (row button with a count): opens the All entries window.

## Lift progress window (own screen, `< History` back link)

Overline `Personal records`, title `Lift progress`.
- **Hero card (peach):** `BEST ESTIMATED 1RM`, big `185 lb`, caption `Bench, up 10 lb over 8 weeks.` (or "one week logged so far").
- **Lift chips:** one pill per lift with a weighted working set in the last 8 weeks; the picked lift is highlighted.
- **Chart panel:** `ESTIMATED 1RM, 8 WEEKS` with the delta (`+10 lb`) at the right, a 302 x 140 line chart with a big dot at the latest week, and three date labels under it.
- **PERSONAL RECORDS fold:** per lift the top 5 sets by estimated 1RM, then lowest bodyweight, best BPM per guitar focus and longest practice. Weighted calisthenics sets rank by reps. Empty state: "No records yet. Log a working set, a weigh-in or guitar BPM and they appear here."
- Empty state for the whole window: "No weighted working sets in the last 8 weeks."

## All entries window (`< History` back link)

Overline with the count (`240 entries`), title `All entries`. A list of the newest 60 entries, each a row `11-17 <label>` with a `WAITING` or `EXPORTED` tag and small `EDIT` and `DEL` buttons. Habit checks have no `DEL` (toggle them on Today instead, otherwise Dropbox would keep a stale "done"). Footer note when there are more than 60.

**Edit form** (replaces the row in place): the date in bold, fields by type: weigh-in (weight), guitar (minutes, focus, best BPM), meal (type, name, protein), note (title, body), lift set (exercise name, weight, reps or seconds; a calisthenics set keeps its added or assisted type), habit (done checkbox); `SAVE` and `CANCEL`. An edit makes the entry `WAITING` again so it re-exports.

## Design style

- **Charts:** drawn as inline SVG in the same palette: ink line, peach dots and end marker, a dashed hairline for the goal, `#5A5A5F` axis text at 11 to 12 px.
- **Week grid and heatmap:** small rounded squares; filled cells use ink or peach shades, empty cells use the hairline `#E3D6CB`; future cells are faded.
- **Hero (Lift progress):** the same peach card as Today (48 px number).
- **Window chrome:** a text back link `< History`, a small overline and a 28 px title, instead of the big header.
- **Rows:** cream row buttons with chevrons; entry rows are bordered cards with a status tag at the right.
- **Danger:** none; `DEL` is a small secondary button (deletion is soft, a tombstone).
- **Accessibility:** charts and cells have `role="img"` and descriptive `aria-label`s (for example `2026-11-17: 2 of 3 habits half`).

## Reference

| Thing | Where |
|---|---|
| Tab view, entry rows, edit form | `src/ui/historyView.js` |
| Week grid, weight trend, streaks | `src/ui/weekPanel.js`, `src/logic/weekView.js`, `src/logic/streaks.js` |
| Heatmap, goal projection, PR banner | `src/ui/progressView.js`, `src/logic/progress.js` |
| Lift progress window and chart | `src/ui/historyWindows.js` |
| Personal records | `src/ui/recordsView.js`, `src/logic/records.js` |
| Entry edit and delete | `src/logic/entries.js` (`parseEdit`, `editEntry`, `deleteEntry`) |
| Actions | `openHistWin`, `closeHistWin`, `pickLift`, `startEdit`, `saveEdit`, `cancelEdit`, `deleteEntry` |
| Constants | goal weight 170 lb (`GOAL_WEIGHT` in `weekView.js`); 60 rows, 14 weigh-ins shown |
| Backlog items | F10, F11, F19, F39, F40, F43, F49 in `docs/BACKLOG.md` |
