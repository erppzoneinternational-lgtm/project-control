import { BoqItem, CostCode } from './boq';
import { Stakeholder, WBSItem } from './index';

export type ActivityDiscipline = 
  | 'civil'
  | 'finishing'
  | 'mech'
  | 'elec'
  | 'landscape'
  | 'water'
  | 'mep'
  | 'other';

export type ActivityStatus = 'not_started' | 'in_progress' | 'completed' | 'delayed';
export type BoqLinkMode = 'by_items' | 'manual_cost' | 'weight';

export interface ActivityLibraryItem {
  id?: string;
  code?: string;
  activity_code: string;               // e.g. "ACT-CON-001"
  cost_code_id?: string | null;
  cost_code?: CostCode | null;
  name_ar: string;
  name_en?: string;
  category?: string;                   // Civil, Concrete work, Earth Work, mechanical, electrical, Architecture, General
  phase?: string;                      // Mobilization, Engineering, Procurement, Construction, Testing & Commissioning, Taking over certificate
  discipline: ActivityDiscipline;
  unit?: string;
  default_unit?: string;
  typical_duration_days?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  /* Excel import (migration 021) */
  component_type?: 'lagoon_body' | 'pump_room' | 'pump_room_with_tank' | null;
  step_no?: number | null;
  task_owner?: string | null;
  qc_note?: string | null;
  phase_ar?: string | null;
  source_sheet?: string | null;
}

export const COMPONENT_LABELS: Record<string, string> = {
  lagoon_body: 'جسم البحيرة',
  pump_room: 'غرفة المضخات',
  pump_room_with_tank: 'غرفة + خزان موازنة',
};

export interface ProjectActivity {
  id: string;
  project_id: string;
  library_activity_id?: string | null;
  library_code?: string | null;
  activity_code: string;               // Task ID from Primavera or manual (UNIQUE per project)
  code?: string;
  cost_code_id?: string | null;
  cost_code?: CostCode | null;
  zone_id?: string | null;
  wbs_item_id?: string | null;
  wbs_item?: WBSItem;
  name_ar: string;
  name_en?: string;
  scope_type?: 'original' | 'vo';
  vo_number?: string | null;
  weight_override?: number | null;
  sort_order?: number;
  planned_start: string;               // YYYY-MM-DD
  planned_finish: string;              // YYYY-MM-DD
  duration_days: number;
  budgeted_cost_egp: number;           // Auto-recalculated from BOQ links or manual
  weight_pct?: number | null;
  boq_link_mode: BoqLinkMode;          // Default 'by_items'
  is_milestone: boolean;
  is_critical: boolean;
  actual_start?: string | null;
  actual_finish?: string | null;
  percent_complete: number;            // 0-100 (Trigger managed cache)
  status: ActivityStatus;
  responsible_stakeholder_id?: string | null;
  responsible_stakeholder?: Stakeholder;
  is_archived: boolean;
  total_float_days: number;
  free_float_days: number;
  remaining_duration_days?: number;
  expected_finish?: string | null;
  calendar_type: string;               // Default '6_days'
  is_out_of_sequence: boolean;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  boq_links?: ActivityBoqLink[];
}

export interface ActivityBoqLink {
  id: string;
  activity_id: string;
  boq_item_id: string;
  planned_qty: number;                 // Quantity allocated to this activity
  baseline_rate_egp: number;           // Rate frozen at link creation time
  boq_item?: BoqItem;
  created_at?: string;
  updated_at?: string;
}

export interface ActivityDependency {
  id: string;
  predecessor_id: string;
  successor_id: string;
  relationship: 'FS' | 'SS' | 'FF' | 'SF';
  lag_days: number;
  created_at?: string;
}

