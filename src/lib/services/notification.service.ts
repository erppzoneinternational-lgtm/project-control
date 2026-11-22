import { supabase } from '@/lib/supabase';
import { SUPABASE_SCHEMA } from '@/lib/supabase/config';
import { appCache, TTL } from '@/lib/cache';
import {
  AppNotification,
  PushSubscriptionRecord,
  CreateNotificationDTO,
  WebPushSubscriptionDTO,
  NotificationQueryOptions,
} from '@/types/notifications';
import { logger } from '@/lib/logger';

export class NotificationService {
  /**
   * Fetch paginated notifications for current user with caching and filter support.
   */
  static async getNotifications(
    userId: string,
    options?: NotificationQueryOptions
  ): Promise<AppNotification[]> {
    if (!userId) return [];
    const cacheKey = `notifications:list:${userId}:${JSON.stringify(options || {})}`;

    return appCache.getOrFetch(cacheKey, TTL.dailyProgress || 15000, async () => {
      try {
        let query = supabase
          .from('pm_notifications')
          .select('*')
          .eq('recipient_user_id', userId)
          .order('occurred_at', { ascending: false });

        if (options?.unreadOnly) {
          query = query.is('read_at', null);
        }

        if (options?.entityType) {
          query = query.eq('entity_type', options.entityType);
        }

        if (options?.limit !== undefined && options?.offset !== undefined) {
          query = query.range(options.offset, options.offset + options.limit - 1);
        } else if (options?.limit !== undefined) {
          query = query.limit(options.limit);
        }

        const { data, error } = await query;

        if (error) {
          logger.warn('NotificationService.getNotifications error:', { detail: error });
          return [];
        }

        return (data || []).map((row) => ({
          ...row,
          user_id: row.recipient_user_id,
          type: row.event_type,
          is_read: Boolean(row.read_at),
          created_at: row.occurred_at || row.created_at,
        })) as AppNotification[];
      } catch (err) {
        logger.warn('NotificationService.getNotifications exception:', { detail: err });
        return [];
      }
    });
  }

  /**
   * Fetch unread notification count via RPC rpc_unread_notification_count with query fallback.
   */
  static async getUnreadCount(userId: string): Promise<number> {
    if (!userId) return 0;
    try {
      const { data, error } = await supabase.rpc('rpc_unread_notification_count');
      if (!error && typeof data === 'number') {
        return data;
      }
      if (!error && data && typeof data.count === 'number') {
        return data.count;
      }

      // Fallback query if RPC returns error or unexpected payload
      const { count, error: countErr } = await supabase
        .from('pm_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_user_id', userId)
        .is('read_at', null);

      if (countErr) {
        logger.warn('NotificationService.getUnreadCount fallback error:', { detail: countErr });
        return 0;
      }

      return count ?? 0;
    } catch (err) {
      logger.warn('NotificationService.getUnreadCount exception:', { detail: err });
      return 0;
    }
  }

  /**
   * Mark selected notification IDs as read via RPC rpc_mark_notifications_read.
   */
  static async markAsRead(notificationIds: string[], userId?: string): Promise<boolean> {
    if (!notificationIds || notificationIds.length === 0) return true;
    try {
      const { error } = await supabase.rpc('rpc_mark_notifications_read', {
        p_notification_ids: notificationIds,
      });

      if (error) {
        // Fallback update on table directly
        const { error: updateError } = await supabase
          .from('pm_notifications')
          .update({ read_at: new Date().toISOString() })
          .in('id', notificationIds);

        if (updateError) throw updateError;
      }

      appCache.invalidate('notifications:');
      return true;
    } catch (err) {
      logger.error('NotificationService.markAsRead error:', { detail: err });
      return false;
    }
  }

  /**
   * Mark all unread notifications as read for a given user.
   */
  static async markAllAsRead(userId: string): Promise<boolean> {
    if (!userId) return false;
    try {
      const { error } = await supabase.rpc('rpc_mark_notifications_read', {
        p_notification_ids: null,
      });

      if (error) {
        // Fallback update on table directly
        const { error: updateError } = await supabase
          .from('pm_notifications')
          .update({ read_at: new Date().toISOString() })
          .eq('recipient_user_id', userId)
          .is('read_at', null);

        if (updateError) throw updateError;
      }

      appCache.invalidate('notifications:');
      return true;
    } catch (err) {
      logger.error('NotificationService.markAllAsRead error:', { detail: err });
      return false;
    }
  }

