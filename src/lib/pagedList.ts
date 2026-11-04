import {
  getSafeSessionStorage,
  safeStorageGetItem,
  safeStorageSetItem,
} from '@/lib/safeStorage';

export const PAGED_LIST_STORAGE_PREFIX = 'onde_pego_paged_list_v1:';

export interface PagedListSlice<T> {
  visibleItems: readonly T[];
  visibleCount: number;
  totalCount: number;
  remainingCount: number;
  hasMore: boolean;
  nextStepCount: number;
}

/**
 * Calcula de forma pura a fatia visível e os contadores da paginação progressiva ("Mostrar mais").
 */
export function computePagedSlice<T>(
  items: readonly T[],
  requestedLimit: number,
  initialLimit: number,
  step?: number,
): PagedListSlice<T> {
  const safeInitial = Math.max(1, Math.floor(initialLimit));
  const safeStep = Math.max(1, Math.floor(step ?? safeInitial));
  const safeRequested = Math.max(safeInitial, Math.floor(requestedLimit));

  const totalCount = items.length;
  const visibleCount = Math.min(totalCount, safeRequested);
  const visibleItems = items.slice(0, visibleCount);
  const remainingCount = Math.max(0, totalCount - visibleCount);
  const hasMore = remainingCount > 0;
  const nextStepCount = Math.min(remainingCount, safeStep);

  return {
    visibleItems,
    visibleCount,
    totalCount,
    remainingCount,
    hasMore,
    nextStepCount,
  };
}

export function buildPagedStorageKey(storageKey: string, resetKey?: string): string {
  const normalizedReset = (resetKey ?? '').trim();
  return `${PAGED_LIST_STORAGE_PREFIX}${storageKey}::${normalizedReset}`;
}

export function loadSavedPagedLimit(
  storageKey: string,
  initialLimit: number,
  resetKey?: string,
  storage?: Pick<Storage, 'getItem'> | null,
): number {
  const safeInitial = Math.max(1, Math.floor(initialLimit));
  const target = storage !== undefined ? storage : getSafeSessionStorage();
  if (!target) {
    return safeInitial;
  }

  const fullKey = buildPagedStorageKey(storageKey, resetKey);
  const raw = safeStorageGetItem(target as Storage, fullKey);
  if (!raw) {
    return safeInitial;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < safeInitial) {
    return safeInitial;
  }

  return parsed;
}

export function savePagedLimit(
  storageKey: string,
  limit: number,
  resetKey?: string,
  storage?: Pick<Storage, 'setItem'> | null,
): void {
  const target = storage !== undefined ? storage : getSafeSessionStorage();
  if (!target) {
    return;
  }

  const safeLimit = Math.max(1, Math.floor(limit));
  const fullKey = buildPagedStorageKey(storageKey, resetKey);
  safeStorageSetItem(target as Storage, fullKey, String(safeLimit));
}
