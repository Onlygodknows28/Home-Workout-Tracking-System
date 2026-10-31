'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useDataCache, CACHE_KEYS } from '../context/DataCacheContext';
import { ApiClient } from '../lib/api';
import { getExerciseName, getWorkoutPlanTitle, getAiExplanation } from '../lib/catalogTranslations';
import { GiantButton } from '../components/ui/GiantButton';
import { CoopMissionCard } from '../components/buddy/CoopMissionCard';
import { GiftFreezeModal } from '../components/buddy/GiftFreezeModal';
import {
  Dumbbell,
  Flame,
  Coins,
  Sparkles,
  CheckCircle2,
  Utensils,
  Shield,
  Users,
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  Zap,
  Target,
  Activity,
  Heart,
} from 'lucide-react';

export default function HomePage() {
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth();
  const { language, t } = useLanguage();
  const { getCache, setCache, isFresh, invalidate, prewarmAllTabs } = useDataCache();
  const router = useRouter();

  const [todayStatus, setTodayStatus] = useState<any>(() => getCache(CACHE_KEYS.TODAY_STATUS));
  const [recommendation, setRecommendation] = useState<any>(() => getCache(CACHE_KEYS.RECOMMENDATION));
  const [buddyData, setBuddyData] = useState<any>(() => getCache(CACHE_KEYS.BUDDY_DATA));
  const [checkingIn, setCheckingIn] = useState(false);
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);

  const loadHomeData = async (forceRefresh = false) => {
    if (!isAuthenticated) return;

    // If all 3 home cache entries are fresh, sync state from memory in 0ms and skip network calls
    if (
      !forceRefresh &&
      isFresh(CACHE_KEYS.TODAY_STATUS, 30000) &&
      isFresh(CACHE_KEYS.RECOMMENDATION, 60000) &&
      isFresh(CACHE_KEYS.BUDDY_DATA, 45000)
    ) {
      setTodayStatus(getCache(CACHE_KEYS.TODAY_STATUS));
      setRecommendation(getCache(CACHE_KEYS.RECOMMENDATION));
      setBuddyData(getCache(CACHE_KEYS.BUDDY_DATA));
      prewarmAllTabs();
      return;
    }

    try {
      const [statusRes, recRes, buddyRes] = await Promise.all([
        ApiClient.getTodayStatus(),
        ApiClient.getDailyRecommendation(),
        ApiClient.getMyBuddy(),
      ]);
      setTodayStatus(statusRes);
      setRecommendation(recRes);
      setBuddyData(buddyRes);
      setCache(CACHE_KEYS.TODAY_STATUS, statusRes);
      setCache(CACHE_KEYS.RECOMMENDATION, recRes);
      setCache(CACHE_KEYS.BUDDY_DATA, buddyRes);
      prewarmAllTabs();
    } catch {
      // Silently ignore unauthenticated or initial load errors
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadHomeData(false);
    }
  }, [isAuthenticated]);

  const handleNutritionCheckIn = async (
    calorieState: 'DEFICIT' | 'MAINTENANCE' | 'SURPLUS',
  ) => {
    if (checkingIn) return;
    setCheckingIn(true);
    try {
      await ApiClient.submitCheckin({
        calorieType: calorieState,
        energyLevel: 4,
      });
      invalidate(CACHE_KEYS.TODAY_STATUS);
      invalidate('profile_');
      await refreshUser();
      await loadHomeData(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCheckingIn(false);
    }
  };

  const handleStartWorkout = () => {
    router.push('/workout');
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#C8F135] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // =========================================================================
  // CASE 1: GUEST LANDING PAGE (FITVANT ATHLETIC DARK & VOLT LIME SYSTEM)
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className="w-full space-y-20 pb-16 overflow-x-hidden">
        {/* 1. FITVANT 3-ZONE HERO SECTION + BENTO CARDS */}
        <section id="hero" className="relative w-full pt-4 pb-6">
          {/* Ambient Background Glows */}
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[900px] h-[640px] volt-spotlight opacity-90 z-0" />
          <div
            className="pointer-events-none absolute top-[18%] right-[-8%] w-[480px] h-[480px] rounded-full opacity-25 z-0"
            style={{
              background:
                'radial-gradient(circle, rgba(200,241,53,0.32) 0%, transparent 70%)',
            }}
          />

          <div className="relative z-10 max-w-[1280px] mx-auto px-4 sm:px-8">
            {/* MAIN 3-ZONE HERO STAGE */}
            <div className="relative grid grid-cols-1 lg:grid-cols-12 items-center min-h-[540px] pt-2 pb-8 gap-8 lg:gap-0">
              {/* LEFT ZONE (5 Cols): Headline + CTA + 4-Icon Strip */}
              <div className="lg:col-span-5 z-20 space-y-5">
                {/* Pill Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#192310]/90 border border-[#C8F135]/35">
                  <span className="w-2 h-2 rounded-full bg-[#C8F135] shadow-[0_0_8px_#C8F135]" />
                  <span className="text-[11px] font-extrabold tracking-[0.14em] text-[#C8F135] uppercase">
                    {language === 'vi' ? 'TẬP THÔNG MINH HƠN' : 'TRAIN SMARTER'}
                  </span>
                </div>

                {/* Stacked Condensed Display Headline */}
                <h1 className="font-display font-black text-[68px] sm:text-[84px] xl:text-[94px] leading-[0.88] tracking-tight uppercase select-none">
                  <span className="block text-white drop-shadow-[0_6px_24px_rgba(0,0,0,0.6)]">
                    {language === 'vi' ? 'MẠNH MẼ' : 'STRONGER'}
                  </span>
                  <span className="block text-[#C8F135] drop-shadow-[0_0_28px_rgba(200,241,53,0.22)]">
                    {language === 'vi' ? 'MỖI NGÀY' : 'EVERY DAY'}
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="text-[15px] text-[#B4BDAD] font-medium max-w-[390px] leading-relaxed pt-1">
                  {t('heroDescription')}
                </p>

                {/* Primary Volt Pill CTA + Secondary Explore Link */}
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <Link
                    href="/register"
                    className="volt-pill-btn rounded-full pl-7 pr-2 py-2 inline-flex items-center gap-4 font-extrabold text-[13px] tracking-wider uppercase cursor-pointer"
                  >
                    <span>
                      {language === 'vi' ? 'BẮT ĐẦU HÀNH TRÌNH' : 'START YOUR JOURNEY'}
                    </span>
                    <span className="w-9 h-9 rounded-full bg-[#0B0F07] text-[#C8F135] flex items-center justify-center">
                      <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                    </span>
                  </Link>

                  <Link
                    href="/workout"
                    className="px-5 py-3.5 rounded-full bg-[#141C0F] hover:bg-[#1C2715] text-white/90 hover:text-white border border-white/12 text-xs font-extrabold uppercase tracking-wider transition-colors"
                  >
                    {t('exploreWorkoutsBtn')}
                  </Link>
                </div>

                {/* 4-Icon Quick Feature Strip (Matching FITVANT Reference) */}
                <div className="pt-5 flex items-center gap-5 sm:gap-6 border-t border-white/10 max-w-[420px]">
                  <Link href="/workout" className="flex items-center gap-2 group cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-[#1A2412] border border-white/10 flex items-center justify-center text-[#C8F135] group-hover:bg-[#C8F135] group-hover:text-[#0B0F07] transition-colors">
                      <Dumbbell className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-[#C2C9BC] group-hover:text-white">
                      {language === 'vi' ? 'Bài tập' : 'Workouts'}
                    </span>
                  </Link>

                  <Link href="/register" className="flex items-center gap-2 group cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-[#1A2412] border border-white/10 flex items-center justify-center text-[#C8F135] group-hover:bg-[#C8F135] group-hover:text-[#0B0F07] transition-colors">
                      <Utensils className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-[#C2C9BC] group-hover:text-white">
                      {language === 'vi' ? 'Dinh dưỡng' : 'Nutrition'}
                    </span>
                  </Link>

                  <Link href="/#features" className="flex items-center gap-2 group cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-[#1A2412] border border-white/10 flex items-center justify-center text-[#C8F135] group-hover:bg-[#C8F135] group-hover:text-[#0B0F07] transition-colors">
                      <Activity className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-[#C2C9BC] group-hover:text-white">
                      {language === 'vi' ? 'Phân tích' : 'Analytics'}
                    </span>
                  </Link>

                  <Link href="/buddy" className="flex items-center gap-2 group cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-[#1A2412] border border-white/10 flex items-center justify-center text-[#C8F135] group-hover:bg-[#C8F135] group-hover:text-[#0B0F07] transition-colors">
                      <Users className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-[#C2C9BC] group-hover:text-white">
                      {language === 'vi' ? 'Cộng đồng' : 'Community'}
                    </span>
                  </Link>
                </div>
              </div>

              {/* CENTER ZONE (5 Cols): Athlete Cutout + Orbital Ring + Frosted Glass Heart Rate HUD */}
              <div className="lg:col-span-5 relative flex items-center justify-center min-h-[450px] sm:min-h-[500px] z-10">
                {/* Thin SVG Orbital Ring with Glowing Nodes */}
                <svg
                  className="pointer-events-none absolute w-[400px] sm:w-[460px] h-[400px] sm:h-[460px] z-0"
                  viewBox="0 0 460 460"
                  fill="none"
                >
                  <circle
                    cx="230"
                    cy="225"
                    r="185"
                    stroke="url(#orbitGrad)"
                    strokeWidth="1.2"
                    strokeDasharray="3 0"
                  />
                  <circle
                    cx="230"
                    cy="225"
                    r="212"
                    stroke="rgba(200,241,53,0.14)"
                    strokeWidth="1"
                  />
                  <circle cx="88" cy="108" r="3.5" fill="#C8F135" />
                  <circle cx="394" cy="140" r="3" fill="#C8F135" fillOpacity="0.7" />
                  <defs>
                    <linearGradient id="orbitGrad" x1="40" y1="40" x2="420" y2="410" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#C8F135" stopOpacity="0.55" />
                      <stop offset="50%" stopColor="#C8F135" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#C8F135" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Central Athlete Photograph */}
                <div className="relative z-10 w-[340px] sm:w-[390px] h-[440px] sm:h-[490px] flex items-end justify-center overflow-hidden">
                  <img
                    src="/images/fitvant/hero-athlete.jpg"
                    alt="FITVANT Athlete"
                    className="w-full h-full object-cover object-top hero-photo-mask select-none pointer-events-none scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0A0E07] via-[#0A0E07]/70 to-transparent" />
                </div>

                {/* Overlapping Frosted Glass HUD: HEART RATE 128 BPM */}
                <div className="glass-hud absolute bottom-6 left-2 sm:left-0 z-30 rounded-2xl px-4 py-3.5 w-[215px]">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold tracking-[0.14em] text-[#A9B2A1] uppercase block">
                        HEART RATE
                      </span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="font-telemetry font-black text-3xl text-white">128</span>
                        <span className="text-xs font-bold text-[#A9B2A1] uppercase">BPM</span>
                      </div>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-[#C8F135]/15 border border-[#C8F135]/40 flex items-center justify-center text-[#C8F135]">
                      <Heart className="w-4 h-4 fill-[#C8F135] animate-pulse" />
                    </div>
                  </div>
                  {/* Equalizer Bars */}
                  <div className="mt-2.5 flex items-end gap-1.5 h-3">
                    <span className="w-3.5 h-1.5 rounded-full bg-[#C8F135]" />
                    <span className="w-3.5 h-2.5 rounded-full bg-[#C8F135]" />
                    <span className="w-3.5 h-2 rounded-full bg-[#C8F135]" />
                    <span className="w-3.5 h-3 rounded-full bg-[#C8F135]" />
                    <span className="w-3.5 h-1.5 rounded-full bg-white/20" />
                    <span className="w-3.5 h-1.5 rounded-full bg-white/20" />
                    <span className="w-3.5 h-1.5 rounded-full bg-white/20" />
                  </div>
                </div>
              </div>

              {/* RIGHT ZONE (2 Cols): Vertical Telemetry Stack */}
              <div className="lg:col-span-2 z-20 flex lg:flex-col justify-between lg:justify-center gap-6 lg:pl-4 border-t lg:border-t-0 pt-6 lg:pt-0 border-white/10">
                <div>
                  <span className="text-[10px] font-bold tracking-[0.15em] text-[#9BA394] uppercase block">
                    {language === 'vi' ? 'CALO ĐỐT CHÁY' : 'CALORIES BURNED'}
                  </span>
                  <div className="font-telemetry font-black text-4xl sm:text-[44px] text-[#C8F135] leading-none mt-1">
                    2,450
                  </div>
                  <span className="text-[11px] text-[#8E9688] font-medium">
                    {language === 'vi' ? 'Mục tiêu tuần này' : 'This week’s goal'}
                  </span>
                </div>

                <div className="hidden lg:block h-[1px] w-full bg-white/10" />

                <div>
                  <span className="text-[10px] font-bold tracking-[0.15em] text-[#9BA394] uppercase block">
                    {language === 'vi' ? 'BUỔI TẬP' : 'WORKOUTS'}
                  </span>
                  <div className="font-telemetry font-black text-4xl sm:text-[44px] text-white leading-none mt-1">
                    28
                  </div>
                  <span className="text-[11px] text-[#8E9688] font-medium">
                    {language === 'vi' ? 'Hoàn thành tháng này' : 'Completed this month'}
                  </span>
                </div>

                <div className="hidden lg:block h-[1px] w-full bg-white/10" />

                <div>
                  <span className="text-[10px] font-bold tracking-[0.15em] text-[#9BA394] uppercase block">
                    {language === 'vi' ? 'CHUỖI NGÀY TẬP' : 'ACTIVE STREAK'}
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-telemetry font-black text-4xl sm:text-[44px] text-[#C8F135] leading-none">
                      14
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#C8F135]/20 border border-[#C8F135]/40 text-[#C8F135] text-[10px] font-extrabold uppercase">
                      {language === 'vi' ? 'NGÀY' : 'DAYS'}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#8E9688] font-medium">
                    {language === 'vi' ? 'Kỷ lục cá nhân' : 'Personal best'}
                  </span>
                </div>
              </div>
            </div>

            {/* 3 BOTTOM PHOTOGRAPHIC BENTO FEATURE CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
              {/* Card 1: WORKOUT */}
              <Link
                href="/workout"
                className="feature-card relative rounded-2xl p-5 overflow-hidden flex items-center justify-between min-h-[148px] cursor-pointer group"
              >
                <div className="relative z-20 space-y-1.5 max-w-[58%]">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#C8F135] text-[#0B0F07] text-[10px] font-extrabold tracking-wider uppercase">
                    WORKOUT
                  </span>
                  <h3 className="text-[17px] font-extrabold text-white leading-tight pt-1">
                    {language === 'vi' ? 'Sức Mạnh Toàn Thân' : 'Full Body Strength'}
                  </h3>
                  <p className="text-xs text-[#9BA394]">
                    {language === 'vi' ? 'Tăng cơ • Đốt mỡ tại nhà' : 'Build Muscle. Burn Fat.'}
                  </p>
                  <div className="pt-1.5 inline-flex items-center gap-1.5 text-xs font-bold text-[#C8F135] group-hover:translate-x-1 transition-transform">
                    <span>{language === 'vi' ? 'Khám phá' : 'Explore'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="absolute right-0 top-0 bottom-0 w-[52%] z-10 pointer-events-none">
                  <img
                    src="/images/fitvant/card-workout.jpg"
                    alt="Workout"
                    className="w-full h-full object-cover object-center opacity-90 group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#171F10] via-[#171F10]/55 to-transparent" />
                </div>
              </Link>

              {/* Card 2: NUTRITION */}
              <Link
                href="/register"
                className="feature-card relative rounded-2xl p-5 overflow-hidden flex items-center justify-between min-h-[148px] cursor-pointer group"
              >
                <div className="relative z-20 space-y-1.5 max-w-[58%]">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#1C2812] border border-[#C8F135]/60 text-[#C8F135] text-[10px] font-extrabold tracking-wider uppercase">
                    NUTRITION
                  </span>
                  <h3 className="text-[17px] font-extrabold text-white leading-tight pt-1">
                    {language === 'vi' ? 'Ăn Sạch. Dáng Gọn.' : 'Eat Clean. Feel Lean.'}
                  </h3>
                  <p className="text-xs text-[#9BA394]">
                    {language === 'vi' ? 'Check-in Calo 1 chạm' : 'Smart Meal Plans'}
                  </p>
                  <div className="pt-1.5 inline-flex items-center gap-1.5 text-xs font-bold text-[#C8F135] group-hover:translate-x-1 transition-transform">
                    <span>{language === 'vi' ? 'Xem lộ trình' : 'View Plans'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="absolute right-0 top-0 bottom-0 w-[52%] z-10 pointer-events-none">
                  <img
                    src="/images/fitvant/card-nutrition.jpg"
                    alt="Nutrition"
                    className="w-full h-full object-cover object-center opacity-90 group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#171F10] via-[#171F10]/55 to-transparent" />
                </div>
              </Link>

              {/* Card 3: COMMUNITY */}
              <Link
                href="/buddy"
                className="feature-card relative rounded-2xl p-5 overflow-hidden flex items-center justify-between min-h-[148px] cursor-pointer group"
              >
                <div className="relative z-20 space-y-1.5 max-w-[58%]">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/10 border border-white/25 text-white text-[10px] font-extrabold tracking-wider uppercase">
                    COMMUNITY
                  </span>
                  <h3 className="text-[17px] font-extrabold text-white leading-tight pt-1">
                    {language === 'vi' ? 'Đồng Hành Bền Bỉ' : 'Stronger Together'}
                  </h3>
                  <p className="text-xs text-[#9BA394]">
                    {language === 'vi' ? 'Ghép đôi Buddy • Co-op XP' : 'Join Challenges'}
                  </p>
                  <div className="pt-1.5 inline-flex items-center gap-1.5 text-xs font-bold text-[#C8F135] group-hover:translate-x-1 transition-transform">
                    <span>{language === 'vi' ? 'Tham gia ngay' : 'Join Now'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="absolute right-0 top-0 bottom-0 w-[52%] z-10 pointer-events-none">
                  <img
                    src="/images/fitvant/card-community.jpg"
                    alt="Community"
                    className="w-full h-full object-cover object-center opacity-90 group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#171F10] via-[#171F10]/55 to-transparent" />
                </div>
              </Link>
            </div>

            {/* TRUSTED BY 100,000+ ATHLETES BAR */}
            <div className="pt-8 pb-2 flex items-center justify-center gap-4">
              <div className="h-[1px] flex-1 max-w-[200px] bg-gradient-to-r from-transparent to-white/15" />
              <p className="text-[11px] font-bold tracking-[0.22em] text-[#8E9688] uppercase text-center">
                {language === 'vi' ? 'ĐƯỢC TIN DÙNG BỞI ' : 'TRUSTED BY '}
                <span className="text-[#C8F135] font-extrabold">100,000+</span>
                {language === 'vi' ? ' VẬN ĐỘNG VIÊN TOÀN CẦU' : ' ATHLETES WORLDWIDE'}
              </p>
              <div className="h-[1px] flex-1 max-w-[200px] bg-gradient-to-l from-transparent to-white/15" />
            </div>
          </div>
        </section>

        {/* 2. HOW IT WORKS & WHY CHOOSE FITVANT (#about) */}
        <section id="about" className="max-w-[1280px] mx-auto px-4 sm:px-8 space-y-10 scroll-mt-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-extrabold text-[#C8F135] uppercase tracking-[0.16em]">
                <span className="w-2 h-2 rounded-full bg-[#C8F135]" />
                {t('howItWorksTitle')}
              </span>
              <h2 className="font-display font-black text-4xl sm:text-5xl text-white uppercase tracking-tight mt-2">
                {t('whyChooseUsTitle')}
              </h2>
            </div>
            <p className="text-sm text-[#9BA394] max-w-md">
              {t('whyChooseUsSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 01 */}
            <div className="feature-card rounded-3xl p-7 space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-[#C8F135]/15 border border-[#C8F135]/35 flex items-center justify-center text-[#C8F135]">
                  <Target className="w-6 h-6" />
                </div>
                <span className="font-telemetry font-black text-4xl text-white/15">01</span>
              </div>
              <h3 className="font-display font-bold text-2xl text-white tracking-wide">
                {t('step1Title')}
              </h3>
              <p className="text-sm text-[#9BA394] leading-relaxed">
                {t('step1Desc')}
              </p>
            </div>

            {/* Step 02 (Highlighted Volt Border) */}
            <div className="feature-card rounded-3xl p-7 space-y-4 relative overflow-hidden border-[#C8F135]/45 shadow-[0_0_30px_rgba(200,241,53,0.08)]">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-[#C8F135] flex items-center justify-center text-[#0B0F07]">
                  <Zap className="w-6 h-6" />
                </div>
                <span className="font-telemetry font-black text-4xl text-[#C8F135]/30">02</span>
              </div>
              <h3 className="font-display font-bold text-2xl text-[#C8F135] tracking-wide">
                {t('step2Title')}
              </h3>
              <p className="text-sm text-[#C2C9BC] leading-relaxed">
                {t('step2Desc')}
              </p>
            </div>

            {/* Step 03 */}
            <div className="feature-card rounded-3xl p-7 space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-[#C8F135]/15 border border-[#C8F135]/35 flex items-center justify-center text-[#C8F135]">
                  <Users className="w-6 h-6" />
                </div>
                <span className="font-telemetry font-black text-4xl text-white/15">03</span>
              </div>
              <h3 className="font-display font-bold text-2xl text-white tracking-wide">
                {t('step3Title')}
              </h3>
              <p className="text-sm text-[#9BA394] leading-relaxed">
                {t('step3Desc')}
              </p>
            </div>
          </div>
        </section>

        {/* 3. CORE THESIS FEATURES (#features) & CTA BANNER */}
        <section id="features" className="max-w-[1280px] mx-auto px-4 sm:px-8 space-y-8 scroll-mt-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-hud rounded-3xl p-7 space-y-3 border border-white/12 hover:border-[#C8F135]/40 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-[#C8F135]/15 border border-[#C8F135]/30 text-[#C8F135] flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="font-display font-bold text-2xl text-white tracking-wide">
                {t('feature1Title')}
              </h4>
              <p className="text-xs text-[#9BA394] leading-relaxed">
                {t('feature1Desc')}
              </p>
            </div>

            <div className="glass-hud rounded-3xl p-7 space-y-3 border border-white/12 hover:border-[#C8F135]/40 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-[#C8F135]/15 border border-[#C8F135]/30 text-[#C8F135] flex items-center justify-center">
                <Dumbbell className="w-6 h-6" />
              </div>
              <h4 className="font-display font-bold text-2xl text-white tracking-wide">
                {t('feature2Title')}
              </h4>
              <p className="text-xs text-[#9BA394] leading-relaxed">
                {t('feature2Desc')}
              </p>
            </div>

            <div className="glass-hud rounded-3xl p-7 space-y-3 border border-white/12 hover:border-[#C8F135]/40 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-[#C8F135]/15 border border-[#C8F135]/30 text-[#C8F135] flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <h4 className="font-display font-bold text-2xl text-white tracking-wide">
                {t('feature3Title')}
              </h4>
              <p className="text-xs text-[#9BA394] leading-relaxed">
                {t('feature3Desc')}
              </p>
            </div>
          </div>

          {/* Bottom High-Voltage CTA Banner */}
          <div className="feature-card rounded-3xl p-8 md:p-12 border border-[#C8F135]/35 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="pointer-events-none absolute -right-20 -bottom-20 w-80 h-80 volt-spotlight opacity-60" />
            <div className="space-y-2 max-w-xl relative z-10">
              <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#C8F135]">
                FITVANT PERFORMANCE SYSTEM
              </span>
              <h3 className="font-display font-black text-3xl md:text-5xl text-white uppercase leading-none">
                {t('ctaBannerTitle')}
              </h3>
              <p className="text-sm text-[#9BA394]">
                {t('ctaBannerSubtitle')}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0 relative z-10">
              <Link
                href="/register"
                className="volt-pill-btn rounded-full pl-6 pr-2 py-2 inline-flex items-center gap-3 font-extrabold text-xs tracking-wider uppercase"
              >
                <span>{t('startJourneyFreeBtn')}</span>
                <span className="w-8 h-8 rounded-full bg-[#0B0F07] text-[#C8F135] flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                </span>
              </Link>
              <Link
                href="/login"
                className="px-6 py-3.5 rounded-full bg-[#141C0F] hover:bg-[#1C2715] text-white border border-white/15 font-extrabold text-xs uppercase tracking-wider transition-colors"
              >
                {t('alreadyHaveAccountBtn')}
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // =========================================================================
  // CASE 2: AUTHENTICATED USER — FITVANT PERSONALIZED AI DASHBOARD
  // =========================================================================
  const levelInfo = todayStatus?.levelInfo || {
    level: user?.level || 1,
    totalXp: user?.xp || 0,
    progressPercent: 0,
    xpRemainingToNextLevel: 100,
  };

  const rawGoal = user?.profile?.primaryGoal || 'MAINTENANCE';
  const goalDisplay =
    rawGoal === 'FAT_LOSS'
      ? t('goalFatLoss')
      : rawGoal === 'MUSCLE_GAIN'
        ? t('goalMuscleGain')
        : rawGoal === 'ENDURANCE'
          ? t('goalEndurance')
          : t('goalMaintenance');

  const recPlan = recommendation?.routine || recommendation;
  const recExercises = recPlan?.exercises || [];
  const recTitle =
    getWorkoutPlanTitle(recPlan?.title, language) ||
    recPlan?.titleVi ||
    recPlan?.title ||
    'Calisthenics Routine';
  const recMinutes = recPlan?.estimatedDurationMin || recPlan?.estimatedMinutes || 20;
  const recXp = recPlan?.totalEstimatedXp || recPlan?.xpReward || 120;
  const recExplanation =
    getAiExplanation(recPlan?.aiExplanation, recPlan?.adaptationType, language) ||
    recommendation?.reason ||
    '';

  const isWorkoutDoneToday = Boolean(todayStatus?.hasWorkedOutToday || todayStatus?.workoutDone);
  const isNutritionDoneToday = Boolean(todayStatus?.hasCheckedInToday || todayStatus?.nutritionDone);
  const checkedCalorieType =
    todayStatus?.todayCheckin?.calorieType || todayStatus?.checkIn?.calorieStatus || null;

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-6 space-y-6">
      {/* TOP PERSONALIZED GREETING BANNER */}
      <section className="feature-card rounded-3xl p-6 md:p-8 relative overflow-hidden border border-white/12">
        <div className="pointer-events-none absolute -top-24 right-10 w-96 h-96 volt-spotlight opacity-50" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-[#192310] px-3.5 py-1 rounded-full text-xs font-extrabold text-[#C8F135] border border-[#C8F135]/35">
              <span className="w-2 h-2 rounded-full bg-[#C8F135] animate-pulse shadow-[0_0_8px_#C8F135]" />
              <span className="uppercase tracking-wider">{t('personalizedSystemBadge')}</span>
            </div>
            <h1 className="font-display font-black text-4xl md:text-5xl text-white uppercase tracking-tight leading-none pt-1">
              {t('helloAthlete')}, <span className="text-[#C8F135]">{user?.name}</span>!
            </h1>
            <p className="text-sm text-[#9BA394] font-medium">
              {t('goalLabel')}:{' '}
              <strong className="text-white">{goalDisplay}</strong> •{' '}
              <span className="text-[#C8F135] font-bold">
                {t('level')} {levelInfo.level}
              </span>{' '}
              ({levelInfo.totalXp} XP)
            </p>
          </div>

          {/* Quick Status Pill or Giant CTA */}
          <div className="flex items-center gap-3 shrink-0">
            {isWorkoutDoneToday ? (
              <div className="flex items-center space-x-2 bg-[#C8F135]/15 border border-[#C8F135]/45 text-[#C8F135] px-5 py-3.5 rounded-2xl font-black text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>{t('completedTodayBadge')}</span>
              </div>
            ) : (
              <div className="w-full sm:w-auto min-w-[250px]">
                <GiantButton
                  variant="primary"
                  size="large"
                  icon={<Dumbbell className="w-6 h-6" />}
                  subtitle={recTitle}
                  onClick={handleStartWorkout}
                >
                  {t('startWorkoutNow')}
                </GiantButton>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* MAIN 12-COLUMN BENTO GRID */}
      <section>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT 8 COLUMNS: HYBRID RECOMMENDATION + 1-TAP NUTRITION CHECK-IN */}
          <div className="lg:col-span-8 space-y-6">
            {/* HYBRID AI RECOMMENDATION CARD */}
            <div className="feature-card rounded-3xl p-6 md:p-7 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#C8F135]/15 border border-[#C8F135]/35 flex items-center justify-center text-[#C8F135]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="font-display font-bold text-2xl text-white tracking-wide uppercase">
                    {t('aiRecommendationTitle')}
                  </h3>
                </div>
                <span className="text-[11px] font-black uppercase bg-[#C8F135] text-[#0B0F07] px-3 py-1 rounded-full tracking-wider">
                  Rule-Based + Collaborative Filtering
                </span>
              </div>

              {recExercises.length > 0 ? (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0D1309]/90 p-5 rounded-2xl border border-white/10">
                    <div className="space-y-1.5">
                      <span className="text-xs font-extrabold text-[#C8F135] uppercase tracking-wider">
                        {recPlan?.targetFocus || recPlan?.targetArea || goalDisplay} • {recMinutes}{' '}
                        {t('minutes')}
                      </span>
                      <h4 className="font-display font-black text-3xl text-white uppercase tracking-wide">
                        {recTitle}
                      </h4>
                      <p className="text-xs text-[#9BA394] font-medium">
                        {recExplanation}
                      </p>
                    </div>

                    <div className="shrink-0 flex sm:flex-col items-end justify-between gap-2">
                      <span className="bg-[#C8F135]/15 text-[#C8F135] border border-[#C8F135]/35 px-3 py-1 rounded-full text-xs font-black font-telemetry">
                        +{recXp} XP
                      </span>
                      <span className="text-xs font-bold text-[#9BA394]">
                        {recExercises.length} {t('exercisesCount')}
                      </span>
                    </div>
                  </div>

                  {/* Exercise Preview List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {recExercises.slice(0, 4).map((ex: any, idx: number) => (
                      <div
                        key={`${ex.exerciseId || ex.slug || 'ex'}-${idx}`}
                        className="flex items-center justify-between p-3.5 rounded-2xl border border-white/10 bg-[#12190D] hover:border-[#C8F135]/40 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="w-8 h-8 rounded-xl bg-[#C8F135] text-[#0B0F07] font-telemetry font-black text-sm flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-extrabold text-sm text-white">
                              {getExerciseName(ex, language)}
                            </p>
                            <p className="text-xs text-[#9BA394] font-semibold">
                              {ex.sets} sets × {ex.reps} {ex.isTimeBased ? 'sec' : 'reps'}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-[#C8F135] bg-[#C8F135]/10 border border-[#C8F135]/25 px-2.5 py-1 rounded-lg font-telemetry">
                          {t('restSeconds')} {ex.restSeconds}s
                        </span>
                      </div>
                    ))}
                  </div>

                  <GiantButton
                    variant="primary"
                    size="giant"
                    icon={<Dumbbell className="w-7 h-7" />}
                    subtitle={t('giantUiModeDesc')}
                    badge={`+${recXp} XP`}
                    onClick={handleStartWorkout}
                  >
                    {t('startRoutineBtn')}
                  </GiantButton>
                </div>
              ) : (
                <div className="text-center py-8 space-y-3">
                  <p className="text-sm text-[#9BA394]">{t('noRoutineAvailable')}</p>
                  <Link href="/workout">
                    <GiantButton variant="primary" size="normal">
                      {t('openLibraryBtn')}
                    </GiantButton>
                  </Link>
                </div>
              )}
            </div>

            {/* 1-TAP DAILY NUTRITION CHECK-IN */}
            <div className="feature-card rounded-3xl p-6 md:p-7 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#C8F135]/15 border border-[#C8F135]/35 flex items-center justify-center text-[#C8F135]">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <h4 className="font-display font-bold text-2xl text-white tracking-wide uppercase">
                    {t('oneTapCheckInTitle')}
                  </h4>
                </div>
                {isNutritionDoneToday && (
                  <span className="text-xs font-black text-[#0B0F07] bg-[#C8F135] px-3 py-1 rounded-full">
                    ✓ {checkedCalorieType} (+5 FitCoins)
                  </span>
                )}
              </div>

              <p className="text-xs text-[#9BA394] font-medium">
                {t('oneTapCheckInSubtitle')}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <button
                  onClick={() => handleNutritionCheckIn('DEFICIT')}
                  disabled={checkingIn}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    checkedCalorieType === 'DEFICIT'
                      ? 'bg-[#C8F135] text-[#0B0F07] border-[#C8F135] shadow-[0_0_24px_rgba(200,241,53,0.25)]'
                      : 'bg-[#12190D] hover:bg-[#192310] text-white border-white/10 hover:border-[#C8F135]/40'
                  }`}
                >
                  <div className="font-display font-black text-lg tracking-wide uppercase">
                    🥗 {t('calorieDeficit')}
                  </div>
                  <div className="text-xs opacity-80 font-medium mt-1">
                    {t('calorieDeficitDesc')}
                  </div>
                </button>

                <button
                  onClick={() => handleNutritionCheckIn('MAINTENANCE')}
                  disabled={checkingIn}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    checkedCalorieType === 'MAINTENANCE'
                      ? 'bg-[#C8F135] text-[#0B0F07] border-[#C8F135] shadow-[0_0_24px_rgba(200,241,53,0.25)]'
                      : 'bg-[#12190D] hover:bg-[#192310] text-white border-white/10 hover:border-[#C8F135]/40'
                  }`}
                >
                  <div className="font-display font-black text-lg tracking-wide uppercase">
                    ⚖️ {t('calorieMaintenance')}
                  </div>
                  <div className="text-xs opacity-80 font-medium mt-1">
                    {t('calorieMaintenanceDesc')}
                  </div>
                </button>

                <button
                  onClick={() => handleNutritionCheckIn('SURPLUS')}
                  disabled={checkingIn}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    checkedCalorieType === 'SURPLUS'
                      ? 'bg-[#C8F135] text-[#0B0F07] border-[#C8F135] shadow-[0_0_24px_rgba(200,241,53,0.25)]'
                      : 'bg-[#12190D] hover:bg-[#192310] text-white border-white/10 hover:border-[#C8F135]/40'
                  }`}
                >
                  <div className="font-display font-black text-lg tracking-wide uppercase">
                    🥩 {t('calorieSurplus')}
                  </div>
                  <div className="text-xs opacity-80 font-medium mt-1">
                    {t('calorieSurplusDesc')}
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT 4 COLUMNS: LEVELING + BUDDY CO-OP + VIRTUAL WALLET */}
          <div className="lg:col-span-4 space-y-6">
            {/* GAMIFICATION LEVELING CARD */}
            <div className="glass-hud rounded-3xl p-6 space-y-4 border border-white/14">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#C8F135] text-[#0B0F07] flex items-center justify-center font-display font-black text-2xl shadow-[0_0_20px_rgba(200,241,53,0.3)]">
                    L{levelInfo.level}
                  </div>
                  <div>
                    <h5 className="font-extrabold text-white text-base leading-tight">
                      {user?.name || 'Athlete'}
                    </h5>
                    <span className="text-xs text-[#C8F135] font-bold uppercase tracking-wider">
                      {user?.profile?.fitnessLevel || 'BEGINNER'} {t('athlete')}
                    </span>
                  </div>
                </div>

                <Link
                  href="/profile"
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-[#C8F135] text-white hover:text-[#0B0F07] border border-white/10 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </div>

              {/* Root-Curve Leveling Progress Bar */}
              <div className="space-y-1.5 pt-3 border-t border-white/10">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-[#9BA394]">
                    {t('level')} {levelInfo.level} ➔ {levelInfo.level + 1}
                  </span>
                  <span className="text-[#C8F135] font-telemetry">{levelInfo.progressPercent}%</span>
                </div>
                <div className="w-full h-3 bg-[#0A0E07] rounded-full overflow-hidden p-0.5 border border-white/10">
                  <div
                    className="h-full bg-[#C8F135] rounded-full transition-all duration-500 shadow-[0_0_12px_#C8F135]"
                    style={{ width: `${levelInfo.progressPercent}%` }}
                  />
                </div>
                <p className="text-[11px] text-[#9BA394] text-right font-medium">
                  {language === 'vi' ? 'Cần ' : 'Need '}
                  <strong className="text-[#C8F135]">{levelInfo.xpRemainingToNextLevel} XP</strong>
                  {' ' + t('xpNeedToNext')}
                </p>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <div className="bg-[#0D1309] p-3.5 rounded-2xl border border-white/10">
                  <div className="flex items-center space-x-1.5 text-[#C8F135] text-xs font-bold mb-1">
                    <Flame className="w-4 h-4 fill-[#C8F135]" />
                    <span>{t('streak')}</span>
                  </div>
                  <span className="font-telemetry text-2xl font-black text-white">
                    {user?.currentStreak || 0} {t('days')}
                  </span>
                </div>

                <div className="bg-[#0D1309] p-3.5 rounded-2xl border border-white/10">
                  <div className="flex items-center space-x-1.5 text-[#FBBF24] text-xs font-bold mb-1">
                    <Coins className="w-4 h-4 fill-[#FBBF24]" />
                    <span>{t('fitcoins')}</span>
                  </div>
                  <span className="font-telemetry text-2xl font-black text-[#FBBF24]">
                    {user?.fitCoins || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* ACCOUNTABILITY BUDDY WIDGET */}
            {buddyData?.hasBuddy ? (
              <CoopMissionCard
                buddyData={buddyData}
                onOpenGiftModal={() => setIsGiftModalOpen(true)}
              />
            ) : (
              <div className="feature-card rounded-3xl p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#C8F135] uppercase tracking-wider">
                    {t('buddySystemBadge')}
                  </span>
                  <span className="text-[11px] bg-white/10 text-white px-2.5 py-0.5 rounded-full font-bold">
                    {t('noBuddyCardTitle')}
                  </span>
                </div>
                <h4 className="font-display font-bold text-white text-2xl uppercase tracking-wide">
                  {t('buddyTitle')}
                </h4>
                <p className="text-xs text-[#9BA394] font-medium leading-relaxed">
                  {t('noBuddyCardDesc')}
                </p>
                <Link href="/buddy" className="block pt-2">
                  <button className="w-full volt-pill-btn py-3.5 px-4 rounded-2xl font-black text-xs uppercase transition-all cursor-pointer">
                    {t('openRadarBtn')}
                  </button>
                </Link>
              </div>
            )}

            {/* FITCOIN SHOP PROMO */}
            <div className="feature-card rounded-3xl p-6 space-y-3 border border-[#FBBF24]/30">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-[#FBBF24]" />
                <h5 className="font-display font-bold text-[#FBBF24] text-lg uppercase tracking-wider">
                  {t('quickShopPromo')}
                </h5>
              </div>
              <p className="text-xs text-[#C2C9BC] font-medium">
                {t('quickShopPromoDesc')}
              </p>
              <Link href="/shop" className="block pt-1">
                <button className="w-full bg-[#FBBF24] hover:bg-[#F59E0B] text-[#0B0F07] py-3 rounded-xl font-black text-xs uppercase transition-colors cursor-pointer">
                  {t('visitShop')}
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Gift Freeze Modal */}
      {buddyData?.hasBuddy && (
        <GiftFreezeModal
          isOpen={isGiftModalOpen}
          partnerName={buddyData.partner.name}
          myFreezeCount={user?.streakFreezeCount || 0}
          onClose={() => setIsGiftModalOpen(false)}
          onSendGift={async (note) => {
            await ApiClient.giftStreakFreeze(buddyData.partner.id, note);
            await refreshUser();
            await loadHomeData();
          }}
        />
      )}
    </div>
  );
}
