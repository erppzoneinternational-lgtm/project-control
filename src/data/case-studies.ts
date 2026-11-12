export interface CaseStudyProject {
  id: string;
  category: 'fountains' | 'pools' | 'lagoons' | 'hydraulic';
  name: { ar: string; en: string };
  client: { ar: string; en: string };
  location: { ar: string; en: string };
  contractValue: string;
  completionDate: string;
  surfaceArea: string;
  flowRate: string;
  pumpsInfo: { ar: string; en: string };
  scopeTags: string[];
  boqHighlights: { ar: string[]; en: string[] };
  hydraulicSpecs: { ar: string; en: string };
  civilSpecs: { ar: string; en: string };
  testimonialQuote: { ar: string; en: string };
  galleryThumbnails: string[];
}

export const CASE_STUDIES_DATA: CaseStudyProject[] = [
  {
    id: 'marassi-lagoon',
    category: 'lagoons',
    name: { ar: 'مشروع بحيرة ومساقط مالي مراسي', en: 'Marassi Crystal Lagoon & Musical Fountains' },
    client: { ar: 'إعمار مصر (Emaar Misr)', en: 'Emaar Misr' },
    location: { ar: 'الساحل الشمالي — سيدي عبد الرحمن', en: 'North Coast - Sidi Abdel Rahman' },
    contractValue: 'EGP 85,000,000',
    completionDate: '2025-06-15',
    surfaceArea: '42,000 m²',
    flowRate: '1,800 m³/h',
    pumpsInfo: { ar: '12 مضخة غاطسة متغيرة السرعة بقدرة 45 كيلوواط', en: '12x Variable Speed Submersible Pumps 45kW' },
    scopeTags: ['Lagoon Construction', 'Dancing Fountains', 'Shotcrete Walls', '14% VAT Compliant'],
    boqHighlights: {
      ar: [
        'رش خرسانة الخرسق (Shotcrete) بسمك 25 سم بقدرة ضغط 350 كجم/سم²',
        'شبكات مواسير HDPE عالية الكثافة بأقطار تصل إلى 315 مم',
        'محطة فلترة الرمل الكوارتزي بقدرة 1,800 م³/ساعة ونقاء 5 ميكرون',
        'نظام إضاءة مائية مخصص LED IP68 مع التحكم الرقمي DMX512',
      ],
      en: [
        '25cm Shotcrete Application with 350 kg/cm² Compressive Strength',
        'High-Density HDPE Main Collector Lines up to 315mm Diameter',
        'Multi-Cell Quartz Sand Filtration Plant rated at 1,800 m³/h',
        'Custom DMX512 Controlled Underwater RGB LED Lighting (IP68)',
      ],
    },
    hydraulicSpecs: {
      ar: 'معدل تدفق 1,800 م³/ساعة — نظام تدوير فلترة كل 4 ساعات مع معالجة الكلور الذاتي وقياس pH الأوتوماتيكي.',
      en: '1,800 m³/h Flow Rate — 4-Hour Complete Filtration Turnover Cycle with Automated Chlorine & pH Monitoring.',
    },
    civilSpecs: {
      ar: 'خرسانة مقذوفة مجهدة Shotcrete 350 كجم/سم² مع عزل مائي مزدوج بولي يوريثان وتأمين الفواصل المطاطية.',
      en: 'High-Strength 350 kg/cm² Wet Shotcrete with Dual Polyurethane Membrane & Rubber Waterstop Joint Seals.',
    },
    testimonialQuote: {
      ar: 'التزم فريق بي زون بالمواصفات الهيدروليكية ومعدل ضخ المياه الدقيق مع تسليم المشروع قبل الموعد بـ 15 يوماً.',
      en: 'Pzone executed the precise hydraulic flow specs and delivered the complete lagoon 15 days ahead of schedule.',
    },
    galleryThumbnails: ['Lagoon Spraying', 'Piping Weld', 'Nozzle Test'],
  },
  {
    id: 'villette-pools',
    category: 'pools',
    name: { ar: 'مجمع المسابح الأولمبية — سوديك فيليت', en: 'Villette Olympic Swimming Pool Complex' },
    client: { ar: 'سوديك (SODIC)', en: 'SODIC Developments' },
    location: { ar: 'القاهرة الجديدة — التجمع الخامس', en: 'New Cairo - 5th Settlement' },
    contractValue: 'EGP 42,000,000',
    completionDate: '2025-09-30',
    surfaceArea: '12,500 m²',
    flowRate: '950 m³/h',
    pumpsInfo: { ar: '8 مضخات سحب رفع عالي بقدرة 30 كيلوواط', en: '8x High-Head Circulation Pumps 30kW' },
    scopeTags: ['Olympic Pool', 'Kids Water Park', 'Multi-Cell Filtration', '10-Year Warranty'],
    boqHighlights: {
      ar: [
        'حفر وتثبيت هيكل الخرسانة المسلحة وتكسية الفسيفساء الزجاجية',
        'نظام تسخين المضخات الحرارية (Heat Pumps) لتوليد الطاقة المائية',
        'محقن غاز الأوزون للتعقيم الصحي وتخفيض نسبة الكلور',
        'مجرى طفح غاطس (Overflow Channel) مع خزانات التوازن',
      ],
      en: [
        'Reinforced Structural Concrete Shell with Glass Mosaic Tiling',
        'Heat Pump Thermal Heating System for Year-Round Water Temp',
        'Ozone Injection System for Chemical Reduction & Health Standards',
        'Overflow Channel Perimeter Gutter with Balance Surge Tanks',
      ],
    },
    hydraulicSpecs: {
      ar: 'تدوير كامل خلال 6 ساعات وفقاً لمعايير الاتحاد الدولي للسباحة FINA مع طلمبات دائرية مزدوجة.',
      en: '6-Hour Complete Turnover Cycle strictly meeting FINA International Swimming Standards.',
    },
    civilSpecs: {
      ar: 'أعمال مدنية خرسانية بعزل كيميائي معالجة السطوح وتكحيل الفواصل بمعجون أيبوكسي.',
      en: 'Engineered Reinforced Concrete Box Shell with Epoxy Grout & Chemical Waterproofing Membrane.',
    },
    testimonialQuote: {
      ar: 'أظهرت بي زون دقة عالية في تنفيذ مجرى الطفح وأنظمة التسخين مما جعل المسبح جاهزاً للبطولات.',
      en: 'Pzone demonstrated high precision in overflow perimeter design and heat pump integration.',
    },
    galleryThumbnails: ['Olympic Pool Shell', 'Filtration Skids', 'Heat Pumps'],
  },
  {
    id: 'palm-hills-cascades',
    category: 'fountains',
    name: { ar: 'شلالات ونوافير بالم هيلز سنترال', en: 'Palm Hills October Central Water Features' },
    client: { ar: 'بالم هيلز للتعمير (Palm Hills)', en: 'Palm Hills Developments' },
    location: { ar: 'مدينة 6 أكتوبر', en: '6th of October City' },
    contractValue: 'EGP 38,500,000',
    completionDate: '2025-11-20',
    surfaceArea: '8,200 m²',
    flowRate: '1,200 m³/h',
    pumpsInfo: { ar: '10 مضخات نحاسية للفوهات عالية الضغط', en: '10x Heavy-Duty Submersible Brass Nozzle Pumps' },
    scopeTags: ['Water Cascades', 'Brass Nozzles', 'Automated Filtration', 'Zero VO Policy'],
    boqHighlights: {
      ar: [
        'تصميم وتوريد فوهات نحاسية مطلية بالكروم بأشكال مائية متنوعة',
        'تركيب شلالات صخرية معزولة بطبقات الفايبرجلاس',
        'لوحات تحكم برمجية PLC للتحكم برقصات النوافير المائية',
        'نظام ترشيح سريعة التغيير لمنع انسداد الفوهات',
      ],
      en: [
        'Chrome-Plated Brass Jet Nozzles with Multiple Spray Patterns',
        'Rock Waterfalls Built over Reinforced Waterproofing Shell',
        'PLC Programmed Automation Control Panels for Water Sequences',
        'High-Speed Filtration Circuit Preventing Nozzle Clogging',
      ],
    },
    hydraulicSpecs: {
      ar: 'معدل ضخ 1,200 م³/ساعة مع التحكم بالضغط الديناميكي لكل مجموعة فوهات.',
      en: '1,200 m³/h Dynamic Pressure Pumping Matrix across All Nozzle Arrays.',
    },
    civilSpecs: {
      ar: 'هيكل مدني مجهد Shotcrete مقاوم للأحمال الديناميكية والاهتزازات الهيدروليكية.',
      en: 'Dynamic Heavy-Load Shotcrete Concrete Wall Structures Sealed for High Flow Vibrations.',
    },
    testimonialQuote: {
      ar: 'أعطتنا بي زون الثقة الكاملة بفضل الالتزام التام بجدول الأعمال وبدون أي تكاليف إضافية غير متوقعة.',
      en: 'Pzone provided complete reliability with strict schedule adherence and zero cost overruns.',
    },
    galleryThumbnails: ['Cascades Spray', 'PLC Panel', 'Nozzle Rig'],
  },
  {
    id: 'new-capital-infra',
    category: 'hydraulic',
    name: { ar: 'البنية الهيدروليكية لشلالات البرج الأيقوني', en: 'New Capital Iconic Tower Water Cascade & Infrastructure' },
    client: { ar: 'حسن علام / CSCEC', en: 'Hassan Allam / CSCEC' },
    location: { ar: 'العاصمة الإدارية الجديدة', en: 'New Administrative Capital' },
    contractValue: 'EGP 110,000,000',
    completionDate: '2026-02-10',
    surfaceArea: '28,000 m²',
    flowRate: '3,200 m³/h',
    pumpsInfo: { ar: 'محطة ضخ عملاقة: 6 مضخات قدرة 90 كيلوواط', en: 'Industrial Booster Station: 6x 90kW Heavy Pumps' },
    scopeTags: ['Heavy Hydraulic Infrastructure', 'HDPE Pipelines', 'Industrial Boosters', 'Subcontractor Expert'],
    boqHighlights: {
      ar: [
        'محطة ضخ هيدروليكية مركزية تحت الأرض بقدرة 3,200 م³/ساعة',
        'خطوط سحب وطرد مواسير صلب وHDPE بأقطار 500 مم',
        'مرشحات ضغط عملاقة مزدوجة مع أنظمة الغسيل العكسي الآلي',
        'نظام تحكم سكادا SCADA المربوط بمنظومة إدارة المبنى BMS',
      ],
      en: [
        'Subterranean Central Hydraulic Pump Station rated at 3,200 m³/h',
        'Suction & Discharge Steel/HDPE Main Headers up to 500mm Diameter',
        'Industrial Twin Pressure Sand Filters with Automatic Backwash',
        'Full SCADA Automation Interface Connected to Central BMS',
      ],
    },
    hydraulicSpecs: {
      ar: 'معدل تدفق 3,200 م³/ساعة عند ضغط تشغيل 10 بار مع التكرارية التنسيقية 100%.',
      en: '3,200 m³/h Total Flow Capacity at 10 Bar Working Pressure with N+1 Redundancy.',
    },
    civilSpecs: {
      ar: 'غرف مضخات خرسانية مسلحة بعازلية فائقة الضغط وعزل صوتي للمحركات.',
      en: 'Heavy Underground Reinforced Concrete Vault with Acoustic Insulation & High Hydro-Protection.',
    },
    testimonialQuote: {
      ar: 'سرعة استجابة مهندسي بي زون وخبرتهم في الخطوط الهيدروليكية العملاقة أنقذت الجدول الزمني.',
      en: 'Pzone’s rapid technical office support and large-pipe expertise kept our overall timeline intact.',
    },
    galleryThumbnails: ['Pump Vault', 'Header Pipe', 'SCADA Screen'],
  },
  {
    id: 'elgouna-lagoon',
    category: 'lagoons',
    name: { ar: 'تحديث هيدروليك مارينا الجونة', en: 'El Gouna Marina Water Filtration & Hydraulic Upgrade' },
    client: { ar: 'أوراسكوم للإنشاءات (Orascom)', en: 'Orascom Construction' },
    location: { ar: 'محافظة البحر الأحمر — الجونة', en: 'Red Sea Governorate - El Gouna' },
    contractValue: 'EGP 65,000,000',
    completionDate: '2026-04-18',
    surfaceArea: '35,000 m²',
    flowRate: '2,400 m³/h',
    pumpsInfo: { ar: '14 مضخة برونزية مخصصة للمياه المالحة', en: '14x Saltwater Resistant Bronze Pumps' },
    scopeTags: ['Saltwater Hydraulic', 'Bronze Pumps', 'Coastal Lagoon', 'Egyptian Code Compliant'],
    boqHighlights: {
      ar: [
        'مضخات طرد برونزية مخصصة لمقاومة الأملاح والبيئة البحرية',
        'شبكة توزيع المياه البحرية لحماية التوازن البيئي للبحيرة',
        'مستشعرات درجة الملوحة والأكسجين المذاب المربوطة بالمنظومة',
        'عزل قاع البحيرة ببطانة الجيوممبرين HDPE سمك 2 مم',
      ],
      en: [
        'Custom Marine-Grade Bronze Pumps Designed for Saltwater Resistance',
        'Marine Water Circulation Network Protecting Eco-Balance',
        'Salinity & Dissolved Oxygen Sensors Tied to ERP Telemetry',
        'High-Density 2mm HDPE Geomembrane Liner System for Bottom Seal',
      ],
    },
    hydraulicSpecs: {
      ar: 'معدل تدوير مياه بحرية 2,400 م³/ساعة مع التحكم بنسبة النقاء والملوحة.',
      en: '2,400 m³/h Marine Circulation Cycle maintaining Strict Ecological Water Clarity.',
    },
    civilSpecs: {
      ar: 'تبطين الأرضيات ببطانة الجيوممبرين وحماية الشواطئ بالخرسانة المقذوفة البحرية.',
      en: 'Geomembrane Bottom Sealing with Marine-Grade Shotcrete Shore Protection.',
    },
    testimonialQuote: {
      ar: 'قدرة بي زون على توريد المضخات البرونزية المقاومة للملوحة كانت العاطف الأهم لنجاح مشروع المارينا.',
      en: 'Pzone’s capability to source and install marine-grade bronze pumps was key to the project’s success.',
    },
    galleryThumbnails: ['Bronze Pump', 'Geomembrane Laying', 'Salinity Sensor'],
  },
  {
    id: 'badya-pools',
    category: 'pools',
    name: { ar: 'مشروع مسابح ومنطقة الألعاب المائية — بادية بالم هيلز', en: 'Badya Hills Resort Pools & Splash Park' },
    client: { ar: 'بالم هيلز للتعمير (Palm Hills)', en: 'Palm Hills Developments' },
    location: { ar: 'مدينة 6 أكتوبر — بادية', en: '6th of October - Badya City' },
    contractValue: 'EGP 29,000,000',
    completionDate: '2026-05-25',
    surfaceArea: '9,400 m²',
    flowRate: '720 m³/h',
    pumpsInfo: { ar: '6 مضخات سحب مزدوجة بقدرة 22 كيلوواط', en: '6x Dual Suction Circulation Pumps 22kW' },
    scopeTags: ['Splash Park', 'Resort Swimming Pools', 'UV Disinfection', '14% VAT Compliant'],
    boqHighlights: {
      ar: [
        'ألعاب مائية تفاعلية ومساقط للأطفال مع أرضيات أمان مطاطية',
        'أنظمة تعقيم بالأشعة فوق البنفسجية UV لضمان خلو المياه من الميكروبات',
        'تكسية بلاط سيراميك مخصص للرياضات المائية خشن الملمس لمنع الانزلاق',
        'خزانات توازن مسلحة تحت الأرض بسعة 120 م³',
      ],
      en: [
        'Interactive Splash Park Water Features with Safety Rubber Flooring',
        'Ultraviolet (UV) Disinfection Chamber for Pathogen-Free Water',
        'Anti-Slip Marine Grade Ceramic Tiles for Pool Surrounds',
        'Underground Balance Surge Tanks with 120 m³ Liquid Capacity',
      ],
    },
    hydraulicSpecs: {
      ar: 'دورة فلترة سريعة للألعاب المائية كل ساعتين مع التعقيم المزدوج UV والكلور.',
      en: 'Rapid 2-Hour Turnover Filtration Loop for Splash Park with Dual UV/Chlorine Disinfection.',
    },
    civilSpecs: {
      ar: 'هيكل مدني مجهد مع صب الخرسانات وعزل الفواصل بمادة الأيبوكسي.',
      en: 'Engineered Concrete Tank Structure Sealed with Water-tight Elastomeric Coatings.',
    },
    testimonialQuote: {
      ar: 'تصميم منطقة الألعاب المائية وتكامل أنظمة الأمان جعلها واحدة من أجمل مناطق بادية.',
      en: 'The interactive splash park design and safety standards made this a highlight feature of Badya.',
    },
    galleryThumbnails: ['Splash Toys', 'UV Chamber', 'Surge Tank'],
  },
];
