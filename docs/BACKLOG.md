# Backlog

Priority: Must-M1, Must-M2, Should, Could. Tick items as they ship and note them in the CHANGELOG.

## M1 MVP

- [x] F1 Today screen with open items (Must-M1)
- [x] F2 Habit checklist; add and delete habits (Must-M1)
- [x] F3 Quick weigh-in and bodyweight history (Must-M1)
- [x] F4 Guitar log: minutes, focus, best BPM (Must-M1)
- [x] F5 Edit and delete any entry (Must-M1). Habit checks change by toggling, not deleting
- [x] F6 Offline use and install to home screen (Must-M1)
- [x] F7 JSON backup and restore (Must-M1)
- [x] F26 Settings screen (Must-M1)
- [x] F27 Summary store and keep-last-7-days wipe (Must-M1)
- [x] F28 Storage persistence and Add to Home Screen prompt (Must-M1)
- [x] F14 Markdown export to Dropbox, then warned wipe of exported logs (Must-M1)

## M2 Training and food

- [x] F8 Upper/Lower session logger with last-weight pre-fill (Must-M2)
- [x] F9 Meal log: name, type (Must-M2)
- [x] F20 Add, edit and delete exercises in each session (Must-M2)
- [x] F21 Workout template: Upper/Lower 3-4 day plan (Must-M2). Upper A, Lower, Upper B and optional Upper C are in; the 3/4-day switch is F31
- [x] F22 Warm-up and working sets logged separately (Must-M2)
- [x] F23 Rest timer with a wheel for a custom time (Should)
- [x] F24 Timed, per-side and bodyweight exercises (Must-M2)
- [x] F25 Progression prompt on first lift (Should). A TRY TODAY line on the first exercise: one more rep below the top of the rep range, more weight at the top, 5 more seconds for holds
- [x] F29 Warm-up checklists and back-training cues (Could). Upper, Lower and post-BJJ checklists before the first set (custom sessions get none); a BACK CUES toggle on each back exercise. Ticks are kept per day in localStorage
- [x] F30 Trim a set (Could). TRIM A SET / PUT BACK lowers the shown set count for that day only (minimum 1); logged sets and history are untouched
- [x] F31 3-day and 4-day schedule switch (Should). Settings > PLAN; 3 days drops Sunday's Upper C, which stays pickable on the Workout tab
- [x] F34 Custom workout templates: create, copy, rename and delete your own sessions, filled with the exercise editor (Should). Custom sessions are picked by hand; they are not on the weekday schedule
- [x] F35 Workout history: past workout days with each session's exercises and sets, newest first (Should)
- [x] F32 Calisthenics blocks and BJJ done check (Should). Monday push block, Wednesday pull block, logged as lift_set entries; a BJJ class done check is a habit_check entry. Not built: editing a logged calisthenics set (delete and re-log)
- [x] F33 Weekly export reminder (Should). Banner on Today after 7+ days (or never) linking to Export, once-a-day notification where supported and permitted, Settings toggle stored under its own localStorage key
- [x] F16 Kumio prep and study log (Should). Today panel: type (prep or study), topic, minutes, notes; a ## Kumio section in the export; backed up and wiped like other entries. Not built: editing in History, weekly total
- [x] F10 Week view: habit grid, weight trend with 170 lb line (Should). History tab: THIS WEEK grid (Mon-Sun) and a 28-day WEIGHT TREND chart with a dashed 170 lb line. Not built: browsing earlier weeks
- [x] F11 Streaks per habit and for guitar (Should). History tab STREAKS panel: current and best per habit and for guitar practice; today still undone does not break a streak
- [x] F12 Practice timer (Could). Today, under the guitar form: Start with optional focus, Stop with optional best BPM; saves an ordinary guitar entry. Survives sleep and reload. Not built: end sound, countdown
- [x] F13 Protein tracking against a 160 g daily target; water is optional (Should). Optional grams on each meal, a daily total with a progress bar on Today; water is not built
- [x] F19 Personal records: top 5 per lift, bodyweight, guitar BPM and more, kept through wipe (Should). History tab panel; lifts by estimated 1RM, holds by time, bodyweight moves by reps, lowest bodyweight, best BPM per focus, longest practice; a Personal records section ends every export. Not built: the New PR badge on Today, removing a record, the 'most workouts in a week' list

