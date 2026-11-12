export interface CostSnapshot {
  id: string;
  project_id: string;
  snapshot_date: string;
  budget_at_completion: number;
  actual_cost: number;
  earned_value: number;
  planned_value: number;
  spi: number; // Schedule Performance Index
  cpi: number; // Cost Performance Index
  sv: number;  // Schedule Variance
  cv: number;  // Cost Variance
  eac: number; // Estimate at Completion
  etc: number; // Estimate to Complete
  vac: number; // Variance at Completion
  tcpi: number; // To-Complete Performance Index
  created_at: string;
}

export interface BudgetLine {
  id: string;
  project_id: string;
  cost_code_id: string;
  description_ar: string;
  description_en?: string | null;
  original_budget: number;
  approved_changes: number;
  current_budget: number;
  committed_cost: number;
  actual_cost: number;
  forecast_cost: number;
  variance: number;
  created_at: string;
  updated_at: string;
}

export interface CostControlSummary {
  totalBudget: number;
  totalActualCost: number;
  totalEarnedValue: number;
  totalPlannedValue: number;
  overallSPI: number;
  overallCPI: number;
  overallSV: number;
  overallCV: number;
  eac: number;
  etc: number;
  contingencyUsed: number;
  contingencyRemaining: number;
}
