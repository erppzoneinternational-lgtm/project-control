'use client';

import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, HelpCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export interface FAQItem {
  id: string;
  category: 'water_scope' | 'boq_pricing' | 'technical_specs' | 'warranties';
  questionAr: string;
  questionEn: string;
  answerAr: string;
  answerEn: string;
}

export const defaultFaqItems: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'water_scope',
    questionAr: 'ما هي تخصصات شركة بي زون الرئيسية في المنشآت المائية بجمهورية مصر العربية؟',
    questionEn: "What are Pzone's primary aquatic engineering specializations in Egypt?",
    answerAr: 'تتخصص شركة بي زون تخصصاً كاملاً كمقاول رئيسي ومقاول باطن في تصميم وتنفيذ كافة المنشآت المائية: حمامات السباحة الأولمبية والسكنية، النوافير الموسيقية والراقصة، البحيرات الصناعية (Lagoons)، المساقط المائية، وأنظمة الفلترة والتعقيم الكهروميكانيكية (MEP).',
    answerEn: 'Pzone is a specialized main contractor and subcontractor handling all aquatic structures: Olympic & residential pools, dancing/musical fountains, artificial lagoons, waterfalls, and complete electromechanical (MEP) filtration and disinfection systems.',
  },
  {
    id: 'faq-2',
    category: 'boq_pricing',
    questionAr: 'هل تتضمن عقود ومقايسات (BOQ) بي زون ضريبة القيمة المضافة 14% VAT الرسمية؟',
    questionEn: 'Do Pzone contracts and Bills of Quantities (BOQ) include standard 14% VAT?',
    answerAr: 'نعم، تماماً. تصدر شركة بي زون كافة العروض المالية والمستخلصات التنفيذية بكتف ضريبي رسمي معتمد يوضح 14% ضريبة القيمة المضافة طبقاً للقانون الضريبي المصري، مع توفير الفواتير الإلكترونية المعتمدة من مصلحة الضرائب المصرية.',
    answerEn: 'Yes, absolutely. All Pzone financial proposals and monthly progress billing invoices feature official tax headers detailing 14% VAT in full compliance with Egyptian Tax Authority regulations.',
  },
  {
    id: 'faq-3',
    category: 'warranties',
    questionAr: 'ما هي مدة الضمان المقدمة من بي زون على الهيكل الخرساني والعزل المائي والمعدات؟',
    questionEn: 'What warranty terms does Pzone offer on concrete structures, waterproofing, and MEP equipment?',
    answerAr: 'تقدم بي زون ضماناً رسمياً معتمداً لمدة 10 سنوات على الهياكل الخرسانية المقذوفة (Shotcrete) وأعمال العزل المائي الكيميائي والمرن ضد التسريب، وضماناً لمدة عامين على الطلمبات والمعدات الكهروميكانيكية وتابلوهات الكهرباء.',
    answerEn: 'Pzone provides a certified 10-year warranty on shotcrete concrete structures and chemical/flexible waterproofing against leakage, along with a 2-year comprehensive warranty on pumps, filtration equipment, and control panels.',
  },
  {
    id: 'faq-4',
    category: 'warranties',
    questionAr: 'كيف يتم التعامل مع محضر تسليم الموقع (Site Possession Letter) وشهادة الاستلام الابتدائي (TOC Letter)؟',
    questionEn: 'How are Site Possession Letters and Taking Over Certificates (TOC) managed?',
    answerAr: 'يتم تحرير محضر تسليم موقع رسمي (Site Possession Letter) مع الاستشاري والمطور فور البدء لتثبيت التاريخ التعاقدي، وفور انتهاء الاختبارات الهيدروليكية (Hydro-Testing) والتشغيل التجريبي، تُصدر شهادة الاستلام الابتدائي الرسمية (TOC Letter).',
    answerEn: 'A formal Site Possession Letter is signed with the consultant and developer upon site kickoff to baseline contractual start dates. Following successful hydro-testing and trial commissioning, the formal Taking Over Certificate (TOC) is issued.',
  },
  {
    id: 'faq-5',
    category: 'technical_specs',
    questionAr: 'ما هي مواصفات الخرسانة المقذوفة (Shotcrete) ونسب العزل المائي المعتمدة في مشاريع بي زون؟',
    questionEn: 'What specifications are used for shotcrete concrete and waterproofing in Pzone projects?',
    answerAr: 'نستخدم خرسانة مقذوفة بإجهاد لا يقل عن 350 كجم/سم² مع إضافات السيكا والمايكروسيليكا لضمان عدم نفاذية المياه، بالإضافة إلى عزل مائي مزدوج بمركبات الماتريكس الأسمنتية والأغشية البوليمرية المرنة المطابقة للكود المصري.',
    answerEn: 'We utilize shotcrete with a minimum compressive strength of 350 kg/cm² enriched with silica fume additives for water impermeability, paired with dual-layer cementitious matrix waterproofing compliant with Egyptian Construction Codes.',
  },
  {
    id: 'faq-6',
    category: 'boq_pricing',
    questionAr: 'كيف تضمن بي زون الالتزام بالميزانية وتفادي أوامر التغيير (Variation Orders) غير المبررة؟',
    questionEn: 'How does Pzone ensure budget compliance and avoid unjustified Variation Orders (VOs)?',
    answerAr: 'يتم إعداد دراسة المخططات الهيدروليكية وحساب التكعيب والتسطيح المائي عبر المكتب الفني لـ Pzone ERP قبل التوقيع، مما يضمن دقة بنود المقايسة بنسبة 100% وعدم إضافة أي أوامر تغيير إلا بناءً على طلب خطي مباشر من المطور.',
    answerEn: 'Our technical office conducts rigorous hydraulic modeling and exact volume calculations in Pzone ERP prior to contract signing, ensuring 100% BOQ precision and eliminating unapproved variation orders.',
  },
  {
    id: 'faq-7',
    category: 'technical_specs',
    questionAr: 'ما هي قدرة بي زون على العمل في المشاريع السريعة (Fast-Track Projects) بالساحل الشمالي والجونة؟',
    questionEn: 'What is Pzone\'s capacity for fast-track construction in the North Coast and Red Sea?',
    answerAr: 'تتميز بي زون بمكاتب إدارة إقليمية ومراكز لوجستية في الساحل الشمالي والجونة تضم أطقم صب الخرسانة المقذوفة وفرق الكهروميكانيك المستمرة، مما يمكننا من تسليم المشاريع المعقدة في فترات قياسية تصل إلى 60 يوماً.',
    answerEn: 'Pzone operates regional management hubs in the North Coast and Red Sea with dedicated shotcrete crews and MEP technicians, enabling fast-track project completion in compressed 60-day windows.',
  },
  {
    id: 'faq-8',
    category: 'water_scope',
    questionAr: 'هل تقدم بي زون عقود الصيانة الدورية واختبارات التوازن الكيميائي والمائي بعد التسليم؟',
    questionEn: 'Does Pzone provide routine maintenance contracts and chemical testing post-handover?',
    answerAr: 'نعم، تتيح بي زون عقود صيانة سنوية وشهرية تغطي غسيل الفلاتر، معايرة الطلمبات، ضبط التوازن الهيدروليكي، واختبارات الكلور والـ pH المعتمدة لضمان أقصى كفاءة للمنشأة المائية.',
    answerEn: 'Yes, Pzone offers annual and monthly maintenance service agreements covering backwashing, pump calibration, hydraulic re-balancing, and water chemistry testing (pH & chlorine) to maintain optimal performance.',
  },
];

