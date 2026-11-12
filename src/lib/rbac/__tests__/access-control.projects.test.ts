import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ACTIVE_MODULE_ACCESS,
  ACTIVE_EDIT_ROLES,
  COMMERCIAL_EXECUTION_ROUTES,
  FALLBACK_EDIT_ROLES,
  routeKeyForPath,
  editRolesForPath,
  canAccessPath,
  canEditPath,
  type ModuleAccessRule,
} from '../access-control';
import {
  escapeHtml,
  toSafeHttpUrl,
  validateSafeUploadFile,
} from '@/lib/utils/security';
import { controlledDocumentSchema } from '@/lib/validation/schemas/document-control.schema';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
    rpc: vi.fn(),
    storage: {
      from: vi.fn(),
    },
  },
}));

import { supabase } from '@/lib/supabase';
import { appCache } from '@/lib/cache';
import { DeliverablesService } from '@/lib/services/deliverables.service';
import { BoqService } from '@/lib/services/boq.service';
import { WBSService } from '@/lib/services/wbs.service';
import { contractsService } from '@/lib/services/contracts.service';
import { generatePrintHtml } from '@/lib/reports/reportEngine';

describe('RBAC Central Matrix & Projects/Sub-Route Access Control (FE-07)', () => {
  const ALL_REPRESENTATIVE_ROUTES = [
    ...Object.keys(ACTIVE_MODULE_ACCESS),
    ...Object.keys(ACTIVE_EDIT_ROLES),
    ...Object.keys(COMMERCIAL_EXECUTION_ROUTES),
    '/projects/123',
    '/projects/123/edit',
    '/projects/new',
    '/contracts/abc',
    '/contracts/claims',
    '/contracts/claims/456',
    '/planning/baseline',
    '/planning/baseline/v2',
    '/planning/activities/import',
    '/planning/daily-progress/2026-11-11',
    '/planning/custom-subpath',
    '/cost-control/ledger',
    '/deliverables/pkg-1',
    '/document-control/rev-2',
    '/hse/incidents/99',
    '/tender/rfq-1',
    '/tenders/rfq-2',
    '/tenders/new',
  ];

  it('denies canEditPath to viewer on EVERY route (including /profile, /projects, and DB overrides)', () => {
    const permissiveDbRules: ModuleAccessRule[] = [
      {
        module_path: '/projects',
        allowed_roles: ['all'],
        edit_roles: ['all', 'viewer'],
      },
    ];

    for (const route of ALL_REPRESENTATIVE_ROUTES) {
      expect(canEditPath(route, ['viewer'], false)).toBe(false);
      expect(canEditPath(route, ['viewer'], false, permissiveDbRules)).toBe(false);
      expect(canEditPath(route, [], false)).toBe(false);
      expect(canEditPath(route, null, false)).toBe(false);
      expect(canEditPath(route, undefined, false)).toBe(false);
    }

    // Viewer can read /projects list, but can NEVER access /projects/[id]/edit or /projects/new
    expect(canAccessPath('/projects', ['viewer'], false)).toBe(true);
    expect(canAccessPath('/projects/123/edit', ['viewer'], false)).toBe(false);
    expect(canAccessPath('/projects/new', ['viewer'], false)).toBe(false);
  });

  it('preserves explicit ACTIVE_EDIT_ROLES overrides in FALLBACK_EDIT_ROLES (/cost-control, /contracts)', () => {
    // /cost-control must preserve finance & admin from ACTIVE_EDIT_ROLES instead of being overwritten by COMMERCIAL_EXECUTION_ROUTES
    expect(FALLBACK_EDIT_ROLES['/cost-control']).toEqual(['cost_control', 'finance', 'admin']);
    expect(canEditPath('/cost-control', ['finance'], false)).toBe(true);
    expect(canEditPath('/cost-control/sub-ledger', ['finance'], false)).toBe(true);
    expect(canEditPath('/cost-control', ['cost_control'], false)).toBe(true);
    expect(canEditPath('/cost-control', ['site_engineer'], false)).toBe(false);

    // /contracts must preserve ACTIVE_EDIT_ROLES (contract_admin, commercial_manager, admin)
    expect(FALLBACK_EDIT_ROLES['/contracts']).toEqual([
      'contract_admin',
      'commercial_manager',
      'admin',
    ]);
    expect(editRolesForPath('/contracts')).toContain('admin');
    expect(canEditPath('/contracts', ['commercial_manager'], false)).toBe(true);
    expect(canEditPath('/contracts', ['contract_admin'], false)).toBe(true);
    expect(canEditPath('/contracts', ['ipc_clerk'], false)).toBe(false);
  });

  it('aligns /projects, /projects/new, and /projects/[id]/edit edit permissions across key roles', () => {
    // project_manager: edits existing projects, cannot access /projects/new unless granted
    expect(canEditPath('/projects', ['project_manager'], false)).toBe(true);
    expect(canEditPath('/projects/123/edit', ['project_manager'], false)).toBe(true);
    expect(canAccessPath('/projects/123/edit', ['project_manager'], false)).toBe(true);
    expect(canEditPath('/projects/new', ['project_manager'], false)).toBe(false);

    // commercial_manager: can create & edit projects and contracts
    expect(canEditPath('/projects', ['commercial_manager'], false)).toBe(true);
    expect(canEditPath('/projects/new', ['commercial_manager'], false)).toBe(true);
    expect(canEditPath('/projects/123/edit', ['commercial_manager'], false)).toBe(true);
    expect(canAccessPath('/projects/123/edit', ['commercial_manager'], false)).toBe(true);
    expect(canEditPath('/contracts/claims', ['commercial_manager'], false)).toBe(true);

    // planning_manager: aligned across /projects, /projects/new, /projects/123/edit, /planning, and /planning/baseline
    expect(canEditPath('/projects', ['planning_manager'], false)).toBe(true);
    expect(canEditPath('/projects/new', ['planning_manager'], false)).toBe(true);
    expect(canEditPath('/projects/123/edit', ['planning_manager'], false)).toBe(true);
    expect(canAccessPath('/projects/123/edit', ['planning_manager'], false)).toBe(true);
    expect(canEditPath('/planning', ['planning_manager'], false)).toBe(true);
    expect(canEditPath('/planning/baseline', ['planning_manager'], false)).toBe(true);

    // ceo: aligned across /projects, /projects/new, and /projects/123/edit
    expect(canEditPath('/projects', ['ceo'], false)).toBe(true);
    expect(canEditPath('/projects/new', ['ceo'], false)).toBe(true);
    expect(canEditPath('/projects/123/edit', ['ceo'], false)).toBe(true);
    expect(canAccessPath('/projects/123/edit', ['ceo'], false)).toBe(true);

    // admin: full access & edit on every route via role or isAdmin flag
    for (const route of ALL_REPRESENTATIVE_ROUTES) {
      expect(canAccessPath(route, ['admin'], false)).toBe(true);
      expect(canEditPath(route, ['admin'], false)).toBe(true);
      expect(canAccessPath(route, [], true)).toBe(true);
      expect(canEditPath(route, [], true)).toBe(true);
    }
  });

  it('normalizes sub-routes accurately in routeKeyForPath while preserving dedicated sub-route keys', () => {
    expect(routeKeyForPath('/projects/new')).toBe('/projects/new');
    expect(routeKeyForPath('/projects/new/?tab=1')).toBe('/projects/new');
    expect(routeKeyForPath('/projects/123')).toBe('/projects');
    expect(routeKeyForPath('/projects/123/edit')).toBe('/projects');

    expect(routeKeyForPath('/planning/baseline')).toBe('/planning/baseline');
    expect(routeKeyForPath('/planning/baseline/rev-1')).toBe('/planning/baseline');
    expect(routeKeyForPath('/planning/activities/import')).toBe('/planning/activities');
    expect(routeKeyForPath('/planning/daily-progress/new')).toBe('/planning/daily-progress');
    expect(routeKeyForPath('/planning/mos')).toBe('/planning');

    expect(routeKeyForPath('/contracts/claims')).toBe('/contracts/claims');
    expect(routeKeyForPath('/contracts/claims/eot-1')).toBe('/contracts/claims');
    expect(routeKeyForPath('/contracts/vo-list')).toBe('/contracts');

    expect(routeKeyForPath('/cost-control/variance')).toBe('/cost-control');
    expect(routeKeyForPath('/deliverables/e1/list')).toBe('/deliverables');
    expect(routeKeyForPath('/coo/deliverables/summary')).toBe('/coo/deliverables');
    expect(routeKeyForPath('/document-control/transmittals')).toBe('/document-control');
    expect(routeKeyForPath('/hse/inspections')).toBe('/hse');
    expect(routeKeyForPath('/tender/bid-1')).toBe('/tender');
    expect(routeKeyForPath('/tenders/bid-1')).toBe('/tender');
    expect(routeKeyForPath('/tenders/new')).toBe('/tenders/new');

    // Dedicated /planning/baseline rule excludes project_manager while /planning/activities includes project_manager
    expect(canEditPath('/planning/baseline', ['project_manager'], false)).toBe(false);
    expect(canEditPath('/planning/activities', ['project_manager'], false)).toBe(true);
  });
});

