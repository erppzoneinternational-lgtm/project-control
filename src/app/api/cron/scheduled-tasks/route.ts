import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Combined Scheduled Tasks Cron Route
 * Runs: Silent Site 48h detection + Due Date warnings + Weekly Report auto-generation
 * Secured with CRON_SECRET env var (Vercel Cron sets this automatically)
 */

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;
const MAX_RATE_LIMIT_ENTRIES = 1000;

function timingSafeSecretEqual(
  provided: string | null | undefined,
  expected: string | null | undefined
): boolean {
  if (!provided || !expected) return false;
  const providedBuf = Buffer.from(provided, 'utf8');
  const expectedBuf = Buffer.from(expected, 'utf8');
  const providedDigest = crypto.createHash('sha256').update(providedBuf).digest();
  const expectedDigest = crypto.createHash('sha256').update(expectedBuf).digest();
  const digestsEqual = crypto.timingSafeEqual(providedDigest, expectedDigest);
  return providedBuf.length === expectedBuf.length && digestsEqual;
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    if (!entry && rateLimitMap.size >= MAX_RATE_LIMIT_ENTRIES) {
      for (const [k, v] of rateLimitMap) {
        if (now > v.resetAt) rateLimitMap.delete(k);
      }
      while (rateLimitMap.size >= MAX_RATE_LIMIT_ENTRIES) {
        const oldestKey = rateLimitMap.keys().next().value;
        if (oldestKey === undefined) break;
        rateLimitMap.delete(oldestKey);
      }
    }
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ── Job 1: Silent Site Detection (48h no daily report) ──
async function checkSilentSites() {
  const sb = getServiceClient();
  const results: string[] = [];

  // Find active projects with no daily report in last 48h
  const { data: projects, error: projError } = await sb
    .from('projects')
    .select('id, name_ar, name_en, code')
    .in('status', ['working', 'in_progress', 'active']);

  if (projError || !projects?.length) {
    results.push(`Silent sites: ${projError?.message || 'no active projects'}`);
    return results;
  }

  for (const project of projects) {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    const { data: recentReports } = await sb
      .from('pm_daily_progress')
      .select('id')
      .eq('project_id', project.id)
      .gte('progress_date', cutoff.split('T')[0])
      .limit(1);

    if (!recentReports?.length) {
      // Silent site detected — notify COO + Admin
      const { data: recipients } = await sb.rpc('fn_get_project_role_users', {
        p_project_id: project.id,
        p_roles: ['coo', 'admin', 'chairman'],
      });

      const recipientIds = (recipients as any[]) || [];
      for (const r of recipientIds) {
        if (r.auth_user_id) {
          await sb.from('pm_notifications').insert({
            recipient_user_id: r.auth_user_id,
            project_id: project.id,
            event_type: 'silent_site_alert',
            entity_type: 'project',
            entity_id: project.id,
            title_ar: '⚠️ موقع صامت أكثر من 48 ساعة',
            body_ar: `المشروع: ${project.name_ar || project.code || project.id} — لم يتم تقديم أي تقرير يومي منذ أكثر من 48 ساعة`,
            link_url: project.id ? `/dashboard?project=${project.id}` : '/dashboard',
            metadata: { project_code: project.code, hours_silent: 48 },
          });
        }
      }
      results.push(`⚠️ Silent: ${project.code || project.id}`);
    }
  }

  if (results.length === 0) results.push('No silent sites');
  return results;
}

// ── Job 2: Due Date Approaching Warnings (3 days) ──
async function checkDueDateWarnings() {
  const sb = getServiceClient();
  const results: string[] = [];

  const now = new Date();
  const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const { data: tasks, error } = await sb
    .from('pm_site_tasks')
    .select('id, title_ar, project_id, assignee_stakeholder_id, planned_finish_at')
    .gte('planned_finish_at', now.toISOString())
    .lte('planned_finish_at', threeDaysLater.toISOString())
    .not('status', 'in', '("done","cancelled","approved")');

  if (error || !tasks?.length) {
    results.push(`Due dates: ${error?.message || 'no upcoming tasks'}`);
    return results;
  }

  for (const task of tasks) {
    // Notify assigned engineer
    if (task.assignee_stakeholder_id) {
      const { data: stakeholder } = await sb
        .from('stakeholders')
        .select('auth_user_id')
        .eq('id', task.assignee_stakeholder_id)
        .single();

      if (stakeholder?.auth_user_id) {
        await sb.from('pm_notifications').insert({
          recipient_user_id: stakeholder.auth_user_id,
          project_id: task.project_id,
          event_type: 'due_date_warning',
          entity_type: 'task',
          entity_id: task.id,
          title_ar: '⏰ مهمة قاربت على الموعد النهائي',
          body_ar: `المهمة: ${task.title_ar || task.id} — الموعد النهائي: ${task.planned_finish_at}`,
          link_url: '/planning/site-tasks',
          metadata: { task_id: task.id, planned_finish_at: task.planned_finish_at },
        });
        results.push(`⏰ Warning: ${task.id}`);
      }
    }
  }

  if (results.length === 0) results.push('No due date warnings');
  return results;
}

// ── Job 3: Weekly Report Auto-Generation (Sunday only) ──
async function autoGenerateWeeklyReports() {
  const results: string[] = [];
  const today = new Date();
  
  // Only run on Sundays (day 0)
  if (today.getUTCDay() !== 0) {
    results.push('Weekly reports: skipped (not Sunday)');
    return results;
  }

  const sb = getServiceClient();

  const { data: projects, error } = await sb
    .from('projects')
    .select('id, name_ar, code, weekly_send_day')
    .in('status', ['working', 'in_progress', 'active']);

  if (error || !projects?.length) {
    results.push(`Weekly reports: ${error?.message || 'no active projects'}`);
    return results;
  }

  // Calculate week range
  const weekEnd = new Date(today);
  weekEnd.setUTCDate(today.getUTCDate() - 1); // Saturday
  const weekStart = new Date(weekEnd);
  weekStart.setUTCDate(weekEnd.getUTCDate() - 6); // Previous Sunday

  for (const project of projects) {
    // Check if weekly report already exists for this week
    const { data: existing } = await sb
      .from('pm_weekly_reports')
      .select('id')
      .eq('project_id', project.id)
      .eq('week_start', weekStart.toISOString().split('T')[0])
      .limit(1);

    if (existing?.length) continue; // Already generated

    // Insert draft weekly report
    const { error: insertError } = await sb.from('pm_weekly_reports').insert({
      project_id: project.id,
      week_start: weekStart.toISOString().split('T')[0],
      week_end: weekEnd.toISOString().split('T')[0],
      status: 'draft',
      aggregates: {},
    });

    if (!insertError) {
      // Notify Planning Engineer
      const { data: planners } = await sb.rpc('fn_get_project_role_users', {
        p_project_id: project.id,
        p_roles: ['planning_engineer', 'planning_manager'],
      });

      for (const p of (planners as any[]) || []) {
        if (p.auth_user_id) {
          await sb.from('pm_notifications').insert({
            recipient_user_id: p.auth_user_id,
            project_id: project.id,
            event_type: 'weekly_report_generated',
            entity_type: 'weekly_report',
            entity_id: project.id,
            title_ar: '📊 تقرير أسبوعي جاهز للمراجعة',
            body_ar: `تقرير أسبوعي تلقائي للمشروع: ${project.name_ar || project.code}`,
            link_url: '/planning/weekly-reports',
            metadata: { week_start: weekStart.toISOString().split('T')[0] },
          });
        }
      }
      results.push(`📊 Generated: ${project.code || project.id}`);
    }
  }

  if (results.length === 0) results.push('No weekly reports needed');
  return results;
}

// ── Main Handler ──
export async function GET(request: Request) {
  // Verify cron secret using constant-time comparison (Vercel sets this automatically for cron routes)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || !timingSafeSecretEqual(authHeader, `Bearer ${cronSecret}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rawIp = request.headers.get('x-forwarded-for') ?? 'cron';
  const ip = rawIp.split(',')[0].trim() || 'cron';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const start = Date.now();
  const jobResults: Record<string, string[]> = {};

  try {
    // Run all 3 jobs sequentially (to avoid overwhelming the DB)
    jobResults.silent_sites = await checkSilentSites();
    jobResults.due_date_warnings = await checkDueDateWarnings();
    jobResults.weekly_reports = await autoGenerateWeeklyReports();

    return NextResponse.json({
      status: 'ok',
      latencyMs: Date.now() - start,
      timestamp: new Date().toISOString(),
      jobs: jobResults,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: 'error',
        latencyMs: Date.now() - start,
        timestamp: new Date().toISOString(),
        error: err?.message || 'Scheduled tasks failed',
        jobs: jobResults,
      },
      { status: 500 }
    );
  }
}
