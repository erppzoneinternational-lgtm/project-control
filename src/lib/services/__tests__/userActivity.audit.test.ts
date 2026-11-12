import { describe, it, expect } from 'vitest';
import {
  formatDuration,
  UserActivityService,
} from '@/lib/services/userActivity.service';
import { AuditLogService } from '@/lib/services/auditLog.service';
import { AuditLogEntry } from '@/types';

describe('User Activity & Work Duration Service', () => {
  describe('formatDuration', () => {
    it('formats minutes under an hour correctly in English and Arabic', () => {
      expect(formatDuration(45, false)).toBe('45m');
      expect(formatDuration(45, true)).toBe('45 دقيقة');
      expect(formatDuration(0, false)).toBe('0m');
      expect(formatDuration(0, true)).toBe('0 دقيقة');
    });

    it('formats single hour correctly', () => {
      expect(formatDuration(60, false)).toBe('1h');
      expect(formatDuration(60, true)).toBe('ساعة واحدة');
      expect(formatDuration(75, false)).toBe('1h 15m');
      expect(formatDuration(75, true)).toBe('ساعة و 15 دقيقة');
    });

    it('formats two hours correctly in dual Arabic form', () => {
      expect(formatDuration(120, false)).toBe('2h');
      expect(formatDuration(120, true)).toBe('ساعتان');
      expect(formatDuration(150, false)).toBe('2h 30m');
      expect(formatDuration(150, true)).toBe('ساعتان و 30 دقيقة');
    });

    it('formats multi-hour work durations correctly', () => {
      expect(formatDuration(245, false)).toBe('4h 5m');
      expect(formatDuration(245, true)).toBe('4 ساعات و 5 دقيقة');
      expect(formatDuration(600, false)).toBe('10h');
      expect(formatDuration(600, true)).toBe('10 ساعات');
    });
  });

  describe('calculateDurationFromAuditLogs', () => {
    it('returns 0 minutes for empty logs', () => {
      const res = UserActivityService.calculateDurationFromAuditLogs([]);
      expect(res.totalMinutes).toBe(0);
      expect(res.todayMinutes).toBe(0);
    });

    it('clusters actions within 30 minutes into a cohesive working session', () => {
      const baseTime = new Date('2026-09-30T09:00:00Z').getTime();
      const mockLogs: AuditLogEntry[] = [
        {
          id: '1',
          table_name: 'projects',
          record_id: 'p-1',
          action: 'INSERT',
          changed_by: 'user-1',
          created_at: new Date(baseTime).toISOString(),
        },
        {
          id: '2',
          table_name: 'projects',
          record_id: 'p-1',
          action: 'UPDATE',
          changed_by: 'user-1',
          created_at: new Date(baseTime + 10 * 60 * 1000).toISOString(), // +10 mins
        },
        {
          id: '3',
          table_name: 'pm_boq_items',
          record_id: 'boq-1',
          action: 'UPDATE',
          changed_by: 'user-1',
          created_at: new Date(baseTime + 25 * 60 * 1000).toISOString(), // +25 mins
        },
      ];

      const res = UserActivityService.calculateDurationFromAuditLogs(mockLogs);
      // Span is 25 mins + 10 min baseline = 35 mins
      expect(res.totalMinutes).toBe(35);
      expect(res.lastActive).toBe(new Date(baseTime + 25 * 60 * 1000).toISOString());
    });

    it('handles multiple separated working sessions across the day', () => {
      const session1Start = new Date('2026-09-30T08:00:00Z').getTime();
      const session2Start = new Date('2026-09-30T14:00:00Z').getTime(); // 6 hours later

      const mockLogs: AuditLogEntry[] = [
        // Session 1: 08:00 to 08:30 (30m + 10m base = 40m)
        {
          id: '1',
          table_name: 'projects',
          record_id: 'p-1',
          action: 'INSERT',
          changed_by: 'user-1',
          created_at: new Date(session1Start).toISOString(),
        },
        {
          id: '2',
          table_name: 'projects',
          record_id: 'p-1',
          action: 'UPDATE',
          changed_by: 'user-1',
          created_at: new Date(session1Start + 30 * 60 * 1000).toISOString(),
        },
        // Session 2: 14:00 to 14:20 (20m + 10m base = 30m)
        {
          id: '3',
          table_name: 'site_tasks',
          record_id: 't-1',
          action: 'STATUS_CHANGE',
          changed_by: 'user-1',
          created_at: new Date(session2Start).toISOString(),
        },
        {
          id: '4',
          table_name: 'site_tasks',
          record_id: 't-1',
          action: 'UPDATE',
          changed_by: 'user-1',
          created_at: new Date(session2Start + 20 * 60 * 1000).toISOString(),
        },
      ];

      const res = UserActivityService.calculateDurationFromAuditLogs(mockLogs);
      expect(res.totalMinutes).toBe(70); // 40 + 30 = 70m (1h 10m)
    });
  });

  describe('getUserWorkMetrics', () => {
    it('computes metrics breakdown, actions count, and online status', () => {
      const mockUser = {
        id: 'user-eng-1',
        full_name: 'Eng. Ahmed Soliman',
        email: 'ahmed@pzone.com',
        roles: ['project_manager'],
      };

      const now = Date.now();
      const mockLogs: AuditLogEntry[] = [
        {
          id: '1',
          table_name: 'projects',
          record_id: 'p-101',
          action: 'INSERT',
          changed_by: 'user-eng-1',
          created_at: new Date(now - 2 * 60 * 1000).toISOString(), // 2 minutes ago
        },
        {
          id: '2',
          table_name: 'pm_boq_items',
          record_id: 'boq-1',
          action: 'UPDATE',
          changed_by: 'user-eng-1',
          created_at: new Date(now - 1 * 60 * 1000).toISOString(), // 1 minute ago
        },
      ];

      const metrics = UserActivityService.getUserWorkMetrics(mockUser, mockLogs);

      expect(metrics.userId).toBe('user-eng-1');
      expect(metrics.userName).toBe('Eng. Ahmed Soliman');
      expect(metrics.totalChangesCount).toBe(2);
      expect(metrics.actionsBreakdown.insert).toBe(1);
      expect(metrics.actionsBreakdown.update).toBe(1);
      expect(metrics.isOnline).toBe(true); // Active within 5 minutes
      expect(metrics.totalWorkMinutes).toBeGreaterThan(0);
    });
  });
});

