import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildUpdatePayload, buildCreatePayload } from '../services/project.payload';
import { validateProjectDates } from '../utils/project-creation.utils';
import { ProjectService } from '../services/project.service';
import { appCache } from '../cache';

const { mockSupabaseInstance } = vi.hoisted(() => {
  const instance = {
    from: vi.fn(),
    rpc: vi.fn(),
  };
  return { mockSupabaseInstance: instance };
});

vi.mock('../supabase/client', () => ({
  supabase: mockSupabaseInstance,
  createSupabaseBrowserClient: () => mockSupabaseInstance,
  createHrDbClient: () => mockSupabaseInstance,
}));

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabaseInstance,
}));

describe('Phase 1 — S1 & S6: Stakeholder Import and Hook Safety', () => {
  it('S6: importStakeholders skips intra-file duplicate names/codes instead of setting id="pending_new"', async () => {
    const mockSelect = vi.fn().mockResolvedValue({ data: [], error: null });
    const mockInsert = vi.fn().mockResolvedValue({ data: [], error: null });
    const mockUpdate = vi.fn().mockResolvedValue({ data: [], error: null });

    const fromMock = vi.fn((table: string) => {
      if (table === 'stakeholders') {
        return {
          select: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              limit: mockSelect,
            }),
          }),
          insert: mockInsert,
          update: vi.fn().mockReturnValue({
            eq: mockUpdate,
          }),
        };
      }
      return { select: vi.fn(), insert: vi.fn() };
    });

    (mockSupabaseInstance.from as any) = fromMock;

    const items = [
      { name_ar: 'مهندس أحمد علي', email: 'ahmed@pzone.dev', employee_code: 'EMP-01' },
      // Duplicate in the very same batch!
      { name_ar: 'مهندس أحمد علي', email: 'ahmed@pzone.dev', employee_code: 'EMP-01' },
    ];

    const result = await ProjectService.batchImportStakeholders(items as any, { updateExisting: true });

    // The second row must be counted as skipped or handled gracefully, NOT sent to update with id='pending_new'
    expect(result.skipped).toBeGreaterThanOrEqual(1);
    if (mockUpdate.mock.calls.length > 0) {
      for (const call of mockUpdate.mock.calls) {
        expect(call[1]).not.toBe('pending_new');
      }
    }
  });
});

describe('Phase 1 — X1: No Write-on-Read in getProjectStakeholders', () => {
  beforeEach(() => {
    appCache.clear();
    vi.clearAllMocks();
  });

  it('X1: getProjectStakeholders performs NO autoAssign insert side-effects', async () => {
    const insertSpy = vi.fn();
    const selectStakeholdersSpy = vi.fn().mockResolvedValue({
      data: [{ id: 'ps-1', project_id: 'p-1', stakeholder_id: '00000000-0000-0000-0000-000000000001', raci_role: 'informed' }],
      error: null,
    });

    (mockSupabaseInstance.from as any) = vi.fn((table: string) => {
      if (table === 'project_stakeholders') {
        return {
          select: vi.fn().mockReturnValue({
            eq: selectStakeholdersSpy,
          }),
          insert: insertSpy,
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        insert: insertSpy,
      };
    });

    const list = await ProjectService.getProjectStakeholders('p-1');
    expect(list).toBeDefined();
    // Absolutely NO insert on project_stakeholders or stakeholders during read query!
    expect(insertSpy).not.toHaveBeenCalled();
  });
});

describe('Phase 1 — P1 & P4 & P5: Payload and Water Structures Integrity', () => {
  const REAL_UUID = '00000000-0000-0000-0000-000000000001';

  it('P4: calculates and preserves total water area and volume from multiple structures', () => {
    const payload = buildUpdatePayload({
      total_water_area_m2: 1250,
      total_water_volume_m3: 3500,
    });

    expect(payload.water_area_m2).toBe(1250);
    expect(payload.water_vol_m3).toBe(3500);
  });

  it('P5: project_manager_stakeholder_id sanitizes fake strings to null on update and create', () => {
    const updatePayload = buildUpdatePayload({
      project_manager_stakeholder_id: 'emp_001_fake',
    });
    expect(updatePayload.project_manager_stakeholder_id).toBeNull();

    const validUpdate = buildUpdatePayload({
      project_manager_stakeholder_id: REAL_UUID,
    });
    expect(validUpdate.project_manager_stakeholder_id).toBe(REAL_UUID);

    const createPayload = buildCreatePayload({
      project_manager_stakeholder_id: 'pm_stk_0_name',
    });
    expect(createPayload.project_manager_stakeholder_id).toBeNull();
  });
});

describe('Phase 1 — P19: Date Validation on Edit Form', () => {
  it('P19: rejects finish dates that precede start dates', () => {
    const result = validateProjectDates('2026-10-10', '2026-10-01');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('تاريخ الانتهاء');
  });

  it('P19: accepts valid project date range', () => {
    const result = validateProjectDates('2026-10-01', '2026-12-01');
    expect(result.isValid).toBe(true);
    expect(result.durationMonths).toBeGreaterThan(0);
  });
});
