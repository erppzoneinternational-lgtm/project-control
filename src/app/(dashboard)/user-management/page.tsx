'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  Shield,
  UserPlus,
  Trash2,
  Search,
  Users,
  Database,
  ShieldCheck,
  Activity,
  Clock,
  History,
  Loader2,
  X,
  RefreshCw,
  Filter,
  Info,
  Check,
  ChevronDown,
  CheckCircle2,
  SlidersHorizontal,
  MessageCircle,
  Calendar,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { useModuleAccess } from '@/lib/hooks/useModuleAccess';
import { useUserRoles } from '@/lib/hooks/useUserRoles';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { AuditLogService } from '@/lib/services/auditLog.service';
import { UserActivityService } from '@/lib/services/userActivity.service';
import { UserAuditTab } from '@/components/users/UserAuditTab';
import { UserChangelogModal } from '@/components/users/UserChangelogModal';
import { UserAccessCustomizationModal } from '@/components/users/UserAccessCustomizationModal';
import { UserService, UserProfileFull, generateAdminWhatsAppUrl, generateUserContactWhatsAppUrl } from '@/lib/services/userService';
import { AuditLogEntry, UserWorkDuration } from '@/types';
import {
  ROLE_LABELS,
  ROLE_COLORS,
  MATRIX_ROLES,
  ASSIGNABLE_ROLES,
  APP_MODULES,
  APP_MODULE_GROUPS,
  RACI_COLUMNS,
  RACI_MATRIX,
  RaciCell,
} from '@/lib/rbac/role-matrix';

// Bilingual translations for RACI operational processes
const RACI_PROCESS_MAP: Record<string, { ar: string; en: string }> = {
  'Project setup and master data': {
    ar: 'إعداد وتجهيز المشاريع والبيانات المرجعية',
    en: 'Project setup & master data',
  },
  'Tender & estimation': {
    ar: 'دراسات المناقصات والتسعير الهندسي',
    en: 'Tender & estimation',
  },
  'Budget control': {
    ar: 'التحكم في الميزانية التقديرية والتكاليف',
    en: 'Budget control',
  },
  'IPC preparation and submission': {
    ar: 'إعداد ورفع المستخلصات الدورية (IPC)',
    en: 'IPC preparation & submission',
  },
  'IPC approval and certification': {
    ar: 'مراجعة واعتماد وتصديق المستخلصات',
    en: 'IPC approval & certification',
  },
  'Collections and aging follow-up': {
    ar: 'متابعة التحصيلات المالية وأعمار الديون',
    en: 'Collections & aging follow-up',
  },
  'Cash flow & contractor payments': {
    ar: 'التدفقات النقدية ومدفوعات المقاولين والموردين',
    en: 'Cash flow & contractor payments',
  },
  'VO and deduction review': {
    ar: 'مراجعة أوامر التغيير والمطالبات والخصومات (VO)',
    en: 'VO & deduction review',
  },
  'Site progress & scheduling': {
    ar: 'متابعة تقدم العمل الميداني والجدولة الزمنية',
    en: 'Site progress & scheduling',
  },
  'Procurement & inventory': {
    ar: 'إدارة المشتريات والتوريدات والمستودعات',
    en: 'Procurement & inventory',
  },
  'Dashboard publishing for board view': {
    ar: 'نشر لوحات المعلومات وتقارير مجلس الإدارة',
    en: 'Dashboard publishing for board view',
  },
  'BOQ & Cost Codes Management': {
    ar: 'إدارة جدول الكميات (BOQ) وأكواد التكاليف',
    en: 'BOQ & Cost Codes Management',
  },
  'Planning & Progress Control': {
    ar: 'التخطيط الهندسي ومراقبة نسب الإنجاز والقيمة المكتسبة',
    en: 'Planning & Progress Control',
  },
  'Deliverables Management E1/E2': {
    ar: 'متابعة التسليمات الهندسية واعتمادات الاستشاري E1/E2',
    en: 'Deliverables Management E1/E2',
  },
  'User access and role administration': {
    ar: 'إدارة صلاحيات وأدوار مستخدمي النظام (RBAC)',
    en: 'User access & role administration',
  },
};

// RACI Column Visual Styling & Details
const RACI_HEADER_CONFIG: Record<
  RaciCell,
  {
    letter: string;
    titleAr: string;
    subAr: string;
    badgeCls: string;
    headerBorderCls: string;
    desc: string;
  }
> = {
  responsible: {
    letter: 'R',
    titleAr: 'المسؤول المباشر',
    subAr: 'Responsible - المنفذ',
    badgeCls: 'bg-blue-600 text-white',
    headerBorderCls: 'border-t-4 border-t-blue-500 bg-blue-50/40 dark:bg-blue-950/20',
    desc: 'الشخص أو الدور المكلف بإنجاز المهمة فعلياً',
  },
  accountable: {
    letter: 'A',
    titleAr: 'المساءل والمعتمد',
    subAr: 'Accountable - صاحب القرار',
    badgeCls: 'bg-amber-600 text-white',
    headerBorderCls: 'border-t-4 border-t-amber-500 bg-amber-50/40 dark:bg-amber-950/20',
    desc: 'صاحب المساءلة النهائية والاعتماد الرسمي',
  },
  consulted: {
    letter: 'C',
    titleAr: 'المستشار الفني',
    subAr: 'Consulted - يؤخذ رأيه',
    badgeCls: 'bg-emerald-600 text-white',
    headerBorderCls: 'border-t-4 border-t-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20',
    desc: 'الجهة الاستشارية التي تقدم الدعم الفني وتراجع المخرجات',
  },
  informed: {
    letter: 'I',
    titleAr: 'المُخطر والمتابع',
    subAr: 'Informed - يُبلّغ بالنتائج',
    badgeCls: 'bg-indigo-600 text-white',
    headerBorderCls: 'border-t-4 border-t-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20',
    desc: 'الجهات التي يتم إخطارها بالنتائج والتطورات',
  },
};

interface ProfileRow {
  id: string;
  user_id?: string;
  full_name?: string;
  full_name_ar?: string;
  email?: string;
}

const AVATAR_PALETTES = [
  { bg: 'from-emerald-500 to-teal-700 text-white', ring: 'ring-emerald-500/20' },
  { bg: 'from-blue-600 to-indigo-700 text-white', ring: 'ring-blue-500/20' },
  { bg: 'from-violet-600 to-purple-700 text-white', ring: 'ring-violet-500/20' },
  { bg: 'from-amber-500 to-orange-600 text-white', ring: 'ring-amber-500/20' },
  { bg: 'from-rose-500 to-pink-600 text-white', ring: 'ring-rose-500/20' },
  { bg: 'from-cyan-600 to-blue-700 text-white', ring: 'ring-cyan-500/20' },
];

function getUserAvatarStyle(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length];
}

