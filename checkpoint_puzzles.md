## Algorithm Maze Slice

Date: 2026-06-17

### Scope for this slice

- Begin the next main activity with a first working implementation of Algorithm Lagoon Maze.
- Replace the current placeholder content on the maze page with a playable fixed-layout puzzle.
- Reuse the shared block assembly engine already proven on Bubble Sort instead of building a second drag system.
- Keep this slice to one fixed maze and one fixed correct program so the first version is reliable on phones.

### Current state after first implementation

- `public/algorithm-maze.html` is now a real activity page rather than a placeholder.
- `public/js/algorithm-maze.js` exists and wires the maze page into the shared assembly engine, shared progress logic and shared feedback/success pattern.
- `public/css/puzzles.css` now includes maze-specific presentation alongside the existing Bubble Sort puzzle styling.
- The page loads with the maze board, demo strip, draggable program assembly area, controls, feedback region and success state.
- Shared browser-chrome-sensitive ornament positioning remains handled centrally through the same geometry-based mechanism used by the rest of the site.

### Agreed implementation direction

- Activity page: `public/algorithm-maze.html`
- Activity script: create a dedicated `public/js/algorithm-maze.js`
- Shared logic remains in `public/js/app.js`
- Shared drag behaviour remains in `public/js/assembly.js`
- Shared puzzle styling stays in `public/css/puzzles.css`, adding only the maze-specific rules needed for the first implementation

### Local technical decision

- The shared assembly engine already supports:
	- nested container pieces
	- separate single and sequence sockets
	- type/family-based socket acceptance
- Because of that, the maze can be implemented as page-specific data and validation/simulation rather than a new interaction framework.

### First implementation target

- Fixed visible maze with:
	- clear start and finish
	- explorer marker
	- tropical path styling
- Short demo strip showing the idea of step-by-step movement without revealing the real route
- Assembly puzzle using a constrained piece set:
	- one loop block
	- multiple loop-condition options with one correct
	- one selection block
	- multiple selection-condition options with one correct
	- move forward / turn left / turn right operation blocks
- Controls:
	- Run program
	- Check solution
	- Reset
	- Hint
- Feedback and success behaviour aligned with the shared activity pattern

### Validation target for this slice

- Cheapest meaningful check after the first implementation edit:
	- open the Algorithm Maze page and confirm the page loads with the maze, assembly UI and controls
- Then verify:
	- wrong-but-structurally-valid assemblies can still be built
	- Run program animates the explorer and stops on failure for wrong logic
	- correct structure completes the route, marks progress, and reveals success state

### Current assessment

- The first working version is now in place, but the puzzle itself is still too simple.
- The next maze revision should make the logic meaningfully richer by adding:
  - a real cycle/loop-worthy section
  - a meaningful branch/decision
  - a couple more turns so route reasoning is less obvious at a glance
- That next revision should preserve phone reliability while making the loop block and selection block feel necessary rather than decorative.
- Clarified next-slice requirement:
	- the maze should contain a genuine walkable cycle so the explorer can keep going around a loop if the logic is wrong
	- the correct solution should require a loop, a selection block, the correct condition choice from multiple condition options, and the correct step order
	- extra turns should matter to the final route rather than acting as cosmetic detours
- Current implementation draft for that richer revision:
	- the puzzle uses a lagoon-ring route where the loop body advances around the cycle and checks for the exit each lap
	- the exit appears only when the explorer reaches the correct corner of the ring, so the condition must be tested inside the loop rather than after it
	- the correct solution uses the `repeat 4 times` condition, the `if there is a path to the left` condition, an `otherwise` turn to keep circling, and a final left turn plus move into the coral gate

### Progress update after the latest implementation pass

