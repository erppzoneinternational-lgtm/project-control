'use client';

/**
 * UiverseFloatingDock — شريط التنقل الزجاجي العائم الفاخر
 * ──────────────────────────────────────────────────────────────────────────
 * Adapted from Uiverse.io by themrsami.
 * Features:
 *  - Luxury frosted glass capsule pill navigation dock
 *  - Dynamic hover scaling and ambient glow box-shadows
 *  - Animated tooltips with directional pointer arrow
 *  - Support for custom routes (Next.js Link) or custom click handlers
 *  - Multi-theme support: gold (original), emerald (Pzone), blue
 *  - Responsive bottom-fixed dock or embedded inline mode
 *  - Notification badge indicator with numerical count
 *  - RTL and LTR accessibility
 */

import React from 'react';
import Link from 'next/link';
import { Home, FolderKanban, Users } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './UiverseFloatingDock.module.css';

export interface DockItem {
  id: string;
  label: string;
  labelEn?: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  onClick?: () => void;
  badge?: number | string;
  active?: boolean;
}

export interface UiverseFloatingDockProps {
  items?: DockItem[];
  activeId?: string;
  onSelect?: (id: string) => void;
  variant?: 'gold' | 'emerald' | 'blue';
  position?: 'bottom-fixed' | 'inline';
  className?: string;
  dir?: 'rtl' | 'ltr';
  ariaLabel?: string;
}

const DEFAULT_ITEMS: DockItem[] = [
  { id: 'dashboard', label: 'لوحة القيادة', labelEn: 'Dashboard', icon: Home, href: '/dashboard' },
  { id: 'project-setup', label: 'إعداد المشاريع', labelEn: 'Project Setup', icon: FolderKanban, href: '/project-setup' },
  { id: 'stakeholders', label: 'دليل الشركاء', labelEn: 'Stakeholders', icon: Users, href: '/stakeholders' },
];

export const UiverseFloatingDock: React.FC<UiverseFloatingDockProps> = ({
  items = DEFAULT_ITEMS,
  activeId,
  onSelect,
  variant = 'gold',
  position = 'bottom-fixed',
  className = '',
  dir,
  ariaLabel,
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const positionClass = position === 'bottom-fixed' ? styles.bottomFixed : styles.inline;
  const variantClass = styles[variant] || styles.gold;
  const resolvedAriaLabel = ariaLabel || (isAr ? 'شريط التنقل العائم' : 'Floating Navigation Dock');

  return (
    <div className={`${styles.dockWrapper} ${positionClass} ${className}`} dir={dir}>
      <nav
        role="navigation"
        aria-label={resolvedAriaLabel}
        className={`${styles.dockNav} ${variantClass}`}
      >
        <div className={styles.itemsContainer}>
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeId === item.id || item.active;
            const itemLabel = isAr ? item.label : (item.labelEn || item.label);

            const content = (
              <>
                <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${styles.icon}`} />

                {item.badge !== undefined && item.badge !== null && (
                  <span className={styles.badge}>
                    {item.badge}
                  </span>
                )}

                <div className={styles.tooltip}>
                  <div className={styles.tooltipBubble}>
                    {itemLabel}
                    <div className={styles.tooltipArrow} />
                  </div>
                </div>
              </>
            );

            const handleClick = () => {
              if (item.onClick) item.onClick();
              if (onSelect) onSelect(item.id);
            };

            const btnClasses = `${styles.itemBtn} ${isActive ? styles.active : ''}`;

            return (
              <div key={item.id} className={styles.itemWrapper}>
                {item.href ? (
                  <Link
                    href={item.href}
                    onClick={handleClick}
                    className={btnClasses}
                    aria-label={itemLabel}
                  >
                    {content}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={handleClick}
                    className={btnClasses}
                    aria-label={itemLabel}
                  >
                    {content}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export const FloatingDock = UiverseFloatingDock;
export default UiverseFloatingDock;
