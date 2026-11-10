'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { useDataCache } from '../../../context/DataCacheContext';
import { ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useLanguage();
  const { prewarmAllTabs } = useDataCache();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await login(email, password);
      prewarmAllTabs();
      router.push('/');
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await login(demoEmail, 'password123');
      prewarmAllTabs();
      router.push('/');
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-10">
      {/* SINGLE-LAYER EDITORIAL AUTH SURFACE (Zero nested cards!) */}
      <div className="w-full max-w-[440px] bento-tile p-7 sm:p-8">
        <h1 className="font-display text-[38px] font-extrabold text-[#333333] leading-none">
          {t('loginBtn')} FITVANT
        </h1>
        <p className="text-xs text-[#5C5C5C] mt-1.5 pb-5 border-b border-[#D6D6D2]">
          {t('loginSubtitle')}
        </p>

        {errorMsg && (
          <div className="mt-4 bg-[#FDE8E9] border border-[#C42126]/30 rounded-lg p-3 text-xs font-semibold text-[#C42126]">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-5">
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
            <label className="block text-xs font-semibold text-[#333333] mb-1.5">
              {t('passwordLabel')}
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#FFFFFF] border border-[#D6D6D2] text-sm text-[#333333] placeholder:text-[#5C5C5C]/60 focus:outline-none focus:border-[#C42126]"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-lg btn-cta-red text-xs font-semibold uppercase tracking-wider cursor-pointer disabled:opacity-50"
          >
            {isLoading ? '...' : t('loginBtn')}
          </button>
        </form>

        {/* Flush 1px Hairline Footer for 1-Tap Demo Accounts (Replaces the nested Demo Accounts Card!) */}
        <div className="mt-6 pt-5 border-t border-[#D6D6D2]">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#5C5C5C] mb-2.5">
            {t('demoAccountsTitle')} (1-Tap)
          </div>
          <div className="divide-y divide-[#D6D6D2] text-xs">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleDemoLogin('minh.fit@example.com')}
              className="w-full py-2.5 flex items-center justify-between text-left hover:text-[#C42126] transition-colors cursor-pointer"
            >
              <div>
                <span className="font-bold text-[#333333]">Minh Hoàng</span>
                <span className="text-[#5C5C5C] ml-1.5">• L4 • Co-op Active</span>
              </div>
              <span className="font-semibold text-[#C42126]">→ {t('oneTapLogin')}</span>
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleDemoLogin('lan.athlete@example.com')}
              className="w-full py-2.5 flex items-center justify-between text-left hover:text-[#C42126] transition-colors cursor-pointer"
            >
              <div>
                <span className="font-bold text-[#333333]">Lan Phương</span>
                <span className="text-[#5C5C5C] ml-1.5">• L5 • Wrist Injury Filter</span>
              </div>
              <span className="font-semibold text-[#C42126]">→ {t('oneTapLogin')}</span>
            </button>
          </div>
        </div>

        {/* Switch to Register */}
        <div className="mt-5 pt-4 border-t border-[#D6D6D2] text-center">
          <p className="text-xs text-[#5C5C5C]">
            {t('noAccountText')}{' '}
            <Link
              href="/register"
              className="font-bold text-[#C42126] hover:underline inline-flex items-center gap-1 ml-1"
            >
              <span>{t('registerNewLink')}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
