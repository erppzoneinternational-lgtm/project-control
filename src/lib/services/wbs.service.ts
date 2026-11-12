import { supabase } from '@/lib/supabase';
import { appCache, CACHE_KEYS, TTL } from '@/lib/cache';
import { logger } from '@/lib/logger';
import { WBSItem } from '@/types';
import { ProjectActivity, WBSEvmSummary, WBSTabDashboardData } from '@/types/planning';
import { calculateEVM } from '@/lib/planning/calculations';
import { canViewPrices } from '@/components/planning/PriceGate';
import { PRICE_FIELDS } from './boq.service';
import * as XLSX from 'xlsx';

export class WBSService {
  /**
   * Fetch flat list of WBS items for a project
   */
  static async getWBSItems(projectId: string): Promise<WBSItem[]> {
    return appCache.getOrFetch(CACHE_KEYS.wbs(projectId), TTL.tabData, async () => {
      try {
        const { data, error } = await supabase
          .from('pm_wbs_items')
          .select('*')
          .eq('project_id', projectId)
          .order('level', { ascending: true })
          .order('sort_order', { ascending: true })
          .order('wbs_code', { ascending: true });

        if (error) {
          logger.warn('pm_wbs_items fetch error:', { detail: error });
          return [];
        }
        return (data || []).map((d) => ({
          ...d,
          weight_percentage: Number(d.weight_percentage || 0),
          budgeted_cost: Number(d.budgeted_cost || 0),
          actual_cost: Number(d.actual_cost || 0),
          earned_value: Number(d.earned_value || 0),
          level: Number(d.level || 1),
          sort_order: Number(d.sort_order || 0),
        }));
      } catch (err) {
        logger.error('Failed to fetch WBS items:', { detail: err });
        return [];
      }
    });
  }

