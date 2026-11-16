# Life Log maintenance and bug-fix guide

How to change Life Log safely after launch. It follows a small software development life cycle (SDLC): triage, reproduce, fix, test, release, verify, record.

Life Log is a static PWA with no build step and no backend. Data lives in the phone's IndexedDB, so a bad release can hurt real data. The data rules in section 6 matter most.

## 1. Quick reference

| Thing | Where |
| --- | --- |
| Run tests | `npm test` (Node's built-in runner, files in `tests/`) |
| Run locally | Serve the folder with any static server, then open `index.html` |
| Live app | Vercel project `life-log`, auto-deploys every push to `main` |
| Offline cache | `sw.js`: `CACHE` version and the `SHELL` file list |
| Backup format | `src/logic/backup.js`: `SCHEMA_VERSION` |
| Database | `src/db/store.js`: `DB_NAME`, `VERSION`, `onupgradeneeded` |
| Backlog | `docs/BACKLOG.md` |
| Change record | `CHANGELOG.md`, newest entry first under Unreleased |

## 2. Roles

One person does everything, so the stages below are a checklist, not a hand-off. Skipping a stage is how bugs return.

## 3. Bug-fix life cycle

### Stage 1: Triage (5 minutes)

1. Write the bug in one sentence: what you did, what you expected, what happened.
2. Rate it.

| Level | Meaning | Response |
| --- | --- | --- |
| P0 | Data lost, corrupted or unexportable | Stop everything. Fix first. |
| P1 | A main screen is broken (Today, Workout, Export) | Fix this session. |
| P2 | Wrong but workable (bad total, odd layout) | Add to `docs/BACKLOG.md`, fix soon. |
| P3 | Cosmetic | Backlog. |

3. For P0, stop logging and take a JSON backup from the Sync tab if the app still opens.

### Stage 2: Reproduce

1. Find the smallest set of steps that shows the bug.
2. Note the device and browser (iPhone Safari, desktop Chrome) and whether it is the installed PWA or a browser tab.
3. Check for a stale cache before anything else. Close the installed app fully and reopen it, or clear site data in a browser tab. Most "I fixed it but nothing changed" reports are an old service worker (see section 5).
4. If it can't be reproduced after 15 minutes, write down what you tried in the backlog and move on.

### Stage 3: Find the cause

Logic lives apart from screens, which makes bugs easy to isolate.

| Symptom | Look in |
| --- | --- |
| Wrong number, date, streak, record, export text | `src/logic/` |
| Saved data wrong or missing | `src/db/` and `src/logic/entries.js` |
| Screen layout or button behavior | `src/ui/`, `src/styles/main.css` |
| Dropbox upload or sign-in | `src/dropbox/dropbox.js` |
| Works online, breaks offline | `sw.js` |

Logic files are plain functions, so you can call them from a test with the bad input and watch it fail. That is the fastest way to confirm the cause.

### Stage 4: Write a failing test first

1. Add a test to the matching file in `tests/` (or a new `tests/<topic>.test.js`).
2. Run `npm test` and confirm the new test fails for the reason you expect.
3. UI-only bugs with no testable logic can skip this. Say so in the changelog line.

### Stage 5: Fix

1. Make the smallest change that fixes the cause. Do not refactor in the same commit.
2. Keep files under 500 lines. If a fix pushes a file over, split it in a separate commit.
3. Run `npm test`. Everything must pass, including old tests.
4. Open the app and repeat the reproduction steps from Stage 2. Also try one neighboring flow (for an Export bug, also check Wipe's warning).

### Stage 6: Release

Follow section 4. A fix that touches a file in `SHELL` needs a cache bump.

### Stage 7: Verify live

1. Wait for the Vercel deployment to show `READY` for your commit (Vercel dashboard, or ask Claude to check).
2. Open the live URL on the phone. Fully close and reopen the installed app so the new service worker takes over.
3. Repeat the reproduction steps once more on the live app.
4. If it is still broken, check the cache version in the deployed `sw.js` before changing code.

### Stage 8: Record

1. Add one line to `CHANGELOG.md` under Unreleased: type, what changed, test count, cache version, date.
2. If the bug came from the backlog, tick it in `docs/BACKLOG.md`.
3. If the cause was a rule you forgot, add it to this guide.

## 4. Release checklist

Run this before every push to `main`.

- [ ] `npm test` passes
- [ ] The change works in a browser (and on the phone for UI or Dropbox changes)
- [ ] New or renamed `.js` or `.css` files are listed in `SHELL` in `sw.js`
- [ ] `CACHE` in `sw.js` is bumped (`life-log-shell-v26` becomes `v27`) if any shell file changed
- [ ] `CHANGELOG.md` has a new line
- [ ] No secrets staged (`.env`, keys, tokens)
- [ ] Commit message is `type: short description` (`feat`, `fix`, `docs`, `style`, `test`, `refactor`)

Then push to `main`. Vercel deploys it by itself. There is no staging site, so test locally first. If a bad release goes out, roll back (section 8).

## 5. The service worker rule

The app is offline-first. `sw.js` caches the app shell, so the phone keeps serving old files until the cache name changes.

- Change a shell file without bumping `CACHE`: users keep the old version.
- Add a file but forget it in `SHELL`: the app works online and breaks offline.
- Bump `CACHE`: the next visit drops old files. Users may need to close and reopen the app once.

Dropbox sign-in redirects back to the page URL. If the site's address changes, add the new URL as a redirect URI in the Dropbox app settings.

## 6. Data safety rules

Entries are stored only on the phone until exported. Treat the database like someone else's data.

1. Never change stored data shapes without a migration. A new IndexedDB store or index needs a `VERSION` bump in `src/db/store.js` and an `onupgradeneeded` branch that leaves existing data alone.
2. Backups carry `schemaVersion`. If the backup shape changes, bump `SCHEMA_VERSION` in `src/logic/backup.js`, keep reading old versions, and add a test that restores an old backup.
3. Restore merges by id, the newest `updatedAt` wins, and it never deletes. Keep it that way.
4. Export marks nothing exported until you confirm. Wipe deletes only confirmed, old-enough entries, in one transaction. Do not weaken either rule, and re-run `tests/exportWipe.test.js` and `tests/retainedStats.test.js` after touching export, wipe or stats code.
5. The exported Markdown cannot be re-imported, so the JSON backup is the real safety net. Take one before any risky release.

## 7. Routine maintenance

| How often | Task |
| --- | --- |
| Weekly | Export to Dropbox and take a JSON backup (the export reminder banner covers this) |
| Weekly | Skim the Vercel deployment list for `ERROR` builds |
| Monthly | Run `npm test`, then try one full day on the live app: habits, meal, workout, export |
| Monthly | Review `docs/BACKLOG.md`: re-rank, drop what no longer matters |
| Each browser or iOS update | Open the installed app and check Today, Workout and Export still work |
| Quarterly | Confirm the Dropbox sign-in still works. Reconnect if it was revoked. |

## 8. Rollback

If a release breaks the app:

1. In the Vercel dashboard, open the `life-log` project, pick the last good deployment and use Promote to Production (or Instant Rollback). This takes about a minute and needs no code change.
2. Rolling back the site does not touch data on phones. It also does not undo a database migration, so a release that changed `VERSION` cannot be rolled back safely. Ship a forward fix instead.
3. Open the live app, fully close and reopen it, and confirm it works.
4. Then fix the cause on `main` with Stages 3 to 8. Do not rely on the rollback staying in place.

## 9. Adding a feature

Features follow the same shape:

1. Add or update the item in `docs/BACKLOG.md` and `docs/SPEC.md`.
2. Write logic in `src/logic/` with tests, then the UI in `src/ui/`.
3. Run the release checklist, then record it in `CHANGELOG.md`.
4. Update `README.md` if the status or feature list changed.

## 10. Known limits

- No staging site. Test locally before pushing.
- No error tracking. A bug is only seen when you see it, so use the app daily and write down friction.
- IndexedDB can be cleared by the browser after long inactivity on some phones. Weekly exports and JSON backups are the protection.
