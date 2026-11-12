import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import {
  ComponentInstance,
  WorkPackage,
  WorkPackageBoqScope,
  TaskAssignment,
  InspectionRequest,
  TaskEvent,
  TaskConstraint,
  TaskNotification,
  InspectionStatus,
  generateTaskInstanceKey,
} from '@/types/task-ontology';

export class TaskOntologyService {
  /* ── 1. Component Instances ────────────────────────────────── */
  static async listComponentInstances(projectId: string): Promise<ComponentInstance[]> {
    if (!projectId) return [];
    const { data, error } = await supabase
      .from('pm_component_instances')
      .select('*')
      .eq('project_id', projectId)
      .order('code', { ascending: true });
    if (error) {
      console.error('TaskOntologyService.listComponentInstances error:', error);
      return [];
    }
    return (data || []) as ComponentInstance[];
  }

  static async createComponentInstance(
    instance: Omit<ComponentInstance, 'id' | 'created_at' | 'updated_at'>
  ): Promise<ComponentInstance> {
    const { data, error } = await supabase
      .from('pm_component_instances')
      .insert(instance)
      .select('*')
      .single();
    if (error) throw error;
    return data as ComponentInstance;
  }

  /* ── 2. Work Packages ───────────────────────────────────────── */
  static async listWorkPackages(projectId: string): Promise<WorkPackage[]> {
    if (!projectId) return [];
    const { data, error } = await supabase
      .from('pm_work_packages')
      .select('*')
      .eq('project_id', projectId)
      .order('code', { ascending: true });
    if (error) {
      console.error('TaskOntologyService.listWorkPackages error:', error);
      return [];
    }
    return (data || []) as WorkPackage[];
  }

  static async createWorkPackage(
    pkg: Omit<WorkPackage, 'id' | 'created_at' | 'updated_at'>,
    boqScopes: { boq_item_id: string; planned_qty: number; unit?: string }[] = []
  ): Promise<WorkPackage> {
    const { data, error } = await supabase
      .from('pm_work_packages')
      .insert(pkg)
      .select('*')
      .single();
    if (error) throw error;

    const createdPkg = data as WorkPackage;

    if (boqScopes.length > 0) {
      const scopeInserts = boqScopes.map((s) => ({
        work_package_id: createdPkg.id,
        boq_item_id: s.boq_item_id,
        planned_qty: s.planned_qty,
        unit: s.unit || null,
      }));
      await supabase.from('pm_work_package_boq_scope').insert(scopeInserts);
    }

    return createdPkg;
  }

  /* ── 3. Task Assignments ────────────────────────────────────── */
  static async listAssignmentsForTask(taskId: string): Promise<TaskAssignment[]> {
    const { data, error } = await supabase
      .from('pm_task_assignments')
      .select('*, stakeholders(name_ar)')
      .eq('task_id', taskId)
      .order('assigned_at', { ascending: false });
    if (error) {
      console.error('TaskOntologyService.listAssignmentsForTask error:', error);
      return [];
    }
    return (data || []).map((row) => ({
      id: row.id,
      task_id: row.task_id,
      stakeholder_id: row.stakeholder_id,
      role: row.role,
      assigned_by: row.assigned_by,
      assigned_at: row.assigned_at,
      released_at: row.released_at,
      is_active: row.is_active,
      stakeholder_name_ar: row.stakeholders?.name_ar,
    }));
  }

