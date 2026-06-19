# for visual UI adjustments and layout refinements

- ornament positioning and sizing should be px or % not rem based.
- ornaments should be positionable in % of their size, so that they can be placed in the same relative position on different sized screens. to achieve this they may need to be wrapped in a container that is sized to intended ornament size (different for different ornaments), and then the ornament positioned inside that container.
- ornament positions relative to the window corners should be the same on different screen sizes. e.g. if half the parrot is cropped on a small screen, then half the parrot should still be cropped on a large screen too, even if the parrot is scaled differently. this may require the ornament wrapper to be positioned relative to the window, if not already.
