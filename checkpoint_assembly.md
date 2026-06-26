# feature and functionality development for code block assembly related code

read the challenge_spec sections on shared assembly functionality and document implementation plans, progress and future direction here.

## Dev log

### 2026-06-26

- Added `blockly_migration_plan.md` as the staged migration plan for evaluating Blockly using the current Summer Fair activities as a test ground.
- The plan deliberately separates:
    - lesson shell responsibilities
    - editor mode responsibilities
    - runtime / simulator responsibilities
    - exploratory versus rearrangement mode outcomes
- It also records useful supporting libraries for runtime and visual world work, including JavaScript, Python, SVG, and canvas options.

### 2026-06-24

- Agreed next shared assembly UX slice: reduce workspace bulging by redesigning the visual treatment of container blocks and growable sequence sockets.
- Current diagnosis:
    - the present container/socket treatment spends too much width on right-side framing, nested padding, and closed-box visuals that do not add much learning value
    - this cost is most obvious on loop bodies and if/else paths, where the real requirement is a readable growable lane, not a fully boxed card inside another fully boxed card
- Agreed direction:
    - keep single sockets compact and framed
    - redesign growable sequence sockets as more open lanes with less right-side enclosure
    - allow the sequence/body area to read as a three-part structure:
        - top
        - growable middle with open right side
        - bottom
    - keep the shared assembly state model and placement logic unchanged for this slice; solve the issue with markup shaping plus CSS first

### Planned implementation approach

1. Shared renderer change in `public/js/assembly.js`
    - add clearer markup for sequence sockets only
    - keep the existing sortable sequence container as the actual drop surface
    - wrap that sequence container in a small visual shell that exposes top, middle, and bottom sections
    - add socket data attributes or classes so CSS can distinguish single sockets from sequence sockets without puzzle-specific JS branching

2. Shared puzzle CSS change in `public/css/puzzles.css`
    - reduce horizontal padding on container pieces
    - keep the header/condition area visually closed enough to read as a block start
    - style sequence sockets as open lanes rather than closed padded boxes
    - preserve insertion marker visibility and drop-target highlighting inside the growable middle lane

3. Guardrails
    - do not alter compatibility rules, resolver logic, or snapshot/state shape in this slice unless a blocker is discovered
    - keep the change shared across Bubble Sort and Algorithm Maze rather than page-local
    - keep ownership aligned with the style guide: shared assembly visuals stay in `puzzles.css`, not `style.css`
    - prefer a small DOM reshaping pass over pseudo-element tricks if explicit markup is more reliable cross-device

### First validation target for this slice

- `node --check public/js/assembly.js`
- then editor validation for `public/css/puzzles.css`
- then a browser pass focused on:
    - reduced right-side bulging on container blocks
    - readable nesting of loop and branch bodies
    - unchanged drop-target and insertion-marker behaviour

### Sequence socket first-pass outcome

- `public/js/assembly.js` now gives sequence sockets a small visual shell with explicit top, middle, and bottom sections, while keeping single sockets unchanged.
- `public/css/puzzles.css` now styles sequence sockets as more open left-railed lanes with reduced right-side enclosure and slightly tighter container padding.
- Shared assembly state shape, snapshot format, and placement logic were intentionally left unchanged in this pass.
- Initial validation completed:
    - `node --check public/js/assembly.js`
    - editor validation clean for `public/js/assembly.js` and `public/css/puzzles.css`
- Remaining validation still needed:
    - hands-on browser check of nested loop and branch readability
    - verify that insertion markers and drag highlights still feel obvious inside the new open lane treatment

### Scratch prototype branch

- Added a standalone shape prototype at `public/assembly-shell-prototype.html` with supporting CSS in `public/css/assembly-shell-prototype.css`.
- Purpose:
    - validate the intended closed-top, open-right, closed-bottom outer shell shape in isolation
    - stop thrashing the live assembly renderer while the visual geometry is still being agreed
    - provide a simpler surface for future refinement before any final port back into shared assembly markup/CSS
- Current agreed workflow change:
    - continue shell-shape iteration on the standalone prototype first
    - do not treat the current live `public/js/assembly.js` / `public/css/puzzles.css` container-shell experiments as final or approved
    - only port the shell structure back into the live shared assembly system once the prototype geometry is explicitly approved
- Current design target clarified from user sketch/markup:
    - the repeat/choice block itself must be the boxy `C`
    - top closed
    - left side continuous
    - bottom closed
    - middle open on the right
    - condition/header socket belongs inside the top chamber of that same outer shell rather than reading as its own separate outer box

### 2026-06-19

- Agreed implementation plan for the current shared assembly fix:
    - replace point-led resolution with a shared bbox-led resolver in `public/js/assembly.js`
    - treat compatible occupied single sockets as replaceable only when the dragged block overlaps or nearly overlaps the existing compatible occupant
    - otherwise prefer unoccupied compatible targets, while keeping top and bottom sequence insertion targets available in workspace and nested sequence containers
    - use one resolver for drag highlight, drag-end correction and tap-to-place target selection
    - stop requiring the dotted handle as the only drag origin and remove the layout padding reserved for it
    - add concise comments for the shared class, resolver helpers and other subtle assembly logic while implementing the change
