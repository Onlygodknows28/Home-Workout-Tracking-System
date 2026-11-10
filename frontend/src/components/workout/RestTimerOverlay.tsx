'use client';

import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useWorkout } from '../../context/WorkoutContext';
import { GiantButton } from '../ui/GiantButton';
import { formatTime } from '../../lib/utils';
import { FastForward, Plus, Minus, Pause, Play, Minimize2, X } from 'lucide-react';

interface RestTimerOverlayProps {
  nextExerciseName: string;
  nextSetNumber: number;
  onMinimize?: () => void;
}

export function RestTimerOverlay({
  nextExerciseName,
  nextSetNumber,
  onMinimize,
}: RestTimerOverlayProps) {
  const { t } = useLanguage();
  const {
    activeWorkout,
    remainingRestSeconds,
    togglePauseRest,
    addRestSeconds,
    completeRest,
    minimizeRestModal,
  } = useWorkout();

  const isPaused = activeWorkout.isRestPaused;
  const totalSeconds = Math.max(1, activeWorkout.restTotalSeconds || 45);
  const timeLeft = remainingRestSeconds;

  const handleMinimize = () => {
    if (onMinimize) {
      onMinimize();
    } else {
      minimizeRestModal();
    }
  };

  const progressPercent =
    totalSeconds > 0 ? Math.min(100, Math.max(0, Math.round((timeLeft / totalSeconds) * 100))) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-[#F5F5F0]/95 backdrop-blur-md text-[#333333] flex items-center justify-center p-5 select-none">
      <div className="w-full max-w-[540px] bento-tile p-7 sm:p-9 text-center space-y-6">
        {/* Top Header Row */}
        <div className="flex items-center justify-between pb-4 border-b border-[#D6D6D2]">
          <button
            type="button"
            onClick={handleMinimize}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#C42126] hover:underline cursor-pointer"
            title={t('minimizeRestModalBtn')}
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>{t('minimizeRestModalBtn')}</span>
          </button>

          <span className="text-xs font-bold uppercase tracking-widest text-[#5C5C5C]">
            {t('restTimerTitle')} • {t('setNumber')} {nextSetNumber}
          </span>

          <button
            type="button"
            onClick={handleMinimize}
            className="p-1.5 rounded-lg text-[#5C5C5C] hover:text-[#333333] transition-colors cursor-pointer"
            title={t('minimizeRestModalBtn')}
            aria-label="Minimize"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Next Exercise Info */}
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#5C5C5C] block">
            {t('preparingFor')}
          </span>
          <h3 className="font-display font-extrabold text-3xl sm:text-4xl text-[#333333] mt-1">
            {nextExerciseName}
          </h3>
        </div>

        {/* Giant Tabular Chronometer Directly on Surface */}
        <div className="py-2">
          <div className="font-display text-[104px] sm:text-[116px] font-extrabold text-[#333333] leading-none font-telemetry">
            {formatTime(timeLeft)}
          </div>
          {isPaused && (
            <span className="inline-block text-xs font-bold text-[#C42126] uppercase mt-2">
              {t('pauseTimer')}
            </span>
          )}
        </div>

        {/* 1px Hairline Progress Track */}
        <div className="w-full h-1.5 bg-[#D6D6D2] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#C42126] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Controls Row (-15s / Pause / +15s) */}
        <div className="flex items-center justify-center gap-3 pb-6 border-b border-[#D6D6D2]">
          <button
            type="button"
            onClick={() => addRestSeconds(-15)}
            className="px-4 sm:px-5 py-2.5 rounded-xl bg-[#F5F5F0] border border-[#D6D6D2] hover:border-[#333333] text-sm sm:text-base font-extrabold text-[#333333] font-telemetry flex items-center gap-1.5 cursor-pointer transition-colors active:scale-95"
          >
            <Minus className="w-4 h-4 sm:w-5 sm:h-5 text-[#C42126] stroke-[2.5]" />
            <span>{t('minus15s')}</span>
          </button>

          <button
            type="button"
            onClick={togglePauseRest}
            className="px-6 sm:px-7 py-2.5 rounded-xl bg-[#333333] hover:bg-[#1F1F1F] text-[#FFFFFF] text-sm sm:text-base font-bold flex items-center gap-2 cursor-pointer transition-colors active:scale-95"
          >
            {isPaused ? (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>{t('resumeTimer')}</span>
              </>
            ) : (
              <>
                <Pause className="w-4 h-4 fill-white" />
                <span>{t('pauseTimer')}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => addRestSeconds(15)}
            className="px-4 sm:px-5 py-2.5 rounded-xl bg-[#F5F5F0] border border-[#D6D6D2] hover:border-[#333333] text-sm sm:text-base font-extrabold text-[#333333] font-telemetry flex items-center gap-1.5 cursor-pointer transition-colors active:scale-95"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-[#C42126] stroke-[2.5]" />
            <span>{t('add15s')}</span>
          </button>
        </div>

        {/* Skip / Start Next Set */}
        <GiantButton
          variant="primary"
          size="large"
          icon={<FastForward className="w-5 h-5" />}
          onClick={completeRest}
        >
          {t('startNextSet')}
        </GiantButton>
      </div>
    </div>
  );
}
