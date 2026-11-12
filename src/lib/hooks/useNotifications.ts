'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/stores/useAuthStore';
import { NotificationService } from '@/lib/services/notification.service';
import {
  AppNotification,
  NotificationQueryOptions,
  WebPushSubscriptionDTO,
} from '@/types/notifications';
import { logger } from '@/lib/logger';

export interface UseNotificationsReturn {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  isSubscribedToPush: boolean;
  error: string | null;
  fetchNotifications: (options?: NotificationQueryOptions) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: string | string[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  subscribeToPush: () => Promise<boolean>;
  unsubscribeFromPush: () => Promise<boolean>;
}

export function useNotifications(initialOptions?: NotificationQueryOptions): UseNotificationsReturn {
  const { user } = useAuth();
  const userId = user?.id;

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubscribedToPush, setIsSubscribedToPush] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const optionsRef = useRef<NotificationQueryOptions | undefined>(initialOptions);
  optionsRef.current = initialOptions;

  const fetchUnreadCount = useCallback(async () => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }
    try {
      const count = await NotificationService.getUnreadCount(userId);
      setUnreadCount(count);
    } catch (err: any) {
      logger.warn('useNotifications.fetchUnreadCount error', { detail: err });
    }
  }, [userId]);

  const fetchNotifications = useCallback(
    async (options?: NotificationQueryOptions) => {
      if (!userId) {
        setNotifications([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const effectiveOptions = options || optionsRef.current;
        const data = await NotificationService.getNotifications(userId, effectiveOptions);
        setNotifications(data);
        await fetchUnreadCount();
      } catch (err: any) {
        logger.error('useNotifications.fetchNotifications error', { detail: err });
        setError(err?.message || 'Failed to load notifications');
      } finally {
        setIsLoading(false);
      }
    },
    [userId, fetchUnreadCount]
  );

  // Mark single or multiple notifications as read
  const markAsRead = useCallback(
    async (notificationId: string | string[]) => {
      if (!userId) return;
      const ids = Array.isArray(notificationId) ? notificationId : [notificationId];
      if (ids.length === 0) return;

      // Optimistic local state update
      const now = new Date().toISOString();
      setNotifications((prev) =>
        prev.map((item) =>
          ids.includes(item.id)
            ? { ...item, is_read: true, read_at: item.read_at || now }
            : item
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - ids.length));

      try {
        await NotificationService.markAsRead(ids, userId);
      } catch (err: any) {
        logger.error('useNotifications.markAsRead error', { detail: err });
        // Refetch on error to restore accurate server state
        await fetchNotifications();
      }
    },
    [userId, fetchNotifications]
  );

  // Mark all unread notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    const now = new Date().toISOString();
    setNotifications((prev) =>
      prev.map((item) => ({ ...item, is_read: true, read_at: item.read_at || now }))
    );
    setUnreadCount(0);

    try {
      await NotificationService.markAllAsRead(userId);
    } catch (err: any) {
      logger.error('useNotifications.markAllAsRead error', { detail: err });
      await fetchNotifications();
    }
  }, [userId, fetchNotifications]);

  // Subscribe to Web Push Notifications via Service Worker
  const subscribeToPush = useCallback(async (): Promise<boolean> => {
    if (!userId || typeof window === 'undefined') return false;

    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      logger.warn('Web Push Notifications are not supported in this browser.');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        logger.warn('Notification permission was not granted', { detail: permission });
        setIsSubscribedToPush(false);
        return false;
      }

      let registration = await navigator.serviceWorker.getRegistration('/sw.js');
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      }

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuNxUhswGhRN2YvoQB96AJAk40';
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidPublicKey,
        });
      }

      const rawKey = subscription.getKey ? subscription.getKey('p256dh') : null;
      const rawAuth = subscription.getKey ? subscription.getKey('auth') : null;

      const p256dh = rawKey
        ? btoa(String.fromCharCode(...new Uint8Array(rawKey)))
        : '';
      const auth = rawAuth
        ? btoa(String.fromCharCode(...new Uint8Array(rawAuth)))
        : '';

      const pushDTO: WebPushSubscriptionDTO = {
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh,
        auth,
        user_agent: navigator.userAgent,
      };

      const saved = await NotificationService.savePushSubscription(pushDTO);
      if (saved) {
        setIsSubscribedToPush(true);
        return true;
      }
      return false;
    } catch (err: any) {
      logger.error('useNotifications.subscribeToPush error', { detail: err });
      return false;
    }
  }, [userId]);

  // Unsubscribe from Web Push Notifications
  const unsubscribeFromPush = useCallback(async (): Promise<boolean> => {
    if (!userId || typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration('/sw.js');
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          await NotificationService.deletePushSubscription(userId, subscription.endpoint);
        }
      }
      setIsSubscribedToPush(false);
      return true;
    } catch (err: any) {
      logger.error('useNotifications.unsubscribeFromPush error', { detail: err });
      return false;
    }
  }, [userId]);

  // Check push subscription state on mount
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !userId) return;

    let isMounted = true;
    navigator.serviceWorker.getRegistration('/sw.js').then((reg) => {
      if (!isMounted || !reg) return;
      reg.pushManager.getSubscription().then((sub) => {
        if (isMounted) {
          setIsSubscribedToPush(Boolean(sub));
        }
      });
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [userId]);

  // Initial fetch and Realtime subscription
  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    fetchNotifications();

    // Subscribe to Realtime notifications via Supabase channel
    const unsubscribe = NotificationService.subscribeToRealtime(
      userId,
      (newNotification: AppNotification) => {
        setNotifications((prev) => {
          if (prev.some((n) => n.id === newNotification.id)) return prev;
          return [newNotification, ...prev];
        });
        setUnreadCount((prev) => prev + 1);

        // Show browser native notification if permission granted
        if (
          typeof window !== 'undefined' &&
          'Notification' in window &&
          Notification.permission === 'granted'
        ) {
          try {
            new Notification(newNotification.title_ar || newNotification.title_en || 'Pzone Notification', {
              body: newNotification.body_ar || newNotification.body_en || '',
              icon: '/icon.png',
            });
          } catch {
            // Ignore native notification display error
          }
        }
      }
    );

    // Fallback periodic poll every 60s
    const pollInterval = setInterval(() => {
      fetchUnreadCount();
    }, 60000);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, [userId, fetchNotifications, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    isLoading,
    isSubscribedToPush,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    subscribeToPush,
    unsubscribeFromPush,
  };
}
