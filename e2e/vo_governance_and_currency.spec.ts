import { test, expect, Route } from '@playwright/test';

const TEST_SESSION_COOKIE =
  'base64-eyJhY2Nlc3NfdG9rZW4iOiJleUpoYkdjaU9pSkZVekkxTmlJc0ltdHBaQ0k2SWprd09EVXlZekV4TFdSa1l6RXROREl4WlMwNE9XSTJMVFl6TXpSaFpXTXhOak5pWXlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKcGMzTWlPaUpvZEhSd2N6b3ZMM1JuY1hCamRtbHhiV2QwWkdSa2FYRjJjV1IzTG5OMWNHRmlZWE5sTG1OdkwyRjFkR2d2ZGpFaUxDSnpkV0lpT2lJeE5XWmtOelF3TkMwek56SXdMVFEwWlRjdE9UaG1aQzB4TW1VNU1UZzFZbUkxTXpRaUxDSmhkV1FpT2lKaGRYUm9aVzUwYVdOaGRHVmtJaXdpWlhod0lqb3hOemc1TkRFNU56STJMQ0pwWVhRaU9qRTNPRGswTVRZeE1qWXNJbVZ0WVdsc0lqb2laVEpsTFhSbGMzUmxja0J3ZW05dVpTNWpiMjBpTENKd2FHOXVaU0k2SWlJc0ltRndjRjl0WlhSaFpHRjBZU0k2ZXlKd2NtOTJhV1JsY2lJNkltVnRZV2xzSWl3aWNISnZkbWxrWlhKeklqcGJJbVZ0WVdsc0lsMTlMQ0oxYzJWeVgyMWxkR0ZrWVhSaElqcDdJbVZ0WVdsc1gzWmxjbWxtYVdWa0lqcDBjblZsTENKbWRXeHNYMjVoYldVaU9pSkZNa1VnVkdWemRHVnlJaXdpWm5Wc2JGOXVZVzFsWDJGeUlqb2kyWVhaaDltRzJLX1lzeURZcDltRTJLZllydGlxMktqWXA5aXhJaXdpY205c1pYTWlPbHNpWVdSdGFXNGlMQ0p6YVhSbFgyVnVaMmx1WldWeUlpd2ljR3hoYm01cGJtZGZaVzVuYVc1bFpYSWlMQ0p3Y205cVpXTjBYMjFoYm1GblpYSWlYWDBzSW5KdmJHVWlPaUpoZFhSb1pXNTBhV05oZEdWa0lpd2lZV0ZzSWpvaVlXRnNNU0lzSW1GdGNpSTZXM3NpYldWMGFHOWtJam9pY0dGemMzZHZjbVFpTENKMGFXMWxjM1JoYlhBaU9qRTNPRGswTVRZeE1qWjlYU3dpYzJWemMybHZibDlwWkNJNkltWTNOREEzT1RReExUQTNZamN0TkdRNU55MDRNRFZqTFdZNFlXSTFaVFprTTJJMU5pSXNJbWx6WDJGdWIyNTViVzkxY3lJNlptRnNjMlY5LnRRWmViSkN2Mkt3TlMyNVBTWmwxeGw4YUhRMUhXVGtILWJWVFlGNXprc1Q2XzFSSFFwa0hsakZjWFVRckFIUFVOM3RPT1hOOWx2c3drOXM2SHB0Vlp3IiwidG9rZW5fdHlwZSI6ImJlYXJlciIsImV4cGlyZXNfaW4iOjM2MDAsImV4cGlyZXNfYXQiOjE3ODk0MTk3MjYsInJlZnJlc2hfdG9rZW4iOiJnNzQ3NDdscXV1aWQiLCJ1c2VyIjp7ImlkIjoiMTVmZDc0MDQtMzcyMC00NGU3LTk4ZmQtMTJlOTE4NWJiNTM0IiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiZW1haWwiOiJlMmUtdGVzdGVyQHB6b25lLmNvbSIsImVtYWlsX2NvbmZpcm1lZF9hdCI6IjIwMjYtMDktMTRUMTk6NTc6NDguMjgwMzM3WiIsInBob25lIjoiIiwiY29uZmlybWVkX2F0IjoiMjAyNi0wOS0xNFQxOTo1Nzo0OC4yODAzMzdaIiwibGFzdF9zaWduX2luX2F0IjoiMjAyNi0wOS0xNFQyMDowMjowNi41NTk4MjM4NThaIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWxfdmVyaWZpZWQiOnRydWUsImZ1bGxfbmFtZSI6IkUyRSBUZXN0ZXIiLCJmdWxsX25hbWVfYXIiOiLZhdmH2YbYr9izINin2YTYp9iu2KrYqNin2LEiLCJyb2xlcyI6WyJhZG1pbiIsInNpdGVfZW5naW5lZXIiLCJwbGFubmluZ19lbmdpbmVlciIsInByb2plY3RfbWFuYWdlciJdfSwiaWRlbnRpdGllcyI6W3siaWRlbnRpdHlfaWQiOiI4MTdhODBlOC00YjdlLTQ1NGMtYjg2NC1lOGY1NGE0M2JjZDEiLCJpZCI6IjE1ZmQ3NDA0LTM3MjAtNDRlNy05OGZkLTEyZTkxODViYjUzNCIsInVzZXJfaWQiOiIxNWZkNzQwNC0zNzIwLTQ0ZTctOThmZC0xMmU5MTg1YmI1MzQiLCJpZGVudGl0eV9kYXRhIjp7ImVtYWlsIjoiZTJlLXRlc3RlckBwem9uZS5jb20iLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwic3ViIjoiMTVmZDc0MDQtMzcyMC00NGU3LTk4ZmQtMTJlOTE4NWJiNTM0In0sInByb3ZpZGVyIjoiZW1haWwiLCJsYXN0X3NpZ25faW5fYXQiOiIyMDI2LTA5LTE0VDE5OjU3OjQ4LjI2ODY0N1oiLCJjcmVhdGVkX2F0IjoiMjAyNi0wOS0xNFQxOTo1Nzo0OC4yNjg3MDlaIiwidXBkYXRlZF9hdCI6IjIwMjYtMDktMTRUMTk6NTc6NDguMjY4NzA5WiIsImVtYWlsIjoiZTJlLXRlc3RlckBwem9uZS5jb20ifV0sImNyZWF0ZWRfYXQiOiIyMDI2LTA5LTE0VDE5OjU3OjQ4LjI0NjAzNloiLCJ1cGRhdGVkX2F0IjoiMjAyNi0wOS0xNFQyMDowMjowNi41NjIyNTRaIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0sIndlYWtfcGFzc3dvcmQiOm51bGx9';

