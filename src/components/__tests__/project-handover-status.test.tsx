import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import ReactDOMServer from 'react-dom/server';
import { HandoverProjectModal, type HandoverChecklistData } from '../projects/HandoverProjectModal';
import { buildUpdatePayload, ALLOWED_PM_PROJECT_UPDATE_FIELDS } from '@/lib/services/project.payload';
import { ProjectService } from '@/lib/services/project.service';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    locale: 'ar',
    dir: 'rtl',
    t: (key: string) => key,
  }),
}));

const { mockQueryBuilder, mockFrom } = vi.hoisted(() => {
  const mockSingle = vi.fn().mockResolvedValue({
    data: {
      id: 'proj-handover-123',
      project_code: '2409',
      project_name: 'مشروع جراند لايف - إيجي جاب',
      status: 'handing_over',
      toc_letter: 'TOC-2026/09',
      metadata: {
        handover_checklist: {
          toc_received: true,
          toc_reference: 'TOC-2026/09',
          snag_list_completed: true,
          snag_list_type: 'minor_only',
          snag_clearance_days: 14,
          testing_commissioning_passed: true,
          as_built_submitted: true,
          om_manuals_submitted: true,
          client_training_completed: true,
          dlp_start_date: '2026-10-07',
          handover_notes: 'تم فحص غرف الطلمبات والتسليم المبدئي بنجاح',
        },
      },
    },
    error: null,
  });

  const queryBuilder: Record<string, any> = {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: mockSingle,
  };

  const from = vi.fn().mockReturnValue(queryBuilder);

  return { mockQueryBuilder: queryBuilder, mockFrom: from };
});

vi.mock('@/lib/supabase/client', () => ({
  createSupabaseBrowserClient: () => ({
    from: mockFrom,
  }),
}));

