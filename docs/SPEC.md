# Life Log App Spec

2026-11-07 · Brennen

## Purpose and scope

Life Log is a phone-friendly web app that turns daily logging into a ten-second habit, so Brennen can see progress on food, training and guitar without opening a spreadsheet.

**Goals**

- Log any entry in two taps or fewer from a phone.
- See today's status and the week's trend on one screen.
- Save logs on the phone, then export them as Markdown to Dropbox so they sync into the Obsidian vault, which stays the long-term record.

**v1 covers three tracks**

- Daily habits and food
- Workouts and bodyweight (Upper/Lower program, 185 lbs toward 170 lbs, lean)
- Guitar practice (time, BPM progress, content posted)

**Not in v1:** Kumio prep log, inbox capture, photo/video planning, accounts for other users. These come in later milestones (see Build plan).

## Logging modules

Each track has one quick-log action on the home screen and one history list.

| Track | Fields logged | Quick-log flow | History shows |
| --- | --- | --- | --- |
| Habits and food | Habit checklist (done/not), meal name, meal type, protein (g, optional), water, energy 1-5 | Tap a habit to tick it; tap + Meal, pick type, type a name | Per-day checklist, 7-day habit grid, meals by day |
| Workouts and weight | Date, day type (Upper/Lower), exercise, sets x reps x weight (lb), bodyweight (lb) | Pick today's day, tap an exercise, add sets; separate Weigh-in button | Past sessions, last weight per exercise, bodyweight chart |
| Guitar | Minutes practiced, focus (theory, technique, song), best BPM, content posted (yes/no, platform) | Timer or manual minutes, one BPM field | Practice minutes per week, BPM best over time, posting log |

**Defaults that save taps:** the app pre-fills the last used exercise weights, the last meal type for the time of day, and today's date. Every entry is editable or deletable from its history list.

**Habit list is editable.** Brennen sets his own habits in Settings; the app ships with a starter list he can rename or remove.

## Managing exercises and habits

Brennen builds his own lists. Both the exercise list and the habit list can grow and shrink from a Manage screen, opened with an EDIT button on the Today and Log screens.

| | Habits | Exercises |
| --- | --- | --- |
| Add | Type a name, tap + ADD | Type a name, pick Upper or Lower, tap + ADD |
| Delete | Tap the X on a row, then confirm YES or NO | Same |
| Rename | Tap the name | Same |
| Starter list | Editable starter set | Editable starter sets for Upper and Lower |

**Rules**

- Names must be unique within a list (ignoring capitals) and at most 40 characters.
- Delete removes the item from the Today and Log screens. Past entries, streak history and personal records stay in the app, history and exports.
- Adding a deleted name again brings back the old item with its history.
- Deleting a habit or exercise never touches logged data; only Wipe does that, and only after an export.
- The confirm step reads "Delete this row? Past logs and records stay." so nobody fears losing history.

## Workout template: Upper/Lower 3-4 day plan

The app ships with Brennen's Upper/Lower 3-4 day plan as its first workout template. The plan says to run one program at a time, so the app keeps one active template and others can be added later. Plan priorities: rear delts, upper chest, upper back, bench press, handstand (push) and muscle-up (pull).

**Week at a glance**

| Day | Session | Focus |
| --- | --- | --- |
| Mon | BJJ and calisthenics push (15 min) | Toward handstand |
| Tue | Upper A | Upper chest and back |
| Wed | BJJ and calisthenics pull (15 min) | Toward muscle-up |
| Thu | Lower | Hamstrings and glutes first, then quads |
| Fri | Rest or walk | |
| Sat | Upper B | Bench, shoulders, rear delts |
| Sun | Rest or sauna; optional Upper C | Upper back and rear delts (30-40 min) |

The 3-day version is Upper A, Lower and Upper B, with no Sunday session.

**Lifting days.** Warm-up sets are light, never near failure, and rest 30-60 sec. Working sets go to or near failure.