test.describe('VO Governance, Tab Quarantine & Currency Alignment to EGP', () => {
  const projectId = 'eab35365-596c-49c1-958c-10bbdb1dbb0f';

  test.beforeEach(async ({ page, context }) => {
    await context.addCookies([
      { name: 'pzone-e2e-bypass', value: 'true', domain: 'localhost', path: '/' },
      {
        name: 'sb-tgqpcviqmgtdddiqvqdw-auth-token',
        value: TEST_SESSION_COOKIE,
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax',
      },
    ]);
    await page.setExtraHTTPHeaders({ 'x-pzone-e2e': 'true' });

    // Seed localStorage for active project and session
    await page.addInitScript(({ token, pid }) => {
      window.localStorage.setItem('sb-tgqpcviqmgtdddiqvqdw-auth-token', token);
      window.localStorage.setItem('pzone_active_project_id', pid);
      window.localStorage.setItem('pzone_active_project', JSON.stringify({
        state: { activeProjectId: pid },
        version: 0,
      }));
      window.localStorage.setItem('project-storage', JSON.stringify({
        state: { activeProjectId: pid },
        version: 0,
      }));
    }, { token: TEST_SESSION_COOKIE, pid: projectId });

    // Mock Supabase Auth endpoint
    await page.route('**/auth/v1/**', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-token',
          token_type: 'bearer',
          expires_in: 86400,
          refresh_token: 'mock-refresh-token',
          user: {
            id: '15fd7404-3720-44e7-98fd-12e9185bb534',
            aud: 'authenticated',
            role: 'authenticated',
            email: 'e2e-tester@pzone.com',
            user_metadata: {
              roles: ['admin', 'project_manager', 'site_engineer', 'planning_engineer', 'cost_control'],
            },
          },
        }),
      });
    });

    // Intercept profile & cost control endpoints to ensure authorized role check
    await page.route('**/rest/v1/**', async (route: Route) => {
      const url = route.request().url();
      const path = new URL(url).pathname;
      const accept = route.request().headers()['accept'] || '';

      if (path.endsWith('/profiles')) {
        const profile = {
          id: '15fd7404-3720-44e7-98fd-12e9185bb534',
          roles: ['admin', 'project_manager', 'commercial_manager', 'cost_control'],
        };
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(accept.includes('vnd.pgrst.object') ? profile : [profile]),
        });
        return;
      }

      if (path.endsWith('/user_roles')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { role: 'admin' },
            { role: 'cost_control' },
          ]),
        });
        return;
      }

      if (path.endsWith('/pm_cost_snapshots')) {
        const snapshot = {
          id: 'snap-1',
          project_id: projectId,
          budget_at_completion: 2500000,
          actual_cost: 850000,
          earned_value: 950000,
          planned_value: 1000000,
          spi: 0.95,
          cpi: 1.12,
          snapshot_date: '2026-09-30',
        };
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(accept.includes('vnd.pgrst.object') ? snapshot : [snapshot]),
        });
        return;
      }

      if (path.endsWith('/pm_budget_lines')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'b-1',
              project_id: projectId,
              cost_code_id: 'C-101',
              description_ar: 'أعمال الخرسانات',
              current_budget: 1000000,
              actual_cost: 400000,
              variance: 600000,
            },
          ]),
        });
        return;
      }

      await route.continue();
    });
  });

  test('1. Strict Tab Quarantine: unapproved tabs via query param fallback to overview and are not rendered', async ({ page }) => {
    // Attempt to access quarantined change_orders tab
    await page.goto(`/projects/${projectId}?tab=change_orders`, { waitUntil: 'networkidle' });

    // Verify Overview content is shown instead
    const overviewHeading = page.locator('h3:has-text("نطاق ومواصفات المشروع"), h3:has-text("Scope"), div:has-text("نظرة عامة")').first();
    await expect(overviewHeading).toBeVisible({ timeout: 15000 });

    // Verify deferred tab buttons are NOT present in the tab navigation bar
    const changeOrdersTabBtn = page.locator('button:has-text("أوامر التغيير")');
    await expect(changeOrdersTabBtn).toHaveCount(0);

    const invoicesTabBtn = page.locator('button:has-text("المستخلصات")');
    await expect(invoicesTabBtn).toHaveCount(0);

    const wbsTabBtn = page.locator('button:has-text("هيكل تجزئة العمل (WBS)")');
    await expect(wbsTabBtn).toHaveCount(0);

    // Attempt to access quarantined invoices tab
    await page.goto(`/projects/${projectId}?tab=invoices`, { waitUntil: 'networkidle' });
    await expect(overviewHeading).toBeVisible();
  });

  test('2. Currency Alignment: Cost Control page uses EGP / ج.م and zero SAR', async ({ page }) => {
    await page.goto('/cost-control', { waitUntil: 'networkidle' });

    // Wait for the cost control page title and cards to render
    const pageHeading = page.locator('h1:has-text("التحكم بالتكاليف")');
    await expect(pageHeading).toBeVisible({ timeout: 15000 });

    // Verify page content contains EGP or ج.م
    const pageText = await page.content();
    expect(pageText).toMatch(/ج\.م|EGP/);

    // Verify zero occurrences of Saudi Riyal (SAR or ر.س)
    expect(pageText).not.toContain('ر.س');
    expect(pageText).not.toContain('SAR');
  });

  test('3. Edit Project Shield: vos_value is read-only, auto-calculated, and shielded against manual overwrite', async ({ page }) => {
    await page.goto(`/projects/${projectId}/edit`, { waitUntil: 'networkidle' });

    // Wait for edit form to load
    const formHeading = page.locator('h1:has-text("تعديل بيانات المشروع")');
    await expect(formHeading).toBeVisible({ timeout: 15000 });

    // Verify auto-calculated badge is visible
    const autoCalcBadge = page.locator('span:has-text("محسوب تلقائياً")');
    await expect(autoCalcBadge.first()).toBeVisible();

    // Verify explanatory note is visible
    const explanatoryNote = page.locator('text=قيمة أوامر التغيير المعتمدة (تُحسب تلقائياً من العقود وأوامر التغيير المعتمدة)');
    await expect(explanatoryNote).toBeVisible();

    // Verify the VOs input is readOnly or disabled
    const vosInput = page.locator('input[readonly]').filter({ has: page.locator('xpath=ancestor::div[contains(., "VOs EGP") or contains(., "أوامر التغيير")]') }).first();
    await expect(vosInput).toBeVisible();
    await expect(vosInput).toBeDisabled();
  });
});