describe('PMI Project Handover Gate & Requirements Logic', () => {
  describe('1. Payload and Allow-List Layer', () => {
    it('ensures toc_letter and metadata exist in ALLOWED_PM_PROJECT_UPDATE_FIELDS', () => {
      expect(ALLOWED_PM_PROJECT_UPDATE_FIELDS.has('toc_letter')).toBe(true);
      expect(ALLOWED_PM_PROJECT_UPDATE_FIELDS.has('metadata')).toBe(true);
      expect(ALLOWED_PM_PROJECT_UPDATE_FIELDS.has('status')).toBe(true);
    });

    it('buildUpdatePayload preserves toc_letter and metadata handover_checklist', () => {
      const checklist: HandoverChecklistData = {
        toc_received: true,
        toc_reference: 'TOC-2409-APPROVED',
        snag_list_completed: true,
        snag_list_type: 'minor_only',
        snag_clearance_days: 14,
        testing_commissioning_passed: true,
        as_built_submitted: true,
        om_manuals_submitted: true,
        client_training_completed: true,
        dlp_start_date: '2026-10-07',
        handover_notes: 'تسليم ابتدائي معتمد',
      };

      const payload = buildUpdatePayload({
        status: 'handing_over',
        toc_letter: 'TOC-2409-APPROVED',
        metadata: {
          handover_checklist: checklist,
        },
      });

      expect(payload.status).toBe('handing_over');
      expect(payload.toc_letter).toBe('TOC-2409-APPROVED');
      expect(payload.metadata).toEqual({
        handover_checklist: checklist,
      });
    });
  });

  describe('2. ProjectService.updateProject Handover Safety Guard', () => {
    it('applies fallback toc_letter when project status is handing_over without explicit toc_letter', async () => {
      mockQueryBuilder.update.mockClear();
      const updated = await ProjectService.updateProject('proj-handover-123', {
        status: 'handing_over',
      });

      expect(updated).toBeDefined();
      expect(updated.status).toBe('handing_over');
      expect(mockQueryBuilder.update).toHaveBeenCalled();
      const lastCallArg = mockQueryBuilder.update.mock.calls[0][0];
      expect(lastCallArg.status).toBe('handing_over');
      expect(lastCallArg.toc_letter).toBe('قيد استيفاء شهادة الاستلام الابتدائي (TOC)');
    });

    it('preserves user supplied toc_letter and checklist metadata when provided', async () => {
      mockQueryBuilder.update.mockClear();
      const updated = await ProjectService.updateProject('proj-handover-123', {
        status: 'handing_over',
        toc_letter: 'محضر استلام ابتدائي معتمد #44',
        metadata: {
          handover_checklist: {
            toc_received: true,
            testing_commissioning_passed: true,
          },
        },
      });

      expect(updated).toBeDefined();
      const lastCallArg = mockQueryBuilder.update.mock.calls[0][0];
      expect(lastCallArg.status).toBe('handing_over');
      expect(lastCallArg.toc_letter).toBe('محضر استلام ابتدائي معتمد #44');
      expect(lastCallArg.metadata).toEqual({
        handover_checklist: {
          toc_received: true,
          testing_commissioning_passed: true,
        },
      });
    });
  });

  describe('3. HandoverProjectModal UI Rendering and Accessibility', () => {
    it('does not render markup when isOpen is false', () => {
      const html = ReactDOMServer.renderToStaticMarkup(
        <HandoverProjectModal
          isOpen={false}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
        />
      );
      expect(html).toBe('');
    });

    it('renders with title, projectName, accessible dialog role and all PMI questions when isOpen is true', () => {
      const html = ReactDOMServer.renderToStaticMarkup(
        <HandoverProjectModal
          isOpen={true}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
          projectName="مشروع كمبوند لافيستا"
          currentTocLetter="TOC-9988"
          currentChecklist={{
            toc_received: true,
            snag_list_completed: true,
            snag_list_type: 'minor_only',
            snag_clearance_days: 21,
            testing_commissioning_passed: true,
            as_built_submitted: true,
            om_manuals_submitted: true,
            client_training_completed: true,
          }}
        />
      );

      // Dialog accessibility
      expect(html).toContain('role="dialog"');
      expect(html).toContain('aria-modal="true"');
      expect(html).toContain('مشروع كمبوند لافيستا');
      expect(html).toContain('إجراءات ومحضر التسليم الابتدائي (Handover Gate)');

      // Question 1: TOC
      expect(html).toContain('شهادة الاستلام الابتدائي (TOC - Taking-Over Certificate)');
      expect(html).toContain('هل تم استلام محضر أو شهادة الاستلام الابتدائي موقعة');

      // Question 2: Snag List
      expect(html).toContain('قائمة الملاحظات والنواقص (Snag List / Punch List)');
      expect(html).toContain('بدون ملاحظات (نظيف)');
      expect(html).toContain('ملاحظات تشطيبية طفيفة');
      expect(html).toContain('المدة المحددة لتلافي الملاحظات (أيام):');

      // Question 3: T&C
      expect(html).toContain('اختبارات التشغيل والجاهزية (Testing &amp; Commissioning - T&amp;C)');
      expect(html).toContain('تشغيل الطلمبات والفلاتر، فحص ضغوط الشبكات');

      // Question 4 & 5: As-Built & O&M
      expect(html).toContain('المخططات المنفذة (As-Built)');
      expect(html).toContain('كتالوجات التشغيل والضمان');

      // Question 6 & 7: Client Training & DLP
      expect(html).toContain('تدريب طاقم التشغيل والصيانة');
      expect(html).toContain('تاريخ بدء فترة الضمان والصيانة (DLP Start):');

      // Question 8: Handover Notes & Submit
      expect(html).toContain('ملاحظات وتوصيات لجنة الاستلام الابتدائي (PM Handover Notes):');
      expect(html).toContain('اعتماد التسليم الابتدائي (Confirm Handover)');
    });
  });
});
