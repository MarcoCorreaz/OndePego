/* eslint-disable no-restricted-globals */
/**
 * Onde Pego — Service Worker Offline-First (public/sw.js)
 *
 * Regras técnicas (DAS.md Seções 4.3, 9 e 11):
 * 1. Armazena App Shell (rotas principais HTML), bundles estáticos (`/_next/static/*` incluindo `.woff2`)
 *    e arquivos de mapa `.pmtiles` da mesma origem.
 * 2. Proteção estrita contra HTTP 206 Partial Content: a Cache API nativa rejeita `cache.put()` em
 *    respostas com status 206. Este SW NUNCA chama `cache.put()` se `response.status !== 200` ou se a
 *    requisição original tinha cabeçalho `Range`.
 * 3. Suporte a Range Requests (`.pmtiles`) offline: se o arquivo `.pmtiles` completo estiver no cache,
 *    responde a requisições `Range: bytes=start-end` fatiando o ArrayBuffer com `buffer.slice(start, end + 1)`
 *    e devolvendo `206 Partial Content` com `Content-Range` e `Content-Length` exatos.
 */

const SHELL_CACHE_NAME = 'onde-pego-shell-v1';
const STATIC_CACHE_NAME = 'onde-pego-static-v1';
const TILES_CACHE_NAME = 'onde-pego-tiles-v1';
const EXPECTED_CACHES = [SHELL_CACHE_NAME, STATIC_CACHE_NAME, TILES_CACHE_NAME];

const APP_SHELL_URLS = [
  '/',
  '/buscar/',
  '/unidades/',
  '/plantao/',
  '/sobre/',
  '/manifest.webmanifest',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
];

function canCacheResponse(status, hasRangeHeader) {
  if (hasRangeHeader) return false;
  return status === 200;
}

function parseHttpByteRange(rangeHeader, totalLength) {
  if (!rangeHeader || totalLength <= 0) return null;
  const match = /^bytes=(\d*)-(\d*)$/i.exec(rangeHeader.trim());
  if (!match) return null;

  const rawStart = match[1] || '';
  const rawEnd = match[2] || '';
  if (rawStart === '' && rawEnd === '') return null;

  let start;
  let end;

  if (rawStart === '') {
    const suffixLength = Number.parseInt(rawEnd, 10);
    if (!Number.isFinite(suffixLength) || suffixLength <= 0) return null;
    start = Math.max(0, totalLength - suffixLength);
    end = totalLength - 1;
  } else {
    start = Number.parseInt(rawStart, 10);
    if (!Number.isFinite(start) || start < 0 || start >= totalLength) return null;
    if (rawEnd === '') {
      end = totalLength - 1;
    } else {
      const parsedEnd = Number.parseInt(rawEnd, 10);
      if (!Number.isFinite(parsedEnd) || parsedEnd < start) return null;
      end = Math.min(parsedEnd, totalLength - 1);
    }
  }

  return { start, end };
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE_NAME)
      .then((cache) =>
        Promise.allSettled(
          APP_SHELL_URLS.map(async (url) => {
            const response = await fetch(url, { cache: 'no-cache' });
            if (canCacheResponse(response.status, false)) {
              await cache.put(url, response);
            }
          }),
        ),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (!EXPECTED_CACHES.includes(key)) {
              return caches.delete(key);
            }
            return Promise.resolve(false);
          }),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

async function handleRangeOrPmtilesRequest(request) {
  const rangeHeader = request.headers.get('range');
  const cache = await caches.open(TILES_CACHE_NAME);
  const cleanUrl = request.url;

  const cachedFullResponse = await cache.match(cleanUrl);
  if (cachedFullResponse) {
    if (!rangeHeader) {
      return cachedFullResponse;
    }

    const fullBuffer = await cachedFullResponse.arrayBuffer();
    const total = fullBuffer.byteLength;
    const parsed = parseHttpByteRange(rangeHeader, total);

    if (!parsed) {
      return new Response(null, {
        status: 416,
        headers: {
          'Accept-Ranges': 'bytes',
          'Content-Range': `bytes */${total}`,
        },
      });
    }

    const { start, end } = parsed;
    const sliced = fullBuffer.slice(start, end + 1);
    const byteCount = end - start + 1;

    return new Response(sliced, {
      status: 206,
      headers: {
        'Accept-Ranges': 'bytes',
        'Content-Type':
          cachedFullResponse.headers.get('Content-Type') || 'application/vnd.pmtiles',
        'Content-Length': String(byteCount),
        'Content-Range': `bytes ${start}-${end}/${total}`,
      },
    });
  }

  try {
    const networkResponse = await fetch(request);
    // NUNCA chamar cache.put() se status !== 200 ou se havia cabeçalho Range (ex.: 206 Partial Content)
    if (canCacheResponse(networkResponse.status, Boolean(rangeHeader))) {
      await cache.put(cleanUrl, networkResponse.clone());
    }
    return networkResponse;
  } catch (err) {
    return new Response(null, { status: 504, statusText: 'Offline tile unavailable' });
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const hasRangeHeader = request.headers.has('range');
  const isPmtiles = url.pathname.endsWith('.pmtiles') || url.pathname.startsWith('/tiles/');

  if (hasRangeHeader || isPmtiles) {
    event.respondWith(handleRangeOrPmtilesRequest(request));
    return;
  }

  // Ativos estáticos imutáveis (_next/static/*, fontes .woff2, ícones): Cache-First
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname === '/manifest.webmanifest'
  ) {
    event.respondWith(
      caches.open(STATIC_CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;

        const response = await fetch(request);
        if (canCacheResponse(response.status, false)) {
          await cache.put(request, response.clone());
        }
        return response;
      }),
    );
    return;
  }

  // Documentos de navegação (HTML): Network-First com fallback para o cache offline
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          if (canCacheResponse(response.status, false)) {
            const cache = await caches.open(SHELL_CACHE_NAME);
            await cache.put(request, response.clone());
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(SHELL_CACHE_NAME);
          const exactMatch = await cache.match(request);
          if (exactMatch) return exactMatch;

          // Tenta com barra final (trailingSlash: true)
          const normalizedPath = url.pathname.endsWith('/')
            ? url.pathname
            : `${url.pathname}/`;
          const slashMatch = await cache.match(normalizedPath);
          if (slashMatch) return slashMatch;

          const rootFallback = await cache.match('/');
          return (
            rootFallback ||
            new Response('Você está offline e esta página ainda não foi salva no aparelho.', {
              status: 503,
              headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            })
          );
        }),
    );
  }
});
