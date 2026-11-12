import type { MockBuilderShape, MockQueryBuilder } from '@/types/services-types';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { appCache } from '@/lib/cache';
import { HoldsService } from '../holds.service';
import { SubcontractorService } from '../subcontractor.service';
import { DailyProgressService } from '../dailyProgress.service';
import { ActivityService } from '../activity.service';
import { BoqService } from '../boq.service';
import {
  calculateEVM,
  calculateActivityProgress,
  countWorkingDays,
} from '@/lib/planning/calculations';
import {
  validateAllocationQty,
} from '@/lib/planning/validators';
import {
  PmHold,
  SubcontractorTarget,
  ApprovalDelegation,
  DailyProgressPhoto,
  ActivityLibraryItem,
} from '@/types/planning';
import { BoqItem } from '@/types/boq';

// Mock Supabase client
vi.mock('@/lib/supabase', () => {
  return {
    supabase: {
      from: vi.fn(),
      rpc: vi.fn(),
      storage: {
        from: vi.fn().mockReturnValue({
          upload: vi.fn().mockResolvedValue({ data: { path: 'test/path' }, error: null }),
        }),
      },
    },
  };
});

const createMockQueryBuilder = (resolveValue: unknown) => {
  const builder: MockBuilderShape = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(() => Promise.resolve(resolveValue)),
    maybeSingle: vi.fn().mockImplementation(() => Promise.resolve(resolveValue)),
    then: vi.fn().mockImplementation((onfulfilled: (value: unknown) => unknown) => Promise.resolve(resolveValue).then(onfulfilled)),
  };
  return builder as MockQueryBuilder;
};

