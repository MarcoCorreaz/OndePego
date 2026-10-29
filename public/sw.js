/* eslint-disable no-restricted-globals */
/**
 * Onde Pego — Service Worker Offline-First (public/sw.js)
 *
 * Regras técnicas (DAS.md Seções 4.3, 9 e 11):
 * 1. Carrega a fonte única de lógica HTTP Range via `importScripts('/sw-range-helper.js')`.
 * 2. No `install`, lê `/precache-manifest.json`, versiona o cache de App Shell (`onde-pego-shell-${version}`)
 *    e faz o pré-cache de todas as rotas (`N + 5`) com `Promise.allSettled`.
 * 3. Nas requisições de navegação (`request.mode === 'navigate'`), tenta a rede com timeout de
 *    `NAVIGATION_TIMEOUT_MS = 3000` (atualizando o cache em segundo plano se a resposta 200 chegar depois)
 *    e cai imediatamente para o cache local se a rede demorar mais de 3000 ms ou falhar.
 * 4. Se a rota solicitada não existir no cache quando offline, NUNCA devolve o HTML da Home (`/`) para
 *    uma rota diferente de `/`: retorna status `503` (`text/html; charset=utf-8`) com página HTML acessível.
 */

importScripts('/sw-range-helper.js');

const { canCacheResponse, sliceArrayBufferForRange } = self.__ondePegoSwRangeHelper;

const NAVIGATION_TIMEOUT_MS = 3000;
const SHELL_CACHE_PREFIX = 'onde-pego-shell-';
const DEFAULT_SHELL_CACHE_NAME = `${SHELL_CACHE_PREFIX}v1`;
const STATIC_CACHE_NAME = 'onde-pego-static-v1';
const TILES_CACHE_NAME = 'onde-pego-tiles-v1';

const FALLBACK_FIXED_ROUTES = ['/', '/buscar/', '/minha-receita/', '/unidades/', '/plantao/', '/sobre/'];
const SHELL_STATIC_ASSETS = [
  '/manifest.webmanifest',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/sw-range-helper.js',
];

let currentShellCacheName = null;

function normalizePathnameWithTrailingSlash(pathname) {
  if (!pathname || pathname === '/') return '/';
  return pathname.endsWith('/') ? pathname : `${pathname}/`;
}

async function fetchPrecacheManifest() {
  try {
    const res = await fetch('/precache-manifest.json', { cache: 'no-cache' });
    if (res.ok) {
      const data = await res.json();
      if (
        data &&
        typeof data.version === 'string' &&
        data.version.trim().length > 0 &&
        Array.isArray(data.routes)
      ) {
        return {
          version: data.version.trim(),
          routes: data.routes,
          staticAssets: Array.isArray(data.staticAssets) ? data.staticAssets : [],
        };
      }
    }
  } catch {
    // Fallback em modo dev quando precache-manifest.json ainda não existe
  }
  return {
    version: 'v1',
    routes: FALLBACK_FIXED_ROUTES,
    staticAssets: [],
  };
}

async function getActiveShellCache() {
  if (currentShellCacheName) {
    return caches.open(currentShellCacheName);
  }
  const keys = await caches.keys();
  const shellKeys = keys.filter((k) => k.startsWith(SHELL_CACHE_PREFIX));
  if (shellKeys.length > 0) {
    currentShellCacheName = shellKeys[shellKeys.length - 1];
    return caches.open(currentShellCacheName);
  }
  currentShellCacheName = DEFAULT_SHELL_CACHE_NAME;
  return caches.open(currentShellCacheName);
}

function buildOffline503Html() {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Página indisponível sem internet — Onde Pego</title>
  <style>
    :root {
      color-scheme: light;
    }
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 32px 16px;
      background-color: #F7F4EE;
      color: #1F2933;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 18px;
      line-height: 1.55;
    }
    main {
      max-width: 580px;
      margin: 32px auto;
      padding: 28px 24px;
      background-color: #FFFFFF;
      border: 1px solid rgba(31, 41, 51, 0.12);
      border-radius: 16px;
      box-shadow: 0 4px 20px -2px rgba(17, 24, 39, 0.08);
    }
    h1 {
      margin-top: 0;
      font-size: 1.5rem;
      font-weight: 800;
      line-height: 1.25;
      color: #1F2933;
    }
    p {
      margin: 12px 0 24px;
      font-size: 1.125rem;
      color: #52606D;
    }
    a.btn-home {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 48px;
      padding: 12px 24px;
      background-color: #0B3D91;
      color: #FFFFFF;
      font-weight: 700;
      font-size: 1.125rem;
      text-decoration: none;
      border-radius: 12px;
      transition: opacity 0.15s ease;
    }
    a.btn-home:hover {
      opacity: 0.95;
    }
    a.btn-home:focus-visible {
      outline: 3px solid #0B3D91;
      outline-offset: 2px;
    }
  </style>
