# Workout tab

Log lifting for the active template, run the rest timer, and manage templates. Source: `src/ui/workoutView.js`, `templateTagsView.js`, `templateView.js`, `workoutExtrasView.js`, `restView.js`, `platesView.js`, `workoutHistoryView.js`.

## Main screen, top to bottom

1. **Header:** `LIFE LOG · date`, title `WORKOUT`.
2. **PR banner** (conditional, only on this tab): `NEW PR · Bench 185 est. 1RM  was 180`, tap to dismiss. Appears after a working set beats a record.
3. **Session panel** (`WORKOUT 11-17`):
   - Line `Active template  <name>` with a `Switch` link (opens the Templates window).
   - Focus text plus "Beat last time on the first exercise."
   - Buttons: `EDIT TEMPLATES` (old edit mode, toggles to `DONE EDITING`), `HISTORY` (toggles to `BACK TO WORKOUT`), and `TEMPLATES AND TAGS`.
4. **Rest timer row:** peach row, `REST TIMER` caption over the time (`1:30`), `Open` pill on the right. Opens the rest timer page.
5. **Warm-up checklist** (Upper or Lower templates only): collapsible panel `UPPER WARM-UP 0/4` with checkable items; progress persists for the day.
6. **BJJ panel** (BJJ days only): "BJJ class done today" checkbox plus a post-BJJ warm-up checklist.
7. **Calisthenics block** (push Monday, pull Wednesday): one panel per exercise with Reps or Seconds, `LOG SET`, and its logged sets with EDIT and DEL.
8. **Exercise panels**, one collapsible panel per template exercise (title uppercase, arrow at right). Open one to see:
   - Optional equipment label (`Barbell`, `Dumbbell`, `Calisthenics`, `Machine`), then `Target 3 x 8-12 (trimmed 1 from 3 x 8-12). Warm-up: 1 x 8 at about 50%.`
   - `OPTIONS` menu: `EDIT`, `DELETE`, `TRIM A SET` / `PUT BACK`.
   - `BACK CUES` toggle on back exercises (a peach tip box).
   - First exercise only: peach `TRY TODAY` tip (one more rep, more weight, or 5 more seconds).
   - `Last: 100 x 8 on 11-10. Warm-up about 50 lb.` or "No history yet."
   - Inputs: weight (pre-filled from last working set), reps (or seconds for timed), left/right select for per-side. Calisthenics exercises add a weight-type select: `Added weight` or `Assisted weight`, and weight is optional.
   - Buttons: `WARM-UP SET` (secondary) and `WORKING SET` (peach). Weight exercises also get `PLATES`.
   - Logged sets for today as rows (`Set 100 x 8`, `Warm-up 50 x 8`, calisthenics as `+25 lb x 5` or `30 lb assist x 8`) with `EDIT` and `DEL`.
9. **Empty template:** panel "No exercises yet. Open Switch, then Edit on this template to add some."
10. **Spontaneous exercises** (today only), after the template's exercises: same panel as above, with `OPTIONS` holding `MARK DONE`, `EDIT EXERCISE`, `KEEP IN TEMPLATE`, `SAVE TO LIBRARY` and `REMOVE FROM TODAY`. An optional target (such as 3 x 8) gives set dots. No plates, trim or cues.
11. **ADD EXERCISE FOR TODAY** secondary button. Opens an inline `ADD FOR TODAY` panel: name (max 60), equipment (Not set, Barbell, Dumbbell, Calisthenics, Machine), what you log (weight and reps / reps, weight optional / seconds, weight optional), "Log left and right separately", `CANCEL` and `ADD`.

## Rest timer page (full screen, back arrow returns to Workout)

Title `Rest timer`. 220 px progress ring (white track, peach arc that fills as time passes) with the time in the middle and `of 1:30` or `ready` under it; preset chips (1:00 to 3:00); `CUSTOM TIME` with two scroll wheels (minutes, seconds) separated by a colon; switch "Start by itself after each working set"; a large `Start rest` button, which becomes `Stop rest` while running. The countdown survives closing the app.

## Plate calculator (opens under a weight exercise)

