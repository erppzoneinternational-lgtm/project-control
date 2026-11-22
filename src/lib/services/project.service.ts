import type { ErrorLike } from '@/types/services-types';
import { supabase } from '@/lib/supabase';
import { unwrap, assertRows } from '@/lib/supabase/unwrap';
import { appCache, CACHE_KEYS, TTL } from '@/lib/cache';
import {
  Project,
  Client,
  Governorate,
  City,
  Stakeholder,
  ProjectFilterParams,
  StakeholderKind,
  RaciRole,
  ProjectStakeholder,
  StakeholderFull,
  ProjectClientContact,
  ProjectSiteResource,
  ProjectSubcontractor,
  AuditLogEntry
} from '@/types';
import { buildCreatePayload, buildUpdatePayload } from './project.payload';
import { logger } from '@/lib/logger';
import { ProjectTabsService } from './projectTabs.service';
import { EGYPT_GOVERNORATES_GEO, getCanonicalCitiesForGovernorate } from '@/lib/geo/egyptGeo';

export class ProjectService {
  /**
   * Fetch project IDs assigned to a specific user/email if they are restricted
   * Returns null if user is unrestricted (Admin, CEO, COO, Chairman, Commercial Manager)
   */
  static async getUserAssignedProjectIds(
    userEmail?: string,
    userRoles?: string[],
    options?: { strictStaffing?: boolean; userId?: string }
  ): Promise<string[] | null> {
    if (!userEmail) return null;

    const roles = userRoles || [];
    if (roles.length === 0) return []; // Non-assigned/pending users have zero project access (fail-closed)

    const unrestrictedRoles = options?.strictStaffing
      ? [
          'admin',
          'coo',
          'ceo',
          'coo_assistant',
          'chairman',
          'board_member',
          'viewer',
          'commercial_manager',
          'department_head',
          'technical_office_manager',
          'to_manager',
          'planning_manager'
        ]
      : [
          'admin',
          'ceo',
          'coo',
          'coo_assistant',
          'chairman',
          'board_member',
          'viewer',
          'commercial_manager',
          'planning_manager',
          'planning_engineer',
          'technical_office',
          'technical_office_manager',
          'to_manager',
          'contract_admin',
          'cost_control',
          'estimator'
        ];

    const isUnrestricted = roles.some((r) => unrestrictedRoles.includes(r));

    if (isUnrestricted) return null; // Can see all projects

    try {
      const assignedIds = new Set<string>();

      // 1. Direct project access via pm_user_project_access
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', userEmail.trim())
        .maybeSingle();

      if (userProfile) {
        const profilePk = userProfile.id;
        const { data: directAccess } = await supabase
          .from('pm_user_project_access')
          .select('project_id')
          .eq('user_id', profilePk);

        (directAccess || []).forEach((row) => {
          if (row.project_id) assignedIds.add(row.project_id);
        });
      }

      // 2. Query project_stakeholders via matching stakeholders by email or auth_user_id
      const effectiveUid = options?.userId || userProfile?.id;
      const { data: stks } = await supabase
        .from('stakeholders')
        .select('id')
        .or(`email.ilike.${userEmail.trim()}${effectiveUid ? `,auth_user_id.eq.${effectiveUid}` : ''}`);

      const stkIds = (stks || []).map((s) => s.id);

      if (stkIds.length > 0) {
        const { data: pStks } = await supabase
          .from('project_stakeholders')
          .select('project_id, is_active, end_date')
          .in('stakeholder_id', stkIds);

        const todayIso = new Date().toISOString().slice(0, 10);
        (pStks || []).forEach((ps: { project_id?: string; is_active?: boolean | null; end_date?: string | null }) => {
          if (!ps.project_id) return;
          if (ps.is_active === false) return;
          if (ps.end_date && String(ps.end_date).slice(0, 10) < todayIso) return;
          assignedIds.add(ps.project_id);
        });
      }

      // 3. Also check if assigned as PM directly on project
      const { data: pmProjects } = await supabase
        .from('pm_projects_with_manager')
        .select('id')
        .or(`project_manager_name_raw.ilike.%${userEmail}%,pm_full_name.ilike.%${userEmail}%`);

      (pmProjects || []).forEach((p) => {
        if (p.id) assignedIds.add(p.id);
      });

      return Array.from(assignedIds);
    } catch (e) {
      logger.warn('Error fetching assigned project IDs for user:', { detail: e });
      return null;
    }
  }

  /**
   * Fetch projects with filters and calculated total_contract_value
   */
  static async getProjects(
    params: ProjectFilterParams = {},
    allowedProjectIds?: string[] | null
  ): Promise<Project[]> {
    if (allowedProjectIds && allowedProjectIds.length === 0) {
      return [];
    }

    const cacheKey = CACHE_KEYS.projectList(JSON.stringify({ params, allowedProjectIds }));
    return appCache.getOrFetch(cacheKey, TTL.projectList, async () => {
      try {
        let query = supabase
          .from('pm_projects_with_manager')
          .select('*')
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (allowedProjectIds && allowedProjectIds.length > 0) {
          query = query.in('id', allowedProjectIds);
        }

        const isUuid = (val: string) =>
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

        const normalizedStatus = params.status ? String(params.status).trim().toLowerCase() : 'all';
        if (normalizedStatus && normalizedStatus !== 'all') {
          query = query.eq('status', normalizedStatus);
        }

        if (params.pzoneRole && params.pzoneRole !== 'all') {
          query = query.eq('pzone_role', params.pzoneRole);
        }

        if (params.clientId && params.clientId !== 'all') {
          if (isUuid(params.clientId)) {
            query = query.eq('client_id', params.clientId);
          } else {
            query = query.ilike('client_name_raw', `%${params.clientId}%`);
          }
        }

        if (params.governorateId && params.governorateId !== 'all') {
          query = query.eq('governorate_id', params.governorateId);
        }

        if (params.search && params.search.trim() !== '') {
          const search = params.search.trim();
          query = query.or(`project_code.ilike.%${search}%,project_name.ilike.%${search}%,client_name_raw.ilike.%${search}%`);
        }

        const clientsPromise = this.getClients();
        const projectsPromise = (async () => {
          let { data, error } = await query;
          if (error) {
            logger.warn('Supabase pm_projects_with_manager fetch error, falling back to projects table:', { detail: error });
            
            let fallbackQuery = supabase
              .from('pm_projects')
              .select('*')
              .is('deleted_at', null)
              .order('created_at', { ascending: false });

            if (allowedProjectIds && allowedProjectIds.length > 0) {
              fallbackQuery = fallbackQuery.in('id', allowedProjectIds);
            }
            if (params.status && params.status !== 'all') {
              fallbackQuery = fallbackQuery.eq('status', params.status);
            }
            if (params.pzoneRole && params.pzoneRole !== 'all') {
              fallbackQuery = fallbackQuery.eq('pzone_role', params.pzoneRole);
            }
            if (params.clientId && params.clientId !== 'all') {
              if (isUuid(params.clientId)) {
                fallbackQuery = fallbackQuery.eq('client_id', params.clientId);
              } else {
                fallbackQuery = fallbackQuery.ilike('client_name_raw', `%${params.clientId}%`);
              }
            }
            if (params.governorateId && params.governorateId !== 'all') {
              fallbackQuery = fallbackQuery.eq('governorate_id', params.governorateId);
            }
            if (params.search && params.search.trim() !== '') {
              const s = params.search.trim();
              fallbackQuery = fallbackQuery.or(`project_code.ilike.%${s}%,project_name.ilike.%${s}%,client_name_raw.ilike.%${s}%`);
            }

            const { data: fallbackData, error: fallbackError } = await fallbackQuery;
            if (!fallbackError) {
              data = fallbackData || [];
              error = null;
            } else {
              error = fallbackError;
            }
          }

          if (error) {
            throw new Error(`getProjects: ${error.message || 'فشل استرجاع قائمة المشاريع'}`);
          }
          return data || [];
        })();

        const [projectRows, clientsList] = await Promise.all([
          projectsPromise,
          clientsPromise,
        ]);

        if (projectRows.length === 0) {
          return [];
        }

        const clientMap = new Map(clientsList.map((c) => [c.id, c]));

        return projectRows.map((p) => {
          const clientObj = p.client_id ? clientMap.get(p.client_id) : undefined;
          const code = p.project_code || p.code || '';
          const name = p.project_name || p.name_ar || p.name_en || (code ? `مشروع ${code}` : 'مشروع');
          const baseContract = Number(p.contract_value ?? p.contract_value_egp ?? 0);
          const vosVal = Number(p.vos_value ?? 0);
          return {
            ...p,
            code: code,
            project_code: code,
            name_ar: p.name_ar || name,
            project_name: name,
            public_name: p.public_name || p.metadata?.public_name || undefined,
            water_structures: p.water_structures || p.metadata?.water_structures || [],
            client: clientObj || (p.client_name_raw ? { id: 'raw', name_ar: p.client_name_raw, code: 'RAW' } : undefined),
            total_contract_value: baseContract + vosVal,
          };
        });
      } catch (e) {
        logger.warn('Supabase projects fetch error:', { detail: e });
        throw e;
      }
    });
  }

