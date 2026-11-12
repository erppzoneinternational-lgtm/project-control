export type ClaimType = 'variation_order' | 'eot' | 'cost_claim' | 'delay_claim';
export type ClaimStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'closed';
export type ContractStatus = 'active' | 'suspended' | 'completed' | 'terminated';

export interface Contract {
  id: string;
  project_id: string;
  contract_number: string;
  title_ar: string;
  title_en?: string | null;
  contractor_name: string;
  original_value: number;
  revised_value: number;
  currency: string;
  start_date: string;
  end_date: string;
  status: ContractStatus;
  fidic_type?: string | null;
  retention_pct: number;
  advance_payment_pct: number;
  performance_bond_pct: number;
  created_at: string;
  updated_at: string;
}

export interface Claim {
  id: string;
  project_id: string;
  contract_id: string;
  claim_number: string;
  claim_type: ClaimType;
  title_ar: string;
  title_en?: string | null;
  description: string;
  claimed_amount: number;
  approved_amount: number | null;
  submitted_by: string;
  reviewed_by: string | null;
  status: ClaimStatus;
  submission_date: string;
  review_date: string | null;
  supporting_docs: string[];
  clause_reference: string | null;
  created_at: string;
  updated_at: string;
}

export interface VariationOrder {
  id: string;
  project_id: string;
  contract_id: string;
  vo_number: string;
  title_ar: string;
  title_en?: string | null;
  description: string;
  vo_type: 'addition' | 'omission' | 'substitution';
  original_scope: string;
  revised_scope: string;
  cost_impact: number;
  time_impact_days: number;
  status: ClaimStatus;
  requested_by: string;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EOTRequest {
  id: string;
  project_id: string;
  contract_id: string;
  eot_number: string;
  title_ar: string;
  reason: string;
  requested_days: number;
  approved_days: number | null;
  clause_reference: string | null;
  status: ClaimStatus;
  requested_by: string;
  reviewed_by: string | null;
  submission_date: string;
  created_at: string;
  updated_at: string;
}

export interface IPCCertificate {
  id: string;
  project_id: string;
  contract_id: string;
  ipc_number: number;
  period_start: string;
  period_end: string;
  gross_amount: number;
  retention_deduction: number;
  advance_recovery: number;
  previous_certified: number;
  current_certified: number;
  net_payable: number;
  status: 'draft' | 'submitted' | 'certified' | 'paid';
  certified_by: string | null;
  certified_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContractSummary {
  totalOriginalValue: number;
  totalVOs: number;
  totalClaims: number;
  netContractValue: number;
}