Plate calculator accordion: working weight (pre-filled from the exercise) and `CALC`; result draws one side of the barbell from the collar out (plate heights scale with weight) with tags like `2 x 45` or `BAR ONLY`, and the total. If the weight cannot be loaded with the plates you own, it says so and offers `USE 135 LB` and `USE 140 LB` (closest below and above); tapping one fills the exercise's weight box. A `My plates` fold holds the bar weight and a plus/minus stepper per plate size counting pairs (one plate on each side), kept on this device.

## Templates window (Switch, or TEMPLATES AND TAGS)

Back arrow with the small text `Active: <name>`; title `Workout templates`.
- **NEW TEMPLATE panel:** name field (max 40), `START BLANK` (peach) and `COPY ACTIVE` (secondary). Both open the new template's edit screen.
- **Tag filter chips:** `ALL` plus every tag in use.
- **One cream card per template:** name with an `Edit` link, `N exercises`, tag pills (or "No tags"), and either an `Active template` line or `SET ACTIVE`. Non-active cards are dimmed.

## Edit template screen

Back arrow; title `Edit template`. Panels: **EDIT TEMPLATE** (name, tag chips, "Custom tag" field with `ADD TAG`, `SAVE NAME AND TAGS`); the **exercise form** when adding or editing (name, equipment, what you log, left/right, warm-up, target, `CANCEL` / `SAVE`); **EXERCISES** (rows with name, target, `Edit`, trash icon; `ADD EXERCISE`); **actions** (`SET AS ACTIVE`, `DELETE TEMPLATE` in red, `BACK TO TEMPLATES`).

## Workout history mode

`WORKOUT HISTORY` panel: past days newest first, each a fold `Tue 11-17 · Upper A · 12 sets` that opens to per-exercise warm-up and working sets. Shows the newest 60 days; older ones live in Dropbox exports.

## Old edit mode (EDIT TEMPLATES)

`SESSIONS` panel with a name box and `NEW EMPTY`, `COPY THIS ONE`, `RENAME THIS ONE`, `DELETE THIS ONE`; below it the exercise list with `EDIT` and `DEL`, `ADD EXERCISE`, and `RESET ALL TO THE BUILT-IN PLAN`.

## Design style

- **Same system as Today:** cream panels on white, peach for the main action, ink text.
- **Rest row:** full-width peach pill row (`rest-row`), dark `Open` pill at the right. The rest page itself is a clean white screen: ring 14 px stroke, peach `#F4A28C` arc on a white track, large time text, preset chips as pills, a big peach `Start rest` / dark `Stop rest` button.
- **Exercise panels:** collapsible cream cards; the title is the uppercase H2 overline; tips (`TRY TODAY`, back cues) are soft peach `#FDE8E0` rounded boxes with a bold overline.
- **Set rows:** small bordered entries with `EDIT` and `DEL` as small secondary buttons.
- **Template cards (`tplcard`):** cream, 24 px radius, name weight 700, `Edit` as a text link; inactive cards use reduced opacity; the Active switch is a toggle-style control.
- **Tags:** small rounded pills; selected tag chips are peach.
- **Danger:** `DELETE TEMPLATE` uses the red danger button (solid `#B3261E`, white text).
- **PR banner:** full-width tinted button with a bold `NEW PR` lead.
- **Motion:** the ring arc animates with the countdown; everything else is static. Reduced motion is respected.

## Reference

| Thing | Where |
|---|---|
| Main view and exercise panels | `src/ui/workoutView.js` |
| Templates window and edit screen | `src/ui/templateTagsView.js`, `src/ui/templateTagsActions.js` |
| Exercise form | `src/ui/templateView.js`, `src/ui/templateActions.js` |
| Warm-up ticks, cues, trims | `src/ui/workoutExtrasActions.js`, `src/logic/workoutExtras.js` |
| Rest timer | `src/ui/restView.js`, `restActions.js`, `src/logic/rest.js` |
| Plate calculator | `src/ui/platesView.js`, `platesActions.js`, `src/logic/plates.js` |
| Spontaneous exercises | `src/logic/extras.js`, `workoutActions.js` (`addExtraOpen`, `addExtraSave`, `removeExtra`), `templateActions.js` (`keepExtra`) |
| Set logic, equipment, calisthenics weight types | `src/logic/workout.js` (`parseSet`, `setText`, `LOADS`), `src/logic/templateEdit.js` (`EQUIPMENT`) |
| Templates and tags | `src/logic/template.js`, `templateEdit.js`, `templateTags.js` |
| History mode | `src/ui/workoutHistoryView.js`, `src/logic/workoutHistory.js` |
| Progress and PR check | `src/logic/progress.js`, `src/ui/progressView.js` |
| Data | `lift_set` entries `{ session, exercise, kind, weight, reps, seconds, side, load? }`; template in `retained_stats` (`template`); today's extras in localStorage `lifelog.wExtras` |
| Backlog items | F8, F20 to F25, F29 to F32, F34, F35, F38, F42, F43, F49 to F52 in `docs/BACKLOG.md` |

