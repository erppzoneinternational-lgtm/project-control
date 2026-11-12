import { describe, it, expect } from 'vitest';
import {
  calculateEVM,
  countWorkingDays,
  calculateWastageLossEgp,
  EvmCalculationParams,
} from '@/lib/planning/calculations';

/**
 * EVM Calculation Engine, 6-Day Egyptian Calendar & Closeout Wastage Edge-Case Suite
 *
 * Grounded in `src/lib/planning/calculations.ts`:
 * 1. Zero-division boundary guards on CPI (ACWP === 0) and SPI (BCWS === 0).
 * 2. PMI-compliant EAC when CPI === 0 and ACWP > 0 (`EAC = ACWP + (BAC - BCWP)`),
 *    preventing zero-progress cost overruns from being masked (Regressions EVM-05 & EVM-06).
 * 3. Finite TCPI guard when remaining budget <= 0 (`ACWP >= BAC`).
 * 4. 6-day Egyptian construction site calendar skipping Fridays (Regression CALC-01:
 *    single-Friday range returns 0 working days, not 1).
 * 5. Active WIP vs closeout write-off wastage valuation (`treatZeroInstalledAsWriteOff`).
 */
describe('EVM Calculations, 6-Day Calendar & Closeout Wastage Edge-Case Suite', () => {
  describe('1. Zero-Division & Initialization Boundary Guards', () => {
    it('EVM-01: defaults CPI to 1.0 when both ACWP and BCWP are zero (unstarted activity)', () => {
      const params: EvmCalculationParams = {
        budgetAtCompletionEgp: 500000,
        plannedValueEgp: 100000,
        actualCostEgp: 0,
        earnedValueEgp: 0,
      };

      const metrics = calculateEVM(params);

      expect(metrics.cpi).toBe(1.0);
      expect(metrics.acwp).toBe(0);
      expect(metrics.cv).toBe(0);
      expect(metrics.eac).toBe(500000);
      expect(Number.isFinite(metrics.cpi)).toBe(true);
    });

    it('EVM-02: defaults CPI to 1.0 when work is earned (BCWP > 0) before subcontractor invoice is booked', () => {
      const metrics = calculateEVM({
        budgetAtCompletionEgp: 500000,
        plannedValueEgp: 200000,
        actualCostEgp: 0,
        earnedValueEgp: 150000,
      });

      expect(metrics.cpi).toBe(1.0);
      expect(metrics.cv).toBe(150000);
    });

    it('EVM-03: defaults SPI to 1.0 when planned value (BCWS) is zero during early start', () => {
      const metrics = calculateEVM({
        budgetAtCompletionEgp: 400000,
        plannedValueEgp: 0,
        actualCostEgp: 20000,
        earnedValueEgp: 20000,
      });

      expect(metrics.spi).toBe(1.0);
      expect(metrics.sv).toBe(20000);
      expect(Number.isFinite(metrics.spi)).toBe(true);
    });

    it('EVM-04: returns finite zeroed metrics for all-zero project initialization', () => {
      const metrics = calculateEVM({
        budgetAtCompletionEgp: 0,
        plannedValueEgp: 0,
        actualCostEgp: 0,
        earnedValueEgp: 0,
      });

      expect(metrics.cpi).toBe(1.0);
      expect(metrics.spi).toBe(1.0);
      expect(metrics.eac).toBe(0);
      expect(metrics.etc).toBe(0);
      expect(metrics.vac).toBe(0);
      expect(metrics.tcpi).toBe(1.0);
    });
  });

  describe('2. PMI Standard EAC Under Zero Earned Progress (Regressions EVM-05 & EVM-06)', () => {
    it('EVM-05: surfaces mobilization cost overrun in EAC and VAC when EV === 0 and AC > 0', () => {
      const metrics = calculateEVM({
        budgetAtCompletionEgp: 2000000,
        plannedValueEgp: 300000,
        actualCostEgp: 500000,
        earnedValueEgp: 0,
      });

      expect(metrics.cpi).toBe(0);
      expect(metrics.cv).toBe(-500000);
      // PMI Standard: EAC = ACWP + (BAC - BCWP) = 500,000 + 2,000,000 = 2,500,000 EGP
      expect(metrics.eac).toBe(2500000);
      expect(metrics.vac).toBe(-500000);
      expect(metrics.etc).toBe(2000000);
    });

    it('EVM-06: ensures EAC strictly exceeds ACWP when actual spend already exceeds BAC at zero progress', () => {
      const metrics = calculateEVM({
        budgetAtCompletionEgp: 2000000,
        plannedValueEgp: 500000,
        actualCostEgp: 2500000,
        earnedValueEgp: 0,
      });

      expect(metrics.cpi).toBe(0);
      expect(metrics.eac).toBe(4500000);
      expect(metrics.eac).toBeGreaterThan(metrics.acwp);
      expect(metrics.vac).toBe(-2500000);
      expect(metrics.etc).toBe(2000000);
    });
  });

  describe('3. TCPI Guard Under Exhausted or Overspent Budget', () => {
    it.each([
      ['EVM-07: exact budget exhaustion (AC === BAC)', 1000000, 600000],
      ['EVM-08: budget overspent (AC > BAC)', 1200000, 500000],
    ])('%s produces finite non-negative TCPI without division-by-zero', (_label, acwp, bcwp) => {
      const metrics = calculateEVM({
        budgetAtCompletionEgp: 1000000,
        plannedValueEgp: 1000000,
        actualCostEgp: acwp,
        earnedValueEgp: bcwp,
      });

      expect(Number.isFinite(metrics.tcpi)).toBe(true);
      expect(metrics.tcpi).toBeGreaterThanOrEqual(0);
    });
  });

  describe('4. 6-Day Egyptian Site Calendar & Friday Rest Day (Regression CALC-01)', () => {
    it('CALC-01: returns 0 working days for a single Friday (2026-10-23)', () => {
      expect(countWorkingDays('2026-10-23', '2026-10-23')).toBe(0);
    });

    it('CALC-02: counts 6 working days across a full 7-day Sat–Fri week (2026-10-17 to 2026-10-23)', () => {
      expect(countWorkingDays('2026-10-17', '2026-10-23')).toBe(6);
    });

    it('CALC-03: counts 5 working days for Sun–Thu site stretch (2026-10-18 to 2026-10-22)', () => {
      expect(countWorkingDays('2026-10-18', '2026-10-22')).toBe(5);
    });

    it('CALC-04: returns 0 working days when start date is strictly after end date', () => {
      expect(countWorkingDays('2026-10-25', '2026-10-20')).toBe(0);
    });

    it.each([
      ['not-a-date', '2026-10-23'],
      ['2026-10-23', ''],
      ['', ''],
    ])('CALC-05: returns 0 working days for malformed date inputs (%j, %j)', (start, end) => {
      expect(countWorkingDays(start, end)).toBe(0);
    });
  });

  describe('5. Closeout Write-Off vs Active WIP Material Wastage Valuation', () => {
    it('treats zero installed quantity as 0 loss during active WIP (default 4-arg call)', () => {
      const wipResult = calculateWastageLossEgp(50, 0, 5, 200);

      expect(wipResult.actualWastagePct).toBe(0);
      expect(wipResult.isLoss).toBe(false);
      expect(wipResult.wastageLossEgp).toBe(0);
    });

    it('calculates 100% write-off loss (10,000 EGP) at closeout when treatZeroInstalledAsWriteOff is true', () => {
      const closeoutResult = calculateWastageLossEgp(50, 0, 5, 200, {
        treatZeroInstalledAsWriteOff: true,
      });

      expect(closeoutResult.actualWastagePct).toBe(100);
      expect(closeoutResult.isLoss).toBe(true);
      expect(closeoutResult.wastageLossEgp).toBe(10000);
    });
  });
});
