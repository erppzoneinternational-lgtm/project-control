'use client';

import React from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Info, 
  CheckCircle2, 
  ArrowLeft 
} from 'lucide-react';

export interface TransitionGuardBannerProps {
  message: string;
  variant?: 'warning' | 'info' | 'error' | 'success';
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const variantStyles = {
  warning: {
    container: 'bg-amber-50/90 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200',
    iconBg: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/80',
    actionBtn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20 dark:bg-amber-600 dark:hover:bg-amber-500',
    IconComponent: AlertTriangle,
  },
  info: {
    container: 'bg-sky-50/90 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800/60 text-sky-900 dark:text-sky-200',
    iconBg: 'bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/80',
    actionBtn: 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/20 dark:bg-sky-600 dark:hover:bg-sky-500',
    IconComponent: Info,
  },
  error: {
    container: 'bg-rose-50/90 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-200',
    iconBg: 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/80',
    actionBtn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20 dark:bg-rose-600 dark:hover:bg-rose-500',
    IconComponent: ShieldAlert,
  },
  success: {
    container: 'bg-emerald-50/90 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80',
    actionBtn: 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-700/20 dark:bg-emerald-700 dark:hover:bg-emerald-600',
    IconComponent: CheckCircle2,
  },
};

export const TransitionGuardBanner: React.FC<TransitionGuardBannerProps> = ({
  message,
  variant = 'warning',
  actionLabel,
  onAction,
  className = '',
}) => {
  const currentVariant = variantStyles[variant] || variantStyles.warning;
  const { IconComponent, container, iconBg, actionBtn } = currentVariant;

  return (
    <div
      role="alert"
      className={`p-3.5 sm:p-4 rounded-2xl border shadow-sm backdrop-blur-md transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${container} ${className}`}
    >
      <div className="flex items-start sm:items-center gap-3 min-w-0">
        <div className={`p-2 rounded-xl border shrink-0 flex items-center justify-center ${iconBg}`}>
          <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
        </div>
        <p className="text-xs sm:text-sm font-semibold leading-relaxed break-words">
          {message}
        </p>
      </div>

      {actionLabel && (
        <button
          type="button"
          onClick={onAction}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all shrink-0 self-end sm:self-center shadow-md active:scale-95 ${actionBtn}`}
        >
          <span>{actionLabel}</span>
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default TransitionGuardBanner;