export interface ScheduleVersion {
  id: string;
  project_id: string;
  version_no: number;
  label?: string;
  source_type: 'xer' | 'xml' | 'manual';
  storage_path: string;
  data_date?: string;
  activities_count: number;
  critical_count: number;
  is_current: boolean;
  parsed_snapshot?: Record<string, any>;
  transmittal_no?: string;
  time_bar_deadline?: string;          // FIDIC 20.1 28-day notice deadline
  uploaded_by?: string;
  uploaded_at?: string;
}

export type DailyProgressStatus = 
  | 'draft'
  | 'submitted'
  | 'partially_approved'
  | 'approved'
  | 'rejected'
  | 'reopened';

export type DailyDiscipline = 
  | 'civil'
  | 'finishing'
  | 'mep'
  | 'landscape'
  | 'water_features'
  | 'other';

export type LineStatus = 'pending' | 'approved' | 'rejected';
export type InspectionStatus = 'not_required' | 'submitted' | 'lab_pending' | 'approved' | 'rejected';

export interface DailyProgress {
  id: string;
  project_id: string;
  report_date?: string;                // YYYY-MM-DD
  progress_date: string;               // YYYY-MM-DD
  report_no?: number | string;         // Sequence or date string
  discipline?: DailyDiscipline;        // Distinct report per discipline per day
  weather?: string;
  manpower_count?: number;
  equipment_count?: number;
  equipment_summary?: string;
  obstruction_type?: string;
  vo_requested?: boolean;
  entered_by?: string;
  entered_by_name?: string;
  status: DailyProgressStatus;
  submitted_by?: string;
  submitted_at?: string;
  pm_reviewed_by?: string;
  pm_reviewed_at?: string;
  pm_skipped?: boolean;
  approved_by?: string;
  approved_at?: string;
  rejected_by?: string;
  rejected_at?: string;
  rejection_reason?: string;
  reopened_reason?: string;
  idempotency_key?: string;             // Offline client idempotency token
  notes?: string | null;
  site_task_id?: string | null;        // Linked open site task (owner rule ب)
  verification_status?: 'unverified' | 'verified' | 'rejected';
  verified_by?: string | null;
  verified_at?: string | null;
  progress_rejection_reason?: string | null;
  created_at?: string;
  updated_at?: string;
  lines?: DailyProgressLine[];
  photos?: DailyProgressPhoto[];
  manpower_logs?: DailyManpowerLog[];
  equipment_logs?: DailyEquipmentLog[];
  obstructions?: DailyObstruction[];
}

export interface DailyProgressLine {
  id: string;
  daily_progress_id?: string;
  report_id?: string;
  boq_item_id: string;
  qty_today: number;                   // Measured installed quantity
  pct_today?: number | null;
  cumulative_qty?: number | null;
  cumulative_pct?: number | null;
  zone?: string;
  remarks?: string;
  notes?: string | null;
  is_material_on_site?: boolean;       // Material on site (MOS) vs installation
  snapshot_rate_egp?: number;          // Rate frozen at approval
  source_boq_revision?: number;        // Revision frozen at approval
  line_status?: LineStatus;            // Line-level approval status
  line_reviewed_by?: string;
  line_reviewed_at?: string;
  rejection_reason?: string;
  subcontractor_id?: string;           // Responsible subcontractor
  is_claimable_vo?: boolean;           // Claimable VO vs waste/rework
  wir_no?: string;                     // Work Inspection Request number
  inspection_status?: InspectionStatus;// WIR status
  supplied_qty?: number;               // Delivered quantity from tickets for waste calc
  ref_deliverable_item_id?: string;    // Technical Office drawing reference
  boq_item?: BoqItem;
  allocations?: ProgressAllocation[];
  created_at?: string;
  updated_at?: string;
}

export interface DailyProgressPhoto {
  id: string;
  daily_progress_id: string;
  storage_path: string;
  photo_url?: string;
  caption?: string;
  uploaded_by?: string;
  uploaded_at?: string;
}

export interface DailyManpowerLog {
  id: string;
  daily_progress_id: string;
  craft_type: string;
  headcount: number;
  subcontractor_id?: string;
  notes?: string;
  created_at?: string;
}

