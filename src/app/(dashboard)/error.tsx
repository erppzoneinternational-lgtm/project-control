'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AlertTriangle,
  RefreshCw,
  Home,
  RotateCw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Terminal,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface RouteMeta {
  titleAr: string;
  titleEn: string;
  categoryAr: string;
}

const ROUTE_DIRECTORY: Record<string, RouteMeta> = {
  '/board': {
    titleAr: 'لوحة القيادة التنفيذية وحوكمة المحفظة',
    titleEn: 'Board & Governance Dashboard',
    categoryAr: 'الإدارة العليا والاستراتيجية',
  },
  '/boq': {
    titleAr: 'جدول الكميات والمقايسة التعاقدية (BOQ)',
    titleEn: 'Bill of Quantities (BOQ)',
    categoryAr: 'المكتب الفني والتعاقدات',
  },
  '/clients': {
    titleAr: 'دليل وسجل العملاء والمطورين',
    titleEn: 'Clients & Developers Directory',
    categoryAr: 'العلاقات والشركاء',
  },
  '/contracts': {
    titleAr: 'إدارة العقود والمطالبات والنزاعات (FIDIC)',
    titleEn: 'Contracts & Claims Management',
    categoryAr: 'الشؤون القانونية والتعاقدية',
  },
  '/coo': {
    titleAr: 'لوحة عمليات التشغيل والتسليمات (COO)',
    titleEn: 'Operations & Deliverables (COO)',
    categoryAr: 'إدارة العمليات',
  },
  '/cost-control': {
    titleAr: 'مراقبة التكاليف والتدفقات المالية وإدارة القيمة المكتسبة (EVM)',
    titleEn: 'Cost Control & EVM Analytics',
    categoryAr: 'الرقابة المالية والتكاليف',
  },
  '/dashboard': {
    titleAr: 'لوحة العمليات والتحكم الرئيسية',
    titleEn: 'Operations Command Center',
    categoryAr: 'المنظومة العامة',
  },
  '/deliverables': {
    titleAr: 'إدارة المخرجات والتسليمات الهندسية',
    titleEn: 'Engineering Deliverables',
    categoryAr: 'المكتب الفني والتسليمات',
  },
  '/document-control': {
    titleAr: 'سجل وثائق ومراسلات المشروع (Document Control)',
    titleEn: 'Document Control & Archiving',
    categoryAr: 'إدارة الوثائق والأرشيف',
  },
  '/hse': {
    titleAr: 'لوحة السلامة والصحة المهنية والبيئة (HSE)',
    titleEn: 'Health, Safety & Environment (HSE)',
    categoryAr: 'السلامة والجودة الميدانية',
  },
  '/my-tasks': {
    titleAr: 'لوحة مهام العمل وسير الأنشطة الميدانية',
    titleEn: 'My Tasks & Workflow Actions',
    categoryAr: 'الإنتاجية الشخصية',
  },
  '/planning': {
    titleAr: 'منظومة التخطيط والبرامج الزمنية والـ Baselines',
    titleEn: 'Project Planning & CPM Scheduling',
    categoryAr: 'إدارة التخطيط والبرامج الزمنية',
  },
  '/pm-dashboard': {
    titleAr: 'لوحة إدارة المشاريع والعمليات (PM Dashboard)',
    titleEn: 'Project Management Command',
    categoryAr: 'إدارة المشاريع',
  },
  '/project-setup': {
    titleAr: 'تهيئة وتأسيس المشروع الجديد',
    titleEn: 'Project Setup & Initialization',
    categoryAr: 'إعداد المشروعات',
  },
  '/projects': {
    titleAr: 'مصفوفة ومحفظة مشروعات بي زون',
    titleEn: 'Projects Portfolio Directory',
    categoryAr: 'محفظة المشروعات',
  },
  '/qc-dashboard': {
    titleAr: 'لوحة الجودة وضبط الجودة الفنية (QC Inspections)',
    titleEn: 'Quality Control (QC) Dashboard',
    categoryAr: 'الجودة وضبط التنفيذ',
  },
  '/schedule-pulse': {
    titleAr: 'نبض الجدول الزمني ومؤشرات الأداء (Schedule Pulse)',
    titleEn: 'Schedule Pulse & DCMA Health',
    categoryAr: 'الجدول الزمني والتحليلات',
  },
  '/site-workspace': {
    titleAr: 'بيئة العمل الميدانية ومتابعة الموقع اليومية',
    titleEn: 'Site Operations Workspace',
    categoryAr: 'العمليات الميدانية',
  },
  '/stakeholders': {
    titleAr: 'إدارة أصحاب المصلحة والهيكل التنظيمي للمشروع',
    titleEn: 'Stakeholders & Organization Chart',
    categoryAr: 'الهيكل التنظيمي',
  },
  '/subcontractors': {
    titleAr: 'سجل مقاولي الباطن والتقييم الفني',
    titleEn: 'Subcontractors Management',
    categoryAr: 'المقاولون والتوريدات',
  },
  '/system-admin': {
    titleAr: 'إدارة النظام والمستخدمين والصلاحيات (RBAC)',
    titleEn: 'System Administration & RBAC',
    categoryAr: 'إدارة المنظومة والأمان',
  },
  '/technical-office': {
    titleAr: 'المكتب الفني والمستخلصات وحصر الكميات',
    titleEn: 'Technical Office & Invoicing',
    categoryAr: 'المكتب الفني',
  },
  '/tender': {
    titleAr: 'إدارة العطاءات ودراسة المناقصات',
    titleEn: 'Tender & Bidding Management',
    categoryAr: 'العطاءات ودراسة الأسعار',
  },
  '/workflow': {
    titleAr: 'سير العمل ودورة الاعتمادات الخماسية (Workflow)',
    titleEn: 'Five-Point Approval Workflow',
    categoryAr: 'سير العمل والموافقات',
  },
};

