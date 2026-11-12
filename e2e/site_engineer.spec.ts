import { test, expect, Route } from '@playwright/test';

const TEST_SESSION_COOKIE =
  'base64-eyJhY2Nlc3NfdG9rZW4iOiJleUpoYkdjaU9pSkZVekkxTmlJc0ltdHBaQ0k2SWprd09EVXlZekV4TFdSa1l6RXROREl4WlMwNE9XSTJMVFl6TXpSaFpXTXhOak5pWXlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKcGMzTWlPaUpvZEhSd2N6b3ZMM1JuY1hCamRtbHhiV2QwWkdSa2FYRjJjV1IzTG5OMWNHRmlZWE5sTG1OdkwyRjFkR2d2ZGpFaUxDSnpkV0lpT2lJeE5XWmtOelF3TkMwek56SXdMVFEwWlRjdE9UaG1aQzB4TW1VNU1UZzFZbUkxTXpRaUxDSmhkV1FpT2lKaGRYUm9aVzUwYVdOaGRHVmtJaXdpWlhod0lqb3hOemc1TkRFNU56STJMQ0pwWVhRaU9qRTNPRGswTVRZeE1qWXNJbVZ0WVdsc0lqb2laVEpsTFhSbGMzUmxja0J3ZW05dVpTNWpiMjBpTENKd2FHOXVaU0k2SWlJc0ltRndjRjl0WlhSaFpHRjBZU0k2ZXlKd2NtOTJhV1JsY2lJNkltVnRZV2xzSWl3aWNISnZkbWxrWlhKeklqcGJJbVZ0WVdsc0lsMTlMQ0oxYzJWeVgyMWxkR0ZrWVhSaElqcDdJbVZ0WVdsc1gzWmxjbWxtYVdWa0lqcDBjblZsTENKbWRXeHNYMjVoYldVaU9pSkZNa1VnVkdWemRHVnlJaXdpWm5Wc2JGOXVZVzFsWDJGeUlqb2kyWVhaaDltRzJLX1lzeURZcDltRTJLZllydGlxMktqWXA5aXhJaXdpY205c1pYTWlPbHNpWVdSdGFXNGlMQ0p6YVhSbFgyVnVaMmx1WldWeUlpd2ljR3hoYm01cGJtZGZaVzVuYVc1bFpYSWlMQ0p3Y205cVpXTjBYMjFoYm1GblpYSWlYWDBzSW5KdmJHVWlPaUpoZFhSb1pXNTBhV05oZEdWa0lpd2lZV0ZzSWpvaVlXRnNNU0lzSW1GdGNpSTZXM3NpYldWMGFHOWtJam9pY0dGemMzZHZjbVFpTENKMGFXMWxjM1JoYlhBaU9qRTNPRGswTVRZeE1qWjlYU3dpYzJWemMybHZibDlwWkNJNkltWTNOREEzT1RReExUQTNZamN0TkdRNU55MDRNRFZqTFdZNFlXSTFaVFprTTJJMU5pSXNJbWx6WDJGdWIyNTViVzkxY3lJNlptRnNjMlY5LnRRWmViSkN2Mkt3TlMyNVBTWmwxeGw4YUhRMUhXVGtILWJWVFlGNXprc1Q2XzFSSFFwa0hsakZjWFVRckFIUFVOM3RPT1hOOWx2c3drOXM2SHB0Vlp3IiwidG9rZW5fdHlwZSI6ImJlYXJlciIsImV4cGlyZXNfaW4iOjM2MDAsImV4cGlyZXNfYXQiOjE3ODk0MTk3MjYsInJlZnJlc2hfdG9rZW4iOiJnNzQ3NDdscXV1aWQiLCJ1c2VyIjp7ImlkIjoiMTVmZDc0MDQtMzcyMC00NGU3LTk4ZmQtMTJlOTE4NWJiNTM0IiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiZW1haWwiOiJlMmUtdGVzdGVyQHB6b25lLmNvbSIsImVtYWlsX2NvbmZpcm1lZF9hdCI6IjIwMjYtMDktMTRUMTk6NTc6NDguMjgwMzM3WiIsInBob25lIjoiIiwiY29uZmlybWVkX2F0IjoiMjAyNi0wOS0xNFQxOTo1Nzo0OC4yODAzMzdaIiwibGFzdF9zaWduX2luX2F0IjoiMjAyNi0wOS0xNFQyMDowMjowNi41NTk4MjM4NThaIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWxfdmVyaWZpZWQiOnRydWUsImZ1bGxfbmFtZSI6IkUyRSBUZXN0ZXIiLCJmdWxsX25hbWVfYXIiOiLZhdmH2YbYr9izINin2YTYp9iu2KrYqNin2LEiLCJyb2xlcyI6WyJhZG1pbiIsInNpdGVfZW5naW5lZXIiLCJwbGFubmluZ19lbmdpbmVlciIsInByb2plY3RfbWFuYWdlciJdfSwiaWRlbnRpdGllcyI6W3siaWRlbnRpdHlfaWQiOiI4MTdhODBlOC00YjdlLTQ1NGMtYjg2NC1lOGY1NGE0M2JjZDEiLCJpZCI6IjE1ZmQ3NDA0LTM3MjAtNDRlNy05OGZkLTEyZTkxODViYjUzNCIsInVzZXJfaWQiOiIxNWZkNzQwNC0zNzIwLTQ0ZTctOThmZC0xMmU5MTg1YmI1MzQiLCJpZGVudGl0eV9kYXRhIjp7ImVtYWlsIjoiZTJlLXRlc3RlckBwem9uZS5jb20iLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwic3ViIjoiMTVmZDc0MDQtMzcyMC00NGU3LTk4ZmQtMTJlOTE4NWJiNTM0In0sInByb3ZpZGVyIjoiZW1haWwiLCJsYXN0X3NpZ25faW5fYXQiOiIyMDI2LTA5LTE0VDE5OjU3OjQ4LjI2ODY0N1oiLCJjcmVhdGVkX2F0IjoiMjAyNi0wOS0xNFQxOTo1Nzo0OC4yNjg3MDlaIiwidXBkYXRlZF9hdCI6IjIwMjYtMDktMTRUMTk6NTc6NDguMjY4NzA5WiIsImVtYWlsIjoiZTJlLXRlc3RlckBwem9uZS5jb20ifV0sImNyZWF0ZWRfYXQiOiIyMDI2LTA5LTE0VDE5OjU3OjQ4LjI0NjAzNloiLCJ1cGRhdGVkX2F0IjoiMjAyNi0wOS0xNFQyMDowMjowNi41NjIyNTRaIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0sIndlYWtfcGFzc3dvcmQiOm51bGx9';

