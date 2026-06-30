# Blockly Migration Plan

Use the current Summer Fair / open-day block activities as the migration test ground for a broader educational activity system. Treat Blockly as an editor-substrate candidate for block-based programming inside reusable lesson/challenge sets, not as a replacement for the lesson shell, simulation, hinting, feedback, persistence, or progression layers.

## Summary

- Preserve the current constrained puzzle UX from `blocks_UX_spec.md` unless a Blockly-backed mode demonstrably improves it.
- The Summer Fair activities are now mostly a practical test group for the Blockly migration rather than the whole product destination.
- Plan for a likely hybrid outcome:
    - `blockly` mode for exploratory and open composition lessons
    - `blockly-to-text` mode for Python-focused syntax teaching
    - `assembly` mode for constrained rearrangement or structure-first lessons
- The current editor gap is not basic block placement. It is the lack of a broader runtime for variables, booleans, functions, I/O, simulation, and learner experimentation.

## Preserve

Any migration must preserve:

- drag-and-drop plus tap-to-place
- bbox-led nearest-target resolution
- replacement priority for occupied single sockets under overlap / near-overlap rules
- structurally constrained but answer-open program construction
- snapshot / restore persistence
- mobile-friendly lesson-shell embedding with prompt, hints, feedback, and success flow
- run-view / execution highlighting integration
- support for both guided construction and rearrangement modes

## Ownership split

Blockly should own:

- block authoring surface
- workspace / block serialization
- palette or toolbox model
- code generation where useful

Blockly should not automatically own:

- lesson shell layout
- puzzle validation
- simulation runtime
- adaptive hints
- scoring / progression
- run-focus / stage transitions
- puzzle-specific world state

## Reliable takeaways

Useful conclusions:

- Blockly is better suited than the current custom editor for exploratory, open-ended program building.
- Mobile integration will still require explicit work around toolbox real estate, lesson layout, and gestures.
- The biggest long-term gap is the runtime / simulation layer, not the editor alone.
- Blockly does not remove the need for a lesson shell and puzzle adapter architecture.

Paths to treat cautiously unless verified:

- claims that Blockly is inherently poor at serialization or headless workflows
- claims that generators are tightly coupled to a visible SVG workspace
- assumptions that a few config flags will solve mobile placement forgiveness
- assumptions that default background gesture behavior will fit the current page-embedded mobile UX
- assumptions that custom shell geometry will be easy to reproduce through theming alone

## Architecture target

- **Lesson shell**: title, prompt, reading/demo sections, hints, feedback, run/test controls, navigation, optional puzzle visualization
- **Editor mode adapter**: `blockly`, `blockly-to-text`, and `assembly`
- **Runtime / simulator adapter**: execution semantics, trace events, environment state, I/O binding, grading hooks
- **Persistence layer**: workspace snapshots, lesson state, stage save/restore, partial progress

## Recommended stack

### Primary recommendation

- **Editor**: Blockly for exploratory / open composition mode
- **Teaching bridge**: add `blockly-to-text` where learners should see synchronized Python-like output as they build
- **Constrained editor**: keep `assembly` mode for rearrangement-first or tightly guided tasks unless a Blockly variant clearly proves better
- **Runtime**: shared IR / AST with a JavaScript-first execution path
- **JavaScript sandbox**: JS-Interpreter
- **Python path**: add Python generation later, with Skulpt as the first likely in-browser runtime
- **Graphics / interaction layer**:
    - SVG.js for lightweight SVG scenes, shell work, diagrams, and vector feedback
    - Konva for richer 2D puzzle worlds or moderate game-like lessons
    - PixiJS only when higher-performance graphics justify a heavier stack

Pros:

- preserves the proven mobile lesson shell and constrained puzzle UX
- gives a realistic path to open-ended coding without rebuilding an editor from scratch
- supports a syntax-learning path where blocks and readable text can coexist
- keeps rearrangement mode available if Blockly proves awkward there
- supports a shared runtime layer instead of many one-off simulators

Cons:

- still requires a shared runtime / simulator layer to be built
- hybrid editor support adds product and maintenance complexity
- Blockly still needs custom mobile hosting and toolbox work
- Python remains a later execution target, not a free first-step capability

### Option matrix

#### Option A. Blockly + shared IR + JS-Interpreter + SVG.js / Konva

Best fit for:

- the broadest learning-platform direction
- open composition plus puzzle embedding
- controlled tracing and interactive worlds

Strengths:

- strong editor substrate
- sandboxed JS execution path
- flexible visual world options
- cleanest path to a reusable lesson runtime

Tradeoff:

- most architecture work up front

