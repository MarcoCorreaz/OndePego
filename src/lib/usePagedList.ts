'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  PAGED_LIST_STORAGE_PREFIX,
  type PagedListSlice,
  buildPagedStorageKey,
  computePagedSlice,
  loadSavedPagedLimit,
  savePagedLimit,
} from '@/lib/pagedList';

export {
  PAGED_LIST_STORAGE_PREFIX,
  type PagedListSlice,
  buildPagedStorageKey,
  computePagedSlice,
  loadSavedPagedLimit,
  savePagedLimit,
};

export interface UsePagedListOptions<T> {
  items: readonly T[];
  initialLimit: number;
  step?: number;
  storageKey: string;
  resetKey?: string;
}

export interface UsePagedListResult<T> extends PagedListSlice<T> {
  showMore: () => void;
  showAll: () => void;
  resetLimit: () => void;
}

/**
 * Hook de Paginação Progressiva ("Mostrar mais") com persistência na sessão da aba (`sessionStorage`).
 * Evita renderizar dezenas de cartões pesados de uma só vez em celulares de entrada,
 * preservando a quantidade expandida quando o usuário navega para um detalhe e volta.
 */
export function usePagedList<T>({
  items,
  initialLimit,
  step,
  storageKey,
  resetKey = '',
}: UsePagedListOptions<T>): UsePagedListResult<T> {
  const safeInitial = Math.max(1, Math.floor(initialLimit));
  const safeStep = Math.max(1, Math.floor(step ?? safeInitial));

  const [limit, setLimit] = useState<number>(() =>
    loadSavedPagedLimit(storageKey, safeInitial, resetKey),
  );
  const prevResetKeyRef = useRef<string>(resetKey);

  useEffect(() => {
    if (prevResetKeyRef.current !== resetKey) {
      prevResetKeyRef.current = resetKey;
      const restoredOrInitial = loadSavedPagedLimit(storageKey, safeInitial, resetKey);
      setLimit(restoredOrInitial);
    }
  }, [resetKey, storageKey, safeInitial]);

  const showMore = useCallback(() => {
    setLimit((prev) => {
      const next = Math.min(items.length, Math.max(safeInitial, prev) + safeStep);
      savePagedLimit(storageKey, next, resetKey);
      return next;
    });
  }, [items.length, resetKey, safeInitial, safeStep, storageKey]);

  const showAll = useCallback(() => {
    const next = Math.max(safeInitial, items.length);
    setLimit(next);
    savePagedLimit(storageKey, next, resetKey);
  }, [items.length, resetKey, safeInitial, storageKey]);

  const resetLimit = useCallback(() => {
    setLimit(safeInitial);
    savePagedLimit(storageKey, safeInitial, resetKey);
  }, [resetKey, safeInitial, storageKey]);

  const slice = useMemo(
    () => computePagedSlice(items, limit, safeInitial, safeStep),
    [items, limit, safeInitial, safeStep],
  );

  return {
    ...slice,
    showMore,
    showAll,
    resetLimit,
  };
}
