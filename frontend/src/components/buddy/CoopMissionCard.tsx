'use client';

import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Users, CheckCircle2, Circle, Flame, Gift, Sparkles, UserMinus } from 'lucide-react';
import {
  getMissionTitle,
  getMissionDesc,
  getFitnessLevelLabel,
  getGoalLabel,
} from '../../lib/catalogTranslations';

interface CoopMissionCardProps {
  buddyData: any;
  onOpenGiftModal: () => void;
  onOpenUnpairModal?: () => void;
}

export function CoopMissionCard({ buddyData, onOpenGiftModal, onOpenUnpairModal }: CoopMissionCardProps) {
  const { t, language } = useLanguage();

  if (!buddyData || !buddyData.hasBuddy) {
    return null;
  }

  const { partner, mission, sharedStreak } = buddyData;

  return (
    <div className="bg-white border-2 border-[#D8EACF] rounded-3xl p-6 shadow-sm space-y-4">
      {/* Header with Buddy Info & Shared Streak */}
      <div className="flex items-center justify-between pb-3 border-b border-[#EAF6E5]">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img
              src={partner.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=partner'}
              alt={partner.name}
              className="w-12 h-12 rounded-2xl border-2 border-[#52B72B] object-cover bg-[#F5FAF2]"
            />
            <span className="absolute -bottom-1 -right-1 bg-[#52B72B] text-[10px] font-black text-white px-1.5 py-0.2 rounded-md">
              L{partner.level}
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h4 className="font-extrabold text-[#1B3815] text-base">{partner.name}</h4>
              <span className="text-xs text-slate-500 font-bold">({getFitnessLevelLabel(partner.profile?.fitnessLevel || 'NOVICE', language)})</span>
            </div>
            <span className="text-xs text-slate-500">
              {t('primaryGoalLabel')}: <strong className="text-[#52B72B]">{getGoalLabel(partner.profile?.primaryGoal || 'MUSCLE_GAIN', language)}</strong>
            </span>
          </div>
        </div>

        {/* Shared Streak Flame */}
        <div className="flex flex-col items-end">
          <div className="flex items-center space-x-1 bg-[#FEF3C7] border border-[#F59E0B] px-3 py-1 rounded-full">
            <Flame className="w-4 h-4 text-[#D97706] fill-[#D97706]" />
            <span className="font-black text-sm text-[#1B3815]">{sharedStreak} {t('days')}</span>
          </div>
          <span className="text-[10px] text-slate-500 font-bold mt-0.5">{t('streak')}</span>
        </div>
      </div>

      {/* Shared Mission Progress */}
      {mission && (
        <div className="bg-[#FAFCF8] border border-[#D8EACF] rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#52B72B]" />
              <h5 className="font-extrabold text-sm text-[#1B3815]">{getMissionTitle(mission.title, language)}</h5>
            </div>
            <span className="text-xs font-black text-[#1B3815] bg-[#FBBF24] px-2.5 py-0.5 rounded-full">
              +{mission.rewardCoins} FitCoins
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed font-medium">{getMissionDesc(mission.description, language)}</p>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-slate-600">{t('totalRepsContributed')}</span>
              <span className="text-[#52B72B] font-black">
                {mission.totalRepsToday} / {mission.targetReps} {t('reps')} ({mission.missionProgressPercent}%)
              </span>
            </div>
            <div className="w-full h-3 bg-[#EAF6E5] rounded-full overflow-hidden p-0.5 border border-[#D8EACF]">
              <div
                className="h-full bg-[#52B72B] rounded-full transition-all duration-500"
                style={{ width: `${mission.missionProgressPercent}%` }}
              />
            </div>
          </div>

          {/* Individual Status Sync Light */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#EAF6E5]">
            {/* My Status */}
            <div
              className={`flex items-center space-x-2 p-2.5 rounded-xl border ${
                mission.myCompleted
                  ? 'bg-[#EAF6E5] border-[#52B72B] text-[#1B3815]'
                  : 'bg-white border-slate-200 text-slate-400'
              }`}
            >
              {mission.myCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-[#52B72B] shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-slate-300 shrink-0" />
              )}
              <div className="flex flex-col text-left">
                <span className="text-xs font-extrabold text-[#1B3815]">{t('you')}</span>
                <span className="text-[10px] font-bold opacity-80">
                  {mission.myCompleted ? t('statusCompleted') : t('statusNotDone')}
                </span>
              </div>
            </div>

            {/* Partner Status */}
            <div
              className={`flex items-center space-x-2 p-2.5 rounded-xl border ${
                mission.partnerCompleted
                  ? 'bg-[#EAF6E5] border-[#52B72B] text-[#1B3815]'
                  : 'bg-white border-slate-200 text-slate-400'
              }`}
            >
              {mission.partnerCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-[#52B72B] shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-slate-300 shrink-0" />
              )}
              <div className="flex flex-col text-left">
                <span className="text-xs font-extrabold text-[#1B3815]">{partner.name.split(' ')[0]}</span>
                <span className="text-[10px] font-bold opacity-80">
                  {mission.partnerCompleted ? t('statusCompleted') : t('statusNotDone')}
                </span>
              </div>
            </div>
          </div>

          {/* Sync Light Banner */}
          <div
            className={`p-3 rounded-xl text-center text-xs font-black transition-colors ${
              mission.bothCompleted
                ? 'bg-[#52B72B] text-white'
                : 'bg-[#EAF6E5] text-[#1B3815] border border-[#D8EACF]'
            }`}
          >
            {mission.bothCompleted ? t('syncLightBoth') : t('syncLightWaiting')}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
        <button
          onClick={onOpenGiftModal}
          className="flex-1 flex items-center justify-center space-x-2 bg-white hover:bg-[#F5FAF2] border-2 border-[#1B3815] text-[#1B3815] py-3.5 px-4 rounded-2xl font-black text-xs uppercase transition-colors cursor-pointer"
        >
          <Gift className="w-4 h-4 text-[#52B72B]" />
          <span>{t('giftFreezeBtn')}</span>
        </button>

        {onOpenUnpairModal && (
          <button
            onClick={onOpenUnpairModal}
            className="flex items-center justify-center space-x-1.5 bg-white hover:bg-rose-50 border-2 border-rose-200 hover:border-rose-400 text-rose-600 py-3.5 px-5 rounded-2xl font-black text-xs uppercase transition-colors cursor-pointer shrink-0"
            title={t('unpairBuddyBtn')}
          >
            <UserMinus className="w-4 h-4 text-rose-500" />
            <span>{t('unpairBuddyBtn')}</span>
          </button>
        )}
      </div>
    </div>
  );
}
