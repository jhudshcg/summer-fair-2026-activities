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

## Dynamic Branch Cleanup Implementation - 2026-06-30

Implemented the cleanup-first correction in `public/blockly-compact-theme/`.

Removed from `compact-theme.js`:

- `COMPACT_ROUNDED_VALUE_SHAPE`
- `makeCompactRoundedValueShape()`
- dynamic output handling in `shapeFor(connection)`
- `finalizeCompactDynamicOutput_()`
- `compactHasDynamicOutputRight`
- dynamic-output drawer methods:
    - `drawOutline_()`
    - `drawCompactDynamicOutputOutline_()`
    - `drawCompactFlatTop_()`
    - `drawCompactRightDynamicConnection_()`
    - `drawCompactFlatBottom_()`
    - `drawCompactLeftDynamicConnection_()`

Kept:

- Thrasos renderer subclass
- compact measurement constants
- balanced top/bottom row minimums
- zero-width simple wrapper connection shape
- simple-wrapper inline socket skip
- compact top/bottom row classes for right-rounded corners
- right-side row bridge that moves to each row's measured right edge before
  drawing down

Added:

- a very small `drawBottom_()` override that moves to the bottom row's measured
  right edge before delegating to Blockly's common bottom-row drawer.
- This targets the remaining bottom-right join artifacts without changing
  connection geometry or reported block widths.

Radius adjustment:

- reduced `compact.cornerRadius` from `10` to `6` in `tokens.js`
- this is intentionally conservative and keeps rounded corners visually modest
  instead of using dynamic output geometry

Cache-busted:

- `tokens.js?v=20260630b`
- `compact-theme.js?v=20260630l`

Expected manual-check outcome:

- block length/wrapping should return to the pre-dynamic-output behaviour
- connected child value blocks should stay correctly placed
- right edges should be rounded but modest
- bottom-right artifacts should be reduced by the bottom-row right-edge sync
- if artifacts remain, the next choice should be a narrower outline-only
  drawer fix or accepting less rounding on statement blocks, not reintroducing
  dynamic output geometry

## Output Row Corner Correction - 2026-06-30

Manual feedback after dynamic branch cleanup:

- `set`, `for` and `swap_items` blocks have small rounded right corners.
- White corner gaps remain fixed.
- expression blocks, array blocks and the `if` block still appear square on the
  right.
- Requested radius increased to `15px`.

Cause:

- Expression and array blocks are output/reporter blocks.
- The compact row classes still used the Zelos-style rule that keeps right row
  corners square for output blocks:
  `block.outputConnection && !block.statementInputCount && !block.nextConnection`.
- That rule is correct for Zelos because Zelos draws reporter right sides
  through its dynamic output-shape path.
- It is not correct for the cleaned-up Thrasos-based renderer because dynamic
  output geometry has been removed.
- The `if` block is partly different: much of its visible right edge comes from
  input/statement rows, not just the top/bottom row corners. Larger row corners
  may help the top/bottom portions, but any remaining square edge there should
  be treated as a row-side outline issue, not output geometry.

Implemented:

- removed the output-block right-square exception from compact top/bottom rows
- all compact top/bottom rows now request right-rounded corners
- increased `compact.cornerRadius` from `6` to `15` in `tokens.js`
- did not reintroduce dynamic output shapes or measurement changes

Cache-busted:

- `tokens.js?v=20260630c`
- `compact-theme.js?v=20260630m`

Expected manual-check outcome:

- expression and array blocks should now show rounded right corners
- existing block lengths and child placement should remain stable because
  connection geometry is unchanged
- if the `if` block still has a square right edge, the remaining issue is the
  input/statement row outline path and should be handled separately with a
  narrow row-side drawer fix

## Radius Model Review - 2026-06-30

Manual feedback after increasing the shared radius:

- White corner artifacts are evident again.
- The likely trigger is the larger static `CORNER_RADIUS = 15`.
- A small block width adjustment was proposed as a possible fix.
- Question raised: can SVG use percentage radius, or does Blockly need pixel
  radii?

Assessment:

- Blockly block bodies are SVG `path` elements, not `rect` elements.
- CSS percentage `rx`/`ry` can round field rectangles, but it cannot round an
  arbitrary Blockly block outline path.
- Blockly's common renderer precomputes `OUTSIDE_CORNERS` from a static
  `CORNER_RADIUS` in renderer constants.
- Therefore a percentage/proportional block radius is possible only if our
  renderer/drawer computes path arcs from the measured block or row height.
