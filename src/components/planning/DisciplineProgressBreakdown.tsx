'use client';

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  Layers,
  TrendingUp,
  DollarSign,
  Loader2,
  PieChart,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';

export interface DisciplineProgressBreakdownProps {
  projectId: string;
  className?: string;
}

export interface DisciplineProgress {
  discipline: string;
  disciplineLabel: string;
  avgProgress: number;
  taskCount: number;
  totalBudget: number;
  color: string;
  order?: number;
}

export const DISCIPLINE_CONFIG: Record<
  string,
  { label: string; color: string; order: number }
> = {
  civil: { label: 'أعمال خرسانية', color: '#3B82F6', order: 1 },
  finishing: { label: 'تشطيبات', color: '#F59E0B', order: 2 },
  mep: { label: 'ميكانيكا وكهرباء', color: '#06B6D4', order: 3 },
  landscape: { label: 'تنسيق حدائق', color: '#10B981', order: 4 },
  water_features: { label: 'عناصر مائية', color: '#0EA5E9', order: 5 },
  other: { label: 'أخرى', color: '#8B5CF6', order: 6 },
};

function normalizeDiscipline(discipline: string | null | undefined): string {
  if (!discipline) return 'other';
  const clean = discipline.trim().toLowerCase();
  if (clean === 'civil') return 'civil';
  if (clean === 'finishing') return 'finishing';
  if (
    clean === 'mep' ||
    clean === 'mech' ||
    clean === 'elec' ||
    clean === 'mechanical' ||
    clean === 'electrical'
  ) {
    return 'mep';
  }
  if (clean === 'landscape') return 'landscape';
  if (
    clean === 'water_features' ||
    clean === 'water' ||
    clean === 'water_feature' ||
    clean === 'water features'
  ) {
    return 'water_features';
  }
  if (clean === 'other') return 'other';
  return clean;
}

