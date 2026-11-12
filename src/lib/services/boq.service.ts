import type { ErrorLike } from '@/types/services-types';
import { supabase } from '@/lib/supabase';
import { appCache, CACHE_KEYS, TTL } from '@/lib/cache';
import { toast } from 'sonner';
import {
  BoqItem,
  BoqSection,
  CostCode,
  BoqSubMaterial,
  BoqRevision,
  BoqImportRow,
  BoqImportRowError,
  BoqImportValidationResult,
  BoqInclusionStatus,
} from '@/types/boq';
import { validateBoqImportRows } from '@/lib/planning/validators';
import { calculateProcurementQty } from '@/lib/planning/calculations';
import { logger } from '@/lib/logger';

import { canViewPrices } from '@/components/planning/PriceGate';

/**
 * Price-sensitive columns that must be stripped for non-financial roles.
 * Uses canViewPrices from PriceGate.tsx as single source of truth.
 */
export const PRICE_FIELDS = [
  'rate_egp',
  'amount_egp',
  'base_foreign_amount',
  'total_earned_egp',
  'contract_qty',
  'shop_drawing_qty',
  'unit_rate',
  'total_amount',
  'estimated_cost',
  'budget_unit_rate',
] as const;

/**
 * Strip price-sensitive columns from BOQ data when the user lacks financial access.
 * Returns a new array (does not mutate input).
 */
export function stripPriceFields<T extends Record<string, any>>(
  items: T[],
  userRoles?: string[] | null,
  isAdmin?: boolean,
  hasPriceGrant?: boolean
): T[] {
  if (canViewPrices(userRoles, isAdmin, hasPriceGrant)) return items;
  return items.map((item) => {
    const cleaned = { ...item };
    for (const field of PRICE_FIELDS) {
      if (field in cleaned) {
        (cleaned as Record<string, unknown>)[field] = null;
      }
    }
    return cleaned;
  });
}

export type BoqPriceVisibilityOptions =
  | boolean
  | {
      canSeePrices?: boolean;
      userRoles?: string[] | null;
      isAdmin?: boolean;
      hasPriceGrant?: boolean;
    };

function resolveShouldMaskPrices(canSeePrices?: BoqPriceVisibilityOptions): boolean {
  if (canSeePrices === false) return true;
  if (canSeePrices === true || canSeePrices === undefined) return false;
  if (typeof canSeePrices.canSeePrices === 'boolean') {
    return !canSeePrices.canSeePrices;
  }
  return !canViewPrices(
    canSeePrices.userRoles,
    canSeePrices.isAdmin,
    canSeePrices.hasPriceGrant
  );
}

function maskSingleBoqItem<T extends Record<string, any>>(item: T | null): T | null {
  if (!item) return null;
  const cleaned = { ...item };
  for (const field of PRICE_FIELDS) {
    if (field in cleaned) {
      (cleaned as Record<string, unknown>)[field] = null;
    }
  }
  return cleaned;
}

import { CostCodeService } from './costCode.service';

export class BoqService {
  /**
   * Fetch Cost Codes from reference table (delegated to CostCodeService).
   */
  static async getCostCodes(category?: string): Promise<CostCode[]> {
    return CostCodeService.getCostCodes({ category });
  }

  /**
   * Create or update a Cost Code (delegated to CostCodeService).
   */
  static async saveCostCode(costCode: Partial<CostCode>): Promise<CostCode | null> {
    return CostCodeService.saveCostCode(costCode);
  }

