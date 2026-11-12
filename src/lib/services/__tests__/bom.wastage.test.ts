import type { MockBuilderShape, MockQueryBuilder } from '@/types/services-types';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateProcurementQty,
  calculateWastageLossEgp,
} from '@/lib/planning/calculations';
import { BoqService } from '@/lib/services/boq.service';
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

describe('BOM & Wastage Calculation Suite (bom.wastage.test.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appCache.clear();
  });

  describe('1. BOM Procurement Quantity Formula Invariants', () => {
    it('Scenario 1 (HDPE Geomembrane): 50,000 m² @ 1.0 m²/m² with 8.0% waste => 54,000 m²', () => {
      // Formula: contract_qty * consumption_rate * (1 + standard_wastage_pct / 100)
      // 50,000 * 1.0 * (1 + 8/100) = 50,000 * 1.08 = 54,000 m²
      const contractQty = 50000;
      const consumptionRate = 1.0;
      const standardWastagePct = 8.0;

      const procurementQty = calculateProcurementQty(contractQty, consumptionRate, standardWastagePct);
      expect(procurementQty).toBe(54000);
    });

    it('Scenario 2 (High-tensile Rebar in Concrete): 1,000 m³ @ 110 kg/m³ (0.110 ton/m³) with 4.0% cutting loss => 114.40 tons', () => {
      // 1,000 m³ * 0.110 ton/m³ * (1 + 4.0/100) = 110 ton * 1.04 = 114.40 tons
      const concreteQty = 1000; // m³
      const rebarRateTon = 0.11; // 110 kg/m³ = 0.110 ton/m³
      const cuttingWastagePct = 4.0;

      const procurementTons = calculateProcurementQty(concreteQty, rebarRateTon, cuttingWastagePct);
      expect(procurementTons).toBe(114.4);

      // Verify in kg units: 1,000 * 110 * 1.04 = 114,400 kg
      const procurementKg = calculateProcurementQty(concreteQty, 110, cuttingWastagePct);
      expect(procurementKg).toBe(114400);
    });

    it('Scenario 3 (Non-woven Geotextile 300g): 50,000 m² @ 1.0 m²/m² with 6.0% overlap waste => 53,000 m²', () => {
      // 50,000 * 1.0 * 1.06 = 53,000 m²
      const procurementQty = calculateProcurementQty(50000, 1.0, 6.0);
      expect(procurementQty).toBe(53000);
    });

    it('Scenario 4 (Extrusion Welding Rod): 50,000 m² @ 0.003 kg/m² with 0.0% waste => 150.000 kg', () => {
      // 50,000 * 0.003 * 1.00 = 150 kg
      const procurementQty = calculateProcurementQty(50000, 0.003, 0.0);
      expect(procurementQty).toBe(150);
    });

    it('preserves 3 decimal precision for fractional consumption rates and wastage', () => {
      // 123.456 m³ * 2.345 rate * 1.075 (7.5% waste)
      // 123.456 * 2.345 * 1.075 = 311.217144 => 311.217
      const result = calculateProcurementQty(123.456, 2.345, 7.5);
      expect(result).toBe(311.217);
    });
  });

  describe('2. Wastage Variance & Financial Loss Invariants', () => {
    it('calculates zero financial loss when actual wastage equals or is lower than standard allowance', () => {
      // Issued: 54,000 m², Installed: 50,000 m²
      // Actual waste = (54,000 - 50,000) / 50,000 * 100 = 8.0%
      // Standard waste = 8.0% => Variance = 0.0% => Loss = 0 EGP
      const resultExact = calculateWastageLossEgp(54000, 50000, 8.0, 180);
      expect(resultExact.actualWastagePct).toBe(8.0);
      expect(resultExact.varianceWastagePct).toBe(0.0);
      expect(resultExact.isLoss).toBe(false);
      expect(resultExact.wastageLossEgp).toBe(0);

      // Issued: 53,000 m² (under standard waste: 6.0% actual vs 8.0% standard)
      const resultUnder = calculateWastageLossEgp(53000, 50000, 8.0, 180);
      expect(resultUnder.actualWastagePct).toBe(6.0);
      expect(resultUnder.varianceWastagePct).toBe(-2.0);
      expect(resultUnder.isLoss).toBe(false);
      expect(resultUnder.wastageLossEgp).toBe(0);
    });

    it('calculates exact financial loss in EGP when actual site wastage exceeds standard allowance', () => {
      // Site Case: HDPE Lining at Pzone Lagoon
      // Issued from store: 56,000 m²
      // Installed net measured: 50,000 m²
      // Standard Wastage Allowance: 8.0%
      // Purchase Price: 180 EGP/m²
      //
      // Actual Wastage % = (56,000 - 50,000) / 50,000 * 100 = 12.0%
      // Variance Wastage % = 12.0% - 8.0% = +4.0%
      // Wastage Loss EGP = (4.0 / 100) * 50,000 m² * 180 EGP/m² = 360,000 EGP
      const result = calculateWastageLossEgp(56000, 50000, 8.0, 180);

      expect(result.actualWastagePct).toBe(12.0);
      expect(result.varianceWastagePct).toBe(4.0);
      expect(result.isLoss).toBe(true);
      expect(result.wastageLossEgp).toBe(360000);
    });

    it('Scenario: Ready-mix Concrete 350kg CEM I wastage loss', () => {
      // Batch plant delivered: 1,120 m³
      // Site installed in formwork: 1,000 m³
      // Standard allowance: 5.0%
      // Supplier Unit Rate: 2,400 EGP/m³
      //
      // Actual Waste = (1120 - 1000) / 1000 * 100 = 12.0%
      // Excess Waste = 12.0% - 5.0% = 7.0%
      // Loss = 0.07 * 1000 * 2400 = 168,000 EGP
      const result = calculateWastageLossEgp(1120, 1000, 5.0, 2400);

      expect(result.actualWastagePct).toBe(12.0);
      expect(result.varianceWastagePct).toBe(7.0);
      expect(result.isLoss).toBe(true);
      expect(result.wastageLossEgp).toBe(168000);
    });
  });

  describe('3. BoqService.saveSubMaterial Auto-Procurement Integration', () => {
    it('automatically queries parent BOQ contract quantity and computes required_procurement_qty', async () => {
      const mockBoqItem = {
        id: 'boq-item-100',
        contract_qty: 50000,
        rate_egp: 180,
      };

      const mockSavedSubMaterial = {
        id: 'sub-mat-1',
        boq_item_id: 'boq-item-100',
        material_name_ar: 'لفائف ممبرين HDPE 1.5mm',
        unit: 'm2',
        consumption_rate: 1.0,
        standard_wastage_pct: 8.0,
        required_procurement_qty: 54000,
        procurement_stage: 'material_approval',
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_boq_items') {
          return createMockQueryBuilder({ data: mockBoqItem, error: null });
        }
        if (table === 'pm_boq_sub_materials') {
          return createMockQueryBuilder({ data: mockSavedSubMaterial, error: null });
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      const res = await BoqService.saveSubMaterial({
        boq_item_id: 'boq-item-100',
        material_name_ar: 'لفائف ممبرين HDPE 1.5mm',
        unit: 'm2',
        consumption_rate: 1.0,
        standard_wastage_pct: 8.0,
      });

      expect(res?.required_procurement_qty).toBe(54000);
    });
  });

  describe('4. Edge Cases & Boundary Safety', () => {
    it('handles zero or negative contract quantity in calculateProcurementQty', () => {
      expect(calculateProcurementQty(0, 1.0, 8.0)).toBe(0);
      expect(calculateProcurementQty(-500, 1.0, 8.0)).toBe(0);
    });

    it('handles zero or negative consumption rate safely', () => {
      expect(calculateProcurementQty(1000, 0, 5.0)).toBe(0);
      expect(calculateProcurementQty(1000, -1.5, 5.0)).toBe(0);
    });

    it('handles zero installed net quantity in calculateWastageLossEgp without divide-by-zero error', () => {
      const result = calculateWastageLossEgp(100, 0, 5.0, 180);
      expect(result.actualWastagePct).toBe(0);
      expect(result.varianceWastagePct).toBe(0);
      expect(result.isLoss).toBe(false);
      expect(result.wastageLossEgp).toBe(0);
      expect(Number.isNaN(result.actualWastagePct)).toBe(false);
    });

    it('handles negative or zero purchase price safely', () => {
      const resultZeroPrice = calculateWastageLossEgp(120, 100, 5.0, 0);
      expect(resultZeroPrice.wastageLossEgp).toBe(0);

      const resultNegPrice = calculateWastageLossEgp(120, 100, 5.0, -100);
      expect(resultNegPrice.wastageLossEgp).toBe(0);
    });
  });
});
