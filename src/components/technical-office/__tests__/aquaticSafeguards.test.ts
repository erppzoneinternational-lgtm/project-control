import { describe, it, expect } from 'vitest';
import {
  evaluateFloodTest,
  calculateAquaticTurnover,
  evaluateBondingResistance,
  evaluatePipePressureTest,
} from '../AquaticSafeguardsHub';

describe('Aquatic Engineering Pure Calculations (ACI 350, DIN 19643, NEC 680)', () => {
  describe('evaluateFloodTest (ACI 350.1 Water-Tightness)', () => {
    it('passes when net drop is small and leakage is below 0.05% per 24 hours', () => {
      // 450 m3 pool, 300 m2 area, 12mm total drop, 9mm evaporation -> 3mm net drop over 72h
      // net volume loss = 0.003 * 300 = 0.9 m3 over 72h -> 0.3 m3 / 24h
      // percentage = (0.3 / 450) * 100 = 0.0667%? Wait, let's check:
      // If net drop is 1mm -> 0.001 * 300 = 0.3 m3 / 72h -> 0.1 m3 / 24h -> 0.1 / 450 * 100 = 0.0222% <= 0.05%
      const result = evaluateFloodTest({
        initialLevelMm: 1500,
        finalLevelMm: 1490, // 10mm drop
        evaporationMm: 9,   // 9mm evap -> 1mm net drop
        durationHours: 72,
        volumeM3: 450,
        surfaceAreaM2: 300,
      });

      expect(result.netDropMm).toBe(1);
      expect(result.netLeakageM3).toBeCloseTo(0.3, 2);
      expect(result.passed).toBe(true);
      expect(result.percentagePer24h).toBeLessThanOrEqual(0.05);
      expect(result.verdict).toContain('ناجح');
    });

    it('fails when water loss exceeds 0.05% per 24 hours (cracks or joint failure)', () => {
      // 20mm drop, 5mm evap -> 15mm net drop over 72h -> 4.5 m3 over 72h -> 1.5 m3/day
      // 1.5 / 450 * 100 = 0.333% > 0.05%
      const result = evaluateFloodTest({
        initialLevelMm: 1500,
        finalLevelMm: 1480,
        evaporationMm: 5,
        durationHours: 72,
        volumeM3: 450,
        surfaceAreaM2: 300,
      });

      expect(result.netDropMm).toBe(15);
      expect(result.passed).toBe(false);
      expect(result.percentagePer24h).toBeGreaterThan(0.05);
      expect(result.verdict).toContain('راسب');
    });
  });

  describe('calculateAquaticTurnover (DIN 19643 Hydraulic Sizing)', () => {
    it('handles zero or negative volume gracefully', () => {
      expect(calculateAquaticTurnover(0, 4)).toEqual({ flowRateM3H: 0, recommendedPumpsCount: 0 });
      expect(calculateAquaticTurnover(400, 0)).toEqual({ flowRateM3H: 0, recommendedPumpsCount: 0 });
    });

    it('calculates required flow rate and duty/standby pumps for commercial pool', () => {
      // 450 m3 / 4 hours = 112.5 m3/h -> >60 m3/h -> 3 pumps (2 duty + 1 standby)
      const res = calculateAquaticTurnover(450, 4);
      expect(res.flowRateM3H).toBe(112.5);
      expect(res.recommendedPumpsCount).toBe(3);
    });

    it('calculates smaller pool pump configuration (1 duty + 1 standby)', () => {
      // 120 m3 / 4 hours = 30 m3/h -> <= 60 m3/h -> 2 pumps
      const res = calculateAquaticTurnover(120, 4);
      expect(res.flowRateM3H).toBe(30);
      expect(res.recommendedPumpsCount).toBe(2);
    });
  });

  describe('evaluateBondingResistance (NEC 680 Swimming Pool Shock Protection)', () => {
    it('flags unread or zero resistance as danger', () => {
      const res = evaluateBondingResistance(0);
      expect(res.compliant).toBe(false);
      expect(res.rating).toBe('danger');
    });

    it('certifies ideal resistance <= 0.5 Ohm as safe', () => {
      const res = evaluateBondingResistance(0.35);
      expect(res.compliant).toBe(true);
      expect(res.rating).toBe('safe');
      expect(res.recommendation).toContain('ممتاز');
    });

    it('accepts resistance between 0.5 and 1.0 Ohm with warning', () => {
      const res = evaluateBondingResistance(0.85);
      expect(res.compliant).toBe(true);
      expect(res.rating).toBe('warning');
      expect(res.recommendation).toContain('مقبول');
    });

    it('rejects resistance exceeding 1.0 Ohm due to electrocution danger', () => {
      const res = evaluateBondingResistance(1.8);
      expect(res.compliant).toBe(false);
      expect(res.rating).toBe('danger');
      expect(res.recommendation).toContain('مرفوض كودياً');
    });
  });

  describe('evaluatePipePressureTest (Buried Pipe Hydrostatic Pressure Test 1.5x)', () => {
    it('passes at 1.5x working pressure and 0 drop over 60 minutes', () => {
      const res = evaluatePipePressureTest({
        workingPressureBar: 4,
        testPressureBar: 6,
        finalPressureBar: 6,
        durationMinutes: 60,
      });
      expect(res.requiredMinPressureBar).toBe(6);
      expect(res.isRatioValid).toBe(true);
      expect(res.pressureDropBar).toBe(0);
      expect(res.isDropAcceptable).toBe(true);
      expect(res.isDurationValid).toBe(true);
      expect(res.isPassed).toBe(true);
      expect(res.verdictAr).toContain('ناجح');
    });

    it('fails when test pressure is less than 1.5x working pressure', () => {
      const res = evaluatePipePressureTest({
        workingPressureBar: 6,
        testPressureBar: 8, // required is 9 bar
        finalPressureBar: 8,
        durationMinutes: 60,
      });
      expect(res.requiredMinPressureBar).toBe(9);
      expect(res.isRatioValid).toBe(false);
      expect(res.isPassed).toBe(false);
      expect(res.verdictAr).toContain('راسب');
    });

    it('fails when pressure drop exceeds 0.05 bar', () => {
      const res = evaluatePipePressureTest({
        workingPressureBar: 4,
        testPressureBar: 6,
        finalPressureBar: 5.8, // 0.2 bar drop > 0.05 bar
        durationMinutes: 60,
      });
      expect(res.pressureDropBar).toBe(0.2);
      expect(res.isDropAcceptable).toBe(false);
      expect(res.isPassed).toBe(false);
      expect(res.verdictAr).toContain('راسب');
    });

    it('fails when duration is less than 30 minutes', () => {
      const res = evaluatePipePressureTest({
        workingPressureBar: 4,
        testPressureBar: 6,
        finalPressureBar: 6,
        durationMinutes: 20, // < 30 min
      });
      expect(res.isDurationValid).toBe(false);
      expect(res.isPassed).toBe(false);
      expect(res.verdictAr).toContain('راسب');
    });
  });
});
