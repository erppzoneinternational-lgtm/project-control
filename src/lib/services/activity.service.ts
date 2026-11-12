import type { ErrorLike } from '@/types/services-types';
import { supabase } from '@/lib/supabase';
import { appCache, CACHE_KEYS, TTL } from '@/lib/cache';
import {
  ProjectActivity,
  ActivityBoqLink,
  ScheduleVersion,
  ActivityLibraryItem,
} from '@/types/planning';
import { logger } from '@/lib/logger';

export class ActivityService {
  /**
   * Fetch all activities for a project with BOQ links.
   */
  static async getActivities(projectId: string): Promise<ProjectActivity[]> {
    const key = CACHE_KEYS.planning.activities(projectId);
    return appCache.getOrFetch(key, TTL.planning, async () => {
      try {
        const { data, error } = await supabase
          .from('pm_project_activities')
          .select(`
            *,
            zone:pm_zones(id, name_ar, name_en),
            responsible_stakeholder:stakeholders!pm_project_activities_responsible_stakeholder_id_fkey(id, name_ar, name_en, role)
          `)
          .eq('project_id', projectId)
          .eq('is_active', true)
          .order('planned_start', { ascending: true });

        if (error) {
          // Fallback: if join still fails, fetch without joins
          logger.warn('ActivityService.getActivities join query failed, falling back to plain select', { detail: error });
          const { data: plain, error: plainErr } = await supabase
            .from('pm_project_activities')
            .select('*')
            .eq('project_id', projectId)
            .eq('is_active', true)
            .order('planned_start', { ascending: true });
          if (plainErr) {
            logger.warn('ActivityService.getActivities fallback error:', { detail: plainErr });
            return [];
          }
          return plain || [];
        }
        return data || [];
      } catch (err) {
        logger.warn('ActivityService.getActivities exception:', { detail: err });
        return [];
      }
    });
  }

  /**
   * Fetch single activity by ID.
   */
  static async getActivityById(id: string): Promise<ProjectActivity | null> {
    const key = CACHE_KEYS.planning.activity(id);
    return appCache.getOrFetch(key, TTL.planning, async () => {
      try {
        const { data, error } = await supabase
          .from('pm_project_activities')
          .select(`
            *,
            wbs_item:pm_wbs(id, wbs_code, title_ar),
            responsible_stakeholder:stakeholders(id, name_ar, name_en, role),
            boq_links:pm_activity_boq_links(
              id,
              activity_id,
              boq_item_id,
              planned_qty,
              baseline_rate_egp,
              boq_item:pm_boq_items(id, item_code, description_ar, unit, rate_egp)
            )
          `)
          .eq('id', id)
          .single();

        if (error) {
          logger.warn('ActivityService.getActivityById error:', { detail: error });
          return null;
        }
        return data;
      } catch (err) {
        logger.warn('ActivityService.getActivityById exception:', { detail: err });
        return null;
      }
    });
  }

  /**
   * Create or update project activity.
   */
  static async saveActivity(activity: Partial<ProjectActivity>): Promise<ProjectActivity | null> {
    try {
      const payload = {
        project_id: activity.project_id,
        library_activity_id: activity.library_activity_id || null,
        library_code: activity.library_code || null,
        activity_code: activity.activity_code?.trim() || activity.code?.trim(),
        zone_id: activity.zone_id || null,
        wbs_item_id: activity.wbs_item_id || null,
        name_ar: activity.name_ar?.trim(),
        name_en: activity.name_en?.trim() || null,
        scope_type: activity.scope_type || 'original',
        vo_number: activity.scope_type === 'vo' ? (activity.vo_number?.trim() || null) : null,
        weight_override: activity.weight_override !== undefined ? activity.weight_override : null,
        sort_order: activity.sort_order ?? 0,
        planned_start: activity.planned_start,
        planned_finish: activity.planned_finish,
        duration_days: Number(activity.duration_days ?? 1),
        budgeted_cost_egp: Number(activity.budgeted_cost_egp ?? 0),
        weight_pct: activity.weight_pct !== undefined ? activity.weight_pct : null,
        boq_link_mode: activity.boq_link_mode || 'by_items',
        is_milestone: Boolean(activity.is_milestone),
        is_critical: Boolean(activity.is_critical),
        actual_start: activity.actual_start || null,
        actual_finish: activity.actual_finish || null,
        percent_complete: Number(activity.percent_complete ?? 0),
        status: activity.status || 'not_started',
        responsible_stakeholder_id: activity.responsible_stakeholder_id || null,
        is_archived: Boolean(activity.is_archived),
        total_float_days: Number(activity.total_float_days ?? 0),
        free_float_days: Number(activity.free_float_days ?? 0),
        remaining_duration_days: activity.remaining_duration_days !== undefined ? activity.remaining_duration_days : null,
        expected_finish: activity.expected_finish || null,
        calendar_type: activity.calendar_type || '6_days',
        is_out_of_sequence: Boolean(activity.is_out_of_sequence),
        notes: activity.notes || null,
        updated_at: new Date().toISOString(),
      };

      let result: ProjectActivity | null = null;
      if (activity.id) {
        const { data, error } = await supabase
          .from('pm_project_activities')
          .update(payload)
          .eq('id', activity.id)
          .select()
          .single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('pm_project_activities')
          .insert({ ...payload, created_at: new Date().toISOString() })
          .select()
          .single();
        if (error) throw error;
        result = data;
      }

      if (activity.project_id) {
        appCache.invalidate(`activities:${activity.project_id}`);
        appCache.invalidate(`planningKpis:${activity.project_id}`);
      }
      if (activity.id) {
        appCache.invalidate(`activities:detail:${activity.id}`);
      }

      return result;
    } catch (err) {
      logger.error('ActivityService.saveActivity error:', { detail: err });
      return null;
    }
  }

