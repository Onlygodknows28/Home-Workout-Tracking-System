'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useWorkout } from '../../context/WorkoutContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatTime } from '../../lib/utils';
import { getExerciseName } from '../../lib/catalogTranslations';
import {
  Dumbbell,
  Clock,
  ChevronRight,
  X,
  AlertTriangle,
  Timer,
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
    isRestModalMinimized,
    maximizeRestModal,
    completeRest,
    addRestSeconds,
    discardWorkout,
  } = useWorkout();

  const [isConfirmingDiscard, setIsConfirmingDiscard] = useState(false);

  // Determine whether to display the mini bar:
  // 1. If resting and minimized on /workout -> Show resting mini bar
  // 2. If not on /workout and workout is active -> Show mini bar (resting style if resting, active style if working out)
  const isResting = activeWorkout.isResting;
  const isRestingMinimized = isResting && (pathname !== '/workout' || isRestModalMinimized);
  const shouldShow =
    activeWorkout.isActive &&
    !activeWorkout.isCompleted &&
    (pathname !== '/workout' || isRestingMinimized);

  if (!shouldShow) {
    return null;
  }

  const rec = activeWorkout.recommendation;
  const exercises = rec?.exercises || [];
  const currentEx = exercises[activeWorkout.currentExerciseIndex];

  const exerciseName = currentEx ? getExerciseName(currentEx.name, language) : '...';

  // Resume / Expand full-screen view
  const handleResume = () => {
    if (isResting) {
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
        /* FITVANT Floating Glass HUD Rest Timer Bar */
        <div
          onClick={handleResume}
          className="fixed bottom-[68px] left-3 right-3 md:bottom-6 md:right-6 md:left-auto md:w-[440px] z-40 glass-hud text-white border border-[#C8F135]/55 rounded-2xl p-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.7),0_0_24px_rgba(200,241,53,0.16)] cursor-pointer hover:border-[#C8F135] transition-all transform hover:-translate-y-0.5 active:translate-y-0 select-none animate-in fade-in slide-in-from-bottom-4 duration-300"
          role="button"
          tabIndex={0}
          aria-label="Rest timer running in background"
        >
          <div className="flex items-center justify-between gap-3">
            {/* Left Icon with Volt Pulse Beacon */}
            <div className="relative shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-[#C8F135]/15 border border-[#C8F135]/50 text-[#C8F135]">
              <Timer className="w-5 h-5 animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C8F135] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#C8F135]"></span>
              </span>
            </div>

            {/* Middle: Next Exercise Info & Rest Countdown */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] font-black tracking-widest text-[#C8F135] uppercase">
                  {t('restingMiniTitle')}
                </span>
              </div>
              <h4 className="font-extrabold text-sm text-white truncate">
                {t('nextExercisePrep')} {exerciseName}
              </h4>
              <div className="flex items-center space-x-2 text-xs text-[#9BA394] mt-0.5">
                {currentEx && (
                  <>
                    <span className="font-semibold text-[#C2C9BC]">
                      {t('setNumber')} {activeWorkout.currentSet}/{currentEx.sets}
                    </span>
                    <span>•</span>
                  </>
                )}
                <span className="text-[#C8F135] font-telemetry font-black text-base flex items-center space-x-1">
                  <span>⏳</span>
                  <span>{remainingRestSeconds}s</span>
                  {activeWorkout.isRestPaused && (
                    <span className="text-[10px] text-[#FBBF24] font-bold ml-1">
                      ({t('pauseTimer')})
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center space-x-1.5 shrink-0">
              <button
                type="button"
                onClick={handleAdd15s}
                className="px-2 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-black uppercase flex items-center space-x-0.5 transition-colors cursor-pointer active:scale-95"
                title="+15s"
              >
                <Plus className="w-3.5 h-3.5 text-[#C8F135]" />
                <span>15s</span>
              </button>

              <button
                type="button"
                onClick={handleMinus15s}
                className="px-2 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-black uppercase flex items-center space-x-0.5 transition-colors cursor-pointer active:scale-95"
                title="-15s"
              >
                <Minus className="w-3.5 h-3.5 text-[#C8F135]" />
                <span>15s</span>
              </button>

              <button
                type="button"
                onClick={handleStartSetNow}
                className="px-3 py-1.5 rounded-xl bg-[#C8F135] hover:bg-[#D6F858] text-[#0B0F07] text-xs font-black uppercase flex items-center space-x-1 shadow-sm transition-colors cursor-pointer active:scale-95"
                title={t('startSetNowBtn')}
              >
                <Zap className="w-3.5 h-3.5 fill-[#0B0F07]" />
                <span>{t('startSetNowBtn')}</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleResume();
                }}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer active:scale-95"
                title={t('maximizeRestModalBtn')}
                aria-label={t('maximizeRestModalBtn')}
              >
                <Maximize2 className="w-4 h-4 text-[#C8F135]" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* FITVANT Floating Glass HUD Active Workout Bar */
        <div
          onClick={handleResume}
          className="fixed bottom-[68px] left-3 right-3 md:bottom-6 md:right-6 md:left-auto md:w-[390px] z-40 glass-hud text-white border border-[#C8F135]/45 rounded-2xl p-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.7)] cursor-pointer hover:border-[#C8F135] transition-all transform hover:-translate-y-0.5 active:translate-y-0 select-none animate-in fade-in slide-in-from-bottom-4 duration-300"
          role="button"
          tabIndex={0}
          aria-label="Resume workout session"
        >
          <div className="flex items-center justify-between gap-3">
            {/* Left Icon with Volt Pulse Beacon */}
            <div className="relative shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-[#C8F135]/15 border border-[#C8F135]/50 text-[#C8F135]">
              <Dumbbell className="w-5 h-5 animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C8F135] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#C8F135]"></span>
              </span>
            </div>

            {/* Middle: Exercise Name & Status */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] font-black tracking-widest text-[#C8F135] uppercase">
                  {t('miniPlayerTitle')}
                </span>
              </div>
              <h4 className="font-extrabold text-sm text-white truncate">
                {exerciseName}
              </h4>
              <div className="flex items-center space-x-2 text-xs text-[#9BA394] mt-0.5">
                {currentEx && (
                  <>
                    <span className="font-semibold text-[#C2C9BC]">
                      {t('setNumber')} {activeWorkout.currentSet}/{currentEx.sets}
                    </span>
                    <span>•</span>
                  </>
                )}
                <span className="text-white font-telemetry font-black flex items-center space-x-1 text-sm">
                  <Clock className="w-3.5 h-3.5 text-[#C8F135]" />
                  <span>{formatTime(elapsedSeconds)}</span>
                </span>
              </div>
            </div>

            {/* Right Action: Resume and Discard */}
            <div className="flex items-center space-x-1.5 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleResume();
                }}
                className="px-3 py-2 rounded-xl bg-[#C8F135] hover:bg-[#D6F858] text-[#0B0F07] text-xs font-black uppercase flex items-center space-x-1 shadow-sm transition-colors cursor-pointer active:scale-95"
              >
                <span>{t('resumeWorkoutBtn')}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleDiscard}
                className="p-2 rounded-xl text-[#9BA394] hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer active:scale-95"
                title={t('discardWorkoutBtn')}
                aria-label="Discard workout"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Discarding */}
      {isConfirmingDiscard && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="w-full max-w-sm glass-hud border border-rose-500/40 rounded-3xl p-6 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/35 text-rose-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="font-display text-2xl font-black text-white uppercase tracking-wide">
                {t('discardConfirmTitle')}
              </h3>
              <p className="text-xs text-[#9BA394] leading-relaxed font-medium">
                {t('discardConfirmDesc')}
              </p>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={confirmDiscard}
                className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase shadow-sm transition-colors cursor-pointer active:scale-95"
              >
                {t('confirmDiscardBtn')}
              </button>

              <button
                type="button"
                onClick={cancelDiscard}
                className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase transition-colors cursor-pointer active:scale-95"
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