  /**
   * Save or update Web Push subscription in pm_push_subscriptions.
   */
  static async savePushSubscription(subscription: WebPushSubscriptionDTO): Promise<boolean> {
    if (!subscription.user_id || !subscription.endpoint) return false;
    try {
      const payload = {
        user_id: subscription.user_id,
        endpoint: subscription.endpoint,
        p256dh: subscription.p256dh,
        auth: subscription.auth,
        user_agent: subscription.user_agent || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('pm_push_subscriptions')
        .upsert(payload, { onConflict: 'user_id,endpoint' });

      if (error) throw error;
      return true;
    } catch (err) {
      logger.error('NotificationService.savePushSubscription error:', { detail: err });
      return false;
    }
  }

  /**
   * Remove Web Push subscription upon user logout or notification toggle.
   */
  static async deletePushSubscription(userId: string, endpoint: string): Promise<boolean> {
    if (!userId || !endpoint) return false;
    try {
      const { error } = await supabase
        .from('pm_push_subscriptions')
        .delete()
        .eq('user_id', userId)
        .eq('endpoint', endpoint);

      if (error) throw error;
      return true;
    } catch (err) {
      logger.error('NotificationService.deletePushSubscription error:', { detail: err });
      return false;
    }
  }

  /**
   * Insert notification item (used by server actions / event handlers).
   */
  static async createNotification(dto: CreateNotificationDTO): Promise<AppNotification | null> {
    try {
      const recipientId = dto.recipient_user_id || dto.user_id;
      if (!recipientId) throw new Error('Recipient user ID is required');

      const payload = {
        recipient_user_id: recipientId,
        project_id: dto.project_id || null,
        event_type: dto.event_type || dto.type || 'general',
        entity_type: dto.entity_type || 'general',
        entity_id: dto.entity_id || '00000000-0000-0000-0000-000000000000', // NOT NULL — use nil UUID as default
        title_ar: dto.title_ar,
        title_en: dto.title_en || null,
        body_ar: dto.body_ar,
        body_en: dto.body_en || null,
        link_url: dto.link_url || null,
        metadata: dto.metadata || {},
        // occurred_at is set automatically by DB — do NOT pass created_at (column doesn't exist)
      };

      const { data, error } = await supabase
        .from('pm_notifications')
        .insert(payload)
        .select('id, recipient_user_id, project_id, event_type, entity_type, entity_id, title_ar, title_en, body_ar, body_en, link_url, occurred_at, read_at, metadata')
        .single();

      if (error) throw error;

      appCache.invalidate('notifications:');

      return {
        ...data,
        created_at: data.occurred_at || new Date().toISOString(),
        user_id: data.recipient_user_id,
        type: data.event_type,
        is_read: Boolean(data.read_at),
      } as AppNotification;
    } catch (err) {
      logger.error('NotificationService.createNotification error:', { detail: err });
      return null;
    }
  }

  /**
   * Realtime Supabase Channel subscription helper.
   * Listens to INSERT on pm_notifications WHERE recipient_user_id = eq.${userId}.
   * Returns unsubscribe cleanup function.
   */
  static subscribeToRealtime(
    userId: string,
    onNotification: (notification: AppNotification) => void
  ): () => void {
    if (!userId) return () => {};

    const channelName = `pm_notifications_${userId}`;
    try {
      if (typeof supabase?.getChannels === 'function') {
        const existing = supabase.getChannels().find(
          (c) => c.topic === `realtime:${channelName}` || c.topic === channelName
        );
        if (existing && typeof supabase?.removeChannel === 'function') {
          supabase.removeChannel(existing);
        }
      }
    } catch {
      // ignore cleanup errors
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: SUPABASE_SCHEMA,
          table: 'pm_notifications',
          filter: `recipient_user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload?.new) {
            const notif = {
              ...payload.new,
              user_id: payload.new.recipient_user_id,
              type: payload.new.event_type,
              is_read: Boolean(payload.new.read_at),
            } as AppNotification;
            onNotification(notif);
          }
        }
      )
      .subscribe();

    return () => {
      try {
        if (typeof supabase?.removeChannel === 'function') {
          supabase.removeChannel(channel);
        } else {
          channel.unsubscribe();
        }
      } catch {
        channel.unsubscribe();
      }
    };
  }
}
