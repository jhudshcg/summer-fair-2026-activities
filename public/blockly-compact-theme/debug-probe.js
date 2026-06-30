/*
 * Blockly compact theme debug probe.
 *
 * Exposes opt-in measurement helpers for browser testing without requiring a
 * browser automation tool. It does not change Blockly behaviour.
 */

(function initCompactBlocklyDebugProbe() {
  function summarizeShape(shape) {
    if (!shape) {
      return null;
    }

    return {
      type: shape.type,
      width: typeof shape.width === 'function' ? 'dynamic' : shape.width,
      height: typeof shape.height === 'function' ? 'dynamic' : shape.height,
      isDynamic: Boolean(shape.isDynamic),
    };
  }

  function getConnectionShapeSummary(block, constants) {
    function getShape(connection) {
      if (!connection || !constants?.shapeFor) {
        return null;
      }

      try {
        return constants.shapeFor(connection);
      } catch (error) {
        return null;
      }
    }

    const inputShapes = block.inputList
      ? block.inputList
        .filter((input) => input.connection)
        .map((input) => ({
          name: input.name,
          type: input.type,
          shape: summarizeShape(getShape(input.connection)),
        }))
      : [];

    return {
      output: summarizeShape(getShape(block.outputConnection)),
      previous: summarizeShape(getShape(block.previousConnection)),
      next: summarizeShape(getShape(block.nextConnection)),
      inputs: inputShapes,
    };
  }

  function getBlockSummary(block, constants) {
    const root = block.getSvgRoot?.();
    const bbox = root?.getBBox?.();
    const fieldNodes = root ? Array.from(root.querySelectorAll('.blocklyField')) : [];

    return {
      id: block.id,
      type: block.type,
      width: bbox ? Math.round(bbox.width) : null,
      height: bbox ? Math.round(bbox.height) : null,
      simpleValueWrapper: root?.classList?.contains('compactBlocklySimpleValueWrapper') || false,
      fields: fieldNodes.map((node) => ({
        text: node.textContent.trim(),
        classes: node.getAttribute('class'),
      })),
      dropdownArrows: root ? root.querySelectorAll('.blocklyDropDownArrow').length : 0,
      compactFields: fieldNodes.filter((node) => (
        node.classList?.contains('compactBlocklyDropdownField')
        || node.classList?.contains('compactBlocklyVariableField')
        || node.classList?.contains('compactBlocklyNumberField')
      )).length,
      connections: getConnectionShapeSummary(block, constants),
    };
  }

  function inspect(workspace) {
    if (!workspace) {
      return null;
    }

    const renderer = workspace.getRenderer?.();
    const constants = renderer?.getConstants?.();
    const blocks = workspace.getTopBlocks(false).flatMap((block) => block.getDescendants(false));
    const summary = {
      rendererName: renderer?.name || renderer?.constructor?.name || null,
      constants: constants ? {
        constructor: constants.constructor?.name || null,
        cornerRadius: constants.CORNER_RADIUS,
        fieldBorderRadius: constants.FIELD_BORDER_RECT_RADIUS,
        notchWidth: constants.NOTCH_WIDTH,
        notchHeight: constants.NOTCH_HEIGHT,
        tabWidth: constants.TAB_WIDTH,
        tabHeight: constants.TAB_HEIGHT,
        tabOffsetFromTop: constants.TAB_OFFSET_FROM_TOP,
        outsideCornerRightHeight: constants.OUTSIDE_CORNERS?.rightHeight || null,
        insideCornerWidth: constants.INSIDE_CORNERS?.width || null,
        insideCornerHeight: constants.INSIDE_CORNERS?.height || null,
      } : null,
      topBlockCount: workspace.getTopBlocks(false).length,
      blockCount: blocks.length,
      blocks: blocks.map((block) => getBlockSummary(block, constants)),
    };

    if (typeof console.table === 'function') {
      console.table(summary.blocks.map((block) => ({
        type: block.type,
        width: block.width,
        height: block.height,
        simpleValueWrapper: block.simpleValueWrapper,
        dropdownArrows: block.dropdownArrows,
        compactFields: block.compactFields,
        outputShape: block.connections.output?.type || '',
      })));
    }

    return summary;
  }

  window.compactBlocklyDebug = {
    inspect,
  };
})();
