# Blocks UX Specification

This file captures the refined block-editor UX and UI behaviour that has emerged from the current Summer Fair activities.

Purpose:

- preserve the useful interaction behaviour already developed in the custom assembly editor
- separate block-editor UX from broader challenge content requirements in `challenge_spec.md`
- provide a concrete behaviour contract for future refactors or a possible Blockly-backed editor mode

## Scope

This spec covers the learner-facing UX of block composition and execution support.

It does not define:

- puzzle-specific validation logic
- challenge content
- reward copy
- page theming outside the block editor surface

## Product modes to support

The current project already suggests two distinct block-editor modes that future work should preserve.

### 1. Guided construction mode

Users assemble a program from a palette into an initially empty or mostly empty workspace.

Examples:

- Bubble Sort Beach
- Algorithm Lagoon Maze

### 2. Rearrangement mode

Users start with all or most blocks already present in the workspace and the challenge is to reorder or restructure them.

Potential future uses:

- Python fragment ordering
- debugging-by-rearrangement
- minimal-hint assessment tasks

The editor architecture should support both modes without forcing the same visual or toolbox treatment for both.

## Current shared editor model

The current custom editor, implemented primarily in `public/js/assembly.js`, already provides a set of reusable UX behaviours.

### Shared structural model

- a palette area for available pieces
- a workspace/root sequence area
- nested sockets inside container blocks
- two socket modes:
    - `single`
    - `sequence`
- value pieces with editable inputs
- snapshot/restore support for lesson persistence

### Shared piece families currently modeled

- `statement`
- `container`
- `condition`
- `value`

### Shared interaction scopes

- `palette`
- `workspace`

## Effective behaviours to preserve

These are the behaviours that appear effective and should be treated as baseline requirements for future work.

### Composition and placement

- Users can move blocks by drag-and-drop.
- Users can also move blocks by tap-to-place.
- The same compatibility rules should apply to both movement methods.
- Placement should be structurally constrained, not answer constrained.
- Wrong-but-structurally-possible programs must remain buildable.
- Invalid placements should be rejected with a short discrete message.

### Drag/drop behaviour

- The editor should not require pixel-perfect dropping.
- Nearest-target matching for drag/drop must be based on the dragged block bounding box against all compatible target bounding boxes in the relevant scope, not just the pointer/contact point.
- When the cursor/contact point is over the workspace column, the dragged block should snap to the nearest compatible target in that column.
- For non-single-occupant placements such as sequence blocks placed in the workspace or inside another block, the top, between, and bottom insertion targets of the relevant container must remain valid candidates.
- For replaceable single-occupant sockets, if the dragged block bounding box overlaps, or is within a small threshold gap of, the compatible existing occupant bounding box, replacement should be preferred over other target choices.
- If that near-overlap replacement rule is not met, an unoccupied compatible target should be preferred instead.
- The active resolved drop target should be visibly highlighted during drag.
- Drag should feel available from the surface of the block, not only a tiny handle.

### Tap-to-place behaviour

- Tapping a block selects it.
- Tapping the same block again deselects it.
- When a block is selected, tapping a valid target slot or socket should place it there.
- A scroll must be possible between the first tap and the placement tap so the learner can select a block, scroll, and then choose a visible target.
- If the second tap is on the other scope or column, the nearest valid target in that scope should be used for placement rather than requiring pixel-perfect tapping of the exact final slot.
- Tap-to-place should use the same compatibility and target-priority rules as drag/drop, except for drag-only target highlighting.
- If the user taps another compatible occupied socket/block region while a piece is selected, replacement should still be possible under the same near-overlap and compatibility rules.
- If no valid target exists in the chosen scope, the move should be rejected without corrupting state and the block should return to its original location.

### Selection and state visibility

- Selected pieces must be visibly distinct.
- Replacement targets must be visibly distinct from ordinary sequence insertion targets.
- Drop/insertion guidance should help the learner predict where the piece will land.
- Inputs embedded in blocks must remain editable without triggering accidental selection or dragging.

### Layout and readability

- The editor should remain usable on a narrow phone screen.
- Container and socket padding should stay compact enough to avoid unnecessary horizontal bulging.
- Nested structure should still read clearly even when compact.
- The editor should support an overview/compact mode on narrow screens where needed.
- The palette and workspace should be allowed to evolve separately in future layouts, including sticky palette behaviour.

### Feedback and lesson shell integration

