'use client';

import React from 'react';
import Link from 'next/link';
import { Home, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { resolveFocusedHomePath } from '@/lib/config/module-visibility';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  showHomeIcon?: boolean;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  className = '',
  showHomeIcon = true,
}) => {
  const { t, locale } = useLanguage();
  const isRtl = locale === 'ar';

  const homeLabel = t('r3.breadcrumbs.home');
  const allItems: BreadcrumbItem[] = showHomeIcon
    ? [
        {
          label: homeLabel,
          href: resolveFocusedHomePath('/'),
          icon: Home,
        },
        ...items,
      ]
    : items;

  // JSON-LD BreadcrumbList Schema
  const jsonLdSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: allItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.href ? `https://pzoneinternational.com${item.href}` : undefined,
    })),
  };

  const ChevronIcon = isRtl ? ChevronLeft : ChevronRight;

  return (
    <nav aria-label="Breadcrumb" dir={isRtl ? 'rtl' : 'ltr'} className={`flex items-center text-xs ${className}`}>
      {/* Inline SEO JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLdSchema).replace(/</g, '\\u003c'),
        }}
      />

      <ol className="flex flex-wrap items-center gap-1.5 text-slate-400">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const Icon = item.icon;

          return (
            <li key={index} className="inline-flex items-center gap-1.5">
              {index > 0 && (
                <ChevronIcon className="h-3.5 w-3.5 text-slate-500 shrink-0 rtl:rotate-0 ltr:rotate-0" />
              )}

              {isLast || !item.href ? (
                <span
                  className={`inline-flex items-center gap-1 font-semibold ${
                    isLast ? 'text-white' : 'text-slate-400'
                  }`}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {Icon && <Icon className="h-3.5 w-3.5 text-slate-400" />}
                  <span>{item.label}</span>
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {Icon && <Icon className="h-3.5 w-3.5" />}
                  <span>{item.label}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
