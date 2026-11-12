'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Star, CheckCircle2, Quote, Building2, Award } from 'lucide-react';

export interface TestimonialItem {
  id: string;
  clientName: { ar: string; en: string };
  role: { ar: string; en: string };
  company: { ar: string; en: string };
  badgeType: 'developer' | 'contractor';
  rating: number;
  projectScope: { ar: string; en: string };
  quote: { ar: string; en: string };
  metrics: { ar: string; en: string };
}

export const TESTIMONIALS_DATA: TestimonialItem[] = [
  {
    id: 'emaar-misr',
    clientName: { ar: 'م. أحمد المرشدي', en: 'Eng. Ahmed El-Morshedy' },
    role: { ar: 'قطاع تطوير البنية التحتية والمرافق', en: 'Senior Infrastructure & Utilities Director' },
    company: { ar: 'إعمار مصر (Emaar Misr)', en: 'Emaar Misr' },
    badgeType: 'developer',
    rating: 5,
    projectScope: { ar: 'بحيرات ونوافير مراسي الساحل الشمالي', en: 'Marassi Lagoon & Musical Fountains' },
    quote: {
      ar: 'قدمت شركة بي زون أداءً هندسياً استثنائياً في تنفيذ البحيرات الصناعية والنوافير الراقصة بمشروع مراسي. التزامهم الكامل بالمواصفات الهيدروليكية وضغط الرش دون أي أوامر تغيير غير مبررة جعلهم شريكنا المفضل في المنشآت المائية.',
      en: 'Pzone delivered exceptional engineering performance in constructing the artificial lagoons and dancing fountains at Marassi. Their strict hydraulic compliance and shotcrete quality with zero unjustified VOs made them our premier water scope contractor.',
    },
    metrics: { ar: '42,000 م² مسطح مائي — تسليم قبل الموعد بـ 15 يوماً', en: '42,000 m² surface area — Handed over 15 days ahead of schedule' },
  },
  {
    id: 'sodic',
    clientName: { ar: 'م. محمد عبد الرحمن', en: 'Eng. Mohamed Abdel-Rahman' },
    role: { ar: 'نائب رئيس قطاع العقود والمشتريات', en: 'VP Contracts & Procurement' },
    company: { ar: 'سوديك (SODIC)', en: 'SODIC Developments' },
    badgeType: 'developer',
    rating: 5,
    projectScope: { ar: 'مجمع حمامات السباحة الأولمبية — سوديك فيليت', en: 'Villette Olympic Pool Complex & Water Features' },
    quote: {
      ar: 'تعد بي زون من المقاولين المتخصصين النادرين الذين يجمعون بين دقة الأعمال المدنية للخرسانة المجهدة (Shotcrete) وأنظمة الفلترة المتقدمة. التزامهم بضريبة 14% وشروط الاستلام الابتدائي يعكس الاحترافية المطلقة.',
      en: 'Pzone is one of the rare specialized contractors combining precise shotcrete civil works with advanced multi-cell filtration. Their 14% VAT compliance and transparent handover terms reflect unmatched professionalism.',
    },
    metrics: { ar: '12,500 م² مسابح أولمبية — ضمان 10 سنوات على الهيكل', en: '12,500 m² Olympic pools — 10-Year structural warranty' },
  },
  {
    id: 'palm-hills',
    clientName: { ar: 'م. طارق الكاشف', en: 'Eng. Tarek El-Kashif' },
    role: { ar: 'مدير عام المشروعات والتنفيذ', en: 'VP General Project Operations' },
    company: { ar: 'بالم هيلز للتعمير (Palm Hills)', en: 'Palm Hills Developments' },
    badgeType: 'developer',
    rating: 5,
    projectScope: { ar: 'بحيرة ونوافير بالم هيلز أكتوبر', en: 'Palm Hills October Lakes & Cascades' },
    quote: {
      ar: 'تعاملنا مع بي زون في أكثر من 10 مشاريع مائية في أكتوبر والساحل الشمالي. دقة الاختبارات الهيدروليكية وضغط الخرسانة بالرش تعطينا ثقة تامة في الاعتماد عليهم كمقاول رئيسي للأعمال المائية.',
      en: 'We partnered with Pzone across 10+ aquatic projects in 6th of October and North Coast. Their rigorous hydro-testing and shotcrete strength give us absolute confidence in relying on them for all water features.',
    },
    metrics: { ar: '8,200 م² نوافير ومساقط — 100% مطابقة للكود المصري', en: '8,200 m² fountains & cascades — 100% Egyptian code compliant' },
  },
  {
    id: 'hassan-allam',
    clientName: { ar: 'م. محمود بدوي', en: 'Eng. Mahmoud Badawi' },
    role: { ar: 'مدير مشروع المقاولات العمومية', en: 'Executive Project Manager' },
    company: { ar: 'حسن علام للمقاولات (Hassan Allam)', en: 'Hassan Allam Construction' },
    badgeType: 'contractor',
    rating: 5,
    projectScope: { ar: 'شلالات والنظام الهيدروليكي — العاصمة الإدارية', en: 'New Capital Central Water Infrastructure' },
    quote: {
      ar: 'كمقاول رئيسي لمشروعات قومية، نعتمد على بي زون كمقاول باطن متخصص لجميع شبكات المواسير ومحطات الفلترة والمضخات العملاقة. سرعة استجابتهم الفنية خلال أقل من ساعتين تحافظ على معدلات الإنجاز.',
      en: 'As a main contractor on national projects, we depend on Pzone as our specialized subcontractor for piping networks, filtration plants, and high-capacity pump stations. Their sub-2 hour technical response keeps our schedule on track.',
    },
    metrics: { ar: '28,000 م² بنية هيدروليكية — معدل تدفق 3,200 م³/ساعة', en: '28,000 m² hydraulic infrastructure — 3,200 m³/h flow rate' },
  },
  {
    id: 'orascom',
    clientName: { ar: 'م. شريف زكي', en: 'Eng. Sherif Zaki' },
    role: { ar: 'كبير مهندسي الموقع والتنفيذ', en: 'Senior Site Director' },
    company: { ar: 'أوراسكوم للإنشاءات (Orascom)', en: 'Orascom Construction' },
    badgeType: 'contractor',
    rating: 5,
    projectScope: { ar: 'تطوير مارينا الجونة والنظام الهيدروليكي', en: 'El Gouna Marina Hydraulic & Filtration Upgrades' },
    quote: {
      ar: 'تميزت بي زون بتوفير مضخات مياه مخصصة ومقاومة للمياه المالحة مع تركيب شبكات مواسير HDPE عالية الكثافة. الالتزام بالمعايير البيئية ومواصفات السلامة كان في أعلى مستوياته.',
      en: 'Pzone excelled in delivering custom saltwater-resistant bronze pumps alongside high-density HDPE piping networks. Their compliance with environmental and site safety standards was top-tier.',
    },
    metrics: { ar: '35,000 م² بحيرات شاطئية — 14 مضخة برونزية عملاقة', en: '35,000 m² coastal lagoons — 14 heavy-duty bronze pumps' },
  },
];

