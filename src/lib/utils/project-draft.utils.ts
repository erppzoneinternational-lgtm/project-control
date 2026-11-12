import { Client, Governorate, City, PzoneRole, ProjectStatus, WaterStructure, VariationOrderItem } from '@/types';

export const PROJECT_FORM_DRAFT_KEY = 'pzone_new_project_draft_v1';

export interface ProjectFormData {
  project_code: string;
  project_name: string;
  project_name_en: string;
  public_name?: string;
  client_id: string;
  pzone_role: PzoneRole;
  governorate_id: string;
  city_id: string;
  site_location_address: string;
  gps_lat: number;
  gps_lng: number;
  water_area_m2: number;
  water_vol_m3: number;
  water_structures?: WaterStructure[];
  variation_orders?: VariationOrderItem[];
  planned_start_date: string;
  planned_finish_date: string;
  contract_date: string;
  contract_duration_months: number;
  contract_value: number;
  contract_value_egp: number;
  total_value_with_vat_egp: number;
  vos_value: number;
  estimated_budget: number;
  estimated_cost: number;
  site_possession_letter: string;
  toc_letter: string;
  hardcopy_status: string;
  project_manager_id?: string;
  project_manager_stakeholder_id?: string;
  project_manager_name_raw: string;
  project_manager_code: string;
  completion_pct: number;
  status: ProjectStatus;
  metadata: {
    water_features: string[];
    water_depth_m: number;
    vat_included: boolean;
    advance_payment_pct: number;
    retention_pct: number;
    owner_name: string;
    [key: string]: unknown;
  };
}

export const INITIAL_PROJECT_FORM_DATA: ProjectFormData = {
  project_code: '',
  project_name: '',
  project_name_en: '',
  public_name: '',
  client_id: '',
  pzone_role: 'Main Contractor',
  governorate_id: '',
  city_id: '',
  site_location_address: '',
  gps_lat: 30.0444,
  gps_lng: 31.2357,
  water_area_m2: 0,
  water_vol_m3: 0,
  water_structures: [
    {
      id: 'ws_new_1',
      type: 'lagoon',
      name: 'لاجون 1',
      area_m2: 0,
      volume_m3: 0,
      base_price_egp: 0,
      vos_value_egp: 0,
      final_price_egp: 0,
      unit_rate_m2: 0,
      unit_rate_m3: 0,
      notes: '',
    },
  ],
  variation_orders: [],
  planned_start_date: '',
  planned_finish_date: '',
  contract_date: '',
  contract_duration_months: 0,
  contract_value: 0,
  contract_value_egp: 0,
  total_value_with_vat_egp: 0,
  vos_value: 0,
  estimated_budget: 0,
  estimated_cost: 0,
  site_possession_letter: 'غير موجود',
  toc_letter: 'غير موجود',
  hardcopy_status: 'غير مكتمل',
  project_manager_id: undefined,
  project_manager_stakeholder_id: undefined,
  project_manager_name_raw: '',
  project_manager_code: '',
  completion_pct: 0,
  status: 'working',
  metadata: {
    water_features: ['pools'],
    water_depth_m: 1.4,
    vat_included: true,
    advance_payment_pct: 0,
    retention_pct: 0,
    owner_name: '',
  },
};

export interface ProjectFormDraft {
  formData: ProjectFormData;
  currentStep: number;
  averageDepthM: number;
  isAutoVolume: boolean;
  isVatEnabled: boolean;
  savedAt: number;
}

/**
 * Checks whether the project creation form has user-entered data or modifications
 * compared to the pristine starting state.
 */
