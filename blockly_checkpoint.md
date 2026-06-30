# Blockly checkpoint

Use this file to track Blockly-specific migration planning, spike notes, integration findings, and next steps.

Current dated handoff checkpoint: `blockly-checkpoint-30-6-26.md`.

## Dev log

### 2026-06-27

- Initial Blockly checkpoint created to separate Blockly migration work from the broader shared assembly checkpoint.
- Added `blockly_quick_guide.md` as a condensed repo-specific cheat sheet for Blockly integration, theming, styling, placement, and useful manual override seams.
- Added a compactness planning note for making Blockly much more space-efficient horizontally while preserving configurability.
- Clarified project direction:
    - the Summer Fair / open-day activities are now mainly a practical test group for Blockly migration
    - the larger goal is a more flexible educational activity system for block-based programming inside lesson/challenge sets
    - the current near-term spike remains the Blockly page, with emphasis on suitability, theming, mobile fit, and horizontal block compactness
- Current agreed near-term scope, taken from `blockly_migration_plan.md` Stages 0-2:
    - evaluate Blockly as the block editor substrate
    - focus on theming and visual integration
    - focus on mobile drag-and-drop behaviour
    - focus on click / tap-to-place behaviour
    - focus on nearest-match placement behaviour
    - integrate with the existing Summer Fair puzzle shell and puzzle logic
- Explicitly deferred in this early checkpoint phase:
    - shared runtime extraction beyond what is needed for the first spike
    - Python execution runtime
    - final decision on Blockly for rearrangement mode
    - broad custom shell-geometry migration into Blockly blocks
    - replacement of all custom editor modes
- First compact-default implementation pass completed:
    - compact Blockly style is now treated as the default, not a mobile-only mode
    - shared Blockly tokens now carry compact defaults for base font size, workspace start scale and grid spacing
    - shared Blockly theme API exposes compact settings for reuse by later puzzle pages
    - shared Blockly customization layer now owns compact teaching blocks for:
        - `set variable`
        - list literal
        - list length
        - addition and subtraction expressions
        - counted loops with hidden default step
        - indexed list comparison
        - indexed list swap
    - the Blockly spike starter workspace and toolbox now use the compact shared blocks instead of the wider stock blocks for the Bubble Sort-shaped program
    - generated JavaScript and Python support was added for the new compact blocks so the preview and output panes remain connected to the workspace
- Validation completed:
    - `node --check public/js/blockly-theme/tokens.js`
    - `node --check public/js/blockly-theme/summer-fair-theme.js`
    - `node --check public/js/blockly-theme/block-customizations.js`
    - `node --check public/js/blockly-spike.js`
- Remaining validation gap:
    - browser validation still needed on `public/prototype_tests/blockly-spike.html` to confirm Blockly runtime hydration, generated code output, preview animation and actual horizontal width improvement
    - no local Playwright/package test setup exists in the repo at this point
- Compact follow-up refinement completed:
    - operator blocks now use a clickable/tappable Blockly dropdown field again instead of fixed text
    - comparison operator in the compact indexed-list condition is also a dropdown field
    - shared Blockly CSS hides dropdown arrow glyphs so variable, value and operator fields remain editable without spending width on the arrow
    - `sf_for_count` now reads `for variable from ... to ...` instead of using `=`
    - `sf_for_count` no longer shows `do`, reducing the visible loop backbone width
    - displayed subtraction uses an en dash in the dropdown label while generated JavaScript/Python still emit normal subtraction syntax
    - the spike now asks the shared theme layer to register/use a compact renderer where Blockly exposes the expected renderer API
    - default compact scale and grid spacing were tightened further
    - cache-busting query strings were updated for changed spike assets
- Additional validation completed after the follow-up:
    - `node --check public/js/blockly-theme/tokens.js`
    - `node --check public/js/blockly-theme/summer-fair-theme.js`
    - `node --check public/js/blockly-theme/block-customizations.js`
    - `node --check public/js/blockly-spike.js`
- Additional browser validation needed:
    - confirm dropdown arrows are hidden across variable, value and operator fields while fields remain tappable/clickable
    - confirm the compact renderer loads rather than falling back to `thrasos`
    - confirm reduced plug spacing is visible and does not damage block readability or snapping
- Screenshot feedback follow-up:
    - missed issue: initial arrow-hiding selector targeted the wrong Blockly class; Blockly v13 renders dropdown arrows with `blocklyDropDownArrow`
    - corrected the shared CSS layer to hide `blocklyDropDownArrow` without altering Blockly v13 source
    - tightened renderer constants in the shared compact theme layer for dropdown arrow size/padding, field padding, external value input padding, shape-in-shape padding and statement spacing
    - kept the loop backbone unchanged for now, per user feedback
    - replaced repeated full variable plug blocks in the starter workspace with compact editable fields where that preserves the intended learner interaction:
        - compact `length(variable)` block
        - compact editable `index + 1` / `index – 1` offset block
        - compact indexed comparison now uses editable variable fields for the list and left index, plus an editable comparison operator
        - compact swap block now uses editable fields for the list and first index
    - toolbox now exposes the compact `length(variable)` and index-offset blocks by default
    - this remains a theme/customization layer over Blockly v13; Blockly source is not modified
- Validation after screenshot follow-up:
    - `node --check public/js/blockly-theme/summer-fair-theme.js`
    - `node --check public/js/blockly-theme/block-customizations.js`
    - `node --check public/js/blockly-spike.js`
- Compact theme package refactor:
    - moved compact Blockly work into `public/blockly-compact-theme/`
    - package files at that point:
        - `tokens.js`
        - `compact-theme.js`
        - `compact-blocks.js`
        - `compact.css`
        - `debug-probe.js`
        - `README.md`
        - `shapes/.gitkeep`
    - updated `public/prototype_tests/blockly-spike.html` to load the package files from the new folder
    - added a debug probe that exposes `window.summerFairBlocklyDebug.inspect(workspace)` and auto-runs only with `?debug=blockly`
    - exposes the spike workspace as `window.summerFairBlocklySpikeWorkspace` for manual browser-console inspection
- Extra comma investigation:
    - cause was local block-definition ordering in `sf_list_swap`
    - Blockly renders fields appended to a value input before that value socket
    - `sf_list_swap` already emitted a comma after the first index field, then also appended a comma to the `INDEX_B` value input, producing `index, , (...)`
    - fixed by removing the comma from the `INDEX_B` value input and keeping the comma only in the preceding dummy input
    - audited similar `appendValueInput(...).appendField(...)` uses; remaining cases are intentional prefix labels/operators or list separators
- Validation after package refactor:
    - `node --check public/blockly-compact-theme/tokens.js`
    - `node --check public/blockly-compact-theme/compact-theme.js`
    - `node --check public/blockly-compact-theme/compact-blocks.js`
    - `node --check public/blockly-compact-theme/debug-probe.js`
    - `node --check public/js/blockly-spike.js`
- Local Blockly docs snapshot added:
    - downloaded official docs from `https://docs.blockly.com/` into `docs/blockly/docs.blockly.com/`
    - added `docs/blockly/README.md` with source, mirror command, useful entry points and known `wget` 404 caveat
    - snapshot is about 436M across 4588 files and includes guides, codelabs, API reference, renderer docs and `FieldDropdown` docs relevant to compact theme work
- Compact field layer added:
    - added `public/blockly-compact-theme/compact-fields.js`
    - compact blocks now use shared field factories instead of instantiating stock Blockly fields directly
    - added no-arrow subclasses for dropdown and variable fields so fields remain clickable/tappable while avoiding persistent arrow chrome
    - added compact number field subclass that keeps stock number text-entry behaviour
    - strengthened compact renderer constants for dropdown arrow and field sizing
    - added Blockly widget/dropdown CSS to keep number text entry visible above the page shell
    - debug probe now reports compact field markers alongside dropdown arrow counts
- Validation after compact field layer:
    - `node --check public/blockly-compact-theme/compact-fields.js`
    - `node --check public/blockly-compact-theme/debug-probe.js`
    - `node --check public/blockly-compact-theme/compact-blocks.js`
    - `node --check public/blockly-compact-theme/compact-theme.js`
- Remaining compact field browser checks:
    - confirm operator and variable fields still open their menus when tapped/clicked
    - confirm dropdown arrows no longer occupy visible space
    - confirm number fields show the editable text input, not just register the changed value internally
    - confirm compact renderer is active rather than falling back to `thrasos`
- Compact field correction after screenshot review:
    - restored full arithmetic operator choices on `sf_index_offset` (`+`, `–`, `×`, `÷`) and updated JS/Python generators accordingly
    - backed off over-aggressive field compression that caused labels to collide with following text
    - removed empty dropdown-arrow SVG constants that may have caused repeated/ticked field backgrounds
    - changed arrow suppression to hide the stock arrow visually while keeping Blockly's field measurement/editor path intact
    - reduced custom number-input CSS so Blockly's text editor remains visible without decorative artefacts
- Compact package naming/splitting cleanup:
    - removed explicit Summer Fair naming from the reusable compact Blockly package API/classes/selectors
    - compact package globals now use `compactBlockly...` names
    - renderer name is now `compact_blockly`
    - host CSS class is now `compact-blockly`
    - split JS/Python generators out of `compact-blocks.js` into `compact-generators.js`
    - `compact-blocks.js` is now focused on block definitions and Blockly block patches
- Compact theme boundary correction:
    - moved Bubble Sort-specific block definitions to `public/js/blockly-activities/bubble-sort/blocks.js`
    - moved Bubble Sort-specific generators to `public/js/blockly-activities/bubble-sort/generators.js`
    - the reusable `public/blockly-compact-theme/` folder now contains presentation/theme work only:
        - `tokens.js`
        - `compact-theme.js`
        - `compact-fields.js`
        - `compact.css`
        - `debug-probe.js`
    - kept existing `sf_*` block type IDs for this slice to avoid a broader serialized workspace/toolbox migration
- Dropdown arrow correction:
    - compact field setup now patches Blockly's documented `FieldDropdown.createSVGArrow_()` and `FieldDropdown.createTextArrow_()` hooks once
    - this covers variable fields too because Blockly documents `FieldVariable` as extending `FieldDropdown`
    - compact renderer constants set dropdown arrow size/padding to zero so arrows should not reserve visible field width
    - CSS arrow hiding remains only as a fallback for stock Blockly fields not created through the compact field factory