  /**
   * Get single project by ID or code
   */
  static async getProjectById(id: string): Promise<Project | null> {
    return appCache.getOrFetch(CACHE_KEYS.project(id), TTL.projectDetail, async () => {
      const { data, error } = await supabase
        .from('pm_projects_with_manager')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        logger.warn('Supabase getProjectById error:', { detail: error });
        throw new Error(`getProjectById(${id}): ${error.message || 'فشل استرجاع بيانات المشروع'}`);
      }

      if (!data) return null;

      const [clientsList, govs, cities] = await Promise.all([
        this.getClients(),
        this.getGovernorates(),
        this.getCities(),
      ]);

      const clientObj = data.client_id
        ? clientsList.find((c) => c.id === data.client_id)
        : undefined;

      const govObj = data.governorate_id
        ? govs.find((g) => g.id === data.governorate_id)
        : undefined;

      const cityObj = data.city_id
        ? cities.find((c) => c.id === data.city_id)
        : undefined;

      return {
        ...data,
        public_name: data.public_name || data.metadata?.public_name || undefined,
        water_structures: data.water_structures || data.metadata?.water_structures || [],
        variation_orders: data.variation_orders || data.metadata?.variation_orders || [],
        client: clientObj || (data.client_name_raw ? { id: 'raw', name_ar: data.client_name_raw, code: 'RAW' } : undefined),
        governorate: govObj,
        city: cityObj,
        total_contract_value: Number(data.contract_value ?? data.contract_value_egp ?? 0) + Number(data.vos_value || 0),
      };
    });
  }

  /**
   * Auto-suggest next YYNN project code (e.g. 2607 -> 2608)
   */
  static async getNextProjectCode(): Promise<string> {
    return appCache.getOrFetch(CACHE_KEYS.nextProjectCode(), TTL.projectDetail, async () => {
      const currentYear2Digit = new Date().getFullYear().toString().slice(-2); // e.g. "26"

      try {
        // 1. Try RPC if defined in Supabase
        const { data: rpcData, error: rpcErr } = await supabase.rpc('get_next_project_code');
        if (!rpcErr && rpcData) {
          return String(rpcData);
        }
      } catch (e) {
        // ignore RPC fallback
      }

      try {
        // 2. Fetch all non-deleted project_code values from pm_projects
        const { data, error } = await supabase
          .from('pm_projects')
          .select('project_code')
          .is('deleted_at', null);

        if (!error && data && data.length > 0) {
          let maxNum = 0;
          data.forEach((p: { project_code?: string }) => {
            if (!p.project_code) return;
            // Match codes starting with or containing YY followed by digits, e.g. "2607" -> 7, "2601" -> 1
            const cleanCode = p.project_code.trim();
            // Regex matches YY followed by 2 or more digits
            const match = cleanCode.match(new RegExp(`(?:^|\\D)${currentYear2Digit}(\\d{2,4})(?:$|\\D)`));
            if (match && match[1]) {
              const num = parseInt(match[1], 10);
              if (!isNaN(num) && num > maxNum) {
                maxNum = num;
              }
            }
          });

          if (maxNum > 0) {
            const nextNum = maxNum + 1;
            const paddedNum = nextNum.toString().padStart(2, '0');
            return `${currentYear2Digit}${paddedNum}`;
          }
        }
      } catch (e) {
        logger.warn('Supabase max project_code fetch notice:', { detail: e });
      }

      // Default first project of the year
      return `${currentYear2Digit}01`;
    });
  }

  /**
   * Create new project — only sends columns that exist in the pm_projects view
   */
  static async createProject(project: Partial<Project>): Promise<Project> {
    const payload = buildCreatePayload(project, project.organization_id);

    const { error: insertErr } = await supabase
      .from('pm_projects')
      .insert(payload);

    if (insertErr) {
      const isTriggerError =
        (insertErr.message || '').includes('structure of the triggering table') ||
        insertErr.code === '42P17';
      if (!isTriggerError) {
        throw new Error(
          insertErr.message || insertErr.details || insertErr.hint || 'فشل حفظ المشروع في قاعدة البيانات'
        );
      }
      // Trigger error: check if row was actually inserted despite the trigger error
    }

    const { data: createdProject, error: fetchErr } = await supabase
      .from('pm_projects')
      .select('*')
      .eq('project_code', payload.project_code)
      .maybeSingle();

    if (createdProject) {
      appCache.invalidate('projects:');
      appCache.invalidate(CACHE_KEYS.nextProjectCode());
      return createdProject as Project;
    }

    throw new Error(
      insertErr?.message || fetchErr?.message || 'فشل حفظ المشروع — لم يتم إنشاء السجل في قاعدة البيانات'
    );
  }

  /**
   * Update project — only sends real pm_projects columns to PostgREST.
   * Computed relation fields (client, governorate, city, total_contract_value,
   * pm_*, water_structures, project_manager_code) are stripped here, never
   * sent to the database.
   */
  static async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const safeUpdates: Partial<Project> = { ...updates };

    // When status is on_hold, ensure hold_reason / suspension_reason is non-empty to satisfy DB enforce_project_status_rules trigger
    if (safeUpdates.status === 'on_hold') {
      const reason = (safeUpdates.hold_reason || safeUpdates.suspension_reason || '').trim() || 'إيقاف مؤقت بطلب من إدارة المشروع';
      safeUpdates.hold_reason = reason;
      safeUpdates.suspension_reason = reason;
    } else if (safeUpdates.status === 'cancelled') {
      const reason = (safeUpdates.cancel_reason || safeUpdates.cancellation_reason || '').trim() || 'إلغاء المشروع بطلب من الإدارة';
      safeUpdates.cancel_reason = reason;
      safeUpdates.cancellation_reason = reason;
    } else if (safeUpdates.status === 'handing_over' && !safeUpdates.toc_letter) {
      safeUpdates.toc_letter = 'قيد استيفاء شهادة الاستلام الابتدائي (TOC)';
    }

    const payload = buildUpdatePayload(safeUpdates);

    const { data: updated, error: updateErr } = await supabase
      .from('pm_projects')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    appCache.invalidate('projects:');
    appCache.invalidate(CACHE_KEYS.project(id));

    if (updateErr) {
      logger.error('Supabase updateProject failed:', { detail: updateErr });
      throw new Error(
        updateErr.message || updateErr.details || 'فشل تحديث المشروع في قاعدة البيانات'
      );
    }

    // If project manager was modified in updates, keep relation tables in sync
    if (updates.project_manager_stakeholder_id !== undefined || updates.project_manager_name_raw !== undefined) {
      try {
        await this.syncProjectManagerRelations(
          id,
          updates.project_manager_stakeholder_id || null,
          updates.project_manager_name_raw || ''
        );
      } catch (pmSyncErr) {
        logger.warn('Failed to sync PM relation tables on updateProject:', { detail: pmSyncErr });
      }
    }

    if (!updated) {
      throw new Error('فشل تحديث المشروع — لم يتم إرجاع بيانات');
    }

    return updated as Project;
  }

  /**
   * Manually set project completion percentage (0–100, 2 decimals).
   * Note: DB activity roll-up may recalculate this value later.
   */
  static async updateProjectCompletion(id: string, pct: number): Promise<number> {
    const n = Number(pct);
    if (!Number.isFinite(n)) throw new Error('نسبة الإنجاز غير صالحة');
    const value = Math.round(Math.min(100, Math.max(0, n)) * 100) / 100;
    const { error } = await supabase
      .from('pm_projects')
      .update({ completion_pct: value, updated_at: new Date().toISOString() })
      .eq('id', id);
    appCache.invalidate('projects:');
    appCache.invalidate(CACHE_KEYS.project(id));
    if (error) {
      logger.error('Supabase updateProjectCompletion failed:', { detail: error });
      throw new Error(error.message || 'فشل تحديث نسبة الإنجاز');
    }
    return value;
  }

  /**
   * Internal helper to keep project_stakeholders & pm_project_team in sync with project PM
   */
  static async syncProjectManagerRelations(
    projectId: string,
    stakeholderId: string | null,
    managerName: string,
    phone?: string,
    changeReason?: string,
    predecessorId?: string | null
  ): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const resolvedName = managerName.trim();

    // 1. Deactivate other active project managers in project_stakeholders
    const { data: existingStks } = await supabase
      .from('project_stakeholders')
      .select('id, project_role, stakeholder_id')
      .eq('project_id', projectId);

    const oldPmRowIds = (existingStks || [])
      .filter((row) => {
        const r = (row.project_role || '').toLowerCase();
        const isPM = r === 'project manager' || r === 'مدير مشروع' || r === 'مدير المشروع' || (r.includes('manager') && !r.includes('technical') && !r.includes('planning') && !r.includes('construction') && !r.includes('quality') && !r.includes('survey'));
        return isPM && (!stakeholderId || row.stakeholder_id !== stakeholderId);
      })
      .map((row) => row.id);

    if (oldPmRowIds.length > 0) {
      await supabase
        .from('project_stakeholders')
        .update({
          is_active: false,
          end_date: today,
          termination_reason: changeReason || 'تحديث وتعيين مدير جديد'
        })
        .in('id', oldPmRowIds);
    }

    // 2. Activate or insert new PM in project_stakeholders
    if (stakeholderId) {
      const { data: targetRow } = await supabase
        .from('project_stakeholders')
        .select('id')
        .eq('project_id', projectId)
        .eq('stakeholder_id', stakeholderId)
        .maybeSingle();

      if (targetRow) {
        await supabase
          .from('project_stakeholders')
          .update({
            is_active: true,
            end_date: null,
            start_date: today,
            project_role: 'مدير المشروع',
            predecessor_id: predecessorId || null
          })
          .eq('id', targetRow.id);
      } else {
        await supabase
          .from('project_stakeholders')
          .insert({
            project_id: projectId,
            stakeholder_id: stakeholderId,
            project_role: 'مدير المشروع',
            raci_role: 'responsible',
            party_kind: 'employee',
            start_date: today,
            is_active: true,
            predecessor_id: predecessorId || null,
            assigned_at: new Date().toISOString()
          });
      }
    }

    // 3. Update pm_project_team
    await supabase
      .from('pm_project_team')
      .update({
        is_active: false,
        end_date: today,
        termination_reason: changeReason || 'تحديث وتعيين مدير جديد'
      })
      .eq('project_id', projectId)
      .ilike('role_title_ar', '%مدير المشروع%');

    if (resolvedName) {
      await supabase
        .from('pm_project_team')
        .insert({
          project_id: projectId,
          person_name: resolvedName,
          role_category: 'pzone_internal',
          role_title_ar: 'مدير المشروع',
          role_title_en: 'Project Manager',
          phone: phone?.trim() || undefined,
          start_date: today,
          is_active: true
        });
    }
  }

  /**
   * Assign or transfer Project Manager atomically across:
   * 1. projects table (project_manager_stakeholder_id, project_manager_name_raw)
   * 2. project_stakeholders (deactivates old PMs, inserts/activates new PM)
   * 3. pm_project_team (deactivates old PMs, inserts/activates new PM)
   * 4. Invalidate appCache so update is visible everywhere immediately.
   */
  static async assignProjectManager(
    projectId: string,
    params: {
      stakeholderId?: string | null;
      managerName: string;
      phone?: string;
      startDate?: string;
      changeReason?: string;
      predecessorId?: string | null;
    }
  ): Promise<Project> {
    const today = params.startDate || new Date().toISOString().split('T')[0];
    let resolvedStkId = params.stakeholderId || null;
    let resolvedName = (params.managerName || '').trim();

    // If stakeholderId not provided, search or create in stakeholders
    if (!resolvedStkId && resolvedName) {
      const { data: existingStk } = await supabase
        .from('stakeholders')
        .select('id, name_ar, name, phone')
        .or(`name_ar.eq."${resolvedName}",name.eq."${resolvedName}"`)
        .maybeSingle();

      if (existingStk) {
        resolvedStkId = existingStk.id;
        resolvedName = existingStk.name_ar || existingStk.name || resolvedName;
      } else {
        const { data: createdStk } = await supabase
          .from('stakeholders')
          .insert({
            name_ar: resolvedName,
            name: resolvedName,
            phone: params.phone?.trim() || null,
            job_title: 'مدير مشروع',
            type: 'employee',
            stakeholder_kind: 'employee',
            is_active: true
          })
          .select('id')
          .single();

        if (createdStk) {
          resolvedStkId = createdStk.id;
        }
      }
    } else if (resolvedStkId && !resolvedName) {
      const { data: stk } = await supabase
        .from('stakeholders')
        .select('name_ar, name')
        .eq('id', resolvedStkId)
        .maybeSingle();
      if (stk) {
        resolvedName = stk.name_ar || stk.name || 'مدير المشروع';
      }
    }

    // Update projects table directly
    await supabase
      .from('projects')
      .update({
        project_manager_name_raw: resolvedName,
        project_manager_stakeholder_id: resolvedStkId,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);

    // Sync relation tables
    await this.syncProjectManagerRelations(
      projectId,
      resolvedStkId,
      resolvedName,
      params.phone,
      params.changeReason,
      params.predecessorId
    );

    // Invalidate caches
    appCache.invalidate('projects:');
    appCache.invalidate(CACHE_KEYS.project(projectId));
    appCache.invalidate(CACHE_KEYS.projectManagers());

    const refreshed = await this.getProjectById(projectId);
    return (refreshed || { id: projectId, project_manager_name_raw: resolvedName, project_manager_stakeholder_id: resolvedStkId }) as Project;
  }

  /**
   * Fetch project managers directly from Supabase (pm_stakeholders, stakeholders, pm_projects)
   */
  static async getProjectManagers(): Promise<Stakeholder[]> {
    return appCache.getOrFetch(CACHE_KEYS.projectManagers(), TTL.reference, async () => {
      const managersMap = new Map<string, Stakeholder>();

      const results = await Promise.allSettled([
        supabase.from('pm_stakeholders').select('*'),
        supabase.from('stakeholders').select('*'),
        supabase.from('employees').select('*'),
        supabase.from('pm_projects').select('project_manager_name_raw, project_manager_id').not('project_manager_name_raw', 'is', null),
      ]);

      // 1. pm_stakeholders
      if (results[0].status === 'fulfilled') {
        const { data, error } = results[0].value;
        if (!error && data && data.length > 0) {
          data.forEach((s, idx: number) => {
            const name = s.name_ar || s.name || s.full_name || s.name_en;
            if (name) {
              managersMap.set(name, {
                id: s.id || (s.employee_code ? `emp_${s.employee_code}` : `pm_stk_${idx}_${name}`),
                name_ar: name,
                name_en: s.name_en || '',
                role: s.role || s.job_title || 'Project Manager',
                email: s.email,
                phone: s.phone,
                employee_code: s.employee_code || s.code || s.job_code || s.emp_code,
              });
            }
          });
        }
      } else {
        logger.warn('pm_stakeholders fetch notice:', { detail: results[0].reason });
      }

      // 2. stakeholders
      if (results[1].status === 'fulfilled') {
        const { data, error } = results[1].value;
        if (!error && data && data.length > 0) {
          data.forEach((s, idx: number) => {
            const name = s.name_ar || s.name || s.full_name || s.name_en;
            if (name && !managersMap.has(name)) {
              managersMap.set(name, {
                id: s.id || (s.employee_code ? `emp_${s.employee_code}` : `stk_${idx}_${name}`),
                name_ar: name,
                name_en: s.name_en || '',
                role: s.role || s.job_title || 'Project Manager',
                email: s.email,
                phone: s.phone,
                employee_code: s.employee_code || s.code || s.job_code || s.emp_code,
              });
            }
          });
        }
      } else {
        logger.warn('stakeholders fetch notice:', { detail: results[1].reason });
      }

      // 3. employees
      if (results[2].status === 'fulfilled') {
        const { data, error } = results[2].value;
        if (!error && data && data.length > 0) {
          data.forEach((s, idx: number) => {
            const name = s.name_ar || s.name || s.full_name || s.name_en;
            if (name && !managersMap.has(name)) {
              managersMap.set(name, {
                id: s.id || (s.employee_code ? `emp_${s.employee_code}` : `emp_${idx}_${name}`),
                name_ar: name,
                name_en: s.name_en || '',
                role: s.job_title || s.role || 'Project Manager',
                email: s.email,
                phone: s.phone,
                employee_code: s.employee_code || s.code || s.job_code || s.emp_code,
              });
            }
          });
        }
      } else {
        logger.warn('employees fetch notice:', { detail: results[2].reason });
      }

      // 4. pm_projects manager names
      if (results[3].status === 'fulfilled') {
        const { data, error } = results[3].value;
        if (!error && data && data.length > 0) {
          data.forEach((p, idx: number) => {
            const rawName = p.project_manager_name_raw?.trim();
            if (rawName && !managersMap.has(rawName)) {
              managersMap.set(rawName, {
                id: p.project_manager_id || `pm_prj_${idx}_${rawName}`,
                name_ar: rawName,
                role: 'Project Manager',
              });
            }
          });
        }
      } else {
        logger.warn('pm_projects managers fetch notice:', { detail: results[3].reason });
      }

      const list = Array.from(managersMap.values());
      list.forEach((pm, idx) => {
        if (!pm.employee_code && !pm.code) {
          pm.employee_code = `EMP-${String(idx + 1).padStart(3, '0')}`;
        }
      });

      return list;
    });
  }

  /**
   * Create new Stakeholder / Project Manager directly in Supabase
   */
  static async createStakeholder(stakeholder: Partial<Stakeholder>): Promise<Stakeholder> {
    // NOTE: must write to public.stakeholders (the canonical directory table),
    // NOT pm_stakeholders — otherwise the person never appears in the directory.
    let resolvedAuthUserId = (stakeholder as { auth_user_id?: string | null }).auth_user_id || undefined;
    if (!resolvedAuthUserId && stakeholder.email?.trim()) {
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id')
          .ilike('email', stakeholder.email.trim())
          .maybeSingle();
        if (profileData?.id) {
          resolvedAuthUserId = profileData.id;
        }
      } catch {
        // Ignore profile lookup errors
      }
    }

    const payload: Record<string, unknown> = {
      name_ar: stakeholder.name_ar,
      name_en: stakeholder.name_en || null,
      name: stakeholder.name_ar || stakeholder.name_en || null,
      role: stakeholder.role || 'Project Manager',
      job_title: stakeholder.role || 'Project Manager',
      email: stakeholder.email || null,
      phone: stakeholder.phone || null,
      employee_code: stakeholder.employee_code || stakeholder.code || null,
      organization_name: (stakeholder as { organization_name?: string }).organization_name || (stakeholder.stakeholder_kind === 'employee' ? 'Pzoneinternational' : 'جهة خارجية'),
      stakeholder_kind: stakeholder.stakeholder_kind || 'employee',
      organization_id: '00000000-0000-0000-0000-000000000001',
      ...(stakeholder.client_id ? { client_id: stakeholder.client_id } : {}),
      ...(stakeholder.vendor_id ? { vendor_id: stakeholder.vendor_id } : {}),
      ...(resolvedAuthUserId ? { auth_user_id: resolvedAuthUserId } : {}),
    };

    appCache.invalidate('ref:managers');
    appCache.invalidate('stakeholders:directory');

    const { data, error } = await supabase
      .from('stakeholders')
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw new Error(error.message || 'فشل إضافة الشخص إلى دليل الشركاء');
    }
    return data;
  }

  /**
   * Batch import stakeholders from Excel/CSV with database integrity checks,
   * duplicate reconciliation, and cache invalidation.
   */
  static async batchImportStakeholders(
    items: Array<{
      name_ar: string;
      name_en?: string;
      role?: string;
      job_title?: string;
      phone?: string;
      email?: string;
      employee_code?: string;
      organization_name?: string;
      stakeholder_kind?: StakeholderKind;
    }>,
    options: { updateExisting?: boolean } = { updateExisting: true }
  ): Promise<{
    total: number;
    inserted: number;
    updated: number;
    skipped: number;
    errors: string[];
  }> {
    if (!items || items.length === 0) {
      return { total: 0, inserted: 0, updated: 0, skipped: 0, errors: [] };
    }

    const errors: string[] = [];
    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    // 1. Fetch existing stakeholders from database to detect duplicates
    const { data: existingRows, error: fetchErr } = await supabase
      .from('stakeholders')
      .select('id, name_ar, name, email, employee_code');

    if (fetchErr) {
      logger.warn('Failed to pre-fetch existing stakeholders for duplicate check:', { detail: fetchErr });
    }

    const existingByName = new Map<string, string>();
    const existingByEmail = new Map<string, string>();
    const existingByCode = new Map<string, string>();

    (existingRows || []).forEach((row) => {
      const n = (row.name_ar || row.name || '').trim().toLowerCase();
      if (n) existingByName.set(n, row.id);
      if (row.email) existingByEmail.set(row.email.trim().toLowerCase(), row.id);
      if (row.employee_code) existingByCode.set(row.employee_code.trim().toLowerCase(), row.id);
    });

    const toInsert: Record<string, unknown>[] = [];
    const toUpdate: Array<{ id: string; payload: Record<string, unknown> }> = [];

    for (const item of items) {
      const nameKey = (item.name_ar || '').trim().toLowerCase();
      const emailKey = (item.email || '').trim().toLowerCase();
      const codeKey = (item.employee_code || '').trim().toLowerCase();

      if (!nameKey) {
        errors.push('تم تخطي سجل بدون اسم صالح');
        skipped++;
        continue;
      }

      // Check existing match: by code first, then email, then name
      const existingId =
        (codeKey ? existingByCode.get(codeKey) : undefined) ||
        (emailKey ? existingByEmail.get(emailKey) : undefined) ||
        existingByName.get(nameKey);

      const payload = {
        name_ar: item.name_ar.trim(),
        name_en: item.name_en?.trim() || item.name_ar.trim(),
        name: item.name_ar.trim(),
        role: item.role?.trim() || item.job_title?.trim() || 'عضو كادر',
        job_title: item.role?.trim() || item.job_title?.trim() || 'عضو كادر',
        phone: item.phone?.trim() || null,
        email: item.email?.trim() || null,
        employee_code: item.employee_code?.trim() || null,
        organization_name: item.organization_name?.trim() || (item.stakeholder_kind === 'employee' ? 'Pzone International' : 'جهات خارجية'),
        stakeholder_kind: item.stakeholder_kind || 'employee',
        organization_id: '00000000-0000-0000-0000-000000000001',
      };

      if (existingId) {
        if (existingId === 'pending_new') {
          // Intra-file duplicate: first instance already queued in toInsert
          skipped++;
          errors.push(`تم تخطي سجل مكرر داخل نفس الملف: ${item.name_ar}`);
          continue;
        }
        if (options.updateExisting) {
          toUpdate.push({ id: existingId, payload });
        } else {
          skipped++;
        }
      } else {
        toInsert.push(payload);
        existingByName.set(nameKey, 'pending_new');
        if (emailKey) existingByEmail.set(emailKey, 'pending_new');
        if (codeKey) existingByCode.set(codeKey, 'pending_new');
      }
    }

    // 2. Perform updates
    for (const u of toUpdate) {
      try {
        const { error: updErr } = await supabase
          .from('stakeholders')
          .update(u.payload)
          .eq('id', u.id);
        if (updErr) {
          errors.push(`فشل تحديث ${u.payload.name_ar}: ${updErr.message}`);
        } else {
          updated++;
        }
      } catch (err: unknown) {
        errors.push(`خطأ في تحديث ${u.payload.name_ar}: ${(err as ErrorLike).message}`);
      }
    }

    // 3. Perform inserts in chunks of 50
    const CHUNK_SIZE = 50;
    for (let i = 0; i < toInsert.length; i += CHUNK_SIZE) {
      const chunk = toInsert.slice(i, i + CHUNK_SIZE);
      try {
        const { error: insErr } = await supabase
          .from('stakeholders')
          .insert(chunk);
        if (insErr) {
          errors.push(`فشل إدراج دفعة من السجلات (${chunk.length}): ${insErr.message}`);
        } else {
          inserted += chunk.length;
        }
      } catch (err: unknown) {
        errors.push(`خطأ في إدراج الدفعة: ${(err as ErrorLike).message}`);
      }
    }

    // 4. Invalidate caches
    appCache.invalidate('ref:managers');
    appCache.invalidate('stakeholders:directory');

    return {
      total: items.length,
      inserted,
      updated,
      skipped,
      errors,
    };
  }

  /**
   * Soft Delete project
   */
  static async softDeleteProject(id: string): Promise<void> {
    const { data, error } = await supabase
      .from('pm_projects')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .select('id');

    if (error) {
      throw new Error(error.message || error.details || 'فشل حذف المشروع من قاعدة البيانات');
    }
    assertRows(data, 'softDeleteProject');

    appCache.invalidate('projects:');
    appCache.invalidate(CACHE_KEYS.project(id));
  }

  /**
   * Archive Project
   */
  static async archiveProject(id: string, archivedBy?: string): Promise<void> {
    const project = await this.getProjectById(id);
    if (!project) throw new Error('Project not found');

    const { data, error } = await supabase
      .from('pm_projects')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .select('id');

    if (error) {
      throw new Error(error.message || error.details || 'فشل أرشفة المشروع');
    }
    assertRows(data, 'archiveProject');

    await ProjectTabsService.logArchive({
      entity_type: 'PROJECT',
      entity_id: id,
      entity_name: project.project_name || project.project_code || id,
      project_id: id,
      // Project interface lacks an index signature, so a direct cast to Record is rejected.
      archived_data: project as unknown as Record<string, unknown>,
      deleted_by: archivedBy || 'System'
    });

    appCache.invalidate('projects:');
    appCache.invalidate(CACHE_KEYS.project(id));
  }

  /**
   * Permanently delete an ARCHIVED project (frees its code). Server enforces admin role + archived state + code match.
   */
  static async purgeArchivedProject(id: string, confirmCode: string): Promise<void> {
    const { error } = await supabase.rpc('fn_purge_archived_project', { p_project_id: id, p_confirm_code: confirmCode });
    if (error) throw new Error(error.message || error.details || 'Delete failed');
    appCache.invalidate('projects:');
    appCache.invalidate(CACHE_KEYS.project(id));
  }

  /**
   * Restore Archived Project
   */
  static async restoreProject(id: string): Promise<void> {
    const { data, error } = await supabase
      .from('pm_projects')
      .update({ deleted_at: null })
      .eq('id', id)
      .select('id');

    if (error) {
      throw new Error(error.message || error.details || 'فشل استعادة المشروع');
    }
    assertRows(data, 'restoreProject');

    appCache.invalidate('projects:');
    appCache.invalidate(CACHE_KEYS.project(id));
  }

  /**
   * Get Archived Projects
   */
  static async getArchivedProjects(): Promise<Project[]> {
    try {
      const { data, error } = await supabase
        .from('pm_projects_with_manager')
        .select('*')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (error) throw error;
      
      const clientsList = await this.getClients();
      const clientMap = new Map(clientsList.map((c) => [c.id, c]));

      return (data || []).map((p) => {
        const clientObj = p.client_id ? clientMap.get(p.client_id) : undefined;
        const code = p.project_code || p.code || '';
        const name = p.project_name || p.name_ar || p.name_en || (code ? `مشروع ${code}` : 'مشروع');
        return {
          ...p,
          code: code,
          project_code: code,
          name_ar: p.name_ar || name,
          project_name: name,
          client: clientObj || (p.client_name_raw ? { id: 'raw', name_ar: p.client_name_raw, code: 'RAW' } : undefined),
          total_contract_value: Number(p.contract_value ?? p.contract_value_egp ?? 0) + Number(p.vos_value || 0),
        };
      });
    } catch (e) {
      logger.warn('Supabase getArchivedProjects error:', { detail: e });
      return [];
    }
  }

  /**
   * Get Comprehensive Unified Project Audit Logs
   * Aggregates:
   * 1. System state & status changes from `pm_audit_logs` (using changed_at)
   * 2. Initial baseline & creation record from `pm_projects`
   * 3. BOQ item engineering revisions from `pm_boq_revisions`
   * 4. Archived / deleted items from `pm_archive_logs`
   * 5. Workflow sign-offs and status decisions from `pm_notifications`
   */
  static async getAuditLogs(projectId: string): Promise<AuditLogEntry[]> {
    if (!projectId) return [];

    try {
      const entries: AuditLogEntry[] = [];
      const seenIds = new Set<string>();

      // 1. Fetch direct audit log entries (pm_audit_logs)
      try {
        const { data: auditData, error: auditErr } = await supabase
          .from('pm_audit_logs')
          .select('*')
          .eq('record_id', projectId)
          .order('changed_at', { ascending: false })
          .limit(100);

        if (!auditErr && Array.isArray(auditData)) {
          for (const row of auditData) {
            const entryId = `audit_${row.id}`;
            if (!seenIds.has(entryId)) {
              seenIds.add(entryId);
              entries.push({
                id: entryId,
                table_name: row.table_name || 'projects',
                record_id: String(row.record_id || projectId),
                action: (row.action || 'STATUS_CHANGE') as AuditLogEntry['action'],
                old_data: row.old_data || undefined,
                new_data: row.new_data || undefined,
                changed_by: row.changed_by || undefined,
                created_at: row.changed_at || new Date().toISOString(),
                changed_at: row.changed_at || new Date().toISOString(),
                context: row.context || 'تحديث حالة المشروع التعاقدية',
                ip_address: row.ip_address || undefined,
              });
            }
          }
        }
      } catch (err) {
        logger.warn('Failed to query pm_audit_logs in getAuditLogs:', { err });
      }

      // 2. Fetch project inception & baseline record from pm_projects
      try {
        const { data: proj, error: projErr } = await supabase
          .from('pm_projects')
          .select('id, project_code, name_ar, name_en, client_id, contract_value, contract_value_egp, status, start_date, end_date, created_at, created_by, updated_at')
          .eq('id', projectId)
          .single();

        if (!projErr && proj) {
          const initId = `proj_init_${proj.id}`;
          if (!seenIds.has(initId)) {
            seenIds.add(initId);
            entries.push({
              id: initId,
              table_name: 'pm_projects',
              record_id: proj.id,
              action: 'INSERT',
              new_data: {
                project_code: proj.project_code,
                name_ar: proj.name_ar,
                name_en: proj.name_en,
                contract_value: proj.contract_value || proj.contract_value_egp,
                status: proj.status,
                start_date: proj.start_date,
                end_date: proj.end_date,
              },
              changed_by: proj.created_by || undefined,
              created_at: proj.created_at || new Date().toISOString(),
              changed_at: proj.created_at || new Date().toISOString(),
              context: 'إنشاء وتأسيس المشروع في النظام واعتماد البيانات التعاقدية الأساسية',
            });
          }
        }
      } catch (err) {
        logger.warn('Failed to query project inception in getAuditLogs:', { err });
      }

      // 3. Fetch BOQ item revisions for this project
      try {
        const { data: boqRevs, error: boqErr } = await supabase
          .from('pm_boq_revisions')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(100);

        if (!boqErr && Array.isArray(boqRevs)) {
          for (const rev of boqRevs) {
            const revId = `boq_rev_${rev.id}`;
            if (!seenIds.has(revId)) {
              seenIds.add(revId);
              entries.push({
                id: revId,
                table_name: 'pm_boq_items',
                record_id: String(rev.boq_item_id || rev.id),
                action: (rev.revision === 1 ? 'INSERT' : 'UPDATE') as AuditLogEntry['action'],
                old_data: rev.snapshot_data || undefined,
                new_data: {
                  revision: rev.revision,
                  contract_qty: rev.contract_qty,
                  rate_egp: rev.rate_egp,
                  amount_egp: rev.amount_egp,
                  description_ar: rev.description_ar,
                },
                changed_by: rev.changed_by || undefined,
                created_at: rev.created_at || new Date().toISOString(),
                changed_at: rev.created_at || new Date().toISOString(),
                context: rev.change_reason || `تحديث وتعديل بند المقايسة إلى الإصدار v${rev.revision}`,
              });
            }
          }
        }
      } catch (err) {
        logger.warn('Failed to query pm_boq_revisions in getAuditLogs:', { err });
      }

      // 4. Fetch archived & deleted items for this project
      try {
        const { data: archLogs, error: archErr } = await supabase
          .from('pm_archive_logs')
          .select('*')
          .eq('project_id', projectId)
          .order('archived_at', { ascending: false })
          .limit(100);

        if (!archErr && Array.isArray(archLogs)) {
          for (const arch of archLogs) {
            const archId = `arch_${arch.id}`;
            if (!seenIds.has(archId)) {
              seenIds.add(archId);
              entries.push({
                id: archId,
                table_name: arch.entity_type || 'pm_archive_logs',
                record_id: String(arch.entity_id || arch.id),
                action: 'DELETE',
                old_data: arch.archived_data || undefined,
                new_data: undefined,
                changed_by: arch.deleted_by || undefined,
                created_at: arch.archived_at || new Date().toISOString(),
                changed_at: arch.archived_at || new Date().toISOString(),
                context: arch.entity_name ? `حذف ونقل للأرشيف: ${arch.entity_name}` : 'حذف عنصر وأرشفته',
              });
            }
          }
        }
      } catch (err) {
        logger.warn('Failed to query pm_archive_logs in getAuditLogs:', { err });
      }

      // 5. Fetch workflow decisions & milestone approvals from pm_notifications
      try {
        const { data: notifs, error: notifErr } = await supabase
          .from('pm_notifications')
          .select('*')
          .eq('project_id', projectId)
          .in('event_type', [
            'inspection_approved',
            'inspection_rejected',
            'daily_report_approved',
            'daily_report_rejected',
            'vo_approved',
            'vo_rejected',
            'status_change'
          ])
          .order('occurred_at', { ascending: false })
          .limit(50);

        if (!notifErr && Array.isArray(notifs)) {
          for (const n of notifs) {
            const notifId = `wf_${n.id}`;
            if (!seenIds.has(notifId)) {
              seenIds.add(notifId);
              entries.push({
                id: notifId,
                table_name: n.entity_type === 'daily_progress' ? 'pm_daily_progress' : (n.entity_type === 'inspection' ? 'site_tasks' : (n.entity_type || 'workflow')),
                record_id: String(n.entity_id || n.id),
                action: 'STATUS_CHANGE',
                new_data: n.metadata || { event: n.event_type, title: n.title_ar },
                changed_by: n.recipient_user_id || undefined,
                created_at: n.occurred_at || new Date().toISOString(),
                changed_at: n.occurred_at || new Date().toISOString(),
                context: `${n.title_ar || 'إجراء تدقيق'}${n.body_ar ? `: ${n.body_ar}` : ''}`,
              });
            }
          }
        }
      } catch (err) {
        logger.warn('Failed to query pm_notifications in getAuditLogs:', { err });
      }

      // 6. Fetch Technical Office Deliverable Events from pm_deliverables + pm_deliverable_events
      try {
        const { data: delivs } = await supabase
          .from('pm_deliverables')
          .select('id, ref_code, title_ar')
          .eq('project_id', projectId);

        if (delivs && delivs.length > 0) {
          const delivIds = delivs.map((d) => d.id);
          const delivMap = new Map(delivs.map((d) => [d.id, d]));

          const { data: dEvents, error: dEventsErr } = await supabase
            .from('pm_deliverable_events')
            .select('*')
            .in('deliverable_id', delivIds)
            .order('created_at', { ascending: false })
            .limit(100);

          if (!dEventsErr && Array.isArray(dEvents)) {
            for (const ev of dEvents) {
              const evId = `deliv_ev_${ev.id}`;
              if (!seenIds.has(evId)) {
                seenIds.add(evId);
                const d = delivMap.get(ev.deliverable_id);
                entries.push({
                  id: evId,
                  table_name: 'pm_deliverables',
                  record_id: String(ev.deliverable_id),
                  action: ev.event_type === 'block' ? 'DELETE' : (ev.event_type === 'manager_approved' || ev.to_value === 'returned' || (ev.to_value && ev.to_value.includes('Code A')) ? 'INSERT' : 'STATUS_CHANGE'),
                  old_data: ev.from_value ? { status: ev.from_value } : undefined,
                  new_data: { status: ev.to_value, event_type: ev.event_type, deliverable_item_id: ev.deliverable_item_id },
                  changed_by: ev.by_stakeholder_id || undefined,
                  created_at: ev.created_at || new Date().toISOString(),
                  changed_at: ev.created_at || new Date().toISOString(),
                  context: d
                    ? `مكتب فني: [${d.ref_code}] ${d.title_ar} - ${ev.reason || ev.to_value || ev.event_type}`
                    : `مكتب فني: تحديث تسليمة - ${ev.reason || ev.to_value}`,
                });
              }
            }
          }
        }
      } catch (err) {
        logger.warn('Failed to query pm_deliverable_events in getAuditLogs:', { err });
      }

      // Sort all entries in reverse chronological order
      entries.sort((a, b) => {
        const timeA = new Date(a.changed_at || a.created_at || 0).getTime();
        const timeB = new Date(b.changed_at || b.created_at || 0).getTime();
        return timeB - timeA;
      });

      return entries;
    } catch (globalErr) {
      logger.error('ProjectService.getAuditLogs unexpected failure:', { globalErr });
      return [];
    }
  }

  /**
   * Fetch all clients
   */
  static async getClients(): Promise<Client[]> {
    return appCache.getOrFetch(CACHE_KEYS.clients(), TTL.reference, async () => {
      try {
        const { data, error } = await supabase
          .from('pm_clients')
          .select('*')
          .order('name_ar', { ascending: true });

        if (!error && data) {
          return data;
        }

        // Fallback to clients table
        const { data: fbData, error: fbError } = await supabase
          .from('clients')
          .select('*')
          .order('name_ar', { ascending: true });

        if (!fbError && fbData) {
          return fbData;
        }

        logger.warn('Failed to load clients from both pm_clients and clients tables:', { error, fbError });
        return [];
      } catch (err) {
        logger.warn('getClients exception:', { err });
        return [];
      }
    });
  }

  /**
   * Create client
   */
  static async createClient(client: Partial<Client>): Promise<Client> {
    appCache.invalidate('ref:clients');
    const { data, error } = await supabase
      .from('pm_clients')
      .insert({
        name_ar: client.name_ar,
        name_en: client.name_en || null,
        code: client.code || null,
        contact_person: client.contact_person || null,
        phone: client.phone || null,
        email: client.email || null,
        address: client.address || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message || error.details || 'فشل إضافة العميل');
    }

    return data;
  }

  /**
   * Update client
   */
  static async updateClient(id: string, updates: Partial<Client>): Promise<Client> {
    appCache.invalidate('ref:clients');
    appCache.invalidate('projects:');
    const { data, error } = await supabase
      .from('pm_clients')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message || error.details || 'فشل تحديث العميل');
    }

    return data;
  }

  /**
   * Fetch governorates from static Egypt Geographic Knowledge Base (0ms instant response)
   */
  static async getGovernorates(): Promise<Governorate[]> {
    return appCache.getOrFetch(CACHE_KEYS.governorates(), TTL.reference, async () => {
      // Return canonical 27 Egypt governorates directly from static geo knowledge base (0ms response)
      const staticGovs: Governorate[] = EGYPT_GOVERNORATES_GEO.map((g, idx) => ({
        id: g.id || `gov-geo-${idx + 1}`,
        name_ar: g.name_ar,
        name_en: g.name_en,
        code: g.code,
      }));
      if (staticGovs.length >= 27) return staticGovs;
      return EGYPT_GOVERNORATES_GEO.map((g, idx) => ({
        id: g.id || `gov-geo-${idx + 1}`,
        name_ar: g.name_ar,
        name_en: g.name_en,
        code: g.code,
      }));
    });
  }

  /**
   * Fetch canonical cities for governorate from static Egypt Geographic Knowledge Base (0ms instant response)
   */
  static async getCities(governorateId?: string): Promise<City[]> {
    return appCache.getOrFetch(CACHE_KEYS.cities(governorateId), TTL.reference, async () => {
      if (governorateId && governorateId !== 'all') {
        const canonical = getCanonicalCitiesForGovernorate(governorateId);
        if (canonical && canonical.length > 0) {
          return canonical.map((c, idx) => ({
            id: c.id || `city-geo-${idx + 1}`,
            governorate_id: governorateId,
            name_ar: c.name_ar,
            name_en: c.name_en,
          }));
        }
      }

      return EGYPT_GOVERNORATES_GEO.flatMap((gov, gIdx) => {
        const govId = gov.id || `gov-geo-${gIdx + 1}`;
        return gov.cities.map((c, cIdx) => ({
          id: c.id || `city-geo-${gov.code}-${cIdx + 1}`,
          governorate_id: govId,
          name_ar: c.name_ar,
          name_en: c.name_en,
        }));
      });
    });
  }

  /**
   * Batch import projects with upsert on project_code
   */
  static async importProjects(projectsPayload: Partial<Project>[]): Promise<{ successCount: number; errors: { row: number; code?: string; name?: string; reason: string }[] }> {
    let successCount = 0;
    const errors: { row: number; code?: string; name?: string; reason: string }[] = [];
    const validPayloads: Record<string, unknown>[] = [];

    for (let i = 0; i < projectsPayload.length; i++) {
      const p = projectsPayload[i];
      const rowNum = i + 2; // Accounting for Excel header row

      if (!p.project_code || !p.project_name) {
        errors.push({
          row: rowNum,
          code: p.project_code || 'N/A',
          name: p.project_name || 'N/A',
          reason: 'Project Code and Project Name are mandatory fields.',
        });
        continue;
      }

      // Use buildCreatePayload to strip computed/UI fields and default columns safely.
      const safePayload = {
        ...buildCreatePayload(p),
        // For import we explicitly set both EGP and base contract_value from either field.
        contract_value_egp: Number(p.contract_value_egp ?? p.contract_value ?? 0),
        contract_value: Number(p.contract_value ?? p.contract_value_egp ?? 0),
        updated_at: new Date().toISOString(),
      };
      validPayloads.push(safePayload);
    }

    if (validPayloads.length > 0) {
      try {
        const { error } = await supabase
          .from('pm_projects')
          .upsert(validPayloads, { onConflict: 'project_code' });

        if (error) {
          logger.warn('Batch upsert failed, logging error:', { detail: error });
          errors.push({
            row: 0,
            reason: `Batch upsert failed: ${error.message}`,
          });
        } else {
          successCount = validPayloads.length;
          appCache.invalidate('projects:');
          appCache.invalidate(CACHE_KEYS.nextProjectCode());
        }
      } catch (err: unknown) {
        logger.error('Failed batch import:', { detail: err });
        errors.push({
          row: 0,
          reason: (err as ErrorLike)?.message || 'Database insertion error',
        });
      }
    }

    return { successCount, errors };
  }

  /**
   * Fetch stakeholders for a project joined with stakeholders_full view
   */
  static async getProjectStakeholders(projectId: string): Promise<ProjectStakeholder[]> {
    const cacheKey = `project:stakeholders:${projectId}`;
    return appCache.getOrFetch(cacheKey, TTL.projectDetail, async () => {
      try {
        const { data, error } = await supabase
          .from('project_stakeholders')
          .select('*, stakeholder:stakeholders(*)')
          .eq('project_id', projectId);

        if (error) {
          logger.warn('Supabase getProjectStakeholders error:', { detail: error });
          return [];
        }

        return (data || []).map((row) => ({
          ...row,
          stakeholder: row.stakeholder ? {
            ...row.stakeholder,
            name_ar: row.stakeholder.name_ar || row.stakeholder.name || '',
            name_en: row.stakeholder.name_en || row.stakeholder.name || '',
            employee_code: row.stakeholder.employee_code || row.stakeholder.code || '',
            role: row.stakeholder.role || row.stakeholder.job_title || row.stakeholder.type || '',
          } : null,
        })) as ProjectStakeholder[];
      } catch (e) {
        logger.warn('getProjectStakeholders error:', { detail: e });
        return [];
      }
    });
  }

  /**
   * Add stakeholder to project with single Accountable enforcement
   */
  static async addProjectStakeholder(payload: Partial<ProjectStakeholder>): Promise<ProjectStakeholder> {
    if (!payload.project_id) {
      throw new Error('رقم المشروع مطلوب');
    }

    // App-level single Accountable check
    if (payload.raci_role === 'accountable') {
      const { data: existingAccountable } = await supabase
        .from('project_stakeholders')
        .select('id')
        .eq('project_id', payload.project_id)
        .eq('raci_role', 'accountable')
        .maybeSingle();

      if (existingAccountable) {
        throw new Error('لا يمكن تعيين أكثر من مسؤول رئيسي (Accountable) واحد للمشروع');
      }
    }

    const { data, error } = await supabase
      .from('project_stakeholders')
      .insert({
        project_id: payload.project_id,
        stakeholder_id: payload.stakeholder_id,
        project_role: payload.project_role,
        raci_role: payload.raci_role,
        party_kind: payload.party_kind || 'employee',
        organization_id: payload.organization_id || '00000000-0000-0000-0000-000000000001',
      })
      .select('*, stakeholder:stakeholders(*)')
      .single();

    if (error) {
      if (error.code === '23505' || (error.message && error.message.includes('uq_project_accountable'))) {
        throw new Error('لا يمكن تعيين أكثر من مسؤول رئيسي (Accountable) واحد للمشروع');
      }
      throw new Error(error.message || error.details || 'فشل إضافة صاحب المصلحة للمشروع');
    }

    if (!data) {
      throw new Error('فشل إضافة صاحب المصلحة للمشروع — لم يتم إرجاع بيانات');
    }

    appCache.invalidate(`project:stakeholders:${payload.project_id}`);
    return data as ProjectStakeholder;
  }

  /**
   * Remove stakeholder from project
   */
  static async removeProjectStakeholder(id: string): Promise<void> {
    const { error } = await supabase
      .from('project_stakeholders')
      .delete()
      .eq('id', id);

    appCache.invalidate('project:stakeholders:');

    if (error) {
      throw new Error(error.message || error.details || 'فشل حذف صاحب المصلحة من المشروع');
    }
  }

  /**
   * Update project stakeholder assignment (RACI role, project role, custom level, hierarchy, dates, active status)
   */
  static async updateProjectStakeholder(
    id: string,
    projectId: string,
    updates: Omit<Partial<ProjectStakeholder>, 'reports_to' | 'start_date' | 'end_date' | 'termination_reason' | 'permissions_level'> & {
      role_in_project?: string;
      workload_percent?: number;
      is_primary?: boolean;
      permissions_level?: 'admin' | 'edit' | 'view' | 'approve' | string;
      reports_to?: string | null;
      start_date?: string | null;
      end_date?: string | null;
      is_active?: boolean;
      termination_reason?: string | null;
    }
  ): Promise<ProjectStakeholder> {
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        updatePayload[key] = value;
      }
    }

    const { data, error } = await supabase
      .from('project_stakeholders')
      .update(updatePayload)
      .eq('id', id)
      .select('*, stakeholder:stakeholders(*)')
      .single();

    appCache.invalidate(`project:stakeholders:${projectId}`);

    if (error) {
      throw new Error(error.message || error.details || 'فشل تحديث بيانات صاحب المصلحة');
    }

    return data as ProjectStakeholder;
  }

  /**
   * Fetch Technical Office & active employee engineers with valid UUIDs, prioritizing those assigned to projectId
   */
  static async getTechnicalOfficeEngineers(projectId?: string): Promise<Stakeholder[]> {
    const directory = await this.getStakeholdersDirectory({ kind: 'employee' });
    const validEngineers = (directory || []).filter(
      (s) => s.is_active !== false && Boolean(s.id && /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(s.id))
    );

    if (projectId && projectId !== 'all') {
      try {
        const projectStks = await this.getProjectStakeholders(projectId);
        const assignedSet = new Set(
          (projectStks || [])
            .filter((ps) => ps.is_active !== false)
            .map((ps) => ps.stakeholder_id)
            .filter(Boolean)
        );
        const assigned = validEngineers.filter((s) => assignedSet.has(s.id));
        const unassigned = validEngineers.filter((s) => !assignedSet.has(s.id));
        return [...assigned, ...unassigned];
      } catch {
        // Fallback to unprioritized valid engineers if project stakeholders fetch fails
      }
    }

    return validEngineers;
  }

  /**
   * Get stakeholders directory from stakeholders_full view
   */
  static async getStakeholdersDirectory(params: { kind?: StakeholderKind | 'all'; search?: string } = {}): Promise<StakeholderFull[]> {
    const cacheKey = `stakeholders:directory:${JSON.stringify(params)}`;
    return appCache.getOrFetch(cacheKey, TTL.reference, async () => {
      // 0. Fetch registered system users from profiles
      const systemUserProfilesMap = new Map<string, { full_name: string; role?: string }>();
      const systemUserEmailsMap = new Map<string, { full_name: string; role?: string }>();

      try {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, full_name, email, roles');

        if (profs && profs.length > 0) {
          profs.forEach((p: { id: string; full_name?: string | null; email?: string | null; roles?: string[] | null }) => {
            const roleName =
              (Array.isArray(p.roles) && p.roles.length > 0 ? p.roles[0] : null) ||
              'مستخدم بالبوابة';
            if (p.full_name) {
              systemUserProfilesMap.set(p.full_name.trim().toLowerCase(), { full_name: p.full_name, role: roleName });
            }
            if (p.email) {
              systemUserEmailsMap.set(p.email.trim().toLowerCase(), { full_name: p.full_name || p.email, role: roleName });
            }
          });
        }
      } catch (e) {
        logger.warn('Profiles fetch error notice:', { detail: e });
      }

      const helperTagSystemUser = (item: { name_ar?: string | null; name?: string | null; email?: string | null }) => {
        const nameKey = (item.name_ar || item.name || '').trim().toLowerCase();
        const emailKey = (item.email || '').trim().toLowerCase();
        const match = systemUserProfilesMap.get(nameKey) || (emailKey ? systemUserEmailsMap.get(emailKey) : undefined);
        return {
          is_system_user: !!match,
          system_role: match?.role || (match ? 'مستخدم بالبوابة' : undefined),
        };
      };

      // 1. Try querying stakeholders_full view
      try {
        let query = supabase.from('stakeholders_full').select('*').order('name', { ascending: true });

        if (params.kind && params.kind !== 'all') {
          query = query.eq('stakeholder_kind', params.kind);
        }

        if (params.search && params.search.trim() !== '') {
          const search = params.search.trim();
          query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%,job_title.ilike.%${search}%,organization_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data.map((row) => {
            const sys = helperTagSystemUser(row);
            return {
              ...row,
              name_ar: row.name_ar || row.name || '',
              name_en: row.name_en || row.name || '',
              employee_code: row.employee_code || row.code || '',
              role: row.role || row.job_title || '',
              is_system_user: sys.is_system_user,
              system_role: sys.system_role,
            };
          }) as StakeholderFull[];
        }
        if (error) {
          logger.warn('stakeholders_full view fetch notice:', { detail: error });
        }
      } catch (e) {
        logger.warn('stakeholders_full view fetch notice:', { detail: e });
      }

      // 2. Direct fallback to public.stakeholders base table if view returns empty or errors
      let fallbackQuery = supabase.from('stakeholders').select('*').order('created_at', { ascending: false });
      if (params.kind && params.kind !== 'all') {
        fallbackQuery = fallbackQuery.eq('stakeholder_kind', params.kind);
      }

      const { data, error } = await fallbackQuery;
      if (error) {
        logger.error('stakeholders base table fetch error:', { detail: error });
        throw new Error(`getStakeholdersDirectory: ${error.message || 'فشل استرجاع دليل الشركاء'}`);
      }

      if (data) {
        return data.map((row) => {
          const sys = helperTagSystemUser(row);
          return {
            id: row.id,
            name_ar: row.name_ar || row.name || '',
            name_en: row.name_en || row.name || '',
            employee_code: row.employee_code || row.code || '',
            role: row.role || row.job_title || row.type || 'عضو كادر',
            email: row.email || '',
            phone: row.phone || '',
            organization_id: row.organization_id || '00000000-0000-0000-0000-000000000001',
            organization_name: row.organization_name || (row.stakeholder_kind === 'employee' ? 'Pzoneinternational' : 'جهات خارجية'),
            client_id: row.client_id || undefined,
            vendor_id: row.vendor_id || undefined,
            stakeholder_kind: row.stakeholder_kind || 'employee',
            is_active: row.is_active ?? true,
            assigned_projects_count: 0,
            is_system_user: sys.is_system_user,
            system_role: sys.system_role,
          };
        }) as StakeholderFull[];
      }

      return [];
    });
  }

  /**
   * Create a new stakeholder and assign them to the project in one transaction/step
   */
  static async createAndAssignStakeholder(params: {
    name_ar: string;
    stakeholder_kind: StakeholderKind;
    organization_name?: string;
    role?: string;
    phone?: string;
    email?: string;
    employee_code?: string;
    code?: string;
    project_id: string;
    project_role: string;
    raci_role: RaciRole;
    party_kind: StakeholderKind;
    client_id?: string;
    auth_user_id?: string | null;
  }): Promise<ProjectStakeholder> {
    let resolvedAuthUserId = params.auth_user_id || undefined;
    if (!resolvedAuthUserId && params.email?.trim()) {
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id')
          .ilike('email', params.email.trim())
          .maybeSingle();
        if (profileData?.id) {
          resolvedAuthUserId = profileData.id;
        }
      } catch {
        // Ignore profile lookup errors
      }
    }

    const { data: newStk, error: stkError } = await supabase
      .from('stakeholders')
      .insert({
        // NOTE: id is auto-generated (UUID default) — do NOT send app-generated ids
        name_ar: params.name_ar,
        name_en: params.name_ar,
        name: params.name_ar,
        stakeholder_kind: params.stakeholder_kind,
        role: params.role || params.project_role,
        job_title: params.role || params.project_role,
        phone: params.phone || '',
        email: params.email || '',
        employee_code: params.employee_code || params.code || null,
        organization_id: '00000000-0000-0000-0000-000000000001',
        client_id: params.client_id || null,
        ...(resolvedAuthUserId ? { auth_user_id: resolvedAuthUserId } : {}),
      })
      .select('*')
      .single();

    if (stkError || !newStk) {
      throw new Error(stkError?.message || 'فشل إضافة الشخص المباشر في سجل أصحاب المصلحة');
    }

    appCache.invalidate('stakeholders:directory');

    return this.addProjectStakeholder({
      project_id: params.project_id,
      stakeholder_id: newStk.id,
      project_role: params.project_role,
      raci_role: params.raci_role,
      party_kind: params.party_kind,
    });
  }

  /**
   * Auto assign Eng. Mahdy El-Sheikh as Projects Director
   */
  static async autoAssignProjectsDirector(projectId: string): Promise<void> {
    try {
      if (!projectId) return;

      // Check if already assigned
      const { data: existing, error: checkError } = await supabase
        .from('project_stakeholders')
        .select('id')
        .eq('project_id', projectId)
        .eq('project_role', 'مدير المشروعات')
        .limit(1);

      if (checkError) {
        logger.warn('Check existing Projects Director error:', { detail: checkError });
      }

      if (existing && existing.length > 0) {
        return;
      }

      // Find Eng. Mahdy El-Sheikh in stakeholders
      const { data: stk, error: findError } = await supabase
        .from('stakeholders')
        .select('id')
        .or('name.ilike.%الشيخ%,email.ilike.%alshaikhm%,job_title.ilike.%Deputy General%')
        .limit(1)
        .maybeSingle();

      if (findError) {
        logger.warn('Find Projects Director error:', { detail: findError });
      }

      if (stk) {
        const { error: insertError } = await supabase
          .from('project_stakeholders')
          .insert({
            project_id: projectId,
            stakeholder_id: stk.id,
            project_role: 'مدير المشروعات',
            raci_role: 'informed',
            organization_id: '00000000-0000-0000-0000-000000000001',
          });

        if (insertError) {
          logger.warn('Auto assign Projects Director insert error:', { detail: insertError });
        } else {
          appCache.invalidate(`project:stakeholders:${projectId}`);
        }
      }
    } catch (e) {
      logger.warn('Error in autoAssignProjectsDirector:', { detail: e });
    }
  }

  /**
   * Client & Consultant Contacts
   */
  static async getProjectClientContacts(projectId: string): Promise<ProjectClientContact[]> {
    const cacheKey = CACHE_KEYS.clientContacts(projectId);
    return appCache.getOrFetch(cacheKey, TTL.tabData, async () => {
      try {
        const { data, error } = await supabase
          .from('project_client_contacts')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: true });

        if (error) {
          logger.warn('getProjectClientContacts error:', { detail: error });
          return [];
        }
        return (data || []) as ProjectClientContact[];
      } catch (e) {
        logger.warn('getProjectClientContacts exception:', { detail: e });
        return [];
      }
    });
  }

  static async addProjectClientContact(contact: Partial<ProjectClientContact>): Promise<ProjectClientContact> {
    if (!contact.project_id) throw new Error('رقم المشروع مطلوب');
    if (!contact.contact_name) throw new Error('اسم جهة الاتصال مطلوب');

    const { data, error } = await supabase
      .from('project_client_contacts')
      .insert(contact)
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'فشل إضافة جهة الاتصال للعميل/الاستشاري');
    }

    appCache.invalidate(CACHE_KEYS.clientContacts(contact.project_id));
    return data as ProjectClientContact;
  }

  static async removeProjectClientContact(id: string, projectId: string): Promise<void> {
    const { error } = await supabase
      .from('project_client_contacts')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message || 'فشل حذف جهة الاتصال');
    }

    appCache.invalidate(CACHE_KEYS.clientContacts(projectId));
  }

  /**
   * Subcontractors
   */
  static async getProjectSubcontractors(projectId: string): Promise<ProjectSubcontractor[]> {
    const cacheKey = CACHE_KEYS.subcontractors(projectId);
    return appCache.getOrFetch(cacheKey, TTL.tabData, async () => {
      try {
        const { data, error } = await supabase
          .from('project_subcontractors')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: true });

        if (error) {
          logger.warn('getProjectSubcontractors error:', { detail: error });
          return [];
        }
        return (data || []) as ProjectSubcontractor[];
      } catch (e) {
        logger.warn('getProjectSubcontractors exception:', { detail: e });
        return [];
      }
    });
  }

  static async addProjectSubcontractor(subcontractor: Partial<ProjectSubcontractor>): Promise<ProjectSubcontractor> {
    if (!subcontractor.project_id) throw new Error('رقم المشروع مطلوب');
    if (!subcontractor.company_name) throw new Error('اسم شركة مقاول الباطن مطلوب');

    // Vendor integration: check if company name exists in public.vendors first
    try {
      const { data: existingVendor } = await supabase
        .from('vendors')
        .select('id, name_ar')
        .or(`name_ar.eq."${subcontractor.company_name}",name_en.eq."${subcontractor.company_name}"`)
        .limit(1)
        .maybeSingle();

      if (!existingVendor) {
        logger.warn(`Vendor with name ${subcontractor.company_name} was not found in the vendors list.`);
      }
    } catch (err) {
      logger.warn('Error checking vendor:', { detail: err });
    }

    const { data, error } = await supabase
      .from('project_subcontractors')
      .insert({
        ...subcontractor,
        status: subcontractor.status || 'active',
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'فشل إضافة مقاول الباطن');
    }

    appCache.invalidate(CACHE_KEYS.subcontractors(subcontractor.project_id));
    return data as ProjectSubcontractor;
  }

  static async removeProjectSubcontractor(id: string, projectId: string): Promise<void> {
    const { error } = await supabase
      .from('project_subcontractors')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message || 'فشل حذف مقاول الباطن');
    }

    appCache.invalidate(CACHE_KEYS.subcontractors(projectId));
  }

  /**
   * Site Resources
   */
  static async getProjectSiteResources(projectId: string): Promise<ProjectSiteResource[]> {
    const cacheKey = CACHE_KEYS.siteResources(projectId);
    return appCache.getOrFetch(cacheKey, TTL.tabData, async () => {
      try {
        const { data, error } = await supabase
          .from('project_site_resources')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: true });

        if (error) {
          logger.warn('getProjectSiteResources error:', { detail: error });
          return [];
        }
        return (data || []) as ProjectSiteResource[];
      } catch (e) {
        logger.warn('getProjectSiteResources exception:', { detail: e });
        return [];
      }
    });
  }

  static async addProjectSiteResource(resource: Partial<ProjectSiteResource>): Promise<ProjectSiteResource> {
    if (!resource.project_id) throw new Error('رقم المشروع مطلوب');
    if (!resource.resource_name) throw new Error('اسم المورد (المعدة/المركبة) مطلوب');

    const { data, error } = await supabase
      .from('project_site_resources')
      .insert(resource)
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'فشل إضافة مورد الموقع');
    }

    appCache.invalidate(CACHE_KEYS.siteResources(resource.project_id));
    return data as ProjectSiteResource;
  }

  static async removeProjectSiteResource(id: string, projectId: string): Promise<void> {
    const { error } = await supabase
      .from('project_site_resources')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message || 'فشل حذف مورد الموقع');
    }

    appCache.invalidate(CACHE_KEYS.siteResources(projectId));
  }

  static async updateProjectClientContact(
    id: string,
    projectId: string,
    updates: Partial<ProjectClientContact>
  ): Promise<ProjectClientContact> {
    const { data, error } = await supabase
      .from('project_client_contacts')
      .update({
        contact_name: updates.contact_name,
        job_title: updates.job_title,
        company_name: updates.company_name,
        phone: updates.phone,
        email: updates.email,
        notes: updates.notes,
        party_type: updates.party_type,
        is_primary: updates.is_primary,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    appCache.invalidate(CACHE_KEYS.clientContacts(projectId));

    if (error) {
      throw new Error(error.message || error.details || 'فشل تحديث جهة الاتصال');
    }

    return data as ProjectClientContact;
  }

  static async updateProjectSubcontractor(
    id: string,
    projectId: string,
    updates: Partial<ProjectSubcontractor>
  ): Promise<ProjectSubcontractor> {
    const { data, error } = await supabase
      .from('project_subcontractors')
      .update({
        company_name: updates.company_name,
        specialization: updates.specialization,
        scope_of_work: updates.scope_of_work,
        scope_description: updates.scope_description,
        contract_value: updates.contract_value,
        rep_name: updates.rep_name,
        rep_phone: updates.rep_phone,
        rep_email: updates.rep_email,
        notes: updates.notes,
        status: updates.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    appCache.invalidate(CACHE_KEYS.subcontractors(projectId));

    if (error) {
      throw new Error(error.message || error.details || 'فشل تحديث بيانات مقاول الباطن');
    }

    return data as ProjectSubcontractor;
  }

  static async updateProjectSiteResource(
    id: string,
    projectId: string,
    updates: Partial<ProjectSiteResource>
  ): Promise<ProjectSiteResource> {
    const { data, error } = await supabase
      .from('project_site_resources')
      .update({
        resource_name: updates.resource_name,
        person_name: updates.person_name,
        phone: updates.phone,
        vehicle_equipment_type: updates.vehicle_equipment_type,
        notes: updates.notes,
        resource_type: updates.resource_type,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    appCache.invalidate(CACHE_KEYS.siteResources(projectId));

    if (error) {
      throw new Error(error.message || error.details || 'فشل تحديث مورد الموقع');
    }

    return data as ProjectSiteResource;
  }
}
