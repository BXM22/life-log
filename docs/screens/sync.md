# Sync tab

Get data off the phone and safely free space. Two sub-tabs under one tab-bar item: **Export** and **Wipe**, switched by a segmented control. Source: `src/ui/exportWipeView.js`, `syncView.js`, `backupPanel.js`, `src/dropbox/dropbox.js`.

## Header and switch

Title `SYNC`, then a two-button segmented control `EXPORT | WIPE`.

## Export sub-tab, top to bottom

1. **BACKUP METER panel:** two lines with a progress meter each: time since the last Dropbox export and since the last JSON backup. Meter fill turns red `#B3261E` (`due` or `never`) when overdue. If a copy is overdue: "A copy is overdue. Export to Dropbox and take a JSON backup."
2. **EXPORT panel** (a small flow, one step at a time):
   - *Idle:* `N entries waiting.` and `EXPORT` (disabled when nothing is waiting). Notes are excluded here, they are sent from the Notes window on Today.
   - *Built:* file name in bold and `N entries, 11-10 to 11-17`; `UPLOAD TO DROPBOX` (when connected, with the folder shown) and `DISCONNECT DROPBOX`, or `SET UP DROPBOX` when not connected; `SAVE VIA SHARE SHEET`; `CANCEL`; then a preview of the Markdown file.
   - *Shared:* "The share sheet closed" (or "The file was downloaded…"), the question **Is <file> in Dropbox?** with `YES, IT IS` and `NO`.
   - *Confirmed:* "Confirmed: <file>. Go to WIPE when you are ready." and `GO TO WIPE`.
3. **WEEKLY REVIEW panel:** "Week 11-10 to 11-16." (prefixed "It is Sunday." on review day), the review as a preformatted Markdown block (habits, weight change, lifts), and `SEND TO VAULT` (peach on Sunday, secondary other days).
4. **BACKUP fold:** auto-opens when a backup is due. Text "A copy of everything on this phone (N entries) as one file", `BACKUP NOW` (share sheet or download), a file picker and `RESTORE FROM FILE` (adds back anything missing, keeps the newest version of each entry, never deletes).
5. **Dropbox setup modal** (when `SET UP DROPBOX` is tapped): centered card, app key field, `CONNECT DROPBOX`, `CLOSE`.

## Wipe sub-tab

- Panel `WIPE` with the line "Keep the last `[0 3 7 14]` days on this phone." (select).
- **Locked state** (nothing confirmed yet): "Wipe is off until you export and confirm the file is in Dropbox." and a disabled dashed `WIPE !!` button.
- **Ready state:** "N entries are ready to wipe." and a solid red `WIPE N !!` button (disabled when nothing is old enough, with "Nothing is old enough to wipe yet.").
- **CONFIRM WIPE modal:** a red-ringed warning box: "Wipe permanently deletes N entries (11-01 to 11-10) from this phone. Open the file in Dropbox first and confirm it is there. This cannot be undone."; a checkbox "I opened the file in Dropbox and it is complete"; red `WIPE N !!` (disabled until ticked); `CLOSE`.
- Wipe removes only exported entries older than the keep window and keeps statistics, records and templates.

## Workout redesign impact (partly built)

Status 2026-11-22: **partly built.** Done: the Wipe page lists "Workout plans and templates stay as they are" under What stays (F71). Still open: plans, templates, active template and rest defaults in the JSON backup (the Backup page says they are not included yet), the template share and import pointer, and the export-after-reset check (F66 step 3). Bullets below are the original plan. From Workout v2/v3 (`workout.md`) and weekly plans (F66 step 3).

- **Backup and restore must carry plans and templates.** Add plans, template edits, the active template and the rest timer defaults to the JSON backup. Bump `SCHEMA_VERSION`, merge by id, and the newest `updatedAt` wins, so `RESTORE FROM FILE` still never deletes.
- **Today's extras** (`lifelog.wExtras`) and today's template override (`state.wSession`) are per-day. Decide whether they are backed up (probably not).
- **Share a template as a file** and **import a template file** (F66 step 3) live in Workout's Templates page. Add a one-line pointer here under `BACKUP` so people find them.
- **`Reset all to the built-in plan`** (Workout, Edit template) changes data that Sync exports. Confirm the export after a reset marks the changed templates as `WAITING`.
- **Wipe** keeps templates and statistics. Add plans to that list.

