import { test, expect, Route } from '@playwright/test';
import { DocumentControlPage } from './pages/DocumentControlPage';

const TEST_SESSION_COOKIE =
  'base64-eyJhY2Nlc3NfdG9rZW4iOiJleUpoYkdjaU9pSkZVekkxTmlJc0ltdHBaQ0k2SWprd09EVXlZekV4TFdSa1l6RXROREl4WlMwNE9XSTJMVFl6TXpSaFpXTXhOak5pWXlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKcGMzTWlPaUpvZEhSd2N6b3ZMM1JuY1hCamRtbHhiV2QwWkdSa2FYRjJjV1IzTG5OMWNHRmlZWE5sTG1OdkwyRjFkR2d2ZGpFaUxDSnpkV0lpT2lJeE5XWmtOelF3TkMwek56SXdMVFEwWlRjdE9UaG1aQzB4TW1VNU1UZzFZbUkxTXpRaUxDSmhkV1FpT2lKaGRYUm9aVzUwYVdOaGRHVmtJaXdpWlhod0lqb3hOemc1TkRFNU56STJMQ0pwWVhRaU9qRTNPRGswTVRZeE1qWXNJbVZ0WVdsc0lqb2laVEpsTFhSbGMzUmxja0J3ZW05dVpTNWpiMjBpTENKd2FHOXVaU0k2SWlJc0ltRndjRjl0WlhSaFpHRjBZU0k2ZXlKd2NtOTJhV1JsY2lJNkltVnRZV2xzSWl3aWNISnZkbWxrWlhKeklqcGJJbVZ0WVdsc0lsMTlMQ0oxYzJWeVgyMWxkR0ZrWVhSaElqcDdJbVZ0WVdsc1gzWmxjbWxtYVdWa0lqcDBjblZsTENKbWRXeHNYMjVoYldVaU9pSkZNa1VnVkdWemRHVnlJaXdpWm5Wc2JGOXVZVzFsWDJGeUlqb2kyWVhaaDltRzJLX1lzeURZcDltRTJLZllydGlxMktqWXA5aXhJaXdpY205c1pYTWlPbHNpWVdSdGFXNGlMQ0p6YVhSbFgyVnVaMmx1WldWeUlpd2ljR3hoYm01cGJtZGZaVzVuYVc1bFpYSWlMQ0p3Y205cVpXTjBYMjFoYm1GblpYSWlYWDBzSW5KdmJHVWlPaUpoZFhSb1pXNTBhV05oZEdWa0lpd2lZV0ZzSWpvaVlXRnNNU0lzSW1GdGNpSTZXM3NpYldWMGFHOWtJam9pY0dGemMzZHZjbVFpTENKMGFXMWxjM1JoYlhBaU9qRTNPRGswTVRZeE1qWjlYU3dpYzJWemMybHZibDlwWkNJNkltWTNOREEzT1RReExUQTNZamN0TkdRNU55MDRNRFZqTFdZNFlXSTFaVFprTTJJMU5pSXNJbWx6WDJGdWIyNTViVzkxY3lJNlptRnNjMlY5LnRRWmViSkN2Mkt3TlMyNVBTWmwxeGw4YUhRMUhXVGtILWJWVFlGNXprc1Q2XzFSSFFwa0hsakZjWFVRckFIUFVOM3RPT1hOOWx2c3drOXM2SHB0Vlp3IiwidG9rZW5fdHlwZSI6ImJlYXJlciIsImV4cGlyZXNfaW4iOjM2MDAsImV4cGlyZXNfYXQiOjE3ODk0MTk3MjYsInJlZnJlc2hfdG9rZW4iOiJnNzQ3NDdscXV1aWQiLCJ1c2VyIjp7ImlkIjoiMTVmZDc0MDQtMzcyMC00NGU3LTk4ZmQtMTJlOTE4NWJiNTM0IiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiZW1haWwiOiJlMmUtdGVzdGVyQHB6b25lLmNvbSIsImVtYWlsX2NvbmZpcm1lZF9hdCI6IjIwMjYtMDktMTRUMTk6NTc6NDguMjgwMzM3WiIsInBob25lIjoiIiwiY29uZmlybWVkX2F0IjoiMjAyNi0wOS0xNFQxOTo1Nzo0OC4yODAzMzdaIiwibGFzdF9zaWduX2luX2F0IjoiMjAyNi0wOS0xNFQyMDowMjowNi41NTk4MjM4NThaIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWxfdmVyaWZpZWQiOnRydWUsImZ1bGxfbmFtZSI6IkUyRSBUZXN0ZXIiLCJmdWxsX25hbWVfYXIiOiLZhdmH2YbYr9izINin2YTYp9iu2KrYqNin2LEiLCJyb2xlcyI6WyJhZG1pbiIsInNpdGVfZW5naW5lZXIiLCJwbGFubmluZ19lbmdpbmVlciIsInByb2plY3RfbWFuYWdlciJdfSwiaWRlbnRpdGllcyI6W3siaWRlbnRpdHlfaWQiOiI4MTdhODBlOC00YjdlLTQ1NGMtYjg2NC1lOGY1NGE0M2JjZDEiLCJpZCI6IjE1ZmQ3NDA0LTM3MjAtNDRlNy05OGZkLTEyZTkxODViYjUzNCIsInVzZXJfaWQiOiIxNWZkNzQwNC0zNzIwLTQ0ZTctOThmZC0xMmU5MTg1YmI1MzQiLCJpZGVudGl0eV9kYXRhIjp7ImVtYWlsIjoiZTJlLXRlc3RlckBwem9uZS5jb20iLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwic3ViIjoiMTVmZDc0MDQtMzcyMC00NGU3LTk4ZmQtMTJlOTE4NWJiNTM0In0sInByb3ZpZGVyIjoiZW1haWwiLCJsYXN0X3NpZ25faW5fYXQiOiIyMDI2LTA5LTE0VDE5OjU3OjQ4LjI2ODY0N1oiLCJjcmVhdGVkX2F0IjoiMjAyNi0wOS0xNFQxOTo1Nzo0OC4yNjg3MDlaIiwidXBkYXRlZF9hdCI6IjIwMjYtMDktMTRUMTk6NTc6NDguMjY4NzA5WiIsImVtYWlsIjoiZTJlLXRlc3RlckBwem9uZS5jb20ifV0sImNyZWF0ZWRfYXQiOiIyMDI2LTA5LTE0VDE5OjU3OjQ4LjI0NjAzNloiLCJ1cGRhdGVkX2F0IjoiMjAyNi0wOS0xNFQyMDowMjowNi41NjIyNTRaIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0sIndlYWtfcGFzc3dvcmQiOm51bGx9';