  /**
   * Fetch BOQ items for a project.
   * Pass userRoles/isAdmin to enforce server-side price masking.
   */
  static async getBoqItems(
    projectId: string,
    onlyCurrent = true,
    options?: { userRoles?: string[] | null; isAdmin?: boolean; hasPriceGrant?: boolean }
  ): Promise<BoqItem[]> {
    const key = CACHE_KEYS.boq.list(projectId, onlyCurrent);
    const items = await appCache.getOrFetch(key, TTL.boq, async () => {
      try {
        const targetTable = onlyCurrent ? 'v_boq_current' : 'pm_boq_items';
        const { data, error } = await supabase
          .from(targetTable)
          .select(`
            *,
            cost_code:pm_cost_codes(id, code, name_ar, name_en, category, prefix, is_header, parent_code, is_system)
          `)
          .eq('project_id', projectId)
          .order('item_code', { ascending: true });

        if (error) {
          // Fallback to direct pm_boq_items if view is not present
          const fallback = await supabase
            .from('pm_boq_items')
            .select('*')
            .eq('project_id', projectId)
            .order('item_code', { ascending: true });

          if (fallback.error) {
            logger.warn('BoqService.getBoqItems error:', { detail: fallback.error });
            return [];
          }
          return fallback.data || [];
        }

        // v_boq_current is a nested view without section/inclusion columns -> enrich
        const rows = (data || []) as BoqItem[];
        if (!rows.length) return rows;
        const { data: extra } = await supabase
          .from('pm_boq_items')
          .select('id, section_id, inclusion_status, inclusion_reason, inclusion_changed_at, inclusion_changed_by')
          .eq('project_id', projectId);
        const m = new Map((extra || []).map((e: Partial<BoqItem>) => [e.id, e]));
        return rows.map((r) => ({ ...r, ...(m.get(r.id) || {}) }));
      } catch (err) {
        logger.warn('BoqService.getBoqItems exception:', { detail: err });
        return [];
      }
    });
    // Server-side price masking: FAIL-SECURE default. Financial columns are
    // stripped unless the caller explicitly passes roles that are financially
    // authorized. Callers omitting options always receive masked data.
    return stripPriceFields(items, options?.userRoles, options?.isAdmin, options?.hasPriceGrant);
  }

  /**
   * Fetch single BOQ item by ID.
   * Supports optional `canSeePrices` boolean or role-visibility options; strips
   * financial fields when `canSeePrices === false` without mutating cached rows.
   */
  static async getBoqItemById(
    id: string,
    canSeePrices?: BoqPriceVisibilityOptions
  ): Promise<BoqItem | null> {
    const key = CACHE_KEYS.boq.item(id);
    const item = await appCache.getOrFetch(key, TTL.boq, async () => {
      try {
        const { data, error } = await supabase
          .from('pm_boq_items')
          .select(`
            *,
            cost_code:pm_cost_codes(id, code, name_ar, name_en, category, prefix, is_header, parent_code, is_system)
          `)
          .eq('id', id)
          .single();

        if (error) {
          logger.warn('BoqService.getBoqItemById error:', { detail: error });
          return null;
        }
        return data;
      } catch (err) {
        logger.warn('BoqService.getBoqItemById exception:', { detail: err });
        return null;
      }
    });

    return resolveShouldMaskPrices(canSeePrices) ? maskSingleBoqItem(item) : item;
  }

  /**
   * Cache-exempt single-row fetch of a BOQ item.
   * Used right after a save so the revision/version badge reflects the new
   * revision immediately instead of waiting out the 60s TTL list cache.
   * Strips financial fields when `canSeePrices === false`.
   */
  static async getBoqItemFresh(
    id: string,
    canSeePrices?: BoqPriceVisibilityOptions
  ): Promise<BoqItem | null> {
    try {
      const { data, error } = await supabase
        .from('pm_boq_items')
        .select(`
          *,
          cost_code:pm_cost_codes(id, code, name_ar, name_en, category, prefix, is_header, parent_code, is_system)
        `)
        .eq('id', id)
        .single();

      if (error) {
        logger.warn('BoqService.getBoqItemFresh error:', { detail: error });
        return null;
      }
      return resolveShouldMaskPrices(canSeePrices) ? maskSingleBoqItem(data) : data;
    } catch (err) {
      logger.warn('BoqService.getBoqItemFresh exception:', { detail: err });
      return null;
    }
  }