  /* ── 4. Inspection Requests (WIR / QC) ──────────────────────── */
  static async listInspections(projectId?: string, status?: InspectionStatus): Promise<InspectionRequest[]> {
    let q = supabase
      .from('pm_inspection_requests')
      .select('*, pm_site_tasks(title_ar), stakeholders(name_ar), projects(name_ar, name_en, code)')
      .order('required_at', { ascending: true });

    if (projectId) {
      q = q.eq('project_id', projectId);
    }

    if (status) {
      q = q.eq('status', status);
    }

    let { data, error } = await q;
    if (error) {
      // Fallback query without projects relation if relationship alias differs
      let fallbackQ = supabase
        .from('pm_inspection_requests')
        .select('*, pm_site_tasks(title_ar), stakeholders(name_ar)')
        .order('required_at', { ascending: true });

      if (projectId) fallbackQ = fallbackQ.eq('project_id', projectId);
      if (status) fallbackQ = fallbackQ.eq('status', status);

      const fallbackRes = await fallbackQ;
      if (fallbackRes.error) {
        console.error('TaskOntologyService.listInspections error:', fallbackRes.error);
        return [];
      }
      data = fallbackRes.data;
    }

    return (data || []).map((r) => ({
      id: r.id,
      task_id: r.task_id,
      project_id: r.project_id,
      request_no: r.request_no,
      inspection_type: r.inspection_type,
      required_at: r.required_at,
      assigned_qc_id: r.assigned_qc_id,
      status: r.status,
      decision_at: r.decision_at,
      decision_by: r.decision_by,
      reason: r.reason,
      evidence_urls: r.evidence_urls,
      created_by: r.created_by,
      created_at: r.created_at,
      updated_at: r.updated_at,
      task_title_ar: r.pm_site_tasks?.title_ar,
      qc_name_ar: r.stakeholders?.name_ar,
      project_name_ar: r.projects?.name_ar,
      project_name_en: r.projects?.name_en,
      project_code: r.projects?.code,
    }));
  }

