/**
 * Audit Log & Full Changelog Service
 * Provides full changelog retrieval, diff computation, and audit export capabilities
 */

import { supabase } from '@/lib/supabase';
import { AuditLogEntry, ChangelogDiffItem } from '@/types';
import * as XLSX from 'xlsx';

export const TABLE_DISPLAY_NAMES: Record<string, { nameAr: string; nameEn: string; iconBadge: string }> = {
  projects: { nameAr: 'المشاريع التعاقدية', nameEn: 'Projects', iconBadge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' },
  pm_projects: { nameAr: 'المشاريع التعاقدية', nameEn: 'Projects', iconBadge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' },
  pm_boq_items: { nameAr: 'جدول الكميات والمقايسات (BOQ)', nameEn: 'BOQ Items', iconBadge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' },
  boq_items: { nameAr: 'جدول الكميات والمقايسات (BOQ)', nameEn: 'BOQ Items', iconBadge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' },
  pm_daily_progress: { nameAr: 'تقارير الإنجاز اليومي', nameEn: 'Daily Progress', iconBadge: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300' },
  site_tasks: { nameAr: 'مهام الموقع التنفيذية', nameEn: 'Site Tasks', iconBadge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300' },
  project_stakeholders: { nameAr: 'تسكين الكادر والشركاء', nameEn: 'Stakeholder Assignments', iconBadge: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300' },
  stakeholders: { nameAr: 'دليل الشركاء', nameEn: 'Stakeholders Directory', iconBadge: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300' },
  pm_change_orders: { nameAr: 'أوامر التغيير (VOs)', nameEn: 'Change Orders', iconBadge: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' },
  profiles: { nameAr: 'بيانات المستخدمين', nameEn: 'User Profiles', iconBadge: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200' },
  user_roles: { nameAr: 'أدوار وصلاحيات النظام', nameEn: 'User Roles', iconBadge: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950/60 dark:text-fuchsia-300' },
  contract_module_access: { nameAr: 'صلاحيات الوحدات (RACI)', nameEn: 'Module Access', iconBadge: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300' },
  pm_archive_logs: { nameAr: 'بنك الأرشيف', nameEn: 'Archive Logs', iconBadge: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300' },
  pm_price_view_grants: { nameAr: 'صلاحيات عرض الأسعار', nameEn: 'Price View Grants', iconBadge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' },
};

export const ACTION_CONFIG: Record<string, { labelAr: string; labelEn: string; badgeCls: string }> = {
  INSERT: { labelAr: 'إنشاء سجل', labelEn: 'Create', badgeCls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
  UPDATE: { labelAr: 'تعديل بيانات', labelEn: 'Update', badgeCls: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
  DELETE: { labelAr: 'حذف', labelEn: 'Delete', badgeCls: 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border-rose-200 dark:border-rose-800' },
  STATUS_CHANGE: { labelAr: 'تغيير حالة', labelEn: 'Status Change', badgeCls: 'bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400 border-sky-200 dark:border-sky-800' },
};

const FIELD_LABELS_AR: Record<string, string> = {
  status: 'الحالة',
  project_name: 'اسم المشروع',
  project_code: 'كود المشروع',
  client_name: 'اسم العميل',
  contract_value: 'القيمة التعاقدية',
  total_contract_value: 'إجمالي القيمة التعاقدية',
  estimated_cost: 'التكلفة التقديرية',
  completion_pct: 'نسبة الإنجاز %',
  role: 'المسمى الوظيفي',
  full_name: 'الاسم الكامل',
  email: 'البريد الإلكتروني',
  phone: 'رقم الهاتف',
  is_active: 'حالة التفعيل',
  start_date: 'تاريخ البدء',
  end_date: 'تاريخ الانتهاء',
  quantity: 'الكمية',
  unit_price: 'سعر الوحدة',
  total_price: 'السعر الإجمالي',
  notes: 'الملاحظات',
  description: 'الوصف',
  assigned_to: 'المكلف بالعمل',
  suspension_reason: 'سبب الإيقاف المؤقت',
  cancellation_reason: 'سبب الإلغاء',
};

export class AuditLogService {
  /**
   * Fetch all audit logs and correlate with profiles to enrich user details
   */
  static async getFullChangelog(options: {
    userId?: string;
    action?: string;
    tableName?: string;
    limit?: number;
  } = {}): Promise<AuditLogEntry[]> {
    try {
      let query = supabase
        .from('pm_audit_logs')
        .select('*');

      if (options.userId) {
        query = query.eq('changed_by', options.userId);
      }
      if (options.action && options.action !== 'all') {
        query = query.eq('action', options.action);
      }
      if (options.tableName && options.tableName !== 'all') {
        query = query.eq('table_name', options.tableName);
      }

      // Order by changed_at if present or id desc
      query = query.order('id', { ascending: false }).limit(options.limit || 500);

      const { data, error } = await query;

      if (error) {
        console.warn('Error fetching audit logs:', error);
        return [];
      }

      const logs: AuditLogEntry[] = (data || []).map((row) => ({
        id: String(row.id),
        table_name: row.table_name,
        record_id: String(row.record_id),
        action: row.action,
        old_data: row.old_data || undefined,
        new_data: row.new_data || undefined,
        changed_by: row.changed_by,
        created_at: row.created_at || row.changed_at,
        changed_at: row.changed_at || row.created_at,
        context: row.context,
        ip_address: row.ip_address,
        user_agent: row.user_agent || undefined,
      }));

      // Enrich with profile names if possible
      try {
        const userIds = Array.from(new Set(logs.map((l) => l.changed_by).filter(Boolean)));
        if (userIds.length > 0) {
          const { data: profs } = await supabase
            .from('profiles')
            .select('id, full_name, full_name_ar, full_name_en, email, roles')
            .in('id', userIds);

          if (profs && profs.length > 0) {
            const profMap: Record<string, { full_name_ar?: string | null; full_name?: string | null; full_name_en?: string | null; email?: string; roles?: string[] | null }> = {};
            profs.forEach((p) => {
              if (p.id) profMap[p.id] = p;
            });

            logs.forEach((log) => {
              if (log.changed_by && profMap[log.changed_by]) {
                const p = profMap[log.changed_by];
                log.user_name = p.full_name || p.full_name_ar || p.full_name_en || p.email;
                log.user_email = p.email;
                log.user_role = Array.isArray(p.roles) && p.roles.length > 0 ? p.roles[0] : undefined;
              }
            });
          }
        }
      } catch {
        // Safe fallback if profiles query fails
      }

      return logs;
    } catch (err) {
      console.error('AuditLogService.getFullChangelog error:', err);
      return [];
    }
  }

  /**
   * Compute list of changed fields between oldData and newData
   */
  static computeDiff(
    oldData?: Record<string, unknown>,
    newData?: Record<string, unknown>
  ): ChangelogDiffItem[] {
    if (!oldData && !newData) return [];

    const diffItems: ChangelogDiffItem[] = [];
    const allKeys = Array.from(
      new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})])
    );

    // Skip internal fields
    const IGNORED_KEYS = new Set(['updated_at', 'created_at', 'id', 'user_id', 'metadata']);

    for (const key of allKeys) {
      if (IGNORED_KEYS.has(key)) continue;

      const oldVal = oldData ? oldData[key] : undefined;
      const newVal = newData ? newData[key] : undefined;

      // Check if values differ
      const isDifferent =
        JSON.stringify(oldVal) !== JSON.stringify(newVal);

      if (isDifferent) {
        diffItems.push({
          field: key,
          fieldLabelAr: FIELD_LABELS_AR[key] || key,
          oldValue: oldVal ?? '—',
          newValue: newVal ?? '—',
        });
      }
    }

    return diffItems;
  }

  /**
   * Export Changelog to Excel (.xlsx)
   */
  static exportChangelogToExcel(logs: AuditLogEntry[], fileNamePrefix = 'سجل_تغييرات_النظام') {
    const exportData = logs.map((log, index) => {
      const tableInfo = TABLE_DISPLAY_NAMES[log.table_name] || { nameAr: log.table_name, nameEn: log.table_name };
      const actionInfo = ACTION_CONFIG[log.action] || { labelAr: log.action, labelEn: log.action };
      const diffs = this.computeDiff(log.old_data, log.new_data);
      const changesSummary = diffs.map((d) => `${d.fieldLabelAr}: [${JSON.stringify(d.oldValue)}] ← [${JSON.stringify(d.newValue)}]`).join(' | ');

      return {
        'م': index + 1,
        'المستخدم القائم بالتعديل': log.user_name || log.changed_by || 'النظام',
        'البريد الإلكتروني': log.user_email || '-',
        'نوع العملية': actionInfo.labelAr,
        'الجدول / الوحدة': tableInfo.nameAr,
        'معرف السجل (Record ID)': log.record_id,
        'ملخص التغييرات': changesSummary || (log.action === 'INSERT' ? 'إنشاء سجل جديد' : 'تحديث عام'),
        'السياق / السبب': log.context || '-',
        'التاريخ والوقت': log.changed_at || log.created_at ? new Date((log.changed_at || log.created_at) as string).toLocaleString('ar-EG') : '-',
      };
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    ws['!cols'] = [
      { wch: 6 },
      { wch: 25 },
      { wch: 25 },
      { wch: 16 },
      { wch: 28 },
      { wch: 36 },
      { wch: 60 },
      { wch: 20 },
      { wch: 24 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'سجل_التغييرات');
    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `${fileNamePrefix}_${dateStr}.xlsx`, { bookType: 'xlsx' });
  }

  /**
   * Log action into pm_audit_logs securely
   */
  static async logAction(entry: {
    tableName: string;
    recordId: string;
    action: 'INSERT' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE';
    oldData?: Record<string, unknown>;
    newData?: Record<string, unknown>;
    context?: string;
  }): Promise<boolean> {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData?.user?.id;

      const { error } = await supabase.from('pm_audit_logs').insert([
        {
          table_name: entry.tableName,
          record_id: entry.recordId,
          action: entry.action,
          old_data: entry.oldData || null,
          new_data: entry.newData || null,
          changed_by: currentUserId || null,
          context: entry.context || 'user_interface_action',
        },
      ]);

      if (error) {
        console.warn('Could not insert audit log entry:', error);
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }
}