export interface DailyEquipmentLog {
  id: string;
  daily_progress_id: string;
  equipment_name: string;
  quantity: number;
  working_hours: number;
  idle_hours: number;
  subcontractor_id?: string;
  notes?: string;
  created_at?: string;
}

export type UnifiedObstructionType =
  | 'owner_directive'
  | 'weather'
  | 'material_delay'
  | 'drawing_delay'
  | 'subcontractor'
  | 'permit_authority'
  | 'equipment'
  | 'manpower'
  | 'safety'
  | 'access'
  | 'other';

export type ObstructionScope = 'task' | 'site_wide';

export type ObstructionType =
  | UnifiedObstructionType
  | 'material_approval'
  | 'site_access'
  | 'client_works'
  | 'equipment_idle'
  | 'labor_shortage';

export interface DailyObstruction {
  id: string;
  daily_progress_id?: string | null;
  project_id: string;
  site_task_id?: string | null;
  task_id?: string | null;
  deliverable_item_id?: string | null;
  obstruction_type: UnifiedObstructionType | ObstructionType;
  responsible_party: string;           // Consultant, Client, Subcontractor, Internal...
  description: string;
  scope?: ObstructionScope;
  eot_days?: number;
  financial_impact_egp?: number;
  idle_manpower?: number;
  idle_equipment_summary?: string | null;
  started_at: string;
  resolved_at?: string | null;
  resolution_notes?: string | null;
  evidence_path?: string | null;
  created_at?: string;
}

export type MosStatus = 'on_site' | 'partially_installed' | 'installed';
export type MosConsultantApprovalCode = 'pending' | 'code_a' | 'code_b' | 'code_c' | 'code_d';

