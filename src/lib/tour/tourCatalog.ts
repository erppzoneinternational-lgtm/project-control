import { TourStep } from '@/components/ui/GuidedTour';

export interface TourDefinition {
  id: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  badgeAr: string;
  badgeEn: string;
  iconName: 'Compass' | 'LayoutDashboard' | 'GanttChartSquare' | 'FolderKanban';
  targetRoute?: string;
  steps: TourStep[];
}

/**
 * 1. Global Master Shell & Navigation Tour
 * Targets persistent UI elements in the TopNav and shell accessible from every page.
 */
export const GLOBAL_PORTAL_TOUR_STEPS: TourStep[] = [
  {
    targetId: 'tour-global-brand',
    titleAr: '1. هوية منظومة P.ZONE الذكية والعودة للرئيسية',
    titleEn: '1. P.ZONE ERP Identity & Fast Home',
    descAr: 'شعار وهوية المنظومة، بالنقر عليه يمكنك العودة فوراً إلى الصفحة الرئيسية ولوحة القيادة التنفيذية من أي مكان في النظام.',
    descEn: 'Platform logo and brand identity. Click anytime to return directly to your primary dashboard.',
    tipAr: 'متكيف بصرياً مع الهوية الهندسية الداكنة والفاتحة ومثبت في أعلى الصفحة دائماً.',
    tipEn: 'Visually responsive across light and dark engineering themes, pinned at the top.',
    position: 'bottom',
  },
  {
    targetId: 'tour-global-groups',
    titleAr: '2. مجموعات وحدات المنظومة (Workspaces)',
    titleEn: '2. Navigation Groups & Workspaces',
    descAr: 'شريط التبويبات الرئيسي للوصول إلى كافة وحدات ومساحات عمل المنظومة: لوحات القيادة، إعداد المشاريع، دليل الشركاء وأصحاب المصلحة، وإدارة النظام.',
    descEn: 'Main workspace navigation tabs: Dashboards, Project Setup, Stakeholders directory, and System Administration.',
    tipAr: 'القوائم الفرعية في السطر الثاني تتغير تلقائياً بحسب المجموعة النشطة وصلاحيات دورك الوظيفي.',
    tipEn: 'The sub-navigation row automatically updates according to the active group and your role permissions.',
    position: 'bottom',
  },
  {
    targetId: 'tour-global-search',
    titleAr: '3. البحث السريع الذكي (ScrySearch ⌘K)',
    titleEn: '3. Fast Universal Search (⌘K)',
    descAr: 'محرك بحث فوري ثلاثي الأبعاد للوصول السريع إلى أي مشروع، كود تعاقدي، أو شريك بمجرد كتابة حرفين أو الضغط على اختصار (⌘K أو Ctrl+K).',
    descEn: 'Universal 3D flip search engine. Jump to any project, contract code, or stakeholder instantly via hotkey ⌘K / Ctrl+K.',
    tipAr: 'يدعم البحث الذكي باللغتين العربية والإنجليزية مع تصحيح الاستعلامات.',
    tipEn: 'Supports bilingual search in Arabic and English with instant auto-querying.',
    position: 'bottom',
  },
  {
    targetId: 'tour-global-project-selector',
    titleAr: '4. محدد المشروع العام النشط (Global Project Context)',
    titleEn: '4. Global Active Project Selector',
    descAr: 'هنا يتم تحديد المشروع النشط الذي ينعكس سياقه تلقائياً على كافة شاشات المنظومة (نبض الجدول، المستخلصات، الأنشطة، والمستندات) دون الحاجة لإعادة اختياره.',
    descEn: 'Selects the global active project context, synchronizing across all modules, schedules, and financial certificates.',
    tipAr: 'يتم حفظ اختيارك للمشروع تلقائياً في المتصفح عبر الجلسات والصفحات المختلفة.',
    tipEn: 'Your active project persists automatically across page reloads and future sessions.',
    position: 'bottom',
  },
  {
    targetId: 'tour-global-notifications',
    titleAr: '5. مركز الإشعارات والتنبيهات الميدانية',
    titleEn: '5. Real-Time Notification Center',
    descAr: 'مركز تنبيهات ذكي يرصد تحديثات المواقع، اعتمادات المستخلصات IPC، تقارير السلامة HSE، وتنبيهات المسار الحرج للمشاريع.',
    descEn: 'Real-time alert center monitoring site progress, IPC certifications, HSE reports, and critical path milestones.',
    tipAr: 'تظهر النقطة المضيئة عند وجود مستجدات أو موافقات معلقة تتطلب اتخاذ إجراء.',
    tipEn: 'Pulsing indicator illuminates when pending approvals or urgent actions require review.',
    position: 'bottom',
  },
  {
    targetId: 'tour-global-theme-toggle',
    titleAr: '6. مبدل المظهر (Day & Night Mode)',
    titleEn: '6. Theme Switcher (Dark / Light)',
    descAr: 'تبديل المظهر بين الوضع الليلي الهندسي الفاخر (Industrial Chic) والوضع النهاري فائق الوضوح بضغطة زر واحدة مع انتقال سلس.',
    descEn: 'Instant one-click toggle between Industrial Chic dark mode and high-clarity day mode.',
    tipAr: 'تم ضبط التباين بدقة لتقليل إجهاد العين أثناء العمل الطويل على المخططات والجداول.',
    tipEn: 'Engineered with WCAG-compliant contrast to reduce eye fatigue during prolonged reviews.',
    position: 'bottom',
  },
  {
    targetId: 'tour-global-lang-toggle',
    titleAr: '7. زر التبديل اللغوي الفوري (AR / EN)',
    titleEn: '7. Instant Language Switcher',
    descAr: 'التحويل الفوري بين اللغتين العربية والإنجليزية لكافة واجهات المنظومة، مع قلب ديناميكي لاتجاه الصفحة (RTL / LTR) مع الحفاظ على الأرقام والجداول الهندسية.',
    descEn: 'Instant language switch between Arabic and English with seamless RTL/LTR layout transitions.',
    tipAr: 'لا يتطلب التحويل إعادة تحميل الصفحة وتظل كافة مدخلاتك وجداولك محفوظة.',
    tipEn: 'Zero-reload language change preserves form state, scroll positions, and table filters.',
    position: 'bottom',
  },
  {
    targetId: 'tour-global-help-tour',
    titleAr: '8. زر الجولات التعريفية والدعم التفاعلي',
    titleEn: '8. Interactive Guided Tours Hub',
    descAr: 'يمكنك في أي وقت النقر على هذا الزر لفتح قائمة الجولات الإرشادية واختيار جولة المنظومة العامة أو جولة الصفحة التي تتصفحها حالياً.',
    descEn: 'Click anytime to open the guided tours menu and replay tours for the whole platform or the current page.',
    tipAr: 'يساعد المهندسين وأعضاء الفريق الجدد على إتقان استخدام المنظومة في دقائق معدودة.',
    tipEn: 'Empowers new team members and engineers to master portal workflows in minutes.',
    position: 'bottom',
  },
  {
    targetId: 'tour-global-user-profile',
    titleAr: '9. الملف الشخصي وأمان الحساب والصلاحيات',
    titleEn: '9. User Profile & Account Security',
    descAr: 'عرض بياناتك المسجلة، مسمياتك الوظيفية وأدوارك المعتمدة من الـ 22 دوراً بالمنظومة، تغيير كلمة المرور، أو تسجيل الخروج الآمن.',
    descEn: 'Inspect assigned roles across the 22-role RBAC matrix, update password, or sign out securely.',
    tipAr: 'يمكن للمديرين ومسؤولي النظام الانتقال من هنا إلى لوحة الإدارة وتخصيص الصلاحيات.',
    tipEn: 'Administrators can quickly navigate to permissions governance and account customization.',
    position: 'bottom',
  },
];