- First validation target after the first substantive code edit:
    - `node --check public/js/assembly.js`
    - then focused browser checks on Bubble Sort and Algorithm Maze for top insertion, nested insertion, replacement and drag-highlight agreement
- Follow-up implementation refinement after first browser feedback:
    - narrow sequence insertion candidates from large half-container regions to thin insertion bands at true top/between/bottom insertion lines
    - add lightweight global drag-move tracking during active Sortable drags so highlight/target choice keeps updating even when Sortable does not emit a fresh `onMove` for every pointer move inside one container
    - rename Bubble Sort's initial `set numbers` piece from `Setup` to `Step` so it behaves and reads like a normal statement rather than a special-case category
    - exclude Sortable ghost placeholders from shared sequence-target and replacement-target calculations so provisional drag spacing does not create fake semantic targets or duplicate highlight cues
    - make the palette and workspace column containers stretch to matching height so column-relative nearest-target behaviour has a more consistent layout surface
    - centralize shared block vocabulary in `public/js/assembly.js` so repeat/choice/condition/number labels and socket names stay consistent across puzzles
    - split Bubble Sort's comparison into a separate choice block plus comparison-condition piece, and update Bubble Sort validation to match that structure
    - tighten shared container/value spacing so repeat, choice and number blocks read more compactly on phones
- Current validation state:
    - `node --check public/js/assembly.js`
    - `node --check public/js/bubble-sort.js`
    - editor checks clean for touched JS/CSS/Markdown files
    - browser validation is partially blocked by stale cached JS in existing tabs, so the latest retargeting fix still needs a clean hard-refresh or cache-busted asset load for reliable hands-on drag verification
- Implementation progress recorded after the first resolver pass:
    - added shared bbox/rect helpers and candidate collection for sequence and single-socket targets
    - added replacement precedence based on dragged-rect proximity to occupied compatible socket content
    - added shared drag-target highlight state for replacement and sequence insertion positions
    - removed handle-only dragging in JS and removed the extra handle padding in shared puzzle CSS
    - added concise comments around shared state sync, subtree lookup, resolver intent and subtle tap-selection behaviour
    - refined tap-selection so occupied compatible socket content can still bubble to scope placement logic, while ordinary piece taps can switch selection
- Validation status after implementation:
    - `node --check public/js/assembly.js` passes
    - editor checks are clean for `public/js/assembly.js` and `public/css/puzzles.css`
    - cache-busted Bubble Sort page confirms the handle padding/layout regression is removed in live CSS
    - Bubble Sort tap-placement path was browser-checked successfully for:
        - placing Setup above an existing loop at workspace top
        - placing the compare block into the loop body
    - drag-specific browser verification and clean Maze replacement verification still need another hands-on pass; browser automation was unreliable for Sortable-driven drag state and produced inconsistent synthetic-click results on the Maze page

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
- Drag target resolution should use the dragged block bbox against all compatible target bboxes in the relevant column rather than a single pointer point.
- Replacement is required only for replaceable filled compatible single sockets, for example a condition/header socket.
- Replacement should win only when the dragged block bbox overlaps, or nearly overlaps within a small threshold, the compatible existing occupant bbox.
- If that replacement-overlap rule is not met, unoccupied compatible targets should win instead.
- For non-single-occupant placements inside sequence containers, the top and bottom insertion targets of the relevant workspace/container must remain valid candidates.
- The block should return to its original position if cross-column placement finds no compatible target.
- Compactness should improve, but only as a light shared spacing adjustment rather than a redesign.
- During drag, the currently chosen nearest compatible target should be highlighted for UX clarity and debugging.
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
- Keep SortableJS as the drag engine, but do not treat Sortable's hovered insertion choice as the source of truth for semantic target resolution.
- Use one shared resolver for drag highlighting, drag-end correction, replacement selection and tap-to-place.
- When a compatible replaceable occupant is directly overlapped or nearly overlapped, prefer replacement; otherwise prefer an unoccupied compatible target or reject.
- Preserve top and bottom sequence insertion candidates for workspace/container placements even while adding socket replacement logic.
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

## Testing

 Bugs found 19/6/26 following recent changes to assembly drag and drop behaviour:

 1. on desktop it works, but on mobile all platforms,on the bubblesort puzzle, the setup block won't drag to the top of the workspace, if there's already a loop in the workspace. the setup block looks like it will place at the top, because you can see the ghost of it in the right place when dragging near the top, but it doesn't land when dropped. even if the drag handle is fully over hte drop zone, it doesn't take. even if the position isn't perfect, the top is still by far the closest target area, but it's not being dropped there. required behaviour: all valid target positions should be placeable by any compatable block.
 2. the drop target closest match doesn't work for 'inside this loop' targets. the block either goes above or below to while loop block - unless the dotted drag control is positioned inside the 'inside this loop' drop zone. required behaviour: use the whole block bounding box and all compatible target drop zone bounding boxes to judge closest compatable match.
 3. the new dotted drag control icon is taking up its own column in blocks, creating significant wasted right padding space. required behaviour: can keep the icon, but the blocks should be draggable from any part of their surface. and the icon should not change layout of blocks or create extra padding space.
 4. conditions dragged and dropped over existing conditions in the workspace are not replacing the existing condition on the maze puzzle page, but instead are returned to the palette area. required behaviour: if a compatable block requiring a socket block is dropped over an existing compatable block already in the socket, it should replace it.
