export interface AppNotification {
  id: string;
  recipient_user_id?: string;
  user_id?: string;
  project_id?: string | null;
  event_type?: string;
  type?: string;
  title_ar: string;
  title_en?: string | null;
  body_ar: string;
  body_en?: string | null;
  link_url?: string | null;
  entity_type?:
    | 'task'
    | 'inspection'
    | 'report'
    | 'constraint'
    | 'deliverable'
    | 'to_progress'
    | 'comment'
    | 'daily_progress'
    | 'obstruction'
    | 'general'
    | 'system';
  entity_id?: string | null;
  read_at?: string | null;
  is_read?: boolean;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface PushSubscriptionRecord {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateNotificationDTO {
  user_id?: string;
  recipient_user_id?: string;
  project_id?: string | null;
  type?: string;
  event_type?: string;
  title_ar: string;
  title_en?: string | null;
  body_ar: string;
  body_en?: string | null;
  link_url?: string | null;
  entity_type?:
    | 'task'
    | 'inspection'
    | 'report'
    | 'constraint'
    | 'deliverable'
    | 'to_progress'
    | 'comment'
    | 'daily_progress'
    | 'obstruction'
    | 'general'
    | 'system';
  entity_id?: string | null;
  metadata?: Record<string, any>;
}

export interface WebPushSubscriptionDTO {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent?: string | null;
}

export interface NotificationQueryOptions {
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
  entityType?: string;
}
