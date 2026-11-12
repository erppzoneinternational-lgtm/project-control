/**
 * BaselineVersionActions — logic tests (gap F3).
 *
 * The repo has no DOM/component-render test precedent (vitest runs in node,
 * .ts only), so per convention we test the exported pure decision logic and
 * the service wiring of the action component with a mocked service.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase', () => ({
  supabase: { from: vi.fn() },
}));

vi.mock('@/lib/services/schedule-version.service', () => ({
  ScheduleVersionService: {
    submitForApproval: vi.fn(),
    approve: vi.fn(),
    reject: vi.fn(),
  },
}));

import { logger } from '@/lib/logger';
import { ScheduleVersionService } from '@/lib/services/schedule-version.service';
import {
  SUBMIT_ROLES,
  APPROVE_ROLES,
  ACTION_LABELS,
  hasAnyRole,
  canSubmitVersion,
  canApproveVersion,
  isValidRejectReason,
  allowedActionsFor,
  isReferenceVersion,
  runVersionAction,
} from '../planning/BaselineVersionActions';

const mockedSvc = vi.mocked(ScheduleVersionService, true);

const ver = (status: string) => ({ status } as any);

describe('BaselineVersionActions (schedule-version approval workflow)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('role gates', () => {
    it('submitters are planning_engineer + planning_manager + technical_office + admin', () => {
      expect(SUBMIT_ROLES).toEqual(['planning_engineer', 'planning_manager', 'technical_office', 'admin']);
      expect(canSubmitVersion(['planning_engineer'])).toBe(true);
      expect(canSubmitVersion(['admin'])).toBe(true);
    });

    it('approvers are planning_manager + technical_office + admin only', () => {
      expect(APPROVE_ROLES).toEqual(['planning_manager', 'technical_office', 'admin']);
      expect(canApproveVersion(['planning_manager'])).toBe(true);
      expect(canApproveVersion(['technical_office'])).toBe(true);
    });

    it('planning_engineer cannot approve/reject', () => {
      expect(canApproveVersion(['planning_engineer'])).toBe(false);
    });

    it('read-only roles get nothing', () => {
      const viewer = ['site_engineer', 'cost_control', 'ceo'];
      expect(canSubmitVersion(viewer)).toBe(false);
      expect(canApproveVersion(viewer)).toBe(false);
    });

    it('hasAnyRole handles null/undefined/empty role lists', () => {
      expect(hasAnyRole(null, SUBMIT_ROLES)).toBe(false);
      expect(hasAnyRole(undefined, SUBMIT_ROLES)).toBe(false);
      expect(hasAnyRole([], SUBMIT_ROLES)).toBe(false);
    });
  });

  describe('button ↔ state matrix (allowedActionsFor)', () => {
    it('draft: submit visible to submit-capable roles, hidden from approver-only-less roles', () => {
      expect(allowedActionsFor(ver('draft'), ['planning_engineer'])).toEqual(['submit']);
      expect(allowedActionsFor(ver('draft'), ['planning_manager'])).toEqual(['submit']);
      expect(allowedActionsFor(ver('draft'), ['site_engineer'])).toEqual([]);
    });

    it('submitted: approve+reject visible only to approvers, never to planning_engineer', () => {
      expect(allowedActionsFor(ver('submitted'), ['planning_manager'])).toEqual(['approve', 'reject']);
      expect(allowedActionsFor(ver('submitted'), ['admin'])).toEqual(['approve', 'reject']);
      expect(allowedActionsFor(ver('submitted'), ['planning_engineer'])).toEqual([]);
    });

    it('terminal statuses expose no actions for anyone', () => {
      for (const status of ['approved', 'rejected']) {
        expect(allowedActionsFor(ver(status), ['admin'])).toEqual([]);
        expect(allowedActionsFor(ver(status), ['planning_engineer'])).toEqual([]);
      }
    });
  });

  describe('reference badge', () => {
    it('only approved versions are the reporting reference (المرجع)', () => {
      expect(isReferenceVersion(ver('approved'))).toBe(true);
      expect(isReferenceVersion(ver('draft'))).toBe(false);
      expect(isReferenceVersion(ver('submitted'))).toBe(false);
      expect(isReferenceVersion(ver('rejected'))).toBe(false);
    });
  });

  describe('rejection requires a mandatory reason', () => {
    it('rejects empty / whitespace / too-short notes', () => {
      expect(isValidRejectReason('')).toBe(false);
      expect(isValidRejectReason('   ')).toBe(false);
      expect(isValidRejectReason(null)).toBe(false);
      expect(isValidRejectReason(undefined)).toBe(false);
      expect(isValidRejectReason('ab')).toBe(false);
    });

    it('accepts a real reason (trimmed)', () => {
      expect(isValidRejectReason('توارث خاطئ في تاريخ البداية')).toBe(true);
      expect(isValidRejectReason('  مدد غير منطقية  ')).toBe(true);
      expect(isValidRejectReason('  ok  ')).toBe(false); // trims to 2 chars
    });
  });

  describe('Arabic labels', () => {
    it('uses the required button copy', () => {
      expect(ACTION_LABELS.submit).toBe('إرسال للاعتماد');
      expect(ACTION_LABELS.approve).toBe('اعتماد');
      expect(ACTION_LABELS.reject).toBe('رفض');
    });
  });

  describe('service wiring (runVersionAction)', () => {
    it('submit → submitForApproval(versionId, userId)', async () => {
      mockedSvc.submitForApproval.mockResolvedValue(true);
      const ok = await runVersionAction('submit', 'v-1', { userId: 'u-9' });
      expect(ok).toBe(true);
      expect(mockedSvc.submitForApproval).toHaveBeenCalledWith('v-1', 'u-9');
      expect(mockedSvc.approve).not.toHaveBeenCalled();
      expect(mockedSvc.reject).not.toHaveBeenCalled();
    });

    it('approve → approve(versionId, userId, note)', async () => {
      mockedSvc.approve.mockResolvedValue(true);
      const ok = await runVersionAction('approve', 'v-2', { userId: 'u-9', note: 'تمت المراجعة' });
      expect(ok).toBe(true);
      expect(mockedSvc.approve).toHaveBeenCalledWith('v-2', 'u-9', 'تمت المراجعة');
    });

    it('reject → reject(versionId, userId, reason note)', async () => {
      mockedSvc.reject.mockResolvedValue(true);
      await runVersionAction('reject', 'v-3', { userId: 'u-9', note: 'أخطاء بالمدد' });
      expect(mockedSvc.reject).toHaveBeenCalledWith('v-3', 'u-9', 'أخطاء بالمدد');
    });

    it('returns false when the service reports failure (no throw)', async () => {
      mockedSvc.approve.mockResolvedValue(false);
      expect(await runVersionAction('approve', 'v-4', {})).toBe(false);
    });

    it('swallows unexpected service exceptions and returns false', async () => {
      mockedSvc.submitForApproval.mockRejectedValue(new Error('network down'));
      const errSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});
      expect(await runVersionAction('submit', 'v-5', {})).toBe(false);
      expect(errSpy).toHaveBeenCalled();
      errSpy.mockRestore();
    });
  });
});
