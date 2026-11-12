import { supabase } from '@/lib/supabase';
import { SiteTask } from './siteTask.service';

export interface TaskExceptionKPIs {
  totalTasks: number;
  releasedTasks: number;
  completedTasks: number;
  releasedCompletionPct: number;
  onTimeVerificationPct: number;
  pmReviewAgingCount: number;
  qcInspectionAgingCount: number;
  reworkCount: number;
  unassignedReleasedCount: number;
  blockedCount: number;
}

export interface TaskExceptionRow {
  taskId: string;
  projectCode?: string;
  taskTitle: string;
  taskType: string;
  status: string;
  ownerName: string;
  plannedFinish: string | null;
  overdueDays: number;
  stage: string;
  blockerTitle?: string | null;
  rejectionReason?: string | null;
}

export class TaskExceptionsService {
  static async calculateKPIs(projectId: string): Promise<TaskExceptionKPIs> {
    if (!projectId) {
      return {
        totalTasks: 0,
        releasedTasks: 0,
        completedTasks: 0,
        releasedCompletionPct: 0,
        onTimeVerificationPct: 0,
        pmReviewAgingCount: 0,
        qcInspectionAgingCount: 0,
        reworkCount: 0,
        unassignedReleasedCount: 0,
        blockedCount: 0,
      };
    }

    const { data: tasks = [] } = await supabase
      .from('pm_site_tasks')
      .select('*')
      .eq('project_id', projectId);

    const { data: inspections = [] } = await supabase
      .from('pm_inspection_requests')
      .select('*')
      .eq('project_id', projectId);

    const { data: constraints = [] } = await supabase
      .from('pm_task_constraints')
      .select('*')
      .eq('project_id', projectId)
      .eq('status', 'open');

    const total = tasks?.length || 0;
    const released = tasks?.filter((t) => t.status !== 'pending' && t.status !== 'cancelled') || [];
    // Canonical states only (migration 025): 'verified'/'closed' are never task statuses.
    const completed = tasks?.filter((t) => ['approved', 'done'].includes(t.status)) || [];

    const releasedCompletionPct = released.length > 0 ? Math.round((completed.length / released.length) * 100) : 0;

    // On time verification
    const onTimeVerified = completed.filter((t) => {
      if (!t.actual_finish_at || (!t.planned_finish_at && !t.due_date)) return true;
      const actFinish = new Date(t.actual_finish_at).getTime();
      const planFinish = new Date(t.planned_finish_at || t.due_date).getTime();
      return actFinish <= planFinish + 86400000;
    });
    const onTimeVerificationPct = completed.length > 0 ? Math.round((onTimeVerified.length / completed.length) * 100) : 100;

    // PM review aging
    const pmReviewAging = tasks?.filter((t) => t.status === 'pm_review') || [];

    // QC aging
    const now = new Date().toISOString().slice(0, 10);
    const qcAging = inspections?.filter((i) => i.status === 'pending' && i.required_at < now) || [];

    // Rework count
    const rework = tasks?.filter((t) => t.status === 'rejected') || [];

    // Unassigned released
    const unassignedReleased = released.filter((t) => !t.assignee_stakeholder_id);

    return {
      totalTasks: total,
      releasedTasks: released.length,
      completedTasks: completed.length,
      releasedCompletionPct,
      onTimeVerificationPct,
      pmReviewAgingCount: pmReviewAging.length,
      qcInspectionAgingCount: qcAging.length,
      reworkCount: rework.length,
      unassignedReleasedCount: unassignedReleased.length,
      blockedCount: constraints?.length || 0,
    };
  }

  static async getRankedExceptions(projectId: string): Promise<TaskExceptionRow[]> {
    if (!projectId) return [];

    const { data: tasks = [] } = await supabase
      .from('pm_site_tasks')
      .select('*, stakeholders(name_ar)')
      .eq('project_id', projectId);

    const { data: constraints = [] } = await supabase
      .from('pm_task_constraints')
      .select('*')
      .eq('project_id', projectId)
      .eq('status', 'open');

    const constraintMap = new Map<string, string>();
    for (const c of (constraints || [])) {
      constraintMap.set(c.task_id, c.title);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const exceptionRows: TaskExceptionRow[] = [];

    for (const t of (tasks || [])) {
      const isDone = ['approved', 'done', 'cancelled'].includes(t.status);
      const isPmReview = t.status === 'pm_review';
      const isRework = t.status === 'rejected';
      const hasBlocker = constraintMap.has(t.id);

      let finishDate: Date | null = null;
      if (t.planned_finish_at || t.due_date || t.planned_date) {
        finishDate = new Date(t.planned_finish_at || t.due_date || t.planned_date);
      }

      let overdueDays = 0;
      if (finishDate && !isDone) {
        const diff = Math.floor((today.getTime() - finishDate.getTime()) / 86400000);
        if (diff > 0) overdueDays = diff;
      }

      const isException = overdueDays > 0 || isPmReview || isRework || hasBlocker;

      if (isException) {
        let stageLabel = 'قيد التنفيذ';
        if (isPmReview) stageLabel = 'مراجعة مدير المشروع';
        else if (isRework) stageLabel = 'إعادة عمل (Rework)';
        else if (t.status === 'qc_pending' || t.status === 'inspection_pending') stageLabel = 'بانتظار فحص الجودة WIR';
        else if (overdueDays > 0) stageLabel = 'متأخر عن الموعد';

        exceptionRows.push({
          taskId: t.id,
          taskTitle: t.title_ar,
          taskType: t.task_type,
          status: t.status,
          ownerName: t.stakeholders?.name_ar || 'غير محدد',
          plannedFinish: t.planned_finish_at || t.due_date || t.planned_date,
          overdueDays,
          stage: stageLabel,
          blockerTitle: constraintMap.get(t.id) || null,
          rejectionReason: t.rejection_reason || null,
        });
      }
    }

    // Sort: highest overdue days and critical blockers first
    return exceptionRows.sort((a, b) => b.overdueDays - a.overdueDays);
  }
}
