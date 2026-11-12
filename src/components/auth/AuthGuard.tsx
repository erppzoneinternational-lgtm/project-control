'use client';

import { useAuth } from '@/lib/stores/useAuthStore';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useUserRoles } from '@/lib/hooks/useUserRoles';
import { useModuleAccess } from '@/lib/hooks/useModuleAccess';
import { useLanguage } from '@/contexts/LanguageContext';
import { canAccessPath } from '@/lib/rbac/access-control';
import {
  isFocusedProjectsMode,
  isRouteAllowedInFocusedMode,
  FOCUSED_PROJECTS_HOME_PATH,
  resolveFocusedHomePath,
} from '@/lib/config/module-visibility';
import { ShieldAlert, LogOut, MessageCircle, Phone, Lock, Home, AlertOctagon, Mail, RefreshCw } from 'lucide-react';
import { generateAdminWhatsAppUrl, generateAdminEmailUrl, ADMIN_EMAIL } from '@/lib/services/userService';

const PUBLIC_PATHS = ['/login', '/signup', '/forgot-password', '/reset-password'];

/**
 * AuthGuard — enforces authentication, account status quarantine, and role-based module access control (RBAC).
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const { roles, status, isActive, isSuspended, isAdmin, isLoading: rolesLoading, refetch } = useUserRoles();
  const { data: dbAccessRules, isLoading: accessLoading } = useModuleAccess();
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  const isE2EEnabled =
    process.env.NODE_ENV !== 'production' &&
    !process.env.NEXT_PUBLIC_VERCEL_ENV &&
    process.env.NEXT_PUBLIC_PZONE_E2E_ENABLED === 'true';
  const isE2EBypass = isE2EEnabled && typeof document !== 'undefined' && document.cookie.includes('pzone-e2e-bypass=true');

  useEffect(() => {
    // Purge leftover testing bypass cookie if present in standard development/production
    if (!isE2EEnabled && typeof document !== 'undefined' && document.cookie.includes('pzone-e2e-bypass=')) {
      document.cookie = 'pzone-e2e-bypass=; Max-Age=0; path=/;';
    }
  }, [isE2EEnabled]);

  useEffect(() => {
    if (isE2EBypass) return;
    if (!loading && !user && !PUBLIC_PATHS.includes(pathname)) {
      const redirectQuery = (pathname && pathname !== '/' && pathname !== '/login')
        ? `?redirect=${encodeURIComponent(pathname)}`
        : '';
      router.replace(`/login${redirectQuery}`);
      return;
    }
    if (!loading && user && !PUBLIC_PATHS.includes(pathname)) {
      if (isFocusedProjectsMode() && !isRouteAllowedInFocusedMode(pathname)) {
        router.replace(FOCUSED_PROJECTS_HOME_PATH);
      }
    }
  }, [loading, user, pathname, router, isE2EBypass]);

  if (isE2EBypass) {
    return <>{children}</>;
  }

  // Still loading auth or user roles state (only block protected routes so /login and /signup never unmount mid-submit)
  if (!PUBLIC_PATHS.includes(pathname) && (loading || (user && (rolesLoading || accessLoading)))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-medium">
            {isAr ? 'جاري فحص صلاحيات الوصول...' : 'Verifying access permissions...'}
          </span>
        </div>
      </div>
    );
  }

  // Not authenticated + not on a public path
  if (!user && !PUBLIC_PATHS.includes(pathname)) {
    return null;
  }

  // Authenticated user on protected path
  if (user && !PUBLIC_PATHS.includes(pathname)) {
    // 1. Account Lifecycle Quarantine: Check if user is approved/active
    // Non-admins without active status, inactive accounts, or users with zero roles are quarantined immediately across ALL protected routes
    const isQuarantined = !isAdmin && (!isActive || status !== 'active' || !roles || roles.length === 0);

    if (isQuarantined) {
      const isSuspendedOrRejected = isSuspended || status === 'suspended' || status === 'rejected' || (!isActive && status !== 'pending_activation');

      return (
        <div className="min-h-screen relative flex items-center justify-center bg-slate-950 p-4 sm:p-6 overflow-hidden" dir="rtl">
          {/* Ambient Background Glow */}
          <div 
            className={`absolute -top-36 left-1/2 -translate-x-1/2 w-[520px] h-[320px] rounded-full blur-[140px] pointer-events-none opacity-40 ${
              isSuspendedOrRejected ? 'bg-rose-600' : 'bg-amber-500'
            }`} 
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.12),rgba(255,255,255,0))] pointer-events-none" />

          {/* Main Container Card */}
          <div className="relative w-full max-w-lg bg-slate-900/90 backdrop-blur-2xl rounded-3xl border border-slate-800/90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] p-6 sm:p-8 space-y-6 text-center overflow-hidden">
            {/* Top Accent Gradient Line */}
            <div 
              className={`absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent ${
                isSuspendedOrRejected ? 'via-rose-500/80' : 'via-amber-500/80'
              } to-transparent`} 
            />

            {/* Header Badge */}
            <div className="flex items-center justify-center">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/60 text-[11px] font-semibold text-slate-300 shadow-inner">
                <span className={`w-2 h-2 rounded-full animate-pulse ${isSuspendedOrRejected ? 'bg-rose-500' : 'bg-amber-400'}`} />
                <span className="tracking-wide">منظومة بي زون • Pzone ERP Portal</span>
              </div>
            </div>

            {/* Hero Icon */}
            <div className="relative">
              <div 
                className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto shadow-2xl transition-all ${
                  isSuspendedOrRejected
                    ? 'bg-gradient-to-b from-rose-500/20 to-rose-950/40 border border-rose-500/30 text-rose-400 shadow-rose-950/50'
                    : 'bg-gradient-to-b from-amber-500/20 to-amber-950/40 border border-amber-500/30 text-amber-400 shadow-amber-950/50'
                }`}
              >
                {isSuspendedOrRejected ? <AlertOctagon size={38} strokeWidth={2.2} /> : <ShieldAlert size={38} strokeWidth={2.2} />}
              </div>
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white tracking-tight">
                {isSuspendedOrRejected ? 'الحساب موقوف مؤقتاً' : 'عفواً، حسابك في انتظار تعيين الصلاحيات'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
                {isSuspendedOrRejected ? (
                  <>
                    تم تعليق صلاحيات الدخول لهذا الحساب مؤقتاً من قبل الإدارة.
                    <br className="hidden sm:inline" />
                    يرجى التواصل مع مسؤول المنظومة للاعتماد وإعادة التفعيل:
                  </>
                ) : (
                  <>
                    لقد قمت بإنشاء الحساب بنجاح، وهو الآن قيد التدقيق الإداري.
                    <br className="hidden sm:inline" />
                    يرجى التواصل مع مسؤول المنظومة لتعيين الصلاحيات والمشاريع:
                  </>
                )}
              </p>
            </div>

            {/* Administrator Contact Hub */}
            <div className="bg-slate-950/70 rounded-2xl p-4 border border-slate-800/80 text-start space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold font-mono">
                    HS
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-200">
                      Eng. Hassan A. Soliman (م/ حسن سليمان)
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      مدير ومسؤول المنظومة • System Administrator
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  Direct
                </span>
              </div>

              {/* Primary Action: Direct WhatsApp */}
              <a
                href={generateAdminWhatsAppUrl({ fullName: user?.user_metadata?.full_name || user?.email, email: user?.email })}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-950/40 cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <MessageCircle size={18} className="shrink-0 group-hover:scale-110 transition-transform" />
                  <span>مراسلة فورية عبر واتساب (WhatsApp)</span>
                </div>
                <span dir="ltr" className="text-xs font-mono font-bold tracking-wider">+20 122 999 4728</span>
              </a>

              {/* Secondary Contacts: Phone & Email Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <a
                  href="tel:+201229994728"
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 text-slate-300 font-semibold text-xs transition-all cursor-pointer"
                >
                  <Phone size={14} className="shrink-0 text-slate-400" />
                  <span dir="ltr" className="font-mono">01229994728</span>
                </a>
                <a
                  href={generateAdminEmailUrl({ fullName: user?.user_metadata?.full_name || user?.email, email: user?.email })}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-cyan-300 font-semibold text-xs transition-all cursor-pointer truncate"
                  title={ADMIN_EMAIL}
                >
                  <Mail size={14} className="shrink-0 text-cyan-400" />
                  <span className="truncate">{ADMIN_EMAIL}</span>
                </a>
              </div>
            </div>

            {/* Account Details Box */}
            <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/60 text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-400 border-b border-slate-800/60 pb-2">
                <span className="text-slate-400 font-medium">البريد الإلكتروني:</span>
                <span className="text-slate-200 font-mono text-xs dir-ltr selection:bg-slate-700">{user.email}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400 pt-0.5">
                <span className="text-slate-400 font-medium">حالة الحساب في المنظومة:</span>
                <span 
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-bold text-[11px] border ${
                    isSuspendedOrRejected 
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isSuspendedOrRejected ? 'bg-rose-500' : 'bg-amber-400'}`} />
                  {status === 'suspended' ? 'موقوف مؤقتاً (Suspended)' : status === 'rejected' ? 'مرفوض (Rejected)' : 'قيد التفعيل (Pending)'}
                </span>
              </div>
            </div>

            {/* Actions: Re-check Status & Sign-Out */}
            <div className="pt-1 space-y-2">
              <button
                type="button"
                disabled={isCheckingStatus}
                onClick={async () => {
                  setIsCheckingStatus(true);
                  try {
                    await refetch();
                    router.refresh();
                  } finally {
                    setTimeout(() => setIsCheckingStatus(false), 600);
                  }
                }}
                className="w-full py-3 rounded-xl font-bold text-xs bg-cyan-600 hover:bg-cyan-500 text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-cyan-950/40 active:scale-[0.99] disabled:opacity-50"
              >
                <RefreshCw size={15} className={isCheckingStatus ? 'animate-spin' : ''} />
                <span>{isCheckingStatus ? 'جاري التحقق من التفعيل والصلاحيات...' : 'تحقق من تفعيل الحساب وتحديث الصلاحيات الآن'}</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  try {
                    await signOut();
                  } finally {
                    router.replace('/login');
                  }
                }}
                className="w-full py-2.5 rounded-xl font-medium text-xs bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 text-slate-300 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.99]"
              >
                <LogOut size={14} />
                <span>تسجيل الخروج والعودة لصفحة الدخول</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    // 2. Focused Projects Mode Gate: Block all routes outside Projects & Profile
    if (isFocusedProjectsMode() && !isRouteAllowedInFocusedMode(pathname)) {
      return null;
    }

    // 3. Route-Level RBAC Permissions Check: User is active, check specific path access
    const isAllowed = canAccessPath(pathname, roles, isAdmin, dbAccessRules);

    if (!isAllowed) {
      return (
        <div className="min-h-screen relative flex items-center justify-center bg-slate-950 p-4 sm:p-6 overflow-hidden" dir={isAr ? 'rtl' : 'ltr'}>
          <div className="absolute -top-36 left-1/2 -translate-x-1/2 w-[520px] h-[320px] rounded-full blur-[140px] pointer-events-none opacity-30 bg-rose-600" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.12),rgba(255,255,255,0))] pointer-events-none" />

          <div className="relative w-full max-w-lg bg-slate-900/90 backdrop-blur-2xl rounded-3xl border border-slate-800/90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] p-6 sm:p-8 space-y-6 text-center overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500/80 to-transparent" />

            <div className="flex items-center justify-center">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/60 text-[11px] font-semibold text-slate-300 shadow-inner">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="tracking-wide">
                  {isAr ? 'منظومة بي زون • تصريح الوصول' : 'P.Zone Portal • Access Control'}
                </span>
              </div>
            </div>

            <div className="relative">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto shadow-2xl bg-gradient-to-b from-rose-500/20 to-rose-950/40 border border-rose-500/30 text-rose-400 shadow-rose-950/50">
                <Lock size={38} strokeWidth={2.2} />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white tracking-tight">
                {isAr ? 'غير مصرح بالدخول (403 Forbidden)' : 'Access Denied (403 Forbidden)'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
                {isAr ? (
                  <>
                    أدوارك الحالية لا تمنحك حق الوصول إلى المسار المطلوب <span className="font-mono text-slate-200 dir-ltr inline-block px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs">({pathname})</span>. إذا كنت بحاجة لهذا التخصيص، يرجى مراجعة إدارة المنظومة.
                  </>
                ) : (
                  <>
                    Your current roles do not grant access to <span className="font-mono text-slate-200 dir-ltr inline-block px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs">({pathname})</span>. Please contact the system administrator if you require access.
                  </>
                )}
              </p>
            </div>

            <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/60 text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-400 border-b border-slate-800/60 pb-2">
                <span className="text-slate-400 font-medium">{isAr ? 'المستخدم الحالي:' : 'Current User:'}</span>
                <span className="text-slate-200 font-mono text-xs dir-ltr">{user.email}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400 pt-0.5">
                <span className="text-slate-400 font-medium">{isAr ? 'الأدوار المعتمدة:' : 'Assigned Roles:'}</span>
                <span className="text-cyan-400 font-semibold">{roles.length > 0 ? roles.join(', ') : (isAr ? 'لا توجد أدوار' : 'None')}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => router.push(resolveFocusedHomePath('/dashboard'))}
                className="flex-1 py-3 rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 text-primary-foreground transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-primary/20 active:scale-[0.99]"
              >
                <Home size={15} />
                {isAr ? 'العودة للرئيسية' : 'Return Home'}
              </button>

              <button
                type="button"
                onClick={async () => {
                  try {
                    await signOut();
                  } finally {
                    router.replace('/login');
                  }
                }}
                className="py-3 px-5 rounded-xl font-semibold text-xs bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <LogOut size={15} />
                {isAr ? 'خروج' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
