'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  KeyRound,
  Globe,
  Sparkles,
} from 'lucide-react';

/* ================================================================
   Metaball Canvas — Interactive Fluid Hero
   ================================================================ */
function MetaballHero({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.4 });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseRef.current = {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);

    const blobs = [
      { ox: 0.5, oy: 0.45, r: 40, sp: 1.1, phase: 0, hue: 195, sat: 90 },
      { ox: 0.42, oy: 0.38, r: 30, sp: 1.4, phase: 2, hue: 265, sat: 85 },
      { ox: 0.58, oy: 0.52, r: 26, sp: 1.7, phase: 4, hue: 215, sat: 80 },
      { ox: 0.48, oy: 0.32, r: 18, sp: 2.1, phase: 1, hue: 175, sat: 85 },
    ];

    let t = 0;
    const draw = () => {
      t += 0.006;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      blobs.forEach((b) => {
        const pullX = (mx - b.ox) * 25;
        const pullY = (my - b.oy) * 18;
        const bx = w * b.ox + Math.cos(t * b.sp + b.phase) * 22 + pullX;
        const by = h * b.oy + Math.sin(t * b.sp * 0.8 + b.phase) * 16 + pullY;
        const br = b.r + Math.sin(t * 2 + b.phase) * 4;

        const grad = ctx.createRadialGradient(bx, by, 0, bx, by, br * 2.6);
        grad.addColorStop(0, `hsla(${b.hue}, ${b.sat}%, 62%, 0.7)`);
        grad.addColorStop(0.45, `hsla(${b.hue}, ${b.sat}%, 50%, 0.3)`);
        grad.addColorStop(1, `hsla(${b.hue}, ${b.sat}%, 40%, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(bx, by, br * 2.6, 0, Math.PI * 2);
        ctx.fill();
      });

      const cx = w * 0.5 + (mx - 0.5) * 12;
      const cy = h * 0.42 + (my - 0.4) * 8;
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 50);
      cg.addColorStop(0, 'hsla(210, 95%, 72%, 0.25)');
      cg.addColorStop(0.6, 'hsla(260, 85%, 55%, 0.06)');
      cg.addColorStop(1, 'hsla(210, 80%, 50%, 0)');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(cx, cy, 50, 0, Math.PI * 2);
      ctx.fill();

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleMouseMove]);

  return <canvas ref={canvasRef} className={className} style={{ width: '100%', height: '100%' }} />;
}

/* ================================================================
   Password Strength Calculator
   ================================================================ */
function calculateStrength(pwd: string) {
  let score = 0;
  if (!pwd) return { score: 0, labelAr: 'فارغة', labelEn: 'Empty', color: 'bg-slate-700' };

  const hasLength = pwd.length >= 8;
  const hasNumber = /\d/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasUpper = /[A-Z]/.test(pwd);
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd);

  if (hasLength) score++;
  if (hasNumber) score++;
  if (hasLower && hasUpper) score++;
  if (hasSpecial) score++;

  if (score <= 1) {
    return { score: 1, labelAr: 'ضعيفة', labelEn: 'Weak', color: 'bg-rose-500' };
  } else if (score === 2) {
    return { score: 2, labelAr: 'متوسطة', labelEn: 'Fair', color: 'bg-amber-500' };
  } else if (score === 3) {
    return { score: 3, labelAr: 'جيدة جداً', labelEn: 'Good', color: 'bg-cyan-500' };
  } else {
    return { score: 4, labelAr: 'قوية ومحمية', labelEn: 'Strong', color: 'bg-emerald-500' };
  }
}

/* ================================================================
   Main Reset Password Page Component
   ================================================================ */
export default function ResetPasswordPage() {
  const router = useRouter();
  const { isAr, dir, toggleLocale } = useLanguageSafe();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  const strength = calculateStrength(password);
  const isMatch = password && confirmPassword && password === confirmPassword;
  const isMismatch = confirmPassword && password !== confirmPassword;

  useEffect(() => {
    setMounted(true);
    let isSubscribed = true;

    // 1. Check URL hash (Implicit Flow: #access_token=...&refresh_token=...&type=recovery)
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    if (hash && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.replace(/^#/, ''));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        supabase.auth
          .setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          .then(({ data, error }) => {
            if (!error && data.session && isSubscribed) {
              setReady(true);
              setErrorMsg(null);
            } else if (error && isSubscribed) {
              console.error('[reset-password] setSession error:', error);
              setErrorMsg(error.message);
            }
          });
      } else if (hash.includes('type=recovery')) {
        setReady(true);
      }
    } else if (hash.includes('type=recovery')) {
      setReady(true);
    }

    // 2. Check query params for token_hash or PKCE code
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const code = searchParams?.get('code');
    const tokenHash = searchParams?.get('token_hash');
    const type = (searchParams?.get('type') || 'recovery') as any;

    if (tokenHash) {
      supabase.auth.verifyOtp({ token_hash: tokenHash, type }).then(({ data, error }) => {
        if (!error && data.session && isSubscribed) {
          setReady(true);
          setErrorMsg(null);
        } else if (error && isSubscribed) {
          console.error('[reset-password] verifyOtp error:', error);
          setErrorMsg(error.message);
        }
      });
    } else if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        if (!error && data.session && isSubscribed) {
          setReady(true);
          setErrorMsg(null);
        } else if (error && isSubscribed) {
          console.error('[reset-password] exchangeCodeForSession error:', error);
          if (error.message.includes('code verifier') || error.message.includes('PKCE')) {
            setErrorMsg(
              isAr
                ? 'انتهت صلاحية رمز التحقق أو تم فتح الرابط في متصفح مختلف عن الذي أرسل الطلب (قيود أمان PKCE القديمة). يرجى طلب رابط جديد بالضغط على الزر أدناه وسيعمل معك الرابط الجديد مباشرة على كافة المتصفحات والأجهزة.'
                : 'Verification code not found or opened in a different browser/device (PKCE). Please request a new link below.'
            );
          } else {
            setErrorMsg(error.message);
          }
        }
      });
    }

    // 3. Listen to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') && session && isSubscribed) {
        setReady(true);
        setErrorMsg(null);
      }
    });

    // 4. Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && isSubscribed) {
        setReady(true);
        setErrorMsg(null);
      }
    });

    // 5. Fallback safety timer
    const timeoutId = setTimeout(() => {
      if (isSubscribed && !ready && !errorMsg) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            setReady(true);
          } else {
            setErrorMsg(
              isAr
                ? 'تعذر التحقق من جلسة استعادة كلمة المرور أو انتهت صلاحية الرابط. يرجى طلب رابط جديد.'
                : 'Could not verify recovery session or link has expired. Please request a new link.'
            );
          }
        });
      }
    }, 4500);

    return () => {
      isSubscribed = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [isAr]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error(isAr ? 'يجب أن لا تقل كلمة المرور عن 6 أحرف' : 'Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error(isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSuccess(true);
      toast.success(isAr ? 'تم تحديث كلمة المرور بنجاح!' : 'Password updated successfully!');
      setTimeout(() => {
        window.location.replace('/projects');
      }, 1500);
    }
  };

  const BackIcon = isAr ? ArrowRight : ArrowLeft;

  return (
    <div
      dir={dir}
      className="min-h-screen relative overflow-hidden bg-[#060B14] flex flex-col items-center justify-center px-4 font-sans select-none"
    >
      {/* ── Ambient Background Glows ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-cyan-500/[0.07] blur-[140px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/[0.06] blur-[130px]" />
        <div className="absolute top-[40%] right-[30%] w-[350px] h-[350px] rounded-full bg-blue-600/[0.05] blur-[110px]" />
        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* ── Top Header Bar (Language switcher) ── */}
      <div className="absolute top-6 inset-x-6 flex items-center justify-between z-30 max-w-6xl mx-auto pointer-events-auto">
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-transform duration-300 hover:scale-105 rounded-xl p-1"
        >
          <img
            src="/pzone-logo-white.png"
            alt="P.ZONE"
            width={120}
            height={32}
            className="h-8 w-auto object-contain drop-shadow-[0_4px_20px_rgba(0,200,255,0.3)]"
          />
        </Link>

        {toggleLocale && (
          <button
            type="button"
            onClick={toggleLocale}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-300 bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.1] hover:text-white transition-all backdrop-blur-md cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isAr ? 'English' : 'العربية'}</span>
          </button>
        )}
      </div>

      {/* ── Main Container ── */}
      <div
        className={`relative z-10 w-full max-w-[440px] my-12 transition-all duration-700 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        {/* ── Metaball Hero Header ── */}
        <div className="relative h-[135px] mb-[-24px] z-20 pointer-events-none">
          <MetaballHero className="absolute inset-0" />
        </div>

        {/* ── Glassmorphic Elevated Card ── */}
        <div className="relative rounded-3xl border border-white/[0.08] bg-[#0b1329]/85 backdrop-blur-2xl shadow-[0_24px_70px_-15px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.06),0_1px_0_rgba(255,255,255,0.12)_inset] overflow-hidden">
          {/* Top edge gradient glow */}
          <div className="absolute top-0 inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent pointer-events-none" />

          {/* ────────────────────────────────────────────────────────
             State 1: Verification Error State
             ──────────────────────────────────────────────────────── */}
          {errorMsg ? (
            <div className="p-8 pt-10 text-center space-y-5">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/10">
                <AlertTriangle className="w-7 h-7" />
              </div>

              <div>
                <h2 className="text-base font-bold text-white">
                  {isAr ? 'تعذر إتمام التحقق من الرابط' : 'Link Verification Failed'}
                </h2>
                <p className="text-xs text-rose-300/90 mt-2 leading-relaxed font-normal">
                  {errorMsg}
                </p>
              </div>

              <div className="pt-2 space-y-3">
                <Link
                  href="/forgot-password"
                  className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-400 hover:via-blue-400 hover:to-indigo-500 shadow-lg shadow-cyan-500/20 transition-all duration-300 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{isAr ? 'طلب رابط استعادة جديد' : 'Request New Reset Link'}</span>
                </Link>

                <div>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    <BackIcon className="w-3.5 h-3.5" />
                    <span>{isAr ? 'العودة لتسجيل الدخول' : 'Back to Login'}</span>
                  </Link>
                </div>
              </div>
            </div>
          ) : !ready ? (
            /* ────────────────────────────────────────────────────────
               State 2: Loading & Session Verification
               ──────────────────────────────────────────────────────── */
            <div className="p-12 text-center space-y-4">
              <div className="relative w-14 h-14 mx-auto">
                <div className="absolute inset-0 rounded-2xl bg-cyan-500/10 blur-md animate-pulse" />
                <div className="relative w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                  <Loader2 className="w-7 h-7 text-cyan-400 animate-spin" />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white">
                  {isAr ? 'جاري التحقق من هوية الرابط...' : 'Verifying Security Token...'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {isAr ? 'يرجى الانتظار ثوانٍ معدودة لتأكيد صلاحية الجلسة' : 'Please wait a moment while we validate your credentials'}
                </p>
              </div>
            </div>
          ) : success ? (
            /* ────────────────────────────────────────────────────────
               State 3: Success Screen
               ──────────────────────────────────────────────────────── */
            <div className="p-8 pt-10 text-center space-y-5 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-lg font-black text-white">
                  {isAr ? 'تم تحديث كلمة المرور بنجاح!' : 'Password Updated Successfully!'}
                </h2>
                <p className="text-xs text-slate-300/80 mt-1.5 leading-relaxed">
                  {isAr ? 'تم تأمين حسابك بنجاح، جاري تحويلك لمنظومة بي زون...' : 'Your account is now secured. Redirecting you to the portal...'}
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-cyan-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isAr ? 'تحويل تلقائي...' : 'Redirecting...'}</span>
              </div>
            </div>
          ) : (
            /* ────────────────────────────────────────────────────────
               State 4: Main Active Password Reset Form
               ──────────────────────────────────────────────────────── */
            <div className="p-8 pt-10">
              {/* Card Header & Title */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[11px] font-bold mb-3">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{isAr ? 'استعادة وتأمين الحساب' : 'Account Recovery'}</span>
                </div>

                <h1 className="text-xl font-black text-white tracking-tight">
                  {isAr ? 'تعيين كلمة مرور جديدة' : 'Create New Password'}
                </h1>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  {isAr
                    ? 'اختر كلمة مرور قوية لتأمين حسابك وحماية كافة مشاريعك'
                    : 'Choose a strong password to protect your projects and data'}
                </p>
              </div>

              {/* Reset Form */}
              <form onSubmit={handleUpdate} method="post" action="#" className="space-y-4" noValidate>
                {/* 1. New Password Field */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    {isAr ? 'كلمة المرور الجديدة' : 'New Password'}
                  </label>
                  <div className="relative" dir="ltr">
                    <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      dir="ltr"
                      placeholder="••••••••••••"
                      className={`w-full ps-10 pe-11 py-3 rounded-xl text-xs ${isAr ? 'font-sans' : 'font-mono'} text-white placeholder:text-slate-500 outline-none transition-all duration-300 bg-white/[0.04] border border-white/[0.08] focus:bg-white/[0.07] focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/50`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 end-0 flex items-center pe-3.5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {password && (
                    <div className="mt-2.5 space-y-1.5 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-medium">
                          {isAr ? 'مستوى الأمان:' : 'Strength:'}
                        </span>
                        <span className={`font-bold ${strength.score >= 3 ? 'text-emerald-400' : strength.score === 2 ? 'text-amber-400' : 'text-rose-400'}`}>
                          {isAr ? strength.labelAr : strength.labelEn}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5 h-1.5">
                        {[1, 2, 3, 4].map((step) => (
                          <div
                            key={step}
                            className={`rounded-full h-full transition-all duration-300 ${
                              step <= strength.score ? strength.color : 'bg-white/[0.08]'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Confirm Password Field */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    {isAr ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                  </label>
                  <div className="relative" dir="ltr">
                    <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-slate-400">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      dir="ltr"
                      placeholder="••••••••••••"
                      className={`w-full ps-10 pe-11 py-3 rounded-xl text-xs ${isAr ? 'font-sans' : 'font-mono'} text-white placeholder:text-slate-500 outline-none transition-all duration-300 bg-white/[0.04] border ${
                        isMatch
                          ? 'border-emerald-500/50 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400'
                          : isMismatch
                          ? 'border-rose-500/50 focus:border-rose-400 focus:ring-1 focus:ring-rose-400'
                          : 'border-white/[0.08] focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/50'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 end-0 flex items-center pe-3.5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Match Feedback Badge */}
                  {confirmPassword && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] animate-in fade-in duration-150">
                      {isMatch ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">
                            {isAr ? 'كلمتا المرور متطابقتان تماماً' : 'Passwords match perfectly'}
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-rose-400" />
                          <span className="text-rose-400 font-medium">
                            {isAr ? 'كلمتا المرور غير متطابقتين بعد' : 'Passwords do not match yet'}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Security Checklist */}
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1.5">
                  <div className="flex items-center gap-2 text-[11px]">
                    {password.length >= 8 ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-600 shrink-0" />
                    )}
                    <span className={password.length >= 8 ? 'text-emerald-300 font-medium' : 'text-slate-400'}>
                      {isAr ? '8 أحرف على الأقل' : 'At least 8 characters'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px]">
                    {/\d/.test(password) ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-600 shrink-0" />
                    )}
                    <span className={/\d/.test(password) ? 'text-emerald-300 font-medium' : 'text-slate-400'}>
                      {isAr ? 'يحتوي على رقم واحد على الأقل' : 'At least one number'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px]">
                    {/[A-Z]/.test(password) || /[^A-Za-z0-9]/.test(password) ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-600 shrink-0" />
                    )}
                    <span
                      className={
                        /[A-Z]/.test(password) || /[^A-Za-z0-9]/.test(password)
                          ? 'text-emerald-300 font-medium'
                          : 'text-slate-400'
                      }
                    >
                      {isAr ? 'حرف كبير أو رمز خاص' : 'Uppercase letter or symbol'}
                    </span>
                  </div>
                </div>

                {/* 4. Submit CTA Button */}
                <button
                  type="submit"
                  disabled={loading || (confirmPassword ? !isMatch : false)}
                  className="w-full py-3.5 rounded-xl font-bold text-xs text-white transition-all duration-300 cursor-pointer bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-400 hover:via-blue-400 hover:to-indigo-500 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>{isAr ? 'جاري تحديث وتشفير كلمة المرور...' : 'Encrypting & Updating...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-cyan-200" />
                      <span>{isAr ? 'حفظ كلمة المرور والدخول' : 'Save New Password & Continue'}</span>
                    </>
                  )}
                </button>
              </form>

              {/* 5. Footer & Back link */}
              <div className="mt-6 pt-4 border-t border-white/[0.06] flex flex-col items-center gap-3">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  <BackIcon className="w-3.5 h-3.5" />
                  <span>{isAr ? 'العودة لصفحة تسجيل الدخول' : 'Return to sign in'}</span>
                </Link>

                <div className={`flex items-center gap-1.5 text-[10px] text-slate-400 ${isAr ? 'font-sans' : 'font-mono'}`}>
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>{isAr ? 'حماية مشفرة 256-Bit SSL • معايير P.ZONE Security' : '256-Bit SSL Encrypted • P.ZONE Security'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   Language Safety Helpers
   ================================================================ */
function useLanguageSafe() {
  const ctx = useLanguageCtxOrNull();
  const [localLocale, setLocalLocale] = useState<'ar' | 'en'>('ar');

  useEffect(() => {
    setLocalLocale(readSavedLocale());
  }, []);

  const locale = ctx ? ctx.locale : localLocale;
  const isAr = locale === 'ar';
  const dir: 'rtl' | 'ltr' = isAr ? 'rtl' : 'ltr';

  const toggleLocale = () => {
    if (ctx?.setLocale) {
      ctx.setLocale(isAr ? 'en' : 'ar');
    } else {
      const next = isAr ? 'en' : 'ar';
      if (typeof window !== 'undefined') {
        localStorage.setItem('pzone_locale', next);
      }
      setLocalLocale(next);
    }
  };

  return { isAr, dir, toggleLocale };
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
  return (localStorage.getItem('pzone_locale') as 'ar' | 'en') || 'ar';
}
