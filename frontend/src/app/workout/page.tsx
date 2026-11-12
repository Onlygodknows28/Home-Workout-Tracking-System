'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useDataCache, CACHE_KEYS } from '../../context/DataCacheContext';
import { useWorkout } from '../../context/WorkoutContext';
import { ApiClient } from '../../lib/api';
import { GiantButton } from '../../components/ui/GiantButton';
import { RestTimerOverlay } from '../../components/workout/RestTimerOverlay';
import { GiantRpeModal } from '../../components/workout/GiantRpeModal';
import { formatTime } from '../../lib/utils';
import { getExerciseName, getWorkoutPlanTitle, getAiExplanation } from '../../lib/catalogTranslations';
import {
  CheckCircle2,
  Clock,
  FastForward,
  Info,
  Play,
  Zap,
  Trophy,
  Shield,
  AlertTriangle,
} from 'lucide-react';

export default function WorkoutPlayerPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, isAuthReady } = useAuth();
  const { t, language } = useLanguage();
  const { getCache, setCache, isFresh, isCacheHydrated } = useDataCache();

  const {
    activeWorkout,
    elapsedSeconds,
    isRestModalMinimized,
    minimizeRestModal,
    dismissRpeModal,
    reopenRpeModal,
    startWorkout,
    completeSet,
    skipExercise,
    discardWorkout,
    submitWorkout,
  } = useWorkout();

  const [recommendation, setRecommendation] = useState<any>(() => {
    if (activeWorkout.isActive && activeWorkout.recommendation) {
      return activeWorkout.recommendation;
    }
    return getCache(CACHE_KEYS.RECOMMENDATION);
  });

  const [todayStatus, setTodayStatus] = useState<any>(() => getCache(CACHE_KEYS.TODAY_STATUS));
  const [isStartingAuxiliary, setIsStartingAuxiliary] = useState(false);
  const [isConfirmingDiscard, setIsConfirmingDiscard] = useState(false);

  const [isDataLoading, setIsDataLoading] = useState(
    () => !activeWorkout.isActive && !getCache(CACHE_KEYS.RECOMMENDATION),
  );

  useEffect(() => {
    if (!isAuthReady) return;
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated && isCacheHydrated && !activeWorkout.isActive) {
      loadPlan();
    }
  }, [isAuthenticated, isLoading, isAuthReady, isCacheHydrated, activeWorkout.isActive]);

  const loadPlan = async (forceSpinner = false) => {
    const cachedRec = getCache(CACHE_KEYS.RECOMMENDATION);
    const cachedStatus = getCache(CACHE_KEYS.TODAY_STATUS);
    if (cachedStatus) setTodayStatus(cachedStatus);
    if (cachedRec && !forceSpinner) {
      setRecommendation(cachedRec);
      setIsDataLoading(false);
      if (isFresh(CACHE_KEYS.RECOMMENDATION, 180000) && isFresh(CACHE_KEYS.TODAY_STATUS, 180000)) {
        return;
      }
    } else if (forceSpinner) {
      setIsDataLoading(true);
    }

    try {
      const [rec, status] = await Promise.all([
        ApiClient.getDailyRecommendation().catch(() => null),
        ApiClient.getTodayStatus().catch(() => null),
      ]);
      if (rec) {
        setRecommendation(rec);
        setCache(CACHE_KEYS.RECOMMENDATION, rec);
      }
      if (status) {
        setTodayStatus(status);
        setCache(CACHE_KEYS.TODAY_STATUS, status);
      }
    } catch {
      // safe
    } finally {
      setIsDataLoading(false);
    }
  };

  const handleStartWorkout = () => {
    if (recommendation) {
      startWorkout(recommendation);
    }
  };

  const handleStartAuxiliaryWorkout = async () => {
    setIsStartingAuxiliary(true);
    try {
      const auxPlan = await ApiClient.getAuxiliaryRecommendation();
      if (auxPlan) {
        startWorkout(auxPlan);
      }
    } catch (err) {
      console.error('Failed to start auxiliary workout', err);
    } finally {
      setIsStartingAuxiliary(false);
    }
  };

  const handleCompleteSet = () => {
    completeSet();
  };

  const handleSkipExercise = () => {
    skipExercise();
  };

  const handleSubmitWorkoutLog = async (rpeScore: number) => {
    return await submitWorkout(rpeScore);
  };

  if (isLoading || isDataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3 text-center">
        <div className="w-10 h-10 border-3 border-[#C42126] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-[#5C5C5C] font-semibold">Setting up AI routine...</p>
      </div>
    );
  }

  const isStarted = activeWorkout.isActive;
  const currentPlan =
    activeWorkout.isActive && activeWorkout.recommendation
      ? activeWorkout.recommendation
      : recommendation;
  const exercises = currentPlan?.exercises || [];
  const currentExerciseIndex = activeWorkout.currentExerciseIndex;
  const currentSet = activeWorkout.currentSet;
  const isResting = activeWorkout.isResting;
  const isCompleted = activeWorkout.isCompleted;
  const currentEx = exercises[currentExerciseIndex];
  const totalExercises = exercises.length;

  const totalCalculatedReps = exercises.reduce(
    (acc: number, curr: any) => acc + curr.sets * curr.reps,
    0,
  );

  const hasWorkedOutToday = Boolean(todayStatus?.hasWorkedOutToday);
  const todayWorkout = todayStatus?.todayWorkout;
  const todayRpe = todayWorkout?.rpeScore;

  return (
    <div className="max-w-[1080px] mx-auto px-5 sm:px-8 py-4 sm:py-5 space-y-4 select-none">
      {/* 1A. DAY ALREADY COMPLETED: RECOVERY & OPTIONAL AUXILIARY FINISHER SCREEN */}
      {!isStarted && hasWorkedOutToday ? (
        <div className="space-y-5 max-w-2xl mx-auto py-2">
          {/* Header Strip */}
          <div className="pb-4 border-b border-[#D6D6D2] flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-center sm:text-left">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F5E9] border border-[#2E7D32]/30 text-[#2E7D32] text-xs font-bold uppercase tracking-wider mb-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('workoutDayDoneBadge')}</span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#333333] leading-tight">
                {t('workoutDayDoneTitle')}
              </h1>
              <p className="text-xs sm:text-sm text-[#5C5C5C] mt-1">
                {t('workoutDayDoneSub')}
              </p>
            </div>
            <div className="shrink-0 text-center sm:text-right">
              <span className="text-[11px] text-[#5C5C5C] font-semibold uppercase block">
                {t('streak')}
              </span>
              <span className="font-display text-3xl font-extrabold text-[#C42126] font-telemetry leading-none mt-1 block">
                {todayStatus?.userStats?.currentStreak || 1} {t('days')}
              </span>
            </div>
          </div>

          {/* Completed Workout Summary Tile */}
          <div className="bento-tile p-5 sm:p-6 space-y-4">
            <div className="pb-2.5 border-b border-[#D6D6D2] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#C42126]" />
                <h3 className="text-sm font-bold text-[#333333] uppercase tracking-wider">
                  {t('workoutDayDoneSummary')}
                </h3>
              </div>
              <span className="text-xs text-[#2E7D32] font-bold">
                +{todayWorkout?.earnedXp || 120} XP • +{todayWorkout?.earnedCoins || 10} Coins
              </span>
            </div>

            {/* Telemetry Row */}
            <div className="grid grid-cols-3 divide-x divide-[#D6D6D2] py-2 border-y border-[#D6D6D2] text-center">
              <div className="pr-2">
                <span className="text-[10px] text-[#5C5C5C] font-bold uppercase block">
                  {t('workoutFinishedTime')}
                </span>
                <span className="font-display text-2xl font-extrabold text-[#333333] font-telemetry mt-0.5 block">
                  {Math.max(1, Math.round((todayWorkout?.durationSeconds || 60) / 60))} {t('minutes')}
                </span>
              </div>
              <div className="px-2">
                <span className="text-[10px] text-[#5C5C5C] font-bold uppercase block">
                  {t('workoutFinishedReps')}
                </span>
                <span className="font-display text-2xl font-extrabold text-[#333333] font-telemetry mt-0.5 block">
                  {todayWorkout?.totalReps || totalCalculatedReps}
                </span>
              </div>
              <div className="pl-2">
                <span className="text-[10px] text-[#5C5C5C] font-bold uppercase block">
                  {t('workoutDayDoneRpeLabel')}
                </span>
                <span className="font-display text-base font-extrabold text-[#C42126] font-telemetry mt-1 block">
                  {todayRpe === 1
                    ? `⚡ ${t('rpeEasyTitle')}`
                    : todayRpe === 3
                      ? `🛡️ ${t('rpeHardTitle')}`
                      : `🎯 ${t('rpeOptimalTitle')}`}
                </span>
              </div>
            </div>

            <p className="text-xs text-[#5C5C5C]">
              <strong className="text-[#333333]">
                {todayWorkout?.workoutTitle || 'Calisthenics Hằng Ngày'}
              </strong>{' '}
              —{' '}
              {todayRpe === 1
                ? t('rpeEasySub')
                : todayRpe === 3
                  ? t('rpeHardSub')
                  : t('rpeOptimalSub')}
            </p>
          </div>

          {/* CONDITIONAL BLOCK: RPE === 1 (Quá Dễ) -> Show Auxiliary Finisher Session */}
          {todayRpe === 1 ? (
            <div className="bento-tile p-5 sm:p-6 space-y-4 border-2 border-[#C42126]/30 bg-[#FDE8E9]/25">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#C42126] text-white flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-extrabold text-[#333333] uppercase leading-tight">
                    {t('auxiliaryFinisherTitle')}
                  </h3>
                  <p className="text-xs text-[#5C5C5C] mt-1 leading-relaxed">
                    {t('auxiliaryFinisherSub')}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <GiantButton
                    variant="primary"
                    size="large"
                    icon={<Play className="w-5 h-5 fill-white" />}
                    subtitle="3 bài tập cơ lõi • ~8-10 phút • Không áp lực khớp"
                    onClick={handleStartAuxiliaryWorkout}
                  >
                    {isStartingAuxiliary ? t('auxiliaryLoadingBtn') : t('auxiliaryStartBtn')}
                  </GiantButton>
                </div>
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="px-5 py-3 rounded-xl bg-[#EBEBE6] hover:bg-[#D6D6D2] text-[#333333] text-xs font-bold uppercase transition-colors cursor-pointer text-center"
                >
                  {t('returnDashboardBtn')}
                </button>
              </div>
            </div>
          ) : (
            /* CONDITIONAL BLOCK: RPE === 2 or 3 -> Show Recovery Protocol */
            <div className="bento-tile p-5 sm:p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2E7D32] text-white flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-extrabold text-[#333333] uppercase leading-tight">
                    {t('recoveryRestTitle')}
                  </h3>
                  <p className="text-xs text-[#5C5C5C] mt-1 leading-relaxed">
                    {todayRpe === 3
                      ? t('recoveryRestAdviceHard')
                      : t('recoveryRestAdviceOptimal')}
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <GiantButton
                  variant="primary"
                  size="large"
                  onClick={() => router.push('/')}
                >
                  {t('returnDashboardBtn')}
                </GiantButton>
              </div>

              <div className="text-center pt-1">
                <button
                  type="button"
                  disabled={isStartingAuxiliary}
                  onClick={handleStartAuxiliaryWorkout}
                  className="text-[11px] text-[#5C5C5C] hover:text-[#C42126] font-semibold underline cursor-pointer"
                >
                  {isStartingAuxiliary
                    ? t('auxiliaryLoadingBtn')
                    : 'Tôi vẫn muốn tập thêm bài bổ trợ cơ lõi nhẹ nhàng'}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : !isStarted ? (
        /* 1B. NOT STARTED: WORKOUT PREVIEW SCREEN (Single-Layer Bento + 1px Hairline Rows) */
        <div className="space-y-4">
          {/* Open-Canvas Header + Single-Layer Telemetry Strip */}
          <div className="pb-3.5 border-b border-[#D6D6D2] flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-[#C42126] uppercase tracking-wider">
                {recommendation?.adaptationType === 'PROGRESSION'
                  ? t('progressionBadge')
                  : recommendation?.adaptationType === 'REGRESSION'
                    ? t('regressionBadge')
                    : t('optimalBadge')}
              </span>
              <h1 className="font-display text-[36px] sm:text-[42px] font-extrabold text-[#333333] leading-none mt-1">
                {getWorkoutPlanTitle(recommendation?.title, language) || t('aiTodayTitle')}
              </h1>
            </div>

            {/* Flush 3-Column Hairline Telemetry on Open Canvas (Zero nested cards!) */}
            <div className="flex items-start divide-x divide-[#D6D6D2] text-left shrink-0">
              <div className="pr-5">
                <span className="text-[11px] text-[#5C5C5C] block font-semibold uppercase whitespace-nowrap">
                  {t('workoutFinishedTime')}
                </span>
                <span className="font-display text-3xl font-extrabold text-[#333333] font-telemetry leading-none mt-1.5 block whitespace-nowrap">
                  {recommendation?.estimatedDurationMin} {t('minutes')}
                </span>
              </div>
              <div className="px-5">
                <span className="text-[11px] text-[#5C5C5C] block font-semibold uppercase whitespace-nowrap">
                  {t('exercisesList')}
                </span>
                <span className="font-display text-3xl font-extrabold text-[#333333] font-telemetry leading-none mt-1.5 block whitespace-nowrap">
                  {totalExercises}
                </span>
              </div>
              <div className="pl-5">
                <span className="text-[11px] text-[#5C5C5C] block font-semibold uppercase whitespace-nowrap">
                  {t('xpEarned')}
                </span>
                <span className="font-display text-3xl font-extrabold text-[#2E7D32] font-telemetry leading-none mt-1.5 block whitespace-nowrap">
                  +{recommendation?.totalEstimatedXp} XP
                </span>
              </div>
            </div>
          </div>

          {/* Single-Layer Exercise Roster Tile (#EBEBE6 with 1px #D6D6D2 Hairline Rows) */}
          <div className="bento-tile p-5 sm:p-6">
            {/* Flush AI Adaptation Banner (#FDE8E9 & #C42126) */}
            <div className="-mx-5 sm:-mx-6 -mt-5 sm:-mt-6 mb-3.5 px-5 sm:px-6 py-2.5 bg-[#FDE8E9] border-b border-[#D6D6D2] text-xs text-[#C42126] leading-relaxed">
              <strong>AI Coach:</strong>{' '}
              {getAiExplanation(
                recommendation?.aiExplanation,
                recommendation?.adaptationType,
                language,
                recommendation?.aiExplanationEn,
              )}
            </div>

            <div className="pb-2.5 border-b border-[#D6D6D2] flex items-baseline justify-between">
              <h3 className="text-sm font-bold text-[#333333] uppercase tracking-wider">
                {t('exercisesList')} ({totalExercises})
              </h3>
              <span className="text-xs text-[#5C5C5C]">
                {t('sets')} × {t('reps')}
              </span>
            </div>

            {/* Flush 1px Hairline Rows (Zero nested exercise cards!) */}
            <div className="divide-y divide-[#D6D6D2]">
              {exercises.map((ex: any, idx: number) => (
                <div
                  key={`${ex.exerciseId || ex.slug || 'ex'}-${idx}`}
                  className="py-2.5 flex items-center justify-between gap-4"
                >
                  <div className="flex items-baseline gap-4">
                    <span className="font-telemetry text-sm font-bold text-[#C42126] w-6">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-[#333333] text-sm">
                          {getExerciseName(ex, language)}
                        </h4>
                        {ex.isProgression && (
                          <span className="text-[10px] font-bold text-[#2E7D32] uppercase">
                            • {t('progressionTag')}
                          </span>
                        )}
                        {ex.isRegression && (
                          <span className="text-[10px] font-bold text-[#C42126] uppercase">
                            • {t('recoveryTag')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#5C5C5C] mt-0.5">
                        {ex.equipment} • {ex.restSeconds}s rest
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-telemetry text-base font-bold text-[#333333]">
                      {ex.sets} × {ex.reps}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3.5 border-t border-[#D6D6D2]">
              <GiantButton
                variant="primary"
                size="large"
                icon={<Play className="w-6 h-6 fill-white" />}
                subtitle={
                  language === 'vi'
                    ? 'Sẵn sàng âm thanh & đồng hồ bấm giờ'
                    : 'Audio cues & timers ready'
                }
                onClick={handleStartWorkout}
              >
                {t('startWorkout1Tap')}
              </GiantButton>
            </div>
          </div>
        </div>
      ) : isCompleted ? (
        /* 2A. WORKOUT FINISHED — PENDING RPE SUBMISSION */
        <div className="max-w-xl mx-auto py-4">
          <div className="bento-tile p-6 sm:p-8 text-center space-y-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FDE8E9] border border-[#C42126]/30 text-[#C42126] text-xs font-bold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" />
              <span>{t('pendingRpeBadge')}</span>
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#EBEBE6] border border-[#D6D6D2] text-[#C42126] mx-auto">
                <Trophy className="w-6 h-6" />
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#333333] uppercase leading-none">
                {t('pendingRpeTitle')}
              </h1>
              <p className="text-xs font-semibold text-[#5C5C5C]">
                {getWorkoutPlanTitle(currentPlan?.title, language) || 'Home Workout Routine'}
              </p>
              <p className="text-xs sm:text-sm text-[#5C5C5C] leading-relaxed max-w-md mx-auto">
                {t('pendingRpeDesc')}
              </p>
            </div>

            <div className="grid grid-cols-2 divide-x divide-[#D6D6D2] py-3.5 border-y border-[#D6D6D2] text-center">
              <div className="pr-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#5C5C5C] block">
                  {t('workoutFinishedTime').replace(':', '')}
                </span>
                <span className="font-display text-2xl sm:text-3xl font-extrabold text-[#333333] font-telemetry">
                  {formatTime(activeWorkout.completedDurationSeconds ?? elapsedSeconds)}
                </span>
              </div>
              <div className="pl-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#5C5C5C] block">
                  {t('workoutFinishedReps').replace(':', '')}
                </span>
                <span className="font-display text-2xl sm:text-3xl font-extrabold text-[#2E7D32] font-telemetry">
                  {totalCalculatedReps} {t('reps')}
                </span>
              </div>
            </div>

            <GiantButton
              variant="primary"
              size="large"
              icon={<Zap className="w-5 h-5" />}
              onClick={reopenRpeModal}
            >
              {t('reopenRpeBtn')}
            </GiantButton>

            <div className="flex items-center justify-between pt-2 border-t border-[#D6D6D2]">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="text-xs font-semibold text-[#5C5C5C] hover:text-[#333333] cursor-pointer"
              >
                {t('returnLaterBtn')}
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingDiscard(true)}
                className="text-xs font-semibold text-[#C42126] hover:underline cursor-pointer"
              >
                {t('discardWorkoutBtn')}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* 2B. ACTIVE WORKOUT MODE (Single-Layer Surface + 1px Hairlines) */
        <div className="space-y-6 max-w-2xl mx-auto">
          {/* Open-Canvas Top Status & Stopwatch Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-[#D6D6D2]">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-[#C42126]" />
              <span className="font-display text-4xl font-extrabold text-[#333333] font-telemetry">
                {formatTime(elapsedSeconds)}
              </span>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-[#5C5C5C]">
                {t('exerciseOf')} {currentExerciseIndex + 1} / {totalExercises}
              </span>
              <div className="flex gap-1.5 mt-1.5">
                {exercises.map((_: any, i: number) => (
                  <div
                    key={i}
                    className={`w-6 h-1.5 rounded-full ${
                      i < currentExerciseIndex
                        ? 'bg-[#2E7D32]'
                        : i === currentExerciseIndex
                          ? 'bg-[#C42126]'
                          : 'bg-[#D6D6D2]'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Current Active Exercise Single-Layer Surface */}
          {currentEx && (
            <div className="bento-tile p-6 sm:p-9 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#D6D6D2]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#C42126]">
                  {currentEx.primaryMuscle} • {currentEx.equipment}
                </span>
                <span className="text-xs font-semibold text-[#5C5C5C]">
                  Tier {currentEx.difficulty}
                </span>
              </div>

              <div className="text-center py-2">
                <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-[#333333]">
                  {getExerciseName(currentEx, language)}
                </h2>
                {currentEx.adaptationNote && (
                  <p className="text-xs font-semibold text-[#C42126] mt-2">
                    {currentEx.adaptationNote}
                  </p>
                )}
              </div>

              {/* Flush 2-Column Hairline Split for Current Set & Target Reps (Zero nested boxes!) */}
              <div className="grid grid-cols-2 divide-x divide-[#D6D6D2] py-5 border-y border-[#D6D6D2] text-center">
                <div className="pr-4">
                  <span className="text-xs font-semibold text-[#5C5C5C] uppercase">
                    {t('currentSetLabel')}
                  </span>
                  <div className="font-display text-5xl font-extrabold text-[#333333] mt-1 font-telemetry">
                    {currentSet}{' '}
                    <span className="text-xl font-normal text-[#5C5C5C]">/ {currentEx.sets}</span>
                  </div>
                </div>

                <div className="pl-4">
                  <span className="text-xs font-semibold text-[#C42126] uppercase">
                    {t('targetRepsLabel')}
                  </span>
                  <div className="font-display text-5xl font-extrabold text-[#C42126] mt-1 font-telemetry">
                    {currentEx.reps}{' '}
                    <span className="text-xl font-normal text-[#333333]">{t('reps')}</span>
                  </div>
                </div>
              </div>

              {/* Form Tip inline text */}
              <div className="flex items-start gap-2.5 text-xs text-[#5C5C5C]">
                <Info className="w-4 h-4 text-[#C42126] shrink-0 mt-0.5" />
                <span>{t('formTip')}</span>
              </div>

              {/* Complete Set Button */}
              <div>
                <GiantButton
                  variant="primary"
                  size="giant"
                  icon={<CheckCircle2 className="w-6 h-6" />}
                  subtitle={`Timer ${currentEx.restSeconds}s`}
                  onClick={handleCompleteSet}
                >
                  {t('finishSetBtn')} {currentSet} ➔
                </GiantButton>
              </div>

              {/* Skip & Discard Footer */}
              <div className="flex justify-between items-center pt-3 border-t border-[#D6D6D2]">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleSkipExercise}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#5C5C5C] hover:text-[#333333] cursor-pointer"
                  >
                    <FastForward className="w-4 h-4" />
                    <span>{t('skipExercise')}</span>
                  </button>

                  <button
                    onClick={discardWorkout}
                    className="text-xs font-semibold text-[#C42126] hover:underline cursor-pointer"
                  >
                    {t('discardWorkoutBtn')}
                  </button>
                </div>

                <span className="text-xs text-[#5C5C5C] font-semibold">
                  {t('standardRest')} {currentEx.restSeconds}s
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rest Timer Overlay */}
      {isResting && !isRestModalMinimized && (
        <RestTimerOverlay
          nextExerciseName={currentEx ? getExerciseName(currentEx, language) : 'Next Exercise'}
          nextSetNumber={currentSet}
          onMinimize={minimizeRestModal}
        />
      )}

      {/* Giant RPE Modal */}
      <GiantRpeModal
        isOpen={isCompleted && !activeWorkout.isRpeModalDismissed}
        totalReps={totalCalculatedReps}
        durationSeconds={activeWorkout.completedDurationSeconds ?? elapsedSeconds}
        workoutTitle={getWorkoutPlanTitle(currentPlan?.title, language) || 'Home Workout Routine'}
        onSubmitRpe={handleSubmitWorkoutLog}
        onDismiss={dismissRpeModal}
        onFinishFlow={async () => {
          const status = await ApiClient.getTodayStatus().catch(() => null);
          if (status) {
            setTodayStatus(status);
            setCache(CACHE_KEYS.TODAY_STATUS, status);
          }
          discardWorkout();
        }}
      />

      {/* Explicit Discard Confirmation for Pending RPE Workout */}
      {isConfirmingDiscard && (
        <div
          onClick={() => setIsConfirmingDiscard(false)}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bento-tile p-6 text-center space-y-4"
          >
            <AlertTriangle className="w-8 h-8 text-[#C42126] mx-auto" />
            <div className="space-y-1">
              <h3 className="font-display text-2xl font-bold text-[#333333] uppercase">
                {t('discardConfirmTitle')}
              </h3>
              <p className="text-xs text-[#5C5C5C] leading-relaxed">{t('discardConfirmDesc')}</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsConfirmingDiscard(false);
                  discardWorkout();
                }}
                className="flex-1 py-2.5 px-4 rounded-lg btn-cta-red font-semibold text-xs uppercase cursor-pointer"
              >
                {t('confirmDiscardBtn')}
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingDiscard(false)}
                className="flex-1 py-2.5 px-4 rounded-lg bg-[#F5F5F0] border border-[#D6D6D2] text-[#333333] font-semibold text-xs uppercase cursor-pointer"
              >
                {t('cancelBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