## M3 Vault link

- [x] F15 Direct Dropbox upload (Could). Shipped in M1 with OAuth PKCE and no backend. The synced backend idea is dropped.

## M4 Later tracks

- [x] F17 Inbox quick capture (Could). Shipped early as Notes on the Today tab: title and body, sent to the vault as one .md file per note in myVault/sources/life-log/notes/

## M5 Design board ideas

From the Life Log design board (Forma layout). Mock-ups exist for screens marked (mock-up). Not built yet.

- [x] F36 Quick add sheet (Should) (mock-up). Plus button on Today opens a sheet for weigh-in, guitar, meal or note, with "log again" rows for recent entries. Two taps or fewer
- [x] F37 Weekly review (Should) (mock-up). Sunday summary: habit percent vs last week, weight change, lifts done, new PRs, average protein, guitar and study time, one suggestion. Send to vault as Markdown
- [x] F38 Plate calculator (Could) (mock-up). Opens from the set button on the Workout card; shows plates per side for the working weight; settings for bar weight and plates owned; offline
- [x] F39 PR banner and lift progress chart (Should) (mock-up). New PR banner after a set (completes the F19 gap) and a per-lift estimated 1RM chart over 8 weeks on History
- [x] F40 Habit heatmap and goal projection (Could) (mock-up). 5-week heatmap of habits done and a projected date to reach 170 lb from the recent weigh-in pace
- [x] F41 Custom study subjects (Should). Generalises F16: any subject as a chip, add and edit subjects, per-subject minutes today and weekly total; the export section is named after the subject instead of ## Kumio. Closes the "weekly total" gap in F16
- [x] F42 Workout template tags (Should) (mock-up). Extends F34: a templates window listing all sessions with tags and a tag filter; an edit screen with name, tags, custom tags and exercises. Long template names scroll in the Workout chip row instead of cutting off. Each template has an Active switch (active ones show on the Workout tab, inactive are hidden); the edit screen has Set as active, a remove button on every exercise, Add exercise and Delete template
- [x] F43 Collapsible sections and own-window screens (Should) (mock-up). Collapsed rows with a chevron: weigh-in once logged, Notes, Meals, Warm-up checklist and Back cues on Workout, Personal records and All entries on History, Backup on Sync. Own windows: practice timer (full screen, big clock, Stop and save), Edit entry (bottom sheet from History), Wipe confirmation (modal with the Dropbox checkbox), Dropbox setup (Settings sub-page with export folder, last upload, reconnect, disconnect)
- [x] F49 Screen flow wiring (Should). Design board flow: Today plus button opens Quick add, and Today rows open Log and Study; Log's Start timer opens the practice timer; History's Records row opens Lift progress and All entries opens Edit entry; Sync's Wipe opens the confirmation modal; Settings' Dropbox row opens Dropbox setup; Workout's Templates link opens the template list, which opens Edit template. Every window has a close or back control to its parent tab. Check the built app matches
- [x] F50 Start a workout template blank (Should). The Templates window has a NEW TEMPLATE box: name it, then START BLANK (no exercises, add them over time on the edit screen) or COPY ACTIVE. Workout shows an empty-state line for a template with no exercises.
- [x] F51 Spontaneous exercises (Should). ADD EXERCISE FOR TODAY on Workout adds an extra exercise for that day only (name, what you log, left/right); sets log and export as normal and the template stays unchanged. Its OPTIONS menu has KEEP IN TEMPLATE (adds it to the active template for good) and REMOVE FROM TODAY.
- [x] F52 Exercise equipment (Should). Each exercise can be Barbell, Dumbbell, Calisthenics or Machine (template edit form and ADD EXERCISE FOR TODAY). Calisthenics sets take optional weight logged as Added weight or Assisted weight, plus reps; shown as "+25 lb x 5" or "30 lb assist x 8"; weighted calisthenics sets compare by reps, not estimated 1RM.
- [x] F53 Workout tab v2 redesign (Should). Short Today list with set dots, Exercise page, sheets (Switch template, Warm-up/BJJ/Calisthenics, Add for today), dropdown menus, fixed rest bar, restyled Templates, Edit template and History pages; spec in docs/screens/workout.md. Shipped.
- [x] F55 Exercise library (Could). Save an exercise from its options menu; Exercise library sheet in the Today menu; name autofill in the Add for today sheet and the Edit exercise form. Logic in src/logic/library.js, UI in src/ui/libraryActions.js. Shipped.
- [x] F56 Plate calculator redo (Should). Owned plates are counted in pairs (one on each side) with plus and minus steppers under a My plates fold; the result draws one side of the barbell from the collar out; when the weight cannot be loaded exactly it offers the closest totals below and above with a USE button that fills the exercise's weight. Older saved settings are migrated. Logic in src/logic/plates.js, UI in src/ui/platesView.js and platesActions.js. Shipped.
- [x] F57 Move on at the target set count (Should). Logging the last working set of an exercise moves to the next exercise (or back to the list after the last); a finished exercise shows NEXT EXERCISE and ADD EXTRA SET instead of the set buttons. Shipped.
- [x] F58 Actual PR and estimated 1RM (Should). The Exercise page info strip shows the heaviest set with its estimated 1RM; the NEW PR banner shows the set and the estimated 1RM. Logic in src/logic/records.js (bestSet). Shipped.
- [x] F59 Edit and mark done for spontaneous exercises (Should). The options menu of an exercise added for today has Edit exercise and Mark done; the Add sheet takes an optional target (such as 3 x 8) that gives set dots. Done ones show a Done tag on Today. Logic in src/logic/extras.js. Shipped.
- [x] F54 Workout Activities (Should). Separate Activities card on the Today page: BJJ and Calisthenics built in, custom activities (run, bike, yoga) with days, done check, distance and sets and reps; manage sheet to add, edit, remove. Logic in src/logic/activities.js. Shipped.
- [x] F48 Restyle the real app to the Forma layout and tokens (Should). Design board: https://claude.ai/artifact/PAsD96x1mvrnTiuGb4TtfB

