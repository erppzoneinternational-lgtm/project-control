'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Award,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  RotateCcw,
  Users,
  Search,
  Loader2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { TOEngineerKPIs } from '@/types/planning';
import { KpiService } from '@/lib/services/kpi.service';
import { ProjectService } from '@/lib/services/project.service';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { TOEngineerKPIDashboardSkeleton } from './DashboardSkeletons';

export interface TOEngineerKPIDashboardProps {
  projectId?: string;
  stakeholderId?: string;
  engineersData?: TOEngineerKPIs[];
  className?: string;
}

export type PerformanceTier = 'high_performer' | 'on_track' | 'needs_attention';

export interface TierConfig {
  tier: PerformanceTier;
  labelAr: string;
  labelEn: string;
  color: string;
  badgeBg: string;
}

export const PERFORMANCE_TIERS: Record<PerformanceTier, TierConfig> = {
  high_performer: {
    tier: 'high_performer',
    labelAr: 'أداء متميز',
    labelEn: 'High Performer',
    color: 'text-emerald-700 dark:text-emerald-300',
    badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
  },
  on_track: {
    tier: 'on_track',
    labelAr: 'ضمن المعدل',
    labelEn: 'On-Track',
    color: 'text-blue-700 dark:text-blue-300',
    badgeBg: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800',
  },
  needs_attention: {
    tier: 'needs_attention',
    labelAr: 'يحتاج إلى متابعة',
    labelEn: 'Needs Attention',
    color: 'text-rose-700 dark:text-rose-300',
    badgeBg: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800',
  },
};

export const getPerformanceTier = (kpi: TOEngineerKPIs): PerformanceTier => {
  const onTime = kpi.on_time_delivery_rate_pct || 0;
  const revision = kpi.code_cd_revision_rate_pct || 0;

  if (onTime >= 85 && revision <= 15) {
    return 'high_performer';
  }
  if (onTime < 70 || revision > 25) {
    return 'needs_attention';
  }
  return 'on_track';
};

