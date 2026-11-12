import type { ProjectActivity } from './planning';

export type ProjectStatus = 
  | 'tender'
  | 'not_started' 
  | 'working' 
  | 'on_hold' 
  | 'handing_over' 
  | 'finished' 
  | 'cancelled';

export type PzoneRole = 'main_contractor' | 'sub_contractor' | 'Main Contractor' | 'Sub Contractor';
export type WaterScopeType = 'pool' | 'fountain' | 'lagoon' | 'water_feature' | 'mixed';

export interface Stakeholder {
  id: string;
  name_ar: string;
  name_en?: string;
  role?: string;
  job_title?: string | null;
  email?: string;
  phone?: string;
  employee_code?: string;
  code?: string;
  organization_name?: string;
  client_id?: string;
  vendor_id?: string;
  stakeholder_kind?: StakeholderKind;
  is_system_user?: boolean;
  system_role?: string;
}

export type StakeholderKind = 'employee' | 'client_rep' | 'vendor_rep' | 'external_expert';
export type RaciRole = 'responsible' | 'accountable' | 'consulted' | 'informed';

export interface ProjectStakeholder {
  id: string;
  project_id: string;
  stakeholder_id: string;
  project_role: string;
  raci_role: RaciRole;
  party_kind?: StakeholderKind;
  organization_id?: string;
  assigned_at?: string;
  assigned_by?: string;
  notes?: string;
  custom_level?: number;
  created_at?: string;
  updated_at?: string;
  stakeholder?: StakeholderFull;
  start_date?: string | null;
  end_date?: string | null;
  is_active?: boolean;
  predecessor_id?: string | null;
  termination_reason?: string | null;
  reports_to?: string | null;
}

export interface StakeholderFull extends Stakeholder {
  organization_id: string;
  organization_name?: string;
  organization_code?: string;
  stakeholder_kind: StakeholderKind;
  job_title?: string | null;
  is_hr_employee?: boolean;
  client_id?: string;
  client_name?: string;
  vendor_id?: string;
  vendor_name?: string;
  is_active: boolean;
  notes?: string;
  assigned_projects_count: number;
  is_system_user?: boolean;
  system_role?: string;
}