## v2 update (redesign, shipped 2026-11-22, F71)

**As built (2026-11-22).** Same palette and contrast checks as History. Classes `.sv-*` in `src/styles/w3-sync.css`; new actions `svOpen` (data-page `wipe | review | backup`), `svBack`, `svNotYet` in `createSyncActions`; state `svPage` (cleared by `resetFlow`, the tab action and `stOpen`); `svSubpage(state)` in `exportWipeView.js` tells `app.js` when to hide the big header. Nothing about what is exported, wiped, backed up or restored changed. The Export | Wipe switch (`segmented()` in `app.js`) is gone; `export` and `wipe` render the same screen.
- Root: `Copies` card with two meters (Dropbox export, backup file; red with an Overdue tag when due), the lavender `Free up space` card with three steps (Export entries is the only primary button; Confirm the file is in Dropbox; Wipe old entries locked until confirmed, then an outlined red `Wipe N entries`), and `More` rows: Weekly review, Backup and restore, Dropbox (opens Settings > Dropbox via `stOpen`).
- Export entries page: file name, count and dates, Upload to Dropbox (or Set up Dropbox), Save with the share sheet, preview, Cancel; buttons disabled with "Uploading..." while it runs.
- Sheets: "Is the file in Dropbox?" (Yes, it is there / Not yet, which returns to the same file) and "Wipe N entries?" (checkbox, red Wipe disabled until ticked). Escape closes them.
- Wipe page: count and dates, What stays rows (the Last N days row links to Settings), red Wipe set apart, Not now.
- Weekly review page (Send to vault, "Sending..." state) and Backup and restore page (what the file holds, Back up now, Choose a backup file, Restore from file).
- **Not built:** templates and rest timer settings in the backup file (needs a backup schema change; the page says so); a busy state on Back up now (it goes straight to the share sheet). Disconnect Dropbox moved to Settings > Dropbox.

### Original v2 spec

