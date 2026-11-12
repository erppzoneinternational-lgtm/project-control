import { describe, it, expect } from 'vitest';
import {
  deduplicateEntities,
  classifyEntityCategory,
  buildEntitiesPortfolio,
  isTestEntity,
} from '../entityDirectory';
import { Client, Project, StakeholderFull } from '@/types';

describe('entityDirectory — Non-destructive Deduplication & 360° Portfolio Engine', () => {
  const sampleClients: Client[] = [
    {
      id: 'hac-official',
      name_ar: 'شركة حسن علام للإنشاءات (HAC)',
      name_en: 'Hassan Allam Construction',
      code: 'CLI-HAC',
      phone: '01000000001',
    },
    {
      id: 'hac-duplicate',
      name_ar: 'شركة حسن علام للإنشاءات',
      code: undefined,
      email: 'info@hac.com',
    },
    {
      id: 'hap-sister',
      name_ar: 'حسن علام العقارية (HAP)',
      name_en: 'Hassan Allam Properties',
      code: 'DEV-HAP',
    },
    {
      id: 'emaar-id',
      name_ar: 'إعمار مصر للتنمية',
      name_en: 'Emaar Misr',
      code: 'DEV-EMAAR',
    },
    {
      id: 'ecg-id',
      name_ar: 'جماعة المهندسين الاستشاريين (ECG)',
      name_en: 'Engineering Consultants Group (ECG)',
      code: 'CON-ECG',
    },
    {
      id: 'test-999',
      name_ar: 'عميل تجريبي للتحقق من الحفظ',
      code: 'TEST-999',
    },
  ];

  it('excludes synthetic test rows while merging duplicate HAC rows and keeping sister company HAP separate', () => {
    expect(isTestEntity(sampleClients[5])).toBe(true);
    const deduped = deduplicateEntities(sampleClients);

    // 6 raw -> 1 test excluded, 2 HAC merged -> 4 canonical entities
    expect(deduped).toHaveLength(4);

    const hac = deduped.find((e) => e.id === 'hac-official');
    expect(hac).toBeDefined();
    expect(hac?.aliasIds).toEqual(expect.arrayContaining(['hac-official', 'hac-duplicate']));
    expect(hac?.email).toBe('info@hac.com');
    expect(hac?.category).toBe('main_contractor');

    const hap = deduped.find((e) => e.id === 'hap-sister');
    expect(hap).toBeDefined();
    expect(hap?.category).toBe('owner_developer');

    expect(classifyEntityCategory(sampleClients[3])).toBe('owner_developer');
    expect(classifyEntityCategory(sampleClients[4])).toBe('consultant');
  });

  it('links projects across Owner/Developer, Contractual Client, and Supervision Consultant roles accurately', () => {
    const projects: Project[] = [
      {
        id: 'proj-soul',
        project_code: 'P-101',
        project_name: 'مشروع سول الساحل الشمالي - Soul North Coast',
        client_id: 'hac-duplicate', // Linked via duplicate alias ID!
        status: 'working',
        contract_value: 25_000_000,
        vos_value: 5_000_000,
        total_contract_value: 30_000_000,
        estimated_budget: 0,
        estimated_cost: 0,
        water_area_m2: 1200,
        water_vol_m3: 1800,
        completion_pct: 65,
        pm_full_name: 'م/ مصطفى عمر',
        metadata: {
          // Even without owner_client_id, getOwnerFromProject('Soul') resolves Emaar!
          consultant_client_id: 'ecg-id',
          consultant_firm: 'جماعة المهندسين الاستشاريين (ECG)',
        },
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      },
      {
        id: 'proj-swan',
        project_code: 'P-102',
        project_name: 'سوان ليك التجمع',
        client_id: 'hac-official',
        status: 'finished',
        contract_value: 10_000_000,
        vos_value: 0,
        total_contract_value: 10_000_000,
        estimated_budget: 0,
        estimated_cost: 0,
        water_area_m2: 500,
        water_vol_m3: 700,
        completion_pct: 100,
        metadata: {
          owner_name: 'حسن علام العقارية (HAP)',
        },
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      },
    ];

    const people: StakeholderFull[] = [
      {
        id: 'rep-1',
        name_ar: 'م/ شريف فهمي',
        organization_id: 'org-1',
        organization_name: 'شركة حسن علام للإنشاءات',
        client_id: 'hac-duplicate',
        stakeholder_kind: 'client_rep',
        is_active: true,
        assigned_projects_count: 1,
      },
    ];

    const portfolio = buildEntitiesPortfolio(sampleClients, projects, people);

    const emaarSummary = portfolio.find((s) => s.entity.id === 'emaar-id')!;
    expect(emaarSummary.asOwnerCount).toBe(1);
    expect(emaarSummary.asClientCount).toBe(0);
    expect(emaarSummary.totalProjectsCount).toBe(1);
    expect(emaarSummary.totalContractValue).toBe(30_000_000);

    const hacSummary = portfolio.find((s) => s.entity.id === 'hac-official')!;
    expect(hacSummary.asClientCount).toBe(2); // Both duplicate & official IDs resolved!
    expect(hacSummary.asOwnerCount).toBe(0); // Did NOT leak HAP's owner role!
    expect(hacSummary.activeProjectsCount).toBe(1);
    expect(hacSummary.finishedProjectsCount).toBe(1);
    expect(hacSummary.linkedPeople).toHaveLength(1);

    const hapSummary = portfolio.find((s) => s.entity.id === 'hap-sister')!;
    expect(hapSummary.asOwnerCount).toBe(1);
    expect(hapSummary.asClientCount).toBe(0);

    const ecgSummary = portfolio.find((s) => s.entity.id === 'ecg-id')!;
    expect(ecgSummary.asConsultantCount).toBe(1);
  });
});