- Number editor CSS isolation:
    - the repeated checkmark pattern in the number editor was caused by Pico valid-input background styling leaking onto Blockly's temporary `.blocklyHtmlInput`
    - compact Blockly CSS now targets `input.blocklyHtmlInput` with a stronger isolated reset for background image, repeat and box shadow
- Draggable expression operands refinement:
    - agreed there is no fundamental issue with `index + 1` being a real arithmetic expression block; it is preferable when learners need to drag, compose or replace operands
    - added compact draggable `sf_number` blocks so editable scalar values can still be dragged as blocks
    - updated indexed compare/swap blocks so index operands use value sockets rather than field-only shortcuts
    - replaced starter `sf_index_offset` shortcuts with `sf_math_operator` expressions containing variable and number blocks
    - removed `sf_index_offset` from the toolbox for now; it can stay as an internal/experimental compact shortcut but is no longer the presented expression model
- List-spacing refinement:
    - tightened compact renderer value-input padding again, conservatively, to reduce excess space around pluggable list items without returning to the previous text-collision state
- Composable condition refinement:
    - removed visual outer parentheses from compact arithmetic blocks
    - added `sf_list_get_at` as a reusable list value access expression block with a list variable field and an index expression socket
    - added `sf_inequality` as a reusable boolean comparison block with two expression sockets and a selectable operator
    - updated the starter `if` condition to use Blockly's condition socket with `sf_inequality`, whose operands are two `sf_list_get_at` blocks
    - kept the older indexed comparison block registered for compatibility, but removed it from the toolbox in favour of the composable condition pattern
- Compact renderer shape/padding research:
    - local Blockly renderer docs identify the renderer `ConstantProvider` as the supported central place for renderer-wide magic numbers, connection shapes, element padding and minimum row heights
    - the current compact package is already using the correct first extension point: `public/blockly-compact-theme/compact-theme.js` registers a custom renderer and subclasses `Blockly.thrasos.ConstantProvider`
    - the next compactness pass should keep this as a theme/renderer layer and avoid Blockly v13 source edits
    - first target constants are field padding, inline/external value input padding, shape-in-shape padding, block minimum height and any row minimum-height constants exposed by the active renderer
    - second target is connection geometry: reduce or smooth the output/value puzzle tab via renderer constants or `makePuzzleTab`, with `shapeFor` reserved for type-specific shapes if generic shrinking is not enough
    - only if the constant provider cannot remove the remaining reserved space should the spike subclass `RenderInfo`, row/element measurement or drawer/path-object classes
- Compact renderer shape/padding implementation pass:
    - kept the work in `public/blockly-compact-theme/compact-theme.js`
    - reduced the renderer-wide padding constants conservatively rather than changing individual block definitions
    - added row/min-height constants exposed by Blockly's `ConstantProvider` reference so ordinary expression/value blocks can shrink closer to their fields and child expressions
    - overrode the documented `makePuzzleTab()` hook to replace the stock value/output jigsaw bulge with a short measured segment; this should reduce both the visual clutter and reserved connection width while preserving Blockly's normal connection behaviour
    - moved compact constants into the custom constant-provider constructor so they exist before Blockly initializes cached renderer shape objects
    - cache-busted the spike page's compact theme script include for browser validation
- Blockly dependency local install:
    - added `blockly@13.0.0` through npm so the spike no longer depends on CDN availability
    - copied the browser bundles used by the static prototype into `public/vendor/blockly/`
    - updated `public/prototype_tests/blockly-spike.html` to load local Blockly scripts instead of `https://unpkg.com/`
    - added `.gitignore` for `node_modules/` and `.DS_Store`
    - inspecting the installed package showed the visible inline value padding is more likely controlled by renderer `RenderInfo`/measurable spacing (`InlineInput`, `InputConnection`, `InputRow`) than by the previously changed constant values alone
- Compact renderer `RenderInfo` pass:
    - added a compact `RenderInfo` subclass inside `public/blockly-compact-theme/compact-theme.js`
    - wired it through the custom renderer's `makeRenderInfo_()` hook
    - reduced start/end row spacing and spacing between fields, inline inputs and value inputs before Blockly's drawer computes the final SVG path
    - kept statement-input left padding more conservative so loop/if nesting remains readable
    - did not add a drawer override in this pass; if connected inline values still draw chunky socket chrome, `drawInlineInput_()` remains the next likely hook
- Compact renderer fragment correction:
    - clarified that the earlier ConstantProvider pass only replaced `makePuzzleTab()` and did not yet replace notches or corners
    - added explicit `makeNotch()`, `makeInsideCorners()` and `makeOutsideCorners()` overrides in the compact ConstantProvider
    - reduced `CORNER_RADIUS`, `NOTCH_WIDTH`, `NOTCH_HEIGHT`, `NOTCH_OFFSET_LEFT` and `STATEMENT_INPUT_NOTCH_OFFSET` so the new fragments have visibly smaller geometry
    - corrected repeated renderer registration handling so subsequent calls return `compact_blockly` rather than falling back to `thrasos`
- Compact renderer activation fix:
    - investigated the built-in Zelos renderer and confirmed it changes block appearance by registering a renderer that replaces the constant provider, render info, drawer and path object
    - found the compact renderer was checking for and extending `Blockly.thrasos.ConstantProvider`, but the Blockly 13 browser bundle exports only `Blockly.thrasos.Renderer` and `Blockly.thrasos.RenderInfo`
    - corrected the compact constant provider to extend `Blockly.blockRendering.ConstantProvider`, which is the common base constant provider used by thrasos
    - added debug probe output for the active renderer constants so `?debug=blockly` can confirm whether compact constants are active
- Compact renderer safety correction:
    - after activation, hand-written connection/corner path fragments collapsed block rendering
    - reverted custom path strings and kept Blockly's stock fragment builders, driven by smaller constants
    - relaxed notch/corner constants slightly to avoid invalid geometry while still making the active compact renderer visible

## Working assumptions

- `blocks_UX_spec.md` is the acceptance contract for current editor UX.
- `challenge_spec.md` remains the source for broader lesson requirements.
- `blockly_migration_plan.md` is the staged strategy document.
- Blockly should be evaluated first as an editor substrate, not as a full lesson platform replacement.

## Immediate next slice

1. Define the smallest viable Blockly spike page.
2. Choose the first block set to model.
3. Validate page-embedded mobile hosting and resize behaviour.
4. Compare the spike against the current custom UX contract, especially:
    - drag/drop feel
    - tap-to-place feasibility
    - nearest-match placement behaviour
    - lesson-shell integration

## Stage 1 spike definition

- Prototype page: `public/prototype_tests/blockly-spike.html`
- Supporting files:
    - `public/css/blockly-spike.css`
    - `public/js/blockly-spike.js`
- Initial block set is intentionally small and generic:
    - logic
    - loops
    - math
    - text
- Current purpose of the spike:
    - validate page-embedded Blockly hosting in the existing lesson shell style
    - validate basic mobile layout and resize behaviour
    - validate first-pass theme integration
    - provide generated JS and Python output panes for early comparison
- Current non-goals of the spike:
    - not a full Bubble Sort migration
    - not a proof of nearest-match parity yet
    - not a tap-to-place implementation yet
    - not a runtime / simulator spike yet

## Compactness plan

Goal: make Blockly much more streamlined and space-efficient, especially horizontally, without hard-coding the spike into one inflexible visual mode.

Target: horizontal density should approach the current custom Bubble Sort / assembly puzzle blocks closely enough that Blockly feels practical in the same phone-first lesson shell.

### Agreed compact syntax direction

- Use concise programming-like syntax where it stays readable for learners.
- Prefer compact custom blocks over verbose stock Blockly wording for stable teaching patterns.
- Implement compactness as a global Blockly theme/vocabulary layer wherever possible so other puzzles can reuse the same compact style.
- Puzzle-specific compact blocks are allowed for stable domain patterns, but the spacing, typography, field styling, operator treatment, and connector direction should live in shared Blockly theme/customization files rather than inside one puzzle page.
- Compact Blockly style is the default style, not only a mobile mode. Narrow screens may get additional support later, but the base vocabulary and theme should be compact on all viewport sizes.
- Current target examples:
    - swap operation: `swap_items(list, i, j)` rather than `swap items in {list} at {i} and {j}`
    - list comparison: `if list[i] > list[j]` rather than `if item in {list} at {i} is greater than item at {j}`
    - list literal: `[a, b, c]` rather than `create list with a, b, c` (and remove superfluous spacing around commas)
    - assignment: `set list` rather than `set {list} to`
    - length expression: `length(list)` or `length` in the shortest readable context, rather than `length of`
    - operator fields should show the operator directly and open options on tap/click without a persistent down-arrow taking extra width
- Counted-loop increment should be optional:
    - default increment is `1` or `-1` depending on loop direction
    - the increment input should only appear when needed, rather than always consuming horizontal space
- Blockly's jigsaw connector shape should be visually softened into a smaller segment shape if this is achievable without excessive renderer work.

### Constraint

- compactness changes must preserve configurability
- token-driven size and spacing controls are preferred over one-off CSS overrides
- puzzle-specific compact blocks should remain optional, not the only supported block vocabulary
- narrow-screen compression should be a mode or configuration layer, not an irreversible rewrite
- pinch-to-zoom may be used as a support mechanism for navigation and inspection, but it is not a substitute for achieving substantially tighter default block width

### Plan

1. Reword and replace the widest teaching blocks first.
    - implement compact custom Bubble Sort-shaped blocks for assignment, list literal, list length, indexed comparison, indexed swap and counted loops
    - preserve beginner readability through syntax that resembles pseudocode or Python-style expressions
    - keep compact wording as configurable lesson vocabulary, not hard-coded across all future lessons

2. Reduce shared Blockly chrome through tokens and configuration.
    - shrink font size, internal spacing, field padding, row height feel, and visual bulk through `tokens.js`, `summer-fair-theme.js`, and small customization hooks
    - keep these values centralized so the editor can support both normal and compact presets

3. Shorten remaining wording before changing geometry.
    - the largest horizontal cost is verbose stock labels
    - prefer compact, puzzle-specific wording such as `Repeat`, `if`, `swap`, `numbers at`, and symbolic operators where readability remains strong
    - keep label variants configurable so lessons can choose beginner-friendly or compact copy