export default function DashboardErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname() || '';
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  const isProduction = process.env.NODE_ENV === 'production';

  // Log error event with context
  useEffect(() => {
    logger.error('Dashboard route encountered an unhandled error boundary trigger', {
      pathname,
      errorMessage: error.message,
      digest: error.digest,
      ...(isProduction ? {} : { stack: error.stack }),
    });
  }, [error, pathname, isProduction]);

  // Determine current route metadata
  const currentModule = useMemo(() => {
    // Check exact match first
    if (ROUTE_DIRECTORY[pathname]) {
      return ROUTE_DIRECTORY[pathname];
    }
    // Check prefix match
    const foundKey = Object.keys(ROUTE_DIRECTORY).find((key) =>
      pathname.startsWith(key)
    );
    if (foundKey) {
      return ROUTE_DIRECTORY[foundKey];
    }
    // Fallback
    return {
      titleAr: 'لوحة التحكم والعمليات',
      titleEn: 'Dashboard Operations',
      categoryAr: 'المنظومة العامة',
    };
  }, [pathname]);

  const handleCopyReport = async () => {
    const reportText = [
      `══════════════════════════════════════════════════`,
      `P.ZONE ERP ENGINE — ERROR DIAGNOSTIC REPORT`,
      `══════════════════════════════════════════════════`,
      `مسار الصفحة / Path: ${pathname}`,
      `التوقيت / Timestamp: ${new Date().toISOString()}`,
      `الوحدة / Section: ${currentModule.titleAr} (${currentModule.titleEn})`,
      `كود المرجع / Digest: ${error.digest || 'N/A'}`,
      `نوع الخطأ / Error Name: ${error.name || 'Error'}`,
      `رسالة الخطأ / Message: ${error.message || 'Unknown error'}`,
      typeof navigator !== 'undefined'
        ? `المتصفح / User Agent: ${navigator.userAgent}`
        : '',
      !isProduction && error.stack ? `\nStack Trace:\n${error.stack}` : '',
      `══════════════════════════════════════════════════`,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(reportText);
        setCopied(true);
        toast.success('تم نسخ تقرير التشخيص الفني إلى الحافظة بنجاح');
        setTimeout(() => setCopied(false), 3000);
      }
    } catch {
      toast.error('تعذر نسخ التقرير تلقائياً، يرجى نسخه يدوياً من التفاصيل الفنية');
    }
  };

  const handleFullReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      dir="rtl"
      className="relative min-h-[70vh] flex items-center justify-center p-4 sm:p-6 lg:p-8"
    >
      {/* Ambient Lighting & Backdrop Elements */}
      <div className="absolute top-1/4 start-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 end-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-3xl rounded-3xl glass-card border border-rose-500/30 bg-gradient-to-b from-rose-500/[0.08] via-white/95 to-slate-50/95 dark:via-slate-900/95 dark:to-slate-950/95 shadow-2xl p-6 sm:p-10 text-center space-y-6">
        {/* Top Architectural Shield & Status Pill */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-200/50 dark:border-rose-900/40 pb-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600 dark:bg-rose-400" />
            </span>
            <span>نظام التعافي الذاتي من الأخطاء | Self-Healing Harness</span>
          </div>

          <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>بياناتك ومؤشراتك محفوظة بأمان</span>
          </div>
        </div>

        {/* Pulsing Visual Icon */}
        <div className="relative mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-rose-500/20 to-amber-500/10 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-xl shadow-rose-500/10">
          <AlertTriangle className="w-10 h-10" aria-hidden="true" />
        </div>

        {/* Friendly Reassuring Messages */}
        <div className="space-y-2 max-w-xl mx-auto">
          <div className="text-xs font-bold text-rose-600 dark:text-rose-400 mb-1">
            {currentModule.categoryAr}
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
            {`تعذر تحميل ${currentModule.titleAr} مؤقتاً`}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            نعتذر عن هذا التعثر غير المتوقع في عرض بيانات هذه الصفحة. نطمئنك بأن كافة بياناتك ومدخلاتك التعاقدية والهندسية محفوظة بأمان تام في قاعدة البيانات. تم توثيق تفاصيل هذا الحدث تلقائياً لدراستها وضمان استقرار النظام.
          </p>
          <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 pt-1" dir="ltr">
            {`${currentModule.titleEn} — Safe Recovery Mode`}
          </p>

          {error.digest && (
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-mono text-slate-600 dark:text-slate-400" dir="ltr">
                <span>Ref:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">{error.digest}</span>
              </span>
            </div>
          )}
        </div>

        {/* Primary Action & Recovery Suite */}
        <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
          {/* Action 1: Retry (reset component boundary) */}
          <button
            type="button"
            onClick={() => reset()}
            className="min-h-[44px] min-w-[44px] px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            <span>إعادة المحاولة (Try Again)</span>
          </button>

          {/* Action 2: Go to Dashboard */}
          <Link
            href="/dashboard"
            className="min-h-[44px] min-w-[44px] px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-all border border-slate-200 dark:border-slate-700 shadow-sm hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <Home className="w-4 h-4 text-emerald-500" aria-hidden="true" />
            <span>العودة للوحة القيادة</span>
          </Link>

          {/* Action 3: Full Page Reload */}
          <button
            type="button"
            onClick={handleFullReload}
            className="min-h-[44px] min-w-[44px] px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <RotateCw className="w-4 h-4 text-slate-400" aria-hidden="true" />
            <span>تحديث الصفحة</span>
          </button>

          {/* Action 4: Copy Diagnostic Report */}
          <button
            type="button"
            onClick={handleCopyReport}
            className="min-h-[44px] min-w-[44px] px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            title="نسخ تقرير الخطأ الفني لمشاركته مع الدعم الفني"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">تم نسخ التقرير</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" aria-hidden="true" />
                <span>نسخ تقرير الدعم الفني</span>
              </>
            )}
          </button>
        </div>

        {/* Collapsible Technical Details (Developer & IT Support) */}
        <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800/80 text-start max-w-2xl mx-auto">
          <button
            type="button"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="inline-flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 rounded-lg px-2 py-1"
            aria-expanded={showTechnicalDetails}
          >
            <Terminal className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <span>
              {showTechnicalDetails
                ? 'إخفاء التفاصيل الفنية / Hide Technical Details'
                : 'عرض التفاصيل الفنية للدعم والمطورين / Technical Details'}
            </span>
            {showTechnicalDetails ? (
              <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </button>

          {showTechnicalDetails && (
            <div
              dir="ltr"
              className="mt-3 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-rose-400 space-y-2 select-all overflow-x-auto shadow-inner"
            >
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-900 pb-2">
                <span>Route: {pathname}</span>
                <span>Type: {error.name || 'Error'}</span>
              </div>
              <div className="font-bold text-rose-300">
                {error.message || 'No error message provided'}
              </div>
              {error.digest && (
                <div className="text-amber-400 text-[11px]">
                  Digest: {error.digest}
                </div>
              )}
              {!isProduction && error.stack && (
                <pre className="text-[10px] text-slate-500 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto pt-2 border-t border-slate-900">
                  {error.stack}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Footer Guidance Note */}
        <div className="pt-2 text-center text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-2">
          <span>إذا استمرت المشكلة، يرجى مشاركة تقرير الخطأ مع فريق الدعم الفني لشركة بي زون.</span>
          <Link
            href="/dashboard"
            className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline inline-flex items-center gap-1"
          >
            <span>لوحة العمليات</span>
            <ArrowRight className="w-3 h-3 rotate-180" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
