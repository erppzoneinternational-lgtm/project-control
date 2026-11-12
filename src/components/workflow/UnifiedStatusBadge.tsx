'use client';

import React from 'react';
import {
  Calendar,
  PlayCircle,
  Clock,
  Send,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  PauseCircle,
  FileEdit,
  AlertCircle,
  Inbox,
  ShieldAlert,
  ArrowUpRight,
  MinusCircle,
  FlaskConical,
  HelpCircle,
  LucideIcon,
} from 'lucide-react';

export type WorkflowEntityType = 'report' | 'task' | 'deliverable' | 'inspection';
export type MutedColorTheme = 'sage' | 'steel-blue' | 'amber-tan' | 'coral' | 'lavender' | 'warm-gray';

export interface UnifiedStatusBadgeProps {
  status: string;
  entityType: WorkflowEntityType;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
  /** Accessible hint for screen readers or announcement context */
  accessibleHint?: string;
  /** Explicit aria-label override */
  ariaLabel?: string;
  /** Live region politeness for dynamic updates */
  live?: boolean | 'off' | 'polite' | 'assertive';
  /** Flip directional icons in RTL contexts (default true) */
  flipDirectionalIcons?: boolean;
}

export interface StatusMeta {
  label: string;
  theme: MutedColorTheme;
  icon: LucideIcon;
  /** Flag icons that convey directional progression (e.g. forward arrow, send plane) */
  isDirectional?: boolean;
}

export const ENTITY_TYPE_LABELS_AR: Record<WorkflowEntityType, string> = {
  task: 'المهمة',
  report: 'التقرير اليومي',
  deliverable: 'المخرج الفني',
  inspection: 'طلب الفحص',
};

// ── Status Mappings by Entity Type ──────────────────────────────────────────

const TASK_STATUS_MAP: Record<string, StatusMeta> = {
  // Primary database & Kanban states (siteTask.service.ts)
  pending: { label: 'معلقة (بانتظار البدء)', theme: 'warm-gray', icon: Clock },
  in_progress: { label: 'قيد التنفيذ', theme: 'steel-blue', icon: Clock },
  pm_review: { label: 'مراجعة مدير المشروع', theme: 'amber-tan', icon: Send, isDirectional: true },
  qc_pending: { label: 'بانتظار فحص الجودة (QC)', theme: 'lavender', icon: ShieldCheck },
  approved: { label: 'معتمدة من PM', theme: 'sage', icon: CheckCircle2 },
  rejected: { label: 'مرفوضة / إعادة عمل', theme: 'coral', icon: RotateCcw },
  done: { label: 'منجزة ومغلقة', theme: 'sage', icon: CheckCircle2 },
  cancelled: { label: 'ملغاة', theme: 'warm-gray', icon: XCircle },

  // Secondary & legacy workflow aliases
  planned: { label: 'مخطط', theme: 'warm-gray', icon: Calendar },
  released: { label: 'معتمد للتنفيذ', theme: 'steel-blue', icon: PlayCircle },
  active: { label: 'نشط / قيد التنفيذ', theme: 'steel-blue', icon: Clock },
  started: { label: 'بدأ التنفيذ', theme: 'steel-blue', icon: Clock },
  submitted_for_pm: { label: 'بانتظار مراجعة PM', theme: 'amber-tan', icon: Send, isDirectional: true },
  submitted: { label: 'تم التقديم', theme: 'amber-tan', icon: Send, isDirectional: true },
  inspection_pending: { label: 'بانتظار فحص WIR', theme: 'lavender', icon: ShieldCheck },
  wir_pending: { label: 'بانتظار فحص WIR', theme: 'lavender', icon: ShieldCheck },
  rework: { label: 'إعادة عمل / ملاحظات', theme: 'coral', icon: RotateCcw },
  reopened_rework: { label: 'إعادة عمل وملاحظات', theme: 'coral', icon: RotateCcw },
  verified: { label: 'تم التحقق والاعتماد', theme: 'sage', icon: CheckCircle2 },
  pm_accepted: { label: 'مقبول من مدير المشروع', theme: 'sage', icon: CheckCircle2 },
  closed: { label: 'مكتمل ومغلق', theme: 'sage', icon: CheckCircle2 },
  completed: { label: 'مكتمل', theme: 'sage', icon: CheckCircle2 },
  overdue: { label: 'متأخر', theme: 'coral', icon: AlertTriangle },
  delayed: { label: 'متأخر', theme: 'coral', icon: AlertTriangle },
  on_hold: { label: 'معلق', theme: 'amber-tan', icon: PauseCircle },
  held: { label: 'معلق', theme: 'amber-tan', icon: PauseCircle },
};