#### Option B. Blockly + generated JS only + browser execution wrappers

Best fit for:

- very early experimentation where sandboxing is not yet finalised

Strengths:

- lower initial complexity

Tradeoff:

- weaker safety, tracing, and grading story

#### Option C. Blockly + Python generation later + Skulpt

Best fit for:

- a Python-heavy teaching path that still needs browser-only execution

Strengths:

- better long-term alignment with Python teaching

Tradeoff:

- second backend/runtime increases complexity

#### Option E. Blockly-to-text teaching mode

Best fit for:

- Python-heavy teaching where syntax learning matters as much as executable behaviour

Strengths:

- helps learners connect blocks to readable text output in real time
- supports gradual transition from blocks to text

Tradeoff:

- still needs either a runtime target or a separate execution mode when code must run faithfully

#### Option D. Stay fully custom

Best fit for:

- constrained puzzle UX only

Strengths:

- maximal mobile and shell control

Tradeoff:

- weak path to broader exploratory programming

### Translation strategy

Recommended order:

1. Define one shared IR / AST for block programs.
2. Generate JavaScript from that IR first.
3. Run JavaScript in a sandboxed interpreter for tracing and grading.
4. Add Python generation later from the same IR when the lesson set justifies it.

Why this order:

- one semantics model
- one lesson shell
- one trace / grading contract
- Python becomes a second backend, not a second platform

For a Python-heavy course this means:

- use Blockly or assembly-backed lessons now
- add a dedicated `blockly-to-text` mode where the text view is part of the lesson UX, not just an export
- keep Python as an eventual code-generation and execution target
- do not let Python runtime support block the first migration spike

## Staged plan

### Current agreed scope for Stages 0-2

The currently agreed near-term scope is deliberately narrower than the full migration plan.

Focus now on:

- Blockly as the block editor substrate
- theme and visual integration
- compact block vocabulary and horizontal density
- mobile drag-and-drop behaviour
- click / tap-to-place behaviour
- nearest-match placement behaviour
- integration with the existing Summer Fair puzzle shell and puzzle logic

Defer for now:

- shared runtime extraction beyond what is needed to host the spike
- Python execution runtime
- final decision on Blockly for rearrangement mode
- broad shell-geometry migration into Blockly blocks
- replacement of all custom editor modes

### Stage 0. Freeze the current contract

- Keep `blocks_UX_spec.md` as the detailed editor UX contract.
- Keep `challenge_spec.md` as the broader lesson/product source.
- Continue logging shared assembly decisions in `checkpoint_assembly.md`.
- Start logging Blockly-specific migration work in `blockly_checkpoint.md`.
- Exit when target-resolution, tap-to-place, and run-view expectations are precise enough to evaluate any Blockly spike against them.

### Stage 1. Build an isolated Blockly spike

- One prototype page.
- One small curated block set.
- No full lesson migration yet.
- Check:
    - page-embedded Blockly workspace inside a reading / hint / feedback shell
    - mobile viewport sizing and `svgResize` lifecycle handling
    - toolbox behavior on phone-sized screens
    - explicit comparison against the current UX contract
    - ability to approximate or preserve the current drag, tap-to-place, and nearest-match behaviour
    - ability to make stable teaching blocks much more horizontally compact through concise syntax and custom block definitions
- Exit with a clear pass/fail on whether Blockly can coexist with the lesson-shell model.

### Stage 2. Define a mobile-first Blockly host pattern

- Decide whether the toolbox stays stock, becomes modal, or becomes a custom launcher.
- Decide whether background panning is allowed in page-embedded mode.
- Decide how tap-to-place should be approximated or layered on top.
- Decide how the host handles scroll-into-view and stage transitions.
- Keep the lesson page in charge of visibility, scrolling, and stage layout.
- Keep Blockly focused on editor concerns; preserve the current puzzle shell and puzzle logic outside the editor.

### Stage 3. Migrate Bubble Sort first

Why first:

- simpler simulator than Maze
- already structurally constrained
- good test for nested containers, conditions, and trace highlighting

Success criteria:

- preserve puzzle shell, hints, demo, and success flow
- reproduce the structural constraints with Blockly or a Blockly-backed hybrid
- use compact teaching syntax where needed, for example `swap_items(list, i, j)`, `list[i] > list[j]`, `[a, b, c]`, `set list`, and `length(list)` rather than wide stock Blockly wording
- hide counted-loop increment inputs when the default step of `1` or `-1` is sufficient
- confirm users can still solve it comfortably on phones
- confirm trace / run experience is at least as readable as the current version