4. Replace wide stock block patterns with compact custom blocks only where structure is stable.
    - likely first targets: the two Bubble Sort loop blocks, indexed compare, and indexed swap
    - keep custom block definitions modular so other lessons can opt in without forcing Bubble Sort-specific shapes everywhere
    - success means these compact custom blocks get materially closer to the width profile of the current custom assembly blocks, not just slightly smaller than stock Blockly

5. Keep value-heavy constructs inline by configuration.
    - list literals, index expressions, and compare/swap inputs should remain inline by default
    - expose inline-vs-expanded behavior as a customization choice where practical

6. Add a deliberate selectable compact or overview mode for narrow screens.
    - smaller text
    - tighter gaps
    - further reduced secondary wording
    - possibly different toolbox treatment
    - do this as a controlled mode switch rather than many unrelated responsive tweaks

7. Keep pinch zoom available and tuned for compact mode.
    - pinch zoom is likely necessary once the workspace gets denser
    - use it to help with inspection and manipulation on phones
    - do not rely on zoom alone to hide excessive block width
    - compact mode should still be readable and usable at its default scale

8. Treat toolbox footprint as a separate optimization track.
    - reduce category label length
    - reduce flyout padding
    - limit visible starter blocks
    - evaluate modal or launcher approaches later if always-visible flyouts remain too costly

9. Only escalate to renderer-level work after text, tokens, and custom block vocabulary have been tightened.
    - renderer or deeper shape work is the expensive path
    - take it only if the token/configuration/custom-block passes still fail the mobile width target
    - jigsaw connector smoothing belongs in this late stage unless a lightweight theme/renderer setting is available

### Acceptance direction

- Blockly should get close enough to the current custom block puzzle density that the editor no longer feels intrinsically too wide for the lesson shell
- configurability must remain intact:
    - normal and compact presets should both be possible
    - lesson-specific wording and block variants should remain swappable
    - compact Bubble Sort blocks should not force all future Blockly lessons into the same block shapes
- pinch zoom should improve usability once density increases, but the base compact layout should already be viable before zooming

### Implementation guardrail

- prefer configuration layers in this order:
    - compact lesson vocabulary and custom block definitions for stable teaching patterns
    - tokens
    - theme builder
    - block customization hooks
    - renderer-level intervention

### Proposed next implementation slice

1. Add compact custom Bubble Sort blocks in the spike only:
    - assignment
    - list literal
    - length expression
    - indexed comparison
    - indexed swap
    - counted loop with optional increment
2. Update the starter Bubble Sort workspace to use those compact blocks.
3. Keep generated JavaScript and Python panes working, using custom generators where stock output is too verbose for teaching.
4. Measure before/after block widths on a narrow phone viewport.
5. Promote reusable compact styling into the shared Blockly theme/customization layer, not page-local CSS.
6. Only after that, tune theme spacing and investigate connector shape smoothing.

### Python readability note

- stock Blockly Python for `controls_for` is semantically defensive and therefore poor for teaching readability
- when compact Bubble Sort loop blocks are introduced, give them custom Python generators that emit the intended teaching form directly instead of inheriting Blockly's generic `upRange` / `downRange` pattern

### Compact renderer visibility fix

- The compact renderer is now correctly based on `Blockly.blockRendering.ConstantProvider` plus `Blockly.thrasos.RenderInfo` / `Renderer`; the browser bundle does not expose `Blockly.thrasos.ConstantProvider`.
- The block-disappearing failure happened after the custom renderer became active, so the registration fix worked but exposed an unsafe renderer override.
- The unsafe part was the compact `RenderInfo.getSpacerRowHeight_()` override. It collapsed vertical spacer rows too aggressively; Thrasos relies on its own row-spacing/finalization rules to keep the outline path drawable.
- The current fix-forward keeps the compact renderer active, keeps reduced constants and horizontal spacing, but leaves Thrasos' vertical spacer row behavior intact.
- If further compactness is needed, prefer safer ConstantProvider dimensions first. Reintroduce RenderInfo vertical spacing only with visual regression checks because zero-height rows can make blocks vanish.

### Playwright renderer smoke test

- Added local Playwright setup:
    - `@playwright/test` dev dependency
    - `playwright.config.js`
    - `tests/blockly-spike.spec.js`
    - npm scripts: `playwright:install`, `test:e2e`, `test:e2e:headed`
- The test serves `public/` on port `4173`, opens `/prototype_tests/blockly-spike.html?debug=blockly`, and checks the active renderer plus block dimensions.
- Current result: the test fails, matching the visible page. It confirms:
    - `compact_blockly` is active
    - dropdown arrows are removed
    - many starter blocks report collapsed SVG sizes (`0x0`, `16x16`, or `17x23`)
- This means the remaining visibility issue is not stale CDN/cache use. It is a runtime renderer/field measurement problem in the compact layer.

### Compact renderer collapse fix

- Fixed the dropdown no-arrow hook to preserve Blockly 13's expected `arrow` / `svgArrow` properties while making the arrow zero-width/invisible.
- Removed the custom compact `RenderInfo` subclass from `compact-theme.js`.
- The disappearing-block failure was caused by overriding Thrasos' in-row spacing calculation too aggressively. Thrasos' measurement/finalization pass depends on those spacer values to derive valid block body dimensions.
- The compact renderer now keeps the supported ConstantProvider override but uses Thrasos' stock RenderInfo.
- `npm run test:e2e` now passes for the Blockly spike renderer smoke test.

### Compact geometry correction

- The compact renderer should not stop at "visible blocks"; the target remains significant horizontal compression through reusable theme/renderer hooks.
- Removed the hand-written ConstantProvider path fragments because they introduced a visible slanted left-edge artifact.
- Kept stock Blockly path builders and tightened only supported constants for field height, row minimums, tab/notch dimensions and statement/input padding.
- Set value/input padding constants to zero:
    - `EMPTY_INLINE_INPUT_PADDING = 0`
    - `EXTERNAL_VALUE_INPUT_PADDING = 0`
- Added a conditional reporter connection shape through `ConstantProvider.shapeFor(connection)`.
    - ConstantProvider construction is renderer-wide and does not receive a block.
    - `shapeFor(connection)` does receive the connection, so it can inspect `connection.getSourceBlock().type`.
    - This is suitable for block-type-specific connector shapes; block-type-specific padding belongs in RenderInfo, which is higher risk.
- Moved the compact reporter block list and reporter tab dimensions into `tokens.js` so the reusable renderer no longer hard-codes Bubble Sort block types.
- Replaced temporary mutation of `TAB_WIDTH` / `TAB_HEIGHT` while building the compact tab with an explicit stock-style tab path builder.
- Current measured widest starter block is about `497px` unscaled in the Playwright probe.
- Current measured `sf_number` block size is about `24x41`.
- Strengthened `tests/blockly-spike.spec.js` so it now asserts:
    - compact renderer is active
    - rounded block and field corner constants are active
    - compact tab/notch constants are active
    - compact reporter tab constants are active
    - blocks are not collapsed
    - widest starter block stays at or below `505px`
    - `sf_number` blocks stay at or below `42px` high
- Next width-reduction work should focus on better expression/value block layout and block vocabulary, not broad RenderInfo overrides.

### Compact renderer shape-scope correction

- Corrected the renderer direction after comparing the default/common and Zelos renderer APIs.
- Blockly themes handle colours, fonts and component styles; block outline fragments live in the renderer layer, mainly the `ConstantProvider`.
- Custom shapes do not require switching wholesale to Zelos:
    - the compact renderer can stay based on `Blockly.thrasos.Renderer`
    - its constants can extend `Blockly.blockRendering.ConstantProvider`
    - `shapeFor(connection)` is the supported place to choose connection shapes when the connection/source block context is needed
- The previous Zelos-based experiment was too broad for this spike because it changed layout behaviour and test expectations beyond the requested compact theme work.
- Restored `compact_blockly` to the Thrasos/default-compatible base and updated the debug probe/test to assert common renderer corner fragments rather than Zelos-only `ROUNDED` state.
- `npm run check:blockly-theme`, `git diff --check` and `npm run test:e2e` pass after this correction.
- Remaining shape work should be a deliberate next slice:
    - first confirm what visual corner/connector change is required
    - then implement either smaller stock common shapes through constants/path builders, or add a minimal custom dynamic shape plus matching drawer/render-info support if rounded reporter/value outlines are required
    - avoid Blockly source edits and avoid switching renderer families unless the visual target explicitly needs Zelos-style block geometry

### Simple value wrapper role marker

- Added a reusable compact-theme distinction for blocks whose only job is to wrap one editable scalar or variable as a draggable expression.
- Current marked block types are configured in `tokens.js`:
    - `sf_number`
    - `variables_get`
- The compact theme API now exposes `applyBlockRoleClasses(workspace)`, which applies `compactBlocklySimpleValueWrapper` to matching block SVG roots after workspace load and after non-UI workspace changes.
- Added a temporary red outline in `compact.css` for `.compactBlocklySimpleValueWrapper > .blocklyPath` to prove the distinction is being applied before converting those wrappers to border-only styling.
- Compound expression/value blocks such as arithmetic expressions and list access are deliberately not in this group.
- Converted the wrapper marker from diagnostic red outline to border-only visual styling:
    - wrapper block bodies render transparent/invisible
    - the contained editable field keeps its normal Blockly appearance
    - visually, the wrapper collapses to the existing tight value/variable field outline
    - Blockly light/dark path extras are hidden for this role
- Follow-up diagnosis:
    - hiding the simple child block path alone does not remove the visible surround, because Blockly also draws an inline-input socket into the parent block path
    - the compact drawer now skips `drawInlineInput_()` socket drawing when the connected child block is a simple wrapper type, while still positioning the connection
- Cleanup/refinement:
    - simple wrapper input/output connections now use a zero-width renderer shape, so hidden jigsaw geometry no longer offsets the visible value/variable field from neighbouring operators
    - the abandoned `compactBlocklyStreamlined`/`puzzleTabStreamlined` debug fields were removed from the probe
    - compact CSS now hides Blockly's light highlight path globally in the compact host, because it read as a white corner/background artifact with rounded compact block corners
- This is a visual wrapper change first; if the remaining measured padding is still too large, the next step is renderer/layout shrinking for this same `compactBlocklySimpleValueWrapper` role.

