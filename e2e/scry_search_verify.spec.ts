import { test, expect } from '@playwright/test';

test.describe('ScrySearch 3D Flip Search Animation Verification', () => {
  test('TopNav and Dashboard 3D flip search interaction', async ({ page }) => {
    // 0. Set bypass cookie for instant dashboard access
    await page.context().addCookies([
      {
        name: 'pzone-e2e-bypass',
        value: 'true',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // 1. Go to dashboard
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('text=المحفظة الاستثمارية الإجمالية', { timeout: 15000 });

    // 2. Locate TopNav Search Trigger (first role="search" on page)
    const topNavSearch = page.locator('[role="search"]').first();
    await expect(topNavSearch).toBeVisible();

    // Screenshot initial compact button state in TopNav
    await page.screenshot({
      path: 'C:/Users/Hassan/.gemini/antigravity/brain/637b3b7f-7b7e-4f0c-b95c-c7b7072274d2/scry_topnav_closed.png',
      fullPage: false,
    });

    // 3. Click search button to trigger 3D flip open
    const topNavBtn = topNavSearch.locator('button');
    await topNavBtn.click();
    await page.waitForTimeout(700); // 0.633s 3D flip animation

    // Screenshot flipped open state in TopNav
    await page.screenshot({
      path: 'C:/Users/Hassan/.gemini/antigravity/brain/637b3b7f-7b7e-4f0c-b95c-c7b7072274d2/scry_topnav_opened.png',
      fullPage: false,
    });

    // 4. Test Dashboard Action Bar Search (second role="search" on page) WHILE on dashboard
    const dashSearch = page.locator('[role="search"]').nth(1);
    await expect(dashSearch).toBeVisible();

    const dashInput = dashSearch.locator('input[type="search"]');
    await dashInput.fill('مشروع 2402');
    await page.waitForTimeout(400);

    await page.screenshot({
      path: 'C:/Users/Hassan/.gemini/antigravity/brain/637b3b7f-7b7e-4f0c-b95c-c7b7072274d2/scry_dashboard_bar.png',
      fullPage: false,
    });

    // 5. Clear dashboard input
    const dashBtn = dashSearch.locator('button');
    await dashBtn.click();
    await page.waitForTimeout(300);

    // 6. Now type in TopNav search to trigger routing to projects
    const topNavInput = topNavSearch.locator('input[type="search"]');
    await topNavInput.fill('Soul Parcel');
    await page.waitForTimeout(600);

    // Screenshot with text and 'X' clear button
    await page.screenshot({
      path: 'C:/Users/Hassan/.gemini/antigravity/brain/637b3b7f-7b7e-4f0c-b95c-c7b7072274d2/scry_topnav_typing.png',
      fullPage: false,
    });

    // 7. Test Projects Page Search
    await page.goto('http://localhost:3000/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const projectsSearch = page.locator('[role="search"]').nth(1);
    await expect(projectsSearch).toBeVisible();

    await page.screenshot({
      path: 'C:/Users/Hassan/.gemini/antigravity/brain/637b3b7f-7b7e-4f0c-b95c-c7b7072274d2/scry_projects_page.png',
      fullPage: false,
    });
  });
});