test.describe('Document Control Enterprise Portal E2E Suite', () => {
  const projectId = 'proj-e2e-pmo-101';

  let documentsState = [
    {
      id: 'doc-1',
      project_id: projectId,
      document_number: 'DWG-STR-001',
      revision: '00',
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

  let transmittalsState = [
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

  test.beforeEach(async ({ context, page }) => {
    // Reset state before each test
    documentsState = [
      {
        id: 'doc-1',
        project_id: projectId,
        document_number: 'DWG-STR-001',
        revision: '00',
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

    // 1. Seed session cookies + E2E bypass
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

    // 2. Seed localStorage with exact Zustand persist store and legacy keys
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

    // 3. Mock Supabase Auth
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
              roles: ['admin', 'doc_controller', 'technical_office_engineer', 'project_manager'],
            },
          },
        }),
      });
    });

    // 4. Mock PostgREST API calls
    await page.route('**/rest/v1/**', async (route: Route) => {
      const url = new URL(route.request().url());
      const pathName = url.pathname;
      const method = route.request().method();

      if (pathName.endsWith('/profiles')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: '15fd7404-3720-44e7-98fd-12e9185bb534',
            roles: ['admin', 'doc_controller', 'technical_office_engineer', 'project_manager'],
          }),
        });
        return;
      }

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
              project_name: 'مشروع برج الأمل التجاري',
              name: 'مشروع برج الأمل التجاري',
            },
          ]),
        });
        return;
      }

      if (pathName.endsWith('/pm_controlled_documents')) {
        if (method === 'POST' || method === 'PUT') {
          const postData = route.request().postDataJSON();
          const newEntry = {
            id: postData.id || `doc-${Date.now()}`,
            ...postData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          documentsState.push(newEntry);
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify(newEntry),
          });
          return;
        }

        // Stats count query or normal listing
        const statusFilter = url.searchParams.get('status');
        let filtered = documentsState;
        if (statusFilter && statusFilter.startsWith('eq.')) {
          const st = statusFilter.replace('eq.', '');
          filtered = filtered.filter((d) => d.status === st);
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: {
            'content-range': `0-${Math.max(0, filtered.length - 1)}/${filtered.length}`,
          },
          body: JSON.stringify(filtered),
        });
        return;
      }

      if (pathName.endsWith('/pm_document_transmittals')) {
        if (method === 'POST' || method === 'PUT') {
          const postData = route.request().postDataJSON();
          const newEntry = {
            id: postData.id || `trn-${Date.now()}`,
            ...postData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          transmittalsState.push(newEntry);
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify(newEntry),
          });
          return;
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: {
            'content-range': `0-${Math.max(0, transmittalsState.length - 1)}/${transmittalsState.length}`,
          },
          body: JSON.stringify(transmittalsState),
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

  test('Scenario 1: Dashboard KPIs and initial documents list render correctly', async ({ page }) => {
    const docPage = new DocumentControlPage(page);
    await docPage.goto();

    await expect(docPage.pageHeading).toBeVisible();
    await docPage.expectKpisVisible();

    // Verify documents in list
    await docPage.expectDocumentVisible('DWG-STR-001');
    await docPage.expectDocumentVisible('SUB-MEP-014');
  });

  test('Scenario 2: Search filter displays only matching documents', async ({ page }) => {
    const docPage = new DocumentControlPage(page);
    await docPage.goto();

    await docPage.searchDocs('DWG-STR');
    await docPage.expectDocumentVisible('DWG-STR-001');
    await expect(page.locator('text=SUB-MEP-014')).not.toBeVisible();
  });

  test('Scenario 3: Add Document modal creates and displays new controlled document', async ({ page }) => {
    const docPage = new DocumentControlPage(page);
    await docPage.goto();

    await docPage.openAddDocumentModal();

    await docPage.fillAndSubmitDocument({
      docNumber: 'DWG-ARC-099',
      revision: '00',
      titleAr: 'مخططات الواجهات الزجاجية',
      titleEn: 'Curtain Wall Facade Details',
      type: 'drawing',
      discipline: 'architectural',
      status: 'approved',
    });

    // Verify modal closes and document appears
    await expect(docPage.addDocModal).not.toBeVisible();
    await docPage.expectDocumentVisible('DWG-ARC-099');
  });

  test('Scenario 4: Transmittals tab navigation and New Transmittal creation', async ({ page }) => {
    const docPage = new DocumentControlPage(page);
    await docPage.goto();

    // Switch to transmittals tab
    await docPage.switchTab('transmittals');
    await docPage.expectTransmittalVisible('TRN-2026-042');

    // Open and submit new transmittal
    await docPage.openNewTransmittalModal();
    await docPage.fillAndSubmitTransmittal({
      transmittalNumber: 'TRN-2026-099',
      sender: 'المقاول العام - بي زون',
      recipient: 'استشاري المشروع',
      purpose: 'for_approval',
      count: 3,
      status: 'SENT',
    });

    // Verify transmittal appears
    await expect(docPage.newTransmittalModal).not.toBeVisible();
    await docPage.expectTransmittalVisible('TRN-2026-099');
  });

  test('Scenario 5: Revisions tab displays documents with revision badges and update button', async ({ page }) => {
    const docPage = new DocumentControlPage(page);
    await docPage.goto();

    // Switch to Revisions tab
    await docPage.switchTab('revisions');
    await docPage.expectDocumentVisible('DWG-STR-001');

    // Check revision badge and update button
    await expect(page.locator('text=DWG-STR-001')).toBeVisible();
    await expect(page.getByRole('button', { name: /تحديث المراجعة|Update Rev/i }).first()).toBeVisible();
  });
});
