# Challenge Specification

## Project shape

- Static mobile-first mini-site delivered as plain HTML, CSS and JavaScript.
- Five pages total:
    - index page
    - bubble sort challenge
    - algorithm maze challenge
    - code prediction challenge
    - debugging challenge
    - hidden challenge
- Users primarily access the site on phones via QR code.

## File organization

- The deployable site lives under `public/` so one folder acts as the web root locally and in GitHub Pages deployment.
- HTML pages sit at the top level of `public/`.
- Shared stylesheet files live in `public/css/`.
- Vendored third-party CSS files live in `public/css/vendor/`.
- Shared and activity-specific JavaScript files live in `public/js/`.
- Vendored third-party browser libraries live in `public/js/vendor/`.
- Images and other static visual assets live in `public/images/`.
- GitHub Pages deployment is driven by `.github/workflows/pages.yml`, which uploads `public/` as the site artifact.

## Shared behaviour

- Every page shows the current activity number, overall progress and completion state.
- Activities are re-attemptable.
- Completion state is stored in localStorage.
- The hidden challenge is shown in a locked visual state until all four main activities are completed.
- Shared style and shared functionality live in single-source files reused by all pages.
- A lightweight shared CSS framework may be vendored locally where it improves layout consistency, but the project visual identity remains custom rather than framework-default.

## Visual direction

- Tropical visual theme across all pages.
- Tropical colours, playful typography and placeholder clipart-style illustration treatment.
- Responsive layout with large tap targets and clear contrast.

## Shared implementation notes

- Keep the site locked to a light theme for now so vendored Pico styles do not drift surfaces or contrast unexpectedly.
- Use Pico as a lightweight base layer for resets, form controls and shared tokens, but do not rely on Pico layout helper classes where they conflict with the project-specific page layout.
- Prefer shared CSS variables for colours, radii, spacing and shadows so styling changes stay centralised.
- Prioritise contrast over subtlety:
    - dark text on pale panels
    - near-white text on dark or saturated feature cards
    - do not rely on low-contrast muted text for important instructions or status information
- Use the display font for headings and feature-card copy only where it improves emphasis and remains readable.
- Use container-aware font sizing for prominent card copy rather than adding many viewport-only breakpoint overrides.
- Keep breakpoints minimal:
    - use exact pixel breakpoint values with clear range syntax where supported, for example `@media (width >= 390px)` or `@media (width < 672px)`, rather than handoff values like `671.99px` or `673px`
    - use `390px` as the first shared enhancement point for layouts already proven safe above the smallest-phone baseline
    - use `672px` as the shared tablet breakpoint for broader layout enhancement
    - use `1024px` as the shared desktop breakpoint for larger multi-column layout changes
    - prefer `clamp(...)`, shared spacing variables and container queries before adding extra breakpoints
- Keep section cards on pale tropical surfaces with the established soft shadow and radius system rather than introducing new card treatments per page.
- For status chips and similar small summary cards, use explicit text-and-icon layout structure so icons stay contained at narrow widths.
- For content-heavy card grids like the home activity list, prefer explicit shared column caps over framework `auto-fit` behaviour:
    - keep one column below `390px`
    - switch to two columns from `390px`
    - use three columns only at the later desktop breakpoint
    - if a lone final card sits on its own row in a two-column layout, let it span the full row
    - equal-height cards are acceptable, but card contents should flow top-to-bottom with normal gaps rather than being stretched apart to fill height
- For Bubble Sort specifically, keep the instructional card and demo animation readable at in-between tablet and landscape-phone widths before adding any further visual complexity.

## Shared activity constraints

