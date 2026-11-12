'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Clock,
  Calendar,
  User,
  ShieldCheck,
  ShieldAlert,
  Layers,
  FileText,
  Play,
  Send,
  CheckCircle2,
  XCircle,
  RotateCcw,
  CheckCheck,
  Plus,
  ArrowLeft,
  Sparkles,
  MapPin,
  Tag,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Hash,
  Activity,
  ClipboardList,
  Check,
  GitCommit,
  FolderTree,
  Flame,
} from 'lucide-react';
import { SiteTask, SiteTaskService, SiteTaskStatus } from '@/lib/services/siteTask.service';
import { TaskOntologyService } from '@/lib/services/taskOntology.service';
import { TaskEvent, InspectionType } from '@/types/task-ontology';
import { CostCode } from '@/types/boq';
import { CostCodeSelector } from '@/components/planning/CostCodeSelector';
import { UnifiedStatusBadge } from '../UnifiedStatusBadge';
import { WorkflowStepper } from '../WorkflowStepper';
import { SLAProgressBar } from '../SLAProgressBar';
import { ReasonModal } from '../ReasonModal';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface SiteTaskDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string | null;
  userRoles: string[];
  myStakeholderId?: string | null;
  onActionSuccess: () => void;
}

const WORKFLOW_STEPS = [
  { key: 'pending', label: 'معلقة', subLabel: 'بانتظار البدء' },
  { key: 'in_progress', label: 'قيد التنفيذ', subLabel: 'العمل جارٍ' },
  { key: 'pm_review', label: 'مراجعة PM', subLabel: 'اعتماد مدير المشروع' },
  { key: 'qc_pending', label: 'بانتظار QC', subLabel: 'فحص الجودة WIR' },
  { key: 'approved', label: 'معتمدة', subLabel: 'تم قبول الفحص' },
  { key: 'done', label: 'مكتملة', subLabel: 'تم إغلاق المهمة' },
];

