'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { ApiClient } from '../lib/api';
import { playSoundCue } from '../lib/utils';
import { useDataCache, CACHE_KEYS } from './DataCacheContext';
import { useAuth } from './AuthContext';

export interface ActiveWorkoutState {
  isActive: boolean;
  recommendation: any;
  currentExerciseIndex: number;
  currentSet: number;
  isResting: boolean;
  isRestModalMinimized: boolean;
  isRestPaused: boolean;
  restStartTime: number | null;
  restEndTime: number | null;
  restRemainingWhenPaused: number | null;
  restTotalSeconds: number;
  startTime: string | null;
  isCompleted: boolean;
  isRpeModalDismissed: boolean;
  isRpeSubmitted: boolean;
  completedAt: string | null;
  completedDurationSeconds: number | null;
  completedSetsLog: { [exerciseId: string]: number };
}

interface WorkoutContextType {
  activeWorkout: ActiveWorkoutState;
  elapsedSeconds: number;
  remainingRestSeconds: number;
  isRestModalMinimized: boolean;
  isRestPaused: boolean;
  isMiniBarVisibleOnPath: (pathname: string) => boolean;
  startWorkout: (rec: any) => void;
  completeSet: () => void;
  skipExercise: () => void;
  completeRest: () => void;
  togglePauseRest: () => void;
  addRestSeconds: (sec: number) => void;
  minimizeRestModal: () => void;
  maximizeRestModal: () => void;
  dismissRpeModal: () => void;
  reopenRpeModal: () => void;
  discardWorkout: () => void;
  submitWorkout: (rpeScore: number) => Promise<any>;
}

const STORAGE_KEY = 'fit_active_workout';

const initialState: ActiveWorkoutState = {
  isActive: false,
  recommendation: null,
  currentExerciseIndex: 0,
  currentSet: 1,
  isResting: false,
  isRestModalMinimized: false,
  isRestPaused: false,
  restStartTime: null,
  restEndTime: null,
  restRemainingWhenPaused: null,
  restTotalSeconds: 45,
  startTime: null,
  isCompleted: false,
  isRpeModalDismissed: false,
  isRpeSubmitted: false,
  completedAt: null,
  completedDurationSeconds: null,
  completedSetsLog: {},
};

