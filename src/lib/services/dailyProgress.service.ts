import { supabase } from '@/lib/supabase';
import { getSignedStorageUrls, toCanonicalStorageValue } from '@/lib/supabase/storage';
import { appCache, CACHE_KEYS, TTL } from '@/lib/cache';
import {
  DailyProgress,
  DailyProgressLine,
  DailyDiscipline,
  DailyProgressPhoto,
  DailyObstruction,
  ApprovalDelegation,
} from '@/types/planning';
import { logger } from '@/lib/logger';
import { NotificationService } from '@/lib/services/notification.service';
import { CostControlService } from '@/lib/services/costControl.service';

/**
 * Row shape for the mandatory site-task dropdown in DailyProgressForm.
 * Mirrors pm_site_tasks columns plus the joined zone label (pm_zones.name_ar).
 */
export interface OpenSiteTaskOption {
  id: string;
  title_ar: string;
  task_type: string | null;
  status: string;
  priority: string | null;
  planned_date: string | null;
  due_date: string | null;
  progress_pct: number | null;
  zone: { name_ar: string | null } | null;
}

/**
 * Result shape returned by rpc_daily_report_transition.
 */
export interface RpcTransitionResult {
  success: boolean;
  error?: string;
  message?: string;
}

/**
 * Minimal row shape for ID-only report queries.
 */
interface ReportIdRow {
  id: string;
}

/**
 * Minimal row shape for site-task lookup on daily reports.
 */
interface ReportSiteTaskRow {
  site_task_id: string | null;
}

/**
 * BOQ item rate & contract qty shape for progress weighting.
 */
interface BoqItemSummary {
  contract_qty?: number | null;
  rate_egp?: number | null;
  revision?: number | null;
}

/**
 * Progress line row with joined BOQ item.
 */
interface ProgressLineWithBoq {
  boq_item_id: string | null;
  qty_today: number | null;
  line_status?: string | null;
  boq_item: BoqItemSummary | BoqItemSummary[] | null;
}

/**
 * Progress line row for cumulative quantity aggregation.
 */
interface CumulativeQtyLine {
  boq_item_id: string | null;
  qty_today: number | null;
  line_status?: string | null;
}

/**
 * S-Curve timeline line and report interfaces.
 */
interface TimelineReportLine {
  qty_today: number | null;
  boq_item: BoqItemSummary | BoqItemSummary[] | null;
}

interface TimelineReport {
  progress_date: string;
  verification_status: string | null;
  lines?: TimelineReportLine[] | null;
}


/**
 * Exact payload builder for rpc_create_report — the ONLY working signature
 * (10 scalar args, in order):
 *   (p_project_id, p_progress_date, p_discipline, p_weather, p_manpower_count,
 *    p_equipment_summary, p_entered_by_name, p_idempotency_key, p_notes,
 *    p_site_task_id)
 * Exported so tests can assert the wire format byte-for-byte.
 */
export function buildCreateReportPayload(
  report: Partial<DailyProgress>,
  siteTaskId: string
): Record<string, unknown> {
  return {
    p_project_id: report.project_id,
    p_progress_date: report.progress_date || new Date().toISOString().slice(0, 10),
    p_discipline: report.discipline || 'civil',
    p_weather: report.weather || null,
    p_manpower_count: Number(report.manpower_count ?? 0),
    p_equipment_summary: report.equipment_summary || null,
    p_entered_by_name: report.entered_by_name || null,
    p_idempotency_key: report.idempotency_key || null,
    p_notes: report.notes || null,
    p_site_task_id: siteTaskId,
  };
}

export class DailyProgressService {
  /**
   * Fetch daily progress reports for a project with optional filters.
   */
  static async getDailyReports(
    projectId: string,
    filterStr = ''
  ): Promise<DailyProgress[]> {
    const key = CACHE_KEYS.dailyProgress.list(projectId, filterStr);
    const reports = await appCache.getOrFetch(key, TTL.dailyProgress, async () => {
      try {
        const { data, error } = await supabase
          .from('pm_daily_progress')
          .select(`
            *,
            lines:pm_daily_progress_lines(
              *,
              boq_item:pm_boq_items(id, item_code, description_ar, unit, rate_egp)
            ),
            photos:pm_daily_progress_photos(*),
            obstructions:pm_daily_obstructions(*)
          `)
          .eq('project_id', projectId)
          .order('progress_date', { ascending: false })
          .order('report_no', { ascending: false });

        if (error) {
          logger.warn('DailyProgressService.getDailyReports error:', { detail: error });
          return [];
        }
        return data || [];
      } catch (err) {
        logger.warn('DailyProgressService.getDailyReports exception:', { detail: err });
        return [];
      }
    });
    return DailyProgressService.signReportsMedia(reports);
  }

  /**
   * Fetch single daily progress report with lines, photos, and obstructions.
   */
  static async getDailyReportById(id: string): Promise<DailyProgress | null> {
    const key = CACHE_KEYS.dailyProgress.detail(id);
    const report = await appCache.getOrFetch(key, TTL.dailyProgress, async () => {
      try {
        const { data, error } = await supabase
          .from('pm_daily_progress')
          .select(`
            *,
            lines:pm_daily_progress_lines(
              *,
              boq_item:pm_boq_items(id, item_code, description_ar, unit, rate_egp, revision),
              allocations:pm_progress_allocations(*)
            ),
            photos:pm_daily_progress_photos(*),
            obstructions:pm_daily_obstructions(*)
          `)
          .eq('id', id)
          .single();

        if (error) {
          logger.warn('DailyProgressService.getDailyReportById error:', { detail: error });
          return null;
        }
        return data;
      } catch (err) {
        logger.warn('DailyProgressService.getDailyReportById exception:', { detail: err });
        return null;
      }
    });
    return DailyProgressService.signReportMedia(report);
  }

  /**
   * Fetch the selected project's OPEN site tasks for the mandatory daily-report
   * dropdown. "Open" mirrors rpc_create_report exactly (verified against
   * pg_proc): status NOT IN ('done','cancelled'). Rejected tasks stay listed —
   * they await rework and the RPC still accepts reports on them; done /
   * cancelled raise SITE_TASK_CLOSED server-side.
   */
  static async getOpenSiteTasks(projectId: string): Promise<OpenSiteTaskOption[]> {
    if (!projectId) return [];
    try {
      const { data, error } = await supabase
        .from('pm_site_tasks')
        .select(
          'id, title_ar, task_type, status, priority, planned_date, due_date, progress_pct, zone:pm_zones(name_ar)'
        )
        .eq('project_id', projectId)
        .not('status', 'in', '(done,cancelled)')
        .order('planned_date', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) {
        logger.warn('DailyProgressService.getOpenSiteTasks error:', { detail: error });
        return [];
      }
      // PostgREST may return the referenced zone as a single-object OR an
      // array depending on relationship detection — normalize to object.
      const rows = (data || []) as Array<
        Omit<OpenSiteTaskOption, 'zone'> & {
          zone: { name_ar: string | null } | Array<{ name_ar: string | null }> | null;
        }
      >;
      return rows.map((r) => ({
        ...r,
        zone: Array.isArray(r.zone) ? r.zone[0] ?? null : r.zone,
      }));
    } catch (err) {
      logger.warn('DailyProgressService.getOpenSiteTasks exception:', { detail: err });
      return [];
    }
  }

