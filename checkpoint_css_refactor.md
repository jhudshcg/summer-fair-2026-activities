# Checkpoint 17/06/26

## Purpose of this refactor

- Reduce total CSS line count aggressively while retaining current behaviour and overall visual identity.
- Move away from one oversized shared stylesheet toward a smaller, clearer split between common page chrome, layout structure and puzzle-specific presentation.
- Make better use of vendored Pico CSS for container sizing, grid structure, article/card semantics, spacing rhythm, buttons and default typography so bespoke layout code is only kept where it materially improves the experience.
- Keep the existing stylesheet available during the refactor as a reference source for current spacing, layout and responsive behaviour.

## Agreed file structure

- `public/css/old_style.css`
  - frozen reference copy of the current oversized stylesheet
  - not loaded by pages after the refactor
  - kept temporarily so current layout, chip sizing and responsive behaviour can be compared while simplifying
- `public/css/style.css`
  - shared tokens, theme variables, base element styling and reusable common components used across all pages
  - examples: colour tokens, typography choices, body background, shared surface treatments, status chips, tags, shared utility-style layout helpers, shared activity cards, shared feedback surfaces
- `public/css/layout.css`
  - page structure and responsive layout rules
  - examples: main shell width, header splits, grid layouts, stack/cluster/page section composition, shared two-column transitions, shared control-row layout, shared layout breakpoints
- `public/css/puzzles.css`
  - activity-specific and puzzle-specific styling, flourishes and more decorative interaction states
  - examples: Bubble Sort chips, assembly workspace, sortable drag states, success burst, puzzle-specific mobile compact mode, placeholder-art flourish treatment if retained there after review

## Refactor strategy

### 1. Preserve a frozen reference first

- Rename the current `styles.css` file to `old_style.css` before simplification work begins.
- Use that file only as an implementation reference during this refactor.
- Do not keep two active near-duplicate stylesheets in production.

### 2. Rebuild around Pico rather than beside Pico

- Continue vendoring Pico locally.
- Let Pico own more of the baseline structure:
  - container sizing
  - article/card defaults where suitable
  - default heading and text rhythm
  - button styling and button variants
  - grid primitives where they reduce custom code cleanly
- Keep custom CSS only where the project has clear non-default needs:
  - tropical visual direction
  - status-chip structure
  - hidden-challenge locked state
  - puzzle boards, chips and drag/drop surfaces
  - narrow-screen puzzle behaviour that Pico cannot express on its own

### 3. Replace many named wrappers with a smaller shared system

- Consolidate repeated `display: grid` plus `gap` patterns into a small set of reusable shared layout classes.
- Collapse multiple pale-card variants into one shared surface treatment where their differences are cosmetic rather than structural.
- Collapse pill/tag/badge patterns into one shared chip style with only small modifiers where required.
- Remove redundant helper classes that only restate default HTML or Pico behaviour.

### 4. Reduce breakpoint complexity

- Merge duplicated medium-breakpoint logic into one clearer responsive layer.
- Keep only the smallest set of project breakpoints needed for real layout changes.
- Prefer intrinsic layout, Pico grid behaviour, `clamp(...)` and CSS custom properties before adding extra breakpoint overrides.
- Shift Bubble Sort compact mode toward variable-driven scaling rather than many descendant selector overrides.

### 5. Separate common layout from puzzle styling

- Shared page shell, activity lists, page headers, status display and general cards belong in `style.css` and `layout.css`.
- Bubble Sort shells, assembly blocks, drag states, success animation and puzzle-only responsive tuning belong in `puzzles.css`.
- Placeholder pages should use simpler shared structures so they do not force puzzle styling into the common files.

### 6. Push hard on line-count reduction

- Initial target: reduce the active production CSS from roughly 960 lines to roughly 400 to 500 lines without feature loss.
- Stretch target: approach 350 to 420 lines if decorative and highly specific overrides can be simplified safely.
- Focus reductions in these areas first:
  - duplicated layout wrappers
  - button restyling Pico already provides
  - repeated grid declarations
  - duplicated breakpoint blocks
  - Bubble Sort mobile width math that can be replaced with variables or simpler grid rules

## Concrete implementation order

1. Create this checkpoint record before editing CSS.
2. Rename `styles.css` to `old_style.css`.
3. Create new `style.css`, `layout.css` and `puzzles.css` files.
4. Update all HTML pages to load the new active stylesheets.
5. Rebuild the active CSS in the new files using the old file only as a reference.
6. First recover the shared shell and all non-puzzle pages with a leaner common/layout system.
7. Then move Bubble Sort and assembly-specific styling into `puzzles.css` with as few overrides as possible.
8. Validate that pages still load and that no JS-dependent class hooks are broken.

## Guardrails during implementation

- Preserve behaviour before polishing.
- Keep JS hook classes intact unless the related JS is updated in the same slice.
- Do not chase unrelated design changes.
- Retain the current light-theme lock and contrast rules.
- Prefer deletion and consolidation over renaming-only churn.
- Keep the old stylesheet untouched once renamed so comparisons remain reliable.

## Known cleanup issues to address during the refactor

- The current stylesheet contains stray live declarations inside the root token block that should not remain in the new common stylesheet.
- The current stylesheet references undefined custom properties for `--space-1` and `--radius-small`; the new token layer must be internally consistent.
- The current Bubble Sort mobile overrides are too specific and should be replaced with a smaller variable-led approach where possible.

## Validation expectations for this refactor slice

- All HTML pages load the new split CSS files instead of the old stylesheet.
- Shared page layout remains functional across the index and placeholder pages.
- Bubble Sort remains usable with the assembly workspace, demo chips, success state and overview mode intact.
- No editor-reported CSS errors are introduced in the new files.
- The total active production CSS line count is materially lower than before.