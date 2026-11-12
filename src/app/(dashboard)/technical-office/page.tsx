'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  FileSpreadsheet,
  Layers,
  Box,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCw,
  Search,
  Filter,
  Send,
  XCircle,
  FileEdit,
  CircleDot,
  Timer,
  Flame,
  Activity,
  Sparkles,
  Hourglass,
  ExternalLink,
  Eye,
  History,
  User,
  FolderKanban,
  Building2,
  Zap,
  BarChart2,
  FileCheck,
  Check,
  Copy,
  X,
  Droplets,
  Wrench,
  Shield,
  MessageSquare,
  Compass,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/lib/stores/useAuthStore';
import { useProjectStore } from '@/lib/stores/useProjectStore';
import { useUserRoles } from '@/lib/hooks/useUserRoles';
import { useAssignedProjects } from '@/lib/hooks/useAssignedProjects';
import { DeliverablesService } from '@/lib/services/deliverables.service';
import { supabase } from '@/lib/supabase';
import { Project } from '@/types';
import type { Deliverable, DeliverableItem, ConsultantApprovalCode } from '@/types/planning';
import { E1ShopDrawingsTracker } from '@/components/technical-office/E1ShopDrawingsTracker';
import { E2MaterialSubmittalsTracker } from '@/components/technical-office/E2MaterialSubmittalsTracker';
import { TOManagerReviewQueue } from '@/components/technical-office/TOManagerReviewQueue';
import { TOTransmittalGovernanceHub } from '@/components/technical-office/TOTransmittalGovernanceHub';
import { AquaticSafeguardsHub } from '@/components/technical-office/AquaticSafeguardsHub';
import { COOExecutiveRadar } from '@/components/technical-office/COOExecutiveRadar';
import { TOFieldPaperworkHub } from '@/components/technical-office/TOFieldPaperworkHub';
import { TORoleWorkflowGuide } from '@/components/technical-office/TORoleWorkflowGuide';
import { TOInteractiveStepGuide } from '@/components/technical-office/TOInteractiveStepGuide';
import { TOManagerAssignmentPanel } from '@/components/planning/TOManagerAssignmentPanel';
import { HistoryDrawer } from '@/components/planning/HistoryDrawer';

// ── Workflow Status Engine (Unifier / ACC Standard) ─────────────────────────

type WorkflowStatus =
  | 'draft'
  | 'open'
  | 'in_progress'
  | 'blocked'
  | 'under_review'
  | 'approved_internal'
  | 'submitted_to_consultant'
  | 'closed'
  | 'canceled';

type BallInCourt = 'manager' | 'engineer' | 'doc_controller' | 'consultant' | 'none';

function computeWorkflowStatus(item: DeliverableItem): WorkflowStatus {
  if (item.status === 'rejected') return 'canceled';
  if (['A', 'B'].includes(item.consultant_status)) return 'closed';
  if (item.consultant_status === 'D') return 'blocked';
  if (item.consultant_status === 'C') return 'in_progress';
  if (item.status === 'approved') {
    if (['A', 'B'].includes(item.consultant_status)) return 'closed';
    if (item.to_manager_approved) return 'submitted_to_consultant';
    return 'approved_internal';
  }
  if (item.to_manager_approved === true && item.consultant_status === 'pending') {
    return 'submitted_to_consultant';
  }
  if (item.status === 'ready_to_return') return 'under_review';
  if (item.status === 'returned' && (item.progress_pct ?? 0) >= 100) return 'approved_internal';
  if (item.status === 'blocked') return 'blocked';
  if (item.status === 'in_progress') return 'in_progress';
  if (item.assigned_stakeholder_id && item.status === 'received') return 'open';
  if (!item.assigned_stakeholder_id) return 'draft';
  return 'in_progress';
}

function computeBallInCourt(status: WorkflowStatus): BallInCourt {
  switch (status) {
    case 'draft':
    case 'under_review':
      return 'manager';
    case 'approved_internal':
      return 'doc_controller';
    case 'submitted_to_consultant':
      return 'consultant';
    case 'open':
    case 'in_progress':
    case 'blocked':
      return 'engineer';
    default:
      return 'none';
  }
}

function isOverdue(item: DeliverableItem, workflowStatus: WorkflowStatus, dataDate?: string | null): boolean {
  if (workflowStatus === 'closed' || workflowStatus === 'canceled') return false;
  if (!item.due_date) return false;
  const dueStr = item.due_date.slice(0, 10);
  const refDateStr = dataDate ? dataDate.slice(0, 10) : new Date().toLocaleDateString('en-CA');
  return dueStr < refDateStr;
}

// ── Turnaround Timer Engine (14-Day Contractual Review Standard) ────────────

interface TurnaroundTimer {
  stage: 'consultant' | 'manager' | 'engineer' | 'closed';
  allowedDays: number;
  elapsedDays: number;
  remainingDays: number;
  isBreached: boolean;
  isNearBreach: boolean;
  slaPercent: number;
  label: string;
  labelAr: string;
}

function computeTurnaroundTimer(
  item: DeliverableItem,
  workflowStatus: WorkflowStatus,
  ball: BallInCourt
): TurnaroundTimer {
  if (workflowStatus === 'closed' || workflowStatus === 'canceled') {
    return {
      stage: 'closed',
      allowedDays: 14,
      elapsedDays: 0,
      remainingDays: 0,
      isBreached: false,
      isNearBreach: false,
      slaPercent: 100,
      label: 'Closed',
      labelAr: 'مغلق ومكتمل',
    };
  }

  const isConsultant = ball === 'consultant' || workflowStatus === 'submitted_to_consultant';
  const isManager = ball === 'manager' || workflowStatus === 'under_review';
  const stage = isConsultant ? 'consultant' : isManager ? 'manager' : 'engineer';
  const allowedDays = isConsultant ? 14 : isManager ? 3 : 7;

  let startTimestamp: number;
  if (isConsultant && item.to_manager_approved_at) {
    startTimestamp = new Date(item.to_manager_approved_at).getTime();
  } else if (isManager && item.to_manager_reviewed_at) {
    startTimestamp = new Date(item.to_manager_reviewed_at).getTime();
  } else if (item.work_started_at) {
    startTimestamp = new Date(item.work_started_at).getTime();
  } else if (item.assigned_at) {
    startTimestamp = new Date(item.assigned_at).getTime();
  } else if (item.created_at) {
    startTimestamp = new Date(item.created_at).getTime();
  } else if (item.due_date) {
    startTimestamp = new Date(item.due_date).getTime() - allowedDays * 24 * 60 * 60 * 1000;
  } else {
    startTimestamp = Date.now() - 2 * 24 * 60 * 60 * 1000;
  }

  const now = Date.now();
  const elapsedDays = Math.max(0, Math.floor((now - startTimestamp) / (24 * 60 * 60 * 1000)));
  const remainingDays = allowedDays - elapsedDays;
  const isBreached = remainingDays < 0;
  const isNearBreach = !isBreached && remainingDays <= (isConsultant ? 3 : 1);
  const slaPercent = Math.min(100, Math.round((elapsedDays / allowedDays) * 100));

  let label = '';
  let labelAr = '';
  if (isBreached) {
    const overdue = Math.abs(remainingDays);
    label = isConsultant ? `+${overdue}d SLA Breached (Employer Delay)` : `+${overdue}d Overdue`;
    labelAr = isConsultant ? `+${overdue} يوم تجاوز مهلة الاستشاري (حدث مطالبة)` : `+${overdue} يوم متأخر`;
  } else if (isNearBreach) {
    label = `${remainingDays}d left of ${allowedDays}d window`;
    labelAr = `متبقي ${remainingDays} يوم من مهلة ${allowedDays} أيام`;
  } else {
    label = `Day ${elapsedDays}/${allowedDays} (${remainingDays}d remaining)`;
    labelAr = `اليوم ${elapsedDays} من ${allowedDays} (متبقي ${remainingDays} يوم)`;
  }

  return {
    stage,
    allowedDays,
    elapsedDays,
    remainingDays,
    isBreached,
    isNearBreach,
    slaPercent,
    label,
    labelAr,
  };
}

// ── Status & Code Dictionaries ──────────────────────────────────────────────

