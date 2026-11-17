'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../context/LanguageContext';
import {
  Dumbbell,
  Utensils,
  Activity,
  Users,
  Target,
  Zap,
  Sparkles,
  Shield,
} from 'lucide-react';

export function GuestLandingView() {
  const { language, t } = useLanguage();
  const [sprintBpm, setSprintBpm] = useState(false);

  return (
    <div className="w-full space-y-20 pb-16 overflow-x-hidden">
      {/* 1. FITVANT OPEN HERO STAGE + 3 BOTTOM BENTO TILES */}
      <section id="hero" className="relative w-full pt-6">
        <div className="max-w-[1220px] mx-auto px-5 sm:px-8">
          {/* MAIN 3-ZONE OPEN HERO STAGE (Zero outer card, central photo removed per user request) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[400px] relative">
            {/* LEFT ZONE (6 Cols): Pure Monumental Typography + Unboxed 4-Item Feature Strip */}
            <div className="lg:col-span-6 z-10 flex flex-col justify-between">
              <div>
                <h1 className="font-display text-[68px] sm:text-[84px] font-extrabold text-[#333333] tracking-tight leading-[0.9] mb-4 select-none">
                  {language === 'vi' ? (
                    <>
                      MẠNH MẼ
                      <br />
                      MỖI NGÀY
                    </>
                  ) : (
                    <>
                      STRONGER
                      <br />
                      EVERY DAY
                    </>
                  )}
                </h1>

                <p className="text-[#5C5C5C] text-[15px] leading-relaxed max-w-[400px] mb-7 font-normal">
                  {t('heroDescription')}
                </p>

                {/* Dual CTA Buttons */}
                <div className="flex flex-wrap items-center gap-3.5 mb-12">
                  <Link
                    href="/register"
                    className="px-7 py-3.5 rounded-lg btn-cta-red font-semibold text-sm cursor-pointer"
                  >
                    {language === 'vi' ? 'Bắt đầu ngay' : 'Get Started'}
                  </Link>

                  <Link
                    href="/workout"
                    className="px-6 py-3.5 rounded-lg btn-outline-graphite font-semibold text-sm flex items-center gap-2.5 cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5 text-[#C42126]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    <span>{t('exploreWorkoutsBtn')}</span>
                  </Link>
                </div>
              </div>

              {/* 4-ITEM FEATURE STRIP ON OPEN CANVAS (Bare vector icons + 1px vertical hairlines #D6D6D2 — ZERO boxes!) */}
              <div className="pt-4 border-t border-[#D6D6D2] grid grid-cols-2 sm:grid-cols-4 gap-y-4">
                <Link
                  href="/workout"
                  className="flex items-center gap-2.5 pr-3 sm:border-r sm:border-[#D6D6D2] group"
                >
                  <Dumbbell className="w-4 h-4 text-[#C42126] shrink-0" />
                  <span className="text-[11px] leading-[1.25] font-medium text-[#5C5C5C] group-hover:text-[#333333]">
                    {language === 'vi' ? 'Giáo án' : 'Personalized'}
                    <br />
                    <strong className="font-semibold text-[#333333]">
                      {language === 'vi' ? 'Cá nhân hóa' : 'Workouts'}
                    </strong>
                  </span>
                </Link>

                <Link
                  href="/register"
                  className="flex items-center gap-2.5 sm:px-3 sm:border-r sm:border-[#D6D6D2] group"
                >
                  <Utensils className="w-4 h-4 text-[#C42126] shrink-0" />
                  <span className="text-[11px] leading-[1.25] font-medium text-[#5C5C5C] group-hover:text-[#333333]">
                    {language === 'vi' ? 'Kế hoạch' : 'Nutrition'}
                    <br />
                    <strong className="font-semibold text-[#333333]">
                      {language === 'vi' ? 'Dinh dưỡng' : 'Plans'}
                    </strong>
                  </span>
                </Link>

                <Link
                  href="/#features"
                  className="flex items-center gap-2.5 pr-3 sm:px-3 sm:border-r sm:border-[#D6D6D2] group"
                >
                  <Activity className="w-4 h-4 text-[#C42126] shrink-0" />
                  <span className="text-[11px] leading-[1.25] font-medium text-[#5C5C5C] group-hover:text-[#333333]">
                    {language === 'vi' ? 'Huấn luyện' : 'Expert'}
                    <br />
                    <strong className="font-semibold text-[#333333]">
                      {language === 'vi' ? 'AI Coach' : 'Coaching'}
                    </strong>
                  </span>
                </Link>

                <Link href="/buddy" className="flex items-center gap-2.5 sm:pl-3 group">
                  <Users className="w-4 h-4 text-[#C42126] shrink-0" />
                  <span className="text-[11px] leading-[1.25] font-medium text-[#5C5C5C] group-hover:text-[#333333]">
                    {language === 'vi' ? 'Theo dõi' : 'Track'}
                    <br />
                    <strong className="font-semibold text-[#333333]">
                      {language === 'vi' ? 'Tiến độ' : 'Progress'}
                    </strong>
                  </span>
                </Link>
              </div>
            </div>

            {/* CENTER ZONE (3 Cols): Architectural Orbital Ring + Interactive Heart Rate HUD */}
            <div className="lg:col-span-3 relative flex items-center justify-center min-h-[280px]">
              {/* Soft Crimson/Ivory Radial Aura (#FDE8E9) */}
              <div className="absolute w-[240px] h-[240px] rounded-full bg-[#FDE8E9]/85 blur-2xl pointer-events-none" />

              {/* 1px Orbital Ring (#D6D6D2) */}
              <div className="orbital-ring absolute w-[230px] h-[230px] sm:w-[250px] sm:h-[250px] pointer-events-none flex items-center justify-between">
                <span className="w-2 h-2 rounded-full bg-[#C42126] -ml-1" />
                <span className="w-2 h-2 rounded-full bg-[#D6D6D2] -mr-1" />
              </div>

              {/* Single-Layer Interactive HEART RATE HUD */}
              <div
                onClick={() => setSprintBpm(!sprintBpm)}
                title={language === 'vi' ? 'Nhấn để mô phỏng nhịp tim' : 'Tap to simulate heart rate'}
                className="hud-glass relative z-20 px-5 py-4 w-[215px] cursor-pointer hover:border-[#C42126] transition-colors select-none"
              >
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#5C5C5C] mb-0.5">
                  HEART RATE
                </div>
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="font-display text-[40px] font-bold text-[#333333] leading-none">
                    {sprintBpm ? '162' : '128'}
                  </span>
                  <span className="text-xs font-semibold text-[#5C5C5C]">BPM</span>
                </div>
                <svg className="w-full h-6 overflow-visible" viewBox="0 0 160 28" fill="none">
                  <path
                    d="M0 16 Q 18 16, 26 10 T 46 18 T 68 6 T 90 22 T 112 10 T 136 16 L 160 14"
                    stroke="#C42126"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] font-medium text-[#5C5C5C]">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      sprintBpm ? 'bg-[#C42126]' : 'bg-[#2E7D32]'
                    }`}
                  />
                  <span>{sprintBpm ? 'Peak Anaerobic' : 'Optimal'}</span>
                </div>
              </div>
            </div>

            {/* RIGHT ZONE (3 Cols): OPEN-CANVAS TELEMETRY */}
            <div className="lg:col-span-3 z-10 flex flex-col justify-center lg:pl-6">
              {/* Metric 1 */}
              <div className="py-4 border-b border-[#D6D6D2]">
                <div className="text-[11px] font-bold uppercase tracking-widest text-[#5C5C5C] mb-1">
                  {language === 'vi' ? 'CALO ĐỐT CHÁY' : 'CALORIES BURNED'}
                </div>
                <div className="font-display text-[54px] font-extrabold text-[#333333] leading-none font-telemetry">
                  2,450
                </div>
                <div className="mt-1.5 text-xs font-semibold text-[#2E7D32] flex items-center gap-1">
                  <span>↗ +18%</span>
                  <span className="text-[#5C5C5C] font-normal">
                    {language === 'vi' ? 'so với tuần trước' : 'from last week'}
                  </span>
                </div>
              </div>

              {/* Metric 2 */}
              <div className="py-4 border-b border-[#D6D6D2]">
                <div className="text-[11px] font-bold uppercase tracking-widest text-[#5C5C5C] mb-1">
                  {language === 'vi' ? 'BUỔI TẬP' : 'WORKOUTS'}
                </div>
                <div className="font-display text-[54px] font-extrabold text-[#333333] leading-none font-telemetry">
                  28
                </div>
                <div className="mt-1.5 text-xs text-[#5C5C5C]">
                  {language === 'vi' ? 'Tháng này' : 'This Month'}
                </div>
              </div>

              {/* Metric 3 */}
              <div className="py-4">
                <div className="text-[11px] font-bold uppercase tracking-widest text-[#5C5C5C] mb-1">
                  {language === 'vi' ? 'CHUỖI NGÀY TẬP' : 'ACTIVE STREAK'}
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="font-display text-[54px] font-extrabold text-[#333333] leading-none font-telemetry">
                    14
                  </span>
                  <svg className="w-7 h-7 text-[#C42126]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z" />
                  </svg>
                </div>
                <div className="mt-1.5 text-xs text-[#5C5C5C]">
                  {language === 'vi' ? 'Ngày liên tiếp' : 'Days Strong'}
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM 3-COLUMN BENTO TILES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
            {/* Tile 1: Workout Video */}
            <Link
              href="/workout"
              className="bento-tile bento-tile-interactive p-5 min-h-[176px] flex flex-col justify-between cursor-pointer group"
            >
              <img
                src="/images/fitvant/card-workout.jpg"
                alt="Full Body Strength"
                loading="lazy"
                decoding="async"
                className="tile-photo-mask absolute right-0 top-0 w-[62%] h-full object-cover object-center pointer-events-none group-hover:scale-105 transition-transform duration-500"
              />
              <div className="relative z-10 max-w-[65%]">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#5C5C5C] mb-2">
                  <span className="w-4 h-4 rounded-full bg-[#C42126] text-[#FFFFFF] inline-flex items-center justify-center text-[8px]">
                    ▶
                  </span>
                  <span>WORKOUT VIDEO</span>
                </div>
                <h3 className="text-[20px] font-bold text-[#333333] leading-snug">
                  {language === 'vi' ? 'Sức Mạnh Toàn Thân' : 'Full Body Strength'}
                </h3>
                <p className="text-xs text-[#5C5C5C] mt-0.5">
                  {language === 'vi' ? '45 Phút • Trung cấp' : '45 Min • Intermediate'}
                </p>
              </div>
              <div className="relative z-10 mt-4">
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg btn-cta-red text-xs font-semibold">
                  {language === 'vi' ? 'Bắt đầu tập' : 'Start Workout'} <span>›</span>
                </span>
              </div>
            </Link>

            {/* Tile 2: Nutrition Plan */}
            <Link
              href="/register"
              className="bento-tile bento-tile-interactive p-5 min-h-[176px] flex flex-col justify-between cursor-pointer group"
            >
              <img
                src="/images/fitvant/card-nutrition.jpg"
                alt="Eat Clean. Feel Lean."
                loading="lazy"
                decoding="async"
                className="tile-photo-mask absolute right-0 top-0 w-[62%] h-full object-cover object-center pointer-events-none group-hover:scale-105 transition-transform duration-500"
              />
              <div className="relative z-10 max-w-[65%]">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#5C5C5C] mb-2">
                  <span className="w-4 h-4 rounded-full bg-[#333333] text-[#FFFFFF] inline-flex items-center justify-center text-[9px]">
                    ✦
                  </span>
                  <span>NUTRITION PLAN</span>
                </div>
                <h3 className="text-[20px] font-bold text-[#333333] leading-snug">
                  {language === 'vi' ? 'Ăn Sạch. Dáng Gọn.' : 'Eat Clean. Feel Lean.'}
                </h3>
                <p className="text-xs text-[#5C5C5C] mt-0.5">
                  {language === 'vi' ? 'Check-in Calo 1 chạm' : 'Custom Meal Guides'}
                </p>
              </div>
              <div className="relative z-10 mt-4">
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#F5F5F0]/95 border border-[#D6D6D2] text-[#333333] text-xs font-semibold group-hover:bg-[#333333] group-hover:text-[#FFFFFF] transition-colors">
                  {language === 'vi' ? 'Xem lộ trình' : 'Explore Meals'} <span>›</span>
                </span>
              </div>
            </Link>

            {/* Tile 3: Community */}
            <Link
              href="/buddy"
              className="bento-tile bento-tile-interactive p-5 min-h-[176px] flex flex-col justify-between cursor-pointer group"
            >
              <img
                src="/images/fitvant/card-community.jpg"
                alt="Stronger Together"
                loading="lazy"
                decoding="async"
                className="tile-photo-mask absolute right-0 top-0 w-[62%] h-full object-cover object-center pointer-events-none group-hover:scale-105 transition-transform duration-500"
              />
              <div className="relative z-10 max-w-[65%]">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#5C5C5C] mb-2">
                  <span className="w-4 h-4 rounded-full bg-[#333333] text-[#FFFFFF] inline-flex items-center justify-center text-[9px]">
                    ●
                  </span>
                  <span>COMMUNITY</span>
                </div>
                <h3 className="text-[20px] font-bold text-[#333333] leading-snug">
                  {language === 'vi' ? 'Đồng Hành Bền Bỉ' : 'Stronger Together'}
                </h3>
                <p className="text-xs text-[#5C5C5C] mt-0.5">
                  {language === 'vi' ? 'Ghép đôi Buddy • Co-op XP' : 'Join 50K+ Members'}
                </p>
              </div>
              <div className="relative z-10 mt-4">
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#F5F5F0]/95 border border-[#D6D6D2] text-[#333333] text-xs font-semibold group-hover:bg-[#333333] group-hover:text-[#FFFFFF] transition-colors">
                  {language === 'vi' ? 'Tham gia ngay' : 'Join Community'} <span>›</span>
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. HOW IT WORKS (#about) — Flattened 3-Column Hairline Grid on Open Canvas */}
      <section id="about" className="max-w-[1220px] mx-auto px-5 sm:px-8 space-y-8 scroll-mt-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#D6D6D2] pb-5">
          <div>
            <h2 className="font-display font-extrabold text-4xl sm:text-5xl text-[#333333] uppercase tracking-tight">
              {t('whyChooseUsTitle')}
            </h2>
          </div>
          <p className="text-sm text-[#5C5C5C] max-w-md">{t('whyChooseUsSubtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#D6D6D2] border-b border-[#D6D6D2] pb-8">
          <div className="py-4 md:py-2 md:pr-8 space-y-2.5">
            <div className="flex items-center justify-between">
              <Target className="w-5 h-5 text-[#C42126]" />
              <span className="font-telemetry font-bold text-2xl text-[#5C5C5C]/50">01</span>
            </div>
            <h3 className="font-display font-bold text-2xl text-[#333333]">{t('step1Title')}</h3>
            <p className="text-sm text-[#5C5C5C] leading-relaxed">{t('step1Desc')}</p>
          </div>

          <div className="py-4 md:py-2 md:px-8 space-y-2.5">
            <div className="flex items-center justify-between">
              <Zap className="w-5 h-5 text-[#C42126]" />
              <span className="font-telemetry font-bold text-2xl text-[#C42126]">02</span>
            </div>
            <h3 className="font-display font-bold text-2xl text-[#333333]">{t('step2Title')}</h3>
            <p className="text-sm text-[#5C5C5C] leading-relaxed">{t('step2Desc')}</p>
          </div>

          <div className="py-4 md:py-2 md:pl-8 space-y-2.5">
            <div className="flex items-center justify-between">
              <Users className="w-5 h-5 text-[#C42126]" />
              <span className="font-telemetry font-bold text-2xl text-[#5C5C5C]/50">03</span>
            </div>
            <h3 className="font-display font-bold text-2xl text-[#333333]">{t('step3Title')}</h3>
            <p className="text-sm text-[#5C5C5C] leading-relaxed">{t('step3Desc')}</p>
          </div>
        </div>
      </section>

      {/* 3. CORE THESIS FEATURES (#features) & SINGLE-LAYER CTA BANNER */}
      <section id="features" className="max-w-[1220px] mx-auto px-5 sm:px-8 space-y-8 scroll-mt-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bento-tile p-6 space-y-2.5">
            <Sparkles className="w-5 h-5 text-[#C42126]" />
            <h4 className="font-display font-bold text-2xl text-[#333333]">{t('feature1Title')}</h4>
            <p className="text-xs text-[#5C5C5C] leading-relaxed">{t('feature1Desc')}</p>
          </div>

          <div className="bento-tile p-6 space-y-2.5">
            <Dumbbell className="w-5 h-5 text-[#C42126]" />
            <h4 className="font-display font-bold text-2xl text-[#333333]">{t('feature2Title')}</h4>
            <p className="text-xs text-[#5C5C5C] leading-relaxed">{t('feature2Desc')}</p>
          </div>

          <div className="bento-tile p-6 space-y-2.5">
            <Shield className="w-5 h-5 text-[#C42126]" />
            <h4 className="font-display font-bold text-2xl text-[#333333]">{t('feature3Title')}</h4>
            <p className="text-xs text-[#5C5C5C] leading-relaxed">{t('feature3Desc')}</p>
          </div>
        </div>

        <div className="bento-tile p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <h3 className="font-display font-extrabold text-3xl md:text-5xl text-[#333333] uppercase leading-none">
              {t('ctaBannerTitle')}
            </h3>
            <p className="text-sm text-[#5C5C5C]">{t('ctaBannerSubtitle')}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/register"
              className="px-6 py-3.5 rounded-lg btn-cta-red font-semibold text-xs uppercase tracking-wider"
            >
              {t('startJourneyFreeBtn')}
            </Link>
            <Link
              href="/login"
              className="px-6 py-3.5 rounded-lg bg-[#F5F5F0] border border-[#D6D6D2] hover:border-[#333333] text-[#333333] font-semibold text-xs uppercase tracking-wider transition-colors"
            >
              {t('alreadyHaveAccountBtn')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
