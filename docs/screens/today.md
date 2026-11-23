# Today tab (v2)

Status: **built** (backlog F60, all five steps, 2026-11-19; polish pass F65 built 2026-11-22, see "Main screen" below). Mock-ups are on the Design canvas "Life Log Today v2". The v1 layout is in git history (last v1 edit 2026-11-17).

Not built from the original design: the Learn window's *Type* chips apply to non-Guitar areas only (a Guitar session ignores the type); Log window's "Guitar timer moved to Learn" row is still there (remove it after one release).

## Today polish, direction A (F65)

Status: **built 2026-11-22.** Chosen 2026-11-21 from three mock-ups (A Tidy, B Day list, C Next up) on the Design canvas "Life Log Today v2", board "A Tidy: same parts, clearer". Not yet checked by eye on a phone in light and dark.

### Why

Review of the live screen (2026-11-21, 390 x 844):

- Habits, the most frequent action, start below the fold; the first screen is status and the workout card.
- The habit count shows twice (hero `2/3` and `HABITS · 2 OF 3`).
- Sync shows three times (chip, Sync row, storage note) and the chip and row can disagree (`Export due` next to `Everything exported`).
- Six peach elements on the first screen, with two peach buttons (`SYNC NOW`, `START WORKOUT`) competing.
- Eight all-caps 12 px labels in two patterns (caption above vs inline `SYNC`).
- 18 font sizes across the CSS, down to 9 and 10 px; the workout name (17 px) is smaller than its button text.
- Empty rows are dead ends ("Nothing logged yet"); row chevrons are a typed `>` while drop-downs use an icon; the `+` button covers the first habit's streak badge.

### Main screen, top to bottom

1. **Header:** date line `Saturday, November 21` (13/18, weight 500, muted; no `LIFE LOG ·` prefix, no caps) over the title `Today` (28/34, weight 800, -0.02em). Sync chip on the right, same states as now: `2 to export`, `Synced`, `Export due`.
2. **Habits hero (peach):** heading `2 of 3 habits done` (22/28, weight 800), then the habit checklist inside the card. This replaces both the big `2/3` with pips and the Habits drop-down, so habits are on the first screen and counted once.
   - Each habit is a white 52 px row: a 26 px round check (ink fill with a white tick when done, 2 px `#8C817A` ring when not), name (15, weight 700), streak as text on the right (`14 days`, 13, weight 600, muted) instead of the `4d` pill.
   - The Workout habit reads `After your workout` while it is undone and a workout is scheduled.
   - `Manage habits` link row with a chevron icon at the bottom opens the Manage habits sheet.
   - Empty state: "No habits yet." and the `Manage habits` row.
3. **Workout card (cream):** `Today's workout` (13, weight 600, muted), session name (22/28, weight 800), focus line (15, weight 500, muted).
   - **Switch** button at the top right (secondary 44 px pill, swap icon, label `Switch`). It opens the existing **Switch template** sheet from the Workout tab (`wSheetOpen` with `data-sheet="switch"`, rows pick with `tplPick`), so Today and Workout share one override (`state.wSession`). After a switch the card shows `Switched from Upper B` with an `Undo` text button that clears the override.
   - Sheet tweaks for this use: title `Switch today's workout`, a `Planned` tag on the scheduled session, each row's focus line under the name, and one muted line "Only today changes. The rest of your week stays as planned."
   - Buttons on one row: primary `Start workout` (fills the row) and secondary `Rest day` (becomes `Undo rest day`; hidden once a real workout is checked).
   - Free day: "No lifting scheduled. BJJ, rest or a walk." with primary `Pick a workout`, which opens the same sheet.
4. **Sync notice** (only when entries are waiting or storage is unprotected): a hairline-bordered row with no fill. First line `2 entries waiting to export` (15, weight 700); second line the storage hint ("Storage isn't protected. Add the app to your Home Screen.") or `Last export 8 days ago` (13, muted); secondary `Sync now` button on the right. Replaces the Sync row and the separate storage note. Hidden when nothing is waiting and storage is protected; the chip still shows status.
5. **Log, Learn and Notes:** one cream panel with three 64 px rows split by hairlines (instead of three separate cards). Each row: title (17, weight 700) over a summary (13, weight 500, muted) and a chevron icon.
   - Empty summaries say what to do: `Add today's weight and meals`, `Start a practice or study session`, `Write down an idea`.
   - With data: `182.4 lb, 85 of 160 g protein`, `45 min today: Guitar, Coding`, `2 notes waiting for the vault`; while a timer runs, `Timer running: Guitar 12:41`.
