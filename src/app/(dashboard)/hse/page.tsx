'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useUserRoles } from '@/lib/hooks/useUserRoles';
import { useModuleAccess } from '@/lib/hooks/useModuleAccess';
import { canAccessPath, canEditPath } from '@/lib/rbac/access-control';
import { useProjectStore } from '@/lib/stores/useProjectStore';
import { useLanguage } from '@/contexts/LanguageContext';
import { hseService } from '@/lib/services/hse.service';
import { ProjectService } from '@/lib/services/project.service';
import { Project } from '@/types';
import { HseIncident, HseInspection, HseMetrics, IncidentSeverity } from '@/types/hse';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  FileText,
  Search,
  Plus,
  Filter,
  RefreshCw,
  XCircle,
  HardHat,
  Eye,
  AlertOctagon,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Award,
  FolderKanban,
  ClipboardCheck,
  Sparkles,
  Flame,
  Construction,
} from 'lucide-react';
import { toast } from 'sonner';
import HseSeverityBadge, { UnifiedSeverity } from '@/components/hse/HseSeverityBadge';
import HseSkeleton from '@/components/hse/HseSkeleton';
import ReportIncidentModal from '@/components/hse/ReportIncidentModal';
import SafetyInspectionModal from '@/components/hse/SafetyInspectionModal';
import IncidentDetailsModal from '@/components/hse/IncidentDetailsModal';

const ALLOWED_ROLES = ['admin', 'hse_officer', 'hse_manager', 'project_manager', 'site_engineer', 'coo'];

