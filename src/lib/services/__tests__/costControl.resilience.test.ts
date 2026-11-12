import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { appCache } from '@/lib/cache';
import { CostControlService } from '../costControl.service';
import type { MockBuilderShape, MockQueryBuilder } from '@/types/services-types';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

const createMockBuilder = (resolveValue: unknown) => {
  const builder: MockBuilderShape = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(() => Promise.resolve(resolveValue)),
    maybeSingle: vi.fn().mockImplementation(() => Promise.resolve(resolveValue)),
    then: vi.fn().mockImplementation((onfulfilled) => {
      onfulfilled(resolveValue);
      return Promise.resolve(resolveValue);
    }),
  };
  return builder as MockQueryBuilder;
};

describe('CostControlService Schema Cache Resilience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appCache.clear();
  });

  it('handles missing pm_cost_snapshots table (schema cache error) gracefully by falling back to live EVM', async () => {
    const missingTableError = {
      code: 'PGRST205',
      message: "Could not find the table 'public.pm_cost_snapshots' in the schema cache",
    };

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'pm_cost_snapshots') {
        return createMockBuilder({
          data: null,
          error: missingTableError,
        });
      }
      if (table === 'pm_budget_lines') {
        return createMockBuilder({
          data: [
            { id: 'b-1', current_budget: 1000000, actual_cost: 400000 },
          ],
          error: null,
        });
      }
      if (table === 'pm_projects') {
        return createMockBuilder({
          data: {
            id: 'proj-123',
            contract_value: 1000000,
            completion_pct: 40,
          },
          error: null,
        });
      }
      if (table === 'pm_project_activities') {
        return createMockBuilder({
          data: [],
          error: null,
        });
      }
      return createMockBuilder({ data: null, error: null });
    });

    // Should NOT throw
    const snapshots = await CostControlService.getCostSnapshots('proj-123');
    expect(snapshots).toBeDefined();
    expect(snapshots.length).toBeGreaterThan(0);
    expect(snapshots[0].budget_at_completion).toBe(1000000);
    expect(snapshots[0].actual_cost).toBe(400000);

    const latest = await CostControlService.getLatestSnapshot('proj-123');
    expect(latest).toBeDefined();
    expect(latest?.budget_at_completion).toBe(1000000);
  });

  it('handles missing pm_budget_lines table gracefully by falling back to project packages', async () => {
    const missingTableError = {
      code: 'PGRST205',
      message: "Could not find the table 'public.pm_budget_lines' in the schema cache",
    };

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'pm_budget_lines') {
        return createMockBuilder({
          data: null,
          error: missingTableError,
        });
      }
      if (table === 'pm_project_activities') {
        return createMockBuilder({
          data: [],
          error: null,
        });
      }
      if (table === 'boq_items') {
        return createMockBuilder({
          data: [],
          error: null,
        });
      }
      if (table === 'pm_projects') {
        return createMockBuilder({
          data: {
            id: 'proj-123',
            contract_value: 5000000,
            completion_pct: 20,
          },
          error: null,
        });
      }
      return createMockBuilder({ data: null, error: null });
    });

    const lines = await CostControlService.getBudgetLines('proj-123');
    expect(lines).toBeDefined();
    expect(lines.length).toBe(3); // Civil, MEP, Finishes
    expect(lines[0].cost_code_id).toBe('01-CIVIL');
  });
});
