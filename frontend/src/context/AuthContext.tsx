'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ApiClient } from '../lib/api';

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

interface AuthContextType {
  user: UserData | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUserLocal: (updates: Partial<UserData>) => void;
}

const USER_CACHE_KEY = 'fit_user_cache';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const savedToken = localStorage.getItem('fit_token');
      const savedUserRaw = localStorage.getItem(USER_CACHE_KEY);
      if (savedToken && savedUserRaw) {
        const parsed = JSON.parse(savedUserRaw) as UserData;
        if (parsed && parsed.id) return parsed;
      }
    } catch {
      // Ignore storage errors
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem('fit_token');
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const savedToken = localStorage.getItem('fit_token');
      const savedUserRaw = localStorage.getItem(USER_CACHE_KEY);
      // Only show loading if we have a token but no cached user object yet
      return Boolean(savedToken && !savedUserRaw);
    } catch {
      return false;
    }
  });

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

  useEffect(() => {
    const savedToken = localStorage.getItem('fit_token');
    if (savedToken) {
      setToken(savedToken);
      ApiClient.getProfile()
        .then((userData) => {
          setUser(userData);
          persistUserCache(userData);
        })
        .catch(() => {
          localStorage.removeItem('fit_token');
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
    }
  }, []);

  const login = async (email: string, pass: string) => {
    const data = await ApiClient.login({ email, password: pass });
    localStorage.setItem('fit_token', data.accessToken);
    persistUserCache(data.user);
    setToken(data.accessToken);
    setUser(data.user);
  };

  const register = async (name: string, email: string, pass: string) => {
    const data = await ApiClient.register({ name, email, password: pass });
    localStorage.setItem('fit_token', data.accessToken);
    persistUserCache(data.user);
    setToken(data.accessToken);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('fit_token');
    persistUserCache(null);
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const userData = await ApiClient.getProfile();
      setUser(userData);
      persistUserCache(userData);
    } catch (e) {
      console.error('Failed to refresh user', e);
    }
  };

  const updateUserLocal = (updates: Partial<UserData>) => {
    if (user) {
      const next = { ...user, ...updates };
      setUser(next);
      persistUserCache(next);
    }
  };

  const hasCompletedOnboarding = !!(user && user.profile);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        hasCompletedOnboarding,
        login,
        register,
        logout,
        refreshUser,
        updateUserLocal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
