import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

import {
  canViewPrices,
  FINANCIAL_ALLOWED_ROLES,
} from '@/components/planning/PriceGate';
import { stripPriceFields } from '@/lib/services/boq.service';
import { MATRIX_ROLES, ROLE_LABELS } from '@/lib/rbac/role-matrix';

/**
 * Fail-Secure Financial Price Gate & Server-Side BOQ Masking Adversarial Suite
 *
 * Grounded in:
 * - `src/components/planning/PriceGate.tsx` (`canViewPrices`, `FINANCIAL_ALLOWED_ROLES`)
 * - `src/lib/services/boq.service.ts` (`stripPriceFields`)
 * - `supabase/migrations/062_qa_prelaunch_remediation.sql` (`fn_user_can_see_prices`, `v_boq_current`)
 *
 * Verifies all 22 canonical `public.user_role` values:
 * - 11 unconditional financial/executive roles retain price visibility
 * - 10 operational roles receive masked (`null`) price columns
 * - 1 conditional role (`planning_engineer`) requires `hasPriceGrant === true`
 * - `site_engineer` never sees prices unless also holding an unconditional financial/executive role
 */

export const UNCONDITIONAL_FINANCIAL_ROLES = [
  'admin',
  'ceo',
  'coo',
  'chairman',
  'commercial_manager',
  'project_manager',
  'planning_manager',
  'cost_control',
  'estimator',
  'contract_admin',
  'finance',
] as const;

export const OPERATIONAL_MASKED_ROLES = [
  'site_engineer',
  'technical_office',
  'to_engineer',
  'to_manager',
  'qc_inspector',
  'coo_assistant',
  'board_member',
  'ipc_clerk',
  'procurement',
  'inventory',
] as const;

