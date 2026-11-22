'use client';

import React, { useState } from 'react';
import { ShieldAlert, ExternalLink, LogOut } from 'lucide-react';
import { PORTAL_URL } from '@/lib/supabase/config';
import { useAuth } from '@/lib/stores/useAuthStore';

export default function NoAccessPage() {
  const { user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div
      className="min-h-screen relative flex items-center justify-center bg-slate-950 p-4 sm:p-6 overflow-hidden"
      dir="rtl"
    >
      <div className="absolute -top-36 left-1/2 -translate-x-1/2 w-[520px] h-[320px] rounded-full blur-[140px] pointer-events-none opacity-30 bg-amber-500" />

      <div className="relative w-full max-w-lg bg-slate-900/90 backdrop-blur-2xl rounded-3xl border border-slate-800/90 shadow-2xl p-6 sm:p-8 space-y-6 text-center overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/80 to-transparent" />

        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto bg-amber-500/10 border border-amber-500/30 text-amber-400">
          <ShieldAlert size={34} strokeWidth={2.2} />
        </div>

        <div className="space-y-3">
          <h1 className="text-xl sm:text-2xl font-black text-white">
            لا تملك صلاحية الوصول إلى نظام متابعة المشاريع
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            حسابك غير مفعل حالياً في هذا النظام. تتم إدارة الصلاحيات والأدوار من خلال لوحة التحكم في البوابة الرئيسية.
          </p>

          <div className="pt-2 border-t border-slate-800/80 space-y-1.5" dir="ltr">
            <h2 className="text-base sm:text-lg font-bold text-slate-100">
              You do not have access to Projects Control
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Your account does not currently have active access to this system. Roles and access are managed in the Portal Console.
            </p>
          </div>
        </div>

        {user?.email && (
          <div className="bg-slate-950/60 rounded-2xl px-4 py-3 border border-slate-800/70 text-xs flex items-center justify-between gap-2">
            <span className="text-slate-400 font-medium">الحساب الحالي / Account:</span>
            <span className="text-slate-200 font-mono truncate" dir="ltr">
              {user.email}
            </span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <a
            href={PORTAL_URL}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-950/40"
          >
            <ExternalLink size={15} />
            <span>العودة إلى البوابة الرئيسية • Back to the Portal</span>
          </a>

          <button
            type="button"
            disabled={signingOut}
            onClick={handleSignOut}
            className="py-3 px-5 rounded-xl font-semibold text-xs bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <LogOut size={15} />
            <span>{signingOut ? 'جاري الخروج...' : 'تسجيل الخروج • Sign Out'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
