/**
 * Hydraulic & Aquatic Engineering Formulas & Technical Definitions
 * Verified according to Egyptian Code for Water Networks, DIN 19643, and P-Zone Electromechanical Standards.
 * Pure mathematical functions with zero side-effects.
 */

export interface HydraulicFormulaDefinition {
  id: 'flowRate' | 'velocity' | 'trenchDepth' | 'waterVolume' | 'waterDepth';
  symbol: string;
  nameAr: string;
  nameEn: string;
  formula: string;
  unit: string;
  definitionAr: string;
  definitionEn: string;
  governingCodes: string[];
  designLimitsAr: string[];
  designLimitsEn: string[];
  practicalApplicationAr: string;
  practicalApplicationEn: string;
}

/**
 * Calculates water volume in m³: V = Area (m²) * Average Depth (m)
 */
export function calculateWaterVolume(areaM2: number, depthM: number): number {
  const safeArea = Math.max(0, Number(areaM2) || 0);
  const safeDepth = Math.max(0, Number(depthM) || 0);
  return Number((safeArea * safeDepth).toFixed(2));
}

/**
 * Calculates required volumetric flow rate Q (m³/h): Q = V / T
 * @param volumeM3 Total water volume in m³
 * @param turnoverHours Turnover period in hours (e.g., 4h for standard pools, 6h for public, 8-12h for lagoons)
 */
export function calculateFlowRate(volumeM3: number, turnoverHours: number): number {
  const safeVol = Math.max(0, Number(volumeM3) || 0);
  const turnoverNum = Number(turnoverHours);
  const safeTurnover = isNaN(turnoverNum) ? 6 : Math.max(0.1, turnoverNum);
  return Number((safeVol / safeTurnover).toFixed(2));
}

/**
 * Calculates flow velocity v (m/s) in a circular pipe:
 * v = Q_m3s / A = (4 * Q_m3h) / (3600 * PI * (D_mm / 1000)^2)
 * @param flowRateM3h Volumetric flow rate in m³/h
 * @param pipeDiameterMm Internal pipe diameter in mm
 */
export function calculatePipeVelocity(flowRateM3h: number, pipeDiameterMm: number): number {
  const safeQ = Math.max(0, Number(flowRateM3h) || 0);
  const safeD = Math.max(1, Number(pipeDiameterMm) || 160);
  const diameterM = safeD / 1000;
  const areaM2 = (Math.PI * Math.pow(diameterM, 2)) / 4;
  const flowRateM3s = safeQ / 3600;
  return Number((flowRateM3s / areaM2).toFixed(2));
}

/**
 * Calculates recommended internal pipe diameter (mm) for a target velocity:
 * D = sqrt( (4 * Q_m3s) / (PI * v) ) * 1000
 * @param flowRateM3h Volumetric flow rate in m³/h
 * @param targetVelocityMs Target design velocity in m/s (e.g. 1.5 m/s for suction, 2.2 m/s for discharge)
 */
export function calculateRecommendedPipeDiameter(flowRateM3h: number, targetVelocityMs: number = 1.5): number {
  const safeQ = Math.max(0, Number(flowRateM3h) || 0);
  const safeV = Math.max(0.1, Number(targetVelocityMs) || 1.5);
  if (safeQ === 0) return 110;
  const flowRateM3s = safeQ / 3600;
  const diameterM = Math.sqrt((4 * flowRateM3s) / (Math.PI * safeV));
  return Math.round(diameterM * 1000);
}

/**
 * Calculates total trench excavation depth H_trench (m):
 * H_trench = H_cover + (D_pipe_mm / 1000) + H_bedding
 * @param pipeDiameterMm Pipe outer diameter in mm
 * @param coverDepthM Minimum soil cover depth (default 0.8m under landscape, 1.2m under roads)
 * @param beddingThicknessM Sand bedding thickness (default 0.15m)
 */
export function calculateTrenchDepth(
  pipeDiameterMm: number,
  coverDepthM: number = 0.8,
  beddingThicknessM: number = 0.15
): number {
  const safeD = Math.max(0, Number(pipeDiameterMm) || 160) / 1000;
  const safeCover = Math.max(0.3, Number(coverDepthM) || 0.8);
  const safeBedding = Math.max(0.05, Number(beddingThicknessM) || 0.15);
  return Number((safeCover + safeD + safeBedding).toFixed(2));
}