interface MockTask {
  id: string;
  task_code: string;
  title_ar: string;
  discipline: string;
  project_id: string;
  zone_id: string;
  zone: { id: string; name_ar: string };
  boq_item_id: string;
  status: string;
  planned_qty: number;
  progress_pct: number;
  boq_item: {
    id: string;
    item_code: string;
    description_ar: string;
    contract_qty: number;
    unit: string;
    rate_egp: number;
  };
}

interface MockReportPayload {
  id: string;
  project_id: string;
  progress_date: string;
  discipline: string;
  status: string;
  site_task_id: string;
  notes?: string;
}

interface MockPhotoPayload {
  id: string;
  daily_progress_id: string;
  storage_path: string;
  photo_url?: string;
  caption?: string;
}

test.describe('Site Engineer Workflow E2E', () => {
  test('Fast Grid smart filtering, photo upload, and submitted report creation', async ({ context, page }) => {
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
      window.localStorage.setItem('pzone_active_project_id', 'proj-e2e-101');
      window.localStorage.setItem('project-storage', JSON.stringify({
        state: { activeProjectId: 'proj-e2e-101' },
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

    // 2. Setup mock data
    const projectId = 'proj-e2e-101';
    const mockProjects = [
      { id: projectId, project_code: '2612', project_name: 'مشروع برج الأمل التجاري' },
    ];

    const mockZones = [
      { id: 'zone-a', name_ar: 'المنطقة أ (Zone A)', project_id: projectId },
      { id: 'zone-b', name_ar: 'المنطقة ب (Zone B)', project_id: projectId },
    ];

    const mockTasks: MockTask[] = [
      {
        id: 'task-civil-1',
        task_code: 'CIV-001',
        title_ar: 'أعمال خرسانات مسلحة للقواعد',
        discipline: 'مدني',
        project_id: projectId,
        zone_id: 'zone-a',
        zone: { id: 'zone-a', name_ar: 'المنطقة أ (Zone A)' },
        boq_item_id: 'boq-item-1',
        status: 'in_progress',
        planned_qty: 100,
        progress_pct: 20,
        boq_item: {
          id: 'boq-item-1',
          item_code: 'B-01',
          description_ar: 'خرسانة مسلحة للقواعد',
          contract_qty: 100,
          unit: 'م3',
          rate_egp: 2500,
        },
      },
      {
        id: 'task-mep-2',
        task_code: 'MEP-002',
        title_ar: 'تمديد مسارات التغذية والصرف',
        discipline: 'ميكانيكا',
        project_id: projectId,
        zone_id: 'zone-b',
        zone: { id: 'zone-b', name_ar: 'المنطقة ب (Zone B)' },
        boq_item_id: 'boq-item-2',
        status: 'pending',
        planned_qty: 50,
        progress_pct: 0,
        boq_item: {
          id: 'boq-item-2',
          item_code: 'B-02',
          description_ar: 'مواسير PVC قطر 4 بوصة',
          contract_qty: 50,
          unit: 'م.ط',
          rate_egp: 400,
        },
      },
    ];

    const mockBoqItems = [
      mockTasks[0].boq_item,
      mockTasks[1].boq_item,
    ];

    let createdReport: MockReportPayload | null = null;
    const uploadedPhotos: MockPhotoPayload[] = [];

    // 3. Route interception for Supabase REST & Storage
    await page.route('**/rest/v1/**', async (route: Route) => {
      const url = route.request().url();
      const method = route.request().method();

      try {
        if (url.includes('/profiles')) {
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

        if (url.includes('/pm_projects_with_manager')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockProjects),
          });
          return;
        }

        if (url.includes('/pm_stakeholders')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
              {
                id: 'stk-site-1',
                user_id: '15fd7404-3720-44e7-98fd-12e9185bb534',
                email: 'e2e-tester@pzone.com',
                name_ar: 'مهندس الموقع',
              },
            ]),
          });
          return;
        }

        if (url.includes('/project_team_with_auth')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
              {
                stakeholder_id: 'stk-site-1',
                stakeholder_name_ar: 'مهندس الموقع',
                project_role: 'site_engineer',
                project_id: projectId,
                stakeholder_active: true,
              },
            ]),
          });
          return;
        }

        if (url.includes('/pm_zones')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockZones),
          });
          return;
        }

        if (url.includes('/pm_site_tasks')) {
          if (method === 'GET') {
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify(mockTasks),
            });
            return;
          }
          if (method === 'PATCH' || method === 'POST') {
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify(mockTasks[0]),
            });
            return;
          }
        }

        if (url.includes('/pm_boq_items') || url.includes('/v_boq_current')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockBoqItems),
          });
          return;
        }

        if (url.includes('/rpc/rpc_create_report')) {
          const rawBody = route.request().postDataJSON();
          createdReport = {
            id: `daily-rep-${Date.now()}`,
            project_id: rawBody.p_project_id || projectId,
            progress_date: rawBody.p_progress_date || new Date().toISOString().slice(0, 10),
            discipline: rawBody.p_discipline || 'civil',
            status: 'submitted',
            site_task_id: rawBody.p_site_task_id || 'task-civil-1',
            notes: rawBody.p_notes,
          };
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(createdReport),
          });
          return;
        }

        if (url.includes('/pm_daily_progress_photos')) {
          if (method === 'POST') {
            const rawBody = route.request().postDataJSON();
            const photoRecord: MockPhotoPayload = {
              id: `photo-${Date.now()}`,
              daily_progress_id: rawBody.daily_progress_id,
              storage_path: rawBody.storage_path,
              photo_url: rawBody.photo_url,
              caption: rawBody.caption,
            };
            uploadedPhotos.push(photoRecord);
            await route.fulfill({
              status: 201,
              contentType: 'application/json',
              body: JSON.stringify(photoRecord),
            });
            return;
          }
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(uploadedPhotos),
          });
          return;
        }

        if (url.includes('/pm_daily_progress_lines')) {
          if (method === 'POST') {
            const rawBody = route.request().postDataJSON();
            await route.fulfill({
              status: 201,
              contentType: 'application/json',
              body: JSON.stringify(
                Array.isArray(rawBody)
                  ? rawBody.map((l, i) => ({ id: `line-${i + 1}`, ...l }))
                  : [{ id: 'line-1', ...rawBody }]
              ),
            });
            return;
          }
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
              {
                id: 'line-old-1',
                daily_progress_id: 'old-rep-1',
                boq_item_id: 'boq-item-1',
                qty_today: 20,
                line_status: 'approved',
              },
            ]),
          });
          return;
        }

        if (url.includes('/rpc/rpc_create_report') || (url.includes('/pm_daily_progress') && (method === 'POST' || method === 'PATCH'))) {
          const rawBody = route.request().postDataJSON() || {};
          createdReport = {
            id: (method === 'PATCH' && url.includes('id=eq.')) ? url.split('id=eq.')[1].split('&')[0] : `daily-rep-${Date.now()}`,
            project_id: rawBody.p_project_id || rawBody.project_id || projectId,
            progress_date: rawBody.p_progress_date || rawBody.progress_date || new Date().toISOString().slice(0, 10),
            discipline: rawBody.p_discipline || rawBody.discipline || 'civil',
            status: rawBody.p_status || rawBody.status || 'submitted',
            site_task_id: rawBody.p_site_task_id || rawBody.site_task_id || 'task-civil-1',
            notes: rawBody.p_notes || rawBody.notes,
          };
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(url.includes('/rpc/rpc_create_report') ? createdReport : [createdReport]),
          });
          return;
        }

        if (url.includes('/pm_daily_progress')) {
          // Single record lookup (e.g. getDailyReportById)
          const isSingle = route.request().headers()['accept']?.includes('vnd.pgrst.object') || /(?:[?&])id=eq\./.test(url);
          if (isSingle) {
            const target = (createdReport && url.includes(createdReport.id)) ? createdReport : {
              id: 'old-rep-1',
              project_id: projectId,
              progress_date: '2026-09-10',
              discipline: 'civil',
              status: 'approved',
              site_task_id: 'task-civil-1',
              lines: [],
              photos: [],
              obstructions: [],
            };
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify(target),
            });
            return;
          }

          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
              {
                id: 'old-rep-1',
                project_id: projectId,
                progress_date: '2026-09-10',
                discipline: 'civil',
                status: 'approved',
                site_task_id: 'task-civil-1',
              },
            ]),
          });
          return;
        }

        if (url.includes('/pm_notifications') || url.includes('/notifications')) {
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({ id: 'notif-1' }),
          });
          return;
        }

        // Default fallback for any other rest endpoint
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      } catch (err: unknown) {
        console.error('Route handler error:', err);
        await route.abort();
      }
    });

    // 4. Intercept Supabase Storage uploads
    await page.route('**/storage/v1/object/**', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          Key: 'progress-photos/proj-e2e-101/site_concrete_sample.jpg',
          publicUrl: 'https://example.com/storage/progress-photos/site_concrete_sample.jpg',
        }),
      });
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.text().includes('error') || msg.text().includes('Error')) {
        console.log(`[PAGE ${msg.type().toUpperCase()}]:`, msg.text());
      }
    });
    page.on('pageerror', (err) => console.log('[PAGE ERROR]:', err.message));

    // 5. Navigate to /site-workspace
    await page.goto('/site-workspace');
    await page.waitForLoadState('domcontentloaded');

    // Verify main heading
    await expect(page.locator('h1').filter({ hasText: 'مساحة عمل الموقع' })).toBeVisible({ timeout: 15000 });

    // 6. Switch to Fast Grid view (Option 2)
    const fastGridBtn = page.locator('button').filter({ hasText: 'جدول إكسل سريع' });
    await expect(fastGridBtn).toBeVisible();
    await fastGridBtn.click();

    // 7. Verify Smart Filter Dropdowns are rendered
    const disciplineSelect = page.locator('select[data-testid="grid-filter-discipline"]');
    const zoneSelect = page.locator('select[data-testid="grid-filter-zone"]');
    await expect(disciplineSelect).toBeVisible();
    await expect(zoneSelect).toBeVisible();

    // Verify both tasks are initially visible
    await expect(page.locator('table tr').filter({ hasText: 'CIV-001' })).toBeVisible();
    await expect(page.locator('table tr').filter({ hasText: 'MEP-002' })).toBeVisible();

    // 8. Test Discipline filter: select 'مدني' -> only CIV-001 should remain
    await disciplineSelect.selectOption('مدني');
    await expect(page.locator('table tr').filter({ hasText: 'CIV-001' })).toBeVisible();
    await expect(page.locator('table tr').filter({ hasText: 'MEP-002' })).toBeHidden();

    // 9. Test Reset Filters button
    const resetBtn = page.locator('button[data-testid="grid-reset-filters"]');
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();
    await expect(page.locator('table tr').filter({ hasText: 'MEP-002' })).toBeVisible();

    // 10. Test Zone filter: select 'المنطقة ب (Zone B)' -> only MEP-002 should remain
    await zoneSelect.selectOption('المنطقة ب (Zone B)');
    await expect(page.locator('table tr').filter({ hasText: 'CIV-001' })).toBeHidden();
    await expect(page.locator('table tr').filter({ hasText: 'MEP-002' })).toBeVisible();

    // Reset back to all
    await zoneSelect.selectOption('all');
    await expect(page.locator('table tr').filter({ hasText: 'CIV-001' })).toBeVisible();

    // 11. Enter today's quantity for CIV-001 row
    const civRow = page.locator('table tr').filter({ hasText: 'CIV-001' });
    const todayQtyInput = civRow.locator('input[placeholder="0.00"]');
    await todayQtyInput.fill('15.0');

    // Verify today % synchronized (15 / 100 = 15%)
    const todayPctInput = civRow.locator('input[placeholder="0%"]');
    await expect(todayPctInput).toHaveValue('15');

    // 12. Open Focused Wizard Modal
    const openWizardBtn = civRow.locator('button[title="فتح المعالج المركز للتفاصيل والصور"]');
    await openWizardBtn.click();

    // Modal opens on Step 1: Quantities & Performance
    const wizardModal = page.getByRole('dialog');
    await expect(wizardModal).toBeVisible();

    // Fill quantity in Step 1 inside wizard
    const modalQtyInput = wizardModal.locator('input[placeholder="0.00"]').first();
    await modalQtyInput.fill('15.0');

    // Advance to Step 2: Site Operations & Conditions
    const nextBtn1 = wizardModal.locator('button').filter({ hasText: 'التالي' });
    await nextBtn1.click();

    // Advance to Step 3: Photos & Notes
    const nextBtn2 = wizardModal.locator('button').filter({ hasText: 'التالي' });
    await nextBtn2.click();

    // Step 3: Attach a photo and write caption
    const fileInput = wizardModal.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'site_photo_1.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]),
    });

    const captionInput = wizardModal.locator('input[placeholder="مثال: أعمال حدادة الجزء الشرقي..."]');
    await expect(captionInput).toBeVisible();
    await captionInput.fill('تم صب خرسانة القواعد المسلحة للقطاع الشمالي مع أخذ المكعبات');

    // Advance to Step 4: Summary & Confirmation
    const nextBtn3 = wizardModal.locator('button').filter({ hasText: 'التالي' });
    await nextBtn3.click();

    // Verify Step 4 summary reflects photos count
    await expect(wizardModal.locator('text=1 صورة')).toBeVisible();

    // 13. Confirm and Submit for Approval
    const submitBtn = wizardModal.locator('button').filter({ hasText: 'تأكيد وإرسال للاعتماد' });
    await submitBtn.click();

    // 14. Assert Toast message appears
    await expect(
      page.locator('[data-sonner-toast]').filter({
        hasText: 'تم إرسال تقرير الإنجاز بنجاح وهو بانتظار مراجعة مهندس التخطيط',
      })
    ).toBeVisible({ timeout: 10000 });

    // 15. Verify Report created with status 'submitted' and photo attached
    const finalReport = createdReport as MockReportPayload | null;
    expect(finalReport).not.toBeNull();
    expect(finalReport?.status).toBe('submitted');
    expect(finalReport?.site_task_id).toBe('task-civil-1');
    expect(uploadedPhotos.length).toBeGreaterThan(0);
    expect(uploadedPhotos[0].daily_progress_id).toBe(finalReport?.id);
  });
});
