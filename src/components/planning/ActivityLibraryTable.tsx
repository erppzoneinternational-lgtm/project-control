'use client';

/**
 * ActivityLibraryTable — مكتبة خطوات التنفيذ القياسية
 * ----------------------------------------------------
 * Design system (extracted from /planning/baseline):
 *   bg #f8fafc · text #0f172a · accent #2e86de · border #e5e5e5 · Cairo body
 *   compact professional tables, restrained type, no banners/clutter.
 *
 * Readability & A11y features:
 *   - WCAG compliant table markup: semantic th/col scopes, caption, keyboard-scrollable region
 *   - Row selection checkboxes with indeterminate header, bulk copy & export actions
 *   - Symmetrical RTL/LTR search layout with logical positioning (ps/pe/start/end)
 *   - Unclipped, readable multi-line text wrapping for construction descriptions and QC notes
 *   - sticky header inside its own scroll area with ResizableTable column support
 *   - Arabic labels for category/phase chips (English in tooltip)
 *   - client-side pagination (50 rows/page) — 803 rows stay smooth
 *   - component chips with live counts, dynamic category/phase filters, reset button
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ActivityLibraryService } from '@/lib/services/activity-library.service';
import { COMPONENT_LABELS } from '@/types/planning';
import { useLanguage } from '@/contexts/LanguageContext';
import { ResizableTable } from '@/components/ui/ResizableTable';
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Loader2,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

const CATEGORY_AR: Record<string, string> = {
  'Earth Work': 'أعمال ترابية',
  'Concrete work': 'أعمال خرسانة',
  'Arcticture': 'تشطيبات ومعمار',
  'mechanical': 'ميكانيكا',
  'electrical': 'كهرباء',
  'Civil': 'مدني',
  'General': 'عام',
};

const PHASE_AR: Record<string, string> = {
  'Engineering': 'هندسة',
  'Contractual milestone': 'إنجاز تعاقدي',
  'Mobilization': 'تجهيز موقع',
  'Construction': 'تنفيذ',
  'Testing & Commissioning': 'تشغيل واختبارات',
  'Taking over certificate': 'شهادة استلام',
};

/** Soft chip tints keyed by value — scannable but within the light/dark themes. */
const PHASE_CHIP: Record<string, string> = {
  'Engineering': 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-100 dark:border-sky-800/60',
  'Contractual milestone': 'bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border-teal-100 dark:border-teal-800/60',
  'Mobilization': 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-100 dark:border-teal-800/60',
  'Construction': 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800/60',
  'Testing & Commissioning': 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800/60',
  'Taking over certificate': 'bg-fuchsia-50 dark:bg-fuchsia-950/40 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-100 dark:border-fuchsia-800/60',
};

const CATEGORY_CHIP: Record<string, string> = {
  'Earth Work': 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-800/60',
  'Concrete work': 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-100 dark:border-cyan-800/60',
  'Arcticture': 'bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border-teal-100 dark:border-teal-800/60',
  'mechanical': 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-800/60',
  'electrical': 'bg-yellow-50 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-300 border-yellow-100 dark:border-yellow-800/60',
  'Civil': 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800/60',
  'General': 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700',
};

const PAGE_SIZE = 50;

