import type { Mock } from 'vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HrService } from '../hr.service';
import * as clientModule from '@/lib/supabase/client';

describe('HrService (Strictly Read-Only HR Registry)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.NEXT_PUBLIC_HR_SUPABASE_URL = 'https://ftmguacqywsucjhjiacn.supabase.co';
    process.env.NEXT_PUBLIC_HR_SUPABASE_ANON_KEY = 'sb_publishable_test_key';
  });

  it('guarantees HrService exposes ONLY read methods (zero mutations on HR database)', () => {
    const serviceProto = Object.getOwnPropertyNames(HrService);
    // Ensure no mutating methods exist on HrService
    const writeMethods = ['create', 'update', 'delete', 'insert', 'upsert', 'mutate', 'save'];
    for (const prop of serviceProto) {
      for (const verb of writeMethods) {
        expect(prop.toLowerCase()).not.toContain(verb);
      }
    }
    expect(typeof HrService.getEmployees).toBe('function');
  });

  it('safely handles missing environment variables returning empty array', async () => {
    const origUrl = process.env.NEXT_PUBLIC_HR_SUPABASE_URL;
    const origKey = process.env.NEXT_PUBLIC_HR_SUPABASE_ANON_KEY;
    const origViteUrl = process.env.VITE_AUTH_SUPABASE_URL;
    const origViteKey = process.env.VITE_AUTH_SUPABASE_ANON_KEY;

    try {
      delete process.env.NEXT_PUBLIC_HR_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_HR_SUPABASE_ANON_KEY;
      delete process.env.VITE_AUTH_SUPABASE_URL;
      delete process.env.VITE_AUTH_SUPABASE_ANON_KEY;

      const employees = await HrService.getEmployees();
      expect(employees).toEqual([]);
    } finally {
      process.env.NEXT_PUBLIC_HR_SUPABASE_URL = origUrl;
      process.env.NEXT_PUBLIC_HR_SUPABASE_ANON_KEY = origKey;
      process.env.VITE_AUTH_SUPABASE_URL = origViteUrl;
      process.env.VITE_AUTH_SUPABASE_ANON_KEY = origViteKey;
    }
  });

  it('fetches and maps active employees to StakeholderFull shape with is_hr_employee=true', async () => {
    const mockEmployees = [
      {
        id: 'emp-1',
        first_name: 'Ahmed',
        last_name: 'Hassan',
        email: 'ahmed@pzone.com',
        phone: '01012345678',
        status: 'active',
        employee_code: 'PZ-001',
        position_id: 'Civil Engineer',
        custom_fields: { positionTitle: 'مهندس موقع أول' },
      },
      {
        id: 'emp-2',
        first_name: 'Mohamed',
        last_name: 'Ali',
        email: 'mohamed@pzone.com',
        phone: '01298765432',
        status: 'active',
        employee_code: 'PZ-002',
        position_id: 'Project Manager',
        custom_fields: {},
      },
    ];

    const mockQueryBuilder: Record<string, Mock> = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockEmployees, error: null }),
    };

    const mockClient: Record<string, Mock> = {
      from: vi.fn().mockReturnValue(mockQueryBuilder),
    };

    vi.spyOn(clientModule, 'createHrDbClient').mockReturnValue(mockClient as never);

    const result = await HrService.getEmployees();

    expect(clientModule.createHrDbClient).toHaveBeenCalled();
    expect(mockClient.from).toHaveBeenCalledWith('employees');
    expect(mockQueryBuilder.in).toHaveBeenCalledWith('status', ['active']);
    expect(result.length).toBe(2);

    // Verify first employee mapping
    expect(result[0].id).toBe('emp-1');
    expect(result[0].name_ar).toBe('Ahmed Hassan');
    expect(result[0].is_hr_employee).toBe(true);
    expect(result[0].job_title).toBe('مهندس موقع أول');
    expect(result[0].stakeholder_kind).toBe('employee');
    expect(result[0].is_active).toBe(true);

    // Verify second employee mapping fallback
    expect(result[1].id).toBe('emp-2');
    expect(result[1].name_ar).toBe('Mohamed Ali');
    expect(result[1].job_title).toBe('Project Manager');
  });

  it('filters employees by search query client-side without extra DB load', async () => {
    const mockEmployees = [
      {
        id: 'emp-1',
        first_name: 'Mahmoud',
        last_name: 'Saeed',
        email: 'mahmoud@pzone.com',
        phone: '01000000001',
        status: 'active',
        employee_code: 'PZ-101',
      },
      {
        id: 'emp-2',
        first_name: 'Karim',
        last_name: 'Adel',
        email: 'karim@pzone.com',
        phone: '01000000002',
        status: 'active',
        employee_code: 'PZ-102',
      },
    ];

    const mockQueryBuilder: Record<string, Mock> = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockEmployees, error: null }),
    };

    const mockClient: Record<string, Mock> = {
      from: vi.fn().mockReturnValue(mockQueryBuilder),
    };

    vi.spyOn(clientModule, 'createHrDbClient').mockReturnValue(mockClient as never);

    const filtered = await HrService.getEmployees({ search: 'Karim' });
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('emp-2');
    expect(filtered[0].name_ar).toBe('Karim Adel');
  });
});