- Unless explicitly overridden, every activity inherits the shared requirements already defined in Project shape, Shared behaviour and Visual direction.
- Every activity must work well on a phone-first layout for QR-code visitors.
- Every activity targets roughly 3 to 6 minutes to complete.
- Every activity must be re-attemptable and provide immediate feedback.
- Every main activity reveals one hidden-challenge key part on successful completion.
- Every activity page uses the shared page shell, shared status display and shared progress model.
- Shared feedback and accessibility rules apply across all activities:
    - feedback text must be easy to see and must not depend on colour alone
    - the main feedback area should use an `aria-live` region
    - motion should remain short and easy to follow
    - when users check an answer on mobile, the page should bring the feedback region into view
    - where success content can expand below the first feedback message, reserve enough vertical space for mobile scrolling without relying on delayed timing hacks
    - assembly-based activities may offer a mobile overview mode that compresses the assembly area so palette and workspace are easier to see together

## Shared interaction tooling

- For common drag-and-drop and touch interaction behaviour, prefer a reputable external library before expanding bespoke pointer-handling code.
- Keep custom code focused on puzzle-specific state, validation, feedback and rendering rather than low-level drag sensor logic.
- Current shared drag-and-drop decision:
    - Use SortableJS as the shared interaction layer for list-like and nested block assembly.
    - Keep the library vendored locally rather than loaded from a runtime CDN so the fair-site remains reliable on mobile connections.
    - Keep `public/js/assembly.js` as the project wrapper that translates SortableJS container moves into puzzle state updates.
    - Keep interact.js only as a fallback candidate if a later activity needs more free-form dropzones or snapping geometry than connected sortable containers support cleanly.
    - Do not default to Shopify Draggable or Swapy for this project.

## Activity summaries

- The activity sections below describe only activity-specific behaviour, content and implementation direction.

### Bubble sort

#### Bubble Sort purpose and learning outcome

- Introduce the idea that an algorithm is a sequence of steps that must be in the correct order.
- Reinforce three bubble sort concepts: repeated passes, pair comparison and swapping when needed.
- Keep the language approachable for the target audience defined in Project shape.

#### Bubble Sort functional requirements

- The main interaction is assembling pseudocode blocks into the correct structure using slots and sockets.
- The page must include a brief explanation of what bubble sort is trying to do before the puzzle begins.
- The page must include a short demo animation using fixed example numbers to show the desired sorting behaviour.

#### Bubble Sort page structure

- Intro section:
    - short activity title
    - one-sentence explanation of the goal
    - one or two short sentences explaining that bubble sort compares neighbouring numbers and swaps them until the list is in order
    - short note that users can drag cards or use a tap fallback if implemented
- Demo section:
    - show a fixed five-number example list before sorting
    - play a short automatic demo of the example list becoming sorted
    - use numbers that are different from the main puzzle success animation so the demo feels instructional rather than a direct answer reveal
    - make comparisons and swaps slow enough to follow comfortably on a phone screen
- Assembly section:
    - block palette or tray containing draggable code pieces
    - one main program area with a single obvious starting slot in the centre of the workspace
    - after the first piece is placed, additional slots appear relative to that placed piece, for example above it, below it, or inside it
    - loop blocks that contain sockets for their loop conditions and inner statements
    - sockets that visibly expand or shrink to fit the block placed inside them
    - nested layout that makes it obvious when one loop sits inside another loop
- Controls section:
    - Check order button
    - Reset button
    - Hint button
- Feedback section:
    - inline message area for correct or incorrect responses
    - hint area that updates without reloading the page
- Success section:
    - hidden by default
    - shown only after a correct solution
    - includes key-part reward and tropical celebration

#### Bubble Sort pseudocode content

- Use exactly seven reorderable cards.
- The seven cards must cover the concepts named in AGENTS.md:
    - initialization: `set numbers to [<random unique integers between 1 and 25>]`
    - outer loop condition: `pass from 2 to length(numbers)`
    - outer loop block: `for ...:`
    - inner loop condition: `index from 0 to length(numbers) - pass`
    - inner loop block: `for ...:`
    - comparison condition: `if numbers[index] > numbers[index + 1]:`
    - swap operation: `swap them`
