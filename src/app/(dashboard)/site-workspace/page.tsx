'use client';

/**
 * Site Workspace — مساحة عمل مهندس الموقع (v3 — Mobile-First + Field Hardened)
 * --------------------------------------------------------------------------
 *   1. Site engineer mobile-first responsive layout with offline cache indicator & sync state.
 *   2. Fast log submission button & quick photo capture affordance with native camera integration.
 *   3. Accessible touch target sizes (minimum 44x44px throughout) & outdoor daylight high-contrast mode.
 *   4. Full skeleton screen loading states, soft background re-fetch, and double-submit prevention.
 *   5. Full parity with Kanban, Excel Grid, Cards, QC Receivables, Rejection Rework, and Quick Dials.
 *
 * Backend: pm_site_tasks (migration 017) + SiteTaskService + DailyProgressService + DeliverablesService
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  HardHat, CalendarDays, Clock, AlertTriangle, PlayCircle, UploadCloud,
  RefreshCw, ChevronDown, ChevronRight, ChevronLeft, ClipboardCheck, MapPin,
  Loader2, XCircle, CheckCircle2, X, Save, Search, Filter,
  BarChart3, TrendingUp, ListChecks, AlertCircle, Kanban, Table, LayoutGrid,
  Sun, Users, Camera, ShieldAlert, FileSpreadsheet, FileSignature, CheckSquare,
  Compass, ArrowUpRight, Wifi, WifiOff, Sparkles, Image as ImageIcon, Zap, Building2
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/stores/useAuthStore';
import { useUserRoles } from '@/lib/hooks/useUserRoles';
import { supabase } from '@/lib/supabase';
import {
  SiteTaskService,
  groupSiteTasksByDate,
  buildZoneTree,
  type SiteTask,
  type SiteTaskStatus,
  type SiteTaskZone,
  type ZoneTreeNode,
} from '@/lib/services/siteTask.service';
import { DailyProgressForm } from '@/components/planning/DailyProgressForm';
import { SiteWorkspaceKanban } from '@/components/planning/SiteWorkspaceKanban';
import { SiteWorkspaceFastGrid } from '@/components/planning/SiteWorkspaceFastGrid';
import { DailyProgressWizardModal } from '@/components/planning/DailyProgressWizardModal';
import { DailyObstructionModal } from '@/components/planning/DailyObstructionModal';
import { DailyProgressService } from '@/lib/services/dailyProgress.service';
import { DeliverablesService } from '@/lib/services/deliverables.service';
import { ProjectService } from '@/lib/services/project.service';
import { DailyProgress } from '@/types/planning';
import { useProjectStore } from '@/lib/stores/useProjectStore';
import { useLanguage } from '@/contexts/LanguageContext';

/* ── Role gate — mirrors src/lib/rbac/role-matrix.ts "/site-workspace" ── */
const ALLOWED_ROLES = ['site_engineer', 'project_manager', 'planning_engineer', 'planning_manager', 'admin'];

const STATUS_LABEL_AR: Record<SiteTaskStatus, string> = {
  pending: 'لم تبدأ',
  in_progress: 'قيد التنفيذ',
  pm_review: 'بانتظار اعتماد مدير المشروع',
  qc_pending: 'بانتظار استلام مراقبة الجودة',
  approved: 'معتمدة',
  rejected: 'مرفوضة للمعالجة',
  done: 'منجزة',
  cancelled: 'ملغاة',
};

const STATUS_LABEL_EN: Record<SiteTaskStatus, string> = {
  pending: 'Not Started',
  in_progress: 'In Progress',
  pm_review: 'Under PM Review',
  qc_pending: 'Pending QC Inspection',
  approved: 'Approved',
  rejected: 'Rejected for Rework',
  done: 'Completed',
  cancelled: 'Cancelled',
};

const STATUS_LABEL: Record<SiteTaskStatus, string> = STATUS_LABEL_AR;

const STATUS_CLS: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700',
  in_progress: 'bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-200 border border-blue-200 dark:border-blue-800',
  pm_review: 'bg-teal-50 text-teal-900 dark:bg-teal-950/60 dark:text-teal-200 border border-teal-200 dark:border-teal-800',
  qc_pending: 'bg-cyan-50 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-200 border border-cyan-200 dark:border-cyan-800',
  rejected: 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200 border border-rose-200 dark:border-rose-800',
  approved: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800',
  done: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800',
};

const PRIORITY_LABEL: Record<string, string> = {
  urgent: 'عاجلة جداً', high: 'مرتفعة', normal: 'عادية', low: 'منخفضة',
};

/** Statuses where the engineer still acts (report progress / transition). */
const ACTIONABLE: SiteTaskStatus[] = ['pending', 'in_progress', 'rejected'];

const TASKS_PER_PAGE = 30;
const CACHE_KEY_PREFIX = 'pzone_site_workspace_cache_';

/* ── Status filter options ── */
type StatusFilterKey = 'all' | 'overdue' | 'pending' | 'in_progress' | 'pm_review' | 'rejected' | 'done';
const STATUS_FILTERS: { key: StatusFilterKey; label: string; labelAr: string; labelEn: string; color: string }[] = [
  { key: 'all', label: 'الكل', labelAr: 'الكل', labelEn: 'All', color: 'bg-slate-800 text-white dark:bg-slate-700' },
  { key: 'overdue', label: 'متأخرة', labelAr: 'متأخرة', labelEn: 'Overdue', color: 'bg-rose-600 text-white' },
  { key: 'pending', label: 'لم تبدأ', labelAr: 'لم تبدأ', labelEn: 'Pending', color: 'bg-slate-600 text-white' },
  { key: 'in_progress', label: 'قيد التنفيذ', labelAr: 'قيد التنفيذ', labelEn: 'In Progress', color: 'bg-blue-600 text-white' },
  { key: 'pm_review', label: 'بانتظار الاعتماد', labelAr: 'بانتظار الاعتماد', labelEn: 'PM Review', color: 'bg-teal-700 text-white' },
  { key: 'rejected', label: 'مرفوضة', labelAr: 'مرفوضة', labelEn: 'Rejected', color: 'bg-rose-600 text-white' },
  { key: 'done', label: 'منجزة', labelAr: 'منجزة', labelEn: 'Completed', color: 'bg-emerald-700 text-white' },
];

/* ── Border color for task cards ── */
const CARD_BORDER: Record<string, string> = {
  overdue: 'border-s-rose-600',
  pending: 'border-s-slate-500',
  in_progress: 'border-s-blue-600',
  pm_review: 'border-s-teal-600',
  qc_pending: 'border-s-cyan-600',
  rejected: 'border-s-rose-500',
  approved: 'border-s-emerald-600',
  done: 'border-s-emerald-600',
};

/* ── Helper: is task overdue ── */
function isOverdue(task: SiteTask): boolean {
  if (!task.planned_date) return false;
  const today = new Date().toISOString().slice(0, 10);
  return task.planned_date < today && !['done', 'approved', 'cancelled'].includes(task.status);
}

