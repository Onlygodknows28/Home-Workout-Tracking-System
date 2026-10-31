'use client';

import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Users, UserPlus, Check } from 'lucide-react';

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
  const { t } = useLanguage();
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
      // Bắt lỗi âm thầm, không dùng console.error để tránh bật overlay lỗi của Next.js
    } finally {
      setConnectingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Radar Visual Header */}
      <div className="bg-[#EAF6E5] border-2 border-[#D8EACF] rounded-3xl p-6 sm:p-8 text-center relative overflow-hidden">
        <div className="relative z-10 max-w-xl mx-auto space-y-3">
          <div className="w-14 h-14 rounded-full bg-[#52B72B] text-white mx-auto flex items-center justify-center shadow-md">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-[#1B3815]">{t('radarHeaderTitle')}</h3>
          <p className="text-xs sm:text-sm text-[#2E4E26] leading-relaxed font-medium">
            {t('radarHeaderDesc')}
          </p>
        </div>
      </div>

      {/* Candidate List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {candidates.map((cand) => {
          const isConnected = connectedId === cand.userId;

          return (
            <div
              key={cand.userId}
              className="bg-white border-2 border-[#D8EACF] hover:border-[#52B72B] rounded-3xl p-5 shadow-sm transition-all flex items-center justify-between space-x-3"
            >
              <div className="flex items-center space-x-3.5 min-w-0">
                <img
                  src={cand.avatar}
                  alt={cand.name}
                  className="w-14 h-14 rounded-2xl border-2 border-[#52B72B] object-cover shrink-0 bg-[#F5FAF2]"
                />
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <h5 className="font-black text-[#1B3815] text-base truncate">{cand.name}</h5>
                    <span className="bg-[#52B72B] text-white text-xs font-black px-2 py-0.5 rounded-full shrink-0">
                      {cand.similarityScore}% {t('compatibility')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 truncate">
                    BMI: <strong>{cand.bmi}</strong> • Test: <strong>{cand.pushupBaseline} reps</strong>
                  </p>
                  <p className="text-xs text-[#52B72B] font-bold truncate">
                    {cand.primaryGoal}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleConnect(cand.userId)}
                disabled={connectingId === cand.userId || isConnected}
                className={`min-h-[48px] px-5 rounded-xl font-black text-xs shrink-0 transition-all flex items-center space-x-1.5 cursor-pointer ${
                  isConnected
                    ? 'bg-[#EAF6E5] text-[#1B3815] border border-[#52B72B]'
                    : 'bg-[#1B3815] hover:bg-[#11240D] text-white'
                }`}
              >
                {isConnected ? (
                  <>
                    <Check className="w-4 h-4 text-[#52B72B]" />
                    <span>{t('pairedBtn')}</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>{t('pairBtn')}</span>
                  </>
                )}
              </button>
            </div>
          );
        })}

        {candidates.length === 0 && (
          <div className="col-span-2 text-center py-10 text-slate-500 bg-white rounded-3xl border border-[#D8EACF]">
            <p className="text-sm font-bold">{t('radarScanning')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