describe('Security Helpers, URL Validation, Upload Guard & Service Fail-Closed Invariants (FE-01/FE-02/FE-06/SEC-08)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appCache.invalidate('');
  });

  it('escapes HTML entities in escapeHtml and restricts URLs in toSafeHttpUrl / controlledDocumentSchema', () => {
    expect(escapeHtml(`<script>alert("xss" & '1')</script>`)).toBe(
      '&lt;script&gt;alert(&quot;xss&quot; &amp; &#39;1&#39;)&lt;/script&gt;'
    );
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');

    expect(toSafeHttpUrl('https://pzoneinternational.com/doc.pdf')).toBe(
      'https://pzoneinternational.com/doc.pdf'
    );
    expect(toSafeHttpUrl('http://example.com/a')).toBe('http://example.com/a');
    expect(toSafeHttpUrl('javascript:alert(1)')).toBeNull();
    expect(toSafeHttpUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(toSafeHttpUrl('vbscript:msgbox(1)')).toBeNull();
    expect(toSafeHttpUrl('')).toBeNull();

    const baseDoc = {
      project_id: 'proj-1',
      document_number: 'DWG-01',
      revision: '00',
      title_ar: 'مخطط',
      title_en: 'Drawing',
      type: 'drawing' as const,
      discipline: 'Civil',
      status: 'draft' as const,
    };
    expect(
      controlledDocumentSchema.safeParse({ ...baseDoc, file_url: 'javascript:alert(1)' }).success
    ).toBe(false);
    expect(
      controlledDocumentSchema.safeParse({ ...baseDoc, file_url: 'data:text/html,evil' }).success
    ).toBe(false);
    expect(
      controlledDocumentSchema.safeParse({ ...baseDoc, file_url: 'https://example.com/ok.pdf' })
        .success
    ).toBe(true);
    expect(controlledDocumentSchema.safeParse({ ...baseDoc, file_url: '' }).success).toBe(true);
  });

  it('blocks dangerous extensions, empty files, and oversized files in validateSafeUploadFile & DeliverablesService.uploadAttachment', async () => {
    const blockedExts = [
      'xss.svg',
      'page.html',
      'page.htm',
      'doc.xhtml',
      'script.js',
      'mod.mjs',
      'bin.exe',
      'run.bat',
      'run.cmd',
      'run.ps1',
      'run.sh',
      'shell.php',
    ];
    for (const name of blockedExts) {
      const f = new File(['payload'], name, { type: 'application/octet-stream' });
      expect(validateSafeUploadFile(f).valid).toBe(false);
    }

    const emptyFile = new File([], 'photo.jpg', { type: 'image/jpeg' });
    expect(validateSafeUploadFile(emptyFile).valid).toBe(false);

    const validPdf = new File(['%PDF-1.4 content'], 'drawing.pdf', { type: 'application/pdf' });
    expect(validateSafeUploadFile(validPdf).valid).toBe(true);
    expect(validateSafeUploadFile(validPdf, 4).valid).toBe(false);

    // SEC-08: uploadAttachment must NOT insert phantom DB rows when file is unsafe or storage fails
    const insertSpy = vi.fn();
    vi.mocked(supabase.from).mockReturnValue({ insert: insertSpy } as never);
    vi.mocked(supabase.storage.from).mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: { message: 'Bucket quota exceeded' } }),
    } as never);

    const svgFile = new File(['<svg onload=alert(1)>'], 'diagram.svg', { type: 'image/svg+xml' });
    await expect(DeliverablesService.uploadAttachment('del-1', svgFile)).rejects.toThrow();
    expect(insertSpy).not.toHaveBeenCalled();

    await expect(DeliverablesService.uploadAttachment('del-1', validPdf)).rejects.toBeTruthy();
    expect(insertSpy).not.toHaveBeenCalled();
  });

  it('enforces fail-closed manager authority on [], viewer, and undefined callerRoles via Supabase profile lookup', async () => {
    await expect(DeliverablesService.verifyManagerAuthority([])).rejects.toThrow(/Forbidden/);
    await expect(DeliverablesService.verifyManagerAuthority(['viewer'])).rejects.toThrow(
      /Forbidden/
    );
    await expect(DeliverablesService.verifyManagerAuthority(['site_engineer'])).rejects.toThrow(
      /Forbidden/
    );
    await expect(
      DeliverablesService.verifyManagerAuthority(['project_manager'])
    ).resolves.toBeUndefined();

    // Unauthenticated user when callerRoles is undefined -> Forbidden
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as never);
    await expect(DeliverablesService.verifyManagerAuthority(undefined)).rejects.toThrow(
      /Forbidden/
    );

    // Authenticated viewer when callerRoles is undefined -> Forbidden
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'u-viewer' } },
      error: null,
    } as never);
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { roles: ['viewer'], is_active: true, status: 'active' },
            error: null,
          }),
        }),
      }),
    } as never);
    await expect(DeliverablesService.verifyManagerAuthority(undefined)).rejects.toThrow(
      /Forbidden/
    );

    // Authenticated to_manager when callerRoles is undefined -> Allowed
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { roles: ['to_manager'], is_active: true, status: 'active' },
            error: null,
          }),
        }),
      }),
    } as never);
    await expect(DeliverablesService.verifyManagerAuthority(undefined)).resolves.toBeUndefined();
  });

  it('strips prices in BoqService.getBoqItemById/getBoqItemFresh, WBSService.getWBSTree, and guards non-array cos in contractsService', async () => {
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'pm_boq_items') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'boq-1',
                  item_code: '01.01',
                  description_ar: 'حفر',
                  rate_egp: 250,
                  amount_egp: 50000,
                  contract_qty: 200,
                },
                error: null,
              }),
              then: (resolve: (v: unknown) => void) =>
                resolve({
                  data: [
                    {
                      id: 'boq-1',
                      wbs_item_id: 'wbs-1',
                      item_code: '01.01',
                      description_ar: 'حفر',
                      amount_egp: 50000,
                      contract_qty: 200,
                      rate_egp: 250,
                    },
                  ],
                  error: null,
                }),
            }),
          }),
        } as never;
      }
      if (table === 'pm_wbs_items') {
        const chain: Record<string, unknown> = {};
        chain.select = vi.fn().mockReturnValue(chain);
        chain.eq = vi.fn().mockReturnValue(chain);
        chain.order = vi.fn().mockReturnValue(chain);
        chain.then = (resolve: (v: unknown) => void) =>
          resolve({
            data: [
              {
                id: 'wbs-1',
                project_id: 'proj-1',
                wbs_code: '1.1',
                title_ar: 'أعمال ترابية',
                weight_percentage: 100,
                status: 'in_progress',
                budgeted_cost: 50000,
                actual_cost: 10000,
                earned_value: 25000,
              },
            ],
            error: null,
          });
        return chain as never;
      }
      if (table === 'pm_project_activities') {
        const chain: Record<string, unknown> = {};
        chain.select = vi.fn().mockReturnValue(chain);
        chain.eq = vi.fn().mockReturnValue(chain);
        chain.order = vi.fn().mockResolvedValue({
          data: [
            {
              id: 'act-1',
              project_id: 'proj-1',
              wbs_item_id: 'wbs-1',
              percent_complete: 50,
              budgeted_cost_egp: 50000,
              duration_days: 10,
            },
          ],
          error: null,
        });
        return chain as never;
      }
      if (table === 'pm_activity_boq_links') {
        return {
          select: vi.fn().mockResolvedValue({
            data: [
              {
                id: 'lnk-1',
                activity_id: 'act-1',
                boq_item_id: 'boq-1',
                planned_qty: 200,
                baseline_rate_egp: 250,
              },
            ],
            error: null,
          }),
        } as never;
      }
      if (table === 'pm_change_orders') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                // Malformed non-array truthy object
                data: { error: 'unexpected postgrest payload' },
                error: null,
              }),
            }),
          }),
        } as never;
      }
      if (table === 'pm_projects') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: { metadata: {} }, error: null }),
            }),
          }),
        } as never;
      }
      return { select: vi.fn() } as never;
    });

    const maskedById = await BoqService.getBoqItemById('boq-1', false);
    expect(maskedById?.rate_egp).toBeNull();
    expect(maskedById?.amount_egp).toBeNull();
    expect(maskedById?.contract_qty).toBeNull();

    // Ensure cached item was NOT mutated when canSeePrices is true
    const unmaskedById = await BoqService.getBoqItemById('boq-1', true);
    expect(unmaskedById?.rate_egp).toBe(250);
    expect(unmaskedById?.amount_egp).toBe(50000);

    const maskedFresh = await BoqService.getBoqItemFresh('boq-1', false);
    expect(maskedFresh?.rate_egp).toBeNull();
    expect(maskedFresh?.amount_egp).toBeNull();

    const maskedTree = await WBSService.getWBSTree('proj-1', false);
    expect(maskedTree).toHaveLength(1);
    expect(maskedTree[0].budgeted_cost).toBeNull();
    expect(maskedTree[0].actual_cost).toBeNull();
    expect(maskedTree[0].earned_value).toBeNull();
    expect(maskedTree[0].progress_pct).toBe(50);
    expect(maskedTree[0].activities?.[0].budgeted_cost_egp).toBeNull();
    expect(maskedTree[0].activities?.[0].boq_links?.[0].baseline_rate_egp).toBeNull();
    expect(maskedTree[0].activities?.[0].boq_links?.[0].boq_item?.rate_egp).toBeNull();

    const vos = await contractsService.getVariationOrders('proj-non-array');
    expect(vos).toEqual([]);
  });

  it('escapes untrusted strings in reportEngine.generatePrintHtml before document.write', () => {
    const html = generatePrintHtml(
      {
        title: '<script>alert("title")</script>',
        subtitle: '<img src=x onerror=alert(1)>',
        reportCode: 'REP-<1>',
        companyNameAr: '<b>شركة</b>',
        companyNameEn: '<i>PZone</i>',
        classification: '<svg onload=alert(1)>',
        notes: 'Line 1 <script>evil()</script>\nLine 2',
        orientation: 'landscape',
        paperSize: 'a4',
        fontSize: 'md',
        includeKpis: true,
        includeSignatures: true,
        includeTimestamp: true,
        includePageNumbers: true,
        selectedColumnIds: ['name'],
        generatedBy: '<script>gen()</script>',
        signatures: [
          {
            id: 's1',
            role: '<script>role()</script>',
            name: '<img onerror=alert(2)>',
            title: '<b>mgr</b>',
          },
        ],
      },
      [
        {
          id: 'name',
          labelAr: '<th>hack</th>',
          labelEn: '<script>col()</script>',
          getValue: (r: { name: string }) => r.name,
        },
      ],
      [{ name: '<script>cell()</script>' }],
      [{ id: 'k1', label: '<b>kpi</b>', value: '<script>v()</script>', subtext: '<i>sub</i>' }]
    );

    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img src=x');
    expect(html).not.toContain('<svg onload=');
    expect(html).toContain('&lt;script&gt;alert(&quot;title&quot;)&lt;/script&gt;');
    expect(html).toContain('Line 1 &lt;script&gt;evil()&lt;/script&gt;<br/>Line 2');
    expect(html).toContain('&lt;script&gt;cell()&lt;/script&gt;');
  });
});
