'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  MapPin,
  CloudSun,
  Users,
  Wrench,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Send,
  Lock,
  Eye,
  ShieldCheck,
  Building2,
  RefreshCw,
  Loader2,
  Layers,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ExternalLink,
  SlidersHorizontal,
  Sun,
  ThermometerSun,
  CloudRain,
  Wind,
  CloudFog,
  HardHat,
  Truck,
  Activity,
  Maximize2,
  Grid,
  Info,
  Check,
  Clock3,
} from 'lucide-react';
import { toast } from 'sonner';
import { DailyProgressService } from '@/lib/services/dailyProgress.service';
import {
  DailyProgress,
  DailyProgressLine,
  DailyProgressPhoto,
  DailyObstruction,
  DailyManpowerLog,
  DailyEquipmentLog,
} from '@/types/planning';
import { UnifiedStatusBadge } from '../UnifiedStatusBadge';
import { WorkflowStepper } from '../WorkflowStepper';
import { SLAProgressBar } from '../SLAProgressBar';
import { ReasonModal } from '../ReasonModal';
import { getDisciplineMeta } from '../constants';
import { DailyProgressReviewModal } from '@/components/planning/DailyProgressReviewModal';
import { useAuth } from '@/lib/stores/useAuthStore';
import { logger } from '@/lib/logger';
import { useSignedStorageUrlMap } from '@/lib/hooks/useSignedStorageUrl';

export interface DailyReportDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string | null;
  userRoles: string[];
  onActionSuccess: () => void;
}

// ── Weather Analysis & Configuration ──────────────────────────────────────────

interface WeatherInfo {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
  badgeText: string;
  siteImpact: string;
  safetyLevel: 'safe' | 'caution' | 'warning';
}

function getWeatherInfo(weatherStr?: string | null): WeatherInfo {
  const raw = (weatherStr || '').trim().toLowerCase();

  if (raw.includes('rain') || raw.includes('مطر') || raw.includes('ممطر')) {
    return {
      id: 'rainy',
      label: 'ممطر / تساقط أمطار',
      icon: CloudRain,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/40',
      borderColor: 'border-blue-200 dark:border-blue-800',
      badgeText: 'تنبيه أمطار',
      siteImpact: 'تنبيه طقس: تعليق أعمال العزل الكيميائي والصب المكشوف، وتغطية لوحات ومضخات غرف التحكم.',
      safetyLevel: 'warning',
    };
  }

  if (raw.includes('wind') || raw.includes('رياح') || raw.includes('عاصف')) {
    return {
      id: 'windy',
      label: 'عاصف / رياح نشطة',
      icon: Wind,
      color: 'text-teal-600 dark:text-teal-400',
      bgColor: 'bg-teal-50 dark:bg-teal-950/40',
      borderColor: 'border-teal-200 dark:border-teal-800',
      badgeText: 'رياح نشطة',
      siteImpact: 'تنبيه رياح: إيقاف عمليات الرفع بالأوناش والعمل على السقالات المرتفعة حرصاً على سلامة العاملين.',
      safetyLevel: 'caution',
    };
  }

  if (raw.includes('dust') || raw.includes('غبار') || raw.includes('مغبر') || raw.includes('أتربة')) {
    return {
      id: 'dusty',
      label: 'مغبر / عوالق ترابية',
      icon: CloudFog,
      color: 'text-amber-700 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/40',
      borderColor: 'border-amber-200 dark:border-amber-800',
      badgeText: 'عوالق ترابية',
      siteImpact: 'عوالق ترابية: حماية المعدات الميكانيكية الحساسة ومضخات الفلترة وارتداء مهمات الوقاية التنفسية.',
      safetyLevel: 'caution',
    };
  }

  if (raw.includes('hot') || raw.includes('حار') || raw.includes('حرارة')) {
    return {
      id: 'hot',
      label: 'شديد الحرارة',
      icon: ThermometerSun,
      color: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-50 dark:bg-rose-950/40',
      borderColor: 'border-rose-200 dark:border-rose-800',
      badgeText: 'حرارة مرتفعة',
      siteImpact: 'حرارة مرتفعة: تكثيف رش ومعالجة الخرسانة وتوفير استراحات مظللة ومياه مبردة للعمالة.',
      safetyLevel: 'caution',
    };
  }

  if (raw.includes('cloud') || raw.includes('غائم')) {
    return {
      id: 'cloudy',
      label: 'غائم جزئياً',
      icon: CloudSun,
      color: 'text-sky-600 dark:text-sky-400',
      bgColor: 'bg-sky-50 dark:bg-sky-950/40',
      borderColor: 'border-sky-200 dark:border-sky-800',
      badgeText: 'أجواء معتدلة',
      siteImpact: 'ظروف جوية ممتازة ومثالية للأعمال الميدانية والمساحية وأعمال شبكات الأنابيب.',
      safetyLevel: 'safe',
    };
  }

  // Default / Sunny
  return {
    id: 'sunny',
    label: weatherStr?.trim() || 'مشمس / صافي',
    icon: Sun,
    color: 'text-amber-500 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/40',
    borderColor: 'border-amber-200 dark:border-amber-800',
    badgeText: 'مثالي للعمل',
    siteImpact: 'أجواء صافية ومثالية لكافة العمليات الإنشائية، الصب، والعزل والتشطيبات.',
    safetyLevel: 'safe',
  };
}

// ── Equipment Summary Parsing Helper ──────────────────────────────────────────

interface ParsedEquipmentItem {
  id: string;
  name: string;
  qty: number;
  status: 'active' | 'standby' | 'breakdown';
  notes?: string;
}

function parseEquipmentSummary(summaryStr?: string | null): ParsedEquipmentItem[] {
  if (!summaryStr || !summaryStr.trim()) return [];

  const parts = summaryStr.split(/[,،;+\n]+/).map((s) => s.trim()).filter(Boolean);

  return parts.map((part, index) => {
    const trailingMatch = part.match(/^(.*?)\s*(\d+)\s*$/);
    const leadingMatch = part.match(/^\s*(\d+)\s*(.*?)$/);

    let name = part;
    let qty = 1;

    if (trailingMatch && trailingMatch[1] && trailingMatch[2]) {
      name = trailingMatch[1].trim();
      qty = parseInt(trailingMatch[2], 10) || 1;
    } else if (leadingMatch && leadingMatch[1] && leadingMatch[2]) {
      name = leadingMatch[2].trim();
      qty = parseInt(leadingMatch[1], 10) || 1;
    }

    return {
      id: `equip-parsed-${index}`,
      name: name || part,
      qty: Math.max(1, qty),
      status: 'active' as const,
      notes: 'مسجل في ملخص معدات الموقع',
    };
  });
}

// ── Main Component ────────────────────────────────────────────────────────────

