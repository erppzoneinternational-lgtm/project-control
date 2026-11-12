import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase module
vi.mock('@/lib/supabase', () => {
  return {
    supabase: {
      from: vi.fn(),
      rpc: vi.fn(),
      storage: {
        from: vi.fn(() => ({
          upload: vi.fn(),
          getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://storage/progress-photos/test.jpg' } })),
        })),
      },
    },
  };
});

import {
  DISCIPLINE_LABELS,
  SITE_TASK_STATUS_LABELS,
  formatSiteTaskOption,
} from '../planning/DailyProgressForm';
import { STATUS_CONFIG, LINE_STATUS_CONFIG, INSPECTION_STATUS_CONFIG } from '../planning/DailyLogTable';
import { OBSTRUCTION_TYPE_CONFIG } from '../planning/DailyObstructionModal';
import { MOS_STATUS_CONFIG } from '../planning/MosRegisterTable';
import { TX_TYPE_CONFIG } from '../planning/MaterialTransactionTable';
import { useDailyDraftStore } from '@/lib/stores/useDailyDraftStore';
import { calculateWastageLossEgp, calculateEotObstructionSummary } from '@/lib/planning/calculations';
import { DailyProgressService } from '@/lib/services/dailyProgress.service';
import { supabase } from '@/lib/supabase';

