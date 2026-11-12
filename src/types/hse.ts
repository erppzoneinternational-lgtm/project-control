export type IncidentSeverity = 'near_miss' | 'first_aid' | 'medical_treatment' | 'lost_time' | 'fatal';

export interface HseIncident {
  id: string;
  project_id: string;
  incident_number: string;
  incident_date: string;
  severity: IncidentSeverity;
  title_ar: string;
  title_en: string;
  location_description: string;
  injury_count: number;
  root_cause: string;
  corrective_actions: string;
  status: 'reported' | 'investigating' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface HseInspection {
  id: string;
  project_id: string;
  inspection_date: string;
  inspector_name: string;
  score_pct: number;
  safe_acts_count: number;
  unsafe_acts_count: number;
  stop_work_issued: boolean;
  findings: string;
  created_at: string;
}

export interface HseMetrics {
  safeManHours: number;
  ltiFreeDays: number;
  totalIncidents: number;
  openActions: number;
  safetyScoreAverage: number;
}
