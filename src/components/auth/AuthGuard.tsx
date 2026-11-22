'use client';

import { useAuth } from '@/lib/stores/useAuthStore';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useUserRoles } from '@/lib/hooks/useUserRoles';
import { useModuleAccess } from '@/lib/hooks/useModuleAccess';
import { useLanguage } from '@/contexts/LanguageContext';
import { canAccessPath } from '@/lib/rbac/access-control';
import { portalLoginUrl } from '@/lib/supabase/config';
import {
  isFocusedProjectsMode,
  isRouteAllowedInFocusedMode,
  FOCUSED_PROJECTS_HOME_PATH,
  resolveFocusedHomePath,
} from '@/lib/config/module-visibility';
import { LogOut, Lock, Home } from 'lucide-react';

/**
 * AuthGuard — enforces Portal authentication, active Console access (/no-access),
 * and role-based module access control (RBAC).
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const { roles, status, isActive, hasProfile, isAdmin, isLoading: rolesLoading } = useUserRoles();
  const { data: dbAccessRules, isLoading: accessLoading } = useModuleAccess();

  const isNoAccessPage = pathname === '/no-access';
  const hasNoAccess = !hasProfile || status !== 'active' || !isActive;

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
    if (isE2EBypass || isNoAccessPage) return;

    if (!loading && !user) {
      if (typeof window !== 'undefined') {
        window.location.href = portalLoginUrl(window.location.href);
      }
      return;
    }

    if (!loading && user && !rolesLoading && hasNoAccess) {
      router.replace('/no-access');
      return;
    }

    if (!loading && user && !rolesLoading && !hasNoAccess) {
      if (isFocusedProjectsMode() && !isRouteAllowedInFocusedMode(pathname)) {
        router.replace(FOCUSED_PROJECTS_HOME_PATH);
      }
    }
  }, [loading, user, rolesLoading, hasNoAccess, pathname, router, isE2EBypass, isNoAccessPage]);

  if (isE2EBypass || isNoAccessPage) {
    return <>{children}</>;
  }

  // Still loading auth or user roles state
  if (loading || (user && (rolesLoading || accessLoading))) {
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

  // Not authenticated
  if (!user) {
    return null;
  }

  // Signed-in user has no active profile in this system -> redirected to /no-access
  if (hasNoAccess) {
    return null;
  }

  // Focused Projects Mode Gate: Block all routes outside Projects & Profile
  if (isFocusedProjectsMode() && !isRouteAllowedInFocusedMode(pathname)) {
    return null;
  }

  // Route-Level RBAC Permissions Check: User is active, check specific path access
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
                await signOut();
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

  return <>{children}</>;
}
