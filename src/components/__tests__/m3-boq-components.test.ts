import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

import { canViewPrices, FINANCIAL_ALLOWED_ROLES } from '../planning/PriceGate';
import { COST_CODE_CATEGORIES } from '../planning/CostCodeManager';
import { PRICING_STATUS_CONFIG, STANDARD_BOQ_UNITS, KNOWN_BOQ_UNIT_VALUES } from '../planning/BoqTable';
import {
  ROLE_LABELS,
  ROLE_COLORS,
  DEFAULT_MODULE_ROLE_SEEDS,
  RACI_MATRIX,
  APP_MODULE_GROUPS,
} from '@/lib/rbac/role-matrix';
import {
  ACTIVE_MODULE_ACCESS,
  ACTIVE_EDIT_ROLES,
  canAccessPath,
  canEditPath,
} from '@/lib/rbac/access-control';
import { calculateProcurementQty } from '@/lib/planning/calculations';

describe('Milestone 3 (BOQ Management, BOM & UI Components)', () => {
  describe('PriceGate & Financial Visibility Security', () => {
    it('allows financial and planning roles to view prices', () => {
      const allowedRoles = [
        'commercial_manager',
        'cost_control',
        'estimator',
        'project_manager',
        'ceo',
        'coo',
        'chairman',
        'admin',
        'finance',
        'contract_admin',
        'planning_manager',
      ];

      allowedRoles.forEach((role) => {
        expect(canViewPrices([role], false)).toBe(true);
      });
    });

    it('masks prices for non-financial roles such as site engineer and technical office', () => {
      expect(canViewPrices(['site_engineer'], false)).toBe(false);
      expect(canViewPrices(['technical_office'], false)).toBe(false);
      expect(canViewPrices(['qc_inspector'], false)).toBe(false);
      expect(canViewPrices(['planning_engineer'], false)).toBe(false);
      expect(canViewPrices(['planning_engineer'], false, true)).toBe(true);
      expect(canViewPrices([], false)).toBe(false);
      expect(canViewPrices(null, false)).toBe(false);
      expect(canViewPrices(undefined, false)).toBe(false);
    });

    it('always permits admin to view prices regardless of explicit role list', () => {
      expect(canViewPrices([], true)).toBe(true);
      expect(canViewPrices(['site_engineer'], true)).toBe(true);
    });
  });

  describe('RBAC Role Matrix & Planning Seeds', () => {
    it('defines technical_office in ROLE_LABELS and ROLE_COLORS', () => {
      expect(ROLE_LABELS).toHaveProperty('technical_office');
      expect(ROLE_LABELS.technical_office).toContain('المكتب الفني');
      expect(ROLE_COLORS).toHaveProperty('technical_office');
      expect(ROLE_COLORS.technical_office).toContain('teal');
    });

    it('seeds all planning and BOQ routes in DEFAULT_MODULE_ROLE_SEEDS', () => {
      const requiredRoutes = [
        '/boq',
        '/planning',
        '/planning/activities',
        '/planning/baseline',
        '/planning/daily-progress',
        '/planning/allocation',
        '/planning/dashboard',
        '/deliverables',
      ];

      requiredRoutes.forEach((route) => {
        expect(DEFAULT_MODULE_ROLE_SEEDS).toHaveProperty(route);
        expect(Array.isArray(DEFAULT_MODULE_ROLE_SEEDS[route])).toBe(true);
        expect(DEFAULT_MODULE_ROLE_SEEDS[route].length).toBeGreaterThan(0);
      });

      expect(DEFAULT_MODULE_ROLE_SEEDS['/boq']).toContain('estimator');
      expect(DEFAULT_MODULE_ROLE_SEEDS['/boq']).toContain('commercial_manager');
      expect(DEFAULT_MODULE_ROLE_SEEDS['/deliverables']).toContain('technical_office');
    });

    it('defines required RACI matrix processes for planning module', () => {
      const boqProcess = RACI_MATRIX.find((r) => r.process === 'BOQ & Cost Codes Management');
      expect(boqProcess).toBeDefined();
      expect(boqProcess?.responsible).toContain('estimator');
      expect(boqProcess?.accountable).toContain('project_manager');

      const planningProcess = RACI_MATRIX.find((r) => r.process === 'Planning & Progress Control');
      expect(planningProcess).toBeDefined();
      expect(planningProcess?.responsible).toContain('planning_engineer');

      const deliverablesProcess = RACI_MATRIX.find((r) => r.process === 'Deliverables Management E1/E2');
      expect(deliverablesProcess).toBeDefined();
      expect(deliverablesProcess?.responsible).toContain('technical_office');
    });

    it('defines planning_office group in APP_MODULE_GROUPS', () => {
      const planningGroup = APP_MODULE_GROUPS.find((g) => g.id === 'planning_office');
      expect(planningGroup).toBeDefined();
      expect(planningGroup?.modules.some((m) => m.path === '/boq')).toBe(true);
      expect(planningGroup?.modules.some((m) => m.path === '/deliverables')).toBe(true);
    });

    it('grants appropriate route access in canAccessPath and canEditPath', () => {
      expect(canAccessPath('/boq', ['estimator'], false)).toBe(true);
      expect(canAccessPath('/boq', ['site_engineer'], false)).toBe(true);
      expect(canEditPath('/boq', ['estimator'], false)).toBe(true);
      expect(canEditPath('/boq', ['site_engineer'], false)).toBe(false);
      expect(canEditPath('/boq', ['admin'], false)).toBe(true);
    });
  });

  describe('Cost Codes & BOQ Status Configuration', () => {
    it('defines 8 master categories in COST_CODE_CATEGORIES', () => {
      const categories = COST_CODE_CATEGORIES.map((c) => c.key);
      expect(categories).toContain('all');
      expect(categories).toContain('preliminaries');
      expect(categories).toContain('concrete');
      expect(categories).toContain('finishing');
      expect(categories).toContain('mech');
      expect(categories).toContain('elec');
      expect(categories).toContain('landscape');
      expect(categories).toContain('water_features');
      expect(categories).toContain('other');
      expect(COST_CODE_CATEGORIES.length).toBe(9); // 'all' + 8 categories
    });

    it('covers all standard BoqPricingStatus values in PRICING_STATUS_CONFIG', () => {
      expect(PRICING_STATUS_CONFIG).toHaveProperty('contract_original');
      expect(PRICING_STATUS_CONFIG).toHaveProperty('vo_approved');
      expect(PRICING_STATUS_CONFIG).toHaveProperty('star_rate_provisional');
      expect(PRICING_STATUS_CONFIG).toHaveProperty('disputed');
    });
  });

  describe('BOM Procurement Calculations & Wastage Formulas', () => {
    it('calculates HDPE membrane procurement qty with 8% wastage', () => {
      const contractQty = 50000;
      const consumptionRate = 1.0;
      const wastagePct = 8.0;
      const result = calculateProcurementQty(contractQty, consumptionRate, wastagePct);
      expect(result).toBe(54000);
    });

    it('calculates geotextile procurement qty with 6% wastage', () => {
      const contractQty = 50000;
      const consumptionRate = 1.0;
      const wastagePct = 6.0;
      const result = calculateProcurementQty(contractQty, consumptionRate, wastagePct);
      expect(result).toBe(53000);
    });

    it('calculates extrusion rod qty with fractional consumption rate', () => {
      const contractQty = 50000;
      const consumptionRate = 0.003;
      const wastagePct = 0;
      const result = calculateProcurementQty(contractQty, consumptionRate, wastagePct);
      expect(result).toBe(150);
    });
  });

  describe('Standard BOQ Engineering Units Selection List', () => {
    it('contains standard construction units including LS, m3, m2, linear meter, count, ton, set', () => {
      const unitValues = STANDARD_BOQ_UNITS.map((u) => u.value);
      expect(unitValues).toContain('LS');
      expect(unitValues).toContain('م3');
      expect(unitValues).toContain('م2');
      expect(unitValues).toContain('م.ط');
      expect(unitValues).toContain('عدد');
      expect(unitValues).toContain('طن');
      expect(unitValues).toContain('كجم');
      expect(unitValues).toContain('طقم');
      expect(unitValues).toContain('نقطة');
    });

    it('identifies known standard units in case-insensitive check', () => {
      expect(KNOWN_BOQ_UNIT_VALUES.has('ls')).toBe(true);
      expect(KNOWN_BOQ_UNIT_VALUES.has('m3')).toBe(true);
      expect(KNOWN_BOQ_UNIT_VALUES.has('م3')).toBe(true);
      expect(KNOWN_BOQ_UNIT_VALUES.has('ton')).toBe(true);
      expect(KNOWN_BOQ_UNIT_VALUES.has('طن')).toBe(true);
      expect(KNOWN_BOQ_UNIT_VALUES.has('unknown_exotic_unit')).toBe(false);
    });
  });
});
