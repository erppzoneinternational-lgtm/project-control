'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ProjectStakeholder, RaciRole } from '@/types';
import { ProjectService } from '@/lib/services/project.service';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Users,
  GitFork,
  Phone,
  Mail,
  Calendar,
  Building2,
  UserCheck,
  ShieldCheck,
  AlertCircle,
  Search,
  RefreshCw,
  X,
  Briefcase,
  Layers,
  LayoutGrid,
  Clock,
} from 'lucide-react';

export interface StakeholderOrgChartProps {
  projectId: string;
  initialStakeholders?: ProjectStakeholder[];
}

export interface OrgTreeNode {
  stakeholder: ProjectStakeholder;
  children: OrgTreeNode[];
  depth: number;
  managerName?: string;
}

export const RACI_INFO: Record<
  RaciRole,
  { letter: string; nameAr: string; nameEn: string; badge: string; color: string; descAr: string; descEn: string }
> = {
  accountable: {
    letter: 'A',
    nameAr: 'المسؤول الرئيسي',
    nameEn: 'Accountable',
    badge: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-300 dark:border-red-800',
    color: '#ef4444',
    descAr: 'المعتمد النهائي للقرارات والمخرجات بالمشروع',
    descEn: 'Final approver and decision maker for project outcomes',
  },
  responsible: {
    letter: 'R',
    nameAr: 'المنفذ المباشر',
    nameEn: 'Responsible',
    badge: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border-emerald-300 dark:border-emerald-900',
    color: '#10b981',
    descAr: 'المكلف بتنفيذ وتسليم المهام والمخرجات المباشرة',
    descEn: 'Directly executes and delivers deliverables and tasks',
  },
  consulted: {
    letter: 'C',
    nameAr: 'مستشار فني',
    nameEn: 'Consulted',
    badge: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-300 dark:border-sky-800',
    color: '#0ea5e9',
    descAr: 'يتم استشارته وأخذ رأيه الفني قبل التنفيذ',
    descEn: 'Consulted for two-way technical input prior to execution',
  },
  informed: {
    letter: 'I',
    nameAr: 'للمتابعة والعلم',
    nameEn: 'Informed',
    badge: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-800',
    color: '#64748b',
    descAr: 'يتم إحاطته بالمستجدات ونسب التقدم',
    descEn: 'Kept updated on progress and major milestones',
  },
};

/**
 * Format assignment date range string
 */
export function formatStakeholderDateRange(s: ProjectStakeholder, isAr: boolean = true): string {
  const start = s.start_date || (s.assigned_at ? s.assigned_at.split('T')[0] : null);
  const end = s.end_date || null;
  const currentLabel = isAr ? 'الحالي' : 'Present';

  if (!start && !end) return isAr ? 'غير محدد' : 'Not specified';
  if (start && !end) return `${start} ➔ ${currentLabel}`;
  return `${start || ''} ➔ ${end}`;
}

/**
 * Visual styling classes for active vs departed members
 */
export function getNodeStyleClasses(isActive: boolean): {
  cardClasses: string;
  badgeClasses: string;
  indicatorDotClass: string;
  isDeparted: boolean;
} {
  if (isActive) {
    return {
      cardClasses:
        'border border-emerald-500/30 bg-white dark:bg-slate-900 shadow-md hover:shadow-xl hover:border-emerald-500/70',
      badgeClasses: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
      indicatorDotClass: 'bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse',
      isDeparted: false,
    };
  }

  return {
    cardClasses:
      'border-dashed border-2 border-slate-400 dark:border-slate-600 bg-slate-50/70 dark:bg-slate-900/50 opacity-60 hover:opacity-100 hover:shadow-lg',
    badgeClasses: 'text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700',
    indicatorDotClass: 'bg-slate-400',
    isDeparted: true,
  };
}

/**
 * Filter stakeholders by search text and status
 */
