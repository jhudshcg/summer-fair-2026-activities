# feature and functionality development for code block assembly related code

read the challenge_spec sections on shared assembly functionality and document implementation plans, progress and future direction here.

## Assembly movement slice plan

Date: 2026-06-19

### Refined scope for this slice

- Keep this as a shared assembly-engine slice in `public/js/assembly.js`, not a maze-only interaction patch.
- Keep SortableJS as the primary interaction layer for drag detection, dragging, connected-container movement and in-list reordering.
- Add project-owned logic only where the refined requirements go beyond what SortableJS decides by itself.
- Explicitly defer visual trace and workspace float behaviour to the next slice.

### Requirement interpretation after spec refinement

- Two movement methods must coexist at all times:
    - drag and drop
    - tap to place
- Neither method should require pixel-perfect placement.
- Nearest compatible target logic applies to both:
    - drag release
    - second tap placement
- Replacement is required only where the nearest compatible target is a filled compatible socket, for example a condition/header socket.
- The block should return to its original position if cross-column placement finds no compatible target.
- Compactness should improve, but only as a light shared spacing adjustment rather than a redesign.
- Valid-target highlighting during tap selection is not part of the agreed requirement for this slice.

### SortableJS evaluation for this slice

- SortableJS remains a good fit for the shared drag layer.
- It already covers the hard low-level parts we do not want to reimplement:
    - touch-capable drag lifecycle
    - connected nested sortable containers
    - reorder animation and placeholder behaviour
    - container-to-container movement constraints via shared wrapper rules
- SortableJS options that are directly relevant here:
    - `delay` and `delayOnTouchOnly` for long-press behaviour
    - `fallbackTolerance` for movement threshold before a drag starts
    - `touchStartThreshold` for cancelling delayed drag on sensitive touch devices
    - `handle` if drag should start only from a specific draggable sub-element
    - `onMove` and `onEnd` for wrapper-level acceptance and drop correction
- SortableJS does not natively understand "nearest compatible target in this column" as a semantic rule across sockets and lists.
- SortableJS also does not provide the full tap-to-place workflow on its own.
- Therefore the wrapper should compose SortableJS with a small project-owned placement layer rather than replacing SortableJS drag behaviour.

### Drag versus scroll assessment

- The current `delay: 120` value feels materially slower than intended in practice and should not remain as-is.
- A pure delay-based approach is the wrong primary mechanism if the priority is immediate page scroll when the gesture is not clearly a drag.
- The workable Sortable-first direction is:
    - reduce or remove the touch delay
    - rely on a small drag-start movement threshold through `fallbackTolerance`
    - keep drag initiation limited to real draggable elements only
    - let ordinary touch scroll proceed naturally when the user is not meaningfully moving a draggable block
- The more exact idea of "if the gesture is not over a draggable, do not swallow it" is workable in the broad sense because Sortable only attaches drag behaviour to the configured draggable items.
- But if the initial touch starts on a draggable block, we cannot fully delegate the decision to the browser with zero wrapper thought, because that same touch may represent either:
    - an intended scroll starting on the block
    - an intended drag
- For that case, the most library-aligned solution is not custom gesture recognition first. It is tuning Sortable's own drag threshold and, if needed, introducing a dedicated drag handle so scroll can start from the body of the block while drag starts from the handle.
- The handle approach is the cleanest fallback if threshold tuning alone does not make scroll feel immediate enough on phones.

### Recommended implementation order

1. Tune SortableJS drag start before adding new behaviours.
    - Test a much lower-friction configuration based on near-zero delay plus a small fallback tolerance.
    - If scrolling still feels obstructed when a touch starts on a block, switch to a visible drag handle rather than adding bespoke pointer gesture code.

2. Add shared imperative placement helpers in `assembly.js`.
    - Enumerate compatible containers and sockets using the existing wrapper acceptance rules.
    - Resolve the nearest compatible target inside the relevant column.
    - Support replacement when the chosen target is a filled compatible single socket.

3. Keep drag powered by SortableJS, then normalize the final placement in `onEnd`.
    - Let Sortable manage the live drag.
    - After release, if the release context requires nearest-target correction, move the piece to the resolved target through the shared placement helper.

4. Add tap-to-place on top of the same placement helper.
    - First tap selects a piece and highlights only that piece.
    - Second tap on a target area, or on the other column, resolves nearest compatible placement in that column.
    - If no compatible target exists, cancel the move, restore the prior location and emit a small discrete message.
    - Tapping the selected piece again, or another clear cancel path, exits selection.

5. Apply a small shared compactness pass.
    - Tighten assembly spacing tokens in shared puzzle CSS.
    - Keep this as token tuning only unless a concrete readability issue appears.

### Guardrails for implementation

- Do not replace SortableJS drag sensing with bespoke pointer-tracking code.
- Do not add target-highlighting systems that are not part of the agreed requirement.
- Do not widen this slice into run-trace or workspace-float work.
- Prefer one shared placement algorithm used by both drag-drop correction and tap-to-place.
- Preserve wrong-but-structurally-possible assemblies; only impossible attachment types should be blocked.

### Validation target for this slice

- On phones, users should be able to scroll immediately when not making a real drag gesture.
- Dragging from palette to workspace and between sockets should still feel reliable.
- Releasing over the workspace column should snap to the nearest compatible target where one exists.
- Tapping should support select, optional scroll, then place.
- Filled compatible single sockets should be replaceable through both drag release and second-tap placement.
- When no compatible target exists for the requested column move, the piece should return to its prior location and the page should show a small rejection message.

### Progress update after first implementation pass

- Shared drag start has been retuned to favour immediate scroll on block bodies and explicit dragging from a dedicated handle.
- `public/js/assembly.js` now tracks palette state as real assembly state rather than only as a shuffled source list.
- Shared nearest-target resolution now exists for both:
    - tap-to-place
    - drag-end correction when the release point is over a relevant assembly column
- Shared single-socket replacement is now handled by the engine, with displaced pieces returned to the source slot when structurally valid, otherwise to the palette.
- Bubble Sort and Algorithm Maze now surface shared placement rejection messages through their existing feedback areas.
- Validation completed so far:
    - `node --check public/js/assembly.js`
    - `node --check public/js/bubble-sort.js`
    - `node --check public/js/algorithm-maze.js`
    - no editor-reported errors in touched JS/CSS files
- Maintainability follow-up agreed for the next assembly pass:
    - add concise comments for the shared class and key functions in `public/js/assembly.js`
    - keep comments brief and focused on intent, state model, and non-obvious placement behaviour rather than restating syntax
- Remaining validation gap:
    - this pass has not yet been browser-tested on an actual phone-sized viewport, so touch feel and edge-case placement behaviour still need hands-on verification.

### Handoff for next session

- Start with hands-on browser testing of `public/js/assembly.js` behaviour before widening the slice.
- Prioritise these checks:
    - handle-based drag feel on phone-sized viewport
    - tap-select, scroll, second-tap placement flow
    - nearest-target snap on drop into workspace column
    - replacement of filled compatible single sockets
    - rejection path when no compatible target exists in the chosen column
- After behaviour is confirmed or corrected, add concise comments to the shared assembly engine, especially around:
    - `findPieceLocation` and its downward subtree search
    - palette-as-state handling
    - nearest-target resolution
    - replacement/displacement rules
    - drag-end correction versus normal Sortable movement
- Keep visual trace and workspace float deferred until the movement behaviour is stable.
