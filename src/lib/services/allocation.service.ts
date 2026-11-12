import { supabase } from '@/lib/supabase';
import { appCache, CACHE_KEYS, TTL } from '@/lib/cache';
import { ProgressAllocation } from '@/types/planning';
import { validateAllocationQty } from '@/lib/planning/validators';
import { logger } from '@/lib/logger';

export class AllocationService {
  /**
   * Fetch all allocations for a daily progress line.
   */
  static async getAllocationsForLine(lineId: string): Promise<ProgressAllocation[]> {
    const key = CACHE_KEYS.allocation.list(lineId);
    return appCache.getOrFetch(key, TTL.allocation, async () => {
      try {
        const { data, error } = await supabase
          .from('pm_progress_allocations')
          .select(`
            *,
            activity:pm_project_activities(id, activity_code, name_ar, planned_start, planned_finish, budgeted_cost_egp)
          `)
          .eq('line_id', lineId)
          .eq('is_suspended', false);

        if (error) {
          logger.warn('AllocationService.getAllocationsForLine error:', { detail: error });
          return [];
        }
        return data || [];
      } catch (err) {
        logger.warn('AllocationService.getAllocationsForLine exception:', { detail: err });
        return [];
      }
    });
  }

  /**
   * Fetch all allocations associated with a daily report.
   */
  static async getAllocationsForReport(reportId: string): Promise<ProgressAllocation[]> {
    try {
      const { data: lines } = await supabase
        .from('pm_daily_progress_lines')
        .select('id')
        .eq('daily_progress_id', reportId);

      const lineIds = (lines || []).map((l) => l.id);
      if (lineIds.length === 0) return [];

      const { data, error } = await supabase
        .from('pm_progress_allocations')
        .select(`
          *,
          activity:pm_project_activities(id, activity_code, name_ar, planned_start, planned_finish, budgeted_cost_egp)
        `)
        .in('line_id', lineIds);

      if (error) throw error;
      return data || [];
    } catch (err) {
      logger.error('AllocationService.getAllocationsForReport error:', { detail: err });
      return [];
    }
  }

  /**
   * Allocate daily progress line quantity to a project activity.
   * Strictly enforces allocation sum guard: sum(allocated_qty) <= qty_today.
   */
  static async allocateDailyQty(allocation: {
    line_id: string;
    activity_id: string;
    allocated_qty: number;
    project_id: string;
    snapshot_rate_egp?: number;
    source_boq_revision?: number;
    created_by?: string;
  }): Promise<ProgressAllocation | null> {
    try {
      const qtyToAllocate = Number(allocation.allocated_qty);
      if (isNaN(qtyToAllocate) || qtyToAllocate <= 0) {
        throw new Error('Allocated quantity must be greater than zero');
      }

      // 1. Fetch line details (measured qty_today, snapshot rate, boq revision)
      const { data: line, error: lineErr } = await supabase
        .from('pm_daily_progress_lines')
        .select(`
          id,
          daily_progress_id,
          qty_today,
          snapshot_rate_egp,
          source_boq_revision,
          boq_item:pm_boq_items(rate_egp, revision)
        `)
        .eq('id', allocation.line_id)
        .single();

      if (lineErr || !line) {
        throw new Error(`Line ${allocation.line_id} not found`);
      }

      // 2. Fetch existing active allocations for this line
      const { data: existingAllocations } = await supabase
        .from('pm_progress_allocations')
        .select('id, allocated_qty, activity_id')
        .eq('line_id', allocation.line_id)
        .eq('is_suspended', false);

      const existingList = Array.isArray(existingAllocations) ? existingAllocations : [];
      const otherAllocations = existingList.filter(
        (a) => a && a.activity_id !== allocation.activity_id
      );

      // 3. Run validation guard
      const validation = validateAllocationQty(
        [...otherAllocations, { allocated_qty: qtyToAllocate }],
        line.qty_today
      );

      if (!validation.valid) {
        throw new Error(validation.error || 'Allocation exceeds daily measured quantity');
      }

      // 4. Resolve snapshot rate and revision
      const boqItem = line.boq_item as { rate_egp?: number | null; revision?: number | null } | null | undefined;
      const rate = allocation.snapshot_rate_egp ?? line.snapshot_rate_egp ?? boqItem?.rate_egp ?? 0;
      const rev = allocation.source_boq_revision ?? line.source_boq_revision ?? boqItem?.revision ?? 1;

      const payload = {
        line_id: allocation.line_id,
        activity_id: allocation.activity_id,
        allocated_qty: qtyToAllocate,
        project_id: allocation.project_id,
        snapshot_rate_egp: rate,
        source_boq_revision: rev,
        is_suspended: false,
        created_by: allocation.created_by || null,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('pm_progress_allocations')
        .upsert(payload, { onConflict: 'line_id,activity_id' })
        .select()
        .single();

      if (error) throw error;

      // Invalidate relevant cache namespaces
      appCache.invalidate(`allocations:${allocation.line_id}`);
      appCache.invalidate(`activities:${allocation.project_id}`);
      appCache.invalidate(`planningKpis:${allocation.project_id}`);
      appCache.invalidate(`scurve:${allocation.project_id}`);

      return data;
    } catch (err: unknown) {
      logger.error('AllocationService.allocateDailyQty error:', { detail: err });
      throw err;
    }
  }

  /**
   * Delete an allocation.
   */
  static async deleteAllocation(
    allocationId: string,
    projectId: string,
    reportId?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('pm_progress_allocations')
        .delete()
        .eq('id', allocationId);

      if (error) throw error;

      appCache.invalidate('allocations:');
      appCache.invalidate(`activities:${projectId}`);
      appCache.invalidate(`planningKpis:${projectId}`);
      appCache.invalidate(`scurve:${projectId}`);
      if (reportId) {
        appCache.invalidate(`dailyReport:detail:${reportId}`);
      }

      return true;
    } catch (err) {
      logger.error('AllocationService.deleteAllocation error:', { detail: err });
      return false;
    }
  }
}