## v2 update (redesign)

Status: built on branch `workout-v2` (2026-11-17), pending browser test and merge. Mockups live on the Claude Design canvas "Workout tab redesign" (13 phone artboards, 390 wide). The v1 text above describes what is live until v2 merges; then v1 should be removed.

**Why:** the v1 main screen stacks about 11 sections in one scroll (header, PR banner, session panel with 3 buttons, rest row, warm-up, BJJ, calisthenics, every exercise as an open panel, add button). Logging a set meant scrolling past everything else. v2 keeps the main screen as a short, calm overview and moves each job into its own page, sheet, or dropdown.

### The three rules

1. **Today is a list, not a form.** Each exercise is one compact row. Logging happens on a dedicated Exercise page.
2. **Rare things hide, frequent things stay.** Template switching, editing, history, plates, trims and cues sit behind a menu, sheet, or accordion. The rest timer and the working-set button are always one tap away.
3. **One container type per job.** Pages for work you stay in, sheets for quick choices, dropdowns for actions on the thing you are looking at, accordions for detail inside a page.

### Global layout rules

- **Frame:** 390 px wide, 16 px side padding, cards stacked with 8 to 12 px gaps.
- **Tab bar space (required):** the app's bottom tab bar is 72 px tall. Every screen reserves it. The mockups draw a dashed "APP TAB BAR · 72 PX RESERVED" strip at the bottom of each page screen. Build rule: the scroll container gets `padding-bottom: calc(72px + 16px + env(safe-area-inset-bottom))`, and anything pinned to the bottom (rest bar, Stop rest button, Edit template footer) sits at `bottom: calc(72px + 16px + env(safe-area-inset-bottom))`. Nothing may sit under the tab bar.
- **Modal sheets cover the tab bar** (scrim over everything, sheet anchored to the bottom edge). They are temporary, so this is fine. Closing returns to the page underneath.
- **Hit targets:** 44 px minimum (buttons 44 to 60 px, steppers 48 px, icon buttons 44 px circles).
- **Tokens (unchanged from v1):** ink `#2A2522`, cream panel `#FBF3EA` with `#EFE3D6` border, peach `#F4A28C` for the main action and selected state, soft peach `#FDE8E0` for tips and the PR banner, muted text `#6B5F58`, danger `#B3261E`. Cards are 20 px radius (template cards 24 px), buttons 14 px, pills fully round. Type: Inter in the mockups; keep whatever the app already uses. Section labels are 11 px uppercase with wide tracking.
- **Rows, not panels:** a list row is a cream card, 68 px high, name (13 px, 800 weight, uppercase), one muted detail line, equipment tag, set dots, chevron.
- **Set dots:** one 10 px dot per target set; filled peach = logged. Gives progress without opening the exercise.
- **Disabled and inactive:** do not dim with opacity (fails contrast). Inactive cards go white with the same border; inactive tabs use muted text.

### Navigation model and wiring

Four container types. How each one opens and closes:

| Type | Opens from | Closes with | Screens |
|---|---|---|---|
| Page (push) | Tapping a row or menu item | Back arrow in the top-left, returns to the previous page | Exercise, Rest timer, Templates, Edit template, History |
| Sheet (modal) | A button on the page below | Done / Cancel, tapping the scrim, or choosing an item | Switch template, Warm-up and BJJ, Add for today |
| Dropdown | The three-dot button in the top-right | Tapping outside, or choosing an item (the button turns peach while open) | Today menu, Exercise options |
| Accordion | Tapping its header row | Tapping the header again (chevron flips) | Plate calculator, Name and tags, More actions, history days, New template |

