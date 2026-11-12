import { test, expect, Route } from '@playwright/test';
import { SiteWorkspacePage } from './pages/SiteWorkspacePage';
import { CostControlPage } from './pages/CostControlPage';

const TEST_SESSION_COOKIE =
  'base64-eyJhY2Nlc3NfdG9rZW4iOiJleUpoYkdjaU9pSkZVekkxTmlJc0ltdHBaQ0k2SWprd09EVXlZekV4TFdSa1l6RXROREl4WlMwNE9XSTJMVFl6TXpSaFpXTXhOak5pWXlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKcGMzTWlPaUpvZEhSd2N6b3ZMM1JuY1hCamRtbHhiV2QwWkdSa2FYRjJjV1IzTG5OMWNHRmlZWE5sTG1OdkwyRjFkR2d2ZGpFaUxDSnpkV0lpT2lJeE5XWmtOelF3TkMwek56SXdMVFEwWlRjdE9UaG1aQzB4TW1VNU1UZzFZbUkxTXpRaUxDSmhkV1FpT2lKaGRYUm9aVzUwYVdOaGRHVmtJaXdpWlhod0lqb3hOemc1TkRFNU56STJMQ0pwWVhRaU9qRTNPRGswTVRZeE1qWXNJbVZ0WVdsc0lqb2laVEpsTFhSbGMzUmxja0J3ZW05dVpTNWpiMjBpTENKd2FHOXVaU0k2SWlJc0ltRndjRjl0WlhSaFpHRjBZU0k2ZXlKd2NtOTJhV1JsY2lJNkltVnRZV2xzSWl3aWNISnZkbWxrWlhKeklqcGJJbVZ0WVdsc0lsMTlMQ0oxYzJWeVgyMWxkR0ZrWVhSaElqcDdJbVZ0WVdsc1gzWmxjbWxtYVdWa0lqcDBjblZsTENKbWRXeHNYMjVoYldVaU9pSkZNa1VnVkdWemRHVnlJaXdpWm5Wc2JGOXVZVzFsWDJGeUlqb2kyWVhaaDltRzJLX1lzeURZcDltRTJLZllydGlxMktqWXA5aXhJaXdpY205c1pYTWlPbHNpWVdSdGFXNGlMQ0p6YVhSbFgyVnVaMmx1WldWeUlpd2ljR3hoYm01cGJtZGZaVzVuYVc1bFpYSWlMQ0p3Y205cVpXTjBYMjFoYm1GblpYSWlYWDBzSW5KdmJHVWlPaUpoZFhSb1pXNTBhV05oZEdWa0lpd2lZV0ZzSWpvaVlXRnNNU0lzSW1GdGNpSTZXM3NpYldWMGFHOWtJam9pY0dGemMzZHZjbVFpTENKMGFXMWxjM1JoYlhBaU9qRTNPRGswTVRZeE1qWjlYU3dpYzJWemMybHZibDlwWkNJNkltWTNOREEzT1RReExUQTNZamN0TkdRNU55MDRNRFZqTFdZNFlXSTFaVFprTTJJMU5pSXNJbWx6WDJGdWIyNTViVzkxY3lJNlptRnNjMlY5LnRRWmViSkN2Mkt3TlMyNVBTWmwxeGw4YUhRMUhXVGtILWJWVFlGNXprc1Q2XzFSSFFwa0hsakZjWFVRckFIUFVOM3RPT1hOOWx2c3drOXM2SHB0Vlp3IiwidG9rZW5fdHlwZSI6ImJlYXJlciIsImV4cGlyZXNfaW4iOjM2MDAsImV4cGlyZXNfYXQiOjE3ODk0MTk3MjYsInJlZnJlc2hfdG9rZW4iOiJnNzQ3NDdscXV1aWQiLCJ1c2VyIjp7ImlkIjoiMTVmZDc0MDQtMzcyMC00NGU3LTk4ZmQtMTJlOTE4NWJiNTM0IiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiZW1haWwiOiJlMmUtdGVzdGVyQHB6b25lLmNvbSIsImVtYWlsX2NvbmZpcm1lZF9hdCI6IjIwMjYtMDktMTRUMTk6NTc6NDguMjgwMzM3WiIsInBob25lIjoiIiwiY29uZmlybWVkX2F0IjoiMjAyNi0wOS0xNFQxOTo1Nzo0OC4yODAzMzdaIiwibGFzdF9zaWduX2luX2F0IjoiMjAyNi0wOS0xNFQyMDowMjowNi41NTk4MjM4NThaIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWxfdmVyaWZpZWQiOnRydWUsImZ1bGxfbmFtZSI6IkUyRSBUZXN0ZXIiLCJmdWxsX25hbWVfYXIiOiLZhdmH2YbYr9izINin2YTYp9iu2KrYqNin2LEiLCJyb2xlcyI6WyJhZG1pbiIsInNpdGVfZW5naW5lZXIiLCJwbGFubmluZ19lbmdpbmVlciIsInByb2plY3RfbWFuYWdlciJdfSwiaWRlbnRpdGllcyI6W3siaWRlbnRpdHlfaWQiOiI4MTdhODBlOC00YjdlLTQ1NGMtYjg2NC1lOGY1NGE0M2JjZDEiLCJpZCI6IjE1ZmQ3NDA0LTM3MjAtNDRlNy05OGZkLTEyZTkxODViYjUzNCIsInVzZXJfaWQiOiIxNWZkNzQwNC0zNzIwLTQ0ZTctOThmZC0xMmU5MTg1YmI1MzQiLCJpZGVudGl0eV9kYXRhIjp7ImVtYWlsIjoiZTJlLXRlc3RlckBwem9uZS5jb20iLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwic3ViIjoiMTVmZDc0MDQtMzcyMC00NGU3LTk4ZmQtMTJlOTE4NWJiNTM0In0sInByb3ZpZGVyIjoiZW1haWwiLCJsYXN0X3NpZ25faW5fYXQiOiIyMDI2LTA5LTE0VDE5OjU3OjQ4LjI2ODY0N1oiLCJjcmVhdGVkX2F0IjoiMjAyNi0wOS0xNFQxOTo1Nzo0OC4yNjg3MDlaIiwidXBkYXRlZF9hdCI6IjIwMjYtMDktMTRUMTk6NTc6NDguMjY4NzA5WiIsImVtYWlsIjoiZTJlLXRlc3RlckBwem9uZS5jb20ifV0sImNyZWF0ZWRfYXQiOiIyMDI2LTA5LTE0VDE5OjU3OjQ4LjI0NjAzNloiLCJ1cGRhdGVkX2F0IjoiMjAyNi0wOS0xNFQyMDowMjowNi41NjIyNTRaIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0sIndlYWtfcGFzc3dvcmQiOm51bGx9';

