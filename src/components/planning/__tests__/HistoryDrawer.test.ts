import { describe, it, expect } from 'vitest';
import { DeliverableEvent } from '@/types/planning';
import { resolveEventMeta, getHumanStatusLabel } from '../HistoryDrawer';

describe('HistoryDrawer Event Resolution & Human Narratives Tests', () => {
  it('correctly maps Consultant Code A to final execution approval', () => {
    const ev: DeliverableEvent = {
      id: 'ev-1',
      deliverable_id: 'deliv-1',
      event_type: 'consultant_review',
      to_value: 'Code A',
      created_at: '2026-10-05T00:00:00Z',
    };
    const meta = resolveEventMeta(ev);
    expect(meta.badgeLabel).toBe('معتمد نهائياً (كود A)');
    expect(meta.actionTitle).toContain('صالح للتنفيذ الفوري بالموقع');
    expect(meta.defaultRoleAr).toContain('استشاري الإشراف');
  });

  it('correctly maps Consultant Code B to conditional approval with notes', () => {
    const ev: DeliverableEvent = {
      id: 'ev-2',
      deliverable_id: 'deliv-1',
      event_type: 'consultant_review',
      to_value: 'Code B',
      created_at: '2026-10-05T00:00:00Z',
    };
    const meta = resolveEventMeta(ev);
    expect(meta.badgeLabel).toBe('معتمد بملاحظات (كود B)');
    expect(meta.actionTitle).toContain('مطلوب استيفاء الملاحظات أثناء التنفيذ');
  });

  it('correctly maps Consultant Code C to rejection and resubmission', () => {
    const ev: DeliverableEvent = {
      id: 'ev-3',
      deliverable_id: 'deliv-1',
      event_type: 'consultant_review',
      to_value: 'Code C',
      created_at: '2026-10-05T00:00:00Z',
    };
    const meta = resolveEventMeta(ev);
    expect(meta.badgeLabel).toBe('مرفوض لإعادة التقديم (كود C)');
    expect(meta.actionTitle).toContain('مطلوب تصحيح الملاحظات');
  });

  it('correctly maps manager internal approval (returned / manager_approved) to transmittal dispatch', () => {
    const ev: DeliverableEvent = {
      id: 'ev-4',
      deliverable_id: 'deliv-1',
      event_type: 'manager_approved',
      from_value: 'ready_to_return',
      to_value: 'returned',
      created_at: '2026-10-04T00:00:00Z',
    };
    const meta = resolveEventMeta(ev);
    expect(meta.badgeLabel).toBe('معتمد داخلياً / صادر للاستشاري');
    expect(meta.actionTitle).toContain('إرسالية الاستشاري الرسمية (Transmittal)');
    expect(meta.defaultRoleAr).toBe('مدير المكتب الفني');
  });

  it('correctly maps submission for internal review (ready_to_return)', () => {
    const ev: DeliverableEvent = {
      id: 'ev-5',
      deliverable_id: 'deliv-1',
      event_type: 'submitted_for_review',
      from_value: 'in_progress',
      to_value: 'ready_to_return',
      created_at: '2026-10-03T00:00:00Z',
    };
    const meta = resolveEventMeta(ev);
    expect(meta.badgeLabel).toBe('بانتظار مراجعة واعتماد المدير');
    expect(meta.actionTitle).toContain('إحالة المخطط لمراجعة وتدقيق مدير المكتب الفني');
    expect(meta.defaultRoleAr).toBe('مهندس المكتب الفني المعين');
  });

  it('correctly maps work drafting commencement (in_progress)', () => {
    const ev: DeliverableEvent = {
      id: 'ev-6',
      deliverable_id: 'deliv-1',
      event_type: 'start_work',
      from_value: 'pending',
      to_value: 'in_progress',
      created_at: '2026-10-02T00:00:00Z',
    };
    const meta = resolveEventMeta(ev);
    expect(meta.badgeLabel).toBe('قيد العمل والتنفيذ الهندسي');
    expect(meta.actionTitle).toContain('بدء إعداد ورسم المخططات الهندسية');
  });

  it('correctly maps execution blockers (blocked)', () => {
    const ev: DeliverableEvent = {
      id: 'ev-7',
      deliverable_id: 'deliv-1',
      event_type: 'block',
      from_value: 'in_progress',
      to_value: 'blocked',
      reason: 'تعارض مع المسار الإنشائي يوقف الصب',
      created_at: '2026-10-02T00:00:00Z',
    };
    const meta = resolveEventMeta(ev);
    expect(meta.badgeLabel).toBe('معطل بعائق تنفيذي');
    expect(meta.actionTitle).toContain('يعطل المسار أو يوقف صب الخرسانة بالموقع');
  });

  it('translates raw database status keys into professional Arabic labels', () => {
    expect(getHumanStatusLabel('ready_to_return')).toBe('بانتظار مراجعة واعتماد المدير');
    expect(getHumanStatusLabel('returned')).toBe('معتمد داخلياً ومجهز للإرسالية');
    expect(getHumanStatusLabel('in_progress')).toBe('قيد الرسم والتنفيذ');
    expect(getHumanStatusLabel('received')).toBe('مستلم ومسجل');
    expect(getHumanStatusLabel('blocked')).toBe('معطل بعائق تنفيذي');
    expect(getHumanStatusLabel('Code A')).toBe('معتمد كود A');
    expect(getHumanStatusLabel('Code B')).toBe('معتمد بملاحظات كود B');
    expect(getHumanStatusLabel('Code C')).toBe('مرفوض كود C (إعادة تقديم)');
  });
});