const EVENT_TYPE_MAP: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  created: { label: 'إنشاء المهمة', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', icon: Plus },
  started: { label: 'بدء العمل الميداني', color: 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300', icon: Play },
  submitted_for_pm: { label: 'تقديم للاعتماد (PM)', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300', icon: Send },
  pm_accepted: { label: 'اعتماد مدير المشروع', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300', icon: CheckCircle2 },
  pm_rejected: { label: 'رفض مدير المشروع', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300', icon: XCircle },
  inspection_created: { label: 'طلب فحص WIR / QC', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300', icon: ShieldCheck },
  inspection_passed: { label: 'اجتياز فحص الجودة', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300', icon: CheckCircle2 },
  inspection_rejected: { label: 'رسوب فحص الجودة', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300', icon: ShieldAlert },
  reopened_rework: { label: 'إعادة العمل والملاحظات', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300', icon: RotateCcw },
  verified: { label: 'اعتماد التحقق', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300', icon: CheckCheck },
  closed: { label: 'إغلاق المهمة نهائياً', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300', icon: CheckCheck },
  cancelled: { label: 'إلغاء المهمة', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300', icon: XCircle },
  reassigned: { label: 'إعادة إسناد المهمة', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300', icon: User },
  replanned: { label: 'إعادة جدولة المواعيد', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300', icon: Calendar },
  constraint_logged: { label: 'تسجيل عائق ميداني', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300', icon: ShieldAlert },
  constraint_resolved: { label: 'حل العائق الميداني', color: 'bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300', icon: CheckCircle2 },
};

export const SiteTaskDetailDrawer: React.FC<SiteTaskDetailDrawerProps> = ({
  isOpen,
  onClose,
  taskId,
  userRoles,
  myStakeholderId,
  onActionSuccess,
}) => {
  const [task, setTask] = useState<SiteTask | null>(null);
  const [events, setEvents] = useState<TaskEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Rejection modal state
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [pendingRejectState, setPendingRejectState] = useState<SiteTaskStatus>('rejected');

  // WIR Modal state
  const [isWirModalOpen, setIsWirModalOpen] = useState(false);
  const [wirType, setWirType] = useState<InspectionType>('WIR');
  const [wirRequiredDate, setWirRequiredDate] = useState<string>('');
  const [isSubmittingWir, setIsSubmittingWir] = useState(false);

  // Active tab in drawer
  const [activeTab, setActiveTab] = useState<'details' | 'planning' | 'audit'>('details');

  // Cost Code update state
  const [isUpdatingCostCode, setIsUpdatingCostCode] = useState(false);

  // Permission evaluation
  const isPM = userRoles.some((r) =>
    ['admin', 'project_manager', 'planning_manager', 'coo', 'ceo'].includes(r)
  );
  const isSiteEng = userRoles.some((r) =>
    ['admin', 'site_engineer', 'project_manager'].includes(r)
  );
  const isQC = userRoles.some((r) =>
    ['admin', 'qc_inspector', 'project_manager'].includes(r)
  );

  // Load task and event data
  const fetchData = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const [taskData, eventsData] = await Promise.all([
        SiteTaskService.getTaskById(taskId),
        TaskOntologyService.listEventsForTask(taskId),
      ]);
      setTask(taskData);
      setEvents(eventsData);
    } catch (err) {
      logger.error('Failed to load site task details', { detail: err, taskId });
      toast.error('حدث خطأ أثناء تحميل بيانات المهمة');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (isOpen && taskId) {
      fetchData();
      setActiveTab('details');
    } else {
      setTask(null);
      setEvents([]);
    }
  }, [isOpen, taskId, fetchData]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting && !isRejectModalOpen && !isWirModalOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, isRejectModalOpen, isWirModalOpen, onClose]);

  if (!isOpen) return null;

  // State transition handler
  const handleTransition = async (toState: SiteTaskStatus, reason?: string) => {
    if (!task) return;
    setIsSubmitting(true);
    try {
      await SiteTaskService.transitionTaskState({
        taskId: task.id,
        toState,
        reason,
      });
      toast.success('تم تحديث حالة المهمة بنجاح');
      await fetchData();
      onActionSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'تعذر تحديث حالة المهمة';
      logger.error('Task transition failed', { detail: err });
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reject action trigger (opens reason modal)
  const openRejectModal = (toState: SiteTaskStatus = 'rejected') => {
    setPendingRejectState(toState);
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async (reason: string) => {
    await handleTransition(pendingRejectState, reason);
    setIsRejectModalOpen(false);
  };

  // WIR creation handler
  const handleCreateWir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;
    setIsSubmittingWir(true);
    try {
      await TaskOntologyService.createInspectionRequest({
        task_id: task.id,
        project_id: task.project_id,
        request_no: `WIR-${task.id.slice(0, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`,
        inspection_type: wirType,
        required_at: wirRequiredDate || new Date(Date.now() + 86400000).toISOString(),
        status: 'pending',
      });
      toast.success('تم تقديم طلب فحص الجودة (WIR) بنجاح');
      setIsWirModalOpen(false);
      await fetchData();
      onActionSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء تقديم طلب الفحص';
      logger.error('Failed to create WIR', { detail: err });
      toast.error(msg);
    } finally {
      setIsSubmittingWir(false);
    }
  };

  // Cost Code assignment handler
  const handleCostCodeChange = async (selected: CostCode | null) => {
    if (!task) return;
    setIsUpdatingCostCode(true);
    try {
      const costCodeId = selected ? selected.id : null;
      const success = await SiteTaskService.assignCostCode(task.id, costCodeId);
      if (success) {
        toast.success(selected ? `تم ربط كود التكلفة: ${selected.code}` : 'تم إزالة كود التكلفة من المهمة');
        await fetchData();
        onActionSuccess();
      } else {
        toast.error('فشل تحديث كود التكلفة');
      }
    } catch (err: unknown) {
      logger.error('Error assigning cost code to task', { detail: err });
      toast.error('حدث خطأ أثناء حفظ كود التكلفة');
    } finally {
      setIsUpdatingCostCode(false);
    }
  };

  // Calculate completed steps for stepper
  const getCompletedSteps = () => {
    if (!task) return [];
    const status = task.status;
    switch (status) {
      case 'in_progress':
        return ['pending'];
      case 'pm_review':
        return ['pending', 'in_progress'];
      case 'qc_pending':
        return ['pending', 'in_progress', 'pm_review'];
      case 'approved':
        return ['pending', 'in_progress', 'pm_review', 'qc_pending'];
      case 'done':
        return ['pending', 'in_progress', 'pm_review', 'qc_pending', 'approved', 'done'];
      default:
        return [];
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse">
            عاجل جداً
          </span>
        );
      case 'high':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            أولوية عالية
          </span>
        );
      case 'low':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            منخفض
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            عادي
          </span>
        );
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      return new Intl.DateTimeFormat('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (isoStr?: string) => {
    if (!isoStr) return '—';
    try {
      return new Intl.DateTimeFormat('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(isoStr));
    } catch {
      return isoStr;
    }
  };

  const taskCodeDisplay = task?.task_code || (task?.id ? `TSK-${task.id.slice(0, 6).toUpperCase()}` : '—');

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="absolute inset-y-0 end-0 max-w-full flex">
        <div className="w-screen max-w-3xl bg-white dark:bg-slate-900 border-s border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
          {/* Top Header */}
          <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="p-3 rounded-2xl bg-emerald-700 text-white shadow-md shadow-emerald-700/20 shrink-0 mt-0.5">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-200">
                      {taskCodeDisplay}
                    </span>
                    {task && (
                      <>
                        <UnifiedStatusBadge status={task.status} entityType="task" size="md" />
                        {getPriorityBadge(task.priority)}
                      </>
                    )}
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug break-words">
                    {loading ? 'جاري التحميل...' : task?.title_ar || 'تفاصيل المهمة الميدانية'}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={fetchData}
                  disabled={loading}
                  title="تحديث البيانات"
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  aria-label="إغلاق اللوحة"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 mt-5 border-b border-slate-200/80 dark:border-slate-800 pb-1">
              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  activeTab === 'details'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>تفاصيل المهمة</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('audit')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  activeTab === 'audit'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <GitCommit className="w-3.5 h-3.5" />
                <span>سجل التدقيق ({events.length})</span>
              </button>
            </div>
          </div>

          {/* Drawer Body Scroll Area */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-500 space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                <span className="text-xs font-medium">جاري تحميل بيانات المهمة وسجل التدقيق...</span>
              </div>
            ) : !task ? (
              <div className="py-20 text-center text-slate-400 dark:text-slate-500 space-y-2">
                <AlertTriangle className="w-10 h-10 mx-auto text-amber-500" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">لم يتم العثور على المهمة أو تم حذفها</p>
              </div>
            ) : activeTab === 'details' ? (
              <>
                {/* 1. Workflow Stepper */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>مسار سير العمل (Workflow Progression)</span>
                    </span>
                  </div>
                  <WorkflowStepper
                    steps={WORKFLOW_STEPS}
                    currentStep={task.status === 'rejected' ? 'in_progress' : task.status}
                    completedSteps={getCompletedSteps()}
                    rejectedSteps={task.status === 'rejected' ? ['in_progress'] : []}
                  />
                </div>

                {/* 2. Rejection Banner if rejected */}
                {task.status === 'rejected' && (
                  <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 space-y-1.5 animate-in fade-in">
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                      <span>تم رفض المهمة / إعادة عمل (Rework Required)</span>
                    </div>
                    <p className="text-xs leading-relaxed text-rose-700 dark:text-rose-400">
                      سبب الرفض: {task.rejection_reason || 'يرجى مراجعة الملاحظات وتصحيح الأعمال قبل إعادة التقديم'}
                    </p>
                  </div>
                )}

                {/* 3. SLA Progress Bar */}
                <div className="space-y-1">
                  <SLAProgressBar
                    createdAt={task.created_at || task.planned_date}
                    dueAt={task.due_date || task.inspection_date}
                    label="مستوى الخدمة والالتزام الزمني (SLA)"
                  />
                </div>

                {/* 4. Task Metadata Grid */}
                <div className="glass-card bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    <span>بيانات الموقع والتكليف الهندسي</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Zone */}
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-1">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>المنطقة الميدانية (Zone)</span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {task.zone?.name_ar || 'غير محددة'}
                      </div>
                    </div>

                    {/* Primary Assignee */}
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-1">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>مهندس الموقع المكلف</span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {task.assignee?.name_ar || 'غير مسند'}
                      </div>
                    </div>

                    {/* QC Inspector */}
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-1">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                        <span>مفتش الجودة (QC Inspector)</span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {task.qc_inspector?.name_ar || 'غير محدد'}
                      </div>
                    </div>

                    {/* Task Type */}
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-1">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                        <Tag className="w-3.5 h-3.5 text-slate-400" />
                        <span>نوع المهمة (Task Type)</span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {task.task_type === 'execution'
                          ? 'تنفيذ ميداني'
                          : task.task_type === 'inspection'
                          ? 'فحص واستلام'
                          : task.task_type === 'material_delivery'
                          ? 'توريد مواد'
                          : task.task_type === 'handover'
                          ? 'تسليم نهائي'
                          : 'مهمة عامة'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4.5 Cost Code & Financial Mapping */}
                <div className="glass-card bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <FolderTree className="w-4 h-4 text-emerald-600" />
                      <span>كود التكلفة والربط المالي (Cost Code & Accounting)</span>
                    </h3>
                    {isUpdatingCostCode && (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>جارٍ التحديث...</span>
                      </span>
                    )}
                  </div>

                  {/* Associated BOQ Item if present */}
                  {task.boq_item && (
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-1">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                        <span className="font-medium flex items-center gap-1.5">
                          <ClipboardList className="w-3.5 h-3.5 text-slate-400" />
                          <span>بند المقايسة المرتبط (BOQ Item)</span>
                        </span>
                        <span className="font-mono text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded font-bold">
                          {task.boq_item.item_code}
                        </span>
                      </div>
                      <div className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-2">
                        {task.boq_item.description_ar}
                      </div>
                      {task.boq_item.cost_code && !task.cost_code && (
                        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 pt-0.5">
                          <span>(كود المقايسة الافتراضي: {task.boq_item.cost_code.code} - {task.boq_item.cost_code.name_ar})</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cost Code Selection / Display */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-slate-600 dark:text-slate-400">
                        كود التكلفة المسند للمهمة
                      </span>
                      {task.cost_code && (
                        <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                          [{task.cost_code.prefix || 'CC'}] {task.cost_code.code}
                        </span>
                      )}
                    </div>
                    <CostCodeSelector
                      value={task.cost_code_id || null}
                      selectedCode={task.cost_code || null}
                      onChange={handleCostCodeChange}
                      disabled={isUpdatingCostCode || (!isPM && !isSiteEng)}
                      placeholder={
                        task.boq_item?.cost_code
                          ? `موروث من بند المقايسة (${task.boq_item.cost_code.code} - ${task.boq_item.cost_code.name_ar})`
                          : 'اختر كود التكلفة للمهمة...'
                      }
                    />
                    {!isPM && !isSiteEng && (
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                        * تعديل كود التكلفة متاح لمدير المشروع ومهندس الموقع المعتمد فقط.
                      </p>
                    )}
                  </div>
                </div>

                {/* 5. Dates & Schedule Breakdown */}
                <div className="glass-card bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3.5">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>المواعيد والجدول الزمني</span>
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block mb-1">المخطط للبدء</span>
                      <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                        {formatDate(task.planned_date || task.planned_start)}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block mb-1">تاريخ الاستحقاق</span>
                      <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                        {formatDate(task.due_date || task.planned_finish)}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block mb-1">الفحص المستهدف</span>
                      <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                        {formatDate(task.inspection_date)}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block mb-1">نسبة الإنجاز</span>
                      <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {task.progress_pct || 0}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar Track */}
                  <div className="space-y-1 pt-1">
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700">
                      <div
                        className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, task.progress_pct || 0))}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* 6. Quantities & Scope if available */}
                {(task.planned_qty != null || task.actual_qty != null) && (
                  <div className="glass-card bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Hash className="w-4 h-4 text-emerald-600" />
                      <span>الكميات وحجم الأعمال الميدانية</span>
                    </h3>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block">الكمية المخططة</span>
                        <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 mt-1 block">
                          {task.planned_qty != null ? task.planned_qty.toLocaleString() : '—'} {task.unit || ''}
                        </span>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block">الكمية المنفذة</span>
                        <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                          {task.actual_qty != null ? task.actual_qty.toLocaleString() : '—'} {task.unit || ''}
                        </span>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block">الوحدة الهندسية</span>
                        <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mt-1 block">
                          {task.unit || '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 7. Description */}
                {task.description && (
                  <div className="glass-card bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-3xl p-4 sm:p-5 shadow-xs space-y-2">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span>الوصف والتعليمات التنفيذية</span>
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800">
                      {task.description}
                    </p>
                  </div>
                )}
              </>
            ) : (
              /* ── Audit Timeline Tab ────────────────────────── */
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <GitCommit className="w-4 h-4 text-emerald-600" />
                    <span>سجل الحركات والتعديلات غير القابل للتغيير (Immutable Audit Trail)</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 font-semibold">
                    {events.length} حركة مسجلة
                  </span>
                </div>

                {events.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 dark:text-slate-500 space-y-2">
                    <Clock className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">لا توجد حركات مسجلة لهذه المهمة حتى الآن</p>
                  </div>
                ) : (
                  <div className="relative border-s-2 border-emerald-200 dark:border-emerald-950/60 ms-3 sm:ms-4 space-y-5 my-2">
                    {events.map((ev, idx) => {
                      const meta = EVENT_TYPE_MAP[ev.event_type] || {
                        label: ev.event_type,
                        color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
                        icon: GitCommit,
                      };
                      const IconComponent = meta.icon;

                      return (
                        <div key={ev.id || idx} className="relative ps-6 group">
                          {/* Dot Badge */}
                          <div className="absolute -start-[9px] top-1.5 w-4 h-4 rounded-full bg-emerald-700 ring-4 ring-white dark:ring-slate-900 flex items-center justify-center text-white">
                            <GitCommit className="w-2.5 h-2.5" />
                          </div>

                          {/* Event Card */}
                          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-2.5 transition hover:border-slate-300 dark:hover:border-slate-600">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${meta.color}`}>
                                <IconComponent className="w-3 h-3 shrink-0" />
                                <span>{meta.label}</span>
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono">
                                {formatDateTime(ev.created_at)}
                              </span>
                            </div>

                            {/* Actor */}
                            {ev.actor_name_ar && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>بواسطة: <span className="font-semibold text-slate-900 dark:text-slate-200">{ev.actor_name_ar}</span></span>
                              </div>
                            )}

                            {/* State Transition Diff */}
                            {(ev.from_state || ev.to_state) && (
                              <div className="flex items-center gap-2 text-xs font-mono text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                                <span className="text-slate-400">{ev.from_state || '—'}</span>
                                <ArrowLeft className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="font-bold text-emerald-700 dark:text-emerald-400">{ev.to_state || '—'}</span>
                              </div>
                            )}

                            {/* Reason / Notes */}
                            {ev.reason && (
                              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-300 space-y-0.5">
                                <div className="font-bold text-[10px] text-amber-700 dark:text-amber-400">المبررات والملاحظات:</div>
                                <div className="leading-relaxed">{ev.reason}</div>
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
          </div>

          {/* Action Footer Controls */}
          <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              إغلاق
            </button>

            {/* Workflow Action Buttons */}
            {task && (
              <div className="flex flex-wrap items-center gap-2">
                {/* 1. Pending → Start Work */}
                {task.status === 'pending' && isSiteEng && (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleTransition('in_progress')}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/20 transition active:scale-95 disabled:opacity-50"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>بدء العمل</span>
                  </button>
                )}

                {/* 2. In Progress → Submit for PM review & Request WIR */}
                {task.status === 'in_progress' && (
                  <>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setIsWirModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold hover:bg-purple-100 dark:hover:bg-purple-900/40 transition disabled:opacity-50"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>طلب فحص WIR</span>
                    </button>

                    {isSiteEng && (
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleTransition('pm_review')}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition active:scale-95 disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                        <span>تقديم لمراجعة PM</span>
                      </button>
                    )}
                  </>
                )}

                {/* 3. PM Review & PM Roles → Approve, QC Refer, Reject */}
                {task.status === 'pm_review' && isPM && (
                  <>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => openRejectModal('rejected')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/40 transition disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>رفض</span>
                    </button>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleTransition('qc_pending')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition active:scale-95 disabled:opacity-50"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>إحالة للفحص QC</span>
                    </button>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleTransition('approved')}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-700/20 transition active:scale-95 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>اعتماد</span>
                    </button>
                  </>
                )}

                {/* 4. QC Pending → Approve inspection or Reject */}
                {task.status === 'qc_pending' && (isQC || isPM) && (
                  <>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => openRejectModal('rejected')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/40 transition disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>رفض الفحص</span>
                    </button>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleTransition('approved')}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-700/20 transition active:scale-95 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>قبول الفحص واعتماد</span>
                    </button>
                  </>
                )}

                {/* 5. Approved & PM → Close task (done) */}
                {task.status === 'approved' && isPM && (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleTransition('done')}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-700/20 transition active:scale-95 disabled:opacity-50"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>إغلاق المهمة</span>
                  </button>
                )}

                {/* 6. Rejected → Restart */}
                {task.status === 'rejected' && (isSiteEng || isPM) && (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleTransition('in_progress')}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/20 transition active:scale-95 disabled:opacity-50"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>إعادة البدء</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Rejection Reason Modal ─────────────────────────────────────── */}
      <ReasonModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onConfirm={handleConfirmReject}
        title="تسجيل سبب ومبررات الرفض"
        subtitle="يتطلب الرفض أو طلب إعادة العمل توضيح الأسباب الهندسية بدقة لإضافتها في سجل التدقيق."
        placeholder="يرجى كتابة الملاحظات والأسباب الفنية للرفض بالتفصيل..."
        confirmLabel="تأكيد الرفض وتسجيل الملاحظات"
        confirmVariant="danger"
        isLoading={isSubmitting}
      />

      {/* ── Create Inspection (WIR) Modal ─────────────────────────────── */}
      {isWirModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    طلب فحص واستلام جودة (WIR Request)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    إحالة الأعمال لفريق مراقبة الجودة للفحص الميداني
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsWirModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWir} className="p-5 sm:p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  نوع طلب الفحص (Inspection Type)
                </label>
                <select
                  value={wirType}
                  onChange={(e) => setWirType(e.target.value as InspectionType)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-purple-600"
                >
                  <option value="WIR" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">طلب استلام أعمال موقع (WIR - Work Inspection Request)</option>
                  <option value="MIR" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">طلب فحص وتوريد مواد (MIR - Material Inspection Request)</option>
                  <option value="pre_pour" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">فحص ما قبل الصب (Pre-Pour Inspection)</option>
                  <option value="survey" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">فحص مساحي ومناسيب (Survey Inspection)</option>
                  <option value="final_handover" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">تسليم نهائي للمالك/الاستشاري (Final Handover)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  الموعد المطلوب للفحص الميداني
                </label>
                <input
                  type="datetime-local"
                  value={wirRequiredDate}
                  onChange={(e) => setWirRequiredDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-mono text-slate-900 dark:text-white outline-none focus:border-purple-600 [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsWirModalOpen(false)}
                  disabled={isSubmittingWir}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWir}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition disabled:opacity-50"
                >
                  {isSubmittingWir ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري التقديم...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>تقديم طلب الفحص</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SiteTaskDetailDrawer;
