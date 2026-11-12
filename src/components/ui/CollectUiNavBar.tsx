'use client';

/**
 * CollectUiNavBar — شريط التنقل العلوي بنظام CollectUI
 * ──────────────────────────────────────────────────────────────────────────
 * Auto-extracted from CollectUI Dashboard Inspiration:
 * https://collectui.com/designs/dashboard-ui-design-inspiration/69aa5378-9b21-4d7a-82d5-3930e635ef8f
 * Spec:
 * - Background: #ffffff canvas, sticky with subtle blur
 * - Nav links: #000000 with #155dfc active state
 * - Buttons: .btnPrimary (#f5f6f8 / #248a3d), .btnCta (#155dfc), .btnOutline
 * - Bi-directional: Arabic RTL & English LTR
 */

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Layers,
  Plus,
  Compass,
  ArrowUpRight,
  FolderKanban,
  CheckCircle2,
  Users,
} from 'lucide-react';
import styles from './CollectUiNavBar.module.css';

export interface CollectUiNavItem {
  id: string;
  label: string;
  href: string;
  isActive?: boolean;
  badge?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface CollectUiNavBarProps {
  brandName?: string;
  brandLogo?: React.ReactNode;
  items?: CollectUiNavItem[];
  activeItemId?: string;
  onItemClick?: (id: string) => void;
  ctaLabel?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  secondaryActionLabel?: string;
  onSecondaryActionClick?: () => void;
  locale?: 'ar' | 'en';
  dir?: 'rtl' | 'ltr';
  className?: string;
}

export const CollectUiNavBar: React.FC<CollectUiNavBarProps> = ({
  brandName,
  brandLogo,
  items,
  activeItemId,
  onItemClick,
  ctaLabel,
  ctaHref,
  onCtaClick,
  secondaryActionLabel,
  onSecondaryActionClick,
  locale,
  dir,
  className = '',
}) => {
  const isAr = locale ? locale === 'ar' : dir !== 'ltr';
  const resolvedDir = dir || (isAr ? 'rtl' : 'ltr');

  const defaultBrand = isAr ? 'منظومة Pzone ERP' : 'Pzone Portal';

  const defaultItems: CollectUiNavItem[] = [
    {
      id: 'dashboard',
      label: isAr ? 'لوحة القيادة' : 'Dashboard',
      href: '/dashboard',
      isActive: !activeItemId || activeItemId === 'dashboard',
    },
    {
      id: 'projects',
      label: isAr ? 'المشروعات' : 'Projects',
      href: '/projects',
      badge: '12',
      isActive: activeItemId === 'projects',
    },
    {
      id: 'site-workspace',
      label: isAr ? 'مساحة الموقع' : 'Site Workspace',
      href: '/site-workspace',
      isActive: activeItemId === 'site-workspace',
    },
    {
      id: 'planning',
      label: isAr ? 'التخطيط و BOQ' : 'Planning & BOQ',
      href: '/planning',
      isActive: activeItemId === 'planning',
    },
    {
      id: 'stakeholders',
      label: isAr ? 'الشركاء' : 'Stakeholders',
      href: '/stakeholders',
      isActive: activeItemId === 'stakeholders',
    },
  ];

  const navItems = items && items.length > 0 ? items : defaultItems;

  return (
    <nav
      className={[styles.navbar, className].filter(Boolean).join(' ')}
      dir={resolvedDir}
      aria-label="CollectUI Navigation"
    >
      {/* Brand */}
      <Link href="/dashboard" className={styles.brandGroup}>
        {brandLogo || <div className={styles.brandLogo}>PZ</div>}
        <span className={styles.brandText}>{brandName || defaultBrand}</span>
      </Link>

      {/* Center Links (#000000 default, #155dfc active) */}
      <ul className={styles.navLinks}>
        {navItems.map((item) => {
          const isActive =
            item.isActive || (activeItemId && item.id === activeItemId);
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                className={[
                  styles.navItem,
                  isActive ? styles.navItemActive : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onItemClick && onItemClick(item.id)}
              >
                {item.icon && <item.icon className="w-4 h-4" />}
                <span>{item.label}</span>
                {item.badge && <span className={styles.badge}>{item.badge}</span>}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Actions */}
      <div className={styles.actionsGroup}>
        {secondaryActionLabel && (
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={onSecondaryActionClick}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{secondaryActionLabel}</span>
          </button>
        )}

        {ctaHref ? (
          <Link href={ctaHref} className={styles.btnCta} onClick={onCtaClick}>
            <Plus className="w-3.5 h-3.5" />
            <span>{ctaLabel || (isAr ? 'مشروع جديد' : 'New Project')}</span>
          </Link>
        ) : (
          <button
            type="button"
            className={styles.btnCta}
            onClick={onCtaClick}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{ctaLabel || (isAr ? 'مشروع جديد' : 'New Project')}</span>
          </button>
        )}
      </div>
    </nav>
  );
};
