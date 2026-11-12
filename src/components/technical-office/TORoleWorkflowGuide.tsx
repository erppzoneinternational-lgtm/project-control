'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Wrench,
  ShieldCheck,
  FileSpreadsheet,
  HardHat,
  ClipboardCheck,
  Briefcase,
  GanttChartSquare,
  DollarSign,
  Building2,
  BarChart2,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Compass,
  Layers,
  Box,
  FolderKanban,
  FileCheck,
  Timer,
  Droplets,
  Search,
  Sparkles,
  ExternalLink,
  X,
  HelpCircle,
  GitBranch,
  MapPin,
  UserCheck,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export type GuideWorkspaceTab =
  | 'drawings'
  | 'materials'
  | 'aquatic'
  | 'field_paperwork'
  | 'team_assignment'
  | 'queue'
  | 'transmittals'
  | 'register'
  | 'radar'
  | 'role_guide';

export interface RoleLocationLink {
  labelAr: string;
  labelEn: string;
  descriptionAr: string;
  descriptionEn: string;
  badgeAr: string;
  badgeEn: string;
  workspaceTab?: GuideWorkspaceTab;
  href?: string;
}

export interface RoleGuideDefinition {
  id: string;
  titleAr: string;
  titleEn: string;
  badgeAr: string;
  badgeEn: string;
  summaryAr: string;
  summaryEn: string;
  color: 'teal' | 'purple' | 'amber' | 'sky' | 'emerald' | 'rose' | 'indigo' | 'slate';
  icon: React.ElementType;
  whatTheyDoAr: string[];
  whatTheyDoEn: string[];
  locations: RoleLocationLink[];
  receivesFromAr: string;
  receivesFromEn: string;
  deliversToAr: string;
  deliversToEn: string;
  goldenRuleAr: string;
  goldenRuleEn: string;
}

