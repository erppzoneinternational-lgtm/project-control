'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  History, 
  Clock, 
  User, 
  FileText, 
  RefreshCw,
  GitCommit,
  ArrowRight,
  ShieldAlert, 
  Tag,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Send,
  FileUp,
  Compass,
  Inbox,
  ArrowUpDown,
  Layers,
  FileCode,
  CheckCheck
} from 'lucide-react';
import { BoqRevision } from '@/types/boq';
import { DeliverableEvent } from '@/types/planning';
import { BoqService } from '@/lib/services/boq.service';
import { DeliverablesService } from '@/lib/services/deliverables.service';
import { PriceGate } from './PriceGate';
import { logger } from '@/lib/logger';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entityId: string | null;
  entityTitle?: string;
  revisions?: BoqRevision[];
  events?: DeliverableEvent[];
  mode?: 'boq' | 'deliverable' | 'general';
}

export interface EventDisplayMeta {
  badgeLabel: string;
  badgeClass: string;
  actionTitle: string;
  defaultRoleAr: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  nodeBorder: string;
}

export const resolveEventMeta = (ev: DeliverableEvent | { to_value?: string; event_type?: string } | string): EventDisplayMeta => {
  if (typeof ev === 'string') {
    ev = { to_value: ev, event_type: ev } as DeliverableEvent;
  }
  const toVal = (ev?.to_value || '').toLowerCase();
  const eventType = (ev?.event_type || '').toLowerCase();

  // 1. Consultant Codes
  if (toVal.includes('code a') || toVal === 'approved' || toVal === 'code_a') {
    return {
      badgeLabel: 'معتمد نهائياً (كود A)',
      badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
      actionTitle: 'اعتماد نهائي كود A من الاستشاري (صالح للتنفيذ الفوري بالموقع)',
      defaultRoleAr: 'استشاري الإشراف على المشروع',
      icon: CheckCheck,
      iconBg: 'bg-emerald-600 text-white',
      iconColor: 'text-white',
      nodeBorder: 'border-emerald-500',
    };
  }

  if (toVal.includes('code b') || toVal === 'approved_with_notes' || toVal === 'code_b') {
    return {
      badgeLabel: 'معتمد بملاحظات (كود B)',
      badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800',
      actionTitle: 'اعتماد مشروط بملاحظات كود B (مطلوب استيفاء الملاحظات أثناء التنفيذ)',
      defaultRoleAr: 'استشاري الإشراف على المشروع',
      icon: AlertCircle,
      iconBg: 'bg-amber-500 text-white',
      iconColor: 'text-white',
      nodeBorder: 'border-amber-500',
    };
  }

  if (toVal.includes('code c') || toVal === 'revise_and_resubmit' || toVal === 'code_c') {
    return {
      badgeLabel: 'مرفوض لإعادة التقديم (كود C)',
      badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800',
      actionTitle: 'إرجاع وتعديل كود C (مطلوب تصحيح الملاحظات وإعادة التقديم)',
      defaultRoleAr: 'استشاري الإشراف على المشروع',
      icon: RotateCw,
      iconBg: 'bg-rose-600 text-white',
      iconColor: 'text-white',
      nodeBorder: 'border-rose-500',
    };
  }

  if (toVal.includes('code d') || toVal === 'rejected' || toVal === 'code_d') {
    return {
      badgeLabel: 'مرفوض كلياً (كود D)',
      badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800',
      actionTitle: 'رفض نهائي كود D (مرفوض بالكامل وغير صالح للتنفيذ)',
      defaultRoleAr: 'استشاري الإشراف على المشروع',
      icon: ShieldAlert,
      iconBg: 'bg-rose-700 text-white',
      iconColor: 'text-white',
      nodeBorder: 'border-rose-600',
    };
  }

  // 2. Internal Approval & Transmittal to Consultant
  if (toVal === 'returned' || eventType === 'manager_approved') {
    return {
      badgeLabel: 'معتمد داخلياً / صادر للاستشاري',
      badgeClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800',
      actionTitle: 'اعتماد مدير المكتب الفني وتجهيز إرسالية الاستشاري الرسمية (Transmittal)',
      defaultRoleAr: 'مدير المكتب الفني',
      icon: Send,
      iconBg: 'bg-indigo-600 text-white',
      iconColor: 'text-white',
      nodeBorder: 'border-indigo-500',
    };
  }

  // 3. Submitted for Internal Review
  if (toVal === 'ready_to_return' || eventType === 'submitted_for_review') {
    return {
      badgeLabel: 'بانتظار مراجعة واعتماد المدير',
      badgeClass: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-300 dark:border-sky-800',
      actionTitle: 'اكتمال الرسم والتجهيز وإحالة المخطط لمراجعة وتدقيق مدير المكتب الفني',
      defaultRoleAr: 'مهندس المكتب الفني المعين',
      icon: FileUp,
      iconBg: 'bg-sky-600 text-white',
      iconColor: 'text-white',
      nodeBorder: 'border-sky-500',
    };
  }

  // 4. In Progress / Drafting Commenced
  if (toVal === 'in_progress' || eventType === 'start_work') {
    return {
      badgeLabel: 'قيد العمل والتنفيذ الهندسي',
      badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800',
      actionTitle: 'بدء إعداد ورسم المخططات الهندسية وتفريد حديد التسليح والمسارات',
      defaultRoleAr: 'مهندس المكتب الفني المعني',
      icon: Compass,
      iconBg: 'bg-blue-600 text-white',
      iconColor: 'text-white',
      nodeBorder: 'border-blue-500',
    };
  }

  // 5. Blocked
  if (toVal === 'blocked' || eventType === 'block') {
    return {
      badgeLabel: 'معطل بعائق تنفيذي',
      badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800',
      actionTitle: 'تسجيل عائق تنفيذي يعطل المسار أو يوقف صب الخرسانة بالموقع',
      defaultRoleAr: 'فريق المكتب الفني والموقع',
      icon: ShieldAlert,
      iconBg: 'bg-rose-600 text-white',
      iconColor: 'text-white',
      nodeBorder: 'border-rose-500',
    };
  }

  // 6. Unblock
  if (eventType === 'unblock') {
    return {
      badgeLabel: 'تم رفع التعطيل',
      badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
      actionTitle: 'حسم الإشكال الفني أو استلام الرد واستئناف العمل فورياً',
      defaultRoleAr: 'مدير المكتب الفني / مدير المشروع',
      icon: CheckCircle2,
      iconBg: 'bg-emerald-600 text-white',
      iconColor: 'text-white',
      nodeBorder: 'border-emerald-500',
    };
  }

  // 7. Received
  if (toVal === 'received') {
    return {
      badgeLabel: 'تم الاستلام والتسجيل بالمكتب',
      badgeClass: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-300 dark:border-teal-800',
      actionTitle: 'تسجيل استلام الحزمة/الوثائق وإدراجها ضمن سجل المتابعة والتقديمات',
      defaultRoleAr: 'مراقب الوثائق (Document Controller)',
      icon: Inbox,
      iconBg: 'bg-teal-600 text-white',
      iconColor: 'text-white',
      nodeBorder: 'border-teal-500',
    };
  }

  // Fallback
  return {
    badgeLabel: 'تحديث حالة التسليمة',
    badgeClass: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700',
    actionTitle: `تحديث مسار العمل إلى: ${toVal || 'محدث'}`,
    defaultRoleAr: 'فريق المكتب الفني',
    icon: GitCommit,
    iconBg: 'bg-slate-700 text-white',
    iconColor: 'text-white',
    nodeBorder: 'border-slate-400',
  };
};

