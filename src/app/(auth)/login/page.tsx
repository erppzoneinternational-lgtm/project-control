'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import { Eye, EyeOff, Sun, Moon, AlertCircle, X, Loader2 } from 'lucide-react';
import { RoleRoutingService } from '@/lib/services/roleRouting.service';
import { resolveFocusedHomePath } from '@/lib/config/module-visibility';

/**
 * Helper to fetch user's active role slugs and return the target landing path.
 * In Focused Projects Mode, routes directly to /projects/dashboard.
 */
async function resolveRoleDestination(userId: string): Promise<string> {
  try {
    const slugs: string[] = [];

    const { data: profileData } = await supabase
      .from('profiles')
      .select('roles')
      .eq('id', userId)
      .maybeSingle();

    if (profileData && Array.isArray((profileData as { roles?: string[] }).roles)) {
      for (const r of (profileData as { roles: string[] }).roles) {
        if (r) slugs.push(String(r));
      }
    }

    if (slugs.length === 0) {
      const { data: userRolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (userRolesData && Array.isArray(userRolesData)) {
        for (const row of userRolesData as Array<{ role?: string | null }>) {
          if (row.role) slugs.push(String(row.role));
        }
      }
    }

    const isAdmin = slugs.some((s) => s === 'admin' || s === 'system_admin' || s === 'super_admin');
    const roleHome = RoleRoutingService.getHomePath(slugs, isAdmin);
    return resolveFocusedHomePath(roleHome);
  } catch {
    return resolveFocusedHomePath('/projects');
  }
}

function sanitizeRedirectTarget(raw: string | null | undefined): string {
  const trimmed = (raw ?? '').trim();
  if (
    !trimmed ||
    !trimmed.startsWith('/') ||
    trimmed.startsWith('//') ||
    trimmed.startsWith('/\\') ||
    trimmed.includes('@')
  ) {
    return '/';
  }
  if (
    trimmed === '/' ||
    trimmed === '/login' ||
    trimmed.startsWith('/_next') ||
    trimmed.startsWith('/erp-assets') ||
    trimmed.startsWith('/fonts') ||
    /\.(ico|png|jpg|jpeg|svg|webp|woff|woff2|ttf|otf|css|js|map|html|mp4|webm|json|webmanifest|txt|xml)$/i.test(
      trimmed
    )
  ) {
    return '/';
  }
  return resolveFocusedHomePath(trimmed);
}

function resolveSafeRedirectParam(search: string): string | null {
  const params = new URLSearchParams(search);
  const hasRedirectParam = params.has('redirect') || params.has('redirectTo');
  if (!hasRedirectParam) {
    return null;
  }
  const raw = params.get('redirect') ?? params.get('redirectTo');
  return sanitizeRedirectTarget(raw);
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState<boolean>(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);
  const [videoFailed, setVideoFailed] = useState<{ day: boolean; night: boolean }>({
    day: false,
    night: false,
  });

  const dayVideoRef = useRef<HTMLVideoElement | null>(null);
  const nightVideoRef = useRef<HTMLVideoElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);

  const router = useRouter();
  const { isAr, dir, toggleLocale } = useLanguageSafe();

  // Sync theme state & pre-hydrated input values from documentElement / localStorage
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const storedUserTheme = localStorage.getItem('pzone_theme_user_pref');
    const initialDark = storedUserTheme
      ? storedUserTheme === 'dark'
      : root.classList.contains('dark');
    setIsDark(initialDark);

    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mq.matches);
    }

    if (emailInputRef.current?.value) {
      setEmail(emailInputRef.current.value);
    }
    if (passwordInputRef.current?.value) {
      setPassword(passwordInputRef.current.value);
    }
  }, []);

  // Ensure active theme video plays smoothly unless reduced motion is preferred
  useEffect(() => {
    const activeVideo = isDark ? nightVideoRef.current : dayVideoRef.current;
    const inactiveVideo = isDark ? dayVideoRef.current : nightVideoRef.current;
    if (inactiveVideo) {
      inactiveVideo.pause();
    }
    if (activeVideo) {
      if (prefersReducedMotion) {
        activeVideo.pause();
      } else {
        activeVideo.play().catch(() => {
          // Autoplay blocked or unsupported; poster remains visible
        });
      }
    }
  }, [isDark, prefersReducedMotion]);

  const handleToggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      const themeVal = nextDark ? 'dark' : 'light';
      localStorage.setItem('pzone_theme_user_pref', themeVal);
      localStorage.setItem('pzone_theme', themeVal);
      root.classList.toggle('dark', nextDark);
      root.classList.toggle('light', !nextDark);
      root.style.colorScheme = themeVal;
      root.setAttribute('data-theme', themeVal);
    }
  };

  useEffect(() => {
    setGoogleLoading(false);
    const resetGoogleLoading = () => setGoogleLoading(false);
    window.addEventListener('pageshow', resetGoogleLoading);
    window.addEventListener('focus', resetGoogleLoading);
    return () => {
      window.removeEventListener('pageshow', resetGoogleLoading);
      window.removeEventListener('focus', resetGoogleLoading);
    };
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          const redirectTo = resolveSafeRedirectParam(window.location.search);
          if (redirectTo) {
            router.replace(redirectTo);
          } else {
            const targetPath = await resolveRoleDestination(session.user.id);
            router.replace(targetPath);
          }
        }
      } catch {
        // Ignore session check failure on mount
      }
    };
    checkSession();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const resolvedEmail = (email || emailInputRef.current?.value || '').trim();
    const resolvedPassword = password || passwordInputRef.current?.value || '';

    if (!resolvedEmail || !resolvedPassword) {
      setFormError(
        isAr
          ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور.'
          : 'Please enter both your email address and password.'
      );
      return;
    }

    setLoading(true);
    try {
      const { data: signInData, error } = await supabase.auth.signInWithPassword({
        email: resolvedEmail,
        password: resolvedPassword,
      });

      if (error) {
        const rawMsg = error.message?.toLowerCase() || '';
        if (rawMsg.includes('legacy api keys are disabled')) {
          if (typeof window !== 'undefined') {
            try {
              if ('serviceWorker' in navigator) {
                const regs = await navigator.serviceWorker.getRegistrations();
                await Promise.all(regs.map((r) => r.unregister()));
              }
              if ('caches' in window) {
                const keys = await caches.keys();
                await Promise.all(keys.map((k) => caches.delete(k)));
              }
            } catch {
              // Ignore cache cleanup errors before reload
            }
            const refreshedUrl = new URL(window.location.href);
            if (!refreshedUrl.searchParams.has('_refresh')) {
              refreshedUrl.searchParams.set('_refresh', String(Date.now()));
              window.location.replace(refreshedUrl.toString());
              return;
            }
          }
        }
        const friendlyMsg =
          rawMsg.includes('invalid login credentials') || rawMsg.includes('invalid_credentials')
            ? isAr
              ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى التأكد والمحاولة مرة أخرى.'
              : 'Invalid email or password. Please check your credentials and try again.'
            : error.message ||
              (isAr
                ? 'فشل تسجيل الدخول، تحقق من بياناتك.'
                : 'Sign in failed, please check your credentials.');
        setFormError(friendlyMsg);
        setLoading(false);
        return;
      }

      const redirectTo = resolveSafeRedirectParam(window.location.search);

      if (redirectTo) {
        router.replace(redirectTo);
      } else if (signInData?.user) {
        const targetPath = await resolveRoleDestination(signInData.user.id);
        router.replace(targetPath);
      } else {
        router.replace(resolveFocusedHomePath('/projects'));
      }
      router.refresh();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : isAr
          ? 'حدث خطأ أثناء الاتصال بالخادم.'
          : 'Server connection error.';
      setFormError(errorMessage);
      setLoading(false);
    }
  };

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || '';

  const handleGoogleLogin = async () => {
    setFormError(null);
    if (!googleClientId) {
      setFormError(
        isAr
          ? 'تسجيل الدخول عبر Google غير مفعّل حالياً (معرّف العميل غير مضبوط).'
          : 'Google sign-in is currently unavailable (client ID not configured).'
      );
      return;
    }
    setGoogleLoading(true);
    try {
      const redirectTo =
        resolveSafeRedirectParam(window.location.search) || resolveFocusedHomePath('/projects');
      const isLocalhost =
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

      if (isLocalhost) {
        const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        authUrl.searchParams.set('client_id', googleClientId);
        authUrl.searchParams.set('redirect_uri', window.location.origin);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('scope', 'openid email profile');
        authUrl.searchParams.set('prompt', 'select_account');
        authUrl.searchParams.set('state', `google_local:${redirectTo}`);
        window.location.assign(authUrl.toString());
        return;
      }

      const callbackUrl = new URL('/auth/callback', window.location.origin);
      callbackUrl.searchParams.set('next', redirectTo);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl.toString(),
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });
      if (error) {
        setFormError(
          error.message || (isAr ? 'تعذر تسجيل الدخول عبر Google' : 'Google sign-in failed')
        );
        setGoogleLoading(false);
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : isAr
          ? 'حدث خطأ أثناء الاتصال بـ Google'
          : 'Error connecting to Google';
      setFormError(errorMessage);
      setGoogleLoading(false);
    }
  };

  return (
    <div
      dir={dir}
      lang={isAr ? 'ar' : 'en'}
      className="relative isolate flex min-h-dvh flex-col overflow-x-clip pt-[max(1rem,env(safe-area-inset-top))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] select-none"
    >
      {/* ── Fixed Full-Bleed Coastal Infinity-Pool Video Backdrop (erp.pzoneinternational.com) ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#07131F]"
      >
        {/* Day Coastal Video + Responsive WebP Poster */}
        <div
          className={`absolute inset-0 transition-opacity duration-[650ms] ease-out ${
            isDark ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <img
            src="/erp-assets/poster-day-1600-icNhtJNG.webp"
            srcSet="/erp-assets/poster-day-800--aP2QzmD.webp 800w, /erp-assets/poster-day-1600-icNhtJNG.webp 1600w"
            sizes="100vw"
            alt=""
            className="h-full w-full object-cover"
          />
          {!videoFailed.day && !prefersReducedMotion && !isDark && (
            <video
              ref={dayVideoRef}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              poster="/erp-assets/poster-day-1600-icNhtJNG.webp"
              onError={() => setVideoFailed((prev) => ({ ...prev, day: true }))}
              className="absolute inset-0 h-full w-full object-cover"
            >
              <source src="/erp-assets/water-day-BjPgVL1r.mp4" type="video/mp4" />
            </video>
          )}
        </div>

        {/* Night Coastal Video + Responsive WebP Poster */}
        <div
          className={`absolute inset-0 transition-opacity duration-[650ms] ease-out ${
            isDark ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <img
            src="/erp-assets/poster-night-1600-w3RvGY44.webp"
            srcSet="/erp-assets/poster-night-800-C6vxIQ_g.webp 800w, /erp-assets/poster-night-1600-w3RvGY44.webp 1600w"
            sizes="100vw"
            alt=""
            className="h-full w-full object-cover"
          />
          {!videoFailed.night && !prefersReducedMotion && isDark && (
            <video
              ref={nightVideoRef}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              poster="/erp-assets/poster-night-1600-w3RvGY44.webp"
              onError={() => setVideoFailed((prev) => ({ ...prev, night: true }))}
              className="absolute inset-0 h-full w-full object-cover"
            >
              <source src="/erp-assets/water-night-D1Y5-uDV.mp4" type="video/mp4" />
            </video>
          )}
        </div>

        {/* Scrim 1: Vertical Contrast Vignette */}
        <div className="absolute inset-0 bg-linear-to-b from-black/45 via-black/25 to-black/55 dark:from-black/55 dark:via-black/35 dark:to-black/65" />

        {/* Scrim 2: Light-Mode Radial Center Highlight */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_65%_at_50%_50%,rgb(255_255_255/0.45),transparent)] dark:hidden" />
      </div>

      {/* ── Top-End Floating Glass Control Pill (Language + Theme) ── */}
      <header className="flex w-full items-center justify-end">
        <div className="flex items-center gap-0.5 rounded-full border border-white/20 bg-[#07131F]/40 p-1 shadow-[0_8px_24px_-12px_rgb(7_19_31/0.6)] backdrop-blur-2xl backdrop-saturate-150 dark:border-white/10 dark:bg-[#07131F]/35">
          <button
            type="button"
            onClick={toggleLocale}
            aria-label={isAr ? 'Switch language to English' : 'تغيير اللغة إلى العربية'}
            className="inline-flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-sm font-medium text-white transition-colors hover:bg-white/15 hover:text-white cursor-pointer"
          >
            {isAr ? 'EN' : 'ع'}
          </button>

          <button
            type="button"
            onClick={handleToggleTheme}
            aria-label={
              isDark
                ? isAr
                  ? 'التبديل إلى الوضع الفاتح'
                  : 'Switch to light mode'
                : isAr
                ? 'التبديل إلى الوضع الداكن'
                : 'Switch to dark mode'
            }
            className="inline-flex h-11 min-w-11 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 hover:text-white cursor-pointer"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* ── Centered Frosted Glass Login Card (Exact erp.pzoneinternational.com Anatomy) ── */}
      <main className="my-auto flex w-full flex-1 items-center justify-center py-6">
        <div className="relative w-full overflow-hidden rounded-2xl border border-white/20 bg-white/25 p-6 text-foreground shadow-[0_24px_60px_-24px_rgb(7_19_31/0.6)] backdrop-blur-2xl backdrop-saturate-150 sm:max-w-[400px] sm:p-8 md:max-w-[440px] dark:border-white/10 dark:bg-[#07131F]/35">
          {/* Top 2px Cyan Hairline Accent */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-transparent via-[#26C6DA] to-transparent"
          />

          {/* Official P-Zone Horizontal Logo (Light/Dark Swap) */}
          <div className="mb-6 flex flex-col items-center text-center">
            <img
              src="/erp-assets/horizontal-black-C6SoPpzE.png"
              alt="P-Zone International"
              className="h-14 w-auto object-contain select-none sm:h-16 dark:hidden"
            />
            <img
              src="/erp-assets/horizontal-white-BBqG2TTn.png"
              alt="P-Zone International"
              className="hidden h-14 w-auto object-contain select-none sm:h-16 dark:block"
            />
            <h1 className="mt-4 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {isAr ? 'تسجيل الدخول' : 'Sign in'}
            </h1>
            <p className="mt-1 text-xs font-medium text-foreground/80 dark:text-white/75 sm:text-sm">
              {isAr
                ? 'منظومة إدارة ومراقبة المشروعات — P-Zone International'
                : 'Project Control & Management — P-Zone International'}
            </p>
          </div>

          <form onSubmit={handleLogin} method="post" action="#" className="space-y-5" noValidate>
            {/* Accessible Form Error Alert */}
            {formError && (
              <div
                role="alert"
                aria-live="assertive"
                id="login-error-alert"
                className="flex items-start gap-2.5 rounded-xl border border-[#C23636]/40 bg-[#C23636]/15 p-3.5 text-xs leading-relaxed text-foreground dark:border-[#F27A7A]/35 dark:bg-[#F27A7A]/15 dark:text-white"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#C23636] dark:text-[#F27A7A]" />
                <div className="flex-1">
                  <p className="font-semibold">
                    {isAr ? 'تعذر تسجيل الدخول' : 'Sign in failed'}
                  </p>
                  <p className="mt-0.5 opacity-90">{formError}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormError(null)}
                  className="rounded p-0.5 opacity-80 transition-opacity hover:opacity-100 cursor-pointer"
                  aria-label={isAr ? 'إغلاق التنبيه' : 'Dismiss alert'}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Email Underline Field */}
            <div>
              <label htmlFor="login-email" className="sr-only">
                {isAr ? 'البريد الإلكتروني' : 'Email'}
              </label>
              <input
                ref={emailInputRef}
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (formError) setFormError(null);
                }}
                required
                aria-required="true"
                aria-invalid={!!formError}
                aria-describedby={formError ? 'login-error-alert' : undefined}
                placeholder={isAr ? 'البريد الإلكتروني' : 'Email'}
                dir="ltr"
                className={`erp-underline-input h-12 w-full rounded-none border-0 border-b border-foreground/55 bg-transparent px-1 text-base font-medium text-foreground shadow-none ${
                  isAr ? 'text-right' : 'text-left'
                } placeholder:font-normal placeholder:text-foreground/75 focus-visible:border-primary focus-visible:bg-transparent focus-visible:shadow-[0_1px_0_0_var(--primary)] focus-visible:ring-0 focus-visible:outline-none md:text-sm dark:border-white/35 dark:bg-transparent dark:text-white dark:placeholder:text-white/60 dark:focus-visible:border-[#26C6DA] dark:focus-visible:bg-transparent`}
              />
            </div>

            {/* Password Underline Field */}
            <div className="relative">
              <label htmlFor="login-password" className="sr-only">
                {isAr ? 'كلمة المرور' : 'Password'}
              </label>
              <input
                ref={passwordInputRef}
                id="login-password"
                name="password"
                autoComplete="current-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (formError) setFormError(null);
                }}
                required
                aria-required="true"
                aria-invalid={!!formError}
                aria-describedby={formError ? 'login-error-alert' : undefined}
                placeholder={isAr ? 'كلمة المرور' : 'Password'}
                dir="ltr"
                className={`erp-underline-input h-12 w-full rounded-none border-0 border-b border-foreground/55 bg-transparent ${
                  isAr ? 'text-right pr-1 pl-12' : 'text-left pl-1 pr-12'
                } text-base font-medium text-foreground shadow-none placeholder:font-normal placeholder:text-foreground/75 focus-visible:border-primary focus-visible:bg-transparent focus-visible:shadow-[0_1px_0_0_var(--primary)] focus-visible:ring-0 focus-visible:outline-none md:text-sm dark:border-white/35 dark:bg-transparent dark:text-white dark:placeholder:text-white/60 dark:focus-visible:border-[#26C6DA] dark:focus-visible:bg-transparent`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={
                  showPassword
                    ? isAr
                      ? 'إخفاء كلمة المرور'
                      : 'Hide password'
                    : isAr
                    ? 'إظهار كلمة المرور'
                    : 'Show password'
                }
                aria-pressed={showPassword}
                className={`absolute ${
                  isAr ? 'left-0' : 'right-0'
                } top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground/75 transition-colors hover:bg-white/15 hover:text-foreground dark:text-white/70 dark:hover:text-white cursor-pointer`}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Remember + Forgot Password */}
            <div className="flex items-center justify-between pt-0.5 text-xs">
              <label
                htmlFor="login-remember"
                className="flex min-h-[32px] items-center gap-2 text-foreground/85 dark:text-white/80 cursor-pointer select-none font-medium"
              >
                <input
                  type="checkbox"
                  id="login-remember"
                  name="remember"
                  className="h-4 w-4 rounded border-foreground/40 bg-transparent accent-[#0E8FA3] dark:border-white/35 dark:accent-[#26C6DA] cursor-pointer"
                />
                <span>{isAr ? 'تذكرني' : 'Remember me'}</span>
              </label>
              <Link
                href="/forgot-password"
                className="inline-flex min-h-[32px] items-center font-semibold text-[#0B7285] hover:underline dark:text-[#26C6DA]"
              >
                {isAr ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
              </Link>
            </div>

            {/* Ocean-Cyan Gradient Submit CTA (Exact ERP Spec) */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={loading || googleLoading}
                aria-busy={loading}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#26C6DA] to-[#0E8FA3] text-base font-semibold text-[#07131F] shadow-sm transition-all hover:brightness-105 disabled:opacity-80 disabled:cursor-not-allowed rtl:bg-linear-to-l cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2" aria-live="polite">
                    <Loader2 className="h-4 w-4 animate-spin text-[#07131F]" />
                    <span>{isAr ? 'جاري تسجيل الدخول...' : 'Signing in...'}</span>
                  </span>
                ) : (
                  <span>{isAr ? 'تسجيل الدخول' : 'Sign in'}</span>
                )}
              </button>
            </div>

            {/* Secondary Google Auth Option */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading || googleLoading}
                aria-busy={googleLoading}
                className="inline-flex h-10 w-full items-center justify-center gap-2.5 rounded-lg border border-foreground/20 bg-white/20 text-xs font-semibold text-foreground transition-colors hover:bg-white/35 disabled:opacity-60 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 cursor-pointer"
              >
                {googleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#26C6DA]" />
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                <span>{isAr ? 'المتابعة عبر Google' : 'Continue with Google'}</span>
              </button>
            </div>

            {/* Create New Account Link (Gmail / Any Email) */}
            <div className="pt-2 text-center text-xs text-foreground/85 dark:text-white/80">
              <span>{isAr ? 'ليس لديك حساب؟ ' : "Don't have an account? "}</span>
              <Link
                href="/signup"
                className="inline-flex min-h-[32px] items-center font-bold text-[#0B7285] hover:underline dark:text-[#26C6DA]"
              >
                {isAr ? 'إنشاء حساب جديد (Gmail / البريد)' : 'Create an account (Gmail / Email)'}
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

/* ── Language helpers ── */
function useLanguageSafe() {
  const ctx = useLanguageCtxOrNull();
  const [localLocale, setLocalLocale] = useState<'ar' | 'en'>('ar');

  useEffect(() => {
    setLocalLocale(readSavedLocale());
  }, []);

  const locale = ctx ? ctx.locale : localLocale;
  const isAr = locale === 'ar';
  const dir: 'rtl' | 'ltr' =
    (ctx && 'dir' in ctx ? (ctx as { dir?: 'rtl' | 'ltr' }).dir : null) ||
    (isAr ? 'rtl' : 'ltr');

    const toggleLocale = () => {
    if (ctx) {
      ctx.toggleLocale();
    } else {
      const next = locale === 'ar' ? 'en' : 'ar';
      localStorage.setItem('pzone-locale', next);
      localStorage.setItem('pzone_locale', next);
      setLocalLocale(next);
      if (typeof document !== 'undefined') {
        document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = next;
        document.documentElement.setAttribute('data-locale', next);
      }
    }
  };

  return { locale, isAr, dir, toggleLocale };
}

function useLanguageCtxOrNull() {
  try {
    return useLanguage();
  } catch {
    return null;
  }
}

function readSavedLocale(): 'ar' | 'en' {
  if (typeof window === 'undefined') return 'ar';
  const stored = localStorage.getItem('pzone-locale') || localStorage.getItem('pzone_locale');
  return stored === 'en' ? 'en' : 'ar';
}
