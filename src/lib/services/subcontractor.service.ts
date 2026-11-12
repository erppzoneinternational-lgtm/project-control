import { supabase } from '@/lib/supabase';
import { appCache, TTL } from '@/lib/cache';
import {
  SubcontractorTarget,
  SubcontractorProductivityMetric,
} from '@/types/planning';
import { calculateSubcontractorProductivity } from '@/lib/planning/calculations';

export class SubcontractorService {
  /**
   * Fetch subcontractor production targets for a project.
   */
  static async getSubcontractorTargets(projectId: string): Promise<SubcontractorTarget[]> {
    const key = `subcontractor:targets:${projectId}`;
    return appCache.getOrFetch(key, TTL.planning, async () => {
      try {
        const { data, error } = await supabase
          .from('pm_subcontractor_targets')
          .select('*')
          .eq('project_id', projectId)
          .order('target_date', { ascending: false });

        if (error) {
          console.warn('SubcontractorService.getSubcontractorTargets error:', error);
          return [];
        }
        return data || [];
      } catch (err) {
        console.warn('SubcontractorService.getSubcontractorTargets exception:', err);
        return [];
      }
    });
  }

  /**
   * Save or update a subcontractor production target.
   */
  static async saveSubcontractorTarget(
    target: Partial<SubcontractorTarget>
  ): Promise<SubcontractorTarget | null> {
    try {
      const payload = {
        project_id: target.project_id,
        subcontractor_id: target.subcontractor_id,
        boq_item_id: target.boq_item_id || null,
        target_qty: Number(target.target_qty ?? 0),
        target_date: target.target_date || new Date().toISOString().slice(0, 10),
        period_start: target.period_start || null,
        period_end: target.period_end || null,
        unit: target.unit || null,
        notes: target.notes || null,
        updated_at: new Date().toISOString(),
      };

      let result: SubcontractorTarget | null = null;
      if (target.id) {
        const { data, error } = await supabase
          .from('pm_subcontractor_targets')
          .update(payload)
          .eq('id', target.id)
          .select()
          .single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('pm_subcontractor_targets')
          .insert({ ...payload, created_at: new Date().toISOString() })
          .select()
          .single();
        if (error) throw error;
        result = data;
      }

      if (target.project_id) {
        appCache.invalidate(`subcontractor:targets:${target.project_id}`);
      }
      return result;
    } catch (err) {
      console.error('SubcontractorService.saveSubcontractorTarget error:', err);
      return null;
    }
  }

  /**
   * Calculate subcontractor productivity metrics for a project within an optional period.
   */
  static async getSubcontractorProductivity(
    projectId: string,
    periodStart?: string,
    periodEnd?: string
  ): Promise<SubcontractorProductivityMetric[]> {
    try {
      // 1. Fetch targets
      const targets = await SubcontractorService.getSubcontractorTargets(projectId);

      // 2. Fetch daily progress reports for project
      let reportQuery = supabase
        .from('pm_daily_progress')
        .select(`
          id,
          progress_date,
          manpower_count,
          lines:pm_daily_progress_lines(
            id,
            boq_item_id,
            subcontractor_id,
            qty_today,
            line_status
          )
        `)
        .eq('project_id', projectId);

      if (periodStart) {
        reportQuery = reportQuery.gte('progress_date', periodStart);
      }
      if (periodEnd) {
        reportQuery = reportQuery.lte('progress_date', periodEnd);
      }

      const { data: reports, error: repErr } = await reportQuery;
      if (repErr) {
        console.warn('SubcontractorService.getSubcontractorProductivity reports error:', repErr);
      }

      const allLines: Parameters<typeof calculateSubcontractorProductivity>[1] = [];
      let totalManpower = 0;

      for (const rep of reports || []) {
        totalManpower += rep.manpower_count || 0;
        if (rep.lines) {
          allLines.push(...rep.lines);
        }
      }

      // 3. Compute productivity
      return calculateSubcontractorProductivity(targets, allLines, totalManpower);
    } catch (err) {
      console.error('SubcontractorService.getSubcontractorProductivity error:', err);
      return [];
    }
  }
}
