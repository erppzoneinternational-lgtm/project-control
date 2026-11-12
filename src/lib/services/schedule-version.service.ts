'use client';

/**
 * ScheduleVersionService — baseline / update / report versioning for the
 * imported Primavera schedules.
 *
 * Flow: import XER → creates (or bumps) a schedule version → activities are
 * stamped with schedule_version_id → planner submits for approval →
 * planning manager approves → version becomes the reporting reference.
 */

import { supabase } from '@/lib/supabase';

export interface ScheduleVersion {
  id: string;
  project_id: string;
  version_no: number;
  version_type: 'baseline' | 'update' | 'weekly_report' | 'daily_report';
  title: string | null;
  source_file_name: string | null;
  data_date: string | null;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submitted_by: string | null;
  submitted_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  approval_note: string | null;
  activities_count: number | null;
  created_at: string;
}

export const ScheduleVersionService = {
  async list(projectId: string): Promise<ScheduleVersion[]> {
    const { data, error } = await supabase
      .from('pm_schedule_versions')
      .select('*')
      .eq('project_id', projectId)
      .order('version_no', { ascending: false });
    if (error) {
      console.warn('list schedule versions:', error.message);
      return [];
    }
    return (data || []) as ScheduleVersion[];
  },

  async getCurrentBaseline(projectId: string): Promise<ScheduleVersion | null> {
    const { data } = await supabase
      .from('pm_schedule_versions')
      .select('*')
      .eq('project_id', projectId)
      .eq('version_type', 'baseline')
      .order('version_no', { ascending: false })
      .limit(1);
    return (data?.[0] as ScheduleVersion) ?? null;
  },

  /**
   * Create the next version and stamp all given activity ids with it.
   * Called right after a successful XER import.
   */
  async createVersionForImport(
    projectId: string,
    opts: {
      versionType: ScheduleVersion['version_type'];
      title: string;
      fileName: string;
      dataDate?: string | null;
      activityIds: string[];
      userId?: string | null;
    }
  ): Promise<ScheduleVersion | null> {
    // next version_no
    const { data: last } = await supabase
      .from('pm_schedule_versions')
      .select('version_no')
      .eq('project_id', projectId)
      .order('version_no', { ascending: false })
      .limit(1);
    const nextNo = (last?.[0]?.version_no || 0) + 1;

    const { data: ver, error } = await supabase
      .from('pm_schedule_versions')
      .insert({
        project_id: projectId,
        version_no: nextNo,
        version_type: opts.versionType,
        title: opts.title,
        source_file_name: opts.fileName,
        data_date: opts.dataDate || null,
        status: 'draft',
        activities_count: opts.activityIds.length,
        created_by: opts.userId || null,
      })
      .select('*')
      .single();
    if (error) throw error;

    // stamp activities in batches
    const BATCH = 500;
    for (let i = 0; i < opts.activityIds.length; i += BATCH) {
      const chunk = opts.activityIds.slice(i, i + BATCH);
      const { error: upErr } = await supabase
        .from('pm_project_activities')
        .update({ schedule_version_id: ver.id })
        .in('id', chunk);
      if (upErr) throw upErr;
    }
    return ver as ScheduleVersion;
  },

  /**
   * Snapshot the project's CURRENT activity set into a new version row
   * (type=update) and re-stamp those activities with it — the manual
   * "حفظ كنسخة" path (no XER file involved). Mirrors createVersionForImport:
   * current set = activities stamped with the newest existing version,
   * falling back to all active project activities when nothing is stamped.
   */
  async createVersionFromCurrent(
    projectId: string,
    title: string,
    opts?: { userId?: string | null; dataDate?: string | null; fileName?: string | null }
  ): Promise<ScheduleVersion | null> {
    // newest existing version, if any
    const { data: lastVer } = await supabase
      .from('pm_schedule_versions')
      .select('id')
      .eq('project_id', projectId)
      .order('version_no', { ascending: false })
      .limit(1);

    // current set: rows stamped with that version; fallback to all active rows
    let ids: string[] = [];
    if (lastVer?.[0]?.id) {
      const { data } = await supabase
        .from('pm_project_activities')
        .select('id')
        .eq('project_id', projectId)
        .eq('is_active', true)
        .eq('schedule_version_id', lastVer[0].id)
        .limit(5000);
      ids = (data || []).map((a) => a.id);
    }
    if (!ids.length) {
      const { data } = await supabase
        .from('pm_project_activities')
        .select('id')
        .eq('project_id', projectId)
        .eq('is_active', true)
        .limit(5000);
      ids = (data || []).map((a) => a.id);
    }
    if (!ids.length) throw new Error('لا توجد أنشطة نشطة لحفظها كنسخة');

    return this.createVersionForImport(projectId, {
      versionType: 'update',
      title,
      fileName: opts?.fileName || 'تعديل يدوي',
      dataDate: opts?.dataDate ?? new Date().toISOString().slice(0, 10),
      activityIds: ids,
      userId: opts?.userId ?? null,
    });
  },

  async submitForApproval(versionId: string, userId?: string | null): Promise<boolean> {
    const { error } = await supabase
      .from('pm_schedule_versions')
      .update({ status: 'submitted', submitted_by: userId || null, submitted_at: new Date().toISOString() })
      .eq('id', versionId);
    return !error;
  },

  async approve(versionId: string, userId?: string | null, note?: string): Promise<boolean> {
    const { error } = await supabase
      .from('pm_schedule_versions')
      .update({
        status: 'approved',
        approved_by: userId || null,
        approved_at: new Date().toISOString(),
        approval_note: note || null,
      })
      .eq('id', versionId);
    return !error;
  },

  async reject(versionId: string, userId?: string | null, note?: string): Promise<boolean> {
    const { error } = await supabase
      .from('pm_schedule_versions')
      .update({
        status: 'rejected',
        approved_by: userId || null,
        approved_at: new Date().toISOString(),
        approval_note: note || null,
      })
      .eq('id', versionId);
    return !error;
  },
};
