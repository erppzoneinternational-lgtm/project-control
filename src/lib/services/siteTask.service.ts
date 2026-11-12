import { supabase } from '@/lib/supabase';
import { appCache, CACHE_KEYS, TTL } from '@/lib/cache';
import { logger } from '@/lib/logger';
import { CostCode } from '@/types/boq';

/* ── Types ────────────────────────────────────────────────────────
 * Mirrors public.pm_site_tasks (migration 017_site_tasks.sql).
 * Workflow (owner-locked): pending → in_progress → pm_review →
 * qc_pending → approved → done. Rejection at any stage returns the
 * task to 'rejected' with a mandatory written reason.
 * ────────────────────────────────────────────────────────────────*/
export type SiteTaskStatus =
  | 'pending'
  | 'in_progress'
  | 'pm_review'
  | 'qc_pending'
  | 'approved'
  | 'rejected'
  | 'done'
  | 'cancelled';

export type SiteTaskPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface SiteTask {
  id: string;
  project_id: string;
  task_type: 'execution' | 'inspection' | 'material_delivery' | 'handover' | 'general';
  title_ar: string;
  description: string | null;
  boq_item_id: string | null;
  cost_code_id?: string | null;
  cost_code?: CostCode | null;
  activity_id: string | null;
  zone_id: string | null;
  assignee_stakeholder_id: string | null;
  qc_stakeholder_id: string | null;
  planned_date: string;
  due_date: string | null;
  inspection_date: string | null;
  status: SiteTaskStatus;
  priority: SiteTaskPriority;
  rejection_reason: string | null;
  progress_pct: number;
  progress_verified?: boolean | null;
  task_code?: string | null;
  planned_qty?: number | null;
  actual_qty?: number | null;
  unit?: string | null;
  planned_start?: string | null;
  planned_finish?: string | null;
  actual_start?: string | null;
  actual_finish?: string | null;
  created_at?: string;
  updated_at?: string;
  zone?: { id?: string; name_ar?: string; name_en?: string | null } | null;
  assignee?: { id?: string; name_ar?: string; name_en?: string | null; role?: string | null } | null;
  qc_inspector?: { id?: string; name_ar?: string; name_en?: string | null; role?: string | null } | null;
  boq_item?: { id?: string; item_code?: string; description_ar?: string; cost_code?: CostCode | null } | null;
}

export interface SiteTaskZone {
  id: string;
  name_ar: string;
  parent_zone_id: string | null;
}

/** Statuses the assignee can still work on (report daily progress / act). */
export const OPEN_SITE_TASK_STATUSES: SiteTaskStatus[] = [
  'pending',
  'in_progress',
  'pm_review',
  'qc_pending',
  'approved',
  'rejected',
  'done',
];

/** Date-bucket labels for "my tasks" grouping. */
export interface SiteTaskGroups<T = SiteTask> {
  overdue: T[];
  today: T[];
  tomorrow: T[];
  later: T[];
}

/** One tree node: a root zone, its sub-zones, and the tasks hanging off each. */
export interface ZoneTreeNode {
  zone: SiteTaskZone;
  children: ZoneTreeNode[];
  tasks: SiteTask[];
}

const TASK_COLUMNS = `
  id, project_id, task_type, title_ar, description, boq_item_id, activity_id,
  zone_id, assignee_stakeholder_id, qc_stakeholder_id, planned_date, due_date,
  inspection_date, status, priority, rejection_reason, progress_pct, created_at, updated_at
`;

export class SiteTaskService {
  /**
   * Get single site task by ID with relations.
   */
  static async getTaskById(taskId: string): Promise<SiteTask | null> {
    if (!taskId) return null;
    try {
      const { data, error } = await supabase
        .from('pm_site_tasks')
        .select(`
          *,
          zone:pm_zones(name_ar, name_en),
          assignee:stakeholders!pm_site_tasks_assignee_stakeholder_id_fkey(id, name_ar, name_en, role),
          qc_inspector:stakeholders!pm_site_tasks_qc_stakeholder_id_fkey(id, name_ar, name_en, role),
          cost_code:pm_cost_codes(id, code, name_ar, name_en, category, prefix),
          boq_item:pm_boq_items(id, item_code, description_ar, cost_code:pm_cost_codes(id, code, name_ar, name_en, category, prefix))
        `)
        .eq('id', taskId)
        .maybeSingle();

      if (error) {
        // Fallback without FK relations if join fails
        const { data: fallback, error: fallbackError } = await supabase
          .from('pm_site_tasks')
          .select('*')
          .eq('id', taskId)
          .maybeSingle();
        if (fallbackError) throw fallbackError;
        return fallback as SiteTask;
      }
      return data as SiteTask;
    } catch (err) {
      logger.error('Failed to get site task by ID', { detail: err, taskId });
      return null;
    }
  }

  /**
   * Assign or change cost code for a site task.
   */
  static async assignCostCode(taskId: string, costCodeId: string | null): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('pm_site_tasks')
        .update({
          cost_code_id: costCodeId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      if (error) throw error;
      return true;
    } catch (err) {
      logger.error('SiteTaskService.assignCostCode error:', { detail: err, taskId });
      return false;
    }
  }