export default function HSEPage() {
  const { roles: userRoles, isAdmin, hasRole, isLoading: rolesLoading } = useUserRoles();
  const { data: dbAccessRules, isLoading: accessLoading } = useModuleAccess();
  const isViewerOnly = (userRoles || []).length > 0 && (userRoles || []).every((r) => r === 'viewer');
  const canEdit =
    !rolesLoading &&
    !accessLoading &&
    !isViewerOnly &&
    canEditPath('/hse', userRoles || [], isAdmin, dbAccessRules);
  const { activeProjectId, setActiveProjectId } = useProjectStore();
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const isRTL = isAr;

  // Local selectedProjectId state synced two-way with useProjectStore
  const [selectedProjectId, setSelectedProjectId] = useState<string>(activeProjectId || '');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Two-way sync: global store -> local state
  useEffect(() => {
    if (activeProjectId && activeProjectId !== selectedProjectId) {
      setSelectedProjectId(activeProjectId);
    }
  }, [activeProjectId, selectedProjectId]);

  // Two-way sync: local state -> global store
  useEffect(() => {
    if (selectedProjectId && selectedProjectId !== activeProjectId) {
      setActiveProjectId(selectedProjectId);
    }
  }, [selectedProjectId, activeProjectId, setActiveProjectId]);

  const handleProjectChange = useCallback(
    (projectId: string) => {
      setSelectedProjectId(projectId);
      setActiveProjectId(projectId);
    },
    [setActiveProjectId]
  );

  const targetProjectId = selectedProjectId || activeProjectId;

  const [incidents, setIncidents] = useState<HseIncident[]>([]);
  const [inspections, setInspections] = useState<HseInspection[]>([]);
  const [metrics, setMetrics] = useState<HseMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [activeTab, setActiveTab] = useState<'incidents' | 'audits' | 'permits'>('incidents');
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal States
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [selectedIncidentForView, setSelectedIncidentForView] = useState<HseIncident | null>(null);

  // Load projects list for project switching
  useEffect(() => {
    async function loadProjects() {
      setLoadingProjects(true);
      try {
        const list = await ProjectService.getProjects();
        if (list && list.length > 0) {
          setProjects(list);
          const currentId = activeProjectId || selectedProjectId;
          if (!currentId) {
            const firstId = list[0].id;
            setActiveProjectId(firstId);
            setSelectedProjectId(firstId);
          }
        }
      } catch (err) {
        console.error('Failed to load projects', err);
      } finally {
        setLoadingProjects(false);
      }
    }
    loadProjects();
  }, [activeProjectId, selectedProjectId, setActiveProjectId]);

  // Load HSE data for current project
  const loadData = useCallback(
    async (isSilent = false) => {
      const currentId = selectedProjectId || activeProjectId;
      if (!currentId) return;
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      try {
        const [inc, insp, met] = await Promise.all([
          hseService.getIncidents(currentId),
          hseService.getInspections(currentId),
          hseService.getHseMetrics(currentId),
        ]);

        setIncidents(inc || []);
        setInspections(insp || []);
        setMetrics(
          met || {
            safeManHours: 0,
            ltiFreeDays: 0,
            totalIncidents: (inc || []).length,
            openActions: (inc || []).filter((i) => i.status !== 'closed').length,
            safetyScoreAverage:
              insp && insp.length > 0
                ? Math.round(insp.reduce((sum, item) => sum + item.score_pct, 0) / insp.length)
                : 100,
          }
        );
      } catch (error) {
        toast.error(isAr ? 'حدث خطأ أثناء تحميل بيانات السلامة والصحة المهنية' : 'Error loading HSE data');
        console.error(error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedProjectId, activeProjectId, isAr]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Active project metadata
  const currentProject = useMemo(() => {
    const currentId = selectedProjectId || activeProjectId;
    return projects.find((p) => p.id === currentId) || null;
  }, [projects, selectedProjectId, activeProjectId]);

  // Handle new incident added
  const handleIncidentSuccess = (newInc: HseIncident) => {
    if (!canEdit) return;
    setIncidents((prev) => [newInc, ...prev]);
    setMetrics((prev) =>
      prev
        ? {
            ...prev,
            totalIncidents: prev.totalIncidents + 1,
            openActions: prev.openActions + 1,
          }
        : null
    );
  };

  // Handle new inspection added
  const handleInspectionSuccess = (newInsp: HseInspection) => {
    if (!canEdit) return;
    setInspections((prev) => [newInsp, ...prev]);
    setMetrics((prev) => {
      if (!prev) return null;
      const allScores = [...inspections, newInsp].map((i) => i.score_pct);
      const avg = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);
      return {
        ...prev,
        safetyScoreAverage: avg,
      };
    });
  };

  // Filtered Incidents List
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      // Severity filter mapping
      if (severityFilter !== 'all') {
        if (severityFilter === 'low' && !['near_miss', 'first_aid'].includes(inc.severity)) return false;
        if (severityFilter === 'medium' && inc.severity !== 'medical_treatment') return false;
        if (severityFilter === 'high' && inc.severity !== 'lost_time') return false;
        if (severityFilter === 'critical' && inc.severity !== 'fatal') return false;
        if (
          !['low', 'medium', 'high', 'critical'].includes(severityFilter) &&
          inc.severity !== severityFilter
        ) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'all' && inc.status !== statusFilter) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNum = inc.incident_number?.toLowerCase().includes(q);
        const matchTitleAr = inc.title_ar?.toLowerCase().includes(q);
        const matchTitleEn = inc.title_en?.toLowerCase().includes(q);
        const matchLoc = inc.location_description?.toLowerCase().includes(q);
        const matchCause = inc.root_cause?.toLowerCase().includes(q);

        if (!matchNum && !matchTitleAr && !matchTitleEn && !matchLoc && !matchCause) return false;
      }

      return true;
    });
  }, [incidents, severityFilter, statusFilter, searchQuery]);

  // Filtered Inspections List
  const filteredInspections = useMemo(() => {
    return inspections.filter((insp) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchInspector = insp.inspector_name?.toLowerCase().includes(q);
        const matchFindings = insp.findings?.toLowerCase().includes(q);
        if (!matchInspector && !matchFindings) return false;
      }
      return true;
    });
  }, [inspections, searchQuery]);

  // Loading skeleton state
  if (rolesLoading || accessLoading || loading) {
    return <HseSkeleton locale={locale} />;
  }

  // Access validation
  const hasAccess =
    canAccessPath('/hse', userRoles || [], isAdmin, dbAccessRules) ||
    ALLOWED_ROLES.some((r) => hasRole(r));
  if (!hasAccess) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4"
        dir="rtl"
      >
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {isAr ? 'غير مصرح بالوصول إلى لوحة السلامة والصحة المهنية' : 'Unauthorized Access to HSE Module'}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
          {isAr
            ? 'هذه الصفحة مخصصة لمسؤولي ومديري السلامة والصحة المهنية، مديري المشاريع، مهندسي الموقع، والإدارة التنفيذية فقط.'
            : 'This module is restricted to HSE Officers, HSE Managers, Project Managers, Site Engineers, and Executive Management.'}
        </p>
      </div>
    );
  }

  // No active project selected fallback with interactive picker
  if (!targetProjectId) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-5"
        dir="rtl"
      >
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
          <FolderKanban className="w-8 h-8" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {isAr ? 'يرجى اختيار مشروع لاستعراض سجلات السلامة' : 'Please Select a Project for HSE Records'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {isAr
              ? 'اختر المشروع من القائمة أدناه لعرض ساعات العمل الآمنة، سجل الوقائع، وجولات التفتيش'
              : 'Select a project from the list below to review safe man-hours, incidents, and audits'}
          </p>
        </div>

        {projects.length > 0 && (
          <div className="w-full max-w-xs space-y-2">
            <label htmlFor="project-picker-empty" className="sr-only">
              {isAr ? 'اختر المشروع' : 'Select Project'}
            </label>
            <select
              id="project-picker-empty"
              value={targetProjectId || ''}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="w-full p-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-slate-800 dark:text-white shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="">{isAr ? '-- اختر مشروعاً --' : '-- Choose Project --'}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code ? `[${p.code}] ` : ''}
                  {isAr ? p.name_ar || p.name_en : p.name_en || p.name_ar}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    );
  }

  // Safe man-hours milestone calculation (e.g. next 500,000 milestone)
  const safeHours = metrics?.safeManHours || 0;
  const nextMilestone = Math.max(500000, Math.ceil((safeHours + 1) / 500000) * 500000);
  const milestoneProgress = Math.min(100, Math.round((safeHours / nextMilestone) * 100));

  return (
    <div
      className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full min-h-screen text-slate-900 dark:text-slate-100"
      dir="rtl"
    >
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
            <Shield className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className={`text-xl sm:text-2xl font-black text-slate-900 dark:text-white ${isAr ? 'tracking-normal' : 'tracking-tight'}`}>
                {isAr ? 'السلامة والصحة المهنية وحماية البيئة' : 'Health, Safety & Environment (HSE)'}
              </h1>
              {currentProject && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {currentProject.code ? `[${currentProject.code}] ` : ''}
                  {isAr ? currentProject.name_ar || currentProject.name_en : currentProject.name_en || currentProject.name_ar}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isAr
                ? 'مراقبة الامتثال الميداني، إدارة جولات التفتيش، رصد ساعات العمل الآمنة، والتحكم في المخاطر المهنية'
                : 'Field compliance monitoring, audit checklists, safe man-hours tracking, and incident control'}
            </p>
          </div>
        </div>

        {/* Actions & Project Switcher */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {projects.length > 1 && (
            <div className="relative">
              <label htmlFor="project-switcher-top" className="sr-only">
                {isAr ? 'تبديل المشروع' : 'Switch Project'}
              </label>
              <select
                id="project-switcher-top"
                value={targetProjectId || ''}
                onChange={(e) => handleProjectChange(e.target.value)}
                className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs cursor-pointer transition-all"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code ? `[${p.code}] ` : ''}
                    {isAr ? p.name_ar || p.name_en : p.name_en || p.name_ar}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Refresh button */}
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            title={isAr ? 'تحديث البيانات' : 'Refresh data'}
            aria-label={isAr ? 'تحديث البيانات' : 'Refresh data'}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
          </button>

          {/* Secondary CTA: New Inspection */}
          {canEdit && (
            <button
              type="button"
              onClick={() => setIsInspectionModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs shadow-2xs transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <ClipboardCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" aria-hidden="true" />
              <span>{isAr ? 'جولة تفتيش ميدانية' : 'Safety Inspection'}</span>
            </button>
          )}

          {/* Primary CTA: Report Incident */}
          {canEdit && (
            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <AlertTriangle className="w-4 h-4 text-emerald-100" aria-hidden="true" />
              <span>{isAr ? 'إبلاغ عن واقعة أو حادث' : 'Report Incident'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Safe Man-Hours Counter Display & KPI Cards */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Safe Man-Hours with Progress Milestone */}
          <div className="bg-gradient-to-br from-white via-white to-emerald-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20 p-5 rounded-3xl shadow-xs hover:shadow-md border border-slate-200/90 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-700 transition-all duration-300 relative overflow-hidden group">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                {isAr ? 'ساعات العمل الآمنة' : 'Safe Man-Hours'}
              </span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" aria-hidden="true" />
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums">
                  {metrics.safeManHours.toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {isAr ? 'ساعة عمل' : 'hrs'}
                </span>
              </div>

              {/* Milestone Indicator */}
              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  <span>{isAr ? 'المستهدف المرحلي:' : 'Milestone:'} {nextMilestone.toLocaleString()}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{milestoneProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                    style={{ width: `${milestoneProgress}%` }}
                  />
                </div>
              </div>

              <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{isAr ? 'سجل تشغيل خالٍ من الإصابات المعطلة' : 'Zero Lost Time Injury streak'}</span>
              </div>
            </div>
          </div>

          {/* Card 2: LTI-Free Days */}
          <div className="bg-gradient-to-br from-white via-white to-blue-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/20 p-5 rounded-3xl shadow-xs hover:shadow-md border border-slate-200/90 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-700 transition-all duration-300 relative overflow-hidden group">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                {isAr ? 'أيام العمل بلا إصابات معطلة' : 'LTI-Free Days'}
              </span>
              <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5" aria-hidden="true" />
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums">
                  {metrics.ltiFreeDays}
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {isAr ? 'يوم متواصل' : 'days'}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-900 border border-blue-200 dark:bg-blue-950/80 dark:text-blue-200 dark:border-blue-800">
                  <Award className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  <span>{isAr ? 'مطابق للمواصفات القياسية المعتمدة' : 'OSHA / ISO Compliant'}</span>
                </span>
              </div>

              <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                {isAr ? 'استمرار العمليات الميدانية دون توقف تشغيلي' : 'Continuous operation without disabling injury'}
              </p>
            </div>
          </div>

          {/* Card 3: Total Incidents */}
          <div className="bg-gradient-to-br from-white via-white to-amber-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/20 p-5 rounded-3xl shadow-xs hover:shadow-md border border-slate-200/90 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-700 transition-all duration-300 relative overflow-hidden group">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                {isAr ? 'إجمالي الوقائع والحوادث' : 'Total HSE Incidents'}
              </span>
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                  metrics.totalIncidents === 0
                    ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                    : 'bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                }`}
              >
                <AlertTriangle className="w-5 h-5" aria-hidden="true" />
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums">
                  {metrics.totalIncidents}
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {isAr ? 'واقعة مسجلة' : 'records'}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    metrics.openActions === 0
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-800'
                  }`}
                >
                  {metrics.openActions === 0 ? (
                    <span>{isAr ? 'جميع الإجراءات التصحيحية مكتملة' : 'All corrective actions completed'}</span>
                  ) : (
                    <span>
                      {metrics.openActions} {isAr ? 'إجراءات تصحيحية قيد المتابعة' : 'Open CAPA actions'}
                    </span>
                  )}
                </span>
              </div>

              <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                {isAr ? 'متابعة تنفيذ الإجراءات الوقائية والتصحيحية' : 'Active corrective and preventive measures'}
              </p>
            </div>
          </div>

          {/* Card 4: Safety Score Average */}
          <div className="bg-gradient-to-br from-white via-white to-purple-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-purple-950/20 p-5 rounded-3xl shadow-xs hover:shadow-md border border-slate-200/90 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-700 transition-all duration-300 relative overflow-hidden group">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                {isAr ? 'معدل الامتثال والسلامة' : 'Safety Score Average'}
              </span>
              <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0">
                <Activity className="w-5 h-5" aria-hidden="true" />
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums">
                  {metrics.safetyScoreAverage}%
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {metrics.safetyScoreAverage >= 90
                    ? isAr ? 'ممتاز' : 'Excellent'
                    : metrics.safetyScoreAverage >= 75
                    ? isAr ? 'جيد جداً' : 'Good'
                    : isAr ? 'يتطلب إجراءات تصحيحية' : 'Needs Action'}
                </span>
              </div>

              {/* Gauge Progress Bar */}
              <div className="mt-3 space-y-1">
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      metrics.safetyScoreAverage >= 90
                        ? 'bg-emerald-500'
                        : metrics.safetyScoreAverage >= 75
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, metrics.safetyScoreAverage)}%` }}
                  />
                </div>
              </div>

              <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                {isAr ? 'مستخلص من جولات الفحص والتقييم الميداني' : 'Derived from periodic site inspections'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Tabbed Area */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Tab Navigation */}
        <div className="flex items-center flex-wrap border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 px-4 pt-2 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('incidents')}
            className={`px-5 py-3 font-bold text-xs sm:text-sm flex items-center gap-2 rounded-t-2xl transition-all cursor-pointer ${
              activeTab === 'incidents'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 border-t-2 border-emerald-600 shadow-2xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>{isAr ? 'سجل الوقائع والملاحظات' : 'Incidents & Observations Log'}</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {incidents.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audits')}
            className={`px-5 py-3 font-bold text-xs sm:text-sm flex items-center gap-2 rounded-t-2xl transition-all cursor-pointer ${
              activeTab === 'audits'
                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 border-t-2 border-teal-600 shadow-2xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>{isAr ? 'جولات التفتيش وقوائم الفحص' : 'Inspection Audits & Checklists'}</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {inspections.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('permits')}
            className={`px-5 py-3 font-bold text-xs sm:text-sm flex items-center gap-2 rounded-t-2xl transition-all cursor-pointer ${
              activeTab === 'permits'
                ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 border-t-2 border-blue-600 shadow-2xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{isAr ? 'تصاريح العمل الميداني' : 'Permits to Work (PTW)'}</span>
          </button>
        </div>

        {/* Tab 1: Incidents Log */}
        {activeTab === 'incidents' && (
          <div>
            {/* Search and Filters Toolbar */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute inset-y-0 start-3 my-auto text-slate-400 dark:text-slate-500" aria-hidden="true" />
                <input
                  type="text"
                  placeholder={
                    isAr
                      ? 'بحث برقم الواقعة، العنوان، الموقع، أو السبب...'
                      : 'Search by incident #, title, location...'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full ps-9 pe-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
                {/* Severity Filter */}
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                  <label htmlFor="severity-filter-select" className="sr-only">
                    {isAr ? 'تصفية حسب الخطورة' : 'Filter by severity'}
                  </label>
                  <select
                    id="severity-filter-select"
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="all">{isAr ? 'جميع مستويات الخطورة' : 'All Severities'}</option>
                    <option value="low">{isAr ? 'منخفض (وشيك أو إسعاف أولي)' : 'Low (Near Miss / First Aid)'}</option>
                    <option value="medium">{isAr ? 'متوسط (علاج طبي موقعي)' : 'Medium (Medical Treatment)'}</option>
                    <option value="high">{isAr ? 'مرتفع (إصابة مهدرة للوقت)' : 'High (Lost Time LTI)'}</option>
                    <option value="critical">{isAr ? 'حرج (حادث جسيم أو وفاة)' : 'Critical (Fatal)'}</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label htmlFor="status-filter-select" className="sr-only">
                    {isAr ? 'تصفية حسب الحالة' : 'Filter by status'}
                  </label>
                  <select
                    id="status-filter-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="all">{isAr ? 'جميع الحالات' : 'All Statuses'}</option>
                    <option value="reported">{isAr ? 'تم الإبلاغ' : 'Reported'}</option>
                    <option value="investigating">{isAr ? 'قيد التحقيق الميداني' : 'Investigating'}</option>
                    <option value="closed">{isAr ? 'مغلق ومكتمل' : 'Closed'}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table
                className={`w-full text-xs sm:text-sm ${isAr ? 'text-right' : 'text-left'}`}
                role="table"
                aria-label={isAr ? 'سجل وقائع وحوادث السلامة' : 'HSE Incidents Register'}
              >
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">
                  <tr>
                    <th scope="col" className="p-4">{isAr ? 'رقم الواقعة' : 'Incident #'}</th>
                    <th scope="col" className="p-4">{isAr ? 'التاريخ' : 'Date'}</th>
                    <th scope="col" className="p-4">{isAr ? 'العنوان والموقع الميداني' : 'Title & Location'}</th>
                    <th scope="col" className="p-4">{isAr ? 'مستوى الخطورة' : 'Severity Level'}</th>
                    <th scope="col" className="p-4">{isAr ? 'الإصابات' : 'Injuries'}</th>
                    <th scope="col" className="p-4">{isAr ? 'الحالة' : 'Status'}</th>
                    <th scope="col" className="p-4 text-center">{isAr ? 'التفاصيل' : 'Details'}</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredIncidents.map((inc) => (
                    <tr
                      key={inc.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedIncidentForView(inc)}
                    >
                      <td className="p-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {inc.incident_number}
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {new Date(inc.incident_date).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
                      </td>
                      <td className="p-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900 dark:text-white">
                            {isAr ? inc.title_ar : inc.title_en || inc.title_ar}
                          </p>
                          {inc.location_description && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {inc.location_description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <HseSeverityBadge severity={inc.severity} locale={locale} size="sm" />
                      </td>
                      <td className="p-4">
                        {inc.injury_count > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-950 border border-rose-300 dark:bg-rose-950/80 dark:text-rose-100 dark:border-rose-700">
                            {inc.injury_count} {isAr ? 'إصابة' : 'injured'}
                          </span>
                        ) : (
                          <span className="text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                            {isAr ? 'لا يوجد' : '0'}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                            inc.status === 'closed'
                              ? 'bg-emerald-50 text-emerald-950 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-100 dark:border-emerald-700'
                              : inc.status === 'investigating'
                              ? 'bg-amber-50 text-amber-950 border-amber-300 dark:bg-amber-950/80 dark:text-amber-100 dark:border-amber-700'
                              : 'bg-blue-50 text-blue-950 border-blue-300 dark:bg-blue-950/80 dark:text-blue-100 dark:border-blue-700'
                          }`}
                        >
                          {inc.status === 'closed'
                            ? isAr ? 'مغلق ومكتمل' : 'Closed'
                            : inc.status === 'investigating'
                            ? isAr ? 'قيد التحقيق' : 'Investigating'
                            : isAr ? 'تم الإبلاغ' : 'Reported'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIncidentForView(inc);
                          }}
                          aria-label={isAr ? `عرض تفاصيل الواقعة ${inc.incident_number}` : `View incident ${inc.incident_number}`}
                          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredIncidents.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-10 text-center">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center">
                            <ShieldCheck className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                              {isAr ? 'لا توجد وقائع مسجلة مطابقة' : 'No matching HSE incidents found'}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {isAr
                                ? 'السجل نظيف أو لم يتم العثور على نتائج تطابق معايير البحث والتصفية'
                                : 'Records are clean or no incidents match the active search and filters'}
                            </p>
                          </div>
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => setIsReportModalOpen(true)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{isAr ? 'تسجيل واقعة جديدة' : 'Report an Incident'}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Safety Audits & Inspection Checklists */}
        {activeTab === 'audits' && (
          <div>
            {/* Checklist Overview Banner */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isAr ? 'قوائم الفحص الميداني ومعايير السلامة المهنية' : 'Field Inspection & Safety Checklists'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isAr
                    ? 'تقييم شامل يغطي مهمات الوقاية الشخصية، السقالات، الحفر، السلامة الكهربائية، ومكافحة الحريق'
                    : 'Systematic audits covering PPE, Scaffolding, Excavation, Electrical, and Fire Safety'}
                </p>
              </div>

              {canEdit && (
                <button
                  type="button"
                  onClick={() => setIsInspectionModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isAr ? 'تسجيل جولة تفتيش جديدة' : 'Conduct Safety Inspection'}</span>
                </button>
              )}
            </div>

            {/* Inspections Table */}
            <div className="overflow-x-auto">
              <table
                className={`w-full text-xs sm:text-sm ${isAr ? 'text-right' : 'text-left'}`}
                role="table"
                aria-label={isAr ? 'سجل جولات التفتيش والسلامة المهنية' : 'Safety Inspection Log'}
              >
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">
                  <tr>
                    <th scope="col" className="p-4">{isAr ? 'تاريخ التفتيش' : 'Inspection Date'}</th>
                    <th scope="col" className="p-4">{isAr ? 'المفتش المسؤول' : 'Inspector'}</th>
                    <th scope="col" className="p-4">{isAr ? 'نسبة الامتثال' : 'Compliance Score'}</th>
                    <th scope="col" className="p-4">{isAr ? 'ممارسات آمنة' : 'Safe Acts'}</th>
                    <th scope="col" className="p-4">{isAr ? 'ممارسات غير آمنة' : 'Unsafe Acts'}</th>
                    <th scope="col" className="p-4">{isAr ? 'أمر إيقاف العمل' : 'Stop-Work'}</th>
                    <th scope="col" className="p-4">{isAr ? 'الملاحظات والتوصيات' : 'Findings'}</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredInspections.map((insp) => (
                    <tr key={insp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-4 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">
                        {new Date(insp.inspection_date).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
                      </td>
                      <td className="p-4 font-bold text-slate-900 dark:text-white">
                        {insp.inspector_name}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{insp.score_pct}%</span>
                          <div className="w-20 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                insp.score_pct >= 90
                                  ? 'bg-emerald-500'
                                  : insp.score_pct >= 75
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${insp.score_pct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{insp.safe_acts_count}</span>
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 font-bold text-rose-700 dark:text-rose-400">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>{insp.unsafe_acts_count}</span>
                        </span>
                      </td>
                      <td className="p-4">
                        {insp.stop_work_issued ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-100 text-rose-950 border border-rose-400 dark:bg-rose-950 dark:text-rose-100 dark:border-rose-600 animate-pulse">
                            <AlertOctagon className="w-3.5 h-3.5" />
                            <span>{isAr ? 'أمر إيقاف عمل نافذ' : 'STOP WORK ISSUED'}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                            {isAr ? 'تشغيل طبيعي' : 'Normal'}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-xs text-slate-600 dark:text-slate-300 max-w-xs truncate">
                        {insp.findings || (isAr ? 'لا توجد ملاحظات مسجلة' : 'No findings')}
                      </td>
                    </tr>
                  ))}

                  {filteredInspections.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-slate-500 dark:text-slate-400">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <ClipboardCheck className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                          <p className="font-bold text-slate-800 dark:text-slate-200">{isAr ? 'لا توجد جولات تفتيش مسجلة' : 'No inspections recorded'}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {isAr ? 'قم بإجراء أول فحص ميداني لقياس مؤشرات السلامة' : 'Conduct your first site audit to measure safety KPIs'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Permits to Work (PTW) */}
        {activeTab === 'permits' && (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isAr ? 'نظام تصاريح العمل الإلكترونية المسبقة' : 'Permit to Work System (PTW)'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isAr
                  ? 'إصدار واعتماد تصاريح العمل للأنشطة عالية الخطورة قبل البدء في التنفيذ بالموقع'
                  : 'Authorized digital permits for high-risk activities prior to site execution'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  titleAr: 'تصريح الأعمال الساخنة واللحام',
                  titleEn: 'Hot Work Permit',
                  descAr: 'أعمال القطع الحراري، اللحام، واستخدام مصادر اللهب المكشوف في الموقع',
                  descEn: 'Cutting, welding, flame torches, and high thermal activities',
                  icon: Flame,
                  color: 'text-amber-600 dark:text-amber-400',
                  bg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800',
                },
                {
                  titleAr: 'تصريح العمل على الارتفاعات',
                  titleEn: 'Work at Heights Permit',
                  descAr: 'الأعمال على ارتفاع يتجاوز 1.8 متر، تشييد الواجهات، وتركيب السقالات',
                  descEn: 'Activities above 1.8 meters, façade installation, scaffold erection',
                  icon: Construction,
                  color: 'text-blue-600 dark:text-blue-400',
                  bg: 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800',
                },
                {
                  titleAr: 'تصريح دخول الأماكن المغلقة',
                  titleEn: 'Confined Space Permit',
                  descAr: 'الخزانات الأرضية، غرف المحابس، وأنابيب الصرف وفحص نسبة الأكسجين',
                  descEn: 'Underground tanks, valve chambers, pipelines, oxygen testing',
                  icon: AlertOctagon,
                  color: 'text-rose-600 dark:text-rose-400',
                  bg: 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800',
                },
                {
                  titleAr: 'تصريح الحفر العميق',
                  titleEn: 'Deep Excavation Permit',
                  descAr: 'الحفر لعمق يتجاوز 1.2 متر، فحص المرافق المدفونة وسند جوانب الحفر',
                  descEn: 'Excavations deeper than 1.2m, buried utilities scan, shoring',
                  icon: HardHat,
                  color: 'text-teal-600 dark:text-teal-400',
                  bg: 'bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800',
                },
              ].map((permit, idx) => {
                const Icon = permit.icon;
                return (
                  <div
                    key={idx}
                    className={`p-5 rounded-3xl border ${permit.bg} flex flex-col justify-between space-y-4`}
                  >
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-xs">
                        <Icon className={`w-5 h-5 ${permit.color}`} />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {isAr ? permit.titleAr : permit.titleEn}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {isAr ? permit.descAr : permit.descEn}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        {isAr ? 'يتطلب موافقة مسؤول السلامة واستشاري الموقع' : 'Requires HSE Officer & Consultant Sign-off'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Report Incident Modal */}
      {canEdit && (
        <ReportIncidentModal
          isOpen={isReportModalOpen}
          projectId={targetProjectId}
          onClose={() => setIsReportModalOpen(false)}
          onSuccess={handleIncidentSuccess}
          locale={locale}
          existingCount={incidents.length}
        />
      )}

      {/* Safety Inspection Modal */}
      {canEdit && (
        <SafetyInspectionModal
          isOpen={isInspectionModalOpen}
          projectId={targetProjectId}
          onClose={() => setIsInspectionModalOpen(false)}
          onSuccess={handleInspectionSuccess}
          locale={locale}
        />
      )}

      {/* Incident Details Modal */}
      <IncidentDetailsModal
        incident={selectedIncidentForView}
        onClose={() => setSelectedIncidentForView(null)}
        locale={locale}
      />
    </div>
  );
}
