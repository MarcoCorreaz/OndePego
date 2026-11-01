import Fuse from 'fuse.js';
import type { Medicamento } from '@/types/schema';
import {
  extractNumericTokens,
  normalizePTBR,
  parseMedicationQuery,
  uniqueNormalizedKeys,
} from '@/lib/normalize';

export interface ResultadoBusca {
  item: Medicamento;
  exato: boolean;
  porAssunto?: boolean;
}

export interface SearchOptions {
  limit?: number;
}

interface IndexedMedicationDoc {
  item: Medicamento;
  /** Chaves normalizadas estritamente de `principio_ativo` e `nomes_comerciais` (elegíveis a match exato) */
  exactNameKeysSet: Set<string>;
  /** Palavras normalizadas extraídas dos nomes oficiais e comerciais (com >= 3 letras) */
  exactWords: string[];
  /** Chaves normalizadas de `termos_populares` (NUNCA geram `exato: true`; geram `porAssunto: true`) */
  topicKeysSet: Set<string>;
  /** Palavras normalizadas de `termos_populares` (com >= 3 letras) para verificação estrita de assunto */
  topicWords: string[];
  /** Lista completa de chaves normalizadas para busca no Fuse.js */
  allSearchKeysList: string[];
  /** Conjunto de tokens numéricos exatos presentes nas apresentações do medicamento */
  dosageTokensSet: Set<string>;
  /** Chaves combinadas (nome + dosagem) para busca no Fuse.js quando a pessoa digita dosagem */
  combinedDosageKeys: string[];
}

export interface MedicationSearchEngine {
  search: (query: string, options?: SearchOptions) => ResultadoBusca[];
}

/**
 * Distância de edição Levenshtein clássica entre duas palavras normalizadas.
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) (dp[i] as number[])[0] = i;
  for (let j = 0; j <= n; j++) (dp[0] as number[])[j] = j;

  for (let i = 1; i <= m; i++) {
    const rowPrev = dp[i - 1] as number[];
    const rowCurr = dp[i] as number[];
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        rowCurr[j] = rowPrev[j - 1] as number;
      } else {
        rowCurr[j] = 1 + Math.min(rowPrev[j] as number, rowCurr[j - 1] as number, rowPrev[j - 1] as number);
      }
    }
  }
  return (dp[m] as number[])[n] as number;
}

function getSharedPrefixLength(a: string, b: string): number {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) {
    i++;
  }
  return i;
}

function getSharedSuffixLength(a: string, b: string): number {
  let i = 0;
  while (i < a.length && i < b.length && a[a.length - 1 - i] === b[b.length - 1 - i]) {
    i++;
  }
  return i;
}

/**
 * Filtro determinístico pós-Fuse:
 * Para um candidato aproximado ser aceito, pelo menos uma palavra da busca (com >= 3 letras)
 * deve ser prefixo de uma palavra do candidato OU ter distância de edição Levenshtein:
 * - <= 2 (para palavras de 4 a 7 letras)
 * - <= 3 (para palavras de 8 a 11 letras)
 * - <= 4 (para palavras de >= 12 letras)
 * Descartando palavras que apenas coincidem no sufixo final (como -ol em omeprazol vs propranolol
 * ou -ina em atorvastatina vs amoxicilina) se o radical inicial divergir.
 */
