'use client';

import React, { useEffect, useRef } from 'react';
import {
  X, SlidersHorizontal, Layout, PanelLeft, Check, RotateCcw,
  Search, Building2, Bell, Sun, Type, Globe, Sparkles, Megaphone,
  Shield, CheckCircle2, ChevronRight, Rows, Layers
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavPreferencesStore, NavWidgetsVisibility } from '@/lib/stores/useNavPreferencesStore';

export interface NavCustomizerModalProps {
  forceOpen?: boolean;
}

export const NavCustomizerModal: React.FC<NavCustomizerModalProps> = ({ forceOpen = false }) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const {
    isCustomizerOpen: storeIsOpen,
    closeCustomizer,
    layoutMode,
    setLayoutMode,
    densityMode,
    setDensityMode,
    widgets,
    toggleWidget,
    applyMinimalistCleanPreset,
    applyCompactSingleRowPreset,
    applySidebarPreset,
    applyDefaultFullPreset,
    resetToDefaults,
  } = useNavPreferencesStore();

  const isCustomizerOpen = forceOpen || storeIsOpen;

  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCustomizerOpen) {
        closeCustomizer();
      }
    };
    if (isCustomizerOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isCustomizerOpen, closeCustomizer]);

  if (!isCustomizerOpen) return null;

  const widgetDefinitions: Array<{
    key: keyof NavWidgetsVisibility;
    icon: React.ElementType;
    labelAr: string;
    labelEn: string;
    descAr: string;
    descEn: string;
  }> = [
    {
      key: 'showSearch',
      icon: Search,
      labelAr: 'البحث السريع (⌘K)',
      labelEn: 'Quick Search (⌘K)',
      descAr: 'حقل البحث المباشر في المشاريع والسجلات',
      descEn: 'Instant search bar for projects and portal records',
    },
    {
      key: 'showProjectSelector',
      icon: Building2,
      labelAr: 'محدد المشروع النشط',
      labelEn: 'Active Project Selector',
      descAr: 'القائمة المنسدلة لاختيار المشروع الحالي',
      descEn: 'Dropdown to switch active project context',
    },
    {
      key: 'showNotifications',
      icon: Bell,
      labelAr: 'مركز الإشعارات',
      labelEn: 'Notification Center',
      descAr: 'تنبيهات المنظومة والمهام والمطالبات',
      descEn: 'Real-time alerts, tasks, and system events',
    },
    {
      key: 'showThemeToggle',
      icon: Sun,
      labelAr: 'مفتاح الوضع الليلي / النهاري',
      labelEn: 'Theme Toggle (Dark/Light)',
      descAr: 'التبديل بين الثيم الداكن والفاتح',
      descEn: 'Toggle between dark and light appearance',
    },
    {
      key: 'showLanguageToggle',
      icon: Globe,
      labelAr: 'تبديل اللغة (AR / EN)',
      labelEn: 'Language Switcher (AR/EN)',
      descAr: 'التبديل الفوري بين العربية والإنجليزية',
      descEn: 'Instant language toggle between AR and EN',
    },
    {
      key: 'showProjectStructure',
      icon: Layers,
      labelAr: 'شجرة هيكل المشروع',
      labelEn: 'Project Structure',
      descAr: 'نافذة تفاعلية لاستعراض بنية المشروع والمراحل',
      descEn: 'Interactive hierarchical project structure viewer',
    },
    {
      key: 'showFontCustomizer',
      icon: Type,
      labelAr: 'مخصص الخطوط والطباعة',
      labelEn: 'Font Customizer',
      descAr: 'تخصيص نوع وحجم خطوط واجهة المنظومة',
      descEn: 'Customize UI typography family and sizing',
    },
    {
      key: 'showGuidedTour',
      icon: Sparkles,
      labelAr: 'الجولات التعريفية التفاعلية',
      labelEn: 'Interactive Guided Tour',
      descAr: 'زر بدء الجولة الاستكشافية لواجهة العمل',
      descEn: 'Interactive onboarding spotlight tour launcher',
    },
    {
      key: 'showChangelog',
      icon: Megaphone,
      labelAr: 'سجل التحديثات وما الجديد',
      labelEn: 'System Changelog',
      descAr: 'شعار وموجز التحديثات والإصدارات الجديدة',
      descEn: 'What\'s new release notes and patch feed',
    },
    {
      key: 'showAdminShortcut',
      icon: Shield,
      labelAr: 'اختصار إدارة النظام (للإدارة فقط)',
      labelEn: 'System Admin Shortcut',
      descAr: 'زر الوصول السريع إلى بوابة مدير النظام',
      descEn: 'Quick shortcut button to system admin portal',
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="nav-customizer-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-stone-950/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeCustomizer();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-xs">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 id="nav-customizer-title" className="text-base sm:text-lg font-black text-stone-900 dark:text-white">
                {isAr ? 'تخصيص واجهة التنقل وشريط الأدوات' : 'Customize Navigation & Bar'}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {isAr
                  ? 'تحكم في طريقة العرض والكثافة والعناصر الظاهرة لتناسب أسلوب عملك'
                  : 'Tailor layout mode, density, and visible toolbar controls to your workflow'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeCustomizer}
            aria-label={isAr ? 'إغلاق نافذة التخصيص' : 'Close Customizer'}
            className="min-w-[40px] min-h-[40px] p-2 rounded-xl text-stone-500 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* 1. Quick Presets */}
          <div>
            <label className="block text-xs font-black uppercase text-stone-400 dark:text-stone-500 tracking-wider mb-2.5">
              {isAr ? '⚡ أوضاع جاهزة سريعة (Quick Presets)' : '⚡ Quick Presets'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Preset 1: Minimalist Clean */}
              <button
                type="button"
                onClick={applyMinimalistCleanPreset}
                className="group relative p-3.5 rounded-2xl border text-start transition-all cursor-pointer bg-stone-50/80 dark:bg-stone-850/60 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 border-stone-200 dark:border-stone-800 hover:border-emerald-500/40"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-stone-900 dark:text-white flex items-center gap-1.5">
                      <span>{isAr ? 'الوضع النقي البسيط' : 'Minimalist Clean'}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold">
                        {isAr ? 'مستحسن' : 'Recommended'}
                      </span>
                    </h3>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">
                      {isAr
                        ? 'شريط مدمج سطر واحد، إخفاء الأيقونات الإضافية ونقلها إلى قائمة "أدوات إضافية" لتقليل التشتت.'
                        : 'Single compact bar; moves secondary icons into a tidy "More Tools" menu to eliminate clutter.'}
                    </p>
                  </div>
                </div>
              </button>

              {/* Preset 2: Sidebar Mode */}
              <button
                type="button"
                onClick={applySidebarPreset}
                className={`group relative p-3.5 rounded-2xl border text-start transition-all cursor-pointer ${
                  layoutMode === 'sidebar'
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-500 text-stone-900 dark:text-white ring-1 ring-emerald-500'
                    : 'bg-stone-50/80 dark:bg-stone-850/60 hover:bg-stone-100 dark:hover:bg-stone-800/80 border-stone-200 dark:border-stone-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                    <PanelLeft className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-stone-900 dark:text-white">
                      {isAr ? 'شريط جانبي عمودي (Sidebar)' : 'Collapsible Sidebar'}
                    </h3>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">
                      {isAr
                        ? 'شريط جانبي عمودي قابل للطي (260px / 64px) يوفر أقصى مساحة عمودية لقراءة البيانات.'
                        : 'Vertical collapsible sidebar providing maximum vertical screen space for dashboards.'}
                    </p>
                  </div>
                </div>
              </button>

              {/* Preset 3: Compact Single-Row */}
              <button
                type="button"
                onClick={applyCompactSingleRowPreset}
                className={`group relative p-3.5 rounded-2xl border text-start transition-all cursor-pointer ${
                  layoutMode === 'topbar' && densityMode === 'compact'
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-500 text-stone-900 dark:text-white ring-1 ring-emerald-500'
                    : 'bg-stone-50/80 dark:bg-stone-850/60 hover:bg-stone-100 dark:hover:bg-stone-800/80 border-stone-200 dark:border-stone-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Rows className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-stone-900 dark:text-white">
                      {isAr ? 'شريط علوي مدمج (Single Row)' : 'Compact Single Row'}
                    </h3>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">
                      {isAr
                        ? 'دمج التنقل في سطر واحد رفيع وتوفير مساحة الصف الفرعي.'
                        : 'Single slim top bar without the secondary sub-nav tier for a lighter footprint.'}
                    </p>
                  </div>
                </div>
              </button>

              {/* Preset 4: Default Full */}
              <button
                type="button"
                onClick={applyDefaultFullPreset}
                className={`group relative p-3.5 rounded-2xl border text-start transition-all cursor-pointer ${
                  layoutMode === 'topbar' && densityMode === 'standard'
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-500 text-stone-900 dark:text-white ring-1 ring-emerald-500'
                    : 'bg-stone-50/80 dark:bg-stone-850/60 hover:bg-stone-100 dark:hover:bg-stone-800/80 border-stone-200 dark:border-stone-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Layout className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-stone-900 dark:text-white">
                      {isAr ? 'الوضع الافتراضي الموسع (Standard)' : 'Full Standard Bar'}
                    </h3>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">
                      {isAr
                        ? 'العرض الكامل بصفين متعددي المستويات وجميع الأيقونات معروضة مباشرة.'
                        : 'Classic two-tier topbar with all controls directly visible.'}
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Layout & Density Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-100 dark:border-stone-800">
            {/* Layout Mode */}
            <div>
              <label className="block text-xs font-black text-stone-700 dark:text-stone-300 mb-2">
                {isAr ? 'نمط التخطيط (Layout Mode)' : 'Layout Mode'}
              </label>
              <div className="grid grid-cols-2 gap-2 bg-stone-100 dark:bg-stone-800/80 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setLayoutMode('topbar')}
                  className={`min-h-[40px] px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                    layoutMode === 'topbar'
                      ? 'bg-white dark:bg-stone-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <Layout className="w-3.5 h-3.5" />
                  <span>{isAr ? 'شريط علوي' : 'Topbar'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode('sidebar')}
                  className={`min-h-[40px] px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                    layoutMode === 'sidebar'
                      ? 'bg-white dark:bg-stone-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <PanelLeft className="w-3.5 h-3.5" />
                  <span>{isAr ? 'شريط جانبي' : 'Sidebar'}</span>
                </button>
              </div>
            </div>

            {/* Density Mode */}
            <div>
              <label className="block text-xs font-black text-stone-700 dark:text-stone-300 mb-2">
                {isAr ? 'كثافة الشريط (Density)' : 'Bar Density'}
              </label>
              <div className="grid grid-cols-2 gap-2 bg-stone-100 dark:bg-stone-800/80 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setDensityMode('compact')}
                  className={`min-h-[40px] px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                    densityMode === 'compact'
                      ? 'bg-white dark:bg-stone-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <Rows className="w-3.5 h-3.5" />
                  <span>{isAr ? 'سطر مدمج' : 'Compact'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDensityMode('standard')}
                  className={`min-h-[40px] px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                    densityMode === 'standard'
                      ? 'bg-white dark:bg-stone-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{isAr ? 'صفين موسع' : 'Standard'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. Toolbar Widgets Visibility */}
          <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="block text-xs font-black uppercase text-stone-400 dark:text-stone-500 tracking-wider">
                  {isAr ? 'عناصر وأدوات الشريط (Widgets Visibility)' : 'Visible Toolbar Items'}
                </label>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                  {isAr
                    ? 'الأدوات غير المحددة تظل متاحة بالكامل في قائمة "أدوات إضافية" لحفظ الترتيب دون فقد أي خاصية'
                    : 'Unchecked items remain fully available in the "More Tools" menu'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {widgetDefinitions.map((w) => {
                const Icon = w.icon;
                const isChecked = widgets[w.key];
                return (
                  <label
                    key={w.key}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                      isChecked
                        ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-500/30 text-stone-900 dark:text-white'
                        : 'bg-stone-50/50 dark:bg-stone-850/30 border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-100/50 dark:hover:bg-stone-800/40'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleWidget(w.key)}
                      className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-stone-300 dark:border-stone-700 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <Icon className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span className="truncate">{isAr ? w.labelAr : w.labelEn}</span>
                      </div>
                      <p className="text-[10.5px] text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-1">
                        {isAr ? w.descAr : w.descEn}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-stone-100 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/60">
          <button
            type="button"
            onClick={resetToDefaults}
            className="min-h-[40px] px-3.5 py-1.5 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isAr ? 'استعادة الافتراضي' : 'Reset to Default'}</span>
          </button>

          <button
            type="button"
            onClick={closeCustomizer}
            className="min-h-[40px] px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-900/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{isAr ? 'تم وحفظ الإعدادات' : 'Save & Done'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
