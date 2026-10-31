'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { Lock, Mail, User, ArrowUpRight, ArrowRight } from 'lucide-react';

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
    <div className="relative min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-10 overflow-hidden">
      {/* Ambient Radial Volt Spotlight */}
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[680px] h-[680px] volt-spotlight opacity-85 z-0" />

      <div className="relative z-10 w-full max-w-[460px] space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2.5">
          <div className="w-16 h-16 rounded-2xl bg-[#141C0F] border border-[#C8F135]/40 mx-auto flex items-center justify-center shadow-[0_0_30px_rgba(200,241,53,0.18)]">
            <svg
              width="34"
              height="30"
              viewBox="0 0 36 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M2 4H10.5L18 20.5L25.5 4H34L20.5 30H15.5L2 4Z" fill="#C8F135" />
              <path d="M12.5 4H23.5L18 15L12.5 4Z" fill="#84B816" />
            </svg>
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#192310] border border-[#C8F135]/30 text-[10px] font-extrabold tracking-[0.16em] text-[#C8F135] uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C8F135]" />
              <span>NEW ATHLETE ONBOARDING</span>
            </div>
            <h1 className="font-display font-black text-4xl sm:text-5xl text-white uppercase tracking-tight leading-none pt-1">
              {t('registerTitle')}
            </h1>
            <p className="text-xs sm:text-sm text-[#9BA394] font-medium max-w-sm mx-auto">
              {t('registerSubtitle')}
            </p>
          </div>
        </div>

        {/* Main Register Form Card */}
        <form
          onSubmit={handleSubmit}
          className="glass-hud rounded-3xl p-6 sm:p-7 space-y-5 border border-white/14"
        >
          {errorMsg && (
            <div className="bg-rose-500/15 border border-rose-500/40 rounded-2xl p-3.5 text-xs font-bold text-rose-300">
              {errorMsg}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-[#C2C9BC]">
              {t('fullNameLabel')}
            </label>
            <div className="relative group">
              <User className="w-5 h-5 text-[#7E8777] group-focus-within:text-[#C8F135] transition-colors absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Walker"
                className="w-full min-h-[54px] pl-12 pr-4 bg-[#0A0E07]/90 border border-white/15 rounded-2xl text-white placeholder:text-[#5E6658] text-sm font-semibold focus:outline-none focus:border-[#C8F135] focus:ring-2 focus:ring-[#C8F135]/20 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-[#C2C9BC]">
              {t('emailLabel')}
            </label>
            <div className="relative group">
              <Mail className="w-5 h-5 text-[#7E8777] group-focus-within:text-[#C8F135] transition-colors absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="athlete@example.com"
                className="w-full min-h-[54px] pl-12 pr-4 bg-[#0A0E07]/90 border border-white/15 rounded-2xl text-white placeholder:text-[#5E6658] text-sm font-semibold focus:outline-none focus:border-[#C8F135] focus:ring-2 focus:ring-[#C8F135]/20 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-[#C2C9BC]">
              {t('passwordMinLength')}
            </label>
            <div className="relative group">
              <Lock className="w-5 h-5 text-[#7E8777] group-focus-within:text-[#C8F135] transition-colors absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full min-h-[54px] pl-12 pr-4 bg-[#0A0E07]/90 border border-white/15 rounded-2xl text-white placeholder:text-[#5E6658] text-sm font-semibold focus:outline-none focus:border-[#C8F135] focus:ring-2 focus:ring-[#C8F135]/20 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full volt-pill-btn rounded-2xl pl-6 pr-2.5 py-2.5 flex items-center justify-between font-extrabold text-sm tracking-wider uppercase cursor-pointer disabled:opacity-50"
          >
            <span>{isLoading ? '...' : t('registerBtn')}</span>
            <span className="w-10 h-10 rounded-xl bg-[#0B0F07] text-[#C8F135] flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
            </span>
          </button>
        </form>

        {/* Bottom Switch to Login */}
        <div className="text-center pt-1">
          <p className="text-xs sm:text-sm text-[#9BA394] font-medium">
            {t('haveAccountText')}{' '}
            <Link
              href="/login"
              className="font-extrabold text-[#C8F135] hover:text-[#D6F858] inline-flex items-center gap-1 hover:underline ml-1"
            >
              <span>{t('loginNowLink')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
