'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  PackageCheck,
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  Users,
  Award,
  BarChart3,
  RotateCw,
  Search,
  Filter,
  Layers,
  ChevronRight,
  TrendingUp,
  FileCheck,
  SlidersHorizontal,
  Sparkles,
  ShieldAlert,
  RotateCcw,
  XCircle,
  ArrowRight,
  ShieldCheck,
  Send,
  ClipboardCheck,
  Droplets,
  Compass,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/lib/stores/useAuthStore';
import { useProjectStore } from '@/lib/stores/useProjectStore';
import { ProjectService } from '@/lib/services/project.service';
import { DeliverablesService } from '@/lib/services/deliverables.service';
import { KpiService } from '@/lib/services/kpi.service';
import { Project } from '@/types';
import { Deliverable, DeliverableItem, ConsultantApprovalCode } from '@/types/planning';
import { TOManagerApprovalQueue } from '@/components/planning/TOManagerApprovalQueue';
import { TOManagerAssignmentPanel } from '@/components/planning/TOManagerAssignmentPanel';
import { TOEngineerKPIDashboard, TOEngineerKPIDashboardSkeleton } from '@/components/dashboard/TOEngineerKPIDashboard';
import { TOSubmittalTrackingView } from '@/components/planning/TOSubmittalTrackingView';
import { TOTransmittalGovernanceHub } from '@/components/technical-office/TOTransmittalGovernanceHub';
import { TOFieldPaperworkHub } from '@/components/technical-office/TOFieldPaperworkHub';
import { AquaticSafeguardsHub } from '@/components/technical-office/AquaticSafeguardsHub';
import { COOExecutiveRadar } from '@/components/technical-office/COOExecutiveRadar';
import { TOInteractiveStepGuide } from '@/components/technical-office/TOInteractiveStepGuide';
import { TORoleWorkflowGuide } from '@/components/technical-office/TORoleWorkflowGuide';
import { TabSkeleton } from '@/components/ui/TabSkeleton';
import { BackButton } from '@/components/ui/BackButton';
import { usePagePermission } from '@/lib/hooks/usePagePermission';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useUserRoles } from '@/lib/hooks/useUserRoles';
import { useAssignedProjects } from '@/lib/hooks/useAssignedProjects';

export type DashboardTab =
  | 'approvals'
  | 'submittals'
  | 'transmittals'
  | 'field_paperwork'
  | 'aquatic'
  | 'assignments'
  | 'kpis'
  | 'coo_radar';

type ExtendedProject = Project & {
  project_name_ar?: string;
  project_name?: string;
  project_code?: string;
};

