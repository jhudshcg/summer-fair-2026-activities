# Checkpoint 17/06/26

## Purpose of this refactor

- Reduce total CSS line count aggressively while retaining current behaviour and overall visual identity.
- Move away from one oversized shared stylesheet toward a smaller, clearer split between common page chrome, layout structure and puzzle-specific presentation.
- Keep related shared client-side behaviour under the same refactor umbrella when layout, ornaments, browser chrome handling and page bootstrapping logic need to move with the CSS structure.
- Make better use of vendored Pico CSS for container sizing, grid structure, article/card semantics, spacing rhythm, buttons and default typography so bespoke layout code is only kept where it materially improves the experience.
- Keep the existing stylesheet available during the refactor as a reference source for current spacing, layout and responsive behaviour.

## Current state after the recent refactor work

- `public/css/old_style.css` is now the frozen reference copy and is no longer part of the active page load path.
- The active stylesheet split is in place across the site:
  - `public/css/style.css` for shared theme, tokens, status chips, page chrome and ornaments
  - `public/css/layout.css` for shared shell and responsive layout structure
  - `public/css/puzzles.css` for Bubble Sort and Algorithm Maze puzzle presentation
- The checkpoint file itself is now `checkpoint_refactor.md` so the same running record can cover shared CSS and shared JS refactor work together.
- Shared pages and active puzzle pages now load the split CSS files rather than the legacy stylesheet.
- Shared decorative ornaments were moved to a common injected layer so the same markup and positioning logic can be reused across pages.
- Decorative glyphs used for ornaments and celebration effects now render through CSS-generated content rather than copyable text nodes in the DOM.
- Shared mobile/browser-chrome logic has now been extracted from `public/js/app.js` into `public/js/mobile-layout.js` so ornament injection, viewport measurement, fallback detection and resize binding live in one dedicated file.
- All live page entry points now load `public/js/mobile-layout.js` before `public/js/app.js`, and `app.js` has been reduced back toward shared metadata, progress and page-render orchestration.
- Device testing showed that a geometry-only approach was not sufficient to fix the bottom toolbar mismatch on iPhone Safari.
- The current ornament positioning path therefore uses geometry and safe-area measurements as the baseline, but adds a targeted iOS Safari fallback class and offset variables for the bottom-right ornaments.
- Shared ornament positioning now also supports a general Apple-platform root class so the top-left palm ornament can apply a small macOS/iOS-specific left offset through `--mac-palm-left-adjustment` without affecting other platforms.
- Temporary browser-chrome diagnostics are now written to `console.log` from the shared mobile layout module so Safari measurements can still be inspected without adding visible debug UI.

## Current follow-up focus for this refactor

- Keep the shared styling split stable while the remaining puzzle pages are implemented.
- Tune the iOS Safari fallback offsets in `public/css/style.css` only as much as device testing requires, while keeping the generic geometry path intact for other browsers.
- Keep mobile layout fixes inside `public/js/mobile-layout.js` unless they clearly belong to puzzle-specific code.
- Revisit further CSS line-count trimming after more puzzle slices are live, so reductions do not fight still-moving UI requirements.

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
- Current agreed breakpoint direction for the next responsive cleanup pass:
  - treat below `390px` as the smallest-phone baseline with mostly single-column layout
  - use `390px` as the first shared enhancement point where portrait-mobile-safe two-column layouts can begin
  - keep `672px` as the tablet transition width
  - keep `1024px` as the desktop breakpoint
  - do not introduce a `481px` tier in the initial conversion pass
  - when expressing breakpoint boundaries in CSS, prefer exact shared values with range syntax such as `@media (width >= 390px)` and `@media (width < 672px)` rather than `+1`, `-1`, or `.99` handoff numbers
  - initial conversion scope is intentionally narrow: move the first shared two-column layout promotion to `390px`, while leaving current single-column and later breakpoint rules in place until a later cleanup pass
  - agreed follow-up adjustments for the remaining formerly-`512px` rules:
    - keep shell padding tighter below `672px`
    - keep placeholder-art narrow typography rules active through `672px`, with the larger placeholder-art typography only above that point
    - keep the Bubble Sort and maze compact puzzle overrides at `480px` and below

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

## Recent validation completed

- The shared CSS files and recent ornament-layout changes validated clean in the editor.
- The shared mobile-layout extraction validated clean in the editor across `public/js/mobile-layout.js`, `public/js/app.js`, and the updated HTML entry points.
- Fresh page loads confirmed that `public/js/mobile-layout.js` is loaded, the ornament layer still renders, and `window.summerFairMobileLayout` is available to `app.js` during startup.
