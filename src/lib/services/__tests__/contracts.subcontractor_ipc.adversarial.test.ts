import { describe, it, expect } from 'vitest';
import {
  calculateContractualIpc,
  IpcDeductionParams,
} from '@/lib/planning/calculations';

/**
 * Adversarial Unit & Contractual Logic Tests for Subcontractor IPC Calculations
 *
 * Exercises the canonical `calculateContractualIpc` production engine in
 * `src/lib/planning/calculations.ts`:
 * 1. Contractual retention percentage deduction and FIDIC Cl. 14.3 / 14.9 retention cap.
 * 2. Advance payment recovery (amortization) capped at unrecovered advance balance.
 * 3. Multi-IPC cumulative amortization & retention cap convergence without over-deduction.
 * 4. Net payable flooring at 0 EGP unless debit-note mode (`clampNegativeNet: false`) is explicit.
 * 5. Zero, negative, out-of-bounds percentage, and multi-billion EGP precision boundaries.
 */
describe('Subcontractor IPC Adversarial & Boundary Calculation Suite', () => {
  describe('1. Advance Recovery Amortization & Balance Capping', () => {
    it('IPC-01: amortizes advance payment up to remaining advance balance', () => {
      const params: IpcDeductionParams = {
        grossAmount: 100000,
        retentionPct: 10,
        advanceRecoveryPct: 15,
        totalAdvancePaid: 50000,
        cumulativeAdvanceRecoveredBefore: 0,
        contractValue: 500000,
        cumulativeRetentionWithheldBefore: 0,
      };

      const result = calculateContractualIpc(params);

      expect(result.advanceRecoveryDeduction).toBe(15000);
      expect(result.cumulativeAdvanceRecoveredAfter).toBe(15000);
      expect(result.remainingAdvanceToRecover).toBe(35000);
      expect(result.isAdvanceFullyRecovered).toBe(false);
      expect(result.netPayable).toBe(75000);
    });

    it('IPC-02: caps advance deduction when remaining unrecovered balance is less than percentage slice', () => {
      const result = calculateContractualIpc({
        grossAmount: 200000,
        retentionPct: 10,
        advanceRecoveryPct: 10,
        totalAdvancePaid: 50000,
        cumulativeAdvanceRecoveredBefore: 45000,
        contractValue: 1000000,
        cumulativeRetentionWithheldBefore: 0,
      });

      expect(result.advanceRecoveryDeduction).toBe(5000);
      expect(result.cumulativeAdvanceRecoveredAfter).toBe(50000);
      expect(result.remainingAdvanceToRecover).toBe(0);
      expect(result.isAdvanceFullyRecovered).toBe(true);
      expect(result.netPayable).toBe(175000);
    });

    it('IPC-03: deducts 0 advance recovery once advance balance is 100% amortized', () => {
      const result = calculateContractualIpc({
        grossAmount: 150000,
        retentionPct: 10,
        advanceRecoveryPct: 10,
        totalAdvancePaid: 50000,
        cumulativeAdvanceRecoveredBefore: 50000,
        contractValue: 1000000,
        cumulativeRetentionWithheldBefore: 0,
      });

      expect(result.advanceRecoveryDeduction).toBe(0);
      expect(result.isAdvanceFullyRecovered).toBe(true);
      expect(result.netPayable).toBe(135000);
    });

    it('IPC-04: deducts 0 advance recovery when no advance was disbursed (totalAdvancePaid = 0)', () => {
      const result = calculateContractualIpc({
        grossAmount: 100000,
        retentionPct: 10,
        advanceRecoveryPct: 10,
        totalAdvancePaid: 0,
        cumulativeAdvanceRecoveredBefore: 0,
        contractValue: 1000000,
        cumulativeRetentionWithheldBefore: 0,
      });

      expect(result.advanceRecoveryDeduction).toBe(0);
      expect(result.remainingAdvanceToRecover).toBe(0);
      expect(result.isAdvanceFullyRecovered).toBe(false);
    });
  });

  describe('2. Contractual Retention Percentage & Cap Enforcement', () => {
    it('IPC-05: applies contractual 5% retention rate rather than a hardcoded 10%', () => {
      const result = calculateContractualIpc({
        grossAmount: 100000,
        retentionPct: 5,
        advanceRecoveryPct: 0,
        totalAdvancePaid: 0,
        cumulativeAdvanceRecoveredBefore: 0,
        contractValue: 1000000,
        retentionCapPct: 5,
        cumulativeRetentionWithheldBefore: 0,
      });

      expect(result.retentionDeduction).toBe(5000);
      expect(result.isRetentionCapped).toBe(false);
      expect(result.netPayable).toBe(95000);
    });

    it('IPC-06: caps retention deduction at remaining contractual retention capacity', () => {
      const result = calculateContractualIpc({
        grossAmount: 100000,
        retentionPct: 5,
        advanceRecoveryPct: 0,
        totalAdvancePaid: 0,
        cumulativeAdvanceRecoveredBefore: 0,
        contractValue: 1000000,
        retentionCapPct: 5,
        cumulativeRetentionWithheldBefore: 46000,
      });

      expect(result.retentionDeduction).toBe(4000);
      expect(result.cumulativeRetentionWithheldAfter).toBe(50000);
      expect(result.isRetentionCapped).toBe(true);
      expect(result.netPayable).toBe(96000);
    });

    it('IPC-07: deducts 0 retention once cumulative retention cap is satisfied', () => {
      const result = calculateContractualIpc({
        grossAmount: 80000,
        retentionPct: 10,
        advanceRecoveryPct: 0,
        totalAdvancePaid: 0,
        cumulativeAdvanceRecoveredBefore: 0,
        contractValue: 500000,
        retentionCapPct: 10,
        cumulativeRetentionWithheldBefore: 50000,
      });

      expect(result.retentionDeduction).toBe(0);
      expect(result.isRetentionCapped).toBe(true);
      expect(result.netPayable).toBe(80000);
    });
  });

  describe('3. Non-Negative Net Payable Floor Clamping', () => {
    it('IPC-08: clamps net payable at 0 EGP by default when backcharges/deductions exceed gross', () => {
      const result = calculateContractualIpc({
        grossAmount: 20000,
        retentionPct: 10,
        advanceRecoveryPct: 20,
        totalAdvancePaid: 50000,
        cumulativeAdvanceRecoveredBefore: 0,
        contractValue: 200000,
        cumulativeRetentionWithheldBefore: 0,
        otherDeductions: 30000,
        clampNegativeNet: true,
      });

      expect(result.totalDeductions).toBe(36000);
      expect(result.netPayable).toBe(0);
    });

    it('IPC-09: preserves negative net payable when clampNegativeNet is explicitly false for debit notes', () => {
      const result = calculateContractualIpc({
        grossAmount: 20000,
        retentionPct: 10,
        advanceRecoveryPct: 20,
        totalAdvancePaid: 50000,
        cumulativeAdvanceRecoveredBefore: 0,
        contractValue: 200000,
        cumulativeRetentionWithheldBefore: 0,
        otherDeductions: 30000,
        clampNegativeNet: false,
      });

      expect(result.netPayable).toBe(-16000);
    });
  });

  describe('4. Adversarial Inputs, Multi-IPC Convergence & Extreme Precision Boundaries', () => {
    it('IPC-10: returns zeroed deductions and 0 net payable when grossAmount is 0', () => {
      const result = calculateContractualIpc({
        grossAmount: 0,
        retentionPct: 10,
        advanceRecoveryPct: 10,
        totalAdvancePaid: 50000,
        cumulativeAdvanceRecoveredBefore: 0,
        contractValue: 500000,
        cumulativeRetentionWithheldBefore: 0,
      });

      expect(result.grossAmount).toBe(0);
      expect(result.retentionDeduction).toBe(0);
      expect(result.advanceRecoveryDeduction).toBe(0);
      expect(result.totalDeductions).toBe(0);
      expect(result.netPayable).toBe(0);
    });

    it('IPC-11: sanitizes negative grossAmount to 0 without emitting negative payable', () => {
      const result = calculateContractualIpc({
        grossAmount: -50000,
        retentionPct: 10,
        advanceRecoveryPct: 10,
        totalAdvancePaid: 20000,
        cumulativeAdvanceRecoveredBefore: 0,
        contractValue: 500000,
        cumulativeRetentionWithheldBefore: 0,
      });

      expect(result.grossAmount).toBe(0);
      expect(result.netPayable).toBe(0);
    });

    it('IPC-12: maintains 2-decimal precision stability on multi-billion EGP valuations', () => {
      const result = calculateContractualIpc({
        grossAmount: 1250000000.75,
        retentionPct: 5,
        advanceRecoveryPct: 10,
        totalAdvancePaid: 200000000,
        cumulativeAdvanceRecoveredBefore: 50000000,
        contractValue: 5000000000,
        retentionCapPct: 5,
        cumulativeRetentionWithheldBefore: 0,
      });

      expect(result.retentionDeduction).toBe(62500000.04);
      expect(result.advanceRecoveryDeduction).toBe(125000000.08);
      expect(result.netPayable).toBe(1062500000.63);
      expect(Number.isFinite(result.netPayable)).toBe(true);
    });

    it('IPC-13: prevents infinite advance over-amortization and retention over-withholding across 6 sequential IPCs', () => {
      let cumAdv = 0;
      let cumRet = 0;
      const advSlices: number[] = [];
      const retSlices: number[] = [];

      for (let ipcNo = 1; ipcNo <= 6; ipcNo++) {
        const res = calculateContractualIpc({
          grossAmount: 100000,
          retentionPct: 10,
          advanceRecoveryPct: 10,
          totalAdvancePaid: 25000,
          cumulativeAdvanceRecoveredBefore: cumAdv,
          contractValue: 500000,
          retentionCapPct: 5, // 25,000 EGP cap
          cumulativeRetentionWithheldBefore: cumRet,
        });
        advSlices.push(res.advanceRecoveryDeduction);
        retSlices.push(res.retentionDeduction);
        cumAdv = res.cumulativeAdvanceRecoveredAfter;
        cumRet = res.cumulativeRetentionWithheldAfter;
      }

      expect(advSlices).toEqual([10000, 10000, 5000, 0, 0, 0]);
      expect(retSlices).toEqual([10000, 10000, 5000, 0, 0, 0]);
      expect(cumAdv).toBe(25000);
      expect(cumRet).toBe(25000);
    });

    it('IPC-14: clamps negative percentages/otherDeductions and percentages above 100 safely', () => {
      const result = calculateContractualIpc({
        grossAmount: 50000,
        retentionPct: -20,
        advanceRecoveryPct: 250,
        totalAdvancePaid: 10000,
        cumulativeAdvanceRecoveredBefore: 0,
        contractValue: 500000,
        retentionCapPct: 150,
        cumulativeRetentionWithheldBefore: -100,
        otherDeductions: -5000,
      });

      expect(result.retentionDeduction).toBe(0);
      expect(result.advanceRecoveryDeduction).toBe(10000);
      expect(result.otherDeductions).toBe(0);
      expect(result.netPayable).toBe(40000);
    });
  });
});