### Proposed renderer shape plan - awaiting agreement

The next implementation should be planned as one small renderer slice, not a
series of visual hacks. The objective is narrow: keep the simplified Thrasos
block model and add the rounded right-side geometry needed for compact reporter
and value shapes.

#### Design target

- Keep `compact_blockly` based on `Blockly.thrasos.Renderer`.
- Keep stock Thrasos `RenderInfo` unless a specific measured blocker proves it
  is necessary to change.
- Keep width/height compression driven by constants and compact block wording.
- Add rounded right-side geometry only where value/output connection shapes
  require it.
- Do not use CSS to reshape measured block geometry.
- Do not edit Blockly source or vendored Blockly bundles.
- Do not switch wholesale to Zelos unless the agreed target changes from
  "Thrasos-like blocks with rounded right sides" to "Scratch/MakeCode-style
  reporter geometry throughout".

#### Renderer facts to preserve

- Thrasos is simple because it uses the common renderer drawer and common
  `ConstantProvider` shape cache.
- Common/Thrasos already has rounded outside/inside block corners through
  `CORNER_RADIUS`, `makeOutsideCorners()` and `makeInsideCorners()`.
- Common/Thrasos value and output connections normally use the stock puzzle tab.
- Zelos gets the rounded reporter/right-side behaviour by adding dynamic
  connection shapes and by replacing more of the rendering pipeline:
  `ConstantProvider`, `RenderInfo`, `Drawer` and `PathObject`.
- The useful part to copy from Zelos is the small dynamic shape idea:
  `width(height)`, `height(height)`, `connectionOffsetX/Y`, `pathDown`,
  `pathUp`, `pathRightDown` and `pathRightUp`.
- The risky parts are Zelos' wider layout model, `SHAPE_IN_SHAPE_PADDING`,
  right-side measurable insertion, full-block field defaults and broader
  alignment/finalization behaviour.

#### Planned implementation shape

1. Fix the current safety mismatch before shape work:
    - change compact renderer registration failure fallback from `zelos` to
      `thrasos`
    - correct or replace the stale checkpoint claim that `shapeFor(connection)`
      is already implemented

2. Add a compact dynamic rounded shape in `CompactBlocklyConstants`.
    - build it with Blockly's SVG path helpers if available, otherwise local
      path strings in one clearly named helper
    - cap width through a compact constant such as
      `COMPACT_ROUNDED_CONNECTION_MAX_WIDTH`
    - keep height tied to the rendered connection height
    - support both left and right drawing directions with `pathDown`,
      `pathUp`, `pathRightDown` and `pathRightUp`

3. Cache the compact rounded shape during constants initialization.
    - override `init()`
    - call `super.init()`
    - assign the custom shape after stock common shapes are initialized

4. Override `shapeFor(connection)` narrowly.
    - return the compact rounded shape for selected output/value connections
    - return stock `NOTCH` for previous/next statement connections
    - return stock `PUZZLE_TAB` for any block/connection not deliberately in
      scope
    - make the selection token-driven, for example a compact reporter block type
      allowlist in `tokens.js`, so the reusable theme does not hard-code Bubble
      Sort IDs

5. Add a drawer override only if the first pass proves it is required.
    - common drawer already checks `isDynamicShape` for external value inputs
      and output connections
    - common drawer's inline input drawing assumes `PuzzleTab.pathDown`, so
      inline rounded sockets may require a minimal `CompactBlocklyDrawer`
    - if needed, subclass `Blockly.blockRendering.Drawer` and override only
      `drawInlineInput_()` to call dynamic shape paths
    - wire it through `CompactBlocklyRenderer.makeDrawer_()`

6. Avoid `RenderInfo` changes in this slice.
    - previous custom `RenderInfo` work collapsed blocks
    - block width should first be improved through compact vocabulary,
      constants, `shapeFor()` and, if necessary, the narrow inline drawer
      override
    - revisit `RenderInfo` only with a failing visual/measurement test that
      identifies a specific row/spacing cost

#### Test and validation plan

- Extend the Playwright smoke test before implementation so it fails for the
  current non-rounded right-side target.
- Keep existing assertions:
    - active renderer is `compact_blockly`
    - constants provider is the compact provider
    - no starter blocks collapse
    - widest starter block remains under the current guard
- Add targeted assertions:
    - at least one selected reporter/value block has the compact rounded shape
      type or debug marker
    - no selected block grows beyond the current width guard because of the new
      shape
    - inline sockets remain visible and connected child blocks still render
      with non-zero dimensions
- Add debug-probe output for connection shape type/width/height so failures can
  be diagnosed without visual guessing.
- Run:
    - `npm run check:blockly-theme`
    - `git diff --check`
    - `npm run test:e2e`

#### Stop conditions

- Stop and reconsider if a rounded-right implementation requires broad
  `RenderInfo` rewrites.
- Stop and reconsider if the renderer needs multiple path-object or connection
  highlight overrides beyond the minimal inline drawer path.
- Stop and reconsider if the compact rounded shape increases the widest starter
  block materially; the shape work must not trade the required rounded corners
  for lost horizontal compactness.

#### Current recommended next slice

Document and agree this plan first. Then implement only steps 1-4 plus test
instrumentation. Treat step 5 as conditional, after a browser/test result shows
that inline sockets need a drawer override.

### Agreed detailed renderer implementation plan - 2026-06-29

This section supersedes the shorter proposed renderer shape plan above. The
goal is still deliberately narrow: keep the simplified, fast Thrasos-style
renderer and add compact rounded right-side/value geometry without broad layout
rewrites.

#### References used

- Local docs:
    - `docs/blockly/docs.blockly.com/guides/create-custom-blocks/renderers/overview/index.html`
    - `docs/blockly/docs.blockly.com/guides/create-custom-blocks/renderers/concepts/renderer/index.html`
    - `docs/blockly/docs.blockly.com/guides/create-custom-blocks/renderers/concepts/constants/index.html`
    - `docs/blockly/docs.blockly.com/guides/create-custom-blocks/renderers/concepts/drawer/index.html`
    - `docs/blockly/docs.blockly.com/guides/create-custom-blocks/renderers/concepts/info/index.html`
    - `docs/blockly/docs.blockly.com/guides/create-custom-blocks/renderers/create-custom-renderers/basic-implementation/index.html`
    - `docs/blockly/docs.blockly.com/guides/create-custom-blocks/renderers/create-custom-renderers/connection-shapes/index.html`
    - `docs/blockly/docs.blockly.com/codelabs/custom-renderer/define-and-register-a-custom-renderer/index.html`
    - `docs/blockly/docs.blockly.com/codelabs/custom-renderer/override-constants/index.html`
    - `docs/blockly/docs.blockly.com/codelabs/custom-renderer/change-connection-shapes/index.html`
- Blockly source-map backed source:
    - `node_modules/blockly/blockly_compressed.js.map`
    - source entries:
        - `core/renderers/common/constants.ts`
        - `core/renderers/common/drawer.ts`
        - `core/renderers/common/info.ts`
        - `core/renderers/common/renderer.ts`
        - `core/renderers/thrasos/info.ts`
        - `core/renderers/thrasos/renderer.ts`
        - `core/renderers/zelos/constants.ts`
        - `core/renderers/zelos/drawer.ts`
        - `core/renderers/zelos/info.ts`
        - `core/renderers/zelos/renderer.ts`

#### Key source conclusions

- Blockly docs define the renderer as a factory that wires together the
  constant provider, render info, path object and drawer. This supports
  changing one component through a renderer subclass instead of replacing the
  whole renderer family.
- Blockly docs identify the `ConstantProvider` as the owner of renderer-wide
  sizes, paths and connection shapes. Constants are expected to be initialized
  as constants, not mutated at runtime.
- Blockly docs describe custom connection shapes as:
    - define shape objects
    - store them in `init()`
    - return them from `shapeFor(connection)`
- Blockly docs define the drawer as the component that joins measured path
  pieces and updates connection offsets. This is the correct place to fix a
  drawing-only mismatch after measurement is already correct.
- Blockly docs define render info as the layout/measurement phase. It chooses
  row layout and element positions before drawing. Because previous compact
  `RenderInfo` overrides collapsed blocks, it is out of scope unless a specific
  measurement defect remains after shape/drawer work.
- Common/Thrasos:
    - `core/renderers/thrasos/renderer.ts` only subclasses the common renderer
      enough to provide Thrasos `RenderInfo`
    - `core/renderers/common/constants.ts` owns stock `makePuzzleTab()`,
      `makeInsideCorners()`, `makeOutsideCorners()` and `shapeFor()`
    - `core/renderers/common/drawer.ts` already supports dynamic shapes for
      external value inputs and output connections
    - common `drawInlineInput_()` assumes puzzle-tab style inline shapes, so
      this is the one likely drawing override if inline rounded sockets are
      required
- Zelos:
    - `core/renderers/zelos/constants.ts` defines dynamic rounded/squared/
      hexagonal connection shapes and chooses them through `shapeFor()`
    - `core/renderers/zelos/drawer.ts` draws dynamic right-side output shapes
      and dynamic inline input outlines
    - `core/renderers/zelos/info.ts` inserts and aligns right-side connection
      shape measurables and shape-in-shape padding
    - the useful piece is the dynamic connection shape pattern; the risky piece
      is the broader Zelos measurement/alignment model

#### Implementation principle

Make the smallest renderer extension that is structurally aligned with Blockly:

1. Keep the current custom renderer package.
2. Base the active renderer on a subclass of `Blockly.thrasos.Renderer`.
3. Override that renderer's `makeConstants_()` so it uses a compact
   `ConstantProvider` subclass.
4. Because Blockly 13's browser bundle exposes `Blockly.thrasos.Renderer` but
   not `Blockly.thrasos.ConstantProvider`, subclass
   `Blockly.blockRendering.ConstantProvider` for the compact constants. This is
   the common/base constant provider Thrasos uses for standard shape data.
5. Add compact rounded connection shape data to that compact constant provider.
6. Use `shapeFor(connection)` in the compact constant provider for shape
   selection.
7. Add one drawer override only if inline sockets need dynamic shape drawing.
8. Do not change `RenderInfo` in this slice.
9. Do not use CSS to reclaim or alter measured block geometry.
10. Do not patch Blockly source or vendored bundles.

