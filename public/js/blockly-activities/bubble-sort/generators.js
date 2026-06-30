/*
 * Bubble Sort Blockly code generators.
 *
 * Generator output stays separate from block definitions so the activity
 * vocabulary can evolve independently from renderer and field presentation.
 */

(function initBubbleSortBlocklyGenerators() {
  const DEFAULT_LIST_ITEMS = 3;

  function getVariableName(blocklyInstance, generator, block, fieldName) {
    const variableId = block.getFieldValue(fieldName);
    const variableModel = block.workspace.getVariableById(variableId);
    const fallbackName = variableModel?.name || variableId || 'item';
    const variableCategory = blocklyInstance?.Names?.NameType?.VARIABLE
      || blocklyInstance?.VARIABLE_CATEGORY_NAME
      || 'VARIABLE';

    if (typeof generator?.nameDB_?.getName === 'function') {
      return generator.nameDB_.getName(variableId, variableCategory);
    }

    return fallbackName;
  }

  function order(generator, name, fallbackName = 'ORDER_NONE') {
    return generator?.[name] ?? generator?.[fallbackName] ?? 0;
  }

  function registerJavaScript(blocklyInstance, javascriptGenerator) {
    if (!javascriptGenerator) {
      return;
    }

    javascriptGenerator.forBlock.sf_set = function sfSet(block, generator) {
      const variableName = getVariableName(blocklyInstance, generator, block, 'VAR');
      const valueCode = generator.valueToCode(block, 'VALUE', order(generator, 'ORDER_ASSIGNMENT')) || 'null';
      return `var ${variableName} = ${valueCode};\n`;
    };

    javascriptGenerator.forBlock.sf_list_literal = function sfListLiteral(block, generator) {
      const itemCodes = [];
      const itemCount = Number(block.itemCount_ || DEFAULT_LIST_ITEMS);

      for (let index = 0; index < itemCount; index += 1) {
        itemCodes.push(generator.valueToCode(block, `ITEM${index}`, order(generator, 'ORDER_NONE')) || 'null');
      }

      return [`[${itemCodes.join(', ')}]`, order(generator, 'ORDER_ATOMIC')];
    };

    javascriptGenerator.forBlock.sf_number = function sfNumber(block, generator) {
      return [String(block.getFieldValue('NUM') || 0), order(generator, 'ORDER_ATOMIC')];
    };

    javascriptGenerator.forBlock.sf_length = function sfLength(block, generator) {
      const listCode = generator.valueToCode(block, 'LIST', order(generator, 'ORDER_MEMBER')) || '[]';
      return [`${listCode}.length`, order(generator, 'ORDER_MEMBER')];
    };

    javascriptGenerator.forBlock.sf_length_var = function sfLengthVar(block, generator) {
      const listCode = getVariableName(blocklyInstance, generator, block, 'LISTVAR');
      return [`${listCode}.length`, order(generator, 'ORDER_MEMBER')];
    };

    javascriptGenerator.forBlock.sf_math_operator = function sfMathOperator(block, generator) {
      const operator = block.getFieldValue('OP');
      const operatorMap = {
        ADD: ['+', 'ORDER_ADDITION'],
        MINUS: ['-', 'ORDER_SUBTRACTION'],
        MULTIPLY: ['*', 'ORDER_MULTIPLICATION'],
        DIVIDE: ['/', 'ORDER_DIVISION'],
      };
      const [operatorCode, orderName] = operatorMap[operator] || operatorMap.ADD;
      const leftCode = generator.valueToCode(block, 'A', order(generator, orderName, 'ORDER_ADDITION')) || '0';
      const rightCode = generator.valueToCode(block, 'B', order(generator, orderName, 'ORDER_ADDITION')) || '0';
      return [`${leftCode} ${operatorCode} ${rightCode}`, order(generator, orderName, 'ORDER_ADDITION')];
    };

    javascriptGenerator.forBlock.sf_index_offset = function sfIndexOffset(block, generator) {
      const variableName = getVariableName(blocklyInstance, generator, block, 'VAR');
      const operatorMap = {
        ADD: '+',
        MINUS: '-',
        MULTIPLY: '*',
        DIVIDE: '/',
      };
      const operatorCode = operatorMap[block.getFieldValue('OP')] || '+';
      const offsetCode = block.getFieldValue('OFFSET') || '1';
      return [`${variableName} ${operatorCode} ${offsetCode}`, order(generator, 'ORDER_ADDITION')];
    };

    javascriptGenerator.forBlock.sf_for_count = function sfForCount(block, generator) {
      const variableName = getVariableName(blocklyInstance, generator, block, 'VAR');
      const fromCode = generator.valueToCode(block, 'FROM', order(generator, 'ORDER_ASSIGNMENT')) || '0';
      const toCode = generator.valueToCode(block, 'TO', order(generator, 'ORDER_ASSIGNMENT')) || '0';
      const stepCode = block.hasStep_
        ? generator.valueToCode(block, 'BY', order(generator, 'ORDER_ASSIGNMENT')) || '1'
        : '1';
      const branchCode = generator.statementToCode(block, 'DO') || '';
      return `for (let ${variableName} = ${fromCode}; ${variableName} <= ${toCode}; ${variableName} += ${stepCode}) {\n${branchCode}}\n`;
    };

    javascriptGenerator.forBlock.sf_list_get_at = function sfListGetAt(block, generator) {
      const listCode = getVariableName(blocklyInstance, generator, block, 'LISTVAR');
      const indexCode = generator.valueToCode(block, 'INDEX', order(generator, 'ORDER_NONE')) || '0';
      return [`${listCode}[${indexCode}]`, order(generator, 'ORDER_MEMBER')];
    };

    javascriptGenerator.forBlock.sf_inequality = function sfInequality(block, generator) {
      const operator = block.getFieldValue('OP') || 'GT';
      const operatorCode = operator === 'LT' ? '<' : operator === 'EQ' ? '===' : '>';
      const leftCode = generator.valueToCode(block, 'A', order(generator, 'ORDER_RELATIONAL')) || '0';
      const rightCode = generator.valueToCode(block, 'B', order(generator, 'ORDER_RELATIONAL')) || '0';
      return [`${leftCode} ${operatorCode} ${rightCode}`, order(generator, 'ORDER_RELATIONAL')];
    };

    javascriptGenerator.forBlock.sf_list_compare_at = function sfListCompareAt(block, generator) {
      const listCode = getVariableName(blocklyInstance, generator, block, 'LISTVAR');
      const indexACode = generator.valueToCode(block, 'INDEX_A', order(generator, 'ORDER_NONE')) || '0';
      const indexBCode = generator.valueToCode(block, 'INDEX_B', order(generator, 'ORDER_NONE')) || '0';
      const operator = block.getFieldValue('OP') || 'GT';
      if (operator === 'GT') {
        return [`compareListItems(${listCode}, ${indexACode}, ${indexBCode})`, order(generator, 'ORDER_FUNCTION_CALL')];
      }
      const operatorCode = operator === 'LT' ? '<' : '===';
      return [`${listCode}[${indexACode}] ${operatorCode} ${listCode}[${indexBCode}]`, order(generator, 'ORDER_RELATIONAL')];
    };

    javascriptGenerator.forBlock.sf_list_swap = function sfListSwap(block, generator) {
      const listCode = getVariableName(blocklyInstance, generator, block, 'LISTVAR');
      const indexACode = generator.valueToCode(block, 'INDEX_A', order(generator, 'ORDER_NONE')) || '0';
      const indexBCode = generator.valueToCode(block, 'INDEX_B', order(generator, 'ORDER_NONE')) || '0';
      return `swapListItems(${listCode}, ${indexACode}, ${indexBCode});\n`;
    };
  }

  function registerPython(blocklyInstance, pythonGenerator) {
    if (!pythonGenerator) {
      return;
    }

    pythonGenerator.forBlock.sf_set = function sfSetPy(block, generator) {
      const variableName = getVariableName(blocklyInstance, generator, block, 'VAR');
      const valueCode = generator.valueToCode(block, 'VALUE', order(generator, 'ORDER_NONE')) || 'None';
      return `${variableName} = ${valueCode}\n`;
    };

    pythonGenerator.forBlock.sf_list_literal = function sfListLiteralPy(block, generator) {
      const itemCodes = [];
      const itemCount = Number(block.itemCount_ || DEFAULT_LIST_ITEMS);

      for (let index = 0; index < itemCount; index += 1) {
        itemCodes.push(generator.valueToCode(block, `ITEM${index}`, order(generator, 'ORDER_NONE')) || 'None');
      }

      return [`[${itemCodes.join(', ')}]`, order(generator, 'ORDER_ATOMIC')];
    };

    pythonGenerator.forBlock.sf_number = function sfNumberPy(block, generator) {
      return [String(block.getFieldValue('NUM') || 0), order(generator, 'ORDER_ATOMIC')];
    };

    pythonGenerator.forBlock.sf_length = function sfLengthPy(block, generator) {
      const listCode = generator.valueToCode(block, 'LIST', order(generator, 'ORDER_NONE')) || '[]';
      return [`len(${listCode})`, order(generator, 'ORDER_FUNCTION_CALL')];
    };

    pythonGenerator.forBlock.sf_length_var = function sfLengthVarPy(block, generator) {
      const listCode = getVariableName(blocklyInstance, generator, block, 'LISTVAR');
      return [`len(${listCode})`, order(generator, 'ORDER_FUNCTION_CALL')];
    };

    pythonGenerator.forBlock.sf_math_operator = function sfMathOperatorPy(block, generator) {
      const operator = block.getFieldValue('OP');
      const operatorMap = {
        ADD: ['+', 'ORDER_ADDITIVE'],
        MINUS: ['-', 'ORDER_ADDITIVE'],
        MULTIPLY: ['*', 'ORDER_MULTIPLICATIVE'],
        DIVIDE: ['/', 'ORDER_MULTIPLICATIVE'],
      };
      const [operatorCode, orderName] = operatorMap[operator] || operatorMap.ADD;
      const leftCode = generator.valueToCode(block, 'A', order(generator, orderName, 'ORDER_ADDITIVE')) || '0';
      const rightCode = generator.valueToCode(block, 'B', order(generator, orderName, 'ORDER_ADDITIVE')) || '0';
      return [`${leftCode} ${operatorCode} ${rightCode}`, order(generator, orderName, 'ORDER_ADDITIVE')];
    };

    pythonGenerator.forBlock.sf_index_offset = function sfIndexOffsetPy(block, generator) {
      const variableName = getVariableName(blocklyInstance, generator, block, 'VAR');
      const operatorMap = {
        ADD: '+',
        MINUS: '-',
        MULTIPLY: '*',
        DIVIDE: '/',
      };
      const operatorCode = operatorMap[block.getFieldValue('OP')] || '+';
      const offsetCode = block.getFieldValue('OFFSET') || '1';
      return [`${variableName} ${operatorCode} ${offsetCode}`, order(generator, 'ORDER_ADDITIVE')];
    };

    pythonGenerator.forBlock.sf_for_count = function sfForCountPy(block, generator) {
      const variableName = getVariableName(blocklyInstance, generator, block, 'VAR');
      const fromCode = generator.valueToCode(block, 'FROM', order(generator, 'ORDER_NONE')) || '0';
      const toCode = generator.valueToCode(block, 'TO', order(generator, 'ORDER_ADDITIVE')) || '0';
      const stepCode = block.hasStep_
        ? generator.valueToCode(block, 'BY', order(generator, 'ORDER_NONE')) || '1'
        : '1';
      const branchCode = generator.statementToCode(block, 'DO') || generator.PASS;
      return `for ${variableName} in range(${fromCode}, ${toCode} + 1, ${stepCode}):\n${branchCode}`;
    };

    pythonGenerator.forBlock.sf_list_get_at = function sfListGetAtPy(block, generator) {
      const listCode = getVariableName(blocklyInstance, generator, block, 'LISTVAR');
      const indexCode = generator.valueToCode(block, 'INDEX', order(generator, 'ORDER_NONE')) || '0';
      return [`${listCode}[${indexCode}]`, order(generator, 'ORDER_MEMBER')];
    };

    pythonGenerator.forBlock.sf_inequality = function sfInequalityPy(block, generator) {
      const operator = block.getFieldValue('OP') || 'GT';
      const operatorCode = operator === 'LT' ? '<' : operator === 'EQ' ? '==' : '>';
      const leftCode = generator.valueToCode(block, 'A', order(generator, 'ORDER_RELATIONAL')) || '0';
      const rightCode = generator.valueToCode(block, 'B', order(generator, 'ORDER_RELATIONAL')) || '0';
      return [`${leftCode} ${operatorCode} ${rightCode}`, order(generator, 'ORDER_RELATIONAL')];
    };

    pythonGenerator.forBlock.sf_list_compare_at = function sfListCompareAtPy(block, generator) {
      const listCode = getVariableName(blocklyInstance, generator, block, 'LISTVAR');
      const indexACode = generator.valueToCode(block, 'INDEX_A', order(generator, 'ORDER_NONE')) || '0';
      const indexBCode = generator.valueToCode(block, 'INDEX_B', order(generator, 'ORDER_NONE')) || '0';
      const operator = block.getFieldValue('OP') || 'GT';
      const operatorCode = operator === 'LT' ? '<' : operator === 'EQ' ? '==' : '>';
      return [`${listCode}[${indexACode}] ${operatorCode} ${listCode}[${indexBCode}]`, order(generator, 'ORDER_RELATIONAL')];
    };

    pythonGenerator.forBlock.sf_list_swap = function sfListSwapPy(block, generator) {
      const listCode = getVariableName(blocklyInstance, generator, block, 'LISTVAR');
      const indexACode = generator.valueToCode(block, 'INDEX_A', order(generator, 'ORDER_NONE')) || '0';
      const indexBCode = generator.valueToCode(block, 'INDEX_B', order(generator, 'ORDER_NONE')) || '0';
      return `${listCode}[${indexACode}], ${listCode}[${indexBCode}] = ${listCode}[${indexBCode}], ${listCode}[${indexACode}]\n`;
    };
  }

  function register(blocklyInstance, generators = {}) {
    registerJavaScript(blocklyInstance, generators.javascriptGenerator);
    registerPython(blocklyInstance, generators.pythonGenerator);
  }

  window.bubbleSortBlocklyGenerators = {
    register,
  };
})();
