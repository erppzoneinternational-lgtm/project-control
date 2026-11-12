'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Inbox,
  Clock,
  ShieldAlert,
  ArrowUpRight,
  Send,
  CheckCircle2,
  Search,
  RefreshCw,
  Plus,
  User,
  Layers,
  FileCode,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Eye,
  SlidersHorizontal,
  ChevronRight,
  Tag,
  CheckCircle,
  XCircle,
  FileText,
  Flame,
  Activity,
} from 'lucide-react';
import { Deliverable, DeliverableItem, DeliverableStatus, ConsultantApprovalCode } from '@/types/planning';
import { DeliverablesService } from '@/lib/services/deliverables.service';
import { WorkflowKanbanColumn } from '@/components/workflow/WorkflowKanbanColumn';
import { UnifiedStatusBadge } from '@/components/workflow/UnifiedStatusBadge';
import { SLAProgressBar } from '@/components/workflow/SLAProgressBar';
import { useLanguage } from '@/contexts/LanguageContext';
import { logger } from '@/lib/logger';

export interface DeliverablesKanbanProps {
  projectId: string;
  userRoles: string[];
  myStakeholderId?: string | null;
  activeFilter: string;
  onCardClick: (deliverableId: string) => void;
}

export const DeliverablesKanban: React.FC<DeliverablesKanbanProps> = ({
  projectId,
  userRoles = [],
  myStakeholderId,
  activeFilter = 'all',
  onCardClick,
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKind, setSelectedKind] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  // Role detection
  const isToManagerOrAdmin = useMemo(() => {
    const normalized = (userRoles || []).map((r) => r.toLowerCase().trim());
    return normalized.some((r) =>
      ['to_manager', 'admin', 'system_admin', 'project_manager', 'ceo', 'coo', 'commercial_manager'].includes(r)
    );
  }, [userRoles]);

  const isToEngineer = useMemo(() => {
    const normalized = (userRoles || []).map((r) => r.toLowerCase().trim());
    return normalized.some((r) =>
      ['technical_office', 'to_engineer', 'planning_engineer'].includes(r)
    );
  }, [userRoles]);

  // Fetch deliverables from service
  const fetchDeliverables = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const data = await DeliverablesService.getDeliverables(projectId);
      setDeliverables(data || []);
    } catch (err) {
      logger.error('DeliverablesKanban fetch error:', { detail: err });
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchDeliverables();
  }, [fetchDeliverables]);

  // Filter deliverables according to activeFilter, search query, kind, and priority
  const filteredDeliverables = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);

    return deliverables.filter((deliv) => {
      // 1. Parent activeFilter
      if (activeFilter && activeFilter !== 'all') {
        const normFilter = activeFilter.toLowerCase().trim();

        if (normFilter === 'my_tasks' || normFilter === 'my_deliverables') {
          if (myStakeholderId) {
            const isHolder = deliv.current_holder_stakeholder_id === myStakeholderId;
            const hasAssignedItem = (deliv.items || []).some(
              (it) => it.assigned_stakeholder_id === myStakeholderId
            );
            if (!isHolder && !hasAssignedItem) return false;
          }
        } else if (normFilter === 'e1') {
          if (deliv.kind !== 'E1') return false;
        } else if (normFilter === 'e2') {
          if (deliv.kind !== 'E2') return false;
        } else if (normFilter === 'high_priority' || normFilter === 'high' || normFilter === 'urgent') {
          if (deliv.priority !== 'high') return false;
        } else if (normFilter === 'blocked') {
          if (deliv.status !== 'blocked') return false;
        } else if (normFilter === 'ready_to_return') {
          if (deliv.status !== 'ready_to_return') return false;
        } else if (normFilter === 'returned') {
          if (deliv.status !== 'returned') return false;
        } else if (normFilter === 'overdue' || normFilter === 'delayed') {
          const isOverdue =
            deliv.due_date &&
            deliv.due_date < today &&
            deliv.status !== 'returned' &&
            (deliv.status as string) !== 'approved';
          if (!isOverdue) return false;
        } else if (normFilter === 'code_c') {
          const hasCodeC = (deliv.items || []).some((it) => it.consultant_status === 'C');
          if (!hasCodeC) return false;
        } else if (normFilter === 'critical_path' || normFilter === 'critical') {
          const float = (deliv as any).total_float ?? (deliv.priority === 'high' || deliv.status === 'blocked' ? 0 : 7);
          if (float !== 0 && !(deliv as any).is_critical) return false;
        } else if (normFilter === 'near_critical') {
          const float = (deliv as any).total_float ?? (deliv.priority === 'high' || deliv.status === 'blocked' ? 0 : 7);
          if (float > 14) return false;
        }
      }

      // 2. Kind Filter
      if (selectedKind !== 'all' && deliv.kind !== selectedKind) {
        return false;
      }

      // 3. Priority Filter
      if (selectedPriority !== 'all' && deliv.priority !== selectedPriority) {
        return false;
      }

      // 4. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchRef = deliv.ref_code.toLowerCase().includes(q);
        const matchTitle = (deliv.title_ar || '').toLowerCase().includes(q);
        const matchHolder = (deliv.current_holder?.name_ar || '').toLowerCase().includes(q);
        const matchItems = (deliv.items || []).some(
          (it) =>
            (it.sheet_number || '').toLowerCase().includes(q) ||
            (it.description || '').toLowerCase().includes(q)
        );

        if (!matchRef && !matchTitle && !matchHolder && !matchItems) {
          return false;
        }
      }

      return true;
    });
  }, [deliverables, activeFilter, myStakeholderId, selectedKind, selectedPriority, searchQuery]);

  // Group deliverables into the 6 Kanban columns
  const groupedDeliverables = useMemo(() => {
    const map = {
      received: [] as Deliverable[],
      in_progress: [] as Deliverable[],
      blocked: [] as Deliverable[],
      ready_to_return: [] as Deliverable[],
      returned: [] as Deliverable[],
      approved: [] as Deliverable[],
    };

    for (const d of filteredDeliverables) {
      // Check if all items approved by consultant
      const hasItems = d.items && d.items.length > 0;
      const allApproved =
        hasItems &&
        d.items!.every(
          (it) => it.consultant_status === 'A' || it.consultant_status === 'B'
        );

      if ((d.status as string) === 'approved' || allApproved) {
        map.approved.push(d);
      } else if (d.status === 'blocked') {
        map.blocked.push(d);
      } else if (d.status === 'ready_to_return') {
        map.ready_to_return.push(d);
      } else if (d.status === 'returned') {
        map.returned.push(d);
      } else if (d.status === 'in_progress') {
        map.in_progress.push(d);
      } else {
        // 'received', 'pending', or default
        map.received.push(d);
      }
    }

    return map;
  }, [filteredDeliverables]);

  // Helper to calculate age in days
  const getAgeInDays = (receivedAt?: string) => {
    if (!receivedAt) return 0;
    const rec = new Date(receivedAt).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((now - rec) / (1000 * 60 * 60 * 24)));
  };

  // Helper to calculate average item progress
  const getDeliverableProgress = (items?: DeliverableItem[]) => {
    if (!items || items.length === 0) return 0;
    const sum = items.reduce((acc, it) => acc + (it.progress_pct || 0), 0);
    return Math.round(sum / items.length);
  };

  // Helper to get consultant code badge summary
  const getConsultantCodeSummary = (items?: DeliverableItem[]) => {
    if (!items || items.length === 0) return null;
    const counts: Record<string, number> = {};
    for (const it of items) {
      if (it.consultant_status && it.consultant_status !== 'pending') {
        counts[it.consultant_status] = (counts[it.consultant_status] || 0) + 1;
      }
    }

    if (Object.keys(counts).length === 0) return null;

    return (
      <div className="flex items-center flex-wrap gap-1">
        {counts['A'] && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            {counts['A']} {isAr ? 'كود أ' : 'Code A'}
          </span>
        )}
        {counts['B'] && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            {counts['B']} {isAr ? 'كود ب' : 'Code B'}
          </span>
        )}
        {counts['C'] && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            {counts['C']} {isAr ? 'كود ج' : 'Code C'}
          </span>
        )}
        {counts['D'] && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
            {counts['D']} {isAr ? 'كود د' : 'Code D'}
          </span>
        )}
      </div>
    );
  };

  // Render a single Deliverable card inside a column
  const renderDeliverableCard = (deliv: Deliverable) => {
    const ageDays = getAgeInDays(deliv.received_at);
    const progress = getDeliverableProgress(deliv.items);
    const codeSummary = getConsultantCodeSummary(deliv.items);
    const itemCount = deliv.items?.length || 0;

    return (
      <div
        key={deliv.id}
        role="button"
        tabIndex={0}
        onClick={() => onCardClick(deliv.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onCardClick(deliv.id);
          }
        }}
        className="glass-card group bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 rounded-2xl p-3.5 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer space-y-2.5 relative focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 select-none hover:-translate-y-0.5 active:translate-y-0"
      >
        {/* Top Badges Row */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700">
              {deliv.ref_code}
            </span>

            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-sky-50 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
              {deliv.kind || 'E1'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {deliv.priority === 'high' && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900 shrink-0">
                {isAr ? 'عاجل' : 'High'}
              </span>
            )}
            <div className="opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
              <Eye className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
          {(!deliv.title_ar || deliv.title_ar.includes('???')) && deliv.title_en
            ? deliv.title_en
            : deliv.title_ar || deliv.title_en || deliv.ref_code}
        </h4>

        {/* Blocker reason if blocked */}
        {deliv.status === 'blocked' && deliv.blocked_reason && (
          <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-[11px] space-y-0.5">
            <div className="flex items-center gap-1 font-bold">
              <ShieldAlert className="w-3 h-3 text-rose-600 shrink-0" />
              <span>{isAr ? 'سبب التعطيل:' : 'Blocker:'}</span>
            </div>
            <p className="line-clamp-2 text-[10px] leading-relaxed">
              {deliv.blocked_reason}
            </p>
          </div>
        )}

        {/* Progress & Items Count */}
        <div className="space-y-1 bg-slate-50/70 dark:bg-slate-800/40 p-2 rounded-xl border border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            <span className="flex items-center gap-1">
              <FileCode className="w-3 h-3" />
              <span>{isAr ? `${itemCount} مخططات / بنود` : `${itemCount} items`}</span>
            </span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
              {progress}%
            </span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Consultant Code Badges if present */}
        {codeSummary && (
          <div className="pt-0.5">
            {codeSummary}
          </div>
        )}

        {/* Compact SLA Bar */}
        <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
          <SLAProgressBar
            compact
            createdAt={deliv.received_at}
            dueAt={deliv.due_date}
            targetHours={deliv.kind === 'E1' ? 48 : 72}
          />
        </div>

        {/* Planning Float & Downstream Site Impact Badge */}
        {(() => {
          const totalFloat = (deliv as any).total_float ?? (deliv.priority === 'high' || deliv.status === 'blocked' ? 0 : 7);
          const isCrit = totalFloat === 0 || (deliv as any).is_critical === true;
          const isNearCrit = !isCrit && totalFloat <= 14;

          return (
            <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[10px]">
              <div className="flex items-center gap-1 font-mono">
                {isCrit ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800 font-bold animate-pulse">
                    <Flame className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                    <span>{isAr ? 'مسار حرج | سماحية: 0 يوم' : 'Critical | TF: 0d'}</span>
                  </span>
                ) : isNearCrit ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold">
                    <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span>{isAr ? `سماحية: ${totalFloat} يوم` : `TF: ${totalFloat}d`}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium">
                    <Activity className="w-3 h-3 text-slate-400" />
                    <span>{isAr ? `سماحية: ${totalFloat} يوم` : `TF: ${totalFloat}d`}</span>
                  </span>
                )}
              </div>
              {isCrit && (
                <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400 truncate max-w-[120px]">
                  {isAr ? 'يعطل أعمال الموقع' : 'Blocks Site Activity'}
                </span>
              )}
            </div>
          );
        })()}

        {/* Holder & Age Footer */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1">
          <div className="flex items-center gap-1 truncate max-w-[130px]">
            <User className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">
              {deliv.current_holder?.name_ar || (isAr ? 'المكتب الفني' : 'Tech Office')}
            </span>
          </div>

          <div className="flex items-center gap-1 font-mono shrink-0">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{isAr ? `${ageDays} يوم` : `${ageDays}d`}</span>
          </div>
        </div>

        {/* Highlight Banner if Ready to Return for TO Manager */}
        {deliv.status === 'ready_to_return' && isToManagerOrAdmin && (
          <div className="mt-1 p-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 text-[10px] font-bold text-center border border-amber-300 dark:border-amber-800 flex items-center justify-center gap-1 animate-pulse">
            <ArrowUpRight className="w-3 h-3" />
            <span>{isAr ? 'بانتظار اعتمادك النهائي' : 'Action Required: Review'}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="glass-card bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder={
              isAr
                ? 'بحث برقم المعاملة، العنوان، رقم اللوحة، أو المهندس المسند إليه...'
                : 'Search by Ref code (E1-014), title, sheet no, or engineer...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full ps-9 pe-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-transparent transition-all"
          />
        </div>

        {/* Slicers: Kind & Priority */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedKind}
            onChange={(e) => setSelectedKind(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors"
          >
            <option value="all">{isAr ? 'كل الأنواع' : 'All Kinds'}</option>
            <option value="E1">{isAr ? 'حزم المخططات التنفيذية' : 'E1 Packages'}</option>
            <option value="E2">{isAr ? 'حزم اعتماد المواد' : 'E2 Packages'}</option>
            <option value="drawing_list">{isAr ? 'قوائم المخططات' : 'Drawings'}</option>
            <option value="material_list">{isAr ? 'قوائم المواد' : 'Materials'}</option>
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors"
          >
            <option value="all">{isAr ? 'كل الأولويات' : 'All Priorities'}</option>
            <option value="high">{isAr ? 'أولوية قصوى' : 'High Priority'}</option>
            <option value="normal">{isAr ? 'أولوية اعتيادية' : 'Normal Priority'}</option>
            <option value="low">{isAr ? 'أولوية منخفضة' : 'Low Priority'}</option>
          </select>

          <button
            type="button"
            onClick={fetchDeliverables}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title={isAr ? 'تحديث لوحة الكانبان' : 'Refresh Kanban'}
            aria-label={isAr ? 'تحديث لوحة الكانبان' : 'Refresh Kanban'}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 6-Column Kanban Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 items-start">
        {/* 1. مستلمة (Received) */}
        <WorkflowKanbanColumn
          title={isAr ? 'مستلمة' : 'Received'}
          subtitle={isAr ? 'واردة من المكتب الفني' : 'From Tech Office'}
          count={groupedDeliverables.received.length}
          colorScheme="slate"
          icon={Inbox}
          emptyText={isAr ? 'لا توجد تسليمات جديدة مستلمة' : 'No received deliverables'}
        >
          {groupedDeliverables.received.map(renderDeliverableCard)}
        </WorkflowKanbanColumn>

        {/* 2. قيد التنفيذ (In Progress) */}
        <WorkflowKanbanColumn
          title={isAr ? 'قيد التنفيذ' : 'In Progress'}
          subtitle={isAr ? 'إعداد ودراسة المخططات التنفيذية' : 'Shop Drawing Prep'}
          count={groupedDeliverables.in_progress.length}
          colorScheme="blue"
          icon={Clock}
          emptyText={isAr ? 'لا توجد تسليمات قيد العمل' : 'No items in progress'}
        >
          {groupedDeliverables.in_progress.map(renderDeliverableCard)}
        </WorkflowKanbanColumn>

        {/* 3. متعطلة (Blocked) */}
        <WorkflowKanbanColumn
          title={isAr ? 'متعطلة' : 'Blocked'}
          subtitle={isAr ? 'يوجد عائق فني أو طلب استيضاح معلق' : 'Active Technical Hold'}
          count={groupedDeliverables.blocked.length}
          colorScheme="rose"
          icon={ShieldAlert}
          emptyText={isAr ? 'لا توجد تسليمات متعطلة' : 'No blocked deliverables'}
        >
          {groupedDeliverables.blocked.map(renderDeliverableCard)}
        </WorkflowKanbanColumn>

        {/* 4. جاهزة للإعادة (Ready to Return) - Highlighted for TO Manager */}
        <WorkflowKanbanColumn
          title={isAr ? 'جاهزة للإعادة' : 'Ready to Return'}
          subtitle={isAr ? 'بانتظار اعتماد مدير المكتب الفني' : 'TO Manager Sign-off'}
          count={groupedDeliverables.ready_to_return.length}
          colorScheme="amber"
          icon={ArrowUpRight}
          isHighlighted={isToManagerOrAdmin}
          emptyText={isAr ? 'لا توجد تسليمات جاهزة للإعادة' : 'No deliverables ready to return'}
        >
          {groupedDeliverables.ready_to_return.map(renderDeliverableCard)}
        </WorkflowKanbanColumn>

        {/* 5. مُعادة (Returned) */}
        <WorkflowKanbanColumn
          title={isAr ? 'مُعادة ومسلمة' : 'Returned'}
          subtitle={isAr ? 'مسلمة للاستشاري' : 'Sent to Consultant'}
          count={groupedDeliverables.returned.length}
          colorScheme="emerald"
          icon={Send}
          emptyText={isAr ? 'لا توجد تسليمات مُعادة' : 'No returned deliverables'}
        >
          {groupedDeliverables.returned.map(renderDeliverableCard)}
        </WorkflowKanbanColumn>

        {/* 6. معتمدة من الاستشاري (Approved) */}
        <WorkflowKanbanColumn
          title={isAr ? 'معتمدة من الاستشاري' : 'Approved'}
          subtitle={isAr ? 'اعتماد رسمي كود أ / ب' : 'Official Code A / B'}
          count={groupedDeliverables.approved.length}
          colorScheme="emerald"
          icon={CheckCircle2}
          emptyText={isAr ? 'لا توجد تسليمات معتمدة' : 'No approved deliverables'}
        >
          {groupedDeliverables.approved.map(renderDeliverableCard)}
        </WorkflowKanbanColumn>
      </div>
    </div>
  );
};

export default DeliverablesKanban;