function RolePills({ roles }: { roles: string[] }) {
  if (!roles || roles.length === 0) {
    return <span className="text-muted-foreground/60 text-xs italic">—</span>;
  }
  return (
    <div className="flex flex-wrap justify-center sm:justify-start gap-1.5">
      {roles.map((role) => (
        <span
          key={role}
          className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-semibold border shadow-2xs transition-transform hover:scale-[1.02] ${
            ROLE_COLORS[role] || 'bg-muted text-muted-foreground border-border'
          }`}
        >
          {ROLE_LABELS[role] || role}
        </span>
      ))}
    </div>
  );
}

export default function UserManagementPage() {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const queryClient = useQueryClient();
  const router = useRouter();

  // Search & Filters
  const [search, setSearch] = useState('');
  const [moduleSearch, setModuleSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'active_today' | 'admins'>('all');
  const [expandedRolesUserId, setExpandedRolesUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'users' | 'permissions' | 'raci' | 'audit_logs'>('users');
  const [customizingUser, setCustomizingUser] = useState<UserProfileFull | null>(null);
  const [isCustomizationModalOpen, setIsCustomizationModalOpen] = useState(false);
  const [selectedUserChangelog, setSelectedUserChangelog] = useState<UserWorkDuration | null>(null);
  const [isChangelogModalOpen, setIsChangelogModalOpen] = useState(false);
  const [selectedModuleGroup, setSelectedModuleGroup] = useState<string>('all');
  const [isRefetching, setIsRefetching] = useState(false);
  const [showWorkflowGuide, setShowWorkflowGuide] = useState(false);

  // Screen reader live announcement state
  const [srAnnouncement, setSrAnnouncement] = useState('');

  const { isAdmin, hasRole, isLoading: loadingViewerRoles, user } = useUserRoles();
  const canViewAdmin = isAdmin || hasRole('ceo') || hasRole('coo') || hasRole('chairman');

  const {
    data: profiles,
    isLoading: loadingProfiles,
    refetch: refetchProfiles,
  } = useQuery({
    queryKey: ['admin-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const {
    data: userRoles,
    isLoading: loadingRoles,
    refetch: refetchRoles,
  } = useQuery({
    queryKey: ['admin-user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_roles').select('*');
      if (error) throw error;
      return data;
    },
  });

  // Sync tab from URL query params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'pending' || tab === 'audit_logs' || tab === 'permissions' || tab === 'raci' || tab === 'users') {
        setActiveTab(tab);
      }
    }
  }, []);

  // Realtime subscription: Auto-reflect user updates (names, roles, status) across admin portal
  useEffect(() => {
    const channelName = 'admin-profiles-realtime-listener';
    try {
      if (typeof supabase?.getChannels === 'function') {
        const existing = supabase.getChannels().find(
          (c) => c.topic === `realtime:${channelName}` || c.topic === channelName
        );
        if (existing && typeof supabase?.removeChannel === 'function') {
          supabase.removeChannel(existing);
        }
      }
    } catch {
      // ignore cleanup errors
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
          queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
        }
      )
      .subscribe();

    const handleProfileUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('pzone:profile-updated', handleProfileUpdated);
    }

    return () => {
      try {
        if (typeof supabase?.removeChannel === 'function') {
          supabase.removeChannel(channel);
        }
      } catch {
        // ignore removal error
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('pzone:profile-updated', handleProfileUpdated);
      }
    };
  }, [queryClient]);

  // Pending activation users (active account with 0 roles assigned)
  const pendingUsers = useMemo(() => {
    return (profiles || []).filter((p: any) => {
      if (p.is_active === false) return false;
      if (p.status === 'pending_activation') return true;
      return !p.roles || p.roles.length === 0;
    });
  }, [profiles]);

  // Fetch full audit logs for work duration calculation and changelog
  const {
    data: allAuditLogs = [],
    isLoading: loadingAuditLogs,
    refetch: refetchLogs,
  } = useQuery<AuditLogEntry[]>({
    queryKey: ['admin-all-audit-logs'],
    queryFn: () => AuditLogService.getFullChangelog({ limit: 500 }),
    staleTime: 60 * 1000,
  });

  // Manual refresh handler
  const handleManualRefresh = async () => {
    setIsRefetching(true);
    try {
      await Promise.all([refetchProfiles(), refetchRoles(), refetchLogs()]);
      toast.success('تم تحديث البيانات بنجاح');
      setSrAnnouncement('تم تحديث بيانات المستخدمين والصلاحيات بنجاح');
    } catch {
      toast.error('تعذر تحديث البيانات');
    } finally {
      setIsRefetching(false);
    }
  };

  // Compute work duration and changelog metrics for each user profile
  const userMetricsMap = useMemo(() => {
    const map: Record<string, UserWorkDuration> = {};
    (profiles || []).forEach((prof: ProfileRow) => {
      const targetUserId = prof.id;
      const rolesForUser = (userRoles || []).filter((r: { user_id: string; role: string }) => r.user_id === targetUserId);
      const activeRoles = rolesForUser.map((r: { user_id: string; role: string }) => r.role);
      map[targetUserId] = UserActivityService.getUserWorkMetrics(
        { ...prof, id: targetUserId, roles: activeRoles },
        allAuditLogs
      );
    });
    return map;
  }, [profiles, userRoles, allAuditLogs]);

  // Online count
  const onlineCount = useMemo(() => {
    return Object.values(userMetricsMap).filter((m) => m?.isOnline).length;
  }, [userMetricsMap]);

  // Active today count
  const activeTodayCount = useMemo(() => {
    return Object.values(userMetricsMap).filter((m) => (m?.todayWorkMinutes ?? 0) > 0).length;
  }, [userMetricsMap]);

  // Total changes count sum
  const totalChangesSum = useMemo(() => {
    return Object.values(userMetricsMap).reduce((acc, m) => acc + (m?.totalChangesCount ?? 0), 0);
  }, [userMetricsMap]);

  // Admins count
  const adminCount = useMemo(() => {
    return (userRoles || []).filter((r: { role: string }) => r.role === 'admin').length;
  }, [userRoles]);

  // NOTE: user_roles is a non-updatable VIEW over profiles.roles (text[]).
  // Writes must go through profiles.roles directly.
  const addRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { data: prof, error: fetchErr } = await supabase
        .from('profiles')
        .select('roles')
        .eq('id', userId)
        .maybeSingle();
      if (fetchErr) throw fetchErr;
      const nextRoles = Array.from(new Set([...(((prof?.roles as string[]) ?? [])), role]));
      const { error } = await supabase
        .from('profiles')
        .update({ roles: nextRoles, is_active: true, updated_at: new Date().toISOString() })
        .eq('id', userId);
      if (error) throw error;
      return { userId, role };
    },
    onSuccess: (variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      const roleLabel = ROLE_LABELS[variables.role] || variables.role;
      toast.success(`تم إضافة دور ${roleLabel} بنجاح`);
      setSrAnnouncement(`تم إضافة دور ${roleLabel} بنجاح للمستخدم`);
    },
    onError: (err: Error) => toast.error(err.message || 'فشل إضافة الدور'),
  });

  const removeRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { data: prof, error: fetchErr } = await supabase
        .from('profiles')
        .select('roles')
        .eq('id', userId)
        .maybeSingle();
      if (fetchErr) throw fetchErr;
      const nextRoles = (((prof?.roles as string[]) ?? [])).filter((r) => r !== role);
      const { error } = await supabase
        .from('profiles')
        .update({ roles: nextRoles, updated_at: new Date().toISOString() })
        .eq('id', userId);
      if (error) throw error;
      return { userId, role };
    },
    onSuccess: (variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      const roleLabel = ROLE_LABELS[variables.role] || variables.role;
      toast.success(`تم إزالة دور ${roleLabel} بنجاح`);
      setSrAnnouncement(`تم إزالة دور ${roleLabel} بنجاح`);
    },
    onError: (err: Error) => toast.error(err.message || 'فشل إزالة الدور'),
  });

  const { data: moduleAccessList, isLoading: loadingModuleAccess } = useModuleAccess();

  const cycleModuleAccess = useMutation({
    mutationFn: async ({
      role,
      modulePath,
      moduleLabel,
      currentState,
      allowedRoles,
      editRoles,
    }: {
      role: string;
      modulePath: string;
      moduleLabel: string;
      currentState: 'hidden' | 'view' | 'edit';
      allowedRoles: string[];
      editRoles: string[];
    }) => {
      let newAllowed = [...allowedRoles];
      let newEdit = [...editRoles];

      let nextState: 'hidden' | 'view' | 'edit' = 'view';
      if (currentState === 'hidden') {
        if (!newAllowed.includes(role)) newAllowed.push(role);
        nextState = 'view';
      } else if (currentState === 'view') {
        if (!newEdit.includes(role)) newEdit.push(role);
        nextState = 'edit';
      } else {
        newAllowed = newAllowed.filter((r) => r !== role);
        newEdit = newEdit.filter((r) => r !== role);
        nextState = 'hidden';
      }

      const { error } = await supabase.from('contract_module_access').upsert(
        {
          module_path: modulePath,
          module_label: moduleLabel,
          allowed_roles: newAllowed,
          edit_roles: newEdit,
        },
        { onConflict: 'module_path' }
      );
      if (error) throw error;
      return { role, modulePath, moduleLabel, nextState };
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['contract_module_access'] });
      const stateNames: Record<string, string> = {
        hidden: 'مخفي',
        view: 'عرض فقط',
        edit: 'عرض وتعديل',
      };
      const stateName = stateNames[res.nextState] || res.nextState;
      const roleName = ROLE_LABELS[res.role] || res.role;
      toast.success(`تم تحديث صلاحية ${res.moduleLabel} لدور ${roleName}: (${stateName})`);
      setSrAnnouncement(`تم تغيير صلاحية ${res.moduleLabel} لدور ${roleName} إلى ${stateName}`);
    },
    onError: (err: Error) => toast.error(err.message || 'فشل تحديث الصلاحيات'),
  });

  const isLoading = loadingProfiles || loadingRoles || loadingModuleAccess;

  if (loadingViewerRoles) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] p-8 text-center space-y-4" dir="rtl">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center animate-pulse">
          <Shield className="w-8 h-8 text-primary animate-pulse" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-base font-bold text-foreground">جاري فحص صلاحيات الوصول...</h2>
          <p className="text-xs text-muted-foreground">التحقق من أمان الجلسة ومستوى الاعتماد الإداري</p>
        </div>
        <Loader2 className="w-5 h-5 text-primary animate-spin" />
      </div>
    );
  }

  if (!canViewAdmin) {
    router.replace('/');
    return null;
  }

  const filteredProfiles = useMemo(() => {
    return (profiles || []).filter((p: ProfileRow) => {
      const targetUserId = p.user_id || p.id;
      const rolesForUser = (userRoles || []).filter((r: { user_id: string; role: string }) => r.user_id === targetUserId);
      const activeRoles = rolesForUser.map((r: { user_id: string; role: string }) => r.role);
      const metric = userMetricsMap[targetUserId];

      // Text search
      const q = search.trim().toLowerCase();
      if (q) {
        const matchesName = (p.full_name || '').toLowerCase().includes(q) || (p.full_name_ar || '').toLowerCase().includes(q);
        const matchesEmail = (p.email || '').toLowerCase().includes(q);
        const matchesRole = activeRoles.some((r) => (ROLE_LABELS[r] || r).toLowerCase().includes(q));
        if (!matchesName && !matchesEmail && !matchesRole) return false;
      }

      // Role filter
      if (roleFilter !== 'all' && !activeRoles.includes(roleFilter)) {
        return false;
      }

      // Status filter
      if (statusFilter === 'online' && !metric?.isOnline) return false;
      if (statusFilter === 'active_today' && (metric?.todayWorkMinutes ?? 0) <= 0) return false;
      if (statusFilter === 'admins' && !activeRoles.includes('admin')) return false;

      return true;
    });
  }, [profiles, userRoles, userMetricsMap, search, roleFilter, statusFilter]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-[1920px] mx-auto space-y-8" dir="rtl">
      {/* Screen Reader Live Announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {srAnnouncement}
      </div>

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
              <Shield size={24} />
            </span>
            <span>إدارة المستخدمين وصلاحيات النظام</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            تعيين أدوار المستخدمين وضبط مصفوفة الصلاحيات الديناميكية للوحدات ومصفوفة RACI المرجعية
          </p>
        </div>

        {/* Stats Badges, Workflow Guide & Refresh */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowWorkflowGuide((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer shadow-xs ${
              showWorkflowGuide
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card hover:bg-muted text-foreground border-border hover:border-primary/40'
            }`}
            title="دليل سير العمل وكيفية استخدام المنظومة"
            aria-expanded={showWorkflowGuide}
          >
            <BookOpen size={14} className={showWorkflowGuide ? 'text-primary-foreground' : 'text-primary'} />
            <span>دليل سير العمل</span>
          </button>

          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefetching}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-border bg-card hover:bg-muted text-foreground transition-all cursor-pointer shadow-xs disabled:opacity-50"
            title="تحديث البيانات"
            aria-label="تحديث البيانات من السيرفر"
          >
            <RefreshCw size={14} className={isRefetching ? 'animate-spin text-primary' : 'text-muted-foreground'} />
            <span className="hidden sm:inline">تحديث</span>
          </button>

          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-foreground bg-card px-3.5 py-2 rounded-xl border border-border shadow-xs">
            <Users size={17} className="text-primary shrink-0" />
            <span>
              {profiles?.length || 0} مستخدم
              {onlineCount > 0 && (
                <span className="ms-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  ({onlineCount} متصل)
                </span>
              )}
            </span>
          </div>
        </div>
      </header>

      {/* Interactive Workflow Guide — كيف تعمل منظومة الصلاحيات؟ */}
      {showWorkflowGuide && (
        <section 
          className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 p-5 sm:p-6 shadow-sm transition-all"
          aria-label="دليل سير عمل إدارة الصلاحيات والمستخدمين"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-2xs">
                <Sparkles size={20} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-foreground">
                  دليل سير العمل — كيف تعمل منظومة إدارة الصلاحيات والمستخدمين؟
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  خريطة تفاعلية توضح المسار المعتمد من تسجيل الحساب حتى الحوكمة والتدقيق الميداني
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowWorkflowGuide(false)}
              className="self-end sm:self-auto p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              aria-label="إغلاق دليل سير العمل"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Stage 1 */}
            <div className="rounded-xl border border-border/80 bg-background/80 p-4 space-y-2.5 shadow-2xs hover:border-amber-500/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  المرحلة 01
                </span>
                <UserPlus size={16} className="text-amber-500" />
              </div>
              <h3 className="text-xs font-bold text-foreground">التسجيل والاعتماد الإداري</h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                يسجل المستخدم حسابه فتُحفظ بياناته بحالة معلقة بتبويب (طلبات التفعيل). يقوم مسؤول النظام بمراجعة الطلب، تحديد رقم الواتساب المعتمد، وتفعيل الحساب.
              </p>
            </div>

            {/* Stage 2 */}
            <div className="rounded-xl border border-border/80 bg-background/80 p-4 space-y-2.5 shadow-2xs hover:border-primary/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                  المرحلة 02
                </span>
                <Shield size={16} className="text-primary" />
              </div>
              <h3 className="text-xs font-bold text-foreground">تعيين الأدوار الوظيفية (19 دوراً)</h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                يُسند للمستخدم دوره التخصصي (مدير مشروع، مهندس مكتب فني، مهندس موقع، مدير جودة، تخطيط). يمكن إسناد أكثر من دور لنفس المستخدم.
              </p>
            </div>

            {/* Stage 3 */}
            <div className="rounded-xl border border-border/80 bg-background/80 p-4 space-y-2.5 shadow-2xs hover:border-sky-500/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                  المرحلة 03
                </span>
                <ShieldCheck size={16} className="text-sky-500" />
              </div>
              <h3 className="text-xs font-bold text-foreground">الصلاحيات الدقيقة ومصفوفة RACI</h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                تمنح الصلاحيات تلقائياً بناءً على الدور، مع إمكانية التخصيص الاستثنائي (Custom Overrides) لكل مستخدم، وضبط مصفوفة المسؤوليات RACI للمشروع.
              </p>
            </div>

            {/* Stage 4 */}
            <div className="rounded-xl border border-border/80 bg-background/80 p-4 space-y-2.5 shadow-2xs hover:border-emerald-500/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  المرحلة 04
                </span>
                <Activity size={16} className="text-emerald-500" />
              </div>
              <h3 className="text-xs font-bold text-foreground">ساعات العمل والتدقيق اللحظي</h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                تتبع لحظي للاتصال المباشر (Live Pulse)، واحتساب آلي لساعات العمل المسجلة والتعديلات مع إمكانية استخراج تقارير Excel كاملة لأغراض التدقيق.
              </p>
            </div>
          </div>
        </section>
      )}

      <main className="space-y-6">
        {/* Navigation Tabs */}
        <nav
          className="flex flex-wrap gap-2 border-b border-border pb-3"
          role="tablist"
          aria-label="أقسام إدارة المستخدمين والصلاحيات"
        >
          <button
            type="button"
            role="tab"
            id="tab-pending"
            aria-selected={activeTab === 'pending'}
            aria-controls="panel-pending"
            onClick={() => {
              setActiveTab('pending');
              setSrAnnouncement('تم الانتقال إلى تبويب طلبات التفعيل المعلقة');
            }}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'pending'
                ? 'bg-amber-500 text-slate-950 shadow-xs font-bold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <UserPlus size={16} />
            <span>طلبات التفعيل المعلقة</span>
            {pendingUsers.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-amber-400 text-slate-950">
                {pendingUsers.length}
              </span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            id="tab-users"
            aria-selected={activeTab === 'users'}
            aria-controls="panel-users"
            onClick={() => {
              setActiveTab('users');
              setSrAnnouncement('تم الانتقال إلى تبويب إدارة المستخدمين والأدوار');
            }}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'users'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Users size={16} />
            <span>إدارة المستخدمين والأدوار</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-permissions"
            aria-selected={activeTab === 'permissions'}
            aria-controls="panel-permissions"
            onClick={() => {
              setActiveTab('permissions');
              setSrAnnouncement('تم الانتقال إلى تبويب مصفوفة صلاحيات الوحدات');
            }}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'permissions'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <ShieldCheck size={16} />
            <span>مصفوفة صلاحيات الوحدات (Module Access)</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-raci"
            aria-selected={activeTab === 'raci'}
            aria-controls="panel-raci"
            onClick={() => {
              setActiveTab('raci');
              setSrAnnouncement('تم الانتقال إلى تبويب مصفوفة RACI المرجعية');
            }}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'raci'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Activity size={16} />
            <span>مصفوفة RACI المرجعية</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-audit-logs"
            aria-selected={activeTab === 'audit_logs'}
            aria-controls="panel-audit-logs"
            onClick={() => {
              setActiveTab('audit_logs');
              setSrAnnouncement('تم الانتقال إلى تبويب ساعات العمل وسجل التدقيق');
            }}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'audit_logs'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Clock size={16} />
            <span>ساعات العمل وسجل التدقيق (Audit & Work Logs)</span>
          </button>
        </nav>

        {/* Tab 0: Pending Activation Users */}
        {activeTab === 'pending' && (
          <section
            id="panel-pending"
            role="tabpanel"
            aria-labelledby="tab-pending"
            className="bg-card rounded-2xl border border-border p-4 sm:p-6 shadow-xs space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <UserPlus className="text-amber-500" size={20} />
                  <span>طلبات التسجيل وتفعيل الحسابات الجديدة</span>
                  {pendingUsers.length > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30">
                      {pendingUsers.length} طلب بانتظار المراجعة
                    </span>
                  )}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  المستخدمون الجدد الذين أتموا التسجيل وبانتظار اعتماد الأدوار، نطاق المشاريع، وتفعيل الصلاحيات من قبل الإدارة
                </p>
              </div>

              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <span>تحديث فوري للطلبات</span>
              </div>
            </div>

            {pendingUsers.length === 0 ? (
              <div className="py-16 text-center space-y-3 bg-muted/20 rounded-2xl border border-dashed border-border">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={28} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-foreground">لا توجد طلبات تفعيل معلقة حالياً</h3>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    جميع المستخدمين المسجلين في النظام تم تفعيل حساباتهم وتعيين أدوارهم بنجاح. أي تسجيل جديد سيظهر هنا فوراً.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingUsers.map((pendingUser: any) => {
                  const regDate = pendingUser.created_at
                    ? new Date(pendingUser.created_at).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : '—';

                  const contactWhatsAppUrl = generateUserContactWhatsAppUrl({
                    phone: pendingUser.phone,
                    fullName: pendingUser.full_name,
                    email: pendingUser.email,
                  });

                  return (
                    <div
                      key={pendingUser.id}
                      className="rounded-2xl border border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40 transition-all p-4 flex flex-col justify-between space-y-4 shadow-xs"
                    >
                      <div className="space-y-3">
                        {/* Top: Avatar & Badge */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center font-black text-sm">
                              {pendingUser.full_name?.charAt(0) || pendingUser.email?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <h3 className="font-bold text-foreground text-sm leading-tight">
                                {pendingUser.full_name || 'مستخدم بدون اسم'}
                              </h3>
                              <p className="text-xs text-muted-foreground font-mono dir-ltr text-end mt-0.5">
                                {pendingUser.email}
                              </p>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
                            بانتظار التفعيل
                          </span>
                        </div>

                        {/* Details */}
                        <div className="space-y-1.5 text-xs text-muted-foreground pt-1 border-t border-border/50">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Calendar size={12} className="text-muted-foreground/80" />
                              <span>تاريخ التسجيل:</span>
                            </span>
                            <span className="font-medium text-foreground">{regDate}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Shield size={12} className="text-muted-foreground/80" />
                              <span>الحالة الحالية:</span>
                            </span>
                            <span className="font-medium text-amber-600 dark:text-amber-400">
                              {pendingUser.status || 'معلق (بدون أدوار)'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                        {contactWhatsAppUrl ? (
                          <a
                            href={contactWhatsAppUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition-colors"
                            title="مراسلة المستخدم عبر واتساب"
                          >
                            <MessageCircle size={14} />
                            <span className="hidden sm:inline">واتساب</span>
                          </a>
                        ) : (
                          <a
                            href={`mailto:${pendingUser.email}?subject=${encodeURIComponent('بخصوص تفعيل حسابك على Pzone Portal')}`}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-500/10 hover:bg-slate-500/20 text-slate-600 dark:text-slate-400 border border-border transition-colors"
                            title="لا يوجد هاتف مسجل — مراسلة عبر البريد الإلكتروني"
                          >
                            <MessageCircle size={14} className="opacity-50" />
                            <span className="hidden sm:inline">بريد</span>
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setCustomizingUser(pendingUser);
                            setIsCustomizationModalOpen(true);
                          }}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-xs cursor-pointer hover:scale-[1.02]"
                        >
                          <SlidersHorizontal size={13} />
                          <span>تخصيص وتفعيل الحساب</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Tab 1: User Management */}
        {activeTab === 'users' && (
          <section
            id="panel-users"
            role="tabpanel"
            aria-labelledby="tab-users"
            className="space-y-6"
          >
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Card 1: All Users */}
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all');
                  setRoleFilter('all');
                }}
                className={`p-4 rounded-2xl border text-start transition-all cursor-pointer ${
                  statusFilter === 'all' && roleFilter === 'all'
                    ? 'bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/40 shadow-xs ring-1 ring-primary/30'
                    : 'bg-card hover:bg-muted/40 border-border hover:border-primary/30 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">إجمالي المستخدمين</span>
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Users size={16} />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-black text-foreground font-mono">
                  {profiles?.length || 0}
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  مستخدم مسجل في المنظومة
                </div>
              </button>

              {/* Card 2: Online Now */}
              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'online' ? 'all' : 'online')}
                className={`p-4 rounded-2xl border text-start transition-all cursor-pointer ${
                  statusFilter === 'online'
                    ? 'bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent border-emerald-500/50 shadow-xs ring-1 ring-emerald-500/30'
                    : 'bg-card hover:bg-muted/40 border-border hover:border-emerald-500/30 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">المتصلون الآن</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {onlineCount}
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  جلسة نشطة حالياً بالنظام
                </div>
              </button>

              {/* Card 3: Active Today */}
              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'active_today' ? 'all' : 'active_today')}
                className={`p-4 rounded-2xl border text-start transition-all cursor-pointer ${
                  statusFilter === 'active_today'
                    ? 'bg-gradient-to-br from-purple-500/15 via-purple-500/5 to-transparent border-purple-500/50 shadow-xs ring-1 ring-purple-500/30'
                    : 'bg-card hover:bg-muted/40 border-border hover:border-purple-500/30 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">نشاط اليوم</span>
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Clock size={16} />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">
                  {activeTodayCount}
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  سجلوا ساعات عمل وتفاعل اليوم
                </div>
              </button>

              {/* Card 4: Admins */}
              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'admins' ? 'all' : 'admins')}
                className={`p-4 rounded-2xl border text-start transition-all cursor-pointer ${
                  statusFilter === 'admins'
                    ? 'bg-gradient-to-br from-rose-500/15 via-rose-500/5 to-transparent border-rose-500/50 shadow-xs ring-1 ring-rose-500/30'
                    : 'bg-card hover:bg-muted/40 border-border hover:border-rose-500/30 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">مسؤولو النظام</span>
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                    <Shield size={16} />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
                  {adminCount}
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  بصلاحيات إدارية كاملة (Admin)
                </div>
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-muted/30 border border-border">
              <div className="flex flex-wrap items-center gap-2.5 flex-1">
                {/* Search Input */}
                <div className="relative w-full sm:w-72">
                  <Search className="absolute right-3.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <input
                    id="user-search-input"
                    type="text"
                    placeholder="بحث بالاسم، البريد أو الدور..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    aria-label="البحث عن مستخدم بالاسم أو البريد الإلكتروني"
                    className="w-full pe-10 ps-9 py-2 text-xs sm:text-sm rounded-xl border border-input bg-background outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-muted-foreground/60"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      aria-label="مسح نص البحث"
                      className="absolute left-2.5 top-2 p-0.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Role Filter Dropdown */}
                <div className="relative">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="pe-8 ps-3 py-2 text-xs rounded-xl border border-input bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer font-medium transition-all hover:border-primary/40"
                  >
                    <option value="all">كل الأدوار الوظيفية</option>
                    {ASSIGNABLE_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r] || r}
                      </option>
                    ))}
                  </select>
                  <span className="absolute left-2.5 top-3 pointer-events-none text-muted-foreground">
                    <ChevronDown size={13} />
                  </span>
                </div>

                {/* Status Filter Chips */}
                <div className="hidden sm:flex flex-wrap items-center gap-1.5 border-s border-border ps-2.5">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      statusFilter === 'all'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    الكل
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('online')}
                    className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                      statusFilter === 'online'
                        ? 'bg-emerald-500 text-white'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>المتصلون</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('active_today')}
                    className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      statusFilter === 'active_today'
                        ? 'bg-purple-600 text-white'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    نشط اليوم
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('admins')}
                    className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      statusFilter === 'admins'
                        ? 'bg-rose-600 text-white'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    مدراء النظام
                  </button>
                </div>
              </div>

              {/* Counter & Clear Filter */}
              <div className="flex items-center gap-2.5 justify-between sm:justify-end text-xs text-muted-foreground font-medium shrink-0">
                {(search || roleFilter !== 'all' || statusFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setRoleFilter('all');
                      setStatusFilter('all');
                    }}
                    className="text-[11px] font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <X size={12} />
                    <span>إعادة ضبط الفلاتر</span>
                  </button>
                )}
                <span className="px-2.5 py-1 rounded-lg bg-background border border-border text-foreground font-mono text-[11px]">
                  عرض {filteredProfiles.length} من أصل {profiles?.length || 0}
                </span>
              </div>
            </div>

            {/* Table Area */}
            {isLoading ? (
              <div className="overflow-x-auto rounded-2xl border border-border bg-card">
                <table className="w-full text-sm text-end border-collapse min-w-[1050px]">
                  <caption className="sr-only">جاري تحميل قائمة المستخدمين</caption>
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                      <th scope="col" className="px-5 py-4 font-semibold text-end min-w-[280px]">المستخدم</th>
                      <th scope="col" className="px-5 py-4 font-semibold text-end min-w-[360px]">الأدوار المعينة</th>
                      <th scope="col" className="px-4 py-4 font-semibold text-center min-w-[150px]">ساعات العمل</th>
                      <th scope="col" className="px-4 py-4 font-semibold text-center min-w-[140px]">سجل التعديلات</th>
                      {isAdmin && <th scope="col" className="px-4 py-4 font-semibold text-start min-w-[180px]">إضافة دور</th>}
                      {isAdmin && <th scope="col" className="px-4 py-4 font-semibold text-center min-w-[150px]">تخصيص الصلاحيات</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[1, 2, 3, 4, 5].map((idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-muted/70 shrink-0" />
                            <div className="space-y-1.5 flex-1">
                              <div className="h-3.5 bg-muted rounded w-32" />
                              <div className="h-2.5 bg-muted/60 rounded w-44" />
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-1.5">
                            <div className="h-6 w-24 bg-muted/80 rounded-lg" />
                            <div className="h-6 w-20 bg-muted/80 rounded-lg" />
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="h-6 w-20 bg-muted rounded-xl mx-auto" />
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="h-7 w-24 bg-muted rounded-xl mx-auto" />
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-4 text-start">
                            <div className="h-8 w-28 bg-muted rounded-xl" />
                          </td>
                        )}
                        {isAdmin && (
                          <td className="px-4 py-4 text-center">
                            <div className="h-8 w-28 bg-muted rounded-xl mx-auto" />
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : filteredProfiles.length === 0 ? (
              <div className="py-16 text-center space-y-3 bg-muted/20 rounded-2xl border border-dashed border-border">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                  <Search size={22} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-foreground">لا يوجد مستخدمون مطابقون لمعايير البحث أو الفلترة</h3>
                  <p className="text-xs text-muted-foreground">
                    {search || roleFilter !== 'all' || statusFilter !== 'all'
                      ? 'جرب تغيير شروط البحث أو الفلاتر المحددة'
                      : 'لا يوجد مستخدمون مسجلون في النظام حالياً'}
                  </p>
                </div>
                {(search || roleFilter !== 'all' || statusFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setRoleFilter('all');
                      setStatusFilter('all');
                    }}
                    className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
                  >
                    إعادة ضبط الفلاتر
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-border shadow-xs bg-card">
                <table className="w-full text-sm text-end border-collapse min-w-[1050px]">
                  <caption className="sr-only">قائمة المستخدمين المسجلين، أدوارهم، وساعات العمل وسجل التعديلات</caption>
                  <thead>
                    <tr className="border-b border-border bg-muted/50 text-muted-foreground text-xs font-bold uppercase tracking-wider">
                      <th scope="col" className="px-5 py-4 font-bold text-end min-w-[280px]">المستخدم</th>
                      <th scope="col" className="px-5 py-4 font-bold text-end min-w-[360px]">الأدوار المعينة</th>
                      <th scope="col" className="px-4 py-4 font-bold text-center min-w-[150px]">ساعات العمل</th>
                      <th scope="col" className="px-4 py-4 font-bold text-center min-w-[140px]">سجل التعديلات</th>
                      {isAdmin && <th scope="col" className="px-4 py-4 font-bold text-start min-w-[180px]">إضافة دور</th>}
                      {isAdmin && <th scope="col" className="px-4 py-4 font-bold text-center min-w-[150px]">تخصيص الصلاحيات</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredProfiles.map((prof: ProfileRow) => {
                      const targetUserId = prof.user_id || prof.id;
                      const rolesForUser = (userRoles || []).filter((r: { user_id: string; role: string }) => r.user_id === targetUserId);
                      const activeRoles = rolesForUser.map((r: { user_id: string; role: string }) => r.role);
                      const metric = userMetricsMap[targetUserId];
                      const isAddingRoleForThisUser = addRole.isPending && addRole.variables?.userId === targetUserId;

                      const isRolesExpanded = expandedRolesUserId === targetUserId;
                      const visibleRoles = isRolesExpanded || rolesForUser.length <= 3 ? rolesForUser : rolesForUser.slice(0, 3);
                      const remainingRolesCount = rolesForUser.length - visibleRoles.length;
                      const avatarStyle = getUserAvatarStyle(prof.full_name || prof.email || prof.id);

                      return (
                        <tr key={prof.id} className="hover:bg-muted/30 transition-colors group">
                          {/* User info */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3.5">
                              <div className="relative shrink-0">
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${avatarStyle.bg} ring-2 ${avatarStyle.ring} flex items-center justify-center font-black text-sm shadow-2xs`}>
                                  {prof.full_name?.charAt(0) || prof.email?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                {metric?.isOnline ? (
                                  <span
                                    className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-background animate-pulse"
                                    title="متصل الآن"
                                    aria-label="المستخدم متصل الآن"
                                  />
                                ) : (
                                  <span
                                    className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700 ring-2 ring-background"
                                    title="غير متصل"
                                    aria-label="المستخدم غير متصل"
                                  />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-foreground text-sm flex items-center gap-1.5 truncate">
                                  <span className="truncate">{prof.full_name || 'مستخدم بدون اسم'}</span>
                                  {metric?.isOnline && (
                                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 shrink-0">
                                      متصل
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground dir-ltr text-end font-mono truncate max-w-[300px]">
                                  {prof.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Roles badges */}
                          <td className="px-5 py-4">
                            <div className="flex flex-wrap items-center gap-1.5 max-w-none">
                              {rolesForUser.length === 0 ? (
                                <span className="text-xs text-muted-foreground/60 italic">لا توجد أدوار معينة</span>
                              ) : (
                                <>
                                  {visibleRoles.map((r: { user_id: string; role: string }) => {
                                    const isRemovingThisRole =
                                      removeRole.isPending &&
                                      removeRole.variables?.userId === targetUserId &&
                                      removeRole.variables?.role === r.role;

                                    return (
                                      <span
                                        key={`${r.user_id ?? targetUserId}-${r.role}`}
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border shadow-2xs transition-all ${
                                          ROLE_COLORS[r.role] || 'bg-muted text-muted-foreground border-border'
                                        }`}
                                      >
                                        <span>{ROLE_LABELS[r.role] || r.role}</span>
                                        {isAdmin && (
                                          <button
                                            type="button"
                                            disabled={removeRole.isPending}
                                            onClick={() => removeRole.mutate({ userId: targetUserId, role: r.role })}
                                            className="hover:text-red-600 dark:hover:text-red-400 p-0.5 rounded transition-colors cursor-pointer disabled:opacity-50 opacity-60 hover:opacity-100"
                                            title={`إزالة دور ${ROLE_LABELS[r.role] || r.role}`}
                                            aria-label={`إزالة دور ${ROLE_LABELS[r.role] || r.role} من المستخدم ${prof.full_name || prof.email}`}
                                          >
                                            {isRemovingThisRole ? (
                                              <Loader2 size={11} className="animate-spin text-destructive" />
                                            ) : (
                                              <Trash2 size={11} />
                                            )}
                                          </button>
                                        )}
                                      </span>
                                    );
                                  })}

                                  {remainingRolesCount > 0 && !isRolesExpanded && (
                                    <button
                                      type="button"
                                      onClick={() => setExpandedRolesUserId(targetUserId)}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border transition-colors cursor-pointer shadow-2xs"
                                      title="عرض باقي الأدوار المعينة"
                                    >
                                      <span>+{remainingRolesCount} أدوار أخرى</span>
                                    </button>
                                  )}

                                  {isRolesExpanded && rolesForUser.length > 3 && (
                                    <button
                                      type="button"
                                      onClick={() => setExpandedRolesUserId(null)}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold text-primary hover:underline cursor-pointer"
                                    >
                                      <span>طي</span>
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>

                          {/* Work Duration Column */}
                          <td className="px-4 py-4 text-center">
                            {metric ? (
                              <div className="inline-flex flex-col items-center gap-1">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 shadow-2xs">
                                  <Clock size={12} className="text-purple-600 dark:text-purple-400" />
                                  <span>{metric.formattedTotal}</span>
                                </span>
                                <div className="flex items-center gap-1 text-[11px] font-mono">
                                  <span className="text-muted-foreground/80">اليوم:</span>
                                  {metric.todayWorkMinutes > 0 ? (
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                      {metric.formattedToday}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground/60">0m</span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground/40 text-xs font-mono">—</span>
                            )}
                          </td>

                          {/* Changelog Modal Trigger */}
                          <td className="px-4 py-4 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                if (metric) {
                                  setSelectedUserChangelog(metric);
                                  setIsChangelogModalOpen(true);
                                }
                              }}
                              aria-label={`عرض سجل تعديلات المستخدم ${prof.full_name || prof.email} (${metric?.totalChangesCount ?? 0} تعديل)`}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-2xs hover:scale-[1.02] ${
                                (metric?.totalChangesCount ?? 0) > 0
                                  ? 'border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50'
                                  : 'border-border bg-card hover:bg-muted text-muted-foreground'
                              }`}
                            >
                              <History size={13} className={(metric?.totalChangesCount ?? 0) > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted-foreground'} />
                              <span>{metric?.totalChangesCount ?? 0} تعديل</span>
                            </button>
                          </td>

                          {/* Add Role Dropdown */}
                          {isAdmin && (
                            <td className="px-4 py-4 text-start">
                              <div className="relative inline-flex items-center">
                                <select
                                  defaultValue=""
                                  disabled={isAddingRoleForThisUser || ASSIGNABLE_ROLES.filter((r) => !activeRoles.includes(r)).length === 0}
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      addRole.mutate({ userId: targetUserId, role: e.target.value });
                                      e.target.value = '';
                                    }
                                  }}
                                  aria-label={`إضافة دور جديد للمستخدم ${prof.full_name || prof.email}`}
                                  className="pe-7 ps-3 py-1.5 text-xs rounded-xl border border-input bg-card hover:bg-muted/80 text-foreground outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer font-medium disabled:opacity-40 transition-all hover:border-primary/40 shadow-2xs"
                                >
                                  <option value="" disabled>
                                    + إضافة دور...
                                  </option>
                                  {ASSIGNABLE_ROLES.filter((r) => !activeRoles.includes(r)).map((r) => (
                                    <option key={r} value={r}>
                                      {ROLE_LABELS[r] || r}
                                    </option>
                                  ))}
                                </select>
                                <span className="absolute left-2 pointer-events-none text-muted-foreground">
                                  {isAddingRoleForThisUser ? (
                                    <Loader2 size={12} className="animate-spin text-primary" />
                                  ) : (
                                    <ChevronDown size={13} />
                                  )}
                                </span>
                              </div>
                            </td>
                          )}

                          {/* Customize Permissions Button */}
                          {isAdmin && (
                            <td className="px-4 py-4 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomizingUser(prof as any);
                                  setIsCustomizationModalOpen(true);
                                }}
                                aria-label={`تخصيص صلاحيات المستخدم ${prof.full_name || prof.email}`}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary hover:text-primary-foreground text-primary text-xs font-bold transition-all cursor-pointer shadow-2xs hover:shadow-xs hover:scale-[1.02]"
                              >
                                <SlidersHorizontal size={13} />
                                <span>تخصيص الصلاحيات</span>
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* Tab 2: Module Access Matrix */}
        {activeTab === 'permissions' && (
          <section
            id="panel-permissions"
            role="tabpanel"
            aria-labelledby="tab-permissions"
            className="bg-card rounded-2xl border border-border p-4 sm:p-6 shadow-xs space-y-6"
          >
            {/* Header & Status Indicator */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <ShieldCheck size={20} className="text-primary" />
                  <span>مصفوفة صلاحيات الوحدات (Role-Module Access Matrix)</span>
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  تحديد مستوى الوصول لكل دور وظيفي لكل مسار تشغيلي في النظام (مخفي / عرض فقط / عرض وتعديل كامل).
                </p>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-3 p-2 rounded-xl bg-muted/40 border border-border text-xs font-semibold shrink-0">
                <span className="flex items-center gap-1.5">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-700">
                    —
                  </span>
                  <span>مخفي (Hidden)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
                    👁
                  </span>
                  <span>عرض فقط (View)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                    ✏️
                  </span>
                  <span>عرض وتعديل (Edit)</span>
                </span>
              </div>
            </div>

            {/* Module Search & Group Filter Pills */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Module Quick Search */}
                <div className="relative w-full sm:w-72">
                  <Search className="absolute right-3 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder="ابحث عن وحدة أو مسار..."
                    value={moduleSearch}
                    onChange={(e) => setModuleSearch(e.target.value)}
                    aria-label="تصفية الموديولات بالاسم أو المسار"
                    className="w-full pe-9 ps-8 py-1.5 text-xs rounded-xl border border-input bg-background outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                  {moduleSearch && (
                    <button
                      type="button"
                      onClick={() => setModuleSearch('')}
                      aria-label="مسح تصفية الموديولات"
                      className="absolute left-2.5 top-2 p-0.5 text-muted-foreground hover:text-foreground rounded-full"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                <div className="text-xs text-muted-foreground">
                  <span>💡 انقر على أي خلية لتبديل حالة الصلاحية: مخفي ← عرض ← تعديل</span>
                </div>
              </div>

              {/* Group Filter Pills */}
              <div className="flex flex-wrap gap-1.5 p-1.5 bg-muted/40 rounded-2xl border border-border">
                <button
                  type="button"
                  onClick={() => setSelectedModuleGroup('all')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    selectedModuleGroup === 'all'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  }`}
                >
                  🌐 كل الموديولات
                </button>

                {APP_MODULE_GROUPS.map((grp) => (
                  <button
                    key={grp.id}
                    type="button"
                    onClick={() => setSelectedModuleGroup(grp.id)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      selectedModuleGroup === grp.id
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                    }`}
                  >
                    <span>{grp.shortLabelAr}</span>
                    <span className="ms-1.5 px-1.5 py-0.5 rounded-full bg-background/60 text-[10px] border border-border">
                      {grp.modules.length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Grouped Module Matrix Tables */}
            <div className="space-y-6">
              {APP_MODULE_GROUPS.filter(
                (grp) => selectedModuleGroup === 'all' || selectedModuleGroup === grp.id
              ).map((group) => {
                const groupModulesFiltered = group.modules.filter(
                  (m) =>
                    m.label.toLowerCase().includes(moduleSearch.toLowerCase()) ||
                    m.path.toLowerCase().includes(moduleSearch.toLowerCase())
                );

                if (moduleSearch && groupModulesFiltered.length === 0) {
                  return null;
                }

                return (
                  <div
                    key={group.id}
                    className="rounded-2xl border border-border overflow-hidden bg-card shadow-xs"
                  >
                    {/* Category Header */}
                    <div className="px-4 py-3 bg-muted/70 border-b border-border flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <span>{group.titleAr}</span>
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                        {groupModulesFiltered.length} مسار
                      </span>
                    </div>

                    {/* Matrix Grid Responsive Table */}
                    <div className="overflow-x-auto">
                      <table
                        className="w-full text-sm border-collapse min-w-[1400px] text-end"
                        aria-label={`مصفوفة صلاحيات ${group.titleAr}`}
                      >
                        <caption className="sr-only">صلاحيات الوحدات لمجموعة {group.titleAr}</caption>
                        <thead>
                          <tr className="border-b border-border bg-muted/20 text-muted-foreground">
                            {/* Sticky Module Column Header on the Right in RTL */}
                            <th
                              scope="col"
                              className="sticky right-0 z-20 px-4 py-3 font-bold min-w-[280px] border-s border-border bg-muted/95 backdrop-blur-xs text-foreground shadow-xs"
                            >
                              الوحدة والمسار
                            </th>
                            {MATRIX_ROLES.filter((r) => r !== 'admin').map((role) => (
                              <th
                                key={role}
                                scope="col"
                                className="text-center px-2 py-3 font-semibold border-s border-border min-w-[100px] whitespace-nowrap"
                              >
                                <span
                                  className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold border shadow-2xs ${
                                    ROLE_COLORS[role] || 'bg-muted text-muted-foreground border-border'
                                  }`}
                                >
                                  {ROLE_LABELS[role] || role}
                                </span>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {groupModulesFiltered.map((module) => (
                            <tr key={module.path} className="hover:bg-muted/20 transition-colors group">
                              {/* Sticky Module Path Cell on the Right in RTL */}
                              <td className="sticky right-0 z-10 px-4 py-3 font-semibold text-foreground border-s border-border bg-card group-hover:bg-muted/20 backdrop-blur-xs shadow-xs">
                                <div className="flex items-center gap-2">
                                  <Database size={15} className="text-primary shrink-0" />
                                  <div>
                                    <div className="text-xs font-bold text-foreground">{module.label}</div>
                                    <div className="text-[10px] text-muted-foreground font-mono dir-ltr text-end mt-0.5">
                                      {module.path}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Role Access Cells */}
                              {MATRIX_ROLES.filter((r) => r !== 'admin').map((role) => {
                                const accessRecord = moduleAccessList?.find(
                                  (m) => m.module_path === module.path
                                );
                                const allowedRoles = accessRecord?.allowed_roles || [];
                                const editRoles = accessRecord?.edit_roles || [];
                                const hasView = allowedRoles.includes(role);
                                const hasEdit = editRoles.includes(role);
                                const currentState: 'hidden' | 'view' | 'edit' = hasEdit
                                  ? 'edit'
                                  : hasView
                                  ? 'view'
                                  : 'hidden';

                                const stateConfig = {
                                  hidden: {
                                    label: '—',
                                    stateName: 'مخفي',
                                    cls: 'bg-slate-100 text-slate-400 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700',
                                    hint: 'مخفي — انقر للسماح بالعرض',
                                  },
                                  view: {
                                    label: '👁',
                                    stateName: 'عرض فقط',
                                    cls: 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60 border-blue-300 dark:border-blue-700',
                                    hint: 'عرض فقط — انقر للسماح بالتعديل',
                                  },
                                  edit: {
                                    label: '✏️',
                                    stateName: 'عرض وتعديل',
                                    cls: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60 border-emerald-300 dark:border-emerald-700',
                                    hint: 'عرض وتعديل — انقر للإخفاء',
                                  },
                                };
                                const cfg = stateConfig[currentState];

                                const isCellPending =
                                  cycleModuleAccess.isPending &&
                                 cycleModuleAccess.variables?.modulePath === module.path &&
                                 cycleModuleAccess.variables?.role === role;

                                return (
                                  <td
                                    key={`${module.path}-${role}`}
                                    className="px-2 py-2.5 text-center border-s border-border"
                                  >
                                    <button
                                      type="button"
                                      disabled={!isAdmin || cycleModuleAccess.isPending}
                                      onClick={() =>
                                        cycleModuleAccess.mutate({
                                          role,
                                          modulePath: module.path,
                                          moduleLabel: module.label,
                                          currentState,
                                          allowedRoles,
                                          editRoles,
                                        })
                                      }
                                      aria-label={`تعديل صلاحية ${module.label} لدور ${ROLE_LABELS[role] || role}. الحالة الحالية: ${cfg.stateName}`}
                                      className={`inline-flex items-center justify-center w-8 h-8 rounded-xl text-xs font-bold border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary ${cfg.cls}`}
                                      title={cfg.hint}
                                    >
                                      {isCellPending ? (
                                        <Loader2 size={13} className="animate-spin text-primary" />
                                      ) : (
                                        cfg.label
                                      )}
                                    </button>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Tab 3: RACI Responsibility Matrix */}
        {activeTab === 'raci' && (
          <section
            id="panel-raci"
            role="tabpanel"
            aria-labelledby="tab-raci"
            className="bg-card rounded-2xl border border-border p-4 sm:p-6 shadow-xs space-y-6"
          >
            {/* RACI Intro Banner & Legend Guide */}
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Activity size={20} className="text-primary" />
                <span>مصفوفة RACI المرجعية لتوزيع المسؤوليات والمساءلة</span>
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                خريطة الحوكمة والمساءلة التشغيلية المعتمدة لوظائف الشركة ومراحل العمل الإنشائي والهندسي
              </p>
            </div>

            {/* RACI Meaning Guide Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {(Object.keys(RACI_HEADER_CONFIG) as RaciCell[]).map((key) => {
                const conf = RACI_HEADER_CONFIG[key];
                return (
                  <div
                    key={key}
                    className="p-3.5 rounded-xl border border-border bg-muted/20 flex flex-col justify-between gap-2 shadow-2xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-md flex items-center justify-center font-black text-xs ${conf.badgeCls}`}>
                        {conf.letter}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-foreground">{conf.titleAr}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{conf.subAr}</div>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{conf.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* RACI Table with Sticky Process Column */}
            <div className="rounded-xl border border-border overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table
                  className="w-full text-sm border-collapse min-w-[1000px] text-end"
                  aria-label="مصفوفة RACI للمسؤوليات"
                >
                  <caption className="sr-only">توزيع مسؤوليات مراحل العمل حسب نموذج RACI</caption>
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                      <th
                        scope="col"
                        className="sticky right-0 z-20 px-4 py-3.5 font-bold text-foreground border-s border-border min-w-[280px] bg-muted/95 backdrop-blur-xs shadow-xs"
                      >
                        مرحلة العمل التشغيلية
                      </th>
                      {RACI_COLUMNS.map((column) => {
                        const conf = RACI_HEADER_CONFIG[column.key];
                        return (
                          <th
                            key={column.key}
                            scope="col"
                            className={`text-center px-4 py-3.5 font-bold text-foreground border-s border-border min-w-[190px] ${conf.headerBorderCls}`}
                          >
                            <div className="flex items-center justify-center gap-2">
                              <span className={`w-5 h-5 rounded-md flex items-center justify-center font-black text-xs ${conf.badgeCls}`}>
                                {conf.letter}
                              </span>
                              <div className="text-end sm:text-center">
                                <div className="text-xs font-bold text-foreground">{conf.titleAr}</div>
                                <div className="text-[10px] text-muted-foreground font-normal">{column.label}</div>
                              </div>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {RACI_MATRIX.map((row) => {
                      const processDetails = RACI_PROCESS_MAP[row.process] || {
                        ar: row.process,
                        en: row.process,
                      };

                      return (
                        <tr key={row.process} className="hover:bg-muted/20 transition-colors group">
                          {/* Sticky Operational Process Cell on Right in RTL */}
                          <td className="sticky right-0 z-10 px-4 py-3.5 border-s border-border bg-card group-hover:bg-muted/20 backdrop-blur-xs shadow-xs font-semibold text-foreground">
                            <div>
                              <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                <Check size={14} className="text-primary shrink-0" />
                                <span>{processDetails.ar}</span>
                              </div>
                              <div className="text-[10px] text-muted-foreground font-mono dir-ltr text-end mt-0.5">
                                {processDetails.en}
                              </div>
                            </div>
                          </td>

                          {/* RACI Role Pills */}
                          {RACI_COLUMNS.map((column) => (
                            <td
                              key={`${row.process}-${column.key}`}
                              className="px-3 py-3.5 text-center border-s border-border align-top"
                            >
                              <RolePills roles={row[column.key]} />
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Tab 4: User Audit Logs & Work Hours */}
        {activeTab === 'audit_logs' && (
          <UserAuditTab
            profiles={profiles || []}
            isLoadingProfiles={loadingProfiles}
          />
        )}
      </main>

      {/* User Changelog Modal */}
      <UserChangelogModal
        isOpen={isChangelogModalOpen}
        onClose={() => setIsChangelogModalOpen(false)}
        userMetrics={selectedUserChangelog}
        allUserLogs={allAuditLogs}
      />

      {/* User Access Customization Modal */}
      <UserAccessCustomizationModal
        user={customizingUser}
        isOpen={isCustomizationModalOpen}
        onClose={() => {
          setIsCustomizationModalOpen(false);
          setCustomizingUser(null);
        }}
        onSaved={handleManualRefresh}
        adminUserId={user?.id}
      />
    </div>
  );
}
