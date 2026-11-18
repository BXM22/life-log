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
- [ ] F53 Workout tab v2 redesign (Should). Short Today list with set dots, Exercise page, sheets (Switch template, Warm-up/BJJ/Calisthenics, Add for today), dropdown menus, fixed rest bar, restyled Templates, Edit template and History pages; spec in docs/screens/workout.md. Built on branch workout-v2; tick after the browser test and merge.
- [x] F48 Restyle the real app to the Forma layout and tokens (Should). Design board: https://claude.ai/artifact/PAsD96x1mvrnTiuGb4TtfB

## Updates

Smaller improvements to shipped features, from the design board ideas. Not mocked up.

- [ ] F44 Rest-day tokens that protect a streak (Could). Earn a token for each full week of habits; spend one to mark a missed day as rest so the streak holds. Builds on the REST DAY button and F11 streaks
- [ ] F45 Deload suggestion after 6 weeks of progressive lifting (Could). A card on Workout suggests a lighter week when weights have risen for 6 weeks running; dismiss or accept. Uses F25 progression data
- [ ] F46 Metronome in the practice timer (Could). BPM stepper and tick while the F12 timer runs; saves the BPM as the entry's best BPM on Stop. Works offline
- [x] F47 Backup nudge meter on Sync (Could). Shows days since the last export and last JSON backup, turning from calm to urgent as entries wait; complements the F33 reminder

## Open questions

- [x] Starter habit list: Guitar, Coding, Workout (editable)
- [x] Starter exercises for Upper and Lower: from Upper-Lower-3-4-Day-Plan.pdf, see docs/TEMPLATE-upper-lower.md (all editable)
- [x] Export folder: myVault/sources/life-log/ (confirmed)
- [x] Track protein: yes, against a 160 g daily target (F13)
- [ ] App name
- [ ] Other things that should have a top 5
