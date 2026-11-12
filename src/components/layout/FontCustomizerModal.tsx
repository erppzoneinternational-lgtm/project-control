'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useFont, FontOption } from '@/contexts/FontContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Type,
  Check,
  RotateCcw,
  X,
  Sparkles,
  Sliders,
  Layers,
  Search,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

type CategoryFilter = 'all' | 'system' | 'editorial' | 'modern' | 'artistic';

export interface FontCustomizerModalProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export const FontCustomizerModal: React.FC<FontCustomizerModalProps> = ({ forceOpen = false, onClose }) => {
  const {
    currentFontId,
    currentFont,
    availableFonts,
    setFont,
    resetFont,
    isCustomModalOpen,
    closeFontCustomizer,
  } = useFont();

  const handleClose = () => {
    if (onClose) onClose();
    closeFontCustomizer();
  };

  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [previewSample, setPreviewSample] = useState<string>('headline');
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCustomModalOpen) {
        closeFontCustomizer();
      }
    };
    if (isCustomModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCustomModalOpen, closeFontCustomizer]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isCustomModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isCustomModalOpen]);

  // Filter fonts
  const filteredFonts = useMemo(() => {
    return availableFonts.filter((font: FontOption) => {
      const matchesCategory =
        selectedCategory === 'all' || font.category === selectedCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        font.name.toLowerCase().includes(query) ||
        font.nameEn.toLowerCase().includes(query) ||
        font.descriptionAr.toLowerCase().includes(query) ||
        font.categoryLabelAr.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [availableFonts, selectedCategory, searchQuery]);

  const handleSelectFont = (font: FontOption) => {
    setFont(font.id);
    toast.success(
      isAr
        ? `تم اعتماد ${font.name} كخط للمنظومة`
        : `Applied ${font.nameEn} as portal font`
    );
  };

  const handleReset = () => {
    resetFont();
    toast.info(
      isAr
        ? 'تمت استعادة الخط الافتراضي للمنظومة'
        : 'Restored default portal typography'
    );
  };

  const showModal = forceOpen || isCustomModalOpen;
  if (!showModal) return null;
  if (!mounted && !forceOpen) return null;

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="font-modal-title"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      dir={isAr ? 'rtl' : 'ltr'}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl shadow-stone-900/40 dark:shadow-black/80 overflow-hidden ring-1 ring-black/5 dark:ring-white/10"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-stone-50 via-emerald-50/30 to-stone-50 dark:from-stone-900 dark:via-emerald-950/20 dark:to-stone-900 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shadow-xs">
              <Type className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="font-modal-title"
                className="text-base sm:text-lg font-black text-stone-900 dark:text-white flex items-center gap-2"
              >
                <span>{isAr ? 'تخصيص خط المنظومة' : 'Customize Portal Typography'}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 tabular-nums">
                  {availableFonts.length} {isAr ? 'خط متاح' : 'fonts'}
                </span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {isAr
                  ? 'اختر خطك المفضل للواجهة، ويتم حفظ اختيارك تلقائياً لحسابك ومتصفحك'
                  : 'Select your preferred typeface, automatically saved for your session & device'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              title={isAr ? 'استعادة الخط الافتراضي' : 'Reset to default font'}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors border border-stone-200 dark:border-stone-700 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isAr ? 'الافتراضي' : 'Reset'}</span>
            </button>

            <button
              type="button"
              onClick={closeFontCustomizer}
              aria-label={isAr ? 'إغلاق نافذة تخصيص الخط' : 'Close font customizer'}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Interactive Preview Canvas Banner */}
        <div className="p-3.5 sm:p-4 bg-stone-100/70 dark:bg-stone-800/40 border-b border-stone-200 dark:border-stone-800 shrink-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-stone-700 dark:text-stone-300">
              <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{isAr ? 'معاينة حية للخط المحدد حالياً:' : 'Active Font Live Preview:'}</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {isAr ? currentFont.name : currentFont.nameEn}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPreviewSample('headline')}
                className={`text-[11px] font-bold px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                  previewSample === 'headline'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                {isAr ? 'عناوين' : 'Headlines'}
              </button>
              <button
                type="button"
                onClick={() => setPreviewSample('data')}
                className={`text-[11px] font-bold px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                  previewSample === 'data'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                {isAr ? 'بيانات وأرقام' : 'Data & KPIs'}
              </button>
            </div>
          </div>

          <div
            style={{ fontFamily: currentFont.family }}
            className="p-3 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-sm space-y-1 transition-all"
          >
            {previewSample === 'headline' ? (
              <>
                <p className="text-sm sm:text-base md:text-lg font-bold text-stone-900 dark:text-white leading-snug">
                  {isAr
                    ? 'شركة بي زون للمنشآت المائية وحمامات السباحة والبحيرات الصناعية'
                    : 'Pzone Water Scope Construction Projects Management Platform'}
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {isAr
                    ? 'منظومة إدارة المشروعات والمستخلصات والتسليمات الميدانية الفورية'
                    : 'Enterprise Execution, Shop Drawings, QC/HSE & Automated Progress Verification'}
                </p>
              </>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-stone-400 block">{isAr ? 'قيمة المشروع' : 'Contract Value'}</span>
                  <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400">
                    2,450,000 ج.م
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 block">{isAr ? 'نسبة الإنجاز الفعلي' : 'Actual Progress'}</span>
                  <span className="text-sm sm:text-base font-black text-stone-900 dark:text-white">
                    94.8%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 block">{isAr ? 'أوامر التغيير (VO)' : 'Variations'}</span>
                  <span className="text-sm sm:text-base font-black text-amber-600 dark:text-amber-400">
                    +185,000 ج.م
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold border border-emerald-500/20">
                  {isAr ? 'معتمد استشارياً' : 'Consultant Approved'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Toolbar: Category Tabs & Search Bar */}
        <div className="p-3 sm:p-4 border-b border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar scrollbar-none py-0.5">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              {isAr ? 'كافة الخطوط' : 'All Fonts'} ({availableFonts.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('editorial')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedCategory === 'editorial'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              {isAr ? 'الرسمية والفخمة' : 'Luxury & Editorial'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('modern')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedCategory === 'modern'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              {isAr ? 'العصرية والهندسية' : 'Modern & Geometric'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('artistic')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedCategory === 'artistic'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              {isAr ? 'مجموعة ضياء' : 'ZYAEA Art'} (10)
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 absolute start-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث في الخطوط...' : 'Search fonts...'}
              className="w-full ps-9 pe-3 py-1.5 text-xs rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Scrollable Font Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 [scrollbar-width:thin] [scrollbar-color:rgba(156,163,175,0.4)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-stone-300 dark:[&::-webkit-scrollbar-thumb]:bg-stone-700 [&::-webkit-scrollbar-thumb]:rounded-full">
          {filteredFonts.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Type className="w-8 h-8 text-stone-400 mx-auto opacity-50" />
              <p className="text-xs text-stone-500 dark:text-stone-400 font-bold">
                {isAr ? 'لا توجد خطوط مطابقة لمعايير البحث' : 'No fonts matching your search'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredFonts.map((font: FontOption) => {
                const isSelected = currentFontId === font.id;

                return (
                  <div
                    key={font.id}
                    onClick={() => handleSelectFont(font)}
                    className={`relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 group ${
                      isSelected
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500 dark:border-emerald-500/80 shadow-md ring-2 ring-emerald-500/30'
                        : 'bg-white dark:bg-stone-900 border-stone-200/90 dark:border-stone-800 hover:border-emerald-300 dark:hover:border-emerald-700/60 hover:shadow-md'
                    }`}
                  >
                    <div>
                      {/* Top Row: Title + Badge */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black text-stone-900 dark:text-white">
                              {isAr ? font.name : font.nameEn}
                            </h3>
                            {isSelected && (
                              <span className="flex items-center gap-0.5 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs">
                                <Check className="w-3 h-3" />
                                {isAr ? 'النشط' : 'Active'}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                            {isAr ? font.descriptionAr : font.descriptionEn}
                          </p>
                        </div>

                        {font.badgeAr && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 shrink-0 border border-stone-200/60 dark:border-stone-700/60">
                            {isAr ? font.badgeAr : font.badgeEn}
                          </span>
                        )}
                      </div>

                      {/* Font Live Sample Strip */}
                      <div
                        style={{ fontFamily: font.family }}
                        className="p-3 rounded-xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200/60 dark:border-stone-800/60 transition-colors group-hover:border-emerald-500/30"
                      >
                        <p className="text-sm font-semibold text-stone-800 dark:text-stone-200 truncate">
                          {isAr
                            ? 'بي زون للمنشآت المائية وحمامات السباحة والبحيرات'
                            : 'Pzone Water Construction & Swimming Pools'}
                        </p>
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                          أ ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن هـ و ي • 1 2 3 4 5 6 7 8 9 0
                        </p>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-stone-100 dark:border-stone-800/80">
                      <span className="text-stone-400 text-[10px]">
                        {font.weights.join(' • ')}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectFont(font);
                        }}
                        className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'bg-stone-100 dark:bg-stone-800 hover:bg-emerald-600 hover:text-white text-stone-700 dark:text-stone-300'
                        }`}
                      >
                        {isSelected
                          ? isAr
                            ? 'الخط المعتمد حالياً'
                            : 'Currently Active'
                          : isAr
                          ? 'تطبيق هذا الخط'
                          : 'Use This Font'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-stone-50 dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2 shrink-0 text-xs">
          <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>
              {isAr
                ? 'يتم تطبيق الخط المختار فوراً على جميع الجداول، القوائم، والبطاقات'
                : 'Applied instantly across all tables, navigation menus, and widgets'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="sm:hidden px-3 py-1.5 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-400 bg-stone-200/60 dark:bg-stone-800 cursor-pointer"
            >
              {isAr ? 'الافتراضي' : 'Reset'}
            </button>
            <button
              type="button"
              onClick={closeFontCustomizer}
              className="px-4 py-2 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm transition-all cursor-pointer"
            >
              {isAr ? 'تم وحفظ الاختيار' : 'Save & Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return modalContent;
}

export default FontCustomizerModal;
