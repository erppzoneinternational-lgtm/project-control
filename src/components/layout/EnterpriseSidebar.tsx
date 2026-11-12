'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen, ChevronDown,
  LayoutDashboard, FolderKanban, PlusCircle, UserCheck, FileSpreadsheet,
  BarChart3, GanttChartSquare, DollarSign, FileText, Building2, Shield,
  SlidersHorizontal, Globe, Sun, Moon, Sparkles, Megaphone,
  FoldVertical, UnfoldVertical, Rows, Layers, FileCheck, PackageCheck, ClipboardCheck, Archive,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/lib/stores/useAuthStore';
import { useUserRoles } from '@/lib/hooks/useUserRoles';
import { useNavPreferencesStore, SidebarDensity } from '@/lib/stores/useNavPreferencesStore';
import { isItemActive } from './TopNav';
import { useProjectStore } from '@/lib/stores/useProjectStore';
import { RoleRoutingService } from '@/lib/services/roleRouting.service';
import { usePortalTourStore } from '@/lib/stores/usePortalTourStore';
import { useSystemChangelogStore } from '@/lib/stores/useSystemChangelogStore';
import { LATEST_PORTAL_VERSION } from '@/lib/changelog/systemUpdates';
import { isFocusedProjectsMode, resolveFocusedHomePath } from '@/lib/config/module-visibility';

interface SidebarNavItem {
  label: string;
  labelEn: string;
  href: string;
  icon: React.ElementType;
}

interface SidebarNavGroup {
  key: string;
  labelAr: string;
  labelEn: string;
  icon: React.ElementType;
  items: SidebarNavItem[];
  allowedRoles?: string[];
}