const WORKFLOW_STATUS_CONFIG: Record<
  WorkflowStatus,
  { label_ar: string; label_en: string; color: string; bg: string; icon: React.ComponentType<{ className?: string }> }
> = {
  draft:                   { label_ar: 'مسودة',              label_en: 'Draft',             color: 'text-slate-600 dark:text-slate-300',   bg: 'bg-slate-100 dark:bg-slate-800',       icon: FileEdit },
  open:                    { label_ar: 'مفتوح للتكليف',       label_en: 'Open',              color: 'text-sky-700 dark:text-sky-300',     bg: 'bg-sky-50 dark:bg-sky-950/70',         icon: CircleDot },
  in_progress:             { label_ar: 'قيد التنفيذ والمطابقة', label_en: 'In Progress',       color: 'text-blue-700 dark:text-blue-300',    bg: 'bg-blue-50 dark:bg-blue-950/70',       icon: RotateCw },
  blocked:                 { label_ar: 'معطل / تعارض فني',    label_en: 'Blocked',           color: 'text-rose-700 dark:text-rose-300',    bg: 'bg-rose-50 dark:bg-rose-950/70',       icon: AlertTriangle },
  under_review:            { label_ar: 'مراجعة مدير المكتب',  label_en: 'Under Review',      color: 'text-amber-700 dark:text-amber-300',   bg: 'bg-amber-50 dark:bg-amber-950/70',     icon: Clock },
  approved_internal:       { label_ar: 'معتمد داخلياً',      label_en: 'Approved (Internal)', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-950/70', icon: CheckCircle2 },
  submitted_to_consultant: { label_ar: 'مرسل للاستشاري',     label_en: 'At Consultant',     color: 'text-violet-700 dark:text-violet-300',  bg: 'bg-violet-50 dark:bg-violet-950/70',   icon: Send },
  closed:                  { label_ar: 'معتمد ومغلق',        label_en: 'Closed',            color: 'text-emerald-800 dark:text-emerald-200', bg: 'bg-emerald-100 dark:bg-emerald-900/60', icon: CheckCircle2 },
  canceled:                { label_ar: 'ملغي / مستبعد',       label_en: 'Canceled',          color: 'text-slate-500 dark:text-slate-400',   bg: 'bg-slate-100 dark:bg-slate-800',       icon: XCircle },
};

const BALL_CONFIG: Record<BallInCourt, { label_ar: string; label_en: string; dot: string; text: string }> = {
  manager:        { label_ar: 'مدير المكتب الفني',  label_en: 'TO Manager',     dot: 'bg-rose-500',  text: 'text-rose-600 dark:text-rose-400' },
  engineer:       { label_ar: 'مهندس الإعداد',      label_en: 'Engineer',       dot: 'bg-blue-500',  text: 'text-blue-600 dark:text-blue-400' },
  doc_controller: { label_ar: 'مراقب الوثائق',      label_en: 'Doc Controller', dot: 'bg-teal-500',  text: 'text-teal-600 dark:text-teal-400' },
  consultant:     { label_ar: 'الاستشاري المشرف',   label_en: 'Consultant',     dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
  none:           { label_ar: '—',                  label_en: '—',              dot: 'bg-slate-300 dark:bg-slate-600', text: 'text-slate-400 dark:text-slate-500' },
};

const CONSULTANT_CODE_CONFIG: Record<
  ConsultantApprovalCode,
  { label_ar: string; label_en: string; badge: string; badge_ar: string; border: string; bg: string; text: string }
> = {
  A: {
    label_ar: 'فئة (أ): معتمد دون ملاحظات',
    label_en: 'Code A: Approved',
    badge: 'Code A',
    badge_ar: 'فئة (أ) • معتمد',
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  B: {
    label_ar: 'فئة (ب): معتمد مع ملاحظات',
    label_en: 'Code B: Approved as Noted',
    badge: 'Code B',
    badge_ar: 'فئة (ب) • بملاحظات',
    border: 'border-sky-500/40',
    bg: 'bg-sky-50 dark:bg-sky-950/50',
    text: 'text-sky-700 dark:text-sky-300',
  },
  C: {
    label_ar: 'فئة (ج): مرفوض لإعادة التقديم',
    label_en: 'Code C: Revise & Resubmit',
    badge: 'Code C',
    badge_ar: 'فئة (ج) • إعادة تقديم',
    border: 'border-amber-500/40',
    bg: 'bg-amber-50 dark:bg-amber-950/50',
    text: 'text-amber-700 dark:text-amber-300',
  },
  D: {
    label_ar: 'فئة (د): مرفوض كلياً',
    label_en: 'Code D: Rejected',
    badge: 'Code D',
    badge_ar: 'فئة (د) • مرفوض',
    border: 'border-rose-500/40',
    bg: 'bg-rose-50 dark:bg-rose-950/50',
    text: 'text-rose-700 dark:text-rose-300',
  },
  pending: {
    label_ar: 'بانتظار رد الاستشاري',
    label_en: 'Under Review',
    badge: 'Pending',
    badge_ar: 'قيد المراجعة',
    border: 'border-violet-500/30',
    bg: 'bg-violet-50 dark:bg-violet-950/40',
    text: 'text-violet-700 dark:text-violet-300',
  },
};

type EnrichedItem = DeliverableItem & {
  refCode: string;
  deliverableTitle: string;
  deliverableKind: string;
  workflowStatus: WorkflowStatus;
  ballInCourt: BallInCourt;
  overdue: boolean;
  criticality: 'critical' | 'near_critical' | 'buffered';
  floatDays: number;
  ballSubtext: string;
  cpmLink: string;
  turnaround: TurnaroundTimer;
};

// Khamsa Briefing helper
function generateKhamsaBriefing(item: EnrichedItem, isAr: boolean): string {
  const dateStr = item.due_date ? item.due_date.slice(0, 10) : isAr ? 'غير محدد' : 'TBD';
  const refCode = item.refCode || 'SUB-01';
  const desc = item.description || item.sheet_number || (isAr ? 'مخرج هندسي' : 'Deliverable');
  const owner =
    (isAr ? item.assigned_stakeholder?.name_ar : item.assigned_stakeholder?.name_en) ||
    item.assigned_stakeholder?.name_ar ||
    item.assigned_stakeholder?.name_en ||
    (isAr ? 'مهندس المكتب الفني' : 'Technical Office Engineer');

  const statusLabel = isAr
    ? WORKFLOW_STATUS_CONFIG[item.workflowStatus].label_ar
    : WORKFLOW_STATUS_CONFIG[item.workflowStatus].label_en;
  const ballLabel = isAr ? BALL_CONFIG[item.ballInCourt].label_ar : BALL_CONFIG[item.ballInCourt].label_en;
  const codeCfg = CONSULTANT_CODE_CONFIG[item.consultant_status] || CONSULTANT_CODE_CONFIG.pending;
  const floatText = isAr
    ? item.floatDays < 0
      ? `${item.floatDays} يوم (حيود زمني سالب)`
      : `+${item.floatDays} يوم سماحية زمنية`
    : item.floatDays < 0
    ? `${item.floatDays}d (Negative Float)`
    : `+${item.floatDays}d Float`;
  const timerText = isAr ? item.turnaround.labelAr : item.turnaround.label;

  if (isAr) {
    return `• الحقيقة: المعاملة [${refCode} - ${desc}] في حالة [${statusLabel}]، قرار الاستشاري [${codeCfg.label_ar}]، وحوزة الإجراء لدى [${ballLabel}]. مؤشر المراجعة: [${timerText}].
• الأثر: النشاط مرتبط بالمسار الزمني [${item.cpmLink}] برصيد مرونة [${floatText}]. ${
      item.turnaround.isBreached
        ? 'حدث تأخير تعاقدي بسبب تجاوز مهلة المراجعة المحددة بـ ١٤ يوماً.'
        : item.overdue
        ? 'تجاوزت التاريخ المستهدف وتستنزف السماحية الزمنية للمشروع.'
        : 'تسير المعاملة ضمن المهلة المحددة لحماية مسار التنفيذ والمستخلصات.'
    }
• الإجراء المطلوب: ${
      item.workflowStatus === 'under_review'
        ? 'اعتماد مدير المكتب الفني وإصدار حافظة التسليم الرسمية للمشروع'
        : item.workflowStatus === 'submitted_to_consultant'
        ? 'متابعة وتوثيق رد الاستشاري قبل إغلاق مهلة المراجعة التعاقدية (١٤ يوماً)'
        : item.workflowStatus === 'blocked'
        ? 'عقد اجتماع تنسيقي فوري لحل التعارض وإصدار طلب استفسار فني'
        : 'إنهاء المخطط التنسيقي ومطابقة المناسيب المعمارية والإنشائية قبل تاريخ الاستحقاق'
    }.
• المسؤول: ${owner}.
• الموعد الحاسم: ${dateStr}.`;
  } else {
    return `• Fact: Submittal [${refCode} - ${desc}] is currently [${statusLabel}], Consultant Code [${item.consultant_status}], ball-in-court with [${ballLabel}]. Review Clock: [${timerText}].
• Impact: Linked to driving path [${item.cpmLink}] with [${floatText}]. ${
      item.turnaround.isBreached
        ? 'SCL Delay Event / Employer Risk identified (exceeded 14-day contractual review window).'
        : item.overdue
        ? 'Past target due date, eroding critical buffer.'
        : 'On track within approved baseline schedule window.'
    }
• Required Action: ${
      item.workflowStatus === 'under_review'
        ? 'TO Manager review & transmittal signoff'
        : item.workflowStatus === 'submitted_to_consultant'
        ? 'Expedite consultant review within contractual 14-day SLA'
        : item.workflowStatus === 'blocked'
        ? 'Resolve interface conflict & issue RFI notice'
        : 'Finalize shop drawing coordination and submittal package'
    }.
• Owner: ${owner}.
• Due Date: ${dateStr}.`;
  }
}

// ── Top Level Role Perspectives & Unified Workspace Tabs ────────────────────
type TORolePerspective = 'all_hubs' | 'engineer' | 'manager' | 'coo';
type TOEngineerSubtab = 'drawings' | 'materials' | 'aquatic' | 'field_paperwork' | 'team_assignment';
type TOManagerSubtab = 'queue' | 'transmittals' | 'register' | 'field_paperwork' | 'team_assignment';
type ActiveWorkspaceTab =
  | 'drawings'
  | 'materials'
  | 'aquatic'
  | 'field_paperwork'
  | 'team_assignment'
  | 'queue'
  | 'transmittals'
  | 'register'
  | 'radar'
  | 'role_guide';

export default function TechnicalOfficePortalPage() {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const { user } = useAuth();
  const { roles, isAdmin } = useUserRoles();
  const { activeProjectId, setActiveProjectId } = useProjectStore();

  // Role resolution
  const isManager = useMemo(() => {
    if (isAdmin) return true;
    return roles.some((r) =>
      [
        'admin',
        'ceo',
        'coo',
        'commercial_manager',
        'planning_manager',
        'project_manager',
        'technical_office_manager',
        'to_manager',
      ].includes(String(r).toLowerCase())
    );
  }, [roles, isAdmin]);

  // Current user stakeholder ID
  const [engineerStakeholderId, setEngineerStakeholderId] = useState<string | null>(null);
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from('stakeholders')
          .select('id')
          .or(`auth_user_id.eq.${user.id},email.ilike.${user.email || ''}`)
          .maybeSingle();

        if (!cancelled && data?.id) {
          setEngineerStakeholderId(data.id);
        }
      } catch (err) {
        console.warn('Could not resolve stakeholder ID:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Assigned Projects
  const { projects = [], isLoading: loadingProjects } = useAssignedProjects({ strictStaffing: true });

  // Two-Way Project Sync State Management
  const [isAllProjectsMode, setIsAllProjectsMode] = useState<boolean>(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => activeProjectId || 'all');
  const [rolePerspective, setRolePerspective] = useState<TORolePerspective>('all_hubs');
  const [engineerSubtab, setEngineerSubtab] = useState<TOEngineerSubtab>('drawings');
  const [managerSubtab, setManagerSubtab] = useState<TOManagerSubtab>('queue');
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<ActiveWorkspaceTab>(isManager ? 'queue' : 'drawings');

  // Support deep-linking via ?tab= query parameter
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab') as ActiveWorkspaceTab | null;
    const validTabs: ActiveWorkspaceTab[] = [
      'drawings',
      'materials',
      'aquatic',
      'field_paperwork',
      'team_assignment',
      'queue',
      'transmittals',
      'register',
      'radar',
      'role_guide',
    ];
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveWorkspaceTab(tabParam);
      setRolePerspective('all_hubs');
    }
  }, []);

  // Sync whenever activeProjectId in useProjectStore changes (from TopNav)
  useEffect(() => {
    if (activeProjectId) {
      setSelectedProjectId(activeProjectId);
      setIsAllProjectsMode(false);
    }
  }, [activeProjectId]);

  // Default to first project if activeProjectId is empty once projects load
  useEffect(() => {
    if (!loadingProjects && !activeProjectId && projects.length > 0 && !isAllProjectsMode) {
      const firstId = projects[0].id;
      setSelectedProjectId(firstId);
      setActiveProjectId(firstId);
    }
  }, [loadingProjects, activeProjectId, projects, isAllProjectsMode, setActiveProjectId]);

  // Unified handler for project selection inside Technical Office page
  const handleProjectChange = (pid: string) => {
    if (pid === 'all') {
      setIsAllProjectsMode(true);
      setSelectedProjectId('all');
    } else {
      setIsAllProjectsMode(false);
      setSelectedProjectId(pid);
      setActiveProjectId(pid);
    }
  };

  // Unified workspace tab navigation helper
  const navigateToWorkspaceTab = (tab: ActiveWorkspaceTab) => {
    setActiveWorkspaceTab(tab);
    if (['drawings', 'materials', 'aquatic', 'field_paperwork', 'team_assignment'].includes(tab)) {
      setEngineerSubtab(tab as TOEngineerSubtab);
    }
    if (['queue', 'transmittals', 'register', 'field_paperwork', 'team_assignment'].includes(tab)) {
      setManagerSubtab(tab as TOManagerSubtab);
    }
    // If current rolePerspective hides the target tab, switch to unified view
    if (
      rolePerspective === 'engineer' &&
      !['drawings', 'materials', 'aquatic', 'field_paperwork', 'team_assignment', 'role_guide'].includes(tab)
    ) {
      setRolePerspective('all_hubs');
    } else if (
      rolePerspective === 'manager' &&
      !['queue', 'transmittals', 'register', 'field_paperwork', 'team_assignment', 'role_guide'].includes(tab)
    ) {
      setRolePerspective('all_hubs');
    } else if (rolePerspective === 'coo' && !['radar', 'role_guide'].includes(tab)) {
      setRolePerspective('all_hubs');
    }
  };

  // Register filters
  const [ballFilter, setBallFilter] = useState<BallInCourt | 'all'>('all');
  const [itemTypeFilter, setItemTypeFilter] = useState<'all' | 'drawing' | 'material'>('all');
  const [statusFilter, setStatusFilter] = useState<WorkflowStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [briefingItem, setBriefingItem] = useState<EnrichedItem | null>(null);
  const [copied, setCopied] = useState(false);
  const [historyItemId, setHistoryItemId] = useState<string | null>(null);
  const [historyItemTitle, setHistoryItemTitle] = useState<string>('');

  // Deliverables query
  const {
    data: deliverables = [],
    isLoading: loadingDeliverables,
    isFetching: fetchingDeliverables,
    refetch,
  } = useQuery<Deliverable[]>({
    queryKey: ['to-command-hub-deliverables', selectedProjectId],
    queryFn: async () => {
      return await DeliverablesService.getDeliverables(
        selectedProjectId === 'all' ? '' : selectedProjectId
      );
    },
    staleTime: 30000,
  });

  const fetchDeliverables = () => {
    refetch();
  };

  const currentProject = useMemo(() => {
    if (!selectedProjectId || selectedProjectId === 'all') return null;
    return projects.find((p) => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  const currentProjectDisplayName = useMemo(() => {
    if (!currentProject) return '';
    return isAr
      ? currentProject.project_name_ar || currentProject.name_ar || currentProject.project_name || ''
      : currentProject.project_name_en || currentProject.name_en || currentProject.project_name || '';
  }, [currentProject, isAr]);

  const currentProjectCode = useMemo(() => {
    if (!currentProject) return '';
    return currentProject.project_code || currentProject.code || '';
  }, [currentProject]);

  // Safe string extraction for Client & Project Manager (prevents React #31 error when client/pm is a relation object)
  const currentProjectClientName = useMemo(() => {
    if (!currentProject) return '';
    const p = currentProject as any;
    if (typeof p.client_name === 'string' && p.client_name.trim()) return p.client_name.trim();
    if (typeof p.client === 'string' && p.client.trim()) return p.client.trim();
    if (p.client && typeof p.client === 'object') {
      const name = isAr
        ? p.client.name_ar || p.client.name_en || p.client.name || ''
        : p.client.name_en || p.client.name_ar || p.client.name || '';
      return typeof name === 'string' ? name.trim() : '';
    }
    return '';
  }, [currentProject, isAr]);

  const currentProjectManagerName = useMemo(() => {
    if (!currentProject) return '';
    const p = currentProject as any;
    const candidates = [
      p.pm_canonical_name,
      isAr ? p.pm_full_name_ar : p.pm_full_name_en,
      p.pm_full_name,
      p.project_manager_name_raw,
      p.manager_name,
      typeof p.project_manager === 'string' ? p.project_manager : null,
      p.project_manager && typeof p.project_manager === 'object'
        ? isAr
          ? p.project_manager.name_ar || p.project_manager.full_name || p.project_manager.name_en
          : p.project_manager.name_en || p.project_manager.full_name || p.project_manager.name_ar
        : null,
    ];
    for (const c of candidates) {
      if (typeof c === 'string' && c.trim()) return c.trim();
    }
    return '';
  }, [currentProject, isAr]);

  // Flatten and enrich submittal items
  const enrichedItems = useMemo(() => {
    const allItems: EnrichedItem[] = [];

    for (const d of deliverables) {
      for (const item of d.items || []) {
        const ws = computeWorkflowStatus(item);
        const bic = computeBallInCourt(ws);
        const overdue = isOverdue(item, ws);
        const turnaround = computeTurnaroundTimer(item, ws, bic);

        let floatDays = 14;
        let criticality: 'critical' | 'near_critical' | 'buffered' = 'buffered';

        if (ws === 'blocked' || item.consultant_status === 'D') {
          criticality = 'critical';
          floatDays = -4;
        } else if (overdue || turnaround.isBreached) {
          criticality = 'critical';
          floatDays = -2;
        } else if (item.due_date) {
          const diffDays = Math.ceil(
            (new Date(item.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          );
          if (diffDays <= 7) {
            criticality = 'near_critical';
            floatDays = Math.max(1, diffDays);
          } else {
            criticality = 'buffered';
            floatDays = diffDays;
          }
        }

        let ballSubtext = '';
        if (bic === 'consultant') {
          ballSubtext = turnaround.isBreached
            ? isAr
              ? `⚠️ تجاوز مهلة الاستشاري (${Math.abs(turnaround.remainingDays)} يوم)`
              : `⚠️ Overdue (${Math.abs(turnaround.remainingDays)}d)`
            : isAr
            ? `مهلة ١٤ يوماً (متبقي ${turnaround.remainingDays} يوم)`
            : `14d Window (${turnaround.remainingDays}d left)`;
        } else if (bic === 'manager') {
          ballSubtext = overdue
            ? isAr
              ? '🔴 تأخر اعتماد داخلي'
              : '🔴 Overdue Sign-off'
            : isAr
            ? 'مراجعة وتوجيه'
            : 'Review & Assign';
        } else if (bic === 'engineer') {
          ballSubtext = overdue
            ? isAr
              ? '🔴 تأخر إعداد المقاول'
              : '🔴 Overdue Preparation'
            : isAr
            ? 'إعداد وتنسيق'
            : 'In Preparation';
        } else if (bic === 'doc_controller') {
          ballSubtext = isAr ? 'إصدار حافظة تسليم رسمية' : 'Issue Transmittal';
        }

        const cpmLink =
          item.linked_activity_id ||
          (item.item_type === 'drawing' ? 'ACT-DWG-CRITICAL' : 'ACT-MAT-PROCUREMENT');

        allItems.push({
          ...item,
          refCode: d.ref_code || d.id.slice(0, 8),
          deliverableTitle: (isAr ? d.title_ar : d.title_en) || d.title_ar || d.ref_code || '',
          deliverableKind: d.kind || 'E1',
          workflowStatus: ws,
          ballInCourt: bic,
          overdue,
          criticality,
          floatDays,
          ballSubtext,
          cpmLink,
          turnaround,
        });
      }
    }

    return allItems;
  }, [deliverables, isAr]);

  // High-level KPI aggregations
  const totalCount = enrichedItems.length;
  const e1Count = enrichedItems.filter((i) => i.deliverableKind === 'E1' || i.item_type === 'drawing').length;
  const e2Count = enrichedItems.filter((i) => i.deliverableKind === 'E2' || i.item_type === 'material').length;
  const underReviewCount = enrichedItems.filter((i) => i.workflowStatus === 'under_review').length;
  const blockedCount = enrichedItems.filter((i) => i.workflowStatus === 'blocked' || Boolean(i.blocked_reason)).length;
  const closedCount = enrichedItems.filter((i) => i.workflowStatus === 'closed').length;
  const approvalRate = totalCount > 0 ? ((closedCount / totalCount) * 100).toFixed(1) : '0';

  const breachedConsultantCount = useMemo(() => {
    return enrichedItems.filter(
      (i) => (i.workflowStatus === 'submitted_to_consultant' || i.ballInCourt === 'consultant') && i.turnaround.isBreached
    ).length;
  }, [enrichedItems]);

  // Ball counts
  const ballCounts = useMemo(() => {
    const counts: Record<BallInCourt, number> = { manager: 0, engineer: 0, doc_controller: 0, consultant: 0, none: 0 };
    for (const item of enrichedItems) {
      counts[item.ballInCourt]++;
    }
    return counts;
  }, [enrichedItems]);

  // Filtered submittals for the register tab
  const filteredRegisterItems = useMemo(() => {
    let items = enrichedItems;
    if (ballFilter !== 'all') {
      items = items.filter((i) => i.ballInCourt === ballFilter);
    }
    if (itemTypeFilter !== 'all') {
      items = items.filter((i) => i.item_type === itemTypeFilter);
    }
    if (statusFilter !== 'all') {
      items = items.filter((i) => i.workflowStatus === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(
        (i) =>
          i.refCode.toLowerCase().includes(q) ||
          (i.sheet_number && i.sheet_number.toLowerCase().includes(q)) ||
          (i.description && i.description.toLowerCase().includes(q)) ||
          (i.deliverableTitle && i.deliverableTitle.toLowerCase().includes(q)) ||
          (i.assigned_stakeholder?.name_ar && i.assigned_stakeholder.name_ar.toLowerCase().includes(q))
      );
    }
    return items;
  }, [enrichedItems, ballFilter, itemTypeFilter, statusFilter, searchQuery]);

  const activeProjectResolvedId = selectedProjectId === 'all' ? (projects[0]?.id || '') : selectedProjectId;

  // Workspace tabs definition for unified & role-filtered navigation
  const workspaceTabs = useMemo(
    () => [
      {
        id: 'drawings' as ActiveWorkspaceTab,
        label: isAr ? 'مخططات الورشة واللوحات التنفيذية' : 'Shop Drawings & Coordination',
        icon: Layers,
        count: e1Count,
        roles: ['all_hubs', 'engineer'] as TORolePerspective[],
        activeClass: 'bg-teal-600 text-white shadow-sm border-teal-500 font-black',
      },
      {
        id: 'materials' as ActiveWorkspaceTab,
        label: isAr ? 'اعتمادات الخامات والموردين' : 'Material & Vendor Approvals',
        icon: Box,
        count: e2Count,
        roles: ['all_hubs', 'engineer'] as TORolePerspective[],
        activeClass: 'bg-teal-600 text-white shadow-sm border-teal-500 font-black',
      },
      {
        id: 'team_assignment' as ActiveWorkspaceTab,
        label: isAr ? 'توزيع المهام على المهندسين' : 'Engineer Task Assignment',
        icon: FolderKanban,
        roles: ['all_hubs', 'engineer', 'manager'] as TORolePerspective[],
        activeClass: 'bg-purple-600 text-white shadow-sm border-purple-500 font-black',
      },
      {
        id: 'queue' as ActiveWorkspaceTab,
        label: isAr ? 'طابور فحص واعتماد المدير' : 'Manager Review Queue',
        icon: FileCheck,
        count: underReviewCount,
        alert: underReviewCount > 0,
        roles: ['all_hubs', 'manager'] as TORolePerspective[],
        activeClass: 'bg-purple-600 text-white shadow-sm border-purple-500 font-black',
      },
      {
        id: 'transmittals' as ActiveWorkspaceTab,
        label: isAr ? 'حوافظ التسليم وأرشيف الاستشاري' : 'Consultant Transmittals & Archive',
        icon: Timer,
        roles: ['all_hubs', 'manager'] as TORolePerspective[],
        activeClass: 'bg-purple-600 text-white shadow-sm border-purple-500 font-black',
      },
      {
        id: 'aquatic' as ActiveWorkspaceTab,
        label: isAr ? 'الضمانات المائية واختبارات الضغط' : 'Aquatic Safeguards & Pressure Tests',
        icon: Droplets,
        roles: ['all_hubs', 'engineer'] as TORolePerspective[],
        activeClass: 'bg-sky-600 text-white shadow-sm border-sky-500 font-black',
      },
      {
        id: 'field_paperwork' as ActiveWorkspaceTab,
        label: isAr ? 'النماذج الميدانية وبوابة المستخلصات' : 'Field Paperwork & Payment Gate',
        icon: FileSpreadsheet,
        roles: ['all_hubs', 'engineer', 'manager'] as TORolePerspective[],
        activeClass: 'bg-emerald-600 text-white shadow-sm border-emerald-500 font-black',
      },
      {
        id: 'register' as ActiveWorkspaceTab,
        label: isAr ? 'السجل الشامل للمخرجات الهندسية' : 'Master Deliverables Register',
        icon: Layers,
        count: totalCount,
        roles: ['all_hubs', 'manager'] as TORolePerspective[],
        activeClass: 'bg-purple-600 text-white shadow-sm border-purple-500 font-black',
      },
      {
        id: 'radar' as ActiveWorkspaceTab,
        label: isAr ? 'رادار المعوقات التنفيذي' : 'Executive Blockers Radar',
        icon: BarChart2,
        count: blockedCount,
        alert: blockedCount > 0,
        roles: ['all_hubs', 'coo'] as TORolePerspective[],
        activeClass: 'bg-emerald-600 text-white shadow-sm border-emerald-500 font-black',
      },
      {
        id: 'role_guide' as ActiveWorkspaceTab,
        label: isAr ? 'دليل الأدوار والعمل: كل واحد بيعمل إيه وفين؟' : 'Role & Workflow Guide: Who Does What & Where?',
        icon: Compass,
        roles: ['all_hubs', 'engineer', 'manager', 'coo'] as TORolePerspective[],
        activeClass: 'bg-amber-500 text-slate-950 shadow-sm border-amber-400 font-black',
      },
    ],
    [isAr, e1Count, e2Count, underReviewCount, totalCount, blockedCount]
  );

  const visibleWorkspaceTabs = useMemo(() => {
    return workspaceTabs.filter((t) => t.roles.includes(rolePerspective));
  }, [workspaceTabs, rolePerspective]);

  // 5-Stage Engineering Workflow Pipeline steps
  const workflowStages = useMemo(
    () => [
      {
        step: 1,
        title: isAr ? '١. إعداد المخططات والخامات' : '1. Drawings & Materials Prep',
        subtitle: isAr ? `${e1Count} مخطط • ${e2Count} خامة` : `${e1Count} Drawings • ${e2Count} Materials`,
        targetTab: 'drawings' as ActiveWorkspaceTab,
        isActive: ['drawings', 'materials', 'team_assignment'].includes(activeWorkspaceTab),
        icon: Layers,
      },
      {
        step: 2,
        title: isAr ? '٢. فحص واعتماد المدير' : '2. Manager Technical Review',
        subtitle: isAr ? `${underReviewCount} معاملة بانتظار الفحص` : `${underReviewCount} Pending Sign-off`,
        targetTab: 'queue' as ActiveWorkspaceTab,
        isActive: activeWorkspaceTab === 'queue',
        badgeCount: underReviewCount,
        icon: FileCheck,
      },
      {
        step: 3,
        title: isAr ? '٣. حافظة تسليم الاستشاري' : '3. Consultant Transmittal',
        subtitle: isAr ? `${ballCounts.consultant} لدى الاستشاري` : `${ballCounts.consultant} With Consultant`,
        targetTab: 'transmittals' as ActiveWorkspaceTab,
        isActive: ['transmittals', 'register'].includes(activeWorkspaceTab),
        icon: Send,
      },
      {
        step: 4,
        title: isAr ? '٤. الضمانات والفحص الميداني' : '4. Safeguards & Site Inspection',
        subtitle: isAr ? 'اختبارات الضغط والعزل المائي' : 'Hydro-testing & Waterproofing',
        targetTab: 'aquatic' as ActiveWorkspaceTab,
        isActive: activeWorkspaceTab === 'aquatic',
        icon: Droplets,
      },
      {
        step: 5,
        title: isAr ? '٥. بوابة صرف المستخلص المالي' : '5. Financial Certificate Gate',
        subtitle: isAr ? `${closedCount} مخرج معتمد ومكتمل` : `${closedCount} Approved & Closed`,
        targetTab: 'field_paperwork' as ActiveWorkspaceTab,
        isActive: activeWorkspaceTab === 'field_paperwork',
        icon: ShieldCheck,
      },
    ],
    [isAr, e1Count, e2Count, underReviewCount, ballCounts.consultant, closedCount, activeWorkspaceTab]
  );

  return (
    <main
      role="main"
      className="w-full max-w-none space-y-4"
      id="technical-office-main"
    >
      {/* ── 1. Top Executive Command Header (Synced with TopNav) ────────── */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r rtl:bg-gradient-to-l from-slate-900 via-teal-950 to-slate-900 p-5 sm:p-7 text-white shadow-2xl border border-slate-800">
        <div className="absolute -top-24 -end-24 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -start-24 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-bold">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>{isAr ? 'منظومة حوكمة المكتب الفني المتكاملة' : 'Technical Office Command Hub'}</span>
              </span>

              {!isAllProjectsMode && currentProject ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{isAr ? 'مرتبط تلقائياً بشريط المشروع العلوي' : 'Live Synced with Top Project Bar'}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{isAr ? 'وضع العرض المجمّع لكافة المشاريع' : 'Consolidated Multi-Project Mode'}</span>
                </span>
              )}

              {isManager && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-[11px] font-bold">
                  <ShieldCheck className="w-3 h-3" />
                  <span>{isAr ? 'صلاحية اعتماد المكتب الفني' : 'TO Manager Sign-off'}</span>
                </span>
              )}

              <button
                type="button"
                onClick={() => navigateToWorkspaceTab('role_guide')}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>
                  {isAr
                    ? 'دليل الأدوار والعمل: كل واحد بيعمل إيه وفين؟'
                    : 'Role Guide: Who Does What & Where?'}
                </span>
              </button>
            </div>

            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white flex items-center gap-3 flex-wrap">
                {currentProject && !isAllProjectsMode ? (
                  <>
                    {currentProjectCode && (
                      <span className="px-2.5 py-0.5 rounded-xl bg-teal-500/20 border border-teal-400/40 text-teal-300 font-mono text-base sm:text-lg">
                        {currentProjectCode}
                      </span>
                    )}
                    <span>{currentProjectDisplayName}</span>
                  </>
                ) : (
                  <span>
                    {isAr
                      ? 'مركز قيادة المكتب الفني والاعتمادات الهندسية'
                      : 'Technical Office & Engineering Approvals Center'}
                  </span>
                )}
              </h1>

              {currentProject && !isAllProjectsMode && (
                <div className="flex flex-wrap items-center gap-2.5 pt-0.5 text-xs text-slate-300">
                  <span className="text-teal-300 font-bold">
                    {isAr ? 'مركز قيادة المكتب الفني والاعتمادات' : 'Technical Office Command Center'}
                  </span>
                  {currentProjectClientName && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-200">
                      <Building2 className="w-3 h-3 text-teal-400" />
                      <span>
                        {isAr ? 'الجهة المالكة:' : 'Client:'} {currentProjectClientName}
                      </span>
                    </span>
                  )}
                  {currentProjectManagerName && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-200">
                      <User className="w-3 h-3 text-purple-400" />
                      <span>
                        {isAr ? 'مدير المشروع:' : 'Project Manager:'} {currentProjectManagerName}
                      </span>
                    </span>
                  )}
                  {(() => {
                    const p = currentProject as any;
                    const meta = (p.metadata || {}) as Record<string, any>;
                    const baseVal = Number(p.contract_value_egp || p.contract_value || 0);
                    const totalVal = Number(p.total_contract_value || baseVal + Number(p.vos_value || 0));
                    const rawAdvPct =
                      p.advance_payment_pct ??
                      meta.advance_payment?.percentage ??
                      meta.advance_payment_pct ??
                      meta.down_payment_pct;
                    const advPct =
                      meta.advance_payment?.has_advance === false
                        ? 0
                        : Number(rawAdvPct !== undefined && rawAdvPct !== null ? rawAdvPct : 15);
                    const advVal =
                      meta.advance_payment_value && Number(meta.advance_payment_value) > 0
                        ? Number(meta.advance_payment_value)
                        : (baseVal * advPct) / 100;
                    if (totalVal <= 0 && advVal <= 0) return null;
                    const fmtNum = (n: number) =>
                      new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
                    return (
                      <>
                        {totalVal > 0 && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 font-bold">
                            <span>{isAr ? 'إجمالي التعاقد:' : 'Contract:'}</span>
                            <span className="font-mono" dir="ltr">
                              {fmtNum(totalVal)} {isAr ? 'ج.م' : 'EGP'}
                            </span>
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-sky-500/20 border border-sky-400/40 text-sky-200 font-bold">
                          <span>{isAr ? `الدفعة المقدمة (${advPct}%):` : `Advance Payment (${advPct}%):`}</span>
                          <span className="font-mono" dir="ltr">
                            {fmtNum(advVal)} {isAr ? 'ج.م' : 'EGP'}
                          </span>
                        </span>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            <p className="text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed">
              {isAr
                ? 'منصة هندسية موحدة تربط إعداد مخططات الورشة، اعتمادات الخامات والموردين، فحص مدير المكتب الفني، حوافظ تسليم الاستشاري، والضمانات الميدانية ببوابة صرف المستخلصات المالية.'
                : 'A unified engineering workspace connecting shop drawings, material approvals, manager review queues, consultant transmittals, and site safeguards directly to IPC financial certificates.'}
            </p>
          </div>

          {/* Scope Toggle Pill Bar & Synced Project Quick-Switcher */}
          <div className="flex flex-col sm:flex-row xl:flex-col items-stretch sm:items-center xl:items-end gap-3 shrink-0">
            {/* Scope Toggle Pill Bar (نطاق العرض) */}
            <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-slate-950/70 border border-slate-800">
              <span className="px-2.5 text-[11px] font-bold text-slate-400">
                {isAr ? 'نطاق العرض:' : 'Scope:'}
              </span>
              <button
                type="button"
                onClick={() => {
                  const targetId = activeProjectId || projects[0]?.id || 'all';
                  handleProjectChange(targetId);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  !isAllProjectsMode && selectedProjectId !== 'all'
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-600/25'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                {isAr ? 'المشروع النشط حالياً' : 'Active Project'}
              </button>
              <button
                type="button"
                onClick={() => handleProjectChange('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isAllProjectsMode || selectedProjectId === 'all'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 font-black'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                {isAr ? 'عرض مجمّع لكافة المشاريع' : 'All Projects View'}
              </button>
            </div>

            {/* Sleek Project Quick-Switcher Pill + Refresh Button */}
            <div className="flex items-center gap-2.5">
              <div className="relative min-w-[240px] sm:min-w-[270px]">
                <label htmlFor="to-master-project-select" className="sr-only">
                  {isAr ? 'تبديل المشروع السريع' : 'Quick Switch Project'}
                </label>
                {loadingProjects ? (
                  <div className="h-10 w-full rounded-xl bg-slate-800/80 animate-pulse border border-slate-700" />
                ) : (
                  <select
                    id="to-master-project-select"
                    value={selectedProjectId}
                    onChange={(e) => handleProjectChange(e.target.value)}
                    className="w-full h-10 px-3.5 py-1.5 bg-slate-900/90 border border-slate-700 hover:border-teal-500/50 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer transition-colors"
                  >
                    <option value="all" className="bg-slate-900 text-white font-bold">
                      {isAr ? '✦ عرض مجمّع لكافة المشاريع النشطة' : '✦ All Active Projects (Consolidated)'}
                    </option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                        {p.project_code || p.code ? `[${p.project_code || p.code}] ` : ''}
                        {isAr ? p.project_name_ar || p.project_name || p.name_ar : p.project_name_en || p.name_en || p.project_name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <button
                type="button"
                onClick={() => refetch()}
                disabled={fetchingDeliverables}
                title={isAr ? 'تحديث البيانات' : 'Refresh Data'}
                className="h-10 px-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
              >
                <RotateCw className={`w-4 h-4 ${fetchingDeliverables ? 'animate-spin text-teal-400' : ''}`} />
                <span className="hidden sm:inline">{isAr ? 'تحديث' : 'Refresh'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── 2. Interactive 5-Stage Engineering Workflow Pipeline Bar ─────── */}
      <section
        aria-label={isAr ? 'شريط مسار العمل الهندسي' : 'Engineering Workflow Pipeline'}
        className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5"
      >
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <h2 className="text-xs font-black text-slate-800 dark:text-slate-100">
              {isAr
                ? 'شريط مسار العمل الهندسي (٥ مراحل مترابطة — اضغط على أي مرحلة للانتقال المباشر)'
                : 'Engineering Workflow Pipeline (5 Connected Stages — Click any stage to jump)'}
            </h2>
          </div>
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hidden md:inline">
            {isAr
              ? 'من إعداد اللوحات والخامات حتى صرف المستخلص المالي'
              : 'From Shop Drawings & Materials to Financial Certificate Release'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {workflowStages.map((stage) => {
            const StageIcon = stage.icon;
            return (
              <button
                key={stage.step}
                type="button"
                onClick={() => navigateToWorkspaceTab(stage.targetTab)}
                className={`group text-start p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2 ${
                  stage.isActive
                    ? 'bg-teal-50/90 dark:bg-teal-950/50 border-teal-500 dark:border-teal-500/80 shadow-sm ring-1 ring-teal-500/30'
                    : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-700 hover:bg-white dark:hover:bg-slate-800'
                }`}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`p-1.5 rounded-lg transition-colors ${
                        stage.isActive
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-teal-500/20 group-hover:text-teal-600 dark:group-hover:bg-teal-950/40 dark:group-hover:text-teal-400'
                      }`}
                    >
                      <StageIcon className="w-3.5 h-3.5" />
                    </span>
                    <span
                      className={`text-xs font-black truncate ${
                        stage.isActive
                          ? 'text-teal-900 dark:text-teal-200'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {stage.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold ps-8 truncate">
                    {stage.subtitle}
                  </p>
                </div>

                {stage.badgeCount !== undefined && stage.badgeCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-amber-400 text-slate-950 shrink-0">
                    {stage.badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── 3. High-Density Operational KPI Strip (Pure Arabic Terms) ───── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Metric 1: Total Submittals */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>{isAr ? 'إجمالي المخرجات والمعاملات' : 'Total Deliverables'}</span>
            <FileSpreadsheet className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          </div>
          <p className="text-2xl font-mono font-black text-slate-900 dark:text-white">{totalCount}</p>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
            {isAr ? `مخططات: ${e1Count} | خامات: ${e2Count}` : `Drawings: ${e1Count} | Materials: ${e2Count}`}
          </div>
        </div>

        {/* Metric 2: Under Review */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400">
            <span>{isAr ? 'بانتظار اعتماد المدير' : 'Pending Manager Sign-off'}</span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-2xl font-mono font-black text-amber-600 dark:text-amber-400">{underReviewCount}</p>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
            {isAr ? 'جاهزة لإصدار حافظة التسليم' : 'Ready for transmittal'}
          </div>
        </div>

        {/* Metric 3: Active Preparation */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
            <span>{isAr ? 'قيد إعداد المهندسين' : 'In Preparation'}</span>
            <RotateCw className="w-4 h-4" />
          </div>
          <p className="text-2xl font-mono font-black text-blue-600 dark:text-blue-400">{ballCounts.engineer}</p>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
            {isAr ? 'على طاولات الرسم والتنسيق' : 'Drafting in progress'}
          </div>
        </div>

        {/* Metric 4: Consultant Breached Window */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-rose-600 dark:text-rose-400">
            <span>{isAr ? 'تجاوز مهلة المراجعة (١٤ يوماً)' : 'Review Window Breached (>14d)'}</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <p className="text-2xl font-mono font-black text-rose-600 dark:text-rose-400">{breachedConsultantCount}</p>
          <div className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">
            {breachedConsultantCount > 0
              ? isAr
                ? 'مستند إثبات تأخير تعاقدي'
                : 'Claimable Delay Basis'
              : isAr
              ? 'ضمن المهلة التعاقدية'
              : 'Zero Breaches'}
          </div>
        </div>

        {/* Metric 5: Blocked & Conflicts */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-rose-700 dark:text-rose-300">
            <span>{isAr ? 'عوائق فنية وتعارضات' : 'Technical Blockers'}</span>
            <Flame className="w-4 h-4 text-rose-500 dark:text-rose-400" />
          </div>
          <p className="text-2xl font-mono font-black text-rose-700 dark:text-rose-300">{blockedCount}</p>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
            {isAr ? 'تتطلب استفساراً فنياً وتنسيقاً' : 'Needs RFI / Escalation'}
          </div>
        </div>

        {/* Metric 6: Approved & Closed */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <span>{isAr ? 'نسبة الاعتماد النهائي' : 'Closure Rate'}</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-2xl font-mono font-black text-emerald-600 dark:text-emerald-400">{approvalRate}%</p>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
            {closedCount} {isAr ? 'معتمد ومغلق نهائياً' : 'Approved'}
          </div>
        </div>
      </div>

      {/* ── 4. Role Perspective Filter Bar & Unified Workspace Tabs ──────── */}
      <div className="space-y-3">
        {/* Perspective Filter Pills */}
        <div
          className="p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3"
          role="region"
          aria-label={isAr ? 'تحديد منظور العمل' : 'Select workspace perspective'}
        >
          <div className="flex flex-wrap items-center gap-2 p-1">
            {/* Perspective 0: All Unified Hubs */}
            <button
              type="button"
              onClick={() => setRolePerspective('all_hubs')}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                rolePerspective === 'all_hubs'
                  ? 'bg-slate-900 dark:bg-teal-600 text-white shadow-sm font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <FolderKanban className="w-4 h-4" />
              <span>{isAr ? 'عرض جميع الأقسام الموحدة' : 'All Unified Workspaces'}</span>
            </button>

            {/* Perspective 1: Engineer */}
            <button
              type="button"
              onClick={() => {
                setRolePerspective('engineer');
                if (!['drawings', 'materials', 'aquatic', 'field_paperwork', 'team_assignment'].includes(activeWorkspaceTab)) {
                  setActiveWorkspaceTab(engineerSubtab);
                }
              }}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                rolePerspective === 'engineer'
                  ? 'bg-teal-600 text-white shadow-sm font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>{isAr ? 'بيئة عمل المهندس' : 'Engineer Workbench'}</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-slate-900/20 dark:bg-slate-100/20 text-current">
                {totalCount}
              </span>
            </button>

            {/* Perspective 2: Manager */}
            <button
              type="button"
              onClick={() => {
                setRolePerspective('manager');
                if (!['queue', 'transmittals', 'register', 'field_paperwork', 'team_assignment'].includes(activeWorkspaceTab)) {
                  setActiveWorkspaceTab(managerSubtab);
                }
              }}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                rolePerspective === 'manager'
                  ? 'bg-purple-600 text-white shadow-sm font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>{isAr ? 'قيادة مدير المكتب الفني' : 'TO Manager Command'}</span>
              {underReviewCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-400 text-slate-950 font-black animate-pulse">
                  {underReviewCount}
                </span>
              )}
            </button>

            {/* Perspective 3: Executive Radar */}
            <button
              type="button"
              onClick={() => {
                setRolePerspective('coo');
                setActiveWorkspaceTab('radar');
              }}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                rolePerspective === 'coo'
                  ? 'bg-emerald-600 text-white shadow-sm font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              <span>{isAr ? 'رادار الإدارة العليا' : 'Executive Radar'}</span>
              {blockedCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-rose-500 text-white font-bold">
                  {blockedCount} {isAr ? 'عائق' : 'blockers'}
                </span>
              )}
            </button>
          </div>

          {/* Dedicated Full-Screen Views Links */}
          <div className="flex items-center gap-2 border-t lg:border-t-0 lg:border-s border-slate-200 dark:border-slate-800 pt-2 lg:pt-0 lg:ps-3 shrink-0">
            <Link
              href="/to-tasks"
              className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
            >
              <span>{isAr ? 'صفحة المهام الكاملة' : 'Full Tasks View'}</span>
              <ExternalLink className="w-3 h-3 rtl:-scale-x-100" />
            </Link>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <Link
              href="/to-dashboard"
              className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
            >
              <span>{isAr ? 'لوحة المدير الكاملة' : 'Full Manager View'}</span>
              <ExternalLink className="w-3 h-3 rtl:-scale-x-100" />
            </Link>
          </div>
        </div>

        {/* Unified Workspace Navigation Bar */}
        <div
          role="tablist"
          aria-label={isAr ? 'أقسام المكتب الفني' : 'Technical Office Workspaces'}
          className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700"
        >
          {visibleWorkspaceTabs.map((tab) => {
            const TabIcon = tab.icon;
            const isTabActive = activeWorkspaceTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isTabActive}
                type="button"
                onClick={() => navigateToWorkspaceTab(tab.id)}
                className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer border ${
                  isTabActive
                    ? tab.activeClass
                    : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-slate-900/60'
                }`}
              >
                <TabIcon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      isTabActive
                        ? 'bg-white/20 dark:bg-slate-950/30 text-white'
                        : tab.alert
                        ? 'bg-amber-400 text-slate-950 font-black'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 5. Active Workspace Content ─────────────────────────────────── */}
      <section className="space-y-4 animate-in fade-in duration-150">
        <TOInteractiveStepGuide
          activeTab={activeWorkspaceTab}
          onNavigateTab={(tab) => navigateToWorkspaceTab(tab as ActiveWorkspaceTab)}
          pageContext="portal"
        />

        {activeWorkspaceTab === 'drawings' && (
          <E1ShopDrawingsTracker
            projectId={activeProjectResolvedId}
            deliverables={deliverables}
            isLoading={loadingDeliverables}
            onRefresh={refetch}
            engineerStakeholderId={engineerStakeholderId}
            isManager={isManager}
          />
        )}

        {activeWorkspaceTab === 'materials' && (
          <E2MaterialSubmittalsTracker
            projectId={activeProjectResolvedId}
            deliverables={deliverables}
            isLoading={loadingDeliverables}
            onRefresh={refetch}
            engineerStakeholderId={engineerStakeholderId}
            isManager={isManager}
          />
        )}

        {activeWorkspaceTab === 'aquatic' && (
          <AquaticSafeguardsHub
            {...({
              projectId: selectedProjectId,
              projectName: currentProjectDisplayName || undefined,
            } as any)}
          />
        )}

        {activeWorkspaceTab === 'field_paperwork' && (
          <TOFieldPaperworkHub
            selectedProjectId={selectedProjectId}
            projectName={currentProjectDisplayName || undefined}
            deliverables={deliverables}
            onRefresh={fetchDeliverables}
          />
        )}

        {activeWorkspaceTab === 'team_assignment' &&
          (selectedProjectId === 'all' ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <Building2 className="w-8 h-8 text-purple-500 mx-auto" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {isAr
                  ? 'يرجى اختيار مشروع محدد من محول المشاريع في الأعلى لتوزيع المهام على المهندسين'
                  : 'Please select a specific project from the top switcher to assign tasks to engineers'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr
                  ? 'اختر المشروع من شريط المشروع العلوي أو من محول المشاريع السريع لعرض حزم العمل وتكليف مهندسي المكتب الفني بها.'
                  : 'Select a project from the top bar or quick-switcher to view work packages and assign Technical Office engineers.'}
              </p>
            </div>
          ) : (
            <TOManagerAssignmentPanel
              projectId={selectedProjectId}
              projectName={currentProjectDisplayName || undefined}
              onAssignmentComplete={fetchDeliverables}
            />
          ))}

        {activeWorkspaceTab === 'queue' && (
          <TOManagerReviewQueue deliverables={deliverables} onRefresh={refetch} />
        )}

        {activeWorkspaceTab === 'transmittals' && (
          <TOTransmittalGovernanceHub
            deliverables={deliverables}
            projects={projects}
            onRefresh={refetch}
            selectedProjectId={selectedProjectId === 'all' ? undefined : selectedProjectId}
          />
        )}

        {activeWorkspaceTab === 'register' && (
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-0">
            {/* Toolbar */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-500" />
                    <span>{isAr ? 'السجل الشامل للمخرجات الهندسية والاعتمادات' : 'Master Deliverables & Submittals Register'}</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {isAr
                      ? 'متابعة تفصيلية للمخططات التنفيذية، اعتمادات الخامات، قرارات الاستشاري، والمهل التعاقدية للمراجعة'
                      : 'Detailed tracking of shop drawings, material submittals, consultant approval codes, and review windows'}
                  </p>
                </div>

                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 self-start md:self-auto">
                  {filteredRegisterItems.length} {isAr ? 'معاملة معروضة' : 'items shown'}
                </span>
              </div>

              {/* Search & Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-1">
                <div className="lg:col-span-5 relative">
                  <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isAr ? 'بحث برقم المرجع، اللوحة، الوصف، أو المهندس...' : 'Search ref code, sheet #, description, engineer...'}
                    className="w-full h-9.5 ps-9 pe-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="lg:col-span-3">
                  <select
                    value={itemTypeFilter}
                    onChange={(e) => setItemTypeFilter(e.target.value as 'all' | 'drawing' | 'material')}
                    className="w-full h-9.5 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  >
                    <option value="all">{isAr ? 'كافة الأنواع (مخططات وخامات)' : 'All Types'}</option>
                    <option value="drawing">{isAr ? '📐 مخططات الورشة واللوحات التنفيذية' : '📐 Shop Drawings'}</option>
                    <option value="material">{isAr ? '🧱 اعتمادات الخامات والموردين' : '🧱 Material Submittals'}</option>
                  </select>
                </div>

                <div className="lg:col-span-4">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as WorkflowStatus | 'all')}
                    className="w-full h-9.5 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  >
                    <option value="all">{isAr ? 'كافة حالات سير العمل' : 'All Workflow Statuses'}</option>
                    <option value="under_review">{isAr ? 'بانتظار مراجعة واعتماد المدير' : 'Under Review'}</option>
                    <option value="submitted_to_consultant">{isAr ? 'مرسل للاستشاري للمراجعة' : 'At Consultant'}</option>
                    <option value="in_progress">{isAr ? 'قيد التنفيذ والمطابقة' : 'In Progress'}</option>
                    <option value="blocked">{isAr ? 'معطل / تعارض فني' : 'Blocked'}</option>
                    <option value="closed">{isAr ? 'معتمد ومغلق نهائياً' : 'Closed / Approved'}</option>
                    <option value="open">{isAr ? 'مفتوح للتكليف' : 'Open'}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                    <th className="px-4 py-3 text-start whitespace-nowrap">{isAr ? 'المرجع والنوع' : 'Ref & Type'}</th>
                    <th className="px-4 py-3 text-start whitespace-nowrap">{isAr ? 'رقم اللوحة / الحزمة' : 'Sheet / Package'}</th>
                    <th className="px-4 py-3 text-start min-w-[200px]">{isAr ? 'الوصف والعنوان' : 'Description'}</th>
                    <th className="px-4 py-3 text-start whitespace-nowrap">{isAr ? 'حالة سير العمل' : 'Workflow Status'}</th>
                    <th className="px-4 py-3 text-start whitespace-nowrap">{isAr ? 'قرار الاستشاري' : 'Consultant Code'}</th>
                    <th className="px-4 py-3 text-start whitespace-nowrap">{isAr ? 'حوزة الإجراء' : 'Ball-in-Court'}</th>
                    <th className="px-4 py-3 text-start whitespace-nowrap">{isAr ? 'السماحية الزمنية' : 'Float'}</th>
                    <th className="px-4 py-3 text-center whitespace-nowrap">{isAr ? 'السجل' : 'History'}</th>
                    <th className="px-4 py-3 text-center whitespace-nowrap">{isAr ? 'موجز خمسة' : 'Khamsa'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredRegisterItems.map((item) => {
                    const wsCfg = WORKFLOW_STATUS_CONFIG[item.workflowStatus];
                    const ballCfg = BALL_CONFIG[item.ballInCourt];
                    const codeCfg = CONSULTANT_CODE_CONFIG[item.consultant_status] || CONSULTANT_CODE_CONFIG.pending;
                    const StatusIcon = wsCfg.icon;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap font-mono font-bold text-slate-900 dark:text-white">
                          {item.refCode}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-mono font-bold text-slate-800 dark:text-slate-200" dir="ltr">
                          {item.sheet_number || (isAr ? 'غير محدد' : 'N/A')}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{item.description}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">{item.deliverableTitle}</p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${wsCfg.bg} ${wsCfg.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            <span>{isAr ? wsCfg.label_ar : wsCfg.label_en}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${codeCfg.border} ${codeCfg.bg} ${codeCfg.text}`}>
                            {isAr ? codeCfg.badge_ar : codeCfg.badge}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${ballCfg.dot}`} />
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {isAr ? ballCfg.label_ar : ballCfg.label_en}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-mono font-bold">
                          <span className={item.floatDays < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                            {isAr ? `${item.floatDays} يوم` : `${item.floatDays}d`}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setHistoryItemId(item.id);
                              setHistoryItemTitle(`${item.sheet_number || ''} - ${item.description || ''}`);
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                            title={isAr ? 'سجل الأحداث' : 'Audit Log'}
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setBriefingItem(item)}
                            className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 transition-colors cursor-pointer"
                            title={isAr ? 'موجز خمسة في ٦٠ ثانية' : 'Khamsa 60s Briefing'}
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeWorkspaceTab === 'radar' && (
          <COOExecutiveRadar
            deliverables={deliverables}
            projects={projects}
            onRefresh={refetch}
            selectedProjectId={selectedProjectId === 'all' ? undefined : selectedProjectId}
            onSelectProject={(pid) => handleProjectChange(pid)}
          />
        )}

        {activeWorkspaceTab === 'role_guide' && (
          <TORoleWorkflowGuide
            onSelectWorkspaceTab={(tab) => navigateToWorkspaceTab(tab as ActiveWorkspaceTab)}
          />
        )}
      </section>

      {/* ── Khamsa 60-Second Briefing Modal ─────────────────────────────── */}
      {briefingItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {isAr ? 'موجز خمسة التشغيلي (خلاصة تنفيذية في ٦٠ ثانية)' : 'Khamsa 60s Briefing'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    {briefingItem.refCode} • {briefingItem.sheet_number}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBriefingItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs leading-relaxed font-mono whitespace-pre-wrap text-slate-800 dark:text-slate-200">
              {generateKhamsaBriefing(briefingItem, isAr)}
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(generateKhamsaBriefing(briefingItem, isAr));
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 transition flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ الموجز' : 'Copy Briefing')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sequential Event History & Audit Log Drawer ────────────────── */}
      <HistoryDrawer
        isOpen={Boolean(historyItemId)}
        onClose={() => setHistoryItemId(null)}
        entityId={historyItemId}
        entityTitle={historyItemTitle}
        mode="deliverable"
      />
    </main>
  );
}
