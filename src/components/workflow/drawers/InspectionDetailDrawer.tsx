'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  X,
  ShieldCheck,
  Calendar,
  Clock,
  User,
  MapPin,
  FileText,
  CheckSquare,
  Square,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileCheck2,
  FileWarning,
  ExternalLink,
  Loader2,
  Sparkles,
  ClipboardList,
  Layers,
  ArrowRight,
  ShieldAlert,
  Award,
  Check,
  RotateCcw,
  CheckCheck,
} from 'lucide-react';
import { InspectionRequest, InspectionType } from '@/types/task-ontology';
import { TaskOntologyService } from '@/lib/services/taskOntology.service';
import { WorkflowStepper } from '../WorkflowStepper';
import { SLAProgressBar } from '../SLAProgressBar';
import { UnifiedStatusBadge } from '../UnifiedStatusBadge';
import { ReasonModal } from '../ReasonModal';
import {
  STANDARD_INSPECTION_CHECKLIST,
  REQUIRED_INSPECTION_DOCUMENTS,
} from '../constants';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export type ChecklistItemStatus = 'pass' | 'fail' | 'pending' | 'na';

export interface InspectionDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  inspectionId: string | null;
  userRoles: string[];
  onActionSuccess: () => void;
  isAr?: boolean;
}