6. **Recent entries:** a plain row, no panel: `Recent entries` (17, weight 700), the count (15, weight 500, muted) and a chevron; opens as now. When there are no entries at all, it shows "No entries yet." and a secondary `Load demo data` button instead.
7. **Quick add `+`:** unchanged, but the page gets 72 px of bottom padding so the button never covers a row.

### Type scale (start on Today, then roll out app-wide)

One family, Plus Jakarta Sans (already loaded). Nothing under 13 px.

| Token | Size / line | Weight | Used for |
|---|---|---|---|
| `--fs-meta` | 13 / 18 | 500 (600 for small labels) | Dates, streaks, summaries, notes, tab labels, status tags |
| `--fs-body` | 15 / 20 to 22 | 500 to 700 | Row titles, habit names, buttons |
| `--fs-head` | 17 / 22 | 700 | Section and row headings (Log, Recent entries) |
| `--fs-card` | 22 / 28 | 800, -0.01em | Card titles (habits heading, workout name, sheet titles) |
| `--fs-title` | 28 / 34 | 800, -0.02em | Page title |
| `--fs-num` | 48 / 52 | 800, -0.02em, tabular figures | Timer clock and other big numbers |

Rules: sentence case for headings, labels and buttons (`Start workout`, `Sync now`, `Rest day`); no all-caps overlines; no meta joined with `·`. Put the tokens in `forma.css` `:root` and replace the 18 current sizes; the 9, 10, 11 and 12 px uses move up to 13.

### Design changes

- **Peach** only on the habits hero, `Start workout` and the `+` button. The sync chip stays soft peach; the sync notice and `Sync now` are neutral.
- **Fewer boxes:** hero, workout card and one Log/Learn/Notes panel; the sync notice is outlined, Recent has no panel.
- **Chevrons:** the SVG chevron everywhere, never a typed `>`.
- **Unticked check ring:** `#8C817A`, which passes 3:1 against white.
- **Status tags** go from 12 to 13 px.

### Built notes (2026-11-22)

- **Switch is today only.** The sheet rows run `wSessionPick`, which sets `state.wSession` and `state.wSessionDay` (not the stored template). `pickedFor` ignores a pick from another day and `expireSessionPick` (run on every tab change) clears it, so the override resets at the day start. `wSessionClear` is the Undo; `switchedFrom(state)` gives the `Switched from X` text. The sheet opens over Today with `sheetLayer`. The Workout tab's sheet is now today-only too.
- **Start workout** runs `startWorkout` (`todayActions.js`): opens the Workout tab on the first unfinished exercise, the same target as Next up (`currentIndex` in `workoutToday.js`).
- **Sync notice** comes from `syncNotice({pending, lastExportAt, storageProtected, now})` in `syncStatus.js`; the chip uses the same pending count so the two never disagree. The Sync row (`syncRowHtml`) is deleted.
- **Header** (`app.js`): Today shows the full date line with no prefix; other tabs still use `LIFE LOG · DATE`.
- **Dark mode:** the habits hero stays peach in both modes, so its rows use fixed colors (`--hero-ink`, `--hero-dim`, `--hero-row`, `--hero-ring` in `today.css`). Everything else on Today uses the theme tokens.
- **Colors:** the lavender, mint, butter and charcoal palette (F69, see the Color palette section of `workout.md`), applied through `forma.css`. The habits hero is lavender with charcoal text in both light and dark, so its rows use fixed `--hero-*` colors.
- Line-height tokens `--lh-*` exist but are only used in `today.css`.

### Code touchpoints

| Change | Files |
|---|---|
| New layout, habits inside hero, one rows panel, Recent row | `src/ui/todayView.js`, `src/styles/today.css` |
| Type tokens, sentence-case headings (drop the caps `h2` overline rule) | `src/styles/forma.css`, `main.css` |
| Sync notice visibility, chip copy | `src/logic/syncStatus.js`, `src/ui/syncChip.js` |
| Switch button and free-day `Pick a workout` open the Switch sheet on Today; `Planned` tag, focus line, title | `src/ui/workoutSheets.js`, `src/ui/workoutSheetActions.js`, `src/ui/todayView.js` |
| Streak text (`14 days`), summaries without `·` | `src/ui/format.js`, `src/logic/todayWin.js` |

