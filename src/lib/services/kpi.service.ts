import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabase/unwrap';
import { appCache, TTL } from '@/lib/cache';
import {
  TOEngineerKPIs,
  SiteProductivityKPIs,
  PortfolioExecutiveKPIs,
  UnifiedObstructionType,
} from '@/types/planning';
import { logger } from '@/lib/logger';

export const UNIFIED_TAXONOMY_LABELS_AR: Record<UnifiedObstructionType, string> = {
  owner_directive: 'توجيهات المالك / أمر تغيير',
  weather: 'الأحوال الجوية والطقس',
  material_delay: 'تأخر توريد / اعتماد المواد',
  drawing_delay: 'تأخر اعتماد / إصدار المخططات',
  subcontractor: 'تعثر / تأخر مقاول الباطن',
  permit_authority: 'تراخيص وموافقات الجهات الحكومية',
  equipment: 'أعطال / نقص المعدات',
  manpower: 'نقص العمالة / الإنتاجية',
  safety: 'ملاحظات واشتراطات السلامة (HSE)',
  access: 'عوائق الوصول وتسليم الموقع',
  other: 'أسباب أخرى',
};

const ALL_TAXONOMY_TYPES: UnifiedObstructionType[] = [
  'owner_directive',
  'weather',
  'material_delay',
  'drawing_delay',
  'subcontractor',
  'permit_authority',
  'equipment',
  'manpower',
  'safety',
  'access',
  'other',
];

