import type { ErrorLike } from '@/types/services-types';
import { supabase } from '@/lib/supabase';
import { appCache, CACHE_KEYS, TTL } from '@/lib/cache';
import { 
  ProjectTeamMember, 
  ProjectClientContact,
  ProjectSiteResource,
  ProjectSubcontractor,
  WBSItem, 
  PaymentMilestone, 
  ProjectDocument, 
  ChangeOrder, 
  ProjectInvoice, 
  ArchiveLog 
} from '@/types';
import { WBSService } from './wbs.service';
import { contractsService } from './contracts.service';
import { logger } from '@/lib/logger';

export class ProjectTabsService {
  // --- TEAM MEMBERS ---
  static async getTeamMembers(projectId: string): Promise<ProjectTeamMember[]> {
    return appCache.getOrFetch(CACHE_KEYS.team(projectId), TTL.tabData, async () => {
      try {
        const { data, error } = await supabase
          .from('pm_project_team')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: true });

        if (!error && data) return data;
        return [];
      } catch (err) {
        logger.warn('pm_project_team fetch warning:', { detail: err });
        return [];
      }
    });
  }

  static async addTeamMember(member: Partial<ProjectTeamMember>): Promise<ProjectTeamMember | null> {
    const newItem: ProjectTeamMember = {
      id: member.id || `tm_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      project_id: member.project_id || '',
      stakeholder_id: member.stakeholder_id || undefined,
      person_name: member.person_name || '',
      role_category: member.role_category || 'pzone_internal',
      role_title_ar: member.role_title_ar || '',
      role_title_en: member.role_title_en || undefined,
      role_sub_type: member.role_sub_type || undefined,
      phone: member.phone || '',
      email: member.email || '',
      notes: member.notes || '',
      created_at: new Date().toISOString()
    };

    // Clean undefined values for Supabase insert
    const insertPayload = Object.fromEntries(
      Object.entries(newItem).filter(([, v]) => v !== undefined)
    );

    const { data, error } = await supabase
      .from('pm_project_team')
      .insert([insertPayload])
      .select()
      .single();

    if (member.project_id) appCache.invalidate(CACHE_KEYS.team(member.project_id));
    if (error) throw error;
    return data;
  }

  static async deleteTeamMember(id: string, memberData?: ProjectTeamMember): Promise<boolean> {
    if (memberData) {
      try {
        await this.logArchive({
          entity_type: 'team_member',
          entity_id: id,
          entity_name: memberData.person_name,
          project_id: memberData.project_id,
          archived_data: memberData,
          deleted_by: 'User Action'
        });
      } catch (e) {
        logger.warn('Archive logging fallback warning:', { detail: e });
      }
    }

    const { error } = await supabase
      .from('pm_project_team')
      .delete()
      .eq('id', id);

    if (memberData?.project_id) {
      appCache.invalidate(CACHE_KEYS.team(memberData.project_id));
    }

    if (error) throw error;
    return true;
  }

  // --- CLIENT CONTACTS ---
  static async getClientContacts(projectId: string): Promise<ProjectClientContact[]> {
    return appCache.getOrFetch(CACHE_KEYS.clientContacts(projectId), TTL.tabData, async () => {
      try {
        const { data, error } = await supabase
          .from('pm_project_client_contacts')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: true });

        if (!error && data) return data;
        return [];
      } catch (err) {
        logger.warn('pm_project_client_contacts fetch warning:', { detail: err });
        return [];
      }
    });
  }

  static async addClientContact(contact: Partial<ProjectClientContact>): Promise<ProjectClientContact> {
    const newItem: ProjectClientContact = {
      id: contact.id || `pcc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      project_id: contact.project_id || '',
      party_type: contact.party_type || 'client',
      company_name: contact.company_name || '',
      contact_name: contact.contact_name || '',
      job_title: contact.job_title || contact.contact_title || '',
      contact_title: contact.contact_title || contact.job_title || '',
      phone: contact.phone || '',
      email: contact.email || '',
      notes: contact.notes || '',
      is_primary: contact.is_primary || false,
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('pm_project_client_contacts')
        .insert([contact])
        .select()
        .single();

      if (contact.project_id) appCache.invalidate(CACHE_KEYS.clientContacts(contact.project_id));
      if (!error && data) return data;
      throw new Error(error?.message || 'فشل حفظ جهة الاتصال');
    } catch (err: unknown) {
      if (contact.project_id) appCache.invalidate(CACHE_KEYS.clientContacts(contact.project_id));
      throw err instanceof Error ? err : new Error((err as ErrorLike)?.message || 'فشل حفظ جهة الاتصال');
    }
  }

  static async deleteClientContact(id: string, projectId: string): Promise<void> {
    try {
      await supabase
        .from('pm_project_client_contacts')
        .delete()
        .eq('id', id);
    } catch (e) {
      logger.warn('pm_project_client_contacts delete error:', { detail: e });
    }

    if (projectId) {
      appCache.invalidate(CACHE_KEYS.clientContacts(projectId));
      appCache.invalidate('tabs:archiveLogs');
    }
  }

  // --- SITE RESOURCES ---
  static async getSiteResources(projectId: string): Promise<ProjectSiteResource[]> {
    return appCache.getOrFetch(CACHE_KEYS.siteResources(projectId), TTL.tabData, async () => {
      try {
        const { data, error } = await supabase
          .from('pm_project_site_resources')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: true });

        if (!error && data) return data;
        return [];
      } catch (err) {
        logger.warn('pm_project_site_resources fetch warning:', { detail: err });
        return [];
      }
    });
  }

  static async addSiteResource(resource: Partial<ProjectSiteResource>): Promise<ProjectSiteResource> {
    const newItem: ProjectSiteResource = {
      id: resource.id || `psr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      project_id: resource.project_id || '',
      resource_type: resource.resource_type || 'equipment_operator',
      resource_name: resource.resource_name || resource.person_name || '',
      person_name: resource.person_name || resource.resource_name || '',
      phone: resource.phone || '',
      vehicle_equipment_type: resource.vehicle_equipment_type || resource.sub_type || '',
      sub_type: resource.sub_type || resource.vehicle_equipment_type || '',
      notes: resource.notes || '',
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('pm_project_site_resources')
        .insert([resource])
        .select()
        .single();

      if (resource.project_id) appCache.invalidate(CACHE_KEYS.siteResources(resource.project_id));
      if (!error && data) return data;
      throw new Error(error?.message || 'فشل حفظ المورد');
    } catch (err: unknown) {
      if (resource.project_id) appCache.invalidate(CACHE_KEYS.siteResources(resource.project_id));
      throw err instanceof Error ? err : new Error((err as ErrorLike)?.message || 'فشل حفظ المورد');
    }
  }

  static async deleteSiteResource(id: string, projectId: string): Promise<void> {
    try {
      await supabase
        .from('pm_project_site_resources')
        .delete()
        .eq('id', id);
    } catch (e) {
      logger.warn('pm_project_site_resources delete error:', { detail: e });
    }

    if (projectId) {
      appCache.invalidate(CACHE_KEYS.siteResources(projectId));
      appCache.invalidate('tabs:archiveLogs');
    }
  }

  // --- SUBCONTRACTORS ---
  static async getSubcontractors(projectId: string): Promise<ProjectSubcontractor[]> {
    return appCache.getOrFetch(CACHE_KEYS.subcontractors(projectId), TTL.tabData, async () => {
      try {
        const { data, error } = await supabase
          .from('pm_project_subcontractors')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: true });

        if (!error && data) return data;
        return [];
      } catch (err) {
        logger.warn('pm_project_subcontractors fetch warning:', { detail: err });
        return [];
      }
    });
  }

  static async addSubcontractor(subcontractor: Partial<ProjectSubcontractor>): Promise<ProjectSubcontractor> {
    const newItem: ProjectSubcontractor = {
      id: subcontractor.id || `psub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      project_id: subcontractor.project_id || '',
      company_name: subcontractor.company_name || '',
      specialization: subcontractor.specialization || '',
      scope_description: subcontractor.scope_description || subcontractor.scope_of_work || '',
      scope_of_work: subcontractor.scope_of_work || subcontractor.scope_description || '',
      status: subcontractor.status || (subcontractor.contract_status as typeof subcontractor.status) || 'active',
      contract_status: subcontractor.contract_status || subcontractor.status || 'active',
      contract_value: subcontractor.contract_value || 0,
      start_date: subcontractor.start_date || '',
      end_date: subcontractor.end_date || '',
      rep_name: subcontractor.rep_name || '',
      rep_phone: subcontractor.rep_phone || '',
      rep_email: subcontractor.rep_email || '',
      notes: subcontractor.notes || '',
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('pm_project_subcontractors')
        .insert([subcontractor])
        .select()
        .single();

      if (subcontractor.project_id) appCache.invalidate(CACHE_KEYS.subcontractors(subcontractor.project_id));
      if (!error && data) return data;
      throw new Error(error?.message || 'فشل حفظ المقاول');
    } catch (err: unknown) {
      if (subcontractor.project_id) appCache.invalidate(CACHE_KEYS.subcontractors(subcontractor.project_id));
      throw err instanceof Error ? err : new Error((err as ErrorLike)?.message || 'فشل حفظ المقاول');
    }
  }

  static async updateSubcontractor(id: string, updates: Partial<ProjectSubcontractor>, projectId: string): Promise<ProjectSubcontractor> {
    const updatedFallback: ProjectSubcontractor = {
      id,
      project_id: projectId,
      company_name: updates.company_name || '',
      specialization: updates.specialization,
      scope_description: updates.scope_description || updates.scope_of_work,
      scope_of_work: updates.scope_of_work || updates.scope_description,
      status: updates.status || (updates.contract_status as typeof updates.status) || 'active',
      contract_status: updates.contract_status || updates.status || 'active',
      contract_value: updates.contract_value,
      start_date: updates.start_date,
      end_date: updates.end_date,
      rep_name: updates.rep_name,
      rep_phone: updates.rep_phone,
      rep_email: updates.rep_email,
      notes: updates.notes,
      updated_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('pm_project_subcontractors')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (projectId) appCache.invalidate(CACHE_KEYS.subcontractors(projectId));
      if (!error && data) return data;
    } catch (err) {
      logger.warn('pm_project_subcontractors update notice:', { detail: err });
    }

    if (projectId) appCache.invalidate(CACHE_KEYS.subcontractors(projectId));
    return updatedFallback;
  }

  static async deleteSubcontractor(id: string, projectId: string): Promise<void> {
    try {
      await supabase
        .from('pm_project_subcontractors')
        .delete()
        .eq('id', id);
    } catch (e) {
      logger.warn('pm_project_subcontractors delete error:', { detail: e });
    }

    if (projectId) {
      appCache.invalidate(CACHE_KEYS.subcontractors(projectId));
      appCache.invalidate('tabs:archiveLogs');
    }
  }

  // --- WBS ITEMS ---
  static async getWBSItems(projectId: string): Promise<WBSItem[]> {
    return WBSService.getWBSItems(projectId);
  }

  static async addWBSItem(item: Partial<WBSItem>): Promise<WBSItem | null> {
    return WBSService.createWBSItem(item);
  }

  static async deleteWBSItem(id: string, itemData?: WBSItem): Promise<boolean> {
    if (itemData) {
      try {
        await this.logArchive({
          entity_type: 'wbs_item',
          entity_id: id,
          entity_name: itemData.title_ar,
          project_id: itemData.project_id,
          archived_data: itemData,
          deleted_by: 'User Action'
        });
      } catch (e) {
        logger.warn('logArchive notice:', { detail: e });
      }
    }
    try {
      await WBSService.deleteWBSItem(id, itemData?.project_id);
      return true;
    } catch (e) {
      logger.warn('deleteWBSItem notice:', { detail: e });
      return false;
    }
  }

  // --- MILESTONES ---
  static async getMilestones(projectId: string): Promise<PaymentMilestone[]> {
    return appCache.getOrFetch(CACHE_KEYS.milestones(projectId), TTL.tabData, async () => {
      try {
        const { data, error } = await supabase
          .from('pm_payment_milestones')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: true });

        if (error) return [];
        return data || [];
      } catch {
        return [];
      }
    });
  }

  static async addMilestone(milestone: Partial<PaymentMilestone>): Promise<PaymentMilestone | null> {
    const newItem: PaymentMilestone = {
      id: milestone.id || `ms_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      project_id: milestone.project_id || '',
      milestone_name_ar: milestone.milestone_name_ar || '',
      percentage: milestone.percentage || 0,
      amount_egp: milestone.amount_egp || 0,
      due_date: milestone.due_date || '',
      status: milestone.status || 'pending',
      created_at: new Date().toISOString()
    };
    try {
      const { data, error } = await supabase.from('pm_payment_milestones').insert([milestone]).select().single();
      if (milestone.project_id) {
        appCache.invalidate(CACHE_KEYS.milestones(milestone.project_id));
        appCache.invalidate('tabs:archiveLogs');
      }
      if (!error && data) return data;
      throw new Error(error?.message || 'فشل حفظ المستخلص');
    } catch (e: unknown) {
      if (milestone.project_id) {
        appCache.invalidate(CACHE_KEYS.milestones(milestone.project_id));
        appCache.invalidate('tabs:archiveLogs');
      }
      throw e instanceof Error ? e : new Error((e as ErrorLike)?.message || 'فشل حفظ المستخلص');
    }
  }

  static async deleteMilestone(id: string, itemData?: PaymentMilestone): Promise<boolean> {
    if (itemData) {
      try {
        await this.logArchive({
          entity_type: 'milestone',
          entity_id: id,
          entity_name: itemData.milestone_name_ar,
          project_id: itemData.project_id,
          archived_data: itemData,
          deleted_by: 'User Action'
        });
      } catch (e) {
        logger.warn('logArchive notice:', { detail: e });
      }
    }
    try {
      await supabase.from('pm_payment_milestones').delete().eq('id', id);
    } catch (e) {
      logger.warn('deleteMilestone notice:', { detail: e });
    }
    if (itemData?.project_id) {
      appCache.invalidate(CACHE_KEYS.milestones(itemData.project_id));
      appCache.invalidate('tabs:archiveLogs');
    }
    return true;
  }

  // --- DOCUMENTS ---
  static async getDocuments(projectId: string): Promise<ProjectDocument[]> {
    return appCache.getOrFetch(CACHE_KEYS.documents(projectId), TTL.tabData, async () => {
      try {
        const { data, error } = await supabase
          .from('pm_project_documents')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: true });

        if (error) return [];
        return data || [];
      } catch {
        return [];
      }
    });
  }

  static async addDocument(doc: Partial<ProjectDocument>): Promise<ProjectDocument | null> {
    const newItem: ProjectDocument = {
      id: doc.id || `doc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      project_id: doc.project_id || '',
      document_type: doc.document_type || 'other',
      title_ar: doc.title_ar || '',
      file_path: doc.file_path || '',
      issue_date: doc.issue_date || '',
      notes: doc.notes || '',
      created_at: new Date().toISOString()
    };
    try {
      const { data, error } = await supabase.from('pm_project_documents').insert([doc]).select().single();
      if (doc.project_id) {
        appCache.invalidate(CACHE_KEYS.documents(doc.project_id));
        appCache.invalidate('tabs:archiveLogs');
      }
      if (!error && data) return data;
      throw new Error(error?.message || 'فشل حفظ المستند');
    } catch (e: unknown) {
      if (doc.project_id) {
        appCache.invalidate(CACHE_KEYS.documents(doc.project_id));
        appCache.invalidate('tabs:archiveLogs');
      }
      throw e instanceof Error ? e : new Error((e as ErrorLike)?.message || 'فشل حفظ المستند');
    }
  }

  static async deleteDocument(id: string, itemData?: ProjectDocument): Promise<boolean> {
    if (itemData) {
      try {
        await this.logArchive({
          entity_type: 'document',
          entity_id: id,
          entity_name: itemData.title_ar,
          project_id: itemData.project_id,
          archived_data: itemData,
          deleted_by: 'User Action'
        });
      } catch (e) {
        logger.warn('logArchive notice:', { detail: e });
      }
    }
    try {
      await supabase.from('pm_project_documents').delete().eq('id', id);
    } catch (e) {
      logger.warn('deleteDocument notice:', { detail: e });
    }
    if (itemData?.project_id) {
      appCache.invalidate(CACHE_KEYS.documents(itemData.project_id));
      appCache.invalidate('tabs:archiveLogs');
    }
    return true;
  }

  // --- CHANGE ORDERS (VARIATION ORDERS) ---
  static async getChangeOrders(projectId: string): Promise<ChangeOrder[]> {
    return appCache.getOrFetch(CACHE_KEYS.changeOrders(projectId), TTL.tabData, async () => {
      try {
        // Direct query to canonical pm_change_orders table (zero failed roundtrips)
        const { data, error } = await supabase
          .from('pm_change_orders')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: true });

        const dbOrders: ChangeOrder[] = (!error && data) ? data : [];
        const seenIds = new Set<string>(dbOrders.map((o) => o.id));

        // Supplement with any variation orders saved in project metadata
        try {
          const { data: project } = await supabase
            .from('pm_projects')
            .select('metadata')
            .eq('id', projectId)
            .maybeSingle();

          const metaVos = Array.isArray(project?.metadata?.variation_orders)
            ? project.metadata.variation_orders
            : [];

          for (const vo of metaVos) {
            if (vo?.id && !seenIds.has(vo.id)) {
              seenIds.add(vo.id);
              const isDeduction = vo.type === 'deduction' || vo.vo_type === 'omission' || Number(vo.amount) < 0;
              const absAmt = Math.abs(Number(vo.amount || vo.cost_impact || 0));
              dbOrders.push({
                id: vo.id,
                project_id: projectId,
                vo_number: vo.vo_number || '',
                title_ar: vo.title_ar || vo.title || '',
                amount_egp: isDeduction ? -absAmt : absAmt,
                time_extension_days: Number(vo.time_impact_days || 0),
                status: vo.status || 'draft',
                approval_status: vo.status === 'approved' ? 'approved' : (vo.status === 'rejected' ? 'rejected' : 'pending'),
                approval_date: vo.approved_date,
                created_at: vo.issue_date || vo.created_at || new Date().toISOString()
              });
            }
          }
        } catch {
          // Metadata read fallback
        }

        return dbOrders;
      } catch {
        return [];
      }
    });
  }

  static async addChangeOrder(co: Partial<ChangeOrder>): Promise<ChangeOrder | null> {
    const newItem: ChangeOrder = {
      id: co.id || `co_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      project_id: co.project_id || '',
      vo_number: co.vo_number || '',
      title_ar: co.title_ar || '',
      amount_egp: co.amount_egp || 0,
      time_extension_days: co.time_extension_days || 0,
      status: co.status || 'draft',
      approval_status: co.approval_status || 'pending',
      created_at: new Date().toISOString()
    };
    try {
      const { data, error } = await supabase.from('pm_change_orders').insert([co]).select().single();
      if (co.project_id) {
        appCache.invalidate(CACHE_KEYS.changeOrders(co.project_id));
        appCache.invalidate('tabs:archiveLogs');
        await contractsService.syncProjectVosTotal(co.project_id);
      }
      if (!error && data) return data;
      throw new Error(error?.message || 'فشل حفظ أمر التغيير');
    } catch (e: unknown) {
      if (co.project_id) {
        appCache.invalidate(CACHE_KEYS.changeOrders(co.project_id));
        appCache.invalidate('tabs:archiveLogs');
      }
      throw e instanceof Error ? e : new Error((e as ErrorLike)?.message || 'فشل حفظ أمر التغيير');
    }
  }

  static async deleteChangeOrder(id: string, itemData?: ChangeOrder): Promise<boolean> {
    if (itemData) {
      try {
        await this.logArchive({
          entity_type: 'change_order',
          entity_id: id,
          entity_name: itemData.title_ar,
          project_id: itemData.project_id,
          archived_data: itemData,
          deleted_by: 'User Action'
        });
      } catch (e) {
        logger.warn('logArchive notice:', { detail: e });
      }
    }
    try {
      await supabase.from('pm_change_orders').delete().eq('id', id);
    } catch (e) {
      logger.warn('deleteChangeOrder notice:', { detail: e });
    }
    if (itemData?.project_id) {
      appCache.invalidate(CACHE_KEYS.changeOrders(itemData.project_id));
      appCache.invalidate('tabs:archiveLogs');
      await contractsService.syncProjectVosTotal(itemData.project_id);
    }
    return true;
  }

  // --- INVOICES ---
  static async getInvoices(projectId: string): Promise<ProjectInvoice[]> {
    return appCache.getOrFetch(CACHE_KEYS.invoices(projectId), TTL.tabData, async () => {
      try {
        const { data, error } = await supabase
          .from('pm_invoices')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: true });

        if (error) return [];
        return data || [];
      } catch {
        return [];
      }
    });
  }

  static async addInvoice(inv: Partial<ProjectInvoice>): Promise<ProjectInvoice | null> {
    const { data, error } = await supabase
      .from('pm_invoices')
      .insert([inv])
      .select()
      .single();
    if (inv.project_id) {
      appCache.invalidate(CACHE_KEYS.invoices(inv.project_id));
      appCache.invalidate('tabs:archiveLogs');
    }
    if (error) throw error;
    return data;
  }

  static async deleteInvoice(id: string, itemData?: ProjectInvoice): Promise<boolean> {
    if (itemData) {
      await this.logArchive({
        entity_type: 'invoice',
        entity_id: id,
        entity_name: itemData.ipc_number,
        project_id: itemData.project_id,
        archived_data: itemData,
        deleted_by: 'User Action'
      });
    }
    const { error } = await supabase.from('pm_invoices').delete().eq('id', id);
    if (itemData?.project_id) {
      appCache.invalidate(CACHE_KEYS.invoices(itemData.project_id));
      appCache.invalidate('tabs:archiveLogs');
    }
    if (error) throw error;
    return true;
  }

  // --- ARCHIVE LOGS ---
  static async logArchive(archive: Partial<ArchiveLog>): Promise<void> {
    try {
      await supabase.from('pm_archive_logs').insert([{
        ...archive,
        archived_at: new Date().toISOString()
      }]);
      appCache.invalidate('tabs:archiveLogs');
    } catch (err) {
      logger.warn('Could not log archive:', { detail: err });
    }
  }

  static async getArchiveLogs(projectId?: string): Promise<ArchiveLog[]> {
    return appCache.getOrFetch(CACHE_KEYS.archiveLogs(projectId || 'all'), TTL.tabData, async () => {
      try {
        let query = supabase.from('pm_archive_logs').select('*').order('archived_at', { ascending: false });
        if (projectId) {
          query = query.eq('project_id', projectId);
        }
        const { data, error } = await query;
        if (error) return [];
        return data || [];
      } catch {
        return [];
      }
    });
  }
}
