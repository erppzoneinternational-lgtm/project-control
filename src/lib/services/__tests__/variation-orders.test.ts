import { describe, it, expect } from 'vitest';
import { calculateNetVos, buildCreatePayload, buildUpdatePayload } from '../project.payload';
import { VariationOrderItem } from '@/types';

describe('Variation Orders Calculation & Payload Serialization', () => {
  describe('calculateNetVos', () => {
    it('returns zero totals for null, undefined, or empty arrays', () => {
      expect(calculateNetVos(undefined)).toEqual({
        totalAdditions: 0,
        totalDeductions: 0,
        netVos: 0,
      });
      expect(calculateNetVos(null)).toEqual({
        totalAdditions: 0,
        totalDeductions: 0,
        netVos: 0,
      });
      expect(calculateNetVos([])).toEqual({
        totalAdditions: 0,
        totalDeductions: 0,
        netVos: 0,
      });
    });

    it('calculates pure additions correctly', () => {
      const items: VariationOrderItem[] = [
        {
          id: 'vo-1',
          vo_number: 'VO-01',
          title: 'إضافة لاجون إضافي 3',
          type: 'addition',
          amount: 500000,
          issue_date: '2026-05-10',
        },
        {
          id: 'vo-2',
          vo_number: 'VO-02',
          title: 'توسعة غرفة طلمبات',
          type: 'addition',
          amount: 250000,
          issue_date: '2026-06-15',
        },
      ];

      const res = calculateNetVos(items);
      expect(res.totalAdditions).toBe(750000);
      expect(res.totalDeductions).toBe(0);
      expect(res.netVos).toBe(750000);
    });

    it('calculates pure deductions correctly (negative net VOs)', () => {
      const items: VariationOrderItem[] = [
        {
          id: 'vo-1',
          vo_number: 'VO-01',
          title: 'إلغاء نافورة مدخل',
          type: 'deduction',
          amount: 150000,
          issue_date: '2026-07-01',
        },
        {
          id: 'vo-2',
          vo_number: 'VO-02',
          title: 'تقليص مساحة بحيرة',
          type: 'deduction',
          amount: 50000,
          issue_date: '2026-07-20',
        },
      ];

      const res = calculateNetVos(items);
      expect(res.totalAdditions).toBe(0);
      expect(res.totalDeductions).toBe(200000);
      expect(res.netVos).toBe(-200000);
    });

    it('calculates combined additions and deductions simultaneously', () => {
      const items: VariationOrderItem[] = [
        {
          id: 'vo-1',
          vo_number: 'VO-01',
          title: 'أعمال كهروميكانيكية إضافية',
          type: 'addition',
          amount: 400000,
          issue_date: '2026-04-12',
          time_impact_days: 15,
        },
        {
          id: 'vo-2',
          vo_number: 'VO-02',
          title: 'حذف خزان مياه احتياطي',
          type: 'deduction',
          amount: 120000,
          issue_date: '2026-05-18',
          time_impact_days: -5,
        },
        {
          id: 'vo-3',
          vo_number: 'VO-03',
          title: 'إضافة سخانات شمسية',
          type: 'addition',
          amount: 80000,
          issue_date: '2026-08-01',
        },
      ];

      const res = calculateNetVos(items);
      expect(res.totalAdditions).toBe(480000);
      expect(res.totalDeductions).toBe(120000);
      expect(res.netVos).toBe(360000);
    });
  });

  describe('Payload integration for Create and Update', () => {
    it('embeds variation_orders in metadata and syncs vos_value on buildCreatePayload', () => {
      const vos: VariationOrderItem[] = [
        {
          id: 'vo-1',
          vo_number: 'VO-01',
          title: 'إضافة لاجون',
          type: 'addition',
          amount: 300000,
          issue_date: '2026-05-01',
        },
        {
          id: 'vo-2',
          vo_number: 'VO-02',
          title: 'خصم أعمال مدنية',
          type: 'deduction',
          amount: 50000,
          issue_date: '2026-06-01',
        },
      ];

      const payload = buildCreatePayload({
        project_code: '2615',
        project_name: 'مشروع مارينا لاجونز',
        contract_value: 10000000,
        variation_orders: vos,
      });

      expect(payload.vos_value).toBe(250000);
      expect(payload.metadata).toHaveProperty('variation_orders');
      expect((payload.metadata as any).variation_orders).toHaveLength(2);
      expect((payload.metadata as any).variation_orders[0].vo_number).toBe('VO-01');
    });

    it('embeds variation_orders in metadata and syncs vos_value on buildUpdatePayload', () => {
      const vos: VariationOrderItem[] = [
        {
          id: 'vo-1',
          vo_number: 'VO-01',
          title: 'خصم كامل لنطاق الشلال',
          type: 'deduction',
          amount: 180000,
          issue_date: '2026-08-10',
        },
      ];

      const payload = buildUpdatePayload({
        contract_value: 5000000,
        variation_orders: vos,
      });

      expect(payload.vos_value).toBe(-180000);
      expect(payload.metadata).toHaveProperty('variation_orders');
      expect((payload.metadata as any).variation_orders).toEqual(vos);
    });
  });
});