  /**
   * Fetch activities for a project and map them to WBS hierarchy tree.
   * Supports optional `canSeePrices` boolean or role-visibility options; strips
   * cost/financial fields when `canSeePrices === false`.
   */
  static async getWBSTree(
    projectId: string,
    canSeePrices?:
      | boolean
      | {
          canSeePrices?: boolean;
          userRoles?: string[] | null;
          isAdmin?: boolean;
          hasPriceGrant?: boolean;
        }
  ): Promise<WBSItem[]> {
    try {
      const [wbsItems, activitiesRes, boqRes, boqLinksRes] = await Promise.all([
        this.getWBSItems(projectId),
        supabase
          .from('pm_project_activities')
          .select('*')
          .eq('project_id', projectId)
          .order('planned_start', { ascending: true }),
        supabase
          .from('pm_boq_items')
          .select('id, wbs_item_id, item_code, description_ar, amount_egp, contract_qty, rate_egp')
          .eq('project_id', projectId),
        supabase
          .from('pm_activity_boq_links')
          .select('id, activity_id, boq_item_id, planned_qty, baseline_rate_egp'),
      ]);

      const boqItems = boqRes.data || [];
      const boqItemMap = new Map<string, (typeof boqItems)[number]>();
      boqItems.forEach((b) => boqItemMap.set(b.id, b));

      const activityBoqLinkMap = new Map<string, NonNullable<ProjectActivity['boq_links']>>();
      (boqLinksRes.data || []).forEach((l) => {
        const item = boqItemMap.get(l.boq_item_id);
        const list = activityBoqLinkMap.get(l.activity_id) || [];
        list.push({
          ...l,
          boq_item: item as NonNullable<ProjectActivity['boq_links']>[number]['boq_item'],
        });
        activityBoqLinkMap.set(l.activity_id, list);
      });

      const activities: ProjectActivity[] = (activitiesRes.data || []).map((a) => ({
        ...a,
        percent_complete: Number(a.percent_complete || 0),
        budgeted_cost_egp: Number(a.budgeted_cost_egp || 0),
        duration_days: Number(a.duration_days || 0),
        boq_links: activityBoqLinkMap.get(a.id) || a.boq_links || [],
      }));

      // Group activities by wbs_item_id
      const actMap = new Map<string, ProjectActivity[]>();
      activities.forEach((act) => {
        if (act.wbs_item_id) {
          const list = actMap.get(act.wbs_item_id) || [];
          list.push(act);
          actMap.set(act.wbs_item_id, list);
        }
      });

      // Group BOQ amounts by wbs_item_id
      const boqCostMap = new Map<string, number>();
      boqItems.forEach((b) => {
        if (b.wbs_item_id) {
          const current = boqCostMap.get(b.wbs_item_id) || 0;
          boqCostMap.set(b.wbs_item_id, current + Number(b.amount_egp || 0));
        }
      });

      // Clone items and attach direct properties
      const itemMap = new Map<string, WBSItem>();
      wbsItems.forEach((item) => {
        const itemActs = actMap.get(item.id) || [];
        const boqCost = boqCostMap.get(item.id) || 0;
        const actCost = itemActs.reduce((acc, a) => acc + (a.budgeted_cost_egp || 0), 0);
        const directCost = boqCost || actCost;
        const itemDbBudget = Number(item.budgeted_cost || 0);

        // Earned Value proxy
        const directEv = itemActs.reduce(
          (acc, a) => acc + (a.budgeted_cost_egp || 0) * ((a.percent_complete || 0) / 100),
          0
        );

        let directProgress = 0;
        const directBac = directCost || itemDbBudget;
        if (directBac > 0) {
          directProgress = (directEv / directBac) * 100;
        } else if (itemActs.length > 0) {
          const sumPct = itemActs.reduce((acc, a) => acc + (a.percent_complete || 0), 0);
          directProgress = sumPct / itemActs.length;
        }

        itemMap.set(item.id, {
          ...item,
          budgeted_cost: directBac,
          earned_value: directEv,
          progress_pct: Number(directProgress.toFixed(1)),
          activity_count: itemActs.length,
          activities: itemActs,
          children: [],
        });
      });

      // Build hierarchy tree with cycle prevention
      const rootItems: WBSItem[] = [];
      const isAncestor = (ancestorId: string, childId: string): boolean => {
        let cur = itemMap.get(childId);
        const visited = new Set<string>();
        while (cur && cur.parent_id) {
          if (visited.has(cur.id)) break;
          visited.add(cur.id);
          if (cur.parent_id === ancestorId) return true;
          cur = itemMap.get(cur.parent_id);
        }
        return false;
      };

      itemMap.forEach((item) => {
        if (
          item.parent_id &&
          item.parent_id !== item.id &&
          itemMap.has(item.parent_id) &&
          !isAncestor(item.id, item.parent_id)
        ) {
          const parent = itemMap.get(item.parent_id)!;
          parent.children = parent.children || [];
          parent.children.push(item);
        } else {
          item.parent_id = null;
          rootItems.push(item);
        }
      });

      // Rollup calculations recursively with cycle protection & double-count prevention
      function rollupNode(node: WBSItem, visited = new Set<string>()): {
        totalBac: number;
        totalEv: number;
        totalActivities: number;
        totalWeightPct: number;
      } {
        if (visited.has(node.id)) {
          return {
            totalBac: node.budgeted_cost || 0,
            totalEv: node.earned_value || 0,
            totalActivities: node.activity_count || 0,
            totalWeightPct: node.weight_percentage || 0,
          };
        }
        visited.add(node.id);

        let childBac = 0;
        let childEv = 0;
        let childActCount = 0;
        let childPctSum = 0;

        if (node.children && node.children.length > 0) {
          node.children.forEach((child) => {
            const cr = rollupNode(child, visited);
            childBac += cr.totalBac;
            childEv += cr.totalEv;
            childActCount += cr.totalActivities;
            childPctSum += child.progress_pct || 0;
          });

          // Prevent budget double counting: if children have budget, parent budget rolls up from children (+ direct activities/boq if any)
          const directActs = actMap.get(node.id) || [];
          const directBoq = boqCostMap.get(node.id) || 0;
          const directActsCost = directActs.reduce((acc, a) => acc + (a.budgeted_cost_egp || 0), 0);
          const directCost = directBoq || directActsCost;

          if (childBac > 0) {
            node.budgeted_cost = directCost + childBac;
          } else {
            node.budgeted_cost = (node.budgeted_cost || 0) + childBac;
          }

          node.earned_value = (node.earned_value || 0) + childEv;
          node.activity_count = (node.activity_count || 0) + childActCount;

          if ((node.budgeted_cost || 0) > 0) {
            node.progress_pct = Number((((node.earned_value || 0) / (node.budgeted_cost || 1)) * 100).toFixed(1));
          } else if (node.children.length > 0) {
            node.progress_pct = Number((childPctSum / node.children.length).toFixed(1));
          }

          // Sort children
          node.children.sort((a, b) => {
            if ((a.sort_order ?? 0) !== (b.sort_order ?? 0)) {
              return (a.sort_order ?? 0) - (b.sort_order ?? 0);
            }
            return (a.wbs_code || '').localeCompare(b.wbs_code || '', undefined, { numeric: true });
          });
        }

        return {
          totalBac: node.budgeted_cost || 0,
          totalEv: node.earned_value || 0,
          totalActivities: node.activity_count || 0,
          totalWeightPct: node.weight_percentage || 0,
        };
      }

      rootItems.forEach((root) => rollupNode(root));

      // Sort roots
      rootItems.sort((a, b) => {
        if ((a.sort_order ?? 0) !== (b.sort_order ?? 0)) {
          return (a.sort_order ?? 0) - (b.sort_order ?? 0);
        }
        return (a.wbs_code || '').localeCompare(b.wbs_code || '', undefined, { numeric: true });
      });

      const shouldMaskPrices =
        canSeePrices === false
          ? true
          : typeof canSeePrices === 'object' && canSeePrices !== null
            ? typeof canSeePrices.canSeePrices === 'boolean'
              ? !canSeePrices.canSeePrices
              : !canViewPrices(
                  canSeePrices.userRoles,
                  canSeePrices.isAdmin,
                  canSeePrices.hasPriceGrant
                )
            : false;

      if (!shouldMaskPrices) {
        return rootItems;
      }

      const maskBoqRecord = <T extends Record<string, any>>(record: T): T => {
        const cleaned = { ...record };
        for (const field of PRICE_FIELDS) {
          if (field in cleaned) {
            (cleaned as Record<string, unknown>)[field] = null;
          }
        }
        return cleaned;
      };

      const maskWbsNode = (node: WBSItem): WBSItem => ({
        ...node,
        budgeted_cost: null as unknown as number | undefined,
        actual_cost: null as unknown as number | undefined,
        earned_value: null as unknown as number | undefined,
        activities: node.activities?.map((act) => ({
          ...act,
          budgeted_cost_egp: null as unknown as number,
          boq_links: act.boq_links?.map((link) => ({
            ...link,
            baseline_rate_egp: null as unknown as number,
            boq_item: link.boq_item ? maskBoqRecord(link.boq_item) : link.boq_item,
          })),
        })),
        children: node.children?.map(maskWbsNode),
      });

      return rootItems.map(maskWbsNode);
    } catch (err) {
      logger.error('Failed to construct WBS tree:', { detail: err });
      return [];
    }
  }

