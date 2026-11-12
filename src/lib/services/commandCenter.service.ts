import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/supabase/unwrap';
import { appCache, TTL } from '@/lib/cache';
import { MorningCommandCenterSummary } from '@/types/planning';
import {
  calculateMorningCommandCenter,
  calculateSubcontractorProductivity,
} from '@/lib/planning/calculations';
import { HoldsService } from './holds.service';
import { DeliverablesService } from './deliverables.service';
import { SubcontractorService } from './subcontractor.service';
import { logger } from '@/lib/logger';

export class CommandCenterService {
  /**
   * Get Morning Command Center summary for a specific project.
   */
  static async getMorningCommandCenterSummary(
    projectId: string,
    date?: string
  ): Promise<MorningCommandCenterSummary> {
    const targetDate = date || new Date().toISOString().slice(0, 10);
    const key = `commandCenter:project:${projectId}:${targetDate}`;

    return appCache.getOrFetch(key, TTL.dailyProgress, async () => {
      try {
        // 1. Fetch project
        const projRes = await supabase
          .from('projects')
          .select('id, project_code, project_name, project_name_ar, status')
          .eq('id', projectId)
          .single();

        if (projRes.error && projRes.error.code !== 'PGRST116') {
          throw new Error(`getMorningCommandCenterSummary project: ${projRes.error.message}`);
        }

        const project = projRes.data;
        const projects = project ? [project] : [{ id: projectId, project_name: projectId }];

        // 2. Fetch daily progress reports
        const repRes = await supabase
          .from('pm_daily_progress')
          .select('id, project_id, progress_date, status, manpower_count')
          .eq('project_id', projectId)
          .order('progress_date', { ascending: false });

        const reports = unwrap(repRes, 'getMorningCommandCenterSummary reports');

        // 3. Fetch active holds
        const holds = await HoldsService.getHolds(projectId, true);

        // 4. Fetch deliverables
        const deliverables = await DeliverablesService.getDeliverables(projectId);

        // 5. Fetch RFIs
        const rfis = await DeliverablesService.getRfiRegister(projectId);

        // 6. Fetch subcontractor metrics
        const subMetrics = await SubcontractorService.getSubcontractorProductivity(projectId);

        // 7. Calculate pure summary
        return calculateMorningCommandCenter({
          projects,
          reports: reports || [],
          holds: holds || [],
          deliverables: deliverables || [],
          rfis: rfis || [],
          subMetrics: subMetrics || [],
          targetDate,
        });
      } catch (err) {
        logger.error('CommandCenterService.getMorningCommandCenterSummary error:', { detail: err });
        throw err;
      }
    });
  }

  /**
   * Get Morning Command Center summary across the entire project portfolio.
   */
  static async getPortfolioCommandCenterSummary(
    date?: string
  ): Promise<MorningCommandCenterSummary> {
    const targetDate = date || new Date().toISOString().slice(0, 10);
    const key = `commandCenter:portfolio:${targetDate}`;

    return appCache.getOrFetch(key, TTL.dailyProgress, async () => {
      try {
        // Parallel fetch of portfolio data
        const [projRes, repRes, holdsRes, delivRes, rfiRes, targetsRes, linesRes] = await Promise.all([
          supabase
            .from('projects')
            .select('id, project_code, project_name, project_name_ar, status')
            .neq('status', 'finished'),
          supabase
            .from('pm_daily_progress')
            .select('id, project_id, progress_date, status, manpower_count')
            .order('progress_date', { ascending: false }),
          supabase
            .from('pm_holds')
            .select('*')
            .eq('is_active', true)
            .order('placed_at', { ascending: false }),
          supabase
            .from('pm_deliverables')
            .select(`
              *,
              items:pm_deliverable_items(*)
            `)
            .order('received_at', { ascending: false }),
          supabase
            .from('pm_rfi_register')
            .select('*')
            .order('sent_date', { ascending: false }),
          supabase
            .from('pm_subcontractor_targets')
            .select('*'),
          supabase
            .from('pm_daily_progress_lines')
            .select('id, boq_item_id, subcontractor_id, qty_today, line_status')
            .neq('line_status', 'rejected'),
        ]);

        const activeProjects = unwrap(projRes, 'portfolio projects') || [];
        const reports = unwrap(repRes, 'portfolio reports') || [];
        const holds = unwrap(holdsRes, 'portfolio holds') || [];
        const deliverables = unwrap(delivRes, 'portfolio deliverables') || [];
        const rfis = unwrap(rfiRes, 'portfolio rfis') || [];
        const targets = unwrap(targetsRes, 'portfolio targets') || [];
        const lines = unwrap(linesRes, 'portfolio lines') || [];

        // Compute subMetrics if targets exist
        let calculatedSubMetrics: ReturnType<typeof calculateSubcontractorProductivity> = [];
        if (targets && targets.length > 0) {
          calculatedSubMetrics = calculateSubcontractorProductivity(targets, lines, 0);
        }

        return calculateMorningCommandCenter({
          projects: activeProjects,
          reports,
          holds,
          deliverables,
          rfis,
          subMetrics: calculatedSubMetrics,
          targetDate,
        });
      } catch (err) {
        logger.error('CommandCenterService.getPortfolioCommandCenterSummary error:', { detail: err });
        throw err;
      }
    });
  }
}