describe('Milestones P2-M2 & P2-M3 (Live Mobile Daily Progress, Line Review, Obstructions, MOS & Material UI)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useDailyDraftStore.getState().clearDraft();
  });

  describe('1. Daily Progress Form & Discipline Configuration', () => {
    it('covers all 6 daily disciplines with Arabic labels and styles', () => {
      const disciplines = ['civil', 'finishing', 'mep', 'landscape', 'water_features', 'other'] as const;
      disciplines.forEach((d) => {
        expect(DISCIPLINE_LABELS).toHaveProperty(d);
        expect(DISCIPLINE_LABELS[d].labelAr).toBeDefined();
        expect(DISCIPLINE_LABELS[d].color).toBeDefined();
      });

      expect(DISCIPLINE_LABELS.civil.labelAr).toContain('مدنية');
      expect(DISCIPLINE_LABELS.finishing.labelAr).toContain('تشطيبات');
      expect(DISCIPLINE_LABELS.mep.labelAr).toContain('كهروميكانيكية');
      expect(DISCIPLINE_LABELS.water_features.labelAr).toContain('حمامات');
    });

    it('persists and restores offline draft state via useDailyDraftStore', () => {
      const store = useDailyDraftStore.getState();

      store.updateHeader({
        project_id: 'proj-123',
        progress_date: '2026-08-23',
        discipline: 'civil',
        weather: 'مشمس وصافي',
        manpower_count: 45,
      });

      store.addLine({
        boq_item_id: 'boq-001',
        qty_today: 120.5,
        zone: 'Zone A',
        is_material_on_site: false,
        inspection_status: 'approved',
        wir_no: 'WIR-CV-001',
      });

      const updated = useDailyDraftStore.getState();
      expect(updated.header.project_id).toBe('proj-123');
      expect(updated.header.manpower_count).toBe(45);
      expect(updated.lines.length).toBe(1);
      expect(updated.lines[0].qty_today).toBe(120.5);
      expect(updated.idempotencyKey).toBeDefined();

      // Test clear
      store.clearDraft();
      const cleared = useDailyDraftStore.getState();
      expect(cleared.lines.length).toBe(0);
      expect(cleared.header.project_id).toBeUndefined();
    });

    it('generates unique idempotency keys for concurrent offline sessions', () => {
      const key1 = useDailyDraftStore.getState().generateIdempotencyKey();
      const key2 = useDailyDraftStore.getState().generateIdempotencyKey();
      expect(key1).not.toBe(key2);
      expect(key1.length).toBeGreaterThan(10);
    });
  });

  describe('2. Status Configurations & WIR Inspection Badges', () => {
    it('defines status badges for all daily report statuses', () => {
      const statuses = ['draft', 'submitted', 'partially_approved', 'approved', 'rejected', 'reopened'] as const;
      statuses.forEach((st) => {
        expect(STATUS_CONFIG).toHaveProperty(st);
        expect(STATUS_CONFIG[st].labelAr).toBeDefined();
        expect(STATUS_CONFIG[st].color).toBeDefined();
        expect(STATUS_CONFIG[st].icon).toBeDefined();
      });

      expect(STATUS_CONFIG.draft.labelAr).toBe('مسودة');
      expect(STATUS_CONFIG.submitted.labelAr).toBe('قيد المراجعة');
      expect(STATUS_CONFIG.approved.labelAr).toBe('معتمد بالكامل');
      expect(STATUS_CONFIG.reopened.labelAr).toBe('معاد فتحه');
    });

    it('defines line approval statuses and WIR inspection statuses', () => {
      expect(LINE_STATUS_CONFIG).toHaveProperty('pending');
      expect(LINE_STATUS_CONFIG).toHaveProperty('approved');
      expect(LINE_STATUS_CONFIG).toHaveProperty('rejected');

      const wirStatuses = ['not_required', 'submitted', 'lab_pending', 'approved', 'rejected'] as const;
      wirStatuses.forEach((ws) => {
        expect(INSPECTION_STATUS_CONFIG).toHaveProperty(ws);
        expect(INSPECTION_STATUS_CONFIG[ws].labelAr).toBeDefined();
      });

      expect(INSPECTION_STATUS_CONFIG.approved.labelAr).toContain('معتمد');
      expect(INSPECTION_STATUS_CONFIG.rejected.labelAr).toContain('مرفوض');
    });
  });

  describe('3. Daily Obstructions (EOT) & FIDIC Delay Categorization', () => {
    it('covers all 8 standard obstruction types with clear descriptions', () => {
      const types = [
        'drawing_delay',
        'material_approval',
        'site_access',
        'client_works',
        'weather',
        'equipment_idle',
        'labor_shortage',
        'other',
      ] as const;

      types.forEach((t) => {
        expect(OBSTRUCTION_TYPE_CONFIG).toHaveProperty(t);
        expect(OBSTRUCTION_TYPE_CONFIG[t].labelAr).toBeDefined();
        expect(OBSTRUCTION_TYPE_CONFIG[t].description).toBeDefined();
      });

      expect(OBSTRUCTION_TYPE_CONFIG.drawing_delay.labelAr).toContain('Shop Drawings');
      expect(OBSTRUCTION_TYPE_CONFIG.site_access.labelAr).toContain('دخول الموقع');
    });

    it('accurately aggregates EOT obstruction delays and idle manpower by responsible party', () => {
      const mockObstructions: any[] = [
        {
          id: 'obs-1',
          obstruction_type: 'drawing_delay',
          responsible_party: 'Consultant',
          description: 'Delayed drawing revision 3',
          idle_manpower: 12,
        },
        {
          id: 'obs-2',
          obstruction_type: 'material_approval',
          responsible_party: 'Consultant',
          description: 'Approval pending for HDPE membrane',
          idle_manpower: 8,
        },
        {
          id: 'obs-3',
          obstruction_type: 'client_works',
          responsible_party: 'Client',
          description: 'Interference with client MEP contractor',
          idle_manpower: 15,
        },
      ];

      const summary = calculateEotObstructionSummary(mockObstructions);
      expect(summary.totalObstructions).toBe(3);
      expect(summary.totalIdleManpower).toBe(35);

      const consultantEntry = summary.byResponsibleParty.find((p) => p.responsible_party === 'Consultant');
      expect(consultantEntry).toBeDefined();
      expect(consultantEntry?.count).toBe(2);
      expect(consultantEntry?.total_idle_manpower).toBe(20);
    });
  });

  describe('4. Materials on Site (MOS) Status Transitions', () => {
    it('defines sequential status progression on_site -> partially_installed -> installed', () => {
      expect(MOS_STATUS_CONFIG.on_site.nextStatus).toBe('partially_installed');
      expect(MOS_STATUS_CONFIG.partially_installed.nextStatus).toBe('installed');
      expect(MOS_STATUS_CONFIG.installed.nextStatus).toBe('on_site');

      expect(MOS_STATUS_CONFIG.on_site.labelAr).toContain('مشون');
      expect(MOS_STATUS_CONFIG.partially_installed.labelAr).toContain('جزئي');
      expect(MOS_STATUS_CONFIG.installed.labelAr).toContain('بالكامل');
    });
  });

  describe('5. Material Transactions & Wastage Variance Calculation', () => {
    it('covers all 5 warehouse transaction types', () => {
      const txTypes = ['issue_to_site', 'return_to_store', 'adjustment', 'waste_writeoff', 'received_on_site'] as const;
      txTypes.forEach((tx) => {
        expect(TX_TYPE_CONFIG).toHaveProperty(tx);
        expect(TX_TYPE_CONFIG[tx].labelAr).toBeDefined();
        expect(TX_TYPE_CONFIG[tx].icon).toBeDefined();
      });

      expect(TX_TYPE_CONFIG.issue_to_site.labelAr).toContain('صرف');
      expect(TX_TYPE_CONFIG.return_to_store.labelAr).toContain('مرتجع');
      expect(TX_TYPE_CONFIG.waste_writeoff.labelAr).toContain('هالك');
    });

    it('calculates financial loss and variance percentage when actual wastage exceeds standard', () => {
      // 54,000 issued, 48,000 installed, standard wastage 8%, unit price 150 EGP
      const issuedQty = 54000;
      const installedNetQty = 48000;
      const standardWastagePct = 8.0;
      const unitPriceEgp = 150;

      const result = calculateWastageLossEgp(issuedQty, installedNetQty, standardWastagePct, unitPriceEgp);

      // Actual wastage = (54000 - 48000) / 48000 * 100 = 12.5%
      expect(result.actualWastagePct).toBe(12.5);
      // Variance = 12.5 - 8.0 = 4.5%
      expect(result.varianceWastagePct).toBe(4.5);
      expect(result.isLoss).toBe(true);
      // Loss = (4.5 / 100) * 48000 * 150 = 324,000 EGP
      expect(result.wastageLossEgp).toBe(324000);
    });

    it('returns 0 loss when actual wastage is below standard allowance', () => {
      const issuedQty = 50000;
      const installedNetQty = 48000;
      const standardWastagePct = 8.0;
      const unitPriceEgp = 150;

      // Actual wastage = (50000 - 48000) / 48000 * 100 = 4.17% < 8.0%
      const result = calculateWastageLossEgp(issuedQty, installedNetQty, standardWastagePct, unitPriceEgp);
      expect(result.actualWastagePct).toBe(4.17);
      expect(result.isLoss).toBe(false);
      expect(result.wastageLossEgp).toBe(0);
    });
  });

  describe('6. Approval Delegation & Permission Checks', () => {
    it('authorizes PM, admin, and executive roles unconditionally in canUserApprove', async () => {
      const roles = ['project_manager', 'admin', 'pm', 'executive'];
      for (const r of roles) {
        const can = await DailyProgressService.canUserApprove('p1', 'u1', r);
        expect(can).toBe(true);
      }
    });

    it('validates active delegation query for non-PM roles', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'del-1' }, error: null }),
      });

      const can = await DailyProgressService.canUserApprove('p1', 'u_delegate', 'site_engineer');
      expect(can).toBe(true);
    });
  });

  describe('7. Reopen Report & Allocation Suspension Integration', () => {
    it('suspends all progress allocations when report is reopened', async () => {
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'pm_daily_progress') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: 'rep-1', project_id: 'proj-1' }, error: null }),
          };
        }
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
      });

      (supabase.rpc as any) = vi.fn().mockResolvedValue({
        data: { success: true, report_id: 'rep-1', from_state: 'approved', to_state: 'reopened', action: 'reopen' },
        error: null,
      });

      const ok = await DailyProgressService.reopenDailyReport('rep-1', 'Auditor adjustment required', 'pm-001');
      expect(ok).toBe(true);
    });
  });

  describe('8. Mandatory Site-Task Linkage (owner rule ب)', () => {
    it('labels every open task status for the required dropdown', () => {
      const openStatuses = ['pending', 'in_progress', 'pm_review', 'qc_pending', 'rejected'] as const;
      openStatuses.forEach((s) => {
        expect(SITE_TASK_STATUS_LABELS[s]).toBeDefined();
      });
      expect(SITE_TASK_STATUS_LABELS.in_progress).toContain('قيد التنفيذ');
      expect(SITE_TASK_STATUS_LABELS.rejected).toContain('مرفوضة');
    });

    it('formats dropdown options as title — zone (status) and flags overdue tasks', () => {
      const past = new Date();
      past.setDate(past.getDate() - 3);
      const isoPast = past.toISOString().slice(0, 10);

      const overdueOption = formatSiteTaskOption({
        id: 't1',
        title_ar: 'صب اللبشة',
        task_type: 'execution',
        status: 'in_progress',
        priority: 'high',
        planned_date: isoPast,
        due_date: isoPast,
        progress_pct: 40,
        zone: { name_ar: 'المنطقة A' },
      });
      expect(overdueOption).toBe('[متأخرة] صب اللبشة — المنطقة A (قيد التنفيذ)');

      const freshOption = formatSiteTaskOption({
        id: 't2',
        title_ar: 'تشطيبات فيلا 5',
        task_type: null,
        status: 'pending',
        priority: null,
        planned_date: null,
        due_date: null,
        progress_pct: 0,
        zone: null,
      });
      expect(freshOption).toBe('تشطيبات فيلا 5 (لم تبدأ)');
    });

    it('blocks report creation without a linked site task (client guard mirrors RPC)', async () => {
      await expect(
        DailyProgressService.createDailyReport({ project_id: 'proj-1' })
      ).rejects.toThrow(/SITE_TASK_REQUIRED/);
    });
  });
});
