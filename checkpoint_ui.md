# for visual UI adjustments and layout refinements

- ornament positioning and sizing should be px or % not rem based.
- ornaments should be positionable in % of their size, so that they can be placed in the same relative position on different sized screens. to achieve this they may need to be wrapped in a container that is sized to intended ornament size (different for different ornaments), and then the ornament positioned inside that container.
- ornament positions relative to the window corners should be the same on different screen sizes. e.g. if half the parrot is cropped on a small screen, then half the parrot should still be cropped on a large screen too, even if the parrot is scaled differently. ornaments should not encroach further into the display on larger screens, than they do on smaller ones. this may require the ornament wrapper to be positioned relative to the window or body, if not already.

## 2026-06-20 Dev log

- Agreed implementation plan for ornaments:
- replace direct fixed emoji nodes with fixed corner wrappers plus inner ornament glyph nodes.
- size each wrapper with `clamp(px, vw, px)` values rather than `rem` offsets and `rem` sizing.
- anchor wrappers to viewport corners using browser/safe-area offsets only; keep crop consistency relative to the wrapper box.
- position the inner ornament inside the wrapper with `%` offsets of wrapper size so the visible crop stays stable across screen sizes.
- keep rotation and motion on the inner ornament only so the wrapper remains the fixed crop anchor.
- resolve the earlier ambiguity in favour of wrapper-box crop consistency rather than emoji-silhouette-perfect consistency.
- use current mobile screenshots as the target feel for top-left leaves and bottom-right parrot crops while converting to the wrapper model.

## 2026-06-23 Dev log

- Agreed next-version UI architecture should separate three different flows instead of treating them as one general "floating" behaviour:
    - composition flow
    - test-solution flow
    - decoration flow
- Main reason: the current cross-device inconsistency comes more from brittle custom positioning and mixed responsibilities than from Pico itself.

### Agreed flow split

- Composition flow:
    - the palette should remain part of normal page composition
    - on suitable layouts, the palette container may use `position: sticky` inside the palette column
    - the sticky element should be a child of the palette column rather than a viewport-fixed element
    - the workspace remains the primary scrolling/editing area
- Test-solution flow:
    - treat this as a temporary run mode rather than an extension of the normal editing layout
    - prefer a dedicated execution view near the puzzle-state animation over trying to make the live editable workspace float reliably on every device
    - a JS-controlled presentation state is acceptable here because the run view is part of an animated simulation flow
    - if a richer animated relocation is unreliable, the fallback should be a simpler DOM location swap or read-only execution mirror with a clear restore path
- Decoration flow:
    - ornaments remain non-essential decorative layers
    - use absolute/fixed wrapper boxes with image or emoji backgrounds and keep the positioning logic centralised
    - decorative positioning may use safe-area and browser-chrome offsets, but those rules must stay isolated from core layout behaviour

### Recommended implementation order for the next version

1. Stabilise shared assembly placement and sizing behaviour across real devices before adding new UI complexity.
2. Replace the current run-focus/floating-workspace approach with a simpler, explicit execution-view model.
3. Introduce sticky palette behaviour as a shared composition enhancement where the parent/child layout chain supports it.
4. Simplify ornament compensation logic and keep it independent from puzzle and page-shell layout rules.
5. Only after those shared fixes, widen into new learning-path content such as the proposed Learning Hut.

### Guardrails for the next UI slice

- Do not use one mechanism to solve all three flows.
- Do not let decorative positioning rules influence core puzzle layout.
- Use sticky only where ancestor overflow and height rules allow it to behave predictably.
- Keep the editable workspace as the source of truth; any run-mode preview should be derived from shared program state rather than becoming a second editable surface.
- Prefer simpler fallback states over geometry-sensitive animation when device behaviour diverges.