describe('AuditLogService Diff & Formatting', () => {
  describe('computeDiff', () => {
    it('identifies changed fields and applies Arabic labels', () => {
      const oldData = {
        status: 'study',
        contract_value: 5000000,
        role: 'site_engineer',
      };
      const newData = {
        status: 'working',
        contract_value: 6200000,
        role: 'site_engineer', // unchanged
      };

      const diffs = AuditLogService.computeDiff(oldData, newData);

      expect(diffs).toHaveLength(2);

      const statusDiff = diffs.find((d) => d.field === 'status');
      expect(statusDiff).toBeDefined();
      expect(statusDiff?.fieldLabelAr).toBe('الحالة');
      expect(statusDiff?.oldValue).toBe('study');
      expect(statusDiff?.newValue).toBe('working');

      const valueDiff = diffs.find((d) => d.field === 'contract_value');
      expect(valueDiff).toBeDefined();
      expect(valueDiff?.fieldLabelAr).toBe('القيمة التعاقدية');
      expect(valueDiff?.oldValue).toBe(5000000);
      expect(valueDiff?.newValue).toBe(6200000);
    });

    it('ignores internal metadata fields like updated_at and id', () => {
      const oldData = { id: 'uuid-1', updated_at: '2026-01-01', name: 'Alpha' };
      const newData = { id: 'uuid-1', updated_at: '2026-01-02', name: 'Beta' };

      const diffs = AuditLogService.computeDiff(oldData, newData);
      expect(diffs).toHaveLength(1);
      expect(diffs[0].field).toBe('name');
    });
  });
});
