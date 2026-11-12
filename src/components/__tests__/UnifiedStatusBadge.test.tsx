import { describe, it, expect } from 'vitest';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import {
  UnifiedStatusBadge,
  resolveStatusMeta,
  ENTITY_TYPE_LABELS_AR,
  WorkflowEntityType,
} from '../workflow/UnifiedStatusBadge';

describe('UnifiedStatusBadge Component & Status System Audit', () => {
  describe('1. Consistent Status Mapping Across All Workflow Entities', () => {
    it('maps all primary Site Task statuses correctly', () => {
      const taskStatuses = [
        { status: 'pending', expectedLabel: 'معلقة (بانتظار البدء)', expectedTheme: 'warm-gray' },
        { status: 'in_progress', expectedLabel: 'قيد التنفيذ', expectedTheme: 'steel-blue' },
        { status: 'pm_review', expectedLabel: 'مراجعة مدير المشروع', expectedTheme: 'amber-tan' },
        { status: 'qc_pending', expectedLabel: 'بانتظار فحص الجودة (QC)', expectedTheme: 'lavender' },
        { status: 'approved', expectedLabel: 'معتمدة من PM', expectedTheme: 'sage' },
        { status: 'rejected', expectedLabel: 'مرفوضة / إعادة عمل', expectedTheme: 'coral' },
        { status: 'done', expectedLabel: 'منجزة ومغلقة', expectedTheme: 'sage' },
        { status: 'cancelled', expectedLabel: 'ملغاة', expectedTheme: 'warm-gray' },
      ];

      for (const item of taskStatuses) {
        const meta = resolveStatusMeta(item.status, 'task');
        expect(meta.label).toBe(item.expectedLabel);
        expect(meta.theme).toBe(item.expectedTheme);
      }
    });

    it('maps secondary & legacy Site Task aliases without falling back to HelpCircle', () => {
      const legacyTaskStatuses = ['planned', 'released', 'active', 'started', 'submitted_for_pm', 'wir_pending', 'rework', 'verified', 'completed', 'overdue'];
      for (const status of legacyTaskStatuses) {
        const meta = resolveStatusMeta(status, 'task');
        expect(meta.theme === 'warm-gray' && meta.label === status).toBe(false);
        expect(meta.label).toBeTruthy();
      }
    });

    it('maps all Daily Report statuses correctly', () => {
      const reportStatuses = [
        { status: 'draft', expectedLabel: 'مسودة', expectedTheme: 'warm-gray' },
        { status: 'submitted', expectedLabel: 'تم التقديم', expectedTheme: 'steel-blue' },
        { status: 'partially_approved', expectedLabel: 'معتمد جزئياً', expectedTheme: 'amber-tan' },
        { status: 'approved', expectedLabel: 'معتمد', expectedTheme: 'sage' },
        { status: 'rejected', expectedLabel: 'مرفوض', expectedTheme: 'coral' },
        { status: 'reopened', expectedLabel: 'مُعاد فتحه', expectedTheme: 'amber-tan' },
        { status: 'finalized', expectedLabel: 'مُعتمد ونهائي', expectedTheme: 'sage' },
        { status: 'pm_review', expectedLabel: 'تمت مراجعة PM', expectedTheme: 'amber-tan' },
        { status: 'verified', expectedLabel: 'تم التحقق والاعتماد', expectedTheme: 'sage' },
      ];

      for (const item of reportStatuses) {
        const meta = resolveStatusMeta(item.status, 'report');
        expect(meta.label).toBe(item.expectedLabel);
        expect(meta.theme).toBe(item.expectedTheme);
      }
    });

    it('maps all Deliverable & Consultant Submittal statuses correctly', () => {
      const deliverableStatuses = [
        { status: 'received', expectedLabel: 'مُستلم من المكتب الفني', expectedTheme: 'steel-blue' },
        { status: 'in_progress', expectedLabel: 'قيد الدراسة والعمل', expectedTheme: 'steel-blue' },
        { status: 'blocked', expectedLabel: 'مُعطّل (عائق نشط)', expectedTheme: 'coral' },
        { status: 'ready_to_return', expectedLabel: 'جاهز للإعادة', expectedTheme: 'amber-tan' },
        { status: 'returned', expectedLabel: 'تمت الإعادة والاستلام', expectedTheme: 'sage' },
        { status: 'approved', expectedLabel: 'معتمد', expectedTheme: 'sage' },
        { status: 'rejected', expectedLabel: 'مرفوض', expectedTheme: 'coral' },
        { status: 'pending', expectedLabel: 'بانتظار رد الاستشاري', expectedTheme: 'amber-tan' },
        { status: 'A', expectedLabel: 'كود A (معتمد)', expectedTheme: 'sage' },
        { status: 'B', expectedLabel: 'كود B (معتمد بملاحظات)', expectedTheme: 'steel-blue' },
        { status: 'C', expectedLabel: 'كود C (إعادة تقديم)', expectedTheme: 'coral' },
        { status: 'D', expectedLabel: 'كود D (مرفوض)', expectedTheme: 'coral' },
      ];

      for (const item of deliverableStatuses) {
        const meta = resolveStatusMeta(item.status, 'deliverable');
        expect(meta.label).toBe(item.expectedLabel);
        expect(meta.theme).toBe(item.expectedTheme);
      }
    });

    it('maps all Inspection (WIR / MIR) statuses correctly', () => {
      const inspectionStatuses = [
        { status: 'pending', expectedLabel: 'قيد فحص الجودة (WIR)', expectedTheme: 'amber-tan' },
        { status: 'wir_pending', expectedLabel: 'قيد فحص الجودة (WIR)', expectedTheme: 'amber-tan' },
        { status: 'not_required', expectedLabel: 'غير مطلوب فحص', expectedTheme: 'warm-gray' },
        { status: 'submitted', expectedLabel: 'تم طلب الفحص', expectedTheme: 'steel-blue' },
        { status: 'lab_pending', expectedLabel: 'بانتظار فحص المختبر', expectedTheme: 'lavender' },
        { status: 'in_progress', expectedLabel: 'الفحص جارٍ بالموقع', expectedTheme: 'steel-blue' },
        { status: 'scheduled', expectedLabel: 'مجدول للفحص', expectedTheme: 'steel-blue' },
        { status: 'approved', expectedLabel: 'مقبول / ناجح', expectedTheme: 'sage' },
        { status: 'passed', expectedLabel: 'مقبول / ناجح', expectedTheme: 'sage' },
        { status: 'rejected', expectedLabel: 'مرفوض / راسب', expectedTheme: 'coral' },
        { status: 'failed', expectedLabel: 'مرفوض / راسب', expectedTheme: 'coral' },
        { status: 'rework', expectedLabel: 'إعادة فحص وملاحظات', expectedTheme: 'coral' },
        { status: 'cancelled', expectedLabel: 'ملغي', expectedTheme: 'warm-gray' },
      ];

      for (const item of inspectionStatuses) {
        const meta = resolveStatusMeta(item.status, 'inspection');
        expect(meta.label).toBe(item.expectedLabel);
        expect(meta.theme).toBe(item.expectedTheme);
      }
    });

    it('resolves cross-entity statuses using shared dictionary before fallback', () => {
      // Testing status passed to non-standard entity
      const meta = resolveStatusMeta('approved', 'task');
      expect(meta.label).toBe('معتمدة من PM');
      expect(meta.theme).toBe('sage');

      const sharedMeta = resolveStatusMeta('completed', 'inspection');
      expect(sharedMeta.label).toBe('مكتمل');
      expect(sharedMeta.theme).toBe('sage');
    });

    it('gracefully handles unknown status with formatted label and warm-gray theme', () => {
      const meta = resolveStatusMeta('custom_phase_gate', 'task');
      expect(meta.label).toBe('custom phase gate');
      expect(meta.theme).toBe('warm-gray');
    });
  });

  describe('2. Color Contrast Ratios & Visual Theme Audit', () => {
    it('applies high-contrast text and icon colors in light and dark mode', () => {
      const htmlSage = ReactDOMServer.renderToString(
        React.createElement(UnifiedStatusBadge, { status: 'approved', entityType: 'task' })
      );
      // High contrast emerald classes: 900 text (9.23:1 AAA), 700 icon (5.21:1 AA), 300 dark text
      expect(htmlSage).toContain('text-emerald-900');
      expect(htmlSage).toContain('text-emerald-700');
      expect(htmlSage).toContain('dark:text-emerald-300');
      expect(htmlSage).toContain('dark:text-emerald-400');

      const htmlAmber = ReactDOMServer.renderToString(
        React.createElement(UnifiedStatusBadge, { status: 'pm_review', entityType: 'task' })
      );
      // High contrast amber classes: 900 text (8.75:1 AAA), 700 icon (4.84:1 AA)
      expect(htmlAmber).toContain('text-amber-900');
      expect(htmlAmber).toContain('text-amber-700');
      expect(htmlAmber).toContain('dark:text-amber-200');

      const htmlCoral = ReactDOMServer.renderToString(
        React.createElement(UnifiedStatusBadge, { status: 'rejected', entityType: 'task' })
      );
      // High contrast rose classes: 900 text (8.71:1 AAA), 700 icon (5.72:1 AA)
      expect(htmlCoral).toContain('text-rose-900');
      expect(htmlCoral).toContain('text-rose-700');
      expect(htmlCoral).toContain('dark:text-rose-300');
    });
  });

  describe('3. RTL Layout, Typography & Directional Spacing', () => {
    it('uses readable Arabic typography classes (leading-tight, tracking-normal)', () => {
      const html = ReactDOMServer.renderToString(
        React.createElement(UnifiedStatusBadge, { status: 'in_progress', entityType: 'task', size: 'sm' })
      );
      // Checks typography preservation for Arabic letterforms
      expect(html).toContain('tracking-normal');
      expect(html).toContain('leading-tight');
      expect(html).toContain('text-[11px]'); // Enhanced from 10px for legibility
    });

    it('adds directional flipping (rtl:-scale-x-100) to directional icons in RTL', () => {
      const htmlDeliverable = ReactDOMServer.renderToString(
        React.createElement(UnifiedStatusBadge, { status: 'ready_to_return', entityType: 'deliverable' })
      );
      expect(htmlDeliverable).toContain('rtl:-scale-x-100');

      const htmlSubmit = ReactDOMServer.renderToString(
        React.createElement(UnifiedStatusBadge, { status: 'submitted', entityType: 'report' })
      );
      expect(htmlSubmit).toContain('rtl:-scale-x-100');
    });

    it('allows disabling directional icon flip via flipDirectionalIcons=false', () => {
      const html = ReactDOMServer.renderToString(
        React.createElement(UnifiedStatusBadge, {
          status: 'ready_to_return',
          entityType: 'deliverable',
          flipDirectionalIcons: false,
        })
      );
      expect(html).not.toContain('rtl:-scale-x-100');
    });
  });

  describe('4. Accessible Status Announcement Hints & Semantic A11y', () => {
    it('renders role="status" and contextual aria-label with Arabic entity name', () => {
      const html = ReactDOMServer.renderToString(
        React.createElement(UnifiedStatusBadge, { status: 'in_progress', entityType: 'task' })
      );
      expect(html).toContain('role="status"');
      expect(html).toContain('aria-label="حالة المهمة: قيد التنفيذ"');
      expect(html).toContain('<span class="sr-only">حالة المهمة: </span>');
    });

    it('includes accessibleHint in aria-label, sr-only text, and title attribute', () => {
      const html = ReactDOMServer.renderToString(
        React.createElement(UnifiedStatusBadge, {
          status: 'pending',
          entityType: 'inspection',
          accessibleHint: 'بانتظار مهندس الجودة للمنطقة A',
        })
      );
      expect(html).toContain('aria-label="حالة طلب الفحص: قيد فحص الجودة (WIR) - بانتظار مهندس الجودة للمنطقة A"');
      expect(html).toContain('(بانتظار مهندس الجودة للمنطقة A)');
      expect(html).toContain('title="طلب الفحص: قيد فحص الجودة (WIR) (بانتظار مهندس الجودة للمنطقة A)"');
    });

    it('marks icons and dot indicators as aria-hidden="true" to avoid screen reader clutter', () => {
      const htmlWithIcon = ReactDOMServer.renderToString(
        React.createElement(UnifiedStatusBadge, { status: 'done', entityType: 'task', showIcon: true })
      );
      expect(htmlWithIcon).toContain('aria-hidden="true"');

      const htmlWithDot = ReactDOMServer.renderToString(
        React.createElement(UnifiedStatusBadge, { status: 'done', entityType: 'task', showIcon: false })
      );
      expect(htmlWithDot).toContain('aria-hidden="true"');
    });

    it('supports live announcement region politeness when live prop is passed', () => {
      const htmlLive = ReactDOMServer.renderToString(
        React.createElement(UnifiedStatusBadge, { status: 'verified', entityType: 'report', live: true })
      );
      expect(htmlLive).toContain('aria-live="polite"');

      const htmlAssertive = ReactDOMServer.renderToString(
        React.createElement(UnifiedStatusBadge, { status: 'blocked', entityType: 'deliverable', live: 'assertive' })
      );
      expect(htmlAssertive).toContain('aria-live="assertive"');
    });
  });
});
