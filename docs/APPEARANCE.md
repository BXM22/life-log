# Appearance: color themes and goal layouts (plan)

Status: **plan, not built.** Backlog items F62 (themes), F63 (goal layouts), F64 (first-run picker). Written 2026-11-19.

## Decisions

| Question | Answer |
|---|---|
| Color range | Preset themes, each with a light and a dark version, plus Auto (follow the phone) |
| Layouts | Pick a goal, it sets up Today; then reorder, hide or show sections by hand |
| Goal profiles | Fitness, Learning, Habits, Balanced |
| Where | Short first-run picker, and Settings > Appearance to change later |

Out of scope for now: a free color picker, custom fonts, text size, per-tab layouts (only Today changes with the goal). Listed under "Later" at the end.

## Part 1: Color themes (F62)

### Themes

Five presets. Peach is today's look and stays the default.

| Theme | Light accent | Light card (panel) | Dark background / card |
|---|---|---|---|
| **Peach** (default) | `#F4A28C` | `#FBF3EC` | `#161415` / `#231F1E` |
| **Sage** | `#9CC5A1` | `#F1F5EE` | `#131614` / `#1D221E` |
| **Ocean** | `#8DBEDD` | `#EEF4F8` | `#12161A` / `#1B2228` |
| **Lavender** | `#BBA6DE` | `#F4F1F8` | `#151319` / `#201C26` |
| **Mono** | `#1A1A1A` (white text on it) | `#F4F4F4` | `#111111` / `#1C1C1C` |

