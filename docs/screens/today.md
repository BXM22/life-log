# Today tab (v2 design)

Status: **design only, not built yet.** Mock-ups are on the Design canvas "Life Log Today v2". The v1 layout is in git history (last v1 edit 2026-11-17).

Quick daily logging and a glance at how today is going. Source today: `src/ui/todayView.js`, `todayWindows.js`, `quickAddView.js`, `mealView.js`, `notesView.js`, `practiceView.js`, `studyView.js`. v2 renames and merges some of these (see "Code changes").

## What changed from v1, and why

- **Today is a summary, not a form.** v1 stacked ten blocks on one screen. v2 keeps four things visible (header, hero, session, windows) and puts the rest in drop-downs or their own windows.
- **Drop-downs (accordions):** Habits and Recent. Tapping the header row opens or closes the panel; a chevron shows the state.
- **Windows:** Log, Learn and Notes each open a full window with a back arrow. Today only shows a one-line summary row for each.
- **Study became Learn.** v1 had a KUMIO panel tied to one job. v2 has user-defined **areas** (Guitar, Coding, Spanish, Reading, exam prep...), so it works for anything you practise or study. Guitar and the practice timer moved into Learn because they are the same kind of thing.
- **Sync moved to a header chip.** The "N waiting to export" row and the export banner are one pill at top right.
- **Habit removal moved** out of the checklist (no `X` next to every row) into a Manage habits sheet.

## Main screen, top to bottom

1. **Header:** overline `LIFE LOG · <weekday, date>`, title `TODAY`. Right side: **sync chip** (soft peach pill) `3 waiting` or `Synced`, opens the Sync tab. When the last export is 7 or more days old and the Settings reminder is on, the chip reads `Export due` and shows a peach dot (replaces the old banner and the Sync row).
2. **Hero card (peach):** big `done/total` of habits (`2/3`), caption "habits done today", pips (filled ink when done, ring when not).
3. **TODAY'S SESSION card:** session name (`Upper A`) and focus line (`Upper chest and back`), or "No lifting scheduled. BJJ, rest or a walk." when empty.
   - Primary `START WORKOUT` (or `PICK A WORKOUT` on a free day) switches to the Workout tab.
   - Secondary `Mark as rest day`; becomes `Undo rest day` once used; hidden if a real workout is checked. A rest day is a `habit_check` with `rest: true`, so the streak continues.
4. **HABITS drop-down** (header `HABITS · 2 OF 3`, open by default):
   - One tappable row per habit: checkbox, name, streak pill (`4d`, shown when the streak is 1 or more).
   - `Manage habits` row at the bottom opens the Manage habits sheet.
   - Empty state: "No habits yet. Add one in Manage habits."
5. **LOG AND LEARN rows** (three row buttons, small caption over a one-line summary):
   - `LOG`: `182.4 lb · Protein 85 / 160 g`. Opens the Log window.
   - `LEARN`: `45 min today · Guitar, Coding`, or "Timer running" while a timer is on. Opens the Learn window.
   - `NOTES`: `2 waiting for the vault`. Opens the Notes window.
6. **RECENT drop-down** (header `RECENT · 8 ENTRIES`, closed by default): the 4 newest entries as rows `11-17 <label>` with a `WAITING` or `EXPORTED` tag, then `Edit or delete entries in History`. Empty state: "No entries yet." plus `LOAD DEMO DATA`.
7. **Storage note** (conditional): one line under the header when storage is unprotected, with the Add to Home Screen hint.
8. **Quick add FAB:** round peach `+`, bottom right, above the tab bar.

## Quick add sheet (bottom sheet)

Opened by the `+` button. Title `QUICK ADD`, close `X`, four kind chips: **Weight, Meal, Session, Note**. (v1 had Guitar and Study chips; both are now **Session**.)

- **Session fields:** Area (drop-down of your areas, last used first, plus "New area"), Minutes (field plus 15 / 30 / 45 / 60 chips), and a collapsed `More details` row (type, metric, notes).
- Other kinds keep their v1 fields (declared in `src/logic/quickAdd.js`).
- `SAVE` stores the entry for today and closes. The scrim closes the sheet.

## Log window (back arrow returns to Today)

Title `Log`. Body and food only.

- **WEIGH-IN:** weight (lb, step 0.1, accepts 50 to 600), `SAVE`, and a "Last: 182.8 lb, Mon" hint.
- **MEALS:** protein line `Protein 85 / 160 g` with progress bar and "75 g to go"; today's meals as rows (type left, name and grams right); an **ADD A MEAL** group with a Meal type drop-down (Breakfast, Lunch, Dinner, Snack; defaults by time of day), "What you ate" (max 60), "Protein in grams (optional)", `SAVE MEAL`. Empty state: "No meals logged yet today."
- A row at the bottom points to Learn: "Guitar timer moved to Learn". Remove it after one release.