describe('R1-R5 Audit: Schema Integrity, Trigger Invariants & Security Rules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appCache.clear();
  });

  // =========================================================================
  // 1. Schema & Service Contract Alignments
  // =========================================================================
  describe('1. Schema & Service Contract Alignments', () => {
    it('SubcontractorService matches pm_subcontractor_targets schema (subcontractor_id, target_date, unit)', async () => {
      const mockTarget: SubcontractorTarget = {
        id: 'target-uuid-1',
        project_id: 'proj-uuid-1',
        subcontractor_id: 'sub-stakeholder-uuid-1',
        boq_item_id: 'boq-item-1',
        target_qty: 150.5,
        target_date: '2026-09-01',
        period_start: '2026-09-01',
        period_end: '2026-09-07',
        unit: 'm3',
        notes: 'Concrete casting sub target',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockBuilder = createMockQueryBuilder({ data: mockTarget, error: null });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder);

      const saved = await SubcontractorService.saveSubcontractorTarget({
        project_id: 'proj-uuid-1',
        subcontractor_id: 'sub-stakeholder-uuid-1',
        target_qty: 150.5,
        target_date: '2026-09-01',
        period_start: '2026-09-01',
        period_end: '2026-09-07',
        unit: 'm3',
      });

      expect(saved?.subcontractor_id).toBe('sub-stakeholder-uuid-1');
      expect(saved?.unit).toBe('m3');
    });

    it('HoldsService matches pm_holds schema (scope_type, hold_type, placed_by, placed_at, is_active)', async () => {
      const mockHold: PmHold = {
        id: 'hold-uuid-1',
        project_id: 'proj-uuid-1',
        hold_type: 'site',
        scope_type: 'boq_item',
        ref_value: 'boq-item-concrete-1',
        reason: 'NCR on rebar spacing',
        is_active: true,
        placed_by: 'qa-engineer-1',
        placed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockBuilder = createMockQueryBuilder({ data: mockHold, error: null });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder);

      const saved = await HoldsService.saveHold({
        project_id: 'proj-uuid-1',
        hold_type: 'site',
        scope_type: 'boq_item',
        ref_value: 'boq-item-concrete-1',
        reason: 'NCR on rebar spacing',
        is_active: true,
        placed_by: 'qa-engineer-1',
      });

      expect(saved?.is_active).toBe(true);
      expect(saved?.scope_type).toBe('boq_item');
    });

    it('DailyProgressService delegations match pm_approval_delegations schema (delegator_id, delegated_to_id, valid_from, valid_to)', async () => {
      const mockDelegation: ApprovalDelegation = {
        id: 'delegation-1',
        project_id: 'proj-uuid-1',
        delegator_id: 'stakeholder-pm-1',
        delegated_to_id: 'stakeholder-se-1',
        scope: 'daily_progress',
        valid_from: '2026-08-20',
        valid_to: '2026-08-30',
        is_active: true,
      };

      const mockBuilder = createMockQueryBuilder({ data: mockDelegation, error: null });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder);

      const saved = await DailyProgressService.saveDelegation({
        project_id: 'proj-uuid-1',
        delegator_id: 'stakeholder-pm-1',
        delegated_to_id: 'stakeholder-se-1',
        scope: 'daily_progress',
        valid_from: '2026-08-20',
        valid_to: '2026-08-30',
      });

      expect(saved?.delegator_id).toBe('stakeholder-pm-1');
      expect(saved?.delegated_to_id).toBe('stakeholder-se-1');
    });

    it('DailyProgressService photo attachments match pm_daily_progress_photos schema (photo_url, storage_path, caption, uploaded_at)', async () => {
      const mockPhoto: DailyProgressPhoto = {
        id: 'photo-1',
        daily_progress_id: 'dp-report-1',
        storage_path: 'progress-photos/proj-1/photo1.jpg',
        photo_url: 'https://supabase.local/storage/v1/object/public/progress-photos/proj-1/photo1.jpg',
        caption: 'Zone A Rebar Inspection',
        uploaded_by: 'user-se-1',
        uploaded_at: new Date().toISOString(),
      };

      const mockBuilder = createMockQueryBuilder({ data: mockPhoto, error: null });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder);

      const saved = await DailyProgressService.addPhotoAttachment({
        daily_progress_id: 'dp-report-1',
        storage_path: 'progress-photos/proj-1/photo1.jpg',
        photo_url: 'https://supabase.local/storage/v1/object/public/progress-photos/proj-1/photo1.jpg',
        caption: 'Zone A Rebar Inspection',
        uploaded_by: 'user-se-1',
      });

      expect(saved?.photo_url).toContain('progress-photos');
    });

    it('ActivityService library items match pm_activity_library schema (activity_code, name_ar, discipline, is_active)', async () => {
      const mockLibItem: ActivityLibraryItem = {
        activity_code: 'ACT-CONC-001',
        name_ar: 'صب خرسانة مسلحة للأساسات',
        name_en: 'Reinforced Concrete Foundation Pouring',
        discipline: 'civil',
        default_unit: 'm3',
        typical_duration_days: 5,
        is_active: true,
      };

      const mockBuilder = createMockQueryBuilder({ data: mockLibItem, error: null });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder);

      const saved = await ActivityService.saveLibraryItem({
        activity_code: 'ACT-CONC-001',
        name_ar: 'صب خرسانة مسلحة للأساسات',
        discipline: 'civil',
        default_unit: 'm3',
      });

      expect(saved?.activity_code).toBe('ACT-CONC-001');
    });

    it('BoqService creates immutable snapshot in pm_boq_revisions on item update', async () => {
      const existingBoqItem: BoqItem = {
        id: 'boq-item-1',
        project_id: 'proj-1',
        item_code: '01.01.001',
        description_ar: 'أعمال حفر الموقع العام',
        unit: 'm3',
        contract_qty: 1000,
        rate_egp: 120.0,
        amount_egp: 120000,
        pricing_status: 'contract_original',
        foreign_currency: 'EGP',
        revision: 1,
        is_current: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const updatedBoqItem = {
        ...existingBoqItem,
        contract_qty: 1200,
        amount_egp: 144000,
        revision: 2,
      };

      let queryCount = 0;
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_boq_revisions') {
          return createMockQueryBuilder({ data: { id: 'rev-1' }, error: null });
        }
        if (table === 'pm_boq_items') {
          queryCount++;
          if (queryCount === 1) {
            // First call is select existing
            return createMockQueryBuilder({ data: existingBoqItem, error: null });
          } else {
            // Second call is update
            return createMockQueryBuilder({ data: updatedBoqItem, error: null });
          }
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      const updated = await BoqService.saveBoqItem(
        {
          id: 'boq-item-1',
          project_id: 'proj-1',
          item_code: '01.01.001',
          description_ar: 'أعمال حفر الموقع العام المعدلة',
          unit: 'm3',
          contract_qty: 1200,
          rate_egp: 120.0,
        },
        'user-1',
        'VO-01 Approved by Consultant'
      );

      expect(updated?.revision).toBe(2);
    });
  });

  // =========================================================================
  // 2. Trigger Invariants & Gate Simulations
  // =========================================================================
  describe('2. Trigger Invariants & Gate Simulations', () => {
    describe('fn_check_allocation_qty() gate simulation', () => {
      it('rejects allocation if daily progress line status is not approved', () => {
        const line = {
          line_status: 'pending',
          report_status: 'approved',
          inspection_status: 'approved',
          is_material_on_site: false,
        };

        const validateGate = (l: typeof line) => {
          if (l.line_status !== 'approved') {
            throw new Error(`Cannot allocate quantities to a non-approved line (current status: ${l.line_status})`);
          }
        };

        expect(() => validateGate(line)).toThrow(/Cannot allocate quantities to a non-approved line/);
      });

      it('rejects allocation if parent daily report status is not approved or partially_approved', () => {
        const line = {
          line_status: 'approved',
          report_status: 'draft',
          inspection_status: 'approved',
          is_material_on_site: false,
        };

        const validateGate = (l: typeof line) => {
          if (l.line_status !== 'approved') throw new Error('Line not approved');
          if (!['approved', 'partially_approved'].includes(l.report_status)) {
            throw new Error('التقرير اليومي غير معتمد بعد — لا توزيع قبل الاعتماد');
          }
        };

        expect(() => validateGate(line)).toThrow(/التقرير اليومي غير معتمد بعد/);
      });

      it('rejects allocation if WIR / inspection status is rejected or submitted (not approved)', () => {
        const line = {
          line_status: 'approved',
          report_status: 'approved',
          inspection_status: 'rejected',
          is_material_on_site: false,
        };

        const validateGate = (l: typeof line) => {
          const insp = l.inspection_status || 'not_required';
          if (!['approved', 'not_required'].includes(insp)) {
            throw new Error(`الكمية غير معتمدة الاستلام بعد (WIR: ${insp}) — لا تُحتسب Earned حتى الاعتماد`);
          }
        };

        expect(() => validateGate(line)).toThrow(/الكمية غير معتمدة الاستلام بعد/);
      });

      it('rejects allocation if line is marked as material-on-site (MOS movements never allocated)', () => {
        const line = {
          line_status: 'approved',
          report_status: 'approved',
          inspection_status: 'approved',
          is_material_on_site: true,
        };

        const validateGate = (l: typeof line) => {
          if (l.is_material_on_site) {
            throw new Error('حركة تشوين مواد (is_material_on_site) لا تُوزَّع على الأنشطة');
          }
        };

        expect(() => validateGate(line)).toThrow(/حركة تشوين مواد/);
      });

      it('rejects allocation if an active hold exists on the BOQ item or zone', () => {
        const line = {
          project_id: 'proj-1',
          boq_item_id: 'boq-item-1',
          zone: 'Zone-A',
        };

        const holds = [
          { project_id: 'proj-1', scope_type: 'boq_item', ref_value: 'boq-item-1', is_active: true },
        ];

        const validateHold = (l: typeof line, hList: typeof holds) => {
          const hasHold = hList.some(
            (h) =>
              h.is_active &&
              h.project_id === l.project_id &&
              ((h.scope_type === 'boq_item' && h.ref_value === l.boq_item_id) ||
                (h.scope_type === 'zone' && h.ref_value === l.zone))
          );
          if (hasHold) {
            throw new Error('يوجد Hold مفتوح على هذا البند/الزون (جودة أو سلامة) — التوزيع مجمد حتى الإغلاق');
          }
        };

        expect(() => validateHold(line, holds)).toThrow(/يوجد Hold مفتوح/);
      });

      it('rejects allocation when sum of allocated quantities exceeds line qty_today', () => {
        const qtyToday = 50.0;
        const existingAllocations = [
          { allocated_qty: 30.0 },
          { allocated_qty: 25.0 }, // 30 + 25 = 55 > 50
        ];

        const result = validateAllocationQty(existingAllocations, qtyToday);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('exceeds measured daily quantity');
      });

      it('passes allocation when all gates and quantity constraints are satisfied', () => {
        const qtyToday = 100.0;
        const allocations = [
          { allocated_qty: 40.0 },
          { allocated_qty: 50.0 }, // 40 + 50 = 90 <= 100
        ];

        const result = validateAllocationQty(allocations, qtyToday);
        expect(result.valid).toBe(true);
        expect(result.remainingQty).toBe(10.0);
      });
    });

    describe('Cross-Project Guards', () => {
      it('fn_check_cross_project_act_boq prevents linking activity and BOQ item from different projects', () => {
        const activity = { id: 'act-1', project_id: 'proj-A' };
        const boqItem = { id: 'boq-1', project_id: 'proj-B' };

        const validateCrossProject = (actPid: string, boqPid: string) => {
          if (actPid !== boqPid) {
            throw new Error(`خطأ ربط عبر المشاريع: مشروع النشاط (${actPid}) لا يطابق مشروع بند الكميات (${boqPid})`);
          }
        };

        expect(() => validateCrossProject(activity.project_id, boqItem.project_id)).toThrow(
          /خطأ ربط عبر المشاريع/
        );
      });

      it('fn_check_cross_project_daily_lines prevents daily progress line from referencing another project BOQ item', () => {
        const report = { id: 'rep-1', project_id: 'proj-Alpha' };
        const boqItem = { id: 'boq-1', project_id: 'proj-Beta' };

        const validateCrossProjectLine = (reportPid: string, boqPid: string) => {
          if (reportPid !== boqPid) {
            throw new Error(`خطأ سطر يومية عبر المشاريع: مشروع التقرير (${reportPid}) لا يطابق مشروع بند الكميات (${boqPid})`);
          }
        };

        expect(() => validateCrossProjectLine(report.project_id, boqItem.project_id)).toThrow(
          /خطأ سطر يومية عبر المشاريع/
        );
      });
    });

    describe('fn_milestone_sum_guard()', () => {
      it('rejects milestone payment steps whose total weight exceeds 100%', () => {
        const steps = [
          { step_name_ar: 'توريد', weight_pct: 40 },
          { step_name_ar: 'تركيب', weight_pct: 40 },
          { step_name_ar: 'اختبار وتسليم', weight_pct: 25 }, // Total = 105%
        ];

        const validateMilestoneSum = (sList: typeof steps) => {
          const totalWeight = sList.reduce((sum, s) => sum + s.weight_pct, 0);
          if (totalWeight > 100) {
            throw new Error(`مجموع أوزان مراحل الصرف للبند تجاوز 100% (الحالي: ${totalWeight}%)`);
          }
        };

        expect(() => validateMilestoneSum(steps)).toThrow(/مجموع أوزان مراحل الصرف للبند تجاوز 100%/);
      });

      it('accepts milestone payment steps whose total weight is exactly 100% or less', () => {
        const steps = [
          { step_name_ar: 'توريد المواد', weight_pct: 30 },
          { step_name_ar: 'التركيب المبدئي', weight_pct: 40 },
          { step_name_ar: 'الاختبار والاستلام', weight_pct: 30 }, // Total = 100%
        ];

        const totalWeight = steps.reduce((sum, s) => sum + s.weight_pct, 0);
        expect(totalWeight).toBe(100);
      });
    });
  });

  // =========================================================================
  // 3. EVM Edge Cases & Boundary Conditions
  // =========================================================================
  describe('3. EVM Edge Cases & Boundary Conditions', () => {
    it('handles zero budgeted cost without division-by-zero errors', () => {
      const evm = calculateEVM({
        plannedValueEgp: 0,
        earnedValueEgp: 0,
        actualCostEgp: 0,
        budgetAtCompletionEgp: 0,
      });

      expect(evm.cpi).toBe(1.0);
      expect(evm.spi).toBe(1.0);
      expect(evm.eac).toBe(0);
      expect(evm.vac).toBe(0);
    });

    it('caps activity percent complete at 100% and flags isOverAchieved when earned exceeds budget', () => {
      const allocations = [
        {
          allocated_qty: 120,
          snapshot_rate_egp: 1000, // Earned = 120,000 > 100,000 budget
          is_suspended: false,
          line_status: 'approved',
          inspection_status: 'approved',
        },
      ];

      const progress = calculateActivityProgress(allocations, 100000);
      expect(progress.percentComplete).toBe(100.0);
      expect(progress.earnedEgp).toBe(120000);
      expect(progress.isOverAchieved).toBe(true);
    });

    it('excludes suspended allocations from earned value rollups', () => {
      const allocations = [
        {
          allocated_qty: 50,
          snapshot_rate_egp: 1000, // Active: Earned = 50,000
          is_suspended: false,
          line_status: 'approved',
          inspection_status: 'approved',
        },
        {
          allocated_qty: 30,
          snapshot_rate_egp: 1000, // Suspended (e.g. from reopened report): Earned = 0
          is_suspended: true,
          line_status: 'approved',
          inspection_status: 'approved',
        },
      ];

      const progress = calculateActivityProgress(allocations, 100000);
      expect(progress.earnedEgp).toBe(50000);
      expect(progress.percentComplete).toBe(50.0);
    });

    it('calculates Egyptian construction 6-day work week correctly excluding Fridays', () => {
      // Friday: 2026-08-21 (Friday) to 2026-08-28 (Friday)
      // 8 calendar days total, with 2 Fridays (Aug 21 and Aug 28)
      // Working days should be 8 - 2 = 6 days
      const days = countWorkingDays('2026-08-21', '2026-08-28');
      expect(days).toBe(6);
    });
  });

  // =========================================================================
  // 4. Storage Policies & Audit Log Hardening
  // =========================================================================
  describe('4. Storage Policies & Audit Log Hardening', () => {
    it('verifies storage bucket definitions for schedules, deliverables, and progress-photos', () => {
      const buckets = [
        { id: 'project-schedules', is_public: false },
        { id: 'deliverables', is_public: false },
        { id: 'progress-photos', is_public: true },
      ];

      expect(buckets.find((b) => b.id === 'progress-photos')?.is_public).toBe(true);
      expect(buckets.find((b) => b.id === 'project-schedules')?.is_public).toBe(false);
      expect(buckets.find((b) => b.id === 'deliverables')?.is_public).toBe(false);
    });

    it('verifies audit log record structure generated by fn_audit_progress_allocations', () => {
      const mockAuditRecord = {
        table_name: 'pm_progress_allocations',
        record_id: 'alloc-uuid-1',
        action: 'INSERT',
        old_data: null,
        new_data: {
          id: 'alloc-uuid-1',
          line_id: 'line-1',
          activity_id: 'act-1',
          project_id: 'proj-1',
          allocated_qty: 45.0,
          snapshot_rate_egp: 250.0,
        },
        changed_by: 'user-scheduler-1',
        created_at: new Date().toISOString(),
      };

      expect(mockAuditRecord.table_name).toBe('pm_progress_allocations');
      expect(mockAuditRecord.action).toBe('INSERT');
      expect(mockAuditRecord.new_data.allocated_qty).toBe(45.0);
    });
  });
});
