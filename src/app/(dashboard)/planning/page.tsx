'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  CalendarClock,
  FileSpreadsheet,
  ListTodo,
  GanttChartSquare,
  ClipboardCheck,
  Split,
  BarChart3,
  PackageCheck,
  ListOrdered,
  TrendingUp,
  FolderKanban,
  ShieldCheck,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowUpRight,
  Zap,
  RotateCw,
  Activity,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouteAccess } from '@/lib/hooks/useRouteAccess';
import { useProjectStore } from '@/lib/stores/useProjectStore';
import { ProjectService } from '@/lib/services/project.service';
import { Project } from '@/types';

type ModuleCategory = 'all' | 'core' | 'field' | 'commercial';
type ColorTheme = 'emerald' | 'blue' | 'purple' | 'amber' | 'teal';

interface PlanningModuleItem {
  id: string;
  title_ar: string;
  title_en: string;
  desc_ar: string;
  desc_en: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  category: Exclude<ModuleCategory, 'all'>;
  badge_ar: string;
  badge_en: string;
  color: ColorTheme;
}

const COLOR_STYLES: Record<
  ColorTheme,
  {
    iconBg: string;
    borderHover: string;
    badgeBg: string;
    titleHover: string;
    accentDot: string;
  }
> = {
  emerald: {
    iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white',
    borderHover: 'hover:border-emerald-500/40 dark:hover:border-emerald-500/40 hover:shadow-emerald-500/5',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    titleHover: 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400',
    accentDot: 'bg-emerald-500',
  },
  blue: {
    iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white',
    borderHover: 'hover:border-blue-500/40 dark:hover:border-blue-500/40 hover:shadow-blue-500/5',
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
    titleHover: 'group-hover:text-blue-600 dark:group-hover:text-blue-400',
    accentDot: 'bg-blue-500',
  },
  purple: {
    iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white',
    borderHover: 'hover:border-purple-500/40 dark:hover:border-purple-500/40 hover:shadow-purple-500/5',
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
    titleHover: 'group-hover:text-purple-600 dark:group-hover:text-purple-400',
    accentDot: 'bg-purple-500',
  },
  teal: {
    iconBg: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 group-hover:bg-teal-600 group-hover:text-white',
    borderHover: 'hover:border-teal-500/40 dark:hover:border-teal-500/40 hover:shadow-teal-500/5',
    badgeBg: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800',
    titleHover: 'group-hover:text-teal-600 dark:group-hover:text-teal-400',
    accentDot: 'bg-teal-500',
  },
  amber: {
    iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white',
    borderHover: 'hover:border-amber-500/40 dark:hover:border-amber-500/40 hover:shadow-amber-500/5',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    titleHover: 'group-hover:text-amber-600 dark:group-hover:text-amber-400',
    accentDot: 'bg-amber-500',
  },
};