export const getHumanStatusLabel = (key?: string): string => {
  if (!key) return '—';
  const k = key.toLowerCase();
  if (k === 'ready_to_return') return 'بانتظار مراجعة واعتماد المدير';
  if (k === 'returned') return 'معتمد داخلياً ومجهز للإرسالية';
  if (k === 'in_progress') return 'قيد الرسم والتنفيذ';
  if (k === 'received') return 'مستلم ومسجل';
  if (k === 'blocked') return 'معطل بعائق تنفيذي';
  if (k === 'approved' || k.includes('code a')) return 'معتمد كود A';
  if (k.includes('code b')) return 'معتمد بملاحظات كود B';
  if (k.includes('code c')) return 'مرفوض كود C (إعادة تقديم)';
  if (k.includes('code d')) return 'مرفوض كود D';
  if (k === 'pending' || k === 'draft') return 'مسودة أولية R00';
  return key;
};

/**
 * Backward compatibility alias for test suites (HistoryDrawer.test.ts)
 */
export const getActionMeta = resolveEventMeta;

export const formatHistoryTimestamp = (isoString?: string): string => {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return isoString;
  }
};

export const getRelativeTime = (isoString?: string): string => {
  if (!isoString) return '';
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMin = Math.floor(diffMs / (60 * 1000));
    if (diffMin < 1) return 'الآن';
    if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'أمس';
    if (diffDays <= 10) return `منذ ${diffDays} أيام`;
    return `منذ ${diffDays} يوماً`;
  } catch {
    return '';
  }
};

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  entityId,
  entityTitle,
  revisions: propRevisions,
  events: propEvents,
  mode = 'boq',
}) => {
  const [revisions, setRevisions] = useState<BoqRevision[]>([]);
  const [events, setEvents] = useState<DeliverableEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const isDeliverableMode = mode === 'deliverable' || (propEvents && propEvents.length > 0);

  useEffect(() => {
    if (isOpen && entityId) {
      if (isDeliverableMode) {
        if (propEvents && propEvents.length > 0) {
          setEvents(propEvents);
        } else {
          setLoading(true);
          DeliverablesService.getDeliverableEvents(entityId)
            .then((data) => setEvents(data as DeliverableEvent[]))
            .catch((err) => logger.error('Failed to fetch deliverable events', { detail: err }))
            .finally(() => setLoading(false));
        }
      } else {
        if (propRevisions && propRevisions.length > 0) {
          setRevisions(propRevisions);
        } else {
          setLoading(true);
          BoqService.getBoqRevisions(entityId)
            .then((data) => setRevisions(data))
            .catch((err) => logger.error('Failed to fetch revisions', { detail: err }))
            .finally(() => setLoading(false));
        }
      }
    }
  }, [isOpen, entityId, propRevisions, propEvents, isDeliverableMode]);

  // Sorted events list with stable indexing
  const sortedEvents = useMemo(() => {
    const list = [...events];
    list.sort((a, b) => {
      const timeA = new Date(a.created_at || 0).getTime();
      const timeB = new Date(b.created_at || 0).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });
    return list;
  }, [events, sortOrder]);

  // Keyboard accessibility: Escape to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatDate = formatHistoryTimestamp;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} aria-label="إغلاق الخلفية" />

      <div className="absolute inset-y-0 start-0 max-w-full flex">
        <div className="w-screen max-w-xl bg-white dark:bg-slate-900 border-e border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
          {/* ── Top Header Strip ── */}
          <div className="px-6 py-4 border-b border-slate-200/90 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-20">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 shrink-0 shadow-sm border border-indigo-100/80 dark:border-indigo-900/60 ring-2 ring-indigo-500/10 dark:ring-indigo-400/10">
                  <History className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-black text-slate-900 dark:text-white truncate">
                    {isDeliverableMode ? 'سجل الأحداث والخط الزمني للمكتب الفني' : 'سجل التعديلات والنسخ (Audit Trail)'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5" title={entityTitle}>
                    {entityTitle || 'التسلسل الإجرائي الموثق غير القابل للتعديل'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {isDeliverableMode && events.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                    className="p-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 active:scale-95"
                    title={sortOrder === 'desc' ? 'التبديل إلى: الأقدم أولاً' : 'التبديل إلى: الأحدث أولاً'}
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">
                      {sortOrder === 'desc' ? 'الأحدث أولاً' : 'التسلسل الزمني'}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 active:scale-95"
                  aria-label="إغلاق"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick stats pill row */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 text-xs">
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold font-mono">
                {isDeliverableMode ? `${events.length} حركات مسجلة` : `${revisions.length} إصدارات سابقة`}
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                توثيق فني ملزم يوضح هوية المنفذ والإجراء والتحول اللحظي
              </span>
            </div>
          </div>

          {/* ── Main Timeline Stream ── */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
                <RefreshCw className="w-7 h-7 animate-spin text-indigo-600" />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">جاري تحميل السجل التاريخي واسترجاع الهويات...</span>
              </div>
            ) : isDeliverableMode ? (
              /* Deliverable Events Timeline */
              sortedEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400 space-y-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-6">
                  <Clock className="w-12 h-12 text-slate-300 dark:text-slate-700" />
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-300">لا توجد حركات مسجلة حتى الآن</div>
                  <div className="text-xs text-slate-500 max-w-xs leading-relaxed">
                    يتم توثيق كل حركة إجرائية (بدء الرسم، التقديم، الاعتماد الداخلي، رد الاستشاري، العوائق) تلقائياً في هذا السجل بالتسلسل.
                  </div>
                </div>
              ) : (
                <div className="relative space-y-5 before:absolute before:start-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                  {sortedEvents.map((ev, idx) => {
                    const meta = resolveEventMeta(ev);
                    const IconComponent = meta.icon;
                    const stepNumber = sortOrder === 'desc' ? sortedEvents.length - idx : idx + 1;
                    const relativeTime = getRelativeTime(ev.created_at);
                    const formattedDate = formatDate(ev.created_at);

                    // Actor resolution
                    const actorName = ev.actor_name || (ev as any).by_stakeholder?.name_ar || (ev as any).by_stakeholder?.name_en || meta.defaultRoleAr;
                    const actorRole = ev.actor_role || (ev as any).by_stakeholder?.role || (actorName !== meta.defaultRoleAr ? meta.defaultRoleAr : undefined);

                    // Sheet / Deliverable item detection
                    const sheetNumber = ev.sheet_number || (ev as any).item?.sheet_number;
                    const itemTitle = ev.item_title || (ev as any).item?.description;

                    return (
                      <div key={ev.id || idx} className="relative ps-9 group">
                        {/* Timeline Node Icon */}
                        <div
                          className={`absolute start-1.5 top-3.5 w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 shadow-md flex items-center justify-center shrink-0 z-10 transition-transform group-hover:scale-110 ${meta.iconBg}`}
                          aria-hidden="true"
                        >
                          <IconComponent className="w-3.5 h-3.5" />
                        </div>

                        {/* Event Card Container */}
                        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700/60 transition-all duration-200 space-y-3">
                          {/* 1. Header: Step index, Action Badge, and Timestamp */}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-0.5 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black font-mono">
                                #{stepNumber}
                              </span>

                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${meta.badgeClass}`}>
                                <Tag className="w-3 h-3" />
                                {meta.badgeLabel}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                              {relativeTime && (
                                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                  {relativeTime}
                                </span>
                              )}
                              <span>•</span>
                              <span>{formattedDate}</span>
                            </div>
                          </div>

                          {/* 2. Target Sheet / Item Identification (if specific sheet) */}
                          {(sheetNumber || itemTitle) && (
                            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs">
                              <FileCode className="w-4 h-4 text-indigo-500 shrink-0" />
                              <div className="min-w-0">
                                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 ms-1">
                                  [{sheetNumber || 'مخطط'}]
                                </span>
                                <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                                  {itemTitle || 'مخطط تنفيذي مرتبط بالحزمة'}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* 3. Action Narrative (What was done) */}
                          <div className="space-y-1">
                            <div className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                              {meta.actionTitle}
                            </div>

                            {/* Human-readable State Transition Flow */}
                            {(ev.from_value || ev.to_value) && (
                              <div className="flex items-center gap-2 pt-1 flex-wrap text-[11px] font-mono">
                                <span className="text-slate-400 font-sans text-[10px]">التحول الإجرائي:</span>
                                {ev.from_value && (
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 line-through">
                                    {getHumanStatusLabel(ev.from_value)}
                                  </span>
                                )}
                                {ev.from_value && ev.to_value && (
                                  <ArrowRight className="w-3 h-3 text-slate-400 rotate-180" />
                                )}
                                {ev.to_value && (
                                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
                                    {getHumanStatusLabel(ev.to_value)}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* 4. Engineering Notes / Blocker Reason / Justification */}
                          {ev.reason && (
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border-s-4 border-amber-500 text-xs text-slate-800 dark:text-slate-200 space-y-1">
                              <div className="font-bold text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                <FileText className="w-3.5 h-3.5" />
                                <span>الملاحظات الهندسية / بيان الإجراء:</span>
                              </div>
                              <p className="leading-relaxed whitespace-pre-wrap font-sans">
                                {ev.reason}
                              </p>
                            </div>
                          )}

                          {/* 5. Actor Attribution (Who did it) */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[10px] flex items-center justify-center shrink-0">
                                <User className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                  {actorName}
                                </span>
                                {actorRole && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                                    {actorRole}
                                  </span>
                                )}
                              </div>
                            </div>

                            <span className="text-[10px] text-slate-400 font-mono">
                              معتمد وموثق ✓
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : revisions.length === 0 ? (
              /* BOQ Revisions Empty State */
              <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400 space-y-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-6">
                <Clock className="w-12 h-12 text-slate-300 dark:text-slate-700" />
                <div className="text-sm font-bold text-slate-700 dark:text-slate-300">لا توجد نسخ سابقة مسجلة لهذا البند</div>
                <div className="text-xs text-slate-500 max-w-xs leading-relaxed">
                  يتم حفظ لقطة أوتوماتيكية عند تعديل الكميات أو الأسعار مع زيادة رقم الإصدار تلقائياً.
                </div>
              </div>
            ) : (
              /* BOQ Revisions Stream */
              <div className="relative space-y-5 before:absolute before:start-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {revisions.map((rev, idx) => (
                  <div key={rev.id || idx} className="relative ps-9 group">
                    <div className="absolute start-1.5 top-3.5 w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 shadow-md flex items-center justify-center shrink-0 z-10 bg-emerald-600 text-white">
                      <GitCommit className="w-3.5 h-3.5" />
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700/60 transition-all duration-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
                          الإصدار التعاقدي v{rev.revision}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {formatDate(rev.created_at)}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        {rev.changed_by && (
                          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>المعدل: {rev.changed_by}</span>
                          </div>
                        )}
                        {rev.change_reason && (
                          <div className="flex items-start gap-1.5 text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-xl text-xs">
                            <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
                            <span>سبب التعديل التعاقدي: {rev.change_reason}</span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700/60 text-center">
                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                          <div className="text-[10px] text-slate-400">الكمية التعاقدية</div>
                          <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                            <PriceGate fallback={<span className="text-slate-400">***</span>}>
                              {(Number(rev.contract_qty) || 0).toLocaleString()}
                            </PriceGate>
                          </div>
                        </div>

                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                          <div className="text-[10px] text-slate-400">الفئة (EGP)</div>
                          <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                            <PriceGate fallback={<span className="text-slate-400">***</span>}>
                              {(Number(rev.rate_egp) || 0).toLocaleString()}
                            </PriceGate>
                          </div>
                        </div>

                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                          <div className="text-[10px] text-slate-400">الإجمالي التعاقدي</div>
                          <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                            <PriceGate fallback={<span className="text-slate-400">***</span>}>
                              {(Number(rev.amount_egp) || 0).toLocaleString()}
                            </PriceGate>
                          </div>
                        </div>
                      </div>

                      {rev.description_ar && (
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                          {rev.description_ar}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold font-mono">
              إجمالي الحركات: {isDeliverableMode ? events.length : revisions.length}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 transition-all shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 active:scale-95"
            >
              إغلاق السجل
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