| Day | Exercise | Warm-up set | Working sets |
| --- | --- | --- | --- |
| Upper A | Incline press (machine or barbell) | 1 x 8 at about 50% | 3 x 6-8 |
| Upper A | Chest-supported row (semi-pronated grip) | 1 x 8 at about 50% | 2 x 5-8 |
| Upper A | One-arm neutral-grip pulldown (straps) | 1 x 8 at about 50% per arm | 2 x 5-8 per arm |
| Upper A | Lateral raise | 1 x 12 very light | 3 x 12-15 |
| Upper A | Reverse pec deck | 1 x 12 very light | 3 x 12-15 |
| Upper A | Cable triceps extension | 1 x 10 light | 2 x 10-12 |
| Upper A | Bicep curl (EZ-bar or dumbbell) | 1 x 10 light | 2 x 10-12 |
| Upper A | Abs | none | 3 sets |
| Lower | Seated leg curl | 2 x 10 (light, then about 60%) | 3 x 8-12 |
| Lower | Hip thrust | 1 x 8 at about 50% | 3 x 10 |
| Lower | Hack squat, leg press or back squat | 1 x 8 at about 50% | 3 x 6-10 |
| Lower | RDL | 1 x 8 at about 50% | 2 x 8-10 |
| Lower | Walking lunge | 1 x 6 per leg, bodyweight | 2 x 10 per leg |
| Lower | Leg extension | 1 x 10 light | 2 x 10-15 |
| Lower | Calf raise | 1 x 12 light | 2 x 12-15 |
| Lower | Farmer carry or heavy dumbbell hold (straps) | none | 2 x 30-45 sec |
| Upper B | Bench press | 1 x 8 at about 50% | 3 x 5-8 |
| Upper B | T-bar or single-arm cable row (straps) | 1 x 8 at about 50% | 2 x 5-8 |
| Upper B | Overhand lat pulldown or pull-up (straps) | 1 scap-pull-only set x 8, then 1 x 6 at about 50% | 2 x 5-8 |
| Upper B | Overhead press | 1 x 8 at about 50% | 2 x 8-10 |
| Upper B | Pec deck or incline fly | 1 x 10 light | 2 x 10-12 |
| Upper B | Face pulls or rear-delt cable fly | 1 x 12 very light | 3 x 12-15 |
| Upper B | Dips or machine triceps | 1 x 6 bodyweight or light | 2 x 8-12 |
| Upper B | Supinated curl | 1 x 10 light | 2 x 10-12 |
| Upper B | Abs | none | 3 sets |
| Upper C (optional Sun) | Weighted pull-up or overhand lat pulldown (straps) | 1 scap-pull-only set x 8, then 1 x 6 at about 50% | 3 x 6-10 |
| Upper C (optional Sun) | Chest-supported row (semi-pronated grip) | 1 x 8 at about 50% | 3 x 8-10 |
| Upper C (optional Sun) | Reverse pec deck | 1 x 12 very light | 3 x 12-15 |
| Upper C (optional Sun) | Straight-arm pulldown | 1 x 12 very light | 2 x 12 |

**Calisthenics after BJJ.** Technique and quality reps, not failure; stop with about 2 reps left.

| Day | Exercise | Dose |
| --- | --- | --- |
| Mon (push) | Wrist warm-up (circles, rocks) | 1 min |
| Mon (push) | Wall handstand hold (chest to wall) | 4 x 20-30 sec |
| Mon (push) | Pike push-up | 3 x 6-8 |
| Mon (push) | Hollow body hold | 3 x 20-30 sec |
| Wed (pull) | Scap pull-ups (no full rep) | 2 x 8 |
| Wed (pull) | Pull-ups (strict) | 3 x 4-6 |
| Wed (pull) | False-grip hang | 3 x 15-20 sec |
| Wed (pull) | Straight-bar dip negatives | 3 x 3-5 |

**How the app uses the template**

