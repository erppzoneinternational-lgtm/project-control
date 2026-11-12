import { test, expect } from '@playwright/test';

test.describe('Schedule Pulse Security Gating & Canvas Rendering', () => {
  test('renders interactive schedule pulse canvas with authorized e2e bypass', async ({ page, context }) => {
    // Add bypass header & cookie
    await context.addCookies([
      { name: 'pzone-e2e-bypass', value: 'true', domain: 'localhost', path: '/' },
    ]);
    await page.setExtraHTTPHeaders({ 'x-pzone-e2e': 'true' });

    // Navigate to /schedule-pulse
    await page.goto('/schedule-pulse', { waitUntil: 'networkidle' });

    // Verify page container is loaded
    const pulseContainer = page.locator('iframe, #dash, div[data-schedule-pulse]');
    await expect(pulseContainer.first()).toBeVisible({ timeout: 15000 });

    // Verify developer badge attribution is present
    const devAttribution = page.locator('text=Dev by Hassan A.Soliman');
    await expect(devAttribution.first()).toBeVisible();
  });
});
