/**
 * Task Ontology & Engineering Graph Types
 * ---------------------------------------
 * Conforms to docs/PRD_PROJECT_TASK_ONTOLOGY.md
 */

export type ComponentInstanceType =
  | 'lagoon_body'
  | 'pump_room'
  | 'pump_room_with_tank'
  | 'building'
  | 'infrastructure'
  | 'zone_area'
  | 'general';

export interface ComponentInstance {
  id: string;
  project_id: string;
  code: string;
  name_ar: string;
  name_en?: string | null;
  component_type: ComponentInstanceType;
  zone_id?: string | null;
  status: 'active' | 'completed' | 'archived';
  created_at?: string;
  updated_at?: string;
}

export type WorkPackageStatus =
  | 'planned'
  | 'released'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface WorkPackage {
  id: string;
  project_id: string;
  code: string;
  title_ar: string;
  title_en?: string | null;
  component_instance_id?: string | null;
  zone_id?: string | null;
  schedule_activity_id?: string | null;
  planned_start?: string | null;
  planned_finish?: string | null;
  status: WorkPackageStatus;
  revision: number;
  created_at?: string;
  updated_at?: string;
}

export interface WorkPackageBoqScope {
  id: string;
  work_package_id: string;
  boq_item_id: string;
  planned_qty: number;
  unit?: string | null;
}

export type TaskAssignmentRole =
  | 'primary_assignee'
  | 'pm_reviewer'
  | 'qc_inspector'
  | 'watcher'
  | 'delegate';

export interface TaskAssignment {
  id: string;
  task_id: string;
  stakeholder_id: string;
  role: TaskAssignmentRole;
  assigned_by?: string | null;
  assigned_at: string;
  released_at?: string | null;
  is_active: boolean;
  stakeholder_name_ar?: string;
}

export type InspectionType =
  | 'WIR'
  | 'MIR'
  | 'NCR'
  | 'pre_pour'
  | 'survey'
  | 'SURVEY'
  | 'final_handover';

export type InspectionStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface InspectionRequest {
  id: string;
  task_id: string;
  project_id: string;
  request_no: string;
  inspection_type: InspectionType;
  required_at: string;
  assigned_qc_id?: string | null;
  status: InspectionStatus;
  decision_at?: string | null;
  decision_by?: string | null;
  reason?: string | null;
  evidence_urls?: string[] | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  task_title_ar?: string;
  qc_name_ar?: string;
  project_name_ar?: string;
  project_name_en?: string;
  project_code?: string;
}

export type TaskEventType =
  | 'created'
  | 'released'
  | 'started'
  | 'submitted_for_pm'
  | 'pm_accepted'
  | 'pm_rejected'
  | 'inspection_created'
  | 'inspection_passed'
  | 'inspection_rejected'
  | 'reopened_rework'
  | 'verified'
  | 'closed'
  | 'cancelled'
  | 'reassigned'
  | 'replanned'
  | 'scope_changed'
  | 'constraint_logged'
  | 'constraint_resolved'
  | 'migration_backfill';

export interface TaskEvent {
  id: string;
  task_id: string;
  project_id: string;
  event_type: TaskEventType;
  actor_user_id?: string | null;
  actor_stakeholder_id?: string | null;
  from_state?: string | null;
  to_state?: string | null;
  reason?: string | null;
  payload: Record<string, any>;
  created_at: string;
  actor_name_ar?: string;
}

export type ConstraintType =
  | 'material'
  | 'drawing'
  | 'access'
  | 'approval'
  | 'weather'
  | 'safety'
  | 'equipment'
  | 'manpower'
  | 'other';

export type ConstraintStatus = 'open' | 'in_progress' | 'resolved' | 'waived';

export interface TaskConstraint {
  id: string;
  task_id: string;
  project_id: string;
  type: ConstraintType;
  title: string;
  description?: string | null;
  owner_stakeholder_id?: string | null;
  required_by?: string | null;
  status: ConstraintStatus;
  resolved_at?: string | null;
  resolved_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskNotification {
  id: string;
  recipient_user_id: string;
  event_type: string;
  entity_type: 'task' | 'inspection' | 'report' | 'constraint';
  entity_id: string;
  title_ar: string;
  body_ar?: string | null;
  occurred_at: string;
  read_at?: string | null;
}

/** Deterministic task instance key generator for idempotent generation without title collisions. */
export function generateTaskInstanceKey(params: {
  projectId: string;
  componentInstanceId?: string | null;
  zoneId?: string | null;
  stepCode: string;
  revision?: number;
}): string {
  const parts = [
    params.projectId,
    params.componentInstanceId || 'nocomp',
    params.zoneId || 'nozone',
    params.stepCode.trim(),
    `r${params.revision || 1}`,
  ];
  return parts.join('::');
}
