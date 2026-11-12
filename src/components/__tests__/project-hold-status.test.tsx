import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import ReactDOMServer from 'react-dom/server';
import { HoldProjectModal } from '../projects/HoldProjectModal';
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
      id: 'proj-123',
      project_code: 'PRJ-001',
      project_name: 'مشروع حمام سباحة فيلا زايد',
      status: 'on_hold',
      hold_reason: 'أعمال التنسيق والتصاريح بالموقع',
      suspension_reason: 'أعمال التنسيق والتصاريح بالموقع',
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

describe('Project Hold & Suspension Reason Logic', () => {
  describe('1. Payload and Allow-List Layer', () => {
    it('includes hold_reason and suspension_reason in ALLOWED_PM_PROJECT_UPDATE_FIELDS', () => {
      expect(ALLOWED_PM_PROJECT_UPDATE_FIELDS.has('hold_reason')).toBe(true);
      expect(ALLOWED_PM_PROJECT_UPDATE_FIELDS.has('suspension_reason')).toBe(true);
      expect(ALLOWED_PM_PROJECT_UPDATE_FIELDS.has('cancel_reason')).toBe(true);
      expect(ALLOWED_PM_PROJECT_UPDATE_FIELDS.has('cancellation_reason')).toBe(true);
    });

    it('buildUpdatePayload preserves hold_reason when passed', () => {
      const payload = buildUpdatePayload({
        status: 'on_hold',
        hold_reason: 'انتظار اعتماد التوريدات',
      });
      expect(payload.status).toBe('on_hold');
      expect(payload.hold_reason).toBe('انتظار اعتماد التوريدات');
    });

    it('buildUpdatePayload normalizes suspension_reason to hold_reason', () => {
      const payload = buildUpdatePayload({
        status: 'on_hold',
        suspension_reason: 'بناءً على طلب العميل',
      });
      expect(payload.status).toBe('on_hold');
      expect(payload.hold_reason).toBe('بناءً على طلب العميل');
      expect(payload.suspension_reason).toBe('بناءً على طلب العميل');
    });

    it('buildUpdatePayload normalizes cancellation_reason to cancel_reason', () => {
      const payload = buildUpdatePayload({
        status: 'cancelled',
        cancellation_reason: 'إلغاء تعاقدي من المالك',
      });
      expect(payload.status).toBe('cancelled');
      expect(payload.cancel_reason).toBe('إلغاء تعاقدي من المالك');
      expect(payload.cancellation_reason).toBe('إلغاء تعاقدي من المالك');
    });
  });

  describe('2. ProjectService.updateProject Status Fallback Guard', () => {
    it('automatically ensures fallback reason when status is on_hold without explicit reason', async () => {
      mockQueryBuilder.update.mockClear();
      const updated = await ProjectService.updateProject('proj-123', {
        status: 'on_hold',
      });
      expect(updated).toBeDefined();
      expect(updated.status).toBe('on_hold');
      expect(mockQueryBuilder.update).toHaveBeenCalled();
      const lastCallArg = mockQueryBuilder.update.mock.calls[0][0];
      expect(lastCallArg.status).toBe('on_hold');
      expect(lastCallArg.hold_reason).toBe('إيقاف مؤقت بطلب من إدارة المشروع');
    });

    it('preserves user supplied reason when provided', async () => {
      mockQueryBuilder.update.mockClear();
      const updated = await ProjectService.updateProject('proj-123', {
        status: 'on_hold',
        hold_reason: 'أعمال التنسيق والتصاريح بالموقع',
      });
      expect(updated).toBeDefined();
      const lastCallArg = mockQueryBuilder.update.mock.calls[0][0];
      expect(lastCallArg.status).toBe('on_hold');
      expect(lastCallArg.hold_reason).toBe('أعمال التنسيق والتصاريح بالموقع');
    });
  });

  describe('3. HoldProjectModal UI Rendering and Accessibility', () => {
    it('does not render markup when isOpen is false', () => {
      const html = ReactDOMServer.renderToStaticMarkup(
        <HoldProjectModal
          isOpen={false}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
        />
      );
      expect(html).toBe('');
    });

    it('renders with title, projectName, presets, and accessible dialog role when isOpen is true', () => {
      const html = ReactDOMServer.renderToStaticMarkup(
        <HoldProjectModal
          isOpen={true}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
          projectName="مشروع فيلا زايد"
        />
      );
      expect(html).toContain('role="dialog"');
      expect(html).toContain('aria-modal="true"');
      expect(html).toContain('تأكيد إيقاف المشروع مؤقتاً');
      expect(html).toContain('مشروع فيلا زايد');
      expect(html).toContain('أعمال التنسيق والتصاريح بالموقع');
      expect(html).toContain('بناءً على طلب العميل / المالك');
      expect(html).toContain('تأكيد الإيقاف المؤقت');
      expect(html).toContain('إلغاء');
    });

    it('renders prefilled reason if currentReason is passed', () => {
      const html = ReactDOMServer.renderToStaticMarkup(
        <HoldProjectModal
          isOpen={true}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
          currentReason="تأخر صرف المستخلص رقم 3"
        />
      );
      expect(html).toContain('تأخر صرف المستخلص رقم 3');
    });

    it('renders spinner when loading is true', () => {
      const html = ReactDOMServer.renderToStaticMarkup(
        <HoldProjectModal
          isOpen={true}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
          loading={true}
        />
      );
      expect(html).toContain('جاري الحفظ...');
    });
  });
});
