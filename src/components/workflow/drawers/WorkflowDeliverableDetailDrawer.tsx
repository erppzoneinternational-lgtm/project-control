'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  X,
  Package,
  Clock,
  User,
  Layers,
  FileText,
  FileCode,
  Paperclip,
  Upload,
  Plus,
  History,
  ShieldAlert,
  Play,
  Check,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Send,
  AlertTriangle,
  ArrowUpRight,
  Unlock,
  Calendar,
  Eye,
  Loader2,
  Trash2,
  Download,
  AlertCircle,
  GitFork,
  ExternalLink,
} from 'lucide-react';
import {
  Deliverable,
  DeliverableItem,
  DeliverableAttachment,
  DeliverableEvent,
  ConsultantApprovalCode,
  DeliverableStatus,
} from '@/types/planning';
import { StakeholderFull } from '@/types';
import { DeliverablesService } from '@/lib/services/deliverables.service';
import { ProjectService } from '@/lib/services/project.service';
import { ConsultantReviewModal } from '@/components/planning/ConsultantReviewModal';
import { DeliverableBlockerModal } from '@/components/planning/DeliverableBlockerModal';
import { ReasonModal } from '@/components/workflow/ReasonModal';
import { UnifiedStatusBadge } from '@/components/workflow/UnifiedStatusBadge';
import { WorkflowStepper } from '@/components/workflow/WorkflowStepper';
import { SLAProgressBar } from '@/components/workflow/SLAProgressBar';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface WorkflowDeliverableDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  deliverableId: string | null;
  userRoles: string[];
  onActionSuccess: () => void;
}

