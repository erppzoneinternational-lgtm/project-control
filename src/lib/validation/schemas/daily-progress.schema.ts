import { z } from 'zod';

export const dailyProgressLineSchema = z.object({
  boq_item_id: z.string().uuid(),
  planned_qty: z.number().min(0),
  actual_qty: z.number().min(0),
  unit: z.string().min(1),
  remarks: z.string().max(500).optional().nullable(),
});

export const createDailyProgressSchema = z.object({
  project_id: z.string().uuid('معرف المشروع مطلوب'),
  site_task_id: z.string().uuid().optional().nullable(),
  activity_id: z.string().uuid().optional().nullable(),
  report_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weather: z.enum(['sunny', 'cloudy', 'rainy', 'windy', 'stormy', 'hot', 'cold']).optional(),
  manpower_count: z.number().int().min(0).optional(),
  equipment_count: z.number().int().min(0).optional(),
  obstruction_type: z.string().max(100).optional().nullable(),
  vo_requested: z.boolean().default(false),
  lines: z.array(dailyProgressLineSchema).optional(),
  remarks: z.string().max(2000).optional().nullable(),
});

export const dailyProgressTransitionSchema = z.object({
  report_id: z.string().uuid(),
  action: z.enum(['submit', 'approve', 'reject', 'revise', 'cancel']),
  comment: z.string().max(1000).optional(),
});

export type CreateDailyProgressInput = z.infer<typeof createDailyProgressSchema>;
export type DailyProgressTransitionInput = z.infer<typeof dailyProgressTransitionSchema>;
