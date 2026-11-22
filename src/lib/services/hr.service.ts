/**
 * HR Database Service — reads active employees from `project_control.fn_hr_directory()`.
 *
 * This is a READ-ONLY service. Never write to the HR source tables.
 * Employee data here is the source of truth for:
 *   - Names (first_name + last_name, fullNameArabic in custom_fields)
 *   - Job titles (custom_fields.jobTitle / positionTitle)
 *   - Employee codes
 *   - Phone numbers
 *
 * Integration pattern:
 *   - The /stakeholders page shows HR employees as read-only entries
 *   - Assigning to a project creates a row in project_stakeholders
 *     referencing the employee's id (UUID)
 */

import { supabase } from '@/lib/supabase';
import { StakeholderFull, StakeholderKind } from '@/types';

export interface LocalStakeholderSyncInput {
  id: string;
  name?: string | null;
  name_ar?: string | null;
  name_en?: string | null;
  email?: string | null;
  employee_code?: string | null;
  code?: string | null;
  job_title?: string | null;
  role?: string | null;
  phone?: string | null;
  department?: string | null;
  organization_id?: string | null;
}

/**
 * Ensures an HR employee exists in the local Pzone `public.stakeholders` table
 * before inserting into `project_stakeholders` (preventing PostgreSQL FK 23503).
 *
 * Strictly writes ONLY to `dbClient` (main Pzone DB) — NEVER to the HR Supabase DB.
 */
export async function ensureLocalStakeholderForAssignment(
  employee: LocalStakeholderSyncInput,
  dbClient: typeof supabase = supabase
): Promise<string> {
  if (!employee?.id) {
    throw new Error('معرف الموظف مطلوب للمزامنة المحلية (Employee ID is required for local stakeholder sync)');
  }

  // Step 1: Check existing local stakeholder by UUID
  const { data: existingById } = await dbClient
    .from('stakeholders')
    .select('id')
    .eq('id', employee.id)
    .maybeSingle();

  if (existingById?.id) {
    return existingById.id;
  }

  // Step 2: Check existing local stakeholder by case-insensitive email
  const trimmedEmail = employee.email?.trim() || '';
  if (trimmedEmail) {
    const { data: existingByEmail } = await dbClient
      .from('stakeholders')
      .select('id')
      .ilike('email', trimmedEmail)
      .maybeSingle();

    if (existingByEmail?.id) {
      return existingByEmail.id;
    }
  }

  // Step 3: Insert into local Pzone stakeholders directory
  const insertPayload = {
    id: employee.id,
    name: employee.name || employee.name_en || employee.name_ar || 'Employee',
    name_ar: employee.name_ar || employee.name || 'موظف',
    name_en: employee.name_en || employee.name || null,
    email: trimmedEmail || null,
    employee_code: employee.employee_code || employee.code || null,
    job_title: employee.job_title || employee.role || null,
    role: employee.role || employee.job_title || 'employee',
    phone: employee.phone || null,
    stakeholder_kind: 'employee' as StakeholderKind,
    type: 'internal',
    organization_id: employee.organization_id || null,
    is_active: true,
  };

  const insertQuery: any = dbClient.from('stakeholders').insert(insertPayload);
  let inserted: { id?: string } | null = null;
  let insertError: any = null;

  if (insertQuery && typeof insertQuery.select === 'function') {
    const selectedQuery = insertQuery.select('id');
    if (selectedQuery && typeof selectedQuery.single === 'function') {
      const res = await selectedQuery.single();
      inserted = res?.data ?? null;
      insertError = res?.error ?? null;
    } else if (selectedQuery && typeof selectedQuery.maybeSingle === 'function') {
      const res = await selectedQuery.maybeSingle();
      inserted = res?.data ?? null;
      insertError = res?.error ?? null;
    } else {
      const res = await selectedQuery;
      inserted = Array.isArray(res?.data) ? res.data[0] : (res?.data ?? null);
      insertError = res?.error ?? null;
    }
  } else {
    const res = await insertQuery;
    inserted = Array.isArray(res?.data) ? res.data[0] : (res?.data ?? null);
    insertError = res?.error ?? null;
  }

  if (insertError) {
    const isUniqueConflict =
      insertError.code === '23505' ||
      String(insertError.message || '').toLowerCase().includes('duplicate') ||
      String(insertError.message || '').toLowerCase().includes('unique');

    if (isUniqueConflict) {
      if (trimmedEmail) {
        const { data: fallbackByEmail } = await dbClient
          .from('stakeholders')
          .select('id')
          .ilike('email', trimmedEmail)
          .maybeSingle();
        if (fallbackByEmail?.id) {
          return fallbackByEmail.id;
        }
      }

      const { data: fallbackById } = await dbClient
        .from('stakeholders')
        .select('id')
        .eq('id', employee.id)
        .maybeSingle();
      if (fallbackById?.id) {
        return fallbackById.id;
      }
    }

    throw new Error(
      `تعذر مزامنة بيانات الموظف محلياً قبل التسكين (Failed to sync HR employee to local stakeholders): ${
        insertError.message || insertError.code || 'Unknown error'
      }`
    );
  }

  return inserted?.id || employee.id;
}

