'use client';

/**
 * UiverseCyberDropdown — قائمة إسدال سيبرانية نيون راقية
 * ──────────────────────────────────────────────────────────────────────────
 * Adapted from Uiverse.io by Zain-Muhammad.
 * Features:
 *  - Cyber neon glowing borders and deep dark panel
 *  - 360deg icon rotation on hover
 *  - Sharp polygon clipped indicator arrow
 *  - Smooth translation & opacity drop transitions
 *  - Variants: cyan (original), emerald, blue, amber
 *  - Sizes: sm, md
 *  - Works on hover and touch/click toggle with click-outside listener
 *  - Next.js Link support or button action
 */

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import styles from './UiverseCyberDropdown.module.css';

export interface CyberDropdownItem {
  id: string;
  label: string;
  labelEn?: string;
  icon?: React.ComponentType<{ className?: string }>;
  href?: string;
  onClick?: () => void;
  badge?: string | number;
  danger?: boolean;
}

export interface UiverseCyberDropdownProps {
  label: string;
  items: CyberDropdownItem[];
  variant?: 'cyan' | 'emerald' | 'blue' | 'amber';
  size?: 'sm' | 'md';
  align?: 'left' | 'right';
  className?: string;
  dir?: 'rtl' | 'ltr';
  icon?: React.ComponentType<{ className?: string }>;
}

export const UiverseCyberDropdown: React.FC<UiverseCyberDropdownProps> = ({
  label,
  items,
  variant = 'cyan',
  size = 'md',
  align = 'right',
  className = '',
  dir,
  icon: TriggerIcon = ChevronDown,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const variantClass = styles[variant] || styles.cyan;
  const sizeClass = styles[size] || styles.md;
  const alignClass = align === 'left' ? styles.alignLeft : styles.alignRight;
  const openClass = isOpen ? styles.open : '';

  return (
    <div
      ref={containerRef}
      dir={dir}
      className={`${styles.tooltipWrapper} ${variantClass} ${sizeClass} ${openClass} ${className}`}
    >
      <div className={styles.navLink}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="true"
          aria-expanded={isOpen}
          className={styles.tooltipTab}
        >
          <span>{label}</span>
          <TriggerIcon className={styles.triggerSvg} />
        </button>

        <div className={`${styles.tooltip} ${alignClass}`}>
          <ul className={styles.tooltipMenu} role="menu">
            {items.map((item) => {
              const Icon = item.icon;
              const content = (
                <>
                  {Icon && <Icon className={styles.itemIcon} />}
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className={styles.itemBadge}>{item.badge}</span>
                  )}
                </>
              );

              const handleClick = () => {
                setIsOpen(false);
                if (item.onClick) item.onClick();
              };

              const actionClasses = `${styles.menuAction} ${item.danger ? styles.danger : ''}`;

              return (
                <li key={item.id} className={styles.tooltipItem} role="none">
                  {item.href ? (
                    <Link
                      href={item.href}
                      onClick={handleClick}
                      className={actionClasses}
                      role="menuitem"
                    >
                      {content}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={handleClick}
                      className={actionClasses}
                      role="menuitem"
                    >
                      {content}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};

export const CyberDropdown = UiverseCyberDropdown;
export default UiverseCyberDropdown;
