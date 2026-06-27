# Blockly checkpoint

Use this file to track Blockly-specific migration planning, spike notes, integration findings, and next steps.

## Dev log

### 2026-06-27

- Initial Blockly checkpoint created to separate Blockly migration work from the broader shared assembly checkpoint.
- Added `blockly_quick_guide.md` as a condensed repo-specific cheat sheet for Blockly integration, theming, styling, placement, and useful manual override seams.
- Added a compactness planning note for making Blockly much more space-efficient horizontally while preserving configurability.
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

### Constraint

- compactness changes must preserve configurability
- token-driven size and spacing controls are preferred over one-off CSS overrides
- puzzle-specific compact blocks should remain optional, not the only supported block vocabulary
- narrow-screen compression should be a mode or configuration layer, not an irreversible rewrite
- pinch-to-zoom may be used as a support mechanism for navigation and inspection, but it is not a substitute for achieving substantially tighter default block width

### Plan

1. Reduce shared Blockly chrome through tokens and configuration first.
    - shrink font size, internal spacing, field padding, row height feel, and visual bulk through `tokens.js`, `summer-fair-theme.js`, and small customization hooks
    - keep these values centralized so the editor can support both normal and compact presets

2. Shorten wording before changing geometry.
    - the largest horizontal cost is verbose stock labels
    - prefer compact, puzzle-specific wording such as `Repeat`, `if`, `swap`, `numbers at`, and symbolic operators where readability remains strong
    - keep label variants configurable so lessons can choose beginner-friendly or compact copy

3. Replace wide stock block patterns with compact custom blocks only where structure is stable.
    - likely first targets: the two Bubble Sort loop blocks, indexed compare, and indexed swap
    - keep custom block definitions modular so other lessons can opt in without forcing Bubble Sort-specific shapes everywhere
    - success means these compact custom blocks get materially closer to the width profile of the current custom assembly blocks, not just slightly smaller than stock Blockly

4. Keep value-heavy constructs inline by configuration.
    - list literals, index expressions, and compare/swap inputs should remain inline by default
    - expose inline-vs-expanded behavior as a customization choice where practical

5. Add a deliberate compact or overview mode for narrow screens.
    - smaller text
    - tighter gaps
    - reduced secondary wording
    - possibly different toolbox treatment
    - do this as a controlled mode switch rather than many unrelated responsive tweaks

6. Keep pinch zoom available and tuned for compact mode.
    - pinch zoom is likely necessary once the workspace gets denser
    - use it to help with inspection and manipulation on phones
    - do not rely on zoom alone to hide excessive block width
    - compact mode should still be readable and usable at its default scale

7. Treat toolbox footprint as a separate optimization track.
    - reduce category label length
    - reduce flyout padding
    - limit visible starter blocks
    - evaluate modal or launcher approaches later if always-visible flyouts remain too costly

8. Only escalate to renderer-level work after text, tokens, and custom block vocabulary have been tightened.
    - renderer or deeper shape work is the expensive path
    - take it only if the token/configuration/custom-block passes still fail the mobile width target

### Acceptance direction

- Blockly should get close enough to the current custom block puzzle density that the editor no longer feels intrinsically too wide for the lesson shell
- configurability must remain intact:
    - normal and compact presets should both be possible
    - lesson-specific wording and block variants should remain swappable
    - compact Bubble Sort blocks should not force all future Blockly lessons into the same block shapes
- pinch zoom should improve usability once density increases, but the base compact layout should already be viable before zooming

### Implementation guardrail

- prefer configuration layers in this order:
        - tokens
        - theme builder
        - block customization hooks
        - custom compact blocks
        - renderer-level intervention

### Python readability note

- stock Blockly Python for `controls_for` is semantically defensive and therefore poor for teaching readability
- when compact Bubble Sort loop blocks are introduced, give them custom Python generators that emit the intended teaching form directly instead of inheriting Blockly's generic `upRange` / `downRange` pattern
