'use client';

import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import { TrendingUp, BarChart2 } from 'lucide-react';

interface SCurveDataPoint {
  date: string;
  actual: number;
  verified: number;
  planned?: number;
}

interface SCurveChartProps {
  data: SCurveDataPoint[];
  loading?: boolean;
}

const fmtDate = (d: string) => {
  try {
    return new Intl.DateTimeFormat('ar-EG-u-nu-latn', { day: '2-digit', month: 'short' }).format(new Date(d));
  } catch { return d; }
};

interface TooltipPayloadItem { dataKey: string; color: string; name: string; value?: number | string | null }
interface TooltipProps { active?: boolean; payload?: TooltipPayloadItem[]; label?: string }

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-3 text-xs min-w-[170px]" dir="rtl">
      <p className="font-bold text-slate-700 dark:text-slate-200 mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span>تاريخ الرصد:</span>
        <span className="text-slate-500 font-mono text-[11px]">{fmtDate(label as string)}</span>
      </p>
      <div className="space-y-1.5">
        {payload.map((p) => (
          <div key={p.dataKey} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full ring-1 ring-white dark:ring-slate-800" style={{ backgroundColor: p.color }} />
              <span className="text-slate-500">{p.name}:</span>
            </div>
            <bdi className="font-bold text-slate-800 dark:text-white tabular-nums" dir="ltr">
              {Number(p.value || 0).toFixed(1)}%
            </bdi>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function SCurveChart({ data, loading }: SCurveChartProps) {
  if (loading) {
    return (
      <div
        className="w-full h-72 sm:h-80 md:h-96 min-h-[280px] flex flex-col justify-between p-4 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 animate-pulse"
        role="status"
        aria-label="جاري تحميل بيانات منحنى S-Curve"
      >
        <div className="flex items-center justify-between">
          <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="flex gap-2">
            <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
        </div>
        <div className="space-y-6 my-auto px-2">
          <div className="h-0.5 w-full bg-slate-200/60 dark:bg-slate-800/60" />
          <div className="h-0.5 w-full bg-slate-200/60 dark:bg-slate-800/60" />
          <div className="h-0.5 w-full bg-slate-200/60 dark:bg-slate-800/60" />
          <div className="h-0.5 w-full bg-slate-200/60 dark:bg-slate-800/60" />
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
          <div className="h-3 w-12 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-3 w-12 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-3 w-12 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-3 w-12 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="w-full h-72 sm:h-80 md:h-96 min-h-[280px] flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 dark:bg-slate-900/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3 shadow-sm">
          <TrendingUp className="w-6 h-6" />
        </div>
        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">لا توجد بيانات تقدم مسجلة بعد</h4>
        <p className="text-[11px] text-slate-400 max-w-sm leading-relaxed">
          سيبدأ منحنى القيمة المكتسبة بالتشكّل تلقائياً فور اعتماد أول تقرير تقدم يومي من الموقع.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 h-72 sm:h-80 md:h-96 min-h-[280px] overflow-hidden">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradVerified" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            dataKey="date"
            tickFormatter={fmtDate}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            axisLine={{ stroke: '#e2e8f0' }}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            axisLine={{ stroke: '#e2e8f0' }}
            width={45}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          />
          <Area
            type="monotone"
            dataKey="actual"
            name="الفعلي (Actual)"
            stroke="#10b981"
            strokeWidth={2.5}
            fill="url(#gradActual)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2 }}
          />
          <Area
            type="monotone"
            dataKey="verified"
            name="المعتمد (Verified)"
            stroke="#3b82f6"
            strokeWidth={2}
            strokeDasharray="5 3"
            fill="url(#gradVerified)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2 }}
          />
          {data[0]?.planned !== undefined && (
            <Line
              type="monotone"
              dataKey="planned"
              name="المخطط (Planned)"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="8 4"
              dot={false}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
