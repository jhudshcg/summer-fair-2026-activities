# Blockly Checkpoint - 30-6-26

Use this dated checkpoint as the current handoff point for Blockly migration and compact-theme work. The older `blockly_checkpoint.md` remains useful as a long historical log, but new Blockly migration notes should be dated from this point onward.

## Current Objective

- Evaluate Blockly as the block-based editor substrate for broader educational lesson/challenge sets.
- Use the Bubble Sort/open-day activity as a practical testing ground for:
    - compact block vocabulary
    - reusable Blockly theme/renderer customisation
    - mobile-fit and horizontal density
    - preserving drag, snap, editable field and code-generation behaviour

## Current Work Slice

- Compact Blockly visual/theming spike in:
    - `public/blockly-compact-theme/`
    - `public/js/blockly-activities/bubble-sort/`
    - `public/js/blockly-spike.js`
    - `public/prototype_tests/blockly-spike.html`
- Current visual target:
    - simple value/variable wrapper blocks should visually shrink to their contained field outline
    - compound expression blocks can keep a rounded/pill container
    - variables/operators in expressions should align cleanly
    - white corner/background artifacts should be removed

## Current Implementation State

- Compact theme files:
    - `tokens.js`: shared colours, compact defaults, and `simpleValueWrapperBlockTypes`
    - `compact-theme.js`: compact theme creation and custom `compact_blockly` renderer
    - `compact-fields.js`: no-arrow fields while preserving click/tap editing
    - `compact.css`: compact CSS fallbacks and editor input resets
    - `debug-probe.js`: optional browser debug summary
- Bubble Sort-specific blocks/generators were moved out of the reusable theme layer into:
    - `public/js/blockly-activities/bubble-sort/blocks.js`
    - `public/js/blockly-activities/bubble-sort/generators.js`
- Blockly is now loaded locally from `public/vendor/blockly/`, not CDN.

## What Is Working

- Compact block vocabulary is in place for the Bubble Sort-shaped starter program.
- Dropdown arrows are removed while dropdown/variable fields remain clickable.
- Number editor Pico background artifacts were fixed earlier.
- `sf_number` and `variables_get` are identified as simple value wrapper blocks through `tokens.js`.
- Simple wrapper block body/socket hiding partly works visually, but not enough.
- Static checks currently pass:
    - `npm run check:blockly-theme`
    - `git diff --check`

## Known Visual Failures

- Vertical alignment is still wrong between:
    - simple wrapper variables/values
    - operator fields
    - nearby compound expression content
- White corner/background artifacts are still visible.
- Latest manual screenshot feedback says neither issue was fixed by the most recent renderer/CSS changes.

## Failed Or Suspect Attempts

- CSS-only hiding of simple wrapper block paths:
    - attempted with `.compactBlocklySimpleValueWrapper .blocklyPath`
    - insufficient because Blockly still measures and positions the child as a normal output block
- Skipping parent inline socket drawing:
    - implemented in `CompactBlocklyDrawer.drawInlineInput_()`
    - removes a visual surround layer but does not fix child field placement or height
- Zero-width simple-wrapper value shape:
    - implemented through `CompactBlocklyConstants.shapeFor(connection)`
    - did not fix vertical alignment in manual testing
- Hiding `.blocklyPathLight`:
    - did not remove white corner artifacts
    - should be treated as suspect, not expanded
- Rounded-right row experiment:
    - `CompactBlocklyTopRow`
    - `CompactBlocklyBottomRow`
    - `CompactBlocklyRenderInfo`
    - `CompactBlocklyDrawer.drawRightSideRow_()`
    - may be contributing to white corner artifacts because it changes row corner choice without a fully coherent outline path

## Likely Deeper Cause

- The desired simple-wrapper appearance is not just hidden chrome.
- The desired geometry is that the block's measured/rendered footprint matches the editable field it contains.
- Blockly still treats `sf_number` and `variables_get` as normal output blocks:
    - normal block dimensions
    - normal internal field placement
    - normal connection positioning
- Hiding the outer path leaves the old geometry behind.

## Next Approach

1. Do not add more CSS masking.
2. First isolate the white corner artifact:
    - temporarily disable the rounded-right row override classes/methods
    - check manually whether the white corners disappear
    - if yes, replace the rounded-right experiment with one coherent drawer/path solution
    - if no, inspect browser SVG to identify the actual visible element or path gap
3. Rework simple wrappers as a measured/rendered footprint problem:
    - keep `simpleValueWrapperBlockTypes` as source of truth
    - investigate a narrow `RenderInfo.finalize_()` or drawer branch for these block types
    - derive block size/output offset from the field measurable/bbox, not the normal output block outline
    - keep the field's existing Blockly appearance unchanged
    - keep drag/snap/edit behaviour
4. Consider replacing stock `variables_get` with a compact custom variable reporter block if stock geometry is too hard to control cleanly.

## Suspect Code To Reassess Before More Work

