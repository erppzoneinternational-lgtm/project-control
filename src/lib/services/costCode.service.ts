import { supabase } from '@/lib/supabase';
import { appCache, CACHE_KEYS, TTL } from '@/lib/cache';
import { CostCode, CostCodeCategory, CostCodeFilterOptions, CostCodeTreeItem } from '@/types/boq';
import { logger } from '@/lib/logger';

export class CostCodeService {
  /**
   * Fetch Cost Codes from reference table with optional filters and caching.
   */
  static async getCostCodes(filters?: CostCodeFilterOptions): Promise<CostCode[]> {
    const category = filters?.category;
    const prefix = filters?.prefix;
    const isHeader = filters?.is_header;
    const parentCode = filters?.parent_code;
    const search = filters?.search?.trim().toLowerCase();
    const activeOnly = filters?.is_active !== undefined ? filters.is_active : true;

    // Build cache key when search is empty
    const cacheKey = search
      ? null
      : `ref:costCodes:${category || 'all'}:${prefix || 'all'}:${isHeader === undefined ? 'all' : isHeader}:${parentCode || 'all'}:${activeOnly}`;

    const fetcher = async () => {
      try {
        let query = supabase
          .from('pm_cost_codes')
          .select('*');

        if (activeOnly) {
          query = query.eq('is_active', true);
        }
        if (category && category !== 'all') {
          query = query.eq('category', category);
        }
        if (prefix && prefix !== 'all') {
          query = query.eq('prefix', prefix);
        }
        if (isHeader !== undefined) {
          query = query.eq('is_header', isHeader);
        }
        if (parentCode) {
          query = query.eq('parent_code', parentCode);
        }

        query = query.order('code', { ascending: true });

        const { data, error } = await query;
        if (error) {
          logger.warn('CostCodeService.getCostCodes error:', { detail: error });
          return [];
        }

        let result = (data || []) as CostCode[];

        if (search) {
          result = result.filter(
            (c) =>
              c.code.toLowerCase().includes(search) ||
              (c.name_ar && c.name_ar.toLowerCase().includes(search)) ||
              (c.name_en && c.name_en.toLowerCase().includes(search))
          );
        }

        return result;
      } catch (err) {
        logger.warn('CostCodeService.getCostCodes exception:', { detail: err });
        return [];
      }
    };

    if (cacheKey) {
      return appCache.getOrFetch(cacheKey, TTL.reference, fetcher);
    }
    return fetcher();
  }

  /**
   * Fetch hierarchical tree structure of cost codes:
   * 40 Group Headers with their respective Leaf Codes, plus any root/unassigned leaf codes.
   */
  static async getCostCodeTree(category?: string): Promise<{
    headers: CostCodeTreeItem[];
    childrenMap: Record<string, CostCode[]>;
    standaloneLeafCodes: CostCode[];
    allCodes: CostCode[];
  }> {
    const key = `ref:costCodesTree:${category || 'all'}`;
    return appCache.getOrFetch(key, TTL.reference, async () => {
      const allCodes = await this.getCostCodes(category && category !== 'all' ? { category } : undefined);

      const headers: CostCodeTreeItem[] = [];
      const childrenMap: Record<string, CostCode[]> = {};
      const standaloneLeafCodes: CostCode[] = [];

      allCodes.forEach((code) => {
        if (code.is_header) {
          headers.push({ ...code, children: [] });
          childrenMap[code.code] = [];
        }
      });

      allCodes.forEach((code) => {
        if (!code.is_header) {
          if (code.parent_code && childrenMap[code.parent_code]) {
            childrenMap[code.parent_code].push(code);
          } else {
            standaloneLeafCodes.push(code);
          }
        }
      });

      headers.forEach((h) => {
        h.children = childrenMap[h.code] || [];
      });

      return { headers, childrenMap, standaloneLeafCodes, allCodes };
    });
  }

  /**
   * Fetch single cost code by ID.
   */
  static async getCostCodeById(id: string): Promise<CostCode | null> {
    if (!id) return null;
    const key = `ref:costCode:${id}`;
    return appCache.getOrFetch(key, TTL.reference, async () => {
      try {
        const { data, error } = await supabase
          .from('pm_cost_codes')
          .select('*')
          .eq('id', id)
          .single();
        if (error) return null;
        return data as CostCode;
      } catch (err) {
        logger.warn('CostCodeService.getCostCodeById error:', { detail: err });
        return null;
      }
    });
  }

  /**
   * Fetch single cost code by unique Code string (e.g. "M221").
   */
  static async getCostCodeByCode(code: string): Promise<CostCode | null> {
    if (!code) return null;
    const normalized = code.trim().toUpperCase();
    const key = `ref:costCodeByCode:${normalized}`;
    return appCache.getOrFetch(key, TTL.reference, async () => {
      try {
        const { data, error } = await supabase
          .from('pm_cost_codes')
          .select('*')
          .eq('code', normalized)
          .single();
        if (error) return null;
        return data as CostCode;
      } catch (err) {
        logger.warn('CostCodeService.getCostCodeByCode error:', { detail: err });
        return null;
      }
    });
  }

