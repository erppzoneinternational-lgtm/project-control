import { z } from 'zod';

export const createDeliverableSchema = z.object({
  project_id: z.string().uuid(),
  title_ar: z.string().min(3, 'عنوان التسليم مطلوب'),
  title_en: z.string().optional().nullable(),
  type: z.enum(['shop_drawing', 'material_submittal', 'method_statement', 'inspection_request', 'rfi', 'other']),
  discipline: z.string().min(1).optional().nullable(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  description: z.string().max(2000).optional().nullable(),
});

export const deliverableTransitionSchema = z.object({
  item_id: z.string().uuid(),
  action: z.enum(['submit', 'approve', 'reject', 'revise', 'cancel']),
  comment: z.string().max(1000).optional(),
});

export type CreateDeliverableInput = z.infer<typeof createDeliverableSchema>;
export type DeliverableTransitionInput = z.infer<typeof deliverableTransitionSchema>;