  static async getInspectionById(inspectionId: string): Promise<InspectionRequest | null> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(inspectionId);
    if (!inspectionId || !isUuid || inspectionId.startsWith('insp-mock-')) return null;
    try {
      const { data, error } = await supabase
        .from('pm_inspection_requests')
        .select(`
          *,
          task:pm_site_tasks(id, task_type, title_ar, project_id),
          assigned_qc:stakeholders!pm_inspection_requests_assigned_qc_id_fkey(id, name_ar, name_en)
        `)
        .eq('id', inspectionId)
        .maybeSingle();

      if (error) {
        const { data: fallback, error: fallbackError } = await supabase
          .from('pm_inspection_requests')
          .select('*')
          .eq('id', inspectionId)
          .maybeSingle();
        if (fallbackError) throw fallbackError;
        return fallback as InspectionRequest;
      }
      return data as InspectionRequest;
    } catch (err) {
      logger.error('Failed to get inspection by ID', { detail: err, inspectionId });
      return null;
    }
  }

  static async createInspectionRequest(
    req: Omit<InspectionRequest, 'id' | 'created_at' | 'updated_at' | 'decision_at' | 'decision_by'>
  ): Promise<InspectionRequest> {
    try {
      const { data, error } = await supabase.rpc('rpc_create_inspection', {
        p_task_id: req.task_id,
        p_inspection_type: req.inspection_type || 'wir',
        p_required_at: req.required_at || null,
      });
      if (error) {
        logger.error('TaskOntologyService.createInspectionRequest RPC error:', { detail: error });
        throw error;
      }
      return data as InspectionRequest;
    } catch (err) {
      logger.error('TaskOntologyService.createInspectionRequest error:', { detail: err });
      throw err;
    }
  }

  static async recordInspectionDecision(
    inspectionId: string,
    decision: 'approved' | 'rejected',
    reason?: string,
    evidenceUrls?: string[]
  ): Promise<void> {
    if (decision === 'rejected' && (!reason || !reason.trim())) {
      throw new Error('REASON_REQUIRED: سبب الرفض إلزامي عند رفض طلب الفحص');
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(inspectionId);
    if (!isUuid || inspectionId.startsWith('insp-mock-')) {
      return;
    }

    const { data: insp, error: fetchErr } = await supabase
      .from('pm_inspection_requests')
      .select('*')
      .eq('id', inspectionId)
      .maybeSingle();
    if (fetchErr || !insp) {
      logger.warn('Inspection request not found for decision', { inspectionId, fetchErr });
      throw new Error('INSPECTION_NOT_FOUND: طلب الفحص غير موجود أو ليس لديك صلاحية الوصول إليه');
    }

    const { error: updateErr } = await supabase
      .from('pm_inspection_requests')
      .update({
        status: decision,
        decision_at: new Date().toISOString(),
        reason: reason || null,
        evidence_urls: evidenceUrls || insp.evidence_urls,
        updated_at: new Date().toISOString(),
      })
      .eq('id', inspectionId);
    if (updateErr) throw updateErr;

    // Update parent task state (use live DB state names, not PRD names)
    if (decision === 'approved') {
      await supabase.rpc('rpc_site_task_transition', {
        p_task_id: insp.task_id,
        p_to_state: 'approved',
        p_reason: `اعتماد الفحص رقم ${insp.request_no}`,
      });
    } else {
      await supabase.rpc('rpc_site_task_transition', {
        p_task_id: insp.task_id,
        p_to_state: 'rejected',
        p_reason: reason || `رفض الفحص رقم ${insp.request_no}`,
      });
    }
  }

  /* ── 5. Immutable Task Events (Audit Log) ──────────────────── */
  static async listEventsForTask(taskId: string): Promise<TaskEvent[]> {
    const { data, error } = await supabase
      .from('pm_task_events')
      .select('*, stakeholders(name_ar)')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('TaskOntologyService.listEventsForTask error:', error);
      return [];
    }
    return (data || []).map((r) => ({
      id: r.id,
      task_id: r.task_id,
      project_id: r.project_id,
      event_type: r.event_type,
      actor_user_id: r.actor_user_id,
      actor_stakeholder_id: r.actor_stakeholder_id,
      from_state: r.from_state,
      to_state: r.to_state,
      reason: r.reason,
      payload: r.payload || {},
      created_at: r.created_at,
      actor_name_ar: r.stakeholders?.name_ar,
    }));
  }

  /* ── 6. Task Constraints (Blockers / Obstructions) ─────────── */
  static async listConstraints(projectId: string, taskId?: string): Promise<TaskConstraint[]> {
    let q = supabase
      .from('pm_task_constraints')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (taskId) q = q.eq('task_id', taskId);

    const { data, error } = await q;
    if (error) {
      console.error('TaskOntologyService.listConstraints error:', error);
      return [];
    }
    return (data || []) as TaskConstraint[];
  }

  static async logConstraint(
    constraint: Omit<TaskConstraint, 'id' | 'created_at' | 'updated_at' | 'resolved_at' | 'resolved_by'>
  ): Promise<TaskConstraint> {
    const { data, error } = await supabase
      .from('pm_task_constraints')
      .insert(constraint)
      .select('*')
      .single();
    if (error) throw error;

    await supabase.from('pm_task_events').insert({
      task_id: constraint.task_id,
      project_id: constraint.project_id,
      event_type: 'constraint_logged',
      reason: constraint.title,
      payload: { type: constraint.type, description: constraint.description },
    });

    return data as TaskConstraint;
  }

  static async resolveConstraint(constraintId: string, resolutionNote?: string): Promise<void> {
    const { data: c, error: fetchErr } = await supabase
      .from('pm_task_constraints')
      .select('*')
      .eq('id', constraintId)
      .single();
    if (fetchErr || !c) throw new Error('Constraint not found');

    const { error } = await supabase
      .from('pm_task_constraints')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        description: resolutionNote ? `${c.description || ''} [حل: ${resolutionNote}]` : c.description,
        updated_at: new Date().toISOString(),
      })
      .eq('id', constraintId);
    if (error) throw error;

    await supabase.from('pm_task_events').insert({
      task_id: c.task_id,
      project_id: c.project_id,
      event_type: 'constraint_resolved',
      reason: resolutionNote || 'تم حل العائق',
      payload: { constraint_id: constraintId, type: c.type },
    });
  }
}
