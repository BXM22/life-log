# Workout tab

Log lifting for the active template, run the rest timer, and manage templates. Source: `src/ui/workoutView.js`, `templateTagsView.js`, `templateView.js`, `workoutExtrasView.js`, `restView.js`, `platesView.js`, `workoutHistoryView.js`.

## Main screen, top to bottom

1. **Header:** `LIFE LOG · date`, title `WORKOUT`.
2. **PR banner** (conditional, only on this tab): `NEW PR · Bench 185 est. 1RM  was 180`, tap to dismiss. Appears after a working set beats a record.
3. **Session panel** (`WORKOUT 11-17`):
   - Line `Active template  <name>` with a `Switch` link (opens the Templates window).
   - Focus text plus "Beat last time on the first exercise."
   - Buttons: `EDIT TEMPLATES` (old edit mode, toggles to `DONE EDITING`), `HISTORY` (toggles to `BACK TO WORKOUT`), and `TEMPLATES AND TAGS`.
4. **Rest timer row:** peach row, `REST TIMER` caption over the time (`1:30`), `Open` pill on the right. Opens the rest timer page.
5. **Warm-up checklist** (Upper or Lower templates only): collapsible panel `UPPER WARM-UP 0/4` with checkable items; progress persists for the day.
6. **BJJ panel** (BJJ days only): "BJJ class done today" checkbox plus a post-BJJ warm-up checklist.
7. **Calisthenics block** (push Monday, pull Wednesday): one panel per exercise with Reps or Seconds, `LOG SET`, and its logged sets with EDIT and DEL.
8. **Exercise panels**, one collapsible panel per template exercise (title uppercase, arrow at right). Open one to see:
   - Optional equipment label (`Barbell`, `Dumbbell`, `Calisthenics`, `Machine`), then `Target 3 x 8-12 (trimmed 1 from 3 x 8-12). Warm-up: 1 x 8 at about 50%.`
   - `OPTIONS` menu: `EDIT`, `DELETE`, `TRIM A SET` / `PUT BACK`.
   - `BACK CUES` toggle on back exercises (a peach tip box).
   - First exercise only: peach `TRY TODAY` tip (one more rep, more weight, or 5 more seconds).
   - `Last: 100 x 8 on 11-10. Warm-up about 50 lb.` or "No history yet."
   - Inputs: weight (pre-filled from last working set), reps (or seconds for timed), left/right select for per-side. Calisthenics exercises add a weight-type select: `Added weight` or `Assisted weight`, and weight is optional.
   - Buttons: `WARM-UP SET` (secondary) and `WORKING SET` (peach). Weight exercises also get `PLATES`.
   - Logged sets for today as rows (`Set 100 x 8`, `Warm-up 50 x 8`, calisthenics as `+25 lb x 5` or `30 lb assist x 8`) with `EDIT` and `DEL`.
9. **Empty template:** panel "No exercises yet. Open Switch, then Edit on this template to add some."
10. **Spontaneous exercises** (today only), after the template's exercises: same panel as above, with `OPTIONS` holding `KEEP IN TEMPLATE` and `REMOVE FROM TODAY`. No plates, trim or cues.
11. **ADD EXERCISE FOR TODAY** secondary button. Opens an inline `ADD FOR TODAY` panel: name (max 60), equipment (Not set, Barbell, Dumbbell, Calisthenics, Machine), what you log (weight and reps / reps, weight optional / seconds, weight optional), "Log left and right separately", `CANCEL` and `ADD`.

## Rest timer page (full screen, back arrow returns to Workout)

Title `Rest timer`. 220 px progress ring (white track, peach arc that fills as time passes) with the time in the middle and `of 1:30` or `ready` under it; preset chips (1:00 to 3:00); `CUSTOM TIME` with two scroll wheels (minutes, seconds) separated by a colon; switch "Start by itself after each working set"; a large `Start rest` button, which becomes `Stop rest` while running. The countdown survives closing the app.

## Plate calculator (opens under a weight exercise)

`PLATES` panel: working weight and `CALC`; result as `45 lb bar, each side:` with tags like `2 x 45`, `1 x 10`, or `BAR ONLY`; total or "N lb short" note; bar weight field, plate toggles (tap to toggle the plates you own); `CLOSE`.

## Templates window (Switch, or TEMPLATES AND TAGS)

