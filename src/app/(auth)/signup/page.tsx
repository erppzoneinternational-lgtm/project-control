'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Eye,
  EyeOff,
  Loader2,
  Check,
  AlertCircle,
  ShieldCheck,
  Lock,
  Sparkles,
  MessageCircle,
  Copy,
  ArrowLeft,
  Mail,
} from 'lucide-react';
import { generateAdminWhatsAppUrl, generateAdminEmailUrl, ADMIN_WHATSAPP_NUMBER, ADMIN_EMAIL } from '@/lib/services/userService';

/* ================================================================
   Metaball Canvas — blobs follow cursor, fuse via SVG goo filter
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
      { ox: 0.46, oy: 0.32, r: 20, sp: 2.0, phase: 1, hue: 240, sat: 75 },
      { ox: 0.55, oy: 0.55, r: 16, sp: 2.3, phase: 3, hue: 185, sat: 85 },
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
        const pullX = (mx - b.ox) * 30;
        const pullY = (my - b.oy) * 20;
        const bx = w * b.ox + Math.cos(t * b.sp + b.phase) * 28 + pullX;
        const by = h * b.oy + Math.sin(t * b.sp * 0.8 + b.phase) * 20 + pullY;
        const br = b.r + Math.sin(t * 2 + b.phase) * 5;

        const grad = ctx.createRadialGradient(bx, by, 0, bx, by, br * 2.8);
        grad.addColorStop(0, `hsla(${b.hue}, ${b.sat}%, 62%, 0.75)`);
        grad.addColorStop(0.4, `hsla(${b.hue}, ${b.sat}%, 50%, 0.35)`);
        grad.addColorStop(1, `hsla(${b.hue}, ${b.sat}%, 40%, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(bx, by, br * 2.8, 0, Math.PI * 2);
        ctx.fill();
      });

      const cx = w * 0.5 + (mx - 0.5) * 15;
      const cy = h * 0.42 + (my - 0.4) * 10;
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 55);
      cg.addColorStop(0, 'hsla(200, 95%, 72%, 0.3)');
      cg.addColorStop(0.5, 'hsla(200, 85%, 55%, 0.08)');
      cg.addColorStop(1, 'hsla(200, 80%, 50%, 0)');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(cx, cy, 55, 0, Math.PI * 2);
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
   Signup Page — Audited & Polished Enterprise Flow
   ================================================================ */
