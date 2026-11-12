'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck,
  Award,
  RotateCw,
  Search,
  Filter,
  Layers,
  ChevronRight,
  TrendingUp,
  XCircle,
  FileText,
  Camera,
  ShieldAlert,
  Building2,
  Calendar,
  ExternalLink,
  X,
  Eye,
  SlidersHorizontal,
  Ban,
  Check,
  Sparkles,
  Info,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/lib/stores/useAuthStore';
import { useProjectStore } from '@/lib/stores/useProjectStore';
import { ProjectService } from '@/lib/services/project.service';
import { TaskOntologyService } from '@/lib/services/taskOntology.service';
import { Project } from '@/types';
import { InspectionRequest, InspectionStatus, InspectionType } from '@/types/task-ontology';
import QCInspectionQueue from '@/components/planning/QCInspectionQueue';
import Link from 'next/link';
import { usePagePermission } from '@/lib/hooks/usePagePermission';
import { BackButton } from '@/components/ui/BackButton';

export default function QCDashboardPage() {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { canView, isLoading: permLoading } = usePagePermission('/qc-dashboard');

  // Two-way sync with useProjectStore
  const { activeProjectId, setActiveProjectId } = useProjectStore();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => activeProjectId || 'all');

  // Sync state when activeProjectId changes from outside
  useEffect(() => {
    if (activeProjectId && activeProjectId !== selectedProjectId) {
      setSelectedProjectId(activeProjectId);
    } else if (!activeProjectId && selectedProjectId !== 'all') {
      setSelectedProjectId('all');
    }
  }, [activeProjectId, selectedProjectId]);

  const handleProjectSelectChange = useCallback(
    (newId: string) => {
      setSelectedProjectId(newId);
      if (typeof setActiveProjectId === 'function') {
        setActiveProjectId(newId === 'all' ? '' : newId);
      }
    },
    [setActiveProjectId]
  );

  const [activeTab, setActiveTab] = useState<'queue' | 'history' | 'kpis'>('queue');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDetailItem, setSelectedDetailItem] = useState<InspectionRequest | null>(null);

  // 1. Fetch Projects
  const { data: projects = [], isLoading: loadingProjects } = useQuery<Project[]>({
    queryKey: ['qc-dashboard-projects'],
    queryFn: async () => {
      const list = await ProjectService.getProjects();
      return list || [];
    },
  });

  // Map of project names for fast lookup
  const projectMap = useMemo(() => {
    const map = new Map<string, { name_ar?: string; name_en?: string; code?: string }>();
    projects.forEach((p) => {
      map.set(p.id, {
        name_ar: p.name_ar || p.project_name,
        name_en: p.name_en,
        code: p.code || p.project_code,
      });
    });
    return map;
  }, [projects]);

  const currentProject = useMemo(() => {
    if (!selectedProjectId || selectedProjectId === 'all') return null;
    return projects.find((p) => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  // 2. Fetch Inspection Requests for Selected Project (or all)
  const {
    data: inspections = [],
    isLoading: loadingInspections,
    isFetching: fetchingInspections,
    refetch: refetchInspections,
  } = useQuery<InspectionRequest[]>({
    queryKey: ['qc-inspections', selectedProjectId],
    queryFn: async () => {
      const prjId = selectedProjectId === 'all' ? undefined : selectedProjectId;
      return await TaskOntologyService.listInspections(prjId);
    },
    enabled: true,
  });

  // Computed metrics
  const pendingInspections = useMemo(() => {
    return inspections.filter((i) => i.status === 'pending');
  }, [inspections]);

  const approvedInspections = useMemo(() => {
    return inspections.filter((i) => i.status === 'approved');
  }, [inspections]);

  const rejectedInspections = useMemo(() => {
    return inspections.filter((i) => i.status === 'rejected');
  }, [inspections]);

  const cancelledInspections = useMemo(() => {
    return inspections.filter((i) => i.status === 'cancelled');
  }, [inspections]);

  const totalDecided = approvedInspections.length + rejectedInspections.length;
  const passRatePct = totalDecided > 0 ? Math.round((approvedInspections.length / totalDecided) * 100) : null;

  // Filtered history list
  const filteredHistory = useMemo(() => {
    return inspections.filter((i) => {
      // Type filter
      if (typeFilter !== 'all' && i.inspection_type?.toLowerCase() !== typeFilter.toLowerCase()) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'all' && i.status !== statusFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNo = i.request_no?.toLowerCase().includes(q);
        const matchTitle = (i.task_title_ar || (i as unknown as { pm_site_tasks?: { title_ar?: string } }).pm_site_tasks?.title_ar || '')?.toLowerCase().includes(q);
        const matchReason = i.reason?.toLowerCase().includes(q);
        const pInfo = projectMap.get(i.project_id);
        const matchProject =
          pInfo?.name_ar?.toLowerCase().includes(q) ||
          pInfo?.name_en?.toLowerCase().includes(q) ||
          pInfo?.code?.toLowerCase().includes(q);

        if (!matchNo && !matchTitle && !matchReason && !matchProject) return false;
      }
      return true;
    });
  }, [inspections, typeFilter, statusFilter, searchQuery, projectMap]);

  const handleRefresh = useCallback(() => {
    refetchInspections();
    queryClient.invalidateQueries({ queryKey: ['qc-inspections', selectedProjectId] });
  }, [refetchInspections, queryClient, selectedProjectId]);

  const getProjectLabel = useCallback(
    (insp: InspectionRequest) => {
      if (insp.project_name_ar || insp.project_name_en || insp.project_code) {
        const code = insp.project_code ? `[${insp.project_code}] ` : '';
        const name = isAr
          ? insp.project_name_ar || insp.project_name_en || insp.project_code
          : insp.project_name_en || insp.project_name_ar || insp.project_code;
        return `${code}${name}`;
      }
      const info = projectMap.get(insp.project_id);
      if (info) {
        const code = info.code ? `[${info.code}] ` : '';
        const name = isAr ? info.name_ar || info.name_en || info.code : info.name_en || info.name_ar || info.code;
        return `${code}${name}`;
      }
      return isAr ? 'المشروع الحالي' : 'Current Project';
    },
    [isAr, projectMap]
  );

  // Status Badge Component with high contrast & explicit WCAG-compliant icons
  const renderStatusBadge = (status: InspectionStatus) => {
    switch (status) {
      case 'approved':
        return (
          <span
            role="status"
            aria-label={isAr ? 'حالة الفحص: معتمد ومطابق' : 'Status: Approved'}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-700/60"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
            <span>{isAr ? 'معتمد (مطابق)' : 'Approved'}</span>
          </span>
        );
      case 'rejected':
        return (
          <span
            role="status"
            aria-label={isAr ? 'حالة الفحص: مرفوض مع أمر إعادة عمل' : 'Status: Rejected / NCR'}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-900 border border-rose-300 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-700/60"
          >
            <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" aria-hidden="true" />
            <span>{isAr ? 'مرفوض (عدم مطابقة)' : 'Rejected (NCR)'}</span>
          </span>
        );
      case 'cancelled':
        return (
          <span
            role="status"
            aria-label={isAr ? 'حالة الفحص: ملغي' : 'Status: Cancelled'}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-300 dark:bg-slate-800/80 dark:text-slate-200 dark:border-slate-700"
          >
            <Ban className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" aria-hidden="true" />
            <span>{isAr ? 'ملغي' : 'Cancelled'}</span>
          </span>
        );
      case 'pending':
      default:
        return (
          <span
            role="status"
            aria-label={isAr ? 'حالة الفحص: قيد الانتظار والمعاينة' : 'Status: Pending Inspection'}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-700/60"
          >
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
            <span>{isAr ? 'بانتظار الفحص' : 'Pending'}</span>
          </span>
        );
    }
  };

  // Inspection Type Badge Helper
  const renderTypeBadge = (type: InspectionType | string) => {
    const rawType = (type || '').toLowerCase();
    let label = type;
    let badgeClass = 'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800';

    if (rawType === 'wir') {
      label = isAr ? 'استلام أعمال' : 'WIR';
      badgeClass = 'bg-indigo-50 text-indigo-900 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800';
    } else if (rawType === 'mir') {
      label = isAr ? 'فحص مواد' : 'MIR';
      badgeClass = 'bg-purple-50 text-purple-900 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800';
    } else if (rawType === 'pre_pour') {
      label = isAr ? 'قبل الصب' : 'Pre-Pour';
      badgeClass = 'bg-cyan-50 text-cyan-900 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800';
    } else if (rawType === 'ncr') {
      label = isAr ? 'عدم مطابقة' : 'NCR';
      badgeClass = 'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800';
    } else if (rawType.includes('survey')) {
      label = isAr ? 'مساحة ومناسيب' : 'Survey';
      badgeClass = 'bg-teal-50 text-teal-900 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800';
    } else if (rawType === 'final_handover') {
      label = isAr ? 'تسليم نهائي' : 'Final Handover';
      badgeClass = 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
    }

    return (
      <span
        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${badgeClass}`}
      >
        {label}
      </span>
    );
  };

  if (!permLoading && !canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4" dir="rtl">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          {isAr ? 'غير مصرح بالدخول' : 'Access Denied'}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
          {isAr
            ? 'هذه الصفحة مخصصة لمهندسي ضبط الجودة ومدير المشروع والإدارة فقط.'
            : 'This page is restricted to Quality Control Engineers, Project Managers, and Management.'}
        </p>
        <BackButton label={isAr ? 'الرجوع' : 'Back'} />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-5 lg:p-6 max-w-[1750px] w-full mx-auto space-y-6" dir="rtl">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 sm:p-8 text-white shadow-2xl border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>{isAr ? 'محطة مهندس مراقبة الجودة' : 'QC Inspector Station'}</span>
            </div>
            <h1 className={`text-2xl sm:text-3xl font-black ${isAr ? 'tracking-normal' : 'tracking-tight'}`}>
              {currentProject
                ? isAr
                  ? currentProject.name_ar || currentProject.name_en
                  : currentProject.name_en || currentProject.name_ar
                : isAr
                ? 'لوحة فحص الجودة - كافة المشاريع'
                : 'Quality Control Command - All Projects'}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              {isAr
                ? 'استلام وفحص طلبات استلام الأعمال وفحص المواد، وتوثيق قرارات المطابقة والملاحظات، ومتابعة مؤشر نجاح الفحص الأولي وفق معايير الضبط الإنشائي للمشاريع.'
                : 'Process Work & Material Inspection Requests (WIR/MIR), record compliance decisions, and monitor first-time pass rates.'}
            </p>
          </div>

          {/* Project Selector & Refresh Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px]">
              <label htmlFor="qc-project-select" className="sr-only">
                {isAr ? 'اختر المشروع' : 'Select Project'}
              </label>
              {loadingProjects ? (
                <div className="h-10 w-full rounded-xl bg-slate-800/80 animate-pulse border border-slate-700" />
              ) : (
                <select
                  id="qc-project-select"
                  value={selectedProjectId}
                  onChange={(e) => handleProjectSelectChange(e.target.value)}
                  aria-label={isAr ? 'تحديد المشروع المعروض' : 'Select active project'}
                  className="w-full h-10 px-3 py-1.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
                >
                  <option value="all" className="bg-slate-900 text-white font-bold">
                    {isAr ? '✦ كافة المشاريع (عرض مجمّع)' : '✦ All Projects (Consolidated)'}
                  </option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                      {p.code || p.project_code ? `[${p.code || p.project_code}] ` : ''}
                      {isAr ? p.name_ar || p.name_en || p.project_name : p.name_en || p.name_ar || p.project_name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <button
              onClick={handleRefresh}
              disabled={fetchingInspections}
              aria-label={isAr ? 'تحديث بيانات الفحص' : 'Refresh inspection data'}
              title={isAr ? 'تحديث البيانات' : 'Refresh Data'}
              className="h-10 px-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50"
            >
              <RotateCw className={`w-4 h-4 ${fetchingInspections ? 'animate-spin text-blue-400' : ''}`} />
              <span className="hidden sm:inline">{isAr ? 'تحديث' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Summary KPIs Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" role="region" aria-label={isAr ? 'مؤشرات ضبط الجودة' : 'QC Key Performance Indicators'}>
        {/* Pending Inspections Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2 relative overflow-hidden transition-all hover:border-blue-300 dark:hover:border-blue-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAr ? 'طلبات الفحص المعلقة' : 'Pending Inspections'}
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="w-5 h-5" aria-hidden="true" />
            </div>
          </div>
          {loadingInspections ? (
            <div className="space-y-1.5 animate-pulse">
              <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              <div className="h-4 w-24 bg-slate-100 dark:bg-slate-800/60 rounded" />
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  {pendingInspections.length}
                </span>
                <span
                  role="status"
                  className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                    pendingInspections.length > 0
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60'
                  }`}
                >
                  {pendingInspections.length > 0
                    ? isAr
                      ? 'بانتظار المعاينة'
                      : 'Action Needed'
                    : isAr
                    ? 'طابور نظيف'
                    : 'All Clear'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isAr ? 'تتطلب قرار مهندس الجودة بالموقع' : 'Requires Site QC decision'}
              </p>
            </div>
          )}
        </div>

        {/* Approved Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2 relative overflow-hidden transition-all hover:border-emerald-300 dark:hover:border-emerald-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAr ? 'فحوصات معتمدة بنجاح' : 'Approved Inspections'}
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
            </div>
          </div>
          {loadingInspections ? (
            <div className="space-y-1.5 animate-pulse">
              <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              <div className="h-4 w-24 bg-slate-100 dark:bg-slate-800/60 rounded" />
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  {approvedInspections.length}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60">
                  {isAr ? 'مطابق للمواصفات' : 'Compliant'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isAr ? 'معتمد رسمياً وجاهز للمستخلص' : 'Officially certified for billing'}
              </p>
            </div>
          )}
        </div>

        {/* Rejected / NCR Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2 relative overflow-hidden transition-all hover:border-rose-300 dark:hover:border-rose-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAr ? 'حالات عدم المطابقة' : 'Rejected / NCRs'}
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <XCircle className="w-5 h-5" aria-hidden="true" />
            </div>
          </div>
          {loadingInspections ? (
            <div className="space-y-1.5 animate-pulse">
              <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              <div className="h-4 w-24 bg-slate-100 dark:bg-slate-800/60 rounded" />
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  {rejectedInspections.length}
                </span>
                <span
                  role="status"
                  className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                    rejectedInspections.length > 0
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800/60'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {rejectedInspections.length > 0
                    ? isAr
                      ? 'أمر إعادة عمل وتصحيح'
                      : 'Rework Required'
                    : isAr
                    ? 'صفر مرفوضات'
                    : 'Zero NCRs'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {rejectedInspections.length > 0
                  ? isAr
                    ? 'توقف الصب أو التنفيذ حتى التصحيح'
                    : 'Hold activity until corrective fix'
                  : isAr
                  ? 'لا توجد بنود موقوفة'
                  : 'No active site holds'}
              </p>
            </div>
          )}
        </div>

        {/* First-Time Pass Rate */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2 relative overflow-hidden transition-all hover:border-blue-300 dark:hover:border-blue-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAr ? 'معدل النجاح من الفحص الأول' : 'First-Time Pass Rate'}
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Award className="w-5 h-5" aria-hidden="true" />
            </div>
          </div>
          {loadingInspections ? (
            <div className="space-y-1.5 animate-pulse">
              <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              <div className="h-4 w-24 bg-slate-100 dark:bg-slate-800/60 rounded" />
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  {passRatePct !== null ? `${passRatePct}%` : '--'}
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                    passRatePct === null
                      ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      : passRatePct >= 90
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60'
                      : passRatePct >= 75
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800/60'
                  }`}
                >
                  {passRatePct === null
                    ? isAr
                      ? 'لا توجد قرارات'
                      : 'No Decisions'
                    : passRatePct >= 90
                    ? isAr
                      ? 'ممتاز (≥90%)'
                      : 'Target Met'
                    : isAr
                    ? 'يحتاج تحسين'
                    : 'Below Target'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {totalDecided > 0
                  ? isAr
                    ? `إجمالي المقيم: ${totalDecided} فحص`
                    : `Evaluated: ${totalDecided} total`
                  : isAr
                  ? 'بانتظار تقييم الفحوصات'
                  : 'Awaiting decisions'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Navigation Strip */}
      <nav
        role="tablist"
        aria-label={isAr ? 'أقسام لوحة الجودة' : 'QC Dashboard Sections'}
        className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100/80 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-700/60"
      >
        <button
          role="tab"
          id="tab-queue"
          aria-selected={activeTab === 'queue'}
          aria-controls="panel-queue"
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer whitespace-nowrap focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
            activeTab === 'queue'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/80 dark:border-slate-700 font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50'
          }`}
        >
          <Clock className={`w-4 h-4 shrink-0 ${activeTab === 'queue' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} aria-hidden="true" />
          <span>{isAr ? 'طابور الفحوصات المعلقة' : 'Pending Inspection Queue'}</span>
          {pendingInspections.length > 0 && (
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white shadow-sm"
              aria-label={isAr ? `${pendingInspections.length} معلق` : `${pendingInspections.length} pending`}
            >
              {pendingInspections.length}
            </span>
          )}
        </button>

        <button
          role="tab"
          id="tab-history"
          aria-selected={activeTab === 'history'}
          aria-controls="panel-history"
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer whitespace-nowrap focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
            activeTab === 'history'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/80 dark:border-slate-700 font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50'
          }`}
        >
          <FileCheck className={`w-4 h-4 shrink-0 ${activeTab === 'history' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} aria-hidden="true" />
          <span>{isAr ? 'سجل الفحوصات والاعتمادات' : 'Inspection History Register'}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            {inspections.length}
          </span>
        </button>

        <button
          role="tab"
          id="tab-kpis"
          aria-selected={activeTab === 'kpis'}
          aria-controls="panel-kpis"
          onClick={() => setActiveTab('kpis')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer whitespace-nowrap focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
            activeTab === 'kpis'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/80 dark:border-slate-700 font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50'
          }`}
        >
          <Award className={`w-4 h-4 shrink-0 ${activeTab === 'kpis' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} aria-hidden="true" />
          <span>{isAr ? 'مؤشرات جودة التنفيذ والتحليلات' : 'Quality Metrics & KPIs'}</span>
        </button>
      </nav>

      {/* Tab Panels */}
      <div className="space-y-6">
        {/* Tab 1: Inspection Queue */}
        {activeTab === 'queue' && (
          <section id="panel-queue" role="tabpanel" aria-labelledby="tab-queue" className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-500" aria-hidden="true" />
                    <span>{isAr ? 'طلبات استلام الأعمال والفحص المعلقة' : 'Pending Inspection Requests'}</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {isAr
                      ? 'فحص الأعمال بالموقع وتسجيل المطابقة الفنية قبل السماح بالصب أو بدء الأنشطة اللاحقة.'
                      : 'Conduct site inspections and verify compliance before allowing concrete pouring or downstream activities.'}
                  </p>
                </div>

                {selectedProjectId !== 'all' && currentProject && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 self-start sm:self-auto">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{isAr ? currentProject.name_ar || currentProject.name_en : currentProject.name_en || currentProject.name_ar}</span>
                  </span>
                )}
              </div>

              <QCInspectionQueue
                crossProject={selectedProjectId === 'all'}
                inspections={inspections}
                projectId={selectedProjectId === 'all' ? undefined : selectedProjectId}
                onRefresh={handleRefresh}
              />
            </div>
          </section>
        )}

        {/* Tab 2: Inspection History Register */}
        {activeTab === 'history' && (
          <section id="panel-history" role="tabpanel" aria-labelledby="tab-history" className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
              {/* Filter Toolbar */}
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                  <label htmlFor="qc-history-search" className="sr-only">
                    {isAr ? 'بحث في السجل' : 'Search register'}
                  </label>
                  <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                  <input
                    id="qc-history-search"
                    type="text"
                    placeholder={isAr ? 'بحث برقم الفحص، البند، المشروع، أو الملاحظات...' : 'Search by request #, task, project, or notes...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-9 ps-9 pe-8 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      aria-label={isAr ? 'مسح البحث' : 'Clear search'}
                      className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Type Filter */}
                  <div className="relative">
                    <label htmlFor="qc-type-filter" className="sr-only">
                      {isAr ? 'نوع الفحص' : 'Inspection Type'}
                    </label>
                    <select
                      id="qc-type-filter"
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      aria-label={isAr ? 'تصفية حسب نوع الفحص' : 'Filter by inspection type'}
                      className="h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="all" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{isAr ? 'كافة الأنواع' : 'All Types'}</option>
                      <option value="wir" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{isAr ? 'استلام أعمال' : 'Work Inspection (WIR)'}</option>
                      <option value="mir" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{isAr ? 'فحص مواد وتوريدات' : 'Material Inspection (MIR)'}</option>
                      <option value="pre_pour" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{isAr ? 'فحص قبل الصب' : 'Pre-Pour Inspection'}</option>
                      <option value="ncr" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{isAr ? 'عدم مطابقة' : 'Non-Conformance (NCR)'}</option>
                      <option value="survey" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{isAr ? 'مساحة ومناسيب' : 'Survey'}</option>
                      <option value="final_handover" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{isAr ? 'تسليم نهائي' : 'Final Handover'}</option>
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div className="relative">
                    <label htmlFor="qc-status-filter" className="sr-only">
                      {isAr ? 'حالة الاعتماد' : 'Decision Status'}
                    </label>
                    <select
                      id="qc-status-filter"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      aria-label={isAr ? 'تصفية حسب حالة الفحص' : 'Filter by status'}
                      className="h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="all" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{isAr ? 'كافة الحالات' : 'All Statuses'}</option>
                      <option value="approved" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{isAr ? 'معتمد (مطابق)' : 'Approved'}</option>
                      <option value="rejected" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{isAr ? 'مرفوض (عدم مطابقة)' : 'Rejected'}</option>
                      <option value="pending" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{isAr ? 'بانتظار الفحص' : 'Pending'}</option>
                      <option value="cancelled" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{isAr ? 'ملغي' : 'Cancelled'}</option>
                    </select>
                  </div>

                  {/* Reset Filters button if active */}
                  {(typeFilter !== 'all' || statusFilter !== 'all' || searchQuery.trim()) && (
                    <button
                      onClick={() => {
                        setTypeFilter('all');
                        setStatusFilter('all');
                        setSearchQuery('');
                      }}
                      className="h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                    >
                      {isAr ? 'إعادة ضبط' : 'Reset'}
                    </button>
                  )}

                  <span className="text-xs text-slate-400 dark:text-slate-500 font-medium px-1">
                    {isAr
                      ? `(${filteredHistory.length} من ${inspections.length})`
                      : `(${filteredHistory.length} of ${inspections.length})`}
                  </span>
                </div>
              </div>

              {/* History Table Container */}
              {loadingInspections ? (
                <div className="py-12 text-center space-y-3">
                  <RotateCw className="w-7 h-7 text-blue-500 animate-spin mx-auto" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {isAr ? 'جاري تحميل سجل الفحوصات...' : 'Loading inspection history register...'}
                  </p>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="text-center py-14 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                  <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" aria-hidden="true" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    {isAr ? 'لا توجد طلبات فحص مطابقة لمعايير البحث' : 'No inspection records matching your filters.'}
                  </p>
                  {(typeFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
                    <button
                      onClick={() => {
                        setTypeFilter('all');
                        setStatusFilter('all');
                        setSearchQuery('');
                      }}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      {isAr ? 'مسح الفلاتر وإظهار كافة السجلات' : 'Clear filters and show all records'}
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <table
                    aria-label={isAr ? 'سجل اعتمادات وفحوصات الجودة' : 'Quality Control Inspection History Register'}
                    className="w-full text-xs text-start border-collapse min-w-[860px]"
                  >
                    <caption className="sr-only">
                      {isAr ? 'سجل اعتمادات وفحوصات الجودة وملاحظات الاستلام' : 'Quality Control Inspection History Register'}
                    </caption>
                    <thead>
                      <tr className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                        <th scope="col" className="p-3 text-start">{isAr ? 'رقم الطلب' : 'Request #'}</th>
                        <th scope="col" className="p-3 text-start">{isAr ? 'النوع' : 'Type'}</th>
                        {(selectedProjectId === 'all' || inspections.some((i) => i.project_id !== selectedProjectId)) && (
                          <th scope="col" className="p-3 text-start">{isAr ? 'المشروع' : 'Project'}</th>
                        )}
                        <th scope="col" className="p-3 text-start">{isAr ? 'بند العمل بالموقع' : 'Task'}</th>
                        <th scope="col" className="p-3 text-start">{isAr ? 'تاريخ الطلب' : 'Required Date'}</th>
                        <th scope="col" className="p-3 text-start">{isAr ? 'حالة الاعتماد' : 'Status'}</th>
                        <th scope="col" className="p-3 text-start">{isAr ? 'مهندس الفحص / الملاحظات' : 'Inspector / Findings'}</th>
                        <th scope="col" className="p-3 text-center">{isAr ? 'تفاصيل' : 'Details'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                      {filteredHistory.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="p-3 font-mono font-bold text-slate-900 dark:text-slate-100" dir="ltr">
                            {item.request_no}
                          </td>

                          <td className="p-3">
                            {renderTypeBadge(item.inspection_type)}
                          </td>

                          {(selectedProjectId === 'all' || inspections.some((i) => i.project_id !== selectedProjectId)) && (
                            <td className="p-3 font-bold text-blue-700 dark:text-blue-300 max-w-[160px] truncate" title={getProjectLabel(item)}>
                              {getProjectLabel(item)}
                            </td>
                          )}

                          <td className="p-3 font-medium text-slate-800 dark:text-slate-200 max-w-[200px] truncate" title={item.task_title_ar || (item as unknown as { pm_site_tasks?: { title_ar?: string } }).pm_site_tasks?.title_ar || ''}>
                            {item.task_title_ar || (item as unknown as { pm_site_tasks?: { title_ar?: string } }).pm_site_tasks?.title_ar || (isAr ? 'مهمة موقع' : 'Site Task')}
                          </td>

                          <td className="p-3 text-slate-500 dark:text-slate-400 font-mono">
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" aria-hidden="true" />
                              <span>{item.required_at || item.created_at?.slice(0, 10) || '-'}</span>
                            </span>
                          </td>

                          <td className="p-3 whitespace-nowrap">
                            {renderStatusBadge(item.status)}
                          </td>

                          <td className="p-3 text-slate-600 dark:text-slate-300 max-w-[220px]">
                            <div className="space-y-0.5">
                              {item.qc_name_ar && (
                                <span className="block text-[10px] text-slate-400 dark:text-slate-500">
                                  {isAr ? 'بواسطة: ' : 'By: '}{item.qc_name_ar}
                                </span>
                              )}
                              <p className="truncate text-xs" title={item.reason || ''}>
                                {item.reason || <span className="text-slate-400 dark:text-slate-500">-</span>}
                              </p>
                            </div>
                          </td>

                          <td className="p-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setSelectedDetailItem(item)}
                              aria-label={isAr ? `عرض تفاصيل الفحص ${item.request_no}` : `View details for inspection ${item.request_no}`}
                              className="p-1.5 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50 transition-colors cursor-pointer"
                              title={isAr ? 'عرض التفاصيل' : 'View Details'}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Tab 3: Quality Analytics & KPIs */}
        {activeTab === 'kpis' && (
          <section id="panel-kpis" role="tabpanel" aria-labelledby="tab-kpis" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Card 1: First-Pass Quality Distribution */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                  <span>{isAr ? 'معدل المطابقة وجودة الاستلام الأول' : 'First-Pass Quality Distribution'}</span>
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-400">
                      {isAr ? 'فحوصات مقبولة من المرة الأولى' : 'First-Pass Approved'}
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {approvedInspections.length} {passRatePct !== null ? `(${passRatePct}%)` : ''}
                    </span>
                  </div>

                  <div
                    className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"
                    role="progressbar"
                    aria-valuenow={passRatePct || 0}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={isAr ? 'نسبة المطابقة الأولى' : 'Pass rate percentage'}
                  >
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${passRatePct || 0}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-400">
                      {isAr ? 'ملاحظات وإعادة فحص وتصحيح' : 'Rejected / Rework'}
                    </span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      {rejectedInspections.length} {passRatePct !== null ? `(${100 - passRatePct}%)` : ''}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>{isAr ? 'إجمالي القرارات المحسومة' : 'Total Evaluated'}</span>
                    <span className="font-black text-slate-800 dark:text-slate-200">{totalDecided}</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Inspections by Type Breakdown */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-blue-500" aria-hidden="true" />
                  <span>{isAr ? 'توزيع الفحوصات حسب النوع' : 'Inspections by Type'}</span>
                </h3>

                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
                    <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                      {inspections.filter((i) => i.inspection_type?.toLowerCase() === 'wir').length}
                    </span>
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1">{isAr ? 'استلام أعمال' : 'WIR'}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
                    <span className="text-lg font-black text-purple-600 dark:text-purple-400">
                      {inspections.filter((i) => i.inspection_type?.toLowerCase() === 'mir').length}
                    </span>
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1">{isAr ? 'فحص مواد' : 'MIR'}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
                    <span className="text-lg font-black text-cyan-600 dark:text-cyan-400">
                      {inspections.filter((i) => i.inspection_type?.toLowerCase() === 'pre_pour').length}
                    </span>
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1">{isAr ? 'قبل الصب' : 'Pre-Pour'}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
                    <span className="text-lg font-black text-rose-600 dark:text-rose-400">
                      {inspections.filter((i) => i.inspection_type?.toLowerCase() === 'ncr').length}
                    </span>
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1">{isAr ? 'عدم مطابقة' : 'NCR'}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
                    <span className="text-lg font-black text-teal-600 dark:text-teal-400">
                      {inspections.filter((i) => (i.inspection_type?.toLowerCase() || '').includes('survey')).length}
                    </span>
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1">{isAr ? 'المساحة' : 'Survey'}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
                    <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                      {inspections.filter((i) => i.inspection_type?.toLowerCase() === 'final_handover').length}
                    </span>
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1">{isAr ? 'التسليم' : 'Handover'}</p>
                  </div>
                </div>
              </div>

              {/* Card 3: Enterprise Project Controls Compliance Rule */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 md:col-span-2 lg:col-span-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-500" aria-hidden="true" />
                  <span>{isAr ? 'معايير ضبط الجودة والمستخلصات' : 'Project Controls QC Gate'}</span>
                </h3>

                <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-xs space-y-2 text-slate-700 dark:text-slate-300">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" aria-hidden="true" />
                    <p className="leading-relaxed">
                      {isAr
                        ? 'قاعدة الحوكمة الإنشائية: لا يجوز اعتماد أي مستخلص مالي لأي بند تنفيذي دون محضر استلام أعمال معتمد ومطابقة استلام استشاري المشروع.'
                        : 'Governance Rule: No financial certificate or IPC shall be approved without an Approved WIR and consultant inspection sign-off.'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span>{isAr ? 'الفحوصات الملغاة' : 'Cancelled Requests'}</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{cancelledInspections.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span>{isAr ? 'نسبة المطابقة المستهدفة' : 'Target Threshold'}</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">≥ 90%</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* History Item Detail Modal */}
      {selectedDetailItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="detail-modal-title"
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in-50"
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-5 shadow-2xl relative"
            dir="rtl"
          >
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className={`text-[11px] font-bold text-slate-400 dark:text-slate-500 block ${isAr ? 'tracking-normal' : 'uppercase tracking-wider'}`}>

                  {isAr ? 'تفاصيل سجل الفحص' : 'Inspection Record Details'}
                </span>
                <h3 id="detail-modal-title" className="text-base font-black text-slate-900 dark:text-white mt-0.5 flex items-center gap-2">
                  <span dir="ltr">{selectedDetailItem.request_no}</span>
                  {renderTypeBadge(selectedDetailItem.inspection_type)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailItem(null)}
                aria-label={isAr ? 'إغلاق النافذة' : 'Close modal'}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Project & Task */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl">
                <div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 block">{isAr ? 'المشروع' : 'Project'}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {getProjectLabel(selectedDetailItem)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 block">{isAr ? 'الحالة الحالية' : 'Status'}</span>
                  <div className="mt-1">{renderStatusBadge(selectedDetailItem.status)}</div>
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block">{isAr ? 'بند العمل المرتبط' : 'Related Site Task'}</span>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                  {selectedDetailItem.task_title_ar || (selectedDetailItem as unknown as { pm_site_tasks?: { title_ar?: string } }).pm_site_tasks?.title_ar || (isAr ? 'مهمة موقع' : 'Site Task')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 block">{isAr ? 'تاريخ الطلب' : 'Required Date'}</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">
                    {selectedDetailItem.required_at || selectedDetailItem.created_at?.slice(0, 10) || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 block">{isAr ? 'مهندس الفحص' : 'Inspector'}</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {selectedDetailItem.qc_name_ar || (isAr ? 'فريق الجودة' : 'QC Team')}
                  </span>
                </div>
              </div>

              {/* Notes or Reason */}
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block">
                  {selectedDetailItem.status === 'rejected'
                    ? isAr
                      ? 'سبب الرفض والملاحظات التصحيحية'
                      : 'Rejection Reason & Required Rework'
                    : isAr
                    ? 'الملاحظات والقرارات'
                    : 'Decision Notes & Findings'}
                </span>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 min-h-[60px]">
                  {selectedDetailItem.reason || (isAr ? 'لا توجد ملاحظات مسجلة' : 'No notes recorded')}
                </div>
              </div>

              {/* Evidence URLs */}
              {selectedDetailItem.evidence_urls && selectedDetailItem.evidence_urls.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 block">{isAr ? 'المرفقات والصور' : 'Evidence & Photos'}</span>
                  <div className="space-y-1">
                    {selectedDetailItem.evidence_urls.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:underline border border-blue-200 dark:border-blue-900"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{isAr ? `مرفق إثبات #${idx + 1}` : `Evidence #${idx + 1}`}</span>
                        <ExternalLink className="w-3 h-3 ms-1 text-slate-400 dark:text-slate-500" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedDetailItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
