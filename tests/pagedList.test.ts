import { describe, expect, it } from 'vitest';
import {
  buildPagedStorageKey,
  computePagedSlice,
  loadSavedPagedLimit,
  savePagedLimit,
} from '@/lib/pagedList';

function createFakeStorage() {
  const store = new Map<string, string>();
  return {
    store,
    storage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
    },
  };
}

describe('Paginação Progressiva (src/lib/pagedList.ts & usePagedList.ts — Bloco C1)', () => {
  const ITEMS_25 = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }));

  it('1. Limita os itens iniciais a initialLimit e calcula remainingCount e nextStepCount', () => {
    const slice = computePagedSlice(ITEMS_25, 10, 10, 10);
    expect(slice.visibleItems).toHaveLength(10);
    expect(slice.visibleCount).toBe(10);
    expect(slice.totalCount).toBe(25);
    expect(slice.remainingCount).toBe(15);
    expect(slice.hasMore).toBe(true);
    expect(slice.nextStepCount).toBe(10);
  });

  it('2. Na última página parcial, nextStepCount reflete apenas os itens restantes e hasMore vai a false ao exibir tudo', () => {
    const slice20 = computePagedSlice(ITEMS_25, 20, 10, 10);
    expect(slice20.visibleCount).toBe(20);
    expect(slice20.remainingCount).toBe(5);
    expect(slice20.hasMore).toBe(true);
    expect(slice20.nextStepCount).toBe(5);

    const sliceAll = computePagedSlice(ITEMS_25, 30, 10, 10);
    expect(sliceAll.visibleCount).toBe(25);
    expect(sliceAll.remainingCount).toBe(0);
    expect(sliceAll.hasMore).toBe(false);
    expect(sliceAll.nextStepCount).toBe(0);
  });

  it('3. Persiste e restaura o limite expandido no sessionStorage isolado por storageKey e resetKey', () => {
    const { storage, store } = createFakeStorage();

    expect(loadSavedPagedLimit('mapa_gaveta', 10, 'TODOS||', storage)).toBe(10);

    savePagedLimit('mapa_gaveta', 20, 'TODOS||', storage);
    expect(store.has(buildPagedStorageKey('mapa_gaveta', 'TODOS||'))).toBe(true);
    expect(loadSavedPagedLimit('mapa_gaveta', 10, 'TODOS||', storage)).toBe(20);

    // Ao mudar o filtro (resetKey diferente), volta ao initialLimit
    expect(loadSavedPagedLimit('mapa_gaveta', 10, 'UPA||', storage)).toBe(10);
  });
});