export default function SignupPage() {
  const router = useRouter();
  const { isAr, dir } = useLanguageSafe();

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI States
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [isMelting, setIsMelting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [submittedUser, setSubmittedUser] = useState<{
    fullName: string;
    email: string;
  } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Field Touched State for Progressive Validation Feedback
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  useEffect(() => {
    setMounted(true);
    setGoogleLoading(false);
    const resetGoogleLoading = () => setGoogleLoading(false);
    window.addEventListener('pageshow', resetGoogleLoading);
    window.addEventListener('focus', resetGoogleLoading);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const prefillEmail = params.get('email');
      if (prefillEmail) {
        setEmail(prefillEmail);
      }
    }
    return () => {
      window.removeEventListener('pageshow', resetGoogleLoading);
      window.removeEventListener('focus', resetGoogleLoading);
    };
  }, []);

  const handleMouseEnter = () => setIsOpen(true);
  const handleMouseLeave = () => {
    if (fullName || email || password || confirmPassword) return;
    setIsOpen(false);
  };
  const handleFocusCapture = () => setIsOpen(true);

  // Validation Rules
  const isNameValid = fullName.trim().length >= 2;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(email.trim());

  // Password Requirements Definition
  const passwordCriteria = [
    {
      id: 'length',
      labelAr: '٨ أحرف على الأقل',
      labelEn: 'At least 8 characters',
      met: password.length >= 8,
    },
    {
      id: 'cases',
      labelAr: 'حرف كبير وصغير (A-z)',
      labelEn: 'Uppercase & lowercase letters',
      met: /[A-Z]/.test(password) && /[a-z]/.test(password),
    },
    {
      id: 'number',
      labelAr: 'رقم واحد على الأقل (0-9)',
      labelEn: 'At least one number',
      met: /[0-9]/.test(password),
    },
    {
      id: 'special',
      labelAr: 'رمز خاص واحد على الأقل (!@#$...)',
      labelEn: 'At least one special character',
      met: /[^A-Za-z0-9]/.test(password),
    },
  ];

  const metCriteriaCount = passwordCriteria.filter((c) => c.met).length;
  const isPasswordValid = metCriteriaCount === 4;
  const isConfirmPasswordValid = confirmPassword.length > 0 && confirmPassword === password;
  const isConfirmMismatch = confirmPassword.length > 0 && confirmPassword !== password;

  const isFormValid = isNameValid && isEmailValid && isPasswordValid && isConfirmPasswordValid;

  // Password Strength Calculation
  const strengthInfo = (() => {
    if (!password) {
      return {
        level: 0,
        labelAr: 'مطلوبة',
        labelEn: 'Required',
        color: 'text-slate-400',
        badgeBg: 'bg-white/[0.04] border-white/10 text-slate-400',
        barColor: 'bg-white/[0.08]',
      };
    }
    if (metCriteriaCount <= 1) {
      return {
        level: 1,
        labelAr: 'ضعيفة جداً',
        labelEn: 'Very Weak',
        color: 'text-rose-400',
        badgeBg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
        barColor: 'bg-rose-500',
      };
    }
    if (metCriteriaCount === 2) {
      return {
        level: 2,
        labelAr: 'ضعيفة',
        labelEn: 'Weak',
        color: 'text-amber-400',
        badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
        barColor: 'bg-amber-500',
      };
    }
    if (metCriteriaCount === 3) {
      return {
        level: 3,
        labelAr: 'جيدة',
        labelEn: 'Good',
        color: 'text-cyan-400',
        badgeBg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
        barColor: 'bg-cyan-400',
      };
    }
    return {
      level: 4,
      labelAr: 'قوية وآمنة',
      labelEn: 'Strong & Secure',
      color: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      barColor: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]',
    };
  })();

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || '';

  const handleGoogleSignup = async () => {
    if (!googleClientId) {
      toast.error(
        isAr
          ? 'التسجيل عبر Google غير مفعّل حالياً (معرّف العميل غير مضبوط).'
          : 'Google sign-up is currently unavailable (client ID not configured).'
      );
      return;
    }
    setGoogleLoading(true);
    try {
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
        authUrl.searchParams.set('state', 'google_local:/projects');
        window.location.assign(authUrl.toString());
        return;
      }

      const siteUrl =
        typeof window !== 'undefined'
          ? window.location.origin
          : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${siteUrl}/auth/callback?next=/projects`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });
      if (error) {
        toast.error(error.message);
        setGoogleLoading(false);
      }
    } catch {
      toast.error(isAr ? 'حدث خطأ أثناء التسجيل' : 'An error occurred during signup');
      setGoogleLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    if (!isFormValid) {
      toast.error(
        isAr
          ? 'يرجى استيفاء شروط الحقول وكلمة المرور للمتابعة'
          : 'Please satisfy all field and password requirements before continuing'
      );
      return;
    }

    setIsMelting(true);
    setLoading(true);

    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

    const { data: signUpData, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim() },
        emailRedirectTo: `${siteUrl}/login`,
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      setIsMelting(false);
    } else {
      setSubmittedUser({
        fullName: fullName.trim(),
        email: email.trim(),
      });
      setLoading(false);
      setIsMelting(false);
      toast.success(
        isAr
          ? 'تم استلام طلب التسجيل بنجاح! يرجى إخطار الإدارة لتفعيل الحساب'
          : 'Registration received! Please contact admin to activate'
      );
    }
  };

  return (
    <>
      <main className="min-h-screen relative overflow-hidden bg-[#060B14] flex items-center justify-center px-4 py-8">
        {/* Ambient Background Glows */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-500/[0.06] blur-[120px]" />
          <div className="absolute bottom-[-15%] right-[-10%] w-[400px] h-[400px] rounded-full bg-blue-600/[0.05] blur-[100px]" />
          <div className="absolute top-[40%] right-[15%] w-[250px] h-[250px] rounded-full bg-emerald-500/[0.03] blur-[80px]" />
        </div>

        {/* Subtle Tech Grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
          aria-hidden="true"
        />

        {/* Accessible Live Announcement Region for Screen Readers */}
        <div role="status" aria-live="polite" className="sr-only">
          {touched.password && (isAr ? `قوة كلمة المرور الحالية: ${strengthInfo.labelAr}` : `Current password strength: ${strengthInfo.labelEn}`)}
        </div>

        {/* Auth Container with Touch & Focus Capture */}
        <div
          ref={cardRef}
          dir={dir}
          className={`flow-auth relative z-10 w-full max-w-[450px] transition-all duration-700 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          } ${isOpen ? 'is-open' : ''}`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onFocusCapture={handleFocusCapture}
          onClick={() => setIsOpen(true)}
        >
          {/* Metaball Hero Canvas */}
          <div className="relative h-[150px] mb-[-16px] z-20 pointer-events-none">
            <MetaballHero className="absolute inset-0" />
          </div>

          {/* Glass Card */}
          <div className="flow-card relative rounded-3xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-2xl shadow-[0_8px_50px_rgba(0,0,0,0.5)] overflow-hidden">
            {/* Top edge glow */}
            <div className="absolute top-0 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-cyan-400/25 to-transparent" aria-hidden="true" />

            <div className="p-6 sm:p-8 pt-10">
              {/* Brand Header — Official Logo */}
              <div className="text-center mb-6 flex flex-col items-center">
                <img
                  src="/pzone-logo-white.png"
                  alt="P.ZONE"
                  className="h-10 w-auto object-contain drop-shadow-[0_4px_24px_rgba(0,200,255,0.25)] select-none"
                />
                <h1 className="text-base font-bold text-white mt-3">
                  {isAr ? 'إنشاء حساب جديد' : 'Create New Account'}
                </h1>
                <p className="text-[13px] text-slate-400 mt-1 font-medium">
                  {isAr ? 'ابدأ بإنشاء حساب جديد في البوابة' : 'Create an account to get started'}
                </p>
              </div>

              {submittedUser ? (
                <div className="space-y-6 text-center py-2 animate-fadeIn" dir={dir}>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.25)]">
                    <ShieldCheck className="w-8 h-8" />
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-lg font-bold text-white tracking-tight">
                      {isAr ? 'تم استلام طلب إنشاء الحساب بنجاح!' : 'Account Request Received!'}
                    </h2>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                      {isAr
                        ? 'حسابك حالياً قيد المراجعة الإدارية. لتفعيل الحساب فوراً وتحديد الصلاحيات والمشاريع المخصصة، يرجى التواصل مع مسؤول النظام عبر واتساب:'
                        : 'Your account is under administrative review. To activate your account and configure your project access immediately, please notify the System Administrator via WhatsApp:'}
                    </p>
                  </div>

                  {/* User info recap */}
                  <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 text-xs space-y-2 text-start">
                    <div className="flex justify-between items-center text-slate-300">
                      <span>{isAr ? 'الاسم:' : 'Name:'}</span>
                      <span className="text-white font-semibold">{submittedUser.fullName}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-300">
                      <span>{isAr ? 'البريد الإلكتروني:' : 'Email:'}</span>
                      <span className="text-cyan-400 font-semibold font-mono" dir="ltr">{submittedUser.email}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-300">
                      <span>{isAr ? 'حالة الحساب:' : 'Account Status:'}</span>
                      <span className="text-amber-400 font-bold bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 text-[10px]">
                        {isAr ? 'بانتظار التفعيل الإداري' : 'Pending Activation'}
                      </span>
                    </div>
                  </div>

                  {/* Primary CTA: WhatsApp Direct Link & Admin Email */}
                  <div className="space-y-2.5 pt-1">
                    <a
                      href={generateAdminWhatsAppUrl(submittedUser)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-[0_4px_25px_rgba(16,185,129,0.35)] transition-all transform hover:scale-[1.02] active:scale-98 cursor-pointer"
                    >
                      <MessageCircle className="w-5 h-5 fill-current" />
                      <span dir="ltr">WhatsApp: +20 122 999 4728 (01229994728)</span>
                    </a>

                    <a
                      href={generateAdminEmailUrl(submittedUser)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/40 text-slate-200 hover:text-cyan-300 text-xs font-semibold transition-all cursor-pointer"
                    >
                      <Mail className="w-4 h-4 text-cyan-400" />
                      <span dir="ltr">Email: {ADMIN_EMAIL}</span>
                    </a>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const msg = `مرحباً م/ حسن، لقد قمت بإنشاء حساب جديد على بوابة Pzone ERP باسم: ${submittedUser.fullName} وبريد: ${submittedUser.email}، برجاء التكرم بالتفعيل وتحديد الصلاحيات والمشاريع.`;
                          navigator.clipboard.writeText(msg);
                          toast.success(isAr ? 'تم نسخ نص الرسالة للحافظة' : 'Message copied to clipboard');
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 text-slate-200 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{isAr ? 'نسخ نص الرسالة' : 'Copy message'}</span>
                      </button>

                      <Link
                        href="/login"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-300 text-xs font-semibold transition-colors"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                        <span>{isAr ? 'تسجيل الدخول' : 'Sign in'}</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Peek Button (visible when form is folded, accessible on focus) */}
                  <div className="peek-btn flex justify-center mb-2">
                    <button
                      type="button"
                      onClick={() => setIsOpen(true)}
                      className="px-8 py-3 rounded-xl text-sm font-bold text-slate-200 bg-white/[0.05] border border-white/[0.08] 
                        hover:bg-white/[0.1] hover:text-white hover:border-white/20 transition-all duration-300 cursor-pointer
                        focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
                    >
                      {isAr ? 'إنشاء حساب جديد' : 'Create account'}
                    </button>
                  </div>

                  {/* Registration Form */}
                  <form onSubmit={handleSignup} method="post" action="#" aria-label={isAr ? 'نموذج إنشاء الحساب' : 'Registration form'} className="flow-form space-y-4">
                {/* 1. Full Name Group */}
                <div>
                  <div className="flex items-center justify-between mb-1.5 px-0.5">
                    <label htmlFor="signup-fullname" className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                      <span>{isAr ? 'الاسم الكامل' : 'Full Name'}</span>
                      <span className="text-cyan-400 text-[10px]" aria-hidden="true">*</span>
                    </label>

                    {/* Validation Badge in RTL & LTR */}
                    {fullName.length === 0 ? (
                      <span className="text-[11px] px-2 py-0.5 rounded-full border border-white/10 bg-white/[0.03] text-slate-300 font-medium">
                        {isAr ? 'مطلوب' : 'Required'}
                      </span>
                    ) : isNameValid ? (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-medium">
                        <Check className="w-3 h-3 stroke-[2.5]" aria-hidden="true" />
                        <span>{isAr ? 'صالح' : 'Valid'}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-400 font-medium">
                        <AlertCircle className="w-3 h-3 stroke-[2]" aria-hidden="true" />
                        <span>{isAr ? 'حرفين على الأقل' : 'Min. 2 chars'}</span>
                      </span>
                    )}
                  </div>

                  <input
                    id="signup-fullname"
                    name="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
                    required
                    aria-required="true"
                    aria-invalid={touched.name && !isNameValid}
                    aria-describedby="signup-fullname-desc"
                    placeholder={isAr ? 'الاسم الكامل' : 'e.g. Hassan Soliman'}
                    dir={dir}
                    className="flow-input w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-300
                      bg-white/[0.05] border border-white/[0.07] text-white placeholder:text-slate-400
                      focus:bg-white/[0.08] focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30
                      hover:border-white/20"
                  />
                  <span id="signup-fullname-desc" className="sr-only">
                    {isAr ? 'أدخل اسمك الكامل المكون من حرفين على الأقل' : 'Enter your full name with at least 2 characters'}
                  </span>
                </div>

                {/* 2. Email Group */}
                <div>
                  <div className="flex items-center justify-between mb-1.5 px-0.5">
                    <label htmlFor="signup-email" className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                      <span>{isAr ? 'البريد الإلكتروني' : 'Email Address'}</span>
                      <span className="text-cyan-400 text-[10px]" aria-hidden="true">*</span>
                    </label>

                    {/* Email Validation Badge in RTL & LTR */}
                    {email.length === 0 ? (
                      <span className="text-[11px] px-2 py-0.5 rounded-full border border-white/10 bg-white/[0.03] text-slate-300 font-medium">
                        {isAr ? 'مطلوب' : 'Required'}
                      </span>
                    ) : isEmailValid ? (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-medium">
                        <Check className="w-3 h-3 stroke-[2.5]" aria-hidden="true" />
                        <span>{isAr ? 'صالح' : 'Valid'}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-400 font-medium">
                        <AlertCircle className="w-3 h-3 stroke-[2]" aria-hidden="true" />
                        <span>{isAr ? 'صيغة غير صحيحة' : 'Invalid format'}</span>
                      </span>
                    )}
                  </div>

                  <input
                    id="signup-email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                    required
                    aria-required="true"
                    aria-invalid={touched.email && !isEmailValid}
                    aria-describedby="signup-email-desc"
                    placeholder="example@gmail.com"
                    dir="ltr"
                    className="flow-input w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-300
                      bg-white/[0.05] border border-white/[0.07] text-white placeholder:text-slate-400
                      focus:bg-white/[0.08] focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30
                      hover:border-white/20"
                  />
                  <span id="signup-email-desc" className="sr-only">
                    {isAr ? 'أدخل بريدك الإلكتروني (Gmail أو بريد الشركة)' : 'Enter your email address (Gmail or corporate email)'}
                  </span>
                </div>

                {/* 3. Password Group with Checklist & Strength Indicator */}
                <div>
                  <div className="flex items-center justify-between mb-1.5 px-0.5">
                    <label htmlFor="signup-password" className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                      <span>{isAr ? 'كلمة المرور' : 'Password'}</span>
                      <span className="text-cyan-400 text-[10px]" aria-hidden="true">*</span>
                    </label>

                    {/* Password Strength Badge */}
                    <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border font-medium transition-colors ${strengthInfo.badgeBg}`}>
                      {isPasswordValid ? (
                        <ShieldCheck className="w-3 h-3 stroke-[2.5]" aria-hidden="true" />
                      ) : metCriteriaCount > 0 ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />
                      ) : null}
                      <span>{isAr ? strengthInfo.labelAr : strengthInfo.labelEn}</span>
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      id="signup-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => {
                        setPasswordFocused(false);
                        setTouched((prev) => ({ ...prev, password: true }));
                      }}
                      required
                      aria-required="true"
                      aria-invalid={touched.password && !isPasswordValid}
                      aria-describedby="password-requirements"
                      placeholder="••••••••"
                      dir="ltr"
                      className="flow-input w-full px-4 py-3 pr-11 rounded-xl text-sm outline-none transition-all duration-300
                        bg-white/[0.05] border border-white/[0.07] text-white placeholder:text-slate-400
                        focus:bg-white/[0.08] focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30
                        hover:border-white/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? (isAr ? 'إخفاء كلمة المرور' : 'Hide password') : (isAr ? 'إظهار كلمة المرور' : 'Show password')}
                      aria-pressed={showPassword}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 inline-flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer
                        focus-visible:ring-1 focus-visible:ring-cyan-400 focus-visible:outline-none rounded-md"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength Meter & Matching Criteria Checklist */}
                  <div
                    id="password-requirements"
                    role="region"
                    aria-label={isAr ? 'شروط كلمة المرور' : 'Password requirements'}
                    className={`transition-all duration-300 overflow-hidden ${
                      passwordFocused || password.length > 0 || touched.password
                        ? 'max-h-96 opacity-100 mt-2.5'
                        : 'max-h-0 opacity-0 mt-0 pointer-events-none'
                    }`}
                  >
                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-3.5 space-y-2.5">
                      {/* Segmented Strength Bar */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-medium">{isAr ? 'مستوى الأمان' : 'Security Level'}</span>
                          <span className={`font-semibold ${strengthInfo.color}`}>
                            {isAr ? strengthInfo.labelAr : strengthInfo.labelEn}
                          </span>
                        </div>
                        <div
                          className="grid grid-cols-4 gap-1.5"
                          role="progressbar"
                          aria-valuenow={metCriteriaCount}
                          aria-valuemin={0}
                          aria-valuemax={4}
                          aria-label={isAr ? 'مقياس قوة كلمة المرور' : 'Password strength meter'}
                        >
                          {[1, 2, 3, 4].map((step) => {
                            const isFilled = metCriteriaCount >= step;
                            return (
                              <div
                                key={step}
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                  isFilled ? strengthInfo.barColor : 'bg-white/[0.08]'
                                }`}
                              />
                            );
                          })}
                        </div>
                      </div>

                      {/* Matching Criteria Checklist */}
                      <ul className="space-y-1.5 pt-1 border-t border-white/[0.05]" aria-label={isAr ? 'قائمة متطلبات كلمة المرور' : 'Password criteria list'}>
                        {passwordCriteria.map((req) => (
                          <li
                            key={req.id}
                            className={`flex items-center gap-2 text-xs transition-colors duration-200 ${
                              req.met ? 'text-emerald-300 font-medium' : 'text-slate-400'
                            }`}
                          >
                            <span
                              className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border transition-all duration-200 ${
                                req.met
                                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 scale-105 shadow-[0_0_8px_rgba(52,211,153,0.3)]'
                                  : 'bg-white/[0.04] border-white/10 text-slate-500'
                              }`}
                              aria-hidden="true"
                            >
                              {req.met ? (
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-500/60" />
                              )}
                            </span>
                            <span className="select-none">{isAr ? req.labelAr : req.labelEn}</span>
                            <span className="sr-only">
                              {req.met
                                ? isAr ? 'مستوفى' : 'Satisfied'
                                : isAr ? 'غير مستوفى' : 'Not satisfied'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 4. Confirm Password Group */}
                <div>
                  <div className="flex items-center justify-between mb-1.5 px-0.5">
                    <label htmlFor="signup-confirm-password" className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                      <span>{isAr ? 'تأكيد كلمة المرور' : 'Confirm Password'}</span>
                      <span className="text-cyan-400 text-[10px]" aria-hidden="true">*</span>
                    </label>

                    {/* Matching Status Badge in RTL & LTR */}
                    {confirmPassword.length === 0 ? (
                      <span className="text-[11px] px-2 py-0.5 rounded-full border border-white/10 bg-white/[0.03] text-slate-300 font-medium">
                        {isAr ? 'مطلوب' : 'Required'}
                      </span>
                    ) : isConfirmPasswordValid ? (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-medium">
                        <Check className="w-3 h-3 stroke-[2.5]" aria-hidden="true" />
                        <span>{isAr ? 'متطابقة' : 'Matches'}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-400 font-medium">
                        <AlertCircle className="w-3 h-3 stroke-[2]" aria-hidden="true" />
                        <span>{isAr ? 'غير متطابقة' : 'Mismatch'}</span>
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      id="signup-confirm-password"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onBlur={() => setTouched((prev) => ({ ...prev, confirmPassword: true }))}
                      required
                      aria-required="true"
                      aria-invalid={touched.confirmPassword && isConfirmMismatch}
                      aria-describedby="signup-confirm-desc"
                      placeholder="••••••••"
                      dir="ltr"
                      className="flow-input w-full px-4 py-3 pr-11 rounded-xl text-sm outline-none transition-all duration-300
                        bg-white/[0.05] border border-white/[0.07] text-white placeholder:text-slate-400
                        focus:bg-white/[0.08] focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30
                        hover:border-white/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? (isAr ? 'إخفاء تأكيد كلمة المرور' : 'Hide confirm password') : (isAr ? 'إظهار تأكيد كلمة المرور' : 'Show confirm password')}
                      aria-pressed={showConfirmPassword}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 inline-flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer
                        focus-visible:ring-1 focus-visible:ring-cyan-400 focus-visible:outline-none rounded-md"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <span id="signup-confirm-desc" className="sr-only">
                    {isAr ? 'أعد إدخال كلمة المرور للمطابقة والتأكيد' : 'Re-enter your password to confirm match'}
                  </span>
                </div>

                {/* 5. Accessible Submit Button States */}
                <div>
                  <button
                    type="submit"
                    disabled={!isFormValid || loading}
                    aria-disabled={!isFormValid || loading}
                    className={`flow-signin w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-300
                      flex items-center justify-center gap-2
                      ${
                        isFormValid
                          ? 'bg-gradient-to-r from-cyan-500 via-blue-500 to-blue-600 hover:from-cyan-400 hover:via-blue-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 active:scale-[0.98] cursor-pointer'
                          : 'bg-white/[0.04] border border-white/[0.08] text-slate-400 cursor-not-allowed opacity-60'
                      }
                      disabled:opacity-60 disabled:cursor-not-allowed
                      focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none
                      ${isMelting ? 'is-melting' : ''}`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        <span>{isAr ? 'جاري إنشاء الحساب...' : 'Creating account...'}</span>
                      </>
                    ) : !isFormValid ? (
                      <>
                        <Lock className="w-4 h-4 text-slate-400" aria-hidden="true" />
                        <span>{isAr ? 'إنشاء الحساب' : 'Create account'}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-cyan-200" aria-hidden="true" />
                        <span>{isAr ? 'إنشاء الحساب' : 'Create account'}</span>
                      </>
                    )}
                  </button>

                  {/* Accessible helper state description below submit */}
                  <p
                    id="signup-submit-hint"
                    className={`text-[11px] text-center mt-2 transition-colors ${
                      isFormValid ? 'text-cyan-400 font-medium' : 'text-slate-400'
                    }`}
                    aria-live="polite"
                  >
                    {isFormValid
                      ? (isAr ? 'جميع الشروط مستوفاة — جاهز للتسجيل الآن' : 'All requirements satisfied — ready to register')
                      : (isAr ? 'يرجى إكمال البيانات وشروط كلمة المرور لتفعيل الزر' : 'Please satisfy all field and password requirements')}
                  </p>
                </div>

                {/* 6. Divider */}
                <div className="relative flex items-center justify-center py-1">
                  <div className="border-t border-white/[0.05] w-full" />
                  <span className={`absolute bg-[#060B14] px-4 text-[11px] text-slate-400 font-medium ${isAr ? 'tracking-normal' : 'uppercase tracking-widest'}`}>
                    {isAr ? 'أو' : 'or continue with'}
                  </span>
                </div>

                {/* 7. Google Signup */}
                <div>
                  <button
                    type="button"
                    onClick={handleGoogleSignup}
                    disabled={googleLoading}
                    className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer
                      bg-white/[0.04] border border-white/[0.08] text-slate-200
                      hover:bg-white/[0.08] hover:border-white/20 hover:text-white
                      disabled:opacity-50 active:scale-[0.97]
                      focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
                  >
                    {googleLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                    )}
                    <span>{isAr ? 'التسجيل عبر Google' : 'Sign up with Google'}</span>
                  </button>
                </div>

                {/* 8. Return to Login */}
                <p className="text-center text-[13px] text-slate-400 pt-1">
                  {isAr ? 'لديك حساب بالفعل؟ ' : 'Already have an account? '}
                  <Link
                    href="/login"
                    className="font-bold text-cyan-400 hover:text-cyan-300 transition-colors focus-visible:underline focus-visible:outline-none"
                  >
                    {isAr ? 'تسجيل الدخول' : 'Sign in'}
                  </Link>
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>

        {/* Bottom Official Scope Branding */}
        <div className="absolute bottom-6 text-center w-full z-10 flex items-center justify-center gap-2 select-none" aria-hidden="true">
          <img src="/pzone-emblem.png" alt="" className="w-4 h-4 object-contain opacity-80" />
          <p className={`text-[11px] text-slate-400 font-medium ${isAr ? 'tracking-normal' : 'tracking-wide'}`}>
            {isAr ? 'منظومة إدارة المشروعات والمنشآت المائية' : 'Project Management Portal — Water Scope'}
          </p>
        </div>
      </main>
    </>
  );
}

function useLanguageSafe() {
  const ctx = useLanguageCtxOrNull();
  const isAr = ctx ? ctx.locale === 'ar' : readSavedLocale() !== 'en';
  const dir = isAr ? 'rtl' : 'ltr';
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
  const stored = localStorage.getItem('pzone-locale') || localStorage.getItem('pzone_locale');
  return stored === 'en' ? 'en' : 'ar';
}