- The pseudocode should stay beginner-friendly rather than aiming for language-specific accuracy.
- The activity should treat loop blocks and loop conditions as separate pieces that must be matched together.
- The visible labels should not reveal whether a loop or condition is the inner or outer one.
- Duplicate loop cards may both be visibly labelled `Loop`, and duplicate condition cards may both be visibly labelled `Condition`, while the pseudocode line itself carries the detailed meaning.
- The puzzle should visually distinguish between:
    - statement blocks
    - condition/header pieces
    - container blocks that can hold nested content
- The puzzle should allow structurally possible but incorrect assemblies.
- Examples of allowed incorrect assemblies:
    - placing the initialization statement inside a loop body
    - placing the outer and inner loop blocks one after the other at the same level instead of nesting them
- Only impossible attachment types should be blocked, for example attaching a loop condition into a statement body slot.
- The list of numbers to be sorted should be six random and unique integers between 1 and 25 inclusive, generated on page load.
- Recommended piece set, in correct assembled structure:
    1. `set numbers to [7, 3, 10, 5, 2, 6]`
    2. `loop`
    3. `for pass from 2 to length(numbers):`
    4. `loop (inner)`
    5. `for index from 0 to length(numbers) - pass:`
    6. `if numbers[index] > numbers[index + 1]:`
    7. `swap them`
- Correct structure for those pieces:
    - the initialization statement is first at the top level
    - the outer loop block comes next
    - the outer loop condition is attached to the outer loop block header socket
    - inside the outer loop, `set swapped to false` appears before the inner loop block
    - the inner loop condition `for index from 0 to length(numbers) - pass` is attached to the inner loop block header socket
    - the compare-and-swap statement is nested inside the inner loop block body
- The final statement intentionally combines comparison, swap and swap-flag update to keep the total piece count manageable while still leaving the inner loop condition as a separate piece.

#### Bubble Sort interaction behaviour

- Cards should be shuffled on page load.
- The initial order must never start already solved.
- Preferred implementation direction:
    - prefer a library-backed drag system over bespoke pointer tracking
    - model the palette, top-level sequence and nested sockets as connected SortableJS containers
    - if a later activity outgrows sortable-container behaviour, evaluate interact.js only for that narrower case
    - show one central starting slot before dragging begins
    - generate further available slots and sockets relative to pieces that are already placed
    - while dragging, preview the current valid destination clearly
    - snapping or insertion should not require pixel-perfect placement
    - allow wrong-but-structurally-possible placements, so users can build an incorrect program shape and then check it
    - restrict only attachment types that are structurally impossible, for example a loop condition may snap only into a loop header socket
    - make container sockets expand to fit the nested block placed inside them, then collapse again when emptied
    - when one loop is placed inside another, expand the parent body area so the nesting remains readable on a phone screen
    - animate movement and resizing lightly so the structural change is clear
- If drag behaviour becomes unreliable on mobile, provide a tap fallback in the same slice or immediately after:
    - first tap selects a piece
    - second tap selects a valid target slot or socket
    - the piece moves into that location

#### Bubble Sort validation rules

- The activity is correct only when all pieces are present in the correct top-level order and all nested sockets contain the correct matching pieces.
- The activity should not prevent a wrong solution from being assembled if the structure is still mechanically valid.
- Validation is triggered by the Check order button, not continuously during dragging.
- On incorrect attempts:
    - do not auto-correct the order
    - keep the current assembled structure on screen
    - show a clear error message and one useful hint
- On correct attempts:
    - show a success message
    - mark the activity complete in shared progress
    - reveal the key-part reward
    - play the sorting animation

#### Bubble Sort hint behaviour

- Hints should guide without solving the whole puzzle immediately.
- Use staged hints tied to the number of failed checks in the current attempt.
- Hints should also respond to what the learner has already placed correctly or incorrectly.
- Prefer nudges that preserve the puzzle, for example:
    - the setup step usually comes before the repeated work
    - loops can go inside other loops
    - each loop needs a condition
- Recommended hint progression:
    1. remind the user that setup comes before loops
    2. remind the user that one loop may need to sit inside another loop
    3. remind the user that swapping only happens after a comparison
- The Hint button may either reveal the next hint directly or repeat the most relevant hint for the current failure stage.

#### Bubble Sort success feedback and reward

