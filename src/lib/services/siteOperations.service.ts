import { supabase } from '@/lib/supabase';
import { appCache, TTL } from '@/lib/cache';
import { MosEntry, MosStatus } from '@/types/planning';
import {
  MaterialTransaction,
  MaterialWastageReport,
  MaterialWastageReportItem,
} from '@/types/boq';
import { calculateWastageLossEgp } from '@/lib/planning/calculations';

export class SiteOperationsService {
  /**
   * Fetch Material On Site (MOS) entries for a project.
   */
  static async getMosEntries(projectId: string): Promise<MosEntry[]> {
    const key = `siteOps:mos:${projectId}`;
    return appCache.getOrFetch(key, TTL.dailyProgress, async () => {
      try {
        const { data, error } = await supabase
          .from('pm_mos_entries')
          .select('*')
          .eq('project_id', projectId)
          .order('entry_date', { ascending: false });

        if (error) {
          console.warn('SiteOperationsService.getMosEntries error:', error);
          return [];
        }
        return data || [];
      } catch (err) {
        console.warn('SiteOperationsService.getMosEntries exception:', err);
        return [];
      }
    });
  }

  /**
   * Save or update a MOS entry.
   */
  static async saveMosEntry(entry: Partial<MosEntry>): Promise<MosEntry | null> {
    try {
      const payload = {
        project_id: entry.project_id,
        entry_date: entry.entry_date || new Date().toISOString().slice(0, 10),
        boq_item_id: entry.boq_item_id || null,
        description_ar: entry.description_ar?.trim() || '',
        unit: entry.unit || 'item',
        qty_supplied: Number(entry.qty_supplied ?? 0),
        source_ref: entry.source_ref || null,
        status: entry.status || 'on_site',
        subcontractor_id: entry.subcontractor_id || null,
        recorded_by: entry.recorded_by || null,
        updated_at: new Date().toISOString(),
      };

      let result: MosEntry | null = null;
      if (entry.id) {
        const { data, error } = await supabase
          .from('pm_mos_entries')
          .update(payload)
          .eq('id', entry.id)
          .select()
          .single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('pm_mos_entries')
          .insert({ ...payload, created_at: new Date().toISOString() })
          .select()
          .single();
        if (error) throw error;
        result = data;
      }

      if (entry.project_id) {
        appCache.invalidate(`siteOps:mos:${entry.project_id}`);
      }
      return result;
    } catch (err) {
      console.error('SiteOperationsService.saveMosEntry error:', err);
      return null;
    }
  }

  /**
   * Update MOS entry status (e.g. 'on_site' | 'partially_installed' | 'installed').
   */
  static async updateMosStatus(id: string, status: MosStatus): Promise<MosEntry | null> {
    try {
      const { data, error } = await supabase
        .from('pm_mos_entries')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (data?.project_id) {
        appCache.invalidate(`siteOps:mos:${data.project_id}`);
      }
      return data;
    } catch (err) {
      console.error('SiteOperationsService.updateMosStatus error:', err);
      return null;
    }
  }

  /**
   * Fetch material transactions for a project.
   */
  static async getMaterialTransactions(projectId: string): Promise<MaterialTransaction[]> {
    const key = `siteOps:materialTx:${projectId}`;
    return appCache.getOrFetch(key, TTL.dailyProgress, async () => {
      try {
        const { data, error } = await supabase
          .from('pm_material_transactions')
          .select('*')
          .eq('project_id', projectId)
          .order('tx_date', { ascending: false });

        if (error) {
          console.warn('SiteOperationsService.getMaterialTransactions error:', error);
          return [];
        }
        return data || [];
      } catch (err) {
        console.warn('SiteOperationsService.getMaterialTransactions exception:', err);
        return [];
      }
    });
  }

  /**
   * Save or record a material transaction.
   */
  static async saveMaterialTransaction(
    tx: Partial<MaterialTransaction>
  ): Promise<MaterialTransaction | null> {
    try {
      const payload = {
        project_id: tx.project_id,
        sub_material_id: tx.sub_material_id,
        tx_date: tx.tx_date || new Date().toISOString().slice(0, 10),
        tx_type: tx.tx_type || 'issue_to_site',
        qty: Number(tx.qty ?? 0),
        zone: tx.zone || null,
        ref_wir_no: tx.ref_wir_no || null,
        recorded_by: tx.recorded_by || null,
        notes: tx.notes || null,
        updated_at: new Date().toISOString(),
      };

      let result: MaterialTransaction | null = null;
      if (tx.id) {
        const { data, error } = await supabase
          .from('pm_material_transactions')
          .update(payload)
          .eq('id', tx.id)
          .select()
          .single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('pm_material_transactions')
          .insert({ ...payload, created_at: new Date().toISOString() })
          .select()
          .single();
        if (error) throw error;
        result = data;
      }

      if (tx.project_id) {
        appCache.invalidate(`siteOps:materialTx:${tx.project_id}`);
      }
      return result;
    } catch (err) {
      console.error('SiteOperationsService.saveMaterialTransaction error:', err);
      return null;
    }
  }