#### Phase 0 - cleanup and documentation correction

- Correct `compact-theme.js` registration failure fallback:
    - current fallback should be `thrasos`, not `zelos`
    - a renderer registration problem should leave the page in the known simple
      renderer, not silently switch to the more complex renderer family
- Add a checkpoint correction that the earlier `shapeFor(connection)` reporter
  implementation note was inaccurate for the current file state.
- Keep the current passing smoke test as the baseline before shape changes.
- Do not add visual changes in this phase.

Validation:

- `npm run check:blockly-theme`
- `git diff --check`
- existing `npm run test:e2e`

#### Phase 1 - add explicit shape instrumentation

Purpose: stop guessing from screenshots and make shape selection inspectable.

- Extend `public/blockly-compact-theme/debug-probe.js` so each block summary can
  report:
    - output connection shape type, width and height where present
    - each value input connection shape type, width and height where present
    - whether a shape is dynamic
    - whether the block is in the compact rounded allowlist
- Keep this as debug-only reporting; it must not affect Blockly rendering.
- Update `tests/blockly-spike.spec.js` to assert the current baseline first:
    - compact renderer active
    - no collapsed blocks
    - current width guard still passes
    - selected candidate blocks currently do not yet report the future compact
      rounded marker

Validation:

- `npm run check:blockly-theme`
- `npm run test:e2e`

#### Phase 2 - tokenize the shape scope

Purpose: keep the compact theme reusable and avoid Bubble Sort IDs baked into
renderer code.

- Add compact rounded-shape configuration to `public/blockly-compact-theme/tokens.js`.
- Proposed token structure:
    - `roundedConnectionBlocks`: array of block type IDs whose output/value
      connections should use the compact rounded shape
    - `roundedConnectionMaxWidth`: compact cap for the rounded side bulge
    - `roundedConnectionMinRadius`: lower visual bound to avoid angular shapes
    - `roundedConnectionType`: stable debug type string or numeric offset if
      useful in tests
- Initially include only value/reporter blocks that are visible in the current
  Blockly spike and safe to test.
- Keep normal statement blocks, loop blocks and stack notches on stock compact
  common geometry.

Validation:

- `node --check public/blockly-compact-theme/tokens.js`
- `npm run check:blockly-theme`

#### Phase 3 - implement compact rounded dynamic shape

Purpose: add shape data without changing layout measurement rules.

- In `public/blockly-compact-theme/compact-theme.js`, extend
  `CompactBlocklyConstants`.
- Add a method such as `makeCompactRoundedConnectionShape()`.
- Shape contract should mirror Blockly dynamic shapes:
    - `type`
    - `isDynamic: true`
    - `width(height)`
    - `height(height)`
    - `connectionOffsetY(connectionHeight)`
    - `connectionOffsetX(connectionWidth)`
    - `pathDown(height)`
    - `pathUp(height)`
    - `pathRightDown(height)`
    - `pathRightUp(height)`
- Use the Zelos rounded-shape idea but compact dimensions:
    - width is no more than `roundedConnectionMaxWidth`
    - height follows the rendered connection height
    - two arc segments and an optional vertical middle line are enough
    - no shape-in-shape padding table in this phase
- Override `init()`:
    - call `super.init()`
    - assign `this.COMPACT_ROUNDED_CONNECTION = this.makeCompactRoundedConnectionShape()`
- Do not mutate stock `TAB_WIDTH`/`TAB_HEIGHT` during shape construction.
- Keep the existing compact stock tab constants for connections not in scope.

Validation:

- `npm run check:blockly-theme`
- debug probe can see the compact shape object through selected connections
- `npm run test:e2e`

#### Phase 4 - narrow `shapeFor(connection)` override

Purpose: choose the new shape through Blockly's documented seam.

- Override `shapeFor(connection)` in `CompactBlocklyConstants`.
- Decision order:
    - previous/next statement connections: return `this.NOTCH`
    - input/output value connections whose source block type is in the token
      allowlist: return `this.COMPACT_ROUNDED_CONNECTION`
    - all other input/output value connections: return `this.PUZZLE_TAB`
    - unknown connection types: preserve Blockly's error behaviour or delegate
      to `super.shapeFor(connection)`
- For input connections, inspect the connection source block and, if needed,
  the target/connected block. The first implementation should be conservative:
  only return the rounded shape where source-block context is unambiguous.
- Add debug markers so tests can verify that the expected blocks are using the
  compact rounded shape.

Validation:

- `npm run check:blockly-theme`
- `npm run test:e2e`
- manual `?debug=blockly` inspection if visual result is surprising

Expected outcome:

- External value inputs and output connections should draw correctly because
  common drawer already checks dynamic shapes in those paths.
- Inline value inputs may still need Phase 5 because common `drawInlineInput_()`
  assumes puzzle-tab paths.

#### Phase 5 - conditional minimal drawer override

Only do this if Phase 4 produces correct shape selection but incorrect inline
socket drawing.

- Add `CompactBlocklyDrawer extends Blockly.blockRendering.Drawer`.
- Override only `drawInlineInput_(input)`.
- Preserve common drawer behaviour:
    - calculate width, height, y position and connection offsets the same way
    - call `positionInlineInputConnection_(input)`
    - keep normal puzzle-tab drawing when `input.shape` is not dynamic
- For dynamic shapes:
    - draw the inline socket outline using the shape's `pathDown(height)` or
      `pathRightDown(height)` as appropriate for the input outline direction
    - keep the socket width compact
    - avoid changing field or connection measurement
- Wire through `CompactBlocklyRenderer.makeDrawer_(block, info)`.
- Do not override `PathObject`.
- Do not override connection highlighting unless a real highlighted-connection
  bug appears after the drawer change.

Validation:

- `npm run check:blockly-theme`
- `npm run test:e2e`
- add a Playwright assertion that connected inline child blocks still have
  non-zero dimensions and do not increase the current width guard

#### Phase 6 - visual acceptance pass

- Review the spike in a browser at phone-sized width.
- Confirm:
    - right side of target value/reporter blocks is rounded
    - block widths have not materially increased
    - inline sockets remain legible
    - statement blocks/loops still read as simplified Thrasos-like blocks
    - dropdown and number field fixes still work
- If a visual issue is found, classify it before changing code:
    - shape path issue: fix constants/shape helper
    - drawing issue: fix drawer
    - measured spacing issue: consider whether it is acceptable; only then
      discuss a tiny `RenderInfo` intervention

#### User clarification - 2026-06-29

- The desired value/input connector visual is either no puzzle tab or a very
  streamlined line. The old jigsaw-style tab should not remain visually
  prominent.
- The rounded right-side work is primarily aesthetic, not expected to be a major
  horizontal space saving. Existing compactness work already reduced width; any
  further width reduction is separate from the rounded-corner goal.
- Most non-C blocks should move toward a simple outline around value/variable
  inputs rather than visually heavy puzzle-piece geometry.
- Shape simplification should not normally affect Blockly behaviour if the
  connection models, zones, offsets and event handlers remain intact. Watch for
  drawing/measurement regressions, but do not assume simplified shapes imply
  broken drag/drop semantics.
- Do not make slow Playwright runs the main feedback loop for visual tuning.
  Use lightweight syntax/debug checks and quick user/browser visual review.
  Keep Playwright for occasional smoke checks only when it protects against a
  known collapse/regression.
- Initial rounded corner target should be `6px`; tune visually from there.
- For token scope, make the best conservative selection and adjust after visual
  review.

#### Streamlined connector first implementation - 2026-06-29

- Implemented the simpler first pass implied by the clarification above:
    - keep `compact_blockly` as a `Blockly.thrasos.Renderer` subclass
    - keep `CompactBlocklyConstants` as a
      `Blockly.blockRendering.ConstantProvider` subclass
    - override `makePuzzleTab()` directly to replace the stock jigsaw tab with
      a near-flat vertical connector line
    - keep the rounded block corner target at `6px`
    - make the connector geometry token-driven in `tokens.js`
- This deliberately avoids the earlier dynamic-shape/drawer route for the first
  pass because Blockly's documented `PuzzleTab` is exactly the standard shape
  for input/output connections, and the clarified target is "no puzzle tab or a
  very streamlined line".
- Corrected compact renderer registration failure fallback from `zelos` to
  `thrasos`.
- Added debug-probe reporting for:
    - `TAB_WIDTH`
    - `TAB_HEIGHT`
    - `TAB_OFFSET_FROM_TOP`
    - whether the active `PUZZLE_TAB` is the compact streamlined one
- Current token values:
    - `cornerRadius: 6`
    - `puzzleTabWidth: 1`
    - `puzzleTabHeight: 12`
    - `puzzleTabOffsetFromTop: 4`
- No `RenderInfo`, `PathObject`, Blockly source, vendored bundle, puzzle logic
  or generator changes were made in this slice.
- No drawer override was added in this slice. If the manual browser check shows
  inline value sockets still need rounded-right socket outlines, add the
  previously planned one-method `drawInlineInput_()` override as the next
  targeted slice.
- Lightweight validation completed:
    - `npm run check:blockly-theme`
    - `node --check public/blockly-compact-theme/debug-probe.js`
    - `node --check public/blockly-compact-theme/tokens.js`
    - `git diff --check public/blockly-compact-theme/compact-theme.js public/blockly-compact-theme/tokens.js public/blockly-compact-theme/debug-probe.js blockly_checkpoint.md`

#### Streamlined connector failure analysis - 2026-06-29

- Browser screenshot feedback showed the first streamlined connector pass failed:
    - blocks were squeezed horizontally
    - inline value inputs became visually cramped/overlapped
    - the desired rounded-right-side aesthetic was not achieved
- The failure was not caused by stale assets or earlier work blocking the new
  renderer code. The visual squeeze proves the new constants did load.
- Root cause:
    - `PuzzleTab.width` is not only a visual tab width
    - Blockly uses the selected connection shape's width during measurement,
      especially for inline inputs
    - setting `TAB_WIDTH`/`PuzzleTab.width` to `1` reduced the measured
      connection/input reserve rather than only hiding the visible jigsaw shape
    - as a result Blockly compressed child sockets and surrounding fields
- Secondary cause:
    - replacing the stock `PuzzleTab` path does not address the main
      right-side shape of ordinary output/reporter blocks
    - common/Thrasos draws output connections on the left edge and the block's
      right edge remains mostly controlled by normal row/corner drawing
    - therefore this path can remove or reduce the jigsaw tab, but it cannot by
      itself create the Zelos-like rounded right side on reporters
