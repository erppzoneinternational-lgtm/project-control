'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Printer,
  FileSpreadsheet,
  Download,
  SlidersHorizontal,
  FileText,
  Layout,
  CheckSquare,
  Square,
  RotateCcw,
  Sparkles,
  Info,
  Check,
  Search,
  PenTool,
  Building2,
  FileCheck,
} from 'lucide-react';
import {
  ReportColumn,
  ReportConfig,
  ReportKpiCard,
  ReportOrientation,
  ReportPaperSize,
  ReportFontSize,
  ReportSignatureSlot,
  DEFAULT_REPORT_SIGNATURES,
  generateReportCode,
  generatePrintHtml,
  openPrintWindow,
  exportReportToExcel,
  exportReportToCsv,
} from '@/lib/reports/reportEngine';
import { toast } from 'sonner';
import { useAuth } from '@/lib/stores/useAuthStore';

export interface UniversalReportModalProps<T = any> {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  defaultTitle?: string;
  defaultSubtitle?: string;
  defaultDocCode?: string;
  classification?: string;
  defaultClassification?: string;
  columns: ReportColumn<T>[];
  data: T[];
  kpis?: ReportKpiCard[];
  defaultOrientation?: ReportOrientation;
  defaultPaperSize?: ReportPaperSize;
  initialNotes?: string;
  defaultSignatures?: ReportSignatureSlot[];
  lang?: 'ar' | 'en';
}

type ActiveTab = 'columns' | 'header' | 'layout' | 'signatures';