export interface FAQAccordionProps {
  items?: FAQItem[];
  className?: string;
}

export const FAQAccordion: React.FC<FAQAccordionProps> = ({
  items = defaultFaqItems,
  className = '',
}) => {
  const { t, locale } = useLanguage();
  const isAr = locale === 'ar';

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const categories = [
    { id: 'all', label: t('r3.faq.category_all') },
    { id: 'water_scope', label: t('r3.faq.category_water_scope') },
    { id: 'boq_pricing', label: t('r3.faq.category_boq_pricing') },
    { id: 'technical_specs', label: t('r3.faq.category_technical_specs') },
    { id: 'warranties', label: t('r3.faq.category_warranties') },
  ];

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      const qText = isAr ? item.questionAr : item.questionEn;
      const aText = isAr ? item.answerAr : item.answerEn;
      const matchesSearch =
        searchQuery.trim() === '' ||
        qText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        aText.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [items, activeCategory, searchQuery, isAr]);

  const toggleAccordion = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search Input Bar */}
      <div className="relative">
        <Search className="absolute right-4 top-3.5 rtl:right-4 rtl:left-auto ltr:left-4 ltr:right-auto h-5 w-5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('r3.faq.search_placeholder')}
          className="w-full rounded-2xl bg-slate-900/90 border border-slate-800 py-3.5 px-12 text-sm text-white placeholder-slate-400 backdrop-blur-xl focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
        />
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setOpenIndex(0);
              }}
              className={`shrink-0 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/30'
                  : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Accordion Q&A List */}
      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center text-slate-400">
          <HelpCircle className="mx-auto h-10 w-10 text-slate-500 mb-2" />
          <p className="text-sm">{t('r3.faq.no_results')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item, idx) => {
            const isOpen = openIndex === idx;
            const question = isAr ? item.questionAr : item.questionEn;
            const answer = isAr ? item.answerAr : item.answerEn;
            const contentId = `faq-content-${item.id}`;
            const headerId = `faq-header-${item.id}`;

            return (
              <div
                key={item.id}
                className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/80 backdrop-blur-xl transition-colors hover:border-slate-700"
              >
                <button
                  id={headerId}
                  onClick={() => toggleAccordion(idx)}
                  aria-expanded={isOpen}
                  aria-controls={contentId}
                  className="flex w-full items-center justify-between gap-4 p-4 sm:p-5 text-start transition-colors hover:bg-slate-800/40"
                >
                  <span className="text-sm sm:text-base font-bold text-white leading-snug">
                    {question}
                  </span>
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-400 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 bg-emerald-700/20 text-emerald-400' : ''
                    }`}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </button>

                {isOpen && (
                  <div
                    id={contentId}
                    role="region"
                    aria-labelledby={headerId}
                    className="border-t border-slate-800/60 bg-slate-950/40 p-4 sm:p-5 text-xs sm:text-sm text-slate-300 leading-relaxed"
                  >
                    {answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FAQAccordion;