export const DailyReportDetailDrawer: React.FC<DailyReportDetailDrawerProps> = ({
  isOpen,
  onClose,
  reportId,
  userRoles = [],
  onActionSuccess,
}) => {
  const { user } = useAuth();

  const [report, setReport] = useState<DailyProgress | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Modals state
  const [reasonModalOpen, setReasonModalOpen] = useState<boolean>(false);
  const [reasonModalAction, setReasonModalAction] = useState<'reject' | 'reopen' | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState<boolean>(false);
  const [isWeatherInfoOpen, setIsWeatherInfoOpen] = useState<boolean>(false);

  // Photo carousel & lightbox state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [carouselIndex, setCarouselIndex] = useState<number>(0);
  const [photoViewMode, setPhotoViewMode] = useState<'carousel' | 'grid'>('carousel');

  // Active section tab
  const [activeTab, setActiveTab] = useState<'lines' | 'resources' | 'photos' | 'obstructions'>('lines');
  // Resources sub-tab (labor vs equipment)
  const [resourceSubTab, setResourceSubTab] = useState<'labor' | 'equipment'>('labor');

  const signedDrawerPhotoUrls = useSignedStorageUrlMap(
    'progress-photos',
    (report?.photos || []).map((p) =>
      p.photo_url && p.photo_url.includes('/storage/v1/object/sign/')
        ? p.photo_url
        : p.storage_path || p.photo_url || ''
    ),
    3600
  );
  const resolveDrawerPhotoUrl = (photo: DailyProgressPhoto): string => {
    const key =
      photo.photo_url && photo.photo_url.includes('/storage/v1/object/sign/')
        ? photo.photo_url
        : photo.storage_path || photo.photo_url || '';
    const signed = signedDrawerPhotoUrls[key];
    if (signed) return signed;
    if (
      photo.photo_url &&
      (photo.photo_url.startsWith('blob:') ||
        photo.photo_url.startsWith('data:') ||
        photo.photo_url.includes('/storage/v1/object/sign/'))
    ) {
      return photo.photo_url;
    }
    return '';
  };

  // Role permissions
  const normalizedRoles = useMemo(() => userRoles.map((r) => r.toLowerCase()), [userRoles]);
  const isPlanner = normalizedRoles.some((r) =>
    ['planning_engineer', 'planning_manager', 'planner'].includes(r)
  );
  const isPM = normalizedRoles.some((r) =>
    ['project_manager', 'pm', 'pm_engineer'].includes(r)
  );
  const isAdmin = normalizedRoles.some((r) =>
    ['admin', 'system_admin', 'ceo', 'coo', 'coo_assistant', 'chairman'].includes(r)
  );

  const canApproveOrReject = isPlanner || isPM || isAdmin;
  const canReopen = isPlanner || isAdmin;
  const canSubmit = true; // Site engineer or report creator can submit draft

  // Fetch report data
  const fetchReport = useCallback(async () => {
    if (!reportId) {
      setReport(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await DailyProgressService.getDailyReportById(reportId);
      if (data) {
        setReport(data);
      } else {
        setError('تعذر العثور على بيانات التقرير اليومي المطلوب');
      }
    } catch (err) {
      logger.error('Failed to fetch daily report details', { detail: err });
      setError('حدث خطأ أثناء تحميل بيانات التقرير');
    } finally {
      setIsLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    if (isOpen && reportId) {
      fetchReport();
      setActiveTab('lines');
      setCarouselIndex(0);
      setLightboxIndex(null);
    } else {
      setReport(null);
      setError(null);
      setLightboxIndex(null);
    }
  }, [isOpen, reportId, fetchReport]);

  // Handle ESC key and arrow keys for accessible dialog closing and photo navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      // Priority 1: Lightbox modal
      if (lightboxIndex !== null) {
        if (e.key === 'Escape') {
          e.stopPropagation();
          setLightboxIndex(null);
        } else if (e.key === 'ArrowRight') {
          // RTL navigation: arrow right goes to previous photo in RTL flow
          if (report?.photos && report.photos.length > 0) {
            setLightboxIndex((prev) =>
              prev === null ? 0 : (prev - 1 + report.photos!.length) % report.photos!.length
            );
          }
        } else if (e.key === 'ArrowLeft') {
          // RTL navigation: arrow left goes to next photo in RTL flow
          if (report?.photos && report.photos.length > 0) {
            setLightboxIndex((prev) =>
              prev === null ? 0 : (prev + 1) % report.photos!.length
            );
          }
        }
        return;
      }

      // Priority 2: Weather modal
      if (isWeatherInfoOpen) {
        if (e.key === 'Escape') {
          e.stopPropagation();
          setIsWeatherInfoOpen(false);
        }
        return;
      }

      // Priority 3: Drawer close (if no other modal open)
      if (e.key === 'Escape' && !isSubmitting && !reasonModalOpen && !reviewModalOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isOpen,
    lightboxIndex,
    isWeatherInfoOpen,
    isSubmitting,
    reasonModalOpen,
    reviewModalOpen,
    report?.photos,
    onClose,
  ]);

  // Handle Submit action (from draft)
  const handleSubmitReport = async () => {
    if (!report) return;
    setIsSubmitting(true);
    try {
      const success = await DailyProgressService.submitDailyReport(
        report.id,
        report.project_id,
        user?.id
      );
      if (success) {
        toast.success('تم تقديم التقرير اليومي للمراجعة بنجاح');
        await fetchReport();
        onActionSuccess();
      } else {
        toast.error('فشل تقديم التقرير اليومي');
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء تقديم التقرير');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Full Approve action
  const handleFullApprove = async () => {
    if (!report) return;
    setIsSubmitting(true);
    try {
      const success = await DailyProgressService.approveDailyReport(
        report.id,
        report.project_id,
        user?.id
      );
      if (success) {
        toast.success('تم اعتماد التقرير اليومي بالكامل وتوزيع الكميات على أنشطة المشروع');
        await fetchReport();
        onActionSuccess();
      } else {
        toast.error('فشل اعتماد التقرير اليومي');
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء اعتماد التقرير');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle PM Soft Review
  const handlePMSoftReview = async () => {
    if (!report) return;
    setIsSubmitting(true);
    try {
      const success = await DailyProgressService.pmSoftReview(
        report.id,
        user?.id || '',
        report.project_id,
        false
      );
      if (success) {
        toast.success('تم تسجيل مراجعة مدير المشروع وتأكيد الاطلاع بنجاح');
        await fetchReport();
        onActionSuccess();
      } else {
        toast.error('فشل تسجيل مراجعة مدير المشروع');
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء مراجعة مدير المشروع');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Reason Confirm (Reject / Reopen)
  const handleReasonConfirm = async (reason: string) => {
    if (!report || !reasonModalAction) return;
    setIsSubmitting(true);
    try {
      if (reasonModalAction === 'reject') {
        const success = await DailyProgressService.rejectDailyReport(
          report.id,
          user?.id || '',
          report.project_id,
          reason
        );
        if (success) {
          toast.success('تم رفض التقرير وإعادته للموقع مع توثيق الأسباب');
          setReasonModalOpen(false);
          setReasonModalAction(null);
          await fetchReport();
          onActionSuccess();
        } else {
          toast.error('فشل رفض التقرير');
        }
      } else if (reasonModalAction === 'reopen') {
        const success = await DailyProgressService.reopenDailyReport(
          report.id,
          reason,
          user?.id
        );
        if (success) {
          toast.success('تم إعادة فتح التقرير وتعليق التوزيعات المرتبطة به مؤقتاً');
          setReasonModalOpen(false);
          setReasonModalAction(null);
          await fetchReport();
          onActionSuccess();
        } else {
          toast.error('فشل إعادة فتح التقرير');
        }
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء تنفيذ الإجراء');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const discMeta = getDisciplineMeta(report?.discipline);
  const weatherInfo = getWeatherInfo(report?.weather);
  const WeatherIconComponent = weatherInfo.icon;

  // Stepper calculations
  const stepperSteps = [
    { key: 'draft', label: 'مسودة الموقع', subLabel: 'تسجيل البيانات' },
    { key: 'submitted', label: 'قيد المراجعة', subLabel: 'المراجعة الفنية' },
    { key: 'decision', label: 'قرار الاعتماد', subLabel: 'الترحيل والتوزيع' },
  ];

  const currentStep =
    report?.status === 'draft'
      ? 'draft'
      : report?.status === 'submitted'
      ? 'submitted'
      : 'decision';

  const completedSteps =
    report?.status === 'draft'
      ? []
      : report?.status === 'submitted'
      ? ['draft']
      : ['draft', 'submitted', ...(report?.status === 'approved' ? ['decision'] : [])];

  const rejectedSteps =
    report?.status === 'rejected' || report?.status === 'reopened' ? ['decision'] : [];

  // Manpower analytics
  const totalManpowerCount =
    Number(report?.manpower_count ?? 0) ||
    (report?.manpower_logs?.reduce((sum, l) => sum + (Number(l.headcount) || 0), 0) ?? 0);
  const idleManpowerCount =
    report?.obstructions?.reduce((sum, o) => sum + (Number(o.idle_manpower) || 0), 0) ?? 0;
  const activeManpowerCount = Math.max(0, totalManpowerCount - idleManpowerCount);
  const manpowerProductivityPct =
    totalManpowerCount > 0 ? Math.round((activeManpowerCount / totalManpowerCount) * 100) : 100;

  // Equipment analytics
  const parsedEquipmentList = parseEquipmentSummary(report?.equipment_summary);
  const structuredEquipmentLogs = report?.equipment_logs || [];
  const hasEquipmentLogs = structuredEquipmentLogs.length > 0;
  const totalEquipmentCount =
    Number(report?.equipment_count ?? 0) ||
    (hasEquipmentLogs
      ? structuredEquipmentLogs.reduce((s, e) => s + (Number(e.quantity || (e as unknown as { qty?: number }).qty) || 1), 0)
      : parsedEquipmentList.reduce((s, e) => s + e.qty, 0));
  const idleEquipmentObstructions =
    report?.obstructions?.filter((o) => Boolean(o.idle_equipment_summary)) || [];

  const photosList = report?.photos || [];
  const activePhoto =
    photosList.length > 0
      ? photosList[Math.min(carouselIndex, photosList.length - 1)]
      : null;

  return (
    <>
      {/* Drawer Root Container with Accessible Role */}
      <div
        className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="daily-report-drawer-title"
        aria-describedby="daily-report-drawer-desc"
      >
        {/* Backdrop click to close */}
        <div
          className="absolute inset-0"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Slide-over Drawer Panel with Smooth RTL/LTR Alignment */}
        <div className="absolute inset-y-0 end-0 max-w-full flex pointer-events-none">
          <div
            className="pointer-events-auto w-screen max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl bg-white dark:bg-slate-900 border-s border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden transition-transform duration-300 ease-out rtl:animate-in rtl:slide-in-from-left ltr:animate-in ltr:slide-in-from-right"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Header */}
            <div className="glass-card bg-white/95 dark:bg-slate-900/95 border-b border-slate-200/90 dark:border-slate-800/90 p-4 sm:p-6 flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-xs">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2
                      id="daily-report-drawer-title"
                      className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-mono tracking-tight"
                    >
                      تقرير يومي #{report?.report_no || report?.id?.slice(0, 8) || '---'}
                    </h2>
                    {report && (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${discMeta.bg} ${discMeta.text} ${discMeta.border}`}
                      >
                        {discMeta.labelAr}
                      </span>
                    )}
                    {report && (
                      <UnifiedStatusBadge
                        status={report.status}
                        entityType="report"
                        size="sm"
                      />
                    )}
                  </div>
                  <div
                    id="daily-report-drawer-desc"
                    className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap font-mono"
                  >
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span>{report?.progress_date || report?.report_date || '—'}</span>
                    </span>
                    {report?.entered_by_name && (
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        <span>{report.entered_by_name}</span>
                      </span>
                    )}
                    {report?.created_at && (
                      <span className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline-flex">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(report.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={fetchReport}
                  disabled={isLoading}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="تحديث البيانات"
                  aria-label="تحديث بيانات التقرير"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="إغلاق اللوحة"
                  aria-label="إغلاق التقرير اليومي"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {isLoading && !report ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500 space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                  <p className="text-sm font-medium">جاري تحميل تفاصيل التقرير اليومي...</p>
                </div>
              ) : error ? (
                <div className="p-6 rounded-3xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-center space-y-3">
                  <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
                  <p className="text-sm font-bold text-rose-700 dark:text-rose-400">{error}</p>
                  <button
                    type="button"
                    onClick={fetchReport}
                    className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-xs hover:bg-rose-700"
                  >
                    إعادة المحاولة
                  </button>
                </div>
              ) : report ? (
                <>
                  {/* Stepper Header */}
                  <WorkflowStepper
                    steps={stepperSteps}
                    currentStep={currentStep}
                    completedSteps={completedSteps}
                    rejectedSteps={rejectedSteps}
                  />

                  {/* SLA & Reopen/Reject Reason Alerts */}
                  <div className="space-y-3">
                    <SLAProgressBar
                      createdAt={report.created_at || report.progress_date}
                      targetHours={24}
                      label="اتفاقية مستوى الخدمة لمراجعة واعتماد التقرير (SLA 24h)"
                      showDetails={true}
                    />

                    {report.status === 'rejected' && report.rejection_reason && (
                      <div className="p-4 rounded-2xl bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200/90 dark:border-rose-900/80 flex items-start gap-3 text-xs">
                        <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-rose-900 dark:text-rose-200">
                            تم رفض التقرير وإعادته للتعديل
                          </h4>
                          <p className="text-rose-700 dark:text-rose-300 mt-1 leading-relaxed">
                            {report.rejection_reason}
                          </p>
                          {report.rejected_at && (
                            <span className="text-[10px] text-rose-500 dark:text-rose-400 mt-1 block font-mono">
                              تاريخ الرفض: {new Date(report.rejected_at).toLocaleString('ar-EG')}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {report.status === 'reopened' && report.reopened_reason && (
                      <div className="p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-900/80 flex items-start gap-3 text-xs">
                        <RotateCcw className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-amber-900 dark:text-amber-200">
                            تمت إعادة فتح التقرير للمراجعة
                          </h4>
                          <p className="text-amber-700 dark:text-amber-300 mt-1 leading-relaxed">
                            {report.reopened_reason}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* PM Soft Review Banner */}
                    <div className="glass-card bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`p-2 rounded-xl ${
                            report.pm_reviewed_at
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                              : report.pm_skipped
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <Lock className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">
                            مراجعة مدير المشروع (PM Soft Review)
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {report.pm_reviewed_at
                              ? `تمت المراجعة والاطلاع في ${new Date(report.pm_reviewed_at).toLocaleDateString('ar-EG')}`
                              : report.pm_skipped
                              ? 'تم تخطي المراجعة'
                              : 'بانتظار اطلاع ومراجعة مدير المشروع'}
                          </span>
                        </div>
                      </div>

                      {isPM && !report.pm_reviewed_at && (
                        <button
                          type="button"
                          onClick={handlePMSoftReview}
                          disabled={isSubmitting}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>تأكيد المراجعة</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ── Polished Site Summary & Weather Widget Grid ──────────────── */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    {/* Widget 1: Weather Condition Widget */}
                    <div
                      className={`glass-card p-3.5 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${weatherInfo.bgColor} ${weatherInfo.borderColor} flex flex-col justify-between`}
                      onClick={() => setIsWeatherInfoOpen(true)}
                      title="انقر لعرض الإرشادات البيئية والموقعية لحالة الطقس"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setIsWeatherInfoOpen(true);
                        }
                      }}
                      aria-label={`حالة الطقس: ${weatherInfo.label}. انقر للتفاصيل.`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5 font-bold">
                          <WeatherIconComponent className={`w-4 h-4 ${weatherInfo.color}`} />
                          <span>الطقس</span>
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                            weatherInfo.safetyLevel === 'warning'
                              ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'
                              : weatherInfo.safetyLevel === 'caution'
                              ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
                              : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                          }`}
                        >
                          {weatherInfo.badgeText}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900 dark:text-white block truncate text-xs">
                          {weatherInfo.label}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                          انقر لمعاينة الإرشادات
                        </span>
                      </div>
                    </div>

                    {/* Widget 2: Labor / Manpower Card */}
                    <div
                      className="glass-card bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 p-3.5 rounded-2xl flex flex-col justify-between cursor-pointer hover:border-emerald-500/50 transition-all"
                      onClick={() => {
                        setActiveTab('resources');
                        setResourceSubTab('labor');
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setActiveTab('resources');
                          setResourceSubTab('labor');
                        }
                      }}
                      aria-label="إجمالي العمالة، انقر للانتقال إلى جدول تفصيل العمالة"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-bold">
                          <Users className="w-3.5 h-3.5 text-sky-500" />
                          <span>إجمالي العمالة</span>
                        </span>
                        {idleManpowerCount > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                            {idleManpowerCount} معطل
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="font-bold text-slate-800 dark:text-slate-200 font-mono text-sm">
                          {totalManpowerCount ? `${totalManpowerCount} فرد` : '—'}
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                          {manpowerProductivityPct}% إنتاجية
                        </span>
                      </div>
                    </div>

                    {/* Widget 3: Equipment Card */}
                    <div
                      className="glass-card bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 p-3.5 rounded-2xl flex flex-col justify-between cursor-pointer hover:border-emerald-500/50 transition-all"
                      onClick={() => {
                        setActiveTab('resources');
                        setResourceSubTab('equipment');
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setActiveTab('resources');
                          setResourceSubTab('equipment');
                        }
                      }}
                      aria-label="المعدات والآليات، انقر للانتقال إلى جدول تفصيل المعدات"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-bold">
                          <Wrench className="w-3.5 h-3.5 text-orange-500" />
                          <span>المعدات</span>
                        </span>
                        {idleEquipmentObstructions.length > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                            توقف مسجل
                          </span>
                        )}
                      </div>
                      <span
                        className="font-bold text-slate-800 dark:text-slate-200 truncate"
                        title={report.equipment_summary || 'معدات قياسية'}
                      >
                        {totalEquipmentCount > 0
                          ? `${totalEquipmentCount} معدة / آلية`
                          : report.equipment_summary || 'معدات قياسية'}
                      </span>
                    </div>

                    {/* Widget 4: BOQ Lines Card */}
                    <div
                      className="glass-card bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 p-3.5 rounded-2xl flex flex-col justify-between cursor-pointer hover:border-emerald-500/50 transition-all"
                      onClick={() => setActiveTab('lines')}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setActiveTab('lines');
                        }
                      }}
                      aria-label="بنود الإنجاز، انقر للانتقال إلى جدول بنود التقرير"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-bold">
                          <Layers className="w-3.5 h-3.5 text-emerald-500" />
                          <span>بنود الإنجاز</span>
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          {report.lines?.filter((l) => l.line_status === 'approved').length || 0} معتمد
                        </span>
                      </div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 font-mono text-sm">
                        {report.lines?.length || 0} بنود
                      </span>
                    </div>
                  </div>

                  {/* Notes or Remarks */}
                  {report.notes && (
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        ملاحظات عامة من الموقع:
                      </span>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                        {report.notes}
                      </p>
                    </div>
                  )}

                  {/* Navigation Tabs Bar with Full ARIA Tablist Semantics */}
                  <div
                    className="flex items-center gap-1 sm:gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto"
                    role="tablist"
                    aria-label="أقسام التقرير اليومي"
                  >
                    <button
                      type="button"
                      role="tab"
                      id="tab-lines"
                      aria-selected={activeTab === 'lines'}
                      aria-controls="panel-lines"
                      onClick={() => setActiveTab('lines')}
                      className={`inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        activeTab === 'lines'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>بنود الإنجاز ({report.lines?.length || 0})</span>
                    </button>

                    <button
                      type="button"
                      role="tab"
                      id="tab-resources"
                      aria-selected={activeTab === 'resources'}
                      aria-controls="panel-resources"
                      onClick={() => setActiveTab('resources')}
                      className={`inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        activeTab === 'resources'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <HardHat className="w-3.5 h-3.5 text-amber-500" />
                      <span>العمالة والمعدات</span>
                    </button>

                    <button
                      type="button"
                      role="tab"
                      id="tab-photos"
                      aria-selected={activeTab === 'photos'}
                      aria-controls="panel-photos"
                      onClick={() => setActiveTab('photos')}
                      className={`inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        activeTab === 'photos'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>الصور المرفقة ({report.photos?.length || 0})</span>
                    </button>

                    <button
                      type="button"
                      role="tab"
                      id="tab-obstructions"
                      aria-selected={activeTab === 'obstructions'}
                      aria-controls="panel-obstructions"
                      onClick={() => setActiveTab('obstructions')}
                      className={`inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        activeTab === 'obstructions'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                      <span>سجل العوائق ({report.obstructions?.length || 0})</span>
                    </button>
                  </div>

                  {/* ── TAB 1: Progress Lines Table ───────────────────────────── */}
                  {activeTab === 'lines' && (
                    <div
                      id="panel-lines"
                      role="tabpanel"
                      aria-labelledby="tab-lines"
                      className="space-y-3"
                    >
                      {(!report.lines || report.lines.length === 0) ? (
                        <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 dark:text-slate-500 text-xs">
                          لا توجد بنود إنجاز مسجلة في هذا التقرير
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-800/90">
                          <table className="w-full text-start text-xs border-collapse">
                            <thead className="bg-slate-100/90 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 text-[11px] font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                              <tr>
                                <th className="p-3 text-start">كود البند</th>
                                <th className="p-3 text-start">الوصف والملاحظات</th>
                                <th className="p-3 text-center">الوحدة</th>
                                <th className="p-3 text-center">الكمية اليومية</th>
                                <th className="p-3 text-center">المنطقة</th>
                                <th className="p-3 text-center">حالة البند</th>
                                <th className="p-3 text-center">فحص WIR</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white/80 dark:bg-slate-900/80">
                              {report.lines.map((line: DailyProgressLine, idx: number) => {
                                const isLineApproved = line.line_status === 'approved';
                                const isLineRejected = line.line_status === 'rejected';

                                return (
                                  <tr
                                    key={line.id || idx}
                                    className="hover:bg-slate-50 dark:bg-slate-800/60/70 dark:bg-slate-800/50 dark:hover:bg-slate-800/40 transition-colors"
                                  >
                                    <td className="p-3 font-mono font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                                      {line.boq_item?.item_code || '—'}
                                    </td>
                                    <td className="p-3 font-medium text-slate-800 dark:text-slate-200 max-w-xs">
                                      <div className="line-clamp-2">
                                        {line.boq_item?.description_ar || '—'}
                                      </div>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {line.is_material_on_site && (
                                          <span className="text-[10px] bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 px-1.5 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                                            مواد مشونة بالموقع (MOS)
                                          </span>
                                        )}
                                        {line.is_claimable_vo && (
                                          <span className="text-[10px] bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                                            أمر تغيير للمطالبة
                                          </span>
                                        )}
                                      </div>
                                      {line.rejection_reason && (
                                        <div className="text-[10px] text-rose-600 dark:text-rose-400 mt-1 font-normal">
                                          سبب الرفض: {line.rejection_reason}
                                        </div>
                                      )}
                                    </td>
                                    <td className="p-3 text-center text-slate-500 dark:text-slate-400 font-mono">
                                      {line.boq_item?.unit || '—'}
                                    </td>
                                    <td className="p-3 text-center font-mono font-bold text-slate-900 dark:text-white">
                                      {line.qty_today}
                                    </td>
                                    <td className="p-3 text-center text-slate-600 dark:text-slate-400 text-[11px]">
                                      {line.zone || '—'}
                                    </td>
                                    <td className="p-3 text-center">
                                      <span
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                          isLineApproved
                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                            : isLineRejected
                                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                        }`}
                                      >
                                        {isLineApproved ? 'معتمد' : isLineRejected ? 'مرفوض' : 'قيد المراجعة'}
                                      </span>
                                    </td>
                                    <td className="p-3 text-center font-mono text-[11px]">
                                      {line.wir_no ? (
                                        <span className="text-sky-700 dark:text-sky-400 font-bold">
                                          {line.wir_no}
                                        </span>
                                      ) : (
                                        <span className="text-slate-400 dark:text-slate-500">—</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── TAB 2: Labor & Equipment Breakdown Tables ─────────────── */}
                  {activeTab === 'resources' && (
                    <div
                      id="panel-resources"
                      role="tabpanel"
                      aria-labelledby="tab-resources"
                      className="space-y-4"
                    >
                      {/* Sub-tab Switcher (Labor vs Equipment) */}
                      <div className="flex items-center justify-between gap-3 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setResourceSubTab('labor')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                              resourceSubTab === 'labor'
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                          >
                            <Users className="w-3.5 h-3.5 text-sky-500" />
                            <span>سجل وتوزيع العمالة (Labor)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setResourceSubTab('equipment')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                              resourceSubTab === 'equipment'
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                          >
                            <Truck className="w-3.5 h-3.5 text-orange-500" />
                            <span>حصر وتشغيل المعدات (Equipment)</span>
                          </button>
                        </div>

                        <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline-block font-mono">
                          {resourceSubTab === 'labor'
                            ? `إجمالي ${totalManpowerCount} فرد`
                            : `إجمالي ${totalEquipmentCount} معدة`}
                        </span>
                      </div>

                      {/* ── Labor Breakdown View ── */}
                      {resourceSubTab === 'labor' && (
                        <div className="space-y-3">
                          {/* Labor KPI Metrics Banner */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                            <div className="p-3 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-900/60">
                              <span className="text-[11px] font-bold text-sky-700 dark:text-sky-300 block">
                                إجمالي العمالة
                              </span>
                              <span className="text-base font-extrabold font-mono text-sky-950 dark:text-white">
                                {totalManpowerCount} فرد
                              </span>
                            </div>

                            <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60">
                              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 block">
                                عمالة فعالة منتجة
                              </span>
                              <span className="text-base font-extrabold font-mono text-emerald-950 dark:text-white">
                                {activeManpowerCount} فرد
                              </span>
                            </div>

                            <div className="p-3 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/60">
                              <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 block">
                                عمالة متوقفة (عوائق)
                              </span>
                              <span className="text-base font-extrabold font-mono text-rose-950 dark:text-white">
                                {idleManpowerCount} فرد
                              </span>
                            </div>

                            <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                                نسبة الإنتاجية
                              </span>
                              <span className="text-base font-extrabold font-mono text-slate-900 dark:text-white">
                                {manpowerProductivityPct}%
                              </span>
                            </div>
                          </div>

                          {/* Obstruction Idle Manpower Alert (if any) */}
                          {idleManpowerCount > 0 && (
                            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs flex items-start gap-2.5">
                              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                              <div className="flex-1 space-y-1">
                                <span className="font-bold text-rose-900 dark:text-rose-200 block">
                                  تم رصد توقف {idleManpowerCount} عمال عن العمل بسبب عوائق موقعية ({idleManpowerCount * 8} ساعة عمل مهدورة):
                                </span>
                                <ul className="list-disc list-inside text-rose-800 dark:text-rose-300 text-[11px] space-y-0.5">
                                  {report.obstructions
                                    ?.filter((o) => Number(o.idle_manpower) > 0)
                                    .map((obs, oIdx) => (
                                      <li key={obs.id || oIdx}>
                                        {obs.obstruction_type}: {obs.idle_manpower} عامل متوقف ({obs.description.slice(0, 70)}...) - مسؤولية: {obs.responsible_party}
                                      </li>
                                    ))}
                                </ul>
                              </div>
                            </div>
                          )}

                          {/* Labor Breakdown Table */}
                          <div className="overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-800/90">
                            <table className="w-full text-start text-xs border-collapse">
                              <thead className="bg-slate-100/90 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 text-[11px] font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                  <th className="p-3 text-start">م</th>
                                  <th className="p-3 text-start">الفئة المهنية / التخصص</th>
                                  <th className="p-3 text-center">العدد (أفراد)</th>
                                  <th className="p-3 text-center">ساعات الوردية</th>
                                  <th className="p-3 text-center">إجمالي ساعات العمل</th>
                                  <th className="p-3 text-center">التبعية / مقاول الباطن</th>
                                  <th className="p-3 text-center">حالة التشغيل</th>
                                  <th className="p-3 text-start">ملاحظات</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white/80 dark:bg-slate-900/80">
                                {report.manpower_logs && report.manpower_logs.length > 0 ? (
                                  report.manpower_logs.map((log: DailyManpowerLog, idx: number) => {
                                    const craft = log.craft_type || (log as unknown as { trade?: string }).trade || 'حرفي / عامل';
                                    const count = Number(log.headcount || 0);
                                    const hours = Number((log as any).working_hours || (log as any).hours || 8);
                                    const totalHours = count * hours;

                                    return (
                                      <tr
                                        key={log.id || idx}
                                        className="hover:bg-slate-50 dark:bg-slate-800/60/70 dark:bg-slate-800/50 dark:hover:bg-slate-800/40 transition-colors"
                                      >
                                        <td className="p-3 font-mono text-slate-400 dark:text-slate-500">{idx + 1}</td>
                                        <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                                          {craft}
                                        </td>
                                        <td className="p-3 text-center font-mono font-bold text-sky-700 dark:text-sky-400">
                                          {count}
                                        </td>
                                        <td className="p-3 text-center font-mono text-slate-600 dark:text-slate-400">
                                          {hours} ساعة
                                        </td>
                                        <td className="p-3 text-center font-mono font-bold text-slate-900 dark:text-white">
                                          {totalHours} س/ع
                                        </td>
                                        <td className="p-3 text-center text-slate-600 dark:text-slate-400 text-[11px]">
                                          {log.subcontractor_id ? 'مقاول باطن' : 'فريق التنفيذ المباشر'}
                                        </td>
                                        <td className="p-3 text-center">
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                            منتجة
                                          </span>
                                        </td>
                                        <td className="p-3 text-slate-500 dark:text-slate-400 text-[11px] max-w-xs truncate">
                                          {log.notes || '—'}
                                        </td>
                                      </tr>
                                    );
                                  })
                                ) : totalManpowerCount > 0 ? (
                                  // Fallback structured breakdown when only header manpower_count is stored
                                  <>
                                    <tr className="hover:bg-slate-50 dark:bg-slate-800/60/70 dark:bg-slate-800/50 dark:hover:bg-slate-800/40 transition-colors">
                                      <td className="p-3 font-mono text-slate-400 dark:text-slate-500">1</td>
                                      <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                                        إجمالي القوى العاملة الميدانية ({discMeta.labelAr})
                                      </td>
                                      <td className="p-3 text-center font-mono font-bold text-sky-700 dark:text-sky-400">
                                        {activeManpowerCount}
                                      </td>
                                      <td className="p-3 text-center font-mono text-slate-600 dark:text-slate-400">
                                        8 ساعات
                                      </td>
                                      <td className="p-3 text-center font-mono font-bold text-slate-900 dark:text-white">
                                        {activeManpowerCount * 8} س/ع
                                      </td>
                                      <td className="p-3 text-center text-slate-600 dark:text-slate-400 text-[11px]">
                                        طاقم الموقع المعتمد
                                      </td>
                                      <td className="p-3 text-center">
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                          عاملة بالموقع
                                        </span>
                                      </td>
                                      <td className="p-3 text-slate-500 dark:text-slate-400 text-[11px]">
                                        حسب ملخص تقرير الموقع اليومي
                                      </td>
                                    </tr>

                                    {idleManpowerCount > 0 && (
                                      <tr className="bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors">
                                        <td className="p-3 font-mono text-rose-400 dark:text-rose-500">2</td>
                                        <td className="p-3 font-bold text-rose-800 dark:text-rose-300">
                                          عمالة متوقفة قيد حصر الأضرار (Idle Labor)
                                        </td>
                                        <td className="p-3 text-center font-mono font-bold text-rose-700 dark:text-rose-400">
                                          {idleManpowerCount}
                                        </td>
                                        <td className="p-3 text-center font-mono text-slate-600 dark:text-slate-400">
                                          8 ساعات
                                        </td>
                                        <td className="p-3 text-center font-mono font-bold text-rose-700 dark:text-rose-400">
                                          {idleManpowerCount * 8} س/ع
                                        </td>
                                        <td className="p-3 text-center text-rose-600 dark:text-rose-400 text-[11px]">
                                          عوائق موقعية موثقة
                                        </td>
                                        <td className="p-3 text-center">
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                            معطلة
                                          </span>
                                        </td>
                                        <td className="p-3 text-rose-600 dark:text-rose-400 text-[11px]">
                                          مؤهلة للمطالبة بتمديد زمني (EOT Claim)
                                        </td>
                                      </tr>
                                    )}
                                  </>
                                ) : (
                                  <tr>
                                    <td
                                      colSpan={8}
                                      className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs"
                                    >
                                      لم يتم تسجيل أي بيانات عمالة في هذا التقرير
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                              {totalManpowerCount > 0 && (
                                <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-bold border-t border-slate-200 dark:border-slate-800 text-[11px]">
                                  <tr>
                                    <td colSpan={2} className="p-3 text-start text-slate-800 dark:text-slate-200">
                                      الإجمالي العام للعمالة وساعات العمل
                                    </td>
                                    <td className="p-3 text-center font-mono text-emerald-700 dark:text-emerald-400">
                                      {totalManpowerCount} فرد
                                    </td>
                                    <td className="p-3 text-center font-mono text-slate-500 dark:text-slate-400">—</td>
                                    <td className="p-3 text-center font-mono text-emerald-700 dark:text-emerald-400">
                                      {totalManpowerCount * 8} س/ع
                                    </td>
                                    <td colSpan={3} className="p-3 text-end text-slate-500 dark:text-slate-400">
                                      المعدل القياسي: 8 ساعات عمل/يوم
                                    </td>
                                  </tr>
                                </tfoot>
                              )}
                            </table>
                          </div>
                        </div>
                      )}

                      {/* ── Equipment Breakdown View ── */}
                      {resourceSubTab === 'equipment' && (
                        <div className="space-y-3">
                          {/* Equipment KPI Metrics Banner */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                            <div className="p-3 rounded-2xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200/80 dark:border-orange-900/60">
                              <span className="text-[11px] font-bold text-orange-700 dark:text-orange-300 block">
                                إجمالي المعدات
                              </span>
                              <span className="text-base font-extrabold font-mono text-orange-950 dark:text-white">
                                {totalEquipmentCount} معدة
                              </span>
                            </div>

                            <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60">
                              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 block">
                                معدات عاملة
                              </span>
                              <span className="text-base font-extrabold font-mono text-emerald-950 dark:text-white">
                                {Math.max(0, totalEquipmentCount - idleEquipmentObstructions.length)} وحدة
                              </span>
                            </div>

                            <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60">
                              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 block">
                                معدات متوقفة / معطلة
                              </span>
                              <span className="text-base font-extrabold font-mono text-amber-950 dark:text-white">
                                {idleEquipmentObstructions.length} وحدة
                              </span>
                            </div>

                            <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                                جاهزية الأسطول
                              </span>
                              <span className="text-base font-extrabold font-mono text-slate-900 dark:text-white">
                                {totalEquipmentCount > 0
                                  ? `${Math.round(((totalEquipmentCount - idleEquipmentObstructions.length) / totalEquipmentCount) * 100)}%`
                                  : '100%'}
                              </span>
                            </div>
                          </div>

                          {/* Idle Equipment Alert from Obstructions */}
                          {idleEquipmentObstructions.length > 0 && (
                            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs flex items-start gap-2.5">
                              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                              <div className="flex-1 space-y-1">
                                <span className="font-bold text-amber-900 dark:text-amber-200 block">
                                  تنبيه توقف معدات وآليات بموجب سجل العوائق الموقعية:
                                </span>
                                <ul className="list-disc list-inside text-amber-800 dark:text-amber-300 text-[11px] space-y-0.5">
                                  {idleEquipmentObstructions.map((obs, oIdx) => (
                                    <li key={obs.id || oIdx}>
                                      {obs.idle_equipment_summary} ({obs.description.slice(0, 60)}...)
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}

                          {/* Equipment Breakdown Table */}
                          <div className="overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-800/90">
                            <table className="w-full text-start text-xs border-collapse">
                              <thead className="bg-slate-100/90 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 text-[11px] font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                  <th className="p-3 text-start">م</th>
                                  <th className="p-3 text-start">المعدة / الآلية</th>
                                  <th className="p-3 text-center">العدد</th>
                                  <th className="p-3 text-center">ساعات التشغيل</th>
                                  <th className="p-3 text-center">ساعات التوقف</th>
                                  <th className="p-3 text-center">المشغل</th>
                                  <th className="p-3 text-center">الحالة التشغيلية</th>
                                  <th className="p-3 text-start">ملاحظات وحالة الآلية</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white/80 dark:bg-slate-900/80">
                                {hasEquipmentLogs ? (
                                  structuredEquipmentLogs.map((eq: DailyEquipmentLog, idx: number) => {
                                    const qty = Number(eq.quantity || (eq as unknown as { qty?: number }).qty || 1);
                                    const opHours = Number(eq.working_hours || (eq as unknown as { operating_hours?: number }).operating_hours || 8);
                                    const idleHours = Number(eq.idle_hours || 0);
                                    const operator = (eq as unknown as { operator_name?: string }).operator_name || 'مشغل معتمد';
                                    const status = (eq as unknown as { status?: string }).status || 'active';

                                    return (
                                      <tr
                                        key={eq.id || idx}
                                        className="hover:bg-slate-50 dark:bg-slate-800/60/70 dark:bg-slate-800/50 dark:hover:bg-slate-800/40 transition-colors"
                                      >
                                        <td className="p-3 font-mono text-slate-400 dark:text-slate-500">{idx + 1}</td>
                                        <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                                          {eq.equipment_name}
                                        </td>
                                        <td className="p-3 text-center font-mono font-bold text-orange-700 dark:text-orange-400">
                                          {qty}
                                        </td>
                                        <td className="p-3 text-center font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                                          {opHours} س
                                        </td>
                                        <td className="p-3 text-center font-mono text-slate-500 dark:text-slate-400">
                                          {idleHours > 0 ? `${idleHours} س` : '0'}
                                        </td>
                                        <td className="p-3 text-center text-slate-600 dark:text-slate-400 text-[11px]">
                                          {operator}
                                        </td>
                                        <td className="p-3 text-center">
                                          <span
                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                              status === 'active'
                                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                                : status === 'standby'
                                                ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                            }`}
                                          >
                                            {status === 'active' ? 'عاملة' : status === 'standby' ? 'احتياط' : 'معطلة'}
                                          </span>
                                        </td>
                                        <td className="p-3 text-slate-500 dark:text-slate-400 text-[11px] max-w-xs truncate">
                                          {eq.notes || '—'}
                                        </td>
                                      </tr>
                                    );
                                  })
                                ) : parsedEquipmentList.length > 0 ? (
                                  parsedEquipmentList.map((item, idx) => (
                                    <tr
                                      key={item.id}
                                      className="hover:bg-slate-50 dark:bg-slate-800/60/70 dark:bg-slate-800/50 dark:hover:bg-slate-800/40 transition-colors"
                                    >
                                      <td className="p-3 font-mono text-slate-400 dark:text-slate-500">{idx + 1}</td>
                                      <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                                        {item.name}
                                      </td>
                                      <td className="p-3 text-center font-mono font-bold text-orange-700 dark:text-orange-400">
                                        {item.qty}
                                      </td>
                                      <td className="p-3 text-center font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                                        8 س (تقديري)
                                      </td>
                                      <td className="p-3 text-center font-mono text-slate-500 dark:text-slate-400">0</td>
                                      <td className="p-3 text-center text-slate-600 dark:text-slate-400 text-[11px]">
                                        طاقم المقاول
                                      </td>
                                      <td className="p-3 text-center">
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                          عاملة بالموقع
                                        </span>
                                      </td>
                                      <td className="p-3 text-slate-500 dark:text-slate-400 text-[11px]">
                                        {item.notes}
                                      </td>
                                    </tr>
                                  ))
                                ) : report.equipment_summary ? (
                                  <tr>
                                    <td className="p-3 font-mono text-slate-400 dark:text-slate-500">1</td>
                                    <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                                      {report.equipment_summary}
                                    </td>
                                    <td className="p-3 text-center font-mono font-bold text-orange-700 dark:text-orange-400">
                                      {report.equipment_count || 1}
                                    </td>
                                    <td className="p-3 text-center font-mono text-emerald-700 dark:text-emerald-400">
                                      8 س
                                    </td>
                                    <td className="p-3 text-center font-mono text-slate-500 dark:text-slate-400">0</td>
                                    <td className="p-3 text-center text-slate-600 dark:text-slate-400 text-[11px]">
                                      مشغلون معتمدون
                                    </td>
                                    <td className="p-3 text-center">
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                        عاملة
                                      </span>
                                    </td>
                                    <td className="p-3 text-slate-500 dark:text-slate-400 text-[11px]">
                                      بيانات ملخص التقرير
                                    </td>
                                  </tr>
                                ) : (
                                  <tr>
                                    <td
                                      colSpan={8}
                                      className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs"
                                    >
                                      لم يتم تسجيل أي معدات أو آليات في هذا التقرير
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                              {totalEquipmentCount > 0 && (
                                <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-bold border-t border-slate-200 dark:border-slate-800 text-[11px]">
                                  <tr>
                                    <td colSpan={2} className="p-3 text-start text-slate-800 dark:text-slate-200">
                                      إجمالي المعدات والآليات بالموقع
                                    </td>
                                    <td className="p-3 text-center font-mono text-orange-700 dark:text-orange-400">
                                      {totalEquipmentCount} وحدة
                                    </td>
                                    <td colSpan={5} className="p-3 text-end text-slate-500 dark:text-slate-400">
                                      جاهزية قياسية للأعمال الميدانية
                                    </td>
                                  </tr>
                                </tfoot>
                              )}
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── TAB 3: Photos Carousel & Responsive Gallery ──────────── */}
                  {activeTab === 'photos' && (
                    <div
                      id="panel-photos"
                      role="tabpanel"
                      aria-labelledby="tab-photos"
                      className="space-y-4"
                    >
                      {(!report.photos || report.photos.length === 0) ? (
                        <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 dark:text-slate-500 text-xs">
                          لا توجد صور فوتوغرافية مرفقة بهذا التقرير
                        </div>
                      ) : (
                        <>
                          {/* Photo Controls Bar */}
                          <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                توثيق صور تقدم الأعمال بالموقع
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {report.photos.length} صورة
                              </span>
                            </div>

                            {/* View Mode Switcher */}
                            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                              <button
                                type="button"
                                onClick={() => setPhotoViewMode('carousel')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                                  photoViewMode === 'carousel'
                                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-2xs'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                                }`}
                                aria-label="عرض الشرائح التفاعلي"
                              >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">عرض الشرائح</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setPhotoViewMode('grid')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                                  photoViewMode === 'grid'
                                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-2xs'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                                }`}
                                aria-label="عرض شبكة الصور"
                              >
                                <Grid className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">شبكة الصور</span>
                              </button>
                            </div>
                          </div>

                          {/* Mode A: Responsive Interactive Carousel */}
                          {photoViewMode === 'carousel' && activePhoto && (
                            <div className="space-y-3">
                              {/* Main Featured Carousel Stage */}
                              <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 aspect-video sm:aspect-16/9 max-h-96 w-full flex items-center justify-center shadow-lg group">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={resolveDrawerPhotoUrl(activePhoto) || undefined}
                                  alt={activePhoto.caption || `صورة تقدم الأعمال #${carouselIndex + 1}`}
                                  className="w-full h-full object-contain transition-all duration-300"
                                />

                                {/* Prev / Next Overlays with RTL Awareness */}
                                {report.photos.length > 1 && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setCarouselIndex(
                                          (prev) => (prev - 1 + report.photos!.length) % report.photos!.length
                                        )
                                      }
                                      className="absolute start-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-950/70 hover:bg-slate-900 text-white backdrop-blur-md border border-white/10 shadow-md transition-transform active:scale-95"
                                      aria-label="الصورة السابقة"
                                      title="الصورة السابقة"
                                    >
                                      {/* In RTL reading flow, Right Arrow navigates to visually preceding item */}
                                      <ChevronRight className="w-5 h-5 rtl:inline ltr:hidden" />
                                      <ChevronLeft className="w-5 h-5 ltr:inline rtl:hidden" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        setCarouselIndex((prev) => (prev + 1) % report.photos!.length)
                                      }
                                      className="absolute end-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-950/70 hover:bg-slate-900 text-white backdrop-blur-md border border-white/10 shadow-md transition-transform active:scale-95"
                                      aria-label="الصورة التالية"
                                      title="الصورة التالية"
                                    >
                                      {/* In RTL reading flow, Left Arrow navigates to visually next item */}
                                      <ChevronLeft className="w-5 h-5 rtl:inline ltr:hidden" />
                                      <ChevronRight className="w-5 h-5 ltr:inline rtl:hidden" />
                                    </button>
                                  </>
                                )}

                                {/* Top Badges */}
                                <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
                                  <span className="pointer-events-auto px-3 py-1 rounded-full text-xs font-mono font-bold bg-black/60 text-white backdrop-blur-md border border-white/10">
                                    صورة {carouselIndex + 1} من {report.photos.length}
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() => setLightboxIndex(carouselIndex)}
                                    className="pointer-events-auto p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/10 transition-colors"
                                    title="تكبير الصورة بالحجم الكامل"
                                    aria-label="تكبير الصورة بالحجم الكامل"
                                  >
                                    <Maximize2 className="w-4 h-4" />
                                  </button>
                                </div>

                                {/* Bottom Caption Bar */}
                                <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent text-white text-xs">
                                  <p className="font-medium truncate">
                                    {activePhoto.caption || `توثيق مرحلي #${carouselIndex + 1}`}
                                  </p>
                                  {activePhoto.uploaded_at && (
                                    <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                                      تم الرفع: {new Date(activePhoto.uploaded_at).toLocaleString('ar-EG')}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Thumbnail Filmstrip */}
                              <div
                                className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin"
                                role="region"
                                aria-label="شريط المعاينة السريعة للصور"
                              >
                                {report.photos.map((photo: DailyProgressPhoto, idx: number) => {
                                  const url = resolveDrawerPhotoUrl(photo);
                                  const isSelected = idx === carouselIndex;

                                  return (
                                    <button
                                      key={photo.id || idx}
                                      type="button"
                                      onClick={() => setCarouselIndex(idx)}
                                      className={`relative shrink-0 w-20 h-14 rounded-xl overflow-hidden border transition-all ${
                                        isSelected
                                          ? 'border-emerald-500 ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900 scale-102'
                                          : 'border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100'
                                      }`}
                                      aria-label={`عرض الصورة رقم ${idx + 1}`}
                                      aria-current={isSelected ? 'true' : 'false'}
                                    >
                                      {url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                          src={url}
                                          alt=""
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                                          <ImageIcon className="w-4 h-4" />
                                        </div>
                                      )}
                                      <span className="absolute bottom-0.5 start-1 font-mono text-[9px] font-bold text-white bg-black/60 px-1 rounded">
                                        {idx + 1}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Mode B: Responsive Grid */}
                          {photoViewMode === 'grid' && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                              {report.photos.map((photo: DailyProgressPhoto, idx: number) => {
                                const url = resolveDrawerPhotoUrl(photo);
                                return (
                                  <div
                                    key={photo.id || idx}
                                    className="group relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 aspect-video flex flex-col justify-end cursor-pointer shadow-xs hover:shadow-md transition-all"
                                    onClick={() => setLightboxIndex(idx)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        setLightboxIndex(idx);
                                      }
                                    }}
                                    aria-label={`صورة #${idx + 1}: ${photo.caption || 'انقر للمعاينة'}`}
                                  >
                                    {url ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={url}
                                        alt={photo.caption || 'صورة تقدم الأعمال'}
                                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                      />
                                    ) : (
                                      <div className="absolute inset-0 flex items-center justify-center text-slate-400 dark:text-slate-500">
                                        <ImageIcon className="w-8 h-8 opacity-40" />
                                      </div>
                                    )}
                                    <div className="relative z-10 p-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white text-[11px] truncate flex items-center justify-between">
                                      <span className="truncate font-medium">
                                        {photo.caption || `صورة #${idx + 1}`}
                                      </span>
                                      <Eye className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* ── TAB 4: Obstructions ───────────────────────────────────── */}
                  {activeTab === 'obstructions' && (
                    <div
                      id="panel-obstructions"
                      role="tabpanel"
                      aria-labelledby="tab-obstructions"
                      className="space-y-3"
                    >
                      {(!report.obstructions || report.obstructions.length === 0) ? (
                        <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 dark:text-slate-500 text-xs">
                          لا توجد معوقات أو عوائق موقعية مسجلة في هذا التقرير
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {report.obstructions.map((obs: DailyObstruction, idx: number) => (
                            <div
                              key={obs.id || idx}
                              className="glass-card bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/60 p-4 rounded-2xl text-xs space-y-2"
                            >
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                                  <span>{obs.obstruction_type}</span>
                                </span>
                                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold">
                                  الجهة المسؤولة: {obs.responsible_party}
                                </span>
                              </div>
                              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                {obs.description}
                              </p>

                              {(obs.idle_manpower || obs.idle_equipment_summary) && (
                                <div className="flex flex-wrap gap-2 pt-1 border-t border-rose-200/60 dark:border-rose-900/40 text-[11px]">
                                  {Number(obs.idle_manpower) > 0 && (
                                    <span className="font-mono text-rose-700 dark:text-rose-400 font-bold">
                                      عمالة معطلة: {obs.idle_manpower} عامل ({Number(obs.idle_manpower) * 8} ساعة)
                                    </span>
                                  )}
                                  {obs.idle_equipment_summary && (
                                    <span className="text-slate-600 dark:text-slate-400">
                                      معدات متأثرة: {obs.idle_equipment_summary}
                                    </span>
                                  )}
                                </div>
                              )}

                              {obs.resolution_notes && (
                                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-[11px]">
                                  <strong>إجراء المعالجة المتخذ: </strong> {obs.resolution_notes}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* Footer Actions Bar */}
            {report && (
              <div className="glass-card bg-white/95 dark:bg-slate-900/95 border-t border-slate-200/90 dark:border-slate-800/90 p-4 sm:p-5 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    aria-label="إغلاق اللوحة"
                  >
                    إغلاق
                  </button>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap justify-end">
                  {/* Draft Status Actions */}
                  {report.status === 'draft' && canSubmit && (
                    <button
                      type="button"
                      onClick={handleSubmitReport}
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-600/20 transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      <span>تقديم التقرير للمراجعة</span>
                    </button>
                  )}

                  {/* Submitted Status Actions (Planner / PM / Admin) */}
                  {report.status === 'submitted' && canApproveOrReject && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setReasonModalAction('reject');
                          setReasonModalOpen(true);
                        }}
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>رفض التقرير</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setReviewModalOpen(true)}
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                      >
                        <FileText className="w-4 h-4 text-emerald-600" />
                        <span>مراجعة تفصيلية</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleFullApprove}
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition-all disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        <span>اعتماد كامل وتوزيع</span>
                      </button>
                    </>
                  )}

                  {/* Approved Status Actions (Reopen for planner/admin) */}
                  {report.status === 'approved' && canReopen && (
                    <button
                      type="button"
                      onClick={() => {
                        setReasonModalAction('reopen');
                        setReasonModalOpen(true);
                      }}
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all disabled:opacity-50"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>إعادة فتح التقرير</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Weather Information Modal ────────────────────────────────────────── */}
      {isWeatherInfoOpen && (
        <div
          className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="weather-modal-title"
          onClick={() => setIsWeatherInfoOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${weatherInfo.bgColor} ${weatherInfo.borderColor} border`}>
                  <WeatherIconComponent className={`w-6 h-6 ${weatherInfo.color}`} />
                </div>
                <div>
                  <h3 id="weather-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
                    حالة الطقس الموقعي
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {report?.progress_date || 'تاريخ اليوم'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsWeatherInfoOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="إغلاق نافذة معلومات الطقس"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">الظرف الجوي المسجل:</span>
                <span className="font-bold text-slate-900 dark:text-white">{weatherInfo.label}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">تقييم الملاءمة الموقعية:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded-md ${
                    weatherInfo.safetyLevel === 'warning'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      : weatherInfo.safetyLevel === 'caution'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}
                >
                  {weatherInfo.badgeText}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-emerald-600" />
                <span>الإرشادات الفنية وضوابط السلامة (HSE):</span>
              </span>
              <p className="text-slate-600 dark:text-slate-300 bg-slate-50/80 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/60 leading-relaxed">
                {weatherInfo.siteImpact}
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsWeatherInfoOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-700"
              >
                فهمت ذلك
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Accessible Photo Lightbox Carousel Modal ──────────────────────────── */}
      {lightboxIndex !== null && photosList[lightboxIndex] && (
        <div
          className="fixed inset-0 z-60 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6 animate-in fade-in"
          role="dialog"
          aria-modal="true"
          aria-label="معاينة الصورة بالحجم الكامل"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Lightbox Top Header */}
          <div
            className="w-full max-w-5xl flex items-center justify-between gap-3 text-white text-xs py-2 shrink-0 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold px-3 py-1 rounded-full bg-white dark:bg-slate-900/10 border border-white/20">
                صورة {lightboxIndex + 1} من {photosList.length}
              </span>
              <span className="font-medium text-slate-300 truncate max-w-xs sm:max-w-md">
                {photosList[lightboxIndex].caption || 'صورة توثيق تقدم الأعمال بالموقع'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={resolveDrawerPhotoUrl(photosList[lightboxIndex]) || undefined}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-white dark:bg-slate-900/10 hover:bg-white/20 dark:bg-slate-950/30 text-white transition-colors"
                title="فتح الصورة الأصلية في نافذة جديدة"
                aria-label="فتح الصورة الأصلية"
              >
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                className="p-2 rounded-xl bg-white dark:bg-slate-900/10 hover:bg-white/20 dark:bg-slate-950/30 text-white transition-colors"
                aria-label="إغلاق معاينة الصورة"
                title="إغلاق (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Lightbox Main Stage with Carousel Nav Controls */}
          <div
            className="relative w-full max-w-5xl flex-1 flex items-center justify-center my-2 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Previous Photo Button (RTL / LTR Aware) */}
            {photosList.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setLightboxIndex(
                    (prev) => (prev! - 1 + photosList.length) % photosList.length
                  )
                }
                className="absolute start-2 sm:start-4 z-20 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 shadow-xl transition-all active:scale-95"
                aria-label="الصورة السابقة"
                title="السابق (سهم يمين)"
              >
                <ChevronRight className="w-6 h-6 rtl:inline ltr:hidden" />
                <ChevronLeft className="w-6 h-6 ltr:inline rtl:hidden" />
              </button>
            )}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolveDrawerPhotoUrl(photosList[lightboxIndex]) || undefined}
              alt={photosList[lightboxIndex].caption || 'معاينة بالحجم الكامل'}
              className="max-h-[75vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl border border-white/10 select-none animate-in zoom-in-95 duration-200"
            />

            {/* Next Photo Button (RTL / LTR Aware) */}
            {photosList.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setLightboxIndex((prev) => (prev! + 1) % photosList.length)
                }
                className="absolute end-2 sm:end-4 z-20 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 shadow-xl transition-all active:scale-95"
                aria-label="الصورة التالية"
                title="التالي (سهم يسار)"
              >
                <ChevronLeft className="w-6 h-6 rtl:inline ltr:hidden" />
                <ChevronRight className="w-6 h-6 ltr:inline rtl:hidden" />
              </button>
            )}
          </div>

          {/* Lightbox Bottom Thumbnail Filmstrip */}
          {photosList.length > 1 && (
            <div
              className="w-full max-w-3xl flex items-center justify-center gap-2 overflow-x-auto py-2 shrink-0 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {photosList.map((photo, pIdx) => {
                const isSelected = pIdx === lightboxIndex;
                const thumbUrl = resolveDrawerPhotoUrl(photo);
                return (
                  <button
                    key={photo.id || pIdx}
                    type="button"
                    onClick={() => setLightboxIndex(pIdx)}
                    className={`relative w-16 h-12 rounded-xl overflow-hidden border transition-all ${
                      isSelected
                        ? 'border-emerald-400 ring-2 ring-emerald-400 ring-offset-2 ring-offset-black scale-105 opacity-100'
                        : 'border-white/20 opacity-50 hover:opacity-100'
                    }`}
                    aria-label={`انتقال للصورة ${pIdx + 1}`}
                    aria-current={isSelected ? 'true' : 'false'}
                  >
                    {thumbUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumbUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-800" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Reason Modal (For Reject or Reopen) ───────────────────────────────── */}
      <ReasonModal
        isOpen={reasonModalOpen}
        onClose={() => {
          setReasonModalOpen(false);
          setReasonModalAction(null);
        }}
        onConfirm={handleReasonConfirm}
        title={
          reasonModalAction === 'reject'
            ? 'رفض التقرير اليومي وإعادته للموقع'
            : 'إعادة فتح التقرير المعتمد'
        }
        subtitle={
          reasonModalAction === 'reject'
            ? `يرجى كتابة أسباب رفض التقرير رقم #${report?.report_no || report?.id?.slice(0, 6)} بوضوح.`
            : `سيتم تحويل حالة التقرير رقم #${report?.report_no || report?.id?.slice(0, 6)} إلى (مُعاد فتحه) وتعليق توزيعات الكميات مؤقتاً.`
        }
        placeholder={
          reasonModalAction === 'reject'
            ? 'اكتب ملاحظات وأسباب رفض البنود أو عدم اكتمال البيانات...'
            : 'اكتب مبررات إعادة فتح التقرير بعد اعتماده...'
        }
        confirmLabel={
          reasonModalAction === 'reject' ? 'تأكيد الرفض' : 'تأكيد إعادة الفتح'
        }
        confirmVariant={reasonModalAction === 'reject' ? 'danger' : 'warning'}
        isLoading={isSubmitting}
      />

      {/* ── Detailed Review Modal ────────────────────────────────────────────── */}
      {reviewModalOpen && report && (
        <DailyProgressReviewModal
          isOpen={reviewModalOpen}
          onClose={() => {
            setReviewModalOpen(false);
            fetchReport();
            onActionSuccess();
          }}
          report={report}
          projectId={report.project_id}
        />
      )}
    </>
  );
};
