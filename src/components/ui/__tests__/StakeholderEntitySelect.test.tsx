import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi } from 'vitest';
import { StakeholderEntitySelect } from '../StakeholderEntitySelect';
import { deduplicateEntities } from '@/lib/directory/entityDirectory';
import { Client, StakeholderFull } from '@/types';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    locale: 'ar',
    t: (k: string) => k,
    toggleLocale: vi.fn(),
  }),
}));

describe('StakeholderEntitySelect — Unified Entity & Person Dropdown', () => {
  const rawClients: Client[] = [
    {
      id: 'emaar-1',
      name_ar: 'إعمار مصر للتنمية',
      name_en: 'Emaar Misr',
      code: 'DEV-EMAAR',
    },
    {
      id: 'hac-1',
      name_ar: 'شركة حسن علام للإنشاءات (HAC)',
      name_en: 'Hassan Allam Construction',
      code: 'CLI-HAC',
    },
    {
      id: 'ecg-1',
      name_ar: 'جماعة المهندسين الاستشاريين (ECG)',
      name_en: 'ECG',
      code: 'CON-ECG',
    },
  ];

  const entities = deduplicateEntities(rawClients);

  it('renders selected canonical entity and filters by preferred category with Show All toggle', () => {
    const html = renderToStaticMarkup(
      <StakeholderEntitySelect
        mode="entity"
        label="المالك / المطور العقاري"
        entities={entities}
        value="emaar-1"
        preferredCategories={['owner_developer']}
        quickAddType="owner"
      />
    );

    expect(html).toContain('المالك / المطور العقاري');
    expect(html).toContain('إعمار مصر للتنمية');
    expect(html).toContain('عرض الكل');
    expect(html).toContain('إضافة جهة جديدة');
  });

  it('preserves legacy saved string values gracefully when not yet in directory', () => {
    const html = renderToStaticMarkup(
      <StakeholderEntitySelect
        mode="entity"
        entities={entities}
        value=""
        legacyDisplayValue="مطور تاريخي قديم"
        preferredCategories={['owner_developer']}
      />
    );

    expect(html).toContain('مطور تاريخي قديم');
  });

  it('renders person mode prioritizing people linked to preferredClientId', () => {
    const people: StakeholderFull[] = [
      {
        id: 'p-1',
        name_ar: 'م/ شريف فهمي',
        role: 'مدير مشروع العميل',
        organization_id: 'org-1',
        organization_name: 'شركة حسن علام للإنشاءات',
        client_id: 'hac-1',
        stakeholder_kind: 'client_rep',
        is_active: true,
        assigned_projects_count: 2,
      },
    ];

    const html = renderToStaticMarkup(
      <StakeholderEntitySelect
        mode="person"
        valueMode="name"
        people={people}
        value="م/ شريف فهمي"
        preferredKinds={['client_rep']}
        preferredClientId="hac-1"
      />
    );

    expect(html).toContain('م/ شريف فهمي');
    expect(html).toContain('إضافة شخص جديد');
  });
});
