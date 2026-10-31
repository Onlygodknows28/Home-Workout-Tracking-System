'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useLanguage } from '../../context/LanguageContext';
import { GiantButton } from '../ui/GiantButton';
import { playSoundCue } from '../../lib/utils';
import { Trophy, Coins, Zap, AlertTriangle, ArrowRight, X } from 'lucide-react';

interface GiantRpeModalProps {
  isOpen: boolean;
  totalReps: number;
  durationSeconds: number;
  estimatedDurationMin: number;
  workoutTitle: string;
  onSubmitRpe: (rpeScore: number) => Promise<any>;
  onFinishFlow: () => void;
}

export function GiantRpeModal({
  isOpen,
  totalReps,
  durationSeconds,
  estimatedDurationMin,
  workoutTitle,
  onSubmitRpe,
  onFinishFlow,
}: GiantRpeModalProps) {
  const { t } = useLanguage();
  const [selectedRpe, setSelectedRpe] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rewardData, setRewardData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Allow escaping modal via ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onFinishFlow();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onFinishFlow]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onFinishFlow();
    }
  };

  const handleSelectRpe = async (score: number) => {
    setSelectedRpe(score);
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await onSubmitRpe(score);
      setRewardData(res.rewards || res);
      playSoundCue('finish');

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      if (res.rewards?.hasLeveledUp) {
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

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-white border-2 border-[#D8EACF] rounded-3xl p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200 cursor-default"
      >
        {/* Always Accessible Close Button (X) */}
        <button
          onClick={onFinishFlow}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-[#1B3815] rounded-full hover:bg-[#EAF6E5] transition-colors cursor-pointer z-10"
          aria-label="Close modal"
          title="Đóng / Close"
        >
          <X className="w-6 h-6" />
        </button>

        {!rewardData ? (
          <div>
            {/* Header */}
            <div className="text-center mb-6 pr-6">
              <span className="inline-block p-4 rounded-2xl bg-[#EAF6E5] text-[#52B72B] mb-3">
                <Trophy className="w-9 h-9" />
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#1B3815]">{t('workoutFinishedTitle')}</h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
                {t('workoutFinishedTime')} <strong className="text-[#52B72B]">{Math.round(durationSeconds / 60)} {t('minutes')}</strong> • {t('workoutFinishedReps')} <strong className="text-[#52B72B]">{totalReps}</strong>
              </p>
              <div className="mt-3 bg-[#EAF6E5] rounded-2xl p-3 border border-[#D8EACF]">
                <p className="text-xs text-[#1B3815] font-bold">
                  {t('rpeInstruction')}
                </p>
              </div>
            </div>

            {/* Error Message with Safe Escape Option */}
            {errorMsg && (
              <div className="mb-5 space-y-3">
                <div className="bg-[#FEE2E2] border border-[#DC2626] rounded-2xl p-4 flex items-start space-x-3 text-[#991B1B] text-xs font-bold">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-[#DC2626] mt-0.5" />
                  <div>
                    <span className="block font-black">Thông Báo Hệ Thống:</span>
                    <span className="font-medium leading-relaxed">{errorMsg}</span>
                  </div>
                </div>
                <button
                  onClick={onFinishFlow}
                  className="w-full py-3 px-4 bg-[#F5FAF2] hover:bg-[#EAF6E5] text-[#1B3815] font-black text-xs uppercase rounded-xl border border-[#D8EACF] transition-colors cursor-pointer flex items-center justify-center space-x-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>{t('backHomeBtn')}</span>
                </button>
              </div>
            )}

            {/* 3 Giant Emotion / RPE Buttons (Flat Colors, No Gradient) */}
            <div className="space-y-3.5">
              <GiantButton
                variant="success"
                size="giant"
                icon="🟢"
                subtitle={t('rpeEasySub')}
                badge={t('progressionTag')}
                isLoading={isSubmitting && selectedRpe === 1}
                disabled={isSubmitting}
                onClick={() => handleSelectRpe(1)}
              >
                {t('rpeEasyTitle')}
              </GiantButton>

              <GiantButton
                variant="warning"
                size="giant"
                icon="🟡"
                subtitle={t('rpeOptimalSub')}
                badge={t('overloadTag')}
                isLoading={isSubmitting && selectedRpe === 2}
                disabled={isSubmitting}
                onClick={() => handleSelectRpe(2)}
              >
                {t('rpeOptimalTitle')}
              </GiantButton>

              <GiantButton
                variant="danger"
                size="giant"
                icon="🔴"
                subtitle={t('rpeHardSub')}
                badge={t('recoveryTag')}
                isLoading={isSubmitting && selectedRpe === 3}
                disabled={isSubmitting}
                onClick={() => handleSelectRpe(3)}
              >
                {t('rpeHardTitle')}
              </GiantButton>
            </div>

            {/* Bottom Escape Option */}
            <div className="text-center pt-4">
              <button
                onClick={onFinishFlow}
                className="text-xs font-bold text-slate-400 hover:text-[#1B3815] transition-colors cursor-pointer"
              >
                {t('backHomeBtn')} ➔
              </button>
            </div>
          </div>
        ) : (
          /* Reward & Gamification Celebration Summary */
          <div className="text-center py-4 space-y-5">
            <div className="w-16 h-16 rounded-full bg-[#EAF6E5] text-[#52B72B] mx-auto flex items-center justify-center shadow-sm">
              <Zap className="w-8 h-8 fill-[#52B72B]" />
            </div>

            <div>
              <h3 className="text-2xl sm:text-3xl font-black text-[#1B3815]">{t('workoutAwesomeJob')}</h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
                {t('rpeLoggedSub')}
              </p>
            </div>

            {/* Anti-Cheat Notice if flagged */}
            {rewardData.isFlaggedCheat && (
              <div className="bg-[#FEF3C7] border border-[#F59E0B] rounded-2xl p-3 text-xs text-[#92400E] font-bold text-left flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-[#D97706] mt-0.5" />
                <span>{rewardData.cheatReason || 'Buổi tập ghi nhận với 0 XP do thời gian hoàn thành quá nhanh.'}</span>
              </div>
            )}

            {/* Reward Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#EAF6E5] border border-[#D8EACF] rounded-2xl p-4 flex flex-col items-center justify-center">
                <span className="text-xs text-[#52B72B] font-black uppercase tracking-wider mb-1">
                  {t('xpEarned')}
                </span>
                <span className="text-2xl font-black text-[#1B3815]">
                  +{rewardData.earnedXp || 0} XP
                </span>
              </div>

              <div className="bg-[#FEF3C7] border border-[#F59E0B] rounded-2xl p-4 flex flex-col items-center justify-center">
                <span className="text-xs text-[#D97706] font-black uppercase tracking-wider mb-1 flex items-center space-x-1">
                  <Coins className="w-3.5 h-3.5 mr-1" /> {t('fitcoinsEarned')}
                </span>
                <span className="text-2xl font-black text-[#D97706]">
                  +{rewardData.earnedCoins || 0}
                </span>
              </div>
            </div>

            {rewardData.hasLeveledUp && (
              <div className="bg-[#FEF3C7] border-2 border-[#F59E0B] rounded-2xl p-4">
                <span className="text-[#D97706] font-black text-lg block">
                  {t('levelUpCongrats')} {rewardData.newLevel}!
                </span>
                <span className="text-xs text-slate-700">
                  {t('levelUpSub')}
                </span>
              </div>
            )}

            <GiantButton
              variant="dark"
              size="large"
              icon={<ArrowRight className="w-6 h-6" />}
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
