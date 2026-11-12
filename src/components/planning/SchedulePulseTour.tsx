'use client';

import React, { useState } from 'react';
import { GuidedTour, TourStep } from '@/components/ui/GuidedTour';
import {
  HelpCircle,
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Database,
  Printer,
  FileSpreadsheet,
  TrendingUp,
  Layers,
  ArrowRight
} from 'lucide-react';

export type { TourStep };

export const SCHEDULE_PULSE_TOUR_STEPS: TourStep[] = [
  {
    targetId: 'tour-project-info',
    titleAr: '1. هوية المشروع ومزامنة البيانات الحية',
    titleEn: '1. Project Info & Live Sync Status',
    descAr: 'هنا يظهر اسم المشروع والكود النشط حالياً في المنظومة، مع عدد الأنشطة المحملة في قاعدة البيانات ومؤشر المزامنة الحية.',
    descEn: 'Displays current active project name, code, synced activities count, and live ERP connection status.',
    tipAr: 'إذا قمت بتغيير المشروع في الشريط العلوي، سيتعرف المحرك على المشروع الجديد تلقائياً.',
    tipEn: 'Switching active project from the top bar automatically updates the engine context.',
    position: 'bottom',
  },
  {
    targetId: 'tour-sync-btn',
    titleAr: '2. زر مزامنة المشروع النشط',
    titleEn: '2. Sync ERP Project Button',
    descAr: 'يقوم بسحب كافة أنشطة وعلاقات وتواريخ المشروع المخزنة في الـ ERP وتوليد ملف XER في الذاكرة لتشغيل التحليلات والـ S-Curve فوراً دون رفع ملفات.',
    descEn: 'Pulls project activities, dependencies, and dates from ERP DB to generate in-memory XER instantly.',
    tipAr: 'مفيد جداً لإعادة مراجعة المشروع بعد أي تعديل يدوي في شاشة الـ Gantt.',
    tipEn: 'Handy for refreshing analytics after manual edits in Gantt chart.',
    position: 'bottom',
  },
  {
    targetId: 'tour-commit-btn',
    titleAr: '3. اعتماد وحفظ البيانات في الـ ERP',
    titleEn: '3. Commit & Save to ERP Database',
    descAr: 'عند إفلات أو استيراد ملف XER جديد (سواء Baseline أو تحديث شهري)، يضيء هذا الزر باللون الأخضر لاعتماد وتخزين الأنشطة والـ WBS والعلاقات داخل قاعدة بيانات المشروع رسمياً.',
    descEn: 'When dropping or updating an XER file, click this button to commit all activities, WBS, and dependencies into the DB.',
    tipAr: 'تم تزويده بحماية RLS تلقائية وربطه بنسخ الجداول المعتمدة.',
    tipEn: 'Secured with granular RLS policies and version tracking.',
    position: 'bottom',
  },
  {
    targetId: 'tour-lang-btn',
    titleAr: '4. زر تبديل لغة الواجهة (English / عربي)',
    titleEn: '4. Language Switcher Button',
    descAr: 'يشير هذا الإرشاد مباشرة إلى زر التبديل اللغوي. يمكنك بضغطة زر واحدة التحويل بين الواجهتين العربية والإنجليزية فوراً دون فقدان أي بيانات أو إعادة تحميل.',
    descEn: 'Points directly to the instant bilingual toggle. Switch between Arabic and English without reloading or losing state.',
    tipAr: 'يتكيف اتجاه النصوص والتنسيقات والجداول بين (RTL) و (LTR) تلقائياً وبسلاسة تامة.',
    tipEn: 'Automatically shifts layout alignment between RTL and LTR.',
    position: 'bottom',
  },
  {
    targetId: 'tour-fullscreen-btn',
    titleAr: '5. وضع ملء الشاشة والشاشات الكبيرة',
    titleEn: '5. Immersive Fullscreen Mode',
    descAr: 'يتيح لك توسيع مساحة عمل نبض الجدول والمخططات لتشمل كامل الشاشة، مما يمنحك تجربة غامرة ومريحة في الاجتماعات الهندسية والعروض التنفيذية.',
    descEn: 'Expands the schedule pulse workspace to the full viewport for presentations and reviews.',
    tipAr: 'يمكنك إنهاء وضع ملء الشاشة بسهولة في أي وقت بالضغط على زر الخروج أو مفتاح (ESC).',
    tipEn: 'Press ESC at any time to exit fullscreen mode.',
    position: 'bottom',
  },
  {
    targetId: 'tour-engine-frame',
    titleAr: '6. محرك التحليل ومنطقة إفلات الـ XER',
    titleEn: '6. Analysis Engine & Dropzone Area',
    descAr: 'المساحة التفاعلية الرئيسية لسحب وإفلات ملفات البرنامج الأساسي (Baseline) أو التحديثات الدورية، واستعراض منحنيات S-Curve، ومؤشرات الأداء EVM (SPI / SV / EAC)، والمسار الحرج.',
    descEn: 'Interactive workspace: drop baseline/monthly XER files, inspect S-curves, calculate EVM indices, and track Critical Path.',
    tipAr: 'تم إلغاء كلمة المرور تماماً لتسهيل استبدال وتحديث الملفات بمرونة تامة.',
    tipEn: 'Password lock completely removed for seamless file replacements.',
    position: 'top',
  },
];

