'use client';

/**
 * UiversePillTabs — شريط تبويبات كبسولي تفاعلي عالي الفخامة
 * ──────────────────────────────────────────────────────────────────────────
 * Adapted from Uiverse.io by uiverse-astronaut.
 * Features:
 *  - High-precision pill capsule design (border-radius 999px)
 *  - Radio-driven accessible state with focus-visible ring
 *  - Cubic-bezier 220ms smooth transition for background, color, and box-shadow
 *  - Badge count support with adaptive contrast
 *  - Color variants: default (ink black/white), blue, emerald
 *  - Sizes: sm, md
 *  - Full RTL/LTR and Dark/Light theme support
 */

import React, { useId } from 'react';
import styles from './UiversePillTabs.module.css';

export interface PillTabItem<T = string> {
  id: T;
  label: string;
  count?: number | string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface UiversePillTabsProps<T = string> {
  tabs: PillTabItem<T>[];
  activeTab: T;
  onChange: (tabId: T) => void;
  variant?: 'default' | 'blue' | 'emerald';
  size?: 'sm' | 'md';
  fullWidth?: boolean;
  className?: string;
  dir?: 'rtl' | 'ltr';
  name?: string;
  ariaLabel?: string;
}

export function UiversePillTabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  className = '',
  dir,
  name,
  ariaLabel,
}: UiversePillTabsProps<T>) {
  const autoId = useId();
  const groupName = name || `pill-tabs-${autoId}`;
  const sizeClass = size === 'sm' ? styles.sm : '';
  const variantClass = variant !== 'default' ? styles[variant] || '' : '';
  const fullWidthClass = fullWidth ? styles.fullWidth : '';

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel || 'Navigation Tabs'}
      dir={dir}
      className={`${styles.cirTabs} ${sizeClass} ${variantClass} ${fullWidthClass} ${className} cir-tabs`}
    >
      {tabs.map((tab, idx) => {
        const inputId = `${groupName}-opt-${idx}`;
        const isChecked = activeTab === tab.id;

        return (
          <React.Fragment key={tab.id}>
            <input
              type="radio"
              id={inputId}
              name={groupName}
              value={tab.id}
              checked={isChecked}
              disabled={tab.disabled}
              onChange={() => onChange(tab.id)}
              className={`${styles.cirTabsR} cir-tabs__r`}
            />
            <label
              htmlFor={inputId}
              className={`${styles.cirTabsT} cir-tabs__t`}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span className="truncate">{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`${styles.badge} badge`}>{tab.count}</span>
              )}
            </label>
          </React.Fragment>
        );
      })}
    </div>
  );
}

export const PillTabs = UiversePillTabs;
export default UiversePillTabs;
