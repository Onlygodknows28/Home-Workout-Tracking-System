'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useDataCache } from '../../context/DataCacheContext';
import { ApiClient } from '../../lib/api';
import {
  Flame,
  Shield,
  Coins,
  Scale,
  History,
  LogOut,
  Sparkles,
  ShieldAlert,
  Edit3,
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { t } = useLanguage();
  const { getCache, setCache, isFresh } = useDataCache();

  const [history, setHistory] = useState<any[]>(() => getCache('workout_history') || []);
  const [isDataLoading, setIsDataLoading] = useState(() => !getCache('workout_history'));

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      loadHistory();
    }
  }, [isAuthenticated, isLoading]);

  const loadHistory = async (forceSpinner = false) => {
    if (!forceSpinner && isFresh('workout_history', 60000)) {
      setHistory(getCache('workout_history') || []);
      setIsDataLoading(false);
      return;
    }

    if (!getCache('workout_history') || forceSpinner) {
      setIsDataLoading(true);
    }
    try {
      const logs = await ApiClient.getWorkoutHistory();
      if (logs) {
        setHistory(logs);
        setCache('workout_history', logs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDataLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (isLoading || isDataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3 text-center">
        <div className="w-10 h-10 border-4 border-[#52B72B] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-bold">Loading profile...</p>
      </div>
    );
  }

  const profile = user?.profile;
  const currentXp = user?.xp || 0;
  const level = user?.level || 1;
  const xpCurrent = Math.pow(level - 1, 2) * 100;
  const xpNext = Math.pow(level, 2) * 100;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round(((currentXp - xpCurrent) / (xpNext - xpCurrent)) * 100)),
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. User Profile Hero Card */}
      <div className="bg-white border-2 border-[#D8EACF] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img
                src={user?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                alt={user?.name}
                className="w-20 h-20 rounded-3xl border-2 border-[#52B72B] object-cover bg-[#F5FAF2]"
              />
              <span className="absolute -bottom-1 -right-1 bg-[#52B72B] text-xs font-black text-white px-2 py-0.5 rounded-lg shadow-sm">
                L{user?.level}
              </span>
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#1B3815]">{user?.name}</h2>
              <p className="text-xs text-slate-500">{user?.email}</p>
              <span className="inline-block text-xs bg-[#EAF6E5] text-[#1B3815] font-black px-3 py-0.5 rounded-full mt-1.5 border border-[#D8EACF] uppercase">
                {profile?.fitnessLevel || 'BEGINNER'} {t('athlete')}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-1.5 self-start sm:self-auto bg-[#FEE2E2] hover:bg-[#FECACA] text-[#DC2626] font-bold text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('navLogout')}</span>
          </button>
        </div>

        {/* 3 Metrics Row */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#EAF6E5]">
          <div className="bg-[#FEF3C7] p-4 rounded-2xl text-center border border-[#F59E0B]">
            <div className="flex items-center justify-center space-x-1 text-[#D97706] mb-1">
              <Flame className="w-4 h-4 fill-[#D97706]" />
              <span className="text-xs font-black uppercase">{t('streak')}</span>
            </div>
            <span className="text-xl sm:text-2xl font-black text-[#1B3815]">{user?.currentStreak} {t('days')}</span>
          </div>

          <div className="bg-[#EAF6E5] p-4 rounded-2xl text-center border border-[#52B72B]">
            <div className="flex items-center justify-center space-x-1 text-[#52B72B] mb-1">
              <Coins className="w-4 h-4 fill-[#52B72B]" />
              <span className="text-xs font-black uppercase">{t('fitcoins')}</span>
            </div>
            <span className="text-xl sm:text-2xl font-black text-[#1B3815]">{user?.fitCoins}</span>
          </div>

          <div className="bg-[#EFF6FF] p-4 rounded-2xl text-center border border-[#3B82F6]">
            <div className="flex items-center justify-center space-x-1 text-[#2563EB] mb-1">
              <Shield className="w-4 h-4 fill-[#2563EB]" />
              <span className="text-xs font-black uppercase">{t('freezes')}</span>
            </div>
            <span className="text-xl sm:text-2xl font-black text-[#1B3815]">{user?.streakFreezeCount}</span>
          </div>
        </div>
      </div>

      {/* Multi-Column Desktop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (6 cols): Leveling + Physical Profile */}
        <div className="lg:col-span-6 space-y-6">
          {/* Mathematical Leveling Interpolation Details */}
          <div className="bg-[#1B3815] text-white border-2 border-[#2E4E26] rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-[#FBBF24]" />
                <h3 className="text-sm font-black uppercase tracking-wider text-white">
                  {t('levelFormulaTitle')}
                </h3>
              </div>
              <span className="text-xs font-black text-[#FBBF24] font-mono">
                L{level} ➔ L{level + 1}
              </span>
            </div>

            <div className="bg-[#11240D] p-3.5 rounded-2xl border border-[#2E4E26] text-xs text-white/90 font-mono">
              {t('formulaText')}
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-white/80">{t('currentLevelProgress')}</span>
                <span className="text-[#FBBF24]">{currentXp} / {xpNext} XP ({progressPercent}%)</span>
              </div>
              <div className="w-full h-3 bg-[#11240D] rounded-full overflow-hidden p-0.5 border border-[#2E4E26]">
                <div
                  className="h-full bg-[#52B72B] rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Static Physical & Health Profile */}
          {profile && (
            <div className="bg-white border-2 border-[#D8EACF] rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Scale className="w-5 h-5 text-[#52B72B]" />
                  <h3 className="text-sm font-black text-[#1B3815] uppercase tracking-wider">
                    {t('physicalHealthProfile')}
                  </h3>
                </div>
                <button
                  onClick={() => router.push('/onboarding')}
                  className="text-xs font-black text-[#52B72B] flex items-center space-x-1 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{t('updateBtn')}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-[#FAFCF8] p-3.5 rounded-2xl border border-[#D8EACF]">
                  <span className="text-slate-500 block font-bold">{t('heightAndWeight')}</span>
                  <span className="text-[#1B3815] font-black text-sm mt-0.5 block">
                    {profile.height} cm • {profile.weight} kg
                  </span>
                </div>

                <div className="bg-[#FAFCF8] p-3.5 rounded-2xl border border-[#D8EACF]">
                  <span className="text-slate-500 block font-bold">{t('bmiIndex')}</span>
                  <span className="text-[#52B72B] font-black text-sm mt-0.5 block">
                    {profile.bmi}
                  </span>
                </div>

                <div className="bg-[#FAFCF8] p-3.5 rounded-2xl border border-[#D8EACF]">
                  <span className="text-slate-500 block font-bold">{t('pushupTestScore')}</span>
                  <span className="text-[#1B3815] font-black text-sm mt-0.5 block">
                    {profile.pushupBaseline} {t('reps')}
                  </span>
                </div>

                <div className="bg-[#FAFCF8] p-3.5 rounded-2xl border border-[#D8EACF]">
                  <span className="text-slate-500 block font-bold">{t('primaryGoalLabel')}</span>
                  <span className="text-[#52B72B] font-black text-sm mt-0.5 block">
                    {profile.primaryGoal}
                  </span>
                </div>
              </div>

              {/* Declared Injuries Tag */}
              <div className="pt-2 border-t border-[#EAF6E5]">
                <span className="text-xs font-bold text-[#DC2626] block mb-2 flex items-center space-x-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  <span>{t('injuriesFilteredTitle')}</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {profile.injuries && profile.injuries.length > 0 ? (
                    profile.injuries.map((inj: string) => (
                      <span
                        key={inj}
                        className="bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5] text-xs font-black px-3 py-1 rounded-xl"
                      >
                        🛡️ {inj}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 bg-[#FAFCF8] px-3 py-1 rounded-xl font-medium">
                      {t('noInjuries')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (6 cols): Workout History Logs */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white border-2 border-[#D8EACF] rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
            <div className="flex items-center space-x-2">
              <History className="w-5 h-5 text-[#52B72B]" />
              <h3 className="text-sm font-black text-[#1B3815] uppercase tracking-wider">
                {t('recentHistoryTitle')} ({history.length})
              </h3>
            </div>

            <div className="space-y-3">
              {history.map((log) => {
                const dateStr = new Date(log.completedAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={log.id}
                    className="bg-[#FAFCF8] border border-[#D8EACF] rounded-2xl p-4 flex items-center justify-between space-x-3"
                  >
                    <div>
                      <h5 className="font-black text-[#1B3815] text-sm leading-tight">
                        {log.workoutTitle}
                      </h5>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">
                        {dateStr} • {Math.round(log.durationSeconds / 60)} {t('minutes')} • {log.totalReps} {t('reps')}
                      </p>
                      <div className="mt-1.5">
                        <span
                          className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                            log.rpeScore === 1
                              ? 'bg-[#EAF6E5] text-[#52B72B] border border-[#52B72B]'
                              : log.rpeScore === 2
                              ? 'bg-[#FEF3C7] text-[#D97706] border border-[#F59E0B]'
                              : 'bg-[#FEE2E2] text-[#DC2626] border border-[#DC2626]'
                          }`}
                        >
                          RPE {log.rpeScore} ({log.rpeScore === 1 ? 'Easy' : log.rpeScore === 2 ? 'Optimal' : 'Hard'})
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-black text-[#52B72B] block">
                        +{log.earnedXp} XP
                      </span>
                      <span className="text-xs font-black text-[#D97706]">
                        +{log.earnedCoins} Coins
                      </span>
                    </div>
                  </div>
                );
              })}

              {history.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-6 font-medium">
                  {t('noHistoryYet')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