export function filterStakeholders(
  stakeholders: ProjectStakeholder[],
  searchQuery: string,
  statusFilter: 'all' | 'active' | 'departed'
): ProjectStakeholder[] {
  return stakeholders.filter((s) => {
    // Status filter
    const isActive = s.is_active !== false;
    if (statusFilter === 'active' && !isActive) return false;
    if (statusFilter === 'departed' && isActive) return false;

    // Search query
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const nameAr = s.stakeholder?.name_ar?.toLowerCase() || '';
    const nameEn = s.stakeholder?.name_en?.toLowerCase() || '';
    const role = s.project_role?.toLowerCase() || '';
    const jobTitle = s.stakeholder?.role?.toLowerCase() || '';
    const phone = s.stakeholder?.phone?.toLowerCase() || '';
    const email = s.stakeholder?.email?.toLowerCase() || '';
    const code = s.stakeholder?.employee_code?.toLowerCase() || '';

    return (
      nameAr.includes(q) ||
      nameEn.includes(q) ||
      role.includes(q) ||
      jobTitle.includes(q) ||
      phone.includes(q) ||
      email.includes(q) ||
      code.includes(q)
    );
  });
}

/**
 * Calculate summary metrics across stakeholders
 */
export function calculateOrgStats(stakeholders: ProjectStakeholder[]) {
  const total = stakeholders.length;
  const active = stakeholders.filter((s) => s.is_active !== false).length;
  const departed = total - active;
  const byRaci = {
    accountable: stakeholders.filter((s) => s.raci_role === 'accountable').length,
    responsible: stakeholders.filter((s) => s.raci_role === 'responsible').length,
    consulted: stakeholders.filter((s) => s.raci_role === 'consulted').length,
    informed: stakeholders.filter((s) => s.raci_role === 'informed').length,
  };
  return { total, active, departed, byRaci };
}

/**
 * Build tree hierarchy from stakeholders
 * If reports_to is populated, uses explicit reports_to relationships.
 * If reports_to is null, falls back to RACI tiered hierarchy.
 */
export function buildOrgHierarchy(
  stakeholders: ProjectStakeholder[],
  options?: { isAr?: boolean }
): {
  treeRoots: OrgTreeNode[];
  hasExplicitHierarchy: boolean;
} {
  const isAr = options?.isAr ?? true;
  if (!stakeholders || stakeholders.length === 0) {
    return { treeRoots: [], hasExplicitHierarchy: false };
  }

  const stakeholderMap = new Map<string, ProjectStakeholder>();
  stakeholders.forEach((s) => stakeholderMap.set(s.id, s));

  const explicitHierarchyExists = stakeholders.some(
    (s) => s.reports_to && stakeholderMap.has(s.reports_to)
  );

  if (explicitHierarchyExists) {
    const childrenMap = new Map<string, ProjectStakeholder[]>();
    const rootItems: ProjectStakeholder[] = [];

    stakeholders.forEach((s) => {
      if (s.reports_to && stakeholderMap.has(s.reports_to)) {
        const list = childrenMap.get(s.reports_to) || [];
        list.push(s);
        childrenMap.set(s.reports_to, list);
      } else {
        rootItems.push(s);
      }
    });

    const visited = new Set<string>();
    const buildNode = (item: ProjectStakeholder, depth: number): OrgTreeNode => {
      visited.add(item.id);
      const manager = item.reports_to ? stakeholderMap.get(item.reports_to) : undefined;
      const managerName = manager
        ? (isAr ? manager.stakeholder?.name_ar || manager.stakeholder?.name_en : manager.stakeholder?.name_en || manager.stakeholder?.name_ar) || manager.project_role
        : undefined;

      const children = (childrenMap.get(item.id) || [])
        .filter((child) => !visited.has(child.id)) // prevent cycle
        .map((child) => buildNode(child, depth + 1));

      return {
        stakeholder: item,
        children,
        depth,
        managerName,
      };
    };

    const treeRoots: OrgTreeNode[] = rootItems.map((r) => buildNode(r, 0));

    // Cycle detection & resilience for unvisited nodes:
    // If nodes have circular references without an unassigned root,
    // pick any unvisited node to serve as a tree root, breaking the cycle and ensuring no nodes are lost.
    stakeholders.forEach((s) => {
      if (!visited.has(s.id)) {
        treeRoots.push(buildNode(s, 0));
      }
    });

    return {
      treeRoots,
      hasExplicitHierarchy: true,
    };
  }

  // Fallback: RACI Role Hierarchy
  const accountableList = stakeholders.filter((s) => s.raci_role === 'accountable');
  const responsibleList = stakeholders.filter((s) => s.raci_role === 'responsible');
  const consultedList = stakeholders.filter((s) => s.raci_role === 'consulted');
  const informedList = stakeholders.filter((s) => s.raci_role === 'informed');

  if (accountableList.length > 0) {
    const primaryRoot = accountableList[0];
    const otherAccountable = accountableList.slice(1);

    const primaryResponsible = responsibleList[0];
    const otherResponsible = responsibleList.slice(1);

    const consultedNodes: OrgTreeNode[] = consultedList.map((s) => ({
      stakeholder: s,
      children: [],
      depth: 2,
      managerName: primaryResponsible?.stakeholder?.name_ar || primaryRoot.stakeholder?.name_ar,
    }));

    const informedNodes: OrgTreeNode[] = informedList.map((s) => ({
      stakeholder: s,
      children: [],
      depth: 2,
      managerName: primaryResponsible?.stakeholder?.name_ar || primaryRoot.stakeholder?.name_ar,
    }));

    const responsibleNodes: OrgTreeNode[] = [
      ...(primaryResponsible
        ? [
            {
              stakeholder: primaryResponsible,
              children: [...consultedNodes, ...informedNodes],
              depth: 1,
              managerName: primaryRoot.stakeholder?.name_ar,
            },
          ]
        : []),
      ...otherResponsible.map((s) => ({
        stakeholder: s,
        children: [],
        depth: 1,
        managerName: primaryRoot.stakeholder?.name_ar,
      })),
    ];

    const rootNode: OrgTreeNode = {
      stakeholder: primaryRoot,
      children: [
        ...otherAccountable.map((s) => ({
          stakeholder: s,
          children: [],
          depth: 1,
          managerName: primaryRoot.stakeholder?.name_ar,
        })),
        ...responsibleNodes,
      ],
      depth: 0,
    };

    return {
      treeRoots: [rootNode],
      hasExplicitHierarchy: false,
    };
  }

  // If no accountable member, all stakeholders render at root level
  const multiRoots: OrgTreeNode[] = stakeholders.map((s) => ({
    stakeholder: s,
    children: [],
    depth: 0,
  }));

  return {
    treeRoots: multiRoots,
    hasExplicitHierarchy: false,
  };
}

