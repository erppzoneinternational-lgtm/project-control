'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  Bell,
  BellRing,
  BellOff,
  CheckCheck,
  Check,
  Clock,
  ClipboardCheck,
  PackageCheck,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  FileText,
  CheckSquare,
  Sparkles,
  ExternalLink,
  X,
  RotateCw,
  Radio,
} from 'lucide-react';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppNotification } from '@/types/notifications';
import { isFocusedProjectsMode, isRouteAllowedInFocusedMode } from '@/lib/config/module-visibility';
import { UiverseNotificationButton } from '../ui/UiverseNotificationButton';
import { UiversePillTabs } from '../ui/UiversePillTabs';

type NotificationCategoryTab = 'all' | 'tasks' | 'daily_progress' | 'deliverables' | 'approvals';

function formatRelativeTime(dateString: string, isAr: boolean): string {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

  if (diffInSeconds < 60) {
    return isAr ? 'الآن' : 'Just now';
  }
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return isAr ? `منذ ${diffInMinutes} د` : `${diffInMinutes}m ago`;
  }
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return isAr ? `منذ ${diffInHours} س` : `${diffInHours}h ago`;
  }
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return isAr ? `منذ ${diffInDays} يوم` : `${diffInDays}d ago`;
  }
  return date.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function getNotificationIcon(notification: AppNotification) {
  const entity = notification.entity_type;
  const event = notification.event_type || notification.type || '';

  if (event.includes('reject') || event.includes('block') || entity === 'obstruction') {
    return {
      icon: AlertTriangle,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-100 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900/50',
    };
  }

  if (event.includes('hold') || event.includes('critical')) {
    return {
      icon: ShieldAlert,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-100 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900/50',
    };
  }

  switch (entity) {
    case 'task':
      return {
        icon: CheckSquare,
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-100 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900/50',
      };
    case 'daily_progress':
    case 'to_progress':
      return {
        icon: ClipboardCheck,
        color: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900/50',
      };
    case 'deliverable':
      return {
        icon: PackageCheck,
        color: 'text-cyan-600 dark:text-cyan-400',
        bg: 'bg-cyan-100 dark:bg-cyan-950/60 border-cyan-200 dark:border-cyan-900/50',
      };
    case 'inspection':
    case 'report':
      return {
        icon: ShieldCheck,
        color: 'text-indigo-600 dark:text-indigo-400',
        bg: 'bg-indigo-100 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-900/50',
      };
    case 'comment':
      return {
        icon: FileText,
        color: 'text-purple-600 dark:text-purple-400',
        bg: 'bg-purple-100 dark:bg-purple-950/60 border-purple-200 dark:border-purple-900/50',
      };
    default:
      return {
        icon: Bell,
        color: 'text-stone-600 dark:text-stone-400',
        bg: 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700',
      };
  }
}

