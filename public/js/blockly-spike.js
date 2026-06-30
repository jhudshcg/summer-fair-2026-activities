/* Stage 1 Blockly spike script. */

(function initBlocklySpike() {
  const TOOLBOX_ID = 'blockly-toolbox';
  const PREVIEW_DELAYS_MS = Object.freeze({
    compare: 140,
    swap: 260,
    settle: 80,
    complete: 220,
  });
  const STARTER_XML = `
    <xml xmlns="https://developers.google.com/blockly/xml">
      <variables>
        <variable id="numbersVar">numbers</variable>
        <variable id="passVar">pass</variable>
        <variable id="indexVar">index</variable>
      </variables>
      <block type="sf_set" x="24" y="24">
        <field name="VAR" id="numbersVar">numbers</field>
        <value name="VALUE">
          <block type="sf_list_literal">
            <mutation items="6"></mutation>
            <value name="ITEM0"><block type="sf_number"><field name="NUM">7</field></block></value>
            <value name="ITEM1"><block type="sf_number"><field name="NUM">3</field></block></value>
            <value name="ITEM2"><block type="sf_number"><field name="NUM">6</field></block></value>
            <value name="ITEM3"><block type="sf_number"><field name="NUM">2</field></block></value>
            <value name="ITEM4"><block type="sf_number"><field name="NUM">5</field></block></value>
            <value name="ITEM5"><block type="sf_number"><field name="NUM">1</field></block></value>
          </block>
        </value>
        <next>
          <block type="sf_for_count">
            <field name="VAR" id="passVar">pass</field>
            <value name="FROM"><block type="sf_number"><field name="NUM">2</field></block></value>
            <value name="TO">
              <block type="sf_length_var">
                <field name="LISTVAR" id="numbersVar">numbers</field>
              </block>
            </value>
            <statement name="DO">
              <block type="sf_for_count">
                <field name="VAR" id="indexVar">index</field>
                <value name="FROM"><block type="sf_number"><field name="NUM">0</field></block></value>
                <value name="TO">
                  <block type="sf_math_operator">
                    <field name="OP">MINUS</field>
                    <value name="A">
                      <block type="sf_length_var">
                        <field name="LISTVAR" id="numbersVar">numbers</field>
                      </block>
                    </value>
                    <value name="B">
                      <block type="variables_get"><field name="VAR" id="passVar">pass</field></block>
                    </value>
                  </block>
                </value>
                <statement name="DO">
                  <block type="controls_if">
                    <value name="IF0">
                      <block type="sf_inequality">
                        <field name="OP">GT</field>
                        <value name="A">
                          <block type="sf_list_get_at">
                            <field name="LISTVAR" id="numbersVar">numbers</field>
                            <value name="INDEX">
                              <block type="variables_get"><field name="VAR" id="indexVar">index</field></block>
                            </value>
                          </block>
                        </value>
                        <value name="B">
                          <block type="sf_list_get_at">
                            <field name="LISTVAR" id="numbersVar">numbers</field>
                            <value name="INDEX">
                              <block type="sf_math_operator">
                                <field name="OP">ADD</field>
                                <value name="A">
                                  <block type="variables_get"><field name="VAR" id="indexVar">index</field></block>
                                </value>
                                <value name="B">
                                  <block type="sf_number"><field name="NUM">1</field></block>
                                </value>
                              </block>
                            </value>
                          </block>
                        </value>
                      </block>
                    </value>
                    <statement name="DO0">
                      <block type="sf_list_swap">
                        <field name="LISTVAR" id="numbersVar">numbers</field>
                        <value name="INDEX_A">
                          <block type="variables_get"><field name="VAR" id="indexVar">index</field></block>
                        </value>
                        <value name="INDEX_B">
                          <block type="sf_math_operator">
                            <field name="OP">ADD</field>
                            <value name="A">
                              <block type="variables_get"><field name="VAR" id="indexVar">index</field></block>
                            </value>
                            <value name="B">
                              <block type="sf_number"><field name="NUM">1</field></block>
                            </value>
                          </block>
                        </value>
                      </block>
                    </statement>
                  </block>
                </statement>
              </block>
            </statement>
          </block>
        </next>
      </block>
    </xml>
  `;

  function createFallbackTheme(blocklyInstance = Blockly) {
    return blocklyInstance.Theme.defineTheme('compactBlocklyFallback', {
      base: blocklyInstance.Themes.Classic,
      blockStyles: {
        logic_blocks: {
          colourPrimary: '#ffb347',
          colourSecondary: '#ffd697',
          colourTertiary: '#f3b35b',
        },
        loop_blocks: {
          colourPrimary: '#1b7f5a',
          colourSecondary: '#3ea57d',
          colourTertiary: '#16694b',
        },
        math_blocks: {
          colourPrimary: '#3cb9c9',
          colourSecondary: '#7ad4de',
          colourTertiary: '#278f9d',
        },
        variable_blocks: {
          colourPrimary: '#7c4dff',
          colourSecondary: '#a88bff',
          colourTertiary: '#5f38cf',
        },
        list_blocks: {
          colourPrimary: '#5b80d6',
          colourSecondary: '#89a8e6',
          colourTertiary: '#4263ae',
        },
        text_blocks: {
          colourPrimary: '#ff6f61',
          colourSecondary: '#ff9b92',
          colourTertiary: '#d95346',
        },
      },
      componentStyles: {
        workspaceBackgroundColour: '#f7fff9',
        toolboxBackgroundColour: '#ffffff',
        toolboxForegroundColour: '#173233',
        flyoutBackgroundColour: '#ffffff',
        flyoutForegroundColour: '#173233',
        flyoutOpacity: 0.96,
        scrollbarColour: 'rgba(23, 50, 51, 0.18)',
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

  function getThemeApi() {
    const externalTheme = window.compactBlocklyTheme;
    const fallbackCategoryColours = {
      Logic: '#ffb347',
      Loops: '#1b7f5a',
      Math: '#3cb9c9',
      Variables: '#7c4dff',
      Lists: '#5b80d6',
      Text: '#ff6f61',
    };

    return {
      createTheme(blocklyInstance = Blockly) {
        if (typeof externalTheme?.createTheme === 'function') {
          return externalTheme.createTheme(blocklyInstance);
        }

        return createFallbackTheme(blocklyInstance);
      },
      getCategoryColours() {
        return typeof externalTheme?.getCategoryColours === 'function'
          ? externalTheme.getCategoryColours()
          : fallbackCategoryColours;
      },
      getCompactSettings() {
        return typeof externalTheme?.getCompactSettings === 'function'
          ? externalTheme.getCompactSettings()
          : { startScale: 0.88, gridSpacing: 18 };
      },
      getRendererName(blocklyInstance = Blockly) {
        return typeof externalTheme?.registerCompactRenderer === 'function'
          ? externalTheme.registerCompactRenderer(blocklyInstance)
          : 'thrasos';
      },
      applyBlockRoleClasses(workspace) {
        return typeof externalTheme?.applyBlockRoleClasses === 'function'
          ? externalTheme.applyBlockRoleClasses(workspace)
          : 0;
      },
    };
  }

  function applyToolboxCategoryColours(toolbox, categoryColours) {
    Array.from(toolbox.children).forEach((node) => {
      const categoryName = node.getAttribute('name');
      if (!categoryName || !categoryColours[categoryName]) {
        return;
      }

      node.setAttribute('colour', categoryColours[categoryName]);
    });
  }

  function wait(ms) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  function applyChipState(chip, value, frame, index) {
    chip.className = 'number-chip';
    chip.dataset.value = String(value);

    const valueNode = document.createElement('span');
    valueNode.className = 'number-chip__value';
    valueNode.textContent = String(value);
    chip.replaceChildren(valueNode);

    if (frame.active.includes(index)) {
      chip.classList.add(frame.swapped ? 'is-swapped' : 'is-active');
      if (frame.phase === 'swap') {
        chip.classList.add('is-swap-trace');
      }
    }

    if (frame.complete) {
      chip.classList.add('is-complete');
    }
  }

  function animateChipReorder(row, frame) {
    const previousRects = new Map();
    const previousElements = new Map();

    Array.from(row.children).forEach((chip) => {
      previousRects.set(chip.dataset.value, chip.getBoundingClientRect());
      previousElements.set(chip.dataset.value, chip);
    });

    const nextChips = frame.numbers.map((value, index) => {
      const key = String(value);
      const chip = previousElements.get(key) || document.createElement('div');
      applyChipState(chip, value, frame, index);
      return chip;
    });

    row.replaceChildren(...nextChips);

    nextChips.forEach((chip) => {
      const previousRect = previousRects.get(chip.dataset.value);
      if (!previousRect) {
        return;
      }

      const nextRect = chip.getBoundingClientRect();
      const deltaX = previousRect.left - nextRect.left;
      const deltaY = previousRect.top - nextRect.top;

      if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) {
        return;
      }

      chip.style.transition = 'none';
      chip.style.setProperty('--flip-x', `${deltaX}px`);
      chip.style.setProperty('--flip-y', `${deltaY}px`);
      void chip.offsetWidth;
      chip.style.transition = 'transform 240ms cubic-bezier(0.16, 0.84, 0.32, 1), background-color 180ms ease, color 180ms ease, box-shadow 180ms ease';

      window.requestAnimationFrame(() => {
        chip.style.setProperty('--flip-x', '0px');
        chip.style.setProperty('--flip-y', '0px');
      });
    });
  }

  function renderNumberRow(row, frame) {
    row.style.setProperty('--number-count', String(frame.numbers.length || 1));

    const currentValues = Array.from(row.children).map((chip) => Number(chip.dataset.value));
    const orderUnchanged = currentValues.length === frame.numbers.length
      && currentValues.every((value, index) => value === frame.numbers[index]);

    if (row.children.length === 0) {
      frame.numbers.forEach((value, index) => {
        const chip = document.createElement('div');
        applyChipState(chip, value, frame, index);
        row.append(chip);
      });
      return;
    }

    if (orderUnchanged) {
      Array.from(row.children).forEach((chip, index) => {
        applyChipState(chip, frame.numbers[index], frame, index);
      });
      return;
    }

    animateChipReorder(row, frame);
  }

  async function animateFrames(row, frames) {
    const token = String(Number(row.dataset.animationToken || '0') + 1);
    row.dataset.animationToken = token;

    for (const frame of frames) {
      if (row.dataset.animationToken !== token) {
        return false;
      }

      renderNumberRow(row, frame);
      await wait(PREVIEW_DELAYS_MS[frame.phase] || PREVIEW_DELAYS_MS.compare);
    }

    return row.dataset.animationToken === token;
  }

  function buildFramesFromTrace(initialNumbers, trace, finalNumbers) {
    const frames = [
      {
        numbers: [...initialNumbers],
        active: [],
        swapped: false,
        complete: false,
        phase: 'settle',
      },
    ];

    trace.forEach((event) => {
      if (event.type === 'compare') {
        frames.push({
          numbers: [...event.numbers],
          active: [event.indexA, event.indexB],
          swapped: false,
          complete: false,
          phase: 'compare',
        });
      }

      if (event.type === 'swap') {
        if (frames.length > 0 && frames[frames.length - 1].phase === 'compare') {
          const previousFrame = frames[frames.length - 1];
          previousFrame.active = [];
        }
        frames.push({
          numbers: [...event.numbers],
          active: [event.indexA, event.indexB],
          swapped: true,
          complete: false,
          phase: 'swap',
        });
      }
    });

    frames.push({
      numbers: [...finalNumbers],
      active: [],
      swapped: false,
      complete: true,
      phase: 'complete',
    });

    return frames;
  }

  function executeBubbleSortPreview(code) {
    const trace = [];
    let initialNumbers = null;

    function recordInitialList(list) {
      if (!initialNumbers && Array.isArray(list)) {
        initialNumbers = [...list];
      }
    }

    function compareListItems(list, indexA, indexB) {
      recordInitialList(list);
      trace.push({
        type: 'compare',
        numbers: [...list],
        indexA,
        indexB,
      });
      return list[indexA] > list[indexB];
    }

    function swapListItems(list, indexA, indexB) {
      recordInitialList(list);
      const temp = list[indexA];
      list[indexA] = list[indexB];
      list[indexB] = temp;
      trace.push({
        type: 'swap',
        numbers: [...list],
        indexA,
        indexB,
      });
    }

    const runner = new Function(
      'compareListItems',
      'swapListItems',
      `${'const window = { alert() {} };'}\n${code}\nreturn typeof numbers !== 'undefined' ? numbers : null;`,
    );

    const finalNumbers = runner(compareListItems, swapListItems);
    const safeFinalNumbers = Array.isArray(finalNumbers) ? [...finalNumbers] : [...(initialNumbers || [])];
    const safeInitialNumbers = initialNumbers ? [...initialNumbers] : [...safeFinalNumbers];

    return {
      initialNumbers: safeInitialNumbers,
      finalNumbers: safeFinalNumbers,
      trace,
    };
  }

  function init() {
    const page = document.querySelector('[data-page="blockly-spike"]');
    if (!page || !window.Blockly) {
      return;
    }

    const host = page.querySelector('[data-blockly-host]');
    const jsMount = page.querySelector('[data-blockly-js]');
    const pyMount = page.querySelector('[data-blockly-py]');
    const feedback = page.querySelector('[data-blockly-feedback]');
    const clearButton = page.querySelector('[data-blockly-clear]');
    const resizeButton = page.querySelector('[data-blockly-resize]');
    const runButton = page.querySelector('[data-blockly-run]');
    const resetPreviewButton = page.querySelector('[data-blockly-reset-preview]');
    const previewRow = page.querySelector('[data-blockly-preview-row]');
    const toolbox = document.getElementById(TOOLBOX_ID);
    const javascriptGenerator = window.javascript?.javascriptGenerator || null;
    const pythonGenerator = window.python?.pythonGenerator || null;
    const themeApi = getThemeApi();
    const bubbleSortBlocks = window.bubbleSortBlocklyBlocks || null;
    const bubbleSortGenerators = window.bubbleSortBlocklyGenerators || null;

    if (!host || !toolbox || !feedback || !jsMount || !pyMount || !previewRow) {
      return;
    }

    bubbleSortBlocks?.register?.(Blockly);
    bubbleSortGenerators?.register?.(Blockly, {
      javascriptGenerator,
      pythonGenerator,
    });

    applyToolboxCategoryColours(toolbox, themeApi.getCategoryColours());
    const compactSettings = themeApi.getCompactSettings();

    const workspace = Blockly.inject(host.querySelector('#blockly-workspace'), {
      toolbox,
      theme: themeApi.createTheme(Blockly),
      renderer: themeApi.getRendererName(Blockly),
      move: {
        scrollbars: true,
        drag: true,
        wheel: false,
      },
      zoom: {
        controls: false,
        wheel: false,
        pinch: true,
        startScale: compactSettings.startScale || 0.88,
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
        spacing: compactSettings.gridSpacing || 18,
        length: 2,
        colour: 'rgba(23, 50, 51, 0.08)',
        snap: false,
      },
    });
    window.blocklySpikeWorkspace = workspace;

    const starterDom = Blockly.utils.xml.textToDom(STARTER_XML);
    Blockly.Xml.domToWorkspace(starterDom, workspace);
    themeApi.applyBlockRoleClasses(workspace);
    if (new URLSearchParams(window.location.search).get('debug') === 'blockly') {
      window.compactBlocklyDebug?.inspect?.(workspace);
    }

    let previewState = executeBubbleSortPreview(javascriptGenerator?.workspaceToCode(workspace) || '');
    renderNumberRow(previewRow, {
      numbers: [...previewState.initialNumbers],
      active: [],
      swapped: false,
      complete: false,
      phase: 'settle',
    });

    function updateCode() {
      try {
        jsMount.textContent = javascriptGenerator?.workspaceToCode(workspace) || '// JS output will appear here.';
      } catch (error) {
        jsMount.textContent = `// JS generation error: ${error.message}`;
      }

      try {
        pyMount.textContent = pythonGenerator?.workspaceToCode(workspace) || '# Python output will appear here.';
      } catch (error) {
        pyMount.textContent = `# Python generation error: ${error.message}`;
      }
    }

    workspace.addChangeListener((event) => {
      if (event.isUiEvent) {
        return;
      }

      themeApi.applyBlockRoleClasses(workspace);
      updateCode();
      try {
        previewState = executeBubbleSortPreview(javascriptGenerator?.workspaceToCode(workspace) || '');
        renderNumberRow(previewRow, {
          numbers: [...previewState.initialNumbers],
          active: [],
          swapped: false,
          complete: false,
          phase: 'settle',
        });
        feedback.textContent = 'Workspace updated. Run the preview to watch real compare and swap behavior on the list.';
        feedback.classList.remove('is-error');
      } catch (error) {
        feedback.textContent = `Preview update error: ${error.message}`;
        feedback.classList.add('is-error');
      }
    });

    runButton?.addEventListener('click', async () => {
      try {
        previewState = executeBubbleSortPreview(javascriptGenerator?.workspaceToCode(workspace) || '');
        const frames = buildFramesFromTrace(
          previewState.initialNumbers,
          previewState.trace,
          previewState.finalNumbers,
        );
        feedback.textContent = 'Running Bubble Sort preview with real list comparisons and swaps.';
        feedback.classList.remove('is-error');
        const completed = await animateFrames(previewRow, frames);
        if (completed) {
          feedback.textContent = 'Bubble Sort preview complete. The list finished in sorted order.';
        }
      } catch (error) {
        feedback.textContent = `Run error: ${error.message}`;
        feedback.classList.add('is-error');
      }
    });

    resetPreviewButton?.addEventListener('click', () => {
      previewRow.dataset.animationToken = String(Number(previewRow.dataset.animationToken || '0') + 1);
      try {
        previewState = executeBubbleSortPreview(javascriptGenerator?.workspaceToCode(workspace) || '');
        renderNumberRow(previewRow, {
          numbers: [...previewState.initialNumbers],
          active: [],
          swapped: false,
          complete: false,
          phase: 'settle',
        });
        feedback.textContent = 'Preview reset to the current list values.';
        feedback.classList.remove('is-error');
      } catch (error) {
        feedback.textContent = `Reset preview error: ${error.message}`;
        feedback.classList.add('is-error');
      }
    });

    clearButton?.addEventListener('click', () => {
      workspace.clear();
      updateCode();
      previewRow.replaceChildren();
      feedback.textContent = 'Workspace cleared.';
    });

    resizeButton?.addEventListener('click', () => {
      Blockly.svgResize(workspace);
      feedback.textContent = 'Blockly.svgResize(workspace) called.';
    });

    window.addEventListener('resize', () => {
      Blockly.svgResize(workspace);
    });

    updateCode();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