  /**
   * Resolve the signed-in auth user to their stakeholders.id.
   * Checks durable auth_user_id first, then falls back to email.
   */
  static async resolveMyStakeholderId(userEmail?: string | null, userId?: string | null): Promise<string | null> {
    try {
      if (userId) {
        const { data } = await supabase
          .from('stakeholders')
          .select('id')
          .eq('auth_user_id', userId)
          .limit(1)
          .maybeSingle();
        if (data?.id) return data.id;
      }

      const email = userEmail?.trim().toLowerCase();
      if (!email) return null;

      const { data, error } = await supabase
        .from('stakeholders')
        .select('id')
        .ilike('email', email)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn('SiteTaskService.resolveMyStakeholderId error:', error);
        return null;
      }
      return data?.id ?? null;
    } catch (err) {
      console.warn('SiteTaskService.resolveMyStakeholderId exception:', err);
      return null;
    }
  }

  /**
   * Transition task state via secure RPC with mandatory audit log & reason checks.
   */
  static async transitionTaskState(params: {
    taskId: string;
    toState: SiteTaskStatus;
    reason?: string;
    evidencePayload?: Record<string, unknown>;
    verifiedQty?: number;
  }): Promise<{ success: boolean; from_state?: string; to_state?: string }> {
    const { taskId, toState, reason, evidencePayload, verifiedQty } = params;
    if (['rejected', 'cancelled'].includes(toState) && (!reason || !reason.trim())) {
      throw new Error('REASON_REQUIRED: سبب الرفض أو الإلغاء إلزامي');
    }

    const { data, error } = await supabase.rpc('rpc_site_task_transition', {
      p_task_id: taskId,
      p_to_state: toState,
      p_reason: reason || null,
      p_evidence_payload: evidencePayload || {},
      p_verified_qty: verifiedQty ?? null,
    });
    if (error) throw error;
    appCache.invalidate('siteTasks:');
    return data;
  }

  /**
   * Reassign task to a new stakeholder with audit log.
   */
  static async reassignTask(params: {
    taskId: string;
    newStakeholderId: string;
    role?: string;
    reason?: string;
  }): Promise<void> {
    const { data, error } = await supabase.rpc('rpc_reassign_task', {
      p_task_id: params.taskId,
      p_new_stakeholder_id: params.newStakeholderId,
      p_role: params.role || 'primary_assignee',
      p_reason: params.reason || null,
    });
    if (error) throw error;
    appCache.invalidate('siteTasks:');
  }

  /**
   * Replan task dates (preserves baseline dates and increments revision).
   */
  static async replanTask(params: {
    taskId: string;
    newPlannedStart: string;
    newPlannedFinish: string;
    reason: string;
  }): Promise<void> {
    if (!params.reason || !params.reason.trim()) {
      throw new Error('REASON_REQUIRED: سبب إعادة الجدولة إلزامي');
    }
    const { data, error } = await supabase.rpc('rpc_replan_task', {
      p_task_id: params.taskId,
      p_new_planned_start: params.newPlannedStart,
      p_new_planned_finish: params.newPlannedFinish,
      p_reason: params.reason,
    });
    if (error) throw error;
    appCache.invalidate('siteTasks:');
  }

  /**
   * Open tasks assigned to me in a project (site engineer's "my tasks").
   */
  static async getTasksForAssignee(
    projectId: string,
    stakeholderId: string
  ): Promise<SiteTask[]> {
    const key = CACHE_KEYS.siteTasks.assignee(projectId, stakeholderId);
    return appCache.getOrFetch(key, TTL.siteTasks, async () => {
      try {
        const { data, error } = await supabase
          .from('pm_site_tasks')
          .select(TASK_COLUMNS)
          .eq('project_id', projectId)
          .eq('assignee_stakeholder_id', stakeholderId)
          .in('status', OPEN_SITE_TASK_STATUSES)
          .order('planned_date', { ascending: true });

        if (error) {
          console.warn('SiteTaskService.getTasksForAssignee error:', error);
          return [];
        }
        return (data || []) as SiteTask[];
      } catch (err) {
        console.warn('SiteTaskService.getTasksForAssignee exception:', err);
        return [];
      }
    });
  }

  /**
   * All open site tasks for a project (supervisor/admin view).
   */
  static async getTasksForProject(projectId: string): Promise<SiteTask[]> {
    const key = `siteTasks:project:${projectId}`;
    return appCache.getOrFetch(key, TTL.siteTasks, async () => {
      try {
        const { data, error } = await supabase
          .from('pm_site_tasks')
          .select(TASK_COLUMNS)
          .eq('project_id', projectId)
          .in('status', OPEN_SITE_TASK_STATUSES)
          .order('planned_date', { ascending: true });

        if (error) {
          console.warn('SiteTaskService.getTasksForProject error:', error);
          return [];
        }
        return (data || []) as SiteTask[];
      } catch (err) {
        console.warn('SiteTaskService.getTasksForProject exception:', err);
        return [];
      }
    });
  }

  /**
   * Alias for getTasksForProject for backward and caller compatibility.
   */
  static async getTasksByProject(projectId: string): Promise<SiteTask[]> {
    return this.getTasksForProject(projectId);
  }

  /**
   * Tasks waiting for my QC receipt/decision in a project.
   */
  static async getQcReceivables(
    projectId: string,
    stakeholderId: string
  ): Promise<SiteTask[]> {
    const key = CACHE_KEYS.siteTasks.qc(projectId, stakeholderId);
    return appCache.getOrFetch(key, TTL.siteTasks, async () => {
      try {
        const { data, error } = await supabase
          .from('pm_site_tasks')
          .select(TASK_COLUMNS)
          .eq('project_id', projectId)
          .eq('qc_stakeholder_id', stakeholderId)
          .eq('status', 'qc_pending')
          .order('inspection_date', { ascending: true, nullsFirst: false })
          .order('planned_date', { ascending: true });

        if (error) {
          console.warn('SiteTaskService.getQcReceivables error:', error);
          return [];
        }
        return (data || []) as SiteTask[];
      } catch (err) {
        console.warn('SiteTaskService.getQcReceivables exception:', err);
        return [];
      }
    });
  }

  /**
   * Zone tree flat list for a project (roots + sub-zones via parent_zone_id).
   */
  static async getZones(projectId: string): Promise<SiteTaskZone[]> {
    const key = CACHE_KEYS.siteTasks.zones(projectId);
    return appCache.getOrFetch(key, TTL.siteTasks, async () => {
      try {
        const { data, error } = await supabase
          .from('pm_zones')
          .select('id, name_ar, parent_zone_id')
          .eq('project_id', projectId)
          .order('sort_order', { ascending: true });

        if (error) {
          console.warn('SiteTaskService.getZones error:', error);
          return [];
        }
        return (data || []) as SiteTaskZone[];
      } catch (err) {
        console.warn('SiteTaskService.getZones exception:', err);
        return [];
      }
    });
  }

  /** Drop every site-task cache entry after a mutation. */
  static invalidateProjectCache(): void {
    appCache.invalidate('siteTasks:');
  }
}

