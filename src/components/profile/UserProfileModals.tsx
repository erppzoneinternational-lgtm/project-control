'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  User, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Loader2, 
  Save, 
  ShieldCheck, 
  Phone, 
  Mail,
  Building2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

/**
 * Reusable modal accessibility hook:
 * - Focus trap (Tab / Shift+Tab)
 * - Escape key dismissal
 * - Initial element focus
 * - Focus restoration on dismiss
 * - Body scroll locking
 */
function useModalAccessibility({
  isOpen,
  onClose,
  saving,
  initialFocusRef,
}: {
  isOpen: boolean;
  onClose: () => void;
  saving: boolean;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previousActiveElement.current = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = setTimeout(() => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
      } else if (modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length > 0) {
          focusable[0].focus();
        }
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!saving) {
          e.preventDefault();
          onClose();
        }
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => el.offsetParent !== null);

        if (focusable.length === 0) return;

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
      if (previousActiveElement.current && typeof previousActiveElement.current.focus === 'function') {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, onClose, saving, initialFocusRef]);

  return modalRef;
}

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  userEmail?: string;
  isAr?: boolean;
}

export function EditProfileModal({
  isOpen,
  onClose,
  userId,
  userEmail,
  isAr = true,
}: EditProfileModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fullNameAr, setFullNameAr] = useState('');
  const [fullNameEn, setFullNameEn] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');

  const firstInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useModalAccessibility({
    isOpen,
    onClose,
    saving,
    initialFocusRef: firstInputRef,
  });

  useEffect(() => {
    if (!isOpen || !userId) return;

    let mounted = true;
    setLoading(true);

    async function loadProfile() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, full_name_ar, full_name_en, phone, department')
          .eq('id', userId)
          .maybeSingle();

        if (error) throw error;

        if (mounted && data) {
          setFullNameAr(data.full_name_ar || data.full_name || '');
          setFullNameEn(data.full_name_en || data.full_name || '');
          setPhone(data.phone || '');
          setDepartment(data.department || '');
        }
      } catch (err: any) {
        console.error('Failed to load profile:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setSaving(true);
    try {
      const resolvedName = fullNameAr.trim() || fullNameEn.trim();
      // 1. Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name_ar: fullNameAr.trim(),
          full_name_en: fullNameEn.trim(),
          full_name: resolvedName,
          phone: phone.trim(),
          department: department.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // 2. Also update auth user metadata for immediate reflection
      await supabase.auth.updateUser({
        data: {
          full_name: resolvedName,
          full_name_ar: fullNameAr.trim(),
          full_name_en: fullNameEn.trim(),
          phone: phone.trim(),
          department: department.trim(),
        },
      });

      // 3. Dispatch global event for instant UI reflection across components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('pzone:profile-updated', {
            detail: { full_name: resolvedName, userId },
          })
        );
      }

      toast.success(isAr ? 'تم تحديث المعلومات الشخصية بنجاح' : 'Personal information updated successfully');
      onClose();
    } catch (err: any) {
      toast.error(err.message || (isAr ? 'حدث خطأ أثناء حفظ البيانات' : 'Failed to update personal information'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-profile-title"
      aria-describedby="edit-profile-desc"
      onClick={() => {
        if (!saving) onClose();
      }}
    >
      <div 
        ref={modalRef}
        className="w-full max-w-md rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <User className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h3 id="edit-profile-title" className="text-base font-bold text-stone-900 dark:text-white">
                {isAr ? 'المعلومات الشخصية' : 'Personal Information'}
              </h3>
              <p id="edit-profile-desc" className="text-xs text-stone-500 dark:text-stone-400">
                {isAr ? 'تعديل بيانات الحساب والاسم ورقم الهاتف' : 'Manage account details, name, and phone'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label={isAr ? 'إغلاق النافذة' : 'Close modal'}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        {loading ? (
          <div className="p-10 flex flex-col items-center justify-center gap-3 text-center" role="status">
            <Loader2 className="w-7 h-7 animate-spin text-emerald-600" aria-hidden="true" />
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
              {isAr ? 'جاري تحميل البيانات...' : 'Loading profile data...'}
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Email (Read Only) */}
            <div className="space-y-1.5">
              <label 
                htmlFor="edit-profile-email"
                className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-2"
              >
                <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" aria-hidden="true" />
                <span>{isAr ? 'البريد الإلكتروني' : 'Email Address'}</span>
                <span className="ms-auto inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-700">
                  <ShieldCheck className="w-3 h-3 text-stone-400 shrink-0" aria-hidden="true" />
                  {isAr ? 'مُعرّف أساسي' : 'Primary ID'}
                </span>
              </label>
              <input
                id="edit-profile-email"
                type="email"
                disabled
                readOnly
                aria-readonly="true"
                value={userEmail || ''}
                dir="ltr"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-stone-100/90 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/80 text-stone-500 dark:text-stone-400 cursor-not-allowed select-none font-mono text-left"
              />
            </div>

            {/* Full Name Arabic */}
            <div className="space-y-1.5">
              <label 
                htmlFor="edit-profile-name-ar"
                className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-2"
              >
                <User className="w-3.5 h-3.5 text-stone-400 shrink-0" aria-hidden="true" />
                <span>{isAr ? 'الاسم بالكامل (بالعربية)' : 'Full Name (Arabic)'}</span>
              </label>
              <input
                ref={firstInputRef}
                id="edit-profile-name-ar"
                type="text"
                dir="rtl"
                autoComplete="name"
                value={fullNameAr}
                onChange={(e) => setFullNameAr(e.target.value)}
                placeholder={isAr ? 'أدخل اسمك بالكامل بالعربية' : 'Enter full name in Arabic'}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-stone-50/70 dark:bg-stone-800/60 hover:bg-white dark:hover:bg-stone-800 focus:bg-white dark:focus:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-right"
              />
            </div>

            {/* Full Name English */}
            <div className="space-y-1.5">
              <label 
                htmlFor="edit-profile-name-en"
                className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-2"
              >
                <User className="w-3.5 h-3.5 text-stone-400 shrink-0" aria-hidden="true" />
                <span>{isAr ? 'الاسم بالكامل (بالإنجليزية)' : 'Full Name (English)'}</span>
                <span className="text-[10px] font-normal text-stone-400">({isAr ? 'اختياري' : 'Optional'})</span>
              </label>
              <input
                id="edit-profile-name-en"
                type="text"
                dir="ltr"
                autoComplete="name"
                value={fullNameEn}
                onChange={(e) => setFullNameEn(e.target.value)}
                placeholder="e.g. Hassan Ahmed Soliman"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-stone-50/70 dark:bg-stone-800/60 hover:bg-white dark:hover:bg-stone-800 focus:bg-white dark:focus:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-left"
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label 
                htmlFor="edit-profile-phone"
                className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-2"
              >
                <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" aria-hidden="true" />
                <span>{isAr ? 'رقم الهاتف / الواتساب' : 'Phone / WhatsApp'}</span>
                <span className="text-[10px] font-normal text-stone-400">({isAr ? 'اختياري' : 'Optional'})</span>
              </label>
              <div className="relative rounded-xl shadow-xs">
                <input
                  id="edit-profile-phone"
                  type="tel"
                  dir="ltr"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-stone-50/70 dark:bg-stone-800/60 hover:bg-white dark:hover:bg-stone-800 focus:bg-white dark:focus:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono text-left tracking-wider"
                />
              </div>
            </div>

            {/* Department */}
            <div className="space-y-1.5">
              <label 
                htmlFor="edit-profile-department"
                className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-2"
              >
                <Building2 className="w-3.5 h-3.5 text-stone-400 shrink-0" aria-hidden="true" />
                <span>{isAr ? 'الإدارة / القسم' : 'Department'}</span>
                <span className="text-[10px] font-normal text-stone-400">({isAr ? 'اختياري' : 'Optional'})</span>
              </label>
              <div className="relative rounded-xl shadow-xs">
                <input
                  id="edit-profile-department"
                  type="text"
                  dir="auto"
                  autoComplete="organization"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder={isAr ? 'مثال: إدارة المشروعات / المكتب الفني' : 'e.g. Project Management / Technical Office'}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-stone-50/70 dark:bg-stone-800/60 hover:bg-white dark:hover:bg-stone-800 focus:bg-white dark:focus:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 active:bg-stone-200 dark:active:bg-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2 dark:focus:ring-offset-stone-900"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={saving || loading}
                aria-busy={saving}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white transition-all flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20 hover:shadow-md hover:shadow-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-stone-900"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" aria-hidden="true" />
                    <span>{isAr ? 'جاري الحفظ...' : 'Saving...'}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{isAr ? 'حفظ التعديلات' : 'Save Changes'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAr?: boolean;
}

export function ChangePasswordModal({
  isOpen,
  onClose,
  isAr = true,
}: ChangePasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const passwordInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useModalAccessibility({
    isOpen,
    onClose,
    saving,
    initialFocusRef: passwordInputRef,
  });

  if (!isOpen) return null;

  const isMinLength = newPassword.length >= 6;
  const isMatching = newPassword.length > 0 && newPassword === confirmPassword;
  const canSubmit = isMinLength && isMatching && !saving;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword.length < 6) {
      const msg = isAr ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters';
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    if (newPassword !== confirmPassword) {
      const msg = isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match';
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success(isAr ? 'تم تغيير كلمة المرور بنجاح' : 'Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
      setErrorMsg('');
      onClose();
    } catch (err: any) {
      const msg = err.message || (isAr ? 'فشل تغيير كلمة المرور' : 'Failed to update password');
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-password-title"
      aria-describedby="change-password-desc"
      onClick={() => {
        if (!saving) onClose();
      }}
    >
      <div 
        ref={modalRef}
        className="w-full max-w-md rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
              <KeyRound className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h3 id="change-password-title" className="text-base font-bold text-stone-900 dark:text-white">
                {isAr ? 'تغيير كلمة المرور' : 'Change Password'}
              </h3>
              <p id="change-password-desc" className="text-xs text-stone-500 dark:text-stone-400">
                {isAr ? 'تعيين كلمة مرور جديدة وقوية لحسابك' : 'Set a new secure password for your account'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label={isAr ? 'إغلاق النافذة' : 'Close modal'}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Accessible high-contrast error alert */}
          {errorMsg && (
            <div 
              role="alert" 
              className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-200"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
              <span className="font-medium leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {/* New Password */}
          <div className="space-y-1.5">
            <label 
              htmlFor="change-pwd-new"
              className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-2"
            >
              <KeyRound className="w-3.5 h-3.5 text-stone-400 shrink-0" aria-hidden="true" />
              <span>{isAr ? 'كلمة المرور الجديدة' : 'New Password'}</span>
            </label>
            <div className="relative rounded-xl shadow-xs">
              <input
                ref={passwordInputRef}
                id="change-pwd-new"
                type={showPassword ? 'text' : 'password'}
                dir="ltr"
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="••••••••"
                className="w-full ps-3.5 pe-10 py-2.5 text-xs rounded-xl bg-stone-50/70 dark:bg-stone-800/60 hover:bg-white dark:hover:bg-stone-800 focus:bg-white dark:focus:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:border-amber-500 dark:focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all font-mono text-left"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? (isAr ? 'إخفاء كلمة المرور' : 'Hide password') : (isAr ? 'إظهار كلمة المرور' : 'Show password')}
                aria-pressed={showPassword}
                className="absolute end-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700/50 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              >
                {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label 
              htmlFor="change-pwd-confirm"
              className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-2"
            >
              <KeyRound className="w-3.5 h-3.5 text-stone-400 shrink-0" aria-hidden="true" />
              <span>{isAr ? 'تأكيد كلمة المرور' : 'Confirm New Password'}</span>
            </label>
            <div className="relative rounded-xl shadow-xs">
              <input
                id="change-pwd-confirm"
                type={showPassword ? 'text' : 'password'}
                dir="ltr"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-stone-50/70 dark:bg-stone-800/60 hover:bg-white dark:hover:bg-stone-800 focus:bg-white dark:focus:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:border-amber-500 dark:focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all font-mono text-left"
              />
            </div>
          </div>

          {/* Validation indicators */}
          <div className="space-y-1.5 pt-1">
            <div className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors ${
              newPassword.length === 0 
                ? 'text-stone-500 dark:text-stone-400' 
                : isMinLength 
                  ? 'text-emerald-700 dark:text-emerald-400' 
                  : 'text-amber-700 dark:text-amber-400'
            }`}>
              {isMinLength ? (
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-stone-400 dark:bg-stone-500 mx-1 shrink-0" aria-hidden="true" />
              )}
              <span>{isAr ? 'يجب أن لا تقل عن 6 أحرف أو أرقام' : 'Must be at least 6 characters'}</span>
            </div>

            {confirmPassword.length > 0 && (
              <div className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors ${
                isMatching 
                  ? 'text-emerald-700 dark:text-emerald-400' 
                  : 'text-rose-700 dark:text-rose-400'
              }`}>
                {isMatching ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600 dark:text-rose-400" aria-hidden="true" />
                )}
                <span>
                  {isMatching 
                    ? (isAr ? 'كلمتا المرور متطابقتان' : 'Passwords match') 
                    : (isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match')}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 active:bg-stone-200 dark:active:bg-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2 dark:focus:ring-offset-stone-900"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              aria-busy={saving}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white transition-all flex items-center justify-center gap-2 shadow-sm shadow-amber-600/20 hover:shadow-md hover:shadow-amber-600/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-stone-900"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" aria-hidden="true" />
                  <span>{isAr ? 'جاري التحديث...' : 'Updating...'}</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{isAr ? 'تغيير كلمة المرور' : 'Change Password'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