- After a correct solution, the page should animate the sample number list being sorted.
- The animation does not need to simulate every internal detail perfectly, but it should visibly show comparisons and swaps across a few steps.
- Keep the success animation short, around 2 to 4 seconds.
- After or alongside the animation, show:
    - a tropical success message
    - the activity key part for the hidden challenge
    - a replay option for the animation if it is simple to provide
- The success state should be visually bold and celebratory, with overlay-style animation that does not push the surrounding layout around.
- A simple tropical reward is sufficient for the first full implementation:
    - animated parrot
    - blooming flower
    - celebratory badge or sticker

#### Bubble Sort state and progress requirements

- Recommended integration:
    - call `window.summerFairApp.setCompleted("bubble-sort", true)` on success
    - call `window.summerFairApp.setCompleted("bubble-sort", false)` when the activity is reset for a full re-attempt
- The activity-specific page may also store temporary state locally in memory during the session, such as:
    - current card order
    - failed attempt count
    - current hint level

#### Bubble Sort accessibility and usability requirements

- If drag is implemented, the draggable affordance must be visually obvious.
- Empty slots and sockets must remain visibly distinct from filled ones.
- Expanding sockets must resize smoothly enough that users can track where nested pieces have gone.
- Any fallback non-drag interaction should use real buttons or clearly tappable controls.

#### Bubble Sort implementation direction

- Put the activity-specific data and logic in a dedicated script file for this page rather than expanding app.js with page-specific interaction code.
- Prefer the shared library wrapper and adapter layer for drag behaviour rather than wiring raw drag events directly inside each activity script.
- Preserve the current Bubble Sort responsive approach:
    - keep the main activity sections full width with Check Your Thinking below Build The Program
    - let the header remain single-column until the shared `1024px` desktop breakpoint
    - avoid reintroducing layout helper classes that add conflicting breakpoint behaviour to this page
- Suggested data structure:
    - one array of piece objects with fields such as `id`, `label`, `type`, `acceptedParentTypes` and `correctParent`
    - one layout model describing top-level slots, header sockets and body sockets, with slots created relative to currently placed pieces
    - one state object tracking which piece is currently placed in each slot or socket
    - one counter for failed attempts
- Suggested rendering approach:
    - render the palette separately from the program assembly area
    - render one central starting slot for the first placement
    - render loop blocks as containers with dedicated header and body sockets
    - create new sibling or nested slots only when the current placed structure makes them available
    - recalculate slot and socket dimensions after each move so nested pieces fit naturally
    - rerender or reposition DOM nodes after each move
    - keep feedback and status updates in small dedicated functions
- Suggested animation approach:
    - use one short instructional demo animation near the top of the page with five fixed numbers, for example `[7, 3, 6, 2, 5]`
    - render the example numbers as shell-like DOM chips or tiles
    - step through a predefined sequence of comparisons and swaps using timed class changes, with swaps held longer than comparison highlights
    - when swap animation is shown, prefer visible shell movement between positions rather than highlight-only swap feedback
    - keep the instructional demo separate from the success animation so the page teaches the idea before the user solves the puzzle
    - avoid canvas or heavy libraries

#### Bubble Sort acceptance criteria

- Users can assemble all seven pieces into a structured program.
- Check order correctly distinguishes solved and unsolved assemblies.
- Incorrect attempts provide feedback and a hint without resetting the puzzle.
- The success state reveals the key part and a tropical reward.
- Reset returns the activity to an unsolved state and updates shared progress accordingly.

### Algorithm maze

#### Maze purpose and learning outcome

- Introduce the idea that an algorithm can control movement through a maze using sequence, repetition and selection.
- Reinforce three computational thinking ideas: ordered instructions, loops for repeated movement and conditional choices for forks in the path.
- Keep the task readable and quick to play while using a similar block-assembly interaction to Bubble Sort.

#### Algorithm Maze functional requirements

