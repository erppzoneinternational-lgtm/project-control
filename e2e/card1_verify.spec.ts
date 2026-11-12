import { test } from '@playwright/test';

test('capture first card visual states', async ({ page }) => {
  // Set bypass cookie for instant dashboard access
  await page.context().addCookies([
    {
      name: 'pzone-e2e-bypass',
      value: 'true',
      domain: 'localhost',
      path: '/',
    },
  ]);

  // Navigate to dashboard
  await page.goto('http://localhost:3000/dashboard');
  await page.waitForLoadState('networkidle');

  // Wait for dashboard container
  await page.waitForSelector('text=المحفظة الاستثمارية الإجمالية', { timeout: 15000 });

  // 1. S-Curve View Screenshot (Portfolio)
  await page.screenshot({
    path: 'C:/Users/Hassan/.gemini/antigravity/brain/637b3b7f-7b7e-4f0c-b95c-c7b7072274d2/card1_scurve_portfolio.png',
    fullPage: false,
  });

  // 2. Click "المستخلصات الشهرية" (Monthly Billings) using ElectricNav
  const billingsBtn = page.locator('button', { hasText: 'المستخلصات الشهرية' });
  await billingsBtn.click();
  await page.waitForTimeout(600); // Wait for surge animation
  await page.screenshot({
    path: 'C:/Users/Hassan/.gemini/antigravity/brain/637b3b7f-7b7e-4f0c-b95c-c7b7072274d2/card1_monthly_billings.png',
    fullPage: false,
  });

  // 3. Click "مهام المواقع" (Site Tasks) using ElectricNav
  const tasksBtn = page.locator('button', { hasText: 'مهام المواقع' });
  await tasksBtn.click();
  await page.waitForTimeout(600);
  await page.screenshot({
    path: 'C:/Users/Hassan/.gemini/antigravity/brain/637b3b7f-7b7e-4f0c-b95c-c7b7072274d2/card1_site_tasks.png',
    fullPage: false,
  });

  // 4. Click back to S-Curve and switch scope to "المشروع المميز"
  const scurveBtn = page.locator('button', { hasText: 'منحنى S-Curve' });
  await scurveBtn.click();
  await page.waitForTimeout(400);

  const projectScopeBtn = page.locator('button', { hasText: 'المشروع المميز' });
  await projectScopeBtn.click();
  await page.waitForTimeout(600);
  await page.screenshot({
    path: 'C:/Users/Hassan/.gemini/antigravity/brain/637b3b7f-7b7e-4f0c-b95c-c7b7072274d2/card1_project_scope_scurve.png',
    fullPage: false,
  });
});
