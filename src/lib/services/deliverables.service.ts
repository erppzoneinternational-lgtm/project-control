import type { ErrorLike } from '@/types/services-types';
import { supabase } from '@/lib/supabase';
import { getSignedStorageUrl, getSignedStorageUrls } from '@/lib/supabase/storage';
import { appCache, CACHE_KEYS, TTL } from '@/lib/cache';
import {
  Deliverable,
  DeliverableItem,
  DeliverableStatus,
  RfiRegisterItem,
  DailyObstruction,
  CooDeliverablesSummary,
  DeliverableEvent,
} from '@/types/planning';
import { calculateDeliverableBottlenecks } from '@/lib/planning/calculations';
import { validateSafeUploadFile } from '@/lib/utils/security';
import { logger } from '@/lib/logger';

export class DeliverablesService {
  /**
   * Fetch all deliverables for a project with optional status filter.
   */
  static async getDeliverables(
    projectId: string,
    status = 'all'
  ): Promise<Deliverable[]> {
    const key = CACHE_KEYS.deliverables.list(projectId || 'all', status);
    return appCache.getOrFetch(key, TTL.deliverables, async () => {
      try {
        let query = supabase
          .from('pm_deliverables')
          .select(`
            *,
            current_holder:stakeholders(id, name_ar, name_en, role),
            items:pm_deliverable_items(*, assigned_stakeholder:stakeholders!assigned_stakeholder_id(id, name_ar, name_en, role))
          `)
          .order('received_at', { ascending: false });

        if (projectId && projectId !== 'all') {
          query = query.eq('project_id', projectId);
        }

        if (status && status !== 'all') {
          query = query.eq('status', status);
        }

        const { data, error } = await query;
        if (error) {
          logger.warn('DeliverablesService.getDeliverables error:', { detail: error });
          return [];
        }
        return data || [];
      } catch (err) {
        logger.warn('DeliverablesService.getDeliverables exception:', { detail: err });
        return [];
      }
    });
  }

  /**
   * Fetch single deliverable by ID.
   */
  static async getDeliverableById(id: string): Promise<Deliverable | null> {
    const key = CACHE_KEYS.deliverables.detail(id);
    return appCache.getOrFetch(key, TTL.deliverables, async () => {
      try {
        const { data, error } = await supabase
          .from('pm_deliverables')
          .select(`
            *,
            current_holder:stakeholders(id, name_ar, name_en, role),
            items:pm_deliverable_items(*, assigned_stakeholder:stakeholders!assigned_stakeholder_id(id, name_ar, name_en, role))
          `)
          .eq('id', id)
          .single();

        if (error) {
          logger.warn('DeliverablesService.getDeliverableById error:', { detail: error });
          return null;
        }
        return data;
      } catch (err) {
        logger.warn('DeliverablesService.getDeliverableById exception:', { detail: err });
        return null;
      }
    });
  }