### Stage 4. Migrate Algorithm Maze only if Stage 3 justifies it

- Preserve puzzle shell and puzzle board.
- Test nested control structures and value blocks.
- Decide whether Blockly improves or worsens the current mobile feel.
- Exit either with a clean migration path or a deliberate hybrid decision where Maze stays custom.

### Stage 5. Extract a shared runtime layer

Needed capabilities:

- normalized AST / IR from the editor workspace
- runtime state for variables, lists, booleans, and control flow
- trace events per step
- environment hooks for input/output and world-state mutation
- puzzle-specific grading adapters

Exit when new activities no longer need one-off interpreters.

### Stage 6. Add explicit rearrangement mode support

- Support hidden/disabled palette when needed.
- Support seeded workspaces with all blocks already present.
- Support reorder / restructure puzzles.
- Support code-fragment tasks such as Python ordering if required.
- Do not force Blockly to replace the custom assembly mode here if the UX gets worse.

### Stage 7. Expand into learning-platform scenarios

Potential outcomes:

- Blockly-backed exploratory lessons
- Blockly-to-text Python lessons
- custom rearrangement or structure puzzles
- Learning Hut progression paths
- shared runtime-backed mini-games or interactive program lessons

## Libraries to consider

### Editor substrate

- Blockly v13
    - docs: [docs.blockly.com](https://docs.blockly.com/)
    - best fit: exploratory / open composition mode
    - main caution: mobile toolbox UX, custom shell geometry, and preserving current constrained placement UX

### JavaScript runtime / sandbox

- JS-Interpreter
    - repo: [NeilFraser/JS-Interpreter](https://github.com/NeilFraser/JS-Interpreter)
    - docs: [JS-Interpreter docs](https://neil.fraser.name/software/JS-Interpreter/docs.html)
    - use for: sandboxed JavaScript execution, step tracing, controlled lesson runtime
    - caution: ES5-oriented

### Python runtime

- Skulpt
    - site: [skulpt.org](https://skulpt.org/)
    - docs: [Skulpt docs](https://skulpt.org/docs/index.html)
    - use for: browser-native Python learning activities
    - caution: not full CPython fidelity

- Pyodide
    - site: [pyodide.org](https://pyodide.org/)
    - use for: higher-fidelity Python when heavier runtime cost is acceptable
    - caution: probably too heavy for many mobile-first lesson pages

### SVG scene / shell / diagram work

- SVG.js
    - docs: [SVG.js docs](https://svgjs.dev/docs/3.2/)
    - use for: shell rendering, SVG puzzle worlds, interactive vector feedback
    - caution: runtime and interaction design still stay app-owned

### Canvas scene / lightweight game worlds

- Konva
    - docs: [Konva docs](https://konvajs.org/docs/index.html)
    - API: [Konva API](https://konvajs.org/api/Konva.html)
    - use for: 2D puzzle worlds, touch-friendly visual feedback, moderate game-like lessons

### Higher-performance 2D graphics

- PixiJS
    - docs: [PixiJS getting started](https://pixijs.com/8.x/guides/getting-started/intro)
    - use for: animation-heavy interactive lessons or simple games
    - caution: larger and more engine-like than many teaching tasks need

## I/O and environment guidance

Define a lesson-environment adapter with explicit hooks for:

- click / tap input
- keyboard input
- text output
- variable display
- DOM updates
- SVG updates
- canvas updates
- animation / timing callbacks

Avoid unrestricted learner code mutating arbitrary DOM directly.

Prefer a constrained bridge such as:

- `env.output(text)`
- `env.setVar(name, value)`
- `env.onTap(targetId, handler)`
- `env.moveSprite(id, x, y)`
- `env.setElementText(id, text)`

## Paths to avoid

- replacing everything with Blockly immediately
- coupling grading only to generated code strings when a structured execution model is possible
- assuming the default Blockly toolbox/flyout is sufficient for phone-first lesson flows
- forcing rearrangement-only challenges into Blockly if the UX is worse than the custom editor
- treating custom block-shell geometry as a first migration priority before workflow fit is proven
- letting lesson pages depend on unrestricted DOM mutation from learner programs
- mixing runtime design, editor migration, and shell experimentation into one unbounded slice

## Immediate next step

1. Treat `blocks_UX_spec.md` as the acceptance contract.
2. Build a minimal Blockly-hosted spike inside the current lesson-shell model.
3. Validate Bubble Sort as the first real migration candidate.
4. In parallel, sketch the shared runtime layer for JavaScript and, if needed later, Python.
5. Decide whether rearrangement mode stays custom or becomes a second Blockly-backed mode only after the spike proves its value.
