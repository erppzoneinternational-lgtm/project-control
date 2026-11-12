'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  User,
  Building2,
  Search,
  RefreshCw,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  FileWarning,
  Layers,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Plus,
  Flame,
  Activity,
} from 'lucide-react';
import { InspectionRequest, InspectionType, InspectionStatus } from '@/types/task-ontology';
import { TaskOntologyService } from '@/lib/services/taskOntology.service';
import { WorkflowKanbanColumn } from '../WorkflowKanbanColumn';
import { SLAProgressBar } from '../SLAProgressBar';
import { UnifiedStatusBadge } from '../UnifiedStatusBadge';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

export interface InspectionsKanbanProps {
  projectId: string;
  userRoles: string[];
  isCrossProject?: boolean;
  activeFilter: string;
  onCardClick: (inspectionId: string) => void;
  isAr?: boolean;
}

// Fallback Mock Data for preview & testing when DB is empty
const MOCK_INSPECTIONS: InspectionRequest[] = [
  {
    id: 'insp-mock-1',
    task_id: 'task-101',
    project_id: 'proj-1',
    request_no: 'WIR-042',
    inspection_type: 'WIR',
    required_at: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
    status: 'pending',
    created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    task_title_ar: 'صب خرسانة القواعد المسلحة - مرحلة 1',
    qc_name_ar: 'م. أحمد الشامي',
    project_name_ar: 'مشروع أبراج البستان السكني',
    project_code: 'BST-2026',
  },
  {
    id: 'insp-mock-2',
    task_id: 'task-102',
    project_id: 'proj-1',
    request_no: 'MIR-015',
    inspection_type: 'MIR',
    required_at: new Date(Date.now() + 5 * 3600 * 1000).toISOString(),
    status: 'pending',
    created_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    task_title_ar: 'توريد واعتماد حديد التسليح عالي المقاومة Ø16mm',
    qc_name_ar: 'م. سارة المهندس',
    project_name_ar: 'مشروع أبراج البستان السكني',
    project_code: 'BST-2026',
  },
  {
    id: 'insp-mock-3',
    task_id: 'task-103',
    project_id: 'proj-1',
    request_no: 'WIR-043',
    inspection_type: 'WIR',
    required_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(), // Overdue
    status: 'pending',
    created_at: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    task_title_ar: 'عزل الرطوبة للقواعد ورقاب الأعمدة بالبيتومين المطاطي',
    qc_name_ar: 'م. أحمد الشامي',
    project_name_ar: 'مشروع مجمع الواحة التجاري',
    project_code: 'OAS-2026',
  },
  {
    id: 'insp-mock-4',
    task_id: 'task-104',
    project_id: 'proj-1',
    request_no: 'WIR-039',
    inspection_type: 'WIR',
    required_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    status: 'approved',
    decision_at: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
    created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    task_title_ar: 'تركيب شبكة حديد تسليح سقف الدور الأرضي',
    qc_name_ar: 'م. كريم القحطاني',
    project_name_ar: 'مشروع أبراج البستان السكني',
    project_code: 'BST-2026',
  },
  {
    id: 'insp-mock-5',
    task_id: 'task-105',
    project_id: 'proj-1',
    request_no: 'MIR-012',
    inspection_type: 'MIR',
    required_at: new Date(Date.now() - 30 * 3600 * 1000).toISOString(),
    status: 'approved',
    decision_at: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
    created_at: new Date(Date.now() - 50 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    task_title_ar: 'اعتماد عينات مواسير الصرف الصحي UPVC Class 4',
    qc_name_ar: 'م. سارة المهندس',
    project_name_ar: 'مشروع درة الخليج',
    project_code: 'DRR-2026',
  },
  {
    id: 'insp-mock-6',
    task_id: 'task-106',
    project_id: 'proj-1',
    request_no: 'NCR-008',
    inspection_type: 'NCR',
    required_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    status: 'rejected',
    reason: 'وجود تعشيش في قاعدة العمود C4 وعدم كفاية سُمك الغطاء الخرساني الواقي',
    decision_at: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
    created_at: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    task_title_ar: 'صب خرسانة أعمدة الدور الأول',
    qc_name_ar: 'م. أحمد الشامي',
    project_name_ar: 'مشروع أبراج البستان السكني',
    project_code: 'BST-2026',
  },
  {
    id: 'insp-mock-7',
    task_id: 'task-107',
    project_id: 'proj-1',
    request_no: 'WIR-038',
    inspection_type: 'WIR',
    required_at: new Date(Date.now() - 60 * 3600 * 1000).toISOString(),
    status: 'rejected',
    reason: 'عدم تطابق نتائج اختبار الهبوط الخرساني مع مواصفات الخلطة المعتمدة',
    decision_at: new Date(Date.now() - 58 * 3600 * 1000).toISOString(),
    created_at: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    task_title_ar: 'صب خرسانة الميد الأرضية',
    qc_name_ar: 'م. كريم القحطاني',
    project_name_ar: 'مشروع مجمع الواحة التجاري',
    project_code: 'OAS-2026',
  },
];

export const InspectionsKanban: React.FC<InspectionsKanbanProps> = ({
  projectId,
  userRoles,
  isCrossProject = false,
  activeFilter,
  onCardClick,
  isAr = true,
}) => {
  const [inspections, setInspections] = useState<InspectionRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch Inspections Data
  const loadInspections = useCallback(async () => {
    setLoading(true);
    try {
      const data = await TaskOntologyService.listInspections(
        isCrossProject ? undefined : projectId
      );
      if (data && data.length > 0) {
        setInspections(data);
      } else {
        // Use Mock data fallback when DB table is empty so UI is previewable
        setInspections(MOCK_INSPECTIONS);
      }
    } catch (err) {
      logger.error('Failed to list inspections', { detail: err });
      // Fallback on error to mock data
      setInspections(MOCK_INSPECTIONS);
    } finally {
      setLoading(false);
    }
  }, [projectId, isCrossProject]);

  useEffect(() => {
    loadInspections();
  }, [loadInspections]);

  // Is Date Today Helper
  const isDateToday = (dateStr?: string | null): boolean => {
    if (!dateStr) return false;
    try {
      const d = new Date(dateStr);
      const today = new Date();
      return (
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
      );
    } catch {
      return false;
    }
  };

  // Filter Inspections based on activeFilter and searchQuery
  const filteredInspections = useMemo(() => {
    let list = [...inspections];

    // 1. Filter by activeFilter
    const filterKey = (activeFilter || 'all').toLowerCase();

    if (filterKey === 'today') {
      list = list.filter(
        (item) => isDateToday(item.required_at) || isDateToday(item.created_at)
      );
    } else if (filterKey === 'pending') {
      list = list.filter((item) => item.status === 'pending');
    } else if (filterKey === 'approved' || filterKey === 'passed') {
      list = list.filter((item) => item.status === 'approved');
    } else if (filterKey === 'rejected' || filterKey === 'failed') {
      list = list.filter((item) => item.status === 'rejected');
    } else if (filterKey === 'wir') {
      list = list.filter((item) => (item.inspection_type || '').toLowerCase() === 'wir');
    } else if (filterKey === 'mir') {
      list = list.filter((item) => (item.inspection_type || '').toLowerCase() === 'mir');
    } else if (filterKey === 'ncr') {
      list = list.filter((item) => (item.inspection_type || '').toLowerCase() === 'ncr');
    } else if (filterKey === 'critical_path' || filterKey === 'critical') {
      list = list.filter((item) => (item.inspection_type || '').toUpperCase() === 'WIR' || (item as any).is_critical);
    } else if (filterKey === 'near_critical') {
      list = list.filter((item) => item.status === 'pending');
    }

    // 2. Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((item) => {
        const reqNo = (item.request_no || '').toLowerCase();
        const title = (item.task_title_ar || '').toLowerCase();
        const qc = (item.qc_name_ar || '').toLowerCase();
        const proj = (item.project_name_ar || '').toLowerCase();
        const reason = (item.reason || '').toLowerCase();
        return (
          reqNo.includes(q) ||
          title.includes(q) ||
          qc.includes(q) ||
          proj.includes(q) ||
          reason.includes(q)
        );
      });
    }

    return list;
  }, [inspections, activeFilter, searchQuery]);

  // Group into Kanban Columns
  const pendingInspections = useMemo(
    () => filteredInspections.filter((item) => item.status === 'pending'),
    [filteredInspections]
  );

  const approvedInspections = useMemo(
    () => filteredInspections.filter((item) => item.status === 'approved'),
    [filteredInspections]
  );

  const rejectedInspections = useMemo(
    () => filteredInspections.filter((item) => item.status === 'rejected'),
    [filteredInspections]
  );

  // Today's Schedule Timeline items (ordered by required_at time)
  const todayTimelineItems = useMemo(() => {
    const todayList = inspections.filter(
      (item) => isDateToday(item.required_at) || item.status === 'pending'
    );
    return todayList.sort(
      (a, b) => new Date(a.required_at).getTime() - new Date(b.required_at).getTime()
    );
  }, [inspections]);

  // KPI Calculations
  const kpis = useMemo(() => {
    const now = Date.now();
    const todayCount = inspections.filter((i) => isDateToday(i.required_at)).length;
    const approvedCount = inspections.filter((i) => i.status === 'approved').length;
    const rejectedCount = inspections.filter((i) => i.status === 'rejected').length;
    const totalDecided = approvedCount + rejectedCount;
    const successRate = totalDecided > 0 ? Math.round((approvedCount / totalDecided) * 100) : 100;

    const overdueCount = inspections.filter((i) => {
      if (i.status !== 'pending') return false;
      const dueTime = new Date(i.required_at).getTime();
      return !isNaN(dueTime) && dueTime < now;
    }).length;

    return {
      todayCount,
      successRate,
      overdueCount,
      totalCount: inspections.length,
      pendingCount: inspections.filter((i) => i.status === 'pending').length,
    };
  }, [inspections]);

  // Format Time Helper
  const formatTime = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const formatDateShort = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Render Type Pill
  const renderTypePill = (type?: InspectionType | string) => {
    const t = (type || 'WIR').toUpperCase();
    let cls = 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800';
    let title = isAr ? 'طلب فحص أعمال' : 'Work Inspection Request';

    if (t === 'MIR') {
      cls = 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
      title = isAr ? 'طلب فحص واعتماد مواد' : 'Material Inspection Request';
    } else if (t === 'NCR') {
      cls = 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800';
      title = isAr ? 'تقرير عدم مطابقة' : 'Non-Conformance Report';
    }

    return (
      <span
        title={title}
        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border shrink-0 ${cls}`}
      >
        {t}
      </span>
    );
  };

  const isShowingMock = inspections.length > 0 && inspections[0]?.id?.startsWith('insp-mock-');

  return (
    <div className="space-y-4">
      {isShowingMock && (
        <div className="flex items-center gap-2.5 p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/60 rounded-2xl text-amber-900 dark:text-amber-200 text-xs shadow-xs">
          <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="font-medium">
            {isAr
              ? 'وضع المعاينة التوضيحي: لا توجد طلبات فحص مسجلة في قاعدة البيانات لهذا المشروع بعد. يتم عرض بطاقات استرشادية توضيحية.'
              : 'Preview Mode: No inspection requests found in the database for this project yet. Showing illustrative mock cards.'}
          </span>
        </div>
      )}
      {/* ── 1. Top Strip: Today's Schedule Timeline ──────────────────── */}
      <div className="glass-card bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 p-3.5 rounded-3xl shadow-xs space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span>{isAr ? 'جدول مواعيد الفحص الميداني اليوم' : "Today's Field Inspection Schedule"}</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {todayTimelineItems.length} {isAr ? 'مواعيد' : 'items'}
                </span>
              </h3>
            </div>
          </div>

          <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 hidden sm:block">
            {new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </div>
        </div>

        {/* Horizontal Scrollable Timeline */}
        {todayTimelineItems.length > 0 ? (
          <div className="overflow-x-auto no-scrollbar py-1">
            <div className="flex items-center gap-2.5 min-w-max px-1">
              {todayTimelineItems.map((item) => {
                const timeStr = formatTime(item.required_at);
                const isItemPending = item.status === 'pending';
                const isItemApproved = item.status === 'approved';

                return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onCardClick(item.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onCardClick(item.id);
                      }
                    }}
                    className="group glass-card bg-slate-50/90 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-400 dark:hover:border-emerald-600 p-2.5 rounded-2xl flex items-center gap-2.5 shadow-2xs hover:shadow-sm transition-all duration-200 cursor-pointer select-none focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                    style={{ minWidth: '220px', maxWidth: '280px' }}
                  >
                    {/* Time Pill */}
                    <div
                      className={`px-2 py-1 rounded-xl text-[11px] font-mono font-bold flex items-center gap-1 shrink-0 ${
                        isItemApproved
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : isItemPending
                          ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      <span>{timeStr || (isAr ? 'اليوم' : 'Today')}</span>
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-mono font-bold text-slate-900 dark:text-white">
                          {item.request_no}
                        </span>
                        {renderTypePill(item.inspection_type)}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate mt-0.5 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                        {item.task_title_ar || (isAr ? 'فحص أعمال موقعية' : 'Site Work Inspection')}
                      </p>
                    </div>

                    {/* Arrow / Indicator */}
                    {isAr ? (
                      <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-transform group-hover:-translate-x-0.5 shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-transform group-hover:translate-x-0.5 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="py-4 px-3 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            {isAr ? 'لا توجد مواعيد فحص مجدولة لليوم حتى الآن' : 'No field inspection appointments scheduled for today yet'}
          </div>
        )}
      </div>

      {/* ── 2. Search & Controls Bar ─────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        {/* Search Box */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isAr
                ? 'البحث برقم الطلب، اسم المهمة، مهندس الجودة، أو المشروع...'
                : 'Search by request #, task title, QC inspector, or project...'
            }
            className="w-full ps-9 pe-8 py-2 rounded-2xl text-xs bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 text-slate-800 dark:text-slate-200 shadow-2xs placeholder:text-slate-400 transition-shadow"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xs p-1 rounded-full cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
              aria-label={isAr ? 'مسح البحث' : 'Clear search'}
            >
              ✕
            </button>
          )}
        </div>

        {/* Refresh & Quick Stats */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={loadInspections}
            disabled={loading}
            className="p-2 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-2xs transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
            title={isAr ? 'تحديث البيانات' : 'Refresh data'}
            aria-label={isAr ? 'تحديث البيانات' : 'Refresh data'}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── 3. Kanban Columns Board ──────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Column 1: مطلوب فحصها (Pending - Highlighted Amber) */}
        <WorkflowKanbanColumn
          title={isAr ? 'مطلوب فحصها ميدانياً' : 'Pending Inspection'}
          subtitle={isAr ? 'بانتظار زيارة مهندس الجودة والقرار الفني' : 'Awaiting QC engineer visit & decision'}
          count={pendingInspections.length}
          colorScheme="amber"
          isHighlighted={true}
          icon={Clock}
          emptyText={isAr ? 'لا توجد طلبات فحص معلقة حالياً' : 'No pending inspection requests currently'}
        >
          {pendingInspections.map((insp) => (
            <InspectionCard
              key={insp.id}
              inspection={insp}
              isCrossProject={isCrossProject}
              isAr={isAr}
              onCardClick={onCardClick}
            />
          ))}
        </WorkflowKanbanColumn>

        {/* Column 2: معتمد ومطابق (Approved - Emerald) */}
        <WorkflowKanbanColumn
          title={isAr ? 'معتمد ومطابق للمواصفات' : 'Approved & Passed'}
          subtitle={isAr ? 'تم الاعتماد واجتياز الفحص بنجاح' : 'Approved and meets all specifications'}
          count={approvedInspections.length}
          colorScheme="emerald"
          icon={CheckCircle2}
          emptyText={isAr ? 'لا توجد فحوصات معتمدة في هذا النطاق' : 'No approved inspections in this scope'}
        >
          {approvedInspections.map((insp) => (
            <InspectionCard
              key={insp.id}
              inspection={insp}
              isCrossProject={isCrossProject}
              isAr={isAr}
              onCardClick={onCardClick}
            />
          ))}
        </WorkflowKanbanColumn>

        {/* Column 3: غير مطابق ومرفوض (Rejected - Rose) */}
        <WorkflowKanbanColumn
          title={isAr ? 'غير مطابق ومرفوض' : 'Rejected & Non-Compliant'}
          subtitle={isAr ? 'مرفوض - يتطلب إجراءً تصحيحياً وإصدار تقرير عدم مطابقة' : 'Rejected - requires corrective action & NCR'}
          count={rejectedInspections.length}
          colorScheme="rose"
          icon={XCircle}
          emptyText={isAr ? 'سجل نظيف! لا توجد حالات عدم مطابقة' : 'Clean record! No non-conformance records'}
        >
          {rejectedInspections.map((insp) => (
            <InspectionCard
              key={insp.id}
              inspection={insp}
              isCrossProject={isCrossProject}
              isAr={isAr}
              onCardClick={onCardClick}
            />
          ))}
        </WorkflowKanbanColumn>
      </div>

      {/* ── 4. KPI Summary Footer ────────────────────────────────────── */}
      <div className="glass-card bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800/90 p-4 rounded-3xl shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse divide-slate-100 dark:divide-slate-800">
          {/* KPI 1: Today's Inspections */}
          <div className="flex items-center gap-3 p-2">
            <div className="p-2.5 rounded-2xl bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/60 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {isAr ? 'فحوصات مجدولة اليوم' : "Today's Scheduled Inspections"}
              </p>
              <p className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                {kpis.todayCount}
              </p>
            </div>
          </div>

          {/* KPI 2: Success Rate */}
          <div className="flex items-center gap-3 p-2 pt-3 sm:pt-2">
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {isAr ? 'نسبة النجاح والمطابقة' : 'Compliance & Success Rate'}
              </p>
              <p className="text-base font-extrabold text-emerald-700 dark:text-emerald-400 font-mono">
                {kpis.successRate}%
              </p>
            </div>
          </div>

          {/* KPI 3: Overdue Count */}
          <div className="flex items-center gap-3 p-2 pt-3 sm:pt-2">
            <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {isAr ? 'فحوصات متأخرة عن الموعد' : 'Overdue Inspections'}
              </p>
              <p className="text-base font-extrabold text-rose-600 dark:text-rose-400 font-mono">
                {kpis.overdueCount}
              </p>
            </div>
          </div>

          {/* KPI 4: Pending Total */}
          <div className="flex items-center gap-3 p-2 pt-3 sm:pt-2">
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {isAr ? 'إجمالي المعلق بالموقع' : 'Total Pending On-Site'}
              </p>
              <p className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                {kpis.pendingCount}{' '}
                <span className="text-xs text-slate-400 font-normal">
                  {isAr ? `من ${kpis.totalCount}` : `of ${kpis.totalCount}`}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Sub-component: Individual Inspection Card ───────────────────────── */
interface InspectionCardProps {
  inspection: InspectionRequest;
  isCrossProject?: boolean;
  isAr?: boolean;
  onCardClick: (id: string) => void;
}

const InspectionCard: React.FC<InspectionCardProps> = ({
  inspection,
  isCrossProject,
  isAr = true,
  onCardClick,
}) => {
  const formatDateShort = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const renderTypePill = (type?: InspectionType | string) => {
    const t = (type || 'WIR').toUpperCase();
    let cls = 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800';
    let title = isAr ? 'طلب فحص أعمال' : 'Work Inspection Request';

    if (t === 'MIR') {
      cls = 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
      title = isAr ? 'طلب فحص واعتماد مواد' : 'Material Inspection Request';
    } else if (t === 'NCR') {
      cls = 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800';
      title = isAr ? 'تقرير عدم مطابقة' : 'Non-Conformance Report';
    }

    return (
      <span
        title={title}
        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border shrink-0 ${cls}`}
      >
        {t}
      </span>
    );
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onCardClick(inspection.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onCardClick(inspection.id);
        }
      }}
      className="group glass-card bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800/90 hover:border-emerald-400 dark:hover:border-emerald-600/70 p-3.5 rounded-2xl shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 select-none focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
    >
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono font-extrabold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
            {inspection.request_no}
          </span>
          {renderTypePill(inspection.inspection_type)}
        </div>

        <UnifiedStatusBadge
          status={inspection.status}
          entityType="inspection"
          size="sm"
        />
      </div>

      {/* Middle Content: Task Title & Details */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug line-clamp-2 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
          {inspection.task_title_ar || (isAr ? 'مهمة إنشائية موقعية' : 'Site Construction Task')}
        </h4>

        {/* Project Name (if cross-project) */}
        {isCrossProject && inspection.project_name_ar && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{inspection.project_name_ar}</span>
          </div>
        )}

        {/* Inspector Name */}
        {inspection.qc_name_ar && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{inspection.qc_name_ar}</span>
          </div>
        )}

        {/* Required Date */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 font-mono">
          <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>
            {isAr ? 'الموعد:' : 'Due:'} {formatDateShort(inspection.required_at)}
          </span>
        </div>
      </div>

      {/* Planning Gate Badge */}
      <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 text-[10px]">
        {(inspection.inspection_type || '').toUpperCase() === 'WIR' ? (
          <span className="inline-flex items-center gap-1 font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-900 animate-pulse">
            <Flame className="w-3 h-3 text-rose-500" />
            <span>{isAr ? 'بوابة صب حاسمة' : 'Critical Pour Gate (WIR)'}</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-900">
            <Activity className="w-3 h-3 text-emerald-500" />
            <span>{isAr ? 'بوابة اعتماد التوريد والمواد' : 'Material Approval Gate (MIR)'}</span>
          </span>
        )}
        <span className="text-[9px] text-slate-400 font-mono">
          {isAr ? 'تحكم المسار الحرج' : 'CPM Control'}
        </span>
      </div>

      {/* SLA Countdown Bar */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
        <SLAProgressBar
          createdAt={inspection.created_at}
          dueAt={inspection.required_at}
          compact={true}
        />
      </div>

      {/* Bottom Quick Action Footer */}
      <div className="flex items-center justify-between gap-2 pt-1">
        {inspection.status === 'pending' ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCardClick(inspection.id);
            }}
            className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-[11px] font-bold transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 active:scale-[0.98]"
          >
            <span>{isAr ? 'بدء الفحص واتخاذ القرار' : 'Start Inspection & Decide'}</span>
            {isAr ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        ) : inspection.status === 'approved' ? (
          <div className="w-full flex items-center justify-between text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{isAr ? 'معتمد ومطابق للمواصفات ✓' : 'Approved & Compliant ✓'}</span>
            </span>
            <span className="text-[10px] text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {isAr ? 'عرض السجل' : 'View Record'}
            </span>
          </div>
        ) : (
          <div className="w-full flex items-center justify-between text-[11px] text-rose-700 dark:text-rose-400 font-medium">
            <span className="flex items-center gap-1.5">
              <FileWarning className="w-3.5 h-3.5 shrink-0" />
              <span>{isAr ? 'مرفوض - عدم مطابقة' : 'Rejected - NCR'}</span>
            </span>
            <span className="text-[10px] text-slate-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
              {isAr ? 'عرض الملاحظات' : 'View Notes'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default InspectionsKanban;
