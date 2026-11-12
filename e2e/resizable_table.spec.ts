import { test, expect } from '@playwright/test';

test.describe('Interactive Resizable Table Columns Feature', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.addCookies([
      { name: 'pzone-e2e-bypass', value: 'true', domain: 'localhost', path: '/' },
    ]);
    await page.setExtraHTTPHeaders({ 'x-pzone-e2e': 'true' });
  });

  test('verifies resize handles are mounted on headers and columns can be resized', async ({ page }) => {
    // Navigate to projects list page
    await page.goto('/projects', { waitUntil: 'networkidle' });

    // Wait for the projects table to be rendered
    const table = page.locator('table');
    await expect(table.first()).toBeVisible({ timeout: 15000 });

    // Check that resize handles exist on table headers
    const resizeHandles = page.locator('[title*="اسحب لتغيير عرض العمود"]');
    await expect(resizeHandles.first()).toBeVisible();
    const handleCount = await resizeHandles.count();
    expect(handleCount).toBeGreaterThanOrEqual(3);

    // Get the initial width of a column header (e.g. project code or project name)
    const headerToResize = page.locator('th:has-text("اسم المشروع")');
    await expect(headerToResize).toBeVisible();
    const initialBox = await headerToResize.boundingBox();
    expect(initialBox).not.toBeNull();
    const initialWidth = initialBox!.width;

    // Locate the resize handle inside this header
    const handle = headerToResize.locator('[title*="اسحب لتغيير عرض العمود"]');
    const handleBox = await handle.boundingBox();
    expect(handleBox).not.toBeNull();

    // Drag the handle to the left to expand width in RTL mode
    await page.mouse.move(handleBox!.x + handleBox!.width / 2, handleBox!.y + handleBox!.height / 2);
    await page.mouse.down();
    await page.mouse.move(handleBox!.x - 60, handleBox!.y + handleBox!.height / 2, { steps: 5 });
    await page.mouse.up();

    // Verify column width changed
    const newBox = await headerToResize.boundingBox();
    expect(newBox).not.toBeNull();
    expect(newBox!.width).not.toEqual(initialWidth);
  });
});
