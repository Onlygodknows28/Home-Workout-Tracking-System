'use client';

import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { UserPlus, Check } from 'lucide-react';
import {
  formatPersonName,
  getFitnessLevelLabel,
  getGoalLabel,
} from '../../lib/catalogTranslations';

interface Candidate {
  userId: string;
  name: string;
  avatar: string;
  bmi: number;
  fitnessLevel: string;
  pushupBaseline: number;
  primaryGoal: string;
  similarityScore: number;
}

interface RadarMatchmakerProps {
  candidates: Candidate[];
  onConnect: (userId: string) => Promise<boolean | void>;
}

export function RadarMatchmaker({ candidates, onConnect }: RadarMatchmakerProps) {
  const { t, language } = useLanguage();
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [connectedId, setConnectedId] = useState<string | null>(null);

  const handleConnect = async (userId: string) => {
    setConnectingId(userId);
    try {
      const success = await onConnect(userId);
      if (success !== false) {
        setConnectedId(userId);
      }
    } catch {
      // Silent error handling
    } finally {
      setConnectingId(null);
    }
  };

  return (
    <div className="bento-tile p-6 sm:p-8">
      {/* Editorial Roster Header */}
      <div className="pb-4 border-b border-[#D6D6D2] flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-[#333333]">{t('radarHeaderTitle')}</h3>
          <p className="text-xs text-[#5C5C5C] mt-0.5">{t('radarHeaderDesc')}</p>
        </div>
        <span className="font-telemetry text-xs font-semibold text-[#C42126]">
          Cosine Similarity Roster
        </span>
      </div>

      {/* Single-Layer Candidate Roster (Flush 1px #D6D6D2 Hairline Rows — Zero nested cards!) */}
      <div className="divide-y divide-[#D6D6D2]">
        {candidates.map((cand, idx) => {
          const isConnected = connectedId === cand.userId;

          return (
            <div
              key={cand.userId}
              className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 min-w-0">
                {/* Unboxed Tabular Cosine Similarity Score */}
                <span
                  className={`font-display text-[38px] font-extrabold leading-none font-telemetry w-16 shrink-0 ${
                    idx === 0 ? 'text-[#C42126]' : 'text-[#333333]'
                  }`}
                >
                  {cand.similarityScore}%
                </span>

                <img
                  src={cand.avatar}
                  alt={cand.name}
                  className="w-11 h-11 rounded-full border border-[#D6D6D2] object-cover shrink-0 bg-[#F5F5F0]"
                />

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h5 className="font-bold text-[#333333] text-base truncate">
                      {formatPersonName(cand.name, language)}
                    </h5>
                    <span className="text-xs text-[#5C5C5C]">
                      • {getFitnessLevelLabel(cand.fitnessLevel, language)}
                    </span>
                  </div>
                  <p className="text-xs text-[#5C5C5C] mt-0.5 truncate">
                    {t('goalLabel')}:{' '}
                    <strong className="text-[#333333]">
                      {getGoalLabel(cand.primaryGoal, language)}
                    </strong>{' '}
                    • BMI: <strong>{cand.bmi}</strong> • Push-up Test:{' '}
                    <strong>{cand.pushupBaseline} reps</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleConnect(cand.userId)}
                disabled={connectingId === cand.userId || isConnected}
                className={`px-4 py-2.5 rounded-lg font-semibold text-xs shrink-0 transition-colors flex items-center gap-1.5 cursor-pointer ${
                  isConnected
                    ? 'bg-[#2E7D32] text-[#FFFFFF]'
                    : 'bg-[#333333] hover:bg-[#C42126] text-[#FFFFFF]'
                }`}
              >
                {isConnected ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{t('pairedBtn')}</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{t('pairBtn')}</span>
                  </>
                )}
              </button>
            </div>
          );
        })}

        {candidates.length === 0 && (
          <div className="text-center py-10 text-[#5C5C5C]">
            <p className="text-sm font-semibold">{t('radarScanning')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
