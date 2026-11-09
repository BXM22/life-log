# Life Log

A phone-friendly web app (PWA) for fast daily logging: habits and food, workouts and bodyweight, and guitar practice. Offline-first, with JSON backup and a daily Markdown export for an Obsidian vault.

**Status:** planning. No app code yet; the spec is written and milestone 1 is next.

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
