# Changelog

## Unreleased

- feat: finish M2 with the meal log (F9): Breakfast/Lunch/Dinner/Snack plus a name on Today, edit or delete in History, a Meals section in the export; and Notes (F17 early): a brainstorm box on Today that sends one Markdown file per note (front matter, status idea) to myVault/sources/life-log/notes/ by Dropbox or share sheet; 92 tests (2026-11-10)

- feat: rest timer on the Workout tab with 1:00 to 3:00 presets, an iOS-style wheel for a custom time, auto-start after a working set, and a countdown that survives closing the app (F23); 83 tests (2026-11-09)
- feat: edit or delete each logged set right on the Workout tab (2026-11-09)
- feat: add, edit and delete exercises in any workout session, or reset to the built-in plan; edits are kept on the phone and survive a wipe (F20); 77 tests (2026-11-09)
- feat: iPhone-style layout: bottom tab bar with icons, large screen titles, Today summary, Sync tab with Export/Wipe switch, floating messages, 16px-safe inputs (2026-11-09)
- feat: Workout tab with the Upper/Lower template, warm-up and working sets, last-weight pre-fill, timed, per-side and bodyweight sets, and a Today's session panel (F8, F21, F22, F24); lift sets export under a Workout section and the last working set per lift survives a wipe; 70 tests (2026-11-09)
- feat: new installs start with Guitar, Coding and Workout habits, added once (2026-11-09)
- feat: finish M1: guitar focus and best BPM (F4), History tab with bodyweight history and edit/delete (F3, F5), Settings tab with saved keep-days and day-start (F26), Add to Home Screen prompt (F28); 55 tests (2026-11-09)
- feat: offline-first PWA with IndexedDB store, JSON backup and restore, Markdown export, direct Dropbox upload (OAuth PKCE) and warned local wipe (2026-11-09)
- docs: add spec, feature backlog and SDLC plan (2026-11-07)
- docs: add export-to-Dropbox and warned local wipe (F14, now M1) (2026-11-07)
- docs: add personal records, top 5 per lift, bodyweight, guitar BPM (F19, M2) (2026-11-07)
- docs: add UI design and color palette (Color Hunt, orange and slate) (2026-11-07)
- docs: add Manage screen for exercises and habits (F2 updated, F20 added) (2026-11-07)
- docs: use the Upper/Lower 3-4 day plan as the workout template (F21-F25, F29-F32), add docs/TEMPLATE-upper-lower.md (2026-11-07)
- docs: add Settings, History, Week view, summary store, storage persistence (F26-F28); wipe now keeps the last 7 days by default (2026-11-07)
- docs: move Kumio study log (F16) to M2; propose export folder myVault/sources/life-log/ (2026-11-07)
- docs: confirm export folder myVault/sources/life-log/; new export sample with warm-up, per-side and timed sets; add weekly export reminder (F33) (2026-11-08)