  /**
   * Calculate and generate material wastage report comparing actual vs standard wastage.
   */
  static async getMaterialWastageReport(projectId: string): Promise<MaterialWastageReport> {
    try {
      // 1. Fetch BOQ items for project
      const { data: boqItems } = await supabase
        .from('pm_boq_items')
        .select('id, item_code, description_ar, rate_egp')
        .eq('project_id', projectId);

      const boqIds = (boqItems || []).map((b) => b.id);
      if (boqIds.length === 0) {
        return {
          project_id: projectId,
          generated_at: new Date().toISOString(),
          items: [],
          total_variance_egp: 0,
        };
      }

      // 2. Fetch sub materials
      const { data: subMaterials } = await supabase
        .from('pm_boq_sub_materials')
        .select('*')
        .in('boq_item_id', boqIds);

      // 3. Fetch material transactions
      const { data: transactions } = await supabase
        .from('pm_material_transactions')
        .select('*')
        .eq('project_id', projectId);

      // 4. Fetch daily progress lines for net installed qty
      const { data: reports } = await supabase
        .from('pm_daily_progress')
        .select('id')
        .eq('project_id', projectId);

      const reportIds = (reports || []).map((r) => r.id);
      let lines: Array<{ boq_item_id: string; qty_today: number; line_status: string }> = [];
      if (reportIds.length > 0) {
        const { data: linesData } = await supabase
          .from('pm_daily_progress_lines')
          .select('boq_item_id, qty_today, line_status')
          .in('daily_progress_id', reportIds)
          .neq('line_status', 'rejected');
        lines = linesData || [];
      }

      const reportItems: MaterialWastageReportItem[] = [];
      let totalVarianceEgp = 0;

      for (const sm of subMaterials || []) {
        // Calculate total issued to site minus returns
        const smTxs = (transactions || []).filter((t) => t.sub_material_id === sm.id);
        const issuedQty = smTxs
          .filter((t) => t.tx_type === 'issue_to_site')
          .reduce((sum, t) => sum + (Number(t.qty) || 0), 0);
        const returnedQty = smTxs
          .filter((t) => t.tx_type === 'return_to_store')
          .reduce((sum, t) => sum + (Number(t.qty) || 0), 0);
        const netIssuedQty = Math.max(0, issuedQty - returnedQty);

        // Installed net quantity from BOQ line progress * consumption_rate
        const boqLines = lines.filter((l) => l.boq_item_id === sm.boq_item_id);
        const totalBoqInstalled = boqLines.reduce((sum, l) => sum + (Number(l.qty_today) || 0), 0);
        const installedNetQty = totalBoqInstalled * (Number(sm.consumption_rate) || 1.0);

        const standardWastagePct = Number(sm.standard_wastage_pct) || 0;
        const linkedBoq = (boqItems || []).find((b) => b.id === sm.boq_item_id);
        const unitPriceEgp = linkedBoq?.rate_egp || 0;

        const wastage = calculateWastageLossEgp(
          netIssuedQty,
          installedNetQty,
          standardWastagePct,
          unitPriceEgp
        );

        totalVarianceEgp += wastage.wastageLossEgp;

        reportItems.push({
          sub_material_id: sm.id,
          material_name_ar: sm.material_name_ar || 'خامة',
          unit: sm.unit || 'وحدة',
          issued_qty: Number(netIssuedQty.toFixed(2)),
          installed_qty: Number(installedNetQty.toFixed(2)),
          standard_wastage_pct: standardWastagePct,
          actual_wastage_pct: wastage.actualWastagePct,
          variance_pct: wastage.varianceWastagePct,
          unit_price_egp: unitPriceEgp,
          variance_egp: wastage.wastageLossEgp,
          is_loss: wastage.isLoss,
        });
      }

      return {
        project_id: projectId,
        generated_at: new Date().toISOString(),
        items: reportItems,
        total_variance_egp: Number(totalVarianceEgp.toFixed(2)),
      };
    } catch (err) {
      console.error('SiteOperationsService.getMaterialWastageReport error:', err);
      return {
        project_id: projectId,
        generated_at: new Date().toISOString(),
        items: [],
        total_variance_egp: 0,
      };
    }
  }
}
