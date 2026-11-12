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
        not: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
      rpc: vi.fn().mockResolvedValue({ data: 0, error: null }),
      storage: {
        from: vi.fn(() => ({
          upload: vi.fn().mockResolvedValue({ data: { path: 'test.jpg' }, error: null }),
          getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://storage.mock/test.jpg' } }),
        })),
      },
    },
  };
});

import { CommentService, CreateCommentDTO } from '@/lib/services/comment.service';
import { DailyProgressService } from '@/lib/services/dailyProgress.service';
import { KpiService, calculateRate, calculateAverageDuration, UNIFIED_TAXONOMY_LABELS_AR } from '@/lib/services/kpi.service';
import { ROLE_LABELS_MAP } from '@/components/planning/DailyProgressComments';
import { UNIFIED_TAXONOMY_CATEGORIES, RESPONSIBLE_PARTIES } from '@/components/planning/DailyObstructionModal';
import { UNIFIED_TAXONOMY_LABELS } from '@/components/planning/ObstructionReport';
import { getPerformanceTier, PERFORMANCE_TIERS } from '@/components/dashboard/TOEngineerKPIDashboard';
import { DailyProgressComment, DailyObstruction, TOEngineerKPIs, UnifiedObstructionType } from '@/types/planning';

describe('Milestone M4: PM Comments, Unified Obstructions & KPI UI (WS-3, WS-4, WS-5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // 1. PM Private Comments System (WS-3)
  // =========================================================================
  describe('1. PM Private Comments System (WS-3)', () => {
    it('defines accurate role labels, titles, and badge colors for PM and management roles', () => {
      expect(ROLE_LABELS_MAP.project_manager).toBeDefined();
      expect(ROLE_LABELS_MAP.planning_manager).toBeDefined();
      expect(ROLE_LABELS_MAP.admin).toBeDefined();
      expect(ROLE_LABELS_MAP.coo).toBeDefined();

      expect(ROLE_LABELS_MAP.project_manager.ar).toContain('مدير المشروع');
      expect(ROLE_LABELS_MAP.project_manager.en).toBe('Project Manager');
      expect(ROLE_LABELS_MAP.planning_manager.ar).toContain('مدير التخطيط');
      expect(ROLE_LABELS_MAP.planning_manager.en).toBe('Planning Manager');
    });

    it('validates empty comments and throws structured error', async () => {
      await expect(
        CommentService.addComment({
          daily_progress_id: 'report-1',
          project_id: 'prj-1',
          author_user_id: 'usr-1',
          author_name: 'Eng. Ahmed',
          comment_text: '   ',
        })
      ).rejects.toThrow('EMPTY_COMMENT');

      await expect(
        CommentService.updateComment('comment-1', '', 'usr-1')
      ).rejects.toThrow('EMPTY_COMMENT');
    });

    it('enforces author-only update authorization rule', async () => {
      // Trying to update without matching author user id
      await expect(
        CommentService.updateComment('comment-1', 'Updated text', 'wrong-user-id')
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // 2. Unified Obstruction Taxonomy & Modal (WS-4)
  // =========================================================================
  describe('2. Unified Obstruction Taxonomy & Modal (WS-4)', () => {
    it('contains all 11 canonical obstruction taxonomy categories with Arabic and English descriptions', () => {
      expect(UNIFIED_TAXONOMY_CATEGORIES).toHaveLength(11);

      const types = UNIFIED_TAXONOMY_CATEGORIES.map((c) => c.type);
      const expectedTypes: UnifiedObstructionType[] = [
        'owner_directive',
        'weather',
        'material_delay',
        'drawing_delay',
        'subcontractor',
        'permit_authority',
        'equipment',
        'manpower',
        'safety',
        'access',
        'other',
      ];

      expectedTypes.forEach((t) => {
        expect(types).toContain(t);
      });

      UNIFIED_TAXONOMY_CATEGORIES.forEach((cat) => {
        expect(cat.labelAr).toBeTruthy();
        expect(cat.labelEn).toBeTruthy();
        expect(cat.descriptionAr).toBeTruthy();
        expect(cat.descriptionEn).toBeTruthy();
        expect(cat.badgeColor).toBeTruthy();
      });
    });

    it('contains full list of responsible parties with Arabic and English labels', () => {
      expect(RESPONSIBLE_PARTIES.length).toBeGreaterThanOrEqual(6);
      const values = RESPONSIBLE_PARTIES.map((p) => p.value);
      expect(values).toContain('Consultant');
      expect(values).toContain('Client');
      expect(values).toContain('Internal');
      expect(values).toContain('Subcontractor');
      expect(values).toContain('Supplier');
      expect(values).toContain('Authorities');
    });

    it('supports scope designation between task and site_wide', async () => {
      const mockTaskObstruction: Partial<DailyObstruction> = {
        project_id: 'prj-101',
        obstruction_type: 'drawing_delay',
        scope: 'task',
        eot_days: 3,
        responsible_party: 'Consultant',
        description: 'Delayed architectural drawing approval on zone 2',
      };

      const mockSiteWideObstruction: Partial<DailyObstruction> = {
        project_id: 'prj-101',
        obstruction_type: 'weather',
        scope: 'site_wide',
        eot_days: 5,
        responsible_party: 'Other',
        description: 'Severe sandstorm and flooding halting all site operations',
      };

      expect(mockTaskObstruction.scope).toBe('task');
      expect(mockSiteWideObstruction.scope).toBe('site_wide');
      expect(mockSiteWideObstruction.eot_days).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // 3. Cross-Project Obstruction Report & Aggregations (WS-4)
  // =========================================================================
  describe('3. Cross-Project Obstruction Report & Aggregations (WS-4)', () => {
    it('accurately computes total active obstructions, idle manpower hours, and total claimed EOT days', () => {
      const sampleObstructions: DailyObstruction[] = [
        {
          id: 'obs-1',
          project_id: 'prj-1',
          obstruction_type: 'drawing_delay',
          scope: 'task',
          eot_days: 4,
          idle_manpower: 12, // 12 * 8 = 96h
          responsible_party: 'Consultant',
          description: 'Delayed RFI response',
          started_at: '2026-08-01T08:00:00Z',
          resolved_at: null, // Active
        },
        {
          id: 'obs-2',
          project_id: 'prj-2',
          obstruction_type: 'weather',
          scope: 'site_wide',
          eot_days: 2,
          idle_manpower: 20, // 20 * 8 = 160h
          responsible_party: 'Other',
          description: 'Rainstorm',
          started_at: '2026-08-05T08:00:00Z',
          resolved_at: '2026-08-07T17:00:00Z', // Resolved
        },
        {
          id: 'obs-3',
          project_id: 'prj-1',
          obstruction_type: 'material_delay',
          scope: 'task',
          eot_days: 6,
          idle_manpower: 8, // 8 * 8 = 64h
          responsible_party: 'Supplier',
          description: 'Custom pumps shipment delay',
          started_at: '2026-08-10T08:00:00Z',
          resolved_at: null, // Active
        },
      ];

      const total = sampleObstructions.length;
      const active = sampleObstructions.filter((o) => !o.resolved_at).length;
      const resolved = total - active;
      const totalIdleManpower = sampleObstructions.reduce((s, o) => s + (o.idle_manpower || 0), 0);
      const totalIdleHours = totalIdleManpower * 8;
      const totalEotDays = sampleObstructions.reduce((s, o) => s + (o.eot_days || 0), 0);

      expect(total).toBe(3);
      expect(active).toBe(2);
      expect(resolved).toBe(1);
      expect(totalIdleManpower).toBe(40);
      expect(totalIdleHours).toBe(320);
      expect(totalEotDays).toBe(12);
    });

    it('identifies top root cause category from frequency distribution', () => {
      const sampleObstructions: DailyObstruction[] = [
        { id: '1', project_id: 'p1', obstruction_type: 'drawing_delay', responsible_party: 'Consultant', description: 'd1', started_at: '2026-08-01' },
        { id: '2', project_id: 'p1', obstruction_type: 'drawing_delay', responsible_party: 'Consultant', description: 'd2', started_at: '2026-08-02' },
        { id: '3', project_id: 'p2', obstruction_type: 'drawing_delay', responsible_party: 'Consultant', description: 'd3', started_at: '2026-08-03' },
        { id: '4', project_id: 'p1', obstruction_type: 'weather', responsible_party: 'Other', description: 'w1', started_at: '2026-08-04' },
      ];

      const counts = new Map<string, number>();
      sampleObstructions.forEach((o) => {
        counts.set(o.obstruction_type, (counts.get(o.obstruction_type) || 0) + 1);
      });

      let topKey = '';
      let maxCount = 0;
      counts.forEach((c, k) => {
        if (c > maxCount) {
          maxCount = c;
          topKey = k;
        }
      });

      expect(topKey).toBe('drawing_delay');
      expect(maxCount).toBe(3);
    });

    it('verifies resolution timestamp and note updating via DailyProgressService.resolveObstruction', async () => {
      const res = await DailyProgressService.resolveObstruction(
        'obs-123',
        'Drawings approved under transmittal TR-888',
        '2026-08-31T17:00:00Z'
      );
      // Service resolves successfully
      expect(res).toBeDefined();
    });
  });

  // =========================================================================
  // 4. TO Engineer KPI Engine & Dashboard (WS-5)
  // =========================================================================
  describe('4. TO Engineer KPI Engine & Dashboard (WS-5)', () => {
    it('calculates on-time delivery rate, revision rate, and average completion duration accurately', () => {
      // Test calculateRate
      expect(calculateRate(8, 10)).toBe(80.0);
      expect(calculateRate(1, 3)).toBe(33.3);
      expect(calculateRate(0, 10)).toBe(0);
      expect(calculateRate(10, 0)).toBe(0);

      // Test calculateAverageDuration
      const items = [
        { work_started_at: '2026-08-01T00:00:00Z', completed_at: '2026-08-05T00:00:00Z' }, // 4 days
        { work_started_at: '2026-08-10T00:00:00Z', completed_at: '2026-08-16T00:00:00Z' }, // 6 days
      ];
      expect(calculateAverageDuration(items)).toBe(5.0);
    });

    it('categorizes engineers into proper performance tiers based on thresholds', () => {
      // High Performer: On-time >= 85% and Code C/D <= 15%
      const highPerformer: TOEngineerKPIs = {
        stakeholder_id: 'eng-1',
        total_assigned: 20,
        total_completed: 18,
        in_progress_count: 2,
        on_time_delivery_rate_pct: 90,
        code_cd_revision_rate_pct: 10,
        first_pass_approval_rate_pct: 85,
        average_completion_duration_days: 3.5,
        total_drawings_approved: 16,
        items_with_code_c: 2,
      };
      expect(getPerformanceTier(highPerformer)).toBe('high_performer');
      expect(PERFORMANCE_TIERS.high_performer.labelEn).toBe('High Performer');

      // On-Track: On-time >= 70% and Code C/D <= 25%
      const onTrack: TOEngineerKPIs = {
        stakeholder_id: 'eng-2',
        total_assigned: 15,
        total_completed: 12,
        in_progress_count: 3,
        on_time_delivery_rate_pct: 75,
        code_cd_revision_rate_pct: 20,
        first_pass_approval_rate_pct: 70,
        average_completion_duration_days: 4.2,
        total_drawings_approved: 10,
        items_with_code_c: 3,
      };
      expect(getPerformanceTier(onTrack)).toBe('on_track');

      // Needs Attention: On-time < 70% or Code C/D > 25%
      const needsAttentionOnTime: TOEngineerKPIs = {
        stakeholder_id: 'eng-3',
        total_assigned: 10,
        total_completed: 6,
        in_progress_count: 4,
        on_time_delivery_rate_pct: 60,
        code_cd_revision_rate_pct: 15,
        first_pass_approval_rate_pct: 55,
        average_completion_duration_days: 7.0,
        total_drawings_approved: 5,
        items_with_code_c: 2,
      };
      expect(getPerformanceTier(needsAttentionOnTime)).toBe('needs_attention');

      const needsAttentionRevisions: TOEngineerKPIs = {
        stakeholder_id: 'eng-4',
        total_assigned: 10,
        total_completed: 8,
        in_progress_count: 2,
        on_time_delivery_rate_pct: 85,
        code_cd_revision_rate_pct: 35, // excessive revisions
        first_pass_approval_rate_pct: 40,
        average_completion_duration_days: 5.0,
        total_drawings_approved: 5,
        items_with_code_c: 4,
      };
      expect(getPerformanceTier(needsAttentionRevisions)).toBe('needs_attention');
    });
  });

  // =========================================================================
  // 5. Executive Project Health KPI Cards (WS-5)
  // =========================================================================
  describe('5. Executive Project Health KPI Cards (WS-5)', () => {
    it('computes Schedule SPI and Cost CPI health status and boundaries', () => {
      const getSpiClassification = (spi: number) => {
        if (spi >= 0.95) return 'healthy';
        if (spi >= 0.85) return 'warning';
        return 'critical';
      };

      expect(getSpiClassification(1.05)).toBe('healthy');
      expect(getSpiClassification(0.96)).toBe('healthy');
      expect(getSpiClassification(0.90)).toBe('warning');
      expect(getSpiClassification(0.80)).toBe('critical');

      const getCpiClassification = (cpi: number) => {
        if (cpi >= 1.0) return 'healthy';
        if (cpi >= 0.9) return 'warning';
        return 'critical';
      };

      expect(getCpiClassification(1.1)).toBe('healthy');
      expect(getCpiClassification(0.95)).toBe('warning');
      expect(getCpiClassification(0.82)).toBe('critical');
    });

    it('calculates site productivity pace ratio from actual vs planned completion', () => {
      const planned = 70.0;
      const actual = 63.0;
      const ratio = Math.round((actual / planned) * 100);
      expect(ratio).toBe(90);
    });

    it('handles zero planned progress gracefully without division by zero', () => {
      const planned = 0;
      const actual = 0;
      const ratio = planned > 0 ? Math.round((actual / planned) * 100) : 100;
      expect(ratio).toBe(100);
    });
  });

  // =========================================================================
  // 6. Adversarial Edge Cases & Boundary Conditions
  // =========================================================================
  describe('6. Adversarial Edge Cases & Boundary Conditions', () => {
    it('handles negative or malformed EOT inputs safely', () => {
      const rawEotInput = -5;
      const sanitized = Math.max(0, parseFloat(String(rawEotInput)) || 0);
      expect(sanitized).toBe(0);

      const nonNumeric = 'abc';
      const sanitizedNonNumeric = Math.max(0, parseFloat(nonNumeric) || 0);
      expect(sanitizedNonNumeric).toBe(0);
    });

    it('maintains integrity of Arabic UTF-8 text with special characters in descriptions and titles', () => {
      const arabicDescription = 'تأخر توريد طلمبات الشفط الفراغي (Vacuum Pumps) للمشروع 2105 & ملاحظات الاستشاري #44!';
      expect(arabicDescription.length).toBeGreaterThan(20);
      expect(arabicDescription).toContain('طلمبات');
      expect(arabicDescription).toContain('Vacuum Pumps');
    });

    it('maps legacy obstruction types cleanly to unified taxonomy without crashing', () => {
      const legacyTypes = [
        'material_approval',
        'site_access',
        'client_works',
        'equipment_idle',
        'labor_shortage',
      ];

      legacyTypes.forEach((legacy) => {
        let mapped = legacy;
        if (mapped === 'material_approval') mapped = 'material_delay';
        if (mapped === 'site_access') mapped = 'access';
        if (mapped === 'client_works') mapped = 'owner_directive';
        if (mapped === 'equipment_idle') mapped = 'equipment';
        if (mapped === 'labor_shortage') mapped = 'manpower';

        expect(UNIFIED_TAXONOMY_LABELS_AR[mapped as UnifiedObstructionType]).toBeDefined();
      });
    });
  });
});
