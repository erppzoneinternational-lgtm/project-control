/**
 * WeeklyReportsPanel — logic tests (weekly-report generation UI).
 *
 * Node vitest env (no DOM precedent in repo) → test the exported pure
 * decision logic: canonical week-window computation (Saturday), generation
 * params, result mapping to toast outcomes, and role gates. Mirrors
 * baseline-version-actions.test.ts conventions.
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/supabase', () => ({
  supabase: { from: vi.fn() },
}));

import {
  WEEKLY_GENERATE_ROLES,
  WEEKLY_FINALIZE_ROLES,
  GENERATE_BUTTON_LABEL,
  FINALIZE_BUTTON_LABEL,
  EMPTY_WEEK_MESSAGE_AR,
  buildWeeklyParams,
  canGenerateWeeklyReport,
  canFinalizeWeeklyReport,
  outcomeFor,
} from '../planning/WeeklyReportsPanel';
import { mostRecentWeekStart } from '@/lib/services/weeklyReportGeneration';

describe('WeeklyReportsPanel (weekly-report generation UI)', () => {
  describe('mostRecentWeekStart — canonical default picker window (Saturday)', () => {
    it('mid-week (Tuesday 2026-08-25): returns the previous Saturday 2026-08-22', () => {
      expect(mostRecentWeekStart(6, new Date(2026, 7, 25))).toBe('2026-08-22');
    });

    it('on Saturday itself → same day', () => {
      expect(mostRecentWeekStart(6, new Date(2026, 7, 22))).toBe('2026-08-22');
    });

    it('on Sunday → the day before (Saturday)', () => {
      expect(mostRecentWeekStart(6, new Date(2026, 7, 23))).toBe('2026-08-22');
    });

    it('handles year boundaries (Thu 2026-01-01 → Sat 2025-12-27)', () => {
      expect(mostRecentWeekStart(6, new Date(2026, 0, 1))).toBe('2025-12-27');
    });
  });

  describe('buildWeeklyParams — orchestrator payload', () => {
    it('weekEnd = weekStart + 6 days and passes user as generatedBy', () => {
      expect(buildWeeklyParams('p-1', '2026-08-17', 'u-9')).toEqual({
        projectId: 'p-1',
        weekStart: '2026-08-17',
        weekEnd: '2026-08-23',
        generatedBy: 'u-9',
      });
    });

    it('missing user maps to null generatedBy', () => {
      const p = buildWeeklyParams('p-1', '2026-08-17', null);
      expect(p.generatedBy).toBeNull();
      expect(p.weekEnd).toBe('2026-08-23');
    });
  });

  describe('role gates', () => {
    it('generation mirrors SUBMIT_ROLES from BaselineVersionActions', () => {
      expect(WEEKLY_GENERATE_ROLES).toEqual(['planning_engineer', 'planning_manager', 'technical_office', 'admin']);
      expect(canGenerateWeeklyReport(['planning_engineer'])).toBe(true);
      expect(canGenerateWeeklyReport(['technical_office'])).toBe(true);
    });

    it('finalize mirrors APPROVE_ROLES — planning_engineer excluded', () => {
      expect(WEEKLY_FINALIZE_ROLES).toEqual(['planning_manager', 'technical_office', 'admin']);
      expect(canFinalizeWeeklyReport(['planning_manager'])).toBe(true);
      expect(canFinalizeWeeklyReport(['planning_engineer'])).toBe(false);
      expect(canFinalizeWeeklyReport(['site_engineer', 'cost_control'])).toBe(false);
    });

    it('null / undefined / empty roles are denied everywhere', () => {
      expect(canGenerateWeeklyReport(null)).toBe(false);
      expect(canFinalizeWeeklyReport(undefined)).toBe(false);
      expect(canFinalizeWeeklyReport([])).toBe(false);
    });
  });

  describe('outcomeFor — orchestrator union → toast outcome', () => {
    const report = { id: 'r-1', status: 'draft' } as any;

    it('created without approved version → warning + fallback flag', () => {
      const out = outcomeFor({ status: 'created', report, versionUsed: null, usedFallbackVersion: true });
      expect(out.tone).toBe('warning');
      expect(out.usedFallbackVersion).toBe(true);
      expect(out.report?.id).toBe('r-1');
    });

    it('clean created → success', () => {
      const out = outcomeFor({ status: 'created', report, versionUsed: {} as any, usedFallbackVersion: false });
      expect(out.tone).toBe('success');
      expect(out.usedFallbackVersion).toBe(false);
    });

    it('duplicate → info', () => {
      const out = outcomeFor({ status: 'duplicate', existing: report });
      expect(out.tone).toBe('info');
    });

    it('empty period surfaces the required friendly Arabic message', () => {
      const out = outcomeFor({ status: 'empty', messageAr: 'رسالة رسمية من الخدمة' });
      expect(out.tone).toBe('warning');
      expect(out.messageAr).toBe(EMPTY_WEEK_MESSAGE_AR);
      expect(EMPTY_WEEK_MESSAGE_AR).toBe('مفيش بيانات كافية للأسبوع ده');
    });

    it('error falls back to generic Arabic message when service gives none', () => {
      expect(outcomeFor({ status: 'error', messageAr: '' }).messageAr.length).toBeGreaterThan(0);
      expect(outcomeFor({ status: 'error', messageAr: 'خطأ مخصص' }).messageAr).toBe('خطأ مخصص');
    });
  });

  describe('labels', () => {
    it('uses the required button copy', () => {
      expect(GENERATE_BUTTON_LABEL).toBe('توليد التقرير');
      expect(FINALIZE_BUTTON_LABEL).toBe('إنهاء');
    });
  });
});
