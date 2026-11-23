# Settings tab

Preferences stored on this device only (`src/logic/settings.js`). Source: `src/ui/settingsView.js`.

## Screen, top to bottom

Each section is an H2 overline, a grouped cream card of 56 px rows (label left, value or control right) and an optional small note under it.

1. **APPEARANCE**
   - `Theme`: select `System`, `Light`, or `Dark` (default System).
   - Note: "System follows your phone setting. Light and Dark stay fixed."
   - Stored as `theme` in `lifelog.settings`. Applied via `src/logic/theme.js` (`data-theme` on `html`, `color-scheme`, `theme-color` meta, iOS status bar).
2. **TRAINING AND DAYS**
   - `Keep last days after a wipe`: select 0, 3, 7, 14 (default 7).
   - `Lifting days per week`: select 3 or 4 (default 4).
   - `New day starts at`: select `midnight` or `1:00 AM` to `6:00 AM` (default 4:00 AM).
   - Note: the lifting plan for the choice (`Tue Upper A, Thu Lower, Sat Upper B.` or with `Sun Upper C`) and "Logs made before the start hour count toward the previous day."
3. **EXPORT**
   - `Auto-sync finished days to Dropbox`: toggle switch (on by default; does nothing until Dropbox is connected). Stored under `lifelog.autoSync`.
   - `Remind me to export weekly`: toggle switch (on by default).
   - Notes: auto-sync uploads the days before today when you open the app; it cannot run while the app is closed, and notes still send from the Today tab. The reminder turns the Today header chip to `Export due` when the last export is 7 or more days old, and sends a notification if the browser supports and you allow them.
4. **STORAGE AND DROPBOX**
   - Row `Dropbox` with `Set up >` (opens the Dropbox setup modal) or `Connected`.
   - Note: the storage status line, plus an install hint (iOS Add to Home Screen steps) when relevant.
   - When connected: note `Exports go to <folder>/` and a secondary `DISCONNECT DROPBOX`; otherwise "Connect from the EXPORT tab."
   - `ADD TO HOME SCREEN`: peach button, shown only when the browser offers an install prompt.
5. **WHAT'S NEW**: the newest five update lines, each row a sentence on the left and a date (`11-17`) on the right. Edit the list in `src/logic/updates.js`.

## Workout redesign impact (planned, not built)

Status: **planned.** From Workout v2/v3 (`workout.md`) and weekly plans (F66).

- **`Lifting days per week` (3 or 4) goes away.** It picks a hard-coded plan (`Tue Upper A, Thu Lower, Sat Upper B`, plus `Sun Upper C`). F66 step 1 replaces it with an editable weekday plan inside Workout. Remove the select and the plan note, and keep `setPlanDays` only as a one-time migration that seeds the new plan from the old value.
- **Rest timer defaults need a home.** Workout v3 reads `state.rest.auto` (auto-start after a set) and the saved rest length. Today they live only on the rest page. Either add a `Rest timer` group here (`Start rest after each set` switch, default length select) or document that they stay on the rest page. Pick one before building board 17.
- **Plan note under `New day starts at`:** keep the "Logs made before the start hour count toward the previous day" sentence; drop the lifting-plan sentence.
- **Reset to built-in plan:** the new Edit template screen has `Reset all to the built-in plan` (with a confirmation). Settings gets no copy of it.
- **Tab bar space:** if the 72 px reserved strip becomes a global rule, this screen's scroll container needs the same `padding-bottom: calc(72px + 16px + env(safe-area-inset-bottom))`.

## v2 update (redesign, planned, not built)

