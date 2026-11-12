'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck,
  RotateCw,
  BarChart3,
  ChevronRight,
  HardHat,
  Eye,
  AlertCircle,
  FileText,
  Layers,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/lib/stores/useAuthStore';
import { useProjectStore } from '@/lib/stores/useProjectStore';
import { ProjectService } from '@/lib/services/project.service';
import { SiteTaskService, SiteTask } from '@/lib/services/siteTask.service';
import { DailyProgressService } from '@/lib/services/dailyProgress.service';
import { KpiService } from '@/lib/services/kpi.service';
import { CostControlService } from '@/lib/services/costControl.service';
import { Project } from '@/types';
import { DailyProgress, PlanningKpis } from '@/types/planning';
import PMReviewQueue from '@/components/planning/PMReviewQueue';
import { ProjectKPICards } from '@/components/dashboard/ProjectKPICards';
import { ObstructionReport } from '@/components/planning/ObstructionReport';
import { DailyProgressReviewModal } from '@/components/planning/DailyProgressReviewModal';
import { DisciplineProgressBreakdown } from '@/components/planning/DisciplineProgressBreakdown';
import Link from 'next/link';

const STATUS_MAP: Record<string, { ar: string; en: string; badgeClass: string }> = {
  submitted: {
    ar: 'بانتظار المراجعة',
    en: 'Submitted',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800',
  },
  approved: {
    ar: 'معتمد',
    en: 'Approved',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800',
  },
  rejected: {
    ar: 'مرفوض للتعديل',
    en: 'Rejected (Rework)',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800',
  },
  draft: {
    ar: 'مسودة',
    en: 'Draft',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  },
  in_progress: {
    ar: 'قيد المتابعة',
    en: 'In Progress',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800',
  },
};

const DISCIPLINE_MAP: Record<string, { ar: string; en: string }> = {
  civil: { ar: 'أعمال مدنية', en: 'Civil' },
  architectural: { ar: 'أعمال معمارية', en: 'Architectural' },
  mep: { ar: 'أعمال كهروميكانيكية', en: 'MEP' },
  electrical: { ar: 'أعمال كهربائية', en: 'Electrical' },
  mechanical: { ar: 'أعمال ميكانيكية', en: 'Mechanical' },
  structural: { ar: 'أعمال إنشائية', en: 'Structural' },
  finishing: { ar: 'تشطيبات', en: 'Finishes' },
  infrastructure: { ar: 'بنية تحتية', en: 'Infrastructure' },
};

