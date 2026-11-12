'use client';

import React, { useState, useEffect, useCallback, lazy, Suspense, useTransition, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { HeaderNav } from '@/components/layout/HeaderNav';
import dynamic from 'next/dynamic';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ProjectService } from '@/lib/services/project.service';
import { BackButton } from '@/components/ui/BackButton';

const LeafletMap = dynamic(
  () => import('@/components/ui/LeafletMap').then((m) => m.LeafletMap),
  { ssr: false, loading: () => <div className="w-full h-[300px] bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl" /> }
);
import { Project, ProjectStatus, ProjectClientContact } from '@/types';
import { 
  ArrowRight, 
  Building2, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Droplets, 
  FileText, 
  Edit, 
  ShieldCheck,
  CheckCircle,
  Clock,
  AlertTriangle,
  LayoutDashboard,
  ClipboardList,
  Target,
  Users,
  Folder,
  Settings,
  FileDiff,
  Banknote,
  Archive,
  ExternalLink,
  GitFork,
  History,
  Loader2,
  Printer,
  Pencil,
  ChevronDown,
  TrendingUp,
  Sparkles,
  Layers,
  Crown,
  Briefcase,
  FileSpreadsheet,
  X
} from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { TabSkeleton } from '@/components/ui/TabSkeleton';
import { useCleanupEffect } from '@/lib/utils/useCleanupEffect';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProjectStore } from '@/lib/stores/useProjectStore';
import { getOwnerFromProject } from '@/lib/utils/projectOwner';
import { isFocusedProjectsMode, FOCUSED_PROJECT_DETAIL_TABS } from '@/lib/config/module-visibility';
import { useUserRoles } from '@/lib/hooks/useUserRoles';
import { useModuleAccess } from '@/lib/hooks/useModuleAccess';
import { canEditPath } from '@/lib/rbac/access-control';
import { HoldProjectModal } from '@/components/projects/HoldProjectModal';
import { CancelProjectModal } from '@/components/projects/CancelProjectModal';
import { HandoverProjectModal, type HandoverChecklistData } from '@/components/projects/HandoverProjectModal';
import { HandoverCertificateModal } from '@/components/projects/HandoverCertificateModal';
import { FinishProjectCloseoutModal } from '@/components/projects/FinishProjectCloseoutModal';
import type { ProjectCloseoutAuditPayload } from '@/types/closeout';

const WBSTab = lazy(() => import('@/components/projects/tabs/WBSTab').then((m) => ({ default: m.WBSTab })));
const BoqTab = lazy(() => import('@/components/projects/tabs/BoqTab').then((m) => ({ default: m.BoqTab })));
const MilestonesTab = lazy(() => import('@/components/projects/tabs/MilestonesTab').then((m) => ({ default: m.MilestonesTab })));
const ChangeOrdersTab = lazy(() => import('@/components/projects/tabs/ChangeOrdersTab').then((m) => ({ default: m.ChangeOrdersTab })));
const InvoicesTab = lazy(() => import('@/components/projects/tabs/InvoicesTab').then((m) => ({ default: m.InvoicesTab })));
const SnagListTrackingBoard = lazy(() => import('@/components/projects/SnagListTrackingBoard').then((m) => ({ default: m.SnagListTrackingBoard })));
const DocumentsTab = lazy(() => import('@/components/projects/tabs/DocumentsTab').then((m) => ({ default: m.DocumentsTab })));
const TeamTab = lazy(() => import('@/components/projects/tabs/TeamTab').then((m) => ({ default: m.TeamTab })));
const StakeholderOrgChart = lazy(() => import('@/components/projects/stakeholders/StakeholderOrgChart').then((m) => ({ default: m.StakeholderOrgChart })));
import { ProjectManagerVerificationCard } from '@/components/projects/team/ProjectManagerVerificationCard';
const AuditLogTab = lazy(() => import('@/components/projects/tabs/AuditLogTab').then((m) => ({ default: m.AuditLogTab })));
const ArchiveTab = lazy(() => import('@/components/projects/tabs/ArchiveTab').then((m) => ({ default: m.ArchiveTab })));
const ContractTab = lazy(() => import('@/components/projects/tabs/ContractTab').then((m) => ({ default: m.ContractTab })));
const CostControlTab = lazy(() => import('@/components/projects/tabs/CostControlTab').then((m) => ({ default: m.CostControlTab })));

import { TABS_CONFIG, type ProjectTab } from '@/components/projects/tabs/tabsConfig';