const SIDEBAR_GROUPS: SidebarNavGroup[] = [
  {
    key: 'dashboards',
    labelAr: 'لوحات القيادة',
    labelEn: 'Dashboards',
    icon: LayoutDashboard,
    allowedRoles: ['admin', 'ceo', 'coo', 'coo_assistant', 'chairman', 'project_manager', 'planning_manager', 'commercial_manager', 'technical_office', 'to_manager', 'qc_inspector', 'qc_engineer'],
    items: [
      { label: 'اللوحة المركزية', labelEn: 'Central Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'لوحة المشاريع', labelEn: 'Projects Dashboard', href: '/projects/dashboard', icon: BarChart3 },
      { label: 'نبض البرنامج (Schedule Pulse)', labelEn: 'Schedule Pulse (P6)', href: '/schedule-pulse', icon: GanttChartSquare },
    ],
  },
  {
    key: 'technical_office',
    labelAr: 'المكتب الفني',
    labelEn: 'Technical Office',
    icon: PackageCheck,
    allowedRoles: ['admin', 'ceo', 'coo', 'coo_assistant', 'chairman', 'project_manager', 'planning_manager', 'technical_office', 'to_manager', 'doc_controller'],
    items: [
      { label: 'بوابة المكتب الفني المتكاملة', labelEn: 'TO Command Portal', href: '/technical-office', icon: PackageCheck },
      { label: 'مركز قيادة مدير المكتب الفني', labelEn: 'TO Manager Hub', href: '/to-dashboard', icon: LayoutDashboard },
      { label: 'مهامي الهندسية والاعتمادات', labelEn: 'My Engineering Tasks', href: '/to-tasks', icon: ClipboardCheck },
      { label: 'سجل المخططات والاستفسارات', labelEn: 'Deliverables & RFIs', href: '/deliverables', icon: FileSpreadsheet },
    ],
  },
  {
    key: 'projects',
    labelAr: 'إعداد المشاريع',
    labelEn: 'Project Setup',
    icon: FolderKanban,
    allowedRoles: ['admin', 'ceo', 'coo', 'coo_assistant', 'chairman', 'project_manager', 'contract_admin', 'commercial_manager', 'planning_manager', 'planning_engineer', 'estimator'],
    items: [
      { label: 'بوابة إعداد المشاريع', labelEn: 'Project Setup Portal', href: '/project-setup', icon: FolderKanban },
      { label: 'قائمة المشاريع', labelEn: 'Projects List', href: '/projects', icon: FolderKanban },
      { label: 'إضافة مشروع جديد', labelEn: 'New Project', href: '/projects/new', icon: PlusCircle },
    ],
  },
  {
    key: 'reports',
    labelAr: 'التقارير الشاملة',
    labelEn: 'Reports',
    icon: FileSpreadsheet,
    allowedRoles: ['admin', 'ceo', 'coo', 'coo_assistant', 'chairman', 'project_manager', 'contract_admin', 'commercial_manager', 'planning_manager', 'planning_engineer', 'estimator', 'technical_office', 'to_manager', 'cost_control'],
    items: [
      { label: 'مستودع التقارير (106+)', labelEn: 'All Reports (106+)', href: '/reports', icon: FileSpreadsheet },
      { label: 'تقارير المحفظة', labelEn: 'Portfolio Reports', href: '/reports?category=portfolio', icon: BarChart3 },
      { label: 'تقارير الجدول P6', labelEn: 'Schedule & P6', href: '/reports?category=schedule', icon: GanttChartSquare },
      { label: 'تقارير التكاليف EVM', labelEn: 'Cost Control & EVM', href: '/reports?category=cost', icon: DollarSign },
      { label: 'تقارير الفواتير والسيولة', labelEn: 'Billing & Cash Flow', href: '/reports?category=cashflow', icon: FileText },
    ],
  },
  {
    key: 'stakeholders',
    labelAr: 'الشركاء وأصحاب المصلحة',
    labelEn: 'Stakeholders & Entities',
    icon: UserCheck,
    allowedRoles: [
      'admin',
      'ceo',
      'coo',
      'coo_assistant',
      'chairman',
      'board_member',
      'viewer',
      'project_manager',
      'contract_admin',
      'commercial_manager',
      'planning_manager',
      'planning_engineer',
      'estimator',
    ],
    items: [
      { label: 'محفظة الجهات والمطورين', labelEn: 'Entities & Developers Hub', href: '/clients', icon: Building2 },
      { label: 'دليل الأفراد وممثلي الجهات', labelEn: 'Stakeholders Directory', href: '/stakeholders', icon: UserCheck },
    ],
  },
  {
    key: 'admin',
    labelAr: 'إدارة النظام',
    labelEn: 'System Admin',
    icon: Shield,
    allowedRoles: ['admin', 'ceo', 'chairman', 'coo', 'coo_assistant'],
    items: [
      { label: 'بوابة إدارة النظام', labelEn: 'Admin Portal', href: '/system-admin', icon: Shield },
    ],
  },
];

interface EnterpriseSidebarProps {
  isDark: boolean;
  onThemeToggle: () => void;
  isCollapsed?: boolean;
  density?: SidebarDensity;
  collapsedGroups?: Record<string, boolean>;
}

export const EnterpriseSidebar: React.FC<EnterpriseSidebarProps> = ({
  isDark,
  onThemeToggle,
  isCollapsed,
  density,
  collapsedGroups,
}) => {
  const pathname = usePathname();
  const { locale, toggleLocale } = useLanguage();
  const isAr = locale === 'ar';

  const { roles, isAdmin } = useUserRoles();
  const {
    sidebarCollapsed: storeCollapsed,
    toggleSidebarCollapsed,
    sidebarDensity: storeDensity,
    toggleSidebarDensity,
    collapsedSidebarGroups: storeCollapsedGroups,
    toggleSidebarGroup,
    collapseAllSidebarGroups,
    expandAllSidebarGroups,
    openCustomizer,
  } = useNavPreferencesStore();

  const sidebarCollapsed = isCollapsed !== undefined ? isCollapsed : storeCollapsed;
  const sidebarDensity = density !== undefined ? density : storeDensity;
  const collapsedSidebarGroups = collapsedGroups !== undefined ? collapsedGroups : storeCollapsedGroups;

  const openTourSelector = usePortalTourStore((s) => s.openSelector);
  const { openChangelog } = useSystemChangelogStore();

  const focusedMode = isFocusedProjectsMode();
  const canCreateProject =
    isAdmin ||
    (roles || []).some((r) =>
      ['admin', 'ceo', 'coo', 'commercial_manager', 'planning_manager'].includes(
        String(r).toLowerCase()
      )
    );

  const canViewStakeholders =
    isAdmin ||
    (roles || []).some((r) => {
      const normalized = RoleRoutingService.normalizeRole(r) || String(r).toLowerCase();
      return [
        'viewer',
        'board_member',
        'project_manager',
        'contract_admin',
        'commercial_manager',
        'planning_manager',
        'planning_engineer',
        'ceo',
        'coo',
        'coo_assistant',
        'chairman',
        'admin',
      ].includes(normalized);
    });

  // Filter groups by user permissions (Fail-closed: deny if roles not ready)
  const visibleGroups: SidebarNavGroup[] = focusedMode
    ? [
        {
          key: 'projects',
          labelAr: 'إدارة المشاريع',
          labelEn: 'Projects Management',
          icon: FolderKanban,
          items: [
            { label: 'قائمة المشاريع', labelEn: 'Projects List', href: '/projects', icon: FolderKanban },
            ...(canCreateProject
              ? [{ label: 'إضافة مشروع جديد', labelEn: 'New Project', href: '/projects/new', icon: PlusCircle }]
              : []),
            { label: 'أرشيف المشاريع', labelEn: 'Projects Archive', href: '/projects/archive', icon: Archive },
            { label: 'الملف الشخصي', labelEn: 'My Profile', href: '/profile', icon: UserCheck },
          ],
        },
        ...(canViewStakeholders
          ? [
              {
                key: 'stakeholders',
                labelAr: 'الشركاء وأصحاب المصلحة',
                labelEn: 'Stakeholders & Entities',
                icon: UserCheck,
                items: [
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
                ],
              },
            ]
          : []),
      ]
    : SIDEBAR_GROUPS.filter((g) => {
        if (!g.allowedRoles || g.allowedRoles.length === 0) return true;
        if (isAdmin) return true;
        if (!roles || roles.length === 0) return false;
        return roles.some((r) => g.allowedRoles!.includes(r));
      }).map((g) => ({
        ...g,
        items: g.items.filter((item) => {
          if (item.href === '/projects/new') {
            if (isAdmin) return true;
            return (roles || []).some((r) =>
              ['admin', 'ceo', 'coo', 'commercial_manager', 'planning_manager'].includes(String(r).toLowerCase())
            );
          }
          return true;
        }),
      }));

  return (
    <aside
      role="navigation"
      aria-label={isAr ? 'شريط التنقل الجانبي' : 'Sidebar Navigation'}
      className={`hidden md:flex flex-col shrink-0 h-full border-e transition-[width] duration-300 ease-in-out select-none bg-card border-border z-30 ${
        sidebarCollapsed ? 'w-[68px]' : 'w-64'
      }`}
    >
      {/* 1. Sidebar Brand Header */}
      <div className="h-14 px-3.5 flex items-center justify-between border-b border-border shrink-0">
        <Link
          href={resolveFocusedHomePath(RoleRoutingService.getHomePath(roles))}
          className="flex items-center gap-2.5 overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl p-1"
          aria-label={isAr ? 'الرئيسية - P.ZONE' : 'Home - P.ZONE'}
        >
          {sidebarCollapsed ? (
            <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-muted flex items-center justify-center">
              <img
                src={isDark ? '/erp-assets/vertical-white-D9FOpL8s.png' : '/erp-assets/vertical-black-B4my7rFb.png'}
                alt="P.ZONE"
                width={28}
                height={28}
                decoding="async"
                className="w-full h-full object-contain p-0.5"
              />
            </div>
          ) : (
            <img
              src={isDark ? '/erp-assets/horizontal-white-BBqG2TTn.png' : '/erp-assets/horizontal-black-C6SoPpzE.png'}
              alt="P.ZONE"
              width={120}
              height={32}
              decoding="async"
              className="h-7 w-auto object-contain transition-opacity group-hover:opacity-90"
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
          )}
        </Link>

        {/* Collapse toggle button */}
        <button
          type="button"
          onClick={toggleSidebarCollapsed}
          aria-label={
            sidebarCollapsed
              ? (isAr ? 'توسيع الشريط الجانبي' : 'Expand sidebar')
              : (isAr ? 'طي الشريط الجانبي' : 'Collapse sidebar')
          }
          aria-expanded={!sidebarCollapsed}
          className="min-w-[36px] min-h-[36px] p-2 rounded-xl text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-slate-100 hover:bg-stone-100 dark:hover:bg-slate-800 transition flex items-center justify-center cursor-pointer"
        >
          {sidebarCollapsed ? (
            isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
          ) : (
            isAr ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* 1.5 Quick Compact & Accordion Controls Strip */}
      {!sidebarCollapsed && (
        <div className="px-3 py-1.5 border-b border-stone-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-stone-600 dark:text-slate-400 bg-stone-50/70 dark:bg-slate-900/50 shrink-0">
          {/* Compact vs Comfortable toggle */}
          <button
            type="button"
            onClick={toggleSidebarDensity}
            title={
              isAr
                ? (sidebarDensity === 'compact' ? 'التبديل إلى العرض العادي' : 'تفعيل الوضع المدمج (Compact)')
                : (sidebarDensity === 'compact' ? 'Switch to comfortable density' : 'Switch to compact density')
            }
            aria-label={
              isAr
                ? (sidebarDensity === 'compact' ? 'التبديل إلى العرض العادي' : 'تفعيل الوضع المدمج (Compact)')
                : (sidebarDensity === 'compact' ? 'Switch to comfortable density' : 'Switch to compact density')
            }
            className={`min-h-[30px] px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition cursor-pointer text-xs font-bold ${
              sidebarDensity === 'compact'
                ? 'bg-emerald-100/90 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-black border border-emerald-500/20 shadow-xs'
                : 'hover:bg-stone-200/60 dark:hover:bg-slate-800 text-stone-600 dark:text-slate-300'
            }`}
          >
            <Rows className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{sidebarDensity === 'compact' ? (isAr ? 'مدمج (Compact)' : 'Compact') : (isAr ? 'عادي (Normal)' : 'Normal')}</span>
          </button>

          {/* Accordion Collapse/Expand All */}
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
            title={isAr ? 'طي / توسيع كافة الأقسام' : 'Collapse / Expand all groups'}
            aria-label={isAr ? 'طي / توسيع كافة الأقسام' : 'Collapse / Expand all groups'}
            className="min-h-[30px] px-2.5 py-1 rounded-lg hover:bg-stone-200/60 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold text-stone-600 dark:text-slate-300"
          >
            {visibleGroups.some((g) => !collapsedSidebarGroups[g.key]) ? (
              <>
                <FoldVertical className="w-3.5 h-3.5 text-stone-500 dark:text-slate-400" />
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
      )}

      {/* 2. Navigation Groups & Links */}
      <div className={`flex-1 overflow-y-auto px-2.5 ${sidebarDensity === 'compact' ? 'py-1.5 space-y-1.5' : 'py-3 space-y-3'}`}>
        {visibleGroups.map((group) => {
          const GroupIcon = group.icon;
          const isGroupCollapsed = Boolean(collapsedSidebarGroups[group.key]);
          const hasActiveChild = group.items.some((it) => isItemActive(it.href, pathname, group.items));

          return (
            <div key={group.key} className={sidebarDensity === 'compact' ? 'space-y-0.5' : 'space-y-1'}>
              {/* Group Accordion Header */}
              {!sidebarCollapsed ? (
                <button
                  type="button"
                  onClick={() => toggleSidebarGroup(group.key)}
                  aria-expanded={!isGroupCollapsed}
                  className={`w-full rounded-xl transition-all cursor-pointer select-none group flex items-center justify-between ${
                    isGroupCollapsed
                      ? 'min-h-[42px] px-3 py-2 text-sm font-bold text-stone-900 dark:text-slate-100 bg-stone-100/80 dark:bg-slate-800/80 hover:bg-stone-200/80 dark:hover:bg-slate-800 border border-stone-200/80 dark:border-slate-800 shadow-2xs my-1'
                      : 'px-2.5 py-1.5 text-xs font-black uppercase text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-slate-100 hover:bg-stone-100/70 dark:hover:bg-slate-800/50 tracking-wider'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <GroupIcon
                      className={`${
                        isGroupCollapsed ? 'w-4.5 h-4.5' : 'w-3.5 h-3.5'
                      } shrink-0 transition-colors ${
                        hasActiveChild
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isGroupCollapsed
                          ? 'text-stone-700 dark:text-slate-300'
                          : 'text-stone-400 dark:text-slate-400 group-hover:text-stone-600 dark:group-hover:text-slate-300'
                      }`}
                    />
                    <span
                      className={`truncate ${
                        hasActiveChild
                          ? 'text-emerald-800 dark:text-emerald-300 font-black'
                          : isGroupCollapsed
                          ? 'text-stone-900 dark:text-slate-100 font-bold'
                          : ''
                      }`}
                    >
                      {isAr ? group.labelAr : group.labelEn}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isGroupCollapsed && (
                      <span className="px-1.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-stone-200/70 dark:bg-slate-800/60 text-stone-600 dark:text-slate-300">
                        {group.items.length}
                      </span>
                    )}
                    <ChevronDown
                      className={`${
                        isGroupCollapsed ? 'w-4 h-4 text-stone-500 dark:text-slate-400' : 'w-3.5 h-3.5 text-stone-400 dark:text-slate-400'
                      } transition-transform duration-200 shrink-0 ${
                        isGroupCollapsed ? (isAr ? 'rotate-90' : '-rotate-90') : ''
                      }`}
                    />
                  </div>
                </button>
              ) : (
                <div className="my-1 border-t border-stone-200/60 dark:border-slate-800/60" />
              )}

              {/* Group Items: render if not collapsed or if in collapsed rail mode */}
              {(!isGroupCollapsed || sidebarCollapsed) && (
                <div className="space-y-0.5 animate-in fade-in duration-100">
                  {group.items.map((item) => {
                    const ItemIcon = item.icon;
                    const active = isItemActive(item.href, pathname, group.items);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={sidebarCollapsed ? (isAr ? item.label : item.labelEn) : undefined}
                        aria-current={active ? 'page' : undefined}
                        className={`group relative flex items-center gap-2 rounded-xl font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                          sidebarCollapsed
                            ? 'justify-center px-0 min-h-[42px]'
                            : sidebarDensity === 'compact'
                            ? 'px-2.5 py-1 min-h-[32px] text-xs'
                            : 'px-3 py-2 min-h-[40px] text-[13.5px]'
                        } ${
                          active
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800/80 hover:text-stone-900 dark:hover:text-white'
                        }`}
                      >
                        <ItemIcon
                          className={`${
                            sidebarDensity === 'compact' && !sidebarCollapsed ? 'w-3.5 h-3.5' : 'w-4 h-4'
                          } shrink-0 transition-transform ${
                            active
                              ? 'text-white'
                              : 'text-stone-500 dark:text-slate-400 group-hover:scale-110'
                          }`}
                        />

                        {!sidebarCollapsed && (
                          <span className="truncate">{isAr ? item.label : item.labelEn}</span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. Bottom Utility Rail */}
      <div className="p-2 border-t border-stone-200 dark:border-slate-800 space-y-1 bg-stone-50/50 dark:bg-slate-900/30">
        {!focusedMode && (
          <>
            {/* Navigation Customizer Shortcut */}
            <button
              type="button"
              onClick={openCustomizer}
              title={isAr ? 'تخصيص واجهة التنقل' : 'Customize Navigation'}
              className={`w-full min-h-[40px] flex items-center gap-2 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition cursor-pointer ${
                sidebarCollapsed ? 'justify-center p-2' : 'px-3 py-2'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              {!sidebarCollapsed && (
                <span>{isAr ? 'تخصيص الشريط' : 'Customize Bar'}</span>
              )}
            </button>

            {/* System Updates / What's New */}
            <button
              type="button"
              onClick={() => openChangelog()}
              title={isAr ? `ما الجديد؟ (v${LATEST_PORTAL_VERSION})` : `What's New? (v${LATEST_PORTAL_VERSION})`}
              className={`w-full min-h-[40px] flex items-center gap-2 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/60 transition cursor-pointer ${
                sidebarCollapsed ? 'justify-center p-2' : 'px-3 py-2'
              }`}
            >
              <Megaphone className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && (
                <span>{isAr ? 'سجل التحديثات' : "What's New"}</span>
              )}
            </button>

            {/* Guided Tour */}
            <button
              type="button"
              onClick={openTourSelector}
              title={isAr ? 'الجولة التعريفية' : 'Guided Tour'}
              className={`w-full min-h-[40px] flex items-center gap-2 rounded-xl text-xs font-bold text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition cursor-pointer ${
                sidebarCollapsed ? 'justify-center p-2' : 'px-3 py-2'
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0 text-emerald-500 dark:text-emerald-400" />
              {!sidebarCollapsed && (
                <span>{isAr ? 'جولة تفاعلية' : 'Guided Tour'}</span>
              )}
            </button>
          </>
        )}

        {/* Language & Theme Controls */}
        <div className={`flex items-center gap-1 pt-1 border-t border-stone-200/60 dark:border-slate-800/60 ${
          sidebarCollapsed ? 'flex-col' : 'justify-between px-1'
        }`}>
          {/* Theme switch */}
          <button
            type="button"
            onClick={onThemeToggle}
            aria-label={isDark ? (isAr ? 'تفعيل الوضع النهاري' : 'Light mode') : (isAr ? 'تفعيل الوضع الليلي' : 'Dark mode')}
            className="min-w-[36px] min-h-[36px] p-2 rounded-xl text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition flex items-center justify-center cursor-pointer"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-stone-600 dark:text-slate-300" />}
          </button>

          {/* Language toggle */}
          <button
            type="button"
            onClick={toggleLocale}
            aria-label={isAr ? 'Switch to English' : 'تغيير إلى العربية'}
            className="min-w-[36px] min-h-[36px] p-2 rounded-xl text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition flex items-center justify-center cursor-pointer font-bold text-xs"
          >
            <Globe className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