**Link map (what taps go where):**

| From | Element | Goes to |
|---|---|---|
| Today | three-dot button | Today menu (dropdown) |
| Today | Switch (template card) | Switch template (sheet) |
| Today | Upper warm-up row, BJJ row | Warm-up and BJJ (sheet) |
| Today | any exercise row | Exercise (page) |
| Today | + Add exercise for today | Add for today (sheet) |
| Today | rest bar (Open) | Rest timer (page) |
| Today menu | Templates and tags | Templates (page) |
| Today menu | Edit this template | Edit template (page, active template) |
| Today menu | Workout history | History (page) |
| Switch template | a template row | sets it active, closes sheet, back to Today |
| Switch template | Manage all, + New template | Templates (page) |
| Exercise | three-dot button | Exercise options (dropdown) |
| Exercise | Plate calculator row | expands the plates accordion in place |
| Exercise | Warm-up set, Working set | logs a set, adds a row to Logged today, fills the next dot, auto-starts the rest timer if the switch is on |
| Exercise | rest bar | Rest timer (page) |
| Exercise options | Edit exercise | Edit exercise form (same form as in Edit template) |
| Exercise options | Trim a set / Put back | toggles the one-set trim for today |
| Exercise options | Back cues | shows the cue tip box (back exercises only) |
| Exercise options | Delete from template | confirm, then removes it (spontaneous exercises show Keep in template and Remove from today instead) |
| Rest timer | Start rest / Stop rest | starts or stops the countdown |
| Templates | Edit | Edit template (page) |
| Templates | Set active | sets active, back to Today |
| Edit template | Edit (exercise row) | exercise form |
| Edit template | + Add exercise | exercise form (blank) |
| Edit template | Back / Save | Templates (page) |

All "back" arrows return to the page that opened them, not always Today. Today is the root of the Workout tab.

### Screens

