'use client';

import React, { createContext, useContext, useRef, useState, useEffect, useCallback } from 'react';
import { ApiClient } from '../lib/api';

export const CACHE_KEYS = {
  TODAY_STATUS: 'home_status',
  RECOMMENDATION: 'home_rec',
  WORKOUT_PLAN: 'workout_plan',
  BUDDY_DATA: 'buddy_data',
  HOME_BUDDY: 'home_buddy',
  BUDDY_CANDIDATES: 'buddy_candidates',
  SHOP_ITEMS: 'shop_items',
  SHOP_INVENTORY: 'shop_inventory',
  WORKOUT_HISTORY: 'workout_history',
} as const;

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
}

interface DataCacheContextType {
  getCache: <T>(key: string) => T | null;
  setCache: <T>(key: string, data: T) => void;
  isFresh: (key: string, ttlMs?: number) => boolean;
  invalidate: (keyOrPrefix: string) => void;
  clearAll: () => void;
  prewarmAllTabs: () => void;
}

const DataCacheContext = createContext<DataCacheContextType | undefined>(undefined);

// Global in-memory cache shared across component lifecycles
const globalMemoryCache = new Map<string, CacheEntry>();
let prewarmTimer: ReturnType<typeof setTimeout> | null = null;
let isPrewarming = false;

export function DataCacheProvider({ children }: { children: React.ReactNode }) {
  const cacheRef = useRef<Map<string, CacheEntry>>(globalMemoryCache);

  const getCache = useCallback(<T,>(key: string): T | null => {
    const entry = cacheRef.current.get(key);
    if (!entry) return null;
    return entry.data as T;
  }, []);

  const setCache = useCallback(<T,>(key: string, data: T) => {
    const now = Date.now();
    cacheRef.current.set(key, {
      data,
      timestamp: now,
    });
    // Mirror shared aliases so Home, Workout, and Buddy pages always stay 100% in sync
    if (key === CACHE_KEYS.RECOMMENDATION) {
      cacheRef.current.set(CACHE_KEYS.WORKOUT_PLAN, { data, timestamp: now });
    } else if (key === CACHE_KEYS.WORKOUT_PLAN) {
      cacheRef.current.set(CACHE_KEYS.RECOMMENDATION, { data, timestamp: now });
    } else if (key === CACHE_KEYS.BUDDY_DATA) {
      cacheRef.current.set(CACHE_KEYS.HOME_BUDDY, { data, timestamp: now });
    } else if (key === CACHE_KEYS.HOME_BUDDY) {
      cacheRef.current.set(CACHE_KEYS.BUDDY_DATA, { data, timestamp: now });
    }
  }, []);

  const isFresh = useCallback((key: string, ttlMs = 45000): boolean => {
    const entry = cacheRef.current.get(key);
    if (!entry) return false;
    return Date.now() - entry.timestamp < ttlMs;
  }, []);

  const invalidate = useCallback((keyOrPrefix: string) => {
    for (const key of Array.from(cacheRef.current.keys())) {
      if (key === keyOrPrefix || key.startsWith(keyOrPrefix)) {
        cacheRef.current.delete(key);
      }
    }
    if (keyOrPrefix === 'home_rec' || keyOrPrefix === 'workout_plan') {
      cacheRef.current.delete(CACHE_KEYS.RECOMMENDATION);
      cacheRef.current.delete(CACHE_KEYS.WORKOUT_PLAN);
    }
    if (keyOrPrefix.startsWith('buddy') || keyOrPrefix === 'home_buddy') {
      cacheRef.current.delete(CACHE_KEYS.BUDDY_DATA);
      cacheRef.current.delete(CACHE_KEYS.HOME_BUDDY);
    }
    if (keyOrPrefix === 'profile_stats' || keyOrPrefix.startsWith('workout_')) {
      cacheRef.current.delete(CACHE_KEYS.WORKOUT_HISTORY);
    }
  }, []);

  const clearAll = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  // Gentle, delayed background pre-warming (runs 3s AFTER initial page finishes loading, sequentially)
  const prewarmAllTabs = useCallback(() => {
    if (typeof window === 'undefined' || isPrewarming) return;
    const token = localStorage.getItem('fit_token');
    if (!token) return;

    if (prewarmTimer) {
      clearTimeout(prewarmTimer);
    }

    prewarmTimer = setTimeout(async () => {
      if (isPrewarming) return;
      isPrewarming = true;
      try {
        // Sequential, low-priority background warming so SQLite & browser connections never congest
        if (!isFresh(CACHE_KEYS.SHOP_ITEMS, 120000)) {
          const items = await ApiClient.getShopItems().catch(() => null);
          if (items) setCache(CACHE_KEYS.SHOP_ITEMS, items);
          const inv = await ApiClient.getInventory().catch(() => null);
          if (inv) setCache(CACHE_KEYS.SHOP_INVENTORY, inv);
        }

        if (!isFresh(CACHE_KEYS.WORKOUT_HISTORY, 60000)) {
          const history = await ApiClient.getWorkoutHistory().catch(() => null);
          if (history) setCache(CACHE_KEYS.WORKOUT_HISTORY, history);
        }

        if (!isFresh(CACHE_KEYS.BUDDY_CANDIDATES, 60000)) {
          const matches = await ApiClient.findBuddyMatches().catch(() => null);
          if (matches) setCache(CACHE_KEYS.BUDDY_CANDIDATES, matches);
        }
      } finally {
        isPrewarming = false;
      }
    }, 3000);
  }, [isFresh, setCache]);

  return (
    <DataCacheContext.Provider
      value={{ getCache, setCache, isFresh, invalidate, clearAll, prewarmAllTabs }}
    >
      {children}
    </DataCacheContext.Provider>
  );
}