export const TestimonialsSection: React.FC = () => {
  const { t, locale, dir } = useLanguage();
  const isAr = locale === 'ar';

  return (
    <section className="w-full py-12 relative overflow-hidden" dir={dir}>
      {/* Subtle Background Glows */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-700/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-4">
            <Award className="w-4 h-4 text-cyan-400" />
            <span>{t('r4.testimonials.title')}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-slate-100 via-cyan-100 to-emerald-200 bg-clip-text text-transparent mb-4">
            {t('r4.testimonials.subtitle')}
          </h2>
          <div className="w-20 h-1 bg-gradient-to-r from-cyan-500 to-emerald-700 mx-auto rounded-full" />
        </div>

        {/* Testimonials Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TESTIMONIALS_DATA.map((item) => {
            const clientName = isAr ? item.clientName.ar : item.clientName.en;
            const role = isAr ? item.role.ar : item.role.en;
            const company = isAr ? item.company.ar : item.company.en;
            const scope = isAr ? item.projectScope.ar : item.projectScope.en;
            const quote = isAr ? item.quote.ar : item.quote.en;
            const metrics = isAr ? item.metrics.ar : item.metrics.en;

            return (
              <div
                key={item.id}
                data-testid={`testimonial-card-${item.id}`}
                className="group bg-slate-900/80 backdrop-blur-xl border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-6 transition-all duration-300 shadow-xl hover:shadow-cyan-950/20 flex flex-col justify-between"
              >
                <div>
                  {/* Top Row: Stars + Verified Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(item.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                        item.badgeType === 'developer'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>
                        {item.badgeType === 'developer'
                          ? t('r4.testimonials.verifiedDeveloper')
                          : t('r4.testimonials.mainContractor')}
                      </span>
                    </span>
                  </div>

                  {/* Project Scope Tag */}
                  <div className="text-xs font-semibold text-cyan-400 mb-3 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                    <span className="truncate">{scope}</span>
                  </div>

                  {/* Quote */}
                  <div className="relative mb-6">
                    <Quote className="w-6 h-6 text-slate-700 dark:text-slate-300/60 absolute -top-2 -left-1 transform -scale-x-100" />
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed relative z-10 ps-2">
                      &ldquo;{quote}&rdquo;
                    </p>
                  </div>
                </div>

                {/* Bottom Row: Client Info + Metrics */}
                <div className="pt-4 border-t border-slate-800/80">
                  <div className="font-bold text-slate-100 text-sm">{clientName}</div>
                  <div className="text-xs text-slate-400">{role}</div>
                  <div className="text-xs font-semibold text-emerald-300 mt-0.5">{company}</div>

                  <div className="mt-3 text-[11px] font-medium text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                    {metrics}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default TestimonialsSection;