  /**
   * Create a new WBS item
   */
  static async createWBSItem(item: Partial<WBSItem>): Promise<WBSItem> {
    if (!item.project_id || !item.title_ar) {
      throw new Error('بيانات بند WBS غير مكتملة (المشروع واسم البند مطلوبان)');
    }

    let level = item.level;
    if (level === undefined) {
      if (item.parent_id) {
        const { data: parent } = await supabase
          .from('pm_wbs_items')
          .select('level')
          .eq('id', item.parent_id)
          .single();
        level = (parent?.level || 1) + 1;
      } else {
        level = 1;
      }
    }

    const payload = {
      project_id: item.project_id,
      parent_id: item.parent_id || null,
      wbs_code: item.wbs_code?.trim() || null,
      title_ar: item.title_ar.trim(),
      title_en: item.title_en?.trim() || null,
      description: item.description?.trim() || null,
      level: level,
      sort_order: item.sort_order ?? 0,
      weight_percentage: item.weight_percentage ?? 0,
      budgeted_cost: item.budgeted_cost ?? 0,
      actual_cost: item.actual_cost ?? 0,
      earned_value: item.earned_value ?? 0,
      status: item.status || 'not_started',
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('pm_wbs_items')
      .insert([payload])
      .select()
      .single();

    if (error) {
      logger.error('createWBSItem database error:', { detail: error });
      throw new Error(error.message || 'فشل إضافة بند WBS');
    }

    appCache.invalidate(CACHE_KEYS.wbs(item.project_id));
    return data;
  }

  /**
   * Update existing WBS item
   */
  static async updateWBSItem(id: string, updates: Partial<WBSItem>): Promise<void> {
    if (updates.parent_id && updates.parent_id === id) {
      throw new Error('لا يمكن لحزمة العمل أن تكون حزمة أب لنفسها');
    }

    const payload: Record<string, unknown> = {
      ...updates,
      updated_at: new Date().toISOString(),
    };
    delete payload.children;
    delete payload.activities;
    delete payload.activity_count;
    delete payload.progress_pct;

    const { error } = await supabase
      .from('pm_wbs_items')
      .update(payload)
      .eq('id', id);

    if (error) {
      logger.error('updateWBSItem database error:', { detail: error });
      throw new Error(error.message || 'فشل تحديث بند WBS');
    }

    if (updates.project_id) {
      appCache.invalidate(CACHE_KEYS.wbs(updates.project_id));
    }
  }

  /**
   * Delete WBS item
   */
  static async deleteWBSItem(id: string, projectId?: string): Promise<void> {
    const { error } = await supabase.from('pm_wbs_items').delete().eq('id', id);
    if (error) {
      logger.error('deleteWBSItem error:', { detail: error });
      throw new Error(error.message || 'فشل حذف بند WBS');
    }
    if (projectId) {
      appCache.invalidate(CACHE_KEYS.wbs(projectId));
    }
  }

  /**
   * Assign multiple activities to a specific WBS item
   */
  static async assignActivities(activityIds: string[], wbsItemId: string, projectId?: string): Promise<void> {
    if (!activityIds.length) return;

    const { error } = await supabase
      .from('pm_project_activities')
      .update({ wbs_item_id: wbsItemId })
      .in('id', activityIds);

    if (error) {
      logger.error('assignActivities error:', { detail: error });
      throw new Error(error.message || 'فشل تعيين الأنشطة لهيكل WBS');
    }

    if (projectId) {
      appCache.invalidate(CACHE_KEYS.wbs(projectId));
      appCache.invalidate(CACHE_KEYS.planning.activities(projectId));
    }
  }

  /**
   * Unassign activities from WBS
   */
  static async unassignActivities(activityIds: string[], projectId?: string): Promise<void> {
    if (!activityIds.length) return;

    const { error } = await supabase
      .from('pm_project_activities')
      .update({ wbs_item_id: null })
      .in('id', activityIds);

    if (error) {
      logger.error('unassignActivities error:', { detail: error });
      throw new Error(error.message || 'فشل إلغاء تعيين الأنشطة');
    }

    if (projectId) {
      appCache.invalidate(CACHE_KEYS.wbs(projectId));
      appCache.invalidate(CACHE_KEYS.planning.activities(projectId));
    }
  }

  /**
   * Fetch unassigned activities (activities where wbs_item_id is null)
   */
  static async getUnassignedActivities(projectId: string): Promise<ProjectActivity[]> {
    try {
      const { data, error } = await supabase
        .from('pm_project_activities')
        .select('*')
        .eq('project_id', projectId)
        .is('wbs_item_id', null)
        .order('activity_code', { ascending: true });

      if (error) {
        logger.warn('getUnassignedActivities error:', { detail: error });
        return [];
      }
      return data || [];
    } catch (err) {
      logger.error('Failed to get unassigned activities:', { detail: err });
      return [];
    }
  }

  /**
   * Auto-generate hierarchical WBS packages from activity code patterns
   * Supports dot notation (CON.G4), hyphen notation (SL-L2-TC-01), slash notation (A/B/01).
   */
  static async autoGenerateFromActivities(projectId: string): Promise<WBSItem[]> {
    // 1. Fetch all activities for project
    const { data: activities, error: actErr } = await supabase
      .from('pm_project_activities')
      .select('id, activity_code, code, name_ar, wbs_item_id')
      .eq('project_id', projectId);

    if (actErr) {
      throw new Error('فشل جلب الأنشطة لتوليد WBS: ' + actErr.message);
    }

    if (!activities || activities.length === 0) {
      return [];
    }

    // 2. Fetch existing WBS items for project to avoid duplicates
    const existingWbs = await this.getWBSItems(projectId);
    const codeToWbsMap = new Map<string, WBSItem>();
    existingWbs.forEach((w) => {
      if (w.wbs_code) {
        codeToWbsMap.set(w.wbs_code.trim().toUpperCase(), w);
      }
    });

    // 3. Extract prefix hierarchy from activity codes
    // Map of prefixCode -> { code, parentCode, level, titleAr, titleEn }
    const prefixMap = new Map<
      string,
      { code: string; parentCode: string | null; level: number; titleAr: string; titleEn: string }
    >();

    // Activity ID -> deepest prefix code
    const activityAssignment = new Map<string, string>();

    for (const act of activities) {
      const rawCode = (act.activity_code || act.code || '').trim();
      if (!rawCode) continue;

      const delimiters: string[] = rawCode.match(/[.\-\/_]/g) || [];
      const words: string[] = rawCode.split(/[.\-\/_]/).map((p: string) => p.trim()).filter(Boolean);

      if (words.length <= 1) {
        // Single segment or no delimiter: group into General or prefix alpha
        const alphaMatch = rawCode.match(/^([A-Za-z]+)/);
        const prefix = alphaMatch ? alphaMatch[1].toUpperCase() : 'GENERAL';
        if (!prefixMap.has(prefix)) {
          prefixMap.set(prefix, {
            code: prefix,
            parentCode: null,
            level: 1,
            titleAr: `حزمة أعمال ${prefix}`,
            titleEn: `WBS Package ${prefix}`,
          });
        }
        activityAssignment.set(act.id, prefix);
        continue;
      }

      // If words.length >= 2, the last word is typically the activity index/suffix
      // (e.g. CON.G4.100 -> prefixes: CON (lvl 1), CON.G4 (lvl 2); activity -> CON.G4)
      const prefixWords = words.slice(0, -1);
      let parentCode: string | null = null;
      let deepestCode = '';

      for (let i = 0; i < prefixWords.length; i++) {
        const currentCode = prefixWords.slice(0, i + 1).reduce((acc: string, word: string, idx: number) => {
          if (idx === 0) return word.toUpperCase();
          const delim = delimiters[idx - 1] || '.';
          return `${acc}${delim}${word.toUpperCase()}`;
        }, '');
        const level = i + 1;

        if (!prefixMap.has(currentCode)) {
          prefixMap.set(currentCode, {
            code: currentCode,
            parentCode,
            level,
            titleAr: `حزمة أعمال ${currentCode}`,
            titleEn: `WBS Package ${currentCode}`,
          });
        }
        parentCode = currentCode;
        deepestCode = currentCode;
      }

      if (deepestCode) {
        activityAssignment.set(act.id, deepestCode);
      }
    }

    if (prefixMap.size === 0) {
      return existingWbs;
    }

    // 4. Insert new WBS items level by level to establish parent_id
    const maxLevel = Math.max(...Array.from(prefixMap.values()).map((p) => p.level), 1);

    for (let lvl = 1; lvl <= maxLevel; lvl++) {
      const itemsAtLevel = Array.from(prefixMap.values()).filter(
        (p) => p.level === lvl && !codeToWbsMap.has(p.code)
      );

      if (itemsAtLevel.length === 0) continue;

      const toInsert = itemsAtLevel.map((p, idx) => {
        const parentWbs = p.parentCode ? codeToWbsMap.get(p.parentCode) : null;
        return {
          project_id: projectId,
          parent_id: parentWbs?.id || null,
          wbs_code: p.code,
          title_ar: p.titleAr,
          title_en: p.titleEn,
          level: p.level,
          sort_order: idx + 1,
          weight_percentage: 0,
          budgeted_cost: 0,
          actual_cost: 0,
          earned_value: 0,
          status: 'not_started',
        };
      });

      const { data: inserted, error: insErr } = await supabase
        .from('pm_wbs_items')
        .insert(toInsert)
        .select();

      if (insErr) {
        logger.error(`Error inserting level ${lvl} WBS items:`, { detail: insErr });
        throw new Error(`فشل إنشاء بنود WBS للمستوى ${lvl}: ` + insErr.message);
      }

      (inserted || []).forEach((row) => {
        if (row.wbs_code) {
          codeToWbsMap.set(row.wbs_code.trim().toUpperCase(), row);
        }
      });
    }

    // 5. Update activities with their assigned wbs_item_id (only if currently null)
    // Group activity IDs by wbs_item_id
    const wbsToActivityIds = new Map<string, string[]>();
    activities.forEach((act) => {
      // Golden Rule #2: only assign if wbs_item_id is NULL
      if (!act.wbs_item_id) {
        const targetPrefix = activityAssignment.get(act.id);
        if (targetPrefix && codeToWbsMap.has(targetPrefix)) {
          const wbsId = codeToWbsMap.get(targetPrefix)!.id;
          const list = wbsToActivityIds.get(wbsId) || [];
          list.push(act.id);
          wbsToActivityIds.set(wbsId, list);
        }
      }
    });

    for (const [wbsId, actIds] of wbsToActivityIds.entries()) {
      if (actIds.length > 0) {
        const chunkSize = 200;
        for (let i = 0; i < actIds.length; i += chunkSize) {
          const chunk = actIds.slice(i, i + chunkSize);
          await supabase
            .from('pm_project_activities')
            .update({ wbs_item_id: wbsId })
            .in('id', chunk);
        }
      }
    }

    // 6. Invalidate caches and return fresh WBS items
    appCache.invalidate(CACHE_KEYS.wbs(projectId));
    appCache.invalidate(CACHE_KEYS.planning.activities(projectId));

    return this.getWBSItems(projectId);
  }

  /**
   * Calculate EVM metrics rolled up per WBS item and overall project summary
   */
  static async getWBSEvmSummary(
    projectId: string
  ): Promise<{ items: WBSEvmSummary[]; dashboard: WBSTabDashboardData }> {
    const [wbsItems, activitiesRes, boqRes] = await Promise.all([
      this.getWBSItems(projectId),
      supabase
        .from('pm_project_activities')
        .select('*')
        .eq('project_id', projectId),
      supabase
        .from('pm_boq_items')
        .select('id, wbs_item_id, amount_egp')
        .eq('project_id', projectId),
    ]);

    const activities: ProjectActivity[] = (activitiesRes.data || []).map((a) => ({
      ...a,
      percent_complete: Number(a.percent_complete || 0),
      budgeted_cost_egp: Number(a.budgeted_cost_egp || 0),
      duration_days: Number(a.duration_days || 0),
    }));

    const boqItems = boqRes.data || [];
    const now = new Date();

    // Map activities by wbs_item_id
    const actMap = new Map<string, ProjectActivity[]>();
    activities.forEach((act) => {
      if (act.wbs_item_id) {
        const list = actMap.get(act.wbs_item_id) || [];
        list.push(act);
        actMap.set(act.wbs_item_id, list);
      }
    });

    // Map boq by wbs_item_id
    const boqMap = new Map<string, number>();
    boqItems.forEach((b) => {
      if (b.wbs_item_id) {
        boqMap.set(b.wbs_item_id, (boqMap.get(b.wbs_item_id) || 0) + Number(b.amount_egp || 0));
      }
    });

    // Compute activity PV helper
    const computeActivityPv = (act: ProjectActivity): number => {
      const cost = act.budgeted_cost_egp || 0;
      if (!act.planned_start || !act.planned_finish) {
        return cost * ((act.percent_complete || 0) / 100);
      }
      const start = new Date(act.planned_start);
      const finish = new Date(act.planned_finish);
      if (now < start) return 0;
      if (now >= finish) return cost;
      const totalDur = Math.max(1, finish.getTime() - start.getTime());
      const elapsed = Math.max(0, now.getTime() - start.getTime());
      return cost * Math.min(1, elapsed / totalDur);
    };

    // Node interface for hierarchical bottom-up rollup
    interface EvmRollupNode {
      wbs: WBSItem;
      directBac: number;
      directEv: number;
      directPv: number;
      directAc: number;
      directActsCount: number;
      totalBac: number;
      totalEv: number;
      totalPv: number;
      totalAc: number;
      totalActsCount: number;
      progressPct: number;
      children: EvmRollupNode[];
    }

    const nodeMap = new Map<string, EvmRollupNode>();

    wbsItems.forEach((wbs) => {
      const itemActs = actMap.get(wbs.id) || [];
      const directBoq = boqMap.get(wbs.id) || 0;
      const directActBac = itemActs.reduce((acc, a) => acc + (a.budgeted_cost_egp || 0), 0);
      const directCost = directBoq || directActBac;
      const itemDbBudget = Number(wbs.budgeted_cost || 0);

      const directEv = itemActs.reduce(
        (acc, a) => acc + (a.budgeted_cost_egp || 0) * ((a.percent_complete || 0) / 100),
        0
      );
      const directPv = itemActs.reduce((acc, a) => acc + computeActivityPv(a), 0);
      const directAc = Number(wbs.actual_cost || 0);

      nodeMap.set(wbs.id, {
        wbs,
        directBac: directCost || itemDbBudget,
        directEv,
        directPv,
        directAc,
        directActsCount: itemActs.length,
        totalBac: 0,
        totalEv: 0,
        totalPv: 0,
        totalAc: 0,
        totalActsCount: 0,
        progressPct: 0,
        children: [],
      });
    });

    // Build hierarchy graph with cycle guard
    const rootNodes: EvmRollupNode[] = [];
    const isAncestorNode = (ancestorId: string, childId: string): boolean => {
      let cur = nodeMap.get(childId);
      const visited = new Set<string>();
      while (cur && cur.wbs.parent_id) {
        if (visited.has(cur.wbs.id)) break;
        visited.add(cur.wbs.id);
        if (cur.wbs.parent_id === ancestorId) return true;
        cur = nodeMap.get(cur.wbs.parent_id);
      }
      return false;
    };

    nodeMap.forEach((node) => {
      const pid = node.wbs.parent_id;
      if (pid && pid !== node.wbs.id && nodeMap.has(pid) && !isAncestorNode(node.wbs.id, pid)) {
        nodeMap.get(pid)!.children.push(node);
      } else {
        rootNodes.push(node);
      }
    });

    // Recursive bottom-up rollup
    function rollupEvm(node: EvmRollupNode, visited = new Set<string>()) {
      if (visited.has(node.wbs.id)) return;
      visited.add(node.wbs.id);

      let childBac = 0;
      let childEv = 0;
      let childPv = 0;
      let childAc = 0;
      let childActs = 0;
      let childPctSum = 0;

      node.children.forEach((c) => {
        rollupEvm(c, visited);
        childBac += c.totalBac;
        childEv += c.totalEv;
        childPv += c.totalPv;
        childAc += c.totalAc;
        childActs += c.totalActsCount;
        childPctSum += c.progressPct;
      });

      if (node.children.length > 0) {
        node.totalBac = childBac > 0 ? (node.directBac || 0) + childBac : node.directBac;
        node.totalEv = node.directEv + childEv;
        node.totalPv = node.directPv + childPv;
        node.totalAc = childAc > 0 ? node.directAc + childAc : node.directAc;
        node.totalActsCount = node.directActsCount + childActs;
        if (node.totalBac > 0) {
          node.progressPct = Number(((node.totalEv / node.totalBac) * 100).toFixed(1));
        } else if (node.children.length > 0) {
          node.progressPct = Number((childPctSum / node.children.length).toFixed(1));
        }
      } else {
        node.totalBac = node.directBac;
        node.totalEv = node.directEv;
        node.totalPv = node.directPv;
        node.totalAc = node.directAc;
        node.totalActsCount = node.directActsCount;
        if (node.totalBac > 0) {
          node.progressPct = Number(((node.totalEv / node.totalBac) * 100).toFixed(1));
        } else if (node.directActsCount > 0) {
          const acts = actMap.get(node.wbs.id) || [];
          const sumPct = acts.reduce((acc, a) => acc + (a.percent_complete || 0), 0);
          node.progressPct = Number((sumPct / node.directActsCount).toFixed(1));
        } else {
          node.progressPct = 0;
        }
      }
    }

    rootNodes.forEach((r) => rollupEvm(r));

    const items: WBSEvmSummary[] = wbsItems.map((wbs) => {
      const node = nodeMap.get(wbs.id)!;
      const evm = calculateEVM({
        earnedValueEgp: node.totalEv,
        plannedValueEgp: node.totalPv,
        actualCostEgp: node.totalAc,
        budgetAtCompletionEgp: node.totalBac,
      });

      return {
        wbs_id: wbs.id,
        wbs_code: wbs.wbs_code || '',
        title_ar: wbs.title_ar,
        title_en: wbs.title_en,
        level: wbs.level || 1,
        activity_count: node.totalActsCount,
        progress_pct: node.progressPct,
        budgeted_cost: node.totalBac,
        earned_value: node.totalEv,
        actual_cost: node.totalAc,
        planned_value: node.totalPv,
        spi: evm.spi,
        cpi: evm.cpi,
        etc: evm.etc,
        eac: evm.eac,
        vac: evm.vac,
        status: wbs.status || 'not_started',
      };
    });

    // Dashboard rollup across ALL activities
    let totalBac = 0;
    let totalEv = 0;
    const totalAc = wbsItems.reduce((acc, w) => acc + Number(w.actual_cost || 0), 0);
    let totalPv = 0;

    let inProgressCount = 0;
    let completedCount = 0;
    let delayedCount = 0;
    let notStartedCount = 0;

    activities.forEach((act) => {
      const pct = act.percent_complete || 0;
      const cost = act.budgeted_cost_egp || 0;
      totalBac += cost;
      totalEv += cost * (pct / 100);

      if (pct >= 100) {
        completedCount++;
      } else if (pct > 0) {
        inProgressCount++;
      } else {
        notStartedCount++;
      }

      // Check delayed: planned finish in the past and pct < 100
      if (act.planned_finish && new Date(act.planned_finish) < now && pct < 100) {
        delayedCount++;
      }

      // Planned value for activity
      if (act.planned_start && act.planned_finish) {
        const start = new Date(act.planned_start);
        const finish = new Date(act.planned_finish);
        if (now >= finish) {
          totalPv += cost;
        } else if (now > start) {
          const dur = Math.max(1, finish.getTime() - start.getTime());
          const el = now.getTime() - start.getTime();
          totalPv += cost * Math.min(1, el / dur);
        }
      } else {
        totalPv += cost * (pct / 100);
      }
    });

    // If totalBac is 0, check BOQ total
    if (totalBac === 0) {
      totalBac = boqItems.reduce((acc: number, b) => acc + Number(b.amount_egp || 0), 0);
    }

    const overallEvm = calculateEVM({
      earnedValueEgp: totalEv,
      plannedValueEgp: totalPv,
      actualCostEgp: totalAc,
      budgetAtCompletionEgp: totalBac,
    });

    let overallProgressPct = 0;
    if (totalBac > 0) {
      overallProgressPct = Number(((totalEv / totalBac) * 100).toFixed(1));
    } else if (activities.length > 0) {
      const sumPct = activities.reduce((acc, a) => acc + (a.percent_complete || 0), 0);
      overallProgressPct = Number((sumPct / activities.length).toFixed(1));
    }

    const dashboard: WBSTabDashboardData = {
      totalActivities: activities.length,
      inProgressActivities: inProgressCount,
      completedActivities: completedCount,
      delayedActivities: delayedCount,
      notStartedActivities: notStartedCount,
      overallProgressPct,
      totalBac: Number(totalBac.toFixed(2)),
      totalEv: Number(totalEv.toFixed(2)),
      totalAc: Number(totalAc.toFixed(2)),
      totalPv: Number(totalPv.toFixed(2)),
      spi: overallEvm.spi,
      cpi: overallEvm.cpi,
      etc: overallEvm.etc,
      eac: overallEvm.eac,
      vac: overallEvm.vac,
    };

    return { items, dashboard };
  }

  /**
   * Export WBS hierarchy and EVM data to Excel workbook
   */
  static async exportWBSReport(projectId: string, projectName: string = 'Project'): Promise<Blob> {
    const { items, dashboard } = await this.getWBSEvmSummary(projectId);
    const tree = await this.getWBSTree(projectId);

    // Flatten tree with indentation for hierarchy sheet
    const flatTreeRows: Array<Record<string, string | number>> = [];
    function flatten(nodes: WBSItem[], prefix = '') {
      nodes.forEach((n) => {
        flatTreeRows.push({
          'كود WBS': n.wbs_code || '-',
          'اسم حزمة العمل': `${prefix}${n.title_ar}`,
          'المستوى': n.level || 1,
          'عدد الأنشطة': n.activity_count || 0,
          'نسبة الإنجاز %': `${n.progress_pct || 0}%`,
          'الميزانية المعتمدة (BAC)': n.budgeted_cost || 0,
          'القيمة المكتسبة (EV)': n.earned_value || 0,
          'التكلفة الفعلية (AC)': n.actual_cost || 0,
          'الحالة':
            n.status === 'completed'
              ? 'مكتمل'
              : n.status === 'in_progress'
              ? 'قيد التنفيذ'
              : 'لم يبدأ',
        });
        if (n.children && n.children.length > 0) {
          flatten(n.children, prefix + '    └── ');
        }
      });
    }
    flatten(tree);

    // EVM Metrics Sheet
    const evmRows = items.map((it) => ({
      'كود WBS': it.wbs_code || '-',
      'اسم الحزمة': it.title_ar,
      'المستوى': it.level,
      'الأنشطة': it.activity_count,
      'نسبة الإنجاز %': `${it.progress_pct}%`,
      'BAC (الميزانية)': it.budgeted_cost,
      'EV (المكتسبة)': it.earned_value,
      'AC (الفعلية)': it.actual_cost,
      'PV (المخططة)': it.planned_value,
      'مؤشر الجدول (SPI)': it.spi,
      'مؤشر التكلفة (CPI)': it.cpi,
      'ETC (المتبقي)': it.etc,
      'EAC (المتوقع)': it.eac,
      'VAC (التباين)': it.vac,
    }));

    // Summary Sheet
    const summaryRows = [
      { 'المؤشر': 'إجمالي الأنشطة', 'القيمة': dashboard.totalActivities },
      { 'المؤشر': 'الأنشطة المكتملة', 'القيمة': dashboard.completedActivities },
      { 'المؤشر': 'أنشطة قيد التنفيذ', 'القيمة': dashboard.inProgressActivities },
      { 'المؤشر': 'الأنشطة المتأخرة', 'القيمة': dashboard.delayedActivities },
      { 'المؤشر': 'أنشطة لم تبدأ', 'القيمة': dashboard.notStartedActivities },
      { 'المؤشر': 'نسبة إنجاز المشروع الإجمالية', 'القيمة': `${dashboard.overallProgressPct}%` },
      { 'المؤشر': 'الميزانية المعتمدة عند الاكتمال (BAC)', 'القيمة': dashboard.totalBac },
      { 'المؤشر': 'القيمة المكتسبة الإجمالية (EV)', 'القيمة': dashboard.totalEv },
      { 'المؤشر': 'التكلفة الفعلية الإجمالية (AC)', 'القيمة': dashboard.totalAc },
      { 'المؤشر': 'القيمة المخططة (PV)', 'القيمة': dashboard.totalPv },
      { 'المؤشر': 'مؤشر أداء الجدول (SPI)', 'القيمة': dashboard.spi },
      { 'المؤشر': 'مؤشر أداء التكلفة (CPI)', 'القيمة': dashboard.cpi },
      { 'المؤشر': 'التقدير للإكمال (ETC)', 'القيمة': dashboard.etc },
      { 'المؤشر': 'التقدير عند الاكتمال (EAC)', 'القيمة': dashboard.eac },
      { 'المؤشر': 'الفرق عند الاكتمال (VAC)', 'القيمة': dashboard.vac },
    ];

    const wb = XLSX.utils.book_new();

    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'ملخص المشروع');

    const wsHierarchy = XLSX.utils.json_to_sheet(flatTreeRows);
    XLSX.utils.book_append_sheet(wb, wsHierarchy, 'هيكل WBS');

    const wsEvm = XLSX.utils.json_to_sheet(evmRows);
    XLSX.utils.book_append_sheet(wb, wsEvm, 'تحليل القيمة المكتسبة (EVM)');

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }
}
