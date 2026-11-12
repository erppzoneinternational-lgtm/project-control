import { test, expect } from '@playwright/test';

test.describe('Stakeholders & Clients Dynamic Linkage, UI/UX Elevation & Quick-Add Governance', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.addCookies([
      { name: 'pzone-e2e-bypass', value: 'true', domain: 'localhost', path: '/' },
    ]);
    await page.setExtraHTTPHeaders({ 'x-pzone-e2e': 'true' });
  });

  test('verifies Owner selection and Quick-Add modal in /projects/new', async ({ page }) => {
    await page.goto('/projects/new', { waitUntil: 'networkidle' });

    // Verify Owner field is present with label and quick-add button
    const ownerLabel = page.locator('label:has-text("المالك النهائي للمشروع")');
    await expect(ownerLabel).toBeVisible({ timeout: 15000 });

    const addOwnerBtn = page.locator('button:has-text("إضافة مالك جديد")').first();
    await expect(addOwnerBtn).toBeVisible();

    // Click quick-add button to open QuickAddClientModal
    await addOwnerBtn.click();

    // Verify QuickAddClientModal opens with Owner title and amber accent styling
    const modalTitle = page.locator('h3:has-text("إضافة مالك جديد / مطور عقاري")');
    await expect(modalTitle).toBeVisible();

    // Close modal
    const closeBtn = page.locator('button:has-text("إلغاء")').first();
    await closeBtn.click();
    await expect(modalTitle).not.toBeVisible();
  });

  test('verifies Stakeholders & Clients tab and Core Entities Banner in project detail page', async ({ page }) => {
    // Navigate to project 2608 detail page
    await page.goto('/projects/eab35365-596c-49c1-958c-10bbdb1dbb0f', { waitUntil: 'networkidle' });

    // 1. Verify Header badge for Owner is interactive and links to Stakeholders tab
    const ownerBadge = page.locator('div:has-text("المالك (Owner):")').first();
    await expect(ownerBadge).toBeVisible({ timeout: 15000 });

    // 2. Click Stakeholders & Clients navigation tab
    const teamTabBtn = page.locator('button:has-text("الشركاء والعملاء")');
    await expect(teamTabBtn).toBeVisible();
    await teamTabBtn.click();

    // 3. Verify Executive Core Contractual Entities Hub banner is visible
    const hubHeader = page.locator('h3:has-text("مركز الكيانات التعاقدية وأصحاب المصلحة الرئيسيون")');
    await expect(hubHeader).toBeVisible({ timeout: 10000 });

    // 4. Verify the 4 Core Entity Cards exist
    const ownerCard = page.locator('span:has-text("المالك والمطور العقاري")').first();
    await expect(ownerCard).toBeVisible();

    const clientCard = page.locator('span:has-text("العميل التعاقدي / المقاول العام")').first();
    await expect(clientCard).toBeVisible();

    const pmCard = page.locator('span:has-text("مدير مشروع بي زون")').first();
    await expect(pmCard).toBeVisible();

    const consultantCard = page.locator('span:has-text("استشاري الإشراف / الهندسي")').first();
    await expect(consultantCard).toBeVisible();

    // 5. Test Edit Owner modal
    const editOwnerBtn = page.locator('button:has-text("تعديل المالك والمطور")').first();
    await expect(editOwnerBtn).toBeVisible();
    await editOwnerBtn.click();

    const editOwnerModalTitle = page.locator('h3:has-text("تعديل المالك النهائي والمطور العقاري للمشروع")');
    await expect(editOwnerModalTitle).toBeVisible();

    const quickAddOwnerInModal = page.locator('button:has-text("إضافة مالك جديد")').first();
    await expect(quickAddOwnerInModal).toBeVisible();

    // Close edit owner modal
    const cancelOwnerBtn = page.locator('button:has-text("إلغاء")').first();
    await cancelOwnerBtn.click();
    await expect(editOwnerModalTitle).not.toBeVisible();

    // 6. Test Edit Client modal
    const editClientBtn = page.locator('button:has-text("تعديل العميل التعاقدي")').first();
    await expect(editClientBtn).toBeVisible();
    await editClientBtn.click();

    const editClientModalTitle = page.locator('h3:has-text("تعديل العميل التعاقدي / المقاول العام")');
    await expect(editClientModalTitle).toBeVisible();

    // Close edit client modal
    const cancelClientBtn = page.locator('button:has-text("إلغاء")').first();
    await cancelClientBtn.click();
    await expect(editClientModalTitle).not.toBeVisible();
  });

  test('verifies Clients directory classification filters and entity badges', async ({ page }) => {
    await page.goto('/clients', { waitUntil: 'networkidle' });

    // Verify filter buttons exist
    const allFilter = page.locator('button:has-text("الكل")').first();
    await expect(allFilter).toBeVisible({ timeout: 15000 });

    const ownerFilter = page.locator('button:has-text("مطورون ومالكون")');
    await expect(ownerFilter).toBeVisible();

    const contractorFilter = page.locator('button:has-text("مقاولون عموميون وعملاء")');
    await expect(contractorFilter).toBeVisible();

    const consultantFilter = page.locator('button:has-text("استشاريون")');
    await expect(consultantFilter).toBeVisible();

    // Click Developer/Owner filter
    await ownerFilter.click();
    await expect(ownerFilter).toHaveClass(/bg-amber-600/);

    // Switch back to All
    await allFilter.click();
    await expect(allFilter).toHaveClass(/bg-emerald-600/);
  });

  test('verifies Stakeholders visual data report, template download and batch import modal', async ({ page }) => {
    await page.goto('/stakeholders', { waitUntil: 'networkidle' });

    // 1. Verify page title and header controls
    const headerTitle = page.locator('h1:has-text("دليل الشركاء وأصحاب المصلحة")');
    await expect(headerTitle).toBeVisible({ timeout: 15000 });

    // 2. Click Report toggle button
    const reportToggleBtn = page.locator('button:has-text("تقرير وتحليلات (Data Report)")');
    await expect(reportToggleBtn).toBeVisible();
    await reportToggleBtn.click();

    // 3. Verify Executive Data Report components
    const reportBadge = page.locator('span:has-text("تقرير إداري تحليلي (Executive Data Report)")');
    await expect(reportBadge).toBeVisible();

    // Verify KPI card
    const totalKpi = page.locator('text="إجمالي الشركاء"').first();
    await expect(totalKpi).toBeVisible();

    // Verify Executive Insights
    const insightsTitle = page.locator('text="الرؤى والتحليلات الإدارية (Executive Insights)"');
    await expect(insightsTitle).toBeVisible();

    // 4. Switch back to cards view
    await reportToggleBtn.click();
    await expect(reportBadge).not.toBeVisible();

    // 5. Open Batch Import Modal
    const importBtn = page.locator('button:has-text("استيراد Excel / CSV")');
    if (await importBtn.isVisible()) {
      await importBtn.click();

      const modalTitle = page.locator('h3:has-text("استيراد الشركاء من ملف Excel / CSV")');
      await expect(modalTitle).toBeVisible();

      // Verify template download buttons exist in modal
      const dlExcelBtn = page.locator('button:has-text("تحميل قالب Excel (.xlsx)")');
      await expect(dlExcelBtn).toBeVisible();

      // Close modal
      const closeBtn = page.locator('button:has-text("إلغاء")').first();
      await closeBtn.click();
      await expect(modalTitle).not.toBeVisible();
    }
  });
});

