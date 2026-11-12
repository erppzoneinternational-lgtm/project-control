import { supabase } from '@/lib/supabase';
import { appCache } from '@/lib/cache';
import { logger } from '@/lib/logger';
import { CostSnapshot, BudgetLine, CostControlSummary } from '@/types/cost-control';

/**
 * Checks whether a database error indicates a missing table or missing schema cache entry in Supabase/PostgREST.
 */
function isTableMissingError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { code?: string; message?: string; details?: string };
  return (
    err.code === 'PGRST205' ||
    err.code === '42P01' ||
    Boolean(
      err.message &&
        (err.message.includes('schema cache') ||
          err.message.includes('does not exist') ||
          err.message.includes('relation "public.pm_cost_snapshots"') ||
          err.message.includes('relation "public.pm_budget_lines"'))
    )
  );
}

export class CostControlService {
  /**
   * Fetches historical and current cost snapshots for EVM trends and S-Curve.
   * If table is missing or empty, computes a live EVM snapshot so the UI never crashes.
   */
  static async getCostSnapshots(projectId: string): Promise<CostSnapshot[]> {
    const cacheKey = `costSnapshots:${projectId}`;

    const fetcher = async () => {
      try {
        const { data, error } = await supabase
          .from('pm_cost_snapshots')
          .select('*')
          .eq('project_id', projectId)
          .order('snapshot_date', { ascending: true });

        if (error) {
          if (isTableMissingError(error)) {
            logger.warn('pm_cost_snapshots table not in DB or cache, calculating live EVM', { projectId });
            const live = await this.calculateLiveEVM(projectId);
            return live ? [live] : [];
          }
          throw error;
        }

        if (!data || data.length === 0) {
          const live = await this.calculateLiveEVM(projectId);
          return live ? [live] : [];
        }

        return data as CostSnapshot[];
      } catch (error) {
        logger.warn('Error fetching cost snapshots, falling back to live EVM', { projectId, error });
        const live = await this.calculateLiveEVM(projectId);
        return live ? [live] : [];
      }
    };

    return appCache.getOrFetch(cacheKey, fetcher, 30_000);
  }

