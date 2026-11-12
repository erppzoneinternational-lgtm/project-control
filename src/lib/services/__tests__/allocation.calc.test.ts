import type { MockBuilderShape, MockQueryBuilder } from '@/types/services-types';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateEVM,
  calculateActivityProgress,
  calculateProjectProgress,
} from '@/lib/planning/calculations';
import { validateAllocationQty, validateCrossProjectAllocation } from '@/lib/planning/validators';
import { AllocationService } from '@/lib/services/allocation.service';
import { supabase } from '@/lib/supabase';
import { appCache } from '@/lib/cache';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

const createMockQueryBuilder = (resolveValue: unknown) => {
  const builder: MockBuilderShape = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(() => Promise.resolve(resolveValue)),
    then: vi.fn().mockImplementation((onfulfilled) => {
      onfulfilled(resolveValue);
      return Promise.resolve(resolveValue);
    }),
  };
  return builder as MockQueryBuilder;
};

describe('EVM & Allocation Invariants Suite (allocation.calc.test.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appCache.clear();
  });

  describe('1. §5 Canonical Numerical Invariant & EVM Formulas', () => {
    it('verifies §5 canonical contract scenario: 100 m³ @ 1,500 EGP, 20 m³ allocated => 30,000 EGP BCWP (20% progress)', () => {
      // 100 m³ concrete @ 1,500 EGP = 150,000 EGP Budget
      const contractQty = 100;
      const rateEgp = 1500;
      const budgetedCostEgp = contractQty * rateEgp; // 150,000 EGP

      // 20 m³ allocated to activity A-100
      const allocations = [
        {
          allocated_qty: 20,
          snapshot_rate_egp: 1500,
          line_status: 'approved',
          inspection_status: 'approved',
        },
      ];

      const progress = calculateActivityProgress(allocations, budgetedCostEgp);
      expect(progress.earnedEgp).toBe(30000); // 20 * 1,500 = 30,000 EGP BCWP
      expect(progress.percentComplete).toBe(20.0); // 30,000 / 150,000 * 100 = 20.0%
      expect(progress.isOverAchieved).toBe(false);
      expect(progress.rawRatio).toBe(20.0);
    });

    it('verifies Planned Value BCWS = 50,000 EGP => SPI = 0.60 (Delayed Critical Alert)', () => {
      const earnedValue = 30000;
      const plannedValue = 50000;
      const budgetAtCompletion = 150000;

      const evm = calculateEVM({
        earnedValueEgp: earnedValue,
        plannedValueEgp: plannedValue,
        actualCostEgp: 30000,
        budgetAtCompletionEgp: budgetAtCompletion,
      });

      // SPI = BCWP / BCWS = 30,000 / 50,000 = 0.60
      expect(evm.spi).toBe(0.6);
      expect(evm.sv).toBe(-20000); // Schedule Variance: 30,000 - 50,000 = -20,000 EGP
    });

    it('verifies Actual Cost ACWP = 35,000 EGP => CPI = 0.8571 and Cost Variance CV = -5,000 EGP', () => {
      const earnedValue = 30000;
      const plannedValue = 50000;
      const actualCost = 35000;
      const budgetAtCompletion = 150000;

      const evm = calculateEVM({
        earnedValueEgp: earnedValue,
        plannedValueEgp: plannedValue,
        actualCostEgp: actualCost,
        budgetAtCompletionEgp: budgetAtCompletion,
      });

      // CPI = BCWP / ACWP = 30,000 / 35,000 = 0.8571428... => 0.8571
      expect(evm.cpi).toBe(0.8571);
      expect(evm.cv).toBe(-5000); // Cost Variance: 30,000 - 35,000 = -5,000 EGP
      expect(evm.vac).toBe(budgetAtCompletion - evm.eac);
    });

    it('verifies the 3 standard Estimate At Completion (EAC) forecasting methods', () => {
      const bac = 150000;
      const bcwp = 30000;
      const bcws = 50000;
      const acwp = 35000;

      const cpi = bcwp / acwp; // 30,000 / 35,000 = 0.857142857
      const spi = bcwp / bcws; // 30,000 / 50,000 = 0.60

      // Method 1: Future work at planned budget rate: EAC_1 = ACWP + (BAC - BCWP)
      const eacBudgetRate = acwp + (bac - bcwp);
      expect(eacBudgetRate).toBe(155000); // 35,000 + 120,000 = 155,000 EGP

      // Method 2: Future work at current cost performance index (CPI): EAC_2 = BAC / CPI = ACWP + (BAC - BCWP)/CPI
      const eacCurrentCpi = bac / cpi;
      expect(Number(eacCurrentCpi.toFixed(2))).toBe(175000.0); // 150,000 / (30/35) = 175,000 EGP

      // Method 3: Future work influenced by composite CPI * SPI factor: EAC_3 = ACWP + (BAC - BCWP) / (CPI * SPI)
      const compositeFactor = cpi * spi; // 0.857142857 * 0.60 = 0.514285714
      const eacComposite = acwp + (bac - bcwp) / compositeFactor;
      expect(Number(eacComposite.toFixed(2))).toBe(268333.33); // 35,000 + (120,000 / 0.514285714) = 268,333.33 EGP

      // Verify calculateEVM implements Method 2 (standard EAC = BAC / CPI)
      const evm = calculateEVM({
        earnedValueEgp: bcwp,
        plannedValueEgp: bcws,
        actualCostEgp: acwp,
        budgetAtCompletionEgp: bac,
      });
      expect(evm.eac).toBe(175000);
    });

    it('verifies multi-activity weighted project completion and project-level SPI', () => {
      // Activity A-100: Budget 150,000 EGP, 20% progress => 30,000 EGP earned
      // Activity A-200: Budget 50,000 EGP, 0% progress => 0 EGP earned
      // Total Budget = 200,000 EGP
      const activities = [
        { budgeted_cost_egp: 150000, percent_complete: 20 },
        { budgeted_cost_egp: 50000, percent_complete: 0 },
      ];

      const projectProgress = calculateProjectProgress(activities);
      // Weighted Progress = (150,000 * 0.20 + 50,000 * 0.0) / 200,000 * 100 = 30,000 / 200,000 * 100 = 15.0%
      expect(projectProgress).toBe(15.0);

      // If planned project progress is 25% (BCWS = 50,000 against 200,000 BAC)
      const plannedProgressPct = 25.0;
      const projectSpi = projectProgress / plannedProgressPct; // 15.0 / 25.0 = 0.60
      expect(projectSpi).toBe(0.6);
    });
  });

  describe('2. Allocation Sum Limit Guard & Over-Allocation Prevention', () => {
    it('approves allocations when sum(allocated_qty) <= qty_today', () => {
      const allocations = [
        { allocated_qty: 30 },
        { allocated_qty: 45 },
        { allocated_qty: 25 },
      ];
      const qtyToday = 100;

      const result = validateAllocationQty(allocations, qtyToday);
      expect(result.valid).toBe(true);
      expect(result.totalAllocated).toBe(100);
      expect(result.remainingQty).toBe(0);
    });

    it('rejects allocation when sum(allocated_qty) > qty_today', () => {
      const allocations = [
        { allocated_qty: 60 },
        { allocated_qty: 45 },
      ];
      const qtyToday = 100;

      const result = validateAllocationQty(allocations, qtyToday);
      expect(result.valid).toBe(false);
      expect(result.totalAllocated).toBe(105);
      expect(result.error).toContain('exceeds measured daily quantity');
    });

    it('AllocationService.allocateDailyQty enforces sum guard in database workflow', async () => {
      const mockLine = {
        id: 'line-001',
        qty_today: 50,
        snapshot_rate_egp: 1200,
        boq_item: { rate_egp: 1200, revision: 1 },
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_daily_progress_lines') {
          return createMockQueryBuilder({ data: mockLine, error: null });
        }
        if (table === 'pm_progress_allocations') {
          return createMockQueryBuilder({
            data: [{ id: 'alloc-1', activity_id: 'act-1', allocated_qty: 35 }],
            error: null,
          });
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      // Existing 35 allocated. Attempting to allocate 20 more => 35 + 20 = 55 > 50 qty_today
      await expect(
        AllocationService.allocateDailyQty({
          line_id: 'line-001',
          activity_id: 'act-2',
          allocated_qty: 20,
          project_id: 'proj-001',
        })
      ).rejects.toThrow(/exceeds measured daily quantity/);
    });

    it('rejects cross-project allocation boundary violation', () => {
      expect(validateCrossProjectAllocation('proj-A', 'proj-A')).toBe(true);
      expect(validateCrossProjectAllocation('proj-A', 'proj-B')).toBe(false);
      expect(validateCrossProjectAllocation('', 'proj-A')).toBe(false);
    });
  });

  describe('3. 100% Completion Cap & Overachievement Invariant', () => {
    it('caps percentComplete at 100% while setting isOverAchieved and reporting true rawRatio', () => {
      // Budgeted cost: 100,000 EGP (100 m³ @ 1,000 EGP)
      // Allocated: 130 m³ @ 1,000 EGP = 130,000 EGP earned
      const allocations = [
        {
          allocated_qty: 130,
          snapshot_rate_egp: 1000,
          line_status: 'approved',
        },
      ];

      const progress = calculateActivityProgress(allocations, 100000);
      expect(progress.earnedEgp).toBe(130000);
      expect(progress.percentComplete).toBe(100); // capped at 100%
      expect(progress.isOverAchieved).toBe(true);
      expect(progress.rawRatio).toBe(130); // true performance 130%
    });

    it('correctly tracks exactly 100% completion boundary without false overachievement flag', () => {
      const allocations = [
        {
          allocated_qty: 100,
          snapshot_rate_egp: 1000,
          line_status: 'approved',
        },
      ];

      const progress = calculateActivityProgress(allocations, 100000);
      expect(progress.earnedEgp).toBe(100000);
      expect(progress.percentComplete).toBe(100);
      expect(progress.isOverAchieved).toBe(false);
      expect(progress.rawRatio).toBe(100);
    });
  });

  describe('4. Zero Budget Division Safety Guards', () => {
    it('handles zero budget in calculateActivityProgress without division by zero', () => {
      const allocations = [
        { allocated_qty: 50, snapshot_rate_egp: 500, line_status: 'approved' },
      ];

      const progress = calculateActivityProgress(allocations, 0);
      expect(progress.earnedEgp).toBe(25000);
      expect(progress.percentComplete).toBe(0);
      expect(progress.isOverAchieved).toBe(false);
      expect(progress.rawRatio).toBe(0);
      expect(Number.isNaN(progress.percentComplete)).toBe(false);
      expect(Number.isFinite(progress.percentComplete)).toBe(true);
    });

    it('handles zero total budget in calculateProjectProgress safely', () => {
      const activities = [
        { budgeted_cost_egp: 0, percent_complete: 100 },
        { budgeted_cost_egp: 0, percent_complete: 50 },
      ];

      const result = calculateProjectProgress(activities);
      expect(result).toBe(0);
      expect(Number.isNaN(result)).toBe(false);
    });

    it('handles zero actual costs, zero planned value, and zero BAC in calculateEVM safely', () => {
      const evm = calculateEVM({
        earnedValueEgp: 0,
        plannedValueEgp: 0,
        actualCostEgp: 0,
        budgetAtCompletionEgp: 0,
      });

      expect(evm.cpi).toBe(1.0);
      expect(evm.spi).toBe(1.0);
      expect(evm.eac).toBe(0);
      expect(evm.tcpi).toBe(1.0);
      expect(Number.isNaN(evm.cpi)).toBe(false);
      expect(Number.isNaN(evm.spi)).toBe(false);
    });
  });

  describe('5. Rollback & Invariant Reversal', () => {
    it('restores exact pre-allocation progress upon deleting or suspending an allocation', () => {
      const baseAllocations = [
        { allocated_qty: 10, snapshot_rate_egp: 1000, line_status: 'approved' }, // 10,000 earned
      ];
      const initialProgress = calculateActivityProgress(baseAllocations, 100000);
      expect(initialProgress.earnedEgp).toBe(10000);
      expect(initialProgress.percentComplete).toBe(10);

      // Add temporary allocation of 15 units
      const withTemp = [
        ...baseAllocations,
        { allocated_qty: 15, snapshot_rate_egp: 1000, line_status: 'approved' }, // +15,000 = 25,000
      ];
      const expandedProgress = calculateActivityProgress(withTemp, 100000);
      expect(expandedProgress.earnedEgp).toBe(25000);
      expect(expandedProgress.percentComplete).toBe(25);

      // Suspend temporary allocation -> should revert to 10,000 / 10%
      const withSuspended = [
        ...baseAllocations,
        { allocated_qty: 15, snapshot_rate_egp: 1000, line_status: 'approved', is_suspended: true },
      ];
      const revertedProgress = calculateActivityProgress(withSuspended, 100000);
      expect(revertedProgress.earnedEgp).toBe(initialProgress.earnedEgp);
      expect(revertedProgress.percentComplete).toBe(initialProgress.percentComplete);
    });
  });
});
