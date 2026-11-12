import { z } from 'zod';

export const hseIncidentSchema = z.object({
  id: z.string().uuid().optional(),
  project_id: z.string().uuid(),
  incident_number: z.string().min(1),
  incident_date: z.string(),
  severity: z.enum(['near_miss', 'first_aid', 'medical_treatment', 'lost_time', 'fatal']),
  title_ar: z.string().min(1),
  title_en: z.string().min(1),
  location_description: z.string(),
  injury_count: z.number().int().min(0),
  root_cause: z.string(),
  corrective_actions: z.string(),
  status: z.enum(['reported', 'investigating', 'closed'])
});

export const hseInspectionSchema = z.object({
  id: z.string().uuid().optional(),
  project_id: z.string().uuid(),
  inspection_date: z.string(),
  inspector_name: z.string().min(1),
  score_pct: z.number().min(0).max(100),
  safe_acts_count: z.number().int().min(0),
  unsafe_acts_count: z.number().int().min(0),
  stop_work_issued: z.boolean(),
  findings: z.string()
});
