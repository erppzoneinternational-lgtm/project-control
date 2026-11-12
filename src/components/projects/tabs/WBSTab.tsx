'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Project, WBSItem } from '@/types';
import { ProjectActivity, WBSEvmSummary, WBSTabDashboardData } from '@/types/planning';
import { WBSService } from '@/lib/services/wbs.service';
import { useCleanupEffect } from '@/lib/utils/useCleanupEffect';
import { logger } from '@/lib/logger';
import { useUserRoles } from '@/lib/hooks/useUserRoles';
import { useModuleAccess } from '@/lib/hooks/useModuleAccess';
import { canEditPath } from '@/lib/rbac/access-control';
import { canViewPrices, PriceGate } from '@/components/planning/PriceGate';
import {
  Layers,
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronLeft,
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Calendar,
  FileSpreadsheet,
  Search,
  Target,
  Lock,
  RefreshCw,
  FolderTree,
  DollarSign,
  ArrowDownRight,
  ShieldCheck,
  CheckSquare,
  Square,
  ArrowRightLeft,
  X,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

/* ── Status Configuration ── */
function getStatusConfig(status: string, isAr: boolean = true) {
  const configs: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    not_started: {
      label: isAr ? 'لم تبدأ بعد' : 'Not Started',
      cls: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
      icon: <Clock className="w-3 h-3" />,
    },
    in_progress: {
      label: isAr ? 'جاري التنفيذ' : 'In Progress',
      cls: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
      icon: <Activity className="w-3 h-3" />,
    },
    completed: {
      label: isAr ? 'مكتمل' : 'Completed',
      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    delayed: {
      label: isAr ? 'متأخر' : 'Delayed',
      cls: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
      icon: <AlertTriangle className="w-3 h-3" />,
    },
  };
  return configs[status] || configs.not_started;
}

/* ── Progress Bar Color ── */
function progressColor(pct: number): string {
  if (pct >= 80) return 'bg-emerald-500';
  if (pct >= 50) return 'bg-amber-500';
  if (pct > 0) return 'bg-sky-500';
  return 'bg-slate-300 dark:bg-slate-700';
}

/* ── Currency Formatter ── */
function fmtCurrency(val: number, isAr: boolean = true): string {
  if (isAr) {
    return (
      new Intl.NumberFormat('ar-EG', {
        maximumFractionDigits: 0,
      }).format(val || 0) + ' ج.م'
    );
  }
  return (
    new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(val || 0) + ' EGP'
  );
}

/* ── Date Formatter ── */
function fmtDate(d?: string | null, isAr: boolean = true): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return d;
  }
}

/* ═══════════════════════════════════════════ */
/*           ACTIVITY ROW COMPONENT           */
/* ═══════════════════════════════════════════ */
interface ActivityRowProps {
  act: ProjectActivity;
  onReassign?: (act: ProjectActivity) => void;
  isAr?: boolean;
}

const ActivityRow: React.FC<ActivityRowProps> = React.memo(({ act, onReassign, isAr = true }) => {
  const pct = Math.round(act.percent_complete || 0);
  const sts = getStatusConfig(act.status, isAr);

  return (
    <div className="group flex flex-col gap-2 p-3 rounded-xl bg-slate-50/90 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-150 shadow-xs">
      {/* Top row: code + name + status */}
      <div className="flex items-center gap-2 flex-wrap justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {act.activity_code && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200/80 dark:bg-slate-700 text-slate-800 dark:text-slate-200 shrink-0 border border-slate-300/40 dark:border-slate-600/40">
              {act.activity_code}
            </span>
          )}
          <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[280px] sm:max-w-md">
            {isAr ? (act.name_ar || act.name_en || 'نشاط') : (act.name_en || act.name_ar || 'Activity')}
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border whitespace-nowrap ${sts.cls}`}
          >
            {sts.icon}
            {sts.label}
          </span>
          {act.is_critical && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-600 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800">
              {isAr ? 'نشاط حرج' : 'Critical'}
            </span>
          )}
          {act.is_milestone && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-600 border border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800">
              <Target className="w-2.5 h-2.5 inline-block me-0.5" />
              {isAr ? 'محطة رئيسية' : 'Milestone'}
            </span>
          )}
          {act.boq_links && act.boq_links.length > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              <FileSpreadsheet className="w-2.5 h-2.5" />
              {isAr ? 'بند المقايسة:' : 'BOQ Item:'} {act.boq_links.map((l) => l.boq_item?.item_code || (isAr ? 'بند' : 'BOQ')).join(', ')}
            </span>
          )}
        </div>

        {onReassign && (
          <button
            type="button"
            onClick={() => onReassign(act)}
            className="text-[10px] text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded px-1.5 py-0.5"
            title={isAr ? 'إعادة تعيين حزمة العمل' : 'Reassign Work Package'}
          >
            <ArrowRightLeft className="w-3 h-3" />
            <span>{isAr ? 'نقل' : 'Transfer'}</span>
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progressColor(pct)}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        <span
          className={`text-[11px] font-black tabular-nums min-w-[36px] text-end ${
            pct >= 80
              ? 'text-emerald-600 dark:text-emerald-400'
              : pct >= 50
              ? 'text-amber-600 dark:text-amber-400'
              : pct > 0
              ? 'text-sky-600 dark:text-sky-400'
              : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          {pct}%
        </span>
      </div>

      {/* Meta row: dates + budget + duration */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-slate-400" />
          {isAr ? 'مخطط:' : 'Planned:'} {fmtDate(act.planned_start, isAr)} → {fmtDate(act.planned_finish, isAr)}
        </span>
        {act.actual_start && (
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            {isAr ? 'فعلي:' : 'Actual:'} {fmtDate(act.actual_start, isAr)}{' '}
            {act.actual_finish ? `→ ${fmtDate(act.actual_finish, isAr)}` : (isAr ? '(مستمر)' : '(Ongoing)')}
          </span>
        )}
        <span>{act.duration_days} {isAr ? 'يوم' : 'days'}</span>
        {act.budgeted_cost_egp > 0 && (
          <PriceGate>
            <span className="font-semibold text-slate-600 dark:text-slate-300">
              {isAr ? 'الميزانية التقديرية:' : 'Budget:'} {fmtCurrency(act.budgeted_cost_egp, isAr)}
            </span>
          </PriceGate>
        )}
      </div>
    </div>
  );
});
ActivityRow.displayName = 'ActivityRow';

/* ═══════════════════════════════════════════ */
/*         WBS TREE NODE COMPONENT             */
/* ═══════════════════════════════════════════ */
interface WBSTreeNodeProps {
  item: WBSItem;
  expandedMap: Record<string, boolean>;
  onToggleExpand: (id: string) => void;
  onAddSubItem: (parentItem: WBSItem) => void;
  onEditItem: (item: WBSItem) => void;
  onDeleteItem: (item: WBSItem) => void;
  onReassignActivity: (act: ProjectActivity) => void;
  filterText: string;
  statusFilter: string;
  isAr?: boolean;
  canEdit?: boolean;
}

