'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  BarChart3, LayoutDashboard, GanttChartSquare, Split, ClipboardList,
  FileSpreadsheet, ChevronLeft, TrendingUp, CalendarDays, CheckCircle2,
  ShieldCheck, XCircle, Clock, AlertTriangle, Filter, Search, Loader2,
  Calendar, Check, Activity, Timer, ArrowUpRight,
} from 'lucide-react';
import { ProjectService } from '@/lib/services/project.service';
import { DailyProgressService } from '@/lib/services/dailyProgress.service';
import { NotificationService } from '@/lib/services/notification.service';
import { Project } from '@/types';
import { DailyProgress } from '@/types/planning';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/lib/stores/useAuthStore';
import { useProjectStore } from '@/lib/stores/useProjectStore';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';

const SCurveChart = dynamic(() => import('@/components/planning/SCurveChart'), { ssr: false });

const fmtEGP = (v: number, isAr: boolean = true) => {
  try {
    return new Intl.NumberFormat(isAr ? 'ar-EG-u-nu-latn' : 'en-EG', {
      notation: v >= 10_000_000 ? 'compact' : 'standard',
      maximumFractionDigits: 1,
    }).format(v || 0);
  } catch {
    return String(v || 0);
  }
};

const fmtDate = (d?: string | null, isAr: boolean = true) => {
  if (!d) return '—';
  try {
    return new Intl.DateTimeFormat(isAr ? 'ar-EG-u-nu-latn' : 'en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(d));
  } catch {
    return d || '—';
  }
};

const fmtShort = (d?: string | null, isAr: boolean = true) => {
  if (!d) return '—';
  try {
    return new Intl.DateTimeFormat(isAr ? 'ar-EG-u-nu-latn' : 'en-US', {
      day: '2-digit',
      month: 'short',
    }).format(new Date(d));
  } catch {
    return d || '—';
  }
};

const fmtItemCount = (count: number, isAr: boolean = true) => {
  if (!isAr) {
    if (count === 0) return 'No items';
    if (count === 1) return '1 item';
    return `${count} items`;
  }
  if (count === 0) return 'لا توجد بنود';
  if (count === 1) return 'بند واحد';
  if (count === 2) return 'بندان';
  if (count >= 3 && count <= 10) return `${count} بنود`;
  return `${count} بنداً`;
};

const STATUS_META: Record<string, { labelAr: string; labelEn: string; dot: string; chip: string }> = {
  working: { labelAr: 'قيد التنفيذ', labelEn: 'In Progress', dot: 'bg-blue-500', chip: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900' },
  finished: { labelAr: 'مكتمل', labelEn: 'Completed', dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900' },
  on_hold: { labelAr: 'متوقف مؤقتاً', labelEn: 'On Hold', dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900' },
  handing_over: { labelAr: 'تحت التسليم', labelEn: 'Handover', dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-950' },
  cancelled: { labelAr: 'ملغي', labelEn: 'Cancelled', dot: 'bg-rose-400', chip: 'bg-rose-50 text-rose-500 border-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900' },
};

/** Loose optional fields that may be present on project rows (legacy/view columns). */
interface ProjectExtras {
  project_name?: string;
  project_code?: string;
  completion_pct?: number | string | null;
  planned_start_date?: string | null;
  planned_finish_date?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}
const ext = (p: object): ProjectExtras => p as ProjectExtras;

export default function PlanningDashboardPage() {
  const { locale } = useLanguage();
  const isAr = locale !== 'en';
  const { user } = useAuth();
  const { activeProjectId, setActiveProjectId } = useProjectStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(activeProjectId || '');

  // Progress tracking state
  const [projectProgress, setProjectProgress] = useState(0);
  const [pendingReports, setPendingReports] = useState<DailyProgress[]>([]);
  const [scurveData, setScurveData] = useState<{ date: string; actual: number; verified: number; planned?: number }[]>([]);
  const [progressLoading, setProgressLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState<{ reportId: string; taskName: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Two-way sync: synchronize when store activeProjectId changes externally
  useEffect(() => {
    if (activeProjectId && activeProjectId !== selectedProjectId) {
      setSelectedProjectId(activeProjectId);
    }
  }, [activeProjectId, selectedProjectId]);

  // Load projects and handle initial active project sync
  useEffect(() => {
    ProjectService.getProjects()
      .then((p) => {
        setProjects(p);
        const currentActive = useProjectStore.getState().activeProjectId;
        if (currentActive && p.some((pr) => pr.id === currentActive)) {
          setSelectedProjectId(currentActive);
        } else {
          // Auto-select first working project and sync to store
          const working = p.find((pr) => pr.status === 'working') || p[0];
          if (working) {
            setSelectedProjectId(working.id);
            setActiveProjectId(working.id);
          }
        }
      })
      .catch(() => toast?.error?.(isAr ? 'فشل تحميل المشاريع' : 'Failed to load projects'))
      .finally(() => setLoading(false));
  }, [isAr, setActiveProjectId]);

  // Handler for project selection with two-way store synchronization
  const handleProjectChange = useCallback((projectId: string) => {
    setSelectedProjectId(projectId);
    setActiveProjectId(projectId);
  }, [setActiveProjectId]);

  // Load progress data when project changes
  useEffect(() => {
    if (!selectedProjectId) return;
    setProgressLoading(true);
    Promise.all([
      DailyProgressService.calculateProjectProgress(selectedProjectId),
      DailyProgressService.getPendingProgressReports(selectedProjectId),
      DailyProgressService.getProgressTimeline(selectedProjectId),
    ])
      .then(([progress, pending, timeline]) => {
        setProjectProgress(progress);
        setPendingReports(pending);
        setScurveData(timeline);
      })
      .catch(() => toast?.error?.('فشل تحميل بيانات التقدم'))
      .finally(() => setProgressLoading(false));
  }, [selectedProjectId]);

  // Modal keyboard accessibility
  useEffect(() => {
    if (!rejectModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !actionLoading) {
        setRejectModal(null);
        setRejectReason('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rejectModal, actionLoading]);

  const active = useMemo(
    () => projects.filter((p) => p.status === 'working' || p.status === 'handing_over'),
    [projects]
  );

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId),
    [projects, selectedProjectId]
  );

  const totals = useMemo(() => {
    const value = active.reduce((s, p) => s + Number(p.contract_value || 0), 0);
    const avgCompletion = active.length
      ? Math.round(active.reduce((s, p) => s + Number(ext(p).completion_pct ?? 0), 0) / active.length)
      : 0;
    return { value, avgCompletion };
  }, [active]);

  const timelineStats = useMemo(() => {
    if (!selectedProject) return null;
    const start = selectedProject.start_date || ext(selectedProject).planned_start_date;
    const end = selectedProject.end_date || ext(selectedProject).planned_finish_date;

    let totalDays = 0;
    let elapsedDays = 0;
    let remainingDays = 0;
    let timeElapsedPct = 0;

    if (start && end) {
      const startTime = new Date(start).getTime();
      const endTime = new Date(end).getTime();
      const now = new Date().getTime();

      totalDays = Math.max(1, Math.round((endTime - startTime) / (1000 * 60 * 60 * 24)));
      if (now >= startTime) {
        elapsedDays = Math.min(totalDays, Math.round((now - startTime) / (1000 * 60 * 60 * 24)));
        remainingDays = Math.max(0, Math.round((endTime - now) / (1000 * 60 * 60 * 24)));
        timeElapsedPct = Math.min(100, Math.round((elapsedDays / totalDays) * 100));
      } else {
        remainingDays = totalDays;
        timeElapsedPct = 0;
      }
    }

    const latestScurve = scurveData.length > 0 ? scurveData[scurveData.length - 1] : null;
    const actualProgress = projectProgress;
    const verifiedProgress = latestScurve?.verified ?? 0;
    const scheduleVariance = actualProgress - timeElapsedPct;
    const scheduleStatus: 'ahead' | 'on_track' | 'delayed' =
      scheduleVariance >= 2 ? 'ahead' :
      scheduleVariance >= -5 ? 'on_track' : 'delayed';

    return {
      start,
      end,
      totalDays,
      elapsedDays,
      remainingDays,
      timeElapsedPct,
      actualProgress,
      verifiedProgress,
      scheduleVariance,
      scheduleStatus,
    };
  }, [selectedProject, scurveData, projectProgress]);

  const handleVerify = useCallback(async (reportId: string) => {
    if (!user?.id) return;
    setActionLoading(reportId);
    try {
      const result = await DailyProgressService.verifyProgress(reportId, 'verify', user.id);
      if (result.success) {
        toast.success('تم اعتماد نسبة الإنجاز بنجاح');
        const report = pendingReports.find((r) => r.id === reportId);
        setPendingReports((prev) => prev.filter((r) => r.id !== reportId));
        // Recalculate project progress
        const newProgress = await DailyProgressService.calculateProjectProgress(selectedProjectId);
        setProjectProgress(newProgress);
        // Refresh S-Curve
        const timeline = await DailyProgressService.getProgressTimeline(selectedProjectId);
        setScurveData(timeline);

        // Notify site engineer
        if (report?.entered_by) {
          await NotificationService.createNotification({
            recipient_user_id: report.entered_by,
            project_id: selectedProjectId,
            event_type: 'progress_verified',
            entity_type: 'daily_progress',
            entity_id: reportId,
            title_ar: `اعتماد نسبة الإنجاز: تقرير #${report.report_no || '—'}`,
            body_ar: `قام مهندس التخطيط باعتماد نسبة الإنجاز المسجلة في التقرير`,
            link_url: '/site-workspace',
          });
        }
      } else {
        toast.error(result.error || 'فشل الاعتماد');
      }
    } catch {
      toast.error('حدث خطأ أثناء تنفيذ الاعتماد');
    }
    setActionLoading(null);
  }, [user?.id, selectedProjectId, pendingReports]);

  const handleReject = useCallback(async () => {
    if (!rejectModal || !user?.id || !rejectReason.trim()) return;
    setActionLoading(rejectModal.reportId);
    try {
      const result = await DailyProgressService.verifyProgress(
        rejectModal.reportId, 'reject', user.id, rejectReason.trim()
      );
      if (result.success) {
        toast.success('تم رفض التقرير وإرسال الإشعار');
        setPendingReports((prev) => prev.filter((r) => r.id !== rejectModal.reportId));
        // Send notification to site engineer
        const report = pendingReports.find((r) => r.id === rejectModal.reportId);
        if (report?.entered_by) {
          await NotificationService.createNotification({
            recipient_user_id: report.entered_by,
            project_id: selectedProjectId,
            event_type: 'progress_rejected',
            entity_type: 'daily_progress',
            entity_id: rejectModal.reportId,
            title_ar: `رفض نسبة الإنجاز: ${rejectModal.taskName}`,
            body_ar: `السبب: ${rejectReason.trim()}`,
            link_url: '/site-workspace',
          });
        }
      } else {
        toast.error(result.error || 'فشل الرفض');
      }
    } catch {
      toast.error('حدث خطأ أثناء تنفيذ الرفض');
    }
    setActionLoading(null);
    setRejectModal(null);
    setRejectReason('');
  }, [rejectModal, user?.id, rejectReason, selectedProjectId, pendingReports]);

  const tools = useMemo(() => [
    {
      href: '/planning/activities',
      icon: ClipboardList,
      title: isAr ? 'أنشطة المشاريع' : 'Project Activities',
      desc: isAr
        ? 'الأنشطة المعتمدة وهيكل تجزئة العمل وتوزيعها على المشاريع'
        : 'Approved activities, WBS structure and project allocation',
      category: isAr ? 'هيكل تجزئة العمل' : 'WBS Structure',
    },
    {
      href: '/planning/baseline',
      icon: GanttChartSquare,
      title: isAr ? 'الجدول الزمني وخط الأساس' : 'Baseline & Schedule',
      desc: isAr
        ? 'استيراد ملفات البرامج الزمنية ومنحنى خط الأساس المعتمد'
        : 'Import schedule files and approved baseline curve',
      category: isAr ? 'البرنامج الزمني والأساس' : 'Primavera & Baseline',
    },
    {
      href: '/planning/daily-progress',
      icon: CalendarDays,
      title: isAr ? 'التقدم اليومي ورصد الموقع' : 'Daily Progress & Field Tracking',
      desc: isAr
        ? 'مراجعة واعتماد تقارير مهندسي التنفيذ ونسب الإنجاز'
        : 'Review and verify field engineers reports and completion rates',
      category: isAr ? 'الرصد الميداني' : 'Field Tracking',
    },
    {
      href: '/planning/allocation',
      icon: Split,
      title: isAr ? 'توزيع الكميات وجداول المقايسة' : 'Quantity Allocation & BOQ',
      desc: isAr
        ? 'ربط التنفيذ اليومي بالأنشطة وبنود المقايسة والتكاليف'
        : 'Link daily execution with activities, BOQ items and costs',
      category: isAr ? 'جداول المقايسة' : 'BOQ Allocation',
    },
  ], [isAr]);

  return (
    <div className="p-3 sm:p-5 lg:p-6 space-y-6 max-w-[1750px] w-full mx-auto text-start" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20 shrink-0">
            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {isAr ? 'لوحة التخطيط وإدارة القيمة المكتسبة' : 'Planning & Earned Value Dashboard'}
              </h1>
              <span className="text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
                {isAr ? 'منحنى الإنجاز وخط الأساس' : 'S-Curve & Baseline'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {isAr
                ? 'متابعة المنحنى التراكمي · مؤشرات الأداء الزمني والتكلفة · اعتماد تقارير الإنجاز اليومية'
                : 'Cumulative progress tracking · Schedule & cost indices · Daily progress verification'}
            </p>
          </div>
        </div>

        {/* Project selector */}
        <div className="flex flex-wrap items-center gap-2.5 self-stretch lg:self-auto w-full lg:w-auto">
          <label htmlFor="planning-project-select" className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>{isAr ? 'المشروع:' : 'Project:'}</span>
          </label>
          <div className="relative flex-1 lg:w-80">
            <select
              id="planning-project-select"
              aria-label={isAr ? 'اختر المشروع لعرض لوحة التخطيط' : 'Select project for planning dashboard'}
              value={selectedProjectId}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="w-full text-xs bg-slate-50/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all cursor-pointer shadow-2xs"
            >
              <option value="">{isAr ? 'اختر مشروعاً للمتابعة…' : 'Select a project…'}</option>
              {active.map((p) => (
                <option key={p.id} value={p.id}>
                  {ext(p).project_name || (isAr ? p.name_ar : (p.name_en || p.name_ar)) || p.code}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {loading
          ? Array.from({ length: 5 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 animate-pulse space-y-3 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                </div>
                <div className="h-7 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-2.5 w-28 bg-slate-100 dark:bg-slate-800 rounded" />
              </div>
            ))
          : [
              {
                label: isAr ? 'المشاريع الجارية' : 'Active Projects',
                value: String(active.length),
                unit: isAr ? 'مشروع' : 'projects',
                subtext: isAr ? 'مشاريع قيد التنفيذ والتسليم' : 'In execution & handover',
                icon: LayoutDashboard,
                tone: 'text-blue-600 dark:text-blue-400',
                bg: 'bg-blue-50 dark:bg-blue-950/50',
                border: 'border-blue-100 dark:border-blue-900/60',
              },
              {
                label: isAr ? 'قيمة العقود الجارية' : 'Active Contracts Value',
                value: fmtEGP(totals.value, isAr),
                unit: isAr ? 'ج.م' : 'EGP',
                subtext: isAr ? 'إجمالي قيمة العقود النشطة' : 'Total active contract sum',
                icon: TrendingUp,
                tone: 'text-emerald-600 dark:text-emerald-400',
                bg: 'bg-emerald-50 dark:bg-emerald-950/50',
                border: 'border-emerald-100 dark:border-emerald-900/60',
              },
              {
                label: isAr ? 'متوسط الإنجاز العام' : 'Average Overall Progress',
                value: `${totals.avgCompletion}%`,
                subtext: isAr ? 'عبر كافة المشاريع النشطة' : 'Across all active projects',
                icon: CheckCircle2,
                tone: 'text-sky-600 dark:text-sky-400',
                bg: 'bg-sky-50 dark:bg-sky-950/50',
                border: 'border-sky-100 dark:border-sky-900/60',
              },
              {
                label: isAr ? 'إنجاز المشروع المحدد' : 'Selected Project Progress',
                value: progressLoading ? '…' : `${projectProgress.toFixed(1)}%`,
                isLoading: progressLoading,
                subtext: selectedProject
                  ? (ext(selectedProject).project_name || (isAr ? selectedProject.name_ar : (selectedProject.name_en || selectedProject.name_ar)))
                  : (isAr ? 'يرجى اختيار مشروع' : 'Select a project'),
                icon: BarChart3,
                tone: 'text-teal-600 dark:text-teal-400',
                bg: 'bg-teal-50 dark:bg-teal-950/50',
                border: 'border-teal-100 dark:border-teal-900/60',
              },
              {
                label: isAr ? 'تقارير تنتظر الاعتماد' : 'Pending Verification',
                value: String(pendingReports.length),
                subtext: pendingReports.length > 0
                  ? (isAr ? 'تتطلب مراجعة واعتماد المخطط' : 'Requires planner review')
                  : (isAr ? 'كافة التقارير معتمدة' : 'All reports verified'),
                icon: Clock,
                tone: pendingReports.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500',
                bg: pendingReports.length > 0 ? 'bg-amber-50 dark:bg-amber-950/50' : 'bg-slate-50 dark:bg-slate-800/40',
                border: pendingReports.length > 0 ? 'border-amber-200 dark:border-amber-900/60' : 'border-slate-100 dark:border-slate-800',
                hasAlert: pendingReports.length > 0,
              },
            ].map((k) => (
              <div
                key={k.label}
                className={`rounded-2xl border p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group ${
                  k.hasAlert
                    ? 'border-amber-200 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-tight">
                      {k.label}
                    </span>
                    <div className={`p-2 rounded-xl border ${k.bg} ${k.tone} ${k.border} group-hover:scale-105 transition-transform shrink-0`}>
                      <k.icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1.5 text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                    {k.isLoading ? (
                      <div className="h-7 w-20 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                    ) : (
                      <>
                        <bdi dir="ltr">{k.value}</bdi>
                        {k.unit && (
                          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                            {k.unit}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/60 text-[10px] text-slate-400 flex items-center gap-1.5 truncate">
                  {k.hasAlert ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 animate-ping" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                  )}
                  <span className="truncate">{k.subtext}</span>
                </div>
              </div>
            ))}
      </div>

      {/* ══════════════════════════════════════════════════════════
          PROJECT TIMELINE & PROGRESS MILESTONES (ITEM 1)
         ══════════════════════════════════════════════════════════ */}
      {selectedProjectId && selectedProject && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <CalendarDays className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {isAr ? 'الجدول الزمني ومؤشرات الإنجاز:' : 'Timeline & Progress Indicators:'} {ext(selectedProject).project_name || (isAr ? selectedProject.name_ar : (selectedProject.name_en || selectedProject.name_ar))}
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    <bdi>{ext(selectedProject).project_code || selectedProject.code}</bdi>
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {isAr ? 'رصد المدى الزمني ومقارنة نسبة الإنجاز الفعلي مقابل المخطط التراكمي' : 'Track schedule variance and compare actual progress against baseline curve'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              {timelineStats && (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                  timelineStats.scheduleStatus === 'ahead'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                    : timelineStats.scheduleStatus === 'on_track'
                    ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                    : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    timelineStats.scheduleStatus === 'ahead' ? 'bg-emerald-500' :
                    timelineStats.scheduleStatus === 'on_track' ? 'bg-blue-500' : 'bg-amber-500'
                  }`} />
                  {timelineStats.scheduleStatus === 'ahead'
                    ? (isAr ? 'متقدم عن الجدول' : 'Ahead of Schedule')
                    : timelineStats.scheduleStatus === 'on_track'
                    ? (isAr ? 'متوافق مع الجدول' : 'On Track')
                    : (isAr ? 'متأخر عن الجدول' : 'Behind Schedule')}
                </span>
              )}

              <Link
                href="/planning/baseline"
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                aria-label={isAr ? 'الانتقال إلى شاشة الجدول الزمني وخط الأساس' : 'Navigate to baseline schedule'}
              >
                <span>{isAr ? 'الجدول الزمني التفصيلي' : 'Detailed Baseline'}</span>
                <ChevronLeft className={`w-3.5 h-3.5 ${isAr ? '' : 'rotate-180'}`} />
              </Link>
            </div>
          </div>

          {/* Timeline Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Start Date */}
            <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 block mb-1">
                {isAr ? 'تاريخ البدء المخطط' : 'Planned Start'}
              </span>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                <bdi>{fmtDate(timelineStats?.start, isAr)}</bdi>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {timelineStats?.elapsedDays ? (isAr ? `منقضٍ ${timelineStats.elapsedDays} يوم` : `${timelineStats.elapsedDays}d elapsed`) : '—'}
              </div>
            </div>

            {/* Target Finish */}
            <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 block mb-1">
                {isAr ? 'تاريخ الانتهاء المخطط' : 'Planned Finish'}
              </span>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                <bdi>{fmtDate(timelineStats?.end, isAr)}</bdi>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {timelineStats?.remainingDays !== undefined ? (isAr ? `متبقٍ ${timelineStats.remainingDays} يوم` : `${timelineStats.remainingDays}d remaining`) : '—'}
              </div>
            </div>

            {/* Time Elapsed */}
            <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-slate-400">
                  {isAr ? 'الزمن المنقضي' : 'Time Elapsed'}
                </span>
                <bdi className="text-[11px] font-bold text-slate-700 dark:text-slate-300 tabular-nums" dir="ltr">
                  {timelineStats?.timeElapsedPct ?? 0}%
                </bdi>
              </div>
              <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-slate-400 dark:bg-slate-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(timelineStats?.timeElapsedPct ?? 0, 100)}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-400 mt-1.5 flex justify-between">
                <span>{isAr ? 'إجمالي المدة:' : 'Total Duration:'}</span>
                <bdi className="tabular-nums font-mono">{timelineStats?.totalDays || 0} {isAr ? 'يوم' : 'days'}</bdi>
              </div>
            </div>

            {/* Actual vs Planned Delta */}
            <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 block mb-1">
                {isAr ? 'فارق الإنجاز الزمني' : 'Schedule Variance'}
              </span>
              <div className="flex items-center gap-1.5">
                <bdi className={`text-sm font-black tabular-nums ${
                  (timelineStats?.scheduleVariance ?? 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                }`} dir="ltr">
                  {(timelineStats?.scheduleVariance ?? 0) > 0 ? '+' : ''}
                  {(timelineStats?.scheduleVariance ?? 0).toFixed(1)}%
                </bdi>
                <span className="text-[10px] text-slate-400">
                  {(timelineStats?.scheduleVariance ?? 0) >= 0 ? (isAr ? 'فائض في التقدم' : 'Ahead') : (isAr ? 'تراجع نسبي' : 'Behind')}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {isAr ? 'الفعلي' : 'Actual'} ({projectProgress.toFixed(1)}%) {isAr ? 'مقابل الزمني' : 'vs Time'} ({timelineStats?.timeElapsedPct ?? 0}%)
              </div>
            </div>
          </div>

          {/* Overall Progress Bar */}
          <div className="pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isAr ? 'نسبة الإنجاز الكلية للمشروع' : 'Overall Project Progress'}
                </h3>
                <span className="text-[10px] text-slate-400">
                  {isAr ? '(محسوبة من بنود الأنشطة والكميات المعتمدة)' : '(Calculated from activities and verified quantities)'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {pendingReports.length > 0 && (
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {pendingReports.length} {isAr ? 'تقارير تنتظر الاعتماد' : 'pending reports'}
                  </span>
                )}
                <bdi className="text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums" dir="ltr">
                  {progressLoading ? '…' : `${projectProgress.toFixed(1)}%`}
                </bdi>
              </div>
            </div>

            {progressLoading ? (
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden animate-pulse">
                <div className="h-full bg-slate-200 dark:bg-slate-700 w-1/2" />
              </div>
            ) : (
              <div
                className="relative h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={Math.round(projectProgress)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={isAr ? 'نسبة إنجاز المشروع الكلية' : 'Total project completion rate'}
              >
                <div
                  className="absolute inset-y-0 right-0 bg-gradient-to-l from-emerald-500 to-teal-400 rounded-full transition-all duration-700 shadow-xs"
                  style={{ width: `${Math.min(projectProgress, 100)}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          APPROVAL QUEUE — Pending Reports (ITEM 3 & 4)
         ══════════════════════════════════════════════════════════ */}
      {selectedProjectId && pendingReports.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200/80 dark:border-amber-900/60 overflow-hidden shadow-xs">
          <div className="px-4 py-3.5 border-b border-amber-100 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <h2 className="text-xs sm:text-sm font-bold text-amber-800 dark:text-amber-300">
                {isAr ? `تقارير تنتظر الاعتماد (${pendingReports.length})` : `Pending Verification Reports (${pendingReports.length})`}
              </h2>
            </div>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              {isAr ? 'يتطلب اعتماد مهندس التخطيط لتحديث منحنى الإنجاز التراكمي' : 'Requires planner verification to update progress curve'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start min-w-[640px]">
              <caption className="sr-only">
                {isAr ? 'تقارير التقدم اليومي بانتظار الاعتماد' : 'Pending daily progress reports'}
              </caption>
              <thead>
                <tr className="bg-slate-50/70 dark:bg-slate-950/40 text-slate-400 text-[10px] border-b border-slate-100 dark:border-slate-800">
                  <th scope="col" className="px-4 py-3 font-bold text-start">{isAr ? 'رقم التقرير' : 'Report No.'}</th>
                  <th scope="col" className="px-3 py-3 font-bold text-start">{isAr ? 'مهندس الموقع' : 'Site Engineer'}</th>
                  <th scope="col" className="px-3 py-3 font-bold text-start">{isAr ? 'التخصص' : 'Discipline'}</th>
                  <th scope="col" className="px-3 py-3 font-bold text-start">{isAr ? 'تاريخ الرصد' : 'Date'}</th>
                  <th scope="col" className="px-3 py-3 font-bold text-start">{isAr ? 'حجم الأعمال' : 'Scope Size'}</th>
                  <th scope="col" className="px-3 py-3 font-bold text-center">{isAr ? 'إجراء الاعتماد' : 'Verification Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {pendingReports.map((report) => {
                  const lineCount = report.lines?.length || 0;
                  const isProcessing = actionLoading === report.id;
                  const isAnyActionRunning = actionLoading !== null;

                  return (
                    <tr key={report.id} className="hover:bg-amber-50/30 dark:hover:bg-amber-950/30 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-100">
                        <bdi className="font-mono" dir="ltr">#{report.report_no || '—'}</bdi>
                      </td>
                      <td className="px-3 py-3 text-slate-700 dark:text-slate-300 font-medium">
                        {report.entered_by_name || '—'}
                      </td>
                      <td className="px-3 py-3 text-slate-500 dark:text-slate-400">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-300">
                          {report.discipline || (isAr ? 'عام' : 'General')}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-500 dark:text-slate-400 tabular-nums">
                        <bdi>{fmtShort(report.progress_date, isAr)}</bdi>
                      </td>
                      <td className="px-3 py-3 text-slate-500 dark:text-slate-400 tabular-nums">
                        {fmtItemCount(lineCount, isAr)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          <button
                            onClick={() => handleVerify(report.id)}
                            disabled={isAnyActionRunning}
                            aria-label={isAr ? `اعتماد تقرير رقم ${report.report_no || '—'}` : `Verify report ${report.report_no || '—'}`}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-xs focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none focus-visible:ring-offset-2"
                          >
                            {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                            {isAr ? 'اعتماد' : 'Verify'}
                          </button>
                          <button
                            onClick={() => setRejectModal({ reportId: report.id, taskName: isAr ? `تقرير #${report.report_no || '—'}` : `Report #${report.report_no || '—'}` })}
                            disabled={isAnyActionRunning}
                            aria-label={isAr ? `رفض تقرير رقم ${report.report_no || '—'}` : `Reject report ${report.report_no || '—'}`}
                            className="px-3 py-1.5 rounded-lg bg-rose-500 text-white text-[11px] font-bold hover:bg-rose-600 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-xs focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none focus-visible:ring-offset-2"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            {isAr ? 'رفض' : 'Reject'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          S-CURVE CHART (ITEM 1 & 2)
         ══════════════════════════════════════════════════════════ */}
      {selectedProjectId && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-3" role="region" aria-label={isAr ? 'منحنى التقدم التراكمي والقيمة المكتسبة' : 'Cumulative progress and earned value curve'}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                {isAr ? 'منحنى القيمة المكتسبة ومسار الإنجاز التراكمي — المخطط مقابل الفعلي' : 'Earned Value & Cumulative Progress (S-Curve) — Planned vs Actual'}
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isAr ? 'تتبع مسار الإنجاز التراكمي الفعلي المسجل من الموقع ومقارنته بالاعتماد الرسمي' : 'Track cumulative site progress and compare with verified milestones'}
              </p>
            </div>

            {/* Summary metrics strip */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 text-[11px] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-slate-500 dark:text-slate-400">{isAr ? 'الفعلي:' : 'Actual:'}</span>
                <bdi className="font-bold text-emerald-700 dark:text-emerald-300 tabular-nums" dir="ltr">
                  {projectProgress.toFixed(1)}%
                </bdi>
              </div>

              <div className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 text-[11px] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-slate-500 dark:text-slate-400">{isAr ? 'المعتمد:' : 'Verified:'}</span>
                <bdi className="font-bold text-blue-700 dark:text-blue-300 tabular-nums" dir="ltr">
                  {timelineStats?.verifiedProgress ? `${timelineStats.verifiedProgress.toFixed(1)}%` : '—'}
                </bdi>
              </div>

              {scurveData.length > 0 && (
                <div className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  {scurveData.length} {isAr ? 'نقطة رصد' : 'points'}
                </div>
              )}
            </div>
          </div>

          <SCurveChart data={scurveData} loading={progressLoading} />
        </div>
      )}

      {/* Active projects mini-table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
              {isAr ? 'المشاريع الجارية ومعدلات الإنجاز' : 'Active Projects & Progress Rates'}
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isAr ? 'نظرة عامة على حالة المشاريع قيد التنفيذ والتسليم' : 'Overview of projects in execution and handover status'}
            </p>
          </div>
          <Link
            href="/projects/dashboard"
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 cursor-pointer focus-visible:underline focus-visible:outline-none"
          >
            <span>{isAr ? 'عرض كافة المشاريع' : 'All Projects'}</span>
            <ChevronLeft className={`w-4 h-4 ${isAr ? '' : 'rotate-180'}`} />
          </Link>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between gap-4 py-2 border-b border-slate-100 dark:border-slate-800 animate-pulse">
                <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
            ))}
          </div>
        ) : active.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            {isAr ? 'لا توجد مشاريع جارية حالياً' : 'No active projects currently'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start min-w-[640px]">
              <caption className="sr-only">
                {isAr ? 'قائمة المشاريع الجارية ومعدلات الإنجاز' : 'List of active projects and progress rates'}
              </caption>
              <thead>
                <tr className="bg-slate-50/70 dark:bg-slate-950/40 text-slate-400 text-[10px] border-b border-slate-100 dark:border-slate-800">
                  <th scope="col" className="px-4 py-3 font-bold text-start">{isAr ? 'المشروع' : 'Project'}</th>
                  <th scope="col" className="px-3 py-3 font-bold text-start">{isAr ? 'الحالة' : 'Status'}</th>
                  <th scope="col" className="px-3 py-3 font-bold text-start">{isAr ? 'القيمة التعاقدية (ج.م)' : 'Contract Value (EGP)'}</th>
                  <th scope="col" className="px-3 py-3 font-bold text-start">{isAr ? 'البداية المخططة' : 'Planned Start'}</th>
                  <th scope="col" className="px-3 py-3 font-bold text-start">{isAr ? 'النهاية المخططة' : 'Planned Finish'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {active.slice(0, 8).map((p) => {
                  const meta = STATUS_META[p.status] || STATUS_META.working;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          href={`/projects/${p.id}`}
                          className="font-bold text-slate-800 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer focus-visible:outline-none focus-visible:underline"
                        >
                          {ext(p).project_name || (isAr ? p.name_ar : (p.name_en || p.name_ar))}
                        </Link>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          <bdi>{ext(p).project_code || p.code}</bdi>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-bold ${meta.chip}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                          {isAr ? meta.labelAr : meta.labelEn}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-700 dark:text-slate-300 font-semibold">
                        <bdi className="tabular-nums" dir="ltr">{fmtEGP(Number(p.contract_value || 0), isAr)}</bdi>
                      </td>
                      <td className="px-3 py-3 text-slate-500 dark:text-slate-400 tabular-nums">
                        <bdi>{fmtDate(ext(p).start_date, isAr)}</bdi>
                      </td>
                      <td className="px-3 py-3 text-slate-500 dark:text-slate-400 tabular-nums">
                        <bdi>{fmtDate(ext(p).end_date, isAr)}</bdi>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Planning tools grid (ITEM 1) */}
      <div className="space-y-2.5">
        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400">
          {isAr ? 'أدوات إدارة التخطيط والجدول الزمني' : 'Planning & Schedule Management Tools'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {tools.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              aria-label={isAr ? `الانتقال إلى ${t.title}` : `Navigate to ${t.title}`}
              className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 hover:border-emerald-400 dark:hover:border-emerald-700 hover:shadow-md transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none focus-visible:ring-offset-2 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                    <t.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    {t.category}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {t.title}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  {t.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <span>{isAr ? 'فتح الوحدة' : 'Open Module'}</span>
                <ChevronLeft className={`w-4 h-4 text-emerald-500 group-hover:-translate-x-1 transition-transform ${isAr ? '' : 'rotate-180'}`} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          REJECTION MODAL (ITEM 3 & 4)
         ══════════════════════════════════════════════════════════ */}
      {rejectModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
          onClick={() => {
            if (!actionLoading) {
              setRejectModal(null);
              setRejectReason('');
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-modal-title"
          aria-describedby="reject-modal-desc"
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-5 space-y-4"
            dir={isAr ? 'rtl' : 'ltr'}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 border border-rose-100 dark:border-rose-900 shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 id="reject-modal-title" className="text-sm font-bold text-slate-800 dark:text-white">
                  {isAr ? `رفض ${rejectModal.taskName}` : `Reject ${rejectModal.taskName}`}
                </h3>
                <p id="reject-modal-desc" className="text-[11px] text-slate-400 mt-0.5">
                  {isAr
                    ? 'يرجى توضيح سبب الرفض بالتفصيل — سيتم إرساله كإشعار رسمي لمهندس الموقع لإعادة التدقيق'
                    : 'Please provide the rejection reason in detail — this will be sent as a notice to the site engineer'}
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="reject-reason-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAr ? 'سبب الرفض والملاحظات التصحيحية' : 'Rejection Reason & Required Notes'} <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="reject-reason-input"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={isAr ? 'اكتب سبب الرفض والملاحظات المطلوبة لتصحيح التقرير…' : 'Write the reason for rejection and required corrections…'}
                rows={3}
                aria-required="true"
                disabled={actionLoading !== null}
                className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 resize-none transition-all"
                autoFocus
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setRejectModal(null);
                  setRejectReason('');
                }}
                disabled={actionLoading !== null}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={!rejectReason.trim() || actionLoading === rejectModal.reportId}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none focus-visible:ring-offset-2"
              >
                {actionLoading === rejectModal.reportId ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{isAr ? 'جاري إرسال الرفض…' : 'Submitting rejection…'}</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5" />
                    <span>{isAr ? 'تأكيد الرفض والإشعار' : 'Confirm Rejection'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
