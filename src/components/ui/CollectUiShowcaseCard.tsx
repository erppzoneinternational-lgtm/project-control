'use client';

import React from 'react';
import styles from './CollectUiShowcaseCard.module.css';

export interface CollectUiShowcaseCardProps {
  id?: string;
  title?: string;
  subtitle?: string;
  category?: string;
  imageUrl?: string;
  imageAlt?: string;
  authorName?: string;
  authorInitial?: string;
  statusBadge?: string;
  statusType?: 'success' | 'warning' | 'neutral';
  metricsValue?: string | number;
  metricsIcon?: React.ReactNode;
  onClick?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  locale?: 'ar' | 'en';
  dir?: 'rtl' | 'ltr';
  className?: string;
}

export const CollectUiShowcaseCard: React.FC<CollectUiShowcaseCardProps> = ({
  id,
  title,
  subtitle,
  category,
  imageUrl,
  imageAlt,
  authorName,
  authorInitial,
  statusBadge,
  statusType = 'success',
  metricsValue,
  metricsIcon,
  onClick,
  theme = 'dark',
  locale,
  dir,
  className,
}) => {
  const isAr = locale ? locale === 'ar' : dir !== 'ltr';
  const resolvedDir = dir || (isAr ? 'rtl' : 'ltr');

  const defaultCategory = isAr ? 'هندسة إنشائية' : 'Structural Engineering';
  const defaultTitle = isAr ? 'أعمال صب الخرسانة المسلحة' : 'Reinforced Concrete Pouring';
  const defaultAuthorName = isAr ? 'م. فاروق السعيد' : 'Eng. Farhan';
  const defaultAuthorInitial = authorInitial || (defaultAuthorName ? defaultAuthorName.charAt(0) : 'F');
  const defaultStatusBadge = isAr ? 'معتمد 100%' : 'Approved 100%';
  const defaultMetricsValue = isAr ? '2,850 م³' : '2,850 m³';

  const activeCategory = category || defaultCategory;
  const activeTitle = title || defaultTitle;
  const activeAuthorName = authorName || defaultAuthorName;
  const activeStatusBadge = statusBadge || defaultStatusBadge;
  const activeMetricsValue = metricsValue || defaultMetricsValue;

  const statusClass =
    statusType === 'warning'
      ? styles.statusWarning
      : statusType === 'neutral'
      ? styles.statusNeutral
      : styles.statusSuccess;

  const containerClasses = [
    styles.cardContainer,
    theme === 'light' ? styles.themeLight : styles.themeDark,
    resolvedDir === 'rtl' ? styles.rtl : styles.ltr,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article
      id={id}
      className={containerClasses}
      dir={resolvedDir}
      onClick={onClick}
      role="article"
      aria-label={activeTitle}
    >
      {/* 16:10 Visual Ratio Container */}
      <div className={styles.aspectContainer}>
        {/* Category Pill */}
        <span className={styles.badgeTopStart}>{activeCategory}</span>

        {/* Status Pill */}
        <span className={[styles.badgeTopEnd, statusClass].join(' ')}>
          <span className={styles.pulseDot} aria-hidden="true" />
          <span>{activeStatusBadge}</span>
        </span>

        {/* Preview image or fallback */}
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={imageAlt || activeTitle}
            className={styles.previewImage}
            loading="lazy"
          />
        ) : (
          <div className={styles.placeholderVisual}>
            <div className={styles.placeholderIcon} aria-hidden="true">
              🏗️
            </div>
            <div className={styles.placeholderText}>{activeTitle}</div>
          </div>
        )}
      </div>

      {/* Bottom Metadata Bar */}
      <div className={styles.bottomBar}>
        <div className={styles.authorPill}>
          <div className={styles.avatar} aria-hidden="true">
            {defaultAuthorInitial}
          </div>
          <span className={styles.authorText} title={activeAuthorName}>
            {activeAuthorName}
          </span>
        </div>

        <div className={styles.statsPill}>
          {metricsIcon ? (
            <span className={styles.statsIcon} aria-hidden="true">
              {metricsIcon}
            </span>
          ) : null}
          <span>{activeMetricsValue}</span>
        </div>
      </div>
    </article>
  );
};

export default CollectUiShowcaseCard;
