'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useDataCache } from '../../context/DataCacheContext';
import { ApiClient } from '../../lib/api';
import { CoopMissionCard } from '../../components/buddy/CoopMissionCard';
import { RadarMatchmaker } from '../../components/buddy/RadarMatchmaker';
import { GiftFreezeModal } from '../../components/buddy/GiftFreezeModal';
import { BuddyLimitModal } from '../../components/buddy/BuddyLimitModal';
import { UnpairConfirmModal } from '../../components/buddy/UnpairConfirmModal';
import { Users } from 'lucide-react';

export default function BuddyPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth();
  const { t } = useLanguage();
  const { getCache, setCache, isFresh, invalidate } = useDataCache();

  const [activeTab, setActiveTab] = useState<'my-buddy' | 'radar'>('my-buddy');
  const [buddyData, setBuddyData] = useState<any>(() => getCache('buddy_data'));
  const [candidates, setCandidates] = useState<any[]>(() => getCache('buddy_candidates') || []);
  const [isDataLoading, setIsDataLoading] = useState(() => !getCache('buddy_data'));
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [isUnpairModalOpen, setIsUnpairModalOpen] = useState(false);
  const [limitModalState, setLimitModalState] = useState<{
    isOpen: boolean;
    errorMessage?: string;
  }>({ isOpen: false });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, isLoading]);

  const loadData = async (forceSpinner = false) => {
    if (
      !forceSpinner &&
      isFresh('buddy_data', 45000) &&
      isFresh('buddy_candidates', 60000)
    ) {
      const cachedBuddy = getCache<any>('buddy_data');
      const cachedCandidates = getCache<any[]>('buddy_candidates') || [];
      setBuddyData(cachedBuddy);
      setCandidates(cachedCandidates);
      setIsDataLoading(false);
      return;
    }

    if (!getCache('buddy_data') || forceSpinner) {
      setIsDataLoading(true);
    }
    try {
      const [myBuddy, matches] = await Promise.all([
        ApiClient.getMyBuddy().catch(() => null),
        ApiClient.findBuddyMatches().catch(() => []),
      ]);

      if (myBuddy) {
        setBuddyData(myBuddy);
        setCache('buddy_data', myBuddy);
        setCache('home_buddy', myBuddy);
      }
      if (matches) {
        setCandidates(matches);
        setCache('buddy_candidates', matches);
      }

      if (!myBuddy?.hasBuddy && !getCache('buddy_data')) {
        setActiveTab('radar');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDataLoading(false);
    }
  };

  const handleConnectBuddy = async (targetUserId: string): Promise<boolean> => {
    // 1. Kiểm tra ngay tại Client nếu người dùng hiện tại đã có bạn đồng hành đang hoạt động
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
      invalidate('home_buddy');
      await Promise.all([refreshUser(), loadData(true)]);
      setActiveTab('my-buddy');
      return true;
    } catch (err: any) {
      // 2. Bắt lỗi từ Backend (409 Conflict hoặc lỗi khác) và hiển thị Popup thân thiện
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
      invalidate('home_buddy');
      await Promise.all([refreshUser(), loadData(true)]);
      setActiveTab('radar');
    } catch {
      // Bắt lỗi an toàn
    }
  };

  if (isLoading || isDataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3 text-center">
        <div className="w-10 h-10 border-4 border-[#52B72B] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-bold">Connecting Buddy Hub...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-[#D8EACF] pb-4 gap-2">
        <div>
          <span className="text-xs font-black uppercase tracking-widest text-[#52B72B]">
            {t('buddySystemBadge')}
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-[#1B3815]">
            {t('buddyTitle')}
          </h1>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-[#EAF6E5] p-1.5 rounded-2xl border border-[#D8EACF]">
          <button
            onClick={() => setActiveTab('my-buddy')}
            className={`py-2 px-5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'my-buddy'
                ? 'bg-[#52B72B] text-white shadow-sm'
                : 'text-[#1B3815] hover:text-[#52B72B]'
            }`}
          >
            {t('myBuddyTab')}
          </button>
          <button
            onClick={() => setActiveTab('radar')}
            className={`py-2 px-5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'radar'
                ? 'bg-[#52B72B] text-white shadow-sm'
                : 'text-[#1B3815] hover:text-[#52B72B]'
            }`}
          >
            {t('radarTab')} ({candidates.length})
          </button>
        </div>
      </div>

      {/* TAB 1: MY BUDDY CO-OP */}
      <div className={activeTab === 'my-buddy' ? 'space-y-6' : 'hidden'}>
        {buddyData?.hasBuddy ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7">
              <CoopMissionCard
                buddyData={buddyData}
                onOpenGiftModal={() => setIsGiftModalOpen(true)}
                onOpenUnpairModal={() => setIsUnpairModalOpen(true)}
              />
            </div>

            {/* Explainer Sidebar */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-[#EAF6E5] border-2 border-[#D8EACF] rounded-3xl p-6 space-y-3">
                <h4 className="font-black text-[#1B3815] text-base uppercase tracking-wider">
                  {t('coopRulesTitle')}
                </h4>
                <ul className="text-xs text-[#2E4E26] space-y-2 leading-relaxed font-medium">
                  <li>{t('coopRule1')}</li>
                  <li>{t('coopRule2')}</li>
                  <li>{t('coopRule3')}</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border-2 border-[#D8EACF] rounded-3xl p-10 text-center space-y-5 max-w-xl mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-full bg-[#EAF6E5] text-[#52B72B] mx-auto flex items-center justify-center">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-[#1B3815]">{t('noBuddyCardTitle')}</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed font-medium">
                {t('noBuddyCardDesc')}
              </p>
            </div>
            <button
              onClick={() => setActiveTab('radar')}
              className="min-h-[54px] px-8 rounded-2xl bg-[#52B72B] hover:bg-[#469F24] text-white font-black text-sm uppercase shadow-sm transition-colors cursor-pointer"
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

      {/* Gift Freeze Modal */}
      {buddyData?.hasBuddy && (
        <GiftFreezeModal
          isOpen={isGiftModalOpen}
          partnerName={buddyData.partner.name}
          myFreezeCount={user?.streakFreezeCount || 0}
          onClose={() => setIsGiftModalOpen(false)}
          onSendGift={async (note) => {
            await ApiClient.giftStreakFreeze(buddyData.partner.id, note);
            await refreshUser();
            await loadData();
          }}
        />
      )}

      {/* Buddy Limit Modal (Mô hình 1-1 Active Partner) */}
      <BuddyLimitModal
        isOpen={limitModalState.isOpen}
        onClose={() => setLimitModalState({ isOpen: false })}
        currentPartner={buddyData?.hasBuddy ? buddyData.partner : null}
        errorMessage={limitModalState.errorMessage}
        onViewCurrentPartner={() => setActiveTab('my-buddy')}
        onUnpair={handleUnpairBuddy}
      />

      {/* Unpair Confirm Modal trong Buddy Hub */}
      {buddyData?.hasBuddy && (
        <UnpairConfirmModal
          isOpen={isUnpairModalOpen}
          partnerName={buddyData.partner.name}
          onClose={() => setIsUnpairModalOpen(false)}
          onConfirm={handleUnpairBuddy}
        />
      )}
    </div>
  );
}
