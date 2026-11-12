/**
 * Pure payload mapper — zero external dependencies, safe to import in tests.
 *
 * Strict ALLOW-LIST enforcement:
 *
 * 1. buildUpdatePayload(p)
 *    - Uses explicit ALLOWED_PM_PROJECT_UPDATE_FIELDS set of actual database columns.
 *    - Ignores EVERY key not in ALLOWED_PM_PROJECT_UPDATE_FIELDS (e.g. contract_value_egp, start_date).
 *    - Maps form aliases (e.g. contract_value_egp -> contract_value, start_date -> planned_start_date) to true schema columns.
 *    - Valid UUIDs are passed through; invalid UUID strings are sanitised to null when present.
 *    - Dates are sanitised (empty string "" -> null).
 *
 * 2. buildCreatePayload(p, organization_id)
 *    - Emits allowed columns for INSERT.
 *    - Optional FK fields default to null.
 *    - organization_id is set ONLY if explicitly provided.
 */

import { parseArabicIndicNumber } from '../utils/arabic-numerals';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUUID(v: unknown): boolean {
  return typeof v === 'string' && UUID_REGEX.test(v);
}

export function safeUUID(v: unknown): string | null {
  return isValidUUID(v) ? (v as string) : null;
}

export function safeDate(v: unknown): string | null {
  if (typeof v === 'string') {
    const trimmed = v.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return null;
}

/**
 * Strict allow-list for UPDATE operations on pm_projects.
 * Contains ONLY actual database columns exposed by public.pm_projects.
 */
export const ALLOWED_PM_PROJECT_UPDATE_FIELDS = new Set<string>([
  'project_code',
  'project_name',
  'project_name_en',
  'public_name',
  'client_id',
  'client_name_raw',
  'pzone_role',
  'governorate_id',
  'city_id',
  'site_location_address',
  'gps_lat',
  'gps_lng',
  'water_area_m2',
  'water_vol_m3',
  'status',
  'contract_status',
  'hardcopy_status',
  'planned_start_date',
  'planned_finish_date',
  'actual_start_date',
  'actual_finish_date',
  'contract_date',
  'contract_duration_months',
  'contract_value',
  'vos_value',
  'estimated_budget',
  'estimated_cost',
  'site_possession_letter',
  'toc_letter',
  'project_manager_id',
  'project_manager_stakeholder_id',
  'project_manager_name_raw',
  'completion_pct',
  'hold_reason',
  'suspension_reason',
  'cancel_reason',
  'cancellation_reason',
  'cover_image_url',
  'metadata',
]);

const UUID_FK_FIELDS = new Set<string>([
  'client_id',
  'governorate_id',
  'city_id',
  'project_manager_id',
  'project_manager_stakeholder_id',
]);

const DATE_FIELDS = new Set<string>([
  'planned_start_date',
  'planned_finish_date',
  'actual_start_date',
  'actual_finish_date',
  'contract_date',
]);

const NUMBER_FIELDS = new Set<string>([
  'water_area_m2',
  'water_vol_m3',
  'contract_value',
  'vos_value',
  'estimated_budget',
  'estimated_cost',
  'completion_pct',
  'contract_duration_months',
  'gps_lat',
  'gps_lng',
]);

/**
 * Calculates total additions, total deductions, and net VOs (+/-).
 */
export interface NetVosCalculation {
  totalAdditions: number;
  totalDeductions: number;
  netVos: number;
}

export function calculateNetVos(vos: unknown): NetVosCalculation {
  if (!Array.isArray(vos)) {
    return { totalAdditions: 0, totalDeductions: 0, netVos: 0 };
  }
  let totalAdditions = 0;
  let totalDeductions = 0;

  for (const item of vos) {
    if (!item || typeof item !== 'object') continue;
    const status = (item as any).status;
    if (status !== undefined && status !== null && String(status).trim() !== '' && String(status).toLowerCase() !== 'approved') {
      continue;
    }
    const rawAmount = (item as any).amount;
    const amt = Math.abs(Number(rawAmount) || 0);
    const type = (item as any).type;
    if (type === 'deduction') {
      totalDeductions += amt;
    } else {
      totalAdditions += amt;
    }
  }

  return {
    totalAdditions: Math.round(totalAdditions * 100) / 100,
    totalDeductions: Math.round(totalDeductions * 100) / 100,
    netVos: Math.round((totalAdditions - totalDeductions) * 100) / 100,
  };
}

/**
 * Normalises form alias keys to actual schema column names.
 */
function normalizeFormInput(p: Record<string, unknown>): Record<string, unknown> {
  const input = { ...p };

  if (input.variation_orders !== undefined && Array.isArray(input.variation_orders)) {
    const { netVos } = calculateNetVos(input.variation_orders);
    input.vos_value = netVos;
  }

  if (input.contract_value === undefined && input.contract_value_egp !== undefined) {
    input.contract_value = input.contract_value_egp;
  }
  if (input.water_area_m2 === undefined && input.total_water_area_m2 !== undefined) {
    input.water_area_m2 = input.total_water_area_m2;
  }
  if (input.water_vol_m3 === undefined && input.total_water_volume_m3 !== undefined) {
    input.water_vol_m3 = input.total_water_volume_m3;
  }
  if (input.planned_start_date === undefined && input.start_date !== undefined) {
    input.planned_start_date = input.start_date;
  }
  if (input.planned_finish_date === undefined && input.end_date !== undefined) {
    input.planned_finish_date = input.end_date;
  }
  if (input.project_name === undefined && input.project_name_ar !== undefined) {
    input.project_name = input.project_name_ar;
  }
  if (input.hold_reason === undefined && input.suspension_reason !== undefined) {
    input.hold_reason = input.suspension_reason;
  }
  if (input.cancel_reason === undefined && input.cancellation_reason !== undefined) {
    input.cancel_reason = input.cancellation_reason;
  }

  return input;
}

/**
 * Builds a safe payload for INSERT (Create).
 * Uses explicit allow-list. Defaults missing FK fields to null.
 * organization_id is set ONLY if explicitly provided.
 */
export function buildCreatePayload(
  rawInput: Record<string, unknown>,
  organization_id?: string | null
): Record<string, unknown> {
  const p = normalizeFormInput(rawInput);
  const payload: Record<string, unknown> = {};

  const explicitOrgId = organization_id || safeUUID(p.organization_id);
  if (explicitOrgId) {
    payload.organization_id = explicitOrgId;
  }

  if (p.project_code !== undefined) payload.project_code = p.project_code;
  if (p.project_name !== undefined) payload.project_name = p.project_name;
  if (p.project_name_en !== undefined) payload.project_name_en = p.project_name_en ?? null;
  if (p.public_name !== undefined) payload.public_name = p.public_name ? String(p.public_name).trim() : null;

  payload.client_id = safeUUID(p.client_id);
  if (p.client_name_raw !== undefined) payload.client_name_raw = p.client_name_raw ?? null;
  payload.pzone_role = p.pzone_role ?? 'Main Contractor';
  payload.governorate_id = safeUUID(p.governorate_id);
  payload.city_id = safeUUID(p.city_id);

  if (p.site_location_address !== undefined) payload.site_location_address = p.site_location_address ?? null;
  if (p.gps_lat !== undefined) payload.gps_lat = p.gps_lat !== null && p.gps_lat !== '' ? parseArabicIndicNumber(p.gps_lat) : null;
  if (p.gps_lng !== undefined) payload.gps_lng = p.gps_lng !== null && p.gps_lng !== '' ? parseArabicIndicNumber(p.gps_lng) : null;
  if (p.water_area_m2 !== undefined) payload.water_area_m2 = parseArabicIndicNumber(p.water_area_m2, 0);
  if (p.water_vol_m3 !== undefined) payload.water_vol_m3 = parseArabicIndicNumber(p.water_vol_m3, 0);

  payload.status = p.status ?? 'working';
  if (p.contract_status !== undefined) payload.contract_status = p.contract_status ?? null;
  if (p.hardcopy_status !== undefined) payload.hardcopy_status = p.hardcopy_status ?? null;
  if (p.planned_start_date !== undefined) payload.planned_start_date = safeDate(p.planned_start_date);
  if (p.planned_finish_date !== undefined) payload.planned_finish_date = safeDate(p.planned_finish_date);
  if (p.actual_start_date !== undefined) payload.actual_start_date = safeDate(p.actual_start_date);
  if (p.actual_finish_date !== undefined) payload.actual_finish_date = safeDate(p.actual_finish_date);
  if (p.contract_date !== undefined) payload.contract_date = safeDate(p.contract_date);
  if (p.contract_duration_months !== undefined) payload.contract_duration_months = p.contract_duration_months !== null && p.contract_duration_months !== '' ? parseArabicIndicNumber(p.contract_duration_months) : null;
  if (p.contract_value !== undefined) payload.contract_value = parseArabicIndicNumber(p.contract_value, 0);
  if (p.vos_value !== undefined) payload.vos_value = parseArabicIndicNumber(p.vos_value, 0);
  if (p.estimated_budget !== undefined) payload.estimated_budget = parseArabicIndicNumber(p.estimated_budget, 0);
  if (p.estimated_cost !== undefined) payload.estimated_cost = parseArabicIndicNumber(p.estimated_cost, 0);
  if (p.site_possession_letter !== undefined) payload.site_possession_letter = p.site_possession_letter ?? null;
  if (p.toc_letter !== undefined) payload.toc_letter = p.toc_letter ?? null;

  payload.project_manager_id = safeUUID(p.project_manager_id);
  payload.project_manager_stakeholder_id = safeUUID(p.project_manager_stakeholder_id);
  if (p.project_manager_name_raw !== undefined) payload.project_manager_name_raw = p.project_manager_name_raw ?? null;
  if (p.completion_pct !== undefined) payload.completion_pct = parseArabicIndicNumber(p.completion_pct, 0);
  if (p.hold_reason !== undefined) payload.hold_reason = p.hold_reason ?? null;
  if (p.cancel_reason !== undefined) payload.cancel_reason = p.cancel_reason ?? null;
  if (p.cover_image_url !== undefined) payload.cover_image_url = p.cover_image_url ?? null;
  if (p.metadata !== undefined) payload.metadata = p.metadata;
  const meta = (payload.metadata && typeof payload.metadata === 'object') ? { ...(payload.metadata as Record<string, unknown>) } : {};
  if (p.public_name !== undefined) {
    meta.public_name = p.public_name ? String(p.public_name).trim() : null;
  }
  if (p.water_structures !== undefined && Array.isArray(p.water_structures)) {
    meta.water_structures = p.water_structures;
  }
  if (p.variation_orders !== undefined && Array.isArray(p.variation_orders)) {
    meta.variation_orders = p.variation_orders;
    payload.vos_value = calculateNetVos(p.variation_orders).netVos;
  }
  if (Object.keys(meta).length > 0) {
    payload.metadata = meta;
  }

  return payload;
}

/**
 * Builds a safe payload for UPDATE.
 * STRICT ALLOW-LIST: Emits a key ONLY IF it is present in ALLOWED_PM_PROJECT_UPDATE_FIELDS
 * and exists in the input object `p`.
 */
export function buildUpdatePayload(rawInput: Record<string, unknown>): Record<string, unknown> {
  const p = normalizeFormInput(rawInput);
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(p)) {
    if (!ALLOWED_PM_PROJECT_UPDATE_FIELDS.has(key)) {
      // Ignore any field not in explicit update allow-list
      continue;
    }

    if (UUID_FK_FIELDS.has(key)) {
      // FK field present in input: sanitise invalid UUID string to null
      result[key] = safeUUID(value);
      continue;
    }

    if (DATE_FIELDS.has(key)) {
      result[key] = safeDate(value);
      continue;
    }

    if (NUMBER_FIELDS.has(key)) {
      result[key] = value !== null && value !== undefined && value !== '' ? parseArabicIndicNumber(value) : null;
      continue;
    }

    // String / Text fields — preserve null, empty string, or string value
    result[key] = value ?? null;
  }

  // Ensure metadata preserves structured attributes like water_structures, public_name, and variation_orders
  if (
    p.water_structures !== undefined ||
    p.public_name !== undefined ||
    p.variation_orders !== undefined ||
    p.metadata !== undefined
  ) {
    const existingMeta = (result.metadata && typeof result.metadata === 'object')
      ? { ...(result.metadata as Record<string, unknown>) }
      : (p.metadata && typeof p.metadata === 'object' ? { ...(p.metadata as Record<string, unknown>) } : {});
    
    if (p.water_structures !== undefined && Array.isArray(p.water_structures)) {
      existingMeta.water_structures = p.water_structures;
    }
    if (p.variation_orders !== undefined && Array.isArray(p.variation_orders)) {
      existingMeta.variation_orders = p.variation_orders;
      result.vos_value = calculateNetVos(p.variation_orders).netVos;
    }
    if (p.public_name !== undefined) {
      existingMeta.public_name = p.public_name ? String(p.public_name).trim() : null;
    }
    if (Object.keys(existingMeta).length > 0) {
      result.metadata = existingMeta;
    } else if (p.metadata !== undefined) {
      result.metadata = p.metadata;
    }
  }

  return result;
}

/**
 * Main mapper function (backward compatibility).
 */
export function buildProjectPayload(
  p: Record<string, unknown>,
  organization_id?: string | null,
  mode: 'create' | 'update' = 'create'
): Record<string, unknown> {
  if (mode === 'update') {
    return buildUpdatePayload(p);
  }
  return buildCreatePayload(p, organization_id);
}
