import { DEFAULT_PMTILES_ARCHIVE_PATH } from '@/lib/pmtilesProtocol';

export const TILES_CACHE_NAME = 'onde-pego-tiles-v1';

export type OfflineMapState =
  | 'checando'
  | 'nao-salvo'
  | 'baixando'
  | 'salvo'
  | 'erro'
  | 'sem-suporte';

export type OfflineMapEvent =
  | { type: 'UNSUPPORTED' }
  | { type: 'CHECK_FOUND'; sizeBytes?: number | null }
  | { type: 'CHECK_NOT_FOUND'; sizeBytes?: number | null }
  | { type: 'START_DOWNLOAD' }
  | { type: 'DOWNLOAD_SUCCESS'; sizeBytes?: number | null }
  | { type: 'DOWNLOAD_ERROR' }
  | { type: 'REMOVE_SAVED' };

export interface OfflineMapProgress {
  loadedBytes: number;
  totalBytes: number | null;
  percent: number | null;
}

/**
 * Formata uma quantidade de bytes em megabytes no padrão pt-BR (ex.: "4,5 MB" ou "12 MB").
 */
export function formatBytesToMB(bytes: number | null | undefined): string {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes) || bytes <= 0) {
    return '0 MB';
  }
  const mb = bytes / (1024 * 1024);
  const rounded = Math.max(0.1, Math.round(mb * 10) / 10);
  const formattedNumber = Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(1).replace('.', ',');
  return `${formattedNumber} MB`;
}

/**
 * Gera o texto de interface exibido antes de iniciar o download do mapa.
 */
export function formatPreDownloadCopy(bytes: number | null | undefined): string {
  if (typeof bytes === 'number' && Number.isFinite(bytes) && bytes > 0) {
    return `O mapa tem cerca de ${formatBytesToMB(bytes)}. Se puder, baixe com Wi-Fi.`;
  }
  return 'O mapa pode consumir dados móveis. Se puder, baixe com Wi-Fi.';
}

/**
 * Gera o texto do estado salvo com tamanho real em MB.
 */
export function formatSavedMapCopy(bytes: number | null | undefined): string {
  if (typeof bytes === 'number' && Number.isFinite(bytes) && bytes > 0) {
    return `Mapa salvo (${formatBytesToMB(bytes)})`;
  }
  return 'Mapa salvo neste aparelho';
}

/**
 * Calcula o percentual inteiro (0..100) do download contra o Content-Length.
 * Retorna `null` quando o tamanho total é desconhecido (estado indeterminado).
 */
export function calculateDownloadProgress(
  loadedBytes: number,
  totalBytes: number | null | undefined,
): number | null {
  if (typeof totalBytes !== 'number' || !Number.isFinite(totalBytes) || totalBytes <= 0) {
    return null;
  }
  if (!Number.isFinite(loadedBytes) || loadedBytes <= 0) {
    return 0;
  }
  const ratio = (loadedBytes / totalBytes) * 100;
  return Math.min(100, Math.max(0, Math.round(ratio)));
}

/**
 * Máquina de estados pura para o gerenciamento do mapa offline.
 */
export function transitionOfflineMapState(
  current: OfflineMapState,
  event: OfflineMapEvent,
): OfflineMapState {
  if (event.type === 'UNSUPPORTED') {
    return 'sem-suporte';
  }
  if (current === 'sem-suporte') {
    return 'sem-suporte';
  }

  switch (event.type) {
    case 'CHECK_FOUND':
      return 'salvo';
    case 'CHECK_NOT_FOUND':
      return 'nao-salvo';
    case 'START_DOWNLOAD':
      if (current === 'nao-salvo' || current === 'erro' || current === 'salvo') {
        return 'baixando';
      }
      return current;
    case 'DOWNLOAD_SUCCESS':
      return 'salvo';
    case 'DOWNLOAD_ERROR':
      return 'erro';
    case 'REMOVE_SAVED':
      return 'nao-salvo';
    default:
      return current;
  }
}

function parseContentLength(headers: Headers): number | null {
  const raw = headers.get('content-length') ?? headers.get('Content-Length');
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function notifyServiceWorkerPmtilesChange(
  type: 'PMTILES_CACHE_UPDATED' | 'PMTILES_CACHE_REMOVED',
  url: string,
): void {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }
  try {
    navigator.serviceWorker.controller?.postMessage({ type, url });
  } catch {
    // Ignora falha de postMessage se o controller não estiver ativo
  }
}

/**
 * Remove entradas antigas de `.pmtiles` do cache `onde-pego-tiles-v1` que não correspondam ao caminho atual.
 */
export async function cleanupOldPmtilesInCache(
  cache: Cache,
  keepArchivePath: string,
): Promise<number> {
  const requests = await cache.keys();
  let removedCount = 0;

  for (const req of requests) {
    try {
      const reqUrl = new URL(req.url, 'https://ondepego.local');
      const isPmtilesEntry =
        reqUrl.pathname.endsWith('.pmtiles') || reqUrl.pathname.startsWith('/tiles/');
      if (
        isPmtilesEntry &&
        reqUrl.pathname !== keepArchivePath &&
        req.url !== keepArchivePath
      ) {
        const deleted = await cache.delete(req);
        if (deleted) removedCount += 1;
      }
    } catch {
      // Ignora URL malformada
    }
  }

  return removedCount;
}

/**
 * Verifica se o arquivo `.pmtiles` já está salvo no Cache Storage e, caso não esteja,
 * consulta seu tamanho real via `HEAD` (sem iniciar download do arquivo).
 */