- The activity must present a visible maze and a movable explorer marker.
- The main interaction is assembling a short block-based program that can solve the maze.
- The program must include:
    - one or more loop blocks with separate choosable loop conditions
    - one or more selection blocks with separate choosable selection conditions
    - a number of movement operation blocks including forward, turn left and turn right
- The activity should preserve learner-entered loop counts as part of the problem solving rather than hard-coding every repeat count.
- The activity may accept more than one correct program when those programs genuinely solve the maze.
- The activity should encourage users to look for a shorter solution after they find a longer working one.
- The page must include a brief explanation of how the maze program controls the explorer.

#### Maze page structure

- Intro section:
    - short activity title
    - one-sentence explanation of the goal
    - one or two short sentences explaining that the explorer follows the program exactly as written
- Demo section:
    - show a short fixed demonstration of a tiny example route using simple movement blocks
    - use a different route from the real puzzle so the demo teaches the idea without revealing the answer
    - keep the demo short enough that users can watch it once and continue quickly
- Maze section:
    - visible maze map with start and finish clearly marked
    - explorer marker showing the current position or simulated run position
    - tropical route styling so paths feel like island trails rather than abstract lines
- Assembly section:
    - block palette or tray containing draggable code pieces
    - one main program area with a single obvious starting slot in the centre of the workspace
    - after the first piece is placed, additional slots appear relative to that placed piece, for example below it or inside a container block
    - loop blocks that contain a header socket for a loop condition and a body socket for nested commands
    - selection blocks that contain a header socket for the selection condition and body sockets for outcomes
    - sockets that visibly expand or shrink to fit the blocks placed inside them
- Controls section:
    - Run program button
    - Check solution button
    - Reset button
    - Hint button
- Feedback section:
    - inline message area for correct or incorrect responses
    - hint area that updates without reloading the page
- Success section:
    - hidden by default
    - shown only after a correct solution
    - includes key-part reward and tropical celebration

#### Maze content definition

- Use one fixed maze layout based on the agreed sketch for the current implementation.
- The maze should be small enough to fit on a phone screen without requiring precise zooming.
- The agreed maze shape for this slice is:
    - start at the lower-left corner facing east
    - a short eastward approach from start, then a turn north
    - a left-hand lower square path section
    - a central vertical spine running upward toward the finish
    - a right-hand lower square path section that makes an alternative turn possible
    - a short top-right spur
    - finish at the upper-left end of the top path
- The route should support at least two valid program strategies:
    - a longer strategy using counted loops plus a repeat-until-finish loop
    - a shorter strategy using a repeat-until-finish loop with nested if/else branching
- The intended puzzle should still clearly reward:
    - treating each `move forward` as one grid space rather than jumping to the next junction
    - repeated forward movement represented by loops
    - conditional turning at meaningful junctions
    - choosing loop counts by reasoning about the route rather than by guessing
    - choosing between a merely working solution and a shorter working solution
- The maze should feel like a tropical island path, for example with sand, stepping stones, palms, rocks or shallow water.
- The program piece set should be constrained and finite rather than free-form.
- Recommended piece categories:
    - loop block containers, with enough availability for more than one loop in a working program
    - counted-loop condition pieces that accept learner-entered numbers
    - a repeat-until-finish condition piece
    - value pieces that slot into counted-loop headers and hold learner-entered loop counts
    - selection block containers, with enough availability for a nested else-if alternative
    - condition pieces such as `if there is a path to the left` and `if there is a path to the right`
    - movement operation blocks, including several forward blocks plus turn left and turn right blocks
- Recommended example movement wording:
    - `move forward`
    - `turn left`
    - `turn right`
- Recommended example condition wording:
    - loop header: `repeat _ times`
    - repeat value piece: learner enters a number such as `2`
    - alternate loop header: `repeat until finish`
    - selection conditions: `if there is a path to the left` and `if there is a path to the right`
- For this slice, do not introduce free-form while-condition text entry. Keep loop and branch conditions as fixed pieces, with numeric entry only for counted repeats.
- The exact number of movement blocks should be chosen so the correct route can be assembled without unnecessary spare pieces overwhelming the user.

