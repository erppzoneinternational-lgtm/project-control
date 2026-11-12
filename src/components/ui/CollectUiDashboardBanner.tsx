'use client';

/**
 * CollectUiDashboardBanner — بنر ومؤشرات لوحة القيادة بنظام CollectUI
 * ──────────────────────────────────────────────────────────────────────────
 * Auto-extracted from CollectUI Dashboard Inspiration:
 * - Header: Geist font, 24px, 600 weight, -0.96px letter-spacing
 * - Palette: #ffffff canvas, #f5f6f8 secondary surfaces, #155dfc primary CTA, #248a3d accent
 * - Official CollectUI buttons: .btn-primary, .btn-filled, .btn-outline, .btn-cta
 * - 4px base spacing grid, 16px radius cards, 10px radius buttons
 * - RTL/LTR & Light/Dark mode support
 */

import React from 'react';
import Link from 'next/link';
import {
  FolderKanban,
  CheckCircle2,
  Users,
  Activity,
  Plus,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import styles from './CollectUiDashboardBanner.module.css';

export interface CollectUiDashboardBannerProps {
  title?: string;
  subtitle?: string;
  totalProjects?: number;
  activeProjects?: number;
  completionRate?: number;
  totalStakeholders?: number;
  onNewProjectHref?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
  dir?: 'rtl' | 'ltr';
  locale?: 'ar' | 'en';
}

export const CollectUiDashboardBanner: React.FC<CollectUiDashboardBannerProps> = ({
  title,
  subtitle,
  totalProjects = 12,
  activeProjects = 8,
  completionRate = 74,
  totalStakeholders = 48,
  onNewProjectHref = '/projects/new',
  onRefresh,
  isRefreshing = false,
  className = '',
  dir,
  locale,
}) => {
  const isAr = locale ? locale === 'ar' : dir !== 'ltr';
  const resolvedDir = dir || (isAr ? 'rtl' : 'ltr');

  const defaultTitle = isAr
    ? 'لوحة القيادة والمؤشرات التنفيذية'
    : 'Dashboard UI Design Inspiration';

  const defaultSubtitle = isAr
    ? 'واجهة غنية بالبيانات والرقابة الميدانية لإدارة المشروعات والشركاء الهندسيين.'
    : 'Data-rich and functional dashboard user interfaces.';

  return (
    <div className={`${styles.bannerWrapper} ${className}`} dir={resolvedDir}>
      {/* Top Header & Actions */}
      <div className={styles.headerRow}>
        <div>
          <div className={styles.badge}>
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAr ? 'نظام تحليلات Pzone • Dashboard v2.5' : 'Dashboard UI Design Inspiration'}</span>
          </div>
          <h1 className={styles.title}>{title || defaultTitle}</h1>
          <p className={styles.subtitle}>{subtitle || defaultSubtitle}</p>
        </div>

        <div className={styles.actionButtons}>
          <Link href={onNewProjectHref} className={styles.btnCta}>
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{isAr ? 'مشروع جديد' : 'New Project'}</span>
          </Link>

          <Link href="/stakeholders" className={styles.btnPrimary}>
            <Users className="w-3.5 h-3.5" />
            <span>{isAr ? 'دليل الشركاء' : 'Stakeholders'}</span>
          </Link>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className={styles.btnOutline}
              title={isAr ? 'تحديث البيانات' : 'Refresh Data'}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? (isAr ? 'جاري...' : 'Syncing...') : (isAr ? 'مزامنة' : 'Sync')}</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid (4px multiples, 16px radius, #f5f6f8 background) */}
      <div className={styles.statsGrid}>
        {/* Card 1: Total Projects */}
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>{isAr ? 'إجمالي المشاريع' : 'Total Projects'}</span>
            <div className={styles.statIconWrap}>
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className={styles.statValue}>{totalProjects}</div>
          <div className={styles.statSub}>
            <TrendingUp className="w-3 h-3" />
            <span>{isAr ? 'مشاريع المنظومة' : 'Portfolio Total'}</span>
          </div>
        </div>

        {/* Card 2: Active Projects */}
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>{isAr ? 'المشاريع النشطة' : 'Active Projects'}</span>
            <div className={styles.statIconWrap} style={{ color: '#248a3d' }}>
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className={styles.statValue}>{activeProjects}</div>
          <div className={styles.statSub}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{isAr ? 'قيد التنفيذ الميداني' : 'On-Site Active'}</span>
          </div>
        </div>

        {/* Card 3: Completion Rate */}
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>{isAr ? 'نسبة الإنجاز المالي' : 'Avg Completion'}</span>
            <div className={styles.statIconWrap} style={{ color: '#155dfc' }}>
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className={styles.statValue}>{completionRate}%</div>
          <div className={styles.statSub}>
            <TrendingUp className="w-3 h-3" />
            <span>{isAr ? 'معدل الإنجاز العام' : 'Weighted Progress'}</span>
          </div>
        </div>

        {/* Card 4: Team & Stakeholders */}
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>{isAr ? 'فريق العمل والشركاء' : 'Stakeholders'}</span>
            <div className={styles.statIconWrap}>
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className={styles.statValue}>{totalStakeholders}</div>
          <div className={`${styles.statSub} ${styles.statSubNeutral}`}>
            <span>{isAr ? 'شريك ومهندس مسجل' : 'Registered Network'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectUiDashboardBanner;