export async function checkOfflineMapStatus(
  archivePath: string = DEFAULT_PMTILES_ARCHIVE_PATH,
  env: {
    cachesApi?: CacheStorage;
    fetchFn?: typeof fetch;
  } = {},
): Promise<{ state: OfflineMapState; sizeBytes: number | null }> {
  const cachesApi =
    env.cachesApi ?? (typeof window !== 'undefined' ? window.caches : undefined);
  const fetchFn = env.fetchFn ?? (typeof fetch !== 'undefined' ? fetch : undefined);

  if (!cachesApi) {
    return { state: 'sem-suporte', sizeBytes: null };
  }

  try {
    const cache = await cachesApi.open(TILES_CACHE_NAME);
    const cachedResponse = await cache.match(archivePath);
    if (cachedResponse && cachedResponse.status === 200) {
      const headerSize = parseContentLength(cachedResponse.headers);
      if (headerSize !== null) {
        return { state: 'salvo', sizeBytes: headerSize };
      }
      const blob = await cachedResponse.clone().blob();
      return { state: 'salvo', sizeBytes: blob.size > 0 ? blob.size : null };
    }
  } catch {
    return { state: 'sem-suporte', sizeBytes: null };
  }

  if (!fetchFn) {
    return { state: 'nao-salvo', sizeBytes: null };
  }

  try {
    const headResponse = await fetchFn(archivePath, { method: 'HEAD' });
    const sizeBytes = headResponse.ok ? parseContentLength(headResponse.headers) : null;
    return { state: 'nao-salvo', sizeBytes };
  } catch {
    return { state: 'nao-salvo', sizeBytes: null };
  }
}

/**
 * Faz o download completo (GET 200 OK sem cabeçalho Range) do arquivo `.pmtiles` sob ação explícita
 * do usuário, reportando progresso real a partir de `response.body.getReader()` e salvando no
 * cache `onde-pego-tiles-v1`.
 */
export async function downloadOfflineMapToCache(
  archivePath: string = DEFAULT_PMTILES_ARCHIVE_PATH,
  onProgress?: (progress: OfflineMapProgress) => void,
  env: {
    cachesApi?: CacheStorage;
    fetchFn?: typeof fetch;
  } = {},
): Promise<{ sizeBytes: number }> {
  const cachesApi =
    env.cachesApi ?? (typeof window !== 'undefined' ? window.caches : undefined);
  const fetchFn = env.fetchFn ?? (typeof fetch !== 'undefined' ? fetch : undefined);

  if (!cachesApi || !fetchFn) {
    throw new Error('Armazenamento offline não suportado neste navegador.');
  }

  // GET completo explícito SEM cabeçalho Range
  const response = await fetchFn(archivePath, {
    method: 'GET',
    cache: 'no-store',
  });

  if (response.status !== 200) {
    throw new Error(`Falha ao baixar arquivo de mapa (status ${response.status}).`);
  }

  const totalBytes = parseContentLength(response.headers);
  onProgress?.({
    loadedBytes: 0,
    totalBytes,
    percent: calculateDownloadProgress(0, totalBytes),
  });

  let fullBytes: Uint8Array;

  if (response.body && typeof response.body.getReader === 'function') {
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let loadedBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value && value.byteLength > 0) {
        chunks.push(value);
        loadedBytes += value.byteLength;
        onProgress?.({
          loadedBytes,
          totalBytes,
          percent: calculateDownloadProgress(loadedBytes, totalBytes),
        });
      }
    }

    fullBytes = new Uint8Array(loadedBytes);
    let offset = 0;
    for (const chunk of chunks) {
      fullBytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
  } else {
    const buffer = await response.arrayBuffer();
    fullBytes = new Uint8Array(buffer);
    onProgress?.({
      loadedBytes: fullBytes.byteLength,
      totalBytes: totalBytes ?? fullBytes.byteLength,
      percent: 100,
    });
  }

  if (fullBytes.byteLength === 0) {
    throw new Error('O arquivo de mapa recebido está vazio.');
  }

  const responseToCache = new Response(fullBytes.buffer as ArrayBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.pmtiles',
      'Content-Length': String(fullBytes.byteLength),
    },
  });

  const cache = await cachesApi.open(TILES_CACHE_NAME);
  await cache.put(archivePath, responseToCache);
  await cleanupOldPmtilesInCache(cache, archivePath);

  // Confirma com caches.match que o arquivo está salvo no Cache Storage
  const verifiedMatch = await cache.match(archivePath);
  if (!verifiedMatch || verifiedMatch.status !== 200) {
    throw new Error('Não foi possível confirmar a gravação do mapa no aparelho.');
  }

  notifyServiceWorkerPmtilesChange('PMTILES_CACHE_UPDATED', archivePath);

  return { sizeBytes: fullBytes.byteLength };
}

/**
 * Remove o arquivo `.pmtiles` do cache `onde-pego-tiles-v1` e avisa o Service Worker
 * para liberar o `ArrayBuffer` em memória.
 */
export async function removeOfflineMapFromCache(
  archivePath: string = DEFAULT_PMTILES_ARCHIVE_PATH,
  env: {
    cachesApi?: CacheStorage;
  } = {},
): Promise<boolean> {
  const cachesApi =
    env.cachesApi ?? (typeof window !== 'undefined' ? window.caches : undefined);
  if (!cachesApi) {
    return false;
  }

  const cache = await cachesApi.open(TILES_CACHE_NAME);
  const deletedPrimary = await cache.delete(archivePath);
  await cleanupOldPmtilesInCache(cache, '');

  notifyServiceWorkerPmtilesChange('PMTILES_CACHE_REMOVED', archivePath);
  return deletedPrimary;
}
