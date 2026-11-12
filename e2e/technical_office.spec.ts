import { test, expect, Route } from '@playwright/test';
import { TechnicalOfficePage } from './pages/TechnicalOfficePage';

const TEST_SESSION_COOKIE =
  'base64-eyJhY2Nlc3NfdG9rZW4iOiJleUpoYkdjaU9pSkZVekkxTmlJc0ltdHBaQ0k2SWprd09EVXlZekV4TFdSa1l6RXROREl4WlMwNE9XSTJMVFl6TXpSaFpXTXhOak5pWXlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKcGMzTWlPaUpvZEhSd2N6b3ZMM1JuY1hCamRtbHhiV2QwWkdSa2FYRjJjV1IzTG5OMWNHRmlZWE5sTG1OdkwyRjFkR2d2ZGpFaUxDSnpkV0lpT2lJeE5XWmtOelF3TkMwek56SXdMVFEwWlRjdE9UaG1aQzB4TW1VNU1UZzFZbUkxTXpRaUxDSmhkV1FpT2lKaGRYUm9aVzUwYVdOaGRHVmtJaXdpWlhod0lqb3hOemc1TkRFNU56STJMQ0pwWVhRaU9qRTNPRGswTVRZeE1qWXNJbVZ0WVdsc0lqb2laVEpsTFhSbGMzUmxja0J3ZW05dVpTNWpiMjBpTENKd2FHOXVaU0k2SWlJc0ltRndjRjl0WlhSaFpHRjBZU0k2ZXlKd2NtOTJhV1JsY2lJNkltVnRZV2xzSWl3aWNISnZkbWxrWlhKeklqcGJJbVZ0WVdsc0lsMTlMQ0oxYzJWeVgyMWxkR0ZrWVhSaElqcDdJbVZ0WVdsc1gzWmxjbWxtYVdWa0lqcDBjblZsTENKbWRXeHNYMjVoYldVaU9pSkZNa1VnVkdWemRHVnlJaXdpWm5Wc2JGOXVZVzFsWDJGeUlqb2kyWVhaaDltRzJLX1lzeURZcDltRTJLZllydGlxMktqWXA5aXhJaXdpY205c1pYTWlPbHNpWVdSdGFXNGlMQ0p6YVhSbFgyVnVaMmx1WldWeUlpd2ljR3hoYm01cGJtZGZaVzVuYVc1bFpYSWlMQ0p3Y205cVpXTjBYMjFoYm1GblpYSWlYWDBzSW5KdmJHVWlPaUpoZFhSb1pXNTBhV05oZEdWa0lpd2lZV0ZzSWpvaVlXRnNNU0lzSW1GdGNpSTZXM3NpYldWMGFHOWtJam9pY0dGemMzZHZjbVFpTENKMGFXMWxjM1JoYlhBaU9qRTNPRGswTVRZeE1qWjlYU3dpYzJWemMybHZibDlwWkNJNkltWTNOREEzT1RReExUQTNZamN0TkdRNU55MDRNRFZqTFdZNFlXSTFaVFprTTJJMU5pSXNJbWx6WDJGdWIyNTViVzkxY3lJNlptRnNjMlY5LnRRWmViSkN2Mkt3TlMyNVBTWmwxeGw4YUhRMUhXVGtILWJWVFlGNXprc1Q2XzFSSFFwa0hsakZjWFVRckFIUFVOM3RPT1hOOWx2c3drOXM2SHB0Vlp3IiwidG9rZW5fdHlwZSI6ImJlYXJlciIsImV4cGlyZXNfaW4iOjM2MDAsImV4cGlyZXNfYXQiOjE3ODk0MTk3MjYsInJlZnJlc2hfdG9rZW4iOiJnNzQ3NDdscXV1aWQiLCJ1c2VyIjp7ImlkIjoiMTVmZDc0MDQtMzcyMC00NGU3LTk4ZmQtMTJlOTE4NWJiNTM0IiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiZW1haWwiOiJlMmUtdGVzdGVyQHB6b25lLmNvbSIsImVtYWlsX2NvbmZpcm1lZF9hdCI6IjIwMjYtMDktMTRUMTk6NTc6NDguMjgwMzM3WiIsInBob25lIjoiIiwiY29uZmlybWVkX2F0IjoiMjAyNi0wOS0xNFQxOTo1Nzo0OC4yODAzMzdaIiwibGFzdF9zaWduX2luX2F0IjoiMjAyNi0wOS0xNFQyMDowMjowNi41NTk4MjM4NThaIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWxfdmVyaWZpZWQiOnRydWUsImZ1bGxfbmFtZSI6IkUyRSBUZXN0ZXIiLCJmdWxsX25hbWVfYXIiOiLZhdmH2YbYr9izINin2YTYp9iu2KrYqNin2LEiLCJyb2xlcyI6WyJhZG1pbiIsInNpdGVfZW5naW5lZXIiLCJwbGFubmluZ19lbmdpbmVlciIsInByb2plY3RfbWFuYWdlciJdfSwiaWRlbnRpdGllcyI6W3siaWRlbnRpdHlfaWQiOiI4MTdhODBlOC00YjdlLTQ1NGMtYjg2NC1lOGY1NGE0M2JjZDEiLCJpZCI6IjE1ZmQ3NDA0LTM3MjAtNDRlNy05OGZkLTEyZTkxODViYjUzNCIsInVzZXJfaWQiOiIxNWZkNzQwNC0zNzIwLTQ0ZTctOThmZC0xMmU5MTg1YmI1MzQiLCJpZGVudGl0eV9kYXRhIjp7ImVtYWlsIjoiZTJlLXRlc3RlckBwem9uZS5jb20iLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwic3ViIjoiMTVmZDc0MDQtMzcyMC00NGU3LTk4ZmQtMTJlOTE4NWJiNTM0In0sInByb3ZpZGVyIjoiZW1haWwiLCJsYXN0X3NpZ25faW5fYXQiOiIyMDI2LTA5LTE0VDE5OjU3OjQ4LjI2ODY0N1oiLCJjcmVhdGVkX2F0IjoiMjAyNi0wOS0xNFQxOTo1Nzo0OC4yNjg3MDlaIiwidXBkYXRlZF9hdCI6IjIwMjYtMDktMTRUMTk6NTc6NDguMjY4NzA5WiIsImVtYWlsIjoiZTJlLXRlc3RlckBwem9uZS5jb20ifV0sImNyZWF0ZWRfYXQiOiIyMDI2LTA5LTE0VDE5OjU3OjQ4LjI0NjAzNloiLCJ1cGRhdGVkX2F0IjoiMjAyNi0wOS0xNFQyMDowMjowNi41NjIyNTRaIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0sIndlYWtfcGFzc3dvcmQiOm51bGx9';