## Updates

Smaller improvements to shipped features, from the design board ideas. Not mocked up.

- [ ] F44 Rest-day tokens that protect a streak (Could). Earn a token for each full week of habits; spend one to mark a missed day as rest so the streak holds. Builds on the REST DAY button and F11 streaks
- [ ] F45 Deload suggestion after 6 weeks of progressive lifting (Could). A card on Workout suggests a lighter week when weights have risen for 6 weeks running; dismiss or accept. Uses F25 progression data
- [ ] F46 Metronome in the practice timer (Could). BPM stepper and tick while the F12 timer runs; saves the BPM as the entry's best BPM on Stop. Works offline
- [x] F47 Backup nudge meter on Sync (Could). Shows days since the last export and last JSON backup, turning from calm to urgent as entries wait; complements the F33 reminder
- [x] F60 Today tab v2 redesign (Should). Shipped in five steps, 2026-11-19 (spec and "not built" list in docs/screens/today.md). Design in docs/screens/today.md (includes a SYNC NOW row under the hero), mock-ups on the Design canvas "Life Log Today v2". Build in steps, each shippable on its own: (1) short Today: hero, session card, Habits and Recent drop-downs, Log / Learn / Notes rows, sync chip replacing the Sync row and export banner, Manage habits sheet; (2) Log window trimmed to weigh-in and meals, Notes as its own window; (3) Learn window with user-defined areas, replacing Study and Guitar (F4, F16, F41); (4) `session` entry type, areas list in localStorage, read-side migration of guitar and study entries, export section per area, Quick add chips Weight / Meal / Session / Note; (5) timer moves into Learn, then retire studyView.js and practiceView.js. Check tests and the F49 screen flow after each step. Note: Learn logs `session` entries (Guitar included). Follow-up 2026-11-19: History edits sessions; Quick add's Area drop-down has "+ New area..."
- [x] F61 Auto sync of finished days to Dropbox (Should). When the app opens or returns to the foreground, unexported entries from days before today (by the day-start hour) upload to Dropbox without a tap; only a size-and-hash verified upload marks them exported; retries at most every 30 minutes; skips while a manual export is mid-way; Settings > Export has an on/off switch (default on, needs Dropbox connected). A web app cannot run while closed, so this is catch-up on open, not a timer. Today also has SYNC NOW (all entries, today included). Logic in src/logic/autoSync.js, runner in src/ui/autoSync.js
- [ ] F62 Color themes (Should). Peach, Sage, Ocean, Lavender, Mono, each light and dark, plus Auto (follow the phone). Starts with a token cleanup (about 120 hard-coded colors), then src/logic/themes.js, data-theme and data-mode on <html>, a no-flash script in index.html, theme-color updates, a contrast test for every theme, and Settings > Appearance (Theme, Mode). Plan in docs/APPEARANCE.md
- [ ] F63 Goal layouts for Today (Should). Fitness, Learning, Habits, Balanced presets set the section order, the hero metric, which drop-downs start open and the Quick add default; a Today layout window to show, hide and move sections; reset to the goal layout. Needs F60 step 1. Plan in docs/APPEARANCE.md
- [ ] F64 First-run picker (Could). Three steps for new installs (goal, theme and mode, done), Skip gives Balanced, Peach, Auto; existing installs get a What's New line; lifelog.appearance added to backup and restore. Needs F62 and F63. Plan in docs/APPEARANCE.md
- [x] F65 Today polish, direction A (Should). Built 2026-11-22 (not yet checked by eye in light and dark). Habits move into the peach hero (counted once, on the first screen); workout card gets a Switch button that opens the Workout tab's Switch template sheet (today only, Undo) and Start workout plus Rest day on one row; Sync row and storage note become one outlined notice shown only when needed; Log, Learn and Notes share one panel with action-style empty summaries; Recent is a plain row. Type scale tokens (13, 15, 17, 22, 28, 48; nothing under 13 px), sentence case, no caps overlines, SVG chevrons. Plan in docs/screens/today.md (Planned section), mock-up on the Design canvas board A