Answered 2026-11-22: `state.wSession` now resets at the day start (`wSessionDay`), and the Switch sheet renders over Today through `sheetLayer`.

Quick daily logging and a glance at how today is going. Source: `src/ui/todayView.js`, `todayWindows.js`, `logWindow.js`, `learnView.js`, `notesWindow.js`, `quickAddView.js`, `mealView.js`, `notesView.js`, `manageHabitsView.js`, `syncChip.js` (see "Where the code lives"). The old `studyView.js` and `practiceView.js` are gone.

## Workout redesign impact (mostly built)

Status 2026-11-22: **mostly built** (F65, F67). Done: Switch and Pick a workout open the Switch sheet over Today (`wSessionPick`, `sheetLayer`); `Start workout` opens the first unfinished exercise (`startWorkout` sets `wEx`); the card and Workout read the same template and day-scoped `wSession`. Still open: the `Planned today` section and plan-driven card (F66), and the rest day / free day question below. The table is the original plan, kept for reference. Comes from the Workout v2 redesign (F53) and v3 polish (F67); see `workout.md`. Today stays the front door to the workout, so these links must keep working when Workout changes.

| Today control | Workout v2/v3 target | What must change |
|---|---|---|
| Workout card `Switch`, free-day `Pick a workout` | Switch template sheet | The sheet is a modal on the Workout tab. Today must open it as an overlay and return to Today on pick (see the open question under F65 above). Title `Switch today's workout`, `Planned` tag, "Only today changes" line. |
| `Start workout` | Workout tab, board 14 `Next up` | Switch to the Workout tab and call `wOpenEx` on the first exercise with unfinished sets (the same action as `Next up`), not just change tabs. |
| Warm-up and BJJ rows (if shown on the card) | Warm-up and BJJ sheet | Use the same sheet so ticking there and here updates one state. |
| Habit "After your workout" | Done fold, board 14 | Counts as done when all sets are logged, same rule as the Done fold. |
| Workout card name and focus line | Today screen of Workout, template card | Read the same active template and `state.wSession` so the two screens never disagree. |
| `Rest day` | Workout Today, empty state | Workout must show a rest-day state, not an empty list. |

After F66 (weekly plans), the card also reads from the plan for the weekday, not the hard-coded Tue/Thu/Sat plan. Add a `Planned today` section (F66 step 2) below the card.

Open question: does `Start workout` on a rest day or free day open the Switch sheet or the last template? (`wSession` day reset is answered, see F65 built notes.)

## What changed from v1, and why

- **Today is a summary, not a form.** v1 stacked ten blocks on one screen. v2 keeps four things visible (header, hero, session, windows) and puts the rest in drop-downs or their own windows.
- **Habits live in the hero (F65).** Recent is a plain row; the v2 drop-downs are gone.
- **Windows:** Log, Learn and Notes each open a full window with a back arrow. Today only shows a one-line summary row for each.
- **Study became Learn.** v1 had a KUMIO panel tied to one job. v2 has user-defined **areas** (Guitar, Coding, Spanish, Reading, exam prep...), so it works for anything you practise or study. Guitar and the practice timer moved into Learn because they are the same kind of thing.
- **Sync is a chip plus a button.** The header chip shows status at a glance (and replaces the export banner); a Sync notice (only when entries wait or storage is unprotected) has a `Sync now` button.
- **Habit removal moved** out of the checklist (no `X` next to every row) into a Manage habits sheet.

## Quick add sheet (bottom sheet)

Opened by the `+` button. Title `QUICK ADD`, close `X`, four kind chips: **Weight, Meal, Session, Note**. (v1 had Guitar and Study chips; both are now **Session**.)

- **Session fields:** Area (drop-down of your areas, last used first, plus "New area"), Minutes (field plus 15 / 30 / 45 / 60 chips), and a collapsed `More details` row (type, metric, notes).
- Other kinds keep their v1 fields (declared in `src/logic/quickAdd.js`).
- `SAVE` stores the entry for today and closes. The scrim closes the sheet.

## Log, Learn and Notes windows (screen A style, F68)

Status: **built 2026-11-22** (checked by eye at 390 px in light and dark, not on a phone). Mock-ups are on the Design canvas "Life Log Today v2", Today page, boards `win3/Log`, `win3/Learn` and `win3/Notes`. This replaces the v2 window descriptions; the v2 layouts are in git history (before 2026-11-22).

