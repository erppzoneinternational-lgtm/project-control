import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function testTour() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  // Set e2e bypass cookie
  await context.addCookies([
    {
      name: 'pzone-e2e-bypass',
      value: 'true',
      domain: 'localhost',
      path: '/',
    },
  ]);

  const page = await context.newPage();

  console.log('Navigating to http://localhost:3000/schedule-pulse...');
  await page.goto('http://localhost:3000/schedule-pulse', {
    waitUntil: 'networkidle',
    timeout: 30000,
  });

  // Wait for the Guide & Tour button
  console.log('Waiting for #tour-guide-btn...');
  await page.waitForSelector('#tour-guide-btn', { timeout: 15000 });

  // Click Guide & Tour
  await page.click('#tour-guide-btn');
  await page.waitForTimeout(500);

  // Take screenshot of guide modal
  await page.screenshot({ path: path.join(__dirname, '..', 'tour-guide-modal.png') });
  console.log('Saved tour-guide-modal.png');

  // Click start interactive tour
  const startBtn = page.locator('button:has-text("بدء الجولة التفاعلية الحية")');
  await startBtn.click();
  await page.waitForTimeout(1000);

  // Take screenshot of Step 1 (Project Info)
  await page.screenshot({ path: path.join(__dirname, '..', 'tour-step-1.png') });
  console.log('Saved tour-step-1.png');

  // Click Next until Step 4 (Language button)
  for (let i = 0; i < 3; i++) {
    await page.click('button:has-text("التالي")');
    await page.waitForTimeout(500);
  }

  // Take screenshot of Step 4 (Language button spotlight!)
  await page.screenshot({ path: path.join(__dirname, '..', 'tour-step-4-lang.png') });
  console.log('Saved tour-step-4-lang.png');

  await browser.close();
  console.log('Done!');
}

testTour().catch(err => {
  console.error('Error running test:', err);
  process.exit(1);
});
