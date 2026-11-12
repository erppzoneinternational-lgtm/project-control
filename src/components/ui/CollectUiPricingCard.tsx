'use client';

/**
 * CollectUiPricingCard — بطاقات الباقات والتعاقدات بنظام CollectUI
 * ──────────────────────────────────────────────────────────────────────────
 * Auto-extracted from CollectUI Dashboard Inspiration:
 * https://collectui.com/designs/dashboard-ui-design-inspiration/e7048581-b707-4a6d-8b1a-6249561744a5
 */

import React from 'react';
import { Check, Sparkles, ArrowUpRight } from 'lucide-react';
import styles from './CollectUiPricingCard.module.css';

export interface CollectUiPricingTier {
  id: string;
  name: string;
  description?: string;
  badge?: string;
  price: string;
  period?: string;
  isPopular?: boolean;
  features: string[];
  ctaLabel?: string;
  ctaVariant?: 'primary' | 'filled' | 'outline' | 'cta';
  onSelect?: () => void;
}

export interface CollectUiPricingCardProps {
  title?: string;
  subtitle?: string;
  tiers?: CollectUiPricingTier[];
  className?: string;
  locale?: 'ar' | 'en';
  dir?: 'rtl' | 'ltr';
}

export const CollectUiPricingCard: React.FC<CollectUiPricingCardProps> = ({
  title,
  subtitle,
  tiers,
  className = '',
  locale,
  dir,
}) => {
  const isAr = locale ? locale === 'ar' : dir !== 'ltr';
  const resolvedDir = dir || (isAr ? 'rtl' : 'ltr');

  const defaultTitle = isAr
    ? 'باقات الإشراف والتعاقدات الهندسية'
    : 'Engineering Contracts & Pricing Plans';

  const defaultSubtitle = isAr
    ? 'خطط مرنة مصممة للمشروعات الفردية والمؤسسات والمقاولين العامين.'
    : 'Data-rich and functional plans designed for modern engineering teams.';

  const defaultTiers: CollectUiPricingTier[] = [
    {
      id: 'tier-starter',
      name: isAr ? 'باقة الموقع الميداني' : 'Site Field Edition',
      description: isAr ? 'مناسبة لإشراف مهندس الموقع وتسجيل اليوميات' : 'Ideal for site supervisors and daily report logs',
      price: isAr ? '15,000 ج.م' : '$490',
      period: isAr ? '/ مشروع شهرياً' : '/ month',
      features: isAr
        ? [
            'تسجيل اليوميات وإثبات نسب الإنجاز',
            'إرفاق الصور والملاحظات الميدانية',
            'إشعار فوري لمهندس التخطيط والاستشاري',
            'تصدير سجلات الموقع بتنسيق PDF',
          ]
        : [
            'Daily progress & quantity logging',
            'Site photo evidence & obstruction tracking',
            'Real-time notifications to planning engineers',
            'Standard PDF report exports',
          ],
      ctaLabel: isAr ? 'بدء التشغيل الميداني' : 'Start Site Plan',
      ctaVariant: 'outline',
    },
    {
      id: 'tier-pro',
      name: isAr ? 'باقة إدارة المشروعات الكبرى' : 'Enterprise Turnkey',
      description: isAr ? 'المنظومة الكاملة للربط المالي والزمني والجودة' : 'Complete WBS, BOQ, IPC claims and EVM controls',
      badge: isAr ? 'الأكثر طلباً' : 'Most Popular',
      isPopular: true,
      price: isAr ? '38,000 ج.م' : '$1,290',
      period: isAr ? '/ مشروع شهرياً' : '/ month',
      features: isAr
        ? [
            'ربط كامل بين WBS و BOQ وأنشطة Primavera',
            'إدارة المستخلصات واعتماد الدفعات المالية IPC',
            'مؤشرات الأداء المكتسب EVM ومسار SPI/CPI',
            'منظومة فحص الجودة والاستلام ITP/IR',
            'دعم الفرق الهندسية والمقاولين الباطن',
          ]
        : [
            'Full WBS, BOQ and Primavera XER linking',
            'IPC certified claim and financial certificate gates',
            'Real-time EVM (Earned Value Management) analytics',
            'QC Inspection Requests (ITP/IR workflow)',
            'Multi-stakeholder & subcontractor access',
          ],
      ctaLabel: isAr ? 'ترقية إلى المنظومة المتكاملة' : 'Choose Enterprise',
      ctaVariant: 'cta',
    },
    {
      id: 'tier-enterprise',
      name: isAr ? 'باقة التحالفات والميجا بروجكت' : 'Megaproject Joint Venture',
      description: isAr ? 'حلول مؤسسية مخصصة للشركات القابضة والمستثمرين' : 'Custom institutional deployments for megaprojects',
      price: isAr ? '75,000 ج.م' : '$2,490',
      period: isAr ? '/ تحالف شهرياً' : '/ month',
      features: isAr
        ? [
            'إدارة محفظة مشاريع متعددة غير محدودة',
            'قواعد بيانات مخصصة وعزل أمني على مستوى السجلات RLS',
            'ربط مباشر مع أنظمة ERP المركزية (SAP/Oracle)',
            'استشارات وضبط زمني معتمد على مدار الساعة',
          ]
        : [
            'Unlimited multi-project portfolio oversight',
            'Dedicated PostgreSQL & custom RLS tenancy',
            'Direct ERP integration (SAP/Oracle connectors)',
            '24/7 dedicated engineering support & SLAs',
          ],
      ctaLabel: isAr ? 'طلب استشارة مخصصة' : 'Contact Enterprise',
      ctaVariant: 'primary',
    },
  ];

  const pricingTiers = tiers && tiers.length > 0 ? tiers : defaultTiers;

  return (
    <div className={[styles.container, className].filter(Boolean).join(' ')} dir={resolvedDir}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.badge}>
          <Sparkles className="w-3 h-3" />
          <span>{isAr ? 'عقود وحزم Pzone • CollectUI v2.5' : 'CollectUI Tier Inspiration'}</span>
        </div>
        <h2 className={styles.displayTitle}>{title || defaultTitle}</h2>
        <p className={styles.subtitle}>{subtitle || defaultSubtitle}</p>
      </div>

      {/* Pricing Grid */}
      <div className={styles.pricingGrid}>
        {pricingTiers.map((tier) => {
          const isPop = !!tier.isPopular;
          return (
            <div
              key={tier.id}
              className={isPop ? styles.cardPopular : styles.cardStandard}
            >
              <div className={isPop ? styles.cardInnerDark : styles.cardInnerLight}>
                <div className={styles.cardHeader}>
                  {tier.badge && (
                    <div className={styles.popularBadge}>
                      <Sparkles className="w-3 h-3" />
                      <span>{tier.badge}</span>
                    </div>
                  )}
                  <h3 className={isPop ? styles.tierNameDark : styles.tierNameLight}>
                    {tier.name}
                  </h3>
                  {tier.description && (
                    <p className={isPop ? styles.tierDescDark : styles.tierDescLight}>
                      {tier.description}
                    </p>
                  )}

                  <div className={isPop ? styles.priceAreaDark : styles.priceAreaLight}>
                    <span className={isPop ? styles.priceValueDark : styles.priceValueLight}>
                      {tier.price}
                    </span>
                    {tier.period && (
                      <span className={isPop ? styles.pricePeriodDark : styles.pricePeriodLight}>
                        {tier.period}
                      </span>
                    )}
                  </div>
                </div>

                {/* Features List */}
                <ul className={styles.featuresList}>
                  {tier.features.map((feat, idx) => (
                    <li
                      key={idx}
                      className={isPop ? styles.featureItemDark : styles.featureItemLight}
                    >
                      <Check className={[styles.featureCheck, 'w-4 h-4'].join(' ')} />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                {/* Button Action */}
                <div>
                  <button
                    type="button"
                    className={
                      tier.ctaVariant === 'cta'
                        ? styles.btnCta
                        : tier.ctaVariant === 'primary'
                        ? styles.btnPrimary
                        : tier.ctaVariant === 'filled'
                        ? styles.btnFilled
                        : styles.btnOutline
                    }
                    onClick={tier.onSelect}
                  >
                    <span>{tier.ctaLabel || (isAr ? 'اختيار الخطة' : 'Select Tier')}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
