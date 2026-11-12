import { describe, it, expect } from 'vitest';
import {
  hasTocCertificate,
  getHandoverDate,
  computeProjectRetentionBondMetrics,
  aggregateRetentionBondPortfolio,
} from '../retention-bond-tracking.utils';
import { Project } from '@/types';

describe('Retention and Bond Tracking Utils', () => {
  const baseProject: Project = {
    id: 'proj-1',
    project_code: '2411',
    project_name: 'مشروع التجربة المائي',
    status: 'finished',
    contract_value: 10_000_000,
    vos_value: 2_000_000,
    estimated_budget: 10_000_000,
    estimated_cost: 8_000_000,
    water_area_m2: 500,
    water_vol_m3: 1000,
    completion_pct: 100,
    created_at: '2025-01-01',
    updated_at: '2025-01-01',
    actual_finish_date: '2025-06-01',
    toc_letter: 'TOC-2025-01',
    metadata: {
      has_performance_bond: true,
      performance_bond_pct: 5,
    },
  };

  describe('hasTocCertificate', () => {
    it('returns true when valid toc_letter is present', () => {
      expect(hasTocCertificate(baseProject)).toBe(true);
    });

    it('returns true when metadata handover_checklist has toc_received true', () => {
      const p: Project = {
        ...baseProject,
        toc_letter: undefined,
        metadata: {
          handover_checklist: { toc_received: true },
        },
      };
      expect(hasTocCertificate(p)).toBe(true);
    });

    it('returns false when toc_letter is missing, empty, or placeholder', () => {
      expect(hasTocCertificate({ ...baseProject, toc_letter: undefined })).toBe(false);
      expect(hasTocCertificate({ ...baseProject, toc_letter: '' })).toBe(false);
      expect(hasTocCertificate({ ...baseProject, toc_letter: 'غير موجود' })).toBe(false);
      expect(hasTocCertificate({ ...baseProject, toc_letter: 'غير متاح' })).toBe(false);
      expect(hasTocCertificate({ ...baseProject, toc_letter: 'None' })).toBe(false);
    });
  });

  describe('computeProjectRetentionBondMetrics', () => {
    const fixedNow = new Date('2025-08-01T00:00:00Z');

    it('computes financial amounts accurately (5% retention default on 12M = 600K)', () => {
      const metrics = computeProjectRetentionBondMetrics(baseProject, fixedNow);

      expect(metrics.totalContractValue).toBe(12_000_000);
      expect(metrics.retentionRatePct).toBe(5);
      expect(metrics.totalRetentionAmount).toBe(600_000);
      expect(metrics.tranche1Amount).toBe(300_000);
      expect(metrics.tranche2Amount).toBe(300_000);
      expect(metrics.performanceBondAmount).toBe(500_000); // 5% of 10M base
    });

    it('calculates contractual return days and identifies overdue status when past contractual days', () => {
      // Finished 2025-06-01, contractual days = 30. Due date = 2025-07-01.
      // Now is 2025-08-01. Past due date by 31 days!
      const metrics = computeProjectRetentionBondMetrics(baseProject, fixedNow);

      expect(metrics.retentionContractualDays).toBe(30);
      expect(metrics.retentionDueDateStr).toBe('2025-07-01');
      expect(metrics.isRetentionOverdue).toBe(true);
      expect(metrics.retentionOverdueDays).toBe(31);
      expect(metrics.isBondOverdue).toBe(true);
      expect(metrics.isMissedBondOrRetention).toBe(true);
    });

    it('marks as not overdue when already released', () => {
      const releasedProject: Project = {
        ...baseProject,
        metadata: {
          retention_tranche_1_released: true,
          performance_bond_released: true,
        },
      };

      const metrics = computeProjectRetentionBondMetrics(releasedProject, fixedNow);
      expect(metrics.tranche1Released).toBe(true);
      expect(metrics.isRetentionOverdue).toBe(false);
      expect(metrics.isBondOverdue).toBe(false);
      expect(metrics.isMissedBondOrRetention).toBe(false);
    });

    it('customizes contractual days from metadata when specified (e.g. 90 days)', () => {
      const customProject: Project = {
        ...baseProject,
        metadata: {
          retention_release_days: 90,
          performance_bond_release_days: 90,
        },
      };

      // Finished 2025-06-01 + 90 days = 2025-08-30. Now is 2025-08-01 -> within terms!
      const metrics = computeProjectRetentionBondMetrics(customProject, fixedNow);
      expect(metrics.retentionContractualDays).toBe(90);
      expect(metrics.isRetentionOverdue).toBe(false);
      expect(metrics.retentionRemainingDays).toBeGreaterThan(0);
    });

    it('respects has_performance_bond = false (no bond created or required)', () => {
      const noBondProject: Project = {
        ...baseProject,
        metadata: {
          has_performance_bond: false,
          performance_bond: {
            has_bond: false,
            calc_type: 'percentage_base',
          },
        },
      };

      const metrics = computeProjectRetentionBondMetrics(noBondProject, fixedNow);
      expect(metrics.hasPerformanceBond).toBe(false);
      expect(metrics.performanceBondAmount).toBe(0);
      expect(metrics.isBondOverdue).toBe(false);
    });

    it('computes manual fixed bond amount when calc_type is manual', () => {
      const manualBondProject: Project = {
        ...baseProject,
        metadata: {
          performance_bond: {
            has_bond: true,
            bond_number: 'LG-2025-9988',
            issuing_bank: 'البنك التجاري الدولي (CIB)',
            calc_type: 'manual',
            manual_value: 750_000,
            release_days: 45,
          },
        },
      };

      const metrics = computeProjectRetentionBondMetrics(manualBondProject, fixedNow);
      expect(metrics.hasPerformanceBond).toBe(true);
      expect(metrics.performanceBondCalcType).toBe('manual');
      expect(metrics.performanceBondAmount).toBe(750_000);
      expect(metrics.performanceBondNumber).toBe('LG-2025-9988');
      expect(metrics.performanceBondBank).toBe('البنك التجاري الدولي (CIB)');
      expect(metrics.bondContractualDays).toBe(45);
    });

    it('computes performance bond as percentage of total contract value including VOs when calc_type is percentage_total', () => {
      // 10M base + 2M VOs = 12M total. 5% of 12M = 600,000 EGP
      const totalVosBondProject: Project = {
        ...baseProject,
        metadata: {
          performance_bond: {
            has_bond: true,
            calc_type: 'percentage_total',
            percentage: 5,
          },
        },
      };

      const metrics = computeProjectRetentionBondMetrics(totalVosBondProject, fixedNow);
      expect(metrics.performanceBondCalcType).toBe('percentage_total');
      expect(metrics.performanceBondAmount).toBe(600_000); // 5% of 12M
    });

    it('respects customizable TOC release percentage (e.g. 100% or custom, not hardcoded 50%)', () => {
      const customReleaseProject: Project = {
        ...baseProject,
        metadata: {
          retention_terms: {
            type: 'cash_deduction',
            calc_base: 'base',
            rate_pct: 10, // 10% on 10M = 1,000,000 EGP
            toc_release_pct: 100, // 100% released on TOC
            release_days: 60,
          },
        },
      };

      const metrics = computeProjectRetentionBondMetrics(customReleaseProject, fixedNow);
      expect(metrics.retentionRatePct).toBe(10);
      expect(metrics.totalRetentionAmount).toBe(1_000_000);
      expect(metrics.tocReleasePct).toBe(100);
      expect(metrics.tranche1Amount).toBe(1_000_000); // 100% of 1M
      expect(metrics.tranche2Amount).toBe(0);
    });
  });

  describe('aggregateRetentionBondPortfolio', () => {
    it('accurately tallies finished without TOC, withheld amounts, and missed bonds', () => {
      const fixedNow = new Date('2025-08-01T00:00:00Z');
      const projects: Project[] = [
        // 1. Finished with TOC, overdue retention (12M, 600K ret)
        baseProject,
        // 2. Finished without TOC (5M, 250K ret)
        {
          ...baseProject,
          id: 'proj-2',
          project_code: '2412',
          toc_letter: undefined,
          contract_value: 5_000_000,
          vos_value: 0,
        },
        // 3. Handing over without TOC (8M, 400K ret)
        {
          ...baseProject,
          id: 'proj-3',
          project_code: '2413',
          status: 'handing_over',
          toc_letter: '',
          contract_value: 8_000_000,
          vos_value: 0,
        },
        // 4. Working site (should be ignored in finished/handover totals)
        {
          ...baseProject,
          id: 'proj-4',
          project_code: '2414',
          status: 'working',
        },
      ];

      const agg = aggregateRetentionBondPortfolio(projects, fixedNow);

      expect(agg.totalFinishedProjects).toBe(2);
      expect(agg.totalHandingOverProjects).toBe(1);
      expect(agg.finishedWithoutTocCount).toBe(1); // proj-2
      expect(agg.finishedWithTocCount).toBe(1); // proj-1
      expect(agg.handingOverWithoutTocCount).toBe(1); // proj-3
      expect(agg.totalWithheldRetention).toBe(600_000 + 250_000 + 400_000); // 1,250,000 EGP
      expect(agg.missedRetentionCount).toBeGreaterThanOrEqual(1);
    });
  });
});
