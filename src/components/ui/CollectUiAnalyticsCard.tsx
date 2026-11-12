'use client';

/**
 * CollectUiAnalyticsCard — بطاقة التحليلات وجداول المتابعة الميدانية بنظام CollectUI
 * ──────────────────────────────────────────────────────────────────────────
 * Auto-extracted from CollectUI Dashboard Inspiration:
 * https://collectui.com/designs/dashboard-ui-design-inspiration/017ff951-16d5-444a-bdda-1cb379bf6b9d
 */

import React from 'react';
import { Sparkles, TrendingUp, ArrowUpRight, BarChart2, RefreshCw } from 'lucide-react';
import styles from './CollectUiAnalyticsCard.module.css';

export interface CollectUiDataRow {
  id: string;
  code?: string;
  title: string;
  category?: string;
  status: 'completed' | 'in_progress' | 'pending' | 'delayed';
  statusLabel?: string;
  value: string;
  subValue?: string;
  progress?: number;
  actionLabel?: string;
  onAction?: () => void;
}

export interface CollectUiAnalyticsCardProps {
  title?: string;
  subtitle?: string;
  metric?: string;
  metricLabel?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  rows?: CollectUiDataRow[];
  theme?: 'dark' | 'light';
  className?: string;
  locale?: 'ar' | 'en';
  dir?: 'rtl' | 'ltr';
  onExport?: () => void;
  onRefresh?: () => void;
}

export const CollectUiAnalyticsCard: React.FC<CollectUiAnalyticsCardProps> = ({
  title,
  subtitle,
  metric,
  metricLabel,
  trend,
  rows,
  theme = 'dark',
  className = '',
  locale,
  dir,
  onExport,
  onRefresh,
}) => {
  const isAr = locale ? locale === 'ar' : dir !== 'ltr';
  const resolvedDir = dir || (isAr ? 'rtl' : 'ltr');
  const isDark = theme === 'dark';

  const defaultTitle = isAr
    ? 'تحليلات الأداء الميداني وجدول الكميات'
    : 'Field Performance & BOQ Analytics';

  const defaultSubtitle = isAr
    ? 'رصد فوري لتقدم الأعمال ونسب الإنجاز التراكمي وتدفق المستخلصات'
    : 'Real-time telemetry on site progress, BOQ burn, and inspection gates';

  const defaultMetric = metric || '84.6%';
  const defaultMetricLabel = metricLabel || (isAr ? 'معدل الإنجاز العام' : 'Overall Progress Rate');

  const defaultTrend = trend || {
    value: isAr ? '+4.8% هذا الشهر' : '+4.8% vs last month',
    isPositive: true,
  };

  const defaultRows: CollectUiDataRow[] = [
    {
      id: 'row-1',
      code: 'CON-001',
      title: isAr ? 'أعمال الخرسانة المسلحة للأساسات' : 'Reinforced Concrete Foundations',
      category: isAr ? 'هندسة مدنية' : 'Civil Works',
      status: 'completed',
      statusLabel: isAr ? 'مكتمل' : 'Completed',
      value: '2,400 m³',
      actionLabel: isAr ? 'عرض الحصر' : 'View BOQ',
    },
    {
      id: 'row-2',
      code: 'BOQ-042',
      title: isAr ? 'توريد وتركيب الهياكل المعدنية' : 'Steel Structure Fabrication & Erection',
      category: isAr ? 'إنشائي' : 'Structural',
      status: 'in_progress',
      statusLabel: isAr ? 'قيد التنفيذ' : 'In Progress',
      value: '680 Ton',
      actionLabel: isAr ? 'متابعة' : 'Track',
    },
    {
      id: 'row-3',
      code: 'MEP-104',
      title: isAr ? 'تمديدات شبكات التغذية والإطفاء' : 'Firefighting & MEP Piping Networks',
      category: isAr ? 'كهروميكانيك' : 'MEP',
      status: 'pending',
      statusLabel: isAr ? 'معتمد للتوريد' : 'Approved',
      value: '1,250 m',
      actionLabel: isAr ? 'فحص ITP' : 'Inspect',
    },
    {
      id: 'row-4',
      code: 'QC-ITP-9',
      title: isAr ? 'اختبارات ضغط الخرسانة وفحص العزل' : 'Concrete Compressive Tests & Insulation IR',
      category: isAr ? 'ضبط جودة' : 'Quality QC',
      status: 'completed',
      statusLabel: isAr ? 'مطابق' : 'Passed',
      value: '99.2%',
      actionLabel: isAr ? 'شهادة' : 'Cert',
    },
  ];

  const dataRows = rows && rows.length > 0 ? rows : defaultRows;

  return (
    <div
      className={[styles.wrapper, isDark ? styles.cardDark : styles.cardLight, className].filter(Boolean).join(' ')}
      dir={resolvedDir}
      aria-label="CollectUI Analytics Card"
    >
      <div className={isDark ? styles.cardInnerDark : styles.cardInnerLight}>
        {/* Top Header */}
        <div className={isDark ? styles.headerRow : styles.headerRowLight}>
          <div className={styles.headerLeft}>
            <div className={styles.badge}>
              <Sparkles className="w-3 h-3" />
              <span>{isAr ? 'بيانات حية • CollectUI 017' : 'Live Telemetry • CollectUI 017'}</span>
            </div>
            <h3 className={isDark ? styles.titleDark : styles.titleLight}>
              {title || defaultTitle}
            </h3>
            <p className={isDark ? styles.subtitleDark : styles.subtitleLight}>
              {subtitle || defaultSubtitle}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                type="button"
                className={styles.btnFilled}
                onClick={onRefresh}
                title={isAr ? 'تحديث البيانات' : 'Refresh'}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isAr ? 'تحديث' : 'Sync'}</span>
              </button>
            )}
            {onExport && (
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={onExport}
              >
                <span>{isAr ? 'تصدير' : 'Export'}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* KPI Spotlight */}
        <div className={styles.kpiSpotlight}>
          <span className={isDark ? styles.metricValueDark : styles.metricValueLight}>
            {defaultMetric}
          </span>
          <span className={isDark ? styles.metricLabelDark : styles.metricLabelLight}>
            {defaultMetricLabel}
          </span>
          {defaultTrend && (
            <span className={styles.trendPositive}>
              <TrendingUp className="w-3 h-3" />
              <span>{defaultTrend.value}</span>
            </span>
          )}
        </div>

        {/* Data Rows */}
        <div className={styles.tableContainer}>
          {dataRows.map((row) => (
            <div
              key={row.id}
              className={isDark ? styles.dataRowDark : styles.dataRowLight}
            >
              <div className={styles.rowMain}>
                {row.code && <span className={styles.codeBadge}>{row.code}</span>}
                <div className={styles.rowMeta}>
                  <span className={isDark ? styles.rowTitleDark : styles.rowTitleLight}>
                    {row.title}
                  </span>
                  {row.category && (
                    <span className={styles.rowCategory}>{row.category}</span>
                  )}
                </div>
              </div>

              <div className={styles.rowValues}>
                <span className={isDark ? styles.valueTextDark : styles.valueTextLight}>
                  {row.value}
                </span>

                <span
                  className={
                    row.status === 'completed'
                      ? styles.statusCompleted
                      : row.status === 'in_progress'
                      ? styles.statusProgress
                      : styles.statusPending
                  }
                >
                  {row.statusLabel || row.status}
                </span>

                {row.actionLabel && (
                  <button
                    type="button"
                    className={styles.btnFilled}
                    onClick={row.onAction}
                  >
                    <span>{row.actionLabel}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
