'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useDataCache, CACHE_KEYS } from '../../context/DataCacheContext';
import { ApiClient } from '../../lib/api';
import { CoopMissionCard } from '../../components/buddy/CoopMissionCard';
import { RadarMatchmaker } from '../../components/buddy/RadarMatchmaker';
import { GiftFreezeModal } from '../../components/buddy/GiftFreezeModal';
import { BuddyLimitModal } from '../../components/buddy/BuddyLimitModal';
import { UnpairConfirmModal } from '../../components/buddy/UnpairConfirmModal';
import { Users } from 'lucide-react';
import { formatPersonName } from '../../lib/catalogTranslations';

export default function BuddyPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, isAuthReady, refreshUser } = useAuth();
  const { t, language } = useLanguage();
  const { getCache, setCache, isFresh, invalidate, isCacheHydrated } = useDataCache();

  const [activeTab, setActiveTab] = useState<'my-buddy' | 'radar'>('my-buddy');
  const [buddyData, setBuddyData] = useState<any>(() => getCache(CACHE_KEYS.BUDDY_DATA));
  const [candidates, setCandidates] = useState<any[]>(
    () => getCache(CACHE_KEYS.BUDDY_CANDIDATES) || [],
  );
  const [isDataLoading, setIsDataLoading] = useState(() => !getCache(CACHE_KEYS.BUDDY_DATA));
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [isUnpairModalOpen, setIsUnpairModalOpen] = useState(false);
  const [limitModalState, setLimitModalState] = useState<{
    isOpen: boolean;
    errorMessage?: string;
  }>({ isOpen: false });

  useEffect(() => {
    if (!isAuthReady) return;
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated && isCacheHydrated) {
      loadData();
    }
  }, [isAuthenticated, isLoading, isAuthReady, isCacheHydrated]);

  const loadData = async (forceSpinner = false) => {
    const cachedBuddy = getCache<any>(CACHE_KEYS.BUDDY_DATA);
    const cachedCandidates = getCache<any[]>(CACHE_KEYS.BUDDY_CANDIDATES);

    if (cachedBuddy && !forceSpinner) {
      setBuddyData(cachedBuddy);
      if (cachedCandidates) setCandidates(cachedCandidates);
      setIsDataLoading(false);
      if (isFresh(CACHE_KEYS.BUDDY_DATA, 180000) && isFresh(CACHE_KEYS.BUDDY_CANDIDATES, 180000)) {
        return;
      }
    } else if (forceSpinner) {
      setIsDataLoading(true);
    }

    try {
      const [myBuddy, matches] = await Promise.all([
        ApiClient.getMyBuddy().catch(() => null),
        ApiClient.findBuddyMatches().catch(() => []),
      ]);

      if (myBuddy) {
        setBuddyData(myBuddy);
        setCache(CACHE_KEYS.BUDDY_DATA, myBuddy);
      }
      if (matches) {
        setCandidates(matches);
        setCache(CACHE_KEYS.BUDDY_CANDIDATES, matches);
      }

      if (!myBuddy?.hasBuddy && !cachedBuddy) {
        setActiveTab('radar');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDataLoading(false);
    }
  };

  const handleConnectBuddy = async (targetUserId: string): Promise<boolean> => {
    if (buddyData?.hasBuddy) {
      setLimitModalState({
        isOpen: true,
        errorMessage: t('buddyLimitDesc'),
      });
      return false;
    }

    try {
      await ApiClient.connectBuddy(targetUserId);
      invalidate('buddy_');
      await Promise.all([refreshUser(), loadData(true)]);
      setActiveTab('my-buddy');
      return true;
    } catch (err: any) {
      setLimitModalState({
        isOpen: true,
        errorMessage: err.message || t('buddyLimitDesc'),
      });
      return false;
    }
  };

  const handleUnpairBuddy = async () => {
    try {
      await ApiClient.unpairBuddy();
      invalidate('buddy_');
      await Promise.all([refreshUser(), loadData(true)]);
      setActiveTab('radar');
    } catch {
      // Safe error handling
    }
  };

  if (isLoading || isDataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3 text-center">
        <div className="w-10 h-10 border-3 border-[#C42126] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-[#5C5C5C] font-semibold">Connecting Buddy Hub...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1220px] mx-auto px-5 sm:px-8 py-8 space-y-7">
      {/* Open-Canvas Header separated by 1px #D6D6D2 hairline */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-[#D6D6D2] pb-5 gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#C42126]">
            {t('buddySystemBadge')}
          </span>
          <h1 className="font-display text-[44px] font-extrabold text-[#333333] leading-none mt-1">
            {t('buddyTitle')}
          </h1>
        </div>

        {/* Single-Layer Segmented Tab Control */}
        <div className="flex border border-[#D6D6D2] rounded-lg overflow-hidden divide-x divide-[#D6D6D2] bg-[#EBEBE6] self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('my-buddy')}
            className={`py-2 px-5 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'my-buddy'
                ? 'bg-[#C42126] text-[#FFFFFF]'
                : 'text-[#5C5C5C] hover:text-[#333333]'
            }`}
          >
            {t('myBuddyTab')}
          </button>
          <button
            onClick={() => setActiveTab('radar')}
            className={`py-2 px-5 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'radar'
                ? 'bg-[#C42126] text-[#FFFFFF]'
                : 'text-[#5C5C5C] hover:text-[#333333]'
            }`}
          >
            {t('radarTab')} ({candidates.length})
          </button>
        </div>
      </div>

      {/* TAB 1: MY BUDDY CO-OP */}
      <div className={activeTab === 'my-buddy' ? 'space-y-6' : 'hidden'}>
        {buddyData?.hasBuddy ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
            <div className="lg:col-span-7">
              <CoopMissionCard
                buddyData={buddyData}
                onOpenGiftModal={() => setIsGiftModalOpen(true)}
                onOpenUnpairModal={() => setIsUnpairModalOpen(true)}
              />
            </div>

            {/* Explainer Sidebar */}
            <div className="lg:col-span-5">
              <div className="bento-tile p-6 space-y-3">
                <h4 className="font-bold text-[#333333] text-sm uppercase tracking-wider pb-3 border-b border-[#D6D6D2]">
                  {t('coopRulesTitle')}
                </h4>
                <ul className="text-xs text-[#5C5C5C] divide-y divide-[#D6D6D2] leading-relaxed">
                  <li className="py-2.5">{t('coopRule1')}</li>
                  <li className="py-2.5">{t('coopRule2')}</li>
                  <li className="py-2.5">{t('coopRule3')}</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="bento-tile p-10 text-center space-y-4 max-w-xl mx-auto">
            <Users className="w-8 h-8 text-[#C42126] mx-auto" />
            <div>
              <h3 className="text-2xl font-bold text-[#333333]">{t('noBuddyCardTitle')}</h3>
              <p className="text-sm text-[#5C5C5C] mt-1.5 leading-relaxed">
                {t('noBuddyCardDesc')}
              </p>
            </div>
            <button
              onClick={() => setActiveTab('radar')}
              className="px-7 py-3 rounded-lg btn-cta-red font-semibold text-xs uppercase cursor-pointer"
            >
              {t('openRadarBtn')}
            </button>
          </div>
        )}
      </div>

      {/* TAB 2: RADAR MATCHMAKER */}
      <div className={activeTab === 'radar' ? 'block' : 'hidden'}>
        <RadarMatchmaker
          candidates={candidates}
          onConnect={handleConnectBuddy}
        />
      </div>

      {buddyData?.hasBuddy && (
        <GiftFreezeModal
          isOpen={isGiftModalOpen}
          partnerName={formatPersonName(buddyData.partner.name, language)}
          myFreezeCount={user?.streakFreezeCount || 0}
          onClose={() => setIsGiftModalOpen(false)}
          onSendGift={async (note) => {
            await ApiClient.giftStreakFreeze(buddyData.partner.id, note);
            await refreshUser();
            await loadData();
          }}
        />
      )}

      <BuddyLimitModal
        isOpen={limitModalState.isOpen}
        onClose={() => setLimitModalState({ isOpen: false })}
        currentPartner={buddyData?.hasBuddy ? buddyData.partner : null}
        errorMessage={limitModalState.errorMessage}
        onViewCurrentPartner={() => setActiveTab('my-buddy')}
        onUnpair={handleUnpairBuddy}
      />

      {buddyData?.hasBuddy && (
        <UnpairConfirmModal
          isOpen={isUnpairModalOpen}
          partnerName={formatPersonName(buddyData.partner.name, language)}
          onClose={() => setIsUnpairModalOpen(false)}
          onConfirm={handleUnpairBuddy}
        />
      )}
    </div>
  );
}
