'use client';

import React, { createContext, useContext, useRef, useState, useEffect, useCallback } from 'react';
import { ApiClient } from '../lib/api';

export const CACHE_KEYS = {
  TODAY_STATUS: 'home_status',
  RECOMMENDATION: 'home_rec',
  BUDDY_DATA: 'buddy_data',
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
  prewarmAllTabs: () => void;
  isCacheHydrated: boolean;
}

const STORAGE_CACHE_KEY = 'fit_data_cache_v1';
const MAX_STORAGE_AGE_MS = 24 * 60 * 60 * 1000;

const DataCacheContext = createContext<DataCacheContextType | undefined>(undefined);

// Global in-memory cache shared across component lifecycles
const globalMemoryCache = new Map<string, CacheEntry>();
let isClientHydratedGlobal = false;
let prewarmTimer: ReturnType<typeof setTimeout> | null = null;
let persistStorageTimer: ReturnType<typeof setTimeout> | null = null;
let isPrewarming = false;

export function clearGlobalMemoryCache() {
  globalMemoryCache.clear();
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_CACHE_KEY);
    } catch {
      // safe
    }
  }
}

function persistMemoryCacheToStorage() {
  if (typeof window === 'undefined') return;
  if (persistStorageTimer) {
    clearTimeout(persistStorageTimer);
  }
  persistStorageTimer = setTimeout(() => {
    try {
      const serialized: Record<string, CacheEntry> = {};
      globalMemoryCache.forEach((value, key) => {
        serialized[key] = value;
      });
      localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(serialized));
    } catch {
      // Ignore storage quota errors
    }
  }, 120);
}

function hydrateMemoryCacheFromStorage() {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_CACHE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, CacheEntry>;
    const now = Date.now();
    Object.entries(parsed).forEach(([key, entry]) => {
      if (entry && entry.timestamp && now - entry.timestamp < MAX_STORAGE_AGE_MS) {
        if (!globalMemoryCache.has(key)) {
          globalMemoryCache.set(key, entry);
        }
      }
    });
  } catch {
    // Ignore malformed cache
  }
}

export function DataCacheProvider({ children }: { children: React.ReactNode }) {
  const cacheRef = useRef<Map<string, CacheEntry>>(globalMemoryCache);
  const [isCacheHydrated, setIsCacheHydrated] = useState<boolean>(false);

  const getCache = useCallback(<T,>(key: string): T | null => {
    if (!isClientHydratedGlobal) return null;
    const entry = cacheRef.current.get(key);
    if (!entry) return null;
    return entry.data as T;
  }, []);

  const setCache = useCallback(<T,>(key: string, data: T) => {
    cacheRef.current.set(key, {
      data,
      timestamp: Date.now(),
    });
    persistMemoryCacheToStorage();
  }, []);

  const isFresh = useCallback((key: string, ttlMs = 60000): boolean => {
    if (!isClientHydratedGlobal) return false;
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
    if (keyOrPrefix.startsWith('workout_')) {
      cacheRef.current.delete(CACHE_KEYS.WORKOUT_HISTORY);
    }
    persistMemoryCacheToStorage();
  }, []);

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
        const tasks: Promise<any>[] = [];

        if (!isFresh(CACHE_KEYS.TODAY_STATUS, 45000)) {
          tasks.push(
            ApiClient.getTodayStatus()
              .then((res) => res && setCache(CACHE_KEYS.TODAY_STATUS, res))
              .catch(() => null),
          );
        }

        if (!isFresh(CACHE_KEYS.RECOMMENDATION, 90000)) {
          tasks.push(
            ApiClient.getDailyRecommendation()
              .then((res) => res && setCache(CACHE_KEYS.RECOMMENDATION, res))
              .catch(() => null),
          );
        }

        if (!isFresh(CACHE_KEYS.BUDDY_DATA, 60000)) {
          tasks.push(
            ApiClient.getMyBuddy()
              .then((res) => res && setCache(CACHE_KEYS.BUDDY_DATA, res))
              .catch(() => null),
          );
        }

        if (!isFresh(CACHE_KEYS.BUDDY_CANDIDATES, 90000)) {
          tasks.push(
            ApiClient.findBuddyMatches()
              .then((res) => res && setCache(CACHE_KEYS.BUDDY_CANDIDATES, res))
              .catch(() => null),
          );
        }

        if (!isFresh(CACHE_KEYS.SHOP_ITEMS, 180000)) {
          tasks.push(
            ApiClient.getShopItems()
              .then((res) => res && setCache(CACHE_KEYS.SHOP_ITEMS, res))
              .catch(() => null),
          );
          tasks.push(
            ApiClient.getInventory()
              .then((res) => res && setCache(CACHE_KEYS.SHOP_INVENTORY, res))
              .catch(() => null),
          );
        }

        if (!isFresh(CACHE_KEYS.WORKOUT_HISTORY, 90000)) {
          tasks.push(
            ApiClient.getWorkoutHistory()
              .then((res) => res && setCache(CACHE_KEYS.WORKOUT_HISTORY, res))
              .catch(() => null),
          );
        }

        if (tasks.length > 0) {
          await Promise.allSettled(tasks);
        }
      } finally {
        isPrewarming = false;
      }
    }, 150);
  }, [isFresh, setCache]);

  useEffect(() => {
    hydrateMemoryCacheFromStorage();
    isClientHydratedGlobal = true;
    setIsCacheHydrated(true);
    prewarmAllTabs();
  }, [prewarmAllTabs]);

  return (
    <DataCacheContext.Provider
      value={React.useMemo(
        () => ({
          getCache,
          setCache,
          isFresh,
          invalidate,
          prewarmAllTabs,
          isCacheHydrated,
        }),
        [getCache, setCache, isFresh, invalidate, prewarmAllTabs, isCacheHydrated],
      )}
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