- Reverted the failed measurement change:
    - removed the custom near-flat `makePuzzleTab()` override
    - removed the `puzzleTabWidth`, `puzzleTabHeight` and
      `puzzleTabOffsetFromTop` tokens
    - restored compact tab constants to the previous `TAB_WIDTH = 4`,
      `TAB_HEIGHT = 6`, `TAB_OFFSET_FROM_TOP = 5` values
- Keep the successful parts:
    - fallback now remains `thrasos`, not `zelos`
    - debug probe can report shape information through the active constants
    - cache-busting was updated for changed prototype assets

#### Revised renderer shape approach after failed squeeze - 2026-06-29

- Do not reduce connection-shape measured width to remove visual chrome.
  Measurement and visual appearance must be separated.
- Next approach should preserve enough measured connection width for layout
  stability, while drawing a visually simple outline/right edge.
- Second source review finding:
    - common/Thrasos top and bottom rows currently report
      `hasRightSquareCorner() { return true; }`
    - therefore the drawer is being given square right-corner elements
    - changing `CORNER_RADIUS` alone cannot visibly round the right side,
      because the rounded outside-corner path is never selected there
    - Zelos achieves its right-side treatment by using its own render-info row
      classes, where top/bottom rows only keep square right corners for specific
      output/statement/next-connection cases
    - a drawer-only override is therefore insufficient unless it manually
      rewrites path geometry; the cleaner route is to supply the right corner
      element through render info, then let the existing drawer draw the arc
- The likely correct path is now:
    1. keep compact stock `PuzzleTab` dimensions for measurement, or only adjust
       them conservatively
    2. keep subclassing the Thrasos renderer for spacing/speed
    3. add compact TopRow/BottomRow render-info subclasses based on the small
       Zelos row logic for when a right corner should be square
    4. return those rows from a compact RenderInfo subclass via
       `makeRenderInfo_()`
    5. let the common/Thrasos drawer draw `OUTSIDE_CORNERS.topRight` and
       `OUTSIDE_CORNERS.bottomRight` from the existing `CORNER_RADIUS = 6`
    6. add a drawer-level visual override only if row corner selection does not
       cover a specific reporter/value block shape
    7. draw the right edge with a 6px rounded corner/side treatment without
       collapsing input measurement
    8. if connector chrome still looks too jigsaw-like, hide or simplify the
       visible tab path while keeping its measured width
- This means the earlier render-info/drawer plan is more appropriate than the
  pure `PuzzleTab.width = 1` approach, but it should be scoped carefully:
    - do not use dynamic shape width to save space
    - use render-info row selection first for corner choice
    - use dynamic/custom drawing only for visual outline cases row selection
      cannot express
    - keep the `RenderInfo` change narrow: row class selection only, with no
      broad measurement rewrite
- Before another implementation attempt, inspect/draw from Blockly source:
    - common `drawTop_()`
    - common `drawBottom_()`
    - common `drawLeft_()`
    - common `drawInlineInput_()`
    - Zelos `drawOutline_()`, `drawRightDynamicConnection_()` and
      `drawInlineInput_()`
- The next implementation should start with one representative reporter block,
  likely `sf_number` or `sf_length_var`, and make its right side visually
  rounded without changing global tab measurement.

#### Compact right-corner row implementation - 2026-06-29

- Implemented the narrow render-info row fix in
  `public/blockly-compact-theme/compact-theme.js`.
- Added:
    - `CompactBlocklyTopRow`
    - `CompactBlocklyBottomRow`
    - `CompactBlocklyRenderInfo`
- `CompactBlocklyRenderer` still subclasses `Blockly.thrasos.Renderer`.
- `CompactBlocklyRenderInfo` subclasses `Blockly.thrasos.RenderInfo` and only
  swaps the top/bottom row instances after the base constructor has run.
- The compact row classes return `false` from `hasRightSquareCorner()`, so the
  existing common/Thrasos drawer receives right-rounded corner elements and can
  draw `OUTSIDE_CORNERS.topRight` / `bottomRight`.
- This leaves `TAB_WIDTH`, `TAB_HEIGHT`, `PuzzleTab` paths, connection
  measurement, Blockly source, vendored bundles and puzzle logic unchanged.
- Bumped the prototype cache query for `compact-theme.js` to `20260629b`.
- If manual visual checking still shows square right edges on output/reporter
  blocks, the likely remaining cause is output/reporter-specific path handling,
  not the top/bottom row corner selection for ordinary blocks.

#### Right-corner gap follow-up - 2026-06-29

- Screenshot feedback showed tiny square/white gaps around some newly rounded
  right corners.
- Investigation:
    - this was not stale cache; rounded corners were active
    - the compact renderer uses Blockly's base path object, not Geras'
      separate light/dark path layers
    - the likely cause is the hybrid renderer path construction: rounded
      top/bottom rows now introduce right-side corner width, while the common
      drawer's generic `drawRightSideRow_()` only draws vertically from the
      current point
    - when adjacent rows have slightly different measured right edges, the path
      can leave small square background gaps around the rounded joins
- Chosen fix:
    - keep the row/render-info solution
    - add a tiny `CompactBlocklyDrawer` override for `drawRightSideRow_()`
    - draw horizontally to `row.xPos + row.width` before drawing vertically to
      `row.yPos + row.height`
    - avoid CSS masking, because CSS would hide symptoms without fixing the SVG
      path geometry and would be harder to reason about across block colours
- Also increased the compact corner radius token from `6` to `10`.
- Bumped prototype cache queries:
    - `tokens.js?v=20260629b`
    - `compact-theme.js?v=20260629c`

#### Explicit non-goals for this slice

- No Blockly source edits.
- No vendored bundle edits.
- No wholesale Zelos renderer switch.
- No broad `RenderInfo` subclass.
- No path-object replacement.
- No complete visual redesign of all Blockly blocks.
- No mobile layout/toolbox changes.
- No puzzle logic changes.
- No generator changes unless a block ID/token rename accidentally requires
  one, which should be avoided.

#### Stop conditions

- Stop if rounded right-side geometry requires broad row measurement rewrites.
- Stop if the solution needs more than:
    - constants subclass
    - `shapeFor(connection)`
    - optional one-method drawer override
- Stop if the widest starter block grows materially beyond the current guard.
- Stop if dynamic shape selection cannot be made token-driven without
  hard-coding puzzle-specific IDs into the reusable renderer.
- Stop if tests pass but the browser visual clearly contradicts the intended
  simplified Thrasos-with-rounded-right-side target.

#### Final definition of done for this slice

- Plan agreed and checkpointed.
- Implementation remains inside `public/blockly-compact-theme/` except for test
  and optional token updates.
- Debug probe exposes enough connection-shape data to diagnose failures.
- `npm run check:blockly-theme` passes.
- `git diff --check` passes.
- `npm run test:e2e` passes.
- Manual browser check confirms the target shape and no obvious width regression.

### Stop point: failed visual fixes and next approach - 2026-06-30

User feedback after the latest manual browser checks:

- The vertical alignment of simple wrapper variables/values and nearby operator
  fields is still visibly wrong.
- The white corner/background artifacts are still visible.
- Therefore the latest renderer/CSS changes did not solve the two visual issues.

#### Failed or incomplete attempts to treat as suspect

- CSS-only hiding of simple wrapper block paths:
    - attempted via `.compactBlocklySimpleValueWrapper .blocklyPath`
    - this hides child block chrome, but does not solve layout because Blockly
      still measures and positions the child block as a normal output block
    - the contained field remains offset by the child block's own internal
      measurement and connection placement
- Skipping parent inline socket drawing in `CompactBlocklyDrawer.drawInlineInput_()`:
    - removes one visible surround layer for simple wrapper children
    - does not solve vertical alignment because it does not alter the child
      block's own field position or rendered height
- Zero-width value shape for simple wrapper connections:
    - attempted through `CompactBlocklyConstants.shapeFor(connection)`
    - this did not visually fix alignment
    - likely insufficient because the connected child block still reports its
      normal block dimensions and internal field placement
- Hiding `.blocklyPathLight` globally in the compact host:
    - attempted to remove the white corner artifact
    - manual feedback says the white corners remain
    - do not assume this is the cause or keep expanding CSS masking around it
- Rounded-right row experiment:
    - `CompactBlocklyTopRow`, `CompactBlocklyBottomRow`, and
      `CompactBlocklyDrawer.drawRightSideRow_()` were added to force rounded
      right edges
    - this may be contributing to the white corner artifact because it changes
      row corner choice without a complete matching outline algorithm
    - next session should consider backing this out or replacing it with a
      properly drawn path, rather than layering more CSS over it

#### Likely deeper cause

- The simple wrapper appearance target is not just "hide the wrapper SVG".
- The target is for the block's measured/rendered footprint to match the
  editable field it contains.
- Blockly still treats `sf_number` and `variables_get` as normal output blocks:
    - they have normal block height/width
    - their field is laid out inside that normal block coordinate system
    - their connection position is based on that block geometry
- Hiding the outer path leaves the geometry behind, which explains why the
  variable/value fields and operators remain vertically misaligned.

#### Next-session approach

1. Stop treating simple wrappers as normal output blocks with hidden chrome.
2. Create a small renderer/layout path specifically for simple wrapper blocks:
    - detect `sf_number` and `variables_get` by token-configured block type
    - for those blocks, make the rendered block dimensions and output
      connection offsets derive from the editable field bbox/field measurable
      rather than from the normal output block outline
    - keep the field's existing Blockly appearance unchanged
    - keep the block draggable and connectable
3. Investigate whether this is best done by:
    - a narrow `RenderInfo.finalize_()` adjustment for simple wrapper root
      blocks only, or
    - replacing `variables_get` with a compact custom variable reporter block
      using the same compact field factory as `sf_number`, so both simple
      wrappers are under local control, or
    - a custom simple-wrapper `Drawer` branch that records block size and
      connection offset from field positions after layout