/**
 * Handle ESC keydown to close detail modal
 */
export function handleModalEscKeyDown(
  event: { key: string; preventDefault?: () => void },
  onClose: () => void
): boolean {
  if (event.key === 'Escape') {
    event.preventDefault?.();
    onClose();
    return true;
  }
  return false;
}

export const StakeholderOrgChart: React.FC<StakeholderOrgChartProps> = ({
  projectId,
  initialStakeholders,
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const [stakeholders, setStakeholders] = useState<ProjectStakeholder[]>(initialStakeholders || []);
  const [loading, setLoading] = useState<boolean>(!initialStakeholders);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'departed'>('all');
  const [viewMode, setViewMode] = useState<'tree' | 'tiers' | 'grid'>('tree');
  const [selectedStakeholder, setSelectedStakeholder] = useState<ProjectStakeholder | null>(null);

  // Listen for ESC key to close detail modal
  useEffect(() => {
    if (!selectedStakeholder || typeof window === 'undefined') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      handleModalEscKeyDown(e, () => setSelectedStakeholder(null));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedStakeholder]);

  // Fetch stakeholders if not provided in initialStakeholders prop
  const fetchStakeholders = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await ProjectService.getProjectStakeholders(projectId);
      setStakeholders(data || []);
    } catch (err: any) {
      setError(err?.message || (isAr ? 'تعذر جلب بيانات الشركاء' : 'Failed to fetch stakeholders'));
    } finally {
      setLoading(false);
    }
  }, [projectId, isAr]);

  useEffect(() => {
    if (initialStakeholders) {
      setStakeholders(initialStakeholders);
      setLoading(false);
    } else {
      fetchStakeholders();
    }
  }, [initialStakeholders, fetchStakeholders]);

  // Lookup map
  const stakeholderMap = useMemo(() => {
    const map = new Map<string, ProjectStakeholder>();
    stakeholders.forEach((s) => map.set(s.id, s));
    return map;
  }, [stakeholders]);

  // Filtered stakeholders
  const filteredStakeholders = useMemo(() => {
    return filterStakeholders(stakeholders, searchQuery, statusFilter);
  }, [stakeholders, searchQuery, statusFilter]);

  // Hierarchy
  const { treeRoots, hasExplicitHierarchy } = useMemo(() => {
    return buildOrgHierarchy(filteredStakeholders, { isAr });
  }, [filteredStakeholders, isAr]);

  // Statistics
  const stats = useMemo(() => {
    return calculateOrgStats(stakeholders);
  }, [stakeholders]);

  // Node Component
  const OrgNodeCard: React.FC<{ node: OrgTreeNode }> = ({ node }) => {
    const s = node.stakeholder;
    const isActive = s.is_active !== false;
    const styling = getNodeStyleClasses(isActive);
    const raci = RACI_INFO[s.raci_role] || RACI_INFO.informed;

    const nameAr = s.stakeholder?.name_ar || s.stakeholder?.name_en || (isAr ? 'عضو غير مسمى' : 'Unnamed Member');
    const nameEn = s.stakeholder?.name_en || s.stakeholder?.name_ar || '';
    const phone = s.stakeholder?.phone;
    const email = s.stakeholder?.email;
    const dateText = formatStakeholderDateRange(s, isAr);

    return (
      <div className="flex flex-col items-center relative group">
        {/* Card Box */}
        <div
          data-testid={`org-node-${s.id}`}
          onClick={() => setSelectedStakeholder(s)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setSelectedStakeholder(s);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={`${isAr ? nameAr : nameEn || nameAr} - ${s.project_role || (isAr ? 'عضو فريق' : 'Team Member')}`}
          className={`w-72 sm:w-80 cursor-pointer rounded-xl p-4 transition-all duration-200 text-start relative select-none hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${styling.cardClasses}`}
        >
          {/* Active / Departed indicator dot & RACI badge */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${styling.indicatorDotClass}`}
                title={isActive ? (isAr ? 'نشط حالياً' : 'Active') : isAr ? 'مغادر' : 'Departed'}
              />
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs ${raci.badge}`}>
                {isAr ? raci.nameAr : `${raci.letter} • ${raci.nameEn}`}
              </span>
            </div>

            {/* Status Badge */}
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border border-transparent ${styling.badgeClasses}`}>
              {isActive ? (isAr ? 'نشط' : 'Active') : isAr ? 'مغادر' : 'Departed'}
            </span>
          </div>

          {/* Names */}
          <div className="mb-2">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {isAr ? nameAr : nameEn || nameAr}
            </h4>
            {nameEn && isAr && nameEn !== nameAr && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-sans" dir="ltr">
                {nameEn}
              </p>
            )}
          </div>

          {/* Role & Job Title */}
          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 mb-3">
            <Briefcase className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-semibold truncate">{s.project_role || (isAr ? 'عضو فريق' : 'Team Member')}</span>
            {s.stakeholder?.role && s.stakeholder.role !== s.project_role && (
              <span className="text-[10px] text-slate-400 truncate">({s.stakeholder.role})</span>
            )}
          </div>

          {/* Date range */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mb-3 bg-slate-100/60 dark:bg-slate-800/60 px-2 py-1 rounded-md">
            <Calendar className="w-3 h-3 shrink-0 text-slate-400" />
            <span className="truncate">{dateText}</span>
          </div>

          {/* Contact Links */}
          <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
            {phone ? (
              <a
                href={`tel:${phone}`}
                onClick={(e) => e.stopPropagation()}
                className="cursor-pointer flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-sm"
                title={phone}
                aria-label={phone}
              >
                <Phone className="w-3 h-3 shrink-0" />
                <span className="truncate max-w-[90px] font-mono" dir="ltr">
                  {phone}
                </span>
              </a>
            ) : (
              <span className="text-slate-400 flex items-center gap-1">
                <Phone className="w-3 h-3 shrink-0 opacity-40" />
                <span className="text-[10px]">—</span>
              </span>
            )}

            {email ? (
              <a
                href={`mailto:${email}`}
                onClick={(e) => e.stopPropagation()}
                className="cursor-pointer flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:underline truncate focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-sm"
                title={email}
                aria-label={email}
              >
                <Mail className="w-3 h-3 shrink-0" />
                <span className="truncate max-w-[120px]" dir="ltr">
                  {email}
                </span>
              </a>
            ) : (
              <span className="text-slate-400 flex items-center gap-1">
                <Mail className="w-3 h-3 shrink-0 opacity-40" />
                <span className="text-[10px]">—</span>
              </span>
            )}
          </div>

          {/* Predecessor indicator if available */}
          {s.predecessor_id && (
            <div className="mt-2 text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded flex items-center gap-1">
              <Clock className="w-2.5 h-2.5 shrink-0" />
              <span>{isAr ? 'بديل لعضو سابق' : 'Successor'}</span>
            </div>
          )}
        </div>

        {/* Children connector lines and recursive render */}
        {node.children && node.children.length > 0 && (
          <div className="flex flex-col items-center w-full">
            {/* Vertical stem down from parent */}
            <div className="w-px h-6 bg-slate-300 dark:bg-slate-700" />

            {/* Horizontal bar across children */}
            {node.children.length > 1 && (
              <div className="w-full flex justify-center">
                <div
                  className="h-px bg-slate-300 dark:bg-slate-700"
                  style={{
                    width: `calc(100% - ${100 / node.children.length}%)`,
                  }}
                />
              </div>
            )}

            {/* Children container */}
            <div className="flex items-start justify-center gap-6 pt-0">
              {node.children.map((child) => (
                <div key={child.stakeholder.id} className="flex flex-col items-center">
                  {/* Vertical stem down to child */}
                  <div className="w-px h-6 bg-slate-300 dark:bg-slate-700" />
                  <OrgNodeCard node={child} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* ─── Top Header Toolbar ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <GitFork className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{isAr ? 'الهيكل التنظيمي للمشروع' : 'Project Organizational Hierarchy'}</span>
                {!hasExplicitHierarchy && (
                  <span className="text-[11px] font-normal px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {isAr ? 'ترتيب هرمي وفق مصفوفة المسؤوليات' : 'RACI Matrix Tiered'}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isAr
                  ? 'عرض شجرة القيادة والمسؤوليات، وتتبع الفترات الزمنية وتاريخ التعيينات'
                  : 'Visual leadership tree, responsibilities, and temporal tenure tracking'}
              </p>
            </div>
          </div>
        </div>

        {/* Controls: Search, Status Filter, View Mode, Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute start-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث بالاسم أو الدور...' : 'Search name or role...'}
              className="w-44 sm:w-56 h-8 text-xs ps-8 pe-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label={isAr ? 'مسح البحث' : 'Clear search'}
                className="cursor-pointer absolute end-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/70 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`cursor-pointer px-2.5 py-1 rounded-md font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isAr ? 'الكل' : 'All'} ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`cursor-pointer px-2.5 py-1 rounded-md font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                statusFilter === 'active'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isAr ? 'النشطين' : 'Active'} ({stats.active})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('departed')}
              className={`cursor-pointer px-2.5 py-1 rounded-md font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                statusFilter === 'departed'
                  ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isAr ? 'المغادرين' : 'Departed'} ({stats.departed})
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/70 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('tree')}
              title={isAr ? 'عرض الشجرة الهرمية' : 'Tree View'}
              aria-label={isAr ? 'عرض الشجرة الهرمية' : 'Tree View'}
              className={`cursor-pointer p-1.5 rounded-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                viewMode === 'tree'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <GitFork className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('tiers')}
              title={isAr ? 'عرض مستويات مصفوفة المسؤوليات' : 'RACI Tiers View'}
              aria-label={isAr ? 'عرض مستويات مصفوفة المسؤوليات' : 'RACI Tiers View'}
              className={`cursor-pointer p-1.5 rounded-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                viewMode === 'tiers'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              title={isAr ? 'عرض شبكة البطاقات' : 'Cards Grid View'}
              aria-label={isAr ? 'عرض شبكة البطاقات' : 'Cards Grid View'}
              className={`cursor-pointer p-1.5 rounded-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchStakeholders}
            title={isAr ? 'تحديث البيانات' : 'Refresh'}
            aria-label={isAr ? 'تحديث البيانات' : 'Refresh'}
            className="cursor-pointer p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── RACI Legend & Summary Bar ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['accountable', 'responsible', 'consulted', 'informed'] as RaciRole[]).map((role) => {
          const cfg = RACI_INFO[role];
          const count = stats.byRaci[role];
          return (
            <div
              key={role}
              className="rounded-xl p-3 border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex items-center gap-3"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
                style={{ backgroundColor: `${cfg.color}15`, color: cfg.color }}
              >
                {cfg.letter}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {isAr ? cfg.nameAr : cfg.nameEn}
                  </span>
                  <span className="text-xs font-bold font-mono text-slate-500">{count}</span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">{isAr ? cfg.descAr : cfg.descEn}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Main Content Area ─── */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-center">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mb-3" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            {isAr ? 'جاري تحميل هيكل الشركاء...' : 'Loading stakeholder hierarchy...'}
          </p>
        </div>
      ) : error ? (
        <div className="py-12 px-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-red-700 dark:text-red-400">{error}</p>
          <button
            type="button"
            onClick={fetchStakeholders}
            className="cursor-pointer mt-3 px-4 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-colors"
          >
            {isAr ? 'إعادة المحاولة' : 'Retry'}
          </button>
        </div>
      ) : filteredStakeholders.length === 0 ? (
        <div className="py-20 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
          <Users className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            {searchQuery
              ? isAr
                ? 'لا توجد نتائج تطابق بحثك'
                : 'No results match your search'
              : isAr
              ? 'لا يوجد شركاء مسجلين في هذا المشروع'
              : 'No stakeholders assigned to this project'}
          </h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? isAr
                ? 'جرّب كتابة اسم مختلف أو إزالة الفلتر'
                : 'Try different keywords or clear filters'
              : isAr
              ? 'يمكنك إضافة الشركاء وأعضاء الفريق من خلال تبويب الفريق'
              : 'Add team members and stakeholders from the Team tab'}
          </p>
        </div>
      ) : (
        <div>
          {/* VIEW MODE 1: Interactive Hierarchy Tree */}
          {viewMode === 'tree' && (
            <div className="overflow-x-auto py-8 px-4 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-inner">
              <div className="flex justify-center min-w-max gap-8">
                {treeRoots.map((root) => (
                  <OrgNodeCard key={root.stakeholder.id} node={root} />
                ))}
              </div>
            </div>
          )}

          {/* VIEW MODE 2: RACI Matrix Tiers */}
          {viewMode === 'tiers' && (
            <div className="space-y-6">
              {(['accountable', 'responsible', 'consulted', 'informed'] as RaciRole[]).map((rRole) => {
                const cfg = RACI_INFO[rRole];
                const list = filteredStakeholders.filter((s) => s.raci_role === rRole);
                if (list.length === 0) return null;

                return (
                  <div
                    key={rRole}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900"
                  >
                    <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs"
                        style={{ backgroundColor: `${cfg.color}15`, color: cfg.color }}
                      >
                        {cfg.letter}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {isAr ? cfg.nameAr : cfg.nameEn}
                      </h4>
                      <span className="text-xs text-slate-400 font-mono">({list.length})</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {list.map((s) => (
                        <OrgNodeCard
                          key={s.id}
                          node={{
                            stakeholder: s,
                            children: [],
                            depth: 0,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW MODE 3: Cards Grid */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStakeholders.map((s) => (
                <OrgNodeCard
                  key={s.id}
                  node={{
                    stakeholder: s,
                    children: [],
                    depth: 0,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Detail Modal / Card Popup ─── */}
      {selectedStakeholder && (
        <div
          data-testid="stakeholder-detail-modal"
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedStakeholder(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            {(() => {
              const s = selectedStakeholder;
              const isActive = s.is_active !== false;
              const styling = getNodeStyleClasses(isActive);
              const raci = RACI_INFO[s.raci_role] || RACI_INFO.informed;
              const manager = s.reports_to ? stakeholderMap.get(s.reports_to) : null;
              const subordinates = stakeholders.filter((item) => item.reports_to === s.id);

              return (
                <>
                  <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-800/40">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg border"
                        style={{ backgroundColor: `${raci.color}15`, color: raci.color, borderColor: `${raci.color}30` }}
                      >
                        {raci.letter}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            {s.stakeholder?.name_ar || s.stakeholder?.name_en || (isAr ? 'عضو فريق' : 'Team Member')}
                          </h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${styling.badgeClasses}`}>
                            {isActive ? (isAr ? 'نشط' : 'Active') : isAr ? 'مغادر' : 'Departed'}
                          </span>
                        </div>
                        {s.stakeholder?.name_en && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-sans" dir="ltr">
                            {s.stakeholder.name_en}
                          </p>
                        )}
                        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {s.project_role}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      data-testid="close-modal-btn"
                      onClick={() => setSelectedStakeholder(null)}
                      aria-label={isAr ? 'إغلاق النافذة' : 'Close modal'}
                      className="cursor-pointer p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
                    {/* RACI Details */}
                    <div className="rounded-xl p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {isAr ? 'مستوى المسؤولية المعتمد:' : 'RACI Responsibility Role:'}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${raci.badge}`}>
                          {isAr ? raci.nameAr : raci.nameEn}
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                        {isAr ? raci.descAr : raci.descEn}
                      </p>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Employee Code */}
                      <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                        <span className="text-[10px] text-slate-400 block mb-0.5">
                          {isAr ? 'الكود الوظيفي' : 'Employee Code'}
                        </span>
                        <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                          {s.stakeholder?.employee_code || '—'}
                        </span>
                      </div>

                      {/* Organization */}
                      <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                        <span className="text-[10px] text-slate-400 block mb-0.5">
                          {isAr ? 'الجهة / المؤسسة' : 'Organization'}
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                          {s.stakeholder?.organization_name || (isAr ? 'شركة بي زون العالمية' : 'Pzone International')}
                        </span>
                      </div>

                      {/* Direct Manager */}
                      <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                        <span className="text-[10px] text-slate-400 block mb-0.5">
                          {isAr ? 'المسؤول المباشر' : 'Direct Manager'}
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {manager
                            ? manager.stakeholder?.name_ar || manager.stakeholder?.name_en || manager.project_role
                            : isAr
                            ? 'القيادة العليا للمشروع'
                            : 'Project Top Leadership'}
                        </span>
                      </div>

                      {/* Subordinates Count */}
                      <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                        <span className="text-[10px] text-slate-400 block mb-0.5">
                          {isAr ? 'عدد المرؤوسين التابعين' : 'Direct Subordinates'}
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                          {subordinates.length}
                        </span>
                      </div>
                    </div>

                    {/* Dates & Tenure */}
                    <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">{isAr ? 'تاريخ بداية التعيين:' : 'Start Date:'}</span>
                        <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">
                          {s.start_date || (s.assigned_at ? s.assigned_at.split('T')[0] : '—')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">{isAr ? 'تاريخ نهاية التعيين:' : 'End Date:'}</span>
                        <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">
                          {s.end_date || (isAr ? 'مستمر حتى تاريخه' : 'Current / Present')}
                        </span>
                      </div>
                      {s.termination_reason && (
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 text-[11px]">
                          <span className="text-amber-600 dark:text-amber-400 font-semibold block mb-0.5">
                            {isAr ? 'سبب المغادرة:' : 'Termination Reason:'}
                          </span>
                          <p className="text-slate-600 dark:text-slate-300">{s.termination_reason}</p>
                        </div>
                      )}
                    </div>

                    {/* Contact Actions */}
                    <div className="pt-2 flex items-center gap-3">
                      {s.stakeholder?.phone ? (
                        <a
                          href={`tel:${s.stakeholder.phone}`}
                          className="cursor-pointer flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 transition-colors shadow-sm"
                        >
                          <Phone className="w-4 h-4" />
                          <span>{isAr ? 'اتصال هاتفياً' : 'Call Phone'}</span>
                        </a>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="flex-1 py-2.5 px-4 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 font-bold flex items-center justify-center gap-2 cursor-not-allowed"
                        >
                          <Phone className="w-4 h-4" />
                          <span>{isAr ? 'لا يوجد هاتف' : 'No Phone'}</span>
                        </button>
                      )}

                      {s.stakeholder?.email ? (
                        <a
                          href={`mailto:${s.stakeholder.email}`}
                          className="cursor-pointer flex-1 py-2.5 px-4 rounded-xl bg-sky-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 transition-colors shadow-sm"
                        >
                          <Mail className="w-4 h-4" />
                          <span>{isAr ? 'إرسال بريد' : 'Send Email'}</span>
                        </a>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="flex-1 py-2.5 px-4 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 font-bold flex items-center justify-center gap-2 cursor-not-allowed"
                        >
                          <Mail className="w-4 h-4" />
                          <span>{isAr ? 'لا يوجد بريد' : 'No Email'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default StakeholderOrgChart;
