'use client';

import React from 'react';
import { Inbox } from 'lucide-react';

export type KanbanColorScheme = 'slate' | 'emerald' | 'blue' | 'amber' | 'rose' | 'purple';

export interface WorkflowKanbanColumnProps {
  title: string;
  count: number;
  colorScheme: KanbanColorScheme;
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
  isHighlighted?: boolean;
  children: React.ReactNode;
  emptyText?: string;
  className?: string;
  headerAction?: React.ReactNode;
  subtitle?: string;
}

const colorStyles: Record<
  KanbanColorScheme,
  {
    headerBg: string;
    titleColor: string;
    iconColor: string;
    badgeBg: string;
    highlightBorder: string;
  }
> = {
  slate: {
    headerBg: 'bg-slate-100/90 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700',
    titleColor: 'text-slate-800 dark:text-slate-200',
    iconColor: 'text-slate-600 dark:text-slate-400',
    badgeBg: 'bg-slate-200/90 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
    highlightBorder: 'ring-2 ring-slate-400/40 border-slate-400 dark:border-slate-500',
  },
  emerald: {
    headerBg: 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-800/60',
    titleColor: 'text-emerald-900 dark:text-emerald-200',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300',
    highlightBorder: 'ring-2 ring-emerald-500/40 border-emerald-400 dark:border-emerald-600',
  },
  blue: {
    headerBg: 'bg-sky-50/90 dark:bg-sky-950/40 border-sky-200/80 dark:border-sky-800/60',
    titleColor: 'text-sky-900 dark:text-sky-200',
    iconColor: 'text-sky-600 dark:text-sky-400',
    badgeBg: 'bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-300',
    highlightBorder: 'ring-2 ring-sky-500/40 border-sky-400 dark:border-sky-600',
  },
  amber: {
    headerBg: 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-800/60',
    titleColor: 'text-amber-900 dark:text-amber-200',
    iconColor: 'text-amber-600 dark:text-amber-400',
    badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300',
    highlightBorder: 'ring-2 ring-amber-500/40 border-amber-400 dark:border-amber-600',
  },
  rose: {
    headerBg: 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-800/60',
    titleColor: 'text-rose-900 dark:text-rose-200',
    iconColor: 'text-rose-600 dark:text-rose-400',
    badgeBg: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300',
    highlightBorder: 'ring-2 ring-rose-500/40 border-rose-400 dark:border-rose-600',
  },
  purple: {
    headerBg: 'bg-purple-50/90 dark:bg-purple-950/40 border-purple-200/80 dark:border-purple-800/60',
    titleColor: 'text-purple-900 dark:text-purple-200',
    iconColor: 'text-purple-600 dark:text-purple-400',
    badgeBg: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300',
    highlightBorder: 'ring-2 ring-purple-500/40 border-purple-400 dark:border-purple-600',
  },
};

export const WorkflowKanbanColumn: React.FC<WorkflowKanbanColumnProps> = ({
  title,
  count,
  colorScheme = 'slate',
  icon,
  isHighlighted = false,
  children,
  emptyText = 'لا توجد عناصر في هذه المرحلة',
  className = '',
  headerAction,
  subtitle,
}) => {
  const scheme = colorStyles[colorScheme] || colorStyles.slate;
  const hasChildren = React.Children.count(children) > 0;

  // Render Icon safely whether passed as component or element
  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) {
      return icon;
    }
    if (typeof icon === 'function') {
      const IconComponent = icon as React.ComponentType<{ className?: string }>;
      return <IconComponent className={`w-4 h-4 shrink-0 ${scheme.iconColor}`} />;
    }
    return null;
  };

  return (
    <div
      className={`glass-card flex flex-col rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-3 transition-all duration-200 shadow-xs ${
        isHighlighted ? scheme.highlightBorder : ''
      } ${className}`}
    >
      {/* Column Header */}
      <div
        className={`p-3 rounded-2xl border mb-3 flex items-center justify-between gap-2 shadow-xs transition-colors ${scheme.headerBg}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {renderIcon()}
          <div className="min-w-0 flex-1">
            <h3 className={`text-xs font-bold leading-tight truncate ${scheme.titleColor}`}>
              {title}
            </h3>
            {subtitle && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {headerAction}
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold transition-transform select-none ${scheme.badgeBg}`}
          >
            {count}
          </span>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="space-y-3 min-h-[400px] p-2 flex-1 overflow-y-auto max-h-[calc(100vh-260px)]">
        {hasChildren ? (
          children
        ) : (
          <div className="py-16 px-4 flex flex-col items-center justify-center text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 dark:text-slate-500 text-xs gap-2.5 min-h-[220px]">
            <div className="p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500">
              <Inbox className="w-5 h-5" />
            </div>
            <p className="font-medium max-w-[180px] leading-relaxed">{emptyText}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowKanbanColumn;
