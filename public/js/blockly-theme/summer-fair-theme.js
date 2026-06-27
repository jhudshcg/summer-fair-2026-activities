/*
 * Summer Fair Blockly theme builder.
 *
 * This file is the intended home for Blockly-specific theming experiments.
 * Suggested responsibilities:
 * - build and return the Blockly theme object
 * - expose toolbox category colours used by the prototype page
 * - later host small helper functions for renderer-specific tweaks if needed
 *
 * Keep puzzle logic out of this file. This should stay presentation-focused.
 */

(function initSummerFairBlocklyTheme() {
  const tokens = window.summerFairBlocklyThemeTokens || null;

  function createTheme(blocklyInstance) {
    if (!blocklyInstance || !tokens) {
      return null;
    }

    // Replace the token groups below when you want to try different palettes,
    // typography, or Blockly-owned component colours.
    return blocklyInstance.Theme.defineTheme('summerFairSpike', {
      base: blocklyInstance.Themes.Classic,
      blockStyles: tokens.blockStyles,
      componentStyles: tokens.componentStyles,
      fontStyle: tokens.fontStyle,
      startHats: false,
    });
  }

  function getCategoryColours() {
    // Category colours are kept separate so the toolbox XML can stay simple and
    // the spike script can apply colours before Blockly injects the toolbox.
    return tokens?.categoryColours || {};
  }

  window.summerFairBlocklyTheme = {
    createTheme,
    getCategoryColours,
  };
})();