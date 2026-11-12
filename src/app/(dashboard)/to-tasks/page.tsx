'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ListTodo,
  Layers,
  Box,
  FileCheck,
  Building2,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  RotateCw,
  User,
  ShieldCheck,
  Droplets,
  FileSpreadsheet,
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  LayoutGrid,
  Send,
  Compass,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/lib/stores/useAuthStore';
import { useProjectStore } from '@/lib/stores/useProjectStore';
import { useUserRoles } from '@/lib/hooks/useUserRoles';
import { useAssignedProjects } from '@/lib/hooks/useAssignedProjects';
import { DeliverablesService } from '@/lib/services/deliverables.service';
import { supabase } from '@/lib/supabase';
import { Deliverable } from '@/types/planning';
import { MyAssignedProjectsGrid } from '@/components/technical-office/MyAssignedProjectsGrid';
import { E1ShopDrawingsTracker } from '@/components/technical-office/E1ShopDrawingsTracker';
import { E2MaterialSubmittalsTracker } from '@/components/technical-office/E2MaterialSubmittalsTracker';
import { TOManagerReviewQueue } from '@/components/technical-office/TOManagerReviewQueue';
import { AquaticSafeguardsHub } from '@/components/technical-office/AquaticSafeguardsHub';
import { TOTransmittalGovernanceHub } from '@/components/technical-office/TOTransmittalGovernanceHub';
import { TOFieldPaperworkHub } from '@/components/technical-office/TOFieldPaperworkHub';
import { TOInteractiveStepGuide } from '@/components/technical-office/TOInteractiveStepGuide';
import { TORoleWorkflowGuide } from '@/components/technical-office/TORoleWorkflowGuide';
import { TOManagerAssignmentPanel } from '@/components/planning/TOManagerAssignmentPanel';

export type TOTasksTab =
  | 'e1_drawings'
  | 'e2_materials'
  | 'aquatic_safeguards'
  | 'manager_queue'
  | 'transmittals'
  | 'field_paperwork'
  | 'team_assignment';

