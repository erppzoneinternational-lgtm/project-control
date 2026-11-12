import React, { useState, useCallback, useMemo } from 'react';
import { AuditLogEntry, ChangelogDiffItem } from '@/types';
import { ProjectService } from '@/lib/services/project.service';
import { AuditLogService, TABLE_DISPLAY_NAMES, ACTION_CONFIG } from '@/lib/services/auditLog.service';
import { supabase } from '@/lib/supabase';
import { useCleanupEffect } from '@/lib/utils/useCleanupEffect';
import {
  History,
  Clock,
  User,
  Eye,
  Loader2,
  ArrowRight,
  Plus,
  Pencil,
  Trash2,
  Filter,
  ChevronDown,
  ChevronUp,
  Database,
  Search,
  Calendar,
  Download,
  RefreshCw,
  Copy,
  Check,
  Code2,
  Layers,
  Shield,
  Activity,
  X,
  FileText,
  CheckCircle2,
  SlidersHorizontal,
  ExternalLink,
  Laptop
} from 'lucide-react';

export interface AuditLogTabProps {
  projectId: string;
  isAr?: boolean;
}

interface ActionBadgeConfig {
  label: string;
  labelAr: string;
  labelEn: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  dotColor: string;
  ringColor: string;
  bgLight: string;
}

const ACTION_LABELS: Record<string, ActionBadgeConfig> = {
  INSERT: {
    label: 'إنشاء جديد',
    labelAr: 'إنشاء جديد',
    labelEn: 'Create',
    icon: Plus,
    color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    dotColor: 'bg-emerald-500',
    ringColor: 'ring-emerald-500/20',
    bgLight: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
  },
  UPDATE: {
    label: 'تعديل بيانات',
    labelAr: 'تعديل بيانات',
    labelEn: 'Update',
    icon: Pencil,
    color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    dotColor: 'bg-amber-500',
    ringColor: 'ring-amber-500/20',
    bgLight: 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
  },
  DELETE: {
    label: 'حذف سجل',
    labelAr: 'حذف سجل',
    labelEn: 'Delete',
    icon: Trash2,
    color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    dotColor: 'bg-rose-500',
    ringColor: 'ring-rose-500/20',
    bgLight: 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
  },
  STATUS_CHANGE: {
    label: 'تغيير حالة الاعتماد',
    labelAr: 'تغيير حالة الاعتماد',
    labelEn: 'Status Change',
    icon: ArrowRight,
    color: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    dotColor: 'bg-sky-500',
    ringColor: 'ring-sky-500/20',
    bgLight: 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
  },
};

const DEFAULT_ACTION: ActionBadgeConfig = {
  label: 'إجراء عام',
  labelAr: 'إجراء عام',
  labelEn: 'General Action',
  icon: Activity,
  color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  dotColor: 'bg-purple-500',
  ringColor: 'ring-purple-500/20',
  bgLight: 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
};

