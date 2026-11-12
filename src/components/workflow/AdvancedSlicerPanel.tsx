'use client';

import React, { useEffect } from 'react';
import { 
  X, 
  SlidersHorizontal, 
  RotateCcw, 
  Check, 
  Building2, 
  Compass, 
  Calendar, 
  Filter,
  Layers
} from 'lucide-react';

export interface SlicerProject {
  id: string;
  project_name: string;
  project_code: string;
}

export interface DateRange {
  from?: string;
  to?: string;
}

export interface AdvancedSlicerPanelProps {
  isOpen: boolean;
  onClose: () => void;
  projects?: SlicerProject[];
  selectedProjectId?: string;
  onSelectProject?: (id: string) => void;
  disciplines?: string[];
  selectedDiscipline?: string;
  onSelectDiscipline?: (d: string) => void;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange) => void;
  onReset?: () => void;
  onApply?: () => void;
  className?: string;
}

const defaultDisciplines = [
  'الكل (جميع التخصصات)',
  'المدني والإنشائي (Civil / Structural)',
  'الكهروميكانيك (MEP)',
  'تنسيق الموقع والمسطحات المائية (Aquatic / Landscape)',
  'المعماري والتشطيبات (Architectural & Finishes)',
  'أعمال الحفر وتجهيز الموقع (Earthworks / Excavation)',
];

export const AdvancedSlicerPanel: React.FC<AdvancedSlicerPanelProps> = ({
  isOpen,
  onClose,
  projects = [],
  selectedProjectId = '',
  onSelectProject,
  disciplines = defaultDisciplines,
  selectedDiscipline = '',
  onSelectDiscipline,
  dateRange = {},
  onDateRangeChange,
  onReset,
  onApply,
  className = '',
}) => {
  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const hasActiveFilters = Boolean(
    (selectedProjectId && selectedProjectId !== 'all') ||
    (selectedDiscipline && selectedDiscipline !== 'all' && selectedDiscipline !== 'الكل (جميع التخصصات)') ||
    dateRange.from ||
    dateRange.to
  );

  const activeFiltersCount = [
    Boolean(selectedProjectId && selectedProjectId !== 'all'),
    Boolean(selectedDiscipline && selectedDiscipline !== 'all' && selectedDiscipline !== 'الكل (جميع التخصصات)'),
    Boolean(dateRange.from || dateRange.to),
  ].filter(Boolean).length;

  return (
    <div className={`fixed inset-0 z-50 overflow-hidden ${className}`}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
      />

      {/* Slide-out Drawer Panel */}
      <div className="fixed inset-y-0 end-0 flex max-w-full ps-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 border-s border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-700/20">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    الفلاتر المتقدمة (Advanced Slicer)
                  </h3>
                  {activeFiltersCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      {activeFiltersCount} نشط
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  تصفية مخصصة بحسب المشروع، التخصص، والمدى الزمني
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="إغلاق اللوحة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Slicer Controls Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {/* 1. Project Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>المشروع المحدد (Project)</span>
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => onSelectProject?.(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 cursor-pointer"
              >
                <option value="">🏢 جميع المشاريع (عرض عام)</option>
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    [{proj.project_code}] {proj.project_name}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Discipline Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>التخصص الفني (Discipline)</span>
              </label>
              <select
                value={selectedDiscipline}
                onChange={(e) => onSelectDiscipline?.(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 cursor-pointer"
              >
                <option value="">⚙️ جميع التخصصات (الكل)</option>
                {disciplines.map((disc) => (
                  <option key={disc} value={disc}>
                    {disc}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Date Range */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>النطاق الزمني والتاريخ (Date Range)</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="block text-[11px] text-slate-500 mb-1">من تاريخ:</span>
                  <input
                    type="date"
                    value={dateRange.from || ''}
                    onChange={(e) =>
                      onDateRangeChange?.({
                        ...dateRange,
                        from: e.target.value || undefined,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <span className="block text-[11px] text-slate-500 mb-1">إلى تاريخ:</span>
                  <input
                    type="date"
                    value={dateRange.to || ''}
                    onChange={(e) =>
                      onDateRangeChange?.({
                        ...dateRange,
                        to: e.target.value || undefined,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>
            </div>

            {/* Active Slices Summary Badge */}
            {hasActiveFilters && (
              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-xs space-y-2">
                <div className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                  <span>معايير التصفية المفعلة:</span>
                </div>
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  {selectedProjectId && selectedProjectId !== 'all' && (
                    <span className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 text-slate-700 dark:text-slate-300">
                      مشروع: {projects.find((p) => p.id === selectedProjectId)?.project_code || 'محدد'}
                    </span>
                  )}
                  {selectedDiscipline && selectedDiscipline !== 'all' && selectedDiscipline !== 'الكل (جميع التخصصات)' && (
                    <span className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 text-slate-700 dark:text-slate-300">
                      تخصص: {selectedDiscipline}
                    </span>
                  )}
                  {(dateRange.from || dateRange.to) && (
                    <span className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 text-slate-700 dark:text-slate-300 font-mono">
                      الفترة: {dateRange.from || '...'} إلى {dateRange.to || '...'}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-5 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onReset}
              disabled={!hasActiveFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:bg-rose-950/40 dark:hover:bg-rose-950/20 hover:border-rose-300 transition disabled:opacity-40 disabled:hover:text-slate-600 disabled:hover:bg-transparent"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة ضبط</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onApply?.();
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-700/20 transition active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>تطبيق الفلاتر</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSlicerPanel;