export function isEligibleApproximateCandidate(
  doc: IndexedMedicationDoc,
  queryWords: readonly string[],
): boolean {
  if (queryWords.length === 0) return false;

  for (const qWord of queryWords) {
    if (qWord.length < 3) continue;

    for (const candWord of doc.exactWords) {
      if (candWord === qWord) {
        return true;
      }

      // 1. Prefixo direto (mínimo 3 caracteres)
      if (candWord.startsWith(qWord) || (qWord.length >= 4 && qWord.startsWith(candWord))) {
        return true;
      }

      // 2. Distância de edição Levenshtein
      let maxDist = -1;
      if (qWord.length >= 4 && qWord.length <= 7) {
        maxDist = 2;
      } else if (qWord.length >= 8 && qWord.length <= 11) {
        maxDist = 3;
      } else if (qWord.length >= 12) {
        maxDist = 4;
      }

      if (maxDist !== -1) {
        const dist = levenshteinDistance(qWord, candWord);
        if (dist <= maxDist) {
          const sharedPrefix = getSharedPrefixLength(qWord, candWord);
          const sharedSuffix = getSharedSuffixLength(qWord, candWord);

          // Se coincidir apenas em sufixo curto (<= 3 letras, como -ol ou -ina)
          // enquanto o radical inicial divergir (sharedPrefix <= 1 em palavras longas >= 7 letras), descarta.
          if (sharedPrefix <= 1 && sharedSuffix <= 3 && Math.min(qWord.length, candWord.length) >= 7) {
            continue;
          }

          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Extrai o nome central da substância ativa do princípio ativo eliminando
 * sais e radicais usuais (ex.: "Cloridrato de Metformina" → "Metformina", "Losartana Potássica" → "Losartana").
 */
function extractCoreSubstanceName(principioAtivo: string): string {
  return principioAtivo
    .replace(
      /^(cloridrato|fosfato\s+s[oó]dico|dicloridrato|maleato|sulfato|succinato|brometo|dipropionato|besilato|acetato|valerato|enantato)\s+(?:de\s+)?/i,
      '',
    )
    .replace(/\s+(pot[aá]ssic[ao]|s[oó]dic[ao]|anidr[ao])$/i, '')
    .trim();
}

function buildIndexedDoc(item: Medicamento): IndexedMedicationDoc {
  const coreSubstance = extractCoreSubstanceName(item.principio_ativo);
  const slugClean = item.slug.replace(/-fixture$/, '').replace(/-/g, ' ');

  const exactRawNames = [
    item.principio_ativo,
    coreSubstance,
    slugClean,
    ...item.nomes_comerciais,
  ];

  const exactNameKeysSet = new Set<string>();

  for (const rawName of exactRawNames) {
    if (!rawName) continue;
    for (const key of uniqueNormalizedKeys(rawName)) {
      if (key.length > 0) {
        exactNameKeysSet.add(key);
      }
    }
  }

  const topicKeysSet = new Set<string>();
  for (const rawTopic of item.termos_populares) {
    for (const key of uniqueNormalizedKeys(rawTopic)) {
      // Regra inviolável: termos_populares NUNCA entram em exactNameKeysSet
      if (key.length > 0 && !exactNameKeysSet.has(key)) {
        topicKeysSet.add(key);
      }
    }
  }

  const exactWords = Array.from(
    new Set(
      Array.from(exactNameKeysSet)
        .flatMap((k) => k.split(/\s+/))
        .map((w) => w.trim())
        .filter((w) => w.length >= 3),
    ),
  );

  const topicWords = Array.from(
    new Set(
      Array.from(topicKeysSet)
        .flatMap((k) => k.split(/\s+/))
        .map((w) => w.trim())
        .filter((w) => w.length >= 3),
    ),
  );

  const dosageTokensSet = new Set<string>();
  for (const ap of item.apresentacoes) {
    for (const numToken of extractNumericTokens(ap.descricao_dosagem)) {
      dosageTokensSet.add(numToken);
    }
  }

  const allSearchKeysList = Array.from(new Set([...exactNameKeysSet, ...topicKeysSet]));
  const combinedDosageKeys: string[] = [];

  for (const nameKey of exactNameKeysSet) {
    for (const numToken of dosageTokensSet) {
      combinedDosageKeys.push(`${nameKey} ${numToken}`);
    }
  }

  return {
    item,
    exactNameKeysSet,
    exactWords,
    topicKeysSet,
    topicWords,
    allSearchKeysList,
    dosageTokensSet,
    combinedDosageKeys,
  };
}

/**
 * Avalia se um documento indexado corresponde de forma EXATA à consulta:
 * - Apenas `principio_ativo` e `nomes_comerciais` (e a substância química central) geram `exato: true`.
 * - `termos_populares` NUNCA entram no conjunto de match exato.
 * - Com dosagem na consulta (ex.: `"metformina 850"` ou `"metformina 850mg"`):
 *   o nome base normalizado é idêntico a `principio_ativo` ou `nomes_comerciais` E todos os
 *   tokens numéricos da consulta existem nas apresentações do item.
 */
function isExactMatch(
  doc: IndexedMedicationDoc,
  queryKeys: readonly string[],
  baseNameKeys: readonly string[],
  dosageNumbers: readonly string[],
): boolean {
  if (dosageNumbers.length === 0) {
    return queryKeys.some((qKey) => doc.exactNameKeysSet.has(qKey));
  }

  if (baseNameKeys.length === 0) {
    return false;
  }

  const baseNameMatchesExactly = baseNameKeys.some((bKey) => doc.exactNameKeysSet.has(bKey));
  if (!baseNameMatchesExactly) {
    return false;
  }

  return dosageNumbers.every((num) => doc.dosageTokensSet.has(num));
}

function isTopicMatch(
  doc: IndexedMedicationDoc,
  queryWords: readonly string[],
): boolean {
  for (const qWord of queryWords) {
    if (qWord.length < 3) continue;
    for (const tWord of doc.topicWords) {
      if (tWord === qWord || tWord.startsWith(qWord) || (qWord.length >= 4 && qWord.startsWith(tWord))) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Cria uma instância reutilizável do motor de busca sobre o catálogo de medicamentos.
 * - Exige mínimo de 2 caracteres válidos na consulta antes de listar resultados.
 * - Nunca seleciona automaticamente resultados aproximados: retorna `{ item, exato, porAssunto }`.
 */
export function createMedicationSearchEngine(
  catalogo: readonly Medicamento[],
): MedicationSearchEngine {
  const docs = catalogo.map(buildIndexedDoc);

  const fuseByName = new Fuse(docs, {
    keys: ['allSearchKeysList'],
    includeScore: true,
    threshold: 0.34,
    distance: 100,
    ignoreLocation: false,
    minMatchCharLength: 2,
  });

  const fuseWithDosage = new Fuse(docs, {
    keys: ['allSearchKeysList', 'combinedDosageKeys'],
    includeScore: true,
    threshold: 0.34,
    distance: 100,
    ignoreLocation: false,
    minMatchCharLength: 2,
  });

  function search(query: string, options?: SearchOptions): ResultadoBusca[] {
    const sanitizedRaw = typeof query === 'string' ? query.slice(0, 100) : '';
    const queryKeys = uniqueNormalizedKeys(sanitizedRaw);
    if (queryKeys.length === 0) {
      return [];
    }

    // Exige mínimo de 2 caracteres alfanuméricos válidos antes de listar resultados
    const hasMinChars = queryKeys.some((k) => k.replace(/\s+/g, '').length >= 2);
    if (!hasMinChars) {
      return [];
    }

    const parsed = parseMedicationQuery(sanitizedRaw);
    const limit = options?.limit ?? 20;

    const queryWords = Array.from(
      new Set(
        [...queryKeys, ...parsed.baseNameKeys]
          .flatMap((k) => k.split(/\s+/))
          .map((w) => w.trim())
          .filter((w) => w.length >= 3),
      ),
    );

    const candidateMap = new Map<string, { doc: IndexedMedicationDoc; bestScore: number }>();

    const registerCandidate = (doc: IndexedMedicationDoc, score: number): void => {
      const existing = candidateMap.get(doc.item.slug);
      if (!existing || score < existing.bestScore) {
        candidateMap.set(doc.item.slug, { doc, bestScore: score });
      }
    };

    for (const doc of docs) {
      const matchesExactName =
        queryKeys.some((qk) => doc.exactNameKeysSet.has(qk)) ||
        (parsed.baseNameKeys.length > 0 &&
          parsed.baseNameKeys.some((bk) => doc.exactNameKeysSet.has(bk)));

      const matchesTopic = isTopicMatch(doc, queryWords);

      if (matchesExactName) {
        registerCandidate(doc, 0);
      } else if (matchesTopic) {
        registerCandidate(doc, 0.05);
      }
    }

    // 2. Busca aproximada via Fuse.js usando a mesma função normalizePTBR
    const searchTargets =
      parsed.dosageNumbers.length > 0 && parsed.baseNameKeys.length > 0
        ? Array.from(new Set([...parsed.baseNameKeys, normalizePTBR(query)]))
        : queryKeys;

    const fuseInstance = parsed.dosageNumbers.length > 0 ? fuseWithDosage : fuseByName;

    for (const target of searchTargets) {
      if (!target || target.replace(/\s+/g, '').length < 2) continue;
      const hits = fuseInstance.search(target);
      for (const hit of hits) {
        const doc = hit.item;
        const matchesExactName =
          queryKeys.some((qk) => doc.exactNameKeysSet.has(qk)) ||
          (parsed.baseNameKeys.length > 0 &&
            parsed.baseNameKeys.some((bk) => doc.exactNameKeysSet.has(bk)));
        const matchesTopic = isTopicMatch(doc, queryWords);

        // Apenas registra o candidato aproximado se passar no filtro determinístico pós-Fuse
        if (matchesExactName || matchesTopic || isEligibleApproximateCandidate(doc, queryWords)) {
          registerCandidate(doc, hit.score ?? 1);
        }
      }
    }

    // 3. Classifica cada candidato com a regra estrita de `exato` vs `porAssunto` vs aproximado
    const evaluated = Array.from(candidateMap.values()).map(({ doc, bestScore }) => {
      const exato = isExactMatch(doc, queryKeys, parsed.baseNameKeys, parsed.dosageNumbers);
      const porAssunto = !exato && isTopicMatch(doc, queryWords);
      return {
        item: doc.item,
        exato,
        porAssunto,
        bestScore,
      };
    });

    // Supressão de ruído quando há Match Exato:
    // Se houver pelo menos 1 resultado com exato === true,
    // retorna APENAS os resultados exatos (sem misturar aproximados abaixo).
    let filteredEvaluated = evaluated;
    if (filteredEvaluated.some((e) => e.exato)) {
      filteredEvaluated = filteredEvaluated.filter((e) => e.exato);
    }

    filteredEvaluated.sort((a, b) => {
      if (a.exato !== b.exato) {
        return a.exato ? -1 : 1;
      }
      if (Boolean(a.porAssunto) !== Boolean(b.porAssunto)) {
        return a.porAssunto ? -1 : 1;
      }
      return a.bestScore - b.bestScore;
    });

    return filteredEvaluated.slice(0, limit).map(({ item, exato, porAssunto }) => ({
      item,
      exato,
      ...(porAssunto ? { porAssunto: true } : {}),
    }));
  }

  return { search };
}

/**
 * Atalho funcional para buscar diretamente em uma lista de medicamentos.
 */
export function searchMedications(
  catalogo: readonly Medicamento[],
  query: string,
  options?: SearchOptions,
): ResultadoBusca[] {
  return createMedicationSearchEngine(catalogo).search(query, options);
}