export function UniversalReportModal<T = any>({
  isOpen,
  onClose,
  title: initialTitle,
  defaultTitle = 'تقرير رسمي معتمد',
  defaultSubtitle = '',
  defaultDocCode,
  classification = 'وثيقة رسمية معتمدة • OFFICIAL PROJECT RECORD',
  defaultClassification,
  columns,
  data,
  kpis = [],
  defaultOrientation = 'landscape',
  defaultPaperSize = 'a4',
  initialNotes = '',
  defaultSignatures = DEFAULT_REPORT_SIGNATURES,
  lang = 'ar',
}: UniversalReportModalProps<T>) {
  const { user } = useAuth();
  const userName = user?.user_metadata?.full_name || user?.email || 'مستخدم النظام';

  const [activeTab, setActiveTab] = useState<ActiveTab>('columns');
  const [columnSearch, setColumnSearch] = useState('');

  // Report Configuration States
  const effectiveInitialTitle = initialTitle || defaultTitle;
  const effectiveClassification = defaultClassification || classification;
  const [reportTitle, setReportTitle] = useState(effectiveInitialTitle);
  const [subtitle, setSubtitle] = useState(defaultSubtitle);
  const [reportCode, setReportCode] = useState(() => defaultDocCode || generateReportCode());
  const [notes, setNotes] = useState(initialNotes);
  const [reportClassification, setReportClassification] = useState(effectiveClassification);

  // Layout & Styling States
  const [orientation, setOrientation] = useState<ReportOrientation>(defaultOrientation);
  const [paperSize, setPaperSize] = useState<ReportPaperSize>(defaultPaperSize);
  const [fontSize, setFontSize] = useState<ReportFontSize>('md');

  // Toggle Features
  const [includeKpis, setIncludeKpis] = useState(kpis.length > 0);
  const [includeSignatures, setIncludeSignatures] = useState(true);
  const [includeTimestamp, setIncludeTimestamp] = useState(true);
  const [includePageNumbers, setIncludePageNumbers] = useState(true);

  // Selected Columns (IDs)
  const [selectedColumnIds, setSelectedColumnIds] = useState<string[]>(() => {
    const defaultVisible = columns.filter((c) => c.defaultVisible !== false).map((c) => c.id);
    return defaultVisible.length > 0 ? defaultVisible : columns.map((c) => c.id);
  });

  // Signatures
  const [signatures, setSignatures] = useState<ReportSignatureSlot[]>(defaultSignatures);

  // Sync state if modal reopens or props change
  useEffect(() => {
    if (isOpen) {
      setReportTitle(initialTitle || defaultTitle);
      setSubtitle(defaultSubtitle);
      setNotes(initialNotes);
      setReportCode(defaultDocCode || generateReportCode());
      setReportClassification(defaultClassification || classification);
    }
  }, [isOpen, initialTitle, defaultTitle, defaultSubtitle, initialNotes, defaultDocCode, defaultClassification, classification]);

  // Keyboard Escape Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter columns by search term
  const filteredColumns = useMemo(() => {
    if (!columnSearch.trim()) return columns;
    const q = columnSearch.trim().toLowerCase();
    return columns.filter(
      (c) => c.labelAr.toLowerCase().includes(q) || c.labelEn.toLowerCase().includes(q) || (c.categoryAr && c.categoryAr.toLowerCase().includes(q))
    );
  }, [columns, columnSearch]);

  // Group columns by category if available
  const columnCategories = useMemo(() => {
    const groups: Record<string, ReportColumn<T>[]> = {};
    filteredColumns.forEach((c) => {
      const cat = c.categoryAr || 'بيانات عامة';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(c);
    });
    return groups;
  }, [filteredColumns]);

  const toggleColumn = (id: string) => {
    setSelectedColumnIds((prev) =>
      prev.includes(id) ? prev.filter((colId) => colId !== id) : [...prev, id]
    );
  };

  const selectAllColumns = () => {
    setSelectedColumnIds(columns.map((c) => c.id));
  };

  const deselectAllColumns = () => {
    setSelectedColumnIds([]);
  };

  const resetDefaultColumns = () => {
    const defaultVisible = columns.filter((c) => c.defaultVisible !== false).map((c) => c.id);
    setSelectedColumnIds(defaultVisible.length > 0 ? defaultVisible : columns.map((c) => c.id));
  };

  const updateSignatureSlot = (id: string, field: keyof ReportSignatureSlot, value: string) => {
    setSignatures((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const buildCurrentConfig = (): ReportConfig => ({
    title: reportTitle,
    subtitle: subtitle || undefined,
    reportCode,
    classification: reportClassification,
    notes,
    orientation,
    paperSize,
    fontSize,
    includeKpis,
    includeSignatures,
    includeTimestamp,
    includePageNumbers,
    selectedColumnIds,
    signatures,
    generatedBy: userName,
  });

  const handlePrint = () => {
    if (selectedColumnIds.length === 0) {
      toast.error('يرجى تحديد عمود واحد على الأقل لطباعة التقرير');
      return;
    }
    const config = buildCurrentConfig();
    const html = generatePrintHtml(config, columns, data, kpis);
    openPrintWindow(html);
    toast.success('تم فتح نافذة الطباعة وتصدير PDF المخصص');
  };

  const handleExportExcel = () => {
    if (selectedColumnIds.length === 0) {
      toast.error('يرجى تحديد عمود واحد على الأقل للتصدير');
      return;
    }
    const config = buildCurrentConfig();
    exportReportToExcel(config, columns, data, kpis);
    toast.success('تم تصدير تقرير Excel (.xlsx) بنجاح');
  };

  const handleExportCsv = () => {
    if (selectedColumnIds.length === 0) {
      toast.error('يرجى تحديد عمود واحد على الأقل للتصدير');
      return;
    }
    const config = buildCurrentConfig();
    exportReportToCsv(config, columns, data);
    toast.success('تم تصدير ملف CSV بنجاح');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="universal-report-title"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Modal Top Header Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 id="universal-report-title" className="text-base sm:text-lg font-black tracking-tight truncate">
                  استوديو تخصيص وتصدير التقارير الرسمية
                </h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 shrink-0">
                  Custom Studio
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                تخصيص كامل للأعمدة، الترويسة، كروت المؤشرات، والتوقيعات بصيغ (PDF / Excel / CSV)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Ribbon */}
        <div className="px-6 pt-3 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('columns')}
            className={`min-h-[40px] px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'columns'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-800 shadow-xs'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>الأعمدة والحقول</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              {selectedColumnIds.length} / {columns.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('header')}
            className={`min-h-[40px] px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'header'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-800 shadow-xs'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>الترويسة والملاحظات</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('layout')}
            className={`min-h-[40px] px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'layout'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-800 shadow-xs'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Layout className="w-4 h-4" />
            <span>تنسيق الصفحة والإخراج</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('signatures')}
            className={`min-h-[40px] px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'signatures'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-800 shadow-xs'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>التوقيعات والاعتماد</span>
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: Columns & Fields Customizer */}
          {activeTab === 'columns' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-850 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={columnSearch}
                    onChange={(e) => setColumnSearch(e.target.value)}
                    placeholder="ابحث في أسماء الحقول..."
                    className="w-full min-h-[38px] ps-9 pe-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {columnSearch && (
                    <button
                      type="button"
                      onClick={() => setColumnSearch('')}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={selectAllColumns}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                  >
                    تحديد الكل
                  </button>
                  <button
                    type="button"
                    onClick={deselectAllColumns}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                  >
                    إلغاء التحديد
                  </button>
                  <button
                    type="button"
                    onClick={resetDefaultColumns}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 hover:bg-slate-100 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>الافتراضي</span>
                  </button>
                </div>
              </div>

              {selectedColumnIds.length > 7 && orientation === 'portrait' && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>لقد حددت أكثر من 7 أعمدة. نوصي بتغيير اتجاه الصفحة إلى <strong>أفقي (Landscape)</strong> للحصول على أفضل وضوح عند الطباعة.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOrientation('landscape')}
                    className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shrink-0 cursor-pointer"
                  >
                    تغيير لأفقي
                  </button>
                </div>
              )}

              {/* Column groups */}
              <div className="space-y-4">
                {Object.entries(columnCategories).map(([categoryName, cols]) => (
                  <div key={categoryName} className="space-y-2">
                    <div className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>{categoryName}</span>
                      <span className="text-[10px] font-normal text-slate-400">({cols.length})</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {cols.map((col) => {
                        const isSelected = selectedColumnIds.includes(col.id);
                        return (
                          <div
                            key={col.id}
                            onClick={() => toggleColumn(col.id)}
                            className={`p-2.5 rounded-xl border text-xs cursor-pointer select-none transition-all flex items-start gap-2.5 ${
                              isSelected
                                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-slate-900 dark:text-white font-bold shadow-2xs'
                                : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <div className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                              isSelected
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <div className="min-w-0">
                              <div className="truncate">{col.labelAr}</div>
                              <div className="text-[10px] font-normal text-slate-400 dark:text-slate-500 truncate font-sans">
                                {col.labelEn}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Header & Notes */}
          {activeTab === 'header' && (
            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  عنوان التقرير الرئيسي (Report Title)
                </label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="w-full min-h-[42px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  العنوان الفرعي / نطاق التقرير (Subtitle)
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="مثال: متابعة المبالغ المستقطعة وخطابات الضمان طبقاً للمدد التعاقدية"
                  className="w-full min-h-[42px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    كود التقرير المرجعي (Reference Code)
                  </label>
                  <input
                    type="text"
                    value={reportCode}
                    onChange={(e) => setReportCode(e.target.value)}
                    className="w-full min-h-[42px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    التصنيف التعاقدي / الأمني
                  </label>
                  <input
                    type="text"
                    value={reportClassification}
                    onChange={(e) => setReportClassification(e.target.value)}
                    className="w-full min-h-[42px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  ملاحظات وتوجيهات الإدارة التنفيذية (تظهر داخل برواز رسمي أعلى التقرير)
                </label>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="أدخل أي ملاحظات، توصيات، أو توجيهات فنية مطلوبة للاعتماد..."
                  className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* TAB 3: Layout & Page Formatting */}
          {activeTab === 'layout' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  اتجاه الصفحة عند الطباعة وتصدير PDF
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setOrientation('landscape')}
                    className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                      orientation === 'landscape'
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="w-6 h-4 border-2 border-current rounded-xs" />
                    <span>أفقي (Landscape) — مناسب للجداول العريضة</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOrientation('portrait')}
                    className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                      orientation === 'portrait'
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="w-4 h-6 border-2 border-current rounded-xs" />
                    <span>رأسي (Portrait) — للتقارير الموجزة</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    مقاس الورق (Paper Size)
                  </label>
                  <select
                    value={paperSize}
                    onChange={(e) => setPaperSize(e.target.value as ReportPaperSize)}
                    className="w-full min-h-[42px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="a4">A4 (قياسي)</option>
                    <option value="a3">A3 (كبير للمشروعات والمخططات العريضة)</option>
                    <option value="letter">Letter</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    حجم الخط داخل جدول التقرير
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['sm', 'md', 'lg'] as ReportFontSize[]).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setFontSize(sz)}
                        className={`min-h-[42px] rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          fontSize === sz
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {sz === 'sm' ? 'مدمج' : sz === 'md' ? 'قياسي' : 'كبير'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  عناصر وأقسام التقرير المرفقة
                </label>
                <div className="space-y-2 bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                  <label className="flex items-center justify-between cursor-pointer select-none py-1">
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-bold">
                      إظهار كروت المؤشرات التنفيذية (KPIs Summary)
                    </span>
                    <input
                      type="checkbox"
                      checked={includeKpis}
                      onChange={(e) => setIncludeKpis(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer select-none py-1 border-t border-slate-200/60 dark:border-slate-750">
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-bold">
                      إظهار جدول التوقيعات والاعتماد الرسمي (Signatures & Stamp)
                    </span>
                    <input
                      type="checkbox"
                      checked={includeSignatures}
                      onChange={(e) => setIncludeSignatures(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer select-none py-1 border-t border-slate-200/60 dark:border-slate-750">
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-bold">
                      إظهار تاريخ ووقت الإصدار واسم المستخدم المُصدر
                    </span>
                    <input
                      type="checkbox"
                      checked={includeTimestamp}
                      onChange={(e) => setIncludeTimestamp(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Signatures & Approvals */}
          {activeTab === 'signatures' && (
            <div className="space-y-4 max-w-3xl">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  يمكنك تخصيص مسميات وأسماء المسؤولين في دورة التوقيع والاعتماد للتقرير الرسمي.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {signatures.map((sig) => (
                  <div
                    key={sig.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 space-y-3 shadow-2xs"
                  >
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                        صفة المعتمد / الدور
                      </label>
                      <input
                        type="text"
                        value={sig.role}
                        onChange={(e) => updateSignatureSlot(sig.id, 'role', e.target.value)}
                        className="w-full min-h-[36px] px-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                        اسم المسؤول (اختياري)
                      </label>
                      <input
                        type="text"
                        value={sig.name}
                        placeholder="اتركه فارغاً للتوقيع اليدوي"
                        onChange={(e) => updateSignatureSlot(sig.id, 'name', e.target.value)}
                        className="w-full min-h-[36px] px-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                        المسمى الوظيفي
                      </label>
                      <input
                        type="text"
                        value={sig.title || ''}
                        onChange={(e) => updateSignatureSlot(sig.id, 'title', e.target.value)}
                        className="w-full min-h-[36px] px-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span>نطاق الإخراج:</span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono">
              {data.length} سجل
            </span>
            <span>•</span>
            <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-mono">
              {selectedColumnIds.length} عمود
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer shadow-xs"
              title="تصدير كملف CSV مرمز"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>تصدير CSV</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
              title="تصدير كملف Excel منسق (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>تصدير Excel (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-slate-900 to-slate-850 hover:from-slate-800 hover:to-slate-800 text-white text-xs font-black transition-all cursor-pointer shadow-md ring-2 ring-emerald-500/20"
              title="معاينة الطباعة وتصدير مستند PDF رسمي"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>معاينة وطباعة / PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
