import { supabase } from '@/lib/supabase';
import { appCache, TTL } from '@/lib/cache';
import {
  DeliverableItem,
  ToProgressLog,
  ToProgressStatus,
  UnifiedObstructionType,
} from '@/types/planning';

export interface CreateToProgressLogDTO {
  id?: string;
  deliverable_item_id: string;
  project_id: string;
  stakeholder_id?: string;
  logged_by?: string;
  logged_by_stakeholder_id?: string | null;
  progress_pct: number;
  work_description?: string;
  notes?: string | null;
  hours_spent?: number | null;
  obstruction_type?: UnifiedObstructionType | string | null;
  obstruction_notes?: string | null;
  log_date?: string; // YYYY-MM-DD
}

export interface ToApprovalQueueItem {
  id?: string;
  log: ToProgressLog;
  deliverable_item: DeliverableItem;
  deliverable: {
    id: string;
    ref_code: string;
    title_ar: string;
    project_id: string;
    project_name?: string;
  };
  engineer: {
    id: string;
    name_ar: string;
    employee_code?: string;
  };
}

export class TOProgressService {
  /**
   * Fetch deliverable items assigned to a specific TO Engineer (or all items for TO Manager).
   */
  static async getAssignedTasks(
    stakeholderId: string,
    projectId?: string
  ): Promise<DeliverableItem[]> {
    if (!stakeholderId) return [];
    const cacheKey = `toProgress:tasks:${stakeholderId}:${projectId || 'all'}`;

    return appCache.getOrFetch(cacheKey, TTL.deliverables || 30000, async () => {
      try {
        // Resolve stakeholder IDs if passed an auth_user_id or stakeholder_id
        const stakeholderIds = [stakeholderId];
        const { data: stk } = await supabase
          .from('stakeholders')
          .select('id')
          .or(`id.eq.${stakeholderId},auth_user_id.eq.${stakeholderId}`);

        if (stk && stk.length > 0) {
          for (const s of stk) {
            if (s.id && !stakeholderIds.includes(s.id)) {
              stakeholderIds.push(s.id);
            }
          }
        }

        let query = supabase
          .from('pm_deliverable_items')
          .select(`
            *,
            deliverable:pm_deliverables(
              id,
              ref_code,
              title_ar,
              kind,
              project_id,
              status,
              priority,
              due_date
            ),
            assigned_stakeholder:stakeholders!assigned_stakeholder_id(
              id,
              name_ar,
              name_en,
              role,
              employee_code
            )
          `)
          .in('assigned_stakeholder_id', stakeholderIds)
          .order('created_at', { ascending: false });

        if (projectId && projectId !== 'all') {
          query = query.eq('deliverable.project_id', projectId);
        }

        const { data, error } = await query;

        if (error) {
          console.warn('TOProgressService.getAssignedTasks error:', error);
          return [];
        }

        const list = (data || []) as DeliverableItem[];
        if (projectId && projectId !== 'all') {
          return list.filter((item) => item.deliverable && item.deliverable.project_id === projectId);
        }

        return list;
      } catch (err) {
        console.warn('TOProgressService.getAssignedTasks exception:', err);
        return [];
      }
    });
  }

  /**
   * Log daily item-level progress (0-100%) and optional obstruction.
   */
  static async logProgress(dto: CreateToProgressLogDTO): Promise<ToProgressLog | null> {
    return this.logDailyProgress(dto);
  }

  static async logDailyProgress(dto: CreateToProgressLogDTO): Promise<ToProgressLog | null> {
    if (dto.progress_pct < 0 || dto.progress_pct > 100) {
      throw new Error('INVALID_PROGRESS_PERCENT: Progress percentage must be between 0 and 100');
    }

    try {
      const logDate = dto.log_date || new Date().toISOString().slice(0, 10);
      const payload: Record<string, unknown> = {
        deliverable_item_id: dto.deliverable_item_id,
        project_id: dto.project_id,
        log_date: logDate,
        progress_pct: dto.progress_pct,
        notes: dto.work_description || dto.notes || '',
        obstruction_type: dto.obstruction_type || null,
        obstruction_notes: dto.obstruction_notes || null,
        logged_by: dto.logged_by || dto.stakeholder_id || '00000000-0000-0000-0000-000000000000',
        logged_by_stakeholder_id: dto.stakeholder_id || dto.logged_by_stakeholder_id || null,
        to_manager_approved: false,
        updated_at: new Date().toISOString(),
      };

      if (dto.id) {
        payload.id = dto.id;
      }

      // Upsert into pm_to_progress_logs
      const { data, error } = await supabase
        .from('pm_to_progress_logs')
        .upsert(payload, { onConflict: 'deliverable_item_id,log_date' })
        .select()
        .single();

      if (error) throw error;

      // Update pm_deliverable_items progress_pct
      await supabase
        .from('pm_deliverable_items')
        .update({
          progress_pct: dto.progress_pct,
          updated_at: new Date().toISOString(),
        })
        .eq('id', dto.deliverable_item_id);

      // Invalidate relevant caches
      appCache.invalidate('toProgress:');
      appCache.invalidate(`toProgress:history:${dto.deliverable_item_id}`);
      appCache.invalidate('deliverables:');

      return {
        ...data,
        work_description: data.notes,
        status: data.to_manager_approved ? 'approved' : 'draft',
      } as ToProgressLog;
    } catch (err) {
      console.error('TOProgressService.logDailyProgress error:', err);
      throw err;
    }
  }

