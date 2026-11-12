import React from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  accentColor?: 'indigo' | 'cyan' | 'emerald' | 'amber' | 'purple' | 'rose' | 'blue' | 'violet';
  badge?: string;
  badgeTone?: 'emerald' | 'amber' | 'cyan' | 'purple' | 'rose' | 'blue';
  onClick?: () => void;
  isActive?: boolean;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  accentColor = 'indigo',
  badge,
  badgeTone = 'emerald',
  onClick,
  isActive = false,
}) => {
  const accentGradients: Record<string, string> = {
    indigo: 'from-indigo-500/20 to-purple-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
    cyan: 'from-cyan-500/20 to-blue-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
    emerald: 'from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    amber: 'from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
    purple: 'from-purple-500/20 to-fuchsia-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30',
    rose: 'from-rose-500/20 to-pink-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30',
    blue: 'from-blue-500/20 to-sky-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
    violet: 'from-violet-500/20 to-purple-500/20 text-violet-600 dark:text-violet-400 border-violet-500/30',
  };

  const badgeStyles: Record<string, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
    cyan: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
    purple: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
    rose: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
    blue: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
  };

  const isInteractive = Boolean(onClick);
  const valStr = String(value ?? '');
  const isLongVal = valStr.length > 11;

  return (
    <div
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-pressed={isInteractive ? isActive : undefined}
      onClick={onClick}
      onKeyDown={
        isInteractive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={`glass-card p-3.5 sm:p-4 lg:p-4.5 relative overflow-hidden group transition-all duration-200 ${
        isInteractive ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99]' : 'hover:scale-[1.01]'
      } ${
        isActive
          ? 'ring-2 ring-emerald-500 dark:ring-emerald-400 border-emerald-500/80 bg-emerald-50/50 dark:bg-emerald-950/20'
          : 'border-slate-200/80 dark:border-slate-800'
      }`}
    >
      <div className="flex items-start justify-between gap-2.5 min-w-0">
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">{title}</p>
            {badge && (
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full border ${badgeStyles[badgeTone]}`}>
                {badge}
              </span>
            )}
          </div>
          <h3
            className={`font-black mt-1 text-slate-900 dark:text-white tracking-tighter truncate ${
              isLongVal
                ? 'text-xs sm:text-[13px] md:text-sm lg:text-[14px] xl:text-[15px] font-mono'
                : 'text-lg sm:text-xl'
            }`}
            title={valStr}
          >
            {value}
          </h3>
          {subtitle && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate" title={subtitle}>
              {subtitle}
            </p>
          )}
        </div>

        <div className={`p-2.5 rounded-2xl bg-gradient-to-br border ${accentGradients[accentColor] || accentGradients.indigo} shrink-0`}>
          {icon}
        </div>
      </div>

      {trend && (
        <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold">
          <span className={trend.isPositive !== false ? 'text-emerald-500' : 'text-rose-500'}>
            {trend.value}
          </span>
          <span className="text-slate-400 text-[10px]">مقارنة بالشهر السابق</span>
        </div>
      )}
    </div>
  );
};