export function useDataCache() {
  const context = useContext(DataCacheContext);
  if (!context) {
    throw new Error('useDataCache must be used within a DataCacheProvider');
  }
  return context;
}

interface UseCachedDataOptions {
  ttlMs?: number;
  enabled?: boolean;
}

export function useCachedData<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  options: UseCachedDataOptions = {}
) {
  const { ttlMs = 60000, enabled = true } = options;
  const { getCache, setCache } = useDataCache();

  const [data, setDataState] = useState<T | null>(() => (key ? getCache<T>(key) : null));
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (!key || !enabled) return false;
    return getCache(key) === null;
  });
  const [isRevalidating, setIsRevalidating] = useState<boolean>(false);

  const executeFetch = useCallback(
    async (showLoading = false) => {
      if (!key || !enabled) return null;

      if (showLoading) {
        setIsLoading(true);
      } else {
        setIsRevalidating(true);
      }

      try {
        const freshData = await fetcher();
        setCache(key, freshData);
        setDataState(freshData);
        return freshData;
      } catch (err) {
        console.warn(`[DataCache] Failed to fetch ${key}:`, err);
        return null;
      } finally {
        setIsLoading(false);
        setIsRevalidating(false);
      }
    },
    [key, enabled, fetcher, setCache]
  );

  useEffect(() => {
    if (!key || !enabled) return;

    const cached = getCache<T>(key);
    const globalEntry = globalMemoryCache.get(key);

    if (cached !== null) {
      setDataState(cached);
      setIsLoading(false);

      const age = globalEntry ? Date.now() - globalEntry.timestamp : Infinity;
      if (age > ttlMs) {
        executeFetch(false);
      }
    } else {
      executeFetch(true);
    }
  }, [key, enabled, ttlMs]); // eslint-disable-line react-hooks/exhaustive-deps

  const mutate = useCallback(
    (newData: T | null) => {
      if (key && newData !== null) {
        setCache(key, newData);
      }
      setDataState(newData);
    },
    [key, setCache]
  );

  return {
    data,
    isLoading,
    isRevalidating,
    refetch: () => executeFetch(data === null),
    mutate,
  };
}
