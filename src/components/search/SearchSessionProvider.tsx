'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type {
  MedicationSearchEngine,
  ResultadoBusca,
} from '@/lib/searchEngine';
import {
  clearSearchSession,
  loadSearchSession,
  saveSearchSession,
} from '@/lib/searchSession';
import type { Medicamento } from '@/types/schema';

export interface SearchSessionContextValue {
  query: string;
  results: ResultadoBusca[];
  scrollY: number;
  isHydrated: boolean;
  setQuery: (nextQuery: string) => void;
  clearQuery: () => void;
  recordScrollY: (scrollY: number) => void;
}

const SearchSessionContext = createContext<SearchSessionContextValue | null>(null);

export interface SearchSessionProviderProps {
  catalogo: readonly Medicamento[];
  children: React.ReactNode;
}

export function SearchSessionProvider({ catalogo, children }: SearchSessionProviderProps) {
  const [query, setQueryState] = useState<string>('');
  const [results, setResults] = useState<ResultadoBusca[]>([]);
  const [scrollY, setScrollYState] = useState<number>(0);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  const engineRef = useRef<MedicationSearchEngine | null>(null);
  const enginePromiseRef = useRef<Promise<MedicationSearchEngine> | null>(null);

  const ensureEngine = useCallback(async (): Promise<MedicationSearchEngine> => {
    if (engineRef.current) {
      return engineRef.current;
    }
    if (!enginePromiseRef.current) {
      enginePromiseRef.current = import('@/lib/searchEngine').then((mod) => {
        const instance = mod.createMedicationSearchEngine(catalogo);
        engineRef.current = instance;
        return instance;
      });
    }
    return enginePromiseRef.current;
  }, [catalogo]);

  useEffect(() => {
    const restored = loadSearchSession();
    if (restored.lastQuery) {
      setQueryState(restored.lastQuery);
    }
    if (restored.scrollY > 0) {
      setScrollYState(restored.scrollY);
    }
    setIsHydrated(true);

    // Pré-carrega o motor de busca após a hidratação inicial sem pesar no bundle crítico
    void ensureEngine();
  }, [ensureEngine]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    saveSearchSession({ lastQuery: query, scrollY });
  }, [query, scrollY, isHydrated]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }

    if (engineRef.current) {
      setResults(engineRef.current.search(trimmed));
      return;
    }

    let active = true;
    void ensureEngine().then((engine) => {
      if (active) {
        setResults(engine.search(trimmed));
      }
    });

    return () => {
      active = false;
    };
  }, [query, ensureEngine]);

  const setQuery = useCallback((nextQuery: string) => {
    setQueryState(nextQuery);
    setScrollYState(0);
  }, []);

  const clearQuery = useCallback(() => {
    setQueryState('');
    setResults([]);
    setScrollYState(0);
    clearSearchSession();
  }, []);

  const recordScrollY = useCallback(
    (nextScrollY: number) => {
      const safeY = Math.max(0, Math.round(nextScrollY));
      setScrollYState(safeY);
      saveSearchSession({ lastQuery: query, scrollY: safeY });
    },
    [query],
  );

  const value = useMemo<SearchSessionContextValue>(
    () => ({
      query,
      results,
      scrollY,
      isHydrated,
      setQuery,
      clearQuery,
      recordScrollY,
    }),
    [query, results, scrollY, isHydrated, setQuery, clearQuery, recordScrollY],
  );

  return <SearchSessionContext.Provider value={value}>{children}</SearchSessionContext.Provider>;
}

export function useSearchSession(): SearchSessionContextValue {
  const ctx = useContext(SearchSessionContext);
  if (!ctx) {
    throw new Error('useSearchSession deve ser usado dentro de um SearchSessionProvider');
  }
  return ctx;
}
