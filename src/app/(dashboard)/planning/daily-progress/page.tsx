'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ClipboardCheck, 
  PlusCircle, 
  ListOrdered, 
  AlertTriangle, 
  Boxes, 
  ArrowLeftRight, 
  ShieldCheck, 
  Building2, 
  RefreshCw, 
  HardHat, 
  Clock, 
  CheckCircle2, 
  Search, 
  Filter, 
  Calendar,
  Layers,
  Sparkles,
  TrendingDown,
  X,
  FileText
} from 'lucide-react';
import { Project, DailyProgress, DailyObstruction, ObstructionType } from '@/types';
import { ProjectService } from '@/lib/services/project.service';
import { DailyProgressService } from '@/lib/services/dailyProgress.service';
import { useAuth } from '@/lib/stores/useAuthStore';
import { useUserRoles } from '@/lib/hooks/useUserRoles';
import { useModuleAccess } from '@/lib/hooks/useModuleAccess';
import { canEditPath } from '@/lib/rbac/access-control';

// Components
import { DailyWorkHub } from '@/components/planning/DailyWorkHub';
import { DailyProgressForm } from '@/components/planning/DailyProgressForm';
import { DailyLogTable } from '@/components/planning/DailyLogTable';
import { DailyLineReviewModal } from '@/components/planning/DailyLineReviewModal';
import { DailyObstructionModal, OBSTRUCTION_TYPE_CONFIG } from '@/components/planning/DailyObstructionModal';
import { MosRegisterTable } from '@/components/planning/MosRegisterTable';
import { MaterialTransactionTable } from '@/components/planning/MaterialTransactionTable';
import { ApprovalDelegationModal } from '@/components/planning/ApprovalDelegationModal';
import { ReopenReportModal } from '@/components/planning/ReopenReportModal';
import { HistoryDrawer } from '@/components/planning/HistoryDrawer';
import { DailyProgressReviewModal } from '@/components/planning/DailyProgressReviewModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProjectStore } from '@/lib/stores/useProjectStore';
import { useSignedStorageUrlMap } from '@/lib/hooks/useSignedStorageUrl';

type TabKey = 'work_hub' | 'new_form' | 'logs_review' | 'obstructions' | 'mos' | 'materials' | 'delegations';

