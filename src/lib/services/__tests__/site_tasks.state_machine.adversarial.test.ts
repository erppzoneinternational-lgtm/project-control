import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

vi.mock('@/lib/services/notification.service', () => ({
  NotificationService: {
    createNotification: vi.fn().mockResolvedValue(undefined),
  },
}));

import { supabase } from '@/lib/supabase';
import {
  SiteTaskService,
  SiteTaskStatus,
  OPEN_SITE_TASK_STATUSES,
} from '@/lib/services/siteTask.service';
import {
  DailyProgressService,
  buildCreateReportPayload,
} from '@/lib/services/dailyProgress.service';

/**
 * Site Tasks 8-State Machine, Role Gates & SITE_TASK_REQUIRED Adversarial Suite
 *
 * Grounded in:
 * - src/lib/services/siteTask.service.ts (SiteTaskService.transitionTaskState, replanTask)
 * - src/lib/services/dailyProgress.service.ts (DailyProgressService.createDailyReport, buildCreateReportPayload)
 * - supabase/migrations/025_unified_task_transition_rpc.sql (rpc_site_task_transition)
 * - CONTEXT.md Invariants 1 (SITE_TASK_REQUIRED) & 5 (Immutable pm_task_events)
 */

interface SimulatedTaskRow {
  id: string;
  project_id: string;
  status: SiteTaskStatus;
  assignee_stakeholder_id: string | null;
  qc_stakeholder_id: string | null;
  planned_qty: number;
  verified_qty: number | null;
  progress_pct: number;
  rejection_reason: string | null;
}

interface SimulatedActor {
  userId: string | null;
  stakeholderId: string | null;
  roles: string[];
}