/* ═══════════════════════════════════════════════════════════════════ */
export default function SiteWorkspacePage() {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const { user } = useAuth();
  const { roles, isLoading: rolesLoading } = useUserRoles();

  const canAccess = useMemo(() => roles.some((r) => ALLOWED_ROLES.includes(r)), [roles]);
  const isManagerOrAdmin = useMemo(
    () => roles.some((r) => ['admin', 'project_manager', 'planning_manager', 'planning_engineer'].includes(r)),
    [roles]
  );
  const isQc = useMemo(
    () => roles.some((r) => ['admin', 'qc_inspector', 'qc_engineer'].includes(r)),
    [roles]
  );

  /* ── data state ── */
  const [projects, setProjects] = useState<{ id: string; label: string }[]>([]);
  const { activeProjectId, setActiveProjectId } = useProjectStore();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(activeProjectId || '');

  // 1. Two-way sync: keep selectedProjectId in sync when activeProjectId changes from header or store
  useEffect(() => {
    if (activeProjectId && activeProjectId !== selectedProjectId) {
      setSelectedProjectId(activeProjectId);
    }
  }, [activeProjectId, selectedProjectId]);

  // 2. Two-way sync: update both selectedProjectId and activeProjectId on user selection
  const handleProjectSelect = useCallback((newId: string) => {
    setSelectedProjectId(newId);
    if (newId && newId !== activeProjectId) {
      setActiveProjectId(newId);
    }
  }, [activeProjectId, setActiveProjectId]);

  const projectId = selectedProjectId;
  const setProjectId = handleProjectSelect;
  const [myStakeholderId, setMyStakeholderId] = useState<string | null>(null);
  const [stakeholderResolved, setStakeholderResolved] = useState(true);
  const [teamMembers, setTeamMembers] = useState<{ id: string; name_ar: string; project_role: string }[]>([]);
  const [isOnProjectTeam, setIsOnProjectTeam] = useState(false);
  const canSeeAll = isManagerOrAdmin || isOnProjectTeam;
  const [viewMode, setViewMode] = useState<string>('all');
  const [zones, setZones] = useState<SiteTaskZone[]>([]);
  const [myTasks, setMyTasks] = useState<SiteTask[]>([]);
  const [qcTasks, setQcTasks] = useState<SiteTask[]>([]);
  const [rejectedDailyReports, setRejectedDailyReports] = useState<DailyProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dailyTask, setDailyTask] = useState<SiteTask | null>(null);
  const [wizardTask, setWizardTask] = useState<SiteTask | null>(null);
  const [wizardReport, setWizardReport] = useState<DailyProgress | null>(null);
  const [viewLayout, setViewLayout] = useState<'kanban' | 'grid' | 'cards'>('kanban');
  const [isObstructionModalOpen, setIsObstructionModalOpen] = useState(false);

  /* ── Offline cache & connection tracking ── */
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isOfflineCached, setIsOfflineCached] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  /* ── Outdoor daylight & mobile accessibility ── */
  const [isDaylightMode, setIsDaylightMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('site_workspace_daylight_mode') === 'true';
    }
    return false;
  });
  const [mobileTab, setMobileTab] = useState<'tasks' | 'context'>('tasks');

  /* ── Fast Log Picker & Quick Photo Capture ── */
  const [isFastLogPickerOpen, setIsFastLogPickerOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<{
    file: File;
    previewUrl: string;
    caption: string;
    linkedTaskId: string;
  } | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const [todayContext, setTodayContext] = useState({
    weather: 'غير متوفر',
    manpower: 0,
    equipment: 0,
    ncrCount: 0,
    photos: [] as { url: string; caption: string }[]
  });

  /* Restore layout mode preference */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('site_workspace_layout_mode') as 'kanban' | 'grid' | 'cards';
      if (saved && ['kanban', 'grid', 'cards'].includes(saved)) {
        setViewLayout(saved);
      }
    }
  }, []);

  /* Online / Offline event listeners */
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success(isAr ? 'تمت استعادة الاتصال بالشبكة — جاري تحديث بيانات الموقع' : 'Back online — updating site data');
      if (projectId) load(projectId, viewMode, myStakeholderId);
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning(
        isAr
          ? 'وضع العمل الميداني دون اتصال بالشبكة — السجلات محفوظة في التخزين المحلي'
          : 'Offline mode — records are preserved in local storage'
      );
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, viewMode, myStakeholderId, isAr]);

  /* Daylight mode toggle with localStorage */
  const toggleDaylightMode = () => {
    setIsDaylightMode((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('site_workspace_daylight_mode', String(next));
      }
      return next;
    });
  };

  /* ── filters ── */
  const [statusFilter, setStatusFilter] = useState<StatusFilterKey>('all');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  /* projects (site engineer only sees assigned projects) */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const allowed = await ProjectService.getUserAssignedProjectIds(user?.email || undefined, roles || undefined);
        const data = await ProjectService.getProjects({}, allowed);
        if (cancelled || !data?.length) return;
        setProjects(data.map((p) => ({ id: p.id, label: `#${p.project_code} — ${p.project_name || p.name_ar || ''}` })));
        
        const currentTarget = activeProjectId || selectedProjectId;
        if (!currentTarget || !data.some((p) => p.id === currentTarget)) {
          const firstId = data[0].id;
          setSelectedProjectId(firstId);
          setActiveProjectId(firstId);
        } else if (currentTarget !== selectedProjectId) {
          setSelectedProjectId(currentTarget);
        }
      } catch (err) {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, [user?.email, roles, activeProjectId, selectedProjectId, setActiveProjectId]);

  /* current user → stakeholder (email match) */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) return;
      const id = await SiteTaskService.resolveMyStakeholderId(user.email, user.id);
      if (cancelled) return;
      setMyStakeholderId(id);
      setStakeholderResolved(Boolean(id));
      if (id) {
        setViewMode('me');
      }
    })();
    return () => { cancelled = true; };
  }, [user, isManagerOrAdmin]);

  /* Load project team members when projectId changes */
  useEffect(() => {
    if (!projectId) {
      setTeamMembers([]);
      return;
    }
    let alive = true;
    supabase
      .from('project_team_with_auth')
      .select('stakeholder_id, stakeholder_name_ar, project_role')
      .eq('project_id', projectId)
      .eq('stakeholder_active', true)
      .then(({ data }) => {
        if (!alive) return;
        const members = (data || []).map((d) => ({
          id: d.stakeholder_id,
          name_ar: d.stakeholder_name_ar,
          project_role: d.project_role,
        }));
        setTeamMembers(members);

        const onTeam = myStakeholderId
          ? members.some((m) => m.id === myStakeholderId)
          : false;
        setIsOnProjectTeam(onTeam);

        if (onTeam && !isManagerOrAdmin) {
          setViewMode('all');
        }
      });
    return () => { alive = false; };
  }, [projectId, myStakeholderId, isManagerOrAdmin]);

  /* Cache helper functions */
  const saveLocalCache = (pid: string, data: Record<string, unknown>) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`${CACHE_KEY_PREFIX}${pid}`, JSON.stringify({
          ...data,
          cachedAt: new Date().toISOString(),
        }));
      }
    } catch {
      // quota safeguard
    }
  };

  const readLocalCache = (pid: string) => {
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(`${CACHE_KEY_PREFIX}${pid}`);
        if (raw) return JSON.parse(raw);
      }
    } catch {
      // parse safeguard
    }
    return null;
  };

  /* load tasks + zones + rejected reports with offline cache fallback */
  const load = useCallback(async (pid: string, mode: string, stkId: string | null) => {
    if (!pid) {
      setMyTasks([]); setQcTasks([]); setZones([]); setRejectedDailyReports([]);
      setLoading(false);
      return;
    }

    // If we already have items, perform soft refresh without layout jump
    if (myTasks.length > 0) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // Check offline status
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        const cached = readLocalCache(pid);
        if (cached) {
          setMyTasks(cached.myTasks || []);
          setQcTasks(cached.qcTasks || []);
          setZones(cached.zones || []);
          setRejectedDailyReports(cached.rejectedDailyReports || []);
          if (cached.todayContext) setTodayContext(cached.todayContext);
          setIsOfflineCached(true);
          if (cached.cachedAt) {
            const d = new Date(cached.cachedAt);
            setLastSyncTime(d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }));
          }
          return;
        }
      }

      let minePromise: Promise<SiteTask[]>;
      let qcPromise: Promise<SiteTask[]>;

      if (mode === 'all') {
        minePromise = SiteTaskService.getTasksForProject(pid);
        qcPromise = Promise.resolve([]);
      } else if (mode === 'me') {
        if (!stkId) {
          minePromise = canSeeAll ? SiteTaskService.getTasksForProject(pid) : Promise.resolve([]);
          qcPromise = Promise.resolve([]);
        } else {
          minePromise = SiteTaskService.getTasksForAssignee(pid, stkId);
          qcPromise = isQc ? SiteTaskService.getQcReceivables(pid, stkId) : Promise.resolve([]);
        }
      } else {
        minePromise = SiteTaskService.getTasksForAssignee(pid, mode);
        qcPromise = isQc ? SiteTaskService.getQcReceivables(pid, mode) : Promise.resolve([]);
      }

      const [mine, qc, zs, rejReports, allReports, allObs] = await Promise.all([
        minePromise,
        qcPromise,
        SiteTaskService.getZones(pid),
        DailyProgressService.getRejectedDailyReports(pid),
        DailyProgressService.getDailyReports(pid),
        DeliverablesService.getObstructions(pid),
      ]);
      setMyTasks(mine); setQcTasks(qc); setZones(zs); setRejectedDailyReports(rejReports || []);

      const today = new Date().toISOString().slice(0, 10);
      const todaysReports = (allReports || []).filter(r => r.progress_date === today);
      
      const weatherRep = todaysReports.find(r => r.weather);
      const manpower = todaysReports.reduce((sum, r) => sum + (Number(r.manpower_count) || 0), 0);
      const equipment = todaysReports.reduce((sum, r) => sum + (Number(r.equipment_count) || 0), 0);
      const openNcrCount = (allObs || []).filter(o => !o.resolved_at).length;
      
      const photos: { url: string; caption: string }[] = [];
      todaysReports.forEach(r => {
         if (r.photos) {
            r.photos.forEach(p => photos.push({ url: p.photo_url || '', caption: p.caption || '' }));
         }
      });

      const contextData = {
         weather: weatherRep?.weather || 'صافٍ ومعتدل',
         manpower,
         equipment,
         ncrCount: openNcrCount,
         photos: photos.slice(0, 4)
      };
      setTodayContext(contextData);

      const now = new Date();
      setLastSyncTime(now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }));
      setIsOfflineCached(false);

      // Save fresh data snapshot into localStorage for offline cache
      saveLocalCache(pid, {
        myTasks: mine,
        qcTasks: qc,
        zones: zs,
        rejectedDailyReports: rejReports || [],
        todayContext: contextData,
      });
    } catch (e: unknown) {
      // If network fetch fails, attempt to read cached snapshot
      const cached = readLocalCache(pid);
      if (cached) {
        setMyTasks(cached.myTasks || []);
        setQcTasks(cached.qcTasks || []);
        setZones(cached.zones || []);
        setRejectedDailyReports(cached.rejectedDailyReports || []);
        if (cached.todayContext) setTodayContext(cached.todayContext);
        setIsOfflineCached(true);
        if (cached.cachedAt) {
          const d = new Date(cached.cachedAt);
          setLastSyncTime(d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }));
        }
        toast.info('تعذر تحديث البيانات من الخادم، يتم الآن عرض النسخة المحفوظة محلياً');
      } else {
        setErrorMsg((e as Error)?.message || 'فشل جلب مهام الموقع');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [isManagerOrAdmin, isQc, canSeeAll, myTasks.length]);

  useEffect(() => { load(projectId, viewMode, myStakeholderId); }, [projectId, viewMode, myStakeholderId, load]);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [statusFilter, zoneFilter, searchQuery]);

  /* ── actions ── */
  const act = async (task: SiteTask, target: SiteTaskStatus, note?: string) => {
    setActingId(task.id);
    setErrorMsg(null);
    try {
      await SiteTaskService.transitionTaskState({
        taskId: task.id,
        toState: target,
        reason: note,
      });
      toast.success(`تم تحديث حالة المهمة: ${STATUS_LABEL[target] || target}`);
      await load(projectId, viewMode, myStakeholderId);
    } catch (e: unknown) {
      const msg = (e as Error)?.message || 'فشل تحديث المهمة';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setActingId(null);
    }
  };

  /* ── Fast Log Submission Trigger ── */
  const handleFastLog = () => {
    const actionable = myTasks.filter((t) => ACTIONABLE.includes(t.status));
    if (actionable.length === 0) {
      if (myTasks.length > 0) {
        setWizardReport(null);
        setWizardTask(myTasks[0]);
      } else {
        toast.error('لا توجد مهام مسندة لك في هذا المشروع لتسجيل تقرير يومي');
      }
      return;
    }

    const inProgress = actionable.filter((t) => t.status === 'in_progress');
    if (inProgress.length === 1) {
      // Direct 1-tap open for the single in-progress task!
      const target = inProgress[0];
      const matchingRep = rejectedDailyReports.find((r) => r.site_task_id === target.id);
      setWizardReport(matchingRep || null);
      setWizardTask(target);
    } else {
      // Multiple options -> Open ergonomic fast selector modal
      setIsFastLogPickerOpen(true);
    }
  };

  /* ── Quick Photo Capture Affordances ── */
  const handleTriggerCamera = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
      cameraInputRef.current.click();
    }
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    const defaultTask = myTasks.find((t) => t.status === 'in_progress') || myTasks[0];
    setCapturedPhoto({
      file,
      previewUrl,
      caption: '',
      linkedTaskId: defaultTask?.id || '',
    });
    setIsPhotoModalOpen(true);
  };

  /* ── Stats (computed from ALL tasks before filtering) ── */
  const stats = useMemo(() => {
    const total = myTasks.length;
    const overdueCount = myTasks.filter(isOverdue).length;
    const pending = myTasks.filter((t) => t.status === 'pending').length;
    const inProgress = myTasks.filter((t) => t.status === 'in_progress').length;
    const pmReview = myTasks.filter((t) => t.status === 'pm_review').length;
    const rejected = myTasks.filter((t) => t.status === 'rejected').length;
    const doneOrApproved = myTasks.filter((t) => ['done', 'approved'].includes(t.status)).length;
    const progressPct = total > 0 ? Math.round((doneOrApproved / total) * 100) : 0;
    return { total, overdueCount, pending, inProgress, pmReview, rejected, doneOrApproved, progressPct };
  }, [myTasks]);

  /* ── Filtered tasks (client-side) ── */
  const filteredTasks = useMemo(() => {
    let result = myTasks;

    // Status filter
    if (statusFilter === 'overdue') {
      result = result.filter(isOverdue);
    } else if (statusFilter !== 'all') {
      result = result.filter((t) => t.status === statusFilter);
    }

    // Zone filter
    if (zoneFilter !== 'all') {
      result = result.filter((t) => t.zone_id === zoneFilter);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((t) =>
        t.title_ar?.toLowerCase().includes(q) ||
        t.task_code?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [myTasks, statusFilter, zoneFilter, searchQuery]);

  /* ── Pagination ── */
  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / TASKS_PER_PAGE));
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * TASKS_PER_PAGE;
    return filteredTasks.slice(start, start + TASKS_PER_PAGE);
  }, [filteredTasks, currentPage]);

  /* ── Zone map for display ── */
  const zoneMap = useMemo(() => {
    const map: Record<string, string> = {};
    zones.forEach((z) => { map[z.id] = z.name_ar; });
    return map;
  }, [zones]);

  if (rolesLoading) {
    return (
      <div className="p-6 max-w-[1750px] mx-auto" dir="rtl">
        <SiteWorkspaceSkeleton />
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="p-10 text-center space-y-3" dir="rtl">
        <HardHat className="w-12 h-12 mx-auto text-amber-500/70" />
        <h1 className="font-black text-base text-slate-800 dark:text-slate-100">غير مصرح بالوصول إلى مساحة الموقع</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
          هذه الشاشة مخصصة للمهندس الميداني، مدير المشروع، وأدوار إدارة الجودة والتحكم بالمشاريع.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`p-3 sm:p-5 lg:p-6 space-y-4 sm:space-y-5 max-w-[1750px] w-full mx-auto text-end transition-colors ${
        isDaylightMode
          ? 'bg-slate-50 dark:bg-slate-900 text-slate-950 font-bold contrast-125'
          : ''
      }`}
      dir="rtl"
    >
      {/* Hidden native camera file input for direct field snapping */}
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        className="hidden"
        aria-hidden="true"
        onChange={handleCameraCapture}
      />

      {/* ═══ OFFLINE CACHE INDICATOR BANNER ═══ */}
      {(!isOnline || isOfflineCached) && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-2xl border-2 border-amber-500 bg-amber-500/10 dark:bg-amber-950/40 p-3 sm:p-4 text-amber-900 dark:text-amber-200 flex flex-wrap items-center justify-between gap-3 shadow-sm animate-in fade-in"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400">
              <WifiOff className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-black">
                {isAr ? 'وضع العمل الميداني دون اتصال بالشبكة' : 'Field Offline Mode'}
              </p>
              <p className="text-[11px] opacity-90">
                {isAr
                  ? 'يتم عرض البيانات المحفوظة محلياً في ذاكرة جهازك. يمكنك تسجيل الملاحظات والتقاط الصور وسيتم رفعها تلقائياً عند توفر الاتصال بالشبكة.'
                  : 'Displaying locally cached data. You can log notes and capture photos which will be synced once back online.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {lastSyncTime && (
              <span className="text-[11px] font-mono bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 px-2.5 py-1 rounded-lg">
                {isAr ? `آخر مزامنة: ${lastSyncTime}` : `Last synced: ${lastSyncTime}`}
              </span>
            )}
            <button
              onClick={() => load(projectId, viewMode, myStakeholderId)}
              className="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isAr ? 'إعادة المزامنة' : 'Resync Now'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ═══ HEADER BAR ═══ */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 dark:from-amber-500 dark:to-amber-700 shadow-md shadow-amber-500/20 flex items-center justify-center shrink-0 text-white">
            <HardHat className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                {isAr ? 'مساحة عمل مهندس الموقع' : 'Site Workspace'}
              </h1>
              {isOnline ? (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {isAr ? 'متصل بالشبكة' : 'Online'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {isAr ? 'غير متصل (محلي)' : 'Offline (Local)'}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {isQc
                ? (isAr ? 'متابعة تنفيذ البنود • التقرير اليومي • استلام مراقبة الجودة' : 'Task Execution • Daily Report • QC Inspection')
                : (isAr ? 'المهام الميدانية • تسجيل الإنجاز اليومي • توثيق صور الموقع' : 'Site Tasks • Daily Progress • Site Photos')}
            </p>
          </div>
        </div>

        {/* Action Controls & Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Project Select with Building2 icon */}
          <div className="relative flex-1 sm:flex-initial min-w-[210px]">
            <Building2 className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <select
              value={selectedProjectId}
              onChange={(e) => handleProjectSelect(e.target.value)}
              aria-label={isAr ? 'اختيار المشروع' : 'Select Project'}
              className="w-full min-h-[44px] ps-9 pe-8 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 text-xs font-black text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition cursor-pointer appearance-none"
            >
              {projects.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
          </div>

          {/* View mode dropdown */}
          {(canSeeAll || teamMembers.length > 0) && (
            <div className="relative flex-1 sm:flex-initial min-w-[190px]">
              <Users className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-400 pointer-events-none" />
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                aria-label={isAr ? 'تصفية المهام حسب المهندس' : 'Filter by Engineer'}
                className="w-full min-h-[44px] ps-9 pe-8 py-2 rounded-xl border border-emerald-500/40 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 text-xs font-black focus:ring-2 focus:ring-emerald-500/20 transition cursor-pointer appearance-none"
                title={isAr ? 'تصفية المهام حسب المهندس أو عرض الكل' : 'Filter tasks by engineer or show all'}
              >
                <option value="all">{isAr ? 'جميع مهام الموقع بالمشروع' : 'All Site Tasks'}</option>
                {myStakeholderId && <option value="me">{isAr ? 'مهامي الشخصية فقط' : 'My Tasks Only'}</option>}
                {teamMembers.map((tm) => (
                  <option key={tm.id} value={tm.id}>
                    {tm.project_role ? `[${tm.project_role}] ` : ''}{tm.name_ar}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute end-2.5 top-1/2 -translate-y-1/2 text-emerald-600/70 pointer-events-none" />
            </div>
          )}

          {/* Outdoor Daylight Mode Toggle */}
          <button
            type="button"
            onClick={toggleDaylightMode}
            title={isDaylightMode ? (isAr ? 'إلغاء وضع السطوع الميداني' : 'Disable Daylight Mode') : (isAr ? 'تفعيل وضع السطوع الميداني (تباين عالي تحت أشعة الشمس)' : 'Enable Outdoor Daylight Mode')}
            aria-label={isAr ? 'تبديل وضع السطوع الميداني' : 'Toggle Outdoor Daylight Mode'}
            className={`min-h-[44px] min-w-[44px] p-2.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
              isDaylightMode
                ? 'bg-amber-500 text-slate-950 border-amber-600 font-black shadow-md ring-2 ring-amber-400/40'
                : 'border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sun className={`w-4 h-4 ${isDaylightMode ? 'animate-spin-slow text-slate-950' : 'text-amber-500'}`} />
            <span className="sr-only">{isAr ? 'وضع السطوع الميداني' : 'Outdoor Daylight Mode'}</span>
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => load(projectId, viewMode, myStakeholderId)}
            disabled={loading || isRefreshing}
            aria-label={isAr ? 'تحديث البيانات' : 'Refresh Data'}
            title={isAr ? 'تحديث البيانات الميدانية' : 'Refresh Data'}
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50 cursor-pointer flex items-center justify-center active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-500' : ''}`} />
          </button>

          {/* Fast Log Submission Button (Desktop/Tablet) */}
          <button
            type="button"
            onClick={handleFastLog}
            className="hidden sm:inline-flex min-h-[44px] items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white text-xs font-black transition-all shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30 cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-white shrink-0" />
            <span>{isAr ? 'تسجيل إنجاز سريع' : 'Fast Log'}</span>
          </button>

          {/* Quick Photo Capture Button (Desktop/Tablet) */}
          <button
            type="button"
            onClick={handleTriggerCamera}
            className="hidden sm:inline-flex min-h-[44px] items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white text-xs font-black transition-all shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30 cursor-pointer"
          >
            <Camera className="w-4 h-4 shrink-0" />
            <span>{isAr ? 'التقاط صورة' : 'Capture Photo'}</span>
          </button>
        </div>
      </div>

      {/* ═══ MOBILE COMMAND STRIP (SM:HIDDEN) ═══ */}
      <div className="sm:hidden grid grid-cols-3 gap-2 bg-gradient-to-r from-slate-900 to-slate-800 text-white p-2 rounded-2xl shadow-xl border border-slate-700">
        <button
          type="button"
          onClick={handleFastLog}
          className="min-h-[48px] flex flex-col items-center justify-center p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white transition text-center shadow-md cursor-pointer"
        >
          <Zap className="w-4 h-4 mb-0.5 fill-white" />
          <span className="text-[10px] font-black leading-tight">{isAr ? 'تسجيل سريع' : 'Quick Log'}</span>
        </button>

        <button
          type="button"
          onClick={handleTriggerCamera}
          className="min-h-[48px] flex flex-col items-center justify-center p-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white transition text-center shadow-md cursor-pointer"
        >
          <Camera className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-black leading-tight">{isAr ? 'صورة موقع' : 'Site Photo'}</span>
        </button>

        <button
          type="button"
          onClick={() => setIsObstructionModalOpen(true)}
          className="min-h-[48px] flex flex-col items-center justify-center p-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white transition text-center shadow-md cursor-pointer"
        >
          <ShieldAlert className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-black leading-tight">{isAr ? 'تسجيل عائق' : 'Obstruction'}</span>
        </button>
      </div>

      {!stakeholderResolved && !isManagerOrAdmin && (
        <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-3.5 py-2.5 text-xs text-amber-800 dark:text-amber-200">
          {isAr
            ? `بريد المستخدم (${user?.email}) غير مسجل ضمن فريق عمل المشروع — يتم عرض جميع المهام المتاحة.`
            : `User email (${user?.email}) is not associated with the project team — showing all available tasks.`}
        </div>
      )}

      {/* ═══ MOBILE VIEW TABS (LG:HIDDEN) ═══ */}
      <div className="lg:hidden flex flex-wrap items-center bg-slate-100 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 gap-1.5 shadow-xs">
        <button
          type="button"
          onClick={() => setMobileTab('tasks')}
          className={`flex-1 min-h-[44px] rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            mobileTab === 'tasks'
              ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ListChecks className="w-4 h-4" />
          <span>{isAr ? 'مهام الموقع' : 'Site Tasks'}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
            mobileTab === 'tasks'
              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
          }`}>
            {filteredTasks.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('context')}
          className={`flex-1 min-h-[44px] rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            mobileTab === 'context'
              ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>{isAr ? 'لوحة الميدان والموارد' : 'Field Dashboard'}</span>
          {todayContext.ncrCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </button>
      </div>

      {errorMsg && (
        <div className="flex items-center justify-between rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 px-3.5 py-2.5 text-xs font-bold text-rose-700 dark:text-rose-300">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* ═══ REJECTED DAILY REPORTS ALERT (REWORK CENTER) ═══ */}
      {rejectedDailyReports.length > 0 && (
        <div className="rounded-2xl border-2 border-rose-400 dark:border-rose-900 bg-rose-50/90 dark:bg-rose-950/40 p-4 shadow-sm space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-900 dark:text-rose-200">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <h2 className="text-xs sm:text-sm font-black">
                تقارير إنجاز يومية مرفوضة بحاجة لتعديل وإعادة تقديم ({rejectedDailyReports.length})
              </h2>
            </div>
            <span className="text-[10px] font-bold bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 px-3 py-1 rounded-full">
              مطلوب إجراء فوري
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {rejectedDailyReports.map((rep) => {
              const linkedTask = myTasks.find((t) => t.id === rep.site_task_id);
              const taskTitle = linkedTask?.title_ar || `مهمة #${rep.site_task_id?.slice(0, 6) || ''}`;
              const reason = rep.rejection_reason || rep.progress_rejection_reason || 'يرجى مراجعة وتعديل الكميات المرفوعة';
              return (
                <div
                  key={rep.id}
                  className="rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800/80 p-3.5 shadow-sm flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-slate-800 dark:text-white">
                        يومية #{rep.report_no || rep.progress_date}
                      </span>
                      <span className="font-mono text-slate-500 dark:text-slate-400 text-[10px]">{rep.progress_date}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 truncate">
                      {taskTitle}
                    </p>
                    <div className="text-[11px] text-rose-800 dark:text-rose-200 bg-rose-50 dark:bg-rose-950/60 rounded-lg p-2.5 flex items-start gap-2 border border-rose-200 dark:border-rose-900">
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span className="leading-tight"><strong>سبب الرفض:</strong> {reason}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                      بواسطة: {rep.entered_by_name || 'مهندس الموقع'}
                    </span>
                    <button
                      onClick={() => {
                        const targetTask = linkedTask || ({
                          id: rep.site_task_id || '',
                          title_ar: taskTitle,
                          project_id: projectId,
                          status: 'rejected',
                          task_code: '',
                          progress_pct: 0,
                        } as SiteTask);
                        setWizardReport(rep);
                        setWizardTask(targetTask);
                      }}
                      className="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-black transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>معالجة وإعادة التقديم</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ STATS DASHBOARD ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        <StatCard
          icon={<ListChecks className="w-4 h-4" />}
          label="إجمالي المهام"
          value={stats.total}
          color="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"
          iconColor="text-slate-600 dark:text-slate-300"
          active={statusFilter === 'all'}
          onClick={() => setStatusFilter('all')}
          isDaylightMode={isDaylightMode}
        />
        <StatCard
          icon={<AlertTriangle className="w-4 h-4" />}
          label="متأخرة"
          value={stats.overdueCount}
          color="bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
          iconColor="text-rose-600"
          active={statusFilter === 'overdue'}
          onClick={() => setStatusFilter('overdue')}
          pulse={stats.overdueCount > 0}
          isDaylightMode={isDaylightMode}
        />
        <StatCard
          icon={<PlayCircle className="w-4 h-4" />}
          label="قيد التنفيذ"
          value={stats.inProgress}
          color="bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200"
          iconColor="text-blue-600"
          active={statusFilter === 'in_progress'}
          onClick={() => setStatusFilter('in_progress')}
          isDaylightMode={isDaylightMode}
        />
        <StatCard
          icon={<UploadCloud className="w-4 h-4" />}
          label="بانتظار الاعتماد"
          value={stats.pmReview}
          color="bg-teal-50 text-teal-900 dark:bg-teal-950/40 dark:text-teal-200"
          iconColor="text-teal-600"
          active={statusFilter === 'pm_review'}
          onClick={() => setStatusFilter('pm_review')}
          isDaylightMode={isDaylightMode}
        />
        <StatCard
          icon={<XCircle className="w-4 h-4" />}
          label="مرفوضة"
          value={stats.rejected}
          color="bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
          iconColor="text-amber-600"
          active={statusFilter === 'rejected'}
          onClick={() => setStatusFilter('rejected')}
          isDaylightMode={isDaylightMode}
        />
        <StatCard
          icon={<CheckCircle2 className="w-4 h-4" />}
          label="منجزة"
          value={stats.doneOrApproved}
          color="bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
          iconColor="text-emerald-600"
          active={statusFilter === 'done'}
          onClick={() => setStatusFilter('done')}
          suffix={<span className="text-[10px] font-bold opacity-75">{stats.progressPct}%</span>}
          isDaylightMode={isDaylightMode}
        />
      </div>

      {/* ═══ FILTER BAR (MOBILE & DESKTOP) ═══ */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search Input with 44px min-h */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في مهام الموقع (بالاسم أو الكود)..."
            aria-label="بحث في المهام"
            className="w-full min-h-[44px] ps-10 pe-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
          />
        </div>

        {/* Zone filter with 44px min-h */}
        <select
          value={zoneFilter}
          onChange={(e) => setZoneFilter(e.target.value)}
          aria-label="تصفية حسب المنطقة"
          className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-black text-slate-800 dark:text-slate-200"
        >
          <option value="all">كل مناطق الموقع</option>
          {zones.map((z) => (
            <option key={z.id} value={z.id}>{z.name_ar}</option>
          ))}
        </select>

        {/* Status pill tabs with 44px min-h touch target and live count badges */}
        <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto py-1">
          {STATUS_FILTERS.map((f) => {
            const count =
              f.key === 'all'
                ? stats.total
                : f.key === 'overdue'
                ? stats.overdueCount
                : f.key === 'pending'
                ? stats.pending
                : f.key === 'in_progress'
                ? stats.inProgress
                : f.key === 'pm_review'
                ? stats.pmReview
                : f.key === 'rejected'
                ? stats.rejected
                : stats.doneOrApproved;

            const isSelected = statusFilter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer inline-flex items-center gap-2 active:scale-95 ${
                  isSelected
                    ? `${f.color} shadow-sm ring-2 ring-emerald-500/30 scale-[1.02]`
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/80'
                } ${isDaylightMode ? 'border-2' : ''}`}
              >
                <span>{isAr ? f.labelAr : f.labelEn}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : f.key === 'overdue' && count > 0
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ VIEW LAYOUT SWITCHER ═══ */}
      <div className="flex flex-wrap items-center justify-between bg-white dark:bg-slate-900 p-2.5 sm:p-3 rounded-2xl border border-slate-200 dark:border-slate-800 gap-3 shadow-xs">
        <div className="flex items-center gap-2.5 text-xs font-black text-slate-800 dark:text-slate-200 px-1">
          <span>{isAr ? 'طريقة العرض الميداني:' : 'Display Layout:'}</span>
          <span className="text-xs font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-800 font-bold">
            {isAr ? `${filteredTasks.length} مهمة` : `${filteredTasks.length} tasks`}
          </span>
          {isRefreshing && (
            <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
              <span>{isAr ? 'جاري تحديث البيانات...' : 'Refreshing data...'}</span>
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl gap-1 border border-slate-200/60 dark:border-slate-700/60">
          <button
            type="button"
            onClick={() => {
              setViewLayout('kanban');
              if (typeof window !== 'undefined') localStorage.setItem('site_workspace_layout_mode', 'kanban');
            }}
            className={`min-h-[40px] sm:min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer active:scale-95 ${
              viewLayout === 'kanban'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Kanban className="w-4 h-4" />
            <span>{isAr ? 'لوحة كانبان' : 'Kanban Board'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setViewLayout('grid');
              if (typeof window !== 'undefined') localStorage.setItem('site_workspace_layout_mode', 'grid');
            }}
            className={`min-h-[40px] sm:min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer active:scale-95 ${
              viewLayout === 'grid'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>{isAr ? 'جدول البيانات السريع' : 'Fast Grid'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setViewLayout('cards');
              if (typeof window !== 'undefined') localStorage.setItem('site_workspace_layout_mode', 'cards');
            }}
            className={`min-h-[40px] sm:min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer active:scale-95 ${
              viewLayout === 'cards'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>{isAr ? 'بطاقات المهام' : 'Task Cards'}</span>
          </button>
        </div>
      </div>

      {/* ═══ MAIN WORKSPACE GRID (RESPONSIVE SPLIT) ═══ */}
      <div className="flex flex-col lg:flex-row gap-5 items-start w-full mt-2">
        {/* Left Column: Tasks Section */}
        <div className={`flex-1 w-full space-y-5 min-w-0 ${mobileTab === 'context' ? 'hidden lg:block' : 'block'}`}>
          {loading && myTasks.length === 0 ? (
            <SiteTasksGridSkeleton />
          ) : filteredTasks.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3 text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
              <CheckCircle2 className="w-12 h-12 text-emerald-500/80" />
              <span className="text-sm font-black text-slate-800 dark:text-slate-200">
                {statusFilter !== 'all' || zoneFilter !== 'all' || searchQuery
                  ? 'لا توجد مهام تطابق معايير البحث الحالية'
                  : 'لا توجد مهام موقع مفتوحة مسندة لك حالياً'}
              </span>
              {(statusFilter !== 'all' || zoneFilter !== 'all' || searchQuery) && (
                <button
                  onClick={() => { setStatusFilter('all'); setZoneFilter('all'); setSearchQuery(''); }}
                  className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition cursor-pointer"
                >
                  إعادة ضبط الفلاتر
                </button>
              )}
            </div>
          ) : viewLayout === 'kanban' ? (
            <SiteWorkspaceKanban
              tasks={filteredTasks}
              projectId={projectId}
              zoneMap={zoneMap}
              rejectedReports={rejectedDailyReports}
              onOpenWizard={(t) => {
                const matchingRep = rejectedDailyReports.find((r) => r.site_task_id === t.id);
                setWizardReport(matchingRep || null);
                setWizardTask(t);
              }}
              onStartTask={(id) => {
                const target = filteredTasks.find((t) => t.id === id);
                if (target) return act(target, 'in_progress');
                return Promise.resolve();
              }}
              actingId={actingId}
              onRefresh={() => load(projectId, viewMode, myStakeholderId)}
            />
          ) : viewLayout === 'grid' ? (
            <SiteWorkspaceFastGrid
              tasks={filteredTasks}
              projectId={projectId}
              zoneMap={zoneMap}
              onOpenWizard={(t) => {
                const matchingRep = rejectedDailyReports.find((r) => r.site_task_id === t.id);
                setWizardReport(matchingRep || null);
                setWizardTask(t);
              }}
              onRefresh={() => load(projectId, viewMode, myStakeholderId)}
            />
          ) : (
            <>
              {/* Results info */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  عرض {(currentPage - 1) * TASKS_PER_PAGE + 1}–{Math.min(currentPage * TASKS_PER_PAGE, filteredTasks.length)} من {filteredTasks.length} مهمة
                </span>
              </div>

              {/* Cards grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {paginatedTasks.map((task) => (
                  <SiteTaskCard
                    key={task.id}
                    task={task}
                    zoneMap={zoneMap}
                    actingId={actingId}
                    isDaylightMode={isDaylightMode}
                    rejectedReport={rejectedDailyReports.find((r) => r.site_task_id === task.id)}
                    onStart={(t) => act(t, 'in_progress')}
                    onSubmitReview={(t) => act(t, 'pm_review')}
                    onReopen={(t) => act(t, 'in_progress')}
                    onOpenDaily={(t) => {
                      const matchingRep = rejectedDailyReports.find((r) => r.site_task_id === t.id);
                      setWizardReport(matchingRep || null);
                      setWizardTask(t);
                    }}
                  />
                ))}
              </div>

              {/* Accessible Pagination (min 44x44px touch targets) */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-5 flex-wrap">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    aria-label="الصفحة السابقة"
                    className="min-w-[44px] min-h-[44px] p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let page: number;
                    if (totalPages <= 7) {
                      page = i + 1;
                    } else if (currentPage <= 4) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 3) {
                      page = totalPages - 6 + i;
                    } else {
                      page = currentPage - 3 + i;
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        aria-label={`انتقل إلى صفحة ${page}`}
                        className={`min-w-[44px] min-h-[44px] rounded-xl text-xs font-black cursor-pointer transition flex items-center justify-center ${
                          currentPage === page
                            ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-500/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    aria-label="الصفحة التالية"
                    className="min-w-[44px] min-h-[44px] p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}

          {/* ═══ QC RECEIVABLES ═══ */}
          {isQc && (
            <QcReceivablesSection
              tasks={qcTasks}
              loading={loading}
              actingId={actingId}
              isDaylightMode={isDaylightMode}
              onApprove={(t) => act(t, 'approved')}
              onReject={(t, note) => act(t, 'rejected', note)}
            />
          )}
        </div>

        {/* Right Column: Contextual Field Sidebar */}
        <div className={`w-full lg:w-[300px] xl:w-[340px] shrink-0 space-y-4 lg:sticky lg:top-6 ${mobileTab === 'tasks' ? 'hidden lg:block' : 'block'}`}>
          {/* Quick Action Dials (ADR-0009) */}
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xl shadow-slate-900/5 transition-all">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-teal-600" />
                لوحة الإجراءات الميدانية السريعة
              </h3>
              <span className="text-[10px] font-black text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                ميداني
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Dial 1: WIR */}
              <Link
                href="/deliverables"
                data-testid="quick-dial-wir"
                className="group min-h-[64px] flex flex-col justify-between p-3 rounded-xl bg-gradient-to-br from-teal-50/90 to-white dark:from-teal-950/30 dark:to-slate-900 border border-teal-200 dark:border-teal-800 hover:border-teal-400 dark:hover:border-teal-600 hover:shadow-md transition text-start"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center group-hover:scale-105 transition">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition" />
                </div>
                <div>
                  <span className="text-xs font-black text-slate-900 dark:text-slate-100 leading-tight block">
                    {isAr ? 'طلب فحص واستلام الأعمال' : 'Inspection Request (WIR)'}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                    {isAr ? 'تسليم استشاري المشروع' : 'Consultant Handover'}
                  </span>
                </div>
              </Link>

              {/* Dial 2: Log Obstruction */}
              <button
                type="button"
                data-testid="quick-dial-obstruction"
                onClick={() => setIsObstructionModalOpen(true)}
                className="group min-h-[64px] flex flex-col justify-between p-3 rounded-xl bg-gradient-to-br from-rose-50/90 to-white dark:from-rose-950/30 dark:to-slate-900 border border-rose-200 dark:border-rose-800 hover:border-rose-400 dark:hover:border-rose-600 hover:shadow-md transition text-start cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-105 transition">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                </div>
                <div>
                  <span className="text-xs font-black text-slate-900 dark:text-slate-100 leading-tight block">
                    {isAr ? 'تسجيل عائق أو تأخير' : 'Log Obstruction / Delay'}
                  </span>
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5 block">
                    {isAr ? 'مطالبات التمديد الزمني' : 'EOT Claims'}
                  </span>
                </div>
              </button>

              {/* Dial 3: Review BOQ */}
              <Link
                href="/boq"
                data-testid="quick-dial-boq"
                className="group min-h-[64px] flex flex-col justify-between p-3 rounded-xl bg-gradient-to-br from-blue-50/90 to-white dark:from-blue-950/30 dark:to-slate-900 border border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md transition text-start"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition" />
                </div>
                <div>
                  <span className="text-xs font-black text-slate-900 dark:text-slate-100 leading-tight block">
                    {isAr ? 'جدول الكميات والمواصفات' : 'Bill of Quantities (BOQ)'}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                    {isAr ? 'البنود والفئات التعاقدية' : 'Contract Items'}
                  </span>
                </div>
              </Link>

              {/* Dial 4: Claims & VOs */}
              <Link
                href="/contracts/claims"
                data-testid="quick-dial-claims"
                className="group min-h-[64px] flex flex-col justify-between p-3 rounded-xl bg-gradient-to-br from-violet-50/90 to-white dark:from-violet-950/30 dark:to-slate-900 border border-violet-200 dark:border-violet-800 hover:border-violet-400 dark:hover:border-violet-600 hover:shadow-md transition text-start"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center group-hover:scale-105 transition">
                    <FileSignature className="w-4 h-4" />
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition" />
                </div>
                <div>
                  <span className="text-xs font-black text-slate-900 dark:text-slate-100 leading-tight block">
                    {isAr ? 'أوامر التغيير والمطالبات' : 'Variation Orders & Claims'}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                    {isAr ? 'المطالبات الميدانية' : 'Field Claims & VOs'}
                  </span>
                </div>
              </Link>
            </div>
          </div>

          {/* Weather & Conditions */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
            <h3 className="text-xs font-black text-slate-900 dark:text-white mb-2.5 flex items-center gap-1.5">
              <Sun className="w-4 h-4 text-amber-500" />
              أحوال الموقع الميداني (اليوم)
            </h3>
            <div className="flex items-center justify-between text-xs text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 font-bold">
              <span>حالة الطقس الميداني:</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-black">{todayContext.weather}</span>
            </div>
          </div>

          {/* Manpower & Equipment Summary */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
            <h3 className="text-xs font-black text-slate-900 dark:text-white mb-2.5 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-500" />
              الموارد الحالية في الموقع (اليوم)
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900 font-bold">
                <span className="text-slate-700 dark:text-slate-300">العمالة المسجلة:</span>
                <span className="font-mono font-black text-blue-700 dark:text-blue-300 text-sm">{todayContext.manpower} عامل</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900 font-bold">
                <span className="text-slate-700 dark:text-slate-300">المعدات العاملة:</span>
                <span className="font-mono font-black text-amber-700 dark:text-amber-300 text-sm">{todayContext.equipment} معدة</span>
              </div>
            </div>
          </div>

          {/* NCR Alerts */}
          {todayContext.ncrCount > 0 && (
            <div className="bg-rose-50 dark:bg-rose-950/40 rounded-2xl border-2 border-rose-300 dark:border-rose-900 p-4 shadow-sm">
              <h3 className="text-xs font-black text-rose-900 dark:text-rose-200 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                معوقات مفتوحة في الموقع
              </h3>
              <p className="text-xs text-rose-800 dark:text-rose-200 leading-relaxed font-bold">
                توجد {todayContext.ncrCount} عوائق أو إشعارات عدم مطابقة تتطلب المعالجة اليوم.
              </p>
            </div>
          )}

          {/* Photo Gallery & Quick Capture Affordance in Sidebar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-emerald-500" />
                صور الموقع (اليوم)
              </h3>
              <button
                type="button"
                onClick={handleTriggerCamera}
                className="min-h-[44px] px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-black flex items-center gap-1 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/60 transition"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>التقاط صورة</span>
              </button>
            </div>
            {todayContext.photos.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {todayContext.photos.map((p, i) => (
                  <div key={i} className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-square relative group">
                    <img src={p.url} alt={p.caption || 'صورة موقع'} className="w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-xs p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[9px] text-white truncate text-center">{p.caption || 'صورة موقع'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <Camera className="w-6 h-6 text-slate-400 dark:text-slate-500 mx-auto mb-1.5 opacity-50" />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">لا توجد صور مسجلة لليوم</p>
                <button
                  type="button"
                  onClick={handleTriggerCamera}
                  className="mt-2 min-h-[44px] px-3 py-1.5 text-xs font-black text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  + التقاط أول صورة ميدانية
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ FAST LOG TASK PICKER BOTTOM SHEET / MODAL ═══ */}
      {isFastLogPickerOpen && (
        <FastLogTaskPickerModal
          isOpen={isFastLogPickerOpen}
          tasks={myTasks}
          zoneMap={zoneMap}
          onClose={() => setIsFastLogPickerOpen(false)}
          onSelectTask={(task) => {
            setIsFastLogPickerOpen(false);
            const matchingRep = rejectedDailyReports.find((r) => r.site_task_id === task.id);
            setWizardReport(matchingRep || null);
            setWizardTask(task);
          }}
        />
      )}

      {/* ═══ QUICK PHOTO CAPTURE MODAL ═══ */}
      {isPhotoModalOpen && capturedPhoto && (
        <QuickPhotoCaptureModal
          isOpen={isPhotoModalOpen}
          photo={capturedPhoto}
          tasks={myTasks}
          onClose={() => {
            setIsPhotoModalOpen(false);
            setCapturedPhoto(null);
          }}
          onSaveDirect={(newPhoto) => {
            setTodayContext((prev) => ({
              ...prev,
              photos: [newPhoto, ...prev.photos],
            }));
            setIsPhotoModalOpen(false);
            setCapturedPhoto(null);
            toast.success('تم حفظ وتوثيق الصورة الميدانية بنجاح');
          }}
          onProceedToWizard={(targetTaskId, newPhoto) => {
            setTodayContext((prev) => ({
              ...prev,
              photos: [newPhoto, ...prev.photos],
            }));
            setIsPhotoModalOpen(false);
            setCapturedPhoto(null);
            const task = myTasks.find((t) => t.id === targetTaskId) || myTasks[0];
            if (task) {
              const matchingRep = rejectedDailyReports.find((r) => r.site_task_id === task.id);
              setWizardReport(matchingRep || null);
              setWizardTask(task);
            }
          }}
        />
      )}

      {/* ═══ 4-STEP FOCUS WIZARD MODAL (OPTION 3) ═══ */}
      {wizardTask && (
        <DailyProgressWizardModal
          isOpen={Boolean(wizardTask)}
          onClose={() => {
            setWizardTask(null);
            setWizardReport(null);
          }}
          task={wizardTask}
          projectId={projectId}
          initialReport={wizardReport}
          onSuccess={() => {
            setWizardTask(null);
            setWizardReport(null);
            load(projectId, viewMode, myStakeholderId);
          }}
        />
      )}

      {/* ═══ DAILY OBSTRUCTION MODAL (ADR-0008 / ADR-0009) ═══ */}
      {isObstructionModalOpen && (
        <DailyObstructionModal
          isOpen={isObstructionModalOpen}
          onClose={() => setIsObstructionModalOpen(false)}
          projectId={projectId}
          onSuccess={() => {
            setIsObstructionModalOpen(false);
            load(projectId, viewMode, myStakeholderId);
          }}
        />
      )}

      {/* ═══ DAILY REPORT MODAL ═══ */}
      {dailyTask && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto" dir="rtl">
          <div className="w-full max-w-4xl my-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 rounded-t-2xl z-10">
              <div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white">تقرير اليوم الميداني</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{dailyTask.title_ar}</p>
              </div>
              <button
                onClick={() => setDailyTask(null)}
                aria-label="إغلاق النافذة"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <DailyProgressForm
                projectId={projectId}
                preselectedSiteTaskId={dailyTask.id}
                onCancel={() => setDailyTask(null)}
                onSuccess={() => {
                  setDailyTask(null);
                  load(projectId, viewMode, myStakeholderId);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══ STAT CARD (MIN 44PX TARGET / OUTDOOR CONTRAST) ═══════════════ */
function StatCard({
  icon, label, value, color, iconColor, active, onClick, pulse, suffix, isDaylightMode
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  iconColor: string;
  active: boolean;
  onClick: () => void;
  pulse?: boolean;
  suffix?: React.ReactNode;
  isDaylightMode?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`min-h-[72px] relative p-3 sm:p-3.5 rounded-2xl border-2 transition-all cursor-pointer text-start ${color} ${
        active
          ? 'border-emerald-600 ring-2 ring-emerald-500/30 shadow-md scale-[1.02]'
          : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-xs'
      } ${isDaylightMode ? 'border-2 text-slate-950 font-black' : ''}`}
    >
      {pulse && (
        <span className="absolute top-2.5 end-2.5 w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
      )}
      <div className={`mb-1.5 ${iconColor}`}>{icon}</div>
      <div className="text-xl sm:text-2xl font-black leading-tight tracking-tight">
        {value}
        {suffix && <span className="ms-1">{suffix}</span>}
      </div>
      <div className="text-xs font-black opacity-80 mt-0.5">{label}</div>
    </button>
  );
}

/* ═══ TASK CARD (ACCESSIBLE TOUCH TARGETS & OUTDOOR CONTRAST) ══════ */
function SiteTaskCard({
  task, zoneMap, actingId, rejectedReport, isDaylightMode, onStart, onSubmitReview, onReopen, onOpenDaily,
}: {
  task: SiteTask;
  zoneMap: Record<string, string>;
  actingId: string | null;
  rejectedReport?: DailyProgress | null;
  isDaylightMode?: boolean;
  onStart: (t: SiteTask) => void;
  onSubmitReview: (t: SiteTask) => void;
  onReopen: (t: SiteTask) => void;
  onOpenDaily: (t: SiteTask) => void;
}) {
  const isRejected = task.status === 'rejected' || Boolean(rejectedReport);
  const rejectionReason = rejectedReport?.rejection_reason || rejectedReport?.progress_rejection_reason || task.rejection_reason;
  const busy = actingId === task.id;
  const overdue = isOverdue(task);
  const pct = Math.round(Number(task.progress_pct) || 0);
  const borderColor = isRejected
    ? CARD_BORDER.rejected
    : overdue
    ? CARD_BORDER.overdue
    : (CARD_BORDER[task.status] || CARD_BORDER.pending);
  const zoneName = task.zone_id ? zoneMap[task.zone_id] : null;

  // Progress bar color
  const progressColor = overdue
    ? 'bg-rose-500'
    : pct >= 80 ? 'bg-emerald-500' : pct >= 40 ? 'bg-blue-500' : 'bg-amber-500';

  return (
    <div
      className={`rounded-2xl border bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all border-s-4 ${borderColor} overflow-hidden ${
        isDaylightMode
          ? 'border-2 border-slate-700 dark:border-slate-300'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      {/* Card header */}
      <div className="p-4 pb-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${isRejected ? STATUS_CLS.rejected : (STATUS_CLS[task.status] || STATUS_CLS.pending)}`}>
              {isRejected ? 'مرفوضة للمعالجة' : overdue ? '⏰ متأخرة' : STATUS_LABEL[task.status]}
            </span>
            {task.priority !== 'normal' && (
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${
                task.priority === 'urgent'
                  ? 'bg-rose-100 text-rose-700 dark:text-rose-300 dark:bg-rose-950/60'
                  : 'bg-amber-100 text-amber-800 dark:text-amber-300 dark:bg-amber-950/60'
              }`}>
                {PRIORITY_LABEL[task.priority] || task.priority}
              </span>
            )}
          </div>
          {task.task_code && (
            <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 shrink-0 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
              {task.task_code}
            </span>
          )}
        </div>

        <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white mt-2 leading-relaxed line-clamp-2">
          {task.title_ar}
        </h3>

        {zoneName && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-600 dark:text-slate-400 font-bold">
            <MapPin className="w-3.5 h-3.5 text-teal-600" />
            <span>{zoneName}</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="px-4 pb-2.5">
        <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
          <span className="text-slate-600 dark:text-slate-400">نسبة الإنجاز</span>
          <span className="font-mono text-slate-900 dark:text-slate-100">{pct}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200/60 dark:border-slate-700">
          <div
            className={`h-full rounded-full transition-all ${progressColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Date info */}
      <div className="px-4 pb-2.5 flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 font-bold">
        <span className="flex items-center gap-1">
          <CalendarDays className="w-3.5 h-3.5" />
          <span>المخطط: {task.planned_date || 'غير محدد'}</span>
        </span>
        {task.inspection_date && (
          <span className="flex items-center gap-1">
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>الفحص: {task.inspection_date}</span>
          </span>
        )}
      </div>

      {/* Rejection reason */}
      {isRejected && rejectionReason && (
        <div className="mx-4 mb-2.5 flex items-start gap-1.5 text-xs text-rose-800 dark:text-rose-200 bg-rose-50 dark:bg-rose-950/40 rounded-xl p-2.5 border border-rose-200 dark:border-rose-900">
          <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <span className="leading-snug"><strong>سبب الرفض:</strong> {rejectionReason}</span>
        </div>
      )}

      {/* Actions (Touch Target >= 44x44px) */}
      <div className="px-4 py-3 flex items-center gap-2 flex-wrap border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        {busy && <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />}
        {isRejected ? (
          <ActionButton
            onClick={() => onOpenDaily(task)}
            disabled={busy}
            tone="amber"
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            isDaylightMode={isDaylightMode}
          >
            معالجة وإعادة التقديم
          </ActionButton>
        ) : (
          <>
            {task.status === 'pending' && (
              <ActionButton
                onClick={() => onStart(task)}
                disabled={busy}
                tone="blue"
                icon={<PlayCircle className="w-3.5 h-3.5" />}
                isDaylightMode={isDaylightMode}
              >
                ابدأ التنفيذ
              </ActionButton>
            )}
            {task.status === 'in_progress' && (
              <ActionButton
                onClick={() => onSubmitReview(task)}
                disabled={busy}
                tone="violet"
                icon={<UploadCloud className="w-3.5 h-3.5" />}
                isDaylightMode={isDaylightMode}
              >
                رفع للاعتماد
              </ActionButton>
            )}
            {ACTIONABLE.includes(task.status) && (
              <ActionButton
                onClick={() => onOpenDaily(task)}
                disabled={busy}
                tone="emerald"
                icon={<ClipboardCheck className="w-3.5 h-3.5" />}
                isDaylightMode={isDaylightMode}
              >
                تقرير اليوم
              </ActionButton>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ═══ ACTION BUTTON (WCAG 2.5.5 MINIMUM 44X44PX TARGET) ═══════════ */
function ActionButton({
  onClick, disabled, tone, icon, children, ariaLabel, isDaylightMode
}: {
  onClick: () => void;
  disabled?: boolean;
  tone: 'blue' | 'violet' | 'amber' | 'emerald' | 'outline';
  icon: React.ReactNode;
  children: React.ReactNode;
  ariaLabel?: string;
  isDaylightMode?: boolean;
}) {
  const tones: Record<string, string> = {
    blue: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700 shadow-sm',
    violet: 'bg-teal-700 hover:bg-teal-800 text-white border-teal-800 shadow-sm',
    amber: 'bg-amber-600 hover:bg-amber-700 text-white border-amber-700 shadow-sm',
    emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 shadow-sm',
    outline: 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-700',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`min-h-[44px] min-w-[44px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-black cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${tones[tone]} ${isDaylightMode ? 'border-2 text-slate-950 font-black' : ''}`}
    >
      {icon}{children}
    </button>
  );
}

/* ═══ FAST LOG TASK PICKER MODAL (ERGONOMIC FIELD PICKER) ═════════ */
function FastLogTaskPickerModal({
  isOpen, tasks, zoneMap, onClose, onSelectTask,
}: {
  isOpen: boolean;
  tasks: SiteTask[];
  zoneMap: Record<string, string>;
  onClose: () => void;
  onSelectTask: (t: SiteTask) => void;
}) {
  const [query, setQuery] = useState('');
  const candidateTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchStatus = ACTIONABLE.includes(t.status);
      if (!matchStatus) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        t.title_ar?.toLowerCase().includes(q) ||
        t.task_code?.toLowerCase().includes(q)
      );
    });
  }, [tasks, query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4" dir="rtl">
      <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-600 fill-emerald-600" />
            <h3 className="font-black text-sm text-slate-900 dark:text-white">
              تسجيل إنجاز يومي سريع — اختر المهمة
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="p-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن البند أو كود المهمة..."
              autoFocus
              className="w-full min-h-[44px] ps-9 pe-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
            />
          </div>
        </div>

        {/* Task List */}
        <div className="p-3.5 space-y-2 overflow-y-auto flex-1">
          {candidateTasks.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 dark:text-slate-500">
              لا توجد مهام مطابقة قيد التنفيذ أو مفتوحة حالياً
            </div>
          ) : (
            candidateTasks.map((t) => (
              <button
                key={t.id}
                onClick={() => onSelectTask(t)}
                className="w-full min-h-[56px] text-start p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30 transition flex items-center justify-between gap-3 cursor-pointer group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                      {t.task_code || 'بدون كود'}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${STATUS_CLS[t.status] || STATUS_CLS.pending}`}>
                      {STATUS_LABEL[t.status]}
                    </span>
                    {t.zone_id && zoneMap[t.zone_id] && (
                      <span className="text-[10px] text-teal-600 font-bold">
                        📍 {zoneMap[t.zone_id]}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                    {t.title_ar}
                  </h4>
                </div>
                <div className="text-end shrink-0">
                  <span className="text-xs font-mono font-black text-emerald-600">
                    {Math.round(Number(t.progress_pct) || 0)}%
                  </span>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">ابدأ التسجيل →</div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══ QUICK PHOTO CAPTURE MODAL ═══════════════════════════════════ */
function QuickPhotoCaptureModal({
  isOpen, photo, tasks, onClose, onSaveDirect, onProceedToWizard
}: {
  isOpen: boolean;
  photo: { file: File; previewUrl: string; caption: string; linkedTaskId: string };
  tasks: SiteTask[];
  onClose: () => void;
  onSaveDirect: (photo: { url: string; caption: string }) => void;
  onProceedToWizard: (taskId: string, photo: { url: string; caption: string }) => void;
}) {
  const [caption, setCaption] = useState(photo.caption || '');
  const [selectedTaskId, setSelectedTaskId] = useState(photo.linkedTaskId || (tasks[0]?.id || ''));

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveDirect({
      url: photo.previewUrl,
      caption: caption.trim() || 'توثيق ميداني',
    });
  };

  const handleProceed = () => {
    onProceedToWizard(selectedTaskId, {
      url: photo.previewUrl,
      caption: caption.trim() || 'توثيق ميداني',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-3 sm:p-4" dir="rtl">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600" />
            <h3 className="font-black text-sm text-slate-900 dark:text-white">
              توثيق صورة الموقع الملتقطة
            </h3>
          </div>
          <button onClick={onClose} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Photo Preview */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video bg-black/5 dark:bg-slate-800/50 flex items-center justify-center">
            <img src={photo.previewUrl} alt="التقاط ميداني" className="w-full h-full object-cover" />
            <div className="absolute top-2 end-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full font-mono">
              {new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          {/* Linked Task Selector */}
          <div>
            <label className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-1.5">
              ربط الصورة بمهمة في الموقع:
            </label>
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100"
            >
              <option value="">توثيق عام للمشروع (بدون مهمة محددة)</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.task_code ? `[${t.task_code}] ` : ''}{t.title_ar}
                </option>
              ))}
            </select>
          </div>

          {/* Caption Input */}
          <div>
            <label className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-1.5">
              ملاحظات وتعليق على الصورة:
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="مثلاً: أعمال استلام حديد التسليح للسقف بالمنطقة A..."
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs font-bold focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
            <button
              type="button"
              onClick={handleProceed}
              className="w-full sm:flex-1 min-h-[48px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>متابعة لتسجيل الإنجاز بهذه الصورة</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="w-full sm:w-auto min-h-[48px] px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>حفظ الصورة فقط</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══ FULL WORKSPACE SKELETON (ZERO CLS) ══════════════════════════ */
function SiteWorkspaceSkeleton() {
  return (
    <div className="space-y-5 animate-pulse" aria-busy="true" aria-label="جاري تحميل مساحة العمل">
      {/* Header skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-2">
            <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="h-3 w-56 bg-slate-100 dark:bg-slate-800/60 rounded" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-11 w-44 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-11 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800/80 p-3.5 space-y-2 border border-slate-200 dark:border-slate-800">
            <div className="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-700" />
            <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        ))}
      </div>

      {/* Tasks Grid Skeleton */}
      <SiteTasksGridSkeleton />
    </div>
  );
}

function SiteTasksGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 bg-white dark:bg-slate-900">
          <div className="flex justify-between items-center">
            <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="h-4 w-14 bg-slate-100 dark:bg-slate-800 rounded" />
          </div>
          <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-3 w-1/2 bg-slate-100 dark:bg-slate-800 rounded" />
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full" />
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
            <div className="h-11 flex-1 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            <div className="h-11 flex-1 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══ QC RECEIVABLES (TOUCH TARGETS & DAYLIGHT CONTRAST) ══════════ */
function QcReceivablesSection({
  tasks, loading, actingId, isDaylightMode, onApprove, onReject,
}: {
  tasks: SiteTask[];
  loading: boolean;
  actingId: string | null;
  isDaylightMode?: boolean;
  onApprove: (t: SiteTask) => void;
  onReject: (t: SiteTask, note: string) => void;
}) {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const startReject = (t: SiteTask) => { setRejectingId(t.id); setNote(''); };
  const cancelReject = () => { setRejectingId(null); setNote(''); };
  const submitReject = (t: SiteTask) => {
    if (!note.trim()) return;
    onReject(t, note.trim());
    cancelReject();
  };

  return (
    <section className="space-y-3 mt-4">
      <h2 className="flex items-center gap-2 text-sm sm:text-base font-black text-slate-900 dark:text-white">
        <ClipboardCheck className="w-5 h-5 text-cyan-600" />
        {isAr ? 'مستحقات الاستلام الميداني — مراقبة وتأكيد الجودة' : 'Site Inspection Receivables — Quality Control'}
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">({tasks.length})</span>
      </h2>

      {loading ? (
        <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin inline ms-2" />
          <span>{isAr ? 'جاري تحميل طلبات الاستلام...' : 'Loading inspection requests...'}</span>
        </div>
      ) : tasks.length === 0 ? (
        <p className="py-6 text-center text-xs font-bold text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          {isAr ? 'لا توجد مهام بانتظار استلام الجودة حالياً' : 'No tasks pending QC inspection currently'}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`rounded-2xl border border-cyan-200 dark:border-cyan-900/50 bg-white dark:bg-slate-900 p-4 shadow-sm ${
                isDaylightMode ? 'border-2 border-cyan-700' : ''
              }`}
            >
              <div className="space-y-1.5 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">{task.title_ar}</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${STATUS_CLS.qc_pending}`}>{STATUS_LABEL.qc_pending}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 font-bold">
                  <span>نسبة الإنجاز: {Math.round(Number(task.progress_pct) || 0)}%</span>
                  <span>تاريخ الفحص: {task.inspection_date || task.planned_date || 'اليوم'}</span>
                </div>
              </div>

              {rejectingId === task.id ? (
                <div className="space-y-2.5">
                  <textarea
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="سبب الرفض إجباري — اذكر الملاحظات الفنية المطلوب تعديلها..."
                    className="w-full px-3 py-2 rounded-xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs font-bold"
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => submitReject(task)}
                      disabled={!note.trim() || actingId === task.id}
                      className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black cursor-pointer disabled:opacity-50"
                    >
                      {actingId === task.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                      تأكيد الرفض مع الملاحظات
                    </button>
                    <button
                      onClick={cancelReject}
                      className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-black text-slate-600 dark:text-slate-300 cursor-pointer"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onApprove(task)}
                    disabled={actingId === task.id}
                    className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black cursor-pointer disabled:opacity-50 shadow-sm"
                  >
                    {actingId === task.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    اعتماد الاستلام
                  </button>
                  <button
                    onClick={() => startReject(task)}
                    disabled={actingId === task.id}
                    className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-black cursor-pointer disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    رفض بسبب
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