- The demo commands are now stacked vertically, highlight as they run, reset the explorer cleanly to the start position before replay, and run slightly slower for readability.
- The puzzle start now sits on a short beach approach before the lagoon loop rather than beginning already on the cycle.
- The fixed repeat-count condition pieces have been replaced in code by a partial loop condition plus a separate numeric value block with learner-entered input.
- Branch conditions remain fixed choice pieces for now; general `while` loop syntax has not been introduced.
- The current maze validator and simulator now expect the start-approach steps, the slotted repeat count, the looped lagoon route, the correct exit condition, and the final turn into the coral gate.

### Agreed next implementation plan

- Keep the stronger maze goals, but reduce the next slice scope so it stays implementable in the current shared assembly system.
- Agreed maze design changes:
	- move the start to a short approach path before the loop so the explorer does not begin already on the cycle
	- keep a genuine walkable cycle in the main lagoon section
	- keep one meaningful branch or exit condition off that loop
	- keep a few extra turns so final step order still matters after the loop/exit logic
- Agreed loop-condition approach for this slice:
	- do not add general `while` loop syntax yet
	- replace fixed repeat-count condition pieces with a partial loop-condition header such as `repeat _ times`
	- provide a separate numeric value block that slots into that condition and stores a learner-entered number
	- treat that value block as the logical equivalent of the loop condition value rather than as a free-standing movement step
- Agreed branch-condition approach for this slice:
	- keep branch conditions as fixed option pieces such as left/right path checks
	- continue to offer more than one condition option with only one correct answer
- Agreed demo polish tasks for this slice:
	- stack the demo command blocks vertically
	- highlight each command while it runs
	- reset the demo explorer cleanly to the true start position before replay so it does not appear to animate in from the side
	- slow the demo slightly so each step is easier to follow on a phone

### Proposed implementation order

1. Fix the demo replay and command-list presentation first so the instructional example is readable and trustworthy.
2. Redraw the puzzle maze so the explorer starts before the loop and reaches the cycle after an initial approach path.
3. Extend the assembly engine and maze script with minimal value-state support for a numeric repeat-value block.
4. Replace the fixed loop-count condition logic in the maze validator and simulator with the slotted numeric repeat value.
5. Retune maze hints, success copy and failure messages around the new start-before-loop route and numeric repeat entry.

### Validation targets for the next slice

- Demo replay starts from the true start position every time and visibly highlights each stacked command in order.
- The puzzle maze starts before the cycle and still contains a genuine loop plus one meaningful exit branch.
- Users can place the numeric repeat-value block into the loop condition and enter a number without breaking drag/drop behaviour.
- Wrong numbers, wrong branch conditions and wrong turn order all fail in readable ways.
- The correct structure and entered repeat count reach the finish and mark the activity complete.

### Next logical slice after this one

- Upgrade the maze design so the intended solution genuinely requires a cycle, a branch and additional turns.
- Then tune hints around the richer route so feedback still helps without giving the answer away too early.
- After that, do mobile drag/tap usability adjustments and visual polish of the maze route and celebration motion.

### Agreed replacement maze plan

- The simplified lagoon-loop draft is no longer the target maze model.
- Replace it with the user-provided sketch:
	- start at the lower-left corner facing east
	- finish at the upper-left end of the top path
	- include the left lower bend, central spine, lower-right square loop area and top-right spur from the sketch
- Keep learner-entered loop counts as part of the puzzle rather than replacing them with only fixed repeat conditions.
- Allow more than one valid solution when the program genuinely solves the maze.
- Current agreed example working solutions:
	- longer counted-loop solution:
		- `repeat 1 time` -> `forward`, `left`
		- `repeat 2 times` -> `forward`
		- `turn left`
		- `forward`
		- `turn right`
		- `repeat until finish` -> `forward`, `if has left` -> `left`, `else` -> `if has right` -> `right`
	- shorter alternative solution:
		- `repeat until finish` -> `forward`, `if has left` -> `left`, `else` -> `if has right` -> `right`
- Validation direction for the next implementation:
	- treat any genuine finish-reaching program as solved
	- classify whether the solution is longer or shortest
	- if a user finds the longer working version first, invite them to try to find a shorter code solution