4. For the white corner artifact:
    - first isolate by temporarily disabling the rounded-right row override
      (`CompactBlocklyTopRow`, `CompactBlocklyBottomRow`,
      `CompactBlocklyRenderInfo`, `drawRightSideRow_()`)
    - if white corners disappear, rebuild rounded corners as one coherent drawer
      path change rather than row-class substitution
    - if they remain, inspect actual SVG elements in browser devtools to identify
      whether the visible white area is path fill, path highlight, parent
      background, or a gap in the outline path
5. Keep verification manual/user-led for this slice:
    - no Playwright unless explicitly requested
    - use `npm run check:blockly-theme`
    - use `git diff --check`
    - rely on manual browser screenshots/feedback for the visual target

#### Recommended cleanup before next implementation

- Reassess whether to keep or revert these recent suspect changes before
  proceeding:
    - global `.compact-blockly .blocklyPathLight { display: none; }`
    - zero-width `SIMPLE_VALUE_WRAPPER_SHAPE`
    - `CompactBlocklyDrawer.drawInlineInput_()` simple-wrapper branch
    - right-rounded row classes and `drawRightSideRow_()` override
- Do not stack further CSS rules until the SVG/layout source of the artifacts is
  identified.
- Keep `simpleValueWrapperBlockTypes` in `tokens.js`; that distinction is still
  useful and should remain the configured source of truth.

### Resume plan: white corners and low simple-wrapper alignment - 2026-06-30

Current diagnosis after reviewing the checkpoint and current files:

- The repo already contains several suspect visual fixes layered together:
    - global `.blocklyPathLight` hiding
    - transparent simple-wrapper paths
    - zero-width simple-wrapper connection shapes
    - skipped inline socket drawing for simple-wrapper children
    - rounded top/bottom row overrides plus a right-side drawer override
- The white corner artifact should be treated as a renderer/path construction
  issue until proven otherwise. More CSS masking is not an acceptable next step.
- The low alignment of `sf_number` and `variables_get` is a layout/measurement
  issue. Hiding their SVG paths cannot fix it because Blockly still positions
  their fields and output connections as normal output blocks.

Best next approach:

1. Create a clean isolation slice before adding new behaviour:
    - keep `cornerRadius: 10`
    - keep `simpleValueWrapperBlockTypes` in tokens
    - temporarily remove or gate the suspect visual fixes listed above
    - confirm which artifact belongs to rounded-row drawing and which belongs
      to simple-wrapper layout
2. White corners:
    - first isolate by removing the row-corner substitution path
      (`CompactBlocklyTopRow`, `CompactBlocklyBottomRow`,
      `CompactBlocklyRenderInfo`, and `drawRightSideRow_()`)
    - if the white corners disappear, do not restore that partial hybrid
      implementation
    - rebuild rounded right corners as one coherent renderer path change, not
      as a row-class substitution plus patched right-side rows
    - the likely durable implementation is a compact drawer branch for ordinary
      non-C/value blocks that draws the top, right side, and bottom as one
      consistent rounded outline using `CORNER_RADIUS`
3. Simple wrapper alignment:
    - stop relying on hidden normal output blocks for the final design
    - keep detecting wrapper block types from tokens
    - implement a narrow simple-wrapper layout path where the wrapper block's
      rendered footprint and output connection offset are derived from its
      editable field, not from normal output-block row geometry
    - investigate this in this order:
        1. a simple-wrapper `RenderInfo.finalize_()` adjustment that sets the
           wrapper height, width and output connection offset from the field
           measurable
        2. a matching drawer branch that lays out the field and records size
           without drawing the hidden normal outline
        3. only if that remains unstable, replace `variables_get` usage in this
           activity with a local compact variable reporter block so both simple
           wrappers are under local control
4. Keep verification lightweight:
    - `npm run check:blockly-theme`
    - `git diff --check`
    - manual browser review/screenshots for visual acceptance
    - no Playwright unless explicitly requested

Stop condition:

- If the renderer branch starts requiring broad row measurement rewrites across
  all Blockly block types, stop and reconsider whether the compact educational
  vocabulary should use simpler local block definitions instead of trying to
  visually transform stock output blocks.

### Isolation implementation: remove suspect visual interventions - 2026-06-30

Implemented the first isolation slice from the resume plan.

Removed from `public/blockly-compact-theme/compact-theme.js`:

- zero-width `SIMPLE_VALUE_WRAPPER_SHAPE`
- `shapeFor(connection)` special-casing for simple wrappers
- `CompactBlocklyTopRow`
- `CompactBlocklyBottomRow`
- `CompactBlocklyRenderInfo`
- `CompactBlocklyDrawer`
- skipped inline-input drawing for simple-wrapper children
- custom `makeRenderInfo_()` and `makeDrawer_()` wiring

Removed from `public/blockly-compact-theme/compact.css`:

- global `.blocklyPathLight { display: none; }`
- transparent `.compactBlocklySimpleValueWrapper .blocklyPath`
- `.compactBlocklySimpleValueWrapper .blocklyPathDark { display: none; }`

Kept:

- `cornerRadius: 10`
- `simpleValueWrapperBlockTypes` in `tokens.js`
- `compactBlocklySimpleValueWrapper` class marking and debug-probe reporting
- compact constants and Thrasos renderer subclass

Cache-busted:

- `compact.css?v=20260630d`
- `compact-theme.js?v=20260630d`

Expected manual-check outcome:

- if variable/value alignment returns to the previous acceptable state, the
  cause was one of the removed recent wrapper/layout interventions
- if white corners disappear, the cause was the removed rounded-row/drawer
  hybrid
- if rounded right corners are no longer present, that is expected for this
  isolation slice; the next implementation should rebuild them with one
  coherent drawer/path approach

Validation completed:

- `node --check public/blockly-compact-theme/compact-theme.js`
- `npm run check:blockly-theme`
- `git diff --check public/blockly-compact-theme/compact-theme.js public/blockly-compact-theme/compact.css public/prototype_tests/blockly-spike.html blockly_checkpoint.md`

### Alignment fix candidate: rebalance ordinary top/bottom rows - 2026-06-30

Follow-up user screenshot clarified that the visible problem is inside the
child value/variable block itself: the field sits low because the child block
has much more top padding than bottom padding.

Source-level diagnosis:

- The compact constants had:
    - `TOP_ROW_MIN_HEIGHT = 14`
    - `BOTTOM_ROW_MIN_HEIGHT = 4`
- Simple output blocks such as `sf_number` and `variables_get` are built as:
    - top row
    - dummy/field input row
    - bottom row
- That means a one-field value block gets a large top band and a tiny bottom
  band, so the visible field is low inside the block. When that block is placed
  in an inline value input, the whole child reads as low inside the parent.

Implemented:

- changed ordinary row minimums in `compact-theme.js` to:
    - `TOP_ROW_MIN_HEIGHT = 5`
    - `BOTTOM_ROW_MIN_HEIGHT = 5`
- kept `TOP_ROW_PRECEDES_STATEMENT_MIN_HEIGHT = 14`, so statement/C-shaped
  blocks retain a safer top lead-in before statement inputs.
- cache-busted `compact-theme.js` to `20260630e`.

Expected manual-check outcome:

- `sf_number` and variable reporter fields should sit much closer to vertical
  centre inside their own blocks and therefore inside parent value sockets.
- Rounded right corners are still intentionally absent after the isolation
  slice; rebuild them only after the alignment baseline is correct.

Manual feedback:

- Alignment is better.
- The vertical stretch is also fixed.
- Confirmed cause for both issues:
    - ordinary block top/bottom row minimums were asymmetric (`14` top, `4`
      bottom)
    - one-field value/variable blocks therefore had too much top band and too
      little bottom band
    - that made the visible field sit low inside the child block and made the
      child read as low inside parent value sockets
    - the same inflated top row also contributed to the unwanted vertical
      stretch

### Rounded right-corner restore after row rebalance - 2026-06-30

Restored rounded right corners after the alignment baseline was fixed.

Implemented in `compact-theme.js`:

- `CompactBlocklyTopRow`
- `CompactBlocklyBottomRow`
- `CompactBlocklyRenderInfo`
- `CompactBlocklyDrawer.drawRightSideRow_()`
- `CompactBlocklyRenderer.makeRenderInfo_()`
- `CompactBlocklyRenderer.makeDrawer_()`

Important scope:

- Did not restore zero-width simple-wrapper connection shapes.
- Did not restore hidden simple-wrapper paths.
- Did not restore skipped inline socket drawing.
- Did not restore global `.blocklyPathLight` hiding.

Rationale:

- Rounded corners need the row classes so the common drawer receives
  right-rounded corner elements.
- The right-side drawer method draws horizontally to each row's measured right
  edge before drawing vertically, which keeps row joins coherent.
- The previous alignment regression should not return because the asymmetric
  row minimums have been corrected.

Cache-busted:

- `compact-theme.js?v=20260630f`

Manual check needed:

- confirm rounded right corners are restored
- confirm no white corner/background artifacts returned
- confirm value/variable vertical alignment remains improved

### Wrapper border-only restore and right-edge artifact adjustment - 2026-06-30

Manual feedback:

- rounded right corners are restored
- value/variable wrappers still need the required border-only style
- a small artifact is visible on the rounded right edge

Restored the logged border-only wrapper treatment, but only the parts needed for
that role:

- `CompactBlocklyConstants.shapeFor(connection)` again returns a zero-width
  `SIMPLE_VALUE_WRAPPER_SHAPE` for value connections involving configured
  simple wrapper block types
- `CompactBlocklyDrawer.drawInlineInput_()` again skips parent inline socket
  drawing when the connected child is a simple wrapper, while still positioning
  the connection
- `.compactBlocklySimpleValueWrapper .blocklyPath` is transparent again
- `.compactBlocklySimpleValueWrapper .blocklyPathDark` and
  `.compactBlocklySimpleValueWrapper .blocklyPathLight` are hidden

Not restored:

- global `.blocklyPathLight { display: none; }`
- the earlier asymmetric row minimums

Right-edge artifact adjustment:

- Removed the custom `drawRightSideRow_()` horizontal bridge.
- The bridge was intended to close row-width joins, but after row heights were
  rebalanced it likely creates the visible interruption/shelf on the rounded
  right edge.
- The compact drawer remains only for the simple-wrapper inline socket branch.

Cache-busted:

- `compact.css?v=20260630e`
- `compact-theme.js?v=20260630h`

Manual check needed:

- confirm the border-only value/variable style is back
- confirm vertical alignment remains fixed
- confirm rounded right corners remain
- confirm the right-edge interruption is gone or reduced

