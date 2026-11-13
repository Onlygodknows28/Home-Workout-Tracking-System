'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { useDataCache } from '../../../context/DataCacheContext';
import { ArrowRight, Eye, EyeOff, Check, Circle } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register, loginWithGoogle } = useAuth();
  const { t } = useLanguage();
  const { prewarmAllTabs } = useDataCache();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const hasGoogleConfig = !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // Real-time password strength calculation
  const passwordRules = useMemo(() => {
    const hasMinLength = password.length >= 6;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const score = (hasMinLength ? 1 : 0) + (hasLetter ? 1 : 0) + (hasNumber ? 1 : 0);

    return {
      hasMinLength,
      hasLetter,
      hasNumber,
      score,
      isValid: hasMinLength && hasLetter && hasNumber,
    };
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length < 2 || cleanName.length > 50) {
      setErrorMsg('Họ và tên phải có độ dài từ 2 đến 50 ký tự.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMsg('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }

    if (!passwordRules.isValid) {
      setErrorMsg(t('passwordRequirements'));
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      await register(cleanName, cleanEmail, password);
      prewarmAllTabs();
      router.push('/onboarding');
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse?.credential) {
      setErrorMsg('Không nhận được mã xác thực Google.');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await loginWithGoogle(credentialResponse.credential);
      prewarmAllTabs();
      router.push('/onboarding');
    } catch (err: any) {
      setErrorMsg(err.message || 'Đăng ký bằng Google thất bại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setErrorMsg('Đăng ký bằng Google không thành công hoặc đã bị đóng.');
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-10">
      {/* SINGLE-LAYER EDITORIAL REGISTER SURFACE */}
      <div className="w-full max-w-[440px] bento-tile p-7 sm:p-8">
        <h1 className="font-display text-[38px] font-extrabold text-[#333333] leading-none">
          {t('registerTitle')}
        </h1>
        <p className="text-xs text-[#5C5C5C] mt-1.5 pb-5 border-b border-[#D6D6D2]">
          {t('registerSubtitle')}
        </p>

        {errorMsg && (
          <div className="mt-4 bg-[#FDE8E9] border border-[#C42126]/30 rounded-lg p-3 text-xs font-semibold text-[#C42126]">
            {errorMsg}
          </div>
        )}

        {/* GOOGLE SIGN-IN SECTION */}
        <div className="pt-5">
          {hasGoogleConfig ? (
            <div className="w-full flex justify-center [&>div]:w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                text="signup_with"
                shape="rectangular"
                size="large"
                width="376"
              />
            </div>
          ) : (
            <button
              type="button"
              disabled={isLoading}
              onClick={() =>
                setErrorMsg(
                  'Google OAuth chưa được kích hoạt: Vui lòng cấu hình NEXT_PUBLIC_GOOGLE_CLIENT_ID trong biến môi trường.',
                )
              }
              className="w-full py-2.5 px-4 rounded-lg bg-white border border-[#D6D6D2] hover:bg-[#F5F5F0] transition-colors flex items-center justify-center gap-2.5 text-xs font-semibold text-[#333333] shadow-sm cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{t('googleLoginBtn')}</span>
            </button>
          )}

          {/* OR DIVIDER */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#D6D6D2]" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
              <span className="bg-[#EBEBE6] px-3 font-bold text-[#5C5C5C]">{t('orDivider')}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#333333] mb-1.5">
              {t('fullNameLabel')}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Walker"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#FFFFFF] border border-[#D6D6D2] text-sm text-[#333333] placeholder:text-[#5C5C5C]/60 focus:outline-none focus:border-[#C42126]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#333333] mb-1.5">
              {t('emailLabel')}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="athlete@example.com"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#FFFFFF] border border-[#D6D6D2] text-sm text-[#333333] placeholder:text-[#5C5C5C]/60 focus:outline-none focus:border-[#C42126]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-[#333333]">
                {t('passwordLabel')}
              </label>
              {password.length > 0 && (
                <span
                  className={`text-[11px] font-bold ${
                    passwordRules.score === 3
                      ? 'text-[#16A34A]'
                      : passwordRules.score === 2
                      ? 'text-[#D97706]'
                      : 'text-[#C42126]'
                  }`}
                >
                  {passwordRules.score === 3
                    ? t('passwordStrong')
                    : passwordRules.score === 2
                    ? t('passwordMedium')
                    : t('passwordWeak')}
                </span>
              )}
            </div>

            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-3.5 pr-10 py-2.5 rounded-lg bg-[#FFFFFF] border border-[#D6D6D2] text-sm text-[#333333] placeholder:text-[#5C5C5C]/60 focus:outline-none focus:border-[#C42126]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 text-[#5C5C5C] hover:text-[#333333] p-1 transition-colors cursor-pointer"
                title={showPassword ? t('hidePassword') : t('showPassword')}
                aria-label={showPassword ? t('hidePassword') : t('showPassword')}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* PASSWORD STRENGTH BARS */}
            {password.length > 0 && (
              <div className="grid grid-cols-3 gap-1.5 mt-2">
                <div
                  className={`h-1 rounded-full transition-colors ${
                    passwordRules.score >= 1 ? (passwordRules.score === 1 ? 'bg-[#C42126]' : passwordRules.score === 2 ? 'bg-[#D97706]' : 'bg-[#16A34A]') : 'bg-[#D6D6D2]'
                  }`}
                />
                <div
                  className={`h-1 rounded-full transition-colors ${
                    passwordRules.score >= 2 ? (passwordRules.score === 2 ? 'bg-[#D97706]' : 'bg-[#16A34A]') : 'bg-[#D6D6D2]'
                  }`}
                />
                <div
                  className={`h-1 rounded-full transition-colors ${
                    passwordRules.score === 3 ? 'bg-[#16A34A]' : 'bg-[#D6D6D2]'
                  }`}
                />
              </div>
            )}

            {/* REQUIREMENTS CHECKLIST */}
            <div className="mt-2.5 space-y-1 text-[11px] text-[#5C5C5C]">
              <div
                className={`flex items-center gap-1.5 transition-colors ${
                  passwordRules.hasMinLength ? 'text-[#16A34A] font-semibold' : ''
                }`}
              >
                {passwordRules.hasMinLength ? (
                  <Check className="w-3 h-3 text-[#16A34A]" />
                ) : (
                  <Circle className="w-3 h-3 text-[#D6D6D2]" />
                )}
                <span>{t('passwordRuleLength')}</span>
              </div>
              <div
                className={`flex items-center gap-1.5 transition-colors ${
                  passwordRules.hasLetter ? 'text-[#16A34A] font-semibold' : ''
                }`}
              >
                {passwordRules.hasLetter ? (
                  <Check className="w-3 h-3 text-[#16A34A]" />
                ) : (
                  <Circle className="w-3 h-3 text-[#D6D6D2]" />
                )}
                <span>{t('passwordRuleLetter')}</span>
              </div>
              <div
                className={`flex items-center gap-1.5 transition-colors ${
                  passwordRules.hasNumber ? 'text-[#16A34A] font-semibold' : ''
                }`}
              >
                {passwordRules.hasNumber ? (
                  <Check className="w-3 h-3 text-[#16A34A]" />
                ) : (
                  <Circle className="w-3 h-3 text-[#D6D6D2]" />
                )}
                <span>{t('passwordRuleNumber')}</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || (password.length > 0 && !passwordRules.isValid)}
            className="w-full py-3 rounded-lg btn-cta-red text-xs font-semibold uppercase tracking-wider cursor-pointer disabled:opacity-50"
          >
            {isLoading ? '...' : t('registerBtn')}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-[#D6D6D2] text-center">
          <p className="text-xs text-[#5C5C5C]">
            {t('haveAccountText')}{' '}
            <Link
              href="/login"
              className="font-bold text-[#C42126] hover:underline inline-flex items-center gap-1 ml-1"
            >
              <span>{t('loginNowLink')}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