- [ ] F66 My schedules and templates (Should). Users build their own weekly schedule for any area and save any schedule as a template. A schedule is planned items on weekdays for one area; a template is a reusable copy not tied to dates, and editing a copy never edits the template. Build in three steps: (1) workouts first: replace the hardcoded SCHEDULE and SCHEDULE_3 in src/logic/template.js with a user-editable weekday map saved with the workout template (Upper/Lower stays the default), plus Save as template; (2) schedules and templates for any area, starter templates (workout, study, guitar, blank) offered per area, Today shows each area's planned items and tapping one opens the log form pre-filled; (3) schedules and templates added to the JSON backup (bump SCHEMA_VERSION) and export and import of one template as a small file. An unlogged planned item shows as Missed on History; pressing it marks it Skipped. F63 layouts stay independent and may only suggest starters. Spec in the F66 section of docs/SPEC.md (screens, wiring, user-centred rules and four open decisions; revised 2026-11-21); mock-ups on the Design canvas page "F66 Schedules". Not built.
- [x] F67 Workout tab polish pass (Should). Faster set logging and an easier way to find the next exercise, on top of the shipped F53 layout. Today header has the rest pill, a Next up button and a Done fold; Exercise has Use last, Fill all as, rep chips and a pinned Log set bar; the Rest page has a Next card and a Start after each set switch; History has search and This week, Last week and Earlier chips; the Switch sheet has a Use button; Templates and Edit template have a More actions menu and move up and down buttons. Spec and wiring in the v3 polish pass section of docs/screens/workout.md. Shipped 2026-11-22 on the new lavender, mint, butter and charcoal palette (F69). Differences from the boards: template exercises reorder with up and down buttons, not a drag handle; the dark theme is derived (the boards only had light).
- [x] F68 Log, Learn and Notes windows in the screen A style (Should). Even spacing (20 px edges and padding, 24 between sections, 16 between fields, 8 label to field and between chips), one header pattern, sentence case, one peach button per window; Log gets meal-type buttons and a saved weigh-in row; Learn gets area and minute chips, type row hidden for Guitar, a clearer More details fold and the area form in place; Notes gets a character count and a Nothing to send state. No data or action changes. Plan in docs/screens/today.md (F68 section), mock-ups on the Design canvas Today page, row "Log, Learn and Notes windows". Approved 2026-11-22
- [x] F69 App-wide palette (Should). Lavender `#EEDEF6`, mint `#CCE5E3`, butter `#FEE1B6`, charcoal `#2F2F2F` on a cream `#FFF6E3` background, applied through the tokens in `forma.css` for light and dark; the old peach tokens are gone. Dark values are derived (purple-charcoal `#17141C`, butter primary button). Contrast checked at 4.5:1 for text and about 3:1 for control borders. Shipped 2026-11-22.
- [x] F70 Templates and Exercise library redo (Should). Templates page: tone-coded cards with a count pill, focus line and exercise preview, a lavender Active card, a round Set active button, and the New template name in its own card. Exercise library: a full page (Workout menu, Exercise library) with search, equipment chips with counts, Edit (inline form, rename allowed) and Delete (confirm in the card). Logic in `src/logic/library.js` (`searchLibrary`, `updateLibraryEntry`), page in `src/ui/libraryWindow.js`, styles in `src/styles/w3-library.css` and `w3-templates.css`. Shipped 2026-11-22.
- [x] F71 History, Sync and Settings v2 (Should). Built by three agents, one per tab, on the F69 palette: History root with This week and Look closer rows, Weight, Habits, Lift progress and All entries pages (search and chips), Edit sheet with in-sheet delete; Sync as one screen with Copies meters, the three-step Free up space card, Export, Wipe, Weekly review and Backup pages and two sheets (Export | Wipe switch removed); Settings root with Theme card and grouped rows, New day starts at sheet, Rest timer and Dropbox pages. Contrast scanned in light and dark. Not built: the planned-but-not-logged ring and sheet (needs F66), templates in the backup file, a Weekly plan row. Details in the v2 sections of docs/screens/history.md, sync.md and settings.md. Shipped 2026-11-22.