export function isProjectFormDirty(
  formData: ProjectFormData,
  currentStep = 1,
  averageDepthM = 1.4,
  isAutoVolume = true,
  isVatEnabled = true
): boolean {
  if (currentStep > 1) return true;
  if (Boolean(formData.project_name?.trim())) return true;
  if (Boolean(formData.project_name_en?.trim())) return true;
  if (Boolean(formData.public_name?.trim())) return true;
  if (Boolean(formData.client_id?.trim())) return true;
  if (Boolean(formData.governorate_id?.trim())) return true;
  if (Boolean(formData.city_id?.trim())) return true;
  if (Boolean(formData.site_location_address?.trim())) return true;
  if (Number(formData.water_area_m2) > 0) return true;
  if (Number(formData.water_vol_m3) > 0) return true;
  if (Boolean(formData.planned_start_date?.trim())) return true;
  if (Boolean(formData.planned_finish_date?.trim())) return true;
  if (Boolean(formData.contract_date?.trim())) return true;
  if (Number(formData.contract_value) > 0) return true;
  if (Number(formData.vos_value) !== 0) return true;
  if ((formData.variation_orders || []).length > 0) return true;
  if (Number(formData.estimated_cost) > 0) return true;
  if (Number(formData.estimated_budget) > 0) return true;
  if (Boolean(formData.project_manager_name_raw?.trim())) return true;
  if (Boolean(formData.project_manager_code?.trim())) return true;
  if (Boolean(formData.metadata?.owner_name?.trim())) return true;
  if (Number(formData.metadata?.advance_payment_pct) > 0) return true;
  if (Number(formData.metadata?.retention_pct) > 0) return true;
  if (Math.abs(averageDepthM - 1.4) > 0.01) return true;
  if (!isAutoVolume) return true;
  if (!isVatEnabled) return true;

  const wf = formData.metadata?.water_features || [];
  if (wf.length !== 1 || wf[0] !== 'pools') return true;
  if (formData.pzone_role !== 'Main Contractor') return true;

  return false;
}

/**
 * Safely persists draft data to localStorage
 */
export function saveProjectFormDraft(
  draft: Omit<ProjectFormDraft, 'savedAt'> & { savedAt?: number },
  storage: Storage = typeof window !== 'undefined' ? window.localStorage : (null as any)
): boolean {
  if (!storage) return false;
  try {
    const payload: ProjectFormDraft = {
      ...draft,
      savedAt: draft.savedAt || Date.now(),
    };
    storage.setItem(PROJECT_FORM_DRAFT_KEY, JSON.stringify(payload));
    return true;
  } catch (err) {
    console.error('Failed to save project draft to localStorage:', err);
    return false;
  }
}

/**
 * Safely loads and parses project draft from localStorage
 */
export function loadProjectFormDraft(
  storage: Storage = typeof window !== 'undefined' ? window.localStorage : (null as any)
): ProjectFormDraft | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(PROJECT_FORM_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.formData) {
      return null;
    }
    return mergeDraftWithInitial(parsed);
  } catch (err) {
    console.error('Failed to parse project draft from localStorage:', err);
    return null;
  }
}

/**
 * Removes the project draft from localStorage
 */
export function clearProjectFormDraft(
  storage: Storage = typeof window !== 'undefined' ? window.localStorage : (null as any)
): boolean {
  if (!storage) return false;
  try {
    storage.removeItem(PROJECT_FORM_DRAFT_KEY);
    return true;
  } catch (err) {
    console.error('Failed to clear project draft from localStorage:', err);
    return false;
  }
}

/**
 * Merges partial draft payload with pristine initial defaults to avoid undefined property access
 */
export function mergeDraftWithInitial(partial: Partial<ProjectFormDraft>): ProjectFormDraft {
  const mergedFormData: ProjectFormData = {
    ...INITIAL_PROJECT_FORM_DATA,
    ...(partial.formData || {}),
    metadata: {
      ...INITIAL_PROJECT_FORM_DATA.metadata,
      ...(partial.formData?.metadata || {}),
    },
  };

  const rawStep = Number(partial.currentStep);
  const currentStep = Number.isInteger(rawStep) && rawStep >= 1 && rawStep <= 6 ? rawStep : 1;

  const rawDepth = Number(partial.averageDepthM);
  const averageDepthM = !Number.isNaN(rawDepth) && rawDepth > 0 ? rawDepth : 1.4;

  const isAutoVolume = typeof partial.isAutoVolume === 'boolean' ? partial.isAutoVolume : true;
  const isVatEnabled = typeof partial.isVatEnabled === 'boolean' ? partial.isVatEnabled : true;
  const savedAt = typeof partial.savedAt === 'number' ? partial.savedAt : Date.now();

  return {
    formData: mergedFormData,
    currentStep,
    averageDepthM,
    isAutoVolume,
    isVatEnabled,
    savedAt,
  };
}

/**
 * Combines Arabic and English project names into a formatted bilingual public name.
 * Format: "${ar} - ${en}" or single name if only one is present.
 */
export function combineProjectNames(nameAr?: string | null, nameEn?: string | null): string {
  const a = (nameAr || '').trim();
  const e = (nameEn || '').trim();
  if (a && e) return `${a} - ${e}`;
  if (a) return a;
  if (e) return e;
  return '';
}