export interface Client {
  id: string;
  name_ar: string;
  name_en?: string;
  code?: string;
  type?: string | null;
  is_active?: boolean;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Governorate {
  id: string;
  name_ar: string;
  name_en: string;
  code: string;
  created_at?: string;
  updated_at?: string;
}

export interface City {
  id: string;
  governorate_id: string;
  name_ar: string;
  name_en: string;
}

export interface WaterStructure {
  id: string;
  type: string;
  name: string;
  area_m2: number;
  volume_m3: number;
  base_price_egp?: number;
  vos_value_egp?: number;
  final_price_egp?: number;
  unit_rate_m2?: number;
  unit_rate_m3?: number;
  notes?: string;
}

export type VariationOrderType = 'addition' | 'deduction';

export interface VariationOrderItem {
  id: string;
  vo_number: string;              // e.g. "VO-01", "VO-02"
  title: string;                  // بيان / موضوع أمر التغيير
  type: VariationOrderType;       // 'addition' (+) or 'deduction' (-)
  amount: number;                 // القيمة المالية المطلقة (بالجنيه)
  issue_date?: string;            // YYYY-MM-DD تاريخ الإصدار
  approval_date?: string;         // YYYY-MM-DD تاريخ الاعتماد
  time_impact_days?: number;      // الأثر الزمني (أيام +/-)
  status?: 'approved' | 'under_review' | 'draft';
  structure_id?: string;          // ربط ببند BOQ مائي محدد
  notes?: string;
}

export interface Project {
  id: string;
  organization_id?: string;
  project_code: string;
  project_name: string;
  code?: string;
  name_ar?: string;
  name_en?: string;
  project_name_ar?: string;
  project_name_en?: string;
  public_name?: string | null;
  client_id?: string;
  client?: Client;
  client_name?: string;
  client_name_ar?: string;
  client_name_raw?: string;
  client_representative?: string;
  pzone_role?: PzoneRole;
  governorate_id?: string;
  governorate?: Governorate;
  city_id?: string;
  city?: City;
  site_location_address?: string;
  location?: string;
  location_gps_lat?: number;
  location_gps_lng?: number;
  gps_lat?: number;
  gps_lng?: number;
  water_scope_type?: WaterScopeType;
  water_structures?: WaterStructure[];
  variation_orders?: VariationOrderItem[];
  total_water_area_m2?: number;
  total_water_volume_m3?: number;
  status: ProjectStatus;
  start_date?: string;
  end_date?: string;
  planned_start_date?: string;
  planned_finish_date?: string;
  actual_start_date?: string;
  actual_finish_date?: string;
  contract_date?: string;
  contract_duration_months?: number;
  contract_status?: string;
  contract_value_egp?: number;
  contract_value: number;
  vat_amount_egp?: number;
  total_value_with_vat_egp?: number;
  vos_value: number;
  total_contract_value?: number; // calculated contract_value + vos_value
  estimated_budget: number;
  estimated_cost: number;
  water_area_m2: number;
  water_vol_m3: number;
  site_possession_letter?: string;
  toc_letter?: string;
  hardcopy_status?: string;
  project_manager_id?: string;
  project_manager_name_raw?: string;
  project_manager_code?: string;
  project_manager?: string;
  pm_full_name?: string;
  pm_canonical_name?: string;
  pm_stakeholder_id?: string | null;
  project_manager_stakeholder_id?: string | null;
  pm_phone?: string;
  pm_email?: string;
  pm_code?: string;
  pm_job_title?: string;
  latitude?: number;
  longitude?: number;
  completion_pct: number;
  cover_image_url?: string;
  hold_reason?: string;
  suspension_reason?: string;
  cancel_reason?: string;
  cancellation_reason?: string;
  metadata?: Record<string, any>;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLogEntry {
  id: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | string;
  old_data?: Record<string, any>;
  new_data?: Record<string, any>;
  changed_by?: string;
  created_at?: string;
  changed_at?: string;
  context?: string;
  ip_address?: string;
  user_agent?: string;
  user_email?: string;
  user_name?: string;
  user_role?: string;
}

export interface UserWorkDuration {
  userId: string;
  userName: string;
  userEmail: string;
  roles: string[];
  totalWorkMinutes: number;
  todayWorkMinutes: number;
  formattedTotal: string; // e.g. "4h 25m"
  formattedToday: string; // e.g. "1h 10m"
  formattedTotalAr: string; // e.g. "4 ساعات و 25 دقيقة"
  formattedTodayAr: string; // e.g. "ساعة و 10 دقائق"
  lastActiveAt?: string;
  lastIpAddress?: string;
  lastDevice?: string;
  isOnline: boolean;
  totalChangesCount: number;
  actionsBreakdown: {
    insert: number;
    update: number;
    delete: number;
    statusChange: number;
  };
}

export interface ChangelogDiffItem {
  field: string;
  fieldLabelAr: string;
  oldValue: any;
  newValue: any;
}

export interface NotificationItem {
  id: string;
  user_id?: string;
  project_id?: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export interface ProjectPhoto {
  id: string;
  project_id: string;
  photo_url: string;
  caption?: string;
  created_at: string;
}

export interface ProjectFilterParams {
  status?: string;
  pzoneRole?: string;
  clientId?: string;
  governorateId?: string;
  search?: string;
}

export type TeamRoleCategory = 'pzone_internal' | 'site_execution' | 'client_team' | 'subcontractor_consultant';

export interface ProjectTeamMember {
  id: string;
  project_id: string;
  stakeholder_id?: string;
  person_name: string;
  role_category: TeamRoleCategory;
  role_title_ar: string;
  role_title_en?: string;
  role_sub_type?: string;
  phone?: string;
  email?: string;
  notes?: string;
  created_at?: string;
}

export interface ProjectClientContact {
  id: string;
  project_id: string;
  party_type: 'client' | 'consultant' | 'main_contractor_above';
  company_name?: string;
  contact_name: string;
  job_title?: string;
  contact_title?: string;
  phone?: string;
  email?: string;
  notes?: string;
  is_primary?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectSiteResource {
  id: string;
  project_id: string;
  resource_type: 'equipment_operator' | 'driver';
  resource_name: string;
  person_name?: string;
  phone?: string;
  vehicle_equipment_type?: string;
  sub_type?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectSubcontractor {
  id: string;
  project_id: string;
  company_name: string;
  specialization?: string;
  scope_description?: string;
  scope_of_work?: string;
  status: 'active' | 'suspended' | 'completed';
  contract_status?: string;
  contract_value?: number;
  start_date?: string;
  end_date?: string;
  rep_name?: string;
  rep_phone?: string;
  rep_email?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface WBSItem {
  id: string;
  project_id: string;
  parent_id?: string | null;
  wbs_code?: string;
  title_ar: string;
  title_en?: string;
  description?: string;
  level?: number;
  sort_order?: number;
  weight_percentage: number;
  status: 'not_started' | 'in_progress' | 'completed';
  budgeted_cost?: number;
  actual_cost?: number;
  earned_value?: number;
  created_at?: string;
  updated_at?: string;
  // Computed (from joins/aggregation)
  children?: WBSItem[];
  activities?: ProjectActivity[];
  activity_count?: number;
  progress_pct?: number;
}

export interface PaymentMilestone {
  id: string;
  project_id: string;
  milestone_name_ar: string;
  percentage: number;
  amount_egp: number;
  due_date?: string;
  status: 'pending' | 'due' | 'paid';
  created_at?: string;
}

export interface ProjectDocument {
  id: string;
  project_id: string;
  document_type: 'site_possession' | 'toc' | 'contract' | 'other';
  title_ar: string;
  file_path?: string;
  issue_date?: string;
  notes?: string;
  created_at?: string;
}

export interface ChangeOrder {
  id: string;
  project_id: string;
  vo_number?: string;
  title_ar: string;
  amount_egp: number;
  time_extension_days?: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  approval_status?: 'pending' | 'approved' | 'rejected' | string;
  approval_date?: string;
  created_at?: string;
}

export interface ProjectInvoice {
  id: string;
  project_id: string;
  ipc_number: string;
  claimed_amount: number;
  approved_amount: number;
  submission_date?: string;
  status: 'under_review' | 'approved' | 'paid';
  created_at?: string;
}

export interface ArchiveLog {
  id: string;
  entity_type: string;
  entity_id?: string;
  entity_name: string;
  project_id?: string;
  archived_data: Record<string, any>;
  deleted_by: string;
  archived_at: string;
}

export * from './boq';
export * from './planning';
export * from './notifications';
export type { ScheduleActivity } from './schedule';