  /**
   * Create a new daily progress report (idempotent).
   *
   * OWNER RULE (ب): every daily report MUST reference an OPEN site task.
   * The ONLY write path is the DB RPC `rpc_create_report` with EXACTLY 10
   * scalar args (one working signature — an older 9-arg overload was dropped
   * due to PG error 42725; never reintroduce overloads or JSON-blob shapes).
   * The RPC rejects reports without p_site_task_id (SITE_TASK_REQUIRED) and
   * reports pointing at a closed task (SITE_TASK_CLOSED), and auto-promotes
   * the task pending → in_progress on first report.
   *
   * NOTE: there is deliberately NO direct-table-insert fallback — a fallback
   * would silently bypass rule (ب). Rule violations are THROWN so the UI can
   * display them verbatim (the messages already carry Arabic text).
   */
  static async createDailyReport(
    report: Partial<DailyProgress>,
    lines?: Partial<DailyProgressLine>[]
  ): Promise<DailyProgress | null> {
    try {
      // Mock-server-side validation for over-execution
      if (lines && lines.length > 0 && !report.vo_requested) {
        const hasOverExecution = lines.some(l => l.is_claimable_vo);
        if (hasOverExecution) {
          throw new Error('OVER_EXECUTION_REJECTED: لا يمكن تجاوز الكمية التعاقدية بدون طلب أمر تغييري (vo_requested: true).');
        }
      }

      // 1. Client-side idempotent replay (mirrors RPC step 1)
      if (report.idempotency_key) {
        const { data: existing } = await supabase
          .from('pm_daily_progress')
          .select('id')
          .eq('idempotency_key', report.idempotency_key)
          .maybeSingle();

        if (existing) {
          return DailyProgressService.getDailyReportById(existing.id);
        }
      }

      // 2. Owner rule (ب) client-side guard — mirrors rpc_create_report
      const siteTaskId = (report.site_task_id || '').trim();
      if (!siteTaskId) {
        throw new Error(
          'SITE_TASK_REQUIRED: لا يمكن حفظ التقرير اليومي بدون ربطه بمهمة موقع مفتوحة'
        );
      }

      // 3. THE write path: rpc_create_report, exactly 10 scalar args
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'rpc_create_report',
        buildCreateReportPayload(report, siteTaskId)
      );

      if (rpcError || !rpcData?.id) {
        // Surface DB rule violations verbatim (SITE_TASK_* carry Arabic text)
        logger.error('rpc_create_report failed:', { detail: rpcError });
        const rawErr = (rpcError as { message?: string } | null)?.message || '';
        if (
          rawErr.includes('pm_daily_progress_project_id_progress_date_discipline_key') ||
          rawErr.includes('23505') ||
          rawErr.includes('duplicate key')
        ) {
          throw new Error(
            'DUPLICATE_REPORT: يوجد تقرير مسجل بالفعل لهذا المشروع في هذا التاريخ ونفس التخصص. لا يمكن تسجيل أكثر من تقرير لنفس التخصص في اليوم الواحد. يمكنك مراجعة أو تعديل التقرير المسجل من سجل اليوميات.'
          );
        }
        throw new Error(
          rawErr ||
            'لم يُرجع إنشاء التقرير اليومي معرّفاً صالحاً من قاعدة البيانات'
        );
      }

      if (report.equipment_count !== undefined || report.obstruction_type !== undefined || report.vo_requested !== undefined) {
         await supabase.from('pm_daily_progress').update({
             equipment_count: report.equipment_count,
             obstruction_type: report.obstruction_type,
             vo_requested: report.vo_requested
         }).eq('id', rpcData.id);
      }

      // 4. Attach BOQ lines to the RPC-created report (the RPC writes the
      //    header only; lines ride along afterwards keyed to its id)
      if (lines && lines.length > 0) {
        const linePayloads = lines.map((l) => ({
          daily_progress_id: rpcData.id,
          boq_item_id: l.boq_item_id,
          qty_today: Number(l.qty_today ?? 0),
          zone: l.zone || null,
          remarks: l.remarks || null,
          is_material_on_site: Boolean(l.is_material_on_site),
          line_status: l.line_status || 'pending',
          is_claimable_vo: Boolean(l.is_claimable_vo),
          wir_no: l.wir_no || null,
          inspection_status: l.inspection_status || 'not_required',
          supplied_qty: l.supplied_qty !== undefined ? Number(l.supplied_qty) : null,
          ref_deliverable_item_id: l.ref_deliverable_item_id || null,
          subcontractor_id: l.subcontractor_id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        const { error: linesErr } = await supabase
          .from('pm_daily_progress_lines')
          .insert(linePayloads);
        if (linesErr) throw linesErr;
      }

      if (report.project_id) {
        appCache.invalidate(`dailyReports:${report.project_id}`);
      }

      // Instant notification to planning engineer / project manager when report is submitted
      if (report.status === 'submitted' && rpcData?.id && report.project_id) {
        try {
          const { data: projData } = await supabase
            .from('pm_projects')
            .select('manager_id')
            .eq('id', report.project_id)
            .single();

          const recipient = projData?.manager_id || report.entered_by || '';

          await NotificationService.createNotification({
            project_id: report.project_id,
            event_type: 'progress_submitted',
            entity_type: 'daily_progress',
            entity_id: rpcData.id,
            title_ar: `📋 تقرير إنجاز يومي بانتظار المراجعة (يومية #${rpcData?.report_no || ''})`,
            title_en: `Daily Progress Report #${rpcData?.report_no || ''} Submitted`,
            body_ar: `قام مهندس الموقع (${report.entered_by_name || 'مهندس الموقع'}) بتقديم تقرير الإنجاز لتاريخ ${report.progress_date || ''} للاعتماد`,
            link_url: '/planning/daily-progress',
            recipient_user_id: recipient,
          });
        } catch (notifErr) {
          logger.warn('Failed to dispatch create/submit notification (non-fatal)', { detail: notifErr });
        }
      }

      // ADR-0006: Auto-generate VO draft if submitted with VO request or over-execution
      if (report.project_id && rpcData?.id && (report.vo_requested || lines?.some(l => l.is_claimable_vo))) {
        DailyProgressService.createVariationOrderDraftFromProgress(
          report.project_id,
          rpcData.id,
          rpcData.report_no || '',
          report.entered_by
        ).catch((voErr) => {
          logger.warn('Failed auto VO draft in createDailyReport', { detail: voErr });
        });
      }

      try {
        const fullReport = await DailyProgressService.getDailyReportById(rpcData.id);
        if (fullReport) return fullReport;
      } catch (fetchErr) {
        logger.warn('Failed to fetch full report details after RPC creation, falling back to RPC data', { detail: fetchErr });
      }
      return rpcData as unknown as DailyProgress;
    } catch (err) {
      logger.error('DailyProgressService.createDailyReport error:', { detail: err });
      const rawErr = err instanceof Error ? err.message : String(err);
      if (
        rawErr.includes('pm_daily_progress_project_id_progress_date_discipline_key') ||
        rawErr.includes('23505') ||
        rawErr.includes('duplicate key')
      ) {
        throw new Error(
          'DUPLICATE_REPORT: يوجد تقرير مسجل بالفعل لهذا المشروع في هذا التاريخ ونفس التخصص. لا يمكن تسجيل أكثر من تقرير لنفس التخصص في اليوم الواحد. يمكنك مراجعة أو تعديل التقرير المسجل من سجل اليوميات.'
        );
      }
      // Rethrow: callers (and the UI) must see rule violations — never a silent null
      throw err instanceof Error ? err : new Error(String(err));
    }
  }

  /**
   * Reopen daily report, updating status to 'reopened' and suspending associated allocations.
   */
  static async reopenDailyReport(
    id: string,
    reason: string,
    reopenedBy?: string
  ): Promise<boolean> {
    try {
      const { data: report } = await supabase
        .from('pm_daily_progress')
        .select('id, project_id')
        .eq('id', id)
        .single();

      const { data, error } = await supabase.rpc('rpc_daily_report_transition', {
        p_report_id: id,
        p_action: 'reopen',
        p_reason: reason.trim(),
      });

      const res = data as RpcTransitionResult | null;
      if (error || res?.success === false) {
        throw error || new Error(res?.error || 'فشل إعادة فتح التقرير');
      }

      if (report?.project_id) {
        appCache.invalidate(`dailyReports:${report.project_id}`);
        appCache.invalidate(`planningKpis:${report.project_id}`);
        appCache.invalidate(`scurve:${report.project_id}`);
        appCache.invalidate(`activities:progress:${report.project_id}`);
      }
      appCache.invalidate(`dailyReport:detail:${id}`);

      return true;
    } catch (err) {
      logger.error('DailyProgressService.reopenDailyReport error:', { detail: err });
      return false;
    }
  }

  /**
   * Batch approve lines and freeze snapshot rates from BOQ items.
   */
  static async batchApproveLines(
    reportId: string,
    lineIds: string[],
    reviewerId: string
  ): Promise<boolean> {
    try {
      if (!lineIds || lineIds.length === 0) return true;

      const { data: lines } = await supabase
        .from('pm_daily_progress_lines')
        .select(`
          id,
          boq_item_id,
          snapshot_rate_egp,
          source_boq_revision,
          boq_item:pm_boq_items(rate_egp, revision)
        `)
        .in('id', lineIds);

      if (lines) {
        for (const line of lines) {
          const boqItem = (Array.isArray(line.boq_item) ? line.boq_item[0] : line.boq_item) as BoqItemSummary | null;
          const rate = line.snapshot_rate_egp ?? boqItem?.rate_egp ?? 0;
          const rev = line.source_boq_revision ?? boqItem?.revision ?? 1;

          await supabase
            .from('pm_daily_progress_lines')
            .update({
              line_status: 'approved',
              snapshot_rate_egp: rate,
              source_boq_revision: rev,
              line_reviewed_by: reviewerId,
              line_reviewed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', line.id);
        }
      }

      appCache.invalidate(`dailyReport:detail:${reportId}`);
      appCache.invalidate('planningKpis:');
      return true;
    } catch (err) {
      logger.error('DailyProgressService.batchApproveLines error:', { detail: err });
      return false;
    }
  }

  /**
   * Batch reject lines with reason.
   */
  static async batchRejectLines(
    reportId: string,
    lineIds: string[],
    reason: string,
    reviewerId: string
  ): Promise<boolean> {
    try {
      if (!lineIds || lineIds.length === 0) return true;

      const { error } = await supabase
        .from('pm_daily_progress_lines')
        .update({
          line_status: 'rejected',
          rejection_reason: reason,
          line_reviewed_by: reviewerId,
          line_reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .in('id', lineIds);

      if (error) throw error;

      appCache.invalidate(`dailyReport:detail:${reportId}`);
      return true;
    } catch (err) {
      logger.error('DailyProgressService.batchRejectLines error:', { detail: err });
      return false;
    }
  }

  /**
   * Update report header.
   */
  static async updateDailyReport(
    id: string,
    report: Partial<DailyProgress>
  ): Promise<DailyProgress | null> {
    try {
      const payload = {
        weather: report.weather,
        manpower_count: report.manpower_count,
        equipment_count: report.equipment_count,
        equipment_summary: report.equipment_summary,
        obstruction_type: report.obstruction_type,
        vo_requested: report.vo_requested,
        notes: report.notes,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('pm_daily_progress')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      appCache.invalidate(`dailyReport:detail:${id}`);
      if (data?.project_id) {
        appCache.invalidate(`dailyReports:${data.project_id}`);
      }
      return data;
    } catch (err) {
      logger.error('DailyProgressService.updateDailyReport error:', { detail: err });
      return null;
    }
  }

  /**
   * Check if a report already exists for a project, date, and discipline.
   */
  static async checkExistingReport(
    projectId: string,
    progressDate: string,
    discipline: string,
    siteTaskId?: string
  ): Promise<DailyProgress | null> {
    if (!projectId || !progressDate || !discipline) return null;
    try {
      let query = supabase
        .from('pm_daily_progress')
        .select(`
          *,
          lines:pm_daily_progress_lines(
            *,
            boq_item:pm_boq_items(id, item_code, description_ar, unit, rate_egp)
          ),
          photos:pm_daily_progress_photos(*),
          obstructions:pm_daily_obstructions(*)
        `)
        .eq('project_id', projectId)
        .eq('progress_date', progressDate)
        .eq('discipline', discipline);

      if (siteTaskId) {
        query = query.eq('site_task_id', siteTaskId);
      }

      const { data, error } = await query.limit(1).maybeSingle();

      if (error || !data) return null;
      return DailyProgressService.signReportMedia(data as unknown as DailyProgress);
    } catch (err) {
      logger.warn('DailyProgressService.checkExistingReport exception:', { detail: err });
      return null;
    }
  }

  /**
   * Get cumulative quantities executed per BOQ item for a given site task.
   * Sums qty_today across all reports (excluding cancelled and rejected) and non-rejected lines linked to the task.
   * Returns a map: { [boq_item_id]: totalQtyExecuted }
   */
  static async getCumulativeQtyByTask(
    siteTaskId: string
  ): Promise<Record<string, number>> {
    if (!siteTaskId) return {};
    try {
      // Get all reports linked to this task
      const { data: reports, error: repErr } = await supabase
        .from('pm_daily_progress')
        .select('id')
        .eq('site_task_id', siteTaskId)
        .not('status', 'in', '("cancelled","rejected")');

      if (repErr || !reports?.length) return {};

      const reportIds = (reports as ReportIdRow[]).map((r) => r.id);

      // Get all non-rejected lines from those reports
      const { data: lines, error: lineErr } = await supabase
        .from('pm_daily_progress_lines')
        .select('boq_item_id, qty_today')
        .in('daily_progress_id', reportIds)
        .neq('line_status', 'rejected');

      if (lineErr || !lines?.length) return {};

      // Aggregate by boq_item_id
      const result: Record<string, number> = {};
      for (const line of (lines as CumulativeQtyLine[])) {
        const qty = Number(line.qty_today) || 0;
        if (qty > 0 && line.boq_item_id) {
          result[line.boq_item_id] = (result[line.boq_item_id] || 0) + qty;
        }
      }
      return result;
    } catch (err) {
      logger.warn('DailyProgressService.getCumulativeQtyByTask exception:', { detail: err });
      return {};
    }
  }

  /**
   * Find an existing draft report for a given task on today's date.
   * Used to auto-load the draft for editing instead of creating a new report.
   */
  static async getExistingDraftForTaskToday(
    projectId: string,
    siteTaskId: string
  ): Promise<DailyProgress | null> {
    if (!projectId || !siteTaskId) return null;
    const today = new Date().toISOString().slice(0, 10);
    try {
      const { data, error } = await supabase
        .from('pm_daily_progress')
        .select(`
          *,
          lines:pm_daily_progress_lines(
            *,
            boq_item:pm_boq_items(id, item_code, description_ar, unit, rate_egp)
          ),
          photos:pm_daily_progress_photos(*),
          obstructions:pm_daily_obstructions(*)
        `)
        .eq('project_id', projectId)
        .eq('site_task_id', siteTaskId)
        .eq('progress_date', today)
        .eq('status', 'draft')
        .maybeSingle();

      if (error || !data) return null;
      return DailyProgressService.signReportMedia(data as unknown as DailyProgress);
    } catch (err) {
      logger.warn('DailyProgressService.getExistingDraftForTaskToday exception:', { detail: err });
      return null;
    }
  }

  /**
   * Save changes to an existing daily progress report (draft) and replace its lines.
   */
  static async saveExistingDailyReport(
    reportId: string,
    report: Partial<DailyProgress>,
    lines?: Partial<DailyProgressLine>[]
  ): Promise<DailyProgress | null> {
    try {
      // Mock-server-side validation for over-execution
      if (lines && lines.length > 0 && !report.vo_requested) {
        const hasOverExecution = lines.some(l => l.is_claimable_vo);
        if (hasOverExecution) {
          throw new Error('OVER_EXECUTION_REJECTED: لا يمكن تجاوز الكمية التعاقدية بدون طلب أمر تغييري (vo_requested: true).');
        }
      }

      const payload: Record<string, unknown> = {
        weather: report.weather || null,
        manpower_count: Number(report.manpower_count ?? 0),
        equipment_count: Number(report.equipment_count ?? 0),
        equipment_summary: report.equipment_summary || null,
        obstruction_type: report.obstruction_type || null,
        vo_requested: report.vo_requested || false,
        notes: report.notes || null,
        updated_at: new Date().toISOString(),
      };
      if (report.status) {
        payload.status = report.status;
      }
      if (report.site_task_id) {
        payload.site_task_id = report.site_task_id;
      }
      if (report.entered_by_name) {
        payload.entered_by_name = report.entered_by_name;
      }

      const { data: updatedReport, error: updateErr } = await supabase
        .from('pm_daily_progress')
        .update(payload)
        .eq('id', reportId)
        .select()
        .single();

      if (updateErr) throw updateErr;

      // Replace lines if provided
      if (lines !== undefined) {
        const { error: delErr } = await supabase
          .from('pm_daily_progress_lines')
          .delete()
          .eq('daily_progress_id', reportId);
        if (delErr) throw delErr;

        if (lines.length > 0) {
          const linePayloads = lines.map((l) => ({
            daily_progress_id: reportId,
            boq_item_id: l.boq_item_id,
            qty_today: Number(l.qty_today ?? 0),
            zone: l.zone || null,
            remarks: l.remarks || null,
            is_material_on_site: Boolean(l.is_material_on_site),
            is_claimable_vo: Boolean(l.is_claimable_vo),
            wir_no: l.wir_no || null,
            inspection_status: l.inspection_status || 'not_required',
            supplied_qty: l.supplied_qty !== undefined ? Number(l.supplied_qty) : null,
            ref_deliverable_item_id: l.ref_deliverable_item_id || null,
            subcontractor_id: l.subcontractor_id || null,
            line_status: l.line_status || ('pending' as const),
          }));

          const { error: insertErr } = await supabase
            .from('pm_daily_progress_lines')
            .insert(linePayloads);
          if (insertErr) throw insertErr;
        }
      }

      if (updatedReport?.project_id) {
        appCache.invalidate(`dailyReports:${updatedReport.project_id}`);
      }
      appCache.invalidate(`dailyReport:detail:${reportId}`);

      return updatedReport;
    } catch (err: unknown) {
      const pgErr = err as { code?: string; message?: string } | null;
      if (pgErr?.code === '23505' || (pgErr?.message && pgErr.message.includes('pm_daily_progress_project_id_progress_date_discipline_key'))) {
        throw new Error('يوجد تقرير مسجل بالفعل لهذا المشروع في هذا التاريخ ونفس التخصص. يمكنك استكمال وتعديل المسودة المسجلة.');
      }
      logger.error('DailyProgressService.saveExistingDailyReport error:', { detail: err });
      throw err instanceof Error ? err : new Error(String(err));
    }
  }

  /**
   * Delete draft daily progress report.
   */
  static async deleteDraftReport(id: string, projectId?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('pm_daily_progress')
        .delete()
        .eq('id', id)
        .eq('status', 'draft');

      if (error) throw error;

      if (projectId) {
        appCache.invalidate(`dailyReports:${projectId}`);
      }
      appCache.invalidate(`dailyReport:detail:${id}`);
      return true;
    } catch (err) {
      logger.error('DailyProgressService.deleteDraftReport error:', { detail: err });
      return false;
    }
  }

  /**
   * Submit daily report for review and dispatch instant notification.
   */
  static async submitDailyReport(
    id: string,
    projectId: string,
    submittedBy?: string
  ): Promise<boolean> {
    try {
      const { data: repData } = await supabase
        .from('pm_daily_progress')
        .select('report_no, progress_date, entered_by, entered_by_name, site_task_id')
        .eq('id', id)
        .single();

      const { data, error } = await supabase.rpc('rpc_daily_report_transition', {
        p_report_id: id,
        p_action: 'submit',
      });

      const res = data as RpcTransitionResult | null;
      if (error || res?.success === false) {
        throw error || new Error(res?.error || 'فشل تقديم التقرير اليومي');
      }

      // ADR-0006: Auto-generate VO draft if VO requested or line flagged as claimable
      try {
        const { data: repFull } = await supabase
          .from('pm_daily_progress')
          .select('vo_requested, lines:pm_daily_progress_lines(is_claimable_vo)')
          .eq('id', id)
          .single();

        const hasOver = Boolean(
          repFull?.vo_requested ||
          (repFull?.lines && (repFull.lines as Array<{ is_claimable_vo?: boolean }>).some((l) => l?.is_claimable_vo))
        );

        if (hasOver) {
          await DailyProgressService.createVariationOrderDraftFromProgress(
            projectId,
            id,
            repData?.report_no || '',
            submittedBy || repData?.entered_by
          );
        }
      } catch (voErr) {
        logger.warn('Failed to check or create auto VO draft in submitDailyReport (non-fatal)', { detail: voErr });
      }

      // Smart notification to planning engineer / project manager
      try {
        const { data: projData } = await supabase
          .from('pm_projects')
          .select('project_manager_id, manager_id')
          .eq('id', projectId)
          .single();

        const recipient = (projData as { manager_id?: string } | null)?.manager_id || projData?.project_manager_id || submittedBy || repData?.entered_by || '';

        if (recipient && recipient !== '00000000-0000-0000-0000-000000000099') {
          await NotificationService.createNotification({
            project_id: projectId,
            event_type: 'progress_submitted',
            entity_type: 'daily_progress',
            entity_id: id,
            title_ar: `📋 تقرير إنجاز يومي بانتظار المراجعة (يومية #${repData?.report_no || ''})`,
            title_en: `Daily Progress Report #${repData?.report_no || ''} Submitted`,
            body_ar: `قام مهندس الموقع (${repData?.entered_by_name || 'مهندس الموقع'}) بتقديم تقرير الإنجاز لتاريخ ${repData?.progress_date || ''} للاعتماد`,
            link_url: '/planning/daily-progress',
            recipient_user_id: recipient,
          });
        }
      } catch (notifErr) {
        logger.warn('Failed to dispatch submit notification (non-fatal)', { detail: notifErr });
      }

      appCache.invalidate(`dailyReports:${projectId}`);
      appCache.invalidate(`dailyReport:detail:${id}`);
      return true;
    } catch (err) {
      logger.error('DailyProgressService.submitDailyReport error:', { detail: err });
      return false;
    }
  }

  /**
   * ADR-0006: Auto-generate draft Variation Order when site engineer requests VO or flags over-execution.
   */
  static async createVariationOrderDraftFromProgress(
    projectId: string,
    reportId: string,
    reportNo?: string | number,
    userId?: string
  ): Promise<boolean> {
    try {
      if (!projectId || !reportId) return false;

      // 1. Check idempotency: avoid creating duplicate VO for the same daily report
      const refTag = `daily_progress:${reportId}`;
      const { data: existingVo } = await supabase
        .from('pm_change_orders')
        .select('id')
        .eq('project_id', projectId)
        .ilike('title_ar', `%${refTag}%`)
        .maybeSingle();

      if (existingVo) {
        return true;
      }

      const repLabel = reportNo ? `#${reportNo}` : '';
      const voNumber = `VO-${Date.now().toString().slice(-6)}`;

      // 2. Persist to canonical pm_change_orders
      const { data: newVo, error: voError } = await supabase
        .from('pm_change_orders')
        .insert({
          project_id: projectId,
          vo_number: voNumber,
          title_ar: `أمر تغيير ناتج عن كميات إضافية ميدانية (${repLabel}) ref:${refTag}`,
          amount_egp: 0,
          time_extension_days: 0,
          status: 'draft',
          approval_status: 'pending',
        })
        .select()
        .single();

      if (voError) {
        // Fallback to project metadata variation_orders
        const { data: proj } = await supabase
          .from('pm_projects')
          .select('metadata')
          .eq('id', projectId)
          .maybeSingle();
        const meta = proj?.metadata || {};
        const metaVos = Array.isArray(meta.variation_orders) ? [...meta.variation_orders] : [];
        if (!metaVos.some((v: any) => v.id === `vo_${reportId}`)) {
          metaVos.push({
            id: `vo_${reportId}`,
            vo_number: voNumber,
            title_ar: `أمر تغيير ناتج عن كميات إضافية ميدانية (${repLabel}) ref:${refTag}`,
            amount: 0,
            type: 'addition',
            status: 'draft',
            created_at: new Date().toISOString(),
          });
          await supabase.from('pm_projects').update({
            metadata: { ...meta, variation_orders: metaVos }
          }).eq('id', projectId);
        }
      }

      // Notify Commercial Manager & Planning Manager
      try {
        await NotificationService.createNotification({
          project_id: projectId,
          event_type: 'vo_draft_created',
          entity_type: 'daily_progress',
          entity_id: newVo?.id || reportId,
          title_ar: `📝 مسودة أمر تغيير جديدة (${voNumber}) بانتظار التقييم`,
          title_en: `New Variation Order Draft (${voNumber}) Created`,
          body_ar: `قام مهندس الموقع بتسجيل كميات إضافية في اليومية ${repLabel}، وتم فتح مسودة أمر تغيير لمراجعة التعويض المالي والتمديد الزمني.`,
          link_url: '/contracts/claims?tab=vos',
          recipient_user_id: userId || 'commercial_manager',
        });
      } catch (notifErr) {
        logger.warn('Failed to dispatch VO notification', { detail: notifErr });
      }

      appCache.invalidate(`vo_${projectId}`);
      return true;
    } catch (err) {
      logger.warn('DailyProgressService.createVariationOrderDraftFromProgress exception', { detail: err });
      return false;
    }
  }

  /**
   * Approve daily report and freeze snapshot rates on all lines.
   */
  static async approveDailyReport(
    id: string,
    projectId: string,
    approvedBy?: string
  ): Promise<boolean> {
    try {
      // Get report details before approving
      const { data: repData } = await supabase
        .from('pm_daily_progress')
        .select('site_task_id, entered_by, report_no, progress_date')
        .eq('id', id)
        .single();

      const { data, error } = await supabase.rpc('rpc_daily_report_transition', {
        p_report_id: id,
        p_action: 'approve',
      });

      const res = data as RpcTransitionResult | null;
      if (error || res?.success === false) {
        throw error || new Error(res?.error || 'فشل اعتماد التقرير اليومي');
      }

      const siteTaskId = (repData as ReportSiteTaskRow | null)?.site_task_id;
      if (siteTaskId) {
        await DailyProgressService.calculateTaskProgress(siteTaskId);
      }
      await DailyProgressService.calculateProjectProgress(projectId);

      // ADR-0010: Trigger non-blocking EVM recalculation snapshot
      CostControlService.recalculateAndSaveSnapshot(projectId).catch((evmErr) => {
        logger.warn('Auto EVM snapshot background error on report approval:', { detail: evmErr });
      });

      // Instant notification to Site Engineer
      if (repData?.entered_by) {
        try {
          await NotificationService.createNotification({
            project_id: projectId,
            event_type: 'progress_approved',
            entity_type: 'daily_progress',
            entity_id: id,
            title_ar: `✅ تم اعتماد التقرير اليومي #${repData.report_no || ''}`,
            title_en: `Daily Report #${repData.report_no || ''} Approved`,
            body_ar: `تم اعتماد تقرير الإنجاز لتاريخ ${repData.progress_date || ''} وتحديث منحنى الـ S-Curve بنجاح`,
            link_url: '/site-workspace',
            recipient_user_id: repData.entered_by,
          });
        } catch (notifErr) {
          logger.warn('Failed to dispatch approval notification (non-fatal)', { detail: notifErr });
        }
      }

      appCache.invalidate(`dailyReports:${projectId}`);
      appCache.invalidate(`dailyReport:detail:${id}`);
      appCache.invalidate(`planningKpis:${projectId}`);
      appCache.invalidate(`scurve:${projectId}`);
      return true;
    } catch (err) {
      logger.error('DailyProgressService.approveDailyReport error:', { detail: err });
      return false;
    }
  }

  /**
   * PM Soft Review (Optional step).
   */
  static async pmSoftReview(
    id: string,
    userId: string,
    projectId: string,
    skipped = false
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('pm_daily_progress')
        .update({
          pm_reviewed_by: userId,
          pm_reviewed_at: new Date().toISOString(),
          pm_skipped: skipped,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      appCache.invalidate(`dailyReports:${projectId}`);
      appCache.invalidate(`dailyReport:detail:${id}`);
      return true;
    } catch (err) {
      logger.error('DailyProgressService.pmSoftReview error:', { detail: err });
      return false;
    }
  }

  /**
   * Reject Daily Report with reason and dispatch instant notification.
   */
  static async rejectDailyReport(
    id: string,
    userId: string,
    projectId: string,
    reason: string
  ): Promise<boolean> {
    try {
      // Get report details before rejecting
      const { data: repData } = await supabase
        .from('pm_daily_progress')
        .select('site_task_id, entered_by, report_no, progress_date')
        .eq('id', id)
        .single();

      const { data, error } = await supabase.rpc('rpc_daily_report_transition', {
        p_report_id: id,
        p_action: 'reject',
        p_reason: reason.trim(),
      });

      const res = data as RpcTransitionResult | null;
      if (error || res?.success === false) {
        throw error || new Error(res?.error || 'فشل رفض التقرير اليومي');
      }

      const siteTaskId = (repData as ReportSiteTaskRow | null)?.site_task_id;
      if (siteTaskId) {
        await DailyProgressService.calculateTaskProgress(siteTaskId);
      }
      await DailyProgressService.calculateProjectProgress(projectId);

      // Instant notification with rejection reason to Site Engineer
      if (repData?.entered_by) {
        try {
          await NotificationService.createNotification({
            project_id: projectId,
            event_type: 'progress_rejected',
            entity_type: 'daily_progress',
            entity_id: id,
            title_ar: `⚠️ تم رفض التقرير اليومي #${repData.report_no || ''}`,
            title_en: `Daily Report #${repData.report_no || ''} Rejected`,
            body_ar: `سبب الرفض والملاحظات: ${reason.trim()}`,
            link_url: '/site-workspace',
            recipient_user_id: repData.entered_by,
          });
        } catch (notifErr) {
          logger.warn('Failed to dispatch rejection notification (non-fatal)', { detail: notifErr });
        }
      }

      appCache.invalidate(`dailyReports:${projectId}`);
      appCache.invalidate(`dailyReport:detail:${id}`);
      appCache.invalidate(`planningKpis:${projectId}`);
      appCache.invalidate(`scurve:${projectId}`);
      return true;
    } catch (err) {
      logger.error('DailyProgressService.rejectDailyReport error:', { detail: err });
      return false;
    }
  }

  /**
   * Fetch rejected daily progress reports for a project (for Site Workspace rework & alerts).
   */
  static async getRejectedDailyReports(projectId: string): Promise<DailyProgress[]> {
    if (!projectId) return [];
    try {
      const { data, error } = await supabase
        .from('pm_daily_progress')
        .select(`
          *,
          lines:pm_daily_progress_lines(
            *,
            boq_item:pm_boq_items(id, item_code, description_ar, unit, rate_egp)
          ),
          photos:pm_daily_progress_photos(*),
          obstructions:pm_daily_obstructions(*)
        `)
        .eq('project_id', projectId)
        .eq('status', 'rejected')
        .order('progress_date', { ascending: false });

      if (error) {
        logger.warn('DailyProgressService.getRejectedDailyReports error:', { detail: error });
        return [];
      }
      return DailyProgressService.signReportsMedia((data || []) as DailyProgress[]);
    } catch (err) {
      logger.warn('DailyProgressService.getRejectedDailyReports exception:', { detail: err });
      return [];
    }
  }

  /**
   * Approve individual line and freeze snapshot rate.
   * ADR-0007: Auto-sync schedule actuals (pm_project_activities) and EVM snapshots.
   */
  static async approveDailyReportLine(
    lineId: string,
    reportId: string,
    reviewedBy?: string,
    snapshotRateEgp?: number
  ): Promise<DailyProgressLine | null> {
    try {
      let rate = snapshotRateEgp;
      let rev = 1;

      if (rate === undefined) {
        try {
          const { data: line } = await supabase
            .from('pm_daily_progress_lines')
            .select(`
              boq_item_id,
              boq_item:pm_boq_items(rate_egp, revision)
            `)
            .eq('id', lineId)
            .single();

          const boqItem = (Array.isArray(line?.boq_item) ? line.boq_item[0] : line?.boq_item) as BoqItemSummary | null;
          rate = boqItem?.rate_egp ?? 0;
          rev = boqItem?.revision ?? 1;
        } catch {
          rate = 0;
          rev = 1;
        }
      }

      const { data, error } = await supabase
        .from('pm_daily_progress_lines')
        .update({
          line_status: 'approved',
          snapshot_rate_egp: rate,
          source_boq_revision: rev,
          line_reviewed_by: reviewedBy || null,
          line_reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', lineId)
        .select()
        .single();

      if (error) throw error;

      // ── ADR-0007: Auto-sync approved line into linked schedule activity ──
      try {
        const boqItemId = (data as { boq_item_id?: string } | null)?.boq_item_id;
        const lineQtyToday = Number((data as { qty_today?: number } | null)?.qty_today || 0);

        const { data: rep } = await supabase
          .from('pm_daily_progress')
          .select('project_id, site_task_id')
          .eq('id', reportId)
          .single();

        const projectId = rep?.project_id;
        let activityId: string | null = null;

        if (rep?.site_task_id) {
          const { data: task } = await supabase
            .from('pm_site_tasks')
            .select('activity_id')
            .eq('id', rep.site_task_id)
            .single();
          if (task?.activity_id) {
            activityId = task.activity_id;
          }
        }

        if (!activityId && boqItemId) {
          const { data: link } = await supabase
            .from('pm_activity_boq_links')
            .select('activity_id')
            .eq('boq_item_id', boqItemId)
            .limit(1)
            .maybeSingle();
          if (link?.activity_id) {
            activityId = link.activity_id;
          }
        }

        if (activityId && projectId) {
          // Upsert allocation row for auditability & traceability
          await supabase
            .from('pm_progress_allocations')
            .upsert({
              line_id: lineId,
              activity_id: activityId,
              project_id: projectId,
              allocated_qty: lineQtyToday,
              snapshot_rate_egp: rate || 0,
              source_boq_revision: rev,
              is_suspended: false,
              created_by: reviewedBy || null,
              created_at: new Date().toISOString(),
            }, { onConflict: 'line_id,activity_id' });

          // Calculate activity total allocated quantity
          const { data: allAllocations } = await supabase
            .from('pm_progress_allocations')
            .select('allocated_qty')
            .eq('activity_id', activityId)
            .eq('is_suspended', false);

          const totalAllocated = (allAllocations || []).reduce(
            (sum: number, a) => sum + Number(a?.allocated_qty || 0),
            0
          );

          // Get planned qty from activity link or activity
          const { data: actLink } = await supabase
            .from('pm_activity_boq_links')
            .select('planned_qty')
            .eq('activity_id', activityId)
            .limit(1)
            .maybeSingle();

          const plannedQty = Number(actLink?.planned_qty || 0);
          let newProgressPct = 0;
          if (plannedQty > 0) {
            newProgressPct = Math.min(100, Math.round((totalAllocated / plannedQty) * 10000) / 100);
          } else if (totalAllocated > 0) {
            newProgressPct = 100;
          }

          const todayIso = new Date().toISOString().slice(0, 10);
          await supabase
            .from('pm_project_activities')
            .update({
              percent_complete: newProgressPct,
              status: newProgressPct >= 100 ? 'completed' : newProgressPct > 0 ? 'in_progress' : 'not_started',
              actual_finish: newProgressPct >= 100 ? todayIso : null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', activityId);

          // Recalculate project overall progress
          await DailyProgressService.calculateProjectProgress(projectId);

          // ADR-0010: Trigger non-blocking EVM recalculation
          CostControlService.recalculateAndSaveSnapshot(projectId).catch((evmErr) => {
            logger.warn('Auto EVM snapshot background error:', { detail: evmErr });
          });
        }
      } catch (syncErr) {
        logger.warn('ADR-0007 auto-sync schedule actuals warning (non-fatal):', { detail: syncErr });
      }

      appCache.invalidate(`dailyReport:detail:${reportId}`);
      appCache.invalidate('planningKpis:');
      return data;
    } catch (err) {
      logger.error('DailyProgressService.approveDailyReportLine error:', { detail: err });
      return null;
    }
  }

  /**
   * Reject individual line with reason.
   */
  static async rejectDailyReportLine(
    lineId: string,
    reportId: string,
    reviewedBy?: string,
    reason?: string
  ): Promise<DailyProgressLine | null> {
    try {
      const { data, error } = await supabase
        .from('pm_daily_progress_lines')
        .update({
          line_status: 'rejected',
          rejection_reason: reason || null,
          line_reviewed_by: reviewedBy || null,
          line_reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', lineId)
        .select()
        .single();

      if (error) throw error;

      appCache.invalidate(`dailyReport:detail:${reportId}`);
      return data;
    } catch (err) {
      logger.error('DailyProgressService.rejectDailyReportLine error:', { detail: err });
      return null;
    }
  }

  /**
   * Add photo attachment to daily progress report.
   */
  static async addPhotoAttachment(
    photo: Partial<DailyProgressPhoto>
  ): Promise<DailyProgressPhoto | null> {
    try {
      const payload = {
        daily_progress_id: photo.daily_progress_id,
        storage_path: photo.storage_path || '',
        photo_url: toCanonicalStorageValue('progress-photos', photo.photo_url),
        caption: photo.caption || null,
        uploaded_by: photo.uploaded_by || null,
        uploaded_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('pm_daily_progress_photos')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      if (photo.daily_progress_id) {
        appCache.invalidate(`dailyReport:detail:${photo.daily_progress_id}`);
      }
      return data;
    } catch (err) {
      logger.error('DailyProgressService.addPhotoAttachment error:', { detail: err });
      return null;
    }
  }

  /**
   * Add site obstruction log to daily progress.
   */
  static async addObstruction(
    obstruction: Partial<DailyObstruction>
  ): Promise<DailyObstruction | null> {
    try {
      if (!obstruction.project_id) {
        throw new Error('Project ID is required to log an obstruction');
      }

      // Foreign key safety checks to prevent constraint crashes on orphan references
      let validatedTaskId: string | null = obstruction.task_id || obstruction.site_task_id || null;
      if (validatedTaskId) {
        try {
          const { data: taskCheck } = await supabase
            .from('pm_site_tasks')
            .select('id')
            .eq('id', validatedTaskId)
            .maybeSingle();
          if (!taskCheck) {
            validatedTaskId = null;
          }
        } catch {
          validatedTaskId = null;
        }
      }

      let validatedDailyProgressId: string | null = obstruction.daily_progress_id || null;
      if (validatedDailyProgressId) {
        try {
          const { data: reportCheck } = await supabase
            .from('pm_daily_progress')
            .select('id')
            .eq('id', validatedDailyProgressId)
            .maybeSingle();
          if (!reportCheck) {
            validatedDailyProgressId = null;
          }
        } catch {
          validatedDailyProgressId = null;
        }
      }

      let validatedDeliverableId: string | null = obstruction.deliverable_item_id || null;
      if (validatedDeliverableId) {
        try {
          const { data: delCheck } = await supabase
            .from('pm_deliverable_items')
            .select('id')
            .eq('id', validatedDeliverableId)
            .maybeSingle();
          if (!delCheck) {
            validatedDeliverableId = null;
          }
        } catch {
          validatedDeliverableId = null;
        }
      }

      const payload: Record<string, unknown> = {
        daily_progress_id: validatedDailyProgressId,
        project_id: obstruction.project_id,
        task_id: validatedTaskId,
        deliverable_item_id: validatedDeliverableId,
        obstruction_type: obstruction.obstruction_type || 'other',
        responsible_party: obstruction.responsible_party || 'other',
        description: obstruction.description?.trim() || '',
        scope: obstruction.scope || 'task',
        eot_days: obstruction.eot_days !== undefined ? Number(obstruction.eot_days) : 0,
        financial_impact_egp:
          obstruction.financial_impact_egp !== undefined
            ? Number(obstruction.financial_impact_egp)
            : 0,
        idle_manpower: obstruction.idle_manpower || 0,
        idle_equipment_summary: obstruction.idle_equipment_summary || null,
        started_at: obstruction.started_at || new Date().toISOString(),
        resolved_at: obstruction.resolved_at || null,
        resolution_notes: obstruction.resolution_notes || null,
        evidence_path: toCanonicalStorageValue('progress-photos', obstruction.evidence_path),
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('pm_daily_obstructions')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      if (obstruction.daily_progress_id) {
        appCache.invalidate(`dailyReport:detail:${obstruction.daily_progress_id}`);
      }
      if (obstruction.project_id) {
        appCache.invalidate(`deliverables:obstructions:${obstruction.project_id}`);
      }
      appCache.invalidate('obstructions:');
      appCache.invalidate('kpi:');
      return data;
    } catch (err: unknown) {
      const postgrestErr = err as { message?: string; code?: string; details?: string; hint?: string } | null;
      logger.error('DailyProgressService.addObstruction error:', {
        message: postgrestErr?.message || String(err),
        code: postgrestErr?.code,
        details: postgrestErr?.details,
        hint: postgrestErr?.hint,
      });
      throw err instanceof Error ? err : new Error(postgrestErr?.message || String(err));
    }
  }

  /**
   * Get cross-project obstructions from v_cross_project_obstructions or table query.
   */
  static async getCrossProjectObstructions(options?: {
    projectId?: string;
    status?: 'active' | 'resolved' | 'all';
    obstructionType?: string;
    scope?: 'task' | 'site_wide';
    limit?: number;
  }): Promise<DailyObstruction[]> {
    const cacheKey = `obstructions:cross:${JSON.stringify(options || {})}`;

    const obstructions = await appCache.getOrFetch(cacheKey, TTL.dailyProgress || 15000, async () => {
      try {
        let query = supabase
          .from('pm_daily_obstructions')
          .select(`
            *,
            project:projects(id, name_ar, name_en, code),
            task:pm_site_tasks(id, title_ar, status),
            deliverable_item:pm_deliverable_items(id, description)
          `)
          .order('started_at', { ascending: false });

        if (options?.projectId) {
          query = query.eq('project_id', options.projectId);
        }

        if (options?.status === 'active') {
          query = query.is('resolved_at', null);
        } else if (options?.status === 'resolved') {
          query = query.not('resolved_at', 'is', null);
        }

        if (options?.obstructionType) {
          query = query.eq('obstruction_type', options.obstructionType);
        }

        if (options?.scope) {
          query = query.eq('scope', options.scope);
        }

        if (options?.limit) {
          query = query.limit(options.limit);
        }

        const { data, error } = await query;

        if (error) {
          logger.warn('DailyProgressService.getCrossProjectObstructions error:', { detail: error });
          return [];
        }

        return (data || []) as DailyObstruction[];
      } catch (err) {
        logger.warn('DailyProgressService.getCrossProjectObstructions exception:', { detail: err });
        return [];
      }
    });
    return DailyProgressService.signObstructionsEvidence(obstructions);
  }

  /**
   * Resolve obstruction by ID with resolution timestamp and notes.
   */
  static async resolveObstruction(
    id: string,
    resolutionNotes?: string,
    resolvedAt?: string
  ): Promise<boolean> {
    try {
      const now = resolvedAt || new Date().toISOString();
      const { data, error } = await supabase
        .from('pm_daily_obstructions')
        .update({
          resolved_at: now,
          resolution_notes: resolutionNotes || null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (data?.daily_progress_id) {
        appCache.invalidate(`dailyReport:detail:${data.daily_progress_id}`);
      }
      if (data?.project_id) {
        appCache.invalidate(`deliverables:obstructions:${data.project_id}`);
      }
      appCache.invalidate('obstructions:');
      appCache.invalidate('kpi:');

      return true;
    } catch (err) {
      logger.error('DailyProgressService.resolveObstruction error:', { detail: err });
      return false;
    }
  }

  /**
   * Get approval delegations for a project.
   */
  static async getDelegations(projectId: string): Promise<ApprovalDelegation[]> {
    try {
      const { data, error } = await supabase
        .from('pm_approval_delegations')
        .select(`
          *,
          delegator:stakeholders!delegator_id(id, name_ar, name_en, role),
          delegated_to:stakeholders!delegated_to_id(id, name_ar, name_en, role)
        `)
        .eq('project_id', projectId)
        .order('valid_from', { ascending: false });

      if (error) {
        logger.warn('DailyProgressService.getDelegations error:', { detail: error });
        return [];
      }
      return data || [];
    } catch (err) {
      logger.warn('DailyProgressService.getDelegations exception:', { detail: err });
      return [];
    }
  }

  /**
   * Save or update an approval delegation.
   */
  static async saveDelegation(
    delegation: Partial<ApprovalDelegation>
  ): Promise<ApprovalDelegation | null> {
    try {
      const payload = {
        project_id: delegation.project_id,
        delegator_id: delegation.delegator_id,
        delegated_to_id: delegation.delegated_to_id,
        valid_from: delegation.valid_from || new Date().toISOString().slice(0, 10),
        valid_to: delegation.valid_to || new Date().toISOString().slice(0, 10),
        is_active: delegation.is_active !== undefined ? delegation.is_active : true,
        notes: delegation.notes || null,
        updated_at: new Date().toISOString(),
      };

      let result: ApprovalDelegation | null = null;
      if (delegation.id) {
        const { data, error } = await supabase
          .from('pm_approval_delegations')
          .update(payload)
          .eq('id', delegation.id)
          .select()
          .single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('pm_approval_delegations')
          .insert({ ...payload, created_at: new Date().toISOString() })
          .select()
          .single();
        if (error) throw error;
        result = data;
      }

      return result;
    } catch (err) {
      const message = (err as { message?: string })?.message || String(err);
      logger.error('DailyProgressService.saveDelegation error:', { detail: err });
      throw new Error(`فشل حفظ التفويض: ${message}`);
    }
  }

  /**
   * Revoke an approval delegation by ID.
   */
  static async revokeDelegation(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('pm_approval_delegations')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err) {
      const message = (err as { message?: string })?.message || String(err);
      logger.error('DailyProgressService.revokeDelegation error:', { detail: err });
      throw new Error(`فشل سحب التفويض: ${message}`);
    }
  }

  /**
   * Check if a user has permission to approve daily reports for a project.
   * Checks if user is PM / admin or has an active delegation on current date.
   */
  static async canUserApprove(
    projectId: string,
    userId: string,
    userRole: string
  ): Promise<boolean> {
    try {
      const normalizedRole = userRole.toLowerCase();
      if (
        normalizedRole === 'project_manager' ||
        normalizedRole === 'admin' ||
        normalizedRole === 'pm' ||
        normalizedRole === 'executive'
      ) {
        return true;
      }

      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from('pm_approval_delegations')
        .select('id')
        .eq('project_id', projectId)
        .eq('delegated_to_id', userId)
        .eq('is_active', true)
        .lte('valid_from', today)
        .gte('valid_to', today)
        .limit(1)
        .maybeSingle();

      if (error) {
        logger.warn('DailyProgressService.canUserApprove check error:', { detail: error });
        return false;
      }

      return Boolean(data);
    } catch (err) {
      logger.warn('DailyProgressService.canUserApprove exception:', { detail: err });
      return false;
    }
  }

  // ────────────────────────────────────────────────────────────
  // PROGRESS TRACKING & VERIFICATION
  // ────────────────────────────────────────────────────────────

  /**
   * Calculate weighted task progress from BOQ lines (weighted by cost).
   * Formula: Σ(line_cumulative_pct × line_value) / Σ(line_value)
   * where line_value = contract_qty × rate_egp
   *
   * Updates pm_site_tasks.progress_pct and sets progress_verified = false.
   * Returns the computed percentage.
   */
  static async calculateTaskProgress(siteTaskId: string): Promise<number> {
    if (!siteTaskId) return 0;
    try {
      // 1. Get all APPROVED reports for this task (so official KPIs reflect approved work)
      let { data: reports, error: repErr } = await supabase
        .from('pm_daily_progress')
        .select('id')
        .eq('site_task_id', siteTaskId)
        .in('status', ['approved', 'partially_approved']);

      let isVerified = true;

      // If no approved reports yet, check for submitted/pending reports for provisional progress
      if (repErr || !reports?.length) {
        const { data: activeReports } = await supabase
          .from('pm_daily_progress')
          .select('id')
          .eq('site_task_id', siteTaskId)
          .not('status', 'in', '("cancelled","rejected")');

        if (!activeReports?.length) {
          await supabase
            .from('pm_site_tasks')
            .update({ progress_pct: 0, progress_verified: false, updated_at: new Date().toISOString() })
            .eq('id', siteTaskId);
          return 0;
        }

        reports = activeReports;
        isVerified = false;
      }

      const reportIds = (reports as ReportIdRow[]).map((r) => r.id);

      // 2. Get all non-rejected lines with BOQ details (need contract_qty, rate_egp for weighting)
      const { data: lines, error: lineErr } = await supabase
        .from('pm_daily_progress_lines')
        .select('boq_item_id, qty_today, boq_item:pm_boq_items(contract_qty, rate_egp)')
        .in('daily_progress_id', reportIds)
        .neq('line_status', 'rejected');

      if (lineErr || !lines?.length) {
        if (isVerified) {
          await supabase
            .from('pm_site_tasks')
            .update({ progress_pct: 0, progress_verified: true, updated_at: new Date().toISOString() })
            .eq('id', siteTaskId);
        }
        return 0;
      }

      // 3. Aggregate cumulative qty per BOQ item
      const cumMap: Record<string, { cumulativeQty: number; contractQty: number; rateEgp: number }> = {};
      for (const line of (lines as ProgressLineWithBoq[])) {
        const qty = Number(line.qty_today) || 0;
        const bid = line.boq_item_id;
        if (!bid || qty <= 0) continue;
        const boq = Array.isArray(line.boq_item) ? line.boq_item[0] : line.boq_item;
        if (!boq) continue;
        if (!cumMap[bid]) {
          cumMap[bid] = {
            cumulativeQty: 0,
            contractQty: Number(boq.contract_qty) || 1,
            rateEgp: Number(boq.rate_egp) || 0,
          };
        }
        cumMap[bid].cumulativeQty += qty;
      }

      // 4. Weighted average: Σ(item_pct × item_value) / Σ(item_value)
      let totalWeightedProgress = 0;
      let totalValue = 0;
      for (const bid of Object.keys(cumMap)) {
        const { cumulativeQty, contractQty, rateEgp } = cumMap[bid];
        const itemPct = Math.min((cumulativeQty / contractQty) * 100, 100);
        const itemValue = contractQty * rateEgp;
        totalWeightedProgress += itemPct * itemValue;
        totalValue += itemValue;
      }

      const progressPct = totalValue > 0 ? Math.round((totalWeightedProgress / totalValue) * 100) / 100 : 0;

      // 5. Update pm_site_tasks with computed progress and verification flag
      await supabase
        .from('pm_site_tasks')
        .update({ progress_pct: progressPct, progress_verified: isVerified, updated_at: new Date().toISOString() })
        .eq('id', siteTaskId);

      return progressPct;
    } catch (err) {
      logger.warn('DailyProgressService.calculateTaskProgress exception:', { detail: err });
      return 0;
    }
  }

  /**
   * Calculate overall project progress — weighted average of all task progresses by value.
   * Returns 0-100.
   */
  static async calculateProjectProgress(projectId: string): Promise<number> {
    if (!projectId) return 0;
    try {
      // Get all tasks with their progress and linked BOQ values
      const { data: tasks, error: taskErr } = await supabase
        .from('pm_site_tasks')
        .select('id, progress_pct')
        .eq('project_id', projectId)
        .neq('status', 'cancelled');

      if (taskErr || !tasks?.length) return 0;

      // For each task, get total BOQ value
      let totalWeighted = 0;
      let totalValue = 0;

      for (const task of tasks) {
        const { data: reports } = await supabase
          .from('pm_daily_progress')
          .select('id')
          .eq('site_task_id', task.id)
          .neq('status', 'cancelled')
          .limit(1);

        // Get BOQ items linked to this task's reports
        if (reports?.length) {
          const { data: lines } = await supabase
            .from('pm_daily_progress_lines')
            .select('boq_item:pm_boq_items(contract_qty, rate_egp)')
            .in('daily_progress_id', (reports as ReportIdRow[]).map((r) => r.id));

          const seenBids = new Set<string>();
          let taskValue = 0;
          for (const line of ((lines || []) as ProgressLineWithBoq[])) {
            const boq = Array.isArray(line.boq_item) ? line.boq_item[0] : line.boq_item;
            if (boq) {
              const key = `${boq.contract_qty}-${boq.rate_egp}`;
              if (!seenBids.has(key)) {
                seenBids.add(key);
                taskValue += Number(boq.contract_qty || 0) * Number(boq.rate_egp || 0);
              }
            }
          }

          if (taskValue > 0) {
            totalWeighted += (Number(task.progress_pct) || 0) * taskValue;
            totalValue += taskValue;
          }
        }
      }

      return totalValue > 0 ? Math.round((totalWeighted / totalValue) * 100) / 100 : 0;
    } catch (err) {
      logger.warn('DailyProgressService.calculateProjectProgress exception:', { detail: err });
      return 0;
    }
  }

  /**
   * Verify or reject a progress report (planning engineer action).
   * - 'verify': sets verification_status='verified', updates task progress_verified=true
   * - 'reject': sets verification_status='rejected' + reason, notifies site engineer
   */
  static async verifyProgress(
    reportId: string,
    action: 'verify' | 'reject',
    userId: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!reportId || !userId) return { success: false, error: 'Missing reportId or userId' };

    try {
      if (action === 'verify') {
        const { error } = await supabase
          .from('pm_daily_progress')
          .update({
            status: 'approved',
            approved_by: userId,
            approved_at: new Date().toISOString(),
          })
          .eq('id', reportId);

        if (error) throw error;

        // Mark the linked task as verified
        const { data: report } = await supabase
          .from('pm_daily_progress')
          .select('site_task_id')
          .eq('id', reportId)
          .single();

        if (report?.site_task_id) {
          // Check if ALL reports for this task are verified
          const { data: unverified } = await supabase
            .from('pm_daily_progress')
            .select('id')
            .eq('site_task_id', report.site_task_id)
            .not('status', 'in', '("approved","rejected","cancelled")')
            .limit(1);

          if (!unverified?.length) {
            await supabase
              .from('pm_site_tasks')
              .update({ progress_verified: true })
              .eq('id', report.site_task_id);
          }
        }

        return { success: true };
      } else {
        // Reject
        if (!reason) return { success: false, error: 'Rejection reason is required' };

        const { error } = await supabase
          .from('pm_daily_progress')
          .update({
            status: 'rejected',
            rejected_by: userId,
            rejected_at: new Date().toISOString(),
            rejection_reason: reason,
          })
          .eq('id', reportId);

        if (error) throw error;
        return { success: true };
      }
    } catch (err) {
      logger.error('DailyProgressService.verifyProgress error:', { detail: err });
      return { success: false, error: String(err) };
    }
  }

  /**
   * Get progress history with filters: date range, discipline, engineer.
   * Used by planning engineer to review all progress entries.
   */
  static async getProgressHistory(
    projectId: string,
    filters?: {
      dateFrom?: string;
      dateTo?: string;
      discipline?: string;
      enteredBy?: string;
      verificationStatus?: string;
    }
  ): Promise<DailyProgress[]> {
    if (!projectId) return [];
    try {
      let query = supabase
        .from('pm_daily_progress')
        .select(`
          *,
          lines:pm_daily_progress_lines(
            *,
            boq_item:pm_boq_items(id, item_code, description_ar, unit, rate_egp, contract_qty)
          )
        `)
        .eq('project_id', projectId)
        .neq('status', 'cancelled')
        .order('progress_date', { ascending: false });

      if (filters?.dateFrom) {
        query = query.gte('progress_date', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('progress_date', filters.dateTo);
      }
      if (filters?.discipline) {
        query = query.eq('discipline', filters.discipline);
      }
      if (filters?.enteredBy) {
        query = query.eq('entered_by_name', filters.enteredBy);
      }
      if (filters?.verificationStatus) {
        /* Map verification_status concept → actual DB status column */
        const vsMap: Record<string, string> = {
          unverified: 'submitted',
          verified: 'approved',
          rejected: 'rejected',
        };
        const mappedStatus = vsMap[filters.verificationStatus] ?? filters.verificationStatus;
        query = query.eq('status', mappedStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as DailyProgress[];
    } catch (err) {
      logger.warn('DailyProgressService.getProgressHistory exception:', { detail: err });
      return [];
    }
  }

  /**
   * Get progress timeline data for S-Curve chart.
   * Returns weekly snapshots of cumulative progress (planned vs actual).
   */
  static async getProgressTimeline(
    projectId: string
  ): Promise<{ date: string; actual: number; verified: number }[]> {
    if (!projectId) return [];
    try {
      // Get all non-cancelled reports ordered by date
      const { data: reports, error } = await supabase
        .from('pm_daily_progress')
        .select('progress_date, status, lines:pm_daily_progress_lines(qty_today, boq_item:pm_boq_items(contract_qty, rate_egp))')
        .eq('project_id', projectId)
        .neq('status', 'cancelled')
        .order('progress_date', { ascending: true });

      if (error || !reports?.length) return [];

      // Get total project BOQ value for percentage calculation
      const { data: boqItems } = await supabase
        .from('pm_boq_items')
        .select('contract_qty, rate_egp')
        .eq('project_id', projectId);

      const totalProjectValue = (boqItems || []).reduce(
        (s, b) => s + Number(b.contract_qty || 0) * Number(b.rate_egp || 0),
        0
      );

      if (totalProjectValue <= 0) return [];

      // Accumulate daily value earned
      let cumulativeActual = 0;
      let cumulativeVerified = 0;
      const timeline: { date: string; actual: number; verified: number }[] = [];

      for (const report of ((reports || []) as unknown as TimelineReport[])) {
        const lines = report.lines || [];
        let dayValue = 0;
        for (const line of lines) {
          const qty = Number(line.qty_today) || 0;
          const boq = Array.isArray(line.boq_item) ? line.boq_item[0] : line.boq_item;
          if (boq && qty > 0) {
            dayValue += qty * Number(boq.rate_egp || 0);
          }
        }
        cumulativeActual += dayValue;
        if (report.verification_status === 'verified' || (report as { status?: string }).status === 'approved') {
          cumulativeVerified += dayValue;
        }

        timeline.push({
          date: report.progress_date,
          actual: Math.round((cumulativeActual / totalProjectValue) * 10000) / 100,
          verified: Math.round((cumulativeVerified / totalProjectValue) * 10000) / 100,
        });
      }

      return timeline;
    } catch (err) {
      logger.warn('DailyProgressService.getProgressTimeline exception:', { detail: err });
      return [];
    }
  }

  /**
   * Get pending (unverified) progress reports for a project.
   * Used by planning engineer approval queue.
   */
  static async getPendingProgressReports(
    projectId: string
  ): Promise<DailyProgress[]> {
    if (!projectId) return [];
    try {
      const { data, error } = await supabase
        .from('pm_daily_progress')
        .select(`
          *,
          lines:pm_daily_progress_lines(
            *,
            boq_item:pm_boq_items(id, item_code, description_ar, unit, rate_egp, contract_qty)
          )
        `)
        .eq('project_id', projectId)
        .in('status', ['submitted', 'pending'])
        .neq('status', 'cancelled')
        .neq('status', 'draft')
        .order('progress_date', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as DailyProgress[];
    } catch (err) {
      logger.warn('DailyProgressService.getPendingProgressReports exception:', { detail: err });
      return [];
    }
  }

  /**
   * Batch save progress lines from Fast-Grid (Option 2).
   * Finds or creates a daily progress report for today, then inserts the provided lines.
   * Auto-recalculates task progress and project progress.
   */
  static async batchSaveDailyProgressLines(
    projectIdOrOpts:
      | string
      | {
          projectId: string;
          reportDate?: string;
          userId?: string;
          userName?: string;
          items: Array<{
            taskId: string;
            boqItemId?: string;
            todayQty?: number;
            qtyToday?: number;
            cumulativeQty?: number;
            todayPct?: number;
            cumulativePct?: number;
            discipline?: DailyDiscipline;
            zone?: string;
            notes?: string;
            isClaimableVo?: boolean;
          }>;
        },
    userIdArg?: string,
    userNameArg?: string,
    itemsArg?: Array<{
      taskId: string;
      boqItemId?: string;
      todayQty?: number;
      qtyToday?: number;
      cumulativeQty?: number;
      todayPct?: number;
      cumulativePct?: number;
      discipline?: DailyDiscipline;
      zone?: string;
      notes?: string;
      isClaimableVo?: boolean;
    }>
  ): Promise<{ success: boolean; updatedCount: number; error?: string }> {
    let projectId: string;
    let userId: string;
    let userName: string;
    let reportDate: string | undefined;
    let rawItems: Array<{
      taskId: string;
      boqItemId?: string;
      todayQty?: number;
      qtyToday?: number;
      cumulativeQty?: number;
      todayPct?: number;
      cumulativePct?: number;
      discipline?: DailyDiscipline;
      zone?: string;
      notes?: string;
      isClaimableVo?: boolean;
    }>;

    if (typeof projectIdOrOpts === 'object' && projectIdOrOpts !== null) {
      projectId = projectIdOrOpts.projectId;
      userId = projectIdOrOpts.userId || '';
      userName = projectIdOrOpts.userName || 'مهندس الموقع';
      reportDate = projectIdOrOpts.reportDate;
      rawItems = projectIdOrOpts.items || [];
    } else {
      projectId = projectIdOrOpts;
      userId = userIdArg || '';
      userName = userNameArg || 'مهندس الموقع';
      rawItems = itemsArg || [];
    }

    const items = rawItems.map((it) => ({
      ...it,
      boqItemId: it.boqItemId || '',
      qtyToday: Number(it.qtyToday ?? it.todayQty ?? 0),
    }));

    if (!projectId || !items.length) {
      return { success: false, updatedCount: 0, error: 'بيانات غير كافية للحفظ' };
    }

    try {
      const today = reportDate || new Date().toISOString().slice(0, 10);
      let totalInserted = 0;

      // Group items by taskId
      const itemsByTask = items.reduce((acc, item) => {
        if (!acc[item.taskId]) acc[item.taskId] = [];
        acc[item.taskId].push(item);
        return acc;
      }, {} as Record<string, typeof items>);

      for (const [taskId, taskItems] of Object.entries(itemsByTask)) {
        // Skip closed tasks so batch does not fail on SITE_TASK_CLOSED
        const { data: currentTask } = await supabase
          .from('pm_site_tasks')
          .select('status')
          .eq('id', taskId)
          .maybeSingle();

        if (currentTask?.status === 'done' || currentTask?.status === 'cancelled') {
          logger.warn(`Skipping progress for closed task: ${taskId} (${currentTask?.status})`);
          continue;
        }

        const discipline: DailyDiscipline = taskItems[0]?.discipline || 'civil';
        
        let report = await DailyProgressService.checkExistingReport(projectId, today, discipline, taskId);
        
        if (!report) {
          // Check if any report already exists for this task today
          const { data: existingAny } = await supabase
            .from('pm_daily_progress')
            .select('id, project_id, status, progress_date, discipline')
            .eq('project_id', projectId)
            .eq('progress_date', today)
            .eq('site_task_id', taskId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (existingAny?.id) {
            report = existingAny as unknown as DailyProgress;
          } else {
            const hasVo = taskItems.some((it) => it.isClaimableVo);
            report = await DailyProgressService.createDailyReport(
              {
                project_id: projectId,
                progress_date: today,
                discipline,
                status: 'draft',
                entered_by: userId,
                entered_by_name: userName,
                site_task_id: taskId,
                vo_requested: hasVo,
              },
              []
            );
          }
        }

        if (!report?.id) {
          throw new Error(`فشل إنشاء أو العثور على تقرير اليوم للمهمة ${taskId}`);
        }

        const reportId = report.id;

        // Resolve BOQ Item ID for the task if missing
        let defaultBoqId = taskItems.find((it) => it.boqItemId)?.boqItemId;
        if (!defaultBoqId) {
          const { data: tData } = await supabase
            .from('pm_site_tasks')
            .select('boq_item_id')
            .eq('id', taskId)
            .single();
          defaultBoqId = tData?.boq_item_id;
        }
        if (!defaultBoqId) {
          const { data: bData } = await supabase
            .from('pm_boq_items')
            .select('id')
            .eq('project_id', projectId)
            .limit(1)
            .maybeSingle();
          defaultBoqId = bData?.id;
        }

        const lineInserts = taskItems
          .filter((it) => (it.boqItemId || defaultBoqId) && (Number(it.qtyToday) > 0 || Number(it.todayPct) > 0))
          .map((it) => ({
            daily_progress_id: reportId,
            boq_item_id: it.boqItemId || defaultBoqId,
            qty_today: Number(it.qtyToday) > 0 ? Number(it.qtyToday) : (Number(it.todayPct) || 1),
            zone: it.zone || null,
            remarks: it.notes || null,
            line_status: 'pending' as const,
            is_claimable_vo: it.isClaimableVo || false,
            created_at: new Date().toISOString(),
          }));

        if (lineInserts.length > 0) {
          // Mock-server-side validation for over-execution in batch saves
          const hasOverExecution = lineInserts.some(l => l.is_claimable_vo);
          if (hasOverExecution && !report.vo_requested) {
            throw new Error('OVER_EXECUTION_REJECTED: لا يمكن حفظ الكميات الإضافية بدون طلب أمر تغيير (vo_requested: true).');
          }

          const { error: lineError } = await supabase
            .from('pm_daily_progress_lines')
            .insert(lineInserts);

          if (lineError) {
            logger.warn('batchSave line insert error:', { detail: lineError });
          } else {
            totalInserted += lineInserts.length;
          }
        }

        // Auto-submit the report so it enters the Planning Engineer approval queue
        if (report.status === 'draft') {
          await DailyProgressService.submitDailyReport(reportId, projectId, userId);
        }

        // If task percentage was directly supplied, ensure task progress_pct is updated
        const targetPct = taskItems[0]?.cumulativePct ?? taskItems[0]?.todayPct;
        if (typeof targetPct === 'number' && targetPct > 0) {
          await supabase
            .from('pm_site_tasks')
            .update({ progress_pct: Math.min(100, targetPct), updated_at: new Date().toISOString() })
            .eq('id', taskId);
        } else {
          await DailyProgressService.calculateTaskProgress(taskId);
        }
      }

      await DailyProgressService.calculateProjectProgress(projectId);

      return { success: true, updatedCount: totalInserted };
    } catch (err: unknown) {
      logger.error('batchSaveDailyProgressLines error:', { detail: err });
      const errorMsg = err instanceof Error ? err.message : String(err);
      return { success: false, updatedCount: 0, error: errorMsg || 'حدث خطأ أثناء الحفظ المجمع' };
    }
  }

  private static async signObstructionsEvidence(
    obstructions: DailyObstruction[]
  ): Promise<DailyObstruction[]> {
    if (!obstructions.length) return obstructions;
    const signedMap = await getSignedStorageUrls(
      'progress-photos',
      obstructions.map((o) => o.evidence_path),
      3600
    );
    return obstructions.map((o) => {
      const signed = o.evidence_path ? signedMap.get(o.evidence_path) : undefined;
      return signed ? { ...o, evidence_path: signed } : o;
    });
  }

  private static async signReportsMedia(reports: DailyProgress[]): Promise<DailyProgress[]> {
    if (!reports.length) return reports;
    const paths: Array<string | null | undefined> = [];
    for (const rep of reports) {
      for (const p of rep.photos || []) {
        paths.push(p.storage_path || p.photo_url);
      }
      for (const o of rep.obstructions || []) {
        paths.push(o.evidence_path);
      }
    }
    const signedMap = await getSignedStorageUrls('progress-photos', paths, 3600);
    if (signedMap.size === 0) return reports;

    return reports.map((rep) => ({
      ...rep,
      photos: rep.photos
        ? rep.photos.map((p) => {
            const key = p.storage_path || p.photo_url;
            const signed = key ? signedMap.get(key) : undefined;
            return signed ? { ...p, photo_url: signed } : p;
          })
        : rep.photos,
      obstructions: rep.obstructions
        ? rep.obstructions.map((o) => {
            const signed = o.evidence_path ? signedMap.get(o.evidence_path) : undefined;
            return signed ? { ...o, evidence_path: signed } : o;
          })
        : rep.obstructions,
    }));
  }

  private static async signReportMedia(
    report: DailyProgress | null
  ): Promise<DailyProgress | null> {
    if (!report) return null;
    const [signed] = await DailyProgressService.signReportsMedia([report]);
    return signed;
  }
}
