# instructions

The project scope is to make a set of short, fun activities centred around computational thinking, suitable for families and their secondary age students (~12 - 15 years old) visiting a college for a few hours.

Activity completion time should be 3-6 minutes per activity/page, and involve some interpretations of concepts of computer programming and some pseudocode.

Activities should be interactive, give feedback (e.g. correct or incorrect response, hints, encouragement, etc) and be delivered through HTML5, CSS3 and modern JS.

4 activities/challenges and 1 hidden challenge, each with their own page, with an index page for navigation.

Webpages must be static and use a mobile-first design (with drag and drop functionality where appropriate). Users will access on their phones via QR code, so the design should be responsive and touch-friendly. Mobile drag and drop functionality should be implemented for activities that require it - using Touch events (touchstart, touchmove, touchend) and/or Pointer events (pointerdown, pointermove, pointerup) to support mobile devices.

Short-term browser cache can be used to support the activities (e.g. remembering progress or different solutions being found to unlock a hidden challenge, etc.), but no server-side code should be used. All code should be client-side and static.

The visual theme should be: tropical. Theme guidance: use tropical colours, images of tropical plants and animals, and a playful font. Placeholder clipart style visuals should be generated for the activities, and can be replaced with more polished visuals later. The visual theme should be consistent across all pages.

Each page should have a small status display showing the current activity and progress through the activities (e.g. "Activity 2 of 5") and how many are completed successfully. The status display should show a small icon indicating whether the user has completed the activity or not. Activities/challenges should be re-attemptable, and the status display should update accordingly.

## Activity ideas

1. Bubble sort. Code blocks are shown with parts of bubble sort algorithm, and users have to drag and drop them into the correct order. Feedback is given on whether the order is correct or not. When the code works, the input list is sorted and displayed, with an animation of the sorting process. The arrangeable code blocks should include: outer loop condition, outer loop, inner loop condition, inner loop, swap operation, initialization code. Correct code arrangement should be rewarded with a tropical-themed animation (e.g., a dancing parrot or a blooming flower). Solution should also yield part of a 'key' to unlock a hidden challenge.

2. Algorithm maze. Users are presented with a maze where they have to navigate from start to finish by choosing the correct algorithmic steps (e.g., if-else statements, loops) to reach the goal. Each correct step gives feedback and hints for the next step, while incorrect choices provide encouragement to try again. Completing the maze successfully reveals another part of the 'key' for the hidden challenge.

3. Code prediction. Users are shown a snippet of pseudo code and must predict the output of the code. They can input their answer and receive immediate feedback on whether they are correct or not. If incorrect, hints are provided to guide them towards the correct answer. Each time the page loads, new variable values are generated, so the correct output also changes. Answer should be by text entry and have enough possible values to avoid guessing being a good strategy. Successfully predicting the output will reveal another part of the 'key' for the hidden challenge.

4. Debugging challenge. Users are presented with a piece of pseudo code that contains intentional errors and a description of the expected behavior. They must identify and correct the errors to make the code run correctly. Each time the page refreshes, the code should change a little, so the corrections should also alter. Feedback is provided for each correction, and hints are available if users struggle. Successfully debugging the code will reveal the final part of the 'key' for the hidden challenge.

5. Hidden challenge. Once users have collected all parts of the 'key' from the previous activities (i.e. all previous activities are correctly solved), they can unlock a hidden/locked challenge. The link or icon for this challenge could be faded or greyed out until it is enabled. This challenge could be a more complex problem that requires them to apply the concepts they've learned in the previous activities. The hidden challenge should also provide feedback and hints, and completing it successfully could reward users with a tropical-themed animation or a congratulatory message. The hidden challenge should be designed to be slightly more difficult than the previous activities, but still achievable within a 6 minute time frame (for student who were able to solve the previous challenges). The congratulations message should include a recommendation to consider studying Software Development at the college, with a link to the relevant course information page.

### Variable activities

Where activities should change between re-attempts, the alternative version can be made from a small set of fixed possibilities, or by generating random values within a defined range. The alternative version should be functionally equivalent to the original, but with different variable values or arrangements.

## Development process

Plan, draft, implement in small stages, verify with user and iterate. Do not dive straight into coding, without clear agreement from user.

Use checkpoint.md, checkpoint_refactor.md, checkpoint_assembly.md, checkpoint_ui.md, checkpoint_puzzles.md and blockly_checkpoint.md files to track progress, plans, document decisions made during development and indicate next logical slice of work. use the refactor file for refactoring work, the puzzles file for any puzzle or challenge specific work, the ui file for ui tweaks, the assembly file for work on the shared block assembly feature used in different puzzles, and the blockly checkpoint for Blockly-specific migration planning and spike work. Use the general checkpoint file for general progress and decisions that don't fit into a more specialised checkpoint file.

Use style_guide.md as the shared CSS and layout guide for future styling work. When changing shared or puzzle CSS, prefer approaches that follow that guide rather than adding one-off layout fixes.

Use blocks_UX_spec.md as the detailed source of truth for shared block-editor UX and UI behaviour. When refactoring the custom assembly system or evaluating Blockly or other editor substrates, preserve or deliberately revise that behaviour from the spec rather than relying on memory of the current implementation.

All shared style and functionality should have a single source of truth, and be implemented in a way that allows for easy reuse across all activities. This includes CSS styles, JavaScript functions, and any other shared resources.

Where options exist for implementing a feature, discuss with the user and agree on the best approach before proceeding. Document the agreed approach in the appropriate checkpoint file. Naturally prefer the simpler and lower code solution, but avoid hacks.

Include clear code comments for functions and in all source file headers.

Use challenge_spec.md file to document the agreed detailed challenge specification, ready for implementation, and update it as needed when changes are made. This will help ensure that the implementation stays aligned with the agreed-upon requirements.

Be accurate but concise in your chat responses. Generally the more concise the better. Fewer, better chosen words are always preferred, right up to the point of risking information loss of clarity.

If you get stuck or confused, don't thrash, stop and ask for clarification or help.

## Definition of Done

- You've done your best effort to action the current agreed slice, after implementation start has been agreed.
- You will do initial testing of work and the user will verify from their own testing.
- The user is happy to stop iterating.