/**
 * 2. Executive Dashboard Tour
 * Targets key analytical telemetry, S-Curve chart, featured project, and quick actions.
 */
export const DASHBOARD_TOUR_STEPS: TourStep[] = [
  {
    targetId: 'tour-dash-search',
    titleAr: '1. البحث في المحفظة التنفيذية',
    titleEn: '1. Portfolio Executive Search',
    descAr: 'شريط الفلترة السريعة للمشاريع والمقاولين والعقود داخل لوحة القيادة المركزية.',
    descEn: 'Quick filter for projects, contractors, and contracts within the executive dashboard.',
    tipAr: 'يدعم البحث بكود المشروع أو اسم العميل أو نوع الأعمال.',
    tipEn: 'Filter by project code, client name, or construction scope.',
    position: 'bottom',
  },
  {
    targetId: 'tour-dash-telemetry',
    titleAr: '2. المحفظة الاستثمارية ومنحنى S-Curve ومؤشرات EVM',
    titleEn: '2. Contract Value & S-Curve Telemetry',
    descAr: 'يعرض إجمالي العقود الفعلي مع رسم بياني تفاعلي لمنحنى S-Curve التراكمي (المخطط vs الفعلي vs المستخلصات)، ومؤشرات إدارة القيمة المكتسبة (SPI / SV / EV).',
    descEn: 'Displays total portfolio contract value with interactive cumulative S-Curve and EVM telemetry (Planned vs Actual vs Invoiced).',
    tipAr: 'يمكنك التبديل بين عرض المحفظة بالكامل (Portfolio) أو المشروع المحدد فقط.',
    tipEn: 'Toggle between full portfolio scope and selected single-project telemetry.',
    position: 'bottom',
  },
  {
    targetId: 'tour-dash-featured-project',
    titleAr: '3. بطاقة المشروع النشط المتميز (قابل للتبديل)',
    titleEn: '3. Featured Active Project Card',
    descAr: 'بطاقة ذكية قابلة للتبديل تعرض بيانات المشروع المتصدر (القيمة التعاقدية، كود المشروع، العميل، مدير المشروع)، مع إمكانية التنقل بين كافة المشاريع الحية بأسهم التبديل.',
    descEn: 'Interactive switcher displaying key metrics for leading active projects (Value, Code, Client, PM).',
    tipAr: 'تترتب المشروعات تنازلياً وفقاً لقيمتها التعاقدية لتسليط الضوء على أكبر المشاريع.',
    tipEn: 'Projects are ordered by contract value to highlight flagship developments.',
    position: 'bottom',
  },
  {
    targetId: 'tour-dash-quick-actions',
    titleAr: '4. مركز الإجراءات السريعة (Quick Actions)',
    titleEn: '4. Executive Quick Actions Hub',
    descAr: 'أزرار الوصول الفوري لإنشاء مشروع جديد، إصدار مستخلص IPC، مزامنة نبض الجدول الزمني P6 Pulse، رفع تقرير الموقع، أو مراجعة الاعتمادات.',
    descEn: 'One-click shortcuts to add projects, issue IPCs, sync P6 schedule pulse, log site progress, or review approvals.',
    tipAr: 'تختصر وقت الانتقال بين صفحات المنظومة المختلفة بنقرة واحدة.',
    tipEn: 'Reduces navigation friction to a single click.',
    position: 'bottom',
  },
  {
    targetId: 'tour-dash-pms',
    titleAr: '5. فريق مديري المشاريع الميدانيين (PMs)',
    titleEn: '5. Assigned Project Managers Team',
    descAr: 'عرض سريع لمديري المشاريع ومواقعهم النشطة وإجمالي حجم المحافظ المالية المسندة لكل مدير مشروع.',
    descEn: 'Overview of assigned PMs, their active sites, and managed portfolio contract volumes.',
    tipAr: 'النقطة الخضراء تشير إلى أن مدير المشروع يدير مواقع نشطة قيد التنفيذ حالياً.',
    tipEn: 'Green dot indicates that the PM currently oversees active construction sites.',
    position: 'top',
  },
  {
    targetId: 'tour-dash-budget-breakdown',
    titleAr: '6. توزيع المحفظة المالية التعاقدية',
    titleEn: '6. Portfolio Contract Breakdown',
    descAr: 'شريط تقدم دقيق يقارن حجم المشاريع قيد التنفيذ، المسلمة، والمعلقة لحساب نسب السيولة المالية ومعدلات الإنجاز التراكمية.',
    descEn: 'Visual progress bar tracking active, handed over, and on-hold contract volumes.',
    tipAr: 'يتم احتساب النسب في الوقت الفعلي مباشرة من قاعدة بيانات العقود.',
    tipEn: 'Percentages calculate in real-time directly from contract database records.',
    position: 'top',
  },
  {
    targetId: 'tour-dash-active-matrix',
    titleAr: '7. مصفوفة المواقع النشطة الحية',
    titleEn: '7. Active Sites Matrix',
    descAr: 'شبكة مربعات تفاعلية ترمز لكافة مواقع العمل الحية. النقر على أي كود يحدد المشروع في اللوحة فوراً ويعرض بياناته.',
    descEn: 'Interactive matrix grid for live job sites. Clicking any project code immediately updates the telemetry card.',
    tipAr: 'توضح حالة كل موقع ولونه لتسهيل المتابعة البصرية السريعة.',
    tipEn: 'Color-coded tiles provide instant visual site status awareness.',
    position: 'top',
  },
  {
    targetId: 'tour-dash-health-index',
    titleAr: '8. مؤشر السلامة والجودة الفنية (Zero LTI)',
    titleEn: '8. Safety & Technical Health Score',
    descAr: 'مؤشر قوسي لقياس الامتثال لمعايير الجودة والسلامة المهنية ومعدل ساعات العمل بدون حوادث وقت ضائع (Zero LTI).',
    descEn: 'Radial gauge measuring technical quality compliance and Zero Lost Time Incidents across all sites.',
    tipAr: 'يستند المؤشر إلى سجلات التفتيش الميداني وتقارير الـ QC والـ HSE المعتمدة.',
    tipEn: 'Grounded in verified QC inspection requests and daily HSE safety logs.',
    position: 'top',
  },
];

