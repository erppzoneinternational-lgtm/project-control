import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Project, VariationOrderItem } from '@/types';
import { calculateNetVos } from '@/lib/services/project.payload';

describe('ChangeOrdersTab & Variation Orders Integration', () => {
  const sampleProject: Project = {
    id: 'proj-test-123',
    project_code: '2609',
    project_name: 'SLW - عدد 1 بحيرة - حسن علام HAP',
    project_name_en: 'SLW - 1 Lake - Hassan Allam HAP',
    client_id: 'client-1',
    pzone_role: 'Main Contractor',
    governorate_id: 'gov-1',
    city_id: 'city-1',
    site_location_address: 'السادس من أكتوبر',
    gps_lat: 29.9,
    gps_lng: 30.9,
    water_area_m2: 1200,
    water_vol_m3: 1800,
    planned_start_date: '2026-10-01',
    planned_finish_date: '2027-04-01',
    contract_date: '2026-09-15',
    contract_duration_months: 6,
    contract_value: 3000000,
    contract_value_egp: 3000000,
    total_value_with_vat_egp: 3420000,
    vos_value: 350000,
    estimated_budget: 2500000,
    estimated_cost: 2400000,
    completion_pct: 15,
    status: 'working',
    created_at: '2026-10-01T00:00:00.000Z',
    updated_at: '2026-10-01T00:00:00.000Z',
    metadata: {
      water_features: ['lagoons'],
      variation_orders: [
        {
          id: 'vo-1',
          vo_number: 'VO-01',
          title: 'أعمال كهروميكانيكية إضافية',
          type: 'addition',
          amount: 500000,
          issue_date: '2026-10-10',
          approval_date: '2026-10-15',
          time_impact_days: 10,
          status: 'approved',
        },
        {
          id: 'vo-2',
          vo_number: 'VO-02',
          title: 'خصم بند التوريدات الزائدة',
          type: 'deduction',
          amount: 150000,
          issue_date: '2026-10-18',
          approval_date: '2026-10-20',
          time_impact_days: 0,
          status: 'approved',
        },
      ],
    },
  };

  it('correctly calculates net VOs and total contract value from project metadata VOs', () => {
    const orders = (sampleProject.metadata?.variation_orders as VariationOrderItem[]) || [];
    const { totalAdditions, totalDeductions, netVos } = calculateNetVos(orders);

    expect(totalAdditions).toBe(500000);
    expect(totalDeductions).toBe(150000);
    expect(netVos).toBe(350000);

    const baseContract = Number(sampleProject.contract_value);
    const finalTotal = baseContract + netVos;
    expect(finalTotal).toBe(3350000);
  });

  it('handles negative net VOs (where deductions exceed additions) without corrupting totals', () => {
    const orders: VariationOrderItem[] = [
      {
        id: 'vo-1',
        vo_number: 'VO-01',
        title: 'أعمال إضافية خفيفة',
        type: 'addition',
        amount: 50000,
        status: 'approved',
      },
      {
        id: 'vo-2',
        vo_number: 'VO-02',
        title: 'إلغاء بند بحيرة ثانوية',
        type: 'deduction',
        amount: 200000,
        status: 'approved',
      },
    ];

    const { totalAdditions, totalDeductions, netVos } = calculateNetVos(orders);
    expect(totalAdditions).toBe(50000);
    expect(totalDeductions).toBe(200000);
    expect(netVos).toBe(-150000);

    const baseContract = 1000000;
    const finalContract = Math.max(0, baseContract + netVos);
    expect(finalContract).toBe(850000);
  });

  it('synthesizes legacy VO card when project has vos_value but no metadata array', () => {
    const legacyProject: Project = {
      ...sampleProject,
      metadata: {},
      vos_value: 420000,
    };

    const hasMetaVos = Array.isArray(legacyProject.metadata?.variation_orders) && legacyProject.metadata.variation_orders.length > 0;
    expect(hasMetaVos).toBe(false);

    // Fallback logic check
    const fallbackOrders: VariationOrderItem[] = Number(legacyProject.vos_value) !== 0 ? [
      {
        id: `vo_migrated_${legacyProject.id}`,
        vo_number: 'VO-01',
        title: 'أمر تغيير معتمد (مسجل مسبقاً بالمشروع)',
        type: Number(legacyProject.vos_value) >= 0 ? 'addition' : 'deduction',
        amount: Math.abs(Number(legacyProject.vos_value)),
        status: 'approved',
      },
    ] : [];

    expect(fallbackOrders).toHaveLength(1);
    expect(fallbackOrders[0].amount).toBe(420000);
    expect(fallbackOrders[0].type).toBe('addition');
  });
});
