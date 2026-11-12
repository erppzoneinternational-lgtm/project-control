'use client';

import React, { useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Layers, 
  Boxes, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  HelpCircle,
  FileCheck,
  Scale,
  Sparkles,
  X
} from 'lucide-react';
import { BoqItem, BoqPricingStatus } from '@/types/boq';
import { PriceGate } from './PriceGate';

interface BoqRateAnalysisCardsProps {
  items: BoqItem[];
  filteredItems: BoqItem[];
  selectedDivision: string;
  onClearDivisionFilter: () => void;
  statusFilter: BoqPricingStatus | 'all';
  onSelectStatusFilter: (status: BoqPricingStatus | 'all') => void;
}

export const BoqRateAnalysisCards: React.FC<BoqRateAnalysisCardsProps> = ({
  items,
  filteredItems,
  selectedDivision,
  onClearDivisionFilter,
  statusFilter,
  onSelectStatusFilter,
}) => {
  // Rate Analysis Analytics calculations
  const stats = useMemo(() => {
    const totalItems = filteredItems.length;
    const totalSum = filteredItems.reduce((acc, it) => acc + (Number(it.amount_egp) || 0), 0);

    // Pricing status breakdown
    const originalItems = filteredItems.filter((it) => it.pricing_status === 'contract_original');
    const voApprovedItems = filteredItems.filter((it) => it.pricing_status === 'vo_approved');
    const starRateItems = filteredItems.filter((it) => it.pricing_status === 'star_rate_provisional');
    const disputedItems = filteredItems.filter((it) => it.pricing_status === 'disputed');

    const starRateSum = starRateItems.reduce((acc, it) => acc + (Number(it.amount_egp) || 0), 0);
    const voApprovedSum = voApprovedItems.reduce((acc, it) => acc + (Number(it.amount_egp) || 0), 0);

    // Priced vs Unpriced
    const pricedItems = filteredItems.filter((it) => Number(it.rate_egp) > 0);
    const unpricedItems = filteredItems.filter((it) => !it.rate_egp || Number(it.rate_egp) === 0);
    const pricedPct = totalItems > 0 ? Number(((pricedItems.length / totalItems) * 100).toFixed(1)) : 0;

    // Direct Cost Division distribution (M, E, L, S)
    const divisionSums = {
      M: 0,
      E: 0,
      L: 0,
      S: 0,
      OTHER: 0,
    };

    filteredItems.forEach((it) => {
      const p = it.cost_code?.prefix?.toUpperCase() || it.cost_code?.code?.[0]?.toUpperCase() || 'OTHER';
      const amt = Number(it.amount_egp) || 0;
      if (p in divisionSums) {
        divisionSums[p as keyof typeof divisionSums] += amt;
      } else {
        divisionSums.OTHER += amt;
      }
    });

    // Extremes & Averages
    const avgRate = pricedItems.length > 0
      ? pricedItems.reduce((acc, it) => acc + Number(it.rate_egp), 0) / pricedItems.length
      : 0;

    // Highest unit rate item
    const maxRateItem = pricedItems.reduce((max, it) => {
      return (Number(it.rate_egp) > Number(max?.rate_egp || 0)) ? it : max;
    }, null as BoqItem | null);

    return {
      totalItems,
      totalSum,
      pricedCount: pricedItems.length,
      unpricedCount: unpricedItems.length,
      pricedPct,
      originalCount: originalItems.length,
      voApprovedCount: voApprovedItems.length,
      voApprovedSum,
      starRateCount: starRateItems.length,
      starRateSum,
      disputedCount: disputedItems.length,
      divisionSums,
      avgRate,
      maxRateItem,
    };
  }, [filteredItems]);

  return (
    <div className="space-y-3">
      {/* Active Division Filter Indicator Banner */}
      {selectedDivision !== 'all' && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-bold">تصفية نشطة حسب القسم: </span>
            <span className="font-mono bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded text-[11px] font-bold">
              {selectedDivision}
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              ({stats.totalItems} بند معروض بقيمة{' '}
              <PriceGate>
                <span className="font-mono font-bold">{stats.totalSum.toLocaleString()} EGP</span>
              </PriceGate>
              )
            </span>
          </div>
          <button
            onClick={onClearDivisionFilter}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 hover:bg-emerald-100 dark:hover:bg-slate-800 text-emerald-700 dark:text-emerald-300 font-bold transition shadow-sm border border-emerald-200 dark:border-emerald-800 text-[11px]"
          >
            <X className="w-3.5 h-3.5" />
            <span>عرض كافة الأقسام</span>
          </button>
        </div>
      )}

      {/* 4 Rate Analysis & Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Contract Volume & Priced Coverage */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between gap-3">
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
              <span>{stats.totalItems}</span>
              <span className="font-normal text-[10px]">بند</span>
            </div>
          </div>

          <div className="mt-3">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              إجمالي قيمة المقايسة (Total Contract EGP)
            </div>
            <div className="text-xl font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              <PriceGate>
                <span dir="ltr">{stats.totalSum.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                <span className="text-xs font-normal ms-1 text-slate-400">EGP</span>
              </PriceGate>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>نسبة التسعير: </span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{stats.pricedPct}%</span>
            </div>
            {stats.unpricedCount > 0 && (
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full">
                {stats.unpricedCount} غير مسعر
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Variations & Provisional Star Rates */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between gap-3">
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="text-[10px] font-medium text-slate-400">
              توزيع حالات البنود
            </div>
          </div>

          <div className="mt-2">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              أوامر التغيير والفئات المؤقتة (VOs & Star Rates)
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-mono font-bold text-amber-600 dark:text-amber-400">
                {stats.starRateCount + stats.voApprovedCount}
              </span>
              <span className="text-xs text-slate-400">بند مستحدث</span>
            </div>
          </div>

          {/* Quick Filter Buttons for Statuses */}
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => onSelectStatusFilter(statusFilter === 'contract_original' ? 'all' : 'contract_original')}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                statusFilter === 'contract_original'
                  ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
              title="فلترة العقد الأصلي"
            >
              أصلي: {stats.originalCount}
            </button>

            <button
              type="button"
              onClick={() => onSelectStatusFilter(statusFilter === 'vo_approved' ? 'all' : 'vo_approved')}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                statusFilter === 'vo_approved'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100'
              }`}
              title="فلترة أوامر التغيير المعتمدة"
            >
              VO: {stats.voApprovedCount}
            </button>

            <button
              type="button"
              onClick={() => onSelectStatusFilter(statusFilter === 'star_rate_provisional' ? 'all' : 'star_rate_provisional')}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                statusFilter === 'star_rate_provisional'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100'
              }`}
              title="فلترة فئات Star Rate المؤقتة"
            >
              Star: {stats.starRateCount}
            </button>
          </div>
        </div>

        {/* Card 3: Direct Cost Structure Breakdown */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between gap-3">
            <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Boxes className="w-5 h-5" />
            </div>
            <div className="text-[10px] text-slate-400 font-medium">
              حسب كود التكلفة المعتمد
            </div>
          </div>

          <div className="mt-2">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              هيكل التكلفة المباشرة (Direct Cost Structure)
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
              <span className="font-mono text-blue-600 dark:text-blue-400">M: توريدات</span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="font-mono text-amber-600 dark:text-amber-400">E: معدات</span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400">L: عمالة</span>
            </div>
          </div>

          {/* Allocation Bar */}
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
              <div
                className="bg-blue-500 h-full"
                style={{ width: `${stats.totalSum > 0 ? (stats.divisionSums.M / stats.totalSum) * 100 : 25}%` }}
                title="المواد M"
              />
              <div
                className="bg-amber-500 h-full"
                style={{ width: `${stats.totalSum > 0 ? (stats.divisionSums.E / stats.totalSum) * 100 : 25}%` }}
                title="المعدات E"
              />
              <div
                className="bg-indigo-500 h-full"
                style={{ width: `${stats.totalSum > 0 ? (stats.divisionSums.L / stats.totalSum) * 100 : 25}%` }}
                title="العمالة L"
              />
              <div
                className="bg-purple-500 h-full"
                style={{ width: `${stats.totalSum > 0 ? (stats.divisionSums.S / stats.totalSum) * 100 : 25}%` }}
                title="مقاولو الباطن S"
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-mono">
              <span className="text-blue-600 dark:text-blue-400">M: {stats.totalSum > 0 ? Math.round((stats.divisionSums.M / stats.totalSum) * 100) : 0}%</span>
              <span className="text-amber-600 dark:text-amber-400">E: {stats.totalSum > 0 ? Math.round((stats.divisionSums.E / stats.totalSum) * 100) : 0}%</span>
              <span className="text-indigo-600 dark:text-indigo-400">L: {stats.totalSum > 0 ? Math.round((stats.divisionSums.L / stats.totalSum) * 100) : 0}%</span>
              <span className="text-purple-600 dark:text-purple-400">S: {stats.totalSum > 0 ? Math.round((stats.divisionSums.S / stats.totalSum) * 100) : 0}%</span>
            </div>
          </div>
        </div>

        {/* Card 4: Rate Averages & Highest Rate Item */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between gap-3">
            <div className="p-3 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400">
              <Scale className="w-5 h-5" />
            </div>
            <div className="text-[10px] text-slate-400 font-medium">
              متوسط الأسعار
            </div>
          </div>

          <div className="mt-2">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              متوسط فئة البند المسعر (Avg Rate)
            </div>
            <div className="text-xl font-mono font-bold text-slate-900 dark:text-white mt-1">
              <PriceGate>
                <span dir="ltr">{stats.avgRate.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
                <span className="text-xs font-normal ms-1 text-slate-400">EGP</span>
              </PriceGate>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 truncate">
            {stats.maxRateItem ? (
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[10px]">أعلى فئة: </span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 truncate max-w-[130px]" title={stats.maxRateItem.description_ar}>
                  {stats.maxRateItem.item_code} ({Number(stats.maxRateItem.rate_egp).toLocaleString()} EGP)
                </span>
              </div>
            ) : (
              <span className="text-slate-400">لا توجد بنود مسعرة</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
