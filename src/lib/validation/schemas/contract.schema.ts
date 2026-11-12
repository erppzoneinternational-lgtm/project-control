import { z } from 'zod';

export const createContractSchema = z.object({
  project_id: z.string().uuid(),
  contract_number: z.string().min(1, 'رقم العقد مطلوب'),
  title_ar: z.string().min(3, 'عنوان العقد مطلوب'),
  title_en: z.string().optional().nullable(),
  contractor_name: z.string().min(2, 'اسم المقاول مطلوب'),
  original_value: z.number().min(0, 'قيمة العقد يجب أن تكون موجبة'),
  revised_value: z.number().min(0).optional(),
  currency: z.string().min(2).max(5).default('EGP'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(['active', 'suspended', 'completed', 'terminated']).default('active'),
  fidic_type: z.enum(['red_book', 'yellow_book', 'silver_book']).optional().nullable(),
  retention_pct: z.number().min(0).max(100).default(0),
  advance_payment_pct: z.number().min(0).max(100).default(0),
  performance_bond_pct: z.number().min(0).max(100).default(0),
});

export const createClaimSchema = z.object({
  project_id: z.string().uuid(),
  contract_id: z.string().uuid(),
  claim_type: z.enum(['variation_order', 'eot', 'cost_claim', 'delay_claim']),
  title_ar: z.string().min(3),
  title_en: z.string().optional().nullable(),
  description: z.string().min(10, 'الوصف مطلوب (10 أحرف على الأقل)'),
  claimed_amount: z.number().min(0),
  clause_reference: z.string().optional().nullable(),
  supporting_docs: z.array(z.string().url()).optional().default([]),
});

export const createVOSchema = z.object({
  project_id: z.string().uuid(),
  contract_id: z.string().uuid(),
  vo_number: z.string().min(1),
  title_ar: z.string().min(3),
  title_en: z.string().optional().nullable(),
  description: z.string().min(10),
  vo_type: z.enum(['addition', 'omission', 'substitution']),
  original_scope: z.string().min(5),
  revised_scope: z.string().min(5),
  cost_impact: z.number(),
  time_impact_days: z.number().int(),
});

export const createEOTSchema = z.object({
  project_id: z.string().uuid(),
  contract_id: z.string().uuid(),
  eot_number: z.string().min(1),
  title_ar: z.string().min(3),
  reason: z.string().min(10),
  requested_days: z.number().int().min(1),
  clause_reference: z.string().optional().nullable(),
});

export const createIPCSchema = z.object({
  project_id: z.string().uuid(),
  contract_id: z.string().uuid(),
  ipc_number: z.number().int().min(1),
  period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gross_amount: z.number().min(0),
  retention_deduction: z.number().min(0),
  advance_recovery: z.number().min(0),
  previous_certified: z.number().min(0),
  current_certified: z.number().min(0),
  net_payable: z.number(),
});

export type CreateContractInput = z.infer<typeof createContractSchema>;
export type CreateClaimInput = z.infer<typeof createClaimSchema>;
export type CreateVOInput = z.infer<typeof createVOSchema>;
export type CreateEOTInput = z.infer<typeof createEOTSchema>;
export type CreateIPCInput = z.infer<typeof createIPCSchema>;