- Today shows the session for the weekday (Saturday: Upper B) with a Start button. A BJJ class is a simple done check on Monday and Wednesday.
- Warm-up sets and working sets are logged separately. The app suggests the warm-up weight at about 50% of the last working weight (lighter for isolations).
- Each exercise shows its target, such as 3 x 5-8, and its rest time. A rest timer starts when a working set is saved: 3:00 after heavy compounds, 1:30 to 2:00 after isolations.
- Timed holds (handstand, false-grip hang, farmer carry) log seconds. One-arm and per-leg work logs left and right. Pull-ups, pike push-ups and similar log reps with no weight.
- The first exercise of each day shows last week's result and what to beat, because the plan says to add weight or reps every week there.
- Slots with options, such as hack squat, leg press or back squat, remember the chosen option. Swapping hack squat for leg press (the plan's half-marathon note) is one tap.
- Trim a set removes one working set from today's targets without changing history. The plan says to trim, not skip, after hard BJJ.
- Upper, Lower and post-BJJ warm-up checklists show before the first set. The plan's back-training cues are one tap away on each back exercise.
- Personal records rank timed holds by longest time and bodyweight moves by most reps.

Back-training cues, plan rules and notes are in [TEMPLATE-upper-lower.md](TEMPLATE-upper-lower.md).

## Settings, history and week view

Three screens fill gaps found in review, and each is reached from the MORE tab or the Today screen.

**Settings**

- Units: pounds or kilograms.
- Target weight (170 lb) and whether the bodyweight record counts lowest or highest.
- Day starts at (default 4:00 AM), so a log at 1 AM counts toward the previous day.
- Keep after wipe: how many recent days stay on the phone after Wipe (default 7; 0 is a full wipe).
- Active workout template and 3-day or 4-day schedule.
- Weekly export reminder (on by default, Sunday evening), export folder name, backup and restore, and storage status.

**History.** A day-by-day list of every entry. Tap an entry to edit or delete it. Each entry shows Exported or Waiting, so it is clear what has already reached Dropbox.

**Week view.** Habit grid for 7 days, bodyweight bars with the 170 lb target, workouts done against the plan, and guitar minutes per day.

**Storage safeguards.** Phone browsers can clear the data of a site that has not been used for about a week. The first run prompts Add to Home Screen, the app asks the browser for persistent storage, and Settings shows whether storage is protected. If it is not, the Today screen shows a banner.

## Dashboard and daily view

The Today screen answers one question: what is still open today?

**Today screen (home)**

1. Habit checklist with a done count, such as 4 of 6.
2. Today's workout card: Upper or Lower, with a Start button.
3. Latest bodyweight and distance to 170 lbs.
4. Guitar minutes today and best BPM so far.
5. Meals logged today.

**Week view**

- Habit completion grid for the last 7 days.
- Bodyweight line chart with a 170 lb target line and a 7-day average, so daily noise does not hide the trend.
- Workouts completed against the planned count for the week.
- Guitar minutes per day as bars.

**Streaks:** shown per habit and for guitar practice. A missed day resets the streak, and the best streak is kept.

The app sets no timeline for reaching 170 lbs; the chart shows direction only.

## Data model

Every log is one dated entry in one of six collections, stored as plain JSON so it exports cleanly. More stores hold personal records, the exercise list, the workout template (templates, template_days, template_slots), settings and a small summary store. Every entry carries an id and an updatedAt time, plus exportedAt and exportId, which stay empty until an export that includes that exact version is confirmed.

| Collection | Key fields | Notes |
| --- | --- | --- |
| habits | id, name, active | The editable habit list |
| habit_checks | date, habit_id, done | One row per habit per day |
| meals | date, time, type, name, protein_g, notes | protein_g optional |
| sessions | date, day_type, exercises[ name, sets[ type (warm-up or working), side, reps, seconds, weight_lb ] ] | One per workout |
| weigh_ins | date, weight_lb | Latest per day wins |
| guitar | date, minutes, focus, item, best_bpm, posted, platform | One or more per day |
| records | kind, item, rank, value, unit, date | Top 5 per list; not removed by Wipe |
| templates | id, name, days_per_week, active; template_days (weekday, session); template_slots (day, exercise, warm-up, working sets, rep range, options) | Upper/Lower 3-4 day plan ships as the first template; not removed by Wipe |
| settings | units, target_weight, day_start, keep_days, export_folder, active_template, days_per_week | Never wiped |
| summary | streaks, last working set per exercise, last 7 weigh-ins | Derived cache, rebuilt from entries plus retained_stats; never edited directly. Keeps pre-fills and the Week view working after Wipe |
| retained_stats | best streak per habit and guitar, streak anchor date, last working set per exercise, last 7 weigh-ins as of the last wipe | Facts that cannot be rebuilt once old entries are wiped. Stored in IndexedDB and written in the same transaction as Wipe; never wiped |
| exercises | id, name, day_type, kind (weight, bodyweight, timed), per_side, rest_sec, cue, active | Editable Upper and Lower lists; delete sets active to false |

**Mapping to the vault.** The `Daily/` notes already hold `guitar_bpm_best`, which maps to the day's highest best_bpm in the guitar collection. Each export writes one new file in a separate folder rather than editing Brennen's own Daily properties, in line with the vault's human/machine split. Exports go to myVault/sources/life-log/ in Dropbox.

## Export and local wipe

Logs save on the phone as you enter them. An Export button turns them into one Markdown file for Dropbox, and a separate Wipe step then clears the exported logs from the phone, behind a warning.

**Flow**

1. Log as usual. Every entry saves to the device at once.
2. Tap Export. The app builds one Markdown file of all logs not yet exported and hands it to the phone to save into Dropbox. The export also freezes a manifest of the exact entry versions in the file (id and updatedAt for each). Building the export marks nothing.
3. Dropbox syncs the file into the Obsidian vault.
4. The app asks whether the file is saved. Only after Brennen confirms are the entries in the manifest marked exported (exportedAt set), and only then does Wipe become available. An entry edited after the export was built does not match its manifest version, so it stays waiting and goes into the next export.
5. Wipe deletes only entries in the confirmed manifest whose updatedAt is not newer than exportedAt and that are older than the keep window (7 days by default; 0 means a full wipe), in one IndexedDB transaction. Lists, template, settings, records and the summary store stay.

**How the file reaches Dropbox.** A web app cannot write into a Dropbox folder by itself, so v1 uses the phone's share sheet.

| Method | Works on | Direct to folder | v1 |
| --- | --- | --- | --- |
| Share sheet: Save to Dropbox | iPhone, Android | No, lands in the Dropbox folder you pick | Default |
| File download, then move | Any browser | No | Fallback |
| Folder picker (File System Access API) | Desktop Chrome, some Android | Yes | Later |
| Dropbox API upload | Any browser | Yes, needs a Dropbox app key and sign-in | M3 option |

**Warning shown before Wipe**

> Wipe permanently deletes N entries (date range) from this phone. The app cannot check that the file reached Dropbox. Open the file in Dropbox first and confirm it is there. This cannot be undone.

The Wipe button stays disabled until Brennen ticks "I opened the file in Dropbox and it is complete". It deletes only entries in that export's confirmed manifest, never anything logged or edited after the export was built.

**What survives a wipe.** The habit and exercise lists, the workout template, settings, personal records, and a small summary store (current streaks, last working set per exercise, the last 7 weigh-ins). By default Wipe also keeps the most recent 7 days of entries, so the Week view and weight pre-fills keep working; Settings can set that to 0 for a full wipe. Kept entries already in a confirmed manifest are not exported again unless they are edited.

**Source of truth for the summary store.** Entries on the phone are the truth for the kept window; retained_stats, stored in IndexedDB, is the truth for history already wiped. The summary store is a cache derived from both, so editing or deleting a kept entry triggers a rebuild instead of a patch. Before Wipe deletes anything, it updates retained_stats from the entries being removed, in the same IndexedDB transaction as the delete. If the transaction fails, nothing changes.

**Export file format.** One file per export, named `life-log-YYYY-MM-DD.md` (a second export the same day adds `-2`). Plain Markdown with a small header, one section per day.

```markdown
---
type: life-log-export
exported: 2026-11-08T09:00
range: 2026-11-01 to 2026-11-07
---

# 2026-11-07

## Habits
- [x] Water
- [ ] Study

## Workout
Upper B
Bench press: warm-up 50 lb x 8; working 100 lb x 8, 100 lb x 7
One-arm pulldown (per side): L 60 lb x 8, R 60 lb x 7
Wall handstand hold: 25 sec, 28 sec
Pull-ups: 6, 5
Bodyweight: 182.6 lb

## Guitar
20 min, focus: technique, best BPM: 96

## Meals
- Lunch: Chicken bowl
```

**Safeguards**

- Export never wipes by itself.
- Wipe is disabled until an export exists and the checkbox is ticked.
- The app shows how many entries are waiting to be exported, so unexported logs are never mistaken for backed up ones.
- The JSON backup from F7 stays available for a full restore.

**Backup and restore (F7).** The Dropbox Markdown is for reading in the vault and cannot be re-imported, so the app needs a separate off-device JSON backup and restore.

- Backup is one JSON file with a schemaVersion, saved off the device the same way as the export.
- Restore merges by id: for each entry the version with the newest updatedAt wins.
- Restore never deletes existing data on the phone.

## Personal records

The app keeps the top 5 results for each record, best first, and they survive a wipe.

| Record | Ranked by | Starter set |
| --- | --- | --- |
| Lifts, one list per exercise | Estimated one-rep max: weight x (1 + reps / 30), so 100 lb x 8 and 125 lb x 3 compare fairly | Every exercise Brennen logs |
| Bodyweight | Lowest weigh-in, since the goal is 185 lbs down to 170 lbs; Settings can flip it to highest | One list |
| Guitar speed | Highest best BPM, per exercise or song when a name is entered, otherwise overall | One list per named item |
| Other | Longest practice session (minutes), longest habit streak (days), most workouts in one week | Three lists |

**Rules**

- A new result enters a list when it beats the current fifth place, and pushes the old fifth out.
- Rank 1 shows a New PR badge on the Today screen; ranks 2 to 5 save quietly.
- Each record stores its value, unit and date. It is a snapshot, so editing or deleting the original entry does not change it; a record is removed only from the Personal records screen.
- Records live in their own store, so Wipe never touches them.
- Every export ends with a Personal records section, five lines per list, so the vault always has a copy.

```markdown
## Personal records

### Example lift
1. 100 lb x 8 (est. 1RM 127), 2026-11-01
2. 95 lb x 8 (est. 1RM 120), 2026-10-25
```

- [ ] Which other things should have a top 5?

## UI design and color palette

The app uses a chunky pixel look (4px grid, 4px black borders, hard offset shadows, square corners) in four colors from Color Hunt: https://colorhunt.co/palette/000000233d4dfe7f2deaecf0

| Token | Hex | Used for |
| --- | --- | --- |
| ink, bg | #000000 | Page background, all borders and hard shadows, dark text on light panels |
| bg-alt | #233d4d | Checker pattern behind screens, meter troughs |
| accent | #fe7f2d | Title ribbons, primary buttons, chips, habit meter fill, checkmarks, the number-one record row |
| panel, text | #eaecf0 | Panels, secondary buttons, light text on dark |

**Rules**

- Text on orange is always black (about 8:1 contrast). Orange is never used as text on the light panel (about 2:1).
- Panel bevels and dotted dividers use a faded slate, rgba(35, 61, 77, 0.28), so no fifth color is needed.
- The palette has no red, so the Wipe button and warning use the same orange and black as other primary actions. A separate warning color is an option if Wipe needs to stand out more.
- Fonts: Press Start 2P for labels, buttons and numbers; VT323 for sentences and hints.

**CSS tokens**

```css
:root {
  --bg: #000000;
  --bg-alt: #233d4d;
  --panel: #eaecf0;
  --ink: #000000;
  --accent: #fe7f2d;
  --text: #eaecf0;
  --on-accent: #000000;
  --shade: rgba(35, 61, 77, 0.28);
}
```

**Mockup screens:** Today, Log workout, Personal records, Export, Wipe warning (https://claude.ai/artifact/Sf5fTMGGX7ZmExAoh9u4rE).

## Tech approach

v1 is a single-page progressive web app (PWA) that stores data on the device first and syncs later, so logging works with no signal.

| Layer | Choice | Why |
| --- | --- | --- |
| UI | Vanilla JS or a small framework, mobile-first, installable to the home screen | Fast to build, no heavy toolchain for v1 |
| Storage | IndexedDB on the device | Offline logging, no server needed |
| Charts | Small canvas or SVG charts | Weight trend and habit grid only |
| Export | One Markdown file per export, saved to Dropbox; JSON backup for restore | Feeds the Obsidian vault |
| Hosting | Static host such as Vercel | Brennen's Vercel account is connected |

**Known tradeoff:** device-only storage means data lives in one browser. v1 includes a one-tap JSON backup and restore. A synced backend (for example Postgres or SQLite behind FastAPI, which also builds Kumio-relevant skills) is a milestone 3 option, not a v1 requirement.

**Privacy:** the app holds only personal logs and has no accounts or third-party trackers.

## Build plan and open questions

Build in four milestones, each usable on its own.

1. **MVP:** Today screen, habit checklist, quick weigh-in, guitar minutes and BPM, JSON backup, Markdown export to Dropbox with warned local wipe.
2. **Training and food:** Upper/Lower session logger from the workout template with warm-up and working sets, rest timer, last-weight pre-fill, add and delete exercises, Kumio study log, meal log, week view, bodyweight chart and personal records.
3. **Vault link:** Optional synced backend and direct Dropbox upload.
4. **Later tracks:** Inbox capture, content posting tracker.

**Open questions**

- [ ] Which habits should ship in the starter list?
- [ ] Which exercises should the starter Upper and Lower lists include? (All editable.)
- [x] Export folder: myVault/sources/life-log/ (confirmed)
- [ ] Is protein worth tracking, or just meal names?
- [ ] Does the app name stay Life Log, or do you want another?

## Feature scope

There are 17 must-have features: 11 Must-M1 (v1) and 6 Must-M2. Everything else is ranked and tied to a milestone (M1 to M4 in the Build plan).

| ID | Feature | Track | Priority | Milestone |
| --- | --- | --- | --- | --- |
| F1 | Today screen with open items | Core | Must-M1 | M1 |
| F2 | Habit checklist; add and delete habits | Habits | Must-M1 | M1 |
| F3 | Quick weigh-in and bodyweight history | Workouts | Must-M1 | M1 |
| F4 | Guitar log: minutes, focus, best BPM | Guitar | Must-M1 | M1 |
| F5 | Edit and delete any entry | Core | Must-M1 | M1 |
| F6 | Offline use and install to home screen | Core | Must-M1 | M1 |
| F7 | JSON backup and restore | Core | Must-M1 | M1 |
| F8 | Upper/Lower session logger with last-weight pre-fill | Workouts | Must-M2 | M2 |
| F9 | Meal log (name, type) | Food | Must-M2 | M2 |
| F10 | Week view: habit grid, weight trend with 170 lb line | Core | Should | M2 |
| F11 | Streaks per habit and for guitar | Habits | Should | M2 |
| F12 | Practice timer | Guitar | Could | M2 |
| F13 | Protein and water tracking | Food | Could | M2 |
| F14 | Markdown export to Dropbox, then warned wipe of exported logs | Core | Must-M1 | M1 |
| F15 | Synced backend | Core | Could | M3 |
| F16 | Kumio prep and study log | Study | Should | M2 |
| F17 | Inbox quick capture | Core | Could | M4 |
| F18 | Content posting tracker | Guitar | Could | M4 |
| F19 | Personal records: top 5 per lift, bodyweight, guitar BPM and more, kept through wipe | Core | Should | M2 |
| F20 | Add and delete exercises (Upper and Lower lists) | Workouts | Must-M2 | M2 |
| F21 | Workout template (Upper/Lower 3-4 day plan) | Workouts | Must-M2 | M2 |
| F22 | Warm-up and working sets logged separately | Workouts | Must-M2 | M2 |
| F23 | Rest timer | Workouts | Should | M2 |
| F24 | Timed, per-side and bodyweight exercises | Workouts | Must-M2 | M2 |
| F25 | Progression prompt on first lift | Workouts | Should | M2 |
| F26 | Settings screen | Core | Must-M1 | M1 |
| F27 | Summary store and keep-last-7-days wipe | Core | Must-M1 | M1 |
| F28 | Storage persistence and Add to Home Screen prompt | Core | Must-M1 | M1 |
| F29 | Warm-up checklists and back-training cues | Workouts | Could | M2 |
| F30 | Trim a set | Workouts | Could | M2 |
| F31 | 3-day and 4-day schedule switch | Workouts | Should | M2 |
| F32 | Calisthenics blocks and BJJ done check | Workouts | Should | M2 |
| F33 | Weekly export reminder (banner on Today, plus a notification where supported) | Core | Should | M2 |

**Out of scope:** multi-user accounts, social sharing, calorie database or barcode scanning, wearable integrations, push reminders (revisit after M2).

**Non-functional requirements**

- Opens to the Today screen in under 2 seconds on a mid-range phone.
- Logging works with no connection.
- Usable one-handed at phone width (about 400 px), with tap targets of at least 44 px.
- Light and dark themes follow the phone setting.

## SDLC

The project runs as small iterations, one per milestone, with a working app at the end of each. This is a solo project, so the process stays light but still produces the artifacts an interviewer would expect to see in a portfolio repo.

| Phase | What happens | Output |
| --- | --- | --- |
| 1. Plan | Confirm scope with this spec, answer open questions, pick the milestone | Updated spec, milestone checklist |
| 2. Design | Sketch Today, Log and Week screens at 400 px; fix the data model | Screen sketches, schema |
| 3. Build | Implement features in priority order on short git branches | Commits and pull requests, one per feature |
| 4. Test | Unit tests for streak, trend and export logic; manual run-through on a real phone, offline | Test suite, test checklist |
| 5. Release | Deploy the static build, tag the version, install on the phone | Live URL, release tag |
| 6. Use and review | Log for one week, note friction, re-rank the backlog | Retro notes, next milestone scope |

**Repository and workflow**

- GitHub repo (BXM22) with a README, this spec as docs/SPEC.md, and a CHANGELOG.
- Trunk-based: short feature branches merged to main through pull requests.
- Commit messages use a type prefix such as feat, fix or docs.
- Issues map to feature IDs F1 to F33, so each commit traces to a requirement.

**Testing**

- Unit: streak counting, 7-day weight average, daily export. These are pure functions and the likeliest to hide bugs.
- Manual: airplane-mode logging, backup then restore into a clean browser, install to the home screen.
- Done means the feature works on the phone, has tests where logic is involved, and appears in the CHANGELOG.

**Risks**

| Risk | Likelihood | Mitigation |
| --- | --- | --- |
| Data lost when browser storage is cleared | Medium | One-tap JSON backup in M1, reminder to back up weekly |
| Scope creep into new tracks | High | New tracks only enter at M4, ranked against this table |
| App work crowds out Kumio prep | Medium | Cap build time per week; Kumio prep stays top priority |
| Logging friction makes him stop using it | Medium | Two-tap target, pre-fills, week-one review |