- `public/blockly-compact-theme/compact.css`
    - `.compact-blockly .blocklyPathLight { display: none; }`
    - `.compactBlocklySimpleValueWrapper .blocklyPath` hiding
- `public/blockly-compact-theme/compact-theme.js`
    - `SIMPLE_VALUE_WRAPPER_SHAPE`
    - `shapeFor(connection)` simple-wrapper branch
    - `drawInlineInput_()` simple-wrapper branch
    - `CompactBlocklyTopRow`
    - `CompactBlocklyBottomRow`
    - `CompactBlocklyRenderInfo`
    - `drawRightSideRow_()` override

## Verification Rule

- Do not run Playwright unless explicitly requested.
- For this slice, use:
    - `npm run check:blockly-theme`
    - `git diff --check`
    - user/manual browser screenshots for visual correctness

## Stop Conditions

- Stop if the solution starts requiring broad renderer rewrites.
- Stop if more CSS masking is being added without identifying the SVG/layout source.
- Stop if visual feedback contradicts the assumed fix.

## Renderer Architecture Review - 2026-06-30

Manual feedback after the later dynamic-output work:

- White rectangular corner gaps are mostly fixed.
- Some lower/right corner artifacts remain, especially on blocks judged by their
  bottom edge.
- Block placement was fixed after restoring the normal output connection
  vertical anchor.
- Block length/parent wrapping is now visibly wrong in several places.
- The amount of renderer code added is disproportionate to the stated goal:
  simpler shapes plus rounded right corners.

### Why The Current Approach Is Suspect

The current `compact-theme.js` has crossed from a small Thrasos customization
into a partial Zelos-style renderer:

- custom value/output shape
- custom output-shape dimensions
- custom output connection offsets
- custom render-info finalization
- custom output outline drawer branch
- custom row classes
- custom right-side row drawing
- wrapper-specific input drawing suppression

That is not architecturally sound as a partial implementation. Zelos works
because its constants, rows, render info, drawer and path object are designed as
one system. The compact renderer is now borrowing pieces of that system while
still relying on Thrasos/common measurement for the rest.

### Why Block Lengths Are Now Wrong

The dynamic-output branch does not only change the right-side path. It changes
layout measurements:

- `shapeFor()` returns a dynamic output shape for value reporters.
- `finalizeCompactDynamicOutput_()` then sets dynamic output width/height.
- It adds output shape width to `startX`, `width` and `widthWithChildren`.
- For simple reporters with a rounded right side, it also adds a second
  `rightSideWidth`.
- Parent inline rows use connected child block dimensions when computing row
  widths.

Result: output/reporter blocks now report different widths from the simpler
Thrasos/common model. Parents then wrap too far, not far enough, or align
against stale row widths depending on where the mutation happens in the render
pipeline.

The placement break from the previous iteration had the same root class of
problem: visual shape work changed Blockly connection geometry.

### Why The Remaining Corner Artifacts Persist

The lower-block artifacts are likely not the original white-background gap.
They are now more likely row-join/path artifacts from mixing:

- rounded row-corner elements
- the `drawRightSideRow_()` horizontal bridge
- statement rows and bottom rows with different measured widths
- dynamic-output blocks that bypass ordinary row drawing

This means another small bridge or CSS mask is unlikely to be the right fix.

### Recommended Correction

Do not continue extending the current partial dynamic-output branch.

Best next slice:

1. Back out the custom dynamic output shape path:
    - remove `COMPACT_ROUNDED_VALUE_SHAPE`
    - remove `makeCompactRoundedValueShape()`
    - remove dynamic output handling from `shapeFor()`
    - remove `finalizeCompactDynamicOutput_()`
    - remove `compactHasDynamicOutputRight`
    - remove the dynamic-output drawer branch
2. Keep the proven compact pieces:
    - compact constants and spacing
    - balanced top/bottom row minimums
    - simple wrapper type detection
    - border-only simple wrapper visual treatment
3. Rebuild rounded right corners without changing output connection geometry:
    - use normal Thrasos/common static value/output connection shapes
    - make right rounding a drawer/path-outline concern only
    - preserve `TAB_OFFSET_FROM_TOP`, output connection width, child block
      width, `widthWithChildren` and parent inline row measurement
4. If that still requires broad drawer logic, stop and choose one of two
   cleaner architectures:
    - subclass Zelos and compact its constants/spacing, accepting the heavier
      renderer because it owns dynamic output geometry coherently
    - keep Thrasos and accept less ambitious right-side rounding for output
      reporters, prioritising correct layout and speed

Preferred direction:

- Clean up back toward a small Thrasos-based renderer first.
- Do not keep a partial Zelos port inside a Thrasos subclass.
- Treat rounded right corners as visual outline decoration unless we deliberately
  switch to a full Zelos-style geometry model.

### Immediate Stop Rule

Before any further implementation, remove or gate the dynamic-output branch.
The current branch is the source of the block-length regressions and should not
be patched around.
