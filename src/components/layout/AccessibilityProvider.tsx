'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  type AccessibilityPrefs,
  DEFAULT_PREFS,
  type FontScale,
  applyPrefsToRootElement,
  loadPrefs,
  savePrefs,
  shouldReduceMotion,
} from '@/lib/prefs';

export interface AccessibilityContextValue {
  prefs: AccessibilityPrefs;
  effectiveReduceMotion: boolean;
  isPanelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
  setFontScale: (fontScale: FontScale) => void;
  setHighContrast: (highContrast: boolean) => void;
  setReduceMotion: (reduceMotion: boolean) => void;
  resetPrefs: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  // Inicia com DEFAULT_PREFS para evitar mismatch de hidratação no export estático
  const [prefs, setPrefs] = useState<AccessibilityPrefs>(DEFAULT_PREFS);
  const [systemReducedMotion, setSystemReducedMotion] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);

  useEffect(() => {
    const stored = loadPrefs();
    setPrefs(stored);

    const mql =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;

    const sysReduced = Boolean(mql?.matches);
    setSystemReducedMotion(sysReduced);
    applyPrefsToRootElement(document.documentElement, stored, sysReduced);
    setIsHydrated(true);

    if (!mql) {
      return;
    }

    const handleChange = (event: MediaQueryListEvent) => {
      setSystemReducedMotion(event.matches);
    };

    mql.addEventListener('change', handleChange);
    return () => {
      mql.removeEventListener('change', handleChange);
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    savePrefs(prefs);
    applyPrefsToRootElement(document.documentElement, prefs, systemReducedMotion);
  }, [prefs, systemReducedMotion, isHydrated]);

  const setFontScale = useCallback((fontScale: FontScale) => {
    setPrefs((prev) => ({ ...prev, fontScale }));
  }, []);

  const setHighContrast = useCallback((highContrast: boolean) => {
    setPrefs((prev) => ({ ...prev, highContrast }));
  }, []);

  const setReduceMotion = useCallback((reduceMotion: boolean) => {
    setPrefs((prev) => ({ ...prev, reduceMotion }));
  }, []);

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
      isPanelOpen,
      openPanel,
      closePanel,
      setFontScale,
      setHighContrast,
      setReduceMotion,
      resetPrefs,
    }),
    [
      prefs,
      effectiveReduceMotion,
      isPanelOpen,
      openPanel,
      closePanel,
      setFontScale,
      setHighContrast,
      setReduceMotion,
      resetPrefs,
    ],
  );

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}

export function useAccessibility(): AccessibilityContextValue {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) {
    throw new Error('useAccessibility deve ser usado dentro de um AccessibilityProvider');
  }
  return ctx;
}
