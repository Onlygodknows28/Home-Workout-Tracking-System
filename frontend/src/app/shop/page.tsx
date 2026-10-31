'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useDataCache } from '../../context/DataCacheContext';
import { ApiClient } from '../../lib/api';
import { ShoppingBag, Coins, Shield, Package } from 'lucide-react';
import { getShopItemName, getShopItemDesc } from '../../lib/catalogTranslations';

export default function ShopPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth();
  const { t, language } = useLanguage();
  const { getCache, setCache, isFresh, invalidate } = useDataCache();

  const [shopItems, setShopItems] = useState<any[]>(() => getCache('shop_items') || []);
  const [inventory, setInventory] = useState<any[]>(() => getCache('shop_inventory') || []);
  const [isDataLoading, setIsDataLoading] = useState(() => !getCache('shop_items'));
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      loadShop();
    }
  }, [isAuthenticated, isLoading]);

  const loadShop = async (forceSpinner = false) => {
    if (
      !forceSpinner &&
      isFresh('shop_items', 120000) &&
      isFresh('shop_inventory', 60000)
    ) {
      setShopItems(getCache('shop_items') || []);
      setInventory(getCache('shop_inventory') || []);
      setIsDataLoading(false);
      return;
    }

    if (!getCache('shop_items') || forceSpinner) {
      setIsDataLoading(true);
    }
    try {
      const [items, userInv] = await Promise.all([
        ApiClient.getShopItems(),
        ApiClient.getInventory(),
      ]);
      if (items) {
        setShopItems(items);
        setCache('shop_items', items);
      }
      if (userInv) {
        setInventory(userInv);
        setCache('shop_inventory', userInv);
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
      setSuccessMsg(`🎉 ${itemName}`);
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
        <div className="w-10 h-10 border-4 border-[#52B72B] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-bold">Loading FitCoin Shop...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Wallet Hero */}
      <div className="bg-[#1B3815] text-white border-2 border-[#2E4E26] rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-[#FBBF24]" />
              <span className="text-xs font-black uppercase tracking-wider text-[#FBBF24]">
                {t('economyLoopBadge')}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">{t('shopHeaderTitle')}</h1>
          </div>

          <span className="bg-[#2E4E26] text-white text-xs font-black px-4 py-1.5 rounded-full self-start sm:self-auto">
            {t('effortRewardConsume')}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#2E4E26]">
          <div className="bg-[#11240D] p-4 rounded-2xl border border-[#2E4E26] flex items-center justify-between">
            <div>
              <span className="text-xs text-white/70 block font-bold">{t('fitcoinBalance')}</span>
              <div className="text-3xl font-black text-[#FBBF24] flex items-center space-x-2 mt-0.5">
                <Coins className="w-7 h-7 fill-[#FBBF24]" />
                <span>{user?.fitCoins || 0}</span>
              </div>
            </div>
            <span className="text-xs text-white/60 font-bold uppercase">{t('earnedFromWorkouts')}</span>
          </div>

          <div className="bg-[#11240D] p-4 rounded-2xl border border-[#2E4E26] flex items-center justify-between">
            <div>
              <span className="text-xs text-white/70 block font-bold">{t('streakFreezeBalance')}</span>
              <div className="text-3xl font-black text-white flex items-center space-x-2 mt-0.5">
                <Shield className="w-7 h-7 text-[#2563EB] fill-[#2563EB]" />
                <span>{user?.streakFreezeCount || 0}</span>
                <span className="text-sm font-bold text-white/70">{t('freezes')}</span>
              </div>
            </div>
            <span className="text-xs text-white/60 font-bold uppercase">{t('autoProtectsStreaks')}</span>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="bg-[#EAF6E5] border-2 border-[#52B72B] rounded-2xl p-4 text-xs font-black text-[#1B3815] text-center">
          {successMsg}
        </div>
      )}

      {/* Shop Catalog Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-[#1B3815] uppercase tracking-wider">
          {t('shopItemsAvailable')} ({shopItems.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shopItems.map((item) => {
            const canAfford = (user?.fitCoins || 0) >= item.priceCoins;
            const isBuying = buyingId === item.id;
            const itemName = getShopItemName(item, language);
            const itemDesc = getShopItemDesc(item, language);

            return (
              <div
                key={item.id}
                className="bg-white border-2 border-[#D8EACF] hover:border-[#52B72B] rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4 transition-all"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#EAF6E5] border border-[#D8EACF] flex items-center justify-center text-3xl shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-black text-[#1B3815] text-lg">{itemName}</h4>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed font-medium">
                      {itemDesc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#EAF6E5]">
                  <div className="flex items-center space-x-1.5">
                    <Coins className="w-5 h-5 text-[#D97706] fill-[#D97706]" />
                    <span className="text-2xl font-black text-[#1B3815]">
                      {item.priceCoins}
                    </span>
                    <span className="text-xs text-slate-500 font-bold">Coins</span>
                  </div>

                  <button
                    onClick={() => handleBuy(item.id, itemName, item.priceCoins)}
                    disabled={!canAfford || isBuying}
                    className={`min-h-[48px] px-6 rounded-xl font-black text-xs uppercase transition-all flex items-center space-x-1.5 cursor-pointer ${
                      canAfford
                        ? 'bg-[#52B72B] hover:bg-[#469F24] text-white shadow-sm'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {isBuying ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>{canAfford ? t('buy1Tap') : t('notEnoughCoins')}</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* User Inventory Section */}
      <div className="bg-white border-2 border-[#D8EACF] rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex items-center space-x-2">
          <Package className="w-5 h-5 text-[#52B72B]" />
          <h3 className="text-sm font-black text-[#1B3815] uppercase tracking-wider">
            {t('myInventory')} ({inventory.length})
          </h3>
        </div>

        {inventory.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {inventory.map((inv) => (
              <div
                key={inv.id}
                className="bg-[#FAFCF8] border border-[#D8EACF] rounded-2xl p-4 flex items-center space-x-3"
              >
                <span className="text-3xl">{inv.item.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-[#1B3815] truncate">
                    {getShopItemName(inv.item, language)}
                  </p>
                  <p className="text-xs text-[#52B72B] font-bold">{t('quantity')} x{inv.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 text-center py-4 font-medium">
            {t('emptyInventory')}
          </p>
        )}
      </div>
    </div>
  );
}
