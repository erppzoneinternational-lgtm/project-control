'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  PackageCheck,
  FolderKanban,
  FileQuestion,
  HardHat,
  Sun,
  Plus,
  RefreshCw,
  Building2,
  CheckCircle2,
  AlertTriangle,
  X,
  Layers,
  ClipboardCheck,
  Droplets,
  Send,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { Deliverable, RfiRegisterItem } from '@/types/planning';
import { DeliverablesService } from '@/lib/services/deliverables.service';
import { DeliverablesKanbanBoard } from '@/components/planning/DeliverablesKanbanBoard';
import { SubcontractorProductivityTable } from '@/components/planning/SubcontractorProductivityTable';
import { MorningCommandCenter } from '@/components/planning/MorningCommandCenter';
import { TOFieldPaperworkHub } from '@/components/technical-office/TOFieldPaperworkHub';
import { AquaticSafeguardsHub } from '@/components/technical-office/AquaticSafeguardsHub';
import { TOTransmittalGovernanceHub } from '@/components/technical-office/TOTransmittalGovernanceHub';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAssignedProjects } from '@/lib/hooks/useAssignedProjects';
import { useProjectStore } from '@/lib/stores/useProjectStore';
import { useUserRoles } from '@/lib/hooks/useUserRoles';
import { useModuleAccess } from '@/lib/hooks/useModuleAccess';
import { canAccessPath, canEditPath } from '@/lib/rbac/access-control';

type DeliverablesTabKey =
  | 'kanban'
  | 'field_paperwork'
  | 'aquatic'
  | 'transmittals'
  | 'rfis'
  | 'subs'
  | 'command_center';

