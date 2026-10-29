import crypto from 'node:crypto';
import type { Medicamento } from '@/types/schema';

export interface PrecacheManifest {
  version: string;
  routes: string[];
  staticAssets?: string[];
}

export const FIXED_PRECACHE_ROUTES = [
  '/',
  '/buscar/',
  '/minha-receita/',
  '/unidades/',
  '/plantao/',
  '/sobre/',
] as const;

function ensureTrailingSlashRoute(route: string): string {
  const trimmed = route.trim();
  if (!trimmed || trimmed === '/') {
    return '/';
  }
  const withLeading = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`;
}

/**
 * Calcula um hash determinístico curto (primeiros 8 caracteres do SHA-256)
 * a partir dos conteúdos serializados de `data/*.json`.
 */
export function computeDataVersionHash(rawContents: readonly string[]): string {
  const hash = crypto.createHash('sha256');
  for (const content of rawContents) {
    hash.update(content, 'utf8');
    hash.update('\n---\n', 'utf8');
  }
  return hash.digest('hex').slice(0, 8);
}

/**
 * Constrói o manifesto de pré-cache contendo:
 * - `version`: hash determinístico de 8 caracteres hexadecimais;
 * - `routes`: as 5 rotas fixas (`/`, `/buscar/`, `/unidades/`, `/plantao/`, `/sobre/`)
 *   + `/medicamento/<slug>/` para cada medicamento do catálogo (`N + 5` rotas, sempre com barra final).
 */
export function buildPrecacheManifest(params: {
  medicamentos: readonly Pick<Medicamento, 'slug'>[];
  rawDataContents: readonly string[];
  staticAssets?: readonly string[];
}): PrecacheManifest {
  const version = computeDataVersionHash(params.rawDataContents);
  const seen = new Set<string>();
  const routes: string[] = [];

  for (const fixedRoute of FIXED_PRECACHE_ROUTES) {
    const normalized = ensureTrailingSlashRoute(fixedRoute);
    if (!seen.has(normalized)) {
      seen.add(normalized);
      routes.push(normalized);
    }
  }

  for (const med of params.medicamentos) {
    const cleanSlug = med.slug.trim().replace(/^\/+|\/+$/g, '');
    if (!cleanSlug) continue;
    const medRoute = ensureTrailingSlashRoute(`/medicamento/${cleanSlug}/`);
    if (!seen.has(medRoute)) {
      seen.add(medRoute);
      routes.push(medRoute);
    }
  }

  const manifest: PrecacheManifest = {
    version,
    routes,
  };

  if (params.staticAssets && params.staticAssets.length > 0) {
    manifest.staticAssets = Array.from(new Set(params.staticAssets)).sort();
  }

  return manifest;
}
