# Project context: Life Log

**Purpose.** A phone-friendly web app (PWA) for fast daily logging of habits and food, workouts and bodyweight, and guitar practice. Entries save on the phone, then export as one Markdown file to Dropbox, which syncs into Brennen's Obsidian vault.

**Stack.** PWA with IndexedDB storage, offline-first, no backend in v1. Export through the phone share sheet (Save to Dropbox) with a file-download fallback. A synced backend (FastAPI with Postgres or SQLite) is an optional M3 idea.

**Phase.** Milestone 1 in progress. The spec, backlog, workout template and UI mockup are written, and the export and wipe logic and its UI are built.

**Constraints.**
- Logging must work offline and take two taps or fewer.
- One-handed use at about 400 px width, tap targets of at least 44 px.
- Each export freezes a manifest of exact entry versions (id, updatedAt). Entries are marked exported only after the user confirms the file is in Dropbox.
- Wipe is a separate step after a confirmed export. It deletes only entries in the confirmed manifest whose updatedAt is not newer than exportedAt and that are older than the keep window (7 days by default; 0 means a full wipe), in one IndexedDB transaction. It never touches lists, the workout template, settings, personal records, retained_stats or the summary store; retained_stats is stored in IndexedDB and written in the same transaction as Wipe.
- The Dropbox Markdown cannot be re-imported, so the app needs an off-device JSON backup (with a schemaVersion) and restore. Restore merges by id, the newest updatedAt wins, and it never deletes existing data.
- iOS Safari can clear site data after about 7 days idle, so the app asks for persistent storage, prompts Add to Home Screen, and reminds the user to export weekly.
- The vault is human/machine split: the app writes a new file under myVault/sources/life-log/ and never edits Brennen's own notes.

**Definition of done (v1 / M1, the 11 Must-M1 features).** Today screen, habit checklist with add and delete, quick weigh-in, guitar log, edit and delete any entry, offline install, JSON backup and restore, Markdown export with warned wipe, Settings, summary store, and storage persistence.

**Docs.** docs/SPEC.md, docs/BACKLOG.md, docs/TEMPLATE-upper-lower.md, CHANGELOG.md.