interface SchedulePulseTourProps {
  isAr: boolean;
  isOpenGuide: boolean;
  onCloseGuide: () => void;
  isTourActive: boolean;
  onStartTour: () => void;
  onCloseTour: () => void;
}

export const SchedulePulseTour: React.FC<SchedulePulseTourProps> = ({
  isAr,
  isOpenGuide,
  onCloseGuide,
  isTourActive,
  onStartTour,
  onCloseTour,
}) => {
  const [guideTab, setGuideTab] = useState(0);

  return (
    <>
      {/* ── Dynamic Spotlight Interactive Tour ── */}
      <GuidedTour
        steps={SCHEDULE_PULSE_TOUR_STEPS}
        isActive={isTourActive}
        onClose={onCloseTour}
        isAr={isAr}
      />

      {/* ── Comprehensive User Guide Modal ── */}
      {isOpenGuide && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
            dir="rtl"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    {isAr ? 'دليل استخدام نبض الجدول الزمني (Schedule Pulse Guide)' : 'Schedule Pulse User Guide'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {isAr
                      ? 'دليل مهندسي التخطيط والمكتب الفني لإتقان تحليل ومزامنة الجداول الزمنية'
                      : 'Engineering manual for schedule analysis, EVM tracking, and ERP database synchronization'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onCloseGuide();
                    onStartTour();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-950/30 hover:bg-emerald-900/50 text-emerald-300 text-xs font-bold transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isAr ? 'بدء الجولة التفاعلية الحية' : 'Start Interactive Tour'}</span>
                </button>
                <button
                  type="button"
                  onClick={onCloseGuide}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Tabs Navigation */}
            <div className="flex items-center gap-1 px-4 py-2 bg-slate-950/40 border-b border-slate-800 overflow-x-auto">
              {[
                { labelAr: '1. نظرة عامة', labelEn: '1. Overview' },
                { labelAr: '2. تثبيت الـ Baseline', labelEn: '2. Baseline Setup' },
                { labelAr: '3. التحديثات الشهرية', labelEn: '3. Monthly Cuts' },
                { labelAr: '4. الـ S-Curve و EVM', labelEn: '4. S-Curve & EVM' },
                { labelAr: '5. الحفظ في الـ ERP', labelEn: '5. ERP Sync' },
                { labelAr: '6. طباعة التقارير', labelEn: '6. Print & Export' },
              ].map((tab, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setGuideTab(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    guideTab === idx
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  {isAr ? tab.labelAr : tab.labelEn}
                </button>
              ))}
            </div>

            {/* Modal Body Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs leading-relaxed text-slate-300">
              {guideTab === 0 && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-2">
                    <h4 className="text-sm font-black text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      {isAr ? 'ما هي أداة Schedule Pulse؟' : 'What is Schedule Pulse?'}
                    </h4>
                    <p>
                      {isAr
                        ? 'محرك تحليلي متكامل لقراءة ملفات Primavera P6 (.XER) مباشرة في المتصفح، يقارن البرنامج الأساسي (Baseline) بآخر التحديثات الشهرية، ويستخرج مؤشرات القيمة المكتسبة (EVM) والمسار الحرج دون الحاجة لتثبيت أي برامج خارجية.'
                        : 'Integrated schedule analytics engine reading Primavera P6 (.XER) directly in the browser, tracking baseline vs monthly updates, EVM KPIs, and critical path without third-party installations.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800">
                      <b className="text-emerald-400 block mb-1">⚡ قراءة وتحليل فوري</b>
                      <span>فك شفرة الأنشطة والعلاقات والـ WBS والتواريخ وحسابات Float في ثوانٍ معدودة.</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800">
                      <b className="text-emerald-400 block mb-1">🔄 مزامنة ثنائية مع المنظومة</b>
                      <span>تحميل بيانات المشروع النشط بالـ ERP في المحرك، أو حفظ ملف XER جديد بقاعدة البيانات.</span>
                    </div>
                  </div>
                </div>
              )}

              {guideTab === 1 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-black text-white">كيفية استيراد وتثبيت البرنامج الأساسي (Baseline)</h4>
                  <ul className="list-disc list-inside space-y-1.5 text-slate-300">
                    <li><strong>السحب التلقائي:</strong> يقرأ المحرك أنشطة المشروع المفتوح حالياً تلقائياً بمجرد فتح الشاشة.</li>
                    <li><strong>السحب والإفلات:</strong> اسحب ملف XER وأفلته في المربع المخصص للـ Baseline.</li>
                    <li><strong>استبدال البرنامج الأساسي:</strong> اضغط على زر "Change / استبدال" وسيتم فك القفل فوراً دون أي كلمة مرور.</li>
                  </ul>
                </div>
              )}

              {guideTab === 2 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-black text-white">إضافة التحديثات الشهرية (Monthly Cuts)</h4>
                  <p>
                    تتيح الأداة مقارنة انحراف التواريخ شهراً بشهر:
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
                    <li>اختر الشهر المراد تسجيل التحديث له (مثلاً سبتمبر 2026).</li>
                    <li>أفلت ملف تحديث بريمافيرا للشهر.</li>
                    <li>يقوم المحرك تلقائياً بمطابقة تاريخ القطع Data Date وحساب فارق الإنجاز عن المخطط.</li>
                  </ol>
                </div>
              )}

              {guideTab === 3 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-black text-white">منحنى S-Curve ومؤشرات القيمة المكتسبة (EVM)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-center">
                      <b className="text-sky-400 block text-base">PV (المخطط)</b>
                      <span className="text-[11px] text-slate-400">القيمة المخططة وفق الـ Baseline</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-center">
                      <b className="text-emerald-400 block text-base">EV (المكتسب)</b>
                      <span className="text-[11px] text-slate-400">قيمة الأعمال المنفذة فعلياً</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-center">
                      <b className="text-amber-400 block text-base">SPI (مؤشر الأداء)</b>
                      <span className="text-[11px] text-slate-400">EV ÷ PV (أكبر من 1 = متقدم)</span>
                    </div>
                  </div>
                </div>
              )}

              {guideTab === 4 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-black text-white">حفظ واعتماد البيانات في قاعدة بيانات المشروع (ERP Database)</h4>
                  <p>
                    عند إفلات أي ملف XER داخل المحرك، يظهر زر <strong>"اعتماد وحفظ بالـ ERP"</strong> بالأعلى. بالضغط عليه:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 text-slate-300">
                    <li>يتم إدخال كافة الأنشطة إلى جدول <code>pm_project_activities</code>.</li>
                    <li>يتم إنشاء هيكل الـ WBS وربط علاقات الأنشطة <code>pm_activity_dependencies</code>.</li>
                    <li>يتم إصدار نسخة جدول معتمدة (Version) تظهر فوراً في شاشات Gantt و CPM Graph والتقارير.</li>
                  </ul>
                </div>
              )}

              {guideTab === 5 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-black text-white">تصدير وطباعة التقارير وحفظها كـ PDF</h4>
                  <p>
                    تم تحديث المحرك والصفحة بنظام الطباعة المباشرة عبر <code>iframe</code> خفي:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 text-slate-300">
                    <li>زر <strong>"تقرير PDF"</strong> يفتح أمر الطباعة وحفظ PDF مباشرة دون حظر النوافذ المنبثقة.</li>
                    <li>زر <strong>"طباعة PDF"</strong> أمام كل أسبوع مولد يطبع تقرير متابعة تنفيذي كامل يتضمن S-Curve وبنود المقايسة والمعوقات.</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950/60 text-[11px] text-slate-400">
              <span>منصة Pzone لإدارة المشاريع · إعداد: م. حسن أحمد سليمان · 01229994728</span>
              <button
                type="button"
                onClick={onCloseGuide}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors cursor-pointer"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
