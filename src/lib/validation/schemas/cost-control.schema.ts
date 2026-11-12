import { z } from 'zod';

export const costSnapshotSchema = z.object({
  project_id: z.string().uuid(),
  snapshot_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  budget_at_completion: z.number().min(0),
  actual_cost: z.number().min(0),
  earned_value: z.number().min(0),
  planned_value: z.number().min(0),
});

export const budgetLineSchema = z.object({
  project_id: z.string().uuid(),
  cost_code_id: z.string().uuid(),
  description_ar: z.string().min(3),
  description_en: z.string().optional().nullable(),
  original_budget: z.number().min(0),
  approved_changes: z.number().default(0),
  committed_cost: z.number().min(0).default(0),
  actual_cost: z.number().min(0).default(0),
  forecast_cost: z.number().min(0).default(0),
});

export type CostSnapshotInput = z.infer<typeof costSnapshotSchema>;
export type BudgetLineInput = z.infer<typeof budgetLineSchema>;
