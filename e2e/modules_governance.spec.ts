import { test, expect, Route } from '@playwright/test';
import { TenderPage } from './pages/TenderPage';
import { DocumentControlPage } from './pages/DocumentControlPage';
import { HsePage } from './pages/HsePage';
import { BoardPage } from './pages/BoardPage';

const TEST_SESSION_COOKIE =
  'base64-eyJhY2Nlc3NfdG9rZW4iOiJleUpoYkdjaU9pSkZVekkxTmlJc0ltdHBaQ0k2SWprd09EVXlZekV4TFdSa1l6RXROREl4WlMwNE9XSTJMVFl6TXpSaFpXTXhOak5pWXlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKcGMzTWlPaUpvZEhSd2N6b3ZMM1JuY1hCamRtbHhiV2QwWkdSa2FYRjJjV1IzTG5OMWNHRmlZWE5sTG1OdkwyRjFkR2d2ZGpFaUxDSnpkV0lpT2lJeE5XWmtOelF3TkMwek56SXdMVFEwWlRjdE9UaG1aQzB4TW1VNU1UZzFZbUkxTXpRaUxDSmhkV1FpT2lKaGRYUm9aVzUwYVdOaGRHVmtJaXdpWlhod0lqb3hOemc1TkRFNU56STJMQ0pwWVhRaU9qRTNPRGswTVRZeE1qWXNJbVZ0WVdsc0lqb2laVEpsTFhSbGMzUmxja0J3ZW05dVpTNWpiMjBpTENKd2FHOXVaU0k2SWlJc0ltRndjRjl0WlhSaFpHRjBZU0k2ZXlKd2NtOTJhV1JsY2lJNkltVnRZV2xzSWl3aWNISnZkbWxrWlhKeklqcGJJbVZ0WVdsc0lsMTlMQ0oxYzJWeVgyMWxkR0ZrWVhSaElqcDdJbVZ0WVdsc1gzWmxjbWxtYVdWa0lqcDBjblZsTENKbWRXeHNYMjVoYldVaU9pSkZNa1VnVkdWemRHVnlJaXdpWm5Wc2JGOXVZVzFsWDJGeUlqb2kyWVhaaDltRzJLX1lzeURZcDltRTJLZllydGlxMktqWXA5aXhJaXdpY205c1pYTWlPbHNpWVdSdGFXNGlMQ0p6YVhSbFgyVnVaMmx1WldWeUlpd2ljR3hoYm01cGJtZGZaVzVuYVc1bFpYSWlMQ0p3Y205cVpXTjBYMjFoYm1GblpYSWlYWDBzSW5KdmJHVWlPaUpoZFhSb1pXNTBhV05oZEdWa0lpd2lZV0ZzSWpvaVlXRnNNU0lzSW1GdGNpSTZXM3NpYldWMGFHOWtJam9pY0dGemMzZHZjbVFpTENKMGFXMWxjM1JoYlhBaU9qRTNPRGswTVRZeE1qWjlYU3dpYzJWemMybHZibDlwWkNJNkltWTNOREEzT1RReExUQTNZamN0TkdRNU55MDRNRFZqTFdZNFlXSTFaVFprTTJJMU5pSXNJbWx6WDJGdWIyNTViVzkxY3lJNlptRnNjMlY5LnRRWmViSkN2Mkt3TlMyNVBTWmwxeGw4YUhRMUhXVGtILWJWVFlGNXprc1Q2XzFSSFFwa0hsakZjWFVRckFIUFVOM3RPT1hOOWx2c3drOXM2SHB0Vlp3IiwidG9rZW5fdHlwZSI6ImJlYXJlciIsImV4cGlyZXNfaW4iOjM2MDAsImV4cGlyZXNfYXQiOjE3ODk0MTk3MjYsInJlZnJlc2hfdG9rZW4iOiJnNzQ3NDdscXV1aWQiLCJ1c2VyIjp7ImlkIjoiMTVmZDc0MDQtMzcyMC00NGU3LTk4ZmQtMTJlOTE4NWJiNTM0IiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiZW1haWwiOiJlMmUtdGVzdGVyQHB6b25lLmNvbSIsImVtYWlsX2NvbmZpcm1lZF9hdCI6IjIwMjYtMDktMTRUMTk6NTc6NDguMjgwMzM3WiIsInBob25lIjoiIiwiY29uZmlybWVkX2F0IjoiMjAyNi0wOS0xNFQxOTo1Nzo0OC4yODAzMzdaIiwibGFzdF9zaWduX2luX2F0IjoiMjAyNi0wOS0xNFQyMDowMjowNi41NTk4MjM4NThaIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWxfdmVyaWZpZWQiOnRydWUsImZ1bGxfbmFtZSI6IkUyRSBUZXN0ZXIiLCJmdWxsX25hbWVfYXIiOiLZhdmH2YbYr9izINin2YTYp9iu2KrYqNin2LEiLCJyb2xlcyI6WyJhZG1pbiIsInNpdGVfZW5naW5lZXIiLCJwbGFubmluZ19lbmdpbmVlciIsInByb2plY3RfbWFuYWdlciJdfSwiaWRlbnRpdGllcyI6W3siaWRlbnRpdHlfaWQiOiI4MTdhODBlOC00YjdlLTQ1NGMtYjg2NC1lOGY1NGE0M2JjZDEiLCJpZCI6IjE1ZmQ3NDA0LTM3MjAtNDRlNy05OGZkLTEyZTkxODViYjUzNCIsInVzZXJfaWQiOiIxNWZkNzQwNC0zNzIwLTQ0ZTctOThmZC0xMmU5MTg1YmI1MzQiLCJpZGVudGl0eV9kYXRhIjp7ImVtYWlsIjoiZTJlLXRlc3RlckBwem9uZS5jb20iLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwic3ViIjoiMTVmZDc0MDQtMzcyMC00NGU3LTk4ZmQtMTJlOTE4NWJiNTM0In0sInByb3ZpZGVyIjoiZW1haWwiLCJsYXN0X3NpZ25faW5fYXQiOiIyMDI2LTA5LTE0VDE5OjU3OjQ4LjI2ODY0N1oiLCJjcmVhdGVkX2F0IjoiMjAyNi0wOS0xNFQxOTo1Nzo0OC4yNjg3MDlaIiwidXBkYXRlZF9hdCI6IjIwMjYtMDktMTRUMTk6NTc6NDguMjY4NzA5WiIsImVtYWlsIjoiZTJlLXRlc3RlckBwem9uZS5jb20ifV0sImNyZWF0ZWRfYXQiOiIyMDI2LTA5LTE0VDE5OjU3OjQ4LjI0NjAzNloiLCJ1cGRhdGVkX2F0IjoiMjAyNi0wOS0xNFQyMDowMjowNi41NjIyNTRaIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0sIndlYWtfcGFzc3dvcmQiOm51bGx9';

