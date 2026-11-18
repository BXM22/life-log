# Sync tab

Get data off the phone and safely free space. Two sub-tabs under one tab-bar item: **Export** and **Wipe**, switched by a segmented control. Source: `src/ui/exportWipeView.js`, `syncView.js`, `backupPanel.js`, `src/dropbox/dropbox.js`.

## Header and switch

Title `SYNC`, then a two-button segmented control `EXPORT | WIPE`.

## Export sub-tab, top to bottom

1. **BACKUP METER panel:** two lines with a progress meter each: time since the last Dropbox export and since the last JSON backup. Meter fill turns red `#B3261E` (`due` or `never`) when overdue. If a copy is overdue: "A copy is overdue. Export to Dropbox and take a JSON backup."
2. **EXPORT panel** (a small flow, one step at a time):
   - *Idle:* `N entries waiting.` and `EXPORT` (disabled when nothing is waiting). Notes are excluded here, they are sent from the Study window on Today.
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
