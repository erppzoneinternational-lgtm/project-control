'use client';

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  RadialBarChart,
  RadialBar,
  FunnelChart,
  Funnel,
  LabelList,
  Treemap,
  ScatterChart,
  Scatter,
} from 'recharts';
import {
  PieChart as PieIcon,
  BarChart3,
  LineChart as LineIcon,
  CircleDot,
  AreaChart as AreaIcon,
  Layers,
  Compass,
  Gauge,
  Filter,
  LayoutGrid,
  Sparkles,
  Maximize2,
  Grid3X3,
  AlignLeft,
  Activity,
  TrendingUp,
} from 'lucide-react';
import { ChartDatum, ChartType, CHART_COLORS } from '@/lib/reports/reportCatalog';

export interface ChartMeta {
  type: ChartType;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badge: string;
}

export const ALL_CHART_TYPES_META: ChartMeta[] = [
  {
    type: 'donut',
    nameAr: 'مخطط الدونات الحلقي',
    nameEn: 'Donut Ring Chart',
    descAr: 'التوزيع النسبي والحصص الحلقية المفرغة مع بيان النسبة الإجمالية',
    descEn: 'Proportional Ring Distribution with Center Volume',
    icon: CircleDot,
    color: '#0d9488',
    badge: 'RING',
  },
  {
    type: 'pie',
    nameAr: 'المخطط الدائري الكامل',
    nameEn: 'Full Pie Sector Chart',
    descAr: 'توزيع الحصص والنسب المئوية الدائرية لكافة الشرائح',
    descEn: 'Full Angular Sector Share & Percentage Breakdown',
    icon: PieIcon,
    color: '#2563eb',
    badge: 'PIE',
  },
  {
    type: 'bar',
    nameAr: 'الأعمدة البيانية الرأسية',
    nameEn: 'Vertical Bar / Column Chart',
    descAr: 'مقارنة المقادير والأحجام الكمية مع تدرج متناسق للأعمدة',
    descEn: 'Direct Column Volume Comparison with Rounded Tops',
    icon: BarChart3,
    color: '#10b981',
    badge: 'BAR',
  },
  {
    type: 'horizontal_bar',
    nameAr: 'الأعمدة البيانية الأفقية',
    nameEn: 'Horizontal Bar Chart',
    descAr: 'الترتيب والتصنيف الأفقي للمقارنات التنازلية',
    descEn: 'Ranking & Category Comparison along Horizontal Axes',
    icon: AlignLeft,
    color: '#0284c7',
    badge: 'RANK',
  },
  {
    type: 'line',
    nameAr: 'المخطط الخطي الانسيابي',
    nameEn: 'Interactive Line Chart',
    descAr: 'تتبع الاتجاهات والمنحنيات التراكمية مع مؤشرات النقاط الحية',
    descEn: 'Continuous Trend Curves with Active Data Points',
    icon: LineIcon,
    color: '#6366f1',
    badge: 'TREND',
  },
  {
    type: 'area',
    nameAr: 'المخطط المساحي التدرجي',
    nameEn: 'Gradient Area Chart',
    descAr: 'المساحة والحجم التراكمي بتدرج ناعم يعكس الثقل الحجمي',
    descEn: 'Cumulative Volume Mass with Dual-Stop Gradient',
    icon: AreaIcon,
    color: '#0f766e',
    badge: 'MASS',
  },
  {
    type: 'composed',
    nameAr: 'المخطط الهجين المزدوج',
    nameEn: 'Composed Combo Chart (Bar + Line)',
    descAr: 'مقارنة مزدوجة متزامنة: أعمدة القيمة مع خط الاتجاه والتطور',
    descEn: 'Simultaneous Dual-Perspective: Bars & Trend Curve',
    icon: Layers,
    color: '#8b5cf6',
    badge: 'COMBO',
  },
  {
    type: 'radar',
    nameAr: 'مخطط الرادار الشبكي',
    nameEn: 'Radar / Spider Chart',
    descAr: 'توازن الأبعاد والتوزيع المحوري متعدد الاتجاهات الهندسية',
    descEn: 'Multidimensional Balance Polygon across Radial Axes',
    icon: Compass,
    color: '#d97706',
    badge: 'RADAR',
  },
  {
    type: 'radial',
    nameAr: 'مخطط الأشرطة الشعاعية',
    nameEn: 'Radial Bar Gauge Chart',
    descAr: 'المقاييس الدائرية ونسب الأداء والسرعة كمسارات دائرية',
    descEn: 'Circular Progress & Gauge Tracks with Segment Fill',
    icon: Gauge,
    color: '#ec4899',
    badge: 'GAUGE',
  },
  {
    type: 'funnel',
    nameAr: 'مخطط القمع التدفقي',
    nameEn: 'Funnel Pipeline Chart',
    descAr: 'مراحل ومستويات التدفق والتحويل المتسلسل تنازلياً',
    descEn: 'Pipeline & Stage Conversion Flow across Categories',
    icon: Filter,
    color: '#f97316',
    badge: 'FUNNEL',
  },
  {
    type: 'treemap',
    nameAr: 'خريطة الشجرة المساحية',
    nameEn: 'Treemap Matrix Chart',
    descAr: 'الكتل النسبية والمساحات الهيكلية المتداخلة بحسب الحجم',
    descEn: 'Proportional Nested Tile Layout for Hierarchical Weight',
    icon: LayoutGrid,
    color: '#14b8a6',
    badge: 'TILES',
  },
  {
    type: 'scatter',
    nameAr: 'مخطط التشتت والنقاط الإحصائية',
    nameEn: 'Scatter & Density Plot',
    descAr: 'توزيع الكثافة والتشتت الإحصائي على المحاور الرقمية',
    descEn: 'Coordinate Dispersion & Clusters across Numerical Space',
    icon: Sparkles,
    color: '#06b6d4',
    badge: 'DOTS',
  },
];

