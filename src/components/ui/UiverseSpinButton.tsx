'use client';

/**
 * UiverseSpinButton — زر تفاعلي مع أيقونة تدور عند التحويم والتحميل
 * ──────────────────────────────────────────────────────────────────────────
 * Adapted from Uiverse.io by andrew-demchenk0.
 * Features:
 *  - Pill capsule design with subtle translucent background tint
 *  - Hover triggers smooth 2s infinite CSS spin on the SVG icon
 *  - Supports active spinning state (for async sync / refresh operations)
 *  - Color variants: purple (original), emerald, blue, amber
 *  - Sizes: sm, md, lg
 *  - Full RTL/LTR and Dark/Light theme support
 */

import React from 'react';
import styles from './UiverseSpinButton.module.css';

export interface UiverseSpinButtonProps {
  label?: string;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  variant?: 'purple' | 'emerald' | 'blue' | 'amber';
  size?: 'sm' | 'md' | 'lg';
  isSpinning?: boolean;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  dir?: 'rtl' | 'ltr';
  title?: string;
  ariaLabel?: string;
}

const DefaultSpinIcon: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 21h5v-5" />
  </svg>
);

export const UiverseSpinButton: React.FC<UiverseSpinButtonProps> = ({
  label = 'Button',
  children,
  icon,
  variant = 'purple',
  size = 'md',
  isSpinning = false,
  disabled = false,
  onClick,
  className = '',
  type = 'button',
  dir,
  title,
  ariaLabel,
}) => {
  const content = children || label;
  const variantClass = styles[variant] || styles.purple;
  const sizeClass = styles[size] || styles.md;
  const spinningClass = isSpinning ? styles.spinning : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      dir={dir}
      title={title}
      aria-label={ariaLabel || (typeof content === 'string' ? content : 'button')}
      className={`${styles.button} ${variantClass} ${sizeClass} ${spinningClass} ${className}`}
    >
      <span className={`${styles.svgIcon} svg-icon`}>
        {icon || <DefaultSpinIcon />}
      </span>
      <span className={`${styles.lable} lable`}>
        {content}
      </span>
    </button>
  );
};

export const SpinButton = UiverseSpinButton;
export default UiverseSpinButton;
