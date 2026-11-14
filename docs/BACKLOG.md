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

- [ ] F15 Synced backend and direct Dropbox upload (Could)

## M4 Later tracks

- [x] F17 Inbox quick capture (Could). Shipped early as Notes on the Today tab: title and body, sent to the vault as one .md file per note in myVault/sources/life-log/notes/
- [ ] F18 Content posting tracker (Could)

## Open questions

- [x] Starter habit list: Guitar, Coding, Workout (editable)
- [x] Starter exercises for Upper and Lower: from Upper-Lower-3-4-Day-Plan.pdf, see docs/TEMPLATE-upper-lower.md (all editable)
- [x] Export folder: myVault/sources/life-log/ (confirmed)
- [x] Track protein: yes, against a 160 g daily target (F13)
- [ ] App name
- [ ] Other things that should have a top 5
