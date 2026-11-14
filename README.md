# Life Log

A phone-friendly web app (PWA) for fast daily logging: habits and food, workouts and bodyweight, and guitar practice. Offline-first, with JSON backup and a daily Markdown export for an Obsidian vault.

**Status:** milestones 1 and 2 are built. Left in the backlog: the synced backend (M3) and the content tracker (M4).

## Features

- **Today:** habit checklist with streaks, quick weigh-in, guitar log (minutes, focus, best BPM), a practice timer that saves a guitar entry, a Kumio prep and study log, a progress summary, and a weekly export reminder banner.
- **Workout:** Upper/Lower plan with a 3-day or 4-day schedule. Logs warm-up and working sets, and timed, per-side and bodyweight sets, pre-filling the last weight with a TRY TODAY progression prompt. Each exercise has an OPTIONS menu to edit, delete or trim a set. Also: warm-up checklists, back-training cues, Monday and Wednesday calisthenics blocks with a BJJ done check, your own custom sessions, and a rest timer with a wheel for a custom time.
- **Meals:** breakfast, lunch, dinner and snack, with optional protein against a 160 g daily target and a progress bar.
- **Notes:** a brainstorm box. Each note goes to the vault as its own Markdown file.
- **History:** past entries and past workout days (edit or delete anything), a week view with a habit grid and a weight trend against 170 lb, streaks per habit and for guitar, and personal records (top 5 per lift, bodyweight, guitar BPM) that survive a wipe.
- **Sync:** daily Markdown export to Dropbox (or the share sheet), JSON backup and restore, and a warned wipe of exported logs that keeps the last 7 days.
- **Settings:** schedule (3 or 4 days), keep-days, day-start hour and the export reminder toggle.
- **Look:** the Signalbox style (warm black background, orange accent, grouped cards).

## Run and test

- Serve the folder with any static server, for example `npx serve .`, and open it on your phone or in a browser.
- Run tests with `npm test` (Node's built-in test runner, no dependencies). There is no build step.
- After changing any file the app loads, bump `CACHE` in `sw.js` and add new files to its shell list, or phones keep the old version and new modules fail offline.

## Docs

- [docs/SPEC.md](docs/SPEC.md): purpose, modules, data model, tech approach, feature scope, SDLC, risks
- [docs/BACKLOG.md](docs/BACKLOG.md): features F1 to F35 as a checklist by milestone
- [docs/TEMPLATE-upper-lower.md](docs/TEMPLATE-upper-lower.md): the Upper/Lower 3-4 day workout plan the app ships as its template
- [CHANGELOG.md](CHANGELOG.md): what changed and when

## Milestones

1. **M1 MVP:** Today screen, habits, weigh-in, guitar log, backup, Markdown export to Dropbox with warned local wipe
2. **M2 Training and food:** template-driven session logger, meals, protein, personal records, week view, streaks, practice timer, Kumio study log, export reminder
3. **M3 Vault link:** daily Markdown export, optional synced backend
4. **M4 Later tracks:** Inbox capture, content tracker

## Workflow

Trunk-based with short feature branches and pull requests. Commit messages use `feat:`, `fix:` or `docs:`. Issues map to feature IDs (F1 to F35).