  /**
   * Get progress log history for a specific deliverable item.
   */
  static async getProgressHistory(deliverableItemId: string): Promise<ToProgressLog[]> {
    if (!deliverableItemId) return [];
    const cacheKey = `toProgress:history:${deliverableItemId}`;

    return appCache.getOrFetch(cacheKey, TTL.deliverables || 30000, async () => {
      try {
        const { data, error } = await supabase
          .from('pm_to_progress_logs')
          .select('*')
          .eq('deliverable_item_id', deliverableItemId)
          .order('log_date', { ascending: false })
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('TOProgressService.getProgressHistory error:', error);
          return [];
        }

        return (data || []).map((row) => ({
          ...row,
          work_description: row.notes,
          status: row.to_manager_approved ? 'approved' : 'draft',
        })) as ToProgressLog[];
      } catch (err) {
        console.warn('TOProgressService.getProgressHistory exception:', err);
        return [];
      }
    });
  }

  /**
   * Submit draft progress log for TO Manager sign-off.
   */
  static async submitProgressForApproval(
    deliverableItemId: string,
    logId: string
  ): Promise<boolean> {
    try {
      // Update log to submitted state
      const { error: logError } = await supabase
        .from('pm_to_progress_logs')
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq('id', logId);

      if (logError) throw logError;

      // Update deliverable item status to ready_to_return
      const { error: itemError } = await supabase
        .from('pm_deliverable_items')
        .update({
          status: 'ready_to_return',
          updated_at: new Date().toISOString(),
        })
        .eq('id', deliverableItemId);

      if (itemError) throw itemError;

      appCache.invalidate('toProgress:');
      appCache.invalidate(`toProgress:history:${deliverableItemId}`);
      appCache.invalidate('deliverables:');

      return true;
    } catch (err) {
      console.error('TOProgressService.submitProgressForApproval error:', err);
      return false;
    }
  }

  /**
   * Fetch approval queue of submitted progress logs awaiting TO Manager sign-off.
   */
  static async getApprovalQueue(
    projectId?: string,
    toManagerStakeholderId?: string
  ): Promise<ToApprovalQueueItem[]> {
    const cacheKey = `toProgress:queue:${projectId || 'all'}:${toManagerStakeholderId || 'all'}`;

    return appCache.getOrFetch(cacheKey, 15000, async () => {
      try {
        let query = supabase
          .from('pm_to_progress_logs')
          .select(`
            *,
            deliverable_item:pm_deliverable_items(
              *,
              deliverable:pm_deliverables(
                id,
                ref_code,
                title_ar,
                project_id,
                project:projects(id, name_ar, name_en, code)
              )
            ),
            engineer:stakeholders!logged_by_stakeholder_id(
              id,
              name_ar,
              name_en,
              employee_code,
              role
            )
          `)
          .eq('to_manager_approved', false)
          .order('created_at', { ascending: false });

        if (projectId) {
          query = query.eq('project_id', projectId);
        }

        const { data, error } = await query;

        if (error) {
          console.warn('TOProgressService.getApprovalQueue error:', error);
          return [];
        }

        return (data || []).map((row) => ({
          id: row.id,
          log: {
            ...row,
            work_description: row.notes,
            status: 'submitted',
          },
          deliverable_item: row.deliverable_item,
          deliverable: {
            id: row.deliverable_item?.deliverable?.id || '',
            ref_code: row.deliverable_item?.deliverable?.ref_code || '',
            title_ar: row.deliverable_item?.deliverable?.title_ar || '',
            project_id: row.deliverable_item?.deliverable?.project_id || row.project_id,
            project_name:
              row.deliverable_item?.deliverable?.project?.name_ar ||
              row.deliverable_item?.deliverable?.project?.code ||
              '',
          },
          engineer: {
            id: row.engineer?.id || row.logged_by_stakeholder_id || '',
            name_ar: row.engineer?.name_ar || 'مهندس المكتب الفني',
            employee_code: row.engineer?.employee_code || '',
          },
        })) as ToApprovalQueueItem[];
      } catch (err) {
        console.warn('TOProgressService.getApprovalQueue exception:', err);
        return [];
      }
    });
  }

  /**
   * TO Manager sign-off (Approve or Reject with comments).
   */
  static async signOffProgress(params: {
    logId: string;
    deliverableItemId: string;
    approved: boolean;
    managerStakeholderId: string;
    comments?: string;
  }): Promise<boolean> {
    try {
      const now = new Date().toISOString();

      if (params.approved) {
        // Approve log
        const { error: logErr } = await supabase
          .from('pm_to_progress_logs')
          .update({
            to_manager_approved: true,
            approved_by: params.managerStakeholderId,
            approved_at: now,
            rejection_reason: null,
            updated_at: now,
          })
          .eq('id', params.logId);

        if (logErr) throw logErr;

        // Approve deliverable item
        const { error: itemErr } = await supabase
          .from('pm_deliverable_items')
          .update({
            to_manager_approved: true,
            to_manager_approved_at: now,
            to_manager_approved_by: params.managerStakeholderId,
            status: 'ready_to_return',
            updated_at: now,
          })
          .eq('id', params.deliverableItemId);

        if (itemErr) throw itemErr;
      } else {
        // Reject log
        const { error: logErr } = await supabase
          .from('pm_to_progress_logs')
          .update({
            to_manager_approved: false,
            rejection_reason: params.comments || 'Rejected by TO Manager',
            approved_at: null,
            updated_at: now,
          })
          .eq('id', params.logId);

        if (logErr) throw logErr;

        // Reset item status
        const { error: itemErr } = await supabase
          .from('pm_deliverable_items')
          .update({
            to_manager_approved: false,
            status: 'in_progress',
            updated_at: now,
          })
          .eq('id', params.deliverableItemId);

        if (itemErr) throw itemErr;
      }

      appCache.invalidate('toProgress:');
      appCache.invalidate(`toProgress:history:${params.deliverableItemId}`);
      appCache.invalidate('deliverables:');

      return true;
    } catch (err) {
      console.error('TOProgressService.signOffProgress error:', err);
      return false;
    }
  }

  /**
   * TO Manager item assignment.
   */
  static async assignDeliverableItem(params: {
    itemId: string;
    assignedStakeholderId: string;
    assignedBy: string;
    dueDate?: string | null;
    linkedActivityId?: string | null;
  }): Promise<DeliverableItem | null> {
    try {
      const now = new Date().toISOString();
      const payload: Record<string, unknown> = {
        assigned_stakeholder_id: params.assignedStakeholderId,
        assigned_by: params.assignedBy,
        assigned_at: now,
        updated_at: now,
      };

      if (params.dueDate !== undefined) {
        payload.due_date = params.dueDate;
      }

      if (params.linkedActivityId !== undefined) {
        payload.linked_activity_id = params.linkedActivityId;
      }

      const { data, error } = await supabase
        .from('pm_deliverable_items')
        .update(payload)
        .eq('id', params.itemId)
        .select(`
          *,
          deliverable:pm_deliverables(id, ref_code, title_ar),
          assigned_stakeholder:stakeholders!assigned_stakeholder_id(id, name_ar, name_en, role)
        `)
        .single();

      if (error) throw error;

      appCache.invalidate('toProgress:');
      appCache.invalidate('deliverables:');

      return data as DeliverableItem;
    } catch (err) {
      console.error('TOProgressService.assignDeliverableItem error:', err);
      return null;
    }
  }

  /**
   * Handle consultant review status changes (triggers Code C or Code A/B logic).
   */
  static async handleConsultantReview(params: {
    itemId: string;
    consultantStatus: 'A' | 'B' | 'C' | 'D';
    currentRevision: number;
  }): Promise<DeliverableItem | null> {
    try {
      const now = new Date().toISOString();
      const payload: Record<string, unknown> = {
        consultant_status: params.consultantStatus,
        updated_at: now,
      };

      if (params.consultantStatus === 'C') {
        // Code C: auto-increment submission_revision, reset status to in_progress, clear approval
        payload.submission_revision = (params.currentRevision || 1) + 1;
        payload.status = 'in_progress';
        payload.to_manager_approved = false;
        payload.blocked_reason = null;
        payload.blocked_since = null;
      } else if (params.consultantStatus === 'A' || params.consultantStatus === 'B') {
        // Code A/B: auto-unblock and set approved status
        payload.status = 'returned';
        payload.to_manager_approved = true;
        payload.progress_pct = 100;
        payload.blocked_reason = null;
        payload.blocked_since = null;
        payload.completed_at = now;
      }

      const { data, error } = await supabase
        .from('pm_deliverable_items')
        .update(payload)
        .eq('id', params.itemId)
        .select()
        .single();

      if (error) throw error;

      appCache.invalidate('toProgress:');
      appCache.invalidate('deliverables:');

      return data as DeliverableItem;
    } catch (err) {
      console.error('TOProgressService.handleConsultantReview error:', err);
      return null;
    }
  }
}