export default function PlanningHubPage() {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const { canAccess, isLoading: isAccessLoading } = useRouteAccess();
  const { activeProjectId, setActiveProjectId } = useProjectStore();

  const [activeCategory, setActiveCategory] = useState<ModuleCategory>('all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(activeProjectId || '');

  // Two-way sync: Update local when store changes
  useEffect(() => {
    if (activeProjectId !== undefined && activeProjectId !== selectedProjectId) {
      setSelectedProjectId(activeProjectId || '');
    }
  }, [activeProjectId]);

  // Two-way sync: Update store when user changes project selection
  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
    setActiveProjectId(projectId);
  };

  // Fetch projects data for summary KPIs
  const loadProjects = async () => {
    setIsProjectsLoading(true);
    try {
      const data = await ProjectService.getProjects();
      setProjects(data || []);
    } catch {
      // Non-blocking fallback to empty state
      setProjects([]);
    } finally {
      setIsProjectsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const planningModules: PlanningModuleItem[] = useMemo(
    () => [
      {
        id: 'boq',
        title_ar: 'جدول الكميات والمقايسة التعاقدية',
        title_en: 'Bill of Quantities (BOQ)',
        desc_ar: 'إدارة البنود، الأسعار التعاقدية، وتفصيل قوائم المواد الخام ومكونات الأعمال',
        desc_en: 'Manage contractual line items, unit rates, and bill of materials (BOM)',
        href: '/boq',
        icon: FileSpreadsheet,
        active: true,
        category: 'commercial',
        badge_ar: 'مالي وتعاقدي',
        badge_en: 'Commercial',
        color: 'emerald',
      },
      {
        id: 'activities',
        title_ar: 'مكتبة الأنشطة القياسية ومراحل التنفيذ',
        title_en: 'Standard Activity Library',
        desc_ar: 'مكتبة الأنشطة الموحدة، وهيكل تجزئة العمل، والربط المباشر ببنود المقايسة',
        desc_en: 'Enterprise activity catalog, standard WBS codes, and BOQ linkages',
        href: '/planning/activities',
        icon: ListTodo,
        active: true,
        category: 'core',
        badge_ar: 'هندسي وتخطيط',
        badge_en: 'Engineering',
        color: 'blue',
      },
      {
        id: 'baseline',
        title_ar: 'الجدول الزمني والخط المرجعي المعتمد',
        title_en: 'Schedule Baseline & DCMA',
        desc_ar: 'استيراد مخططات البرمجة الزمنية والتحقق من صحة المسار الحرج والاشتراطات القياسية',
        desc_en: 'Import Primavera XER files and inspect DCMA 14-point schedule health',
        href: '/planning/baseline',
        icon: GanttChartSquare,
        active: true,
        category: 'core',
        badge_ar: 'برمجة زمنية',
        badge_en: 'Scheduling',
        color: 'purple',
      },
      {
        id: 'schedule-pulse',
        title_ar: 'استوديو نبض الجدول والتحليل المتقدم',
        title_en: 'EHS Schedule Pulse Studio',
        desc_ar: 'محرك التحليل الجنائي للمخططات الزمنية، واختبارات الجودة ومحاكاة التأخيرات والتمديد الزمني',
        desc_en: 'Forensic Primavera P6 analytics, DCMA-14 health audit, and delay / EOT simulation',
        href: '/schedule-pulse',
        icon: Activity,
        active: true,
        category: 'core',
        badge_ar: 'تحليل متقدم',
        badge_en: 'Forensic Studio',
        color: 'emerald',
      },
      {
        id: 'daily-progress',
        title_ar: 'التقدم والتقرير اليومي للموقع',
        title_en: 'Daily Site Progress',
        desc_ar: 'تسجيل تقدم الأعمال بالموقع، نسب الإنجاز الفعلي واعتماد التقارير اليومية',
        desc_en: 'Log field progress, physical completion percentages, and daily approvals',
        href: '/planning/daily-progress',
        icon: ClipboardCheck,
        active: true,
        category: 'field',
        badge_ar: 'ميداني وتنفيذي',
        badge_en: 'Field Operations',
        color: 'teal',
      },
      {
        id: 'allocation',
        title_ar: 'توزيع الكميات اليومية والمطابقة',
        title_en: 'Daily Quantity Allocations',
        desc_ar: 'توزيع كميات التنفيذ اليومية على الأنشطة المعتمدة وتفادي التكرار',
        desc_en: 'Allocate daily executed quantities across approved activities without overlap',
        href: '/planning/allocation',
        icon: Split,
        active: true,
        category: 'field',
        badge_ar: 'كميات ومطابقة',
        badge_en: 'Allocations',
        color: 'amber',
      },
      {
        id: 'site-tasks',
        title_ar: 'لوحة التحكم بمهام الموقع والتنفيذ',
        title_en: 'Site Tasks Control Board',
        desc_ar: 'إدارة وتوجيه مهام التنفيذ الميدانية وربطها بالمخططات وحالة المهندس',
        desc_en: 'Direct field execution tasks, drawing assignments, and engineer status',
        href: '/planning/site-tasks',
        icon: ListOrdered,
        active: true,
        category: 'field',
        badge_ar: 'تحكم موقع',
        badge_en: 'Site Control',
        color: 'teal',
      },
      {
        id: 'dashboard',
        title_ar: 'لوحة التخطيط ومؤشرات القيمة المكتسبة',
        title_en: 'EVM Analytics & Planning Dashboard',
        desc_ar: 'مؤشرات كفاءة التكلفة والجدول الزمني، ومنحنيات التدفق التراكمي ومتابعة المشاريع الجارية',
        desc_en: 'Earned Value Management (CPI/SPI), S-Curve analytics, and active projects track',
        href: '/planning/dashboard',
        icon: BarChart3,
        active: true,
        category: 'core',
        badge_ar: 'تحليل أداء',
        badge_en: 'Analytics',
        color: 'blue',
      },
      {
        id: 'deliverables',
        title_ar: 'متابعة التسليمات والاعتمادات الهندسية',
        title_en: 'Engineering Deliverables (E1/E2)',
        desc_ar: 'لوحة متابعة اعتماد الرسومات التنفيذية والعينات وردود الاستشاري',
        desc_en: 'Track shop drawing submittals, material approvals, and consultant feedback',
        href: '/deliverables',
        icon: PackageCheck,
        active: true,
        category: 'commercial',
        badge_ar: 'تسليمات وتنسيق',
        badge_en: 'Deliverables',
        color: 'emerald',
      },
    ],
    []
  );

  // RBAC: filter modules accessible by current user
  const visibleModules = useMemo(
    () => planningModules.filter((item) => canAccess(item.href)),
    [planningModules, canAccess]
  );

  const filteredModules = useMemo(() => {
    if (activeCategory === 'all') return visibleModules;
    return visibleModules.filter((m) => m.category === activeCategory);
  }, [visibleModules, activeCategory]);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId),
    [projects, selectedProjectId]
  );

  // Compute high-level project controls summary
  const summaryMetrics = useMemo(() => {
    const relevantProjects = selectedProjectId
      ? projects.filter((p) => p.id === selectedProjectId)
      : projects;
    const activeProjects = relevantProjects.filter(
      (p) => p.status === 'working' || p.status === 'handing_over'
    );
    const activeCount = activeProjects.length;
    const avgProgress =
      activeCount > 0
        ? Math.round(
            activeProjects.reduce(
              (sum, p) =>
                sum +
                Number(
                  (p as unknown as Record<string, unknown>).completion_pct ??
                    (p as unknown as Record<string, unknown>).progress ??
                    0
                ),
              0
            ) / activeCount
          )
        : selectedProject
        ? Number(
            (selectedProject as unknown as Record<string, unknown>).completion_pct ??
              (selectedProject as unknown as Record<string, unknown>).progress ??
              0
          )
        : 0;

    return {
      activeProjectsCount: activeCount,
      totalProjectsCount: projects.length,
      avgProgress,
      modulesAvailable: visibleModules.length,
      totalModules: planningModules.length,
    };
  }, [projects, selectedProjectId, selectedProject, visibleModules, planningModules]);

  // Append active project context to module navigation URLs
  const getHrefWithProject = (baseHref: string) => {
    if (!selectedProjectId) return baseHref;
    const separator = baseHref.includes('?') ? '&' : '?';
    return `${baseHref}${separator}projectId=${encodeURIComponent(selectedProjectId)}`;
  };

  // Quick Action Shortcuts
  const quickActions = [
    {
      label_ar: 'تسجيل تقدم يومي',
      label_en: 'Log Daily Progress',
      href: '/planning/daily-progress',
      icon: ClipboardCheck,
    },
    {
      label_ar: 'فحص الخط المرجعي والجدول',
      label_en: 'Validate Baseline',
      href: '/planning/baseline',
      icon: GanttChartSquare,
    },
    {
      label_ar: 'توزيع الكميات المنجزة',
      label_en: 'Allocate Quantities',
      href: '/planning/allocation',
      icon: Split,
    },
    {
      label_ar: 'لوحة القيمة المكتسبة ومنحنى التقدم',
      label_en: 'EVM Dashboard',
      href: '/planning/dashboard',
      icon: BarChart3,
    },
    {
      label_ar: 'اعتمادات وتسليمات هندسية',
      label_en: 'Submittals E1/E2',
      href: '/deliverables',
      icon: PackageCheck,
    },
  ].filter((qa) => canAccess(qa.href));

  // Loading skeleton while permissions or projects initialize
  if (isAccessLoading && isProjectsLoading) {
    return <PlanningHubSkeleton isAr={isAr} />;
  }

  const ChevronIcon = isAr ? ChevronLeft : ChevronRight;

  return (
    <main
      id="planning-hub-main"
      className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-start"
      dir={isAr ? 'rtl' : 'ltr'}
      aria-labelledby="planning-hub-title"
      role="main"
    >
      {/* ── 1. Executive Banner & Header ────────────────────────────────────── */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 p-6 sm:p-8 text-white shadow-xl border border-emerald-900/40">
        {/* Subtle decorative glow */}
        <div
          className="absolute -top-24 -end-24 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-24 -start-24 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
              <CalendarClock className="w-3.5 h-3.5" aria-hidden="true" />
              <span>
                {isAr
                  ? 'منظومة إدارة التخطيط والمكتب الفني'
                  : 'Planning & Project Controls Hub'}
              </span>
            </div>
            <h1
              id="planning-hub-title"
              className={`text-2xl sm:text-3xl font-black text-white ${isAr ? 'tracking-normal' : 'tracking-tight'}`}
            >
              {isAr
                ? 'مركز إدارة التخطيط والمكتب الفني'
                : 'Planning & Technical Office Center'}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              {isAr
                ? 'المنصة المتكاملة للتحكم بالجداول الزمنية، والمقايسات التعاقدية، والتقارير الميدانية اليومية، والتسليمات الهندسية وفق منهجيات القيمة المكتسبة وضوابط الجودة المعتمدة.'
                : 'The unified platform for schedule control, BOQ items, daily field progress, and engineering deliverables aligned with DCMA and EVM standards.'}
            </p>

            {selectedProject && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
                <span>
                  {isAr ? 'المشروع النشط المحدد:' : 'Active Selected Project:'}{' '}
                  <strong className="text-white font-bold">{selectedProject.name_ar || selectedProject.project_name || selectedProject.name_en}</strong>
                  {selectedProject.code && ` (${selectedProject.code})`}
                </span>
                <button
                  type="button"
                  onClick={() => handleProjectChange('')}
                  className="ms-1.5 text-xs text-emerald-300 hover:text-white underline transition-colors"
                >
                  {isAr ? 'عرض الكل' : 'Clear'}
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
            {/* Project Selector Two-Way Synced with useProjectStore */}
            <div className="relative">
              <label htmlFor="planning-project-select" className="sr-only">
                {isAr ? 'اختر المشروع النشط' : 'Select active project'}
              </label>
              <div className="relative flex items-center">
                <FolderKanban
                  className="w-4 h-4 absolute start-3 text-emerald-400 pointer-events-none"
                  aria-hidden="true"
                />
                <select
                  id="planning-project-select"
                  value={selectedProjectId}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  className="h-9 ps-9 pe-8 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-100 border border-emerald-500/30 text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 appearance-none cursor-pointer min-w-[190px] max-w-[280px] truncate"
                >
                  <option value="" className="bg-slate-900 text-slate-200">
                    {isAr ? 'جميع المشاريع (عرض عام)' : 'All Projects (Overview)'}
                  </option>
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id} className="bg-slate-900 text-slate-200">
                      {proj.name_ar || proj.project_name || proj.name_en}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="w-3.5 h-3.5 absolute end-2.5 text-slate-400 pointer-events-none"
                  aria-hidden="true"
                />
              </div>
            </div>

            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-900/60 border border-emerald-700/50 text-xs font-bold text-emerald-300 shadow-sm"
              aria-label={
                isAr
                  ? `${summaryMetrics.modulesAvailable} من أصل ${summaryMetrics.totalModules} وحدات متاحة`
                  : `${summaryMetrics.modulesAvailable} of ${summaryMetrics.totalModules} modules accessible`
              }
            >
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>
                {summaryMetrics.modulesAvailable}/{summaryMetrics.totalModules}{' '}
                {isAr ? 'وحدات مفعلة' : 'Modules Active'}
              </span>
            </span>

            <button
              onClick={loadProjects}
              title={isAr ? 'تحديث مؤشرات التخطيط' : 'Refresh planning metrics'}
              aria-label={isAr ? 'تحديث مؤشرات التخطيط' : 'Refresh planning metrics'}
              className="h-9 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <RotateCw
                className={`w-3.5 h-3.5 ${isProjectsLoading ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span className="hidden sm:inline">
                {isAr ? 'تحديث' : 'Refresh'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* ── 2. Progress Summary Cards (KPIs) ────────────────────────────────── */}
      <section
        aria-label={isAr ? 'مؤشرات الأداء العامة' : 'Performance Overview'}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Active Projects / Selected Project */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {selectedProject
                ? isAr
                  ? 'المشروع النشط المحدد'
                  : 'Active Selected Project'
                : isAr
                ? 'المشاريع الجارية تحت المتابعة'
                : 'Active Tracked Projects'}
            </span>
            <div
              className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              aria-hidden="true"
            >
              <FolderKanban className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white truncate max-w-[200px]">
              {isProjectsLoading
                ? '—'
                : selectedProject
                ? selectedProject.code || selectedProject.name_ar || selectedProject.project_name || selectedProject.name_en
                : summaryMetrics.activeProjectsCount}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold truncate">
              {selectedProject
                ? isAr
                  ? selectedProject.status === 'working'
                    ? 'قيد التنفيذ'
                    : selectedProject.status === 'handing_over'
                    ? 'مرحلة التسليم'
                    : 'نشط'
                  : selectedProject.status
                : isAr
                ? `من إجمالي ${summaryMetrics.totalProjectsCount} مشروع`
                : `of ${summaryMetrics.totalProjectsCount}`}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 truncate">
            {selectedProject
              ? selectedProject.name_ar || selectedProject.project_name || selectedProject.name_en
              : isAr
              ? 'قيد التنفيذ الفعلي والتسليم'
              : 'Under active execution'}
          </p>
        </div>

        {/* Physical Progress */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAr ? 'نسبة الإنجاز الفعلي' : 'Physical Progress'}
            </span>
            <div
              className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400"
              aria-hidden="true"
            >
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {isProjectsLoading ? '—' : `${summaryMetrics.avgProgress}%`}
            </span>
            <span className="text-xs text-teal-600 dark:text-teal-400 font-semibold">
              {isAr ? 'إنجاز موقع' : 'Actual'}
            </span>
          </div>
          <div
            className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={summaryMetrics.avgProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={isAr ? 'نسبة الإنجاز الفعلي' : 'Completion progress'}
          >
            <div
              className="bg-teal-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, summaryMetrics.avgProgress))}%` }}
            />
          </div>
        </div>

        {/* Accessible Modules */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAr ? 'الأدوات والوحدات المتاحة' : 'Accessible Modules'}
            </span>
            <div
              className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400"
              aria-hidden="true"
            >
              <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {summaryMetrics.modulesAvailable}
            </span>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
              {isAr
                ? `من أصل ${summaryMetrics.totalModules}`
                : `of ${summaryMetrics.totalModules}`}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {isAr ? 'صلاحيات وصول مفعلة' : 'Role-based access active'}
          </p>
        </div>

        {/* Schedule & Baseline Health */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAr ? 'جودة الجدول والخط المرجعي' : 'Baseline & Schedule Health'}
            </span>
            <div
              className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400"
              aria-hidden="true"
            >
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400">
              {isAr ? 'معتمد بالكامل' : 'DCMA-14'}
            </span>
            <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
              {isAr ? 'مطابق للمعايير القياسية' : 'Compliant'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {isAr ? 'مطابقة بروتوكولات التأخير والتدقيق الفني' : 'Primavera XER & SCL Protocol'}
          </p>
        </div>
      </section>

      {/* ── 3. Quick Action Links Strip ────────────────────────────────────── */}
      {quickActions.length > 0 && (
        <section
          aria-label={isAr ? 'روابط الوصول السريع' : 'Quick Action Shortcuts'}
          className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2.5"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Zap className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
            <span>{isAr ? 'إجراءات تشغيلية سريعة:' : 'Quick Operational Actions:'}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((qa) => {
              const QAIcon = qa.icon;
              return (
                <Link
                  key={qa.href}
                  href={getHrefWithProject(qa.href)}
                  aria-label={isAr ? qa.label_ar : qa.label_en}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                >
                  <QAIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  <span>{isAr ? qa.label_ar : qa.label_en}</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-500" aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── 4. Main Modules Hub ────────────────────────────────────────────── */}
      <section
        aria-label={isAr ? 'وحدات منظومة التخطيط' : 'Planning Modules Hub'}
        className="space-y-4"
      >
        {/* Category Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              {isAr ? 'وحدات وأدوات التخطيط والمكتب الفني' : 'Planning & Technical Office Modules'}
            </h2>
          </div>

          <div
            className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl"
            role="tablist"
            aria-label={isAr ? 'تصفية وحدات التخطيط' : 'Filter planning modules'}
          >
            {[
              { id: 'all', label_ar: 'الكل', label_en: 'All' },
              { id: 'core', label_ar: 'البرمجة والتخطيط', label_en: 'Core Planning' },
              { id: 'field', label_ar: 'التنفيذ والموقع', label_en: 'Field Execution' },
              { id: 'commercial', label_ar: 'الكميات والتسليمات', label_en: 'Commercial & Deliverables' },
            ].map((tab) => {
              const isSelected = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setActiveCategory(tab.id as ModuleCategory)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                    isSelected
                      ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {isAr ? tab.label_ar : tab.label_en}
                </button>
              );
            })}
          </div>
        </div>

        {/* Modules Grid */}
        {filteredModules.length === 0 ? (
          <div
            className="text-center py-16 px-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-sm space-y-2"
            role="status"
          >
            <ShieldCheck className="w-8 h-8 mx-auto text-slate-400/60" aria-hidden="true" />
            <p className="font-semibold text-slate-600 dark:text-slate-300">
              {isAr
                ? 'لا توجد وحدات متاحة لصلاحياتك الحالية في هذا التصنيف'
                : 'No modules available for your current role in this category'}
            </p>
            <p className="text-xs text-slate-400">
              {isAr
                ? 'يرجى مراجعة مسؤول النظام للتحقق من صلاحيات الأدوار الموكلة إليك.'
                : 'Contact system administrator to verify your role access permissions.'}
            </p>
          </div>
        ) : (
          <nav
            aria-label={isAr ? 'روابط وحدات التخطيط' : 'Planning module cards'}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredModules.map((item) => {
              const Icon = item.icon;
              const colorStyle = COLOR_STYLES[item.color];
              const title = isAr ? item.title_ar : item.title_en;
              const desc = isAr ? item.desc_ar : item.desc_en;
              const badge = isAr ? item.badge_ar : item.badge_en;

              return (
                <Link
                  key={item.href}
                  href={getHrefWithProject(item.href)}
                  aria-label={`${title} - ${desc}`}
                  className={`group relative p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${colorStyle.borderHover} shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900`}
                >
                  <div>
                    {/* Header Row: Icon + Badge + Active Dot */}
                    <div className="flex items-start justify-between gap-3 mb-3.5">
                      <div
                        className={`p-2.5 rounded-xl ${colorStyle.iconBg} transition-colors duration-200 shadow-sm`}
                        aria-hidden="true"
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colorStyle.badgeBg}`}
                        >
                          {badge}
                        </span>
                        {item.active && (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400"
                            title={isAr ? 'نشط ومتاح' : 'Active and available'}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${colorStyle.accentDot}`}
                              aria-hidden="true"
                            />
                            <span className="sr-only">
                              {isAr ? 'نشط' : 'Active'}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <h3
                      className={`text-sm font-bold text-slate-900 dark:text-white ${colorStyle.titleHover} transition-colors line-clamp-1`}
                    >
                      {title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                      {desc}
                    </p>
                  </div>

                  {/* Footer Arrow & Action Prompt */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-bold text-slate-400 group-hover:text-slate-700 dark:text-slate-300 dark:group-hover:text-slate-200 transition-colors">
                    <span>{isAr ? 'فتح الوحدة' : 'Open Module'}</span>
                    <ChevronIcon
                      className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1 rtl:group-hover:-translate-x-1 ltr:group-hover:translate-x-1 text-slate-400 group-hover:text-emerald-500"
                      aria-hidden="true"
                    />
                  </div>
                </Link>
              );
            })}
          </nav>
        )}
      </section>
    </main>
  );
}

// ── Accessible Loading Skeleton ─────────────────────────────────────────────
function PlanningHubSkeleton({ isAr }: { isAr: boolean }) {
  return (
    <div
      className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-pulse"
      dir={isAr ? 'rtl' : 'ltr'}
      role="status"
      aria-label={isAr ? 'جاري تحميل لوحة التخطيط...' : 'Loading planning hub...'}
    >
      {/* Banner Skeleton */}
      <div className="h-36 rounded-3xl bg-slate-200 dark:bg-slate-800 p-6 space-y-3">
        <div className="h-5 w-40 bg-slate-300 dark:bg-slate-700 rounded-full" />
        <div className="h-8 w-72 bg-slate-300 dark:bg-slate-700 rounded-lg" />
        <div className="h-4 w-96 bg-slate-300 dark:bg-slate-700 rounded" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-800 p-4 space-y-2.5"
          >
            <div className="flex justify-between items-center">
              <div className="h-3.5 w-24 bg-slate-300 dark:bg-slate-700 rounded" />
              <div className="h-7 w-7 rounded-xl bg-slate-300 dark:bg-slate-700" />
            </div>
            <div className="h-7 w-16 bg-slate-300 dark:bg-slate-700 rounded" />
            <div className="h-2.5 w-28 bg-slate-300 dark:bg-slate-700 rounded" />
          </div>
        ))}
      </div>

      {/* Quick Action Strip Skeleton */}
      <div className="h-16 rounded-2xl bg-slate-200 dark:bg-slate-800 p-4 flex gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-8 w-28 rounded-xl bg-slate-300 dark:bg-slate-700"
          />
        ))}
      </div>

      {/* Module Grid Skeleton */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-44 rounded-2xl bg-slate-200 dark:bg-slate-800 p-5 space-y-3"
            >
              <div className="flex justify-between">
                <div className="h-10 w-10 rounded-xl bg-slate-300 dark:bg-slate-700" />
                <div className="h-5 w-16 rounded-full bg-slate-300 dark:bg-slate-700" />
              </div>
              <div className="h-5 w-40 bg-slate-300 dark:bg-slate-700 rounded" />
              <div className="h-3.5 w-full bg-slate-300 dark:bg-slate-700 rounded" />
              <div className="h-3.5 w-3/4 bg-slate-300 dark:bg-slate-700 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}