const WBSTreeNode: React.FC<WBSTreeNodeProps> = React.memo(
  ({
    item,
    expandedMap,
    onToggleExpand,
    onAddSubItem,
    onEditItem,
    onDeleteItem,
    onReassignActivity,
    filterText,
    statusFilter,
    isAr = true,
    canEdit = false,
  }) => {
    const isExpanded = expandedMap[item.id] ?? true;
    const level = item.level || 1;
    const children = item.children || [];
    const directActivities: ProjectActivity[] = item.activities || [];
    const nodeMatches = useMemo(() => {
      if (!filterText) return true;
      const q = filterText.toLowerCase();
      return (
        (item.wbs_code || '').toLowerCase().includes(q) ||
        (item.title_ar || '').toLowerCase().includes(q) ||
        (item.title_en || '').toLowerCase().includes(q)
      );
    }, [item.wbs_code, item.title_ar, item.title_en, filterText]);

    // Filter activities
    const filteredActivities = useMemo(() => {
      return directActivities.filter((act) => {
        if (statusFilter !== 'all' && act.status !== statusFilter) return false;
        if (filterText) {
          if (nodeMatches) return true;
          const q = filterText.toLowerCase();
          const matchCode = (act.activity_code || '').toLowerCase().includes(q);
          const matchName = (act.name_ar || '').toLowerCase().includes(q) || (act.name_en || '').toLowerCase().includes(q);
          return matchCode || matchName;
        }
        return true;
      });
    }, [directActivities, statusFilter, filterText, nodeMatches]);

    const hasMatchingDescendants = useMemo(() => {
      if (!filterText && statusFilter === 'all') return true;
      if (nodeMatches && statusFilter === 'all') return true;
      if (filteredActivities.length > 0) return true;

      const checkChildren = (nodes: WBSItem[]): boolean => {
        return nodes.some((c) => {
          const q = filterText.toLowerCase();
          const matches =
            !filterText ||
            (c.wbs_code || '').toLowerCase().includes(q) ||
            (c.title_ar || '').toLowerCase().includes(q) ||
            (c.title_en || '').toLowerCase().includes(q);
          const acts = (c.activities || []).filter((a) => {
            if (statusFilter !== 'all' && a.status !== statusFilter) return false;
            if (filterText) {
              return (
                (a.activity_code || '').toLowerCase().includes(q) ||
                (a.name_ar || '').toLowerCase().includes(q) ||
                (a.name_en || '').toLowerCase().includes(q)
              );
            }
            return true;
          });
          if (matches || acts.length > 0) return true;
          return c.children && c.children.length > 0 ? checkChildren(c.children) : false;
        });
      };

      return checkChildren(children);
    }, [filterText, statusFilter, nodeMatches, filteredActivities.length, children]);

    const progress = Math.round(item.progress_pct || 0);

    if (!hasMatchingDescendants) return null;

    return (
      <div className="space-y-2">
        {/* Node Card Header */}
        <div
          className={`rounded-xl border transition-all duration-150 ${
            level === 1
              ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm border-s-4 border-s-amber-500 hover:border-slate-300 dark:hover:border-slate-700'
              : level === 2
              ? 'bg-slate-50/90 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800/80 ms-3 sm:ms-6 border-s-4 border-s-sky-500 hover:border-slate-300 dark:hover:border-slate-700'
              : 'bg-slate-100/60 dark:bg-slate-950/40 border-slate-200/60 dark:border-slate-800 ms-6 sm:ms-12 border-s-4 border-s-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Left/Main info */}
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <button
                type="button"
                onClick={() => onToggleExpand(item.id)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                title={isExpanded ? (isAr ? 'طي الحزمة' : 'Collapse') : (isAr ? 'توسيع الحزمة' : 'Expand')}
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isExpanded ? 'rotate-0' : '-rotate-90'
                  }`}
                />
              </button>

              {item.wbs_code && (
                <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-black bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 shrink-0 shadow-xs">
                  #{item.wbs_code}
                </span>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                    {isAr ? item.title_ar || item.title_en : item.title_en || item.title_ar}
                  </h4>
                  {isAr ? (
                    item.title_en && (
                      <span className="text-[10px] text-slate-400 hidden md:inline truncate font-normal">
                        ({item.title_en})
                      </span>
                    )
                  ) : (
                    item.title_ar && (
                      <span className="text-[10px] text-slate-400 hidden md:inline truncate font-normal">
                        ({item.title_ar})
                      </span>
                    )
                  )}
                </div>
                <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-0.5">
                  <span className="flex items-center gap-1 font-medium">
                    <FolderTree className="w-3 h-3 text-slate-400" />
                    {isAr ? `المستوى ${level}` : `Level ${level}`}
                  </span>
                  <span>•</span>
                  <span className="font-medium">
                    {item.activity_count || 0} {isAr ? 'نشاط' : 'activities'}
                  </span>
                  {children.length > 0 && (
                    <>
                      <span>•</span>
                      <span className="font-medium">
                        {children.length} {isAr ? 'حزم فرعية' : 'sub-packages'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right/Progress & EVM Info */}
            <div className="flex items-center gap-3 justify-between sm:justify-end shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
              {(item.budgeted_cost ?? 0) > 0 && (
                <PriceGate>
                  <div className="text-end hidden lg:block">
                    <span className="text-[9px] text-slate-400 block font-medium">
                      {isAr ? 'الميزانية المعتمدة' : 'Budget (BAC)'}
                    </span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {fmtCurrency(item.budgeted_cost || 0, isAr)}
                    </span>
                  </div>
                </PriceGate>
              )}

              {/* Progress Bar & Badge */}
              <div className="flex items-center gap-2">
                <div className="w-20 sm:w-28 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${progressColor(
                      progress
                    )}`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <span
                  className={`text-xs font-black tabular-nums min-w-[36px] text-end ${
                    progress >= 80
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : progress >= 50
                      ? 'text-amber-600 dark:text-amber-400'
                      : progress > 0
                      ? 'text-sky-600 dark:text-sky-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {progress}%
                </span>
              </div>

              {/* Action buttons */}
              {canEdit && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onAddSubItem(item)}
                    className="p-1.5 rounded-lg text-slate-400 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/30 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    title={isAr ? 'إضافة حزمة فرعية' : 'Add Sub-package'}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEditItem(item)}
                    className="p-1.5 rounded-lg text-slate-400 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:bg-sky-950/40 dark:hover:bg-sky-950/30 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                    title={isAr ? 'تعديل حزمة العمل' : 'Edit Package'}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteItem(item)}
                    className="p-1.5 rounded-lg text-slate-400 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:bg-rose-950/40 dark:hover:bg-rose-950/30 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                    title={isAr ? 'حذف حزمة العمل' : 'Delete Package'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Direct activities under this package */}
          {isExpanded && filteredActivities.length > 0 && (
            <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-1 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
              <div className="text-[10px] font-bold text-slate-400 flex items-center justify-between">
                <span>
                  {isAr ? `الأنشطة المندرجة (${filteredActivities.length})` : `Included Activities (${filteredActivities.length})`}
                </span>
              </div>
              <div className="space-y-2">
                {filteredActivities.map((act) => (
                  <ActivityRow
                    key={act.id}
                    act={act}
                    onReassign={canEdit ? onReassignActivity : undefined}
                    isAr={isAr}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Nested Child Nodes */}
        {isExpanded && children.length > 0 && (
          <div className="space-y-2">
            {children.map((child) => (
              <WBSTreeNode
                key={child.id}
                item={child}
                expandedMap={expandedMap}
                onToggleExpand={onToggleExpand}
                onAddSubItem={onAddSubItem}
                onEditItem={onEditItem}
                onDeleteItem={onDeleteItem}
                onReassignActivity={onReassignActivity}
                filterText={filterText}
                statusFilter={statusFilter}
                isAr={isAr}
                canEdit={canEdit}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
);
WBSTreeNode.displayName = 'WBSTreeNode';

/* ═══════════════════════════════════════════ */
/*              MAIN WBSTAB COMPONENT         */
/* ═══════════════════════════════════════════ */
export interface WBSTabProps {
  project: Project;
  isAr?: boolean;
}

export const WBSTab: React.FC<WBSTabProps> = React.memo(({ project, isAr = true }) => {
  const { roles, isAdmin } = useUserRoles();
  const { data: dbAccessRules } = useModuleAccess();
  const allowFinancials = canViewPrices(roles, isAdmin);
  const isViewerOnly = roles.length > 0 && roles.every((r) => r.toLowerCase() === 'viewer') && !isAdmin;
  const canEdit =
    !isViewerOnly &&
    (canEditPath('/projects', roles, isAdmin, dbAccessRules) ||
      canEditPath('/planning/activities', roles, isAdmin, dbAccessRules));

  const [treeData, setTreeData] = useState<WBSItem[]>([]);
  const [flatItems, setFlatItems] = useState<WBSItem[]>([]);
  const [unassignedActivities, setUnassignedActivities] = useState<ProjectActivity[]>([]);
  const [evmDashboard, setEvmDashboard] = useState<WBSTabDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

  // Modals
  const [showItemModal, setShowItemModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<WBSItem | null>(null);
  const [parentItemForSub, setParentItemForSub] = useState<WBSItem | null>(null);

  // Item form fields
  const [formWbsCode, setFormWbsCode] = useState('');
  const [formTitleAr, setFormTitleAr] = useState('');
  const [formTitleEn, setFormTitleEn] = useState('');
  const [formParentId, setFormParentId] = useState<string>('');
  const [formBudgetedCost, setFormBudgetedCost] = useState<number>(0);
  const [formWeight, setFormWeight] = useState<number>(0);
  const [modalSaving, setModalSaving] = useState(false);

  // Activity assignment modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedActivityToReassign, setSelectedActivityToReassign] = useState<ProjectActivity | null>(null);
  const [selectedUnassignedIds, setSelectedUnassignedIds] = useState<string[]>([]);
  const [targetWbsId, setTargetWbsId] = useState<string>('');
  const [assigning, setAssigning] = useState(false);

  /* ── Load Data ── */
  const loadData = useCallback(
    async (isCancelled?: () => boolean) => {
      setLoading(true);
      try {
        const [tree, flat, unassigned, evmData] = await Promise.all([
          WBSService.getWBSTree(project.id),
          WBSService.getWBSItems(project.id),
          WBSService.getUnassignedActivities(project.id),
          WBSService.getWBSEvmSummary(project.id),
        ]);

        if (!isCancelled || !isCancelled()) {
          setTreeData(tree);
          setFlatItems(flat);
          setUnassignedActivities(unassigned);
          setEvmDashboard(evmData.dashboard);

          // Default expand level 1 and 2
          const initExpanded: Record<string, boolean> = {};
          flat.forEach((w) => {
            initExpanded[w.id] = (w.level || 1) <= 2;
          });
          setExpandedMap((prev) => ({ ...initExpanded, ...prev }));
        }
      } catch (err) {
        logger.error('[WBSTab] Failed to load WBS data', { detail: err });
        toast.error(isAr ? 'حدث خطأ أثناء تحميل بيانات هيكل تقسيم العمل' : 'Failed to load WBS data');
      } finally {
        if (!isCancelled || !isCancelled()) {
          setLoading(false);
        }
      }
    },
    [project.id, isAr]
  );

  useCleanupEffect(
    async (isCancelled) => {
      await loadData(isCancelled);
    },
    [loadData]
  );

  /* ── Toggle Expand/Collapse ── */
  const toggleExpand = useCallback((id: string) => {
    setExpandedMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  const expandAll = useCallback(() => {
    const next: Record<string, boolean> = {};
    flatItems.forEach((w) => {
      next[w.id] = true;
    });
    setExpandedMap(next);
  }, [flatItems]);

  const collapseAll = useCallback(() => {
    const next: Record<string, boolean> = {};
    flatItems.forEach((w) => {
      next[w.id] = false;
    });
    setExpandedMap(next);
  }, [flatItems]);

  /* ── Auto-generate WBS ── */
  const handleAutoGenerate = async () => {
    if (!canEdit) return;
    const confirmMsg = isAr
      ? 'هل تريد استخراج وتوليد هيكل العمل تلقائياً استناداً إلى تصنيف أكواد الأنشطة وربط الأنشطة غير المصنفة؟'
      : 'Do you want to auto-generate the work breakdown structure from activity code patterns and link unassigned activities?';

    if (!confirm(confirmMsg)) {
      return;
    }

    setGenerating(true);
    try {
      const generated = await WBSService.autoGenerateFromActivities(project.id);
      toast.success(
        isAr
          ? `تم بنجاح توليد وتحديث ${generated.length} حزمة عمل وربط الأنشطة`
          : `Successfully generated and updated ${generated.length} packages`
      );
      await loadData();
    } catch (err: any) {
      logger.error('[WBSTab] autoGenerate error', { detail: err });
      toast.error(err.message || (isAr ? 'فشل توليد هيكل العمل تلقائياً' : 'Failed to auto-generate WBS structure'));
    } finally {
      setGenerating(false);
    }
  };

  /* ── Export to Excel ── */
  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const blob = await WBSService.exportWBSReport(project.id, project.project_name);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `WBS_EVM_Report_${project.project_code || project.id}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success(isAr ? 'تم تصدير تقرير هيكل العمل والقيمة المكتسبة بنجاح إلى ملف إكسيل' : 'WBS & EVM report exported successfully to Excel');
    } catch (err) {
      logger.error('[WBSTab] exportExcel error', { detail: err });
      toast.error(isAr ? 'حدث خطأ أثناء تصدير التقرير' : 'Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  /* ── Open Create / Edit Modal ── */
  const openCreateModal = (parentItem?: WBSItem) => {
    if (!canEdit) return;
    setModalMode('create');
    setEditingItem(null);
    setParentItemForSub(parentItem || null);
    setFormParentId(parentItem?.id || '');
    setFormWbsCode('');
    setFormTitleAr('');
    setFormTitleEn('');
    setFormBudgetedCost(0);
    setFormWeight(0);
    setShowItemModal(true);
  };

  const openEditModal = (item: WBSItem) => {
    if (!canEdit) return;
    setModalMode('edit');
    setEditingItem(item);
    setParentItemForSub(null);
    setFormParentId(item.parent_id || '');
    setFormWbsCode(item.wbs_code || '');
    setFormTitleAr(item.title_ar || '');
    setFormTitleEn(item.title_en || '');
    setFormBudgetedCost(item.budgeted_cost || 0);
    setFormWeight(item.weight_percentage || 0);
    setShowItemModal(true);
  };

  /* ── Save WBS Item Modal ── */
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    if (!formTitleAr.trim()) {
      toast.error(isAr ? 'اسم حزمة العمل بالعربية مطلوب' : 'Package Arabic title is required');
      return;
    }

    setModalSaving(true);
    try {
      if (modalMode === 'create') {
        await WBSService.createWBSItem({
          project_id: project.id,
          parent_id: formParentId || null,
          wbs_code: formWbsCode.trim() || undefined,
          title_ar: formTitleAr.trim(),
          title_en: formTitleEn.trim() || undefined,
          budgeted_cost: Number(formBudgetedCost) || 0,
          weight_percentage: Number(formWeight) || 0,
        });
        toast.success(isAr ? 'تمت إضافة حزمة العمل بنجاح' : 'Work package created successfully');
      } else if (editingItem) {
        await WBSService.updateWBSItem(editingItem.id, {
          project_id: project.id,
          parent_id: formParentId || null,
          wbs_code: formWbsCode.trim() || undefined,
          title_ar: formTitleAr.trim(),
          title_en: formTitleEn.trim() || undefined,
          budgeted_cost: Number(formBudgetedCost) || 0,
          weight_percentage: Number(formWeight) || 0,
        });
        toast.success(isAr ? 'تم تحديث حزمة العمل بنجاح' : 'Work package updated successfully');
      }
      setShowItemModal(false);
      await loadData();
    } catch (err: any) {
      logger.error('[WBSTab] Save modal error', { detail: err });
      toast.error(err.message || (isAr ? 'حدث خطأ أثناء حفظ حزمة العمل' : 'Failed to save work package'));
    } finally {
      setModalSaving(false);
    }
  };

  /* ── Delete WBS Item ── */
  const handleDeleteItem = async (item: WBSItem) => {
    if (!canEdit) return;
    const confirmMsg = isAr
      ? `هل أنت متأكد من حذف حزمة العمل "${item.title_ar || item.title_en}"؟ الأنشطة المندرجة ستصبح غير معينة.`
      : `Are you sure you want to delete work package "${item.title_en || item.title_ar}"? Included activities will become unassigned.`;

    if (!confirm(confirmMsg)) {
      return;
    }
    try {
      await WBSService.deleteWBSItem(item.id, project.id);
      toast.success(isAr ? 'تم حذف حزمة العمل بنجاح' : 'Work package deleted successfully');
      await loadData();
    } catch (err: any) {
      logger.error('[WBSTab] Delete item error', { detail: err });
      toast.error(err.message || (isAr ? 'فشل حذف حزمة العمل' : 'Failed to delete work package'));
    }
  };

  /* ── Assign / Reassign Activities ── */
  const handleOpenAssignModalForActivity = (act: ProjectActivity) => {
    if (!canEdit) return;
    setSelectedActivityToReassign(act);
    setSelectedUnassignedIds([act.id]);
    setTargetWbsId(act.wbs_item_id || '');
    setShowAssignModal(true);
  };

  const handleOpenAssignModalForUngrouped = () => {
    if (!canEdit) return;
    setSelectedActivityToReassign(null);
    setTargetWbsId('');
    setShowAssignModal(true);
  };

  const handleExecuteAssignment = async () => {
    if (!canEdit) return;
    if (!targetWbsId) {
      toast.error(isAr ? 'يرجى اختيار حزمة العمل المستهدفة أو خيار فصل الأنشطة' : 'Please select target package or unassign option');
      return;
    }
    if (selectedUnassignedIds.length === 0) {
      toast.error(isAr ? 'يرجى اختيار نشاط واحد على الأقل للتعيين' : 'Please select at least one activity to assign');
      return;
    }

    setAssigning(true);
    try {
      if (targetWbsId === '__unassign__') {
        await WBSService.unassignActivities(selectedUnassignedIds, project.id);
        toast.success(
          isAr
            ? `تم فصل ${selectedUnassignedIds.length} نشاطاً عن هيكل العمل بنجاح`
            : `Successfully detached ${selectedUnassignedIds.length} activities`
        );
      } else {
        await WBSService.assignActivities(selectedUnassignedIds, targetWbsId, project.id);
        toast.success(
          isAr
            ? `تم تعيين ${selectedUnassignedIds.length} نشاطاً إلى حزمة العمل بنجاح`
            : `Successfully assigned ${selectedUnassignedIds.length} activities`
        );
      }
      setShowAssignModal(false);
      setSelectedUnassignedIds([]);
      setSelectedActivityToReassign(null);
      await loadData();
    } catch (err: any) {
      logger.error('[WBSTab] assignment error', { detail: err });
      toast.error(err.message || (isAr ? 'فشل تنفيذ الإجراء' : 'Failed to execute assignment'));
    } finally {
      setAssigning(false);
    }
  };

  /* ── Toggle selection in unassigned activities ── */
  const toggleSelectUnassigned = (id: string) => {
    setSelectedUnassignedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllUnassigned = () => {
    if (selectedUnassignedIds.length === unassignedActivities.length) {
      setSelectedUnassignedIds([]);
    } else {
      setSelectedUnassignedIds(unassignedActivities.map((a) => a.id));
    }
  };

  /* ── Status Tabs List ── */
  const statusTabs = useMemo(() => [
    { id: 'all', label: isAr ? 'الكل' : 'All' },
    { id: 'in_progress', label: isAr ? 'جاري التنفيذ' : 'In Progress' },
    { id: 'completed', label: isAr ? 'مكتمل' : 'Completed' },
    { id: 'delayed', label: isAr ? 'متأخر' : 'Delayed' },
    { id: 'not_started', label: isAr ? 'لم تبدأ' : 'Not Started' },
  ], [isAr]);

  /* ── Loading State ── */
  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin mx-auto text-sky-500 mb-3" />
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
          {isAr
            ? 'جاري قراءة هيكل تقسيم العمل ومؤشرات القيمة المكتسبة...'
            : 'Loading work breakdown structure & EVM metrics...'}
        </p>
      </div>
    );
  }

  const overallPct = evmDashboard?.overallProgressPct ?? 0;
  const spi = evmDashboard?.spi ?? 1.0;
  const cpi = evmDashboard?.cpi ?? 1.0;

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* ═══════════════════════════════════════════ */}
      {/* 1. TOP STATS & KPI SUMMARY CARDS           */}
      {/* ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Overall Completion Circle Card */}
        <div className="col-span-2 md:col-span-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3 shadow-xs">
          <div className="relative w-14 h-14 shrink-0">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                className="text-slate-100 dark:text-slate-800"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                strokeWidth="10"
                strokeLinecap="round"
                className={
                  overallPct >= 80
                    ? 'text-emerald-500'
                    : overallPct >= 50
                    ? 'text-amber-500'
                    : 'text-sky-500'
                }
                strokeDasharray={`${(overallPct / 100) * 251.2} 251.2`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-black text-slate-900 dark:text-white tabular-nums">
                {overallPct}%
              </span>
            </div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block">
              {isAr ? 'إنجاز المشروع' : 'Project Progress'}
            </span>
            <span className="text-xs font-black text-slate-800 dark:text-slate-200">
              {overallPct >= 100
                ? (isAr ? 'مكتمل بالكامل' : 'Completed')
                : overallPct > 0
                ? (isAr ? 'جاري التنفيذ' : 'In Progress')
                : (isAr ? 'بانتظار البدء' : 'Not Started')}
            </span>
          </div>
        </div>

        {/* Total Activities */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <span className="text-[11px] text-slate-400 font-bold block">
            {isAr ? 'إجمالي الأنشطة' : 'Total Activities'}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
              {evmDashboard?.totalActivities || 0}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {isAr ? 'نشاط' : 'activities'}
            </span>
          </div>
        </div>

        {/* Completed */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {isAr ? 'أنشطة مكتملة' : 'Completed'}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
              {evmDashboard?.completedActivities || 0}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {isAr ? 'نشاط' : 'activities'}
            </span>
          </div>
        </div>

        {/* In Progress */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <span className="text-[11px] text-sky-600 dark:text-sky-400 font-bold flex items-center gap-1">
            <Activity className="w-3.5 h-3.5" />
            {isAr ? 'جاري تنفيذها' : 'In Progress'}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-black text-sky-600 dark:text-sky-400 tabular-nums">
              {evmDashboard?.inProgressActivities || 0}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {isAr ? 'نشاط' : 'activities'}
            </span>
          </div>
        </div>

        {/* Delayed */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <span className="text-[11px] text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            {isAr ? 'أنشطة متأخرة' : 'Delayed'}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-black text-rose-600 dark:text-rose-400 tabular-nums">
              {evmDashboard?.delayedActivities || 0}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {isAr ? 'نشاط' : 'activities'}
            </span>
          </div>
        </div>

        {/* Not Started */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {isAr ? 'لم تبدأ بعد' : 'Not Started'}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-black text-slate-600 dark:text-slate-400 tabular-nums">
              {evmDashboard?.notStartedActivities || 0}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {isAr ? 'نشاط' : 'activities'}
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* 2. ACTION BAR & CONTROLS                    */}
      {/* ═══════════════════════════════════════════ */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search and Status Filters */}
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative min-w-[240px] max-w-sm flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={
                  isAr
                    ? 'البحث برمز النشاط، الاسم، أو حزمة العمل...'
                    : 'Search by activity code, name, or package...'
                }
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full ps-9 pe-8 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 transition-colors"
              />
              {filterText && (
                <button
                  type="button"
                  onClick={() => setFilterText('')}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded p-0.5"
                  title={isAr ? 'مسح البحث' : 'Clear search'}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {statusTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                    statusFilter === tab.id
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {canEdit && (
              <>
                {/* Auto-generate Button */}
                <button
                  type="button"
                  onClick={handleAutoGenerate}
                  disabled={generating}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800 transition-colors disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 shadow-xs"
                  title={
                    isAr
                      ? 'توليد وتصنيف الهيكل تلقائياً من أكواد الأنشطة'
                      : 'Auto-generate structure from activity codes'
                  }
                >
                  {generating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  )}
                  <span>{isAr ? 'توليد هيكل العمل تلقائياً' : 'Auto-Generate WBS'}</span>
                </button>

                {/* Add Package */}
                <button
                  type="button"
                  onClick={() => openCreateModal()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 shadow-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAr ? 'إضافة حزمة عمل' : 'Add Work Package'}</span>
                </button>
              </>
            )}

            {/* Export Excel */}
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 transition-colors disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shadow-xs"
            >
              {exporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              )}
              <span>{isAr ? 'تصدير إلى إكسيل' : 'Export to Excel'}</span>
            </button>

            {/* Expand / Collapse All */}
            <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
              <button
                type="button"
                onClick={expandAll}
                className="px-2.5 py-2 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              >
                {isAr ? 'توسيع الكل' : 'Expand All'}
              </button>
              <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-800" />
              <button
                type="button"
                onClick={collapseAll}
                className="px-2.5 py-2 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              >
                {isAr ? 'طي الكل' : 'Collapse All'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* 3. MAIN DASHBOARD CONTENT (2 COLUMNS)       */}
      {/* ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT/MAIN COLUMN: WBS TREE & UNGROUPED (COL-SPAN-8) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Ungrouped Activities Warning Section (if any) */}
          {unassignedActivities.length > 0 && (
            <div className="rounded-2xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/25 dark:border-amber-500/20 p-4 space-y-3 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {isAr
                        ? `أنشطة غير مصنفة تحت هيكل العمل (${unassignedActivities.length} نشاط)`
                        : `Unassigned Activities (${unassignedActivities.length})`}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {isAr
                        ? 'هذه الأنشطة مستوردة من الجدول الزمني ولم تُربط بأي حزمة عمل بعد.'
                        : 'These activities are imported from the schedule and not linked to any work package yet.'}
                    </p>
                  </div>
                </div>

                {canEdit && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAutoGenerate}
                      disabled={generating}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 shadow-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    >
                      {isAr ? 'توليد وتصنيف تلقائي' : 'Auto Categorize'}
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenAssignModalForUngrouped}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 shadow-xs"
                    >
                      {isAr ? 'تعيين إلى حزمة عمل...' : 'Assign to Package...'}
                    </button>
                  </div>
                )}
              </div>

              {/* Collapsible preview of unassigned activities */}
              <div className="max-h-48 overflow-y-auto space-y-1.5 pe-1">
                {unassignedActivities.slice(0, 10).map((act) => (
                  <div
                    key={act.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-white/80 dark:bg-slate-900/60 border border-amber-200/50 dark:border-amber-900/40 text-xs shadow-2xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono text-[10px] font-bold text-slate-600 dark:text-slate-400">
                        {act.activity_code || act.code}
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                        {isAr ? act.name_ar || act.name_en : act.name_en || act.name_ar}
                      </span>
                    </div>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleOpenAssignModalForActivity(act)}
                        className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded px-1"
                      >
                        {isAr ? 'تعيين' : 'Assign'}
                      </button>
                    )}
                  </div>
                ))}
                {unassignedActivities.length > 10 && (
                  <p className="text-center text-[10px] text-slate-400 py-1 font-medium">
                    {isAr
                      ? `... و ${unassignedActivities.length - 10} أنشطة أخرى`
                      : `... and ${unassignedActivities.length - 10} more activities`}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* WBS Hierarchy Tree */}
          {treeData.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 text-center shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <FolderTree className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                {isAr
                  ? 'لا توجد حزم عمل مسجلة لهيكل المشروع الحالي'
                  : 'No WBS work packages registered for this project'}
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mb-4 leading-relaxed">
                {isAr
                  ? 'يمكنك الضغط على زر "توليد هيكل العمل تلقائياً" لاستخراج التقسيم الهيكلي مباشرة من أكواد الأنشطة المستوردة، أو إضافة حزم العمل يدوياً.'
                  : 'You can click "Auto-Generate WBS" to extract hierarchical packages from activity codes, or add packages manually.'}
              </p>
              {canEdit && (
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleAutoGenerate}
                    disabled={generating}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  >
                    <Sparkles className="w-3.5 h-3.5 inline-block me-1.5" />
                    {isAr ? 'توليد هيكل العمل تلقائياً' : 'Auto-Generate WBS'}
                  </button>
                  <button
                    type="button"
                    onClick={() => openCreateModal()}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                  >
                    <Plus className="w-3.5 h-3.5 inline-block me-1.5" />
                    {isAr ? 'إضافة حزمة عمل يدوياً' : 'Add Package Manually'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {treeData.map((node) => (
                <WBSTreeNode
                  key={node.id}
                  item={node}
                  expandedMap={expandedMap}
                  onToggleExpand={toggleExpand}
                  onAddSubItem={openCreateModal}
                  onEditItem={openEditModal}
                  onDeleteItem={handleDeleteItem}
                  onReassignActivity={handleOpenAssignModalForActivity}
                  filterText={filterText}
                  statusFilter={statusFilter}
                  isAr={isAr}
                  canEdit={canEdit}
                />
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: EVM FINANCIAL & PERFORMANCE COMMAND PANEL (COL-SPAN-4) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    {isAr ? 'لوحة إدارة القيمة المكتسبة' : 'Earned Value Management (EVM)'}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {isAr ? 'تحليل الأداء الزمني والمالي للمشروع' : 'Earned Value Management Analysis'}
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50">
                {isAr ? 'مؤشرات حية' : 'Live Metrics'}
              </span>
            </div>

            {/* Performance Indices: SPI & CPI */}
            <div className="grid grid-cols-2 gap-3">
              {/* SPI */}
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold">
                    {isAr ? 'مؤشر أداء الجدول الزمني' : 'Schedule Performance (SPI)'}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      spi >= 1.0
                        ? 'bg-emerald-500'
                        : spi >= 0.9
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                  />
                </div>
                <div className="mt-1">
                  <span
                    className={`text-xl font-black tabular-nums ${
                      spi >= 1.0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : spi >= 0.9
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {spi.toFixed(2)}
                  </span>
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium leading-tight">
                    {spi >= 1.0
                      ? (isAr ? 'متقدم عن الخطة الزمنية' : 'Ahead of Schedule')
                      : spi >= 0.9
                      ? (isAr ? 'تأخير طفيف ضمن الحدود المقبولة' : 'Slight Delay within Limits')
                      : (isAr ? 'تأخير حرج في الخطة الزمنية' : 'Critical Schedule Delay')}
                  </p>
                </div>
              </div>

              {/* CPI */}
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold">
                    {isAr ? 'مؤشر أداء التكلفة' : 'Cost Performance (CPI)'}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      !allowFinancials
                        ? 'bg-slate-400 dark:bg-slate-600'
                        : cpi >= 1.0
                        ? 'bg-emerald-500'
                        : cpi >= 0.9
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                  />
                </div>
                <div className="mt-1">
                  {allowFinancials ? (
                    <>
                      <span
                        className={`text-xl font-black tabular-nums ${
                          cpi >= 1.0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : cpi >= 0.9
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {cpi.toFixed(2)}
                      </span>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium leading-tight">
                        {cpi >= 1.0
                          ? (isAr ? 'وفر في التكلفة المالية' : 'Cost Savings')
                          : cpi >= 0.9
                          ? (isAr ? 'إنفاق معتدل ضمن الميزانية' : 'On Budget')
                          : (isAr ? 'تجاوز في الميزانية المقررة' : 'Budget Overrun')}
                      </p>
                    </>
                  ) : (
                    <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500 py-1">
                      <Lock className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">
                        {isAr ? 'مقيد الصلاحية' : 'Restricted'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Financial Parameters Gate */}
            {allowFinancials ? (
              <div className="space-y-4">
                {/* Cost Triad: BAC, EV, AC, PV */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      {isAr ? 'الميزانية التقديرية عند الاكتمال:' : 'Budget at Completion (BAC):'}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                      {fmtCurrency(evmDashboard?.totalBac || 0, isAr)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      {isAr ? 'القيمة المكتسبة للأعمال المنفذة:' : 'Earned Value (EV):'}
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {fmtCurrency(evmDashboard?.totalEv || 0, isAr)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      {isAr ? 'التكلفة الفعلية المنصرفة:' : 'Actual Cost (AC):'}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                      {fmtCurrency(evmDashboard?.totalAc || 0, isAr)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      {isAr ? 'القيمة المخططة للأعمال المجدولة:' : 'Planned Value (PV):'}
                    </span>
                    <span className="font-bold text-sky-600 dark:text-sky-400 tabular-nums">
                      {fmtCurrency(evmDashboard?.totalPv || 0, isAr)}
                    </span>
                  </div>
                </div>

                {/* Progress Comparison Visual Bar */}
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/40 p-3 space-y-2 border border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-600 dark:text-slate-300">
                      {isAr ? 'مقارنة الإنجاز المالي' : 'Financial Progress Comparison'}
                    </span>
                    <span className="text-slate-400 tabular-nums">
                      {evmDashboard?.totalBac ? Math.round(((evmDashboard.totalEv || 0) / evmDashboard.totalBac) * 100) : 0}%{' '}
                      {isAr ? 'من الميزانية المعتمدة' : 'of BAC'}
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          evmDashboard?.totalBac
                            ? ((evmDashboard.totalEv || 0) / evmDashboard.totalBac) * 100
                            : 0,
                          100
                        )}%`,
                      }}
                      title={isAr ? 'القيمة المكتسبة للأعمال المنفذة' : 'Earned Value (EV)'}
                    />
                  </div>
                </div>

                {/* Forecast & Variance (ETC, EAC, VAC) */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      {isAr ? 'التكلفة التقديرية المتبقية للإكمال:' : 'Estimate to Complete (ETC):'}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                      {fmtCurrency(evmDashboard?.etc || 0, isAr)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      {isAr ? 'التكلفة التقديرية الإجمالية عند الاكتمال:' : 'Estimate at Completion (EAC):'}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                      {fmtCurrency(evmDashboard?.eac || 0, isAr)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      {isAr ? 'وفر أو عجز الميزانية عند الاكتمال:' : 'Variance at Completion (VAC):'}
                    </span>
                    <span
                      className={`font-black tabular-nums ${
                        (evmDashboard?.vac || 0) >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {fmtCurrency(evmDashboard?.vac || 0, isAr)}
                    </span>
                  </div>
                </div>

                {/* Cost & EVM Variance and Narrative Notes */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2.5">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                    {isAr
                      ? 'تحليل وتفسير مؤشرات التكلفة والجدول الزمني'
                      : 'Cost & Schedule Variance Analysis'}
                  </span>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
                      <span className="text-[10px] text-slate-400 block font-medium">
                        {isAr ? 'تباين الجدول الزمني (الفرق المجدول)' : 'Schedule Variance (SV = EV - PV)'}
                      </span>
                      <span
                        className={`font-black tabular-nums ${
                          (evmDashboard?.totalEv || 0) - (evmDashboard?.totalPv || 0) >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {fmtCurrency((evmDashboard?.totalEv || 0) - (evmDashboard?.totalPv || 0), isAr)}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
                      <span className="text-[10px] text-slate-400 block font-medium">
                        {isAr ? 'تباين التكلفة (الفرق المالي المباشر)' : 'Cost Variance (CV = EV - AC)'}
                      </span>
                      <span
                        className={`font-black tabular-nums ${
                          (evmDashboard?.totalEv || 0) - (evmDashboard?.totalAc || 0) >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {fmtCurrency((evmDashboard?.totalEv || 0) - (evmDashboard?.totalAc || 0), isAr)}
                      </span>
                    </div>
                  </div>

                  {/* Narrative health commentary */}
                  {(() => {
                    const sv = (evmDashboard?.totalEv || 0) - (evmDashboard?.totalPv || 0);
                    const cv = (evmDashboard?.totalEv || 0) - (evmDashboard?.totalAc || 0);
                    let noteText = '';
                    let noteBg = '';
                    let noteBorder = '';
                    let noteTextClass = '';

                    if (sv >= 0 && cv >= 0) {
                      noteText = isAr
                        ? 'أداء ممتاز: المشروع متقدم عن الجدول الزمني وضمن حدود الميزانية المعتمدة.'
                        : 'Excellent performance: Project is ahead of schedule and within approved budget limits.';
                      noteBg = 'bg-emerald-50 dark:bg-emerald-950/20';
                      noteBorder = 'border-emerald-200 dark:border-emerald-800/40';
                      noteTextClass = 'text-emerald-800 dark:text-emerald-300';
                    } else if (sv >= 0 && cv < 0) {
                      noteText = isAr
                        ? 'تنبيه مالي: المشروع متقدم زمنياً لكن هناك تكلفة إضافية متجاوزة للمستهدف.'
                        : 'Cost alert: Project is ahead of schedule but experiencing budget overrun.';
                      noteBg = 'bg-amber-50 dark:bg-amber-950/20';
                      noteBorder = 'border-amber-200 dark:border-amber-800/40';
                      noteTextClass = 'text-amber-800 dark:text-amber-300';
                    } else if (sv < 0 && cv >= 0) {
                      noteText = isAr
                        ? 'تنبيه زمني: المشروع متأخر عن الخطة الزمنية مع الحفاظ على وفورات مالية في التكلفة.'
                        : 'Schedule alert: Project is behind schedule while maintaining cost savings.';
                      noteBg = 'bg-amber-50 dark:bg-amber-950/20';
                      noteBorder = 'border-amber-200 dark:border-amber-800/40';
                      noteTextClass = 'text-amber-800 dark:text-amber-300';
                    } else {
                      noteText = isAr
                        ? 'إنذار حرج: تأخير في المخطط الزمني وتجاوز مالي للميزانية يتطلب تدخلاً تصحيحياً فورياً.'
                        : 'Critical warning: Behind schedule and over budget; immediate corrective action required.';
                      noteBg = 'bg-rose-50 dark:bg-rose-950/20';
                      noteBorder = 'border-rose-200 dark:border-rose-800/40';
                      noteTextClass = 'text-rose-800 dark:text-rose-300';
                    }

                    return (
                      <div className={`p-2.5 rounded-xl border text-[11px] font-medium leading-relaxed ${noteBg} ${noteBorder} ${noteTextClass}`}>
                        {noteText}
                      </div>
                    );
                  })()}
                </div>
              </div>
            ) : (
              /* Non-financial role view */
              <div className="rounded-xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/50 dark:border-sky-900/40 p-4 text-center space-y-2">
                <ShieldCheck className="w-8 h-8 text-sky-500 mx-auto" />
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {isAr ? 'عرض الجدول الزمني ومؤشرات التنفيذ' : 'Schedule & Execution Overview'}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {isAr
                    ? 'المؤشرات المالية ومبالغ التكلفة مقيدة بصلاحيات الإدارة التجارية وإدارة المشاريع.'
                    : 'Financial EVM metrics and cost figures are restricted to Commercial & Project Management roles.'}
                </p>
                <div className="pt-2 border-t border-sky-100 dark:border-sky-900/30 text-xs font-bold text-sky-700 dark:text-sky-300">
                  {isAr ? `معدل إنجاز الأنشطة: ${overallPct}%` : `Activity Completion Rate: ${overallPct}%`}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* 4. MODALS (ADD / EDIT WBS ITEM)             */}
      {/* ═══════════════════════════════════════════ */}
      {showItemModal && canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-500" />
                {modalMode === 'create'
                  ? parentItemForSub
                    ? (isAr ? `إضافة حزمة فرعية تابعة لـ (${parentItemForSub.title_ar || parentItemForSub.title_en})` : `Add Sub-package under (${parentItemForSub.title_en || parentItemForSub.title_ar})`)
                    : (isAr ? 'إضافة حزمة عمل جديدة' : 'Add New Work Package')
                  : (isAr ? 'تعديل بيانات حزمة العمل' : 'Edit Work Package')}
              </h3>
              <button
                type="button"
                onClick={() => setShowItemModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4 text-xs">
              {/* Parent Package Select */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'الحزمة الرئيسية (المستوى الأعلى)' : 'Parent Work Package'}
                </label>
                <select
                  value={formParentId}
                  onChange={(e) => setFormParentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                >
                  <option value="">
                    {isAr ? 'بدون حزمة رئيسية (المستوى الأعلى الأول)' : 'No parent (Level 1 Top Level)'}
                  </option>
                  {flatItems
                    .filter((item) => editingItem ? item.id !== editingItem.id : true)
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {'— '.repeat(Math.max(0, (item.level || 1) - 1))}
                        {item.wbs_code ? `[#${item.wbs_code}] ` : ''}
                        {isAr ? item.title_ar || item.title_en : item.title_en || item.title_ar}
                      </option>
                    ))}
                </select>
              </div>

              {/* WBS Code */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'رمز حزمة العمل' : 'Work Package Code'}
                </label>
                <input
                  type="text"
                  placeholder={isAr ? 'مثال: CON.G4 أو SL-L2-TC' : 'e.g. CON.G4 or SL-L2-TC'}
                  value={formWbsCode}
                  onChange={(e) => setFormWbsCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                />
              </div>

              {/* Title Arabic */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'اسم الحزمة بالعربية *' : 'Package Name (Arabic) *'}
                </label>
                <input
                  type="text"
                  placeholder="مثال: الأعمال الكهروميكانيكية لمحطة الضخ"
                  value={formTitleAr}
                  onChange={(e) => setFormTitleAr(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                />
              </div>

              {/* Title English */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'الاسم بالإنجليزية (اختياري)' : 'Package Name (English - Optional)'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Electromechanical Pump Station"
                  value={formTitleEn}
                  onChange={(e) => setFormTitleEn(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                />
              </div>

              {/* Budgeted Cost & Weight */}
              <div className="grid grid-cols-2 gap-3">
                <PriceGate>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isAr ? 'الميزانية المعتمدة (ج.م)' : 'Budget at Completion (EGP)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={formBudgetedCost || ''}
                      onChange={(e) => setFormBudgetedCost(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                    />
                  </div>
                </PriceGate>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'الوزن النسبي (%)' : 'Relative Weight (%)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formWeight || ''}
                    onChange={(e) => setFormWeight(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={modalSaving}
                  className="px-5 py-2 rounded-xl font-bold text-white bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                >
                  {modalSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>
                    {modalMode === 'create'
                      ? (isAr ? 'إضافة الحزمة' : 'Add Package')
                      : (isAr ? 'حفظ التعديلات' : 'Save Changes')}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* 5. MODAL: ASSIGN ACTIVITIES TO WBS          */}
      {/* ═══════════════════════════════════════════ */}
      {showAssignModal && canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-sky-500" />
                {selectedActivityToReassign
                  ? (isAr
                      ? `تعيين النشاط (${selectedActivityToReassign.activity_code || selectedActivityToReassign.name_ar})`
                      : `Assign Activity (${selectedActivityToReassign.activity_code || selectedActivityToReassign.name_en})`)
                  : (isAr ? 'تعيين الأنشطة إلى حزمة العمل' : 'Assign Activities to Work Package')}
              </h3>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Target WBS select */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'اختر حزمة العمل المستهدفة *' : 'Select Target Work Package *'}
                </label>
                <select
                  value={targetWbsId}
                  onChange={(e) => setTargetWbsId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                >
                  <option value="">
                    {isAr ? '-- اختر حزمة العمل --' : '-- Select Work Package --'}
                  </option>
                  {selectedActivityToReassign && (
                    <option value="__unassign__" className="text-rose-600 dark:text-rose-400 font-bold">
                      {isAr
                        ? '-- إلغاء التعيين (فصل النشاط عن هيكل العمل) --'
                        : '-- Unassign (Detach activity from work structure) --'}
                    </option>
                  )}
                  {flatItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {'— '.repeat(Math.max(0, (item.level || 1) - 1))}
                      {item.wbs_code ? `[#${item.wbs_code}] ` : ''}
                      {isAr ? item.title_ar || item.title_en : item.title_en || item.title_ar}
                    </option>
                  ))}
                </select>
              </div>

              {/* Multi-activity checklist if multiple */}
              {!selectedActivityToReassign && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-700 dark:text-slate-300">
                      {isAr
                        ? `حدد الأنشطة المراد تعيينها (${selectedUnassignedIds.length} محددة)`
                        : `Select activities to assign (${selectedUnassignedIds.length} selected)`}
                    </label>
                    <button
                      type="button"
                      onClick={toggleSelectAllUnassigned}
                      className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded px-1"
                    >
                      {selectedUnassignedIds.length === unassignedActivities.length
                        ? (isAr ? 'إلغاء تحديد الكل' : 'Deselect All')
                        : (isAr ? 'تحديد الكل' : 'Select All')}
                    </button>
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    {unassignedActivities.map((act) => {
                      const isSel = selectedUnassignedIds.includes(act.id);
                      return (
                        <div
                          key={act.id}
                          onClick={() => toggleSelectUnassigned(act.id)}
                          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                            isSel
                              ? 'bg-sky-50 dark:bg-sky-950/40 border border-sky-300 dark:border-sky-800'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
                          }`}
                        >
                          {isSel ? (
                            <CheckSquare className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                          )}
                          <span className="font-mono text-[10px] font-bold text-slate-600 dark:text-slate-400 shrink-0">
                            {act.activity_code || act.code}
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {isAr ? act.name_ar || act.name_en : act.name_en || act.name_ar}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleExecuteAssignment}
                  disabled={assigning}
                  className="px-5 py-2 rounded-xl font-bold text-white bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                >
                  {assigning && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isAr ? 'تأكيد التعيين' : 'Confirm Assignment'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

WBSTab.displayName = 'WBSTab';
export default WBSTab;