// Pure calculation helper functions (testable independently)
export const calculateRate = (numerator: number, denominator: number): number => {
  if (!denominator || denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
};

export const calculateAverageDuration = (
  items: { work_started_at?: string | null; completed_at?: string | null }[]
): number => {
  const durations = items
    .filter((i) => i.work_started_at && i.completed_at)
    .map((i) => {
      const start = new Date(i.work_started_at!).getTime();
      const end = new Date(i.completed_at!).getTime();
      return Math.max(0, (end - start) / (1000 * 60 * 60 * 24));
    });

  if (durations.length === 0) return 0;
  const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
  return Math.round(avg * 10) / 10;
};

export class KpiService {
  /**
   * Compute TO Engineer specific KPIs for a time window or all time.
   */
  static async getTOEngineerKPIs(
    stakeholderId: string,
    options?: { startDate?: string; endDate?: string; projectId?: string }
  ): Promise<TOEngineerKPIs> {
    if (!stakeholderId) {
      return {
        stakeholder_id: '',
        total_assigned: 0,
        total_completed: 0,
        in_progress_count: 0,
        on_time_delivery_rate_pct: 0,
        code_cd_revision_rate_pct: 0,
        first_pass_approval_rate_pct: 0,
        average_completion_duration_days: 0,
        total_drawings_approved: 0,
        items_with_code_c: 0,
      };
    }

    const cacheKey = `kpi:to:${stakeholderId}:${JSON.stringify(options || {})}`;

    return appCache.getOrFetch(cacheKey, TTL.planning || 30000, async () => {
      try {
        // Query items assigned to stakeholder
        let query = supabase
          .from('pm_deliverable_items')
          .select(`
            *,
            deliverable:pm_deliverables!inner(id, ref_code, title_ar, project_id, due_date)
          `)
          .eq('assigned_stakeholder_id', stakeholderId);

        if (options?.projectId) {
          query = query.eq('deliverable.project_id', options.projectId);
        }

        if (options?.startDate) {
          query = query.gte('created_at', options.startDate);
        }

        if (options?.endDate) {
          query = query.lte('created_at', options.endDate);
        }

        const { data: items, error } = await query;

        if (error) {
          logger.warn('KpiService.getTOEngineerKPIs error:', { detail: error });
          throw error;
        }

        const allItems = items || [];
        const totalAssigned = allItems.length;

        const completedItems = allItems.filter(
          (i) => i.status === 'approved' || i.status === 'returned' || i.status === 'ready_to_return'
        );
        const inProgressItems = allItems.filter((i) => i.status === 'in_progress');
        const blockedItems = allItems.filter((i) => i.status === 'blocked');

        // On-Time Delivery: completed before due_date or with no due_date
        const onTimeCompleted = completedItems.filter((i) => {
          const dueDate = i.due_date || i.deliverable?.due_date;
          if (!dueDate || !i.completed_at) return true;
          return new Date(i.completed_at) <= new Date(dueDate);
        }).length;

        const onTimeRate = calculateRate(onTimeCompleted, completedItems.length || totalAssigned);

        // Code C/D revision rate
        const reviewedByConsultant = allItems.filter(
          (i) => i.consultant_status && i.consultant_status !== 'pending'
        );
        const codeCDItems = reviewedByConsultant.filter(
          (i) => i.consultant_status === 'C' || i.consultant_status === 'D'
        );
        const codeCDRate = calculateRate(codeCDItems.length, reviewedByConsultant.length);

        // First-Pass Approval Rate: consultant_status in ('A', 'B') on first submission (submission_revision <= 1 or current_rev <= 1)
        const firstSubmissions = allItems.filter(
          (i) => (i.submission_revision === 1 || i.current_rev === 1) && i.consultant_status && i.consultant_status !== 'pending'
        );
        const firstPassApproved = firstSubmissions.filter(
          (i) => i.consultant_status === 'A' || i.consultant_status === 'B'
        );
        const firstPassRate = calculateRate(firstPassApproved.length, firstSubmissions.length);

        // Average Duration in days
        const avgDuration = calculateAverageDuration(completedItems);

        // Approved drawings
        const approvedDrawings = completedItems.filter(
          (i) => i.item_type === 'drawing' && (i.to_manager_approved || i.consultant_status === 'A' || i.consultant_status === 'B')
        ).length;

        // Items with Code C
        const codeCItemsCount = allItems.filter((i) => i.consultant_status === 'C').length;

        return {
          stakeholder_id: stakeholderId,
          total_assigned: totalAssigned,
          total_completed: completedItems.length,
          in_progress_count: inProgressItems.length,
          blocked_count: blockedItems.length,
          on_time_delivery_rate_pct: onTimeRate,
          code_cd_revision_rate_pct: codeCDRate,
          first_pass_approval_rate_pct: firstPassRate,
          average_completion_duration_days: avgDuration,
          total_drawings_approved: approvedDrawings,
          items_with_code_c: codeCItemsCount,
          code_ab_items: reviewedByConsultant.length - codeCDItems.length,
          code_c_items: codeCItemsCount,
          code_d_items: codeCDItems.length - codeCItemsCount,
          completion_rate_pct: calculateRate(completedItems.length, totalAssigned),
          rejection_rate_pct: codeCDRate,
        };
      } catch (err) {
        logger.warn('KpiService.getTOEngineerKPIs exception:', { detail: err });
        throw err;
      }
    });
  }

  /**
   * Compute Site Productivity and Obstruction metrics for a project.
   */
  static async getProjectSiteProductivity(
    projectId: string,
    options?: { periodDays?: number }
  ): Promise<SiteProductivityKPIs> {
    if (!projectId) {
      return {
        project_id: '',
        total_daily_reports: 0,
        average_daily_manpower: 0,
        total_idle_manpower_hours: 0,
        total_obstructions_count: 0,
        total_eot_claimed_days: 0,
        obstructions_by_taxonomy: ALL_TAXONOMY_TYPES.map((type) => ({
          type,
          type_label_ar: UNIFIED_TAXONOMY_LABELS_AR[type] || type,
          count: 0,
          idle_hours: 0,
          eot_days: 0,
        })),
        active_obstructions_count: 0,
      };
    }

    const cacheKey = `kpi:productivity:${projectId}:${options?.periodDays || 'all'}`;

    return appCache.getOrFetch(cacheKey, TTL.dailyProgress || 15000, async () => {
      try {
        let reportQuery = supabase
          .from('pm_daily_progress')
          .select('id, manpower_count, progress_date, created_at')
          .eq('project_id', projectId);

        let obsQuery = supabase
          .from('pm_daily_obstructions')
          .select('*')
          .eq('project_id', projectId);

        if (options?.periodDays) {
          const cutoff = new Date(Date.now() - options.periodDays * 86400000)
            .toISOString()
            .slice(0, 10);
          reportQuery = reportQuery.gte('progress_date', cutoff);
          obsQuery = obsQuery.gte('started_at', cutoff);
        }

        const [repRes, obsRes] = await Promise.all([
          reportQuery,
          obsQuery,
        ]);

        const reportList = unwrap(repRes, 'getProjectSiteProductivity reports') || [];
        const obsList = unwrap(obsRes, 'getProjectSiteProductivity obstructions') || [];

        const totalReports = reportList.length;
        const totalManpower = reportList.reduce(
          (sum, r) => sum + Number(r.manpower_count || 0),
          0
        );
        const avgManpower =
          totalReports > 0 ? Math.round((totalManpower / totalReports) * 10) / 10 : 0;

        const totalIdleManpower = obsList.reduce(
          (sum, o) => sum + Number(o.idle_manpower || 0),
          0
        );
        const totalIdleHours = totalIdleManpower * 8; // standard 8h shift

        const totalEotDays = obsList.reduce((sum, o) => sum + Number(o.eot_days || 0), 0);
        const activeObstructions = obsList.filter((o) => !o.resolved_at).length;

        // Breakdown by 11 taxonomy categories
        const taxonomyMap = new Map<
          string,
          { count: number; idle_hours: number; eot_days: number }
        >();
        ALL_TAXONOMY_TYPES.forEach((t) => taxonomyMap.set(t, { count: 0, idle_hours: 0, eot_days: 0 }));

        obsList.forEach((o) => {
          let typeKey = o.obstruction_type as UnifiedObstructionType;
          // Map legacy types if present
          if ((typeKey as string) === 'material_approval') typeKey = 'material_delay';
          if ((typeKey as string) === 'site_access') typeKey = 'access';
          if ((typeKey as string) === 'client_works') typeKey = 'owner_directive';
          if ((typeKey as string) === 'equipment_idle') typeKey = 'equipment';
          if ((typeKey as string) === 'labor_shortage') typeKey = 'manpower';

          if (!taxonomyMap.has(typeKey)) {
            typeKey = 'other';
          }

          const entry = taxonomyMap.get(typeKey)!;
          entry.count += 1;
          entry.idle_hours += Number(o.idle_manpower || 0) * 8;
          entry.eot_days += Number(o.eot_days || 0);
        });

        const obstructionsByTaxonomy = ALL_TAXONOMY_TYPES.map((type) => {
          const stats = taxonomyMap.get(type) || { count: 0, idle_hours: 0, eot_days: 0 };
          return {
            type,
            type_label_ar: UNIFIED_TAXONOMY_LABELS_AR[type] || type,
            count: stats.count,
            idle_hours: stats.idle_hours,
            eot_days: stats.eot_days,
          };
        });

        return {
          project_id: projectId,
          total_daily_reports: totalReports,
          average_daily_manpower: avgManpower,
          total_idle_manpower_hours: totalIdleHours,
          total_obstructions_count: obsList.length,
          total_eot_claimed_days: totalEotDays,
          obstructions_by_taxonomy: obstructionsByTaxonomy,
          active_obstructions_count: activeObstructions,
        };
      } catch (err) {
        logger.warn('KpiService.getProjectSiteProductivity exception:', { detail: err });
        throw err;
      }
    });
  }

  /**
   * Compute Executive Portfolio level KPIs across active projects.
   */
  static async getPortfolioKPIs(): Promise<PortfolioExecutiveKPIs> {
    const cacheKey = 'kpi:portfolio:executive';

    return appCache.getOrFetch(cacheKey, 30000, async () => {
      try {
        const [projRes, obsRes, delivRes] = await Promise.all([
          supabase.from('projects').select('id, name_ar, code, status'),
          supabase.from('pm_daily_obstructions').select('*'),
          supabase
            .from('pm_deliverable_items')
            .select('id, status, consultant_status, due_date, completed_at'),
        ]);

        const projects = unwrap(projRes, 'getPortfolioKPIs projects') || [];
        const obstructions = unwrap(obsRes, 'getPortfolioKPIs obstructions') || [];
        const deliverableItems = unwrap(delivRes, 'getPortfolioKPIs deliverables') || [];

        const projectList = projects.filter(
          (p) => p.status === 'working' || p.status === 'tender' || p.status === 'not_started'
        );
        const activeProjectsCount = projects.filter((p) => p.status === 'working').length;

        const allObs = obstructions;
        const allItems = deliverableItems;

        // Overall TO On-Time %
        const completedItems = allItems.filter(
          (i) => i.status === 'approved' || i.status === 'returned' || i.status === 'ready_to_return'
        );
        const onTimeItems = completedItems.filter((i) => {
          if (!i.due_date || !i.completed_at) return true;
          return new Date(i.completed_at) <= new Date(i.due_date);
        }).length;
        const overallOnTimeRate = calculateRate(onTimeItems, completedItems.length);

        // Overall Code C/D Revision Rate
        const consultantReviewed = allItems.filter(
          (i) => i.consultant_status && i.consultant_status !== 'pending'
        );
        const codeCDCount = consultantReviewed.filter(
          (i) => i.consultant_status === 'C' || i.consultant_status === 'D'
        ).length;
        const overallCodeCDRate = calculateRate(codeCDCount, consultantReviewed.length);

        // Total EOT Risk Days for unresolved obstructions
        const activeObs = allObs.filter((o) => !o.resolved_at);
        const totalEotRiskDays = activeObs.reduce((sum, o) => sum + Number(o.eot_days || 0), 0);

        // Top Delay Categories
        const categoryCounts = new Map<UnifiedObstructionType, number>();
        allObs.forEach((o) => {
          let t = o.obstruction_type as UnifiedObstructionType;
          if (!UNIFIED_TAXONOMY_LABELS_AR[t]) t = 'other';
          categoryCounts.set(t, (categoryCounts.get(t) || 0) + 1);
        });

        const topDelayCategories = Array.from(categoryCounts.entries())
          .map(([type, frequency]) => ({
            type,
            label_ar: UNIFIED_TAXONOMY_LABELS_AR[type] || type,
            frequency,
          }))
          .sort((a, b) => b.frequency - a.frequency)
          .slice(0, 5);

        // High Risk Projects: Projects with multiple open obstructions
        const projectObsCount = new Map<string, number>();
        activeObs.forEach((o) => {
          projectObsCount.set(o.project_id, (projectObsCount.get(o.project_id) || 0) + 1);
        });

        const highRiskProjects = projectList
          .map((p) => {
            const openObs = projectObsCount.get(p.id) || 0;
            return {
              project_id: p.id,
              name: p.name_ar || p.code || 'Project',
              spi: null, // TODO: compute real SPI from schedule/earned value data
              open_obstructions: openObs,
            };
          })
          .filter((p) => p.open_obstructions > 0)
          .sort((a, b) => b.open_obstructions - a.open_obstructions)
          .slice(0, 5);

        return {
          total_active_projects: activeProjectsCount || projectList.length,
          overall_to_on_time_pct: overallOnTimeRate,
          overall_code_cd_rate_pct: overallCodeCDRate,
          total_eot_risk_days: totalEotRiskDays,
          top_delay_categories: topDelayCategories,
          high_risk_projects: highRiskProjects,
        };
      } catch (err) {
        logger.warn('KpiService.getPortfolioKPIs exception:', { detail: err });
        throw err;
      }
    });
  }

  /**
   * Alias for getPortfolioKPIs.
   */
  static async getPortfolioExecutiveKPIs(): Promise<PortfolioExecutiveKPIs> {
    return this.getPortfolioKPIs();
  }

  /**
   * Alias for getProjectSiteProductivity.
   */
  static async getSiteProductivityKPIs(
    projectId: string,
    options?: { periodDays?: number }
  ): Promise<SiteProductivityKPIs> {
    return this.getProjectSiteProductivity(projectId, options);
  }
}