export const PORTAL_ROLE_GUIDES: RoleGuideDefinition[] = [
  {
    id: 'to_engineer',
    titleAr: 'مهندس المكتب الفني',
    titleEn: 'Technical Office Engineer',
    badgeAr: 'الإعداد الهندسي والتنسيق',
    badgeEn: 'Engineering Prep & Coordination',
    summaryAr:
      'المسؤول عن إعداد مخططات الورشة التنفيذية، تجهيز حزم اعتماد الخامات والموردين، توثيق اختبارات الضمانات المائية، وحصر الكميات الهندسي.',
    summaryEn:
      'Responsible for preparing shop drawings, material submittal packages, aquatic test records, and quantity takeoffs.',
    color: 'teal',
    icon: Wrench,
    whatTheyDoAr: [
      'استلام حزم العمل المكلف بها من مدير المكتب الفني ومراجعة أولويات التنفيذ.',
      'إعداد مخططات الورشة واللوحات التنفيذية ومطابقتها بين التخصصات المعمارية والإنشائية والميكانيكية.',
      'تجهيز ملفات اعتماد الخامات والموردين وإرفاق الكتالوجات الفنية وشهادات المنشأ والعينات.',
      'توثيق اختبارات الضمانات المائية واختبارات ضغط المواسير والعزل المائي بالصور والقراءات.',
      'تحويل حالة المخرج الهندسي بعد اكتماله إلى «جاهز لمراجعة المدير» ليدخل طابور الفحص الداخلي.',
    ],
    whatTheyDoEn: [
      'Receive assigned work packages from the TO Manager and review schedule priorities.',
      'Prepare shop drawings and coordinate across architectural, structural, and MEP disciplines.',
      'Assemble material and vendor submittal packages with technical data sheets and certificates.',
      'Record hydrostatic pressure tests and waterproofing safeguards with readings.',
      'Submit completed items to the TO Manager internal review queue.',
    ],
    locations: [
      {
        labelAr: 'مخططات الورشة واللوحات التنفيذية',
        labelEn: 'Shop Drawings Tracker',
        descriptionAr: 'لإضافة وتحديث اللوحات التنفيذية ومتابعة حالات المراجعة والمطابقة',
        descriptionEn: 'Create and update shop drawings and coordination status',
        badgeAr: 'قسم داخل بوابة المكتب الفني',
        badgeEn: 'Technical Office Tab',
        workspaceTab: 'drawings',
      },
      {
        labelAr: 'اعتمادات الخامات والموردين',
        labelEn: 'Material & Vendor Approvals',
        descriptionAr: 'لتجهيز طلبات اعتماد المواد والموردين ومتابعة العينات',
        descriptionEn: 'Prepare material submittals and track vendor approvals',
        badgeAr: 'قسم داخل بوابة المكتب الفني',
        badgeEn: 'Technical Office Tab',
        workspaceTab: 'materials',
      },
      {
        labelAr: 'الضمانات المائية واختبارات الضغط',
        labelEn: 'Aquatic Safeguards & Pressure Tests',
        descriptionAr: 'لتسجيل اختبارات الضغط الهيدروستاتيكي والعزل المائي',
        descriptionEn: 'Log hydrostatic pressure tests and waterproofing safeguards',
        badgeAr: 'قسم داخل بوابة المكتب الفني',
        badgeEn: 'Technical Office Tab',
        workspaceTab: 'aquatic',
      },
      {
        labelAr: 'شاشة مهامي الهندسية والاعتمادات',
        labelEn: 'My Engineering Tasks Screen',
        descriptionAr: 'شاشة مخصصة تعرض فقط المهام المكلف بها المهندس الحالي مع نسب الإنجاز',
        descriptionEn: 'Dedicated personal task board for the logged-in engineer',
        badgeAr: 'صفحة مستقلة في القائمة العلوية',
        badgeEn: 'Standalone Page',
        href: '/to-tasks',
      },
    ],
    receivesFromAr: 'مدير المكتب الفني (تكليف بحزم العمل) ومهندس التخطيط (تواريخ الاستحقاق الحرجة)',
    receivesFromEn: 'TO Manager (work package assignment) & Planning Engineer (target due dates)',
    deliversToAr: 'مدير المكتب الفني (في طابور الفحص والاعتماد الداخلي)',
    deliversToEn: 'TO Manager (Internal Review Queue)',
    goldenRuleAr: 'لا تُرسل أي لوحة أو خامة للاستشاري مباشرة؛ يجب أولاً رفعها لطابور فحص مدير المكتب الفني.',
    goldenRuleEn: 'Never send submittals directly to the consultant without TO Manager internal sign-off.',
  },
  {
    id: 'to_manager',
    titleAr: 'مدير المكتب الفني',
    titleEn: 'Technical Office Manager',
    summaryAr:
      'قائد الحوكمة الهندسية المسؤول عن توزيع المهام على المهندسين، فحص اللوحات والخامات داخلياً قبل خروجها، ومراقبة التزام الاستشاري بمهلة المراجعة.',
    summaryEn:
      'Engineering governance lead responsible for task assignment, internal quality review, and tracking consultant review SLAs.',
    badgeAr: 'الاعتماد الداخلي وتوزيع المهام',
    badgeEn: 'Internal Sign-off & Assignment',
    color: 'purple',
    icon: ShieldCheck,
    whatTheyDoAr: [
      'توزيع حزم المخططات والخامات على مهندسي المكتب الفني وتحديد تواريخ الاستحقاق.',
      'مراجعة المخرجات الهندسية الجاهزة في «طابور فحص واعتماد المدير» للتأكد من مطابقتها للمواصفات.',
      'اعتماد المخرج داخلياً لتحويله إلى حافظة تسليم الاستشاري، أو إعادته للمهندس مع ملاحظات التدقيق.',
      'متابعة السجل الشامل للمخرجات الهندسية ورصد أي تجاوز لمهلة مراجعة الاستشاري (١٤ يوماً).',
    ],
    whatTheyDoEn: [
      'Assign drawing and material packages to TO engineers with target dates.',
      'Inspect completed submittals in the Manager Review Queue against contract specs.',
      'Approve internally for transmittal issuance or return to engineer with comments.',
      'Monitor the Master Deliverables Register and track 14-day consultant SLA breaches.',
    ],
    locations: [
      {
        labelAr: 'توزيع المهام على المهندسين',
        labelEn: 'Engineer Task Assignment',
        descriptionAr: 'لتكليف مهندسي المكتب الفني بحزم العمل وتوزيع الأحمال الهندسية',
        descriptionEn: 'Assign work packages and balance workload across TO engineers',
        badgeAr: 'قسم داخل بوابة المكتب الفني',
        badgeEn: 'Technical Office Tab',
        workspaceTab: 'team_assignment',
      },
      {
        labelAr: 'طابور فحص واعتماد المدير',
        labelEn: 'Manager Review Queue',
        descriptionAr: 'لفحص اللوحات والخامات المنجزة واعتمادها داخلياً أو طلب تعديلها',
        descriptionEn: 'Review and approve or return engineer submittals',
        badgeAr: 'قسم داخل بوابة المكتب الفني',
        badgeEn: 'Technical Office Tab',
        workspaceTab: 'queue',
      },
      {
        labelAr: 'السجل الشامل للمخرجات الهندسية',
        labelEn: 'Master Deliverables Register',
        descriptionAr: 'لمراقبة كافة المخططات والخامات وحوزة الإجراء والمهل الزمنية',
        descriptionEn: 'Full register of all drawings, materials, ball-in-court, and floats',
        badgeAr: 'قسم داخل بوابة المكتب الفني',
        badgeEn: 'Technical Office Tab',
        workspaceTab: 'register',
      },
      {
        labelAr: 'مركز قيادة مدير المكتب الفني',
        labelEn: 'TO Manager Command Hub',
        descriptionAr: 'لوحة قيادة تفصيلية لمدير المكتب الفني لمتابعة أداء الفريق والمشاريع',
        descriptionEn: 'Dedicated dashboard for TO Manager oversight',
        badgeAr: 'صفحة مستقلة في القائمة العلوية',
        badgeEn: 'Standalone Page',
        href: '/to-dashboard',
      },
    ],
    receivesFromAr: 'مهندسي المكتب الفني (المخططات والخامات الجاهزة للفحص) ومدير المشروع (أولويات الموقع)',
    receivesFromEn: 'TO Engineers (items ready for review) & Project Manager (site priorities)',
    deliversToAr: 'مراقب الوثائق (لإصدار حافظة التسليم الرسمية للاستشاري)',
    deliversToEn: 'Document Controller (to issue official consultant transmittal)',
    goldenRuleAr: 'بوابة الجودة الداخلية: اعتمادك الداخلي هو الشرط الإلزامي لفتح إصدار حافظة التسليم للاستشاري.',
    goldenRuleEn: 'Your internal approval unlocks official transmittal generation to the consultant.',
  },
  {
    id: 'doc_controller',
    titleAr: 'مراقب الوثائق وأرشيف الاستشاري',
    titleEn: 'Document Controller',
    badgeAr: 'حوافظ التسليم والأرشفة',
    badgeEn: 'Transmittals & Archiving',
    summaryAr:
      'المسؤول عن إصدار حوافظ التسليم الرسمية للاستشاري، ضبط عداد المهلة التعاقدية (١٤ يوماً)، وتسجيل أكواد رد الاستشاري وأرشفة النسخ المختومة.',
    summaryEn:
      'Responsible for issuing official consultant transmittals, tracking the 14-day review clock, and logging consultant response codes.',
    color: 'indigo',
    icon: Timer,
    whatTheyDoAr: [
      'استلام المخرجات المعتمدة داخلياً من مدير المكتب الفني وتجميعها في حافظة تسليم رسمية برقم مرجعي.',
      'إصدار حافظة التسليم للاستشاري المشرف لتفعيل عداد المراجعة التعاقدي (١٤ يوماً).',
      'تسجيل قرار الاستشاري فور وروده (كود أ: معتمد، كود ب: معتمد بملاحظات، كود ج: يعاد التقديم، كود د: مرفوض).',
      'حفظ وأرشفة المخططات والاعتمادات المختومة وإتاحتها لفريق التنفيذ بالموقع.',
    ],
    whatTheyDoEn: [
      'Bundle internally approved submittals into numbered official transmittals.',
      'Dispatch transmittals to the consultant and start the 14-day contractual clock.',
      'Record official consultant approval codes (A, B, C, D) upon return.',
      'Archive stamped drawings and material approvals for site execution.',
    ],
    locations: [
      {
        labelAr: 'حوافظ التسليم وأرشيف الاستشاري',
        labelEn: 'Consultant Transmittals & Archive',
        descriptionAr: 'لإنشاء حوافظ التسليم ومتابعة مهلة الـ ١٤ يوماً وتسجيل رد الاستشاري',
        descriptionEn: 'Issue transmittals, track 14-day SLA, and record consultant codes',
        badgeAr: 'قسم داخل بوابة المكتب الفني',
        badgeEn: 'Technical Office Tab',
        workspaceTab: 'transmittals',
      },
      {
        labelAr: 'سجل المخططات والاستفسارات الشامل',
        labelEn: 'Deliverables & RFIs Register',
        descriptionAr: 'للأرشفة المرجعية ومراجعة سجل الإصدارات والمراسلات الفنية',
        descriptionEn: 'Reference archive for revisions and technical submittals',
        badgeAr: 'صفحة مستقلة في القائمة العلوية',
        badgeEn: 'Standalone Page',
        href: '/deliverables',
      },
    ],
    receivesFromAr: 'مدير المكتب الفني (المخرجات المعتمدة داخلياً) والاستشاري المشرف (الردود المختومة)',
    receivesFromEn: 'TO Manager (internally approved items) & Consultant (stamped responses)',
    deliversToAr: 'مهندس التنفيذ بالموقع ومهندس الجودة (اللوحات المعتمدة) ومدير العقود (إثباتات التأخير)',
    deliversToEn: 'Site & QC Engineers (approved packages) & Contracts Manager (delay records)',
    goldenRuleAr: 'كل يوم تأخير من الاستشاري بعد مهلة الـ ١٤ يوماً يُسجل تلقائياً كمستند مطالبة تعاقدية.',
    goldenRuleEn: 'Every day beyond the 14-day consultant window is automatically logged as claimable delay evidence.',
  },
  {
    id: 'site_engineer',
    titleAr: 'مهندس التنفيذ بالموقع',
    titleEn: 'Site Execution Engineer',
    badgeAr: 'التنفيذ الميداني والنماذج',
    badgeEn: 'Site Execution & Field Forms',
    summaryAr:
      'المسؤول عن تنفيذ الأعمال ميدانياً طبقاً للوحات والخامات المعتمدة، تحرير طلبات الفحص والاستلام الميداني، وتجهيز مسوغات صرف المستخلص.',
    summaryEn:
      'Executes site works per approved drawings/materials, raises site inspection requests, and prepares field paperwork.',
    color: 'emerald',
    icon: HardHat,
    whatTheyDoAr: [
      'التأكد من وجود لوحة ورشة معتمدة وخامة معتمدة قبل البدء في تنفيذ أي بند بالموقع.',
      'تحرير النماذج الميدانية وطلبات فحص واستلام الأعمال بعد إتمام التنفيذ.',
      'إجراء اختبارات التشغيل الميدانية واختبارات الضغط والعزل بالتنسيق مع مهندس الجودة.',
      'ربط الأعمال الميدانية المستلمة ببوابة صرف المستخلصات المالية لإجازة الفوترة.',
    ],
    whatTheyDoEn: [
      'Verify approved shop drawings and materials before starting site execution.',
      'Submit field inspection requests (IR/MIR) upon work completion.',
      'Conduct field pressure and waterproofing tests with QC.',
      'Link approved site inspections to the IPC payment gate.',
    ],
    locations: [
      {
        labelAr: 'النماذج الميدانية وبوابة المستخلصات',
        labelEn: 'Field Paperwork & Payment Gate',
        descriptionAr: 'لإدارة طلبات الاستلام الميداني والتحقق من اكتمال شروط صرف المستخلص',
        descriptionEn: 'Manage site inspection forms and verify IPC payment gate readiness',
        badgeAr: 'قسم داخل بوابة المكتب الفني',
        badgeEn: 'Technical Office Tab',
        workspaceTab: 'field_paperwork',
      },
      {
        labelAr: 'الضمانات المائية واختبارات الضغط',
        labelEn: 'Aquatic Safeguards & Pressure Tests',
        descriptionAr: 'لتسجيل نتائج اختبارات المواسير والخزانات والعزل المائي في الموقع',
        descriptionEn: 'Record field hydro-test and waterproofing results',
        badgeAr: 'قسم داخل بوابة المكتب الفني',
        badgeEn: 'Technical Office Tab',
        workspaceTab: 'aquatic',
      },
    ],
    receivesFromAr: 'المكتب الفني ومراقب الوثائق (اللوحات والخامات المعتمدة بكود أ أو ب)',
    receivesFromEn: 'Technical Office & Doc Control (Code A/B approved drawings and materials)',
    deliversToAr: 'مهندس ضبط الجودة والاستشاري المشرف (لفحص واستلام الأعمال ميدانياً)',
    deliversToEn: 'QC Engineer & Supervision Consultant (for field inspection sign-off)',
    goldenRuleAr: 'ممنوع تنفيذ أي بند في الموقع بلوحة غير معتمدة أو خامة لم تحصل على اعتماد الاستشاري.',
    goldenRuleEn: 'Never execute site work using unapproved drawings or unapproved materials.',
  },
  {
    id: 'qc_engineer',
    titleAr: 'مهندس ضبط الجودة والاختبارات',
    titleEn: 'Quality Control (QC) Engineer',
    badgeAr: 'فحص الجودة والضمانات',
    badgeEn: 'Quality Inspection & Safeguards',
    summaryAr:
      'حارس الجودة الميدانية المسؤول عن فحص التوريدات، الإشراف على اختبارات الضغط والعزل المائي، واعتماد طلبات استلام الأعمال قبل رفعها للمستخلص.',
    summaryEn:
      'Field quality guardian overseeing material inspections, hydrostatic pressure tests, and work inspection approvals.',
    color: 'sky',
    icon: ClipboardCheck,
    whatTheyDoAr: [
      'فحص الخامات الموردة للموقع ومطابقتها مع شهادة اعتماد الخامة الصادرة من المكتب الفني.',
      'الإشراف المباشر على اختبارات الضمانات المائية واختبارات ضغط الشبكات وتوثيق نجاحها.',
      'فحص الأعمال المنفذة ميدانياً واعتماد نماذج الاستلام الميداني قبل تسليمها للاستشاري.',
      'تأكيد صلاحية البند فنياً للدخول في بوابة صرف المستخلص المالي.',
    ],
    whatTheyDoEn: [
      'Inspect delivered materials on site against approved material submittals.',
      'Supervise hydrostatic pressure tests and waterproofing safeguards.',
      'Verify executed site works and sign off on inspection requests.',
      'Clear inspected items for the financial IPC certificate gate.',
    ],
    locations: [
      {
        labelAr: 'الضمانات المائية واختبارات الضغط',
        labelEn: 'Aquatic Safeguards & Pressure Tests',
        descriptionAr: 'لاعتماد قراءات اختبارات الضغط والعزل المائي وإصدار شهادات الضمان',
        descriptionEn: 'Verify and approve pressure test readings and aquatic safeguards',
        badgeAr: 'قسم داخل بوابة المكتب الفني',
        badgeEn: 'Technical Office Tab',
        workspaceTab: 'aquatic',
      },
      {
        labelAr: 'النماذج الميدانية وبوابة المستخلصات',
        labelEn: 'Field Paperwork & Payment Gate',
        descriptionAr: 'لمراجعة واعتماد محاضر الفحص والاستلام الميداني وفتح بوابة الصرف',
        descriptionEn: 'Approve field inspection records and unlock IPC billing gate',
        badgeAr: 'قسم داخل بوابة المكتب الفني',
        badgeEn: 'Technical Office Tab',
        workspaceTab: 'field_paperwork',
      },
    ],
    receivesFromAr: 'مهندس التنفيذ بالموقع (طلبات فحص الأعمال والخامات واختبارات التشغيل)',
    receivesFromEn: 'Site Engineer (work and material inspection requests)',
    deliversToAr: 'الاستشاري المشرف (للتوقيع النهائي) ومدير العقود (لإجازة صرف المستخلص)',
    deliversToEn: 'Supervision Consultant (final sign-off) & Contracts Manager (IPC release)',
    goldenRuleAr: 'لا تُفتح بوابة صرف المستخلص المالي لأي بند إلا بعد نجاح الفحص الميداني واختبارات الضمانات.',
    goldenRuleEn: 'IPC billing gate remains locked until field inspection and safeguard tests pass.',
  },
  {
    id: 'project_manager',
    titleAr: 'مدير المشروع',
    titleEn: 'Project Manager',
    badgeAr: 'قيادة المشروع وتسكين الفريق',
    badgeEn: 'Project Command & Staffing',
    summaryAr:
      'المسؤول الأول عن تأسيس المشروع، تسكين المهندسين والشركاء، متابعة تكامل المكتب الفني مع الموقع والجدول الزمني، واعتماد المستخلصات.',
    summaryEn:
      'Overall project leader responsible for project setup, team staffing, cross-department coordination, and IPC sign-off.',
    color: 'amber',
    icon: Briefcase,
    whatTheyDoAr: [
      'مراجعة وتأكيد بيانات المشروع التعاقدية والمالية والبرنامج الزمني عند إعداد المشروع.',
      'تسكين فريق العمل (مدير المكتب الفني، المهندسين، الاستشاري، وممثل العميل) في دليل الشركاء.',
      'متابعة مؤشرات الإنجاز الهندسي والميداني وحل أي عوائق أو تعارضات فنية حرجة.',
      'مراجعة بوابة المستخلصات والتأكد من استيفاء كافة المتطلبات الهندسية والمالية.',
    ],
    whatTheyDoEn: [
      'Configure project contractual, financial, and schedule parameters during setup.',
      'Assign project team members and external stakeholders in the directory.',
      'Monitor overall engineering and site KPIs and resolve critical blockers.',
      'Review IPC payment gates and commercial readiness.',
    ],
    locations: [
      {
        labelAr: 'بوابة إعداد المشاريع',
        labelEn: 'Project Setup Portal',
        descriptionAr: 'لاستكمال خطوات تأسيس المشروع وتجهيز البيانات التعاقدية والهيكلية',
        descriptionEn: 'Complete project setup steps and governance configuration',
        badgeAr: 'صفحة مستقلة في القائمة العلوية',
        badgeEn: 'Standalone Page',
        href: '/project-setup',
      },
      {
        labelAr: 'دليل الشركاء وأصحاب المصلحة',
        labelEn: 'Stakeholders Directory',
        descriptionAr: 'لتعريف وتسكين المهندسين والاستشاريين والعملاء وربطهم بالمشاريع',
        descriptionEn: 'Manage internal engineers, consultants, and client representatives',
        badgeAr: 'صفحة مستقلة في القائمة العلوية',
        badgeEn: 'Standalone Page',
        href: '/stakeholders',
      },
      {
        labelAr: 'لوحة قيادة المشاريع',
        labelEn: 'Projects Dashboard',
        descriptionAr: 'لمتابعة الأداء الشامل للمشاريع ونسب الإنجاز والموقف المالي',
        descriptionEn: 'Executive overview of project health, schedule, and financials',
        badgeAr: 'صفحة مستقلة في القائمة العلوية',
        badgeEn: 'Standalone Page',
        href: '/projects/dashboard',
      },
    ],
    receivesFromAr: 'الإدارة التنفيذية والعميل (العقد وأمر المباشرة) ومديري المكتب الفني والتخطيط (التقارير)',
    receivesFromEn: 'Executive Management & Client (Contract) & Department Leads (Status reports)',
    deliversToAr: 'فريق المشروع بالكامل (التوجيهات والاعتمادات) والإدارة العليا (تقارير الأداء)',
    deliversToEn: 'Project Team (directives) & Executive Board (performance reports)',
    goldenRuleAr: 'تسكين الفريق الصحيح في بداية المشروع يضمن تدفق المهام تلقائياً بين المكتب الفني والموقع.',
    goldenRuleEn: 'Proper team staffing during project setup ensures seamless automated workflow routing.',
  },
  {
    id: 'planning_engineer',
    titleAr: 'مهندس التخطيط والجدول الزمني',
    titleEn: 'Planning & Schedule Engineer',
    badgeAr: 'البرنامج الزمني والمسار الحرج',
    badgeEn: 'CPM Schedule & Critical Path',
    summaryAr:
      'المسؤول عن ربط مخرجات المكتب الفني بأنشطة البرنامج الزمني، حساب السماحية الزمنية، وتنبيه الفريق بأي تأخير يؤثر على المسار الحرج.',
    summaryEn:
      'Links technical office deliverables to baseline schedule activities, tracks float, and flags critical path delays.',
    color: 'teal',
    icon: GanttChartSquare,
    whatTheyDoAr: [
      'تحديث أنشطة البرنامج الزمني وربط كل لوحة أو خامة بنشاط التنفيذ المقابل لها.',
      'مراقبة السماحية الزمنية للمخرجات الهندسية وتحديد العناصر الواقعة على المسار الحرج.',
      'تحليل أثر تأخر اعتمادات الاستشاري على تاريخ نهو المشروع التعاقدي.',
      'إصدار تقارير الأداء الزمني وتقارير نبض الجدول الزمني للإدارة.',
    ],
    whatTheyDoEn: [
      'Link shop drawings and material submittals to baseline schedule activities.',
      'Monitor total float and highlight critical/near-critical submittals.',
      'Analyze schedule impact of consultant review delays.',
      'Publish schedule pulse and P6 performance reports.',
    ],
    locations: [
      {
        labelAr: 'نبض البرنامج الزمني',
        labelEn: 'Schedule Pulse (P6)',
        descriptionAr: 'لمتابعة مؤشرات الجدول الزمني، المسار الحرج، ونسب الإنجاز المخططة والفعلية',
        descriptionEn: 'Monitor CPM schedule health, critical path, and planned vs actual progress',
        badgeAr: 'صفحة مستقلة في القائمة العلوية',
        badgeEn: 'Standalone Page',
        href: '/schedule-pulse',
      },
      {
        labelAr: 'السجل الشامل للمخرجات الهندسية',
        labelEn: 'Master Deliverables Register',
        descriptionAr: 'لمراجعة عمود السماحية الزمنية وارتباط المخرجات بأنشطة الجدول الزمني',
        descriptionEn: 'Inspect deliverable float days and linked schedule activities',
        badgeAr: 'قسم داخل بوابة المكتب الفني',
        badgeEn: 'Technical Office Tab',
        workspaceTab: 'register',
      },
      {
        labelAr: 'تقارير الجدول والتخطيط',
        labelEn: 'Schedule & Planning Reports',
        descriptionAr: 'لاستعراض وتصدير تقارير التخطيط الزمني التفصيلية',
        descriptionEn: 'View and export detailed schedule reports',
        badgeAr: 'صفحة مستقلة في القائمة العلوية',
        badgeEn: 'Standalone Page',
        href: '/reports?category=schedule',
      },
    ],
    receivesFromAr: 'المكتب الفني (تواريخ تقديم واعتماد اللوحات والخامات) والموقع (نسب الإنجاز الفعلي)',
    receivesFromEn: 'Technical Office (submittal dates) & Site Team (actual physical progress)',
    deliversToAr: 'مدير المشروع ومدير المكتب الفني (أولويات المسار الحرج) ومدير العقود (تحليل التأخير)',
    deliversToEn: 'Project & TO Managers (critical path priorities) & Contracts Manager (delay analysis)',
    goldenRuleAr: 'أي تأخير في اعتماد لوحة أو خامة على المسار الحرج يخصم مباشرة من السماحية الكلية للمشروع.',
    goldenRuleEn: 'Any delay on a critical submittal directly erodes project total float.',
  },
  {
    id: 'contracts_cost',
    titleAr: 'مدير العقود ومراقبة التكاليف',
    titleEn: 'Contracts & Cost Control Manager',
    badgeAr: 'العقود والمستخلصات والمطالبات',
    badgeEn: 'Contracts, IPCs & Claims',
    summaryAr:
      'المسؤول عن إدارة العقود والدفعات المقدمة والاستقطاعات، التحقق من بوابة صرف المستخلصات، وتوثيق المطالبات وأوامر التغيير.',
    summaryEn:
      'Manages contract terms, advance payments, retentions, IPC payment gate verification, and contractual claims/VOs.',
    color: 'rose',
    icon: DollarSign,
    whatTheyDoAr: [
      'مراجعة الشروط المالية للعقود (قيمة العقد، الدفعة المقدمة، نسبة الاستقطاع، وخطابات الضمان).',
      'التحقق من استيفاء شروط بوابة المستخلص المالي (لوحة معتمدة + خامة معتمدة + محضر استلام ميداني).',
      'إعداد المطالبات التعاقدية وأوامر التغيير بالاستناد إلى سجل تجاوزات مهلة الاستشاري (١٤ يوماً).',
      'مراقبة التكاليف الفعلية ومؤشرات القيمة المكتسبة والتدفقات النقدية للمشروع.',
    ],
    whatTheyDoEn: [
      'Manage contract commercial terms (contract value, advance payment, retention, bonds).',
      'Verify the 3-way IPC payment gate (approved drawing + approved material + site IR).',
      'Prepare contractual claims and variation orders backed by SLA breach logs.',
      'Track project cost control and Earned Value Management (EVM) metrics.',
    ],
    locations: [
      {
        labelAr: 'شاشة العقود والبنود المالية',
        labelEn: 'Contracts & Commercial Terms',
        descriptionAr: 'لمتابعة قيم العقود، الدفعات المقدمة، نسب الاستقطاع، والشروط التعاقدية',
        descriptionEn: 'Track contract values, advance payments, retentions, and terms',
        badgeAr: 'صفحة مستقلة في القائمة العلوية',
        badgeEn: 'Standalone Page',
        href: '/contracts',
      },
      {
        labelAr: 'النماذج الميدانية وبوابة المستخلصات',
        labelEn: 'Field Paperwork & Payment Gate',
        descriptionAr: 'للتحقق من اكتمال مسوغات الصرف الهندسية والميدانية قبل اعتماد المستخلص',
        descriptionEn: 'Verify engineering and field prerequisites before IPC certification',
        badgeAr: 'قسم داخل بوابة المكتب الفني',
        badgeEn: 'Technical Office Tab',
        workspaceTab: 'field_paperwork',
      },
      {
        labelAr: 'المطالبات وأوامر التغيير',
        labelEn: 'Claims & Variation Orders',
        descriptionAr: 'لتوثيق ومتابعة المطالبات الزمنية والمالية وأوامر التغيير',
        descriptionEn: 'Document and track time/cost claims and variation orders',
        badgeAr: 'صفحة مستقلة في القائمة العلوية',
        badgeEn: 'Standalone Page',
        href: '/contracts/claims',
      },
      {
        labelAr: 'مراقبة التكاليف والقيمة المكتسبة',
        labelEn: 'Cost Control & EVM',
        descriptionAr: 'لمتابعة الميزانيات، التكاليف الفعلية، ومؤشرات الأداء المالي',
        descriptionEn: 'Monitor budgets, actual costs, and CPI/SPI indicators',
        badgeAr: 'صفحة مستقلة في القائمة العلوية',
        badgeEn: 'Standalone Page',
        href: '/cost-control',
      },
    ],
    receivesFromAr: 'المكتب الفني والجودة (مسوغات الاعتماد والاستلام) ومراقب الوثائق (سجل تأخير الاستشاري)',
    receivesFromEn: 'TO & QC Teams (approval certificates) & Doc Control (consultant SLA breach logs)',
    deliversToAr: 'الإدارة المالية والعميل (المستخلصات المعتمدة والمطالبات الرسمية)',
    deliversToEn: 'Finance Department & Client (certified IPCs and official claims)',
    goldenRuleAr: 'لا يُصرف أي مستخلص مالي لبند إلا بعد اكتمال مثلث الاعتماد: مخطط معتمد + خامة معتمدة + استلام ميداني.',
    goldenRuleEn: 'No IPC payment is certified without an approved drawing, approved material, and approved site IR.',
  },
  {
    id: 'consultant_client',
    titleAr: 'الاستشاري المشرف وممثل المالك',
    titleEn: 'Supervision Consultant & Client Rep',
    badgeAr: 'الاعتماد الرسمي والاستلام',
    badgeEn: 'Official Approval & Handover',
    summaryAr:
      'الجهة المشرفة المسؤولة عن مراجعة حوافظ المخططات والخامات وإصدار قرار الاعتماد الرسمي، وفحص واستلام الأعمال المنفذة بالموقع.',
    summaryEn:
      'Supervising authority reviewing submittals within the 14-day SLA, issuing approval codes, and signing off site inspections.',
    color: 'slate',
    icon: Building2,
    whatTheyDoAr: [
      'استلام حوافظ التسليم الرسمية للمخططات والخامات ومراجعتها خلال المهلة التعاقدية (١٤ يوماً).',
      'إصدار قرار المراجعة الرسمي: (أ) معتمد دون ملاحظات، (ب) معتمد بملاحظات، (ج) يعاد التقديم، (د) مرفوض.',
      'حضور اختبارات الضمانات المائية وفحص الأعمال المنفذة بالموقع والتوقيع على محاضر الاستلام.',
      'اعتماد شهادات الدفع والمستخلصات الجارية بعد التحقق من الاستلام الميداني.',
    ],
    whatTheyDoEn: [
      'Review official transmittals within the 14-day contractual window.',
      'Issue approval codes: (A) Approved, (B) Approved as Noted, (C) Revise & Resubmit, (D) Rejected.',
      'Witness field pressure tests and sign off on site inspection requests.',
      'Certify interim payment certificates (IPCs).',
    ],
    locations: [
      {
        labelAr: 'حوافظ التسليم وأرشيف الاستشاري',
        labelEn: 'Consultant Transmittals & Archive',
        descriptionAr: 'لمتابعة الحوافظ المرسلة للاستشاري وتسجيل أكواد القرار والملاحظات الفنية',
        descriptionEn: 'Track submitted transmittals and record consultant approval codes',
        badgeAr: 'قسم داخل بوابة المكتب الفني',
        badgeEn: 'Technical Office Tab',
        workspaceTab: 'transmittals',
      },
      {
        labelAr: 'شاشة العملاء والجهات المالكة',
        labelEn: 'Clients & Owners Directory',
        descriptionAr: 'لإدارة بيانات الجهات المالكة وممثلي العملاء والاستشاريين',
        descriptionEn: 'Manage client organizations and representative contacts',
        badgeAr: 'صفحة مستقلة في القائمة العلوية',
        badgeEn: 'Standalone Page',
        href: '/clients',
      },
    ],
    receivesFromAr: 'مراقب الوثائق ومدير المكتب الفني (حوافظ التسليم) ومهندس الجودة (طلبات الفحص الميداني)',
    receivesFromEn: 'Doc Controller & TO Manager (transmittals) & QC Engineer (site inspection requests)',
    deliversToAr: 'مراقب الوثائق ومدير المشروع (الردود الرسمية المختومة ومحاضر الاستلام)',
    deliversToEn: 'Doc Controller & Project Manager (stamped responses and signed IRs)',
    goldenRuleAr: 'الرد بكود (أ) أو (ب) يفتح المجال للتنفيذ الميداني فوراً، بينما كود (ج) أو (د) يعيد المعاملة للمهندس للتعديل.',
    goldenRuleEn: 'Code A or B unlocks site execution; Code C or D returns the item to the engineer for revision.',
  },
  {
    id: 'coo_executive',
    titleAr: 'مدير العمليات والإدارة التنفيذية',
    titleEn: 'COO & Executive Leadership',
    badgeAr: 'الرقابة الاستراتيجية ورادار المعوقات',
    badgeEn: 'Executive Oversight & Radar',
    summaryAr:
      'قيادة العمليات العليا التي تراقب صحة جميع المشاريع، ترصد الاختناقات الهندسية وتجاوزات المهل التعاقدية، وتتخذ قرارات التصعيد الفوري.',
    summaryEn:
      'Executive leadership monitoring portfolio health, technical bottlenecks, SLA breaches, and strategic escalations.',
    color: 'emerald',
    icon: BarChart2,
    whatTheyDoAr: [
      'متابعة رادار المعوقات التنفيذي لرصد المخرجات المعطلة أو المتأخرة عبر كافة المشاريع.',
      'مراقبة نسب الاعتماد النهائي للمخططات والخامات وأداء فرق المكتب الفني.',
      'رصد المشاريع التي تشهد تجاوزات متكررة في مهلة مراجعة الاستشاري لحماية حقوق الشركة التعاقدية.',
      'استعراض التقارير الاستراتيجية ولوحات القيادة المركزية لاتخاذ القرارات التصحيحية.',
    ],
    whatTheyDoEn: [
      'Monitor the Executive Blockers Radar across all active projects.',
      'Track portfolio-wide approval rates and technical office throughput.',
      'Identify projects with recurring consultant SLA breaches to protect commercial rights.',
      'Review central dashboards and strategic reports for executive action.',
    ],
    locations: [
      {
        labelAr: 'رادار المعوقات التنفيذي',
        labelEn: 'Executive Blockers Radar',
        descriptionAr: 'لرصد الاختناقات الفنية، التجاوزات الزمنية، والمشاريع الحرجة في شاشة واحدة',
        descriptionEn: 'Monitor technical bottlenecks, SLA breaches, and critical projects',
        badgeAr: 'قسم داخل بوابة المكتب الفني',
        badgeEn: 'Technical Office Tab',
        workspaceTab: 'radar',
      },
      {
        labelAr: 'اللوحة المركزية للمنظومة',
        labelEn: 'Central Executive Dashboard',
        descriptionAr: 'نظرة شاملة على مؤشرات المحفظة، المشاريع النشطة، والتنبيهات السيادية',
        descriptionEn: 'Portfolio-wide KPIs, active projects, and executive alerts',
        badgeAr: 'صفحة مستقلة في القائمة العلوية',
        badgeEn: 'Standalone Page',
        href: '/dashboard',
      },
      {
        labelAr: 'مستودع التقارير الشامل',
        labelEn: 'Master Reports Repository',
        descriptionAr: 'للوصول إلى أكثر من ١٠٦ تقرير تخصصي في المحفظة والجدول الزمني والتكاليف',
        descriptionEn: 'Access 106+ specialized portfolio, schedule, and cost reports',
        badgeAr: 'صفحة مستقلة في القائمة العلوية',
        badgeEn: 'Standalone Page',
        href: '/reports',
      },
    ],
    receivesFromAr: 'مؤشرات المنظومة الحية ومديري المشاريع والمكتب الفني والعقود',
    receivesFromEn: 'Live portal telemetry, Project Managers, TO Managers, and Contracts Leads',
    deliversToAr: 'مديري المشاريع والإدارات (قرارات التصعيد والتوجيه الاستراتيجي)',
    deliversToEn: 'Project & Department Managers (executive directives and escalations)',
    goldenRuleAr: 'التركيز على الاستثناءات والمعوقات الحرجة في رادار الإدارة يمنع تعطل المشاريع قبل وقوعه.',
    goldenRuleEn: 'Focusing on critical exceptions in the Executive Radar prevents project delays before they cascade.',
  },
];