export const TOEngineerKPIDashboard: React.FC<TOEngineerKPIDashboardProps> = ({
  projectId,
  stakeholderId,
  engineersData,
  className = '',
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | PerformanceTier>('all');
  const [selectedEngineerId, setSelectedEngineerId] = useState<string | null>(stakeholderId || null);

  // Fetch engineers and deliverable stats if not provided via props
  const {
    data: fetchedEngineers = [],
    isLoading,
  } = useQuery({
    queryKey: ['to-engineers-kpi-dashboard', projectId, stakeholderId],
    queryFn: async (): Promise<TOEngineerKPIs[]> => {
      if (engineersData && engineersData.length > 0) {
        return engineersData;
      }

      const stakeholderMap = new Map<string, { id: string; name_ar?: string; name_en?: string; email?: string; role?: string }>();

      // 1. Load active project stakeholders from Project Team (project_stakeholders)
      if (projectId && projectId !== 'all') {
        const psRows = await ProjectService.getProjectStakeholders(projectId);
        (psRows || []).forEach((ps: any) => {
          const isActive = ps.is_active !== false && (!ps.end_date || new Date(ps.end_date) >= new Date());
          const isTeamMember = ps.party_kind === 'employee' || !ps.party_kind;
          if (isActive && isTeamMember && ps.stakeholder?.id) {
            stakeholderMap.set(ps.stakeholder.id, {
              id: ps.stakeholder.id,
              name_ar: ps.stakeholder.name_ar,
              name_en: ps.stakeholder.name_en,
              email: ps.stakeholder.email,
              role: ps.role_in_project || ps.stakeholder.role,
            });
          }
        });
      } else {
        const { data: psAll } = await supabase
          .from('project_stakeholders')
          .select('*, stakeholder:stakeholders(*)')
          .eq('is_active', true);

        (psAll || []).forEach((ps: any) => {
          const isTeamMember = ps.party_kind === 'employee' || !ps.party_kind;
          if (isTeamMember && ps.stakeholder?.id && !stakeholderMap.has(ps.stakeholder.id)) {
            stakeholderMap.set(ps.stakeholder.id, {
              id: ps.stakeholder.id,
              name_ar: ps.stakeholder.name_ar,
              name_en: ps.stakeholder.name_en,
              email: ps.stakeholder.email,
              role: ps.role_in_project || ps.stakeholder.role,
            });
          }
        });
      }

      // 2. Also include any stakeholders directly assigned in deliverable items
      const { data: items } = await supabase
        .from('pm_deliverable_items')
        .select('assigned_stakeholder_id, assigned_stakeholder:stakeholders!assigned_stakeholder_id(id, name_ar, name_en, email, role)')
        .not('assigned_stakeholder_id', 'is', null);

      (items || []).forEach((i: any) => {
        const id = i.assigned_stakeholder_id;
        if (id && !stakeholderMap.has(id)) {
          const stk = Array.isArray(i.assigned_stakeholder) ? i.assigned_stakeholder[0] : i.assigned_stakeholder;
          stakeholderMap.set(id, {
            id,
            name_ar: stk?.name_ar,
            name_en: stk?.name_en,
            email: stk?.email,
            role: stk?.role,
          });
        }
      });

      const stakeholders = Array.from(stakeholderMap.values());
      if (stakeholders.length === 0) return [];

      const kpis = await Promise.all(
        stakeholders.map(async (st) => {
          const kpi = await KpiService.getTOEngineerKPIs(st.id, {
            projectId: projectId && projectId !== 'all' ? projectId : undefined,
          });
          return {
            ...kpi,
            stakeholder_name: st.name_ar || st.name_en || kpi.stakeholder_name || 'Engineer',
            engineer_name_ar: st.name_ar || kpi.engineer_name_ar,
            engineer_name_en: st.name_en || kpi.engineer_name_en,
            email: st.email || kpi.email,
          };
        })
      );

      return kpis;
    },
    enabled: !engineersData || engineersData.length === 0,
  });

  const allEngineers = engineersData || fetchedEngineers;

  // Filtered engineers list
  const filteredEngineers = useMemo(() => {
    return allEngineers.filter((eng) => {
      const tier = getPerformanceTier(eng);
      if (tierFilter !== 'all' && tier !== tierFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch =
          eng.stakeholder_name?.toLowerCase().includes(q) ||
          eng.engineer_name_ar?.toLowerCase().includes(q) ||
          eng.engineer_name_en?.toLowerCase().includes(q) ||
          eng.email?.toLowerCase().includes(q);
        if (!nameMatch) return false;
      }

      return true;
    });
  }, [allEngineers, tierFilter, searchQuery]);

  // Overall Aggregated Metrics
  const teamMetrics = useMemo(() => {
    if (allEngineers.length === 0) {
      return {
        avgOnTime: 0,
        avgRevision: 0,
        avgFirstPass: 0,
        avgDuration: 0,
        totalDrawingsApproved: 0,
        highPerformersCount: 0,
        needsAttentionCount: 0,
      };
    }

    const sumOnTime = allEngineers.reduce((s, e) => s + (e.on_time_delivery_rate_pct || 0), 0);
    const sumRevision = allEngineers.reduce((s, e) => s + (e.code_cd_revision_rate_pct || 0), 0);
    const sumFirstPass = allEngineers.reduce((s, e) => s + (e.first_pass_approval_rate_pct || 0), 0);
    const sumDuration = allEngineers.reduce((s, e) => s + (e.average_completion_duration_days || 0), 0);
    const totalApproved = allEngineers.reduce((s, e) => s + (e.total_drawings_approved || 0), 0);

    const highCount = allEngineers.filter((e) => getPerformanceTier(e) === 'high_performer').length;
    const attentionCount = allEngineers.filter((e) => getPerformanceTier(e) === 'needs_attention').length;

    return {
      avgOnTime: Math.round((sumOnTime / allEngineers.length) * 10) / 10,
      avgRevision: Math.round((sumRevision / allEngineers.length) * 10) / 10,
      avgFirstPass: Math.round((sumFirstPass / allEngineers.length) * 10) / 10,
      avgDuration: Math.round((sumDuration / allEngineers.length) * 10) / 10,
      totalDrawingsApproved: totalApproved,
      highPerformersCount: highCount,
      needsAttentionCount: attentionCount,
    };
  }, [allEngineers]);

  const activeSelectedEngineer = useMemo(() => {
    if (!selectedEngineerId) return filteredEngineers[0] || null;
    return allEngineers.find((e) => e.stakeholder_id === selectedEngineerId) || null;
  }, [selectedEngineerId, filteredEngineers, allEngineers]);

  if (isLoading && allEngineers.length === 0) {
    return <TOEngineerKPIDashboardSkeleton className={className} />;
  }

  return (
    <div className={`space-y-6 ${className}`} data-testid="to-engineer-kpi-dashboard">
      {/* Top Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>{isAr ? 'لوحة مؤشرات أداء مهندسي المكتب الفني' : 'Technical Office KPI Dashboard'}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isAr
              ? 'متابعة معدلات التسليم في الموعد، ونسب الملاحظات وإعادة التقديم، وسرعة اعتماد المخططات التنفيذية (مرتبطة بطاقم المشروع)'
              : 'Tracking on-time submittals, Code C/D revision rates, and drawing turnaround velocity (linked to Project Stakeholders)'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={projectId && projectId !== 'all' ? `/projects/${projectId}?tab=team` : '/projects'}
            className="inline-flex items-center gap-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 px-3 py-1.5 text-xs font-bold text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors"
          >
            <Users className="w-3.5 h-3.5" />
            <span>{isAr ? 'طاقم وشركاء المشروع' : 'Project Stakeholders'}</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
          <span className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 shadow-2xs">
            {allEngineers.length} {isAr ? 'مهندس بالمشروع' : 'Project Engineers'}
          </span>
        </div>
      </div>

      {/* 4 Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="to-kpi-summary-cards">
        {/* KPI 1: On-Time Delivery Rate */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAr ? 'نسبة التسليم في الموعد المحدد' : 'On-Time Delivery Rate'}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white tracking-tight" data-testid="team-on-time-rate">
              {teamMetrics.avgOnTime}%
            </span>
            <span className={`text-xs font-bold ${teamMetrics.avgOnTime >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {teamMetrics.avgOnTime >= 80 ? (isAr ? 'ممتاز' : 'Optimal') : (isAr ? 'المستهدف: 80%' : 'Target: 80%')}
            </span>
          </div>
          <div className="mt-2 w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, teamMetrics.avgOnTime)}%` }}
            />
          </div>
        </div>

        {/* KPI 2: Code C/D Revision Rate */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAr ? 'نسبة الملاحظات وإعادة التقديم' : 'Code C/D Revision Rate'}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <RotateCcw className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white tracking-tight" data-testid="team-revision-rate">
              {teamMetrics.avgRevision}%
            </span>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
              {isAr ? 'المستهدف: أقل من 15%' : 'Target: <15%'}
            </span>
          </div>
          <div className="mt-2 w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-rose-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, teamMetrics.avgRevision)}%` }}
            />
          </div>
        </div>

        {/* KPI 3: Average Completion Duration */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAr ? 'متوسط مدة إنجاز المخطط' : 'Avg Completion Duration'}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white tracking-tight" data-testid="team-avg-duration">
              {teamMetrics.avgDuration}
            </span>
            <span className="text-xs font-bold text-slate-400">
              {isAr ? 'يوم عمل / مخطط' : 'days / sheet'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span>{isAr ? 'إجمالي المخططات المعتمدة: ' : 'Total Approved Sheets: '}</span>
            <strong className="text-slate-800 dark:text-slate-200 font-mono">{teamMetrics.totalDrawingsApproved}</strong>
          </div>
        </div>

        {/* KPI 4: First-Pass Approval Rate */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAr ? 'معدل الاعتماد من التقديم الأول' : 'First-Pass Approval Rate'}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <FileCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white tracking-tight" data-testid="team-first-pass-rate">
              {teamMetrics.avgFirstPass}%
            </span>
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
              {isAr ? 'اعتماد دون ملاحظات' : '(Code A / B)'}
            </span>
          </div>
          <div className="mt-2 w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, teamMetrics.avgFirstPass)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Leaderboard & Filter Strip */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              {isAr ? 'قائمة تميز وأداء مهندسي المكتب الفني' : 'Technical Office Performance Leaderboard'}
            </h3>
            <span className="text-xs text-slate-400 font-mono">({filteredEngineers.length})</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute start-3 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'بحث باسم المهندس...' : 'Search engineer...'}
                className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 py-1.5 ps-8 pe-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-all"
                data-testid="search-engineer-input"
              />
            </div>

            {/* Tier Filter */}
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value as any)}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-1.5 text-xs text-slate-900 dark:text-white font-medium cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-all"
              data-testid="tier-filter-select"
            >
              <option value="all">{isAr ? 'جميع مستويات الأداء' : 'All Tiers'}</option>
              <option value="high_performer">{isAr ? 'أداء متميز فقط' : 'High Performers Only'}</option>
              <option value="on_track">{isAr ? 'ضمن المعدل فقط' : 'On-Track Only'}</option>
              <option value="needs_attention">{isAr ? 'يحتاج متابعة فقط' : 'Needs Attention Only'}</option>
            </select>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs" data-testid="engineer-leaderboard-table">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 text-[11px] font-bold uppercase text-slate-500">
              <tr>
                <th className="p-3 text-start">{isAr ? 'المهندس' : 'Engineer'}</th>
                <th className="p-3 text-center">{isAr ? 'المهام المسندة' : 'Assigned / Done'}</th>
                <th className="p-3 text-center">{isAr ? 'التسليم في الموعد' : 'On-Time %'}</th>
                <th className="p-3 text-center">{isAr ? 'نسبة إعادة التقديم' : 'Revision %'}</th>
                <th className="p-3 text-center">{isAr ? 'اعتماد أول مرة' : 'First-Pass %'}</th>
                <th className="p-3 text-center">{isAr ? 'متوسط المدة' : 'Avg Duration'}</th>
                <th className="p-3 text-center">{isAr ? 'تصنيف الأداء' : 'Performance Tier'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading && (
                <>
                  {[1, 2, 3, 4, 5].map((idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-800" />
                          <div className="space-y-1">
                            <div className="h-3.5 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
                            <div className="h-2.5 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-center"><div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded mx-auto" /></td>
                      <td className="p-3 text-center"><div className="h-4 w-10 bg-slate-200 dark:bg-slate-800 rounded mx-auto" /></td>
                      <td className="p-3 text-center"><div className="h-4 w-10 bg-slate-200 dark:bg-slate-800 rounded mx-auto" /></td>
                      <td className="p-3 text-center"><div className="h-4 w-10 bg-slate-200 dark:bg-slate-800 rounded mx-auto" /></td>
                      <td className="p-3 text-center"><div className="h-4 w-10 bg-slate-200 dark:bg-slate-800 rounded mx-auto" /></td>
                      <td className="p-3 text-center"><div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto" /></td>
                    </tr>
                  ))}
                </>
              )}

              {!isLoading && filteredEngineers.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <Users className="mx-auto h-6 w-6 opacity-40 mb-1" />
                    <span>{isAr ? 'لا توجد بيانات مهندسين مطابقة' : 'No engineer records found'}</span>
                  </td>
                </tr>
              )}

              {!isLoading &&
                filteredEngineers.map((eng) => {
                  const tier = getPerformanceTier(eng);
                  const tierConfig = PERFORMANCE_TIERS[tier];
                  const engineerName =
                    (isAr
                      ? (eng.engineer_name_ar || eng.stakeholder_name || eng.engineer_name_en)
                      : (eng.engineer_name_en || eng.stakeholder_name || eng.engineer_name_ar)) ||
                    eng.email ||
                    (isAr ? 'مهندس مكتب فني' : 'TO Engineer');

                  const isSelected = selectedEngineerId === eng.stakeholder_id;

                  return (
                    <tr
                      key={eng.stakeholder_id}
                      tabIndex={0}
                      role="button"
                      aria-selected={isSelected}
                      onClick={() => setSelectedEngineerId(eng.stakeholder_id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedEngineerId(eng.stakeholder_id);
                        }
                      }}
                      className={`transition-colors cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-inset ${
                        isSelected
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/30'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                      data-testid={`engineer-row-${eng.stakeholder_id}`}
                    >
                      {/* Name */}
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white shadow-2xs">
                            {engineerName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">
                              {engineerName}
                            </span>
                            {eng.email && (
                              <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">
                                {eng.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Assigned / Completed */}
                      <td className="p-3 text-center font-mono">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {eng.total_completed}
                        </span>
                        <span className="text-slate-400"> / {eng.total_assigned}</span>
                      </td>

                      {/* On-Time Rate */}
                      <td className="p-3 text-center">
                        <span
                          className={`font-mono font-bold ${
                            eng.on_time_delivery_rate_pct >= 85
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : eng.on_time_delivery_rate_pct >= 70
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {eng.on_time_delivery_rate_pct}%
                        </span>
                      </td>

                      {/* Revision Rate */}
                      <td className="p-3 text-center">
                        <span
                          className={`font-mono font-bold ${
                            eng.code_cd_revision_rate_pct <= 15
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : eng.code_cd_revision_rate_pct <= 25
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {eng.code_cd_revision_rate_pct}%
                        </span>
                      </td>

                      {/* First-Pass Rate */}
                      <td className="p-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                        {eng.first_pass_approval_rate_pct}%
                      </td>

                      {/* Avg Duration */}
                      <td className="p-3 text-center font-mono text-slate-600 dark:text-slate-400">
                        {eng.average_completion_duration_days} {isAr ? 'يوم' : 'd'}
                      </td>

                      {/* Badge */}
                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold shadow-2xs transition-all ${tierConfig.badgeBg}`}
                          data-testid={`tier-badge-${eng.stakeholder_id}`}
                        >
                          {tier === 'high_performer' && <Sparkles className="w-3 h-3" />}
                          {tier === 'needs_attention' && <AlertTriangle className="w-3 h-3" />}
                          <span>{isAr ? tierConfig.labelAr : tierConfig.labelEn}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Engineer Deep-Dive Card */}
      {activeSelectedEngineer && (
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4" data-testid="selected-engineer-detail">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 font-bold text-sm shadow-2xs">
                {(
                  (isAr
                    ? (activeSelectedEngineer.engineer_name_ar || activeSelectedEngineer.stakeholder_name)
                    : (activeSelectedEngineer.engineer_name_en || activeSelectedEngineer.stakeholder_name)) || 'TO'
                ).slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {(isAr
                    ? (activeSelectedEngineer.engineer_name_ar || activeSelectedEngineer.stakeholder_name || activeSelectedEngineer.engineer_name_en)
                    : (activeSelectedEngineer.engineer_name_en || activeSelectedEngineer.stakeholder_name || activeSelectedEngineer.engineer_name_ar)) ||
                    (isAr ? 'مهندس مكتب فني' : 'Technical Office Engineer')}
                </h4>
                <span className="text-[11px] text-slate-400">
                  {isAr ? 'تفاصيل الأداء الفردي ومؤشرات جودة المخططات' : 'Individual Performance & Submittal Quality'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold shadow-2xs ${PERFORMANCE_TIERS[getPerformanceTier(activeSelectedEngineer)].badgeBg}`}>
                {getPerformanceTier(activeSelectedEngineer) === 'high_performer' && <Sparkles className="w-3.5 h-3.5" />}
                {getPerformanceTier(activeSelectedEngineer) === 'needs_attention' && <AlertTriangle className="w-3.5 h-3.5" />}
                <span>
                  {isAr ? PERFORMANCE_TIERS[getPerformanceTier(activeSelectedEngineer)].labelAr : PERFORMANCE_TIERS[getPerformanceTier(activeSelectedEngineer)].labelEn}
                </span>
              </span>
            </div>
          </div>

          {/* Submittal Distribution Visual Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-emerald-100 dark:border-emerald-950 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 text-center transition-all hover:border-emerald-300 dark:hover:border-emerald-800">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block">
                {isAr ? 'اعتمادات بدون ملاحظات' : 'Approved (Code A/B)'}
              </span>
              <span className="text-xl font-mono font-extrabold text-emerald-800 dark:text-emerald-300">
                {activeSelectedEngineer.code_ab_items || activeSelectedEngineer.total_drawings_approved || 0}
              </span>
            </div>

            <div className="rounded-2xl border border-amber-100 dark:border-amber-950 bg-amber-50/50 dark:bg-amber-950/20 p-3 text-center transition-all hover:border-amber-300 dark:hover:border-amber-800">
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 block">
                {isAr ? 'تعديل وإعادة تقديم' : 'Revise & Resubmit (Code C)'}
              </span>
              <span className="text-xl font-mono font-extrabold text-amber-800 dark:text-amber-300">
                {activeSelectedEngineer.code_c_items || activeSelectedEngineer.items_with_code_c || 0}
              </span>
            </div>

            <div className="rounded-2xl border border-rose-100 dark:border-rose-950 bg-rose-50/50 dark:bg-rose-950/20 p-3 text-center transition-all hover:border-rose-300 dark:hover:border-rose-800">
              <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 block">
                {isAr ? 'مرفوض كلياً' : 'Rejected (Code D)'}
              </span>
              <span className="text-xl font-mono font-extrabold text-rose-800 dark:text-rose-300">
                {activeSelectedEngineer.code_d_items || 0}
              </span>
            </div>

            <div className="rounded-2xl border border-blue-100 dark:border-blue-950 bg-blue-50/50 dark:bg-blue-950/20 p-3 text-center transition-all hover:border-blue-300 dark:hover:border-blue-800">
              <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 block">
                {isAr ? 'قيد العمل بالمكتب' : 'In-Progress Active'}
              </span>
              <span className="text-xl font-mono font-extrabold text-blue-800 dark:text-blue-300">
                {activeSelectedEngineer.in_progress_count || 0}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { TOEngineerKPIDashboardSkeleton } from './DashboardSkeletons';