## Update 2026-11-21: Today polish (F65) and weekly plans (F66)

To-do list for the two designs settled on 2026-11-21. Each group ships on its own; tick items as they land. Plans: docs/screens/today.md (Planned section) for F65, the F66 section of docs/SPEC.md for F66. Mock-ups: Design canvas "Life Log Today v2", board A on the Today page and the "F66 Schedules" page.

### Decide first

- [x] F65: does `state.wSession` (the picked workout) reset the next day? No; now day-scoped with `wSessionDay`, cleared on tab change
- [x] F65: can the Workout Switch template sheet open over the Today tab as-is? Yes through `sheetLayer`, after rows moved to `wSessionPick`
- [ ] F66: how a planned item counts as done (any session in that area that day, or a `planItemId` link on the session)
- [ ] F66: snapshot per date or versioned plans with a start date, so edits start today
- [ ] F66: do auto-saved old plans count toward the 30-template limit, or go in a separate Earlier plans group?
- [ ] F66: ticking a No target item logs a session with no minutes, or asks for minutes?

### F65 Today polish, direction A

- [x] Type scale tokens (`--fs-meta` 13 up to `--fs-num` 48) in `forma.css`; move every 9 to 12 px use up to 13; sentence case, drop the caps `h2` overline rule
- [x] Header: date line without `LIFE LOG ·`, title `Today`
- [x] Habits inside the peach hero (heading `2 of 3 habits done`, white rows, round checks, `14 days` streak text, `After your workout`); remove the Habits drop-down and the pips
- [x] Workout card: Switch button opening the Switch template sheet (title, Planned tag, focus lines, "Only today changes"), `Switched from …` with Undo, Start workout and Rest day on one row, free day `Pick a workout`
- [x] Sync notice: one outlined row shown only when entries wait or storage is unprotected; `Sync now` secondary; remove the Sync row and the separate storage note
- [x] Log, Learn and Notes in one panel with action-style empty summaries and no `·`
- [x] Recent entries as a plain row; `No entries yet` with `Load demo data` only when there are none
- [x] SVG chevrons everywhere; 72 px bottom padding so the `+` never covers a row; status tags 13 px
- [x] Update docs/screens/today.md (fold the Planned section into the main description) and the What's new list
- [x] Tests pass (334)
- [ ] Check by eye: the F49 screen flow still works, light and dark both readable (dark fix for the hero rows is in, unverified on a device)

