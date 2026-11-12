'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Clock,
  History,
  Search,
  Download,
  Filter,
  Users,
  Activity,
  Layers,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Shield,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  Eye,
  RefreshCw,
  Loader2,
  Sparkles,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Laptop,
  Smartphone,
  Tablet,
  Monitor,
  Globe,
  Wifi,
  CalendarRange,
  X,
  SlidersHorizontal,
  Table as TableIcon,
  ListFilter,
  Check,
  RotateCcw
} from 'lucide-react';
import { AuditLogEntry, UserWorkDuration } from '@/types';
import { AuditLogService, TABLE_DISPLAY_NAMES, ACTION_CONFIG } from '@/lib/services/auditLog.service';
import { UserActivityService, formatDuration } from '@/lib/services/userActivity.service';
import { UserChangelogModal } from './UserChangelogModal';

// ── Helpers & Subcomponents ──

/**
 * Deduce device type and label from user agent or context string
 */
function getDeviceDetails(userAgentOrContext?: string): {
  type: 'desktop' | 'mobile' | 'tablet';
  labelAr: string;
  icon: typeof Monitor;
} {
  if (!userAgentOrContext) {
    return { type: 'desktop', labelAr: 'حاسوب مكتبي', icon: Monitor };
  }
  const s = userAgentOrContext.toLowerCase();
  if (s.includes('ipad') || s.includes('tablet')) {
    return { type: 'tablet', labelAr: 'جهاز لوحي', icon: Tablet };
  }
  if (s.includes('iphone') || s.includes('android') || s.includes('mobile')) {
    return { type: 'mobile', labelAr: 'هاتف محمول', icon: Smartphone };
  }
  if (s.includes('macintosh') || s.includes('mac os') || s.includes('windows') || s.includes('linux')) {
    return { type: 'desktop', labelAr: 'كمبيوتر مكتبي', icon: Laptop };
  }
  return { type: 'desktop', labelAr: 'متصفح ويب', icon: Monitor };
}

/**
 * Visual badge for Device & IP indicators
 */