function ProjectDetailPageInner() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params?.id as string;

  const { locale, dir } = useLanguage();
  const isAr = locale === 'ar';
  const lang = locale;

  const setActiveProjectId = useProjectStore((s) => s.setActiveProjectId);
  const [isSwitchingProject, setIsSwitchingProject] = useState(false);
  const [allProjects, setAllProjects] = useState<Project[]>([]);

  // Sync open project id with TopNav store when URL `id` changes (URL is single source of truth)
  useEffect(() => {
    if (id) {
      setIsSwitchingProject(false);
      if (typeof setActiveProjectId === 'function') {
        setActiveProjectId(id);
      } else if (typeof (useProjectStore as any)?.getState === 'function') {
        (useProjectStore as any).getState().setActiveProjectId?.(id);
      }
    }
  }, [id, setActiveProjectId]);

  // Load projects list for inline quick-switcher in Hero Card
  useEffect(() => {
    let mounted = true;
    ProjectService.getProjects({})
      .then((list) => {
        if (mounted && Array.isArray(list)) setAllProjects(list);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [clientContacts, setClientContacts] = useState<ProjectClientContact[]>([]);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [showHandoverCertModal, setShowHandoverCertModal] = useState(false);
  const [showFinishCloseoutModal, setShowFinishCloseoutModal] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!statusFeedback) return;
    const timer = setTimeout(() => {
      setStatusFeedback(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [statusFeedback]);

  // Transition state for non-blocking tab switches with visual indicator
  const [isPending, startTransition] = useTransition();
  const [pendingTab, setPendingTab] = useState<ProjectTab | null>(null);
  const [tabPulse, setTabPulse] = useState(false);

  const focusedMode = isFocusedProjectsMode();
  const { roles, isAdmin } = useUserRoles();
  const { data: dbAccessRules } = useModuleAccess();
  const canEditProject =
    isAdmin || canEditPath('/projects', roles, isAdmin, dbAccessRules);

  // Tabs suite accessible to users (filtered in Phase 1 Focused Mode & Read-Only Viewer Mode)
  const ALL_TABS: ProjectTab[] = [
    'overview',
    'contracts',
    'wbs',
    'boq',
    'cost_control',
    'milestones',
    'change_orders',
    'invoices',
    'snags',
    'documents',
    'team',
    'org_chart',
    'audit_log',
    'archive',
    'settings',
  ];
  const baseAllowedTabs: ProjectTab[] = focusedMode
    ? (FOCUSED_PROJECT_DETAIL_TABS as unknown as ProjectTab[])
    : ALL_TABS;
  const ALLOWED_TABS: ProjectTab[] = canEditProject
    ? baseAllowedTabs
    : baseAllowedTabs.filter((t) => t !== 'settings');
  const visibleTabsConfig = (
    focusedMode
      ? TABS_CONFIG.filter((t) => (FOCUSED_PROJECT_DETAIL_TABS as readonly string[]).includes(t.id))
      : TABS_CONFIG
  ).filter((t) => canEditProject || t.id !== 'settings');
  const normalizeTabParam = (param: string | null): ProjectTab => {
    if (param === 'stakeholders') return 'team';
    if (param === 'vos' || param === 'vo') return 'change_orders';
    return (param || 'overview') as ProjectTab;
  };
  const rawTab = normalizeTabParam(searchParams.get('tab'));
  const initialTab = ALLOWED_TABS.includes(rawTab) ? rawTab : 'overview';
  const [activeTab, setActiveTabState] = useState<ProjectTab>(initialTab);

  // Tab button references for accessible keyboard navigation and scroll-into-view
  const tabRefs = useRef<Record<ProjectTab, HTMLButtonElement | null>>({
    overview: null,
    contracts: null,
    wbs: null,
    boq: null,
    cost_control: null,
    milestones: null,
    change_orders: null,
    invoices: null,
    snags: null,
    documents: null,
    team: null,
    org_chart: null,
    audit_log: null,
    archive: null,
    settings: null,
  });

  // Keep URL in sync when tab changes with non-blocking transition
  const setActiveTab = useCallback((tab: ProjectTab, shouldScrollToTab = false) => {
    const targetTab = ALLOWED_TABS.includes(tab) ? tab : 'overview';
    setTabPulse(true);
    setTimeout(() => setTabPulse(false), 600);
    if (shouldScrollToTab && typeof document !== 'undefined') {
      const anchor = document.getElementById('project-tabs-anchor');
      anchor?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (targetTab === activeTab && !isPending) return;
    setPendingTab(targetTab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', targetTab);
      router.replace(url.pathname + url.search, { scroll: false });
    }
    startTransition(() => {
      setActiveTabState(targetTab);
      setPendingTab(null);
    });
  }, [activeTab, isPending, router]);

  // Sync tab if URL changes externally (enforce fallback to overview if unallowed tab requested)
  const rawTabParam = searchParams.get('tab');
  useEffect(() => {
    if (rawTabParam) {
      const t = normalizeTabParam(rawTabParam);
      const targetTab = ALLOWED_TABS.includes(t) ? t : 'overview';
      setActiveTabState((prev) => (prev !== targetTab ? targetTab : prev));
    }
  }, [rawTabParam]);

  // Scroll active tab into view when changed (vital for small viewports / mobile swipe)
  useEffect(() => {
    const activeEl = tabRefs.current[activeTab];
    if (activeEl) {
      activeEl.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    }
  }, [activeTab]);

  // Accessible WAI-ARIA keyboard navigation for tabs
  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, currentTab: ProjectTab) => {
    const currentIndex = ALLOWED_TABS.indexOf(currentTab);
    if (currentIndex === -1) return;

    const isRtl = dir === 'rtl';
    let targetIndex = -1;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      // In RTL, ArrowRight moves to previous tab; in LTR, ArrowRight moves to next tab
      targetIndex = isRtl
        ? (currentIndex - 1 + ALLOWED_TABS.length) % ALLOWED_TABS.length
        : (currentIndex + 1) % ALLOWED_TABS.length;
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      // In RTL, ArrowLeft moves to next tab; in LTR, ArrowLeft moves to previous tab
      targetIndex = isRtl
        ? (currentIndex + 1) % ALLOWED_TABS.length
        : (currentIndex - 1 + ALLOWED_TABS.length) % ALLOWED_TABS.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      targetIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      targetIndex = ALLOWED_TABS.length - 1;
    }

    if (targetIndex >= 0) {
      const nextTab = ALLOWED_TABS[targetIndex];
      setActiveTab(nextTab);
      tabRefs.current[nextTab]?.focus();
    }
  };

  const isValidProjectUuid = Boolean(
    id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  );

  const loadProject = useCallback(async () => {
    if (!isValidProjectUuid) return;
    try {
      const data = await ProjectService.getProjectById(id);
      setProject(data);
    } catch (err) {
      console.error('Failed to load project:', err);
    }
  }, [id, isValidProjectUuid]);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      if (!isValidProjectUuid) {
        if (!cancelled) {
          setProject(null);
          setClientContacts([]);
          setLoading(false);
        }
        return;
      }
      setLoading(true);
      try {
        const [projResult, contactsResult] = await Promise.allSettled([
          ProjectService.getProjectById(id),
          ProjectService.getProjectClientContacts(id),
        ]);
        if (!cancelled) {
          setProject(projResult.status === 'fulfilled' ? projResult.value : null);
          setClientContacts(contactsResult.status === 'fulfilled' ? (contactsResult.value || []) : []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, [id, isValidProjectUuid]);

  // Derive Client PM and Owner PM from contacts
  const clientPM = clientContacts.find(
    (c) => c.party_type === 'client' && (c.is_primary || (c.job_title || '').includes('مدير'))
  ) || clientContacts.find((c) => c.party_type === 'client');

  const isSubContractor = project?.pzone_role === 'Sub Contractor' || project?.pzone_role === 'sub_contractor';
  const ownerPM = clientContacts.find(
    (c) => c.party_type === 'main_contractor_above' && (c.is_primary || (c.job_title || '').includes('مدير'))
  ) || clientContacts.find((c) => c.party_type === 'main_contractor_above');


  const handleStatusChange = async (
    newStatus: ProjectStatus, 
    reason?: string,
    handoverData?: { tocLetter: string; checklist: HandoverChecklistData },
    closeoutData?: ProjectCloseoutAuditPayload
  ) => {
    if (!project) return;

    if (newStatus === 'on_hold' && !reason) {
      setShowHoldModal(true);
      return;
    }

    if (newStatus === 'cancelled' && !reason) {
      setShowCancelModal(true);
      return;
    }

    if (newStatus === 'handing_over' && !handoverData) {
      setShowHandoverModal(true);
      return;
    }

    if (newStatus === 'finished' && !closeoutData) {
      setShowFinishCloseoutModal(true);
      return;
    }

    setUpdatingStatus(true);
    setStatusFeedback(null);
    try {
      const updates: Partial<Project> = { status: newStatus };
      if (newStatus === 'on_hold') {
        const trimmedReason = reason?.trim() || 'إيقاف مؤقت بطلب من إدارة المشروع';
        updates.hold_reason = trimmedReason;
        updates.suspension_reason = trimmedReason;
      } else if (newStatus === 'cancelled') {
        const trimmedReason = reason?.trim() || 'إلغاء المشروع بطلب من الإدارة';
        updates.cancel_reason = trimmedReason;
        updates.cancellation_reason = trimmedReason;
      } else if (newStatus === 'handing_over' && handoverData) {
        updates.toc_letter = handoverData.tocLetter;
        updates.metadata = {
          ...(project.metadata || {}),
          handover_checklist: handoverData.checklist,
        };
      } else if (newStatus === 'finished' && closeoutData) {
        updates.metadata = {
          ...(project.metadata || {}),
          closeout_audit: closeoutData,
          retention_tranche_1_released: closeoutData.retention.tranche_1_collected,
          retention_tranche_2_released: closeoutData.retention.tranche_2_collected,
          performance_bond_released: closeoutData.guarantees.performance_bond_returned,
          advance_payment_bond_returned: closeoutData.guarantees.advance_payment_bond_returned,
        };
        if (!project.actual_finish_date) {
          updates.actual_finish_date = closeoutData.closed_at
            ? closeoutData.closed_at.split('T')[0]
            : new Date().toISOString().split('T')[0];
        }
      }
      const updated = await ProjectService.updateProject(project.id, updates);
      setProject(updated);
      setShowHoldModal(false);
      setShowCancelModal(false);
      setShowHandoverModal(false);
      setShowFinishCloseoutModal(false);
      setStatusFeedback({
        type: 'success',
        message: isAr
          ? (newStatus === 'on_hold'
              ? 'تم تحويل حالة المشروع إلى (إيقاف مؤقت) بنجاح'
              : newStatus === 'cancelled'
              ? 'تم تحويل حالة المشروع إلى (ملغي) بنجاح'
              : newStatus === 'handing_over'
              ? 'تم اعتماد إجراءات ومحضر التسليم الابتدائي بنجاح'
              : newStatus === 'finished'
              ? 'تم اعتماد الإغلاق النهائي للمشروع وتصفية الضمانات بنجاح'
              : 'تم تحديث حالة المشروع بنجاح')
          : (newStatus === 'on_hold'
              ? 'Project put on hold successfully'
              : newStatus === 'cancelled'
              ? 'Project cancelled successfully'
              : newStatus === 'handing_over'
              ? 'PMI Handover verification completed and status updated'
              : newStatus === 'finished'
              ? 'Project final closeout approved and status updated to finished'
              : 'Project status updated successfully'),
      });
    } catch (err: unknown) {
      const errorMsg = (err as Error)?.message || (isAr ? 'فشل تحديث حالة المشروع، يرجى المحاولة مرة أخرى' : 'Failed to update project status');
      console.error('Status update failed:', err);
      setStatusFeedback({
        type: 'error',
        message: errorMsg,
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleArchive = async () => {
    if (!project) return;
    setArchiving(true);
    try {
      await ProjectService.archiveProject(project.id, 'User Action');
      router.push('/projects');
    } catch (err) {
      console.error('Archive failed:', err);
      setArchiving(false);
      setShowArchiveConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-[400px] py-16 flex items-center justify-center">
        <div className="animate-pulse space-y-4 text-center">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-700 dark:border-emerald-400 border-t-transparent animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
            {isAr ? 'جاري تحميل بيانات المشروع...' : 'Loading project details...'}
          </p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="w-full min-h-[400px] py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          {isAr ? 'المشروع غير موجود' : 'Project not found'}
        </h2>
        <Link href="/projects" className="text-emerald-700 dark:text-emerald-400 underline text-xs font-bold">
          {isAr ? 'العودة للقائمة' : 'Back to Projects'}
        </Link>
      </div>
    );
  }

  const formattedContractValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(project.contract_value || 0);

  const formattedVosValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(project.vos_value || 0);

  const formattedTotalValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(project.total_contract_value || 0);

  const projMeta = ((project as any).metadata || {}) as Record<string, any>;
  const rawAdvPct =
    (project as any).advance_payment_pct ??
    projMeta.advance_payment?.percentage ??
    projMeta.advance_payment_pct ??
    projMeta.down_payment_pct;
  const advancePaymentPct =
    projMeta.advance_payment?.has_advance === false
      ? 0
      : Number(rawAdvPct !== undefined && rawAdvPct !== null ? rawAdvPct : 15);
  const advancePaymentValue =
    projMeta.advance_payment_value && Number(projMeta.advance_payment_value) > 0
      ? Number(projMeta.advance_payment_value)
      : ((Number(project.contract_value_egp || project.contract_value || 0) * advancePaymentPct) / 100);
  const formattedAdvanceValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(advancePaymentValue || 0);

  return (
    <div className="w-full max-w-none space-y-6">
      {/* ═══ Official Executive Print Report Header (Visible only on print/PDF) ═══ */}
      <div className="hidden print:flex items-center justify-between border-b-2 border-stone-800 pb-4 mb-4" dir="rtl">
        <div className="flex items-center gap-3">
          <img
            src="/pzone-logo-dark.png"
            alt="P.ZONE"
            className="h-10 w-auto object-contain"
            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
          />
          <div>
            <h2 className="text-base font-black text-black">P.Zone International | بي زون التجارية</h2>
            <p className="text-[11px] text-stone-600 font-bold">
              {isAr ? 'تقرير ملخص بيانات المشروع التنفيذي' : 'Executive Project Summary Report'}
            </p>
          </div>
        </div>
        <div className="text-left text-[10px] text-stone-700 space-y-0.5" dir="ltr">
          <p><strong>Code:</strong> #{project.project_code}</p>
          <p><strong>Printed:</strong> {new Date().toLocaleDateString('en-GB')}</p>
          <p className="font-mono text-[9px] text-stone-500">P.ZONE ERP • CONFIDENTIAL</p>
        </div>
      </div>

      {/* Back Navigation */}
      <div className="print:hidden">
        <BackButton href="/projects" label={isAr ? "العودة لقائمة المشاريع" : "Back to Projects"} />
      </div>

      {/* Hero Banner Card */}
      <div
        className={`rounded-2xl p-4 sm:p-6 lg:p-7 border border-slate-200/90 dark:border-slate-800 bg-gradient-to-br from-white via-slate-50/50 to-slate-100/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-white shadow-xl shadow-slate-200/40 dark:shadow-none relative overflow-hidden transition-all duration-300 ${
          isSwitchingProject ? 'opacity-75 scale-[0.995] ring-2 ring-emerald-500/40' : ''
        }`}
      >
        {isSwitchingProject && (
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 animate-pulse z-20" />
        )}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5 sm:gap-6 relative z-10">
          <div className="space-y-3.5 flex-1 min-w-0">
            {/* Badges Bar + Inline Quick Project Switcher */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <div className="relative inline-flex items-center group">
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-mono font-black text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-3 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800/80 shadow-sm group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/80 group-hover:border-emerald-400 transition-all duration-200"
                  dir="ltr"
                >
                  #{project.project_code}
                  {allProjects.length > 1 && (
                    <ChevronDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 group-hover:translate-y-0.5 transition-transform" />
                  )}
                </span>
                {allProjects.length > 1 && (
                  <select
                    aria-label={isAr ? 'التبديل السريع بين المشاريع' : 'Quick project switcher'}
                    value={project.id}
                    onChange={(e) => {
                      const nextId = e.target.value;
                      if (!nextId || nextId === project.id) return;
                      setIsSwitchingProject(true);
                      setActiveProjectId(nextId);
                      const tabQuery = activeTab && activeTab !== 'overview' ? `?tab=${activeTab}` : '';
                      router.push(`/projects/${nextId}${tabQuery}`);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    title={isAr ? 'اضغط للتبديل السريع لمشروع آخر' : 'Click to quickly switch project'}
                  >
                    {allProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.project_code ? `[#${p.project_code}] ` : ''}
                        {p.project_name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <StatusBadge status={project.status} lang={lang} size="lg" />
              {project.pzone_role && (
                <button
                  type="button"
                  onClick={() => setActiveTab('contracts', true)}
                  title={isAr ? 'اضغط لعرض تفاصيل الدور التعاقدي والعقد' : 'Click to view contractual role & contract'}
                  className="text-xs px-3 py-1 rounded-xl bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-950/50 text-slate-700 hover:text-emerald-700 dark:text-slate-200 dark:hover:text-emerald-300 font-bold border border-slate-200/80 hover:border-emerald-300 dark:border-slate-700 dark:hover:border-emerald-800 shadow-sm hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>
                    {project.pzone_role === 'Main Contractor' || project.pzone_role === 'main_contractor' 
                      ? (isAr ? 'مقاول رئيسي' : 'Main Contractor') 
                      : (isAr ? 'مقاول باطن' : 'Sub Contractor')}
                  </span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </button>
              )}
              {isSwitchingProject && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20 animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {isAr ? 'جارٍ الانتقال للمشروع المحدد...' : 'Switching project...'}
                </span>
              )}
            </div>

            {/* Project Titles */}
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-snug break-words transition-all">
                {project.project_name}
              </h1>
              {project.project_name_en && (
                <p className="text-xs font-mono text-slate-400 dark:text-slate-500 font-medium text-start mt-1" dir="ltr">
                  {project.project_name_en}
                </p>
              )}
            </div>

            {/* Executive Metadata Chips Grid (Fully Interactive) */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-xs text-slate-600 dark:text-slate-200 pt-1">
              <button
                type="button"
                className="group inline-flex items-center gap-2 bg-amber-500/10 text-amber-800 dark:text-amber-300 px-3 py-1.5 rounded-xl border border-amber-500/25 cursor-pointer hover:bg-amber-500/20 hover:-translate-y-0.5 hover:shadow-md active:scale-95 transition-all duration-200 shadow-sm max-w-full"
                onClick={() => setActiveTab('team', true)}
                title={isAr ? "عرض وإدارة المالك في تبويب الشركاء والعملاء" : "View and manage owner in team tab"}
              >
                <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="truncate">
                  {isAr ? 'المالك: ' : 'Owner: '}
                  <strong>{getOwnerFromProject(project)}</strong>
                </span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-70 transition-opacity shrink-0" />
              </button>

              <button
                type="button"
                className="group inline-flex items-center gap-2 bg-purple-500/10 text-purple-800 dark:text-purple-300 px-3 py-1.5 rounded-xl border border-purple-500/25 cursor-pointer hover:bg-purple-500/20 hover:-translate-y-0.5 hover:shadow-md active:scale-95 transition-all duration-200 shadow-sm max-w-full"
                onClick={() => setActiveTab('team', true)}
                title={isAr ? "مدير المشروع من طرف بي زون — اضغط للانتقال لإدارة فريق العمل" : "P.ZONE Project Manager — click to manage team"}
              >
                <Users className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="truncate">
                  {isAr ? 'مدير المشروع (بي زون): ' : 'P.ZONE PM: '}
                  <strong>{project.pm_full_name || project.project_manager_name_raw || project.project_manager || (isAr ? 'غير معين' : 'Unassigned')}</strong>
                </span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-70 transition-opacity shrink-0" />
              </button>

              <button
                type="button"
                className="group inline-flex items-center gap-2 bg-sky-500/10 text-sky-800 dark:text-sky-300 px-3 py-1.5 rounded-xl border border-sky-500/25 cursor-pointer hover:bg-sky-500/20 hover:-translate-y-0.5 hover:shadow-md active:scale-95 transition-all duration-200 shadow-sm max-w-full"
                onClick={() => setActiveTab('team', true)}
                title={isAr ? "مدير المشروع من طرف العميل — يُستخرج من تبويب الشركاء والعملاء" : "Client Project Manager — from stakeholders"}
              >
                <Briefcase className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="truncate">
                  {isAr ? 'مدير مشروع العميل: ' : 'Client PM: '}
                  <strong>{clientPM?.contact_name || (isAr ? 'غير محدد' : 'Unspecified')}</strong>
                </span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-70 transition-opacity shrink-0" />
              </button>

              {isSubContractor && (
                <button
                  type="button"
                  className="group inline-flex items-center gap-2 bg-orange-500/10 text-orange-800 dark:text-orange-300 px-3 py-1.5 rounded-xl border border-orange-500/25 cursor-pointer hover:bg-orange-500/20 hover:-translate-y-0.5 hover:shadow-md active:scale-95 transition-all duration-200 shadow-sm max-w-full"
                  onClick={() => setActiveTab('team', true)}
                  title={isAr ? "مدير المشروع من طرف المالك — يظهر في حالة مقاول الباطن" : "Owner Project Manager"}
                >
                  <Crown className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="truncate">
                    {isAr ? 'مدير مشروع المالك: ' : 'Owner PM: '}
                    <strong>{ownerPM?.contact_name || (isAr ? 'غير محدد' : 'Unspecified')}</strong>
                  </span>
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-70 transition-opacity shrink-0" />
                </button>
              )}

              <button
                type="button"
                className="group inline-flex items-center gap-2 bg-cyan-500/10 text-cyan-800 dark:text-cyan-300 px-3 py-1.5 rounded-xl border border-cyan-500/25 cursor-pointer hover:bg-cyan-500/20 hover:-translate-y-0.5 hover:shadow-md active:scale-95 transition-all duration-200 shadow-sm max-w-full"
                onClick={() => setActiveTab('team', true)}
                title={isAr ? "عرض وإدارة العميل في تبويب الشركاء والعملاء" : "View client in team tab"}
              >
                <Building2 className="w-4 h-4 text-cyan-700 dark:text-cyan-400 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="truncate">
                  {isAr ? 'العميل: ' : 'Client: '}
                  <strong className="text-slate-900 dark:text-white">{project.client?.name_ar || project.client_name_raw || (isAr ? 'عميل مباشر' : 'Direct Client')}</strong>
                </span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-70 transition-opacity shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('overview', true)}
                title={isAr ? "اضغط لعرض الموقع والخريطة في النظرة العامة" : "Click to view site location & map in Overview"}
                className="group inline-flex items-center gap-2 bg-slate-100 hover:bg-emerald-500/10 dark:bg-slate-800/60 dark:hover:bg-emerald-500/15 px-3 py-1.5 rounded-xl border border-slate-200/80 hover:border-emerald-500/30 dark:border-slate-700/80 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-95 transition-all duration-200 max-w-full"
              >
                <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="truncate">
                  {isAr ? 'الموقع: ' : 'Location: '}
                  <strong className="text-slate-900 dark:text-white">
                    {(() => {
                      const isRawCoords = project.site_location_address && 
                        /^\s*[-+]?[0-9]*\.?[0-9]+\s*,\s*[-+]?[0-9]*\.?[0-9]+\s*$/.test(project.site_location_address);
                      const cleanAddress = isRawCoords ? null : project.site_location_address;
                      const locParts = [
                        project.governorate?.name_ar,
                        project.city?.name_ar,
                        cleanAddress,
                      ].filter(Boolean);
                      if (locParts.length > 0) return locParts.join(' - ');
                      if (project.project_name?.includes('الساحل')) return 'الساحل الشمالي - مطروح';
                      if (project.project_name?.includes('زايد')) return 'الشيخ زايد - الجيزة';
                      if (project.project_name?.includes('أكتوبر')) return 'السادس من أكتوبر - الجيزة';
                      if (project.project_name?.includes('التجمع')) return 'القاهرة الجديدة';
                      return isAr ? 'غير محدد' : 'Unspecified';
                    })()}
                  </strong>
                </span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-70 transition-opacity shrink-0" />
              </button>
            </div>

            {/* Interactive Dynamic KPI Quick-Jump Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 print:hidden">
              <button
                type="button"
                onClick={() => setActiveTab('contracts', true)}
                className={`group text-start p-3 rounded-xl border transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] ${
                  activeTab === 'contracts'
                    ? 'bg-emerald-50/90 dark:bg-emerald-950/50 border-emerald-400 dark:border-emerald-700 ring-1 ring-emerald-400/50 shadow-sm'
                    : 'bg-white/80 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-300 dark:hover:border-emerald-700'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  <span>{isAr ? 'القيمة التعاقدية الختامية' : 'Revised Contract'}</span>
                  <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-xs sm:text-sm font-black font-mono text-slate-900 dark:text-white mt-1 truncate" dir="ltr">
                  {formattedTotalValue}
                </p>
              </button>

              {focusedMode ? (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveTab('documents', true)}
                    className={`group text-start p-3 rounded-xl border transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] ${
                      activeTab === 'documents'
                        ? 'bg-blue-50/90 dark:bg-blue-950/50 border-blue-400 dark:border-blue-700 ring-1 ring-blue-400/50 shadow-sm'
                        : 'bg-white/80 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80 hover:border-blue-300 dark:hover:border-blue-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      <span>{isAr ? 'المستندات والمحاضر' : 'Documents & Protocols'}</span>
                      <Folder className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-xs font-extrabold text-blue-700 dark:text-blue-300 mt-1 flex items-center gap-1">
                      <span>{isAr ? 'فتح ملفات المشروع' : 'Open Documents'}</span>
                      <ExternalLink className="w-3 h-3 opacity-75 group-hover:translate-x-0.5 transition-transform" />
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('team', true)}
                    className={`group text-start p-3 rounded-xl border transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] ${
                      activeTab === 'team'
                        ? 'bg-purple-50/90 dark:bg-purple-950/50 border-purple-400 dark:border-purple-700 ring-1 ring-purple-400/50 shadow-sm'
                        : 'bg-white/80 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80 hover:border-purple-300 dark:hover:border-purple-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      <span>{isAr ? 'فريق العمل والشركاء' : 'Team & Stakeholders'}</span>
                      <Users className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-xs font-extrabold text-purple-700 dark:text-purple-300 mt-1 flex items-center gap-1">
                      <span>
                        {canEditProject
                          ? isAr
                            ? 'إدارة الفريق والصلاحيات'
                            : 'Manage Project Team'
                          : isAr
                          ? 'عرض الفريق والشركاء'
                          : 'View Project Team'}
                      </span>
                      <ExternalLink className="w-3 h-3 opacity-75 group-hover:translate-x-0.5 transition-transform" />
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('audit_log', true)}
                    className={`group text-start p-3 rounded-xl border transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] ${
                      activeTab === 'audit_log'
                        ? 'bg-amber-50/90 dark:bg-amber-950/50 border-amber-400 dark:border-amber-700 ring-1 ring-amber-400/50 shadow-sm'
                        : 'bg-white/80 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80 hover:border-amber-300 dark:hover:border-amber-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      <span>{isAr ? 'سجل التدقيق' : 'Audit Log'}</span>
                      <History className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-xs font-extrabold text-amber-700 dark:text-amber-300 mt-1 flex items-center gap-1">
                      <span>{isAr ? 'تتبع الحركات والاعتمادات' : 'View Activity Log'}</span>
                      <ExternalLink className="w-3 h-3 opacity-75 group-hover:translate-x-0.5 transition-transform" />
                    </p>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveTab('change_orders', true)}
                    className={`group text-start p-3 rounded-xl border transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] ${
                      activeTab === 'change_orders'
                        ? 'bg-purple-50/90 dark:bg-purple-950/50 border-purple-400 dark:border-purple-700 ring-1 ring-purple-400/50 shadow-sm'
                        : 'bg-white/80 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80 hover:border-purple-300 dark:hover:border-purple-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      <span>{isAr ? 'أوامر التغيير (VOs)' : 'Variation Orders'}</span>
                      <FileDiff className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <p
                      className={`text-xs sm:text-sm font-black font-mono mt-1 truncate ${
                        (project.vos_value || 0) > 0
                          ? 'text-purple-700 dark:text-purple-300'
                          : (project.vos_value || 0) < 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                      dir="ltr"
                    >
                      {(project.vos_value || 0) > 0 ? '+' : ''}
                      {formattedVosValue}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('boq', true)}
                    className={`group text-start p-3 rounded-xl border transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] ${
                      activeTab === 'boq'
                        ? 'bg-cyan-50/90 dark:bg-cyan-950/50 border-cyan-400 dark:border-cyan-700 ring-1 ring-cyan-400/50 shadow-sm'
                        : 'bg-white/80 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80 hover:border-cyan-300 dark:hover:border-cyan-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      <span>{isAr ? 'المقايسة (BOQ)' : 'BOQ & Specs'}</span>
                      <ClipboardList className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-xs font-extrabold text-cyan-700 dark:text-cyan-300 mt-1 flex items-center gap-1">
                      <span>{isAr ? 'فتح جدول الكميات' : 'Open BOQ Table'}</span>
                      <ExternalLink className="w-3 h-3 opacity-75 group-hover:translate-x-0.5 transition-transform" />
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('cost_control', true)}
                    className={`group text-start p-3 rounded-xl border transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] ${
                      activeTab === 'cost_control'
                        ? 'bg-amber-50/90 dark:bg-amber-950/50 border-amber-400 dark:border-amber-700 ring-1 ring-amber-400/50 shadow-sm'
                        : 'bg-white/80 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80 hover:border-amber-300 dark:hover:border-amber-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      <span>{isAr ? 'مراقبة التكاليف' : 'Cost Control'}</span>
                      <TrendingUp className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-xs font-extrabold text-amber-700 dark:text-amber-300 mt-1 flex items-center gap-1">
                      <span>{isAr ? 'تحليل الأداء والتكلفة' : 'EVM & Cost Control'}</span>
                      <ExternalLink className="w-3 h-3 opacity-75 group-hover:translate-x-0.5 transition-transform" />
                    </p>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Executive Action Buttons & Status Segmented Bar */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch gap-3 shrink-0 w-full lg:w-auto print:hidden">
            {/* Quick Actions */}
            <div className="flex items-center gap-2 w-full">
              {canEditProject && (
                <Link
                  href={`/projects/${project.id}/edit`}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition-all cursor-pointer min-h-[44px]"
                  title={isAr ? "تعديل بيانات المشروع" : "Edit project details"}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تعديل المشروع' : 'Edit Project'}</span>
                </Link>
              )}
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-all cursor-pointer min-h-[44px] min-w-[44px]"
                aria-label={isAr ? "طباعة تقرير المشروع" : "Print project report"}
                title={isAr ? "طباعة تقرير المشروع" : "Print report"}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{isAr ? 'طباعة' : 'Print'}</span>
              </button>
            </div>

            {/* Status Feedback Notification Alert */}
            {statusFeedback && (
              <div
                role="alert"
                className={`p-2.5 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 animate-fadeIn border ${
                  statusFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  {statusFeedback.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  )}
                  <span className="truncate">{statusFeedback.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStatusFeedback(null)}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/10 dark:hover:bg-slate-800/50 cursor-pointer shrink-0"
                  aria-label={isAr ? "إغلاق الإشعار" : "Dismiss notification"}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Status Transition Control Buttons */}
            {(canEditProject || project.status === 'on_hold' || project.status === 'cancelled' || project.status === 'handing_over') && (
            <div className="rounded-2xl p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-1.5 w-full">
              {canEditProject && (
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block px-1 text-start">
                  {isAr ? 'تحديث حالة المشروع:' : 'Update Status:'}
                </span>
              )}
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {canEditProject && (
                  <>
                <button
                  type="button"
                  aria-pressed={project.status === 'working'}
                  aria-busy={updatingStatus}
                  disabled={updatingStatus || project.status === 'working'}
                  onClick={() => handleStatusChange('working')}
                  className={`px-2.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:cursor-not-allowed min-h-[44px] ${
                    project.status === 'working'
                      ? 'bg-sky-600 text-white shadow-sm ring-1 ring-sky-500'
                      : 'bg-sky-50 hover:bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 dark:hover:bg-sky-900/50 border border-sky-200/80 dark:border-sky-800/80 disabled:opacity-40'
                  }`}
                >
                  {isAr ? 'قيد التنفيذ' : 'In Progress'}
                </button>
                <button
                  type="button"
                  aria-pressed={project.status === 'on_hold'}
                  aria-busy={updatingStatus}
                  aria-haspopup="dialog"
                  aria-controls={showHoldModal ? 'hold_project_modal' : undefined}
                  disabled={updatingStatus}
                  onClick={() => {
                    if (project.status === 'on_hold') {
                      setShowHoldModal(true);
                    } else {
                      handleStatusChange('on_hold');
                    }
                  }}
                  className={`px-2.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:cursor-not-allowed min-h-[44px] ${
                    project.status === 'on_hold'
                      ? 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-500'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 dark:hover:bg-amber-900/50 border border-amber-200/80 dark:border-amber-800/80 disabled:opacity-40'
                  }`}
                  title={project.status === 'on_hold' ? (isAr ? 'عرض أو تعديل سبب الإيقاف المؤقت' : 'View or edit hold reason') : (isAr ? 'إيقاف المشروع مؤقتاً' : 'Put project on hold')}
                >
                  {isAr ? 'إيقاف مؤقت' : 'On Hold'}
                </button>
                <button
                  type="button"
                  aria-pressed={project.status === 'handing_over'}
                  aria-busy={updatingStatus}
                  aria-haspopup="dialog"
                  aria-controls={showHandoverModal ? 'handover_project_modal' : undefined}
                  disabled={updatingStatus}
                  onClick={() => {
                    if (project.status === 'handing_over') {
                      setShowHandoverModal(true);
                    } else {
                      handleStatusChange('handing_over');
                    }
                  }}
                  className={`px-2.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:cursor-not-allowed min-h-[44px] ${
                    project.status === 'handing_over'
                      ? 'bg-purple-600 text-white shadow-sm ring-1 ring-purple-500'
                      : 'bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 dark:hover:bg-purple-900/50 border border-purple-200/80 dark:border-purple-800/80 disabled:opacity-40'
                  }`}
                  title={
                    project.status === 'handing_over'
                      ? (isAr ? 'عرض أو تعديل إجراءات ومحضر التسليم الابتدائي' : 'View or edit handover requirements')
                      : (isAr ? 'بدء إجراءات ومحضر التسليم الابتدائي' : 'Start Handover Process (PMI)')
                  }
                >
                  {isAr ? 'تسليم' : 'Handover'}
                </button>
                <button
                  type="button"
                  aria-pressed={project.status === 'finished'}
                  aria-busy={updatingStatus}
                  aria-haspopup="dialog"
                  aria-controls={showFinishCloseoutModal ? 'finish_project_closeout_modal' : undefined}
                  disabled={updatingStatus}
                  onClick={() => {
                    setShowFinishCloseoutModal(true);
                  }}
                  className={`px-2.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:cursor-not-allowed min-h-[44px] ${
                    project.status === 'finished'
                      ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-500'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/50 border border-emerald-200/80 dark:border-emerald-800/80 disabled:opacity-40'
                  }`}
                  title={
                    project.status === 'finished'
                      ? (isAr ? 'عرض بيانات واعتمادات الإغلاق النهائي للمشروع' : 'View final closeout audit')
                      : (isAr ? 'بدء إجراءات الإغلاق النهائي وتصفية الضمانات' : 'Start Final Closeout Gate')
                  }
                >
                  {isAr ? 'إنهاء' : 'Finished'}
                </button>

                <button
                  type="button"
                  aria-pressed={project.status === 'cancelled'}
                  aria-busy={updatingStatus}
                  aria-haspopup="dialog"
                  aria-controls={showCancelModal ? 'cancel_project_modal' : undefined}
                  disabled={updatingStatus}
                  onClick={() => {
                    if (project.status === 'cancelled') {
                      setShowCancelModal(true);
                    } else {
                      handleStatusChange('cancelled');
                    }
                  }}
                  className={`col-span-2 px-2.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:cursor-not-allowed min-h-[44px] ${
                    project.status === 'cancelled'
                      ? 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-500'
                      : 'bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-900/50 border border-rose-200/80 dark:border-rose-800/80 disabled:opacity-40'
                  }`}
                  title={project.status === 'cancelled' ? (isAr ? 'عرض أو تعديل سبب الإلغاء' : 'View or edit cancellation reason') : (isAr ? 'إلغاء المشروع' : 'Cancel project')}
                >
                  {isAr ? 'إلغاء المشروع' : 'Cancel Project (Cancelled)'}
                </button>
                  </>
                )}

                {project.status === 'on_hold' && (
                  <div className="col-span-2 mt-1.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-start space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-400">
                        {isAr ? 'سبب الإيقاف المؤقت:' : 'Hold Reason:'}
                      </span>
                      {canEditProject && (
                        <button
                          type="button"
                          onClick={() => setShowHoldModal(true)}
                          aria-haspopup="dialog"
                          aria-controls={showHoldModal ? 'hold_project_modal' : undefined}
                          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-[10px] font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 underline cursor-pointer"
                          aria-label={isAr ? 'تعديل سبب الإيقاف المؤقت' : 'Edit hold reason'}
                        >
                          {isAr ? 'تعديل' : 'Edit'}
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 line-clamp-2">
                      {project.hold_reason || project.suspension_reason || (isAr ? 'إيقاف مؤقت بطلب من إدارة المشروع' : 'On hold by management')}
                    </p>
                  </div>
                )}

                {project.status === 'cancelled' && (
                  <div className="col-span-2 mt-1.5 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-start space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-rose-700 dark:text-rose-400">
                        {isAr ? 'سبب إلغاء المشروع:' : 'Cancellation Reason:'}
                      </span>
                      {canEditProject && (
                        <button
                          type="button"
                          onClick={() => setShowCancelModal(true)}
                          aria-haspopup="dialog"
                          aria-controls={showCancelModal ? 'cancel_project_modal' : undefined}
                          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-[10px] font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 underline cursor-pointer"
                          aria-label={isAr ? 'تعديل سبب الإلغاء' : 'Edit cancellation reason'}
                        >
                          {isAr ? 'تعديل' : 'Edit'}
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] font-semibold text-rose-900 dark:text-rose-200 line-clamp-2">
                      {project.cancel_reason || project.cancellation_reason || (isAr ? 'إلغاء المشروع بطلب من الإدارة' : 'Cancelled by management')}
                    </p>
                  </div>
                )}

                {project.status === 'handing_over' && (
                  <div className="col-span-2 mt-1.5 p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-start space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-purple-700 dark:text-purple-400">
                        {isAr ? 'بيانات وإجراءات التسليم الابتدائي:' : 'PMI Handover Requirements:'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setShowHandoverCertModal(true)}
                          className="min-h-[44px] px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] inline-flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                          title={isAr ? 'عرض وطباعة محضر الاستلام الرسمي' : 'Print Official Certificate'}
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>{isAr ? 'طباعة المحضر' : 'Print Certificate'}</span>
                        </button>
                        {canEditProject && (
                          <button
                            type="button"
                            onClick={() => setShowHandoverModal(true)}
                            aria-haspopup="dialog"
                            aria-controls={showHandoverModal ? 'handover_project_modal' : undefined}
                            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-[10px] font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 underline cursor-pointer"
                            aria-label={isAr ? 'تعديل إجراءات التسليم' : 'Edit handover details'}
                          >
                            {isAr ? 'تعديل / مراجعة' : 'Review / Edit'}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                      <span className="px-2 py-0.5 rounded-md font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-500/20">
                        {isAr ? `المحضر: ${project.toc_letter || 'قيد الاستيفاء'}` : `TOC: ${project.toc_letter || 'Pending'}`}
                      </span>
                      {project.metadata?.handover_checklist?.snag_list_completed && (
                        <span className="px-2 py-0.5 rounded-md font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                          {project.metadata.handover_checklist.snag_list_type === 'no_snags'
                            ? (isAr ? 'بدون ملاحظات' : 'No Snags')
                            : (isAr ? `نواقص: ${project.metadata.handover_checklist.snag_clearance_days} يوم` : `${project.metadata.handover_checklist.snag_clearance_days}d Snags`)}
                        </span>
                      )}
                      {project.metadata?.handover_checklist?.testing_commissioning_passed && (
                        <span className="px-2 py-0.5 rounded-md font-bold bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border border-teal-500/20">
                          {isAr ? 'فحص التشغيل معتمد' : 'T&C Passed'}
                        </span>
                      )}
                    </div>
                    {project.metadata?.handover_checklist?.handover_notes && (
                      <p className="text-[11px] font-semibold text-purple-950 dark:text-purple-200 line-clamp-2 pt-0.5">
                        {project.metadata.handover_checklist.handover_notes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar - Executive Segmented Control with WAI-ARIA tablist */}
      <div
        id="project-tabs-anchor"
        className={`sticky top-0 sm:top-2 z-30 rounded-2xl bg-white/85 dark:bg-slate-900/85 p-1.5 border border-slate-200/90 dark:border-slate-800 shadow-md backdrop-blur-md print:hidden transition-all duration-300 ${
          tabPulse ? 'ring-2 ring-emerald-500/60 shadow-lg shadow-emerald-500/10' : ''
        }`}
      >
        <div 
          role="tablist"
          aria-label={isAr ? "أقسام تفاصيل المشروع" : "Project detail sections"}
          aria-orientation="horizontal"
          className="flex flex-wrap items-center gap-1 sm:gap-1.5 py-0.5 px-0.5"
        >
          {visibleTabsConfig.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isTabPending = isPending && pendingTab === tab.id;

            return (
              <button
                key={tab.id}
                ref={(el) => { tabRefs.current[tab.id] = el; }}
                type="button"
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={isActive ? `project-tabpanel-${tab.id}` : undefined}
                tabIndex={isActive ? 0 : -1}
                data-testid={tab.testId}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(e) => handleTabKeyDown(e, tab.id)}
                className={`relative group flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0 min-h-[42px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
                  isActive
                    ? `bg-white dark:bg-slate-800 ${tab.activeColorClass} shadow-md ring-1 ring-slate-200/90 dark:ring-slate-700/90 ${
                        tabPulse ? 'scale-[1.03] ring-2 ring-emerald-500/50' : ''
                      }`
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:-translate-y-0.5'
                }`}
              >
                <div className={`p-1.5 rounded-lg transition-transform duration-200 group-hover:scale-105 ${isActive ? tab.iconBgClass : 'text-slate-400 dark:text-slate-500 bg-slate-100/60 dark:bg-slate-800/40'}`}>
                  {isTabPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-current" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                </div>
                <span className="tracking-tight">{isAr ? tab.labelAr : tab.labelEn}</span>
                {isTabPending && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping ms-1" />
                )}
                {isActive && (
                  <span className="absolute bottom-1 inset-x-3 h-0.5 rounded-full bg-current opacity-70" />
                )}
              </button>
            );
          })}
        </div>

        {/* Micro progress line during tab transition */}
        {isPending && (
          <div 
            className="absolute bottom-0 inset-x-3 h-0.5 rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 animate-pulse" 
            aria-live="polite"
            aria-label={isAr ? "جاري تحميل القسم..." : "Loading tab content..."}
          />
        )}
      </div>

      {/* Tab Content Display */}
      <ErrorBoundary fallbackTitleAr="تعذر تحميل تفاصيل النظرة العامة على المشروع" fallbackTitleEn="Unable to load project overview">
        {activeTab === 'overview' && (
          <div 
            role="tabpanel"
            id="project-tabpanel-overview"
          aria-labelledby="tab-overview"
          tabIndex={0}
          aria-busy={isPending}
          className={`space-y-6 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/30 rounded-2xl transition-opacity duration-200 ${
            isPending ? 'opacity-70 pointer-events-none' : 'opacity-100'
          }`}
        >
          {/* Interactive Project Manager Verification & Temporal Succession */}
          <ProjectManagerVerificationCard
            projectId={project.id}
            projectCode={project.project_code || ''}
            projectName={project.project_name || ''}
            currentPmStakeholderId={project.project_manager_stakeholder_id || project.pm_stakeholder_id}
            isAr={isAr}
            onUpdated={() => {
              ProjectService.getProjectById(id).then(data => { if (data) setProject(data); });
            }}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info Column (2 cols) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Financial Summary Card */}
              <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-xl space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{isAr ? 'الملخص المالي وموقف العقود' : 'Financial Overview & Contracts'}</span>
                  </h3>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                    {isAr ? 'العملة: الجنيه المصري' : 'Currency: Egyptian Pound (EGP)'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 text-xs">
                  {/* Original Contract Value */}
                  <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/40 dark:to-slate-800/20 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl transition-all hover:border-slate-300 dark:hover:border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 text-start">
                        {isAr ? 'قيمة العقد الأصلية' : 'Original Contract Value'}
                      </span>
                      <FileText className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                    </div>
                    <div className="text-start">
                      <span dir="ltr" className="inline-block font-mono font-black text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">
                        {formattedContractValue}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block text-start">
                      {isAr ? 'بدون أوامر التغيير' : 'Excluding Variation Orders'}
                    </span>
                  </div>

                  {/* Advance Payment (الدفعة المقدمة) */}
                  <div className="relative overflow-hidden bg-gradient-to-br from-sky-50/70 to-blue-100/30 dark:from-sky-950/30 dark:to-blue-900/15 border border-sky-200/80 dark:border-sky-800/50 p-4 rounded-2xl transition-all hover:border-sky-300 dark:hover:border-sky-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-sky-800 dark:text-sky-300 text-start">
                        {isAr ? `الدفعة المقدمة (${advancePaymentPct}%)` : `Advance Payment (${advancePaymentPct}%)`}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-sky-100 dark:bg-sky-900/70 text-sky-700 dark:text-sky-300">
                        {advancePaymentPct}%
                      </span>
                    </div>
                    <div className="text-start">
                      <span dir="ltr" className="inline-block font-mono font-black text-base sm:text-lg text-sky-700 dark:text-sky-300 tracking-tight">
                        {formattedAdvanceValue}
                      </span>
                    </div>
                    <span className="text-[10px] text-sky-600/80 dark:text-sky-400/80 mt-1 block text-start">
                      {isAr ? 'تسترد بنسبة استقطاع من كل مستخلص' : 'Amortized across IPC certificates'}
                    </span>
                  </div>

                  {/* Variation Orders (VOs) */}
                  <div className="relative overflow-hidden bg-gradient-to-br from-purple-50/60 to-purple-100/30 dark:from-purple-950/20 dark:to-purple-900/10 border border-purple-200/70 dark:border-purple-900/40 p-4 rounded-2xl transition-all hover:border-purple-300 dark:hover:border-purple-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 text-start">
                        {isAr ? 'أوامر التغيير التعاقدية' : 'Variation Orders (VOs)'}
                      </span>
                      <TrendingUp className="w-4 h-4 text-purple-500 shrink-0" />
                    </div>
                    <div className="text-start">
                      <span dir="ltr" className="inline-block font-mono font-black text-base sm:text-lg text-purple-700 dark:text-purple-300 tracking-tight">
                        {Number(project?.vos_value || 0) > 0 ? `+${formattedVosValue}` : formattedVosValue}
                      </span>
                    </div>
                    <span className="text-[10px] text-purple-500/80 mt-1 block text-start">
                      {isAr ? 'معتمدة رسمياً ومحمية' : 'Officially approved & protected'}
                    </span>
                  </div>

                  {/* Total Contract Value */}
                  <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100/40 dark:from-emerald-950/30 dark:to-emerald-900/10 border-2 border-emerald-500/30 dark:border-emerald-600/40 p-4 rounded-2xl transition-all shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black text-emerald-800 dark:text-emerald-300 text-start">
                        {isAr ? 'إجمالي قيمة التعاقد' : 'Total Contract Value'}
                      </span>
                      <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    </div>
                    <div className="text-start">
                      <span dir="ltr" className="inline-block font-mono font-black text-base sm:text-lg text-emerald-700 dark:text-emerald-400 tracking-tight">
                        {formattedTotalValue}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600/80 dark:text-emerald-400/80 mt-1 block text-start">
                      {isAr ? 'شاملة قيمة التعاقد وأوامر التغيير' : 'Includes base contract & VOs'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Project Milestones & Timeline Progress Card */}
              <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                    <span>{isAr ? 'البرنامج الزمني ونسب الإنجاز' : 'Timeline & Progress'}</span>
                  </h3>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    {project.contract_duration_months ? (isAr ? `المدة: ${project.contract_duration_months} شهر` : `Duration: ${project.contract_duration_months} mo`) : (isAr ? 'مدة تعاقدية محددة' : 'Fixed duration')}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {isAr ? 'معدل الإنجاز التراكمي الميداني' : 'Cumulative Field Progress'}
                    </span>
                    <span className="font-mono font-black text-emerald-600 dark:text-emerald-400" dir="ltr">
                      {project.completion_pct || 0}%
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200/60 dark:border-slate-700/60">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, project.completion_pct || 0))}%` }}
                    />
                  </div>
                </div>

                {/* Dates Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-xs pt-2">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1 text-start">
                      {isAr ? 'تاريخ توقيع العقد' : 'Contract Date'}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 font-mono text-start block" dir="ltr">
                      {project.contract_date ? new Date(project.contract_date).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US') : (isAr ? 'غير محدد' : 'Not set')}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1 text-start">
                      {isAr ? 'تاريخ البدء المخطط' : 'Planned Start'}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 font-mono text-start block" dir="ltr">
                      {project.planned_start_date ? new Date(project.planned_start_date).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US') : (project.start_date ? new Date(project.start_date).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US') : (isAr ? 'غير محدد' : 'Not set'))}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1 text-start">
                      {isAr ? 'تاريخ الإنهاء المخطط' : 'Planned Finish'}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 font-mono text-start block" dir="ltr">
                      {project.planned_finish_date ? new Date(project.planned_finish_date).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US') : (project.end_date ? new Date(project.end_date).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US') : (isAr ? 'غير محدد' : 'Not set'))}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1 text-start">
                      {isAr ? 'تاريخ الاستلام الابتدائي' : 'TOC Handover'}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 font-mono text-start block" dir="ltr">
                      {project.actual_finish_date ? new Date(project.actual_finish_date).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US') : (isAr ? 'قيد التنفيذ' : 'In Progress')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Water Scope Specs */}
              <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-xl space-y-4">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <Droplets className="w-4 h-4 text-cyan-500 shrink-0" />
                  <span>{isAr ? 'نطاق ومواصفات الأعمال المائية' : 'Water Scope Specifications'}</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
                  <div className="bg-gradient-to-br from-cyan-50/60 to-blue-50/30 dark:from-cyan-950/20 dark:to-blue-900/10 border border-cyan-200/70 dark:border-cyan-900/40 p-4 rounded-2xl flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shrink-0">
                      <Droplets className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] block font-bold text-start">
                        {isAr ? 'إجمالي مسطح المياه المستهدف' : 'Target Water Surface Area'}
                      </span>
                      <div className="text-start mt-0.5">
                        <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-mono inline-flex items-baseline gap-1" dir="ltr">
                          <span>{project.water_area_m2 || 0}</span>
                          <span className="text-xs font-normal text-slate-500 dark:text-slate-400">{isAr ? 'م²' : 'm²'}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50/60 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-900/10 border border-blue-200/70 dark:border-blue-900/40 p-4 rounded-2xl flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                      <Droplets className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] block font-bold text-start">
                        {isAr ? 'إجمالي حجم المياه التكعيبي' : 'Target Water Volume'}
                      </span>
                      <div className="text-start mt-0.5">
                        <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-mono inline-flex items-baseline gap-1" dir="ltr">
                          <span>{project.water_vol_m3 || 0}</span>
                          <span className="text-xs font-normal text-slate-500 dark:text-slate-400">{isAr ? 'م³' : 'm³'}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Side Column (1 col) — Location Map & Documents */}
            <div className="space-y-6">
              {/* Site Location Map */}
              <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-xl space-y-4">
                {(() => {
                  let lat = project.gps_lat ? Number(project.gps_lat) : null;
                  let lng = project.gps_lng ? Number(project.gps_lng) : null;

                  if (!lat || !lng) {
                    const addr = project.site_location_address || '';
                    const match = addr.match(/^(-?[\d.]+)[,\s]+(-?[\d.]+)/);
                    if (match) {
                      lat = parseFloat(match[1]);
                      lng = parseFloat(match[2]);
                    }
                  }

                  const googleMapsUrl = lat && lng
                    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((project.project_name || '') + ' ' + (project.site_location_address || 'Egypt'))}`;

                  return (
                    <>
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>{isAr ? 'موقع المشروع الجغرافي' : 'Site Location Map'}</span>
                        </h4>
                        <a
                          href={googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-500 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-lg border border-blue-200/50 dark:border-blue-900/50 transition-colors print:hidden"
                          title={isAr ? 'فتح موقع المشروع في صفحة منفصلة بخرائط Google' : 'Open in Google Maps'}
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Google Maps</span>
                        </a>
                      </div>
                      {/* Clean Print Location Box */}
                      <div className="hidden print:block p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs">
                        <p className="font-bold text-slate-900 dark:text-slate-100 mb-1">{isAr ? 'بيانات الموقع الجغرافي:' : 'Geographical Location Data:'}</p>
                        <p className="font-mono text-slate-700 dark:text-slate-300 text-[11px]" dir="ltr">
                          {lat && lng ? `GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}` : (isAr ? 'الإحداثيات الرقمية: غير مسجلة' : 'GPS: Not specified')}
                        </p>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                          {project.site_location_address || (isAr ? 'العنوان الميداني: غير مسجل' : 'Site address not specified')}
                        </p>
                      </div>
                      <div className="h-52 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner print:hidden">
                        {lat && lng ? (
                          <LeafletMap
                            lat={lat}
                            lng={lng}
                            zoom={lat > 30.5 ? 11 : 13}
                            title={project.project_name}
                          />
                        ) : (
                          <div className="w-full h-52 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-500">
                            <MapPin className="w-8 h-8 opacity-40" />
                            <span className="text-xs font-bold">{isAr ? 'الموقع غير محدد' : 'Location Not Specified'}</span>
                            {project.site_location_address && (
                              <span className="text-[10px] opacity-70 text-center px-4">{project.site_location_address}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Legal Documents Status */}
              <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-xl space-y-4 text-xs">
                <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{isAr ? 'المستندات والمحاضر الرسمية' : 'Official Site Documents'}</span>
                </h4>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-400 font-bold">{isAr ? 'محضر تسليم الموقع:' : 'Site Possession Protocol:'}</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{project.site_possession_letter || (isAr ? 'موجود' : 'Available')}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-400 font-bold">{isAr ? 'شهادة ومحضر الاستلام الابتدائي:' : 'Initial Handover Certificate (TOC):'}</span>
                    <span className="font-bold text-slate-400 dark:text-slate-500">{project.toc_letter || (isAr ? 'غير متاح' : 'Not Available')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </ErrorBoundary>

      <ErrorBoundary fallbackTitleAr="تعذر تحميل محتوى التبويب المطلوب" fallbackTitleEn="Unable to load requested tab content">
        <Suspense fallback={<TabSkeleton />}>
          {/* Contracts Tab */}
          {activeTab === 'contracts' && (
            <div 
              role="tabpanel"
              id="project-tabpanel-contracts"
              aria-labelledby="tab-contracts"
              tabIndex={0}
              aria-busy={isPending}
              className={`rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xl focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/30 transition-opacity duration-200 ${
                isPending ? 'opacity-70 pointer-events-none' : 'opacity-100'
              }`}
            >
              <ContractTab project={project} onProjectUpdate={loadProject} />
            </div>
          )}

          {/* WBS Tab */}
          {activeTab === 'wbs' && (
            <div 
              role="tabpanel"
              id="project-tabpanel-wbs"
              aria-labelledby="tab-wbs"
              tabIndex={0}
              aria-busy={isPending}
              className={`rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xl focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-500/30 transition-opacity duration-200 ${
                isPending ? 'opacity-70 pointer-events-none' : 'opacity-100'
              }`}
            >
              <WBSTab project={project} />
            </div>
          )}

          {/* BOQ Tab */}
          {activeTab === 'boq' && (
            <div 
              role="tabpanel"
              id="project-tabpanel-boq"
              aria-labelledby="tab-boq"
              tabIndex={0}
              aria-busy={isPending}
              className={`rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xl focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/30 transition-opacity duration-200 ${
                isPending ? 'opacity-70 pointer-events-none' : 'opacity-100'
              }`}
            >
              <BoqTab project={project} onProjectUpdate={(updated) => setProject(updated)} />
            </div>
          )}

          {/* Cost Control Tab */}
          {activeTab === 'cost_control' && (
            <div 
              role="tabpanel"
              id="project-tabpanel-cost_control"
              aria-labelledby="tab-cost_control"
              tabIndex={0}
              aria-busy={isPending}
              className={`rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xl focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/30 transition-opacity duration-200 ${
                isPending ? 'opacity-70 pointer-events-none' : 'opacity-100'
              }`}
            >
              <CostControlTab project={project} onProjectUpdate={loadProject} />
            </div>
          )}

          {/* Milestones Tab */}
          {activeTab === 'milestones' && (
            <div 
              role="tabpanel"
              id="project-tabpanel-milestones"
              aria-labelledby="tab-milestones"
              tabIndex={0}
              aria-busy={isPending}
              className={`rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xl focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500/30 transition-opacity duration-200 ${
                isPending ? 'opacity-70 pointer-events-none' : 'opacity-100'
              }`}
            >
              <MilestonesTab project={project} />
            </div>
          )}

          {/* Change Orders Tab */}
          {activeTab === 'change_orders' && (
            <div 
              role="tabpanel"
              id="project-tabpanel-change_orders"
              aria-labelledby="tab-change_orders"
              tabIndex={0}
              aria-busy={isPending}
              className={`rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xl focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/30 transition-opacity duration-200 ${
                isPending ? 'opacity-70 pointer-events-none' : 'opacity-100'
              }`}
            >
              <ChangeOrdersTab project={project} onProjectUpdate={(updated) => setProject(updated)} />
            </div>
          )}

          {/* Invoices & Retention Tab */}
          {activeTab === 'invoices' && (
            <div 
              role="tabpanel"
              id="project-tabpanel-invoices"
              aria-labelledby="tab-invoices"
              tabIndex={0}
              aria-busy={isPending}
              className={`rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xl focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/30 transition-opacity duration-200 ${
                isPending ? 'opacity-70 pointer-events-none' : 'opacity-100'
              }`}
            >
              <InvoicesTab project={project} />
            </div>
          )}

          {/* Snag Lists & DLP Board Tab */}
          {activeTab === 'snags' && (
            <div 
              role="tabpanel"
              id="project-tabpanel-snags"
              aria-labelledby="tab-snags"
              tabIndex={0}
              aria-busy={isPending}
              className={`rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xl focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500/30 transition-opacity duration-200 ${
                isPending ? 'opacity-70 pointer-events-none' : 'opacity-100'
              }`}
            >
              <SnagListTrackingBoard project={project} />
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div 
              role="tabpanel"
              id="project-tabpanel-documents"
              aria-labelledby="tab-documents"
              tabIndex={0}
              aria-busy={isPending}
              className={`rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xl focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/30 transition-opacity duration-200 ${
                isPending ? 'opacity-70 pointer-events-none' : 'opacity-100'
              }`}
            >
              <DocumentsTab project={project} isAr={isAr} />
            </div>
          )}

          {/* Team Tab */}
          {activeTab === 'team' && (
            <div 
              role="tabpanel"
              id="project-tabpanel-team"
              aria-labelledby="tab-team"
              tabIndex={0}
              aria-busy={isPending}
              className={`rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xl focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500/30 transition-opacity duration-200 ${
                isPending ? 'opacity-70 pointer-events-none' : 'opacity-100'
              }`}
            >
              <TeamTab project={project} onProjectUpdated={loadProject} />
            </div>
          )}

          {/* Org Chart Tab */}
          {activeTab === 'org_chart' && (
            <div 
              role="tabpanel"
              id="project-tabpanel-org_chart"
              aria-labelledby="tab-org_chart"
              tabIndex={0}
              aria-busy={isPending}
              className={`rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xl focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/30 transition-opacity duration-200 ${
                isPending ? 'opacity-70 pointer-events-none' : 'opacity-100'
              }`}
            >
              <StakeholderOrgChart projectId={project.id} />
            </div>
          )}

          {/* Audit Log Tab */}
          {activeTab === 'audit_log' && (
            <div 
              role="tabpanel"
              id="project-tabpanel-audit_log"
              aria-labelledby="tab-audit_log"
              tabIndex={0}
              aria-busy={isPending}
              className={`rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xl focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500/30 transition-opacity duration-200 ${
                isPending ? 'opacity-70 pointer-events-none' : 'opacity-100'
              }`}
            >
              <AuditLogTab projectId={project.id} isAr={isAr} />
            </div>
          )}

          {/* Archive Tab */}
          {activeTab === 'archive' && (
            <div 
              role="tabpanel"
              id="project-tabpanel-archive"
              aria-labelledby="tab-archive"
              tabIndex={0}
              aria-busy={isPending}
              className={`rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xl focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-500/30 transition-opacity duration-200 ${
                isPending ? 'opacity-70 pointer-events-none' : 'opacity-100'
              }`}
            >
              <ArchiveTab project={project} isAr={isAr} />
            </div>
          )}
        </Suspense>
      </ErrorBoundary>

      {/* Settings Tab */}
      <ErrorBoundary fallbackTitleAr="تعذر تحميل إعدادات وتعديل بيانات المشروع" fallbackTitleEn="Unable to load project settings">
        {activeTab === 'settings' && (
          <div 
            role="tabpanel"
            id="project-tabpanel-settings"
            aria-labelledby="tab-settings"
            tabIndex={0}
            aria-busy={isPending}
            className={`rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-500/30 transition-opacity duration-200 ${
              isPending ? 'opacity-70 pointer-events-none' : 'opacity-100'
            }`}
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <Settings className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              <span>{isAr ? 'إعدادات وتعديل بيانات المشروع' : 'Project Settings & Configuration'}</span>
            </h3>
            <div className="pt-2">
              <Link
                href={`/projects/${project.id}/edit`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 transition-colors shadow-lg shadow-emerald-700/25 min-h-[44px]"
              >
                <Edit className="w-4 h-4" />
                <span>{isAr ? 'الانتقال لشاشة تعديل تفاصيل المشروع' : 'Go to Edit Project Screen'}</span>
              </Link>
            </div>

            {/* Archive Project — Danger Zone */}
            <div className="mt-6 pt-4 border-t border-rose-200 dark:border-rose-900/50">
              <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2 mb-3">
                <Archive className="w-4 h-4" />
                <span>{isAr ? 'منطقة الخطر — أرشفة المشروع' : 'Danger Zone — Archive Project'}</span>
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                {isAr 
                  ? 'أرشفة المشروع تنقله إلى بنك الأرشيف مع الاحتفاظ بكافة البيانات. يمكن استعادته لاحقاً.' 
                  : 'Archiving transfers the project to the archive vault while retaining all data. Can be restored later.'}
              </p>
              {archiving ? (
                <div className="flex items-center gap-2 text-rose-500 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isAr ? 'جاري الأرشفة...' : 'Archiving project...'}</span>
                </div>
              ) : showArchiveConfirm ? (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleArchive}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors shadow-lg shadow-rose-600/25 cursor-pointer min-h-[44px]"
                  >
                    <Archive className="w-4 h-4" />
                    <span>{isAr ? 'تأكيد الأرشفة' : 'Confirm Archive'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowArchiveConfirm(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors cursor-pointer min-h-[44px]"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowArchiveConfirm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-50 dark:bg-rose-950/40 dark:hover:bg-rose-950/30 transition-colors cursor-pointer min-h-[44px]"
                >
                  <Archive className="w-4 h-4" />
                  <span>{isAr ? 'أرشفة المشروع' : 'Archive Project'}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </ErrorBoundary>

      {/* Hold Project Confirmation & Reason Modal */}
      {project && (
        <HoldProjectModal
          isOpen={showHoldModal}
          onClose={() => setShowHoldModal(false)}
          onConfirm={async (reason) => {
            await handleStatusChange('on_hold', reason);
          }}
          projectName={project.project_name || project.name_ar}
          currentReason={project.hold_reason || project.suspension_reason || ''}
          loading={updatingStatus}
        />
      )}

      {/* Cancel Project Confirmation & Reason Modal */}
      {project && (
        <CancelProjectModal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          onConfirm={async (reason) => {
            await handleStatusChange('cancelled', reason);
          }}
          projectName={project.project_name || project.name_ar}
          currentReason={project.cancel_reason || project.cancellation_reason || ''}
          loading={updatingStatus}
        />
      )}

      {/* PMI Handover Project Confirmation & Checklist Modal */}
      {project && (
        <HandoverProjectModal
          isOpen={showHandoverModal}
          onClose={() => setShowHandoverModal(false)}
          onConfirm={async ({ tocLetter, checklist }) => {
            await handleStatusChange('handing_over', undefined, { tocLetter, checklist });
          }}
          projectName={project.project_name || project.name_ar}
          currentTocLetter={project.toc_letter || ''}
          currentChecklist={project.metadata?.handover_checklist}
          loading={updatingStatus}
        />
      )}

      {/* Handover Official Taking-Over Certificate (TOC) Modal */}
      {project && (
        <HandoverCertificateModal
          isOpen={showHandoverCertModal}
          onClose={() => setShowHandoverCertModal(false)}
          project={project}
        />
      )}

      {/* Project Final Closeout & Guarantees Settlement Modal */}
      {project && (
        <FinishProjectCloseoutModal
          isOpen={showFinishCloseoutModal}
          onClose={() => setShowFinishCloseoutModal(false)}
          onConfirmCloseout={async (closeoutPayload) => {
            await handleStatusChange('finished', undefined, undefined, closeoutPayload);
          }}
          project={project}
          loading={updatingStatus}
        />
      )}

      {/* ═══ Official Executive Print Report Footer ═══ */}
      <div className="hidden print:flex items-center justify-between border-t border-stone-300 pt-3 mt-6 text-[10px] text-stone-500" dir="rtl">
        <span>شركة بي زون للمنشآت المائية وحمامات السباحة — وثيقة معتمدة داخلياً</span>
        <span className="font-mono text-[9px]">P.ZONE ERP SYSTEM · PROJECT SUMMARY SHEET</span>
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  return (
    <Suspense fallback={
      <div className="w-full min-h-[400px] py-16 flex items-center justify-center">
        <div className="animate-pulse space-y-4 text-center">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-700 dark:border-emerald-400 border-t-transparent animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{isAr ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
      </div>
    }>
      <ProjectDetailPageInner />
    </Suspense>
  );
}