export interface MosEntry {
  id: string;
  project_id: string;
  entry_date: string;
  boq_item_id?: string;
  description_ar: string;
  unit: string;
  qty_supplied: number;
  source_ref?: string;
  status: MosStatus;
  subcontractor_id?: string;
  recorded_by?: string;
  consultant_status?: MosConsultantApprovalCode | string | null;
  consultant_review_date?: string | null;
  document_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ApprovalDelegation {
  id: string;
  project_id: string;
  delegator_id: string;
  delegated_to_id: string;
  scope?: string;
  valid_from: string;               // YYYY-MM-DD
  valid_to: string;                 // YYYY-MM-DD
  is_active: boolean;
  delegator?: Stakeholder;
  delegated_to?: Stakeholder;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export type HoldScope = 'project' | 'zone' | 'activity' | 'boq_item';
export type HoldType = 'financial' | 'commercial' | 'legal' | 'technical' | 'site' | 'other';

export interface PmHold {
  id: string;
  project_id: string;
  hold_type: HoldType;
  scope_type: HoldScope;
  ref_value?: string;               // zone name, activity_id, or boq_item_id
  reason: string;
  is_active: boolean;
  placed_by: string;
  placed_at: string;
  closed_by?: string;
  closed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SubcontractorTarget {
  id: string;
  project_id: string;
  subcontractor_id: string;
  boq_item_id?: string;
  target_qty: number;
  target_date: string;               // YYYY-MM-DD
  period_start?: string;
  period_end?: string;
  unit?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SubcontractorProductivityMetric {
  subcontractor_id: string;
  subcontractor_name?: string;
  boq_item_id?: string;
  target_qty: number;
  actual_qty: number;
  achievement_pct: number;           // (actual_qty / target_qty) * 100
  is_underperforming: boolean;       // achievement_pct < 70
  manpower?: number;
  unit?: string;
  period_start?: string;
  period_end?: string;
}

export interface DeliverableDependency {
  id: string;
  deliverable_id: string;
  depends_on_deliverable_id: string;
  dependency_type?: string;
  created_at?: string;
}

export interface DeliverableAttachment {
  id: string;
  deliverable_id: string;
  deliverable_item_id?: string;
  storage_path: string;
  file_path?: string;
  file_name: string;
  file_size?: number;
  file_kind?: 'drawing' | 'list' | 'submittal' | 'spec' | 'other' | string;
  uploaded_by?: string;
  uploaded_at?: string;
  created_at?: string;
}

export interface MorningCommandCenterSummary {
  date: string;
  silent_sites_count: number;
  silent_sites: { project_id: string; project_name: string; last_report_date?: string }[];
  active_critical_holds_count: number;
  active_critical_holds: PmHold[];
  blocked_deliverables_count: number;
  blocked_deliverables: Deliverable[];
  overdue_rfis_count: number;
  overdue_rfis: RfiRegisterItem[];
  underperforming_subcontractors_count: number;
  underperforming_subcontractors: SubcontractorProductivityMetric[];
  total_active_projects?: number;
}

export interface CooDeliverablesSummary {
  total_deliverables: number;
  in_progress_count: number;
  blocked_count: number;
  ready_to_return_count: number;
  returned_count: number;
  code_c_count: number;
  overdue_rfis_count: number;
  deliverables_by_status?: Record<string, number>;
  bottlenecks: Deliverable[];
}

export interface ProgressAllocation {
  id: string;
  line_id: string;
  activity_id: string;
  allocated_qty: number;
  project_id: string;
  snapshot_rate_egp: number;           // Inherited from approved line
  source_boq_revision: number;
  is_suspended: boolean;               // Suspended if daily report is reopened
  suspended_at?: string;
  created_by?: string;
  created_at?: string;
  activity?: ProjectActivity;
}

export interface AllocationLineView {
  line: DailyProgressLine;
  boq_item: BoqItem;
  total_allocated: number;
  remaining_qty: number;
  allocations: ProgressAllocation[];
  suggested_activities: (ProjectActivity & { is_linked: boolean; planned_qty?: number })[];
}

export interface RecomputeSummary {
  updatedActivitiesCount: number;
  activityDeltas: { activity_code: string; old_pct: number; new_pct: number; delta_pct: number }[];
  projectOldPct: number;
  projectNewPct: number;
}

export type DeliverableKind = 'E1' | 'E2' | 'material_list' | 'drawing_list' | 'other';
export type DeliverableStatus = 'received' | 'in_progress' | 'blocked' | 'ready_to_return' | 'returned' | 'approved' | 'rejected';
export type ConsultantApprovalCode = 'pending' | 'A' | 'B' | 'C' | 'D';

export interface Deliverable {
  id: string;
  project_id: string;
  ref_code: string;                    // e.g. "E1-014"
  title_ar: string;
  title_en?: string;
  kind: DeliverableKind;
  received_from: string;               // Default 'technical_office'
  received_at: string;                 // Age counter starts here
  due_date?: string;
  status: DeliverableStatus;
  current_holder_stakeholder_id?: string;
  current_holder?: Stakeholder;
  blocked_reason?: string;             // Mandatory when status === 'blocked'
  blocked_since?: string;
  priority: 'low' | 'normal' | 'high';
  notes?: string;
  created_at?: string;
  updated_at?: string;
  items?: DeliverableItem[];
  // Extended fields for Milestones, Client Review Deadlines & Tags
  milestone_id?: string;
  milestone_name?: string;
  milestone_name_ar?: string;
  client_review_deadline?: string;     // Consultant / Client review SLA target date
  target_review_date?: string;
  tags?: string[];
  title?: string;
  discipline?: string | null;
  bottleneck_party?: 'Consultant' | 'Client' | 'Subcontractor' | 'Vendor' | 'Site' | 'consultant' | 'client' | 'main_contractor' | 'supplier' | 'internal' | 'to_manager' | string | null;
  site_impact?: 'Stops_Pouring' | 'Delays_MEP' | 'Critical_Path' | 'Normal' | 'site_stopped' | 'office_prep' | string | null;
  rfi_number?: string | null;
}

export interface DeliverableItem {
  id: string;
  deliverable_id: string;
  project_id?: string;
  title?: string;
  title_ar?: string;
  discipline?: string | null;
  item_type: 'material' | 'drawing';
  sheet_number?: string;               // Drawing sheet number (TO#4)
  description: string;
  current_rev: number;                 // Latest drawing revision
  rev_history?: { rev: number; date: string; by: string; notes?: string; transmittal_number?: string; submission_date?: string }[];
  assigned_stakeholder_id?: string;    // Technical Office Engineer
  assigned_by?: string;
  assigned_at?: string;
  due_date?: string | null;
  work_started_at?: string;
  completed_at?: string;
  consultant_status: ConsultantApprovalCode;
  submission_revision: number;         // Increments on Code C (revise & resubmit)
  linked_activity_id?: string;         // Baseline activity link (TO#3)
  status: DeliverableStatus;
  current_holder_stakeholder_id?: string;
  is_blocked?: boolean;
  blocked_reason?: string;
  blocked_since?: string;
  bottleneck_party?: 'Consultant' | 'Client' | 'Subcontractor' | 'Vendor' | 'Site' | 'consultant' | 'client' | 'main_contractor' | 'supplier' | 'internal' | 'to_manager' | string | null;
  site_impact?: 'Stops_Pouring' | 'Delays_MEP' | 'Critical_Path' | 'Normal' | 'site_stopped' | 'office_prep' | string | null;
  rfi_number?: string | null;
  wir_status?: 'pending' | 'submitted' | 'approved' | 'rejected' | null;
  wir_number?: string | null;
  wir_approved_at?: string | null;
  progress_pct?: number;                  // Added for TO progress tracking (0-100)
  to_manager_approved?: boolean;          // Added for TO Manager signoff
  to_manager_approved_at?: string | null;
  to_manager_approved_by?: string | null;
  to_manager_reviewed_at?: string | null;
  to_manager_reviewed_by?: string | null;
  submission_date?: string | null;
  transmittal_number?: string | null;
  deliverable?: Deliverable;
  assigned_stakeholder?: Stakeholder;
  created_at?: string;
  updated_at?: string;
}

export interface DeliverableEvent {
  id: string;
  deliverable_id: string;
  deliverable_item_id?: string;
  event_type:
    | 'status_change'
    | 'holder_change'
    | 'block'
    | 'unblock'
    | 'comment'
    | 'consultant_review'
    | 'submitted_for_review'
    | 'manager_approved'
    | 'manager_rejected'
    | 'delay'
    | 'revision_bump'
    | string;
  from_value?: string;
  to_value?: string;
  by_stakeholder_id?: string;
  reason?: string;
  created_at: string;
  actor_name?: string;
  actor_role?: string;
  sheet_number?: string;
  item_title?: string;
  action_title_ar?: string;
  action_title_en?: string;
}

export interface RfiRegisterItem {
  id: string;
  project_id: string;
  rfi_no: string;                      // UNIQUE(project_id, rfi_no)
  subject: string;
  discipline?: string;
  raised_by?: string;
  notes?: string;
  sent_date: string;
  target_reply_date?: string;
  replied_date?: string;
  reply_summary?: string;
  status: 'draft' | 'sent' | 'overdue' | 'answered' | 'closed' | 'open';
  related_deliverable_item_id?: string;
  linked_deliverable_id?: string | null;
  cost_impact?: boolean;
  time_impact_days?: number;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CommercialSettings {
  project_id: string;
  retention_pct: number;               // Default 10.0%
  advance_amortization_pct: number;    // Default 10.0%
  other_deductions_pct: number;        // Default 0.0%
  waste_alert_threshold_pct: number;   // Default 5.0%
  week_start_day: number;              // Default 6 (Saturday)
  weekly_send_day: number;             // Default 4 (Wednesday)
  updated_by?: string;
  updated_at?: string;
}

export interface ScurvePoint {
  date: string;                        // YYYY-MM-DD
  planned_pct: number;
  actual_pct: number;
  earned_egp: number;
  planned_egp: number;
  field_actual_unallocated_egp?: number;
}

export interface PlanningKpis {
  project_id: string;
  actual_completion_pct: number;
  planned_completion_pct: number;
  spi: number;
  cpi?: number;
  earned_value_egp: number;
  planned_value_egp: number;
  actual_cost_egp?: number;
  budget_at_completion_egp: number;
  field_actual_unallocated_egp: number;
  unallocated_reports_count: number;
  last_report_date?: string;
  days_variance: number;
  eac_bac_cpi?: number;
  net_cash_realizable?: number;
}

export interface WeeklyReportAggregates {
  weekly_boq_progress: {
    boq_item_id: string;
    item_code: string;
    description_ar: string;
    unit: string;
    week_qty: number;
    cumulative_qty: number;
    contract_qty: number;
    earned_egp: number;
  }[];
  obstructions_summary: {
    type: ObstructionType;
    responsible_party: string;
    count: number;
    total_idle_manpower: number;
    description_list: string[];
  }[];
  photos: {
    photo_url: string;
    caption?: string;
    date: string;
  }[];
  scurve_point: ScurvePoint;
  lookahead_activities: {
    activity_code: string;
    name_ar: string;
    planned_start: string;
    planned_finish: string;
    readiness: {
      drawings: boolean;
      materials: boolean;
      subcontractor: boolean;
    };
  }[];
  milestones_status: {
    name_ar: string;
    due_date: string;
    status: 'completed' | 'on_track' | 'delayed';
  }[];
}

export interface WeeklyReport {
  id: string;
  project_id: string;
  week_start: string;
  week_end: string;
  status: 'draft' | 'finalized';
  aggregates: WeeklyReportAggregates;
  pdf_path?: string;
  xlsx_path?: string;
  generated_by?: string;
  generated_at?: string;
  finalized_by?: string;
  finalized_at?: string;
  created_at?: string;
  updated_at?: string;
}

// ── Technical Office Progress Logs ──────────────────────────────────────────
export type ToProgressStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface ToProgressLog {
  id: string;
  deliverable_item_id: string;
  project_id: string;
  stakeholder_id?: string;
  logged_by?: string;
  logged_by_stakeholder_id?: string | null;
  log_date: string;
  progress_pct: number;
  notes?: string | null;
  work_description?: string;
  hours_spent?: number | null;
  status?: ToProgressStatus;
  obstruction_type?: UnifiedObstructionType | string | null;
  obstruction_notes?: string | null;
  to_manager_approved?: boolean;
  approved_by?: string | null;
  approved_at?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  reviewer_comments?: string | null;
  rejection_reason?: string | null;
  created_at?: string;
  updated_at?: string;
}

// ── Project Manager Private Comments ────────────────────────────────────────
export interface DailyProgressComment {
  id: string;
  daily_progress_id: string;
  project_id: string;
  user_id?: string;
  author_user_id?: string;
  author_stakeholder_id?: string | null;
  author_name: string;
  author_role?: string | null;
  content: string;
  comment_text?: string;
  is_private: boolean;
  parent_comment_id?: string | null;
  replies?: DailyProgressComment[];
  created_at: string;
  updated_at: string;
}

// ── KPI Engine Interfaces ───────────────────────────────────────────────────
export interface TOEngineerKPIs {
  stakeholder_id: string;
  stakeholder_name?: string;
  engineer_name_ar?: string;
  engineer_name_en?: string;
  email?: string;
  total_assigned: number;
  total_completed: number;
  in_progress_count: number;
  blocked_count?: number;
  on_time_delivery_rate_pct: number;
  code_cd_revision_rate_pct: number;
  first_pass_approval_rate_pct: number;
  average_completion_duration_days: number;
  total_drawings_approved: number;
  items_with_code_c: number;
  code_ab_items?: number;
  code_c_items?: number;
  code_d_items?: number;
  completion_rate_pct?: number;
  rejection_rate_pct?: number;
}

export interface SiteProductivityKPIs {
  project_id: string;
  project_name?: string;
  total_daily_reports: number;
  average_daily_manpower: number;
  total_idle_manpower_hours: number;
  total_obstructions_count: number;
  total_eot_claimed_days: number;
  obstructions_by_taxonomy: {
    type: UnifiedObstructionType;
    type_label_ar: string;
    count: number;
    idle_hours: number;
    eot_days: number;
  }[];
  active_obstructions_count: number;
}

export interface PortfolioExecutiveKPIs {
  total_active_projects: number;
  overall_to_on_time_pct: number;
  overall_code_cd_rate_pct: number;
  total_eot_risk_days: number;
  top_delay_categories: { type: UnifiedObstructionType; label_ar: string; frequency: number }[];
  high_risk_projects: { project_id: string; name: string; spi: number | null; open_obstructions: number }[];
}

// ── Canonical Roles & Route Registry ─────────────────────────────────────────
export type CanonicalRole =
  | 'admin'
  | 'ceo'
  | 'coo'
  | 'project_manager'
  | 'planning_manager'
  | 'planning_engineer'
  | 'technical_office'
  | 'site_engineer'
  | 'qc_inspector';

export interface RoleRouteConfig {
  role: CanonicalRole;
  homePath: string;
  labelAr: string;
  labelEn: string;
  priority: number;
}

export const ROLE_ROUTE_REGISTRY: Record<CanonicalRole, RoleRouteConfig> = {
  admin: { role: 'admin', homePath: '/system-admin', labelAr: 'مدير النظام', labelEn: 'Admin', priority: 1 },
  ceo: { role: 'ceo', homePath: '/coo', labelAr: 'الرئيس التنفيذي', labelEn: 'CEO', priority: 2 },
  coo: { role: 'coo', homePath: '/coo', labelAr: 'مدير العمليات', labelEn: 'COO', priority: 3 },
  planning_manager: { role: 'planning_manager', homePath: '/planning/dashboard', labelAr: 'مدير التخطيط', labelEn: 'Planning Manager', priority: 4 },
  project_manager: { role: 'project_manager', homePath: '/pm-dashboard', labelAr: 'مدير المشروع', labelEn: 'Project Manager', priority: 5 },
  technical_office: { role: 'technical_office', homePath: '/to-dashboard', labelAr: 'المكتب الفني', labelEn: 'Technical Office', priority: 6 },
  planning_engineer: { role: 'planning_engineer', homePath: '/planning', labelAr: 'مهندس التخطيط', labelEn: 'Planning Engineer', priority: 7 },
  site_engineer: { role: 'site_engineer', homePath: '/site-workspace', labelAr: 'مهندس الموقع', labelEn: 'Site Engineer', priority: 8 },
  qc_inspector: { role: 'qc_inspector', homePath: '/qc-dashboard', labelAr: 'مهندس مراقبة الجودة', labelEn: 'QC Inspector', priority: 9 },
};

export interface WBSEvmSummary {
  wbs_id: string;
  wbs_code: string;
  title_ar: string;
  title_en?: string;
  level: number;
  activity_count: number;
  progress_pct: number;
  budgeted_cost: number; // BAC
  earned_value: number;  // EV / BCWP
  actual_cost: number;   // AC / ACWP
  planned_value: number; // PV / BCWS
  spi: number;
  cpi: number;
  etc: number;
  eac: number;
  vac: number;
  status: string;
}

export interface WBSTabDashboardData {
  totalActivities: number;
  inProgressActivities: number;
  completedActivities: number;
  delayedActivities: number;
  notStartedActivities: number;
  overallProgressPct: number;
  totalBac: number;
  totalEv: number;
  totalAc: number;
  totalPv: number;
  spi: number;
  cpi: number;
  etc: number;
  eac: number;
  vac: number;
}