interface WorkflowStageMapItem {
  step: number;
  titleAr: string;
  titleEn: string;
  whoAr: string;
  whoEn: string;
  whereAr: string;
  whereEn: string;
  whatHappensAr: string;
  whatHappensEn: string;
  outputAr: string;
  outputEn: string;
  workspaceTab?: GuideWorkspaceTab;
  href?: string;
}

const END_TO_END_WORKFLOW_MAP: WorkflowStageMapItem[] = [
  {
    step: 1,
    titleAr: 'تأسيس المشروع وتسكين الفريق والشركاء',
    titleEn: 'Project Setup & Team Staffing',
    whoAr: 'مدير المشروع + إدارة النظام',
    whoEn: 'Project Manager + System Admin',
    whereAr: 'بوابة إعداد المشاريع + دليل الشركاء',
    whereEn: 'Project Setup Portal + Stakeholders Directory',
    whatHappensAr:
      'إدخال بيانات العقد والدفعة المقدمة والاستقطاع، وتسكين مدير المكتب الفني والمهندسين والاستشاري وممثل العميل على المشروع.',
    whatHappensEn:
      'Configure contract terms and assign the TO Manager, engineers, consultant, and client rep to the project.',
    outputAr: 'مشروع جاهز وفريق عمل مسكّن بصلاحيات واضحة',
    outputEn: 'Configured project with assigned team and roles',
    href: '/project-setup',
  },
  {
    step: 2,
    titleAr: 'توزيع حزم العمل وإعداد اللوحات والخامات',
    titleEn: 'Task Assignment & Engineering Preparation',
    whoAr: 'مدير المكتب الفني ⬅ مهندس المكتب الفني',
    whoEn: 'TO Manager ➔ TO Engineer',
    whereAr: 'توزيع المهام + مخططات الورشة + اعتمادات الخامات',
    whereEn: 'Task Assignment + Shop Drawings + Material Approvals',
    whatHappensAr:
      'يكلف مدير المكتب الفني كل مهندس بحزم اللوحات والخامات؛ يقوم المهندس بإعداد المخططات التنفيذية وتجهيز ملفات المواد ورفعها للمراجعة.',
    whatHappensEn:
      'TO Manager assigns packages; TO Engineer prepares shop drawings and material submittals.',
    outputAr: 'مخططات ورشة وطلبات خامات جاهزة للفحص الداخلي',
    outputEn: 'Drawings and materials ready for internal review',
    workspaceTab: 'drawings',
  },
  {
    step: 3,
    titleAr: 'الفحص الفني الداخلي واعتماد مدير المكتب الفني',
    titleEn: 'Internal Technical Review & Manager Sign-off',
    whoAr: 'مدير المكتب الفني',
    whoEn: 'Technical Office Manager',
    whereAr: 'طابور فحص واعتماد المدير',
    whereEn: 'Manager Review Queue',
    whatHappensAr:
      'يفحص مدير المكتب الفني اللوحات والخامات المنجزة؛ إما يعتمدها داخلياً لتخرج للاستشاري أو يعيدها للمهندس مع ملاحظات التدقيق.',
    whatHappensEn:
      'TO Manager inspects completed items and either approves internally or returns with comments.',
    outputAr: 'مخرجات معتمدة داخلياً وجاهزة لإصدار حافظة التسليم',
    outputEn: 'Internally approved submittals ready for transmittal',
    workspaceTab: 'queue',
  },
  {
    step: 4,
    titleAr: 'إصدار حافظة التسليم ومراجعة الاستشاري (١٤ يوماً)',
    titleEn: 'Transmittal Issuance & 14-Day Consultant Review',
    whoAr: 'مراقب الوثائق ⬅ الاستشاري المشرف',
    whoEn: 'Document Controller ➔ Supervision Consultant',
    whereAr: 'حوافظ التسليم وأرشيف الاستشاري',
    whereEn: 'Consultant Transmittals & Archive',
    whatHappensAr:
      'يُصدر مراقب الوثائق حافظة تسليم رسمية للاستشاري ويبدأ عداد مهلة الـ ١٤ يوماً، ثم يُسجل قرار الاستشاري (أ، ب، ج، د).',
    whatHappensEn:
      'Doc Controller issues official transmittal, starts 14-day clock, and logs consultant decision code.',
    outputAr: 'لوحات وخامات معتمدة رسمياً للتنفيذ (كود أ أو ب)',
    outputEn: 'Code A/B approved drawings and materials for site execution',
    workspaceTab: 'transmittals',
  },
  {
    step: 5,
    titleAr: 'التنفيذ الميداني والضمانات المائية وفحص الجودة',
    titleEn: 'Site Execution, Safeguards & QC Inspection',
    whoAr: 'مهندس التنفيذ بالموقع + مهندس ضبط الجودة',
    whoEn: 'Site Engineer + QC Engineer',
    whereAr: 'الضمانات المائية واختبارات الضغط + النماذج الميدانية',
    whereEn: 'Aquatic Safeguards + Field Paperwork Hub',
    whatHappensAr:
      'ينفذ مهندس الموقع الأعمال باللوحات والخامات المعتمدة، ويجري مهندس الجودة اختبارات الضغط والعزل المائي ويعتمد طلبات الاستلام الميداني.',
    whatHappensEn:
      'Site engineer executes approved works; QC verifies pressure tests and signs off site inspection requests.',
    outputAr: 'محاضر فحص واستلام ميداني وشهادات اختبار معتمدة',
    outputEn: 'Approved site inspection requests and pressure test certificates',
    workspaceTab: 'aquatic',
  },
  {
    step: 6,
    titleAr: 'بوابة صرف المستخلص المالي والرقابة التنفيذية',
    titleEn: 'IPC Financial Certificate Gate & Executive Radar',
    whoAr: 'مدير العقود والتكاليف + مدير المشروع + مدير العمليات',
    whoEn: 'Contracts Manager + Project Manager + COO',
    whereAr: 'بوابة المستخلصات + شاشة العقود + رادار المعوقات',
    whereEn: 'Payment Gate + Contracts + Executive Radar',
    whatHappensAr:
      'يتحقق النظام من اكتمال الثلاثية (لوحة معتمدة + خامة معتمدة + استلام ميداني) لفتح صرف المستخلص المالي، وتراقب الإدارة العليا أي عوائق.',
    whatHappensEn:
      'System verifies 3-way match (Drawing + Material + Site IR) to release IPC payment while executives monitor blockers.',
    outputAr: 'مستخلص مالي معتمد للصرف وحوكمة تعاقدية كاملة',
    outputEn: 'Certified IPC payment and full contractual governance',
    workspaceTab: 'field_paperwork',
  },
];

