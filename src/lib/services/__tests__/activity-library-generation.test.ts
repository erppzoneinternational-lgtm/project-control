/**
 * ActivityLibraryGenerationService — pure helper tests.
 * Mirrors repo convention: node vitest env, mock supabase module.
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn() } }));

import {
  buildTaskTitle,
  buildTaskDescription,
  filterPendingSteps,
} from '@/lib/services/activity-library-generation.service';
import type { LibraryStepRow } from '@/lib/services/activity-library-generation.service';

const step = (code: string, name_ar = 'خطوة'): LibraryStepRow => ({
  id: code,
  library_code: code,
  name_ar,
  name_en: null,
  phase_ar: null,
  category: null,
  task_owner: null,
  qc_note: null,
  step_no: 1,
});

describe('buildTaskTitle', () => {
  it('embeds the library code as sortable idempotency prefix', () => {
    expect(buildTaskTitle({ library_code: 'LB-014', name_ar: 'أعمال الحفر' })).toBe(
      '[LB-014] أعمال الحفر'
    );
  });
});

describe('buildTaskDescription', () => {
  it('joins present metadata parts and skips nulls', () => {
    expect(
      buildTaskDescription(
        {
          name_en: 'Mechanical excavation',
          task_owner: 'Area Manager',
          qc_note: null,
          phase_ar: 'أعمال الجسة',
        },
        'lagoon_body'
      )
    ).toBe(
      'المكوّن: lagoon_body · EN: Mechanical excavation · المرحلة: أعمال الجسة · المسؤول (من الإكسيل): Area Manager'
    );
    expect(
      buildTaskDescription({ name_en: null, task_owner: null, qc_note: null, phase_ar: null })
    ).toBe('');
  });
});

describe('filterPendingSteps', () => {
  const steps = [step('LB-001'), step('LB-002'), step('LB-003')];

  it('keeps steps whose generated title is not among existing tasks', () => {
    const existing = new Set(['[LB-001] خطوة']);
    expect(filterPendingSteps(steps, existing).map((s) => s.library_code)).toEqual([
      'LB-002',
      'LB-003',
    ]);
  });

  it('returns all steps when nothing exists yet', () => {
    expect(filterPendingSteps(steps, new Set())).toHaveLength(3);
  });

  it('skips everything when all titles exist', () => {
    const existing = new Set(steps.map((s) => buildTaskTitle(s)));
    expect(filterPendingSteps(steps, existing)).toHaveLength(0);
  });
});