  /**
   * Delete or archive an activity.
   */
  static async deleteActivity(id: string, projectId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('pm_project_activities')
        .update({ is_archived: true, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;

      appCache.invalidate(`activities:${projectId}`);
      appCache.invalidate(`activities:detail:${id}`);
      return true;
    } catch (err) {
      logger.error('ActivityService.deleteActivity error:', { detail: err });
      return false;
    }
  }

  /**
   * Link BOQ item to Activity with frozen baseline rate snapshot.
   */
  static async linkBoqToActivity(
    activityId: string,
    boqItemId: string,
    plannedQty: number,
    baselineRateEgp?: number
  ): Promise<ActivityBoqLink | null> {
    try {
      let rate = baselineRateEgp;
      if (rate === undefined) {
        const { data: boqItem } = await supabase
          .from('pm_boq_items')
          .select('rate_egp, project_id')
          .eq('id', boqItemId)
          .single();
        rate = boqItem?.rate_egp ?? 0;
      }

      const payload = {
        activity_id: activityId,
        boq_item_id: boqItemId,
        planned_qty: Math.max(0, Number(plannedQty)),
        baseline_rate_egp: Math.max(0, Number(rate)),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('pm_activity_boq_links')
        .upsert(payload, { onConflict: 'activity_id,boq_item_id' })
        .select(`
          *,
          boq_item:pm_boq_items(id, item_code, description_ar, unit, rate_egp)
        `)
        .single();

      if (error) throw error;

      // Invalidate related caches
      appCache.invalidate('activities:');
      return data;
    } catch (err) {
      logger.error('ActivityService.linkBoqToActivity error:', { detail: err });
      return null;
    }
  }

  /**
   * Unlink BOQ item from Activity.
   */
  static async unlinkBoqItem(linkId: string, projectId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('pm_activity_boq_links').delete().eq('id', linkId);
      if (error) throw error;

      appCache.invalidate(`activities:${projectId}`);
      return true;
    } catch (err) {
      logger.error('ActivityService.unlinkBoqItem error:', { detail: err });
      return false;
    }
  }

  /**
   * Fetch current baseline schedule activities for a project.
   */
  static async getBaselineActivities(projectId: string): Promise<ProjectActivity[]> {
    return ActivityService.getActivities(projectId);
  }

  /**
   * Promote a schedule version to current baseline.
   */
  static async promoteScheduleVersion(
    projectId: string,
    versionNo: number,
    promotedBy?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Try DB RPC if defined
      const { error: rpcErr } = await supabase.rpc('fn_promote_schedule_version', {
        p_project_id: projectId,
        p_version_no: versionNo,
        p_promoted_by: promotedBy || null,
      });

      if (!rpcErr) {
        appCache.invalidate(`schedules:${projectId}`);
        appCache.invalidate(`activities:${projectId}`);
        return { success: true };
      }

      // 2. Direct fallback update
      await supabase
        .from('pm_schedule_versions')
        .update({ is_current: false })
        .eq('project_id', projectId);

      const { error: updateErr } = await supabase
        .from('pm_schedule_versions')
        .update({ is_current: true })
        .eq('project_id', projectId)
        .eq('version_no', versionNo);

      if (updateErr) throw updateErr;

      appCache.invalidate(`schedules:${projectId}`);
      appCache.invalidate(`activities:${projectId}`);
      return { success: true };
    } catch (err: unknown) {
      logger.error('ActivityService.promoteScheduleVersion error:', { detail: err });
      return { success: false, error: (err as ErrorLike).message || 'Promotion failed' };
    }
  }

  /**
   * Fetch standard Activity Library items.
   */
  static async getActivityLibrary(discipline?: string): Promise<ActivityLibraryItem[]> {
    const key = CACHE_KEYS.planning.library(discipline);
    return appCache.getOrFetch(key, TTL.reference, async () => {
      try {
        let query = supabase
          .from('pm_activity_library')
          .select('*')
          .eq('is_active', true)
          .order('activity_code', { ascending: true });

        if (discipline && discipline !== 'all') {
          query = query.eq('discipline', discipline);
        }

        const { data, error } = await query;
        if (error) {
          logger.warn('ActivityService.getActivityLibrary error:', { detail: error });
          return [];
        }
        return data || [];
      } catch (err) {
        logger.warn('ActivityService.getActivityLibrary exception:', { detail: err });
        return [];
      }
    });
  }

  /**
   * Save an item in the Activity Library.
   */
  static async saveLibraryItem(
    item: Partial<ActivityLibraryItem>
  ): Promise<ActivityLibraryItem | null> {
    try {
      const payload = {
        activity_code: item.activity_code?.trim(),
        name_ar: item.name_ar?.trim(),
        name_en: item.name_en?.trim() || null,
        discipline: item.discipline || 'other',
        default_unit: item.default_unit || null,
        typical_duration_days: item.typical_duration_days || null,
        is_active: item.is_active !== undefined ? item.is_active : true,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('pm_activity_library')
        .upsert(payload, { onConflict: 'activity_code' })
        .select()
        .single();

      if (error) throw error;

      appCache.invalidate('ref:activityLibrary');
      return data;
    } catch (err) {
      logger.error('ActivityService.saveLibraryItem error:', { detail: err });
      return null;
    }
  }
}
