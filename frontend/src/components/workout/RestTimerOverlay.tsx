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
  // Backwards compatibility props:
  initialSeconds?: number;
  totalDurationSeconds?: number;
  onTimerComplete?: () => void;
  onAddTime?: (sec: number) => void;
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

  // SVG Circular progress calculation
  const radius = 96;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = totalSeconds > 0 ? Math.min(1, Math.max(0, timeLeft / totalSeconds)) : 0;
  const strokeDashoffset = circumference - progressRatio * circumference;

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0E07]/95 backdrop-blur-2xl text-white flex flex-col items-center justify-between p-6 select-none animate-in fade-in duration-150 overflow-hidden">
      {/* Ambient Volt Spotlight */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[560px] volt-spotlight opacity-80 z-0" />

      {/* Top Header Navigation Bar with Minimize Button */}
      <div className="relative z-10 w-full max-w-2xl flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={handleMinimize}
          className="flex items-center space-x-2 px-4 py-2 rounded-full bg-[#141C0F] hover:bg-[#1C2715] text-white text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer border border-white/15 hover:border-[#C8F135]/50 active:scale-95"
          title={t('minimizeRestModalBtn')}
        >
          <Minimize2 className="w-4 h-4 text-[#C8F135]" />
          <span>{t('minimizeRestModalBtn')}</span>
        </button>

        <span className="text-xs font-black uppercase tracking-widest text-[#0B0F07] bg-[#C8F135] px-4 py-1.5 rounded-full shadow-[0_0_16px_rgba(200,241,53,0.3)]">
          {t('restTimerTitle')}
        </span>

        <button
          type="button"
          onClick={handleMinimize}
          className="p-2.5 rounded-full bg-[#141C0F] hover:bg-[#1C2715] border border-white/15 text-[#9BA394] hover:text-white transition-all cursor-pointer active:scale-95"
          title={t('minimizeRestModalBtn')}
          aria-label="Minimize"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Exercise Info */}
      <div className="relative z-10 text-center pt-2 max-w-lg">
        <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#9BA394] block">
          {t('preparingFor')}
        </span>
        <h3 className="font-display font-black text-3xl sm:text-4xl text-[#C8F135] mt-1 tracking-wide uppercase">
          {nextExerciseName}
        </h3>
        <p className="text-xs sm:text-sm text-white/80 mt-1 font-extrabold uppercase tracking-wider">
          {t('setNumber')} {nextSetNumber}
        </p>
      </div>

      {/* Center Giant Countdown with SVG Circular Progress Ring */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto space-y-7">
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
          {/* SVG Progress Ring */}
          <svg className="w-full h-full -rotate-90" viewBox="0 0 220 220">
            {/* Background Track */}
            <circle
              cx="110"
              cy="110"
              r={radius}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="8"
              fill="transparent"
            />
            {/* Active Progress Stroke */}
            <circle
              cx="110"
              cy="110"
              r={radius}
              stroke="#C8F135"
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-[stroke-dashoffset] duration-200 drop-shadow-[0_0_12px_rgba(200,241,53,0.45)]"
            />
          </svg>

          {/* Time Display Inside Circle */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-telemetry text-6xl sm:text-7xl font-black text-white tracking-tight">
              {formatTime(timeLeft)}
            </span>
            {isPaused && (
              <span className="text-[11px] font-black text-[#FBBF24] uppercase tracking-wider mt-1.5 bg-[#141C0F] px-3 py-0.5 rounded-full border border-[#FBBF24]/50">
                {t('pauseTimer')}
              </span>
            )}
          </div>
        </div>

        {/* Quick Action Controls (+15s, -15s, Pause/Resume) */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => addRestSeconds(15)}
            className="flex items-center space-x-1 text-xs font-black text-white bg-[#141C0F] hover:bg-[#1E2A16] border border-white/15 hover:border-[#C8F135]/50 px-4 py-2.5 rounded-full active:scale-95 transition-all uppercase cursor-pointer"
            title="Thêm 15 giây"
          >
            <Plus className="w-3.5 h-3.5 text-[#C8F135]" />
            <span>{t('add15s')}</span>
          </button>

          <button
            type="button"
            onClick={() => addRestSeconds(-15)}
            className="flex items-center space-x-1 text-xs font-black text-white bg-[#141C0F] hover:bg-[#1E2A16] border border-white/15 hover:border-[#C8F135]/50 px-4 py-2.5 rounded-full active:scale-95 transition-all uppercase cursor-pointer"
            title="Bớt 15 giây"
          >
            <Minus className="w-3.5 h-3.5 text-[#C8F135]" />
            <span>{t('minus15s')}</span>
          </button>

          <button
            type="button"
            onClick={togglePauseRest}
            className="flex items-center space-x-1.5 text-xs font-black text-[#0B0F07] bg-[#C8F135]/90 hover:bg-[#C8F135] px-4 py-2.5 rounded-full active:scale-95 transition-all uppercase cursor-pointer"
          >
            {isPaused ? (
              <>
                <Play className="w-3.5 h-3.5 fill-[#0B0F07]" />
                <span>{t('resumeTimer')}</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5 fill-[#0B0F07]" />
                <span>{t('pauseTimer')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Bottom Giant Skip / Continue Button */}
      <div className="relative z-10 w-full max-w-md pb-6">
        <GiantButton
          variant="primary"
          size="giant"
          icon={<FastForward className="w-6 h-6" />}
          subtitle="Ready for next set"
          onClick={completeRest}
        >
          {t('startNextSet')}
        </GiantButton>
      </div>
    </div>
  );
}
