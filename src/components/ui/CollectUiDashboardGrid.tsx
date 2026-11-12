'use client';

/**
 * CollectUiDashboardGrid — شبكة بطاقات ومؤشرات لوحة القيادة بنظام CollectUI
 * ──────────────────────────────────────────────────────────────────────────
 * Auto-extracted from CollectUI Dashboard Inspiration:
 * https://collectui.com/designs/dashboard-ui-design-inspiration/b4e496d5-52bb-4710-8167-fc21779ad5a9
 */

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Sparkles,
  Layers,
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import styles from './CollectUiDashboardGrid.module.css';

export interface CollectUiGridCardItem {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  metric?: string | number;
  metricLabel?: string;
  code?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon?: React.ComponentType<{ className?: string }>;
  buttonType?: 'primary' | 'filled' | 'outline' | 'cta';
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export interface CollectUiDashboardGridProps {
  title?: string;
  subtitle?: string;
  items?: CollectUiGridCardItem[];
  columns?: 2 | 3 | 4;
  variant?: 'dark' | 'light' | 'mixed';
  className?: string;
  locale?: 'ar' | 'en';
  dir?: 'rtl' | 'ltr';
  ctaLabel?: string;
  onCtaClick?: () => void;
}

export const CollectUiDashboardGrid: React.FC<CollectUiDashboardGridProps> = ({
  title,
  subtitle,
  items,
  columns = 3,
  variant = 'mixed',
  className = '',
  locale,
  dir,
  ctaLabel,
  onCtaClick,
}) => {
  const isAr = locale ? locale === 'ar' : dir !== 'ltr';
  const resolvedDir = dir || (isAr ? 'rtl' : 'ltr');

  const defaultTitle = isAr
    ? 'مؤشرات الأداء الميداني والرقابة الذكية'
    : 'Dashboard UI Design Inspiration';

  const defaultSubtitle = isAr
    ? 'بيانات دقيقة وتحليلات تنفيذية تدعم اتخاذ القرارات الهندسية والمؤسسية.'
    : 'Data-rich and functional dashboard user interfaces.';

  const defaultItems: CollectUiGridCardItem[] = [
    {
      id: 'metric-progress',
      title: isAr ? 'نسبة الإنجاز التراكمي' : 'Cumulative Progress',
      subtitle: isAr ? 'مقارنة بالجدول الزمني المعتمد (SPI)' : 'Compared to approved baseline (SPI)',
      badge: isAr ? 'ميداني مباشر' : 'Live Site',
      metric: '74.2%',
      metricLabel: isAr ? 'مستهدف 80%' : 'Target 80%',
      code: 'WBS.LVL-3',
      trend: { value: '+5.4%', isPositive: true },
      icon: BarChart3,
      buttonType: 'primary',
      actionLabel: isAr ? 'سجل الإنجاز' : 'View Progress',
    },
    {
      id: 'metric-cost',
      title: isAr ? 'الصرف والسيولة والمستخلصات' : 'Cash Flow & IPC Claims',
      subtitle: isAr ? 'المستخلصات الجارية وقيمة الأعمال المنفذة' : 'IPC approved claims & actual cost',
      badge: isAr ? 'اعتماد مالي' : 'Certified',
      metric: '42.8M',
      metricLabel: isAr ? 'مليون جنيه' : 'EGP Total',
      code: 'FIN-IPC-08',
      trend: { value: '+12.1%', isPositive: true },
      icon: Layers,
      buttonType: 'cta',
      actionLabel: isAr ? 'المستخلص الجاري' : 'Open IPC',
    },
    {
      id: 'metric-qc',
      title: isAr ? 'فحوصات الجودة والسلامة' : 'Quality & HSE Audits',
      subtitle: isAr ? 'طلبات الفحص المعتمدة من الاستشاري' : 'Consultant approved IR & NCR closure',
      badge: isAr ? 'مطابقة 98%' : 'Passed 98%',
      metric: '98.6%',
      metricLabel: isAr ? 'نسبة القبول' : 'Pass Rate',
      code: 'QC-ITP-V4',
      trend: { value: '+1.8%', isPositive: true },
      icon: ShieldCheck,
      buttonType: 'filled',
      actionLabel: isAr ? 'سجل الفحوصات' : 'Inspect Log',
    },
  ];

  const cardItems = items && items.length > 0 ? items : defaultItems;

  const colsClass = columns === 2 ? styles.cols2 : columns === 4 ? styles.cols4 : styles.cols3;

  return (
    <div className={`${styles.container} ${className}`} dir={resolvedDir}>
      {/* Header Row */}
      <div className={styles.headerRow}>
        <div className={styles.headerContent}>
          <div className={styles.badge}>
            <Sparkles className="w-3 h-3" />
            <span>{isAr ? 'منظومة الرقابة • CollectUI v2.5' : 'CollectUI Dashboard Spec'}</span>
          </div>
          <h2 className={styles.title}>{title || defaultTitle}</h2>
          <p className={styles.subtitle}>{subtitle || defaultSubtitle}</p>
        </div>

        {ctaLabel && (
          <div>
            <button
              type="button"
              className={styles.btnCta}
              onClick={onCtaClick}
            >
              <span>{ctaLabel}</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className={`${styles.grid} ${colsClass}`}>
        {cardItems.map((item, index) => {
          const isDarkCard =
            variant === 'dark' || (variant === 'mixed' && index === 0);
          const IconComp = item.icon || CheckCircle2;

          return (
            <div
              key={item.id}
              className={isDarkCard ? styles.cardDark : styles.cardLight}
            >
              <div className={isDarkCard ? styles.cardInnerDark : styles.cardInnerLight}>
                {/* Top: Title & Icon */}
                <div className={styles.cardTop}>
                  <div className={styles.cardMeta}>
                    {item.code && (
                      <span className={styles.codeTag}>{item.code}</span>
                    )}
                    <h3 className={isDarkCard ? styles.cardTitleDark : styles.cardTitleLight}>
                      {item.title}
                    </h3>
                    {item.subtitle && (
                      <p className={isDarkCard ? styles.cardSubtitleDark : styles.cardSubtitleLight}>
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                  <div className={isDarkCard ? styles.cardIconDark : styles.cardIconLight}>
                    <IconComp className="w-5 h-5" />
                  </div>
                </div>

                {/* Middle: Metric & Trend */}
                <div>
                  <div className={styles.metricArea}>
                    <span className={isDarkCard ? styles.metricValueDark : styles.metricValueLight}>
                      {item.metric}
                    </span>
                    {item.metricLabel && (
                      <span className={isDarkCard ? styles.metricLabelDark : styles.metricLabelLight}>
                        {item.metricLabel}
                      </span>
                    )}
                    {item.trend && (
                      <span
                        className={
                          item.trend.isPositive ? styles.trendPositive : styles.trendNegative
                        }
                      >
                        {item.trend.isPositive ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        <span>{item.trend.value}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Footer & CollectUI Buttons */}
                <div className={isDarkCard ? styles.cardFooter : styles.cardFooterLight}>
                  {item.badge ? (
                    <span className={styles.badge}>{item.badge}</span>
                  ) : (
                    <span />
                  )}

                  {item.actionLabel && (
                    <button
                      type="button"
                      className={
                        item.buttonType === 'cta'
                          ? styles.btnCta
                          : item.buttonType === 'filled'
                          ? styles.btnFilled
                          : item.buttonType === 'outline'
                          ? styles.btnOutline
                          : styles.btnPrimary
                      }
                      onClick={item.onAction}
                    >
                      <span>{item.actionLabel}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