- Structural implementation direction for the next slice:
	- keep numeric value blocks for counted loops
	- add a fixed `repeat until finish` condition piece
	- allow nested selection blocks so an `else` branch can contain another `if`
	- shift validation from one exact assembly shape to behaviour-first simulation and solution classification

### Progress update after sketch-based replacement implementation

- The previous lagoon-loop draft has now been replaced in code by a maze route based on the user sketch.
- The puzzle route now starts at the lower-left, passes through the left bend and centre spine, includes the lower-right square and top-right spur, and finishes at the upper-left.
- Numeric loop-entry has been retained through two counted-loop condition pieces with separate value blocks.
- The palette now also includes a `repeat until finish` condition and enough selection containers to support a nested `else -> if` alternative solution.
- Validation is now behaviour-first rather than one exact assembly shape:
	- the longer counted-loop solution works
	- the shorter nested branch solution works
	- incorrect loop counts still fail with readable feedback
- Success feedback now distinguishes between:
	- a working but longer solution
	- the shortest intended solution

### Follow-up implementation outcome after clarified grid sketch

- The simulator now treats each `move forward` as exactly one grid step.
- The route geometry has been retuned to better match the clarified grid sketch, including the one-space finish position on the top path.
- The movement palette now includes enough forward and turn blocks for the longer counted-loop route to remain buildable under one-step movement.
- Pressing Check solution now switches the page into a run-focus state and scrolls the maze back into view before the animation starts.
- The running block is highlighted while the explorer moves through the maze.
- The demo board is slightly smaller and the main puzzle board frame is taller so the path widths read more consistently.
- The frame ratios and width caps were tightened again so the actual maze viewport fills much more of the inner scenic scene instead of sitting inside large empty side margins.
- The visible blue board now owns the size cap, and the green scenic layer fills that board with one even border so increasing the board size also increases the maze itself.

### Agreed next maze UX slice

- The run-focus scroll target should be the actual maze board container rather than the top of the wider Island Trail section so the feedback remains visible without extra scrolling.
- The demo card should stay full width, but the demo maze itself should remain smaller than the main puzzle board.
- Clarified sizing rule:
	- the visual board/card stays full width
	- the maze graphic inside it keeps its own capped size
	- the container height should follow the maze graphic height plus padding, not stretch the graphic to fill width
	- consistent path width should drive the apparent maze scale
- Refinement to that rule:
	- the real puzzle maze should be allowed to grow further than the demo maze
	- the demo maze should stay visibly smaller even when its card is full width
	- the scenic green/yellow maze background should be an inner scene layer, separate from the outer blue/yellow board frame
	- the outer board should read as a border around the scenic maze scene rather than sharing the same layer
- Agreed next interaction improvement: add a tap-to-move fallback for the maze assembly UI.
	- Reason: the larger maze palette and longer phone scroll path now make drag-only interaction too heavy for the intended UX.
	- Planned behaviour:
		- first tap selects a piece
		- valid targets highlight
		- second tap on a valid target moves the piece there
		- tapping the selected piece again or tapping a clear cancel control should exit selection mode
	- Scope note: keep this inside the shared assembly engine so Bubble Sort and any later assembly activities can reuse it.

### Additional run-focus layout planning

- Agreed future run-focus enhancement:
	- move only the feedback/results subsection up near the maze when needed, not the whole test-controls section
	- shrink the workspace/code column while the program runs
	- float that shrunken workspace up to the left of the maze container during the run
	- restore the workspace to its normal size and position when the run ends
- Reason: users should be able to see both the progressing maze marker and the active program structure at the same time without losing the main puzzle context.

### Shared polish note

- Browser-chrome-sensitive ornament positioning should prefer viewport-geometry inference over browser-family assumptions.
- Shared page chrome should use `visualViewport` overlap measurements where available so bottom-anchored and top-anchored mobile browser UI can be handled from the same mechanism.
- Tiny sub-pixel viewport differences should be clamped out so non-overlay browsers do not get accidental ornament drift.
