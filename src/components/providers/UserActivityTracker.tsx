'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { supabase } from '@/lib/supabase';
import { UserActivityService, formatDuration } from '@/lib/services/userActivity.service';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Activity,
  Clock,
  EyeOff,
  Radio,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  Minimize2,
  Maximize2,
  Info,
} from 'lucide-react';

/**
 * Activity tracking state types
 */
export type ActivityStatus = 'active' | 'idle' | 'paused';

export interface UserActivityContextValue {
  status: ActivityStatus;
  isActive: boolean;
  isIdle: boolean;
  isPaused: boolean;
  todayMinutes: number;
  totalMinutes: number;
  lastActiveTime: number;
  lastPingTime: number | null;
  isPinging: boolean;
  forceHeartbeat: () => void;
}

const UserActivityContext = createContext<UserActivityContextValue | undefined>(undefined);

/**
 * Hook to consume user activity state anywhere in the application
 */
export const useUserActivity = (): UserActivityContextValue => {
  const ctx = useContext(UserActivityContext);
  if (!ctx) {
    return {
      status: 'active',
      isActive: true,
      isIdle: false,
      isPaused: false,
      todayMinutes: 0,
      totalMinutes: 0,
      lastActiveTime: Date.now(),
      lastPingTime: null,
      isPinging: false,
      forceHeartbeat: () => {},
    };
  }
  return ctx;
};

// Configuration constants
const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes cutoff for idle state
const HEARTBEAT_INTERVAL_MS = 60 * 1000; // 60 seconds heartbeat interval
const IDLE_CHECK_INTERVAL_MS = 10 * 1000; // 10 seconds idle check cadence
const INTERACTION_THROTTLE_MS = 2000; // 2 seconds throttle on interaction events
const STORAGE_MINIMIZE_KEY = 'pz_activity_badge_minimized';

/**
 * Standalone User Activity Status Badge Component
 * Can be rendered standalone or used inside the UserActivityTracker.
 */