### F66 step 1: Workout plan

- [ ] User-editable weekday map for the Workout area, saved with the workout template (Upper/Lower stays the default); replaces `SCHEDULE` and `SCHEDULE_3`
- [ ] Plan editor screen for Workout (compact empty days, "Changes start today" note, Clear plan with confirm and Undo)
- [ ] Add a planned item sheet with the workout session picker
- [ ] Save as template sheet; Template screen; Use a template sheet with "Save the old plan first"
- [ ] Today workout card and Switch sheet read the plan ("from your plan", Planned tag)
- [ ] Replace Settings > Lifting days per week with a link to the Workout plan editor; migrate the stored 3 or 4 into the plan
- [ ] Ways in: Workout > Templates and tags > Weekly plan, Settings > Weekly plans

### F66 step 2: Any area

- [ ] Plans and templates for every area; Weekly plans home (week strip, day panel, Plans by area, Saved templates)
- [ ] Ready-made starters per area with a Suggested pick; Start a plan sheet with week previews
- [ ] Add a planned item for Learn areas: recent focuses, minute chips, goal hint, Weekdays and Every day, day count on the button
- [ ] Today > Planned today: tick logs the planned amount with Undo; Adjust opens Learn pre-filled (add a Learn pre-fill entry point)
- [ ] History > Planned this week grid and Not logged list (Log it, Skip, Undo skip); per-day plan snapshots
- [ ] Learn > My areas > Edit area > Weekly plan row
- [ ] Tests for plan logic: done matching, skips, edits starting today, template copies staying independent

### F66 step 3: Backup and sharing

- [ ] Plans and templates in the JSON backup (bump SCHEMA_VERSION, merge by id, newest updatedAt wins)
- [ ] Share a template as a file and import a template file
- [ ] Update docs/SPEC.md F66 status, the screen docs and the CHANGELOG

## Update 2026-11-22: Log, Learn and Notes windows (F68)

To-do list for the window restyle approved 2026-11-22. Plan: F68 section of docs/screens/today.md. Mock-ups: Design canvas "Life Log Today v2", Today page, boards win3/Log, win3/Learn and win3/Notes.

### Shared

- [x] Spacing tokens (8, 16, 20, 24) in `windows.css` (not `forma.css`); window header (back button and title on one 56 px row, summary line), section, field, list-row and chip styles in `windows.css`
- [x] Sentence-case tags (`Waiting`, `In vault`) at 13 px

### Log

- [x] Weigh-in: label, field and outlined Save on one row; saved status row with Change
- [x] Meals: heading status, 10 px bar, white meal rows
- [x] Add a meal: four meal-type buttons pre-picked by time of day (keep the draft on a refused save); peach Save meal
- [x] Link row "Guitar and the practice timer are in Learn"

### Learn

- [x] Header summary and area chips
- [x] Timer card: heading, tabular clock, measure field, dark Stop and log, outlined Discard
- [x] Log a session: area chips (drop-down past 6 areas), type chips hidden for Guitar with the "always practice" line, minute chips that fill the field, More details fold with a summary line and focus chips
- [x] Your areas this week rows with Edit and goal bars; area form in place with "What you measure"; red Remove
- [x] Recent sessions fold with a count

### Notes

- [x] New note with a live character count and the "what you typed stays" helper
- [x] Latest notes with a waiting count; Send button turns into a disabled "Nothing to send"

### Finish

- [x] Tests pass (338); each window opened and checked at 390 px in light and dark
- [ ] Click through every action by hand on a phone (save weight, save meal, start and stop timer, edit and remove an area, save note, send to vault)
- [x] Fold the F68 section into the window sections of docs/screens/today.md, add a What's new line and a CHANGELOG entry

## Open questions

- [x] Starter habit list: Guitar, Coding, Workout (editable)
- [x] Starter exercises for Upper and Lower: from Upper-Lower-3-4-Day-Plan.pdf, see docs/TEMPLATE-upper-lower.md (all editable)
- [x] Export folder: myVault/sources/life-log/ (confirmed)
- [x] Track protein: yes, against a 160 g daily target (F13)
- [ ] App name
- [ ] Other things that should have a top 5
