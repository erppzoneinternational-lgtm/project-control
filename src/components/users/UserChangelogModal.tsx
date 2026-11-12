'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  Clock, 
  History, 
  Search, 
  Download, 
  Calendar, 
  User, 
  ChevronDown, 
  ChevronUp, 
  ArrowLeft,
  ArrowRight, 
  Shield, 
  FileSpreadsheet,
  Activity,
  Layers,
  CheckCircle2,
  Copy,
  Check
} from 'lucide-react';
import { AuditLogEntry, UserWorkDuration } from '@/types';
import { AuditLogService, TABLE_DISPLAY_NAMES, ACTION_CONFIG } from '@/lib/services/auditLog.service';

interface UserChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
  userMetrics?: UserWorkDuration | null;
  allUserLogs: AuditLogEntry[];
}

/**
 * Format timestamp safely for RTL Arabic layout with bidi isolation and relative time
 */
interface FormattedRtlTimestamp {
  relativeTime: string;
  timeStr: string;
  dateStr: string;
  fullDateStr: string;
}

function formatRtlTimestamp(dateInput?: string | Date | null): FormattedRtlTimestamp {
  if (!dateInput) {
    return {
      relativeTime: 'غير مسجل',
      timeStr: '—',
      dateStr: '—',
      fullDateStr: 'لا يوجد تاريخ مسجل',
    };
  }

  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) {
      return {
        relativeTime: 'تاريخ غير صالح',
        timeStr: '—',
        dateStr: '—',
        fullDateStr: 'تاريخ غير صالح',
      };
    }

    const timeStr = d.toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const dateStr = d.toLocaleDateString('ar-EG', {
      day: 'numeric',
      month: 'short',
    });

    const fullDateStr = d.toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const diffMs = Date.now() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    let relativeTime = '';
    if (diffSec < 60) {
      relativeTime = 'الآن';
    } else if (diffMin < 60) {
      if (diffMin === 1) relativeTime = 'منذ دقيقة';
      else if (diffMin === 2) relativeTime = 'منذ دقيقتين';
      else if (diffMin >= 3 && diffMin <= 10) relativeTime = `منذ ${diffMin} دقائق`;
      else relativeTime = `منذ ${diffMin} دقيقة`;
    } else if (diffHour < 24) {
      if (diffHour === 1) relativeTime = 'منذ ساعة';
      else if (diffHour === 2) relativeTime = 'منذ ساعتين';
      else if (diffHour >= 3 && diffHour <= 10) relativeTime = `منذ ${diffHour} ساعات`;
      else relativeTime = `منذ ${diffHour} ساعة`;
    } else if (diffDay === 1) {
      relativeTime = 'أمس';
    } else if (diffDay === 2) {
      relativeTime = 'منذ يومين';
    } else if (diffDay >= 3 && diffDay <= 10) {
      relativeTime = `منذ ${diffDay} أيام`;
    } else {
      relativeTime = dateStr;
    }

    return {
      relativeTime,
      timeStr,
      dateStr,
      fullDateStr,
    };
  } catch {
    return {
      relativeTime: '—',
      timeStr: '—',
      dateStr: '—',
      fullDateStr: '—',
    };
  }
}

/**
 * Dedicated visual badge for diff values with boolean, empty, and data-type awareness
 */
interface DiffValueBadgeProps {
  value: any;
  isNew?: boolean;
}

const DiffValueBadge: React.FC<DiffValueBadgeProps> = ({ value, isNew = false }) => {
  if (value === null || value === undefined || value === '' || value === '—') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 italic border border-slate-200/60 dark:border-slate-700/60">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
        غير محدد / فارغ
      </span>
    );
  }

  if (typeof value === 'boolean') {
    return value ? (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
        <CheckCircle2 className="w-3 h-3" />
        مفعّل (نعم)
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
        <X className="w-3 h-3" />
        معطّل (لا)
      </span>
    );
  }

  const strValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

  if (isNew) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 break-all shadow-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
        <bdi>{strValue}</bdi>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/60 line-through decoration-rose-400 dark:decoration-rose-600 break-all opacity-85">
      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
      <bdi>{strValue}</bdi>
    </span>
  );
};