export const WorkflowDeliverableDetailDrawer: React.FC<WorkflowDeliverableDetailDrawerProps> = ({
  isOpen,
  onClose,
  deliverableId,
  userRoles = [],
  onActionSuccess,
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  // Data states
  const [deliverable, setDeliverable] = useState<Deliverable | null>(null);
  const [events, setEvents] = useState<DeliverableEvent[]>([]);
  const [attachments, setAttachments] = useState<DeliverableAttachment[]>([]);
  const [stakeholders, setStakeholders] = useState<StakeholderFull[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Active drawer tab
  const [activeTab, setActiveTab] = useState<'items' | 'events' | 'attachments' | 'info'>('items');

  // Modals state
  const [isBlockerModalOpen, setIsBlockerModalOpen] = useState(false);
  const [isConsultantModalOpen, setIsConsultantModalOpen] = useState(false);
  const [selectedConsultantItem, setSelectedConsultantItem] = useState<DeliverableItem | null>(null);

  // Reject reason modal state (for TO Manager rejecting an item back to engineer)
  const [isRejectReasonModalOpen, setIsRejectReasonModalOpen] = useState(false);
  const [selectedRejectItemId, setSelectedRejectItemId] = useState<string | null>(null);
  const [rejectingLoading, setRejectingLoading] = useState(false);

  // Add new item inline modal/state
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [newItem, setNewItem] = useState<Partial<DeliverableItem>>({
    item_type: 'drawing',
    sheet_number: '',
    description: '',
    current_rev: 0,
    submission_revision: 1,
    consultant_status: 'pending',
    assigned_stakeholder_id: '',
  });
  const [savingItem, setSavingItem] = useState(false);

  // File upload state
  const [uploadingFile, setUploadingFile] = useState(false);

  // ── Accessibility & Focus Management Refs ─────────────────────────────────
  const drawerRef = useRef<HTMLElement | null>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  // Focus trap, Escape key handling, and background scroll locking
  useEffect(() => {
    if (!isOpen) return;

    // 1. Save currently active element to restore later
    previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null;

    // 2. Lock body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // 3. Move initial focus to close button
    const focusTimer = setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    // 4. Trap keyboard focus & handle Escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      // If an inner modal is open, let inner modal handle its own keys
      if (isBlockerModalOpen || isConsultantModalOpen || isRejectReasonModalOpen || isAddItemOpen) {
        return;
      }

      if (e.key === 'Escape') {
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

    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;

      // Restore previously focused element
      if (
        previouslyFocusedElementRef.current &&
        typeof previouslyFocusedElementRef.current.focus === 'function'
      ) {
        previouslyFocusedElementRef.current.focus();
      }
    };
  }, [
    isOpen,
    onClose,
    isBlockerModalOpen,
    isConsultantModalOpen,
    isRejectReasonModalOpen,
    isAddItemOpen,
  ]);

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

  // Fetch deliverable details, timeline events, and attachments
  const fetchDetails = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const [delivData, eventsData, attsData] = await Promise.all([
        DeliverablesService.getDeliverableById(id),
        DeliverablesService.getDeliverableEvents(id),
        DeliverablesService.getDeliverableAttachments(id),
      ]);

      setDeliverable(delivData);
      setEvents((eventsData as DeliverableEvent[]) || []);
      setAttachments((attsData as DeliverableAttachment[]) || []);

      if (delivData?.project_id) {
        const stks = await ProjectService.getStakeholdersDirectory();
        setStakeholders(stks || []);
      }
    } catch (err) {
      logger.error('Failed to load deliverable details', { detail: err });
      toast.error(isAr ? 'فشل تحميل تفاصيل التسليمة' : 'Failed to load deliverable details');
    } finally {
      setLoading(false);
    }
  }, [isAr]);

  useEffect(() => {
    if (isOpen && deliverableId) {
      fetchDetails(deliverableId);
      setActiveTab('items');
    } else {
      setDeliverable(null);
      setEvents([]);
      setAttachments([]);
    }
  }, [isOpen, deliverableId, fetchDetails]);

  // Age calculation
  const ageDays = useMemo(() => {
    if (!deliverable?.received_at) return 0;
    const received = new Date(deliverable.received_at).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((now - received) / (1000 * 60 * 60 * 24)));
  }, [deliverable?.received_at]);

  // Overall progress pct
  const overallProgressPct = useMemo(() => {
    const items = deliverable?.items || [];
    if (items.length === 0) return 0;
    const sum = items.reduce((acc, it) => acc + (it.progress_pct || 0), 0);
    return Math.round(sum / items.length);
  }, [deliverable?.items]);

  // Workflow steps definition
  const workflowSteps = useMemo(() => {
    return [
      {
        key: 'received',
        label: isAr ? 'استلام الحزمة' : 'Package Received',
        subLabel: isAr ? 'من المكتب الفني' : 'From Tech Office',
      },
      {
        key: 'in_progress',
        label: isAr ? 'قيد التنفيذ' : 'In Progress',
        subLabel: isAr ? 'إعداد المخططات' : 'Shop Drawing Prep',
      },
      {
        key: 'ready_to_return',
        label: isAr ? 'جاهزة للإعادة' : 'Ready to Return',
        subLabel: isAr ? 'اعتماد مدير المكتب' : 'TO Manager Approval',
      },
      {
        key: 'returned',
        label: isAr ? 'مُعادة ومسلمة' : 'Returned',
        subLabel: isAr ? 'تسليم للاستشاري' : 'Sent to Consultant',
      },
      {
        key: 'approved',
        label: isAr ? 'اعتماد الاستشاري' : 'Consultant Review',
        subLabel: isAr ? 'كود أ / ب' : 'Code A / B',
      },
    ];
  }, [isAr]);

  // Stepper current step & completion mapping
  const stepperState = useMemo(() => {
    const status = deliverable?.status || 'received';
    const isBlocked = status === 'blocked';

    // Map status to step index
    const order = ['received', 'in_progress', 'ready_to_return', 'returned', 'approved'];
    let currentStepKey = status;
    if (isBlocked) {
      currentStepKey = 'in_progress';
    }

    const currentIndex = order.indexOf(currentStepKey);
    const completedSteps = order.slice(0, Math.max(0, currentIndex));
    const rejectedSteps = isBlocked ? ['in_progress'] : [];

    return {
      currentStep: currentStepKey,
      completedSteps,
      rejectedSteps,
      isBlocked,
    };
  }, [deliverable?.status]);

  // ── Helpers for Timeline and Attachments ───────────────────────────────────

  // Resolve status label from key
  const getStatusLabel = useCallback((statusKey?: string) => {
    if (!statusKey) return '—';
    const match = workflowSteps.find((s) => s.key === statusKey);
    if (match) return match.label;
    if (statusKey === 'blocked') return isAr ? 'معطلة / محجوبة' : 'Blocked';
    if (statusKey === 'in_progress') return isAr ? 'قيد التنفيذ' : 'In Progress';
    if (statusKey === 'ready_to_return') return isAr ? 'جاهزة للإعادة' : 'Ready to Return';
    if (statusKey === 'returned') return isAr ? 'مُعادة ومسلمة' : 'Returned';
    if (statusKey === 'approved') return isAr ? 'معتمدة' : 'Approved';
    return statusKey;
  }, [workflowSteps, isAr]);

  // Attachment metadata and icon helper
  const getAttachmentMeta = useCallback((att: DeliverableAttachment) => {
    const path = (att as any).file_path || att.storage_path || '';
    const name = att.file_name || path.split('/').pop() || (isAr ? 'مستند مرفق' : 'Attached File');
    const ext = name.split('.').pop()?.toLowerCase() || '';
    const url = DeliverablesService.getAttachmentUrl(path);

    let typeLabel = ext.toUpperCase() || 'FILE';
    let badgeColor = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    let IconComponent = Paperclip;

    if (['pdf'].includes(ext)) {
      typeLabel = 'PDF';
      badgeColor = 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-900';
      IconComponent = FileText;
    } else if (['dwg', 'dxf', 'cad'].includes(ext)) {
      typeLabel = 'CAD';
      badgeColor = 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900';
      IconComponent = FileCode;
    } else if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) {
      typeLabel = 'IMG';
      badgeColor = 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-900';
      IconComponent = Eye;
    } else if (['xlsx', 'xls', 'csv'].includes(ext)) {
      typeLabel = 'SHEET';
      badgeColor = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900';
      IconComponent = Layers;
    }

    return { path, name, ext, url, typeLabel, badgeColor, IconComponent };
  }, [isAr]);

  // Audit trail event display configuration
  const getEventDisplayConfig = useCallback((evt: DeliverableEvent) => {
    switch (evt.event_type) {
      case 'block':
        return {
          label: isAr ? 'حجب وتعطيل التسليمة' : 'Package Blocked / On Hold',
          Icon: ShieldAlert,
          iconBg: 'bg-rose-50 dark:bg-rose-950/50',
          iconBorder: 'border-rose-200 dark:border-rose-800',
          iconColor: 'text-rose-600 dark:text-rose-400',
          badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
        };
      case 'unblock':
        return {
          label: isAr ? 'فك الحجب واستئناف العمل' : 'Hold Released & Resumed',
          Icon: Unlock,
          iconBg: 'bg-emerald-50 dark:bg-emerald-950/50',
          iconBorder: 'border-emerald-200 dark:border-emerald-800',
          iconColor: 'text-emerald-600 dark:text-emerald-400',
          badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
        };
      case 'status_change':
        return {
          label: isAr ? 'تحديث مسار العمل' : 'Status Progression',
          Icon: GitFork,
          iconBg: 'bg-sky-50 dark:bg-sky-950/50',
          iconBorder: 'border-sky-200 dark:border-sky-800',
          iconColor: 'text-sky-600 dark:text-sky-400',
          badgeClass: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300',
        };
      case 'holder_change':
        return {
          label: isAr ? 'إحالة وتسليم المسؤولية' : 'Responsibility Handover',
          Icon: User,
          iconBg: 'bg-amber-50 dark:bg-amber-950/50',
          iconBorder: 'border-amber-200 dark:border-amber-800',
          iconColor: 'text-amber-600 dark:text-amber-400',
          badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
        };
      default:
        return {
          label: isAr ? 'سجل حركة' : 'Activity Log',
          Icon: Clock,
          iconBg: 'bg-slate-100 dark:bg-slate-800',
          iconBorder: 'border-slate-200 dark:border-slate-700',
          iconColor: 'text-slate-600 dark:text-slate-300',
          badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        };
    }
  }, [isAr]);

  // ── Action Handlers ─────────────────────────────────────────────────────────

  // 1. Start work on item (pending -> in_progress)
  const handleStartWork = async (itemId: string) => {
    if (!deliverable) return;
    setActionLoadingId(itemId);
    try {
      const stakeholderId = deliverable.current_holder_stakeholder_id || '';
      const updated = await DeliverablesService.startWorkOnItem(itemId, stakeholderId);
      if (updated) {
        toast.success(isAr ? 'تم بدء العمل على البند بنجاح' : 'Work started on item');
        onActionSuccess();
        if (deliverableId) fetchDetails(deliverableId);
      } else {
        toast.error(isAr ? 'فشل بدء العمل على البند' : 'Failed to start work on item');
      }
    } catch (err) {
      logger.error('handleStartWork error', { detail: err });
      toast.error(isAr ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 2. Submit to manager (in_progress -> ready_to_return)
  const handleSubmitToManager = async (itemId: string) => {
    setActionLoadingId(itemId);
    try {
      const updated = await DeliverablesService.completeWorkOnItem(itemId);
      if (updated) {
        toast.success(
          isAr
            ? 'تم إرسال البند لمدير المكتب الفني للاعتماد'
            : 'Item submitted to TO Manager for review'
        );
        onActionSuccess();
        if (deliverableId) fetchDetails(deliverableId);
      } else {
        toast.error(isAr ? 'فشل تقديم البند للمدير' : 'Failed to submit item to manager');
      }
    } catch (err) {
      logger.error('handleSubmitToManager error', { detail: err });
      toast.error(isAr ? 'حدث خطأ أثناء التقديم' : 'Error submitting to manager');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 3. TO Manager Approve Item (ready_to_return -> returned)
  const handleManagerApprove = async (itemId: string) => {
    setActionLoadingId(itemId);
    try {
      const updated = await DeliverablesService.managerApproveItem(itemId);
      if (updated) {
        toast.success(
          isAr
            ? 'تم اعتماد البند من مدير المكتب الفني وجاهز للإعادة'
            : 'Manager approved item successfully'
        );
        onActionSuccess();
        if (deliverableId) fetchDetails(deliverableId);
      } else {
        toast.error(isAr ? 'فشل اعتماد البند' : 'Failed to approve item');
      }
    } catch (err) {
      logger.error('handleManagerApprove error', { detail: err });
      toast.error(isAr ? 'حدث خطأ أثناء الاعتماد' : 'Error approving item');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 4. Open Reject Reason Modal
  const handleOpenRejectModal = (itemId: string) => {
    setSelectedRejectItemId(itemId);
    setIsRejectReasonModalOpen(true);
  };

  // 4b. Confirm Manager Reject Item (ready_to_return -> in_progress with reason)
  const handleRejectConfirm = async (reason: string) => {
    if (!selectedRejectItemId) return;
    setRejectingLoading(true);
    try {
      const updated = await DeliverablesService.managerRejectItem(selectedRejectItemId, reason);
      if (updated) {
        toast.success(
          isAr
            ? 'تمت إعادة البند للمهندس مع تسجيل الملاحظات'
            : 'Item returned to engineer with feedback'
        );
        setIsRejectReasonModalOpen(false);
        setSelectedRejectItemId(null);
        onActionSuccess();
        if (deliverableId) fetchDetails(deliverableId);
      } else {
        toast.error(isAr ? 'فشل إعادة البند' : 'Failed to reject item');
      }
    } catch (err) {
      logger.error('handleRejectConfirm error', { detail: err });
      toast.error(isAr ? 'حدث خطأ أثناء الإعادة' : 'Error rejecting item');
    } finally {
      setRejectingLoading(false);
    }
  };

  // 5. Open Consultant Review Modal
  const handleOpenConsultantReview = (item: DeliverableItem) => {
    setSelectedConsultantItem(item);
    setIsConsultantModalOpen(true);
  };

  const handleConsultantSuccess = (updatedItem: DeliverableItem) => {
    toast.success(
      isAr
        ? `تم تسجيل قرار الاستشاري بنجاح (${updatedItem.consultant_status})`
        : `Consultant code (${updatedItem.consultant_status}) recorded`
    );
    setIsConsultantModalOpen(false);
    setSelectedConsultantItem(null);
    onActionSuccess();
    if (deliverableId) fetchDetails(deliverableId);
  };

  // 6. Unblock Item
  const handleUnblockItem = async (itemId: string) => {
    setActionLoadingId(itemId);
    try {
      const updated = await DeliverablesService.unblockItem(itemId);
      if (updated) {
        toast.success(isAr ? 'تم فك حجب البند بنجاح' : 'Item unblocked successfully');
        onActionSuccess();
        if (deliverableId) fetchDetails(deliverableId);
      } else {
        toast.error(isAr ? 'فشل فك الحجب' : 'Failed to unblock item');
      }
    } catch (err) {
      logger.error('handleUnblockItem error', { detail: err });
      toast.error(isAr ? 'حدث خطأ أثناء فك الحجب' : 'Error unblocking item');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 7. Unblock Deliverable Package
  const handleUnblockDeliverable = async () => {
    if (!deliverable) return;
    setActionLoadingId('deliv-unblock');
    try {
      const updated = await DeliverablesService.updateDeliverableStatus(
        deliverable.id,
        deliverable.project_id,
        'in_progress',
        undefined
      );
      if (updated) {
        toast.success(isAr ? 'تم فك حجب التسليمة بنجاح' : 'Deliverable unblocked successfully');
        onActionSuccess();
        if (deliverableId) fetchDetails(deliverableId);
      }
    } catch (err) {
      logger.error('handleUnblockDeliverable error', { detail: err });
      toast.error(isAr ? 'فشل فك حجب التسليمة' : 'Failed to unblock deliverable');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 8. Blocker modal success
  const handleBlockerSuccess = (updated: Deliverable) => {
    toast.success(isAr ? 'تم تسجيل عائق التسليمة بنجاح' : 'Deliverable hold recorded');
    setIsBlockerModalOpen(false);
    onActionSuccess();
    if (deliverableId) fetchDetails(deliverableId);
  };

  // 9. Add new item
  const handleSaveNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliverable || !newItem.description?.trim()) return;

    setSavingItem(true);
    try {
      const payload: Partial<DeliverableItem> = {
        ...newItem,
        deliverable_id: deliverable.id,
        current_rev: Number(newItem.current_rev ?? 0),
        submission_revision: Number(newItem.submission_revision ?? 1),
        progress_pct: 0,
        status: 'received',
      };

      const created = await DeliverablesService.saveDeliverableItem(payload);
      if (created) {
        toast.success(isAr ? 'تمت إضافة البند بنجاح' : 'Item added successfully');
        setIsAddItemOpen(false);
        setNewItem({
          item_type: 'drawing',
          sheet_number: '',
          description: '',
          current_rev: 0,
          submission_revision: 1,
          consultant_status: 'pending',
          assigned_stakeholder_id: '',
        });
        onActionSuccess();
        if (deliverableId) fetchDetails(deliverableId);
      } else {
        toast.error(isAr ? 'فشل حفظ البند' : 'Failed to save item');
      }
    } catch (err) {
      logger.error('handleSaveNewItem error', { detail: err });
      toast.error(isAr ? 'حدث خطأ أثناء حفظ البند' : 'Error saving item');
    } finally {
      setSavingItem(false);
    }
  };

  // 10. Delete item
  const handleDeleteItem = async (itemId: string) => {
    if (!deliverable) return;
    const confirmMsg = isAr
      ? 'هل أنت متأكد من حذف هذا المخطط/البند من التسليمة؟'
      : 'Are you sure you want to delete this item?';
    if (!window.confirm(confirmMsg)) return;

    setActionLoadingId(itemId);
    try {
      const ok = await DeliverablesService.deleteDeliverableItem(itemId, deliverable.id);
      if (ok) {
        toast.success(isAr ? 'تم حذف البند' : 'Item deleted');
        onActionSuccess();
        if (deliverableId) fetchDetails(deliverableId);
      }
    } catch (err) {
      logger.error('handleDeleteItem error', { detail: err });
      toast.error(isAr ? 'فشل حذف البند' : 'Failed to delete item');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 11. File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !deliverable) return;

    setUploadingFile(true);
    try {
      const uploaded = await DeliverablesService.uploadAttachment(deliverable.id, file, 'drawing');
      if (uploaded) {
        toast.success(isAr ? 'تم رفع الملف بنجاح' : 'File uploaded successfully');
        setAttachments((prev) => [uploaded as DeliverableAttachment, ...prev]);
      } else {
        toast.error(isAr ? 'فشل رفع الملف' : 'Upload failed');
      }
    } catch (err) {
      logger.error('File upload error', { detail: err });
      toast.error(isAr ? 'حدث خطأ أثناء رفع الملف' : 'Error uploading file');
    } finally {
      setUploadingFile(false);
    }
  };

  // Consultant code badge renderer
  const renderConsultantCodeBadge = (code?: ConsultantApprovalCode) => {
    switch (code) {
      case 'A':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            {isAr ? 'كود A (معتمد)' : 'Code A (Approved)'}
          </span>
        );
      case 'B':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
            {isAr ? 'كود B (معتمد بملاحظات)' : 'Code B (Approved with Notes)'}
          </span>
        );
      case 'C':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            {isAr ? 'كود C (إعادة تقديم)' : 'Code C (Revise & Resubmit)'}
          </span>
        );
      case 'D':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            {isAr ? 'كود D (مرفوض)' : 'Code D (Rejected)'}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            {isAr ? 'بانتظار الاعتماد' : 'Pending Code'}
          </span>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Accessible Backdrop with click to close */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Drawer Container */}
      <div className="fixed inset-y-0 end-0 max-w-full flex z-50 pointer-events-none">
        <section
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="deliverable-drawer-title"
          aria-describedby="deliverable-drawer-subtitle"
          tabIndex={-1}
          className={`pointer-events-auto w-screen max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl bg-white dark:bg-slate-900 border-s border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out animate-in ${
            isAr ? 'slide-in-from-left' : 'slide-in-from-right'
          } focus:outline-none`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 shrink-0">
            <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
              <div className="p-2.5 sm:p-3 rounded-2xl bg-emerald-700 text-white shadow-md shadow-emerald-700/20 shrink-0">
                <Package className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>

              <div className="min-w-0 flex-1 text-start">
                <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 shadow-xs">
                    {deliverable?.ref_code || '...'}
                  </span>

                  <span className="px-2 py-0.5 rounded-lg text-xs font-bold uppercase bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                    {deliverable?.kind || 'E1'}
                  </span>

                  {deliverable?.priority === 'high' && (
                    <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                      {isAr ? 'أولوية عاجلة' : 'High Priority'}
                    </span>
                  )}

                  {deliverable && (
                    <UnifiedStatusBadge
                      status={deliverable.status}
                      entityType="deliverable"
                      size="md"
                    />
                  )}
                </div>

                <h2
                  id="deliverable-drawer-title"
                  className="text-sm sm:text-base font-bold text-slate-900 dark:text-white line-clamp-1 sm:truncate"
                >
                  {deliverable?.title_ar || (isAr ? 'تفاصيل التسليمة الهندسية' : 'Deliverable Details')}
                </h2>
                <p id="deliverable-drawer-subtitle" className="sr-only">
                  {isAr
                    ? 'نافذة تفاصيل التسليمة الهندسية والمخططات التنفيذية وسجل التدقيق'
                    : 'Engineering deliverable details, shop drawings, and audit trail'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                className="min-w-[44px] min-h-[44px] p-2.5 rounded-xl text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 flex items-center justify-center active:scale-95"
                aria-label={isAr ? 'إغلاق نافذة التفاصيل' : 'Close deliverable details'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Drawer Body */}
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400 dark:text-slate-500 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="text-xs font-medium">{isAr ? 'جاري تحميل تفاصيل التسليمة...' : 'Loading deliverable details...'}</p>
            </div>
          ) : !deliverable ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400 dark:text-slate-500 space-y-3">
              <AlertCircle className="w-10 h-10 text-rose-500" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {isAr ? 'لم يتم العثور على التسليمة' : 'Deliverable not found'}
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
              {/* Blocker Notice Banner if Deliverable is Blocked */}
              {deliverable.status === 'blocked' && (
                <div className="p-4 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200 space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                      <span className="text-xs font-bold text-rose-800 dark:text-rose-300">
                        {isAr ? 'التسليمة معطلة حالياً (يوجد عائق نشط)' : 'Active Blocker on Deliverable'}
                      </span>
                    </div>

                    {isToManagerOrAdmin && (
                      <button
                        type="button"
                        onClick={handleUnblockDeliverable}
                        disabled={actionLoadingId === 'deliv-unblock'}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer transition shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
                      >
                        {actionLoadingId === 'deliv-unblock' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Unlock className="w-3.5 h-3.5" />
                        )}
                        <span>{isAr ? 'فك الحجب واستئناف العمل' : 'Unblock Deliverable'}</span>
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-rose-700 dark:text-rose-300 bg-white/60 dark:bg-slate-900/60 p-3 rounded-2xl border border-rose-100 dark:border-rose-900/50">
                    <span className="font-bold">{isAr ? 'سبب الحجب: ' : 'Reason: '}</span>
                    {deliverable.blocked_reason || (isAr ? 'بانتظار استفسار فني أو رد استشاري' : 'Awaiting RFI')}
                  </p>

                  {deliverable.blocked_since && (
                    <div className="text-[11px] text-rose-600 dark:text-rose-400 font-mono">
                      {isAr ? 'تاريخ الحجب: ' : 'Blocked since: '}
                      {new Date(deliverable.blocked_since).toLocaleString(isAr ? 'ar-EG' : 'en-US')}
                    </div>
                  )}
                </div>
              )}

              {/* Workflow Stepper */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 px-1">
                  <span>{isAr ? 'مسار سير العمل والاعتماد' : 'Workflow Progression'}</span>
                  {stepperState.isBlocked && (
                    <span className="text-rose-600 dark:text-rose-400 font-normal text-[11px] flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" />
                      <span>{isAr ? 'متعطلة عند مسار التنفيذ' : 'Blocked on in-progress'}</span>
                    </span>
                  )}
                </div>

                <WorkflowStepper
                  steps={workflowSteps}
                  currentStep={stepperState.currentStep}
                  variant={stepperState.isBlocked ? 'fork' : 'linear'}
                  completedSteps={stepperState.completedSteps}
                  rejectedSteps={stepperState.rejectedSteps}
                />
              </div>

              {/* SLA & Quick Metrics Bar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* SLA Progress Bar */}
                <SLAProgressBar
                  createdAt={deliverable.received_at}
                  dueAt={deliverable.due_date}
                  targetHours={deliverable.kind === 'E1' ? 48 : 72}
                  label={isAr ? 'مستوى الالتزام بالبرنامج الزمني' : 'Deliverable SLA Timeline'}
                />

                {/* Overall Progress & Info Card */}
                <div className="glass-card bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 p-4 rounded-2xl shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span>{isAr ? 'معدل إنجاز البنود والمخططات' : 'Items Progress'}</span>
                    </span>

                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                      {overallProgressPct}%
                    </span>
                  </div>

                  <div className="space-y-1.5 my-2">
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 transition-all duration-500 rounded-full"
                        style={{ width: `${overallProgressPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                      <span>{deliverable.current_holder?.name_ar || (isAr ? 'المكتب الفني' : 'Technical Office')}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                      <span>{isAr ? `منذ ${ageDays} يوم` : `${ageDays} days elapsed`}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs with ARIA Tablist & Horizontal Scroll on Mobile */}
              <div
                role="tablist"
                aria-label={isAr ? 'أقسام تفاصيل التسليمة' : 'Deliverable Detail Sections'}
                className="flex items-center gap-1 sm:gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar scroll-smooth flex-nowrap -mx-4 sm:-mx-6 px-4 sm:px-6"
              >
                <button
                  type="button"
                  role="tab"
                  id="tab-items"
                  aria-controls="panel-items"
                  aria-selected={activeTab === 'items'}
                  tabIndex={activeTab === 'items' ? 0 : -1}
                  onClick={() => setActiveTab('items')}
                  className={`shrink-0 whitespace-nowrap flex items-center gap-2 px-3.5 sm:px-4 py-2.5 text-xs font-bold border-b-2 cursor-pointer transition-all rounded-t-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 ${
                    activeTab === 'items'
                      ? 'border-emerald-700 text-emerald-700 dark:text-emerald-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <FileCode className="w-4 h-4" />
                  <span>{isAr ? 'بنود ومخططات التسليمة' : 'Deliverable Items'}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {deliverable.items?.length || 0}
                  </span>
                </button>

                <button
                  type="button"
                  role="tab"
                  id="tab-events"
                  aria-controls="panel-events"
                  aria-selected={activeTab === 'events'}
                  tabIndex={activeTab === 'events' ? 0 : -1}
                  onClick={() => setActiveTab('events')}
                  className={`shrink-0 whitespace-nowrap flex items-center gap-2 px-3.5 sm:px-4 py-2.5 text-xs font-bold border-b-2 cursor-pointer transition-all rounded-t-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 ${
                    activeTab === 'events'
                      ? 'border-emerald-700 text-emerald-700 dark:text-emerald-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <History className="w-4 h-4" />
                  <span>{isAr ? 'سجل التدقيق والقرارات' : 'Audit Trail'}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {events.length}
                  </span>
                </button>

                <button
                  type="button"
                  role="tab"
                  id="tab-attachments"
                  aria-controls="panel-attachments"
                  aria-selected={activeTab === 'attachments'}
                  tabIndex={activeTab === 'attachments' ? 0 : -1}
                  onClick={() => setActiveTab('attachments')}
                  className={`shrink-0 whitespace-nowrap flex items-center gap-2 px-3.5 sm:px-4 py-2.5 text-xs font-bold border-b-2 cursor-pointer transition-all rounded-t-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 ${
                    activeTab === 'attachments'
                      ? 'border-emerald-700 text-emerald-700 dark:text-emerald-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Paperclip className="w-4 h-4" />
                  <span>{isAr ? 'المرفقات والمستندات' : 'Attachments'}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {attachments.length}
                  </span>
                </button>

                <button
                  type="button"
                  role="tab"
                  id="tab-info"
                  aria-controls="panel-info"
                  aria-selected={activeTab === 'info'}
                  tabIndex={activeTab === 'info' ? 0 : -1}
                  onClick={() => setActiveTab('info')}
                  className={`shrink-0 whitespace-nowrap flex items-center gap-2 px-3.5 sm:px-4 py-2.5 text-xs font-bold border-b-2 cursor-pointer transition-all rounded-t-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 ${
                    activeTab === 'info'
                      ? 'border-emerald-700 text-emerald-700 dark:text-emerald-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>{isAr ? 'البيانات التعاقدية' : 'Package Info'}</span>
                </button>
              </div>

              {/* TAB 1: Items List & Item Actions */}
              {activeTab === 'items' && (
                <div
                  role="tabpanel"
                  id="panel-items"
                  aria-labelledby="tab-items"
                  tabIndex={0}
                  className="space-y-4 focus:outline-none"
                >
                  {/* Top action bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                        {isAr ? 'قائمة اللوحات والعينات المرتبطة' : 'Linked Drawings & Materials'}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isAr
                          ? 'تنفيذ إجراءات سير العمل على كل بند وفقاً لصلاحيات الدور'
                          : 'Execute workflow lifecycle actions on each item'}
                      </p>
                    </div>

                    <div className="flex items-center flex-wrap gap-2">
                      {deliverable.status === 'in_progress' && (
                        <button
                          type="button"
                          onClick={() => setIsBlockerModalOpen(true)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 hover:bg-rose-100 dark:hover:bg-rose-900/50 cursor-pointer transition shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1 active:scale-95"
                        >
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                          <span>{isAr ? 'حجب التسليمة' : 'Block Package'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setIsAddItemOpen(!isAddItemOpen)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer transition shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isAr ? 'إضافة مخطط / بند' : 'Add Item'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Inline Add Item Form */}
                  {isAddItemOpen && (
                    <form
                      onSubmit={handleSaveNewItem}
                      className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3 animate-in fade-in"
                    >
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Plus className="w-4 h-4 text-emerald-600" />
                        <span>{isAr ? 'إضافة مخطط أو عينة جديدة إلى التسليمة' : 'Add New Deliverable Item'}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            {isAr ? 'نوع البند' : 'Item Type'}
                          </label>
                          <select
                            value={newItem.item_type}
                            onChange={(e) =>
                              setNewItem({ ...newItem, item_type: e.target.value as 'drawing' | 'material' })
                            }
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          >
                            <option value="drawing">{isAr ? 'مخطط تنفيذي' : 'Drawing'}</option>
                            <option value="material">{isAr ? 'عينة مواد / مورد' : 'Material Sample'}</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            {isAr ? 'رقم اللوحة / الكود' : 'Sheet / Code'}
                          </label>
                          <input
                            type="text"
                            placeholder="DWG-001"
                            value={newItem.sheet_number || ''}
                            onChange={(e) => setNewItem({ ...newItem, sheet_number: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            {isAr ? 'رقم المراجعة المبدئي' : 'Initial Rev'}
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={newItem.current_rev ?? 0}
                            onChange={(e) => setNewItem({ ...newItem, current_rev: Number(e.target.value) })}
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {isAr ? 'الوصف والتفاصيل الهندسية *' : 'Description *'}
                        </label>
                        <input
                          type="text"
                          required
                          placeholder={isAr ? 'مثال: تفاصيل تسليح مسبح التدريب - قطاع A-A' : 'e.g. Training pool reinforcement details'}
                          value={newItem.description || ''}
                          onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsAddItemOpen(false)}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 active:scale-95"
                        >
                          {isAr ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button
                          type="submit"
                          disabled={savingItem}
                          className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white cursor-pointer transition shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed active:scale-95"
                        >
                          {savingItem ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ البند' : 'Save Item')}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Items List */}
                  {(!deliverable.items || deliverable.items.length === 0) ? (
                    <div className="py-16 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl space-y-2 text-slate-400 dark:text-slate-500">
                      <FileCode className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {isAr ? 'لا توجد مخططات أو بنود مضافة لهذه التسليمة' : 'No items added yet'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isAr ? 'اضغط على «إضافة مخطط / بند» لإدراج اللوحات والعينات' : 'Click Add Item to get started'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {deliverable.items.map((item, index) => {
                        const isActionLoading = actionLoadingId === item.id;

                        return (
                          <div
                            key={item.id || index}
                            className="glass-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition space-y-3"
                          >
                            {/* Item Top Row */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                              <div className="flex items-start gap-2.5 min-w-0">
                                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0 mt-0.5">
                                  <FileCode className="w-4 h-4" />
                                </div>

                                <div className="min-w-0">
                                  <div className="flex items-center flex-wrap gap-2 mb-1">
                                    {item.sheet_number && (
                                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                                        {item.sheet_number}
                                      </span>
                                    )}

                                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                      {isAr ? `مراجعة ${item.current_rev}` : `Rev ${item.current_rev}`}
                                    </span>

                                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                      {isAr ? `تقديم #${item.submission_revision || 1}` : `Sub #${item.submission_revision || 1}`}
                                    </span>

                                    <UnifiedStatusBadge
                                      status={item.status || 'pending'}
                                      entityType="deliverable"
                                      size="sm"
                                    />
                                  </div>

                                  <p className="text-xs font-bold text-slate-900 dark:text-white leading-relaxed">
                                    {item.description}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                                {renderConsultantCodeBadge(item.consultant_status)}

                                <button
                                  type="button"
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 active:scale-95"
                                  title={isAr ? 'حذف البند' : 'Delete item'}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Progress bar per item */}
                            <div className="space-y-1 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                                <span>{isAr ? 'نسبة الإنجاز الفني:' : 'Progress:'}</span>
                                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                                  {item.progress_pct ?? 0}%
                                </span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                <div
                                  className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
                                  style={{ width: `${item.progress_pct ?? 0}%` }}
                                />
                              </div>
                            </div>

                            {/* Item Action Buttons based on Role & Status */}
                            <div className="flex items-center flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 justify-end">
                              {/* 1. Received: Start Work */}
                              {item.status === 'received' && (
                                <button
                                  type="button"
                                  onClick={() => handleStartWork(item.id)}
                                  disabled={isActionLoading}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white cursor-pointer transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 active:scale-95"
                                >
                                  {isActionLoading ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Play className="w-3.5 h-3.5" />
                                  )}
                                  <span>{isAr ? 'بدء العمل' : 'Start Work'}</span>
                                </button>
                              )}

                              {/* 2. In Progress: Complete & Submit to Manager OR Block */}
                              {item.status === 'in_progress' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleSubmitToManager(item.id)}
                                    disabled={isActionLoading}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 active:scale-95"
                                  >
                                    {isActionLoading ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Send className="w-3.5 h-3.5" />
                                    )}
                                    <span>{isAr ? 'تقديم للمدير' : 'Submit to Manager'}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setIsBlockerModalOpen(true)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900 cursor-pointer transition focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 active:scale-95"
                                  >
                                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                                    <span>{isAr ? 'حجب التسليمة' : 'Block Deliverable'}</span>
                                  </button>
                                </>
                              )}

                              {/* 3. Ready to Return & (TO Manager / Admin): Manager Approve OR Reject with reason */}
                              {item.status === 'ready_to_return' && isToManagerOrAdmin && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleManagerApprove(item.id)}
                                    disabled={isActionLoading}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 active:scale-95"
                                  >
                                    {isActionLoading ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                    )}
                                    <span>{isAr ? '✓ اعتماد المدير' : '✓ Manager Approve'}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleOpenRejectModal(item.id)}
                                    disabled={isActionLoading}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 active:scale-95"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>{isAr ? '✕ إعادة للمهندس' : '✕ Return to Engineer'}</span>
                                  </button>
                                </>
                              )}

                              {/* 4. Returned & (TO Manager / Admin): Record Consultant Review Code */}
                              {(item.status === 'returned' || (item.status as string) === 'approved') && isToManagerOrAdmin && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenConsultantReview(item)}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white cursor-pointer transition shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 active:scale-95"
                                >
                                  <FileCode className="w-3.5 h-3.5" />
                                  <span>{isAr ? 'تسجيل كود الاستشاري' : 'Record Consultant Code'}</span>
                                </button>
                              )}

                              {/* 5. Blocked & (TO Manager / Admin): Unblock Item */}
                              {item.status === 'blocked' && isToManagerOrAdmin && (
                                <button
                                  type="button"
                                  onClick={() => handleUnblockItem(item.id)}
                                  disabled={isActionLoading}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 active:scale-95"
                                >
                                  {isActionLoading ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Unlock className="w-3.5 h-3.5" />
                                  )}
                                  <span>{isAr ? 'فك الحجب' : 'Unblock Item'}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Audit Trail Events */}
              {activeTab === 'events' && (
                <div
                  role="tabpanel"
                  id="panel-events"
                  aria-labelledby="tab-events"
                  tabIndex={0}
                  className="space-y-4 focus:outline-none"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                        {isAr ? 'سجل تتبع مسار العمل والقرارات' : 'Event Log & Audit Trail'}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isAr
                          ? 'توثيق الحركات، التغييرات، أسباب التعطيل والاعتمادات'
                          : 'Complete transition ledger entries'}
                      </p>
                    </div>
                  </div>

                  {events.length === 0 ? (
                    <div className="py-16 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl space-y-2 text-slate-400 dark:text-slate-500">
                      <History className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {isAr ? 'لا توجد سجلات أحداث مسجلة' : 'No recorded events yet'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isAr
                          ? 'سيتم تسجيل الإجراءات والملاحظات تلقائياً عند تغيير الحالات'
                          : 'Events are logged automatically on workflow actions'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {events.map((evt, idx) => {
                        const isLast = idx === events.length - 1;
                        const config = getEventDisplayConfig(evt);
                        const stakeholder = stakeholders.find((s) => s.id === evt.by_stakeholder_id);
                        const formattedDate = new Date(evt.created_at).toLocaleString(
                          isAr ? 'ar-EG' : 'en-US',
                          {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          }
                        );

                        return (
                          <div
                            key={evt.id || idx}
                            className="flex gap-3 sm:gap-4 items-start relative group"
                          >
                            {/* Symmetrical Timeline Axis */}
                            <div className="flex flex-col items-center self-stretch shrink-0 relative">
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center border shadow-2xs z-10 ${config.iconBg} ${config.iconBorder}`}
                              >
                                <config.Icon className={`w-4 h-4 ${config.iconColor}`} />
                              </div>
                              {!isLast && (
                                <div className="w-0.5 grow bg-slate-200 dark:bg-slate-800 my-1 group-hover:bg-emerald-300 dark:group-hover:bg-emerald-800 transition-colors" />
                              )}
                            </div>

                            {/* Event Card Content */}
                            <div className="flex-1 p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2 text-start">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span
                                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${config.badgeClass}`}
                                  >
                                    {config.label}
                                  </span>

                                  {evt.to_value && (
                                    <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                      {getStatusLabel(evt.to_value)}
                                    </span>
                                  )}
                                </div>

                                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                                  {formattedDate}
                                </span>
                              </div>

                              {/* State Transition details */}
                              {evt.from_value && evt.to_value && (
                                <div className="flex items-center gap-2 text-xs font-mono text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
                                  <span>{getStatusLabel(evt.from_value)}</span>
                                  <span className="text-slate-400 dark:text-slate-500">{isAr ? '←' : '→'}</span>
                                  <span className="font-bold text-slate-900 dark:text-white">
                                    {getStatusLabel(evt.to_value)}
                                  </span>
                                </div>
                              )}

                              {/* Reason / Remarks */}
                              {evt.reason && (
                                <div className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border-s-4 border-emerald-600 dark:border-emerald-500">
                                  <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
                                    {isAr ? 'السبب / الملاحظات الهندسية:' : 'Reason / Notes:'}
                                  </span>
                                  {evt.reason}
                                </div>
                              )}

                              {/* Stakeholder attribution */}
                              {stakeholder && (
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                                  <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                                  <span>
                                    {isAr ? 'المسؤول:' : 'Action by:'}{' '}
                                    <strong className="text-slate-700 dark:text-slate-300">
                                      {(stakeholder as any).name_ar || (stakeholder as any).name_en || (stakeholder as any).name}
                                    </strong>
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Attachments */}
              {activeTab === 'attachments' && (
                <div
                  role="tabpanel"
                  id="panel-attachments"
                  aria-labelledby="tab-attachments"
                  tabIndex={0}
                  className="space-y-4 focus:outline-none"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                        {isAr ? 'المرفقات والمستندات الهندسية' : 'Attachments & Submittals'}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isAr
                          ? 'المخططات الهندسية والمستندات المرفقة مع التسليمة'
                          : 'Attached drawings & documents'}
                      </p>
                    </div>

                    <label className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer transition shadow-sm self-start sm:self-auto focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-2 active:scale-95">
                      {uploadingFile ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {uploadingFile
                          ? isAr
                            ? 'جاري الرفع...'
                            : 'Uploading...'
                          : isAr
                          ? 'رفع ملف جديد'
                          : 'Upload File'}
                      </span>
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        disabled={uploadingFile}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {attachments.length === 0 ? (
                    <div className="py-16 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl space-y-2 text-slate-400 dark:text-slate-500">
                      <Paperclip className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {isAr ? 'لا توجد مرفقات مسجلة لهذه التسليمة' : 'No attachments found'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isAr
                          ? 'اضغط على «رفع ملف جديد» لإضافة المخططات والمواصفات'
                          : 'Click Upload File to add drawings or documents'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {attachments.map((att, idx) => {
                        const meta = getAttachmentMeta(att);
                        const formattedSize = att.file_size
                          ? att.file_size > 1024 * 1024
                            ? `${(att.file_size / (1024 * 1024)).toFixed(1)} MB`
                            : `${Math.round(att.file_size / 1024)} KB`
                          : null;

                        return (
                          <div
                            key={att.id || idx}
                            className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`p-2.5 rounded-xl shrink-0 border ${meta.badgeColor}`}
                              >
                                <meta.IconComponent className="w-4 h-4" />
                              </div>

                              <div className="min-w-0 text-start">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span
                                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${meta.badgeColor}`}
                                  >
                                    {meta.typeLabel}
                                  </span>
                                  <p
                                    className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[160px] sm:max-w-[220px]"
                                    title={meta.name}
                                  >
                                    {meta.name}
                                  </p>
                                </div>

                                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-1">
                                  <span>
                                    {new Date(
                                      att.uploaded_at || (att as any).created_at || Date.now()
                                    ).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
                                  </span>
                                  {formattedSize && (
                                    <>
                                      <span>•</span>
                                      <span>{formattedSize}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Attachment Actions in RTL: Preview, Download, Copy Link */}
                            <div className="flex items-center gap-1 shrink-0 ms-auto">
                              {meta.url && (
                                <>
                                  <a
                                    href={meta.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center p-2 rounded-xl text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 dark:text-slate-400 dark:hover:text-emerald-300 cursor-pointer transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-95"
                                    title={isAr ? 'معاينة الملف في نافذة جديدة' : 'Preview file in new tab'}
                                    aria-label={isAr ? `معاينة ${meta.name}` : `Preview ${meta.name}`}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </a>

                                  <a
                                    href={meta.url}
                                    download={meta.name}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center p-2 rounded-xl text-slate-500 hover:text-sky-700 hover:bg-sky-50 dark:hover:bg-sky-950/40 dark:text-slate-400 dark:hover:text-sky-300 cursor-pointer transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 active:scale-95"
                                    title={isAr ? 'تنزيل الملف' : 'Download file'}
                                    aria-label={isAr ? `تنزيل ${meta.name}` : `Download ${meta.name}`}
                                  >
                                    <Download className="w-4 h-4" />
                                  </a>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(meta.url);
                                      toast.success(
                                        isAr
                                          ? 'تم نسخ رابط الملف إلى الحافظة'
                                          : 'File link copied to clipboard'
                                      );
                                    }}
                                    className="inline-flex items-center justify-center p-2 rounded-xl text-slate-500 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/40 dark:text-slate-400 dark:hover:text-purple-300 cursor-pointer transition focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 active:scale-95"
                                    title={isAr ? 'نسخ رابط الملف' : 'Copy file link'}
                                    aria-label={isAr ? `نسخ رابط الملف ${meta.name}` : `Copy link for ${meta.name}`}
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: General Contractual Info */}
              {activeTab === 'info' && (
                <div
                  role="tabpanel"
                  id="panel-info"
                  aria-labelledby="tab-info"
                  tabIndex={0}
                  className="space-y-4 focus:outline-none"
                >
                  <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                      {isAr ? 'بيانات الحزمة والمكتب الفني' : 'Package Metadata'}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 shadow-2xs">
                        <span className="text-slate-500 dark:text-slate-400 block text-[11px] mb-1 font-medium">
                          {isAr ? 'كود المرجع' : 'Ref Code'}
                        </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                          {deliverable.ref_code}
                        </span>
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 shadow-2xs">
                        <span className="text-slate-500 dark:text-slate-400 block text-[11px] mb-1 font-medium">
                          {isAr ? 'نوع الحزمة' : 'Package Kind'}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {deliverable.kind}
                        </span>
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 shadow-2xs">
                        <span className="text-slate-500 dark:text-slate-400 block text-[11px] mb-1 font-medium">
                          {isAr ? 'تاريخ الاستلام' : 'Received At'}
                        </span>
                        <span className="font-mono text-slate-700 dark:text-slate-300">
                          {deliverable.received_at
                            ? new Date(deliverable.received_at).toLocaleDateString(
                                isAr ? 'ar-EG' : 'en-US'
                              )
                            : '—'}
                        </span>
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 shadow-2xs">
                        <span className="text-slate-500 dark:text-slate-400 block text-[11px] mb-1 font-medium">
                          {isAr ? 'تاريخ الاستحقاق المحدد' : 'Due Date'}
                        </span>
                        <span className="font-mono text-slate-700 dark:text-slate-300">
                          {deliverable.due_date || '—'}
                        </span>
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 shadow-2xs">
                        <span className="text-slate-500 dark:text-slate-400 block text-[11px] mb-1 font-medium">
                          {isAr ? 'المسؤول الحالي' : 'Current Holder'}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {(deliverable.current_holder as any)?.name_ar ||
                            (deliverable.current_holder as any)?.name_en ||
                            (deliverable.current_holder as any)?.name ||
                            (isAr ? 'المكتب الفني' : 'Technical Office')}
                        </span>
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 shadow-2xs">
                        <span className="text-slate-500 dark:text-slate-400 block text-[11px] mb-1 font-medium">
                          {isAr ? 'الأولوية' : 'Priority'}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {isAr
                            ? deliverable.priority === 'high'
                              ? 'عاجلة'
                              : deliverable.priority === 'low'
                              ? 'منخفضة'
                              : 'عادية'
                            : deliverable.priority}
                        </span>
                      </div>
                    </div>

                    {deliverable.notes && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400 block text-[11px] mb-1 font-medium">
                          {isAr ? 'ملاحظات وتوجيهات' : 'Notes'}
                        </span>
                        <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                          {deliverable.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="px-4 sm:px-6 py-3 sm:py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 flex items-center justify-between shrink-0">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              {isAr ? 'المعرف: ' : 'ID: '}{deliverable?.id ? deliverable.id.slice(0, 8) + '...' : '—'}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 active:scale-95"
            >
              {isAr ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </section>
      </div>

      {/* MODAL 1: Consultant Review Modal */}
      {isConsultantModalOpen && selectedConsultantItem && (
        <ConsultantReviewModal
          isOpen={isConsultantModalOpen}
          onClose={() => {
            setIsConsultantModalOpen(false);
            setSelectedConsultantItem(null);
          }}
          item={selectedConsultantItem}
          onSuccess={handleConsultantSuccess}
        />
      )}

      {/* MODAL 2: Deliverable Blocker Modal */}
      {isBlockerModalOpen && deliverable && (
        <DeliverableBlockerModal
          isOpen={isBlockerModalOpen}
          onClose={() => setIsBlockerModalOpen(false)}
          deliverable={deliverable}
          onSuccess={handleBlockerSuccess}
        />
      )}

      {/* MODAL 3: Reason Modal for Manager Rejecting Item */}
      {isRejectReasonModalOpen && (
        <ReasonModal
          isOpen={isRejectReasonModalOpen}
          onClose={() => {
            setIsRejectReasonModalOpen(false);
            setSelectedRejectItemId(null);
          }}
          title={isAr ? 'إعادة البند للمهندس للتعديل' : 'Return Item to Engineer'}
          subtitle={
            isAr
              ? 'يرجى كتابة أسباب رفض الاعتماد والتعديلات الهندسية المطلوبة من مهندس المكتب الفني'
              : 'Please enter revision requirements and feedback for the Technical Office Engineer'
          }
          placeholder={
            isAr
              ? 'مثال: يلزم مراجعة تطابق أقطار حديد التسليح مع جدول تسليح القواعد قبل اعتماد التقديم...'
              : 'e.g. Verify reinforcement rebar diameters match structural schedule...'
          }
          confirmLabel={isAr ? 'تأكيد الإعادة للمهندس' : 'Confirm Return'}
          confirmVariant="danger"
          isLoading={rejectingLoading}
          onConfirm={handleRejectConfirm}
        />
      )}
    </div>
  );
};

export default WorkflowDeliverableDetailDrawer;