Mock-ups: Design canvas "Life Log Settings, History and Sync v2" (https://claude.ai/artifact/Uwig18H7bxcS54s1u1W4zC), Sync row, 8 phone boards, playable. The Export and Wipe sub-tabs go away. Freeing space is one ordered flow, which is the one place on these screens where numbers are a real sequence: export, confirm, wipe.

### Screens

1. **Sync, wipe locked (root):** `Copies` card with two meters (Dropbox export, backup file; red `Overdue` when due); `Free up space` card with three steps: 1 `Export entries` (primary button), 2 `Confirm the file is in Dropbox`, 3 `Wipe old entries` (lock icon, "Opens after you confirm the file"); `More` rows: `Weekly review`, `Backup and restore` (Overdue tag), `Dropbox` (opens Settings).
2. **Export entries (page):** file name, entry count and date range; `Upload to Dropbox`, `Save with the share sheet`; note that notes are sent from Today; Markdown preview; `Cancel`. When Dropbox is not connected, the first button becomes `Set up Dropbox` and opens the Connect sheet in Settings.
3. **Is the file in Dropbox? (sheet):** `Yes, it is there` or `Not yet`.
4. **Sync, wipe ready (root):** steps 1 and 2 show a check; step 3 is active with `Wipe 12 entries` (outlined red).
5. **Wipe old entries (page):** how many entries and their dates, `What stays` rows (`Last 7 days` with a `Change` link to Settings, records, plans and templates), red `Wipe N entries`, `Not now`.
6. **Wipe N entries? (sheet):** red-ringed warning, checkbox "I opened the file in Dropbox and it is complete", red button disabled until ticked, `Cancel`.
7. **Weekly review (page):** week range, Markdown review, `Send to vault`.
8. **Backup and restore (page):** card listing what the backup holds (entries, Workout plans and templates, rest timer settings), `Back up now`; `Restore` card ("adds back anything missing, keeps the newest version, never deletes") with `Choose a backup file`.

### Wiring

| From | Tap | Goes to |
|---|---|---|
| Sync (locked) | Export entries | Export entries (page) |
| Export entries | Upload to Dropbox, Save with the share sheet | Is the file in Dropbox? (sheet) |
| Export entries | Cancel, back arrow | Sync (locked) |
| Is the file in Dropbox? | Yes, it is there | Sync (wipe ready); sets the confirmed flag |
| Is the file in Dropbox? | Not yet | Export entries |
| Sync (ready) | Wipe N entries | Wipe old entries (page) |
| Wipe old entries | Wipe N entries | Wipe N entries? (sheet) |
| Wipe old entries | Change (last 7 days) | Settings |
| Wipe old entries | Not now | Sync (ready) |
| Wipe N entries? | Wipe (after ticking) | Sync, with 0 entries waiting; runs `wipe` |
| Wipe N entries? | Cancel | Wipe old entries |
| Sync | Weekly review, Backup and restore | the matching page |
| Sync | Dropbox | Settings, Dropbox page |
| Any tab icon | tap | that tab's root |

### Build notes

- Reuse `build`, `upload`, `share`, `confirmYes`, `confirmNo`, `sendReview`, `backup`, `restore`, `openDropbox`, `wipe`; the logic is unchanged. Only the sub-tab state (`exportWipe`) is replaced by a page and sheet stack. `confirmYes` sets the flag that unlocks step 3.
- Wipe stays locked until a confirmed export exists and keeps the existing rules: only exported entries older than the keep window are removed; statistics, records, plans and templates stay.
- Backup and restore carry plans, templates and rest settings (see the impact section above).
- Open questions: how the root looks after a wipe finishes (0 waiting, steps reset); whether the confirmed flag expires.

## Design style

- **Segmented control:** two pill buttons (40 px) in a cream track with 4 px padding and 24 px radius; the current one is solid ink with white text (`aria-current="page"`).
- **Meters:** thin rounded bars on a hairline track; fill is ink/peach when fine and **red `#B3261E`** when due or never done.
- **Flow panels:** one cream card, one primary peach button per step; secondary white buttons for alternatives; the YES / NO confirmation is two stacked pills.
- **Review block:** monospace-style preformatted text on a light inset.
- **Danger (the only red-heavy screen):** `WIPE N !!` is a solid red `#B3261E` pill with white text; disabled it becomes white with a dashed hairline and muted text. The confirm warning has a 2 px red border, 24 px radius, ink text on a soft ground.
- **Modals:** centered cream card with an H2 overline, content, and a secondary `CLOSE`; scrim behind it.
- **Tone:** blunt and explicit about irreversible actions; every destructive step needs a typed-in confirmation (checkbox) after a Dropbox check.

## Reference

| Thing | Where |
|---|---|
| Export and Wipe views, Dropbox modal | `src/ui/exportWipeView.js` |
| Meter, weekly review, modal helper | `src/ui/syncView.js`, `src/logic/backupNudge.js`, `src/logic/weeklyReview.js` |
| Backup and restore | `src/ui/backupPanel.js`, `src/logic/backup.js`, `src/db/backupStore.js` |
| Export builder (Markdown, manifest) | `src/logic/exportBuilder.js`, `src/logic/notesExport.js` |
| Wipe rules | `src/logic/wipeEligibility.js` (`planWipe`, `markExported`) |
| Dropbox | `src/dropbox/dropbox.js`, `src/ui/syncActions.js` |
| Actions | `build`, `upload`, `share`, `confirmYes`, `confirmNo`, `sendReview`, `backup`, `restore`, `toggleBackup`, `openDropbox`, `connect`, `disconnect`, `openWipe`, `tick`, `wipe`, `closeModal`, `setKeep` |
| Backlog items | F7, F14, F15, F27, F37, F43, F47 in `docs/BACKLOG.md` |
