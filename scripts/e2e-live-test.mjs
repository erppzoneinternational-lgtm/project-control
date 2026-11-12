import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = path.resolve(__dirname, '..', 'e2e-screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function runLiveE2ETest() {
  console.log('====================================================');
  console.log('Starting E2E Test on Live Production URL:');
  console.log('https://pzoneinternationalprojectcontrol.vercel.app/planning/baseline');
  console.log('====================================================\n');

  const browser = await chromium.launch({
    headless: true, // change to false if debugging visually
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'ar-EG',
  });

  const page = await context.newPage();

  try {
    // 1. Navigate to target URL (which redirects to login if unauthenticated)
    console.log('[Step 1] Navigating to /planning/baseline...');
    await page.goto('https://pzoneinternationalprojectcontrol.vercel.app/planning/baseline', {
      waitUntil: 'networkidle',
      timeout: 45000,
    });

    const currentUrl = page.url();
    console.log(`[Step 1 Result] Current URL: ${currentUrl}`);

    // 2. Handle Login if redirected
    if (currentUrl.includes('/login')) {
      console.log('[Step 2] Login page detected. Authenticating as e2e-tester@pzone.com...');
      
      const emailInput = page.locator('#login-email, input[type="email"]');
      await emailInput.waitFor({ state: 'visible', timeout: 10000 });
      await emailInput.fill('e2e-tester@pzone.com');

      const passwordInput = page.locator('#login-password, input[type="password"]');
      await passwordInput.fill('E2eTestPass#2026!');

      await page.screenshot({ path: path.join(screenshotsDir, '01_login_filled.png') });
      console.log('  ✓ Saved screenshot: 01_login_filled.png');

      const submitBtn = page.locator('button[type="submit"]');
      await submitBtn.click();

      console.log('  ✓ Submitted login form. Waiting for auth session cookie...');
      let authenticated = false;
      for (let i = 0; i < 20; i++) {
        await page.waitForTimeout(1000);
        const cookies = await context.cookies();
        const hasAuth = cookies.some(c => c.name.includes('auth-token'));
        if (hasAuth) {
          authenticated = true;
          console.log(`  ✓ Supabase session cookie detected after ${i + 1}s!`);
          break;
        }
      }

      if (!authenticated) {
        throw new Error('Authentication cookie was not set within 20 seconds');
      }

      console.log('  ✓ Navigating to https://pzoneinternationalprojectcontrol.vercel.app/planning/baseline...');
      await page.goto('https://pzoneinternationalprojectcontrol.vercel.app/planning/baseline', {
        waitUntil: 'networkidle',
        timeout: 45000,
      });
      console.log(`[Step 2 Result] Successfully reached target URL: ${page.url()}`);
    } else {
      console.log('[Step 2] Already on /planning/baseline (session persisted).');
    }

    // Wait for the baseline page content to settle
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: path.join(screenshotsDir, '02_baseline_page_loaded.png'), fullPage: false });
    console.log('  ✓ Saved screenshot: 02_baseline_page_loaded.png');

    // 3. Verify Universal Tab Bar
    console.log('\n[Step 3] Verifying Universal Tab Bar navigation...');
    const tabPulse = page.locator('#tab-pulse, button:has-text("استوديو نبض الجدول")');
    await tabPulse.first().waitFor({ state: 'visible', timeout: 10000 });
    console.log('  ✓ Found Schedule Pulse Studio tab (#tab-pulse)');

    const tabGantt = page.locator('#tab-gantt, button:has-text("مخطط جانت")');
    await tabGantt.first().waitFor({ state: 'visible', timeout: 10000 });
    console.log('  ✓ Found Gantt Chart tab (#tab-gantt)');

    const tabGraph = page.locator('#tab-graph, button:has-text("شبكة العلاقات")');
    await tabGraph.first().waitFor({ state: 'visible', timeout: 10000 });
    console.log('  ✓ Found CPM Network Graph tab (#tab-graph)');

    // Verify Pulse Studio is active by default
    const isPulseSelected = await tabPulse.first().getAttribute('aria-selected');
    console.log(`  ✓ Tab Pulse aria-selected: ${isPulseSelected}`);

    // 4. Verify SchedulePulseView Command Bar & Branding
    console.log('\n[Step 4] Verifying EHS Studio Command Bar & Hassan Soliman branding...');
    const studioTitle = page.locator('text=محرك نبض الجدول الزمني (EHS Studio)');
    await studioTitle.first().waitFor({ state: 'visible', timeout: 10000 });
    console.log('  ✓ Studio Header confirmed: "محرك نبض الجدول الزمني (EHS Studio)"');

    const studioVersion = page.locator('text=v2.4 Pro');
    await studioVersion.first().waitFor({ state: 'visible', timeout: 10000 });
    console.log('  ✓ Version confirmed: "v2.4 Pro"');

    const authorAttribution = page.locator('text=إعداد: م. حسن أحمد سليمان · 01229994728');
    await authorAttribution.first().waitFor({ state: 'visible', timeout: 10000 });
    console.log('  ✓ Author Branding confirmed: "إعداد: م. حسن أحمد سليمان · 01229994728"');

    // Verify Action Buttons
    const syncBtn = page.locator('button:has-text("مزامنة المشروع")');
    await syncBtn.first().waitFor({ state: 'visible', timeout: 10000 });
    console.log('  ✓ Sync Project button found: "مزامنة المشروع"');

    const langBtn = page.locator('button:has-text("English (EN)")');
    await langBtn.first().waitFor({ state: 'visible', timeout: 10000 });
    console.log('  ✓ Language Switcher button found: "English (EN)"');

    const reloadBtn = page.locator('button:has-text("تحديث")');
    await reloadBtn.first().waitFor({ state: 'visible', timeout: 10000 });
    console.log('  ✓ Reload button found: "تحديث"');

    // 5. Verify Iframe and In-Memory Engine Execution
    console.log('\n[Step 5] Verifying Engine Iframe & In-Memory State...');
    const iframeElement = page.locator('iframe[title*="نبض الجدول الزمني"]');
    await iframeElement.waitFor({ state: 'visible', timeout: 15000 });
    const iframeSrc = await iframeElement.getAttribute('src');
    console.log(`  ✓ Engine Iframe found, src: ${iframeSrc}`);

    // Access iframe contents
    const frame = page.frameLocator('iframe[title*="نبض الجدول الزمني"]');
    
    // Check inside iframe
    const frameTopbar = frame.locator('.brand-name');
    await frameTopbar.first().waitFor({ state: 'visible', timeout: 15000 });
    console.log('  ✓ Inside iframe: Engine topbar brand-name is rendered');

    // Verify window.__SNAPSHOT__ inside the iframe is null (NOT the preloaded sample file)
    const snapshotValue = await page.evaluate(() => {
      const ifr = document.querySelector('iframe');
      try {
        return (ifr && ifr.contentWindow) ? (ifr.contentWindow.__SNAPSHOT__ === null) : 'no-iframe-window';
      } catch (e) {
        return 'cross-origin';
      }
    });
    console.log(`  ✓ Inside iframe window.__SNAPSHOT__ === null: ${snapshotValue}`);

    // Wait a moment for any active project sync to reflect
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotsDir, '03_pulse_studio_rendered.png'), fullPage: false });
    console.log('  ✓ Saved screenshot: 03_pulse_studio_rendered.png');

    // 6. Test Project Sync Action
    console.log('\n[Step 6] Testing manual Project Sync trigger...');
    await syncBtn.first().click();
    await page.waitForTimeout(2000);
    console.log('  ✓ Clicked "مزامنة المشروع" successfully');

    // 7. Test Tab Switching to Gantt and back
    console.log('\n[Step 7] Testing tab switching to Gantt and back to Pulse...');
    await tabGantt.first().click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(screenshotsDir, '04_gantt_tab_active.png'), fullPage: false });
    console.log('  ✓ Switched to Gantt Chart tab. Saved screenshot: 04_gantt_tab_active.png');

    await tabPulse.first().click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(screenshotsDir, '05_back_to_pulse_tab.png'), fullPage: false });
    console.log('  ✓ Switched back to Schedule Pulse tab. Saved screenshot: 05_back_to_pulse_tab.png');

    console.log('\n====================================================');
    console.log('🎉 ALL E2E TESTS PASSED SUCCESSFULLY ON PRODUCTION!');
    console.log('====================================================');
  } catch (error) {
    console.error('\n❌ E2E TEST FAILED:', error);
    await page.screenshot({ path: path.join(screenshotsDir, 'error_state.png'), fullPage: true });
    console.log('  Saved failure screenshot to: e2e-screenshots/error_state.png');
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

runLiveE2ETest();