export const DisciplineProgressBreakdown: React.FC<DisciplineProgressBreakdownProps> = ({
  projectId,
  className = '',
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const { data: rawActivities = [], isLoading } = useQuery({
    queryKey: ['discipline-progress-breakdown', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('pm_project_activities')
        .select('discipline, percent_complete, budgeted_cost_egp')
        .eq('project_id', projectId)
        .eq('is_archived', false);

      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  const { disciplineData, totalTasks, weightedAvgProgress, totalBudget } =
    useMemo(() => {
      if (!rawActivities || rawActivities.length === 0) {
        return {
          disciplineData: [] as DisciplineProgress[],
          totalTasks: 0,
          weightedAvgProgress: 0,
          totalBudget: 0,
        };
      }

      const groups: Record<
        string,
        {
          discipline: string;
          sumProgress: number;
          taskCount: number;
          totalBudget: number;
          weightedProgressSum: number;
        }
      > = {};

      let overallBudget = 0;
      let overallWeightedProgressSum = 0;
      let overallProgressSum = 0;
      let overallTaskCount = 0;

      rawActivities.forEach((item) => {
        const rawDiscipline = item.discipline || 'other';
        const norm = normalizeDiscipline(rawDiscipline);
        const progress = Number(item.percent_complete) || 0;
        const budget = Number(item.budgeted_cost_egp) || 0;

        if (!groups[norm]) {
          groups[norm] = {
            discipline: norm,
            sumProgress: 0,
            taskCount: 0,
            totalBudget: 0,
            weightedProgressSum: 0,
          };
        }

        groups[norm].sumProgress += progress;
        groups[norm].taskCount += 1;
        groups[norm].totalBudget += budget;
        groups[norm].weightedProgressSum += progress * budget;

        overallTaskCount += 1;
        overallProgressSum += progress;
        overallBudget += budget;
        overallWeightedProgressSum += progress * budget;
      });

      const result: DisciplineProgress[] = Object.values(groups)
        .map((g) => {
          const meta = DISCIPLINE_CONFIG[g.discipline] || {
            label: g.discipline,
            color: '#94A3B8',
            order: 99,
          };
          return {
            discipline: g.discipline,
            disciplineLabel: meta.label,
            avgProgress:
              g.taskCount > 0
                ? Math.round((g.sumProgress / g.taskCount) * 10) / 10
                : 0,
            taskCount: g.taskCount,
            totalBudget: g.totalBudget,
            color: meta.color,
            order: meta.order,
          };
        })
        .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

      const weightedAvg =
        overallBudget > 0
          ? Math.round((overallWeightedProgressSum / overallBudget) * 10) / 10
          : overallTaskCount > 0
          ? Math.round((overallProgressSum / overallTaskCount) * 10) / 10
          : 0;

      return {
        disciplineData: result,
        totalTasks: overallTaskCount,
        weightedAvgProgress: weightedAvg,
        totalBudget: overallBudget,
      };
    }, [rawActivities]);

  const formatShortCurrency = (val: number) => {
    if (val >= 1e6) {
      return `${(val / 1e6).toFixed(1)}M ج.م`;
    }
    if (val >= 1e3) {
      return `${(val / 1e3).toFixed(0)}K ج.م`;
    }
    return `${new Intl.NumberFormat('en-US').format(val)} ج.م`;
  };

  if (isLoading) {
    return (
      <div
        className={`p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm ${className}`}
      >
        <div className="flex flex-col items-center justify-center py-12 space-y-3">
          <Loader2 className="w-7 h-7 text-emerald-500 animate-spin" />
          <span className="text-xs text-slate-500 font-bold">
            {isAr
              ? 'جاري تحميل تفاصيل نسب إنجاز التخصصات...'
              : 'Loading discipline progress breakdown...'}
          </span>
        </div>
      </div>
    );
  }

  if (disciplineData.length === 0) {
    return (
      <div
        className={`p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm ${className}`}
      >
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <PieChart className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {isAr
              ? 'تفصيل نسبة الإنجاز حسب التخصص'
              : 'Discipline Progress Breakdown'}
          </h3>
        </div>
        <div className="text-center py-10 text-slate-400 text-xs">
          {isAr
            ? 'لا توجد أنشطة مسجلة لهذا المشروع بعد'
            : 'No activities recorded for this project yet.'}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6 ${className}`}
      dir="rtl"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              {isAr
                ? 'تفصيل نسبة الإنجاز حسب التخصص'
                : 'Discipline Progress Breakdown'}
            </h3>
            <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              {disciplineData.length} {isAr ? 'تخصصات' : 'Disciplines'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isAr
              ? 'متوسط نسب الإنجاز وتوزيع المهام والميزانيات التقديرية لكل تخصص'
              : 'Average completion percentage and task distribution per discipline'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {isAr ? 'الإنجاز المرجح:' : 'Weighted Progress:'}
          </span>
          <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-xl border border-emerald-500/20">
            {weightedAvgProgress}%
          </span>
        </div>
      </div>

      {/* Horizontal Bar Chart */}
      <div className="w-full min-w-0 h-64 overflow-hidden" dir="ltr">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
          <BarChart
            data={disciplineData}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 30, bottom: 10 }}
          >
            <XAxis
              type="number"
              domain={[0, 100]}
              tickFormatter={(val) => `${val}%`}
              stroke="#64748B"
              fontSize={11}
            />
            <YAxis
              dataKey="disciplineLabel"
              type="category"
              width={110}
              stroke="#64748B"
              fontSize={12}
              tick={{ fill: '#94A3B8' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0F172A',
                borderColor: '#334155',
                borderRadius: '12px',
                color: '#F8FAFC',
                fontSize: '11px',
                direction: isAr ? 'rtl' : 'ltr',
                textAlign: isAr ? 'right' : 'left',
              }}
              formatter={(val, _, item) => {
                const payload = item?.payload as DisciplineProgress;
                return [
                  `${val}% (${payload.taskCount} ${
                    isAr ? 'مهمة' : 'tasks'
                  } | ${formatShortCurrency(payload.totalBudget)})`,
                  isAr ? 'متوسط الإنجاز' : 'Avg Progress',
                ];
              }}
              labelFormatter={(label) =>
                `${isAr ? 'التخصص' : 'Discipline'}: ${label}`
              }
            />
            <Bar dataKey="avgProgress" radius={[0, 6, 6, 0]} barSize={22}>
              {disciplineData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        {/* Card 1: Total Tasks */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAr ? 'إجمالي الأنشطة والمهام' : 'Total Tasks'}
            </span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
              {totalTasks}
            </span>
            <span className="text-[11px] text-slate-500">
              {isAr ? 'نشاط نشط' : 'active activities'}
            </span>
          </div>
          <div className="text-[10px] text-slate-400">
            {isAr
              ? `موزعة على ${disciplineData.length} تخصصات`
              : `Across ${disciplineData.length} disciplines`}
          </div>
        </div>

        {/* Card 2: Weighted Average Progress */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAr ? 'متوسط الإنجاز المرجح' : 'Weighted Avg Progress'}
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {weightedAvgProgress}%
            </span>
            <span className="text-[11px] font-bold text-emerald-600">
              {weightedAvgProgress >= 50
                ? isAr
                  ? 'متقدم'
                  : 'Advanced'
                : isAr
                ? 'قيد التنفيذ'
                : 'In Progress'}
            </span>
          </div>
          <div className="text-[10px] text-slate-400">
            {isAr
              ? 'مرجح بالميزانية التقديرية للأنشطة'
              : 'Weighted by activity budget'}
          </div>
        </div>

        {/* Card 3: Total Budget */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAr ? 'إجمالي الميزانية التقديرية' : 'Total Budgeted Cost'}
            </span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-purple-700 dark:text-purple-400">
              {formatShortCurrency(totalBudget)}
            </span>
          </div>
          <div className="text-[10px] text-slate-400">
            {isAr
              ? 'مجموع التكلفة المخططة للأنشطة'
              : 'Sum of planned activity budgets'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisciplineProgressBreakdown;