</head>
<body>
  <main role="main">
    <h1>Você está sem internet</h1>
    <p>Esta página ainda não foi salva neste aparelho. Volte ao início.</p>
    <a class="btn-home" href="/">Voltar ao início</a>
  </main>
</body>
</html>`;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const manifest = await fetchPrecacheManifest();
      const cacheName = `${SHELL_CACHE_PREFIX}${manifest.version}`;
      currentShellCacheName = cacheName;

      const cache = await caches.open(cacheName);
      const urlsToPrecache = Array.from(
        new Set([...manifest.routes, ...SHELL_STATIC_ASSETS]),
      );

      await Promise.allSettled(
        urlsToPrecache.map(async (url) => {
          const response = await fetch(url, { cache: 'no-cache' });
          if (canCacheResponse(response.status, false)) {
            await cache.put(url, response);
          }
        }),
      );

      // Pré-cache dos chunks e assets estáticos adicionais se listados no manifesto
      if (Array.isArray(manifest.staticAssets) && manifest.staticAssets.length > 0) {
        const staticCache = await caches.open(STATIC_CACHE_NAME);
        await Promise.allSettled(
          manifest.staticAssets.map(async (assetUrl) => {
            const response = await fetch(assetUrl, { cache: 'no-cache' });
            if (canCacheResponse(response.status, false)) {
              await staticCache.put(assetUrl, response);
            }
          }),
        );
      }

      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      if (!currentShellCacheName) {
        const manifest = await fetchPrecacheManifest();
        currentShellCacheName = `${SHELL_CACHE_PREFIX}${manifest.version}`;
      }

      const keepCaches = new Set([
        currentShellCacheName,
        STATIC_CACHE_NAME,
        TILES_CACHE_NAME,
      ]);

      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (!keepCaches.has(key)) {
            return caches.delete(key);
          }
          return Promise.resolve(false);
        }),
      );

      await self.clients.claim();
    })(),
  );
});

/**
 * Cache em memória do ArrayBuffer completo do arquivo .pmtiles com singleflight (Promise compartilhada).
 * Evita reler o arquivo inteiro da memória Flash para a RAM a cada requisição HTTP Range durante zoom/arrasto.
 */
let pmtilesMemoryCache = {
  url: null,
  contentType: 'application/vnd.pmtiles',
  bufferPromise: null,
};

function clearPmtilesMemoryCache() {
  pmtilesMemoryCache = {
    url: null,
    contentType: 'application/vnd.pmtiles',
    bufferPromise: null,
  };
}

function getOrLoadPmtilesBuffer(cleanUrl, cachedFullResponse) {
  if (pmtilesMemoryCache.url === cleanUrl && pmtilesMemoryCache.bufferPromise) {
    return pmtilesMemoryCache;
  }

  const contentType =
    cachedFullResponse.headers.get('Content-Type') || 'application/vnd.pmtiles';

  const bufferPromise = cachedFullResponse
    .clone()
    .arrayBuffer()
    .catch((err) => {
      if (pmtilesMemoryCache.url === cleanUrl) {
        clearPmtilesMemoryCache();
      }
      throw err;
    });

  pmtilesMemoryCache = {
    url: cleanUrl,
    contentType,
    bufferPromise,
  };

  return pmtilesMemoryCache;
}

async function cleanupOldPmtilesEntries(cache, keepUrl) {
  const keys = await cache.keys();
  const keepPathname = (() => {
    try {
      return new URL(keepUrl, self.location.origin).pathname;
    } catch {
      return keepUrl;
    }
  })();

  await Promise.all(
    keys.map((req) => {
      try {
        const reqUrl = new URL(req.url, self.location.origin);
        const isPmtilesEntry =
          reqUrl.pathname.endsWith('.pmtiles') || reqUrl.pathname.startsWith('/tiles/');
        if (isPmtilesEntry && reqUrl.pathname !== keepPathname) {
          return cache.delete(req);
        }
      } catch {
        // Ignora URL inválida
      }
      return Promise.resolve(false);
    }),
  );
}

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || typeof data.type !== 'string') return;

  if (data.type === 'PMTILES_CACHE_REMOVED') {
    clearPmtilesMemoryCache();
    return;
  }

  if (data.type === 'PMTILES_CACHE_UPDATED') {
    clearPmtilesMemoryCache();
    if (typeof data.url === 'string' && data.url.length > 0) {
      event.waitUntil(
        caches
          .open(TILES_CACHE_NAME)
          .then((cache) => cleanupOldPmtilesEntries(cache, data.url)),
      );
    }
  }
});

async function handleRangeOrPmtilesRequest(request) {
  const rangeHeader = request.headers.get('range');
  const cache = await caches.open(TILES_CACHE_NAME);
  const cleanUrl = request.url;
  const pathname = new URL(cleanUrl).pathname;

  const cachedFullResponse =
    (await cache.match(cleanUrl)) || (await cache.match(pathname));
  if (cachedFullResponse) {
    if (!rangeHeader) {
      return cachedFullResponse;
    }

    const memEntry = getOrLoadPmtilesBuffer(cleanUrl, cachedFullResponse);
    const fullBuffer = await memEntry.bufferPromise;
    const slicedResult = sliceArrayBufferForRange(
      fullBuffer,
      rangeHeader,
      memEntry.contentType,
    );

    return new Response(slicedResult.body, {
      status: slicedResult.status,
      headers: slicedResult.headers,
    });
  }

  try {
    const networkResponse = await fetch(request);
    // NUNCA chamar cache.put() se status !== 200 ou se havia cabeçalho Range (ex.: 206 Partial Content)
    if (canCacheResponse(networkResponse.status, Boolean(rangeHeader))) {
      await cache.put(cleanUrl, networkResponse.clone());
      clearPmtilesMemoryCache();
      await cleanupOldPmtilesEntries(cache, cleanUrl);
    }
    return networkResponse;
  } catch {
    return new Response(null, { status: 504, statusText: 'Offline tile unavailable' });
  }
}

async function lookupCachedNavigationResponse(cache, request, url) {
  const exactMatch = await cache.match(request);
  if (exactMatch) return exactMatch;

  const normalizedPath = normalizePathnameWithTrailingSlash(url.pathname);
  const slashMatch = await cache.match(normalizedPath);
  if (slashMatch) return slashMatch;

  return null;
}

function handleNavigationRequest(event, request, url) {
  const normalizedPath = normalizePathnameWithTrailingSlash(url.pathname);

  // Inicia a requisição de rede e agenda a atualização em segundo plano (stale-while-revalidate)
  const networkPromise = fetch(request).then(async (response) => {
    if (canCacheResponse(response.status, false)) {
      const cache = await getActiveShellCache();
      await cache.put(normalizedPath, response.clone());
    }
    return response;
  });

  // Garante que o Service Worker continue vivo para salvar no cache se a resposta chegar após o timeout
  event.waitUntil(networkPromise.catch(() => {}));

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('NAVIGATION_TIMEOUT'));
    }, NAVIGATION_TIMEOUT_MS);
  });

  return Promise.race([networkPromise, timeoutPromise]).catch(async () => {
    const cache = await getActiveShellCache();
    const cachedResponse = await lookupCachedNavigationResponse(cache, request, url);
    if (cachedResponse) {
      return cachedResponse;
    }

    // NUNCA devolver o HTML da Home (/) para uma rota diferente de /
    return new Response(buildOffline503Html(), {
      status: 503,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  });
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

  // Ativos estáticos imutáveis (_next/static/*, fontes .woff2, ícones, helper do SW): Cache-First
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname === '/manifest.webmanifest' ||
    url.pathname === '/sw-range-helper.js'
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

  // Documentos de navegação (HTML): rede com timeout de 3000 ms + atualização em segundo plano + fallback 503 honesto
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(handleNavigationRequest(event, request, url));
  }
});
