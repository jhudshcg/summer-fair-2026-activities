# user feedback and observations

The following issues have been observed

inconsistent layout and css decoration across different devices, with different os, age and screen size.

on different iphones, the coconut bulletpoints are missing and ordinary bulletpoints are used instead. on android, the coconut bulletpoints are present.

## challenge level

The challenges are too difficult for the students who have tried it so far. 

There is a need for a 'learning hut'
The learning hut should provide much simpler challenges that build up basic understanding of programming concepts and logic, and usage of the assembly blocks system. There should be multiple small progressive challenges for different concepts: sequence, variables, lists and indices, selection (if else) and loops. And then another set of small progressive challenges that covers the same concepts but with the aim to take a description of a program and identify the issues with (pseudo code) presented - then to use blocks to make a program that matches the description correctly.

## assembly blocks

- closest match target location is not always closest compatible location. E.g. dragging a loop block A, already with blocks inside it, from the top level in the workspace towards the empty inside another loop block B inside the workspace,, the closest match target location is shown as the top level of the workspace, even though the inside of the loop B is closest and overlapping with the bbox of the dragged loop block. The dragged block A needs to be be exactly over the inside of block B, before that is highlighted as the active target drop zone. i.e. the current system seems to 'prefer' dropping a block at the top level, rather than the actual closest compatible match. This is a source of UX frustration and needs investigating and fixing.

- on some android phones and older iphones the assembly blocks palette and workspace are inconsistently formatted, overlapping or the blocks are rendered with more padding, making them buldge across into the right side of the screen.

### UX reflections

- the drag and drop and tap and place behaviour has got much better and the issue above remains.

- the float functionality is inconsistent across mobile devices. the placement of the float block is not always where it is expected to be, and the sizing is awkward. perhaps something like a windowed execution view would work better. the size could be consistent and the currently executing blocks would be larger and highlighted in the centre of the windowed float view. There could then be more placement options, e.g. above or below the animation of the puzzle state that is being changed by the executing blocks. For mobile screens <= 440px (logical width) the over/under placement of the windowed float view could be the default, and for larger screens the float view could be placed to the left of the puzzle state animation.

- the live code block execution highlighting is inconsistent across mobile devices. sometimes the condition blocks are all heavily highlighted at once. only the condition being currently tested should be highlighted, counting as a single time step when it is evaluated and only being highlighted for that time step.

- a filtering system for the block palette could be helpful, e.g. a row of small icons at the top of the palette that can be tapped to filter the palette to show only blocks of a certain type, e.g. variables, loops, selection, etc. This would make it easier to find the right block when there are many blocks in the palette. 

- a bounded float on a shorter (because fildered) palette column could be used to keep the palette in view while scrolling through larger workspace area programs. so a palette container within the palette column would be effectively static vertical centre aligned, but limited to stay within the palette column, which matches the height of the workspace area. This would allow the user to scroll through a larger workspace area while still having access to the palette, without having to scroll back up to the top of the palette column.
