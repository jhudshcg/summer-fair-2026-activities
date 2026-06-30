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

    function applyCompactMeasurements(constants) {
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
      constants.FIELD_BORDER_RECT_HEIGHT = 14;
      constants.FIELD_DROPDOWN_BORDER_RECT_HEIGHT = 14;
      constants.FIELD_DROPDOWN_SVG_ARROW_SIZE = 0;
      constants.FIELD_DROPDOWN_SVG_ARROW_PADDING = 0;
      constants.ARROW_HORIZONTAL_PADDING = 0;

      // Value/input sockets.
      constants.EMPTY_INLINE_INPUT_PADDING = 0;
      constants.EMPTY_INLINE_INPUT_HEIGHT = 12;
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
      constants.DUMMY_INPUT_MIN_HEIGHT = 14;
      constants.DUMMY_INPUT_SHADOW_MIN_HEIGHT = 14;
      constants.BOTTOM_ROW_AFTER_STATEMENT_MIN_HEIGHT = 4;
      constants.TOP_ROW_PRECEDES_STATEMENT_MIN_HEIGHT = 14;
    }

    class CompactBlocklyConstants extends blocklyInstance.blockRendering.ConstantProvider {
      constructor() {
        super();
        // Set measurements before Blockly initializes cached renderer shapes.
        applyCompactMeasurements(this);
        this.SIMPLE_VALUE_WRAPPER_SHAPE = null;
        this.COMPACT_ROUNDED_VALUE_SHAPE = null;
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
        this.COMPACT_ROUNDED_VALUE_SHAPE = this.makeCompactRoundedValueShape();
      }

      makeCompactRoundedValueShape() {
        const maxRadius = this.CORNER_RADIUS || compact.cornerRadius || 6;
        const outputConnectionOffsetY = this.TAB_OFFSET_FROM_TOP;
        const getRadius = (height) => Math.min(maxRadius, Math.max(2, height / 2));
        const getWidth = (height) => getRadius(height);
        const getHeight = (height) => height;
        const roundedSide = (height, isUp, isRight) => {
          const radius = getRadius(height);
          const straight = Math.max(0, height - radius * 2);
          const yDirection = isUp ? -1 : 1;
          const xDirection = isRight ? 1 : -1;
          return svgArc(radius, isRight === isUp ? 0 : 1, xDirection * radius, yDirection * radius)
            + (straight ? `v ${yDirection * straight}` : '')
            + svgArc(radius, isRight === isUp ? 0 : 1, -xDirection * radius, yDirection * radius);
        };

        return {
          type: 'COMPACT_ROUNDED_VALUE',
          isDynamic: true,
          width: getWidth,
          height: getHeight,
          connectionOffsetY() {
            return outputConnectionOffsetY;
          },
          connectionOffsetX(width) {
            return -width;
          },
          pathDown(height) {
            return roundedSide(height, false, false);
          },
          pathUp(height) {
            return roundedSide(height, true, false);
          },
          pathRightDown(height) {
            return roundedSide(height, false, true);
          },
          pathRightUp(height) {
            return roundedSide(height, true, true);
          },
        };
      }

      setFontConstants_(theme) {
        super.setFontConstants_(theme);
        // Blockly recalculates these from the active font, so compact values
        // need to be restored after the base font pass.
        this.FIELD_BORDER_RECT_HEIGHT = 14;
        this.FIELD_DROPDOWN_BORDER_RECT_HEIGHT = 14;
        this.FIELD_BORDER_RECT_Y_PADDING = 0;
      }

      shapeFor(connection) {
        const isInputValueConnection = connection?.type === blocklyInstance.INPUT_VALUE;
        const isOutputValueConnection = connection?.type === blocklyInstance.OUTPUT_VALUE;
        const isValueConnection = isInputValueConnection || isOutputValueConnection;
        if (isValueConnection && isSimpleWrapperConnection(connection)) {
          return this.SIMPLE_VALUE_WRAPPER_SHAPE || super.shapeFor(connection);
        }

        if (isOutputValueConnection) {
          return this.COMPACT_ROUNDED_VALUE_SHAPE || super.shapeFor(connection);
        }

        return super.shapeFor(connection);
      }
    }

    class CompactBlocklyTopRow extends blocklyInstance.blockRendering.TopRow {
      endsWithElemSpacer() {
        return false;
      }

      hasRightSquareCorner(block) {
        return Boolean(block.outputConnection && !block.statementInputCount && !block.nextConnection);
      }
    }

    class CompactBlocklyBottomRow extends blocklyInstance.blockRendering.BottomRow {
      endsWithElemSpacer() {
        return false;
      }

      hasRightSquareCorner(block) {
        return Boolean(block.outputConnection && !block.statementInputCount && !block.nextConnection);
      }
    }

    class CompactBlocklyRenderInfo extends blocklyInstance.thrasos.RenderInfo {
      constructor(renderer, block) {
        super(renderer, block);
        this.topRow = new CompactBlocklyTopRow(this.constants_);
        this.bottomRow = new CompactBlocklyBottomRow(this.constants_);
        this.hasStatementInput = block.statementInputCount > 0;
        this.compactHasDynamicOutputRight = false;
      }

      finalizeCompactDynamicOutput_() {
        if (!this.outputConnection?.isDynamicShape) {
          return;
        }

        const shape = this.outputConnection.shape;
        if (!shape?.isDynamic) {
          return;
        }

        let height = 0;
        for (const row of this.rows) {
          row.yPos = height;
          height += row.height;
        }

        this.height = height;
        const outputShapeHeight = this.bottomRow.hasNextConnection
          ? this.height - this.bottomRow.descenderHeight
          : this.height;
        const connectionHeight = shape.height(outputShapeHeight);
        const connectionWidth = shape.width(outputShapeHeight);

        this.outputConnection.height = connectionHeight;
        this.outputConnection.width = connectionWidth;
        this.outputConnection.startX = connectionWidth;
        this.outputConnection.connectionOffsetY = shape.connectionOffsetY(connectionHeight);
        this.outputConnection.connectionOffsetX = shape.connectionOffsetX(connectionWidth);

        this.compactHasDynamicOutputRight = !this.hasStatementInput && !this.bottomRow.hasNextConnection;
        const rightSideWidth = this.compactHasDynamicOutputRight ? connectionWidth : 0;
        this.startX = connectionWidth;
        this.width += connectionWidth + rightSideWidth;
        this.widthWithChildren += connectionWidth + rightSideWidth;
      }

      finalize_() {
        this.finalizeCompactDynamicOutput_();
        super.finalize_();
      }
    }

    class CompactBlocklyDrawer extends blocklyInstance.blockRendering.Drawer {
      drawOutline_() {
        if (this.info_.outputConnection?.isDynamicShape && this.info_.compactHasDynamicOutputRight) {
          this.drawCompactDynamicOutputOutline_();
          return;
        }

        super.drawOutline_();
      }

      drawCompactDynamicOutputOutline_() {
        this.drawCompactFlatTop_();
        this.drawCompactRightDynamicConnection_();
        this.drawCompactFlatBottom_();
        this.drawCompactLeftDynamicConnection_();
      }

      drawCompactFlatTop_() {
        const row = this.info_.topRow;
        this.positionPreviousConnection_();
        this.outlinePath_ += svgMoveTo(row.xPos, this.info_.startY);
        this.outlinePath_ += svgHorizontal(row.width);
      }

      drawCompactRightDynamicConnection_() {
        const connection = this.info_.outputConnection;
        this.outlinePath_ += connection.shape.pathRightDown(connection.height);
      }

      drawCompactFlatBottom_() {
        const row = this.info_.bottomRow;
        this.positionNextConnection_();
        this.outlinePath_ += svgVerticalTo(row.baseline);
        this.outlinePath_ += svgHorizontal(-row.width);
      }

      drawCompactLeftDynamicConnection_() {
        const connection = this.info_.outputConnection;
        this.positionOutputConnection_();
        this.outlinePath_ += connection.shape.pathUp(connection.height);
        this.outlinePath_ += 'z';
      }

      drawInlineInput_(input) {
        if (isSimpleWrapperBlock(input.connectedBlock)) {
          this.positionInlineInputConnection_(input);
          return;
        }

        super.drawInlineInput_(input);
      }

      drawRightSideRow_(row) {
        if (row.height <= 0) {
          return;
        }

        this.outlinePath_ += svgHorizontalTo(row.xPos + row.width);
        this.outlinePath_ += svgVerticalTo(row.yPos + row.height);
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