#### Algorithm Maze interaction behaviour

- Pieces should be shuffled or mixed in the palette on page load.
- The initial workspace must never start already solved.
- Preferred implementation direction:
    - use Pointer Events for drag interaction so one system covers touch and mouse
    - show one central starting slot before dragging begins
    - generate further available slots and sockets relative to pieces that are already placed
    - while dragging, detect the nearest valid slot or socket and preview that destination clearly
    - when the user releases a piece, snap it to the nearest valid location rather than requiring pixel-perfect placement
    - allow wrong-but-structurally-possible placements, so users can build an incorrect program and then test it
    - restrict only attachment types that are structurally impossible, for example a condition piece may snap only into the correct kind of header socket
    - make container sockets expand to fit the nested blocks placed inside them, then collapse again when emptied
    - animate movement and resizing lightly so the structural change is clear
- Given the larger maze palette and the amount of vertical scrolling on phones, the next maze UX slice should add a tap-to-move fallback alongside drag:
    - first tap selects a piece
    - second tap selects a valid target slot or socket
    - the piece moves into that location
    - valid targets should be highlighted while a piece is selected
    - the selected state should be easy to clear without accidental moves

#### Algorithm Maze validation rules

- The activity is correct when the assembled program moves the explorer from start to finish correctly without breaking the maze rules.
- The validator should support more than one accepted solution shape when those solutions are intentionally designed into the puzzle.
- The validator should distinguish between:
    - a working longer solution
    - a working shortest solution
    - a non-working solution
- The activity should not prevent a wrong solution from being assembled if the structure is still mechanically valid.
- Validation is triggered by the Run program button or Check solution button, not continuously during dragging.
- When users press Check solution, the page should bring the maze run back into view before the animation plays so the route, feedback and celebration stay close together on mobile.
- Maze display containers should stay full width, while the actual maze graphic inside each container may use a smaller capped width chosen to keep path thickness visually consistent.
- The maze container height should grow from the maze graphic it contains, plus padding, rather than forcing the graphic to scale up just because the outer container is wider.
- The blue/yellow outer maze card and the inner scenic maze background should be treated as separate layers:
    - the outer card provides the visible frame or border
    - the inner scenic green/yellow scene scales to the maze area inside that frame
    - the maze SVG and explorer sit above the scenic scene layer
- For the maze page specifically, if run-focus layout is used, move only the feedback/results subsection near the maze; keep the check/reset/hint buttons in their normal control area.
- On incorrect attempts:
    - keep the current assembled structure on screen
    - animate the explorer following the wrong program briefly, then stop where the logic fails or where the wrong turn becomes obvious
    - show an encouraging correction message and one useful hint
- On correct attempts:
    - run the full maze animation from start to finish
    - show a success message
    - mark the activity complete in shared progress
    - reveal the key-part reward
- Planned run-focus layout improvement for a later slice:
    - while the program is running, the workspace column should temporarily shrink and float up to the left of the maze area so users can watch both the code and the explorer together
    - when the run finishes, the workspace should return to its normal size and position
- When a user finds a longer working solution first, the feedback should invite them to try for the shortest code solution.
- When a user finds the shortest intended solution, the feedback should acknowledge that more strongly.

#### Algorithm Maze hint behaviour

- Hints should guide without revealing the entire final program immediately.
- Use staged hints tied to the number of failed checks in the current attempt.
- Recommended hint progression:
    1. remind the user to look for repeated movement patterns that can use a counted loop
    2. remind the user that the maze can also be solved by continuing until the finish and reacting to left or right paths
    3. remind the user that a working solution is not always the shortest one
- The Hint button may either reveal the next hint directly or repeat the most relevant hint for the current failure stage.

#### Algorithm Maze success feedback and reward

- When the correct program reaches the finish, play a short celebratory animation.
- The celebration can be simple, for example:
    - a parrot appearing near the goal
    - a treasure chest opening
    - tropical leaves or flowers popping around the finish
- Show a success message and reveal the activity key part for the hidden challenge.
- Provide a replay or reset option so the user can try again.

