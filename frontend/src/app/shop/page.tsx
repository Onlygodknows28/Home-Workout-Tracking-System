'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useDataCache, CACHE_KEYS } from '../../context/DataCacheContext';
import { ApiClient } from '../../lib/api';
import { Coins, Shield } from 'lucide-react';
import { getShopItemName, getShopItemDesc } from '../../lib/catalogTranslations';

export default function ShopPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, isAuthReady, refreshUser } = useAuth();
  const { t, language } = useLanguage();
  const { getCache, setCache, isFresh, invalidate, isCacheHydrated } = useDataCache();

  const [shopItems, setShopItems] = useState<any[]>(() => getCache(CACHE_KEYS.SHOP_ITEMS) || []);
  const [inventory, setInventory] = useState<any[]>(
    () => getCache(CACHE_KEYS.SHOP_INVENTORY) || [],
  );
  const [isDataLoading, setIsDataLoading] = useState(() => !getCache(CACHE_KEYS.SHOP_ITEMS));
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthReady) return;
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated && isCacheHydrated) {
      loadShop();
    }
  }, [isAuthenticated, isLoading, isAuthReady, isCacheHydrated]);

  const loadShop = async (forceSpinner = false) => {
    const cachedItems = getCache<any[]>(CACHE_KEYS.SHOP_ITEMS);
    const cachedInv = getCache<any[]>(CACHE_KEYS.SHOP_INVENTORY);

    if (cachedItems && !forceSpinner) {
      setShopItems(cachedItems);
      if (cachedInv) setInventory(cachedInv);
      setIsDataLoading(false);
      if (isFresh(CACHE_KEYS.SHOP_ITEMS, 180000) && isFresh(CACHE_KEYS.SHOP_INVENTORY, 180000)) {
        return;
      }
    } else if (forceSpinner) {
      setIsDataLoading(true);
    }

    try {
      const [items, userInv] = await Promise.all([
        ApiClient.getShopItems(),
        ApiClient.getInventory(),
      ]);
      if (items) {
        setShopItems(items);
        setCache(CACHE_KEYS.SHOP_ITEMS, items);
      }
      if (userInv) {
        setInventory(userInv);
        setCache(CACHE_KEYS.SHOP_INVENTORY, userInv);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDataLoading(false);
    }
  };

  const handleBuy = async (itemId: string, itemName: string, price: number) => {
    if (!user || user.fitCoins < price) {
      alert(`${t('notEnoughCoins')}: ${price} FitCoins`);
      return;
    }

    setBuyingId(itemId);
    try {
      await ApiClient.buyShopItem(itemId);
      invalidate('shop_');
      await Promise.all([refreshUser(), loadShop(false)]);
      setSuccessMsg(`✓ ${itemName}`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      alert(e.message || 'Transaction failed');
    } finally {
      setBuyingId(null);
    }
  };

  if (isLoading || isDataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3 text-center">
        <div className="w-10 h-10 border-3 border-[#C42126] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-[#5C5C5C] font-semibold">Loading FitCoin Shop...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1220px] mx-auto px-5 sm:px-8 py-8 space-y-8">
      {/* Open-Canvas Header & Wallet Telemetry (Zero outer card wrapper!) */}
      <div className="pb-6 border-b border-[#D6D6D2] flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#C42126]">
            {t('economyLoopBadge')}
          </span>
          <h1 className="font-display text-[44px] sm:text-[52px] font-extrabold text-[#333333] leading-none mt-1">
            {t('shopHeaderTitle')}
          </h1>
          <p className="text-xs text-[#5C5C5C] mt-1.5">{t('effortRewardConsume')}</p>
        </div>

        {/* Flush 2-Column Hairline Balance Split */}
        <div className="flex items-center divide-x divide-[#D6D6D2]">
          <div className="pr-6">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5C5C5C] block">
              {t('fitcoinBalance')}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <Coins className="w-5 h-5 text-[#C42126]" />
              <span className="font-display text-4xl font-extrabold text-[#333333] leading-none font-telemetry">
                {user?.fitCoins || 0}
              </span>
            </div>
          </div>

          <div className="pl-6">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5C5C5C] block">
              {t('streakFreezeBalance')}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <Shield className="w-5 h-5 text-[#2E7D32]" />
              <span className="font-display text-4xl font-extrabold text-[#333333] leading-none font-telemetry">
                {user?.streakFreezeCount || 0}
              </span>
              <span className="text-xs text-[#5C5C5C] font-semibold">{t('freezes')}</span>
            </div>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="bg-[#EBEBE6] border border-[#2E7D32] rounded-lg p-3.5 text-xs font-bold text-[#2E7D32] text-center">
          {successMsg}
        </div>
      )}

      {/* 12-Col Layout: 8 Cols Catalog Roster + 4 Cols Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        {/* Left 8 Cols: Single-Layer Catalog Roster (Flush 1px Hairline Rows — Zero nested item cards!) */}
        <div className="lg:col-span-8 bento-tile p-6 sm:p-8">
          <div className="pb-4 border-b border-[#D6D6D2] flex items-baseline justify-between">
            <h3 className="text-base font-bold text-[#333333] uppercase tracking-wider">
              {t('shopItemsAvailable')} ({shopItems.length})
            </h3>
            <span className="text-xs text-[#5C5C5C]">{t('earnedFromWorkouts')}</span>
          </div>

          <div className="divide-y divide-[#D6D6D2]">
            {shopItems.map((item) => {
              const canAfford = (user?.fitCoins || 0) >= item.priceCoins;
              const isBuying = buyingId === item.id;
              const itemName = getShopItemName(item, language);
              const itemDesc = getShopItemDesc(item, language);

              return (
                <div
                  key={item.id}
                  className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <span className="text-3xl shrink-0 mt-0.5">{item.icon}</span>
                    <div>
                      <h4 className="font-bold text-[#333333] text-base">{itemName}</h4>
                      <p className="text-xs text-[#5C5C5C] mt-1 leading-relaxed">{itemDesc}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0">
                    <div className="text-right">
                      <span className="font-display text-3xl font-extrabold text-[#C42126] font-telemetry leading-none">
                        {item.priceCoins}
                      </span>
                      <span className="text-[11px] text-[#5C5C5C] font-semibold block">
                        FitCoins
                      </span>
                    </div>

                    <button
                      onClick={() => handleBuy(item.id, itemName, item.priceCoins)}
                      disabled={!canAfford || isBuying}
                      className={`px-5 py-2.5 rounded-lg font-semibold text-xs uppercase transition-colors cursor-pointer ${
                        canAfford
                          ? 'btn-cta-red'
                          : 'bg-[#D6D6D2] text-[#5C5C5C] cursor-not-allowed'
                      }`}
                    >
                      {isBuying ? '...' : canAfford ? t('buy1Tap') : t('notEnoughCoins')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 4 Cols: Single-Layer Inventory Tile (1px Hairline Rows) */}
        <div className="lg:col-span-4 bento-tile p-6">
          <div className="pb-4 border-b border-[#D6D6D2] flex items-baseline justify-between">
            <h3 className="text-sm font-bold text-[#333333] uppercase tracking-wider">
              {t('myInventory')} ({inventory.length})
            </h3>
            <span className="text-xs text-[#5C5C5C]">{t('autoProtectsStreaks')}</span>
          </div>

          {inventory.length > 0 ? (
            <div className="divide-y divide-[#D6D6D2]">
              {inventory.map((inv) => (
                <div key={inv.id} className="py-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl">{inv.item.icon}</span>
                    <p className="text-sm font-semibold text-[#333333] truncate">
                      {getShopItemName(inv.item, language)}
                    </p>
                  </div>
                  <span className="font-telemetry text-sm font-bold text-[#2E7D32] shrink-0">
                    ×{inv.quantity}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#5C5C5C] text-center py-8">{t('emptyInventory')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
