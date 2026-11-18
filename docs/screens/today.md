# Today tab

Quick daily logging and a glance at how today is going. Source: `src/ui/todayView.js`, `todayWindows.js`, `quickAddView.js`, `mealView.js`, `notesView.js`, `practiceView.js`, `studyView.js`.

## Main screen, top to bottom

1. **Header:** overline `LIFE LOG · <weekday, date>`, title `TODAY`.
2. **Export reminder banner** (conditional): shown when the last export is 7 or more days old and the Settings reminder is on. Also shows "You have never exported" on a fresh install. Source: `reminderBanner`.
3. **Hero card (peach):** big `done/total` of habits (`2/3`), caption "habits done today", and a row of small pips, one per habit, filled when done.
4. **Sync row:** row button, text `N waiting to export` or `Everything exported`; opens the Sync tab.
5. **Storage note** (conditional): one line when storage is unprotected, with the Add to Home Screen hint.
6. **HABITS panel** (`HABITS 11-17`):
   - One row per habit: checkbox, name, streak badge (`4d`) when the streak is 1 or more, and an `X` button to remove the habit.
   - Starter habits on a fresh install: Guitar, Coding, Workout.
   - Below the list: a "New habit" text field (max 40) and `ADD HABIT`.
   - Empty state: "No habits yet. Add one below."
7. **TODAY'S SESSION panel:**
   - Text `Upper A: Upper chest and back`, or "No lifting scheduled. BJJ, rest or a walk." when the schedule has nothing today.
   - `START WORKOUT` (or `PICK A WORKOUT` on a free day) switches to the Workout tab.
   - `REST DAY` button with a note: marks the Workout habit done as "rest" so the streak continues. It becomes `UNDO REST DAY` once used, and disappears if a real workout is already checked.
8. **Two window rows** (row buttons with a small caption above the value):
   - `LOG`: value `Guitar: 30 min` summary, or "Practice timer running". Opens the Log window.
   - `STUDY`: value like `45 min today · 2 notes`. Opens the Study window.
9. **LATEST panel:** the 8 newest entries as rows `11-17 <entry label>` with a status tag (`WAITING` or `EXPORTED`).
   - Empty state: "No entries yet." plus a `LOAD DEMO DATA` button.
   - `EDIT OR DELETE ENTRIES` opens the History tab.
10. **Quick add FAB:** round peach `+` button, bottom right, above the tab bar.

## Quick add sheet (bottom sheet)

Opened by the `+` button. Title `QUICK ADD`, a close `X`, and five kind chips: **Weight, Meal, Guitar, Study, Note**. The fields below change with the chip (declared in `src/logic/quickAdd.js`: number, text or textarea fields with placeholders). `SAVE` stores the entry for today and closes. The scrim behind it closes the sheet.

## Log window (back arrow returns to Today)

Title `Log`. Three panels:

- **WEIGH-IN:** weight (lb, step 0.1) and `SAVE`. Accepts 50 to 600.
- **GUITAR:** minutes, best BPM (optional), focus (optional, suggestions: technique, songs, theory, improvisation); `SAVE GUITAR` and `START TIMER` (opens the timer window).
- **MEALS:**
  - Protein progress line `Protein 85 / 160 g (75 to go)` and a progress bar.
  - Today's meals as rows (meal type left, name and grams right).
  - Fields: meal type select (Breakfast, Lunch, Dinner, Snack; defaults by time of day), "What you ate" (max 60), "Protein in grams (optional)"; `SAVE MEAL`.
  - Empty state: "No meals logged yet today."

## Practice timer window (back returns to Log)

Title `Practice timer`.
- **Idle:** optional focus field, `START PRACTICE`.
- **Running:** large live clock, "Practising: <focus>. Stopping logs N min of guitar.", optional best BPM, `STOP AND LOG` and `DISCARD`. The timer survives closing the app.

## Study window (back returns to Today)

