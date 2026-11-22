import type { WeeklyBoqItem, WeeklyAllocationRow } from '@/types/services-types';
import { supabase } from '@/lib/supabase';
import { getSignedStorageUrls } from '@/lib/supabase/storage';
import { appCache, CACHE_KEYS, TTL } from '@/lib/cache';
import {
  WeeklyReport,
  WeeklyReportAggregates,
  CommercialSettings,
  ScurvePoint,
  ObstructionType,
} from '@/types/planning';
import { generateScurveData } from '@/lib/planning/calculations';
import type { ScheduleVersion } from '@/lib/services/schedule-version.service';

/** Minimal reference to the schedule version a report is bound to (stored inside `aggregates` JSONB). */
export interface WeeklyReportVersionRef {
  id: string;
  version_no: number;
  version_type: ScheduleVersion['version_type'];
  status: ScheduleVersion['status'];
  data_date?: string | null;
}

export type WeeklyReportAggregatesWithVersion = WeeklyReportAggregates & {
  schedule_version?: WeeklyReportVersionRef;
};

/**
 * Thrown when a project period has absolutely nothing to report
 * (no daily lines, no photos, no obstructions, no lookahead activities and no S-curve).
 * Callers should surface a friendly message instead of treating it as a system failure.
 */
export class WeeklyReportEmptyError extends Error {
  readonly code = 'WEEKLY_REPORT_EMPTY';
  readonly messageAr =
    'لا توجد بيانات كافية لتوليد التقرير الأسبوعي — لا توجد تقارير يومية أو أنشطة ضمن هذه الفترة';
  constructor() {
    super('WEEKLY_REPORT_EMPTY: no daily progress, obstructions, photos, lookahead or s-curve data');
    this.name = 'WeeklyReportEmptyError';
  }
}

export class WeeklyReportService {
  /**
   * Fetch all weekly reports for a project.
   */
  static async getWeeklyReports(projectId: string): Promise<WeeklyReport[]> {
    const key = CACHE_KEYS.weeklyReport.list(projectId);
    return appCache.getOrFetch(key, TTL.weeklyReport, async () => {
      try {
        const { data, error } = await supabase
          .from('pm_weekly_reports')
          .select('*')
          .eq('project_id', projectId)
          .order('week_start', { ascending: false });

        if (error) {
          console.warn('WeeklyReportService.getWeeklyReports error:', error);
          return [];
        }
        return data || [];
      } catch (err) {
        console.warn('WeeklyReportService.getWeeklyReports exception:', err);
        return [];
      }
    });
  }

