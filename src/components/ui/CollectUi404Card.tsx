'use client';

/**
 * CollectUi404Card — شاشة الخطأ 404 المستوحاة من نظام تصميم CollectUI
 * ──────────────────────────────────────────────────────────────────────────
 * Auto-extracted design system from CollectUI:
 * - Typography: Geist font, heading weight 600, letter-spacing -0.96px
 * - Colors: Canvas (#ffffff), Primary (#155dfc), Secondary (#248a3d), Card (#242424)
 * - Exact button classes: .btn-primary, .btn-filled, .btn-outline, .btn-cta
 * - 4px base spacing multiples, 10px+ friendly rounded corners
 * - Dual language (Arabic & English) support
 */

import React from 'react';
import Link from 'next/link';
import { Home, ArrowLeft, ArrowRight, Compass, Users, Sparkles, RefreshCw } from 'lucide-react';
import styles from './CollectUi404Card.module.css';

export interface CollectUi404CardProps {
  title?: string;
  subtitle?: string;
  homeHref?: string;
  projectsHref?: string;
  stakeholdersHref?: string;
  dir?: 'rtl' | 'ltr';
  locale?: 'ar' | 'en';
}

export const CollectUi404Card: React.FC<CollectUi404CardProps> = ({
  title,
  subtitle,
  homeHref = '/dashboard',
  projectsHref = '/projects',
  stakeholdersHref = '/stakeholders',
  dir = 'rtl',
  locale = 'ar',
}) => {
  const isAr = locale === 'ar' || dir === 'rtl';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const defaultTitle = isAr
    ? 'الصفحة المطلوبة غير متوفرة'
    : '404 Page UI Design Inspiration';

  const defaultSubtitle = isAr
    ? 'يبدو أن الرابط الذي تبحث عنه قد تم نقله أو حذفه أو لم يعد متاحاً في منظومة Pzone ERP.'
    : 'Creative and fun 404 error page designs. The requested resource could not be found.';

  return (
    <div className={styles.container} dir={dir}>
      {/* 1. Header Badge */}
      <div className={styles.badge}>
        <Sparkles className="w-3.5 h-3.5" />
        <span>{isAr ? 'خطأ في المسار • 404 Not Found' : '404 Page UI Design Inspiration'}</span>
      </div>

      {/* 2. Hero Section */}
      <h1 className={styles.heroHeading}>{title || defaultTitle}</h1>
      <p className={styles.heroSubtitle}>{subtitle || defaultSubtitle}</p>

      {/* 3. Central Dark Card (#242424, 16px radius) */}
      <div className={styles.card}>
        <div className={styles.bigCode}>
          <span>4</span>
          <span className={styles.bigCodeAccent}>0</span>
          <span>4</span>
        </div>

        <p className={styles.cardDesc}>
          {isAr
            ? 'يمكنك العودة إلى لوحة التحكم الرئيسية أو استعراض مشروعات وسجلات المنظومة أدناه.'
            : 'Explore available modules or return safely to the executive dashboard.'}
        </p>

        {/* Buttons matching CollectUI specifications */}
        <div className={styles.actionsGrid}>
          {/* CTA Button: Primary #155dfc */}
          <Link href={homeHref} className={styles.btnCta}>
            <Home className="w-4 h-4" />
            <span>{isAr ? 'العودة للرئيسية' : 'Return Home'}</span>
          </Link>

          {/* btn-primary: #f5f6f8 with #248a3d text */}
          <Link href={projectsHref} className={styles.btnPrimary}>
            <Compass className="w-3.5 h-3.5" />
            <span>{isAr ? 'دليل المشروعات' : 'Projects'}</span>
          </Link>

          {/* btn-filled: #f5f6f8 with #464646 text */}
          <Link href={stakeholdersHref} className={styles.btnFilled}>
            <Users className="w-3.5 h-3.5" />
            <span>{isAr ? 'الشركاء وفريق العمل' : 'Stakeholders'}</span>
          </Link>

          {/* btn-outline: transparent with 1px border */}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className={styles.btnOutline}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{isAr ? 'إعادة المحاولة' : 'Retry'}</span>
          </button>
        </div>
      </div>

      {/* 4. Quick Links Footer */}
      <nav className={styles.quickLinks} aria-label="روابط سريعة">
        <Link href={homeHref} className={styles.quickLink}>
          <span>{isAr ? 'لوحة القيادة' : 'Dashboard'}</span>
          <ArrowIcon className="w-3 h-3" />
        </Link>
        <span className="text-slate-300 dark:text-slate-700">•</span>
        <Link href={projectsHref} className={styles.quickLink}>
          <span>{isAr ? 'المشاريع النشطة' : 'Active Projects'}</span>
          <ArrowIcon className="w-3 h-3" />
        </Link>
        <span className="text-slate-300 dark:text-slate-700">•</span>
        <Link href={stakeholdersHref} className={styles.quickLink}>
          <span>{isAr ? 'دليل الشركاء' : 'Directory'}</span>
          <ArrowIcon className="w-3 h-3" />
        </Link>
      </nav>
    </div>
  );
};

export default CollectUi404Card;