**1. Today (main).** Top to bottom: header (`LIFE LOG · date`, title `Workout`, three-dot button at right) → PR banner (slim, only after a record, tap to dismiss) → template card (name, Switch button, set-progress bar `5 of 14 sets`, focus line) → one peach `Start: <exercise>` / `Continue: <exercise>` button (the next unfinished exercise; a `WORKOUT DONE` card when finished: sets, exercises, lb lifted, any new PRs, and a `TICK WORKOUT HABIT` button) → "Before you lift" card (the template's warm-up row with `0 / 4`, only when the template has one) → "Activities" card (see below; one slim row, `ACTIVITIES · NONE TODAY`, when nothing is scheduled) → `EXERCISES · n` label → exercise rows → dashed `+ Add exercise for today` → small rest pill at the right above the tab bar on the Today list (peach `REST 1:30` when idle, dark while counting down; tap to open the rest timer). On the Exercise page the same timer is a chip in the top right of the logging card instead, so it never covers the set buttons. Confirmations (`Set saved`) appear at the top; after a set the toast shows an `UNDO` chip, and tapping the toast removes that set and returns to the exercise. The row being worked on gets a 2 px peach border. Spontaneous exercises are dashed white rows with a `Today only` tag, placed after the template rows.

**2. Today menu.** Dropdown under the three-dot button, 290 px wide, scrim behind. Three items, each with a one-line hint: Templates and tags, Edit this template, Workout history. This replaces the three v1 buttons (`EDIT TEMPLATES`, `HISTORY`, `TEMPLATES AND TAGS`). The old edit mode is gone, Edit this template opens the normal Edit template page.

**3. Switch template (sheet).** Grab handle, title, `Manage all` link, tag filter chips, one radio row per template (name, exercise count, tag), `+ New template`. Tapping a row switches and closes in one tap. Replaces the Switch link plus the separate Templates window for the common case.

**4. Warm-up and BJJ (sheet).** Segmented control: `Warm-up 0/4`, `BJJ`, `Calisthenics`. A tab is shown only on days it applies (BJJ on BJJ days, Calisthenics Mon and Wed, otherwise greyed). Body is a checklist with 26 px checkboxes. `Done` closes. Progress still persists for the day.

**5. Exercise (page).** Back arrow, `Exercise 1 of 5`, three-dot button. Title with equipment tag. Info strip with four compact cells (two by two, value and note on one line): Target, Last (with date), Warm-up weight, PR (heaviest set with its estimated 1RM). When the target set count is reached the set buttons give way to `NEXT EXERCISE` and `ADD EXTRA SET`. A `RECENT` row with the best set of the last three sessions and the estimated 1RM trend (needs two or more past sessions). Peach `TRY TODAY` tip on every exercise with history. Logging card: `SET 2 OF 3` label, weight stepper, reps stepper (seconds for timed, weight optional for calisthenics with an Added/Assisted select, Left/Right select for per-side), then `WARM-UP SET` (secondary) and `WORKING SET` (peach). Weight pre-fills from the last working set. Below: Plate calculator row (weight exercises only), `LOGGED TODAY · n` list with Edit and Del per row. Rest bar pinned above the tab bar.

**6. Exercise options and plates.** The dropdown (Edit exercise, Trim a set, Back cues, Delete from template in red) and the plates accordion open: working weight field and `CALC`, result `45 lb bar, each side:` with plate tags (or `BAR ONLY`), total or `N lb short`, plates-you-own toggles, bar weight.

**7. Add for today (sheet).** Name (max 60), equipment chips (Not set, Barbell, Dumbbell, Calisthenics, Machine), what you log (3 radio rows), left/right switch, `CANCEL` and `ADD`. Same fields as v1, just in a sheet.

**8. Rest timer (page).** Same content as v1: 220 px ring (14 px stroke, peach arc), time and `of 1:30`, preset chips 1:00 to 3:00, custom time wheels, auto-start switch, large Start rest / Stop rest. Ring track is light cream `#F3E8DC` so it shows on white. Button sits above the tab bar.

**9. Templates (page).** Header shows `Active: <name>`. `+ New template` is a collapsed accordion (name, Start blank, Copy active). Tag chips scroll horizontally. Cards: name, `Edit` link, exercise count, tag pills, and either a peach `Active template` badge or a `Set active` button. Active card has a 2 px peach border.

**10. Edit template (page).** Three accordions: Name and tags (collapsed, shows the current name and tags), Exercises (open: drag handle, name, target and equipment, Edit, red trash, `+ Add exercise`), More actions (open in the mockup: Set as active, which is greyed with "Already the active template" when it is active; Reset all to the built-in plan, with a confirm, which replaces every template with the default plan; Delete template in red, with a confirm). Footer `Back` and `Save` above the tab bar.

**11. History (page).** Grouped by `This week`, `Last week`, `Earlier`. Each day is a fold `Tue 11-17 · Upper A` with `12 sets`. Opening shows per-exercise set chips (warm-ups muted). Footer fold notes the 60-day limit and Dropbox exports.

**Exercise library (added 2026-11-17).** Exercise options menu gains `Save to library` (template and today-only exercises); the Today menu gains `Exercise library` (a sheet listing saved exercises with `REMOVE`). Saving a name that already exists replaces it. The name field in the Add for today sheet and the Edit exercise form suggests saved names; picking one fills equipment, what you log, warm-up, target and the left and right box in place (nothing else re-renders). Stored in `localStorage` key `lifelog.library` (this device only, up to 200). Source: `src/logic/library.js`, `src/ui/libraryActions.js`.

**12. Today, BJJ day.** BJJ is now an activity (see Activities), not part of "Before you lift". Its log sheet holds the `BJJ done today` check and the `Post-BJJ warm-up` list.

**Activities (added 2026-11-17).** A separate card under "Before you lift": label `ACTIVITIES` with an `Edit` link, one row per activity scheduled today (name, status such as `Not yet`, `Done`, `3.1 mi · 2 sets`, chevron), and a dashed `+ Add activity`. Built in: BJJ (Mon and Wed, done check, post-BJJ warm-up) and Calisthenics (Mon push, Wed pull; its row opens the first calisthenics exercise, and its exercises stay in their own list below). Your own: name, days of the week (chips), and what to log (done check, distance in mi or km, sets and reps). Tap a row to open its log sheet; `Edit` opens the manage sheet to add, edit or remove. Removing BJJ or Calisthenics hides them everywhere; logs already saved stay in History. Stored in `localStorage` key `lifelog.activities` (this device only); each day's log is one `habit_check` entry per activity, so the done check counts toward streaks. Source: `src/logic/activities.js`, `src/ui/workoutActivities.js`, `src/ui/activityActions.js`.

**13. Today, calisthenics day (Mon push, Wed pull).** The list splits into `LIFTS` and `CALISTHENICS · push`. Each calisthenics row shows its load type as a tag (Added weight, Assisted, or Calisthenics for seconds). Tapping opens the normal Exercise page with the Added/Assisted select.

### Where every v1 element went

| v1 element | v2 location |
|---|---|
| Header | Today header, plus three-dot menu |
| PR banner | Slim banner under the header on Today |
| Session panel (active template, Switch, focus text) | Template card on Today (Switch opens sheet 3) |
| `EDIT TEMPLATES` / `DONE EDITING` | Removed. Menu item Edit this template opens page 10 |
| `HISTORY` / `BACK TO WORKOUT` | Menu item Workout history opens page 11, back arrow returns |
| `TEMPLATES AND TAGS` | Menu item, and Manage all in the Switch sheet |
| Rest timer row | Floating rest bar on Today and Exercise |
| Warm-up checklist | "Before you lift" card plus sheet 4 |
| BJJ panel | BJJ row (Today) and BJJ tab (sheet 4); inline block on BJJ days |
| Calisthenics block | Grouped rows on Today plus the Exercise page |
| Exercise panel (collapsible) | Exercise row on Today plus the Exercise page |
| `OPTIONS` menu (Edit, Delete, Trim a set / Put back) | Three-dot dropdown on the Exercise page |
| `BACK CUES` toggle | Item in that dropdown |
| `TRY TODAY` tip | On the Exercise page, first exercise only |
| `Last: ...` line | Info strip on the Exercise page |
| `WARM-UP SET`, `WORKING SET`, `PLATES` | Exercise page (plates is an accordion) |
| Logged set rows with `EDIT` / `DEL` | `LOGGED TODAY` list on the Exercise page |
| Empty template message | Empty state under `EXERCISES`, text unchanged, with a button to Edit this template |
| Spontaneous exercises | Dashed `Today only` rows; Keep in template and Remove from today in the dropdown |
| `ADD EXERCISE FOR TODAY` | Dashed button on Today, opens sheet 7 |
| Rest timer page | Page 8 |
| Plate calculator panel | Accordion on the Exercise page |
| Templates window | Page 9 (plus sheet 3 for quick switching) |
| Edit template screen | Page 10 with accordions |
| Workout history mode | Page 11 |
| Old edit mode `SESSIONS` panel | Removed. New and Copy live in Templates; Rename and Delete live in Edit template |
| `RESET ALL TO THE BUILT-IN PLAN` | More actions on Edit template (page 10), with a confirm |

### Build notes (proposed, not done)

- The logic layer does not change. Data stays: `lift_set` entries, template in `retained_stats`, today's extras in `lifelog.wExtras`, rest state as today. Only the views and routing change.
- Suggested view split: keep `workoutView.js` as the Today list; add an exercise page view, sheet views for switch, prep and add-for-today, and a small shared dropdown helper. Reuse `restView.js`, `platesView.js`, `templateTagsView.js`, `workoutHistoryView.js` content inside the new containers.
- Navigation needs a small stack for Workout tab pages so back arrows return to the previous page, and one `openSheet` / `closeSheet` state for modals.
- Retire the old edit-mode code in `templateView.js` and `templateActions.js` once Edit this template covers its actions.

### Open questions and assumptions

- The mockups use placeholder exercises, weights and warm-up items. Real data comes from the app.
- Whether pages (Exercise, Rest timer, Templates, Edit, History) keep the tab bar visible is assumed yes; the mockups reserve the space on every page.
- Exact tab bar height is assumed 72 px. Change the number everywhere if the real bar differs.
- Trim a set is shown as a one-line dropdown item with a hint of the resulting target; the label flips to Put back once trimmed.