describe('Site Tasks State Machine, Role Gates & SITE_TASK_REQUIRED (Adversarial Suite)', () => {
  const ASSIGNEE_STK_ID = '11111111-1111-4111-8111-111111111111';
  const QC_STK_ID = '22222222-2222-4222-8222-222222222222';
  const OTHER_STK_ID = '33333333-3333-4333-8333-333333333333';
  const PROJECT_ID = '44444444-4444-4444-8444-444444444444';

  let tasksDb: Map<string, SimulatedTaskRow>;
  let taskEventsLog: Array<Record<string, unknown>>;
  let dailyReportsDb: Array<Record<string, unknown>>;
  let currentActor: SimulatedActor;

  const ALLOWED_TRANSITIONS: Record<SiteTaskStatus, SiteTaskStatus[]> = {
    pending: ['in_progress', 'cancelled'],
    in_progress: ['pm_review', 'cancelled'],
    pm_review: ['qc_pending', 'approved', 'rejected'],
    qc_pending: ['approved', 'rejected'],
    rejected: ['in_progress', 'cancelled'],
    approved: ['done'],
    done: [],
    cancelled: [],
  };

  function seedTask(id: string, status: SiteTaskStatus, plannedQty = 100): SimulatedTaskRow {
    const row: SimulatedTaskRow = {
      id,
      project_id: PROJECT_ID,
      status,
      assignee_stakeholder_id: ASSIGNEE_STK_ID,
      qc_stakeholder_id: QC_STK_ID,
      planned_qty: plannedQty,
      verified_qty: null,
      progress_pct: status === 'approved' || status === 'done' ? 100 : 0,
      rejection_reason: null,
    };
    tasksDb.set(id, row);
    return row;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    tasksDb = new Map();
    taskEventsLog = [];
    dailyReportsDb = [];
    currentActor = {
      userId: 'u-pm',
      stakeholderId: ASSIGNEE_STK_ID,
      roles: ['project_manager'],
    };

    // Simulate PostgreSQL RPC boundary (025_unified_task_transition_rpc.sql & 017_site_tasks.sql)
    (supabase.rpc as unknown as ReturnType<typeof vi.fn>).mockImplementation(async (fnName: string, args?: any) => {
      if (fnName === 'rpc_site_task_transition') {
        const task = tasksDb.get(args.p_task_id);
        if (!task) {
          return { data: null, error: { message: `TASK_NOT_FOUND: Task ${args.p_task_id} does not exist` } } as any;
        }

        const fromState = task.status;
        const toState = args.p_to_state as SiteTaskStatus;
        const reason: string | null = args.p_reason ?? null;
        const verifiedQty: number | null = args.p_verified_qty ?? null;

        const isServiceRole = currentActor.userId === null;
        const isAssignee = isServiceRole || currentActor.stakeholderId === task.assignee_stakeholder_id;
        const isQcAssigned = isServiceRole || currentActor.stakeholderId === task.qc_stakeholder_id;
        const isPmOrAdmin =
          isServiceRole ||
          currentActor.roles.some((r) =>
            ['admin', 'project_manager', 'planning_manager', 'planning_engineer'].includes(r)
          );

        if (!(ALLOWED_TRANSITIONS[fromState] || []).includes(toState)) {
          return {
            data: null,
            error: { message: `INVALID_TRANSITION: Cannot transition from "${fromState}" to "${toState}"` },
          } as any;
        }

        if (fromState === 'pending' && toState === 'in_progress' && !(isAssignee || isPmOrAdmin)) {
          return {
            data: null,
            error: { message: 'FORBIDDEN: Only the assigned engineer or PM/admin can start this task' },
          } as any;
        }
        if (fromState === 'in_progress' && toState === 'pm_review' && !(isAssignee || isPmOrAdmin)) {
          return {
            data: null,
            error: { message: 'FORBIDDEN: Only the assigned engineer can submit for PM review' },
          } as any;
        }
        if (fromState === 'pm_review' && ['approved', 'qc_pending', 'rejected'].includes(toState) && !isPmOrAdmin) {
          return {
            data: null,
            error: { message: 'FORBIDDEN: Only PM/planning_manager/admin can approve, route to QC, or reject' },
          } as any;
        }
        if (fromState === 'qc_pending' && ['approved', 'rejected'].includes(toState) && !(isQcAssigned || isPmOrAdmin)) {
          return {
            data: null,
            error: { message: 'FORBIDDEN: Only the assigned QC inspector or PM/admin can decide QC outcome' },
          } as any;
        }
        if (fromState === 'rejected' && toState === 'in_progress' && !(isAssignee || isPmOrAdmin)) {
          return {
            data: null,
            error: { message: 'FORBIDDEN: Only the assigned engineer or PM/admin can restart after rejection' },
          } as any;
        }
        if (fromState === 'approved' && toState === 'done' && !isPmOrAdmin) {
          return {
            data: null,
            error: { message: 'FORBIDDEN: Only PM/admin can close a task' },
          } as any;
        }
        if (toState === 'cancelled' && !isPmOrAdmin) {
          return {
            data: null,
            error: { message: 'FORBIDDEN: Only PM/planning_manager/admin can cancel a task' },
          } as any;
        }
        if (['rejected', 'cancelled'].includes(toState) && (!reason || reason.trim() === '')) {
          return {
            data: null,
            error: { message: 'REASON_REQUIRED: A non-empty reason is mandatory for rejection or cancellation' },
          } as any;
        }

        const newProgress =
          verifiedQty !== null
            ? task.planned_qty > 0
              ? Math.min(100, Math.max(0, (verifiedQty / task.planned_qty) * 100))
              : task.progress_pct
            : ['approved', 'done'].includes(toState)
              ? 100
              : task.progress_pct;

        task.status = toState;
        task.progress_pct = Number(newProgress.toFixed(2));
        if (toState === 'rejected') task.rejection_reason = reason;
        if (verifiedQty !== null) task.verified_qty = verifiedQty;

        taskEventsLog.push({
          task_id: task.id,
          from_state: fromState,
          to_state: toState,
          reason,
          payload: args.p_evidence_payload,
        });

        return {
          data: {
            success: true,
            task_id: task.id,
            from_state: fromState,
            to_state: toState,
            progress_pct: task.progress_pct,
          },
          error: null,
        } as any;
      }

      if (fnName === 'rpc_create_report') {
        const siteTaskId = (args.p_site_task_id || '').trim();
        if (!siteTaskId) {
          return {
            data: null,
            error: { message: 'SITE_TASK_REQUIRED: لا يمكن حفظ التقرير اليومي بدون ربطه بمهمة موقع مفتوحة' },
          } as any;
        }
        const task = tasksDb.get(siteTaskId);
        if (!task || task.status === 'cancelled' || task.status === 'done') {
          return {
            data: null,
            error: { message: 'SITE_TASK_CLOSED: لا يمكن ربط التقرير بمهمة مغلقة أو ملغاة' },
          } as any;
        }
        if (task.status === 'pending') {
          task.status = 'in_progress';
        }
        const created = {
          id: `rep-${dailyReportsDb.length + 1}`,
          report_no: `DPR-00${dailyReportsDb.length + 1}`,
          project_id: args.p_project_id,
          progress_date: args.p_progress_date,
          discipline: args.p_discipline,
          site_task_id: siteTaskId,
        };
        dailyReportsDb.push(created);
        return { data: created, error: null } as any;
      }

      return { data: null, error: null } as any;
    });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      const builder: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        insert: vi.fn().mockResolvedValue({ data: [], error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        single: vi.fn().mockImplementation(async () => {
          if (table === 'pm_daily_progress' && dailyReportsDb.length > 0) {
            return { data: dailyReportsDb[dailyReportsDb.length - 1], error: null };
          }
          return { data: null, error: null };
        }),
      };
      return builder;
    });
  });

  describe('1. Forbidden State Jumps Across the 8-State Machine', () => {
    it.each<[string, SiteTaskStatus, SiteTaskStatus]>([
      ['STATE-01', 'pending', 'done'],
      ['STATE-02', 'in_progress', 'approved'],
      ['STATE-03', 'pending', 'approved'],
      ['STATE-04', 'rejected', 'done'],
      ['STATE-05', 'approved', 'in_progress'],
      ['STATE-06', 'done', 'in_progress'],
      ['STATE-07', 'cancelled', 'pending'],
    ])(
      '%s: SiteTaskService.transitionTaskState rejects illegal jump from "%s" to "%s"',
      async (_code, fromState, toState) => {
        const taskId = `00000000-0000-4000-8000-00000000010${fromState.length}`;
        seedTask(taskId, fromState);

        await expect(
          SiteTaskService.transitionTaskState({
            taskId,
            toState,
            reason: 'Attempted state bypass',
          })
        ).rejects.toMatchObject({
          message: `INVALID_TRANSITION: Cannot transition from "${fromState}" to "${toState}"`,
        });

        expect(tasksDb.get(taskId)?.status).toBe(fromState);
        expect(taskEventsLog).toHaveLength(0);
      }
    );

    it('walks the full legal lifecycle pending -> in_progress -> pm_review -> qc_pending -> approved -> done and logs immutable events', async () => {
      const taskId = '00000000-0000-4000-8000-000000000199';
      seedTask(taskId, 'pending', 200);

      currentActor = { userId: 'u-eng', stakeholderId: ASSIGNEE_STK_ID, roles: ['site_engineer'] };
      await SiteTaskService.transitionTaskState({ taskId, toState: 'in_progress' });
      await SiteTaskService.transitionTaskState({ taskId, toState: 'pm_review', verifiedQty: 150 });
      expect(tasksDb.get(taskId)?.progress_pct).toBe(75);

      currentActor = { userId: 'u-pm', stakeholderId: OTHER_STK_ID, roles: ['project_manager'] };
      await SiteTaskService.transitionTaskState({ taskId, toState: 'qc_pending' });

      currentActor = { userId: 'u-qc', stakeholderId: QC_STK_ID, roles: ['qc_inspector'] };
      await SiteTaskService.transitionTaskState({ taskId, toState: 'approved' });
      expect(tasksDb.get(taskId)?.progress_pct).toBe(100);

      currentActor = { userId: 'u-pm', stakeholderId: OTHER_STK_ID, roles: ['project_manager'] };
      const finalRes = await SiteTaskService.transitionTaskState({ taskId, toState: 'done' });

      expect(finalRes).toMatchObject({ success: true, from_state: 'approved', to_state: 'done' });
      expect(tasksDb.get(taskId)?.status).toBe('done');
      expect(taskEventsLog).toHaveLength(5);
    });
  });

  describe('2. Mandatory Written Reason for Rejection, Cancellation & Replanning', () => {
    it.each<[string, SiteTaskStatus, SiteTaskStatus, string | undefined]>([
      ['STATE-08', 'pm_review', 'rejected', undefined],
      ['STATE-09', 'pm_review', 'rejected', '    \t   '],
      ['STATE-10', 'in_progress', 'cancelled', ''],
    ])(
      '%s: rejects "%s" -> "%s" when reason is missing or whitespace',
      async (_code, fromState, toState, blankReason) => {
        const taskId = '00000000-0000-4000-8000-000000000201';
        seedTask(taskId, fromState);

        await expect(
          SiteTaskService.transitionTaskState({
            taskId,
            toState,
            reason: blankReason,
          })
        ).rejects.toThrow(/REASON_REQUIRED/);

        expect(tasksDb.get(taskId)?.status).toBe(fromState);
        expect(taskEventsLog).toHaveLength(0);
      }
    );

    it('STATE-11: records rejection reason and allows loop-back rejected -> in_progress', async () => {
      const taskId = '00000000-0000-4000-8000-000000000204';
      seedTask(taskId, 'pm_review');

      const rejectRes = await SiteTaskService.transitionTaskState({
        taskId,
        toState: 'rejected',
        reason: 'عدم مطابقة مواصفات العزل مع المخططات المعتمدة (Defective waterproofing)',
      });

      expect(rejectRes).toMatchObject({ success: true, from_state: 'pm_review', to_state: 'rejected' });
      expect(tasksDb.get(taskId)?.rejection_reason).toContain('عدم مطابقة مواصفات العزل');

      currentActor = { userId: 'u-eng', stakeholderId: ASSIGNEE_STK_ID, roles: ['site_engineer'] };
      const reopenRes = await SiteTaskService.transitionTaskState({
        taskId,
        toState: 'in_progress',
      });

      expect(reopenRes).toMatchObject({ success: true, from_state: 'rejected', to_state: 'in_progress' });
      expect(tasksDb.get(taskId)?.status).toBe('in_progress');
    });

    it('rejects SiteTaskService.replanTask when reason is whitespace-only', async () => {
      await expect(
        SiteTaskService.replanTask({
          taskId: '00000000-0000-4000-8000-000000000209',
          newPlannedStart: '2020-01-01',
          newPlannedFinish: '2020-01-10',
          reason: '   ',
        })
      ).rejects.toThrow(/REASON_REQUIRED/);
    });
  });

  describe('3. Role Gates per State Transition', () => {
    it('STATE-12: blocks non-assignee site_engineer from starting a pending task', async () => {
      const taskId = '00000000-0000-4000-8000-000000000301';
      seedTask(taskId, 'pending');
      currentActor = { userId: 'u-stranger', stakeholderId: OTHER_STK_ID, roles: ['site_engineer'] };

      await expect(
        SiteTaskService.transitionTaskState({ taskId, toState: 'in_progress' })
      ).rejects.toMatchObject({
        message: 'FORBIDDEN: Only the assigned engineer or PM/admin can start this task',
      });
      expect(tasksDb.get(taskId)?.status).toBe('pending');
    });

    it('STATE-13: blocks site_engineer from approving a pm_review task', async () => {
      const taskId = '00000000-0000-4000-8000-000000000302';
      seedTask(taskId, 'pm_review');
      currentActor = { userId: 'u-eng', stakeholderId: ASSIGNEE_STK_ID, roles: ['site_engineer'] };

      await expect(
        SiteTaskService.transitionTaskState({ taskId, toState: 'approved' })
      ).rejects.toMatchObject({
        message: 'FORBIDDEN: Only PM/planning_manager/admin can approve, route to QC, or reject',
      });
      expect(tasksDb.get(taskId)?.status).toBe('pm_review');
    });

    it('STATE-14: blocks site_engineer from cancelling an in_progress task even with a reason', async () => {
      const taskId = '00000000-0000-4000-8000-000000000303';
      seedTask(taskId, 'in_progress');
      currentActor = { userId: 'u-eng', stakeholderId: ASSIGNEE_STK_ID, roles: ['site_engineer'] };

      await expect(
        SiteTaskService.transitionTaskState({
          taskId,
          toState: 'cancelled',
          reason: 'Project scope descoped',
        })
      ).rejects.toMatchObject({
        message: 'FORBIDDEN: Only PM/planning_manager/admin can cancel a task',
      });
      expect(tasksDb.get(taskId)?.status).toBe('in_progress');
    });

    it('blocks unassigned qc_inspector from approving qc_pending task while allowing assigned QC', async () => {
      const taskId = '00000000-0000-4000-8000-000000000304';
      seedTask(taskId, 'qc_pending');

      currentActor = { userId: 'u-other-qc', stakeholderId: OTHER_STK_ID, roles: ['qc_inspector'] };
      await expect(
        SiteTaskService.transitionTaskState({ taskId, toState: 'approved' })
      ).rejects.toMatchObject({
        message: 'FORBIDDEN: Only the assigned QC inspector or PM/admin can decide QC outcome',
      });

      currentActor = { userId: 'u-assigned-qc', stakeholderId: QC_STK_ID, roles: ['qc_inspector'] };
      const res = await SiteTaskService.transitionTaskState({ taskId, toState: 'approved' });
      expect(res.to_state).toBe('approved');
    });
  });

  describe('4. SITE_TASK_REQUIRED Invariant & DailyProgressService Integration', () => {
    it.each<[string, string | undefined]>([
      ['STATE-15', undefined],
      ['STATE-16', ''],
      ['STATE-17', '   \n\t  '],
    ])(
      '%s: DailyProgressService.createDailyReport rejects report when site_task_id is %j',
      async (_code, invalidTaskId) => {
        await expect(
          DailyProgressService.createDailyReport({
            project_id: PROJECT_ID,
            progress_date: '2020-01-01',
            discipline: 'civil',
            site_task_id: invalidTaskId,
          })
        ).rejects.toThrow('SITE_TASK_REQUIRED: لا يمكن حفظ التقرير اليومي بدون ربطه بمهمة موقع مفتوحة');

        expect(dailyReportsDb).toHaveLength(0);
      }
    );

    it('STATE-18: creates daily progress report when linked to an open task and auto-promotes pending -> in_progress', async () => {
      const openTaskId = '019a2e6f-4091-7290-a5fb-39bbf87c1265';
      seedTask(openTaskId, 'pending');

      const created = await DailyProgressService.createDailyReport({
        project_id: PROJECT_ID,
        progress_date: '2020-01-01',
        discipline: 'civil',
        manpower_count: 14,
        site_task_id: openTaskId,
      });

      expect(created).toMatchObject({
        project_id: PROJECT_ID,
        site_task_id: openTaskId,
      });
      expect(tasksDb.get(openTaskId)?.status).toBe('in_progress');
      expect(OPEN_SITE_TASK_STATUSES).not.toContain('cancelled');

      const wirePayload = buildCreateReportPayload(
        { project_id: PROJECT_ID, progress_date: '2020-01-01', discipline: 'civil', manpower_count: 14 },
        openTaskId
      );
      expect(Object.keys(wirePayload)).toHaveLength(10);
      expect(wirePayload.p_site_task_id).toBe(openTaskId);
    });

    it('rejects daily progress report referencing a cancelled task with SITE_TASK_CLOSED', async () => {
      const cancelledTaskId = '019a2e6f-4091-7290-a5fb-39bbf87c9999';
      seedTask(cancelledTaskId, 'cancelled');

      await expect(
        DailyProgressService.createDailyReport({
          project_id: PROJECT_ID,
          progress_date: '2020-01-01',
          discipline: 'civil',
          site_task_id: cancelledTaskId,
        })
      ).rejects.toThrow(/SITE_TASK_CLOSED/);
    });
  });

  describe('5. Migration 025 Authoritative SQL Contract Verification', () => {
    it('verifies rpc_site_task_transition in 025_unified_task_transition_rpc.sql matches 5-arg UUID signature and immutable audit trail', () => {
      const sql025 = fs.readFileSync(
        path.resolve(process.cwd(), 'supabase/migrations/025_unified_task_transition_rpc.sql'),
        'utf8'
      );

      expect(sql025).toMatch(
        /CREATE OR REPLACE FUNCTION public\.rpc_site_task_transition\(\s*p_task_id UUID,\s*p_to_state TEXT,\s*p_reason TEXT DEFAULT NULL,\s*p_evidence_payload JSONB DEFAULT '\{\}'::jsonb,\s*p_verified_qty NUMERIC DEFAULT NULL\s*\)\s*RETURNS JSONB/i
      );
      expect(sql025).toContain('INSERT INTO public.pm_task_events');
      expect(sql025).not.toMatch(/UPDATE\s+public\.pm_task_events/i);
      expect(sql025).not.toMatch(/DELETE\s+FROM\s+public\.pm_task_events/i);
    });
  });
});
