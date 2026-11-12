import type { MockBuilderShape, MockQueryBuilder } from '@/types/services-types';
/**
 * Unit tests for Stakeholder & RACI Matrix Service Methods in ProjectService.
 * Includes Client Contacts, Subcontractors, Site Resources, and Projects Director auto-assignment.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProjectService } from '../project.service';
import { supabase } from '@/lib/supabase';
import { ProjectStakeholder, StakeholderFull, ProjectClientContact, ProjectSubcontractor, ProjectSiteResource } from '@/types';

// Mock Supabase module
vi.mock('@/lib/supabase', () => {
  return {
    supabase: {
      from: vi.fn(),
    },
  };
});

// Helper to create chainable thenable mock query builder
const createMockQueryBuilder = (resolveValue: unknown) => {
  const builder: MockBuilderShape = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(() => Promise.resolve(resolveValue)),
    maybeSingle: vi.fn().mockImplementation(() => Promise.resolve(resolveValue)),
    then: vi.fn().mockImplementation((onfulfilled) => {
      onfulfilled(resolveValue);
      return Promise.resolve(resolveValue);
    }),
  };
  return builder as MockQueryBuilder;
};

describe('ProjectService — Stakeholder & RACI Matrix System (M2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // 1. getProjectStakeholders
  // ---------------------------------------------------------------------------
  describe('getProjectStakeholders', () => {
    it('returns project stakeholders joined with stakeholder details', async () => {
      const mockStakeholders = [
        {
          id: 'ps_1',
          project_id: 'prj_101',
          stakeholder_id: 'stk_1',
          project_role: 'مدير المشروع',
          raci_role: 'accountable',
          stakeholder: {
            id: 'stk_1',
            organization_id: 'org_001',
            name_ar: 'م. أحمد حسونة',
            stakeholder_kind: 'employee',
            is_active: true,
            assigned_projects_count: 3,
          },
        },
      ];

      // With autoAssign eliminated from read path, first query is the actual stakeholders query
      vi.mocked(supabase.from).mockImplementation((_table: string) => {
        return createMockQueryBuilder({ data: mockStakeholders, error: null });
      });

      const result = await ProjectService.getProjectStakeholders('prj_101');

      expect(result).toHaveLength(1);
      expect(result[0].raci_role).toBe('accountable');
      expect(result[0].stakeholder?.name_ar).toBe('م. أحمد حسونة');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. addProjectStakeholder & Single Accountable Enforcement
  // ---------------------------------------------------------------------------
  describe('addProjectStakeholder', () => {
    it('successfully adds a non-accountable stakeholder', async () => {
      const payload: Partial<ProjectStakeholder> = {
        project_id: 'prj_101',
        stakeholder_id: 'stk_3',
        project_role: 'استشاري جودة',
        raci_role: 'consulted',
      };

      const insertedRecord = {
        id: 'ps_3',
        project_id: 'prj_101',
        stakeholder_id: 'stk_3',
        project_role: 'استشاري جودة',
        raci_role: 'consulted',
      };

      vi.mocked(supabase.from).mockReturnValue(createMockQueryBuilder({ data: insertedRecord, error: null }) as never);

      const result = await ProjectService.addProjectStakeholder(payload);

      expect(result.id).toBe('ps_3');
      expect(result.raci_role).toBe('consulted');
    });

    it('throws error when app-level check finds an existing accountable stakeholder', async () => {
      const payload: Partial<ProjectStakeholder> = {
        project_id: 'prj_101',
        stakeholder_id: 'stk_4',
        project_role: 'مدير المشروع الثاني',
        raci_role: 'accountable',
      };

      vi.mocked(supabase.from).mockReturnValue(createMockQueryBuilder({ data: { id: 'ps_existing_acc' }, error: null }) as never);

      await expect(ProjectService.addProjectStakeholder(payload)).rejects.toThrow(
        'لا يمكن تعيين أكثر من مسؤول رئيسي (Accountable) واحد للمشروع'
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 3. removeProjectStakeholder
  // ---------------------------------------------------------------------------
  describe('removeProjectStakeholder', () => {
    it('successfully deletes stakeholder assignment by ID', async () => {
      vi.mocked(supabase.from).mockReturnValue(createMockQueryBuilder({ error: null }) as never);

      await expect(ProjectService.removeProjectStakeholder('ps_1')).resolves.not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // 4. getStakeholdersDirectory
  // ---------------------------------------------------------------------------
  describe('getStakeholdersDirectory', () => {
    it('fetches all stakeholders from stakeholders_full view ordered by name_ar', async () => {
      const mockDirectory = [
        {
          id: 'stk_1',
          name_ar: 'أحمد علي',
          stakeholder_kind: 'employee',
          is_active: true,
        },
      ];

      vi.mocked(supabase.from).mockReturnValue(createMockQueryBuilder({ data: mockDirectory, error: null }) as never);

      const result = await ProjectService.getStakeholdersDirectory();
      expect(result).toHaveLength(1);
      expect(result[0].name_ar).toBe('أحمد علي');
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Client & Consultant Contacts
  // ---------------------------------------------------------------------------
  describe('Client Contacts Service methods', () => {
    const mockContact: ProjectClientContact = {
      id: 'c_1',
      project_id: 'prj_101',
      party_type: 'client',
      contact_name: 'هشام السيفي',
      company_name: 'أوراسكوم',
      phone: '01000000000',
    };

    it('fetches client contacts successfully', async () => {
      vi.mocked(supabase.from).mockReturnValue(createMockQueryBuilder({ data: [mockContact], error: null }) as never);

      const result = await ProjectService.getProjectClientContacts('prj_101');
      expect(result).toHaveLength(1);
      expect(result[0].contact_name).toBe('هشام السيفي');
    });

    it('adds client contact successfully', async () => {
      vi.mocked(supabase.from).mockReturnValue(createMockQueryBuilder({ data: mockContact, error: null }) as never);

      const result = await ProjectService.addProjectClientContact({
        project_id: 'prj_101',
        contact_name: 'هشام السيفي',
        party_type: 'client',
      });
      expect(result.id).toBe('c_1');
    });

    it('deletes client contact successfully', async () => {
      vi.mocked(supabase.from).mockReturnValue(createMockQueryBuilder({ error: null }) as never);

      await expect(ProjectService.removeProjectClientContact('c_1', 'prj_101')).resolves.not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Subcontractors
  // ---------------------------------------------------------------------------
  describe('Subcontractors Service methods', () => {
    const mockSubcontractor: ProjectSubcontractor = {
      id: 'sub_1',
      project_id: 'prj_101',
      company_name: 'الفايز للخرسانات',
      specialization: 'خرسانات',
      status: 'active',
      contract_value: 250000,
    };

    it('fetches subcontractors successfully', async () => {
      vi.mocked(supabase.from).mockReturnValue(createMockQueryBuilder({ data: [mockSubcontractor], error: null }) as never);

      const result = await ProjectService.getProjectSubcontractors('prj_101');
      expect(result).toHaveLength(1);
      expect(result[0].company_name).toBe('الفايز للخرسانات');
    });

    it('adds subcontractor successfully', async () => {
      // Mock vendors check to return a dummy vendor
      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        callCount++;
        if (table === 'vendors') {
          return createMockQueryBuilder({ data: { id: 'v_1', name_ar: 'الفايز للخرسانات' }, error: null }) as never;
        }
        return createMockQueryBuilder({ data: mockSubcontractor, error: null }) as never;
      });

      const result = await ProjectService.addProjectSubcontractor({
        project_id: 'prj_101',
        company_name: 'الفايز للخرسانات',
        contract_value: 250000,
      });
      expect(result.id).toBe('sub_1');
    });
  });

  // ---------------------------------------------------------------------------
  // 7. Site Resources
  // ---------------------------------------------------------------------------
  describe('Site Resources Service methods', () => {
    const mockResource: ProjectSiteResource = {
      id: 'res_1',
      project_id: 'prj_101',
      resource_type: 'driver',
      resource_name: 'سائق اللودر',
      person_name: 'حويج',
    };

    it('fetches site resources successfully', async () => {
      vi.mocked(supabase.from).mockReturnValue(createMockQueryBuilder({ data: [mockResource], error: null }) as never);

      const result = await ProjectService.getProjectSiteResources('prj_101');
      expect(result).toHaveLength(1);
      expect(result[0].person_name).toBe('حويج');
    });

    it('adds site resource successfully', async () => {
      vi.mocked(supabase.from).mockReturnValue(createMockQueryBuilder({ data: mockResource, error: null }) as never);

      const result = await ProjectService.addProjectSiteResource({
        project_id: 'prj_101',
        resource_type: 'driver',
        resource_name: 'سائق اللودر',
      });
      expect(result.id).toBe('res_1');
    });
  });

  // ---------------------------------------------------------------------------
  // 8. Projects Director Auto-assignment
  // ---------------------------------------------------------------------------
  describe('Projects Director autoAssignProjectsDirector', () => {
    it('does nothing if Projects Director is already assigned', async () => {
      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        callCount++;
        expect(table).toBe('project_stakeholders');
        return createMockQueryBuilder({ data: [{ id: 'pd_exist' }], error: null }) as never;
      });

      await ProjectService.autoAssignProjectsDirector('prj_101');
      expect(callCount).toBe(1); // Only check query, no search or insert
    });

    it('inserts Projects Director if not assigned and stakeholder is found', async () => {
      let checkCall = false;
      let findCall = false;
      let insertCall = false;

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'project_stakeholders') {
          if (!checkCall) {
            checkCall = true;
            return createMockQueryBuilder({ data: [], error: null }) as never;
          }
          insertCall = true;
          return createMockQueryBuilder({ error: null }) as never;
        }
        if (table === 'stakeholders') {
          findCall = true;
          return createMockQueryBuilder({ data: { id: 'emp_mahdy' }, error: null }) as never;
        }
        return createMockQueryBuilder({ data: [], error: null }) as never;
      });

      await ProjectService.autoAssignProjectsDirector('prj_101');
      expect(checkCall).toBe(true);
      expect(findCall).toBe(true);
      expect(insertCall).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 9. getUserAssignedProjectIds (Gap 2)
  // ---------------------------------------------------------------------------
  describe('getUserAssignedProjectIds with strictStaffing', () => {
    it('returns null (unrestricted) for to_manager when strictStaffing is true', async () => {
      const result = await ProjectService.getUserAssignedProjectIds(
        'manager@pzone.com',
        ['to_manager'],
        { strictStaffing: true }
      );
      expect(result).toBeNull();
    });

    it('scopes to_engineer when strictStaffing is true and filters out inactive/expired project_stakeholders rows', async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'profiles') {
          return createMockQueryBuilder({ data: { id: 'usr_eng_1' }, error: null }) as never;
        }
        if (table === 'pm_user_project_access') {
          return createMockQueryBuilder({ data: [], error: null }) as never;
        }
        if (table === 'stakeholders') {
          return createMockQueryBuilder({ data: [{ id: 'stk_eng_1' }], error: null }) as never;
        }
        if (table === 'project_stakeholders') {
          return createMockQueryBuilder({
            data: [
              { project_id: 'prj_active', is_active: true, end_date: null },
              { project_id: 'prj_legacy_mock' },
              { project_id: 'prj_inactive', is_active: false, end_date: null },
              { project_id: 'prj_expired', is_active: true, end_date: '2020-01-01' },
            ],
            error: null,
          }) as never;
        }
        if (table === 'pm_projects_with_manager') {
          return createMockQueryBuilder({ data: [], error: null }) as never;
        }
        return createMockQueryBuilder({ data: [], error: null }) as never;
      });

      const result = await ProjectService.getUserAssignedProjectIds(
        'eng@pzone.com',
        ['to_engineer'],
        { strictStaffing: true }
      );

      expect(result).toEqual(['prj_active', 'prj_legacy_mock']);
    });
  });

  // ---------------------------------------------------------------------------
  // 10. updateProjectStakeholder (Gap 7)
  // ---------------------------------------------------------------------------
  describe('updateProjectStakeholder', () => {
    it('dynamically updates hierarchy, dates, and active status fields', async () => {
      const updatedRecord: ProjectStakeholder = {
        id: 'ps_10',
        project_id: 'prj_101',
        stakeholder_id: 'stk_10',
        project_role: 'مهندس مكتب فني',
        raci_role: 'responsible',
        reports_to: 'stk_mgr_1',
        start_date: '2026-01-01',
        end_date: '2026-12-31',
        is_active: true,
      };

      const mockBuilder = createMockQueryBuilder({ data: updatedRecord, error: null });
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as never);

      const result = await ProjectService.updateProjectStakeholder('ps_10', 'prj_101', {
        reports_to: 'stk_mgr_1',
        start_date: '2026-01-01',
        end_date: '2026-12-31',
        is_active: true,
      });

      expect(mockBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          reports_to: 'stk_mgr_1',
          start_date: '2026-01-01',
          end_date: '2026-12-31',
          is_active: true,
          updated_at: expect.any(String),
        })
      );
      expect(result.reports_to).toBe('stk_mgr_1');
      expect(result.is_active).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 11. getTechnicalOfficeEngineers (Gap 4)
  // ---------------------------------------------------------------------------
  describe('getTechnicalOfficeEngineers', () => {
    it('filters out non-UUID IDs and prioritizes project-assigned engineers', async () => {
      const uuid1 = '11111111-2222-3333-4444-555555555555';
      const uuid2 = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'stakeholders_full') {
          return createMockQueryBuilder({
            data: [
              { id: 'emp_fake_1', name_ar: 'مهندس تجريبي', stakeholder_kind: 'employee', is_active: true },
              { id: uuid1, name_ar: 'م. عمر خالد', stakeholder_kind: 'employee', is_active: true },
              { id: uuid2, name_ar: 'م. سارة محمود', stakeholder_kind: 'employee', is_active: true },
            ],
            error: null,
          }) as never;
        }
        if (table === 'project_stakeholders') {
          return createMockQueryBuilder({
            data: [
              { id: 'ps_assign_1', project_id: 'prj_202', stakeholder_id: uuid2, is_active: true },
            ],
            error: null,
          }) as never;
        }
        return createMockQueryBuilder({ data: [], error: null }) as never;
      });

      const engineers = await ProjectService.getTechnicalOfficeEngineers('prj_202');

      expect(engineers).toHaveLength(2);
      expect(engineers.map((e) => e.id)).toEqual([uuid2, uuid1]);
    });
  });
});
