import { test, expect } from '@playwright/test';

test.describe('Project Manager Source of Truth & Succession Governance', () => {
  test.beforeEach(async ({ page, context }) => {
    // Add deterministic bypass cookie & header
    await context.addCookies([
      { name: 'pzone-e2e-bypass', value: 'true', domain: 'localhost', path: '/' },
    ]);
    await page.setExtraHTTPHeaders({ 'x-pzone-e2e': 'true' });
  });

  test('verifies single source of truth for Project Manager across Hero Banner, Verification Card, and Timeline', async ({ page }) => {
    // Navigate to Project 2608 detail page
    await page.goto('/projects/eab35365-596c-49c1-958c-10bbdb1dbb0f', { waitUntil: 'networkidle' });

    // 1. Verify Hero Banner contains Project Manager
    const heroPm = page.locator('span:has-text("مدير المشروع:")');
    await expect(heroPm).toBeVisible({ timeout: 15000 });
    const heroText = await heroPm.textContent();
    expect(heroText).toContain('محمد شعبان توني عبد الدايم');

    // 2. Verify Verification Card displays active PM
    const verificationCardHeader = page.locator('h3:has-text("مدير المشروع الحالي:")');
    await expect(verificationCardHeader).toBeVisible();
    await expect(verificationCardHeader).toContainText('محمد شعبان توني عبد الدايم');

    // 3. Verify Succession Timeline displays the active manager badge
    const currentPmBadge = page.locator('span:has-text("المدير الحالي")');
    await expect(currentPmBadge.first()).toBeVisible();

    // Verify phone number is formatted and visible
    const phoneLink = page.locator('a[href*="tel:1272321897"]');
    await expect(phoneLink).toBeVisible();

    // 4. Test Change PM Modal opens and closes properly
    const changePmBtn = page.locator('button:has-text("تسليم مدير جديد / تغيير")');
    await expect(changePmBtn).toBeVisible();
    await changePmBtn.click();

    // Verify modal appears
    const modalTitle = page.locator('h4:has-text("تسليم إدارة المشروع لمهندس جديد")');
    await expect(modalTitle).toBeVisible();

    // Verify input fields inside modal
    const reasonInput = page.locator('select, input').filter({ hasText: /نقل إلى مشروع آخر|سبب/ }).first();
    await expect(reasonInput).toBeVisible();

    // Close modal
    const closeBtn = page.locator('button:has-text("✕")');
    await closeBtn.click();
    await expect(modalTitle).not.toBeVisible();
  });
});
