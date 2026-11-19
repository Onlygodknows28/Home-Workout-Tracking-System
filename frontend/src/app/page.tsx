'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useDataCache, CACHE_KEYS } from '../context/DataCacheContext';
import { useWorkout } from '../context/WorkoutContext';
import { ApiClient } from '../lib/api';
import { useDesktopHeightSync } from '../lib/utils';
import {
  getExerciseName,
  getWorkoutPlanTitle,
  getAiExplanation,
  formatPersonName,
  getFitnessLevelLabel,
  getGoalLabel,
} from '../lib/catalogTranslations';
import { CoopMissionCard } from '../components/buddy/CoopMissionCard';
import { GiftFreezeModal } from '../components/buddy/GiftFreezeModal';
import { GuestLandingView } from '../components/home/GuestLandingView';
import { checkAndFireScheduledDailyReminder } from '../lib/firebaseMessaging';
import {
  Dumbbell,
  Flame,
  Coins,
  Sparkles,
  CheckCircle2,
  Shield,
  ChevronRight,
  Zap,
} from 'lucide-react';

export default function HomePage() {
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth();
  const { language, t } = useLanguage();
  const { getCache, setCache, isFresh, invalidate, prewarmAllTabs, isCacheHydrated } = useDataCache();
  const { activeWorkout, discardWorkout, startWorkout } = useWorkout();
  const router = useRouter();

  const [todayStatus, setTodayStatus] = useState<any>(() => getCache(CACHE_KEYS.TODAY_STATUS));
  const [recommendation, setRecommendation] = useState<any>(() => getCache(CACHE_KEYS.RECOMMENDATION));
  const [buddyData, setBuddyData] = useState<any>(() => getCache(CACHE_KEYS.BUDDY_DATA));
  const [checkingIn, setCheckingIn] = useState(false);
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [isStartingAuxiliary, setIsStartingAuxiliary] = useState(false);
  const [rightColRef, rightColHeight] = useDesktopHeightSync([
    isAuthenticated,
    user,
    todayStatus,
    buddyData,
    language,
  ]);

  const loadHomeData = async (forceRefresh = false) => {
    if (!isAuthenticated) return;

    // Immediately show any cached data available (Stale-While-Revalidate)
    const cachedStatus = getCache(CACHE_KEYS.TODAY_STATUS);
    const cachedRec = getCache(CACHE_KEYS.RECOMMENDATION);
    const cachedBuddy = getCache(CACHE_KEYS.BUDDY_DATA);
    if (cachedStatus) setTodayStatus(cachedStatus);
    if (cachedRec) setRecommendation(cachedRec);
    if (cachedBuddy) setBuddyData(cachedBuddy);

    if (
      !forceRefresh &&
      isFresh(CACHE_KEYS.TODAY_STATUS, 180000) &&
      isFresh(CACHE_KEYS.RECOMMENDATION, 180000) &&
      isFresh(CACHE_KEYS.BUDDY_DATA, 180000)
    ) {
      prewarmAllTabs();
      return;
    }

    // Stream each widget independently so no single query blocks the rest
    await Promise.allSettled([
      ApiClient.getTodayStatus().then((statusRes) => {
        if (statusRes) {
          setTodayStatus(statusRes);
          setCache(CACHE_KEYS.TODAY_STATUS, statusRes);
        }
      }),
      ApiClient.getDailyRecommendation().then((recRes) => {
        if (recRes) {
          setRecommendation(recRes);
          setCache(CACHE_KEYS.RECOMMENDATION, recRes);
        }
      }),
      ApiClient.getMyBuddy().then((buddyRes) => {
        if (buddyRes) {
          setBuddyData(buddyRes);
          setCache(CACHE_KEYS.BUDDY_DATA, buddyRes);
        }
      }),
    ]);
    prewarmAllTabs();
  };

  const handleStartAuxiliaryWorkout = async () => {
    setIsStartingAuxiliary(true);
    try {
      const auxPlan = await ApiClient.getAuxiliaryRecommendation();
      if (auxPlan) {
        startWorkout(auxPlan);
        router.push('/workout');
      } else {
        router.push('/workout');
      }
    } catch (err) {
      console.error('Failed to start auxiliary workout', err);
      router.push('/workout');
    } finally {
      setIsStartingAuxiliary(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && isCacheHydrated) {
      loadHomeData(false);
    }
  }, [isAuthenticated, isCacheHydrated]);

  useEffect(() => {
    if (!isAuthenticated || !todayStatus) return;
    const workedOut = Boolean(todayStatus?.hasWorkedOutToday || todayStatus?.workoutDone);
    checkAndFireScheduledDailyReminder({
      hasWorkedOutToday: workedOut,
      streak: user?.currentStreak || 1,
      language,
    });
  }, [isAuthenticated, todayStatus, user?.currentStreak, language]);

  const handleNutritionCheckIn = async (
    calorieState: 'DEFICIT' | 'MAINTENANCE' | 'SURPLUS',
  ) => {
    const alreadyCheckedIn = Boolean(
      todayStatus?.hasCheckedInToday ||
        todayStatus?.nutritionDone ||
        todayStatus?.todayCheckin?.calorieType ||
        todayStatus?.checkIn?.calorieStatus,
    );
    if (checkingIn || alreadyCheckedIn) return;

    setCheckingIn(true);
    const previousStatus = todayStatus;
    const optimisticStatus = {
      ...(todayStatus || {}),
      hasCheckedInToday: true,
      nutritionDone: true,
      todayCheckin: {
        ...(todayStatus?.todayCheckin || {}),
        calorieType: calorieState,
      },
    };
    setTodayStatus(optimisticStatus);
    setCache(CACHE_KEYS.TODAY_STATUS, optimisticStatus);

    try {
      const res = await ApiClient.submitCheckin({
        calorieType: calorieState,
        energyLevel: 4,
      });
      const confirmedStatus = {
        ...optimisticStatus,
        todayCheckin: res?.checkin || optimisticStatus.todayCheckin,
      };
      setTodayStatus(confirmedStatus);
      setCache(CACHE_KEYS.TODAY_STATUS, confirmedStatus);
      invalidate('profile_');
      await refreshUser();
    } catch (err: any) {
      // If backend says already checked in today, fetch fresh status to lock UI
      try {
        const freshStatus = await ApiClient.getTodayStatus();
        if (freshStatus) {
          setTodayStatus(freshStatus);
          setCache(CACHE_KEYS.TODAY_STATUS, freshStatus);
        } else {
          setTodayStatus(previousStatus);
        }
      } catch {
        setTodayStatus(previousStatus);
      }
    } finally {
      setCheckingIn(false);
    }
  };

  const handleStartWorkout = () => {
    if (activeWorkout.isCompleted) {
      discardWorkout();
    }
    router.push('/workout');
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-[#C42126] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // =========================================================================
  // CASE 1: GUEST LANDING PAGE (IMPECCABLE SINGLE-LAYER IVORY & CRIMSON UI)
  // =========================================================================
  if (!isAuthenticated) {
    return <GuestLandingView />;
  }

  // =========================================================================
  // CASE 2: AUTHENTICATED USER — SINGLE-LAYER AI DASHBOARD (ZERO CARD-IN-CARD)
  // =========================================================================
  const levelInfo = todayStatus?.levelInfo || {
    level: user?.level || 1,
    totalXp: user?.xp || 0,
    progressPercent: 0,
    xpRemainingToNextLevel: 100,
  };
  const displayXp = levelInfo.totalXp ?? levelInfo.currentXp ?? user?.xp ?? 0;
  const displayName = formatPersonName(user?.name, language);

  const rawGoal = user?.profile?.primaryGoal || 'MAINTENANCE';
  const goalDisplay = getGoalLabel(rawGoal, language, 'long');

  const recPlan = recommendation?.routine || recommendation;
  const recExercises = recPlan?.exercises || [];
  const recTitle =
    getWorkoutPlanTitle(recPlan?.title, language) ||
    recPlan?.title ||
    'Calisthenics Routine';
  const recMinutes = recPlan?.estimatedDurationMin || 20;
  const recXp = recPlan?.totalEstimatedXp || 120;
  const recExplanation =
    getAiExplanation(
      recPlan?.aiExplanation,
      recPlan?.adaptationType,
      language,
      recPlan?.aiExplanationEn,
    ) || '';

  const isWorkoutDoneToday = Boolean(todayStatus?.hasWorkedOutToday || todayStatus?.workoutDone);
  const isNutritionDoneToday = Boolean(todayStatus?.hasCheckedInToday || todayStatus?.nutritionDone);
  const checkedCalorieType = todayStatus?.todayCheckin?.calorieType || null;
  const todayWorkout = todayStatus?.todayWorkout;
  const todayRpe = todayWorkout?.rpeScore;

  return (
    <div className="max-w-[1220px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 space-y-3.5 sm:space-y-4">
      {/* OPEN-CANVAS GREETING HEADER (Separated by 1px #D6D6D2 hairline — NO outer card wrapper!) */}
      <section className="pb-2.5 sm:pb-3 border-b border-[#D6D6D2] flex flex-col md:flex-row md:items-end justify-between gap-2.5">
        <div>
          <h1 className="font-display font-extrabold text-[28px] sm:text-[34px] lg:text-[38px] text-[#333333] uppercase leading-none">
            {t('helloAthlete')}, <span className="text-[#C42126]">{displayName}</span>
          </h1>
          <p className="text-xs text-[#5C5C5C] mt-1">
            {t('goalLabel')}: <strong className="text-[#333333]">{goalDisplay}</strong> •{' '}
            <span className="text-[#C42126] font-semibold">
              {t('level')} {levelInfo.level}
            </span>{' '}
            ({displayXp} XP)
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {!isWorkoutDoneToday && (
            <button
              onClick={handleStartWorkout}
              className="px-5 py-2.5 rounded-lg btn-cta-red text-xs font-semibold uppercase tracking-wider flex items-center gap-2 cursor-pointer"
            >
              <Dumbbell className="w-4 h-4" />
              <span>{t('startWorkoutNow')}</span>
            </button>
          )}
        </div>
      </section>

      {/* ONBOARDING PROMPT BANNER IF PROFILE NOT COMPLETED */}
      {!user?.profile && (
        <div className="bento-tile p-4 sm:p-5 bg-gradient-to-r from-[#FDE8E9]/80 to-[#EBEBE6] border border-[#C42126]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C42126] text-white flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-base sm:text-lg text-[#333333] uppercase">
                {t('onboardingPendingBannerTitle')}
              </h3>
              <p className="text-xs text-[#5C5C5C] mt-0.5 leading-relaxed max-w-2xl">
                {t('onboardingPendingBannerDesc')}
              </p>
            </div>
          </div>
          <Link
            href="/onboarding"
            className="px-4 py-2.5 rounded-lg btn-cta-red text-xs font-bold uppercase tracking-wider shrink-0 text-center flex items-center justify-center gap-1.5"
          >
            <span>{t('onboardingSetupNowBtn')}</span>
          </Link>
        </div>
      )}

      {/* MAIN 12-COLUMN SINGLE-LAYER BENTO GRID (8 Cols Workout + 4 Cols Telemetry) */}
      <section>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          {/* LEFT 8 COLUMNS: Equal height with Right Column via rightColHeight */}
          <div
            style={
              !isWorkoutDoneToday && rightColHeight
                ? { height: `${rightColHeight}px` }
                : rightColHeight
                ? { minHeight: `${rightColHeight}px` }
                : undefined
            }
            className="lg:col-span-8 flex flex-col justify-between gap-5 sm:gap-6 min-h-0"
          >
            {/* SINGLE-LAYER AI WORKOUT BENTO TILE (#EBEBE6, zero nested exercise cards!) */}
            <div
              className={`bento-tile p-5 sm:p-6 flex-1 min-h-0 flex flex-col justify-between ${
                isWorkoutDoneToday ? 'overflow-visible' : 'overflow-hidden'
              }`}
            >
              {isWorkoutDoneToday ? (
                /* STATE 1: TODAY'S WORKOUT ALREADY COMPLETED (Aligned with Workout Tab) */
                <div className="flex-1 min-h-0 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex flex-wrap items-baseline justify-between gap-3 pb-2.5 border-b border-[#D6D6D2]">
                      <div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8F5E9] border border-[#2E7D32]/30 text-[#2E7D32] text-[10px] font-bold uppercase tracking-wider">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{t('workoutDayDoneBadge')}</span>
                        </span>
                        <h2 className="text-xl sm:text-2xl font-bold text-[#333333] mt-1">
                          {getWorkoutPlanTitle(todayWorkout?.workoutTitle, language) ||
                            (language === 'vi' ? 'Calisthenics Hằng Ngày' : 'Daily Calisthenics Routine')}
                        </h2>
                      </div>
                      <span className="font-telemetry text-sm font-bold text-[#2E7D32]">
                        +{todayWorkout?.earnedXp || 120} XP • +{todayWorkout?.earnedCoins || 10} Coins
                      </span>
                    </div>

                    {/* Flush AI Coach Advice Strip */}
                    <div className="-mx-5 sm:-mx-6 px-5 sm:px-6 py-2 bg-[#FDE8E9] border-b border-[#D6D6D2] flex items-center justify-between gap-3 text-xs text-[#C42126]">
                      <span className="truncate">
                        <strong>AI Coach:</strong>{' '}
                        {todayRpe === 1
                          ? t('auxiliaryFinisherSub')
                          : todayRpe === 3
                            ? t('recoveryRestAdviceHard')
                            : t('recoveryRestAdviceOptimal')}
                      </span>
                      <span className="font-telemetry font-bold uppercase shrink-0 text-[10px]">
                        {todayRpe === 1 ? 'Finisher Ready' : 'Recovery Active'}
                      </span>
                    </div>
                  </div>

                  {/* Body: Telemetry and Health Summary */}
                  <div className="space-y-2.5">
                    {/* Flush 3-Column Telemetry Strip */}
                    <div className="grid grid-cols-3 divide-x divide-[#D6D6D2] py-2.5 border-b border-[#D6D6D2] text-center">
                      <div className="pr-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#5C5C5C] block">
                          {t('workoutFinishedTime')}
                        </span>
                        <span className="font-display text-2xl sm:text-3xl font-extrabold text-[#333333] font-telemetry mt-0.5 block">
                          {Math.max(1, Math.round((todayWorkout?.durationSeconds || 60) / 60))} {t('minutes')}
                        </span>
                      </div>
                      <div className="px-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#5C5C5C] block">
                          {t('workoutFinishedReps')}
                        </span>
                        <span className="font-display text-2xl sm:text-3xl font-extrabold text-[#333333] font-telemetry mt-0.5 block">
                          {todayWorkout?.totalReps || 60} {t('reps')}
                        </span>
                      </div>
                      <div className="pl-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#5C5C5C] block">
                          {t('workoutDayDoneRpeLabel')}
                        </span>
                        <span className="font-display text-sm sm:text-base font-extrabold text-[#C42126] font-telemetry mt-1.5 block">
                          {todayRpe === 1
                            ? `⚡ ${t('rpeEasyTitle')}`
                            : todayRpe === 3
                              ? `🛡️ ${t('rpeHardTitle')}`
                              : `🎯 ${t('rpeOptimalTitle')}`}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#F5F5F0] border border-[#D6D6D2] flex flex-wrap items-center justify-between gap-2.5 text-xs text-[#5C5C5C]">
                      <div className="flex items-center gap-2">
                        {todayRpe === 1 ? (
                          <Zap className="w-4 h-4 text-[#C42126] shrink-0" />
                        ) : (
                          <Shield className="w-4 h-4 text-[#2E7D32] shrink-0" />
                        )}
                        <span>
                          {todayRpe === 1
                            ? (language === 'vi'
                                ? 'Bạn đã đánh giá buổi tập là Quá Dễ! Bạn có thể kích hoạt bài tập bổ trợ cơ lõi (Core Burnout).'
                                : 'You rated today as Too Easy! A Core Burnout finisher is ready for you.')
                            : (language === 'vi'
                                ? 'Cơ bắp đang trong giai đoạn hồi phục tích cực. Hãy uống đủ nước và nghỉ ngơi trọn vẹn.'
                                : 'Muscles are in active recovery phase. Stay hydrated and rest well today.')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-telemetry font-bold text-[#333333] shrink-0">
                        {todayWorkout?.calorieBurnEstimate ? (
                          <span>~{todayWorkout.calorieBurnEstimate} kcal • </span>
                        ) : null}
                        <span>Streak {todayStatus?.userStats?.currentStreak || user?.currentStreak || 1}d</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer CTA */}
                  <div className="pt-2.5 border-t border-[#D6D6D2] flex flex-wrap items-center justify-between gap-3 shrink-0">
                    <span className="text-xs text-[#2E7D32] font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{language === 'vi' ? 'Đã hoàn thành giáo án thể lực hôm nay' : 'Daily fitness routine completed'}</span>
                    </span>
                    {todayRpe === 1 ? (
                      <button
                        type="button"
                        disabled={isStartingAuxiliary}
                        onClick={handleStartAuxiliaryWorkout}
                        className="px-5 py-2.5 rounded-lg btn-cta-red text-xs font-semibold uppercase tracking-wider cursor-pointer flex items-center gap-1.5 shadow-sm hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
                      >
                        <Zap className="w-4 h-4" />
                        <span>
                          {isStartingAuxiliary
                            ? (language === 'vi' ? 'ĐANG KHỞI TẠO...' : 'STARTING...')
                            : (language === 'vi' ? 'BÀI TẬP BỔ TRỢ (+50 XP)' : 'START FINISHER (+50 XP)')}
                        </span>
                      </button>
                    ) : (
                      <Link
                        href="/workout"
                        className="px-4 py-2 rounded-lg bg-[#EBEBE6] hover:bg-[#D6D6D2] border border-[#D6D6D2] text-[#333333] text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1"
                      >
                        <span>{language === 'vi' ? 'XEM LẠI BUỔI TẬP' : 'REVIEW WORKOUT'}</span>
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </div>
              ) : recExercises.length > 0 ? (
                <>
                  <div className="shrink-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-2.5 pb-2.5 border-b border-[#D6D6D2]">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-[#C42126]">
                          {goalDisplay} • {recMinutes} {t('minutes')}
                        </span>
                        <h2 className="text-xl sm:text-2xl font-bold text-[#333333] mt-0.5">{recTitle}</h2>
                      </div>
                      <span className="font-telemetry text-sm font-bold text-[#2E7D32]">
                        +{recXp} XP • {recExercises.length} {t('exercisesCount')}
                      </span>
                    </div>

                    {/* Flush Warning/Adaptation Strip using --color-warning-light (#FDE8E9) & --color-warning-text (#C42126) */}
                    {recExplanation && (
                      <div className="-mx-5 sm:-mx-6 px-5 sm:px-6 py-1.5 bg-[#FDE8E9] border-b border-[#D6D6D2] flex items-center justify-between gap-3 text-xs text-[#C42126]">
                        <span className="truncate">
                          <strong>AI Coach:</strong> {recExplanation}
                        </span>
                        <span className="font-telemetry font-bold uppercase shrink-0 text-[10px]">Adaptive</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto pr-1.5 divide-y divide-[#D6D6D2] exercise-scroll">
                    {recExercises.map((ex: any, idx: number) => (
                      <div
                        key={`${ex.exerciseId || ex.slug || 'ex'}-${idx}`}
                        className="py-2 flex items-center justify-between gap-3 shrink-0"
                      >
                        <div className="flex items-baseline gap-3">
                          <span className="font-telemetry text-xs sm:text-sm font-bold text-[#C42126] w-5 sm:w-6">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <div>
                            <p className="text-xs sm:text-sm font-semibold text-[#333333]">
                              {getExerciseName(ex, language)}
                            </p>
                            <p className="text-[11px] text-[#5C5C5C] mt-0.5">
                              {ex.equipment ? `${ex.equipment} • ` : ''}
                              {t('restSeconds')} {ex.restSeconds}s
                            </p>
                          </div>
                        </div>

                        <span className="font-telemetry text-sm sm:text-base font-bold text-[#333333]">
                          {ex.sets} × {ex.reps} {ex.isTimeBased ? 's' : ''}
                        </span>
                      </div>
                    ))}

                    {recExercises.length <= 3 && (
                      <>
                        <div className="py-2 flex items-center justify-between gap-3 opacity-85 shrink-0">
                          <div className="flex items-baseline gap-3">
                            <span className="font-telemetry text-sm font-bold text-[#2E7D32] w-5 sm:w-6">
                              ✦
                            </span>
                            <div>
                              <p className="text-xs sm:text-sm font-semibold text-[#333333]">
                                {language === 'vi'
                                  ? 'Khởi Động Khớp & Làm Nóng Động'
                                  : 'Joint Mobility & Dynamic Warm-up'}
                              </p>
                              <p className="text-[11px] text-[#5C5C5C] mt-0.5">
                                {language === 'vi'
                                  ? 'Xoay cổ tay, khớp vai và mở khớp hông trước hiệp chính'
                                  : 'Wrists, shoulders & hip openers before main sets'}
                              </p>
                            </div>
                          </div>
                          <span className="font-telemetry text-xs font-bold text-[#2E7D32] uppercase">
                            3 {t('minutes')}
                          </span>
                        </div>

                        {recExercises.length <= 2 && (
                          <div className="py-2 flex items-center justify-between gap-3 opacity-85 shrink-0">
                            <div className="flex items-baseline gap-3">
                              <span className="font-telemetry text-sm font-bold text-[#2E7D32] w-5 sm:w-6">
                                ✦
                              </span>
                              <div>
                                <p className="text-xs sm:text-sm font-semibold text-[#333333]">
                                  {language === 'vi'
                                    ? 'Giãn Cơ Giải Nén & Điều Hòa Nhịp Thở'
                                    : 'Decompression Stretch & Breathing'}
                                </p>
                                <p className="text-[11px] text-[#5C5C5C] mt-0.5">
                                  {language === 'vi'
                                    ? 'Hạ nhịp tim và thả lỏng nhóm cơ sau buổi tập'
                                    : 'Post-routine heart rate recovery & muscle release'}
                                </p>
                              </div>
                            </div>
                            <span className="font-telemetry text-xs font-bold text-[#2E7D32] uppercase">
                              2 {t('minutes')}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="shrink-0 pt-2.5 border-t border-[#D6D6D2] flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-[#5C5C5C]">{t('giantUiModeDesc')}</span>
                    <button
                      onClick={handleStartWorkout}
                      className="px-5 py-2 sm:py-2.5 rounded-lg btn-cta-red text-xs font-semibold uppercase tracking-wider cursor-pointer"
                    >
                      {t('startRoutineBtn')} (+{recXp} XP)
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex-1 min-h-0 flex flex-col divide-y divide-[#D6D6D2]">
                    <div className="flex-1 flex items-center justify-between gap-4 py-2">
                      <div className="flex items-baseline gap-4">
                        <span className="font-telemetry text-sm font-bold text-[#C42126] w-6">
                          01
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-[#333333]">
                            {language === 'vi'
                              ? 'Chuẩn Hóa Thể Lực Nền & Chỉ Số BMI'
                              : 'Baseline Fitness & BMI Calibration'}
                          </p>
                          <p className="text-xs text-[#5C5C5C] mt-0.5">
                            {language === 'vi'
                              ? 'AI đối chiếu ngưỡng chống đẩy và chỉ số khối cơ thể của bạn'
                              : 'AI maps your push-up capacity and body mass index'}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#2E7D32] uppercase">Ready</span>
                    </div>

                    <div className="flex-1 flex items-center justify-between gap-4 py-2">
                      <div className="flex items-baseline gap-4">
                        <span className="font-telemetry text-sm font-bold text-[#C42126] w-6">
                          02
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-[#333333]">
                            {language === 'vi'
                              ? 'Bộ Lọc Bảo Vệ An Toàn Khớp'
                              : 'Joint Contraindication Safety Filter'}
                          </p>
                          <p className="text-xs text-[#5C5C5C] mt-0.5">
                            {language === 'vi'
                              ? 'Loại trừ 100% bài tập gây áp lực lên vùng chấn thương đã khai báo'
                              : 'Excludes 100% of drills stressing declared injury zones'}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#2E7D32] uppercase">Active</span>
                    </div>

                    <div className="flex-1 flex items-center justify-between gap-4 py-2">
                      <div className="flex items-baseline gap-4">
                        <span className="font-telemetry text-sm font-bold text-[#C42126] w-6">
                          03
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-[#333333]">
                            {t('noRoutineAvailable')}
                          </p>
                          <p className="text-xs text-[#5C5C5C] mt-0.5">
                            {language === 'vi'
                              ? 'Mở thư viện Giáo Án AI để khởi tạo lộ trình tập luyện hôm nay'
                              : 'Open AI Workouts library to initialize your daily exercises'}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#C42126] uppercase">Action</span>
                    </div>
                  </div>

                  <div className="shrink-0 pt-3 border-t border-[#D6D6D2] flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-[#5C5C5C]">{t('giantUiModeDesc')}</span>
                    <Link
                      href="/workout"
                      className="px-6 py-2.5 rounded-lg btn-cta-red text-xs font-semibold uppercase tracking-wider cursor-pointer"
                    >
                      {t('openLibraryBtn')}
                    </Link>
                  </div>
                </>
              )}
            </div>

            {/* 1-TAP DAILY NUTRITION CHECK-IN (Single-layer tile with segmented hairline strip) */}
            <div className="bento-tile p-4 sm:p-5 space-y-2.5 shrink-0">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#333333]">{t('oneTapCheckInTitle')}</h3>
                  <p className="text-xs text-[#5C5C5C] mt-0.5">{t('oneTapCheckInSubtitle')}</p>
                </div>
                {isNutritionDoneToday && (
                  <span className="text-xs font-bold text-[#2E7D32]">
                    ✓{' '}
                    {language === 'vi'
                      ? 'Đã nhận +5 FitCoins hôm nay'
                      : '+5 FitCoins claimed today'}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 border border-[#D6D6D2] rounded-lg overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-[#D6D6D2] bg-[#F5F5F0]">
                <button
                  type="button"
                  onClick={() => handleNutritionCheckIn('DEFICIT')}
                  disabled={checkingIn || isNutritionDoneToday}
                  className={`p-2.5 sm:p-3 text-left transition-colors ${
                    checkedCalorieType === 'DEFICIT'
                      ? 'bg-[#333333] text-[#FFFFFF] cursor-default'
                      : isNutritionDoneToday
                        ? 'text-[#5C5C5C] opacity-50 cursor-not-allowed'
                        : 'text-[#333333] hover:bg-[#EBEBE6] cursor-pointer'
                  }`}
                >
                  <div className="text-xs font-bold uppercase flex items-center justify-between gap-1">
                    <span>{t('calorieDeficit')}</span>
                    {checkedCalorieType === 'DEFICIT' && <span>✓</span>}
                  </div>
                  <div className="text-[11px] opacity-75 mt-0.5">{t('calorieDeficitDesc')}</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleNutritionCheckIn('MAINTENANCE')}
                  disabled={checkingIn || isNutritionDoneToday}
                  className={`p-2.5 sm:p-3 text-left transition-colors ${
                    checkedCalorieType === 'MAINTENANCE'
                      ? 'bg-[#333333] text-[#FFFFFF] cursor-default'
                      : isNutritionDoneToday
                        ? 'text-[#5C5C5C] opacity-50 cursor-not-allowed'
                        : 'text-[#333333] hover:bg-[#EBEBE6] cursor-pointer'
                  }`}
                >
                  <div className="text-xs font-bold uppercase flex items-center justify-between gap-1">
                    <span>{t('calorieMaintenance')}</span>
                    {checkedCalorieType === 'MAINTENANCE' && <span>✓</span>}
                  </div>
                  <div className="text-[11px] opacity-75 mt-0.5">{t('calorieMaintenanceDesc')}</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleNutritionCheckIn('SURPLUS')}
                  disabled={checkingIn || isNutritionDoneToday}
                  className={`p-2.5 sm:p-3 text-left transition-colors ${
                    checkedCalorieType === 'SURPLUS'
                      ? 'bg-[#333333] text-[#FFFFFF] cursor-default'
                      : isNutritionDoneToday
                        ? 'text-[#5C5C5C] opacity-50 cursor-not-allowed'
                        : 'text-[#333333] hover:bg-[#EBEBE6] cursor-pointer'
                  }`}
                >
                  <div className="text-xs font-bold uppercase flex items-center justify-between gap-1">
                    <span>{t('calorieSurplus')}</span>
                    {checkedCalorieType === 'SURPLUS' && <span>✓</span>}
                  </div>
                  <div className="text-[11px] opacity-75 mt-0.5">{t('calorieSurplusDesc')}</div>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT 4 COLUMNS: Equal height with Left Column via CSS Grid */}
          <div ref={rightColRef} className="lg:col-span-4 flex flex-col justify-between gap-5 sm:gap-6 min-h-0">
            {/* SINGLE-LAYER LEVELING & WALLET TILE (Divided by 1px #D6D6D2 hairlines — zero inner cards!) */}
            <div className="bento-tile p-5 shrink-0">
              <div className="flex items-center justify-between pb-3 border-b border-[#D6D6D2]">
                <div>
                  <h4 className="font-bold text-[#333333] text-base leading-tight">{displayName || 'Athlete'}</h4>
                  <span className="text-[11px] text-[#C42126] font-semibold uppercase block mt-0.5">
                    {t('level')} 0{levelInfo.level} •{' '}
                    {getFitnessLevelLabel(user?.profile?.fitnessLevel || 'BEGINNER', language)}
                  </span>
                </div>
                <Link
                  href="/profile"
                  className="text-xs font-semibold text-[#5C5C5C] hover:text-[#333333] flex items-center gap-0.5"
                >
                  <span>{language === 'vi' ? 'Hồ sơ' : 'Profile'}</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {/* XP Progress Bar (Compact inline progress & remaining XP) */}
              <div className="py-2.5 border-b border-[#D6D6D2] space-y-1.5">
                <div className="flex justify-between items-baseline text-xs font-semibold">
                  <span className="text-[#5C5C5C]">
                    {t('level')} {levelInfo.level} ➔ {levelInfo.level + 1}
                    <span className="text-[#C42126] font-telemetry font-bold ml-1.5">
                      ({levelInfo.progressPercent}%)
                    </span>
                  </span>
                  <span className="text-[11px] text-[#5C5C5C]">
                    {language === 'vi' ? 'Cần ' : 'Need '}
                    <strong className="text-[#333333]">{levelInfo.xpRemainingToNextLevel} XP</strong>
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#D6D6D2] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#C42126] rounded-full transition-all duration-500"
                    style={{ width: `${levelInfo.progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Flush 2-Column Hairline Split (Compact Telemetry Numbers) */}
              <div className="py-2.5 border-b border-[#D6D6D2] grid grid-cols-2 divide-x divide-[#D6D6D2]">
                <div className="pr-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#5C5C5C] flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-[#C42126]" />
                    <span>{t('streak')}</span>
                  </div>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="font-display text-2xl font-extrabold text-[#333333] leading-none font-telemetry">
                      {user?.currentStreak || 0}
                    </span>
                    <span className="text-[11px] text-[#5C5C5C] font-semibold">{t('days')}</span>
                  </div>
                </div>

                <div className="pl-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#5C5C5C] flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-[#C42126]" />
                    <span>{t('fitcoins')}</span>
                  </div>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="font-display text-2xl font-extrabold text-[#C42126] leading-none font-telemetry">
                      {user?.fitCoins || 0}
                    </span>
                    <span className="text-[11px] text-[#5C5C5C] font-semibold">FitCoins</span>
                  </div>
                </div>
              </div>

              {/* Flush Shop Link */}
              <div className="pt-2.5 flex items-center justify-between text-xs">
                <span className="text-[#5C5C5C] text-[11px]">{t('quickShopPromo')}</span>
                <Link href="/shop" className="font-bold text-[#C42126] hover:underline text-xs flex items-center gap-0.5">
                  <span>{t('visitShop')}</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            {/* ACCOUNTABILITY BUDDY WIDGET */}
            {buddyData?.hasBuddy ? (
              <CoopMissionCard
                buddyData={buddyData}
                onOpenGiftModal={() => setIsGiftModalOpen(true)}
              />
            ) : (
              <div className="bento-tile p-6 flex-1 flex flex-col justify-between gap-3">
                <div className="space-y-3">
                  <div className="text-xs font-bold text-[#C42126] uppercase tracking-wider">
                    {t('buddySystemBadge')}
                  </div>
                  <h4 className="font-display font-bold text-[#333333] text-2xl uppercase">
                    {t('buddyTitle')}
                  </h4>
                  <p className="text-xs text-[#5C5C5C] leading-relaxed">{t('noBuddyCardDesc')}</p>
                </div>
                <Link href="/buddy" className="block pt-1">
                  <button className="w-full py-2.5 px-4 rounded-lg btn-cta-red font-semibold text-xs uppercase cursor-pointer">
                    {t('openRadarBtn')}
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Gift Freeze Modal */}
      {buddyData?.hasBuddy && (
        <GiftFreezeModal
          isOpen={isGiftModalOpen}
          partnerName={formatPersonName(buddyData.partner.name, language)}
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