export default function DeliverablesPage() {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const searchParams = useSearchParams();
  const router = useRouter();
  const { roles: userRoles, isAdmin } = useUserRoles();
  const { data: dbAccessRules } = useModuleAccess();
  const isViewerOnly = (userRoles || []).length > 0 && (userRoles || []).every((r) => r === 'viewer');
  const canEdit = !isViewerOnly && canEditPath('/deliverables', userRoles || [], isAdmin, dbAccessRules);
  const canAccessTechnicalOffice = canAccessPath('/technical-office', userRoles || [], isAdmin, dbAccessRules);

  // Global Top Bar Project Store (Two-Way Sync)
  const { activeProjectId, setActiveProjectId } = useProjectStore();

  // State & Governance Scoping
  const {
    projects = [],
    isLoading: loadingProjects,
    hasNoAssignedProjects,
  } = useAssignedProjects({ strictStaffing: true });

  const [selectedProjectId, setSelectedProjectId] = useState<string>(activeProjectId || '');
  const [activeTab, setActiveTab] = useState<DeliverablesTabKey>('kanban');

  // Deliverables & RFI Register State
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loadingDeliverables, setLoadingDeliverables] = useState(false);
  const [rfis, setRfis] = useState<RfiRegisterItem[]>([]);
  const [loadingRfis, setLoadingRfis] = useState(false);
  const [isNewRfiOpen, setIsNewRfiOpen] = useState(false);
  const [rfiForm, setRfiForm] = useState<Partial<RfiRegisterItem>>({
    rfi_no: '',
    subject: '',
    sent_date: new Date().toISOString().slice(0, 10),
    target_reply_date: '',
    status: 'sent',
  });
  const [savingRfi, setSavingRfi] = useState(false);

  const lastQueryPidRef = useRef<string | null>(null);

  // 1a. Whenever TopNav changes activeProjectId, immediately sync selectedProjectId
  useEffect(() => {
    if (activeProjectId && activeProjectId !== selectedProjectId) {
      setSelectedProjectId(activeProjectId);
    }
  }, [activeProjectId, selectedProjectId]);

  // 1b. Initial resolution from URL query ?projectId=..., or activeProjectId, or first assigned project
  useEffect(() => {
    const queryPid = searchParams.get('projectId');
    if (queryPid && queryPid !== lastQueryPidRef.current && projects.some((p) => p.id === queryPid)) {
      lastQueryPidRef.current = queryPid;
      setSelectedProjectId(queryPid);
      setActiveProjectId(queryPid);
      return;
    }

    if (!selectedProjectId) {
      if (activeProjectId && projects.some((p) => p.id === activeProjectId)) {
        setSelectedProjectId(activeProjectId);
      } else if (projects.length > 0) {
        const firstId = projects[0].id;
        setSelectedProjectId(firstId);
        setActiveProjectId(firstId);
      }
    }
  }, [projects, searchParams, activeProjectId, selectedProjectId, setActiveProjectId]);

  // 2. Fetch Deliverables & RFIs for active project
  const fetchDeliverables = useCallback(async (pId: string) => {
    if (!pId) return;
    setLoadingDeliverables(true);
    try {
      const data = await DeliverablesService.getDeliverables(pId);
      setDeliverables(data || []);
    } catch (err) {
      console.error('Failed to load deliverables:', err);
    } finally {
      setLoadingDeliverables(false);
    }
  }, []);

  const fetchRfis = useCallback(async (pId: string) => {
    if (!pId) return;
    setLoadingRfis(true);
    try {
      const data = await DeliverablesService.getRfiRegister(pId);
      setRfis(data || []);
    } catch (err) {
      console.error('Failed to load RFIs:', err);
    } finally {
      setLoadingRfis(false);
    }
  }, []);

  const refreshProjectData = useCallback(() => {
    if (!selectedProjectId) return;
    fetchDeliverables(selectedProjectId);
    fetchRfis(selectedProjectId);
  }, [selectedProjectId, fetchDeliverables, fetchRfis]);

  useEffect(() => {
    if (selectedProjectId) {
      fetchDeliverables(selectedProjectId);
      fetchRfis(selectedProjectId);
    }
  }, [selectedProjectId, fetchDeliverables, fetchRfis]);

  const selectedProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId);
  }, [projects, selectedProjectId]);

  const activeProjectDisplayName = useMemo(() => {
    if (!selectedProject) {
      return isAr ? 'جميع حزم المكتب الفني للمشروع النشط' : 'Active Project Engineering Deliverables';
    }
    return isAr
      ? selectedProject.project_name_ar || selectedProject.project_name || selectedProject.project_code
      : selectedProject.project_name || selectedProject.project_name_ar || selectedProject.project_code;
  }, [selectedProject, isAr]);

  const handleProjectChange = (pid: string) => {
    lastQueryPidRef.current = pid;
    setSelectedProjectId(pid);
    setActiveProjectId(pid);
    const params = new URLSearchParams(searchParams.toString());
    params.set('projectId', pid);
    router.replace(`/deliverables?${params.toString()}`);
  };

  // KPI Summary Calculations
  const kpiStats = useMemo(() => {
    const totalPackages = deliverables.length;
    const approvedCount = deliverables.filter(
      (d) => d.status === 'approved'
    ).length;
    const activeRfisCount = rfis.filter(
      (r) => r.status !== 'answered' && r.status !== 'closed'
    ).length;
    const blockedCount = deliverables.filter(
      (d) => d.status === 'blocked'
    ).length;

    return {
      totalPackages,
      approvedCount,
      activeRfisCount,
      blockedCount,
    };
  }, [deliverables, rfis]);

  // RFI Submission
  const handleSaveRfi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    if (!rfiForm.rfi_no?.trim() || !rfiForm.subject?.trim() || !selectedProjectId) return;

    setSavingRfi(true);
    try {
      const payload: Partial<RfiRegisterItem> = {
        ...rfiForm,
        project_id: selectedProjectId,
      };
      const created = await DeliverablesService.saveRfiItem(payload);
      if (created) {
        setRfis((prev) => [created, ...prev]);
        setIsNewRfiOpen(false);
        setRfiForm({
          rfi_no: '',
          subject: '',
          sent_date: new Date().toISOString().slice(0, 10),
          target_reply_date: '',
          status: 'sent',
        });
      }
    } catch (err) {
      console.error('Failed to save RFI:', err);
    } finally {
      setSavingRfi(false);
    }
  };

  const allNavTabs: Array<{
    key: DeliverablesTabKey;
    labelAr: string;
    labelEn: string;
    icon: React.ElementType;
    badge?: number;
    requiresEdit?: boolean;
  }> = [
    {
      key: 'kanban',
      labelAr: 'لوحة الكانبان وحزم التسليم',
      labelEn: 'Deliverables Kanban & Packages',
      icon: FolderKanban,
      badge: kpiStats.totalPackages,
    },
    {
      key: 'field_paperwork',
      labelAr: 'النماذج الميدانية وبوابة المستخلصات',
      labelEn: 'Field Paperwork & IPC Gate',
      icon: ClipboardCheck,
      requiresEdit: true,
    },
    {
      key: 'aquatic',
      labelAr: 'الضمانات المائية واختبارات الضغط',
      labelEn: 'Aquatic Safeguards & Hydro-Testing',
      icon: Droplets,
      requiresEdit: true,
    },
    {
      key: 'transmittals',
      labelAr: 'حوافظ التسليم وأرشيف الاستشاري',
      labelEn: 'Transmittals & Consultant Archive',
      icon: Send,
      requiresEdit: true,
    },
    {
      key: 'rfis',
      labelAr: 'سجل الاستفسارات الفنية السريع',
      labelEn: 'Rapid Technical RFI Register',
      icon: FileQuestion,
      badge: kpiStats.activeRfisCount,
    },
    {
      key: 'subs',
      labelAr: 'إنتاجية مقاولي الباطن',
      labelEn: 'Subcontractor Productivity',
      icon: HardHat,
    },
    {
      key: 'command_center',
      labelAr: 'مركز القيادة الصباحي',
      labelEn: 'Morning Command Center',
      icon: Sun,
    },
  ];
  const navTabs = canEdit ? allNavTabs : allNavTabs.filter((t) => !t.requiresEdit);
  const effectiveTab: DeliverablesTabKey =
    !canEdit && (activeTab === 'field_paperwork' || activeTab === 'aquatic' || activeTab === 'transmittals')
      ? 'kanban'
      : activeTab;

  return (
    <div className="w-full max-w-none space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Sleek Dark-Emerald Executive Command Header */}
      <div className="bg-gradient-to-l from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          {/* Title & Active Project Identity */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[11px] font-bold">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                {isAr
                  ? 'مرتبط تلقائياً بالمشروع النشط في الشريط العلوي'
                  : 'Automatically synced with Top Bar Active Project'}
              </span>
              {selectedProject?.project_code && (
                <span className="px-2.5 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-slate-200 font-mono text-xs font-bold">
                  {selectedProject.project_code}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 shadow-inner">
                <PackageCheck className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {activeProjectDisplayName}
                </h1>
                <p className="text-xs text-slate-300/80 mt-0.5">
                  {isAr
                    ? 'سجل المخططات التنفيذية، حزم الاعتمادات الهندسية، النماذج الميدانية، وحوافظ الاستشاري'
                    : 'Shop drawings register, engineering approval packages, field inspections, and consultant transmittals'}
                </p>
              </div>
            </div>
          </div>

          {/* Integrated Project Switcher & Full TO Portal Shortcut */}
          <div className="flex flex-wrap items-center gap-3">
            {loadingProjects ? (
              <div className="h-11 w-64 rounded-2xl bg-slate-800/80 animate-pulse border border-slate-700" />
            ) : (
              <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 rounded-2xl px-3.5 py-2">
                <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {isAr ? 'تبديل المشروع النشط' : 'Switch Active Project'}
                  </span>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => handleProjectChange(e.target.value)}
                    aria-label={isAr ? 'اختيار المشروع' : 'Select project'}
                    className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer min-w-[200px]"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                        {p.project_code ? `${p.project_code} — ` : ''}
                        {isAr
                          ? p.project_name_ar || p.project_name || p.project_code
                          : p.project_name || p.project_name_ar || p.project_code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={refreshProjectData}
              title={isAr ? 'تحديث بيانات المشروع' : 'Refresh project data'}
              className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loadingDeliverables || loadingRfis ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            {canAccessTechnicalOffice && (
              <Link
                href="/technical-office"
                className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 transition"
              >
                <Layers className="w-4 h-4" />
                <span>{isAr ? 'فتح بوابة المكتب الفني الشاملة' : 'Open Full Technical Office Portal'}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </Link>
            )}
          </div>
        </div>

        {/* 4 Live Summary KPI Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2 border-t border-white/10">
          <div className="rounded-2xl bg-white/5 dark:bg-slate-900/40 border border-white/10 px-4 py-3.5 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-300">
                {isAr ? 'إجمالي الحزم الهندسية' : 'Total Engineering Packages'}
              </div>
              <div className="text-2xl font-black text-white font-mono mt-1">
                {kpiStats.totalPackages}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300">
              <FolderKanban className="w-5 h-5" />
            </div>
          </div>

          <div className="rounded-2xl bg-white/5 dark:bg-slate-900/40 border border-white/10 px-4 py-3.5 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-emerald-300">
                {isAr ? 'معتمد من الاستشاري' : 'Consultant Approved'}
              </div>
              <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
                {kpiStats.approvedCount}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="rounded-2xl bg-white/5 dark:bg-slate-900/40 border border-white/10 px-4 py-3.5 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-amber-300">
                {isAr ? 'الاستفسارات الفنية النشطة' : 'Active Technical RFIs'}
              </div>
              <div className="text-2xl font-black text-amber-400 font-mono mt-1">
                {kpiStats.activeRfisCount}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300">
              <FileQuestion className="w-5 h-5" />
            </div>
          </div>

          <div className="rounded-2xl bg-white/5 dark:bg-slate-900/40 border border-white/10 px-4 py-3.5 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-rose-300">
                {isAr ? 'البنود المتوقفة' : 'Blocked Items'}
              </div>
              <div className="text-2xl font-black text-rose-400 font-mono mt-1">
                {kpiStats.blockedCount}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-300">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {hasNoAssignedProjects && (
        <div className="p-8 text-center rounded-3xl bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-2">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {isAr
              ? 'لم يتم تعيينك على أي مشروع حالياً. تواصل مع مدير المشروع لإدراجك في فريق العمل.'
              : 'You are not assigned to any projects. Please contact your project manager.'}
          </p>
        </div>
      )}

      {/* Modern Segmented Pill Navigation Bar in Pure Arabic */}
      <div
        role="tablist"
        aria-label={isAr ? 'أقسام إدارة التسليمات الهندسية' : 'Engineering Deliverables Sections'}
        className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800"
      >
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = effectiveTab === tab.key;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                isActive
                  ? 'bg-emerald-700 text-white shadow-md shadow-emerald-900/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
              <span>{isAr ? tab.labelAr : tab.labelEn}</span>
              {typeof tab.badge === 'number' && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Tab Views */}
      {effectiveTab === 'kanban' && (
        canEdit ? (
          <DeliverablesKanbanBoard
            projectId={selectedProjectId}
            projectName={activeProjectDisplayName}
          />
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                {isAr ? 'سجل حزم التسليمات الهندسية (للعرض فقط)' : 'Engineering Deliverables Register (Read-Only)'}
              </h3>
              <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
                {deliverables.length}
              </span>
            </div>
            {loadingDeliverables ? (
              <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                {isAr ? 'جاري تحميل حزم التسليم...' : 'Loading deliverables...'}
              </div>
            ) : deliverables.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400 dark:text-slate-500">
                {isAr ? 'لا توجد حزم تسليمات مسجلة لهذا المشروع' : 'No deliverable packages recorded for this project'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-start text-xs border-collapse">
                  <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                    <tr>
                      <th className="p-3.5 text-start">{isAr ? 'الكود' : 'Ref Code'}</th>
                      <th className="p-3.5 text-start">{isAr ? 'عنوان الحزمة' : 'Title'}</th>
                      <th className="p-3.5 text-center">{isAr ? 'النوع' : 'Kind'}</th>
                      <th className="p-3.5 text-center">{isAr ? 'الأولوية' : 'Priority'}</th>
                      <th className="p-3.5 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                      <th className="p-3.5 text-center">{isAr ? 'تاريخ الاستحقاق' : 'Due Date'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {deliverables.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">{d.ref_code}</td>
                        <td className="p-3.5 font-semibold text-slate-900 dark:text-white">{d.title_ar}</td>
                        <td className="p-3.5 text-center font-mono">{d.kind || '-'}</td>
                        <td className="p-3.5 text-center">{d.priority || '-'}</td>
                        <td className="p-3.5 text-center">{d.status}</td>
                        <td className="p-3.5 text-center font-mono text-slate-500 dark:text-slate-400">{d.due_date || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      )}

      {canEdit && effectiveTab === 'field_paperwork' && (
        <TOFieldPaperworkHub
          selectedProjectId={selectedProjectId}
          projectName={activeProjectDisplayName}
          deliverables={deliverables}
          onRefresh={refreshProjectData}
        />
      )}

      {canEdit && effectiveTab === 'aquatic' && (
        <AquaticSafeguardsHub
          projectId={selectedProjectId}
          projectName={activeProjectDisplayName}
        />
      )}

      {canEdit && effectiveTab === 'transmittals' && (
        <TOTransmittalGovernanceHub
          deliverables={deliverables}
          projects={projects}
          selectedProjectId={selectedProjectId}
          onRefresh={refreshProjectData}
        />
      )}

      {effectiveTab === 'rfis' && (
        <div className="space-y-4">
          {/* Top action */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                {isAr ? 'سجل الاستفسارات الفنية السريع ومواعيد رد الاستشاري' : 'Rapid Technical RFI Register'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isAr
                  ? 'متابعة الاستفسارات الهندسية الموجهة للاستشاري وتاريخ الرد المستهدف خلال سبعة أيام تعاقدية'
                  : 'Tracking inquiries submitted to the consultant with 7-day target response window'}
              </p>
            </div>

            {canEdit && (
              <button
                onClick={() => setIsNewRfiOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>{isAr ? 'إرسال استفسار فني جديد' : 'New RFI'}</span>
              </button>
            )}
          </div>

          {/* RFI Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
            {loadingRfis ? (
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-center gap-2 text-slate-400 dark:text-slate-500 py-3">
                  <RefreshCw className="w-5 h-5 animate-spin text-emerald-500" />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    {isAr ? 'جاري تحميل سجل الاستفسارات الفنية...' : 'Loading RFI register...'}
                  </span>
                </div>
                <div className="space-y-2 animate-pulse">
                  {[1, 2, 3, 4].map((k) => (
                    <div key={k} className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl w-full" />
                  ))}
                </div>
              </div>
            ) : rfis.length === 0 ? (
              <div className="py-20 text-center text-slate-400 dark:text-slate-500 border border-dashed border-slate-100 dark:border-slate-800 m-6 rounded-3xl space-y-2">
                <FileQuestion className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isAr ? 'لا توجد استفسارات فنية مسجلة لهذا المشروع' : 'No RFIs recorded for this project'}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isAr
                    ? 'اضغط على «إرسال استفسار فني جديد» لفتح طلب توضيح هندسي للاستشاري'
                    : 'Click "New RFI" to submit a technical query to the consultant'}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-start text-xs border-collapse">
                  <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                    <tr>
                      <th className="p-3.5 text-start">{isAr ? 'رقم الاستفسار' : 'RFI No'}</th>
                      <th className="p-3.5 text-start">{isAr ? 'موضوع الاستفسار' : 'Subject'}</th>
                      <th className="p-3.5 text-center">{isAr ? 'تاريخ الإرسال' : 'Sent Date'}</th>
                      <th className="p-3.5 text-center">{isAr ? 'تاريخ الرد المستهدف' : 'Target Reply Date'}</th>
                      <th className="p-3.5 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                      <th className="p-3.5 text-start">{isAr ? 'ملخص رد الاستشاري' : 'Reply Summary'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {rfis.map((r) => {
                      const isOverdue =
                        r.status === 'overdue' ||
                        (r.target_reply_date &&
                          r.target_reply_date < new Date().toISOString().slice(0, 10) &&
                          r.status !== 'answered' &&
                          r.status !== 'closed');
                      return (
                        <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                          <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                              {r.rfi_no}
                            </span>
                          </td>

                          <td className="p-3.5 max-w-sm font-semibold text-slate-900 dark:text-white">
                            {r.subject}
                          </td>

                          <td className="p-3.5 text-center font-mono text-slate-500 dark:text-slate-400">
                            {r.sent_date}
                          </td>

                          <td className="p-3.5 text-center font-mono text-slate-500 dark:text-slate-400">
                            {r.target_reply_date || '-'}
                          </td>

                          <td className="p-3.5 text-center whitespace-nowrap">
                            {isOverdue ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 animate-pulse">
                                {isAr ? 'متأخر في الرد' : 'Overdue'}
                              </span>
                            ) : r.status === 'answered' ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                                {isAr ? 'تم الرد' : 'Answered'}
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                                {isAr ? 'بانتظار الرد' : 'Pending'}
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 text-slate-500 dark:text-slate-400 text-[11px] max-w-xs truncate">
                            {r.reply_summary || (isAr ? 'قيد مراجعة الاستشاري' : 'Under review')}
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

      {effectiveTab === 'subs' && (
        <SubcontractorProductivityTable
          projectId={selectedProjectId}
          projectName={activeProjectDisplayName}
        />
      )}

      {effectiveTab === 'command_center' && (
        <MorningCommandCenter
          projectId={selectedProjectId}
          projectName={activeProjectDisplayName}
          onNavigateTab={(tab) => {
            if (tab === 'kanban') setActiveTab('kanban');
            else if (tab === 'rfis') setActiveTab('rfis');
            else if (tab === 'subs') setActiveTab('subs');
          }}
        />
      )}

      {/* New RFI Modal */}
      {canEdit && isNewRfiOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-2.5">
                <FileQuestion className="w-5 h-5 text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isAr ? 'إرسال استفسار فني جديد للاستشاري' : 'Submit New RFI'}
                </h3>
              </div>
              <button
                onClick={() => setIsNewRfiOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRfi} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'رقم الاستفسار الفني' : 'RFI No'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="RFI-STR-001"
                    value={rfiForm.rfi_no || ''}
                    onChange={(e) => setRfiForm({ ...rfiForm, rfi_no: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'تاريخ الرد التعاقدي المستهدف' : 'Target Reply Date'}
                  </label>
                  <input
                    type="date"
                    value={rfiForm.target_reply_date || ''}
                    onChange={(e) => setRfiForm({ ...rfiForm, target_reply_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark] focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'موضوع الاستفسار الفني' : 'Inquiry Subject'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    isAr
                      ? 'مثال: توضيح تفاصيل التسليح الإضافي عند التقاء الجدران باللبشة...'
                      : 'e.g. Clarify additional reinforcement details at wall-raft junction...'
                  }
                  value={rfiForm.subject || ''}
                  onChange={(e) => setRfiForm({ ...rfiForm, subject: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewRfiOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={savingRfi}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white shadow-md shadow-emerald-700/20"
                >
                  {savingRfi
                    ? isAr
                      ? 'جاري الإرسال...'
                      : 'Sending...'
                    : isAr
                      ? 'إرسال الاستفسار الفني'
                      : 'Submit RFI'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

