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

### Next logical slice after this one

- Upgrade the maze design so the intended solution genuinely requires a cycle, a branch and additional turns.
- Then tune hints around the richer route so feedback still helps without giving the answer away too early.
- After that, do mobile drag/tap usability adjustments and visual polish of the maze route and celebration motion.

### Shared polish note

- Browser-chrome-sensitive ornament positioning should prefer viewport-geometry inference over browser-family assumptions.
- Shared page chrome should use `visualViewport` overlap measurements where available so bottom-anchored and top-anchored mobile browser UI can be handled from the same mechanism.
- Tiny sub-pixel viewport differences should be clamped out so non-overlay browsers do not get accidental ornament drift.