const COLOR_STYLES: Record<
  RoleGuideDefinition['color'],
  {
    badgeBg: string;
    badgeText: string;
    iconBg: string;
    iconText: string;
    borderActive: string;
    pillActive: string;
    buttonBg: string;
  }
> = {
  teal: {
    badgeBg: 'bg-teal-500/10 border-teal-500/30',
    badgeText: 'text-teal-700 dark:text-teal-300',
    iconBg: 'bg-teal-500/15',
    iconText: 'text-teal-600 dark:text-teal-400',
    borderActive: 'border-teal-500 ring-2 ring-teal-500/20',
    pillActive: 'bg-teal-600 text-white shadow-sm',
    buttonBg: 'bg-teal-600 hover:bg-teal-700 text-white',
  },
  purple: {
    badgeBg: 'bg-purple-500/10 border-purple-500/30',
    badgeText: 'text-purple-700 dark:text-purple-300',
    iconBg: 'bg-purple-500/15',
    iconText: 'text-purple-600 dark:text-purple-400',
    borderActive: 'border-purple-500 ring-2 ring-purple-500/20',
    pillActive: 'bg-purple-600 text-white shadow-sm',
    buttonBg: 'bg-purple-600 hover:bg-purple-700 text-white',
  },
  indigo: {
    badgeBg: 'bg-indigo-500/10 border-indigo-500/30',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
    iconBg: 'bg-indigo-500/15',
    iconText: 'text-indigo-600 dark:text-indigo-400',
    borderActive: 'border-indigo-500 ring-2 ring-indigo-500/20',
    pillActive: 'bg-indigo-600 text-white shadow-sm',
    buttonBg: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  },
  emerald: {
    badgeBg: 'bg-emerald-500/10 border-emerald-500/30',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    iconBg: 'bg-emerald-500/15',
    iconText: 'text-emerald-600 dark:text-emerald-400',
    borderActive: 'border-emerald-500 ring-2 ring-emerald-500/20',
    pillActive: 'bg-emerald-600 text-white shadow-sm',
    buttonBg: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  sky: {
    badgeBg: 'bg-sky-500/10 border-sky-500/30',
    badgeText: 'text-sky-700 dark:text-sky-300',
    iconBg: 'bg-sky-500/15',
    iconText: 'text-sky-600 dark:text-sky-400',
    borderActive: 'border-sky-500 ring-2 ring-sky-500/20',
    pillActive: 'bg-sky-600 text-white shadow-sm',
    buttonBg: 'bg-sky-600 hover:bg-sky-700 text-white',
  },
  amber: {
    badgeBg: 'bg-amber-500/10 border-amber-500/30',
    badgeText: 'text-amber-700 dark:text-amber-300',
    iconBg: 'bg-amber-500/15',
    iconText: 'text-amber-600 dark:text-amber-400',
    borderActive: 'border-amber-500 ring-2 ring-amber-500/20',
    pillActive: 'bg-amber-600 text-white shadow-sm',
    buttonBg: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
  rose: {
    badgeBg: 'bg-rose-500/10 border-rose-500/30',
    badgeText: 'text-rose-700 dark:text-rose-300',
    iconBg: 'bg-rose-500/15',
    iconText: 'text-rose-600 dark:text-rose-400',
    borderActive: 'border-rose-500 ring-2 ring-rose-500/20',
    pillActive: 'bg-rose-600 text-white shadow-sm',
    buttonBg: 'bg-rose-600 hover:bg-rose-700 text-white',
  },
  slate: {
    badgeBg: 'bg-slate-500/10 border-slate-500/30',
    badgeText: 'text-slate-700 dark:text-slate-300',
    iconBg: 'bg-slate-500/15',
    iconText: 'text-slate-600 dark:text-slate-400',
    borderActive: 'border-slate-500 ring-2 ring-slate-500/20',
    pillActive: 'bg-slate-700 text-white shadow-sm',
    buttonBg: 'bg-slate-700 hover:bg-slate-800 text-white',
  },
};

export interface TORoleWorkflowGuideProps {
  onSelectWorkspaceTab?: (tab: GuideWorkspaceTab) => void;
  isModal?: boolean;
  onClose?: () => void;
}

export const TORoleWorkflowGuide: React.FC<TORoleWorkflowGuideProps> = ({
  onSelectWorkspaceTab,
  isModal = false,
  onClose,
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const router = useRouter();

  const [activeView, setActiveView] = useState<'roles' | 'workflow' | 'matrix'>('roles');
  const [selectedRoleId, setSelectedRoleId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredRoles = useMemo(() => {
    let list = PORTAL_ROLE_GUIDES;
    if (selectedRoleId !== 'all') {
      list = list.filter((r) => r.id === selectedRoleId);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.titleAr.toLowerCase().includes(q) ||
          r.titleEn.toLowerCase().includes(q) ||
          r.summaryAr.toLowerCase().includes(q) ||
          r.whatTheyDoAr.some((task) => task.toLowerCase().includes(q)) ||
          r.locations.some((loc) => loc.labelAr.toLowerCase().includes(q))
      );
    }
    return list;
  }, [selectedRoleId, searchQuery]);

  const handleNavigate = (loc: { workspaceTab?: GuideWorkspaceTab; href?: string }) => {
    if (loc.workspaceTab) {
      if (onSelectWorkspaceTab) {
        onSelectWorkspaceTab(loc.workspaceTab);
        if (onClose) onClose();
        return;
      }
      if (onClose) onClose();
      router.push(`/technical-office?tab=${loc.workspaceTab}`);
      return;
    }
    if (loc.href) {
      if (onClose) onClose();
      router.push(loc.href);
    }
  };

  const content = (
    <div className="space-y-6">
      {/* ── Top Banner ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r rtl:bg-gradient-to-l from-slate-900 via-teal-950 to-slate-900 p-5 sm:p-7 text-white border border-slate-800 shadow-xl">
        <div className="absolute -top-20 -end-20 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -start-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-bold">
              <Compass className="w-4 h-4" />
              <span>
                {isAr
                  ? 'الدليل التشغيلي التفاعلي للمنظومة'
                  : 'Interactive Operational Role & Workflow Guide'}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white leading-snug">
              {isAr
                ? 'دليل الأدوار ومسارات العمل — كل واحد بيعمل إيه وفين في الموقع؟'
                : 'Role & Workflow Guide — Who Does What and Where in the Portal?'}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {isAr
                ? 'خريطة واضحة ومباشرة تشرح مهام كل مسمى وظيفي داخل المنظومة، الشاشات والأقسام المخصصة له، من أين يستلم العمل ولمن يسلمه، مع أزرار انتقال فوري لكل شاشة.'
                : 'A direct operational map explaining every job title, their exact responsibilities, their dedicated portal screens, handoffs, and one-click navigation buttons.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* View Mode Switcher */}
            <div className="inline-flex items-center gap-1 p-1.5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveView('roles')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeView === 'roles'
                    ? 'bg-teal-600 text-white shadow-sm font-black'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>{isAr ? 'المسميات الوظيفية ومهامها' : 'Roles & Tasks'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('workflow')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeView === 'workflow'
                    ? 'bg-purple-600 text-white shadow-sm font-black'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>{isAr ? 'مخطط تسلسل العمل (٦ مراحل)' : '6-Stage Workflow Map'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('matrix')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeView === 'matrix'
                    ? 'bg-emerald-600 text-white shadow-sm font-black'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>{isAr ? 'جدول الشاشات السريع' : 'Quick Screen Matrix'}</span>
              </button>
            </div>

            {isModal && onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label={isAr ? 'إغلاق الدليل' : 'Close Guide'}
                className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── VIEW 1: ROLES & RESPONSIBILITIES (كل واحد بيعمل إيه وفين) ───── */}
      {activeView === 'roles' && (
        <div className="space-y-5">
          {/* Filter Bar: Role Selector Pills + Search */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                  {isAr
                    ? 'اختر المسمى الوظيفي لمعرفة مهامه وشاشاته بالتفصيل:'
                    : 'Select a job title to view their responsibilities and screens:'}
                </span>
              </div>

              <div className="relative w-full md:w-72">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isAr ? 'ابحث عن وظيفة أو مهمة أو شاشة...' : 'Search role, task, or screen...'}
                  className="w-full h-9 ps-8 pe-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setSelectedRoleId('all')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedRoleId === 'all'
                    ? 'bg-slate-900 dark:bg-teal-600 text-white shadow-sm font-black'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {isAr ? `عرض جميع الوظائف (${PORTAL_ROLE_GUIDES.length})` : `All Roles (${PORTAL_ROLE_GUIDES.length})`}
              </button>

              {PORTAL_ROLE_GUIDES.map((role) => {
                const RoleIcon = role.icon;
                const isSelected = selectedRoleId === role.id;
                const styles = COLOR_STYLES[role.color];
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRoleId(role.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? styles.pillActive
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <RoleIcon className="w-3.5 h-3.5" />
                    <span>{isAr ? role.titleAr : role.titleEn}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Role Cards Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {filteredRoles.map((role) => {
              const RoleIcon = role.icon;
              const styles = COLOR_STYLES[role.color];
              const tasks = isAr ? role.whatTheyDoAr : role.whatTheyDoEn;

              return (
                <article
                  key={role.id}
                  className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
                >
                  <div className="p-5 sm:p-6 space-y-5">
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3.5">
                        <div className={`p-3 rounded-2xl ${styles.iconBg} ${styles.iconText} shrink-0`}>
                          <RoleIcon className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                              {isAr ? role.titleAr : role.titleEn}
                            </h3>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${styles.badgeBg} ${styles.badgeText}`}
                            >
                              {isAr ? role.badgeAr : role.badgeEn}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {isAr ? role.summaryAr : role.summaryEn}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Section 1: بيعمل إيه؟ (What They Do) */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <CheckCircle2 className={`w-4 h-4 ${styles.iconText}`} />
                        <span>{isAr ? 'بيعمل إيه؟ (المهام والخطوات اليومية):' : 'What do they do? (Daily Tasks):'}</span>
                      </h4>
                      <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                        {tasks.map((task, idx) => (
                          <li key={idx} className="flex items-start gap-2 leading-relaxed">
                            <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span>{task}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Section 2: فين في الموقع؟ (Where in the Portal) */}
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <MapPin className={`w-4 h-4 ${styles.iconText}`} />
                        <span>
                          {isAr
                            ? 'فين في الموقع؟ (اضغط على أي شاشة للانتقال إليها فوراً):'
                            : 'Where in the portal? (Click any screen to jump directly):'}
                        </span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {role.locations.map((loc, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleNavigate(loc)}
                            className="group text-start p-3 rounded-2xl bg-slate-50/90 hover:bg-teal-50/60 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 hover:border-teal-500 transition-all cursor-pointer flex flex-col justify-between gap-2"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-1.5">
                                <span className="text-xs font-black text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-300">
                                  {isAr ? loc.labelAr : loc.labelEn}
                                </span>
                                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 rtl:-scale-x-100 shrink-0" />
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                                {isAr ? loc.descriptionAr : loc.descriptionEn}
                              </p>
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                              <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300">
                                {isAr ? loc.badgeAr : loc.badgeEn}
                              </span>
                              <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 group-hover:translate-x-[-2px] transition-transform">
                                {isAr ? 'افتح الشاشة ←' : 'Open Screen →'}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: يستلم من مين / يسلم لمين + القاعدة الذهبية */}
                  <div className="px-5 py-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                        <span className="block text-[10px] font-black text-slate-400 mb-0.5">
                          {isAr ? '📥 يستلم العمل من:' : '📥 Receives work from:'}
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                          {isAr ? role.receivesFromAr : role.receivesFromEn}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                        <span className="block text-[10px] font-black text-slate-400 mb-0.5">
                          {isAr ? '📤 يسلم العمل إلى:' : '📤 Hands over work to:'}
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                          {isAr ? role.deliversToAr : role.deliversToEn}
                        </span>
                      </div>
                    </div>

                    <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-[11px] font-bold flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>
                        {isAr ? `القاعدة الذهبية: ${role.goldenRuleAr}` : `Golden Rule: ${role.goldenRuleEn}`}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* ── VIEW 2: 6-STAGE END-TO-END WORKFLOW MAP (مخطط تسلسل العمل) ──── */}
      {activeView === 'workflow' && (
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span>
                {isAr
                  ? 'رحلة العمل المتكاملة في الموقع (٦ مراحل متسلسلة من التأسيس حتى صرف المستخلص)'
                  : 'End-to-End Portal Workflow Journey (6 Connected Stages)'}
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr
                ? 'توضح هذه الخريطة كيف تنتقل المعاملة خطوة بخطوة بين المسميات الوظيفية المختلفة وأين يتم تنفيذ كل خطوة.'
                : 'This map illustrates how work flows step-by-step across roles and screens from project setup to IPC payment.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {END_TO_END_WORKFLOW_MAP.map((stage) => (
              <div
                key={stage.step}
                className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-4 hover:border-teal-500 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-3 py-1 rounded-full bg-teal-600 text-white text-xs font-black">
                      {isAr ? `المرحلة ${stage.step}` : `Stage ${stage.step}`}
                    </span>
                    <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20">
                      {isAr ? stage.whoAr : stage.whoEn}
                    </span>
                  </div>

                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    {isAr ? stage.titleAr : stage.titleEn}
                  </h4>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {isAr ? stage.whatHappensAr : stage.whatHappensEn}
                  </p>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-700/80 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-400">
                      {isAr ? 'المكان في الموقع:' : 'Screen / Location:'}
                    </span>
                    <span className="text-[11px] font-black text-teal-700 dark:text-teal-300">
                      {isAr ? stage.whereAr : stage.whereEn}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-400">
                      {isAr ? 'المخرج النهائي:' : 'Stage Output:'}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                      {isAr ? stage.outputAr : stage.outputEn}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleNavigate({ workspaceTab: stage.workspaceTab, href: stage.href })}
                    className="w-full mt-2 py-2 px-3 rounded-xl bg-slate-900 hover:bg-teal-600 dark:bg-slate-700 dark:hover:bg-teal-600 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>{isAr ? 'انتقل إلى شاشة هذه المرحلة' : 'Go to Stage Screen'}</span>
                    {isAr ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── VIEW 3: QUICK SCREEN LOOKUP MATRIX (جدول الشاشات السريع) ──────── */}
      {activeView === 'matrix' && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              {isAr
                ? 'جدول الاختصاصات والشاشات السريع — ملخص من يعمل ماذا وأين'
                : 'Quick Role-to-Screen Lookup Matrix'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isAr
                ? 'جدول مرجعي سريع يربط كل مسمى وظيفي بأهم مهامه والشاشة المخصصة له مع زر انتقال مباشر.'
                : 'Quick reference table connecting each job title to their primary tasks and target screen.'}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-black">
                  <th className="px-4 py-3.5 text-start whitespace-nowrap">
                    {isAr ? 'المسمى الوظيفي' : 'Job Title / Role'}
                  </th>
                  <th className="px-4 py-3.5 text-start min-w-[240px]">
                    {isAr ? 'أهم المهام (بيعمل إيه؟)' : 'Core Responsibility (What they do)'}
                  </th>
                  <th className="px-4 py-3.5 text-start whitespace-nowrap">
                    {isAr ? 'يستلم من ⬅ يسلم إلى' : 'Handoff (From ➔ To)'}
                  </th>
                  <th className="px-4 py-3.5 text-start min-w-[240px]">
                    {isAr ? 'الشاشات المخصصة (فين في الموقع؟)' : 'Dedicated Screens (Where)'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {PORTAL_ROLE_GUIDES.map((role) => {
                  const RoleIcon = role.icon;
                  const styles = COLOR_STYLES[role.color];
                  return (
                    <tr key={role.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3.5 whitespace-nowrap align-top">
                        <div className="flex items-center gap-2.5">
                          <span className={`p-2 rounded-xl ${styles.iconBg} ${styles.iconText}`}>
                            <RoleIcon className="w-4 h-4" />
                          </span>
                          <div>
                            <p className="font-black text-slate-900 dark:text-white">
                              {isAr ? role.titleAr : role.titleEn}
                            </p>
                            <span className="text-[10px] font-bold text-slate-400">
                              {isAr ? role.badgeAr : role.badgeEn}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 align-top text-slate-600 dark:text-slate-300 leading-relaxed">
                        {isAr ? role.summaryAr : role.summaryEn}
                      </td>

                      <td className="px-4 py-3.5 align-top text-[11px] space-y-1">
                        <div className="text-slate-600 dark:text-slate-300">
                          <strong className="text-slate-900 dark:text-white">
                            {isAr ? 'من: ' : 'From: '}
                          </strong>
                          {isAr ? role.receivesFromAr : role.receivesFromEn}
                        </div>
                        <div className="text-teal-700 dark:text-teal-300">
                          <strong className="text-slate-900 dark:text-white">
                            {isAr ? 'إلى: ' : 'To: '}
                          </strong>
                          {isAr ? role.deliversToAr : role.deliversToEn}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 align-top">
                        <div className="flex flex-wrap gap-1.5">
                          {role.locations.map((loc, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleNavigate(loc)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-teal-600 dark:bg-slate-800 dark:hover:bg-teal-600 text-slate-800 hover:text-white dark:text-slate-200 text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <span>{isAr ? loc.labelAr : loc.labelEn}</span>
                              <ExternalLink className="w-3 h-3 rtl:-scale-x-100" />
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  if (!isModal) {
    return content;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={
        isAr
          ? 'دليل الأدوار ومسارات العمل — كل واحد بيعمل إيه وفين في الموقع'
          : 'Role & Workflow Guide'
      }
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div className="w-full max-w-[1450px] max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 sm:p-6">
        {content}
      </div>
    </div>
  );
};