All three windows open from the Log, Learn and Notes rows on Today and close with the back button. They share one look (the F65 type scale, one peach button each) and one spacing system, and every function from v2 is kept: all data, actions and input ids are unchanged except the three actions added under "Built notes".

### Spacing and shared parts (all three windows)

| Space | Value |
|---|---|
| Page edges and panel padding | 20 px |
| Between sections | 24 px |
| Between fields inside a section | 16 px |
| Label to its field, and between chips | 8 px |
| Control height | 44 px minimum; fields and main buttons 56 px |

- **Header:** back button (44 px, outlined) and the title (28/34, weight 800) on one 56 px row, then a one-line summary (15, muted).
- **Sections:** cream panels, 24 px radius; heading 17/22 weight 700, sentence case; a short status on the right of the heading where useful.
- **Fields:** label above (13, weight 600, muted), white 56 px field with a hairline, 16 px radius.
- **Lists inside a section:** white 52 to 56 px rows, 16 px radius, 8 px apart.
- **Buttons:** one peach primary per window (`Save meal`, `Save session`, `Save note`); other buttons outlined; `Stop and log` is dark (ink fill, white text) on the soft peach timer card; `Remove` is red text.
- **Chips:** 44 px pills; selected is ink fill with white text.
- **Tags:** sentence case, 13 px: `Waiting` on peach, `In vault` on soft peach.

### Log window

1. Header: `Log`, summary "Your weight and meals for <weekday, date>."
2. **Weigh-in:** heading with `Last: 182.8 lb, Monday` on the right. Label `Weight in pounds`, field and outlined `Save` on one row (step 0.1, 50 to 600). After saving, the row becomes a white status row: check, "182.4 lb saved for today" and a `Change` link that brings the field back.
3. **Meals:** heading with `85 of 160 g protein` on the right; progress bar (10 px) and "75 g to go" or "Target reached"; today's meals as white rows (type, name, grams). A hairline, then **Add a meal**: four meal-type buttons (Breakfast, Lunch, Dinner, Snack) instead of the drop-down, pre-picked by time of day; `What you ate` (max 60); `Protein in grams (optional)`; peach `Save meal`. A refused save keeps what was typed (as now).
4. Outlined link row "Guitar and the practice timer are in Learn" (replaces "Guitar timer moved to Learn"; still to be removed after one release).

### Learn window

1. Header: `Learn`, summary "45 minutes today", then one soft chip per area (`Guitar 30 min`).
2. **Timer card** (only while running, soft peach): `Timer running: Guitar`, clock 48/52 weight 800 with tabular figures, "Practising songs. Stopping logs 13 min.", the area's measure field when it has one (`Best BPM (optional)` for Guitar), dark `Stop and log` and outlined `Discard`. Survives closing the app (as now).
3. **Log a session:**
   - **Area:** chips, one per area (falls back to the drop-down when there are more than 6 areas).
   - **Type:** Practice, Study, Project, Review chips for non-Guitar areas. For Guitar the row reads "Practice. Guitar sessions always count as practice", matching what the app already does.
   - **Minutes:** field plus 15, 30, 45, 60 min chips (selected chip fills the field).
   - **More details** (white fold, closed): the summary line names what is inside ("Best BPM, focus and notes"); open shows the measure field (only if the area has one), `Focus (optional)` with suggestion chips (Technique, Songs, Theory, Improvisation), `Notes (optional)`.
   - Peach `Save session` and outlined `Start timer` on one row (`Start timer` hidden while running).
4. **Your areas this week:** a white row per area with minutes ("90 of 150 min", or "120 min, no weekly goal"), outlined `Edit`, and a goal bar when there is a goal. **Add an area:** Language, Reading, Exam prep and Your own chips.
   - `Edit` and `Your own` swap the panel for the area form: `Name`, `What you measure (optional)` (was "Metric label"), `Weekly goal in minutes (optional)`, dark `Save area`, outlined `Cancel`, and red `Remove <area>` when editing an existing area.
5. **Recent sessions** fold (closed): heading with the count; open shows the 5 newest as white rows (date, area, minutes).

### Notes window

1. Header: `Notes`, summary "Write down ideas now and send them to your vault later."
2. **New note:** `Title (optional)` (max 80); `Note` with a live count on the right ("0 of 5,000"), 144 px textarea; helper "If saving fails, what you typed stays here."; peach `Save note`.
3. **Latest notes:** heading with "2 waiting" or "All in your vault" on the right; the 3 newest as white rows (date, title, `Waiting` or `In vault` tag); outlined `Send 2 notes to vault`, which becomes a dashed, disabled "Nothing to send" when nothing waits.

