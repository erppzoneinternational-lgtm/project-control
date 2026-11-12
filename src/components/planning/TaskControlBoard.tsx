'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  ListOrdered,
  AlertTriangle,
  Clock,
  Layers,
  Plus,
  Search,
  RefreshCw,
  UserPlus,
  Calendar,
  X,
  History,
  ShieldCheck,
  Wand2,
  Loader2,
  FolderKanban,
  Table as TableIcon,
  GripVertical,
  CheckCircle2,
  Eye,
  FilterX,
  MapPin,
  User,
  ArrowRight,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SiteTask, SiteTaskService, SiteTaskStatus } from '@/lib/services/siteTask.service';
import { TaskOntologyService } from '@/lib/services/taskOntology.service';
import {
  ComponentInstance,
  ComponentInstanceType,
  WorkPackage,
  InspectionRequest,
  TaskEvent,
} from '@/types/task-ontology';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import PMReviewQueue from './PMReviewQueue';
import QCInspectionQueue from './QCInspectionQueue';
import TaskExceptionsDashboard from './TaskExceptionsDashboard';
import { LibraryTaskGenerator } from './LibraryTaskGenerator';
import { useUserRoles } from '@/lib/hooks/useUserRoles';

interface Props {
  projectId: string;
}

type BoardTask = SiteTask & {
  assignee_name?: string;
  zone_name?: string;
  task_instance_key?: string;
  component_instance_id?: string;
};

const errMessage = (err: unknown): string | undefined =>
  err instanceof Error ? err.message : (err as { message?: string } | null)?.message;

type BoardTab = 'tasks_list' | 'pm_queue' | 'qc_queue' | 'components' | 'exceptions' | 'generator';