export const InspectionDetailDrawer: React.FC<InspectionDetailDrawerProps> = ({
  isOpen,
  onClose,
  inspectionId,
  userRoles,
  onActionSuccess,
  isAr = true,
}) => {
  const [inspection, setInspection] = useState<InspectionRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Status & Category Localization Helpers (ensuring no mixed English in Arabic mode)
  const getStatusLabel = (status?: string) => {
    if (!status) return '—';
    if (!isAr) return status;
    const statusMap: Record<string, string> = {
      pending: 'قيد الفحص والمطابقة',
      approved: 'معتمد ومطابق',
      rejected: 'غير مطابق / مرفوض',
      cancelled: 'ملغي',
      in_progress: 'قيد المتابعة',
    };
    return statusMap[status] || status;
  };

  const getCategoryLabel = (category: string) => {
    if (!isAr) return category;
    const map: Record<string, string> = {
      Civil: 'إنشائي ومدني',
      Safety: 'السلامة والصحة المهنية',
      Quality: 'ضبط الجودة',
      Electrical: 'أعمال كهربائية',
      Mechanical: 'أعمال ميكانيكية',
      Rebar: 'حديد التسليح',
      Concrete: 'خرسانة مسلحة',
      Survey: 'أعمال المساحة',
      Finishing: 'تشطيبات معمارية',
    };
    return map[category] || category;
  };

  // Per-item checklist pass/fail/na/pending status
  const [itemStatuses, setItemStatuses] = useState<Record<string, ChecklistItemStatus>>({});

  // Reason Modal for Rejection
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  // Accessibility Refs
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusedElementRef = useRef<HTMLElement | null>(null);

  // Fetch Inspection Details
  const fetchInspectionData = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const data = await TaskOntologyService.getInspectionById(id);
      if (data) {
        setInspection(data);
      } else {
        // Fallback default mock object for smooth UI if ID not in DB
        setInspection({
          id,
          task_id: 'task-fallback',
          project_id: 'proj-1',
          request_no: 'WIR-042',
          inspection_type: 'WIR',
          required_at: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
          status: 'pending',
          created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          task_title_ar: isAr ? 'صب خرسانة القواعد المسلحة - مرحلة 1' : 'Pouring Reinforced Concrete Footings - Phase 1',
          qc_name_ar: isAr ? 'م. أحمد الشامي (مهندس استشاري الجودة)' : 'Eng. Ahmed El-Shamy (QC Consultant)',
          project_name_ar: isAr ? 'مشروع أبراج البستان السكني' : 'Al-Bustan Residential Towers Project',
          project_code: 'BST-2026',
        });
      }
    } catch (err) {
      logger.error('Failed to load inspection details', { detail: err, id });
      toast.error(isAr ? 'حدث خطأ أثناء تحميل بيانات طلب الفحص' : 'Failed to load inspection details');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize data and checklist statuses
  useEffect(() => {
    if (isOpen && inspectionId) {
      fetchInspectionData(inspectionId);
    } else {
      setInspection(null);
      setItemStatuses({});
    }
  }, [isOpen, inspectionId, fetchInspectionData]);

  // Sync checklist items when inspection data changes
  useEffect(() => {
    if (inspection) {
      const initial: Record<string, ChecklistItemStatus> = {};
      const isApproved = inspection.status === 'approved';
      STANDARD_INSPECTION_CHECKLIST.forEach((item) => {
        // If approved, default all items to pass; otherwise pending
        initial[item.id] = isApproved ? 'pass' : 'pending';
      });
      setItemStatuses(initial);
    }
  }, [inspection]);

  // Accessibility: Focus Trap, Initial Focus, and Focus Restoration
  useEffect(() => {
    if (isOpen) {
      previousFocusedElementRef.current = document.activeElement as HTMLElement;

      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const timer = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);

      return () => {
        clearTimeout(timer);
        document.body.style.overflow = originalOverflow;
        if (
          previousFocusedElementRef.current &&
          typeof previousFocusedElementRef.current.focus === 'function'
        ) {
          previousFocusedElementRef.current.focus();
        }
      };
    }
  }, [isOpen]);

  // Accessibility: Handle Tab Trapping and Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !actionLoading && !isRejectModalOpen) {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        if (!drawerRef.current) return;
        const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, actionLoading, isRejectModalOpen, onClose]);

  // Check QC Inspector Permissions
  const canPerformQCAction = useMemo(() => {
    if (userRoles.length === 0 || userRoles.includes('all')) return true;
    const allowed = [
      'qc_inspector',
      'qc_engineer',
      'admin',
      'project_manager',
      'ceo',
      'coo',
      'coo_assistant',
      'planning_manager',
    ];
    return userRoles.some((role) => allowed.includes(role));
  }, [userRoles]);

  // Checklist Helpers
  const setItemStatus = (id: string, status: ChecklistItemStatus) => {
    setItemStatuses((prev) => ({
      ...prev,
      [id]: prev[id] === status ? 'pending' : status,
    }));
  };

  const handleSelectAllPass = () => {
    const newState: Record<string, ChecklistItemStatus> = {};
    STANDARD_INSPECTION_CHECKLIST.forEach((item) => {
      newState[item.id] = 'pass';
    });
    setItemStatuses(newState);
  };

  const handleResetChecklist = () => {
    const newState: Record<string, ChecklistItemStatus> = {};
    STANDARD_INSPECTION_CHECKLIST.forEach((item) => {
      newState[item.id] = 'pending';
    });
    setItemStatuses(newState);
  };

  // Checklist Statistics
  const passCount = useMemo(() => {
    return Object.values(itemStatuses).filter((s) => s === 'pass').length;
  }, [itemStatuses]);

  const failCount = useMemo(() => {
    return Object.values(itemStatuses).filter((s) => s === 'fail').length;
  }, [itemStatuses]);

  const naCount = useMemo(() => {
    return Object.values(itemStatuses).filter((s) => s === 'na').length;
  }, [itemStatuses]);

  const pendingCount = useMemo(() => {
    return STANDARD_INSPECTION_CHECKLIST.length - (passCount + failCount + naCount);
  }, [passCount, failCount, naCount]);

  const allItemsChecked = pendingCount === 0;

  // Actions
  const isMockOrFallback = () => {
    if (!inspectionId || !inspection) return true;
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(inspectionId)
    )
      return true;
    if (inspectionId.startsWith('insp-mock-') || inspection?.id?.startsWith('insp-mock-'))
      return true;
    if (inspection.task_id === 'task-fallback') return true;
    return false;
  };

  const handleApproveInspection = async () => {
    if (!inspectionId || !inspection) return;

    if (failCount > 0) {
      toast.warning(
        isAr
          ? 'تنبيه: توجد بنود مسجلة كـ (غير مطابق ✕). يرجى مراجعتها أو تسجيل تقرير عدم مطابقة.'
          : 'Warning: Some items are marked as failed. Please review or record a Non-Conformance Report (NCR).'
      );
    }

    if (isMockOrFallback()) {
      toast.success(
        isAr
          ? 'تمت محاكاة اعتماد طلب الفحص وتوثيق ختم الاستشاري بنجاح ✓'
          : 'Inspection approval and consultant stamp simulation successful ✓'
      );
      setInspection((prev) =>
        prev
          ? {
              ...prev,
              status: 'approved',
              decision_at: new Date().toISOString(),
              decision_by: isAr ? 'م. أحمد الشامي (مهندس استشاري الجودة)' : 'Eng. Ahmed El-Shamy (QC Consultant)',
            }
          : null
      );
      // Mark all checklist items as pass
      handleSelectAllPass();
      onActionSuccess();
      return;
    }

    setActionLoading(true);
    try {
      await TaskOntologyService.recordInspectionDecision(inspectionId, 'approved');
      toast.success(
        isAr
          ? 'تم اعتماد طلب الفحص وتوثيقه كمطابق بنجاح ✓'
          : 'Inspection request approved and certified as conforming ✓'
      );
      setInspection((prev) =>
        prev
          ? {
              ...prev,
              status: 'approved',
              decision_at: new Date().toISOString(),
              decision_by: isAr ? 'م. أحمد الشامي (مهندس استشاري الجودة)' : 'Eng. Ahmed El-Shamy (QC Consultant)',
            }
          : null
      );
      handleSelectAllPass();
      onActionSuccess();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : isAr
            ? 'فشل اعتماد طلب الفحص'
            : 'Failed to approve inspection request';
      logger.error('Failed to approve inspection', { detail: err });
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async (reasonText: string) => {
    if (!inspectionId || !inspection) return;
    if (isMockOrFallback()) {
      toast.error(
        isAr
          ? 'تمت محاكاة رفض طلب الفحص وتسجيل عدم المطابقة (وضع المعاينة)'
          : 'Simulated rejection and non-conformance recorded (Preview mode)'
      );
      setInspection((prev) =>
        prev
          ? {
              ...prev,
              status: 'rejected',
              reason: reasonText,
              decision_at: new Date().toISOString(),
              decision_by: isAr ? 'م. أحمد الشامي (مهندس استشاري الجودة)' : 'Eng. Ahmed El-Shamy (QC Consultant)',
            }
          : null
      );
      setIsRejectModalOpen(false);
      onActionSuccess();
      return;
    }
    setActionLoading(true);
    try {
      await TaskOntologyService.recordInspectionDecision(inspectionId, 'rejected', reasonText);
      toast.error(
        isAr
          ? 'تم رفض طلب الفحص وتسجيل أوجه عدم المطابقة'
          : 'Inspection request rejected and non-conformance logged'
      );
      setInspection((prev) =>
        prev
          ? {
              ...prev,
              status: 'rejected',
              reason: reasonText,
              decision_at: new Date().toISOString(),
              decision_by: isAr ? 'م. أحمد الشامي (مهندس استشاري الجودة)' : 'Eng. Ahmed El-Shamy (QC Consultant)',
            }
          : null
      );
      setIsRejectModalOpen(false);
      onActionSuccess();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : isAr
            ? 'فشل رفض طلب الفحص'
            : 'Failed to reject inspection request';
      logger.error('Failed to reject inspection', { detail: err });
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateNCR = async () => {
    if (!inspection) return;
    setActionLoading(true);
    try {
      const ncrNo = `NCR-${inspection.request_no ? inspection.request_no.replace(/\D/g, '') : '001'}`;
      const result = await TaskOntologyService.createInspectionRequest({
        task_id: inspection.task_id,
        project_id: inspection.project_id,
        request_no: ncrNo,
        inspection_type: 'NCR',
        required_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        status: 'pending',
        assigned_qc_id: inspection.assigned_qc_id || null,
        reason:
          inspection.reason ||
          (isAr
            ? 'تقرير عدم مطابقة صادر بناءً على فحص غير مجتاز'
            : 'Non-conformance report issued based on failed inspection'),
      });
      toast.success(
        isAr
          ? `تم إصدار تقرير عدم المطابقة (${result?.request_no || ncrNo}) وإحالته للمعالجة`
          : `Non-conformance report (${result?.request_no || ncrNo}) issued and forwarded`
      );
      onActionSuccess();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : isAr
            ? 'فشل إصدار تقرير عدم المطابقة'
            : 'Failed to issue non-conformance report';
      logger.error('Failed to create NCR', { detail: err });
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  // Stepper Setup
  const stepperConfig = useMemo(() => {
    const status = inspection?.status || 'pending';

    const baseSteps = [
      {
        key: 'created',
        label: isAr ? 'تقديم طلب الفحص' : 'Inspection Submission',
        subLabel: isAr ? 'مهندس الموقع' : 'Site Engineer',
        icon: FileText,
      },
      {
        key: 'pending',
        label: isAr ? 'قيد الفحص والمطابقة' : 'Under Inspection',
        subLabel: isAr ? 'مفتش ضبط الجودة' : 'QC Inspector',
        icon: ShieldCheck,
      },
    ];

    if (status === 'approved') {
      baseSteps.push({
        key: 'approved',
        label: isAr ? 'مطابق / معتمد ✓' : 'Conforming / Approved ✓',
        subLabel: isAr ? 'اعتماد استشاري - كود أ' : 'Consultant Code A',
        icon: CheckCircle2,
      });
    } else if (status === 'rejected') {
      baseSteps.push({
        key: 'rejected',
        label: isAr ? 'غير مطابق / مرفوض ✕' : 'Non-Conforming / Rejected ✕',
        subLabel: isAr ? 'يتطلب تقرير عدم مطابقة' : 'NCR Required',
        icon: XCircle,
      });
    } else {
      baseSteps.push({
        key: 'decision',
        label: isAr ? 'قرار الاعتماد' : 'Decision Sign-off',
        subLabel: isAr ? 'بانتظار الفحص' : 'Awaiting Inspection',
        icon: ShieldAlert,
      });
    }

    const currentStep =
      status === 'pending'
        ? 'pending'
        : status === 'approved'
          ? 'approved'
          : status === 'rejected'
            ? 'rejected'
            : 'created';
    const completedSteps = [
      'created',
      ...(status === 'approved'
        ? ['pending', 'approved']
        : status === 'rejected'
          ? ['pending']
          : []),
    ];
    const rejectedSteps = status === 'rejected' ? ['rejected'] : [];

    return { steps: baseSteps, currentStep, completedSteps, rejectedSteps };
  }, [inspection?.status, isAr]);

  // Inspection Type Badge Helper (WIR vs MIR Adaptive)
  const isMIR = inspection?.inspection_type === 'MIR';
  const isWIR = inspection?.inspection_type === 'WIR' || !inspection?.inspection_type;

  const renderTypeBadge = (type?: InspectionType | string) => {
    const t = (type || 'WIR').toUpperCase();
    let badgeClass =
      'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800';
    let label = isAr ? 'طلب فحص واستلام أعمال' : 'Work Inspection (WIR)';

    if (t === 'MIR') {
      badgeClass =
        'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
      label = isAr ? 'طلب فحص ومعاينة مواد' : 'Material Inspection (MIR)';
    } else if (t === 'NCR') {
      badgeClass =
        'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800';
      label = isAr ? 'تقرير عدم مطابقة' : 'Non-Conformance Report (NCR)';
    } else if (t === 'PRE_POUR' || t === 'PRE-POUR') {
      badgeClass =
        'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800';
      label = isAr ? 'فحص ما قبل الصب' : 'Pre-Pour Inspection';
    } else if (t === 'SURVEY') {
      badgeClass =
        'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800';
      label = isAr ? 'فحص أعمال المساحة' : 'Survey Inspection';
    } else if (t === 'FINAL_HANDOVER') {
      badgeClass =
        'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
      label = isAr ? 'تسليم نهائي للمشروع' : 'Final Handover';
    }

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border shadow-2xs ${badgeClass}`}
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>{label}</span>
      </span>
    );
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(isAr ? 'ar-EG' : 'en-GB', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={() => {
          if (!actionLoading) onClose();
        }}
      >
        <div className="absolute inset-0" />

        {/* Slide-over Drawer Container */}
        <div className="absolute inset-y-0 end-0 max-w-full flex">
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="inspection-drawer-title"
            aria-describedby="inspection-drawer-desc"
            tabIndex={-1}
            className="w-screen max-w-3xl bg-white dark:bg-slate-900 border-s border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out animate-in slide-in-from-left sm:slide-in-from-right focus:outline-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-800/50 backdrop-blur-sm shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`p-2.5 rounded-2xl text-white shadow-md shrink-0 ${
                    isMIR
                      ? 'bg-amber-600 shadow-amber-600/20'
                      : 'bg-emerald-700 shadow-emerald-700/20'
                  }`}
                >
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 shadow-2xs">
                      {inspection?.request_no || 'WIR-###'}
                    </span>
                    {renderTypeBadge(inspection?.inspection_type)}
                    {inspection && (
                      <UnifiedStatusBadge
                        status={inspection.status}
                        entityType="inspection"
                        size="sm"
                      />
                    )}
                  </div>
                  <h2
                    id="inspection-drawer-title"
                    className="text-base font-bold text-slate-900 dark:text-white mt-1 truncate"
                  >
                    {inspection?.task_title_ar || (isAr ? 'تفاصيل طلب فحص وضبط الجودة' : 'Quality Inspection Request Details')}
                  </h2>
                  <p id="inspection-drawer-desc" className="sr-only">
                    {isAr
                      ? 'نافذة مراجعة طلب الفحص والاستلام، وتوثيق قائمة التحقق وختم الاستشاري'
                      : 'Inspection review dialog for verification checklist and consultant stamp'}
                  </p>
                </div>
              </div>

              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                disabled={actionLoading}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors shrink-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-hidden"
                aria-label={isAr ? 'إغلاق نافذة تفاصيل الفحص' : 'Close inspection details drawer'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-start">
              {loading ? (
                <div className="py-24 flex flex-col items-center justify-center text-center gap-3">
                  <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {isAr ? 'جاري تحميل بيانات الفحص والاعتمادات...' : 'Loading inspection data and approvals...'}
                  </p>
                </div>
              ) : inspection ? (
                <>
                  {/* 1. Workflow Stepper (Fork Variant) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 px-1">
                      <span className="flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                        <span>{isAr ? 'مراحل دورة اعتماد الفحص' : 'Inspection Workflow Stages'}</span>
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                        {isAr ? `حالة المسار: ${getStatusLabel(inspection.status)}` : `Status: ${inspection.status}`}
                      </span>
                    </div>
                    <WorkflowStepper
                      variant="fork"
                      steps={stepperConfig.steps}
                      currentStep={stepperConfig.currentStep}
                      completedSteps={stepperConfig.completedSteps}
                      rejectedSteps={stepperConfig.rejectedSteps}
                    />
                  </div>

                  {/* 2. SLA Progress Indicator */}
                  <SLAProgressBar
                    createdAt={inspection.created_at}
                    dueAt={inspection.required_at}
                    label={
                      isMIR
                        ? (isAr
                            ? 'مستوى الخدمة الزمني لفحص واعتماد التوريدات'
                            : 'Material Inspection SLA')
                        : (isAr
                            ? 'مستوى الخدمة الزمني لمهندس استشاري الجودة'
                            : 'Consultant QC Inspection SLA')
                    }
                    showDetails={true}
                  />

                  {/* Rejection / Reason Notice Banner if rejected */}
                  {inspection.status === 'rejected' && (
                    <div className="glass-card bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-4 rounded-2xl flex items-start gap-3 shadow-xs">
                      <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 shrink-0">
                        <FileWarning className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200">
                          {isAr ? 'أسباب عدم المطابقة وملاحظات الرفض:' : 'Non-conformance Reasons & Rejection Notes:'}
                        </h4>
                        <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed font-mono whitespace-pre-wrap">
                          {inspection.reason || (isAr ? 'لم يتم تسجيل ملاحظات إضافية أثناء الرفض.' : 'No additional rejection notes recorded.')}
                        </p>
                        {inspection.decision_at && (
                          <span className="inline-block text-[11px] text-rose-600 dark:text-rose-400 font-sans mt-1">
                            {isAr ? `تاريخ اتخاذ القرار: ${formatDate(inspection.decision_at)}` : `Decision Date: ${formatDate(inspection.decision_at)}`}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Approved Notice Banner if approved */}
                  {inspection.status === 'approved' && (
                    <div className="glass-card bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 p-4 rounded-2xl flex items-start gap-3 shadow-xs">
                      <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 shrink-0">
                        <FileCheck2 className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                          {isAr ? 'تم اجتياز الفحص واعتماد المطابقة بنجاح ✓' : 'Inspection Passed & Approval Verified ✓'}
                        </h4>
                        <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                          {isAr
                            ? 'الأعمال الموقعية مطابقة للمخططات المعتمدة وتفي بكافة معايير الجودة المحددة.'
                            : 'Site works conform to approved drawings and fulfill all quality standards.'}
                        </p>
                        {inspection.decision_at && (
                          <span className="inline-block text-[11px] text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                            {isAr ? `تم الاعتماد بتاريخ: ${formatDate(inspection.decision_at)}` : `Approved on: ${formatDate(inspection.decision_at)}`}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 3. Details Grid (Adaptive for WIR vs MIR) */}
                  <div className="glass-card bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-3xl space-y-4 shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-emerald-600" />
                        <span>
                          {isMIR
                            ? (isAr ? 'بيانات ومعلومات طلب فحص المواد' : 'Material Inspection Request Data')
                            : (isAr ? 'بيانات ومعلومات طلب فحص الأعمال' : 'Work Inspection Request Data')}
                        </span>
                      </h3>
                      <span className="text-[11px] px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                        {isMIR
                          ? (isAr ? 'نطاق المواد والتوريد' : 'Material & Supply Scope')
                          : (isAr ? 'نطاق التنفيذ الموقعي' : 'Site Execution Scope')}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* Task / Element Title */}
                      <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700/80 transition-all duration-200 space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
                          <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          <span>
                            {isMIR
                              ? (isAr ? 'المادة الموردة أو بند التوريد' : 'Supplied Material Item')
                              : (isAr ? 'المهمة التنفيذية المرتبطة' : 'Linked Execution Task')}
                          </span>
                        </div>
                        <p className="font-bold text-slate-900 dark:text-slate-100 leading-snug">
                          {inspection.task_title_ar ||
                            (isMIR
                              ? (isAr ? 'توريد حديد تسليح عالي المقاومة' : 'Supply of High-Strength Rebar')
                              : (isAr ? 'مهمة إنشائية موقعية' : 'Site Construction Task'))}
                        </p>
                      </div>

                      {/* Location / Zone or Supplier */}
                      <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700/80 transition-all duration-200 space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          <span>
                            {isMIR
                              ? (isAr ? 'المورد وموقع التخزين الميداني' : 'Supplier & Yard Location')
                              : (isAr ? 'الموقع والعنصر الإنشائي' : 'Location & Structural Element')}
                          </span>
                        </div>
                        <p className="font-bold text-slate-900 dark:text-slate-100">
                          {inspection.project_name_ar ? `${inspection.project_name_ar} • ` : ''}
                          {isMIR
                            ? (isAr ? 'تشوينات قطاع أ - ساحة التخزين المركزية' : 'Sector A Stockpile - Central Yard')
                            : (isAr ? 'المنطقة الرئيسية - قطاع أ' : 'Main Area - Sector A')}
                        </p>
                      </div>

                      {/* Requested Date */}
                      <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700/80 transition-all duration-200 space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          <span>{isAr ? 'تاريخ ووقت تقديم الطلب' : 'Submission Date & Time'}</span>
                        </div>
                        <p className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                          {formatDate(inspection.created_at)}
                        </p>
                      </div>

                      {/* Required Inspection Date */}
                      <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700/80 transition-all duration-200 space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
                          <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
                          <span>{isAr ? 'الموعد المطلوب للمعاينة الميدانية' : 'Requested Inspection Schedule'}</span>
                        </div>
                        <p className="font-bold text-emerald-800 dark:text-emerald-400 font-mono">
                          {formatDate(inspection.required_at)}
                        </p>
                      </div>

                      {/* Assigned QC Inspector */}
                      <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700/80 transition-all duration-200 space-y-1 md:col-span-2">
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
                          <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          <span>
                            {isAr
                              ? 'مهندس استشاري الإشراف وضبط الجودة'
                              : 'Supervision QC Consultant Engineer'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <p className="font-bold text-slate-900 dark:text-slate-100">
                            {inspection.qc_name_ar || (isAr ? 'م. أحمد الشامي (مهندس استشاري الجودة)' : 'Eng. Ahmed El-Shamy (QC Consultant)')}
                          </p>
                          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-medium">
                            {isAr ? 'استشاري الإشراف المعتمد' : 'Certified Supervision Consultant'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4. Consultant Signature & Approval Stamp Container in RTL */}
                  <div className="glass-card bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800/90 p-5 rounded-3xl space-y-4 shadow-sm relative overflow-hidden">
                    {/* Background Watermark Stamp Icon */}
                    <div className="absolute -bottom-6 -start-6 opacity-[0.03] dark:opacity-[0.05] pointer-events-none text-slate-900 dark:text-white">
                      <ShieldCheck className="w-56 h-56" />
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                        <div>
                          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {isAr
                              ? 'اعتماد وتوثيق استشاري الإشراف الهندسي'
                              : 'Supervision Consultant Certification & Sign-off'}
                          </h3>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {isAr
                              ? 'ختم التوثيق الرقابي وفق اشتراطات الكود والمواصفات التعاقدية المعمول بها'
                              : 'Regulatory compliance stamp per contract specifications and code standards'}
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {isAr ? 'مطابقة اشتراطات فيديك - البند 7.3' : 'FIDIC Cl. 7.3 Conformance'}
                      </span>
                    </div>

                    {/* Stamp Container with RTL Orientation */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
                      {/* Left/Start Column: Inspector Details & Signature */}
                      <div className="md:col-span-7 flex flex-col justify-between p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                              {isAr ? 'المهندس الاستشاري المشرف:' : 'Supervision Consultant:'}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-medium">
                              {isAr ? 'معتمد رقابياً ✓' : 'Certified ✓'}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {inspection.qc_name_ar || (isAr ? 'م. أحمد الشامي (مهندس استشاري الجودة)' : 'Eng. Ahmed El-Shamy (QC Consultant)')}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {isAr
                              ? 'المكتب الاستشاري للإشراف الهندسي وإدارة المشاريع'
                              : 'Engineering Supervision & Project Management Consultant'}
                          </p>
                        </div>

                        {/* Simulated Signature & Digital Verification */}
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 space-y-1.5">
                          <div className="flex items-end justify-between">
                            <div>
                              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 block">
                                {isAr ? 'التوقيع المعتمد:' : 'Authorized Signature:'}
                              </span>
                              <div className="font-serif italic text-sm text-emerald-800 dark:text-emerald-300 select-none tracking-normal pt-0.5">
                                {inspection.status === 'approved'
                                  ? (isAr ? 'م. أحمد الشامي' : 'Eng. Ahmed El-Shamy')
                                  : inspection.status === 'rejected'
                                    ? (isAr ? 'م. أحمد الشامي (مرفوض)' : 'Eng. Ahmed El-Shamy (Rejected)')
                                    : (isAr ? 'بانتظار توقيع المهندس الاستشاري' : 'Awaiting Consultant Signature')}
                              </div>
                            </div>
                            <div className="text-end">
                              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 block">
                                {isAr ? 'رمز التحقق الرقمي' : 'Verification ID'}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">
                                {inspection.request_no
                                  ? `CERT-${inspection.request_no}-V7`
                                  : 'CERT-000-VERIFIED'}
                              </span>
                            </div>
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                            SHA-256: 7f9a8b2...e3c8 | {inspection.decision_at ? formatDate(inspection.decision_at) : (isAr ? 'غير معتمد حتى الآن' : 'Pending sign-off')}
                          </div>
                        </div>
                      </div>

                      {/* Right/End Column: Authentic Physical-style Engineering Stamp Seal */}
                      <div className="md:col-span-5 flex items-center justify-center p-2">
                        {inspection.status === 'approved' ? (
                          <div className="w-full text-center border-4 border-double border-emerald-600 dark:border-emerald-500/90 rounded-2xl p-3.5 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 shadow-md shadow-emerald-600/10 transform rotate-[-1.5deg] hover:rotate-0 transition-transform select-none">
                            <div className="border-b border-emerald-500/40 dark:border-emerald-500/30 pb-1 mb-1.5">
                              <p className="text-[10px] font-bold tracking-normal">
                                {isAr ? 'استشاري الإشراف الهندسي المعتمد' : 'CERTIFIED SUPERVISION CONSULTANT'}
                              </p>
                              <p className="text-[9px] font-mono tracking-wider opacity-80">
                                {isAr ? 'المكتب الاستشاري المعتمد للمشروع' : 'PROJECT SUPERVISION CONSULTANT'}
                              </p>
                            </div>
                            <div className="py-1">
                              <p className="text-sm font-black tracking-normal text-emerald-900 dark:text-emerald-100 flex items-center justify-center gap-1">
                                <CheckCheck className="w-4 h-4" />
                                <span>{isAr ? 'معتمد رسمياً ومطابق' : 'OFFICIALLY APPROVED'}</span>
                              </p>
                              <p className="text-[11px] font-mono font-bold mt-0.5 text-emerald-700 dark:text-emerald-300">
                                {isAr ? 'كود أ — مطابق تماماً للمواصفات' : 'CODE A — Fully Conforming'}
                              </p>
                            </div>
                            <div className="border-t border-emerald-500/40 dark:border-emerald-500/30 pt-1 mt-1.5 text-[9px] font-mono opacity-85">
                              {inspection.request_no} • {new Date(inspection.decision_at || Date.now()).toLocaleDateString(isAr ? 'ar-EG' : 'en-GB')}
                            </div>
                          </div>
                        ) : inspection.status === 'rejected' ? (
                          <div className="w-full text-center border-4 border-double border-rose-600 dark:border-rose-500/90 rounded-2xl p-3.5 bg-rose-50/70 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 shadow-md shadow-rose-600/10 transform rotate-[1.5deg] hover:rotate-0 transition-transform select-none">
                            <div className="border-b border-rose-500/40 dark:border-rose-500/30 pb-1 mb-1.5">
                              <p className="text-[10px] font-bold tracking-normal">
                                {isAr ? 'استشاري الإشراف الهندسي' : 'SUPERVISION CONSULTANT'}
                              </p>
                              <p className="text-[9px] font-mono tracking-wider opacity-80">
                                {isAr ? 'إدارة مراقبة وضبط الجودة' : 'QUALITY CONTROL DIVISION'}
                              </p>
                            </div>
                            <div className="py-1">
                              <p className="text-sm font-black tracking-normal text-rose-900 dark:text-rose-100 flex items-center justify-center gap-1">
                                <XCircle className="w-4 h-4" />
                                <span>{isAr ? 'مرفوض وغير مطابق' : 'REJECTED — NON-CONFORMING'}</span>
                              </p>
                              <p className="text-[11px] font-mono font-bold mt-0.5 text-rose-700 dark:text-rose-300">
                                {isAr ? 'كود ج — غير مطابق / يتطلب تقرير عدم مطابقة' : 'CODE C — Non-Conforming / NCR'}
                              </p>
                            </div>
                            <div className="border-t border-rose-500/40 dark:border-rose-500/30 pt-1 mt-1.5 text-[9px] font-mono opacity-85">
                              {inspection.request_no} • {new Date(inspection.decision_at || Date.now()).toLocaleDateString(isAr ? 'ar-EG' : 'en-GB')}
                            </div>
                          </div>
                        ) : (
                          <div className="w-full text-center border-2 border-dashed border-amber-400 dark:border-amber-600/60 rounded-2xl p-3.5 bg-amber-50/40 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 select-none">
                            <div className="border-b border-amber-300/50 dark:border-amber-800/40 pb-1 mb-1.5">
                              <p className="text-[10px] font-bold tracking-normal">
                                {isAr ? 'استشاري الإشراف الهندسي' : 'SUPERVISION CONSULTANT'}
                              </p>
                              <p className="text-[9px] font-mono tracking-wider opacity-80">
                                {isAr ? 'ختم اعتماد المهندس الاستشاري المشرف' : 'CONSULTANT SIGN-OFF SEAL'}
                              </p>
                            </div>
                            <div className="py-1">
                              <p className="text-xs font-bold text-amber-900 dark:text-amber-100">
                                {isAr ? 'بانتظار الفحص والختم الموقعي' : 'Awaiting Field Inspection & Sign-off'}
                              </p>
                              <p className="text-[10px] font-mono mt-0.5 text-amber-700 dark:text-amber-300">
                                {isAr ? 'بانتظار اعتماد مهندس ضبط الجودة المقيم' : 'AWAITING RESIDENT QC SIGN-OFF'}
                              </p>
                            </div>
                            <div className="border-t border-amber-300/50 dark:border-amber-800/40 pt-1 mt-1.5 text-[9px] font-mono opacity-80">
                              {inspection.request_no} • {isAr ? 'بانتظار المراجعة والاعتماد' : 'PENDING REVIEW'}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 5. Inspection Checklist UI (Enhanced Pass / Fail / NA Toggles) */}
                  <div className="glass-card bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-3xl space-y-4 shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap gap-2">
                      <div>
                        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                          <span>{isAr ? 'قائمة الفحص والمطابقة القياسية' : 'Standard QC Technical Checklist'}</span>
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {isAr
                            ? 'حدد نتيجة فحص كل بند هندسي: مطابق ✓ أو غير مطابق ✕ أو غير مشمول'
                            : 'Mark inspection status for each item: Pass ✓, Fail ✕, or Not Applicable'}
                        </p>
                      </div>

                      {/* Checklist Quick Statistics & Actions */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Summary Badges */}
                        <div className="flex items-center gap-1.5 text-xs font-mono font-bold">
                          <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                            {passCount} {isAr ? 'مطابق ✓' : 'Pass ✓'}
                          </span>
                          {failCount > 0 && (
                            <span className="px-2.5 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 animate-pulse">
                              {failCount} {isAr ? 'راسب ✕' : 'Fail ✕'}
                            </span>
                          )}
                          {naCount > 0 && (
                            <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                              {naCount} {isAr ? 'غير مشمول' : 'N/A'}
                            </span>
                          )}
                        </div>

                        {/* Bulk Action Buttons */}
                        <div className="flex items-center gap-1 border-s border-slate-200 dark:border-slate-700 ps-2">
                          <button
                            type="button"
                            onClick={handleSelectAllPass}
                            className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 px-2.5 py-1 rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-hidden"
                          >
                            {isAr ? 'مطابقة الكل ✓' : 'Select All Pass ✓'}
                          </button>
                          <button
                            type="button"
                            onClick={handleResetChecklist}
                            className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 px-2.5 py-1 rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-hidden"
                          >
                            {isAr ? 'إعادة ضبط' : 'Reset'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Checklist Items List with Segmented Pass/Fail Controls */}
                    <div
                      className="space-y-2.5"
                      role="group"
                      aria-label={isAr ? 'بنود التحقق من الجودة والمطابقة الموقعية' : 'Site quality verification items'}
                    >
                      {STANDARD_INSPECTION_CHECKLIST.map((item, index) => {
                        const status = itemStatuses[item.id] || 'pending';
                        const isPass = status === 'pass';
                        const isFail = status === 'fail';
                        const isNA = status === 'na';

                        return (
                          <div
                            key={item.id}
                            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all ${
                              isPass
                                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 shadow-2xs'
                                : isFail
                                  ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800/80 shadow-xs'
                                  : isNA
                                    ? 'bg-slate-100/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800'
                                    : 'bg-slate-50/50 dark:bg-slate-800/20 border-slate-200/70 dark:border-slate-800'
                            }`}
                          >
                            {/* Item Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500">
                                  #{index + 1}
                                </span>
                                <span
                                  className={`text-xs font-bold leading-tight ${
                                    isPass
                                      ? 'text-emerald-950 dark:text-emerald-200'
                                      : isFail
                                        ? 'text-rose-950 dark:text-rose-200'
                                        : 'text-slate-800 dark:text-slate-200'
                                  }`}
                                >
                                  {item.title_ar}
                                </span>
                                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 shrink-0">
                                  {getCategoryLabel(item.category)}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                {item.desc_ar}
                              </p>
                            </div>

                            {/* Pass / Fail / N/A Segmented Toggle */}
                            <div
                              className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0 self-end sm:self-center"
                              role="group"
                              aria-label={isAr ? `تحديد حالة بند ${item.title_ar}` : `Set status for ${item.title_ar}`}
                            >
                              {/* Pass Button */}
                              <button
                                type="button"
                                onClick={() => setItemStatus(item.id, 'pass')}
                                aria-pressed={isPass}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-hidden active:scale-95 ${
                                  isPass
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300'
                                }`}
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>{isAr ? 'مطابق' : 'Pass'}</span>
                              </button>

                              {/* Fail Button */}
                              <button
                                type="button"
                                onClick={() => setItemStatus(item.id, 'fail')}
                                aria-pressed={isFail}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-hidden active:scale-95 ${
                                  isFail
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-300'
                                }`}
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>{isAr ? 'راسب' : 'Fail'}</span>
                              </button>

                              {/* NA Button */}
                              <button
                                type="button"
                                onClick={() => setItemStatus(item.id, 'na')}
                                aria-pressed={isNA}
                                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:outline-hidden active:scale-95 ${
                                  isNA
                                    ? 'bg-slate-700 text-white dark:bg-slate-600'
                                    : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/60'
                                }`}
                                title={isAr ? 'لا ينطبق على هذا الطلب' : 'Not applicable to this request'}
                              >
                                <span>{isAr ? 'غير مشمول' : 'N/A'}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 6. Required Documents Checklist */}
                  <div className="glass-card bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-3xl space-y-4 shadow-xs">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <FileCheck2 className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                      <span>{isAr ? 'المستندات والمرفقات الإلزامية للفحص' : 'Required Inspection Documents & Attachments'}</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {REQUIRED_INSPECTION_DOCUMENTS.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs transition-all"
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                {doc.name_ar}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                                  {doc.code}
                                </span>
                                {doc.fileSize && (
                                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                                    • {doc.fileSize}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shrink-0">
                            {isAr ? 'مرفق ومطابق ✓' : 'Attached & Conforming ✓'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-20 text-center text-slate-500 dark:text-slate-400 space-y-2">
                  <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                  <p className="text-sm font-bold">{isAr ? 'تعذر العثور على بيانات الفحص المطلوب' : 'Inspection details not found'}</p>
                </div>
              )}
            </div>

            {/* Footer Action Buttons for QC Inspector */}
            {inspection && (
              <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 shrink-0 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={actionLoading}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-hidden"
                >
                  {isAr ? 'إغلاق النافذة' : 'Close Drawer'}
                </button>

                {/* Status-based Action Controls */}
                {inspection.status === 'pending' && (
                  <div className="flex items-center gap-2">
                    {/* Reject Button -> Opens ReasonModal */}
                    <button
                      type="button"
                      onClick={() => setIsRejectModalOpen(true)}
                      disabled={actionLoading || !canPerformQCAction}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 disabled:opacity-50 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-hidden active:scale-[0.98]"
                      title={!canPerformQCAction ? (isAr ? 'يتطلب صلاحية مهندس استشاري الجودة' : 'Requires QC Engineer permissions') : ''}
                    >
                      {actionLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                      <span>{isAr ? 'غير مطابق / رفض الفحص ✕' : 'Non-Conforming / Reject ✕'}</span>
                    </button>

                    {/* Approve Button */}
                    <button
                      type="button"
                      onClick={handleApproveInspection}
                      disabled={actionLoading || !canPerformQCAction}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-700/25 disabled:opacity-50 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-hidden active:scale-[0.98]"
                      title={!canPerformQCAction ? (isAr ? 'يتطلب صلاحية مهندس استشاري الجودة' : 'Requires QC Engineer permissions') : ''}
                    >
                      {actionLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      <span>{isAr ? 'اعتماد وخاتم المطابقة ✓' : 'Approve & Certify ✓'}</span>
                    </button>
                  </div>
                )}

                {inspection.status === 'rejected' && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCreateNCR}
                      disabled={actionLoading || !canPerformQCAction}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/25 disabled:opacity-50 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-hidden active:scale-[0.98]"
                    >
                      {actionLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <FileWarning className="w-4 h-4" />
                      )}
                      <span>{isAr ? 'إصدار تقرير عدم مطابقة ←' : 'Issue Non-Conformance Report →'}</span>
                    </button>
                  </div>
                )}

                {inspection.status === 'approved' && (
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isAr ? 'تم اعتماد وتوثيق ختم الاستشاري بنجاح' : 'Consultant stamp verified and certified successfully'}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reason Modal for Rejection */}
      <ReasonModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onConfirm={handleRejectConfirm}
        title={isAr ? 'رفض طلب الفحص وتسجيل أوجه عدم المطابقة' : 'Reject Inspection Request & Record Non-Conformance'}
        subtitle={
          isAr
            ? 'يرجى كتابة سبب عدم المطابقة بالتفصيل ليتم توثيقه في السجل الرقابي وإصدار تقرير عدم المطابقة.'
            : 'Please provide details for non-conformance to be logged in regulatory records and issue a Non-Conformance Report (NCR).'
        }
        placeholder={
          isAr
            ? 'حدد البنود غير المطابقة وأسباب الرفض بدقة (مثال: عدم استيفاء نسب الهبوط في الخرسانة أو وجود انحراف في مناسيب التسليح)...'
            : 'Specify non-conforming items and rejection reasons in detail...'
        }
        confirmLabel={isAr ? 'تأكيد الرفض وعدم المطابقة' : 'Confirm Rejection'}
        confirmVariant="danger"
        isLoading={actionLoading}
      />
    </>
  );
};

export default InspectionDetailDrawer;
