'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { 
  KeyRound, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Loader2, 
  ShieldCheck 
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PasswordStrength {
  score: number;
  label: string;
  colorClass: string;
  textColorClass: string;
}

const getPasswordStrength = (pass: string, isAr: boolean): PasswordStrength => {
  if (!pass) {
    return {
      score: 0,
      label: '',
      colorClass: 'bg-slate-200 dark:bg-slate-800',
      textColorClass: 'text-slate-400 dark:text-slate-500'
    };
  }

  let score = 0;
  if (pass.length >= 6) score += 1;
  if (pass.length >= 10) score += 1;
  if (/[0-9]/.test(pass) && /[a-zA-Z]/.test(pass)) score += 1;
  if (/[^A-Za-z0-9]/.test(pass)) score += 1;

  score = Math.max(1, Math.min(score, 4));

  switch (score) {
    case 1:
      return {
        score: 1,
        label: isAr ? 'ضعيفة' : 'Weak',
        colorClass: 'bg-rose-500',
        textColorClass: 'text-rose-500 dark:text-rose-400'
      };
    case 2:
      return {
        score: 2,
        label: isAr ? 'متوسطة' : 'Fair',
        colorClass: 'bg-amber-500',
        textColorClass: 'text-amber-500 dark:text-amber-400'
      };
    case 3:
      return {
        score: 3,
        label: isAr ? 'جيدة' : 'Good',
        colorClass: 'bg-blue-500',
        textColorClass: 'text-blue-500 dark:text-blue-400'
      };
    case 4:
      return {
        score: 4,
        label: isAr ? 'قوية جداً' : 'Strong',
        colorClass: 'bg-emerald-500',
        textColorClass: 'text-emerald-600 dark:text-emerald-400'
      };
    default:
      return {
        score: 0,
        label: '',
        colorClass: 'bg-slate-200 dark:bg-slate-800',
        textColorClass: 'text-slate-400 dark:text-slate-500'
      };
  }
};

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const isMinLength = newPassword.length >= 6;
  const isMatching = newPassword.length > 0 && newPassword === confirmPassword;
  const isMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const isValid = isMinLength && isMatching;

  const strength = getPasswordStrength(newPassword, isAr);

  const handleReset = () => {
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setErrorMsg('');
    setSuccess(false);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        handleReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      if (!isMinLength) {
        setErrorMsg(isAr ? 'يجب أن لا تقل كلمة المرور عن 6 أحرف أو أرقام' : 'Password must be at least 6 characters');
      } else if (!isMatching) {
        setErrorMsg(isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      }
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        setErrorMsg(error.message);
        toast.error(error.message);
      } else {
        setSuccess(true);
        toast.success(isAr ? 'تم تحديث كلمة المرور بنجاح!' : 'Password updated successfully!');
        setTimeout(() => {
          handleReset();
        }, 1200);
      }
    } catch (err: any) {
      const msg = err.message || (isAr ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred');
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          handleReset();
        }
      }}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-modal-title"
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden relative"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 id="change-password-modal-title" className="text-base font-black text-slate-900 dark:text-white">
                {isAr ? 'تغيير كلمة المرور' : 'Change Password'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr ? 'أدخل كلمة مرور جديدة قوية لحماية حسابك' : 'Enter a strong new password to protect your account'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            aria-label={isAr ? 'إغلاق نافذة تغيير كلمة المرور' : 'Close change password modal'}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {success ? (
            <div className="py-8 text-center space-y-3" role="status" aria-live="polite">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                {isAr ? 'تم تحديث كلمة المرور بنجاح!' : 'Password Updated Successfully!'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr ? 'يمكنك الآن استخدام كلمة المرور الجديدة في المرات القادمة.' : 'You can now use your new password next time you log in.'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {errorMsg && (
                <div 
                  role="alert" 
                  aria-live="assertive"
                  className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* New Password Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="new-password" className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                    {isAr ? 'كلمة المرور الجديدة *' : 'New Password *'}
                  </label>
                </div>
                
                {/* LTR container to fix RTL eye toggle clash */}
                <div className="relative" dir="ltr">
                  <input
                    id="new-password"
                    name="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    aria-describedby="new-password-strength-desc password-requirements-list"
                    className="w-full px-4 py-3 pr-11 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm font-mono text-left focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={showNewPassword 
                      ? (isAr ? 'إخفاء كلمة المرور الجديدة' : 'Hide new password') 
                      : (isAr ? 'إظهار كلمة المرور الجديدة' : 'Show new password')}
                    aria-pressed={showNewPassword}
                    aria-controls="new-password"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator Bar */}
                {newPassword.length > 0 && (
                  <div 
                    id="new-password-strength-desc"
                    className="space-y-1.5 pt-1" 
                    role="progressbar"
                    aria-valuenow={strength.score}
                    aria-valuemin={0}
                    aria-valuemax={4}
                    aria-valuetext={strength.label}
                    aria-label={isAr ? 'مقياس قوة كلمة المرور' : 'Password strength meter'}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">
                        {isAr ? 'قوة كلمة المرور:' : 'Password strength:'}
                      </span>
                      <span className={`font-bold transition-colors ${strength.textColorClass}`}>
                        {strength.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
                      <div className={`h-full rounded-full transition-all duration-300 ${strength.score >= 1 ? strength.colorClass : 'bg-slate-200 dark:bg-slate-800'}`} />
                      <div className={`h-full rounded-full transition-all duration-300 ${strength.score >= 2 ? strength.colorClass : 'bg-slate-200 dark:bg-slate-800'}`} />
                      <div className={`h-full rounded-full transition-all duration-300 ${strength.score >= 3 ? strength.colorClass : 'bg-slate-200 dark:bg-slate-800'}`} />
                      <div className={`h-full rounded-full transition-all duration-300 ${strength.score >= 4 ? strength.colorClass : 'bg-slate-200 dark:bg-slate-800'}`} />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1.5">
                <label htmlFor="confirm-password" className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  {isAr ? 'تأكيد كلمة المرور الجديدة *' : 'Confirm New Password *'}
                </label>

                {/* LTR container to fix RTL eye toggle clash */}
                <div className="relative" dir="ltr">
                  <input
                    id="confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    aria-invalid={isMismatch}
                    aria-describedby={confirmPassword.length > 0 ? 'confirm-password-feedback' : undefined}
                    className={`w-full px-4 py-3 pr-11 rounded-2xl border bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm font-mono text-left focus:outline-none transition-all ${
                      confirmPassword.length > 0
                        ? isMatching
                          ? 'border-emerald-500/70 dark:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500'
                          : 'border-rose-400 dark:border-rose-600 focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500'
                        : 'border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword 
                      ? (isAr ? 'إخفاء تأكيد كلمة المرور' : 'Hide confirm password') 
                      : (isAr ? 'إظهار تأكيد كلمة المرور' : 'Show confirm password')}
                    aria-pressed={showConfirmPassword}
                    aria-controls="confirm-password"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Real-time Match Validation Inline Feedback */}
                {confirmPassword.length > 0 && (
                  <div 
                    id="confirm-password-feedback"
                    role="status" 
                    aria-live="polite"
                    className={`text-xs flex items-center gap-1.5 font-medium pt-0.5 transition-colors ${
                      isMatching ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'
                    }`}
                  >
                    {isMatching ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>{isAr ? 'كلمتا المرور متطابقتان' : 'Passwords match'}</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'}</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Real-time Requirements Checklist */}
              <div 
                id="password-requirements-list"
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs"
              >
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {isAr ? 'إرشادات كلمة المرور' : 'Password Guidelines'}
                </div>
                <div className="space-y-1.5">
                  <div className={`flex items-center gap-2 transition-colors ${isMinLength ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400 dark:text-slate-500'}`}>
                    {isMinLength ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600 shrink-0" />
                    )}
                    <span>{isAr ? '6 أحرف أو أرقام على الأقل' : 'At least 6 characters'}</span>
                  </div>

                  <div className={`flex items-center gap-2 transition-colors ${
                    isMismatch
                      ? 'text-rose-500 dark:text-rose-400 font-bold'
                      : isMatching
                        ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                        : 'text-slate-400 dark:text-slate-500'
                  }`}>
                    {isMismatch ? (
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    ) : isMatching ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600 shrink-0" />
                    )}
                    <span>
                      {isMismatch 
                        ? (isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match')
                        : (isAr ? 'تطابق كلمتي المرور' : 'Passwords match')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  disabled={loading || !isValid}
                  aria-busy={loading}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isAr ? 'جاري التحديث...' : 'Updating...'}</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>{isAr ? 'تحديث كلمة المرور' : 'Update Password'}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={loading}
                  className="px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

