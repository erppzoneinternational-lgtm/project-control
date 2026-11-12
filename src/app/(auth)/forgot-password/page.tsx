'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2, ArrowRight, ArrowLeft, Mail, CheckCircle2, ShieldCheck, RotateCcw } from 'lucide-react';

// Dedicated client using implicit flow to prevent cross-device/cross-browser PKCE code verifier errors
const recoveryClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      flowType: 'implicit',
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);

/* ================================================================
   Metaball Canvas
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
      { ox: 0.5, oy: 0.45, r: 42, sp: 1.2, phase: 0, hue: 195, sat: 90 },
      { ox: 0.42, oy: 0.38, r: 32, sp: 1.5, phase: 2, hue: 215, sat: 85 },
      { ox: 0.58, oy: 0.52, r: 28, sp: 1.8, phase: 4, hue: 175, sat: 80 },
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
        const pullY = (my - b.oy) * 15;
        const bx = w * b.ox + Math.cos(t * b.sp + b.phase) * 24 + pullX;
        const by = h * b.oy + Math.sin(t * b.sp * 0.8 + b.phase) * 18 + pullY;
        const br = b.r + Math.sin(t * 2 + b.phase) * 4;

        const grad = ctx.createRadialGradient(bx, by, 0, bx, by, br * 2.8);
        grad.addColorStop(0, `hsla(${b.hue}, ${b.sat}%, 62%, 0.75)`);
        grad.addColorStop(0.4, `hsla(${b.hue}, ${b.sat}%, 50%, 0.35)`);
        grad.addColorStop(1, `hsla(${b.hue}, ${b.sat}%, 40%, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(bx, by, br * 2.8, 0, Math.PI * 2);
        ctx.fill();
      });

      const cx = w * 0.5;
      const cy = h * 0.42;
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 50);
      cg.addColorStop(0, 'hsla(200, 95%, 72%, 0.25)');
      cg.addColorStop(1, 'hsla(200, 80%, 50%, 0)');
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
   Forgot Password Page
   ================================================================ */
