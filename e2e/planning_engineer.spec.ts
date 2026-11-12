import { test, expect, Route } from '@playwright/test';

const TEST_SESSION_COOKIE =
  'base64-eyJhY2Nlc3NfdG9rZW4iOiJleUpoYkdjaU9pSkZVekkxTmlJc0ltdHBaQ0k2SWprd09EVXlZekV4TFdSa1l6RXROREl4WlMwNE9XSTJMVFl6TXpSaFpXTXhOak5pWXlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKcGMzTWlPaUpvZEhSd2N6b3ZMM1JuY1hCamRtbHhiV2QwWkdSa2FYRjJjV1IzTG5OMWNHRmlZWE5sTG1OdkwyRjFkR2d2ZGpFaUxDSnpkV0lpT2lJeE5XWmtOelF3TkMwek56SXdMVFEwWlRjdE9UaG1aQzB4TW1VNU1UZzFZbUkxTXpRaUxDSmhkV1FpT2lKaGRYUm9aVzUwYVdOaGRHVmtJaXdpWlhod0lqb3hOemc1TkRFNU56STJMQ0pwWVhRaU9qRTNPRGswTVRZeE1qWXNJbVZ0WVdsc0lqb2laVEpsTFhSbGMzUmxja0J3ZW05dVpTNWpiMjBpTENKd2FHOXVaU0k2SWlJc0ltRndjRjl0WlhSaFpHRjBZU0k2ZXlKd2NtOTJhV1JsY2lJNkltVnRZV2xzSWl3aWNISnZkbWxrWlhKeklqcGJJbVZ0WVdsc0lsMTlMQ0oxYzJWeVgyMWxkR0ZrWVhSaElqcDdJbVZ0WVdsc1gzWmxjbWxtYVdWa0lqcDBjblZsTENKbWRXeHNYMjVoYldVaU9pSkZNa1VnVkdWemRHVnlJaXdpWm5Wc2JGOXVZVzFsWDJGeUlqb2kyWVhaaDltRzJLX1lzeURZcDltRTJLZllydGlxMktqWXA5aXhJaXdpY205c1pYTWlPbHNpWVdSdGFXNGlMQ0p6YVhSbFgyVnVaMmx1WldWeUlpd2ljR3hoYm01cGJtZGZaVzVuYVc1bFpYSWlMQ0p3Y205cVpXTjBYMjFoYm1GblpYSWlYWDBzSW5KdmJHVWlPaUpoZFhSb1pXNTBhV05oZEdWa0lpd2lZV0ZzSWpvaVlXRnNNU0lzSW1GdGNpSTZXM3NpYldWMGFHOWtJam9pY0dGemMzZHZjbVFpTENKMGFXMWxjM1JoYlhBaU9qRTNPRGswTVRZeE1qWjlYU3dpYzJWemMybHZibDlwWkNJNkltWTNOREEzT1RReExUQTNZamN0TkdRNU55MDRNRFZqTFdZNFlXSTFaVFprTTJJMU5pSXNJbWx6WDJGdWIyNTViVzkxY3lJNlptRnNjMlY5LnRRWmViSkN2Mkt3TlMyNVBTWmwxeGw4YUhRMUhXVGtILWJWVFlGNXprc1Q2XzFSSFFwa0hsakZjWFVRckFIUFVOM3RPT1hOOWx2c3drOXM2SHB0Vlp3IiwidG9rZW5fdHlwZSI6ImJlYXJlciIsImV4cGlyZXNfaW4iOjM2MDAsImV4cGlyZXNfYXQiOjE3ODk0MTk3MjYsInJlZnJlc2hfdG9rZW4iOiJnNzQ3NDdscXV1aWQiLCJ1c2VyIjp7ImlkIjoiMTVmZDc0MDQtMzcyMC00NGU3LTk4ZmQtMTJlOTE4NWJiNTM0IiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiZW1haWwiOiJlMmUtdGVzdGVyQHB6b25lLmNvbSIsImVtYWlsX2NvbmZpcm1lZF9hdCI6IjIwMjYtMDktMTRUMTk6NTc6NDguMjgwMzM3WiIsInBob25lIjoiIiwiY29uZmlybWVkX2F0IjoiMjAyNi0wOS0xNFQxOTo1Nzo0OC4yODAzMzdaIiwibGFzdF9zaWduX2luX2F0IjoiMjAyNi0wOS0xNFQyMDowMjowNi41NTk4MjM4NThaIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWxfdmVyaWZpZWQiOnRydWUsImZ1bGxfbmFtZSI6IkUyRSBUZXN0ZXIiLCJmdWxsX25hbWVfYXIiOiLZhdmH2YbYr9izINin2YTYp9iu2KrYqNin2LEiLCJyb2xlcyI6WyJhZG1pbiIsInNpdGVfZW5naW5lZXIiLCJwbGFubmluZ19lbmdpbmVlciIsInByb2plY3RfbWFuYWdlciJdfSwiaWRlbnRpdGllcyI6W3siaWRlbnRpdHlfaWQiOiI4MTdhODBlOC00YjdlLTQ1NGMtYjg2NC1lOGY1NGE0M2JjZDEiLCJpZCI6IjE1ZmQ3NDA0LTM3MjAtNDRlNy05OGZkLTEyZTkxODViYjUzNCIsInVzZXJfaWQiOiIxNWZkNzQwNC0zNzIwLTQ0ZTctOThmZC0xMmU5MTg1YmI1MzQiLCJpZGVudGl0eV9kYXRhIjp7ImVtYWlsIjoiZTJlLXRlc3RlckBwem9uZS5jb20iLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwic3ViIjoiMTVmZDc0MDQtMzcyMC00NGU3LTk4ZmQtMTJlOTE4NWJiNTM0In0sInByb3ZpZGVyIjoiZW1haWwiLCJsYXN0X3NpZ25faW5fYXQiOiIyMDI2LTA5LTE0VDE5OjU3OjQ4LjI2ODY0N1oiLCJjcmVhdGVkX2F0IjoiMjAyNi0wOS0xNFQxOTo1Nzo0OC4yNjg3MDlaIiwidXBkYXRlZF9hdCI6IjIwMjYtMDktMTRUMTk6NTc6NDguMjY4NzA5WiIsImVtYWlsIjoiZTJlLXRlc3RlckBwem9uZS5jb20ifV0sImNyZWF0ZWRfYXQiOiIyMDI2LTA5LTE0VDE5OjU3OjQ4LjI0NjAzNloiLCJ1cGRhdGVkX2F0IjoiMjAyNi0wOS0xNFQyMDowMjowNi41NjIyNTRaIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0sIndlYWtfcGFzc3dvcmQiOm51bGx9';