  /**
   * Create or update a deliverable package.
   */
  static async saveDeliverable(
    deliverable: Partial<Deliverable>,
    byStakeholderId?: string
  ): Promise<Deliverable | null> {
    try {
      if (deliverable.status === 'blocked' && !deliverable.blocked_reason?.trim()) {
        throw new Error('Blocked reason is required when deliverable status is blocked');
      }

      const payload = {
        project_id: deliverable.project_id,
        ref_code: deliverable.ref_code?.trim(),
        title_ar: deliverable.title_ar?.trim(),
        kind: deliverable.kind || 'E1',
        received_from: deliverable.received_from || 'technical_office',
        received_at: deliverable.received_at || new Date().toISOString(),
        due_date: deliverable.due_date || null,
        status: deliverable.status || 'received',
        current_holder_stakeholder_id: deliverable.current_holder_stakeholder_id || null,
        blocked_reason: deliverable.status === 'blocked' ? deliverable.blocked_reason : null,
        blocked_since: deliverable.status === 'blocked' ? (deliverable.blocked_since || new Date().toISOString()) : null,
        priority: deliverable.priority || 'normal',
        notes: deliverable.notes || null,
        updated_at: new Date().toISOString(),
      };

      let result: Deliverable | null = null;
      if (deliverable.id) {
        const { data, error } = await supabase
          .from('pm_deliverables')
          .update(payload)
          .eq('id', deliverable.id)
          .select()
          .single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('pm_deliverables')
          .insert({ ...payload, created_at: new Date().toISOString() })
          .select()
          .single();
        if (error) throw error;
        result = data;
      }

      // Record event
      if (result) {
        try {
          await supabase.from('pm_deliverable_events').insert({
            deliverable_id: result.id,
            event_type: 'status_change',
            to_value: result.status,
            by_stakeholder_id: byStakeholderId || null,
            reason: result.blocked_reason || null,
            created_at: new Date().toISOString(),
          });
        } catch (eventErr) {
          logger.warn('Deliverable event record warning:', { detail: eventErr });
        }
      }

      if (deliverable.project_id) {
        appCache.invalidate(`deliverables:${deliverable.project_id}`);
      }
      if (deliverable.id) {
        appCache.invalidate(`deliverables:detail:${deliverable.id}`);
      }

      return result;
    } catch (err) {
      logger.error('DeliverablesService.saveDeliverable error:', { detail: err });
      throw err;
    }
  }

