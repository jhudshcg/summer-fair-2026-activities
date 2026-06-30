/*
 * Bubble Sort Blockly block definitions.
 *
 * This activity vocabulary uses the compact Blockly field factory when present,
 * but it is intentionally separate from the reusable compact theme layer.
 */

(function initBubbleSortBlocklyBlocks() {
  const DEFAULT_LIST_ITEMS = 3;

  function getFieldFactory(blocklyInstance) {
    if (typeof window.compactBlocklyFields?.createFactory === 'function') {
      return window.compactBlocklyFields.createFactory(blocklyInstance);
    }

    return {
      dropdown: (...args) => new blocklyInstance.FieldDropdown(...args),
      variable: (...args) => new blocklyInstance.FieldVariable(...args),
      number: (...args) => new blocklyInstance.FieldNumber(...args),
    };
  }

  function patchListCreateWith(blocklyInstance) {
    const definition = blocklyInstance?.Blocks?.lists_create_with;
    if (!definition || definition.__compactBlocklyInlinePatched) {
      return;
    }

    const originalInit = definition.init;
    const originalUpdateShape = definition.updateShape_;

    function syncCommaFields(block) {
      const itemCount = Number(block.itemCount_ || 0);

      for (let index = 0; index < itemCount; index += 1) {
        const input = block.getInput(`ADD${index}`);
        const fieldName = `COMPACT_BLOCKLY_COMMA_${index}`;
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

    definition.__compactBlocklyInlinePatched = true;
  }

  function registerBlocks(blocklyInstance) {
    if (!blocklyInstance || blocklyInstance.Blocks.sf_list_compare_at) {
      return;
    }

    const fields = getFieldFactory(blocklyInstance);

    blocklyInstance.Blocks.sf_set = {
      init() {
        this.appendValueInput('VALUE')
          .appendField('set')
          .appendField(fields.variable('item'), 'VAR');
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setStyle('variable_blocks');
        this.setTooltip('Set a variable to a value.');
      },
    };

    blocklyInstance.Blocks.sf_list_literal = {
      init() {
        this.itemCount_ = DEFAULT_LIST_ITEMS;
        this.updateShape_();
        this.setInputsInline(true);
        this.setOutput(true, 'Array');
        this.setStyle('list_blocks');
        this.setTooltip('Create a compact list.');
      },
      mutationToDom() {
        const container = blocklyInstance.utils.xml.createElement('mutation');
        container.setAttribute('items', String(this.itemCount_));
        return container;
      },
      domToMutation(xmlElement) {
        this.itemCount_ = Number(xmlElement.getAttribute('items') || DEFAULT_LIST_ITEMS);
        this.updateShape_();
      },
      updateShape_() {
        const connections = new Map();

        this.inputList.slice().forEach((input) => {
          if (input.connection?.targetConnection) {
            connections.set(input.name, input.connection.targetConnection);
          }
          this.removeInput(input.name);
        });

        this.appendDummyInput('OPEN')
          .appendField('[');

        for (let index = 0; index < this.itemCount_; index += 1) {
          const input = this.appendValueInput(`ITEM${index}`)
            .appendField(index === 0 ? '' : ',');
          const connection = connections.get(`ITEM${index}`);
          if (connection) {
            input.connection.connect(connection);
          }
        }

        this.appendDummyInput('CLOSE')
          .appendField(']');
      },
    };

    blocklyInstance.Blocks.sf_number = {
      init() {
        this.appendDummyInput('NUM')
          .appendField(fields.number(0, -999, 999, 1), 'NUM');
        this.setOutput(true, 'Number');
        this.setStyle('math_blocks');
        this.setTooltip('A compact draggable number.');
      },
    };

    blocklyInstance.Blocks.sf_length = {
      init() {
        this.appendValueInput('LIST')
          .appendField('length(');
        this.appendDummyInput('CLOSE')
          .appendField(')');
        this.setInputsInline(true);
        this.setOutput(true, 'Number');
        this.setStyle('list_blocks');
        this.setTooltip('Get the length of a list.');
      },
    };

    blocklyInstance.Blocks.sf_length_var = {
      init() {
        this.appendDummyInput('LENGTH')
          .appendField('length(')
          .appendField(fields.variable('numbers'), 'LISTVAR')
          .appendField(')');
        this.setOutput(true, 'Number');
        this.setStyle('list_blocks');
        this.setTooltip('Get the length of a selected list variable.');
      },
    };

    blocklyInstance.Blocks.sf_math_operator = {
      init() {
        this.appendValueInput('A');
        this.appendValueInput('B')
          .appendField(fields.dropdown([
            ['+', 'ADD'],
            ['–', 'MINUS'],
            ['×', 'MULTIPLY'],
            ['÷', 'DIVIDE'],
          ]), 'OP');
        this.setInputsInline(true);
        this.setOutput(true, 'Number');
        this.setStyle('math_blocks');
        this.setTooltip('Choose an operator and combine two values.');
      },
    };

    blocklyInstance.Blocks.sf_index_offset = {
      init() {
        this.appendDummyInput('OFFSET')
          .appendField(fields.variable('index'), 'VAR')
          .appendField(fields.dropdown([
            ['+', 'ADD'],
            ['–', 'MINUS'],
            ['×', 'MULTIPLY'],
            ['÷', 'DIVIDE'],
          ]), 'OP')
          .appendField(fields.number(1, -99, 99, 1), 'OFFSET');
        this.setOutput(true, 'Number');
        this.setStyle('math_blocks');
        this.setTooltip('Compact editable index plus or minus a number.');
      },
    };

    blocklyInstance.Blocks.sf_for_count = {
      init() {
        this.hasStep_ = false;
        this.appendValueInput('FROM')
          .appendField('for')
          .appendField(fields.variable('i'), 'VAR')
          .appendField('from');
        this.appendValueInput('TO')
          .appendField('to');
        this.appendStatementInput('DO');
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setStyle('loop_blocks');
        this.setTooltip('Count from one value to another. The step is hidden while it is the default 1.');
      },
      mutationToDom() {
        const container = blocklyInstance.utils.xml.createElement('mutation');
        container.setAttribute('step', this.hasStep_ ? 'true' : 'false');
        return container;
      },
      domToMutation(xmlElement) {
        this.hasStep_ = xmlElement.getAttribute('step') === 'true';
        this.updateShape_();
      },
      customContextMenu(options) {
        options.push({
          text: this.hasStep_ ? 'Hide step input' : 'Show step input',
          enabled: true,
          callback: () => {
            this.hasStep_ = !this.hasStep_;
            this.updateShape_();
          },
        });
      },
      updateShape_() {
        const doInput = this.getInput('DO');
        const doConnection = doInput?.connection?.targetConnection || null;
        const stepInput = this.getInput('BY');

        if (stepInput && !this.hasStep_) {
          this.removeInput('BY');
        }

        if (doInput) {
          this.removeInput('DO');
        }

        if (this.hasStep_ && !this.getInput('BY')) {
          this.appendValueInput('BY')
            .appendField('step');
        }

        this.appendStatementInput('DO');

        if (doConnection) {
          this.getInput('DO').connection.connect(doConnection);
        }
      },
    };

    blocklyInstance.Blocks.sf_list_get_at = {
      init() {
        this.appendDummyInput('OPEN')
          .appendField(fields.variable('numbers'), 'LISTVAR')
          .appendField('[');
        this.appendValueInput('INDEX');
        this.appendDummyInput('CLOSE')
          .appendField(']');
        this.setInputsInline(true);
        this.setOutput(true, null);
        this.setStyle('list_blocks');
        this.setTooltip('Get a value from a list at an index.');
      },
    };

    blocklyInstance.Blocks.sf_inequality = {
      init() {
        this.appendValueInput('A');
        this.appendValueInput('B')
          .appendField(fields.dropdown([
            ['>', 'GT'],
            ['<', 'LT'],
            ['=', 'EQ'],
          ]), 'OP');
        this.setInputsInline(true);
        this.setOutput(true, 'Boolean');
        this.setStyle('logic_blocks');
        this.setTooltip('Compare two expressions.');
      },
    };

    blocklyInstance.Blocks.sf_list_compare_at = {
      init() {
        this.appendDummyInput('OPEN')
          .appendField(fields.variable('numbers'), 'LISTVAR')
          .appendField('[');
        this.appendValueInput('INDEX_A');
        this.appendDummyInput('OPERATOR')
          .appendField(']')
          .appendField(fields.dropdown([
            ['>', 'GT'],
            ['<', 'LT'],
            ['=', 'EQ'],
          ]), 'OP')
          .appendField(fields.variable('numbers'), 'LISTVAR_RIGHT')
          .appendField('[');
        this.appendValueInput('INDEX_B');
        this.appendDummyInput('CLOSE')
          .appendField(']');
        this.setInputsInline(true);
        this.setOutput(true, 'Boolean');
        this.setStyle('logic_blocks');
        this.setTooltip('Compare two values inside the same list by index.');
      },
      onchange(event) {
        if (
          event?.type === blocklyInstance.Events.BLOCK_CHANGE
          && event.blockId === this.id
          && this.getFieldValue('LISTVAR_RIGHT') !== this.getFieldValue('LISTVAR')
        ) {
          this.setFieldValue(this.getFieldValue('LISTVAR'), 'LISTVAR_RIGHT');
        }
      },
    };

    blocklyInstance.Blocks.sf_list_swap = {
      init() {
        this.appendDummyInput('OPEN')
          .appendField('swap_items(')
          .appendField(fields.variable('numbers'), 'LISTVAR')
          .appendField(',');
        this.appendValueInput('INDEX_A');
        this.appendDummyInput('SEPARATOR')
          .appendField(',');
        this.appendValueInput('INDEX_B');
        this.appendDummyInput('CLOSE')
          .appendField(')');
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setStyle('list_blocks');
        this.setTooltip('Swap two positions inside a list.');
      },
    };
  }

  function register(blocklyInstance) {
    patchListCreateWith(blocklyInstance);
    registerBlocks(blocklyInstance);
  }

  window.bubbleSortBlocklyBlocks = {
    register,
  };
})();
