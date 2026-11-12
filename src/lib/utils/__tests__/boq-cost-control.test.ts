import { describe, it, expect } from 'vitest';
import {
  computeItemCostControlMetrics,
  reconcileProjectBoqWithContract,
  extractCostControlFromNotes,
  packCostControlIntoNotes,
} from '../boq-cost-control.utils';
import { BoqItem } from '@/types/boq';
import { Project } from '@/types';

describe('BOQ Cost Control & Contract Variation Order Utilities', () => {
  describe('extractCostControlFromNotes & packCostControlIntoNotes', () => {
    it('returns empty object when notes is null or standard string', () => {
      expect(extractCostControlFromNotes(null)).toEqual({});
      expect(extractCostControlFromNotes('ملاحظة عامة')).toEqual({ user_note: 'ملاحظة عامة' });
    });

    it('extracts structured JSON cost control parameters', () => {
      const notes = JSON.stringify({
        vo_qty: 25.5,
        revised_rate: 1450,
        user_note: 'تم التعديل بأمر تغيير رقم 2',
      });
      const extracted = extractCostControlFromNotes(notes);
      expect(extracted.vo_qty).toBe(25.5);
      expect(extracted.revised_rate).toBe(1450);
      expect(extracted.user_note).toBe('تم التعديل بأمر تغيير رقم 2');
    });

    it('packs overrides into JSON preserving user notes', () => {
      const packed = packCostControlIntoNotes('ملاحظات مهندس الموقع', {
        vo_qty: 15,
        revised_rate: 2200,
        user_note: 'ملاحظات مهندس الموقع المحدثة',
      });
      expect(packed).toContain('"vo_qty":15');
      expect(packed).toContain('"revised_rate":2200');
      expect(packed).toContain('ملاحظات مهندس الموقع المحدثة');

      const parsed = extractCostControlFromNotes(packed);
      expect(parsed.vo_qty).toBe(15);
      expect(parsed.revised_rate).toBe(2200);
      expect(parsed.user_note).toBe('ملاحظات مهندس الموقع المحدثة');
    });

    it('returns plain text when no overrides are given', () => {
      const packed = packCostControlIntoNotes(null, {
        user_note: 'ملاحظة نصية بسيطة',
      });
      expect(packed).toBe('ملاحظة نصية بسيطة');
    });
  });

  describe('computeItemCostControlMetrics', () => {
    it('computes metrics for a standard original contract item with no VO', () => {
      const item: BoqItem = {
        id: 'item-1',
        project_id: 'p-1',
        item_code: '1.1',
        description_ar: 'خرسانة مسلحة للقواعد',
        unit: 'm3',
        contract_qty: 100,
        rate_egp: 5000,
        amount_egp: 500000,
        foreign_currency: 'EGP',
        pricing_status: 'contract_original',
        revision: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const metrics = computeItemCostControlMetrics(item);
      expect(metrics.original_qty).toBe(100);
      expect(metrics.original_rate).toBe(5000);
      expect(metrics.original_amount).toBe(500000);
      expect(metrics.vo_qty).toBe(0);
      expect(metrics.vo_amount).toBe(0);
      expect(metrics.revised_qty).toBe(100);
      expect(metrics.revised_rate).toBe(5000);
      expect(metrics.revised_amount).toBe(500000);
      expect(metrics.variance_amount).toBe(0);
      expect(metrics.variance_pct).toBe(0);
      expect(metrics.has_vo_impact).toBe(false);
    });

    it('computes metrics for an item with VO addition (+VO quantity)', () => {
      const item: BoqItem = {
        id: 'item-2',
        project_id: 'p-1',
        item_code: '2.1',
        description_ar: 'أعمال حفر وردم',
        unit: 'm3',
        contract_qty: 500,
        rate_egp: 200,
        amount_egp: 100000,
        foreign_currency: 'EGP',
        pricing_status: 'contract_original',
        vo_qty: 150,
        vo_ref: 'VO-01',
        revision: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const metrics = computeItemCostControlMetrics(item);
      expect(metrics.original_qty).toBe(500);
      expect(metrics.original_amount).toBe(100000);
      expect(metrics.vo_qty).toBe(150);
      expect(metrics.vo_amount).toBe(30000); // 150 * 200
      expect(metrics.revised_qty).toBe(650);
      expect(metrics.revised_amount).toBe(130000); // 650 * 200
      expect(metrics.variance_amount).toBe(30000);
      expect(metrics.variance_pct).toBe(30); // 30% increase
      expect(metrics.has_vo_impact).toBe(true);
      expect(metrics.vo_ref).toBe('VO-01');
    });

    it('computes metrics for an item with deduction (-VO quantity)', () => {
      const item: BoqItem = {
        id: 'item-3',
        project_id: 'p-1',
        item_code: '3.1',
        description_ar: 'عزل مائي للأسطح',
        unit: 'm2',
        contract_qty: 1000,
        rate_egp: 150,
        amount_egp: 150000,
        foreign_currency: 'EGP',
        pricing_status: 'contract_original',
        vo_qty: -200,
        vo_ref: 'VO-DEDUCT-01',
        revision: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const metrics = computeItemCostControlMetrics(item);
      expect(metrics.original_qty).toBe(1000);
      expect(metrics.vo_qty).toBe(-200);
      expect(metrics.vo_amount).toBe(-30000);
      expect(metrics.revised_qty).toBe(800);
      expect(metrics.revised_amount).toBe(120000);
      expect(metrics.variance_amount).toBe(-30000);
      expect(metrics.variance_pct).toBe(-20); // -20% deduction
      expect(metrics.has_vo_impact).toBe(true);
    });

    it('computes metrics for an item with both VO quantity and revised rate', () => {
      const item: BoqItem = {
        id: 'item-4',
        project_id: 'p-1',
        item_code: '4.1',
        description_ar: 'توريد وتركيب كابلات نحاس',
        unit: 'm',
        contract_qty: 200,
        rate_egp: 1000,
        amount_egp: 200000,
        foreign_currency: 'EGP',
        pricing_status: 'contract_original',
        vo_qty: 50,
        revised_rate_egp: 1200,
        vo_ref: 'VO-ELECT-02',
        revision: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const metrics = computeItemCostControlMetrics(item);
      expect(metrics.original_qty).toBe(200);
      expect(metrics.original_rate).toBe(1000);
      expect(metrics.original_amount).toBe(200000);
      expect(metrics.vo_qty).toBe(50);
      expect(metrics.revised_rate).toBe(1200);
      expect(metrics.revised_qty).toBe(250);
      expect(metrics.revised_amount).toBe(300000); // 250 * 1200
      expect(metrics.variance_amount).toBe(100000);
      expect(metrics.variance_pct).toBe(50);
      expect(metrics.has_vo_impact).toBe(true);
    });

    it('computes metrics for a newly introduced VO approved item (Case B)', () => {
      const item: BoqItem = {
        id: 'item-vo-new',
        project_id: 'p-1',
        item_code: 'VO-NEW-01',
        description_ar: 'بند إضافي جديد مستحدث',
        unit: 'LS',
        contract_qty: 1,
        rate_egp: 75000,
        amount_egp: 75000,
        foreign_currency: 'EGP',
        pricing_status: 'vo_approved',
        vo_ref: 'VO-03',
        revision: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const metrics = computeItemCostControlMetrics(item);
      expect(metrics.original_qty).toBe(0);
      expect(metrics.original_amount).toBe(0);
      expect(metrics.vo_qty).toBe(1);
      expect(metrics.revised_qty).toBe(1);
      expect(metrics.revised_amount).toBe(75000);
      expect(metrics.has_vo_impact).toBe(true);
    });
  });

  describe('reconcileProjectBoqWithContract', () => {
    const mockProject: Project = {
      id: 'proj-101',
      project_name: 'مشروع أبراج النرجس',
      project_code: 'NRG-01',
      contract_value: 1000000,
      vos_value: 200000,
      total_contract_value: 1200000, // 1M + 200k
      estimated_budget: 1000000,
      estimated_cost: 900000,
      water_area_m2: 0,
      water_vol_m3: 0,
      completion_pct: 50,
      status: 'working',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    it('reports exact match when BOQ total matches revised contract value', () => {
      const boqItems: BoqItem[] = [
        {
          id: 'i1',
          project_id: 'proj-101',
          item_code: '1',
          description_ar: 'بند أ',
          unit: 'LS',
          contract_qty: 1,
          rate_egp: 1000000,
          amount_egp: 1000000,
          foreign_currency: 'EGP',
          vo_qty: 0,
          pricing_status: 'contract_original',
          revision: 1,
          created_at: '',
          updated_at: '',
        },
        {
          id: 'i2',
          project_id: 'proj-101',
          item_code: 'VO-1',
          description_ar: 'بند ب أمر تغيير',
          unit: 'LS',
          contract_qty: 1,
          rate_egp: 200000,
          amount_egp: 200000,
          foreign_currency: 'EGP',
          pricing_status: 'vo_approved',
          revision: 1,
          created_at: '',
          updated_at: '',
        },
      ];

      const report = reconcileProjectBoqWithContract(mockProject, boqItems);
      expect(report.contract_original_value).toBe(1000000);
      expect(report.vos_net_value).toBe(200000);
      expect(report.revised_contract_value).toBe(1200000);
      expect(report.boq_revised_total).toBe(1200000);
      expect(report.variance).toBe(0);
      expect(report.is_matched).toBe(true);
      expect(report.status).toBe('matched');
      expect(report.alert_message_ar).toContain('متطابقة بالكامل');
    });

    it('reports boq_exceeds when BOQ revised total is higher than revised contract', () => {
      const boqItems: BoqItem[] = [
        {
          id: 'i1',
          project_id: 'proj-101',
          item_code: '1',
          description_ar: 'بند أ',
          unit: 'LS',
          contract_qty: 1,
          rate_egp: 1300000,
          amount_egp: 1300000,
          foreign_currency: 'EGP',
          pricing_status: 'contract_original',
          revision: 1,
          created_at: '',
          updated_at: '',
        },
      ];

      const report = reconcileProjectBoqWithContract(mockProject, boqItems);
      expect(report.revised_contract_value).toBe(1200000);
      expect(report.boq_revised_total).toBe(1300000);
      expect(report.variance).toBe(100000);
      expect(report.is_matched).toBe(false);
      expect(report.status).toBe('boq_exceeds');
      expect(report.alert_message_ar).toContain('يتجاوز القيمة التعاقدية المعتمدة');
    });

    it('reports boq_deficient when BOQ revised total is lower than revised contract', () => {
      const boqItems: BoqItem[] = [
        {
          id: 'i1',
          project_id: 'proj-101',
          item_code: '1',
          description_ar: 'بند أ',
          unit: 'LS',
          contract_qty: 1,
          rate_egp: 950000,
          amount_egp: 950000,
          foreign_currency: 'EGP',
          pricing_status: 'contract_original',
          revision: 1,
          created_at: '',
          updated_at: '',
        },
      ];

      const report = reconcileProjectBoqWithContract(mockProject, boqItems);
      expect(report.revised_contract_value).toBe(1200000);
      expect(report.boq_revised_total).toBe(950000);
      expect(report.variance).toBe(-250000);
      expect(report.is_matched).toBe(false);
      expect(report.status).toBe('boq_deficient');
      expect(report.alert_message_ar).toContain('يقل عن القيمة التعاقدية المعتمدة');
    });

    it('excludes omitted items from active contractual reconciliation sum', () => {
      const boqItems: BoqItem[] = [
        {
          id: 'i1',
          project_id: 'proj-101',
          item_code: '1',
          description_ar: 'بند نشط',
          unit: 'LS',
          contract_qty: 1,
          rate_egp: 1200000,
          amount_egp: 1200000,
          foreign_currency: 'EGP',
          pricing_status: 'contract_original',
          inclusion_status: 'base',
          revision: 1,
          created_at: '',
          updated_at: '',
        },
        {
          id: 'i2',
          project_id: 'proj-101',
          item_code: '2',
          description_ar: 'بند ملغي محذوف (Omitted)',
          unit: 'LS',
          contract_qty: 1,
          rate_egp: 500000,
          amount_egp: 500000,
          foreign_currency: 'EGP',
          pricing_status: 'contract_original',
          inclusion_status: 'omitted',
          revision: 1,
          created_at: '',
          updated_at: '',
        },
      ];

      const report = reconcileProjectBoqWithContract(mockProject, boqItems);
      // The 500k omitted item must not be included
      expect(report.boq_revised_total).toBe(1200000);
      expect(report.is_matched).toBe(true);
      expect(report.status).toBe('matched');
      expect(report.items_count).toBe(1);
    });

    it('handles null project gracefully', () => {
      const report = reconcileProjectBoqWithContract(null, []);
      expect(report.is_matched).toBe(true);
      expect(report.status).toBe('matched');
      expect(report.variance).toBe(0);
    });
  });
});