### What stays the same

Data, actions and rules do not change: `logWeighIn`, `logMeal`, `pickArea`, `pickType`, `learnMin`, `logSession`, `toggleLearn`, `practiceStart`, `practiceStop`, `practiceDiscard`, `openAreaEdit`, `addStarterArea`, `saveArea`, `deleteArea`, `closeAreaEdit`, `logNote`, `exportNotes`, `closeTodayWin`. New UI-only state: the weigh-in saved row, meal type chosen by button, and the selected minute chip.

### Where the window code lives

| Change | Files |
|---|---|
| Shared window header, section and chip helpers | `src/ui/winParts.js` (`winHeader`, `winSection`, `chipRow`) |
| Shared styles and spacing tokens (`--sp-1` to `--sp-4`, `--ctl`, `--ctl-lg`) | `src/styles/windows.css`; per-window rules in `win-log.css`, `win-learn.css`, `win-notes.css` (linked in `index.html`, cached in `sw.js`) |
| Log window and meals | `src/ui/logWindow.js`, `src/ui/mealView.js`, `src/ui/mealActions.js` |
| Learn window, timer card, area form | `src/ui/learnView.js`, `src/ui/learnActions.js` |
| Notes window | `src/ui/notesView.js`, `src/ui/notesWindow.js` |

Built notes (2026-11-22): new UI-only state `state.mealType` and `state.weighEdit` (cleared in `logWeighIn`), new actions `pickMeal`, `changeWeigh` and `learnFocus`; `pickArea` also reads `data-area` from the area chips. The Notes count updates through `updateNoteCount()` from one delegated `input` listener in `app.js` (textarea `#note-body`, count `#note-count`). Window markup uses `win-*` classes; the old v2 window classes remain for other screens.

## Manage habits sheet (new)

Opened from the Habits drop-down. A row per habit with a `Remove` button (secondary, no red), a "New habit" field (max 40) and `ADD HABIT`. Removing a habit asks "Remove X from the list? Past check-ins stay in your log." (the same confirm as v1); consider an undo toast later. The sheet stays open after adding or removing.

## Data written from this tab

`habit_check`, `weigh_in`, `meal`, `note`, and the new **`session`** entry (see `src/logic/entries.js`). Areas live in localStorage (replaces the study subjects list).

`session` shape: entry `type: "session"` with `data: { area, type: "practice" | "study" | "project" | "review", minutes (1 to 600), metric (number or null), metricLabel (a snapshot of the area's label, so the export needs no lookup), focus, notes }` (see `src/logic/sessions.js`). Sessions are editable in History (type, minutes, metric, focus, notes; the area is fixed, delete and log again to change it). Legacy study entries are not editable. A Guitar-area session's non-practice type and notes also show on its `## Guitar` line (`35 min, focus: Scales, best BPM: 104, type: review - notes`).

**Migration (read side, no data rewrite):** existing `guitar` entries read as `session` with area `Guitar`, type `practice`, `bpm` as metric. Existing `study` entries read as `session` with area = their topic and type `study` (`prep` also maps to `study`). Export: a Guitar-area session joins the legacy `## Guitar` section in the same line format (`20 min, focus: Scales, best BPM: 96`), so streaks, records and the vault format do not change. Other areas get a `## <Area>` section with lines like `- project (30 min), focus: api, PRs: 3 - notes`. Legacy guitar and study entries export exactly as before (`## Guitar`, `## Kumio`); a golden test (`tests/exportGolden.test.js`) locks this. The weekly review counts Guitar-area sessions as guitar and adds an `## Other sessions` block when there are any.

## Design style

Unchanged from v1 except where noted.