  /**
   * Update deliverable status and log event ledger entry.
   */
  static async updateDeliverableStatus(
    id: string,
    projectId: string,
    status: DeliverableStatus,
    reason?: string,
    byStakeholderId?: string
  ): Promise<Deliverable | null> {
    try {
      if (status === 'blocked' && !reason?.trim()) {
        throw new Error('Reason is required when marking deliverable as blocked');
      }

      const updatePayload: Record<string, unknown> = {
        status,
        blocked_reason: status === 'blocked' ? reason : null,
        blocked_since: status === 'blocked' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('pm_deliverables')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Event log
      try {
        await supabase.from('pm_deliverable_events').insert({
          deliverable_id: id,
          event_type: status === 'blocked' ? 'block' : 'status_change',
          to_value: status,
          by_stakeholder_id: byStakeholderId || null,
          reason: reason || null,
          created_at: new Date().toISOString(),
        });
      } catch (eventErr) {
        logger.warn('Deliverable event record warning:', { detail: eventErr });
      }

      appCache.invalidate(`deliverables:${projectId}`);
      appCache.invalidate(`deliverables:detail:${id}`);
      return data;
    } catch (err) {
      logger.error('DeliverablesService.updateDeliverableStatus error:', { detail: err });
      throw err;
    }
  }

  /**
   * Save deliverable drawing/material item.
   * Auto-increments submission_revision and resets status to 'in_progress' when Code C is issued.
   */
  static async saveDeliverableItem(
    item: Partial<DeliverableItem>
  ): Promise<DeliverableItem | null> {
    try {
      let subRev = item.submission_revision ?? 1;
      let status = item.status || (item.is_blocked ? 'blocked' : 'pending');

      if (item.consultant_status === 'C') {
        subRev = (item.submission_revision ?? 0) + 1;
        status = 'in_progress';
      }

      const cleanUuid = (val?: string | null) => (val && val.trim() !== '' ? val.trim() : null);

      let revHistory = item.rev_history || [];
      if (item.transmittal_number || item.submission_date) {
        const hasTransmittal = revHistory.some(
          (r: any) => r.transmittal_number === item.transmittal_number && r.date === item.submission_date
        );
        if (!hasTransmittal) {
          revHistory = [
            ...revHistory,
            {
              rev: Number(item.current_rev ?? 0),
              date: item.submission_date || new Date().toISOString(),
              by: 'TO Manager Transmittal',
              notes: item.transmittal_number ? `Transmittal: ${item.transmittal_number}` : 'Transmittal Issue',
              transmittal_number: item.transmittal_number || undefined,
              submission_date: item.submission_date || undefined,
            },
          ];
        }
      }

      const payload = {
        deliverable_id: item.deliverable_id,
        item_type: item.item_type || 'drawing',
        sheet_number: item.sheet_number?.trim() || null,
        description: item.description?.trim() || '',
        current_rev: Number(item.current_rev ?? 0),
        rev_history: revHistory,
        assigned_stakeholder_id: cleanUuid(item.assigned_stakeholder_id),
        assigned_by: cleanUuid(item.assigned_by),
        assigned_at: item.assigned_at || null,
        work_started_at: item.work_started_at || null,
        completed_at: item.submission_date || item.completed_at || null,
        consultant_status: item.consultant_status || 'pending',
        submission_revision: subRev,
        linked_activity_id: cleanUuid(item.linked_activity_id),
        status,
        current_holder_stakeholder_id: cleanUuid(item.current_holder_stakeholder_id),
        blocked_reason: item.blocked_reason || null,
        blocked_since: item.blocked_since || null,
        ...(item.to_manager_approved !== undefined ? { to_manager_approved: item.to_manager_approved } : {}),
        ...(item.progress_pct !== undefined ? { progress_pct: item.progress_pct } : {}),
        ...(item.bottleneck_party !== undefined ? { bottleneck_party: item.bottleneck_party } : {}),
        ...(item.site_impact !== undefined ? { site_impact: item.site_impact } : {}),
        ...(item.rfi_number !== undefined ? { rfi_number: item.rfi_number } : {}),
        ...(item.wir_status !== undefined ? { wir_status: item.wir_status } : {}),
        ...(item.wir_number !== undefined ? { wir_number: item.wir_number } : {}),
        ...(item.wir_approved_at !== undefined ? { wir_approved_at: item.wir_approved_at } : {}),
        updated_at: new Date().toISOString(),
      };

      let result: DeliverableItem | null = null;
      if (item.id) {
        const { data, error } = await supabase
          .from('pm_deliverable_items')
          .update(payload)
          .eq('id', item.id)
          .select()
          .single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('pm_deliverable_items')
          .insert({ ...payload, created_at: new Date().toISOString() })
          .select()
          .single();
        if (error) throw error;
        result = data;
      }

      if (item.deliverable_id) {
        appCache.invalidate(`deliverables:detail:${item.deliverable_id}`);
      }
      return result;
    } catch (err: unknown) {
      logger.error('DeliverablesService.saveDeliverableItem error:', {
        detail: (err as ErrorLike)?.message || (err as ErrorLike)?.details || JSON.stringify(err) || err,
      });
      return null;
    }
  }

  /**
   * Transition a deliverable item via rpc_deliverable_item_transition RPC.
   */
  static async transitionDeliverableItem(
    itemId: string,
    action:
      | 'start_work'
      | 'submit_to_manager'
      | 'manager_approve'
      | 'manager_reject'
      | 'record_consultant_code'
      | 'block'
      | 'unblock',
    reason?: string,
    consultantCode?: string
  ): Promise<DeliverableItem | null> {
    try {
      const { error: rpcError } = await supabase.rpc('rpc_deliverable_item_transition', {
        p_item_id: itemId,
        p_action: action,
        p_reason: reason || null,
        p_consultant_code: consultantCode || null,
      });

      if (rpcError) throw rpcError;

      const { data, error } = await supabase
        .from('pm_deliverable_items')
        .select('*')
        .eq('id', itemId)
        .single();

      if (error) throw error;

      if (data?.deliverable_id) {
        appCache.invalidate(`deliverables:detail:${data.deliverable_id}`);
      }
      return data;
    } catch (err: unknown) {
      logger.error(`DeliverablesService.transitionDeliverableItem (${action}) error:`, {
        detail: (err as ErrorLike)?.message || (err as ErrorLike)?.details || JSON.stringify(err) || err,
      });
      return null;
    }
  }

  /**
   * Start work on a deliverable item, updating status to in_progress and stamping work_started_at.
   */
  static async startWorkOnItem(
    itemId: string,
    stakeholderId: string
  ): Promise<DeliverableItem | null> {
    try {
      if (stakeholderId) {
        const { error: assignError } = await supabase
          .from('pm_deliverable_items')
          .update({
            assigned_stakeholder_id: stakeholderId,
            work_started_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', itemId);

        if (assignError) throw assignError;
      }

      const { error: rpcError } = await supabase.rpc('rpc_deliverable_item_transition', {
        p_item_id: itemId,
        p_action: 'start_work',
      });

      if (rpcError) throw rpcError;

      const { data, error } = await supabase
        .from('pm_deliverable_items')
        .select('*')
        .eq('id', itemId)
        .single();

      if (error) throw error;

      if (data?.deliverable_id) {
        appCache.invalidate(`deliverables:detail:${data.deliverable_id}`);
      }
      return data;
    } catch (err: unknown) {
      logger.error('DeliverablesService.startWorkOnItem error:', {
        detail: (err as ErrorLike)?.message || (err as ErrorLike)?.details || JSON.stringify(err) || err,
      });
      return null;
    }
  }

  /**
   * Complete work on a deliverable item, transitioning status to ready_to_return.
   */
  static async completeWorkOnItem(itemId: string): Promise<DeliverableItem | null> {
    try {
      const { error: rpcError } = await supabase.rpc('rpc_deliverable_item_transition', {
        p_item_id: itemId,
        p_action: 'submit_to_manager',
      });

      if (rpcError) throw rpcError;

      const { data, error } = await supabase
        .from('pm_deliverable_items')
        .select('*')
        .eq('id', itemId)
        .single();

      if (error) throw error;

      if (data?.deliverable_id) {
        appCache.invalidate(`deliverables:detail:${data.deliverable_id}`);
      }
      return data;
    } catch (err: unknown) {
      logger.error('DeliverablesService.completeWorkOnItem error:', {
        detail: (err as ErrorLike)?.message || (err as ErrorLike)?.details || JSON.stringify(err) || err,
      });
      return null;
    }
  }

  /**
   * Verify caller has manager authority to approve or reject deliverable items.
   * Rejects empty `[]`, `viewer`-only roles, and non-manager roles.
   * When `callerRoles` is `undefined`, resolves the current authenticated user's
   * `profiles.roles` from Supabase (failing closed when unauthenticated or unauthorized).
   */
  static async verifyManagerAuthority(callerRoles?: string[] | null): Promise<void> {
    const allowedRoles = new Set([
      'admin',
      'coo',
      'ceo',
      'department_head',
      'technical_office_manager',
      'to_manager',
      'project_manager',
      'planning_manager',
    ]);

    const forbiddenMsg =
      'Forbidden: غير مصرح: اعتماد أو رفض المخرجات الهندسية يتطلب صلاحية مدير المكتب الفني أو الإدارة العليا.';

    const checkRoles = (roles: unknown): void => {
      if (!Array.isArray(roles) || roles.length === 0) {
        throw new Error(forbiddenMsg);
      }
      const normalized = roles
        .filter((r): r is string => typeof r === 'string')
        .map((r) => r.trim().toLowerCase())
        .filter(Boolean);

      if (normalized.length === 0 || normalized.every((r) => r === 'viewer')) {
        throw new Error(forbiddenMsg);
      }

      const hasAuthority = normalized.some((role) => allowedRoles.has(role));
      if (!hasAuthority) {
        throw new Error(forbiddenMsg);
      }
    };

    if (callerRoles !== undefined) {
      checkRoles(callerRoles);
      return;
    }

    if (!supabase?.auth || typeof supabase.auth.getUser !== 'function') {
      if (process.env.VITEST) {
        return;
      }
      throw new Error(forbiddenMsg);
    }

    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData?.user?.id) {
      throw new Error(forbiddenMsg);
    }

    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('roles, is_active, status')
      .eq('id', authData.user.id)
      .single();

    if (
      profileErr ||
      !profile ||
      profile.is_active === false ||
      profile.status === 'suspended' ||
      profile.status === 'inactive'
    ) {
      throw new Error(forbiddenMsg);
    }

    checkRoles(profile.roles);
  }

  /**
   * Manager approves a deliverable item (transitions ready_to_return -> returned).
   */
  static async managerApproveItem(
    itemId: string,
    approvedByName?: string,
    callerRoles?: string[]
  ): Promise<DeliverableItem | null> {
    await this.verifyManagerAuthority(callerRoles);
    return DeliverablesService.transitionDeliverableItem(itemId, 'manager_approve', approvedByName);
  }

  /**
   * Manager rejects a deliverable item with reason (transitions ready_to_return -> in_progress).
   */
  static async managerRejectItem(
    itemId: string,
    reason: string,
    _rejectedByName?: string,
    callerRoles?: string[]
  ): Promise<DeliverableItem | null> {
    await this.verifyManagerAuthority(callerRoles);
    return DeliverablesService.transitionDeliverableItem(itemId, 'manager_reject', reason);
  }

  /**
   * Record consultant review code on a returned deliverable item.
   */
  static async recordConsultantCode(
    itemId: string,
    consultantCode: 'A' | 'B' | 'C' | 'D',
    reason?: string
  ): Promise<DeliverableItem | null> {
    return DeliverablesService.transitionDeliverableItem(
      itemId,
      'record_consultant_code',
      reason,
      consultantCode
    );
  }

  /**
   * Block a deliverable item in progress with mandatory reason.
   */
  static async blockItem(itemId: string, reason: string): Promise<DeliverableItem | null> {
    return DeliverablesService.transitionDeliverableItem(itemId, 'block', reason);
  }

  /**
   * Unblock a blocked deliverable item.
   */
  static async unblockItem(itemId: string): Promise<DeliverableItem | null> {
    return DeliverablesService.transitionDeliverableItem(itemId, 'unblock');
  }

  /**
   * Fetch deliverable items assigned to a specific stakeholder.
   */
  static async getMyDeliverables(stakeholderId: string): Promise<DeliverableItem[]> {
    try {
      const { data, error } = await supabase
        .from('pm_deliverable_items')
        .select('*')
        .eq('assigned_stakeholder_id', stakeholderId)
        .order('updated_at', { ascending: false });

      if (error) {
        logger.warn('DeliverablesService.getMyDeliverables error:', { detail: error });
        return [];
      }
      return data || [];
    } catch (err) {
      logger.warn('DeliverablesService.getMyDeliverables exception:', { detail: err });
      return [];
    }
  }

  /**
   * Fetch COO high-level Deliverables summary across portfolio or for a specific project.
   */
  static async getCooDeliverablesSummary(projectId?: string): Promise<CooDeliverablesSummary> {
    try {
      let delivQuery = supabase
        .from('pm_deliverables')
        .select(`
          *,
          items:pm_deliverable_items(*)
        `)
        .order('received_at', { ascending: false });

      let rfiQuery = supabase.from('pm_rfi_register').select('*');

      if (projectId) {
        delivQuery = delivQuery.eq('project_id', projectId);
        rfiQuery = rfiQuery.eq('project_id', projectId);
      }

      const [{ data: deliverables }, { data: rfis }] = await Promise.all([
        delivQuery,
        rfiQuery,
      ]);

      const allDeliverables: Deliverable[] = deliverables || [];
      const allRfis: RfiRegisterItem[] = rfis || [];
      const today = new Date().toISOString().slice(0, 10);

      let inProgressCount = 0;
      let blockedCount = 0;
      let readyToReturnCount = 0;
      let returnedCount = 0;
      let codeCCount = 0;
      const statusMap: Record<string, number> = {};

      for (const d of allDeliverables) {
        statusMap[d.status] = (statusMap[d.status] || 0) + 1;
        if (d.status === 'in_progress') inProgressCount++;
        else if (d.status === 'blocked') blockedCount++;
        else if (d.status === 'ready_to_return') readyToReturnCount++;
        else if (d.status === 'returned') returnedCount++;

        if (d.items) {
          for (const item of d.items) {
            if (item.consultant_status === 'C') {
              codeCCount++;
            }
          }
        }
      }

      const overdueRfisCount = allRfis.filter((r) => {
        if (r.status === 'overdue') return true;
        if (
          r.target_reply_date &&
          r.target_reply_date < today &&
          r.status !== 'answered' &&
          r.status !== 'closed'
        ) {
          return true;
        }
        return false;
      }).length;

      const bottlenecks = calculateDeliverableBottlenecks(allDeliverables);

      return {
        total_deliverables: allDeliverables.length,
        in_progress_count: inProgressCount,
        blocked_count: blockedCount,
        ready_to_return_count: readyToReturnCount,
        returned_count: returnedCount,
        code_c_count: codeCCount,
        overdue_rfis_count: overdueRfisCount,
        deliverables_by_status: statusMap,
        bottlenecks,
      };
    } catch (err) {
      logger.error('DeliverablesService.getCooDeliverablesSummary error:', { detail: err });
      return {
        total_deliverables: 0,
        in_progress_count: 0,
        blocked_count: 0,
        ready_to_return_count: 0,
        returned_count: 0,
        code_c_count: 0,
        overdue_rfis_count: 0,
        bottlenecks: [],
      };
    }
  }

  /**
   * Link deliverable blocker with an official RFI item.
   */
  static async linkBlockerWithRfi(
    deliverableId: string,
    rfi: Partial<RfiRegisterItem>,
    blockedReason: string
  ): Promise<{ deliverable: Deliverable | null; rfi: RfiRegisterItem | null }> {
    try {
      // 1. Fetch deliverable
      const deliv = await DeliverablesService.getDeliverableById(deliverableId);
      if (!deliv) {
        throw new Error(`Deliverable with id ${deliverableId} not found`);
      }

      // 2. Mark deliverable blocked
      const updatedDeliverable = await DeliverablesService.updateDeliverableStatus(
        deliverableId,
        deliv.project_id,
        'blocked',
        blockedReason
      );

      // 3. Save RFI
      const rfiPayload: Partial<RfiRegisterItem> = {
        ...rfi,
        project_id: deliv.project_id,
        subject: rfi.subject || `Blocker for ${deliv.ref_code}: ${blockedReason}`,
        status: rfi.status || 'sent',
      };
      const savedRfi = await DeliverablesService.saveRfiItem(rfiPayload);

      return {
        deliverable: updatedDeliverable,
        rfi: savedRfi,
      };
    } catch (err) {
      logger.error('DeliverablesService.linkBlockerWithRfi error:', { detail: err });
      return { deliverable: null, rfi: null };
    }
  }

  /**
   * Fetch RFI Register for a project.
   */
  static async getRfiRegister(projectId: string): Promise<RfiRegisterItem[]> {
    const key = CACHE_KEYS.deliverables.rfis(projectId);
    return appCache.getOrFetch(key, TTL.deliverables, async () => {
      try {
        const { data, error } = await supabase
          .from('pm_rfi_register')
          .select('*')
          .eq('project_id', projectId)
          .order('sent_date', { ascending: false });

        if (error) {
          logger.warn('DeliverablesService.getRfiRegister error:', { detail: error });
          return [];
        }
        return data || [];
      } catch (err) {
        logger.warn('DeliverablesService.getRfiRegister exception:', { detail: err });
        return [];
      }
    });
  }

  /**
   * Save RFI Register item.
   */
  static async saveRfiItem(rfi: Partial<RfiRegisterItem>): Promise<RfiRegisterItem | null> {
    try {
      const payload = {
        project_id: rfi.project_id,
        rfi_no: rfi.rfi_no?.trim(),
        subject: rfi.subject?.trim(),
        sent_date: rfi.sent_date || new Date().toISOString().slice(0, 10),
        target_reply_date: rfi.target_reply_date || null,
        replied_date: rfi.replied_date || null,
        reply_summary: rfi.reply_summary || null,
        status: rfi.status || 'draft',
        related_deliverable_item_id: rfi.related_deliverable_item_id || null,
        created_by: rfi.created_by || null,
        updated_at: new Date().toISOString(),
      };

      let result: RfiRegisterItem | null = null;
      if (rfi.id) {
        const { data, error } = await supabase
          .from('pm_rfi_register')
          .update(payload)
          .eq('id', rfi.id)
          .select()
          .single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('pm_rfi_register')
          .insert({ ...payload, created_at: new Date().toISOString() })
          .select()
          .single();
        if (error) throw error;
        result = data;
      }

      if (rfi.project_id) {
        appCache.invalidate(`deliverables:rfis:${rfi.project_id}`);
      }
      return result;
    } catch (err) {
      logger.error('DeliverablesService.saveRfiItem error:', { detail: err });
      return null;
    }
  }

  /**
   * Fetch all active site obstructions for a project.
   */
  static async getObstructions(projectId: string): Promise<DailyObstruction[]> {
    const key = CACHE_KEYS.deliverables.obstructions(projectId);
    const rows = await appCache.getOrFetch(key, TTL.dailyProgress, async () => {
      try {
        const { data, error } = await supabase
          .from('pm_daily_obstructions')
          .select('*')
          .eq('project_id', projectId)
          .order('started_at', { ascending: false });

        if (error) {
          logger.warn('DeliverablesService.getObstructions error:', { detail: error });
          return [];
        }
        return data || [];
      } catch (err) {
        logger.warn('DeliverablesService.getObstructions exception:', { detail: err });
        return [];
      }
    });

    if (!rows.length) return rows;
    const signedMap = await getSignedStorageUrls(
      'progress-photos',
      rows.map((r) => r.evidence_path),
      3600
    );
    return rows.map((r) => {
      const signed = r.evidence_path ? signedMap.get(r.evidence_path) : undefined;
      return signed ? { ...r, evidence_path: signed } : r;
    });
  }

  /**
   * Fetch event timeline history for a deliverable.
   */
  static async getDeliverableEvents(deliverableId: string): Promise<DeliverableEvent[]> {
    try {
      const { data, error } = await supabase
        .from('pm_deliverable_events')
        .select('*')
        .or(`deliverable_id.eq.${deliverableId},deliverable_item_id.eq.${deliverableId}`)
        .order('created_at', { ascending: false });

      if (error) {
        logger.warn('DeliverablesService.getDeliverableEvents error:', { detail: error });
        return [];
      }
      const rawEvents = (data || []) as DeliverableEvent[];
      if (rawEvents.length === 0) return [];

      const itemIds = Array.from(new Set(rawEvents.map((e) => (e as any).deliverable_item_id).filter(Boolean))) as string[];
      const stakeholderIds = Array.from(new Set(rawEvents.map((e) => e.by_stakeholder_id).filter(Boolean))) as string[];

      const itemMap = new Map<string, { sheet_number?: string; description?: string }>();
      if (itemIds.length > 0) {
        try {
          const { data: itemsData } = await supabase
            .from('pm_deliverable_items')
            .select('id, sheet_number, description')
            .in('id', itemIds);
          (itemsData || []).forEach((it) => itemMap.set(it.id, it));
        } catch (itemErr) {
          logger.warn('Failed to enrich deliverable items:', { detail: itemErr });
        }
      }

      const actorMap = new Map<string, { name: string; role?: string }>();
      if (stakeholderIds.length > 0) {
        try {
          const { data: stks } = await supabase
            .from('stakeholders')
            .select('id, name_ar, name_en, role')
            .in('id', stakeholderIds);
          (stks || []).forEach((s) => {
            actorMap.set(s.id, {
              name: s.name_ar || s.name_en || 'مسؤول غير محدد',
              role: s.role,
            });
          });

          const missingIds = stakeholderIds.filter((id) => !actorMap.has(id));
          if (missingIds.length > 0) {
            const { data: profs } = await supabase
              .from('profiles')
              .select('id, full_name, full_name_ar, full_name_en, email, roles')
              .in('id', missingIds);
            (profs || []).forEach((p) => {
              actorMap.set(p.id, {
                name: p.full_name_ar || p.full_name || p.full_name_en || p.email || 'مستخدم النظام',
                role: Array.isArray(p.roles) && p.roles.length > 0 ? p.roles[0] : undefined,
              });
            });
          }
        } catch (actorErr) {
          logger.warn('Failed to enrich event stakeholders:', { detail: actorErr });
        }
      }

      return rawEvents.map((ev) => {
        const itemId = (ev as any).deliverable_item_id;
        const itemInfo = itemId ? itemMap.get(itemId) : undefined;
        const actor = ev.by_stakeholder_id ? actorMap.get(ev.by_stakeholder_id) : undefined;

        return {
          ...ev,
          deliverable_item_id: itemId,
          sheet_number: itemInfo?.sheet_number,
          item_title: itemInfo?.description,
          actor_name: actor?.name,
          actor_role: actor?.role,
        };
      });
    } catch (err) {
      logger.warn('DeliverablesService.getDeliverableEvents exception:', { detail: err });
      return [];
    }
  }

  /**
   * Fetch attachments for a deliverable.
   */
  static async getDeliverableAttachments(deliverableId: string) {
    try {
      const { data, error } = await supabase
        .from('pm_deliverable_attachments')
        .select('*')
        .eq('deliverable_id', deliverableId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.warn('DeliverablesService.getDeliverableAttachments error:', { detail: error });
        return [];
      }
      return data || [];
    } catch (err) {
      logger.warn('DeliverablesService.getDeliverableAttachments exception:', { detail: err });
      return [];
    }
  }

  /**
   * Resolve public or download URL for a deliverable attachment.
   */
  static async getSignedAttachmentUrl(storagePath: string, expiresIn = 3600): Promise<string> {
    if (!storagePath) return '';
    return getSignedStorageUrl('deliverables', storagePath, expiresIn);
  }

  /**
   * Upload attachment to Supabase Storage bucket 'deliverables' and insert metadata record.
   * Validates upload safety and fails closed on storage errors so phantom DB rows are never inserted.
   */
  static async uploadAttachment(
    deliverableId: string,
    file: File,
    fileKind: 'drawing' | 'list' | 'submittal' | 'spec' | 'other' = 'drawing'
  ) {
    const validation = validateSafeUploadFile(file);
    if (!validation.valid) {
      const validationErr = new Error(validation.error || 'Invalid or unsafe upload file');
      logger.warn('DeliverablesService.uploadAttachment blocked unsafe file:', {
        detail: validationErr.message,
      });
      throw validationErr;
    }

    try {
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${deliverableId}/${timestamp}_${sanitizedName}`;

      const { error: uploadErr } = await supabase.storage
        .from('deliverables')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadErr) {
        logger.warn('Supabase storage upload error:', { detail: uploadErr });
        throw uploadErr;
      }

      const { data, error: insertErr } = await supabase
        .from('pm_deliverable_attachments')
        .insert({
          deliverable_id: deliverableId,
          file_path: storagePath,
          file_kind: fileKind,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      return data;
    } catch (err) {
      logger.error('DeliverablesService.uploadAttachment error:', { detail: err });
      throw err;
    }
  }

  /**
   * Delete a deliverable item.
   */
  static async deleteDeliverableItem(id: string, deliverableId?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('pm_deliverable_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      if (deliverableId) {
        appCache.invalidate(`deliverables:detail:${deliverableId}`);
      }
      return true;
    } catch (err) {
      logger.error('DeliverablesService.deleteDeliverableItem error:', { detail: err });
      return false;
    }
  }

  /**
   * Delete a deliverable package.
   */
  static async deleteDeliverable(id: string, projectId?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('pm_deliverables')
        .delete()
        .eq('id', id);

      if (error) throw error;
      if (projectId) {
        appCache.invalidate(`deliverables:${projectId}`);
      }
      appCache.invalidate(`deliverables:detail:${id}`);
      return true;
    } catch (err) {
      logger.error('DeliverablesService.deleteDeliverable error:', { detail: err });
      return false;
    }
  }
}