export interface HrEmployee {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  status: 'active' | 'inactive' | 'unaffiliated' | string;
  employee_code: string | null;
  department_id: string | null;
  position_id: string | null;
  custom_fields: {
    jobTitle?: string;
    fullNameArabic?: string;
    jobCategory?: string;
    governorate?: string;
    personalPhoneNumber?: string;
    projectsAssigned?: string;
    gender?: string;
    [key: string]: unknown;
  };
  created_at: string;
  updated_at: string;
}

/**
 * Map an HR employee to the StakeholderFull shape used by the UI.
 * Source is read-only — is_hr_employee flag marks it as non-editable.
 */
function mapHrEmployeeToStakeholder(emp: HrEmployee): StakeholderFull & { is_hr_employee: true } {
  const fullNameAr = emp.custom_fields?.fullNameArabic || '';
  const fullNameEn = `${emp.first_name || ''} ${emp.last_name || ''}`.trim();
  const jobTitle =
    (emp.custom_fields?.jobTitle as string) ||
    (emp.custom_fields?.positionTitle as string) ||
    (emp.position_id as string) ||
    '';
  const phone = (emp.custom_fields?.personalPhoneNumber as string) || emp.phone || '';

  return {
    id: emp.id,
    name_ar: fullNameAr || fullNameEn,
    name_en: fullNameEn,
    role: jobTitle,
    email: emp.email || '',
    phone: phone,
    employee_code: emp.employee_code || '',
    organization_id: '00000000-0000-0000-0000-000000000001',
    organization_name: 'Pzoneinternational',
    organization_code: 'PZONE',
    stakeholder_kind: 'employee' as StakeholderKind,
    is_active: emp.status === 'active',
    notes: emp.custom_fields?.projectsAssigned
      ? `مشاريع: ${emp.custom_fields.projectsAssigned}`
      : undefined,
    assigned_projects_count: 0, // will be merged from pzone-portal data
    is_system_user: false,
    is_hr_employee: true,
    job_title: jobTitle,
  };
}

export class HrService {
  static ensureLocalStakeholderForAssignment = ensureLocalStakeholderForAssignment;

  /**
   * Fetch all active employees via `fn_hr_directory()`, mapped to StakeholderFull shape.
   */
  static async getEmployees(params: { search?: string } = {}): Promise<
    Array<StakeholderFull & { is_hr_employee: true }>
  > {
    try {
      const { data, error } = await supabase.rpc('fn_hr_directory');

      if (error) {
        console.warn('[HrService] fetch error:', error.message);
        return [];
      }

      const sortedRows = [...((data || []) as HrEmployee[])].sort((a, b) =>
        (a.first_name || '').localeCompare(b.first_name || '')
      );

      let employees = sortedRows.map((emp) =>
        mapHrEmployeeToStakeholder(emp)
      );

      // Client-side search filter
      if (params.search?.trim()) {
        const q = params.search.trim().toLowerCase();
        employees = employees.filter((emp) => {
          const hay = [
            emp.name_ar,
            emp.name_en,
            emp.role,
            emp.phone,
            emp.email,
            emp.employee_code,
            emp.job_title,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          return hay.includes(q);
        });
      }

      return employees;
    } catch (err) {
      console.warn('[HrService] unexpected error:', err);
      return [];
    }
  }
}
