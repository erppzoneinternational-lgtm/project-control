'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Building2,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Radio,
  FileText,
  ChevronRight,
  ChevronLeft,
  ArrowUpRight,
  ShieldAlert,
  Flame,
  BarChart3,
  PieChart as PieChartIcon,
  Filter,
  Check,
  Calendar,
  Sparkles,
  Layers,
  Activity,
  ArrowRight,
  RefreshCw,
  BellRing,
  ExternalLink,
  ShieldCheck,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from 'recharts';

export interface ProjectSummaryItem {
  id: string;
  project_name?: string;
  project_code?: string;
  name_ar?: string;
  name_en?: string;
  code?: string;
  [key: string]: any;
}

export interface CooSummaryViewProps {
  projects: { id: string; project_name: string; project_code: string }[] | ProjectSummaryItem[] | any[];
  selectedProjectId?: string;
  onSelectProject: (projectId: string) => void;
  onCardClick?: (type: string, id: string) => void;
  onNavigateTab?: (tab: any) => void;
  onOpenReport?: (reportId: string) => void;
  onOpenTask?: (taskId: string) => void;
  onOpenDeliverable?: (deliverableId: string) => void;
  onOpenInspection?: (inspectionId: string) => void;
  className?: string;
}

interface ProjectStatusBreakdown {
  completed: number;
  inProgress: number;
  pendingReview: number;
  blocked: number;
  total: number;
  onTimeRate: number;
  silentHours: number;
  isSilent: boolean;
  weeklyReady: boolean;
}

interface AlertItem {
  id: string;
  type: 'overdue_report' | 'pending_submission' | 'compliance' | 'blocker' | 'weekly_ready';
  severity: 'critical' | 'warning' | 'success' | 'info';
  priorityLevel: 'P1' | 'P2' | 'P3' | 'P4';
  priorityLabel: string;
  categoryText: string;
  title: string;
  subtitle: string;
  projectId: string;
  projectName: string;
  projectCode: string;
  timestamp: string;
  targetId: string;
  ownerName: string;
  actionLabel: string;
}

