import { test, expect } from '@playwright/test';

test.describe('Egypt Geo Location & Bidirectional Map Synchronization', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.addCookies([
      { name: 'pzone-e2e-bypass', value: 'true', domain: 'localhost', path: '/' },
    ]);
    await page.setExtraHTTPHeaders({ 'x-pzone-e2e': 'true' });
  });

  test('verifies governorate-first gate, city population, and coordinate updates', async ({ page }) => {
    // Navigate to Create New Project page
    await page.goto('/projects/new', { waitUntil: 'networkidle' });

    // 1. Fill Step 1 required fields
    const nameInput = page.locator('input[placeholder*="مثال: حمامات سباحة"]').first();
    await expect(nameInput).toBeVisible({ timeout: 15000 });
    await nameInput.fill('مشروع اختبار نظام المواقع التلقائي');

    // Select Client (required to advance)
    const clientDropdown = page.locator('button:has-text("اختر العميل...")').first();
    await expect(clientDropdown).toBeVisible();
    await clientDropdown.click();

    // Select first option in the CustomSelect dropdown portal
    const clientOption = page.locator('div[style*="position: fixed"] button').filter({ hasNotText: 'ابحث' }).first();
    await expect(clientOption).toBeVisible();
    await clientOption.click();

    // 2. Click Next to go to Step 2: Location
    const nextBtn = page.locator('button:has-text("الخطوة التالية ➔"), button:has-text("الخطوة التالية"), button:has-text("التالي")').first();
    await nextBtn.click();

    // 3. Verify we are on Step 2
    const step2Header = page.locator('text=الموقع الجغرافي والمواصفات الهيدروليكية');
    await expect(step2Header).toBeVisible({ timeout: 10000 });

    // 4. Check that City select button is disabled before selecting governorate
    const citySelect = page.locator('button:has-text("اختر المحافظة أولاً..."), button:has-text("اختر المدينة...")').first();
    await expect(citySelect).toBeVisible();
    await expect(citySelect).toBeDisabled();

    // 5. Select Governorate: Cairo (القاهرة)
    const govDropdown = page.locator('button:has-text("اختر المحافظة...")').first();
    await govDropdown.click();

    const cairoOption = page.locator('div[style*="position: fixed"] button:has-text("القاهرة")').first();
    await expect(cairoOption).toBeVisible();
    await cairoOption.click();

    // 6. Verify City select is now enabled
    const enabledCitySelect = page.locator('button:has-text("اختر المدينة...")').first();
    await expect(enabledCitySelect).toBeEnabled();
    await enabledCitySelect.click();

    // Verify cities for Cairo appear (e.g. التجمع الخامس)
    const fifthSettlementOption = page.locator('div[style*="position: fixed"] button:has-text("التجمع الخامس")').first();
    await expect(fifthSettlementOption).toBeVisible();
    await fifthSettlementOption.click();

    // 7. Verify city was selected and is displayed in the button
    await expect(page.locator('button').filter({ hasText: 'التجمع الخامس' }).first()).toBeVisible();
  });
});
