import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Deliverable, DeliverableItem } from '@/types/planning';
import { Project } from '@/types';
import { NotificationService } from '@/lib/services/notification.service';
import {
  parseGranularBlockers,
  calculateBottleneckCounts,
  buildEngineerRoster,
  BottleneckParty,
} from '../COOExecutiveRadar';

vi.mock('@/lib/services/notification.service', () => ({
  NotificationService: {
    createNotification: vi.fn().mockResolvedValue({ id: 'mock-notif-1' }),
  },
}));

describe('COOExecutiveRadar Logic & Accountability Tests (REQ-COO-01, 02, 03, 04)', () => {
  const mockProjects: Project[] = [
    {
      id: 'proj-1',
      project_name: 'مشروع مجمع حمامات سباحة ونوافير أولمبية',
      project_name_ar: 'مشروع مجمع حمامات سباحة ونوافير أولمبية',
      project_code: 'AQUA-01',
    } as Project,
  ];

  const mockItems: (DeliverableItem & { parentPackage?: Deliverable; projectName: string })[] = [
    {
      id: 'item-1',
      deliverable_id: 'deliv-1',
      sheet_number: 'S-101',
      description: 'شوب دروينج حديد تسليح جدران حوض الغطس',
      status: 'in_progress',
      progress_pct: 65,
      current_rev: 0,
      assigned_stakeholder_id: 'stk-1',
      projectName: 'مشروع مجمع حمامات سباحة ونوافير أولمبية',
      assigned_stakeholder: {
        id: 'stk-1',
        name_ar: 'م. أحمد علي',
        role: 'technical_office',
      },
    } as any,
    {
      id: 'item-2',
      deliverable_id: 'deliv-1',
      sheet_number: 'M-201',
      description: 'مخطط مخترقات جلب السحب Puddle Flanges بطلمبات الفلترة',
      status: 'blocked',
      progress_pct: 35,
      current_rev: 0,
      blocked_reason: '[يوقف الصب بالموقع - CRITICAL] [الجهة المسؤولة: consultant] [RFI #RFI-HYD-04] تعارض أقطار الجلب مع تسليح اللبشة',
      blocked_since: '2026-10-05T00:00:00Z',
      assigned_stakeholder_id: 'stk-2',
      projectName: 'مشروع مجمع حمامات سباحة ونوافير أولمبية',
      assigned_stakeholder: {
        id: 'stk-2',
        name_ar: 'م. محمود طارق',
        role: 'technical_office',
      },
    } as any,
    {
      id: 'item-3',
      deliverable_id: 'deliv-1',
      sheet_number: 'E-301',
      description: 'مخطط التأريض المتكافئ EBP وكشافات 12V المغمورة',
      status: 'ready_to_return',
      to_manager_approved: false,
      progress_pct: 100,
      current_rev: 0,
      assigned_stakeholder_id: 'stk-3',
      projectName: 'مشروع مجمع حمامات سباحة ونوافير أولمبية',
      assigned_stakeholder: {
        id: 'stk-3',
        name_ar: 'م. سارة كمال',
        role: 'technical_office',
      },
    } as any,
  ];

  const mockDeliverables: Deliverable[] = [
    {
      id: 'deliv-1',
      project_id: 'proj-1',
      ref_code: 'E1-PKG-01',
      title_ar: 'حزمة لوحات حوض الغطس',
      kind: 'E1',
      status: 'in_progress',
      items: mockItems,
    } as unknown as Deliverable,
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('REQ-COO-01: Live Engineer Roster (من يعمل على ماذا؟)', () => {
    it('aggregates assigned engineers, their active tasks, and progress percentages', () => {
      const roster = buildEngineerRoster(mockItems);
      expect(roster).toHaveLength(3);

      const engAhmed = roster.find((e) => e.name_ar === 'م. أحمد علي');
      expect(engAhmed).toBeDefined();
      expect(engAhmed?.activeItem?.sheet_number).toBe('S-101');
      expect(engAhmed?.avgProgress).toBe(65);

      const engMahmoud = roster.find((e) => e.name_ar === 'م. محمود طارق');
      expect(engMahmoud?.status).toBe('blocked');
      expect(engMahmoud?.blockedCount).toBe(1);
    });
  });

  describe('REQ-COO-02: Whose Court is the Ball In? (محرك المساءلة الصريح)', () => {
    it('correctly calculates counts across consultant, manager, and engineers', () => {
      const counts = calculateBottleneckCounts(mockDeliverables, 'all');

      expect(counts.all).toBe(3);
      expect(counts.consultant).toBe(1); // item-2 is blocked by consultant
      expect(counts.to_manager).toBe(1); // item-3 is ready_to_return awaiting manager signoff
      expect(counts.internal).toBe(1);   // item-1 is in_progress with engineer
    });
  });

  describe('REQ-COO-03: Granular Blocker Feed (تفاصيل العائق وأثره الميداني)', () => {
    it('parses critical site-stopping flags, responsible party, and RFI reference', () => {
      const blockers = parseGranularBlockers(mockItems);
      expect(blockers).toHaveLength(1);

      const b = blockers[0];
      expect(b.sheetNumber).toBe('M-201');
      expect(b.isSiteStopped).toBe(true);
      expect(b.bottleneckParty).toBe('consultant');
      expect(b.rfiNumber).toBe('RFI-HYD-04');
      expect(b.cleanReason).toContain('تعارض أقطار الجلب مع تسليح اللبشة');
      expect(b.daysBlocked).toBeGreaterThan(0);
    });
  });

  describe('REQ-COO-04: Notifications & Urgent Escalations', () => {
    it('allows dispatching urgent notification with exact blocker details', async () => {
      const blockers = parseGranularBlockers(mockItems);
      const blocker = blockers[0];

      await NotificationService.createNotification({
        project_id: 'proj-1',
        event_type: 'coo_urgent_escalation',
        entity_type: 'obstruction',
        entity_id: blocker.item.id,
        recipient_user_id: 'coo_urgent',
        title_ar: `🚨 تصعيد عاجل للـ COO: ${blocker.sheetNumber}`,
        title_en: `🚨 COO Urgent Escalation: ${blocker.sheetNumber}`,
        body_ar: `العائق يوقف الصب بالموقع: ${blocker.cleanReason}`,
      });

      expect(NotificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'coo_urgent_escalation',
          recipient_user_id: 'coo_urgent',
          title_ar: '🚨 تصعيد عاجل للـ COO: M-201',
        })
      );
    });

    it('isolates critical site-stopping blockers for executive action', () => {
      const blockers = parseGranularBlockers(mockItems);
      const siteStopping = blockers.filter((b) => b.isSiteStopped);
      expect(siteStopping).toHaveLength(1);
      expect(siteStopping[0].sheetNumber).toBe('M-201');
      expect(siteStopping[0].cleanReason).toContain('تعارض أقطار الجلب');
    });
  });
});