- The block editor should fit inside a lesson shell that includes prompt, hint, feedback, and success states.
- Feedback should be easy to see on mobile.
- Running or checking a solution should scroll the relevant puzzle state into view.
- The editor must support puzzle-specific feedback without hard-coding that feedback into shared editor internals.

### Execution and trace support

- The current running step should be highlighted clearly.
- Only the currently evaluated condition or operation should be highlighted at each step.
- The editor should support a run-view mode that allows code and puzzle state to be seen together.
- The run-view behaviour should be treated as separate from ordinary composition flow.

## Current code-backed behaviours

The following refined behaviours are already present in the current custom system and should be explicitly preserved during future refactors.

### State and persistence

From `public/js/assembly.js` and `public/js/app.js`:

- editor state can be snapshotted and restored
- palette state is real editor state, not just a visual source list
- value inputs are part of snapshot state
- puzzle pages persist editor snapshots through shared activity state

### Target resolution

From `public/js/assembly.js`:

- placement candidates are gathered from actual compatible containers/sockets
- sequence targets are modeled as insertion bands rather than whole large containers
- replacement candidates use overlap/proximity checks against existing occupants
- highlight state is updated separately from Sortable's own provisional movement logic
- candidate selection is intended to follow a deterministic priority order:
    - first, limit to compatible candidates in the relevant scope
    - then, for replaceable single sockets, prefer replacement only when overlap or near-overlap with the current occupant is met
    - otherwise, prefer an unoccupied compatible target
    - for sequence placements, preserve top, between, and bottom insertion candidates throughout resolution
- any future editor substrate should preserve this target-priority model explicitly rather than approximating it with pointer-nearest heuristics

### Tap flow

From `public/js/assembly.js`:

- piece click toggles selection
- scope click with a selected piece resolves a placement target in that scope
- invalid scope placement emits a rejection event
- compatible occupied targets can still participate in tap placement
- scroll-between-taps is a required part of the flow, not an incidental side effect
- the second tap should resolve to the nearest valid target in the chosen scope when an exact direct tap on the final placement location is not practical on a small screen

### Run-view integration

From `public/js/app.js`, `public/js/bubble-sort.js`, and `public/js/algorithm-maze.js`:

- run focus is a separate presentation state
- puzzle scripts can enable or disable run focus
- viewport-sensitive run-view sizing is shared through `createRunFocusController`
- lesson pages can animate step-by-step execution while keeping validation logic puzzle-specific

## Visual shell requirements for container blocks

These are current design requirements, independent of implementation approach.

### Outer shell shape

Repeat and choice blocks should read as one continuous outer shell.

That shell should have:

- a closed top section
- a continuous left wall
- a closed bottom section
- an open right side through the middle body area

### Condition chamber

- The condition/header socket belongs inside the top chamber of the same outer shell.
- It should not visually become its own independent outer box.
- The shell geometry should make it obvious that the condition is part of the container's top region.

### Sequence body

- The growable sequence area sits in the middle opening of the shell.
- The body should be able to grow to hold multiple contained blocks.
- The shell should not waste width on a fully enclosed right side.
- Nested body blocks may extend further than the apparent width of the header if that helps preserve shell continuity.

### Current design workflow rule

- When the shell geometry is still being designed, prototype it in isolation first.
- Do not repeatedly mutate the live assembly renderer while the shell shape is unresolved.
- Current scratch prototype paths:
    - `public/assembly-shell-prototype.html`
    - `public/css/assembly-shell-prototype.css`
    - `public/assembly-c-shell-prototype.html`
    - `public/css/assembly-c-shell-prototype.css`

## Migration guardrails for a Blockly path

If a future Blockly-backed mode is explored, it should be evaluated against the behaviours above, not just against raw block rendering capability.

Any Blockly migration or hybrid integration must preserve:

- dual movement model expectations where relevant
- puzzle-shell embedding with hints and feedback
- compact mobile layout
- constrained rearrangement mode as well as open composition mode
- step highlighting and run-view integration
- snapshot/restore support for lessons

If Blockly cannot preserve these without heavy fighting of its default interaction model, then it should be limited to a separate exploratory-programming mode rather than replacing the constrained assembly editor entirely.

## Open questions for future design work

- whether one editor substrate can elegantly support both exploratory programming and rearrangement-only tasks
- whether container shells should ultimately be rendered by CSS, SVG, or a hybrid layer
- how much of the execution/runtime model should become shared rather than puzzle-specific
- whether palette filtering and sticky palette behaviour should become default shared features or remain lesson-specific options