/* ══ Pure helpers (unit-tested without mocks) ═════════════════════ */

/**
 * Group open tasks into Overdue / Today / Tomorrow / Later buckets
 * against a reference date (default: today).
 */
export function groupSiteTasksByDate<T extends Pick<SiteTask, 'planned_date'>>(
  tasks: T[],
  referenceDate?: Date
): SiteTaskGroups<T> {
  const ref = referenceDate ? new Date(referenceDate) : new Date();
  ref.setHours(0, 0, 0, 0);

  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const todayIso = iso(ref);
  const tomorrowIso = iso(new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() + 1));

  const groups: SiteTaskGroups<T> = { overdue: [], today: [], tomorrow: [], later: [] };
  for (const task of tasks) {
    if (task.planned_date < todayIso) groups.overdue.push(task);
    else if (task.planned_date === todayIso) groups.today.push(task);
    else if (task.planned_date === tomorrowIso) groups.tomorrow.push(task);
    else groups.later.push(task);
  }
  return groups;
}

/**
 * Build the Lagoon → pump-room tree: root zones with nested sub-zones,
 * tasks attached to the zone they belong to. Tasks whose zone is missing
 * land under the synthetic 'unzoned' node id.
 */
export function buildZoneTree(
  tasks: Pick<SiteTask, 'zone_id'>[],
  zones: SiteTaskZone[]
): ZoneTreeNode[] {
  const UNZONED_ID = '__unzoned__';
  const tasksByZone = new Map<string, typeof tasks>();
  for (const task of tasks) {
    const zid = task.zone_id || UNZONED_ID;
    const bucket = tasksByZone.get(zid) || [];
    bucket.push(task as SiteTask);
    tasksByZone.set(zid, bucket);
  }

  const makeNode = (zone: SiteTaskZone): ZoneTreeNode => ({
    zone,
    children: [],
    tasks: (tasksByZone.get(zone.id) || []) as SiteTask[],
  });

  const roots: ZoneTreeNode[] = [];
  const byId = new Map<string, ZoneTreeNode>();

  for (const zone of zones) {
    byId.set(zone.id, makeNode(zone));
  }
  for (const zone of zones) {
    const node = byId.get(zone.id)!;
    const parent = zone.parent_zone_id ? byId.get(zone.parent_zone_id) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }

  const unzoned = tasksByZone.get(UNZONED_ID);
  if (unzoned?.length) {
    roots.push({
      zone: { id: UNZONED_ID, name_ar: 'بدون منطقة', parent_zone_id: null },
      children: [],
      tasks: unzoned as SiteTask[],
    });
  }

  // Only keep nodes that actually hold tasks somewhere beneath them.
  const hasWork = (node: ZoneTreeNode): boolean =>
    node.tasks.length > 0 || node.children.some(hasWork);

  const pruned: ZoneTreeNode[] = [];
  for (const node of roots) {
    node.children = node.children.filter(hasWork);
    if (hasWork(node)) pruned.push(node);
  }
  return pruned;
}
