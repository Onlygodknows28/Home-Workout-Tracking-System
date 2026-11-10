'use client';

import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { CheckCircle2, Circle, Flame, Gift, UserMinus } from 'lucide-react';
import {
  getMissionTitle,
  getFitnessLevelLabel,
  getGoalLabel,
  formatPersonName,
} from '../../lib/catalogTranslations';

interface CoopMissionCardProps {
  buddyData: any;
  onOpenGiftModal: () => void;
  onOpenUnpairModal?: () => void;
}

export function CoopMissionCard({
  buddyData,
  onOpenGiftModal,
  onOpenUnpairModal,
}: CoopMissionCardProps) {
  const { t, language } = useLanguage();

  if (!buddyData || !buddyData.hasBuddy) {
    return null;
  }

  const { partner, mission, sharedStreak } = buddyData;

  return (
    <div className="bento-tile p-5 flex-1 min-h-0 flex flex-col justify-between gap-3.5">
      <div className="space-y-3.5">
        {/* Header with Buddy Info & Shared Streak (Divided by 1px hairline) */}
        <div className="flex items-center justify-between pb-3 border-b border-[#D6D6D2]">
          <div className="flex items-center gap-2.5">
            <img
              src={partner.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=partner'}
              alt={partner.name}
              className="w-9 h-9 rounded-full border border-[#D6D6D2] object-cover bg-[#F5F5F0]"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-[#333333] text-sm leading-snug">
                  {formatPersonName(partner.name, language)}
                </h4>
                <span className="text-[11px] text-[#5C5C5C]">
                  (L{partner.level} • {getFitnessLevelLabel(partner.profile?.fitnessLevel || 'NOVICE', language)})
                </span>
              </div>
              <span className="text-[11px] text-[#5C5C5C] block">
                {t('primaryGoalLabel')}:{' '}
                <strong className="text-[#333333]">
                  {getGoalLabel(partner.profile?.primaryGoal || 'MUSCLE_GAIN', language)}
                </strong>
              </span>
            </div>
          </div>

          {/* Shared Streak Flame */}
          <div className="text-right shrink-0">
            <div className="flex items-center justify-end gap-1 text-[#C42126]">
              <Flame className="w-4 h-4 fill-[#C42126]" />
              <span className="font-display text-xl sm:text-2xl font-extrabold text-[#333333] font-telemetry leading-none">
                {sharedStreak} {t('days')}
              </span>
            </div>
            <span className="text-[10px] text-[#5C5C5C] font-semibold uppercase">{t('streak')}</span>
          </div>
        </div>

        {/* Shared Mission Progress */}
        {mission && (
          <div className="space-y-2.5 pb-3 border-b border-[#D6D6D2]">
            {/* Title & Reward Inline */}
            <div className="flex items-center justify-between gap-2">
              <h5 className="font-bold text-xs sm:text-sm text-[#333333] truncate">
                {getMissionTitle(mission.title, language)}
              </h5>
              <span className="font-telemetry text-xs font-bold text-[#C42126] shrink-0">
                +{mission.rewardCoins} FitCoins
              </span>
            </div>

            {/* Compact Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-semibold">
                <span className="text-[#5C5C5C]">{t('totalRepsContributed')}</span>
                <span className="text-[#333333] font-telemetry font-bold">
                  {mission.totalRepsToday} / {mission.targetReps} {t('reps')} ({mission.missionProgressPercent}%)
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#D6D6D2] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#C42126] rounded-full transition-all duration-500"
                  style={{ width: `${mission.missionProgressPercent}%` }}
                />
              </div>
            </div>

            {/* Single Hairline Row for Partner Status & Sync Light */}
            <div className="pt-2 border-t border-[#D6D6D2] flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 font-semibold text-[#333333]">
                  {mission.myCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32]" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-[#5C5C5C]" />
                  )}
                  <span>{t('you')} ({mission.myProgress}r)</span>
                </span>
                <span className="text-[#D6D6D2]">|</span>
                <span className="flex items-center gap-1 font-semibold text-[#333333]">
                  {mission.partnerCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32]" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-[#5C5C5C]" />
                  )}
                  <span>{formatPersonName(partner.name.split(' ')[0], language)} ({mission.partnerProgress}r)</span>
                </span>
              </div>

              <span
                className={`text-[11px] font-bold shrink-0 ${
                  mission.bothCompleted ? 'text-[#2E7D32]' : 'text-[#C42126]'
                }`}
              >
                {mission.bothCompleted
                  ? (t('syncLightReadyShort') || '✓ Đồng bộ 100%')
                  : (t('syncLightWaitingShort') || '⏳ Chờ bạn tập')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenGiftModal}
          className="flex-1 flex items-center justify-center gap-1.5 bg-[#F5F5F0] hover:bg-[#333333] text-[#333333] hover:text-[#FFFFFF] border border-[#D6D6D2] py-2 px-3 rounded-lg font-semibold text-xs uppercase transition-colors cursor-pointer"
        >
          <Gift className="w-3.5 h-3.5 text-[#C42126]" />
          <span>{t('giftFreezeBtn')}</span>
        </button>

        {onOpenUnpairModal && (
          <button
            onClick={onOpenUnpairModal}
            className="flex items-center justify-center gap-1 bg-[#FDE8E9] hover:bg-[#C42126] text-[#C42126] hover:text-[#FFFFFF] py-2 px-3 rounded-lg font-semibold text-xs uppercase transition-colors cursor-pointer shrink-0"
            title={t('unpairBuddyBtn')}
          >
            <UserMinus className="w-3.5 h-3.5" />
            <span>{t('unpairBuddyBtn')}</span>
          </button>
        )}
      </div>
    </div>
  );
}
