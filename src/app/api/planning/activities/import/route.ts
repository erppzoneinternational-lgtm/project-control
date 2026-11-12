import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { canEditPath } from '@/lib/rbac/access-control';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds timeout for large schedule batches

const MAX_BATCH_ACTIVITIES = 5000;
const MAX_BATCH_WBS = 5000;
const MAX_BATCH_DEPENDENCIES = 15000;

const UNRESTRICTED_PLANNING_EDIT_ROLES = new Set([
  'admin',
  'ceo',
  'coo',
  'chairman',
  'commercial_manager',
  'planning_manager',
]);

const EXPLICIT_SCOPED_MODES = new Set(['assigned', 'selected', 'custom', 'scoped']);
const VALID_ACTIVITY_STATUSES = new Set(['not_started', 'in_progress', 'completed', 'delayed']);
const VALID_DISCIPLINES = new Set([
  'civil',
  'finishing',
  'mech',
  'elec',
  'landscape',
  'water',
  'mep',
  'other',
]);
const VALID_BOQ_LINK_MODES = new Set(['by_items', 'manual_cost', 'weight']);
const VALID_DEP_RELATIONS = new Set(['FS', 'SS', 'FF', 'SF']);
const VALID_VERSION_TYPES = new Set(['baseline', 'update', 'revised', 'recovery']);

function sanitizeOptionalDate(val: unknown): string | null {
  if (typeof val !== 'string') return null;
  const trimmed = val.trim();
  return trimmed.length > 0 ? trimmed.slice(0, 64) : null;
}

function sanitizeFiniteNumber(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null;
  const num = Number(val);
  return Number.isFinite(num) ? num : null;
}

