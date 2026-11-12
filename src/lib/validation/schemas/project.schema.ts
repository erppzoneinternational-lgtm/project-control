import { z } from 'zod';

export const createProjectSchema = z.object({
  name_ar: z.string().min(3, 'اسم المشروع مطلوب'),
  name_en: z.string().optional().nullable(),
  public_name: z.string().max(300).optional().nullable(),
  project_code: z.string().min(1, 'كود المشروع مطلوب'),
  client_id: z.string().uuid('معرف العميل غير صالح').optional().nullable(),
  governorate_id: z.string().uuid().optional().nullable(),
  city_id: z.string().uuid().optional().nullable(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'التاريخ يجب أن يكون YYYY-MM-DD'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'التاريخ يجب أن يكون YYYY-MM-DD'),
  contract_value: z.number().min(0, 'قيمة العقد يجب أن تكون موجبة').optional(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']).default('planning'),
  description: z.string().max(2000).optional().nullable(),
});

export const updateProjectSchema = createProjectSchema.partial();

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
