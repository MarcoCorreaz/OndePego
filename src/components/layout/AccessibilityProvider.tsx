'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  type AccessibilityPrefs,
  DEFAULT_PREFS,
  type FontScale,
  type ThemeMode,
  applyPrefsToRootElement,
  loadPrefs,
  savePrefs,
  shouldApplyDarkTheme,
  shouldReduceMotion,
} from '@/lib/prefs';

export interface AccessibilityContextValue {
  prefs: AccessibilityPrefs;
  effectiveReduceMotion: boolean;
  isDark: boolean;
  isPanelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
  setFontScale: (fontScale: FontScale) => void;
  setHighContrast: (highContrast: boolean) => void;
  setReduceMotion: (reduceMotion: boolean) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  resetPrefs: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  // Inicia com DEFAULT_PREFS para evitar mismatch de hidratação no export estático
  const [prefs, setPrefs] = useState<AccessibilityPrefs>(DEFAULT_PREFS);
  const [systemReducedMotion, setSystemReducedMotion] = useState<boolean>(false);
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);

  useEffect(() => {
    const stored = loadPrefs();
    setPrefs(stored);

    const motionMql =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;

    const darkMql =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-color-scheme: dark)')
        : null;

    const sysReduced = Boolean(motionMql?.matches);
    const sysDark = Boolean(darkMql?.matches);

    setSystemReducedMotion(sysReduced);
    setSystemPrefersDark(sysDark);

    applyPrefsToRootElement(document.documentElement, stored, sysReduced, sysDark);
    setIsHydrated(true);

    const handleMotionChange = (event: MediaQueryListEvent) => {
      setSystemReducedMotion(event.matches);
    };

    const handleDarkChange = (event: MediaQueryListEvent) => {
      setSystemPrefersDark(event.matches);
    };

    motionMql?.addEventListener('change', handleMotionChange);
    darkMql?.addEventListener('change', handleDarkChange);

    return () => {
      motionMql?.removeEventListener('change', handleMotionChange);
      darkMql?.removeEventListener('change', handleDarkChange);
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    savePrefs(prefs);
    applyPrefsToRootElement(document.documentElement, prefs, systemReducedMotion, systemPrefersDark);
  }, [prefs, systemReducedMotion, systemPrefersDark, isHydrated]);

  const setFontScale = useCallback((fontScale: FontScale) => {
    setPrefs((prev) => ({ ...prev, fontScale }));
  }, []);

  const setHighContrast = useCallback((highContrast: boolean) => {
    setPrefs((prev) => ({ ...prev, highContrast }));
  }, []);

  const setReduceMotion = useCallback((reduceMotion: boolean) => {
    setPrefs((prev) => ({ ...prev, reduceMotion }));
  }, []);

  const setTheme = useCallback((theme: ThemeMode) => {
    setPrefs((prev) => ({ ...prev, theme }));
  }, []);

  const isDark = shouldApplyDarkTheme(prefs, systemPrefersDark);

  const toggleTheme = useCallback(() => {
    setPrefs((prev) => {
      const currentlyDark = shouldApplyDarkTheme(prev, systemPrefersDark);
      return {
        ...prev,
        theme: currentlyDark ? 'light' : 'dark',
      };
    });
  }, [systemPrefersDark]);

  const resetPrefs = useCallback(() => {
    setPrefs(DEFAULT_PREFS);
  }, []);

  const openPanel = useCallback(() => {
    setIsPanelOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setIsPanelOpen(false);
  }, []);

  const effectiveReduceMotion = shouldReduceMotion(prefs, systemReducedMotion);

  const value = useMemo<AccessibilityContextValue>(
    () => ({
      prefs,
      effectiveReduceMotion,
      isDark,
      isPanelOpen,
      openPanel,
      closePanel,
      setFontScale,
      setHighContrast,
      setReduceMotion,
      setTheme,
      toggleTheme,
      resetPrefs,
    }),
    [
      prefs,
      effectiveReduceMotion,
      isDark,
      isPanelOpen,
      openPanel,
      closePanel,
      setFontScale,
      setHighContrast,
      setReduceMotion,
      setTheme,
      toggleTheme,
      resetPrefs,
    ],
  );

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}

const FALLBACK_ACCESSIBILITY_CONTEXT: AccessibilityContextValue = {
  prefs: DEFAULT_PREFS,
  effectiveReduceMotion: false,
  isDark: false,
  isPanelOpen: false,
  openPanel: () => {},
  closePanel: () => {},
  setFontScale: () => {},
  setHighContrast: () => {},
  setReduceMotion: () => {},
  setTheme: () => {},
  toggleTheme: () => {},
  resetPrefs: () => {},
};

export function useAccessibility(): AccessibilityContextValue {
  const ctx = useContext(AccessibilityContext);
  return ctx ?? FALLBACK_ACCESSIBILITY_CONTEXT;
}