export const UserChangelogModal: React.FC<UserChangelogModalProps> = ({
  isOpen,
  onClose,
  userMetrics,
  allUserLogs,
}) => {
  const [search, setSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedTable, setSelectedTable] = useState<string>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Smooth enter / exit animation state
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);

  // Synchronize smooth modal opening & closing transitions
  useEffect(() => {
    if (isOpen) {
      if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
        triggerElementRef.current = document.activeElement;
      }
      setIsRendered(true);
      const frameId = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
      return () => cancelAnimationFrame(frameId);
    } else {
      setIsVisible(false);
      const timeout = setTimeout(() => {
        setIsRendered(false);
      }, 200);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 200);
  }, [onClose]);

  // Lock background scroll when open
  useEffect(() => {
    if (isRendered) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isRendered]);

  // Focus trap and keyboard controls (Escape, Tab)
  useEffect(() => {
    if (!isRendered) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
        return;
      }

      if (e.key === 'Tab') {
        if (!dialogRef.current) return;

        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement || !dialogRef.current.contains(document.activeElement)) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement || !dialogRef.current.contains(document.activeElement)) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Initial focus on mount
    const timer = setTimeout(() => {
      if (dialogRef.current) {
        const searchInput = dialogRef.current.querySelector<HTMLElement>('input[type="text"]');
        if (searchInput) {
          searchInput.focus();
        } else {
          const firstFocusable = dialogRef.current.querySelector<HTMLElement>(
            'button:not([disabled]), input:not([disabled]), select:not([disabled])'
          );
          firstFocusable?.focus();
        }
      }
    }, 60);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
      if (triggerElementRef.current && typeof triggerElementRef.current.focus === 'function') {
        triggerElementRef.current.focus();
      }
    };
  }, [isRendered, handleClose]);

  // Filter logs for this specific user
  const userLogs = useMemo(() => {
    if (!userMetrics) return [];
    return allUserLogs.filter(
      (l) => l.changed_by === userMetrics.userId || l.user_email === userMetrics.userEmail
    );
  }, [allUserLogs, userMetrics]);

  // Available tables in user's history
  const availableTables = useMemo(() => {
    return Array.from(new Set(userLogs.map((l) => l.table_name)));
  }, [userLogs]);

  // Filtered changelog entries
  const filteredLogs = useMemo(() => {
    return userLogs.filter((log) => {
      const matchAction = selectedAction === 'all' || log.action === selectedAction;
      const matchTable = selectedTable === 'all' || log.table_name === selectedTable;
      const s = search.toLowerCase();
      const matchSearch =
        !search ||
        log.record_id.toLowerCase().includes(s) ||
        log.table_name.toLowerCase().includes(s) ||
        (log.context || '').toLowerCase().includes(s) ||
        JSON.stringify(log.old_data || {}).toLowerCase().includes(s) ||
        JSON.stringify(log.new_data || {}).toLowerCase().includes(s);

      return matchAction && matchTable && matchSearch;
    });
  }, [userLogs, selectedAction, selectedTable, search]);

  if (!isRendered || !userMetrics) return null;

  const handleExport = () => {
    AuditLogService.exportChangelogToExcel(
      filteredLogs,
      `سجل_تغييرات_${userMetrics.userName.replace(/\s+/g, '_')}`
    );
  };

  const handleCopyPayload = (key: string, data: any) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const lastActiveTimestamp = formatRtlTimestamp(userMetrics.lastActiveAt);

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 transition-all duration-200 ease-out ${
        isVisible 
          ? 'bg-slate-950/75 backdrop-blur-md opacity-100' 
          : 'bg-slate-950/0 backdrop-blur-none opacity-0 pointer-events-none'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div 
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-changelog-modal-title"
        aria-describedby="user-changelog-modal-desc"
        dir="rtl"
        className={`w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 max-h-[90vh] flex flex-col overflow-hidden transform transition-all duration-200 ease-out ${
          isVisible 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-95 translate-y-3'
        }`}
      >
        {/* Hidden screen-reader description */}
        <p id="user-changelog-modal-desc" className="sr-only">
          نافذة سجل التدقيق والأنشطة التاريخية للمستخدم {userMetrics.userName}، تعرض مقاييس ساعات العمل، تفاصيل الفروقات بين القيم القديمة والجديدة، وخيارات التصفية والتصدير.
        </p>

        {/* ── Modal Header: User Info & Work Time ── */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md shadow-purple-600/20 shrink-0">
                {userMetrics.userName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 id="user-changelog-modal-title" className="text-lg font-black text-slate-900 dark:text-slate-100">
                    {userMetrics.userName}
                  </h3>
                  {userMetrics.isOnline ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      متصل الآن
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
                      غير متصل
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                  <span className="font-mono">{userMetrics.userEmail}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {userMetrics.roles.map((r) => (
                      <span key={r} className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[10px] font-mono border border-purple-200/50 dark:border-purple-800/50">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="p-2 rounded-xl hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-200 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              aria-label="إغلاق سجل التغييرات"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* ── Work Duration & Activity KPI Strip ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            {/* Total Work Hours */}
            <div className="rounded-2xl p-3.5 bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>إجمالي وقت العمل (Total)</span>
              </div>
              <div className="text-xl font-black text-purple-600 dark:text-purple-400 font-mono mt-1" dir="ltr">
                {userMetrics.formattedTotal}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">
                {userMetrics.formattedTotalAr}
              </div>
            </div>

            {/* Today Work Hours */}
            <div className="rounded-2xl p-3.5 bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>وقت عمل اليوم (Today)</span>
              </div>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1" dir="ltr">
                {userMetrics.formattedToday}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">
                {userMetrics.formattedTodayAr}
              </div>
            </div>

            {/* Total Changes / Actions */}
            <div className="rounded-2xl p-3.5 bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>إجمالي حركات التعديل</span>
              </div>
              <div className="text-xl font-black text-sky-600 dark:text-sky-400 font-mono mt-1">
                {userMetrics.totalChangesCount}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                حركة مسجلة بسجل التدقيق
              </div>
            </div>

            {/* Last Activity */}
            <div className="rounded-2xl p-3.5 bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>آخر حركة / ظهور</span>
              </div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1" title={lastActiveTimestamp.fullDateStr}>
                {userMetrics.lastActiveAt ? (
                  <div className="flex flex-col">
                    <span className="text-amber-600 dark:text-amber-400 font-bold">
                      {lastActiveTimestamp.relativeTime}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 flex items-center gap-1" dir="rtl">
                      <bdi>{lastActiveTimestamp.timeStr}</bdi>
                      <span>•</span>
                      <bdi>{lastActiveTimestamp.dateStr}</bdi>
                    </span>
                  </div>
                ) : (
                  'لم يسجل نشاط'
                )}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-mono">
                {userMetrics.isOnline ? 'نشط بالبوابة الآن' : 'غير متصل'}
              </div>
            </div>
          </div>
        </div>

        {/* ── Toolbar: Search & Action Filters & Export ── */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 bg-slate-50/30 dark:bg-slate-900/30">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative min-w-[200px] flex-1 max-w-xs">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" aria-hidden="true" />
              <input
                type="text"
                placeholder="بحث في سجل تعديلات المستخدم..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="بحث في سجل تعديلات المستخدم"
                className="w-full pr-9 pl-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            {/* Action Filter */}
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              aria-label="تصفية حسب نوع العملية"
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
            >
              <option value="all">كل العمليات ({userLogs.length})</option>
              <option value="INSERT">إنشاء سجل (INSERT)</option>
              <option value="UPDATE">تعديل بيانات (UPDATE)</option>
              <option value="DELETE">حذف سجل (DELETE)</option>
              <option value="STATUS_CHANGE">تغيير حالة (STATUS_CHANGE)</option>
            </select>

            {/* Table Filter */}
            {availableTables.length > 0 && (
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                aria-label="تصفية حسب الجدول أو الوحدة"
                className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
              >
                <option value="all">كل الوحدات / الجداول</option>
                {availableTables.map((tbl) => (
                  <option key={tbl} value={tbl}>
                    {TABLE_DISPLAY_NAMES[tbl]?.nameAr || tbl}
                  </option>
                ))}
              </select>
            )}
          </div>

          <button
            type="button"
            onClick={handleExport}
            disabled={filteredLogs.length === 0}
            aria-label="تصدير سجل التغييرات إلى ملف Excel"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>تصدير Excel (.xlsx)</span>
          </button>
        </div>

        {/* ── Changelog Stream List ── */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
              <History className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                لا توجد حركات تدقيق مسجلة لهذا المستخدم
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                عند قيام المستخدم بإجراء أي عمليات حفظ أو تعديل أو تغيير حالة ستظهر هنا فوراً.
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const tableInfo = TABLE_DISPLAY_NAMES[log.table_name] || {
                nameAr: log.table_name,
                nameEn: log.table_name,
                iconBadge: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60',
              };
              const actionInfo = ACTION_CONFIG[log.action] || {
                labelAr: log.action,
                labelEn: log.action,
                badgeCls: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60',
              };
              const isExpanded = expandedLogId === log.id;
              const diffItems = AuditLogService.computeDiff(log.old_data, log.new_data);
              const timestampInfo = formatRtlTimestamp(log.changed_at || log.created_at);

              return (
                <div
                  key={log.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden transition-all"
                >
                  {/* Row Header as accessible button */}
                  <button
                    type="button"
                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    aria-expanded={isExpanded}
                    aria-controls={`changelog-details-${log.id}`}
                    aria-label={isExpanded ? `طي تفاصيل الحركة ${log.record_id}` : `عرض تفاصيل الحركة ${log.record_id}`}
                    className="w-full text-right p-4 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer focus:outline-none focus:bg-slate-100/70 dark:focus:bg-slate-800/70"
                  >
                    <div className="flex items-center flex-wrap gap-2.5 min-w-0">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${actionInfo.badgeCls}`}>
                        {actionInfo.labelAr}
                      </span>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${tableInfo.iconBadge}`}>
                        {tableInfo.nameAr}
                      </span>

                      {/* Changed fields count preview */}
                      {diffItems.length > 0 && log.action === 'UPDATE' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80">
                          <Layers className="w-3 h-3" />
                          <span>
                            {diffItems.length === 1 ? 'حقل واحد معدل' : diffItems.length === 2 ? 'حقلان معدلان' : `${diffItems.length} حقول معدلة`}
                          </span>
                        </span>
                      )}

                      <span className="text-xs text-slate-400 dark:text-slate-500 font-mono hidden sm:inline" dir="ltr">
                        ID: {log.record_id}
                      </span>
                      {log.ip_address && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/60" dir="ltr">
                          IP: {log.ip_address}
                        </span>
                      )}
                      {log.context && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 italic hidden md:inline truncate max-w-xs">
                          ({log.context})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-end text-[11px] text-slate-400 dark:text-slate-500 shrink-0" title={timestampInfo.fullDateStr}>
                        <div className="inline-flex items-center gap-1 text-[11px] text-purple-600 dark:text-purple-400 font-bold justify-end">
                          <Clock className="w-3 h-3 shrink-0 text-slate-400 dark:text-slate-500" />
                          <span>{timestampInfo.relativeTime}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 justify-end" dir="rtl">
                          <bdi>{timestampInfo.timeStr}</bdi>
                          <span>•</span>
                          <bdi>{timestampInfo.dateStr}</bdi>
                        </div>
                      </div>
                      <div className="p-1 rounded-lg text-slate-400 dark:text-slate-500">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </button>

                  {/* Expanded Body: Diff & JSON Details */}
                  {isExpanded && (
                    <div 
                      id={`changelog-details-${log.id}`}
                      className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-4"
                    >
                      {/* Diff Comparison Table */}
                      {diffItems.length > 0 ? (
                        <div className="space-y-2">
                          <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                            <span>الحقول المعدلة (Changed Fields):</span>
                          </h5>
                          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
                            <table className="w-full text-xs text-right border-collapse">
                              <thead>
                                <tr className="bg-slate-100/80 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                                  <th scope="col" className="p-3 w-1/3">الحقل</th>
                                  <th scope="col" className="p-3 w-1/3 text-rose-700 dark:text-rose-400">
                                    <span className="inline-flex items-center gap-1">
                                      <span>القيمة السابقة</span>
                                      <span className="text-[10px] font-mono font-normal text-rose-500">(Old)</span>
                                    </span>
                                  </th>
                                  <th scope="col" className="p-3 w-1/3 text-emerald-700 dark:text-emerald-400">
                                    <span className="inline-flex items-center gap-1">
                                      <span>القيمة الجديدة</span>
                                      <span className="text-[10px] font-mono font-normal text-emerald-500">(New)</span>
                                      <ArrowLeft className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                    </span>
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {diffItems.map((item, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100 align-top">
                                      <div className="flex flex-col">
                                        <span className="text-xs">{item.fieldLabelAr}</span>
                                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                                          {item.field}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="p-3 align-top">
                                      <DiffValueBadge value={item.oldValue} isNew={false} />
                                    </td>
                                    <td className="p-3 align-top">
                                      <DiffValueBadge value={item.newValue} isNew={true} />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 dark:text-slate-400 italic p-2 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl">
                          لا توجد فروقات حقول مباشرة (سجل إنشاء أولي أو تفاصيل مخصصة)
                        </div>
                      )}

                      {/* Raw JSON Accordion & Copy Buttons */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                        {log.old_data && (
                          <div>
                            <div className="flex items-center justify-between text-[11px] font-bold text-rose-600 dark:text-rose-400 mb-1.5">
                              <span className="flex items-center gap-1.5">
                                <History className="w-3.5 h-3.5 text-rose-500" />
                                <span>البيانات السابقة الكاملة (Old Payload)</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyPayload(`old-${log.id}`, log.old_data)}
                                className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md hover:bg-rose-100 dark:hover:bg-rose-950/60 text-rose-700 dark:text-rose-300 transition-colors cursor-pointer"
                                aria-label="نسخ البيانات السابقة"
                              >
                                {copiedKey === `old-${log.id}` ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-500" />
                                    <span className="text-emerald-600 dark:text-emerald-400">تم النسخ</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>نسخ JSON</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <pre className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300 max-h-48 overflow-y-auto" dir="ltr">
                              {JSON.stringify(log.old_data, null, 2)}
                            </pre>
                          </div>
                        )}

                        {log.new_data && (
                          <div>
                            <div className="flex items-center justify-between text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mb-1.5">
                              <span className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                <span>البيانات الجديدة الكاملة (New Payload)</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyPayload(`new-${log.id}`, log.new_data)}
                                className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 transition-colors cursor-pointer"
                                aria-label="نسخ البيانات الجديدة"
                              >
                                {copiedKey === `new-${log.id}` ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-500" />
                                    <span className="text-emerald-600 dark:text-emerald-400">تم النسخ</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>نسخ JSON</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <pre className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300 max-h-48 overflow-y-auto" dir="ltr">
                              {JSON.stringify(log.new_data, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
