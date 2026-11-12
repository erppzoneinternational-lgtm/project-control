/**
 * User Activity & Work Duration Tracking Service
 * Tracks active working time (hours and minutes) and correlates with changelog events
 */

import { AuditLogEntry, UserWorkDuration } from '@/types';

const ACTIVITY_STORAGE_PREFIX = 'pz_user_work_time_';
const TODAY_STORAGE_PREFIX = 'pz_user_today_';
const LAST_ACTIVE_PREFIX = 'pz_user_last_active_';

/**
 * Format minutes into clean "Xh Ym" or Arabic strings
 */
export function formatDuration(minutes: number, isAr: boolean = false): string {
  const safeMins = Math.max(0, Math.round(minutes));
  const hrs = Math.floor(safeMins / 60);
  const remMins = safeMins % 60;

  if (isAr) {
    if (hrs === 0) {
      return `${remMins} دقيقة`;
    }
    if (hrs === 1) {
      return remMins > 0 ? `ساعة و ${remMins} دقيقة` : 'ساعة واحدة';
    }
    if (hrs === 2) {
      return remMins > 0 ? `ساعتان و ${remMins} دقيقة` : 'ساعتان';
    }
    if (hrs >= 3 && hrs <= 10) {
      return remMins > 0 ? `${hrs} ساعات و ${remMins} دقيقة` : `${hrs} ساعات`;
    }
    return remMins > 0 ? `${hrs} ساعة و ${remMins} دقيقة` : `${hrs} ساعة`;
  }

  // English format e.g. "4h 25m" or "45m"
  if (hrs === 0) {
    return `${remMins}m`;
  }
  return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs}h`;
}

/**
 * Get today's key formatted as YYYY-MM-DD
 */
function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export class UserActivityService {
  /**
   * Record one active minute for the currently logged in user
   * Called by the heartbeat hook when the user is active in the portal
   */
  static recordActiveMinute(userId: string): { todayMinutes: number; totalMinutes: number } {
    if (typeof window === 'undefined' || !userId) {
      return { todayMinutes: 0, totalMinutes: 0 };
    }

    try {
      const todayKey = getTodayKey();
      const todayStorageKey = `${TODAY_STORAGE_PREFIX}${userId}_${todayKey}`;
      const totalStorageKey = `${ACTIVITY_STORAGE_PREFIX}${userId}`;
      const lastActiveKey = `${LAST_ACTIVE_PREFIX}${userId}`;

      const currentToday = parseInt(localStorage.getItem(todayStorageKey) || '0', 10);
      const currentTotal = parseInt(localStorage.getItem(totalStorageKey) || '0', 10);

      const newToday = currentToday + 1;
      const newTotal = currentTotal + 1;

      localStorage.setItem(todayStorageKey, newToday.toString());
      localStorage.setItem(totalStorageKey, newTotal.toString());
      localStorage.setItem(lastActiveKey, new Date().toISOString());

      return { todayMinutes: newToday, totalMinutes: newTotal };
    } catch (err) {
      console.warn('Could not record active minute to localStorage:', err);
      return { todayMinutes: 0, totalMinutes: 0 };
    }
  }

  /**
   * Get raw tracked minutes from storage
   */
  static getStoredMinutes(userId: string): { todayMinutes: number; totalMinutes: number; lastActive?: string } {
    if (typeof window === 'undefined' || !userId) {
      return { todayMinutes: 0, totalMinutes: 0 };
    }

    try {
      const todayKey = getTodayKey();
      const todayStorageKey = `${TODAY_STORAGE_PREFIX}${userId}_${todayKey}`;
      const totalStorageKey = `${ACTIVITY_STORAGE_PREFIX}${userId}`;
      const lastActiveKey = `${LAST_ACTIVE_PREFIX}${userId}`;

      const todayMinutes = parseInt(localStorage.getItem(todayStorageKey) || '0', 10);
      const totalMinutes = parseInt(localStorage.getItem(totalStorageKey) || '0', 10);
      const lastActive = localStorage.getItem(lastActiveKey) || undefined;

      return { todayMinutes, totalMinutes, lastActive };
    } catch {
      return { todayMinutes: 0, totalMinutes: 0 };
    }
  }

  /**
   * Calculate work duration from audit log clusters
   * When users perform mutations, actions within 30 min are grouped into work sessions
   */
  static calculateDurationFromAuditLogs(userLogs: AuditLogEntry[]): {
    totalMinutes: number;
    todayMinutes: number;
    lastActive?: string;
  } {
    if (!userLogs || userLogs.length === 0) {
      return { totalMinutes: 0, todayMinutes: 0 };
    }

    const todayStr = getTodayKey();

    // Extract valid timestamps and sort chronologically
    const timestamps = userLogs
      .map((l) => l.changed_at || l.created_at)
      .filter(Boolean)
      .map((ts) => new Date(ts as string).getTime())
      .filter((t) => !isNaN(t))
      .sort((a, b) => a - b);

    if (timestamps.length === 0) {
      return { totalMinutes: 0, todayMinutes: 0 };
    }

    const lastActive = new Date(timestamps[timestamps.length - 1]).toISOString();

    // Cluster timestamps within 30 minutes (1800000 ms)
    const CLUSTER_WINDOW = 30 * 60 * 1000;
    const BASE_SESSION_MINUTES = 10; // Baseline work duration for any isolated action

    let totalMinutes = 0;
    let todayMinutes = 0;

    let currentSessionStart = timestamps[0];
    let currentSessionEnd = timestamps[0];

    for (let i = 1; i < timestamps.length; i++) {
      const t = timestamps[i];
      if (t - currentSessionEnd <= CLUSTER_WINDOW) {
        // Extend current session
        currentSessionEnd = t;
      } else {
        // Finalize previous session
        const sessionSpanMs = currentSessionEnd - currentSessionStart;
        const sessionMins = Math.round(sessionSpanMs / 60000) + BASE_SESSION_MINUTES;
        totalMinutes += sessionMins;

        const sessionDate = new Date(currentSessionStart).toISOString().slice(0, 10);
        if (sessionDate === todayStr) {
          todayMinutes += sessionMins;
        }

        // Start new session
        currentSessionStart = t;
        currentSessionEnd = t;
      }
    }

    // Finalize last session
    const lastSessionSpanMs = currentSessionEnd - currentSessionStart;
    const lastSessionMins = Math.round(lastSessionSpanMs / 60000) + BASE_SESSION_MINUTES;
    totalMinutes += lastSessionMins;

    const lastSessionDate = new Date(currentSessionStart).toISOString().slice(0, 10);
    if (lastSessionDate === todayStr) {
      todayMinutes += lastSessionMins;
    }

    return { totalMinutes, todayMinutes, lastActive };
  }

  /**
   * Compute comprehensive work duration metrics for a single user
   */
  static getUserWorkMetrics(
    user: { id: string; full_name?: string; full_name_ar?: string; email?: string; roles?: string[] },
    allAuditLogs: AuditLogEntry[] = []
  ): UserWorkDuration {
    const userId = user.id;
    const userLogs = allAuditLogs.filter(
      (l) => l.changed_by === userId || l.user_email === user.email
    );

    // Stored active minutes from live tracking
    const stored = this.getStoredMinutes(userId);

    // Minutes calculated from changelog actions
    const auditDerived = this.calculateDurationFromAuditLogs(userLogs);

    // Effective work duration is the union of live tracked minutes and changelog work
    const totalMinutes = Math.max(stored.totalMinutes, auditDerived.totalMinutes);
    const todayMinutes = Math.max(stored.todayMinutes, auditDerived.todayMinutes);

    // Determine latest active timestamp
    let lastActiveAt = stored.lastActive || auditDerived.lastActive;
    if (stored.lastActive && auditDerived.lastActive) {
      lastActiveAt = new Date(stored.lastActive).getTime() > new Date(auditDerived.lastActive).getTime()
        ? stored.lastActive
        : auditDerived.lastActive;
    }

    // Online status: active within the last 5 minutes
    const isOnline = lastActiveAt
      ? Date.now() - new Date(lastActiveAt).getTime() < 5 * 60 * 1000
      : false;

    // Action counts breakdown
    const actionsBreakdown = {
      insert: userLogs.filter((l) => l.action === 'INSERT').length,
      update: userLogs.filter((l) => l.action === 'UPDATE').length,
      delete: userLogs.filter((l) => l.action === 'DELETE').length,
      statusChange: userLogs.filter((l) => l.action === 'STATUS_CHANGE').length,
    };

    // Extract last known IP and device
    let lastIpAddress: string | undefined;
    let lastDevice: string | undefined;

    if (userLogs.length > 0) {
      const sortedLogs = [...userLogs].sort((a, b) => {
        const timeA = new Date((a.changed_at || a.created_at) as string).getTime() || 0;
        const timeB = new Date((b.changed_at || b.created_at) as string).getTime() || 0;
        return timeB - timeA;
      });
      const latestWithInfo = sortedLogs.find((l) => l.ip_address || l.user_agent) || sortedLogs[0];
      if (latestWithInfo) {
        lastIpAddress = latestWithInfo.ip_address;
        lastDevice = latestWithInfo.user_agent || latestWithInfo.context;
      }
    }

    return {
      userId,
      userName: user.full_name_ar || user.full_name || user.email || 'مستخدم',
      userEmail: user.email || '',
      roles: user.roles || [],
      totalWorkMinutes: totalMinutes,
      todayWorkMinutes: todayMinutes,
      formattedTotal: formatDuration(totalMinutes, false),
      formattedToday: formatDuration(todayMinutes, false),
      formattedTotalAr: formatDuration(totalMinutes, true),
      formattedTodayAr: formatDuration(todayMinutes, true),
      lastActiveAt,
      lastIpAddress,
      lastDevice,
      isOnline,
      totalChangesCount: userLogs.length,
      actionsBreakdown,
    };
  }

  /**
   * Get work metrics for all users in the system
   */
  static getAllUsersMetrics(profiles: Array<{ id: string; full_name?: string; full_name_ar?: string; email?: string; roles?: string[] }>, allAuditLogs: AuditLogEntry[]): UserWorkDuration[] {
    return (profiles || []).map((p) => this.getUserWorkMetrics(p, allAuditLogs));
  }
}