interface ReportChartsHubProps {
  data: ChartDatum[];
  chartType: ChartType;
  onChartTypeChange?: (next: ChartType) => void;
  title: string;
  subtitle?: string;
  isDark?: boolean;
}

export function ReportChartsHub({
  data,
  chartType,
  onChartTypeChange,
  title,
  subtitle,
  isDark = false,
}: ReportChartsHubProps) {
  // View mode: 'all_simultaneous' renders ALL 12 charts side by side!
  const [viewMode, setViewMode] = useState<'all_simultaneous' | 'single'>('all_simultaneous');
  const [focusedType, setFocusedType] = useState<ChartType>(chartType === 'all' ? 'donut' : chartType);

  // Sync if external chartType changes and is not 'all'
  React.useEffect(() => {
    if (chartType && chartType !== 'all') {
      setFocusedType(chartType);
    }
  }, [chartType]);

  const totalVal = useMemo(() => data.reduce((s, d) => s + (d.value || 0), 0), [data]);
  const avgVal = useMemo(() => (data.length > 0 ? totalVal / data.length : 0), [data, totalVal]);
  const maxItem = useMemo(() => {
    if (data.length === 0) return null;
    return [...data].sort((a, b) => b.value - a.value)[0];
  }, [data]);

  // Prepared data variations for specialized charts
  const radialData = useMemo(() => {
    return data.map((d, i) => ({
      ...d,
      fill: d.fill || CHART_COLORS[i % CHART_COLORS.length],
    }));
  }, [data]);

  const funnelData = useMemo(() => {
    return [...data]
      .sort((a, b) => b.value - a.value)
      .map((d, i) => ({
        ...d,
        fill: d.fill || CHART_COLORS[i % CHART_COLORS.length],
      }));
  }, [data]);

  const scatterData = useMemo(() => {
    return data.map((d, i) => ({
      ...d,
      xIndex: i + 1,
      yValue: d.value,
    }));
  }, [data]);

  // Unified Custom Tooltip
  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const raw = payload[0].payload as any;
      const val = typeof raw.value === 'number' ? raw.value : typeof raw.yValue === 'number' ? raw.yValue : 0;
      const pct = totalVal > 0 ? ((val / totalVal) * 100).toFixed(1) : '0';
      return (
        <div className="bg-slate-900/95 dark:bg-slate-950/95 text-white p-3 rounded-xl border border-slate-700/60 shadow-2xl backdrop-blur-md text-xs z-50 min-w-[170px] dir-rtl text-right">
          <div className="font-bold text-slate-200 mb-1 border-b border-slate-800 pb-1 flex items-center justify-between">
            <span className="truncate max-w-[130px]">{raw.name || `شريحة #${raw.xIndex}`}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-teal-400 font-mono">
              {pct}%
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 text-emerald-400 font-mono font-bold text-sm mt-1.5">
            <span>القيمة / العدد:</span>
            <span dir="ltr">{raw.formatted || val.toLocaleString()}</span>
          </div>
          {raw.subtext && <div className="text-[10px] text-slate-400 mt-1">{raw.subtext}</div>}
        </div>
      );
    }
    return null;
  };

  // Helper to render any of the 12 charts given its type
  const renderSingleChartCanvas = (type: ChartType, heightClass: string = 'h-64') => {
    if (data.length === 0) {
      return (
        <div className={`w-full ${heightClass} flex flex-col items-center justify-center text-slate-400 text-xs`}>
          <Activity className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2 animate-pulse" />
          <p>لا توجد بيانات متاحة لهذا المخطط</p>
        </div>
      );
    }

    return (
      <div className={`w-full ${heightClass}`}>
        <ResponsiveContainer width="100%" height="100%">
          {(() => {
            switch (type) {
              case 'donut':
                return (
                  <PieChart>
                    <Tooltip content={customTooltip} />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10.5px', paddingTop: '4px' }} />
                    <Pie
                      data={data}
                      cx="50%"
                      cy="48%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="name"
                      animationDuration={700}
                    >
                      {data.map((entry, idx) => (
                        <Cell
                          key={`donut-${idx}`}
                          fill={entry.fill || CHART_COLORS[idx % CHART_COLORS.length]}
                          stroke={isDark ? '#0f172a' : '#ffffff'}
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                );

              case 'pie':
                return (
                  <PieChart>
                    <Tooltip content={customTooltip} />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10.5px', paddingTop: '4px' }} />
                    <Pie
                      data={data}
                      cx="50%"
                      cy="48%"
                      innerRadius={0}
                      outerRadius={80}
                      paddingAngle={1}
                      dataKey="value"
                      nameKey="name"
                      animationDuration={700}
                    >
                      {data.map((entry, idx) => (
                        <Cell
                          key={`pie-${idx}`}
                          fill={entry.fill || CHART_COLORS[idx % CHART_COLORS.length]}
                          stroke={isDark ? '#0f172a' : '#ffffff'}
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                );

              case 'bar':
                return (
                  <BarChart data={data} margin={{ top: 12, right: 10, left: 10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.12} vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 9.5, fill: isDark ? '#94a3b8' : '#64748b' }}
                      angle={-15}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis tick={{ fontSize: 9.5, fill: isDark ? '#94a3b8' : '#64748b' }} />
                    <Tooltip content={customTooltip} />
                    <Bar dataKey="value" radius={[5, 5, 0, 0]} animationDuration={700}>
                      {data.map((entry, idx) => (
                        <Cell key={`bar-${idx}`} fill={entry.fill || CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                );

              case 'horizontal_bar':
                return (
                  <BarChart data={data} layout="vertical" margin={{ top: 10, right: 20, left: 25, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.12} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 9.5, fill: isDark ? '#94a3b8' : '#64748b' }} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fontSize: 9.5, fill: isDark ? '#94a3b8' : '#64748b' }}
                      width={85}
                    />
                    <Tooltip content={customTooltip} />
                    <Bar dataKey="value" radius={[0, 5, 5, 0]} animationDuration={700}>
                      {data.map((entry, idx) => (
                        <Cell key={`hbar-${idx}`} fill={entry.fill || CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                );

              case 'line':
                return (
                  <LineChart data={data} margin={{ top: 12, right: 15, left: 10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.12} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 9.5, fill: isDark ? '#94a3b8' : '#64748b' }}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis tick={{ fontSize: 9.5, fill: isDark ? '#94a3b8' : '#64748b' }} />
                    <Tooltip content={customTooltip} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#0f766e"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#10b981' }}
                      activeDot={{ r: 6 }}
                      animationDuration={700}
                    />
                  </LineChart>
                );

              case 'area':
                return (
                  <AreaChart data={data} margin={{ top: 12, right: 15, left: 10, bottom: 25 }}>
                    <defs>
                      <linearGradient id={`areaGrad-${type}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0f766e" stopOpacity={0.65} />
                        <stop offset="95%" stopColor="#0f766e" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.12} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 9.5, fill: isDark ? '#94a3b8' : '#64748b' }}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis tick={{ fontSize: 9.5, fill: isDark ? '#94a3b8' : '#64748b' }} />
                    <Tooltip content={customTooltip} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#0f766e"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill={`url(#areaGrad-${type})`}
                      animationDuration={700}
                    />
                  </AreaChart>
                );

              case 'composed':
                return (
                  <ComposedChart data={data} margin={{ top: 12, right: 15, left: 10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.12} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 9.5, fill: isDark ? '#94a3b8' : '#64748b' }}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis tick={{ fontSize: 9.5, fill: isDark ? '#94a3b8' : '#64748b' }} />
                    <Tooltip content={customTooltip} />
                    <Bar dataKey="value" fill="#0d9488" radius={[4, 4, 0, 0]} opacity={0.8} />
                    <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4, fill: '#d97706' }} />
                  </ComposedChart>
                );

              case 'radar':
                return (
                  <RadarChart cx="50%" cy="50%" outerRadius={75} data={data}>
                    <PolarGrid opacity={0.25} />
                    <PolarAngleAxis dataKey="name" tick={{ fontSize: 9, fill: isDark ? '#94a3b8' : '#64748b' }} />
                    <PolarRadiusAxis tick={{ fontSize: 8.5, fill: isDark ? '#94a3b8' : '#64748b' }} />
                    <Tooltip content={customTooltip} />
                    <Radar name="المؤشرات" dataKey="value" stroke="#0f766e" fill="#14b8a6" fillOpacity={0.5} />
                  </RadarChart>
                );

              case 'radial':
                return (
                  <RadialBarChart cx="50%" cy="50%" innerRadius="25%" outerRadius="90%" barSize={8} data={radialData}>
                    <RadialBar background dataKey="value" cornerRadius={6} />
                    <Tooltip content={customTooltip} />
                    <Legend iconSize={8} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '9.5px' }} />
                  </RadialBarChart>
                );

              case 'funnel':
                return (
                  <FunnelChart>
                    <Tooltip content={customTooltip} />
                    <Funnel dataKey="value" data={funnelData} isAnimationActive>
                      <LabelList position="right" fill={isDark ? '#e2e8f0' : '#1e293b'} stroke="none" dataKey="name" fontSize={9.5} />
                    </Funnel>
                  </FunnelChart>
                );

              case 'treemap':
                return (
                  <Treemap
                    data={data as any}
                    dataKey="value"
                    nameKey="name"
                    stroke={isDark ? '#0f172a' : '#ffffff'}
                    fill="#0f766e"
                    aspectRatio={4 / 3}
                    animationDuration={700}
                  >
                    <Tooltip content={customTooltip} />
                  </Treemap>
                );

              case 'scatter':
                return (
                  <ScatterChart margin={{ top: 12, right: 15, left: 10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.12} />
                    <XAxis dataKey="xIndex" name="الترتيب" tick={{ fontSize: 9.5, fill: isDark ? '#94a3b8' : '#64748b' }} />
                    <YAxis dataKey="value" name="القيمة" tick={{ fontSize: 9.5, fill: isDark ? '#94a3b8' : '#64748b' }} />
                    <Tooltip content={customTooltip} />
                    <Scatter name="المؤشرات" data={scatterData} fill="#0d9488" />
                  </ScatterChart>
                );

              default:
                return (
                  <BarChart data={data} margin={{ top: 12, right: 10, left: 10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.12} vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 9.5, fill: isDark ? '#94a3b8' : '#64748b' }} angle={-15} textAnchor="end" />
                    <YAxis tick={{ fontSize: 9.5, fill: isDark ? '#94a3b8' : '#64748b' }} />
                    <Tooltip content={customTooltip} />
                    <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                      {data.map((entry, idx) => (
                        <Cell key={`default-bar-${idx}`} fill={entry.fill || CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                );
            }
          })()}
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 sm:p-6 transition-all space-y-5">
      {/* ── 1. Master Header & Unified Viewing Modes ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200/70 dark:border-teal-800/70 text-teal-600 dark:text-teal-400 shadow-xs">
              <Activity className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>{title}</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-teal-100/70 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 font-bold">
                  12 مخططاً عالمياً متزامناً
                </span>
              </h3>
              {subtitle && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{subtitle}</p>
              )}
            </div>
          </div>
        </div>

        {/* View Mode Controller */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 shadow-xs">
            <button
              type="button"
              onClick={() => {
                setViewMode('all_simultaneous');
                if (onChartTypeChange) onChartTypeChange('all');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'all_simultaneous'
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>عرض شامل لكافة الرسوم معاً (12 Chart Matrix)</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('single')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'single'
                  ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>عرض مركز لمنفرد</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Telemetry Ribbon for Active Dataset ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/70 dark:bg-slate-850/60 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-500" />
          <span className="text-slate-500 dark:text-slate-400">إجمالي الشرائح:</span>
          <span className="font-mono font-bold text-slate-900 dark:text-white">{data.length} فئات</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-slate-500 dark:text-slate-400">القيمة الإجمالية:</span>
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400" dir="ltr">
            {totalVal.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-slate-500 dark:text-slate-400">متوسط الشريحة:</span>
          <span className="font-mono font-bold text-blue-600 dark:text-blue-400" dir="ltr">
            {Math.round(avgVal).toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-2 truncate">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-slate-500 dark:text-slate-400">أعلى فئة:</span>
          <span className="font-bold text-amber-700 dark:text-amber-400 truncate" title={maxItem?.name}>
            {maxItem?.name || '—'}
          </span>
        </div>
      </div>

      {/* ── 3. MODE A: ALL 12 CHARTS SIMULTANEOUS LIVE GRID ── */}
      {viewMode === 'all_simultaneous' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {ALL_CHART_TYPES_META.map((meta, index) => {
              const IconComp = meta.icon;
              return (
                <div
                  key={meta.type}
                  className="group relative flex flex-col justify-between bg-white dark:bg-slate-900/95 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs hover:shadow-xl hover:border-teal-500/50 transition-all duration-200"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-3 pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <div
                        className="p-1.5 rounded-lg text-white shadow-xs shrink-0"
                        style={{ backgroundColor: meta.color }}
                      >
                        <IconComp className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {meta.nameAr}
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
                            #{index + 1}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate max-w-[170px]">
                          {meta.nameEn}
                        </div>
                      </div>
                    </div>

                    {/* Focus Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setFocusedType(meta.type);
                        setViewMode('single');
                        if (onChartTypeChange) onChartTypeChange(meta.type);
                      }}
                      title="تكبير هذا المخطط والتركيز عليه"
                      className="p-1 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:bg-teal-950/40 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Chart Content */}
                  <div className="flex-1">
                    {renderSingleChartCanvas(meta.type, 'h-60 sm:h-64')}
                  </div>

                  {/* Mini Card Footer */}
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/70 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                    <span className="truncate max-w-[190px]">{meta.descAr}</span>
                    <span className="font-mono font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-1.5 py-0.5 rounded border border-teal-200/50 dark:border-teal-800/50">
                      {meta.badge}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 4. MODE B: SINGLE EXPANDED FOCUS CANVAS ── */}
      {viewMode === 'single' && (
        <div className="space-y-4">
          {/* Chart Type Tabs Selector for Single Mode */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
            {ALL_CHART_TYPES_META.map((meta) => {
              const IconComp = meta.icon;
              const isSelected = focusedType === meta.type;
              return (
                <button
                  key={meta.type}
                  type="button"
                  onClick={() => {
                    setFocusedType(meta.type);
                    if (onChartTypeChange) onChartTypeChange(meta.type);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 border ${
                    isSelected
                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border-slate-200/70 dark:border-slate-700/70 hover:bg-slate-100'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span>{meta.nameAr}</span>
                </button>
              );
            })}
          </div>

          {/* Focused Canvas Container */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {ALL_CHART_TYPES_META.find((m) => m.type === focusedType)?.nameAr} — عرض تفصيلي موسع
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewMode('all_simultaneous')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-teal-700 text-xs font-bold transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                <Grid3X3 className="w-3.5 h-3.5 text-teal-600" />
                <span>العودة لعرض كافة الرسوم الـ 12 معاً</span>
              </button>
            </div>

            {renderSingleChartCanvas(focusedType, 'h-80 sm:h-96')}
          </div>
        </div>
      )}

      {/* ── 5. Global Category Legend Pills ── */}
      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px]">
        <span className="text-slate-400 font-bold ml-1">توزيع الفئات:</span>
        {data.slice(0, 10).map((item, idx) => (
          <div
            key={idx}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-300"
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: item.fill || CHART_COLORS[idx % CHART_COLORS.length] }}
            />
            <span className="font-medium truncate max-w-[120px]">{item.name}:</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white" dir="ltr">
              {item.formatted || (typeof item.value === 'number' ? item.value.toLocaleString() : item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
