'use client';

/**
 * TopNav — شريط التنقل العلوي (بديل الـ Sidebar)
 * ─────────────────────────────────────────────
 * Row 1: brand + المجموعات (قيادة/مشاريع/شركاء/موقع/تخطيط/مكتب فني/عقود/إدارة) + بحث + أدوات
 * Row 2: صفحات المجموعة النشطة (sub-nav) — يتبع الصفحة الحالية تلقائيًا
 * Theme: Emerald Neutral — accent واحد، من غير تدرجات
 */
import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard, FolderKanban, PlusCircle, UserCheck, FileSpreadsheet,
  ListTodo, GanttChartSquare, ClipboardCheck, HardHat, Split, BarChart3,
  PackageCheck, BarChart2, FileText, Building2, Shield, ChevronDown,
  Globe, LogOut, Menu, X, ShieldCheck, Briefcase, GitFork,
  AlertTriangle, DollarSign, ShieldAlert, User, KeyRound, ChevronLeft, ChevronRight,
  Megaphone, SlidersHorizontal, FoldVertical, UnfoldVertical, Compass, Sparkles, Sun, Moon, Archive,
} from 'lucide-react';
import { isFocusedProjectsMode, resolveFocusedHomePath } from '@/lib/config/module-visibility';
import { useNavPreferencesStore } from '@/lib/stores/useNavPreferencesStore';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/lib/stores/useAuthStore';
import { useUserRoles } from '@/lib/hooks/useUserRoles';
import { useModuleAccess } from '@/lib/hooks/useModuleAccess';
import { canAccessPath, canEditPath } from '@/lib/rbac/access-control';
import { RoleRoutingService } from '@/lib/services/roleRouting.service';
import { NotificationCenter } from './NotificationCenter';
import { FontCustomizerButton } from './FontCustomizerButton';
import { useProjectStore } from '@/lib/stores/useProjectStore';
import { ProjectService } from '@/lib/services/project.service';
import { supabase } from '@/lib/supabase';
import { Project } from '@/types';
import { ThemeToggleSwitch } from '@/components/ui/ThemeToggleSwitch';
import { ProjectStructureDropdown } from '@/components/ui/ProjectStructureDropdown';
import { ScrySearch } from '@/components/ui/ScrySearch';
import { isDeploymentEnv } from '@/lib/utils/env';
import { ChangePasswordModal } from '@/components/auth/ChangePasswordModal';
import { usePortalTourStore } from '@/lib/stores/usePortalTourStore';
import { useSystemChangelogStore } from '@/lib/stores/useSystemChangelogStore';
import { LATEST_PORTAL_VERSION } from '@/lib/changelog/systemUpdates';
import { TORoleWorkflowGuide } from '@/components/technical-office/TORoleWorkflowGuide';

function getInitials(name?: string, email?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    }
    return name.trim().slice(0, 2).toUpperCase();
  }
  if (email && email.trim()) {
    return email.trim().slice(0, 2).toUpperCase();
  }
  return 'PZ';
}