export const AuditLogTab: React.FC<AuditLogTabProps> = React.memo(({ projectId, isAr }) => {
  // Determine language mode with default to Arabic
  const isArabic = useMemo(() => {
    if (typeof isAr === 'boolean') return isAr;
    if (typeof document !== 'undefined') {
      const dsLocale = document.documentElement.getAttribute('data-locale');
      if (dsLocale) return dsLocale !== 'en';
      return document.documentElement.lang !== 'en';
    }
    return true;
  }, [isAr]);

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showRawJsonMap, setShowRawJsonMap] = useState<Record<string, boolean>>({});

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [datePreset, setDatePreset] = useState<'all' | 'today' | '7days' | '30days' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadData = useCallback(async (isCancelled?: () => boolean) => {
    setLoading(true);
    try {
      const data = await ProjectService.getAuditLogs(projectId);
      
      // Enrich with profile names if possible
      try {
        const userIds = Array.from(new Set(data.map((l) => l.changed_by).filter(Boolean)));
        if (userIds.length > 0) {
          const { data: profs } = await supabase
            .from('profiles')
            .select('id, full_name, full_name_ar, full_name_en, email, roles')
            .in('id', userIds);

          if (profs && profs.length > 0) {
            const profMap: Record<string, any> = {};
            profs.forEach((p) => {
              if (p.id) profMap[p.id] = p;
            });

            data.forEach((log) => {
              if (log.changed_by && profMap[log.changed_by]) {
                const p = profMap[log.changed_by];
                log.user_name = p.full_name || p.full_name_ar || p.full_name_en || p.email;
                log.user_email = p.email;
                log.user_role = Array.isArray(p.roles) && p.roles.length > 0 ? p.roles[0] : undefined;
              }
            });
          }
        }
      } catch {
        // Fallback silently if profiles query fails
      }

      if (!isCancelled || !isCancelled()) {
        setLogs(data);
      }
    } finally {
      if (!isCancelled || !isCancelled()) {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [projectId]);

  useCleanupEffect(async (isCancelled) => {
    await loadData(isCancelled);
  }, [loadData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
  };

  // Extract distinct users for filter dropdown
  const uniqueUsers = useMemo(() => {
    const userMap = new Map<string, { id: string; name: string; email?: string }>();
    logs.forEach((log) => {
      const key = log.changed_by || log.user_email;
      if (key && !userMap.has(key)) {
        userMap.set(key, {
          id: key,
          name: log.user_name || log.changed_by || (isArabic ? 'مستخدم غير معروف' : 'Unknown User'),
          email: log.user_email
        });
      }
    });
    return Array.from(userMap.values());
  }, [logs, isArabic]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    return logs.filter((log) => {
      // Action filter
      if (filterAction !== 'all' && log.action !== filterAction) {
        return false;
      }

      // User filter
      if (filterUser !== 'all') {
        const matchesUser = log.changed_by === filterUser || log.user_email === filterUser;
        if (!matchesUser) return false;
      }

      // Date preset or custom range
      const rawTimestamp = log.created_at || log.changed_at;
      const logTime = rawTimestamp ? new Date(rawTimestamp).getTime() : NaN;

      if (!isNaN(logTime)) {
        if (datePreset === 'today' && now - logTime > dayMs) return false;
        if (datePreset === '7days' && now - logTime > 7 * dayMs) return false;
        if (datePreset === '30days' && now - logTime > 30 * dayMs) return false;
        if (datePreset === 'custom') {
          if (startDate) {
            const startMs = new Date(startDate).setHours(0, 0, 0, 0);
            if (logTime < startMs) return false;
          }
          if (endDate) {
            const endMs = new Date(endDate).setHours(23, 59, 59, 999);
            if (logTime > endMs) return false;
          }
        }
      }

      // Text search query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const tableEntry = TABLE_DISPLAY_NAMES[log.table_name];
        const tableNameAr = tableEntry?.nameAr || '';
        const tableNameEn = tableEntry?.nameEn || '';
        const matchTable = log.table_name.toLowerCase().includes(q) ||
          tableNameAr.toLowerCase().includes(q) ||
          tableNameEn.toLowerCase().includes(q);
        const matchUser = (log.user_name || '').toLowerCase().includes(q) ||
          (log.user_email || '').toLowerCase().includes(q) ||
          (log.changed_by || '').toLowerCase().includes(q);
        const matchRecord = (log.record_id || '').toLowerCase().includes(q);
        const matchContext = (log.context || '').toLowerCase().includes(q);
        const matchPayload = JSON.stringify(log.old_data || {}).toLowerCase().includes(q) ||
          JSON.stringify(log.new_data || {}).toLowerCase().includes(q);

        if (!matchTable && !matchUser && !matchRecord && !matchContext && !matchPayload) {
          return false;
        }
      }

      return true;
    });
  }, [logs, filterAction, filterUser, datePreset, startDate, endDate, searchQuery]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filterAction !== 'all') count++;
    if (filterUser !== 'all') count++;
    if (datePreset !== 'all') count++;
    if (searchQuery.trim()) count++;
    return count;
  }, [filterAction, filterUser, datePreset, searchQuery]);

  const handleResetFilters = () => {
    setFilterAction('all');
    setFilterUser('all');
    setDatePreset('all');
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleRawJson = (id: string) => {
    setShowRawJsonMap((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleExport = () => {
    AuditLogService.exportChangelogToExcel(
      filteredLogs,
      isArabic ? `سجل_تدقيق_المشروع_${projectId.slice(0, 8)}` : `project_audit_log_${projectId.slice(0, 8)}`
    );
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 dark:text-slate-500" role="status" aria-live="polite">
        <Loader2 className="w-9 h-9 animate-spin mx-auto text-purple-600 dark:text-purple-400 mb-3" />
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
          {isArabic ? 'جاري تحميل سجل التدقيق الزمني...' : 'Loading audit trail log...'}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          {isArabic ? 'يتم استرجاع الحركات ومطابقة هويات المستخدمين' : 'Retrieving timeline events and resolving user identities'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* ── Top Header Strip ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <History className="w-5 h-5" />
            </div>
            <span>
              {isArabic ? 'سجل التدقيق والتتبع الزمني الموثق' : 'Project Audit Trail & Timeline'}
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isArabic
              ? 'سجل غير قابل للتعديل يوثق جميع العمليات، والمستخدمين، والفروقات اللحظية للبيانات التعاقدية'
              : 'Immutable record documenting all operations, users, and real-time diffs of contractual data'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 transition-colors shadow-2xs cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-hidden disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={isArabic ? 'تحديث سجل التدقيق' : 'Refresh audit log'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-purple-500' : ''}`} />
            <span>{isArabic ? 'تحديث' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={filteredLogs.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-hidden"
            aria-label={isArabic ? 'تصدير سجل التدقيق إلى ملف إكسل' : 'Export audit log to Excel'}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isArabic ? 'تصدير إكسل' : 'Export Excel'}</span>
          </button>
        </div>
      </div>

      {/* ── KPI & Action Quick-Filter Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {(['INSERT', 'UPDATE', 'DELETE', 'STATUS_CHANGE'] as const).map((action) => {
          const info = ACTION_LABELS[action];
          const IconComp = info.icon;
          const count = logs.filter((l) => l.action === action).length;
          const isSelected = filterAction === action;
          const badgeLabel = isArabic ? info.labelAr : info.labelEn;

          return (
            <button
              key={action}
              type="button"
              onClick={() => setFilterAction(isSelected ? 'all' : action)}
              className={`rounded-2xl p-3 border transition-all ${
                isArabic ? 'text-right' : 'text-left'
              } relative overflow-hidden group cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-hidden ${
                isSelected
                  ? 'border-purple-500 bg-purple-50/70 dark:bg-purple-950/40 ring-2 ring-purple-500/20 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-purple-300 dark:hover:border-purple-700/60 hover:shadow-2xs'
              }`}
              aria-label={
                isArabic
                  ? `تصفية حسب ${badgeLabel}: ${count} سجل`
                  : `Filter by ${badgeLabel}: ${count} records`
              }
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{badgeLabel}</span>
                <div className={`p-1.5 rounded-lg border ${info.color}`}>
                  <IconComp className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white mt-1 font-mono">
                {count}
              </div>
              {isSelected && (
                <span
                  className={`absolute bottom-1 ${
                    isArabic ? 'left-2' : 'right-2'
                  } text-[10px] font-bold text-purple-600 dark:text-purple-400`}
                >
                  {isArabic ? 'نشط ✓' : 'Active ✓'}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Responsive Filter Toolbar ── */}
      <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 backdrop-blur-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Search Input */}
          <div className="relative">
            <label htmlFor="audit-search" className="sr-only">
              {isArabic ? 'بحث في سجل التدقيق' : 'Search audit log'}
            </label>
            <Search
              className={`absolute ${
                isArabic ? 'right-3' : 'left-3'
              } top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none`}
            />
            <input
              id="audit-search"
              type="text"
              placeholder={
                isArabic
                  ? 'بحث بالجداول، الهوية، التغييرات...'
                  : 'Search by tables, IDs, changes...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full ${
                isArabic ? 'pr-9 pl-8' : 'pl-9 pr-8'
              } py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 focus-visible:ring-2 focus-visible:ring-purple-500 transition-all`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className={`absolute ${
                  isArabic ? 'left-2.5' : 'right-2.5'
                } top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-hidden`}
                aria-label={isArabic ? 'مسح نص البحث' : 'Clear search text'}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action Filter */}
          <div>
            <label htmlFor="audit-action-filter" className="sr-only">
              {isArabic ? 'تصفية العمليات' : 'Filter by action'}
            </label>
            <div className="relative">
              <select
                id="audit-action-filter"
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className={`w-full text-xs ${
                  isArabic ? 'pr-3 pl-8' : 'pl-3 pr-8'
                } py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 focus-visible:ring-2 focus-visible:ring-purple-500 transition-all appearance-none cursor-pointer`}
                aria-label={isArabic ? 'تصفية حسب نوع العملية' : 'Filter by action type'}
              >
                <option value="all">
                  {isArabic ? `كافة العمليات (${logs.length})` : `All Actions (${logs.length})`}
                </option>
                <option value="INSERT">
                  {isArabic ? 'إنشاء سجل جديد' : 'Create Record'}
                </option>
                <option value="UPDATE">
                  {isArabic ? 'تعديل بيانات' : 'Update Data'}
                </option>
                <option value="DELETE">
                  {isArabic ? 'حذف سجل' : 'Delete Record'}
                </option>
                <option value="STATUS_CHANGE">
                  {isArabic ? 'تغيير حالة الاعتماد' : 'Status Change'}
                </option>
              </select>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 absolute ${
                  isArabic ? 'left-3' : 'right-3'
                } top-1/2 -translate-y-1/2 pointer-events-none`}
              />
            </div>
          </div>

          {/* User Filter */}
          <div>
            <label htmlFor="audit-user-filter" className="sr-only">
              {isArabic ? 'تصفية المستخدمين' : 'Filter by user'}
            </label>
            <div className="relative">
              <select
                id="audit-user-filter"
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className={`w-full text-xs ${
                  isArabic ? 'pr-3 pl-8' : 'pl-3 pr-8'
                } py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 focus-visible:ring-2 focus-visible:ring-purple-500 transition-all appearance-none cursor-pointer`}
                aria-label={isArabic ? 'تصفية حسب المستخدم' : 'Filter by user'}
              >
                <option value="all">
                  {isArabic ? `كافة المستخدمين (${uniqueUsers.length})` : `All Users (${uniqueUsers.length})`}
                </option>
                {uniqueUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
              <User
                className={`w-3.5 h-3.5 text-slate-400 absolute ${
                  isArabic ? 'left-3' : 'right-3'
                } top-1/2 -translate-y-1/2 pointer-events-none`}
              />
            </div>
          </div>

          {/* Date Filter Preset */}
          <div>
            <label htmlFor="audit-date-filter" className="sr-only">
              {isArabic ? 'تصفية النطاق الزمني' : 'Filter by date range'}
            </label>
            <div className="relative">
              <select
                id="audit-date-filter"
                value={datePreset}
                onChange={(e) => setDatePreset(e.target.value as any)}
                className={`w-full text-xs ${
                  isArabic ? 'pr-3 pl-8' : 'pl-3 pr-8'
                } py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 focus-visible:ring-2 focus-visible:ring-purple-500 transition-all appearance-none cursor-pointer`}
                aria-label={isArabic ? 'تصفية حسب الفترة الزمنية' : 'Filter by time period'}
              >
                <option value="all">{isArabic ? 'كافة الفترات الزمنية' : 'All Time'}</option>
                <option value="today">{isArabic ? 'اليوم فقط' : 'Today Only'}</option>
                <option value="7days">{isArabic ? 'آخر 7 أيام' : 'Last 7 Days'}</option>
                <option value="30days">{isArabic ? 'آخر 30 يوماً' : 'Last 30 Days'}</option>
                <option value="custom">{isArabic ? 'نطاق تاريخ مخصص...' : 'Custom Date Range...'}</option>
              </select>
              <Calendar
                className={`w-3.5 h-3.5 text-slate-400 absolute ${
                  isArabic ? 'left-3' : 'right-3'
                } top-1/2 -translate-y-1/2 pointer-events-none`}
              />
            </div>
          </div>
        </div>

        {/* Custom Date Range Sub-row (if custom selected) */}
        {datePreset === 'custom' && (
          <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-purple-500" />
              {isArabic ? 'تحديد الفترة المخصصة:' : 'Select custom period:'}
            </span>
            <div className="flex items-center gap-2">
              <label htmlFor="audit-start-date" className="text-xs text-slate-500 dark:text-slate-400">
                {isArabic ? 'من:' : 'From:'}
              </label>
              <input
                id="audit-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-purple-500/30 focus-visible:ring-2 focus-visible:ring-purple-500 focus:outline-hidden cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="audit-end-date" className="text-xs text-slate-500 dark:text-slate-400">
                {isArabic ? 'إلى:' : 'To:'}
              </label>
              <input
                id="audit-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-purple-500/30 focus-visible:ring-2 focus-visible:ring-purple-500 focus:outline-hidden cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Filter status & clear button bar */}
        <div className="flex items-center justify-between text-xs pt-1">
          <div className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span>
              {isArabic ? (
                <>
                  عرض <strong className="text-purple-600 dark:text-purple-400 font-mono">{filteredLogs.length}</strong> من أصل{' '}
                  <span className="font-mono">{logs.length}</span> حركة مسجلة
                </>
              ) : (
                <>
                  Showing <strong className="text-purple-600 dark:text-purple-400 font-mono">{filteredLogs.length}</strong> of{' '}
                  <span className="font-mono">{logs.length}</span> recorded events
                </>
              )}
            </span>
            {activeFiltersCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                {isArabic ? `${activeFiltersCount} فلاتر مطبقة` : `${activeFiltersCount} filters active`}
              </span>
            )}
          </div>

          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:underline flex items-center gap-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-hidden rounded-md px-1.5 py-0.5 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>{isArabic ? 'إعادة تعيين الفلاتر' : 'Reset filters'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Timeline Entries Stream ── */}
      {filteredLogs.length === 0 ? (
        <div className="rounded-2xl p-14 border-2 border-dashed border-slate-300 dark:border-slate-800 text-center">
          <Database className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            {isArabic ? 'لا توجد سجلات تدقيق مطابقة' : 'No matching audit records'}
          </h4>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
            {isArabic
              ? 'لم يتم العثور على أي حركات تناسب الفلاتر المحددة. جرب إعادة تعيين معايير البحث أو اختيار فترة زمنية أخرى.'
              : 'No activities found matching the specified filters. Try resetting search criteria or selecting a different date range.'}
          </p>
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-4 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-900/50 text-purple-600 dark:text-purple-300 transition-colors border border-purple-200 dark:border-purple-800 cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-hidden"
            >
              {isArabic ? 'إلغاء جميع الفلاتر' : 'Clear all filters'}
            </button>
          )}
        </div>
      ) : (
        <div
          className={`relative ${
            isArabic ? 'pr-6 sm:pr-8 before:right-3 sm:before:right-4' : 'pl-6 sm:pl-8 before:left-3 sm:before:left-4'
          } space-y-4 before:absolute before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800`}
        >
          {filteredLogs.map((log) => {
            const info = ACTION_LABELS[log.action] || DEFAULT_ACTION;
            const IconComp = info.icon;
            const actionLabel = isArabic ? info.labelAr : info.labelEn;
            const isExpanded = expandedId === log.id;
            const isRawJson = !!showRawJsonMap[log.id];
            const diffItems = AuditLogService.computeDiff(log.old_data, log.new_data);

            const tableInfo = TABLE_DISPLAY_NAMES[log.table_name] || {
              nameAr: log.table_name,
              nameEn: log.table_name,
              iconBadge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            };
            const tableName = isArabic ? (tableInfo.nameAr || log.table_name) : (tableInfo.nameEn || log.table_name);

            const triggerId = `audit-log-trigger-${log.id}`;
            const panelId = `audit-log-details-${log.id}`;
            const eventTimestamp = log.created_at || log.changed_at;

            return (
              <div key={log.id} className="relative group">
                {/* Timeline node icon */}
                <div
                  className={`absolute ${
                    isArabic ? '-right-6 sm:-right-8' : '-left-6 sm:-left-8'
                  } top-3.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 border-white dark:border-slate-900 shadow-2xs flex items-center justify-center shrink-0 z-10 transition-transform group-hover:scale-110 ${info.dotColor} text-white`}
                  aria-hidden="true"
                >
                  <IconComp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </div>

                {/* Entry Card Container */}
                <div
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden bg-white dark:bg-slate-900 shadow-2xs ${
                    isExpanded
                      ? 'border-purple-400 dark:border-purple-700/80 shadow-md ring-1 ring-purple-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-purple-200 dark:hover:border-purple-900/50 hover:shadow-xs'
                  }`}
                >
                  {/* Clickable Header Button */}
                  <button
                    type="button"
                    id={triggerId}
                    aria-expanded={isExpanded}
                    aria-controls={panelId}
                    aria-label={
                      isArabic
                        ? `تفاصيل العملية: ${actionLabel} في سجلات ${tableName}`
                        : `Operation details: ${actionLabel} in ${tableName}`
                    }
                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                    className={`w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                      isArabic ? 'text-right' : 'text-left'
                    } cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-hidden`}
                  >
                    {/* Left/Main Column: Badges & Info */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Step Index */}
                        <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-mono text-[10px] font-black">
                          #{filteredLogs.length - filteredLogs.indexOf(log)}
                        </span>

                        {/* Action Badge */}
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold border ${info.color}`}>
                          <IconComp className="w-3 h-3" />
                          <span>{actionLabel}</span>
                        </span>

                        {/* Table / Entity Badge */}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold ${tableInfo.iconBadge}`}>
                          <Database className="w-3 h-3 opacity-70" />
                          <span>{tableName}</span>
                        </span>

                        {/* User Identity */}
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/90 px-2 py-0.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                          <User className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                          <span>{log.user_name || log.changed_by || (isArabic ? 'النظام الآلي' : 'System')}</span>
                          {log.user_role && (
                            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-normal">
                              ({log.user_role})
                            </span>
                          )}
                        </span>

                        {/* Record ID Chip */}
                        <span className="text-[11px] text-slate-400 dark:text-slate-400 font-mono hidden md:inline">
                          {isArabic ? 'المعرف:' : 'ID:'} {log.record_id ? String(log.record_id).slice(0, 13) : '—'}
                        </span>
                      </div>

                      {/* Instant Action Narrative */}
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 text-start leading-snug">
                        {log.context ? (
                          <span className="text-slate-900 dark:text-white">{log.context}</span>
                        ) : diffItems.length > 0 ? (
                          <span className="text-slate-700 dark:text-slate-300">
                            {isArabic ? (
                              <>
                                تم تعديل {diffItems.length} حقول: {diffItems.slice(0, 3).map((d) => d.fieldLabelAr || d.field).join('، ')}{diffItems.length > 3 ? '...' : ''}
                              </>
                            ) : (
                              <>
                                Updated {diffItems.length} fields: {diffItems.slice(0, 3).map((d) => (d as any).fieldLabelEn || d.field).join(', ')}{diffItems.length > 3 ? '...' : ''}
                              </>
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-600 dark:text-slate-400">
                            {isArabic ? `إجراء ${actionLabel} على بيانات ${tableName}` : `${actionLabel} operation on ${tableName} data`}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Time & Chevron */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                      <div className={`${isArabic ? 'text-right sm:text-left' : 'text-left sm:text-right'} text-slate-500 dark:text-slate-400 text-xs`}>
                        <div className="flex items-center gap-1 font-mono text-[11px]">
                          <Clock className="w-3 h-3 text-slate-400 dark:text-slate-400" />
                          {eventTimestamp
                            ? new Date(eventTimestamp).toLocaleTimeString(isArabic ? 'ar-EG' : 'en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                              })
                            : '—'}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {eventTimestamp
                            ? new Date(eventTimestamp).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })
                            : '—'}
                        </div>
                      </div>

                      <div
                        className={`p-1.5 rounded-lg text-slate-400 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform ${
                          isExpanded ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300' : ''
                        }`}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </button>

                  {/* ── Expandable Details Panel ── */}
                  {isExpanded && (
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={triggerId}
                      className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 p-4 space-y-4"
                    >
                      {/* Metadata Chips Toolbar */}
                      <div className="flex flex-wrap items-center justify-between gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                        <div className="flex flex-wrap items-center gap-3 text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-slate-500 dark:text-slate-400">{isArabic ? 'معرف السجل:' : 'Record ID:'}</span>
                            <span className="font-mono text-purple-600 dark:text-purple-400 text-[11px] select-all">
                              {log.record_id || '—'}
                            </span>
                            {log.record_id && (
                              <button
                                type="button"
                                onClick={() => handleCopy(`rec-${log.id}`, log.record_id)}
                                className="p-1 text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-hidden rounded-md"
                                title={isArabic ? 'نسخ المعرف' : 'Copy ID'}
                                aria-label={isArabic ? 'نسخ المعرف' : 'Copy ID'}
                              >
                                {copiedId === `rec-${log.id}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                          </div>

                          {log.context && (
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-slate-500 dark:text-slate-400">{isArabic ? 'السياق التوضيحي:' : 'Context:'}</span>
                              <span className="text-slate-700 dark:text-slate-300 font-medium">
                                {log.context}
                              </span>
                            </div>
                          )}

                          {log.ip_address && (
                            <div className="flex items-center gap-1 font-mono text-[11px]">
                              <Laptop className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                              <span>{isArabic ? `عنوان الشبكة: ${log.ip_address}` : `IP: ${log.ip_address}`}</span>
                            </div>
                          )}
                        </div>

                        {/* Switch Structured vs Raw JSON */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => toggleRawJson(log.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-hidden"
                            aria-label={
                              isArabic
                                ? (isRawJson ? 'التبديل إلى عرض الفروقات المنظمة' : 'التبديل إلى عرض البيانات البرمجية الخام')
                                : (isRawJson ? 'Switch to structured diff' : 'Switch to raw JSON')
                            }
                          >
                            <Code2 className="w-3.5 h-3.5 text-purple-500" />
                            <span>
                              {isArabic
                                ? (isRawJson ? 'عرض الفروقات المنظمة' : 'عرض البيانات البرمجية الخام')
                                : (isRawJson ? 'Structured Diff' : 'Raw JSON')}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(
                                `json-${log.id}`,
                                JSON.stringify({ old_data: log.old_data, new_data: log.new_data }, null, 2)
                              )
                            }
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-hidden"
                            title={isArabic ? 'نسخ البيانات البرمجية كاملة' : 'Copy JSON'}
                            aria-label={isArabic ? 'نسخ البيانات البرمجية كاملة' : 'Copy JSON'}
                          >
                            {copiedId === `json-${log.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span className="hidden sm:inline">{isArabic ? 'نسخ' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Content View: Structured Diff vs Raw JSON */}
                      {isRawJson ? (
                        /* Raw JSON Side-by-Side */
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <div className="flex items-center justify-between text-[11px] font-bold text-rose-600 dark:text-rose-400 mb-1.5">
                              <span className="flex items-center gap-1">
                                <ArrowRight className={`w-3 h-3 ${isArabic ? 'rotate-180' : ''}`} />
                                {isArabic ? 'البيانات السابقة قبل التعديل' : 'Previous Data (old_data)'}
                              </span>
                            </div>
                            <pre className="p-3 rounded-xl bg-slate-900 dark:bg-slate-950 text-slate-100 border border-slate-800 dark:border-slate-800 text-[11px] font-mono overflow-x-auto whitespace-pre-wrap max-h-[260px] overflow-y-auto dir-ltr">
                              {log.old_data ? JSON.stringify(log.old_data, null, 2) : (isArabic ? '// لا توجد بيانات سابقة' : '// No previous data')}
                            </pre>
                          </div>

                          <div>
                            <div className="flex items-center justify-between text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mb-1.5">
                              <span className="flex items-center gap-1">
                                <ArrowRight className="w-3 h-3" />
                                {isArabic ? 'البيانات المحدثة بعد التعديل' : 'Updated Data (new_data)'}
                              </span>
                            </div>
                            <pre className="p-3 rounded-xl bg-slate-900 dark:bg-slate-950 text-slate-100 border border-slate-800 dark:border-slate-800 text-[11px] font-mono overflow-x-auto whitespace-pre-wrap max-h-[260px] overflow-y-auto dir-ltr">
                              {log.new_data ? JSON.stringify(log.new_data, null, 2) : (isArabic ? '// لا توجد بيانات محدثة' : '// No new data')}
                            </pre>
                          </div>
                        </div>
                      ) : (
                        /* Structured Human-Friendly Diff View */
                        <div className="space-y-3">
                          {log.action === 'UPDATE' && diffItems.length > 0 ? (
                            <div>
                              <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                                <SlidersHorizontal className="w-3.5 h-3.5 text-purple-500" />
                                <span>
                                  {isArabic ? `الحقول التي تم تعديلها (${diffItems.length}):` : `Modified Fields (${diffItems.length}):`}
                                </span>
                              </h5>
                              <div className="grid grid-cols-1 gap-2">
                                {diffItems.map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                                  >
                                    <div className="min-w-[140px]">
                                      <div className="font-bold text-slate-900 dark:text-white">
                                        {isArabic ? item.fieldLabelAr : ((item as any).fieldLabelEn || item.fieldLabelAr || item.field)}
                                      </div>
                                      <div className="text-[10px] text-slate-400 dark:text-slate-400 font-mono">
                                        {item.field}
                                      </div>
                                    </div>

                                    <div className="flex-1 flex items-center gap-2 flex-wrap">
                                      {/* Old Value */}
                                      <div className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 font-mono text-[11px] max-w-[280px] truncate line-through">
                                        {typeof item.oldValue === 'object'
                                          ? JSON.stringify(item.oldValue)
                                          : String(item.oldValue)}
                                      </div>

                                      <ArrowRight className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0 ${isArabic ? 'rotate-180' : ''}`} />

                                      {/* New Value */}
                                      <div className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 font-mono text-[11px] font-bold max-w-[280px] truncate">
                                        {typeof item.newValue === 'object'
                                          ? JSON.stringify(item.newValue)
                                          : String(item.newValue)}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : log.action === 'INSERT' && log.new_data ? (
                            <div>
                              <h5 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                                <Plus className="w-3.5 h-3.5" />
                                <span>
                                  {isArabic ? 'بيانات السجل الجديد عند الإنشاء:' : 'New Record Data upon Creation:'}
                                </span>
                              </h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {Object.entries(log.new_data).map(([k, v]) => (
                                  <div
                                    key={k}
                                    className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
                                  >
                                    <div className="text-[10px] text-slate-400 dark:text-slate-400 font-mono">{k}</div>
                                    <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate font-mono text-[11px]">
                                      {typeof v === 'object' ? JSON.stringify(v) : String(v ?? '—')}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : log.action === 'DELETE' && log.old_data ? (
                            <div>
                              <h5 className="text-xs font-bold text-rose-600 dark:text-rose-400 mb-2 flex items-center gap-1.5">
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>
                                  {isArabic ? 'بيانات السجل التي تم حذفها:' : 'Deleted Record Data:'}
                                </span>
                              </h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {Object.entries(log.old_data).map(([k, v]) => (
                                  <div
                                    key={k}
                                    className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs opacity-80"
                                  >
                                    <div className="text-[10px] text-slate-400 dark:text-slate-400 font-mono">{k}</div>
                                    <div className="font-bold text-rose-700 dark:text-rose-300 mt-0.5 truncate font-mono text-[11px]">
                                      {typeof v === 'object' ? JSON.stringify(v) : String(v ?? '—')}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
                              <FileText className="w-6 h-6 mx-auto text-slate-300 dark:text-slate-600 mb-1" />
                              <span>
                                {isArabic
                                  ? 'لا توجد فروقات محددة بين الحقول أو تم حفظ العملية بدون تغييرات هيكلية'
                                  : 'No specific field differences detected or operation recorded without direct schema changes'}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

AuditLogTab.displayName = 'AuditLogTab';
