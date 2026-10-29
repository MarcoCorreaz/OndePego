export type MatchState = 'exato' | 'aproximado' | 'assunto' | 'desconhecido';

export interface MatchStateCandidate {
  item: { slug: string };
  exato: boolean;
  porAssunto?: boolean;
}

function normalizeSlugForMatch(rawSlug: string): string {
  return rawSlug.trim().toLowerCase().replace(/\/+$/, '');
}

/**
 * Resolve de forma determinística o estado do selo ("exato" / "assunto" / "aproximado" / "desconhecido")
 * para a página de detalhe do medicamento a partir dos resultados ativos da busca.
 *
 * - Normaliza `slug` (trim, lowercase e remoção de eventual barra `/` final) antes de comparar.
 * - Retorna `'exato'` quando `found.exato === true` (match por princípio ativo ou nome comercial).
 * - Retorna `'assunto'` quando `found.porAssunto === true` (match apenas por `termos_populares`).
 * - Retorna `'aproximado'` quando `found.exato === false` e não é match exato de assunto.
 * - Retorna `'desconhecido'` quando `results` está vazio ou o `slug` não consta na lista
 *   (ex.: link compartilhado pelo WhatsApp, acesso direto pela URL ou recarga sem busca ativa).
 */
export function resolveMatchState(
  results: readonly MatchStateCandidate[],
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

  if (found.exato) {
    return 'exato';
  }

  if (found.porAssunto) {
    return 'assunto';
  }

  return 'aproximado';
}