export interface NotificationCenterProps {
  className?: string;
  triggerVariant?: 'icon' | 'luxury' | 'luxury-compact';
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  className = '',
  triggerVariant = 'icon',
}) => {
  const router = useRouter();
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<NotificationCategoryTab>('all');
  const [mounted, setMounted] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const triggerId = 'notification-center-trigger';
  const popoverId = 'notification-center-popover';

  const containerRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    notifications,
    unreadCount,
    isLoading,
    isSubscribedToPush,
    markAsRead,
    markAllAsRead,
    subscribeToPush,
    unsubscribeFromPush,
    fetchNotifications,
  } = useNotifications();

  const triggerAriaLabel = isAr
    ? `مركز الإشعارات${unreadCount > 0 ? `، ${unreadCount} تنبيه غير مقروء` : '، لا توجد تنبيهات جديدة'}`
    : `Notification center${unreadCount > 0 ? `, ${unreadCount} unread` : ', no unread notifications'}`;

  // Calculate precise viewport-safe position
  const updatePosition = useCallback(() => {
    const anchor = bellRef.current || containerRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const margin = 12;
    const isMobile = window.innerWidth < 640;
    const width = isMobile ? Math.min(420, window.innerWidth - margin * 2) : 420;
    const top = rect.bottom + 8;

    let left: number;
    if (isMobile) {
      left = (window.innerWidth - width) / 2;
    } else {
      const anchorCenter = rect.left + rect.width / 2;
      const isRightHalf = anchorCenter > window.innerWidth / 2;

      if (isRightHalf) {
        // Anchor right edge to button's right edge, expanding inward towards left
        left = rect.right - width;
      } else {
        // Anchor left edge to button's left edge, expanding inward towards right
        left = rect.left;
      }

      // Viewport safety clamp
      left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));
    }

    setDropdownPos({ top, left, width });
  }, []);

  // Position updates on scroll & resize
  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const handleReposition = () => updatePosition();
      window.addEventListener('resize', handleReposition);
      window.addEventListener('scroll', handleReposition, true);
      return () => {
        window.removeEventListener('resize', handleReposition);
        window.removeEventListener('scroll', handleReposition, true);
      };
    }
  }, [isOpen, updatePosition]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      const inDropdown = dropdownRef.current?.contains(target);
      const inBell = bellRef.current?.contains(target);
      if (!inDropdown && !inBell) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Close on Escape key & return focus to trigger
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        bellRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    if (activeTab === 'all') return notifications;
    if (activeTab === 'tasks') {
      return notifications.filter((n) => n.entity_type === 'task');
    }
    if (activeTab === 'daily_progress') {
      return notifications.filter(
        (n) => n.entity_type === 'daily_progress' || n.entity_type === 'to_progress'
      );
    }
    if (activeTab === 'deliverables') {
      return notifications.filter((n) => n.entity_type === 'deliverable');
    }
    if (activeTab === 'approvals') {
      return notifications.filter(
        (n) =>
          n.entity_type === 'inspection' ||
          n.entity_type === 'report' ||
          (n.event_type && n.event_type.includes('approval')) ||
          (n.event_type && n.event_type.includes('signoff'))
      );
    }
    return notifications;
  }, [notifications, activeTab]);

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    if (notification.link_url) {
      setIsOpen(false);
      const pathOnly = notification.link_url.split('?')[0];
      if (isFocusedProjectsMode() && !isRouteAllowedInFocusedMode(pathOnly)) {
        if (notification.project_id) {
          router.push(`/projects/${notification.project_id}`);
        } else {
          router.push('/projects');
        }
        return;
      }
      router.push(notification.link_url);
    }
  };

  const handleTogglePush = async () => {
    if (isSubscribedToPush) {
      await unsubscribeFromPush();
    } else {
      await subscribeToPush();
    }
  };

  const handleMarkAllAsRead = async () => {
    if (isMarkingAll || unreadCount === 0) return;
    try {
      setIsMarkingAll(true);
      await markAllAsRead();
    } finally {
      setIsMarkingAll(false);
    }
  };

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      {/* Accessible polite live announcement for screen readers */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {unreadCount > 0
          ? isAr
            ? `لديك ${unreadCount} إشعار جديد غير مقروء`
            : `You have ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
          : isAr
          ? 'لا توجد إشعارات جديدة غير مقروءة'
          : 'No unread notifications'}
      </div>

      {/* Bell Trigger Button (Supports Standard Icon or Uiverse Luxury Trigger) */}
      {triggerVariant === 'luxury' || triggerVariant === 'luxury-compact' ? (
        <div className="inline-block">
          <UiverseNotificationButton
            ref={bellRef}
            id={triggerId}
            count={unreadCount}
            title={isAr ? 'تحديثات جديدة' : 'New Updates'}
            subtitle={isAr ? 'مركز الإشعارات الحية' : 'Live Notifications'}
            onClick={() => setIsOpen(!isOpen)}
            compact={triggerVariant === 'luxury-compact'}
            dir={isAr ? 'rtl' : 'ltr'}
            ariaLabel={triggerAriaLabel}
            ariaExpanded={isOpen}
            ariaControls={popoverId}
            ariaHasPopup="dialog"
          />
        </div>
      ) : (
        <button
          ref={bellRef}
          id={triggerId}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-controls={popoverId}
          aria-haspopup="dialog"
          aria-label={triggerAriaLabel}
          title={isAr ? 'مركز الإشعارات والتنبيهات الحية' : 'Notification Center'}
          className="relative min-w-[44px] min-h-[44px] p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200 dark:hover:bg-stone-700 transition-all border border-stone-200 dark:border-stone-700/80 cursor-pointer flex items-center justify-center group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <Bell className="w-4 h-4 text-stone-600 dark:text-stone-300 group-hover:text-emerald-500 transition-colors" />

          {/* Pulsing Badge with stable position */}
          {unreadCount > 0 && (
            <span
              className="absolute -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-600 px-1 text-[9px] font-black text-white shadow-sm ring-2 ring-white dark:ring-stone-900 tabular-nums select-none"
              style={{ left: '-4px' }}
            >
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative z-10 leading-none">{unreadCount > 99 ? '99+' : unreadCount}</span>
            </span>
          )}
        </button>
      )}

      {/* Dropdown Panel rendered via Portal into document.body */}
      {isOpen && mounted && dropdownPos && createPortal(
        <div
          id={popoverId}
          ref={dropdownRef}
          role="dialog"
          aria-modal={false}
          aria-labelledby="notification-center-heading"
          style={{
            position: 'fixed',
            top: `${dropdownPos.top}px`,
            left: `${dropdownPos.left}px`,
            width: `${dropdownPos.width}px`,
            zIndex: 99999,
          }}
          className="rounded-2xl backdrop-blur-xl bg-white/95 dark:bg-stone-900/95 border border-stone-200/90 dark:border-stone-800/90 shadow-2xl shadow-stone-900/15 dark:shadow-black/60 ring-1 ring-black/5 dark:ring-white/5 overflow-hidden flex flex-col max-h-[min(620px,85vh)] animate-in fade-in zoom-in-95 duration-150"
          dir={isAr ? 'rtl' : 'ltr'}
        >
          {/* Header */}
          <div className="shrink-0 p-3.5 sm:p-4 bg-stone-50/90 dark:bg-stone-900/90 border-b border-stone-200/80 dark:border-stone-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <BellRing className="w-4 h-4" />
              </div>
              <div>
                <h3
                  id="notification-center-heading"
                  className="text-xs sm:text-sm font-black text-stone-900 dark:text-white flex items-center gap-1.5"
                >
                  {isAr ? 'تنبيهات النظام الحية' : 'System Notifications'}
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white tabular-nums leading-none">
                      {unreadCount} {isAr ? 'جديد' : 'new'}
                    </span>
                  )}
                </h3>
                <p className="text-[10px] text-stone-500 dark:text-stone-400">
                  {isAr ? 'تحديث فوري عبر السيرفر' : 'Live WebSocket sync'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Push Subscription Toggle */}
              <button
                type="button"
                onClick={handleTogglePush}
                aria-pressed={isSubscribedToPush}
                aria-label={
                  isSubscribedToPush
                    ? isAr
                      ? 'إشعارات الويب مفعلة (انقر للتعطيل)'
                      : 'Web Push enabled (click to disable)'
                    : isAr
                    ? 'تفعيل إشعارات الويب'
                    : 'Enable Web Push notifications'
                }
                className={`min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl text-xs transition-colors cursor-pointer border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  isSubscribedToPush
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-800 dark:hover:text-white hover:bg-stone-200 dark:hover:bg-stone-700 border-stone-200 dark:border-stone-700'
                }`}
                title={
                  isSubscribedToPush
                    ? isAr
                      ? 'إشعارات الويب الحية (مفعلة) - انقر للتعطيل'
                      : 'Live Web Push (Active) - click to disable'
                    : isAr
                    ? 'تفعيل إشعارات الويب للمتصفح'
                    : 'Enable Browser Web Push'
                }
              >
                {isSubscribedToPush ? (
                  <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Radio className="w-3.5 h-3.5 opacity-50" />
                )}
              </button>

              {/* Mark all as read */}
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  disabled={isMarkingAll}
                  aria-busy={isMarkingAll}
                  aria-label={
                    isMarkingAll
                      ? isAr
                        ? 'جاري تحديد الكل كمقروء...'
                        : 'Marking all as read...'
                      : isAr
                      ? 'تحديد الكل كمقروء'
                      : 'Mark all as read'
                  }
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer border border-stone-200 dark:border-stone-700 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  title={isAr ? 'تحديد الكل كمقروء' : 'Mark all as read'}
                >
                  {isMarkingAll ? (
                    <RotateCw className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-spin" />
                  ) : (
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  )}
                </button>
              )}

              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  bellRef.current?.focus();
                }}
                aria-label={isAr ? 'إغلاق مركز الإشعارات' : 'Close notification center'}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Category Pill Tabs (Uiverse by uiverse-astronaut) */}
          <div className="shrink-0 p-2.5 bg-stone-50/90 dark:bg-stone-900/90 border-b border-stone-200/80 dark:border-stone-800/80 overflow-x-auto overflow-y-hidden no-scrollbar scrollbar-none">
            <UiversePillTabs<NotificationCategoryTab>
              tabs={[
                { id: 'all', label: isAr ? 'الكل' : 'All' },
                { id: 'tasks', label: isAr ? 'مهام' : 'Tasks' },
                { id: 'daily_progress', label: isAr ? 'يوميات' : 'Progress' },
                { id: 'deliverables', label: isAr ? 'تسليمات' : 'Deliverables' },
                { id: 'approvals', label: isAr ? 'اعتمادات' : 'Approvals' },
              ]}
              activeTab={activeTab}
              onChange={(id) => setActiveTab(id)}
              variant="emerald"
              size="sm"
              fullWidth
              dir={isAr ? 'rtl' : 'ltr'}
              ariaLabel={isAr ? 'تصنيف الإشعارات' : 'Notification categories'}
            />
          </div>

          {/* Notification Items List */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-2 space-y-1.5 divide-y divide-stone-100 dark:divide-stone-800/60 [scrollbar-width:thin] [scrollbar-color:rgba(156,163,175,0.4)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-stone-300 dark:[&::-webkit-scrollbar-thumb]:bg-stone-700 [&::-webkit-scrollbar-thumb]:rounded-full">
            {isLoading ? (
              <div className="py-12 text-center space-y-2">
                <RotateCw className="w-5 h-5 text-emerald-500 animate-spin mx-auto" />
                <p className="text-xs text-stone-400 font-medium">
                  {isAr ? 'جاري تحميل التنبيهات...' : 'Loading notifications...'}
                </p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="py-10 px-4 text-center space-y-3">
                {/* Ambient layered icon */}
                <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-teal-500/5 blur-sm" />
                  <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-50 dark:from-emerald-950/50 to-teal-50 dark:to-teal-950/30 border border-emerald-200/70 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
                    {activeTab === 'all' ? (
                      <Sparkles className="w-6 h-6" />
                    ) : activeTab === 'tasks' ? (
                      <CheckSquare className="w-6 h-6" />
                    ) : activeTab === 'daily_progress' ? (
                      <ClipboardCheck className="w-6 h-6" />
                    ) : activeTab === 'deliverables' ? (
                      <PackageCheck className="w-6 h-6" />
                    ) : (
                      <ShieldCheck className="w-6 h-6" />
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs sm:text-sm font-bold text-stone-800 dark:text-stone-200">
                    {activeTab === 'all'
                      ? isAr
                        ? 'أنت على اطلاع تام بكافة التحديثات'
                        : 'All caught up with updates'
                      : activeTab === 'tasks'
                      ? isAr
                        ? 'لا توجد تنبيهات خاصة بالمهام'
                        : 'No pending task alerts'
                      : activeTab === 'daily_progress'
                      ? isAr
                        ? 'لا توجد تنبيهات لليوميات وسير الأعمال'
                        : 'No daily progress alerts'
                      : activeTab === 'deliverables'
                      ? isAr
                        ? 'لا توجد تنبيهات لتسليمات المشروع'
                        : 'No deliverable alerts'
                      : isAr
                      ? 'لا توجد طلبات أو اعتمادات معلقة'
                      : 'No pending approvals'}
                  </p>
                  <p className="text-[11px] text-stone-400 dark:text-stone-500 max-w-[260px] mx-auto leading-relaxed mt-1">
                    {activeTab === 'all'
                      ? isAr
                        ? 'سيتم إشعارك فور حدوث أي تحديث بالمهام أو اليوميات أو التسليمات أو الاعتمادات'
                        : 'You will receive real-time notifications whenever tasks, deliverables, or approvals change'
                      : isAr
                      ? 'لا توجد إشعارات حالية ضمن هذا التصنيف، تفقد باقي الأقسام'
                      : 'No notifications currently in this category. Check other tabs or return to all'}
                  </p>
                </div>

                {/* Reset to All tab if in filtered tab */}
                {activeTab !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('all')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    {isAr ? 'عرض كافة التنبيهات' : 'View all notifications'}
                  </button>
                )}
              </div>
            ) : (
              filteredNotifications.map((n) => {
                const iconMeta = getNotificationIcon(n);
                const IconComp = iconMeta.icon;
                const title = isAr ? n.title_ar || n.title_en : n.title_en || n.title_ar;
                const body = isAr ? n.body_ar || n.body_en : n.body_en || n.body_ar;
                const isUnread = !n.is_read;

                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`group relative flex items-start gap-3 p-2.5 rounded-xl transition-all cursor-pointer border ${
                      isUnread
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/70 dark:border-emerald-900/40 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/40 hover:border-emerald-300/80 dark:hover:border-emerald-800/60'
                        : 'bg-white dark:bg-stone-900/50 hover:bg-stone-50 dark:hover:bg-stone-800/60 border-transparent hover:border-stone-200 dark:hover:border-stone-800'
                    }`}
                  >
                    {/* Unread Dot Indicator */}
                    {isUnread && (
                      <span
                        className="absolute top-3 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-stone-900"
                        style={{ [isAr ? 'left' : 'right']: '12px' }}
                      />
                    )}

                    {/* Category Icon */}
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${iconMeta.bg} ${iconMeta.color}`}
                    >
                      <IconComp className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 ps-1 pe-2 text-start">
                      <div className="flex items-center justify-between gap-1">
                        <p
                          className={`text-xs truncate ${
                            isUnread
                              ? 'font-black text-stone-900 dark:text-stone-100'
                              : 'font-semibold text-stone-700 dark:text-stone-300'
                          }`}
                          title={title || undefined}
                        >
                          <bdi>{title}</bdi>
                        </p>
                      </div>

                      {body && (
                        <p 
                          className="text-[11px] text-stone-600 dark:text-stone-300 line-clamp-2 leading-[1.65] pb-0.5 mt-0.5 break-words"
                          title={body || undefined}
                        >
                          <bdi>{body}</bdi>
                        </p>
                      )}

                      <div className="flex items-center justify-between gap-2 mt-1.5 pt-1 border-t border-stone-100/60 dark:border-stone-800/40">
                        <span className="text-[9.5px] font-mono text-stone-400 flex items-center gap-1 tabular-nums">
                          <Clock className="w-3 h-3 text-stone-400" />
                          {formatRelativeTime(n.created_at, isAr)}
                        </span>

                        {n.link_url && (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {isAr ? 'فتح الرابط' : 'Open'}
                            <ExternalLink className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Mark single as read button */}
                    {isUnread && (
                      <button
                        type="button"
                        disabled={markingId === n.id}
                        aria-busy={markingId === n.id}
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            setMarkingId(n.id);
                            await markAsRead(n.id);
                          } finally {
                            setMarkingId(null);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-stone-100 hover:bg-emerald-100 dark:bg-stone-800 dark:hover:bg-emerald-950/60 text-stone-500 hover:text-emerald-600 dark:text-stone-400 dark:hover:text-emerald-400 transition-all cursor-pointer border border-stone-200/60 dark:border-stone-700/60 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 max-sm:opacity-100 shrink-0 self-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={isAr ? 'تحديد كمقروء' : 'Mark as read'}
                        aria-label={isAr ? `تحديد إشعار "${title}" كمقروء` : `Mark notification "${title}" as read`}
                      >
                        {markingId === n.id ? (
                          <RotateCw className="w-3.5 h-3.5 animate-spin text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-stone-50 dark:bg-stone-900/90 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={() => fetchNotifications()}
              className="text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RotateCw className="w-3 h-3" />
              {isAr ? 'تحديث القائمة' : 'Refresh'}
            </button>

            <span className="text-[10px] font-mono text-stone-400">
              {notifications.length} {isAr ? 'إجمالي التنبيهات' : 'total alerts'}
            </span>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
