import { supabase } from '@/lib/supabase';
import { appCache, TTL } from '@/lib/cache';
import { PmHold } from '@/types/planning';
import { logger } from '@/lib/logger';

export class HoldsService {
  /**
   * Fetch holds for a project with optional activeOnly filter.
   */
  static async getHolds(projectId: string, activeOnly = false): Promise<PmHold[]> {
    const key = `holds:list:${projectId}:${activeOnly}`;
    return appCache.getOrFetch(key, TTL.planning, async () => {
      try {
        let query = supabase
          .from('pm_holds')
          .select('*')
          .eq('project_id', projectId)
          .order('placed_at', { ascending: false });

        if (activeOnly) {
          query = query.eq('is_active', true);
        }

        const { data, error } = await query;
        if (error) {
          logger.warn('HoldsService.getHolds error:', { detail: error });
          return [];
        }
        return data || [];
      } catch (err) {
        logger.warn('HoldsService.getHolds exception:', { detail: err });
        return [];
      }
    });
  }

  /**
   * Save or place a new PM hold.
   */
  static async saveHold(hold: Partial<PmHold>): Promise<PmHold | null> {
    try {
      const payload = {
        project_id: hold.project_id,
        hold_type: hold.hold_type || 'site',
        scope_type: hold.scope_type || 'project',
        ref_value: hold.ref_value || null,
        reason: hold.reason?.trim() || '',
        is_active: hold.is_active !== undefined ? hold.is_active : true,
        placed_by: hold.placed_by || 'system',
        placed_at: hold.placed_at || new Date().toISOString(),
        closed_by: hold.closed_by || null,
        closed_at: hold.closed_at || null,
        updated_at: new Date().toISOString(),
      };

      let result: PmHold | null = null;
      if (hold.id) {
        const { data, error } = await supabase
          .from('pm_holds')
          .update(payload)
          .eq('id', hold.id)
          .select()
          .single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('pm_holds')
          .insert({ ...payload, created_at: new Date().toISOString() })
          .select()
          .single();
        if (error) throw error;
        result = data;
      }

      if (hold.project_id) {
        appCache.invalidate(`holds:list:${hold.project_id}`);
      }
      return result;
    } catch (err) {
      logger.error('HoldsService.saveHold error:', { detail: err });
      return null;
    }
  }

  /**
   * Release an active hold.
   */
  static async releaseHold(id: string, closedBy: string): Promise<PmHold | null> {
    try {
      const { data, error } = await supabase
        .from('pm_holds')
        .update({
          is_active: false,
          closed_by: closedBy,
          closed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (data?.project_id) {
        appCache.invalidate(`holds:list:${data.project_id}`);
      }
      return data;
    } catch (err) {
      logger.error('HoldsService.releaseHold error:', { detail: err });
      return null;
    }
  }

  /**
   * Check if a specific scope (zone, activity, or BOQ item) or the entire project is on hold.
   */
  static async isScopeOnHold(
    projectId: string,
    scope: 'zone' | 'activity' | 'boq_item',
    refValue: string
  ): Promise<boolean> {
    try {
      const holds = await HoldsService.getHolds(projectId, true);
      return holds.some((h) => {
        if (!h.is_active) return false;
        if (h.scope_type === 'project') return true;
        if (h.scope_type === scope && h.ref_value === refValue) return true;
        return false;
      });
    } catch (err) {
      logger.warn('HoldsService.isScopeOnHold exception:', { detail: err });
      return false;
    }
  }
}