Title `Study and notes`. Two panels:

- **KUMIO** (study log): "Today N min"; the 5 newest study rows; fields Type (prep or study), Topic (with suggestions from your subjects), Minutes, Notes (optional); `SAVE STUDY`. A **My subjects** list with an `X` to remove each, and a "New subject" field plus `ADD`. Subject chips above the fields fill the topic in one tap.
- **NOTES** (brainstorm box): optional title (max 80), note body (max 5000, textarea), `SAVE NOTE`; the 5 newest notes with a `WAITING` or `IN VAULT` tag; `SEND N NOTES TO VAULT` (disabled when none are waiting). A refused save keeps what you typed.

## Data written from this tab

`habit_check`, `weigh_in`, `guitar`, `meal`, `study`, `note` entries (see `src/logic/entries.js`). Rest days are a `habit_check` with `rest: true`. Study subjects live in localStorage.

## Design style

- **Mood:** calm, white page with cream cards; the only strong color is peach, used for the one thing to act on (hero, primary button, FAB).
- **Hero card:** peach `#F4A28C`, 24 px radius, number 48/52 weight 800 in ink, caption 15 weight 600. Pips under it are small round dots, filled ink when done.
- **Panels:** cream `#FBF3EC`, 24 px radius, 20 px padding, 12 px gap; H2 overline 12 px weight 700, 0.04em tracking, color `#5A5A5F`.
- **Rows:** `rowbtn` is 56 px tall, 16 px radius, cream, title weight 700, chevron right; pressed state fills `#FDE8E0`. The Log and Study rows stack a small caption (`LOG`, `STUDY`) over the value.
- **Habit rows:** native checkbox with the habit name; streak is a small pill (`4d`) next to the name; remove `X` is a small secondary button.
- **Buttons:** primary peach 56 px pill with ink text; secondary white with a hairline; no danger red on this tab.
- **Quick add FAB:** 56 px round peach button with ink `+` and a soft peach shadow `0 6px 18px rgba(244,162,140,.55)`, fixed bottom right above the tab bar.
- **Sheet:** white bottom sheet over a dim scrim; kind chips are pills (selected peach); fields are 56 px white with a hairline.
- **Status tags:** 12 px weight 700 pills, ink text on both: `WAITING` on peach `#F4A28C`, `EXPORTED` on soft peach `#FDE8E0`. (They were unreadable until the 2026-11-17 fix: `main.css` set the text to the same pale color as the background.)
- **Motion:** press feedback only; respects reduced motion.

## Reference

| Thing | Where |
|---|---|
| Tab view and panels | `src/ui/todayView.js` |
| Log, timer and Study windows, Today rows | `src/ui/todayWindows.js`, `src/logic/todayWin.js` |
| Quick add sheet, collapsible helper | `src/ui/quickAddView.js`, `src/logic/quickAdd.js`, `src/ui/todayActions.js` |
| Meals, notes, practice, study panels | `mealView.js`, `notesView.js`, `practiceView.js`, `studyView.js` (all `src/ui/`) |
| Habits, streaks, rest day | `src/logic/habits.js`, `src/logic/retainedStats.js`, `src/logic/streaks.js` |
| Entry shapes and validation | `src/logic/entries.js` |
| Actions (`data-action`) | `toggleHabit`, `addHabit`, `deleteHabit`, `toggleRestDay`, `openTodayWin`, `closeTodayWin`, `openTimer`, `logWeighIn`, `logGuitar`, `logMeal`, `logStudy`, `logNote`, `exportNotes`, `practiceStart`, `practiceStop`, `practiceDiscard`, `openQuick`, `closeQuick`, `quickKind`, `saveQuick`, `demo` |
| Styles | `src/styles/forma.css` (loaded last), `main.css`, `today.css` |
| Backlog items | F1 to F4, F9, F12, F13, F16, F17, F36, F41, F43, F49 in `docs/BACKLOG.md` |
