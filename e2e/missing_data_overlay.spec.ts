import { test, expect } from '@playwright/test';

test.describe('Dashboard Missing Data Pop-up Overlay & Dynamic Blur', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.addCookies([
      { name: 'pzone-e2e-bypass', value: 'true', domain: 'localhost', path: '/' },
    ]);
    await page.setExtraHTTPHeaders({ 'x-pzone-e2e': 'true' });
  });

  test('verifies missing data pop-up overlay and chart blur on dashboard analytics', async ({ page }) => {
    // Navigate to Dashboard
    await page.goto('/dashboard', { waitUntil: 'networkidle' });

    // Wait for the main executive chart section to render
    const chartCard = page.locator('div.relative.min-h-\\[250px\\]');
    await expect(chartCard.first()).toBeVisible({ timeout: 15000 });

    // Verify the pop-up overlay notice badge is visible
    const noticeBadge = page.locator('span:has-text("تنبيه: بيانات تقديرية استرشادية")');
    await expect(noticeBadge.first()).toBeVisible();

    // Verify the chart container has the blur filter applied
    const blurredChart = page.locator('div.filter.blur-\\[7px\\]');
    await expect(blurredChart.first()).toBeVisible();

    // Verify the toggle preview button is present and click it
    const previewBtn = page.locator('button:has-text("معاينة البيانات التقديرية")');
    if (await previewBtn.isVisible()) {
      await previewBtn.click();

      // Verify chart is unblurred and banner appears
      const previewBanner = page.locator('span:has-text("وضع المعاينة:")');
      await expect(previewBanner).toBeVisible();

      // Verify blur filter is removed
      const unblurredChart = page.locator('div.filter-none');
      await expect(unblurredChart.first()).toBeVisible();

      // Re-blur button works
      const reblurBtn = page.locator('button:has-text("إعادة التمويه")');
      await expect(reblurBtn).toBeVisible();
      await reblurBtn.click();
      await expect(noticeBadge.first()).toBeVisible();
    }
  });
});