Mock-ups: Design canvas "Life Log Settings, History and Sync v2" (https://claude.ai/artifact/Uwig18H7bxcS54s1u1W4zC), Settings row, 6 phone boards, 390 wide, playable. Same rules as Workout v2 and Today F65: one calm root screen, pages for work you stay in, sheets for quick choices, switches and segmented controls inline for two to four options. Sentence case, nothing under 13 px, no all-caps overlines, no `·` joins. Reserve the 72 px tab bar strip on every page.

### Screens

1. **Settings (root):** title; Theme segmented control (System, Light, Dark); `Your day` group: `New day starts at` row (opens sheet) and `Keep after a wipe` segmented (0, 3, 7, 14 days); `Training` group: `Weekly plan` (opens the plan in Workout), `Rest timer` (page); `Backup` group: `Dropbox` (page), `Remind me to export weekly` switch; one note that data stays on this phone. The old `Lifting days per week` select and its plan sentence are removed.
2. **Rest timer (page):** `Start rest after each set` switch (`state.rest.auto`), `Default length` chips 0:45, 1:00, 1:30, 2:00, 3:00, Custom (the saved rest length). Note that the rest page can still change it during a workout.
3. **New day starts at (sheet):** radio rows Midnight to 6:00 AM, `Use 4:00 AM` confirms, `Cancel` closes. Row tap only selects.
4. **Dropbox, connected (page):** status and last export, `Upload finished days` switch (`lifelog.autoSync`), a `Go to Sync` row, `Disconnect Dropbox`. Auto-sync moves here from the Export group because it does nothing until connected.
5. **Dropbox, not connected (page):** explanation, `Connect Dropbox`, the same switch turned off.
6. **Connect Dropbox (sheet):** app key field, `Connect`, `Cancel`.

### Wiring

| From | Tap | Goes to |
|---|---|---|
| Settings | New day starts at | New day starts at (sheet) |
| Settings | Rest timer | Rest timer (page) |
| Settings | Dropbox | Dropbox page (connected or not, by state) |
| Settings | Weekly plan | Workout tab, plan page (F66 step 1; not on this canvas) |
| New day starts at | Use, Cancel | Settings; Use saves `dayStart` via `setDayStart` |
| Rest timer | back arrow | Settings; both controls save immediately |
| Dropbox (connected) | Go to Sync | Sync tab |
| Dropbox (connected) | Disconnect Dropbox | Dropbox (not connected); keeps files in Dropbox, turns exports and wipe off |
| Dropbox (not connected) | Connect Dropbox | Connect Dropbox (sheet) |
| Connect Dropbox | Connect, Cancel | Dropbox (connected); Dropbox (not connected) |
| Any tab icon | tap | that tab's root |

### Build notes

- `setPlanDays` stays only as a one-time migration that seeds the weekly plan from the old 3 or 4 value, then the control is removed. `setKeep`, `setDayStart`, `setExportReminder`, `setAutoSync`, `openDropbox`, `disconnect` keep their current behaviour; the views change.
- Add a rest settings store (`state.rest.auto`, saved length) read by the Workout rest bar, Rest timer page and Log set.
- Open question: the mock-up writes the Settings copy fresh. Check it before building. `What's new` is unchanged and not drawn.

## Design style

- **Layout:** Forma settings screen: grouped cream cards, label left, value right, hairline dividers between rows (`var(--hairline)` / `#EADFD5` in light), 56 px minimum row height, 15 px weight 600 labels.
- **Select rows:** the native select is hidden behind plain right-aligned bold text with a right chevron; tapping opens the system picker.
- **Toggle:** iOS-style switch built from the checkbox (`role="switch"`), the knob slides unless reduced motion is on.
- **Link rows:** `button.setrow.setbtn` with a trailing chevron drawn by CSS.
- **Notes:** 12 to 13 px muted text (`var(--dim)`) below each group.
- **What's New rows:** body-weight (500) text, 13 px muted date at the right that does not wrap; rows grow with the text.
- **Buttons:** `DISCONNECT DROPBOX` secondary; `ADD TO HOME SCREEN` primary peach.
- **No danger red** on this tab; wiping lives on Sync.
- **Theme:** light tokens in `:root`, dark under `html[data-theme="dark"]` in `src/styles/forma.css`. An inline script in `index.html` applies the theme before CSS paints.

## Reference

| Thing | Where |
|---|---|
| View | `src/ui/settingsView.js` |
| Settings model, options, defaults | `src/logic/settings.js` (`KEEP_OPTIONS`, `DAY_START_OPTIONS`, `PLAN_DAYS_OPTIONS`, `THEME_OPTIONS`, `loadSettings`, `saveSettings`) |
| Theme apply / resolve | `src/logic/theme.js` (`resolveTheme`, `applyTheme`, `watchSystemTheme`) |
| Update log | `src/logic/updates.js` |
| Export reminder | `src/logic/exportReminder.js` |
| Auto sync | `src/logic/autoSync.js`, `src/ui/autoSync.js` |
| Install messages | `src/logic/install.js` |
| Dropbox | `src/dropbox/dropbox.js`, `src/ui/exportWipeView.js` (`dropboxModal`) |
| Actions | `setTheme`, `setKeep`, `setPlanDays`, `setDayStart`, `setExportReminder`, `setAutoSync`, `install`, `openDropbox`, `disconnect` |
| Styles | `.setlabel`, `.setgroup`, `.setrow`, `.setnote` in `src/styles/forma.css` |
| Backlog items | F26, F27, F28, F31, F33, F43 in `docs/BACKLOG.md` |