/**
 * 3. Schedule Pulse Tour
 * Targets P6 XER dropzone, analysis engine, sync, and baseline commit.
 */
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
    descAr: 'يشير هذا الإرشاد مباشرة إلى زر التبديل اللغوي الخاص بمحرك الجدول. يمكنك بضغطة زر واحدة التحويل بين اللغتين فوراً.',
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
    descAr: 'المساحة التفاعلية الرئيسية لسحب وإفلات ملفات البرنامج الأساسي (Baseline) أو التحديثات الدورية، واستعراض منحنيات S-Curve ومؤشرات الأداء EVM.',
    descEn: 'Interactive workspace: drop baseline/monthly XER files, inspect S-curves, calculate EVM indices, and track Critical Path.',
    tipAr: 'تم إلغاء كلمة المرور تماماً لتسهيل استبدال وتحديث الملفات بمرونة تامة.',
    tipEn: 'Password lock completely removed for seamless file replacements.',
    position: 'top',
  },
];

/**
 * 4. Project Setup Portal Tour
 */
export const PROJECT_SETUP_TOUR_STEPS: TourStep[] = [
  {
    targetId: 'tour-setup-header',
    titleAr: '1. بوابة وحوكمة إعداد المشاريع',
    titleEn: '1. Project Setup & Governance Hub',
    descAr: 'السجل المركزي لتهيئة المشروعات وإسناد مديري المشاريع وحوكمة أطراف التعاقد وفق المعايير الهندسية لشركة بي زون.',
    descEn: 'Centralized registry for project onboarding, PM assignments, and stakeholder governance.',
    tipAr: 'تعديل البيانات الأساسية مقتصر على المدير التجاري ومدير النظام لضمان النزاهة التعاقدية.',
    tipEn: 'Master data editing is restricted to Commercial Manager and Admin.',
    position: 'bottom',
  },
  {
    targetId: 'tour-setup-hud',
    titleAr: '2. أزرار الإجراءات السريعة والمشروع الجديد',
    titleEn: '2. Action HUD & New Project',
    descAr: 'إمكانية إضافة مشروع جديد فوراً، أو الانتقال إلى خريطة التحليلات الجغرافية GIS، أو تصفح سجل المشاريع بالكامل.',
    descEn: 'Instant shortcuts to create new projects, launch GIS map analytics, or explore full directory.',
    position: 'bottom',
  },
  {
    targetId: 'tour-setup-quick-nav',
    titleAr: '3. منصات الوصول السريع للوحدات',
    titleEn: '3. Quick Navigation Consoles',
    descAr: 'بطاقات توجيه ذكية تنقلك مباشرة إلى الخريطة الجغرافية، قائمة المشاريع، ودليل الشركاء.',
    descEn: 'Fast launch consoles linking directly to GIS spatial view, project indices, and stakeholders.',
    position: 'bottom',
  },
  {
    targetId: 'tour-setup-filter',
    titleAr: '4. أدوات الفلترة والبحث المتقدم',
    titleEn: '4. Advanced Filters & Search',
    descAr: 'تصفية المشاريع المسجلة حسب الحالة (قيد العمل، التسليم الابتدائي، معلق، منتهي) أو البحث باسم المشروع أو الكود.',
    descEn: 'Filter registered projects by status (Working, Handing Over, On Hold, Finished) or search by code.',
    position: 'bottom',
  },
  {
    targetId: 'tour-setup-table',
    titleAr: '5. جدول سجل المشاريع المعتمد',
    titleEn: '5. Approved Projects Registry Table',
    descAr: 'استعراض بيانات المشروعات المعتمدة، أكوادها، تواريخ التعاقد، ومدير المشروع المعتمد مع إمكانية تعديل البيانات.',
    descEn: 'Comprehensive table displaying contract codes, dates, assigned PMs, and quick actions.',
    position: 'top',
  },
];