## Learn window (new; replaces Study window, Guitar panel and Practice timer window)

Title `Learn`. Anything you practise, study or build, tracked by **area**.

- **Timer card** (soft peach, only while running): `TIMER RUNNING · <AREA>`, large clock, "Practising: <focus>. Stopping logs N min.", `STOP AND LOG` and `DISCARD`. The timer survives closing the app. When idle the card is absent; `START TIMER` is in the log panel.
- **TODAY panel:** total minutes today and one chip per area (`Guitar 30`, `Coding 15`).
- **LOG A SESSION panel:**
  - **Area** drop-down (your areas).
  - **Type** chips: Practice, Study, Project, Review.
  - **Minutes** field plus 15 / 30 / 45 / 60 chips.
  - **More details** drop-down (closed): *Metric* (optional number; its label is set per area, e.g. "Best BPM" for Guitar, "Pages" for Reading), *Focus* (optional, with suggestions you have used before), *Notes* (optional).
  - `SAVE SESSION` and `START TIMER`.
- **MY AREAS · THIS WEEK panel:** one row per area with name, minutes against the weekly goal (`90 of 150 min`) and a progress bar. `Edit` opens Edit area: name, metric label (optional), weekly goal in minutes (optional), remove. "Add an area" chips offer starters (Language, Reading, Exam prep) and "Your own".
- **RECENT SESSIONS drop-down** (closed): the 5 newest sessions.
- Starter areas on a fresh install: **Guitar** and **Coding**. No work-specific areas ship by default; the old Kumio subject becomes a normal area on migration.

## Notes window (new; was the NOTES panel inside Study)

Title `Notes`. Optional title (max 80), note body (max 5000, textarea), `SAVE NOTE`; the 3 newest notes with a `WAITING` or `IN VAULT` tag; `SEND N NOTES TO VAULT` (disabled when none are waiting). A refused save keeps what you typed.

## Manage habits sheet (new)

Opened from the Habits drop-down. A row per habit with a `Remove` button (secondary, no red), a "New habit" field (max 40) and `ADD HABIT`. Removing a habit asks for no confirmation in v1 and is unchanged in v2; consider an undo toast later.

## Data written from this tab

`habit_check`, `weigh_in`, `meal`, `note`, and the new **`session`** entry (see `src/logic/entries.js`). Areas live in localStorage (replaces the study subjects list).

`session` shape: `{ kind: "session", date, area, type: "practice" | "study" | "project" | "review", minutes, metric?, focus?, notes? }`.

**Migration (read side, no data rewrite):** existing `guitar` entries read as `session` with area `Guitar`, type `practice`, `bpm` as metric. Existing `study` entries read as `session` with area = their topic and type `study` (`prep` also maps to `study`). The export keeps one section per area, named after the area (as F41 did for subjects), so the vault format does not change for old data.

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

## Code changes to plan

| Change | Files |
|---|---|
| Collapsible helper reused for Habits, Recent, More details | `src/ui/todayActions.js` |
| New Today layout, sync chip, rows | `src/ui/todayView.js` |
| Log window trimmed to weigh-in and meals | `src/ui/todayWindows.js`, `mealView.js` |
| Learn window replaces Study and Practice | new `src/ui/learnView.js`; retire `studyView.js`, `practiceView.js` |
| Notes window | `src/ui/notesView.js` (promote to its own window) |
| Manage habits sheet | `src/ui/todayView.js`, `src/logic/habits.js` |
| `session` entry, area list, weekly totals, migration read | `src/logic/entries.js`, `src/logic/quickAdd.js`, new `src/logic/areas.js` |
| Export section per area | export code (F41 path) |

## Reference

| Thing | Where |
|---|---|
| Tab view and panels | `src/ui/todayView.js` |
| Windows and Today rows | `src/ui/todayWindows.js`, `src/logic/todayWin.js` |
| Quick add sheet, collapsible helper | `src/ui/quickAddView.js`, `src/logic/quickAdd.js`, `src/ui/todayActions.js` |
| Habits, streaks, rest day | `src/logic/habits.js`, `src/logic/retainedStats.js`, `src/logic/streaks.js` |
| Entry shapes and validation | `src/logic/entries.js` |
| Actions (`data-action`) | `toggleHabit`, `addHabit`, `deleteHabit`, `toggleRestDay`, `toggleSection`, `openTodayWin`, `closeTodayWin`, `logWeighIn`, `logMeal`, `logSession`, `saveArea`, `deleteArea`, `logNote`, `exportNotes`, `timerStart`, `timerStop`, `timerDiscard`, `openQuick`, `closeQuick`, `quickKind`, `saveQuick`, `demo` |
| Styles | `src/styles/forma.css` (loaded last), `main.css`, `today.css` |
| Backlog items | F1 to F4, F9, F12, F13, F16, F17, F36, F41, F43, F49 in `docs/BACKLOG.md`; add a new item for Today v2 |