const REPORT_STATUS_MAP: Record<string, StatusMeta> = {
  draft: { label: 'مسودة', theme: 'warm-gray', icon: FileEdit },
  submitted: { label: 'تم التقديم', theme: 'steel-blue', icon: Send, isDirectional: true },
  pending: { label: 'قيد المراجعة', theme: 'amber-tan', icon: Clock },
  under_review: { label: 'قيد المراجعة', theme: 'amber-tan', icon: Clock },
  pm_review: { label: 'تمت مراجعة PM', theme: 'amber-tan', icon: Clock },
  pm_reviewed: { label: 'تمت مراجعة PM', theme: 'amber-tan', icon: Clock },
  partially_approved: { label: 'معتمد جزئياً', theme: 'amber-tan', icon: AlertCircle },
  approved: { label: 'معتمد', theme: 'sage', icon: CheckCircle2 },
  finalized: { label: 'مُعتمد ونهائي', theme: 'sage', icon: CheckCircle2 },
  rejected: { label: 'مرفوض', theme: 'coral', icon: XCircle },
  reopened: { label: 'مُعاد فتحه', theme: 'amber-tan', icon: RotateCcw },
  unverified: { label: 'غير معتمد ميدانياً', theme: 'warm-gray', icon: Clock },
  verified: { label: 'تم التحقق والاعتماد', theme: 'sage', icon: CheckCircle2 },
  cancelled: { label: 'ملغي', theme: 'warm-gray', icon: XCircle },
};

const DELIVERABLE_STATUS_MAP: Record<string, StatusMeta> = {
  received: { label: 'مُستلم من المكتب الفني', theme: 'steel-blue', icon: Inbox },
  in_progress: { label: 'قيد الدراسة والعمل', theme: 'steel-blue', icon: Clock },
  blocked: { label: 'مُعطّل (عائق نشط)', theme: 'coral', icon: ShieldAlert },
  ready_to_return: { label: 'جاهز للإعادة', theme: 'amber-tan', icon: ArrowUpRight, isDirectional: true },
  returned: { label: 'تمت الإعادة والاستلام', theme: 'sage', icon: CheckCircle2 },
  approved: { label: 'معتمد', theme: 'sage', icon: CheckCircle2 },
  rejected: { label: 'مرفوض', theme: 'coral', icon: XCircle },
  under_review: { label: 'قيد المراجعة الفنية', theme: 'steel-blue', icon: Clock },
  pending: { label: 'بانتظار رد الاستشاري', theme: 'amber-tan', icon: Clock },
  submitted: { label: 'تم التقديم للاستشاري', theme: 'steel-blue', icon: Send, isDirectional: true },
  overdue: { label: 'متأخر (تجاوز المدة)', theme: 'coral', icon: AlertTriangle },
  delayed: { label: 'متأخر', theme: 'coral', icon: AlertTriangle },

  // Consultant approval codes (Code A / B / C / D)
  A: { label: 'كود A (معتمد)', theme: 'sage', icon: CheckCircle2 },
  code_a: { label: 'كود A (معتمد)', theme: 'sage', icon: CheckCircle2 },
  B: { label: 'كود B (معتمد بملاحظات)', theme: 'steel-blue', icon: AlertCircle },
  code_b: { label: 'كود B (معتمد بملاحظات)', theme: 'steel-blue', icon: AlertCircle },
  C: { label: 'كود C (إعادة تقديم)', theme: 'coral', icon: RotateCcw },
  code_c: { label: 'كود C (إعادة تقديم)', theme: 'coral', icon: RotateCcw },
  D: { label: 'كود D (مرفوض)', theme: 'coral', icon: XCircle },
  code_d: { label: 'كود D (مرفوض)', theme: 'coral', icon: XCircle },
};

const INSPECTION_STATUS_MAP: Record<string, StatusMeta> = {
  pending: { label: 'قيد فحص الجودة (WIR)', theme: 'amber-tan', icon: Clock },
  wir_pending: { label: 'قيد فحص الجودة (WIR)', theme: 'amber-tan', icon: Clock },
  not_required: { label: 'غير مطلوب فحص', theme: 'warm-gray', icon: MinusCircle },
  submitted: { label: 'تم طلب الفحص', theme: 'steel-blue', icon: Send, isDirectional: true },
  lab_pending: { label: 'بانتظار فحص المختبر', theme: 'lavender', icon: FlaskConical },
  in_progress: { label: 'الفحص جارٍ بالموقع', theme: 'steel-blue', icon: Clock },
  scheduled: { label: 'مجدول للفحص', theme: 'steel-blue', icon: Calendar },
  approved: { label: 'مقبول / ناجح', theme: 'sage', icon: CheckCircle2 },
  passed: { label: 'مقبول / ناجح', theme: 'sage', icon: CheckCircle2 },
  rejected: { label: 'مرفوض / راسب', theme: 'coral', icon: XCircle },
  failed: { label: 'مرفوض / راسب', theme: 'coral', icon: XCircle },
  rework: { label: 'إعادة فحص وملاحظات', theme: 'coral', icon: RotateCcw },
  cancelled: { label: 'ملغي', theme: 'warm-gray', icon: XCircle },
};