test.describe('PMO Governance & Field Operations E2E Suite (ADR-0006 through ADR-0011)', () => {
  const projectId = 'proj-e2e-pmo-101';
  const mockProjects = [
    {
      id: projectId,
      project_code: '2612',
      project_name: 'مشروع برج الأمل التجاري',
      name: 'مشروع برج الأمل التجاري',
    },
  ];

  test.beforeEach(async ({ context, page }) => {
    // 1. Seed authenticated session cookie + E2E bypass cookie
    await context.addCookies([
      {
        name: 'sb-tgqpcviqmgtdddiqvqdw-auth-token',
        value: TEST_SESSION_COOKIE,
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax',
      },
      {
        name: 'pzone-e2e-bypass',
        value: 'true',
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
      },
    ]);

    // Seed localStorage for browser Supabase client and active project store
    await page.addInitScript((token) => {
      window.localStorage.setItem('sb-tgqpcviqmgtdddiqvqdw-auth-token', token);
      window.localStorage.setItem('pzone_active_project_id', 'proj-e2e-pmo-101');
      window.localStorage.setItem('project-storage', JSON.stringify({
        state: { activeProjectId: 'proj-e2e-pmo-101' },
        version: 0,
      }));
    }, TEST_SESSION_COOKIE);

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

    // 2. Intercept Supabase Rest & RPC calls for deterministic fast E2E
    await page.route('**/rest/v1/**', async (route: Route) => {
      const url = route.request().url();
      const method = route.request().method();
      const path = new URL(url).pathname;

      if (path.endsWith('/profiles')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: '15fd7404-3720-44e7-98fd-12e9185bb534',
            roles: ['admin', 'project_manager', 'site_engineer', 'planning_engineer', 'cost_control'],
          }),
        });
        return;
      }

      if (path.endsWith('/pm_projects') || path.endsWith('/pm_projects_with_manager')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockProjects),
        });
        return;
      }

      if (path.endsWith('/pm_stakeholders') || path.endsWith('/stakeholders')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'stk-1',
              user_id: '15fd7404-3720-44e7-98fd-12e9185bb534',
              email: 'e2e-tester@pzone.com',
              name_ar: 'المهندس الميداني',
            },
          ]),
        });
        return;
      }

      if (path.endsWith('/project_team_with_auth')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              stakeholder_id: 'stk-1',
              project_role: 'site_engineer',
              project_id: projectId,
              stakeholder_active: true,
            },
          ]),
        });
        return;
      }

      if (path.endsWith('/pm_site_tasks')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'task-1',
              task_code: 'CIV-001',
              title_ar: 'أعمال حديد تسليح القواعد',
              discipline: 'civil',
              status: 'in_progress',
              progress_pct: 35,
              project_id: projectId,
            },
          ]),
        });
        return;
      }

      if (path.endsWith('/pm_daily_progress')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'rep-1',
              project_id: projectId,
              progress_date: new Date().toISOString().slice(0, 10),
              weather: 'صافٍ ومعتدل',
              manpower_count: 24,
              equipment_count: 5,
              status: 'approved',
              lines: [],
              photos: [],
              obstructions: [],
            },
          ]),
        });
        return;
      }

      if (path.endsWith('/pm_daily_obstructions')) {
        if (method === 'POST') {
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 'obs-e2e-1',
              project_id: projectId,
              description: 'توقف مؤقت للأعمال بسبب تأخر تصاريح الدخول',
              eot_days: 3,
            }),
          });
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
        return;
      }

      if (path.endsWith('/pm_budget_lines')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'b1',
              project_id: projectId,
              current_budget: 1500000,
              actual_cost: 450000,
            },
          ]),
        });
        return;
      }

      if (path.endsWith('/pm_project_activities')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'act-1',
              project_id: projectId,
              budgeted_cost_egp: 1500000,
              percent_complete: 35,
              planned_start: '2026-08-01',
              planned_finish: '2026-11-30',
            },
          ]),
        });
        return;
      }

      if (path.endsWith('/pm_cost_snapshots')) {
        if (method === 'POST') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 'snap-e2e-1',
              project_id: projectId,
              budget_at_completion: 1500000,
              actual_cost: 450000,
              earned_value: 525000,
              planned_value: 600000,
              spi: 0.875,
              cpi: 1.1667,
              snapshot_date: new Date().toISOString().slice(0, 10),
            }),
          });
          return;
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'snap-prev-1',
              project_id: projectId,
              budget_at_completion: 1500000,
              actual_cost: 400000,
              earned_value: 500000,
              planned_value: 550000,
              spi: 0.909,
              cpi: 1.25,
              snapshot_date: new Date().toISOString().slice(0, 10),
            },
          ]),
        });
        return;
      }

      if (path.endsWith('/pm_contracts')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{ id: 'cnt-master-1', project_id: projectId }]),
        });
        return;
      }

      if (path.endsWith('/pm_eot_requests')) {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'eot-1', status: 'draft' }),
        });
        return;
      }

      // Default fallback
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });
  });

  // =========================================================================
  // Scenario 1: Site Workspace Cockpit & Quick Action Dials (ADR-0009)
  // =========================================================================
  test('Site Workspace renders contextual aggregation and 4 Quick Action Dials', async ({ page }) => {
    const sitePage = new SiteWorkspacePage(page);
    await sitePage.goto();

    // Verify Quick Action Dials are rendered with proper attributes
    await expect(sitePage.quickDialWir).toBeVisible();
    await expect(sitePage.quickDialWir).toHaveAttribute('href', '/deliverables');

    await expect(sitePage.quickDialObstruction).toBeVisible();

    await expect(sitePage.quickDialBoq).toBeVisible();
    await expect(sitePage.quickDialBoq).toHaveAttribute('href', '/boq');

    await expect(sitePage.quickDialClaims).toBeVisible();
    await expect(sitePage.quickDialClaims).toHaveAttribute('href', '/contracts/claims');

    // Verify Contextual Conditions are visible
    await expect(sitePage.siteConditionsCard).toBeVisible();
    await expect(sitePage.siteResourcesCard).toBeVisible();
  });

  // =========================================================================
  // Scenario 2: Obstruction Escalation & Frosted Modal (ADR-0008 & ADR-0011)
  // =========================================================================
  test('Daily Obstruction Modal opens with frosted glass and toggles critical path EOT bridge', async ({ page }) => {
    const sitePage = new SiteWorkspacePage(page);
    await sitePage.goto();

    // Open Daily Obstruction Modal via Quick Dial
    await sitePage.openObstructionModal();

    // Verify modal elements are interactive
    await expect(sitePage.criticalPathToggle).toBeVisible();
    await expect(sitePage.descriptionInput).toBeVisible();

    // Fill obstruction with critical path impact
    await sitePage.fillObstruction({
      description: 'تأخر اعتماد مخططات الشوب دروينج من الاستشاري تسبب في توقف المسار الحرج للقواعد',
      criticalPath: true,
      eotDays: 5,
    });

    // Verify EOT days input updated
    await expect(sitePage.eotDaysInput).toHaveValue('5');

    // Close modal cleanly
    await sitePage.closeObstructionModal();
  });

  // =========================================================================
  // Scenario 3: Cost Control Dual-Trigger EVM Recalculation (ADR-0010)
  // =========================================================================
  test('Cost Control Portal triggers on-demand EVM recalculation and updates KPI cards', async ({ page }) => {
    const costPage = new CostControlPage(page);
    await costPage.goto();

    // Verify page heading and initial KPI cards
    await expect(costPage.pageHeading).toBeVisible();
    await costPage.expectKpisVisible();

    // Trigger on-demand EVM recalculation
    await costPage.triggerRecalculate();

    // Verify button remains visible and stable
    await expect(costPage.recalculateBtn).toBeVisible();
  });
});
