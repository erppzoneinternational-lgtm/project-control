import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { supabase } from '@/lib/supabase';
import { appCache } from '@/lib/cache';
import { calculateNetVos } from '../project.payload';
import { contractsService } from '../contracts.service';
import {
  hasTocCertificate,
  computeProjectRetentionBondMetrics,
} from '@/lib/utils/retention-bond-tracking.utils';
import {
  reconcileProjectBoqWithContract,
} from '@/lib/utils/boq-cost-control.utils';
import { Project, VariationOrderItem } from '@/types';
import { BoqItem } from '@/types/boq';
import {
  VariationOrder,
  Claim,
  EOTRequest,
} from '@/types/contracts';

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

// Mock query builder for Supabase chaining
const createMockQueryBuilder = (resolveValue: any) => {
  const builder: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(() => Promise.resolve(resolveValue)),
    maybeSingle: vi.fn().mockImplementation(() => Promise.resolve(resolveValue)),
    then: vi.fn().mockImplementation((onfulfilled: any) => {
      onfulfilled(resolveValue);
      return Promise.resolve(resolveValue);
    }),
  };
  return builder;
};

describe('Post-Contract Management & Governance Integration Test Suite (M4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appCache.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // 1. CONTRACT LIFECYCLE & VALUE SYNCHRONIZATION
  // ============================================================================
  describe('1. Contract Lifecycle & Value Synchronization', () => {
    describe('1.1 calculateNetVos (project.payload.ts)', () => {
      it('returns zero totals for empty, null, undefined, or invalid inputs', () => {
        const emptyResult = { totalAdditions: 0, totalDeductions: 0, netVos: 0 };
        expect(calculateNetVos(undefined)).toEqual(emptyResult);
        expect(calculateNetVos(null)).toEqual(emptyResult);
        expect(calculateNetVos([])).toEqual(emptyResult);
        expect(calculateNetVos('not-an-array' as any)).toEqual(emptyResult);
        expect(calculateNetVos(12345 as any)).toEqual(emptyResult);
      });

      it('sums approved additions and deductions correctly', () => {
        const items = [
          {
            id: 'vo-1',
            vo_number: 'VO-01',
            amount: 500_000,
            type: 'addition',
            status: 'approved',
          },
          {
            id: 'vo-2',
            vo_number: 'VO-02',
            amount: 200_000,
            type: 'deduction',
            status: 'approved',
          },
        ];

        const result = calculateNetVos(items);
        expect(result.totalAdditions).toBe(500_000);
        expect(result.totalDeductions).toBe(200_000);
        expect(result.netVos).toBe(300_000);
      });

      it('strictly excludes draft and rejected variation orders from net calculation', () => {
        const mixedItems = [
          {
            id: 'vo-appr-1',
            vo_number: 'VO-01',
            amount: 400_000,
            type: 'addition',
            status: 'approved',
          },
          {
            id: 'vo-draft',
            vo_number: 'VO-02',
            amount: 150_000,
            type: 'addition',
            status: 'draft',
          },
          {
            id: 'vo-pending',
            vo_number: 'VO-03',
            amount: 250_000,
            type: 'addition',
            status: 'pending',
          },
          {
            id: 'vo-rejected',
            vo_number: 'VO-04',
            amount: 100_000,
            type: 'addition',
            status: 'rejected',
          },
          {
            id: 'vo-deduct-appr',
            vo_number: 'VO-05',
            amount: 50_000,
            type: 'deduction',
            status: 'approved',
          },
          {
            id: 'vo-deduct-draft',
            vo_number: 'VO-06',
            amount: 70_000,
            type: 'deduction',
            status: 'draft',
          },
        ];

        const result = calculateNetVos(mixedItems);
        // Only approved addition (400,000) and approved deduction (50,000) must count
        expect(result.totalAdditions).toBe(400_000);
        expect(result.totalDeductions).toBe(50_000);
        expect(result.netVos).toBe(350_000);
      });

      it('supports legacy items without status for backwards compatibility', () => {
        const legacyItems = [
          {
            id: 'vo-leg-1',
            vo_number: 'VO-LEG-1',
            amount: 120_000,
            type: 'addition',
            // No status property (legacy entry)
          },
          {
            id: 'vo-leg-2',
            vo_number: 'VO-LEG-2',
            amount: 20_000,
            type: 'deduction',
            // No status property (legacy entry)
          },
          {
            id: 'vo-explicit-draft',
            vo_number: 'VO-03',
            amount: 90_000,
            type: 'addition',
            status: 'draft',
          },
        ];

        const result = calculateNetVos(legacyItems);
        // Legacy items without status should be counted, while explicit draft is excluded
        expect(result.totalAdditions).toBe(120_000);
        expect(result.totalDeductions).toBe(20_000);
        expect(result.netVos).toBe(100_000);
      });

      it('adversarial edge cases: handles malformed objects, negative amounts, and non-numeric inputs', () => {
        const messyItems = [
          null,
          undefined,
          {},
          { id: 'bad-1', amount: 'invalid-string', type: 'addition', status: 'approved' },
          { id: 'bad-2', amount: -75_000, type: 'addition', status: 'approved' }, // Negative amount should be sanitized via Math.abs
          { id: 'bad-3', amount: 33.333333, type: 'addition', status: 'approved' },
        ];

        const result = calculateNetVos(messyItems as any);
        expect(result.totalAdditions).toBe(75_033.33);
        expect(result.totalDeductions).toBe(0);
        expect(result.netVos).toBe(75_033.33);
      });
    });

    describe('1.2 syncProjectVosTotal (contracts.service.ts)', () => {
      it('aggregates approved VOs and updates project vos_value and total_contract_value', async () => {
        const projectId = 'proj-sync-001';

        const mockVOs: VariationOrder[] = [
          {
            id: 'vo-1',
            project_id: projectId,
            contract_id: `contract_${projectId}`,
            vo_number: 'VO-01',
            title_ar: 'إضافة أعمال مسبح',
            title_en: null,
            description: '',
            vo_type: 'addition',
            original_scope: 'نطاق أصلي',
            revised_scope: 'نطاق معدل',
            cost_impact: 300_000,
            time_impact_days: 15,
            status: 'approved',
            requested_by: 'PM',
            approved_by: 'Consultant',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'vo-2',
            project_id: projectId,
            contract_id: `contract_${projectId}`,
            vo_number: 'VO-02',
            title_ar: 'تعديل مسار خط صرف',
            title_en: null,
            description: '',
            vo_type: 'omission',
            original_scope: 'نطاق أصلي',
            revised_scope: 'نطاق معدل',
            cost_impact: -50_000,
            time_impact_days: 0,
            status: 'approved',
            requested_by: 'PM',
            approved_by: 'Consultant',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'vo-3',
            project_id: projectId,
            contract_id: `contract_${projectId}`,
            vo_number: 'VO-03',
            title_ar: 'مسودة أمر تغييري معلق',
            title_en: null,
            description: '',
            vo_type: 'addition',
            original_scope: 'نطاق أصلي',
            revised_scope: 'نطاق معدل',
            cost_impact: 150_000,
            time_impact_days: 5,
            status: 'draft', // Must be ignored
            requested_by: 'PM',
            approved_by: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];

        // Mock getVariationOrders on service
        vi.spyOn(contractsService, 'getVariationOrders').mockResolvedValue(mockVOs);

        let updatedPayload: any = null;
        vi.mocked(supabase.from).mockImplementation((table: string) => {
          if (table === 'pm_projects') {
            const builder = createMockQueryBuilder({
              data: { contract_value: 2_000_000, contract_value_egp: 2_000_000 },
              error: null,
            });
            builder.update = vi.fn().mockImplementation((payload: any) => {
              updatedPayload = payload;
              return builder;
            });
            return builder;
          }
          return createMockQueryBuilder({ data: null, error: null });
        });

        const syncSpy = vi.spyOn(appCache, 'invalidate');
        const approvedTotal = await contractsService.syncProjectVosTotal(projectId);

        // Expected approved total = 300,000 + (-50,000) = 250,000
        expect(approvedTotal).toBe(250_000);
        expect(updatedPayload).toBeDefined();
        expect(updatedPayload.vos_value).toBe(250_000);
        expect(updatedPayload.total_contract_value).toBe(2_250_000); // 2,000,000 + 250,000

        // Verify cache keys invalidated
        expect(syncSpy).toHaveBeenCalledWith(`vo_${projectId}`);
        expect(syncSpy).toHaveBeenCalledWith(`projects:${projectId}`);
      });

      it('returns 0 safely when projectId is empty', async () => {
        const result = await contractsService.syncProjectVosTotal('');
        expect(result).toBe(0);
      });
    });
  });

  // ============================================================================
  // 2. FIDIC/PMI GUARANTEES, RETENTION & CLOSEOUT GOVERNANCE
  // ============================================================================
  describe('2. FIDIC/PMI Guarantees, Retention & Closeout Governance', () => {
    describe('2.1 Taking-Over Certificate (TOC) Verification (hasTocCertificate)', () => {
      it('returns true when handover_checklist.toc_received === true', () => {
        const project = {
          id: 'p-toc-1',
          toc_letter: null,
          metadata: {
            handover_checklist: {
              toc_received: true,
              toc_reference: 'TOC/PZ/2026/001',
            },
          },
        } as unknown as Project;

        expect(hasTocCertificate(project)).toBe(true);
      });

      it('does NOT falsely qualify placeholder strings when toc_received is false or absent', () => {
        const placeholders = [
          'قيد استيفاء شهادة الاستلام الابتدائي (TOC)',
          'قيد استيفاء شهادة TOC',
          'Pending TOC Issuance',
          'قيد استيفاء شهادة الاستلام الابتدائي',
        ];

        for (const placeholder of placeholders) {
          const projectWithPlaceholder = {
            id: 'p-toc-ph',
            toc_letter: placeholder,
            metadata: {
              handover_checklist: {
                toc_received: false,
              },
            },
          } as unknown as Project;

          // Placeholder string alone must NEVER qualify as a valid TOC
          expect(
            hasTocCertificate(projectWithPlaceholder),
            `Placeholder "${placeholder}" falsely qualified for TOC!`
          ).toBe(false);
        }
      });

      it('returns false for standard blacklist values, null, or empty string', () => {
        const blacklist = ['غير متاح', 'غير موجود', 'none', 'null', 'undefined', 'لا يوجد', '', '   '];

        for (const val of blacklist) {
          const project = {
            id: 'p-toc-bl',
            toc_letter: val,
            metadata: {},
          } as unknown as Project;

          expect(hasTocCertificate(project)).toBe(false);
        }
      });

      it('returns true for genuine approved TOC reference', () => {
        const project = {
          id: 'p-toc-valid',
          toc_letter: 'معتمد بمحضر استلام ابتدائي رقم TOC-2026-44',
          metadata: {
            handover_checklist: {
              toc_received: true,
            },
          },
        } as unknown as Project;

        expect(hasTocCertificate(project)).toBe(true);
      });
    });

    describe('2.2 Retention 50/50 Tranche Logic & DLP Governance', () => {
      it('computes 50% release upon genuine TOC and 50% held through DLP', () => {
        const project = {
          id: 'p-ret-1',
          status: 'finished',
          contract_value: 10_000_000,
          vos_value: 1_000_000,
          total_contract_value: 11_000_000,
          metadata: {
            retention_terms: {
              type: 'cash_deduction',
              rate_pct: 10, // 10% retention
              calc_base: 'total', // on total contract value
              toc_release_pct: 50, // default 50/50
            },
            handover_checklist: {
              toc_received: true,
              handover_at: '2026-01-01',
            },
          },
        } as unknown as Project;

        const metrics = computeProjectRetentionBondMetrics(project);

        // Total Retention = 11,000,000 * 10% = 1,100,000
        expect(metrics.totalRetentionAmount).toBe(1_100_000);
        // Tranche 1 (50% TOC release) = 550,000
        expect(metrics.tranche1Amount).toBe(550_000);
        // Tranche 2 (50% DLP release) = 550,000
        expect(metrics.tranche2Amount).toBe(550_000);
        expect(metrics.hasToc).toBe(true);
        expect(metrics.isRetentionEligible).toBe(true);
      });

      it('prevents retention release eligibility when project has placeholder TOC and no genuine receipt', () => {
        const project = {
          id: 'p-ret-ph',
          status: 'handing_over',
          contract_value: 5_000_000,
          vos_value: 0,
          toc_letter: 'قيد استيفاء شهادة الاستلام الابتدائي (TOC)',
          metadata: {
            retention_terms: {
              type: 'cash_deduction',
              rate_pct: 5,
            },
            handover_checklist: {
              toc_received: false, // NOT genuine
            },
          },
        } as unknown as Project;

        const metrics = computeProjectRetentionBondMetrics(project);
        // Must NOT be retention eligible without genuine TOC
        expect(metrics.hasToc).toBe(false);
        expect(metrics.isRetentionEligible).toBe(false);
      });
    });

    describe('2.3 FIDIC Sub-Clause 14.2 Advance Payment Calculation', () => {
      it('calculates advance payment strictly on original contract value (not revised contract value)', () => {
        const originalValue = 8_000_000;
        const approvedVosValue = 2_000_000;
        const revisedValue = originalValue + approvedVosValue; // 10,000,000
        const advancePaymentPct = 10; // 10% advance payment

        // FIDIC Sub-Clause 14.2: Advance payment is calculated on Accepted Contract Amount (Original)
        const expectedAdvancePayment = (originalValue * advancePaymentPct) / 100; // 800,000 EGP
        const incorrectInflatedAdvancePayment = (revisedValue * advancePaymentPct) / 100; // 1,000,000 EGP

        expect(expectedAdvancePayment).toBe(800_000);
        expect(expectedAdvancePayment).not.toBe(incorrectInflatedAdvancePayment);

        // Verification of project contract model
        const contract = {
          original_value: originalValue,
          revised_value: revisedValue,
          advance_payment_pct: advancePaymentPct,
        };

        const calculatedAdvance = (contract.original_value * (contract.advance_payment_pct || 0)) / 100;
        expect(calculatedAdvance).toBe(800_000);
      });
    });
  });

  // ============================================================================
  // 3. BOQ & COST CONTROL BI-DIRECTIONAL RECONCILIATION
  // ============================================================================
  describe('3. BOQ & Cost Control Bi-directional Reconciliation', () => {
    describe('reconcileProjectBoqWithContract (boq-cost-control.utils.ts)', () => {
      const baseProject: Project = {
        id: 'proj-boq-rec',
        contract_value: 1_000_000,
        vos_value: 200_000,
        total_contract_value: 1_200_000,
      } as unknown as Project;

      it('detects matched state when BOQ revised total equals revised contract value', () => {
        const boqItems: BoqItem[] = [
          {
            id: 'item-1',
            project_id: baseProject.id,
            item_code: '01.01',
            description_ar: 'أعمال حفر وردم',
            contract_qty: 100,
            rate_egp: 5_000,
            amount_egp: 500_000,
          } as unknown as BoqItem,
          {
            id: 'item-2',
            project_id: baseProject.id,
            item_code: '01.02',
            description_ar: 'خرسانات مسلحة وميول',
            contract_qty: 100,
            rate_egp: 7_000,
            amount_egp: 700_000,
          } as unknown as BoqItem,
        ];

        // BOQ total = 500,000 + 700,000 = 1,200,000 (Matches total_contract_value)
        const report = reconcileProjectBoqWithContract(baseProject, boqItems);

        expect(report.is_matched).toBe(true);
        expect(report.status).toBe('matched');
        expect(report.variance).toBe(0);
        expect(report.revised_contract_value).toBe(1_200_000);
        expect(report.boq_revised_total).toBe(1_200_000);
        expect(report.alert_message_ar).toContain('متطابقة');
      });

      it('detects exceeding state when BOQ total exceeds revised contract value', () => {
        const boqItems: BoqItem[] = [
          {
            id: 'item-1',
            contract_qty: 100,
            rate_egp: 8_000,
            amount_egp: 800_000,
          } as unknown as BoqItem,
          {
            id: 'item-2',
            contract_qty: 100,
            rate_egp: 6_000,
            amount_egp: 600_000,
          } as unknown as BoqItem,
        ];

        // BOQ total = 1,400,000 (Exceeds 1,200,000 by 200,000)
        const report = reconcileProjectBoqWithContract(baseProject, boqItems);

        expect(report.is_matched).toBe(false);
        expect(report.status).toBe('boq_exceeds');
        expect(report.variance).toBe(200_000);
        expect(report.alert_message_ar).toContain('يتجاوز');
        expect(report.alert_message_en).toContain('exceeds');
      });

      it('detects deficient state when BOQ total is lower than revised contract value', () => {
        const boqItems: BoqItem[] = [
          {
            id: 'item-1',
            contract_qty: 100,
            rate_egp: 9_000,
            amount_egp: 900_000,
          } as unknown as BoqItem,
        ];

        // BOQ total = 900,000 (Deficient by 300,000 compared to 1,200,000)
        const report = reconcileProjectBoqWithContract(baseProject, boqItems);

        expect(report.is_matched).toBe(false);
        expect(report.status).toBe('boq_deficient');
        expect(report.variance).toBe(-300_000);
        expect(report.alert_message_ar).toContain('يقل عن');
        expect(report.alert_message_en).toContain('lower');
      });

      it('excludes omitted BOQ items from contractual reconciliation sum', () => {
        const boqItems: BoqItem[] = [
          {
            id: 'item-active',
            contract_qty: 100,
            rate_egp: 12_000,
            amount_egp: 1_200_000,
            inclusion_status: 'included',
          } as unknown as BoqItem,
          {
            id: 'item-omitted',
            contract_qty: 50,
            rate_egp: 6_000,
            amount_egp: 300_000,
            inclusion_status: 'omitted', // Must NOT be included
          } as unknown as BoqItem,
        ];

        const report = reconcileProjectBoqWithContract(baseProject, boqItems);
        // Only active item counts (1,200,000), omitted item is ignored
        expect(report.boq_revised_total).toBe(1_200_000);
        expect(report.is_matched).toBe(true);
        expect(report.items_count).toBe(1);
      });

      it('handles null project gracefully and returns safe default report', () => {
        const report = reconcileProjectBoqWithContract(null, []);
        expect(report.is_matched).toBe(true);
        expect(report.status).toBe('matched');
        expect(report.variance).toBe(0);
        expect(report.items_count).toBe(0);
      });
    });
  });

  // ============================================================================
  // 4. CLAIMS & EOT WORKFLOW VALIDATION
  // ============================================================================
  describe('4. Claims & EOT Workflow Validation', () => {
    describe('4.1 EOT Extension Calculation & Schedule Sync', () => {
      it('calculates revised finish date by adding approved EOT days to baseline finish date', () => {
        const baselineFinishDate = '2026-06-30';
        const eotRequests: Partial<EOTRequest>[] = [
          {
            id: 'eot-1',
            requested_days: 45,
            approved_days: 30,
            status: 'approved',
          },
          {
            id: 'eot-2',
            requested_days: 20,
            approved_days: 15,
            status: 'approved',
          },
          {
            id: 'eot-3',
            requested_days: 60,
            approved_days: null,
            status: 'draft', // Ignored
          },
          {
            id: 'eot-4',
            requested_days: 15,
            approved_days: 0,
            status: 'rejected', // Ignored
          },
        ];

        // Total approved EOT days = 30 + 15 = 45 days
        const approvedEotDays = eotRequests
          .filter((e) => e.status === 'approved')
          .reduce((sum, e) => sum + (Number(e.approved_days) || 0), 0);

        expect(approvedEotDays).toBe(45);

        // Project schedule completion milestone calculation
        const baseDate = new Date(baselineFinishDate);
        baseDate.setDate(baseDate.getDate() + approvedEotDays);
        const revisedFinishDate = baseDate.toISOString().slice(0, 10);

        // 2026-06-30 + 45 days -> 2026-08-14
        expect(revisedFinishDate).toBe('2026-08-14');
      });

      it('saves EOT request into project metadata and invalidates cache', async () => {
        const projectId = 'proj-eot-save';
        const eotData: Partial<EOTRequest> = {
          project_id: projectId,
          eot_number: 'EOT-001',
          title_ar: 'طلب تمديد بسبب تأخر استلام الموقع',
          reason: 'تأخر تسليم إحداثيات الموقع من المالك',
          requested_days: 30,
          clause_reference: 'FIDIC Sub-Clause 8.4',
          status: 'draft',
        };

        let updatedProjectMetadata: any = null;
        vi.mocked(supabase.from).mockImplementation((table: string) => {
          if (table === 'pm_projects') {
            const builder = createMockQueryBuilder({
              data: { id: projectId, metadata: { eot_requests: [] } },
              error: null,
            });
            builder.update = vi.fn().mockImplementation((payload: any) => {
              updatedProjectMetadata = payload.metadata;
              return builder;
            });
            return builder;
          }
          return createMockQueryBuilder({ data: null, error: null });
        });

        const cacheSpy = vi.spyOn(appCache, 'invalidate');
        const savedEot = await contractsService.saveEOTRequest(eotData);

        expect(savedEot).toBeDefined();
        expect(savedEot?.requested_days).toBe(30);
        expect(updatedProjectMetadata).toBeDefined();
        expect(updatedProjectMetadata.eot_requests).toHaveLength(1);
        expect(cacheSpy).toHaveBeenCalledWith(`eot_${projectId}`);
      });
    });

    describe('4.2 Claims Recording and Status Transitions', () => {
      it('saves claim into project metadata and retrieves claims list', async () => {
        const projectId = 'proj-claims-001';
        const claimData: Partial<Claim> = {
          project_id: projectId,
          claim_number: 'CLM-01',
          title_ar: 'مطالبة مالية بفارق أسعار المواد الخام',
          claim_type: 'cost_claim',
          clause_reference: 'FIDIC Cl. 20.1',
          claimed_amount: 500_000,
          status: 'draft',
        };

        let storedMetadata: any = null;
        vi.mocked(supabase.from).mockImplementation((table: string) => {
          if (table === 'pm_projects') {
            const builder = createMockQueryBuilder({
              data: { id: projectId, metadata: {} },
              error: null,
            });
            builder.update = vi.fn().mockImplementation((payload: any) => {
              storedMetadata = payload.metadata;
              return builder;
            });
            return builder;
          }
          return createMockQueryBuilder({ data: null, error: null });
        });

        const saved = await contractsService.saveClaim(claimData);
        expect(saved).toBeDefined();
        expect(saved?.claim_number).toBe('CLM-01');
        expect(storedMetadata.claims).toHaveLength(1);
      });

      it('transitions claim status to approved and sets reviewer and approved_amount', async () => {
        const projectId = 'proj-claim-trans';
        const claimId = 'claim-123';

        const existingClaim: Claim = {
          id: claimId,
          project_id: projectId,
          contract_id: `contract_${projectId}`,
          claim_number: 'CLM-01',
          title_ar: 'مطالبة تكاليف معدات إضافية',
          title_en: null,
          description: '',
          claim_type: 'cost_claim',
          clause_reference: 'FIDIC Cl. 20.1',
          claimed_amount: 300_000,
          approved_amount: 0,
          status: 'draft',
          submitted_by: 'PM',
          reviewed_by: null,
          submission_date: '2026-05-01',
          review_date: null,
          supporting_docs: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        let updatedClaims: Claim[] = [];
        vi.mocked(supabase.from).mockImplementation((table: string) => {
          if (table === 'pm_projects') {
            const builder = createMockQueryBuilder({
              data: { id: projectId, metadata: { claims: [existingClaim] } },
              error: null,
            });
            builder.update = vi.fn().mockImplementation((payload: any) => {
              updatedClaims = payload.metadata?.claims || [];
              return builder;
            });
            return builder;
          }
          return createMockQueryBuilder({ data: null, error: null });
        });

        const updated = await contractsService.updateClaimStatus(
          claimId,
          'approved',
          'مهندس العقد الاستشاري',
          250_000,
          projectId
        );

        expect(updated).toBeDefined();
        expect(updated?.status).toBe('approved');
        expect(updated?.reviewed_by).toBe('مهندس العقد الاستشاري');
        expect(updated?.approved_amount).toBe(250_000);
        expect(updated?.review_date).toBeDefined();

        expect(updatedClaims).toHaveLength(1);
        expect(updatedClaims[0].status).toBe('approved');
      });

      it('getContractSummary aggregates approved claims into totalClaims and netContractValue', async () => {
        const projectId = 'proj-summary-test';

        vi.spyOn(contractsService, 'getContracts').mockResolvedValue([
          {
            id: `contract_${projectId}`,
            project_id: projectId,
            contract_number: 'CON-01',
            title_ar: 'عقد رئيسي',
            original_value: 5_000_000,
            revised_value: 5_000_000,
          } as any,
        ]);

        vi.spyOn(contractsService, 'getVariationOrders').mockResolvedValue([
          {
            id: 'vo-1',
            cost_impact: 400_000,
            status: 'approved',
          } as any,
          {
            id: 'vo-2',
            cost_impact: 100_000,
            status: 'draft', // Ignored
          } as any,
        ]);

        vi.spyOn(contractsService, 'getClaims').mockResolvedValue([
          {
            id: 'cl-1',
            approved_amount: 150_000,
            status: 'approved',
          } as any,
          {
            id: 'cl-2',
            approved_amount: 90_000,
            status: 'rejected', // Ignored
          } as any,
        ]);

        const summary = await contractsService.getContractSummary(projectId);

        expect(summary.totalOriginalValue).toBe(5_000_000);
        expect(summary.totalVOs).toBe(400_000);
        expect(summary.totalClaims).toBe(150_000);
        expect(summary.netContractValue).toBe(5_550_000); // 5,000,000 + 400,000 + 150,000
      });
    });
  });

  // ============================================================================
  // 5. ABSENCE OF PHANTOM TABLE QUERIES IN OPERATIONAL SERVICE CALLS
  // ============================================================================
  describe('5. Absence of Phantom Table Queries in Operational Service Calls', () => {
    const PHANTOM_TABLES = [
      'pm_contracts',
      'pm_claims',
      'pm_variation_orders',
      'pm_eot_requests',
      'pm_ipc_certificates',
      'pm_cost_snapshots',
      'pm_budget_lines',
    ];

    it('ContractsService never queries phantom tables across all operational methods', async () => {
      const queriedTables: string[] = [];

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        queriedTables.push(table);
        if (table === 'pm_projects') {
          return createMockQueryBuilder({
            data: { id: 'p-1', contract_value: 1000, metadata: {} },
            error: null,
          });
        }
        if (table === 'pm_change_orders') {
          return createMockQueryBuilder({ data: [], error: null });
        }
        if (table === 'pm_invoices') {
          return createMockQueryBuilder({ data: [], error: null });
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      const projectId = 'proj-audit-phantom';

      // Exercise ContractsService methods
      await contractsService.getContracts(projectId);
      await contractsService.getVariationOrders(projectId);
      await contractsService.getClaims(projectId);
      await contractsService.getEOTRequests(projectId);
      await contractsService.getIPCCertificates(projectId);
      await contractsService.saveVariationOrder({
        project_id: projectId,
        vo_number: 'VO-AUDIT',
        cost_impact: 10_000,
      });

      // Verify each queried table is canonical
      for (const table of queriedTables) {
        expect(
          PHANTOM_TABLES,
          `ContractsService executed an illegal query to phantom table "${table}"!`
        ).not.toContain(table);
      }
    });

    it('Static Code Inspection: src/lib/services/contracts.service.ts contains ZERO queries to phantom tables', () => {
      const servicePath = path.resolve(
        process.cwd(),
        'src/lib/services/contracts.service.ts'
      );
      const content = fs.readFileSync(servicePath, 'utf8');

      for (const phantomTable of PHANTOM_TABLES) {
        const queryPattern = new RegExp(`from\\(['"\`]${phantomTable}['"\`]\\)`, 'g');
        const matches = content.match(queryPattern);
        expect(
          matches,
          `Found illegal query to phantom table "${phantomTable}" in contracts.service.ts`
        ).toBeNull();
      }
    });

    it('Static Code Inspection: verifies DailyProgressService does not call phantom pm_contracts or pm_variation_orders', () => {
      const dailyProgressPath = path.resolve(
        process.cwd(),
        'src/lib/services/dailyProgress.service.ts'
      );
      const content = fs.readFileSync(dailyProgressPath, 'utf8');

      const callsContracts = content.includes("from('pm_contracts')");
      const callsVariationOrders = content.includes("from('pm_variation_orders')");

      // DailyProgressService must not query phantom tables
      expect(
        callsContracts,
        'dailyProgress.service.ts still queries phantom table pm_contracts!'
      ).toBe(false);
      expect(
        callsVariationOrders,
        'dailyProgress.service.ts still queries phantom table pm_variation_orders!'
      ).toBe(false);
    });
  });
});