export const ALL_PORTAL_TOURS: Record<string, TourDefinition> = {
  global_portal: {
    id: 'global_portal',
    titleAr: 'الجولة التعريفية العامة للمنظومة',
    titleEn: 'Global Portal Master Tour',
    descAr: 'استكشف كافة عناصر الشريط العلوي، محدد المشاريع، البحث الذكي، وأدوات التنقل الرئيسية.',
    descEn: 'Explore master navigation, project context selector, smart search, and core controls.',
    badgeAr: 'شامل لكافة الصفحات',
    badgeEn: 'All Pages Shell',
    iconName: 'Compass',
    steps: GLOBAL_PORTAL_TOUR_STEPS,
  },
  dashboard: {
    id: 'dashboard',
    titleAr: 'جولة لوحة القيادة التنفيذية',
    titleEn: 'Executive Dashboard Tour',
    descAr: 'تعرف على مؤشرات الأداء المالي، منحنيات S-Curve، مركز الإجراءات السريعة، ومصفوفة المواقع.',
    descEn: 'Tour contract financial KPIs, S-Curve curves, quick actions, and the active sites matrix.',
    badgeAr: 'لوحة القيادة',
    badgeEn: 'Executive Telemetry',
    iconName: 'LayoutDashboard',
    targetRoute: '/dashboard',
    steps: DASHBOARD_TOUR_STEPS,
  },
  schedule_pulse: {
    id: 'schedule_pulse',
    titleAr: 'جولة نبض الجدول الزمني (Schedule Pulse)',
    titleEn: 'Schedule Pulse (P6) Tour',
    descAr: 'تعلم كيفية مزامنة واعتماد ملفات Primavera XER، وحساب مؤشرات EVM والمسار الحرج.',
    descEn: 'Learn how to sync and commit Primavera XER schedules, evaluate EVM metrics, and critical path.',
    badgeAr: 'المكتب الفني والتخطيط',
    badgeEn: 'Planning & PM',
    iconName: 'GanttChartSquare',
    targetRoute: '/schedule-pulse',
    steps: SCHEDULE_PULSE_TOUR_STEPS,
  },
  project_setup: {
    id: 'project_setup',
    titleAr: 'جولة بوابة إعداد وحوكمة المشاريع',
    titleEn: 'Project Setup & Governance Tour',
    descAr: 'دليل تهيئة المشروعات الجديدة، إسناد مديري المشاريع، وضبط البيانات الأساسية التعاقدية.',
    descEn: 'Guide to project onboarding, assigning PMs, and governing master contract parameters.',
    badgeAr: 'إعداد المشاريع',
    badgeEn: 'Project Setup',
    iconName: 'FolderKanban',
    targetRoute: '/project-setup',
    steps: PROJECT_SETUP_TOUR_STEPS,
  },
};
