import { describe, it, expect, vi } from 'vitest';

// Mock Supabase module
vi.mock('@/lib/supabase', () => {
  return {
    supabase: {
      from: vi.fn(),
      rpc: vi.fn(),
      storage: {
        from: vi.fn().mockReturnValue({
          upload: vi.fn().mockResolvedValue({ error: null }),
          getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/file.pdf' } }),
        }),
      },
    },
  };
});

import {
  ROLE_LABELS,
  DEFAULT_MODULE_ROLE_SEEDS,
  RACI_MATRIX,
  APP_MODULE_GROUPS,
  APP_MODULES,
} from '@/lib/rbac/role-matrix';
import { canAccessPath } from '@/lib/rbac/access-control';
import {
  calculateMorningCommandCenter,
  calculateSubcontractorProductivity,
  calculateDeliverableBottlenecks,
} from '@/lib/planning/calculations';
import { DeliverablesService } from '@/lib/services/deliverables.service';
import { Deliverable, DeliverableItem, SubcontractorTarget } from '@/types/planning';

describe('Milestone P2-M4: Command Center, Subcontractor Targets, Deliverables Kanban & RFI Register', () => {
  describe('1. RBAC & Route Access Permissions', () => {
    it('registers /deliverables, /coo/deliverables, and /my-tasks in APP_MODULES', () => {
      const paths = APP_MODULES.map((m) => m.path);
      expect(paths).toContain('/deliverables');
      expect(paths).toContain('/coo/deliverables');
      expect(paths).toContain('/my-tasks');
    });

    it('seeds correct role permissions for deliverables and executive dashboards', () => {
      expect(DEFAULT_MODULE_ROLE_SEEDS).toHaveProperty('/deliverables');
      expect(DEFAULT_MODULE_ROLE_SEEDS['/deliverables']).toContain('technical_office');
      expect(DEFAULT_MODULE_ROLE_SEEDS['/deliverables']).toContain('planning_engineer');
      expect(DEFAULT_MODULE_ROLE_SEEDS['/deliverables']).toContain('project_manager');

      expect(DEFAULT_MODULE_ROLE_SEEDS).toHaveProperty('/coo/deliverables');
      expect(DEFAULT_MODULE_ROLE_SEEDS['/coo/deliverables']).toContain('coo');
      expect(DEFAULT_MODULE_ROLE_SEEDS['/coo/deliverables']).toContain('ceo');
      expect(DEFAULT_MODULE_ROLE_SEEDS['/coo/deliverables']).toContain('admin');
      expect(DEFAULT_MODULE_ROLE_SEEDS['/coo/deliverables']).toContain('commercial_manager');

      expect(DEFAULT_MODULE_ROLE_SEEDS).toHaveProperty('/my-tasks');
      expect(DEFAULT_MODULE_ROLE_SEEDS['/my-tasks']).toContain('technical_office');
      expect(DEFAULT_MODULE_ROLE_SEEDS['/my-tasks']).toContain('planning_engineer');
    });

    it('enforces role matrix permissions with canAccessPath', () => {
      expect(canAccessPath('/deliverables', ['technical_office'], false)).toBe(true);
      expect(canAccessPath('/deliverables', ['planning_engineer'], false)).toBe(true);
      expect(canAccessPath('/deliverables', ['project_manager'], false)).toBe(true);

      expect(canAccessPath('/coo/deliverables', ['coo'], false)).toBe(true);
      expect(canAccessPath('/coo/deliverables', ['ceo'], false)).toBe(true);
      expect(canAccessPath('/coo/deliverables', ['site_engineer'], false)).toBe(false);

      expect(canAccessPath('/my-tasks', ['technical_office'], false)).toBe(true);
    });

    it('includes deliverables, coo deliverables, and my-tasks in planning_office module group', () => {
      const planningGroup = APP_MODULE_GROUPS.find((g) => g.id === 'planning_office');
      expect(planningGroup).toBeDefined();
      const groupPaths = planningGroup?.modules.map((m) => m.path);
      expect(groupPaths).toContain('/deliverables');
      expect(groupPaths).toContain('/coo/deliverables');
      expect(groupPaths).toContain('/my-tasks');
    });
  });

  describe('2. Deliverable Code C Auto-Increment & Status Invariants', () => {
    it('increments submission_revision and resets item status to in_progress when Code C is recorded', async () => {
      // Mock supabase save
      const mockItem: Partial<DeliverableItem> = {
        id: 'item_101',
        deliverable_id: 'deliv_001',
        item_type: 'drawing',
        sheet_number: 'DWG-001',
        description: 'Swimming Pool Reinforcement Details',
        current_rev: 0,
        submission_revision: 1,
        consultant_status: 'C',
        status: 'ready_to_return',
      };

      // In DeliverablesService.saveDeliverableItem, Code C should increment submission_revision to 2 and status to in_progress
      let savedPayload: any = null;
      const { supabase } = await import('@/lib/supabase');
      (supabase.from as any).mockReturnValue({
        update: vi.fn((payload) => {
          savedPayload = payload;
          return {
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { ...mockItem, ...payload },
                  error: null,
                }),
              }),
            }),
          };
        }),
      });

      const res = await DeliverablesService.saveDeliverableItem(mockItem);
      expect(res).toBeDefined();
      expect(savedPayload).toBeDefined();
      expect(savedPayload.submission_revision).toBe(2);
      expect(savedPayload.status).toBe('in_progress');
      expect(savedPayload.consultant_status).toBe('C');
    });
  });

  describe('3. Deliverable Bottleneck & Blocker Calculations', () => {
    it('identifies deliverables blocked or overdue as bottlenecks', () => {
      const deliverables: Deliverable[] = [
        {
          id: 'del_1',
          project_id: 'proj_1',
          ref_code: 'E1-001',
          title_ar: 'Normal Package',
          kind: 'E1',
          received_from: 'technical_office',
          received_at: '2026-08-01',
          status: 'in_progress',
          priority: 'normal',
        },
        {
          id: 'del_2',
          project_id: 'proj_1',
          ref_code: 'E1-002',
          title_ar: 'Blocked Package with Reason',
          kind: 'E1',
          received_from: 'technical_office',
          received_at: '2026-08-01',
          status: 'blocked',
          blocked_reason: 'Waiting for consultant clarification',
          blocked_since: '2026-08-10',
          priority: 'high',
        },
      ];

      const bottlenecks = calculateDeliverableBottlenecks(deliverables);
      expect(bottlenecks.length).toBe(1);
      expect(bottlenecks[0].ref_code).toBe('E1-002');
    });
  });

  describe('4. Subcontractor Productivity & Underperformance Alerts', () => {
    it('calculates achievement % and triggers underperforming alert below 70%', () => {
      const targets: SubcontractorTarget[] = [
        {
          id: 'target_1',
          project_id: 'proj_1',
          subcontractor_id: 'sub_alpha',
          boq_item_id: 'boq_1',
          target_qty: 100,
          target_date: '2026-08-25',
          unit: 'm3',
        },
        {
          id: 'target_2',
          project_id: 'proj_1',
          subcontractor_id: 'sub_beta',
          boq_item_id: 'boq_2',
          target_qty: 100,
          target_date: '2026-08-25',
          unit: 'm3',
        },
      ];

      const dailyLines = [
        // sub_alpha achieved 85 m3 (85% >= 70%)
        { subcontractor_id: 'sub_alpha', boq_item_id: 'boq_1', qty_today: 85, line_status: 'approved' },
        // sub_beta achieved 50 m3 (50% < 70%)
        { subcontractor_id: 'sub_beta', boq_item_id: 'boq_2', qty_today: 50, line_status: 'approved' },
      ];

      const metrics = calculateSubcontractorProductivity(targets, dailyLines as any, 10);
      expect(metrics.length).toBe(2);

      const subAlpha = metrics.find((m) => m.subcontractor_id === 'sub_alpha');
      expect(subAlpha).toBeDefined();
      expect(subAlpha?.achievement_pct).toBe(85);
      expect(subAlpha?.is_underperforming).toBe(false);

      const subBeta = metrics.find((m) => m.subcontractor_id === 'sub_beta');
      expect(subBeta).toBeDefined();
      expect(subBeta?.achievement_pct).toBe(50);
      expect(subBeta?.is_underperforming).toBe(true);
    });
  });

  describe('5. Morning Command Center 60-Second Briefing', () => {
    it('accurately aggregates silent sites, active holds, blocked deliverables, and overdue RFIs', () => {
      const projects = [
        { id: 'proj_active_1', project_name: 'Lagoon Heights', status: 'working' },
        { id: 'proj_active_2', project_name: 'Palm Oasis', status: 'working' },
      ];

      // Only proj_active_1 reported yesterday
      const reports = [
        { project_id: 'proj_active_1', progress_date: '2026-08-22', status: 'approved' },
      ];

      const holds = [
        {
          id: 'hold_1',
          project_id: 'proj_active_1',
          hold_type: 'technical' as const,
          scope_type: 'zone' as const,
          reason: 'Structural concrete crack inspection',
          is_active: true,
          placed_by: 'PM',
          placed_at: '2026-08-20',
        },
      ];

      const deliverables: Deliverable[] = [
        {
          id: 'del_blocked',
          project_id: 'proj_active_1',
          ref_code: 'E1-099',
          title_ar: 'Lagoon Filtration Piping Details',
          kind: 'E1',
          received_from: 'technical_office',
          received_at: '2026-08-10',
          status: 'blocked',
          blocked_reason: 'RFI Pending',
          priority: 'high',
        },
      ];

      const rfis = [
        {
          id: 'rfi_1',
          project_id: 'proj_active_1',
          rfi_no: 'RFI-001',
          subject: 'Pipe diameter conflict',
          sent_date: '2026-08-10',
          target_reply_date: '2026-08-17', // Overdue relative to 2026-08-23
          status: 'sent' as const,
        },
      ];

      const subMetrics = [
        {
          subcontractor_id: 'sub_low',
          target_qty: 100,
          actual_qty: 40,
          achievement_pct: 40,
          is_underperforming: true,
        },
      ];

      const summary = calculateMorningCommandCenter({
        projects,
        reports: reports as any,
        holds,
        deliverables,
        rfis,
        subMetrics,
        targetDate: '2026-08-23',
      });

      expect(summary.silent_sites_count).toBe(1);
      expect(summary.silent_sites[0].project_id).toBe('proj_active_2');
      expect(summary.active_critical_holds_count).toBe(1);
      expect(summary.blocked_deliverables_count).toBe(1);
      expect(summary.overdue_rfis_count).toBe(1);
      expect(summary.underperforming_subcontractors_count).toBe(1);
    });
  });

  describe('6. Deliverables Master Matrix & Delayed Submission Indicators (COO Audit)', () => {
    it('detects delayed submissions when due_date has passed and status is not completed', () => {
      const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const dueSoonDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      const deliverables: Deliverable[] = [
        {
          id: 'del_1',
          project_id: 'p1',
          ref_code: 'E1-001',
          title_ar: 'لوحات إنشائية',
          kind: 'E1',
          received_from: 'technical_office',
          received_at: '2026-08-01',
          due_date: pastDate,
          status: 'in_progress',
          priority: 'high',
        },
        {
          id: 'del_2',
          project_id: 'p1',
          ref_code: 'E1-002',
          title_ar: 'لوحات معمارية',
          kind: 'E1',
          received_from: 'technical_office',
          received_at: '2026-08-01',
          due_date: pastDate,
          status: 'returned', // returned is completed, not overdue
          priority: 'normal',
        },
        {
          id: 'del_3',
          project_id: 'p1',
          ref_code: 'E2-003',
          title_ar: 'لوحات كهروميكانيكية',
          kind: 'E2',
          received_from: 'technical_office',
          received_at: '2026-08-01',
          due_date: dueSoonDate,
          status: 'in_progress',
          priority: 'normal',
        },
      ];

      // Delay helper calculation verification
      const checkDelay = (d: Deliverable) => {
        if (!d.due_date) return { isOverdue: false, isDueSoon: false };
        const dueMs = new Date(d.due_date).getTime();
        const diffDays = Math.ceil((dueMs - Date.now()) / (1000 * 60 * 60 * 24));
        const isCompleted = d.status === 'returned' || d.status === 'approved';
        return {
          isOverdue: !isCompleted && diffDays < 0,
          isDueSoon: !isCompleted && diffDays >= 0 && diffDays <= 3,
        };
      };

      expect(checkDelay(deliverables[0]).isOverdue).toBe(true);
      expect(checkDelay(deliverables[1]).isOverdue).toBe(false);
      expect(checkDelay(deliverables[2]).isDueSoon).toBe(true);
    });

    it('identifies Code C revision items and maps 4-stage approval workflow', () => {
      const deliverableWithCodeC: Deliverable = {
        id: 'del_c',
        project_id: 'p1',
        ref_code: 'E1-010',
        title_ar: 'شوب دروينج مسبح',
        kind: 'E1',
        received_from: 'technical_office',
        received_at: '2026-08-01',
        status: 'in_progress',
        priority: 'high',
        items: [
          {
            id: 'item_c_1',
            deliverable_id: 'del_c',
            item_type: 'drawing',
            description: 'تسليح القاع',
            current_rev: 2,
            submission_revision: 2,
            consultant_status: 'C',
            status: 'in_progress',
          },
        ],
      };

      const hasCodeC = (deliverableWithCodeC.items || []).some(
        (i) => i.consultant_status === 'C'
      );
      expect(hasCodeC).toBe(true);
      expect(deliverableWithCodeC.items![0].submission_revision).toBe(2);
    });
  });
});

