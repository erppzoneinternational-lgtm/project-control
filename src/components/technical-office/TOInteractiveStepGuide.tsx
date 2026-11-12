'use client';

import React, { useState } from 'react';
import {
  Compass,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  HelpCircle,
  Sparkles,
  Wrench,
  ShieldCheck,
  BarChart2,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Layers,
  PlayCircle,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { TORoleWorkflowGuide, GuideWorkspaceTab } from './TORoleWorkflowGuide';

export type StepGuideTabKey =
  | 'drawings'
  | 'e1_drawings'
  | 'materials'
  | 'e2_materials'
  | 'aquatic'
  | 'aquatic_safeguards'
  | 'field_paperwork'
  | 'team_assignment'
  | 'assignments'
  | 'queue'
  | 'manager_queue'
  | 'approvals'
  | 'transmittals'
  | 'register'
  | 'submittals'
  | 'radar'
  | 'coo_radar'
  | 'kpis'
  | 'role_guide';

interface StepDefinition {
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
}

interface TabCoachConfig {
  screenTitleAr: string;
  screenTitleEn: string;
  targetRoleAr: string;
  targetRoleEn: string;
  roleColor: 'teal' | 'purple' | 'emerald' | 'sky' | 'amber';
  purposeAr: string;
  purposeEn: string;
  steps: [StepDefinition, StepDefinition, StepDefinition];
  nextStepLabelAr?: string;
  nextStepLabelEn?: string;
  nextTabKey?: string;
  goldenTipAr: string;
  goldenTipEn: string;
}

const TAB_COACH_MAP: Record<string, TabCoachConfig> = {
  drawings: {
    screenTitleAr: 'مخططات الورشة واللوحات التنفيذية (E1 Shop Drawings)',
    screenTitleEn: 'Shop Drawings & Coordination (E1)',
    targetRoleAr: 'مهندس المكتب الفني (مدني / كهروميكانيك / معماري)',
    targetRoleEn: 'Technical Office Engineer (Civil / MEP / Arch)',
    roleColor: 'teal',
    purposeAr: 'إعداد اللوحات التنفيذية، تحديث نسب الإنجاز، ورفعها لاعتماد مدير المكتب الفني.',
    purposeEn: 'Prepare shop drawings, update progress, and submit to TO Manager review.',
    steps: [
      {
        titleAr: '١. اختر تخصصك ومهامك',
        titleEn: '1. Filter Your Discipline & Tasks',
        descAr: 'اضغط على زر التخصص (مدني وإنشائي / كهروميكانيك ومسابح / معماري) أو اختر «مهامي فقط» لعرض لوحاتك.',
        descEn: 'Click your specialty pill (Civil / MEP / Arch) or select "My Tasks Only" to focus on your sheets.',
      },
      {
        titleAr: '٢. حدّث نسبة الإنجاز أو سجّل عائقاً',
        titleEn: '2. Update Progress or Flag Blocker',
        descAr: 'من أزرار الإجراءات أمام اللوحة: حدّث نسبة الرسم، أو اضغط «السجل» لمراجعة التاريخ الزمني والتعديلات.',
        descEn: 'Use row action buttons to update drafting progress, flag a conflict, or click "History" for the audit log.',
      },
      {
        titleAr: '٣. ارفع اللوحة لطابور فحص المدير',
        titleEn: '3. Submit to Manager Queue',
        descAr: 'فور وصول اللوحة إلى ١٠٠٪، حوّل حالتها إلى «جاهز للمراجعة» لتنتقل تلقائياً لطابور اعتماد مدير المكتب الفني.',
        descEn: 'Once 100% complete, mark as "Ready for Review" so it moves to the TO Manager sign-off queue.',
      },
    ],
    nextStepLabelAr: 'الخطوة التالية: طابور فحص المدير',
    nextStepLabelEn: 'Next Stage: Manager Review Queue',
    nextTabKey: 'queue',
    goldenTipAr: 'لا تُرسل أي لوحة للاستشاري مباشرة قبل اعتمادها داخلياً من مدير المكتب الفني.',
    goldenTipEn: 'Never dispatch a drawing to the consultant before internal TO Manager approval.',
  },
  materials: {
    screenTitleAr: 'اعتمادات الخامات والموردين (E2 Material Submittals)',
    screenTitleEn: 'Material & Vendor Approvals (E2)',
    targetRoleAr: 'مهندس المكتب الفني (مدني / كهروميكانيك)',
    targetRoleEn: 'Technical Office Engineer (Civil / MEP)',
    roleColor: 'teal',
    purposeAr: 'تجهيز ملفات اعتماد المواد والمعدات والكتالوجات الفنية والعينات قبل التوريد.',
    purposeEn: 'Assemble material submittal packages, technical data sheets, and samples prior to procurement.',
    steps: [
      {
        titleAr: '١. فلتر الخامات حسب التخصص',
        titleEn: '1. Filter by Specialty',
        descAr: 'اختر «خامات مدنية ومعمارية» أو «معدات ومهمات كهروميكانيكية» للوصول السريع لبنودك.',
        descEn: 'Select Civil & Architectural or MEP Equipment to filter relevant material packages.',
      },
      {
        titleAr: '٢. استكمل مستندات الاعتماد (MIR / MAR)',
        titleEn: '2. Complete Submittal Dossier',
        descAr: 'تأكد من إرفاق الكتالوج الفني، شهادة المنشأ، ومطابقة المواصفات، وراجع «السجل» لأي ملاحظات سابقة.',
        descEn: 'Attach data sheets, certificates, and compliance sheets; check "History" for prior comments.',
      },
      {
        titleAr: '٣. أرسل لاعتماد مدير المكتب الفني',
        titleEn: '3. Send for Internal Sign-off',
        descAr: 'ارفع حالة الخامة إلى «بانتظار مراجعة المدير» ليتم فحصها وإصدار حافظة تسليم رسمية للاستشاري.',
        descEn: 'Advance status to "Under Review" so the TO Manager can approve and issue a transmittal.',
      },
    ],
    nextStepLabelAr: 'الخطوة التالية: طابور فحص المدير',
    nextStepLabelEn: 'Next Stage: Manager Review Queue',
    nextTabKey: 'queue',
    goldenTipAr: 'اعتماد الخامة (Code A/B) شرط إلزامي لإصدار أمر الشراء وصرف المستخلص المالي.',
    goldenTipEn: 'Consultant Code A/B on materials is mandatory for PO release and IPC billing.',
  },
  aquatic: {
    screenTitleAr: 'الضمانات المائية واختبارات الضغط (Aquatic Safeguards)',
    screenTitleEn: 'Aquatic Safeguards & Hydro-Testing',
    targetRoleAr: 'مهندس الكهروميكانيك (MEP) + مهندس المدني',
    targetRoleEn: 'MEP & Civil Engineers',
    roleColor: 'sky',
    purposeAr: 'توثيق اختبارات ضغط المواسير والعزل المائي للمسابح والنوافير قبل الصب الخرساني.',
    purposeEn: 'Document hydrostatic pipe pressure tests and pool waterproofing before concrete pouring.',
    steps: [
      {
        titleAr: '١. حدد المسطح المائي أو غرفة الطلمبات',
        titleEn: '1. Select Pool or Pump Room',
        descAr: 'استعرض حالة كل مسبح أو شلال مائي وتأكد من اكتمال مخططات الوصلات المدفونة (Puddle Flanges).',
        descEn: 'Select the pool basin or pump room and verify embedded puddle flange drawings.',
      },
      {
        titleAr: '٢. سجّل قراءات الضغط والعزل المائي',
        titleEn: '2. Log Pressure & Waterproofing Tests',
        descAr: 'أدخل ضغط الاختبار (Bar) ومدة الاحتفاظ بالضغط لتوثيق سلامة الشبكة قبل التغطية.',
        descEn: 'Record test pressure (Bar) and hold duration to certify piping integrity before backfilling/pouring.',
      },
      {
        titleAr: '٣. افتح بوابة التصريح بالصب',
        titleEn: '3. Unlock Concrete Pour Gate',
        descAr: 'بعد اجتياز الاختبار، يتحول البند إلى «آمن للصب» وينتقل إلى النماذج الميدانية وبوابة المستخلصات.',
        descEn: 'Once passed, the safeguard unlocks concrete pouring and links to the IPC payment gate.',
      },
    ],
    nextStepLabelAr: 'الخطوة التالية: النماذج الميدانية والمستخلصات',
    nextStepLabelEn: 'Next Stage: Field Paperwork & Payment Gate',
    nextTabKey: 'field_paperwork',
    goldenTipAr: 'يُمنع منعاً باتاً صب خرسانة المسابح قبل اعتماد اختبار ضغط المواسير المدفونة.',
    goldenTipEn: 'Concrete pouring is strictly locked until embedded piping pressure tests pass.',
  },
  field_paperwork: {
    screenTitleAr: 'النماذج الميدانية وبوابة المستخلصات (Field Paperwork & IPC Gate)',
    screenTitleEn: 'Field Paperwork & Financial Certificate Gate',
    targetRoleAr: 'مهندس المكتب الفني + مدير المكتب الفني',
    targetRoleEn: 'TO Engineer & TO Manager',
    roleColor: 'emerald',
    purposeAr: 'ربط الاعتمادات الهندسية (مخطط + خامة + فحص موقعي IR) بفتح صرف المستخلص المالي.',
    purposeEn: 'Connect approved drawings, materials, and site IRs to unlock financial IPC certificates.',
    steps: [
      {
        titleAr: '١. افحص مثلث الجاهزية الهندسية',
        titleEn: '1. Check the Engineering Readiness Triangle',
        descAr: 'تأكد من اكتمال الأضلاع الثلاثة لكل بند: (١) لوحة معتمدة + (٢) خامة معتمدة + (٣) استلام استشاري بالموقع (IR).',
        descEn: 'Verify all 3 gates per item: (1) Approved Drawing + (2) Approved Material + (3) Approved Site IR.',
      },
      {
        titleAr: '٢. عالج البنود المحجوبة عن الصرف',
        titleEn: '2. Resolve Payment-Blocked Items',
        descAr: 'البنود ذات العلامة الحمراء توضح بدقة المستند الناقص الذي يمنع إدراج البند في المستخلص الجاري.',
        descEn: 'Red-flagged items show the exact missing document blocking current IPC inclusion.',
      },
      {
        titleAr: '٣. صدّر شهادة التغطية الهندسية للمستخلص',
        titleEn: '3. Certify for IPC Billing',
        descAr: 'البنود المكتملة تصبح متاحة فوراً لقسم مراقبة التكاليف والعقود لصرف المستخلص.',
        descEn: 'Cleared items are unlocked for Cost Control and Contracts IPC billing.',
      },
    ],
    nextStepLabelAr: 'مراجعة السجل الشامل للمخرجات',
    nextStepLabelEn: 'View Master Deliverables Register',
    nextTabKey: 'register',
    goldenTipAr: 'القاعدة الصارمة: لا شهادة دفع مالي بدون مخطط ورشة معتمد وطلب فحص استشاري (IR) مقبول.',
    goldenTipEn: 'Strict Rule: No financial certificate without an approved Shop Drawing and Consultant IR.',
  },
  team_assignment: {
    screenTitleAr: 'توزيع المهام على المهندسين (Workload & Task Assignment)',
    screenTitleEn: 'Engineer Workload & Task Assignment',
    targetRoleAr: 'مدير المكتب الفني (TO Manager)',
    targetRoleEn: 'Technical Office Manager',
    roleColor: 'purple',
    purposeAr: 'تكليف مهندسي المكتب الفني بحزم المخططات والخامات وموازنة ضغط العمل بينهم.',
    purposeEn: 'Assign drawing and material packages to TO engineers and balance team workload.',
    steps: [
      {
        titleAr: '١. استعرض الحزم غير المكلفة أو المتأخرة',
        titleEn: '1. View Unassigned or Overdue Packages',
        descAr: 'فلتر اللوحات المفتوحة التي لم يُعيّن لها مهندس مسؤول بعد أو التي تحتاج إعادة توزيع.',
        descEn: 'Filter open submittals without an assigned engineer or items needing reallocation.',
      },
      {
        titleAr: '٢. اختر المهندس وحدد تاريخ الاستحقاق',
        titleEn: '2. Select Engineer & Target Date',
        descAr: 'عيّن المهندس المختص (مدني / كهروميكانيك / معماري) واربط المهمة بتاريخ استحقاق واضح.',
        descEn: 'Assign the specialist engineer and set a mandatory target completion date.',
      },
      {
        titleAr: '٣. تابع إنجاز الفريق في طابور الاعتماد',
        titleEn: '3. Monitor Output in Review Queue',
        descAr: 'تظهر المهام فوراً في شاشة «مهامي الهندسية» لدى المهندس، وعند إنهائها تعود إليك في طابور الفحص.',
        descEn: 'Assigned tasks appear on the engineer board and return to your Review Queue upon completion.',
      },
    ],
    nextStepLabelAr: 'الانتقال إلى طابور فحص المدير',
    nextStepLabelEn: 'Go to Manager Review Queue',
    nextTabKey: 'queue',
    goldenTipAr: 'توزيع اللوحات مبكراً يمنع تكدس الاختناقات قبل مواعيد الصب الخرساني.',
    goldenTipEn: 'Early package assignment prevents bottlenecks ahead of critical concrete pours.',
  },
  queue: {
    screenTitleAr: 'طابور فحص واعتماد المدير (TO Manager Review Queue)',
    screenTitleEn: 'TO Manager Internal Review Queue',
    targetRoleAr: 'مدير المكتب الفني (TO Manager)',
    targetRoleEn: 'Technical Office Manager',
    roleColor: 'purple',
    purposeAr: 'فحص اللوحات والخامات المنجزة من المهندسين واعتمادها داخلياً أو إرجاعها بملاحظات.',
    purposeEn: 'Review completed engineer submittals and approve internally or return with comments.',
    steps: [
      {
        titleAr: '١. راجع المخرجات الجاهزة للفحص',
        titleEn: '1. Inspect Ready Submittals',
        descAr: 'كل صف يمثل لوحة أو خامة أنهاها المهندس؛ اضغط «السجل (Log)» لرؤية تسلسل التعديلات الكامل.',
        descEn: 'Each row is an engineer-completed item; click "Log" to inspect its chronological history.',
      },
      {
        titleAr: '٢. اعتمد داخلياً أو أرجع بأسباب محددة',
        titleEn: '2. Approve or Return with Reason Chips',
        descAr: 'اضغط «اعتماد» للبنود السليمة (أو اعتمد عدة بنود دفعة واحدة)، أو «إرجاع للمهندس» مع تحديد سبب الرفض.',
        descEn: 'Click "Approve" (or batch-approve multiple rows), or "Return" with structured rejection reasons.',
      },
      {
        titleAr: '٣. أصدر حافظة التسليم للاستشاري',
        titleEn: '3. Issue Consultant Transmittal',
        descAr: 'البنود المعتمدة داخلياً تنتقل فوراً إلى قسم «حوافظ التسليم (Transmittals)» لإرسالها للاستشاري.',
        descEn: 'Internally approved items move to "Transmittals" for official dispatch to the consultant.',
      },
    ],
    nextStepLabelAr: 'الخطوة التالية: حوافظ تسليم الاستشاري',
    nextStepLabelEn: 'Next Stage: Consultant Transmittals',
    nextTabKey: 'transmittals',
    goldenTipAr: 'بوابة الفحص الداخلي ترفع نسبة القبول من أول مرة (First-Time Right Code A/B) لدى الاستشاري.',
    goldenTipEn: 'Rigorous internal review maximizes First-Time-Right Code A/B consultant approvals.',
  },
  transmittals: {
    screenTitleAr: 'حوافظ التسليم وأرشيف الاستشاري (Consultant Transmittals & 14d SLA)',
    screenTitleEn: 'Consultant Transmittals & 14-Day SLA Clock',
    targetRoleAr: 'مدير المكتب الفني + مراقب الوثائق (Doc Controller)',
    targetRoleEn: 'TO Manager & Document Controller',
    roleColor: 'purple',
    purposeAr: 'إصدار خطابات الإرسال الرسمية للاستشاري، مراقبة عداد الـ ١٤ يوماً التعاقدي، وتسجيل أكواد الرد.',
    purposeEn: 'Issue official consultant transmittals, track the 14-day FIDIC review clock, and log response codes.',
    steps: [
      {
        titleAr: '١. أنشئ حافظة تسليم للبنود المعتمدة داخلياً',
        titleEn: '1. Bundle Internally Approved Items',
        descAr: 'اختر اللوحات أو الخامات المعتمدة من المدير وأصدر لها رقم حافظة تسليم رسمي (Transmittal Ref).',
        descEn: 'Select manager-approved items and generate an official Transmittal Reference.',
      },
      {
        titleAr: '٢. راقب عداد مهلة المراجعة (١٤ يوماً)',
        titleEn: '2. Track 14-Day FIDIC SLA Clock',
        descAr: 'يحسب النظام تلقائياً الأيام المنقضية لدى الاستشاري وينبهك باللون الأحمر عند تجاوز المهلة التعاقدية.',
        descEn: 'The system tracks days elapsed with the consultant and flags SLA breaches (>14 days) in red.',
      },
      {
        titleAr: '٣. سجّل قرار الاستشاري (Code A / B / C / D)',
        titleEn: '3. Record Consultant Approval Code',
        descAr: 'فور استلام الرد: كود A/B يفتح التنفيذ والمستخلصات، وكود C/D يعيد البند للمهندس لإعادة التقديم.',
        descEn: 'Log Code A/B to unlock site execution & billing, or Code C/D to route back for revision.',
      },
    ],
    nextStepLabelAr: 'الخطوة التالية: بوابة المستخلصات والنماذج الميدانية',
    nextStepLabelEn: 'Next Stage: Field Paperwork & IPC Gate',
    nextTabKey: 'field_paperwork',
    goldenTipAr: 'كل تجاوز لمهلة الـ ١٤ يوماً لدى الاستشاري يُسجل تلقائياً كمستند إثبات مطالبة زمنية (EOT Claim).',
    goldenTipEn: 'Every consultant review exceeding 14 days is logged as contractual EOT delay evidence.',
  },
  register: {
    screenTitleAr: 'السجل الشامل للمخرجات الهندسية (Master Submittals Register)',
    screenTitleEn: 'Master Deliverables & Submittals Register',
    targetRoleAr: 'مدير المكتب الفني + مدير المشروع',
    targetRoleEn: 'TO Manager & Project Manager',
    roleColor: 'purple',
    purposeAr: 'رؤية شاملة لكل المخططات والخامات، حوزة الإجراء (Ball-in-Court)، السماحية الزمنية، وموجز خمسة.',
    purposeEn: 'Complete register of all submittals, Ball-in-Court ownership, schedule float, and Khamsa briefings.',
    steps: [
      {
        titleAr: '١. فلتر حسب حوزة الإجراء أو القرار',
        titleEn: '1. Filter by Ball-in-Court or Code',
        descAr: 'اعرف فوراً البنود المتوقفة عند (الاستشاري / مدير المكتب / المهندس) أو ابحث برقم اللوحة.',
        descEn: 'Filter items held by Consultant, Manager, or Engineer, or search by sheet number.',
      },
      {
        titleAr: '٢. افتح «السجل» لأي معاملة',
        titleEn: '2. Open Chronological History Log',
        descAr: 'اضغط أيقونة الساعة في عمود «السجل» لعرض الخط الزمني الكامل (من عمل ماذا ومتى وبأي ملاحظة).',
        descEn: 'Click the History icon on any row to see the exact chronological audit trail.',
      },
      {
        titleAr: '٣. انسخ «موجز خمسة» للاجتماعات',
        titleEn: '3. Copy 60-Second Khamsa Briefing',
        descAr: 'اضغط أيقونة «موجز خمسة» لتوليد ملخص تنفيذي جاهز للنسخ والإرسال في اجتماعات الإدارة.',
        descEn: 'Click the Khamsa icon to generate a 60-second executive summary ready to copy and share.',
      },
    ],
    nextStepLabelAr: 'فتح رادار المعوقات التنفيذي (COO)',
    nextStepLabelEn: 'Open Executive Blockers Radar',
    nextTabKey: 'radar',
    goldenTipAr: 'عمود «حوزة الإجراء (Ball-in-Court)» يحدد بدقة الطرف المسؤول عن الخطوة القادمة دون التباس.',
    goldenTipEn: 'The Ball-in-Court column pinpoints the exact party responsible for the next action.',
  },
  radar: {
    screenTitleAr: 'رادار المعوقات التنفيذي والإدارة العليا (COO Executive Radar)',
    screenTitleEn: 'COO Executive Radar & Critical Blockers',
    targetRoleAr: 'رئيس العمليات (COO) + الإدارة العليا + مدير المشروع',
    targetRoleEn: 'Chief Operating Officer (COO) & Top Management',
    roleColor: 'emerald',
    purposeAr: 'رصد الاختناقات الحرجة التي تهدد الصب الخرساني أو التوريدات، ومتابعة إنتاجية المهندسين.',
    purposeEn: 'Monitor critical bottlenecks threatening concrete pours or procurement, and audit engineer roster.',
    steps: [
      {
        titleAr: '١. افحص عوائق الصب الخرساني والتوريد',
        titleEn: '1. Inspect Concrete & Procurement Blockers',
        descAr: 'القسم العلوي يعرض اللوحات والخامات الحرجة المتأخرة التي توقف أعمال الموقع مباشرة.',
        descEn: 'Review high-priority delayed drawings and materials actively blocking site execution.',
      },
      {
        titleAr: '٢. اضغط على بطاقة أي مهندس في القائمة',
        titleEn: '2. Click Any Engineer in the Roster',
        descAr: 'اضغط على اسم المهندس لفلترة اللوحات المكلف بها ومعرفة نسب إنجازه وما هو معطل لديه.',
        descEn: 'Click any engineer card to filter their active assignments, progress, and blocked items.',
      },
      {
        titleAr: '٣. أرسل استعجالاً فورياً أو انسخ تقرير الواتساب',
        titleEn: '3. Send Instant Nudge or Copy WhatsApp Brief',
        descAr: 'استخدم زر «استعجال (Nudge)» لإرسال تنبيه رسمي أو انسخ ملخص الواتساب التنفيذي بضغطة واحدة.',
        descEn: 'Click "Nudge" to dispatch an urgent alert or copy the formatted WhatsApp executive report.',
      },
    ],
    goldenTipAr: 'يركز هذا الرادار فقط على الاستثناءات الحرجة (Management by Exception) لتوفير وقت الإدارة العليا.',
    goldenTipEn: 'Built for Management-by-Exception so leadership resolves critical path blockers in seconds.',
  },
  kpis: {
    screenTitleAr: 'تقييم أداء مهندسي المكتب الفني (Engineer Performance KPIs)',
    screenTitleEn: 'Technical Office Engineer KPIs',
    targetRoleAr: 'مدير المكتب الفني + الإدارة العليا',
    targetRoleEn: 'TO Manager & Executive Leadership',
    roleColor: 'purple',
    purposeAr: 'قياس إنتاجية كل مهندس، نسبة القبول من أول مرة (Code A/B)، والالتزام بمواعيد التسليم.',
    purposeEn: 'Measure engineer productivity, First-Time-Right approval rates, and schedule adherence.',
    steps: [
      {
        titleAr: '١. قارن معدلات الإنجاز والقبول الاستشاري',
        titleEn: '1. Compare Output & Approval Rates',
        descAr: 'راجع عدد اللوحات المنجزة لكل مهندس ونسبة قبولها لدى الاستشاري من المحاولة الأولى.',
        descEn: 'Review completed submittals per engineer and their First-Time-Right consultant approval rate.',
      },
      {
        titleAr: '٢. رصد حالات التأخير وإعادة التقديم (Code C/D)',
        titleEn: '2. Identify Rework & Delays',
        descAr: 'حدد التخصصات التي تعاني من تكرار ملاحظات الاستشاري لمعالجتها فنياً.',
        descEn: 'Spot disciplines experiencing repeated Code C/D revisions for targeted coaching.',
      },
      {
        titleAr: '٣. إعادة موازنة توزيع المهام',
        titleEn: '3. Rebalance Team Workload',
        descAr: 'انتقل لتبويب «توزيع المهام» لنقل الحزم الحرجة إلى المهندسين الأعلى جاهزية.',
        descEn: 'Jump to Task Assignment to redistribute critical packages across available engineers.',
      },
    ],
    nextStepLabelAr: 'الانتقال إلى لوحة توزيع المهام',
    nextStepLabelEn: 'Go to Workload & Assignments',
    nextTabKey: 'assignments',
    goldenTipAr: 'المعيار الأهم لجودة المكتب الفني هو تقليل دورات المراجعة (Code C/D) وليس فقط سرعة الرفع.',
    goldenTipEn: 'True TO quality is measured by minimizing Code C/D rework cycles, not just raw speed.',
  },
};

// Alias mappings for `/to-tasks` and `/to-dashboard` tab names
const NORMALIZE_TAB_KEY: Record<string, string> = {
  drawings: 'drawings',
  e1_drawings: 'drawings',
  materials: 'materials',
  e2_materials: 'materials',
  aquatic: 'aquatic',
  aquatic_safeguards: 'aquatic',
  field_paperwork: 'field_paperwork',
  team_assignment: 'team_assignment',
  assignments: 'team_assignment',
  queue: 'queue',
  manager_queue: 'queue',
  approvals: 'queue',
  transmittals: 'transmittals',
  register: 'register',
  submittals: 'register',
  radar: 'radar',
  coo_radar: 'radar',
  kpis: 'kpis',
};

export interface TOInteractiveStepGuideProps {
  activeTab: string;
  onNavigateTab?: (tabKey: string) => void;
  defaultCollapsed?: boolean;
  pageContext?: 'portal' | 'tasks' | 'dashboard';
}

export const TOInteractiveStepGuide: React.FC<TOInteractiveStepGuideProps> = ({
  activeTab,
  onNavigateTab,
  defaultCollapsed = false,
  pageContext = 'portal',
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [showRoleQuickSummary, setShowRoleQuickSummary] = useState<'none' | 'engineer' | 'manager' | 'coo'>('none');
  const [isFullGuideModalOpen, setIsFullGuideModalOpen] = useState(false);

  if (activeTab === 'role_guide') {
    return null;
  }

  const normalizedKey = NORMALIZE_TAB_KEY[activeTab] || 'drawings';
  const config = TAB_COACH_MAP[normalizedKey] || TAB_COACH_MAP.drawings;

  // Map nextTabKey to the host page's tab naming convention
  const resolveTargetTabKey = (canonicalNext?: string): string | undefined => {
    if (!canonicalNext) return undefined;
    if (pageContext === 'tasks') {
      const mapTasks: Record<string, string> = {
        drawings: 'e1_drawings',
        materials: 'e2_materials',
        aquatic: 'aquatic_safeguards',
        field_paperwork: 'field_paperwork',
        team_assignment: 'team_assignment',
        queue: 'manager_queue',
        transmittals: 'transmittals',
      };
      return mapTasks[canonicalNext];
    }
    if (pageContext === 'dashboard') {
      const mapDash: Record<string, string> = {
        queue: 'approvals',
        register: 'submittals',
        transmittals: 'transmittals',
        team_assignment: 'assignments',
        kpis: 'kpis',
        radar: 'coo_radar',
      };
      return mapDash[canonicalNext];
    }
    return canonicalNext;
  };

  const resolvedNextTab = resolveTargetTabKey(config.nextTabKey);

  const badgeColors = {
    teal: 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30',
    purple: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
    emerald: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    sky: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
    amber: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30',
  }[config.roleColor];

  return (
    <>
      <section
        aria-label={isAr ? 'دليل خطوات العمل في الشاشة الحالية' : 'Current Screen Step-by-Step Guide'}
        className="rounded-2xl bg-gradient-to-r rtl:bg-gradient-to-l from-slate-900 via-slate-900 to-teal-950 text-white border border-teal-500/30 shadow-md overflow-hidden transition-all"
      >
        {/* Top Bar: Always Visible */}
        <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 text-xs font-black shadow-sm">
              <Compass className="w-3.5 h-3.5" />
              <span>{isAr ? 'مرشد العمل التفاعلي (١ ⬅ ٢ ⬅ ٣)' : 'Interactive Work Guide (1 ➔ 2 ➔ 3)'}</span>
            </span>

            <h3 className="text-xs sm:text-sm font-black text-white">
              {isAr ? config.screenTitleAr : config.screenTitleEn}
            </h3>

            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badgeColors}`}>
              {isAr ? `مخصص لـ: ${config.targetRoleAr}` : `For: ${config.targetRoleEn}`}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Role Quick-Cheat-Sheet Pills */}
            <div className="hidden xl:flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 px-2">
                {isAr ? 'ملخص دورك:' : 'Role Cheat-Sheet:'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsCollapsed(false);
                  setShowRoleQuickSummary((prev) => (prev === 'engineer' ? 'none' : 'engineer'));
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                  showRoleQuickSummary === 'engineer'
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Wrench className="w-3 h-3" />
                <span>{isAr ? 'أنا مهندس' : 'Engineer'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsCollapsed(false);
                  setShowRoleQuickSummary((prev) => (prev === 'manager' ? 'none' : 'manager'));
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                  showRoleQuickSummary === 'manager'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3 h-3" />
                <span>{isAr ? 'أنا مدير مكتب فني' : 'TO Manager'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsCollapsed(false);
                  setShowRoleQuickSummary((prev) => (prev === 'coo' ? 'none' : 'coo'));
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                  showRoleQuickSummary === 'coo'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <BarChart2 className="w-3 h-3" />
                <span>{isAr ? 'أنا رئيس عمليات COO' : 'COO'}</span>
              </button>
            </div>

            {/* Open Full Guide Modal Button */}
            <button
              type="button"
              onClick={() => setIsFullGuideModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 border border-amber-400/40 text-amber-300 hover:text-slate-950 text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{isAr ? 'الدليل الشامل للأدوار (كل واحد بيعمل إيه وفين؟)' : 'Full Role & Screen Guide'}</span>
            </button>

            {/* Collapse / Expand Toggle */}
            <button
              type="button"
              onClick={() => setIsCollapsed((prev) => !prev)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
            >
              {isCollapsed ? (
                <>
                  <span>{isAr ? 'عرض الخطوات (١-٢-٣)' : 'Show Steps (1-2-3)'}</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>{isAr ? 'طي الشرح' : 'Hide Steps'}</span>
                  <ChevronUp className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Collapsible Body: 3 Simple Steps + Optional Role Quick Cheat-Sheet */}
        {!isCollapsed && (
          <div className="p-4 space-y-4">
            {/* Optional Role Quick Cheat Sheet if clicked */}
            {showRoleQuickSummary !== 'none' && (
              <div className="p-3.5 rounded-xl bg-slate-950/90 border border-teal-500/40 space-y-2 animate-in fade-in duration-150">
                {showRoleQuickSummary === 'engineer' && (
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs font-black text-teal-300 flex items-center gap-1.5">
                        <Wrench className="w-4 h-4" />
                        <span>
                          {isAr
                            ? 'ملخص عمل مهندس المكتب الفني (Civil / MEP / Arch) في ٣ نقاط:'
                            : 'TO Engineer Daily Workflow in 3 Steps:'}
                        </span>
                      </p>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {isAr
                          ? '١) افتح قسم «مخططات الورشة» أو «اعتمادات الخامات» وفلتر بتخصصك أو «مهامي فقط» ⬅ ٢) حدّث نسبة الإنجاز أو سجّل اختبارات «الضمانات المائية» ⬅ ٣) عند اكتمال اللوحة ١٠٠٪ اضغط «إرسال للمدير» لتدخل طابور الفحص الداخلي.'
                          : '1) Filter Shop Drawings or Materials by your specialty ➔ 2) Update progress or log Aquatic tests ➔ 3) Mark 100% items Ready for Manager Review.'}
                      </p>
                    </div>
                    {onNavigateTab && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => onNavigateTab(resolveTargetTabKey('drawings') || 'drawings')}
                          className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold cursor-pointer"
                        >
                          {isAr ? 'فتح اللوحات E1' : 'Open Drawings'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onNavigateTab(resolveTargetTabKey('materials') || 'materials')}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-bold cursor-pointer border border-teal-500/30"
                        >
                          {isAr ? 'فتح الخامات E2' : 'Open Materials'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {showRoleQuickSummary === 'manager' && (
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs font-black text-purple-300 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" />
                        <span>
                          {isAr
                            ? 'ملخص عمل مدير المكتب الفني (TO Manager) في ٣ نقاط:'
                            : 'TO Manager Daily Workflow in 3 Steps:'}
                        </span>
                      </p>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {isAr
                          ? '١) وزّع الحزم على المهندسين من «توزيع المهام» ⬅ ٢) افحص المخرجات الجاهزة في «طابور فحص المدير» واعتمدها داخلياً أو أعدها بملاحظات ⬅ ٣) أصدر «حافظة تسليم الاستشاري (Transmittal)» وراقب عداد الـ ١٤ يوماً.'
                          : '1) Assign packages to engineers ➔ 2) Approve or return items in Manager Review Queue ➔ 3) Issue Consultant Transmittals & monitor 14d SLA.'}
                      </p>
                    </div>
                    {onNavigateTab && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => onNavigateTab(resolveTargetTabKey('queue') || 'queue')}
                          className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer"
                        >
                          {isAr ? 'طابور فحص المدير' : 'Review Queue'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onNavigateTab(resolveTargetTabKey('transmittals') || 'transmittals')}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-bold cursor-pointer border border-purple-500/30"
                        >
                          {isAr ? 'حوافظ الاستشاري' : 'Transmittals'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {showRoleQuickSummary === 'coo' && (
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs font-black text-emerald-300 flex items-center gap-1.5">
                        <BarChart2 className="w-4 h-4" />
                        <span>
                          {isAr
                            ? 'ملخص عمل رئيس العمليات والإدارة العليا (COO) في ٣ نقاط:'
                            : 'COO Executive Oversight in 3 Steps:'}
                        </span>
                      </p>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {isAr
                          ? '١) افتح «رادار المعوقات التنفيذي» لرصد اللوحات والخامات التي تعطل الصب الخرساني ⬅ ٢) اضغط على أي مهندس في القائمة لمراجعة أحماله وعوائقه ⬅ ٣) أرسل استعجالاً فورياً (Nudge) أو انسخ تقرير الواتساب التنفيذي.'
                          : '1) Open Executive Radar to inspect concrete pouring blockers ➔ 2) Click any engineer to audit their queue ➔ 3) Send 1-click Nudge or copy WhatsApp brief.'}
                      </p>
                    </div>
                    {onNavigateTab && resolvedNextTab !== undefined && (
                      <button
                        type="button"
                        onClick={() => onNavigateTab(resolveTargetTabKey('radar') || 'radar')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer shrink-0"
                      >
                        {isAr ? 'فتح رادار COO' : 'Open COO Radar'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 3 Numbered Step Cards for the Current Screen */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {config.steps.map((step, index) => (
                <div
                  key={index}
                  className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700/80 flex flex-col justify-between gap-2"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-teal-500/20 border border-teal-400/40 text-teal-300 font-mono text-xs font-black flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <h4 className="text-xs font-black text-white">
                        {isAr ? step.titleAr : step.titleEn}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed ps-8">
                      {isAr ? step.descAr : step.descEn}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Bar: Golden Rule + Next Stage Jump Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2 text-xs text-amber-300 font-bold">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{isAr ? `القاعدة الذهبية: ${config.goldenTipAr}` : `Golden Rule: ${config.goldenTipEn}`}</span>
              </div>

              {onNavigateTab && resolvedNextTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab(resolvedNextTab)}
                  className="self-end sm:self-auto px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-black transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm"
                >
                  <span>{isAr ? config.nextStepLabelAr : config.nextStepLabelEn}</span>
                  {isAr ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Full Interactive Role & Workflow Guide Modal */}
      {isFullGuideModalOpen && (
        <TORoleWorkflowGuide
          isModal={true}
          onClose={() => setIsFullGuideModalOpen(false)}
          onSelectWorkspaceTab={(tab: GuideWorkspaceTab) => {
            if (onNavigateTab) {
              const target = resolveTargetTabKey(tab) || tab;
              onNavigateTab(target);
            }
            setIsFullGuideModalOpen(false);
          }}
        />
      )}
    </>
  );
};
