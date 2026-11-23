# Screen docs (design reference)

One document per tab, describing what is on each screen, in order, with the data behind it, the controls, the empty states and the source files. Written from the code as of 2026-11-17.

| Tab | Doc | Purpose |
|---|---|---|
| Today | [today.md](today.md) | Habits, today's session, quick logging (guitar, weigh-in, meals, study, notes) |
| Workout | [workout.md](workout.md) | Active template, exercise logging, rest timer, templates, history. v2 redesign and v3 polish (F67) are documented there and shipped; the library is a full page |
| History | [history.md](history.md) | Week grid, weight trend, streaks, heatmap, records, all entries. v2 shipped (F71) |
| Sync | [sync.md](sync.md) | Export, wipe, weekly review, backup and restore, Dropbox. v2 shipped (F71) |
| Settings | [settings.md](settings.md) | Plan days, keep days, day start, export reminder, Dropbox, What's New. v2 shipped (F71) |

## Cross-screen impact of the Workout redesign (mostly built)

Status 2026-11-22: Today's Switch sheet and Start workout, Settings' rest timer defaults and History's single cross-habit list are built. What is left all waits on F66: the plan-driven Today card, Settings losing `Lifting days per week`, the History planned grid and sessions keeping their template, and plans in the backup.

Today, Settings, History and Sync each have a "Workout redesign impact" section. Short version: Today opens the Switch sheet and `Next up`; Settings drops `Lifting days per week` and gains rest timer defaults; History avoids a duplicate list and keeps each session's template; Sync backs up plans and templates.

## Shared shell

- **Page header** (every tab except History's own windows): small overline `LIFE LOG · TUE, NOV 17` over the tab title as an H1 (`TODAY`, `WORKOUT`, `HISTORY`, `SYNC`, `SETTINGS`). Source: `header()` in `src/ui/app.js`.
- **Bottom tab bar:** five tabs, in order Today, Workout, History, Sync, Settings. Icon above a lowercase 11 px label. The active tab's icon sits in a mint pill (56 x 32, 16 px radius). Sync stays highlighted while its Export and Wipe sub-tabs are shown.
- **Reserved tab bar strip (planned, from Workout v2):** every scroll container ends with `padding-bottom: calc(72px + 16px + env(safe-area-inset-bottom))`, and pinned bars sit above the 72 px strip. Apply to all tabs, not only Workout.
- **Toast:** one dark pill above the tab bar for confirmations and errors (`state.msg`). Short messages clear after 4.5 s; tap to dismiss.
- **Windows:** several features open as a full screen with a back control instead of a modal (Today's Log and Study, Workout's Templates and rest timer, History's Personal records and All entries). Confirmations (wipe, Dropbox setup) are centered modals. The quick-add sheet is a bottom sheet.
- **Persistence rule:** everything is stored on the device (IndexedDB for entries and templates, localStorage for small settings). Nothing leaves the phone unless exported.

## Design tokens (Forma style, `src/styles/forma.css`)

| Token | Value | Use |
|---|---|---|
| Background | `#FFFFFF` | page |
| Panel / card | `#FBF3EC` (cream), 24 px radius, 20 px padding, 12 px gap | every grouped section |
| Accent | `#F4A28C` (peach) | primary buttons, hero card, FAB, active tab pill |
| Soft peach | `#FDE8E0` / `#F9C9BB` | tips, pressed rows, chips |
| Ink | `#1C1B1F` | text, dark toast |
| Muted | `#6B6B70` | secondary text, inactive tabs |
| Danger | `#B3261E` | wipe and delete |
| Font | Plus Jakarta Sans | all text |

Type scale: screen title 28/34 weight 800; section overline (H2) 12/16 weight 700 with 0.04em tracking; body 15/22 weight 500; small and labels 12 weight 600 to 700. Spacing on an 8 pt grid. Buttons are 56 px pills, fields 56 px, row buttons 56 px with 16 px radius. Primary buttons are peach, secondary are white with a hairline, danger is solid red.

## Common components

| Component | Look and behavior |
|---|---|
| Panel | cream card with an H2 overline, content below |
| Hero | peach card with a 48 px number and a caption (Today's habits, Lift progress) |
| Row button (`rowbtn`) | full-width cream row, title left, chevron right; opens a window or tab |
| Chip | pill toggle with `aria-pressed`; selected is peach, unselected is white |
| Fold (`details`) | panel that collapses; arrow at the right of its title |
| Status tag | small pill, ink text: `WAITING` (peach, not exported yet) or `EXPORTED` / `IN VAULT` (soft peach, done) |
| Segmented control | pill switch (Settings: Theme, Keep after a wipe, Lifting days; the Sync Export / Wipe switch was removed in F71) |
