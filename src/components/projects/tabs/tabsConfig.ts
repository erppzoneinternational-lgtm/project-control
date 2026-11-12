import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Layers,
  FileSpreadsheet,
  DollarSign,
  Target,
  FileDiff,
  Banknote,
  ClipboardList,
  Folder,
  Users,
  GitFork,
  History,
  Archive,
  Settings,
} from 'lucide-react';

export type ProjectTab =
  | 'overview'
  | 'contracts'
  | 'wbs'
  | 'boq'
  | 'cost_control'
  | 'milestones'
  | 'change_orders'
  | 'invoices'
  | 'snags'
  | 'documents'
  | 'team'
  | 'org_chart'
  | 'audit_log'
  | 'archive'
  | 'settings';

export interface TabConfigItem {
  id: ProjectTab;
  labelAr: string;
  labelEn: string;
  icon: React.ComponentType<{ className?: string }>;
  activeColorClass: string;
  iconBgClass: string;
  testId?: string;
}

export const TABS_CONFIG: TabConfigItem[] = [
  {
    id: 'overview',
    labelAr: 'نظرة عامة',
    labelEn: 'Overview',
    icon: LayoutDashboard,
    activeColorClass: 'text-emerald-700 dark:text-emerald-400',
    iconBgClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
  },
  {
    id: 'contracts',
    labelAr: 'العقد والبيانات التعاقدية',
    labelEn: 'Contract & Terms',
    icon: FileText,
    activeColorClass: 'text-blue-700 dark:text-blue-400',
    iconBgClass: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400',
    testId: 'tab-contracts',
  },
  {
    id: 'wbs',
    labelAr: 'هيكل تجزئة الأعمال',
    labelEn: 'Work Breakdown (WBS)',
    icon: Layers,
    activeColorClass: 'text-sky-700 dark:text-sky-400',
    iconBgClass: 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400',
    testId: 'tab-wbs',
  },
  {
    id: 'boq',
    labelAr: 'جدول الكميات والمواصفات',
    labelEn: 'Bill of Quantities (BOQ)',
    icon: FileSpreadsheet,
    activeColorClass: 'text-emerald-700 dark:text-emerald-400',
    iconBgClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
    testId: 'tab-boq',
  },
  {
    id: 'cost_control',
    labelAr: 'مراقبة التكاليف والقيمة المكتسبة',
    labelEn: 'Cost Control & EVM',
    icon: DollarSign,
    activeColorClass: 'text-amber-700 dark:text-amber-400',
    iconBgClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
    testId: 'tab-cost-control',
  },
  {
    id: 'milestones',
    labelAr: 'دفعات التعاقد',
    labelEn: 'Milestones',
    icon: Target,
    activeColorClass: 'text-indigo-700 dark:text-indigo-400',
    iconBgClass: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400',
    testId: 'tab-milestones',
  },
  {
    id: 'change_orders',
    labelAr: 'أوامر التغيير التعاقدية',
    labelEn: 'Change Orders (VO)',
    icon: FileDiff,
    activeColorClass: 'text-amber-700 dark:text-amber-400',
    iconBgClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
    testId: 'tab-change-orders',
  },
  {
    id: 'invoices',
    labelAr: 'المستخلصات والضمان',
    labelEn: 'Invoices & Retention',
    icon: Banknote,
    activeColorClass: 'text-emerald-700 dark:text-emerald-400',
    iconBgClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
    testId: 'tab-invoices',
  },
  {
    id: 'snags',
    labelAr: 'الملاحظات وضمان العيوب',
    labelEn: 'Snag List & DLP',
    icon: ClipboardList,
    activeColorClass: 'text-teal-700 dark:text-teal-400',
    iconBgClass: 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400',
    testId: 'tab-snags',
  },
  {
    id: 'documents',
    labelAr: 'المستندات والمحاضر',
    labelEn: 'Documents & Contracts',
    icon: Folder,
    activeColorClass: 'text-blue-700 dark:text-blue-400',
    iconBgClass: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400',
    testId: 'tab-documents',
  },
  {
    id: 'team',
    labelAr: 'الشركاء والعملاء',
    labelEn: 'Stakeholders & Clients',
    icon: Users,
    activeColorClass: 'text-purple-700 dark:text-purple-400',
    iconBgClass: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400',
    testId: 'tab-team',
  },
  {
    id: 'org_chart',
    labelAr: 'الهيكل التنظيمي للشركاء',
    labelEn: 'Stakeholders Org Chart',
    icon: GitFork,
    activeColorClass: 'text-emerald-700 dark:text-emerald-400',
    iconBgClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
    testId: 'tab-org-chart',
  },
  {
    id: 'audit_log',
    labelAr: 'سجل التدقيق',
    labelEn: 'Audit Log',
    icon: History,
    activeColorClass: 'text-purple-700 dark:text-purple-400',
    iconBgClass: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400',
    testId: 'tab-audit-log',
  },
  {
    id: 'archive',
    labelAr: 'سجل الأرشيف',
    labelEn: 'Archive Log',
    icon: Archive,
    activeColorClass: 'text-rose-700 dark:text-rose-400',
    iconBgClass: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400',
    testId: 'tab-archive',
  },
  {
    id: 'settings',
    labelAr: 'الإعدادات',
    labelEn: 'Settings',
    icon: Settings,
    activeColorClass: 'text-rose-700 dark:text-rose-400',
    iconBgClass: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400',
    testId: 'tab-settings',
  },
];
