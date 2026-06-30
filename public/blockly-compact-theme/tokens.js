/*
 * Compact Blockly theme tokens.
 *
 * Keep this file small and stable.
 * Put named colours, font choices, and other raw theme values here so later
 * theme experiments can change one place without touching integration code.
 */

(function initCompactBlocklyThemeTokens() {
  window.compactBlocklyThemeTokens = Object.freeze({
    categoryColours: {
      Logic: '#ffb347',
      Loops: '#1b7f5a',
      Math: '#3cb9c9',
      Variables: '#7c4dff',
      Lists: '#5b80d6',
      Text: '#ff6f61',
    },
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
      size: 13,
    },
    compact: {
      startScale: 0.82,
      gridSpacing: 16,
      cornerRadius: 10,
      simpleValueWrapperBlockTypes: [
        'sf_number',
        'variables_get',
      ],
    },
  });
})();