// Cross-entity shared status dictionary for resilient generic fallbacks
const SHARED_STATUS_MAP: Record<string, StatusMeta> = {
  approved: { label: 'معتمد', theme: 'sage', icon: CheckCircle2 },
  passed: { label: 'ناجح', theme: 'sage', icon: CheckCircle2 },
  done: { label: 'منجز', theme: 'sage', icon: CheckCircle2 },
  completed: { label: 'مكتمل', theme: 'sage', icon: CheckCircle2 },
  closed: { label: 'مغلق', theme: 'sage', icon: CheckCircle2 },
  verified: { label: 'تم التحقق', theme: 'sage', icon: CheckCircle2 },
  rejected: { label: 'مرفوض', theme: 'coral', icon: XCircle },
  failed: { label: 'راسب', theme: 'coral', icon: XCircle },
  blocked: { label: 'معطل', theme: 'coral', icon: ShieldAlert },
  overdue: { label: 'متأخر', theme: 'coral', icon: AlertTriangle },
  delayed: { label: 'متأخر', theme: 'coral', icon: AlertTriangle },
  in_progress: { label: 'قيد التنفيذ', theme: 'steel-blue', icon: Clock },
  active: { label: 'نشط', theme: 'steel-blue', icon: Clock },
  pending: { label: 'قيد الانتظار', theme: 'amber-tan', icon: Clock },
  under_review: { label: 'قيد المراجعة', theme: 'amber-tan', icon: Clock },
  submitted: { label: 'تم التقديم', theme: 'steel-blue', icon: Send, isDirectional: true },
  draft: { label: 'مسودة', theme: 'warm-gray', icon: FileEdit },
  cancelled: { label: 'ملغي', theme: 'warm-gray', icon: XCircle },
  not_required: { label: 'غير مطلوب', theme: 'warm-gray', icon: MinusCircle },
};

// ── Theme Styling Configuration (Audited for WCAG AAA Text & AA Icon Contrast) ──

const THEME_STYLES: Record<
  MutedColorTheme,
  {
    container: string;
    icon: string;
    dot: string;
  }
> = {
  // Sage: Emerald (Contrast light text: 9.23:1 AAA, light icon: 5.21:1 AA, dark text: 11.71:1 AAA)
  sage: {
    container:
      'bg-emerald-50 text-emerald-900 border-emerald-200/90 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/70',
    icon: 'text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-600 dark:bg-emerald-400',
  },
  // Steel-blue: Sky (Contrast light text: 8.87:1 AAA, light icon: 5.57:1 AA, dark text: 10.71:1 AAA)
  'steel-blue': {
    container:
      'bg-sky-50 text-sky-900 border-sky-200/90 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/70',
    icon: 'text-sky-700 dark:text-sky-400',
    dot: 'bg-sky-600 dark:bg-sky-400',
  },
  // Amber-tan: Amber (Contrast light text: 8.75:1 AAA, light icon: 4.84:1 AA, dark text: 12.38:1 AAA)
  'amber-tan': {
    container:
      'bg-amber-50 text-amber-900 border-amber-200/90 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-800/70',
    icon: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-600 dark:bg-amber-400',
  },
  // Coral: Rose (Contrast light text: 8.71:1 AAA, light icon: 5.72:1 AA, dark text: 9.44:1 AAA)
  coral: {
    container:
      'bg-rose-50 text-rose-900 border-rose-200/90 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/70',
    icon: 'text-rose-700 dark:text-rose-400',
    dot: 'bg-rose-600 dark:bg-rose-400',
  },
  // Lavender: Purple (Contrast light text: 10.14:1 AAA, light icon: 6.51:1 AA, dark text: 10.10:1 AAA)
  lavender: {
    container:
      'bg-purple-50 text-purple-900 border-purple-200/90 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800/70',
    icon: 'text-purple-700 dark:text-purple-400',
    dot: 'bg-purple-600 dark:bg-purple-400',
  },
  // Warm-gray: Slate (Contrast light text: 13.35:1 AAA, light icon: 6.92:1 AA, dark text: 12.02:1 AAA)
  'warm-gray': {
    container:
      'bg-slate-100 text-slate-800 border-slate-200/90 dark:bg-slate-800/80 dark:text-slate-200 dark:border-slate-700/70',
    icon: 'text-slate-600 dark:text-slate-400',
    dot: 'bg-slate-500 dark:bg-slate-400',
  },
};

