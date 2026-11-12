import { describe, it, expect } from 'vitest';
import {
  calculateEVM,
  calculateActivityProgress,
  calculateProjectProgress,
  calculateProcurementQty,
  calculateWastageLossEgp,
  countWorkingDays,
  generateScurveData,
} from '@/lib/planning/calculations';

describe('Planning Calculations Engine', () => {
  describe('calculateEVM', () => {
    it('calculates EVM metrics accurately for on-track project', () => {
      const result = calculateEVM({
        earnedValueEgp: 500000,
        plannedValueEgp: 500000,
        actualCostEgp: 500000,
        budgetAtCompletionEgp: 1000000,
      });

      expect(result.bcwp).toBe(500000);
      expect(result.bcws).toBe(500000);
      expect(result.acwp).toBe(500000);
      expect(result.bac).toBe(1000000);
      expect(result.cv).toBe(0);
      expect(result.sv).toBe(0);
      expect(result.cpi).toBe(1.0);
      expect(result.spi).toBe(1.0);
      expect(result.eac).toBe(1000000);
      expect(result.etc).toBe(500000);
      expect(result.vac).toBe(0);
      expect(result.tcpi).toBe(1.0);
    });

    it('calculates EVM metrics for under-budget and ahead-of-schedule project', () => {
      const result = calculateEVM({
        earnedValueEgp: 600000,
        plannedValueEgp: 500000,
        actualCostEgp: 400000,
        budgetAtCompletionEgp: 1000000,
      });

      expect(result.cv).toBe(200000); // 600k - 400k
      expect(result.sv).toBe(100000); // 600k - 500k
      expect(result.cpi).toBe(1.5);   // 600k / 400k
      expect(result.spi).toBe(1.2);   // 600k / 500k
      expect(result.eac).toBe(666666.67); // 1M / 1.5
      expect(result.vac).toBe(333333.33); // 1M - 666.67k
    });

    it('calculates EVM metrics for over-budget and delayed project', () => {
      const result = calculateEVM({
        earnedValueEgp: 300000,
        plannedValueEgp: 500000,
        actualCostEgp: 400000,
        budgetAtCompletionEgp: 1000000,
      });

      expect(result.cv).toBe(-100000);
      expect(result.sv).toBe(-200000);
      expect(result.cpi).toBe(0.75); // 300k / 400k
      expect(result.spi).toBe(0.6);  // 300k / 500k
      expect(result.eac).toBe(1333333.33); // 1M / 0.75
    });

    it('handles zero actual cost safely without dividing by zero', () => {
      const result = calculateEVM({
        earnedValueEgp: 100000,
        plannedValueEgp: 200000,
        actualCostEgp: 0,
        budgetAtCompletionEgp: 1000000,
      });

      expect(result.cpi).toBe(1.0);
      expect(result.eac).toBe(1000000);
    });
  });

  describe('calculateActivityProgress', () => {
    it('computes earned value from valid approved allocations', () => {
      const allocations = [
        { allocated_qty: 10, snapshot_rate_egp: 500, line_status: 'approved', inspection_status: 'approved' },
        { allocated_qty: 20, snapshot_rate_egp: 500, line_status: 'approved', inspection_status: 'not_required' },
      ];

      const result = calculateActivityProgress(allocations, 25000);
      expect(result.earnedEgp).toBe(15000); // (10 * 500) + (20 * 500)
      expect(result.percentComplete).toBe(60); // 15000 / 25000 * 100
      expect(result.isOverAchieved).toBe(false);
    });

    it('ignores suspended allocations and rejected inspection lines', () => {
      const allocations = [
        { allocated_qty: 10, snapshot_rate_egp: 500, line_status: 'approved', inspection_status: 'approved' },
        { allocated_qty: 5, snapshot_rate_egp: 500, is_suspended: true, line_status: 'approved' },
        { allocated_qty: 8, snapshot_rate_egp: 500, line_status: 'approved', inspection_status: 'rejected' },
        { allocated_qty: 4, snapshot_rate_egp: 500, line_status: 'pending' },
      ];

      const result = calculateActivityProgress(allocations, 10000);
      expect(result.earnedEgp).toBe(5000); // only first line is valid (10 * 500)
      expect(result.percentComplete).toBe(50);
    });

    it('caps percentComplete at 100% while reporting isOverAchieved flag', () => {
      const allocations = [
        { allocated_qty: 30, snapshot_rate_egp: 500, line_status: 'approved' },
      ];

      const result = calculateActivityProgress(allocations, 10000); // Earned: 15,000 against budget 10,000
      expect(result.earnedEgp).toBe(15000);
      expect(result.percentComplete).toBe(100);
      expect(result.isOverAchieved).toBe(true);
      expect(result.rawRatio).toBe(150);
    });

    it('handles zero budget gracefully', () => {
      const allocations = [
        { allocated_qty: 10, snapshot_rate_egp: 100, line_status: 'approved' },
      ];
      const result = calculateActivityProgress(allocations, 0);
      expect(result.earnedEgp).toBe(1000);
      expect(result.percentComplete).toBe(0);
      expect(result.isOverAchieved).toBe(false);
    });
  });

  describe('calculateProjectProgress', () => {
    it('calculates weighted project completion percentage based on budgeted costs', () => {
      const activities = [
        { budgeted_cost_egp: 100000, percent_complete: 50 },  // 50,000 earned
        { budgeted_cost_egp: 300000, percent_complete: 100 }, // 300,000 earned
        { budgeted_cost_egp: 100000, percent_complete: 0 },   // 0 earned
      ];

      // Total Budget: 500,000, Total Earned: 350,000 => 70%
      const result = calculateProjectProgress(activities);
      expect(result).toBe(70);
    });

    it('returns 0 when total project budget is 0', () => {
      const activities = [
        { budgeted_cost_egp: 0, percent_complete: 100 },
      ];
      expect(calculateProjectProgress(activities)).toBe(0);
    });
  });

  describe('calculateProcurementQty', () => {
    it('calculates required procurement quantity with standard wastage', () => {
      // 1000 m3 concrete with 4% wastage = 1040 m3
      const result = calculateProcurementQty(1000, 1.0, 4.0);
      expect(result).toBe(1040);
    });

    it('calculates HDPE liner procurement with consumption rate and welding wastage', () => {
      // 5000 m2 pond liner with 1.05 consumption and 8% welding waste
      // 5000 * 1.05 * 1.08 = 5670
      const result = calculateProcurementQty(5000, 1.05, 8.0);
      expect(result).toBe(5670);
    });

    it('handles zero or negative contract quantity', () => {
      expect(calculateProcurementQty(0, 1.0, 5.0)).toBe(0);
      expect(calculateProcurementQty(-100, 1.0, 5.0)).toBe(0);
    });
  });

  describe('calculateWastageLossEgp', () => {
    it('calculates zero loss when actual wastage is within standard allowance', () => {
      // Issued: 105 m3, Installed: 100 m3 (5% actual waste), Standard: 5%
      const result = calculateWastageLossEgp(105, 100, 5.0, 2000);
      expect(result.actualWastagePct).toBe(5.0);
      expect(result.varianceWastagePct).toBe(0.0);
      expect(result.isLoss).toBe(false);
      expect(result.wastageLossEgp).toBe(0);
    });

    it('calculates financial loss in EGP when actual wastage exceeds standard allowance', () => {
      // Issued: 112 m3, Installed: 100 m3 (12% actual waste), Standard: 5%
      // Variance: +7% excess waste
      // Loss: 7% * 100 m3 * 2500 EGP/m3 = 17,500 EGP
      const result = calculateWastageLossEgp(112, 100, 5.0, 2500);
      expect(result.actualWastagePct).toBe(12.0);
      expect(result.varianceWastagePct).toBe(7.0);
      expect(result.isLoss).toBe(true);
      expect(result.wastageLossEgp).toBe(17500);
    });

    it('handles zero installed net quantity safely', () => {
      const result = calculateWastageLossEgp(10, 0, 5.0, 2500);
      expect(result.actualWastagePct).toBe(0);
      expect(result.isLoss).toBe(false);
      expect(result.wastageLossEgp).toBe(0);
    });
  });

  describe('countWorkingDays', () => {
    it('counts working days excluding Fridays', () => {
      // 2026-08-01 (Saturday) to 2026-08-07 (Friday) = 7 days total, 1 Friday => 6 working days
      const days = countWorkingDays('2026-08-01', '2026-08-07');
      expect(days).toBe(6);
    });

    it('handles invalid date ranges', () => {
      expect(countWorkingDays('2026-08-10', '2026-08-01')).toBe(0);
      expect(countWorkingDays('invalid', '2026-08-01')).toBe(0);
    });
  });

  describe('generateScurveData', () => {
    it('generates monotonic planned curve reaching 100% at project finish', () => {
      const activities = [
        { planned_start: '2026-08-01', planned_finish: '2026-08-10', budgeted_cost_egp: 100000 },
        { planned_start: '2026-08-05', planned_finish: '2026-08-15', budgeted_cost_egp: 100000 },
      ];
      const allocations = [
        { date: '2026-08-05', earned_egp: 50000 },
        { date: '2026-08-10', earned_egp: 50000 },
      ];

      const points = generateScurveData(activities, allocations, '2026-08-01', '2026-08-15');
      expect(points.length).toBe(15);

      // Verify monotonicity of planned value
      for (let i = 1; i < points.length; i++) {
        expect(points[i].planned_egp).toBeGreaterThanOrEqual(points[i - 1].planned_egp);
        expect(points[i].planned_pct).toBeGreaterThanOrEqual(points[i - 1].planned_pct);
      }

      // Verify boundary at end
      const lastPoint = points[points.length - 1];
      expect(lastPoint.planned_egp).toBe(200000);
      expect(lastPoint.planned_pct).toBe(100);
      expect(lastPoint.earned_egp).toBe(100000);
      expect(lastPoint.actual_pct).toBe(50);
    });
  });
});
