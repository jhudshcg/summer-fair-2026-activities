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