- **Mood:** calm, white page with cream cards; the only strong color is peach, used for the one thing to act on (hero, primary button, FAB).
- **Hero card:** peach `#F4A28C`, 24 px radius, number 48/52 weight 800 in ink, caption 15 weight 600. Pips are 12 px dots, filled ink when done, 2 px ink ring when not.
- **Panels:** cream `#FBF3EC`, 24 px radius, 20 px padding, 12 px gap; H2 overline 12 px weight 700, 0.04em tracking, color `#5A5A5F`.
- **Drop-down header:** a 56 px button row, overline text left, chevron right (rotates 180 degrees when open); sets `aria-expanded`. Contents sit inside the same cream panel. Open or closed state is remembered per session only.
- **Rows:** `rowbtn` is 64 px tall on Today (two lines: small caption over value), 16 px radius, cream, chevron right; pressed state fills `#FDE8E0`. Inner list rows are white with a hairline `#E6DCD3`, 48 to 52 px tall.
- **Chips:** 44 px tall pills; selected is peach with weight 800, quick-minute chips use soft peach when matched.
- **Select (drop-down) fields:** 56 px white, hairline, chevron right.
- **Buttons:** primary peach 56 px pill with ink text; secondary white with a hairline; no danger red on this tab.
- **Sync chip:** soft peach `#FDE8E0` pill, 44 px tall, 13 px weight 700, with a 8 px peach dot.
- **Timer card:** soft peach `#FDE8E0`, 24 px radius, clock 48/52 weight 800.
- **Progress bars:** 8 to 10 px, track `#FDE8E0` (or white with hairline on cream), fill `#F4A28C`.
- **Quick add FAB:** 56 px round peach button with ink `+` and shadow `0 6px 18px rgba(244,162,140,.55)`, fixed bottom right above the tab bar.
- **Sheets:** white bottom sheet over a dim scrim; radius 28 px on top corners.
- **Status tags:** 12 px weight 700 pills, ink text on both: `WAITING` on peach `#F4A28C`, `EXPORTED` on soft peach `#FDE8E0`.
- **Motion:** press feedback and chevron turn only; respects reduced motion.

## Where the code lives

| Part | Files |
|---|---|
| Accordion (Habits, Recent), Quick add actions | `src/ui/todayActions.js` (`toggleSection`, `quickArea`, `quickMin`, `quickType`, `quickMore`) |
| Today layout, hero, session card, rows | `src/ui/todayView.js`, `src/ui/todayWindows.js` |
| Sync chip, Sync row, SYNC NOW | `src/logic/syncStatus.js`, `src/ui/syncChip.js`, `src/ui/autoSync.js` |
| Log window | `src/ui/logWindow.js`, `src/ui/mealView.js`, `src/logic/logWin.js` |
| Learn window and its actions | `src/ui/learnView.js`, `src/ui/learnActions.js`, `src/logic/areas.js` |
| Practice timer | `src/logic/practiceTimer.js`, `src/ui/practiceActions.js` |
| Notes window | `src/ui/notesWindow.js`, `src/ui/notesView.js` |
| Manage habits sheet | `src/ui/manageHabitsView.js`, `src/ui/manageHabitsActions.js` |
| `session` entry, area list, weekly totals, read-side migration | `src/logic/sessions.js`, `src/logic/areas.js` |
| Export and consumers of sessions | `src/logic/exportBuilder.js`, `streaks.js`, `retainedStats.js`, `records.js`, `weeklyReview.js` |

## Reference

| Thing | Where |
|---|---|
| Tab view and panels | `src/ui/todayView.js` |
| Windows and Today rows | `src/ui/todayWindows.js`, `src/logic/todayWin.js` |
| Quick add sheet, collapsible helper | `src/ui/quickAddView.js`, `src/logic/quickAdd.js`, `src/ui/todayActions.js` |
| Habits, streaks, rest day | `src/logic/habits.js`, `src/logic/retainedStats.js`, `src/logic/streaks.js` |
| Entry shapes and validation | `src/logic/entries.js` |
| Actions (`data-action`) | `toggleHabit`, `addHabit`, `deleteHabit`, `toggleRestDay`, `toggleSection`, `openManageHabits`, `closeManageHabits`, `syncNow`, `openTodayWin`, `closeTodayWin`, `logWeighIn`, `logMeal`, `logNote`, `exportNotes`, `pickArea`, `pickType`, `learnMin`, `logSession`, `toggleLearn`, `openAreaEdit`, `closeAreaEdit`, `saveArea`, `deleteArea`, `addStarterArea`, `practiceStart`, `practiceStop`, `practiceDiscard`, `openQuick`, `closeQuick`, `quickKind`, `quickArea`, `quickMin`, `quickType`, `quickMore`, `saveQuick`, `demo` |
| Styles | `src/styles/forma.css` (loaded last), `main.css`, `today.css` |
| Backlog items | F1 to F4, F9, F12, F13, F16, F17, F36, F41, F43, F49, F60, F61, F65, F68 in `docs/BACKLOG.md` |
