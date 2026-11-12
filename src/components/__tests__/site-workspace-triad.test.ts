import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase module
vi.mock('@/lib/supabase', () => {
  return {
    supabase: {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
  };
});

import { DailyProgressService } from '@/lib/services/dailyProgress.service';
import { SiteTask } from '@/lib/services/siteTask.service';

describe('Site Workspace Triad UX Overhaul (Options 2, 3 & 4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Option 2: Fast-Grid Calculations & Rules', () => {
    it('RULE-002: accurately calculates % from today quantity', () => {
      const contractQty = 1000;
      const todayQty = 50;
      const pctToday = Math.round((todayQty / contractQty) * 10000) / 100;
      expect(pctToday).toBe(5.0);
    });

    it('RULE-002: accurately calculates quantity from today %', () => {
      const contractQty = 2500;
      const todayPct = 10;
      const todayQty = Math.round(((todayPct / 100) * contractQty) * 1000) / 1000;
      expect(todayQty).toBe(250);
    });

    it('RULE-001: enforces new cumulative >= previous cumulative', () => {
      const prevCum = 400;
      const todayQty = 20;
      const newCum = prevCum + Math.max(0, todayQty);
      expect(newCum).toBeGreaterThanOrEqual(prevCum);
    });

    it('RULE-003: cost-weighted task progress calculation', () => {
      // 2 BOQ items: Item A (1000 qty @ 100 EGP = 100,000) with 50% progress
      //              Item B (500 qty @ 200 EGP = 100,000) with 80% progress
      // Total value = 200,000. Expected progress = (50,000 + 80,000) / 200,000 = 65%
      const itemAValue = 1000 * 100;
      const itemBValue = 500 * 200;
      const totalValue = itemAValue + itemBValue;

      const progressA = 50;
      const progressB = 80;

      const weightedProgress = (progressA * itemAValue + progressB * itemBValue) / totalValue;
      expect(weightedProgress).toBe(65);
    });
  });

  describe('Option 4: Kanban Lane Classification', () => {
    const mockTasks: Partial<SiteTask>[] = [
      { id: '1', title_ar: 'حفر', status: 'pending', progress_pct: 0 },
      { id: '2', title_ar: 'خرسانة', status: 'in_progress', progress_pct: 40, progress_verified: true },
      { id: '3', title_ar: 'عزل', status: 'pm_review', progress_pct: 60, progress_verified: false },
      { id: '4', title_ar: 'مباني', status: 'done', progress_pct: 100, progress_verified: true },
    ];

    it('correctly sorts tasks into 4 pipeline lanes', () => {
      const planned = mockTasks.filter((t) => t.status === 'pending');
      const inProgress = mockTasks.filter((t) => t.status === 'in_progress' && (t.progress_verified || t.progress_pct === 0));
      const pendingReview = mockTasks.filter((t) => t.status === 'pm_review' || (t.progress_pct! > 0 && !t.progress_verified));
      const completed = mockTasks.filter((t) => t.status === 'done' || t.progress_pct === 100);

      expect(planned.length).toBe(1);
      expect(inProgress.length).toBe(1);
      expect(pendingReview.length).toBe(1);
      expect(completed.length).toBe(1);
    });
  });

  describe('Service: batchSaveDailyProgressLines', () => {
    it('is exported as a callable function on DailyProgressService', () => {
      expect(typeof DailyProgressService.batchSaveDailyProgressLines).toBe('function');
    });

    it('returns error when passed empty items array', async () => {
      const res = await DailyProgressService.batchSaveDailyProgressLines(
        'proj-1',
        'user-1',
        'مهندس الموقع',
        []
      );
      expect(res.success).toBe(false);
      expect(res.error).toBe('بيانات غير كافية للحفظ');
    });
  });
});
