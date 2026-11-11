# Life Log

A phone-friendly web app (PWA) for fast daily logging: habits and food, workouts and bodyweight, and guitar practice. Offline-first, with JSON backup and a daily Markdown export for an Obsidian vault.

**Status:** milestones 1 and 2 are built; the backlog tracks what remains (week view, streak extras, personal records, Kumio log).

## Features

- **Today:** habit checklist with streaks, quick weigh-in, guitar log (minutes, focus, best BPM) and a progress summary.
- **Workout:** Upper/Lower plan with a 3-day or 4-day schedule. Logs warm-up and working sets, and timed, per-side and bodyweight sets, pre-filling the last weight. Add, edit or delete exercises, create your own sessions, and use a rest timer with a wheel for a custom time.
- **Meals:** breakfast, lunch, dinner and snack, with optional protein against a 160 g daily target and a progress bar.
- **Notes:** a brainstorm box. Each note goes to the vault as its own Markdown file.
- **History:** past entries and past workout days. Edit or delete anything.
- **Sync:** daily Markdown export to Dropbox (or the share sheet), JSON backup and restore, and a warned wipe of exported logs that keeps the last 7 days.
- **Settings:** schedule (3 or 4 days), keep-days and day-start hour.
- **Look:** the Signalbox style (ink-teal background, lime accent, grouped cards).

## Run and test

- Serve the folder with any static server, for example `npx serve .`, and open it on your phone or in a browser.
- Run tests with `npm test` (Node's built-in test runner, no dependencies).

## Docs

- [docs/SPEC.md](docs/SPEC.md): purpose, modules, data model, tech approach, feature scope, SDLC, risks
- [docs/BACKLOG.md](docs/BACKLOG.md): features F1 to F33 as a checklist by milestone
- [docs/TEMPLATE-upper-lower.md](docs/TEMPLATE-upper-lower.md): the Upper/Lower 3-4 day workout plan the app ships as its template
- [CHANGELOG.md](CHANGELOG.md): what changed and when

## Milestones

1. **M1 MVP:** Today screen, habits, weigh-in, guitar log, backup, Markdown export to Dropbox with warned local wipe
2. **M2 Training and food:** template-driven session logger, meals, week view, streaks, Kumio study log
3. **M3 Vault link:** daily Markdown export, optional synced backend
4. **M4 Later tracks:** Inbox capture, content tracker

## Workflow

Trunk-based with short feature branches and pull requests. Commit messages use `feat:`, `fix:` or `docs:`. Issues map to feature IDs (F1 to F33).