export default function ForgotPasswordPage() {
  const { isAr, dir } = useLanguageSafe();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const BackIcon = isAr ? ArrowRight : ArrowLeft;

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);

    const origin = typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://pzoneinternationalprojectcontrol.vercel.app';

    const { error } = await recoveryClient.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${origin.replace(/\/$/, '')}/reset-password`,
    });

    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
      toast.success(isAr ? 'تم إرسال رابط إعادة التعيين لبريدك' : 'Reset link sent to your email');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#060B14] flex items-center justify-center px-4">

      {/* Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-500/[0.06] blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[400px] h-[400px] rounded-full bg-blue-600/[0.05] blur-[100px]" />
      </div>

      <div
        className={`relative z-10 w-full max-w-[420px] transition-all duration-700 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="relative h-[130px] mb-[-16px] z-20">
          <MetaballHero className="absolute inset-0" />
        </div>

        <div
          dir={dir}
          className="relative rounded-3xl border border-white/[0.06] bg-white dark:bg-slate-900/[0.03] backdrop-blur-2xl shadow-[0_8px_50px_rgba(0,0,0,0.5)] p-8 pt-10 overflow-hidden"
        >
          <div className="absolute top-0 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-cyan-400/25 to-transparent" />

          <div className="text-center mb-6 flex flex-col items-center">
            <img
              src="/pzone-logo-white.png"
              alt="P.ZONE"
              className="h-10 w-auto object-contain drop-shadow-[0_4px_24px_rgba(0,200,255,0.25)] select-none mb-3"
            />
            <h1 className={`text-[20px] font-extrabold text-white ${isAr ? 'tracking-normal' : 'tracking-tight'}`}>

              {isAr ? 'استعادة كلمة المرور' : 'Reset Password'}
            </h1>
            <p className="text-[13px] text-slate-400/80 mt-1.5 font-medium">
              {isAr ? 'سنرسل لك رابط إعادة تعيين كلمة المرور إلى بريدك' : 'We will send you a reset link to your email'}
            </p>
          </div>

          {sent ? (
            <div
              role="status"
              aria-live="polite"
              className="space-y-5 py-1 text-center animate-in fade-in zoom-in-95 duration-300"
            >
              {/* Glowing Success Icon Badge */}
              <div className="relative mx-auto w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                <CheckCircle2 className="w-7 h-7 text-cyan-400" />
              </div>

              <div className="space-y-1.5">
                <h2 className={`text-base font-bold text-white ${isAr ? 'tracking-normal' : 'tracking-tight'}`}>

                  {isAr ? 'تم إرسال رابط الاستعادة بنجاح' : 'Reset Link Sent Successfully'}
                </h2>
                <p className="text-xs text-slate-400">
                  {isAr ? 'أرسلنا تعليمات الاستعادة إلى البريد التالي:' : 'Instructions sent to:'}
                </p>
                <div className="pt-1">
                  <span className="inline-block px-3 py-1.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 font-mono text-xs break-all select-all">
                    {email}
                  </span>
                </div>
              </div>

              {/* Clear Arabic Step-by-Step Instructions */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/[0.03] border border-white/[0.08] text-xs text-slate-300 text-start space-y-2.5">
                <p className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>{isAr ? 'إرشادات إتمام استعادة الحساب:' : 'Next steps to regain access:'}</span>
                </p>
                <ul className="space-y-2 text-slate-400 leading-relaxed pr-1 pl-1">
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <span>
                      {isAr
                        ? 'تحقق من صندوق الوارد (وكذلك مجلد الرسائل الترويجية أو غير المرغوب فيها Spam).'
                        : 'Check your inbox (as well as Spam or Junk folders).'}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <span>
                      {isAr
                        ? 'انقر على رابط "إعادة تعيين كلمة المرور" الموجود داخل الرسالة.'
                        : 'Click the "Reset Password" link inside the email message.'}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <span>
                      {isAr
                        ? 'الرابط صالح للاستخدام المؤقت لضمان أمان حسابك، لا تشاركه مع أي شخص.'
                        : 'The link is time-sensitive to safeguard your enterprise account.'}
                    </span>
                  </li>
                </ul>
              </div>

              {/* Actions */}
              <div className="space-y-2.5 pt-1">
                <Link
                  href="/login"
                  aria-label={isAr ? 'العودة إلى صفحة تسجيل الدخول' : 'Return to sign in page'}
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 via-blue-500 to-blue-600 hover:from-cyan-400 hover:via-blue-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B14]"
                >
                  <BackIcon className="w-4 h-4" />
                  <span>{isAr ? 'العودة لتسجيل الدخول' : 'Back to sign in'}</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 text-xs text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isAr ? 'لم يصلك البريد؟ إعادة المحاولة أو تعديل العنوان' : "Didn't receive email? Try again or change address"}</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleReset} method="post" action="#" className="space-y-4">
              <div>
                <label
                  htmlFor="recovery-email"
                  className="block text-xs font-semibold text-slate-300 mb-1.5 text-start"
                >
                  {isAr ? 'البريد الإلكتروني المسجل' : 'Registered email address'}
                </label>
                <div className="relative group">
                  <div
                    className={`absolute top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 transition-colors group-focus-within:text-cyan-400 ${
                      isAr ? 'right-3.5' : 'left-3.5'
                    }`}
                  >
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="recovery-email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    inputMode="email"
                    spellCheck={false}
                    dir={email ? 'ltr' : dir}
                    placeholder={isAr ? 'name@company.com أو البريد المسجل' : 'name@company.com'}
                    className={`flow-input w-full py-3.5 rounded-xl text-sm outline-none transition-all duration-300
                      bg-white dark:bg-slate-900/[0.05] border border-white/[0.08] text-white placeholder:text-slate-500
                      focus:bg-white dark:bg-slate-900/[0.08] focus:border-cyan-400/80 focus:ring-2 focus:ring-cyan-400/25
                      hover:border-white/[0.15]
                      ${isAr ? 'pr-11 pl-4' : 'pl-11 pr-4'}
                      ${email ? '!text-left font-mono' : (isAr ? 'text-right' : 'text-left')}`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-300 cursor-pointer bg-gradient-to-r from-cyan-500 via-blue-500 to-blue-600 hover:from-cyan-400 hover:via-blue-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B14]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isAr ? 'جاري الإرسال...' : 'Sending...'}
                  </span>
                ) : (
                  isAr ? 'إرسال رابط الاستعادة' : 'Send reset link'
                )}
              </button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  aria-label={isAr ? 'العودة إلى صفحة تسجيل الدخول' : 'Return to sign in page'}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] text-cyan-400/80 hover:text-cyan-300 transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B14]"
                >
                  <BackIcon className="w-3.5 h-3.5" />
                  <span>{isAr ? 'العودة لتسجيل الدخول' : 'Back to sign in'}</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function useLanguageSafe() {
  const ctx = useLanguageCtxOrNull();
  const isAr = ctx ? ctx.locale === 'ar' : readSavedLocale() !== 'en';
  const dir: 'rtl' | 'ltr' = 'rtl';
  return { isAr, dir };
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
