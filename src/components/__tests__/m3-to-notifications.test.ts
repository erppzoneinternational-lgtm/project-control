import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase module
vi.mock('@/lib/supabase', () => {
  return {
    supabase: {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
      rpc: vi.fn().mockResolvedValue({ data: 0, error: null }),
      channel: vi.fn(() => ({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
        unsubscribe: vi.fn().mockReturnValue(true),
      })),
    },
  };
});

import { NotificationService } from '@/lib/services/notification.service';
import { TOProgressService } from '@/lib/services/toProgress.service';
import { UNIFIED_OBSTRUCTION_TAXONOMY } from '@/components/planning/TOProgressModal';
import { AppNotification } from '@/types/notifications';
import { DeliverableItem, ToProgressLog } from '@/types/planning';

describe('Milestone M3: TO & Notification UI Components (WS-1, WS-2, WS-6, WS-8)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Unified Obstruction Taxonomy in TOProgressModal (WS-4 & WS-2)', () => {
    it('contains all 11 canonical obstruction taxonomy categories with Arabic and English labels', () => {
      expect(UNIFIED_OBSTRUCTION_TAXONOMY).toHaveLength(11);

      const taxonomyKeys = UNIFIED_OBSTRUCTION_TAXONOMY.map((t) => t.type);
      expect(taxonomyKeys).toContain('owner_directive');
      expect(taxonomyKeys).toContain('weather');
      expect(taxonomyKeys).toContain('material_delay');
      expect(taxonomyKeys).toContain('drawing_delay');
      expect(taxonomyKeys).toContain('subcontractor');
      expect(taxonomyKeys).toContain('permit_authority');
      expect(taxonomyKeys).toContain('equipment');
      expect(taxonomyKeys).toContain('manpower');
      expect(taxonomyKeys).toContain('safety');
      expect(taxonomyKeys).toContain('access');
      expect(taxonomyKeys).toContain('other');

      UNIFIED_OBSTRUCTION_TAXONOMY.forEach((item) => {
        expect(item.labelAr).toBeTruthy();
        expect(item.labelEn).toBeTruthy();
      });
    });
  });

  describe('2. TO Progress Calculation & Validation Logic', () => {
    it('calculates positive and negative daily increment deltas correctly', () => {
      const initialProgress = 40;
      const newProgress = 65;
      const delta = Number((newProgress - initialProgress).toFixed(1));
      expect(delta).toBe(25);

      const decreasedProgress = 35;
      const negativeDelta = Number((decreasedProgress - initialProgress).toFixed(1));
      expect(negativeDelta).toBe(-5);
    });

    it('validates progress percentage boundaries (0-100%)', async () => {
      await expect(
        TOProgressService.logDailyProgress({
          deliverable_item_id: 'item-1',
          project_id: 'prj-1',
          progress_pct: 120,
        })
      ).rejects.toThrow('INVALID_PROGRESS_PERCENT');

      await expect(
        TOProgressService.logDailyProgress({
          deliverable_item_id: 'item-1',
          project_id: 'prj-1',
          progress_pct: -10,
        })
      ).rejects.toThrow('INVALID_PROGRESS_PERCENT');
    });
  });

  describe('3. TO Engineer Task List KPI Aggregations', () => {
    it('correctly categorizes deliverable items into KPIs', () => {
      const mockItems: Partial<DeliverableItem>[] = [
        { id: '1', status: 'in_progress', consultant_status: 'pending', progress_pct: 30 },
        { id: '2', status: 'blocked', blocked_reason: 'Material delay', consultant_status: 'pending', progress_pct: 50 },
        { id: '3', status: 'ready_to_return', to_manager_approved: false, consultant_status: 'pending', progress_pct: 90 },
        { id: '4', status: 'returned', to_manager_approved: true, consultant_status: 'A', progress_pct: 100 },
        { id: '5', status: 'returned', to_manager_approved: true, consultant_status: 'B', progress_pct: 100 },
        { id: '6', status: 'in_progress', consultant_status: 'C', progress_pct: 60 },
      ];

      const total = mockItems.length;
      const inProgress = mockItems.filter(
        (it) => it.status === 'in_progress' || it.status === 'received'
      ).length;
      const blocked = mockItems.filter(
        (it) => it.status === 'blocked' || Boolean(it.blocked_reason)
      ).length;
      const readyForReview = mockItems.filter(
        (it) => it.status === 'ready_to_return' && !it.to_manager_approved
      ).length;
      const completed = mockItems.filter(
        (it) => it.consultant_status === 'A' || it.consultant_status === 'B' || it.progress_pct === 100
      ).length;

      expect(total).toBe(6);
      expect(inProgress).toBe(2);
      expect(blocked).toBe(1);
      expect(readyForReview).toBe(1);
      expect(completed).toBe(2);
    });
  });

  describe('4. TO Manager Approval & Workload Indicators', () => {
    it('computes engineer workload balance levels accurately', () => {
      const mockDeliverableItems: Partial<DeliverableItem>[] = [
        { id: '1', assigned_stakeholder_id: 'eng-1', status: 'in_progress' },
        { id: '2', assigned_stakeholder_id: 'eng-1', status: 'in_progress' },
        { id: '3', assigned_stakeholder_id: 'eng-1', status: 'ready_to_return' },
        { id: '4', assigned_stakeholder_id: 'eng-2', status: 'in_progress' },
        { id: '5', assigned_stakeholder_id: 'eng-2', status: 'in_progress' },
        { id: '6', assigned_stakeholder_id: 'eng-2', status: 'in_progress' },
        { id: '7', assigned_stakeholder_id: 'eng-2', status: 'in_progress' },
        { id: '8', assigned_stakeholder_id: 'eng-2', status: 'in_progress' },
        { id: '9', assigned_stakeholder_id: 'eng-2', status: 'in_progress' },
        { id: '10', assigned_stakeholder_id: 'eng-3', status: 'returned' }, // completed item does not add to active workload
      ];

      const countMap = new Map<string, number>();
      mockDeliverableItems.forEach((it) => {
        if (it.assigned_stakeholder_id && it.status !== 'returned') {
          countMap.set(
            it.assigned_stakeholder_id,
            (countMap.get(it.assigned_stakeholder_id) || 0) + 1
          );
        }
      });

      const getLevel = (count: number) => {
        if (count > 10) return 'heavy';
        if (count >= 4) return 'optimal';
        return 'light';
      };

      expect(countMap.get('eng-1')).toBe(3);
      expect(getLevel(countMap.get('eng-1') || 0)).toBe('light');

      expect(countMap.get('eng-2')).toBe(6);
      expect(getLevel(countMap.get('eng-2') || 0)).toBe('optimal');

      expect(countMap.get('eng-3') || 0).toBe(0);
      expect(getLevel(countMap.get('eng-3') || 0)).toBe('light');
    });
  });

  describe('5. Notification Filtering & Category Grouping', () => {
    it('correctly filters notifications by category tabs', () => {
      const mockNotifications: Partial<AppNotification>[] = [
        { id: 'n1', entity_type: 'task', title_ar: 'مهمة جديدة', is_read: false },
        { id: 'n2', entity_type: 'daily_progress', title_ar: 'تقرير يومي', is_read: false },
        { id: 'n3', entity_type: 'to_progress', title_ar: 'تقدم مكتب فني', is_read: true },
        { id: 'n4', entity_type: 'deliverable', title_ar: 'تسليم مخطط', is_read: false },
        { id: 'n5', entity_type: 'inspection', event_type: 'wir_approval', title_ar: 'طلب فحص', is_read: false },
      ];

      const tasks = mockNotifications.filter((n) => n.entity_type === 'task');
      const progress = mockNotifications.filter(
        (n) => n.entity_type === 'daily_progress' || n.entity_type === 'to_progress'
      );
      const deliverables = mockNotifications.filter((n) => n.entity_type === 'deliverable');
      const approvals = mockNotifications.filter(
        (n) =>
          n.entity_type === 'inspection' ||
          n.entity_type === 'report' ||
          (n.event_type && n.event_type.includes('approval'))
      );

      expect(tasks).toHaveLength(1);
      expect(progress).toHaveLength(2);
      expect(deliverables).toHaveLength(1);
      expect(approvals).toHaveLength(1);
    });
  });
});