  /**
   * Bust every cache key tied to a single BOQ item (detail + revision history,
   * plus the project list keys when a project id is supplied). The TTL cache
   * itself stays intact for everything else.
   */
  static invalidateBoqItem(id: string, projectId?: string): void {
    appCache.invalidate(CACHE_KEYS.boq.item(id));
    appCache.invalidate(`boq:revisions:${id}`);
    if (projectId) {
      appCache.invalidate(CACHE_KEYS.boq.list(projectId, true));
      appCache.invalidate(CACHE_KEYS.boq.list(projectId, false));
    }
  }

  /**
   * Fetch all BOQ sections for a project.
   */
  static async getSections(projectId: string): Promise<BoqSection[]> {
    const key = `boq:sections:${projectId}`;
    return appCache.getOrFetch(key, TTL.boq, async () => {
      try {
        const { data, error } = await supabase
          .from('pm_boq_sections')
          .select('*')
          .eq('project_id', projectId)
          .order('sort_order', { ascending: true })
          .order('name_ar', { ascending: true });

        if (error) {
          logger.warn('BoqService.getSections error:', { detail: error });
          return [];
        }
        return data || [];
      } catch (err) {
        logger.warn('BoqService.getSections exception:', { detail: err });
        return [];
      }
    });
  }

  /**
   * Create or update a BOQ section.
   */
  static async saveSection(section: Partial<BoqSection>): Promise<BoqSection | null> {
    try {
      const payload = {
        project_id: section.project_id,
        zone_id: section.zone_id || null,
        discipline: section.discipline || null,
        name_ar: section.name_ar?.trim(),
        name_en: section.name_en?.trim() || null,
        sort_order: section.sort_order ?? 0,
        parent_section_id: section.parent_section_id || null,
        ...(section.source_sheet_name !== undefined ? { source_sheet_name: section.source_sheet_name } : {}),
        ...(section.is_optional !== undefined ? { is_optional: section.is_optional } : {}),
        ...(section.color !== undefined ? { color: section.color } : {}),
      };

      let result: BoqSection | null = null;
      if (section.id) {
        const { data, error } = await supabase
          .from('pm_boq_sections')
          .update(payload)
          .eq('id', section.id)
          .select()
          .single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('pm_boq_sections')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        result = data;
      }

      if (section.project_id) {
        appCache.invalidate(`boq:sections:${section.project_id}`);
      }
      return result;
    } catch (err) {
      logger.error('BoqService.saveSection error:', { detail: err });
      return null;
    }
  }