export default function TOTasksPage() {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const ArrowBackIcon = isAr ? ArrowRight : ArrowLeft;
  const { user } = useAuth();
  const { roles, isAdmin } = useUserRoles();
  const { activeProjectId, setActiveProjectId } = useProjectStore();

  // Governance: strictly retrieve assigned projects
  const {
    projects,
    isLoading: loadingProjects,
    isUnrestricted,
  } = useAssignedProjects({ strictStaffing: true });

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(activeProjectId || null);
  const [showProjectsGrid, setShowProjectsGrid] = useState<boolean>(false);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<TOTasksTab>('e1_drawings');
  const activeTab = activeWorkspaceTab;
  const setActiveTab = setActiveWorkspaceTab;
  const [engineerStakeholderId, setEngineerStakeholderId] = useState<string | null>(null);
  const [showRoleGuideModal, setShowRoleGuideModal] = useState<boolean>(false);

  // Check if current user has TO Manager or elevated oversight authority
  const isManager = useMemo(() => {
    if (isAdmin) return true;
    return roles.some((r) =>
      [
        'admin',
        'ceo',
        'coo',
        'commercial_manager',
        'planning_manager',
        'project_manager',
        'technical_office_manager',
        'to_manager',
      ].includes(String(r).toLowerCase())
    );
  }, [roles, isAdmin]);

  // Resolve current user's stakeholder ID
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from('stakeholders')
          .select('id')
          .or(`auth_user_id.eq.${user.id},email.ilike.${user.email || ''}`)
          .maybeSingle();

        if (!cancelled && data?.id) {
          setEngineerStakeholderId(data.id);
        }
      } catch (err) {
        console.warn('Could not resolve stakeholder ID:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Sync whenever activeProjectId changes in useProjectStore (TopNav project bar)
  useEffect(() => {
    if (activeProjectId) {
      setSelectedProjectId(activeProjectId);
      setShowProjectsGrid(false);
    }
  }, [activeProjectId]);

  // Auto-select when projects load: prefer activeProjectId if present in projects, else first project
  useEffect(() => {
    if (projects.length === 0) return;

    if (activeProjectId && projects.some((p) => p.id === activeProjectId)) {
      if (selectedProjectId !== activeProjectId) {
        setSelectedProjectId(activeProjectId);
      }
      return;
    }

    if (projects.length >= 1 && !selectedProjectId) {
      const firstProjectId = projects[0].id;
      setSelectedProjectId(firstProjectId);
      setActiveProjectId(firstProjectId);
    }
  }, [projects, activeProjectId, selectedProjectId, setActiveProjectId]);

  // Unified handler for selecting a project from grid or switcher (two-way sync with TopNav)
  const handleSelectProject = (pid: string) => {
    if (!pid) return;
    setSelectedProjectId(pid);
    setShowProjectsGrid(false);
    setActiveProjectId(pid);
  };

  // Selected project object
  const selectedProject = useMemo(() => {
    if (!selectedProjectId) return null;
    return projects.find((p) => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  // Fetch deliverables for the active project
  const {
    data: deliverables = [],
    isLoading: loadingDeliverables,
    refetch: refetchDeliverables,
  } = useQuery<Deliverable[]>({
    queryKey: ['project-deliverables', selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return [];
      const res = await DeliverablesService.getDeliverables(selectedProjectId);
      return res || [];
    },
    enabled: Boolean(selectedProjectId),
    staleTime: 30000,
  });

  // Calculate manager review queue count & live project KPIs
  const {
    pendingManagerCount,
    totalPackagesAndDrawings,
    inPreparationCount,
    consultantApprovedCount,
    activeConstraintsCount,
    e1Count,
    e2Count,
    aquaticCount,
    fieldPaperworkCount,
    transmittalsCount,
  } = useMemo(() => {
    let managerPending = 0;
    let totalItems = 0;
    let inPrep = 0;
    let approved = 0;
    let constraints = 0;
    let e1Items = 0;
    let e2Items = 0;
    let aquaticItems = 0;
    let fieldItems = 0;
    let transmittalItems = 0;

    deliverables.forEach((d) => {
      const rec = d as unknown as Record<string, unknown>;
      const rawMeta = `${rec.category || ''} ${rec.type || ''} ${rec.deliverable_type || ''} ${rec.code || ''} ${d.title || ''}`.toLowerCase();
      const isE2 =
        rawMeta.includes('e2') ||
        rawMeta.includes('material') ||
        rawMeta.includes('submittal') ||
        rawMeta.includes('خامات') ||
        rawMeta.includes('مواد') ||
        rawMeta.includes('مورد');
      const isAquatic =
        rawMeta.includes('aquatic') ||
        rawMeta.includes('pool') ||
        rawMeta.includes('water') ||
        rawMeta.includes('pressure') ||
        rawMeta.includes('مسابح') ||
        rawMeta.includes('مائي') ||
        rawMeta.includes('ضغط') ||
        rawMeta.includes('عزل');

      const items = d.items || [];
      const itemCountForDeliverable = items.length > 0 ? items.length : 1;

      if (isE2) {
        e2Items += itemCountForDeliverable;
      } else {
        e1Items += itemCountForDeliverable;
      }

      if (isAquatic) {
        aquaticItems += itemCountForDeliverable;
      }

      if (items.length > 0) {
        items.forEach((item) => {
          totalItems++;
          const st = String(item.status || '').toLowerCase();

          if (st === 'ready_to_return' && !item.to_manager_approved) {
            managerPending++;
          }

          if (
            st === 'not_started' ||
            st === 'in_progress' ||
            st === 'ready_to_return' ||
            st === 'draft'
          ) {
            inPrep++;
          }

          if (
            st === 'approved' ||
            st === 'approved_with_comments' ||
            st === 'completed'
          ) {
            approved++;
            fieldItems++;
          }

          if (
            st === 'submitted_to_consultant' ||
            st === 'submitted' ||
            Boolean(item.to_manager_approved)
          ) {
            transmittalItems++;
          }

          if (
            st === 'rejected' ||
            st === 'revise_and_resubmit' ||
            st === 'on_hold' ||
            st === 'delayed' ||
            st === 'blocked'
          ) {
            constraints++;
          }
        });
      } else {
        totalItems++;
        const dst = String(d.status || '').toLowerCase();
        if (dst === 'not_started' || dst === 'in_progress' || dst === 'draft' || !dst) {
          inPrep++;
        } else if (dst === 'approved' || dst === 'completed') {
          approved++;
          fieldItems++;
        } else if (dst === 'submitted' || dst === 'submitted_to_consultant') {
          transmittalItems++;
        } else if (dst === 'rejected' || dst === 'on_hold' || dst === 'delayed') {
          constraints++;
        }
      }
    });

    return {
      pendingManagerCount: managerPending,
      totalPackagesAndDrawings: totalItems > 0 ? totalItems : deliverables.length,
      inPreparationCount: inPrep,
      consultantApprovedCount: approved,
      activeConstraintsCount: constraints,
      e1Count: e1Items > 0 ? e1Items : deliverables.length,
      e2Count: e2Items > 0 ? e2Items : deliverables.length,
      aquaticCount: aquaticItems > 0 ? aquaticItems : deliverables.length,
      fieldPaperworkCount: fieldItems > 0 ? fieldItems : deliverables.length,
      transmittalsCount: transmittalItems > 0 ? transmittalItems : deliverables.length,
    };
  }, [deliverables]);

  const userDisplayName =
    user?.user_metadata?.full_name || (user as { name?: string } | null)?.name || user?.email || '';

  const activeProjectArabicName = selectedProject
    ? selectedProject.project_name_ar || selectedProject.name_ar || selectedProject.project_name
    : '';
  const activeProjectCode = selectedProject
    ? selectedProject.project_code || selectedProject.code || ''
    : '';

  return (
    <main className="w-full max-w-none space-y-4" id="to-tasks-main">
      {/* Top Executive Banner Header */}
      <header
        role="banner"
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-5 sm:p-6 text-white shadow-xl border border-slate-800 space-y-5"
      >
        <div className="absolute -top-24 -end-24 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -start-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-3">
            {/* Breadcrumb & Status Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/technical-office"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 hover:bg-slate-700 text-teal-300 text-xs font-bold transition-colors"
                title={isAr ? 'الانتقال إلى البوابة الشاملة للمكتب الفني' : 'Go to Technical Office Command Portal'}
              >
                <ListTodo className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{isAr ? 'البوابة المركزية للمكتب الفني' : 'Technical Office Portal'}</span>
                <ChevronRight className="w-3.5 h-3.5 rtl:-scale-x-100" />
              </Link>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{isAr ? 'مرتبط تلقائياً بشريط المشروع العلوي' : 'Auto-synced with Top Project Bar'}</span>
              </span>

              {userDisplayName && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-[11px] font-medium">
                  <User className="w-3 h-3 text-teal-400" />
                  <span>{userDisplayName}</span>
                </span>
              )}

              {isManager && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-[11px] font-bold">
                  <ShieldCheck className="w-3 h-3" />
                  <span>{isAr ? 'صلاحية اعتماد المكتب الفني' : 'TO Manager Sign-off'}</span>
                </span>
              )}

              <button
                type="button"
                onClick={() => setShowRoleGuideModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>
                  {isAr
                    ? 'دليل الأدوار والعمل: إزاي أشتغل هنا؟'
                    : 'Role & Workflow Guide: How It Works'}
                </span>
              </button>
            </div>

            {/* Main Page Title */}
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3 flex-wrap">
                <span>{isAr ? 'مهامي الهندسية والاعتمادات' : 'Engineering Tasks & Submittals'}</span>
              </h1>

              {/* Active Project Dynamic Display */}
              {selectedProject && (
                <div className="inline-flex flex-wrap items-center gap-2.5 pt-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-teal-500/20 border border-teal-400/40 text-teal-200 text-xs sm:text-sm font-black">
                    <Building2 className="w-4 h-4 text-teal-300" />
                    <span>{activeProjectArabicName}</span>
                  </span>
                  {activeProjectCode && (
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700 font-mono text-xs font-bold text-emerald-300">
                      #{activeProjectCode}
                    </span>
                  )}
                </div>
              )}

              <p className="text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed pt-1">
                {isAr
                  ? 'متابعة مخططات الورشة واللوحات التنفيذية، اعتمادات الخامات والموردين، الضمانات المائية واختبارات الضغط، النماذج الميدانية، وإدارة المراجعات الداخلية وحوافظ التسليم للاستشاري.'
                  : 'Track shop drawings, material submittals, aquatic safeguards, field paperwork, internal manager sign-offs, and consultant transmittals.'}
              </p>
            </div>
          </div>

          {/* Right Header Controls: Project Switcher & My Project Cards Toggle */}
          <div className="self-start lg:self-auto flex flex-wrap items-center gap-2.5">
            {projects.length > 0 && (
              <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5">
                <label htmlFor="quick-project-select" className="text-xs text-slate-300 font-bold whitespace-nowrap">
                  {isAr ? 'المشروع النشط:' : 'Active Project:'}
                </label>
                <select
                  id="quick-project-select"
                  value={selectedProjectId || ''}
                  onChange={(e) => handleSelectProject(e.target.value)}
                  className="bg-transparent text-xs text-white font-bold focus:outline-none max-w-[240px] cursor-pointer"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                      #{p.project_code || p.code} — {p.project_name_ar || p.project_name || p.name_ar}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowProjectsGrid((prev) => !prev)}
              className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border ${
                showProjectsGrid
                  ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-md'
                  : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>
                {showProjectsGrid && selectedProjectId
                  ? isAr
                    ? 'العودة لمساحة عمل المشروع'
                    : 'Back to Project Workspace'
                  : isAr
                    ? 'استعراض بطاقات مشاريعي'
                    : 'View My Project Cards'}
              </span>
            </button>
          </div>
        </div>

        {/* 4 Live Project KPI Summary Cards */}
        {selectedProject && (
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2">
            {/* KPI 1: إجمالي الحزم والمخططات */}
            <div className="rounded-2xl bg-slate-900/75 border border-slate-700/80 p-4 flex items-center justify-between gap-3 backdrop-blur-sm">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-300">
                  {isAr ? 'إجمالي الحزم والمخططات' : 'Total Packages & Drawings'}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white font-mono">
                    {totalPackagesAndDrawings}
                  </span>
                  <span className="text-[11px] font-semibold text-teal-300">
                    {isAr ? `${deliverables.length} حزمة رئيسية` : `${deliverables.length} packages`}
                  </span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shrink-0">
                <Layers className="w-5 h-5" />
              </div>
            </div>

            {/* KPI 2: قيد الإعداد الهندسي */}
            <div className="rounded-2xl bg-slate-900/75 border border-slate-700/80 p-4 flex items-center justify-between gap-3 backdrop-blur-sm">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-300">
                  {isAr ? 'قيد الإعداد الهندسي' : 'In Engineering Preparation'}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-amber-300 font-mono">
                    {inPreparationCount}
                  </span>
                  <span className="text-[11px] font-semibold text-amber-200/80">
                    {isAr ? 'جاري التجهيز والمراجعة' : 'Active preparation'}
                  </span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            {/* KPI 3: معتمد من الاستشاري */}
            <div className="rounded-2xl bg-slate-900/75 border border-slate-700/80 p-4 flex items-center justify-between gap-3 backdrop-blur-sm">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-300">
                  {isAr ? 'معتمد من الاستشاري' : 'Approved by Consultant'}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-emerald-400 font-mono">
                    {consultantApprovedCount}
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-300/80">
                    {isAr ? 'جاهز للتنفيذ والمستخلصات' : 'Cleared for execution'}
                  </span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            {/* KPI 4: المعوقات النشطة */}
            <div className="rounded-2xl bg-slate-900/75 border border-slate-700/80 p-4 flex items-center justify-between gap-3 backdrop-blur-sm">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-300">
                  {isAr ? 'المعوقات النشطة' : 'Active Constraints'}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-rose-400 font-mono">
                    {activeConstraintsCount}
                  </span>
                  <span className="text-[11px] font-semibold text-rose-300/80">
                    {isAr ? 'يتطلب معالجة هندسية' : 'Requires resolution'}
                  </span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-300 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      {showProjectsGrid || !selectedProjectId ? (
        /* LEVEL 1: My Assigned Projects Hub */
        <MyAssignedProjectsGrid
          projects={projects}
          isLoading={loadingProjects}
          onSelectProject={(pid) => handleSelectProject(pid)}
          userFullName={userDisplayName}
          userEmail={user?.email}
          isUnrestricted={isUnrestricted}
        />
      ) : (
        /* LEVEL 2 & 3: Project Technical Office Workspace */
        <div className="space-y-4">
          {/* Active Project Context & Actions Bar */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowProjectsGrid(true)}
                className="min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-teal-500"
                aria-label={isAr ? 'استعراض بطاقات مشاريعي' : 'View my project cards'}
              >
                <ArrowBackIcon className="w-4 h-4" />
                <span>{isAr ? 'استعراض بطاقات مشاريعي' : 'My Project Cards'}</span>
              </button>

              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                    #{activeProjectCode}
                  </span>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100" dir="rtl">
                    {activeProjectArabicName}
                  </h2>
                </div>
                {!isAr && selectedProject?.project_name_en && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium" dir="ltr">
                    {selectedProject.project_name_en}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => refetchDeliverables()}
              disabled={loadingDeliverables}
              className="min-h-[44px] min-w-[44px] self-end sm:self-auto px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 text-xs font-bold disabled:opacity-50"
              aria-label={isAr ? 'تحديث البيانات' : 'Refresh data'}
            >
              <RotateCw className={`w-4 h-4 ${loadingDeliverables ? 'animate-spin' : ''}`} />
              <span>{isAr ? 'تحديث البيانات' : 'Refresh'}</span>
            </button>
          </div>

          {/* Theme-Adaptive Segmented Navigation Bar */}
          <div
            className="flex flex-wrap items-center gap-2 p-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
            role="tablist"
            aria-label={isAr ? 'أقسام المكتب الفني' : 'Technical Office Sections'}
          >
            {/* Tab 1: مخططات الورشة واللوحات التنفيذية */}
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'e1_drawings'}
              onClick={() => setActiveTab('e1_drawings')}
              className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === 'e1_drawings'
                  ? 'bg-teal-600 dark:bg-teal-500 text-white dark:text-slate-950 shadow-md ring-2 ring-teal-400/40'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>{isAr ? 'مخططات الورشة واللوحات التنفيذية' : 'Shop Drawings'}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-black ${
                  activeTab === 'e1_drawings'
                    ? 'bg-white/20 dark:bg-slate-950/20 text-white dark:text-slate-950'
                    : 'bg-slate-100 dark:bg-slate-800 text-teal-700 dark:text-teal-300 border border-slate-200 dark:border-slate-800'
                }`}
              >
                {e1Count}
              </span>
            </button>

            {/* Tab 2: اعتمادات الخامات والموردين */}
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'e2_materials'}
              onClick={() => setActiveTab('e2_materials')}
              className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === 'e2_materials'
                  ? 'bg-teal-600 dark:bg-teal-500 text-white dark:text-slate-950 shadow-md ring-2 ring-teal-400/40'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80'
              }`}
            >
              <Box className="w-4 h-4" />
              <span>{isAr ? 'اعتمادات الخامات والموردين' : 'Material Approvals'}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-black ${
                  activeTab === 'e2_materials'
                    ? 'bg-white/20 dark:bg-slate-950/20 text-white dark:text-slate-950'
                    : 'bg-slate-100 dark:bg-slate-800 text-teal-700 dark:text-teal-300 border border-slate-200 dark:border-slate-800'
                }`}
              >
                {e2Count}
              </span>
            </button>

            {/* Tab 3: الضمانات المائية واختبارات الضغط */}
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'aquatic_safeguards'}
              onClick={() => setActiveTab('aquatic_safeguards')}
              className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === 'aquatic_safeguards'
                  ? 'bg-sky-600 dark:bg-sky-500 text-white dark:text-slate-950 shadow-md ring-2 ring-sky-400/40'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80'
              }`}
            >
              <Droplets className="w-4 h-4" />
              <span>{isAr ? 'الضمانات المائية واختبارات الضغط' : 'Aquatic Safeguards & Pressure Tests'}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-black ${
                  activeTab === 'aquatic_safeguards'
                    ? 'bg-white/20 dark:bg-slate-950/20 text-white dark:text-slate-950'
                    : 'bg-slate-100 dark:bg-slate-800 text-sky-700 dark:text-sky-300 border border-slate-200 dark:border-slate-800'
                }`}
              >
                {aquaticCount}
              </span>
            </button>

            {/* Tab 4: النماذج الميدانية وبوابة المستخلصات */}
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'field_paperwork'}
              onClick={() => setActiveTab('field_paperwork')}
              className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === 'field_paperwork'
                  ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-md ring-2 ring-emerald-400/40'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{isAr ? 'النماذج الميدانية وبوابة المستخلصات' : 'Field Forms & IPC Gate'}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-black ${
                  activeTab === 'field_paperwork'
                    ? 'bg-white/20 dark:bg-slate-950/20 text-white dark:text-slate-950'
                    : 'bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-slate-200 dark:border-slate-800'
                }`}
              >
                {fieldPaperworkCount}
              </span>
            </button>

            {/* Tab 5: مراجعة واعتماد المدير */}
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'manager_queue'}
              onClick={() => setActiveTab('manager_queue')}
              className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === 'manager_queue'
                  ? 'bg-purple-600 dark:bg-purple-500 text-white dark:text-slate-950 shadow-md ring-2 ring-purple-400/40'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>{isAr ? 'مراجعة واعتماد المدير' : 'Manager Review & Sign-off'}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-black ${
                  activeTab === 'manager_queue'
                    ? 'bg-white/20 dark:bg-slate-950/20 text-white dark:text-slate-950'
                    : 'bg-slate-100 dark:bg-slate-800 text-purple-700 dark:text-purple-300 border border-slate-200 dark:border-slate-800'
                }`}
              >
                {pendingManagerCount}
              </span>
            </button>

            {/* Tab 6: حوافظ التسليم للاستشاري */}
            {isManager && (
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'transmittals'}
                onClick={() => setActiveTab('transmittals')}
                className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeTab === 'transmittals'
                    ? 'bg-purple-600 dark:bg-purple-500 text-white dark:text-slate-950 shadow-md ring-2 ring-purple-400/40'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>{isAr ? 'حوافظ التسليم للاستشاري' : 'Consultant Transmittals'}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-black ${
                    activeTab === 'transmittals'
                      ? 'bg-white/20 dark:bg-slate-950/20 text-white dark:text-slate-950'
                      : 'bg-slate-100 dark:bg-slate-800 text-purple-700 dark:text-purple-300 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {transmittalsCount}
                </span>
              </button>
            )}

            {/* Tab 7: توزيع المهام الهندسية */}
            {isManager && (
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'team_assignment'}
                onClick={() => setActiveTab('team_assignment')}
                className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeTab === 'team_assignment'
                    ? 'bg-purple-600 dark:bg-purple-500 text-white dark:text-slate-950 shadow-md ring-2 ring-purple-400/40'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <FolderKanban className="w-4 h-4" />
                <span>{isAr ? 'توزيع المهام الهندسية' : 'Engineering Task Assignment'}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-black ${
                    activeTab === 'team_assignment'
                      ? 'bg-white/20 dark:bg-slate-950/20 text-white dark:text-slate-950'
                      : 'bg-slate-100 dark:bg-slate-800 text-purple-700 dark:text-purple-300 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {deliverables.length}
                </span>
              </button>
            )}
          </div>

          {/* Active Tab Content */}
          <div role="tabpanel" className="space-y-4 animate-in fade-in duration-150">
            <TOInteractiveStepGuide
              activeTab={activeTab}
              onNavigateTab={(tab) => setActiveTab(tab as TOTasksTab)}
              pageContext="tasks"
            />

            {activeTab === 'e1_drawings' && (
              <E1ShopDrawingsTracker
                projectId={selectedProjectId}
                deliverables={deliverables}
                isLoading={loadingDeliverables}
                onRefresh={refetchDeliverables}
                engineerStakeholderId={engineerStakeholderId}
                isManager={isManager}
              />
            )}

            {activeTab === 'e2_materials' && (
              <E2MaterialSubmittalsTracker
                projectId={selectedProjectId}
                deliverables={deliverables}
                isLoading={loadingDeliverables}
                onRefresh={refetchDeliverables}
                engineerStakeholderId={engineerStakeholderId}
                isManager={isManager}
              />
            )}

            {activeTab === 'aquatic_safeguards' && (
              <AquaticSafeguardsHub
                {...({
                  projectId: selectedProjectId,
                  projectName: selectedProject
                    ? (isAr
                        ? selectedProject.project_name_ar || selectedProject.name_ar || selectedProject.project_name
                        : selectedProject.project_name_en || selectedProject.project_name)
                    : undefined,
                } as any)}
              />
            )}

            {activeTab === 'manager_queue' && (
              <TOManagerReviewQueue deliverables={deliverables} onRefresh={refetchDeliverables} />
            )}

            {activeTab === 'transmittals' && (
              <TOTransmittalGovernanceHub
                deliverables={deliverables}
                projects={projects}
                onRefresh={refetchDeliverables}
                selectedProjectId={selectedProjectId || undefined}
              />
            )}

            {activeTab === 'field_paperwork' && (
              <TOFieldPaperworkHub
                selectedProjectId={selectedProjectId}
                projectName={
                  selectedProject
                    ? (isAr
                        ? selectedProject.project_name_ar || selectedProject.name_ar || selectedProject.project_name
                        : selectedProject.project_name_en || selectedProject.project_name)
                    : undefined
                }
                deliverables={deliverables}
                onRefresh={refetchDeliverables}
              />
            )}

            {activeTab === 'team_assignment' && (
              <TOManagerAssignmentPanel
                projectId={selectedProjectId}
                projectName={
                  selectedProject
                    ? (isAr
                        ? selectedProject.project_name_ar || selectedProject.name_ar || selectedProject.project_name
                        : selectedProject.project_name_en || selectedProject.project_name)
                    : undefined
                }
                onAssignmentComplete={refetchDeliverables}
              />
            )}
          </div>
        </div>
      )}

      {showRoleGuideModal && (
        <TORoleWorkflowGuide
          isModal={true}
          onClose={() => setShowRoleGuideModal(false)}
        />
      )}
    </main>
  );
}

