'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Users, Award, Shield, ZoomIn, X, Wrench, Layers, Cpu, Sparkles, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react';

export interface LeadershipMember {
  id: string;
  name: { ar: string; en: string };
  title: { ar: string; en: string };
  roleKey: 'Managing Director' | 'Technical Director' | 'Chief Hydraulic Engineer' | 'Site PM';
  experience: { ar: string; en: string };
  credentials: { ar: string; en: string };
  achievements: { ar: string; en: string };
  icon: React.ComponentType<{ className?: string }>;
}

export const LEADERSHIP_MEMBERS: LeadershipMember[] = [
  {
    id: 'mostafa-mahmoud',
    name: { ar: 'م. مصطفى محمود', en: 'Eng. Mostafa Mahmoud' },
    title: { ar: 'العضو المنتدب والمدير العام', en: 'Managing Director & CEO' },
    roleKey: 'Managing Director',
    experience: { ar: '+20 سنة خبرة في المقاولات المائية', en: '20+ Years in Water Scope Engineering' },
    credentials: { ar: 'بكالوريوس هندسة مدنية — جامعة القاهرة | عضو نقابة المهندسين', en: 'BSc Civil Eng - Cairo Univ | Syndicate Member' },
    achievements: { ar: 'إدارة وتوجيه 70+ مشروع مائي قومي بمصر والخليج', en: 'Directed 70+ major aquatic engineering projects across Egypt' },
    icon: Shield,
  },
  {
    id: 'khaled-el-sayed',
    name: { ar: 'م. خالد السيد', en: 'Eng. Khaled El-Sayed' },
    title: { ar: 'مدير المكتب الفني والتصميمات', en: 'Technical & Engineering Office Director' },
    roleKey: 'Technical Director',
    experience: { ar: '+18 سنة خبرة هيدروليكية وتصميم', en: '18+ Years Hydraulic & Structural Design' },
    credentials: { ar: 'ماجستير الهندسة الهيدروليكية | استشاري اعتمادات BOQ', en: 'MSc Hydraulic Eng | BOQ Consultancy Specialist' },
    achievements: { ar: 'إعداد وحساب الدورة الهيدروليكية لـ 150,000 م² مسطحات مائية', en: 'Designed hydraulic cycles for 150,000+ m² water surface area' },
    icon: Award,
  },
  {
    id: 'rania-abdel-aziz',
    name: { ar: 'م. رانيا عبد العزيز', en: 'Eng. Rania Abdel-Aziz' },
    title: { ar: 'رئيس مهندسي الهيدروليك والفلترة', en: 'Chief Hydraulic & Filtration Engineer' },
    roleKey: 'Chief Hydraulic Engineer',
    experience: { ar: '+15 سنة خبرة في محطات الفلترة والتنقية', en: '15+ Years in High-Capacity Filtration Plants' },
    credentials: { ar: 'خبير ميكانيكا ميعات ومحطات الضخ | استشاري الكود المصري', en: 'Fluid Dynamics Expert | Egyptian Code Consultant' },
    achievements: { ar: 'تصميم وتشغيل محطات ضخ بقدرة إجمالية تتجاوز 15,000 م³/ساعة', en: 'Engineered pump stations exceeding 15,000 m³/h capacity' },
    icon: Cpu,
  },
  {
    id: 'hany-youssef',
    name: { ar: 'م. هاني يوسف', en: 'Eng. Hany Youssef' },
    title: { ar: 'مدير التنفيذ والمواقع الميدانية', en: 'Senior Site Project Manager' },
    roleKey: 'Site PM',
    experience: { ar: '+14 سنة خبرة ميدانية في رش الخرسانة', en: '14+ Years Field Execution & Shotcrete' },
    credentials: { ar: 'أخصائي الخرسانة المقذوفة (Shotcrete) والأنظمة العازلة', en: 'Certified Shotcrete & Dual Waterproofing Specialist' },
    achievements: { ar: 'إشراف ميداني مباشر على تنفيذ 35+ مسبح أولمبي وبحيرة شاطئية', en: 'Supervised onsite execution of 35+ Olympic pools & lagoons' },
    icon: Wrench,
  },
];