**Mode:** Auto (default, follows the phone's light or dark setting), Light, Dark.

The same rule holds in every theme: the accent is the only strong color and marks the one thing to act on (hero, primary button, FAB, `WAITING` tag). In dark mode the accent stays the same; backgrounds and cards go dark, and `soft` becomes a dark tint of the accent.

### Full token sets

Every theme defines the same tokens that already exist in `src/styles/forma.css` `:root`. Values below are checked: text, muted text, accent text and tag text all pass WCAG AA (4.5:1) on the surfaces they sit on. The lowest ratio in the table is 4.83 (muted text on Peach light cards).

| Token | Peach L | Peach D | Sage L | Sage D | Ocean L | Ocean D | Lavender L | Lavender D | Mono L | Mono D |
|---|---|---|---|---|---|---|---|---|---|---|
| `--bg` | FFFFFF | 161415 | FFFFFF | 131614 | FFFFFF | 12161A | FFFFFF | 151319 | FFFFFF | 111111 |
| `--panel` | FBF3EC | 231F1E | F1F5EE | 1D221E | EEF4F8 | 1B2228 | F4F1F8 | 201C26 | F4F4F4 | 1C1C1C |
| `--field` | FFFFFF | 2C2726 | FFFFFF | 252B26 | FFFFFF | 232B32 | FFFFFF | 28232F | FFFFFF | 242424 |
| `--line` | E3D6CB | 3A3331 | D5DECF | 333B34 | D0DDE6 | 313C45 | DDD5E6 | 383142 | DADADA | 333333 |
| `--text` | 1C1B1F | F3EEEB | 1B1F1C | EEF2EE | 1A1E22 | EDF2F6 | 1E1B22 | F1EEF5 | 1A1A1A | F2F2F2 |
| `--dim` | 6B6B70 | B3ABA7 | 5E6660 | A9B2AA | 5C6670 | A6B2BC | 645E6B | AFA7B9 | 616161 | ADADAD |
| `--accent` | F4A28C | F4A28C | 9CC5A1 | 9CC5A1 | 8DBEDD | 8DBEDD | BBA6DE | BBA6DE | 1A1A1A | F2F2F2 |
| `--on-accent` | 1C1B1F | 1C1B1F | 1B1F1C | 1B1F1C | 1A1E22 | 1A1E22 | 1E1B22 | 1E1B22 | FFFFFF | 111111 |
| `--soft` | FDE8E0 | 3A2A25 | E1EFE2 | 26342A | DDEDF7 | 1F3442 | ECE4F7 | 2E2640 | E8E8E8 | 2A2A2A |

Still to derive per theme while building: `--shade` (pressed fill), `--accent-mid` (today's `--peach-mid`), `--pill`, `--halo`, `--bg-top`, the FAB shadow color, and `--danger` for dark mode (a lighter red such as `#F2B8B5`, so it stays readable on dark cards).

### How it works in code

1. **Token cleanup first.** About 120 hex codes are still hard-coded outside `:root` (forma.css about 55, main.css 19, workout-today.css 13, workout-sheets.css 12, today.css 4, workout-pages.css 2, plus 2 in `src/ui/restView.js`). Replace each with a token, or none of the themes will look right. Rename peach-named tokens to neutral names: `--peach-soft` becomes `--soft`, `--peach-mid` becomes `--accent-mid` (keep the old names as aliases for one release).
2. **Theme table in code:** new `src/logic/themes.js` exports `THEMES` (the table above), `THEME_IDS`, `DEFAULT_APPEARANCE`, and `resolveMode(mode, systemPrefersDark)`.
3. **Apply:** set `data-theme="sage"` and `data-mode="dark"` on `<html>`. CSS has one block per theme and mode (`[data-theme="sage"][data-mode="dark"] { --bg: ...; }`), generated from `themes.js` or written by hand.
4. **No flash on load:** a few lines of inline script in `index.html` read `lifelog.appearance` from localStorage and set the two attributes before the stylesheets paint. With Auto, listen to `matchMedia('(prefers-color-scheme: dark)')` changes.
5. **Browser chrome:** update `<meta name="theme-color">` to the theme's `--bg` on every change (it is fixed to `#FFFFFF` today).
6. **Contrast test:** `tests/themes.test.js` loops over every theme and mode and fails if any of these pairs drops under 4.5:1: text on bg, panel, field and soft; dim on bg, panel and field; on-accent on accent. This catches the kind of bug that made the status tags unreadable before the 2026-11-17 fix.

## Part 2: Goal layouts (F63)

Builds on the Today v2 layout (F60). Today becomes a list of **sections** that a goal arranges.

### Sections

| id | Section |
|---|---|
| `hero` | Hero card (big number) |
| `sync` | Sync row with `SYNC NOW` |
| `session` | Today's session (workout) |
| `activities` | Activities card (BJJ, calisthenics, custom; F54) |
| `habits` | Habits drop-down |
| `log` | Log row |
| `learn` | Learn row |
| `notes` | Notes row |
| `recent` | Recent drop-down |

The header and the Quick add button are always shown and never move.

### What each goal sets up

| | Fitness | Learning | Habits | Balanced (default) |
|---|---|---|---|---|
| **Hero shows** | Protein `85 / 160 g` with bar, workout done pip | Learn minutes today against the daily goal, e.g. `45 / 60 min` | Habits `2/3`, longest streak under it | Habits `2/3` (today's v2) |
| **Order** | hero, session, activities, log, habits, sync, learn, notes, recent | hero, learn, habits, notes, sync, session, log, recent | hero, habits (open), sync, session, log, learn, notes, recent | hero, sync, session, habits, log, learn, notes, recent |
| **Open by default** | none | habits | habits | habits |
| **Hidden at start** | learn, notes | activities | activities | none |
| **Quick add starts on** | Meal | Session | Note | last kind used |
| **Learn row reads** | compact | timer button in the row (`START TIMER`) | compact | `45 min today · Guitar, Coding` |

Hidden sections are only hidden on Today; their windows and tabs still work, and nothing is deleted.

### Changing the layout by hand

Settings > Appearance > **Today layout** opens a window:

- One row per section: name, an eye toggle (show or hide), and up and down arrow buttons to move it. Arrow buttons, not drag, because they are easier to hit and work with screen readers. Drag can come later.
- A live mini preview of the order at the top (stacked bars with section names).
- `RESET TO <GOAL> LAYOUT` at the bottom (secondary button).

Changing the goal after hand edits asks: "Use the Learning layout? Your custom order will be replaced." with `USE LEARNING LAYOUT` and `KEEP MY LAYOUT`. Keeping it changes only the hero and the Quick add default.

### Stored data

One localStorage key, normalised like `settings.js`:

```js
// lifelog.appearance
{
  theme: 'peach',          // peach | sage | ocean | lavender | mono
  mode: 'auto',            // auto | light | dark
  goal: 'balanced',        // fitness | learning | habits | balanced
  layout: null,            // null = use the goal preset; otherwise:
  // { order: ['hero', 'learn', ...], hidden: ['activities'], open: ['habits'] }
  onboarded: false
}
```

Rules in `normalizeAppearance()`: unknown theme, mode or goal falls back to the default; unknown section ids are dropped; sections added in a later release are appended at the end and shown, so an old saved layout never hides a new feature. Include `lifelog.appearance` in JSON backup and restore (F7). It is a device preference, so it is never exported to the vault.

New code: `src/logic/appearance.js` (load, save, normalise, `layoutFor(goal, custom)`), `src/logic/goals.js` (the preset table), and `src/ui/todayView.js` renders sections in `layoutFor()` order.

## Part 3: First run and Settings (F64)

### First-run picker (new installs only)

Shown once when `onboarded` is false and the install is new (hook into `isSeeded`). It is a full-screen window, three short steps with a progress row of three dots and `Skip` at the top right:

1. **What is this for?** Four big cards, one choice: Fitness ("Workouts, weight and protein first"), Learning ("Practice and study time first"), Habits ("Daily checklist and streaks first"), Balanced ("A bit of everything"). `NEXT`.
2. **Pick a look.** Five theme swatches (round, 56 px, accent over card color) and an Auto / Light / Dark segmented control. A small live preview of the Today hero and a button repaints as you tap. `NEXT`.
3. **You're set.** One line: "You can change this any time in Settings > Appearance." `START`.

Skip at any step saves Balanced, Peach and Auto. Starter habits and areas could follow the goal later (Fitness: Workout, Protein, Steps; Learning: Practice, Study, Read), but that needs your call on default content, so it is not in this plan.

Existing installs do not see the picker. They get a What's New line (`src/logic/updates.js`): "New: color themes and goal layouts in Settings > Appearance."

### Settings > Appearance (new section at the top of Settings)

Same Forma grouped-card style as the rest of Settings:

- `Theme`: a row of five swatches; the selected one gets a 2 px ring in `--text` and a check.
- `Mode`: select row, Auto / Light / Dark.
- `Goal`: select row, Fitness / Learning / Habits / Balanced.
- `Today layout`: link row, `Custom >` or `<Goal> >`; opens the layout window.
- Note: "Themes and layout are saved on this device only."

## Build order

Each step ships on its own.

1. **Token cleanup** (part of F62): replace hard-coded colors, rename peach tokens. No visual change; check every tab against screenshots.
2. **Themes** (F62): `themes.js`, CSS blocks, no-flash script, theme-color, contrast test, Settings > Appearance with Theme and Mode.
3. **Section list** (F63, after F60 step 1): Today renders from a section order; Balanced matches v2 exactly.
4. **Goals and the layout window** (F63): goal presets, hero variants, Goal row in Settings, Today layout window, reset and the confirm prompt.
5. **First-run picker** (F64), What's New line, backup and restore of `lifelog.appearance`.

## Later (not planned yet)

- Custom accent color picker on top of a preset (would need a live contrast check to block unreadable picks).
- Drag to reorder in the layout window.
- Text size (Default, Large).
- Goal-based starter habits and areas.
- Seasonal or high-contrast themes.
