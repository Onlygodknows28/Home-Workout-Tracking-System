'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useDataCache } from '../../context/DataCacheContext';
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
  Dumbbell,
  FastForward,
  Info,
  Play,
  Sparkles,
} from 'lucide-react';

export default function WorkoutPlayerPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t, language } = useLanguage();
  const { getCache, setCache, isFresh } = useDataCache();

  const {
    activeWorkout,
    elapsedSeconds,
    remainingRestSeconds,
    isRestModalMinimized,
    minimizeRestModal,
    addRestSeconds,
    startWorkout,
    completeSet,
    skipExercise,
    completeRest,
    submitWorkout,
  } = useWorkout();

  // If there is an ongoing workout, use its recommendation; otherwise use cached/fetched recommendation
  const [recommendation, setRecommendation] = useState<any>(() => {
    if (activeWorkout.isActive && activeWorkout.recommendation) {
      return activeWorkout.recommendation;
    }
    return getCache('workout_plan') || getCache('home_rec');
  });

  const [isDataLoading, setIsDataLoading] = useState(
    () => !activeWorkout.isActive && !getCache('workout_plan') && !getCache('home_rec')
  );

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated && !activeWorkout.isActive) {
      loadPlan();
    }
  }, [isAuthenticated, isLoading, activeWorkout.isActive]);

  const loadPlan = async (forceSpinner = false) => {
    if (!forceSpinner && (isFresh('workout_plan', 60000) || isFresh('home_rec', 60000))) {
      setRecommendation(getCache('workout_plan') || getCache('home_rec'));
      setIsDataLoading(false);
      return;
    }

    if ((!getCache('workout_plan') && !getCache('home_rec')) || forceSpinner) {
      setIsDataLoading(true);
    }
    try {
      const rec = await ApiClient.getDailyRecommendation();
      if (rec) {
        setRecommendation(rec);
        setCache('workout_plan', rec);
        setCache('home_rec', rec);
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

  const handleCompleteSet = () => {
    completeSet();
  };

  const handleRestComplete = React.useCallback(() => {
    completeRest();
  }, [completeRest]);

  const handleSkipExercise = () => {
    skipExercise();
  };

  const handleSubmitWorkoutLog = async (rpeScore: number) => {
    return await submitWorkout(rpeScore);
  };

  if (isLoading || isDataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3 text-center">
        <div className="w-10 h-10 border-4 border-[#52B72B] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-bold">Setting up AI routine...</p>
      </div>
    );
  }

  const isStarted = activeWorkout.isActive;
  const currentPlan = activeWorkout.isActive && activeWorkout.recommendation ? activeWorkout.recommendation : recommendation;
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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 select-none">
      {/* 1. NOT STARTED: WORKOUT PREVIEW SCREEN */}
      {!isStarted ? (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white border-2 border-[#D8EACF] rounded-3xl p-6 sm:p-10 shadow-sm space-y-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-[#52B72B]" />
              <span className="text-xs font-black text-[#52B72B] uppercase tracking-wider">
                {recommendation?.adaptationType === 'PROGRESSION'
                  ? t('progressionBadge')
                  : recommendation?.adaptationType === 'REGRESSION'
                  ? t('regressionBadge')
                  : t('optimalBadge')}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-[#1B3815] leading-tight">
              {getWorkoutPlanTitle(recommendation?.title, language) || t('aiTodayTitle')}
            </h1>

            <p className="text-sm text-[#2E4E26] bg-[#EAF6E5] p-4 rounded-2xl border border-[#D8EACF] leading-relaxed font-medium">
              💡 {getAiExplanation(recommendation?.aiExplanation, recommendation?.adaptationType, language)}
            </p>

            <div className="grid grid-cols-3 gap-3 pt-2 text-center">
              <div className="bg-[#FAFCF8] p-3.5 rounded-2xl border border-[#D8EACF]">
                <span className="text-xs text-slate-500 block font-bold">{t('workoutFinishedTime')}</span>
                <span className="text-base sm:text-lg font-black text-[#1B3815]">
                  {recommendation?.estimatedDurationMin} {t('minutes')}
                </span>
              </div>
              <div className="bg-[#FAFCF8] p-3.5 rounded-2xl border border-[#D8EACF]">
                <span className="text-xs text-slate-500 block font-bold">{t('exercisesList')}</span>
                <span className="text-base sm:text-lg font-black text-[#1B3815]">
                  {totalExercises}
                </span>
              </div>
              <div className="bg-[#FAFCF8] p-3.5 rounded-2xl border border-[#D8EACF]">
                <span className="text-xs text-slate-500 block font-bold">{t('xpEarned')}</span>
                <span className="text-base sm:text-lg font-black text-[#52B72B]">
                  +{recommendation?.totalEstimatedXp} XP
                </span>
              </div>
            </div>
          </div>

          {/* Exercise List Grid */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-[#1B3815] uppercase tracking-wider">
              {t('exercisesList')} ({totalExercises})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {exercises.map((ex: any, idx: number) => (
                <div
                  key={`${ex.exerciseId || ex.slug || 'ex'}-${idx}`}
                  className="bg-white border-2 border-[#D8EACF] rounded-2xl p-4 flex items-center justify-between space-x-3"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#EAF6E5] text-[#52B72B] font-black text-sm flex items-center justify-center shrink-0 border border-[#52B72B]">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-extrabold text-[#1B3815] text-sm">{getExerciseName(ex, language)}</h4>
                        {ex.isProgression && (
                          <span className="bg-[#FBBF24] text-[#1B3815] text-[10px] font-black px-1.5 py-0.2 rounded-md">
                            {t('progressionTag')}
                          </span>
                        )}
                        {ex.isRegression && (
                          <span className="bg-[#2563EB] text-white text-[10px] font-black px-1.5 py-0.2 rounded-md">
                            {t('recoveryTag')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {ex.equipment} • {ex.restSeconds}s rest
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-black text-[#52B72B] block">
                      {ex.sets} × {ex.reps}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">{t('sets')} × {t('reps')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Start Button */}
          <GiantButton
            variant="primary"
            size="giant"
            icon={<Play className="w-7 h-7 fill-white" />}
            subtitle={language === 'vi' ? 'Sẵn sàng âm thanh & đồng hồ bấm giờ' : 'Audio cues & timers ready'}
            onClick={handleStartWorkout}
          >
            {t('startWorkout1Tap')}
          </GiantButton>
        </div>
      ) : (
        /* 2. ACTIVE WORKOUT MODE */
        <div className="space-y-6 max-w-3xl mx-auto">
          {/* Top Workout Status & Live Stopwatch */}
          <div className="flex items-center justify-between bg-white border-2 border-[#D8EACF] rounded-2xl px-5 py-4 shadow-sm">
            <div className="flex items-center space-x-2.5">
              <Clock className="w-6 h-6 text-[#52B72B]" />
              <span className="font-black text-2xl text-[#1B3815] font-mono">
                {formatTime(elapsedSeconds)}
              </span>
            </div>

            <div className="text-right">
              <span className="text-xs font-black text-slate-500">
                {t('exerciseOf')} {currentExerciseIndex + 1} / {totalExercises}
              </span>
              <div className="flex space-x-1.5 mt-1">
                {exercises.map((_: any, i: number) => (
                  <div
                    key={i}
                    className={`w-6 h-2 rounded-full ${
                      i < currentExerciseIndex
                        ? 'bg-[#52B72B]'
                        : i === currentExerciseIndex
                        ? 'bg-[#FBBF24]'
                        : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Current Active Exercise Card */}
          {currentEx && (
            <div className="bg-white border-2 border-[#52B72B] rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-[#52B72B] bg-[#EAF6E5] px-3.5 py-1 rounded-full border border-[#D8EACF]">
                  {currentEx.primaryMuscle} • {currentEx.equipment}
                </span>
                <span className="text-xs font-black text-[#D97706]">
                  Tier: {'⭐'.repeat(currentEx.difficulty)}
                </span>
              </div>

              <div className="text-center py-2">
                <h2 className="text-3xl sm:text-4xl font-black text-[#1B3815] leading-tight">
                  {getExerciseName(currentEx, language)}
                </h2>
                {currentEx.adaptationNote && (
                  <span className="inline-block text-xs font-black text-[#1B3815] bg-[#FBBF24] px-3.5 py-1 rounded-full mt-3">
                    💡 {currentEx.adaptationNote}
                  </span>
                )}
              </div>

              {/* Set Counter & Target Reps Highlight */}
              <div className="grid grid-cols-2 gap-4 py-2">
                <div className="bg-[#FAFCF8] border border-[#D8EACF] rounded-2xl p-5 text-center">
                  <span className="text-xs font-black text-slate-500 uppercase">{t('currentSetLabel')}</span>
                  <div className="text-4xl font-black text-[#1B3815] mt-1">
                    {currentSet} <span className="text-base font-normal text-slate-400">/ {currentEx.sets}</span>
                  </div>
                </div>

                <div className="bg-[#EAF6E5] border border-[#52B72B] rounded-2xl p-5 text-center">
                  <span className="text-xs font-black text-[#52B72B] uppercase">{t('targetRepsLabel')}</span>
                  <div className="text-4xl font-black text-[#52B72B] mt-1">
                    {currentEx.reps} <span className="text-base font-normal text-[#1B3815]">{t('reps')}</span>
                  </div>
                </div>
              </div>

              {/* Tip */}
              <div className="bg-[#FAFCF8] rounded-2xl p-4 border border-[#D8EACF] flex items-start space-x-3 text-xs sm:text-sm text-slate-700 font-medium">
                <Info className="w-5 h-5 text-[#52B72B] shrink-0 mt-0.5" />
                <span>
                  {t('formTip')}
                </span>
              </div>

              {/* Complete Set Button */}
              <div className="pt-2">
                <GiantButton
                  variant="success"
                  size="giant"
                  icon={<CheckCircle2 className="w-8 h-8 fill-white" />}
                  subtitle={`Timer ${currentEx.restSeconds}s`}
                  onClick={handleCompleteSet}
                >
                  {t('finishSetBtn')} {currentSet} ➔
                </GiantButton>
              </div>

              {/* Skip */}
              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={handleSkipExercise}
                  className="flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-[#1B3815] py-2 px-3 rounded-xl cursor-pointer"
                >
                  <FastForward className="w-4 h-4" />
                  <span>{t('skipExercise')}</span>
                </button>

                <span className="text-xs text-slate-500 font-bold">
                  {t('standardRest')} {currentEx.restSeconds}s
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rest Timer Overlay (Full Screen Modal) */}
      {isResting && !isRestModalMinimized && (
        <RestTimerOverlay
          nextExerciseName={currentEx ? getExerciseName(currentEx, language) : 'Next Exercise'}
          nextSetNumber={currentSet}
          onMinimize={minimizeRestModal}
        />
      )}

      {/* Giant RPE Modal */}
      <GiantRpeModal
        isOpen={isCompleted}
        totalReps={totalCalculatedReps}
        durationSeconds={elapsedSeconds}
        estimatedDurationMin={currentPlan?.estimatedDurationMin || 15}
        workoutTitle={getWorkoutPlanTitle(currentPlan?.title, language) || 'Home Workout Routine'}
        onSubmitRpe={handleSubmitWorkoutLog}
        onFinishFlow={() => router.push('/')}
      />
    </div>
  );
}