export const UserActivityBadge: React.FC<{
  className?: string;
  showTime?: boolean;
  compact?: boolean;
}> = ({ className = '', showTime = true, compact = false }) => {
  const { status, isPinging, todayMinutes } = useUserActivity();
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const statusConfig = {
    active: {
      color: 'bg-emerald-500',
      pingColor: 'bg-emerald-400',
      textAr: 'نشط',
      textEn: 'Active',
      textColor: 'text-emerald-700 dark:text-emerald-400',
      bgBadge: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500/20',
    },
    idle: {
      color: 'bg-amber-500',
      pingColor: 'bg-amber-400',
      textAr: 'خامل',
      textEn: 'Idle',
      textColor: 'text-amber-700 dark:text-amber-400',
      bgBadge: 'bg-amber-50 dark:bg-amber-950/60 border-amber-500/20',
    },
    paused: {
      color: 'bg-stone-400 dark:bg-stone-500',
      pingColor: 'bg-stone-300 dark:bg-stone-600',
      textAr: 'متوقف',
      textEn: 'Paused',
      textColor: 'text-stone-600 dark:text-stone-400',
      bgBadge: 'bg-stone-100 dark:bg-stone-800/80 border-stone-300 dark:border-stone-700',
    },
  }[status];

  const formattedTime = formatDuration(todayMinutes, isAr);

  return (
    <div
      role="status"
      aria-label={
        isAr
          ? `حالة النشاط: ${statusConfig.textAr}، وقت العمل اليوم: ${formattedTime}`
          : `Activity status: ${statusConfig.textEn}, work time today: ${formattedTime}`
      }
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold border transition-colors ${statusConfig.bgBadge} ${className}`}
    >
      <span className="relative flex h-2 w-2">
        {status === 'active' && (
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isPinging ? 'animate-ping ' + statusConfig.pingColor : 'opacity-0'
            }`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${statusConfig.color}`} />
      </span>
      <span className={`text-[11px] font-bold ${statusConfig.textColor}`}>
        {isAr ? statusConfig.textAr : statusConfig.textEn}
      </span>
      {showTime && !compact && todayMinutes > 0 && (
        <span className="text-[10px] font-medium text-stone-500 dark:text-stone-400 border-s border-stone-200 dark:border-stone-700 ps-1.5 ms-0.5">
          {formattedTime}
        </span>
      )}
    </div>
  );
};

/**
 * Floating interactive activity status pill with ping pulse and expandable details
 */
const UserActivityFloatingPill: React.FC = () => {
  const { status, isPinging, todayMinutes, totalMinutes, lastPingTime, forceHeartbeat } =
    useUserActivity();
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const [expanded, setExpanded] = useState<boolean>(false);
  const [minimized, setMinimized] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(STORAGE_MINIMIZE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const toggleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !minimized;
    setMinimized(next);
    setExpanded(false);
    try {
      localStorage.setItem(STORAGE_MINIMIZE_KEY, String(next));
    } catch {
      // Ignore storage error
    }
  };

  const statusConfig = {
    active: {
      color: 'bg-emerald-500',
      pingColor: 'bg-emerald-400',
      glow: 'shadow-[0_0_8px_rgba(16,185,129,0.3)]',
      textAr: 'نشط',
      textEn: 'Active',
      descAr: 'جلسة العمل نشطة — يتم تسجيل النشاط دورياً كل دقيقة.',
      descEn: 'Work session active — activity recorded every minute.',
      textColor: 'text-emerald-700 dark:text-emerald-400',
      badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      icon: Activity,
    },
    idle: {
      color: 'bg-amber-500',
      pingColor: 'bg-amber-400',
      glow: 'shadow-[0_0_8px_rgba(245,158,11,0.3)]',
      textAr: 'خامل',
      textEn: 'Idle',
      descAr: 'توقف مؤقت لعدم وجود تفاعل لأكثر من 5 دقائق. حرّك المؤشر للاستئناف.',
      descEn: 'Paused due to inactivity (>5m). Move mouse or press a key to resume.',
      textColor: 'text-amber-700 dark:text-amber-400',
      badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      icon: Clock,
    },
    paused: {
      color: 'bg-stone-400 dark:bg-stone-500',
      pingColor: 'bg-stone-300 dark:bg-stone-600',
      glow: '',
      textAr: 'متوقف مؤقتاً',
      textEn: 'Paused',
      descAr: 'تم تعليق التتبع لمغادرة علامة التبويب.',
      descEn: 'Activity tracking suspended while tab is in background.',
      textColor: 'text-stone-600 dark:text-stone-400',
      badgeBg: 'bg-stone-500/10 text-stone-600 dark:text-stone-400 border-stone-500/20',
      icon: EyeOff,
    },
  }[status];

  const StatusIcon = statusConfig.icon;
  const formattedToday = formatDuration(todayMinutes, isAr);
  const formattedTotal = formatDuration(totalMinutes, isAr);

  // Minimized mode: compact dot indicator
  if (minimized) {
    return (
      <div className="fixed bottom-20 md:bottom-4 start-4 z-30 select-none print:hidden">
        <button
          type="button"
          onClick={toggleMinimize}
          aria-label={
            isAr
              ? `إظهار مؤشر النشاط (${statusConfig.textAr})`
              : `Show activity indicator (${statusConfig.textEn})`
          }
          title={
            isAr
              ? `تتبع النشاط: ${statusConfig.textAr} (${formattedToday})`
              : `Activity Tracker: ${statusConfig.textEn} (${formattedToday})`
          }
          className="relative flex items-center justify-center w-8 h-8 rounded-full bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border border-stone-200 dark:border-stone-800 shadow-md hover:scale-105 transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <span className="relative flex h-3 w-3">
            {status === 'active' && (
              <span
                className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isPinging ? 'animate-ping ' + statusConfig.pingColor : 'opacity-0'
                }`}
              />
            )}
            <span
              className={`relative inline-flex rounded-full h-3 w-3 ${statusConfig.color} ${statusConfig.glow}`}
            />
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 md:bottom-4 start-4 z-30 select-none print:hidden text-start">
      {/* Expanded details popover */}
      {expanded && (
        <div
          role="region"
          aria-label={isAr ? 'تفاصيل تتبع النشاط وساعات العمل' : 'Work activity tracking details'}
          className="mb-2 p-3.5 rounded-xl bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border border-stone-200 dark:border-stone-800 shadow-xl w-72 animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                {status === 'active' && (
                  <span
                    className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      isPinging ? 'animate-ping ' + statusConfig.pingColor : 'opacity-0'
                    }`}
                  />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${statusConfig.color}`}
                />
              </span>
              <span className="text-xs font-black text-stone-900 dark:text-stone-100">
                {isAr ? 'تتبع ساعات العمل' : 'Work Activity Tracker'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={toggleMinimize}
                title={isAr ? 'تصغير إلى نقطة' : 'Minimize to dot'}
                aria-label={isAr ? 'تصغير' : 'Minimize'}
                className="p-1 rounded-md text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                title={isAr ? 'إغلاق' : 'Close'}
                aria-label={isAr ? 'إغلاق التفاصيل' : 'Close details'}
                className="p-1 rounded-md text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Status info */}
          <div className="mt-2.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-500 dark:text-stone-400 font-medium">
                {isAr ? 'الحالة الحالية:' : 'Current Status:'}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${statusConfig.badgeBg}`}
              >
                {isAr ? statusConfig.textAr : statusConfig.textEn}
              </span>
            </div>

            <p className="text-[11px] leading-relaxed text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-950/60 p-2 rounded-lg border border-stone-200/60 dark:border-stone-800/80">
              {isAr ? statusConfig.descAr : statusConfig.descEn}
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-500/10">
                <span className="text-[10px] text-stone-500 dark:text-stone-400 block font-medium">
                  {isAr ? 'نشاط اليوم' : 'Today Work'}
                </span>
                <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 font-mono mt-0.5 block">
                  {formattedToday}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-stone-50 dark:bg-stone-950/40 border border-stone-200/60 dark:border-stone-800/80">
                <span className="text-[10px] text-stone-500 dark:text-stone-400 block font-medium">
                  {isAr ? 'الإجمالي المسجل' : 'Total Work'}
                </span>
                <span className="text-xs font-black text-stone-700 dark:text-stone-300 font-mono mt-0.5 block">
                  {formattedTotal}
                </span>
              </div>
            </div>

            {/* Sync heartbeat indicator */}
            <div className="flex items-center justify-between text-[10px] text-stone-400 dark:text-stone-500 pt-1">
              <span className="flex items-center gap-1">
                <Radio
                  className={`w-3 h-3 ${
                    isPinging
                      ? 'text-emerald-500 animate-pulse'
                      : 'text-stone-400 dark:text-stone-600'
                  }`}
                />
                {lastPingTime
                  ? isAr
                    ? 'آخر نبض: قيد التحديث'
                    : 'Heartbeat: Synced'
                  : isAr
                  ? 'بانتظار دورة النبض الأولى'
                  : 'Awaiting first heartbeat'}
              </span>
              <button
                type="button"
                onClick={forceHeartbeat}
                className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                {isAr ? 'مزامنة الآن' : 'Sync now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compact Status Pill Trigger */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-haspopup="true"
        aria-label={
          isAr
            ? `تتبع النشاط: ${statusConfig.textAr}، العمل اليوم: ${formattedToday}. اضغط لعرض التفاصيل.`
            : `Activity tracker: ${statusConfig.textEn}, today: ${formattedToday}. Click for details.`
        }
        className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border border-stone-200/90 dark:border-stone-800 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        <span className="relative flex h-2 w-2">
          {status === 'active' && (
            <span
              className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isPinging ? 'animate-ping ' + statusConfig.pingColor : 'opacity-0'
              }`}
            />
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${statusConfig.color} ${statusConfig.glow}`}
          />
        </span>

        <span className="text-[11px] font-black text-stone-700 dark:text-stone-300 group-hover:text-stone-900 dark:group-hover:text-white transition-colors">
          {isAr ? statusConfig.textAr : statusConfig.textEn}
        </span>

        {todayMinutes > 0 && (
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20 font-mono">
            {formattedToday}
          </span>
        )}

        {expanded ? (
          <ChevronDown className="w-3 h-3 text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300" />
        ) : (
          <ChevronUp className="w-3 h-3 text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300" />
        )}
      </button>
    </div>
  );
};

interface UserActivityTrackerProps {
  children: React.ReactNode;
  showBadge?: boolean;
}

/**
 * UserActivityTracker
 * Tracks user work duration (hours and minutes) accurately while user is active on the site.
 * Pauses when tab is hidden or when user is idle for > 5 minutes.
 * Includes:
 * 1. Visual activity ping indicator, idle detection handling, and status badge.
 * 2. WCAG-compliant screen reader status announcements (aria-live="polite").
 * 3. High-performance event throttling and optimized heartbeat timer.
 */
export const UserActivityTracker: React.FC<UserActivityTrackerProps> = ({
  children,
  showBadge = true,
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const [status, setStatus] = useState<ActivityStatus>('active');
  const [todayMinutes, setTodayMinutes] = useState<number>(0);
  const [totalMinutes, setTotalMinutes] = useState<number>(0);
  const [lastActiveTime, setLastActiveTime] = useState<number>(Date.now());
  const [lastPingTime, setLastPingTime] = useState<number | null>(null);
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [srAnnouncement, setSrAnnouncement] = useState<string>('');

  const userIdRef = useRef<string | null>(null);
  const lastInteractionRef = useRef<number>(Date.now());
  const lastThrottledRef = useRef<number>(0);
  const isDocumentVisibleRef = useRef<boolean>(true);
  const statusRef = useRef<ActivityStatus>('active');
  const pingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const srTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Accessible screen reader announcement helper
  const announce = useCallback((msg: string) => {
    if (srTimeoutRef.current) {
      clearTimeout(srTimeoutRef.current);
    }
    setSrAnnouncement(msg);
    srTimeoutRef.current = setTimeout(() => {
      setSrAnnouncement('');
    }, 4000);
  }, []);

  // Record an active heartbeat minute
  const recordHeartbeat = useCallback(() => {
    const userId = userIdRef.current;
    const now = Date.now();
    const timeSinceLastInteraction = now - lastInteractionRef.current;
    const isActive = isDocumentVisibleRef.current && timeSinceLastInteraction < IDLE_TIMEOUT_MS;

    if (userId && isActive) {
      const result = UserActivityService.recordActiveMinute(userId);
      setTodayMinutes(result.todayMinutes);
      setTotalMinutes(result.totalMinutes);
      setLastPingTime(now);
      setLastActiveTime(now);

      // Trigger visual radar ping ripple for 2 seconds
      setIsPinging(true);
      if (pingTimeoutRef.current) {
        clearTimeout(pingTimeoutRef.current);
      }
      pingTimeoutRef.current = setTimeout(() => {
        setIsPinging(false);
      }, 2000);
    }
  }, []);

  // Force manual heartbeat sync
  const forceHeartbeat = useCallback(() => {
    lastInteractionRef.current = Date.now();
    if (statusRef.current !== 'active' && isDocumentVisibleRef.current) {
      statusRef.current = 'active';
      setStatus('active');
      announce(isAr ? 'تم استئناف تتبع النشاط' : 'Activity tracking resumed');
    }
    recordHeartbeat();
  }, [recordHeartbeat, isAr, announce]);

  useEffect(() => {
    // 1. Fetch current logged-in user and existing stored minutes
    const checkUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user?.id) {
          userIdRef.current = data.user.id;
          const stored = UserActivityService.getStoredMinutes(data.user.id);
          setTodayMinutes(stored.todayMinutes);
          setTotalMinutes(stored.totalMinutes);
        }
      } catch {
        // Ignore auth error
      }
    };

    checkUser();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id || null;
      userIdRef.current = uid;
      if (uid) {
        const stored = UserActivityService.getStoredMinutes(uid);
        setTodayMinutes(stored.todayMinutes);
        setTotalMinutes(stored.totalMinutes);
      }
    });

    // 2. High-performance throttled user interaction listener (passive)
    const onUserInteraction = () => {
      const now = Date.now();
      // Skip processing if less than throttle threshold has passed
      if (now - lastThrottledRef.current < INTERACTION_THROTTLE_MS) {
        return;
      }
      lastThrottledRef.current = now;
      lastInteractionRef.current = now;

      // If user was idle or paused and interacts, resume active status immediately
      if (statusRef.current !== 'active' && isDocumentVisibleRef.current) {
        statusRef.current = 'active';
        setStatus('active');
        setLastActiveTime(now);
        announce(isAr ? 'تم استئناف تتبع ساعات العمل' : 'Work activity tracking resumed');
      }
    };

    // 3. Tab visibility change handler
    const onVisibilityChange = () => {
      const isVisible = !document.hidden;
      isDocumentVisibleRef.current = isVisible;

      if (!isVisible) {
        statusRef.current = 'paused';
        setStatus('paused');
        announce(
          isAr
            ? 'تم إيقاف تتبع النشاط مؤقتاً لمغادرة علامة التبويب'
            : 'Activity tracking paused while tab is hidden'
        );
      } else {
        const now = Date.now();
        const timeSinceLast = now - lastInteractionRef.current;
        if (timeSinceLast < IDLE_TIMEOUT_MS) {
          statusRef.current = 'active';
          setStatus('active');
          lastInteractionRef.current = now;
          setLastActiveTime(now);
          announce(
            isAr
              ? 'تمت العودة إلى علامة التبويب واستئناف تتبع النشاط'
              : 'Returned to tab, activity tracking active'
          );
        } else {
          statusRef.current = 'idle';
          setStatus('idle');
          announce(
            isAr
              ? 'تم إيقاف تتبع النشاط مؤقتاً لعدم وجود تفاعل'
              : 'Activity tracking paused due to inactivity'
          );
        }
      }
    };

    // 4. Attach passive event listeners to window
    const eventOptions: AddEventListenerOptions = { passive: true };
    window.addEventListener('mousemove', onUserInteraction, eventOptions);
    window.addEventListener('mousedown', onUserInteraction, eventOptions);
    window.addEventListener('keydown', onUserInteraction, eventOptions);
    window.addEventListener('touchstart', onUserInteraction, eventOptions);
    window.addEventListener('scroll', onUserInteraction, eventOptions);
    document.addEventListener('visibilitychange', onVisibilityChange);

    // 5. Multi-tab synchronization via localStorage events
    const onStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('pz_user_today_') && userIdRef.current) {
        const stored = UserActivityService.getStoredMinutes(userIdRef.current);
        setTodayMinutes(stored.todayMinutes);
        setTotalMinutes(stored.totalMinutes);
      }
    };
    window.addEventListener('storage', onStorageChange);

    // 6. Fast-cadence idle state checker (every 10 seconds)
    const idleCheckTimer = setInterval(() => {
      if (!isDocumentVisibleRef.current) return;
      const now = Date.now();
      const timeSinceLast = now - lastInteractionRef.current;

      if (timeSinceLast >= IDLE_TIMEOUT_MS && statusRef.current === 'active') {
        statusRef.current = 'idle';
        setStatus('idle');
        announce(
          isAr
            ? 'تم إيقاف تتبع ساعات العمل مؤقتاً لعدم وجود تفاعل لأكثر من 5 دقائق'
            : 'Activity tracking paused due to inactivity (>5m)'
        );
      }
    }, IDLE_CHECK_INTERVAL_MS);

    // 7. Heartbeat timer: every 60 seconds of active presence
    const heartbeatTimer = setInterval(() => {
      recordHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);

    // Initial announcement on component mount
    announce(
      isAr ? 'نظام تتبع ساعات العمل قيد التشغيل' : 'Work activity tracker running'
    );

    return () => {
      authListener?.subscription?.unsubscribe();
      window.removeEventListener('mousemove', onUserInteraction);
      window.removeEventListener('mousedown', onUserInteraction);
      window.removeEventListener('keydown', onUserInteraction);
      window.removeEventListener('touchstart', onUserInteraction);
      window.removeEventListener('scroll', onUserInteraction);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('storage', onStorageChange);
      clearInterval(idleCheckTimer);
      clearInterval(heartbeatTimer);
      if (pingTimeoutRef.current) clearTimeout(pingTimeoutRef.current);
      if (srTimeoutRef.current) clearTimeout(srTimeoutRef.current);
    };
  }, [recordHeartbeat, isAr, announce]);

  // Context value memoized to prevent re-rendering children on ping or ticker changes
  const contextValue = useMemo<UserActivityContextValue>(
    () => ({
      status,
      isActive: status === 'active',
      isIdle: status === 'idle',
      isPaused: status === 'paused',
      todayMinutes,
      totalMinutes,
      lastActiveTime,
      lastPingTime,
      isPinging,
      forceHeartbeat,
    }),
    [
      status,
      todayMinutes,
      totalMinutes,
      lastActiveTime,
      lastPingTime,
      isPinging,
      forceHeartbeat,
    ]
  );

  return (
    <UserActivityContext.Provider value={contextValue}>
      {/* Accessible Live Region for Screen Readers (WCAG 2.1/2.2 AA) */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {srAnnouncement}
      </div>

      {children}

      {/* Floating Status Badge / Ping Indicator */}
      {showBadge && <UserActivityFloatingPill />}
    </UserActivityContext.Provider>
  );
};
