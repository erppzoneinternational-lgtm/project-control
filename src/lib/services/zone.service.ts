import { supabase } from '@/lib/supabase';
import { Zone, ZoneInsert, ZoneUpdate } from '@/types/zone';
import { appCache, TTL } from '@/lib/cache';

export class ZoneService {
  /**
   * Fetch all zones for a project, structured hierarchically (parents with sub_zones).
   */
  static async getProjectZones(projectId: string): Promise<Zone[]> {
    const cacheKey = `zones:project:${projectId}`;
    return appCache.getOrFetch(cacheKey, TTL.planning || 60, async () => {
      try {
        const { data, error } = await supabase
          .from('pm_zones')
          .select('*')
          .eq('project_id', projectId)
          .order('sort_order', { ascending: true })
          .order('name_ar', { ascending: true });

        if (error) throw error;
        if (!data) return [];

        // Build hierarchy: root zones (parent_zone_id is null) and sub-zones
        const allZones: Zone[] = data;
        const rootZones: Zone[] = [];
        const subZonesMap = new Map<string, Zone[]>();

        for (const zone of allZones) {
          if (zone.parent_zone_id) {
            const list = subZonesMap.get(zone.parent_zone_id) || [];
            list.push(zone);
            subZonesMap.set(zone.parent_zone_id, list);
          } else {
            rootZones.push(zone);
          }
        }

        // Attach sub-zones
        for (const root of rootZones) {
          root.sub_zones = subZonesMap.get(root.id) || [];
        }

        return rootZones;
      } catch (err) {
        console.error('ZoneService.getProjectZones error:', err);
        return [];
      }
    });
  }

  /**
   * Create a new zone or sub-zone.
   */
  static async createZone(payload: ZoneInsert): Promise<Zone | null> {
    try {
      const { data, error } = await supabase
        .from('pm_zones')
        .insert({
          project_id: payload.project_id,
          name_ar: payload.name_ar.trim(),
          name_en: payload.name_en?.trim() || null,
          parent_zone_id: payload.parent_zone_id || null,
          sort_order: payload.sort_order ?? 0,
        })
        .select()
        .single();

      if (error) throw error;

      appCache.invalidate(`zones:project:${payload.project_id}`);
      return data;
    } catch (err) {
      console.error('ZoneService.createZone error:', err);
      return null;
    }
  }

  /**
   * Update an existing zone.
   */
  static async updateZone(id: string, projectId: string, payload: ZoneUpdate): Promise<Zone | null> {
    try {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (payload.name_ar !== undefined) updateData.name_ar = payload.name_ar.trim();
      if (payload.name_en !== undefined) updateData.name_en = payload.name_en?.trim() || null;
      if (payload.parent_zone_id !== undefined) updateData.parent_zone_id = payload.parent_zone_id || null;
      if (payload.sort_order !== undefined) updateData.sort_order = payload.sort_order;

      const { data, error } = await supabase
        .from('pm_zones')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      appCache.invalidate(`zones:project:${projectId}`);
      return data;
    } catch (err) {
      console.error('ZoneService.updateZone error:', err);
      return null;
    }
  }

  /**
   * Delete a zone (sub-zones get parent_zone_id set to null via DB FK constraint).
   */
  static async deleteZone(id: string, projectId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('pm_zones')
        .delete()
        .eq('id', id);

      if (error) throw error;

      appCache.invalidate(`zones:project:${projectId}`);
      return true;
    } catch (err) {
      console.error('ZoneService.deleteZone error:', err);
      return false;
    }
  }
}