describe('Price Gate & stripPriceFields Fail-Secure Security Audit', () => {
  const sampleBoqRow = {
    id: 'boq-001',
    item_code: '03.10.010',
    description_ar: 'خرسانة مسلحة للأساسات المسلحة والقواعد',
    unit: 'm3',
    contract_qty: 1200,
    shop_drawing_qty: 1250,
    rate_egp: 4500.0,
    amount_egp: 5400000.0,
    base_foreign_amount: 110000.0,
  };

  describe('1. Exhaustive 22-Role Partition & Visibility Matrix', () => {
    it('GATE-01: partitions all 22 canonical roles cleanly across 11 unconditional + 10 masked + 1 grant-gated', () => {
      const allRoles = new Set<string>([
        ...UNCONDITIONAL_FINANCIAL_ROLES,
        ...OPERATIONAL_MASKED_ROLES,
        'planning_engineer',
      ]);

      expect(UNCONDITIONAL_FINANCIAL_ROLES).toHaveLength(11);
      expect(OPERATIONAL_MASKED_ROLES).toHaveLength(10);
      expect(allRoles.size).toBe(22);
      expect(MATRIX_ROLES).toHaveLength(22);
      for (const role of allRoles) {
        expect(ROLE_LABELS).toHaveProperty(role);
      }
      expect(FINANCIAL_ALLOWED_ROLES).not.toContain('planning_engineer');
      expect(FINANCIAL_ALLOWED_ROLES).not.toContain('site_engineer');
    });

    it.each(UNCONDITIONAL_FINANCIAL_ROLES)(
      'GATE-02: unconditional financial/executive role "%s" retains full BOQ price visibility',
      (role) => {
        expect(canViewPrices([role], false)).toBe(true);

        const [row] = stripPriceFields([sampleBoqRow], [role], false);
        expect(row.rate_egp).toBe(4500.0);
        expect(row.amount_egp).toBe(5400000.0);
        expect(row.base_foreign_amount).toBe(110000.0);
      }
    );

    it.each(OPERATIONAL_MASKED_ROLES)(
      'GATE-03: operational/non-financial role "%s" has BOQ prices stripped to null while preserving engineering metadata',
      (role) => {
        expect(canViewPrices([role], false)).toBe(false);

        const [row] = stripPriceFields([sampleBoqRow], [role], false);
        expect(row.rate_egp).toBeNull();
        expect(row.amount_egp).toBeNull();
        expect(row.base_foreign_amount).toBeNull();
        expect(row.description_ar).toBe('خرسانة مسلحة للأساسات المسلحة والقواعد');
        expect(row.unit).toBe('m3');
      }
    );
  });

  describe('2. Planning Engineer Grant Gate & Site Engineer Hard Block (Regression GATE-04)', () => {
    it('GATE-04a: masks prices for planning_engineer when hasPriceGrant is undefined or false', () => {
      expect(canViewPrices(['planning_engineer'], false)).toBe(false);
      expect(canViewPrices(['planning_engineer'], false, false)).toBe(false);

      const [rowImplicit] = stripPriceFields([sampleBoqRow], ['planning_engineer'], false);
      const [rowExplicitFalse] = stripPriceFields([sampleBoqRow], ['planning_engineer'], false, false);

      expect(rowImplicit.rate_egp).toBeNull();
      expect(rowImplicit.amount_egp).toBeNull();
      expect(rowExplicitFalse.rate_egp).toBeNull();
      expect(rowExplicitFalse.amount_egp).toBeNull();
    });

    it('GATE-04b: reveals prices for planning_engineer when hasPriceGrant === true', () => {
      expect(canViewPrices(['planning_engineer'], false, true)).toBe(true);

      const [rowGranted] = stripPriceFields([sampleBoqRow], ['planning_engineer'], false, true);
      expect(rowGranted.rate_egp).toBe(4500.0);
      expect(rowGranted.amount_egp).toBe(5400000.0);
      expect(rowGranted.base_foreign_amount).toBe(110000.0);
    });

    it('GATE-04c: blocks site_engineer from viewing prices unless holding an unconditional financial/executive role', () => {
      expect(canViewPrices(['site_engineer'], false, true)).toBe(false);
      expect(canViewPrices(['site_engineer', 'planning_engineer'], false, true)).toBe(false);

      const [maskedSiteRow] = stripPriceFields(
        [sampleBoqRow],
        ['site_engineer', 'planning_engineer'],
        false,
        true
      );
      expect(maskedSiteRow.rate_egp).toBeNull();
      expect(maskedSiteRow.amount_egp).toBeNull();

      // Dual-hatted PM + Site Engineer retains access via explicit executive/financial role
      expect(canViewPrices(['site_engineer', 'project_manager'], false)).toBe(true);
      const [pmRow] = stripPriceFields([sampleBoqRow], ['site_engineer', 'project_manager'], false);
      expect(pmRow.rate_egp).toBe(4500.0);
    });
  });

  describe('3. Fail-Secure Defaults, Admin Override & Input Immutability', () => {
    it.each<[string, string[] | null | undefined]>([
      ['undefined roles', undefined],
      ['null roles', null],
      ['empty roles array', []],
      ['unknown/injection strings', ['guest', 'hacker', "admin'; DROP TABLE pm_boq_items;--"]],
    ])('GATE-05/06: fails closed (null prices) when called with %s', (_label, rolesInput) => {
      expect(canViewPrices(rolesInput, false)).toBe(false);

      const [row] = stripPriceFields([sampleBoqRow], rolesInput, false);
      expect(row.rate_egp).toBeNull();
      expect(row.amount_egp).toBeNull();
      expect(row.base_foreign_amount).toBeNull();
    });

    it('GATE-07: permits access when isAdmin = true regardless of role list', () => {
      expect(canViewPrices([], true)).toBe(true);

      const [row] = stripPriceFields([sampleBoqRow], [], true);
      expect(row.rate_egp).toBe(4500.0);
      expect(row.amount_egp).toBe(5400000.0);
    });

    it('GATE-08: does not mutate the caller input array or BOQ row objects', () => {
      const original = { ...sampleBoqRow };
      const [stripped] = stripPriceFields([original], ['site_engineer'], false);

      expect(stripped.rate_egp).toBeNull();
      expect(original.rate_egp).toBe(4500.0);
      expect(original.amount_egp).toBe(5400000.0);
    });
  });
});