  /**
   * Create or update a Cost Code.
   * System codes (is_system = true) are immutable single source of truth.
   */
  static async saveCostCode(costCode: Partial<CostCode>): Promise<CostCode | null> {
    try {
      if (costCode.id && costCode.is_system) {
        throw new Error('لا يمكن تعديل كود تكلفة قياسي معتمد من النظام (System Cost Code is immutable).');
      }

      const codeStr = costCode.code?.trim().toUpperCase() || '';
      const prefix = costCode.prefix || (codeStr ? codeStr[0] : 'O');

      const payload = {
        code: codeStr,
        name_ar: costCode.name_ar?.trim(),
        name_en: costCode.name_en?.trim() || null,
        category: costCode.category || 'other',
        prefix,
        is_header: costCode.is_header || false,
        parent_code: costCode.parent_code || null,
        is_system: false, // User-created codes are non-system
        is_active: costCode.is_active !== undefined ? costCode.is_active : true,
        updated_at: new Date().toISOString(),
      };

      let result: CostCode | null = null;
      if (costCode.id) {
        const { data, error } = await supabase
          .from('pm_cost_codes')
          .update(payload)
          .eq('id', costCode.id)
          .eq('is_system', false)
          .select()
          .single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('pm_cost_codes')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        result = data;
      }

      this.invalidateCache();
      return result;
    } catch (err) {
      logger.error('CostCodeService.saveCostCode error:', { detail: err });
      return null;
    }
  }

  /**
   * Assign a cost code to a BOQ item.
   */
  static async assignCostCodeToBoqItem(
    boqItemId: string,
    costCodeId: string | null,
    projectId?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('pm_boq_items')
        .update({
          cost_code_id: costCodeId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', boqItemId);

      if (error) throw error;

      appCache.invalidate(CACHE_KEYS.boq.item(boqItemId));
      if (projectId) {
        appCache.invalidate(CACHE_KEYS.boq.list(projectId, true));
        appCache.invalidate(CACHE_KEYS.boq.list(projectId, false));
      }
      return true;
    } catch (err) {
      logger.error('CostCodeService.assignCostCodeToBoqItem error:', { detail: err, boqItemId });
      return false;
    }
  }

  /**
   * Assign a cost code to a Site Task.
   */
  static async assignCostCodeToSiteTask(
    taskId: string,
    costCodeId: string | null
  ): Promise<boolean> {
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
      logger.error('CostCodeService.assignCostCodeToSiteTask error:', { detail: err, taskId });
      return false;
    }
  }

  /**
   * Assign a cost code to a Project Activity.
   */
  static async assignCostCodeToActivity(
    activityId: string,
    costCodeId: string | null,
    projectId?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('pm_project_activities')
        .update({
          cost_code_id: costCodeId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', activityId);

      if (error) throw error;
      if (projectId) {
        appCache.invalidate(CACHE_KEYS.planning.activities(projectId));
      }
      return true;
    } catch (err) {
      logger.error('CostCodeService.assignCostCodeToActivity error:', { detail: err, activityId });
      return false;
    }
  }

  /**
   * Bulk assign a cost code to multiple BOQ items or tasks.
   */
  static async bulkAssignCostCode(
    itemIds: string[],
    costCodeId: string | null,
    entityType: 'boq' | 'site_task' | 'activity',
    projectId?: string
  ): Promise<{ success: number; failed: number }> {
    if (!itemIds.length) return { success: 0, failed: 0 };
    try {
      const tableName =
        entityType === 'boq'
          ? 'pm_boq_items'
          : entityType === 'site_task'
          ? 'pm_site_tasks'
          : 'pm_project_activities';

      const { error } = await supabase
        .from(tableName)
        .update({
          cost_code_id: costCodeId,
          updated_at: new Date().toISOString(),
        })
        .in('id', itemIds);

      if (error) throw error;

      if (entityType === 'boq' && projectId) {
        appCache.invalidate(CACHE_KEYS.boq.list(projectId, true));
        appCache.invalidate(CACHE_KEYS.boq.list(projectId, false));
      } else if (entityType === 'activity' && projectId) {
        appCache.invalidate(CACHE_KEYS.planning.activities(projectId));
      }

      return { success: itemIds.length, failed: 0 };
    } catch (err) {
      logger.error('CostCodeService.bulkAssignCostCode error:', { detail: err });
      return { success: 0, failed: itemIds.length };
    }
  }

  /**
   * Calculate summary KPIs as verified in data_report.md
   */
  static async getStats(): Promise<{
    total: number;
    systemMasterCodes: number;
    parentGroupHeaders: number;
    leafTransactionalCodes: number;
    divisionBreakdown: Record<string, number>;
  }> {
    const all = await this.getCostCodes({ is_active: true });
    const divisionBreakdown: Record<string, number> = {};

    let systemMasterCodes = 0;
    let parentGroupHeaders = 0;
    let leafTransactionalCodes = 0;

    all.forEach((c) => {
      const div = c.prefix || c.category || 'other';
      divisionBreakdown[div] = (divisionBreakdown[div] || 0) + 1;

      if (c.is_system) systemMasterCodes++;
      if (c.is_header) parentGroupHeaders++;
      else leafTransactionalCodes++;
    });

    return {
      total: all.length,
      systemMasterCodes,
      parentGroupHeaders,
      leafTransactionalCodes,
      divisionBreakdown,
    };
  }

  /**
   * Clear all cost code cache keys.
   */
  static invalidateCache(): void {
    appCache.invalidate('ref:costCodes');
    appCache.invalidate('ref:costCodesTree');
  }
}
