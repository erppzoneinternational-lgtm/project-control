import { WBSItem } from './index';

export type CostCodeCategory = 
  | 'materials'
  | 'labour'
  | 'equipment_overheads'
  | 'subcontractors'
  | 'accruals'
  | 'revenue'
  | 'preliminaries'
  | 'concrete'
  | 'finishing'
  | 'mech'
  | 'elec'
  | 'landscape'
  | 'water_features'
  | 'other';

export interface CostCode {
  id: string;                          // UUID PK
  code: string;                        // UNIQUE text, e.g. "M220"
  name_ar: string;
  name_en?: string;
  category?: CostCodeCategory;
  prefix?: string;
  is_header?: boolean;
  parent_code?: string | null;         // Self-referencing code
  parent_id?: string | null;
  sort_order?: number;
  is_system?: boolean;                 // Non-editable system source code
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CostCodeTreeItem extends CostCode {
  children?: CostCode[];
}

export interface EnterpriseCostDivision {
  key: CostCodeCategory | 'all';
  prefix?: string;
  labelAr: string;
  labelEn: string;
  color: string;
  badgeColor?: string;
  descriptionAr?: string;
}

export interface CostCodeFilterOptions {
  category?: string;
  prefix?: string;
  is_header?: boolean;
  parent_code?: string;
  is_system?: boolean;
  is_active?: boolean;
  search?: string;
}

export type BoqPricingStatus = 
  | 'contract_original'
  | 'vo_approved'
  | 'star_rate_provisional'
  | 'disputed';

export type BoqInclusionStatus = 'base' | 'optional_pending' | 'optional_added' | 'omitted';

export interface BoqSection {
  id: string;
  project_id: string;
  zone_id?: string | null;
  discipline?: string | null;
  name_ar: string;
  name_en?: string | null;
  sort_order: number;
  parent_section_id?: string | null;
  /** Original Excel sheet name this page was imported from */
  source_sheet_name?: string | null;
  /** Whole sheet is optional scope — new items default to optional_pending */
  is_optional?: boolean;
  color?: string | null;
  items?: BoqItem[];
  sub_sections?: BoqSection[];
  created_at?: string;
  updated_at?: string;
}

export interface BoqItem {
  id: string;
  project_id: string;
  section_id?: string | null;
  zone_id?: string | null;
  item_type?: 'measurable' | 'lump_sum';
  item_code: string;                   // UNIQUE(project_id, item_code)
  cost_code_id?: string | null;
  cost_code?: CostCode;
  description_ar: string;
  description_en?: string;
  unit: string;                        // m3, m2, ml, no, kg, ton, lot...
  contract_qty: number;                // Tender contract quantity >= 0
  shop_drawing_qty?: number | null;    // Technical Office workshop drawing qty
  pricing_status: BoqPricingStatus;    // Default 'contract_original'
  foreign_currency: string;            // Default 'EGP' (e.g. USD, EUR)
  base_foreign_amount?: number | null;
  rate_egp: number;                    // Rate in EGP >= 0
  amount_egp: number;                  // Generated: contract_qty * rate_egp
  wbs_item_id?: string | null;
  wbs_item?: WBSItem;
  revision: number;                    // In-place revision counter (starts at 1)
  is_current?: boolean;
  vo_ref?: string | null;              // Change order reference number
  notes?: string | null;
  /** Cost Control Engineer & Variation Order Workflow */
  vo_qty?: number | null;              // +/- Quantity impact from approved change order
  vo_rate_egp?: number | null;         // Unit rate for variation order
  vo_amount_egp?: number | null;       // +/- Total financial impact of variation order
  revised_qty?: number | null;         // Revised contract quantity = contract_qty + vo_qty
  revised_rate_egp?: number | null;    // Revised unit rate in EGP
  revised_amount_egp?: number | null;  // Revised contract amount in EGP = revised_qty * revised_rate_egp
  cost_control_notes?: string | null;  // Cost Control audit notes or remarks
  /** Contract total = Σ amount where inclusion ∈ {base, optional_added} */
  inclusion_status?: BoqInclusionStatus;
  inclusion_reason?: string | null;
  inclusion_changed_at?: string | null;
  inclusion_changed_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface BoqImportRow {
  item_code: string;
  cost_code?: string;
  description_ar: string;
  description_en?: string;
  unit: string;
  contract_qty: number;
  shop_drawing_qty?: number;
  rate_egp: number;
  foreign_currency?: string;
  base_foreign_amount?: number;
  pricing_status?: BoqPricingStatus;
  vo_ref?: string;
  notes?: string;
}

export interface BoqImportRowError {
  row: number;
  item_code?: string;
  field?: string;
  reason: string;
}

export interface BoqImportValidationResult {
  valid: boolean;
  validRows: BoqImportRow[];
  errors: BoqImportRowError[];
  totalAmountEgp: number;
  totalCount: number;
}

export type ProcurementStage = 
  | 'material_submittal'
  | 'material_approval'
  | 'purchasing'
  | 'delivered_site';

export interface BoqSubMaterial {
  id: string;
  boq_item_id: string;
  material_name_ar: string;            // e.g. HDPE 1.5mm rolls, Geotextile, Rebar
  unit: string;
  consumption_rate: number;            // Default 1.0 (e.g. 1.05 m2 / m2)
  standard_wastage_pct: number;        // e.g. 8.0 for 8% welding waste
  required_procurement_qty: number;    // contract_qty * consumption_rate * (1 + standard_wastage_pct / 100)
  ordered_qty: number;
  delivered_to_site_qty: number;
  procurement_stage: ProcurementStage;
  supplier_ref?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BoqRevision {
  id: string;
  boq_item_id: string;
  revision: number;
  contract_qty: number;
  rate_egp: number;
  amount_egp: number;
  description_ar: string;
  changed_by?: string;
  change_reason?: string;
  created_at: string;
  snapshot_data?: Record<string, any>;
}

export interface BoqMilestoneStep {
  id: string;
  boq_item_id: string;
  step_name_ar: string;                // e.g. Sample approval, Site delivery, Installation, Pressure test, Commissioning
  weight_pct: number;                  // Step weight % (sum of steps = 100)
  is_completed: boolean;
  completed_at?: string | null;
  verified_by?: string | null;
  created_at?: string;
}

export type MaterialTransactionType = 
  | 'issue_to_site'
  | 'return_to_store'
  | 'adjustment'
  | 'waste_writeoff'
  | 'received_on_site';

export interface MaterialTransaction {
  id: string;
  project_id: string;
  sub_material_id: string;
  tx_date: string;                     // YYYY-MM-DD
  tx_type: MaterialTransactionType;
  qty: number;
  zone?: string;
  ref_wir_no?: string;
  recorded_by?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MaterialAllocation {
  id: string;
  sub_material_id: string;
  activity_id: string;
  allocated_qty: number;
  created_at?: string;
}

export interface MaterialWastageReportItem {
  sub_material_id: string;
  material_name_ar: string;
  unit: string;
  issued_qty: number;
  installed_qty: number;
  standard_wastage_pct: number;
  actual_wastage_pct: number;
  variance_pct: number;
  unit_price_egp: number;
  variance_egp: number;
  is_loss: boolean;
}

export interface MaterialWastageReport {
  project_id: string;
  generated_at: string;
  items: MaterialWastageReportItem[];
  total_variance_egp: number;
}
