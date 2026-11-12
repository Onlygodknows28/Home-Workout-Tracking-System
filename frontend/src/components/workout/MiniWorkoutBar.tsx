'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useWorkout } from '../../context/WorkoutContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatTime } from '../../lib/utils';
import { getExerciseName, getWorkoutPlanTitle } from '../../lib/catalogTranslations';
import {
  ChevronRight,
  X,
  AlertTriangle,
  Plus,
  Minus,
  Zap,
  Maximize2,
} from 'lucide-react';

export function MiniWorkoutBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t, language } = useLanguage();
  const {
    activeWorkout,
    elapsedSeconds,
    remainingRestSeconds,
    isMiniBarVisibleOnPath,
    maximizeRestModal,
    reopenRpeModal,
    completeRest,
    addRestSeconds,
    discardWorkout,
  } = useWorkout();

  const [isConfirmingDiscard, setIsConfirmingDiscard] = useState(false);

  const isResting = activeWorkout.isResting;
  const isCompleted = activeWorkout.isCompleted;
  const shouldShow = isMiniBarVisibleOnPath(pathname);

  if (!shouldShow) {
    return null;
  }

  const rec = activeWorkout.recommendation;
  const exercises = rec?.exercises || [];
  const currentEx = exercises[activeWorkout.currentExerciseIndex];
  const exerciseName = currentEx ? getExerciseName(currentEx, language) : '...';
  const dockTitle = isCompleted ? t('miniPendingRpeTitle') : t('miniPlayerTitle');
  const dockHeading = isCompleted
    ? getWorkoutPlanTitle(rec?.title, language) || exerciseName
    : exerciseName;
  const dockCtaLabel = isCompleted ? t('miniSelectRpeBtn') : t('resumeWorkoutBtn');

  const handleResume = () => {
    if (isCompleted) {
      reopenRpeModal();
    } else if (isResting) {
      maximizeRestModal();
    }
    if (pathname !== '/workout') {
      router.push('/workout');
    }
  };

  const handleAdd15s = (e: React.MouseEvent) => {
    e.stopPropagation();
    addRestSeconds(15);
  };

  const handleMinus15s = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (remainingRestSeconds <= 15) {
      completeRest();
      if (pathname !== '/workout') {
        router.push('/workout');
      }
    } else {
      addRestSeconds(-15);
    }
  };

  const handleStartSetNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    completeRest();
    if (pathname !== '/workout') {
      router.push('/workout');
    }
  };

  const handleDiscard = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirmingDiscard(true);
  };

  const confirmDiscard = (e: React.MouseEvent) => {
    e.stopPropagation();
    discardWorkout();
    setIsConfirmingDiscard(false);
  };

  const cancelDiscard = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirmingDiscard(false);
  };

  return (
    <>
      {isResting ? (
        /* Single-Layer Ivory & Crimson Docked Rest Timer Bar */
        <div
          onClick={handleResume}
          className="fixed bottom-[64px] left-3 right-3 md:bottom-5 md:right-5 md:left-auto md:w-[440px] z-40 hud-glass text-[#333333] p-3.5 cursor-pointer hover:border-[#C42126] transition-all select-none"
          role="button"
          tabIndex={0}
          aria-label="Rest timer running in background"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#C42126] animate-pulse" />
                <span className="text-[10px] font-bold tracking-widest text-[#C42126] uppercase">
                  {t('restingMiniTitle')}
                </span>
              </div>
              <h4 className="font-bold text-sm text-[#333333] truncate mt-0.5">
                {t('nextExercisePrep')} {exerciseName}
              </h4>
              <div className="flex items-center gap-2 text-xs text-[#5C5C5C] mt-0.5">
                {currentEx && (
                  <>
                    <span className="font-semibold">
                      {t('setNumber')} {activeWorkout.currentSet}/{currentEx.sets}
                    </span>
                    <span>•</span>
                  </>
                )}
                <span className="text-[#C42126] font-telemetry font-bold text-base">
                  {remainingRestSeconds}s
                </span>
                {activeWorkout.isRestPaused && (
                  <span className="text-[10px] text-[#5C5C5C] font-semibold">
                    ({t('pauseTimer')})
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleMinus15s}
                className="px-2.5 py-1.5 rounded-lg bg-[#EBEBE6] hover:bg-[#D6D6D2] text-[#333333] border border-[#D6D6D2] text-xs font-bold flex items-center gap-0.5 transition-colors cursor-pointer"
                title="-15s"
              >
                <Minus className="w-3 h-3 text-[#C42126]" />
                <span>15s</span>
              </button>

              <button
                type="button"
                onClick={handleAdd15s}
                className="px-2.5 py-1.5 rounded-lg bg-[#EBEBE6] hover:bg-[#D6D6D2] text-[#333333] border border-[#D6D6D2] text-xs font-bold flex items-center gap-0.5 transition-colors cursor-pointer"
                title="+15s"
              >
                <Plus className="w-3 h-3 text-[#C42126]" />
                <span>15s</span>
              </button>

              <button
                type="button"
                onClick={handleStartSetNow}
                className="px-3 py-1.5 rounded-lg btn-cta-red text-xs font-semibold flex items-center gap-1 cursor-pointer"
                title={t('startSetNowBtn')}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{t('startSetNowBtn')}</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleResume();
                }}
                className="p-1.5 rounded-lg bg-[#EBEBE6] hover:bg-[#D6D6D2] text-[#333333] transition-colors cursor-pointer"
                title={t('maximizeRestModalBtn')}
                aria-label={t('maximizeRestModalBtn')}
              >
                <Maximize2 className="w-4 h-4 text-[#C42126]" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Single-Layer Ivory & Crimson Active Workout / Pending RPE Dock Bar */
        <div
          onClick={handleResume}
          className="fixed bottom-[64px] left-3 right-3 md:bottom-5 md:right-5 md:left-auto md:w-[390px] z-40 hud-glass text-[#333333] p-3.5 cursor-pointer hover:border-[#C42126] transition-all select-none"
          role="button"
          tabIndex={0}
          aria-label={isCompleted ? 'Open RPE rating modal' : 'Resume workout session'}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isCompleted ? 'bg-[#C42126] animate-pulse' : 'bg-[#2E7D32]'
                  }`}
                />
                <span
                  className={`text-[10px] font-bold tracking-widest uppercase ${
                    isCompleted ? 'text-[#C42126]' : 'text-[#5C5C5C]'
                  }`}
                >
                  {dockTitle}
                </span>
              </div>
              <h4 className="font-bold text-sm text-[#333333] truncate mt-0.5">{dockHeading}</h4>
              <div className="flex items-center gap-2 text-xs text-[#5C5C5C] mt-0.5">
                {!isCompleted && currentEx && (
                  <>
                    <span className="font-semibold">
                      {t('setNumber')} {activeWorkout.currentSet}/{currentEx.sets}
                    </span>
                    <span>•</span>
                  </>
                )}
                <span className="text-[#333333] font-telemetry font-bold text-sm">
                  {formatTime(elapsedSeconds)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleResume();
                }}
                className="px-3 py-1.5 rounded-lg btn-cta-red text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>{dockCtaLabel}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleDiscard}
                className="p-1.5 rounded-lg text-[#5C5C5C] hover:text-[#C42126] hover:bg-[#FDE8E9] transition-colors cursor-pointer"
                title={t('discardWorkoutBtn')}
                aria-label="Discard workout"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {isConfirmingDiscard && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="w-full max-w-sm bento-tile p-6 text-center space-y-4">
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
                onClick={confirmDiscard}
                className="flex-1 py-2.5 px-4 rounded-lg btn-cta-red font-semibold text-xs uppercase cursor-pointer"
              >
                {t('confirmDiscardBtn')}
              </button>

              <button
                type="button"
                onClick={cancelDiscard}
                className="flex-1 py-2.5 px-4 rounded-lg bg-[#F5F5F0] border border-[#D6D6D2] text-[#333333] font-semibold text-xs uppercase cursor-pointer"
              >
                {t('cancelBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
