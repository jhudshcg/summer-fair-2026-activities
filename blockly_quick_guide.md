# Blockly Quick Guide

Condensed repo-specific notes for manual Blockly integration work in this project.

Use this alongside `blocks_UX_spec.md`, `blockly_migration_plan.md`, and `blockly_checkpoint.md`.

## What Blockly should own here

- block authoring surface
- workspace state and serialization
- toolbox / flyout model
- optional code generation

Keep these outside Blockly:

- lesson shell layout
- puzzle validation and grading
- hints, feedback, progression, unlocks
- run-focus / stage transitions
- puzzle simulation runtime

## Current spike files

- `public/prototype_tests/blockly-spike.html`
- `public/js/blockly-spike.js`
- `public/css/blockly-spike.css`

Theme/customization files:

- `public/js/blockly-theme/tokens.js`
- `public/js/blockly-theme/summer-fair-theme.js`
- `public/js/blockly-theme/block-customizations.js`

These are the safest files to mutate first.

## How the current theming was achieved

The spike now uses a three-layer setup rather than one large theme function.

### 1. Raw tokens

`public/js/blockly-theme/tokens.js` holds stable named values:

- category colours
- Blockly block style colour groups
- Blockly component colours
- font settings

Keep raw colour and type values here so experiments do not spill into puzzle code.

### 2. Theme builder

`public/js/blockly-theme/summer-fair-theme.js` reads those tokens and builds the Blockly theme object.

Current job:

- call `Blockly.Theme.defineTheme(...)`
- return a theme object for `Blockly.inject(...)`
- expose category colours separately so the toolbox XML can stay simple

This is the file to edit when you want to change the Blockly-owned visual language without changing behavior.

### 3. Block and layout customizations

`public/js/blockly-theme/block-customizations.js` is for behavior-adjacent presentation work that is not just palette colours.

Current job:

- register the custom Bubble Sort helper blocks
- register JS/Python generators for those blocks
- patch `lists_create_with` so its inputs display inline with comma separators

This separation matters because not everything that feels like “theme work” belongs in `Theme.defineTheme(...)`.

Good rule:

- colours, fonts, Blockly component surfaces: theme/tokens
- block structure, inline input formatting, custom block definitions: customization layer

### Load order

The spike page now loads assets in this order:

1. Blockly core and generators
2. theme tokens
3. theme builder
4. block customizations
5. spike integration script

That order is important because the spike script expects `window.summerFairBlocklyTheme` and `window.summerFairBlocklyCustomizations` to already exist.

### How the spike consumes the theme

In `public/js/blockly-spike.js`:

- `getThemeApi()` asks `window.summerFairBlocklyTheme` for a theme object
- `applyToolboxCategoryColours(...)` copies category colours into the toolbox XML before injection
- `window.summerFairBlocklyCustomizations.register(...)` patches built-in list blocks and registers custom blocks/generators before the seeded workspace is loaded

### Why the inline-list patch lives outside the theme builder

The horizontal comma-separated list formatting is not a normal Blockly theme setting.

It required patching the built-in `lists_create_with` block definition so that:

- inputs stay inline with `setInputsInline(true)`
- separators are added as fields on the list item inputs

That is a block-definition customization, not a palette/colour theme change, so it belongs in `block-customizations.js`.

### Why the last comma was missing before the fix

The first version added commas as trailing fields on the previous item input.

That made the separator between `5` and `1` fragile because it sat at the far end of the `5` input, where Blockly's input spacing and connection rendering could visually crowd or clip it.

The fix was to add commas as leading separators on each item after the first instead.

That is more robust because each comma now belongs to the next visible item, not to the tail edge of the previous one.

## Load pattern

For script-tag prototyping, use the compressed bundle set together.

```html
<script src="https://unpkg.com/blockly@13.0.0/blockly_compressed.js" defer></script>
<script src="https://unpkg.com/blockly@13.0.0/blocks_compressed.js" defer></script>
<script src="https://unpkg.com/blockly@13.0.0/javascript_compressed.js" defer></script>
<script src="https://unpkg.com/blockly@13.0.0/python_compressed.js" defer></script>
<script src="https://unpkg.com/blockly@13.0.0/msg/en.js" defer></script>
```

Do not mix `blockly.min.js` with `blocks_compressed.js`. That causes duplicate registration errors.

With script tags, generators are not on `Blockly.JavaScript` or `Blockly.Python` here. Use:

```js
const javascriptGenerator = window.javascript?.javascriptGenerator || null;
const pythonGenerator = window.python?.pythonGenerator || null;
```

## Minimum host pattern

Blockly needs an explicit render area height. `min-height` alone is not enough.

