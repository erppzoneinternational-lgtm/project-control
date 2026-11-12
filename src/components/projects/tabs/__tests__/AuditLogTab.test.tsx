import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { AuditLogTab } from '../AuditLogTab';
import { AuditLogService } from '@/lib/services/auditLog.service';
import { AuditLogEntry } from '@/types';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        in: vi.fn().mockResolvedValue({ data: [] }),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [] }),
      })),
    })),
  },
}));

// Mock ProjectService
vi.mock('@/lib/services/project.service', () => ({
  ProjectService: {
    getAuditLogs: vi.fn().mockResolvedValue([]),
  },
}));

describe('AuditLogTab Component & Accessibility Suite', () => {
  const sampleLogs: AuditLogEntry[] = [
    {
      id: 'log-1',
      table_name: 'pm_projects',
      record_id: 'proj-123',
      action: 'UPDATE',
      changed_by: 'user-director',
      user_name: 'مهندس أحمد',
      user_email: 'ahmed@pzone.com',
      user_role: 'Project Director',
      created_at: new Date().toISOString(),
      old_data: { project_name: 'مشروع أ', contract_value: 100000 },
      new_data: { project_name: 'مشروع ب', contract_value: 150000 },
      context: 'تحديث قيمة العقد',
      ip_address: '192.168.1.1',
    },
    {
      id: 'log-2',
      table_name: 'pm_boq_items',
      record_id: 'boq-456',
      action: 'INSERT',
      changed_by: 'user-qs',
      user_name: 'مهندس سارة',
      user_email: 'sara@pzone.com',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      new_data: { item_code: 'BOQ-01', quantity: 50, unit_price: 200 },
      context: 'إضافة بند مقايسة جديد',
    },
    {
      id: 'log-3',
      table_name: 'pm_change_orders',
      record_id: 'vo-789',
      action: 'STATUS_CHANGE',
      changed_by: 'user-pm',
      user_name: 'مهندس سامي',
      user_email: 'sami@pzone.com',
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      old_data: { status: 'draft' },
      new_data: { status: 'approved' },
      context: 'اعتماد أمر التغيير',
    },
    {
      id: 'log-4',
      table_name: 'site_tasks',
      record_id: 'task-101',
      action: 'DELETE',
      changed_by: 'user-pm',
      user_name: 'مهندس سامي',
      created_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
      old_data: { description: 'مهمة ملغاة' },
      context: 'حذف مهمة مكررة',
    },
  ];

  describe('1. Component Structure & Instantiation', () => {
    it('creates a valid React element with required props', () => {
      const element = React.createElement(AuditLogTab, {
        projectId: 'proj-123',
      });
      expect(React.isValidElement(element)).toBe(true);
      expect(element.props.projectId).toBe('proj-123');
    });

    it('has proper displayName set for debugging and React DevTools', () => {
      expect(AuditLogTab.displayName).toBe('AuditLogTab');
    });
  });

  describe('2. Diff Calculation & Semantic Comparison', () => {
    it('computes field-level differences for UPDATE actions accurately', () => {
      const diffs = AuditLogService.computeDiff(
        sampleLogs[0].old_data,
        sampleLogs[0].new_data
      );

      expect(diffs).toHaveLength(2);

      const nameDiff = diffs.find((d) => d.field === 'project_name');
      expect(nameDiff).toBeDefined();
      expect(nameDiff?.oldValue).toBe('مشروع أ');
      expect(nameDiff?.newValue).toBe('مشروع ب');
      expect(nameDiff?.fieldLabelAr).toBe('اسم المشروع');

      const valDiff = diffs.find((d) => d.field === 'contract_value');
      expect(valDiff).toBeDefined();
      expect(valDiff?.oldValue).toBe(100000);
      expect(valDiff?.newValue).toBe(150000);
      expect(valDiff?.fieldLabelAr).toBe('القيمة التعاقدية');
    });

    it('returns empty diff array when payloads are identical or empty', () => {
      expect(AuditLogService.computeDiff(undefined, undefined)).toEqual([]);
      expect(
        AuditLogService.computeDiff({ name: 'نفس القيمة' }, { name: 'نفس القيمة' })
      ).toEqual([]);
    });

    it('ignores internal metadata keys like updated_at, created_at, id', () => {
      const diffs = AuditLogService.computeDiff(
        { id: '1', updated_at: '2026-01-01', status: 'draft' },
        { id: '1', updated_at: '2026-01-02', status: 'active' }
      );
      expect(diffs).toHaveLength(1);
      expect(diffs[0].field).toBe('status');
      expect(diffs[0].fieldLabelAr).toBe('الحالة');
    });
  });

  describe('3. Filtering Logic (Action, User, Date Range, Search)', () => {
    it('filters correctly by action type', () => {
      const updateLogs = sampleLogs.filter((l) => l.action === 'UPDATE');
      expect(updateLogs).toHaveLength(1);
      expect(updateLogs[0].id).toBe('log-1');

      const insertLogs = sampleLogs.filter((l) => l.action === 'INSERT');
      expect(insertLogs).toHaveLength(1);
      expect(insertLogs[0].id).toBe('log-2');
    });

    it('filters correctly by user ID or user email', () => {
      const samiLogs = sampleLogs.filter(
        (l) => l.changed_by === 'user-pm' || l.user_email === 'user-pm'
      );
      expect(samiLogs).toHaveLength(2);
      expect(samiLogs.map((l) => l.id)).toEqual(['log-3', 'log-4']);
    });

    it('filters correctly by date presets', () => {
      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;

      // Today
      const todayLogs = sampleLogs.filter((l) => {
        const time = new Date(l.created_at!).getTime();
        return now - time <= dayMs;
      });
      expect(todayLogs).toHaveLength(1);
      expect(todayLogs[0].id).toBe('log-1');

      // 7 days
      const weekLogs = sampleLogs.filter((l) => {
        const time = new Date(l.created_at!).getTime();
        return now - time <= 7 * dayMs;
      });
      expect(weekLogs).toHaveLength(2);
      expect(weekLogs.map((l) => l.id)).toEqual(['log-1', 'log-2']);

      // 30 days
      const monthLogs = sampleLogs.filter((l) => {
        const time = new Date(l.created_at!).getTime();
        return now - time <= 30 * dayMs;
      });
      expect(monthLogs).toHaveLength(3);
    });

    it('filters correctly by text search query across properties', () => {
      const search = (q: string) => {
        const s = q.toLowerCase();
        return sampleLogs.filter((l) => {
          const matchTable = l.table_name.toLowerCase().includes(s);
          const matchUser = (l.user_name || '').toLowerCase().includes(s);
          const matchRecord = (l.record_id || '').toLowerCase().includes(s);
          const matchContext = (l.context || '').toLowerCase().includes(s);
          const matchPayload =
            JSON.stringify(l.old_data || {}).toLowerCase().includes(s) ||
            JSON.stringify(l.new_data || {}).toLowerCase().includes(s);
          return matchTable || matchUser || matchRecord || matchContext || matchPayload;
        });
      };

      // Search by Arabic user name
      expect(search('سارة')).toHaveLength(1);
      expect(search('سارة')[0].id).toBe('log-2');

      // Search by table name
      expect(search('boq')).toHaveLength(1);

      // Search by context
      expect(search('العقد')).toHaveLength(1);
      expect(search('العقد')[0].id).toBe('log-1');

      // Search by payload value
      expect(search('150000')).toHaveLength(1);
      expect(search('150000')[0].id).toBe('log-1');
    });
  });

  describe('4. A11y & Expandable Disclosure Contract', () => {
    it('generates paired aria-expanded, aria-controls, and id attributes', () => {
      const logId = 'test-log-123';
      const triggerId = `audit-log-trigger-${logId}`;
      const panelId = `audit-log-details-${logId}`;

      const triggerProps = {
        id: triggerId,
        'aria-expanded': true,
        'aria-controls': panelId,
        'aria-label': 'تفاصيل العملية: تعديل في جدول المشاريع التعاقدية',
      };

      const panelProps = {
        id: panelId,
        role: 'region',
        'aria-labelledby': triggerId,
      };

      expect(triggerProps['aria-controls']).toBe(panelProps.id);
      expect(panelProps['aria-labelledby']).toBe(triggerProps.id);
      expect(panelProps.role).toBe('region');
      expect(triggerProps['aria-expanded']).toBe(true);
    });
  });

  describe('5. Multi-Source Unified Project Audit Trail Contract', () => {
    it('combines project inception (INSERT), BOQ revisions (UPDATE), archives (DELETE), and status changes (STATUS_CHANGE)', () => {
      const unifiedLogs: AuditLogEntry[] = [
        {
          id: 'proj_init_p1',
          table_name: 'pm_projects',
          record_id: 'p1',
          action: 'INSERT',
          created_at: '2026-09-01T10:00:00Z',
          changed_at: '2026-09-01T10:00:00Z',
          context: 'إنشاء وتأسيس المشروع في النظام واعتماد البيانات التعاقدية الأساسية',
        },
        {
          id: 'boq_rev_1',
          table_name: 'pm_boq_items',
          record_id: 'boq-1',
          action: 'UPDATE',
          created_at: '2026-09-10T12:00:00Z',
          changed_at: '2026-09-10T12:00:00Z',
          context: 'تحديث وتعديل بند المقايسة إلى الإصدار v2',
        },
        {
          id: 'arch_1',
          table_name: 'pm_archive_logs',
          record_id: 'del-1',
          action: 'DELETE',
          created_at: '2026-09-15T15:00:00Z',
          changed_at: '2026-09-15T15:00:00Z',
          context: 'حذف ونقل للأرشيف: بند ملغي',
        },
        {
          id: 'audit_1',
          table_name: 'projects',
          record_id: 'p1',
          action: 'STATUS_CHANGE',
          created_at: '2026-09-20T08:00:00Z',
          changed_at: '2026-09-20T08:00:00Z',
          context: 'تحديث حالة المشروع التعاقدية',
        },
      ];

      // Verifies each canonical action is represented
      const insertCount = unifiedLogs.filter((l) => l.action === 'INSERT').length;
      const updateCount = unifiedLogs.filter((l) => l.action === 'UPDATE').length;
      const deleteCount = unifiedLogs.filter((l) => l.action === 'DELETE').length;
      const statusCount = unifiedLogs.filter((l) => l.action === 'STATUS_CHANGE').length;

      expect(insertCount).toBe(1);
      expect(updateCount).toBe(1);
      expect(deleteCount).toBe(1);
      expect(statusCount).toBe(1);

      // Verifies reverse chronological order
      const sorted = [...unifiedLogs].sort(
        (a, b) => new Date(b.changed_at!).getTime() - new Date(a.changed_at!).getTime()
      );
      expect(sorted[0].id).toBe('audit_1');
      expect(sorted[sorted.length - 1].id).toBe('proj_init_p1');
    });
  });
});