export interface GalleryPhoto {
  id: string;
  category: 'shotcrete' | 'piping' | 'nozzles' | 'filtration' | 'finishing';
  title: { ar: string; en: string };
  location: { ar: string; en: string };
  description: { ar: string; en: string };
  techSpec: { ar: string; en: string };
  accentColor: string;
}

export const LIVE_WORK_GALLERY: GalleryPhoto[] = [
  {
    id: 'gal-shotcrete-1',
    category: 'shotcrete',
    title: { ar: 'تطبيق خرسانة الخرسق (Shotcrete) بحوائط البحيرات', en: 'Shotcrete Concrete Spraying on Curved Lake Walls' },
    location: { ar: 'مشروع مراسي — الساحل الشمالي', en: 'Marassi Project - North Coast' },
    description: { ar: 'ضخ ورش الخرسانة المقذوفة على الشدة الحديدية المزدوجة بضغط عالي لضمان عدم وجود فجوات هوائية وتماسك الهيكل الخرساني للبحيرة.', en: 'High-pressure wet shotcrete application over dual rebar mesh ensuring zero air voids and structural wall integrity.' },
    techSpec: { ar: 'إجهاد ضغط 350 كجم/سم² — سمك 25 سم', en: 'Compressive Strength 350 kg/cm² — 25cm Thickness' },
    accentColor: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'gal-piping-1',
    category: 'piping',
    title: { ar: 'تركيب ومحاذاة شبكات مواسير HDPE عالية الكثافة', en: 'Fusion-Welded High-Density HDPE Main Piping' },
    location: { ar: 'مشروع فيليت — القاهرة الجديدة', en: 'Villette Project - New Cairo' },
    description: { ar: 'لحام حراري بالصهر لمواسير التجميع الرئيسية المصنعة من بولي إيثيلين عالي الكثافة (HDPE PN16) للتحمل الهيدروليكي تحت الأرض.', en: 'Thermo-fusion butt welding of main HDPE PN16 collector manifolds engineered for subterranean hydraulic pressure.' },
    techSpec: { ar: 'أقطار 250 مم — ضغط تشغيل 16 بار', en: 'Diameter 250mm — 16 Bar Working Pressure' },
    accentColor: 'from-emerald-500 to-purple-600',
  },
  {
    id: 'gal-nozzles-1',
    category: 'nozzles',
    title: { ar: 'معايرة ومعاينة فوهات النوافير الراقصة عالية الضغط', en: 'Precision Calibration of High-Pressure Fountain Nozzles' },
    location: { ar: 'النهر الأخضر — العاصمة الإدارية', en: 'Green River Fountains - New Capital' },
    description: { ar: 'تركيب فوهات نحاسية مطلية بالكروم قابلة للتوجيه الذكي ومزودة بصمامات سريعة الاستجابة لإنشاء العروض المائية الموسيقية.', en: 'Installation of chrome-plated adjustable brass nozzles integrated with fast solenoid valves for musical fountain shows.' },
    techSpec: { ar: 'ارتفاع قفز مائي 25 متر — صمامات سولينويد سريعة', en: '25m Water Jet Height — High-Speed Solenoid Valves' },
    accentColor: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'gal-filtration-1',
    category: 'filtration',
    title: { ar: 'تركيب واختبار محطة الفلترة المركزية متعددة الوسائط', en: 'Multi-Cell Industrial Quartz Sand Filtration Station' },
    location: { ar: 'مشروع بالم هيلز — 6 أكتوبر', en: 'Palm Hills Project - 6th of October' },
    description: { ar: 'تجهيز رصيف محطة التنقية بمرشحات الرمل الكوارتزي المصنوعة من الألياف الزجاجية المقواة (FRP) مع طلمبات السحب الهيدروليكي.', en: 'Assembly of heavy-duty fiberglass-reinforced quartz sand filter vessels paired with automated backwash manifolds.' },
    techSpec: { ar: 'قدرة ترشيح 1,200 م³/ساعة — نقاء 5 ميكرون', en: 'Filtration Capacity 1,200 m³/h — 5 Micron Clarity' },
    accentColor: 'from-amber-500 to-orange-600',
  },
  {
    id: 'gal-finishing-1',
    category: 'finishing',
    title: { ar: 'أعمال تثبيت الفسيفساء الزجاجية وتعبئة العراميس بالأيبوكسي', en: 'Hand-Laid Glass Mosaic & Epoxy Grout Finishing' },
    location: { ar: 'مشروع مارينا الجونة — البحر الأحمر', en: 'El Gouna Marina - Red Sea' },
    description: { ar: 'تكسية أرضيات وحوائط المسابح بالبلاط الزجاجي المقاوم للكيماويات وأشعة الشمس وتكحيل الفواصل بمعجون أيبوكسي عازل.', en: 'Precision hand-tiling with UV and chemical-resistant glass mosaics sealed using waterproof anti-bacterial epoxy grout.' },
    techSpec: { ar: 'بلاط فسيفساء 2.5×2.5 سم — سيلر أيبوكسي خالي من البكتيريا', en: '2.5x2.5cm Mosaic Tiles — Anti-Bacterial Epoxy' },
    accentColor: 'from-sky-500 to-cyan-600',
  },
];

