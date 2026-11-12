'use client';

/**
 * ExpandingSlatCard — بطاقة الشرائح التفاعلية القابلة للتمدد
 * ────────────────────────────────────────────────────────
 * Adapted from Uiverse.io by joe-watson-sbf with full Next.js, RTL,
 * multi-color variants, and dark/light theme support.
 */

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './ExpandingSlatCard.module.css';

export type SlatVariant = 'pink' | 'emerald' | 'amber' | 'cyan' | 'blue' | 'purple';

export interface SlatItem {
  id: string;
  title: string;
  titleAr?: string;
  subtitle?: string;
  icon?: React.ElementType;
  href?: string;
  onClick?: () => void;
  accentColor?: string;
  textColor?: string;
  badge?: string;
}

export interface ExpandingSlatCardProps {
  items?: SlatItem[];
  variant?: SlatVariant;
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
}

const VARIANT_COLORS: Record<SlatVariant, { border: string; text: string; badgeBg: string }> = {
  pink: {
    border: '#ff5a91',
    text: '#ff568e',
    badgeBg: 'rgba(255, 90, 145, 0.15)',
  },
  emerald: {
    border: '#10b981',
    text: '#34d399',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
  },
  amber: {
    border: '#f59e0b',
    text: '#fbbf24',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
  },
  cyan: {
    border: '#06b6d4',
    text: '#22d3ee',
    badgeBg: 'rgba(6, 182, 212, 0.15)',
  },
  blue: {
    border: '#3b82f6',
    text: '#60a5fa',
    badgeBg: 'rgba(59, 130, 246, 0.15)',
  },
  purple: {
    border: '#a855f7',
    text: '#c084fc',
    badgeBg: 'rgba(168, 85, 247, 0.15)',
  },
};

const DEFAULT_ITEMS: SlatItem[] = [
  { id: '1', title: 'OVERVIEW', titleAr: 'نظرة عامة', href: '/dashboard' },
  { id: '2', title: 'SCHEDULE', titleAr: 'الجدول', href: '/planning/baseline' },
  { id: '3', title: 'PROGRESS', titleAr: 'التقدم', href: '/site-workspace' },
  { id: '4', title: 'QUALITY', titleAr: 'الجودة', href: '/qc-dashboard' },
];

export function ExpandingSlatCard({
  items = DEFAULT_ITEMS,
  variant = 'pink',
  width = '210px',
  height = '254px',
  className = '',
  style,
  ariaLabel = 'Interactive Navigation Slat Card',
}: ExpandingSlatCardProps) {
  let isAr = false;
  try {
     
    const langContext = useLanguage();
    isAr = langContext?.locale === 'ar';
  } catch {
    // Graceful fallback when outside LanguageContext
    isAr = false;
  }

  const defaultColors = VARIANT_COLORS[variant] || VARIANT_COLORS.pink;

  const cardStyle: React.CSSProperties = {
    ...style,
    ['--card-width' as any]: typeof width === 'number' ? `${width}px` : width,
    ['--card-height' as any]: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={`${styles.card} ${className}`}
      style={cardStyle}
      role="region"
      aria-label={ariaLabel}
    >
      {items.map((item) => {
        const borderCol = item.accentColor || defaultColors.border;
        const textCol = item.textColor || item.accentColor || defaultColors.text;
        const displayTitle = (isAr && item.titleAr) ? item.titleAr : item.title;
        const Icon = item.icon;

        const slatStyle: React.CSSProperties = {
          ['--slat-border-color' as any]: borderCol,
          ['--slat-text-color' as any]: textCol,
        };

        const content = (
          <>
            {Icon && (
              <div className={styles.iconWrapper}>
                <Icon className="w-5 h-5" />
              </div>
            )}
            <span className={styles.label}>{displayTitle}</span>
            {item.badge && (
              <span className={styles.badge} style={{ color: textCol }}>
                {item.badge}
              </span>
            )}
          </>
        );

        if (item.href) {
          return (
            <Link
              key={item.id}
              href={item.href}
              className={styles.slat}
              style={slatStyle}
              title={displayTitle}
              tabIndex={0}
            >
              {content}
            </Link>
          );
        }

        if (item.onClick) {
          return (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              className={styles.slat}
              style={slatStyle}
              title={displayTitle}
            >
              {content}
            </button>
          );
        }

        return (
          <div
            key={item.id}
            className={styles.slat}
            style={slatStyle}
            title={displayTitle}
            tabIndex={0}
          >
            {content}
          </div>
        );
      })}
    </div>
  );
}