  /**
   * Delete a BOQ section.
   */
  static async deleteSection(id: string, projectId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('pm_boq_sections')
        .delete()
        .eq('id', id);
      if (error) throw error;

      appCache.invalidate(`boq:sections:${projectId}`);
      return true;
    } catch (err) {
      logger.error('BoqService.deleteSection error:', { detail: err });
      return false;
    }
  }

  /** Bust list + section caches for a project. */
  static invalidateProject(projectId: string): void {
    appCache.invalidate(CACHE_KEYS.boq.list(projectId, true));
    appCache.invalidate(CACHE_KEYS.boq.list(projectId, false));
    appCache.invalidate(`boq:sections:${projectId}`);
  }

  /**
   * Change inclusion (Add optional / Omit / Restore) for one or many items.
   * Omit is a soft state: item stays visible as "Omitted" and is excluded from totals.
   * Every change is snapshotted into pm_boq_revisions for audit.
   */
  static async setInclusion(
    projectId: string,
    itemIds: string[],
    status: BoqInclusionStatus,
    opts: { reason?: string; changedBy?: string } = {}
  ): Promise<{ success: boolean; error?: string }> {
    if (!itemIds.length) return { success: true };
    if (status === 'omitted' && !opts.reason?.trim()) {
      return { success: false, error: 'سبب الحذف (Omit) مطلوب' };
    }
    try {
      const now = new Date().toISOString();
      const { data: before } = await supabase
        .from('pm_boq_items')
        .select('id, revision, contract_qty, rate_egp, amount_egp, description_ar, inclusion_status')
        .in('id', itemIds);
      const { error } = await supabase
        .from('pm_boq_items')
        .update({
          inclusion_status: status,
          inclusion_reason: opts.reason?.trim() || null,
          inclusion_changed_at: now,
          inclusion_changed_by: opts.changedBy || null,
        })
        .in('id', itemIds);
      if (error) throw error;
      if (before?.length) {
        await supabase.from('pm_boq_revisions').insert(
          before.map((b: Record<string, unknown>) => ({
            boq_item_id: b.id,
            revision: b.revision ?? 1,
            contract_qty: b.contract_qty ?? 0,
            rate_egp: b.rate_egp ?? 0,
            amount_egp: b.amount_egp ?? 0,
            description_ar: b.description_ar ?? '',
            changed_by: opts.changedBy || null,
            change_reason: `Inclusion: ${b.inclusion_status ?? 'base'} -> ${status}${opts.reason ? ` | ${opts.reason}` : ''}`,
            snapshot_data: { inclusion_from: b.inclusion_status ?? 'base', inclusion_to: status },
          }))
        ).then(({ error: e }) => { if (e) logger.warn('inclusion audit insert failed', { detail: e }); });
      }
      BoqService.invalidateProject(projectId);
      itemIds.forEach((id) => appCache.invalidate(CACHE_KEYS.boq.item(id)));
      return { success: true };
    } catch (err) {
      logger.error('BoqService.setInclusion error:', { detail: err });
      return { success: false, error: (err as ErrorLike)?.message || 'failed' };
    }
  }

  /** Move items to a sheet page (section). Pass null to unassign. */
  static async assignItemsToSection(
    projectId: string,
    itemIds: string[],
    sectionId: string | null
  ): Promise<boolean> {
    if (!itemIds.length) return true;
    const { error } = await supabase.from('pm_boq_items').update({ section_id: sectionId }).in('id', itemIds);
    if (error) {
      logger.error('BoqService.assignItemsToSection error:', { detail: error });
      return false;
    }
    BoqService.invalidateProject(projectId);
    return true;
  }

  /** Bulk apply page assignments {itemId -> sectionId}. */
  static async applyAssignments(projectId: string, assignments: Record<string, string>): Promise<number> {
    const groups = new Map<string, string[]>();
    for (const [itemId, secId] of Object.entries(assignments)) {
      const arr = groups.get(secId) ?? [];
      arr.push(itemId);
      groups.set(secId, arr);
    }
    let moved = 0;
    for (const [secId, ids] of groups) {
      if (await BoqService.assignItemsToSection(projectId, ids, secId)) moved += ids.length;
    }
    return moved;
  }

  /** Find a sheet page by source name, or create it. */
  static async ensureSheetSection(
    projectId: string,
    name: string,
    opts: { sourceSheetName?: string; isOptional?: boolean; sortOrder?: number } = {}
  ): Promise<BoqSection | null> {
    const source = (opts.sourceSheetName || name).trim();
    const { data: existing } = await supabase
      .from('pm_boq_sections')
      .select('*')
      .eq('project_id', projectId)
      .or(`source_sheet_name.eq."${source.replace(/"/g, '')}",name_ar.eq."${name.trim().replace(/"/g, '')}"`)
      .limit(1)
      .maybeSingle();
    if (existing) return existing as BoqSection;
    return BoqService.saveSection({
      project_id: projectId,
      name_ar: name.trim(),
      name_en: name.trim(),
      source_sheet_name: source,
      is_optional: !!opts.isOptional,
      sort_order: opts.sortOrder ?? 0,
    });
  }

  /**
   * Create or update a BOQ item with in-place revisioning and audit snapshot.
   */
  static async saveBoqItem(
    item: Partial<BoqItem>,
    changedBy?: string,
    changeReason?: string
  ): Promise<BoqItem | null> {
    try {
      const contractQty = Number(item.contract_qty ?? 0);
      const rateEgp = Number(item.rate_egp ?? 0);
      const amountEgp = Number((contractQty * rateEgp).toFixed(2));

      let result: BoqItem | null = null;

      if (item.id) {
        // 1. Fetch current record before mutation
        const { data: existing } = await supabase
          .from('pm_boq_items')
          .select('*')
          .eq('id', item.id)
          .single();

        const currentRev = existing?.revision || 1;
        const newRev = currentRev + 1;

        // 2. Save revision snapshot
        if (existing) {
          // changed_by is an FK to auth.users(id) — only send a real UUID,
          // never a display name string (a string FK value makes the whole
          // INSERT fail and the revision history silently stays empty).
          const isUuid = (v?: string | null) =>
            !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
          const { data: revIns, error: revErr } = await supabase
            .from('pm_boq_revisions')
            .insert({
              boq_item_id: item.id,
              project_id: existing.project_id || item.project_id || null,
              revision: currentRev,
              contract_qty: existing.contract_qty,
              rate_egp: existing.rate_egp,
              amount_egp: existing.amount_egp,
              description_ar: existing.description_ar,
              changed_by: isUuid(changedBy) ? changedBy : null,
              change_reason: changeReason
                ? isUuid(changedBy)
                  ? changeReason
                  : `${changeReason}${changedBy ? ` — بواسطة: ${changedBy}` : ''}`
                : null,
              created_at: new Date().toISOString(),
              snapshot_data: existing,
            })
            .select('id')
            .single();
          if (revErr) {
            logger.error('Revision snapshot FAILED — revision history will be empty:', { detail: revErr });
            toast.error('تم حفظ التعديل لكن فشل تسجيل النسخة (Revision) — راجع سجل الأخطاء');
          }
        }

        // 3. Update existing BOQ item
        const updatePayload = {
          item_code: item.item_code,
          section_id: item.section_id || null,
          zone_id: item.zone_id || null,
          cost_code_id: item.cost_code_id || null,
          description_ar: item.description_ar,
          description_en: item.description_en || null,
          unit: item.unit,
          contract_qty: contractQty,
          shop_drawing_qty: item.shop_drawing_qty !== undefined ? item.shop_drawing_qty : null,
          pricing_status: item.pricing_status || 'contract_original',
          foreign_currency: item.foreign_currency || 'EGP',
          base_foreign_amount: item.base_foreign_amount || null,
          rate_egp: rateEgp,
          wbs_item_id: item.wbs_item_id || null,
          revision: newRev,
          vo_ref: item.vo_ref || null,
          notes: item.notes || null,
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from('pm_boq_items')
          .update(updatePayload)
          .eq('id', item.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Insert new BOQ item
        const insertPayload = {
          project_id: item.project_id,
          item_code: item.item_code,
          cost_code_id: item.cost_code_id || null,
          description_ar: item.description_ar,
          description_en: item.description_en || null,
          unit: item.unit,
          contract_qty: contractQty,
          shop_drawing_qty: item.shop_drawing_qty !== undefined ? item.shop_drawing_qty : null,
          pricing_status: item.pricing_status || 'contract_original',
          foreign_currency: item.foreign_currency || 'EGP',
          base_foreign_amount: item.base_foreign_amount || null,
          rate_egp: rateEgp,
          wbs_item_id: item.wbs_item_id || null,
          revision: 1,
          vo_ref: item.vo_ref || null,
          notes: item.notes || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from('pm_boq_items')
          .insert(insertPayload)
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      if (item.id && result) {
        // Cache-exempt single-row re-read: the caller (BoqTable) patches this
        // row straight into the table so the version badge snaps instantly,
        // instead of waiting for the 60s TTL list cache to age out.
        const fresh = await BoqService.getBoqItemFresh(item.id);
        if (fresh) result = fresh;
      }

      if (item.id) {
        // Revisions changed (snapshot inserted) — drop cached history + detail
        BoqService.invalidateBoqItem(item.id);
      }
      if (item.project_id) {
        // Invalidate BOTH cache key shapes used across the app
        // (`boq:items:{pid}` and `boq:items:{pid}:true/false` from CACHE_KEYS.boq.list)
        appCache.invalidate(`boq:items:${item.project_id}`);
        appCache.invalidate(CACHE_KEYS.boq.list(item.project_id, true));
        appCache.invalidate(CACHE_KEYS.boq.list(item.project_id, false));
      }

      return result;
    } catch (err) {
      logger.error('BoqService.saveBoqItem error:', { detail: err });
      return null;
    }
  }

  /**
   * Delete a BOQ item if not referenced.
   */
  static async deleteBoqItem(id: string, projectId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('pm_boq_items').delete().eq('id', id);
      if (error) throw error;

      appCache.invalidate(`boq:items:${projectId}`);
      appCache.invalidate(`boq:detail:${id}`);
      return true;
    } catch (err) {
      logger.error('BoqService.deleteBoqItem error:', { detail: err });
      return false;
    }
  }

  /**
   * Bulk import BOQ spreadsheet rows with validation and batch insert.
   */
  static async importBoqItems(
    projectId: string,
    rows: BoqImportRow[],
    importedBy?: string
  ): Promise<{ success: boolean; insertedCount: number; errors: BoqImportRowError[] }> {
    try {
      // 1. Run pure validator
      const validation = validateBoqImportRows(rows);
      if (!validation.valid && validation.validRows.length === 0) {
        return {
          success: false,
          insertedCount: 0,
          errors: validation.errors,
        };
      }

      // 2. Map valid rows into DB payload
      const payloads = validation.validRows.map((r) => ({
        project_id: projectId,
        item_code: r.item_code,
        description_ar: r.description_ar,
        description_en: r.description_en || null,
        unit: r.unit,
        contract_qty: r.contract_qty,
        shop_drawing_qty: r.shop_drawing_qty !== undefined ? r.shop_drawing_qty : null,
        rate_egp: r.rate_egp,
        foreign_currency: r.foreign_currency || 'EGP',
        base_foreign_amount: r.base_foreign_amount || null,
        pricing_status: r.pricing_status || 'contract_original',
        vo_ref: r.vo_ref || null,
        notes: r.notes || (importedBy ? `Imported by ${importedBy}` : null),
        ...((r as { section_id?: string | null }).section_id !== undefined ? { section_id: (r as { section_id?: string | null }).section_id } : {}),
        ...((r as { inclusion_status?: string }).inclusion_status ? { inclusion_status: (r as { inclusion_status?: string }).inclusion_status } : {}),
        revision: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from('pm_boq_items')
        .upsert(payloads, { onConflict: 'project_id,item_code' })
        .select();

      if (error) {
        logger.error('BoqService.importBoqItems upsert error:', { detail: error });
        return {
          success: false,
          insertedCount: 0,
          errors: [{ row: 0, reason: error.message }],
        };
      }

      appCache.invalidate(`boq:items:${projectId}`);

      return {
        success: true,
        insertedCount: data ? data.length : payloads.length,
        errors: validation.errors,
      };
    } catch (err: unknown) {
      logger.error('BoqService.importBoqItems exception:', { detail: err });
      return {
        success: false,
        insertedCount: 0,
        errors: [{ row: 0, reason: (err as ErrorLike).message || 'Unknown import error' }],
      };
    }
  }

  /**
   * Fetch BOM Sub-Materials for a BOQ item.
   */
  static async getSubMaterials(boqItemId: string): Promise<BoqSubMaterial[]> {
    const key = CACHE_KEYS.boq.subMaterials(boqItemId);
    return appCache.getOrFetch(key, TTL.boq, async () => {
      try {
        const { data, error } = await supabase
          .from('pm_boq_sub_materials')
          .select('*')
          .eq('boq_item_id', boqItemId)
          .order('created_at', { ascending: true });

        if (error) {
          logger.warn('BoqService.getSubMaterials error:', { detail: error });
          return [];
        }
        return data || [];
      } catch (err) {
        logger.warn('BoqService.getSubMaterials exception:', { detail: err });
        return [];
      }
    });
  }

  /**
   * Create or update a BOM Sub-Material with automated procurement calculation.
   */
  static async saveSubMaterial(subMaterial: Partial<BoqSubMaterial>): Promise<BoqSubMaterial | null> {
    try {
      const consumptionRate = Number(subMaterial.consumption_rate ?? 1.0);
      const standardWastagePct = Number(subMaterial.standard_wastage_pct ?? 0);

      // Fetch parent BOQ item contract_qty if required_procurement_qty not provided
      let requiredProcurementQty = subMaterial.required_procurement_qty;
      if (requiredProcurementQty === undefined && subMaterial.boq_item_id) {
        const { data: boqItem } = await supabase
          .from('pm_boq_items')
          .select('contract_qty')
          .eq('id', subMaterial.boq_item_id)
          .single();

        const parentQty = boqItem?.contract_qty ?? 0;
        requiredProcurementQty = calculateProcurementQty(parentQty, consumptionRate, standardWastagePct);
      }

      const payload = {
        boq_item_id: subMaterial.boq_item_id,
        material_name_ar: subMaterial.material_name_ar?.trim(),
        unit: subMaterial.unit || 'm3',
        consumption_rate: consumptionRate,
        standard_wastage_pct: standardWastagePct,
        required_procurement_qty: requiredProcurementQty ?? 0,
        ordered_qty: Number(subMaterial.ordered_qty ?? 0),
        delivered_to_site_qty: Number(subMaterial.delivered_to_site_qty ?? 0),
        procurement_stage: subMaterial.procurement_stage || 'material_submittal',
        supplier_ref: subMaterial.supplier_ref || null,
        notes: subMaterial.notes || null,
        updated_at: new Date().toISOString(),
      };

      let result: BoqSubMaterial | null = null;
      if (subMaterial.id) {
        const { data, error } = await supabase
          .from('pm_boq_sub_materials')
          .update(payload)
          .eq('id', subMaterial.id)
          .select()
          .single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('pm_boq_sub_materials')
          .insert({ ...payload, created_at: new Date().toISOString() })
          .select()
          .single();
        if (error) throw error;
        result = data;
      }

      if (subMaterial.boq_item_id) {
        appCache.invalidate(`boq:subMaterials:${subMaterial.boq_item_id}`);
      }

      return result;
    } catch (err) {
      logger.error('BoqService.saveSubMaterial error:', { detail: err });
      return null;
    }
  }

  /**
   * Delete BOM Sub-Material.
   */
  static async deleteSubMaterial(id: string, boqItemId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('pm_boq_sub_materials').delete().eq('id', id);
      if (error) throw error;

      appCache.invalidate(`boq:subMaterials:${boqItemId}`);
      return true;
    } catch (err) {
      logger.error('BoqService.deleteSubMaterial error:', { detail: err });
      return false;
    }
  }

  /**
   * Fetch revision history for a BOQ item.
   */
  static async getBoqRevisions(boqItemId: string): Promise<BoqRevision[]> {
    const key = CACHE_KEYS.boq.revisions(boqItemId);
    return appCache.getOrFetch(key, TTL.boq, async () => {
      try {
        const { data, error } = await supabase
          .from('pm_boq_revisions')
          .select('*')
          .eq('boq_item_id', boqItemId)
          .order('revision', { ascending: false });

        if (error) {
          logger.warn('BoqService.getBoqRevisions error:', { detail: error });
          return [];
        }
        return data || [];
      } catch (err) {
        logger.warn('BoqService.getBoqRevisions exception:', { detail: err });
        return [];
      }
    });
  }
}