export const ActivityLibraryTable: React.FC = () => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [component, setComponent] = useState('all');
  const [category, setCategory] = useState('all');
  const [phase, setPhase] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());

  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  // One fetch (cached); everything filtered client-side for snappy UX.
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activity-library'],
    queryFn: () => ActivityLibraryService.getLibraryItems(),
  });

  const seedMutation = useMutation({
    mutationFn: ActivityLibraryService.seedStandardActivities,
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['activity-library'] });
      toast.success(isAr ? `تم زراعة ${count} نشاط قياسي بنجاح` : `Seeded ${count} activities`);
    },
    onError: () => toast.error(isAr ? 'فشل زراعة الأنشطة القياسية' : 'Seed failed'),
  });

  const componentCounts = useMemo(() => {
    const acc: Record<string, number> = {};
    activities.forEach((a) => {
      const k = a.component_type || 'other';
      acc[k] = (acc[k] || 0) + 1;
    });
    return acc;
  }, [activities]);

  const distinctCategories = useMemo(
    () => [...new Set(activities.map((a) => a.category || 'General'))],
    [activities]
  );
  const distinctPhases = useMemo(
    () => [...new Set(activities.map((a) => a.phase || 'Construction'))],
    [activities]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return activities.filter((act) => {
      if (component !== 'all' && (act.component_type || 'other') !== component) return false;
      if (category !== 'all' && (act.category || 'General') !== category) return false;
      if (phase !== 'all' && (act.phase || 'Construction') !== phase) return false;
      if (!term) return true;
      return (
        (act.code || act.activity_code || '').toLowerCase().includes(term) ||
        (act.name_ar || '').toLowerCase().includes(term) ||
        (act.name_en || '').toLowerCase().includes(term) ||
        (act.task_owner || '').toLowerCase().includes(term) ||
        (act.qc_note || '').toLowerCase().includes(term)
      );
    });
  }, [activities, search, component, category, phase]);

  useEffect(() => {
    setPage(1);
  }, [search, component, category, phase]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage]
  );

  // Row selection logic
  const isAllPageSelected = useMemo(
    () => pageRows.length > 0 && pageRows.every((r) => selectedCodes.has(r.code || r.activity_code)),
    [pageRows, selectedCodes]
  );

  const isSomePageSelected = useMemo(() => {
    const anyInPage = pageRows.some((r) => selectedCodes.has(r.code || r.activity_code));
    return anyInPage && !isAllPageSelected;
  }, [pageRows, selectedCodes, isAllPageSelected]);

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = isSomePageSelected;
    }
  }, [isSomePageSelected]);

  const handleToggleAllPage = () => {
    const next = new Set(selectedCodes);
    if (isAllPageSelected) {
      pageRows.forEach((r) => next.delete(r.code || r.activity_code));
    } else {
      pageRows.forEach((r) => next.add(r.code || r.activity_code));
    }
    setSelectedCodes(next);
  };

  const handleToggleRow = (code: string) => {
    const next = new Set(selectedCodes);
    if (next.has(code)) {
      next.delete(code);
    } else {
      next.add(code);
    }
    setSelectedCodes(next);
  };

  const handleSelectAllFiltered = () => {
    const next = new Set(selectedCodes);
    filtered.forEach((r) => next.add(r.code || r.activity_code));
    setSelectedCodes(next);
    toast.info(
      isAr
        ? `تم تحديد جميع نتائج البحث (${filtered.length} خطوة)`
        : `Selected all matching ${filtered.length} steps`
    );
  };

  const handleClearSelection = () => {
    setSelectedCodes(new Set());
  };

  const handleCopySelectedCodes = () => {
    if (selectedCodes.size === 0) return;
    const codeList = Array.from(selectedCodes).join(', ');
    navigator.clipboard.writeText(codeList);
    toast.success(
      isAr
        ? `تم نسخ ${selectedCodes.size} كود إلى الحافظة بنجاح`
        : `Copied ${selectedCodes.size} code(s) to clipboard`
    );
  };

  const handleCopySelectedData = () => {
    if (selectedCodes.size === 0) return;
    const selectedItems = activities.filter((a) => selectedCodes.has(a.code || a.activity_code));
    const headerRow = ['Code', 'Name_AR', 'Name_EN', 'Phase', 'Category', 'Owner', 'QC_Note'].join('\t');
    const dataRows = selectedItems.map((a) =>
      [
        a.code || a.activity_code || '',
        a.name_ar || '',
        a.name_en || '',
        a.phase || '',
        a.category || '',
        a.task_owner || '',
        a.qc_note || '',
      ].join('\t')
    );
    const content = [headerRow, ...dataRows].join('\n');
    navigator.clipboard.writeText(content);
    toast.success(
      isAr
        ? `تم نسخ بيانات ${selectedCodes.size} خطوة بتنسيق جدولي`
        : `Copied full data for ${selectedCodes.size} step(s)`
    );
  };

  const hasActiveFilters = search.trim() !== '' || component !== 'all' || category !== 'all' || phase !== 'all';

  const handleResetFilters = () => {
    setSearch('');
    setComponent('all');
    setCategory('all');
    setPhase('all');
    setPage(1);
  };

  const sel =
    'h-9 px-3 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2e86de]/30 focus:border-[#2e86de]/50 cursor-pointer';

  const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#2e86de]/40 ${
        active
          ? 'bg-[#2e86de] text-white border-[#2e86de] shadow-sm'
          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-[#2e86de]/60 hover:text-[#2e86de]'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="space-y-3">
      {/* ── Responsive Toolbar (RTL & LTR Aware) ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Logical-padding search input */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isAr ? 'بحث بالكود، الاسم، المسؤول، أو ملاحظة الجودة…' : 'Search code, name, owner, QC note…'}
              aria-label={isAr ? 'البحث في مكتبة خطوات التنفيذ' : 'Search activity execution library'}
              className="w-full h-9 ps-9 pe-8 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2e86de]/30 focus:border-[#2e86de]/50"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label={isAr ? 'مسح البحث' : 'Clear search'}
                className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label={isAr ? 'تصفية حسب الفئة' : 'Filter by category'}
            className={sel}
          >
            <option value="all">{isAr ? 'كل الفئات' : 'All categories'}</option>
            {distinctCategories.map((c) => (
              <option key={c} value={c}>{CATEGORY_AR[c] || c}</option>
            ))}
          </select>

          <select
            value={phase}
            onChange={(e) => setPhase(e.target.value)}
            aria-label={isAr ? 'تصفية حسب المرحلة' : 'Filter by phase'}
            className={sel}
          >
            <option value="all">{isAr ? 'كل المراحل' : 'All phases'}</option>
            {distinctPhases.map((p) => (
              <option key={p} value={p}>{PHASE_AR[p] || p}</option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-2.5 h-9 text-xs rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 font-semibold transition-colors cursor-pointer"
              title={isAr ? 'إعادة ضبط كل الفلاتر' : 'Reset all filters'}
            >
              <RotateCcw className="w-3 h-3" />
              <span>{isAr ? 'إعادة ضبط' : 'Reset'}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/60">
            {filtered.length.toLocaleString(isAr ? 'ar-EG' : 'en-US')} {isAr ? 'خطوة تنفيذ' : 'execution steps'}
          </span>
        </div>
      </div>

      {/* ── Component Chips with RTL Spacing ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none sm:flex-wrap">
        <Chip active={component === 'all'} onClick={() => setComponent('all')}>
          <span>{isAr ? 'الكل' : 'All'}</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] tabular-nums ${
            component === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
          }`}>
            {activities.length}
          </span>
        </Chip>
        {(Object.keys(COMPONENT_LABELS) as (keyof typeof COMPONENT_LABELS)[]).map((k) => (
          <Chip key={k} active={component === k} onClick={() => setComponent(k)}>
            <span>{COMPONENT_LABELS[k]}</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] tabular-nums ${
              component === k ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}>
              {componentCounts[k] || 0}
            </span>
          </Chip>
        ))}
      </div>

      {/* ── Row Selection Bulk Action Bar ── */}
      {selectedCodes.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-100 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#2e86de] text-white text-[11px] font-bold">
              {selectedCodes.size}
            </span>
            <span className="font-semibold">
              {isAr
                ? `تم تحديد ${selectedCodes.size} ${selectedCodes.size === 1 ? 'خطوة' : 'خطوات'}`
                : `${selectedCodes.size} step(s) selected`}
            </span>
            {selectedCodes.size < filtered.length && (
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="text-[11px] text-[#2e86de] hover:underline font-bold cursor-pointer"
              >
                {isAr
                  ? `تحديد جميع نتائج البحث (${filtered.length})`
                  : `Select all matching (${filtered.length})`}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleCopySelectedCodes}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 text-slate-700 dark:text-slate-200 hover:bg-blue-50/60 dark:hover:bg-blue-900/30 font-medium text-[11px] transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{isAr ? 'نسخ الأكواد' : 'Copy Codes'}</span>
            </button>
            <button
              type="button"
              onClick={handleCopySelectedData}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 text-slate-700 dark:text-slate-200 hover:bg-blue-50/60 dark:hover:bg-blue-900/30 font-medium text-[11px] transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{isAr ? 'نسخ البيانات كاملة' : 'Copy Full Data'}</span>
            </button>
            <button
              type="button"
              onClick={handleClearSelection}
              className="text-[11px] text-slate-500 hover:text-slate-800 dark:text-slate-200 dark:hover:text-slate-200 font-bold px-1.5 py-1 cursor-pointer transition-colors"
            >
              {isAr ? 'إلغاء التحديد' : 'Deselect all'}
            </button>
          </div>
        </div>
      )}

      {/* ── Table Card ── */}
      <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div
          role="region"
          aria-label={isAr ? 'جدول مكتبة الأنشطة' : 'Activity library table'}
          tabIndex={0}
          className="overflow-auto max-h-[calc(100vh-340px)] min-h-[380px] focus:outline-none focus:ring-1 focus:ring-[#2e86de]/30"
        >
          <ResizableTable tableId="activity_library_table">
            <table
              className="w-full text-xs border-collapse"
              aria-label={isAr ? 'مكتبة خطوات التنفيذ القياسية' : 'Standard Activity Execution Library'}
            >
              <caption className="sr-only">
                {isAr
                  ? 'جدول خطوات التنفيذ القياسية متضمن الكود، الوصف، الفئة، والمرحلة'
                  : 'Standard activity execution steps table with code, description, category, and phase'}
              </caption>
              <colgroup>
                <col className="w-[44px]" />
                <col className="w-[110px]" />
                <col className="min-w-[280px]" />
                <col className="w-[240px]" />
                <col className="w-[130px]" />
                <col className="w-[130px]" />
                <col className="w-[150px]" />
                <col className="w-[240px]" />
              </colgroup>
              <thead>
                <tr className="sticky top-0 z-10 bg-[#f8fafc]/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800">
                  <th scope="col" className="px-3 py-2.5 text-center w-[44px]">
                    <input
                      ref={headerCheckboxRef}
                      type="checkbox"
                      checked={isAllPageSelected}
                      onChange={handleToggleAllPage}
                      aria-label={isAr ? 'تحديد كل خطوات الصفحة الحالية' : 'Select all steps on this page'}
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-[#2e86de] focus:ring-[#2e86de] cursor-pointer"
                    />
                  </th>
                  <th
                    scope="col"
                    className={`px-3 py-2.5 text-start text-[11px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap ${isAr ? 'tracking-normal' : 'tracking-wide'}`}
                  >
                    {isAr ? 'الكود' : 'Code'}
                  </th>
                  <th
                    scope="col"
                    className={`px-3 py-2.5 text-start text-[11px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap ${isAr ? 'tracking-normal' : 'tracking-wide'}`}
                  >
                    {isAr ? 'خطوة التنفيذ' : 'Execution Step'}
                  </th>
                  <th
                    scope="col"
                    className={`px-3 py-2.5 text-start text-[11px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap ${isAr ? 'tracking-normal' : 'tracking-wide'}`}
                  >
                    {isAr ? 'بالإنجليزية' : 'English'}
                  </th>
                  <th
                    scope="col"
                    className={`px-3 py-2.5 text-start text-[11px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap ${isAr ? 'tracking-normal' : 'tracking-wide'}`}
                  >
                    {isAr ? 'المرحلة' : 'Phase'}
                  </th>
                  <th
                    scope="col"
                    className={`px-3 py-2.5 text-start text-[11px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap ${isAr ? 'tracking-normal' : 'tracking-wide'}`}
                  >
                    {isAr ? 'الفئة' : 'Category'}
                  </th>
                  <th
                    scope="col"
                    className={`px-3 py-2.5 text-start text-[11px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap ${isAr ? 'tracking-normal' : 'tracking-wide'}`}
                  >
                    {isAr ? 'المسؤول' : 'Owner'}
                  </th>
                  <th
                    scope="col"
                    className={`px-3 py-2.5 text-start text-[11px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap ${isAr ? 'tracking-normal' : 'tracking-wide'}`}
                  >
                    {isAr ? 'ملاحظة الجودة' : 'QC Note'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                  Array.from({ length: 7 }).map((_, idx) => (
                    <tr key={`lib-skel-${idx}`} className="animate-pulse">
                      <td className="px-3 py-3 text-center">
                        <div className="w-4 h-4 bg-slate-200 dark:bg-slate-800 rounded mx-auto" />
                      </td>
                      <td className="px-3 py-3">
                        <div className="w-20 h-4 bg-slate-200 dark:bg-slate-800 rounded font-mono" />
                      </td>
                      <td className="px-3 py-3">
                        <div className="w-52 h-4 bg-slate-200 dark:bg-slate-800 rounded mb-1.5" />
                        <div className="w-28 h-2.5 bg-slate-100 dark:bg-slate-800/60 rounded" />
                      </td>
                      <td className="px-3 py-3">
                        <div className="w-36 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
                      </td>
                      <td className="px-3 py-3">
                        <div className="w-16 h-5 bg-slate-200 dark:bg-slate-800 rounded-md" />
                      </td>
                      <td className="px-3 py-3">
                        <div className="w-16 h-5 bg-slate-200 dark:bg-slate-800 rounded-md" />
                      </td>
                      <td className="px-3 py-3">
                        <div className="w-24 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
                      </td>
                      <td className="px-3 py-3">
                        <div className="w-36 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
                      </td>
                    </tr>
                  ))
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center" role="status" aria-live="polite">
                      <BookOpen className="w-8 h-8 mx-auto mb-3 text-slate-300 dark:text-slate-700" />
                      <p className="font-bold text-slate-600 dark:text-slate-300">
                        {activities.length === 0
                          ? isAr ? 'المكتبة فاضية' : 'Library is empty'
                          : isAr ? 'لا توجد نتائج مطابقة' : 'No matches'}
                      </p>
                      {activities.length === 0 && (
                        <button
                          type="button"
                          onClick={() => seedMutation.mutate()}
                          disabled={seedMutation.isPending}
                          className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2e86de] text-white font-bold text-xs hover:bg-[#2472c0] disabled:opacity-50 cursor-pointer"
                        >
                          {seedMutation.isPending
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Sparkles className="w-3.5 h-3.5" />}
                          <span>{isAr ? 'زراعة الأنشطة القياسية' : 'Seed standard activities'}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  pageRows.map((act, i: number) => {
                    const code = act.code || act.activity_code || '';
                    const isSelected = selectedCodes.has(code);

                    return (
                      <tr
                        key={act.id || code}
                        aria-selected={isSelected}
                        className={`transition-colors border-b border-slate-100 dark:border-slate-800/80 ${
                          isSelected
                            ? 'bg-[#2e86de]/[0.08] dark:bg-[#2e86de]/20'
                            : i % 2 === 1
                            ? 'bg-slate-50/40 dark:bg-slate-900/30 hover:bg-[#2e86de]/[0.04]'
                            : 'bg-white dark:bg-slate-900 hover:bg-[#2e86de]/[0.04]'
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="px-3 py-2.5 align-top text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleRow(code)}
                            aria-label={isAr ? `تحديد خطوة ${code}` : `Select step ${code}`}
                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-[#2e86de] focus:ring-[#2e86de] cursor-pointer"
                          />
                        </td>

                        {/* Code */}
                        <td className="px-3 py-2.5 align-top">
                          <span
                            className="inline-flex items-center px-1.5 py-0.5 rounded font-mono text-[11px] font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-800/60 select-all tracking-tight whitespace-nowrap"
                            title={code}
                          >
                            {code}
                          </span>
                        </td>

                        {/* Execution Step (Arabic) - Wrapped naturally */}
                        <td className="px-3 py-2.5 align-top min-w-[260px]">
                          <p className="font-semibold text-slate-900 dark:text-slate-100 text-xs leading-relaxed whitespace-normal break-words">
                            {act.name_ar}
                          </p>
                          {act.phase_ar && (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 whitespace-normal break-words">
                              {act.phase_ar}
                            </p>
                          )}
                        </td>

                        {/* English Description - Wrapped naturally */}
                        <td className="px-3 py-2.5 align-top min-w-[200px]">
                          <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed whitespace-normal break-words">
                            {act.name_en || '—'}
                          </p>
                        </td>

                        {/* Phase Chip */}
                        <td className="px-3 py-2.5 align-top">
                          <span
                            title={act.phase || 'Construction'}
                            className={`inline-block px-2 py-0.5 rounded-md border text-[10px] font-bold whitespace-nowrap ${
                              PHASE_CHIP[act.phase || 'Construction'] ||
                              'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {PHASE_AR[act.phase || ''] || act.phase || 'تنفيذ'}
                          </span>
                        </td>

                        {/* Category Chip */}
                        <td className="px-3 py-2.5 align-top">
                          <span
                            title={act.category || 'General'}
                            className={`inline-block px-2 py-0.5 rounded-md border text-[10px] font-bold whitespace-nowrap ${
                              CATEGORY_CHIP[act.category || 'General'] || CATEGORY_CHIP.General
                            }`}
                          >
                            {CATEGORY_AR[act.category || ''] || act.category || 'عام'}
                          </span>
                        </td>

                        {/* Owner */}
                        <td className="px-3 py-2.5 align-top">
                          {act.task_owner ? (
                            <span
                              className="inline-flex items-start gap-1.5 text-slate-700 dark:text-slate-300 font-medium text-xs leading-snug whitespace-normal break-words"
                              title={act.task_owner}
                            >
                              <UserRound className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                              <span>{act.task_owner}</span>
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">—</span>
                          )}
                        </td>

                        {/* QC Note - Wrapped naturally */}
                        <td className="px-3 py-2.5 align-top min-w-[200px]">
                          {act.qc_note ? (
                            <span
                              className="flex items-start gap-1.5 text-[11px] leading-relaxed text-amber-800 dark:text-amber-300 bg-amber-50/60 dark:bg-amber-950/20 p-1.5 rounded border border-amber-100/80 dark:border-amber-900/40 whitespace-normal break-words"
                              title={act.qc_note}
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                              <span>{act.qc_note}</span>
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </ResizableTable>
        </div>

        {/* ── Pagination Footer ── */}
        {!isLoading && filtered.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-[#f8fafc]/80 dark:bg-slate-900/80">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
              {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)}
              {' '}
              {isAr
                ? `من إجمالي ${filtered.length.toLocaleString('ar-EG')} خطوة`
                : `of ${filtered.length} steps`}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                aria-label={isAr ? 'الصفحة السابقة' : 'Previous page'}
                className="inline-flex items-center gap-1 px-2.5 h-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:border-[#2e86de]/60 hover:text-[#2e86de] disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                <span>{isAr ? 'السابق' : 'Prev'}</span>
              </button>
              <span className="px-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 tabular-nums" aria-current="page">
                {safePage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                aria-label={isAr ? 'الصفحة التالية' : 'Next page'}
                className="inline-flex items-center gap-1 px-2.5 h-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:border-[#2e86de]/60 hover:text-[#2e86de] disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-colors"
              >
                <span>{isAr ? 'التالي' : 'Next'}</span>
                <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
