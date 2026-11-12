/**
 * ActivityLibraryGenerationService
 * ---------------------------------
 * Turns standard execution steps (pm_activity_library, one component_type)
 * into pm_site_tasks rows for a concrete project.
 *
 * Owner-matching note: stakeholders.job_title is empty on live data, so the
 * Excel `task_owner` role CANNOT be auto-matched to a person. Instead:
 *   - optional default assignee picked by the user in the UI,
 *   - the original Excel owner + QC note travel inside `description`.
 *
 * Idempotency: task titles embed the library code (`[LB-014] …`); any existing
 * open/any-status task with the same title in the same project is skipped.
 */
import { supabase } from '@/lib/supabase';
import { generateTaskInstanceKey } from '@/types/task-ontology';
import { logger } from '@/lib/logger';

export type LibraryComponentType = 'lagoon_body' | 'pump_room' | 'pump_room_with_tank';

export interface LibraryStepRow {
  id: string;
  library_code: string;
  name_ar: string;
  name_en: string | null;
  phase_ar: string | null;
  category: string | null;
  task_owner: string | null;
  qc_note: string | null;
  step_no: number | null;
}

export interface GenerationPreview {
  componentType: LibraryComponentType;
  componentInstanceId?: string | null;
  totalSteps: number;
  alreadyGenerated: number;
  toCreate: number;
}

export interface GenerationResult {
  created: number;
  skipped: number;
}

/** `[LB-014] نص الخطوة` — prefix keeps re-runs sortable and human-readable. */
export function buildTaskTitle(
  step: Pick<LibraryStepRow, 'library_code' | 'name_ar'>,
  componentInstanceName?: string | null
): string {
  const prefix = componentInstanceName ? `[${componentInstanceName}] ` : '';
  return `${prefix}[${step.library_code}] ${step.name_ar}`;
}

export function buildTaskDescription(
  step: Pick<LibraryStepRow, 'name_en' | 'task_owner' | 'qc_note' | 'phase_ar'>,
  componentType?: string,
  componentInstanceName?: string | null
): string {
  const parts: string[] = [];
  if (componentInstanceName) parts.push(`المكوّن: ${componentInstanceName}`);
  else if (componentType) parts.push(`المكوّن: ${componentType}`);
  if (step.name_en) parts.push(`EN: ${step.name_en}`);
  if (step.phase_ar) parts.push(`المرحلة: ${step.phase_ar}`);
  if (step.task_owner) parts.push(`المسؤول (من الإكسيل): ${step.task_owner}`);
  if (step.qc_note) parts.push(`ملاحظة جودة: ${step.qc_note}`);
  return parts.join(' · ');
}

/** Pure helper: filter pending steps using existing instance keys or titles (supports legacy 2-arg signature). */
export function filterPendingSteps(
  steps: LibraryStepRow[],
  existingTitlesOrProjectId: Set<string> | string,
  existingKeys?: Set<string>,
  existingTitles?: Set<string>,
  componentInstanceId?: string | null,
  zoneId?: string | null
): LibraryStepRow[] {
  if (existingTitlesOrProjectId instanceof Set) {
    const legacyTitles = existingTitlesOrProjectId;
    return steps.filter((s) => !legacyTitles.has(buildTaskTitle(s)));
  }

  const projectId = existingTitlesOrProjectId;
  const keys = existingKeys || new Set<string>();
  const titles = existingTitles || new Set<string>();

  return steps.filter((s) => {
    const key = generateTaskInstanceKey({
      projectId,
      componentInstanceId,
      zoneId,
      stepCode: s.library_code,
    });
    if (keys.has(key)) return false;
    // fallback to title for legacy non-keyed tasks if no component instance
    if (!componentInstanceId && titles.has(buildTaskTitle(s))) return false;
    return true;
  });
}

export class ActivityLibraryGenerationService {
  static async fetchSteps(componentType: LibraryComponentType): Promise<LibraryStepRow[]> {
    const { data, error } = await supabase
      .from('pm_activity_library')
      .select(
        'id, library_code, name_ar, name_en, phase_ar, category, task_owner, qc_note, step_no'
      )
      .eq('is_active', true)
      .eq('component_type', componentType)
      .order('step_no', { ascending: true });
    if (error) throw error;
    return (data || []) as LibraryStepRow[];
  }

