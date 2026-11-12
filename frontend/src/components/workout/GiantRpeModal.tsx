'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useLanguage } from '../../context/LanguageContext';
import { GiantButton } from '../ui/GiantButton';
import { playSoundCue } from '../../lib/utils';
import {
  Trophy,
  Coins,
  Zap,
  AlertTriangle,
  ArrowRight,
  X,
  CheckCircle2,
  Flame,
  Wind,
} from 'lucide-react';

interface GiantRpeModalProps {
  isOpen: boolean;
  totalReps: number;
  durationSeconds: number;
  workoutTitle: string;
  onSubmitRpe: (rpeScore: number) => Promise<any>;
  onDismiss: () => void;
  onFinishFlow: () => void;
}

export function GiantRpeModal({
  isOpen,
  totalReps,
  durationSeconds,
  workoutTitle,
  onSubmitRpe,
  onDismiss,
  onFinishFlow,
}: GiantRpeModalProps) {
  const { t } = useLanguage();
  const [selectedRpe, setSelectedRpe] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rewardData, setRewardData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reset modal internal state whenever opened/closed
  useEffect(() => {
    if (!isOpen) {
      setSelectedRpe(null);
      setIsSubmitting(false);
      setRewardData(null);
      setErrorMsg(null);
    }
  }, [isOpen]);

  const handleRequestClose = React.useCallback(() => {
    if (isSubmitting) return;
    if (rewardData) {
      onFinishFlow();
    } else {
      onDismiss();
    }
  }, [isSubmitting, rewardData, onFinishFlow, onDismiss]);

  // Allow escaping modal via ESC key without discarding an unsubmitted workout
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleRequestClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleRequestClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleRequestClose();
    }
  };

  const handleSelectRpe = async (score: number) => {
    setSelectedRpe(score);
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await onSubmitRpe(score);
      setRewardData(res?.rewards || res || { earnedXp: 0, earnedCoins: 0 });
      playSoundCue('finish');

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      if (res?.rewards?.hasLeveledUp) {
        setTimeout(() => {
          playSoundCue('levelup');
          confetti({
            particleCount: 120,
            spread: 100,
            origin: { y: 0.5 },
          });
        }, 500);
      }
    } catch (err: any) {
      console.error('Submit workout failed', err);
      setErrorMsg(err.message || 'Error submitting workout log');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Strip leading emoji from instruction if present for cleaner editorial typography
  const cleanInstruction = t('rpeInstruction').replace(/^🎯\s*/, '');

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-[#F5F5F0] border border-[#D6D6D2] rounded-[14px] p-6 sm:p-8 text-[#333333] cursor-default"
      >
        {/* Always Accessible Close Button (X) */}
        <button
          onClick={handleRequestClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-2 text-[#5C5C5C] hover:text-[#C42126] rounded-lg hover:bg-[#EBEBE6] transition-colors cursor-pointer z-10 disabled:opacity-50"
          aria-label="Close modal"
          title="Đóng / Close"
        >
          <X className="w-5 h-5" />
        </button>

        {!rewardData ? (
          <div>
            {/* Editorial Header */}
            <div className="text-center pb-4">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-[#EBEBE6] border border-[#D6D6D2] text-[#C42126] mb-2.5">
                <Trophy className="w-5 h-5" />
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#333333] uppercase tracking-tight leading-none">
                {t('workoutFinishedTitle')}
              </h2>
              {workoutTitle && (
                <p className="text-xs font-semibold text-[#5C5C5C] mt-1">{workoutTitle}</p>
              )}
            </div>

            {/* Flush 2-Column 1px Hairline Telemetry Strip */}
            <div className="grid grid-cols-2 divide-x divide-[#D6D6D2] py-3.5 border-y border-[#D6D6D2] text-center mb-4">
              <div className="pr-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#5C5C5C] block">
                  {t('workoutFinishedTime').replace(':', '')}
                </span>
                <span className="font-display text-2xl sm:text-3xl font-extrabold text-[#333333] font-telemetry">
                  {Math.max(1, Math.round(durationSeconds / 60))} {t('minutes')}
                </span>
              </div>
              <div className="pl-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#5C5C5C] block">
                  {t('workoutFinishedReps').replace(':', '')}
                </span>
                <span className="font-display text-2xl sm:text-3xl font-extrabold text-[#2E7D32] font-telemetry">
                  {totalReps} {t('reps')}
                </span>
              </div>
            </div>

            <p className="text-xs text-[#5C5C5C] text-center mb-4 leading-relaxed">
              {cleanInstruction}
            </p>

            {/* Error Message with Safe Escape Option */}
            {errorMsg && (
              <div className="mb-4 space-y-2.5">
                <div className="bg-[#FDE8E9] border border-[#C42126]/30 rounded-lg p-3 flex items-start gap-2.5 text-[#C42126] text-xs font-semibold">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
                <button
                  onClick={onDismiss}
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 bg-[#EBEBE6] hover:bg-[#D6D6D2] text-[#333333] font-semibold text-xs uppercase rounded-lg border border-[#D6D6D2] transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>{t('rateLaterBtn')}</span>
                </button>
              </div>
            )}

            {/* 3 Harmonized RPE Selection Cards:
                1. TOO EASY: Calm Graphite/Stone (#EBEBE6 / #333333)
                2. OPTIMAL (Sweet Spot): Forest Green (#2E7D32)
                3. TOO HARD (Redline): Crimson Red (#C42126) */}
            <div className="space-y-2.5">
              {/* RPE 1: TOO EASY — Neutral Stone surface with Graphite border */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSelectRpe(1)}
                className="w-full p-4 rounded-xl bg-[#EBEBE6] hover:bg-[#E2E2DC] border border-[#D6D6D2] hover:border-[#333333] text-[#333333] flex items-center justify-between gap-3 text-left transition-all cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F5F5F0] border border-[#D6D6D2] flex items-center justify-center shrink-0 mt-0.5 text-[#333333]">
                    <Wind className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-sm uppercase tracking-wide text-[#333333]">
                      {t('rpeEasyTitle')}
                    </div>
                    <div className="text-xs text-[#5C5C5C] mt-0.5 leading-snug">
                      {t('rpeEasySub')}
                    </div>
                  </div>
                </div>
                <span className="font-telemetry text-xs font-bold text-[#333333] bg-[#F5F5F0] border border-[#D6D6D2] px-2.5 py-1 rounded-md shrink-0">
                  {isSubmitting && selectedRpe === 1 ? '...' : t('progressionTag')}
                </span>
              </button>

              {/* RPE 2: OPTIMAL — Forest Green (#2E7D32) Sweet-Spot Target */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSelectRpe(2)}
                className="w-full p-4 rounded-xl bg-[#2E7D32] hover:bg-[#256628] border border-[#2E7D32] text-[#FFFFFF] flex items-center justify-between gap-3 text-left transition-all cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0 mt-0.5 text-[#FFFFFF]">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-sm uppercase tracking-wide text-[#FFFFFF]">
                      {t('rpeOptimalTitle')}
                    </div>
                    <div className="text-xs text-white/85 mt-0.5 leading-snug">
                      {t('rpeOptimalSub')}
                    </div>
                  </div>
                </div>
                <span className="font-telemetry text-xs font-bold text-[#FFFFFF] bg-white/15 px-2.5 py-1 rounded-md shrink-0">
                  {isSubmitting && selectedRpe === 2 ? '...' : t('overloadTag')}
                </span>
              </button>

              {/* RPE 3: TOO HARD — Crimson Red (#C42126) High Exertion */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSelectRpe(3)}
                className="w-full p-4 rounded-xl bg-[#C42126] hover:bg-[#A3191E] border border-[#C42126] text-[#FFFFFF] flex items-center justify-between gap-3 text-left transition-all cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0 mt-0.5 text-[#FFFFFF]">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-sm uppercase tracking-wide text-[#FFFFFF]">
                      {t('rpeHardTitle')}
                    </div>
                    <div className="text-xs text-white/85 mt-0.5 leading-snug">
                      {t('rpeHardSub')}
                    </div>
                  </div>
                </div>
                <span className="font-telemetry text-xs font-bold text-[#FFFFFF] bg-white/15 px-2.5 py-1 rounded-md shrink-0">
                  {isSubmitting && selectedRpe === 3 ? '...' : t('recoveryTag')}
                </span>
              </button>
            </div>

            {/* Bottom Temporary Dismiss Option */}
            <div className="text-center pt-4">
              <button
                onClick={onDismiss}
                disabled={isSubmitting}
                className="text-xs font-semibold text-[#5C5C5C] hover:text-[#C42126] transition-colors cursor-pointer disabled:opacity-50"
              >
                {t('rateLaterBtn')} ➔
              </button>
            </div>
          </div>
        ) : (
          /* Reward & Gamification Celebration Summary (Single-Layer Hairline Split) */
          <div className="text-center py-2 space-y-5">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#EBEBE6] border border-[#D6D6D2] text-[#C42126] mx-auto">
              <Zap className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-display text-3xl sm:text-4xl font-extrabold text-[#333333] uppercase">
                {t('workoutAwesomeJob')}
              </h3>
              <p className="text-xs sm:text-sm text-[#5C5C5C] mt-1">{t('rpeLoggedSub')}</p>
            </div>

            {/* Anti-Cheat Notice if flagged */}
            {rewardData.isFlaggedCheat && (
              <div className="bg-[#FDE8E9] border border-[#C42126]/30 rounded-lg p-3 text-xs text-[#C42126] font-semibold text-left flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  {rewardData.cheatReason ||
                    'Buổi tập ghi nhận với 0 XP do thời gian hoàn thành quá nhanh.'}
                </span>
              </div>
            )}

            {/* Flush 2-Column Hairline Split for XP & FitCoins */}
            <div className="grid grid-cols-2 divide-x divide-[#D6D6D2] py-4 border-y border-[#D6D6D2]">
              <div className="pr-4 flex flex-col items-center justify-center">
                <span className="text-xs text-[#5C5C5C] font-bold uppercase tracking-wider mb-1">
                  {t('xpEarned')}
                </span>
                <span className="font-display text-3xl font-extrabold text-[#2E7D32] font-telemetry">
                  +{rewardData.earnedXp || 0} XP
                </span>
              </div>

              <div className="pl-4 flex flex-col items-center justify-center">
                <span className="text-xs text-[#5C5C5C] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-[#C42126]" />
                  <span>{t('fitcoinsEarned')}</span>
                </span>
                <span className="font-display text-3xl font-extrabold text-[#C42126] font-telemetry">
                  +{rewardData.earnedCoins || 0}
                </span>
              </div>
            </div>

            {rewardData.hasLeveledUp && (
              <div className="bg-[#EBEBE6] border border-[#C42126] rounded-lg p-4">
                <span className="text-[#C42126] font-bold text-base block">
                  {t('levelUpCongrats')} {rewardData.newLevel}!
                </span>
                <span className="text-xs text-[#5C5C5C]">{t('levelUpSub')}</span>
              </div>
            )}

            <GiantButton
              variant="primary"
              size="large"
              icon={<ArrowRight className="w-5 h-5" />}
              onClick={onFinishFlow}
            >
              {t('backHomeBtn')}
            </GiantButton>
          </div>
        )}
      </div>
    </div>
  );
}
