/*
 * Compact Blockly theme builder.
 *
 * This file is the intended home for Blockly-specific theming experiments.
 * Suggested responsibilities:
 * - build and return the Blockly theme object
 * - expose toolbox category colours used by the prototype page
 * - later host small helper functions for renderer-specific tweaks if needed
 *
 * Keep puzzle logic out of this file. This should stay presentation-focused.
 */

(function initCompactBlocklyTheme() {
  const tokens = window.compactBlocklyThemeTokens || null;
  const compact = tokens?.compact || {};

  function createTheme(blocklyInstance) {
    if (!blocklyInstance || !tokens) {
      return null;
    }

    // Replace the token groups below when you want to try different palettes,
    // typography, or Blockly-owned component colours.
    return blocklyInstance.Theme.defineTheme('compactBlockly', {
      base: blocklyInstance.Themes.Classic,
      blockStyles: tokens.blockStyles,
      componentStyles: tokens.componentStyles,
      fontStyle: tokens.fontStyle,
      startHats: false,
    });
  }

  function registerCompactRenderer(blocklyInstance) {
    if (
      !blocklyInstance?.blockRendering?.register
      || !blocklyInstance?.blockRendering?.ConstantProvider
      || !blocklyInstance?.blockRendering?.Drawer
      || !blocklyInstance?.blockRendering?.TopRow
      || !blocklyInstance?.blockRendering?.BottomRow
      || !blocklyInstance?.thrasos?.Renderer
      || !blocklyInstance?.thrasos?.RenderInfo
    ) {
      return 'thrasos';
    }

    if (registerCompactRenderer.didRegister) {
      return 'compact_blockly';
    }

    const simpleWrapperTypes = new Set(compact.simpleValueWrapperBlockTypes || []);

    function svgMoveTo(x, y) {
      return `M ${x},${y}`;
    }

    function svgHorizontal(distance) {
      return `h ${distance}`;
    }

    function svgVertical(distance) {
      return `v ${distance}`;
    }

    function svgHorizontalTo(x) {
      return `H ${x}`;
    }

    function svgVerticalTo(y) {
      return `V ${y}`;
    }

    function svgArc(radius, sweep, x, y) {
      return `a ${radius},${radius} 0 0,${sweep} ${x},${y}`;
    }

    function isSimpleWrapperBlock(block) {
      return Boolean(block && simpleWrapperTypes.has(block.type));
    }

    function isSimpleWrapperConnection(connection) {
      const sourceBlock = connection?.getSourceBlock?.();
      const targetBlock = connection?.targetConnection?.getSourceBlock?.();
      return isSimpleWrapperBlock(sourceBlock) || isSimpleWrapperBlock(targetBlock);
    }

    function numberToken(value, fallback) {
      const number = Number(value);
      return Number.isFinite(number) ? number : fallback;
    }

    function getValueFontSize() {
      return numberToken(compact.valueFontSize, numberToken(tokens.fontStyle?.size, 13));
    }

    function getValueFieldHeight() {
      const verticalPadding = numberToken(compact.valueFieldVerticalPadding, 1);
      return Math.ceil(getValueFontSize() + verticalPadding);
    }

    function getSimpleValueBlockHeight(constants) {
      return constants.TOP_ROW_MIN_HEIGHT
        + constants.DUMMY_INPUT_MIN_HEIGHT
        + constants.BOTTOM_ROW_MIN_HEIGHT;
    }

    function getEmptyInlineInputHeight(constants) {
      const capInset = Math.max(
        1,
        Math.round(Math.min(constants.TOP_ROW_MIN_HEIGHT, constants.BOTTOM_ROW_MIN_HEIGHT) / 2),
      );
      return Math.max(constants.DUMMY_INPUT_MIN_HEIGHT, getSimpleValueBlockHeight(constants) - capInset);
    }

    function applyCompactMeasurements(constants) {
      const valueFieldHeight = getValueFieldHeight();

      // General spacing: keep row gaps tight without collapsing Thrasos' layout.
      constants.SMALL_PADDING = 1;
      constants.MEDIUM_PADDING = 2;
      constants.LARGE_PADDING = 4;
      constants.MEDIUM_LARGE_PADDING = 3;
      constants.NO_PADDING = 0;

      // Block outline and connection geometry. These are common renderer
      // constants, so they keep the compact renderer compatible with Thrasos.
      constants.CORNER_RADIUS = compact.cornerRadius || 6;
      constants.NOTCH_WIDTH = 9;
      constants.NOTCH_HEIGHT = 2;
      constants.NOTCH_OFFSET_LEFT = 8;
      constants.STATEMENT_INPUT_NOTCH_OFFSET = 8;
      constants.TAB_WIDTH = 4;
      constants.TAB_HEIGHT = 6;
      constants.TAB_VERTICAL_OVERLAP = 0;
      constants.TAB_OFFSET_FROM_TOP = 5;
      constants.MAX_DYNAMIC_CONNECTION_SHAPE_WIDTH = 8;

      // Editable field chrome.
      constants.FIELD_BORDER_RECT_RADIUS = 4;
      constants.FIELD_BORDER_RECT_X_PADDING = 1;
      constants.FIELD_BORDER_RECT_Y_PADDING = 0;
      constants.FIELD_BORDER_RECT_HEIGHT = valueFieldHeight;
      constants.FIELD_DROPDOWN_BORDER_RECT_HEIGHT = valueFieldHeight;
      constants.FIELD_DROPDOWN_SVG_ARROW_SIZE = 0;
      constants.FIELD_DROPDOWN_SVG_ARROW_PADDING = 0;
      constants.ARROW_HORIZONTAL_PADDING = 0;

      // Value/input sockets.
      constants.EMPTY_INLINE_INPUT_PADDING = compact.emptyInlineInputWidth || 30;
      constants.EXTERNAL_VALUE_INPUT_PADDING = 0;
      constants.STATEMENT_INPUT_PADDING_LEFT = 6;
      constants.BETWEEN_STATEMENT_PADDING_Y = 1;

      // Row minimums. These are deliberately lower than stock Blockly, but not
      // zero; zero row heights previously collapsed the renderer.
      constants.SPACER_DEFAULT_HEIGHT = 2;
      constants.EMPTY_BLOCK_SPACER_HEIGHT = 8;
      constants.MIN_BLOCK_HEIGHT = 18;
      constants.MIN_BLOCK_WIDTH = 12;
      constants.TOP_ROW_MIN_HEIGHT = 5;
      constants.BOTTOM_ROW_MIN_HEIGHT = 5;
      constants.DUMMY_INPUT_MIN_HEIGHT = valueFieldHeight;
      constants.DUMMY_INPUT_SHADOW_MIN_HEIGHT = valueFieldHeight;
      constants.BOTTOM_ROW_AFTER_STATEMENT_MIN_HEIGHT = 4;
      constants.TOP_ROW_PRECEDES_STATEMENT_MIN_HEIGHT = 14;

      const emptyInlineInputHeight = numberToken(
        compact.emptyInlineInputHeight,
        getEmptyInlineInputHeight(constants),
      );
      constants.EMPTY_INLINE_INPUT_HEIGHT = emptyInlineInputHeight;
    }

    class CompactBlocklyConstants extends blocklyInstance.blockRendering.ConstantProvider {
      constructor() {
        super();
        // Set measurements before Blockly initializes cached renderer shapes.
        applyCompactMeasurements(this);
        this.SIMPLE_VALUE_WRAPPER_SHAPE = null;
      }

      init() {
        super.init();
        this.SIMPLE_VALUE_WRAPPER_SHAPE = {
          type: this.PUZZLE_TAB.type,
          width: 0,
          height: 0,
          pathDown: '',
          pathUp: '',
        };
      }

      setFontConstants_(theme) {
        super.setFontConstants_(theme);
        // Blockly recalculates these from the active font, so compact values
        // need to be restored after the base font pass.
        const valueFieldHeight = getValueFieldHeight();
        this.FIELD_BORDER_RECT_HEIGHT = valueFieldHeight;
        this.FIELD_DROPDOWN_BORDER_RECT_HEIGHT = valueFieldHeight;
        this.FIELD_BORDER_RECT_Y_PADDING = 0;
      }

      shapeFor(connection) {
        const isInputValueConnection = connection?.type === blocklyInstance.INPUT_VALUE;
        const isOutputValueConnection = connection?.type === blocklyInstance.OUTPUT_VALUE;
        const isValueConnection = isInputValueConnection || isOutputValueConnection;
        if (isValueConnection && isSimpleWrapperConnection(connection)) {
          return this.SIMPLE_VALUE_WRAPPER_SHAPE || super.shapeFor(connection);
        }

        return super.shapeFor(connection);
      }
    }

    class CompactBlocklyTopRow extends blocklyInstance.blockRendering.TopRow {
      endsWithElemSpacer() {
        return false;
      }

      hasRightSquareCorner(block) {
        return false;
      }
    }

    class CompactBlocklyBottomRow extends blocklyInstance.blockRendering.BottomRow {
      endsWithElemSpacer() {
        return false;
      }

      hasRightSquareCorner(block) {
        return false;
      }
    }

    class CompactBlocklyRenderInfo extends blocklyInstance.thrasos.RenderInfo {
      constructor(renderer, block) {
        super(renderer, block);
        this.topRow = new CompactBlocklyTopRow(this.constants_);
        this.bottomRow = new CompactBlocklyBottomRow(this.constants_);
      }
    }

    class CompactBlocklyDrawer extends blocklyInstance.blockRendering.Drawer {
      drawInlineInput_(input) {
        if (input.connectedBlock) {
          this.positionInlineInputConnection_(input);
          return;
        }

        this.drawEmptyInlineInput_(input);
      }

      drawEmptyInlineInput_(input) {
        const width = Math.max(0, input.width - input.connectionWidth);
        const height = input.height;
        const maxRadius = compact.emptyInlineInputRadius || 6;
        const radius = Math.min(maxRadius, width / 2, height / 2);
        const x = input.xPos + input.connectionWidth;
        const y = input.centerline - height / 2;
        const straightWidth = Math.max(0, width - radius * 2);
        const straightHeight = Math.max(0, height - radius * 2);

        this.inlinePath_ += svgMoveTo(x + radius, y)
          + svgArc(radius, 0, -radius, radius)
          + svgVertical(straightHeight)
          + svgArc(radius, 0, radius, radius)
          + svgHorizontal(straightWidth)
          + svgArc(radius, 0, radius, -radius)
          + svgVertical(-straightHeight)
          + svgArc(radius, 0, -radius, -radius)
          + 'z';
        this.positionInlineInputConnection_(input);
      }

      drawRightSideRow_(row) {
        if (row.height <= 0) {
          return;
        }

        this.outlinePath_ += svgHorizontalTo(row.xPos + row.width);
        this.outlinePath_ += svgVerticalTo(row.yPos + row.height);
      }

      drawBottom_() {
        const row = this.info_.bottomRow;
        this.outlinePath_ += svgHorizontalTo(row.xPos + row.width);
        super.drawBottom_();
      }
    }

    class CompactBlocklyRenderer extends blocklyInstance.thrasos.Renderer {
      makeConstants_() {
        return new CompactBlocklyConstants();
      }

      makeRenderInfo_(block) {
        return new CompactBlocklyRenderInfo(this, block);
      }

      makeDrawer_(block, info) {
        return new CompactBlocklyDrawer(block, info);
      }
    }

    try {
      blocklyInstance.blockRendering.register('compact_blockly', CompactBlocklyRenderer);
      registerCompactRenderer.didRegister = true;
      return 'compact_blockly';
    } catch (error) {
      return 'thrasos';
    }
  }

  function getCategoryColours() {
    // Category colours are kept separate so the toolbox XML can stay simple and
    // the spike script can apply colours before Blockly injects the toolbox.
    return tokens?.categoryColours || {};
  }

  function getCompactSettings() {
    return tokens?.compact || {};
  }

  function applyBlockRoleClasses(workspace) {
    const wrapperTypes = new Set(compact.simpleValueWrapperBlockTypes || []);
    if (!workspace?.getAllBlocks || wrapperTypes.size === 0) {
      return 0;
    }

    let markedCount = 0;
    workspace.getAllBlocks(false).forEach((block) => {
      const root = block.getSvgRoot?.();
      if (!root) {
        return;
      }

      const isWrapper = wrapperTypes.has(block.type);
      root.classList.toggle('compactBlocklySimpleValueWrapper', isWrapper);
      if (isWrapper) {
        markedCount += 1;
      }
    });

    return markedCount;
  }

  window.compactBlocklyTheme = {
    applyBlockRoleClasses,
    createTheme,
    getCategoryColours,
    getCompactSettings,
    registerCompactRenderer,
  };
})();