test.describe('Enterprise Modules Governance E2E Suite (Tender, DocControl, HSE, Board)', () => {
  const projectId = 'proj-e2e-pmo-101';
  const mockProjects = [
    {
      id: projectId,
      project_code: '2612',
      project_name: 'مشروع برج الأمل التجاري',
      name: 'مشروع برج الأمل التجاري',
      name_ar: 'مشروع برج الأمل التجاري',
      name_en: 'Al-Amal Commercial Tower',
      status: 'working',
      completion_pct: 45,
      total_contract_value: 12500000,
      pm_full_name: 'مهندس أحمد علي',
      project_manager_name_raw: 'مهندس أحمد علي',
      created_at: '2026-01-01T00:00:00Z',
    },
  ];

  const mockTenders = [
    {
      id: 'tnd-1',
      tender_number: 'TND-2026-001',
      title_ar: 'مشروع إنشاء مركز البيانات السحابي',
      title_en: 'Cloud Data Center Construction',
      client_name: 'هيئة الاتصالات وتقنية المعلومات',
      category: 'infrastructure',
      status: 'open',
      estimated_budget: 8500000,
      submission_deadline: '2026-10-15T12:00:00Z',
      bond_amount: 425000,
      bond_validity_days: 90,
      description: 'مناقصة تنفيذ وتجهيز مركز البيانات الرئيسي',
      created_at: '2026-09-01T00:00:00Z',
      updated_at: '2026-09-01T00:00:00Z',
    },
    {
      id: 'tnd-2',
      tender_number: 'TND-2026-002',
      title_ar: 'أعمال التشطيبات المعمارية - المقر الرئيسي',
      title_en: 'Architectural Fit-out - HQ',
      client_name: 'شركة تطوير العقارية',
      category: 'civil',
      status: 'awarded',
      estimated_budget: 3200000,
      submission_deadline: '2026-08-20T12:00:00Z',
      bond_amount: 160000,
      bond_validity_days: 90,
      description: 'أعمال تشطيبات داخلية وديكورات',
      created_at: '2026-08-01T00:00:00Z',
      updated_at: '2026-08-25T00:00:00Z',
    },
  ];

  const mockTenderBidders = [
    {
      id: 'tb-1',
      tender_id: 'tnd-1',
      bidder_name: 'شركة الإنشاءات الحديثة',
      submitted_at: '2026-09-10T10:00:00Z',
      bid_amount: 8200000,
      technical_score: 88,
      financial_score: 92,
      ranking: 1,
      status: 'PENDING',
      created_at: '2026-09-10T10:00:00Z',
      updated_at: '2026-09-10T10:00:00Z',
    },
  ];

  const mockDocuments = [
    {
      id: 'doc-1',
      project_id: projectId,
      document_number: 'DWG-STR-001',
      revision: 'B',
      title_ar: 'المخططات الإنشائية للقواعد والأساسات',
      title_en: 'Structural Foundation Drawings',
      type: 'drawing',
      discipline: 'structural',
      status: 'approved',
      file_url: 'https://example.com/docs/dwg-001.pdf',
      file_size_bytes: 4194304,
      mime_type: 'application/pdf',
      issued_date: '2026-09-05T00:00:00Z',
      created_at: '2026-09-05T00:00:00Z',
      updated_at: '2026-09-05T00:00:00Z',
    },
    {
      id: 'doc-2',
      project_id: projectId,
      document_number: 'SUB-MEP-014',
      revision: 'A',
      title_ar: 'اعتماد مواد عزل الأنابيب والتمديدات',
      title_en: 'Pipe Insulation Submittal',
      type: 'submittal',
      discipline: 'mep',
      status: 'under_review',
      file_url: 'https://example.com/docs/sub-014.pdf',
      file_size_bytes: 2097152,
      mime_type: 'application/pdf',
      issued_date: '2026-09-12T00:00:00Z',
      created_at: '2026-09-12T00:00:00Z',
      updated_at: '2026-09-12T00:00:00Z',
    },
  ];

  const mockTransmittals = [
    {
      id: 'trn-1',
      transmittal_number: 'TRN-2026-042',
      project_id: projectId,
      sender: 'المقاول العام - شركة بي زون',
      recipient: 'استشاري المشروع - دار الهندسة',
      purpose: 'for_approval',
      transmission_date: '2026-09-15T00:00:00Z',
      documents_count: 5,
      status: 'SENT',
      created_at: '2026-09-15T00:00:00Z',
      updated_at: '2026-09-15T00:00:00Z',
    },
  ];

  const mockIncidents = [
    {
      id: 'inc-1',
      project_id: projectId,
      incident_number: 'INC-2026-003',
      incident_date: '2026-09-14T09:30:00Z',
      severity: 'near_miss',
      title_ar: 'سقوط أداة يدوية من ارتفاع دون إصابات',
      title_en: 'Hand tool dropped from height without injury',
      location_description: 'الطابق الرابع - المنطقة الغربية',
      injury_count: 0,
      root_cause: 'عدم ربط الأداة بحزام الأمان',
      corrective_actions: 'توعية فورية وإلزام ربط الأدوات بالارتفاعات',
      status: 'OPEN',
      created_at: '2026-09-14T10:00:00Z',
      updated_at: '2026-09-14T10:00:00Z',
    },
  ];

  const mockInspections = [
    {
      id: 'insp-1',
      project_id: projectId,
      inspection_date: '2026-09-15T11:00:00Z',
      inspector_name: 'م. خالد الدوسري',
      score_pct: 94.5,
      safe_acts_count: 28,
      unsafe_acts_count: 2,
      stop_work_issued: false,
      findings: 'التزام عالي بارتداء مهمات الوقاية الشخصية PPE',
      created_at: '2026-09-15T12:00:00Z',
      updated_at: '2026-09-15T12:00:00Z',
    },
  ];

  const mockHseMetrics = {
    safeManHours: 125000,
    ltiFreeDays: 340,
    totalIncidents: 1,
    openActions: 1,
    safetyScoreAverage: 95,
  };

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

    // 2. Seed localStorage for active project and session
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

    // 3. Mock Supabase Auth endpoint
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
              roles: [
                'admin',
                'commercial_manager',
                'project_manager',
                'coo',
                'ceo',
                'technical_office_engineer',
                'doc_controller',
                'hse_officer',
                'hse_manager',
                'site_engineer',
                'planning_engineer',
                'cost_control',
                'chairman',
                'board_member',
              ],
            },
          },
        }),
      });
    });

    // 4. Mock REST v1 calls for deterministic E2E test execution
    await page.route('**/rest/v1/**', async (route: Route) => {
      const url = route.request().url();
      const pathName = new URL(url).pathname;

      if (pathName.endsWith('/profiles')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: '15fd7404-3720-44e7-98fd-12e9185bb534',
            roles: [
              'admin',
              'commercial_manager',
              'project_manager',
              'coo',
              'ceo',
              'technical_office_engineer',
              'doc_controller',
              'hse_officer',
              'hse_manager',
              'site_engineer',
              'planning_engineer',
              'cost_control',
              'chairman',
              'board_member',
            ],
          }),
        });
        return;
      }

      if (pathName.endsWith('/pm_projects') || pathName.endsWith('/pm_projects_with_manager') || pathName.endsWith('/projects')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockProjects),
        });
        return;
      }

      if (pathName.endsWith('/pm_tenders')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockTenders),
        });
        return;
      }

      if (pathName.endsWith('/pm_tender_bidders')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockTenderBidders),
        });
        return;
      }

      if (pathName.endsWith('/pm_controlled_documents')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: {
            'content-range': '0-1/2',
          },
          body: JSON.stringify(mockDocuments),
        });
        return;
      }

      if (pathName.endsWith('/pm_document_transmittals')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: {
            'content-range': '0-0/1',
          },
          body: JSON.stringify(mockTransmittals),
        });
        return;
      }

      if (pathName.endsWith('/pm_hse_incidents')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockIncidents),
        });
        return;
      }

      if (pathName.endsWith('/pm_hse_inspections')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockInspections),
        });
        return;
      }

      if (pathName.endsWith('/pm_hse_metrics')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockHseMetrics),
        });
        return;
      }

      if (pathName.endsWith('/pm_daily_obstructions')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
        return;
      }

      if (pathName.endsWith('/pm_deliverable_items')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
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
  // Scenario 1: Tender Management Portal (/tender)
  // =========================================================================
  test('Tender Portal renders pipeline KPIs, tender list, and tab navigation', async ({ page }) => {
    const tenderPage = new TenderPage(page);
    await tenderPage.goto();

    // Verify page heading and pipeline KPIs
    await expect(tenderPage.pageHeading).toBeVisible();
    await tenderPage.expectKpisVisible();

    // Verify tenders list loaded
    await tenderPage.expectTenderVisible('TND-2026-001');
    await tenderPage.expectTenderVisible('TND-2026-002');

    // Switch between tabs
    await tenderPage.switchTab('evaluation');
    await tenderPage.switchTab('awards');
    await tenderPage.switchTab('list');

    // Test search filter
    await tenderPage.searchTenders('مركز البيانات');
    await tenderPage.expectTenderVisible('TND-2026-001');
  });

  // =========================================================================
  // Scenario 2: Document Control & Engineering Drawings (/document-control)
  // =========================================================================
  test('Document Control renders controlled drawings, transmittals, and status metrics', async ({ page }) => {
    const docPage = new DocumentControlPage(page);
    await docPage.goto();

    // Verify page heading and stat cards
    await expect(docPage.pageHeading).toBeVisible();
    await docPage.expectKpisVisible();

    // Verify controlled document item rendered
    await docPage.expectDocumentVisible('DWG-STR-001');

    // Switch tabs to Transmittals and Recent Revisions
    await docPage.switchTab('transmittals');
    await docPage.switchTab('revisions');
    await docPage.switchTab('docs');

    // Search document filter
    await docPage.searchDocs('DWG-STR');
    await docPage.expectDocumentVisible('DWG-STR-001');
  });

  // =========================================================================
  // Scenario 3: Health, Safety & Environment (/hse)
  // =========================================================================
  test('HSE Portal renders safety metrics, incidents register, audits, and PTW notice', async ({ page }) => {
    const hsePage = new HsePage(page);
    await hsePage.goto();

    // Verify page heading and safety KPI cards
    await expect(hsePage.pageHeading).toBeVisible();
    await hsePage.expectKpisVisible();

    // Verify incidents register table renders incident
    await hsePage.expectIncidentVisible('INC-2026-003');

    // Switch to Audits tab and verify safety inspection
    await hsePage.switchTab('audits');
    await hsePage.expectInspectionVisible('م. خالد الدوسري');

    // Switch to Permits tab and verify electronic PTW notice
    await hsePage.switchTab('permits');
    await hsePage.expectPermitsNoticeVisible();
  });

  // =========================================================================
  // Scenario 4: Board of Directors Executive Overview (/board)
  // =========================================================================
  test('Board Dashboard renders executive portfolio KPIs, analytics charts, and active projects', async ({ page }) => {
    const boardPage = new BoardPage(page);
    await boardPage.goto();

    // Verify heading and Board of Directors badge
    await expect(boardPage.pageHeading).toBeVisible();
    await expect(boardPage.boardBadge).toBeVisible();

    // Verify Executive KPIs
    await boardPage.expectKpisVisible();

    // Verify Charts
    await boardPage.expectChartsVisible();

    // Verify Active Projects table
    await boardPage.expectProjectVisible('2612');
  });
});