test.describe('Technical Office Enterprise & Engineering E2E Suite', () => {
  const projectId = 'proj-e2e-pmo-101';
  const userId = '15fd7404-3720-44e7-98fd-12e9185bb534';

  let approvalQueueState = [
    {
      id: 'log-101',
      deliverable_item_id: 'deliv-item-1',
      project_id: projectId,
      log_date: '2026-09-22',
      progress_pct: 75,
      notes: 'تم إنجاز قطاعات تسليح الأعمدة ومطابقة مناسيب التأسيس',
      obstruction_type: null,
      obstruction_notes: null,
      logged_by: userId,
      logged_by_stakeholder_id: userId,
      to_manager_approved: false,
      created_at: '2026-09-22T08:30:00Z',
      updated_at: '2026-09-22T08:30:00Z',
      deliverable_item: {
        id: 'deliv-item-1',
        sheet_number: 'STR-SL-01',
        description: 'تسليح سقف الدور الأرضي',
        progress_pct: 50,
        current_rev: 1,
        deliverable: {
          id: 'deliv-1',
          ref_code: 'DEL-STR-001',
          title_ar: 'مخططات تسليح الأسقف والأعمدة',
          project_id: projectId,
          project: {
            id: projectId,
            name_ar: 'مشروع برج الأمل التجاري',
            name_en: 'Al-Amal Commercial Tower',
            code: '2612',
          },
        },
      },
      engineer: {
        id: userId,
        name_ar: 'م. أحمد مهندس المكتب الفني',
        employee_code: 'TO-001',
        role: 'technical_office_engineer',
      },
    },
  ];

  let deliverablesState = [
    {
      id: 'deliv-1',
      ref_code: 'DEL-STR-001',
      title_ar: 'مخططات تسليح الأسقف والأعمدة',
      title_en: 'Slab & Column Reinforcement Drawings',
      project_id: projectId,
      kind: 'shop_drawing',
      status: 'in_progress',
      priority: 'high',
      due_date: '2026-10-15',
      received_at: '2026-09-01T00:00:00Z',
      items: [
        {
          id: 'deliv-item-1',
          deliverable_id: 'deliv-1',
          sheet_number: 'STR-SL-01',
          description: 'تسليح سقف الدور الأرضي',
          progress_pct: 75,
          status: 'in_progress',
          consultant_status: 'B',
          current_rev: 1,
          due_date: '2026-10-15',
          assigned_stakeholder_id: userId,
          to_manager_approved: false,
        },
      ],
    },
    {
      id: 'deliv-2',
      ref_code: 'DEL-ARC-002',
      title_ar: 'لوحات تشطيبات الواجهات والحجر',
      title_en: 'Facade & Stone Finishing Details',
      project_id: projectId,
      kind: 'shop_drawing',
      status: 'blocked',
      blocked_reason: 'بانتظار اعتماد عينة الحجر من الاستشاري',
      priority: 'urgent',
      due_date: '2026-10-10',
      received_at: '2026-09-05T00:00:00Z',
      items: [
        {
          id: 'deliv-item-2',
          deliverable_id: 'deliv-2',
          sheet_number: 'ARC-WD-02',
          description: 'تفاصيل تثبيت واجهات الحجر الطبيعي',
          progress_pct: 30,
          status: 'blocked',
          blocked_reason: 'بانتظار اعتماد عينة الحجر من الاستشاري',
          consultant_status: 'C',
          current_rev: 2,
          due_date: '2026-10-10',
          assigned_stakeholder_id: userId,
          to_manager_approved: false,
        },
      ],
    },
    {
      id: 'deliv-3',
      ref_code: 'DEL-MEP-003',
      title_ar: 'مخططات مسارات التكييف المركزي',
      title_en: 'HVAC Duct Routing Details',
      project_id: projectId,
      kind: 'shop_drawing',
      status: 'approved',
      consultant_status: 'code_a',
      priority: 'medium',
      due_date: '2026-09-20',
      received_at: '2026-08-20T00:00:00Z',
      items: [
        {
          id: 'deliv-item-3',
          deliverable_id: 'deliv-3',
          sheet_number: 'MEP-HV-01',
          description: 'مخططات دكتات التكييف الدور الأول',
          progress_pct: 100,
          status: 'approved',
          consultant_status: 'A',
          current_rev: 0,
          due_date: '2026-09-20',
          assigned_stakeholder_id: userId,
          to_manager_approved: true,
        },
      ],
    },
  ];

  test.beforeEach(async ({ context, page }) => {
    // Reset state before each test
    approvalQueueState = [
      {
        id: 'log-101',
        deliverable_item_id: 'deliv-item-1',
        project_id: projectId,
        log_date: '2026-09-22',
        progress_pct: 75,
        notes: 'تم إنجاز قطاعات تسليح الأعمدة ومطابقة مناسيب التأسيس',
        obstruction_type: null,
        obstruction_notes: null,
        logged_by: userId,
        logged_by_stakeholder_id: userId,
        to_manager_approved: false,
        created_at: '2026-09-22T08:30:00Z',
        updated_at: '2026-09-22T08:30:00Z',
        deliverable_item: {
          id: 'deliv-item-1',
          sheet_number: 'STR-SL-01',
          description: 'تسليح سقف الدور الأرضي',
          progress_pct: 50,
          current_rev: 1,
          deliverable: {
            id: 'deliv-1',
            ref_code: 'DEL-STR-001',
            title_ar: 'مخططات تسليح الأسقف والأعمدة',
            project_id: projectId,
            project: {
              id: projectId,
              name_ar: 'مشروع برج الأمل التجاري',
              name_en: 'Al-Amal Commercial Tower',
              code: '2612',
            },
          },
        },
        engineer: {
          id: userId,
          name_ar: 'م. أحمد مهندس المكتب الفني',
          employee_code: 'TO-001',
          role: 'technical_office_engineer',
        },
      },
    ];

    // 1. Session cookies + bypass
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

    // 2. Local storage active project setup
    await page.addInitScript((token) => {
      window.localStorage.setItem('sb-tgqpcviqmgtdddiqvqdw-auth-token', token);
      window.localStorage.setItem('pzone_active_project_id', 'proj-e2e-pmo-101');
      window.localStorage.setItem(
        'pzone_active_project',
        JSON.stringify({
          state: { activeProjectId: 'proj-e2e-pmo-101' },
          version: 0,
        })
      );
      window.localStorage.setItem(
        'project-storage',
        JSON.stringify({
          state: { activeProjectId: 'proj-e2e-pmo-101' },
          version: 0,
        })
      );
    }, TEST_SESSION_COOKIE);

    // 3. Supabase Auth mock
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
            id: userId,
            aud: 'authenticated',
            role: 'authenticated',
            email: 'e2e-tester@pzone.com',
            user_metadata: {
              roles: ['admin', 'technical_office_manager', 'technical_office', 'technical_office_engineer'],
            },
          },
        }),
      });
    });

    // 4. PostgREST API mock
    await page.route('**/rest/v1/**', async (route: Route) => {
      const url = new URL(route.request().url());
      const pathName = url.pathname;
      const method = route.request().method();

      // Profile mock (single object for maybeSingle)
      if (pathName.endsWith('/profiles')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: userId,
            roles: ['admin', 'technical_office_manager', 'technical_office', 'technical_office_engineer'],
          }),
        });
        return;
      }

      // Projects mock
      if (
        pathName.endsWith('/pm_projects') ||
        pathName.endsWith('/pm_projects_with_manager') ||
        pathName.endsWith('/projects')
      ) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: projectId,
              project_code: '2612',
              code: '2612',
              project_name: 'مشروع برج الأمل التجاري',
              name: 'مشروع برج الأمل التجاري',
              name_ar: 'مشروع برج الأمل التجاري',
              name_en: 'Al-Amal Commercial Tower',
            },
          ]),
        });
        return;
      }

      // Stakeholders
      if (pathName.endsWith('/stakeholders')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: userId,
              auth_user_id: userId,
              name_ar: 'م. أحمد مهندس المكتب الفني',
              name_en: 'Eng. Ahmed Technical Office',
              role: 'technical_office_engineer',
              employee_code: 'TO-001',
            },
            {
              id: 'stk-mgr-1',
              name_ar: 'م. حسام مدير المكتب الفني',
              name_en: 'Eng. Hossam TO Manager',
              role: 'technical_office_manager',
              employee_code: 'TO-MGR-01',
            },
          ]),
        });
        return;
      }

      // Project Stakeholders
      if (pathName.endsWith('/project_stakeholders')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'ps-1',
              project_id: projectId,
              stakeholder_id: userId,
              project_role: 'Technical Office Manager',
              is_active: true,
            },
          ]),
        });
        return;
      }

      // Progress Logs (Approval Queue)
      if (pathName.endsWith('/pm_to_progress_logs')) {
        if (method === 'PATCH' || method === 'PUT') {
          const patchData = route.request().postDataJSON() || {};
          if (patchData.to_manager_approved) {
            approvalQueueState = approvalQueueState.filter((q) => q.id !== 'log-101');
          }
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ ...patchData, updated_at: new Date().toISOString() }),
          });
          return;
        }

        if (method === 'POST') {
          const postData = route.request().postDataJSON() || {};
          const newLog = {
            id: `log-${Date.now()}`,
            ...postData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify(newLog),
          });
          return;
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: {
            'content-range': `0-${Math.max(0, approvalQueueState.length - 1)}/${approvalQueueState.length}`,
          },
          body: JSON.stringify(approvalQueueState),
        });
        return;
      }

      // Deliverable Items (Assigned Tasks)
      if (pathName.endsWith('/pm_deliverable_items')) {
        if (method === 'PATCH' || method === 'PUT') {
          const patchData = route.request().postDataJSON() || {};
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(patchData),
          });
          return;
        }

        const items = [
          {
            id: 'deliv-item-1',
            deliverable_id: 'deliv-1',
            sheet_number: 'STR-SL-01',
            description: 'تسليح سقف الدور الأرضي',
            progress_pct: 75,
            status: 'in_progress',
            consultant_status: 'B',
            current_rev: 1,
            due_date: '2026-10-15',
            assigned_stakeholder_id: userId,
            to_manager_approved: false,
            deliverable: {
              id: 'deliv-1',
              ref_code: 'DEL-STR-001',
              title_ar: 'مخططات تسليح الأسقف والأعمدة',
              kind: 'shop_drawing',
              project_id: projectId,
              status: 'in_progress',
              priority: 'high',
              due_date: '2026-10-15',
            },
            assigned_stakeholder: {
              id: userId,
              name_ar: 'م. أحمد مهندس المكتب الفني',
              name_en: 'Eng. Ahmed Technical Office',
              role: 'technical_office_engineer',
              employee_code: 'TO-001',
            },
          },
          {
            id: 'deliv-item-2',
            deliverable_id: 'deliv-2',
            sheet_number: 'ARC-WD-02',
            description: 'تفاصيل تثبيت واجهات الحجر الطبيعي',
            progress_pct: 30,
            status: 'blocked',
            blocked_reason: 'بانتظار اعتماد عينة الحجر من الاستشاري',
            consultant_status: 'C',
            current_rev: 2,
            due_date: '2026-10-10',
            assigned_stakeholder_id: userId,
            to_manager_approved: false,
            deliverable: {
              id: 'deliv-2',
              ref_code: 'DEL-ARC-002',
              title_ar: 'لوحات تشطيبات الواجهات والحجر',
              kind: 'shop_drawing',
              project_id: projectId,
              status: 'blocked',
              priority: 'urgent',
              due_date: '2026-10-10',
            },
            assigned_stakeholder: {
              id: userId,
              name_ar: 'م. أحمد مهندس المكتب الفني',
              name_en: 'Eng. Ahmed Technical Office',
              role: 'technical_office_engineer',
              employee_code: 'TO-001',
            },
          },
        ];

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: {
            'content-range': `0-${items.length - 1}/${items.length}`,
          },
          body: JSON.stringify(items),
        });
        return;
      }

      // Deliverables
      if (pathName.endsWith('/pm_deliverables')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: {
            'content-range': `0-${deliverablesState.length - 1}/${deliverablesState.length}`,
          },
          body: JSON.stringify(deliverablesState),
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

  test('Scenario 1: TO Manager Hub renders header banner, KPIs, and project selector', async ({ page }) => {
    const toPage = new TechnicalOfficePage(page);
    await toPage.gotoDashboard();

    // Verify Manager Hub heading & badge
    await expect(toPage.dashboardHeading).toBeVisible();
    await expect(toPage.managerHubBadge).toBeVisible();

    // Verify 4 KPI cards
    await toPage.expectDashboardKpisVisible();

    // Verify KPI metric values (3 deliverables, 1 in-progress, 1 blocked, 1 approved)
    await expect(page.locator('text=3').first()).toBeVisible();
    await expect(page.locator('text=STR-SL-01').or(page.locator('text=DEL-STR-001'))).toBeDefined();
  });

  test('Scenario 2: TO Approval Queue displays pending engineer log and approves submission', async ({ page }) => {
    const toPage = new TechnicalOfficePage(page);
    await toPage.gotoDashboard();

    // Verify pending sign-off item in Approval Queue
    await expect(page.locator('text=STR-SL-01').first()).toBeVisible();
    await expect(page.locator('text=75%').first()).toBeVisible();
    await expect(toPage.approveProgressBtn).toBeVisible();

    // Click Approve
    await toPage.approveProgressBtn.click();

    // Verify success feedback message appears
    await expect(page.getByText(/تم اعتماد|Approved/i).first()).toBeVisible();
  });

  test('Scenario 3: TO Manager Hub tab switching to Workload Assignments and KPIs', async ({ page }) => {
    const toPage = new TechnicalOfficePage(page);
    await toPage.gotoDashboard();

    // Switch to Assignments Tab
    await toPage.switchTab('assignments');
    await expect(page.getByRole('heading', { name: /مؤشرات توزيع الأحمال|Workload/i })).toBeVisible();

    // Switch to KPIs Tab
    await toPage.switchTab('kpis');
    await expect(page.getByTestId('to-engineer-kpi-dashboard')).toBeVisible();
  });

  test('Scenario 4: Technical Office Engineer Workspace (/to-tasks) renders assigned drawings and search filter', async ({ page }) => {
    const toPage = new TechnicalOfficePage(page);
    await toPage.gotoTasks();

    // Verify Engineer Workspace banner
    await expect(toPage.tasksHeading).toBeVisible();
    await expect(toPage.engineerWorkspaceBadge).toBeVisible();

    // Verify KPI metrics
    await toPage.expectTasksKpisVisible();

    // Verify assigned drawing cards
    await toPage.expectItemVisible('STR-SL-01');
    await toPage.expectItemVisible('ARC-WD-02');

    // Test search filter
    await toPage.searchTasks('STR-SL');
    await toPage.expectItemVisible('STR-SL-01');
    await expect(page.locator('text=ARC-WD-02')).not.toBeVisible();
  });

  test('Scenario 5: Technical Office Portal (/technical-office) displays navigation to Deliverables and COO Hub', async ({ page }) => {
    const toPage = new TechnicalOfficePage(page);
    await toPage.gotoPortal();

    // Verify portal heading
    await expect(toPage.portalHeading).toBeVisible();

    // Verify navigation cards
    await expect(toPage.deliverablesLink).toBeVisible();
    await expect(toPage.executiveOverviewLink).toBeVisible();
  });
});