  /**
   * Fetch single weekly report by ID.
   */
  static async getWeeklyReportById(id: string): Promise<WeeklyReport | null> {
    const key = CACHE_KEYS.weeklyReport.detail(id);
    return appCache.getOrFetch(key, TTL.weeklyReport, async () => {
      try {
        const { data, error } = await supabase
          .from('pm_weekly_reports')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.warn('WeeklyReportService.getWeeklyReportById error:', error);
          return null;
        }
        return data;
      } catch (err) {
        console.warn('WeeklyReportService.getWeeklyReportById exception:', err);
        return null;
      }
    });
  }

  /**
   * Resolve the schedule version a new weekly report should be bound to:
   * prefer the APPROVED version (highest version_no), otherwise fall back to
   * the latest available version of any status. Returns usedFallback=true when
   * no approved version exists — callers must show the fallback notice.
   */
  static async resolveReportingVersion(
    projectId: string
  ): Promise<{ version: ScheduleVersion | null; usedFallback: boolean }> {
    try {
      const { data, error } = await supabase
        .from('pm_schedule_versions')
        .select('*')
        .eq('project_id', projectId)
        .order('version_no', { ascending: false });

      if (error) {
        console.warn('WeeklyReportService.resolveReportingVersion error:', error.message);
        return { version: null, usedFallback: false };
      }
      const versions = (data || []) as ScheduleVersion[];
      if (versions.length === 0) return { version: null, usedFallback: false };

      const approved = versions.find((v) => v.status === 'approved');
      if (approved) return { version: approved, usedFallback: false };
      return { version: versions[0], usedFallback: true };
    } catch (err) {
      console.warn('WeeklyReportService.resolveReportingVersion exception:', err);
      return { version: null, usedFallback: false };
    }
  }

  /**
   * Generate weekly report aggregating daily lines, obstructions, photos, and S-curve status.
   *
   * Idempotent per (project_id, week_start): if a row already exists for the week it is
   * returned as-is and nothing is inserted (the table has a UNIQUE constraint on that pair).
   * Throws {@link WeeklyReportEmptyError} when the period has no data at all.
   */
  static async generateWeeklyReport(
    projectId: string,
    weekStart: string,
    weekEnd: string,
    generatedBy?: string,
    opts?: { scheduleVersion?: WeeklyReportVersionRef | null }
  ): Promise<WeeklyReport | null> {
    try {
      // 0. Idempotency guard: same project + week already generated → return existing row.
      const { data: existingRow } = await supabase
        .from('pm_weekly_reports')
        .select('*')
        .eq('project_id', projectId)
        .eq('week_start', weekStart)
        .maybeSingle();
      if (existingRow) {
        appCache.invalidate(`weeklyReports:${projectId}`);
        return existingRow as WeeklyReport;
      }

      // 1. Fetch daily reports in the date range
      const { data: dailyReports } = await supabase
        .from('pm_daily_progress')
        .select(`
          id,
          progress_date,
          lines:pm_daily_progress_lines(
            id,
            boq_item_id,
            qty_today,
            snapshot_rate_egp,
            line_status,
            boq_item:pm_boq_items(id, item_code, description_ar, unit, contract_qty, rate_egp)
          ),
          photos:pm_daily_progress_photos(storage_path, photo_url, caption, uploaded_at),
          obstructions:pm_daily_obstructions(*)
        `)
        .eq('project_id', projectId)
        .gte('progress_date', weekStart)
        .lte('progress_date', weekEnd);

      // 2. Aggregate weekly BOQ progress
      const boqMap = new Map<
        string,
        {
          boq_item_id: string;
          item_code: string;
          description_ar: string;
          unit: string;
          week_qty: number;
          contract_qty: number;
          rate_egp: number;
        }
      >();

      const photos: { photo_url: string; caption?: string; date: string }[] = [];
      const obstructionsRaw: Array<{ obstruction_type: ObstructionType; responsible_party: string; idle_manpower?: number | null; description?: string | null }> = [];

      (dailyReports || []).forEach((rep) => {
        (rep.lines || []).forEach((line) => {
          // Supabase infers the joined relation as an array, but at runtime it is a single object.
          const item = line.boq_item as unknown as WeeklyBoqItem | null;
          if (item) {
            const existing = boqMap.get(item.id) || {
              boq_item_id: item.id,
              item_code: item.item_code,
              description_ar: item.description_ar,
              unit: item.unit,
              week_qty: 0,
              contract_qty: item.contract_qty,
              rate_egp: line.snapshot_rate_egp || item.rate_egp,
            };
            existing.week_qty += Number(line.qty_today || 0);
            boqMap.set(item.id, existing);
          }
        });

        (rep.photos || []).forEach((p: { storage_path?: string | null; photo_url?: string | null; caption?: string }) => {
          const sourceKey = p.storage_path || p.photo_url;
          if (sourceKey) {
            photos.push({
              photo_url: sourceKey,
              caption: p.caption,
              date: rep.progress_date,
            });
          }
        });

        (rep.obstructions || []).forEach((obs) => {
          obstructionsRaw.push(obs);
        });
      });

      if (photos.length > 0) {
        const signedPhotoUrls = await getSignedStorageUrls(
          'progress-photos',
          photos.map((p) => p.photo_url),
          3600
        );
        for (const photoItem of photos) {
          const signed = signedPhotoUrls.get(photoItem.photo_url);
          if (signed) {
            photoItem.photo_url = signed;
          }
        }
      }

      const weekly_boq_progress = Array.from(boqMap.values()).map((b) => ({
        boq_item_id: b.boq_item_id,
        item_code: b.item_code,
        description_ar: b.description_ar,
        unit: b.unit,
        week_qty: Number(b.week_qty.toFixed(2)),
        cumulative_qty: Number(b.week_qty.toFixed(2)),
        contract_qty: b.contract_qty,
        earned_egp: Number((b.week_qty * b.rate_egp).toFixed(2)),
      }));

      // Group obstructions by type & responsible party
      interface ObstructionSummaryItem {
        type: ObstructionType;
        responsible_party: string;
        count: number;
        total_idle_manpower: number;
        description_list: string[];
      }
      const obstructionGroups = new Map<string, ObstructionSummaryItem>();
      obstructionsRaw.forEach((obs) => {
        const key = `${obs.obstruction_type}_${obs.responsible_party}`;
        const group: ObstructionSummaryItem = obstructionGroups.get(key) || {
          type: obs.obstruction_type,
          responsible_party: obs.responsible_party,
          count: 0,
          total_idle_manpower: 0,
          description_list: [] as string[],
        };
        group.count += 1;
        group.total_idle_manpower += Number(obs.idle_manpower || 0);
        if (obs.description) group.description_list.push(String(obs.description));
        obstructionGroups.set(key, group);
      });

      const obstructions_summary = Array.from(obstructionGroups.values());

      // 3. Fetch lookahead activities (starting within next 14 days)
      const lookaheadDate = new Date(weekEnd);
      lookaheadDate.setDate(lookaheadDate.getDate() + 14);
      const lookaheadDateStr = lookaheadDate.toISOString().slice(0, 10);

      const { data: lookaheads } = await supabase
        .from('pm_project_activities')
        .select('activity_code, name_ar, planned_start, planned_finish')
        .eq('project_id', projectId)
        .gte('planned_start', weekStart)
        .lte('planned_start', lookaheadDateStr)
        .order('planned_start', { ascending: true })
        .limit(10);

      const lookahead_activities = (lookaheads || []).map((la) => ({
        activity_code: la.activity_code,
        name_ar: la.name_ar,
        planned_start: la.planned_start,
        planned_finish: la.planned_finish,
        readiness: {
          drawings: true,
          materials: true,
          subcontractor: true,
        },
      }));

      // 4. Compute S-curve point at weekEnd
      const scurvePoints = await WeeklyReportService.getScurveData(projectId);
      const latestPoint = scurvePoints.find((p) => p.date === weekEnd) ||
        scurvePoints[scurvePoints.length - 1] || {
          date: weekEnd,
          planned_pct: 0,
          actual_pct: 0,
          earned_egp: 0,
          planned_egp: 0,
        };

      // Empty-data guard: absolutely nothing to report for this period → friendly typed error.
      if (
        weekly_boq_progress.length === 0 &&
        photos.length === 0 &&
        obstructions_summary.length === 0 &&
        lookahead_activities.length === 0 &&
        scurvePoints.length === 0
      ) {
        throw new WeeklyReportEmptyError();
      }

      const aggregates: WeeklyReportAggregates = {
        weekly_boq_progress,
        obstructions_summary,
        photos,
        scurve_point: latestPoint,
        lookahead_activities,
        milestones_status: [],
      };

      // Bind the report to its schedule version inside the aggregates JSONB snapshot.
      const aggregatesWithVersion = (
        opts?.scheduleVersion
          ? { ...aggregates, schedule_version: opts.scheduleVersion }
          : aggregates
      ) as WeeklyReportAggregatesWithVersion;

      const payload = {
        project_id: projectId,
        week_start: weekStart,
        week_end: weekEnd,
        status: 'draft',
        aggregates: aggregatesWithVersion,
        generated_by: generatedBy || null,
        generated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('pm_weekly_reports')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      appCache.invalidate(`weeklyReports:${projectId}`);
      return data;
    } catch (err) {
      if (err instanceof WeeklyReportEmptyError) throw err; // propagate typed empty-data error for friendly UI handling
      console.error('WeeklyReportService.generateWeeklyReport error:', err);
      return null;
    }
  }

  /**
   * Finalize a weekly report.
   */
  static async finalizeWeeklyReport(
    id: string,
    projectId: string,
    finalizedBy?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('pm_weekly_reports')
        .update({
          status: 'finalized',
          finalized_by: finalizedBy || null,
          finalized_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      appCache.invalidate(`weeklyReports:${projectId}`);
      appCache.invalidate(`weeklyReports:detail:${id}`);
      return true;
    } catch (err) {
      console.error('WeeklyReportService.finalizeWeeklyReport error:', err);
      return false;
    }
  }

  /**
   * Compute full project S-Curve data points.
   */
  static async getScurveData(projectId: string): Promise<ScurvePoint[]> {
    const key = CACHE_KEYS.allocation.scurve(projectId);
    return appCache.getOrFetch(key, TTL.planning, async () => {
      try {
        // 1. Fetch activities with planned dates and budgeted cost
        const { data: activities } = await supabase
          .from('pm_project_activities')
          .select('activity_code, planned_start, planned_finish, budgeted_cost_egp')
          .eq('project_id', projectId)
          .eq('is_archived', false);

        if (!activities || activities.length === 0) return [];

        // Determine project start and finish boundaries
        let minStart = activities[0].planned_start;
        let maxFinish = activities[0].planned_finish;
        for (const act of activities) {
          if (act.planned_start < minStart) minStart = act.planned_start;
          if (act.planned_finish > maxFinish) maxFinish = act.planned_finish;
        }

        // 2. Fetch actual earned allocations with dates
        const { data: allocations } = await supabase
          .from('pm_progress_allocations')
          .select(`
            allocated_qty,
            snapshot_rate_egp,
            created_at,
            line:pm_daily_progress_lines(
              daily_progress:pm_daily_progress(progress_date)
            )
          `)
          .eq('project_id', projectId)
          .eq('is_suspended', false);

        const earnedPoints: { date: string; earned_egp: number }[] = [];
        // Supabase infers the nested relation as arrays, but at runtime they are single objects.
        ((allocations || []) as unknown as WeeklyAllocationRow[]).forEach((a) => {
          const repDate = a.line?.daily_progress?.progress_date || a.created_at?.slice(0, 10);
          if (repDate) {
            earnedPoints.push({
              date: repDate,
              earned_egp: Number(a.allocated_qty || 0) * Number(a.snapshot_rate_egp || 0),
            });
          }
        });

        return generateScurveData(activities, earnedPoints, minStart, maxFinish);
      } catch (err) {
        console.error('WeeklyReportService.getScurveData exception:', err);
        return [];
      }
    });
  }

  /**
   * Fetch commercial settings for a project.
   */
  static async getCommercialSettings(projectId: string): Promise<CommercialSettings> {
    const key = CACHE_KEYS.weeklyReport.commercialSettings(projectId);
    return appCache.getOrFetch(key, TTL.reference, async () => {
      try {
        const { data, error } = await supabase
          .from('pm_commercial_settings')
          .select('*')
          .eq('project_id', projectId)
          .single();

        if (error || !data) {
          return {
            project_id: projectId,
            retention_pct: 0.0,
            advance_amortization_pct: 0.0,
            other_deductions_pct: 0.0,
            waste_alert_threshold_pct: 5.0,
            week_start_day: 6,
            weekly_send_day: 4,
          };
        }
        return data;
      } catch (err) {
        return {
          project_id: projectId,
          retention_pct: 0.0,
          advance_amortization_pct: 0.0,
          other_deductions_pct: 0.0,
          waste_alert_threshold_pct: 5.0,
          week_start_day: 6,
          weekly_send_day: 4,
        };
      }
    });
  }

  /**
   * Save commercial settings for a project.
   */
  static async saveCommercialSettings(
    settings: Partial<CommercialSettings>
  ): Promise<CommercialSettings | null> {
    try {
      if (!settings.project_id) throw new Error('project_id is required');

      const payload = {
        project_id: settings.project_id,
        retention_pct: settings.retention_pct ?? 0.0,
        advance_amortization_pct: settings.advance_amortization_pct ?? 0.0,
        other_deductions_pct: settings.other_deductions_pct ?? 0.0,
        waste_alert_threshold_pct: settings.waste_alert_threshold_pct ?? 5.0,
        week_start_day: settings.week_start_day ?? 6,
        weekly_send_day: settings.weekly_send_day ?? 4,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('pm_commercial_settings')
        .upsert(payload, { onConflict: 'project_id' })
        .select()
        .single();

      if (error) throw error;

      appCache.invalidate(`commercialSettings:${settings.project_id}`);
      return data;
    } catch (err) {
      console.error('WeeklyReportService.saveCommercialSettings error:', err);
      return null;
    }
  }
}
