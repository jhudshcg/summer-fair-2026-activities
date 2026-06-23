# CSS Style Guide

This file defines the shared CSS rules for the repo so future work stays simple, robust, and more consistent across mobile devices.

## Purpose

- Keep Pico as the base layer for generic UI rather than fighting it with unnecessary custom layout code.
- Reduce cross-device fragility caused by custom positioning, narrow one-off overrides, and mixed responsibilities between shared and puzzle-specific CSS.
- Give future slices a small set of rules to follow before adding more CSS.

## Core principles

- Prefer simple, flow-based layout over positional correction.
- Keep essential UI in normal document flow whenever possible.
- Treat decorative layers as optional enhancement, not structural layout.
- Use shared tokens, shared breakpoints, and shared component rules before adding local overrides.
- Prefer deletion, consolidation, and reuse over adding more selectors.

## Styling layers

### Pico layer

- Let Pico own the boring baseline:
    - buttons
    - form controls
    - standard typography rhythm
    - simple article/card structure
    - container sizing where it is sufficient
- Only override Pico when the project needs clearly differ from the default behaviour.

### Shared theme layer

- `public/css/style.css` owns:
    - tokens
    - colours
    - typography choices
    - shared surfaces
    - shared chips/tags/badges
    - ornaments
    - footer/header shared chrome
- Keep this file focused on reusable site-wide behaviour, not puzzle-specific fixes.

### Shared layout layer

- `public/css/layout.css` owns:
    - shell widths
    - column/grid transitions
    - shared page structure
    - responsive layout changes
- Keep layout concerns separate from visual styling and puzzle mechanics.

### Puzzle layer

- `public/css/puzzles.css` owns:
    - assembly blocks
    - puzzle boards
    - puzzle interaction states
    - puzzle-only compact behaviour
    - puzzle-only success and run states
- Do not place site-wide fixes here.

## Breakpoint rules

- Shared breakpoint set:
    - below `390px`: smallest-phone baseline
    - `390px` and up: first enhancement point
    - `672px` and up: tablet transition
    - `1024px` and up: desktop transition
- Do not add ad hoc breakpoint tiers such as `481px` unless they are promoted to a documented shared rule.
- Prefer these before adding breakpoint overrides:
    - `clamp(...)`
    - `minmax(...)`
    - intrinsic wrapping
    - max-width constraints
    - shared spacing variables
- When expressing breakpoint boundaries, prefer exact range syntax already used in the repo.

## Layout rules

- Prefer grid/flex layouts that can wrap naturally.
- Prefer intrinsic sizing over pixel-perfect nudging.
- Avoid solving structural layout issues with:
    - negative offsets
    - extra wrapper compensation
    - stacked `calc(...)` adjustments
    - one-off left/right positional hacks
- If a component fails in a narrow band, first try simplifying width, padding, gap, and wrapping behaviour before adding a media query.

## Sticky and floating behaviour

### Composition flow

- Sticky behaviour is allowed when it supports puzzle composition flow, for example a palette container within a palette column.
- Preferred pattern:
    - parent column remains in normal layout
    - child panel uses `position: sticky`
    - sticky panel has an explicit `top`
- Before using sticky, check ancestor rules for:
    - `overflow: hidden`
    - `overflow: auto`
    - `overflow: clip`
    - transform-based containment
- Do not use viewport-fixed positioning when sticky will solve the same UX more reliably.

### Test-solution flow

- Treat run mode as a separate presentation state.
- Prefer an explicit execution view over trying to make the live editable workspace float dynamically on all devices.
- JS-managed transitions are acceptable here because the run state is an animated interaction mode.
- If richer movement is unreliable, fall back to:
    - a simpler DOM location swap with a clear restore path
    - or a read-only execution mirror derived from shared program state

## Decorations and ornaments

- Decorations must never be required for usability.
- Use fixed or absolute wrapper boxes with inner decorative content.
- Size ornament wrappers with px/%/clamp-based rules rather than rem-led corner positioning.
- Keep ornament crop consistency relative to the wrapper box, not by tweaking the live layout around the ornament.
- Centralise browser/safe-area compensation in one place.
- Do not allow ornament-specific offsets to leak into puzzle or shell layout rules.

## Content and compatibility rules

- Do not rely on `::marker` emoji content for important visual behaviour across browsers.
- For custom bullets or icons that must render consistently, prefer explicit pseudo-elements or inline elements under project control.
- Do not depend on platform-specific emoji metrics for alignment-sensitive layout.
- Where browser support differs, prefer the simpler rendering path if it is more predictable.

## Component rules

- Each shared component should have one clear owner file.
- Each shared component should define:
    - what controls width
    - what controls spacing
    - what can wrap
    - what can scroll
    - whether it is essential or decorative
- Avoid duplicated variants when a modifier class or token change would do.

## Change discipline

- Before adding CSS, check whether Pico or an existing shared component already solves the problem.
- Before adding a new selector, check whether the issue is really layout, content size, or DOM structure.
- Before adding a new breakpoint, check whether the component can be fixed with simpler intrinsic sizing.
- If a rule is browser-specific, document why it exists in a concise comment.
- Prefer small central fixes over page-local exceptions.

## Review checklist for future CSS changes

- Is this rule in the correct file: `style.css`, `layout.css`, or `puzzles.css`?
- Does Pico already provide a safer default for this case?
- Is the behaviour essential UI, composition support, run-mode presentation, or decoration?
- Will the rule still make sense on older iPhones and mid-range Android phones?
- Can the same result be achieved with fewer selectors or fewer overrides?
- Is the change relying on geometry compensation where a simpler flow-based layout would be stronger?