interface MockTaskData {
  id: string;
  task_code: string;
  title_ar: string;
  discipline: string;
  project_id: string;
  planned_qty: number;
  progress_pct: number;
  boq_item_id: string;
  status: string;
}

interface MockReportLine {
  id: string;
  daily_progress_id: string;
  boq_item_id: string;
  qty_today: number;
  pct_today?: number;
  line_status: string;
  boq_item?: {
    id: string;
    item_code: string;
    description_ar: string;
    unit: string;
    rate_egp: number;
    contract_qty: number;
  };
}

interface MockReportData {
  id: string;
  project_id: string;
  report_no?: number;
  progress_date: string;
  discipline: string;
  status: string;
  entered_by: string;
  entered_by_name: string;
  site_task_id: string;
  notes?: string;
  weather?: string;
  lines: MockReportLine[];
  photos: any[];
  obstructions: any[];
  pm_reviewed_at?: string | null;
  pm_skipped?: boolean;
}

test.describe('Planning Engineer Review & Approval Workflow E2E', () => {
  test.beforeEach(async ({ context, page }) => {
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

    await page.addInitScript((token) => {
      window.localStorage.setItem('sb-tgqpcviqmgtdddiqvqdw-auth-token', token);
      window.localStorage.setItem('pzone_active_project_id', 'proj-e2e-101');
      window.localStorage.setItem('project-storage', JSON.stringify({
        state: { activeProjectId: 'proj-e2e-101' },
        version: 0,
      }));
    }, TEST_SESSION_COOKIE);

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
  });

  test('Scenario 1: Planning Engineer approves report -> progress_pct increases to 25% and report becomes approved', async ({
    page,
  }) => {
    const projectId = 'proj-e2e-101';
    const mockProjects = [
      { id: projectId, project_code: '2612', project_name: 'مشروع برج الأمل التجاري', name: 'مشروع برج الأمل التجاري' },
    ];

    const mockTask: MockTaskData = {
      id: 'task-civil-1',
      task_code: 'CIV-001',
      title_ar: 'أعمال خرسانات مسلحة للقواعد',
      discipline: 'civil',
      project_id: projectId,
      planned_qty: 100,
      progress_pct: 0,
      boq_item_id: 'boq-item-1',
      status: 'in_progress',
    };

    const mockBoqItem = {
      id: 'boq-item-1',
      item_code: 'B-01',
      description_ar: 'خرسانة مسلحة للقواعد',
      unit: 'م3',
      rate_egp: 2500,
      contract_qty: 100,
    };

    const mockReport: MockReportData = {
      id: 'rep-sub-101',
      project_id: projectId,
      report_no: 101,
      progress_date: '2026-09-15',
      discipline: 'civil',
      status: 'submitted',
      entered_by: '15fd7404-3720-44e7-98fd-12e9185bb534',
      entered_by_name: 'مهندس الموقع الميداني',
      site_task_id: mockTask.id,
      notes: 'صب قواعد المحور أ-ج',
      weather: 'معتدل',
      lines: [
        {
          id: 'line-sub-101',
          daily_progress_id: 'rep-sub-101',
          boq_item_id: mockBoqItem.id,
          qty_today: 25,
          pct_today: 25,
          line_status: 'pending',
          boq_item: mockBoqItem,
        },
      ],
      photos: [],
      obstructions: [],
    };

    let transitionActionCalled: string | null = null;

    await page.route('**/rest/v1/**', async (route: Route) => {
      const url = route.request().url();
      const method = route.request().method();
      const path = new URL(url).pathname;

      try {
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
                name_ar: 'مهندس التخطيط',
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
                project_role: 'planning_engineer',
                project_id: projectId,
                stakeholder_active: true,
              },
            ]),
          });
          return;
        }

        if (path.endsWith('/pm_site_tasks')) {
          if (method === 'PATCH') {
            const rawBody = route.request().postDataJSON();
            if (rawBody.progress_pct !== undefined) {
              mockTask.progress_pct = rawBody.progress_pct;
            }
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify(mockTask),
            });
            return;
          }
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([mockTask]),
          });
          return;
        }

        if (path.endsWith('/pm_boq_items') || path.endsWith('/v_boq_current')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([mockBoqItem]),
          });
          return;
        }

        if (path.endsWith('/rpc/rpc_daily_report_transition')) {
          const rawBody = route.request().postDataJSON();
          transitionActionCalled = rawBody.p_action;
          if (rawBody.p_action === 'approve') {
            mockReport.status = 'approved';
            mockReport.lines[0].line_status = 'approved';
            mockTask.progress_pct = 25; // 25 / 100
          }
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true }),
          });
          return;
        }

        if (path.endsWith('/pm_daily_progress_lines')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockReport.lines),
          });
          return;
        }

        if (path.endsWith('/pm_daily_progress_comments')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([]),
          });
          return;
        }

        if (path.endsWith('/pm_daily_progress_photos')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([]),
          });
          return;
        }

        if (path.endsWith('/pm_daily_obstructions')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([]),
          });
          return;
        }

        if (path.endsWith('/pm_approval_delegations')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([]),
          });
          return;
        }

        if (path.endsWith('/pm_daily_progress')) {
          const isSingle = route.request().headers()['accept']?.includes('vnd.pgrst.object') || /(?:[?&])id=eq\./.test(url);
          if (isSingle) {
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify(mockReport),
            });
            return;
          }

          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([mockReport]),
          });
          return;
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      } catch (err: unknown) {
        console.error('Planning test route error:', err);
        await route.abort();
      }
    });

    page.on('console', (msg) => {
      console.log(`[PAGE ${msg.type().toUpperCase()}]:`, msg.text());
    });
    page.on('pageerror', (err) => console.log('[PAGE ERROR]:', err.message));

    // 1. Navigate to Planning Daily Progress page
    await page.goto('/planning/daily-progress');
    await page.waitForLoadState('domcontentloaded');

    // 2. Select 'سجل اليوميات والمراجعة' tab
    const logsTabBtn = page.locator('button').filter({ hasText: 'سجل اليوميات والمراجعة' });
    await expect(logsTabBtn).toBeVisible({ timeout: 15000 });
    await logsTabBtn.click();

    // 3. Verify pending report is listed with status 'قيد المراجعة'
    const reportRow = page.locator('table tr').filter({ hasText: 'مهندس الموقع الميداني' });
    await expect(reportRow).toBeVisible();
    await expect(reportRow.locator('text=قيد المراجعة')).toBeVisible();

    // 4. Click 'مراجعة' button to open review modal
    const reviewBtn = reportRow.locator('button').filter({ hasText: 'مراجعة' });
    await expect(reviewBtn).toBeVisible();
    await reviewBtn.click();

    // 5. Verify review modal is displayed
    const reviewModal = page.locator('div.fixed').filter({ hasText: 'مراجعة واعتماد التقرير اليومي' });
    await expect(reviewModal).toBeVisible();

    // Verify report details inside modal
    await expect(reviewModal.locator('text=2026-09-15').first()).toBeVisible();
    await expect(reviewModal.locator('text=خرسانة مسلحة للقواعد')).toBeVisible();

    // 6. Click Approve button ('اعتماد التقرير وتوزيع الكميات')
    const approveBtn = reviewModal.locator('button').filter({ hasText: 'اعتماد التقرير وتوزيع الكميات' });
    await expect(approveBtn).toBeVisible();
    await approveBtn.click();

    // 7. Verify success toast notification
    await expect(
      page.locator('[data-sonner-toast]').filter({
        hasText: 'تم اعتماد التقرير اليومي وتوزيع الكميات على الأنشطة',
      })
    ).toBeVisible({ timeout: 10000 });

    // 8. Verify modal is dismissed
    await expect(reviewModal).toBeHidden();

    // 9. Assertions on business state transitions
    expect(transitionActionCalled).toBe('approve');
    expect(mockReport.status).toBe('approved');
    expect(mockReport.lines[0].line_status).toBe('approved');
    expect(mockTask.progress_pct).toBe(25);
  });

  test('Scenario 2: Planning Engineer rejects report with mandatory reason -> progress_pct stays 0% and previousQty is unlocked', async ({
    page,
  }) => {
    const projectId = 'proj-e2e-101';
    const mockProjects = [
      { id: projectId, project_code: '2612', project_name: 'مشروع برج الأمل التجاري', name: 'مشروع برج الأمل التجاري' },
    ];

    const mockTask: MockTaskData = {
      id: 'task-civil-1',
      task_code: 'CIV-001',
      title_ar: 'أعمال خرسانات مسلحة للقواعد',
      discipline: 'civil',
      project_id: projectId,
      planned_qty: 100,
      progress_pct: 0,
      boq_item_id: 'boq-item-1',
      status: 'in_progress',
    };

    const mockBoqItem = {
      id: 'boq-item-1',
      item_code: 'B-01',
      description_ar: 'خرسانة مسلحة للقواعد',
      unit: 'م3',
      rate_egp: 2500,
      contract_qty: 100,
    };

    const mockReport: MockReportData = {
      id: 'rep-sub-102',
      project_id: projectId,
      report_no: 102,
      progress_date: '2026-09-15',
      discipline: 'civil',
      status: 'submitted',
      entered_by: '15fd7404-3720-44e7-98fd-12e9185bb534',
      entered_by_name: 'مهندس الموقع الميداني',
      site_task_id: mockTask.id,
      notes: 'أعمال ردم حول القواعد',
      weather: 'مشمس',
      lines: [
        {
          id: 'line-sub-102',
          daily_progress_id: 'rep-sub-102',
          boq_item_id: mockBoqItem.id,
          qty_today: 30,
          pct_today: 30,
          line_status: 'pending',
          boq_item: mockBoqItem,
        },
      ],
      photos: [],
      obstructions: [],
    };

    let transitionActionCalled: string | null = null;
    let transitionReasonProvided: string | null = null;

    await page.route('**/rest/v1/**', async (route: Route) => {
      const url = route.request().url();
      const method = route.request().method();
      const path = new URL(url).pathname;

      try {
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
                name_ar: 'مهندس التخطيط',
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
                project_role: 'planning_engineer',
                project_id: projectId,
                stakeholder_active: true,
              },
            ]),
          });
          return;
        }

        if (path.endsWith('/pm_site_tasks')) {
          if (method === 'PATCH') {
            const rawBody = route.request().postDataJSON();
            if (rawBody.progress_pct !== undefined) {
              mockTask.progress_pct = rawBody.progress_pct;
            }
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify(mockTask),
            });
            return;
          }
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([mockTask]),
          });
          return;
        }

        if (path.endsWith('/pm_boq_items') || path.endsWith('/v_boq_current')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([mockBoqItem]),
          });
          return;
        }

        if (path.endsWith('/rpc/rpc_daily_report_transition')) {
          const rawBody = route.request().postDataJSON();
          transitionActionCalled = rawBody.p_action;
          transitionReasonProvided = rawBody.p_reason;
          if (rawBody.p_action === 'reject') {
            mockReport.status = 'rejected';
            mockReport.lines[0].line_status = 'rejected';
            // Rejected report MUST keep task progress_pct at 0
            mockTask.progress_pct = 0;
          }
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true }),
          });
          return;
        }

        if (path.endsWith('/pm_daily_progress_lines')) {
          // When querying cumulative history for site tasks, rejected reports/lines are excluded
          if (mockReport.status === 'rejected') {
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify([]),
            });
            return;
          }
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockReport.lines),
          });
          return;
        }

        if (path.endsWith('/pm_daily_progress_comments')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([]),
          });
          return;
        }

        if (path.endsWith('/pm_daily_progress_photos')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([]),
          });
          return;
        }

        if (path.endsWith('/pm_daily_obstructions')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([]),
          });
          return;
        }

        if (path.endsWith('/pm_approval_delegations')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([]),
          });
          return;
        }

        if (path.endsWith('/pm_daily_progress')) {
          // For getCumulativeQtyByTask, rejected reports are excluded via .not('status', 'in', '("cancelled","rejected")')
          if (url.includes('rejected') && mockReport.status === 'rejected') {
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify([]),
            });
            return;
          }

          const isSingle = route.request().headers()['accept']?.includes('vnd.pgrst.object') || /(?:[?&])id=eq\./.test(url);
          if (isSingle) {
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify(mockReport),
            });
            return;
          }

          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([mockReport]),
          });
          return;
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      } catch (err: unknown) {
        console.error('Planning test route error:', err);
        await route.abort();
      }
    });

    // 1. Navigate to Planning Daily Progress page
    await page.goto('/planning/daily-progress');
    await page.waitForLoadState('domcontentloaded');

    // 2. Select 'سجل اليوميات والمراجعة' tab
    const logsTabBtn = page.locator('button').filter({ hasText: 'سجل اليوميات والمراجعة' });
    await expect(logsTabBtn).toBeVisible({ timeout: 15000 });
    await logsTabBtn.click();

    // 3. Locate pending report row and click 'مراجعة'
    const reportRow = page.locator('table tr').filter({ hasText: 'مهندس الموقع الميداني' });
    await expect(reportRow).toBeVisible();
    const reviewBtn = reportRow.locator('button').filter({ hasText: 'مراجعة' });
    await reviewBtn.click();

    // 4. Verify modal is displayed
    const reviewModal = page.locator('div.fixed').filter({ hasText: 'مراجعة واعتماد التقرير اليومي' });
    await expect(reviewModal).toBeVisible();

    // 5. Click Reject button ('رفض التقرير')
    const rejectModeBtn = reviewModal.locator('button').filter({ hasText: 'رفض التقرير' });
    await expect(rejectModeBtn).toBeVisible();
    await rejectModeBtn.click();

    // 6. Verify rejection reason textarea is visible and mandatory
    const reasonTextarea = reviewModal.locator('textarea[placeholder*="اكتب ملاحظات الرفض"]');
    await expect(reasonTextarea).toBeVisible();

    // Confirm reject button is disabled when reason is empty
    const confirmRejectBtn = reviewModal.locator('button').filter({ hasText: 'تأكيد الرفض' });
    await expect(confirmRejectBtn).toBeDisabled();

    // 7. Enter mandatory rejection reason
    const rejectionReason = 'اختبار الدمك غير مطابق للمواصفات الفنية';
    await reasonTextarea.fill(rejectionReason);

    // Confirm reject button is now enabled
    await expect(confirmRejectBtn).toBeEnabled();
    await confirmRejectBtn.click();

    // 8. Verify rejection toast notification
    await expect(
      page.locator('[data-sonner-toast]').filter({
        hasText: 'تم رفض التقرير مع توثيق السبب',
      })
    ).toBeVisible({ timeout: 10000 });

    // 9. Verify modal is dismissed
    await expect(reviewModal).toBeHidden();

    // 10. Assertions on business state transitions
    expect(transitionActionCalled).toBe('reject');
    expect(transitionReasonProvided).toBe(rejectionReason);
    expect(mockReport.status).toBe('rejected');
    // Task progress_pct remains 0%
    expect(mockTask.progress_pct).toBe(0);
  });
});
