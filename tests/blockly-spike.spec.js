const { test, expect } = require('@playwright/test');

test.describe('Blockly spike', () => {
  test('renders starter blocks with the compact renderer', async ({ page }) => {
    await page.goto('/prototype_tests/blockly-spike.html?debug=blockly');

    await expect(page.locator('.blocklySvg')).toBeVisible();
    await page.waitForFunction(() => {
      const workspace = window.blocklySpikeWorkspace;
      return Boolean(workspace && workspace.getTopBlocks(false).length);
    });
    await page.locator('.blockly-host').scrollIntoViewIfNeeded();

    const summary = await page.evaluate(() => (
      window.compactBlocklyDebug.inspect(window.blocklySpikeWorkspace)
    ));

    expect(summary.rendererName).toBe('compact_blockly');
    expect(summary.constants).toMatchObject({
      constructor: 'CompactBlocklyConstants',
      cornerRadius: 10,
      fieldBorderRadius: 4,
      notchWidth: 9,
      notchHeight: 2,
      tabWidth: 4,
      tabHeight: 6,
    });
    expect(summary.constants.outsideCornerRightHeight).toBeGreaterThan(0);
    expect(summary.constants.insideCornerWidth).toBeGreaterThan(0);
    expect(summary.constants.insideCornerHeight).toBeGreaterThan(0);
    expect(summary.topBlockCount).toBeGreaterThan(0);
    expect(summary.blockCount).toBeGreaterThan(5);

    const collapsedBlocks = summary.blocks.filter((block) => (
      !block.width || !block.height || block.width < 20 || block.height < 16
    )).map((block) => ({
      type: block.type,
      width: block.width,
      height: block.height,
      fields: block.fields.map((field) => field.text).filter(Boolean),
    }));

    expect(collapsedBlocks, JSON.stringify(collapsedBlocks, null, 2)).toEqual([]);

    const widestBlock = summary.blocks.reduce((widest, block) => (
      block.width > widest.width ? block : widest
    ));
    expect(widestBlock.width, `Widest block is ${widestBlock.type}`).toBeLessThanOrEqual(505);

    const tallestNumber = summary.blocks
      .filter((block) => block.type === 'sf_number')
      .reduce((tallest, block) => Math.max(tallest, block.height), 0);
    expect(tallestNumber).toBeLessThanOrEqual(42);

    const simpleWrappers = summary.blocks
      .filter((block) => block.simpleValueWrapper)
      .map((block) => block.type);
    expect(simpleWrappers).toContain('sf_number');
    expect(simpleWrappers).toContain('variables_get');
    expect(simpleWrappers).not.toContain('sf_math_operator');
    expect(simpleWrappers).not.toContain('sf_list_get_at');
  });
});