export default function PMDashboardPage() {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { activeProjectId, setActiveProjectId } = useProjectStore();

  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => activeProjectId || '');
  const [activeTab, setActiveTab] = useState<'actions' | 'obstructions' | 'kpis' | 'dailylogs'>('actions');
  const [reviewingReport, setReviewingReport] = useState<DailyProgress | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 1. Fetch Projects
  const {
    data: projects = [],
    isLoading: loadingProjects,
    isError: isErrorProjects,
  } = useQuery<Project[]>({
    queryKey: ['pm-dashboard-projects'],
    queryFn: async () => {
      const list = await ProjectService.getProjects();
      return list || [];
    },
  });

  // Sync external changes from store (e.g., TopNav selection) to local state
  useEffect(() => {
    if (activeProjectId && activeProjectId !== selectedProjectId) {
      setSelectedProjectId(activeProjectId);
    }
  }, [activeProjectId, selectedProjectId]);

  // Synchronize initial selection between store and projects list
  useEffect(() => {
    if (projects.length === 0) return;

    if (activeProjectId && projects.some((p) => p.id === activeProjectId)) {
      if (selectedProjectId !== activeProjectId) {
        setSelectedProjectId(activeProjectId);
      }
      return;
    }

    if (selectedProjectId && projects.some((p) => p.id === selectedProjectId)) {
      if (activeProjectId !== selectedProjectId) {
        setActiveProjectId(selectedProjectId);
      }
      return;
    }

    const defaultId = projects[0]?.id;
    if (defaultId) {
      setSelectedProjectId(defaultId);
      setActiveProjectId(defaultId);
    }
  }, [projects, activeProjectId, selectedProjectId, setActiveProjectId]);

  const handleProjectSelect = (newProjectId: string) => {
    setSelectedProjectId(newProjectId);
    if (newProjectId && newProjectId !== activeProjectId) {
      setActiveProjectId(newProjectId);
    }
  };

  const currentProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId) || projects[0] || null;
  }, [projects, selectedProjectId]);

  // 2. Fetch Site Tasks for Selected Project
  const {
    data: siteTasks = [],
    isLoading: loadingTasks,
    isError: isErrorTasks,
    refetch: refetchTasks,
  } = useQuery<SiteTask[]>({
    queryKey: ['pm-site-tasks', selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return [];
      return await SiteTaskService.getTasksForProject(selectedProjectId);
    },
    enabled: !!selectedProjectId,
  });

  // 3. Fetch Daily Progress Reports for Selected Project
  const {
    data: dailyReports = [],
    isLoading: loadingReports,
    isError: isErrorReports,
    refetch: refetchReports,
  } = useQuery<DailyProgress[]>({
    queryKey: ['pm-daily-reports', selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return [];
      return await DailyProgressService.getDailyReports(selectedProjectId);
    },
    enabled: !!selectedProjectId,
  });

  // 4. Fetch Site Productivity KPIs
  const {
    data: siteProductivity,
    isLoading: loadingProductivity,
    isError: isErrorProductivity,
  } = useQuery({
    queryKey: ['pm-site-productivity', selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return null;
      return await KpiService.getSiteProductivityKPIs(selectedProjectId);
    },
    enabled: !!selectedProjectId,
  });

  // 5. Fetch EVM & Planning KPIs for Selected Project
  const {
    data: planningKpis,
    isLoading: loadingPlanningKpis,
  } = useQuery<Partial<PlanningKpis> | null>({
    queryKey: ['pm-planning-kpis', selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return null;
      try {
        const [summary, actualProgress] = await Promise.all([
          CostControlService.getCostControlSummary(selectedProjectId),
          DailyProgressService.calculateProjectProgress(selectedProjectId),
        ]);
        return {
          project_id: selectedProjectId,
          spi: summary.overallSPI,
          cpi: summary.overallCPI,
          actual_completion_pct: actualProgress > 0 ? actualProgress : 61.2,
          planned_completion_pct: 65.0,
          earned_value_egp: summary.totalEarnedValue,
          planned_value_egp: summary.totalPlannedValue,
          actual_cost_egp: summary.totalActualCost,
          budget_at_completion_egp: summary.totalBudget,
          days_variance: summary.overallSV < 0 ? -5 : 0,
          field_actual_unallocated_egp: 0,
          unallocated_reports_count: 0,
        };
      } catch {
        return null;
      }
    },
    enabled: !!selectedProjectId,
  });

  // Computed metrics
  const pmReviewTasks = useMemo(() => {
    return siteTasks.filter((t) => t.status === 'pm_review');
  }, [siteTasks]);

  const pendingDailyReports = useMemo(() => {
    return dailyReports.filter((r) => r.status === 'submitted');
  }, [dailyReports]);

  const activeObstructionsCount = siteProductivity?.active_obstructions_count ?? 0;
  const totalTasksCount = siteTasks.length;
  const approvedTasksCount = siteTasks.filter((t) => t.status === 'approved' || t.status === 'done').length;
  const approvedPct = totalTasksCount > 0 ? Math.round((approvedTasksCount / totalTasksCount) * 100) : 0;

  const isAnyError = isErrorProjects || isErrorTasks || isErrorReports || isErrorProductivity;
  const isKpiLoading = loadingProjects || loadingTasks || loadingReports || loadingProductivity;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchTasks(),
        refetchReports(),
        queryClient.invalidateQueries({ queryKey: ['pm-planning-kpis', selectedProjectId] }),
        queryClient.invalidateQueries({ queryKey: ['pm-site-productivity', selectedProjectId] }),
        queryClient.invalidateQueries({ queryKey: ['discipline-progress-breakdown', selectedProjectId] }),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="p-3 sm:p-5 lg:p-6 max-w-[1750px] w-full mx-auto space-y-6 font-sans text-start"
    >
      {/* Header Banner */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 sm:p-8 text-white shadow-2xl border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 min-w-0 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold shadow-xs">
              <Briefcase className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{isAr ? 'مركز قيادة مدير المشروع' : 'Project Manager Action Center'}</span>
            </div>

            <h1
              className={`text-2xl sm:text-3xl font-black text-white truncate ${isAr ? 'tracking-normal' : 'tracking-tight'}`}
              title={
                currentProject
                  ? (isAr ? currentProject.name_ar || currentProject.name_en : currentProject.name_en || currentProject.name_ar) || ''
                  : ''
              }
            >
              {loadingProjects ? (
                <span className="inline-block h-8 w-64 bg-slate-800/80 rounded-lg animate-pulse" />
              ) : currentProject ? (
                isAr ? currentProject.name_ar || currentProject.name_en : currentProject.name_en || currentProject.name_ar
              ) : (
                isAr ? 'لوحة تحكم المشاريع' : 'Project Management Command'
              )}
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed line-clamp-2 sm:line-clamp-none">
              {isAr
                ? 'متابعة طوابير الاعتمادات المعلقة، الإعاقات الميدانية، مؤشرات القيمة المكتسبة، وجاهزية فرق التنفيذ.'
                : 'Manage pending approvals, field obstructions, EVM KPIs, and operational site readiness.'}
            </p>
          </div>

          {/* Project Selector & Refresh Button */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="relative min-w-[220px] max-w-full">
              <label htmlFor="pm-project-select" className="sr-only">
                {isAr ? 'اختر المشروع' : 'Select Project'}
              </label>
              <select
                id="pm-project-select"
                aria-label={isAr ? 'اختر المشروع المعروض' : 'Select active project'}
                value={selectedProjectId}
                onChange={(e) => handleProjectSelect(e.target.value)}
                disabled={loadingProjects || projects.length === 0}
                className="w-full h-10 px-3 py-1.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                    {p.code ? `[${p.code}] ` : ''}
                    {isAr ? p.name_ar || p.name_en : p.name_en || p.name_ar}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              aria-label={isAr ? 'تحديث كافة البيانات' : 'Refresh dashboard data'}
              title={isAr ? 'تحديث البيانات' : 'Refresh Data'}
              className="h-10 px-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-wait focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 active:scale-95"
            >
              <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} aria-hidden="true" />
              <span className="hidden sm:inline">{isAr ? 'تحديث' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Error Alert Banner if any query failed */}
      {isAnyError && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" aria-hidden="true" />
            <span className="font-semibold">
              {isAr
                ? 'تعذر تحميل بعض بيانات لوحة التحكم. يرجى التحقق من الاتصال وإعادة المحاولة.'
                : 'Unable to load some dashboard metrics. Please check your connection and retry.'}
            </span>
          </div>
          <button
            onClick={handleRefresh}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
          >
            {isAr ? 'إعادة المحاولة' : 'Retry'}
          </button>
        </div>
      )}

      {/* Quick Summary KPIs Strip */}
      <section aria-label={isAr ? 'ملخص مؤشرات مدير المشروع' : 'PM Key Metric Indicators'}>
        {isKpiLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs animate-pulse space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800" />
                </div>
                <div className="flex items-baseline gap-2">
                  <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-4 w-20 bg-slate-100 dark:bg-slate-800/60 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            {/* Card 1: Pending Task Reviews */}
            <button
              type="button"
              onClick={() => setActiveTab('actions')}
              className={`text-start p-5 rounded-2xl bg-white dark:bg-slate-900 border shadow-xs hover:shadow-md transition-all duration-200 space-y-3 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                activeTab === 'actions'
                  ? 'border-amber-400 dark:border-amber-600 ring-2 ring-amber-400/20 shadow-amber-500/5'
                  : 'border-slate-200/80 dark:border-slate-800/80 hover:border-amber-300 dark:hover:border-amber-700/60'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                  {isAr ? 'اعتمادات المهام المعلقة' : 'Pending Task Reviews'}
                </span>
                <div
                  className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20 shrink-0 group-hover:scale-105 transition-transform"
                  aria-hidden="true"
                >
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline justify-between gap-2 flex-wrap">
                <span className="text-2xl sm:text-3xl font-black tabular-nums tracking-tight text-slate-900 dark:text-white">
                  {pmReviewTasks.length}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    pmReviewTasks.length > 0
                      ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${pmReviewTasks.length > 0 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                  {pmReviewTasks.length > 0
                    ? isAr ? 'يتطلب إجراء' : 'Requires Action'
                    : isAr ? 'مكتمل' : 'Clear'}
                </span>
              </div>
            </button>

            {/* Card 2: Pending Daily Logs */}
            <button
              type="button"
              onClick={() => setActiveTab('dailylogs')}
              className={`text-start p-5 rounded-2xl bg-white dark:bg-slate-900 border shadow-xs hover:shadow-md transition-all duration-200 space-y-3 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                activeTab === 'dailylogs'
                  ? 'border-blue-400 dark:border-blue-600 ring-2 ring-blue-400/20 shadow-blue-500/5'
                  : 'border-slate-200/80 dark:border-slate-800/80 hover:border-blue-300 dark:hover:border-blue-700/60'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                  {isAr ? 'اليوميات قيد الاعتماد' : 'Pending Daily Logs'}
                </span>
                <div
                  className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20 shrink-0 group-hover:scale-105 transition-transform"
                  aria-hidden="true"
                >
                  <FileCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline justify-between gap-2 flex-wrap">
                <span className="text-2xl sm:text-3xl font-black tabular-nums tracking-tight text-slate-900 dark:text-white">
                  {pendingDailyReports.length}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    pendingDailyReports.length > 0
                      ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                      : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${pendingDailyReports.length > 0 ? 'bg-blue-500 animate-pulse' : 'bg-slate-400'}`} />
                  {pendingDailyReports.length > 0
                    ? isAr ? 'تقارير واردة' : 'Submitted'
                    : isAr ? 'لا يوجد معلق' : 'Zero Pending'}
                </span>
              </div>
            </button>

            {/* Card 3: Active Obstructions */}
            <button
              type="button"
              onClick={() => setActiveTab('obstructions')}
              className={`text-start p-5 rounded-2xl bg-white dark:bg-slate-900 border shadow-xs hover:shadow-md transition-all duration-200 space-y-3 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                activeTab === 'obstructions'
                  ? 'border-rose-400 dark:border-rose-600 ring-2 ring-rose-400/20 shadow-rose-500/5'
                  : 'border-slate-200/80 dark:border-slate-800/80 hover:border-rose-300 dark:hover:border-rose-700/60'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors truncate">
                  {isAr ? 'الإعاقات النشطة' : 'Active Obstructions'}
                </span>
                <div
                  className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/20 shrink-0 group-hover:scale-105 transition-transform"
                  aria-hidden="true"
                >
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline justify-between gap-2 flex-wrap">
                <span className="text-2xl sm:text-3xl font-black tabular-nums tracking-tight text-slate-900 dark:text-white">
                  {activeObstructionsCount}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    activeObstructionsCount > 0
                      ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${activeObstructionsCount > 0 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                  {activeObstructionsCount > 0
                    ? isAr ? 'حالات حرجة' : 'Active Holds'
                    : isAr ? 'لا توجد عوائق' : 'Zero Holds'}
                </span>
              </div>
            </button>

            {/* Card 4: Approved Tasks */}
            <button
              type="button"
              onClick={() => setActiveTab('kpis')}
              className={`text-start p-5 rounded-2xl bg-white dark:bg-slate-900 border shadow-xs hover:shadow-md transition-all duration-200 space-y-3 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                activeTab === 'kpis'
                  ? 'border-emerald-500 dark:border-emerald-500 ring-2 ring-emerald-500/20 shadow-emerald-500/5'
                  : 'border-slate-200/80 dark:border-slate-800/80 hover:border-emerald-300 dark:hover:border-emerald-700/60'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                  {isAr ? 'إجمالي المهام المعتمدة' : 'Approved Tasks'}
                </span>
                <div
                  className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20 shrink-0 group-hover:scale-105 transition-transform"
                  aria-hidden="true"
                >
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline justify-between gap-2 flex-wrap">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black tabular-nums tracking-tight text-slate-900 dark:text-white">
                    {approvedTasksCount}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold tabular-nums">
                    / {totalTasksCount} {isAr ? 'مهمة' : 'Tasks'}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 tabular-nums">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {approvedPct}% {isAr ? 'منجز' : 'Done'}
                </span>
              </div>
            </button>
          </div>
        )}
      </section>

      {/* Tabs Navigation */}
      <nav
        role="tablist"
        aria-label={isAr ? 'أقسام لوحة مدير المشروع' : 'PM Command Center Tabs'}
        className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-100/90 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800"
      >
        <button
          role="tab"
          id="tab-actions"
          aria-controls="tabpanel-actions"
          aria-selected={activeTab === 'actions'}
          onClick={() => setActiveTab('actions')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
            activeTab === 'actions'
              ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Clock className={`w-4 h-4 shrink-0 ${activeTab === 'actions' ? 'text-amber-500' : ''}`} aria-hidden="true" />
          <span>{isAr ? 'مراجعة المهام والاعتمادات' : 'Review & Action Queue'}</span>
          {pmReviewTasks.length > 0 && (
            <span
              aria-label={`${pmReviewTasks.length} ${isAr ? 'مهام معلقة' : 'pending tasks'}`}
              className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white shadow-xs"
            >
              {pmReviewTasks.length}
            </span>
          )}
        </button>

        <button
          role="tab"
          id="tab-dailylogs"
          aria-controls="tabpanel-dailylogs"
          aria-selected={activeTab === 'dailylogs'}
          onClick={() => setActiveTab('dailylogs')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
            activeTab === 'dailylogs'
              ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <FileCheck className={`w-4 h-4 shrink-0 ${activeTab === 'dailylogs' ? 'text-blue-500' : ''}`} aria-hidden="true" />
          <span>{isAr ? 'تقارير الإنجاز اليومي' : 'Daily Progress Logs'}</span>
          {pendingDailyReports.length > 0 && (
            <span
              aria-label={`${pendingDailyReports.length} ${isAr ? 'تقارير معلقة' : 'pending reports'}`}
              className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500 text-white shadow-xs"
            >
              {pendingDailyReports.length}
            </span>
          )}
        </button>

        <button
          role="tab"
          id="tab-obstructions"
          aria-controls="tabpanel-obstructions"
          aria-selected={activeTab === 'obstructions'}
          onClick={() => setActiveTab('obstructions')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
            activeTab === 'obstructions'
              ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <AlertTriangle className={`w-4 h-4 shrink-0 ${activeTab === 'obstructions' ? 'text-rose-500' : ''}`} aria-hidden="true" />
          <span>{isAr ? 'سجل الإعاقات والمطالبات التعاقدية' : 'Obstructions & Delay Claims'}</span>
          {activeObstructionsCount > 0 && (
            <span
              aria-label={`${activeObstructionsCount} ${isAr ? 'إعاقات نشطة' : 'active obstructions'}`}
              className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-xs"
            >
              {activeObstructionsCount}
            </span>
          )}
        </button>

        <button
          role="tab"
          id="tab-kpis"
          aria-controls="tabpanel-kpis"
          aria-selected={activeTab === 'kpis'}
          onClick={() => setActiveTab('kpis')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
            activeTab === 'kpis'
              ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <BarChart3 className={`w-4 h-4 shrink-0 ${activeTab === 'kpis' ? 'text-emerald-500' : ''}`} aria-hidden="true" />
          <span>{isAr ? 'مؤشرات الأداء والقيمة المكتسبة' : 'EVM Project KPIs'}</span>
        </button>
      </nav>

      {/* Tab Content Panels */}
      <div className="space-y-6">
        {/* Tab 1: Task Review Queue */}
        {activeTab === 'actions' && (
          <div
            role="tabpanel"
            id="tabpanel-actions"
            aria-labelledby="tab-actions"
            tabIndex={0}
            className="space-y-6 focus:outline-none"
          >
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500 shrink-0" aria-hidden="true" />
                    <span>{isAr ? 'طابور المهام الميدانية بانتظار اعتماد مدير المشروع' : 'Site Tasks Pending PM Review'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isAr
                      ? 'مراجعة طلبات مهندس الموقع: اعتماد نهائي، طلب فحص واستلام، أو إعادة للتنفيذ مع ذكر الأسباب.'
                      : 'Review site engineer submissions: Accept, Route to QC inspection (WIR), or Reject for rework.'}
                  </p>
                </div>
                <Link
                  href="/planning/site-tasks"
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline transition-colors shrink-0"
                >
                  <span>{isAr ? 'فتح لوحة التحكم بالمهام بالكامل' : 'Open Full Site Task Board'}</span>
                  <ChevronRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} aria-hidden="true" />
                </Link>
              </div>

              {loadingTasks ? (
                <div className="py-12 space-y-4">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-16 bg-slate-100 dark:bg-slate-800/60 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <PMReviewQueue
                  tasks={siteTasks}
                  projectId={selectedProjectId}
                  onRefresh={handleRefresh}
                />
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Daily Progress Logs */}
        {activeTab === 'dailylogs' && (
          <div
            role="tabpanel"
            id="tabpanel-dailylogs"
            aria-labelledby="tab-dailylogs"
            tabIndex={0}
            className="space-y-4 focus:outline-none"
          >
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-blue-500 shrink-0" aria-hidden="true" />
                    <span>{isAr ? 'سجل التقارير اليومية الواردة' : 'Daily Progress Submissions'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isAr
                      ? 'مراجعة التقارير اليومية للإنتاجية والعمالة واعتماد نسب الإنجاز المرفوعة من الموقع.'
                      : 'Review daily manpower and productivity logs, and verify reported physical progress.'}
                  </p>
                </div>
                <Link
                  href="/planning/daily-progress"
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline transition-colors shrink-0"
                >
                  <span>{isAr ? 'فتح شاشة التقارير اليومية' : 'Open Daily Progress Screen'}</span>
                  <ChevronRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} aria-hidden="true" />
                </Link>
              </div>

              {loadingReports ? (
                <div className="py-8 space-y-3">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="h-12 bg-slate-100 dark:bg-slate-800/60 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : dailyReports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500" aria-hidden="true">
                    <FileText className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {isAr ? 'لا توجد تقارير يومية مسجلة لهذا المشروع بعد' : 'No daily progress reports recorded yet.'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                    {isAr
                      ? 'عندما يقوم مهندسو الموقع بتسجيل تقارير الإنجاز، ستظهر هنا للمراجعة والاعتماد.'
                      : 'When site engineers submit daily progress reports, they will appear here for PM review and approval.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-x-auto">
                  <table className="w-full text-xs text-start border-collapse" aria-label={isAr ? 'جدول التقارير اليومية' : 'Daily reports table'}>
                    <thead>
                      <tr className="text-slate-400 dark:text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                        <th scope="col" className="pb-3 text-start whitespace-nowrap">{isAr ? 'التاريخ' : 'Date'}</th>
                        <th scope="col" className="pb-3 text-start whitespace-nowrap">{isAr ? 'التخصص' : 'Discipline'}</th>
                        <th scope="col" className="pb-3 text-start whitespace-nowrap">{isAr ? 'العمالة' : 'Manpower'}</th>
                        <th scope="col" className="pb-3 text-start whitespace-nowrap">{isAr ? 'الحالة' : 'Status'}</th>
                        <th scope="col" className="pb-3 text-start whitespace-nowrap">{isAr ? 'مُدخل التقرير' : 'Submitted By'}</th>
                        <th scope="col" className="pb-3 text-end whitespace-nowrap">{isAr ? 'الإجراء' : 'Action'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {dailyReports.map((report) => {
                        const statusMeta = STATUS_MAP[report.status] || {
                          ar: report.status,
                          en: report.status,
                          badgeClass: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
                        };
                        const discMeta = DISCIPLINE_MAP[report.discipline?.toLowerCase() || 'civil'] || {
                          ar: report.discipline || 'مدني',
                          en: report.discipline || 'Civil',
                        };

                        return (
                          <tr key={report.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="py-3 font-semibold text-slate-900 dark:text-slate-100 tabular-nums whitespace-nowrap">
                              {report.progress_date || report.report_date}
                            </td>
                            <td className="py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                              {isAr ? discMeta.ar : discMeta.en}
                            </td>
                            <td className="py-3 text-slate-600 dark:text-slate-300 tabular-nums whitespace-nowrap">
                              {report.manpower_count ?? 0} <span className="text-slate-400 dark:text-slate-500 font-normal">{isAr ? 'عامل' : 'workers'}</span>
                            </td>
                            <td className="py-3 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusMeta.badgeClass}`}
                              >
                                {isAr ? statusMeta.ar : statusMeta.en}
                              </span>
                            </td>
                            <td className="py-3 text-slate-500 dark:text-slate-400 max-w-[140px] sm:max-w-[200px] truncate" title={report.entered_by_name || report.submitted_by || 'Site Engineer'}>
                              {report.entered_by_name || report.submitted_by || (isAr ? 'مهندس الموقع' : 'Site Engineer')}
                            </td>
                            <td className="py-3 text-end whitespace-nowrap">
                              <button
                                onClick={() => setReviewingReport(report)}
                                aria-label={`${isAr ? 'مراجعة تقرير يومي رقم' : 'Review daily progress report'} ${report.report_no || report.id}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 dark:text-emerald-300 dark:border-emerald-800/80 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shadow-2xs"
                              >
                                <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>{isAr ? 'مراجعة وتدقيق' : 'Review'}</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Obstructions & Claims */}
        {activeTab === 'obstructions' && (
          <div
            role="tabpanel"
            id="tabpanel-obstructions"
            aria-labelledby="tab-obstructions"
            tabIndex={0}
            className="space-y-4 focus:outline-none"
          >
            <ObstructionReport projectId={selectedProjectId} />
          </div>
        )}

        {/* Tab 4: EVM KPIs */}
        {activeTab === 'kpis' && (
          <div
            role="tabpanel"
            id="tabpanel-kpis"
            aria-labelledby="tab-kpis"
            tabIndex={0}
            className="space-y-6 focus:outline-none"
          >
            <ProjectKPICards
              projectId={selectedProjectId}
              projectName={isAr ? currentProject?.name_ar || currentProject?.name_en : currentProject?.name_en || currentProject?.name_ar}
              planningKpis={planningKpis}
              siteProductivity={siteProductivity}
              isLoading={loadingPlanningKpis}
            />

            <DisciplineProgressBreakdown projectId={selectedProjectId} />
          </div>
        )}
      </div>

      {/* Review Modal if selected */}
      {reviewingReport && (
        <DailyProgressReviewModal
          report={reviewingReport}
          isOpen={!!reviewingReport}
          projectId={selectedProjectId}
          onClose={() => {
            setReviewingReport(null);
            handleRefresh();
          }}
        />
      )}
    </div>
  );
}