- A width adjustment alone is the wrong primary fix:
    - it may hide a white corner gap for one case
    - it changes measured widths or path endpoints without addressing the
      radius/height mismatch
    - it risks bringing back block length/wrapping problems

Better model:

- Treat the configured radius as a maximum, not the literal radius for every
  block.
- Compute an effective radius per block or per row:
  `min(configuredRadius, blockHeight * 0.25)`.
- This means small inner expression blocks get smaller rounding and larger
  outer statement/C blocks can use more rounding.
- Keep the calculated radius visual-only:
    - do not change connection shape width
    - do not change output/input connection offsets
    - do not change `widthWithChildren`

Implementation implication:

- The current common `OUTSIDE_CORNERS` constant cannot express a per-block
  radius.
- If proportional radius is required, the compact drawer needs a small
  outline-only override for the right-side top/bottom corners.
- That override should compute arcs from `this.info_.height` or the relevant
  top/bottom row geometry and should not alter render-info measurements.
- Continue avoiding dynamic output shapes; the previous dynamic-output branch
  solved some corners but broke width/placement because it changed geometry.

Preferred next implementation:

1. Keep `compact.cornerRadius` as `15`, but interpret it as a max radius.
2. Add a helper such as `getEffectiveRightRadius_()` in the compact drawer:
   `Math.min(constants.CORNER_RADIUS, Math.max(2, this.info_.height * 0.25))`.
3. Override only the right-corner drawing portions of top/bottom outline paths
   if this can be kept small and does not alter measurements.
4. If that cannot be kept small, revert to a smaller fixed radius (`6`-`8`) as
   the stable Thrasos-compatible option.

## White Corner Source Assessment - 2026-06-30

Question:

- Are the visible white corners actual white-filled rectangles, or transparent
  gaps showing the workspace background?

Assessment from current source:

- The compact/Thrasos block body is a single SVG path with class
  `.blocklyPath`.
- Common `PathObject.applyColour()` fills that path with the block primary
  colour and strokes it with the tertiary colour.
- The compact renderer is not creating white rectangles behind block corners.
- The visible workspace background is very pale (`#f7fff9`) and the workspace
  grid sits behind the blocks.
- The current CSS does make simple wrapper block paths transparent, but that is
  limited to blocks marked `.compactBlocklySimpleValueWrapper`; it does not
  create white rectangles.
- The likely cause of the "white corners" is transparent/unfilled SVG area:
  a gap in the composed block outline path where the rounded corner arc and
  adjacent right/bottom row path do not cover the old square extent.

How to verify in browser if needed:

- Temporarily set the workspace background to a strong colour, such as magenta.
- If the corner artifacts become magenta, they are transparent gaps.
- If they remain white, inspect the SVG element at that point; the likely
  candidates would be a field rect, an inline input outline/path, or another
  block/path element.

Implication:

- Do not fix this by adding white/colour-specific CSS.
- Do not fix it by changing connection widths or reported block widths.
- Fix it by ensuring the block outline path covers the intended area, or by
  reducing the effective corner radius so the existing common path composition
  remains valid.

Preferred fix direction:

- Treat `15px` as a maximum radius.
- Use an effective radius based on block height, capped at about `25%` of the
  rendered block height.
- If proportional path drawing cannot stay small, use a smaller fixed radius
  as the Thrasos-compatible fallback.

## Socket Rounding Design Decision - 2026-06-30

Question:

- Should value/input sockets be rounded to match the blocks placed into them?
- Or should filled sockets simply show the parent block background, with the
  child block drawn over that area?

Assessment:

- The white-corner artifacts are probably transparent gaps where the parent
  socket/outline path and the child block's rounded right side no longer cover
  the same rectangle.
- A socket should therefore be treated as part of the same visual system as the
  block placed into it.
- Styling only the child block corners is incomplete if the parent socket still
  has square/older geometry.

Preferred design:

1. Empty sockets should have their own rounded outline/background.
    - radius should be slightly smaller than the containing block's outer radius
    - use a proportional cap such as `min(parentRadius - 2, socketHeight * 0.25)`
    - this keeps empty sockets visually intentional
2. Filled sockets should not draw a competing socket outline.
    - draw/fill the socket area with the parent block colour
    - let the connected child block render on top
    - this avoids double borders and avoids white/transparent corner gaps
3. Keep this as a drawer/path visual rule only.
    - do not alter input/output connection offsets
    - do not alter child block dimensions
    - do not alter parent row measurement

Why this is cleaner:

- It matches the actual visual model: parent sockets are background cutouts and
  child blocks are drawn above them.