```html
<div class="blockly-host" data-blockly-host>
  <div class="blockly-workspace" id="blockly-workspace"></div>
</div>
```

```css
.blockly-host {
  position: relative;
  height: 28rem;
  min-height: 28rem;
  overflow: hidden;
}

.blockly-workspace {
  width: 100%;
  height: 100%;
}
```

If the workspace looks blank, check the injected `.injectionDiv` height first.

## Base injection pattern

```js
const workspace = Blockly.inject(host.querySelector('#blockly-workspace'), {
  toolbox,
  theme: createTheme(),
  renderer: 'thrasos',
  move: {
    scrollbars: true,
    drag: true,
    wheel: false,
  },
  zoom: {
    controls: false,
    wheel: false,
    pinch: true,
    startScale: 0.95,
    maxScale: 1.3,
    minScale: 0.55,
    scaleSpeed: 1.08,
  },
  trashcan: true,
  sounds: false,
  collapse: false,
  comments: false,
  disable: false,
  oneBasedIndex: false,
  grid: {
    spacing: 22,
    length: 2,
    colour: 'rgba(23, 50, 51, 0.08)',
    snap: false,
  },
});
```

Good defaults for this repo:

- wheel zoom off so page scrolling stays usable
- pinch zoom on for mobile
- toolbox small and curated
- no comments, sounds, or extra editor chrome unless needed

## Resize rules

Call `Blockly.svgResize(workspace)` whenever the host size may have changed:

- window resize
- orientation change
- section expand / collapse
- tab or stage becoming visible
- run-focus transition

Useful pattern:

```js
window.addEventListener('resize', () => {
  Blockly.svgResize(workspace);
});
```

If a page section starts hidden, inject after it is visible, or inject first and force a resize after reveal.

## Theme vs CSS

Use theme config for Blockly-owned visuals.

```js
function createTheme() {
  return Blockly.Theme.defineTheme('summerFairSpike', {
    base: Blockly.Themes.Classic,
    blockStyles: {
      logic_blocks: {
        colourPrimary: '#ffb347',
        colourSecondary: '#ffd697',
        colourTertiary: '#f3b35b',
      },
    },
    componentStyles: {
      workspaceBackgroundColour: '#f7fff9',
      toolboxBackgroundColour: '#ffffff',
      toolboxForegroundColour: '#173233',
      flyoutBackgroundColour: '#ffffff',
      flyoutForegroundColour: '#173233',
      insertionMarkerColour: '#ff6f61',
      insertionMarkerOpacity: 0.28,
    },
    fontStyle: {
      family: 'Avenir Next, Gill Sans, Trebuchet MS, sans-serif',
      weight: '700',
      size: 14,
    },
    startHats: false,
  });
}
```

Use CSS for page-owned visuals:

- host border, radius, card chrome
- page spacing and shell layout
- toolbox shadow and container framing
- responsive height variables

Useful CSS targets:

```css
.blocklyToolboxDiv {}
.blocklyFlyout {}
.blocklyMainBackground {}
.blocklyScrollbarHandle {}
.blocklyDropDownDiv {}
.blocklySelected {}
```

Treat Blockly internal classes as useful but not sacred. Recheck after version bumps.

## Theming limits

Themeing is enough for:

- palette / flyout colours
- workspace background
- insertion marker colour
- block palette colour families
- editor font feel

Theming is not enough for:

- custom mobile placement rules
- lesson-shell integration
- the open-right `C` container shell shape from the current custom editor
- puzzle-specific trace UI

If you need container-shell geometry parity, expect custom block rendering or a custom overlay layer. Do not assume theme settings alone can do it.

## Serialization and seeding

Seed a workspace from XML:

```js
const starterDom = Blockly.utils.xml.textToDom(STARTER_XML);
Blockly.Xml.domToWorkspace(starterDom, workspace);
```

Common snapshot patterns:

```js
const xmlDom = Blockly.Xml.workspaceToDom(workspace);
const xmlText = Blockly.Xml.domToText(xmlDom);

workspace.clear();
Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(xmlText), workspace);
```

For this repo, keep Blockly snapshots separate from lesson progress state, then attach them through the shared page-level persistence layer.

## Useful hooks

### Change listener

Use one shared change listener and filter UI-only events.

```js
workspace.addChangeListener((event) => {
  if (event.isUiEvent) {
    return;
  }

  updateCode();
  persistWorkspace();
  updatePuzzleState();
});
```

Good uses:

- regenerate text output
- save snapshot
- update feedback text
- trigger lightweight validation

Avoid:

- heavy puzzle simulation on every drag move
- mixing progression logic directly into low-level workspace events

