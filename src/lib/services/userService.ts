import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { AuditLogService } from './auditLog.service';

export type UserAccountStatus = 'pending_activation' | 'active' | 'suspended' | 'rejected' | string;

export interface UserProfileFull {
  id: string;
  email?: string;
  full_name?: string;
  full_name_ar?: string;
  full_name_en?: string;
  roles?: string[];
  status?: UserAccountStatus;
  price_access_granted?: boolean;
  phone?: string;
  department?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UpdateUserAccessPayload {
  userId: string;
  fullName?: string;
  assignedProjectIds: string[];
  priceAccessGranted: boolean;
  adminUserId?: string;
  notes?: string;
}

export const ADMIN_WHATSAPP_NUMBER = '201229994728';
export const ADMIN_DISPLAY_PHONE = '01229994728';
export const ADMIN_DISPLAY_PHONE_INTL = '+20 122 999 4728';
export const ADMIN_EMAIL = 'hassansolimanofficial@gmail.com';
export const ADMIN_NAME = 'Eng. Hassan Soliman';
export const ADMIN_NAME_AR = 'م/ حسن سليمان';

/**
 * Generates an official WhatsApp click-to-chat URL with pre-filled bilingual payload
 */
export function generateAdminWhatsAppUrl(user: {
  fullName?: string;
  email?: string;
  phone?: string;
}): string {
  const name = user.fullName || 'مستخدم جديد';
  const email = user.email || 'غير محدد';
  const dateStr = new Date().toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const msg = [
    `مرحباً م/ حسن،`,
    `لقد قمت بإنشاء حساب جديد على بوابة بي زون (Pzone ERP):`,
    `• الاسم: ${name}`,
    `• البريد: ${email}`,
    `• التاريخ: ${dateStr}`,
    `برجاء التكرم بتفعيل الحساب وتحديد الصلاحيات والمشاريع المخصصة.`,
  ].join('\n');

  return `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

/**
 * Generates an official mailto link to contact the system administrator directly
 */
export function generateAdminEmailUrl(user: {
  fullName?: string;
  email?: string;
}): string {
  const name = user.fullName || 'New User';
  const email = user.email || 'unspecified';
  const subject = encodeURIComponent(`طلب تفعيل حساب جديد في Pzone ERP — ${name}`);
  const body = encodeURIComponent(
    `مرحباً م/ حسن سليمان،\n\nلقد قمت بإنشاء حساب جديد على بوابة Pzone ERP:\nالاسم: ${name}\nالبريد الإلكتروني: ${email}\n\nبرجاء التكرم بتفعيل الحساب وتعيين الصلاحيات والمشاريع.\n\nشكراً جزيلاً.`
  );
  return `mailto:${ADMIN_EMAIL}?subject=${subject}&body=${body}`;
}

/**
 * Generates an official WhatsApp click-to-chat URL to message a user directly about account activation
 */
export function generateUserContactWhatsAppUrl(user: {
  phone?: string;
  fullName?: string;
  email?: string;
}): string | null {
  if (!user.phone) return null;
  const cleanPhone = user.phone.replace(/[^0-9]/g, '');
  if (!cleanPhone) return null;
  const name = user.fullName || 'زميلنا العزيز';
  const msg = [
    `مرحباً ${name}،`,
    `بخصوص طلب تسجيل وتفعيل حسابك على منصة Pzone Portal:`,
    `تمت مراجعة طلبك من قبل إدارة النظام، ونود إفادتك بحالة الحساب والصلاحيات الممنوحة.`,
  ].join('\n');

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
}

export class UserService {
  /**
   * Fetch all user profiles with role and activation status metadata
   */
  static async getProfiles(): Promise<UserProfileFull[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, full_name_ar, full_name_en, department, roles, is_active, status, price_access_granted, phone, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('[UserService.getProfiles] Failed:', { detail: error });
      throw error;
    }

    return (data || []).map((row) => {
      const roles = Array.isArray(row.roles) ? row.roles : [];
      const status = (row.status as UserAccountStatus | undefined) ?? undefined;

      return {
        ...row,
        roles,
        status,
        price_access_granted: row.price_access_granted ?? roles.some((r) =>
          [
            'commercial_manager',
            'cost_control',
            'estimator',
            'project_manager',
            'ceo',
            'coo',
            'chairman',
            'admin',
            'finance',
            'contract_admin',
            'planning_manager',
            'planning_engineer',
          ].includes(r)
        ),
      };
    });
  }

  /**
   * Fetch pending activation users only
   */
  static async getPendingUsers(): Promise<UserProfileFull[]> {
    const profiles = await this.getProfiles();
    return profiles.filter((p) => p.status === 'pending_activation');
  }

  /**
   * Fetch project IDs explicitly assigned to a specific user
   */
  static async getUserAssignedProjectIds(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('pm_user_project_access')
        .select('project_id')
        .eq('user_id', userId);

      if (error) {
        logger.warn('[UserService.getUserAssignedProjectIds] Error:', { detail: error });
        return [];
      }

      return (data || []).map((r) => r.project_id).filter(Boolean);
    } catch (err) {
      logger.warn('[UserService.getUserAssignedProjectIds] Caught:', { detail: err });
      return [];
    }
  }

  /**
   * Atomically save user customization (excluding roles/status which are managed in the Portal Console):
   * 1. Update writable profile fields (full_name, price_access_granted, updated_at)
   * 2. Replace user records in pm_user_project_access (user_id, project_id, access_level, assigned_by)
   * 3. Record audit trail entry in pm_audit_logs
   */
  static async updateUserAccess(payload: UpdateUserAccessPayload): Promise<void> {
    const {
      userId,
      fullName,
      assignedProjectIds,
      priceAccessGranted,
      adminUserId,
      notes,
    } = payload;

    const nowIso = new Date().toISOString();

    // 0. Fetch current profile
    const { data: existingProf } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', userId)
      .maybeSingle();

    const profileId = existingProf?.id || userId;

    // 1. Update only writable profile columns (roles, is_active, status are managed in Portal Console)
    const profileUpdate: Record<string, any> = {
      price_access_granted: priceAccessGranted,
      updated_at: nowIso,
    };

    if (fullName !== undefined && fullName.trim().length > 0) {
      const cleanName = fullName.trim();
      profileUpdate.full_name = cleanName;
      profileUpdate.full_name_ar = cleanName;
      profileUpdate.full_name_en = cleanName;
    }

    const { error: profErr } = await supabase
      .from('profiles')
      .update(profileUpdate)
      .eq('id', profileId);

    if (profErr) {
      logger.error('[UserService.updateUserAccess] Profile update failed:', { detail: profErr });
      throw new Error(`فشل تحديث بيانات المستخدم: ${profErr.message}`);
    }

    // 2. Synchronize pm_user_project_access
    // Allowed columns: id, user_id, project_id, access_level ('view' | 'manage'), assigned_by, created_at
    const { error: delErr } = await supabase
      .from('pm_user_project_access')
      .delete()
      .eq('user_id', profileId);

    if (delErr) {
      logger.error('[UserService.updateUserAccess] Project access delete failed:', { detail: delErr });
      throw new Error(`فشل تحديث ارتباطات المشاريع السابقة: ${delErr.message}`);
    }

    // Insert new grants if any
    if (assignedProjectIds.length > 0) {
      const rows = assignedProjectIds.map((projId) => ({
        user_id: profileId,
        project_id: projId,
        access_level: 'manage',
        assigned_by: adminUserId || null,
        created_at: nowIso,
      }));

      const { error: insErr } = await supabase
        .from('pm_user_project_access')
        .insert(rows);

      if (insErr) {
        logger.error('[UserService.updateUserAccess] Project access insert failed:', { detail: insErr });
        throw new Error(`فشل تسجيل ارتباطات المشاريع للمستخدم: ${insErr.message}`);
      }
    }

    // 3. Log Audit Entry into pm_audit_logs
    try {
      await AuditLogService.logAction({
        tableName: 'profiles',
        recordId: profileId,
        action: 'UPDATE',
        newData: {
          full_name: fullName?.trim() || existingProf?.full_name,
          assigned_projects_count: assignedProjectIds.length,
          price_access_granted: priceAccessGranted,
          admin_user_id: adminUserId,
          notes,
        },
        context: 'user_access_customization',
      });
    } catch (auditErr) {
      logger.warn('[UserService.updateUserAccess] Audit log warning:', { detail: auditErr });
    }
  }
}
