'use client';

/**
 * InlineWaveLoader — مؤشر تحميل تفاعلي مع كرة نيون دوارة وموجة نصية
 * ──────────────────────────────────────────────────────────────
 * Adapted from Uiverse.io by pradip_1434.
 * Features:
 *  - 20px 3D spinning glowing sphere with inset shadows
 *  - Individual letter-by-letter waving animation
 *  - Sizes: 'sm' | 'md' | 'lg'
 *  - Perfect for buttons, inline status badges, and table rows
 */

import React from 'react';
import styles from './InlineWaveLoader.module.css';

export interface InlineWaveLoaderProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: React.CSSProperties;
  color?: string;
  showSpinner?: boolean;
}

export const InlineWaveLoader: React.FC<InlineWaveLoaderProps> = ({
  text = 'Loading...',
  size = 'md',
  className = '',
  style,
  color,
  showSpinner = true,
}) => {
  const letters = Array.from(text);

  const sizeClass =
    size === 'sm' ? styles.sizeSm : size === 'lg' ? styles.sizeLg : styles.sizeMd;

  return (
    <div
      className={`${styles.loaderWrapper} ${sizeClass} ${className}`}
      style={{ ...(color ? { color } : {}), ...style }}
      role="status"
      aria-live="polite"
      aria-label={text}
    >
      {showSpinner && <div className={styles.loader} aria-hidden="true" />}
      <div className={styles.letterWrapper}>
        {letters.map((char, index) => (
          <span
            key={index}
            className={styles.loaderLetter}
            style={{
              animationDelay: `${(index * 0.1).toFixed(1)}s`,
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </div>
    </div>
  );
};

export const UiverseWaveLoader = InlineWaveLoader;
export default InlineWaveLoader;
