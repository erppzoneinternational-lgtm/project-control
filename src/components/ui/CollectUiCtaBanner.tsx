'use client';

import React from 'react';
import styles from './CollectUiCtaBanner.module.css';

export interface CollectUiCtaFeature {
  id?: string;
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
}

export interface CollectUiCtaBannerProps {
  badgeText?: string;
  badgeIcon?: React.ReactNode;
  title?: string;
  description?: string;
  features?: CollectUiCtaFeature[];
  primaryCtaText?: string;
  primaryCtaHref?: string;
  onPrimaryCtaClick?: () => void;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
  onSecondaryCtaClick?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  locale?: 'ar' | 'en';
  dir?: 'rtl' | 'ltr';
  className?: string;
}

export const CollectUiCtaBanner: React.FC<CollectUiCtaBannerProps> = ({
  badgeText,
  badgeIcon,
  title,
  description,
  features,
  primaryCtaText,
  primaryCtaHref,
  onPrimaryCtaClick,
  secondaryCtaText,
  secondaryCtaHref,
  onSecondaryCtaClick,
  theme = 'light',
  locale,
  dir,
  className,
}) => {
  const isAr = locale ? locale === 'ar' : dir !== 'ltr';
  const resolvedDir = dir || (isAr ? 'rtl' : 'ltr');

  const defaultBadgeText = isAr
    ? 'معتمد وموثوق من استشاريي إدارة المشاريع PMI & FIDIC'
    : 'Trusted by PMI, FIDIC, ISO 9001 & Top Construction Firms';

  const defaultTitle = isAr
    ? 'عزز كفاءة التحكم في عقود ومشاريع التشييد الكبرى'
    : 'Boost Governance Across Megaproject Contracts & Execution';

  const defaultDescription = isAr
    ? 'منظومة موحدة لربط بنود جدول الكميات بالبرنامج الزمني، حوكمة دورات الاعتماد، ومطابقة اعتمادات الجودة الفنية بدقة استثنائية.'
    : 'Unified command center linking BOQ line items to master schedules, inspection requests, and automated financial certifications.';

  const defaultFeatures: CollectUiCtaFeature[] = isAr
    ? [
        { id: 'f1', icon: '🔗', title: 'ربط WBS والكميات', subtitle: 'تكامل 100% مع BOQ' },
        { id: 'f2', icon: '⚡', title: 'دورة اعتماد فورية', subtitle: 'اعتماد التوريدات والموقع خلال 24h' },
        { id: 'f3', icon: '🛡️', title: 'حوكمة الجودة والسلامة', subtitle: 'مطابقة صارمة لـ IR و ITP' },
        { id: 'f4', icon: '📊', title: 'تحليلات القيمة المكتسبة', subtitle: 'مؤشرات EVM و S-Curve دقيقة' },
      ]
    : [
        { id: 'f1', icon: '🔗', title: 'WBS & BOQ Synergy', subtitle: '100% live schedule integration' },
        { id: 'f2', icon: '⚡', title: 'Fast Approval Loop', subtitle: 'Site & TO sign-offs within 24h' },
        { id: 'f3', icon: '🛡️', title: 'Strict QC / HSE Gate', subtitle: 'Zero IPC without verified IR' },
        { id: 'f4', icon: '📊', title: 'Earned Value Analytics', subtitle: 'Real-time EVM & S-Curve KPIs' },
      ];

  const defaultPrimaryCta = isAr ? 'ابدأ التشغيل المعتمد ➔' : 'Deploy Governed Portal ➔';
  const defaultSecondaryCta = isAr ? 'استعراض المواصفات القياسية' : 'Explore Design Specs';

  const activeFeatures = features || defaultFeatures;

  const wrapperClasses = [
    styles.bannerWrapper,
    theme === 'dark' ? styles.themeDark : styles.themeLight,
    resolvedDir === 'rtl' ? styles.rtl : styles.ltr,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={wrapperClasses} dir={resolvedDir} aria-label="CollectUI CTA Banner">
      <div className={styles.innerContainer}>
        {/* Badge Row */}
        <div className={styles.badgeRow}>
          <div className={styles.badge}>
            <span className={styles.badgePulse} aria-hidden="true" />
            {badgeIcon ? <span aria-hidden="true">{badgeIcon}</span> : null}
            <span>{badgeText || defaultBadgeText}</span>
          </div>
        </div>

        {/* Header Block */}
        <div className={styles.headerBlock}>
          <h2 className={styles.title}>{title || defaultTitle}</h2>
          <p className={styles.description}>{description || defaultDescription}</p>
        </div>

        {/* 4-Feature Grid */}
        <div className={styles.featuresGrid}>
          {activeFeatures.map((feat, idx) => (
            <div key={feat.id || idx} className={styles.featureCard}>
              <div className={styles.featureTop}>
                {feat.icon && <div className={styles.featureIconBox}>{feat.icon}</div>}
                <div className={styles.featureTitle}>{feat.title}</div>
              </div>
              {feat.subtitle && <div className={styles.featureSubtitle}>{feat.subtitle}</div>}
            </div>
          ))}
        </div>

        {/* Actions Bar */}
        <div className={styles.actionsBar}>
          {primaryCtaHref ? (
            <a href={primaryCtaHref} className={styles.btnCta}>
              {primaryCtaText || defaultPrimaryCta}
            </a>
          ) : (
            <button type="button" onClick={onPrimaryCtaClick} className={styles.btnCta}>
              {primaryCtaText || defaultPrimaryCta}
            </button>
          )}

          {secondaryCtaHref ? (
            <a href={secondaryCtaHref} className={styles.btnSecondary}>
              {secondaryCtaText || defaultSecondaryCta}
            </a>
          ) : (
            <button type="button" onClick={onSecondaryCtaClick} className={styles.btnSecondary}>
              {secondaryCtaText || defaultSecondaryCta}
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default CollectUiCtaBanner;