function TopNavSearchInner({ isAr }: { isAr: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentUrlSearch = searchParams?.get('search') || '';
  const [topSearch, setTopSearch] = useState(currentUrlSearch);

  useEffect(() => {
    setTopSearch(currentUrlSearch);
  }, [currentUrlSearch]);

  const handleGlobalSearchChange = (val: string) => {
    setTopSearch(val);
    if (pathname === '/projects') {
      const rawQuery =
        typeof window !== 'undefined' ? window.location.search : searchParams?.toString() || '';
      const params = new URLSearchParams(rawQuery);
      if (val) {
        params.set('search', val);
      } else {
        params.delete('search');
      }
      const queryStr = params.toString() ? `?${params.toString()}` : '';
      router.replace(`/projects${queryStr}`, { scroll: false });
    }
  };

  const handleGlobalSearchSubmit = (val: string) => {
    setTopSearch(val);
    const rawQuery =
      pathname === '/projects' && typeof window !== 'undefined'
        ? window.location.search
        : searchParams?.toString() || '';
    const params = new URLSearchParams(rawQuery);
    if (val) {
      params.set('search', val);
    } else {
      params.delete('search');
    }
    const queryStr = params.toString() ? `?${params.toString()}` : '';
    if (pathname !== '/projects') {
      router.push(`/projects${queryStr}`);
    } else {
      router.replace(`/projects${queryStr}`, { scroll: false });
    }
  };

  return (
    <ScrySearch
      value={topSearch}
      onChange={handleGlobalSearchChange}
      onSubmit={handleGlobalSearchSubmit}
      placeholder={isAr ? 'بحث سريع... (⌘K)' : 'Quick search... (⌘K)'}
      width={240}
      compact={true}
      defaultOpen={Boolean(currentUrlSearch && pathname === '/projects')}
      autoCloseOnBlur={true}
      hotkey="⌘K"
      isRtl={isAr}
      ariaLabel={isAr ? 'البحث السريع في المنظومة' : 'Quick Search'}
    />
  );
}

function TopNavSearch({ isAr }: { isAr: boolean }) {
  return (
    <React.Suspense fallback={<div className="w-10 h-10" />}>
      <TopNavSearchInner isAr={isAr} />
    </React.Suspense>
  );
}

interface NavItem { label: string; labelEn: string; href: string; icon: React.ElementType }
interface NavGroup { key: string; labelAr: string; labelEn: string; icon: React.ElementType; items: NavItem[]; allowedRoles?: string[] }

// Enterprise module groups aligned with all 22 canonical `public.user_role` values
const GROUPS: NavGroup[] = [
  {
    key: 'dashboards', labelAr: 'لوحات القيادة', labelEn: 'Dashboards', icon: LayoutDashboard,
    allowedRoles: [
      'admin', 'ceo', 'coo', 'coo_assistant', 'chairman', 'board_member',
      'commercial_manager', 'project_manager', 'planning_manager', 'planning_engineer',
      'cost_control', 'finance', 'contract_admin', 'estimator',
      'technical_office', 'to_manager', 'to_engineer', 'qc_inspector',
      'site_engineer', 'procurement', 'inventory',
    ],
    items: [
      { label: 'اللوحة المركزية', labelEn: 'Central Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'لوحة المشاريع', labelEn: 'Projects Dashboard', href: '/projects/dashboard', icon: BarChart3 },
      { label: 'نبض البرنامج الزمني', labelEn: 'Schedule Pulse (P6)', href: '/schedule-pulse', icon: GanttChartSquare },
    ],
  },
  {
    key: 'projects', labelAr: 'إعداد المشاريع', labelEn: 'Project Setup', icon: FolderKanban,
    allowedRoles: [
      'admin', 'ceo', 'coo', 'coo_assistant', 'chairman', 'board_member',
      'project_manager', 'contract_admin', 'commercial_manager',
      'planning_manager', 'planning_engineer', 'estimator',
    ],
    items: [
      { label: 'بوابة إعداد المشاريع', labelEn: 'Project Setup Portal', href: '/project-setup', icon: FolderKanban },
      { label: 'قائمة المشاريع', labelEn: 'Projects List', href: '/projects', icon: FolderKanban },
      { label: 'إضافة مشروع جديد', labelEn: 'New Project', href: '/projects/new', icon: PlusCircle },
    ],
  },
  {
    key: 'stakeholders', labelAr: 'الشركاء وأصحاب المصلحة', labelEn: 'Stakeholders & Entities', icon: UserCheck,
    allowedRoles: [
      'admin', 'ceo', 'coo', 'coo_assistant', 'chairman', 'board_member', 'viewer',
      'project_manager', 'contract_admin', 'commercial_manager',
      'planning_manager', 'planning_engineer', 'estimator',
    ],
    items: [
      { label: 'محفظة الجهات والمطورين', labelEn: 'Entities & Developers Hub', href: '/clients', icon: Building2 },
      { label: 'دليل الأفراد وممثلي الجهات', labelEn: 'Stakeholders Directory', href: '/stakeholders', icon: UserCheck },
    ],
  },
  {
    key: 'site', labelAr: 'الموقع والتنفيذ', labelEn: 'Site Execution', icon: HardHat,
    allowedRoles: [
      'admin', 'ceo', 'coo', 'chairman',
      'project_manager', 'planning_manager', 'planning_engineer',
      'site_engineer', 'qc_inspector',
    ],
    items: [
      { label: 'مساحة عمل الموقع', labelEn: 'Site Workspace', href: '/site-workspace', icon: HardHat },
      { label: 'التقدم اليومي', labelEn: 'Daily Progress', href: '/planning/daily-progress', icon: ClipboardCheck },
      { label: 'لوحة مراقبة الجودة (QC)', labelEn: 'QC Inspections', href: '/qc-dashboard', icon: ShieldCheck },
      { label: 'بنود الكميات (BOQ)', labelEn: 'BOQ Items', href: '/boq', icon: FileSpreadsheet },
      { label: 'مهامي الميدانية', labelEn: 'My Tasks', href: '/my-tasks', icon: ListTodo },
      { label: 'سير العمل', labelEn: 'Workflow', href: '/workflow', icon: GitFork },
      { label: 'السلامة والصحة المهنية (HSE)', labelEn: 'HSE & Safety', href: '/hse', icon: ShieldAlert },
    ],
  },
  {
    key: 'planning', labelAr: 'التخطيط', labelEn: 'Planning', icon: GanttChartSquare,
    allowedRoles: [
      'admin', 'ceo', 'coo', 'chairman',
      'project_manager', 'planning_manager', 'planning_engineer',
      'commercial_manager', 'cost_control', 'estimator', 'qc_inspector',
    ],
    items: [
      { label: 'مركز التخطيط', labelEn: 'Planning Hub', href: '/planning', icon: GanttChartSquare },
      { label: 'بنود الكميات (BOQ)', labelEn: 'BOQ Items', href: '/boq', icon: FileSpreadsheet },
      { label: 'الأنشطة والمكتبة', labelEn: 'Activities & Library', href: '/planning/activities', icon: ListTodo },
      { label: 'مهام الموقع والتحكم', labelEn: 'Site Tasks Control', href: '/planning/site-tasks', icon: ListTodo },
      { label: 'الجدول الزمني (Baseline)', labelEn: 'Schedule Baseline', href: '/planning/baseline', icon: GanttChartSquare },
      { label: 'التقدم اليومي', labelEn: 'Daily Progress', href: '/planning/daily-progress', icon: ClipboardCheck },
      { label: 'سير العمل', labelEn: 'Workflow', href: '/workflow', icon: GitFork },
      { label: 'توزيع الكميات (Allocations)', labelEn: 'Allocations', href: '/planning/allocation', icon: Split },
      { label: 'اللوحة التجارية', labelEn: 'Planning Dashboard', href: '/planning/dashboard', icon: BarChart3 },
    ],
  },
  {
    key: 'technical', labelAr: 'المكتب الفني', labelEn: 'Technical Office', icon: PackageCheck,
    allowedRoles: [
      'admin', 'ceo', 'coo', 'chairman',
      'project_manager', 'planning_manager', 'planning_engineer', 'commercial_manager',
      'technical_office', 'to_manager', 'to_engineer',
    ],
    items: [
      { label: 'بوابة المكتب الفني', labelEn: 'TO Portal', href: '/technical-office', icon: PackageCheck },
      { label: 'لوحة المكتب الفني', labelEn: 'TO Dashboard', href: '/to-dashboard', icon: BarChart2 },
      { label: 'التسليمات E1 / E2', labelEn: 'Deliverables E1/E2', href: '/deliverables', icon: PackageCheck },
      { label: 'تسليمات الإدارة (COO)', labelEn: 'COO Overview', href: '/coo/deliverables', icon: BarChart2 },
      { label: 'مهامي الهندسية والاعتمادات', labelEn: 'My Engineering Tasks', href: '/to-tasks', icon: ClipboardCheck },
      { label: 'إدارة الوثائق والمخططات', labelEn: 'Document Control', href: '/document-control', icon: FileSpreadsheet },
      { label: 'مهامي الهندسية', labelEn: 'My Tasks', href: '/my-tasks', icon: ClipboardCheck },
    ],
  },
  {
    key: 'reports', labelAr: 'التقارير', labelEn: 'Reports', icon: FileSpreadsheet,
    allowedRoles: [
      'admin', 'ceo', 'coo', 'coo_assistant', 'chairman', 'board_member',
      'project_manager', 'contract_admin', 'commercial_manager',
      'planning_manager', 'planning_engineer', 'estimator',
      'technical_office', 'to_manager', 'to_engineer', 'cost_control', 'finance',
    ],
    items: [
      { label: 'مستودع التقارير الشامل (106+ تقرير)', labelEn: 'All Reports & Dashboards (106+)', href: '/reports', icon: FileSpreadsheet },
      { label: 'تقارير المحفظة والمشاريع', labelEn: 'Portfolio Reports', href: '/reports?category=portfolio', icon: BarChart3 },
      { label: 'تقارير الجدول والتخطيط الزمني', labelEn: 'Schedule & P6 Reports', href: '/reports?category=schedule', icon: GanttChartSquare },
      { label: 'تقارير التكاليف والقيمة المكتسبة', labelEn: 'Cost Control & EVM', href: '/reports?category=cost', icon: DollarSign },
      { label: 'تقارير الفواتير والسيولة', labelEn: 'Billing & Cash Flow', href: '/reports?category=cashflow', icon: FileText },
    ],
  },
  {
    key: 'contracts', labelAr: 'العقود', labelEn: 'Contracts', icon: FileText,
    allowedRoles: [
      'admin', 'ceo', 'coo', 'chairman', 'board_member',
      'commercial_manager', 'contract_admin', 'cost_control', 'finance',
      'estimator', 'ipc_clerk', 'project_manager', 'planning_engineer',
    ],
    items: [
      { label: 'العقود', labelEn: 'Contracts', href: '/contracts', icon: FileText },
      { label: 'المطالبات وأوامر التغيير', labelEn: 'Claims & VOs', href: '/contracts/claims', icon: AlertTriangle },
      { label: 'مراقبة التكاليف والقيمة المكتسبة', labelEn: 'Cost Control & EVM', href: '/cost-control', icon: DollarSign },
      { label: 'المناقصات والعطاءات', labelEn: 'Tenders & Bids', href: '/tender', icon: Briefcase },
      { label: 'مقاولو الباطن', labelEn: 'Subcontractors', href: '/subcontractors', icon: Building2 },
    ],
  },
  {
    key: 'admin', labelAr: 'الإدارة', labelEn: 'Admin', icon: Shield,
    allowedRoles: ['admin', 'ceo', 'chairman', 'coo', 'coo_assistant', 'board_member'],
    items: [
      { label: 'لوحة مجلس الإدارة', labelEn: 'Board Dashboard', href: '/board', icon: LayoutDashboard },
      { label: 'المستخدمين والصلاحيات', labelEn: 'Users & RACI', href: '/user-management', icon: UserCheck },
      { label: 'بوابة إدارة النظام', labelEn: 'Admin Portal', href: '/system-admin', icon: Shield },
    ],
  },
];

/**
 * Smart active route checker:
 * - Exact match (currentPathname === itemHref) always wins.
 * - Prefix match (currentPathname.startsWith(itemHref + '/')) is active ONLY IF
 *   no other item in allGroupItems has a longer matching href (i.e. more specific match).
 */
export function isItemActive(
  itemHref: string,
  currentPathname: string,
  allGroupItems?: { href: string }[]
): boolean {
  if (currentPathname === itemHref) return true;
  if (!itemHref || itemHref === '/') return false;

  const prefix = itemHref.endsWith('/') ? itemHref : itemHref + '/';
  if (!currentPathname.startsWith(prefix)) return false;

  if (allGroupItems && allGroupItems.length > 0) {
    const hasMoreSpecificMatch = allGroupItems.some((other) => {
      if (other.href === itemHref) return false;
      const otherPrefix = other.href.endsWith('/') ? other.href : other.href + '/';
      const otherMatchesExact = currentPathname === other.href;
      const otherMatchesPrefix = other.href !== '/' && currentPathname.startsWith(otherPrefix);
      return (otherMatchesExact || otherMatchesPrefix) && other.href.length > itemHref.length;
    });
    if (hasMoreSpecificMatch) return false;
  }

  return true;
}

export const TopNav: React.FC<{
  isDark: boolean;
  onThemeToggle: () => void;
  isScrolled?: boolean;
}> = ({ isDark, onThemeToggle, isScrolled = false }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { locale, toggleLocale } = useLanguage();
  const isAr = locale === 'ar';
  const { user, signOut } = useAuth();
  const { roles, isAdmin } = useUserRoles();
  const { data: dbAccessRules } = useModuleAccess();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showRoleGuideModal, setShowRoleGuideModal] = useState(false);
  const openTourSelector = usePortalTourStore((s) => s.openSelector);
  const { openChangelog, hasUnreadUpdate } = useSystemChangelogStore();

  // Navigation Customization & Density Preferences
  const {
    layoutMode,
    densityMode,
    widgets,
    openCustomizer,
    collapsedSidebarGroups,
    toggleSidebarGroup,
    collapseAllSidebarGroups,
    expandAllSidebarGroups,
  } = useNavPreferencesStore();

  const [showMoreTools, setShowMoreTools] = useState(false);
  const moreToolsRef = useRef<HTMLDivElement>(null);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const userMenuButtonRef = useRef<HTMLButtonElement>(null);
  const menuItemRefs = useRef<(HTMLAnchorElement | HTMLButtonElement | null)[]>([]);

  // Close more tools on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (moreToolsRef.current && !moreToolsRef.current.contains(e.target as Node)) {
        setShowMoreTools(false);
      }
    };
    if (showMoreTools) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showMoreTools]);

  // Live user profile display name sync
  const [displayedName, setDisplayedName] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    async function loadUserName() {
      if (!user?.id) return;
      try {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, full_name_ar, full_name_en')
          .eq('id', user.id)
          .maybeSingle();

        if (mounted && data) {
          const name = data.full_name || data.full_name_ar || data.full_name_en;
          if (name) setDisplayedName(name);
        }
      } catch {
        // Fallback silently
      }
    }
    loadUserName();

    const onProfileUpdated = (e: any) => {
      if (e?.detail?.full_name) {
        setDisplayedName(e.detail.full_name);
      } else {
        loadUserName();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('pzone:profile-updated', onProfileUpdated);
    }

    const channelName = `topnav-profile-${user?.id || 'anon'}`;
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
        { 
          event: '*', 
          schema: 'public', 
          table: 'profiles',
          ...(user?.id ? { filter: `id=eq.${user.id}` } : {})
        },
        () => {
          loadUserName();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('pzone:profile-updated', onProfileUpdated);
      }
      try {
        if (typeof supabase?.removeChannel === 'function') {
          supabase.removeChannel(channel);
        }
      } catch {
        // ignore removal error
      }
    };
  }, [user?.id]);

  // Row 2 Sub-Nav horizontal scroll tracking & affordance
  const row2ScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollStart, setCanScrollStart] = useState(false);
  const [canScrollEnd, setCanScrollEnd] = useState(false);

  // Global Project Selection (persisted across all pages)
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const setActiveProjectId = useProjectStore((s) => s.setActiveProjectId);
  const [navProjects, setNavProjects] = useState<Project[]>([]);

  // Extract project ID from URL if currently viewing /projects/[id] (excluding /projects/new and /projects/dashboard)
  const urlProjectId = useMemo(() => {
    if (!pathname || !pathname.startsWith('/projects/')) return null;
    const segments = pathname.split('/').filter(Boolean);
    if (
      segments.length >= 2 &&
      segments[0] === 'projects' &&
      segments[1] !== 'new' &&
      segments[1] !== 'dashboard'
    ) {
      return segments[1];
    }
    return null;
  }, [pathname]);

  const activeNavProject = useMemo(
    () => navProjects.find((p) => p.id === (urlProjectId || activeProjectId)) || navProjects.find((p) => p.id === activeProjectId),
    [navProjects, activeProjectId, urlProjectId]
  );

  useEffect(() => {
    async function loadProjects() {
      try {
        const list = await ProjectService.getProjects({});
        setNavProjects(list || []);
        if (list && list.length > 0) {
          const currentActiveId = useProjectStore.getState().activeProjectId;
          if (urlProjectId) {
            if (currentActiveId !== urlProjectId) {
              setActiveProjectId(urlProjectId);
            }
            return;
          }
          // Preserve 'all' if user explicitly selected All Projects
          if (currentActiveId === 'all') {
            return;
          }
          const exists = list.some((p) => p.id === currentActiveId);
          if (!currentActiveId || !exists) {
            setActiveProjectId(list[0].id);
          }
        }
      } catch {
        // Non-fatal: nav project dropdown remains empty until project list resolves
      }
    }
    loadProjects();
  }, [urlProjectId, user?.email, roles, setActiveProjectId]);

  const handleGlobalProjectSelect = useCallback(
    (nextId: string) => {
      if (!nextId) return;
      setActiveProjectId(nextId);

      // If user selected 'all' while inside a specific /projects/[id] detail page, navigate to /projects portfolio list
      if (nextId === 'all') {
        if (urlProjectId) {
          router.push('/projects');
        }
        return;
      }

      // If on /projects/[id] or /projects/[id]/edit, navigate directly to the newly selected project while preserving active tab/query
      if (urlProjectId && pathname) {
        const segments = pathname.split('/').filter(Boolean);
        const canEditProjects = isAdmin || canEditPath('/projects', roles, isAdmin, dbAccessRules);
        const isEditRoute = segments.length >= 3 && segments[2] === 'edit' && canEditProjects;
        const search = typeof window !== 'undefined' ? window.location.search : '';
        const targetPath = isEditRoute
          ? `/projects/${nextId}/edit${search}`
          : `/projects/${nextId}${search}`;
        router.push(targetPath);
      }
    },
    [dbAccessRules, isAdmin, pathname, roles, router, setActiveProjectId, urlProjectId]
  );

  // Expand normalized canonical + enterprise roles so aliases (e.g. to_manager / to_engineer -> technical_office) resolve cleanly
  const effectiveRoles = useMemo(() => {
    const raw = roles || [];
    const expanded = new Set<string>(raw);
    for (const r of raw) {
      const canonical = RoleRoutingService.normalizeRole(r);
      if (canonical) expanded.add(canonical);
      const enterprise = RoleRoutingService.normalizeEnterpriseRole(r);
      if (enterprise) expanded.add(enterprise);
    }
    return Array.from(expanded);
  }, [roles]);

  const focusedMode = isFocusedProjectsMode();

  // RBAC filtering — role-aware groups + path permissions
  const visibleGroups = useMemo(() => {
    if (focusedMode) {
      const canCreateNewProject =
        isAdmin ||
        (effectiveRoles.length > 0 &&
          canAccessPath('/projects/new', effectiveRoles, isAdmin, dbAccessRules));
      const stakeholderCandidateItems: NavItem[] = [
        {
          label: 'محفظة الجهات والمطورين',
          labelEn: 'Entities & Developers Hub',
          href: '/clients',
          icon: Building2,
        },
        {
          label: 'دليل الأفراد وممثلي الجهات',
          labelEn: 'Stakeholders Directory',
          href: '/stakeholders',
          icon: UserCheck,
        },
      ];
      const allowedStakeholderItems = stakeholderCandidateItems.filter(
        (it) =>
          isAdmin ||
          (effectiveRoles.length > 0 &&
            canAccessPath(it.href, effectiveRoles, isAdmin, dbAccessRules))
      );

      const focusedGroups: NavGroup[] = [
        {
          key: 'projects',
          labelAr: 'إدارة المشاريع',
          labelEn: 'Projects Management',
          icon: FolderKanban,
          items: [
            { label: 'قائمة المشاريع', labelEn: 'Projects List', href: '/projects', icon: FolderKanban },
            ...(canCreateNewProject
              ? [{ label: 'إضافة مشروع جديد', labelEn: 'New Project', href: '/projects/new', icon: PlusCircle }]
              : []),
            { label: 'أرشيف المشاريع', labelEn: 'Projects Archive', href: '/projects/archive', icon: Archive },
          ],
        },
        ...(allowedStakeholderItems.length > 0
          ? [
              {
                key: 'stakeholders',
                labelAr: 'الشركاء وأصحاب المصلحة',
                labelEn: 'Stakeholders & Entities',
                icon: UserCheck,
                items: allowedStakeholderItems,
              },
            ]
          : []),
      ];
      return focusedGroups;
    }

    return GROUPS
      .filter((g) => {
        if (isAdmin) return true;
        if (g.allowedRoles) {
          return g.allowedRoles.some((r) => effectiveRoles.includes(r));
        }
        return true;
      })
      .map((g) => ({
        ...g,
        items: g.items.filter((it) => {
          if (it.href === '/schedule-pulse' && isDeploymentEnv()) {
            return false;
          }
          if (it.href === '/system-admin' && !isAdmin) {
            return false;
          }
          return canAccessPath(it.href, effectiveRoles, isAdmin, dbAccessRules);
        }),
      }))
      .filter((g) => g.items.length > 0);
  }, [focusedMode, effectiveRoles, isAdmin, dbAccessRules]);

  // Flatten all visible items for specificity comparison
  const allNavItems = useMemo(() => visibleGroups.flatMap((g) => g.items), [visibleGroups]);

  // Active group = the group containing the current path
  const activeGroup = useMemo(() => {
    const exact = visibleGroups.find((g) => g.items.some((it) => it.href === pathname));
    if (exact) return exact;
    const prefix = visibleGroups.find((g) => g.items.some((it) => isItemActive(it.href, pathname, allNavItems)));
    return prefix || visibleGroups[0];
  }, [visibleGroups, pathname, allNavItems]);

  const [openMenu, setOpenMenu] = useState<string | null>(null);

  // Close user menu on outside click
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  // Global keydown: Escape closes open menus and restores focus
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showUserMenu) {
          setShowUserMenu(false);
          userMenuButtonRef.current?.focus();
        }
        if (mobileOpen) {
          setMobileOpen(false);
        }
        if (openMenu) {
          setOpenMenu(null);
        }
      }
    };
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [showUserMenu, mobileOpen, openMenu]);

  // Check scroll position for Row 2 sub-nav (RTL and LTR aware)
  const checkRow2Scroll = useCallback(() => {
    const el = row2ScrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll <= 2) {
      setCanScrollStart(false);
      setCanScrollEnd(false);
      return;
    }
    const currentScroll = Math.abs(scrollLeft);
    setCanScrollStart(currentScroll > 4);
    setCanScrollEnd(currentScroll < maxScroll - 4);
  }, []);

  const scrollRow2 = (direction: 'start' | 'end') => {
    const el = row2ScrollRef.current;
    if (!el) return;
    const offset = 220;
    // In RTL, end is negative delta (leftwards in standard modern browsers); start is positive delta.
    const scrollDelta = isAr
      ? (direction === 'end' ? -offset : offset)
      : (direction === 'end' ? offset : -offset);
    el.scrollBy({ left: scrollDelta, behavior: 'smooth' });
  };

  useEffect(() => {
    checkRow2Scroll();
    const handleResize = () => checkRow2Scroll();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [checkRow2Scroll, activeGroup]);

  // Auto-scroll active sub-item into view
  useEffect(() => {
    if (!row2ScrollRef.current) return;
    const activeEl = row2ScrollRef.current.querySelector<HTMLElement>('[aria-current="page"]');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
    const timer = setTimeout(checkRow2Scroll, 300);
    return () => clearTimeout(timer);
  }, [pathname, checkRow2Scroll]);

  // User Avatar keyboard navigation
  const handleAvatarTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setShowUserMenu(true);
      setTimeout(() => {
        menuItemRefs.current[0]?.focus();
      }, 40);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setShowUserMenu(true);
      setTimeout(() => {
        const items = menuItemRefs.current.filter(Boolean);
        items[items.length - 1]?.focus();
      }, 40);
    } else if (e.key === 'Escape' && showUserMenu) {
      e.preventDefault();
      setShowUserMenu(false);
    }
  };

  const handleUserMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const items = menuItemRefs.current.filter(Boolean) as (HTMLAnchorElement | HTMLButtonElement)[];
    if (items.length === 0) return;

    const currentIndex = items.findIndex((el) => el === document.activeElement);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
      items[nextIndex]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
      items[prevIndex]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      items[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      items[items.length - 1]?.focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowUserMenu(false);
      userMenuButtonRef.current?.focus();
    } else if (e.key === 'Tab') {
      setShowUserMenu(false);
    }
  };

  // Group tab keyboard accessibility
  const handleGroupTabKeyDown = (e: React.KeyboardEvent, groupKey: string) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      if (openMenu !== groupKey) {
        e.preventDefault();
        setOpenMenu(groupKey);
      }
    } else if (e.key === 'Escape') {
      if (openMenu) {
        e.preventDefault();
        setOpenMenu(null);
      }
    }
  };

  const go = (href: string) => { router.push(href); setMobileOpen(false); };

  const iconCls = 'w-4 h-4 shrink-0';

  return (
    <header
      data-scrolled={isScrolled ? 'true' : 'false'}
      className={`sticky top-0 z-40 shrink-0 print:hidden transition-[box-shadow,border-color] duration-200 ease-out ${
        isScrolled
          ? 'shadow-md shadow-stone-900/5 dark:shadow-stone-950/40'
          : 'shadow-none'
      }`}
    >
      {/* ═══ Row 1: brand + groups + tools (P-Zone ERP Sticky Frosted Header) ═══ */}
      <div
        className={`h-14 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b flex items-center gap-1 sm:gap-2 px-3 sm:px-4 lg:px-6 transition-[border-color,background-color] duration-200 ${
          isScrolled
            ? 'border-border'
            : 'border-border'
        }`}
      >
        <Link
          id="tour-global-brand"
          href={resolveFocusedHomePath(RoleRoutingService.getHomePath(roles, isAdmin))}
          aria-label={isAr ? 'الرئيسية - P.ZONE' : 'Home - P.ZONE'}
          className="flex items-center gap-2 me-2 2xl:me-4 min-h-[44px] shrink-0 group focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900 focus-visible:outline-none rounded-lg p-1 -m-1 transition-all"
        >
          {/* Official P-Zone ERP Horizontal Logo (Light/Dark) */}
          <img
            src={isDark ? '/erp-assets/horizontal-white-BBqG2TTn.png' : '/erp-assets/horizontal-black-C6SoPpzE.png'}
            alt="P.ZONE"
            width={132}
            height={36}
            decoding="async"
            className="h-8 sm:h-9 w-auto object-contain transition-opacity duration-200 group-hover:opacity-90"
            onError={(e) => { (e.target as HTMLImageElement).src = '/pzone-emblem.png'; }}
          />
        </Link>

        {/* Desktop navigation tabs (Direct Project Management tabs in Focused Mode, or Group dropdowns) */}
        {layoutMode !== 'sidebar' && (
        <nav
          id="tour-global-groups"
          role="navigation"
          aria-label={isAr ? 'التنقل الرئيسي' : 'Main'}
          className="hidden lg:flex items-center gap-1 shrink-0"
        >
          {focusedMode ? (
            visibleGroups.map((g, gIdx) => (
              <React.Fragment key={g.key}>
                {gIdx > 0 && (
                  <span
                    className="h-4 w-px bg-border mx-1 shrink-0"
                    aria-hidden="true"
                  />
                )}
                {g.items.map((it) => {
                  const ItIcon = it.icon;
                  const itemActive = isItemActive(it.href, pathname, allNavItems);
                  return (
                    <Link
                      key={it.href}
                      href={it.href}
                      aria-current={itemActive ? 'page' : undefined}
                      className={`h-9 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
                        itemActive
                          ? 'bg-primary text-primary-foreground shadow-2xs'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <ItIcon className="w-3.5 h-3.5 shrink-0" />
                      <span>{isAr ? it.label : it.labelEn}</span>
                    </Link>
                  );
                })}
              </React.Fragment>
            ))
          ) : (
            visibleGroups.map((g) => {
            const Icon = g.icon;
            const isCurrentGroup = activeGroup?.key === g.key;
            const isMenuOpen = openMenu === g.key;
            return (
              <div
                key={g.key}
                className="relative"
                onMouseLeave={() => setOpenMenu(null)}
              >
                <Link
                  href={g.items[0]?.href || '/projects'}
                  onMouseEnter={() => setOpenMenu(g.key)}
                  onKeyDown={(e) => handleGroupTabKeyDown(e, g.key)}
                  aria-expanded={isMenuOpen}
                  aria-haspopup="menu"
                  aria-current={isCurrentGroup ? 'true' : undefined}
                  className={`h-8.5 px-1.5 xl:px-2 2xl:px-3 rounded-lg text-[11px] 2xl:text-[12px] font-bold flex items-center gap-1 2xl:gap-1.5 whitespace-nowrap transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-stone-900 focus-visible:outline-none ${
                    isCurrentGroup
                      ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-500'
                      : isMenuOpen
                      ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-white'
                      : 'text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{isAr ? g.labelAr : g.labelEn}</span>
                  <ChevronDown className={`w-2.5 h-2.5 opacity-75 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                </Link>

                {/* Dropdown = group pages */}
                {isMenuOpen && (
                  <div
                    role="menu"
                    aria-label={isAr ? g.labelAr : g.labelEn}
                    className="absolute top-full start-0 mt-1 min-w-[250px] rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150 backdrop-blur-md"
                  >
                    <div className="px-3.5 py-1 mb-1 border-b border-stone-100 dark:border-stone-800">
                      <span className="text-[10px] font-black uppercase text-stone-400 tracking-wider">
                        {isAr ? g.labelAr : g.labelEn}
                      </span>
                    </div>
                    {g.items.map((it) => {
                      const ItIcon = it.icon;
                      const itemActive = isItemActive(it.href, pathname, g.items);
                      return (
                        <button
                          key={it.href}
                          role="menuitem"
                          onClick={() => go(it.href)}
                          aria-current={itemActive ? 'page' : undefined}
                          className={`w-[calc(100%-8px)] mx-1 min-h-[44px] flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold text-start transition-colors cursor-pointer rounded-xl focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
                            itemActive
                              ? 'bg-emerald-100/90 dark:bg-emerald-950/90 text-emerald-900 dark:text-emerald-200 border border-emerald-500/40 dark:border-emerald-400/30 font-bold'
                              : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 font-medium'
                          }`}
                        >
                          <ItIcon className={`${iconCls} ${itemActive ? 'text-emerald-800 dark:text-emerald-300' : 'text-stone-400'}`} />
                          <span>{isAr ? it.label : it.labelEn}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
          )}
        </nav>
        )}

        {/* Mobile burger: Accessible tap target >= 44x44px */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? (isAr ? 'إغلاق القائمة الرئيسية' : 'Close main menu') : (isAr ? 'فتح القائمة الرئيسية' : 'Open main menu')}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav-menu"
          className="lg:hidden min-w-[44px] min-h-[44px] p-2.5 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none cursor-pointer flex items-center justify-center transition-colors"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Streamlined Primary Tools (Theme, Tour, Role Guide & Customizer live in FloatingCornerHub) */}
        <div className="ms-auto flex items-center gap-1 shrink-0">
          {/* ScrySearch 3D Flip Search Button (tablet & desktop) */}
          {widgets.showSearch && (
            <div id="tour-global-search" className="hidden md:inline-flex items-center">
              <TopNavSearch isAr={isAr} />
            </div>
          )}

          {/* Global Project Selector */}
          {widgets.showProjectSelector && navProjects.length > 0 && (
            <div id="tour-global-project-selector" className="relative flex items-center">
              <Building2 className="w-3.5 h-3.5 absolute start-2.5 top-1/2 -translate-y-1/2 text-emerald-500 pointer-events-none" />
              <select
                value={urlProjectId || activeProjectId || 'all'}
                onChange={(e) => handleGlobalProjectSelect(e.target.value)}
                aria-label={isAr ? 'المشروع النشط لكافة صفحات المنظومة' : 'Active project across all pages'}
                className="ps-7 pe-2.5 py-1.5 min-h-[36px] rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-300 dark:border-stone-700/80 text-stone-800 dark:text-stone-200 text-[11px] 2xl:text-xs font-bold hover:border-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 max-w-[105px] sm:max-w-[125px] xl:max-w-[135px] 2xl:max-w-[190px] truncate shadow-xs transition-all duration-200 hover:shadow-md cursor-pointer"
                title={isAr ? 'اختر المشروع لتحديث الصفحة الحالية أو اختر كافة المشاريع' : 'Select project or All Projects'}
              >
                <option value="all" className="bg-white dark:bg-stone-900 text-emerald-700 dark:text-emerald-400 font-bold">
                  {isAr ? '🌐 كافة المشاريع (الكل)' : '🌐 All Projects'}
                </option>
                {navProjects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-white dark:bg-stone-900 text-stone-800 dark:text-white">
                    {p.project_code} - {p.project_name || p.project_name_ar}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Project Structure Interactive Dropdown (XL+ screens) */}
          {widgets.showProjectStructure && !focusedMode && (
            <div className="hidden xl:inline-block">
              <ProjectStructureDropdown
                projectId={urlProjectId || activeProjectId}
                projectName={
                  activeNavProject
                    ? (isAr
                        ? (activeNavProject.project_name_ar || activeNavProject.project_name)
                        : (activeNavProject.project_name || activeNavProject.project_name_ar))
                    : undefined
                }
                projectCode={activeNavProject?.project_code}
              />
            </div>
          )}

          {/* Real-time Notification Center (Hidden in Focused Mode per Phase 1 scope) */}
          {widgets.showNotifications && !focusedMode && (
            <div id="tour-global-notifications">
              <NotificationCenter />
            </div>
          )}

          {/* Language toggle: Touch target >= 44x44px (ERP EN / ع pill) */}
          {widgets.showLanguageToggle && (
            <button
              id="tour-global-lang-toggle"
              type="button"
              onClick={toggleLocale}
              title={isAr ? 'التحويل إلى الإنجليزية' : 'تغيير اللغة إلى العربية'}
              aria-label={isAr ? 'Switch language to English' : 'تغيير اللغة إلى العربية'}
              className="min-w-[36px] min-h-[36px] px-2.5 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer flex items-center justify-center focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
            >
              <span>{isAr ? 'EN' : 'ع'}</span>
            </button>
          )}

          {/* Theme toggle: Sun / Moon directly in topbar (ERP standard) */}
          {widgets.showThemeToggle && (
            <button
              id="tour-global-theme-toggle-nav"
              type="button"
              onClick={onThemeToggle}
              title={isDark ? (isAr ? 'التبديل إلى الوضع الفاتح' : 'Switch to light mode') : (isAr ? 'التبديل إلى الوضع الداكن' : 'Switch to dark mode')}
              aria-label={isDark ? (isAr ? 'التبديل إلى الوضع الفاتح' : 'Switch to light mode') : (isAr ? 'التبديل إلى الوضع الداكن' : 'Switch to dark mode')}
              className="min-w-[36px] min-h-[36px] p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer flex items-center justify-center focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}

          {/* User Avatar Menu: Accessible touch target >= 44x44px */}
          <div id="tour-global-user-profile" className="relative" ref={userMenuRef}>
            {(() => {
              const currentDisplayName = displayedName || user?.user_metadata?.full_name || user?.email || 'U';
              return (
                <>
                  <button
                    ref={userMenuButtonRef}
                    id="user-menu-button"
                    type="button"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    onKeyDown={handleAvatarTriggerKeyDown}
                    aria-label={isAr ? 'قائمة الملف الشخصي والحساب' : 'User profile and account menu'}
                    aria-expanded={showUserMenu}
                    aria-haspopup="menu"
                    aria-controls="user-menu"
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer group focus-visible:outline-none rounded-xl"
                  >
                    <span className="w-8.5 h-8.5 rounded-full bg-emerald-600 text-white text-[11px] font-black flex items-center justify-center group-hover:bg-emerald-500 transition-colors shadow-xs ring-2 ring-emerald-500/20 group-focus-visible:ring-2 group-focus-visible:ring-emerald-400 group-focus-visible:ring-offset-2 dark:group-focus-visible:ring-offset-stone-900">
                      {getInitials(currentDisplayName, user?.email)}
                    </span>
                  </button>
                  {showUserMenu ? (
                    <div
                      id="user-menu"
                      role="menu"
                      aria-labelledby="user-menu-button"
                      onKeyDown={handleUserMenuKeyDown}
                      className="absolute top-full end-0 mt-1.5 min-w-[230px] rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                    >
                      <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800">
                        <p className="text-[11px] font-bold text-stone-900 dark:text-white truncate">
                          {currentDisplayName}
                        </p>
                        <p className="text-[10px] text-stone-500 dark:text-stone-400 truncate mt-0.5 text-end font-mono" dir="ltr">
                          {user?.email}
                        </p>
                  {roles && roles.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {roles.slice(0, 2).map((r) => (
                        <span key={r} className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 border border-emerald-500/30">
                          {r}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="py-1">
                  <Link
                    ref={(el) => { menuItemRefs.current[0] = el; }}
                    role="menuitem"
                    href="/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="w-full min-h-[44px] flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none rounded-xl"
                  >
                    <User className="w-4 h-4 text-stone-500 dark:text-stone-400 shrink-0" />
                    <span>{isAr ? 'الملف الشخصي وبياناتي' : 'My Profile & Account'}</span>
                  </Link>

                  {isAdmin && !focusedMode && (
                    <Link
                      role="menuitem"
                      href="/system-admin"
                      onClick={() => setShowUserMenu(false)}
                      className="w-full min-h-[44px] flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none rounded-xl"
                    >
                      <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>{isAr ? 'لوحة تحكم إدارة النظام' : 'System Admin Portal'}</span>
                    </Link>
                  )}

                  <button
                    ref={(el) => { menuItemRefs.current[1] = el; }}
                    role="menuitem"
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowPasswordModal(true);
                    }}
                    className="w-full min-h-[44px] flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer text-start focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none rounded-xl"
                  >
                    <KeyRound className="w-4 h-4 text-stone-500 dark:text-stone-400 shrink-0" />
                    <span>{isAr ? 'تغيير كلمة المرور' : 'Change Password'}</span>
                  </button>

                  {!focusedMode && (
                    <>
                      <button
                        role="menuitem"
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          openTourSelector();
                        }}
                        className="w-full min-h-[44px] flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer text-start focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none rounded-xl"
                      >
                        <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{isAr ? 'الجولة التعريفية التفاعلية' : 'Interactive Guided Tour'}</span>
                      </button>

                      <button
                        role="menuitem"
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          openChangelog();
                        }}
                        className="w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 text-xs font-bold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer text-start focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none rounded-xl"
                      >
                        <div className="flex items-center gap-2.5">
                          <Megaphone className="w-4 h-4 text-amber-500 shrink-0" />
                          <span>{isAr ? 'ما الجديد في التحديث؟ (Change Log)' : "What's New? (Change Log)"}</span>
                        </div>
                        <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                          v{LATEST_PORTAL_VERSION}
                        </span>
                      </button>

                      <button
                        role="menuitem"
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          openCustomizer();
                        }}
                        className="w-full min-h-[44px] flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer text-start focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none rounded-xl"
                      >
                        <SlidersHorizontal className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>{isAr ? 'تخصيص واجهة وشريط التنقل' : 'Customize Navigation & Bar'}</span>
                      </button>
                    </>
                  )}
                </div>

                <div className="pt-1 border-t border-stone-100 dark:border-stone-800">
                  <button
                    ref={(el) => { menuItemRefs.current[2] = el; }}
                    role="menuitem"
                    type="button"
                    onClick={async () => {
                      setShowUserMenu(false);
                      await signOut();
                      router.replace('/login');
                    }}
                    className="w-full min-h-[44px] flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none rounded-xl"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    <span>{isAr ? 'تسجيل خروج' : 'Sign out'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div id="user-menu" hidden aria-hidden="true" />
            )}
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ═══ Row 2: sub-nav of the ACTIVE group (Responsive tablet + desktop, RTL scroll affordance) ═══ */}
      {!focusedMode && activeGroup && densityMode !== 'compact' && layoutMode !== 'sidebar' && (
        <nav
          role="navigation"
          aria-label={isAr ? 'التنقل الفرعي' : 'Sub-navigation'}
          className={`relative hidden md:flex h-[42px] bg-slate-50/90 dark:bg-slate-900/95 border-b items-center justify-between gap-2 px-2 sm:px-3 lg:px-4 group select-none transition-[border-color,background-color] duration-200 ${
            isScrolled
              ? 'border-slate-300 dark:border-slate-700/80 shadow-xs'
              : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          {/* RTL-aware start edge fade indicator */}
          <div
            className={`pointer-events-none absolute start-0 top-0 bottom-0 w-8 z-10 transition-opacity duration-200 bg-gradient-to-r rtl:bg-gradient-to-l from-slate-50 dark:from-slate-900 to-transparent ${
              canScrollStart ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden="true"
          />

          {/* Optional scroll button to start (RTL: right, LTR: left) */}
          {canScrollStart && (
            <button
              type="button"
              onClick={() => scrollRow2('start')}
              aria-label={isAr ? 'تمرير لليمين' : 'Scroll left'}
              className="absolute start-1.5 z-20 w-6 h-6 rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none transition-all cursor-pointer"
            >
              {isAr ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Scrollable sub-nav items with hidden scrollbar and smooth scroll */}
          <div
            ref={row2ScrollRef}
            onScroll={checkRow2Scroll}
            className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden scroll-smooth flex-1 min-w-0 px-1"
          >
            {activeGroup.items.map((it) => {
              const ItIcon = it.icon;
              const itemActive = isItemActive(it.href, pathname, activeGroup.items);
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  aria-current={itemActive ? 'page' : undefined}
                  className={`h-[30px] px-3.5 rounded-lg text-[12px] font-bold flex items-center gap-2 whitespace-nowrap transition-all duration-200 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900 focus-visible:outline-none shrink-0 ${
                    itemActive
                      ? 'bg-emerald-100 dark:bg-emerald-950/90 text-emerald-900 dark:text-emerald-200 border border-emerald-500/40 dark:border-emerald-400/30 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                  }`}
                >
                  <ItIcon className={`w-3.5 h-3.5 shrink-0 ${itemActive ? 'text-emerald-800 dark:text-emerald-300' : 'text-slate-400'}`} />
                  <span>{isAr ? it.label : it.labelEn}</span>
                </Link>
              );
            })}
          </div>

          {/* RTL-aware end edge fade indicator */}
          <div
            className={`pointer-events-none absolute end-0 top-0 bottom-0 w-8 z-10 transition-opacity duration-200 bg-gradient-to-l rtl:bg-gradient-to-r from-slate-50 dark:from-slate-900 to-transparent ${
              canScrollEnd ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden="true"
          />

          {/* Optional scroll button to end (RTL: left, LTR: right) */}
          {canScrollEnd && (
            <button
              type="button"
              onClick={() => scrollRow2('end')}
              aria-label={isAr ? 'تمرير لليسار' : 'Scroll right'}
              className="absolute end-1.5 z-20 w-6 h-6 rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none transition-all cursor-pointer"
            >
              {isAr ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          )}
        </nav>
      )}

      {/* ═══ Mobile drawer ═══ */}
      {mobileOpen ? (
        <nav
          id="mobile-nav-menu"
          role="navigation"
          aria-label={isAr ? 'قائمة الجوال' : 'Mobile navigation'}
          className="lg:hidden bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl border-b border-stone-200 dark:border-stone-800 max-h-[80vh] overflow-y-auto shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 ease-out"
        >
          {/* Active Route Status Badge */}
          <div className="px-4 py-2.5 bg-emerald-50/80 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-900/30 flex items-center justify-between text-xs">
            <span className="text-stone-500 dark:text-stone-400 text-[11px] font-medium">
              {isAr ? 'الصفحة الحالية:' : 'Current page:'}
            </span>
            <span className="inline-flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
              <span>
                {(() => {
                  const allItems = visibleGroups.flatMap((g) => g.items);
                  const activeItem = allItems.find((it) => isItemActive(it.href, pathname, allItems));
                  return activeItem
                    ? (isAr ? activeItem.label : activeItem.labelEn)
                    : (isAr ? 'بي زون' : 'P.ZONE');
                })()}
              </span>
            </span>
          </div>

          {/* Mobile search bar on small viewports */}
          <div className="md:hidden px-4 pt-3 pb-2 border-b border-stone-100 dark:border-stone-800">
            <TopNavSearch isAr={isAr} />
          </div>

          {/* Mobile Project Structure shortcut */}
          {activeProjectId && !focusedMode && (
            <div className="lg:hidden px-4 py-2 border-b border-stone-100 dark:border-stone-800">
              <Link
                href={`/projects/${activeProjectId}`}
                onClick={() => setMobileOpen(false)}
                className="w-full min-h-[44px] px-3 py-2.5 flex items-center gap-2.5 text-xs font-bold text-stone-700 dark:text-stone-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none rounded-xl"
              >
                <Building2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{isAr ? 'عرض هيكل المشروع وتفرعاته' : 'Project Structure & Branches'}</span>
              </Link>
            </div>
          )}

          {/* Mobile Accordion Controls Strip */}
          <div className="px-4 py-2 bg-stone-50/80 dark:bg-stone-900/60 border-b border-stone-200/70 dark:border-stone-800 flex items-center justify-between text-xs">
            <span className="text-xs font-bold text-stone-600 dark:text-stone-300">
              {isAr ? 'أقسام المنظومة' : 'System Modules'}
            </span>

            <button
              type="button"
              onClick={() => {
                const anyExpanded = visibleGroups.some((g) => !collapsedSidebarGroups[g.key]);
                if (anyExpanded) {
                  collapseAllSidebarGroups(visibleGroups.map((g) => g.key));
                } else {
                  expandAllSidebarGroups();
                }
              }}
              aria-label={isAr ? 'طي / توسيع كافة الأقسام' : 'Collapse / Expand all modules'}
              className="min-h-[32px] px-2.5 py-1 rounded-lg hover:bg-stone-200/60 dark:hover:bg-stone-800 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700"
            >
              {visibleGroups.some((g) => !collapsedSidebarGroups[g.key]) ? (
                <>
                  <FoldVertical className="w-3.5 h-3.5 text-stone-500" />
                  <span>{isAr ? 'طي الكل' : 'Collapse'}</span>
                </>
              ) : (
                <>
                  <UnfoldVertical className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{isAr ? 'توسيع الكل' : 'Expand'}</span>
                </>
              )}
            </button>
          </div>

          <div className="px-3 py-2 space-y-1.5">
            {visibleGroups.map((g) => {
              const GroupIcon = g.icon;
              const isGroupCollapsed = Boolean(collapsedSidebarGroups[g.key]);
              const hasActiveChild = g.items.some((it) => isItemActive(it.href, pathname, g.items));

              return (
                <div key={g.key} className="space-y-0.5">
                  {/* Group Header Button */}
                  <button
                    type="button"
                    onClick={() => toggleSidebarGroup(g.key)}
                    aria-expanded={!isGroupCollapsed}
                    className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl transition-all cursor-pointer select-none flex items-center justify-between text-start ${
                      isGroupCollapsed
                        ? 'text-sm font-bold text-stone-900 dark:text-stone-100 bg-stone-100/80 dark:bg-stone-850/80 hover:bg-stone-200/80 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800 shadow-2xs'
                        : 'text-xs font-black uppercase text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100/70 dark:hover:bg-stone-800/50 tracking-wider'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <GroupIcon
                        className={`${
                          isGroupCollapsed ? 'w-4.5 h-4.5' : 'w-4 h-4'
                        } shrink-0 ${
                          hasActiveChild
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isGroupCollapsed
                            ? 'text-stone-700 dark:text-stone-300'
                            : 'text-stone-400'
                        }`}
                      />
                      <span
                        className={`truncate ${
                          hasActiveChild
                            ? 'text-emerald-800 dark:text-emerald-300 font-black'
                            : isGroupCollapsed
                            ? 'text-stone-900 dark:text-stone-100 font-bold'
                            : ''
                        }`}
                      >
                        {isAr ? g.labelAr : g.labelEn}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isGroupCollapsed && (
                        <span className="px-1.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-stone-200/70 dark:bg-stone-700/60 text-stone-600 dark:text-stone-300">
                          {g.items.length}
                        </span>
                      )}
                      <ChevronDown
                        className={`${
                          isGroupCollapsed ? 'w-4 h-4 text-stone-500 dark:text-stone-400' : 'w-3.5 h-3.5 text-stone-400'
                        } transition-transform duration-200 shrink-0 ${
                          isGroupCollapsed ? (isAr ? 'rotate-90' : '-rotate-90') : ''
                        }`}
                      />
                    </div>
                  </button>

                  {/* Group Items */}
                  {!isGroupCollapsed && (
                    <div className="space-y-0.5 ps-1 pe-1 animate-in fade-in duration-100">
                      {g.items.map((it) => {
                        const ItIcon = it.icon;
                        const itemActive = isItemActive(it.href, pathname, g.items);
                        return (
                          <button
                            key={it.href}
                            onClick={() => {
                              setMobileOpen(false);
                              go(it.href);
                            }}
                            aria-current={itemActive ? 'page' : undefined}
                            className={`w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold text-start transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none rounded-xl ${
                              itemActive
                                ? 'bg-emerald-100/90 dark:bg-emerald-950/90 text-emerald-900 dark:text-emerald-200 border-s-4 border-emerald-600 dark:border-emerald-400 ps-3 font-bold'
                                : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                            }`}
                          >
                            <ItIcon className={`w-4 h-4 shrink-0 ${itemActive ? 'text-emerald-800 dark:text-emerald-300' : 'text-stone-400'}`} />
                            <span>{isAr ? it.label : it.labelEn}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* User actions on mobile (Touch targets >= 44x44px) */}
          <div className="py-2 border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/40">
            <p className={`px-4 pb-1 text-[10px] font-black text-stone-400 ${isAr ? 'tracking-normal' : 'uppercase tracking-wider'}`}>
              {isAr ? 'الحساب والأمان' : 'Account & Security'}
            </p>
            <button
              onClick={() => {
                setMobileOpen(false);
                router.push('/profile');
              }}
              className="w-full min-h-[44px] flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none rounded-xl"
            >
              <User className="w-4 h-4 text-stone-400 shrink-0" />
              <span>{isAr ? 'الملف الشخصي وبياناتي' : 'My Profile & Account'}</span>
            </button>
            {isAdmin && !focusedMode && (
              <button
                onClick={() => {
                  setMobileOpen(false);
                  router.push('/system-admin');
                }}
                className="w-full min-h-[44px] flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none rounded-xl"
              >
                <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>{isAr ? 'لوحة تحكم إدارة النظام' : 'System Admin Portal'}</span>
              </button>
            )}

            {!focusedMode && (
              <button
                onClick={() => {
                  setMobileOpen(false);
                  setShowRoleGuideModal(true);
                }}
                className="w-full min-h-[44px] flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:bg-teal-950/40 dark:hover:bg-teal-950/40 transition-colors focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:outline-none rounded-xl"
              >
                <Compass className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                <span>{isAr ? 'دليل الأدوار والعمل: كل واحد بيعمل إيه وفين؟' : 'Role & Workflow Guide: Who Does What & Where?'}</span>
              </button>
            )}

            <button
              onClick={() => {
                setMobileOpen(false);
                setShowPasswordModal(true);
              }}
              className="w-full min-h-[44px] flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none rounded-xl"
            >
              <KeyRound className="w-4 h-4 text-stone-400 shrink-0" />
              <span>{isAr ? 'تغيير كلمة المرور' : 'Change Password'}</span>
            </button>
            <button
              onClick={async () => {
                setMobileOpen(false);
                await signOut();
                router.replace('/login');
              }}
              className="w-full min-h-[44px] flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none rounded-xl"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>{isAr ? 'تسجيل خروج' : 'Sign out'}</span>
            </button>
          </div>
        </nav>
      ) : (
        <div id="mobile-nav-menu" hidden aria-hidden="true" />
      )}

      {/* Global Interactive Role & Workflow Guide Modal */}
      {showRoleGuideModal && (
        <TORoleWorkflowGuide
          isModal={true}
          onClose={() => setShowRoleGuideModal(false)}
        />
      )}

      {/* Change Password Dialog Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </header>
  );
};