export const CooSummaryView: React.FC<CooSummaryViewProps> = ({
  projects,
  selectedProjectId,
  onSelectProject,
  onCardClick,
  onNavigateTab,
  onOpenReport,
  onOpenTask,
  onOpenDeliverable,
  onOpenInspection,
  className = '',
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter'>('week');
  const [activeAlertFilter, setActiveAlertFilter] = useState<'all' | 'critical' | 'warning' | 'success'>('all');
  const [activeChartTab, setActiveChartTab] = useState<'stacked' | 'trend'>('stacked');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Keyboard navigation helper for accessible buttons and cards
  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  // Built-in preset definitions if projects list is empty or partial
  const defaultProjects: { id: string; project_name: string; project_code: string }[] = useMemo(() => [
    { id: 'prj-waha', project_name: 'مشروع الواحة السكني (Al-Waha)', project_code: 'PRJ-WAHA-01' },
    { id: 'prj-nakheel', project_name: 'مشروع أبراج النخيل (Al-Nakheel)', project_code: 'PRJ-NKH-02' },
    { id: 'prj-murooj', project_name: 'مشروع مروج الرياض (Al-Murooj)', project_code: 'PRJ-MRJ-03' },
  ], []);

  // Normalize project list to ensure standard { id, project_name, project_code }
  const displayProjects = useMemo(() => {
    const rawList = Array.isArray(projects) ? projects : [];
    const normalized = rawList.map((p: any, idx: number) => ({
      id: String(p.id || `prj-${idx + 1}`),
      project_name: String(p.project_name || p.name_ar || p.name_en || `مشروع ${idx + 1}`),
      project_code: String(p.project_code || p.code || `PRJ-0${idx + 1}`),
    }));

    if (normalized.length >= 3) {
      return normalized.slice(0, 3);
    }
    if (normalized.length > 0) {
      const existingIds = new Set(normalized.map((p) => p.id));
      const fillers = defaultProjects.filter((p) => !existingIds.has(p.id)).slice(0, 3 - normalized.length);
      return [...normalized, ...fillers];
    }
    return defaultProjects;
  }, [projects, defaultProjects]);

  // Mocked/Calculated breakdown stats per project
  const projectStatsMap = useMemo<Record<string, ProjectStatusBreakdown>>(() => {
    const stats: Record<string, ProjectStatusBreakdown> = {
      [displayProjects[0]?.id || 'p1']: {
        completed: 48,
        inProgress: 32,
        pendingReview: 12,
        blocked: 8,
        total: 100,
        onTimeRate: 88,
        silentHours: 52, // Silent! > 48h
        isSilent: true,
        weeklyReady: false,
      },
      [displayProjects[1]?.id || 'p2']: {
        completed: 64,
        inProgress: 24,
        pendingReview: 8,
        blocked: 4,
        total: 100,
        onTimeRate: 94,
        silentHours: 12,
        isSilent: false,
        weeklyReady: true,
      },
      [displayProjects[2]?.id || 'p3']: {
        completed: 75,
        inProgress: 18,
        pendingReview: 5,
        blocked: 2,
        total: 100,
        onTimeRate: 100,
        silentHours: 6,
        isSilent: false,
        weeklyReady: true,
      },
    };
    return stats;
  }, [displayProjects]);

  // Combined Total Stats
  const combinedStats: ProjectStatusBreakdown = useMemo(() => {
    const p1 = projectStatsMap[displayProjects[0]?.id || 'p1'];
    const p2 = projectStatsMap[displayProjects[1]?.id || 'p2'];
    const p3 = projectStatsMap[displayProjects[2]?.id || 'p3'];

    const totalTasks = (p1?.total || 0) + (p2?.total || 0) + (p3?.total || 0) || 300;
    const completed = (p1?.completed || 0) + (p2?.completed || 0) + (p3?.completed || 0);
    const inProgress = (p1?.inProgress || 0) + (p2?.inProgress || 0) + (p3?.inProgress || 0);
    const pendingReview = (p1?.pendingReview || 0) + (p2?.pendingReview || 0) + (p3?.pendingReview || 0);
    const blocked = (p1?.blocked || 0) + (p2?.blocked || 0) + (p3?.blocked || 0);
    const avgOnTime = Math.round(((p1?.onTimeRate || 0) + (p2?.onTimeRate || 0) + (p3?.onTimeRate || 0)) / 3);
    const silentCount = [p1, p2, p3].filter((p) => p?.isSilent).length;

    return {
      completed,
      inProgress,
      pendingReview,
      blocked,
      total: totalTasks,
      onTimeRate: avgOnTime,
      silentHours: 0,
      isSilent: silentCount > 0,
      weeklyReady: false,
    };
  }, [displayProjects, projectStatsMap]);

  // Executive KPI summary numbers
  const kpiMetrics = useMemo(() => {
    const silentSitesCount = [
      projectStatsMap[displayProjects[0]?.id || '']?.isSilent,
      projectStatsMap[displayProjects[1]?.id || '']?.isSilent,
      projectStatsMap[displayProjects[2]?.id || '']?.isSilent,
    ].filter(Boolean).length;

    const totalBlockers = combinedStats.blocked;
    const onTimeRate = combinedStats.onTimeRate;
    const weeklyReadyCount = [
      projectStatsMap[displayProjects[0]?.id || '']?.weeklyReady,
      projectStatsMap[displayProjects[1]?.id || '']?.weeklyReady,
      projectStatsMap[displayProjects[2]?.id || '']?.weeklyReady,
    ].filter(Boolean).length;
    const weeklyReadinessPct = Math.round((weeklyReadyCount / 3) * 100);

    return {
      onTimeRate,
      totalBlockers,
      silentSitesCount,
      weeklyReadinessPct,
      weeklyReadyCount,
    };
  }, [combinedStats, displayProjects, projectStatsMap]);

  // Chart Data for Stacked Bar Comparison
  const chartStackedData = useMemo(() => {
    return displayProjects.map((p, idx) => {
      const stats = projectStatsMap[p.id] || {
        completed: 50,
        inProgress: 30,
        pendingReview: 15,
        blocked: 5,
      };
      return {
        name: p.project_code || `P-${idx + 1}`,
        fullName: p.project_name,
        completed: stats.completed,
        inProgress: stats.inProgress,
        pendingReview: stats.pendingReview,
        blocked: stats.blocked,
        onTime: stats.onTimeRate,
      };
    });
  }, [displayProjects, projectStatsMap]);

  // Chart Data for 7-day Velocity & Trend
  const chartTrendData = useMemo(() => [
    { day: 'السبت', onTimeTarget: 95, alWaha: 85, alNakheel: 92, alMurooj: 98 },
    { day: 'الأحد', onTimeTarget: 95, alWaha: 87, alNakheel: 93, alMurooj: 99 },
    { day: 'الإثنين', onTimeTarget: 95, alWaha: 84, alNakheel: 95, alMurooj: 100 },
    { day: 'الثلاثاء', onTimeTarget: 95, alWaha: 88, alNakheel: 94, alMurooj: 100 },
    { day: 'الأربعاء', onTimeTarget: 95, alWaha: 89, alNakheel: 96, alMurooj: 100 },
    { day: 'الخميس', onTimeTarget: 95, alWaha: 88, alNakheel: 94, alMurooj: 100 },
    { day: 'الجمعة', onTimeTarget: 95, alWaha: 88, alNakheel: 94, alMurooj: 100 },
  ], []);

  // Executive Priority Action Items Feed
  const alertItems: AlertItem[] = useMemo(() => [
    {
      id: 'alt-4',
      type: 'blocker',
      severity: 'critical',
      priorityLevel: 'P1',
      priorityLabel: 'P1 - أولوية قصوى',
      categoryText: 'نزاع تعاقدي FIDIC Cl. 20.1',
      title: 'إعاقة حرجة: تأخر اعتماد مخططات شبكة الإطفاء',
      subtitle: 'مشروع الواحة: تجاوزت مهلة اعتماد الاستشاري 14 يوماً وتتطلب إصدار إشعار مطالبة بتمديد زمني (EOT)',
      projectId: displayProjects[0]?.id || 'prj-waha',
      projectName: displayProjects[0]?.project_name || 'مشروع الواحة',
      projectCode: displayProjects[0]?.project_code || 'PRJ-WAHA-01',
      timestamp: 'منذ 4 ساعات',
      targetId: 'blk-fidic-404',
      ownerName: 'المكتب الفني / إدارة العقود',
      actionLabel: 'إصدار إشعار FIDIC وتصعيد',
    },
    {
      id: 'alt-1',
      type: 'overdue_report',
      severity: 'critical',
      priorityLevel: 'P1',
      priorityLabel: 'P1 - أولوية قصوى',
      categoryText: 'يوميات موقع صامت (+48h)',
      title: '3 تقارير يومية متأخرة في مشروع الواحة',
      subtitle: 'لم يتم اعتماد تقارير التنفيذ والصب الخرساني لأكثر من 48 ساعة بواسطة المشرف الميداني',
      projectId: displayProjects[0]?.id || 'prj-waha',
      projectName: displayProjects[0]?.project_name || 'مشروع الواحة',
      projectCode: displayProjects[0]?.project_code || 'PRJ-WAHA-01',
      timestamp: 'منذ ساعتين',
      targetId: 'rep-overdue-101',
      ownerName: 'المشرف الميداني (Site QC)',
      actionLabel: 'تنبيه المشرف وتوثيق الصب',
    },
    {
      id: 'alt-2',
      type: 'pending_submission',
      severity: 'warning',
      priorityLevel: 'P2',
      priorityLabel: 'P2 - متابعة وتصعيد',
      categoryText: 'تسليمات وأعمال MEP',
      title: 'المهندس م. طارق الشمري بانتظار تقديم التقرير اليومي',
      subtitle: 'مشروع أبراج النخيل: بانتظار إرسال تقرير أعمال التركيبات الكهروميكانيكية قبل 06:00 م',
      projectId: displayProjects[1]?.id || 'prj-nakheel',
      projectName: displayProjects[1]?.project_name || 'مشروع أبراج النخيل',
      projectCode: displayProjects[1]?.project_code || 'PRJ-NKH-02',
      timestamp: 'اليوم 03:45 م',
      targetId: 'eng-pending-202',
      ownerName: 'م. طارق الشمري (MEP Lead)',
      actionLabel: 'متابعة تسليم التقرير',
    },
    {
      id: 'alt-5',
      type: 'weekly_ready',
      severity: 'info',
      priorityLevel: 'P3',
      priorityLabel: 'P3 - مصادقة وتصدير',
      categoryText: 'تقرير تنفيذي مجمع',
      title: 'مسودة التقرير الأسبوعي المجمع جاهزة للمصادقة',
      subtitle: 'تم استخراج مؤشرات الإنجاز لـ 3 مشاريع وهي بانتظار المصادقة وتصدير PDF للإدارة التنفيذية',
      projectId: 'combined',
      projectName: 'المحفظة المجمعة',
      projectCode: 'PORTFOLIO',
      timestamp: 'منذ 30 دقيقة',
      targetId: 'rep-weekly-505',
      ownerName: 'إدارة العمليات (COO)',
      actionLabel: 'مصادقة وتصدير التقرير',
    },
    {
      id: 'alt-3',
      type: 'compliance',
      severity: 'success',
      priorityLevel: 'P4',
      priorityLabel: 'P4 - إنجاز قياسي',
      categoryText: 'مطابقة وجودة قياسية',
      title: '100% نسبة الالتزام والجودة في مشروع مروج الرياض',
      subtitle: 'تم اعتماد كافة تقارير المهام والـ WIR وإغلاق جميع ملاحظات الاستشاري للأسبوع الحالي بنجاح',
      projectId: displayProjects[2]?.id || 'prj-murooj',
      projectName: displayProjects[2]?.project_name || 'مشروع مروج الرياض',
      projectCode: displayProjects[2]?.project_code || 'PRJ-MRJ-03',
      timestamp: 'اليوم 11:20 ص',
      targetId: 'comp-murooj-303',
      ownerName: 'فريق ضبط الجودة (QC)',
      actionLabel: 'استعراض سجل المطابقة',
    },
  ], [displayProjects]);

  const filteredAlerts = useMemo(() => {
    if (activeAlertFilter === 'all') return alertItems;
    if (activeAlertFilter === 'critical') return alertItems.filter((item) => item.priorityLevel === 'P1');
    if (activeAlertFilter === 'warning') return alertItems.filter((item) => item.priorityLevel === 'P2');
    if (activeAlertFilter === 'success') return alertItems.filter((item) => item.priorityLevel === 'P4' || item.severity === 'success');
    return alertItems.filter((item) => item.severity === activeAlertFilter);
  }, [alertItems, activeAlertFilter]);

  const handleAlertClick = (alert: AlertItem) => {
    if (alert.projectId && alert.projectId !== 'combined') {
      onSelectProject(alert.projectId);
    }
    if (onCardClick) {
      onCardClick(alert.type, alert.targetId);
    }
    if (alert.type === 'overdue_report' && onOpenReport) {
      onOpenReport(alert.targetId);
    } else if (alert.type === 'pending_submission' && onOpenTask) {
      onOpenTask(alert.targetId);
    } else if (alert.type === 'blocker' && onOpenDeliverable) {
      onOpenDeliverable(alert.targetId);
    } else if (alert.type === 'weekly_ready' && onOpenReport) {
      onOpenReport(alert.targetId);
    } else if (alert.type === 'compliance' && onOpenInspection) {
      onOpenInspection(alert.targetId);
    }
  };

  return (
    <div className={`space-y-6 select-none ${className}`}>
      {/* ── Executive Header Banner ── */}
      <div className="glass-card bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-5 sm:p-6 rounded-2xl border border-emerald-900/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 end-0 -mt-8 -me-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
              <Activity className="w-3.5 h-3.5" />
              <span>ملخص العمليات والقيادة التنفيذية (COO Cross-Project Command)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-normal text-white flex items-center gap-2">
              <span>نظرة المحفظة الشاملة ومقارنة المشاريع</span>
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              متابعة حية لمؤشرات الإنجاز، كفاءة التسليم الميداني، اختناقات الاعتمادات، وسجل الاستثناءات عبر مشاريع المحفظة.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div
              role="group"
              aria-label="تحديد النطاق الزمني للملخص التنفيذي"
              className="flex items-center bg-black/30 backdrop-blur-md p-1 rounded-xl border border-white/10 text-xs font-bold"
            >
              {(['week', 'month', 'quarter'] as const).map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setSelectedTimeframe(tf)}
                  aria-pressed={selectedTimeframe === tf}
                  className={`px-3 py-1.5 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none ${
                    selectedTimeframe === tf
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-white/10 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {tf === 'week' ? 'هذا الأسبوع' : tf === 'month' ? 'هذا الشهر' : 'الربع الحالي'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Top Section: 4 Project Comparison Cards with Stacked Status Mini-Bars ── */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              مقارنة أداء المشاريع والمحفظة (Cross-Project Comparison)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            3 مشاريع مقارنة + الإجمالي المجمع
          </span>
        </div>

        <div
          role="region"
          aria-label="بطاقات مقارنة أداء المشاريع والمحفظة"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {/* Cards 1 to 3: Projects */}
          {displayProjects.map((proj, idx) => {
            const stats = projectStatsMap[proj.id] || {
              completed: 50,
              inProgress: 30,
              pendingReview: 15,
              blocked: 5,
              total: 100,
              onTimeRate: 88,
              silentHours: 0,
              isSilent: false,
              weeklyReady: false,
            };

            const isCurrentSelected = selectedProjectId === proj.id;

            return (
              <div
                key={proj.id}
                role="button"
                tabIndex={0}
                aria-label={`مشروع ${proj.project_name}، كود ${proj.project_code}، نسبة الإنجاز الكلي ${stats.completed}%، نسبة الالتزام الزمني ${stats.onTimeRate}%`}
                onClick={() => {
                  onSelectProject(proj.id);
                  onCardClick?.('project', proj.id);
                }}
                onKeyDown={(e) =>
                  handleKeyDown(e, () => {
                    onSelectProject(proj.id);
                    onCardClick?.('project', proj.id);
                  })
                }
                className={`glass-card bg-white dark:bg-slate-900/90 border p-4 sm:p-5 rounded-2xl shadow-sm hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
                  isCurrentSelected
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                    : 'border-slate-200/90 dark:border-slate-800 hover:border-emerald-500/50'
                }`}
              >
                {/* Silent site indicator ribbon */}
                {stats.isSilent && (
                  <div
                    className="absolute top-0 end-0 bg-rose-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-es-xl rtl:rounded-br-xl rtl:rounded-bl-none ltr:rounded-bl-xl ltr:rounded-br-none flex items-center gap-1 shadow-sm animate-pulse z-10"
                    title={`موقع صامت: لم تصل تقارير منذ ${stats.silentHours} ساعة`}
                    aria-label={`تنبيه موقع صامت: ${stats.silentHours} ساعة بدون تقارير`}
                  >
                    <Radio className="w-3 h-3" aria-hidden="true" />
                    <span>موقع صامت ({stats.silentHours}h)</span>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span
                        dir="ltr"
                        className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/60 inline-block"
                      >
                        {proj.project_code || `PRJ-0${idx + 1}`}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5 line-clamp-1 group-hover:text-emerald-600 transition-colors">
                        {proj.project_name}
                      </h4>
                    </div>

                    <div className="text-end">
                      <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                        {stats.completed}%
                      </span>
                      <p className="text-[10px] text-slate-500 font-semibold">إنجاز كلي</p>
                    </div>
                  </div>

                  {/* Stacked Status Mini-Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">توزيع حالة المهام:</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                        {stats.total} مهمة
                      </span>
                    </div>

                    <div
                      className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex shadow-inner"
                      role="progressbar"
                      aria-valuenow={stats.completed}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`توزيع حالات المهام لمشروع ${proj.project_name}`}
                    >
                      {/* 1. Completed (Sage Green) */}
                      <div
                        style={{ width: `${stats.completed}%` }}
                        className="h-full bg-emerald-700 hover:bg-emerald-600 transition-all cursor-pointer"
                        title={`مكتمل ومعتمد: ${stats.completed}%`}
                      />
                      {/* 2. In Progress (Steel Blue) */}
                      <div
                        style={{ width: `${stats.inProgress}%` }}
                        className="h-full bg-blue-500 hover:bg-blue-400 transition-all cursor-pointer"
                        title={`قيد التنفيذ: ${stats.inProgress}%`}
                      />
                      {/* 3. Pending Review (Amber Tan) */}
                      <div
                        style={{ width: `${stats.pendingReview}%` }}
                        className="h-full bg-amber-500 hover:bg-amber-400 transition-all cursor-pointer"
                        title={`بانتظار المراجعة: ${stats.pendingReview}%`}
                      />
                      {/* 4. Blocked / Overdue (Coral Red) */}
                      <div
                        style={{ width: `${stats.blocked}%` }}
                        className="h-full bg-rose-500 hover:bg-rose-400 transition-all cursor-pointer"
                        title={`معطل / متأخر: ${stats.blocked}%`}
                      />
                    </div>

                    {/* Mini Legend */}
                    <div className="grid grid-cols-4 gap-1 text-[10px] text-center pt-1 font-bold">
                      <span className="text-emerald-700 dark:text-emerald-400">
                        {stats.completed}% منجز
                      </span>
                      <span className="text-blue-700 dark:text-blue-400">
                        {stats.inProgress}% نشط
                      </span>
                      <span className="text-amber-700 dark:text-amber-400">
                        {stats.pendingReview}% مراجعة
                      </span>
                      <span className="text-rose-700 dark:text-rose-400">
                        {stats.blocked}% عائق
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Key Stats & Button */}
                <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className={`inline-flex items-center gap-1 font-bold ${
                        stats.onTimeRate >= 90
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      <TrendingUp className="w-3 h-3" aria-hidden="true" />
                      {stats.onTimeRate}% التزام
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectProject(proj.id);
                    }}
                    aria-label={`فتح لوحة التحكم لمشروع ${proj.project_name}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 group-hover:translate-x-[-2px] rtl:group-hover:translate-x-[2px] transition-transform rounded-lg px-2 py-1 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                  >
                    <span>فتح اللوحة</span>
                    <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Card 4: Combined Total Card (الإجمالي المجمع للمحفظة) */}
          <div
            role="button"
            tabIndex={0}
            aria-label={`الإجمالي المجمع للمحفظة، متوسط الإنجاز ${Math.round((combinedStats.completed / combinedStats.total) * 100)}%، إجمالي المهام المجمعة ${combinedStats.total} مهمة`}
            onClick={() => onCardClick?.('portfolio_combined', 'all')}
            onKeyDown={(e) =>
              handleKeyDown(e, () => onCardClick?.('portfolio_combined', 'all'))
            }
            className="glass-card bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/30 border-2 border-emerald-400 dark:border-emerald-600 p-4 sm:p-5 rounded-2xl shadow-md hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between group relative focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span
                    dir="ltr"
                    className="text-[11px] font-mono font-black text-white bg-emerald-700 dark:bg-emerald-600 px-2 py-0.5 rounded-md shadow-sm inline-block"
                  >
                    PORTFOLIO TOTAL
                  </span>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white mt-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                    <span>الإجمالي المجمع للمحفظة</span>
                  </h4>
                </div>

                <div className="text-end">
                  <span className="text-lg font-black text-emerald-700 dark:text-emerald-400 font-mono">
                    {Math.round((combinedStats.completed / combinedStats.total) * 100)}%
                  </span>
                  <p className="text-[10px] text-slate-500 font-bold">متوسط الإنجاز</p>
                </div>
              </div>

              {/* Stacked Combined Mini-Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-600 dark:text-slate-300 font-bold">إجمالي المهام المجمعة:</span>
                  <span className="font-mono font-black text-emerald-700 dark:text-emerald-400">
                    {combinedStats.total} مهمة
                  </span>
                </div>

                <div
                  className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex shadow-inner"
                  role="progressbar"
                  aria-valuenow={Math.round((combinedStats.completed / combinedStats.total) * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="توزيع حالات مهام المحفظة المجمعة"
                >
                  <div
                    style={{ width: `${Math.round((combinedStats.completed / combinedStats.total) * 100)}%` }}
                    className="h-full bg-emerald-700"
                    title={`مكتمل ومعتمد: ${combinedStats.completed}`}
                  />
                  <div
                    style={{ width: `${Math.round((combinedStats.inProgress / combinedStats.total) * 100)}%` }}
                    className="h-full bg-blue-500"
                    title={`قيد التنفيذ: ${combinedStats.inProgress}`}
                  />
                  <div
                    style={{ width: `${Math.round((combinedStats.pendingReview / combinedStats.total) * 100)}%` }}
                    className="h-full bg-amber-500"
                    title={`بانتظار المراجعة: ${combinedStats.pendingReview}`}
                  />
                  <div
                    style={{ width: `${Math.round((combinedStats.blocked / combinedStats.total) * 100)}%` }}
                    className="h-full bg-rose-500"
                    title={`معطل ومتأخر: ${combinedStats.blocked}`}
                  />
                </div>

                <div className="grid grid-cols-4 gap-1 text-[10px] text-center pt-1 font-black">
                  <span className="text-emerald-700 dark:text-emerald-400">{combinedStats.completed} مكتمل</span>
                  <span className="text-blue-700 dark:text-blue-400">{combinedStats.inProgress} نشط</span>
                  <span className="text-amber-700 dark:text-amber-400">{combinedStats.pendingReview} مراجعة</span>
                  <span className="text-rose-700 dark:text-rose-400">{combinedStats.blocked} عائق</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-3 border-t border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                معدل المحفظة: {combinedStats.onTimeRate}%
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCardClick?.('portfolio_combined', 'all');
                }}
                aria-label="عرض التقرير الشامل للمحفظة المجمعة"
                className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 rounded-lg px-2 py-1 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
              >
                <span>تقرير شامل</span>
                <ArrowUpRight className="w-3.5 h-3.5 rtl:rotate-90" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Middle Section: KPI Metrics Row ── */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              مؤشرات الأداء التشغيلية الرئيسية (Executive Operational Metrics)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">محدثة آنياً وفق معطيات المحفظة</span>
        </div>

        <div
          role="region"
          aria-label="مؤشرات الأداء التشغيلية الرئيسية"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {/* KPI 1: Overall On-Time Rate */}
          <div
            role="button"
            tabIndex={0}
            aria-label={`معدل الالتزام الزمني العام: ${kpiMetrics.onTimeRate}%، المستهدف 90.0%`}
            onClick={() => onCardClick?.('kpi_on_time', 'on_time')}
            onKeyDown={(e) => handleKeyDown(e, () => onCardClick?.('kpi_on_time', 'on_time'))}
            className="glass-card bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                معدل الالتزام الزمني العام
              </span>
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-5 h-5" aria-hidden="true" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
                  {kpiMetrics.onTimeRate}%
                </span>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/50 dark:border-emerald-800/50">
                  +3.2% عن الشهر السابق
                </span>
              </div>

              {/* Progress track */}
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: `${kpiMetrics.onTimeRate}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-1">
                <span>المستهدف: 90.0%</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                  {kpiMetrics.onTimeRate >= 90 ? 'ضمن النطاق الإيجابي' : 'يتطلب تحسين المسار'}
                </span>
              </div>
            </div>
          </div>

          {/* KPI 2: Total Active Blockers */}
          <div
            role="button"
            tabIndex={0}
            aria-label={`إجمالي الإعاقات والمخاطر الحرجة: ${kpiMetrics.totalBlockers} عوائق نشطة مسار حرج`}
            onClick={() => onCardClick?.('kpi_blockers', 'blockers')}
            onKeyDown={(e) => handleKeyDown(e, () => onCardClick?.('kpi_blockers', 'blockers'))}
            className="glass-card bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                الإعاقات الحرجة والنزاعات
              </span>
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-5 h-5" aria-hidden="true" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-rose-600 dark:text-rose-400 font-mono">
                  {kpiMetrics.totalBlockers}
                </span>
                <span className="text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-md border border-rose-200/50 dark:border-rose-800/50">
                  عوائق مسار حرج
                </span>
              </div>

              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, kpiMetrics.totalBlockers * 7)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-semibold pt-1">
                <span className="text-rose-600 dark:text-rose-400">2 مخاطر FIDIC Cl. 20</span>
                <span className="text-amber-600 dark:text-amber-400">3 اعتمادات TO متأخرة</span>
              </div>
            </div>
          </div>

          {/* KPI 3: 48h Silent Sites Count */}
          <div
            role="button"
            tabIndex={0}
            aria-label={`المواقع الصامتة أكثر من 48 ساعة: ${kpiMetrics.silentSitesCount}، تتبع اليوميات الميدانية`}
            onClick={() => onCardClick?.('kpi_silent_sites', 'silent_sites')}
            onKeyDown={(e) => handleKeyDown(e, () => onCardClick?.('kpi_silent_sites', 'silent_sites'))}
            className={`glass-card bg-white dark:bg-slate-900 border p-5 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
              kpiMetrics.silentSitesCount > 0
                ? 'border-amber-300 dark:border-amber-900/60'
                : 'border-slate-200/80 dark:border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                المواقع الصامتة (+48 ساعة)
              </span>
              <div
                className={`p-2.5 rounded-xl transition-all ${
                  kpiMetrics.silentSitesCount > 0
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 animate-pulse'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'
                }`}
              >
                <Radio className="w-5 h-5" aria-hidden="true" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-3xl font-black font-mono ${
                    kpiMetrics.silentSitesCount > 0 ? 'text-amber-600' : 'text-emerald-700 dark:text-emerald-400'
                  }`}
                >
                  {kpiMetrics.silentSitesCount}
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
                    kpiMetrics.silentSitesCount > 0
                      ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border-amber-200/50 dark:border-amber-800/50'
                      : 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200/50 dark:border-emerald-800/50'
                  }`}
                >
                  {kpiMetrics.silentSitesCount > 0 ? 'موقع بحاجة لتنبيه فوري' : 'كافة المواقع نشطة'}
                </span>
              </div>

              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    kpiMetrics.silentSitesCount > 0 ? 'bg-amber-500' : 'bg-emerald-600'
                  }`}
                  style={{ width: kpiMetrics.silentSitesCount > 0 ? '60%' : '100%' }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-1">
                <span>تتبع اليوميات الميدانية</span>
                <span
                  className={`font-bold ${
                    kpiMetrics.silentSitesCount > 0
                      ? 'text-amber-700 dark:text-amber-400'
                      : 'text-emerald-700 dark:text-emerald-400'
                  }`}
                >
                  {kpiMetrics.silentSitesCount > 0 ? 'مشروع الواحة: 52h بدون رفع' : 'تغطية يومية 100%'}
                </span>
              </div>
            </div>
          </div>

          {/* KPI 4: Weekly Report Readiness */}
          <div
            role="button"
            tabIndex={0}
            aria-label={`جاهزية التقرير الأسبوعي المجمع: ${kpiMetrics.weeklyReadinessPct}%، ${kpiMetrics.weeklyReadyCount} من 3 مشاريع جاهزة`}
            onClick={() => onCardClick?.('kpi_weekly_report', 'weekly_report')}
            onKeyDown={(e) => handleKeyDown(e, () => onCardClick?.('kpi_weekly_report', 'weekly_report'))}
            className="glass-card bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                جاهزية التقرير الأسبوعي
              </span>
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5" aria-hidden="true" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-blue-600 dark:text-blue-400 font-mono">
                  {kpiMetrics.weeklyReadinessPct}%
                </span>
                <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md border border-blue-200/50 dark:border-blue-800/50">
                  {kpiMetrics.weeklyReadyCount} من 3 مشاريع معتمدة
                </span>
              </div>

              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${kpiMetrics.weeklyReadinessPct}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-1">
                <span>تصدير PDF التجميعي</span>
                <span className="text-blue-700 dark:text-blue-400 font-bold">بانتظار مصادقة الواحة</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Visual Trend Charts (Recharts) ── */}
      <div className="glass-card bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <span>التحليل البصري لحالة المحفظة ومعدل الإنجاز</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              مقارنة حالة الحزم التنفيذية وسرعة إغلاق التقارير الأسبوعية
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div
              role="tablist"
              aria-label="نوع التحليل البصري"
              className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold"
            >
              <button
                role="tab"
                id="tab-stacked"
                aria-selected={activeChartTab === 'stacked'}
                aria-controls="chart-view-panel"
                type="button"
                onClick={() => setActiveChartTab('stacked')}
                className={`px-3 py-1.5 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
                  activeChartTab === 'stacked'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                توزيع الحالات بالمشاريع
              </button>
              <button
                role="tab"
                id="tab-trend"
                aria-selected={activeChartTab === 'trend'}
                aria-controls="chart-view-panel"
                type="button"
                onClick={() => setActiveChartTab('trend')}
                className={`px-3 py-1.5 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
                  activeChartTab === 'trend'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                منحنى الالتزام اليومي (7 أيام)
              </button>
            </div>
          </div>
        </div>

        {/* Chart Viewport */}
        <div
          id="chart-view-panel"
          role="tabpanel"
          aria-labelledby={activeChartTab === 'stacked' ? 'tab-stacked' : 'tab-trend'}
          className="h-64 sm:h-72 w-full min-w-0 overflow-hidden pt-2"
        >
          {isMounted ? (
            activeChartTab === 'stacked' ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
                <BarChart
                  data={chartStackedData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    domain={[0, 100]}
                    unit="%"
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="glass-card bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1.5 min-w-44 text-start">
                            <p className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1">
                              {label}
                            </p>
                            {payload.map((entry, index) => (
                              <div
                                key={`item-${index}`}
                                className="flex items-center justify-between gap-2"
                              >
                                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: entry.color }}
                                  />
                                  <span>{entry.name}:</span>
                                </span>
                                <span className="font-mono font-bold text-slate-900 dark:text-white">
                                  {entry.value}%
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: '10px', fontSize: '11px', fontWeight: 600 }}
                  />
                  <Bar
                    dataKey="completed"
                    name="مكتمل ومعتمد"
                    stackId="a"
                    fill="#059669"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="inProgress"
                    name="قيد التنفيذ"
                    stackId="a"
                    fill="#3B82F6"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="pendingReview"
                    name="بانتظار المراجعة"
                    stackId="a"
                    fill="#F59E0B"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="blocked"
                    name="معطل / متأخر"
                    stackId="a"
                    fill="#EF4444"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
                <AreaChart
                  data={chartTrendData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorMurooj" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorNakheel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorWaha" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    domain={[70, 100]}
                    unit="%"
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="glass-card bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1.5 min-w-44 text-start">
                            <p className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1">
                              {label}
                            </p>
                            {payload.map((entry, index) => (
                              <div
                                key={`trend-${index}`}
                                className="flex items-center justify-between gap-2"
                              >
                                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: entry.color }}
                                  />
                                  <span>{entry.name}:</span>
                                </span>
                                <span className="font-mono font-bold text-slate-900 dark:text-white">
                                  {entry.value}%
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: '10px', fontSize: '11px', fontWeight: 600 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="alMurooj"
                    name="مشروع المروج"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorMurooj)"
                  />
                  <Area
                    type="monotone"
                    dataKey="alNakheel"
                    name="مشروع النخيل"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorNakheel)"
                  />
                  <Area
                    type="monotone"
                    dataKey="alWaha"
                    name="مشروع الواحة"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorWaha)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
              جاري تحميل الرسوم البيانية...
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Section: Priority Action Items & Executive Directives ── */}
      <div
        role="region"
        aria-label="سجل الإجراءات ذات الأولوية والقرارات التنفيذية"
        className="glass-card bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 rounded-2xl shadow-sm space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BellRing className="w-4 h-4 text-rose-500" aria-hidden="true" />
              <span>سجل الإجراءات ذات الأولوية والقرارات التنفيذية (Executive Priority Action Items)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              توجيه فوري لمعالجة الإعاقات الحرجة، تنبيه المواقع الصامتة (+48h)، واعتماد التقارير المجمعة عبر المحفظة
            </p>
          </div>

          {/* Filter Pills */}
          <div
            role="toolbar"
            aria-label="تصفية الإجراءات ذات الأولوية"
            className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0"
          >
            {[
              { id: 'all', label: 'كافة الإجراءات', count: alertItems.length },
              { id: 'critical', label: 'أولوية قصوى (P1)', count: alertItems.filter((a) => a.priorityLevel === 'P1').length },
              { id: 'warning', label: 'متابعة وتصعيد (P2)', count: alertItems.filter((a) => a.priorityLevel === 'P2').length },
              { id: 'success', label: 'إنجازات ومطابقة', count: alertItems.filter((a) => a.priorityLevel === 'P4' || a.severity === 'success').length },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveAlertFilter(tab.id as any)}
                aria-pressed={activeAlertFilter === tab.id}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
                  activeAlertFilter === tab.id
                    ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{tab.label}</span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 bg-black/20 text-white rounded-full">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Priority Actions List */}
        <div
          role="list"
          aria-label="قائمة الإجراءات والقرارات التنفيذية"
          className="space-y-3 pt-1"
        >
          {filteredAlerts.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/40 rounded-xl">
              لا توجد إجراءات معلقة ضمن هذا الفلتر حالياً.
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const borderStyles =
                alert.priorityLevel === 'P1'
                  ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20 hover:border-rose-400 dark:hover:border-rose-700'
                  : alert.priorityLevel === 'P2'
                  ? 'border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20 hover:border-amber-400 dark:hover:border-amber-700'
                  : alert.priorityLevel === 'P4'
                  ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 hover:border-emerald-400 dark:hover:border-emerald-700'
                  : 'border-blue-200 dark:border-blue-900/60 bg-blue-50/30 dark:bg-blue-950/20 hover:border-blue-400 dark:hover:border-blue-700';

              const priorityBadgeStyles =
                alert.priorityLevel === 'P1'
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                  : alert.priorityLevel === 'P2'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                  : alert.priorityLevel === 'P4'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-800';

              const actionBtnStyles =
                alert.priorityLevel === 'P1'
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                  : alert.priorityLevel === 'P2'
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
                  : alert.priorityLevel === 'P4'
                  ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-700/20'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20';

              return (
                <div
                  key={alert.id}
                  role="listitem"
                  tabIndex={0}
                  aria-label={`${alert.priorityLabel}: ${alert.title} - مشروع ${alert.projectName}`}
                  onClick={() => handleAlertClick(alert)}
                  onKeyDown={(e) => handleKeyDown(e, () => handleAlertClick(alert))}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${borderStyles}`}
                >
                  <div className="space-y-2 flex-1">
                    {/* Meta Header */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[11px] font-black px-2 py-0.5 rounded-md border ${priorityBadgeStyles}`}>
                        {alert.priorityLabel}
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {alert.categoryText}
                      </span>
                      <span
                        dir="ltr"
                        className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 inline-block"
                      >
                        {alert.projectCode}
                      </span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {alert.projectName}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" aria-hidden="true" />
                        <span>{alert.timestamp}</span>
                      </span>
                    </div>

                    {/* Content */}
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                      {alert.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {alert.subtitle}
                    </p>

                    {/* Owner metadata */}
                    {alert.ownerName && (
                      <div className="pt-1 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/90 dark:bg-slate-800/90 text-[11px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/70">
                          <UserCheck className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" aria-hidden="true" />
                          <span>المسؤول الميداني: {alert.ownerName}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Accessible Action Button */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAlertClick(alert);
                      }}
                      aria-label={`${alert.actionLabel} لمشروع ${alert.projectName}`}
                      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none shrink-0 ${actionBtnStyles}`}
                    >
                      <span>{alert.actionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default CooSummaryView;