/**
 * Technical Definitions & Engineering Standards Dictionary
 */
export const HYDRAULIC_FORMULA_DEFINITIONS: Record<
  HydraulicFormulaDefinition['id'],
  HydraulicFormulaDefinition
> = {
  flowRate: {
    id: 'flowRate',
    symbol: 'Q',
    nameAr: 'معدل التدفق الهيدروليكي (Flow Rate)',
    nameEn: 'Volumetric Flow Rate (Q)',
    formula: 'Q = V / T_turnover',
    unit: 'م³/ساعة (m³/h)',
    definitionAr:
      'معدل السريان الحجمي المطلوب لتدوير وتنقية كامل حجم مياه الحوض عبر وحدات الفلترة والمعالجة الميكانيكية خلال زمن التدوير التصميمي (Turnover Time). يحدد هذا الرقم مباشرة قدرة وسعة مضخات السحب والمرشحات الرملية ومحابس التغذية.',
    definitionEn:
      'The volumetric rate of water circulation required to pass the entire pool or lagoon volume through the mechanical filtration and chemical treatment plant within the target turnover duration. Directly determines pump capacity, filter sizing, and manifold diameters.',
    governingCodes: [
      'الكود المصري لشبكات مياه المسابح والمنشآت المائية',
      'DIN 19643 (Treatment of swimming and bathing pool water)',
      'World Aquatics Facility Rules Part IV',
      'P-Zone Electromechanical Engineering Guidelines',
    ],
    designLimitsAr: [
      'أحواض الأطفال والسبلاش: زمن تدوير T = 1.0 - 2.0 ساعة',
      'حمامات السباحة العامة والسكنية: زمن تدوير T = 4.0 - 6.0 ساعات',
      'البحيرات الصناعية واللاجون: زمن تدوير T = 6.0 - 12.0 ساعة',
      'أحواض الجاكوزي والسبا: زمن تدوير T = 0.5 - 1.0 ساعة',
    ],
    designLimitsEn: [
      'Children / Splash Pools: Turnover T = 1.0 - 2.0 hours',
      'Standard Residential / Public Pools: Turnover T = 4.0 - 6.0 hours',
      'Artificial Lagoons & Lakes: Turnover T = 6.0 - 12.0 hours',
      'Hydro-Spas & Jacuzzis: Turnover T = 0.5 - 1.0 hours',
    ],
    practicalApplicationAr:
      'حساب سعة المضخات (Pumps m³/h) وعدد مرشحات الرمل السريعة (High-Rate Sand Filters) وتحديد استهلاك الطاقة ومقاطع الكابلات الكهربائية بغرفة الميكانيكا.',
    practicalApplicationEn:
      'Sizes filtration circulating pumps, high-rate sand filter batteries, chemical dosing rates, and mechanical plant room power ratings.',
  },
  velocity: {
    id: 'velocity',
    symbol: 'v',
    nameAr: 'سرعة سريان المياه في خطوط الشبكة (Pipe Velocity)',
    nameEn: 'Pipe Flow Velocity (v)',
    formula: 'v = Q / A_pipe = (4 × Q) / (π × D²)',
    unit: 'م/ث (m/s)',
    definitionAr:
      'متوسط سرعة تدفق السائل داخل مقطع الماسورة الدائري. يُراعى ضبطها بدقة هندسية: زيادة السرعة تسبب هبوطاً حاداً في الضغط (Head Loss) وتآكلاً للمواسير وظاهرة الطرق المائي (Water Hammer)، بينما انخفاضها يسبب ترسب العوالق وعدم كفاءة التقليب.',
    definitionEn:
      'The mean fluid flow velocity through the pipe cross-section. Crucial for balancing hydraulic head losses against sedimentation: high velocities induce severe pressure drops, pipe erosion, and water hammer, while low velocities risk sediment deposition.',
    governingCodes: [
      'DIN 19643 Hydraulic Sizing Standards',
      'ASHRAE HVAC & Aquatic Systems Applications',
      'الكود المصري للتركيبات الصحية وشبكات التغذية',
      'P-Zone Piping Hydraulic Criteria',
    ],
    designLimitsAr: [
      'خطوط السحب من الحوض (Suction): v = 1.2 - 1.5 م/ث (الحد الأقصى 1.5 م/ث لمنع التكهف والدوامات Cavitation/Vortex)',
      'خطوط الطرد والضخ (Discharge): v = 2.0 - 2.5 م/ث (الحد الأقصى 3.0 م/ث للتحكم بهبوط الضغط واستهلاك المضخات)',
      'خطوط الجاذبية والمفيض (Gravity/Overflow): v = 0.5 - 1.0 م/ث (لضمان الجريان الحر بدون احتباس هواء)',
    ],
    designLimitsEn: [
      'Suction Lines: v = 1.2 - 1.5 m/s (strictly <= 1.5 m/s to prevent pump cavitation & vortex formation)',
      'Discharge Lines: v = 2.0 - 2.5 m/s (max 3.0 m/s to optimize friction head loss & avoid water hammer)',
      'Gravity / Overflow Gutters: v = 0.5 - 1.0 m/s (ensures self-cleansing without air lock)',
    ],
    practicalApplicationAr:
      'تحديد أقطار المواسير البلاستيكية (UPVC Class 10/16 أو HDPE PN10/16) لتجنب انهيار المضخات وضمان عمر افتراضي يتجاوز 25 عاماً للشبكة.',
    practicalApplicationEn:
      'Dictates nominal pipe diameters (UPVC Cl.10/16 or HDPE PN10/16) to ensure acoustic silence, pump longevity, and 25+ year lifespan.',
  },
  trenchDepth: {
    id: 'trenchDepth',
    symbol: 'H_trench',
    nameAr: 'عمق حفر وترنش مسارات شبكات المواسير (Trench Excavation Depth)',
    nameEn: 'Trench Excavation Depth (H_trench)',
    formula: 'H_trench = H_cover + D_ext + H_bedding',
    unit: 'متر (m)',
    definitionAr:
      'العمق الإجمالي المطلوب لحفر مسارات المواسير تحت منسوب التشطيب. يشمل عمق الردم الآمن فوق الماسورة لحمايتها من الأحمال الميكانيكية، مضافاً إليه القطر الخارجي للماسورة وسماكة فرشة الرمل المدموكة أسفلها مع مراعاة الميول الهيدروليكية (0.5% - 1.0%).',
    definitionEn:
      'Total required depth for excavating underground pipe trenches below finished grade. Includes protective backfill soil cover against dynamic surface loads, the outer pipe diameter, and the compacted clean sand bedding layer, factoring in hydraulic slopes (0.5% - 1.0%).',
    governingCodes: [
      'الكود المصري لأعمال الحفر وسند جوانب التربة والردم',
      'ASTM D2321 (Underground Installation of Thermoplastic Pipe)',
      'BS EN 1610 (Construction and Testing of Drains and Sewers)',
      'P-Zone Site QA/QC Piping Specifications',
    ],
    designLimitsAr: [
      'عمق الردم الوقائي في اللاندسكيب والممرات: H_cover ≥ 0.60 - 0.80 م',
      'عمق الردم الوقائي تحت الطرق وسيارات الخدمات: H_cover ≥ 1.00 - 1.20 م (مع غلاف خرساني خفيف إن لزم)',
      'فرشة الرمل النظيف أسفل الماسورة: H_bedding = 0.10 - 0.15 م (مدموكة بنسبة 95% Modified Proctor)',
      'عرض الترنش الأدنى: W_trench = D_ext + 0.40 م (20 سم على كل جانب لضمان سهولة التركيب والدمك)',
    ],
    designLimitsEn: [
      'Landscape / Pedestrian Cover: H_cover >= 0.60 - 0.80 m',
      'Vehicular Road Cover: H_cover >= 1.00 - 1.20 m (reinforced concrete encasement if shallower)',
      'Sand Bedding Layer: H_bedding = 0.10 - 0.15 m (clean washed sand compacted to 95% Modified Proctor)',
      'Minimum Trench Width: W_trench = D_ext + 0.40 m (20 cm working space on each flank for proper compaction)',
    ],
    practicalApplicationAr:
      'حساب كميات أعمال الحفر والردم الهندسي بجدول الكميات (BOQ)، وتحديد مناسيب قاع الحفر (Invert Levels) وتفادي تعارض المسارات مع شبكات الري والكهرباء.',
    practicalApplicationEn:
      'Calculates excavation and structural backfill BOQ quantities, establishes pipe invert levels, and prevents clashes with MEP services.',
  },
  waterVolume: {
    id: 'waterVolume',
    symbol: 'V',
    nameAr: 'حجم وسعة المياه الكلية (Total Water Volume)',
    nameEn: 'Total Water Volume (V)',
    formula: 'V = A_surface × d_avg',
    unit: 'م³ (m³)',
    definitionAr:
      'السعة الاستيعابية الكلية للمنشأة المائية محسوبة بضرب المساحة السطحية في متوسط العمق الهيدروليكي للمسطح. هذا المعيار هو الركيزة الأساسية لحساب حمولة المنشأ الإنشائية وتكاليف المياه والكيماويات وخزانات الموازنة.',
    definitionEn:
      'The aggregate volumetric water-holding capacity of the facility, calculated as planar surface area multiplied by mean hydraulic depth. Forms the structural basis for dead load calculations, water supply, balancing tank volume, and chemical storage.',
    governingCodes: [
      'الكود المصري للإنشاءات المائية والخرسانة المسلحة',
      'ACI 350 (Code Requirements for Environmental Engineering Concrete Structures)',
      'P-Zone Civil & Electromechanical Design Standards',
    ],
    designLimitsAr: [
      'تحديد سعة خزان الموازنة (Balancing Tank): بنسبة 5% - 10% من الحجم الكلي V للأحواض ذات نظام Over-Flow',
      'حساب أوزان الأحمال الميتة الإنشائية: كل 1 م³ ماء = 1 طن حمولة استاتيكية على التربة واللبشة',
    ],
    designLimitsEn: [
      'Balancing Tank Sizing: 5% - 10% of total volume V for overflow gutter systems',
      'Structural Hydrostatic Dead Load: 1 m³ water = 1.0 metric ton hydrostatic pressure on structural raft',
    ],
    practicalApplicationAr:
      'تقدير استهلاك ملء المياه المبدئي، واحتياجات محطة المعالجة بالكلور والأوزون، وتحديد متطلبات الصرف في حالات التفريغ للطوارئ.',
    practicalApplicationEn:
      'Estimates initial filling requirements, chemical dosing volumes (chlorine, acid, flocculants), and emergency drain capacity.',
  },
  waterDepth: {
    id: 'waterDepth',
    symbol: 'd_avg',
    nameAr: 'متوسط العمق الهيدروليكي (Average Depth)',
    nameEn: 'Average Hydraulic Depth (d_avg)',
    formula: 'd_avg = (d_shallow + d_deep) / 2',
    unit: 'متر (m)',
    definitionAr:
      'العمق المرجعي المتوسط لكتلة المياه من قاع الحوض حتى منسوب سطح المياه التشغيلي. يؤثر بشكل مباشر على ضغط المياه الهيدروستاتيكي، متطلبات سلامة السباحين، ومعدلات التبخر ونفاذية أشعة الشمس.',
    definitionEn:
      'The mean vertical distance from the finished bottom floor slab to the operational water surface line. Directly influences hydrostatic base pressure, bather safety clearances, evaporation rates, and solar thermal gain.',
    governingCodes: [
      'الكود المصري لاشتراطات حمامات السباحة والنوادي',
      'World Aquatics Facility Rules (Depth Requirements)',
      'P-Zone Architectural & Aquatic Safety Standards',
    ],
    designLimitsAr: [
      'أحواض الأطفال الترفيهية: 0.40 - 0.60 م',
      'حمامات السباحة القياسية للعائلات: 1.20 - 1.40 م',
      'حمامات السباحة نصف الأولمبية والتدريب: 1.40 - 2.00 م',
      'بحيرات اللاجون الشاطئية الاصطناعية: 1.50 - 2.50 م',
    ],
    designLimitsEn: [
      'Toddler & Children Splash Basins: 0.40 - 0.60 m',
      'Standard Family Recreational Pools: 1.20 - 1.40 m',
      'Semi-Olympic & Training Pools: 1.40 - 2.00 m',
      'Artificial Beach Lagoons: 1.50 - 2.50 m',
    ],
    practicalApplicationAr:
      'تحديد سماكة بلاطات الخرسانة المقذوفة (Shotcrete) وعزل الرطوبة وعمق سكاكر السحب الأرضي (Main Drains).',
    practicalApplicationEn:
      'Calculates hydrostatic uplift pressure, shotcrete concrete wall thickness, and suction sumps/main drain positioning.',
  },
};
