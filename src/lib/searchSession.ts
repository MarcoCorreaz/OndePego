import type { ResultadoBusca } from '@/lib/searchEngine';

export interface SearchSessionState {
  lastQuery: string;
  scrollY: number;
}

export type MatchState = 'exato' | 'aproximado' | 'desconhecido';

export const SEARCH_SESSION_STORAGE_KEY = 'onde_pego_search_session_v1';

export const DEFAULT_SEARCH_SESSION: SearchSessionState = {
  lastQuery: '',
  scrollY: 0,
};

function normalizeSlugForMatch(rawSlug: string): string {
  return rawSlug.trim().toLowerCase().replace(/\/+$/, '');
}

/**
 * Resolve de forma determinística o estado do selo ("exato" / "aproximado" / "desconhecido")
 * para a página de detalhe do medicamento a partir dos resultados ativos da busca.
 *
 * - Normaliza `slug` (trim, lowercase e remoção de eventual barra `/` final) antes de comparar.
 * - Retorna `'exato'` ou `'aproximado'` quando o `slug` consta em `results`.
 * - Retorna `'desconhecido'` quando `results` está vazio ou o `slug` não consta na lista
 *   (ex.: link compartilhado pelo WhatsApp, acesso direto pela URL ou recarga sem busca ativa).
 */
export function resolveMatchState(
  results: readonly Pick<ResultadoBusca, 'item' | 'exato'>[],
  slug: string,
): MatchState {
  const targetSlug = normalizeSlugForMatch(slug);
  if (!targetSlug || results.length === 0) {
    return 'desconhecido';
  }

  const found = results.find(
    (r) => normalizeSlugForMatch(r.item.slug) === targetSlug,
  );

  if (!found) {
    return 'desconhecido';
  }

  return found.exato ? 'exato' : 'aproximado';
}

/**
 * Interpreta de forma segura o JSON salvo no `sessionStorage` da aba.
 * Conforme ADR-09 e DAS 5.3: guarda apenas `lastQuery` e `scrollY` na sessão da aba;
 * nunca usa `localStorage` e nunca envia nada pela URL.
 */
export function parseSearchSession(raw: string | null | undefined): SearchSessionState {
  if (!raw) {
    return { ...DEFAULT_SEARCH_SESSION };
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown> | null;
    if (!parsed || typeof parsed !== 'object') {
      return { ...DEFAULT_SEARCH_SESSION };
    }

    const lastQuery = typeof parsed.lastQuery === 'string' ? parsed.lastQuery : '';
    const scrollY =
      typeof parsed.scrollY === 'number' && Number.isFinite(parsed.scrollY) && parsed.scrollY >= 0
        ? Math.round(parsed.scrollY)
        : 0;

    return { lastQuery, scrollY };
  } catch {
    return { ...DEFAULT_SEARCH_SESSION };
  }
}

export function loadSearchSession(
  storage?: Pick<Storage, 'getItem'> | null,
): SearchSessionState {
  const target =
    storage !== undefined
      ? storage
      : typeof window !== 'undefined'
        ? window.sessionStorage
        : null;

  if (!target) {
    return { ...DEFAULT_SEARCH_SESSION };
  }

  try {
    return parseSearchSession(target.getItem(SEARCH_SESSION_STORAGE_KEY));
  } catch {
    return { ...DEFAULT_SEARCH_SESSION };
  }
}

export function saveSearchSession(
  state: SearchSessionState,
  storage?: Pick<Storage, 'setItem'> | null,
): void {
  const target =
    storage !== undefined
      ? storage
      : typeof window !== 'undefined'
        ? window.sessionStorage
        : null;

  if (!target) {
    return;
  }

  try {
    const sanitized: SearchSessionState = {
      lastQuery: state.lastQuery,
      scrollY: Math.max(0, Math.round(state.scrollY)),
    };
    target.setItem(SEARCH_SESSION_STORAGE_KEY, JSON.stringify(sanitized));
  } catch {
    // Ignora falha de quota em modo restrito
  }
}

export function clearSearchSession(
  storage?: Pick<Storage, 'removeItem'> | null,
): void {
  const target =
    storage !== undefined
      ? storage
      : typeof window !== 'undefined'
        ? window.sessionStorage
        : null;

  if (!target) {
    return;
  }

  try {
    target.removeItem(SEARCH_SESSION_STORAGE_KEY);
  } catch {
    // Ignora erro
  }
}
