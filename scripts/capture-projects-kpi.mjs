import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function captureProjects() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1560, height: 1080 },
  });

  const page = await context.newPage();

  console.log('Navigating to http://localhost:3000/login...');
  await page.goto('http://localhost:3000/login', {
    waitUntil: 'networkidle',
    timeout: 30000,
  });

  const emailInput = page.locator('#login-email, input[type="email"]');
  await emailInput.waitFor({ state: 'visible', timeout: 10000 });
  await emailInput.fill('e2e-tester@pzone.com');

  const passwordInput = page.locator('#login-password, input[type="password"]');
  await passwordInput.fill('E2eTestPass#2026!');

  const submitBtn = page.locator('button[type="submit"]');
  await submitBtn.click();

  console.log('Waiting for authentication...');
  await page.waitForNavigation({ timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);

  console.log('Navigating to http://localhost:3000/projects...');
  await page.goto('http://localhost:3000/projects', {
    waitUntil: 'networkidle',
    timeout: 30000,
  });

  await page.waitForTimeout(3000);

  const outputPath = path.join(__dirname, '..', 'projects-kpis-authenticated.png');
  await page.screenshot({ path: outputPath, fullPage: false });
  console.log(`Saved screenshot to ${outputPath}`);

  // Switch to Kanban Tab
  console.log('Switching to Kanban view...');
  const kanbanTab = page.locator('#view-tab-kanban');
  await kanbanTab.click();
  await page.waitForTimeout(2000);

  const kanbanOutputPath = path.join(__dirname, '..', 'projects-kanban-tender.png');
  await page.screenshot({ path: kanbanOutputPath, fullPage: false });
  console.log(`Saved screenshot to ${kanbanOutputPath}`);

  await browser.close();
}

captureProjects().catch((err) => {
  console.error(err);
  process.exit(1);
});
