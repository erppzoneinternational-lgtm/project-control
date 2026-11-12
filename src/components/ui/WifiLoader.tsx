'use client';

/**
 * WifiLoader — مؤشر تحميل شبكي تفاعلي (WiFi Pulse Loader)
 * ──────────────────────────────────────────────────────────
 * Adapted from Uiverse.io by mobinkakei.
 * Features:
 *  - Three-tier concentric pulsating WiFi signal arcs
 *  - Sweep animation with clip-path text reveal
 *  - Dark / light mode support and custom color themes
 *  - Responsive scaling ('sm' | 'md' | 'lg')
 *  - Subtitle and fullscreen modal support
 */

import React from 'react';
import styles from './WifiLoader.module.css';

export interface WifiLoaderProps {
  text?: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'indigo' | 'emerald' | 'blue';
  className?: string;
  fullscreen?: boolean;
}

export const WifiLoader: React.FC<WifiLoaderProps> = ({
  text = 'loading...',
  subtitle,
  size = 'md',
  variant = 'indigo',
  className = '',
  fullscreen = false,
}) => {
  const sizeClass =
    size === 'sm' ? styles.sizeSm : size === 'lg' ? styles.sizeLg : styles.sizeMd;

  const variantClass =
    variant === 'emerald'
      ? styles.variantEmerald
      : variant === 'blue'
      ? styles.variantBlue
      : styles.variantIndigo;

  const loaderContent = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        id="wifi-loader"
        className={`${styles.wifiLoader} ${sizeClass} ${variantClass}`}
        role="status"
        aria-live="polite"
        aria-label={text}
      >
        {/* Circle Outer */}
        <svg className={`${styles.circle} ${styles.circleOuter}`} viewBox="0 0 86 86">
          <circle className={styles.back} cx="43" cy="43" r="40" />
          <circle className={styles.front} cx="43" cy="43" r="40" />
        </svg>

        {/* Circle Middle */}
        <svg className={`${styles.circle} ${styles.circleMiddle}`} viewBox="0 0 60 60">
          <circle className={styles.back} cx="30" cy="30" r="27" />
          <circle className={styles.front} cx="30" cy="30" r="27" />
        </svg>

        {/* Circle Inner */}
        <svg className={`${styles.circle} ${styles.circleInner}`} viewBox="0 0 34 34">
          <circle className={styles.back} cx="17" cy="17" r="14" />
          <circle className={styles.front} cx="17" cy="17" r="14" />
        </svg>

        {/* Animated Sweep Text */}
        <div className={styles.text} data-text={text} />
      </div>

      {subtitle && (
        <p className="mt-12 text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 animate-pulse tracking-wide text-center">
          {subtitle}
        </p>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-md transition-colors">
        {loaderContent}
      </div>
    );
  }

  return loaderContent;
};

export const UiverseWifiLoader = WifiLoader;
export default WifiLoader;