// Size configurations calibrated for Arabic typography legibility & RTL symmetry
const SIZE_STYLES = {
  sm: {
    // 11px ensures Arabic diacritics and ligatures remain clear while keeping pill compact
    badge: 'text-[11px] px-2 py-0.5 gap-1.5 rounded-full font-medium',
    icon: 'w-3 h-3',
    dot: 'w-1.5 h-1.5',
  },
  md: {
    badge: 'text-xs px-2.5 py-1 gap-1.5 rounded-full font-semibold',
    icon: 'w-3.5 h-3.5',
    dot: 'w-2 h-2',
  },
  lg: {
    badge: 'text-sm px-3 py-1.5 gap-2 rounded-full font-semibold',
    icon: 'w-4 h-4',
    dot: 'w-2.5 h-2.5',
  },
};

export function resolveStatusMeta(status: string, entityType: WorkflowEntityType): StatusMeta {
  const normalized = (status || '').toLowerCase().trim();

  let map: Record<string, StatusMeta>;
  switch (entityType) {
    case 'task':
      map = TASK_STATUS_MAP;
      break;
    case 'report':
      map = REPORT_STATUS_MAP;
      break;
    case 'deliverable':
      map = DELIVERABLE_STATUS_MAP;
      break;
    case 'inspection':
      map = INSPECTION_STATUS_MAP;
      break;
    default:
      map = TASK_STATUS_MAP;
  }

  // 1. Exact match in entity-specific map
  if (map[status]) return map[status];

  // 2. Normalized lowercase match in entity-specific map
  if (map[normalized]) return map[normalized];

  // 3. Resilient fallback: Shared status dictionary across workflow entities
  if (SHARED_STATUS_MAP[status]) return SHARED_STATUS_MAP[status];
  if (SHARED_STATUS_MAP[normalized]) return SHARED_STATUS_MAP[normalized];

  // 4. Graceful fallback for completely unknown status
  return {
    label: (status || 'غير محدد').replace(/_/g, ' '),
    theme: 'warm-gray',
    icon: HelpCircle,
  };
}

export const UnifiedStatusBadge: React.FC<UnifiedStatusBadgeProps> = ({
  status,
  entityType,
  size = 'md',
  showIcon = true,
  className = '',
  accessibleHint,
  ariaLabel,
  live,
  flipDirectionalIcons = true,
}) => {
  const meta = resolveStatusMeta(status, entityType);
  const theme = THEME_STYLES[meta.theme] || THEME_STYLES['warm-gray'];
  const sizeConfig = SIZE_STYLES[size] || SIZE_STYLES.md;
  const IconComponent = meta.icon;
  const entityLabelAr = ENTITY_TYPE_LABELS_AR[entityType] || 'العنصر';

  const defaultAriaLabel = `حالة ${entityLabelAr}: ${meta.label}${
    accessibleHint ? ` - ${accessibleHint}` : ''
  }`;
  const computedAriaLabel = ariaLabel || defaultAriaLabel;
  const tooltipText = `${entityLabelAr}: ${meta.label}${
    accessibleHint ? ` (${accessibleHint})` : ''
  }`;

  const liveMode =
    live === true ? 'polite' : typeof live === 'string' ? live : undefined;

  // In RTL, flip forward-pointing icons so arrows and planes advance forward (leftwards)
  const iconDirectionalClass =
    meta.isDirectional && flipDirectionalIcons ? 'rtl:-scale-x-100 transform-gpu' : '';

  return (
    <span
      role="status"
      aria-label={computedAriaLabel}
      aria-live={liveMode}
      title={tooltipText}
      className={`inline-flex items-center border select-none transition-colors shadow-2xs whitespace-nowrap tracking-normal leading-tight ${theme.container} ${sizeConfig.badge} ${className}`}
    >
      {/* Screen-reader announcement context prefix */}
      <span className="sr-only">{`حالة ${entityLabelAr}: `}</span>

      {showIcon ? (
        <IconComponent
          aria-hidden="true"
          focusable="false"
          className={`shrink-0 ${sizeConfig.icon} ${theme.icon} ${iconDirectionalClass}`}
        />
      ) : (
        <span
          aria-hidden="true"
          className={`rounded-full shrink-0 ${sizeConfig.dot} ${theme.dot}`}
        />
      )}

      <span className="leading-tight">{meta.label}</span>

      {/* Screen-reader announcement hint if provided */}
      {accessibleHint && <span className="sr-only">{` (${accessibleHint})`}</span>}
    </span>
  );
};

export default UnifiedStatusBadge;
