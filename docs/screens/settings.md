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
