'use client';

/**
 * CollectUiFooter — التذييل المؤسسي بنظام CollectUI
 * ──────────────────────────────────────────────────────────────────────────
 * Auto-extracted from CollectUI Dashboard Inspiration:
 * https://collectui.com/designs/dashboard-ui-design-inspiration/bce957c6-c066-4c9a-a28f-ff95f2a4dbaa
 * Spec:
 * - Background: #000000 with #242424 borders, #ffffff text
 * - Telemetry & Status: #248a3d (Online), #ffc37a (Amber Latency/Metrics)
 * - Typography: Geist 20px brand, 13px links, 11px Geist Mono
 * - Bi-directional: Arabic RTL & English LTR
 */

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Sparkles, ArrowUpRight, Activity } from 'lucide-react';
import styles from './CollectUiFooter.module.css';

export interface CollectUiFooterLink {
  label: string;
  href: string;
  badge?: string;
}

export interface CollectUiFooterColumn {
  title: string;
  links: CollectUiFooterLink[];
}

export interface CollectUiFooterProps {
  brandName?: string;
  tagline?: string;
  columns?: CollectUiFooterColumn[];
  systemStatus?: {
    label: string;
    isOnline: boolean;
    latency?: string;
  };
  copyright?: string;
  locale?: 'ar' | 'en';
  dir?: 'rtl' | 'ltr';
  className?: string;
}

export const CollectUiFooter: React.FC<CollectUiFooterProps> = ({
  brandName,
  tagline,
  columns,
  systemStatus,
  copyright,
  locale,
  dir,
  className = '',
}) => {
  const isAr = locale ? locale === 'ar' : dir !== 'ltr';
  const resolvedDir = dir || (isAr ? 'rtl' : 'ltr');

  const defaultBrand = isAr ? 'منظومة Pzone ERP الإنشائية' : 'Pzone ERP Portal';
  const defaultTagline = isAr
    ? 'نظام الحوكمة والرقابة الميدانية وإدارة عقود وتكاليف المشروعات الهندسية.'
    : 'Precision project controls, WBS governance, and field intelligence.';

  const defaultColumns: CollectUiFooterColumn[] = [
    {
      title: isAr ? 'المشروعات والعقود' : 'Projects & Contracts',
      links: [
        { label: isAr ? 'لوحة القيادة' : 'Dashboard', href: '/dashboard' },
        { label: isAr ? 'مساحة الموقع والمتابعة' : 'Site Workspace', href: '/site-workspace', badge: 'Live' },
        { label: isAr ? 'جدول الكميات BOQ' : 'Bill of Quantities', href: '/boq' },
        { label: isAr ? 'المستخلصات الجارية' : 'IPC Claims', href: '/ipc' },
      ],
    },
    {
      title: isAr ? 'الرقابة والتخطيط' : 'Controls & Planning',
      links: [
        { label: isAr ? 'شجرة حزم العمل WBS' : 'WBS Packages', href: '/wbs' },
        { label: isAr ? 'محاكي الجداول XER' : 'XER Schedule Simulation', href: '/planning' },
        { label: isAr ? 'تحليلات القيمة المكتسبة EVM' : 'EVM Performance (SPI/CPI)', href: '/evm' },
        { label: isAr ? 'سجل الفحوصات ITP' : 'QC Inspection Logs', href: '/qc-dashboard' },
      ],
    },
    {
      title: isAr ? 'الحوكمة والأمان' : 'Governance & Security',
      links: [
        { label: isAr ? 'دليل الشركاء' : 'Stakeholder Registry', href: '/stakeholders' },
        { label: isAr ? 'إدارة الصلاحيات RBAC' : 'RBAC Access Matrix', href: '/settings' },
        { label: isAr ? 'تدقيق الحماية P0' : 'P0 Security Hardening', href: '/security', badge: '007' },
        { label: isAr ? 'وثائق المنظومة' : 'Documentation', href: '/docs' },
      ],
    },
  ];

  const footerCols = columns && columns.length > 0 ? columns : defaultColumns;

  const status = systemStatus || {
    label: isAr ? 'النواة السحابية متصلة ومؤمنة' : 'PostgreSQL 16 Cloud Engine Online',
    isOnline: true,
    latency: '24ms',
  };

  const currentYear = new Date().getFullYear();
  const defaultCopyright = isAr
    ? `© ${currentYear} شركة Pzone للهندسة والمقاولات • جميع الحقوق محفوظة`
    : `© ${currentYear} Pzone Engineering & Construction ERP • All rights reserved`;

  return (
    <footer
      className={[styles.footer, className].filter(Boolean).join(' ')}
      dir={resolvedDir}
      aria-label="CollectUI Footer"
    >
      {/* Top Section */}
      <div className={styles.topSection}>
        {/* Brand & Telemetry */}
        <div className={styles.brandCol}>
          <div className={styles.brandHeader}>
            <div className={styles.brandLogo}>PZ</div>
            <h3 className={styles.brandName}>{brandName || defaultBrand}</h3>
          </div>
          <p className={styles.tagline}>{tagline || defaultTagline}</p>

          <div className={styles.statusPill}>
            <div
              className={
                status.isOnline ? styles.statusIndicatorOnline : styles.statusIndicatorAmber
              }
            />
            <span>{status.label}</span>
            {status.latency && <span className={styles.latencyTag}>{status.latency}</span>}
          </div>
        </div>

        {/* Links Columns */}
        <div className={styles.linksGrid}>
          {footerCols.map((col, idx) => (
            <div key={idx}>
              <h4 className={styles.columnTitle}>{col.title}</h4>
              <ul className={styles.linksList}>
                {col.links.map((link, lIdx) => (
                  <li key={lIdx}>
                    <Link href={link.href} className={styles.linkItem}>
                      <span>{link.label}</span>
                      {link.badge && <span className={styles.badge}>{link.badge}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Section */}
      <div className={styles.bottomSection}>
        <p className={styles.copyright}>{copyright || defaultCopyright}</p>

        <div className={styles.bottomBadges}>
          <span className={styles.specBadge}>CollectUI Design System v2.5</span>
          <span className={styles.specBadge}>Geist • 4px Grid</span>
        </div>
      </div>
    </footer>
  );
};
