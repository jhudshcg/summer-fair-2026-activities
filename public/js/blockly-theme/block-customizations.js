/*
 * Summer Fair Blockly block customizations.
 *
 * This file is for Blockly behavior and block-shape tweaks that sit adjacent to
 * theme work, but are not purely palette or colour configuration.
 *
 * Current responsibilities:
 * - register custom Bubble Sort helper blocks
 * - patch built-in list creation blocks to display inline with comma separators
 *
 * Keep puzzle-page wiring out of this file. It should stay reusable.
 */

(function initSummerFairBlocklyCustomizations() {
  function patchListCreateWith(blocklyInstance) {
    const definition = blocklyInstance?.Blocks?.lists_create_with;
    if (!definition || definition.__summerFairInlinePatched) {
      return;
    }

    const originalInit = definition.init;
    const originalUpdateShape = definition.updateShape_;

    function syncCommaFields(block) {
      const itemCount = Number(block.itemCount_ || 0);

      for (let index = 0; index < itemCount; index += 1) {
        const input = block.getInput(`ADD${index}`);
        const fieldName = `SUMMER_FAIR_COMMA_${index}`;
        const shouldHaveComma = index > 0;

        if (!input) {
          continue;
        }

        const hasField = input.fieldRow.some((field) => field.name === fieldName);
        if (shouldHaveComma && !hasField) {
          input.appendField(',', fieldName);
        }

        if (!shouldHaveComma && hasField) {
          input.removeField(fieldName, true);
        }
      }
    }

    definition.init = function patchedInit(...args) {
      originalInit.apply(this, args);
      this.setInputsInline(true);
      syncCommaFields(this);
    };

    definition.updateShape_ = function patchedUpdateShape(...args) {
      const result = originalUpdateShape.apply(this, args);
      this.setInputsInline(true);
      syncCommaFields(this);
      return result;
    };

    definition.__summerFairInlinePatched = true;
  }

  function registerBlocks(blocklyInstance) {
    if (!blocklyInstance || blocklyInstance.Blocks.sf_list_compare_at) {
      return;
    }

    blocklyInstance.Blocks.sf_list_compare_at = {
      init() {
        this.appendValueInput('LIST')
          .appendField('item in');
        this.appendValueInput('INDEX_A')
          .appendField('at');
        this.appendValueInput('INDEX_B')
          .appendField('is greater than item at');
        this.setInputsInline(true);
        this.setOutput(true, 'Boolean');
        this.setStyle('logic_blocks');
        this.setTooltip('Compare two values inside the same list by index.');
      },
    };

    blocklyInstance.Blocks.sf_list_swap = {
      init() {
        this.appendValueInput('LIST')
          .appendField('swap items in');
        this.appendValueInput('INDEX_A')
          .appendField('at');
        this.appendValueInput('INDEX_B')
          .appendField('and');
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setStyle('list_blocks');
        this.setTooltip('Swap two positions inside a list.');
      },
    };
  }

  function registerGenerators(generators) {
    const javascriptGenerator = generators?.javascriptGenerator;
    const pythonGenerator = generators?.pythonGenerator;

    if (javascriptGenerator) {
      javascriptGenerator.forBlock.sf_list_compare_at = function sfListCompareAt(block, generator) {
        const listCode = generator.valueToCode(block, 'LIST', generator.ORDER_MEMBER) || '[]';
        const indexACode = generator.valueToCode(block, 'INDEX_A', generator.ORDER_NONE) || '0';
        const indexBCode = generator.valueToCode(block, 'INDEX_B', generator.ORDER_NONE) || '0';
        return [`compareListItems(${listCode}, ${indexACode}, ${indexBCode})`, generator.ORDER_FUNCTION_CALL];
      };

      javascriptGenerator.forBlock.sf_list_swap = function sfListSwap(block, generator) {
        const listCode = generator.valueToCode(block, 'LIST', generator.ORDER_NONE) || '[]';
        const indexACode = generator.valueToCode(block, 'INDEX_A', generator.ORDER_NONE) || '0';
        const indexBCode = generator.valueToCode(block, 'INDEX_B', generator.ORDER_NONE) || '0';
        return `swapListItems(${listCode}, ${indexACode}, ${indexBCode});\n`;
      };
    }

    if (pythonGenerator) {
      pythonGenerator.forBlock.sf_list_compare_at = function sfListCompareAtPy(block, generator) {
        const listCode = generator.valueToCode(block, 'LIST', generator.ORDER_MEMBER) || '[]';
        const indexACode = generator.valueToCode(block, 'INDEX_A', generator.ORDER_NONE) || '0';
        const indexBCode = generator.valueToCode(block, 'INDEX_B', generator.ORDER_NONE) || '0';
        return [`${listCode}[${indexACode}] > ${listCode}[${indexBCode}]`, generator.ORDER_RELATIONAL];
      };

      pythonGenerator.forBlock.sf_list_swap = function sfListSwapPy(block, generator) {
        const listCode = generator.valueToCode(block, 'LIST', generator.ORDER_NONE) || '[]';
        const indexACode = generator.valueToCode(block, 'INDEX_A', generator.ORDER_NONE) || '0';
        const indexBCode = generator.valueToCode(block, 'INDEX_B', generator.ORDER_NONE) || '0';
        return `${listCode}[${indexACode}], ${listCode}[${indexBCode}] = ${listCode}[${indexBCode}], ${listCode}[${indexACode}]\n`;
      };
    }
  }

  function register(blocklyInstance, generators = {}) {
    patchListCreateWith(blocklyInstance);
    registerBlocks(blocklyInstance);
    registerGenerators(generators);
  }

  window.summerFairBlocklyCustomizations = {
    register,
  };
})();