function sanitizeActivityRow(
  raw: unknown,
  projectId: string,
  wbsCodeToIdMap: Map<string, string>
): Record<string, unknown> {
  const src = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};

  let resolvedWbsId: string | null =
    typeof src.wbs_item_id === 'string' && src.wbs_item_id.trim()
      ? src.wbs_item_id.trim().slice(0, 64)
      : null;

  if (!resolvedWbsId && typeof src.wbs_code === 'string' && src.wbs_code.trim()) {
    resolvedWbsId = wbsCodeToIdMap.get(src.wbs_code.trim().toUpperCase()) ?? null;
  }

  const rawCode = typeof src.code === 'string' && src.code.trim() ? src.code.trim().slice(0, 120) : null;
  const rawActCode =
    typeof src.activity_code === 'string' && src.activity_code.trim()
      ? src.activity_code.trim().slice(0, 120)
      : rawCode;

  const pctRaw = sanitizeFiniteNumber(src.percent_complete);
  const percentComplete = pctRaw !== null ? Math.min(100, Math.max(0, pctRaw)) : 0;

  const durationRaw = sanitizeFiniteNumber(src.duration_days);
  const durationDays = durationRaw !== null && durationRaw >= 0 ? Math.round(durationRaw) || 1 : 1;

  const rawStatus = typeof src.status === 'string' ? src.status.trim() : '';
  const status = VALID_ACTIVITY_STATUSES.has(rawStatus)
    ? rawStatus
    : percentComplete >= 100
    ? 'completed'
    : percentComplete > 0
    ? 'in_progress'
    : 'not_started';

  const sanitized: Record<string, unknown> = {
    project_id: projectId,
    wbs_item_id: resolvedWbsId,
    code: rawCode,
    activity_code: rawActCode,
    name_ar:
      typeof src.name_ar === 'string' && src.name_ar.trim()
        ? src.name_ar.trim().slice(0, 500)
        : 'نشاط',
    planned_start: sanitizeOptionalDate(src.planned_start),
    planned_finish: sanitizeOptionalDate(src.planned_finish),
    duration_days: durationDays,
    percent_complete: percentComplete,
    is_critical: Boolean(src.is_critical),
    is_milestone: Boolean(src.is_milestone),
    status,
    is_active: src.is_active !== undefined ? Boolean(src.is_active) : true,
  };

  if (src.name_en !== undefined) {
    sanitized.name_en =
      typeof src.name_en === 'string' && src.name_en.trim()
        ? src.name_en.trim().slice(0, 500)
        : null;
  }
  if (src.actual_start !== undefined) {
    sanitized.actual_start = sanitizeOptionalDate(src.actual_start);
  }
  if (src.actual_finish !== undefined) {
    sanitized.actual_finish = sanitizeOptionalDate(src.actual_finish);
  }
  if (src.expected_finish !== undefined) {
    sanitized.expected_finish = sanitizeOptionalDate(src.expected_finish);
  }
  if (src.remaining_duration_days !== undefined) {
    sanitized.remaining_duration_days = sanitizeFiniteNumber(src.remaining_duration_days);
  }
  if (src.total_float_days !== undefined) {
    sanitized.total_float_days = sanitizeFiniteNumber(src.total_float_days);
  }
  if (src.free_float_days !== undefined) {
    sanitized.free_float_days = sanitizeFiniteNumber(src.free_float_days);
  }
  if (src.weight_override !== undefined) {
    sanitized.weight_override = sanitizeFiniteNumber(src.weight_override);
  }
  if (src.weight_pct !== undefined) {
    sanitized.weight_pct = sanitizeFiniteNumber(src.weight_pct);
  }
  if (src.budgeted_cost_egp !== undefined) {
    const cost = sanitizeFiniteNumber(src.budgeted_cost_egp);
    if (cost !== null && cost >= 0) sanitized.budgeted_cost_egp = cost;
  }
  if (src.sort_order !== undefined) {
    const order = sanitizeFiniteNumber(src.sort_order);
    if (order !== null) sanitized.sort_order = Math.trunc(order);
  }
  if (typeof src.discipline === 'string' && VALID_DISCIPLINES.has(src.discipline)) {
    sanitized.discipline = src.discipline;
  }
  if (typeof src.boq_link_mode === 'string' && VALID_BOQ_LINK_MODES.has(src.boq_link_mode)) {
    sanitized.boq_link_mode = src.boq_link_mode;
  }
  if (typeof src.library_code === 'string' && src.library_code.trim()) {
    sanitized.library_code = src.library_code.trim().slice(0, 120);
  }
  if (typeof src.calendar_type === 'string' && src.calendar_type.trim()) {
    sanitized.calendar_type = src.calendar_type.trim().slice(0, 64);
  }
  if (src.is_out_of_sequence !== undefined) {
    sanitized.is_out_of_sequence = Boolean(src.is_out_of_sequence);
  }
  if (src.notes !== undefined) {
    sanitized.notes =
      typeof src.notes === 'string' && src.notes.trim() ? src.notes.trim().slice(0, 2000) : null;
  }
  if (
    typeof src.responsible_stakeholder_id === 'string' &&
    src.responsible_stakeholder_id.trim()
  ) {
    sanitized.responsible_stakeholder_id = src.responsible_stakeholder_id.trim().slice(0, 64);
  }

  return sanitized;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Require authenticated user session via Server Client (fail-closed)
    const serverSupabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await serverSupabase.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    const admin = createSupabaseAdminClient();

    // 2. Verify active profile & planning edit authorization
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('roles, is_active, status, project_scope_mode')
      .eq('id', userId)
      .maybeSingle();

    if (
      profileError ||
      !profile ||
      profile.is_active === false ||
      (profile.status && profile.status !== 'active')
    ) {
      return NextResponse.json(
        { error: 'Forbidden: account is inactive or pending activation.' },
        { status: 403 }
      );
    }

    const roles: string[] = Array.isArray(profile.roles) ? profile.roles : [];
    const isViewerOnly = roles.length === 0 || roles.every((r) => r === 'viewer');
    const isAdmin = roles.includes('admin');

    if (
      isViewerOnly ||
      (!canEditPath('/planning', roles, isAdmin) &&
        !canEditPath('/planning/activities', roles, isAdmin))
    ) {
      return NextResponse.json(
        { error: 'Forbidden: insufficient permissions to import schedule activities.' },
        { status: 403 }
      );
    }

    // 3. Parse and validate payload & batch size limits
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
    }

    const {
      projectId,
      activities,
      dependencies,
      wbsItems,
      fileName,
      versionTitle,
      versionType,
      replaceExisting = false,
    } = body as Record<string, unknown>;

    if (
      typeof projectId !== 'string' ||
      !projectId.trim() ||
      !Array.isArray(activities) ||
      activities.length === 0
    ) {
      return NextResponse.json(
        { error: 'Project ID and at least one activity are required.' },
        { status: 400 }
      );
    }

    if (activities.length > MAX_BATCH_ACTIVITIES) {
      return NextResponse.json(
        { error: `Activities batch exceeds maximum limit of ${MAX_BATCH_ACTIVITIES}.` },
        { status: 413 }
      );
    }

    if (Array.isArray(wbsItems) && wbsItems.length > MAX_BATCH_WBS) {
      return NextResponse.json(
        { error: `WBS items batch exceeds maximum limit of ${MAX_BATCH_WBS}.` },
        { status: 413 }
      );
    }

    if (Array.isArray(dependencies) && dependencies.length > MAX_BATCH_DEPENDENCIES) {
      return NextResponse.json(
        { error: `Dependencies batch exceeds maximum limit of ${MAX_BATCH_DEPENDENCIES}.` },
        { status: 413 }
      );
    }

    const cleanProjectId = projectId.trim();

    // 4. Verify project-level edit access for non-unrestricted / scoped users
    const scopeMode =
      typeof profile.project_scope_mode === 'string'
        ? profile.project_scope_mode.trim().toLowerCase()
        : '';
    const isUnrestricted =
      isAdmin ||
      (roles.some((r) => UNRESTRICTED_PLANNING_EDIT_ROLES.has(r)) &&
        !EXPLICIT_SCOPED_MODES.has(scopeMode));

    if (!isUnrestricted) {
      const { data: accessRow, error: accessError } = await admin
        .from('pm_user_project_access')
        .select('access_level')
        .eq('user_id', userId)
        .eq('project_id', cleanProjectId)
        .maybeSingle();

      const accessLevel = String(accessRow?.access_level || '').toLowerCase();
      if (accessError || !accessRow || !accessLevel || accessLevel === 'view') {
        return NextResponse.json(
          { error: 'Forbidden: no edit access to this project.' },
          { status: 403 }
        );
      }
    }

    // 5. Ingest or match WBS items if provided
    const wbsCodeToIdMap = new Map<string, string>();
    if (Array.isArray(wbsItems) && wbsItems.length > 0) {
      try {
        const { data: existingWbs } = await admin
          .from('pm_wbs_items')
          .select('id, wbs_code')
          .eq('project_id', cleanProjectId);

        (existingWbs || []).forEach((w: { id: string; wbs_code: string }) => {
          if (w.wbs_code) wbsCodeToIdMap.set(w.wbs_code.trim().toUpperCase(), w.id);
        });

        const missingWbs = wbsItems.filter(
          (w: Record<string, unknown>) =>
            w &&
            typeof w.wbs_short_name === 'string' &&
            w.wbs_short_name.trim().length > 0 &&
            !wbsCodeToIdMap.has(w.wbs_short_name.trim().toUpperCase())
        );

        if (missingWbs.length > 0) {
          const toInsert = missingWbs.map((w: Record<string, unknown>, idx: number) => {
            const shortName = String(w.wbs_short_name).trim().slice(0, 120);
            const label =
              typeof w.wbs_name === 'string' && w.wbs_name.trim()
                ? w.wbs_name.trim().slice(0, 300)
                : shortName;
            return {
              project_id: cleanProjectId,
              wbs_code: shortName.toUpperCase(),
              title_ar: label,
              title_en: label,
              sort_order: Number.isFinite(Number(w.seq_num)) ? Math.trunc(Number(w.seq_num)) : idx + 1,
              level: Math.max(1, Math.trunc(Number(w.computedLevel) || 1)),
              status: 'not_started',
            };
          });

          const { data: newWbs } = await admin
            .from('pm_wbs_items')
            .insert(toInsert)
            .select('id, wbs_code');

          (newWbs || []).forEach((w: { id: string; wbs_code: string }) => {
            if (w.wbs_code) wbsCodeToIdMap.set(w.wbs_code.trim().toUpperCase(), w.id);
          });
        }
      } catch (wbsErr) {
        console.warn('[API Activities Import] WBS ingestion warning:', wbsErr);
      }
    }

    // Whitelist & sanitize every activity row before insertion
    const sanitizedActivities = activities.map((raw) =>
      sanitizeActivityRow(raw, cleanProjectId, wbsCodeToIdMap)
    );

    // 6. Optionally archive or mark older activities as inactive
    if (Boolean(replaceExisting)) {
      await admin
        .from('pm_project_activities')
        .update({ is_active: false })
        .eq('project_id', cleanProjectId)
        .eq('is_active', true);
    }

    // 7. Perform bulk insertion using Admin Client after strict RBAC & column whitelisting
    const CHUNK_SIZE = 200;
    const insertedIds: string[] = [];
    const codeToId = new Map<string, string>();

    for (let i = 0; i < sanitizedActivities.length; i += CHUNK_SIZE) {
      const chunk = sanitizedActivities.slice(i, i + CHUNK_SIZE);
      const { data, error } = await admin
        .from('pm_project_activities')
        .insert(chunk)
        .select('id, code, activity_code');

      if (error) {
        console.error('[API Activities Import] Insert error at chunk', i, error);
        return NextResponse.json(
          { error: `Database insert failed: ${error.message}` },
          { status: 500 }
        );
      }

      if (data) {
        data.forEach((r: { id: string; code?: string; activity_code?: string }) => {
          insertedIds.push(r.id);
          if (r.code) codeToId.set(r.code, r.id);
          if (r.activity_code) codeToId.set(r.activity_code, r.id);
        });
      }
    }

    // 8. Ingest dependencies if provided
    if (Array.isArray(dependencies) && dependencies.length > 0) {
      try {
        const depsToInsert: Array<{
          predecessor_id: string;
          successor_id: string;
          rel: string;
          lag_days: number;
        }> = [];

        for (const rawDep of dependencies) {
          if (!rawDep || typeof rawDep !== 'object') continue;
          const dep = rawDep as Record<string, unknown>;
          const predCode = typeof dep.predecessor_code === 'string' ? dep.predecessor_code : '';
          const succCode = typeof dep.successor_code === 'string' ? dep.successor_code : '';
          const pId =
            (predCode && codeToId.get(predCode)) ||
            (typeof dep.predecessor_id === 'string' ? dep.predecessor_id.trim() : '');
          const sId =
            (succCode && codeToId.get(succCode)) ||
            (typeof dep.successor_id === 'string' ? dep.successor_id.trim() : '');

          if (pId && sId && pId !== sId) {
            const rawRel = String(dep.rel || dep.relationship || 'FS').trim().toUpperCase();
            const rel = VALID_DEP_RELATIONS.has(rawRel) ? rawRel : 'FS';
            const lag = Number(dep.lag_days || 0);
            depsToInsert.push({
              predecessor_id: pId,
              successor_id: sId,
              rel,
              lag_days: Number.isFinite(lag) ? lag : 0,
            });
          }
        }

        if (depsToInsert.length > 0) {
          for (let i = 0; i < depsToInsert.length; i += CHUNK_SIZE) {
            const dChunk = depsToInsert.slice(i, i + CHUNK_SIZE);
            await admin
              .from('pm_activity_dependencies')
              .upsert(dChunk, { onConflict: 'predecessor_id,successor_id', ignoreDuplicates: true });
          }
        }
      } catch (depErr) {
        console.warn('[API Activities Import] Dependencies insertion warning:', depErr);
      }
    }

    // 9. Register schedule version (Baseline for v1 or requested versionType)
    let versionRecord = null;
    try {
      const { data: existingVersions } = await admin
        .from('pm_schedule_versions')
        .select('version_no')
        .eq('project_id', cleanProjectId)
        .order('version_no', { ascending: false });

      const lastNo = existingVersions?.[0]?.version_no || 0;
      const nextNo = lastNo + 1;
      const rawVType = typeof versionType === 'string' ? versionType.trim().toLowerCase() : '';
      const vType = VALID_VERSION_TYPES.has(rawVType)
        ? rawVType
        : lastNo === 0
        ? 'baseline'
        : 'update';

      const safeFileName =
        typeof fileName === 'string' && fileName.trim() ? fileName.trim().slice(0, 200) : 'XER';
      const title =
        typeof versionTitle === 'string' && versionTitle.trim()
          ? versionTitle.trim().slice(0, 300)
          : vType === 'baseline'
          ? 'الجدول الأساسي التعاقدي (Baseline)'
          : `تحديث — ${safeFileName}`;

      const { data: ver, error: verErr } = await admin
        .from('pm_schedule_versions')
        .insert({
          project_id: cleanProjectId,
          version_no: nextNo,
          version_type: vType,
          title,
          source_file_name: safeFileName,
          data_date: new Date().toISOString().slice(0, 10),
          status: 'draft',
          activities_count: insertedIds.length,
          created_by: userId,
        })
        .select('*')
        .single();

      if (!verErr && ver) {
        versionRecord = ver;
        for (let i = 0; i < insertedIds.length; i += CHUNK_SIZE) {
          const idChunk = insertedIds.slice(i, i + CHUNK_SIZE);
          await admin
            .from('pm_project_activities')
            .update({ schedule_version_id: ver.id })
            .in('id', idChunk);
        }
      }
    } catch (verEx) {
      console.warn('[API Activities Import] Version registration warning:', verEx);
    }

    return NextResponse.json({
      success: true,
      count: insertedIds.length,
      version: versionRecord,
    });
  } catch (err: unknown) {
    console.error('[API Activities Import] Server exception:', err);
    return NextResponse.json(
      { error: 'Internal server error while importing activities.' },
      { status: 500 }
    );
  }
}
