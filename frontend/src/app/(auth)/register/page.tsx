'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const { t } = useLanguage();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await register(name, email, password);
      router.push('/onboarding');
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
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

        <form onSubmit={handleSubmit} className="space-y-4 pt-5">
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
            <label className="block text-xs font-semibold text-[#333333] mb-1.5">
              {t('passwordMinLength')}
            </label>
            <input
              type="password"
              required
              minLength={6}
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