export default function TaskControlBoard({ projectId }: Props) {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const [tab, setTab] = useState<BoardTab>('tasks_list');
  const [loading, setLoading] = useState(false);
  const { roles = [], isAdmin } = useUserRoles();
  const canSeeQcQueue = isAdmin || roles.some((r) => ['qc_inspector', 'qc_engineer', 'project_manager', 'planning_manager'].includes(r));

  useEffect(() => {
    if (!canSeeQcQueue && tab === 'qc_queue') {
      setTab('tasks_list');
    }
  }, [canSeeQcQueue, tab]);

  // Data
  const [tasks, setTasks] = useState<BoardTask[]>([]);
  const [components, setComponents] = useState<ComponentInstance[]>([]);
  const [, setWorkPackages] = useState<WorkPackage[]>([]);
  const [inspections, setInspections] = useState<InspectionRequest[]>([]);
  const [stakeholders, setStakeholders] = useState<{ id: string; name_ar: string }[]>([]);
  const [zones, setZones] = useState<{ id: string; name_ar: string }[]>([]);

  // Filters & View Mode
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [compFilter, setCompFilter] = useState<string>('all');
  const [zoneFilter, setZoneFilter] = useState<string>('all');

  // Drag and drop state
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<SiteTaskStatus | null>(null);

  // Drilldown / Action State
  const [selectedTask, setSelectedTask] = useState<BoardTask | null>(null);
  const [taskEvents, setTaskEvents] = useState<TaskEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Rejection / Rework Modal State
  const [rejectModalTask, setRejectModalTask] = useState<BoardTask | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Reassign / Replan Modal State
  const [reassignModal, setReassignModal] = useState<BoardTask | null>(null);
  const [newAssigneeId, setNewAssigneeId] = useState('');
  const [reassignReason, setReassignReason] = useState('');

  const [replanModal, setReplanModal] = useState<BoardTask | null>(null);
  const [newStartDate, setNewStartDate] = useState('');
  const [newFinishDate, setNewFinishDate] = useState('');
  const [replanReason, setReplanReason] = useState('');

  // New Component Instance Modal
  const [newCompModal, setNewCompModal] = useState(false);
  const [newCompCode, setNewCompCode] = useState('');
  const [newCompName, setNewCompName] = useState('');
  const [newCompType, setNewCompType] = useState<ComponentInstanceType>('lagoon_body');

  const loadData = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [tasksRes, comps, pkgs, insps, stksRes, zonesRes] = await Promise.all([
        supabase
          .from('pm_site_tasks')
          .select('*, assignee:stakeholders!pm_site_tasks_assignee_stakeholder_id_fkey(name_ar), pm_zones(name_ar)')
          .eq('project_id', projectId)
          .order('planned_date', { ascending: true }),
        TaskOntologyService.listComponentInstances(projectId),
        TaskOntologyService.listWorkPackages(projectId),
        TaskOntologyService.listInspections(projectId),
        supabase.from('stakeholders').select('id, name_ar').eq('is_active', true),
        supabase.from('pm_zones').select('id, name_ar').eq('project_id', projectId),
      ]);

      if (tasksRes.error) {
        logger.error('Failed to fetch tasks in TaskControlBoard', { error: tasksRes.error });
      }

      setTasks((tasksRes.data || []).map((t: SiteTask & { pm_zones?: { name_ar?: string } | null }) => ({
        ...t,
        assignee_name: t.assignee?.name_ar,
        zone_name: t.pm_zones?.name_ar,
      })));
      setComponents(comps);
      setWorkPackages(pkgs);
      setInspections(insps);
      setStakeholders(stksRes.data || []);
      setZones(zonesRes.data || []);
    } catch (err) {
      logger.error('TaskControlBoard.loadData error', { detail: err });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  // Load audit trail when a task is selected
  useEffect(() => {
    if (selectedTask) {
      setLoadingEvents(true);
      TaskOntologyService.listEventsForTask(selectedTask.id)
        .then((evts) => setTaskEvents(evts))
        .finally(() => setLoadingEvents(false));
    }
  }, [selectedTask]);

  // Escape key handler for drawer and modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedTask) setSelectedTask(null);
        if (reassignModal) setReassignModal(null);
        if (replanModal) setReplanModal(null);
        if (rejectModalTask) setRejectModalTask(null);
        if (newCompModal) setNewCompModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTask, reassignModal, replanModal, rejectModalTask, newCompModal]);

  // Priority Badge Helper
  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return {
          label: isAr ? 'عاجل جداً' : 'Urgent',
          classes: 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
          dot: 'bg-rose-500',
        };
      case 'high':
        return {
          label: isAr ? 'مرتفع' : 'High',
          classes: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
          dot: 'bg-amber-500',
        };
      case 'normal':
        return {
          label: isAr ? 'عادي' : 'Normal',
          classes: 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
          dot: 'bg-blue-500',
        };
      case 'low':
        return {
          label: isAr ? 'منخفض' : 'Low',
          classes: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
          dot: 'bg-slate-400',
        };
      default:
        return {
          label: isAr ? 'عادي' : 'Normal',
          classes: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
          dot: 'bg-slate-400',
        };
    }
  };

  // Status Badge Helper
  const getStatusBadge = (status: SiteTaskStatus) => {
    switch (status) {
      case 'approved':
      case 'done':
        return {
          label: isAr ? 'معتمد / مكتمل' : 'Approved',
          classes: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
        };
      case 'pm_review':
        return {
          label: isAr ? 'مراجعة PM' : 'PM Review',
          classes: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
        };
      case 'qc_pending':
        return {
          label: isAr ? 'فحص الجودة (WIR)' : 'QC Pending',
          classes: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
        };
      case 'rejected':
        return {
          label: isAr ? 'إعادة عمل / مرفوض' : 'Rework / Rejected',
          classes: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
        };
      case 'in_progress':
        return {
          label: isAr ? 'جاري التنفيذ' : 'In Progress',
          classes: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
        };
      case 'pending':
      default:
        return {
          label: isAr ? 'قيد الانتظار' : 'Pending',
          classes: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
        };
    }
  };

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && (t.priority || 'normal') !== priorityFilter) return false;
      if (compFilter !== 'all' && (t as BoardTask).component_instance_id !== compFilter) return false;
      if (zoneFilter !== 'all' && t.zone_id !== zoneFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = t.title_ar?.toLowerCase().includes(q);
        const matchDesc = t.description?.toLowerCase().includes(q);
        const matchCode = t.task_code?.toLowerCase().includes(q);
        const matchKey = (t as BoardTask).task_instance_key?.toLowerCase().includes(q);
        return matchTitle || matchDesc || matchCode || matchKey;
      }
      return true;
    });
  }, [tasks, statusFilter, priorityFilter, compFilter, zoneFilter, search]);

  // Kanban Columns
  const kanbanColumns = useMemo(
    () => [
      {
        id: 'pending' as SiteTaskStatus,
        titleAr: 'قيد الانتظار',
        titleEn: 'Pending',
        badgeBg: 'bg-slate-100 dark:bg-slate-800',
        badgeText: 'text-slate-700 dark:text-slate-300',
        columnBg: 'bg-slate-100/60 dark:bg-slate-900/40',
        borderClass: 'border-slate-200/80 dark:border-slate-800',
        dotColor: 'bg-slate-400',
        headerAccent: 'text-slate-700 dark:text-slate-300',
      },
      {
        id: 'in_progress' as SiteTaskStatus,
        titleAr: 'جاري التنفيذ',
        titleEn: 'In Progress',
        badgeBg: 'bg-blue-100 dark:bg-blue-950/60',
        badgeText: 'text-blue-800 dark:text-blue-300',
        columnBg: 'bg-blue-50/30 dark:bg-blue-950/20',
        borderClass: 'border-blue-200/70 dark:border-blue-900/50',
        dotColor: 'bg-blue-500',
        headerAccent: 'text-blue-800 dark:text-blue-300',
      },
      {
        id: 'pm_review' as SiteTaskStatus,
        titleAr: 'مراجعة PM',
        titleEn: 'PM Review',
        badgeBg: 'bg-amber-100 dark:bg-amber-950/60',
        badgeText: 'text-amber-800 dark:text-amber-300',
        columnBg: 'bg-amber-50/30 dark:bg-amber-950/20',
        borderClass: 'border-amber-200/70 dark:border-amber-900/50',
        dotColor: 'bg-amber-500',
        headerAccent: 'text-amber-800 dark:text-amber-300',
      },
      {
        id: 'qc_pending' as SiteTaskStatus,
        titleAr: 'فحص الجودة (WIR)',
        titleEn: 'QC Pending',
        badgeBg: 'bg-purple-100 dark:bg-purple-950/60',
        badgeText: 'text-purple-800 dark:text-purple-300',
        columnBg: 'bg-purple-50/30 dark:bg-purple-950/20',
        borderClass: 'border-purple-200/70 dark:border-purple-900/50',
        dotColor: 'bg-purple-500',
        headerAccent: 'text-purple-800 dark:text-purple-300',
      },
      {
        id: 'approved' as SiteTaskStatus,
        titleAr: 'معتمد / مكتمل',
        titleEn: 'Approved',
        badgeBg: 'bg-emerald-100 dark:bg-emerald-950/60',
        badgeText: 'text-emerald-800 dark:text-emerald-300',
        columnBg: 'bg-emerald-50/30 dark:bg-emerald-950/20',
        borderClass: 'border-emerald-200/70 dark:border-emerald-900/50',
        dotColor: 'bg-emerald-500',
        headerAccent: 'text-emerald-800 dark:text-emerald-300',
      },
      {
        id: 'rejected' as SiteTaskStatus,
        titleAr: 'إعادة عمل / مرفوض',
        titleEn: 'Rework / Rejected',
        badgeBg: 'bg-rose-100 dark:bg-rose-950/60',
        badgeText: 'text-rose-800 dark:text-rose-300',
        columnBg: 'bg-rose-50/30 dark:bg-rose-950/20',
        borderClass: 'border-rose-200/70 dark:border-rose-900/50',
        dotColor: 'bg-rose-500',
        headerAccent: 'text-rose-800 dark:text-rose-300',
      },
    ],
    []
  );

  // Group tasks by lane
  const tasksByColumn = useMemo(() => {
    const acc: Record<SiteTaskStatus, SiteTask[]> = {
      pending: [],
      in_progress: [],
      pm_review: [],
      qc_pending: [],
      approved: [],
      rejected: [],
      done: [],
      cancelled: [],
    };
    for (const t of filteredTasks) {
      if (t.status === 'done') {
        acc.approved.push(t);
      } else if (acc[t.status]) {
        acc[t.status].push(t);
      } else {
        acc.pending.push(t);
      }
    }
    return acc;
  }, [filteredTasks]);

  // Apply state transition with optimistic update & audit log
  const applyTaskStatusTransition = async (
    task: SiteTask,
    targetStatus: SiteTaskStatus,
    reason?: string
  ) => {
    const prevTasks = [...tasks];
    setTasks((current) =>
      current.map((t) => (t.id === task.id ? { ...t, status: targetStatus } : t))
    );

    try {
      try {
        await SiteTaskService.transitionTaskState({
          taskId: task.id,
          toState: targetStatus,
          reason:
            reason ||
            (isAr
              ? `تحديث الحالة إلى ${getStatusBadge(targetStatus).label}`
              : `Status transitioned to ${targetStatus}`),
        });
      } catch {
        const { error: dbErr } = await supabase
          .from('pm_site_tasks')
          .update({
            status: targetStatus,
            rejection_reason: reason || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', task.id);
        if (dbErr) throw dbErr;
      }
      toast.success(
        isAr
          ? `تم تحديث حالة المهمة إلى "${getStatusBadge(targetStatus).label}"`
          : `Task status updated to "${targetStatus}"`
      );
      loadData();
    } catch (err: unknown) {
      setTasks(prevTasks);
      toast.error(errMessage(err) || (isAr ? 'فشل تحديث حالة المهمة' : 'Failed to update status'));
    }
  };

  // Drag and drop handlers
  const handleDrop = async (e: React.DragEvent, targetStatus: SiteTaskStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
    setDraggingTaskId(null);
    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    if (task.status === targetStatus || (targetStatus === 'approved' && task.status === 'done')) {
      return;
    }

    if (targetStatus === 'rejected') {
      setRejectModalTask(task);
      setRejectReason('');
      return;
    }

    await applyTaskStatusTransition(task, targetStatus);
  };

  const handleConfirmReject = async () => {
    if (!rejectModalTask) return;
    if (!rejectReason.trim()) {
      toast.error(isAr ? 'الرجاء كتابة سبب إعادة العمل أو الرفض' : 'Please provide rework reason');
      return;
    }
    const task = rejectModalTask;
    const reason = rejectReason.trim();
    setRejectModalTask(null);
    setRejectReason('');
    await applyTaskStatusTransition(task, 'rejected', reason);
  };

  const handleReassign = async () => {
    if (!reassignModal || !newAssigneeId) return;
    try {
      await SiteTaskService.reassignTask({
        taskId: reassignModal.id,
        newStakeholderId: newAssigneeId,
        reason: reassignReason || 'إعادة تعيين من لوحة التحكم',
      });
      toast.success(isAr ? 'تمت إعادة تعيين المسؤول بنجاح' : 'Assignee updated');
      setReassignModal(null);
      setNewAssigneeId('');
      setReassignReason('');
      loadData();
    } catch (err: unknown) {
      toast.error(errMessage(err) || 'فشلت إعادة التعيين');
    }
  };

  const handleReplan = async () => {
    if (!replanModal || !newStartDate || !newFinishDate || !replanReason.trim()) {
      toast.error(isAr ? 'الرجاء تعبئة التواريخ وسبب إعادة الجدولة' : 'All fields and reason required');
      return;
    }
    try {
      await SiteTaskService.replanTask({
        taskId: replanModal.id,
        newPlannedStart: newStartDate,
        newPlannedFinish: newFinishDate,
        reason: replanReason,
      });
      toast.success(isAr ? 'تمت إعادة جدولة المهمة وحفظ سجل التعديل' : 'Task replanned and audited');
      setReplanModal(null);
      setNewStartDate('');
      setNewFinishDate('');
      setReplanReason('');
      loadData();
    } catch (err: unknown) {
      toast.error(errMessage(err) || 'فشلت إعادة الجدولة');
    }
  };

  const handleCreateComponent = async () => {
    if (!newCompCode || !newCompName) {
      toast.error(isAr ? 'كود واسم المكوّن مطلوبان' : 'Code and name required');
      return;
    }
    try {
      await TaskOntologyService.createComponentInstance({
        project_id: projectId,
        code: newCompCode.trim(),
        name_ar: newCompName.trim(),
        component_type: newCompType,
        status: 'active',
      });
      toast.success(isAr ? 'تمت إضافة المكوّن بنجاح' : 'Component instance created');
      setNewCompModal(false);
      setNewCompCode('');
      setNewCompName('');
      loadData();
    } catch (err: unknown) {
      toast.error(errMessage(err) || 'فشل إنشاء المكوّن');
    }
  };

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setTab('tasks_list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              tab === 'tasks_list'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>{isAr ? 'سجل مهام الموقع' : 'Tasks Control'}</span>
            <span className="text-[10px] opacity-70">({tasks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('pm_queue')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              tab === 'pm_queue'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{isAr ? 'مراجعات PM' : 'PM Queue'}</span>
            {tasks.filter((t) => t.status === 'pm_review').length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[9px]">
                {tasks.filter((t) => t.status === 'pm_review').length}
              </span>
            )}
          </button>

          {canSeeQcQueue && (
            <button
              type="button"
              onClick={() => setTab('qc_queue')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                tab === 'qc_queue'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isAr ? 'فحص الجودة WIR' : 'QC Queue'}</span>
              {inspections.filter((i) => i.status === 'pending').length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-blue-500 text-white text-[9px]">
                  {inspections.filter((i) => i.status === 'pending').length}
                </span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => setTab('components')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              tab === 'components'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isAr ? 'المكونات وحزم العمل' : 'Components & WP'}</span>
            <span className="text-[10px] opacity-70">({components.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('exceptions')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              tab === 'exceptions'
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{isAr ? 'الاستثناءات والـ KPIs' : 'Exceptions'}</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('generator')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              tab === 'generator'
                ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>{isAr ? 'توليد المهام القياسية' : 'Generator'}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{isAr ? 'تحديث' : 'Refresh'}</span>
        </button>
      </div>

      {/* ── TAB 1: ALL TASKS LIST / KANBAN ── */}
      {tab === 'tasks_list' && (
        <div className="space-y-3">
          {/* Filters & View Mode Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
              {/* Search */}
              <div className="relative flex-1 min-w-[180px] max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={isAr ? 'بحث في المهام أو الأكواد...' : 'Search tasks or codes...'}
                  aria-label={isAr ? 'بحث في المهام أو الأكواد' : 'Search tasks or codes'}
                  className="w-full ps-8 pe-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label={isAr ? 'تصفية حسب الحالة' : 'Filter by status'}
                className="py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500"
              >
                <option value="all">{isAr ? 'جميع الحالات' : 'All Statuses'}</option>
                <option value="pending">{isAr ? 'قيد الانتظار (Pending)' : 'Pending'}</option>
                <option value="in_progress">{isAr ? 'جاري التنفيذ (In Progress)' : 'In Progress'}</option>
                <option value="pm_review">{isAr ? 'مراجعة PM (PM Review)' : 'PM Review'}</option>
                <option value="qc_pending">{isAr ? 'فحص الجودة (QC WIR)' : 'QC Pending'}</option>
                <option value="approved">{isAr ? 'معتمد (Approved)' : 'Approved'}</option>
                <option value="rejected">{isAr ? 'إعادة عمل (Rework/Rejected)' : 'Rejected'}</option>
              </select>

              {/* Priority Filter */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                aria-label={isAr ? 'تصفية حسب الأولوية' : 'Filter by priority'}
                className="py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500"
              >
                <option value="all">{isAr ? 'كل الأولويات' : 'All Priorities'}</option>
                <option value="urgent">{isAr ? 'عاجل جداً' : 'Urgent'}</option>
                <option value="high">{isAr ? 'أولوية مرتفعة' : 'High'}</option>
                <option value="normal">{isAr ? 'أولوية عادية' : 'Normal'}</option>
                <option value="low">{isAr ? 'أولوية منخفضة' : 'Low'}</option>
              </select>

              {/* Component Filter */}
              {components.length > 0 && (
                <select
                  value={compFilter}
                  onChange={(e) => setCompFilter(e.target.value)}
                  aria-label={isAr ? 'تصفية حسب المكوّن' : 'Filter by component'}
                  className="py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500 max-w-[160px] truncate"
                >
                  <option value="all">{isAr ? 'جميع المكونات' : 'All Components'}</option>
                  {components.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.name_ar}
                    </option>
                  ))}
                </select>
              )}

              {/* Zone Filter */}
              {zones.length > 0 && (
                <select
                  value={zoneFilter}
                  onChange={(e) => setZoneFilter(e.target.value)}
                  aria-label={isAr ? 'تصفية حسب المنطقة' : 'Filter by zone'}
                  className="py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500"
                >
                  <option value="all">{isAr ? 'جميع المناطق' : 'All Zones'}</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name_ar}
                    </option>
                  ))}
                </select>
              )}

              {/* Reset Filters Button */}
              {(search.trim() || statusFilter !== 'all' || priorityFilter !== 'all' || compFilter !== 'all' || zoneFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('all');
                    setPriorityFilter('all');
                    setCompFilter('all');
                    setZoneFilter('all');
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-200/60 dark:bg-slate-700/60 text-xs font-bold transition-colors cursor-pointer"
                  title={isAr ? 'إعادة ضبط كل الفلاتر' : 'Reset all filters'}
                >
                  <FilterX className="w-3.5 h-3.5" />
                  <span>{isAr ? 'مسح' : 'Clear'}</span>
                </button>
              )}
            </div>

            {/* Kanban / Table View Toggle */}
            <div
              role="group"
              aria-label={isAr ? 'تبديل طريقة العرض' : 'View mode toggle'}
              className="flex items-center bg-slate-200/80 dark:bg-slate-700/70 p-0.5 rounded-lg border border-slate-300 dark:border-slate-700 shrink-0"
            >
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                aria-pressed={viewMode === 'kanban'}
                aria-label={isAr ? 'عرض بطاقات الكانبان' : 'Kanban view'}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'kanban'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs ring-1 ring-slate-200 dark:ring-slate-800'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FolderKanban className="w-3.5 h-3.5" />
                <span>{isAr ? 'كانبان' : 'Kanban'}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                aria-pressed={viewMode === 'table'}
                aria-label={isAr ? 'عرض جدول المهام' : 'Table view'}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs ring-1 ring-slate-200 dark:ring-slate-800'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>{isAr ? 'جدول' : 'Table'}</span>
              </button>
            </div>
          </div>

          {/* Loading Skeletons */}
          {loading ? (
            viewMode === 'kanban' ? (
              <div
                role="status"
                aria-live="polite"
                aria-busy="true"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 items-start animate-pulse"
              >
                <div className="sr-only">{isAr ? 'جاري تحميل لوحة المهام...' : 'Loading tasks...'}</div>
                {[1, 2, 3, 4, 5, 6].map((col) => (
                  <div
                    key={col}
                    className="bg-slate-100/60 dark:bg-slate-900/40 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-800 space-y-3 min-h-[340px]"
                  >
                    <div className="flex justify-between items-center px-1">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20" />
                      <div className="h-4 w-6 bg-slate-200 dark:bg-slate-800 rounded-full" />
                    </div>
                    <div className="space-y-2.5">
                      {[1, 2].map((card) => (
                        <div
                          key={card}
                          className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 space-y-2.5"
                        >
                          <div className="flex justify-between">
                            <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                            <div className="h-3 w-12 bg-slate-200 dark:bg-slate-800 rounded-full" />
                          </div>
                          <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
                          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full mt-2" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                role="status"
                aria-live="polite"
                aria-busy="true"
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 animate-pulse"
              >
                <div className="sr-only">{isAr ? 'جاري تحميل جدول المهام...' : 'Loading task table...'}</div>
                {[1, 2, 3, 4, 5, 6].map((r) => (
                  <div key={r} className="h-8 bg-slate-100 dark:bg-slate-800/60 rounded-lg" />
                ))}
              </div>
            )
          ) : filteredTasks.length === 0 ? (
            /* Empty state when filters return nothing */
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <FilterX className="w-6 h-6" aria-hidden="true" />
              </div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {isAr ? 'لا توجد مهام تطابق معايير البحث والتصفية' : 'No tasks match your filters'}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
                {isAr
                  ? 'جرّب تعديل مصطلح البحث، أو تغيير حالة التصفية أو اختيار منطقة أخرى'
                  : 'Try adjusting your search terms, status filters, or selecting a different zone'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                  setPriorityFilter('all');
                  setCompFilter('all');
                  setZoneFilter('all');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>{isAr ? 'إعادة ضبط الفلاتر' : 'Reset filters'}</span>
              </button>
            </div>
          ) : viewMode === 'kanban' ? (
            /* ── KANBAN VIEW ── */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 items-start">
              {kanbanColumns.map((lane) => {
                const columnTasks = tasksByColumn[lane.id] || [];
                const isOver = dragOverColumn === lane.id;
                return (
                  <div
                    key={lane.id}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      if (dragOverColumn !== lane.id) setDragOverColumn(lane.id);
                    }}
                    onDragLeave={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        setDragOverColumn(null);
                      }
                    }}
                    onDrop={(e) => handleDrop(e, lane.id)}
                    className={`rounded-2xl p-3 space-y-3 border transition-all duration-200 flex flex-col ${lane.columnBg} ${lane.borderClass} ${
                      isOver
                        ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900 border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/40 shadow-md'
                        : ''
                    }`}
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${lane.dotColor}`} aria-hidden="true" />
                        <h3 className={`text-xs font-black tracking-tight ${lane.headerAccent}`}>
                          {isAr ? lane.titleAr : lane.titleEn}
                        </h3>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${lane.badgeBg} ${lane.badgeText}`}
                        title={isAr ? `عدد المهام: ${columnTasks.length}` : `Task count: ${columnTasks.length}`}
                      >
                        {columnTasks.length}
                      </span>
                    </div>

                    {/* Column Card List */}
                    <div className="space-y-2.5 flex-1 min-h-[300px]">
                      {columnTasks.length === 0 ? (
                        <div
                          className={`h-full min-h-[200px] border border-dashed rounded-xl flex flex-col items-center justify-center p-4 text-center text-xs transition-colors ${
                            isOver
                              ? 'border-emerald-500 bg-emerald-100/30 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-bold'
                              : 'border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600'
                          }`}
                        >
                          <FolderKanban className="w-5 h-5 mb-1.5 opacity-40" aria-hidden="true" />
                          <span>{isOver ? (isAr ? 'أفلت المهمة هنا للنقل' : 'Drop task here') : (isAr ? 'لا توجد مهام' : 'No tasks')}</span>
                          <span className="text-[10px] opacity-75 mt-0.5">
                            {isOver ? '' : (isAr ? 'اسحب بطاقة إلى هذا العمود' : 'Drag card to this lane')}
                          </span>
                        </div>
                      ) : (
                        columnTasks.map((t) => {
                          const priorityBadge = getPriorityBadge(t.priority);
                          const isDragging = draggingTaskId === t.id;
                          const pct = Number(t.progress_pct) || 0;
                          return (
                            <div
                              key={t.id}
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData('text/plain', t.id);
                                e.dataTransfer.effectAllowed = 'move';
                                setDraggingTaskId(t.id);
                              }}
                              onDragEnd={() => {
                                setDraggingTaskId(null);
                                setDragOverColumn(null);
                              }}
                              onClick={() => setSelectedTask(t)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  setSelectedTask(t);
                                }
                              }}
                              role="button"
                              tabIndex={0}
                              aria-label={`${t.title_ar} - ${lane.titleAr} - ${priorityBadge.label}`}
                              className={`group bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                                isDragging ? 'opacity-40 scale-95 ring-2 ring-emerald-500' : ''
                              }`}
                            >
                              {/* Header: drag handle, code, priority badge */}
                              <div className="flex items-start justify-between gap-1.5">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <div
                                    className="p-0.5 text-slate-300 group-hover:text-slate-600 dark:text-slate-600 dark:group-hover:text-slate-300 cursor-grab active:cursor-grabbing transition-colors"
                                    title={isAr ? 'اسحب المهمة لتغيير حالتها' : 'Drag task to move'}
                                    aria-label={isAr ? 'مقبض السحب' : 'Drag handle'}
                                  >
                                    <GripVertical className="w-3.5 h-3.5" />
                                  </div>
                                  <span className="font-mono font-bold text-[10px] text-slate-400 dark:text-slate-500 truncate">
                                    {t.task_code || `#${t.id.slice(0, 6)}`}
                                  </span>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 ${priorityBadge.classes}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${priorityBadge.dot}`} aria-hidden="true" />
                                  <span>{priorityBadge.label}</span>
                                </span>
                              </div>

                              {/* Title */}
                              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2">
                                {t.title_ar}
                              </h4>

                              {/* Metadata tags in RTL */}
                              <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                                {((t as BoardTask).zone_name || t.zone?.name_ar) && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium truncate max-w-[120px]">
                                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" aria-hidden="true" />
                                    <span className="truncate">{(t as BoardTask).zone_name || t.zone?.name_ar}</span>
                                  </span>
                                )}
                                {((t as BoardTask).assignee_name || t.assignee?.name_ar) && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium truncate max-w-[120px]">
                                    <User className="w-3 h-3 text-slate-400 shrink-0" aria-hidden="true" />
                                    <span className="truncate">{(t as BoardTask).assignee_name || t.assignee?.name_ar}</span>
                                  </span>
                                )}
                                {t.planned_date && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-400 dark:text-slate-500">
                                    <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" aria-hidden="true" />
                                    <span>{t.planned_date}</span>
                                  </span>
                                )}
                              </div>

                              {/* Progress bar */}
                              <div className="space-y-1 pt-0.5">
                                <div className="flex items-center justify-between text-[10px] font-bold">
                                  <span className="text-slate-400 dark:text-slate-500">{isAr ? 'الإنجاز:' : 'Progress:'}</span>
                                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-black">{pct}%</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                                    style={{ width: `${Math.min(pct, 100)}%` }}
                                  />
                                </div>
                              </div>

                              {/* Action buttons footer */}
                              <div
                                className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-1 text-slate-400 dark:text-slate-500"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={() => setSelectedTask(t)}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 p-1 rounded transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 cursor-pointer"
                                  aria-label={isAr ? `عرض تفاصيل ${t.title_ar}` : `View details for ${t.title_ar}`}
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>{isAr ? 'التفاصيل' : 'Details'}</span>
                                </button>

                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setReassignModal(t)}
                                    className="p-1 rounded text-slate-400 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 cursor-pointer"
                                    title={isAr ? 'إعادة تعيين المسؤول' : 'Reassign task'}
                                    aria-label={isAr ? 'إعادة تعيين المسؤول' : 'Reassign task'}
                                  >
                                    <UserPlus className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReplanModal(t);
                                      setNewStartDate(t.planned_date);
                                      setNewFinishDate(t.due_date || t.planned_date);
                                    }}
                                    className="p-1 rounded text-slate-400 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 cursor-pointer"
                                    title={isAr ? 'إعادة الجدولة' : 'Replan schedule'}
                                    aria-label={isAr ? 'إعادة الجدولة' : 'Replan schedule'}
                                  >
                                    <Calendar className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ── TABLE VIEW ── */
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] text-start">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                    <tr>
                      <th className="py-2.5 px-3 text-start">#</th>
                      <th className="py-2.5 px-3 text-start">{isAr ? 'المهمة والكود' : 'Task & Code'}</th>
                      <th className="py-2.5 px-3 text-center">{isAr ? 'الأولوية' : 'Priority'}</th>
                      <th className="py-2.5 px-3 text-start">{isAr ? 'المسؤول' : 'Assignee'}</th>
                      <th className="py-2.5 px-3 text-start">{isAr ? 'المنطقة' : 'Zone'}</th>
                      <th className="py-2.5 px-3 text-center">{isAr ? 'التاريخ المخطط' : 'Planned'}</th>
                      <th className="py-2.5 px-3 text-center">{isAr ? 'الإنجاز' : 'Progress'}</th>
                      <th className="py-2.5 px-3 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                      <th className="py-2.5 px-3 text-end">{isAr ? 'الإجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredTasks.map((t, idx) => {
                      const priorityBadge = getPriorityBadge(t.priority);
                      const statusBadge = getStatusBadge(t.status);
                      return (
                        <tr
                          key={t.id}
                          onClick={() => setSelectedTask(t)}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                        >
                          <td className="py-2.5 px-3 font-mono text-slate-400 dark:text-slate-500">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100 max-w-xs">
                            <div className="truncate">{t.title_ar}</div>
                            <div className="font-mono text-[9px] text-slate-400 dark:text-slate-500 truncate max-w-[200px]">
                              {t.task_code || (t as BoardTask).task_instance_key || `#${t.id.slice(0, 6)}`}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold ${priorityBadge.classes}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${priorityBadge.dot}`} aria-hidden="true" />
                              <span>{priorityBadge.label}</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                            {(t as BoardTask).assignee_name || (isAr ? 'غير محدد' : 'Unassigned')}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">
                            {(t as BoardTask).zone_name || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-600 dark:text-slate-400">
                            {t.planned_date}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {t.progress_pct}%
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${statusBadge.classes}`}>
                              {statusBadge.label}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-end">
                            <div
                              className="flex items-center justify-end gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => setSelectedTask(t)}
                                className="p-1 rounded text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 cursor-pointer"
                                title={isAr ? 'عرض تفاصيل المهمة وسجل التدقيق' : 'View task details & audit log'}
                                aria-label={isAr ? `عرض تفاصيل ${t.title_ar}` : `View details for ${t.title_ar}`}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setReassignModal(t)}
                                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 cursor-pointer"
                                title={isAr ? 'إعادة تعيين المسؤول' : 'Reassign'}
                                aria-label={isAr ? 'إعادة تعيين المسؤول' : 'Reassign'}
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setReplanModal(t);
                                  setNewStartDate(t.planned_date);
                                  setNewFinishDate(t.due_date || t.planned_date);
                                }}
                                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 cursor-pointer"
                                title={isAr ? 'إعادة الجدولة (Replan)' : 'Replan'}
                                aria-label={isAr ? 'إعادة الجدولة' : 'Replan'}
                              >
                                <Calendar className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: PM REVIEW QUEUE ── */}
      {tab === 'pm_queue' && (
        <PMReviewQueue tasks={tasks} projectId={projectId} onRefresh={loadData} />
      )}

      {/* ── TAB 3: QC INSPECTION QUEUE ── */}
      {canSeeQcQueue && tab === 'qc_queue' && (
        <QCInspectionQueue inspections={inspections} projectId={projectId} onRefresh={loadData} />
      )}

      {/* ── TAB 4: COMPONENTS & WORK PACKAGES ── */}
      {tab === 'components' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/60 p-3.5 rounded-xl">
            <div className="flex items-center gap-2.5">
              <Layers className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <div>
                <h3 className="text-xs font-black text-purple-900 dark:text-purple-200">
                  {isAr ? 'مكونات المشروع وحزم العمل (Component Instances & Work Packages)' : 'Component Instances & Scope'}
                </h3>
                <p className="text-[11px] text-purple-700/80 dark:text-purple-400/80">
                  {isAr
                    ? 'تعريف الوحدات المادية المكررة في المشروع (مثل Lagoon 1 و Lagoon 2) لمنع التداخل'
                    : 'Physical component units for multi-instance scope separation'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setNewCompModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              {isAr ? 'إضافة مكوّن جديد' : 'New Component'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {components.map((c) => (
              <div
                key={c.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-2 shadow-sm"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="font-mono text-xs font-black text-purple-600 dark:text-purple-400">
                    {c.code}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {c.component_type}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">{c.name_ar}</h4>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 5: EXCEPTIONS DASHBOARD ── */}
      {tab === 'exceptions' && <TaskExceptionsDashboard projectId={projectId} />}

      {/* ── TAB 6: GENERATOR ── */}
      {tab === 'generator' && <LibraryTaskGenerator />}

      {/* ── Drilldown Side Drawer (Task Events & Details) ── */}
      {selectedTask && (
        <>
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-xs z-40 transition-opacity animate-in fade-in duration-150"
            onClick={() => setSelectedTask(null)}
            aria-hidden="true"
          />

          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-drawer-title"
            className="fixed inset-y-0 end-0 w-80 sm:w-96 bg-white dark:bg-slate-900 border-s border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-5 overflow-y-auto space-y-4 animate-in slide-in-from-end duration-200"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${getStatusBadge(selectedTask.status).classes}`}>
                  {getStatusBadge(selectedTask.status).label}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getPriorityBadge(selectedTask.priority).classes}`}>
                  {getPriorityBadge(selectedTask.priority).label}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                aria-label={isAr ? 'إغلاق تفاصيل المهمة' : 'Close task details drawer'}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 id="task-drawer-title" className="text-sm font-black text-slate-900 dark:text-white leading-relaxed">
                {selectedTask.title_ar}
              </h3>
              {selectedTask.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                  {selectedTask.description}
                </p>
              )}
            </div>

            {/* Quick Status Stage Selector */}
            <div className="space-y-1.5 bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <label htmlFor="drawer-status-select" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                {isAr ? 'تحديث حالة المهمة' : 'Change Status Stage'}
              </label>
              <select
                id="drawer-status-select"
                value={selectedTask.status}
                onChange={async (e) => {
                  const nextStatus = e.target.value as SiteTaskStatus;
                  if (nextStatus === 'rejected') {
                    setRejectModalTask(selectedTask);
                    setRejectReason('');
                    return;
                  }
                  await applyTaskStatusTransition(selectedTask, nextStatus);
                  setSelectedTask((prev) => (prev ? { ...prev, status: nextStatus } : null));
                }}
                aria-label={isAr ? 'تحديث حالة المهمة' : 'Change task status stage'}
                className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
              >
                <option value="pending">{isAr ? 'قيد الانتظار (Pending)' : 'Pending'}</option>
                <option value="in_progress">{isAr ? 'جاري التنفيذ (In Progress)' : 'In Progress'}</option>
                <option value="pm_review">{isAr ? 'مراجعة PM (PM Review)' : 'PM Review'}</option>
                <option value="qc_pending">{isAr ? 'فحص الجودة (QC WIR)' : 'QC Pending'}</option>
                <option value="approved">{isAr ? 'معتمد (Approved)' : 'Approved'}</option>
                <option value="rejected">{isAr ? 'إعادة عمل / مرفوض (Rejected)' : 'Rejected'}</option>
              </select>
            </div>

            {/* Metadata */}
            <div className="bg-slate-50 dark:bg-slate-950/50 rounded-xl p-3 border border-slate-200 dark:border-slate-800 text-xs space-y-2 font-mono">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 dark:text-slate-500 font-sans">{isAr ? 'التاريخ المخطط:' : 'Planned Date:'}</span>
                <strong className="text-slate-800 dark:text-slate-200">{selectedTask.planned_date}</strong>
              </div>
              {selectedTask.due_date && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 dark:text-slate-500 font-sans">{isAr ? 'تاريخ الاستحقاق:' : 'Due Date:'}</span>
                  <strong className="text-slate-800 dark:text-slate-200">{selectedTask.due_date}</strong>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-slate-400 dark:text-slate-500 font-sans">{isAr ? 'نسبة الإنجاز:' : 'Progress:'}</span>
                <strong className="text-emerald-600 dark:text-emerald-400 font-sans font-black">{selectedTask.progress_pct}%</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 dark:text-slate-500 font-sans">{isAr ? 'المسؤول:' : 'Assignee:'}</span>
                <span className="font-sans font-bold text-slate-700 dark:text-slate-300">
                  {selectedTask.assignee_name || (isAr ? 'غير محدد' : 'Unassigned')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 dark:text-slate-500 font-sans">{isAr ? 'المنطقة:' : 'Zone:'}</span>
                <span className="font-sans font-bold text-slate-700 dark:text-slate-300">
                  {selectedTask.zone_name || '—'}
                </span>
              </div>
              {selectedTask.task_instance_key && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px] font-sans">{isAr ? 'معرف النسخة (Instance Key):' : 'Instance Key:'}</span>
                  <span className="text-[10px] break-all text-slate-600 dark:text-slate-300">
                    {selectedTask.task_instance_key}
                  </span>
                </div>
              )}
              {selectedTask.rejection_reason && (
                <div className="pt-2 border-t border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 font-sans">
                  <span className="font-bold text-[10px] block">{isAr ? 'ملاحظات عدم المطابقة والرفض:' : 'Rejection Reason:'}</span>
                  <p className="text-[11px] mt-0.5 leading-relaxed">{selectedTask.rejection_reason}</p>
                </div>
              )}
            </div>

            {/* Quick Drawer Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setReassignModal(selectedTask)}
                className="flex-1 py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                aria-label={isAr ? 'إعادة تعيين مسؤول المهمة' : 'Reassign task owner'}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{isAr ? 'إعادة التعيين' : 'Reassign'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setReplanModal(selectedTask);
                  setNewStartDate(selectedTask.planned_date);
                  setNewFinishDate(selectedTask.due_date || selectedTask.planned_date);
                }}
                className="flex-1 py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                aria-label={isAr ? 'إعادة جدولة تواريخ المهمة' : 'Replan task schedule'}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{isAr ? 'إعادة الجدولة' : 'Replan'}</span>
              </button>
            </div>

            {/* Immutable Audit Events */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span>{isAr ? 'سجل العمليات والتدقيق (Immutable Audit Log)' : 'Audit Events'}</span>
              </h4>

              {loadingEvents ? (
                <div className="py-6 text-center">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-400 dark:text-slate-500" />
                </div>
              ) : taskEvents.length === 0 ? (
                <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                  {isAr ? 'لا توجد أحداث مسجلة بعد' : 'No events logged'}
                </p>
              ) : (
                <div className="space-y-2 border-s-2 border-slate-200 dark:border-slate-800 ps-3">
                  {taskEvents.map((evt) => (
                    <div key={evt.id} className="space-y-0.5 text-xs">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{evt.event_type}</span>
                        <span className="text-slate-400 dark:text-slate-500 font-mono">
                          {new Date(evt.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {evt.reason && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">
                          {evt.reason}
                        </p>
                      )}
                      {evt.actor_name_ar && (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                          بواسطة: {evt.actor_name_ar}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </>
      )}

      {/* ── Reassign Modal ── */}
      {reassignModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              {isAr ? 'إعادة تعيين مسؤول المهمة' : 'Reassign Task Owner'}
            </h3>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                {isAr ? 'المسؤول الجديد' : 'New Assignee'}
              </label>
              <select
                value={newAssigneeId}
                onChange={(e) => setNewAssigneeId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="">{isAr ? 'اختر المسؤول...' : 'Select Assignee...'}</option>
                {stakeholders.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name_ar}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                {isAr ? 'سبب إعادة التعيين (اختياري)' : 'Reason (Optional)'}
              </label>
              <input
                value={reassignReason}
                onChange={(e) => setReassignReason(e.target.value)}
                placeholder={isAr ? 'تغيير النطاق / الإجازات...' : 'Reason for reassignment...'}
                className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setReassignModal(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleReassign}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                {isAr ? 'حفظ التعيين' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Replan Modal ── */}
      {replanModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              {isAr ? 'إعادة جدولة المهمة (Replan Task)' : 'Replan Task Schedule'}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {isAr ? 'تاريخ البداية الجديد' : 'New Start'}
                </label>
                <input
                  type="date"
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {isAr ? 'تاريخ النهاية الجديد' : 'New Finish'}
                </label>
                <input
                  type="date"
                  value={newFinishDate}
                  onChange={(e) => setNewFinishDate(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                {isAr ? 'سبب إعادة الجدولة (إلزامي)*' : 'Reason for Replanning (Required)*'}
              </label>
              <textarea
                rows={2}
                value={replanReason}
                onChange={(e) => setReplanReason(e.target.value)}
                placeholder={isAr ? 'تأخر التوريد / ظروف الطقس...' : 'Reason for schedule change...'}
                className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setReplanModal(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleReplan}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                {isAr ? 'تأكيد التعديل' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Rejection / Rework Modal ── */}
      {rejectModalTask && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-modal-title"
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 id="reject-modal-title" className="text-sm font-black text-slate-900 dark:text-white">
                  {isAr ? 'إعادة عمل أو رفض المهمة' : 'Task Rework / Rejection'}
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  {rejectModalTask.title_ar}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="rework-reason-input" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                {isAr ? 'سبب الرفض أو متطلبات إعادة العمل (إلزامي)*' : 'Rework Reason / Non-conformance (Required)*'}
              </label>
              <textarea
                id="rework-reason-input"
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={isAr ? 'اكتب ملاحظات عدم المطابقة الفنية أو سبب إعادة العمل في الموقع...' : 'Enter non-conformance notes or reasons for rework...'}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setRejectModalTask(null);
                  setRejectReason('');
                }}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
              >
                {isAr ? 'تأكيد الرفض والإرجاع' : 'Confirm Rework'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── New Component Modal ── */}
      {newCompModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              {isAr ? 'إضافة مكوّن مادي للمشروع' : 'New Component Instance'}
            </h3>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                {isAr ? 'كود المكوّن (مثال: LAG-01, PUMP-B)' : 'Code (e.g. LAG-01)'}
              </label>
              <input
                value={newCompCode}
                onChange={(e) => setNewCompCode(e.target.value)}
                placeholder="LAG-01"
                className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                {isAr ? 'اسم المكوّن (مثال: بحيرة رقم 1)' : 'Name (e.g. Lagoon 1)'}
              </label>
              <input
                value={newCompName}
                onChange={(e) => setNewCompName(e.target.value)}
                placeholder="بحيرة رقم 1"
                className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                {isAr ? 'نوع المكوّن' : 'Component Type'}
              </label>
              <select
                value={newCompType}
                onChange={(e) => setNewCompType(e.target.value as ComponentInstanceType)}
                className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              >
                <option value="lagoon_body">جسم بحيرة (Lagoon Body)</option>
                <option value="pump_room">غرفة طلمبات (Pump Room)</option>
                <option value="pump_room_with_tank">غرفة طلمبات مع خزان</option>
                <option value="building">مبنى (Building)</option>
                <option value="infrastructure">بنية تحتية (Infrastructure)</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setNewCompModal(false)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleCreateComponent}
                className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                {isAr ? 'إنشاء المكوّن' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
