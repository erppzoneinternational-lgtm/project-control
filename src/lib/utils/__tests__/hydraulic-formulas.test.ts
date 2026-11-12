import { describe, it, expect } from 'vitest';
import {
  calculateWaterVolume,
  calculateFlowRate,
  calculatePipeVelocity,
  calculateRecommendedPipeDiameter,
  calculateTrenchDepth,
  HYDRAULIC_FORMULA_DEFINITIONS,
} from '@/lib/utils/hydraulic-formulas';

describe('Hydraulic Formulas & Engineering Utilities', () => {
  describe('calculateWaterVolume', () => {
    it('calculates volume accurately for standard inputs', () => {
      expect(calculateWaterVolume(500, 1.4)).toBe(700);
      expect(calculateWaterVolume(1000, 1.8)).toBe(1800);
    });

    it('handles zero and negative values safely', () => {
      expect(calculateWaterVolume(0, 1.4)).toBe(0);
      expect(calculateWaterVolume(-50, 1.4)).toBe(0);
      expect(calculateWaterVolume(500, -2)).toBe(0);
    });
  });

  describe('calculateFlowRate', () => {
    it('calculates flow rate based on turnover time', () => {
      // 600 m³ volume with 6 hours turnover = 100 m³/h
      expect(calculateFlowRate(600, 6)).toBe(100);
      // 1200 m³ volume with 4 hours turnover = 300 m³/h
      expect(calculateFlowRate(1200, 4)).toBe(300);
    });

    it('defaults or handles invalid turnover hours safely', () => {
      expect(calculateFlowRate(600, 0)).toBe(6000); // capped at min 0.1h
      expect(calculateFlowRate(0, 6)).toBe(0);
    });
  });

  describe('calculatePipeVelocity', () => {
    it('calculates velocity accurately for typical pipe sizes and flow rates', () => {
      // Flow rate 100 m³/h = 0.02778 m³/s
      // Pipe DN160 (0.16m diameter): Area = PI * 0.16^2 / 4 = 0.020106 m²
      // Velocity = 0.02778 / 0.020106 = 1.38 m/s (ideal suction velocity)
      const v = calculatePipeVelocity(100, 160);
      expect(v).toBeGreaterThanOrEqual(1.35);
      expect(v).toBeLessThanOrEqual(1.42);
      expect(v).toBe(1.38);
    });

    it('calculates discharge velocity for DN110', () => {
      // 100 m³/h through DN110
      // Area = PI * 0.11^2 / 4 = 0.0095 m²
      // Velocity = 0.02778 / 0.0095 = 2.92 m/s
      const v = calculatePipeVelocity(100, 110);
      expect(v).toBe(2.92);
    });

    it('returns 0 velocity when flow rate is 0', () => {
      expect(calculatePipeVelocity(0, 160)).toBe(0);
    });
  });

  describe('calculateRecommendedPipeDiameter', () => {
    it('recommends appropriate standard pipe diameter for target velocity', () => {
      // 100 m³/h at 1.5 m/s target velocity -> ~153mm (standard DN160)
      const d = calculateRecommendedPipeDiameter(100, 1.5);
      expect(d).toBeGreaterThanOrEqual(150);
      expect(d).toBeLessThanOrEqual(156);
    });

    it('returns default diameter for 0 flow rate', () => {
      expect(calculateRecommendedPipeDiameter(0, 1.5)).toBe(110);
    });
  });

  describe('calculateTrenchDepth', () => {
    it('calculates total trench excavation depth correctly', () => {
      // Pipe DN160 (0.16m) + Cover 0.8m + Bedding 0.15m = 1.11m
      expect(calculateTrenchDepth(160, 0.8, 0.15)).toBe(1.11);
      // Pipe DN250 (0.25m) + Road Cover 1.2m + Bedding 0.15m = 1.6m
      expect(calculateTrenchDepth(250, 1.2, 0.15)).toBe(1.6);
    });

    it('uses safe minimums when given invalid or negative numbers', () => {
      const depth = calculateTrenchDepth(0, -1, -0.5);
      expect(depth).toBeGreaterThanOrEqual(0.35);
    });
  });

  describe('HYDRAULIC_FORMULA_DEFINITIONS Dictionary', () => {
    it('contains all 5 core hydraulic definitions', () => {
      expect(HYDRAULIC_FORMULA_DEFINITIONS).toHaveProperty('flowRate');
      expect(HYDRAULIC_FORMULA_DEFINITIONS).toHaveProperty('velocity');
      expect(HYDRAULIC_FORMULA_DEFINITIONS).toHaveProperty('trenchDepth');
      expect(HYDRAULIC_FORMULA_DEFINITIONS).toHaveProperty('waterVolume');
      expect(HYDRAULIC_FORMULA_DEFINITIONS).toHaveProperty('waterDepth');
    });

    it('provides rigorous Arabic and English technical definitions and governing codes', () => {
      const keys = ['flowRate', 'velocity', 'trenchDepth', 'waterVolume', 'waterDepth'] as const;
      keys.forEach((key) => {
        const item = HYDRAULIC_FORMULA_DEFINITIONS[key];
        expect(item.symbol.length).toBeGreaterThan(0);
        expect(item.formula.length).toBeGreaterThan(3);
        expect(item.definitionAr.length).toBeGreaterThan(30);
        expect(item.definitionEn.length).toBeGreaterThan(30);
        expect(item.governingCodes.length).toBeGreaterThanOrEqual(2);
        expect(item.designLimitsAr.length).toBeGreaterThanOrEqual(2);
        expect(item.designLimitsEn.length).toBeGreaterThanOrEqual(2);
      });
    });
  });
});
