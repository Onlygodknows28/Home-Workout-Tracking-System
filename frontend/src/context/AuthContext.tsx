'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ApiClient } from '../lib/api';
import { clearGlobalMemoryCache } from './DataCacheContext';

export interface UserProfile {
  id: string;
  height: number;
  weight: number;
  bmi: number;
  pushupBaseline: number;
  fitnessLevel: string;
  primaryGoal: string;
  injuries: string[];
  availableEquipment: string[];
}

export interface UserData {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: string;
  xp: number;
  level: number;
  fitCoins: number;
  currentStreak: number;
  highestStreak: number;
  streakFreezeCount: number;
  todayXpEarned: number;
  todayCoinsEarned: number;
  profile?: UserProfile | null;
}

export interface UpdateProfilePayload {
  name?: string;
  avatar?: string;
  height?: number;
  weight?: number;
  primaryGoal?: string;
  injuries?: string[];
  availableEquipment?: string[];
}

interface AuthContextType {
  user: UserData | null;
  token: string | null;
  isLoading: boolean;
  isAuthReady: boolean;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUserProfile: (payload: UpdateProfilePayload) => Promise<UserData>;
}

const USER_CACHE_KEY = 'fit_user_cache';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);

  const persistUserCache = (userData: UserData | null) => {
    if (typeof window === 'undefined') return;
    try {
      if (userData) {
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(userData));
      } else {
        localStorage.removeItem(USER_CACHE_KEY);
      }
    } catch {
      // Ignore storage quota errors
    }
  };

  const applyUserIfChanged = (nextUser: UserData | null) => {
    setUser((prev) => {
      if (prev && nextUser && JSON.stringify(prev) === JSON.stringify(nextUser)) {
        return prev;
      }
      return nextUser;
    });
  };

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('fit_token');
      const savedUserRaw = localStorage.getItem(USER_CACHE_KEY);

      if (savedToken) {
        setToken(savedToken);
        let hasCachedUser = false;

        if (savedUserRaw) {
          try {
            const parsed = JSON.parse(savedUserRaw) as UserData;
            if (parsed && parsed.id) {
              setUser(parsed);
              hasCachedUser = true;
            }
          } catch {
            // Ignore malformed cache
          }
        }

        if (!hasCachedUser) {
          setIsLoading(true);
        }
        setIsAuthReady(true);

        ApiClient.getProfile()
          .then((userData) => {
            applyUserIfChanged(userData);
            persistUserCache(userData);
          })
          .catch(() => {
            localStorage.removeItem('fit_token');
            clearGlobalMemoryCache();
            persistUserCache(null);
            setToken(null);
            setUser(null);
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        persistUserCache(null);
        setIsLoading(false);
        setIsAuthReady(true);
      }
    } catch {
      setIsLoading(false);
      setIsAuthReady(true);
    }
  }, []);

  const login = async (email: string, pass: string) => {
    clearGlobalMemoryCache();
    const data = await ApiClient.login({ email, password: pass });
    localStorage.setItem('fit_token', data.accessToken);
    persistUserCache(data.user);
    setToken(data.accessToken);
    setUser(data.user);
    setIsAuthReady(true);
  };

  const register = async (name: string, email: string, pass: string) => {
    clearGlobalMemoryCache();
    const data = await ApiClient.register({ name, email, password: pass });
    localStorage.setItem('fit_token', data.accessToken);
    persistUserCache(data.user);
    setToken(data.accessToken);
    setUser(data.user);
    setIsAuthReady(true);
  };

  const logout = () => {
    localStorage.removeItem('fit_token');
    clearGlobalMemoryCache();
    persistUserCache(null);
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const userData = await ApiClient.getProfile();
      applyUserIfChanged(userData);
      persistUserCache(userData);
    } catch (e) {
      console.error('Failed to refresh user', e);
    }
  };

  const updateUserProfile = async (payload: UpdateProfilePayload): Promise<UserData> => {
    const updatedUser = await ApiClient.updateProfile(payload);
    applyUserIfChanged(updatedUser);
    persistUserCache(updatedUser);
    return updatedUser;
  };

  const contextValue = React.useMemo(
    () => ({
      user,
      token,
      isLoading,
      isAuthReady,
      isAuthenticated: !!token && !!user,
      login,
      register,
      logout,
      refreshUser,
      updateUserProfile,
    }),
    [user, token, isLoading, isAuthReady],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