export const TeamAndLiveWorkGallery: React.FC = () => {
  const { t, locale, dir } = useLanguage();
  const isAr = locale === 'ar';

  const [activeCategory, setActiveCategory] = useState<'all' | 'shotcrete' | 'piping' | 'nozzles' | 'filtration' | 'finishing'>('all');
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);

  const categories = [
    { id: 'all', label: t('r4.teamShowcase.filters.all') },
    { id: 'shotcrete', label: t('r4.teamShowcase.filters.shotcrete') },
    { id: 'piping', label: t('r4.teamShowcase.filters.piping') },
    { id: 'nozzles', label: t('r4.teamShowcase.filters.nozzles') },
    { id: 'filtration', label: t('r4.teamShowcase.filters.filtration') },
    { id: 'finishing', label: t('r4.teamShowcase.filters.finishing') },
  ] as const;

  const filteredGallery = activeCategory === 'all'
    ? LIVE_WORK_GALLERY
    : LIVE_WORK_GALLERY.filter((item) => item.category === activeCategory);

  return (
    <section className="w-full py-12 relative overflow-hidden" dir={dir}>
      {/* Ambient background glow */}
      <div className="absolute top-1/3 right-1/3 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-4">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>{t('r4.teamShowcase.title')}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-slate-100 via-cyan-100 to-emerald-200 bg-clip-text text-transparent mb-4">
            {t('r4.teamShowcase.subtitle')}
          </h2>
          <div className="w-20 h-1 bg-gradient-to-r from-emerald-500 to-teal-600 mx-auto rounded-full" />
        </div>

        {/* 1. Leadership Showcase Section */}
        <div className="mb-20">
          <h3 className="text-xl font-bold text-slate-100 mb-8 flex items-center gap-2">
            <Award className="w-5 h-5 text-cyan-400" />
            <span>{t('r4.teamShowcase.leadershipTitle')}</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {LEADERSHIP_MEMBERS.map((member) => {
              const IconComp = member.icon;
              const name = isAr ? member.name.ar : member.name.en;
              const title = isAr ? member.title.ar : member.title.en;
              const exp = isAr ? member.experience.ar : member.experience.en;
              const creds = isAr ? member.credentials.ar : member.credentials.en;
              const ach = isAr ? member.achievements.ar : member.achievements.en;

              return (
                <div
                  key={member.id}
                  data-testid={`team-member-${member.id}`}
                  className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-6 transition-all duration-300 shadow-xl flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/30 flex items-center justify-center mb-4 text-cyan-400">
                      <IconComp className="w-6 h-6" />
                    </div>

                    <h4 className="text-base font-bold text-slate-100">{name}</h4>
                    <div className="text-xs font-semibold text-cyan-400 mb-2">{title}</div>

                    <div className="inline-block text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 mb-4">
                      {exp}
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed mb-3">
                      {creds}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{ach}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Live Site Gallery Section */}
        <div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              <span>{t('r4.teamShowcase.galleryTitle')}</span>
            </h3>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap gap-2" data-testid="gallery-category-tabs">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  data-testid={`gallery-filter-${cat.id}`}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    activeCategory === cat.id
                      ? 'bg-gradient-to-r from-cyan-500 to-emerald-700 text-white shadow-md shadow-cyan-500/20'
                      : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Photos Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGallery.map((photo) => {
              const title = isAr ? photo.title.ar : photo.title.en;
              const location = isAr ? photo.location.ar : photo.location.en;
              const desc = isAr ? photo.description.ar : photo.description.en;
              const spec = isAr ? photo.techSpec.ar : photo.techSpec.en;

              return (
                <div
                  key={photo.id}
                  data-testid={`gallery-card-${photo.id}`}
                  className="group bg-slate-900/80 backdrop-blur-xl border border-slate-800 hover:border-cyan-500/40 rounded-2xl overflow-hidden transition-all duration-300 shadow-xl flex flex-col justify-between"
                >
                  {/* Photo Visual Container (Stylized High-Tech Graphic Card) */}
                  <div className={`h-48 w-full bg-gradient-to-br ${photo.accentColor} opacity-90 p-4 flex flex-col justify-between relative overflow-hidden group-hover:scale-105 transition-transform duration-300`}>
                    <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" />

                    {/* Top Tag & Zoom Trigger */}
                    <div className="relative z-10 flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-950/80 text-cyan-300 border border-cyan-400/30">
                        {photo.category}
                      </span>

                      <button
                        onClick={() => setSelectedPhoto(photo)}
                        data-testid={`gallery-zoom-${photo.id}`}
                        className="w-8 h-8 rounded-full bg-slate-950/80 border border-slate-700 flex items-center justify-center text-slate-200 hover:text-white hover:border-cyan-400 transition-all"
                        title={t('r4.teamShowcase.zoomModal.zoomImage')}
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Graphic Water Scope Pattern */}
                    <div className="relative z-10 flex flex-col gap-1">
                      <div className="text-xs font-semibold text-slate-200">{location}</div>
                      <div className="text-sm font-bold text-white line-clamp-2">{title}</div>
                    </div>
                  </div>

                  {/* Card Bottom Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <p className="text-xs text-slate-300 leading-relaxed mb-4">
                      {desc}
                    </p>

                    <div className="text-[11px] font-mono text-cyan-400 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
                      {spec}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Interactive Image Zoom Modal */}
      {selectedPhoto && (
        <div
          data-testid="gallery-zoom-modal"
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 relative shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              data-testid="close-zoom-modal-btn"
              className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Image Header */}
            <div className={`h-64 rounded-2xl bg-gradient-to-br ${selectedPhoto.accentColor} p-6 flex flex-col justify-end relative overflow-hidden mb-6`}>
              <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[1px]" />
              <div className="relative z-10">
                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-950/80 text-cyan-300 border border-cyan-400/30 mb-2 inline-block">
                  {selectedPhoto.category}
                </span>
                <h3 className="text-xl font-extrabold text-white">
                  {isAr ? selectedPhoto.title.ar : selectedPhoto.title.en}
                </h3>
                <p className="text-xs text-cyan-200 mt-1">
                  {isAr ? selectedPhoto.location.ar : selectedPhoto.location.en}
                </p>
              </div>
            </div>

            {/* Modal Body */}
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              {isAr ? selectedPhoto.description.ar : selectedPhoto.description.en}
            </p>

            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-xs font-mono text-cyan-400">
              <span className="text-slate-400 font-sans block mb-1">Technical Specification:</span>
              {isAr ? selectedPhoto.techSpec.ar : selectedPhoto.techSpec.en}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedPhoto(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-all"
              >
                {t('r4.teamShowcase.zoomModal.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default TeamAndLiveWorkGallery;