function DeviceIpBadge({
  ipAddress,
  userAgent,
  context,
  compact = false,
}: {
  ipAddress?: string;
  userAgent?: string;
  context?: string;
  compact?: boolean;
}) {
  const device = getDeviceDetails(userAgent || context);
  const DeviceIcon = device.icon;
  const ip = ipAddress || (context && context.includes('.') && !context.includes(' ') ? context : null);

  if (compact) {
    return (
      <div className="inline-flex items-center gap-1.5 flex-wrap">
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 text-[10px] font-medium"
          title={device.labelAr}
        >
          <DeviceIcon className="w-3 h-3 text-indigo-500 shrink-0" />
          <span>{device.labelAr}</span>
        </span>
        {ip ? (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/80 font-mono text-[10px]"
            title={`عنوان IP: ${ip}`}
          >
            <Globe className="w-2.5 h-2.5 text-sky-500 shrink-0" />
            <span>{ip}</span>
          </span>
        ) : (
          <span className="text-[10px] font-mono text-slate-400">شبكة داخلية</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 text-[11px] w-fit">
        <DeviceIcon className="w-3 h-3 text-indigo-500 shrink-0" />
        <span className="font-medium">{device.labelAr}</span>
      </div>
      <div className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-500 dark:text-slate-400">
        <Globe className="w-2.5 h-2.5 text-sky-500 shrink-0" />
        <span>{ip || 'IP داخلي مسجل'}</span>
      </div>
    </div>
  );
}

/**
 * Visual badge for session duration with hr/m breakdown
 */
function DurationBadge({
  minutes,
  formatted,
  formattedAr,
  type = 'today',
}: {
  minutes: number;
  formatted: string;
  formattedAr: string;
  type?: 'today' | 'total';
}) {
  const isZero = minutes === 0;

  if (isZero) {
    return (
      <div className="flex flex-col items-center justify-center">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-mono text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/80">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>0د (غير مسجل)</span>
        </span>
        <span className="text-[10px] text-slate-400 mt-0.5">لا يوجد نشاط</span>
      </div>
    );
  }

  const isToday = type === 'today';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return (
    <div className="flex flex-col items-center justify-center">
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-mono text-xs font-black shadow-xs border transition-all ${
          isToday
            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/80'
            : 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800/80'
        }`}
        title={`${hours} ساعة و ${mins} دقيقة`}
      >
        <Clock
          className={`w-3.5 h-3.5 ${
            isToday ? 'text-emerald-600 dark:text-emerald-400' : 'text-purple-600 dark:text-purple-400'
          }`}
        />
        <span className="tracking-tight">{formatted}</span>
      </span>
      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
        {formattedAr}
      </span>
    </div>
  );
}

/**
 * Accessible, sortable table header with RTL support and ARIA semantics
 */
interface SortableThProps {
  label: string;
  sortKey: string;
  currentSortKey: string;
  currentSortDir: 'asc' | 'desc';
  onSort: (key: string) => void;
  align?: 'right' | 'center' | 'left';
  className?: string;
}

function SortableTh({
  label,
  sortKey,
  currentSortKey,
  currentSortDir,
  onSort,
  align = 'right',
  className = '',
}: SortableThProps) {
  const isSorted = currentSortKey === sortKey;
  const ariaSort = isSorted ? (currentSortDir === 'asc' ? 'ascending' : 'descending') : 'none';

  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className={`p-3.5 ${
        align === 'center' ? 'text-center' : align === 'left' ? 'text-left' : 'text-right'
      } ${className}`}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1.5 group font-bold text-xs transition-colors hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded px-1 -mx-1 cursor-pointer select-none ${
          isSorted
            ? 'text-indigo-700 dark:text-indigo-300 font-black'
            : 'text-slate-600 dark:text-slate-300'
        }`}
        aria-label={`ترتيب حسب ${label}، الترتيب الحالي: ${
          isSorted ? (currentSortDir === 'asc' ? 'تصاعدي' : 'تنازلي') : 'غير مفعل'
        }`}
      >
        <span>{label}</span>
        <span className="inline-flex shrink-0">
          {isSorted ? (
            currentSortDir === 'asc' ? (
              <ArrowUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            ) : (
              <ArrowDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            )
          ) : (
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity" />
          )}
        </span>
      </button>
    </th>
  );
}

/**
 * Accessible pagination component with RTL page controls
 */
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
}

function AccessiblePagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  itemLabel = 'سجل',
}: PaginationProps) {
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate visible page numbers with windowing
  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div
      role="navigation"
      aria-label="التنقل بين الصفحات"
      className="p-4 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 rounded-b-3xl flex flex-col sm:flex-row items-center justify-between gap-4 select-none"
    >
      {/* Summary and Page Size */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
        <span aria-live="polite" className="font-medium">
          عرض <span className="font-mono font-bold text-slate-900 dark:text-white">{startItem}</span> إلى{' '}
          <span className="font-mono font-bold text-slate-900 dark:text-white">{endItem}</span> من أصل{' '}
          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{totalItems}</span> {itemLabel}
        </span>

        <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>

        <div className="flex items-center gap-1.5">
          <label htmlFor="pageSizeSelect" className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            لكل صفحة:
          </label>
          <select
            id="pageSizeSelect"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            aria-label="تحديد عدد العناصر المعروضة في الصفحة"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-1">
        {/* First Page (points Right in RTL) */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          aria-label="الانتقال إلى الصفحة الأولى"
          className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>

        {/* Previous Page */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="الانتقال إلى الصفحة السابقة"
          className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Page Number Buttons */}
        <div className="flex items-center gap-1 px-1">
          {getPageNumbers().map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="px-1 text-slate-400 font-mono text-xs">
                  …
                </span>
              );
            }
            const isActive = page === currentPage;
            return (
              <button
                key={`page-${page}`}
                type="button"
                onClick={() => onPageChange(page)}
                aria-label={`الصفحة ${page}`}
                aria-current={isActive ? 'page' : undefined}
                className={`w-7 h-7 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80'
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="الانتقال إلى الصفحة التالية"
          className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Last Page */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="الانتقال إلى الصفحة الأخيرة"
          className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Main UserAuditTab Component ──

interface UserAuditTabProps {
  profiles: any[];
  isLoadingProfiles: boolean;
}

export const UserAuditTab: React.FC<UserAuditTabProps> = ({ profiles, isLoadingProfiles }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  // Filters for master changelog stream
  const [search, setSearch] = useState('');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [tableFilter, setTableFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | '30days' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // View mode: 'table' (Timeline Table) vs 'timeline' (Timeline Cards Stream)
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Sorting for Master Changelog Table
  const [logSortKey, setLogSortKey] = useState<string>('timestamp');
  const [logSortDir, setLogSortDir] = useState<'asc' | 'desc'>('desc');

  // Pagination for Master Changelog Table
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Sorting and filtering for Users Work Table
  const [userSearch, setUserSearch] = useState('');
  const [userSortKey, setUserSortKey] = useState<string>('totalWorkMinutes');
  const [userSortDir, setUserSortDir] = useState<'asc' | 'desc'>('desc');
  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(10);

  // Modal state for viewing a specific user's changelog
  const [selectedUserForModal, setSelectedUserForModal] = useState<UserWorkDuration | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load audit logs
  const loadLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const data = await AuditLogService.getFullChangelog({ limit: 500 });
      setLogs(data);
    } catch (err) {
      console.error('Error loading full changelog:', err);
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Compute work duration metrics for every user
  const usersMetrics: UserWorkDuration[] = useMemo(() => {
    return UserActivityService.getAllUsersMetrics(profiles, logs);
  }, [profiles, logs]);

  // High level aggregated KPIs
  const aggregatedStats = useMemo(() => {
    const totalMinutesAll = usersMetrics.reduce((sum, u) => sum + u.totalWorkMinutes, 0);
    const activeTodayCount = usersMetrics.filter((u) => u.todayWorkMinutes > 0 || u.isOnline).length;
    const totalChangesAll = logs.length;
    const onlineNowCount = usersMetrics.filter((u) => u.isOnline).length;

    return {
      totalWorkFormatted: formatDuration(totalMinutesAll, false),
      totalWorkFormattedAr: formatDuration(totalMinutesAll, true),
      activeTodayCount,
      onlineNowCount,
      totalChangesAll,
      avgMinutesPerUser: usersMetrics.length > 0 ? Math.round(totalMinutesAll / usersMetrics.length) : 0,
    };
  }, [usersMetrics, logs]);

  // Handle user table sorting
  const handleUserSort = (key: string) => {
    if (userSortKey === key) {
      setUserSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setUserSortKey(key);
      setUserSortDir('desc');
    }
  };

  // Filter and sort users list
  const filteredAndSortedUsers = useMemo(() => {
    let list = [...usersMetrics];

    // Filter by userSearch
    if (userSearch.trim()) {
      const q = userSearch.toLowerCase();
      list = list.filter(
        (u) =>
          u.userName.toLowerCase().includes(q) ||
          u.userEmail.toLowerCase().includes(q) ||
          u.roles.some((r) => r.toLowerCase().includes(q)) ||
          (u.lastIpAddress || '').includes(q)
      );
    }

    // Sort
    list.sort((a, b) => {
      let comp = 0;
      if (userSortKey === 'userName') {
        comp = a.userName.localeCompare(b.userName, 'ar');
      } else if (userSortKey === 'isOnline') {
        comp = a.isOnline === b.isOnline ? 0 : a.isOnline ? 1 : -1;
        if (comp === 0) {
          const timeA = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0;
          const timeB = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0;
          comp = timeA - timeB;
        }
      } else if (userSortKey === 'todayWorkMinutes') {
        comp = a.todayWorkMinutes - b.todayWorkMinutes;
      } else if (userSortKey === 'totalWorkMinutes') {
        comp = a.totalWorkMinutes - b.totalWorkMinutes;
      } else if (userSortKey === 'totalChangesCount') {
        comp = a.totalChangesCount - b.totalChangesCount;
      } else if (userSortKey === 'lastIpAddress') {
        comp = (a.lastIpAddress || '').localeCompare(b.lastIpAddress || '');
      }
      return userSortDir === 'asc' ? comp : -comp;
    });

    return list;
  }, [usersMetrics, userSearch, userSortKey, userSortDir]);

  // Paginated users
  const paginatedUsers = useMemo(() => {
    const start = (userPage - 1) * userPageSize;
    return filteredAndSortedUsers.slice(start, start + userPageSize);
  }, [filteredAndSortedUsers, userPage, userPageSize]);

  const totalUserPages = Math.ceil(filteredAndSortedUsers.length / userPageSize) || 1;

  // Filter master logs stream
  const filteredLogs = useMemo(() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    return logs.filter((log) => {
      // User filter
      if (userFilter !== 'all' && log.changed_by !== userFilter && log.user_email !== userFilter) {
        return false;
      }
      // Action filter
      if (actionFilter !== 'all' && log.action !== actionFilter) {
        return false;
      }
      // Table filter
      if (tableFilter !== 'all' && log.table_name !== tableFilter) {
        return false;
      }
      // Date filter
      if (dateFilter !== 'all') {
        const logTime = new Date((log.changed_at || log.created_at) as string).getTime();
        if (isNaN(logTime)) return true;

        if (dateFilter === 'today') {
          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);
          if (logTime < startOfToday.getTime()) return false;
        } else if (dateFilter === '7days') {
          if (now - logTime > 7 * dayMs) return false;
        } else if (dateFilter === '30days') {
          if (now - logTime > 30 * dayMs) return false;
        } else if (dateFilter === 'custom') {
          if (customStartDate) {
            const start = new Date(customStartDate);
            start.setHours(0, 0, 0, 0);
            if (logTime < start.getTime()) return false;
          }
          if (customEndDate) {
            const end = new Date(customEndDate);
            end.setHours(23, 59, 59, 999);
            if (logTime > end.getTime()) return false;
          }
        }
      }
      // Search keyword
      if (search.trim()) {
        const s = search.toLowerCase();
        const matchesUser =
          (log.user_name || '').toLowerCase().includes(s) ||
          (log.user_email || '').toLowerCase().includes(s) ||
          (log.changed_by || '').toLowerCase().includes(s);
        const matchesTable =
          (log.table_name || '').toLowerCase().includes(s) ||
          (TABLE_DISPLAY_NAMES[log.table_name]?.nameAr || '').toLowerCase().includes(s);
        const matchesRecord = (log.record_id || '').toLowerCase().includes(s);
        const matchesIp = (log.ip_address || '').toLowerCase().includes(s);
        const matchesContext = (log.context || '').toLowerCase().includes(s);
        const matchesDiff =
          JSON.stringify(log.old_data || {}).toLowerCase().includes(s) ||
          JSON.stringify(log.new_data || {}).toLowerCase().includes(s);

        if (!matchesUser && !matchesTable && !matchesRecord && !matchesIp && !matchesContext && !matchesDiff) {
          return false;
        }
      }
      return true;
    });
  }, [logs, userFilter, actionFilter, tableFilter, dateFilter, customStartDate, customEndDate, search]);

  // Handle master changelog sorting
  const handleLogSort = (key: string) => {
    if (logSortKey === key) {
      setLogSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setLogSortKey(key);
      setLogSortDir('desc');
    }
  };

  // Sort master changelog
  const sortedLogs = useMemo(() => {
    const list = [...filteredLogs];
    list.sort((a, b) => {
      let comp = 0;
      if (logSortKey === 'timestamp') {
        const timeA = new Date((a.changed_at || a.created_at) as string).getTime() || 0;
        const timeB = new Date((b.changed_at || b.created_at) as string).getTime() || 0;
        comp = timeA - timeB;
      } else if (logSortKey === 'userName') {
        const nameA = a.user_name || a.changed_by || '';
        const nameB = b.user_name || b.changed_by || '';
        comp = nameA.localeCompare(nameB, 'ar');
      } else if (logSortKey === 'action') {
        comp = (a.action || '').localeCompare(b.action || '');
      } else if (logSortKey === 'tableName') {
        const nameA = TABLE_DISPLAY_NAMES[a.table_name]?.nameAr || a.table_name;
        const nameB = TABLE_DISPLAY_NAMES[b.table_name]?.nameAr || b.table_name;
        comp = nameA.localeCompare(nameB, 'ar');
      } else if (logSortKey === 'recordId') {
        comp = (a.record_id || '').localeCompare(b.record_id || '');
      } else if (logSortKey === 'ipAddress') {
        comp = (a.ip_address || '').localeCompare(b.ip_address || '');
      }
      return logSortDir === 'asc' ? comp : -comp;
    });
    return list;
  }, [filteredLogs, logSortKey, logSortDir]);

  // Reset pagination to page 1 on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, userFilter, actionFilter, tableFilter, dateFilter, customStartDate, customEndDate]);

  // Paginated logs
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedLogs.slice(start, start + pageSize);
  }, [sortedLogs, currentPage, pageSize]);

  const totalLogPages = Math.ceil(sortedLogs.length / pageSize) || 1;

  const handleOpenUserModal = (metrics: UserWorkDuration) => {
    setSelectedUserForModal(metrics);
    setIsModalOpen(true);
  };

  const handleExportAll = () => {
    AuditLogService.exportChangelogToExcel(sortedLogs, 'سجل_تدقيق_المستخدمين_الشامل');
  };

  const handleResetFilters = () => {
    setSearch('');
    setUserFilter('all');
    setActionFilter('all');
    setTableFilter('all');
    setDateFilter('all');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  const isAnyFilterActive =
    search !== '' ||
    userFilter !== 'all' ||
    actionFilter !== 'all' ||
    tableFilter !== 'all' ||
    dateFilter !== 'all';

  return (
    <div className="space-y-8 text-right" dir="rtl">
      {/* ── 1. Top Executive Metrics Strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total System Work Hours */}
        <div className="rounded-3xl p-5 bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-transparent border border-purple-500/20 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-purple-700 dark:text-purple-400">
            <span className="text-xs font-bold">إجمالي ساعات عمل المستخدمين</span>
            <div className="p-2 rounded-xl bg-purple-500/10">
              <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-2">
            {aggregatedStats.totalWorkFormatted}
          </div>
          <div className="text-xs text-purple-600 dark:text-purple-400 font-bold mt-1">
            {aggregatedStats.totalWorkFormattedAr}
          </div>
        </div>

        {/* Active Today & Online */}
        <div className="rounded-3xl p-5 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
            <span className="text-xs font-bold">النشطون اليوم / المتصلون الآن</span>
            <div className="p-2 rounded-xl bg-emerald-500/10">
              <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-2">
            {aggregatedStats.activeTodayCount}{' '}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
              من {profiles.length}
            </span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{aggregatedStats.onlineNowCount} متصل الآن بالبوابة</span>
          </div>
        </div>

        {/* Total Changelog Events */}
        <div className="rounded-3xl p-5 bg-gradient-to-br from-sky-500/10 via-blue-500/5 to-transparent border border-sky-500/20 shadow-xs">
          <div className="flex items-center justify-between text-sky-700 dark:text-sky-400">
            <span className="text-xs font-bold">إجمالي حركات وسجل التغييرات</span>
            <div className="p-2 rounded-xl bg-sky-500/10">
              <Activity className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            </div>
          </div>
          <div className="text-2xl font-black text-sky-600 dark:text-sky-400 font-mono mt-2">
            {aggregatedStats.totalChangesAll}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            حركات مسجلة تشمل الإنشاء والتعديل والحذف
          </div>
        </div>

        {/* Average Time per User */}
        <div className="rounded-3xl p-5 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400">
            <span className="text-xs font-bold">متوسط وقت العمل لكل مستخدم</span>
            <div className="p-2 rounded-xl bg-amber-500/10">
              <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-2">
            {formatDuration(aggregatedStats.avgMinutesPerUser, false)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {formatDuration(aggregatedStats.avgMinutesPerUser, true)}
          </div>
        </div>
      </div>

      {/* ── 2. Per-User Work Duration & Changelog Quick Table ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span>ساعات عمل ونشاط منسوبي النظام (Per-User Work Duration)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              حساب مدة العمل بالساعات والدقائق بناءً على النشاط المباشر وحركات التعديل مع مؤشرات الأجهزة والـ IP
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick search inside users table */}
            <div className="relative min-w-[180px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="بحث عن مستخدم أو دور..."
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  setUserPage(1);
                }}
                className="w-full pr-8 pl-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            <button
              type="button"
              onClick={loadLogs}
              disabled={loadingLogs}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
              <span>تحديث البيانات</span>
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-xs text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                <SortableTh
                  label="المستخدم"
                  sortKey="userName"
                  currentSortKey={userSortKey}
                  currentSortDir={userSortDir}
                  onSort={handleUserSort}
                />
                <th className="p-3.5 text-right">الأدوار والصلاحيات</th>
                <SortableTh
                  label="حالة الاتصال والنشاط"
                  sortKey="isOnline"
                  currentSortKey={userSortKey}
                  currentSortDir={userSortDir}
                  onSort={handleUserSort}
                />
                <SortableTh
                  label="الجهاز وعنوان IP"
                  sortKey="lastIpAddress"
                  currentSortKey={userSortKey}
                  currentSortDir={userSortDir}
                  onSort={handleUserSort}
                />
                <SortableTh
                  label="نشاط اليوم (Today)"
                  sortKey="todayWorkMinutes"
                  currentSortKey={userSortKey}
                  currentSortDir={userSortDir}
                  onSort={handleUserSort}
                  align="center"
                />
                <SortableTh
                  label="إجمالي مدة العمل (Total)"
                  sortKey="totalWorkMinutes"
                  currentSortKey={userSortKey}
                  currentSortDir={userSortDir}
                  onSort={handleUserSort}
                  align="center"
                />
                <SortableTh
                  label="الحركات والتعديلات"
                  sortKey="totalChangesCount"
                  currentSortKey={userSortKey}
                  currentSortDir={userSortDir}
                  onSort={handleUserSort}
                  align="center"
                />
                <th className="p-3.5 text-center">سجل التعديلات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoadingProfiles ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 dark:text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-600 mb-2" />
                    <span>جاري تحميل بيانات المستخدمين...</span>
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 dark:text-slate-500">
                    لا يوجد مستخدمون يطابقون معايير البحث
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => (
                  <tr
                    key={u.userId}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {/* User info */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold flex items-center justify-center shrink-0">
                          {u.userName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {u.userName}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {u.userEmail}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Roles */}
                    <td className="p-3.5">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((r) => (
                          <span
                            key={r}
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Online / Last Active */}
                    <td className="p-3.5">
                      {u.isOnline ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>متصل الآن</span>
                        </span>
                      ) : (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {u.lastActiveAt ? (
                            <>
                              <span className="font-mono">
                                {new Date(u.lastActiveAt).toLocaleDateString('ar-EG', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                              <span className="block text-[10px] text-slate-400">
                                {new Date(u.lastActiveAt).toLocaleTimeString('ar-EG', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Device & IP Indicator */}
                    <td className="p-3.5">
                      <DeviceIpBadge
                        ipAddress={u.lastIpAddress}
                        userAgent={u.lastDevice}
                        compact={true}
                      />
                    </td>

                    {/* Today work time badge */}
                    <td className="p-3.5 text-center">
                      <DurationBadge
                        minutes={u.todayWorkMinutes}
                        formatted={u.formattedToday}
                        formattedAr={u.formattedTodayAr}
                        type="today"
                      />
                    </td>

                    {/* Total work time badge */}
                    <td className="p-3.5 text-center">
                      <DurationBadge
                        minutes={u.totalWorkMinutes}
                        formatted={u.formattedTotal}
                        formattedAr={u.formattedTotalAr}
                        type="total"
                      />
                    </td>

                    {/* Changes count */}
                    <td className="p-3.5 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono font-bold text-slate-700 dark:text-slate-300 text-xs border border-slate-200 dark:border-slate-700">
                        <Activity className="w-3 h-3 text-sky-500" />
                        <span>{u.totalChangesCount}</span>
                      </span>
                    </td>

                    {/* Action */}
                    <td className="p-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleOpenUserModal(u)}
                        aria-label={`عرض سجل تعديلات ${u.userName}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer shadow-xs focus:ring-2 focus:ring-indigo-500"
                      >
                        <History className="w-3.5 h-3.5" />
                        <span>سجل التعديلات</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Accessible pagination for users table if needed */}
          {filteredAndSortedUsers.length > userPageSize && (
            <AccessiblePagination
              currentPage={userPage}
              totalPages={totalUserPages}
              pageSize={userPageSize}
              totalItems={filteredAndSortedUsers.length}
              onPageChange={setUserPage}
              onPageSizeChange={(newSize) => {
                setUserPageSize(newSize);
                setUserPage(1);
              }}
              pageSizeOptions={[5, 10, 20]}
              itemLabel="مستخدم"
            />
          )}
        </div>
      </div>

      {/* ── 3. Full Master Changelog & Timeline Table ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        {/* Header with Title and Mode Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                سجل التدقيق الزمني وحركات النظام (User Audit Timeline & Changelog)
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              متابعة وتدقيق كافة التعديلات والتحديثات وعمليات الحذف وتغييرات الحالة مع تفاصيل الأجهزة والـ IP ومقارنة الحقول
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Toggle */}
            <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                aria-label="عرض الجدول الزمني المنظم"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>جدول زمني (Table)</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('timeline')}
                aria-label="عرض المخطط الزمني التسلسلي"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'timeline'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>مخطط تفصيلي (Cards)</span>
              </button>
            </div>

            {/* Export to Excel */}
            <button
              type="button"
              onClick={handleExportAll}
              disabled={filteredLogs.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>تصدير Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* ── Toolbar & Enhanced Filters ── */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
          {/* Row 1: Search & Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="بحث بالاسم، البريد، الـ IP، معرف السجل، أو الجدول..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* User Filter */}
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="all">كل المستخدمين</option>
              {usersMetrics.map((u) => (
                <option key={u.userId} value={u.userId}>
                  {u.userName} ({u.totalChangesCount} حركة)
                </option>
              ))}
            </select>

            {/* Action Filter */}
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="all">كل أنواع الحركات</option>
              <option value="INSERT">إنشاء سجل (INSERT)</option>
              <option value="UPDATE">تعديل بيانات (UPDATE)</option>
              <option value="DELETE">حذف سجل (DELETE)</option>
              <option value="STATUS_CHANGE">تغيير حالة (STATUS_CHANGE)</option>
            </select>

            {/* Table / Module Filter */}
            <select
              value={tableFilter}
              onChange={(e) => setTableFilter(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="all">كل الجداول والوحدات</option>
              {Object.entries(TABLE_DISPLAY_NAMES).map(([key, info]) => (
                <option key={key} value={key}>
                  {info.nameAr}
                </option>
              ))}
            </select>

            {/* Reset Filters button */}
            {isAnyFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors cursor-pointer"
                title="إلغاء جميع الفلاتر"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إلغاء الفلاتر</span>
              </button>
            )}
          </div>

          {/* Row 2: Comprehensive Date Filter Chips & Custom Range */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span>نطاق التاريخ:</span>
              </span>

              {/* Date Filter Chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { key: 'all', label: 'الكل' },
                  { key: 'today', label: 'اليوم فقط' },
                  { key: '7days', label: 'آخر 7 أيام' },
                  { key: '30days', label: 'آخر 30 يوماً' },
                  { key: 'custom', label: 'نطاق مخصص...' },
                ].map((item) => {
                  const isActive = dateFilter === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setDateFilter(item.key as any)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Date Range Pickers (shown when custom is selected) */}
            {dateFilter === 'custom' && (
              <div className="flex flex-wrap items-center gap-2 animate-in fade-in duration-150">
                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-bold">من:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-bold">إلى:</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                {(customStartDate || customEndDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomStartDate('');
                      setCustomEndDate('');
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200"
                    title="تفريغ التواريخ"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Changelog Content: Loading / Empty / Data ── */}
        {loadingLogs ? (
          <div className="py-20 text-center text-slate-400 dark:text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-2" />
            <p className="text-xs font-bold">جاري تحميل سجل التدقيق الزمني الشامل...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
            <History className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-base font-bold text-slate-700 dark:text-slate-300">
              لا توجد سجلات تدقيق تطابق معايير البحث والفلترة
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              جرب تغيير كلمات البحث، أو توسيع نطاق التاريخ، أو اختيار مستخدم آخر.
            </p>
            {isAnyFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold transition-opacity cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة ضبط الفلاتر</span>
              </button>
            )}
          </div>
        ) : viewMode === 'table' ? (
          /* ── View 1: Timeline Table (Tabular) ── */
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                    <SortableTh
                      label="التوقيت الزمني"
                      sortKey="timestamp"
                      currentSortKey={logSortKey}
                      currentSortDir={logSortDir}
                      onSort={handleLogSort}
                    />
                    <SortableTh
                      label="المستخدم المنفذ"
                      sortKey="userName"
                      currentSortKey={logSortKey}
                      currentSortDir={logSortDir}
                      onSort={handleLogSort}
                    />
                    <SortableTh
                      label="نوع الحركة"
                      sortKey="action"
                      currentSortKey={logSortKey}
                      currentSortDir={logSortDir}
                      onSort={handleLogSort}
                      align="center"
                    />
                    <SortableTh
                      label="الوحدة / الجدول"
                      sortKey="tableName"
                      currentSortKey={logSortKey}
                      currentSortDir={logSortDir}
                      onSort={handleLogSort}
                    />
                    <SortableTh
                      label="معرف السجل"
                      sortKey="recordId"
                      currentSortKey={logSortKey}
                      currentSortDir={logSortDir}
                      onSort={handleLogSort}
                    />
                    <SortableTh
                      label="الجهاز وعنوان IP"
                      sortKey="ipAddress"
                      currentSortKey={logSortKey}
                      currentSortDir={logSortDir}
                      onSort={handleLogSort}
                    />
                    <th className="p-3.5 text-right">ملخص التغيير</th>
                    <th className="p-3.5 text-center">التفاصيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedLogs.map((log) => {
                    const tableInfo = TABLE_DISPLAY_NAMES[log.table_name] || {
                      nameAr: log.table_name,
                      nameEn: log.table_name,
                      iconBadge: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
                    };
                    const actionInfo = ACTION_CONFIG[log.action] || {
                      labelAr: log.action,
                      labelEn: log.action,
                      badgeCls: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
                    };
                    const isExpanded = expandedLogId === log.id;
                    const diffItems = AuditLogService.computeDiff(log.old_data, log.new_data);

                    const timestampStr = log.changed_at || log.created_at;
                    const logDate = timestampStr ? new Date(timestampStr as string) : null;

                    return (
                      <React.Fragment key={log.id}>
                        <tr
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${
                            isExpanded ? 'bg-indigo-50/30 dark:bg-indigo-950/20' : ''
                          }`}
                        >
                          {/* Timestamp with timeline bullet */}
                          <td className="p-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                              <div>
                                <div className="font-mono font-bold text-slate-900 dark:text-white">
                                  {logDate
                                    ? logDate.toLocaleTimeString('ar-EG', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })
                                    : '-'}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {logDate
                                    ? logDate.toLocaleDateString('ar-EG', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                      })
                                    : '-'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* User info */}
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {log.user_name || log.changed_by || 'النظام'}
                            </div>
                            {log.user_email && (
                              <div className="text-[10px] text-slate-400 font-mono">
                                {log.user_email}
                              </div>
                            )}
                          </td>

                          {/* Action badge */}
                          <td className="p-3.5 text-center whitespace-nowrap">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${actionInfo.badgeCls}`}
                            >
                              {actionInfo.labelAr}
                            </span>
                          </td>

                          {/* Table / Module name */}
                          <td className="p-3.5 whitespace-nowrap">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-lg text-[11px] font-bold ${tableInfo.iconBadge}`}
                            >
                              {tableInfo.nameAr}
                            </span>
                          </td>

                          {/* Record ID */}
                          <td className="p-3.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                            {log.record_id ? `#${log.record_id.slice(0, 8)}` : '—'}
                          </td>

                          {/* Device & IP Indicator */}
                          <td className="p-3.5">
                            <DeviceIpBadge
                              ipAddress={log.ip_address}
                              userAgent={log.user_agent}
                              context={log.context}
                              compact={true}
                            />
                          </td>

                          {/* Change Summary */}
                          <td className="p-3.5 max-w-[200px]">
                            {diffItems.length > 0 ? (
                              <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                                تعديل {diffItems.length} حقل ({diffItems.map((d) => d.fieldLabelAr).slice(0, 2).join('، ')}
                                {diffItems.length > 2 ? '...' : ''})
                              </span>
                            ) : log.action === 'INSERT' ? (
                              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                إنشاء سجل جديد بالكامل
                              </span>
                            ) : log.action === 'DELETE' ? (
                              <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                                حذف السجل من قاعدة البيانات
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">
                                {log.context || 'حركة عامة'}
                              </span>
                            )}
                          </td>

                          {/* Expand chevron */}
                          <td className="p-3.5 text-center">
                            <button
                              type="button"
                              aria-label={isExpanded ? 'طي التفاصيل' : 'عرض التفاصيل والمقارنة'}
                              className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:bg-indigo-950/40 dark:hover:bg-slate-800 transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                        </tr>

                        {/* Nested Expanded Row */}
                        {isExpanded && (
                          <tr className="bg-slate-50/60 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800">
                            <td colSpan={8} className="p-4 space-y-4">
                              {/* Diff Comparison Table */}
                              {diffItems.length > 0 ? (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                                    <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                    <span>مقارنة الحقول المعدلة (Field Diffs):</span>
                                  </div>
                                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
                                    <table className="w-full text-xs text-right border-collapse">
                                      <thead>
                                        <tr className="bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                                          <th className="p-2.5">الحقل المعدل</th>
                                          <th className="p-2.5">القيمة السابقة (Old Value)</th>
                                          <th className="p-2.5">القيمة الجديدة (New Value)</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {diffItems.map((item, idx) => (
                                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                            <td className="p-2.5 font-bold text-slate-900 dark:text-white">
                                              {item.fieldLabelAr}
                                              <span className="text-[10px] text-slate-400 font-mono block">
                                                {item.field}
                                              </span>
                                            </td>
                                            <td className="p-2.5 font-mono text-[11px] text-rose-600 dark:text-rose-400 bg-rose-50/40 dark:bg-rose-950/20">
                                              {typeof item.oldValue === 'object'
                                                ? JSON.stringify(item.oldValue)
                                                : String(item.oldValue ?? '—')}
                                            </td>
                                            <td className="p-2.5 font-mono text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20">
                                              {typeof item.newValue === 'object'
                                                ? JSON.stringify(item.newValue)
                                                : String(item.newValue ?? '—')}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                               ) : (
                                <div className="text-xs text-slate-500 dark:text-slate-400 italic p-2 bg-slate-100 dark:bg-slate-800/50 rounded-xl">
                                  لا توجد فروقات حقول مباشرة (سجل إنشاء أولي أو بيانات عامة).
                                </div>
                              )}

                              {/* Raw JSON Payloads */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                {log.old_data && (
                                  <div>
                                    <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400 mb-1 flex items-center gap-1">
                                      <ArrowRight className="w-3 h-3 rotate-180" />
                                      <span>البيانات السابقة (Old Payload)</span>
                                    </div>
                                    <pre className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[10px] font-mono text-slate-700 dark:text-slate-300 max-h-40 overflow-y-auto dir-ltr">
                                      {JSON.stringify(log.old_data, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                {log.new_data && (
                                  <div>
                                    <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1">
                                      <ArrowRight className="w-3 h-3" />
                                      <span>البيانات الجديدة (New Payload)</span>
                                    </div>
                                    <pre className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[10px] font-mono text-slate-700 dark:text-slate-300 max-h-40 overflow-y-auto dir-ltr">
                                      {JSON.stringify(log.new_data, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Accessible Pagination for Master Changelog Table */}
            <AccessiblePagination
              currentPage={currentPage}
              totalPages={totalLogPages}
              pageSize={pageSize}
              totalItems={sortedLogs.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
              pageSizeOptions={[10, 25, 50, 100]}
              itemLabel="حركة تدقيق"
            />
          </div>
        ) : (
          /* ── View 2: Timeline Cards Stream ── */
          <div className="space-y-3">
            <div className="space-y-3">
              {paginatedLogs.map((log) => {
                const tableInfo = TABLE_DISPLAY_NAMES[log.table_name] || {
                  nameAr: log.table_name,
                  nameEn: log.table_name,
                  iconBadge: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
                };
                const actionInfo = ACTION_CONFIG[log.action] || {
                  labelAr: log.action,
                  labelEn: log.action,
                  badgeCls: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
                };
                const isExpanded = expandedLogId === log.id;
                const diffItems = AuditLogService.computeDiff(log.old_data, log.new_data);

                const timestampStr = log.changed_at || log.created_at;
                const logDate = timestampStr ? new Date(timestampStr as string) : null;

                return (
                  <div
                    key={log.id}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden transition-all"
                  >
                    {/* Row Summary */}
                    <div
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${actionInfo.badgeCls}`}>
                          {actionInfo.labelAr}
                        </span>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${tableInfo.iconBadge}`}>
                          {tableInfo.nameAr}
                        </span>
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          بواسطة: {log.user_name || log.changed_by || 'النظام'}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono hidden md:inline">
                          (ID: {log.record_id})
                        </span>
                        <DeviceIpBadge
                          ipAddress={log.ip_address}
                          userAgent={log.user_agent}
                          context={log.context}
                          compact={true}
                        />
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-end text-[11px] text-slate-400">
                          <div className="font-mono">
                            {logDate
                              ? logDate.toLocaleTimeString('ar-EG', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '-'}
                          </div>
                          <div className="text-[10px]">
                            {logDate
                              ? logDate.toLocaleDateString('ar-EG', {
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : '-'}
                          </div>
                        </div>
                        <div className="p-1 rounded-lg text-slate-400">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Diff Section */}
                    {isExpanded && (
                      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-3">
                        {diffItems.length > 0 ? (
                          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
                            <table className="w-full text-xs text-right border-collapse">
                              <thead>
                                <tr className="bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                                  <th className="p-2.5">الحقل المعدل</th>
                                  <th className="p-2.5">القيمة السابقة (Old)</th>
                                  <th className="p-2.5">القيمة الجديدة (New)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {diffItems.map((item, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                    <td className="p-2.5 font-bold text-slate-900 dark:text-white">
                                      {item.fieldLabelAr}
                                      <span className="text-[10px] text-slate-400 font-mono block">
                                        {item.field}
                                      </span>
                                    </td>
                                    <td className="p-2.5 font-mono text-[11px] text-rose-600 dark:text-rose-400 bg-rose-50/40 dark:bg-rose-950/20">
                                      {typeof item.oldValue === 'object'
                                        ? JSON.stringify(item.oldValue)
                                        : String(item.oldValue)}
                                    </td>
                                    <td className="p-2.5 font-mono text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20">
                                      {typeof item.newValue === 'object'
                                        ? JSON.stringify(item.newValue)
                                        : String(item.newValue)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500 dark:text-slate-400 italic">
                            سجل إنشاء أولي أو بيانات عامة
                          </div>
                        )}

                        {/* Raw payloads */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                          {log.old_data && (
                            <div>
                              <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400 mb-1 flex items-center gap-1">
                                <ArrowRight className="w-3 h-3 rotate-180" />
                                <span>البيانات القديمة</span>
                              </div>
                              <pre className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[10px] font-mono text-slate-700 dark:text-slate-300 max-h-40 overflow-y-auto dir-ltr">
                                {JSON.stringify(log.old_data, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.new_data && (
                            <div>
                              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1">
                                <ArrowRight className="w-3 h-3" />
                                <span>البيانات الجديدة</span>
                              </div>
                              <pre className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[10px] font-mono text-slate-700 dark:text-slate-300 max-h-40 overflow-y-auto dir-ltr">
                                {JSON.stringify(log.new_data, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Accessible Pagination for Timeline Cards View */}
            <AccessiblePagination
              currentPage={currentPage}
              totalPages={totalLogPages}
              pageSize={pageSize}
              totalItems={sortedLogs.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
              pageSizeOptions={[10, 25, 50, 100]}
              itemLabel="حركة تدقيق"
            />
          </div>
        )}
      </div>

      {/* ── 4. Dedicated User Changelog Modal ── */}
      <UserChangelogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userMetrics={selectedUserForModal}
        allUserLogs={logs}
      />
    </div>
  );
};
