'use client';

import React from 'react';
import { 
  SlidersHorizontal, 
  Search, 
  RotateCcw, 
  X,
  ChevronDown,
  MapPin,
  Building2,
  Activity
} from 'lucide-react';
import { Client, Governorate } from '@/types';

export interface DashboardFilterState {
  searchQuery: string;
  selectedRegion: string;
  selectedStatus: string;
  selectedClientId: string;
  selectedPzoneRole?: string;
  selectedPmId?: string;
  selectedWaterScope?: string;
  minContractValue?: number;
  maxContractValue?: number;
}

interface ExecutiveFilterBarProps {
  filters: DashboardFilterState;
  onFilterChange: (newFilters: Partial<DashboardFilterState>) => void;
  onResetFilters: () => void;
  totalFilteredCount: number;
  totalProjectsCount: number;
  availableRegions: string[];
  clientsList: Client[];
  governoratesList: Governorate[];
}

const STATUS_LABELS: Record<string, string> = {
  working: 'قيد التنفيذ (Working)',
  finished: 'منتهي (Finished)',
  handing_over: 'تسليم ابتدائي (Handing Over)',
  on_hold: 'متوقف (On Hold)',
  cancelled: 'ملغي (Cancelled)',
};

const REGION_LABELS: Record<string, string> = {
  coast: 'الساحل الشمالي والعلمين',
  cairo: 'القاهرة الكبرى والعاصمة',
  gouna: 'الجونة والبحر الأحمر',
  upper: 'الأقصر والصعيد',
};