export default function TODashboardPage() {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();

  const { activeProjectId, setActiveProjectId } = useProjectStore();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(activeProjectId || 'all');
  const [isAllProjectsMode, setIsAllProjectsMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>('approvals');
  const [submittalCodeFilter, setSubmittalCodeFilter] = useState<string>('all');
  const [showRoleGuideModal, setShowRoleGuideModal] = useState<boolean>(false);

  // Real-time sync when user changes project in TopNav
  useEffect(() => {
    if (activeProjectId) {
      setSelectedProjectId(activeProjectId);
      setIsAllProjectsMode(false);
    }
  }, [activeProjectId]);

  const handleSelectProject = useCallback(
    (pid: string) => {
      if (pid === 'all') {
        setSelectedProjectId('all');
        setIsAllProjectsMode(true);
      } else {
        setSelectedProjectId(pid);
        setIsAllProjectsMode(false);
        setActiveProjectId(pid);
      }
    },
    [setActiveProjectId]
  );

  const { roles, isAdmin } = useUserRoles();
  const { canView, isLoading: permLoading } = usePagePermission('/to-dashboard');

  // ── TO Engineer routing fix ─────────────────────────────────────────────
  // This page is the TO *Manager* Hub. TO engineers must land on /to-tasks
  // (PROJECT.md: technical_office → /to-dashboard (Manager) / /to-tasks (Engineer)).
  // System roles do not distinguish manager vs engineer (DB user_roles holds
  // only admin/planning_manager today), so redirect ONLY on positive evidence:
  // the user has an active project_stakeholders assignment whose project_role
  // is TO-ish but has no manager-level marker, and holds no elevated role.
  // Ambiguous or failed lookups keep current behavior (no-op).
  const [engineerCheckDone, setEngineerCheckDone] = useState(false);
  useEffect(() => {
    if (engineerCheckDone || !user) return;
    const elevated =
      isAdmin ||
      roles.some((r) =>
        [
          'coo',
          'planning_manager',
          'project_manager',
          'commercial_manager',
          'ceo',
          'chairman',
        ].includes(String(r))
      );
    if (elevated) {
      setEngineerCheckDone(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data: stk } = await supabase
          .from('stakeholders')
          .select('id')
          .eq('auth_user_id', user.id);
        const ids = (stk || []).map((s: { id: unknown }) => String(s.id));
        if (ids.length > 0) {
          const { data: assignments } = await supabase
            .from('project_stakeholders')
            .select('project_role')
            .in('stakeholder_id', ids)
            .eq('is_active', true);
          const toRoles = (assignments || [])
            .map((a: { project_role?: unknown }) => String(a.project_role || ''))
            .filter((v) => /technical\s*office|المكتب الفني/i.test(v));
          const isManagerish = toRoles.some((v) =>
            /manager|section\s*head|director|رئيس|مدير/i.test(v)
          );
          if (!cancelled && toRoles.length > 0 && !isManagerish) {
            router.replace('/to-tasks');
          }
        }
      } catch {
        // lookup failure → keep current behavior
      }
      if (!cancelled) setEngineerCheckDone(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [engineerCheckDone, user, roles, isAdmin, router]);

  // 1. Fetch Projects using useAssignedProjects
  const { projects = [], isLoading: loadingProjects } = useAssignedProjects({ strictStaffing: false });

  // 2. Fetch Deliverables / Stats
  const {
    data: deliverablesData = [],
    isLoading: loadingDeliverables,
    isFetching: fetchingDeliverables,
    refetch: refetchDeliverables,
  } = useQuery({
    queryKey: ['to-dashboard-deliverables', selectedProjectId],
    queryFn: async () => {
      return await DeliverablesService.getDeliverables(
        selectedProjectId === 'all' ? '' : selectedProjectId
      );
    },
  });

  // Current selected project info for banner
  const currentProject = useMemo<ExtendedProject | null>(() => {
    if (!selectedProjectId || selectedProjectId === 'all') return null;
    return (projects.find((p) => p.id === selectedProjectId) as ExtendedProject) || null;
  }, [projects, selectedProjectId]);

  const currentProjectName = useMemo(() => {
    if (!currentProject) {
      return isAr ? 'عرض مجمّع لكافة المشاريع' : 'Consolidated All Projects';
    }
    return isAr
      ? currentProject.project_name_ar ||
          currentProject.project_name ||
          currentProject.name_ar ||
          currentProject.name_en
      : currentProject.name_en ||
          currentProject.project_name ||
          currentProject.project_name_ar ||
          currentProject.name_ar;
  }, [currentProject, isAr]);

  const currentProjectCode = useMemo(() => {
    if (!currentProject) return '';
    return currentProject.project_code || currentProject.code || '';
  }, [currentProject]);

  // Flatten all submittal items across deliverables for fine-grained TO metrics
  const allSubmittalItems = useMemo(() => {
    return deliverablesData.flatMap((d: Deliverable) =>
      (d.items || []).map((item: DeliverableItem) => ({
        ...item,
        deliverable_ref: d.ref_code,
        deliverable_title_ar: d.title_ar,
        deliverable_title_en: d.title_en,
        deliverable_kind: d.kind,
        project_id: d.project_id,
      }))
    );
  }, [deliverablesData]);

  // Computed summary metrics grounded in Construction Project Controls
  const metrics = useMemo(() => {
    const totalPackages = deliverablesData.length;
    const e1PackagesCount = deliverablesData.filter((d) => d.kind === 'E1').length;
    const e2PackagesCount = deliverablesData.filter((d) => d.kind === 'E2').length;

    const totalItems = allSubmittalItems.length;
    const inProgressItemsCount = allSubmittalItems.filter(
      (item) => item.status === 'in_progress' || item.status === 'received'
    ).length;

    const codeACount = allSubmittalItems.filter((i) => i.consultant_status === 'A').length;
    const codeBCount = allSubmittalItems.filter((i) => i.consultant_status === 'B').length;
    const codeCCount = allSubmittalItems.filter((i) => i.consultant_status === 'C').length;
    const codeDCount = allSubmittalItems.filter((i) => i.consultant_status === 'D').length;
    const pendingConsultantCount = allSubmittalItems.filter(
      (i) => !i.consultant_status || i.consultant_status === 'pending'
    ).length;

    const blockedItemsCount = allSubmittalItems.filter(
      (i) => i.status === 'blocked' || Boolean(i.blocked_reason)
    ).length;

    const approvedItemsCount = allSubmittalItems.filter(
      (i) => ['A', 'B'].includes(i.consultant_status) || i.status === 'approved'
    ).length;

    const consultantApprovalRate =
      totalItems > 0 ? Math.round((approvedItemsCount / totalItems) * 100) : 0;

    const codeCDTotal = codeCCount + codeDCount;

    return {
      totalPackages,
      e1PackagesCount,
      e2PackagesCount,
      totalItems,
      inProgressItemsCount,
      codeACount,
      codeBCount,
      codeCCount,
      codeDCount,
      pendingConsultantCount,
      blockedItemsCount,
      approvedItemsCount,
      consultantApprovalRate,
      codeCDTotal,
    };
  }, [deliverablesData, allSubmittalItems]);

  const handleRefresh = () => {
    refetchDeliverables();
    queryClient.invalidateQueries({ queryKey: ['to-approval-queue'] });
    queryClient.invalidateQueries({ queryKey: ['to-manager-assignment'] });
    queryClient.invalidateQueries({ queryKey: ['to-engineer-kpi'] });
  };

  // Jump to submittal register filtered by a specific consultant code
  const handleJumpToSubmittalsWithCode = (code: string) => {
    setSubmittalCodeFilter(code);
    setActiveTab('submittals');
  };

  // Access Denied Fallback for unauthorized roles
  if (!permLoading && !canView) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4"
        dir="rtl"
      >
        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          {isAr ? 'غير مصرح بالدخول' : 'Access Denied'}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
          {isAr
            ? 'هذه اللوحة مخصصة لإدارة المكتب الفني وإدارة المشاريع والإدارة التنفيذية.'
            : 'This hub is reserved for Technical Office Managers, Project Managers, and Executive Leadership.'}
        </p>
        <BackButton label={isAr ? 'الرجوع للرئيسية' : 'Back to Home'} />
      </div>
    );
  }

  return (
    <main
      role="main"
      aria-label={
        isAr ? 'مركز قيادة مدير المكتب الفني' : 'Technical Office Manager Dashboard'
      }
      className="w-full max-w-none space-y-4"
      dir="rtl"
    >
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r rtl:bg-gradient-to-l from-slate-900 via-purple-950 to-slate-900 p-6 sm:p-8 text-white shadow-2xl border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-bold">
                <PackageCheck className="w-3.5 h-3.5 text-purple-300" aria-hidden="true" />
                <span>
                  {isAr
                    ? 'مركز قيادة مدير المكتب الفني'
                    : 'Technical Office Manager Hub'}
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
                <span>
                  {isAr
                    ? 'مرتبط تلقائياً بالمشروع النشط في الشريط العلوي'
                    : 'Auto-synced with Active Project in Top Bar'}
                </span>
              </div>
              <Link
                href="/technical-office"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-slate-900/10 hover:bg-white dark:bg-slate-900/20 border border-white/20 text-white text-xs font-bold transition-colors"
              >
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isAr ? 'البوابة المركزية الشاملة' : 'Central TO Portal'}</span>
                <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </Link>

              <button
                type="button"
                onClick={() => setShowRoleGuideModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>
                  {isAr
                    ? 'دليل عمل المدير والأدوار: كل خطوة فين وإزاي؟'
                    : 'Manager & Role Guide: How It Works'}
                </span>
              </button>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className={`text-2xl sm:text-3xl font-black leading-tight ${isAr ? 'tracking-normal' : 'tracking-tight'}`}>
                {currentProject
                  ? isAr
                    ? currentProject.project_name_ar ||
                      currentProject.project_name ||
                      currentProject.name_ar ||
                      currentProject.name_en
                    : currentProject.name_en ||
                      currentProject.project_name ||
                      currentProject.project_name_ar ||
                      currentProject.name_ar
                  : isAr
                  ? 'إدارة واعتماد تسليمات ومخططات المكتب الفني'
                  : 'Technical Office Deliverables & Approvals'}
              </h1>
              {currentProjectCode && (
                <span className="px-2.5 py-1 rounded-xl bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-mono font-bold">
                  {currentProjectCode}
                </span>
              )}
            </div>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              {isAr
                ? 'اعتماد التقارير اليومية لمهندسي المكتب الفني، توزيع المخططات التنفيذية واعتمادات الخامات، متابعة سجلات الاعتماد الاستشاري والنماذج الميدانية، ورصد اختناقات التقديمات وفق معايير الضبط الحتمي.'
                : 'Sign-off on daily engineer progress, assign drawing submittals, track consultant approval analytics, and prevent site stoppages.'}
            </p>
          </div>

          {/* Project Selector & Refresh Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px]">
              <label htmlFor="to-project-select" className="sr-only">
                {isAr ? 'اختر المشروع' : 'Select Project'}
              </label>
              {loadingProjects ? (
                <div
                  className="h-10 w-full rounded-xl bg-slate-800/80 animate-pulse border border-slate-700"
                  role="status"
                  aria-label={isAr ? 'جاري تحميل المشاريع...' : 'Loading projects...'}
                />
              ) : (
                <select
                  id="to-project-select"
                  value={selectedProjectId}
                  onChange={(e) => handleSelectProject(e.target.value)}
                  aria-label={isAr ? 'تحديد المشروع المعروض' : 'Select active project'}
                  className="w-full h-10 px-3 py-1.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 transition-all cursor-pointer"
                >
                  <option value="all" className="bg-slate-900 text-white font-bold">
                    {isAr ? '✦ عرض مجمّع لكافة المشاريع' : '✦ All Active Projects (Consolidated)'}
                  </option>
                  {projects.map((p) => {
                    const extP = p as ExtendedProject;
                    const pCode = extP.project_code || extP.code;
                    const pName = isAr
                      ? extP.project_name_ar || extP.project_name || extP.name_ar || extP.name_en
                      : extP.name_en || extP.project_name || extP.project_name_ar || extP.name_ar;
                    return (
                      <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                        {pCode ? `[${pCode}] ` : ''}
                        {pName}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                if (selectedProjectId === 'all' && activeProjectId) {
                  handleSelectProject(activeProjectId);
                } else {
                  handleSelectProject('all');
                }
              }}
              className={`h-10 px-3.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                selectedProjectId === 'all' || isAllProjectsMode
                  ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-600/25'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <FolderKanban className="w-4 h-4" aria-hidden="true" />
              <span>{isAr ? 'عرض مجمّع لكافة المشاريع' : 'All Projects View'}</span>
            </button>

            <button
              onClick={handleRefresh}
              disabled={fetchingDeliverables}
              aria-label={isAr ? 'تحديث بيانات المكتب الفني' : 'Refresh Technical Office Data'}
              title={isAr ? 'تحديث البيانات' : 'Refresh Data'}
              className="h-10 px-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 disabled:opacity-50"
            >
              <RotateCw
                className={`w-4 h-4 ${fetchingDeliverables ? 'animate-spin text-purple-400' : ''}`}
                aria-hidden="true"
              />
              <span className="hidden sm:inline">{isAr ? 'تحديث' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Summary KPIs Strip */}
      <div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        role="region"
        aria-label={isAr ? 'مؤشرات أداء المكتب الفني' : 'Technical Office Key Performance Indicators'}
      >
        {/* Card 1: Total Deliverables & Packages */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 relative overflow-hidden transition-all hover:border-purple-300 dark:hover:border-purple-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAr ? 'إجمالي الحزم والمخططات' : 'Total Deliverables & Sheets'}
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <FileSpreadsheet className="w-5 h-5" aria-hidden="true" />
            </div>
          </div>
          {loadingDeliverables ? (
            <div className="space-y-1.5 animate-pulse">
              <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              <div className="h-4 w-28 bg-slate-100 dark:bg-slate-800/60 rounded" />
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
                  {metrics.totalPackages}
                </span>
                <span className="text-xs text-purple-600 dark:text-purple-400 font-bold">
                  {isAr ? 'حزمة تسليم' : 'Packages'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {metrics.totalItems} {isAr ? 'لوحة/بند' : 'submittals'}
                </span>
                <span>•</span>
                <span className="font-semibold text-purple-600 dark:text-purple-400">
                  {isAr
                    ? `مخططات تنفيذية: ${metrics.e1PackagesCount} | اعتمادات خامات: ${metrics.e2PackagesCount}`
                    : `E1: ${metrics.e1PackagesCount} | E2: ${metrics.e2PackagesCount}`}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Card 2: In-Progress Submittals */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 relative overflow-hidden transition-all hover:border-blue-300 dark:hover:border-blue-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAr ? 'لوحات قيد الإعداد والإنجاز' : 'In-Progress Submittals'}
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Clock className="w-5 h-5" aria-hidden="true" />
            </div>
          </div>
          {loadingDeliverables ? (
            <div className="space-y-1.5 animate-pulse">
              <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              <div className="h-4 w-28 bg-slate-100 dark:bg-slate-800/60 rounded" />
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
                  {metrics.inProgressItemsCount}
                </span>
                <span
                  role="status"
                  aria-label={isAr ? 'الحالة: نشط حالياً' : 'Status: Active Drafting'}
                  className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                >
                  {isAr ? 'نشط حالياً' : 'Active Drafting'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                {isAr
                  ? 'لوحات ومخططات قيد العمل لدى مهندسي المكتب الفني'
                  : 'Sheets currently on engineering drafting boards'}
              </p>
            </div>
          )}
        </div>

        {/* Card 3: Code C/D Revisions & Blocked */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 relative overflow-hidden transition-all hover:border-rose-300 dark:hover:border-rose-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAr ? 'مراجعات الاستشاري والعوائق' : 'Consultant Revisions & Blocked'}
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5" aria-hidden="true" />
            </div>
          </div>
          {loadingDeliverables ? (
            <div className="space-y-1.5 animate-pulse">
              <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              <div className="h-4 w-28 bg-slate-100 dark:bg-slate-800/60 rounded" />
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
                  {metrics.codeCDTotal + metrics.blockedItemsCount}
                </span>
                <span
                  role="status"
                  aria-label={
                    metrics.codeCDTotal + metrics.blockedItemsCount > 0
                      ? isAr
                        ? 'تتطلب إعادة دراسة وتدخل'
                        : 'Attention Needed'
                      : isAr
                      ? 'طابور نظيف'
                      : 'All Clear'
                  }
                  className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                    metrics.codeCDTotal + metrics.blockedItemsCount > 0
                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                      : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  }`}
                >
                  {metrics.codeCDTotal + metrics.blockedItemsCount > 0
                    ? isAr
                      ? 'تتطلب معالجة'
                      : 'Needs Action'
                    : isAr
                    ? 'لا عوائق'
                    : 'Zero Obstacles'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                <span className="text-amber-600 dark:text-amber-400 font-bold">
                  {isAr ? `كود ج (يعاد التقديم): ${metrics.codeCCount}` : `Code C: ${metrics.codeCCount}`}
                </span>
                <span>•</span>
                <span className="text-rose-600 dark:text-rose-400 font-bold">
                  {isAr ? `كود د (مرفوض): ${metrics.codeDCount}` : `Code D: ${metrics.codeDCount}`}
                </span>
                <span>•</span>
                <span className="text-slate-700 dark:text-slate-300">
                  {isAr ? 'عوائق' : 'Blocked'}: {metrics.blockedItemsCount}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Card 4: Consultant Approvals (Code A/B) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 relative overflow-hidden transition-all hover:border-emerald-300 dark:hover:border-emerald-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAr ? 'الاعتماد الاستشاري ونسبة القبول' : 'Approved (Code A/B) & Rate'}
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
            </div>
          </div>
          {loadingDeliverables ? (
            <div className="space-y-1.5 animate-pulse">
              <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              <div className="h-4 w-28 bg-slate-100 dark:bg-slate-800/60 rounded" />
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
                  {metrics.approvedItemsCount}
                </span>
                <span
                  role="status"
                  aria-label={
                    isAr
                      ? `نسبة الاعتماد الاستشاري ${metrics.consultantApprovalRate}%`
                      : `Approval rate ${metrics.consultantApprovalRate}%`
                  }
                  className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                >
                  {metrics.consultantApprovalRate}% {isAr ? 'قبول' : 'Rate'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {isAr ? `كود أ (معتمد): ${metrics.codeACount}` : `Code A: ${metrics.codeACount}`}
                </span>
                <span>•</span>
                <span className="text-sky-600 dark:text-sky-400 font-bold">
                  {isAr ? `كود ب (معتمد بملاحظات): ${metrics.codeBCount}` : `Code B: ${metrics.codeBCount}`}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Submittal Status Badges & Ball-in-Court Summary Strip */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-purple-500" aria-hidden="true" />
            {isAr ? 'متابعة قرارات الاستشاري:' : 'Consultant Review Status:'}
          </span>

          {/* Quick jump pills */}
          <button
            type="button"
            onClick={() => handleJumpToSubmittalsWithCode('A')}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" aria-hidden="true" />
            <span>{isAr ? 'كود أ (معتمد)' : 'Code A'}</span>
            <span>({metrics.codeACount})</span>
          </button>

          <button
            type="button"
            onClick={() => handleJumpToSubmittalsWithCode('B')}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200 dark:border-sky-900/50 hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          >
            <CheckCircle2 className="w-3 h-3 text-sky-600 shrink-0" aria-hidden="true" />
            <span>{isAr ? 'كود ب (معتمد بملاحظات)' : 'Code B'}</span>
            <span>({metrics.codeBCount})</span>
          </button>

          <button
            type="button"
            onClick={() => handleJumpToSubmittalsWithCode('C')}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          >
            <RotateCcw className="w-3 h-3 text-amber-600 shrink-0" aria-hidden="true" />
            <span>{isAr ? 'كود ج (يعاد التقديم)' : 'Code C'}</span>
            <span>({metrics.codeCCount})</span>
          </button>

          <button
            type="button"
            onClick={() => handleJumpToSubmittalsWithCode('D')}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          >
            <XCircle className="w-3 h-3 text-rose-600 shrink-0" aria-hidden="true" />
            <span>{isAr ? 'كود د (مرفوض)' : 'Code D'}</span>
            <span>({metrics.codeDCount})</span>
          </button>

          <button
            type="button"
            onClick={() => handleJumpToSubmittalsWithCode('pending')}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-purple-50 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-900/50 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          >
            <Clock className="w-3 h-3 text-purple-600 shrink-0" aria-hidden="true" />
            <span>{isAr ? 'قيد المراجعة' : 'Pending'}</span>
            <span>({metrics.pendingConsultantCount})</span>
          </button>
        </div>

        {/* Link to Submittal Tracking tab */}
        <button
          type="button"
          onClick={() => {
            setSubmittalCodeFilter('all');
            setActiveTab('submittals');
          }}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors self-end sm:self-auto cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-lg px-2 py-1"
        >
          <span>{isAr ? 'فتح سجل المخططات الكامل' : 'Open Submittal Register'}</span>
          <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" aria-hidden="true" />
        </button>
      </div>

      {/* Tabs Navigation (Accessible Tablist) */}
      <div
        className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2"
        role="tablist"
        aria-label={isAr ? 'أقسام لوحة المكتب الفني' : 'Technical Office Dashboard Tabs'}
      >
        {/* Tab 1: Approval Queue */}
        <button
          type="button"
          role="tab"
          id="tab-approvals"
          aria-selected={activeTab === 'approvals'}
          aria-controls="panel-approvals"
          tabIndex={activeTab === 'approvals' ? 0 : -1}
          onClick={() => setActiveTab('approvals')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
            activeTab === 'approvals'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <FileCheck className="w-4 h-4" aria-hidden="true" />
          <span>{isAr ? 'طابور اعتماد التقارير اليومية' : 'Daily Approval Queue'}</span>
        </button>

        {/* Tab 2: Submittal Tracking & Register */}
        <button
          type="button"
          role="tab"
          id="tab-submittals"
          aria-selected={activeTab === 'submittals'}
          aria-controls="panel-submittals"
          tabIndex={activeTab === 'submittals' ? 0 : -1}
          onClick={() => {
            setSubmittalCodeFilter('all');
            setActiveTab('submittals');
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
            activeTab === 'submittals'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" aria-hidden="true" />
          <span>{isAr ? 'سجل ومتابعة المخططات' : 'Submittal Tracking & Register'}</span>
          {metrics.totalItems > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                activeTab === 'submittals'
                  ? 'bg-purple-500/40 text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {metrics.totalItems}
            </span>
          )}
        </button>

        {/* Tab 3: Consultant Transmittals & Governance */}
        <button
          type="button"
          role="tab"
          id="tab-transmittals"
          aria-selected={activeTab === 'transmittals'}
          aria-controls="panel-transmittals"
          tabIndex={activeTab === 'transmittals' ? 0 : -1}
          onClick={() => setActiveTab('transmittals')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
            activeTab === 'transmittals'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Send className="w-4 h-4" aria-hidden="true" />
          <span>{isAr ? 'حوافظ التسليم للاستشاري' : 'Consultant Transmittals & SLA'}</span>
        </button>

        {/* Tab 4: Field Paperwork & IPC Readiness Gate */}
        <button
          type="button"
          role="tab"
          id="tab-field-paperwork"
          aria-selected={activeTab === 'field_paperwork'}
          aria-controls="panel-field-paperwork"
          tabIndex={activeTab === 'field_paperwork' ? 0 : -1}
          onClick={() => setActiveTab('field_paperwork')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
            activeTab === 'field_paperwork'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" aria-hidden="true" />
          <span>{isAr ? 'النماذج الميدانية وبوابة المستخلصات' : 'Field Paperwork & IPC Gate'}</span>
        </button>

        {/* Tab 5: Aquatic Safeguards & Hydro-Testing */}
        <button
          type="button"
          role="tab"
          id="tab-aquatic"
          aria-selected={activeTab === 'aquatic'}
          aria-controls="panel-aquatic"
          tabIndex={activeTab === 'aquatic' ? 0 : -1}
          onClick={() => setActiveTab('aquatic')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
            activeTab === 'aquatic'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Droplets className="w-4 h-4" aria-hidden="true" />
          <span>{isAr ? 'الضمانات المائية واختبارات الضغط' : 'Aquatic Safeguards & Hydro-Testing'}</span>
        </button>

        {/* Tab 6: Assignment Panel */}
        <button
          type="button"
          role="tab"
          id="tab-assignments"
          aria-selected={activeTab === 'assignments'}
          aria-controls="panel-assignments"
          tabIndex={activeTab === 'assignments' ? 0 : -1}
          onClick={() => setActiveTab('assignments')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
            activeTab === 'assignments'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Users className="w-4 h-4" aria-hidden="true" />
          <span>{isAr ? 'لوحة توزيع المهام واللوحات' : 'Workload & Assignments'}</span>
        </button>

        {/* Tab 7: KPIs Dashboard */}
        <button
          type="button"
          role="tab"
          id="tab-kpis"
          aria-selected={activeTab === 'kpis'}
          aria-controls="panel-kpis"
          tabIndex={activeTab === 'kpis' ? 0 : -1}
          onClick={() => setActiveTab('kpis')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
            activeTab === 'kpis'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Award className="w-4 h-4" aria-hidden="true" />
          <span>{isAr ? 'تقييم أداء مهندسي المكتب الفني' : 'Engineer Performance KPIs'}</span>
        </button>

        {/* Tab 8: COO Executive Radar */}
        <button
          type="button"
          role="tab"
          id="tab-coo-radar"
          aria-selected={activeTab === 'coo_radar'}
          aria-controls="panel-coo-radar"
          tabIndex={activeTab === 'coo_radar' ? 0 : -1}
          onClick={() => setActiveTab('coo_radar')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
            activeTab === 'coo_radar'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" aria-hidden="true" />
          <span>{isAr ? 'رادار الإدارة العليا للمعوقات' : 'Executive Radar (COO)'}</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="space-y-4">
        <TOInteractiveStepGuide
          activeTab={activeTab}
          onNavigateTab={(tab) => setActiveTab(tab as DashboardTab)}
          pageContext="dashboard"
        />

        {/* Tab 1: Approval Queue */}
        {activeTab === 'approvals' && (
          <div
            role="tabpanel"
            id="panel-approvals"
            aria-labelledby="tab-approvals"
            tabIndex={0}
            className="space-y-4 focus-visible:outline-none"
          >
            {loadingDeliverables && deliverablesData.length === 0 ? (
              <TabSkeleton />
            ) : (
              <TOManagerApprovalQueue
                projectId={selectedProjectId === 'all' ? undefined : selectedProjectId}
                onItemApproved={() => handleRefresh()}
              />
            )}
          </div>
        )}

        {/* Tab 2: Submittal Tracking & Register */}
        {activeTab === 'submittals' && (
          <div
            role="tabpanel"
            id="panel-submittals"
            aria-labelledby="tab-submittals"
            tabIndex={0}
            className="space-y-4 focus-visible:outline-none"
          >
            <TOSubmittalTrackingView
              projectId={selectedProjectId === 'all' ? undefined : selectedProjectId}
              deliverables={deliverablesData}
              isLoading={loadingDeliverables}
              initialCodeFilter={submittalCodeFilter}
              onNavigateToApprovals={() => setActiveTab('approvals')}
              onNavigateToAssignments={() => setActiveTab('assignments')}
            />
          </div>
        )}

        {/* Tab 3: Consultant Transmittals & SLA */}
        {activeTab === 'transmittals' && (
          <div
            role="tabpanel"
            id="panel-transmittals"
            aria-labelledby="tab-transmittals"
            tabIndex={0}
            className="space-y-4 focus-visible:outline-none"
          >
            <TOTransmittalGovernanceHub
              deliverables={deliverablesData}
              projects={projects}
              selectedProjectId={selectedProjectId}
              onRefresh={handleRefresh}
            />
          </div>
        )}

        {/* Tab 4: Field Paperwork & IPC Gate */}
        {activeTab === 'field_paperwork' && (
          <div
            role="tabpanel"
            id="panel-field-paperwork"
            aria-labelledby="tab-field-paperwork"
            tabIndex={0}
            className="space-y-4 focus-visible:outline-none"
          >
            <TOFieldPaperworkHub
              selectedProjectId={selectedProjectId}
              projectName={currentProjectName}
              deliverables={deliverablesData}
              onRefresh={handleRefresh}
            />
          </div>
        )}

        {/* Tab 5: Aquatic Safeguards & Hydro-Testing */}
        {activeTab === 'aquatic' && (
          <div
            role="tabpanel"
            id="panel-aquatic"
            aria-labelledby="tab-aquatic"
            tabIndex={0}
            className="space-y-4 focus-visible:outline-none"
          >
            <AquaticSafeguardsHub
              projectId={selectedProjectId}
              projectName={currentProjectName}
            />
          </div>
        )}

        {/* Tab 6: Assignments Panel */}
        {activeTab === 'assignments' && (
          <div
            role="tabpanel"
            id="panel-assignments"
            aria-labelledby="tab-assignments"
            tabIndex={0}
            className="space-y-4 focus-visible:outline-none"
          >
            {loadingDeliverables && deliverablesData.length === 0 ? (
              <TabSkeleton />
            ) : (
              <TOManagerAssignmentPanel
                projectId={selectedProjectId === 'all' ? undefined : selectedProjectId}
                onAssignmentChanged={() => handleRefresh()}
              />
            )}
          </div>
        )}

        {/* Tab 7: Engineer KPIs Dashboard */}
        {activeTab === 'kpis' && (
          <div
            role="tabpanel"
            id="panel-kpis"
            aria-labelledby="tab-kpis"
            tabIndex={0}
            className="space-y-4 focus-visible:outline-none"
          >
            {loadingDeliverables && deliverablesData.length === 0 ? (
              <TOEngineerKPIDashboardSkeleton />
            ) : (
              <TOEngineerKPIDashboard
                projectId={selectedProjectId === 'all' ? undefined : selectedProjectId}
              />
            )}
          </div>
        )}

        {/* Tab 8: COO Executive Radar */}
        {activeTab === 'coo_radar' && (
          <div
            role="tabpanel"
            id="panel-coo-radar"
            aria-labelledby="tab-coo-radar"
            tabIndex={0}
            className="space-y-4 focus-visible:outline-none"
          >
            <COOExecutiveRadar
              deliverables={deliverablesData}
              projects={projects}
              onRefresh={handleRefresh}
              selectedProjectId={selectedProjectId === 'all' ? undefined : selectedProjectId}
              onSelectProject={(pid) => handleSelectProject(pid)}
            />
          </div>
        )}
      </div>

      {showRoleGuideModal && (
        <TORoleWorkflowGuide
          isModal={true}
          onClose={() => setShowRoleGuideModal(false)}
        />
      )}
    </main>
  );
}