- It avoids inventing new output/reporter geometry.
- It keeps Thrasos measurement and snapping behaviour stable.
- It localises the change to `drawInlineInput_()` / socket path drawing, rather
  than spreading into `shapeFor()`, output connection measurements and
  render-info finalization.

Implementation note:

- The current simple-wrapper `drawInlineInput_()` skip is an early version of
  this idea, but only for configured simple wrappers.
- The next implementation should generalise the filled-socket rule carefully:
    - if an inline input is connected, fill/cover the parent socket background
      using parent colour or skip the socket outline
    - if an inline input is empty, draw a rounded empty socket with a smaller
      effective radius
    - keep standard connection shapes and measurements unchanged

## Socket Rounding Architecture Fit - 2026-06-30

How the cleaner socket approach fits Blockly:

- Blockly rendering is split into:
    - constants: standard connection shape dimensions and path fragments
    - render info: measured rows, fields, inputs, widths and connection offsets
    - drawer: converts measured rows/elements into SVG path strings
    - path object: owns the actual SVG path elements
- Rounded/filled socket visuals belong in the drawer layer because they are
  presentation of already-measured inline input elements.
- They should not be implemented through `shapeFor()` unless we intend to
  change connection geometry.
- They should not be implemented through render-info finalization unless we
  intend to change measured block dimensions.

Architecturally sound target:

- Leave constants/static connection shapes alone for snapping and measurement.
- Leave render-info widths, offsets and row placement alone.
- In `CompactBlocklyDrawer.drawInlineInput_()`:
    - for connected inline inputs, position the connection but avoid drawing a
      competing socket outline that can peek around child rounded corners
    - for empty inline inputs, draw a rounded placeholder socket using the
      measured inline input box
- Keep the simple-wrapper branch as a special case if those wrappers must remain
  border-only.

Potential issues:

- Empty socket affordance:
    - if connected sockets suppress their outline, empty sockets still need a
      clear placeholder so learners know where blocks can be dropped.
- Drag/insertion markers:
    - insertion markers may rely on visible socket/highlight paths; suppressing
      connected socket outlines must not remove connection highlights.
- Replacement/highlight paths:
    - `drawConnectionHighlightPath()` may still use the standard shape path.
      If empty sockets are rounded differently, highlights may not perfectly
      match unless separately adjusted.
- Parent colour lookup:
    - drawing a parent-colour fill path requires a reliable way to use the
      current block style/colour; skipping the connected socket outline is
      simpler and less brittle than drawing a new fill.
- External value inputs:
    - the current puzzle mostly uses inline inputs. External value inputs are
      drawn by `drawValueInput_()` and should not be changed as part of this
      slice.
- Statement inputs:
    - C-shaped/statement blocks use `drawStatementInput_()`, not
      `drawInlineInput_()`. Any remaining artifact on the `if` block may need a
      separate statement-row treatment.
- Empty-vs-connected transitions:
    - Blockly rerenders on connection changes, so this should update naturally,
      but manual checks should include plugging/unplugging blocks.
- Hit testing/snapping:
    - safe as long as connection offsets and render-info dimensions are left
      unchanged. Unsafe if the socket path fix starts modifying shape widths or
      offsets.

Preferred implementation constraint:

- Keep the implementation to a narrow `drawInlineInput_()` override plus a
  small helper for rounded empty socket path generation.
- Do not reintroduce dynamic output shapes, output connection offset changes,
  or render-info width changes.

## Filled Inline Socket Suppression Plan - 2026-06-30

Implementation slice:

- Generalise the existing simple-wrapper socket skip.
- In `CompactBlocklyDrawer.drawInlineInput_()`:
    - if the inline input has a connected child block, position the connection
      and return without drawing the parent socket outline
    - otherwise fall back to Blockly's common `drawInlineInput_()` for empty
      sockets

Rationale:

- This directly targets filled-socket corner gaps.
- It leaves empty socket affordance, connection highlights and insertion marker
  behaviour on Blockly's common path for now.
- It does not alter constants, connection shapes, connection offsets, measured
  widths, child block dimensions or render-info finalization.

Expected manual-check outcome:

- Filled expression/list sockets should no longer show parent socket corner
  gaps around connected child blocks.
- Empty sockets should remain as before.
- If empty socket shape later needs to match the rounded style, implement that
  as a second narrow drawer-only slice.

## Filled Inline Socket Suppression Implementation - 2026-06-30

Implemented in `public/blockly-compact-theme/compact-theme.js`.

