import { test, expect } from '@playwright/test';

test.describe('User Profile & Password Change Access', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.addCookies([
      { name: 'pzone-e2e-bypass', value: 'true', domain: 'localhost', path: '/' },
    ]);
    await page.setExtraHTTPHeaders({ 'x-pzone-e2e': 'true' });
  });

  test('verifies TopNav user dropdown contains Profile link and Change Password button, and opens password modal', async ({ page }) => {
    await page.goto('/projects', { waitUntil: 'networkidle' });

    // 1. Locate user avatar button in TopNav
    const userMenuBtn = page.locator('button[aria-label="قائمة حساب المستخدم"], button[aria-label="User account menu"]');
    await expect(userMenuBtn).toBeVisible({ timeout: 10000 });
    await userMenuBtn.click();

    // 2. Verify dropdown menu items appear
    const profileLink = page.locator('a[href="/profile"]');
    await expect(profileLink).toBeVisible();
    await expect(profileLink).toContainText('الملف الشخصي وبياناتي');

    const changePasswordBtn = page.locator('button:has-text("تغيير كلمة المرور")');
    await expect(changePasswordBtn).toBeVisible();

    const signOutBtn = page.locator('button:has-text("تسجيل خروج")');
    await expect(signOutBtn).toBeVisible();

    // 3. Click Change Password button to trigger modal
    await changePasswordBtn.click();

    // Verify modal is displayed
    const modalTitle = page.locator('h3:has-text("تغيير كلمة المرور")');
    await expect(modalTitle).toBeVisible();

    const newPasswordInput = page.locator('input[placeholder="••••••••"]').first();
    await expect(newPasswordInput).toBeVisible();

    const confirmPasswordInput = page.locator('input[placeholder="••••••••"]').nth(1);
    await expect(confirmPasswordInput).toBeVisible();

    // 4. Fill password
    await newPasswordInput.fill('123456');
    await confirmPasswordInput.fill('123456');

    // 5. Close modal
    const closeBtn = page.locator('button:has-text("إلغاء")').first();
    await closeBtn.click();
    await expect(modalTitle).not.toBeVisible();
  });

  test('verifies direct access to /profile page and displays user security & identity sections', async ({ page }) => {
    await page.goto('/profile', { waitUntil: 'networkidle' });

    // 1. Check page title and user identity
    const headerTitle = page.locator('h1:has-text("مستخدم النظام")');
    await expect(headerTitle).toBeVisible({ timeout: 10000 });

    const activeStatusBadge = page.locator('text=حساب نشط');
    await expect(activeStatusBadge).toBeVisible();

    // 2. Check Personal Data section
    const personalDataHeading = page.locator('h2:has-text("بيانات المستخدم الشخصية")');
    await expect(personalDataHeading).toBeVisible();

    // 3. Check Security & Password section on profile page
    const securityHeading = page.locator('h2:has-text("تغيير كلمة المرور والأمان")');
    await expect(securityHeading).toBeVisible();

    const updatePasswordBtn = page.locator('button:has-text("تحديث كلمة المرور")');
    await expect(updatePasswordBtn).toBeVisible();
  });
});
