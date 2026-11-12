'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { 
  BarChart3, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  RotateCcw, 
  Building2, 
  ArrowLeft, 
  RefreshCw, 
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  Layers,
  Eye,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  FileSpreadsheet,
  X,
  ExternalLink,
  Inbox,
  User,
  AlertCircle
} from 'lucide-react';
import { CooDeliverablesSummary, Deliverable, DeliverableKind, DeliverableStatus } from '@/types/planning';
import { Project } from '@/types';
import { DeliverablesService } from '@/lib/services/deliverables.service';
import { ProjectService } from '@/lib/services/project.service';
import { DeliverableDetailDrawer } from './DeliverableDetailDrawer';
import { COOExecutiveRadar } from '@/components/technical-office/COOExecutiveRadar';
import { useLanguage } from '@/contexts/LanguageContext';
import { logger } from '@/lib/logger';

interface CooDeliverablesDashboardProps {
  initialProjectId?: string;
}

export const CooDeliverablesDashboard: React.FC<CooDeliverablesDashboardProps> = ({
  initialProjectId,
}) => {
  const { locale, dir } = useLanguage();
  const isAr = locale === 'ar';

  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || 'all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [summary, setSummary] = useState<CooDeliverablesSummary | null>(null);
  const [allDeliverables, setAllDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);

  // Table filtering and search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [kindFilter, setKindFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Drawer modal state for deliverable details
  const [selectedDrawerDeliverableId, setSelectedDrawerDeliverableId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Accessible screen reader live announcement state
  const [announcement, setAnnouncement] = useState<string>('');

  // Fetch projects and deliverables
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setAnnouncement(
      isAr
        ? 'جاري تحميل بيانات حزم التسليمات والمحفظة التنفيذية...'
        : 'Loading executive deliverables portfolio data...'
    );
    try {
      const [projList, summ, delivs] = await Promise.all([
        ProjectService.getProjects(),
        DeliverablesService.getCooDeliverablesSummary(
          selectedProjectId === 'all' ? undefined : selectedProjectId
        ),
        DeliverablesService.getDeliverables(
          selectedProjectId === 'all' ? '' : selectedProjectId
        ),
      ]);
      setProjects(projList);
      setSummary(summ);
      setAllDeliverables(delivs);
      setAnnouncement(
        isAr
          ? `تم اكتمال التحميل. يتوفر ${delivs.length} حزمة تسليمات في النطاق المحدد.`
          : `Loading complete. ${delivs.length} deliverables available in the selected scope.`
      );
    } catch (err) {
      logger.error('Failed to load COO dashboard data', { detail: err });
      setAnnouncement(
        isAr
          ? 'حدث خطأ أثناء تحميل بيانات التسليمات. يرجى إعادة المحاولة.'
          : 'Error loading deliverables data. Please retry.'
      );
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId, isAr]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Project map for quick lookup
  const projectMap = useMemo(() => {
    const map = new Map<string, Project>();
    projects.forEach((p) => map.set(p.id, p));
    return map;
  }, [projects]);

  const getProjectName = useCallback((projectId: string) => {
    const p = projectMap.get(projectId);
    if (isAr) {
      return p?.project_name_ar || p?.project_name || p?.project_code || 'مشروع غير محدد';
    }
    return p?.project_name || p?.project_name_ar || p?.project_code || 'Unspecified Project';
  }, [projectMap, isAr]);

  // Delayed submission calculation helper
  const getDelayedInfo = useCallback((d: Deliverable) => {
    if (!d.due_date) return { isOverdue: false, isDueSoon: false, days: 0 };
    const dueMs = new Date(d.due_date).getTime();
    if (isNaN(dueMs)) return { isOverdue: false, isDueSoon: false, days: 0 };

    const now = Date.now();
    const diffDays = Math.ceil((dueMs - now) / (1000 * 60 * 60 * 24));
    const isCompleted = d.status === 'returned' || d.status === 'approved';

    if (!isCompleted && diffDays < 0) {
      return { isOverdue: true, isDueSoon: false, days: Math.abs(diffDays) };
    }
    if (!isCompleted && diffDays >= 0 && diffDays <= 3) {
      return { isOverdue: false, isDueSoon: true, days: diffDays };
    }
    return { isOverdue: false, isDueSoon: false, days: diffDays };
  }, []);

  // Total overdue count across current deliverables list
  const overdueCount = useMemo(() => {
    return allDeliverables.filter((d) => getDelayedInfo(d).isOverdue).length;
  }, [allDeliverables, getDelayedInfo]);

  // On-time percentage calculation
  const onTimePct = useMemo(() => {
    if (!summary || summary.total_deliverables === 0) return 100;
    const delayedCount = summary.blocked_count + overdueCount;
    const ratio = ((summary.total_deliverables - Math.min(summary.total_deliverables, delayedCount)) / summary.total_deliverables) * 100;
    return Math.max(0, Math.min(100, Number(ratio.toFixed(1))));
  }, [summary, overdueCount]);

  // Revision Progression (Rev 0 vs Rev 1 vs Rev 2+)
  const revisionBreakdown = useMemo(() => {
    let rev0 = 0;
    let rev1 = 0;
    let rev2Plus = 0;

    for (const d of allDeliverables) {
      for (const item of d.items || []) {
        if (item.current_rev === 0) rev0++;
        else if (item.current_rev === 1) rev1++;
        else rev2Plus++;
      }
    }

    const totalSheets = rev0 + rev1 + rev2Plus;
    return {
      rev0,
      rev1,
      rev2Plus,
      totalSheets,
      rev0Pct: totalSheets > 0 ? ((rev0 / totalSheets) * 100).toFixed(1) : '0',
      rev1Pct: totalSheets > 0 ? ((rev1 / totalSheets) * 100).toFixed(1) : '0',
      rev2PlusPct: totalSheets > 0 ? ((rev2Plus / totalSheets) * 100).toFixed(1) : '0',
    };
  }, [allDeliverables]);

  // Average Cycle Duration in Days
  const avgCycleDurationDays = useMemo(() => {
    const closed = allDeliverables.filter((d) => (d.status === 'returned' || d.status === 'approved') && d.received_at && d.updated_at);
    if (closed.length === 0) return 0;
    const totalDays = closed.reduce((acc, d) => {
      const start = new Date(d.received_at).getTime();
      const end = new Date(d.updated_at || '').getTime();
      return acc + Math.max(0, Math.floor((end - start) / (1000 * 60 * 60 * 24)));
    }, 0);
    return Number((totalDays / closed.length).toFixed(1));
  }, [allDeliverables]);

  // Approval chain stage helper
  const getApprovalStageInfo = useCallback((d: Deliverable) => {
    const items = d.items || [];
    const codeC = items.find((i) => i.consultant_status === 'C');
    const codeD = items.find((i) => i.consultant_status === 'D');
    const codeA = items.find((i) => i.consultant_status === 'A');
    const codeB = items.find((i) => i.consultant_status === 'B');

    let stageNumber = 1;
    let stageLabel = isAr ? 'استلام وتجهيز المكتب الفني' : 'Technical Office Preparation';

    if (d.status === 'in_progress') {
      stageNumber = 2;
      stageLabel = isAr ? 'قيد الإعداد والدراسة الهندسية' : 'Engineering & Shop Drawing';
    } else if (d.status === 'ready_to_return') {
      stageNumber = 3;
      stageLabel = isAr ? 'مراجعة واعتماد مدير المكتب الفني' : 'TO Manager Review';
    } else if (d.status === 'returned' || d.status === 'approved') {
      stageNumber = 4;
      stageLabel = isAr ? 'قيد اعتماد المهندس الاستشاري' : 'Consultant Review & Approval';
    } else if (d.status === 'blocked') {
      stageLabel = isAr ? 'معطلة بمانع يتطلب التدخل' : 'Blocked & Awaiting Action';
    }

    return {
      stageNumber,
      stageLabel,
      hasCodeC: !!codeC,
      hasCodeD: !!codeD,
      hasCodeA: !!codeA,
      hasCodeB: !!codeB,
      consultantCode: codeC ? 'C' : codeD ? 'D' : codeB ? 'B' : codeA ? 'A' : null,
      codeCRevision: codeC?.submission_revision || 1,
    };
  }, [isAr]);

  // Filtered deliverables list
  const filteredDeliverables = useMemo(() => {
    return allDeliverables.filter((d) => {
      // Kind Filter
      if (kindFilter !== 'all' && d.kind !== kindFilter) return false;

      // Priority Filter
      if (priorityFilter !== 'all' && d.priority !== priorityFilter) return false;

      // Status / Custom Flags Filter
      if (statusFilter === 'overdue') {
        const delayed = getDelayedInfo(d);
        if (!delayed.isOverdue) return false;
      } else if (statusFilter === 'blocked') {
        if (d.status !== 'blocked') return false;
      } else if (statusFilter === 'code_c') {
        const stage = getApprovalStageInfo(d);
        if (!stage.hasCodeC) return false;
      } else if (statusFilter === 'ready_to_return') {
        if (d.status !== 'ready_to_return') return false;
      } else if (statusFilter === 'in_progress') {
        if (d.status !== 'in_progress') return false;
      } else if (statusFilter === 'returned') {
        if (d.status !== 'returned' && d.status !== 'approved') return false;
      }

      // Text Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchRef = d.ref_code?.toLowerCase().includes(q);
        const matchTitleAr = d.title_ar?.toLowerCase().includes(q);
        const matchTitleEn = d.title_en?.toLowerCase().includes(q);
        const matchHolder = d.current_holder?.name_ar?.toLowerCase().includes(q) || d.current_holder?.name_en?.toLowerCase().includes(q);
        const matchBlocked = d.blocked_reason?.toLowerCase().includes(q);
        const matchProject = getProjectName(d.project_id).toLowerCase().includes(q);

        if (!matchRef && !matchTitleAr && !matchTitleEn && !matchHolder && !matchBlocked && !matchProject) {
          return false;
        }
      }

      return true;
    });
  }, [allDeliverables, kindFilter, priorityFilter, statusFilter, searchQuery, getDelayedInfo, getApprovalStageInfo, getProjectName]);

  // Reset to page 1 on filter or query change
  useEffect(() => {
    setCurrentPage(1);
    if (!loading) {
      setAnnouncement(
        isAr
          ? `تمت تصفية النتائج: عرض ${filteredDeliverables.length} حزمة تسليمات.`
          : `Results filtered: showing ${filteredDeliverables.length} deliverables.`
      );
    }
  }, [searchQuery, statusFilter, kindFilter, priorityFilter, filteredDeliverables.length, loading, isAr]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredDeliverables.length / pageSize));
  const paginatedDeliverables = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDeliverables.slice(start, start + pageSize);
  }, [filteredDeliverables, currentPage, pageSize]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    setAnnouncement(
      isAr
        ? `الانتقال إلى الصفحة ${newPage} من ${totalPages}.`
        : `Navigating to page ${newPage} of ${totalPages}.`
    );
  };

  const handleOpenDetail = (deliverableId: string) => {
    setSelectedDrawerDeliverableId(deliverableId);
    setIsDrawerOpen(true);
  };

  const handleDeliverableUpdated = (updated: Deliverable) => {
    setAllDeliverables((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      case 'low':
        return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
      case 'normal':
      default:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    }
  };

  const getKindBadgeClass = (kind: DeliverableKind) => {
    switch (kind) {
      case 'E1':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'E2':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'material_list':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'drawing_list':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Accessible live announcement region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only" role="status">
        {announcement}
      </div>

      {/* Top Filter & Project Switcher */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/20">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {isAr
                  ? 'لوحة المتابعة التنفيذية للتسليمات والمخرجات الهندسية'
                  : 'Executive Deliverables Portfolio Dashboard'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950/60 dark:text-fuchsia-300 border border-fuchsia-200 dark:border-fuchsia-800">
                {isAr ? 'المستوى القيادي التنفيذي' : 'Executive Tier'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isAr
                ? 'متابعة أعمار الحزم الهندسية والتنفيذية، ورصد الاختناقات، وسلسلة الاعتمادات ومصفوفة التقديمات عبر كامل المحفظة'
                : 'Monitoring package lifecycles, bottlenecks, approval chains, and submittal matrix across portfolio'}
            </p>
          </div>
        </div>

        {/* Project Selector & Refresh */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
            <select
              id="project-selector"
              aria-label={isAr ? 'اختيار المشروع أو المحفظة' : 'Select project or portfolio'}
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 transition cursor-pointer"
            >
              <option value="all">
                {isAr ? '🌐 كامل محفظة المشاريع' : '🌐 All Projects Portfolio'}
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {isAr ? (p.project_name_ar || p.project_name || p.project_code) : (p.project_name || p.project_name_ar || p.project_code)}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchDashboardData}
            disabled={loading}
            aria-label={isAr ? 'تحديث بيانات لوحة التسليمات' : 'Refresh deliverables dashboard'}
            className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500"
            title={isAr ? 'تحديث البيانات' : 'Refresh Data'}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-fuchsia-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* COO Operations & Accountability Radar (Live Roster, Whose Court is the Ball In, Granular Blockers) */}
      <COOExecutiveRadar
        deliverables={allDeliverables}
        projects={projects}
        onRefresh={fetchDashboardData}
        selectedProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
      />

      {/* Aggregate KPI Strip (8 Cards) */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="p-4 rounded-3xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 h-24 flex flex-col justify-center items-center space-y-2">
              <div className="w-16 h-3 bg-slate-200 dark:bg-slate-700 rounded-md" />
              <div className="w-10 h-6 bg-slate-300 dark:bg-slate-600 rounded-md" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {/* 1. Total */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setStatusFilter('all')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setStatusFilter('all'); }}
            className={`p-4 rounded-3xl bg-white dark:bg-slate-900 border text-center space-y-1 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
              statusFilter === 'all'
                ? 'border-fuchsia-500 ring-2 ring-fuchsia-500/20 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 shadow-xs'
            }`}
          >
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {isAr ? 'إجمالي الحزم' : 'Total Packages'}
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
              {summary?.total_deliverables || 0}
            </div>
          </div>

          {/* 2. In Progress */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setStatusFilter(statusFilter === 'in_progress' ? 'all' : 'in_progress')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setStatusFilter(statusFilter === 'in_progress' ? 'all' : 'in_progress'); }}
            className={`p-4 rounded-3xl bg-white dark:bg-slate-900 border text-center space-y-1 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
              statusFilter === 'in_progress'
                ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 shadow-xs'
            }`}
          >
            <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              {isAr ? 'قيد العمل' : 'In Progress'}
            </div>
            <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
              {summary?.in_progress_count || 0}
            </div>
          </div>

          {/* 3. Blocked */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setStatusFilter(statusFilter === 'blocked' ? 'all' : 'blocked')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setStatusFilter(statusFilter === 'blocked' ? 'all' : 'blocked'); }}
            className={`p-4 rounded-3xl bg-rose-50/70 dark:bg-rose-950/20 border text-center space-y-1 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
              statusFilter === 'blocked'
                ? 'border-rose-500 ring-2 ring-rose-500/30 shadow-xs'
                : 'border-rose-200 dark:border-rose-800/80 shadow-xs'
            }`}
          >
            <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
              {isAr ? 'معطلة بمانع' : 'Blocked'}
            </div>
            <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
              {summary?.blocked_count || 0}
            </div>
          </div>

          {/* 4. Ready */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setStatusFilter(statusFilter === 'ready_to_return' ? 'all' : 'ready_to_return')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setStatusFilter(statusFilter === 'ready_to_return' ? 'all' : 'ready_to_return'); }}
            className={`p-4 rounded-3xl bg-white dark:bg-slate-900 border text-center space-y-1 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
              statusFilter === 'ready_to_return'
                ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 shadow-xs'
            }`}
          >
            <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              {isAr ? 'جاهزة للإعادة' : 'Ready to Return'}
            </div>
            <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {summary?.ready_to_return_count || 0}
            </div>
          </div>

          {/* 5. Returned */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setStatusFilter(statusFilter === 'returned' ? 'all' : 'returned')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setStatusFilter(statusFilter === 'returned' ? 'all' : 'returned'); }}
            className={`p-4 rounded-3xl bg-white dark:bg-slate-900 border text-center space-y-1 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
              statusFilter === 'returned'
                ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 shadow-xs'
            }`}
          >
            <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              {isAr ? 'تمت الإعادة والاعتماد' : 'Returned & Approved'}
            </div>
            <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {summary?.returned_count || 0}
            </div>
          </div>

          {/* 6. Code C */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setStatusFilter(statusFilter === 'code_c' ? 'all' : 'code_c')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setStatusFilter(statusFilter === 'code_c' ? 'all' : 'code_c'); }}
            className={`p-4 rounded-3xl bg-amber-50/60 dark:bg-amber-950/20 border text-center space-y-1 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
              statusFilter === 'code_c'
                ? 'border-amber-500 ring-2 ring-amber-500/30 shadow-xs'
                : 'border-amber-200 dark:border-amber-800/80 shadow-xs'
            }`}
          >
            <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
              {isAr ? 'إعادة تقديم C' : 'Code C Resubmission'}
            </div>
            <div className="text-xl font-bold font-mono text-amber-700 dark:text-amber-400">
              {summary?.code_c_count || 0}
            </div>
          </div>

          {/* 7. On Time % */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs text-center space-y-1 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {isAr ? 'نسبة الالتزام بالوقت' : 'On-Time Ratio'}
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
              {onTimePct}%
            </div>
          </div>

          {/* 8. Overdue Submissions */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setStatusFilter(statusFilter === 'overdue' ? 'all' : 'overdue')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setStatusFilter(statusFilter === 'overdue' ? 'all' : 'overdue'); }}
            className={`p-4 rounded-3xl border text-center space-y-1 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
              statusFilter === 'overdue'
                ? 'ring-2 ring-rose-500/40 shadow-xs'
                : 'shadow-xs'
            } ${
              overdueCount > 0
                ? 'bg-rose-100/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                : 'bg-cyan-50/60 dark:bg-cyan-950/20 border-cyan-200 dark:border-cyan-800/80 text-cyan-700 dark:text-cyan-400'
            }`}
          >
            <div className="text-[11px] font-semibold">
              {isAr
                ? (overdueCount > 0 ? 'متأخرة عن الموعد' : 'استفسارات متأخرة')
                : (overdueCount > 0 ? 'Overdue Submissions' : 'Overdue RFIs')}
            </div>
            <div className="text-xl font-bold font-mono">
              {overdueCount > 0 ? overdueCount : (summary?.overdue_rfis_count || 0)}
            </div>
          </div>
        </div>
      )}

      {/* Main Analysis Grid (Bottlenecks & Revisions) */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
          <div className="lg:col-span-2 h-72 bg-slate-100 dark:bg-slate-800 rounded-3xl" />
          <div className="h-72 bg-slate-100 dark:bg-slate-800 rounded-3xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Bottleneck Analysis (> 7 Days Blocked) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {isAr
                        ? 'تحليل الاختناقات الحرجة (معطلة لأكثر من 7 أيام)'
                        : 'Critical Bottleneck Analysis (Blocked > 7 Days)'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {isAr
                        ? 'الحزم الحرجة التي تجاوزت مهلة التعطيل الطبيعية وتتطلب تدخلاً عاجلاً من الإدارة التنفيذية'
                        : 'Critical packages exceeding standard blockage duration and requiring executive action'}
                    </p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                  {(summary?.bottlenecks || []).length} {isAr ? 'حزمة حرجة' : 'Critical'}
                </span>
              </div>

              {(summary?.bottlenecks || []).length === 0 ? (
                <div className="py-10 text-center text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {isAr ? 'لا توجد اختناقات حالياً' : 'No Current Bottlenecks'}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isAr
                      ? 'جميع الحزم المعطلة تقع ضمن النطاق الزمني المسموح أو خالية من الموانع'
                      : 'All blocked packages are within acceptable timeframe or free of impediments'}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {(summary?.bottlenecks || []).slice(0, 4).map((b) => (
                    <div
                      key={b.id}
                      className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100">
                            {b.ref_code}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getKindBadgeClass(b.kind)}`}>
                            {b.kind}
                          </span>
                          {selectedProjectId === 'all' && (
                            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                              ({getProjectName(b.project_id)})
                            </span>
                          )}
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {b.title_ar}
                          </span>
                        </div>

                        <div className="text-xs text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {isAr ? 'السبب: ' : 'Reason: '}
                            {b.blocked_reason || (isAr ? 'عائق فني قيد المراجعة' : 'Technical impediment under review')}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-3">
                          <span>
                            {isAr ? 'المسؤول: ' : 'Owner: '}
                            {b.current_holder?.name_ar || (isAr ? 'المكتب الفني' : 'Technical Office')}
                          </span>
                          {b.blocked_since && (
                            <span>
                              {isAr ? 'معطلة منذ: ' : 'Blocked since: '}
                              {new Date(b.blocked_since).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleOpenDetail(b.id)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{isAr ? 'التفاصيل' : 'Details'}</span>
                        </button>
                        <Link
                          href={`/deliverables?projectId=${b.project_id}`}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
                        >
                          <span>{isAr ? 'معالجة العائق' : 'Resolve'}</span>
                          <ArrowLeft className={`w-3.5 h-3.5 ${!isAr ? 'rotate-180' : ''}`} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right 1 Col: Sheet Revision Progression & Cycle Duration */}
          <div className="space-y-6">
            {/* Revision Progression */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {isAr ? 'تطور مراجعات اللوحات الهندسية' : 'Drawing Sheet Revision Progression'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isAr ? 'توزيع المخططات حسب رقم الإصدار ونسب إعادة التقديم' : 'Distribution of sheets by revision number and resubmission rate'}
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {/* Rev 0 */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">
                      {isAr ? 'إصدار أولي (المراجعة 0)' : 'Initial Release (Rev 0)'}
                    </span>
                    <span className="font-mono text-slate-900 dark:text-white">
                      {revisionBreakdown.rev0} {isAr ? 'لوحة' : 'sheets'} ({revisionBreakdown.rev0Pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${revisionBreakdown.rev0Pct}%` }}
                    />
                  </div>
                </div>

                {/* Rev 1 */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">
                      {isAr ? 'المراجعة الأولى (المراجعة 1)' : 'First Revision (Rev 1)'}
                    </span>
                    <span className="font-mono text-slate-900 dark:text-white">
                      {revisionBreakdown.rev1} {isAr ? 'لوحة' : 'sheets'} ({revisionBreakdown.rev1Pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${revisionBreakdown.rev1Pct}%` }}
                    />
                  </div>
                </div>

                {/* Rev 2+ */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">
                      {isAr ? 'تعديلات متعددة (المراجعة 2 فأكثر)' : 'Multiple Revisions (Rev 2+)'}
                    </span>
                    <span className="font-mono text-amber-600 dark:text-amber-400">
                      {revisionBreakdown.rev2Plus} {isAr ? 'لوحة' : 'sheets'} ({revisionBreakdown.rev2PlusPct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-500 transition-all duration-500"
                      style={{ width: `${revisionBreakdown.rev2PlusPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Average Cycle Duration */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950 to-slate-900 text-white border border-emerald-900/60 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300">
                  {isAr ? 'متوسط دورة إنجاز الحزمة' : 'Average Cycle Duration'}
                </span>
                <Clock className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-3xl font-bold font-mono text-white">
                {avgCycleDurationDays} <span className="text-sm font-normal text-emerald-200">{isAr ? 'يوم عمل' : 'business days'}</span>
              </div>
              <p className="text-[11px] text-emerald-300/80 leading-relaxed">
                {isAr
                  ? 'يُحسب متوسط الفترة الزمنية المستغرقة من تاريخ استلام الحزمة حتى تسليمها معتمدة للمكتب الفني.'
                  : 'Calculated average duration from deliverable reception until approved return to technical office.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Deliverables Master Matrix (Primary Executive Data Grid) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        {/* Header & Badges */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100">
              <FileSpreadsheet className="w-6 h-6 text-fuchsia-600" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isAr ? 'مصفوفة المخرجات والتسليمات الرئيسية' : 'Deliverables Master Matrix'}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {filteredDeliverables.length} {isAr ? 'حزمة' : 'packages'}
                </span>
                {overdueCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 animate-pulse">
                    {overdueCount} {isAr ? 'متأخرة عن موعد التقديم' : 'overdue for submission'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isAr
                  ? 'متابعة شاملة لجميع الحزم الهندسية، مواعيد التقديم ومؤشرات التأخير، وسلسلة مراحل الاعتماد'
                  : 'Comprehensive tracking of all engineering deliverables, submission due dates, delay metrics, and approval stages'}
              </p>
            </div>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <button
              onClick={() => setStatusFilter(statusFilter === 'overdue' ? 'all' : 'overdue')}
              className={`px-3 py-1.5 rounded-xl font-bold border transition flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
                statusFilter === 'overdue'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{isAr ? `المتأخرات (${overdueCount})` : `Overdue (${overdueCount})`}</span>
            </button>

            <button
              onClick={() => setStatusFilter(statusFilter === 'blocked' ? 'all' : 'blocked')}
              className={`px-3 py-1.5 rounded-xl font-bold border transition flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
                statusFilter === 'blocked'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/50'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{isAr ? `المعطلات (${summary?.blocked_count || 0})` : `Blocked (${summary?.blocked_count || 0})`}</span>
            </button>

            <button
              onClick={() => setStatusFilter(statusFilter === 'code_c' ? 'all' : 'code_c')}
              className={`px-3 py-1.5 rounded-xl font-bold border transition flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
                statusFilter === 'code_c'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                  : 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/50'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isAr ? `إعادة تقديم C (${summary?.code_c_count || 0})` : `Code C (${summary?.code_c_count || 0})`}</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Controls Toolbar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className={`w-4 h-4 text-slate-400 dark:text-slate-500 absolute top-1/2 -translate-y-1/2 pointer-events-none ${isAr ? 'right-3.5' : 'left-3.5'}`} />
            <input
              type="text"
              role="searchbox"
              aria-label={isAr ? 'بحث في مصفوفة التسليمات' : 'Search deliverables matrix'}
              placeholder={isAr ? 'بحث برقم الحزمة، اسم المخطط، اسم المهندس، أو المشروع...' : 'Search by package code, title, engineer, or project...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 transition ${
                isAr ? 'pr-10 pl-9' : 'pl-10 pr-9'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                aria-label={isAr ? 'مسح البحث' : 'Clear search'}
                className={`absolute top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 ${
                  isAr ? 'left-3' : 'right-3'
                }`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns & Status Toggles */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 ${
                  statusFilter === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {isAr ? `الكل (${allDeliverables.length})` : `All (${allDeliverables.length})`}
              </button>
              <button
                onClick={() => setStatusFilter('in_progress')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 ${
                  statusFilter === 'in_progress'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {isAr ? 'قيد العمل' : 'In Progress'}
              </button>
              <button
                onClick={() => setStatusFilter('ready_to_return')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 ${
                  statusFilter === 'ready_to_return'
                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {isAr ? 'جاهزة للإعادة' : 'Ready to Return'}
              </button>
              <button
                onClick={() => setStatusFilter('returned')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 ${
                  statusFilter === 'returned'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {isAr ? 'المعتمدة' : 'Approved'}
              </button>
            </div>

            {/* Kind Filter */}
            <div className="flex items-center gap-1.5">
              <select
                id="kind-filter"
                aria-label={isAr ? 'تصفية حسب نوع الحزمة' : 'Filter by deliverable kind'}
                value={kindFilter}
                onChange={(e) => setKindFilter(e.target.value)}
                className="px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 transition"
              >
                <option value="all">{isAr ? 'جميع الأنواع' : 'All Types'}</option>
                <option value="E1">{isAr ? 'مخططات تنفيذية (E1)' : 'Shop Drawings (E1)'}</option>
                <option value="E2">{isAr ? 'مستندات إنشائية وتصميمية (E2)' : 'Structural & Design (E2)'}</option>
                <option value="material_list">{isAr ? 'قوائم حصر المواد' : 'Material Lists'}</option>
                <option value="drawing_list">{isAr ? 'قوائم المخططات' : 'Drawing Lists'}</option>
                <option value="other">{isAr ? 'تصنيفات أخرى' : 'Other'}</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-1.5">
              <select
                id="priority-filter"
                aria-label={isAr ? 'تصفية حسب الأولوية' : 'Filter by priority'}
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 transition"
              >
                <option value="all">{isAr ? 'جميع الأولويات' : 'All Priorities'}</option>
                <option value="high">{isAr ? 'عالي الأهمية' : 'High'}</option>
                <option value="normal">{isAr ? 'عادي' : 'Normal'}</option>
                <option value="low">{isAr ? 'منخفض الأهمية' : 'Low'}</option>
              </select>
            </div>

            {/* Clear filters button if active */}
            {(searchQuery || statusFilter !== 'all' || kindFilter !== 'all' || priorityFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setKindFilter('all');
                  setPriorityFilter('all');
                }}
                className="p-2 rounded-2xl text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition font-bold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                title={isAr ? 'إعادة ضبط الفلاتر' : 'Reset filters'}
              >
                {isAr ? 'مسح الفلاتر' : 'Clear Filters'}
              </button>
            )}
          </div>
        </div>

        {/* Master Matrix Table with RTL Headers & Sticky Action Column */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          {loading ? (
            <div className="p-12 text-center space-y-4 animate-pulse">
              <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 mx-auto rounded-md" />
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl w-full" />
                ))}
              </div>
            </div>
          ) : paginatedDeliverables.length === 0 ? (
            <div className="py-16 text-center text-slate-400 dark:text-slate-500 space-y-3">
              <Inbox className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isAr ? 'لا توجد حزم تسليمات تطابق معايير البحث والتصفية' : 'No deliverables match your search and filter criteria'}
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                {isAr ? 'جرّب تعديل نص البحث أو تغيير فلاتر الحالة والنوع' : 'Try adjusting your search query or modifying status and kind filters'}
              </p>
              {(searchQuery || statusFilter !== 'all' || kindFilter !== 'all' || priorityFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setKindFilter('all');
                    setPriorityFilter('all');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-fuchsia-600 text-white hover:bg-fuchsia-700 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500"
                >
                  {isAr ? 'إعادة ضبط جميع الفلاتر' : 'Reset All Filters'}
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto relative">
              <table
                className="w-full text-start text-xs border-collapse min-w-[1100px]"
                role="table"
                aria-label={isAr ? 'مصفوفة التسليمات الرئيسية للإدارة التنفيذية' : 'Executive Deliverables Master Matrix'}
              >
                <thead className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                  <tr>
                    <th scope="col" className="p-3.5 text-start font-bold">
                      {isAr ? 'رمز الحزمة والنوع' : 'Code & Kind'}
                    </th>
                    <th scope="col" className="p-3.5 text-start font-bold">
                      {isAr ? 'عنوان الحزمة والمشروع' : 'Package Title & Project'}
                    </th>
                    <th scope="col" className="p-3.5 text-start font-bold">
                      {isAr ? 'المسؤول / الحائز الحالي' : 'Current Holder'}
                    </th>
                    <th scope="col" className="p-3.5 text-center font-bold">
                      {isAr ? 'تاريخ الاستحقاق ومؤشر التأخير' : 'Due Date & Delay'}
                    </th>
                    <th scope="col" className="p-3.5 text-center font-bold">
                      {isAr ? 'سلسلة مراحل الاعتماد' : 'Approval Workflow'}
                    </th>
                    <th scope="col" className="p-3.5 text-center font-bold">
                      {isAr ? 'البنود والمراجعة' : 'Sheets & Revision'}
                    </th>
                    <th scope="col" className="p-3.5 text-center font-bold">
                      {isAr ? 'الأولوية' : 'Priority'}
                    </th>
                    {/* Sticky Action Column Header (Left in RTL, Right in LTR) */}
                    <th 
                      scope="col" 
                      className={`p-3.5 text-center font-bold sticky bg-slate-50 dark:bg-slate-800 z-20 border-slate-200 dark:border-slate-700 min-w-[150px] ${
                        isAr
                          ? 'left-0 border-r shadow-[-6px_0_12px_rgba(0,0,0,0.06)] dark:shadow-[-6px_0_12px_rgba(0,0,0,0.4)]'
                          : 'right-0 border-l shadow-[6px_0_12px_rgba(0,0,0,0.06)] dark:shadow-[6px_0_12px_rgba(0,0,0,0.4)]'
                      }`}
                    >
                      {isAr ? 'الإجراءات' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                  {paginatedDeliverables.map((d) => {
                    const delay = getDelayedInfo(d);
                    const stage = getApprovalStageInfo(d);
                    const items = d.items || [];
                    const maxRev = items.reduce((max, i) => Math.max(max, i.current_rev || 0), 0);

                    return (
                      <tr 
                        key={d.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition group"
                      >
                        {/* 1. Ref Code & Kind */}
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 shadow-xs">
                              {d.ref_code}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getKindBadgeClass(d.kind)}`}>
                              {d.kind}
                            </span>
                          </div>
                        </td>

                        {/* 2. Title & Project */}
                        <td className="p-3.5 max-w-sm">
                          <div className="space-y-0.5">
                            <div className="font-bold text-slate-900 dark:text-white line-clamp-1 text-xs">
                              {isAr ? (d.title_ar || d.title_en) : (d.title_en || d.title_ar)}
                            </div>
                            {d.title_en && d.title_ar && (
                              <div className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-1">
                                {isAr ? d.title_en : d.title_ar}
                              </div>
                            )}
                            {selectedProjectId === 'all' && (
                              <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-fuchsia-600 dark:text-fuchsia-400">
                                <Building2 className="w-3 h-3" />
                                <span>{getProjectName(d.project_id)}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* 3. Current Holder */}
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
                              <User className="w-3.5 h-3.5" />
                            </div>
                            <span className="font-semibold text-xs truncate max-w-[130px]">
                              {d.current_holder?.name_ar || d.current_holder?.name_en || d.received_from || (isAr ? 'المكتب الفني' : 'Technical Office')}
                            </span>
                          </div>
                        </td>

                        {/* 4. Due Date & Delayed Indicator */}
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <div className="flex flex-col items-center gap-1">
                            {d.due_date ? (
                              <span className="font-mono text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                                <span>{d.due_date}</span>
                              </span>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500 text-[11px]">-</span>
                            )}

                            {/* Delay Badges */}
                            {delay.isOverdue ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-800 animate-pulse">
                                <AlertTriangle className="w-3 h-3" />
                                <span>{isAr ? `متأخر ${delay.days} يوم` : `Overdue by ${delay.days} days`}</span>
                              </span>
                            ) : delay.isDueSoon ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                <Clock className="w-3 h-3" />
                                <span>{isAr ? `يستحق خلال ${delay.days} أيام` : `Due in ${delay.days} days`}</span>
                              </span>
                            ) : d.status === 'blocked' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                                <ShieldAlert className="w-3 h-3" />
                                <span>{isAr ? 'معطل بمانع' : 'Blocked'}</span>
                              </span>
                            ) : (d.status === 'returned' || d.status === 'approved') ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>{isAr ? 'مكتمل ومعتمد' : 'Approved & Closed'}</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                {isAr ? 'ضمن الجدول الزمني' : 'On Track'}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 5. Approval Chain Status */}
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <div className="flex flex-col items-center gap-1.5">
                            {/* 4-Stage Mini Pipeline */}
                            <div className="flex items-center gap-1" title={stage.stageLabel}>
                              {/* Step 1: Prep */}
                              <span 
                                className={`w-2.5 h-2.5 rounded-full transition-all ${
                                  stage.stageNumber >= 1
                                    ? 'bg-fuchsia-600 ring-2 ring-fuchsia-200 dark:ring-fuchsia-900/50'
                                    : 'bg-slate-200 dark:bg-slate-700'
                                }`} 
                                title={isAr ? '1. استلام وتجهيز المكتب الفني' : '1. Technical Office Prep'} 
                              />
                              <span className={`w-3 h-0.5 ${stage.stageNumber >= 2 ? 'bg-fuchsia-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
                              {/* Step 2: Engineering */}
                              <span 
                                className={`w-2.5 h-2.5 rounded-full transition-all ${
                                  stage.stageNumber >= 2
                                    ? 'bg-fuchsia-600 ring-2 ring-fuchsia-200 dark:ring-fuchsia-900/50'
                                    : 'bg-slate-200 dark:bg-slate-700'
                                }`} 
                                title={isAr ? '2. دراسة وإعداد المخططات التنفيذية' : '2. Engineering & Shop Drawings'} 
                              />
                              <span className={`w-3 h-0.5 ${stage.stageNumber >= 3 ? 'bg-fuchsia-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
                              {/* Step 3: TO Manager */}
                              <span 
                                className={`w-2.5 h-2.5 rounded-full transition-all ${
                                  stage.stageNumber >= 3
                                    ? 'bg-fuchsia-600 ring-2 ring-fuchsia-200 dark:ring-fuchsia-900/50'
                                    : 'bg-slate-200 dark:bg-slate-700'
                                }`} 
                                title={isAr ? '3. مراجعة واعتماد مدير المكتب الفني' : '3. TO Manager Review'} 
                              />
                              <span className={`w-3 h-0.5 ${stage.stageNumber >= 4 ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
                              {/* Step 4: Consultant Approval */}
                              <span 
                                className={`w-2.5 h-2.5 rounded-full transition-all ${
                                  stage.stageNumber >= 4
                                    ? 'bg-emerald-600 ring-2 ring-emerald-200 dark:ring-emerald-900/50'
                                    : 'bg-slate-200 dark:bg-slate-700'
                                }`} 
                                title={isAr ? '4. اعتماد المهندس الاستشاري' : '4. Consultant Approval'} 
                              />
                            </div>

                            {/* Stage Label & Consultant Code Tags */}
                            <div className="flex items-center gap-1 flex-wrap justify-center">
                              {stage.hasCodeC ? (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                  {isAr
                                    ? `كود C: يتطلب إعادة تقديم (مراجعة ${stage.codeCRevision})`
                                    : `Code C: Revise & Resubmit (Rev ${stage.codeCRevision})`}
                                </span>
                              ) : stage.consultantCode === 'A' ? (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                  {isAr ? 'كود A: معتمد بالكامل' : 'Code A: Approved Final'}
                                </span>
                              ) : stage.consultantCode === 'B' ? (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-100 text-cyan-900 dark:bg-cyan-950/70 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
                                  {isAr ? 'كود B: معتمد بملاحظات' : 'Code B: Approved with Comments'}
                                </span>
                              ) : stage.consultantCode === 'D' ? (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-900 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                  {isAr ? 'كود D: مرفوض' : 'Code D: Rejected'}
                                </span>
                              ) : (
                                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                                  {stage.stageLabel}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 6. Sheets & Revisions */}
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <div className="flex flex-col items-center gap-0.5 font-mono text-[11px]">
                            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                              <Layers className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                              <span>{items.length} {isAr ? 'بنود' : 'items'}</span>
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              ({isAr ? 'أعلى مراجعة: ' : 'Max Rev: '}{maxRev})
                            </span>
                          </div>
                        </td>

                        {/* 7. Priority */}
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getPriorityBadgeClass(d.priority)}`}>
                            {d.priority === 'high' ? (isAr ? 'عالي الأهمية' : 'High') : d.priority === 'low' ? (isAr ? 'منخفض' : 'Low') : (isAr ? 'عادي' : 'Normal')}
                          </span>
                        </td>

                        {/* 8. Sticky Action Column (Left in RTL, Right in LTR) */}
                        <td className={`p-3.5 text-center whitespace-nowrap sticky bg-white/95 dark:bg-slate-900/95 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/60 backdrop-blur-sm z-10 border-slate-200 dark:border-slate-800 transition ${
                          isAr
                            ? 'left-0 border-r shadow-[-6px_0_12px_rgba(0,0,0,0.06)] dark:shadow-[-6px_0_12px_rgba(0,0,0,0.4)]'
                            : 'right-0 border-l shadow-[6px_0_12px_rgba(0,0,0,0.06)] dark:shadow-[6px_0_12px_rgba(0,0,0,0.4)]'
                        }`}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenDetail(d.id)}
                              aria-label={isAr ? `عرض تفاصيل حزمة ${d.ref_code}` : `View details for ${d.ref_code}`}
                              className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500"
                              title={isAr ? 'فتح تفاصيل الحزمة والمخططات' : 'Open package and sheet details'}
                            >
                              <Eye className="w-3.5 h-3.5 text-fuchsia-600" />
                              <span>{isAr ? 'التفاصيل' : 'Details'}</span>
                            </button>

                            <Link
                              href={`/deliverables?projectId=${d.project_id}`}
                              aria-label={isAr ? `الانتقال إلى كانبان المشروع لحزمة ${d.ref_code}` : `Go to project deliverables Kanban for ${d.ref_code}`}
                              className="p-1.5 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500"
                              title={isAr ? 'الانتقال إلى كانبان التسليمات للمشروع' : 'Go to project deliverables Kanban'}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Accessible Pagination Footer */}
          {!loading && paginatedDeliverables.length > 0 && (
            <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              {/* Range & Total records */}
              {isAr ? (
                <div className="text-slate-500 dark:text-slate-400 font-semibold">
                  عرض <span className="font-mono font-bold text-slate-900 dark:text-white">{(currentPage - 1) * pageSize + 1}</span> إلى{' '}
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{Math.min(currentPage * pageSize, filteredDeliverables.length)}</span> من أصل{' '}
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{filteredDeliverables.length}</span> حزمة تسليمات
                </div>
              ) : (
                <div className="text-slate-500 dark:text-slate-400 font-semibold">
                  Showing <span className="font-mono font-bold text-slate-900 dark:text-white">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{Math.min(currentPage * pageSize, filteredDeliverables.length)}</span> of{' '}
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{filteredDeliverables.length}</span> deliverables
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center gap-3">
                {/* Page size selector */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">{isAr ? 'حجم الصفحة:' : 'Page size:'}</span>
                  <select
                    id="page-size-selector"
                    aria-label={isAr ? 'عدد الحزم لكل صفحة' : 'Deliverables per page'}
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                {/* Page Navigation Buttons */}
                <div className="flex items-center gap-1">
                  {/* Previous button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label={isAr ? 'الصفحة السابقة' : 'Previous page'}
                    className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 transition cursor-pointer disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500"
                  >
                    {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                  </button>

                  {/* Page numbers */}
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    // Show current page, first, last, and immediate neighbors
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      Math.abs(pageNum - currentPage) <= 1
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          aria-label={isAr ? `الصفحة ${pageNum}` : `Page ${pageNum}`}
                          aria-current={pageNum === currentPage ? 'page' : undefined}
                          className={`w-7 h-7 rounded-xl font-mono text-xs font-bold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 ${
                            pageNum === currentPage
                              ? 'bg-fuchsia-600 text-white shadow-xs'
                              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (
                      pageNum === 2 && currentPage > 3 ||
                      pageNum === totalPages - 1 && currentPage < totalPages - 2
                    ) {
                      return (
                        <span key={pageNum} className="text-slate-400 dark:text-slate-500 px-0.5">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}

                  {/* Next button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-label={isAr ? 'الصفحة التالية' : 'Next page'}
                    className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 transition cursor-pointer disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500"
                  >
                    {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Deliverable Detail Drawer for deep inspection by the COO */}
      <DeliverableDetailDrawer
        isOpen={isDrawerOpen}
        deliverableId={selectedDrawerDeliverableId}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedDrawerDeliverableId(null);
        }}
        onDeliverableUpdated={handleDeliverableUpdated}
      />
    </div>
  );
};