export default function DailyProgressPage() {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const { user } = useAuth();
  const { roles, isAdmin, isCoo } = useUserRoles();
  const { data: dbAccessRules } = useModuleAccess();
  const isViewerOnly = (roles || []).length > 0 && (roles || []).every((r) => r === 'viewer');
  const canEdit =
    !isViewerOnly &&
    (canEditPath('/planning/daily-progress', roles || [], isAdmin, dbAccessRules) ||
      canEditPath('/planning', roles || [], isAdmin, dbAccessRules));

  // Tab State
  const [activeTab, setActiveTab] = useState<TabKey>('work_hub');
  const effectiveTab: TabKey =
    !canEdit && (activeTab === 'work_hub' || activeTab === 'new_form' || activeTab === 'delegations')
      ? 'logs_review'
      : activeTab;

  // Projects State — two-way synced with global project store
  const [projects, setProjects] = useState<Project[]>([]);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const setActiveProjectId = useProjectStore((s) => s.setActiveProjectId);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(activeProjectId || '');
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Two-way sync: Update local state if activeProjectId in store changes externally
  useEffect(() => {
    if (activeProjectId && activeProjectId !== selectedProjectId) {
      setSelectedProjectId(activeProjectId);
    }
  }, [activeProjectId]);

  // Two-way sync: Update store if local selectedProjectId changes
  useEffect(() => {
    if (selectedProjectId && selectedProjectId !== activeProjectId) {
      setActiveProjectId(selectedProjectId);
    }
  }, [selectedProjectId, activeProjectId, setActiveProjectId]);

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
    setActiveProjectId(projectId);
  };

  // Daily Reports State
  const [reports, setReports] = useState<DailyProgress[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // Modals State
  const [reviewReport, setReviewReport] = useState<DailyProgress | null>(null);
  const [lineReviewReport, setLineReviewReport] = useState<DailyProgress | null>(null);
  const [obstructionReport, setObstructionReport] = useState<DailyProgress | null>(null);
  const [isObstructionModalOpen, setIsObstructionModalOpen] = useState(false);
  const [reopenReport, setReopenReport] = useState<DailyProgress | null>(null);
  const [isDelegationsModalOpen, setIsDelegationsModalOpen] = useState(false);
  const [historyReport, setHistoryReport] = useState<DailyProgress | null>(null);
  const [editingDraftReport, setEditingDraftReport] = useState<DailyProgress | null>(null);

  // Can Approve / PM permissions check
  const isPm = canEdit && (isAdmin || isCoo || roles.some((r) => r === 'project_manager' || r === 'pm'));
  const [canApprove, setCanApprove] = useState(false);

  // Load Projects
  useEffect(() => {
    setLoadingProjects(true);
    ProjectService.getProjects()
      .then((data) => {
        setProjects(data);
        if (data.length > 0) {
          const currentId = activeProjectId || selectedProjectId;
          const exists = data.some((p) => p.id === currentId);
          const targetId = exists && currentId ? currentId : data[0].id;
          setSelectedProjectId(targetId);
          setActiveProjectId(targetId);
        }
      })
      .catch((err) => console.error('Failed to fetch projects:', err))
      .finally(() => setLoadingProjects(false));
  }, []);

  // Load Daily Reports when selected project changes
  const loadReports = async () => {
    if (!selectedProjectId) return;
    setLoadingReports(true);
    try {
      const data = await DailyProgressService.getDailyReports(selectedProjectId);
      setReports(data);

      if (user?.id && canEdit) {
        const canAppr = await DailyProgressService.canUserApprove(
          selectedProjectId,
          user.id,
          roles[0] || 'member'
        );
        setCanApprove(canAppr || isPm);
      } else {
        setCanApprove(false);
      }
    } catch (err) {
      console.error('Failed to load daily reports:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [selectedProjectId, user, roles]);

  // Aggregate Obstructions across all reports of the selected project
  const allObstructions = useMemo(() => {
    const list: DailyObstruction[] = [];
    reports.forEach((r) => {
      if (r.obstructions && r.obstructions.length > 0) {
        list.push(...r.obstructions);
      }
    });
    return list;
  }, [reports]);

  const signedObstructionEvidenceUrls = useSignedStorageUrlMap(
    'progress-photos',
    allObstructions.map((o) => o.evidence_path),
    3600
  );

  // Tab navigation config with clean bilingual labels
  const tabs = useMemo(() => {
    const allTabs = [
      { key: 'work_hub' as TabKey, label: isAr ? 'مركز العمل الميداني' : 'Daily Work Hub', icon: HardHat, requiresEdit: true },
      { key: 'new_form' as TabKey, label: isAr ? 'تسجيل يومية جديدة' : 'New Daily Report', icon: PlusCircle, requiresEdit: true },
      { key: 'logs_review' as TabKey, label: isAr ? 'سجل اليوميات والمراجعة' : 'Reports Log & Review', icon: ListOrdered, requiresEdit: false },
      { key: 'obstructions' as TabKey, label: isAr ? 'سجل معوقات الموقع' : 'Site Obstructions Log', icon: AlertTriangle, count: allObstructions.length, requiresEdit: false },
      { key: 'mos' as TabKey, label: isAr ? 'تشوينات المواد بالموقع' : 'Materials on Site', icon: Boxes, requiresEdit: false },
      { key: 'materials' as TabKey, label: isAr ? 'حركات المستودع ونسب الهالك' : 'Warehouse & Wastage', icon: ArrowLeftRight, requiresEdit: false },
      { key: 'delegations' as TabKey, label: isAr ? 'تفويض صلاحيات الاعتماد' : 'Approval Delegations', icon: ShieldCheck, requiresEdit: true },
    ];
    return canEdit ? allTabs : allTabs.filter((t) => !t.requiresEdit);
  }, [isAr, allObstructions.length, canEdit]);

  // Selected project object
  const currentProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="p-3 sm:p-5 lg:p-6 space-y-6 max-w-[1750px] w-full mx-auto animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-emerald-700 text-white shadow-lg shadow-emerald-500/25">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {isAr ? 'تقرير الإنجاز وسجل الأعمال اليومية بالموقع' : 'Site Daily Progress & Operations'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60">
                P2-M2 / P2-M3
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isAr
                ? 'تسجيل ومتابعة الأعمال التنفيذية اليومية، طلبات فحص واستلام الأعمال، تشوينات المواد، ومراقبة نسب الهالك'
                : 'Track daily site executions, work inspection requests, materials on site, and wastage controls'}
            </p>
          </div>
        </div>

        {/* Project Selector Dropdown & Action Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {reports.length > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold">
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>{reports.length} {isAr ? 'يومية مسجلة' : 'Reports'}</span>
            </div>
          )}

          {loadingProjects ? (
            <div className="h-10 w-full md:w-72 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
          ) : (
            <div className="relative flex-1 md:w-72">
              <Building2 className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={selectedProjectId}
                onChange={(e) => handleProjectChange(e.target.value)}
                className="w-full ps-9 pe-8 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition cursor-pointer appearance-none"
              >
                {projects.length === 0 ? (
                  <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{isAr ? 'لا توجد مشاريع متاحة' : 'No projects available'}</option>
                ) : (
                  projects.map((p) => (
                    <option key={p.id} value={p.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                      {p.project_code} - {isAr ? (p.project_name_ar || p.project_name) : (p.project_name || p.project_name_ar)}
                    </option>
                  ))
                )}
              </select>
              <div className="absolute end-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <Filter className="w-3.5 h-3.5 opacity-60" />
              </div>
            </div>
          )}

          <button
            onClick={loadReports}
            disabled={loadingReports}
            className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition active:scale-95 disabled:opacity-50"
            title={isAr ? 'تحديث البيانات' : 'Refresh Data'}
            aria-label={isAr ? 'تحديث البيانات' : 'Refresh Data'}
          >
            <RefreshCw className={`w-4 h-4 ${loadingReports ? 'animate-spin text-emerald-700 dark:text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = effectiveTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                if (tab.key === 'delegations') {
                  if (canEdit) setIsDelegationsModalOpen(true);
                } else {
                  if (tab.key === 'new_form') {
                    setEditingDraftReport(null);
                  }
                  setActiveTab(tab.key);
                }
              }}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-700 text-white shadow-md shadow-emerald-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content 0: Unified Daily Work Hub */}
      {canEdit && effectiveTab === 'work_hub' && selectedProjectId && (
        <DailyWorkHub
          projectId={selectedProjectId}
          userId={user?.id}
        />
      )}

      {/* Tab Content 1: New Daily Progress Form */}
      {canEdit && effectiveTab === 'new_form' && (
        <DailyProgressForm
          projectId={selectedProjectId}
          projects={projects}
          initialReport={editingDraftReport}
          onSuccess={() => {
            setEditingDraftReport(null);
            loadReports();
            setActiveTab('logs_review');
          }}
          onCancel={() => {
            setEditingDraftReport(null);
            setActiveTab('logs_review');
          }}
        />
      )}

      {/* Tab Content 2: Daily Reports Log & Line Review */}
      {effectiveTab === 'logs_review' && (
        <DailyLogTable
          projectId={selectedProjectId}
          reports={reports}
          loading={loadingReports}
          canApprove={canEdit && canApprove}
          isPm={canEdit && isPm}
          onRefresh={loadReports}
          onReviewLines={(report) => {
            if (canEdit) setReviewReport(report);
          }}
          onReopenReport={(report) => {
            if (canEdit) setReopenReport(report);
          }}
          onAddObstruction={(report) => {
            if (!canEdit) return;
            setObstructionReport(report);
            setIsObstructionModalOpen(true);
          }}
          onViewHistory={(report) => setHistoryReport(report)}
          onEditDraft={
            canEdit
              ? (report) => {
                  setEditingDraftReport(report);
                  setActiveTab('new_form');
                }
              : undefined
          }
        />
      )}

      {/* Tab Content 3: Obstructions Register */}
      {effectiveTab === 'obstructions' && (
        <div className="space-y-6">
          {/* Obstructions Header & Stats */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>
                  {isAr 
                    ? 'سجل معوقات الموقع ومطالبات التمديد الزمني' 
                    : 'Site Obstructions Register & Time Extension Log'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr
                  ? 'توثيق فني وتعاقدي لكافة معوقات التنفيذ لحفظ حقوق تمديد مدة المشروع طبقاً للشروط التعاقدية'
                  : 'Technical and contractual documentation for site delays to support Extension of Time claims'}
              </p>
            </div>

            {canEdit && (
              <button
                onClick={() => {
                  setObstructionReport(null);
                  setIsObstructionModalOpen(true);
                }}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{isAr ? 'تسجيل معوق جديد' : 'Record New Obstruction'}</span>
              </button>
            )}
          </div>

          {/* Obstructions Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm bg-white dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3.5 text-start">{isAr ? 'تاريخ البدء' : 'Start Date'}</th>
                    <th className="px-4 py-3.5 text-start">{isAr ? 'نوع المعوق' : 'Obstruction Type'}</th>
                    <th className="px-4 py-3.5 text-start">{isAr ? 'الجهة المتسببة' : 'Responsible Party'}</th>
                    <th className="px-4 py-3.5 text-start">{isAr ? 'تفاصيل ووصف المعوق' : 'Description'}</th>
                    <th className="px-3 py-3.5 text-center">{isAr ? 'العمالة المعطلة' : 'Idle Manpower'}</th>
                    <th className="px-3 py-3.5 text-center">{isAr ? 'المعدات المعطلة' : 'Idle Equipment'}</th>
                    <th className="px-3 py-3.5 text-center">{isAr ? 'تاريخ المعالجة' : 'Resolution Date'}</th>
                    <th className="px-3 py-3.5 text-center">{isAr ? 'المستندات' : 'Documents'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {allObstructions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-16 text-center text-slate-400 dark:text-slate-500">
                        <AlertTriangle className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                        <div className="font-bold text-slate-700 dark:text-slate-300">
                          {isAr ? 'لا توجد معوقات مسجلة لهذا المشروع' : 'No obstructions recorded for this project'}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {isAr 
                            ? 'سجل المعوقات فارغ، انقر على زر تسجيل معوق جديد عند حدوث أي توقف أو تعطيل' 
                            : 'Obstructions log is empty. Click record new obstruction if delays occur'}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    allObstructions.map((obs) => {
                      const typeConfig = OBSTRUCTION_TYPE_CONFIG[obs.obstruction_type] || OBSTRUCTION_TYPE_CONFIG.other;
                      return (
                        <tr key={obs.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                          <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {obs.started_at?.slice(0, 10)}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${typeConfig.color}`}>
                              {typeConfig.labelAr}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-slate-200">
                            {obs.responsible_party}
                          </td>
                          <td className="px-4 py-3.5 max-w-sm text-slate-800 dark:text-slate-200">
                            <div className="line-clamp-2">{obs.description}</div>
                          </td>
                          <td className="px-3 py-3.5 text-center font-mono font-bold text-amber-600 dark:text-amber-400">
                            {obs.idle_manpower || 0} {isAr ? 'فرد' : 'workers'}
                          </td>
                          <td className="px-3 py-3.5 text-center text-slate-600 dark:text-slate-400">
                            {obs.idle_equipment_summary || '-'}
                          </td>
                          <td className="px-3 py-3.5 text-center font-mono text-slate-600 dark:text-slate-400">
                            {obs.resolved_at ? obs.resolved_at.slice(0, 10) : <span className="text-amber-600 dark:text-amber-400 font-bold">{isAr ? 'قيد المتابعة ⚠️' : 'Ongoing ⚠️'}</span>}
                          </td>
                          <td className="px-3 py-3.5 text-center">
                            {obs.evidence_path ? (
                              <a
                                href={signedObstructionEvidenceUrls[obs.evidence_path] || obs.evidence_path}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline"
                              >
                                {isAr ? 'عرض' : 'View'}
                              </a>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 4: Materials on Site (MOS) */}
      {effectiveTab === 'mos' && (
        <MosRegisterTable projectId={selectedProjectId} />
      )}

      {/* Tab Content 5: Warehouse Transactions & Wastage */}
      {effectiveTab === 'materials' && (
        <MaterialTransactionTable projectId={selectedProjectId} />
      )}

      {canEdit && (
        <>
          {/* Daily Line Review Modal */}
          <DailyLineReviewModal
            isOpen={Boolean(lineReviewReport)}
            onClose={() => setLineReviewReport(null)}
            report={lineReviewReport}
            onRefresh={loadReports}
          />

          {/* Planner Approval & Allocation Modal */}
          <DailyProgressReviewModal
            isOpen={Boolean(reviewReport)}
            onClose={() => setReviewReport(null)}
            report={reviewReport}
            projectId={selectedProjectId}
          />

          {/* Daily Obstruction Modal */}
          <DailyObstructionModal
            isOpen={isObstructionModalOpen}
            onClose={() => {
              setIsObstructionModalOpen(false);
              setObstructionReport(null);
            }}
            report={obstructionReport}
            projectId={obstructionReport?.project_id || selectedProjectId}
            onSuccess={loadReports}
          />

          {/* Reopen Daily Report Modal */}
          <ReopenReportModal
            isOpen={Boolean(reopenReport)}
            onClose={() => setReopenReport(null)}
            report={reopenReport}
            onSuccess={loadReports}
          />

          {/* Approval Delegation Modal */}
          <ApprovalDelegationModal
            isOpen={isDelegationsModalOpen}
            onClose={() => setIsDelegationsModalOpen(false)}
            projectId={selectedProjectId}
          />
        </>
      )}

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={Boolean(historyReport)}
        onClose={() => setHistoryReport(null)}
        entityId={historyReport?.id || null}
        entityTitle={historyReport ? (isAr ? `يومية #${historyReport.report_no} (${historyReport.progress_date})` : `Report #${historyReport.report_no} (${historyReport.progress_date})`) : undefined}
        mode="general"
      />
    </div>
  );
}
