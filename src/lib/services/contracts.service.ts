import { supabase } from '@/lib/supabase';
import { appCache } from '@/lib/cache';
import type {
  Contract,
  Claim,
  VariationOrder,
  EOTRequest,
  IPCCertificate,
  ClaimType,
  ClaimStatus,
  ContractSummary
} from '@/types/contracts';

class ContractsService {
  private static instance: ContractsService;

  private constructor() {}

  public static getInstance(): ContractsService {
    if (!ContractsService.instance) {
      ContractsService.instance = new ContractsService();
    }
    return ContractsService.instance;
  }

  async getContracts(projectId: string): Promise<Contract[]> {
    const cacheKey = `contracts_${projectId}`;
    return appCache.getOrFetch(cacheKey, async () => {
      try {
        const { data: project, error } = await supabase
          .from('pm_projects')
          .select('*')
          .eq('id', projectId)
          .maybeSingle();

        if (error || !project) return [];

        const meta = project.metadata || {};
        const customContracts = Array.isArray(meta.contracts) ? meta.contracts : [];
        if (customContracts.length > 0) {
          return customContracts;
        }

        // Synthesize primary contract from project record (zero phantom queries)
        const originalValue = Number(project.contract_value_egp || project.contract_value || 0);
        const vosVal = Number(project.vos_value || 0);
        const contract: Contract = {
          id: `contract_${project.id}`,
          project_id: project.id,
          contract_number: project.project_code || 'CON-001',
          title_ar: project.project_name || project.name_ar || 'عقد المشروع الرئيسي',
          title_en: project.name_en || null,
          contractor_name: project.contractor_name || 'بي زون التجارية (P.Zone International)',
          original_value: originalValue,
          revised_value: originalValue + vosVal,
          currency: project.currency || 'EGP',
          start_date: project.start_date || project.planned_start_date || project.contract_date || '',
          end_date: project.planned_finish_date || project.end_date || project.finish_date || project.actual_finish_date || '',
          status: project.status === 'completed' ? 'completed' : project.status === 'cancelled' ? 'terminated' : 'active',
          fidic_type: meta.fidic_type || '',
          retention_pct: Number(project.retention_pct ?? meta.retention_pct ?? 0),
          advance_payment_pct: Number(project.advance_payment_pct ?? meta.advance_payment_pct ?? meta.down_payment_pct ?? 0),
          performance_bond_pct: Number(project.performance_bond_pct ?? meta.performance_bond_pct ?? 0),
          created_at: project.created_at || new Date().toISOString(),
          updated_at: project.updated_at || new Date().toISOString()
        };

        return [contract];
      } catch {
        return [];
      }
    }, 5 * 60 * 1000);
  }

  async getContractById(id: string): Promise<Contract | null> {
    try {
      const cleanId = id.replace(/^contract_/, '');
      const { data: project } = await supabase
        .from('pm_projects')
        .select('*')
        .eq('id', cleanId)
        .maybeSingle();

      if (!project) return null;
      const list = await this.getContracts(project.id);
      return list[0] || null;
    } catch {
      return null;
    }
  }

  async saveContract(contract: Partial<Contract>): Promise<Contract | null> {
    if (!contract.project_id) return null;
    try {
      const { data: project } = await supabase
        .from('pm_projects')
        .select('metadata')
        .eq('id', contract.project_id)
        .maybeSingle();

      const meta = project?.metadata || {};
      const contractsList: Contract[] = Array.isArray(meta.contracts) ? [...meta.contracts] : [];
      const updatedContract = {
        id: contract.id || `contract_${contract.project_id}`,
        ...contract,
        updated_at: new Date().toISOString()
      } as Contract;

      const idx = contractsList.findIndex((c) => c.id === updatedContract.id);
      if (idx >= 0) {
        contractsList[idx] = updatedContract;
      } else {
        contractsList.push(updatedContract);
      }

      await supabase
        .from('pm_projects')
        .update({
          metadata: { ...meta, contracts: contractsList },
          updated_at: new Date().toISOString()
        })
        .eq('id', contract.project_id);

      appCache.invalidate(`contracts_${contract.project_id}`);
      return updatedContract;
    } catch (err) {
      console.error('Failed to save contract:', err);
      return null;
    }
  }

