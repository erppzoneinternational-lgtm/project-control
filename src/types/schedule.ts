export type ActivityStatus = 'not_started' | 'in_progress' | 'completed' | 'delayed';

export interface Project {
  id: string;
  name: string;
  code: string;
  client: string;
  location: string;
  contractValue: number;
  startDate: string;
  endDate: string;
  status: 'Planning' | 'Active' | 'On Hold' | 'Completed';
  description?: string;
}

export interface ScheduleActivity {
  id: string;
  project_id: string;
  activity_id: string;
  wbs_id?: string;
  wbs_code?: string;
  wbs_name?: string;
  activity_name: string;
  planned_start: string;
  planned_finish: string;
  actual_start?: string;
  actual_finish?: string;
  duration_days: number;
  percent_complete: number;
  status: ActivityStatus;
  is_milestone: boolean;
  is_critical: boolean;
  responsible_id?: string;
  boq_item_ids?: string[];
  notes?: string;
}

export interface ActivityDependency {
  id: string;
  predecessor_id: string;
  successor_id: string;
  relationship: 'FS' | 'FF' | 'SS' | 'SF';
  lag_days: number;
}
