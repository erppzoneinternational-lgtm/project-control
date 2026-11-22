import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { canAccessPath } from '@/lib/rbac/access-control';
import {
  generateProjectXer,
  XerActivityRecord,
  XerDependencyRecord,
} from '@/lib/services/xer-generator';

export const dynamic = 'force-dynamic';

type ServerSupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

const UNRESTRICTED_PLANNING_READ_ROLES = new Set([
  'admin',
  'ceo',
  'coo',
  'coo_assistant',
  'chairman',
  'board_member',
  'commercial_manager',
  'planning_manager',
]);

const EXPLICIT_SCOPED_MODES = new Set(['assigned', 'selected', 'custom', 'scoped']);

async function getScopedAllowedProjectIds(
  sb: ServerSupabaseClient,
  userId: string,
  userEmail: string | undefined
): Promise<Set<string>> {
  const allowedIds = new Set<string>();

  const { data: directRows } = await sb
    .from('pm_user_project_access')
    .select('project_id')
    .eq('user_id', userId);

  (directRows || []).forEach((row: { project_id?: string | null }) => {
    if (row.project_id) allowedIds.add(row.project_id);
  });

  const cleanEmail = userEmail?.trim();
  const stakeholderFilter = cleanEmail
    ? `auth_user_id.eq.${userId},email.ilike.${cleanEmail}`
    : `auth_user_id.eq.${userId}`;

  const { data: stks } = await sb
    .from('stakeholders')
    .select('id')
    .or(stakeholderFilter);

  const stkIds = (stks || []).map((s: { id: string }) => s.id).filter(Boolean);
  if (stkIds.length > 0) {
    const todayIso = new Date().toISOString().slice(0, 10);
    const { data: pStks } = await sb
      .from('project_stakeholders')
      .select('project_id, is_active, end_date')
      .in('stakeholder_id', stkIds);

    (pStks || []).forEach(
      (ps: { project_id?: string | null; is_active?: boolean | null; end_date?: string | null }) => {
        if (!ps.project_id) return;
        if (ps.is_active === false) return;
        if (ps.end_date && String(ps.end_date).slice(0, 10) < todayIso) return;
        allowedIds.add(ps.project_id);
      }
    );

    const { data: pmDirect } = await sb
      .from('projects')
      .select('id')
      .in('project_manager_stakeholder_id', stkIds)
      .is('deleted_at', null);

    (pmDirect || []).forEach((p: { id?: string | null }) => {
      if (p.id) allowedIds.add(p.id);
    });
  }

  return allowedIds;
}

