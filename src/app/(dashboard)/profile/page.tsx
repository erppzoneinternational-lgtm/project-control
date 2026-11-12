'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/stores/useAuthStore';
import { useUserRoles } from '@/lib/hooks/useUserRoles';
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/ui/BackButton';
import { toast } from 'sonner';
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  ShieldCheck, 
  KeyRound, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Calendar, 
  Fingerprint, 
  Save, 
  Sparkles,
  Building,
  Briefcase,
  Check,
  Layers,
  Type,
  RotateCcw,
  SlidersHorizontal
} from 'lucide-react';
import { ROLE_LABELS, ROLE_LABELS_EN, ROLE_COLORS } from '@/lib/rbac/role-matrix';
import { useFont, FontOption } from '@/contexts/FontContext';
import { AiKeysCard } from '@/components/profile/AiKeysCard';
import { isFocusedProjectsMode } from '@/lib/config/module-visibility';

type TabView = 'all' | 'personal' | 'security' | 'typography';

export default function UserProfilePage() {
  const queryClient = useQueryClient();
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const { user } = useAuth();
  const { roles, isAdmin } = useUserRoles();

  // Navigation tab state for responsive layout
  const [activeTab, setActiveTab] = useState<TabView>('all');

  // Profile data state
  const { currentFontId, currentFont, availableFonts, setFont, resetFont, openFontCustomizer } = useFont();
  const [fontCategory, setFontCategory] = useState<'all' | 'system' | 'editorial' | 'modern' | 'artistic'>('all');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [initialProfile, setInitialProfile] = useState({ fullName: '', phone: '', department: '', jobTitle: '' });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  const getRoleLabel = (r: string) =>
    isAr ? (ROLE_LABELS[r] || r) : (ROLE_LABELS_EN[r] || ROLE_LABELS[r] || r);

  const isProfileDirty =
    fullName.trim() !== initialProfile.fullName.trim() ||
    phone.trim() !== initialProfile.phone.trim() ||
    department.trim() !== initialProfile.department.trim() ||
    jobTitle.trim() !== initialProfile.jobTitle.trim();

  // Security password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Helper for computing readable initials
  const getInitials = (name?: string, email?: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
      }
      return name.trim().slice(0, 2).toUpperCase();
    }
    if (email && email.trim()) {
      return email.trim().slice(0, 2).toUpperCase();
    }
    return 'PZ';
  };

  // Load user profile from Supabase profiles table and user metadata
  const loadProfile = useCallback(async () => {
    if (!user?.id) return;
    setLoadingProfile(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.warn('Notice loading profiles table:', error.message);
      }

      if (data) {
        const loadedName = data.full_name || data.full_name_ar || data.full_name_en || user.user_metadata?.full_name || '';
        const loadedPhone = data.phone || user.user_metadata?.phone || '';
        const loadedDept = data.department || user.user_metadata?.department || '';
        const loadedTitle = data.job_title || user.user_metadata?.job_title || '';
        setFullName(loadedName);
        setPhone(loadedPhone);
        setDepartment(loadedDept);
        setJobTitle(loadedTitle);
        setInitialProfile({ fullName: loadedName, phone: loadedPhone, department: loadedDept, jobTitle: loadedTitle });
      } else {
        const loadedName = user.user_metadata?.full_name || '';
        const loadedPhone = user.user_metadata?.phone || '';
        const loadedDept = user.user_metadata?.department || '';
        const loadedTitle = user.user_metadata?.job_title || '';
        setFullName(loadedName);
        setPhone(loadedPhone);
        setDepartment(loadedDept);
        setJobTitle(loadedTitle);
        setInitialProfile({ fullName: loadedName, phone: loadedPhone, department: loadedDept, jobTitle: loadedTitle });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoadingProfile(false);
    }
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Handle personal info update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setSavingProfile(true);
    try {
      const trimmedName = fullName.trim();
      // 1. Prepare profile updates
      const updateData: Record<string, string> = {
        full_name: trimmedName,
        full_name_ar: trimmedName,
        full_name_en: trimmedName,
        phone: phone.trim(),
        department: department.trim(),
        updated_at: new Date().toISOString(),
      };

      // 2. Resilient update to profiles table (targeting id)
      let { error: profileError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 3. Update auth user metadata so it persists across sessions
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: trimmedName,
          phone: phone.trim(),
          department: department.trim(),
          job_title: jobTitle.trim(),
        },
      });

      if (authError) {
        console.warn('Warning updating auth user metadata:', authError);
      }

      // 4. Invalidate TanStack query caches & notify components across app
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('pzone:profile-updated', {
            detail: { full_name: trimmedName, userId: user.id },
          })
        );
      }

      setInitialProfile({
        fullName: trimmedName,
        phone: phone.trim(),
        department: department.trim(),
        jobTitle: jobTitle.trim(),
      });

      toast.success(
        isAr ? 'تم حفظ التعديلات بنجاح' : 'Profile Updated Successfully',
        {
          description: isAr 
            ? 'تم تحديث الاسم ورقم الهاتف والإدارة والمسمى الوظيفي بنجاح.'
            : 'Your personal information, department, and job title have been updated.',
          duration: 4000,
        }
      );
    } catch (err: unknown) {
      console.error('Error saving profile:', err);
      toast.error(
        isAr ? 'تعذر حفظ البيانات' : 'Failed to Update Profile',
        {
          description: (err as Error).message || (isAr ? 'حدث خطأ غير متوقع أثناء تحديث البيانات.' : 'An error occurred while saving your profile.'),
          duration: 5000,
        }
      );
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle password update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword.length < 6) {
      const msg = isAr ? 'يجب أن تتكون كلمة المرور من 6 خانات على الأقل' : 'Password must be at least 6 characters';
      setPasswordError(msg);
      toast.warning(isAr ? 'تنبيه أمان' : 'Security Notice', { description: msg });
      return;
    }
    if (newPassword !== confirmPassword) {
      const msg = isAr ? 'كلمتا المرور غير متطابقتين، يرجى إعادة التحقق' : 'Passwords do not match';
      setPasswordError(msg);
      toast.warning(isAr ? 'تنبيه أمان' : 'Security Notice', { description: msg });
      return;
    }

    setUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        setPasswordError(error.message);
        toast.error(
          isAr ? 'فشل تغيير كلمة المرور' : 'Password Update Failed',
          {
            description: error.message,
            duration: 5000,
          }
        );
      } else {
        toast.success(
          isAr ? 'تم تغيير كلمة المرور بنجاح' : 'Password Changed Successfully',
          {
            description: isAr ? 'تم تحديث كلمة المرور الجديدة وتأمين حسابك بالمنظومة.' : 'Your new password has been applied securely.',
            duration: 4000,
          }
        );
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: unknown) {
      const msg = (err as Error).message || (isAr ? 'حدث خطأ أثناء تغيير كلمة المرور' : 'Error updating password');
      setPasswordError(msg);
      toast.error(
        isAr ? 'خطأ في الأمان' : 'Security Error',
        { description: msg, duration: 5000 }
      );
    } finally {
      setUpdatingPassword(false);
    }
  };

  const isMinLength = newPassword.length >= 6;
  const isMatching = newPassword.length > 0 && newPassword === confirmPassword;

  const focusedMode = isFocusedProjectsMode();
  const showPersonal = activeTab === 'all' || activeTab === 'personal';
  const showSecurity = activeTab === 'all' || activeTab === 'security';
  const showTypography = !focusedMode && (activeTab === 'all' || activeTab === 'typography');

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-12" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Back button */}
      <div>
        <BackButton href="/projects" label={isAr ? 'العودة للمنظومة' : 'Back to Portal'} />
      </div>

      {/* Header Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xl relative overflow-hidden">
        {/* Ambient subtle backdrops */}
        <div className="absolute top-0 end-0 -mt-10 -me-10 w-48 h-48 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 start-0 -mb-10 -ms-10 w-48 h-48 rounded-full bg-teal-500/5 blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Avatar with ring and active status dot */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-500 text-white font-black text-2xl sm:text-3xl flex items-center justify-center shadow-lg shadow-emerald-600/20 ring-4 ring-emerald-500/10">
                {getInitials(fullName, user?.email)}
              </div>
              <span
                className="absolute -bottom-1 -end-1 w-5 h-5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 flex items-center justify-center text-white"
                title={isAr ? 'الحساب نشط' : 'Active Account'}
              >
                <Check className="w-3 h-3 stroke-[3]" />
              </span>
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white break-words">
                  {fullName || (isAr ? 'مستخدم النظام' : 'System User')}
                </h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  <Check className="w-3 h-3" />
                  {isAr ? 'حساب نشط' : 'Active Account'}
                </span>
              </div>
              <p className="text-xs font-mono text-slate-600 dark:text-slate-300 text-start" dir="ltr">
                {user?.email}
              </p>
              {/* Assigned Roles Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {roles.length > 0 ? (
                  roles.map((r) => (
                    <span
                      key={r}
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${
                        ROLE_COLORS[r] || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <Shield className="w-3 h-3 shrink-0" />
                      <span>{getRoleLabel(r)}</span>
                    </span>
                  ))
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-lg border bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700">
                    <Shield className="w-3 h-3 shrink-0" />
                    <span>{isAr ? 'مستخدم قياسي' : 'Standard User'}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:items-end text-xs text-slate-600 dark:text-slate-300 space-y-1.5 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800">
            <span className="flex items-center gap-1.5 font-mono text-[11px]">
              <Fingerprint className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
              <span>ID: {user?.id ? `${user.id.slice(0, 8)}...${user.id.slice(-4)}` : 'N/A'}</span>
            </span>
            {user?.created_at && (
              <span className="flex items-center gap-1.5 text-[11px]">
                <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                <span>
                  {isAr ? 'عضو منذ:' : 'Member since:'}{' '}
                  {new Date(user.created_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Profile Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Account Status */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAr ? 'حالة الحساب' : 'Account Status'}
            </span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{isAr ? 'نشط وموثق' : 'Active & Verified'}</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {isAr ? 'جلسة مصادقة معتمدة' : 'Authenticated session'}
            </p>
          </div>
        </div>

        {/* Card 2: Primary Role */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAr ? 'المستوى والصلاحيات' : 'Role & Access'}
            </span>
            <div className="w-7 h-7 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-sm font-black text-slate-900 dark:text-white truncate">
              {roles.length > 0
                ? getRoleLabel(roles[0])
                : (isAdmin ? (isAr ? 'مدير نظام' : 'System Admin') : (isAr ? 'مستخدم' : 'Standard User'))}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {roles.length > 1
                ? (isAr ? `+${roles.length - 1} أدوار إضافية مخصصة` : `+${roles.length - 1} additional roles`)
                : (isAr ? 'صلاحيات قياسية للمنظومة' : 'Standard system privileges')}
            </p>
          </div>
        </div>

        {/* Card 3: Department & Job Title */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAr ? 'الإدارة والوظيفة' : 'Department & Title'}
            </span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-sm font-black text-slate-900 dark:text-white truncate">
              {jobTitle || department || (isAr ? 'لم يحدد بعد' : 'Not specified')}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {department ? (jobTitle ? department : (isAr ? 'القسم معتمد' : 'Department recorded')) : (isAr ? 'يرجى إكمال البيانات' : 'Update in profile form')}
            </p>
          </div>
        </div>

        {/* Card 4: Security Status */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAr ? 'حماية الحساب' : 'Account Security'}
            </span>
            <div className="w-7 h-7 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-sm font-black text-slate-900 dark:text-white">
              {isAr ? 'محمي بكلمة مرور' : 'Password Protected'}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {isAr ? 'تشفير Supabase Auth' : 'Supabase Auth encrypted'}
            </p>
          </div>
        </div>
      </div>

      {/* Responsive Section Tabs Switcher */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-3">
        <div 
          role="tablist"
          aria-label={isAr ? 'تبويبات الملف الشخصي والأمان' : 'Profile and Security Tabs'}
          className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60"
        >
          {/* Tab: All Sections */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'all'}
            onClick={() => setActiveTab('all')}
            className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">{isAr ? 'عرض شامل (الكل)' : 'All Sections'}</span>
            <span className="sm:hidden">{isAr ? 'الكل' : 'All'}</span>
          </button>

          {/* Tab: Personal Info */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'personal'}
            onClick={() => setActiveTab('personal')}
            className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'personal'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/50'
            }`}
          >
            <User className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">{isAr ? 'البيانات الشخصية' : 'Personal Info'}</span>
            <span className="sm:hidden">{isAr ? 'البيانات' : 'Profile'}</span>
          </button>

          {/* Tab: Security & Password */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'security'}
            onClick={() => setActiveTab('security')}
            className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'security'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/50'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">{isAr ? 'الأمان وكلمة المرور' : 'Security & Password'}</span>
            <span className="sm:hidden">{isAr ? 'الأمان' : 'Security'}</span>
          </button>

          {/* Tab: Typography & Fonts (Hidden in Phase 1 Focused Mode) */}
          {!focusedMode && (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'typography'}
              onClick={() => setActiveTab('typography')}
              className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'typography'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/50'
              }`}
            >
              <Type className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">{isAr ? 'الخط والطباعة' : 'Typography & Font'}</span>
              <span className="sm:hidden">{isAr ? 'الخطوط' : 'Fonts'}</span>
            </button>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>{isAr ? 'منظومة بوابة المشروعات الهندسية' : 'Engineering Enterprise Portal'}</span>
        </div>
      </div>

      {/* Main Grid: Profile Data & Security */}
      <div className={`grid gap-6 ${activeTab === 'all' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1 max-w-3xl mx-auto'}`}>
        {/* Personal Information Form */}
        {showPersonal && (
          <div className={activeTab === 'all' ? 'lg:col-span-7 space-y-6' : 'w-full space-y-6'}>
            <div className="rounded-3xl bg-white dark:bg-slate-900 p-6 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                  <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>{isAr ? 'بيانات المستخدم الشخصية' : 'Personal Information'}</span>
                </h2>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {isAr ? 'تحديث الاسم والوظيفة وبيانات الاتصال' : 'Update name, job title & contact'}
                </span>
              </div>

              {loadingProfile ? (
                <div className="py-12 text-center text-slate-500 dark:text-slate-400 space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600" />
                  <p className="text-xs font-bold">{isAr ? 'جاري تحميل البيانات...' : 'Loading profile...'}</p>
                </div>
              ) : (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  {/* Full Name & Primary Email in Responsive Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <label 
                        htmlFor="profile-fullName"
                        className="block text-xs font-bold text-slate-700 dark:text-slate-200"
                      >
                        {isAr ? 'الاسم الكامل *' : 'Full Name *'}
                      </label>
                      <div className="relative">
                        <input
                          id="profile-fullName"
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                          aria-required="true"
                          autoComplete="name"
                          placeholder={isAr ? 'أدخل اسمك الثلاثي أو الرباعي' : 'Enter your full name'}
                          className="w-full px-10 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-start"
                        />
                        <User className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Primary Email (Readonly) */}
                    <div className="space-y-1.5">
                      <label 
                        htmlFor="profile-email"
                        className="block text-xs font-bold text-slate-700 dark:text-slate-200"
                      >
                        {isAr ? 'البريد الإلكتروني الأساسي' : 'Primary Email'}
                      </label>
                      <div className="relative" dir="ltr">
                        <input
                          id="profile-email"
                          type="email"
                          value={user?.email || ''}
                          disabled
                          readOnly
                          aria-describedby="profile-email-desc"
                          className="w-full pl-10 pr-10 py-3 rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 text-sm font-mono cursor-not-allowed text-left"
                        />
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                      <span id="profile-email-desc" className="text-[10px] text-slate-500 dark:text-slate-400 block px-1">
                        {isAr ? 'البريد الإلكتروني مرتبط بتسجيل الدخول والمصادقة ولا يعدل يدوياً.' : 'Tied to auth identity; cannot be edited manually.'}
                      </span>
                    </div>
                  </div>

                  {/* Department & Job Title in Responsive RTL Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Department */}
                    <div className="space-y-1.5">
                      <label 
                        htmlFor="profile-department"
                        className="block text-xs font-bold text-slate-700 dark:text-slate-200"
                      >
                        {isAr ? 'القسم / الإدارة' : 'Department / Sector'}
                      </label>
                      <div className="relative">
                        <input
                          id="profile-department"
                          type="text"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          autoComplete="organization"
                          placeholder={isAr ? 'مثال: إدارة المشروعات / المكتب الفني' : 'e.g. Project Management / Technical Office'}
                          className="w-full px-10 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-start"
                        />
                        <Building className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Job Title */}
                    <div className="space-y-1.5">
                      <label 
                        htmlFor="profile-jobTitle"
                        className="block text-xs font-bold text-slate-700 dark:text-slate-200"
                      >
                        {isAr ? 'المسمى الوظيفي' : 'Job Title / Position'}
                      </label>
                      <div className="relative">
                        <input
                          id="profile-jobTitle"
                          type="text"
                          value={jobTitle}
                          onChange={(e) => setJobTitle(e.target.value)}
                          autoComplete="organization-title"
                          placeholder={isAr ? 'مثال: مدير مشروع / مهندس تخطيط أول' : 'e.g. Senior Project Manager'}
                          className="w-full px-10 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-start"
                        />
                        <Briefcase className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1.5">
                    <label 
                      htmlFor="profile-phone"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-200"
                    >
                      {isAr ? 'رقم الهاتف / الواتساب' : 'Phone / WhatsApp'}
                    </label>
                    <div className="relative" dir="ltr">
                      <input
                        id="profile-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        autoComplete="tel"
                        placeholder="01XXXXXXXXX / +966XXXXXXXX"
                        className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-left"
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block px-1">
                      {isAr ? 'يستخدم للتواصل المباشر وإشعارات فرق العمل بالمنظومة.' : 'Used for direct operational contact and team notifications.'}
                    </span>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={savingProfile || loadingProfile || !isProfileDirty}
                      aria-busy={savingProfile}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                    >
                      {savingProfile ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
                          <span>{isAr ? 'جاري الحفظ والتحديث...' : 'Saving Changes...'}</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 shrink-0" aria-hidden="true" />
                          <span>{isAr ? 'حفظ التعديلات' : 'Save Changes'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Security & Password Change */}
        {showSecurity && (
          <div className={activeTab === 'all' ? 'lg:col-span-5 space-y-6' : 'w-full space-y-6'}>
            <div className="rounded-3xl bg-white dark:bg-slate-900 p-6 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-xl space-y-5">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                  <KeyRound className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>{isAr ? 'تغيير كلمة المرور والأمان' : 'Security & Password'}</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isAr ? 'تحديث كلمة المرور لحماية حسابك في المنظومة' : 'Update your password to keep your account safe'}
                </p>
              </div>

              {passwordError && (
                <div 
                  role="alert" 
                  aria-live="polite"
                  className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{passwordError}</span>
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <input
                  type="email"
                  name="username"
                  autoComplete="username"
                  value={user?.email || ''}
                  readOnly
                  tabIndex={-1}
                  aria-hidden="true"
                  className="sr-only"
                />
                {/* New Password */}
                <div className="space-y-1.5">
                  <label 
                    htmlFor="security-newPassword"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-200"
                  >
                    {isAr ? 'كلمة المرور الجديدة *' : 'New Password *'}
                  </label>
                  <div className="relative" dir="ltr">
                    <input
                      id="security-newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (passwordError) setPasswordError('');
                      }}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      aria-required="true"
                      aria-invalid={!!passwordError}
                      aria-describedby="security-checklist"
                      className="w-full pl-10 pr-11 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-left"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      aria-label={showNewPassword ? (isAr ? 'إخفاء كلمة المرور' : 'Hide password') : (isAr ? 'إظهار كلمة المرور' : 'Show password')}
                      aria-pressed={showNewPassword}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer rounded-xl focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label 
                    htmlFor="security-confirmPassword"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-200"
                  >
                    {isAr ? 'تأكيد كلمة المرور الجديدة *' : 'Confirm New Password *'}
                  </label>
                  <div className="relative" dir="ltr">
                    <input
                      id="security-confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (passwordError) setPasswordError('');
                      }}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      aria-required="true"
                      aria-invalid={!!passwordError}
                      aria-describedby="security-checklist"
                      className="w-full pl-10 pr-11 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-left"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? (isAr ? 'إخفاء كلمة المرور' : 'Hide password') : (isAr ? 'إظهار كلمة المرور' : 'Show password')}
                      aria-pressed={showConfirmPassword}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer rounded-xl focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Criteria Checklist */}
                <div 
                  id="security-checklist"
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs"
                >
                  <div className={`flex items-center gap-2 transition-colors ${isMinLength ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                    <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{isAr ? 'طول كلمة المرور 6 خانات أو أكثر' : '6 characters or more'}</span>
                  </div>
                  <div className={`flex items-center gap-2 transition-colors ${isMatching ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                    <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{isAr ? 'تطابق كلمتي المرور المدخلتين' : 'Passwords match identically'}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={updatingPassword || !isMinLength || !isMatching}
                  aria-busy={updatingPassword}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-40 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition-all cursor-pointer disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                >
                  {updatingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
                      <span>{isAr ? 'جاري تحديث كلمة المرور...' : 'Updating password...'}</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>{isAr ? 'تحديث كلمة المرور' : 'Update Password'}</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Typography & Font Settings Section */}
        {showTypography && (
          <div className={activeTab === 'all' ? 'lg:col-span-12 space-y-6' : 'w-full space-y-6'}>
            <div className="rounded-3xl bg-white dark:bg-slate-900 p-6 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-xl space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                <div className="space-y-1">
                  <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                    <Type className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span>{isAr ? 'تخصيص الخط والطباعة (Typography)' : 'Typography & Font Settings'}</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isAr
                      ? 'اختر الخط المفضل لك كـ مستخدم للنظام وسيتم حفظه وتطبيقه على كافة الشاشات والقوائم فوراً'
                      : 'Choose your preferred font; automatically saved and applied to all dashboards, tables and navigation'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={openFontCustomizer}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>{isAr ? 'المستعرض الكامل للخطوط' : 'Open Full Customizer'}</span>
                  </button>

                  {currentFontId !== 'default' && (
                    <button
                      type="button"
                      onClick={() => {
                        resetFont();
                        toast.info(isAr ? 'تم استرجاع خط النظام الافتراضي' : 'Default system font restored');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                      title={isAr ? 'استعادة الخط الافتراضي' : 'Reset to default font'}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{isAr ? 'افتراضي' : 'Reset'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Current Active Font Spotlight */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/30 dark:from-slate-800/40 dark:to-emerald-950/20 border border-emerald-500/20 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {isAr ? 'الخط المفعّل حالياً في حسابك:' : 'Currently Active Font:'}
                    </span>
                    <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-500/30">
                      {isAr ? currentFont.name : currentFont.nameEn}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {isAr ? currentFont.categoryLabelAr : currentFont.categoryLabelEn} • {currentFont.weights.length} {isAr ? 'أوزان معتمدة' : 'weights'}
                  </span>
                </div>

                <div 
                  className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white space-y-1.5"
                  style={{ fontFamily: currentFont.family }}
                >
                  <p className="text-base sm:text-lg font-bold">
                    {isAr 
                      ? 'منظومة بي زون لإدارة المشروعات الهندسية والتنفيذية' 
                      : 'PZONE Project Management & Executive Enterprise Portal'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isAr
                      ? 'أ ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن هـ و ي • ٠١٢٣٤٥٦٧٨٩'
                      : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ • abcdefghijklmnopqrstuvwxyz • 0123456789'}
                  </p>
                </div>
              </div>

              {/* Quick Font Selector Grid */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {isAr ? 'اختر الخط المفضل من المجموعة المعتمدة:' : 'Select preferred font from approved library:'}
                  </span>
                  {/* Category Pills */}
                  <div className="flex flex-wrap items-center gap-1">
                    {[
                      { id: 'all', labelAr: 'الكل', labelEn: 'All' },
                      { id: 'editorial', labelAr: 'فخم ورسمي', labelEn: 'Editorial' },
                      { id: 'modern', labelAr: 'عصري وتقني', labelEn: 'Modern' },
                      { id: 'artistic', labelAr: 'فني وإبداعي', labelEn: 'Artistic' },
                      { id: 'system', labelAr: 'الأساسي', labelEn: 'Core' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFontCategory(cat.id as any)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          fontCategory === cat.id
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {isAr ? cat.labelAr : cat.labelEn}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {availableFonts
                    .filter((f: FontOption) => fontCategory === 'all' || f.category === fontCategory)
                    .map((f: FontOption) => {
                      const isSelected = f.id === currentFontId;
                      return (
                        <div
                          key={f.id}
                          onClick={() => {
                            setFont(f.id);
                            toast.success(
                              isAr ? `تم تفعيل ${f.name}` : `${f.nameEn} activated`,
                              { description: isAr ? 'تم حفظ تفضيل الخط بنجاح لحسابك' : 'Font preference applied and saved to your profile' }
                            );
                          }}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setFont(f.id);
                            }
                          }}
                          className={`p-3.5 rounded-2xl border text-start transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                            isSelected
                              ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-500 shadow-md shadow-emerald-500/10 ring-2 ring-emerald-500/20'
                              : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/60 dark:hover:bg-slate-800/60 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {isAr ? f.name : f.nameEn}
                                </h3>
                                {f.badgeAr && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                    {isAr ? f.badgeAr : f.badgeEn}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                {isAr ? f.categoryLabelAr : f.categoryLabelEn}
                              </span>
                            </div>

                            {isSelected && (
                              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </span>
                            )}
                          </div>

                          {/* Live preview line styled with this specific font */}
                          <div
                            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 text-slate-800 dark:text-slate-200 text-sm font-semibold truncate"
                            style={{ fontFamily: f.family }}
                          >
                            {isAr ? 'منظومة إدارة المشروعات الهندسية' : 'PZONE Portal System 2026'}
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                            <span>{f.weights.length} {isAr ? 'أوزان' : 'weights'}</span>
                            <span className="font-mono text-[9px]">{f.id}</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Per-user AI keys (BYOK) — Hidden in Phase 1 Focused Mode */}
      {!focusedMode && (
        <div className="mt-6">
          <AiKeysCard />
        </div>
      )}
    </div>
  );
}
