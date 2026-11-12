import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskOntologyService } from '@/lib/services/taskOntology.service';
import { SiteTaskService } from '@/lib/services/siteTask.service';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

describe('Task Control Board & Queues Logic Gates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PM Review & State Transition Gates (FR-04, FR-06)', () => {
    it('throws error when rejecting a task without a non-empty reason', async () => {
      await expect(
        SiteTaskService.transitionTaskState({
          taskId: 'task-1',
          toState: 'rejected',
          reason: '   ', // empty / whitespace
        })
      ).rejects.toThrow('REASON_REQUIRED');
    });

    it('throws error when replanning a task without a written reason', async () => {
      await expect(
        SiteTaskService.replanTask({
          taskId: 'task-1',
          newPlannedStart: '2026-09-01',
          newPlannedFinish: '2026-09-10',
          reason: '',
        })
      ).rejects.toThrow('REASON_REQUIRED');
    });

    it('throws error when rejecting a QC inspection without a mandatory reason', async () => {
      await expect(
        TaskOntologyService.recordInspectionDecision('insp-1', 'rejected', '  ')
      ).rejects.toThrow('REASON_REQUIRED');
    });
  });
});
