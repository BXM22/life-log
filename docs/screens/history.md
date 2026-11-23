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

## Workout redesign impact (planned, not built)

Status: **planned.** From Workout v2/v3 (`workout.md`) and weekly plans (F66).

- **Two history views overlap.** Workout has its own History page (v2) with search and filter chips (v3, board 21). This tab already has `All entries` and `Lift progress`. Keep this tab as the cross-habit view. Workout's page is the per-session view, with a `See all entries` link back to `All entries` filtered to lift sets. Do not add a third list.
- **Past sessions keep their template.** Editing a template or plan later must not rewrite old sessions. Store the template name and exercise list with each session, or have edits apply from today forward (already on the F66 Decide-first list). This tab and Workout history both read it.
- **Lift progress chips and Personal records** keep reading `lift_set` entries. Renamed or removed exercises still need a chip while they have sets in the last 8 weeks.
- **F66 History grid:** a planned-versus-done grid (`Not logged` with `Log it` and `Skip`, never affecting streaks) belongs on this tab's week grid. Mock-up: SPEC F66.
- **Edit form for lift sets** is unchanged. Workout's `Fill all as` (board 15) writes ordinary `lift_set` entries, so they appear here as separate rows.
- **Tab bar space:** same 72 px reserved strip as Workout if it becomes global.

## v2 update (redesign, planned, not built)

Mock-ups: Design canvas "Life Log Settings, History and Sync v2" (https://claude.ai/artifact/Uwig18H7bxcS54s1u1W4zC), History row, 7 phone boards, playable. The root becomes one card and four rows. Detail moves to pages, edit moves to a sheet.

### Screens

1. **History (root):** title; `This week` card (grid of five habits by seven days, today's letter in an ink pill; done = peach check; empty = outline; future = flat; **planned but not logged = dashed ring, tappable**); then `Look closer` rows: `Weight` (latest, goal gap, sparkline), `Habits` (best streak), `Lift progress` (best lift change), `All entries` (count and how many are waiting).
2. **Workout was not logged (sheet):** names the planned session and day; `Log it`, `Skip this day`, `Cancel`. Skipping never breaks a streak.
3. **Weight (page):** peach hero with the latest weigh-in and goal gap, 28-day chart with the dashed goal line, a soft peach projection line ("At this pace you reach 170 lb around Jan 12."), `Recent weigh-ins` list with the change from the previous one.
4. **Habits (page):** `Streaks` list (current and best) and `Last 5 weeks` heatmap with five shades and a legend.
5. **Lift progress (page):** peach hero (best estimated 1RM), lift chips, 8-week chart, `Personal records` rows.
6. **All entries (page):** search field, filter chips (All, Waiting, Weigh-ins, Lifts), rows grouped by day with a Waiting or Exported tag. Habit checks have no delete, as before.
7. **Edit entry (sheet over All entries):** stepper form by entry type, `Save changes`, `Cancel`, `Delete entry`. Saving marks the entry Waiting again.

### Wiring

| From | Tap | Goes to |
|---|---|---|
| History | Dashed ring (planned, not logged) | Workout was not logged (sheet) |
| Not logged sheet | Log it | Workout tab for that date; the cell becomes a check (not on this canvas) |
| Not logged sheet | Skip this day | History; the cell shows a skipped state, streaks unchanged |
| History | Weight, Habits, Lift progress, All entries | the matching page |
| Any page | back arrow | History |
| Weight | a weigh-in row | All entries, to edit it |
| All entries | any row | Edit entry (sheet) |
| Edit entry | Save changes, Cancel, Delete entry | All entries (Delete may need a confirm step, see open questions) |
| Any tab icon | tap | that tab's root |

### Build notes

- Views and routing only. Data stays as `lift_set`, habit and weigh-in entries. The planned-vs-done state needs the F66 plan and the history of which template each session used; without it the dashed ring is not drawn.
- The in-place edit form is replaced by the sheet. `startEdit`, `saveEdit`, `cancelEdit` keep their names; add `openHistWin` targets for the new pages. Workout's own history page links here with `See all entries` instead of duplicating the list.
- Open questions: does Delete need a confirm step; whether the Habits heatmap and streaks should merge into the week card later; whether `Skip this day` is stored (needed so the ring stays gone).

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
