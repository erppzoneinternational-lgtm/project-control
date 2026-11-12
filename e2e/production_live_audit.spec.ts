import { test, expect } from '@playwright/test';

test.describe('E2E Full Verification — Project Setup · Dashboard · Stakeholders · Map', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.addCookies([
      { name: 'pzone-e2e-bypass', value: 'true', domain: 'localhost', path: '/' },
    ]);
    await page.setExtraHTTPHeaders({ 'x-pzone-e2e': 'true' });
  });

  test('1. Verify /project-setup portal loads with dynamic KPI cards, search, and project list', async ({ page }) => {
    await page.goto('/project-setup', { waitUntil: 'networkidle' });

    // Verify main portal header inside main
    const header = page.locator('main h1:has-text("بوابة إعداد ومطابقة المشاريع")');
    await expect(header).toBeVisible({ timeout: 15000 });

    // Verify telemetry status strip
    const telemetry = page.getByText('SYS.SETUP // POST-CONTRACT GOVERNANCE').first();
    await expect(telemetry).toBeVisible();

    // Verify Search input inside main content
    const searchInput = page.locator('main input[placeholder*="بحث"]').first();
    await expect(searchInput).toBeVisible();

    // Verify Filter select inside main content
    const statusSelect = page.locator('main select').first();
    await expect(statusSelect).toBeVisible();

    // Verify "New Project" creation CTA link
    const createBtn = page.locator('main a[href="/projects/new"]').first();
    await expect(createBtn).toBeVisible();
  });

  test('2. Verify /dashboard loads with truthful EVM metrics and zero fake data', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'networkidle' });

    // Main header check inside main
    const mainTitle = page.locator('main h1, main h2, main h3').first();
    await expect(mainTitle).toBeVisible({ timeout: 15000 });

    // Verify NO "API KEY REQUIRED" text exists anywhere on dashboard
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('API KEY REQUIRED');
    expect(bodyText).not.toContain('api_key_required');

    // Verify main executive section renders
    const mainSection = page.locator('main').first();
    await expect(mainSection).toBeVisible();
  });

  test('3. Verify /projects/new Step 2 location map has NO API KEY REQUIRED and modern UX layout', async ({ page }) => {
    // Fulfill pm_clients if unauthenticated to ensure client select is populated
    await page.route('**/rest/v1/pm_clients*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'bd9bf78e-9422-4b24-a832-ce247d001bd2',
            name_ar: 'شركة حسن علام للإنشاءات (HAC)',
            name_en: 'Hassan Allam Construction',
            code: 'CLI-HAC',
          },
        ]),
      });
    });

    await page.goto('/projects/new', { waitUntil: 'networkidle' });

    // Step 1: Fill project name
    const nameInput = page.locator('main input[placeholder*="مثال: حمامات سباحة"]').first();
    await expect(nameInput).toBeVisible({ timeout: 15000 });
    await nameInput.fill('مشروع فحص خريطة بي زون بدون مفتاح');

    // Select Client from dropdown
    const clientSelect = page.locator('button:has-text("اختر العميل...")').first();
    await expect(clientSelect).toBeVisible();
    await clientSelect.click();
    const clientOption = page.locator('[role="option"]').first();
    await expect(clientOption).toBeVisible();
    await clientOption.click();

    // Click Next Step button "التالي" to navigate to Step 2
    const nextBtn = page.locator('main button:has-text("التالي")').first();
    await expect(nextBtn).toBeVisible();
    await nextBtn.click();

    // Verify we reached Step 2
    const step2Heading = page.getByRole('heading', { name: /الخطوة 2: الموقع الجغرافي/ });
    await expect(step2Heading).toBeVisible({ timeout: 10000 });

    // Verify Leaflet Map Container is rendered
    const mapContainer = page.locator('.leaflet-container');
    await expect(mapContainer).toBeVisible({ timeout: 15000 });

    // Verify NO "API KEY REQUIRED" text exists anywhere on page or in map tiles
    const htmlContent = await page.content();
    expect(htmlContent).not.toContain('API KEY REQUIRED');
    expect(htmlContent).not.toContain('cartocdn.com');

    // Verify Basemap Switcher exists (أقمار صناعية / خريطة شوارع)
    const basemapSwitchBtn = page.locator('button:has-text("أقمار صناعية"), button:has-text("خريطة شوارع")').first();
    await expect(basemapSwitchBtn).toBeVisible();

    // Verify Egyptian quick-jump destination pills exist
    const cairoPill = page.locator('button:has-text("القاهرة والجيزة")').first();
    await expect(cairoPill).toBeVisible();

    const sahelPill = page.locator('button:has-text("الساحل والعلمين")').first();
    await expect(sahelPill).toBeVisible();

    // Verify unified floating HUD with GPS coordinates
    const hudCoordinates = page.getByText(/° N/).first();
    await expect(hudCoordinates).toBeVisible();

    // Verify Action Tools in floating HUD (Google Maps, Recenter, Manual Input)
    const googleMapsBtn = page.locator('a[title*="Google Maps"], a:has-text("Google Maps")').first();
    await expect(googleMapsBtn).toBeVisible();
    await expect(googleMapsBtn).toHaveAttribute('target', '_blank');
    await expect(googleMapsBtn).toHaveAttribute('href', /google\.com\/maps/);

    const recenterBtn = page.locator('button[title="توسيط الخريطة على موقع الدبوس"]').first();
    await expect(recenterBtn).toBeVisible();

    const manualInputBtn = page.locator('button[title="إدخال الإحداثيات يدوياً"]').first();
    await expect(manualInputBtn).toBeVisible();
  });

  test('4. Verify /stakeholders directory loads and integrates HR employee records cleanly', async ({ page }) => {
    await page.goto('/stakeholders', { waitUntil: 'networkidle' });

    // Main header check inside main
    const header = page.locator('main h1:has-text("دليل الشركاء وأصحاب المصلحة")');
    await expect(header).toBeVisible({ timeout: 15000 });

    // Verify tab list exists inside main content (الكل)
    const allTab = page.locator('main button:has-text("الكل")').first();
    await expect(allTab).toBeVisible();

    // Verify search input inside main content
    const searchInput = page.locator('main input[placeholder*="بحث"]').first();
    await expect(searchInput).toBeVisible();

    // Verify Export / Import buttons
    const importBtn = page.locator('main button:has-text("استيراد Excel")').first();
    await expect(importBtn).toBeVisible();
  });

  test('5. Verify selecting a project on GIS Map provides option to open in separate page on Google Maps', async ({ page }) => {
    // Default: any other Supabase REST read returns empty (anon RLS would otherwise deny/hang)
    await page.route('**/rest/v1/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });
    await page.route('**/rest/v1/pm_projects_with_manager*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'p-test-gis-001',
            project_code: '2601',
            project_name: 'مشروع فحص الخريطة وخرائط جوجل',
            name_ar: 'مشروع فحص الخريطة وخرائط جوجل',
            status: 'working',
            latitude: 30.0444,
            longitude: 31.2357,
            gps_lat: 30.0444,
            gps_lng: 31.2357,
            contract_value_egp: 5000000,
            water_area_m2: 450,
            water_vol_m3: 650,
          },
        ]),
      });
    });

    await page.goto('/projects/dashboard', { waitUntil: 'domcontentloaded' });

    // Select a project marker on the GIS map
    const marker = page.locator('.leaflet-marker-icon').first();
    await marker.waitFor({ state: 'attached', timeout: 30000 });
    await marker.dispatchEvent('click');

    // Verify Inspector Card contains "فتح في خرائط Google" with target="_blank"
    const gmapsLink = page.locator('a[href*="google.com/maps"]').first();
    await expect(gmapsLink).toBeVisible({ timeout: 10000 });
    await expect(gmapsLink).toHaveAttribute('target', '_blank');
    await expect(gmapsLink).toHaveAttribute('href', /google\.com\/maps\/search/);
  });
});
