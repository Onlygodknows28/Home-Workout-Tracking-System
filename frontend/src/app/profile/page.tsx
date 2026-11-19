'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useDataCache, CACHE_KEYS } from '../../context/DataCacheContext';
import { ApiClient } from '../../lib/api';
import { useDesktopHeightSync } from '../../lib/utils';
import {
  Flame,
  Shield,
  Coins,
  LogOut,
  ShieldAlert,
  Edit3,
  Check,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  getWorkoutPlanTitle,
  formatPersonName,
  getFitnessLevelLabel,
  getGoalLabel,
  formatInjuryList,
} from '../../lib/catalogTranslations';

const INITIAL_HISTORY_LIMIT = 4;

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, isAuthReady, logout, updateUserProfile } = useAuth();
  const { t, language } = useLanguage();
  const { getCache, setCache, isFresh, isCacheHydrated } = useDataCache();

  const [history, setHistory] = useState<any[]>(() => getCache(CACHE_KEYS.WORKOUT_HISTORY) || []);
  const [isDataLoading, setIsDataLoading] = useState(() => !getCache(CACHE_KEYS.WORKOUT_HISTORY));
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameError, setNameError] = useState('');
  const [nameSuccess, setNameSuccess] = useState('');
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [leftCardRef, leftCardHeight] = useDesktopHeightSync([
    user,
    isDataLoading,
    isEditingName,
  ]);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isAuthReady) return;
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated && isCacheHydrated) {
      loadHistory();
    }
  }, [isAuthenticated, isLoading, isAuthReady, isCacheHydrated]);

  const loadHistory = async (forceSpinner = false) => {
    const cachedHistory = getCache<any[]>(CACHE_KEYS.WORKOUT_HISTORY);

    if (cachedHistory && !forceSpinner) {
      setHistory(cachedHistory);
      setIsDataLoading(false);
      if (isFresh(CACHE_KEYS.WORKOUT_HISTORY, 180000)) {
        return;
      }
    } else if (forceSpinner) {
      setIsDataLoading(true);
    }

    try {
      const logs = await ApiClient.getWorkoutHistory();
      if (logs) {
        setHistory(logs);
        setCache(CACHE_KEYS.WORKOUT_HISTORY, logs);
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

  const handleStartEditName = () => {
    setNameInput(user?.name || '');
    setNameError('');
    setNameSuccess('');
    setIsEditingName(true);
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setNameError('');
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (trimmed.length < 2 || trimmed.length > 60) {
      setNameError(t('nameValidationLength'));
      return;
    }

    if (trimmed === (user?.name || '').trim()) {
      setIsEditingName(false);
      setNameError('');
      return;
    }

    setIsSavingName(true);
    setNameError('');
    try {
      await updateUserProfile({ name: trimmed });
      setIsEditingName(false);
      setNameSuccess(t('nameUpdatedSuccess'));
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
      successTimerRef.current = setTimeout(() => setNameSuccess(''), 3000);
    } catch (err: any) {
      setNameError(err?.message || t('nameValidationLength'));
    } finally {
      setIsSavingName(false);
    }
  };

  if (isLoading || isDataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3 text-center">
        <div className="w-10 h-10 border-3 border-[#C42126] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-[#5C5C5C] font-semibold">Loading profile...</p>
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
    <div className="max-w-[1220px] mx-auto px-5 sm:px-8 py-8 space-y-8">
      {/* 1. Open-Canvas User Profile Header & Telemetry (Zero outer card wrapper!) */}
      <div className="pb-6 border-b border-[#D6D6D2] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={user?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
            alt={user?.name}
            className="w-16 h-16 rounded-full border border-[#D6D6D2] object-cover bg-[#EBEBE6]"
          />
          <div>
            {isEditingName ? (
              <form onSubmit={handleSaveName} className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => {
                      setNameInput(e.target.value);
                      if (nameError) setNameError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') handleCancelEditName();
                    }}
                    maxLength={60}
                    autoFocus
                    disabled={isSavingName}
                    placeholder={t('editNamePlaceholder')}
                    aria-label={t('editNamePlaceholder')}
                    className="px-3 py-1.5 rounded-lg bg-[#FFFFFF] border border-[#D6D6D2] focus:border-[#C42126] focus:outline-none text-base font-bold text-[#333333] min-w-[200px] sm:min-w-[240px]"
                  />
                  <button
                    type="submit"
                    disabled={isSavingName}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#C42126] hover:bg-[#a61b1f] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isSavingName ? t('savingNameBtn') : t('saveNameBtn')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEditName}
                    disabled={isSavingName}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#D6D6D2] bg-[#F5F5F0] hover:bg-[#EBEBE6] text-[#5C5C5C] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>{t('cancelNameBtn')}</span>
                  </button>
                </div>
                {nameError && (
                  <p className="text-xs font-semibold text-[#C42126]">{nameError}</p>
                )}
              </form>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-4xl font-extrabold text-[#333333] leading-none">
                  {formatPersonName(user?.name, language)}
                </h1>
                <span className="font-telemetry text-xs font-bold text-[#C42126]">
                  LV.{user?.level}
                </span>
                <button
                  type="button"
                  onClick={handleStartEditName}
                  title={t('editNameBtn')}
                  aria-label={t('editNameBtn')}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-[#D6D6D2] bg-[#F5F5F0] hover:border-[#C42126] hover:text-[#C42126] text-[#5C5C5C] text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{t('editNameBtn')}</span>
                </button>
              </div>
            )}
            <p className="text-xs text-[#5C5C5C] mt-1">
              {user?.email} •{' '}
              <strong className="text-[#333333]">
                {getFitnessLevelLabel(profile?.fitnessLevel || 'BEGINNER', language)} {t('athlete')}
              </strong>
            </p>
            {nameSuccess && (
              <p className="text-xs font-semibold text-[#2E7D32] mt-1">{nameSuccess}</p>
            )}
          </div>
        </div>

        {/* Flush 3-Column Hairline Telemetry + Logout */}
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center divide-x divide-[#D6D6D2]">
            <div className="pr-5">
              <span className="text-[11px] font-semibold uppercase text-[#5C5C5C] flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-[#C42126]" />
                <span>{t('streak')}</span>
              </span>
              <span className="font-display text-3xl font-extrabold text-[#333333] font-telemetry">
                {user?.currentStreak} {t('days')}
              </span>
            </div>

            <div className="px-5">
              <span className="text-[11px] font-semibold uppercase text-[#5C5C5C] flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-[#C42126]" />
                <span>{t('fitcoins')}</span>
              </span>
              <span className="font-display text-3xl font-extrabold text-[#C42126] font-telemetry">
                {user?.fitCoins}
              </span>
            </div>

            <div className="pl-5">
              <span className="text-[11px] font-semibold uppercase text-[#5C5C5C] flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-[#2E7D32]" />
                <span>{t('freezes')}</span>
              </span>
              <span className="font-display text-3xl font-extrabold text-[#333333] font-telemetry">
                {user?.streakFreezeCount}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 bg-[#FDE8E9] hover:bg-[#C42126] text-[#C42126] hover:text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('navLogout')}</span>
          </button>
        </div>
      </div>

      {/* Multi-Column Grid: 5 Cols Physical Profile (Fixed Natural Height) + 7 Cols Workout History (Flexible Height) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        {/* Left 5 Cols: Single-Layer Physical & Leveling Tile (Fixed height based on its own content) */}
        <div
          ref={leftCardRef}
          className="lg:col-span-5 bento-tile p-6 sm:p-7 space-y-5"
        >
          {/* Level Progress Block */}
          <div className="pb-5 border-b border-[#D6D6D2] space-y-2">
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#333333]">
                {t('levelFormulaTitle')}
              </h3>
              <span className="font-telemetry text-xs font-bold text-[#C42126]">
                L{level} ➔ L{level + 1}
              </span>
            </div>
            <p className="text-xs text-[#5C5C5C] font-mono">{t('formulaText')}</p>
            <div className="pt-1">
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-[#5C5C5C]">{t('currentLevelProgress')}</span>
                <span className="text-[#333333] font-telemetry font-bold">
                  {currentXp} / {xpNext} XP ({progressPercent}%)
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#D6D6D2] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#C42126] rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Physical Metrics Hairline Rows (Zero nested boxes!) */}
          {profile && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#333333] uppercase tracking-wider">
                  {t('physicalHealthProfile')}
                </h3>
                <button
                  onClick={() => router.push('/onboarding')}
                  className="text-xs font-semibold text-[#C42126] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{t('updateBtn')}</span>
                </button>
              </div>

              <div className="divide-y divide-[#D6D6D2] border-y border-[#D6D6D2] text-xs">
                <div className="py-3 flex justify-between">
                  <span className="text-[#5C5C5C]">{t('heightAndWeight')}</span>
                  <span className="font-bold text-[#333333]">
                    {profile.height} cm • {profile.weight} kg
                  </span>
                </div>
                <div className="py-3 flex justify-between">
                  <span className="text-[#5C5C5C]">{t('bmiIndex')}</span>
                  <span className="font-bold text-[#2E7D32] font-telemetry">{profile.bmi}</span>
                </div>
                <div className="py-3 flex justify-between">
                  <span className="text-[#5C5C5C]">{t('pushupTestScore')}</span>
                  <span className="font-bold text-[#333333] font-telemetry">
                    {profile.pushupBaseline} {t('reps')}
                  </span>
                </div>
                <div className="py-3 flex justify-between">
                  <span className="text-[#5C5C5C]">{t('primaryGoalLabel')}</span>
                  <span className="font-bold text-[#C42126]">
                    {getGoalLabel(profile.primaryGoal, language)}
                  </span>
                </div>
              </div>

              {/* Declared Injuries Flush Warning Banner */}
              <div className="pt-1">
                <span className="text-xs font-bold text-[#C42126] flex items-center gap-1.5 mb-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  <span>{t('injuriesFilteredTitle')}</span>
                </span>
                {profile.injuries && profile.injuries.length > 0 ? (
                  <div className="bg-[#FDE8E9] border border-[#C42126]/30 rounded-lg px-3.5 py-2.5 text-xs font-semibold text-[#C42126]">
                    {formatInjuryList(profile.injuries, language)}
                  </div>
                ) : (
                  <p className="text-xs text-[#5C5C5C]">{t('noInjuries')}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right 7 Cols: Single-Layer Workout History Roster
            - Matches Left Card height ONLY when shortened (!showAllHistory && history.length > INITIAL_HISTORY_LIMIT)
            - Flexible height when list is short (<= 4) or expanded (showAllHistory === true) */}
        <div
          style={
            !showAllHistory && history.length > INITIAL_HISTORY_LIMIT && leftCardHeight
              ? { height: `${leftCardHeight}px` }
              : undefined
          }
          className="lg:col-span-7 bento-tile p-6 sm:p-7 flex flex-col justify-between"
        >
          <div>
            <div className="pb-3.5 border-b border-[#D6D6D2] flex items-baseline justify-between">
              <h3 className="text-sm font-bold text-[#333333] uppercase tracking-wider">
                {t('recentHistoryTitle')} ({history.length})
              </h3>
              <span className="text-xs text-[#5C5C5C]">XP &amp; FitCoins Log</span>
            </div>

            <div className="divide-y divide-[#D6D6D2]">
              {(showAllHistory ? history : history.slice(0, INITIAL_HISTORY_LIMIT)).map((log) => {
                const dateStr = new Date(log.completedAt).toLocaleDateString(
                  language === 'vi' ? 'vi-VN' : 'en-US',
                  {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  },
                );

                return (
                  <div
                    key={log.id}
                    className={`${
                      !showAllHistory && history.length > INITIAL_HISTORY_LIMIT
                        ? 'py-2.5'
                        : 'py-3.5'
                    } flex items-center justify-between gap-4`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="font-bold text-[#333333] text-sm">
                          {getWorkoutPlanTitle(log.workoutTitle, language) || log.workoutTitle}
                        </h5>
                        <span
                          className={`text-[11px] font-bold ${
                            log.rpeScore === 1
                              ? 'text-[#2E7D32]'
                              : log.rpeScore === 2
                                ? 'text-[#333333]'
                                : 'text-[#C42126]'
                          }`}
                        >
                          • RPE {log.rpeScore}
                        </span>
                      </div>
                      <p className="text-xs text-[#5C5C5C] mt-0.5">
                        {dateStr} • {Math.round(log.durationSeconds / 60)} {t('minutes')} •{' '}
                        {log.totalReps} {t('reps')}
                      </p>
                    </div>

                    <div className="text-right shrink-0 font-telemetry">
                      <span className="text-sm font-bold text-[#2E7D32] block">
                        +{log.earnedXp} XP
                      </span>
                      <span className="text-xs font-semibold text-[#C42126]">
                        +{log.earnedCoins} Coins
                      </span>
                    </div>
                  </div>
                );
              })}

              {history.length === 0 && (
                <p className="text-xs text-[#5C5C5C] text-center py-8">{t('noHistoryYet')}</p>
              )}
            </div>
          </div>

          {history.length > INITIAL_HISTORY_LIMIT && (
            <div className="pt-3 border-t border-[#D6D6D2] mt-auto">
              <button
                onClick={() => setShowAllHistory((prev) => !prev)}
                className="w-full py-2 px-4 rounded-lg bg-[#F5F5F0] border border-[#D6D6D2] hover:border-[#C42126] hover:text-[#C42126] text-[#333333] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {showAllHistory ? (
                  <>
                    <span>{language === 'vi' ? 'Thu gọn danh sách' : 'Show less'}</span>
                    <ChevronUp className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>
                      {language === 'vi'
                        ? `Xem thêm (${history.length - INITIAL_HISTORY_LIMIT} buổi tập)`
                        : `More (${history.length - INITIAL_HISTORY_LIMIT} more)`}
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