export const ExecutiveFilterBar: React.FC<ExecutiveFilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  totalFilteredCount,
  totalProjectsCount,
  availableRegions,
  clientsList,
}) => {
  const isFiltered = 
    filters.searchQuery !== '' || 
    filters.selectedRegion !== 'all' || 
    filters.selectedStatus !== 'all' || 
    filters.selectedClientId !== 'all';

  const selectedClientName = clientsList.find(c => c.id === filters.selectedClientId)?.name_ar;
  const selectedRegionName = REGION_LABELS[filters.selectedRegion] || filters.selectedRegion;
  const selectedStatusName = STATUS_LABELS[filters.selectedStatus];

  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-2xl space-y-4">
      {/* Top Bar Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/10">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
              <span>لوحة التحكم والفلاتر المباشرة</span>
              <bdi className="text-[11px] font-mono font-medium text-slate-400 dark:text-slate-500">
                (Global Dynamic Filter Engine)
              </bdi>
              {isFiltered && (
                <span className="text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-md animate-pulse">
                  مفلتر (<bdi>{totalFilteredCount}</bdi> من <bdi>{totalProjectsCount}</bdi>)
                </span>
              )}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">تحديث كافة المؤشرات والخرائط والرسوم البيانية لحظياً عند التغيير</p>
          </div>
        </div>

        {isFiltered && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة ضبط الفلاتر</span>
          </button>
        )}
      </div>

      {/* Dynamic Filter Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Search Query */}
        <div className="md:col-span-3 relative">
          <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            placeholder="بحث باسم المشروع، العميل، الكود..."
            className="w-full ps-3 pe-9 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
          {filters.searchQuery && (
            <button
              type="button"
              onClick={() => onFilterChange({ searchQuery: '' })}
              aria-label="مسح نص البحث"
              className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Region Filter */}
        <div className="md:col-span-3 relative">
          <select
            value={filters.selectedRegion}
            onChange={(e) => onFilterChange({ selectedRegion: e.target.value })}
            aria-label="تصفية حسب المنطقة"
            className="w-full ps-3 pe-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer appearance-none"
          >
            <option value="all">📍 جميع المناطق والمحافظات (الكل)</option>
            <optgroup label="── الأقاليم الجغرافية الكبرى (Macro Regions) ──">
              <option value="coast">🏖️ الساحل الشمالي والعلمين</option>
              <option value="cairo">🏛️ القاهرة الكبرى والعاصمة</option>
              <option value="gouna">🌊 الجونة والبحر الأحمر</option>
              <option value="upper">🌴 الأقصر والصعيد</option>
            </optgroup>
            <optgroup label="── المحافظات والمناطق التفصيلية ──">
              {availableRegions
                .filter((reg) => !['الساحل الشمالي', 'القاهرة الكبرى', 'الجونة والبحر الأحمر', 'الأقصر والصعيد'].includes(reg))
                .map((reg) => (
                  <option key={reg} value={reg}>
                    📍 {reg}
                  </option>
                ))}
            </optgroup>
          </select>
          <ChevronDown className="w-3.5 h-3.5 absolute left-3 top-3 pointer-events-none text-slate-400" />
        </div>

        {/* Client Filter */}
        <div className="md:col-span-3 relative">
          <select
            value={filters.selectedClientId}
            onChange={(e) => onFilterChange({ selectedClientId: e.target.value })}
            aria-label="تصفية حسب العميل"
            className="w-full ps-3 pe-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer appearance-none"
          >
            <option value="all">🏢 جميع العملاء (الكل)</option>
            {clientsList.map((c) => (
              <option key={c.id} value={c.id}>
                🏢 {c.name_ar}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 absolute left-3 top-3 pointer-events-none text-slate-400" />
        </div>

        {/* Status Filter */}
        <div className="md:col-span-3 relative">
          <select
            value={filters.selectedStatus}
            onChange={(e) => onFilterChange({ selectedStatus: e.target.value })}
            aria-label="تصفية حسب حالة التنفيذ"
            className="w-full ps-3 pe-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer appearance-none"
          >
            <option value="all">⚙️ جميع حالات التنفيذ (الكل)</option>
            <option value="working">🟢 قيد التنفيذ (Working)</option>
            <option value="finished">🔵 منتهي (Finished)</option>
            <option value="handing_over">🟣 تسليم ابتدائي (Handing Over)</option>
            <option value="on_hold">🟡 متوقف (On Hold)</option>
            <option value="cancelled">🔴 ملغي (Cancelled)</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 absolute left-3 top-3 pointer-events-none text-slate-400" />
        </div>
      </div>

      {/* Active Filter Pills Bar (Quick Dismissal) */}
      {isFiltered && (
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <span className="text-[11px] text-slate-400 font-bold">الفلاتر المطبقة:</span>

          {filters.searchQuery && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 text-xs font-bold">
              <Search className="w-3 h-3" />
              <span>&ldquo;{filters.searchQuery}&rdquo;</span>
              <button
                type="button"
                onClick={() => onFilterChange({ searchQuery: '' })}
                className="hover:text-cyan-950 dark:hover:text-white ms-0.5 cursor-pointer"
                title="إلغاء البحث"
                aria-label="إلغاء البحث"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.selectedRegion !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
              <MapPin className="w-3 h-3" />
              <span>{selectedRegionName}</span>
              <button
                type="button"
                onClick={() => onFilterChange({ selectedRegion: 'all' })}
                className="hover:text-emerald-950 dark:hover:text-white ms-0.5 cursor-pointer"
                title="إلغاء فلتر المنطقة"
                aria-label="إلغاء فلتر المنطقة"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.selectedClientId !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-bold">
              <Building2 className="w-3 h-3" />
              <span>{selectedClientName || filters.selectedClientId}</span>
              <button
                type="button"
                onClick={() => onFilterChange({ selectedClientId: 'all' })}
                className="hover:text-purple-950 dark:hover:text-white ms-0.5 cursor-pointer"
                title="إلغاء فلتر العميل"
                aria-label="إلغاء فلتر العميل"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.selectedStatus !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-300 text-xs font-bold">
              <Activity className="w-3 h-3" />
              <span>{selectedStatusName || filters.selectedStatus}</span>
              <button
                type="button"
                onClick={() => onFilterChange({ selectedStatus: 'all' })}
                className="hover:text-blue-950 dark:hover:text-white ms-0.5 cursor-pointer"
                title="إلغاء فلتر الحالة"
                aria-label="إلغاء فلتر الحالة"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export { ExecutiveFilterBarSkeleton } from '../DashboardSkeletons';