  /**
   * Fetches the latest EVM snapshot for key KPI cards.
   */
  static async getLatestSnapshot(projectId: string): Promise<CostSnapshot | null> {
    try {
      const { data, error } = await supabase
        .from('pm_cost_snapshots')
        .select('*')
        .eq('project_id', projectId)
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        if (isTableMissingError(error)) {
          return await this.calculateLiveEVM(projectId);
        }
        throw error;
      }

      return data ? (data as CostSnapshot) : await this.calculateLiveEVM(projectId);
    } catch (error) {
      logger.warn('Error fetching latest cost snapshot, falling back to live EVM', { projectId, error });
      return await this.calculateLiveEVM(projectId);
    }
  }

  /**
   * Saves a cost snapshot. Gracefully handles missing database table.
   */
  static async saveCostSnapshot(snapshot: Partial<CostSnapshot>): Promise<CostSnapshot | null> {
    try {
      const { data, error } = await supabase
        .from('pm_cost_snapshots')
        .insert([snapshot])
        .select()
        .single();

      if (error) {
        if (isTableMissingError(error)) {
          logger.warn('pm_cost_snapshots table missing in DB, retaining snapshot in memory', { snapshot });
          return {
            id: `snap_${Date.now()}`,
            ...snapshot,
          } as CostSnapshot;
        }
        throw error;
      }

      if (snapshot.project_id) {
        appCache.invalidate(`costSnapshots:${snapshot.project_id}`);
      }
      return data as CostSnapshot;
    } catch (error) {
      logger.error('Error saving cost snapshot', { snapshot, error });
      return {
        id: `snap_${Date.now()}`,
        ...snapshot,
      } as CostSnapshot;
    }
  }

  /**
   * Fetches budget lines per cost code/package.
   * If table is missing or empty, synthesizes budget lines from activities or BOQ items.
   */
  static async getBudgetLines(projectId: string): Promise<BudgetLine[]> {
    const cacheKey = `budgetLines:${projectId}`;

    const fetcher = async () => {
      try {
        const { data, error } = await supabase
          .from('pm_budget_lines')
          .select('*')
          .eq('project_id', projectId);

        if (error) {
          if (isTableMissingError(error)) {
            logger.warn('pm_budget_lines table not in DB or cache, generating fallback lines', { projectId });
            return await this.generateFallbackBudgetLines(projectId);
          }
          throw error;
        }

        if (!data || data.length === 0) {
          return await this.generateFallbackBudgetLines(projectId);
        }

        return data as BudgetLine[];
      } catch (error) {
        logger.warn('Error fetching budget lines, generating fallback lines', { projectId, error });
        return await this.generateFallbackBudgetLines(projectId);
      }
    };

    return appCache.getOrFetch(cacheKey, fetcher, 30_000);
  }

  /**
   * Saves a budget line. Gracefully handles missing database table.
   */
  static async saveBudgetLine(line: Partial<BudgetLine>): Promise<BudgetLine | null> {
    try {
      const query = supabase.from('pm_budget_lines');

      let result;
      if (line.id && !line.id.startsWith('b_') && !line.id.startsWith('act_')) {
        result = await query.update(line).eq('id', line.id).select().single();
      } else {
        result = await query.insert([line]).select().single();
      }

      if (result.error) {
        if (isTableMissingError(result.error)) {
          logger.warn('pm_budget_lines table missing in DB, returning updated line in memory', { line });
          return {
            id: line.id || `line_${Date.now()}`,
            ...line,
          } as BudgetLine;
        }
        throw result.error;
      }

      if (line.project_id) {
        appCache.invalidate(`budgetLines:${line.project_id}`);
      }
      return result.data as BudgetLine;
    } catch (error) {
      logger.error('Error saving budget line', { line, error });
      return {
        id: line.id || `line_${Date.now()}`,
        ...line,
      } as BudgetLine;
    }
  }

  /**
   * Provides the executive EVM summary.
   */
  static async getCostControlSummary(projectId: string): Promise<CostControlSummary> {
    const [snapshot, lines] = await Promise.all([
      this.getLatestSnapshot(projectId),
      this.getBudgetLines(projectId),
    ]);

    const totalBudget = lines.reduce((sum, line) => sum + (line.current_budget || 0), snapshot?.budget_at_completion || 0);
    const totalActualCost = lines.reduce((sum, line) => sum + (line.actual_cost || 0), snapshot?.actual_cost || 0);

    return {
      totalBudget: totalBudget > 0 ? totalBudget : snapshot?.budget_at_completion || 0,
      totalActualCost: totalActualCost > 0 ? totalActualCost : snapshot?.actual_cost || 0,
      totalEarnedValue: snapshot?.earned_value || 0,
      totalPlannedValue: snapshot?.planned_value || 0,
      overallSPI: snapshot?.spi ?? 1,
      overallCPI: snapshot?.cpi ?? 1,
      overallSV: snapshot?.sv ?? 0,
      overallCV: snapshot?.cv ?? 0,
      eac: snapshot?.eac || (totalBudget > 0 ? totalBudget : 0),
      etc: snapshot?.etc || 0,
      contingencyUsed: 0,
      contingencyRemaining: 0,
    };
  }

  /**
   * Synthesizes budget breakdown lines from project activities, boq_items, or project contract value.
   */
  static async generateFallbackBudgetLines(projectId: string): Promise<BudgetLine[]> {
    try {
      const now = new Date().toISOString();

      // 1. Check pm_project_activities
      const { data: activities } = await supabase
        .from('pm_project_activities')
        .select('*')
        .eq('project_id', projectId)
        .limit(50);

      if (activities && activities.length > 0) {
        return activities.map((act: Record<string, unknown>) => {
          const b = Number(act.budgeted_cost_egp ?? act.budgeted_cost ?? 0);
          const p = Number(act.progress_pct ?? act.percent_complete ?? 0);
          const ac = b * (p / 100);
          const nameAr = String(act.name_ar || act.activity_name_ar || act.name || act.activity_name_en || 'بند نشاط تنفيذي');
          const nameEn = act.name_en || act.activity_name_en ? String(act.name_en || act.activity_name_en) : null;
          return {
            id: String(act.id || `act_${Math.random()}`),
            project_id: projectId,
            cost_code_id: String(act.activity_code || act.code || 'ACT'),
            description_ar: nameAr,
            description_en: nameEn,
            original_budget: b,
            approved_changes: 0,
            current_budget: b,
            committed_cost: 0,
            actual_cost: ac,
            forecast_cost: b,
            variance: 0,
            created_at: now,
            updated_at: now,
          };
        });
      }

      // 2. Check pm_boq_items
      const { data: boqItems } = await supabase
        .from('pm_boq_items')
        .select('*')
        .eq('project_id', projectId)
        .limit(30);

      if (boqItems && boqItems.length > 0) {
        return boqItems.map((b: Record<string, unknown>) => {
          const qty = Number(b.contract_qty ?? b.quantity ?? 0);
          const rate = Number(b.rate_egp ?? b.unit_price ?? 0);
          const amt = Number(b.amount_egp ?? b.total_amount ?? b.total_price ?? (qty * rate || 0));
          return {
            id: String(b.id || `boq_${Math.random()}`),
            project_id: projectId,
            cost_code_id: String(b.item_code || 'BOQ'),
            description_ar: String(b.description_ar || b.description || 'بند مقايسة تعاقدية'),
            description_en: b.description_en ? String(b.description_en) : null,
            original_budget: amt,
            approved_changes: 0,
            current_budget: amt,
            committed_cost: 0,
            actual_cost: 0,
            forecast_cost: amt,
            variance: 0,
            created_at: now,
            updated_at: now,
          };
        });
      }

      // 3. Synthesize standard commercial packages from pm_projects
      const { data: project } = await supabase
        .from('pm_projects')
        .select('contract_value, contract_value_egp, vos_value, estimated_budget, completion_pct')
        .eq('id', projectId)
        .maybeSingle();

      const total = Number(project?.contract_value || project?.contract_value_egp || project?.estimated_budget || 0);
      const comp = Number(project?.completion_pct || 0);

      if (total > 0) {
        const civil = Math.round(total * 0.45);
        const mep = Math.round(total * 0.40);
        const finishes = Math.max(0, total - civil - mep);

        return [
          {
            id: `b_civil_${projectId}`,
            project_id: projectId,
            cost_code_id: '01-CIVIL',
            description_ar: 'حزمة الأعمال الإنشائية والمدنية',
            description_en: 'Civil & Structural Works Package',
            original_budget: civil,
            approved_changes: 0,
            current_budget: civil,
            committed_cost: 0,
            actual_cost: Math.round(civil * (comp / 100)),
            forecast_cost: civil,
            variance: 0,
            created_at: now,
            updated_at: now,
          },
          {
            id: `b_mep_${projectId}`,
            project_id: projectId,
            cost_code_id: '02-MEP',
            description_ar: 'حزمة الأعمال الكهروميكانيكية',
            description_en: 'Electro-Mechanical Works Package',
            original_budget: mep,
            approved_changes: 0,
            current_budget: mep,
            committed_cost: 0,
            actual_cost: Math.round(mep * (comp / 100)),
            forecast_cost: mep,
            variance: 0,
            created_at: now,
            updated_at: now,
          },
          {
            id: `b_finishes_${projectId}`,
            project_id: projectId,
            cost_code_id: '03-FINISH',
            description_ar: 'حزمة التشطيبات والتجهيزات',
            description_en: 'Finishes & Architectural Works Package',
            original_budget: finishes,
            approved_changes: 0,
            current_budget: finishes,
            committed_cost: 0,
            actual_cost: Math.round(finishes * (comp / 100)),
            forecast_cost: finishes,
            variance: 0,
            created_at: now,
            updated_at: now,
          },
        ];
      }

      return [];
    } catch (err) {
      logger.warn('generateFallbackBudgetLines error:', { detail: err });
      return [];
    }
  }

  /**
   * Computes an authoritative live EVM snapshot directly from live project data.
   */
  static async calculateLiveEVM(projectId: string): Promise<CostSnapshot | null> {
    try {
      if (!projectId) return null;

      // 1. Fetch budget lines for BAC & AC
      const lines = await this.getBudgetLines(projectId);
      let totalBudget = lines.reduce((sum, line) => sum + (line.current_budget || 0), 0);
      let actualCost = lines.reduce((sum, line) => sum + (line.actual_cost || 0), 0);

      // 2. Fetch project record for high-level values if not available in lines
      const { data: project } = await supabase
        .from('pm_projects')
        .select('*')
        .eq('id', projectId)
        .maybeSingle();

      const contractVal = Number(project?.contract_value || project?.contract_value_egp || 0);
      const vosVal = Number(project?.vos_value || 0);
      const estBudget = Number(project?.estimated_budget || project?.estimated_cost || 0);
      if (totalBudget === 0) {
        totalBudget = estBudget > 0 ? estBudget : contractVal + vosVal;
      }
      const completionPct = Number(project?.completion_pct || 0);

      // 3. Fetch project activities for granular EV calculation
      const { data: activities } = await supabase
        .from('pm_project_activities')
        .select('*')
        .eq('project_id', projectId);

      let earnedValue = 0;
      let plannedValue = 0;
      const todayStr = new Date().toISOString().slice(0, 10);

      if (activities && activities.length > 0) {
        const actBudgetSum = activities.reduce(
          (sum, a: Record<string, unknown>) => sum + Number(a.budgeted_cost_egp ?? a.budgeted_cost ?? 0),
          0
        );
        if (totalBudget === 0 && actBudgetSum > 0) {
          totalBudget = actBudgetSum;
        }

        earnedValue = activities.reduce((sum, a: Record<string, unknown>) => {
          const b = Number(a.budgeted_cost_egp ?? a.budgeted_cost ?? 0);
          const p = Number(a.progress_pct ?? a.percent_complete ?? 0);
          return sum + (b * (p / 100));
        }, 0);

        plannedValue = activities.reduce((sum, a: Record<string, unknown>) => {
          const b = Number(a.budgeted_cost_egp ?? a.budgeted_cost ?? 0);
          const pFinish = typeof a.planned_finish === 'string' ? a.planned_finish : null;
          const pStart = typeof a.planned_start === 'string' ? a.planned_start : null;
          if (!pStart || !pFinish) return sum;
          if (todayStr >= pFinish) return sum + b;
          if (todayStr <= pStart) return sum;
          const totalDays = Math.max(1, (new Date(pFinish).getTime() - new Date(pStart).getTime()) / 86400000);
          const elapsedDays = Math.max(0, (new Date(todayStr).getTime() - new Date(pStart).getTime()) / 86400000);
          const plannedPct = Math.min(1, elapsedDays / totalDays);
          return sum + (b * plannedPct);
        }, 0);
      }

      // If no activities, calculate from project completion_pct
      if (earnedValue === 0 && totalBudget > 0 && completionPct > 0) {
        earnedValue = Math.round(totalBudget * (completionPct / 100));
        plannedValue = earnedValue; // baseline approximation
      }

      // 4. Fetch Actual Cost from approved daily progress if lines don't have AC
      if (actualCost === 0) {
        try {
          const { data: approvedLines } = await supabase
            .from('pm_daily_progress_lines')
            .select('qty_today, snapshot_rate_egp, daily_progress!inner(project_id)')
            .eq('daily_progress.project_id', projectId)
            .eq('line_status', 'approved');

          actualCost = (approvedLines || []).reduce(
            (sum: number, l) => sum + (Number(l.qty_today || 0) * Number(l.snapshot_rate_egp || 0)),
            0
          );
        } catch {
          // Daily progress lines table might not have join or records
        }
      }

      if (actualCost === 0 && earnedValue > 0) {
        actualCost = earnedValue;
      }

      const spi = plannedValue > 0 ? Number((earnedValue / plannedValue).toFixed(4)) : 1;
      const cpi = actualCost > 0 ? Number((earnedValue / actualCost).toFixed(4)) : 1;
      const sv = Number((earnedValue - plannedValue).toFixed(2));
      const cv = Number((earnedValue - actualCost).toFixed(2));
      const eac = cpi > 0 ? Number((totalBudget / cpi).toFixed(2)) : totalBudget;
      const etc = Number((eac - actualCost).toFixed(2));
      const vac = Number((totalBudget - eac).toFixed(2));
      const tcpi = (totalBudget - actualCost) > 0
        ? Number(((totalBudget - earnedValue) / (totalBudget - actualCost)).toFixed(4))
        : 1;

      return {
        id: `snap_${projectId}_${todayStr}`,
        project_id: projectId,
        snapshot_date: todayStr,
        budget_at_completion: totalBudget,
        actual_cost: actualCost,
        earned_value: earnedValue,
        planned_value: plannedValue,
        spi,
        cpi,
        sv,
        cv,
        eac,
        etc,
        vac,
        tcpi,
        created_at: new Date().toISOString(),
      };
    } catch (err) {
      logger.error('calculateLiveEVM error:', { detail: err });
      return null;
    }
  }

  /**
   * ADR-0010: Recalculate EVM metrics and persist a daily cost snapshot in pm_cost_snapshots.
   * Debounced to 1 authoritative snapshot per day per project.
   */
  static async recalculateAndSaveSnapshot(projectId: string): Promise<CostSnapshot | null> {
    try {
      if (!projectId) return null;

      const liveSnap = await this.calculateLiveEVM(projectId);
      if (!liveSnap) return null;

      const todayStr = liveSnap.snapshot_date || new Date().toISOString().slice(0, 10);

      const snapshotPayload: Partial<CostSnapshot> = {
        project_id: projectId,
        snapshot_date: todayStr,
        budget_at_completion: liveSnap.budget_at_completion,
        actual_cost: liveSnap.actual_cost,
        earned_value: liveSnap.earned_value,
        planned_value: liveSnap.planned_value,
        spi: liveSnap.spi,
        cpi: liveSnap.cpi,
        sv: liveSnap.sv,
        cv: liveSnap.cv,
        eac: liveSnap.eac,
        etc: liveSnap.etc,
        vac: liveSnap.vac,
        tcpi: liveSnap.tcpi,
        created_at: new Date().toISOString(),
      };

      try {
        const { data, error } = await supabase
          .from('pm_cost_snapshots')
          .upsert(snapshotPayload, { onConflict: 'project_id,snapshot_date' })
          .select()
          .single();

        if (error) {
          if (isTableMissingError(error)) {
            logger.warn('pm_cost_snapshots table missing in DB, retaining computed snapshot in cache', { detail: error });
            appCache.set(`costSnapshots:${projectId}`, [liveSnap], 30_000);
            return liveSnap;
          }
          throw error;
        }

        appCache.invalidate(`costSnapshots:${projectId}`);
        return data as CostSnapshot;
      } catch (upsertErr) {
        if (isTableMissingError(upsertErr)) {
          logger.warn('pm_cost_snapshots table missing, returning in-memory snapshot', { detail: upsertErr });
          appCache.set(`costSnapshots:${projectId}`, [liveSnap], 30_000);
          return liveSnap;
        }
        throw upsertErr;
      }
    } catch (err) {
      logger.error('CostControlService.recalculateAndSaveSnapshot error:', { detail: err });
      return await this.calculateLiveEVM(projectId);
    }
  }
}