Back arrow with the small text `Active: <name>`; title `Workout templates`.
- **NEW TEMPLATE panel:** name field (max 40), `START BLANK` (peach) and `COPY ACTIVE` (secondary). Both open the new template's edit screen.
- **Tag filter chips:** `ALL` plus every tag in use.
- **One cream card per template:** name with an `Edit` link, `N exercises`, tag pills (or "No tags"), and either an `Active template` line or `SET ACTIVE`. Non-active cards are dimmed.

## Edit template screen

Back arrow; title `Edit template`. Panels: **EDIT TEMPLATE** (name, tag chips, "Custom tag" field with `ADD TAG`, `SAVE NAME AND TAGS`); the **exercise form** when adding or editing (name, equipment, what you log, left/right, warm-up, target, `CANCEL` / `SAVE`); **EXERCISES** (rows with name, target, `Edit`, trash icon; `ADD EXERCISE`); **actions** (`SET AS ACTIVE`, `DELETE TEMPLATE` in red, `BACK TO TEMPLATES`).

## Workout history mode

`WORKOUT HISTORY` panel: past days newest first, each a fold `Tue 11-17 · Upper A · 12 sets` that opens to per-exercise warm-up and working sets. Shows the newest 60 days; older ones live in Dropbox exports.

## Old edit mode (EDIT TEMPLATES)

`SESSIONS` panel with a name box and `NEW EMPTY`, `COPY THIS ONE`, `RENAME THIS ONE`, `DELETE THIS ONE`; below it the exercise list with `EDIT` and `DEL`, `ADD EXERCISE`, and `RESET ALL TO THE BUILT-IN PLAN`.

## Design style

- **Same system as Today:** cream panels on white, peach for the main action, ink text.
- **Rest row:** full-width peach pill row (`rest-row`), dark `Open` pill at the right. The rest page itself is a clean white screen: ring 14 px stroke, peach `#F4A28C` arc on a white track, large time text, preset chips as pills, a big peach `Start rest` / dark `Stop rest` button.
- **Exercise panels:** collapsible cream cards; the title is the uppercase H2 overline; tips (`TRY TODAY`, back cues) are soft peach `#FDE8E0` rounded boxes with a bold overline.
- **Set rows:** small bordered entries with `EDIT` and `DEL` as small secondary buttons.
- **Template cards (`tplcard`):** cream, 24 px radius, name weight 700, `Edit` as a text link; inactive cards use reduced opacity; the Active switch is a toggle-style control.
- **Tags:** small rounded pills; selected tag chips are peach.
- **Danger:** `DELETE TEMPLATE` uses the red danger button (solid `#B3261E`, white text).
- **PR banner:** full-width tinted button with a bold `NEW PR` lead.
- **Motion:** the ring arc animates with the countdown; everything else is static. Reduced motion is respected.

## Reference

| Thing | Where |
|---|---|
| Main view and exercise panels | `src/ui/workoutView.js` |
| Templates window and edit screen | `src/ui/templateTagsView.js`, `src/ui/templateTagsActions.js` |
| Exercise form, old edit mode | `src/ui/templateView.js`, `src/ui/templateActions.js` |
| Warm-ups, BJJ, calisthenics block, cues, trims | `src/ui/workoutExtrasView.js`, `workoutExtrasActions.js`, `src/logic/workoutExtras.js` |
| Rest timer | `src/ui/restView.js`, `restActions.js`, `src/logic/rest.js` |
| Plate calculator | `src/ui/platesView.js`, `platesActions.js`, `src/logic/plates.js` |
| Spontaneous exercises | `src/logic/extras.js`, `workoutActions.js` (`addExtraOpen`, `addExtraSave`, `removeExtra`), `templateActions.js` (`keepExtra`) |
| Set logic, equipment, calisthenics weight types | `src/logic/workout.js` (`parseSet`, `setText`, `LOADS`), `src/logic/templateEdit.js` (`EQUIPMENT`) |
| Templates and tags | `src/logic/template.js`, `templateEdit.js`, `templateTags.js` |
| History mode | `src/ui/workoutHistoryView.js`, `src/logic/workoutHistory.js` |
| Progress and PR check | `src/logic/progress.js`, `src/ui/progressView.js` |
| Data | `lift_set` entries `{ session, exercise, kind, weight, reps, seconds, side, load? }`; template in `retained_stats` (`template`); today's extras in localStorage `lifelog.wExtras` |
| Backlog items | F8, F20 to F25, F29 to F32, F34, F35, F38, F42, F43, F49 to F52 in `docs/BACKLOG.md` |
