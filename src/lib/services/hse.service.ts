import { supabase } from '@/lib/supabase';
import { appCache, TTL } from '@/lib/cache';
import { logger } from '@/lib/logger';
import { HseIncident, HseInspection, HseMetrics } from '@/types/hse';

class HseService {
  async getIncidents(projectId: string): Promise<HseIncident[]> {
    const cacheKey = `hseIncidents:${projectId}`;
    return appCache.getOrFetch(cacheKey, async () => {
      try {
        const { data, error } = await supabase
          .from('pm_hse_incidents')
          .select('*')
          .eq('project_id', projectId)
          .order('incident_date', { ascending: false });

        if (error) throw error;
        return data as HseIncident[];
      } catch (error) {
        logger.error('Error fetching HSE incidents', { projectId, error });
        throw error;
      }
    }, TTL.planning);
  }

  async saveIncident(incident: Partial<HseIncident>): Promise<HseIncident | null> {
    try {
      const query = supabase.from('pm_hse_incidents');
      let result;

      if (incident.id) {
        result = await query.update(incident).eq('id', incident.id).select().single();
      } else {
        result = await query.insert([incident]).select().single();
      }

      if (result.error) throw result.error;

      if (incident.project_id) {
        appCache.invalidate(`hseIncidents:${incident.project_id}`);
      }
      return result.data as HseIncident;
    } catch (error) {
      logger.error('Error saving HSE incident', { incident, error });
      throw error;
    }
  }

  async getInspections(projectId: string): Promise<HseInspection[]> {
    const cacheKey = `hseInspections:${projectId}`;
    return appCache.getOrFetch(cacheKey, async () => {
      try {
        const { data, error } = await supabase
          .from('pm_hse_inspections')
          .select('*')
          .eq('project_id', projectId)
          .order('inspection_date', { ascending: false });

        if (error) throw error;
        return data as HseInspection[];
      } catch (error) {
        logger.error('Error fetching HSE inspections', { projectId, error });
        throw error;
      }
    }, TTL.planning);
  }

  async saveInspection(inspection: Partial<HseInspection>): Promise<HseInspection | null> {
    try {
      const query = supabase.from('pm_hse_inspections');
      let result;

      if (inspection.id) {
        result = await query.update(inspection).eq('id', inspection.id).select().single();
      } else {
        result = await query.insert([inspection]).select().single();
      }

      if (result.error) throw result.error;

      if (inspection.project_id) {
        appCache.invalidate(`hseInspections:${inspection.project_id}`);
      }
      return result.data as HseInspection;
    } catch (error) {
      logger.error('Error saving HSE inspection', { inspection, error });
      throw error;
    }
  }

  async getHseMetrics(projectId: string): Promise<HseMetrics | null> {
    const cacheKey = `hseMetrics:${projectId}`;
    return appCache.getOrFetch(cacheKey, async () => {
      try {
        const { data, error } = await supabase
          .from('pm_hse_metrics')
          .select('*')
          .eq('project_id', projectId)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data as HseMetrics | null;
      } catch (error) {
        logger.error('Error fetching HSE metrics', { projectId, error });
        throw error;
      }
    }, TTL.planning);
  }
}

export const hseService = new HseService();
