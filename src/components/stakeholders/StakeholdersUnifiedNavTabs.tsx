'use client';

import React from 'react';
import Link from 'next/link';
import { Building2, UserCheck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export type StakeholdersUnifiedTab = 'entities' | 'people';

export interface StakeholdersUnifiedNavTabsProps {
  activeTab: StakeholdersUnifiedTab;
  entitiesCount?: number;
  peopleCount?: number;
  onTabChange?: (tab: StakeholdersUnifiedTab) => void;
  className?: string;
}

export const StakeholdersUnifiedNavTabs: React.FC<StakeholdersUnifiedNavTabsProps> = ({
  activeTab,
  entitiesCount,
  peopleCount,
  onTabChange,
  className = '',
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const tabs: Array<{
    id: StakeholdersUnifiedTab;
    href: string;
    labelAr: string;
    labelEn: string;
    descAr: string;
    descEn: string;
    icon: React.ElementType;
    count?: number;
  }> = [
    {
      id: 'entities',
      href: '/clients',
      labelAr: 'الشركات والملاك والمطورون',
      labelEn: 'Entities, Owners & Contractors',
      descAr: 'محفظة الجهات، سابقة الأعمال، وعلاقات المشاريع',
      descEn: 'Corporate portfolio, track record & project roles',
      icon: Building2,
      count: entitiesCount,
    },
    {
      id: 'people',
      href: '/stakeholders',
      labelAr: 'الأفراد وممثلو الجهات',
      labelEn: 'People & Representatives',
      descAr: 'كادر بي زون، ممثلو الملاك، والاستشاريون وتسكين RACI',
      descEn: 'P.Zone staff, client reps, consultants & RACI matrix',
      icon: UserCheck,
      count: peopleCount,
    },
  ];

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className={`w-full rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 p-1.5 shadow-xs ${className}`}
    >
      <div
        role={onTabChange ? 'tablist' : 'navigation'}
        aria-label={
          isAr
            ? 'التبديل بين محفظة الجهات ودليل الأفراد'
            : 'Switch between Entities Hub and People Directory'
        }
        className="grid grid-cols-1 sm:grid-cols-2 gap-1.5"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const label = isAr ? tab.labelAr : tab.labelEn;
          const desc = isAr ? tab.descAr : tab.descEn;

          const innerContent = (
            <>
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400'
                  }`}
                >
                  <Icon className="w-4.5 h-4.5" aria-hidden="true" />
                </div>
                <div className="min-w-0 text-start">
                  <div
                    className={`text-xs sm:text-sm font-black truncate transition-colors ${
                      isActive
                        ? 'text-emerald-900 dark:text-emerald-200'
                        : 'text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white'
                    }`}
                  >
                    {label}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate hidden md:block">
                    {desc}
                  </div>
                </div>
              </div>

              {typeof tab.count === 'number' && (
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-mono font-black tabular-nums shrink-0 border transition-colors ${
                    isActive
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </>
          );

          const sharedCls = `group min-h-[48px] px-3.5 py-2 rounded-xl flex items-center justify-between gap-3 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
            isActive
              ? 'bg-emerald-50/90 dark:bg-emerald-950/50 border border-emerald-500/40 dark:border-emerald-500/30 shadow-xs'
              : 'border border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/70'
          }`;

          if (onTabChange) {
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onTabChange(tab.id)}
                className={sharedCls}
              >
                {innerContent}
              </button>
            );
          }

          return (
            <Link
              key={tab.id}
              href={tab.href}
              aria-current={isActive ? 'page' : undefined}
              className={sharedCls}
            >
              {innerContent}
            </Link>
          );
        })}
      </div>
    </div>
  );
};