export async function GET(request: NextRequest) {
  try {
    // 1. Require authenticated user session
    const serverSupabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await serverSupabase.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Enforce active profile & RBAC access to /planning
    const { data: profile, error: profileError } = await serverSupabase
      .from('profiles')
      .select('roles, is_active, status, project_scope_mode')
      .eq('id', user.id)
      .maybeSingle();

    if (
      profileError ||
      !profile ||
      profile.is_active === false ||
      (profile.status && profile.status !== 'active')
    ) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const roles: string[] = Array.isArray(profile.roles) ? profile.roles : [];
    const isAdmin = roles.includes('admin');
    if (!canAccessPath('/planning', roles, isAdmin)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const scopeMode =
      typeof profile.project_scope_mode === 'string'
        ? profile.project_scope_mode.trim().toLowerCase()
        : '';
    const isUnrestricted =
      isAdmin ||
      (roles.some((r) => UNRESTRICTED_PLANNING_READ_ROLES.has(r)) &&
        !EXPLICIT_SCOPED_MODES.has(scopeMode));

    const { searchParams } = new URL(request.url);
    const requestedProjectId = searchParams.get('projectId')?.trim() || null;

    let scopedAllowedIds: Set<string> | null = null;
    if (!isUnrestricted) {
      scopedAllowedIds = await getScopedAllowedProjectIds(serverSupabase, user.id, user.email);
      if (requestedProjectId && !scopedAllowedIds.has(requestedProjectId)) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }
      if (!requestedProjectId && scopedAllowedIds.size === 0) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }
    }

    // 3. Resolve Project
    let project: {
      id: string;
      project_code: string | null;
      project_name: string | null;
      planned_start_date: string | null;
      planned_finish_date: string | null;
    } | null = null;

    if (requestedProjectId) {
      const { data, error } = await serverSupabase
        .from('pm_projects')
        .select('id, project_code, project_name, planned_start_date, planned_finish_date')
        .eq('id', requestedProjectId)
        .is('deleted_at', null)
        .maybeSingle();

      if (error) {
        console.error('[pulse-project API] Project query error:', error);
      }
      project = data;
    } else {
      let query = serverSupabase
        .from('pm_projects')
        .select('id, project_code, project_name, planned_start_date, planned_finish_date')
        .is('deleted_at', null);

      if (scopedAllowedIds) {
        query = query.in('id', Array.from(scopedAllowedIds));
      }

      const { data } = await query
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      project = data;
    }

    if (!project) {
      return NextResponse.json(
        { success: false, message: 'No projects available' },
        { status: 404 }
      );
    }

    const projectId = project.id;
    const resolvedName = project.project_name || 'مشروع';
    const resolvedCode = project.project_code || 'PROJ';

    // 4. Fetch activities (pm_project_activities first, legacy fallback)
    let actsToLoad: XerActivityRecord[] = [];
    const { data: dbActs } = await serverSupabase
      .from('pm_project_activities')
      .select(
        'id, code, activity_code, name_ar, planned_start, planned_finish, actual_start, actual_finish, duration_days, remaining_duration_days, percent_complete, is_critical, is_milestone, total_float_days, wbs_item_id'
      )
      .eq('project_id', projectId)
      .eq('is_active', true)
      .order('planned_start', { ascending: true })
      .limit(3000);

    if (dbActs && dbActs.length > 0) {
      actsToLoad = dbActs.map((a) => ({
        id: a.id,
        code: a.activity_code || a.code || a.id.slice(0, 8),
        name: a.name_ar || 'نشاط',
        start: a.planned_start,
        finish: a.planned_finish,
        actual_start: a.actual_start,
        actual_finish: a.actual_finish,
        duration: Number(a.duration_days || 1),
        pct: Number(a.percent_complete || 0),
        critical: !!a.is_critical,
        milestone: !!a.is_milestone,
        float: a.total_float_days != null ? Number(a.total_float_days) : null,
        wbs_id: a.wbs_item_id || null,
      }));
    } else {
      const { data: legacySchedules } = await serverSupabase
        .from('schedules')
        .select('id')
        .eq('project_id', projectId);

      if (legacySchedules && legacySchedules.length > 0) {
        const schedIds = legacySchedules.map((s) => s.id);
        const { data: legacyActs } = await serverSupabase
          .from('activities')
          .select(
            'id, activity_code, name, planned_start, planned_finish, actual_start, actual_finish, duration_days, percent_complete, is_critical, is_milestone, total_float_days, wbs_node_id'
          )
          .in('schedule_id', schedIds)
          .order('planned_start', { ascending: true })
          .limit(3000);

        if (legacyActs && legacyActs.length > 0) {
          actsToLoad = legacyActs.map((a) => ({
            id: a.id,
            code: a.activity_code || a.id.slice(0, 8),
            name: a.name || 'نشاط',
            start: a.planned_start,
            finish: a.planned_finish,
            actual_start: a.actual_start,
            actual_finish: a.actual_finish,
            duration: Number(a.duration_days || 1),
            pct: Number(a.percent_complete || 0),
            critical: !!a.is_critical,
            milestone: !!a.is_milestone,
            float: a.total_float_days != null ? Number(a.total_float_days) : null,
            wbs_id: a.wbs_node_id || null,
          }));
        }
      }
    }

    if (actsToLoad.length === 0) {
      return NextResponse.json({
        success: true,
        type: 'CLEAR_PROJECT_DATA',
        projectId,
        projectCode: resolvedCode,
        projectName: `#${resolvedCode} — ${resolvedName}`,
        activitiesCount: 0,
      });
    }

    // 5. Fetch dependencies
    let depsToLoad: XerDependencyRecord[] = [];
    const { data: dbDeps } = await serverSupabase
      .from('pm_activity_dependencies')
      .select('predecessor_id, successor_id, dependency_type, lag_days')
      .eq('project_id', projectId);

    if (dbDeps && dbDeps.length > 0) {
      depsToLoad = dbDeps.map((d) => ({
        predecessor_id: d.predecessor_id,
        successor_id: d.successor_id,
        relationship: (d.dependency_type as 'FS' | 'SS' | 'FF' | 'SF') || 'FS',
        lag_days: Number(d.lag_days || 0),
      }));
    }

    // 6. Generate XER
    const { baselineXer, currentXer, activitiesCount } = generateProjectXer({
      project: {
        id: projectId,
        name: resolvedName,
        code: resolvedCode,
        startDate: project.planned_start_date,
        finishDate: project.planned_finish_date,
      },
      activities: actsToLoad,
      dependencies: depsToLoad,
      dataDate: new Date(),
    });

    const displayName = `#${resolvedCode} — ${resolvedName}`;

    return NextResponse.json(
      {
        success: true,
        type: 'LOAD_PROJECT_XER',
        projectId,
        projectCode: resolvedCode,
        projectName: displayName,
        baselineXer,
        currentXer,
        baselineName: `${resolvedCode}-Baseline.xer`,
        currentName: `${resolvedCode}-Current.xer`,
        monthLabel: 'التحديث الحالي',
        activitiesCount,
        timestamp: Date.now(),
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (err: unknown) {
    console.error('[pulse-project API] Internal error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