### Investigation: why white corners and right-edge artifacts remain - 2026-06-30

Manual feedback:

- the border-only wrapper style is restored
- the tiny white rectangular corners remain
- the right-edge interruption remains

Conclusion:

- The previous plan was incomplete. It treated rounded right corners as mainly a
  top-row/bottom-row corner selection problem.
- That is only true for simple non-output block outlines in Blockly's common
  drawer. It is not how Zelos solves reporter/output block right-side geometry.
- The compact renderer is currently a hybrid:
    - Thrasos renderer subclass
    - common constant provider subclass
    - Thrasos/common render info measurement
    - common drawer outline construction
    - custom top/bottom rows that force right-rounded row corners
    - wrapper-specific CSS/path hiding and skipped inline-socket drawing
- The artifacts persist because this hybrid asks the common drawer to compose
  rounded row corners, inline value geometry, output connection geometry and
  hidden wrapper paths that were not designed as one coherent outline model.

Zelos source comparison:

- Zelos does not simply set every block's right row corners to rounded.
- Zelos top/bottom rows keep right square corners for output blocks without
  statement/next connections. Those blocks are handled by output-connection
  geometry instead of by ordinary row-corner arcs.
- Zelos constant provider defines dynamic output/value shapes:
    - shape width/height are functions of block height
    - connection offsets are functions of the dynamic shape dimensions
    - shapes include `pathRightDown()` / `pathRightUp()` for the right edge
- Zelos render info adds a `rightSide` measurable for output blocks and runs
  `finalizeOutputConnection_()`, `finalizeHorizontalAlignment_()` and
  `finalizeVerticalAlignment_()` before final sizing.
- Zelos drawer has a specific dynamic-output branch:
    - draw flat top
    - draw the right dynamic connection side
    - draw flat bottom
    - draw the left dynamic output side
- Zelos path object can hold extra outline paths for inline input outlines.

Thrasos/common source comparison:

- Thrasos only customizes spacing/row measurement through its `RenderInfo`.
- Thrasos uses the common constant provider, common drawer and common path
  object.
- Common top/bottom rows default to right square corners.
- Common drawer's generic right side is a vertical line between rows.
- Common output connection handling draws the output shape on the left side,
  not a separate dynamic rounded right side for reporter blocks.

Flaws in the previous compact plan:

- It copied the visible symptom of Zelos row classes without copying the
  connected dynamic-shape model that makes Zelos' reporter/right edges coherent.
- It forced `hasRightSquareCorner() => false` for all blocks, whereas Zelos does
  this conditionally and intentionally leaves some output-block row corners
  square because another path draws the rounded reporter shape.
- It tried to fix path joins with a small `drawRightSideRow_()` bridge, but that
  was still a local patch on an inconsistent outline model.
- It misclassified the white corners as likely CSS/light-path residue. Current
  evidence says the stronger cause is geometry/path composition: small exposed
  background regions or overlapping edge paths created by the hybrid outline.
- It mixed two independent concerns:
    - wrapper border-only presentation
    - outer block right-edge rounding
  These need separate implementation paths.

Revised implementation direction:

1. Keep the useful proven parts:
    - Thrasos renderer subclass for speed/spacing baseline
    - common constant provider subclass for compact measurements
    - balanced ordinary top/bottom row heights (`5`/`5`)
    - wrapper block type list in tokens
    - border-only wrapper visual treatment, but treat it as separate from
      right-edge rounding
2. Stop treating global row-corner forcing as the final rounded-right solution.
3. For reporter/output-style blocks, implement a small Zelos-inspired dynamic
   rounded shape path:
    - define a compact rounded dynamic shape in the constant provider
    - return it from `shapeFor()` for chosen value/output connections
    - include right-side path functions equivalent in role to Zelos'
      `pathRightDown()` / `pathRightUp()`
4. Add only the minimum render-info support needed for those dynamic output
   shapes:
    - set output connection height/width from the measured block height
    - set output connection offsets from the dynamic shape
    - add/position a right-side measurable only where the dynamic right side is
      actually drawn
5. Add only the matching drawer branch:
    - for dynamic output blocks that meet the same safe criteria as Zelos
      (output connection, no statement input, no next connection), draw the top,
      right dynamic side, bottom and left dynamic side as one coherent outline
    - otherwise fall back to the common/Thrasos drawer
6. Do not hide or mask the artifacts with broader CSS.
7. If this starts expanding toward a large partial Zelos port, stop and either:
    - switch the compact renderer to subclass Zelos more directly and then
      reapply Thrasos-like compact spacing, or
    - use simpler local compact block definitions for the affected educational
      value/reporter blocks.

Immediate next check before implementation:

- Inspect one affected block's rendered SVG path data in the browser console
  while toggling the current compact row override. The expected result is that
  the white corners disappear when the forced rounded row-corner hybrid is
  removed, confirming the geometry diagnosis.

### Implementation: compact dynamic rounded value/output shape - 2026-06-30

Implemented the revised renderer approach in
`public/blockly-compact-theme/compact-theme.js`.

Changed:

- kept the renderer as a `Blockly.thrasos.Renderer` subclass
- kept the constant provider as a common/base
  `Blockly.blockRendering.ConstantProvider` subclass
- added a compact dynamic rounded value/output shape in the constant provider
- `shapeFor(connection)` now returns:
    - zero-width wrapper shape for configured simple value wrappers
      (`sf_number`, `variables_get`)
    - compact dynamic rounded shape for output connections
    - compact dynamic rounded shape for inline input value connections
    - stock shape for statement connections
    - stock shape for external input value connections, because Blockly's
      external value-input measurable still expects numeric shape width/height
- changed compact top/bottom row right-corner logic to match the important
  Zelos condition:
    - output blocks without statement/next connections keep square row corners
      because their right side is drawn by the dynamic output shape
    - non-output blocks can still use rounded row corners
- added a compact `RenderInfo.finalizeCompactDynamicOutput_()` pass that sets
  dynamic output connection height, width and offsets from the measured block
  height before the normal Thrasos finalization runs
- added a compact drawer dynamic-output branch:
    - flat top
    - dynamic rounded right side
    - flat bottom
    - dynamic rounded left/output side
- added a compact drawer dynamic-inline-input branch so dynamic value sockets
  are not sent through the common drawer's static inline socket path
- preserved the wrapper-specific `drawInlineInput_()` skip for border-only
  simple wrappers

Important correction from the failed plan:

- The new implementation no longer relies on globally forcing right row corners
  to rounded as the primary solution.
- Rounded reporter/value block geometry now comes from the same conceptual
  route as Zelos: dynamic connection shapes plus matching render-info/drawer
  support.
- CSS masking was not expanded.

Cache-busted:

- `compact-theme.js?v=20260630i`

Manual check needed:

- confirm right-side rounded corners remain visible at about 10px
- confirm the tiny white rectangular corners are gone or reduced
- confirm the right-edge interruption is gone or reduced
- confirm wrapper border-only style remains restored
- confirm value/variable vertical alignment remains improved

### Correction: rounded-rectangle side, not crescent reporter side - 2026-06-30

Manual feedback after the dynamic-output implementation:

- the white rectangular corner gaps were fixed
- some reporter/right edges became crescent-shaped rather than rectangular
  blocks with rounded right corners
- the small right-corner join artifact remained
- the `if` condition expression was visibly misplaced

Diagnosis:

- The first dynamic shape used a single cubic curve from the top right to the
  bottom right. That creates a crescent/oval reporter side, closer to Zelos'
  fully rounded reporter shape, not the target compact rectangular block with
  rounded right corners.
- The implementation also returned the dynamic shape for inline parent input
  value connections. That was broader than needed and likely caused the
  `controls_if` condition row to measure/position the connected expression with
  geometry that Thrasos/common input rows do not fully support.
- The remaining small corner join is still a row-width join problem on ordinary
  non-dynamic outlines, not the same issue as the earlier white background
  corners.

Implemented correction:

- replaced the crescent cubic side with a rounded-rectangle side:
    - top-right arc
    - straight vertical segment
    - bottom-right arc
    - radius is based on `CORNER_RADIUS` and capped by half the block height
- stopped returning dynamic shapes for parent input value connections
- kept dynamic shapes only for output value connections, plus the existing
  zero-width wrapper special case
- removed the now-unused dynamic inline-input drawing branch
- restored a small right-side row bridge for ordinary outlines:
    - draw horizontally to `row.xPos + row.width`
    - then draw vertically to the row bottom
    - dynamic output outlines bypass this branch and keep their coherent
      output-specific path

Expected manual-check outcome:

- reporter/value blocks should read as rectangular blocks with rounded right
  corners, not crescents
- the `if` condition expression should return to the correct condition-socket
  placement
- the small right-corner join artifact should be reduced or gone on ordinary
  statement blocks
- the previous white corner gaps should remain fixed

Cache-busted:

- `compact-theme.js?v=20260630j`

### Correction: preserve Blockly connection anchors - 2026-06-30

Manual feedback after the rounded-rectangle correction:

- most right-corner issues were improved
- artifacts remained on the lower two blocks
- value/reporter block placement became badly broken, with connected children
  floating out of their parent sockets

Cause:

- The compact dynamic output shape changed the output connection's vertical
  anchor to `height / 2`, following Zelos' centered dynamic reporter model.
- The compact renderer did not also move parent input sockets to a centered
  dynamic model.
- Blockly positions connected value blocks by aligning:
    - child output connection offset
    - parent input connection offset
- Parent input sockets are still using the common/Thrasos top-biased offset
  (`TAB_OFFSET_FROM_TOP`, currently `5`).
- Therefore children were shifted upward by roughly half their height minus the
  normal tab offset.

Implemented correction:

- kept the compact rounded-rectangle output path
- changed the compact dynamic output shape's `connectionOffsetY()` back to
  `TAB_OFFSET_FROM_TOP`
- this makes the rounded right edge a visual outline change without changing
  Blockly's existing connection placement model

Expected manual-check outcome:

- connected output/value blocks should return to their parent sockets
- previous crescent shape should remain fixed
- white rectangular corner gaps should remain fixed
- remaining lower-block corner artifacts may still need a separate row-join
  cleanup, but should no longer be mixed with placement failure

Cache-busted:

- `compact-theme.js?v=20260630k`
