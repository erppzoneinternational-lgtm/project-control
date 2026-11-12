'use client';

import React from 'react';
import styles from './UiverseLoader.module.css';

export interface UiverseLoaderProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  subtitle?: string;
  fullscreen?: boolean;
}

export const UiverseLoader: React.FC<UiverseLoaderProps> = ({
  text = 'Loading...',
  size = 'md',
  className = '',
  subtitle,
  fullscreen = false,
}) => {
  const letters = Array.from(text);

  const sizeClass =
    size === 'sm' ? styles.sizeSm : size === 'lg' ? styles.sizeLg : styles.sizeMd;

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div
        className={`${styles.wrapper} ${sizeClass} ${className}`}
        role="status"
        aria-live="polite"
        aria-label={text}
      >
        <div className={styles.loader} aria-hidden="true" />
        {letters.map((char, index) => (
          <span
            key={index}
            className={styles.letter}
            style={{
              animationDelay: `${(index * 0.1).toFixed(1)}s`,
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </div>
      {subtitle && (
        <p className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 animate-pulse tracking-wide text-center">
          {subtitle}
        </p>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-stone-950/80 backdrop-blur-md transition-colors">
        {content}
      </div>
    );
  }

  return content;
};

export default UiverseLoader;