Change:

- `CompactBlocklyDrawer.drawInlineInput_()` now checks `input.connectedBlock`.
- If the inline input is connected:
    - it calls `positionInlineInputConnection_(input)`
    - it returns without adding the parent inline socket path
- If the inline input is empty:
    - it falls back to `super.drawInlineInput_(input)`

Scope:

- no `shapeFor()` changes
- no connection offset changes
- no render-info width or row changes
- no dynamic output geometry
- no external value input or statement input changes

Cache-busted:

- `compact-theme.js?v=20260630n`

Manual checks needed:

- confirm filled inline sockets no longer show white/transparent corner gaps
- confirm connected child block placement remains stable
- confirm empty sockets still display an understandable drop target
- confirm connection highlighting still appears when dragging over sockets

## Empty Inline Socket Footprint Plan - 2026-06-30

Manual feedback after filled-socket suppression:

- White corner gaps are fixed for filled inline sockets.
- Empty inline sockets now shrink to almost zero width after a child block is
  dragged out.
- This is poor UX because learners lose the visual drop target.

Cause:

- Blockly measures an empty inline input as:
  `EMPTY_INLINE_INPUT_PADDING + connectionWidth`.
- The compact renderer had `EMPTY_INLINE_INPUT_PADDING = 0`.
- The compact puzzle tab width is only `4px`, so an empty socket became roughly
  `4px` wide.

Implementation direction:

- Restore a small but intentional empty socket footprint through constants:
    - `emptyInlineInputWidth: 30`
    - `emptyInlineInputHeight: 18`
    - `emptyInlineInputRadius: 6`
- Keep connection geometry stable:
    - no `shapeFor()` changes
    - no connection offset changes
    - no render-info finalization changes
- Keep the filled-socket behaviour:
    - connected inline inputs still position the connection and skip the parent
      socket outline
- For empty inline inputs only, draw a rounded transparent cutout from the
  measured empty input box.

Expected manual-check outcome:

- Empty inline sockets remain visible after unplugging a value block.
- Empty sockets have rounded corners and a reasonable touch/visual target.
- Filled inline sockets continue to avoid the white/transparent corner gaps.

Implementation:

- Added empty inline socket size/radius tokens in `tokens.js`.
- `applyCompactMeasurements()` now uses those tokens for
  `EMPTY_INLINE_INPUT_PADDING` and `EMPTY_INLINE_INPUT_HEIGHT`.
- `CompactBlocklyDrawer.drawInlineInput_()` now:
    - skips connected socket drawing as before
    - draws a rounded empty socket cutout for unconnected inline inputs
- Cache-busted:
    - `tokens.js?v=20260630d`
    - `compact-theme.js?v=20260630o`

## Compact Renderer Direction and Lessons - 2026-06-30

Latest manual feedback:

- The rounded empty socket approach is directionally correct.
- The empty socket should be closer to the containing block's row height.

Adjustment:

- Increased `emptyInlineInputHeight` from `18` to `22`.
- Cache-busted `tokens.js` to `v=20260630e`.
- No renderer logic changed in this adjustment.

Current direction:

- Keep the renderer Thrasos-based.
- Keep Blockly's normal connection geometry and render-info measurements.
- Use constants only for stable compact spacing and explicit empty-socket size.
- Use the drawer layer only for visual presentation:
    - right-side row bridging
    - connected inline socket suppression
    - rounded empty inline socket cutout
- Avoid dynamic output shapes and render-info finalization changes.

Lessons learnt:

- Rounded corners on the right side are visual path composition work, not a good
  reason to change output connection geometry.
- The dynamic output-shape attempt created the serious block length and child
  placement regressions because it changed measured widths and offsets.
- The white corner issue was a transparent gap between parent socket/path
  drawing and child rounded block drawing, not a white rectangle needing CSS.
- Suppressing connected parent socket outlines is the clean fix for filled
  socket gaps because the child block should visually own that space.
- Empty sockets still need their own measured footprint; otherwise Blockly
  falls back to `EMPTY_INLINE_INPUT_PADDING + connectionWidth`, which collapsed
  to roughly the compact tab width.
- Socket tuning should remain token-driven where possible, so visual iteration
  does not sprawl into renderer logic.

Progress:

- Filled inline sockets no longer show the original white/transparent corner
  gaps.
- Empty inline sockets now remain visible and rounded when unplugged.
- The current open visual tuning item is the exact empty socket height/width/
  radius balance.

## Theme-Derived Empty Socket Height - 2026-06-30