  async getClaims(projectId: string, filters?: { type?: ClaimType; status?: ClaimStatus }): Promise<Claim[]> {
    const cacheKey = `claims_${projectId}_${JSON.stringify(filters || {})}`;
    return appCache.getOrFetch(cacheKey, async () => {
      try {
        const { data: project } = await supabase
          .from('pm_projects')
          .select('metadata')
          .eq('id', projectId)
          .maybeSingle();

        let claims: Claim[] = Array.isArray(project?.metadata?.claims) ? project.metadata.claims : [];
        if (filters?.type) claims = claims.filter((c) => c.claim_type === filters.type);
        if (filters?.status) claims = claims.filter((c) => c.status === filters.status);
        return claims;
      } catch (err) {
        console.error('Failed to get claims:', err);
        return [];
      }
    }, 5 * 60 * 1000);
  }

  async saveClaim(claim: Partial<Claim>): Promise<Claim | null> {
    if (!claim.project_id) return null;
    try {
      const { data: project } = await supabase
        .from('pm_projects')
        .select('metadata')
        .eq('id', claim.project_id)
        .maybeSingle();

      const meta = project?.metadata || {};
      const claims: Claim[] = Array.isArray(meta.claims) ? [...meta.claims] : [];
      const newClaim: Claim = {
        id: claim.id || `claim_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        project_id: claim.project_id,
        contract_id: claim.contract_id || `contract_${claim.project_id}`,
        claim_number: claim.claim_number || `CLM-${claims.length + 1}`,
        claim_type: claim.claim_type || 'cost_claim',
        title_ar: claim.title_ar || '',
        title_en: claim.title_en || null,
        description: claim.description || '',
        claimed_amount: Number(claim.claimed_amount || 0),
        approved_amount: claim.approved_amount !== undefined ? Number(claim.approved_amount) : null,
        submitted_by: claim.submitted_by || '',
        reviewed_by: claim.reviewed_by || null,
        status: claim.status || 'draft',
        submission_date: claim.submission_date || new Date().toISOString().split('T')[0],
        review_date: claim.review_date || null,
        supporting_docs: claim.supporting_docs || [],
        clause_reference: claim.clause_reference || null,
        created_at: claim.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const idx = claims.findIndex((c) => c.id === newClaim.id);
      if (idx >= 0) claims[idx] = newClaim;
      else claims.unshift(newClaim);

      await supabase
        .from('pm_projects')
        .update({
          metadata: { ...meta, claims },
          updated_at: new Date().toISOString()
        })
        .eq('id', claim.project_id);

      appCache.invalidate(`claims_${claim.project_id}`);
      return newClaim;
    } catch (err) {
      console.error('Failed to save claim:', err);
      return null;
    }
  }

  async updateClaimStatus(
    id: string,
    status: ClaimStatus,
    reviewedBy?: string,
    approvedAmount?: number,
    projectId?: string
  ): Promise<Claim | null> {
    try {
      let projectsToSearch: { id: string; metadata: any }[] = [];
      if (projectId) {
        const { data: p } = await supabase
          .from('pm_projects')
          .select('id, metadata')
          .eq('id', projectId)
          .maybeSingle();
        if (p) projectsToSearch = [p];
      }

      if (projectsToSearch.length === 0) {
        const { data: projects } = await supabase
          .from('pm_projects')
          .select('id, metadata')
          .limit(100);
        projectsToSearch = Array.isArray(projects) ? projects : [];
      }

      for (const p of projectsToSearch) {
        const claims: Claim[] = Array.isArray(p.metadata?.claims) ? [...p.metadata.claims] : [];
        const idx = claims.findIndex((c) => c.id === id);
        if (idx >= 0) {
          claims[idx] = {
            ...claims[idx],
            status,
            reviewed_by: reviewedBy || claims[idx].reviewed_by,
            approved_amount: approvedAmount !== undefined ? approvedAmount : claims[idx].approved_amount,
            review_date: ['approved', 'rejected', 'closed'].includes(status) ? new Date().toISOString() : claims[idx].review_date,
            updated_at: new Date().toISOString()
          };

          await supabase
            .from('pm_projects')
            .update({
              metadata: { ...p.metadata, claims },
              updated_at: new Date().toISOString()
            })
            .eq('id', p.id);

          appCache.invalidate(`claims_${p.id}`);
          return claims[idx];
        }
      }
      return null;
    } catch (err) {
      console.error('Failed to update claim status:', err);
      return null;
    }
  }

  async getVariationOrders(projectId: string): Promise<VariationOrder[]> {
    const cacheKey = `vo_${projectId}`;
    return appCache.getOrFetch(cacheKey, async () => {
      try {
        // 1. Fetch from canonical pm_change_orders table
        const { data: cos } = await supabase
          .from('pm_change_orders')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false });

        // 2. Fetch from project metadata.variation_orders
        const { data: project } = await supabase
          .from('pm_projects')
          .select('metadata')
          .eq('id', projectId)
          .maybeSingle();

        const metaVos: any[] = Array.isArray(project?.metadata?.variation_orders)
          ? project.metadata.variation_orders
          : [];

        const list: VariationOrder[] = [];
        const seenIds = new Set<string>();

        for (const co of Array.isArray(cos) ? cos : []) {
          seenIds.add(co.id);
          list.push({
            id: co.id,
            project_id: co.project_id,
            contract_id: `contract_${co.project_id}`,
            vo_number: co.vo_number || '',
            title_ar: co.title_ar || '',
            title_en: null,
            description: '',
            vo_type: Number(co.amount_egp) < 0 ? 'omission' : 'addition',
            original_scope: '',
            revised_scope: '',
            cost_impact: Number(co.amount_egp || 0),
            time_impact_days: Number(co.time_extension_days || 0),
            status: co.status === 'approved' || co.approval_status === 'approved' ? 'approved' : 'draft',
            requested_by: '',
            approved_by: null,
            created_at: co.created_at || new Date().toISOString(),
            updated_at: co.created_at || new Date().toISOString()
          });
        }

        for (const mv of metaVos) {
          if (mv?.id && !seenIds.has(mv.id)) {
            seenIds.add(mv.id);
            const isDeduction = mv.type === 'deduction' || mv.vo_type === 'omission' || Number(mv.amount) < 0;
            const absAmt = Math.abs(Number(mv.amount || mv.cost_impact || 0));
            list.push({
              id: mv.id,
              project_id: projectId,
              contract_id: `contract_${projectId}`,
              vo_number: mv.vo_number || '',
              title_ar: mv.title_ar || mv.title || '',
              title_en: null,
              description: mv.description || '',
              vo_type: isDeduction ? 'omission' : 'addition',
              original_scope: '',
              revised_scope: '',
              cost_impact: isDeduction ? -absAmt : absAmt,
              time_impact_days: Number(mv.time_impact_days || 0),
              status: mv.status || 'draft',
              requested_by: mv.requested_by || '',
              approved_by: mv.approved_by || null,
              created_at: mv.issue_date || mv.created_at || new Date().toISOString(),
              updated_at: mv.approved_date || mv.updated_at || new Date().toISOString()
            });
          }
        }

        return list;
      } catch (err) {
        console.error('Failed to get variation orders:', err);
        return [];
      }
    }, 5 * 60 * 1000);
  }

  async saveVariationOrder(vo: Partial<VariationOrder>): Promise<VariationOrder | null> {
    if (!vo.project_id) return null;
    try {
      const costImpact = Number(vo.cost_impact || 0);

      // Save to canonical pm_change_orders table
      const { data, error } = await supabase
        .from('pm_change_orders')
        .upsert({
          id: vo.id,
          project_id: vo.project_id,
          vo_number: vo.vo_number,
          title_ar: vo.title_ar,
          amount_egp: costImpact,
          time_extension_days: vo.time_impact_days || 0,
          status: vo.status || 'draft',
          approval_status: vo.status === 'approved' ? 'approved' : 'pending'
        })
        .select()
        .single();

      if (error) {
        // Fallback to project metadata
        const { data: project } = await supabase
          .from('pm_projects')
          .select('metadata')
          .eq('id', vo.project_id)
          .maybeSingle();

        const meta = project?.metadata || {};
        const metaVos: any[] = Array.isArray(meta.variation_orders) ? [...meta.variation_orders] : [];
        const idx = metaVos.findIndex((v) => v.id === vo.id);
        const item = {
          id: vo.id || `vo_${Date.now()}`,
          vo_number: vo.vo_number || '',
          title_ar: vo.title_ar || '',
          type: costImpact < 0 ? 'deduction' : 'addition',
          amount: Math.abs(costImpact),
          status: vo.status || 'draft',
          time_impact_days: vo.time_impact_days || 0,
          issue_date: new Date().toISOString().split('T')[0]
        };
        if (idx >= 0) metaVos[idx] = item;
        else metaVos.unshift(item);

        await supabase
          .from('pm_projects')
          .update({ metadata: { ...meta, variation_orders: metaVos } })
          .eq('id', vo.project_id);
      }

      appCache.invalidate(`vo_${vo.project_id}`);
      await this.syncProjectVosTotal(vo.project_id);
      return vo as VariationOrder;
    } catch (err) {
      console.error('Failed to save variation order:', err);
      return null;
    }
  }

  async deleteVariationOrder(id: string, projectId: string): Promise<boolean> {
    try {
      await supabase.from('pm_change_orders').delete().eq('id', id);

      // Clean from project metadata if present
      const { data: project } = await supabase
        .from('pm_projects')
        .select('metadata')
        .eq('id', projectId)
        .maybeSingle();

      if (project?.metadata?.variation_orders) {
        const metaVos = (project.metadata.variation_orders as any[]).filter((v) => v.id !== id);
        await supabase
          .from('pm_projects')
          .update({ metadata: { ...project.metadata, variation_orders: metaVos } })
          .eq('id', projectId);
      }

      if (projectId) {
        appCache.invalidate(`vo_${projectId}`);
        await this.syncProjectVosTotal(projectId);
      }
      return true;
    } catch (err) {
      console.error('Failed to delete variation order:', err);
      return false;
    }
  }

  async syncProjectVosTotal(projectId: string): Promise<number> {
    if (!projectId) return 0;
    try {
      const vos = await this.getVariationOrders(projectId);
      const approvedTotal = vos
        .filter((v) => v.status === 'approved')
        .reduce((sum, v) => sum + Number(v.cost_impact || 0), 0);

      const { data: project } = await supabase
        .from('pm_projects')
        .select('contract_value, contract_value_egp')
        .eq('id', projectId)
        .maybeSingle();

      const baseValue = Number(project?.contract_value_egp || project?.contract_value || 0);
      const totalContract = baseValue + approvedTotal;

      await supabase
        .from('pm_projects')
        .update({
          vos_value: approvedTotal,
          total_contract_value: totalContract,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);

      appCache.invalidate(`vo_${projectId}`);
      appCache.invalidate(`projects:${projectId}`);
      appCache.invalidate(`projects:detail:${projectId}`);
      appCache.invalidate('projects:all');
      appCache.invalidate('projects:list');

      return approvedTotal;
    } catch (err) {
      console.error('Failed to sync project VOs total:', err);
      return 0;
    }
  }

  async getEOTRequests(projectId: string): Promise<EOTRequest[]> {
    const cacheKey = `eot_${projectId}`;
    return appCache.getOrFetch(cacheKey, async () => {
      try {
        const { data: project } = await supabase
          .from('pm_projects')
          .select('metadata')
          .eq('id', projectId)
          .maybeSingle();

        const eots: EOTRequest[] = Array.isArray(project?.metadata?.eot_requests)
          ? project.metadata.eot_requests
          : [];
        return eots;
      } catch (err) {
        console.error('Failed to get EOT requests:', err);
        return [];
      }
    }, 5 * 60 * 1000);
  }

  async saveEOTRequest(eot: Partial<EOTRequest>): Promise<EOTRequest | null> {
    if (!eot.project_id) return null;
    try {
      const { data: project } = await supabase
        .from('pm_projects')
        .select('metadata')
        .eq('id', eot.project_id)
        .maybeSingle();

      const meta = project?.metadata || {};
      const eots: EOTRequest[] = Array.isArray(meta.eot_requests) ? [...meta.eot_requests] : [];
      const newEot: EOTRequest = {
        id: eot.id || `eot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        project_id: eot.project_id,
        contract_id: eot.contract_id || `contract_${eot.project_id}`,
        eot_number: eot.eot_number || `EOT-${eots.length + 1}`,
        title_ar: eot.title_ar || '',
        reason: eot.reason || '',
        requested_days: Number(eot.requested_days || 0),
        approved_days: eot.approved_days !== undefined ? Number(eot.approved_days) : null,
        clause_reference: eot.clause_reference || null,
        status: eot.status || 'draft',
        requested_by: eot.requested_by || '',
        reviewed_by: eot.reviewed_by || null,
        submission_date: eot.submission_date || new Date().toISOString().split('T')[0],
        created_at: eot.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const idx = eots.findIndex((e) => e.id === newEot.id);
      if (idx >= 0) eots[idx] = newEot;
      else eots.unshift(newEot);

      await supabase
        .from('pm_projects')
        .update({
          metadata: { ...meta, eot_requests: eots },
          updated_at: new Date().toISOString()
        })
        .eq('id', eot.project_id);

      appCache.invalidate(`eot_${eot.project_id}`);
      return newEot;
    } catch (err) {
      console.error('Failed to save EOT request:', err);
      return null;
    }
  }

  async updateEOTStatus(
    id: string,
    status: 'approved' | 'rejected' | 'under_review' | 'closed',
    reviewedBy?: string,
    approvedDays?: number,
    projectId?: string
  ): Promise<boolean> {
    try {
      let targetProjectId = projectId;

      if (!targetProjectId) {
        const { data: projects } = await supabase
          .from('pm_projects')
          .select('id, metadata')
          .limit(50);
        const match = projects?.find((p) =>
          Array.isArray(p.metadata?.eot_requests) &&
          p.metadata.eot_requests.some((e: any) => e.id === id)
        );
        targetProjectId = match?.id;
      }

      if (!targetProjectId) return false;

      const { data: project } = await supabase
        .from('pm_projects')
        .select('*')
        .eq('id', targetProjectId)
        .maybeSingle();

      const meta = project?.metadata || {};
      const eots: EOTRequest[] = Array.isArray(meta.eot_requests) ? [...meta.eot_requests] : [];
      const idx = eots.findIndex((e) => e.id === id);
      if (idx === -1) return false;

      const currentEot = eots[idx];
      const validApprovedDays = approvedDays !== undefined ? Number(approvedDays) : (currentEot.approved_days || currentEot.requested_days || 0);

      eots[idx] = {
        ...currentEot,
        status,
        reviewed_by: reviewedBy || currentEot.reviewed_by || 'استشاري المشروع',
        approved_days: status === 'approved' ? validApprovedDays : (currentEot.approved_days || null),
        updated_at: new Date().toISOString()
      };

      const projectUpdates: Record<string, unknown> = {
        metadata: { ...meta, eot_requests: eots },
        updated_at: new Date().toISOString()
      };

      if (status === 'approved' && validApprovedDays > 0) {
        const baseFinish = project.planned_finish_date || (project as any).finish_date;
        if (baseFinish) {
          const finishDate = new Date(baseFinish);
          if (!isNaN(finishDate.getTime())) {
            finishDate.setDate(finishDate.getDate() + validApprovedDays);
            const revisedDateStr = finishDate.toISOString().split('T')[0];
            projectUpdates.planned_finish_date = revisedDateStr;
            projectUpdates.metadata = {
              ...projectUpdates.metadata as Record<string, unknown>,
              revised_finish_date: revisedDateStr,
              total_approved_eot_days: ((meta.total_approved_eot_days as number) || 0) + validApprovedDays
            };
          }
        }
      }

      await supabase
        .from('pm_projects')
        .update(projectUpdates)
        .eq('id', targetProjectId);

      appCache.invalidate(`eot_${targetProjectId}`);
      appCache.invalidate(`projects:${targetProjectId}`);
      appCache.invalidate(`projects:detail:${targetProjectId}`);
      appCache.invalidate('projects:all');
      appCache.invalidate('projects:list');

      return true;
    } catch (err) {
      console.error('Failed to update EOT status:', err);
      return false;
    }
  }

  async getIPCCertificates(projectId: string): Promise<IPCCertificate[]> {
    const cacheKey = `ipc_${projectId}`;
    return appCache.getOrFetch(cacheKey, async () => {
      try {
        // Query canonical pm_invoices table (real IPC table in DB)
        const { data: invoices } = await supabase
          .from('pm_invoices')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false });

        if (!invoices || invoices.length === 0) {
          const { data: project } = await supabase
            .from('pm_projects')
            .select('metadata')
            .eq('id', projectId)
            .maybeSingle();

          const metaIpcs: IPCCertificate[] = Array.isArray(project?.metadata?.ipc_certificates)
            ? project.metadata.ipc_certificates
            : [];
          return metaIpcs;
        }

        return invoices.map((inv, idx) => ({
          id: inv.id,
          project_id: inv.project_id,
          contract_id: `contract_${inv.project_id}`,
          ipc_number: Number(inv.ipc_number || idx + 1),
          period_start: inv.submission_date || inv.created_at?.split('T')[0] || '',
          period_end: inv.submission_date || inv.created_at?.split('T')[0] || '',
          gross_amount: Number(inv.claimed_amount || 0),
          retention_deduction: 0,
          advance_recovery: 0,
          previous_certified: 0,
          current_certified: Number(inv.approved_amount || inv.claimed_amount || 0),
          net_payable: Number(inv.approved_amount || inv.claimed_amount || 0),
          status: inv.status === 'paid' ? 'paid' : inv.status === 'approved' ? 'certified' : 'submitted',
          certified_by: null,
          certified_date: inv.status === 'approved' || inv.status === 'paid' ? inv.created_at : null,
          created_at: inv.created_at || new Date().toISOString(),
          updated_at: inv.created_at || new Date().toISOString()
        }));
      } catch (err) {
        console.error('Failed to get IPC certificates:', err);
        return [];
      }
    }, 5 * 60 * 1000);
  }

  async saveIPCCertificate(ipc: Partial<IPCCertificate>): Promise<IPCCertificate | null> {
    if (!ipc.project_id) return null;
    try {
      const invStatus = ipc.status === 'paid' ? 'paid' : ipc.status === 'certified' ? 'approved' : 'pending';
      await supabase
        .from('pm_invoices')
        .upsert({
          id: ipc.id,
          project_id: ipc.project_id,
          ipc_number: String(ipc.ipc_number || '1'),
          claimed_amount: ipc.gross_amount || 0,
          approved_amount: ipc.current_certified || ipc.net_payable || 0,
          submission_date: ipc.period_end || new Date().toISOString().split('T')[0],
          status: invStatus
        });

      if (ipc.project_id) {
        appCache.invalidate(`ipc_${ipc.project_id}`);
      }
      return ipc as IPCCertificate;
    } catch (err) {
      console.error('Failed to save IPC certificate:', err);
      return null;
    }
  }

  async getContractSummary(projectId: string): Promise<ContractSummary> {
    const [contracts, vos, claims] = await Promise.all([
      this.getContracts(projectId),
      this.getVariationOrders(projectId),
      this.getClaims(projectId)
    ]);

    const totalOriginalValue = contracts.reduce((sum, c) => sum + (c.original_value || 0), 0);
    const approvedVOs = vos
      .filter((vo) => vo.status === 'approved')
      .reduce((sum, vo) => sum + Number(vo.cost_impact || 0), 0);
    const totalClaims = claims
      .filter((c) => c.status === 'approved')
      .reduce((sum, c) => sum + Number(c.approved_amount || 0), 0);

    return {
      totalOriginalValue,
      totalVOs: approvedVOs,
      totalClaims,
      netContractValue: totalOriginalValue + approvedVOs + totalClaims,
    };
  }
}

export const contractsService = ContractsService.getInstance();