### Workspace queries

Useful calls:

```js
workspace.getAllBlocks(false)
workspace.clear()
workspace.getTopBlocks(true)
workspace.highlightBlock(blockId)
```

Block-level calls that are useful during manual experiments:

```js
block.getSvgRoot()
block.getBoundingRectangle()
block.outputConnection
block.previousConnection
block.nextConnection
block.inputList
```

Use these to inspect rendered geometry and available connection points while exploring placement behaviour.

## Placement reality check

Stock Blockly already gives you:

- drag-and-drop
- connection snapping
- compatible connection rules
- insertion marker visuals

Stock Blockly does not automatically give this repo's required behaviour:

- tap-to-place
- bbox-led nearest-target placement
- same-scope and cross-scope placement resolution
- replacement priority for occupied single sockets based on overlap / near-overlap

That behaviour needs an adapter layer on top of Blockly.

## Suggested placement architecture

Keep Blockly responsible for valid connections. Keep custom code responsible for candidate resolution.

Recommended flow:

1. User selects a block by tap or click.
2. Custom code decides the intended scope.
3. Gather compatible target candidates from the visible workspace.
4. Rank them using the existing `blocks_UX_spec.md` rules.
5. Connect the chosen Blockly connection pair.
6. Show a short discrete rejection message if no valid target exists.

### Candidate sources to inspect

- top-level statement insertion positions
- statement input connections inside loop / choice blocks
- value input connections for conditions and values
- currently occupied single sockets that can be replaced

### Practical ranking inputs

- target compatibility
- same scope vs other scope
- dragged block bounding box vs target bounding box
- overlap / near-overlap with existing occupant for replacement cases
- unoccupied target preference when replacement rule is not met

## Placement override sketch

Not production code, but this is the right shape:

```js
function resolvePlacement(selectedBlock, targetScope) {
  const candidates = collectCompatibleCandidates(selectedBlock, targetScope);
  const ranked = rankCandidatesByRepoRules(selectedBlock, candidates);
  return ranked[0] || null;
}

function placeResolvedCandidate(selectedBlock, resolved) {
  if (!resolved) {
    showDiscreteMessage('That block cannot go there.');
    return false;
  }

  connectBlocklyPair(selectedBlock, resolved);
  return true;
}
```

The critical point is to preserve the repo's target-priority model rather than falling back to pointer-nearest heuristics.

## Mobile-specific customizations worth testing

- narrower toolbox categories or fewer categories
- modal or launcher-based toolbox on phones
- pinch zoom on, wheel zoom off
- explicit workspace height token per breakpoint
- larger touch-safe launch controls outside the SVG
- scroll-between-taps flow for tap-to-place

Questions worth answering during manual experiments:

- does the stock flyout steal too much height on phone?
- should the toolbox stay always visible?
- does page scroll fight with workspace pan?
- do selected blocks remain obvious enough during tap-to-place?

## Useful manual override seams

These are the places most likely to matter in this repo:

- `createTheme()` in `public/js/blockly-spike.js`
- injection options passed to `Blockly.inject(...)`
- toolbox XML in `public/prototype_tests/blockly-spike.html`
- host sizing in `public/css/blockly-spike.css`
- `workspace.addChangeListener(...)` for persistence and feedback
- custom page controls outside Blockly for resize, reset, run, and mode switching

If you need deeper behaviour changes later, keep them in a thin adapter rather than scattering Blockly-specific logic through each puzzle page.

## Debug checklist

If the workspace looks blank:

- confirm the page is using `blockly_compressed.js`, not `blockly.min.js`
- confirm the host has explicit height, not just `min-height`
- confirm `.injectionDiv` height is non-zero
- call `Blockly.svgResize(workspace)`
- confirm the workspace is visible before or after injection

If generated code is empty or broken:

- confirm the generator globals exist:
    - `window.javascript?.javascriptGenerator`
    - `window.python?.pythonGenerator`
- wrap generator calls in `try` / `catch`
- confirm the toolbox includes the seeded block types

If mobile interaction feels wrong:

- disable wheel zoom
- test pinch separately from page scroll
- reduce toolbox footprint
- separate placement resolution from default drag heuristics

## Recommended manual work order

1. Adjust host sizing and mobile layout first.
2. Refine theme and toolbox presentation second.
3. Prototype tap-to-place and nearest-target resolution third.
4. Only then decide whether deeper renderer or block-shape work is worth it.

## Bottom line

Blockly is a good candidate for the editor substrate here.

The hard part is not basic block rendering. The hard part is preserving this repo's mobile lesson-shell UX and placement rules while keeping puzzle logic outside Blockly.