function getElapsedSince(startTime: string | null, endTimeMs: number, fallbackSeconds: number): number {
  if (!startTime) return Math.max(0, fallbackSeconds);
  const startMs = new Date(startTime).getTime();
  if (Number.isNaN(startMs)) return Math.max(0, fallbackSeconds);
  return Math.max(0, Math.floor((endTimeMs - startMs) / 1000));
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const { invalidate } = useDataCache();
  const { refreshUser } = useAuth();

  // Initialize deterministically on both Server and Client to prevent Hydration Mismatch
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkoutState>(initialState);
  const hasHydratedRef = useRef<boolean>(false);

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const elapsedSecondsRef = useRef<number>(0);
  const [remainingRestSeconds, setRemainingRestSeconds] = useState<number>(0);
  const lastBeepedSecondRef = useRef<number | null>(null);

  // Restore saved workout session (including completed workouts pending RPE submission) on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.isActive && !parsed?.isRpeSubmitted && parsed?.recommendation) {
          const completedAt = parsed.completedAt ?? null;
          const completedDurationSeconds =
            typeof parsed.completedDurationSeconds === 'number'
              ? parsed.completedDurationSeconds
              : parsed.isCompleted && completedAt
                ? getElapsedSince(parsed.startTime ?? null, new Date(completedAt).getTime(), 0)
                : null;
          setActiveWorkout({
            ...initialState,
            ...parsed,
            isRpeModalDismissed: Boolean(parsed.isRpeModalDismissed),
            isRpeSubmitted: false,
            completedAt,
            completedDurationSeconds,
          });
        } else {
          // Clean up any stale or already-submitted workout session
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      // safe fallback
    } finally {
      hasHydratedRef.current = true;
    }
  }, []);

  // Synchronize state with localStorage after hydration (persist until RPE is submitted or discarded)
  useEffect(() => {
    if (typeof window === 'undefined' || !hasHydratedRef.current) return;
    try {
      if (activeWorkout.isActive && !activeWorkout.isRpeSubmitted) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(activeWorkout));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // safe
    }
  }, [activeWorkout]);

  // Master Timer loop: runs continuously even across page navigation
  useEffect(() => {
    if (!activeWorkout.isActive) {
      return;
    }

    if (activeWorkout.isCompleted) {
      if (typeof activeWorkout.completedDurationSeconds === 'number') {
        elapsedSecondsRef.current = activeWorkout.completedDurationSeconds;
        setElapsedSeconds(activeWorkout.completedDurationSeconds);
      }
      return;
    }

    const interval = setInterval(() => {
      // 1. Calculate elapsed seconds from real startTime (accurate even if tab is throttled)
      if (activeWorkout.startTime) {
        const diffSec = Math.max(
          0,
          Math.floor((Date.now() - new Date(activeWorkout.startTime).getTime()) / 1000)
        );
        elapsedSecondsRef.current = diffSec;
        setElapsedSeconds((prev) => (prev === diffSec ? prev : diffSec));
      }

      // 2. Calculate remaining rest seconds with high precision
      if (activeWorkout.isResting) {
        if (activeWorkout.isRestPaused) {
          // When paused, maintain frozen remaining seconds
          const frozen = activeWorkout.restRemainingWhenPaused ?? 0;
          setRemainingRestSeconds((prev) => (prev === frozen ? prev : frozen));
        } else if (activeWorkout.restEndTime) {
          const remainingMs = activeWorkout.restEndTime - Date.now();
          const remSec = Math.max(0, Math.ceil(remainingMs / 1000));
          setRemainingRestSeconds((prev) => (prev === remSec ? prev : remSec));

          // Audio cues for 3, 2, 1 countdown
          if (remSec <= 3 && remSec > 0 && lastBeepedSecondRef.current !== remSec) {
            lastBeepedSecondRef.current = remSec;
            playSoundCue('countdown');
          }

          // Auto complete rest when timer expires
          if (remainingMs <= 0) {
            lastBeepedSecondRef.current = null;
            setActiveWorkout((prev) => ({
              ...prev,
              isResting: false,
              isRestPaused: false,
              restStartTime: null,
              restEndTime: null,
              restRemainingWhenPaused: null,
            }));
            setRemainingRestSeconds(0);
            playSoundCue('finish');
          }
        }
      }
    }, 200);

    return () => clearInterval(interval);
  }, [
    activeWorkout.isActive,
    activeWorkout.isCompleted,
    activeWorkout.completedDurationSeconds,
    activeWorkout.isResting,
    activeWorkout.isRestPaused,
    activeWorkout.restEndTime,
    activeWorkout.restRemainingWhenPaused,
    activeWorkout.startTime,
  ]);

  const startWorkout = useCallback((rec: any) => {
    const now = new Date().toISOString();
    lastBeepedSecondRef.current = null;
    elapsedSecondsRef.current = 0;
    const newState: ActiveWorkoutState = {
      ...initialState,
      isActive: true,
      recommendation: rec,
      startTime: now,
    };
    setActiveWorkout(newState);
    setElapsedSeconds(0);
    setRemainingRestSeconds(0);
    playSoundCue('finish');
  }, []);

  const completeSet = useCallback(() => {
    lastBeepedSecondRef.current = null;
    playSoundCue('finish');
    setActiveWorkout((prev) => {
      const rec = prev.recommendation;
      if (!rec || !rec.exercises) return prev;

      const currentEx = rec.exercises[prev.currentExerciseIndex];
      if (!currentEx) return prev;

      const newLog = {
        ...prev.completedSetsLog,
        [currentEx.exerciseId]: (prev.completedSetsLog[currentEx.exerciseId] || 0) + 1,
      };

      const now = Date.now();
      const duration = currentEx.restSeconds || 45;
      const endTime = now + duration * 1000;
      setRemainingRestSeconds(duration);

      if (prev.currentSet < currentEx.sets) {
        return {
          ...prev,
          completedSetsLog: newLog,
          isResting: true,
          isRestModalMinimized: false,
          isRestPaused: false,
          restTotalSeconds: duration,
          restStartTime: now,
          restEndTime: endTime,
          restRemainingWhenPaused: null,
          currentSet: prev.currentSet + 1,
        };
      } else {
        if (prev.currentExerciseIndex < rec.exercises.length - 1) {
          const nextEx = rec.exercises[prev.currentExerciseIndex + 1];
          const nextRest = nextEx?.restSeconds || currentEx.restSeconds || 45;
          const nextEndTime = now + nextRest * 1000;
          setRemainingRestSeconds(nextRest);
          return {
            ...prev,
            completedSetsLog: newLog,
            isResting: true,
            isRestModalMinimized: false,
            isRestPaused: false,
            restTotalSeconds: nextRest,
            restStartTime: now,
            restEndTime: nextEndTime,
            restRemainingWhenPaused: null,
            currentExerciseIndex: prev.currentExerciseIndex + 1,
            currentSet: 1,
          };
        } else {
          playSoundCue('levelup');
          setRemainingRestSeconds(0);
          return {
            ...prev,
            completedSetsLog: newLog,
            isCompleted: true,
            isRpeModalDismissed: false,
            isRpeSubmitted: false,
            completedAt: new Date(now).toISOString(),
            completedDurationSeconds: getElapsedSince(prev.startTime, now, elapsedSecondsRef.current),
            isResting: false,
            isRestModalMinimized: false,
            isRestPaused: false,
            restStartTime: null,
            restEndTime: null,
            restRemainingWhenPaused: null,
          };
        }
      }
    });
  }, []);

  const skipExercise = useCallback(() => {
    lastBeepedSecondRef.current = null;
    setActiveWorkout((prev) => {
      const rec = prev.recommendation;
      if (!rec || !rec.exercises) return prev;

      setRemainingRestSeconds(0);

      if (prev.currentExerciseIndex < rec.exercises.length - 1) {
        return {
          ...prev,
          currentExerciseIndex: prev.currentExerciseIndex + 1,
          currentSet: 1,
          isResting: false,
          isRestModalMinimized: false,
          isRestPaused: false,
          restStartTime: null,
          restEndTime: null,
          restRemainingWhenPaused: null,
        };
      } else {
        const now = Date.now();
        playSoundCue('levelup');
        return {
          ...prev,
          isCompleted: true,
          isRpeModalDismissed: false,
          isRpeSubmitted: false,
          completedAt: new Date(now).toISOString(),
          completedDurationSeconds: getElapsedSince(prev.startTime, now, elapsedSecondsRef.current),
          isResting: false,
          isRestModalMinimized: false,
          isRestPaused: false,
          restStartTime: null,
          restEndTime: null,
          restRemainingWhenPaused: null,
        };
      }
    });
  }, []);

  const completeRest = useCallback(() => {
    lastBeepedSecondRef.current = null;
    playSoundCue('finish');
    setActiveWorkout((prev) => ({
      ...prev,
      isResting: false,
      isRestModalMinimized: false,
      isRestPaused: false,
      restStartTime: null,
      restEndTime: null,
      restRemainingWhenPaused: null,
    }));
    setRemainingRestSeconds(0);
  }, []);

  const togglePauseRest = useCallback(() => {
    setActiveWorkout((prev) => {
      if (!prev.isResting) return prev;

      if (prev.isRestPaused) {
        // Resume
        const rem = prev.restRemainingWhenPaused ?? 1;
        lastBeepedSecondRef.current = null;
        return {
          ...prev,
          isRestPaused: false,
          restEndTime: Date.now() + rem * 1000,
          restRemainingWhenPaused: null,
        };
      } else {
        // Pause
        const remainingMs = (prev.restEndTime ?? Date.now()) - Date.now();
        const rem = Math.max(0, Math.ceil(remainingMs / 1000));
        setRemainingRestSeconds(rem);
        return {
          ...prev,
          isRestPaused: true,
          restRemainingWhenPaused: rem,
          restEndTime: null,
        };
      }
    });
  }, []);

  const addRestSeconds = useCallback((sec: number) => {
    setActiveWorkout((prev) => {
      if (!prev.isResting) return prev;

      if (prev.isRestPaused) {
        const curRem = prev.restRemainingWhenPaused ?? 0;
        const newRem = curRem + sec;
        const newTotal = Math.max(1, prev.restTotalSeconds + sec);

        if (newRem <= 0) {
          lastBeepedSecondRef.current = null;
          playSoundCue('finish');
          setRemainingRestSeconds(0);
          return {
            ...prev,
            isResting: false,
            isRestPaused: false,
            restStartTime: null,
            restEndTime: null,
            restRemainingWhenPaused: null,
          };
        }

        setRemainingRestSeconds(newRem);
        return {
          ...prev,
          restTotalSeconds: newTotal,
          restRemainingWhenPaused: newRem,
        };
      } else {
        const curEnd = prev.restEndTime ?? Date.now();
        const newEnd = curEnd + sec * 1000;
        const remainingMs = newEnd - Date.now();
        const remSec = Math.max(0, Math.ceil(remainingMs / 1000));
        const newTotal = Math.max(1, prev.restTotalSeconds + sec);

        if (remainingMs <= 0) {
          lastBeepedSecondRef.current = null;
          playSoundCue('finish');
          setRemainingRestSeconds(0);
          return {
            ...prev,
            isResting: false,
            isRestPaused: false,
            restStartTime: null,
            restEndTime: null,
            restRemainingWhenPaused: null,
          };
        }

        setRemainingRestSeconds(remSec);
        return {
          ...prev,
          restTotalSeconds: newTotal,
          restEndTime: newEnd,
        };
      }
    });
  }, []);

  const minimizeRestModal = useCallback(() => {
    setActiveWorkout((prev) => ({
      ...prev,
      isRestModalMinimized: true,
    }));
  }, []);

  const maximizeRestModal = useCallback(() => {
    setActiveWorkout((prev) => ({
      ...prev,
      isRestModalMinimized: false,
    }));
  }, []);

  const dismissRpeModal = useCallback(() => {
    setActiveWorkout((prev) => {
      if (!prev.isActive || !prev.isCompleted || prev.isRpeSubmitted) return prev;
      return {
        ...prev,
        isRpeModalDismissed: true,
      };
    });
  }, []);

  const reopenRpeModal = useCallback(() => {
    setActiveWorkout((prev) => {
      if (!prev.isActive || !prev.isCompleted || prev.isRpeSubmitted) return prev;
      return {
        ...prev,
        isRpeModalDismissed: false,
      };
    });
  }, []);

  const discardWorkout = useCallback(() => {
    lastBeepedSecondRef.current = null;
    elapsedSecondsRef.current = 0;
    setActiveWorkout(initialState);
    setElapsedSeconds(0);
    setRemainingRestSeconds(0);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // safe
      }
    }
  }, []);

  const submitWorkout = useCallback(async (rpeScore: number) => {
    const rec = activeWorkout.recommendation;
    if (!rec) return null;

    const effectiveCompletedAt = activeWorkout.completedAt || new Date().toISOString();
    const effectiveDurationSeconds =
      activeWorkout.completedDurationSeconds ?? elapsedSecondsRef.current;

    const submissionData = {
      workoutTitle: rec.title,
      startedAt: activeWorkout.startTime || effectiveCompletedAt,
      completedAt: effectiveCompletedAt,
      durationSeconds: Math.max(effectiveDurationSeconds, 60),
      estimatedDurationMin: Number(rec.estimatedDurationMin || 15),
      totalReps: rec.exercises.reduce(
        (sum: number, ex: any) => sum + (activeWorkout.completedSetsLog[ex.exerciseId] || ex.sets) * ex.reps,
        0
      ),
      rpeScore,
      exercises: rec.exercises.map((ex: any) => ({
        exerciseId: ex.exerciseId,
        exerciseName: ex.name,
        setsCompleted: activeWorkout.completedSetsLog[ex.exerciseId] || ex.sets,
        repsPerSet: ex.reps,
        difficulty: ex.difficulty,
      })),
    };

    const res = await ApiClient.submitWorkout(submissionData);
    // Clear persisted pending workout immediately so reloading cannot duplicate submission,
    // while keeping isCompleted true until the user closes the reward celebration screen.
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // safe
      }
    }
    setActiveWorkout((prev) =>
      prev.isActive
        ? { ...prev, isRpeSubmitted: true, isRpeModalDismissed: false }
        : prev,
    );
    invalidate(CACHE_KEYS.TODAY_STATUS);
    invalidate(CACHE_KEYS.RECOMMENDATION);
    invalidate(CACHE_KEYS.WORKOUT_HISTORY);
    await refreshUser();
    return res;
  }, [activeWorkout, invalidate, refreshUser]);

  const isMiniBarVisibleOnPath = useCallback(
    (pathname: string) => {
      const isRestingMinimized =
        activeWorkout.isResting &&
        (pathname !== '/workout' || activeWorkout.isRestModalMinimized);
      return (
        activeWorkout.isActive &&
        !activeWorkout.isRpeSubmitted &&
        (pathname !== '/workout' || isRestingMinimized)
      );
    },
    [
      activeWorkout.isActive,
      activeWorkout.isRpeSubmitted,
      activeWorkout.isResting,
      activeWorkout.isRestModalMinimized,
    ],
  );

  const contextValue = React.useMemo(
    () => ({
      activeWorkout,
      elapsedSeconds,
      remainingRestSeconds,
      isRestModalMinimized: activeWorkout.isRestModalMinimized,
      isRestPaused: activeWorkout.isRestPaused,
      isMiniBarVisibleOnPath,
      startWorkout,
      completeSet,
      skipExercise,
      completeRest,
      togglePauseRest,
      addRestSeconds,
      minimizeRestModal,
      maximizeRestModal,
      dismissRpeModal,
      reopenRpeModal,
      discardWorkout,
      submitWorkout,
    }),
    [
      activeWorkout,
      elapsedSeconds,
      remainingRestSeconds,
      isMiniBarVisibleOnPath,
      startWorkout,
      completeSet,
      skipExercise,
      completeRest,
      togglePauseRest,
      addRestSeconds,
      minimizeRestModal,
      maximizeRestModal,
      dismissRpeModal,
      reopenRpeModal,
      discardWorkout,
      submitWorkout,
    ],
  );

  return <WorkoutContext.Provider value={contextValue}>{children}</WorkoutContext.Provider>;
}

export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
}
