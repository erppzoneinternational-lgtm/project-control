'use client';

import React from 'react';
import { IncidentSeverity } from '@/types/hse';
import { ShieldCheck, AlertCircle, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';

export type UnifiedSeverity = IncidentSeverity | 'low' | 'medium' | 'high' | 'critical';

interface HseSeverityBadgeProps {
  severity: UnifiedSeverity;
  locale?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface SeverityConfig {
  labelAr: string;
  labelEn: string;
  categoryAr: string;
  categoryEn: string;
  bgLight: string;
  textLight: string;
  borderLight: string;
  bgDark: string;
  textDark: string;
  borderDark: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  ariaLabelAr: string;
  ariaLabelEn: string;
}

const severityConfigs: Record<UnifiedSeverity, SeverityConfig> = {
  low: {
    labelAr: 'منخفض',
    labelEn: 'Low',
    categoryAr: 'مستوى منخفض',
    categoryEn: 'Low Severity',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/40',
    textLight: 'text-emerald-950 dark:text-emerald-200',
    borderLight: 'border-emerald-300',
    bgDark: 'dark:bg-emerald-950/80',
    textDark: 'dark:text-emerald-100',
    borderDark: 'dark:border-emerald-700/60',
    icon: CheckCircle2,
    iconColor: 'text-emerald-700 dark:text-emerald-300',
    ariaLabelAr: 'درجة الخطورة: منخفض',
    ariaLabelEn: 'Severity level: Low',
  },
  near_miss: {
    labelAr: 'وشيك الحدوث (منخفض)',
    labelEn: 'Near Miss (Low)',
    categoryAr: 'حادث وشيك',
    categoryEn: 'Near Miss',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/40',
    textLight: 'text-emerald-950 dark:text-emerald-200',
    borderLight: 'border-emerald-300',
    bgDark: 'dark:bg-emerald-950/80',
    textDark: 'dark:text-emerald-100',
    borderDark: 'dark:border-emerald-700/60',
    icon: ShieldCheck,
    iconColor: 'text-emerald-700 dark:text-emerald-300',
    ariaLabelAr: 'درجة الخطورة: حادث وشيك بدون إصابات (منخفض)',
    ariaLabelEn: 'Severity level: Near miss without injury (Low)',
  },
  first_aid: {
    labelAr: 'إسعافات أولية (منخفض)',
    labelEn: 'First Aid (Low)',
    categoryAr: 'إسعافات أولية',
    categoryEn: 'First Aid',
    bgLight: 'bg-teal-50 dark:bg-teal-950/40',
    textLight: 'text-teal-950 dark:text-teal-200',
    borderLight: 'border-teal-300',
    bgDark: 'dark:bg-teal-950/80',
    textDark: 'dark:text-teal-100',
    borderDark: 'dark:border-teal-700/60',
    icon: ShieldCheck,
    iconColor: 'text-teal-700 dark:text-teal-300',
    ariaLabelAr: 'درجة الخطورة: إسعافات أولية بسيطة (منخفض)',
    ariaLabelEn: 'Severity level: First aid minor incident (Low)',
  },
  medium: {
    labelAr: 'متوسط',
    labelEn: 'Medium',
    categoryAr: 'مستوى متوسط',
    categoryEn: 'Medium Severity',
    bgLight: 'bg-amber-50 dark:bg-amber-950/40',
    textLight: 'text-amber-950 dark:text-amber-200',
    borderLight: 'border-amber-300',
    bgDark: 'dark:bg-amber-950/80',
    textDark: 'dark:text-amber-100',
    borderDark: 'dark:border-amber-700/60',
    icon: AlertCircle,
    iconColor: 'text-amber-700 dark:text-amber-300',
    ariaLabelAr: 'درجة الخطورة: متوسط',
    ariaLabelEn: 'Severity level: Medium',
  },
  medical_treatment: {
    labelAr: 'علاج طبي (متوسط)',
    labelEn: 'Medical Treatment (Medium)',
    categoryAr: 'علاج طبي',
    categoryEn: 'Medical Treatment',
    bgLight: 'bg-amber-50 dark:bg-amber-950/40',
    textLight: 'text-amber-950 dark:text-amber-200',
    borderLight: 'border-amber-300',
    bgDark: 'dark:bg-amber-950/80',
    textDark: 'dark:text-amber-100',
    borderDark: 'dark:border-amber-700/60',
    icon: AlertCircle,
    iconColor: 'text-amber-700 dark:text-amber-300',
    ariaLabelAr: 'درجة الخطورة: علاج طبي عيادي بدون وقت ضائع (متوسط)',
    ariaLabelEn: 'Severity level: Medical treatment without lost time (Medium)',
  },
  high: {
    labelAr: 'عالي',
    labelEn: 'High',
    categoryAr: 'مستوى عالي',
    categoryEn: 'High Severity',
    bgLight: 'bg-orange-50 dark:bg-orange-950/40',
    textLight: 'text-orange-950 dark:text-orange-200',
    borderLight: 'border-orange-300',
    bgDark: 'dark:bg-orange-950/80',
    textDark: 'dark:text-orange-100',
    borderDark: 'dark:border-orange-700/60',
    icon: AlertTriangle,
    iconColor: 'text-orange-700 dark:text-orange-300',
    ariaLabelAr: 'درجة الخطورة: عالي',
    ariaLabelEn: 'Severity level: High',
  },
  lost_time: {
    labelAr: 'وقت ضائع LTI (عالي)',
    labelEn: 'Lost Time Incident (High)',
    categoryAr: 'إصابة وقت ضائع',
    categoryEn: 'Lost Time Injury',
    bgLight: 'bg-orange-50 dark:bg-orange-950/40',
    textLight: 'text-orange-950 dark:text-orange-200',
    borderLight: 'border-orange-300',
    bgDark: 'dark:bg-orange-950/80',
    textDark: 'dark:text-orange-100',
    borderDark: 'dark:border-orange-700/60',
    icon: AlertTriangle,
    iconColor: 'text-orange-700 dark:text-orange-300',
    ariaLabelAr: 'درجة الخطورة: إصابة عمل مع وقت ضائع LTI (عالي)',
    ariaLabelEn: 'Severity level: Lost time injury incident (High)',
  },
  critical: {
    labelAr: 'حرج',
    labelEn: 'Critical',
    categoryAr: 'مستوى حرج',
    categoryEn: 'Critical Severity',
    bgLight: 'bg-rose-100',
    textLight: 'text-rose-950 dark:text-rose-200',
    borderLight: 'border-rose-400 font-bold',
    bgDark: 'dark:bg-rose-950',
    textDark: 'dark:text-rose-100',
    borderDark: 'dark:border-rose-600 font-bold',
    icon: ShieldAlert,
    iconColor: 'text-rose-700 dark:text-rose-300',
    ariaLabelAr: 'درجة الخطورة: حرج جداً أو خطير',
    ariaLabelEn: 'Severity level: Critical high severity',
  },
  fatal: {
    labelAr: 'حادث جسيم / وفاة (حرج)',
    labelEn: 'Fatal / Severe (Critical)',
    categoryAr: 'حادث جسيم',
    categoryEn: 'Fatal Incident',
    bgLight: 'bg-rose-100',
    textLight: 'text-rose-950 dark:text-rose-200',
    borderLight: 'border-rose-400 font-bold',
    bgDark: 'dark:bg-rose-950',
    textDark: 'dark:text-rose-100',
    borderDark: 'dark:border-rose-600 font-bold',
    icon: ShieldAlert,
    iconColor: 'text-rose-700 dark:text-rose-300',
    ariaLabelAr: 'درجة الخطورة: حادث جسيم أو حالة وفاة (حرج أقصى)',
    ariaLabelEn: 'Severity level: Fatal or severe incident (Critical)',
  },
};

export const HseSeverityBadge: React.FC<HseSeverityBadgeProps> = ({
  severity,
  locale = 'ar',
  showIcon = true,
  size = 'md',
  className = '',
}) => {
  const isAr = locale === 'ar';
  const config = severityConfigs[severity] || severityConfigs.low;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2',
  }[size];

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  return (
    <span
      role="status"
      aria-label={isAr ? config.ariaLabelAr : config.ariaLabelEn}
      className={`inline-flex items-center rounded-full font-bold border transition-colors shadow-xs ${config.bgLight} ${config.textLight} ${config.borderLight} ${config.bgDark} ${config.textDark} ${config.borderDark} ${sizeClasses} ${className}`}
    >
      {showIcon && <Icon className={`${iconSizes} ${config.iconColor} shrink-0`} aria-hidden="true" />}
      <span>{isAr ? config.labelAr : config.labelEn}</span>
    </span>
  );
};

export default HseSeverityBadge;
