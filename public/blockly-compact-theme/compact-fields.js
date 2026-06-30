/*
 * Compact Blockly fields.
 *
 * These field classes keep Blockly's normal editor behaviour, but suppress the
 * persistent dropdown arrow at creation time.
 */

(function initCompactBlocklyFields() {
  function installNoArrowPatch(blocklyInstance) {
    const FieldDropdown = blocklyInstance?.FieldDropdown;
    if (!FieldDropdown || FieldDropdown.__compactBlocklyNoArrowPatched) {
      return;
    }

    // FieldVariable extends FieldDropdown, so this single hook covers both.
    FieldDropdown.prototype.createSVGArrow_ = function createNoSvgArrow() {
      this.svgArrow = document.createElementNS('http://www.w3.org/2000/svg', 'image');
      this.svgArrow.setAttribute('height', '0');
      this.svgArrow.setAttribute('width', '0');
      this.svgArrow.setAttribute('aria-hidden', 'true');
      this.svgArrow.style.display = 'none';
      this.fieldGroup_?.appendChild(this.svgArrow);
    };

    FieldDropdown.prototype.createTextArrow_ = function createNoTextArrow() {
      this.arrow = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
      this.arrow.textContent = '';
      this.arrow.setAttribute('aria-hidden', 'true');
      this.arrow.style.display = 'none';

      const textElement = this.getTextElement?.();
      if (!textElement) {
        return;
      }

      if (this.getConstants?.().FIELD_TEXT_BASELINE_CENTER) {
        this.arrow.setAttribute('dominant-baseline', 'central');
      }

      if (this.getSourceBlock?.()?.RTL && this.textContent_) {
        textElement.insertBefore(this.arrow, this.textContent_);
      } else {
        textElement.appendChild(this.arrow);
      }
    };
    FieldDropdown.__compactBlocklyNoArrowPatched = true;
  }

  function markNoArrow(field, className) {
    if (!field) {
      return;
    }

    field.getSvgRoot?.()?.classList?.add(className);

    // Fallback for stock fields created outside this factory.
    const arrow = field.arrow || field.svgArrow || field.arrow_ || field.svgArrow_;
    if (arrow?.style) {
      arrow.style.visibility = 'hidden';
    }

    if (arrow?.setAttribute) {
      arrow.setAttribute('aria-hidden', 'true');
    }
  }

  function createClasses(blocklyInstance) {
    installNoArrowPatch(blocklyInstance);

    const FieldDropdown = blocklyInstance?.FieldDropdown;
    const FieldVariable = blocklyInstance?.FieldVariable;
    const FieldNumber = blocklyInstance?.FieldNumber;

    if (!FieldDropdown || !FieldVariable || !FieldNumber) {
      return null;
    }

    class CompactFieldDropdown extends FieldDropdown {
      initView(...args) {
        const result = super.initView(...args);
        markNoArrow(this, 'compactBlocklyDropdownField');
        return result;
      }

      render_(...args) {
        const result = super.render_(...args);
        markNoArrow(this, 'compactBlocklyDropdownField');
        return result;
      }
    }

    class CompactFieldVariable extends FieldVariable {
      initView(...args) {
        const result = super.initView(...args);
        markNoArrow(this, 'compactBlocklyVariableField');
        return result;
      }

      render_(...args) {
        const result = super.render_(...args);
        markNoArrow(this, 'compactBlocklyVariableField');
        return result;
      }
    }

    class CompactFieldNumber extends FieldNumber {
      initView(...args) {
        const result = super.initView(...args);
        this.getSvgRoot?.()?.classList?.add('compactBlocklyNumberField');
        return result;
      }
    }

    return {
      CompactFieldDropdown,
      CompactFieldVariable,
      CompactFieldNumber,
    };
  }

  function createFactory(blocklyInstance) {
    const classes = createClasses(blocklyInstance);

    if (!classes) {
      return {
        dropdown: (...args) => new blocklyInstance.FieldDropdown(...args),
        variable: (...args) => new blocklyInstance.FieldVariable(...args),
        number: (...args) => new blocklyInstance.FieldNumber(...args),
        classes: null,
      };
    }

    return {
      dropdown: (...args) => new classes.CompactFieldDropdown(...args),
      variable: (...args) => new classes.CompactFieldVariable(...args),
      number: (...args) => new classes.CompactFieldNumber(...args),
      classes,
    };
  }

  window.compactBlocklyFields = {
    createFactory,
  };
})();