Superseded by "Empty Socket Height Correction - 2026-06-30" below. This entry
records the intermediate step that still treated `24px` as a configured
minimum; the corrected model derives the height from renderer row constants.

Manual direction:

- `24px` is probably the right default empty inline socket height.
- It should still be themeable.
- It should be based on the value/variable font size and the containing size
  used for plain value/variable blocks.

Implementation:

- Changed `emptyInlineInputHeight` from a fixed number to a nullable override:
    - `null` means "derive from theme values"
    - a numeric value still explicitly overrides the derived height
- Added theme tokens:
    - `valueFieldVerticalPadding: 1`
    - `simpleValueBlockVerticalPadding: 5`
    - `simpleValueBlockMinHeight: 24`
- Derived empty inline socket height as:
  `max(simpleValueBlockMinHeight, valueFieldHeight + simpleValueBlockVerticalPadding * 2)`.
- With the current font size (`13`) and padding tokens, the derived default is
  `24px`.
- `FIELD_BORDER_RECT_HEIGHT` and `FIELD_DROPDOWN_BORDER_RECT_HEIGHT` now derive
  from the same font/padding helper instead of staying hard-coded at `14`.

Rationale:

- The socket height now tracks the same visual scale as compact value and
  variable fields.
- Theme authors can either tune the scale through font/padding/min-height tokens
  or force an exact empty socket height with `emptyInlineInputHeight`.
- This keeps the renderer logic stable and makes further visual tuning token
  work rather than renderer work.

Cache-busted:

- `tokens.js?v=20260630f`
- `compact-theme.js?v=20260630p`

## Empty Socket Height Correction - 2026-06-30

Correction after review:

- The previous derived model still treated `24px` as a configured minimum.
- That was not the intended behaviour.
- The empty socket height should match whatever height the renderer gives a
  plain value/variable wrapper block, not preserve today's value as a target.

Updated model:

- Removed the `simpleValueBlockVerticalPadding` and `simpleValueBlockMinHeight`
  tokens.
- Kept `emptyInlineInputHeight: null` as an optional explicit override.
- When no override is supplied, derive empty inline socket height from the same
  renderer row constants that produce the current plain value/variable wrapper
  height:
  `TOP_ROW_MIN_HEIGHT + DUMMY_INPUT_MIN_HEIGHT + BOTTOM_ROW_MIN_HEIGHT`.
- Since current constants are `5 + 14 + 5`, the result is currently `24px`.
- If the value/variable field height, top row, dummy row, or bottom row changes,
  the empty socket height follows automatically.
- `DUMMY_INPUT_MIN_HEIGHT` and `DUMMY_INPUT_SHADOW_MIN_HEIGHT` now derive from
  the value field height, so font-size changes affect both the plain value block
  and the empty socket height through the same row model.

Rationale:

- This makes the empty socket match the containing shape used by simple
  `sf_number` and `variables_get` blocks.
- It avoids turning a currently observed visual result into a hard-coded design
  rule.
- It keeps visual tuning themeable through the row and field-height tokens that
  already define the compact renderer's value block scale.

Cache-busted:

- `tokens.js?v=20260630g`
- `compact-theme.js?v=20260630q`

## Empty Socket Visibility Correction - 2026-06-30

Manual feedback:

- Deriving the empty socket from the full simple value/variable wrapper height
  made the empty socket read as missing again.

Cause:

- The full wrapper height includes the top and bottom row caps.
- An inline socket drawn as a transparent cutout at that full height can consume
  the containing row's visible parent-colour margin.
- That leaves little visual contrast, so the socket appears to collapse or
  disappear even though the measured input still exists.

Correction:

- Keep the empty socket linked to the simple value wrapper geometry.
- Derive default empty socket height as:
  `simpleValueBlockHeight - capInset`.
- Derive `capInset` from the current top/bottom row caps:
  `round(min(TOP_ROW_MIN_HEIGHT, BOTTOM_ROW_MIN_HEIGHT) / 2)`.
- Keep a floor at `DUMMY_INPUT_MIN_HEIGHT`.
- With current constants this gives `24 - 2 = 22`, matching the last visible
  empty socket state without hard-coding `22`.

Rationale:

- The empty socket now tracks the value/variable wrapper size but remains an
  inset socket inside the parent row.
- If the compact row caps or value-field height change, the empty socket still
  follows the same renderer geometry.
- A numeric `emptyInlineInputHeight` token remains available for an explicit
  override if needed.

Cache-busted:

- `compact-theme.js?v=20260630r`
