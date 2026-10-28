import { describe, expect, it } from 'vitest';
import {
  type OfflineMapProgress,
  TILES_CACHE_NAME,
  calculateDownloadProgress,
  checkOfflineMapStatus,
  downloadOfflineMapToCache,
  formatBytesToMB,
  formatPreDownloadCopy,
  formatSavedMapCopy,
  removeOfflineMapFromCache,
  transitionOfflineMapState,
} from '@/lib/offlineMapManager';

function createMockCacheStorage() {
  const store = new Map<string, Map<string, Response>>();

  const getMap = (cacheName: string) => {
    if (!store.has(cacheName)) {
      store.set(cacheName, new Map<string, Response>());
    }
    return store.get(cacheName)!;
  };

  const cachesApi = {
    async open(cacheName: string): Promise<Cache> {
      const map = getMap(cacheName);
      return {
        async match(req: RequestInfo | URL) {
          const key = typeof req === 'string' ? req : req instanceof URL ? req.href : req.url;
          const found = map.get(key);
          return found ? found.clone() : undefined;
        },
        async put(req: RequestInfo | URL, res: Response) {
          const key = typeof req === 'string' ? req : req instanceof URL ? req.href : req.url;
          map.set(key, res.clone());
        },
        async delete(req: RequestInfo | URL) {
          const key = typeof req === 'string' ? req : req instanceof URL ? req.href : req.url;
          return map.delete(key);
        },
        async keys() {
          return Array.from(map.keys()).map(
            (k) => new Request(k.startsWith('http') ? k : `https://ondepego.local${k}`),
          );
        },
      } as unknown as Cache;
    },
  } as unknown as CacheStorage;

  return { cachesApi, getMap };
}

describe('offlineMapManager — formatação, progresso, máquina de estados e Cache Storage', () => {
  it('formata bytes para MB no padrão brasileiro (vírgula decimal)', () => {
    expect(formatBytesToMB(0)).toBe('0 MB');
    expect(formatBytesToMB(null)).toBe('0 MB');
    expect(formatBytesToMB(undefined)).toBe('0 MB');
    expect(formatBytesToMB(10 * 1024 * 1024)).toBe('10 MB');
    expect(formatBytesToMB(4.5 * 1024 * 1024)).toBe('4,5 MB');
    expect(formatBytesToMB(15 * 1024)).toBe('0,1 MB');
  });

  it('gera os textos de pré-download e de mapa salvo exatamente como especificado', () => {
    expect(formatPreDownloadCopy(5 * 1024 * 1024)).toBe(
      'O mapa tem cerca de 5 MB. Se puder, baixe com Wi-Fi.',
    );
    expect(formatPreDownloadCopy(null)).toBe(
      'O mapa pode consumir dados móveis. Se puder, baixe com Wi-Fi.',
    );

    expect(formatSavedMapCopy(5 * 1024 * 1024)).toBe('Mapa salvo (5 MB)');
    expect(formatSavedMapCopy(null)).toBe('Mapa salvo neste aparelho');
  });

  it('calcula o percentual de progresso contra Content-Length ou retorna null se indeterminado', () => {
    expect(calculateDownloadProgress(0, 1000)).toBe(0);
    expect(calculateDownloadProgress(250, 1000)).toBe(25);
    expect(calculateDownloadProgress(1000, 1000)).toBe(100);
    expect(calculateDownloadProgress(1500, 1000)).toBe(100);
    expect(calculateDownloadProgress(500, null)).toBeNull();
    expect(calculateDownloadProgress(500, 0)).toBeNull();
  });

  it('transiciona corretamente entre todos os estados da máquina de estados pura', () => {
    let state = transitionOfflineMapState('checando', { type: 'CHECK_NOT_FOUND' });
    expect(state).toBe('nao-salvo');

    state = transitionOfflineMapState(state, { type: 'START_DOWNLOAD' });
    expect(state).toBe('baixando');

    state = transitionOfflineMapState(state, { type: 'DOWNLOAD_ERROR' });
    expect(state).toBe('erro');

    state = transitionOfflineMapState(state, { type: 'START_DOWNLOAD' });
    expect(state).toBe('baixando');

    state = transitionOfflineMapState(state, {
      type: 'DOWNLOAD_SUCCESS',
      sizeBytes: 4 * 1024 * 1024,
    });
    expect(state).toBe('salvo');

    state = transitionOfflineMapState(state, { type: 'REMOVE_SAVED' });
    expect(state).toBe('nao-salvo');

    state = transitionOfflineMapState('checando', { type: 'UNSUPPORTED' });
    expect(state).toBe('sem-suporte');
  });

  it('consulta tamanho via HEAD antes de baixar, faz stream GET 200 OK com progresso, limpa versões antigas e remove quando solicitado', async () => {
    const { cachesApi, getMap } = createMockCacheStorage();
    const archivePath = '/tiles/cuiaba-vg.pmtiles';

    // Simula uma versão antiga já presente no cache para testar a limpeza automática
    const tilesMap = getMap(TILES_CACHE_NAME);
    tilesMap.set(
      'https://ondepego.local/tiles/cuiaba-vg-old.pmtiles',
      new Response(new Uint8Array([1, 2, 3]), { status: 200 }),
    );

    const chunk1 = new Uint8Array(1024).fill(7);
    const chunk2 = new Uint8Array(1024).fill(9);
    const totalLength = chunk1.byteLength + chunk2.byteLength;

    const mockFetch: typeof fetch = async (_input, init) => {
      if (init?.method === 'HEAD') {
        return new Response(null, {
          status: 200,
          headers: { 'Content-Length': String(totalLength) },
        });
      }

      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(chunk1);
          controller.enqueue(chunk2);
          controller.close();
        },
      });

      return new Response(stream, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.pmtiles',
          'Content-Length': String(totalLength),
        },
      });
    };

    // 1. Antes de baixar: estado 'nao-salvo' com tamanho obtido via HEAD
    const initialStatus = await checkOfflineMapStatus(archivePath, {
      cachesApi,
      fetchFn: mockFetch,
    });
    expect(initialStatus).toEqual({
      state: 'nao-salvo',
      sizeBytes: totalLength,
    });

    // 2. Download explícito com leitura de chunks e progresso real
    const progressEvents: OfflineMapProgress[] = [];
    const saved = await downloadOfflineMapToCache(
      archivePath,
      (p) => progressEvents.push(p),
      { cachesApi, fetchFn: mockFetch },
    );

    expect(saved.sizeBytes).toBe(totalLength);
    expect(progressEvents.map((p) => p.percent)).toEqual([0, 50, 100]);

    // Versão antiga foi limpa automaticamente e a versão nova está salva
    expect(tilesMap.has('https://ondepego.local/tiles/cuiaba-vg-old.pmtiles')).toBe(false);
    expect(tilesMap.has(archivePath)).toBe(true);

    // 3. Checagem subsequente confirma estado 'salvo'
    const afterSaveStatus = await checkOfflineMapStatus(archivePath, {
      cachesApi,
      fetchFn: mockFetch,
    });
    expect(afterSaveStatus).toEqual({
      state: 'salvo',
      sizeBytes: totalLength,
    });

    // 4. Remoção sob demanda limpa o Cache Storage
    const removed = await removeOfflineMapFromCache(archivePath, { cachesApi });
    expect(removed).toBe(true);
    expect(tilesMap.has(archivePath)).toBe(false);
  });
});