  static async fetchExistingKeysAndTitles(
    projectId: string
  ): Promise<{ keys: Set<string>; titles: Set<string> }> {
    const { data, error } = await supabase
      .from('pm_site_tasks')
      .select('title_ar, task_instance_key')
      .eq('project_id', projectId);
    if (error) throw error;

    const keys = new Set<string>();
    const titles = new Set<string>();

    for (const r of (data || [])) {
      if (r.task_instance_key) keys.add(r.task_instance_key);
      if (r.title_ar) titles.add(String(r.title_ar));
    }

    return { keys, titles };
  }

  static async preview(
    projectId: string,
    componentType: LibraryComponentType,
    componentInstanceId?: string | null,
    zoneId?: string | null
  ): Promise<GenerationPreview> {
    const [steps, { keys, titles }] = await Promise.all([
      ActivityLibraryGenerationService.fetchSteps(componentType),
      ActivityLibraryGenerationService.fetchExistingKeysAndTitles(projectId),
    ]);

    const pending = filterPendingSteps(steps, projectId, keys, titles, componentInstanceId, zoneId);
    const toCreate = pending.length;

    return {
      componentType,
      componentInstanceId,
      totalSteps: steps.length,
      alreadyGenerated: steps.length - toCreate,
      toCreate,
    };
  }

  static async generate(opts: {
    projectId: string;
    componentType: LibraryComponentType;
    componentInstanceId?: string | null;
    componentInstanceName?: string | null;
    zoneId?: string | null;
    defaultAssigneeStakeholderId?: string | null;
    defaultQcStakeholderId?: string | null;
    createdBy?: string | null;
    /** First day for step 1; each next step gets the next calendar day (planned_date is NOT NULL on pm_site_tasks). */
    startDate?: Date;
  }): Promise<GenerationResult> {
    const { projectId, componentType, componentInstanceId, componentInstanceName, zoneId } = opts;
    const [steps, { keys, titles }] = await Promise.all([
      ActivityLibraryGenerationService.fetchSteps(componentType),
      ActivityLibraryGenerationService.fetchExistingKeysAndTitles(projectId),
    ]);

    const pending = filterPendingSteps(steps, projectId, keys, titles, componentInstanceId, zoneId);
    if (pending.length === 0) return { created: 0, skipped: steps.length };

    const start = opts.startDate ?? new Date();
    const iso = (d: Date) => d.toISOString().slice(0, 10);

    const rows = pending.map((s, idx) => {
      const plannedDate = iso(new Date(start.getTime() + idx * 86_400_000));
      const instanceKey = generateTaskInstanceKey({
        projectId,
        componentInstanceId,
        zoneId,
        stepCode: s.library_code,
      });

      return {
        project_id: projectId,
        task_type: 'execution',
        task_instance_key: instanceKey,
        component_instance_id: componentInstanceId || null,
        template_id: s.library_code,
        title_ar: buildTaskTitle(s, componentInstanceName),
        description: buildTaskDescription(s, componentType, componentInstanceName),
        zone_id: zoneId || null,
        assignee_stakeholder_id: opts.defaultAssigneeStakeholderId || null,
        qc_stakeholder_id: opts.defaultQcStakeholderId || null,
        planned_date: plannedDate,
        planned_start_at: plannedDate,
        planned_finish_at: plannedDate,
        due_date: plannedDate,
        status: 'pending',
        priority: 'normal',
        progress_pct: 0,
        measurement_method: 'quantity',
        progress_source: 'daily_report',
        created_by: opts.createdBy || null,
      };
    });

    // Chunked insert
    const CHUNK = 200;
    let created = 0;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const { error } = await supabase
        .from('pm_site_tasks')
        .insert(rows.slice(i, i + CHUNK));
      if (error) throw error;
      created += Math.min(CHUNK, rows.length - i);
    }
    return { created, skipped: steps.length - created };
  }
}