#### Algorithm Maze state and progress requirements

- Recommended integration:
    - call `window.summerFairApp.setCompleted("algorithm-maze", true)` when the maze is completed
    - call `window.summerFairApp.setCompleted("algorithm-maze", false)` when the activity is fully reset for a new attempt
- Activity-local state may include:
    - current arrangement of pieces in slots and sockets
    - current explorer position during a run
    - number of wrong attempts
    - current hint level

#### Algorithm Maze accessibility and usability requirements

- The current explorer position must be visually obvious.
- Empty slots and sockets must remain visibly distinct from filled ones.
- Expanding sockets must resize smoothly enough that users can track where nested pieces have gone.
- If motion is reduced or disabled later, the maze state should still remain understandable.

#### Algorithm Maze implementation direction

- Put the activity-specific data and logic in a dedicated script file for this page rather than expanding app.js with page-specific interaction code.
- Suggested data structure:
    - one maze definition object containing start orientation, path geometry, start point and finish point
    - one array of piece objects with fields such as `id`, `label`, `type`, `acceptedParentTypes` and `correctParent`
    - one layout model describing top-level slots, header sockets and body sockets, with slots created relative to currently placed pieces
    - one state object tracking which piece is currently placed in each slot or socket
    - one small value-state model for learner-editable numeric blocks used by counted loop conditions
    - one run simulator that can interpret assembled control flow against the maze, including counted loops, repeat-until-finish loops and nested selection blocks
    - one counter for failed attempts
- Suggested rendering approach:
    - render the maze as HTML elements or simple SVG rather than canvas for easier layout and styling
    - render demo command blocks as a stacked list and highlight the current command while the demo runs
    - render the palette separately from the program assembly area
    - render one central starting slot for the first placement
    - render loop and selection blocks as containers with dedicated header and body sockets
    - render the repeat-value block with a small inline numeric input so the learner can set the repeat count after placing it in the loop condition header
    - create new sibling or nested slots only when the current placed structure makes them available
    - recalculate slot and socket dimensions after each move so nested pieces fit naturally
    - rerender or reposition DOM nodes after each move
    - keep feedback and status updates in small dedicated functions
- Suggested maze logic approach:
    - define the route explicitly for the agreed sketch rather than computing general pathfinding
    - interpret the assembled blocks as control flow rather than flattening everything into one fixed expected program shape
    - stop the run early when the explorer hits a wall, leaves the intended path or reaches an impossible step
    - keep the number of pieces small enough that the puzzle remains legible on a phone while still allowing the intended alternative solutions

#### Algorithm Maze acceptance criteria

- Users can assemble a short maze-solving program with block pieces in a phone-friendly interface.
- The available pieces include a loop block with a separate loop condition, a selection block with a separate selection condition, and forward, turn left and turn right operations.
- Wrong-but-structurally-valid programs can still be assembled.
- Running or checking the program shows whether the explorer reaches the finish.
- Incorrect attempts provide feedback and a hint without resetting the whole activity.
- The success state reveals the key part and a tropical reward.
- Reset returns the activity to an unsolved state and updates shared progress accordingly.
- Correct completion updates shared progress immediately.
- The success state reveals the key part and a tropical reward.
- Reset returns the activity to its initial unsolved state and updates shared progress accordingly.

### Code prediction

- Users read pseudocode and enter the predicted output.
- Variable values change between attempts or page loads.
- Correct completion reveals one part of the hidden challenge key.

### Debugging challenge

- Users inspect broken pseudocode and correct the logic.
- Variants change slightly between attempts or refreshes.
- Correct completion reveals one part of the hidden challenge key.

### Hidden challenge

- Unlocks only when all four main activities are complete.
- Entry point remains visible but locked before unlock.
- Completion ends with a congratulatory message and a Software Development course recommendation.

## Slice 1 implementation boundary

- Shared scaffold only.
- No full challenge logic yet.
- Placeholder content is acceptable on activity pages for this slice.

## Open detail to confirm later

- Final course information URL for the hidden challenge ending.
